'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { useCartStore } from '@/store/useCartStore'

const SESSION_KEY = 'wow3d-cart-session-init'

/**
 * 앱 로드 시 비로그인 상태면 localStorage에 남아 있던 장바구니를 비웁니다.
 * (로그인 전 이전 세션/다른 탭의 장바구니가 보이지 않도록)
 * - 로그아웃 시 비우기는 useAuthStore.logout에서 수행
 */
export function ClearCartWhenGuest() {
    useEffect(() => {
        if (typeof window === 'undefined') return
        if (useAuthStore.getState().isAuthenticated) return
        if (sessionStorage.getItem(SESSION_KEY)) return
        useCartStore.getState().clearCart()
        sessionStorage.setItem(SESSION_KEY, '1')
    }, [])
    return null
}
