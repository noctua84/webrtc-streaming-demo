export type UserRole = 'host' | 'participant';

export type ConnectionState =
    | 'disconnected'
    | 'connecting'
    | 'connected'
    | 'failed'
    | 'closed'
    | 'waiting'
    | 'reconnecting'
    | 'starting'
    | 'joining'
    | 'error'

export interface MediaConstraints {
    video: boolean;
    audio: boolean;
}

export interface RTCConfiguration {
    iceServers: RTCIceServer[];
}

export interface RoomInfo {
    roomId: string;
    participants: string[];
    participantCount: number;
    createdAt: Date;
    isActive: boolean;
}

export interface ParticipantInfo {
    id: string;
    role: UserRole;
    displayName?: string;
    stream?: MediaStream;
    connectionState: RTCPeerConnectionState;
}

export interface CreateRoomResponse {
    success: boolean;
    roomId?: string;
    error?: string;
    role?: UserRole;
}

export interface JoinRoomResponse {
    success: boolean;
    roomId?: string;
    role?: UserRole;
    error?: string;
    participantCount?: number;
}

export interface OfferData {
    offer: RTCSessionDescriptionInit;
    roomId: string;
    participantId?: string;
}

export interface AnswerData {
    answer: RTCSessionDescriptionInit;
    roomId: string;
    participantId?: string;
}

export interface IceCandidateData {
    candidate: RTCIceCandidateInit;
    roomId: string;
    participantId?: string;
}

export interface ParticipantJoinedData {
    participant: ParticipantInfo;
    participantCount: number;
    roomId: string;
}

export interface ParticipantLeftData {
    participant: ParticipantInfo;
    participantCount: number;
    roomId: string;
}

export interface SessionEndedData {
    roomId: string;
    reason?: string;
    message: string;
}

export interface RoomUpdateData {
    roomId: string;
    participants: ParticipantInfo[];
    participantCount: number;
}

export interface WebRTCClientConfig {
    signalingServerUrl: string;
    rtcConfiguration?: RTCConfiguration;
}

export interface WebRTCClientCallbacks {
    onRemoteStream?: (participantId: string, stream: MediaStream) => void;
    onParticipantJoined?: (data: ParticipantJoinedData) => void;
    onParticipantLeft?: (data: ParticipantLeftData) => void;
    onSessionEnded?: (data: SessionEndedData) => void;
    onConnectionStateChange?: (participantId: string, state: RTCPeerConnectionState) => void;
    onRoomUpdate?: (data: RoomUpdateData) => void;
    onError?: (error: Error) => void;
}

export interface SignalingEvents {
    // Client to Server
    'create-room': (callback: (response: CreateRoomResponse) => void) => void;
    'join-room': (data: { roomId: string }, callback: (response: JoinRoomResponse) => void) => void;
    'offer': (data: OfferData) => void;
    'answer': (data: AnswerData) => void;
    'ice-candidate': (data: IceCandidateData) => void;
    'leave-room': (data: { roomId: string }) => void;
    'end-session': (data: { roomId: string }) => void;

    // Server to Client
    'participant-joined': (data: ParticipantJoinedData) => void;
    'participant-left': (data: ParticipantLeftData) => void;
    'session-ended': (data: SessionEndedData) => void;
    'room-update': (data: RoomUpdateData) => void;
}