import React from 'react';
import { observer } from 'mobx-react-lite';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useStores } from '@/hooks/useStores';
import { LoadingSpinner } from './LoadingSpinner';

export const ConnectionStatus: React.FC = observer(() => {
    const { webrtc } = useStores();

    const handleRetryConnection = async () => {
        try {
            await webrtc.initialize();
        } catch (error) {
            console.error('Failed to reconnect:', error);
        }
    };

    if (webrtc.isConnected) return null;

    return (
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
            <div className="flex items-center space-x-3">
                {webrtc.connectionStatus === 'connecting' ? (
                    <LoadingSpinner size="sm" />
                ) : (
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                )}
                <div className="flex-1">
                    <h3 className="font-semibold text-red-400">
                        {webrtc.connectionStatus === 'connecting' ? 'Connecting...' : 'Connection Error'}
                    </h3>
                    <p className="text-red-200 text-sm">
                        {webrtc.error || 'Unable to connect to signaling server. Please ensure the server is running.'}
                    </p>
                </div>
                {webrtc.connectionStatus === 'error' && (
                    <button
                        onClick={handleRetryConnection}
                        className="flex items-center space-x-1 bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm transition-colors"
                    >
                        <RefreshCw className="w-3 h-3" />
                        <span>Retry</span>
                    </button>
                )}
            </div>
        </div>
    );
});