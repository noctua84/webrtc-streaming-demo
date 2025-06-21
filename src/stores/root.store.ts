import { WebRTCStore } from './webrtc.store';
import { UIStore } from './ui.store';

export class RootStore {
    webrtc: WebRTCStore;
    ui: UIStore;

    constructor() {
        this.webrtc = new WebRTCStore();
        this.ui = new UIStore();
    }

    // Global cleanup
    dispose(): void {
        this.webrtc.disconnect();
    }
}

// Create singleton store instance
export const rootStore = new RootStore();