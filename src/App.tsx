import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useStores } from '@/hooks/useStores';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Notifications } from '@/components/Notifications';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { StatusBar } from '@/components/StatusBar';
import { SessionSetup } from '@/components/SessionSetup';
import { VideoGrid } from '@/components/VideoGrid';
import { VideoControls } from '@/components/VideoControls';
import { RoomInfo } from '@/components/RoomInfo';
import { LoadingSpinner } from '@/components/LoadingSpinner';

const AppContent: React.FC = observer(() => {
    const { webrtc, ui } = useStores();

    useEffect(() => {
        // Initialize the WebRTC connection on mount
        const initializeApp = async () => {
            try {
                await webrtc.initialize();
            } catch (error) {
                console.error('Failed to initialize app:', error);
                ui.addNotification('error', 'Failed to connect to server');
            }
        };

        initializeApp();

        // Cleanup on unmount
        return () => {
            webrtc.disconnect();
        };
    }, [webrtc, ui]);

    // Show loading spinner during initial connection
    if (webrtc.connectionStatus === 'connecting' && !webrtc.isConnected) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
                <LoadingSpinner size="lg" message="Connecting to server..." />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold mb-2">WebRTC Education Platform</h1>
                    <p className="text-gray-400">Real-time video sessions for instructors and students</p>

                    {/* Status Bar */}
                    <div className="mt-4">
                        <StatusBar />
                    </div>
                </div>

                {/* Connection Status */}
                <ConnectionStatus />

                {/* Main Content */}
                {!webrtc.isInSession ? (
                    /* Setup Screen */
                    <div className="mt-6">
                        <SessionSetup />
                    </div>
                ) : (
                    /* Video Session */
                    <div className="space-y-6">
                        {/* Video Grid */}
                        <VideoGrid />

                        {/* Controls */}
                        <VideoControls />

                        {/* Room Information */}
                        <RoomInfo />
                    </div>
                )}

                {/* Global Loading Overlay */}
                {ui.isLoading && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
                        <div className="bg-gray-800 p-6 rounded-lg">
                            <LoadingSpinner size="lg" message={ui.loadingMessage} />
                        </div>
                    </div>
                )}
            </div>

            {/* Notifications */}
            <Notifications />
        </div>
    );
});

const App: React.FC = () => {
    return (
        <ErrorBoundary>
            <AppContent />
        </ErrorBoundary>
    );
};

export default App;
