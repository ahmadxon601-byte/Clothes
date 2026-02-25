import { create } from 'zustand';

interface ToastOptions {
    message: string;
    type?: 'success' | 'error' | 'info';
    duration?: number;
}

interface ToastState {
    toast: ToastOptions | null;
    showToast: (options: ToastOptions) => void;
    hideToast: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
    toast: null,
    showToast: (options) => {
        set({ toast: { type: 'success', duration: 3000, ...options } });
        setTimeout(() => {
            set({ toast: null });
        }, options.duration || 3000);
    },
    hideToast: () => set({ toast: null }),
}));

export const useToast = () => {
    const showToast = useToastStore((s) => s.showToast);
    return { showToast };
};
