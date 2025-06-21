import React from 'react';
import { observer } from 'mobx-react-lite';
import { Users } from 'lucide-react';
import { useStores } from '@/hooks/useStores';

export const RoomInfo: React.FC = observer(() => {
    const { webrtc, ui } = useStores();

    if (!webrtc.isInSession || webrtc.role !== 'host') return null;

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
        <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="font-semibold mb-3 flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Share with Students
            </h3>

            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <span className="text-gray-400 text-sm">Room ID:</span>
                        <div className="flex items-center space-x-2 mt-1">
                            <code className="bg-gray-700 px-3 py-1 rounded text-blue-400 font-mono text-lg">
                                {webrtc.roomId}
                            </code>
                            <button
                                onClick={handleCopyRoomId}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
                            >
                                {ui.copiedRoomId ? 'Copied!' : 'Copy'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-gray-400">Participants:</span>
                        <p className="font-medium">{webrtc.participantCount}</p>
                    </div>
                    <div>
                        <span className="text-gray-400">Session Type:</span>
                        <p className="font-medium">Live Video</p>
                    </div>
                </div>
            </div>
        </div>
    );
});