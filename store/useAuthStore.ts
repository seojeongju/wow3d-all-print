import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/lib/types';
import { useCartStore } from '@/store/useCartStore';

interface AuthState {
    user: User | null;
    token: string | null;
    sessionId: string;
    isAuthenticated: boolean;

    setUser: (user: User, token: string) => void;
    setSessionId: (id: string) => void;
    logout: () => void;
    updateUser: (userData: Partial<User>) => void;
}

// 세션 ID 생성
const generateSessionId = () => {
    const stored = localStorage.getItem('wow3d-session-id');
    if (stored) return stored;

    const newId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem('wow3d-session-id', newId);
    return newId;
};

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            sessionId: typeof window !== 'undefined' ? generateSessionId() : '',
            isAuthenticated: false,

            setUser: (user, token) => set({
                user,
                token,
                isAuthenticated: true
            }),

            setSessionId: (id) => set({ sessionId: id }),

            logout: () => {
                useCartStore.getState().clearCart();
                set({
                    user: null,
                    token: null,
                    isAuthenticated: false
                });
            },

            updateUser: (userData) => set((state) => ({
                user: state.user ? { ...state.user, ...userData } : null
            })),
        }),
        {
            name: 'wow3d-auth',
        }
    )
);
