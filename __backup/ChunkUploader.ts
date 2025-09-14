
import axios, { AxiosProgressEvent } from 'axios';
import SparkMD5 from 'spark-md5';

export interface ChunkUploadConfig {
  chunkSize?: number; // bytes
  maxRetries?: number;
  parallelUploads?: number;
  onProgress?: (progress: UploadProgress) => void;
  onChunkComplete?: (chunkIndex: number, etag: string) => void;
  onComplete?: (uploadId: string, etags: string[]) => void;
  onError?: (error: Error) => void;
  headers?: Record<string, string>;
}

export interface UploadProgress {
  uploadedBytes: number;
  totalBytes: number;
  percentage: number;
  speed: number; // bytes/s
  remainingTime: number; // s
  currentChunk: number;
  totalChunks: number;
}

export interface ChunkInfo {
  index: number;
  start: number;
  end: number;
  blob: Blob;
  hash?: string;
  etag?: string;
  attempts: number;
}

export interface UploadSession {
  uploadId: string;
  fileId: string;
  chunks: ChunkInfo[];
  etags: string[];
}

export class ChunkUploader {
  private config: Required<ChunkUploadConfig>;
  private controllers: Map<string, AbortController> = new Map();
  private uploadSessions: Map<string, UploadSession> = new Map();
  private activeUploads: Map<string, Set<number>> = new Map();
  private startTime = 0;

  constructor(config: ChunkUploadConfig = {}) {
    this.config = {
      chunkSize: 5 * 1024 * 1024,
      maxRetries: 3,
      parallelUploads: 3,
      onProgress: () => {},
      onChunkComplete: () => {},
      onComplete: () => {},
      onError: () => {},
      headers: {},
      ...config
    };
  }

  async upload(file: File, uploadUrl: string, uploadId?: string): Promise<string> {
    try {
      this.startTime = Date.now();
      const session = await this.initializeSession(file, uploadUrl, uploadId);
      await this.uploadChunks(session, uploadUrl);
      const finalUploadId = await this.completeUpload(session, uploadUrl);
      this.cleanup(session.fileId);
      return finalUploadId;
    } catch (error) {
      this.config.onError(error as Error);
      throw error;
    }
  }

  private async initializeSession(file: File, uploadUrl: string, existingUploadId?: string): Promise<UploadSession> {
    const fileId = `${file.name}-${file.size}`; // simple deterministic id

    if (existingUploadId && this.uploadSessions.has(fileId)) {
      const existing = this.uploadSessions.get(fileId)!;
      if (existing.uploadId === existingUploadId) return existing;
    }

    const chunks = this.createChunks(file);
    const uploadId = existingUploadId || await this.initializeServerUpload(file, uploadUrl, chunks.length);

    const session: UploadSession = {
      uploadId,
      fileId,
      chunks,
      etags: new Array(chunks.length).fill('')
    };

    this.uploadSessions.set(fileId, session);
    this.activeUploads.set(fileId, new Set());
    return session;
  }

  private createChunks(file: File): ChunkInfo[] {
    const chunks: ChunkInfo[] = [];
    const size = this.config.chunkSize;
    const total = Math.ceil(file.size / size);

    for (let i = 0; i < total; i++) {
      const start = i * size;
      const end = Math.min(start + size, file.size);
      chunks.push({ index: i, start, end, blob: file.slice(start, end), attempts: 0 });
    }
    return chunks;
  }

  private async initializeServerUpload(file: File, uploadUrl: string, totalChunks: number): Promise<string> {
    const { data } = await axios.post(
      `${uploadUrl}/initialize`,
      { fileName: file.name, fileSize: file.size, mimeType: file.type, totalChunks },
      { headers: this.config.headers }
    );
    return data.uploadId as string;
  }

  private async uploadChunks(session: UploadSession, uploadUrl: string): Promise<void> {
    const { chunks, fileId } = session;
    const active = this.activeUploads.get(fileId)!;
    const pending = chunks.filter(c => !c.etag);

    const tasks: Promise<void>[] = [];

    for (const chunk of pending) {
      // throttle parallelism
      while (active.size >= this.config.parallelUploads) {
        await new Promise(r => setTimeout(r, 100));
      }
      active.add(chunk.index);
      const task = this.uploadChunk(session, chunk, uploadUrl).finally(() => active.delete(chunk.index));
      tasks.push(task);
    }

    await Promise.all(tasks);
  }

  private async uploadChunk(session: UploadSession, chunk: ChunkInfo, uploadUrl: string): Promise<void> {
    const max = this.config.maxRetries;

    while (chunk.attempts < max) {
      try {
        chunk.attempts++;

        if (!chunk.hash) {
          chunk.hash = await this.calculateChunkHash(chunk.blob);
        }

        const controller = new AbortController();
        const key = `${session.fileId}-${chunk.index}`;
        this.controllers.set(key, controller);

        const formData = new FormData();
        formData.append('chunk', chunk.blob);
        formData.append('uploadId', session.uploadId);
        formData.append('chunkIndex', String(chunk.index));
        formData.append('chunkHash', chunk.hash);

        const resp = await axios.post(
          `${uploadUrl}/chunk`,
          formData,
          {
            headers: { ...this.config.headers },
            signal: controller.signal,
            onUploadProgress: (e: AxiosProgressEvent) => this.handleChunkProgress(session, chunk, e)
          }
        );

        chunk.etag = resp.data.etag;
        session.etags[chunk.index] = chunk.etag;
        this.config.onChunkComplete(chunk.index, chunk.etag);
        this.controllers.delete(key);
        break;
      } catch (err: unknown) {
        if (err?.name === 'CanceledError' || err?.message === 'canceled' || err?.message === 'Upload paused') {
          throw new Error('Upload paused');
        }
        if (chunk.attempts >= max) {
          throw new Error(`Failed to upload chunk ${chunk.index} after ${max} attempts`);
        }
        const delay = Math.min(1000 * Math.pow(2, chunk.attempts - 1), 30000);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  private handleChunkProgress(session: UploadSession, chunk: ChunkInfo, e: AxiosProgressEvent): void {
    const loaded = e.loaded || 0;

    const totalBytes = session.chunks.reduce((sum, c) => sum + (c.end - c.start), 0);
    const completedBytes = session.chunks
      .filter(c => c.etag)
      .reduce((sum, c) => sum + (c.end - c.start), 0);

    const uploadedBytes = completedBytes + loaded;
    const elapsed = (Date.now() - this.startTime) / 1000;
    const speed = elapsed > 0 ? uploadedBytes / elapsed : 0;
    const remaining = Math.max(0, totalBytes - uploadedBytes);
    const remainingTime = speed > 0 ? remaining / speed : Infinity;

    this.config.onProgress({
      uploadedBytes,
      totalBytes,
      percentage: totalBytes > 0 ? (uploadedBytes / totalBytes) * 100 : 0,
      speed,
      remainingTime,
      currentChunk: chunk.index + 1,
      totalChunks: session.chunks.length
    });
  }

  private async completeUpload(session: UploadSession, uploadUrl: string): Promise<string> {
    const { data } = await axios.post(
      `${uploadUrl}/complete`,
      { uploadId: session.uploadId, etags: session.etags },
      { headers: this.config.headers }
    );
    this.config.onComplete(session.uploadId, session.etags);
    return data.uploadId as string;
  }

  private async calculateChunkHash(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      const spark = new SparkMD5.ArrayBuffer();
      reader.onload = e => {
        spark.append((e.target as FileReader).result as ArrayBuffer);
        resolve(spark.end());
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(blob);
    });
  }

  pause(fileId: string): void {
    const active = this.activeUploads.get(fileId);
    if (!active) return;
    active.forEach(idx => {
      const key = `${fileId}-${idx}`;
      const c = this.controllers.get(key);
      if (c) c.abort();
    });
  }

  async resume(file: File, uploadUrl: string, uploadId: string): Promise<string> {
    return this.upload(file, uploadUrl, uploadId);
  }

  cancel(fileId: string): void {
    this.pause(fileId);
    this.cleanup(fileId);
  }

  private cleanup(fileId: string): void {
    this.uploadSessions.delete(fileId);
    this.activeUploads.delete(fileId);
    // Abort any lingering controllers
    Array.from(this.controllers.keys())
      .filter(k => k.startsWith(fileId))
      .forEach(k => {
        const c = this.controllers.get(k);
        if (c) c.abort();
        this.controllers.delete(k);
      });
  }

  getSession(fileId: string): UploadSession | undefined { return this.uploadSessions.get(fileId); }
  isUploading(fileId: string): boolean {
    const active = this.activeUploads.get(fileId);
    return active ? active.size > 0 : false;
  }
}
