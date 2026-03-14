"use client";

import { useEffect, useRef, useCallback } from "react";

const STUN_CONFIG: RTCConfiguration = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        // TURN relay — handles symmetric NAT (mobile networks, corporate firewalls)
        {
            urls: [
                "turn:72.61.162.106:3478?transport=udp",
                "turn:72.61.162.106:3478?transport=tcp",
            ],
            username: "milaknight",
            credential: "mk_turn_2024",
        },
    ],
    iceCandidatePoolSize: 10,
};
const POLL_MS = 700;

export type VoiceCallProps = {
    roomId: string;
    currentUserId: string;
    members: { userId: string }[];
    enabled: boolean;
};

export function VoiceCall({ roomId, currentUserId, members, enabled }: VoiceCallProps) {
    const peersRef      = useRef<Map<string, RTCPeerConnection>>(new Map());
    const streamRef     = useRef<MediaStream | null>(null);
    const pollRef       = useRef<ReturnType<typeof setInterval> | null>(null);
    const enabledRef    = useRef(enabled);
    const iceBuf        = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
    const offeringRef   = useRef<Set<string>>(new Set()); // guard against double-offers
    const streamReady   = useRef(false);
    const encodedRoom   = encodeURIComponent(roomId);
    const membersRef    = useRef(members);
    membersRef.current  = members;
    enabledRef.current  = enabled;

    // Mute / unmute track live, and acquire mic if needed when first enabled
    useEffect(() => {
        if (!enabled) {
            streamRef.current?.getAudioTracks().forEach(t => { t.enabled = false; });
            return;
        }

        if (streamRef.current) {
            // Already have stream — just unmute
            streamRef.current.getAudioTracks().forEach(t => { t.enabled = true; });
            return;
        }

        // enabled=true but streamRef is null (getUserMedia failed/dismissed on mount).
        // The user just clicked the mic button so permission should be granted now.
        navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, sampleRate: 48000 },
            video: false,
        }).then(stream => {
            if (!enabledRef.current) { stream.getTracks().forEach(t => t.stop()); return; }
            streamRef.current = stream;
            if (!streamReady.current) return;
            // Reconnect all peers so they pick up the new local track
            peersRef.current.forEach((_, id) => destroyPeer(id));
            iceBuf.current.clear();
            offeringRef.current.clear();
            connectToMembers(membersRef.current);
        }).catch(() => { /* permission still denied */ });
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            el.muted = false;
            el.volume = 1.0;
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
        offeringRef.current.delete(remoteId);
    }, []);

    const flushIce = async (remoteId: string, pc: RTCPeerConnection) => {
        const queued = iceBuf.current.get(remoteId) ?? [];
        iceBuf.current.delete(remoteId);
        for (const c of queued) {
            await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
        }
    };

    const createPeer = useCallback((remoteId: string): RTCPeerConnection => {
        // Always destroy stale peer first
        const existing = peersRef.current.get(remoteId);
        if (existing) { existing.close(); }
        iceBuf.current.delete(remoteId);
        offeringRef.current.delete(remoteId);

        const pc = new RTCPeerConnection(STUN_CONFIG);
        peersRef.current.set(remoteId, pc);

        // Add local tracks if stream is available
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
            const state = pc.connectionState;
            if (state === "failed" || state === "disconnected") {
                // Only the offerer side retries to avoid glare
                if (currentUserId > remoteId) {
                    destroyPeer(remoteId);
                    setTimeout(() => {
                        if (membersRef.current.some(m => m.userId === remoteId)) {
                            initiateOffer(remoteId);
                        }
                    }, 2500);
                } else {
                    destroyPeer(remoteId);
                }
            }
        };

        return pc;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sendSig, destroyPeer, currentUserId]);

    // Only the peer with the higher userId lexicographically sends the offer.
    // This eliminates "glare" — the race condition where both peers offer simultaneously.
    const initiateOffer = useCallback(async (remoteId: string) => {
        if (offeringRef.current.has(remoteId)) return; // already in progress
        offeringRef.current.add(remoteId);
        try {
            const pc = createPeer(remoteId);
            const offer = await pc.createOffer({ offerToReceiveAudio: true });
            await pc.setLocalDescription(offer);
            await sendSig(remoteId, "offer", offer);
        } catch {}
        offeringRef.current.delete(remoteId);
    }, [createPeer, sendSig]);

    const processSig = useCallback(async (sig: { fromUserId: string; type: string; payload: any }) => {
        const { fromUserId, type, payload } = sig;

        if (type === "offer") {
            // We received an offer → create a fresh peer, answer
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
            if (!pc) return;
            if (pc.remoteDescription) {
                await pc.addIceCandidate(new RTCIceCandidate(payload)).catch(() => {});
            } else {
                const q = iceBuf.current.get(fromUserId) ?? [];
                q.push(payload);
                iceBuf.current.set(fromUserId, q);
            }
        }
    }, [createPeer, sendSig]);

    // Connect to all room members where we're the "caller" (higher userId)
    const connectToMembers = useCallback((mems: { userId: string }[]) => {
        for (const m of mems) {
            if (m.userId === currentUserId) continue;
            if (peersRef.current.has(m.userId)) continue;
            // Only the higher-ID side initiates — avoids glare completely
            if (currentUserId > m.userId) {
                initiateOffer(m.userId);
            }
            // The lower-ID peer waits to receive an offer
        }
    }, [currentUserId, initiateOffer]);

    // Mount / room change
    useEffect(() => {
        let alive = true;

        async function init() {
            // Acquire mic first, then connect
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                        sampleRate: 48000,
                    },
                    video: false,
                });
                if (!alive) { stream.getTracks().forEach(t => t.stop()); return; }
                stream.getAudioTracks().forEach(t => { t.enabled = enabledRef.current; });
                streamRef.current = stream;
            } catch {
                // Mic unavailable — we can still receive audio from others
            }

            if (!alive) return;
            streamReady.current = true;

            // Connect to current members
            connectToMembers(membersRef.current);

            // Poll for WebRTC signals
            pollRef.current = setInterval(async () => {
                if (!alive) return;
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
            streamReady.current = false;
            if (pollRef.current) clearInterval(pollRef.current);
            peersRef.current.forEach(pc => pc.close());
            peersRef.current.clear();
            iceBuf.current.clear();
            offeringRef.current.clear();
            document.querySelectorAll("audio[data-voicepeer]").forEach(el => el.remove());
            streamRef.current?.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomId]);

    // React to member list changes
    useEffect(() => {
        // Remove peers for members who left
        const live = new Set(members.filter(m => m.userId !== currentUserId).map(m => m.userId));
        peersRef.current.forEach((_, id) => { if (!live.has(id)) destroyPeer(id); });

        // Connect to newly arrived members (only after stream is ready)
        if (streamReady.current) {
            connectToMembers(members);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [members]);

    return null;
}
