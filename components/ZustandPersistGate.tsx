'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { useCartStore } from '@/store/useCartStore'

/**
 * zustand persist를 skipHydration 후 클라이언트에서만 rehydrate.
 * SSR HTML과 첫 CSR이 localStorage 값으로 갈라져 React #418이 나는 것을 막습니다.
 */
export function ZustandPersistGate() {
    useEffect(() => {
        void useAuthStore.persist.rehydrate()
        void useCartStore.persist.rehydrate()
    }, [])

    return null
}
