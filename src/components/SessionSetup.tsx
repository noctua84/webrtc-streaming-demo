import React from 'react';
import { observer } from 'mobx-react-lite';
import { Settings, Users } from 'lucide-react';
import { useStores } from '@/hooks/useStores';

export const SessionSetup: React.FC = observer(() => {
    const { webrtc, ui } = useStores();

    const handleStartSession = async () => {
        try {
            await webrtc.startSession();
            ui.addNotification('success', 'Session started successfully!');
        } catch (error) {
            ui.addNotification('error', error instanceof Error ? error.message : 'Failed to start session');
        }
    };

    const handleJoinSession = async () => {
        try {
            await webrtc.joinSession();
            ui.addNotification('success', 'Joined session successfully!');
        } catch (error) {
            ui.addNotification('error', error instanceof Error ? error.message : 'Failed to join session');
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        webrtc.setInputRoomId(e.target.value);
    };

    return (
        <div className="grid md:grid-cols-2 gap-6">
            {/* Host Section */}
            <div className="bg-gray-800 p-6 rounded-lg">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                    <Settings className="w-5 h-5 mr-2" />
                    Start as Instructor
                </h2>
                <p className="text-gray-400 mb-4">
                    Create a new session that students can join. You'll get a Room ID to share.
                </p>
                <button
                    onClick={handleStartSession}
                    disabled={!webrtc.canStartSession}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                    {webrtc.connectionStatus === 'starting' ? 'Starting...' : 'Start Teaching Session'}
                </button>
            </div>

            {/* Student Section */}
            <div className="bg-gray-800 p-6 rounded-lg">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Join as Student
                </h2>
                <p className="text-gray-400 mb-4">
                    Enter the Room ID provided by your instructor to join the session.
                </p>
                <input
                    type="text"
                    placeholder="Enter Room ID"
                    value={webrtc.inputRoomId}
                    onChange={handleInputChange}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 mb-4 focus:border-blue-500 focus:outline-none"
                />
                <button
                    onClick={handleJoinSession}
                    disabled={!webrtc.canJoinSession}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                    {webrtc.connectionStatus === 'joining' ? 'Joining...' : 'Join Session'}
                </button>
            </div>
        </div>
    );
});