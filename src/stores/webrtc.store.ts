import type {
    ConnectionState,
    ParticipantInfo,
    ParticipantJoinedData, ParticipantLeftData, RoomUpdateData,
    SessionEndedData,
    UserRole, WebRTCClientConfig
} from "@/types/webrtc.types.ts";
import {WebRTCClientService} from "@/services/webrtc-client.service.ts";
import {runInAction} from "mobx";

export class WebRTCStore {
    connectionStatus: ConnectionState = 'disconnected';
    isConnected: boolean = false;
    error: string | null = null;
    roomId: string | null = null;
    role: UserRole | null = null;
    isVideoEnabled: boolean = true;
    isAudioEnabled: boolean = true;
    localStream: MediaStream | null = null;
    remoteStreams: Map<string, MediaStream> = new Map();
    participants: Map<string, ParticipantInfo> = new Map();
    participantCount: number = 0;
    inputRoomId: string | undefined = "";
    isInSession: boolean = false;

    private webRtcClient: WebRTCClientService;

    constructor() {
        // Initialize WebRTC client with proper config
        const config: WebRTCClientConfig = {
            signalingServerUrl: import.meta.env.VITE_SIGNALING_SERVER_URL || 'http://localhost:3000',
        };

        this.webRtcClient = new WebRTCClientService(config, {
            onRemoteStream: this.handleRemoteStream.bind(this),
            onParticipantJoined: this.handleParticipantJoined.bind(this),
            onParticipantLeft: this.handleParticipantLeft.bind(this),
            onSessionEnded: this.handleSessionEnded.bind(this),
            onConnectionStateChange: this.handleConnectionStateChange.bind(this),
            onRoomUpdate: this.handleRoomUpdate.bind(this),
            onError: this.handleError.bind(this),
        });
    }

    // Computed values
    get statusColor(): string {
        switch (this.connectionStatus) {
            case 'connected': return 'text-green-500';
            case 'waiting': return 'text-yellow-500';
            case 'starting':
            case 'joining': return 'text-blue-500';
            case 'error': return 'text-red-500';
            default: return 'text-gray-500';
        }
    }

    get statusText(): string {
        switch (this.connectionStatus) {
            case 'connected': return 'Connected';
            case 'waiting': return 'Waiting for participants';
            case 'starting': return 'Starting session...';
            case 'joining': return 'Joining session...';
            case 'error': return 'Connection error';
            default: return 'Disconnected';
        }
    }

    get canStartSession(): boolean {
        return this.isConnected && this.connectionStatus !== 'starting';
    }

    get canJoinSession(): boolean {
        if (!this.inputRoomId?.trim()) {
            return false;
        }

        return this.isConnected && this.inputRoomId?.trim()?.length > 0 && this.connectionStatus !== 'joining';
    }

    get remoteStreamArray(): Array<{ participantId: string; stream: MediaStream }> {
        return Array.from(this.remoteStreams.entries()).map(([participantId, stream]) => ({
            participantId,
            stream,
        }));
    }

    // Actions
    async initialize(): Promise<void> {
        try {
            runInAction(() => {
                this.connectionStatus = 'connecting';
                this.error = null;
            });

            await this.webRtcClient.connect();

            runInAction(() => {
                this.isConnected = true;
                this.connectionStatus = 'connected';
            });
        } catch (error) {
            runInAction(() => {
                this.connectionStatus = 'error';
                this.error = error instanceof Error ? error.message : 'Connection failed';
            });
            throw error;
        }
    }

    async startSession(): Promise<void> {
        try {
            runInAction(() => {
                this.connectionStatus = 'starting';
                this.error = null;
            });

            // Get user media
            const stream = await this.webRtcClient.getUserMedia({
                video: this.isVideoEnabled,
                audio: this.isAudioEnabled,
            });

            // Create room
            const response = await this.webRtcClient.createRoom();

            runInAction(() => {
                this.localStream = stream;
                this.roomId = response.roomId!;
                this.role = response.role!;
                this.isInSession = true;
                this.connectionStatus = 'waiting';
            });
        } catch (error) {
            runInAction(() => {
                this.connectionStatus = 'error';
                this.error = error instanceof Error ? error.message : 'Failed to start session';
            });
            throw error;
        }
    }

    async joinSession(): Promise<void> {
        if (!this.inputRoomId?.trim()) {
            throw new Error('Please enter a Room ID');
        }

        try {
            runInAction(() => {
                this.connectionStatus = 'joining';
                this.error = null;
            });

            // Get user media
            const stream = await this.webRtcClient.getUserMedia({
                video: this.isVideoEnabled,
                audio: this.isAudioEnabled,
            });

            // Join room
            const response = await this.webRtcClient.joinRoom(this.inputRoomId.toUpperCase());

            runInAction(() => {
                this.localStream = stream;
                this.roomId = response.roomId!;
                this.role = response.role!;
                this.isInSession = true;
                this.participantCount = response.participantCount || 1;
                this.connectionStatus = 'connected';
            });
        } catch (error) {
            runInAction(() => {
                this.connectionStatus = 'error';
                this.error = error instanceof Error ? error.message : 'Failed to join session';
            });
            throw error;
        }
    }

    endSession(): void {
        this.webRtcClient.endSession();
        this.resetSessionState();
    }

    leaveSession(): void {
        this.webRtcClient.leaveRoom();
        this.resetSessionState();
    }

    toggleVideo(): void {
        const enabled = this.webRtcClient.toggleVideo();
        runInAction(() => {
            this.isVideoEnabled = enabled;
        });
    }

    toggleAudio(): void {
        const enabled = this.webRtcClient.toggleAudio();
        runInAction(() => {
            this.isAudioEnabled = enabled;
        });
    }

    setInputRoomId(roomId: string): void {
        this.inputRoomId = roomId.toUpperCase();
    }

    clearError(): void {
        this.error = null;
    }

    disconnect(): void {
        this.webRtcClient.disconnect();
        this.resetConnectionState();
    }

    // Event handlers
    private handleRemoteStream(participantId: string, stream: MediaStream): void {
        runInAction(() => {
            this.remoteStreams.set(participantId, stream);

            // Update participant info
            const participant = this.participants.get(participantId) || {
                id: participantId,
                role: this.role === 'host' ? 'participant' : 'host',
                connectionState: 'connected' as RTCPeerConnectionState,
            };

            this.participants.set(participantId, {
                ...participant,
                stream,
            });
        });
    }

    private handleParticipantJoined(data: ParticipantJoinedData): void {
        runInAction(() => {
            this.participantCount = data.participantCount;

            const participant: ParticipantInfo = {
                id: data.participant.id,
                role: this.role === 'host' ? 'participant' : 'host',
                connectionState: 'connecting',
            };

            this.participants.set(data.participant.id, participant);
        });
    }

    private handleParticipantLeft(data: ParticipantLeftData): void {
        runInAction(() => {
            this.participantCount = data.participantCount;
            this.remoteStreams.delete(data.participant.id);
            this.participants.delete(data.participant.id);
        });
    }

    private handleSessionEnded(data: SessionEndedData): void {
        runInAction(() => {
            this.resetSessionState();
            this.error = data.message;
        });
    }

    private handleConnectionStateChange(participantId: string, state: RTCPeerConnectionState): void {
        runInAction(() => {
            const participant = this.participants.get(participantId);
            if (participant) {
                this.participants.set(participantId, {
                    ...participant,
                    connectionState: state,
                });
            }
        });
    }

    private handleRoomUpdate(data: RoomUpdateData): void {
        runInAction(() => {
            this.participantCount = data.participantCount;
        });
    }

    private handleError(error: Error): void {
        runInAction(() => {
            this.error = error.message;
            this.connectionStatus = 'error';
        });
    }

    // Helper methods
    private resetSessionState(): void {
        this.isInSession = false;
        this.roomId = null;
        this.role = null;
        this.participantCount = 1;
        this.remoteStreams.clear();
        this.participants.clear();
        this.localStream = null;
        this.connectionStatus = this.isConnected ? 'connected' : 'disconnected';
    }

    private resetConnectionState(): void {
        this.isConnected = false;
        this.connectionStatus = 'disconnected';
        this.resetSessionState();
    }
}