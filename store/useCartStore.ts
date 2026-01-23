import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Quote } from '@/lib/types';

interface CartState {
    items: CartItem[];

    addToCart: (quote: Quote, quantity?: number) => void;
    removeFromCart: (cartItemId: number) => void;
    updateQuantity: (cartItemId: number, quantity: number) => void;
    clearCart: () => void;
    getTotalPrice: () => number;
    getTotalItems: () => number;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],

            addToCart: (quote, quantity = 1) => set((state) => {
                // 이미 장바구니에 있는지 확인
                const existingItemIndex = state.items.findIndex(
                    item => item.quoteId === quote.id
                );

                if (existingItemIndex >= 0) {
                    // 수량 업데이트
                    const newItems = [...state.items];
                    newItems[existingItemIndex] = {
                        ...newItems[existingItemIndex],
                        quantity: newItems[existingItemIndex].quantity + quantity
                    };
                    return { items: newItems };
                }

                // 새로 추가
                const newItem: CartItem = {
                    id: Date.now(), // 임시 ID (서버에서 실제 ID 받아와야 함)
                    quoteId: quote.id,
                    quantity,
                    createdAt: new Date().toISOString(),
                    quote,
                };

                return { items: [...state.items, newItem] };
            }),

            removeFromCart: (cartItemId) => set((state) => ({
                items: state.items.filter(item => item.id !== cartItemId)
            })),

            updateQuantity: (cartItemId, quantity) => set((state) => {
                if (quantity < 1) return state;

                return {
                    items: state.items.map(item =>
                        item.id === cartItemId
                            ? { ...item, quantity }
                            : item
                    )
                };
            }),

            clearCart: () => set({ items: [] }),

            getTotalPrice: () => {
                const state = get();
                return state.items.reduce(
                    (total, item) => total + (item.quote?.totalPrice || 0) * item.quantity,
                    0
                );
            },

            getTotalItems: () => {
                const state = get();
                return state.items.reduce((total, item) => total + item.quantity, 0);
            },
        }),
        {
            name: 'wow3d-cart',
        }
    )
);
