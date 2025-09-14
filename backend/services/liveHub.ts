// services/liveHub.ts
export type LiveEventType = "status" | "chat" | "gift" | "like" | "metrics";
export type StreamStatus = { live?: boolean; [k: string]: unknown };

type Channel = {
  status: StreamStatus | null;
};

class LiveHub {
  private channels = new Map<string, Channel>();

  private getOrCreate(creatorId: string): Channel {
    let c = this.channels.get(creatorId);
    if (!c) {
      c = { status: null };
      this.channels.set(creatorId, c);
    }
    return c;
  }

  publish(creatorId: string, type: LiveEventType, data: unknown) {
    const c = this.getOrCreate(creatorId);
    if (type === "status") {
      c.status = data as StreamStatus;
    }
    // weitere Typen könnten hier verarbeitet werden
  }

  snapshot(creatorId: string) {
    const c = this.getOrCreate(creatorId);
    return {
      live: Boolean((c.status as any)?.live),
      status: c.status,
    };
  }
}

const liveHub = new LiveHub();
export default liveHub;
