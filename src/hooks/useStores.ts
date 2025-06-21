import { useContext, createContext } from 'react';
import {rootStore, type RootStore} from "@/stores";


const StoreContext = createContext<RootStore>(rootStore);

export const useStores = () => {
    const stores = useContext(StoreContext);
    if (!stores) {
        throw new Error('useStores must be used within a StoreProvider');
    }
    return stores;
};

export const StoreProvider = StoreContext.Provider;