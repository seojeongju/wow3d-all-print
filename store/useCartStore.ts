import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Quote } from '@/lib/types';

interface CartState {
    items: CartItem[];

    /** mergeQuantity=false: 동일 quoteId는 견적 스냅샷만 갱신(출력 방식·금액 변경 반영) */
    addToCart: (quote: Quote, quantity?: number, mergeQuantity?: boolean) => void;
    removeFromCart: (cartItemId: number) => void;
    removeFromCartByIds: (ids: number[]) => void;
    updateQuantity: (cartItemId: number, quantity: number) => void;
    setQuoteThumbnail: (cartItemId: number, thumbnailDataUrl: string) => void;
    /** DB 견적 최신값으로 장바구니 스냅샷 갱신 (출력 방식·금액 불일치 방지) */
    refreshQuoteSnapshots: (quotes: Quote[]) => void;
    clearCart: () => void;
    getTotalPrice: () => number;
    getTotalPriceForItems: (itemList: CartItem[]) => number;
    getTotalItems: () => number;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],

            addToCart: (quote, quantity = 1, mergeQuantity = true) => set((state) => {
                // 이미 장바구니에 있는지 확인
                const existingItemIndex = state.items.findIndex(
                    item => item.quoteId === quote.id
                );

                if (existingItemIndex >= 0) {
                    const newItems = [...state.items];
                    const existing = newItems[existingItemIndex];
                    newItems[existingItemIndex] = {
                        ...existing,
                        quote,
                        quantity: mergeQuantity
                            ? existing.quantity + quantity
                            : Math.max(existing.quantity, quantity),
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

            removeFromCartByIds: (ids) => set((state) => ({
                items: state.items.filter(item => !ids.includes(item.id))
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

            setQuoteThumbnail: (cartItemId, thumbnailDataUrl) => set((state) => ({
                items: state.items.map((item) =>
                    item.id === cartItemId && item.quote
                        ? { ...item, quote: { ...item.quote, thumbnailDataUrl } }
                        : item
                ),
            })),

            refreshQuoteSnapshots: (quotes) => set((state) => {
                const byId = new Map(quotes.map((q) => [q.id, q]))
                return {
                    items: state.items.map((item) => {
                        const fresh = byId.get(item.quoteId)
                        if (!fresh) return item
                        return {
                            ...item,
                            quote: {
                                ...item.quote,
                                ...fresh,
                                thumbnailDataUrl:
                                    item.quote?.thumbnailDataUrl ?? fresh.thumbnailDataUrl,
                            },
                        }
                    }),
                }
            }),

            clearCart: () => set({ items: [] }),

            getTotalPrice: () => {
                const state = get();
                return state.items.reduce(
                    (total, item) => total + (item.quote?.totalPrice || 0) * item.quantity,
                    0
                );
            },

            getTotalPriceForItems: (itemList) => {
                return itemList.reduce(
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
