import React from 'react';
import { observer } from 'mobx-react-lite';
import { Users, Copy, CheckCircle } from 'lucide-react';
import { useStores } from '@/hooks/useStores';

export const StatusBar: React.FC = observer(() => {
    const { webrtc, ui } = useStores();

    const handleCopyRoomId = async () => {
        if (webrtc.roomId) {
            try {
                await navigator.clipboard.writeText(webrtc.roomId);
                ui.setCopiedRoomId(true);
                ui.addNotification('success', 'Room ID copied to clipboard!');
            } catch (error) {
                ui.addNotification('error', 'Failed to copy Room ID');
            }
        }
    };

    return (
        <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
            <div className="flex items-center space-x-4">
        <span className={`font-medium ${webrtc.statusColor}`}>
          Status: {webrtc.statusText}
        </span>
                {webrtc.roomId && (
                    <div className="flex items-center space-x-2">
                        <span className="text-blue-400">Room ID:</span>
                        <span className="font-mono font-bold">{webrtc.roomId}</span>
                        <button
                            onClick={handleCopyRoomId}
                            className="p-1 hover:bg-gray-700 rounded transition-colors"
                            title="Copy Room ID"
                        >
                            {ui.copiedRoomId ?
                                <CheckCircle className="w-4 h-4 text-green-500" /> :
                                <Copy className="w-4 h-4" />
                            }
                        </button>
                    </div>
                )}
            </div>
            <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>{webrtc.participantCount} participant{webrtc.participantCount !== 1 ? 's' : ''}</span>
            </div>
        </div>
    );
});