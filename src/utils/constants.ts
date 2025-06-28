export const APP_CONFIG = {
    DEFAULT_SIGNALING_SERVER: 'http://localhost:3000',
    RTC_CONFIGURATION: {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
        ],
    },
    MEDIA_CONSTRAINTS: {
        video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
        },
        audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
        },
    },
    UI: {
        NOTIFICATION_TIMEOUT: 5000,
        COPY_FEEDBACK_TIMEOUT: 2000,
    },
} as const;

export const ERROR_MESSAGES = {
    CONNECTION_FAILED: 'Failed to connect to the signaling server',
    MEDIA_ACCESS_DENIED: 'Camera and microphone access is required',
    ROOM_NOT_FOUND: 'Room not found or no longer active',
    INVALID_ROOM_ID: 'Please enter a valid Room ID',
    SESSION_ENDED: 'Session has ended',
    PEER_CONNECTION_FAILED: 'Failed to establish peer connection',
} as const;