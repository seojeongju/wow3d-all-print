import { create } from 'zustand';
import type { Quote } from '@/lib/types';

interface QuoteState {
    savedQuotes: Quote[];
    currentQuote: Quote | null;

    setSavedQuotes: (quotes: Quote[]) => void;
    addQuote: (quote: Quote) => void;
    removeQuote: (quoteId: number) => void;
    setCurrentQuote: (quote: Quote | null) => void;
}

export const useQuoteStore = create<QuoteState>((set) => ({
    savedQuotes: [],
    currentQuote: null,

    setSavedQuotes: (quotes) => set({ savedQuotes: quotes }),

    addQuote: (quote) => set((state) => ({
        savedQuotes: [quote, ...state.savedQuotes]
    })),

    removeQuote: (quoteId) => set((state) => ({
        savedQuotes: state.savedQuotes.filter(q => q.id !== quoteId)
    })),

    setCurrentQuote: (quote) => set({ currentQuote: quote }),
}));
