import React from 'react';
import { observer } from 'mobx-react-lite';
import { Video, VideoOff, Mic, MicOff, PhoneOff, Settings } from 'lucide-react';
import { useStores } from '@/hooks/useStores';

interface VideoControlsProps {
    className?: string;
}

export const VideoControls: React.FC<VideoControlsProps> = observer(({ className = '' }) => {
    const { webrtc, ui } = useStores();

    const handleToggleVideo = () => {
        webrtc.toggleVideo();
    };

    const handleToggleAudio = () => {
        webrtc.toggleAudio();
    };

    const handleEndSession = () => {
        webrtc.endSession();
    };

    const handleOpenSettings = () => {
        ui.toggleSettingsModal();
    };

    return (
        <div className={`flex justify-center items-center space-x-4 ${className}`}>
            <button
                onClick={handleToggleVideo}
                className={`p-3 rounded-full transition-colors ${
                    webrtc.isVideoEnabled
                        ? 'bg-gray-600 hover:bg-gray-700'
                        : 'bg-red-600 hover:bg-red-700'
                }`}
                title={`${webrtc.isVideoEnabled ? 'Turn off' : 'Turn on'} camera`}
            >
                {webrtc.isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>

            <button
                onClick={handleToggleAudio}
                className={`p-3 rounded-full transition-colors ${
                    webrtc.isAudioEnabled
                        ? 'bg-gray-600 hover:bg-gray-700'
                        : 'bg-red-600 hover:bg-red-700'
                }`}
                title={`${webrtc.isAudioEnabled ? 'Mute' : 'Unmute'} microphone`}
            >
                {webrtc.isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>

            <button
                onClick={handleOpenSettings}
                className="p-3 rounded-full bg-gray-600 hover:bg-gray-700 transition-colors"
                title="Settings"
            >
                <Settings className="w-5 h-5" />
            </button>

            <button
                onClick={handleEndSession}
                className="p-3 rounded-full bg-red-600 hover:bg-red-700 transition-colors"
                title="End session"
            >
                <PhoneOff className="w-5 h-5" />
            </button>
        </div>
    );
});