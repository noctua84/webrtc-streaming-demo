import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { rootStore } from '@/stores';
import './index.css';

// Enable MobX strict mode in development
import { configure } from 'mobx';
import {StoreProvider} from "@/hooks/useStores.ts";

if (import.meta.env.DEV) {
    configure({
        enforceActions: 'always',
        computedRequiresReaction: true,
        reactionRequiresObservable: true,
        observableRequiresReaction: true,
        disableErrorBoundaries: true,
    });
}

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
    <React.StrictMode>
        <StoreProvider value={rootStore}>
            <App />
        </StoreProvider>
    </React.StrictMode>
);