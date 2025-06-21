import type { MediaConstraints } from '@/types/webrtc.types';
import { APP_CONFIG, ERROR_MESSAGES } from './constants';

export class MediaUtils {
    static async getUserMedia(constraints?: MediaConstraints): Promise<MediaStream> {
        const defaultConstraints = {
            video: APP_CONFIG.MEDIA_CONSTRAINTS.video,
            audio: APP_CONFIG.MEDIA_CONSTRAINTS.audio,
        };

        const finalConstraints = constraints || defaultConstraints;

        try {
            return await navigator.mediaDevices.getUserMedia(finalConstraints);
        } catch (error) {
            console.error('Error accessing media devices:', error);

            if (error instanceof DOMException) {
                switch (error.name) {
                    case 'NotAllowedError':
                        throw new Error(ERROR_MESSAGES.MEDIA_ACCESS_DENIED);
                    case 'NotFoundError':
                        throw new Error('No camera or microphone found');
                    case 'NotReadableError':
                        throw new Error('Camera or microphone is already in use');
                    default:
                        throw new Error(`Media access error: ${error.message}`);
                }
            }

            throw error;
        }
    }

    static async getDisplayMedia(): Promise<MediaStream> {
        try {
            return await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true,
            });
        } catch (error) {
            console.error('Error accessing display media:', error);
            throw new Error('Screen sharing not available or permission denied');
        }
    }

    static stopMediaStream(stream: MediaStream | null): void {
        if (stream) {
            stream.getTracks().forEach(track => {
                track.stop();
            });
        }
    }

    static async getDevices(): Promise<MediaDeviceInfo[]> {
        try {
            return await navigator.mediaDevices.enumerateDevices();
        } catch (error) {
            console.error('Error enumerating devices:', error);
            return [];
        }
    }

    static async getCameras(): Promise<MediaDeviceInfo[]> {
        const devices = await this.getDevices();
        return devices.filter(device => device.kind === 'videoinput');
    }

    static async getMicrophones(): Promise<MediaDeviceInfo[]> {
        const devices = await this.getDevices();
        return devices.filter(device => device.kind === 'audioinput');
    }
}