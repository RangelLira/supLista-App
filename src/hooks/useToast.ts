// ===========================
// HOOK: TOAST GLOBAL
// ===========================

import { createContext, useContext } from 'react';

export interface ToastContextValue {
  showToast: (message: string, onUndo?: () => void) => void;
}

export const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

export function useToast(): ToastContextValue {
  return useContext(ToastContext);
}
