import { EventEmitter } from "events";

// Singleton per PM2 process — survives hot reloads in dev via global
const bus: EventEmitter =
    (global as Record<string, unknown>).__signalBus as EventEmitter ??
    (() => {
        const e = new EventEmitter();
        e.setMaxListeners(500); // support many concurrent users
        (global as Record<string, unknown>).__signalBus = e;
        return e;
    })();

export type SignalPayload = {
    fromUserId: string;
    type: string;
    payload: unknown;
};

export function emitSignal(toUserId: string, signal: SignalPayload) {
    bus.emit(`signal:${toUserId}`, signal);
}

export function onSignal(toUserId: string, cb: (sig: SignalPayload) => void): () => void {
    bus.on(`signal:${toUserId}`, cb);
    return () => bus.off(`signal:${toUserId}`, cb);
}
