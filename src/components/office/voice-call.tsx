"use client";

import { useEffect, useRef, useCallback } from "react";

const STUN = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }] };
const POLL_MS = 700;

export type VoiceCallProps = {
    roomId: string;
    currentUserId: string;
    members: { userId: string }[];
    enabled: boolean;
};

export function VoiceCall({ roomId, currentUserId, members, enabled }: VoiceCallProps) {
    const peersRef   = useRef<Map<string, RTCPeerConnection>>(new Map());
    const streamRef  = useRef<MediaStream | null>(null);
    const pollRef    = useRef<ReturnType<typeof setInterval> | null>(null);
    const enabledRef = useRef(enabled);
    const iceBuf     = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
    const encodedRoom = encodeURIComponent(roomId);
    const membersRef = useRef(members);
    membersRef.current = members;

    enabledRef.current = enabled;

    useEffect(() => {
        streamRef.current?.getAudioTracks().forEach(t => { t.enabled = enabled; });
    }, [enabled]);

    const sendSig = useCallback(async (toUserId: string, type: string, payload: unknown) => {
        await fetch(`/api/rooms/${encodedRoom}/signals`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ toUserId, type, payload }),
        }).catch(() => {});
    }, [encodedRoom]);

    const getAudioEl = (peerId: string): HTMLAudioElement => {
        let el = document.querySelector<HTMLAudioElement>(`audio[data-voicepeer="${peerId}"]`);
        if (!el) {
            el = document.createElement("audio");
            el.setAttribute("data-voicepeer", peerId);
            el.autoplay = true;
            (el as any).playsInline = true;
            el.style.cssText = "position:fixed;width:0;height:0;opacity:0;pointer-events:none";
            document.body.appendChild(el);
        }
        return el;
    };

    const destroyPeer = useCallback((remoteId: string) => {
        const pc = peersRef.current.get(remoteId);
        if (pc) { pc.close(); peersRef.current.delete(remoteId); }
        document.querySelector(`audio[data-voicepeer="${remoteId}"]`)?.remove();
        iceBuf.current.delete(remoteId);
    }, []);

    const flushIce = async (remoteId: string, pc: RTCPeerConnection) => {
        const queued = iceBuf.current.get(remoteId) ?? [];
        iceBuf.current.delete(remoteId);
        for (const c of queued) {
            await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
        }
    };

    const createPeer = useCallback((remoteId: string): RTCPeerConnection => {
        const existing = peersRef.current.get(remoteId);
        if (existing) { existing.close(); peersRef.current.delete(remoteId); }

        const pc = new RTCPeerConnection(STUN);
        peersRef.current.set(remoteId, pc);

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => pc.addTrack(t, streamRef.current!));
        }

        pc.onicecandidate = (e) => {
            if (e.candidate) sendSig(remoteId, "ice-candidate", e.candidate.toJSON());
        };

        pc.ontrack = (e) => {
            const stream = e.streams?.[0] ?? new MediaStream([e.track]);
            const audio = getAudioEl(remoteId);
            audio.srcObject = stream;
            audio.play().catch(() => {});
        };

        pc.onconnectionstatechange = () => {
            if (pc.connectionState === "failed") {
                destroyPeer(remoteId);
            }
        };

        return pc;
    }, [sendSig, destroyPeer]);

    const processSig = useCallback(async (sig: { fromUserId: string; type: string; payload: any }) => {
        const { fromUserId, type, payload } = sig;

        if (type === "offer") {
            const pc = createPeer(fromUserId);
            await pc.setRemoteDescription(new RTCSessionDescription(payload));
            await flushIce(fromUserId, pc);
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            await sendSig(fromUserId, "answer", answer);

        } else if (type === "answer") {
            const pc = peersRef.current.get(fromUserId);
            if (pc && pc.signalingState === "have-local-offer") {
                await pc.setRemoteDescription(new RTCSessionDescription(payload));
                await flushIce(fromUserId, pc);
            }

        } else if (type === "ice-candidate") {
            const pc = peersRef.current.get(fromUserId);
            if (pc?.remoteDescription) {
                await pc.addIceCandidate(new RTCIceCandidate(payload)).catch(() => {});
            } else {
                const q = iceBuf.current.get(fromUserId) ?? [];
                q.push(payload);
                iceBuf.current.set(fromUserId, q);
            }
        }
    }, [createPeer, sendSig]);

    const offerToNewPeers = useCallback(async (mems: { userId: string }[]) => {
        for (const m of mems) {
            if (m.userId === currentUserId) continue;
            if (peersRef.current.has(m.userId)) continue;
            const pc = createPeer(m.userId);
            const offer = await pc.createOffer({ offerToReceiveAudio: true });
            await pc.setLocalDescription(offer);
            await sendSig(m.userId, "offer", offer);
        }
    }, [currentUserId, createPeer, sendSig]);

    useEffect(() => {
        let alive = true;

        async function init() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
                    video: false,
                });
                if (!alive) { stream.getTracks().forEach(t => t.stop()); return; }
                stream.getAudioTracks().forEach(t => { t.enabled = enabledRef.current; });
                streamRef.current = stream;
            } catch {}

            await offerToNewPeers(membersRef.current);

            pollRef.current = setInterval(async () => {
                try {
                    const res = await fetch(`/api/rooms/${encodedRoom}/signals`);
                    if (!res.ok) return;
                    const sigs = await res.json();
                    for (const sig of sigs) await processSig(sig);
                } catch {}
            }, POLL_MS);
        }

        init();

        return () => {
            alive = false;
            if (pollRef.current) clearInterval(pollRef.current);
            peersRef.current.forEach((_, id) => {
                peersRef.current.get(id)?.close();
                document.querySelector(`audio[data-voicepeer="${id}"]`)?.remove();
            });
            peersRef.current.clear();
            iceBuf.current.clear();
            streamRef.current?.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomId]);

    useEffect(() => {
        const live = new Set(members.filter(m => m.userId !== currentUserId).map(m => m.userId));
        peersRef.current.forEach((_, id) => { if (!live.has(id)) destroyPeer(id); });
        offerToNewPeers(members);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [members]);

    return null;
}
