"use client";

import { useEffect, useState } from "react";
import {
    LiveKitRoom,
    RoomAudioRenderer,
    useParticipants,
    useLocalParticipant,
    useConnectionState,
} from "@livekit/components-react";
import { ConnectionState } from "livekit-client";

export type PeerState = "connecting" | "connected" | "failed";

export type VoiceCallProps = {
    roomId: string;
    currentUserId: string;
    members: { userId: string }[];
    enabled: boolean;
    onPeerStateChange?: (peerId: string, state: PeerState) => void;
};

// Runs inside <LiveKitRoom> context — bridges LiveKit state to the existing room-session UI
function LiveKitBridge({
    enabled,
    onPeerStateChange,
}: {
    enabled: boolean;
    onPeerStateChange?: (peerId: string, state: PeerState) => void;
}) {
    const participants = useParticipants();
    const { localParticipant } = useLocalParticipant();
    const connectionState = useConnectionState();
    // Mic toggle: enable/disable local audio track without disconnecting from the room.
    // Also call room.startAudio() to unlock browser autoplay policy (user gesture context).
    useEffect(() => {
        localParticipant.setMicrophoneEnabled(enabled).catch(() => {});
        if (enabled) localParticipant.room.startAudio().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled, localParticipant]);

    // Report connection state for each remote participant → drives the colored dots in room-session.tsx
    useEffect(() => {
        if (!onPeerStateChange) return;
        const state: PeerState =
            connectionState === ConnectionState.Connected
                ? "connected"
                : connectionState === ConnectionState.Reconnecting ||
                  connectionState === ConnectionState.Connecting
                ? "connecting"
                : "failed";
        for (const p of participants) {
            if (!p.isLocal) onPeerStateChange(p.identity, state);
        }
    }, [participants, connectionState, onPeerStateChange]);

    // RoomAudioRenderer automatically plays audio from all remote participants
    return <RoomAudioRenderer />;
}

export function VoiceCall({ roomId, enabled, onPeerStateChange }: VoiceCallProps) {
    const [token, setToken] = useState<string | null>(null);

    // Fetch token on mount so the user can hear others immediately, even before enabling mic
    useEffect(() => {
        fetch(`/api/rooms/${encodeURIComponent(roomId)}/livekit-token`)
            .then(r => (r.ok ? r.json() : Promise.reject()))
            .then(d => setToken(d.token))
            .catch(() => {});
    }, [roomId]);

    if (!token) return null;

    return (
        <LiveKitRoom
            serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
            token={token}
            audio={false}
            video={false}
            connect={true}
            options={{
                audioCaptureDefaults: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 48000,
                },
            }}
            style={{ position: "fixed", top: 0, left: 0, width: 0, height: 0, overflow: "hidden", pointerEvents: "none" }}
        >
            <LiveKitBridge enabled={enabled} onPeerStateChange={onPeerStateChange} />
        </LiveKitRoom>
    );
}
