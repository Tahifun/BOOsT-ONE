
import SparkMD5 from 'spark-md5';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
  metadata?: FileMetadata;
}

export interface FileMetadata {
  hash?: string;
  mimeType: string;
  extension: string;
  dimensions?: { width: number; height: number };
  duration?: number;
  bitrate?: number;
  codec?: string;
}

export interface ValidatorConfig {
  acceptedTypes?: string[];
  maxSize?: number;
  minSize?: number;
  checkDuplicates?: boolean;
  existingHashes?: Set<string>;
  validateContent?: boolean;
}

export class FileValidator {
  private config: ValidatorConfig;
  private mimeTypeMap: Map<string, string[]>;

  constructor(config: ValidatorConfig = {}) {
    this.config = {
      acceptedTypes: ['video/*', 'image/*', 'audio/*'],
      maxSize: 250 * 1024 * 1024, // 250MB
      minSize: 1, // 1 byte
      checkDuplicates: true,
      existingHashes: new Set(),
      validateContent: true,
      ...config
    };

    this.mimeTypeMap = new Map([
      ['video/*', [
        'video/mp4','video/quicktime','video/x-msvideo','video/x-matroska',
        'video/webm','video/ogg','video/mpeg','video/3gpp','video/3gpp2'
      ]],
      ['image/*', [
        'image/jpeg','image/png','image/gif','image/webp','image/svg+xml',
        'image/bmp','image/tiff','image/x-icon'
      ]],
      ['audio/*', [
        'audio/mpeg','audio/wav','audio/ogg','audio/webm','audio/aac',
        'audio/flac','audio/x-m4a','audio/opus'
      ]]
    ]);
  }

  async validateFile(file: File): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let metadata: FileMetadata = { mimeType: (file.type || '').toLowerCase(), extension: this.getFileExtension(file.name) };

    if (typeof this.config.maxSize === 'number' && file.size > this.config.maxSize) {
      errors.push(`Datei ist zu groß. Maximum: ${this.formatFileSize(this.config.maxSize)}`);
    }
    if (typeof this.config.minSize === 'number' && file.size < this.config.minSize) {
      errors.push('Datei ist leer oder beschädigt');
    }

    if (!this.isAcceptedType(file)) {
      errors.push(`Dateityp "${file.type || 'unbekannt'}" wird nicht unterstützt`);
    }

    if (this.config.validateContent && errors.length === 0) {
      try {
        const contentValidation = await this.validateContent(file);
        metadata = { ...metadata, ...(contentValidation.metadata || {}) };
        if (!contentValidation.valid) errors.push(...contentValidation.errors);
        if (contentValidation.warnings) warnings.push(...contentValidation.warnings);
      } catch {
        warnings.push('Inhaltsprüfung konnte nicht durchgeführt werden');
      }
    }

    if (this.config.checkDuplicates && errors.length === 0) {
      try {
        const hash = await this.calculateFileHash(file);
        metadata.hash = hash;
        if (this.config.existingHashes?.has(hash)) {
          errors.push('Diese Datei wurde bereits hochgeladen');
        }
      } catch {
        warnings.push('Duplikatsprüfung konnte nicht durchgeführt werden');
      }
    }

    return { valid: errors.length === 0, errors, warnings: warnings.length ? warnings : undefined, metadata };
  }

  private isAcceptedType(file: File): boolean {
    const accepted = this.config.acceptedTypes;
    if (!accepted || accepted.length === 0) return true;

    const fileType = (file.type || '').toLowerCase();
    const extension = this.getFileExtension(file.name).toLowerCase();

    for (const a of accepted) {
      if (a.endsWith('/*')) {
        const mimes = this.mimeTypeMap.get(a);
        if (mimes && mimes.includes(fileType)) return true;
      } else if (a.startsWith('.')) {
        if (a.slice(1).toLowerCase() === extension) return true;
      } else if (a.toLowerCase() === fileType) {
        return true;
      }
    }
    return false;
  }

  private async validateContent(file: File): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const metadata: FileMetadata = { mimeType: (file.type || '').toLowerCase(), extension: this.getFileExtension(file.name) };

    if (file.type.startsWith('image/')) {
      const r = await this.validateImage(file);
      Object.assign(metadata, r.metadata);
      errors.push(...r.errors);
      if (r.warnings) warnings.push(...r.warnings);
    } else if (file.type.startsWith('video/')) {
      const r = await this.validateVideo(file);
      Object.assign(metadata, r.metadata);
      errors.push(...r.errors);
      if (r.warnings) warnings.push(...r.warnings);
    } else if (file.type.startsWith('audio/')) {
      const r = await this.validateAudio(file);
      Object.assign(metadata, r.metadata);
      errors.push(...r.errors);
      if (r.warnings) warnings.push(...r.warnings);
    }

    return { valid: errors.length === 0, errors, warnings: warnings.length ? warnings : undefined, metadata };
  }

  private validateImage(file: File): Promise<ValidationResult> {
    return new Promise((resolve) => {
      const errors: string[] = [];
      const warnings: string[] = [];
      const metadata: Partial<FileMetadata> = {};

      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        metadata.dimensions = { width: img.naturalWidth, height: img.naturalHeight };
        if (img.naturalWidth > 10000 || img.naturalHeight > 10000) warnings.push('Bild ist sehr groß und könnte die Performance beeinträchtigen');
        if (img.naturalWidth < 10 || img.naturalHeight < 10) errors.push('Bild ist zu klein');
        URL.revokeObjectURL(url);
        resolve({ valid: errors.length === 0, errors, warnings: warnings.length ? warnings : undefined, metadata: metadata as FileMetadata });
      };
      img.onerror = () => {
        errors.push('Bilddatei ist beschädigt oder ungültig');
        URL.revokeObjectURL(url);
        resolve({ valid: false, errors, metadata: metadata as FileMetadata });
      };
      img.src = url;
    });
  }

  private validateVideo(file: File): Promise<ValidationResult> {
    return new Promise((resolve) => {
      const errors: string[] = [];
      const warnings: string[] = [];
      const metadata: Partial<FileMetadata> = {};

      const video = document.createElement('video');
      const url = URL.createObjectURL(file);
      video.preload = 'metadata';
      (video as any).playsInline = true;
      (video as any).muted = true;

      video.onloadedmetadata = () => {
        metadata.dimensions = { width: video.videoWidth, height: video.videoHeight };
        metadata.duration = video.duration;

        if (video.duration > 3600) warnings.push('Video ist länger als 1 Stunde');
        if (video.duration < 0.1) errors.push('Video ist zu kurz');

        if (video.videoWidth > 4096 || video.videoHeight > 4096) warnings.push('Video-Auflösung ist sehr hoch (4K+)');
        if (video.videoWidth < 100 || video.videoHeight < 100) errors.push('Video-Auflösung ist zu niedrig');

        URL.revokeObjectURL(url);
        resolve({ valid: errors.length === 0, errors, warnings: warnings.length ? warnings : undefined, metadata: metadata as FileMetadata });
      };
      video.onerror = () => {
        errors.push('Videodatei ist beschädigt oder verwendet einen nicht unterstützten Codec');
        URL.revokeObjectURL(url);
        resolve({ valid: false, errors, metadata: metadata as FileMetadata });
      };
      video.src = url;
      video.load();
    });
  }

  private validateAudio(file: File): Promise<ValidationResult> {
    return new Promise((resolve) => {
      const errors: string[] = [];
      const warnings: string[] = [];
      const metadata: Partial<FileMetadata> = {};

      const audio = new Audio();
      const url = URL.createObjectURL(file);

      audio.onloadedmetadata = () => {
        metadata.duration = audio.duration;
        if (audio.duration > 600) warnings.push('Audio ist länger als 10 Minuten');
        if (audio.duration < 0.1) errors.push('Audio ist zu kurz');
        URL.revokeObjectURL(url);
        resolve({ valid: errors.length === 0, errors, warnings: warnings.length ? warnings : undefined, metadata: metadata as FileMetadata });
      };
      audio.onerror = () => {
        errors.push('Audiodatei ist beschädigt oder verwendet einen nicht unterstützten Codec');
        URL.revokeObjectURL(url);
        resolve({ valid: false, errors, metadata: metadata as FileMetadata });
      };

      audio.src = url;
      audio.load();
    });
  }

  private calculateFileHash(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const chunkSize = 2 * 1024 * 1024; // 2MB
      const spark = new SparkMD5.ArrayBuffer();
      const fileReader = new FileReader();
      let currentChunk = 0;
      const chunks = Math.ceil(file.size / chunkSize);

      fileReader.onload = (e) => {
        spark.append((e.target as FileReader).result as ArrayBuffer);
        currentChunk++;
        if (currentChunk < chunks) {
          loadNext();
        } else {
          resolve(spark.end());
        }
      };
      fileReader.onerror = () => reject(new Error('Hash calculation failed'));
      const loadNext = () => {
        const start = currentChunk * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        fileReader.readAsArrayBuffer(file.slice(start, end));
      };
      loadNext();
    });
  }

  private getFileExtension(filename: string): string {
    const idx = filename.lastIndexOf('.');
    return idx >= 0 ? filename.slice(idx + 1) : '';
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  updateConfig(config: Partial<ValidatorConfig>): void { this.config = { ...this.config, ...config }; }
  addExistingHash(hash: string): void { this.config.existingHashes?.add(hash); }
  clearExistingHashes(): void { this.config.existingHashes?.clear(); }
}
