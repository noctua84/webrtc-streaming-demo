// src/services/webrtc-client.service.ts - Complete WebRTC client implementation
import { io, Socket } from 'socket.io-client';
import type {
    WebRTCClientConfig,
    WebRTCClientCallbacks,
    MediaConstraints,
    CreateRoomResponse,
    JoinRoomResponse,
    UserRole,
    SignalingEvents,
    OfferData,
    AnswerData,
    IceCandidateData,
} from '@/types/webrtc.types';

export class WebRTCClientService {
    private socket: Socket<SignalingEvents> | null = null;
    private peerConnections = new Map<string, RTCPeerConnection>();
    private localStream: MediaStream | null = null;
    private roomId: string | null = null;
    private role: UserRole | null = null;
    private participantId: string | null | undefined = null;
    private callbacks: WebRTCClientCallbacks = {};
    private isInitialized = false;

    private readonly rtcConfiguration: RTCConfiguration = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
        ],
    };
    private config: any;

    constructor(
        config: WebRTCClientConfig,
        callbacks?: WebRTCClientCallbacks
    ) {
        this.rtcConfiguration = config.rtcConfiguration || this.rtcConfiguration;
        this.callbacks = callbacks || {};
        this.config = config;
    }

    // Getters
    get isConnected(): boolean {
        return this.socket?.connected || false;
    }

    get currentRoomId(): string | null {
        return this.roomId;
    }

    get currentRole(): UserRole | null {
        return this.role;
    }

    get currentParticipantId(): string | null | undefined {
        return this.participantId;
    }

    get currentLocalStream(): MediaStream | null {
        return this.localStream;
    }

    get activePeerConnections(): Map<string, RTCPeerConnection> {
        return new Map(this.peerConnections);
    }

    get connectionState(): RTCPeerConnectionState | 'disconnected' {
        if (this.peerConnections.size === 0) return 'disconnected';

        // Return the most "advanced" connection state
        const states = Array.from(this.peerConnections.values()).map(pc => pc.connectionState);

        if (states.includes('connected')) return 'connected';
        if (states.includes('connecting')) return 'connecting';
        if (states.includes('failed')) return 'failed';
        if (states.includes('disconnected')) return 'disconnected';

        return 'new';
    }

    // Connection management
    async connect(): Promise<void> {
        if (this.isConnected) {
            console.log('Already connected to signaling server');
            return;
        }

        return new Promise((resolve, reject) => {
            console.log('Connecting to signaling server:', this.config.signalingServerUrl);

            this.socket = io(this.config.signalingServerUrl, {
                timeout: 10000,
                retries: 3,
                transports: ['websocket', 'polling'],
            });

            const connectionTimeout = setTimeout(() => {
                reject(new Error('Connection timeout'));
            }, 15000);

            this.socket.on('connect', () => {
                clearTimeout(connectionTimeout);
                console.log('Connected to signaling server, socket ID:', this.socket!.id);
                this.participantId = this.socket!.id;
                this.isInitialized = true;
                this.setupSignalingListeners();
                resolve();
            });

            this.socket.on('connect_error', (error) => {
                clearTimeout(connectionTimeout);
                console.error('Failed to connect to signaling server:', error);
                this.callbacks.onError?.(error);
                reject(error);
            });

            this.socket.on('disconnect', (reason) => {
                console.log('Disconnected from signaling server:', reason);
                this.isInitialized = false;
                if (reason === 'io server disconnect') {
                    // Server disconnected us, try to reconnect
                    this.handleUnexpectedDisconnect();
                }
            });

            this.socket.io.on('reconnect', (attemptNumber: any) => {
                console.log('Reconnected to signaling server after', attemptNumber, 'attempts');
                this.participantId = this.socket!.id;
                this.isInitialized = true;
            });
        });
    }

    disconnect(): void {
        console.log('Disconnecting WebRTC client');
        this.cleanup();

        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }

        this.isInitialized = false;
        this.participantId = null;
    }

    // Media management
    async getUserMedia(constraints: MediaConstraints = { video: true, audio: true }): Promise<MediaStream> {
        try {
            console.log('Requesting user media with constraints:', constraints);

            // Stop existing stream if any
            if (this.localStream) {
                this.stopLocalStream();
            }

            this.localStream = await navigator.mediaDevices.getUserMedia(constraints);

            console.log('Successfully obtained user media:', {
                videoTracks: this.localStream.getVideoTracks().length,
                audioTracks: this.localStream.getAudioTracks().length,
            });

            // Add stream to existing peer connections
            this.addStreamToPeerConnections(this.localStream);

            return this.localStream;
        } catch (error) {
            console.error('Error accessing media devices:', error);
            const mediaError = new Error(`Failed to access media devices: ${error}`);
            this.callbacks.onError?.(mediaError);
            throw mediaError;
        }
    }

    async getDisplayMedia(): Promise<MediaStream> {
        try {
            console.log('Requesting display media');

            const displayStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true,
            });

            console.log('Successfully obtained display media');

            // Replace video track in existing connections
            await this.replaceVideoTrack(displayStream.getVideoTracks()[0]);

            return displayStream;
        } catch (error) {
            console.error('Error accessing display media:', error);
            const displayError = new Error(`Failed to access screen sharing: ${error}`);
            this.callbacks.onError?.(displayError);
            throw displayError;
        }
    }

    private stopLocalStream(): void {
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                track.stop();
                console.log('Stopped track:', track.kind);
            });
        }
    }

    private addStreamToPeerConnections(stream: MediaStream): void {
        stream.getTracks().forEach(track => {
            this.peerConnections.forEach((peerConnection, participantId) => {
                try {
                    peerConnection.addTrack(track, stream);
                    console.log(`Added ${track.kind} track to peer connection with ${participantId}`);
                } catch (error) {
                    console.error(`Error adding track to peer connection with ${participantId}:`, error);
                }
            });
        });
    }

    private async replaceVideoTrack(newTrack: MediaStreamTrack): Promise<void> {
        const promises = Array.from(this.peerConnections.entries()).map(async ([participantId, peerConnection]) => {
            try {
                const sender = peerConnection.getSenders().find(s =>
                    s.track && s.track.kind === 'video'
                );

                if (sender) {
                    await sender.replaceTrack(newTrack);
                    console.log(`Replaced video track for ${participantId}`);
                }
            } catch (error) {
                console.error(`Error replacing video track for ${participantId}:`, error);
            }
        });

        await Promise.all(promises);
    }

    // Room management
    async createRoom(): Promise<CreateRoomResponse> {
        if (!this.socket || !this.isInitialized) {
            throw new Error('Not connected to signaling server');
        }

        console.log('Creating room...');

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Create room timeout'));
            }, 10000);

            this.socket!.emit('create-room', (response: CreateRoomResponse) => {
                clearTimeout(timeout);

                if (response.success) {
                    this.roomId = response.roomId!;
                    this.role = response.role!;
                    console.log('Room created successfully:', {
                        roomId: this.roomId,
                        role: this.role,
                    });
                    resolve(response);
                } else {
                    const error = new Error(response.error || 'Failed to create room');
                    console.error('Failed to create room:', response.error);
                    this.callbacks.onError?.(error);
                    reject(error);
                }
            });
        });
    }

    async joinRoom(roomId: string): Promise<JoinRoomResponse> {
        if (!this.socket || !this.isInitialized) {
            throw new Error('Not connected to signaling server');
        }

        console.log('Joining room:', roomId);

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Join room timeout'));
            }, 10000);

            this.socket!.emit('join-room', { roomId }, (response: JoinRoomResponse) => {
                clearTimeout(timeout);

                if (response.success) {
                    this.roomId = response.roomId!;
                    this.role = response.role!;
                    console.log('Joined room successfully:', {
                        roomId: this.roomId,
                        role: this.role,
                        participantCount: response.participantCount,
                    });
                    resolve(response);
                } else {
                    const error = new Error(response.error || 'Failed to join room');
                    console.error('Failed to join room:', response.error);
                    this.callbacks.onError?.(error);
                    reject(error);
                }
            });
        });
    }

    leaveRoom(): void {
        if (this.roomId && this.socket && this.isInitialized) {
            console.log('Leaving room:', this.roomId);
            this.socket.emit('leave-room', { roomId: this.roomId });
        }
        this.cleanup();
    }

    endSession(): void {
        if (this.role === 'host' && this.roomId && this.socket && this.isInitialized) {
            console.log('Ending session:', this.roomId);
            this.socket.emit('end-session', { roomId: this.roomId });
        }
        this.cleanup();
    }

    // Media controls
    toggleVideo(): boolean {
        if (this.localStream) {
            const videoTrack = this.localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                console.log('Video toggled:', videoTrack.enabled ? 'on' : 'off');
                return videoTrack.enabled;
            }
        }
        console.warn('No video track available to toggle');
        return false;
    }

    toggleAudio(): boolean {
        if (this.localStream) {
            const audioTrack = this.localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                console.log('Audio toggled:', audioTrack.enabled ? 'on' : 'off');
                return audioTrack.enabled;
            }
        }
        console.warn('No audio track available to toggle');
        return false;
    }

    setVideoEnabled(enabled: boolean): void {
        if (this.localStream) {
            const videoTrack = this.localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = enabled;
                console.log('Video set to:', enabled ? 'on' : 'off');
            }
        }
    }

    setAudioEnabled(enabled: boolean): void {
        if (this.localStream) {
            const audioTrack = this.localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = enabled;
                console.log('Audio set to:', enabled ? 'on' : 'off');
            }
        }
    }

    // Signaling event handlers
    private setupSignalingListeners(): void {
        if (!this.socket) return;

        console.log('Setting up signaling listeners');

        this.socket.on('offer', async (data: OfferData) => {
            console.log('Received offer from:', data.participantId);

            if (!data.participantId) {
                console.error('No participant ID in offer data');
                return;
            }

            await this.handleOffer(data.participantId, data.offer);
        });

        this.socket.on('answer', async (data: AnswerData) => {
            console.log('Received answer from:', data.participantId);

            if (!data.participantId) {
                console.error('No participant ID in answer data');
                return;
            }

            await this.handleAnswer(data.participantId, data.answer);
        });

        this.socket.on('ice-candidate', async (data: IceCandidateData) => {
            console.log('Received ICE candidate from:', data.participantId);

            if (!data.participantId) {
                console.error('No participant ID in ICE candidate data');
                return;
            }

            await this.handleIceCandidate(data.participantId, data.candidate);
        });

        this.socket.on('participant-joined', (data) => {
            console.log('Participant joined:', data.participant.id, 'Total participants:', data.participantCount);
            this.callbacks.onParticipantJoined?.(data);

            // If we're the host, send offer to new participant after a short delay
            if (this.role === 'host') {
                setTimeout(() => {
                    this.sendOffer(data.participant.id).then(() => {});
                }, 1000);
            }
        });

        this.socket.on('participant-left', (data) => {
            console.log('Participant left:', data.participant.id, 'Remaining participants:', data.participantCount);
            this.removePeerConnection(data.participant.id);
            this.callbacks.onParticipantLeft?.(data);
        });

        this.socket.on('session-ended', (data) => {
            console.log('Session ended:', data.message);
            this.cleanup();
            this.callbacks.onSessionEnded?.(data);
        });

        this.socket.on('room-update', (data) => {
            console.log('Room update:', data);
            this.callbacks.onRoomUpdate?.(data);
        });
    }

    // WebRTC peer connection management
    private createPeerConnection(participantId: string): RTCPeerConnection {
        console.log('Creating peer connection for:', participantId);

        const peerConnection = new RTCPeerConnection(this.rtcConfiguration);

        // Add local stream tracks if available
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                peerConnection.addTrack(track, this.localStream!);
                console.log(`Added ${track.kind} track to peer connection with ${participantId}`);
            });
        }

        // Handle ICE candidates
        peerConnection.onicecandidate = (event) => {
            if (event.candidate && this.socket && this.roomId) {
                console.log('Sending ICE candidate to:', participantId);
                this.socket.emit('ice-candidate', {
                    roomId: this.roomId,
                    candidate: event.candidate,
                    targetId: participantId,
                } as IceCandidateData);
            }
        };

        // Handle remote stream
        peerConnection.ontrack = (event) => {
            console.log('Received remote stream from:', participantId);
            const [remoteStream] = event.streams;
            this.callbacks.onRemoteStream?.(participantId, remoteStream);
        };

        // Handle connection state changes
        peerConnection.onconnectionstatechange = () => {
            const state = peerConnection.connectionState;
            console.log(`Connection state with ${participantId}: ${state}`);
            this.callbacks.onConnectionStateChange?.(participantId, state);

            // Handle failed connections
            if (state === 'failed') {
                console.warn(`Connection failed with ${participantId}, attempting to restart ICE`);
                peerConnection.restartIce();
            }
        };

        // Handle ICE connection state changes
        peerConnection.oniceconnectionstatechange = () => {
            console.log(`ICE connection state with ${participantId}: ${peerConnection.iceConnectionState}`);
        };

        // Handle ICE gathering state changes
        peerConnection.onicegatheringstatechange = () => {
            console.log(`ICE gathering state with ${participantId}: ${peerConnection.iceGatheringState}`);
        };

        this.peerConnections.set(participantId, peerConnection);
        return peerConnection;
    }

    private async sendOffer(participantId: string): Promise<void> {
        console.log('Sending offer to:', participantId);

        let peerConnection = this.peerConnections.get(participantId);
        if (!peerConnection) {
            peerConnection = this.createPeerConnection(participantId);
        }

        try {
            const offer = await peerConnection.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true,
            });

            await peerConnection.setLocalDescription(offer);

            if (this.socket && this.roomId) {
                this.socket.emit('offer', {
                    roomId: this.roomId,
                    offer: offer,
                    targetId: participantId,
                } as OfferData);
                console.log('Offer sent to:', participantId);
            }
        } catch (error) {
            console.error('Error creating/sending offer to', participantId, ':', error);
            this.callbacks.onError?.(error as Error);
        }
    }

    private async handleOffer(senderId: string, offer: RTCSessionDescriptionInit): Promise<void> {
        console.log('Handling offer from:', senderId);

        let peerConnection = this.peerConnections.get(senderId);
        if (!peerConnection) {
            peerConnection = this.createPeerConnection(senderId);
        }

        try {
            await peerConnection.setRemoteDescription(offer);

            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);

            if (this.socket && this.roomId) {
                this.socket.emit('answer', {
                    roomId: this.roomId,
                    answer: answer,
                    targetId: senderId,
                } as AnswerData);
                console.log('Answer sent to:', senderId);
            }
        } catch (error) {
            console.error('Error handling offer from', senderId, ':', error);
            this.callbacks.onError?.(error as Error);
        }
    }

    private async handleAnswer(senderId: string, answer: RTCSessionDescriptionInit): Promise<void> {
        console.log('Handling answer from:', senderId);

        const peerConnection = this.peerConnections.get(senderId);
        if (!peerConnection) {
            console.error('No peer connection found for answer from:', senderId);
            return;
        }

        try {
            await peerConnection.setRemoteDescription(answer);
            console.log('Set remote description for answer from:', senderId);
        } catch (error) {
            console.error('Error handling answer from', senderId, ':', error);
            this.callbacks.onError?.(error as Error);
        }
    }

    private async handleIceCandidate(senderId: string, candidate: RTCIceCandidateInit): Promise<void> {
        const peerConnection = this.peerConnections.get(senderId);
        if (!peerConnection) {
            console.warn('No peer connection found for ICE candidate from:', senderId);
            return;
        }

        try {
            await peerConnection.addIceCandidate(candidate);
            console.log('Added ICE candidate from:', senderId);
        } catch (error) {
            console.error('Error adding ICE candidate from', senderId, ':', error);
            // Don't call onError for ICE candidate errors as they're often non-critical
        }
    }

    private removePeerConnection(participantId: string): void {
        const peerConnection = this.peerConnections.get(participantId);
        if (peerConnection) {
            console.log('Removing peer connection for:', participantId);
            peerConnection.close();
            this.peerConnections.delete(participantId);
        }
    }

    // Utility methods
    private cleanup(): void {
        console.log('Cleaning up WebRTC client');

        // Close all peer connections
        this.peerConnections.forEach((peerConnection, participantId) => {
            console.log('Closing peer connection with:', participantId);
            peerConnection.close();
        });
        this.peerConnections.clear();

        // Stop local stream
        this.stopLocalStream();
        this.localStream = null;

        // Reset state
        this.roomId = null;
        this.role = null;
    }

    private handleUnexpectedDisconnect(): void {
        console.log('Handling unexpected disconnect from signaling server');

        // Clean up peer connections but keep room state for potential reconnection
        this.peerConnections.forEach((peerConnection) => {
            peerConnection.close();
        });
        this.peerConnections.clear();

        // Notify about the disconnect
        this.callbacks.onError?.(new Error('Lost connection to signaling server'));
    }

    // Public utility methods
    updateCallbacks(newCallbacks: Partial<WebRTCClientCallbacks>): void {
        this.callbacks = { ...this.callbacks, ...newCallbacks };
    }

    getConnectionStatistics(): Promise<Map<string, RTCStatsReport>> {
        const statsPromises = Array.from(this.peerConnections.entries()).map(
            async ([participantId, peerConnection]) => {
                try {
                    const stats = await peerConnection.getStats();
                    return [participantId, stats] as [string, RTCStatsReport];
                } catch (error) {
                    console.error(`Error getting stats for ${participantId}:`, error);
                    return [participantId, new Map()] as [string, RTCStatsReport];
                }
            }
        );

        return Promise.all(statsPromises).then(results => new Map(results));
    }

    async checkConnectivity(): Promise<boolean> {
        try {
            // Simple connectivity check
            const response = await fetch(`${this.config.signalingServerUrl}/api/health`, {
                method: 'GET',
                timeout: 5000,
            } as RequestInit);
            return response.ok;
        } catch (error) {
            console.error('Connectivity check failed:', error);
            return false;
        }
    }
}