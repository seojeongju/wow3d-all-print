import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Quote } from '@/lib/types';
import {
    cartLineTotalsByKey,
    lineTotalFromStoredQuote,
    type CartBatchLineInput,
} from '@/lib/quote-batch-price';

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
    /** 장바구니 품목(파일) 수 */
    getTotalItems: () => number;
    /** 총 출력 수량 합 */
    getTotalQuantity: () => number;
}

export function cartItemToBatchInput(item: CartItem): CartBatchLineInput | null {
    const q = item.quote
    if (!q) return null
    return {
        key: item.id,
        printMethod: q.printMethod || 'unknown',
        quantity: item.quantity,
        totalPriceKrw: q.totalPrice || 0,
        variableCostKrw: q.variableCostKrw,
        setupCostKrw: q.setupCostKrw,
        minPriceKrw: q.minPriceKrw,
    }
}

/** 목록 기준 출력방식 그룹 배치 후 라인 합계 맵 */
export function cartItemsLineTotals(itemList: CartItem[]): Map<number, number> {
    const inputs = itemList
        .map(cartItemToBatchInput)
        .filter((x): x is CartBatchLineInput => x != null)
    const byKey = cartLineTotalsByKey(inputs, { applyVat: true })
    const out = new Map<number, number>()
    for (const [k, v] of byKey) {
        out.set(Number(k), v)
    }
    return out
}

/**
 * 단독 라인 금액(구버전·미리보기용).
 * 장바구니 UI에서는 cartItemsLineTotals로 그룹 합산을 쓰세요.
 */
function cartItemLineTotal(item: CartItem): number {
    const q = item.quote
    if (!q) return 0
    return lineTotalFromStoredQuote({
        totalPriceKrw: q.totalPrice || 0,
        quantity: item.quantity,
        variableCostKrw: q.variableCostKrw,
        setupCostKrw: q.setupCostKrw,
        minPriceKrw: q.minPriceKrw,
        applyVat: true,
    }).lineTotalKrw
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],

            addToCart: (quote, quantity = 1, mergeQuantity = true) => set((state) => {
                const sameModelIndex = state.items.findIndex((item) => {
                    if (item.quoteId === quote.id) return true
                    const existingName = (item.quote?.fileName || '').trim().toLowerCase()
                    const nextName = (quote.fileName || '').trim().toLowerCase()
                    return Boolean(existingName && nextName && existingName === nextName)
                })

                if (sameModelIndex >= 0) {
                    const newItems = [...state.items];
                    const existing = newItems[sameModelIndex];
                    newItems[sameModelIndex] = {
                        ...existing,
                        quoteId: quote.id,
                        quote,
                        quantity: mergeQuantity && existing.quoteId === quote.id
                            ? existing.quantity + quantity
                            : existing.quoteId === quote.id
                                ? Math.max(existing.quantity, quantity)
                                : quantity,
                    };
                    return { items: newItems };
                }

                const newItem: CartItem = {
                    id: Date.now(),
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
                return [...cartItemsLineTotals(state.items).values()].reduce((a, b) => a + b, 0);
            },

            getTotalPriceForItems: (itemList) => {
                return [...cartItemsLineTotals(itemList).values()].reduce((a, b) => a + b, 0);
            },

            /** 장바구니 품목(파일/라인) 수 — 헤더 뱃지·품목 수 표시용 (수량 합이 아님) */
            getTotalItems: () => {
                return get().items.length;
            },

            /** 담긴 총 출력 수량 합 */
            getTotalQuantity: () => {
                return get().items.reduce((total, item) => total + item.quantity, 0);
            },
        }),
        {
            name: 'wow3d-cart',
            skipHydration: true,
        }
    )
);

export { cartItemLineTotal };
