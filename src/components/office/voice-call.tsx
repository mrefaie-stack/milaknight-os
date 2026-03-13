"use client";

import { useEffect, useRef, useCallback } from "react";

const STUN_SERVERS = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };
const SIGNAL_POLL_MS = 600;

export type VoiceCallProps = {
    roomId: string;
    currentUserId: string;
    members: { userId: string }[];
    enabled: boolean; // mic on/off
    onSpeaking?: (userId: string, speaking: boolean) => void;
};

export function VoiceCall({ roomId, currentUserId, members, enabled, onSpeaking }: VoiceCallProps) {
    const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
    const streamRef = useRef<MediaStream | null>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const enabledRef = useRef(enabled);
    const encodeRef = useRef(encodeURIComponent(roomId));

    enabledRef.current = enabled;

    // ── Helpers ────────────────────────────────────────────────────────────────

    const sendSignal = useCallback(async (toUserId: string, type: string, payload: unknown) => {
        await fetch(`/api/rooms/${encodeRef.current}/signals`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ toUserId, type, payload }),
        });
    }, []);

    const getOrCreatePeer = useCallback((remoteId: string): RTCPeerConnection => {
        if (peersRef.current.has(remoteId)) return peersRef.current.get(remoteId)!;

        const pc = new RTCPeerConnection(STUN_SERVERS);
        peersRef.current.set(remoteId, pc);

        // Add local tracks
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => pc.addTrack(t, streamRef.current!));
        }

        // ICE candidates → DB
        pc.onicecandidate = (e) => {
            if (e.candidate) {
                sendSignal(remoteId, "ice-candidate", e.candidate.toJSON());
            }
        };

        // Remote audio
        pc.ontrack = (e) => {
            const audio = document.createElement("audio");
            audio.autoplay = true;
            audio.srcObject = e.streams[0];
            audio.setAttribute("data-peer", remoteId);
            document.body.appendChild(audio);
        };

        return pc;
    }, [sendSignal]);

    const destroyPeer = useCallback((remoteId: string) => {
        const pc = peersRef.current.get(remoteId);
        if (pc) {
            pc.close();
            peersRef.current.delete(remoteId);
        }
        // Remove audio el
        document.querySelectorAll(`audio[data-peer="${remoteId}"]`).forEach(el => el.remove());
    }, []);

    const destroyAll = useCallback(() => {
        peersRef.current.forEach((_, id) => destroyPeer(id));
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
    }, [destroyPeer]);

    // ── Signal poll ────────────────────────────────────────────────────────────

    const processSig = useCallback(async (sig: {
        fromUserId: string;
        type: string;
        payload: RTCSessionDescriptionInit | RTCIceCandidateInit;
    }) => {
        const { fromUserId, type, payload } = sig;

        if (type === "offer") {
            const pc = getOrCreatePeer(fromUserId);
            await pc.setRemoteDescription(new RTCSessionDescription(payload as RTCSessionDescriptionInit));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            await sendSignal(fromUserId, "answer", answer);

        } else if (type === "answer") {
            const pc = peersRef.current.get(fromUserId);
            if (pc && pc.signalingState !== "stable") {
                await pc.setRemoteDescription(new RTCSessionDescription(payload as RTCSessionDescriptionInit));
            }

        } else if (type === "ice-candidate") {
            const pc = peersRef.current.get(fromUserId);
            if (pc) {
                try { await pc.addIceCandidate(new RTCIceCandidate(payload as RTCIceCandidateInit)); } catch { /* ignore */ }
            }
        }
    }, [getOrCreatePeer, sendSignal]);

    const poll = useCallback(async () => {
        try {
            const res = await fetch(`/api/rooms/${encodeRef.current}/signals`);
            if (!res.ok) return;
            const sigs = await res.json();
            for (const sig of sigs) await processSig(sig);
        } catch { /* network error */ }
    }, [processSig]);

    // ── Initiate offers to existing members ────────────────────────────────────

    const initiateOffers = useCallback(async () => {
        for (const m of members) {
            if (m.userId === currentUserId) continue;
            if (peersRef.current.has(m.userId)) continue;

            const pc = getOrCreatePeer(m.userId);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            await sendSignal(m.userId, "offer", offer);
        }
    }, [members, currentUserId, getOrCreatePeer, sendSignal]);

    // ── Mute/unmute ────────────────────────────────────────────────────────────

    useEffect(() => {
        if (streamRef.current) {
            streamRef.current.getAudioTracks().forEach(t => { t.enabled = enabled; });
        }
    }, [enabled]);

    // ── Mount / unmount ────────────────────────────────────────────────────────

    useEffect(() => {
        let mounted = true;

        async function start() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
                if (!mounted) { stream.getTracks().forEach(t => t.stop()); return; }
                stream.getAudioTracks().forEach(t => { t.enabled = enabledRef.current; });
                streamRef.current = stream;
            } catch {
                // Mic permission denied — voice calls won't work but no crash
            }

            await initiateOffers();

            pollRef.current = setInterval(poll, SIGNAL_POLL_MS);
        }

        start();

        return () => {
            mounted = false;
            if (pollRef.current) clearInterval(pollRef.current);
            destroyAll();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomId]);

    // When member list changes (someone joins/leaves), re-evaluate peers
    useEffect(() => {
        const currentIds = new Set(members.filter(m => m.userId !== currentUserId).map(m => m.userId));

        // Remove stale peers
        peersRef.current.forEach((_, id) => {
            if (!currentIds.has(id)) destroyPeer(id);
        });

        // Offer to new members
        initiateOffers();
    }, [members, currentUserId, destroyPeer, initiateOffers]);

    return null; // headless
}
