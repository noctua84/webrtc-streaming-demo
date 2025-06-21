import { makeAutoObservable } from 'mobx';

export class UIStore {
    // Clipboard state
    copiedRoomId = false;

    // Loading states
    isLoading = false;
    loadingMessage = '';

    // Modal/dialog states
    showSettingsModal = false;
    showParticipantsModal = false;

    // Notification state
    notifications: Array<{
        id: string;
        type: 'success' | 'error' | 'info' | 'warning';
        message: string;
        timestamp: number;
    }> = [];

    constructor() {
        makeAutoObservable(this);
    }

    // Actions
    setLoading(isLoading: boolean, message = ''): void {
        this.isLoading = isLoading;
        this.loadingMessage = message;
    }

    setCopiedRoomId(copied: boolean): void {
        this.copiedRoomId = copied;
        if (copied) {
            // Auto-reset after 2 seconds
            setTimeout(() => {
                this.copiedRoomId = false;
            }, 2000);
        }
    }

    toggleSettingsModal(): void {
        this.showSettingsModal = !this.showSettingsModal;
    }

    toggleParticipantsModal(): void {
        this.showParticipantsModal = !this.showParticipantsModal;
    }

    addNotification(
        type: 'success' | 'error' | 'info' | 'warning',
        message: string
    ): void {
        const notification = {
            id: Math.random().toString(36).substring(2, 9),
            type,
            message,
            timestamp: Date.now(),
        };

        this.notifications.push(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            this.removeNotification(notification.id);
        }, 5000);
    }

    removeNotification(id: string): void {
        this.notifications = this.notifications.filter(n => n.id !== id);
    }

    clearAllNotifications(): void {
        this.notifications = [];
    }
}