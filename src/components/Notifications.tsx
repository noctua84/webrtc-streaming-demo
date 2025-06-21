import React from 'react';
import { observer } from 'mobx-react-lite';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useStores } from '@/hooks/useStores';

export const Notifications: React.FC = observer(() => {
    const { ui } = useStores();

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle className="w-5 h-5" />;
            case 'error': return <AlertCircle className="w-5 h-5" />;
            case 'warning': return <AlertTriangle className="w-5 h-5" />;
            default: return <Info className="w-5 h-5" />;
        }
    };

    const getColorClasses = (type: string) => {
        switch (type) {
            case 'success': return 'bg-green-900/90 border-green-500 text-green-100';
            case 'error': return 'bg-red-900/90 border-red-500 text-red-100';
            case 'warning': return 'bg-yellow-900/90 border-yellow-500 text-yellow-100';
            default: return 'bg-blue-900/90 border-blue-500 text-blue-100';
        }
    };

    if (ui.notifications.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-50 space-y-2">
            {ui.notifications.map((notification) => (
                <div
                    key={notification.id}
                    className={`flex items-center space-x-3 p-4 rounded-lg border backdrop-blur-sm max-w-sm ${getColorClasses(notification.type)}`}
                >
                    {getIcon(notification.type)}
                    <span className="flex-1 text-sm">{notification.message}</span>
                    <button
                        onClick={() => ui.removeNotification(notification.id)}
                        className="hover:opacity-70 transition-opacity"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ))}
        </div>
    );
});