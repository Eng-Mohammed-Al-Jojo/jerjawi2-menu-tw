import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type OrderMode = 'dineIn' | 'takeaway';

interface OrderModesConfig {
  dineInEnabled: boolean;
  takeawayEnabled: boolean;
}

interface MenuState {
  selectedOrderMode: OrderMode;
  orderModesConfig: OrderModesConfig;
  orderSystem: boolean;
  setOrderMode: (mode: OrderMode) => void;
  setOrderModesConfig: (config: OrderModesConfig) => void;
  setOrderSystem: (enabled: boolean) => void;
  getEffectiveOrderMode: () => OrderMode;
}

export const useMenuStore = create<MenuState>()(
  persist(
    (set) => ({
      selectedOrderMode: 'takeaway',
      orderModesConfig: {
        dineInEnabled: false,
        takeawayEnabled: true,
      },
      orderSystem: true,
      setOrderMode: (_mode) => set({ selectedOrderMode: 'takeaway' }), // Force takeaway
      setOrderModesConfig: (_config) => set({ 
        orderModesConfig: { 
          dineInEnabled: false, 
          takeawayEnabled: true 
        } 
      }), // Force takeaway only
      setOrderSystem: (enabled) => set({ orderSystem: enabled }),
      getEffectiveOrderMode: () => {
        return 'takeaway';
      }
    }),
    {
      name: 'menu-order-mode-storage',
      partialize: (state) => ({ selectedOrderMode: state.selectedOrderMode }),
    }
  )
);
