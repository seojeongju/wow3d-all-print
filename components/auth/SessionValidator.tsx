'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { isTokenExpired, validateAuthToken } from '@/lib/auth-session';
import { showToast } from '@/lib/toast-helper';

/** 로그인 상태 UI와 JWT 만료를 동기화 (admin/auth 페이지 제외) */
export default function SessionValidator() {
    const pathname = usePathname();
    const { isAuthenticated, token, logout } = useAuthStore();
    const checkedRef = useRef<string | null>(null);

    useEffect(() => {
        if (!isAuthenticated || !token) return;
        if (pathname.startsWith('/auth') || pathname.startsWith('/admin')) return;

        const cacheKey = `${pathname}:${token.slice(-12)}`;
        if (checkedRef.current === cacheKey) return;

        const syncSession = async () => {
            if (isTokenExpired(token)) {
                logout({ keepCart: true });
                showToast.info('로그인 만료', '다시 로그인해 주세요.');
                checkedRef.current = cacheKey;
                return;
            }

            const result = await validateAuthToken(token);
            if (!result.ok && result.reason !== 'network_error') {
                logout({ keepCart: true });
                showToast.info(
                    '로그인 만료',
                    result.reason === 'token_expired'
                        ? '세션이 만료되었습니다. 다시 로그인해 주세요.'
                        : '로그인 정보가 유효하지 않습니다. 다시 로그인해 주세요.'
                );
            }
            checkedRef.current = cacheKey;
        };

        void syncSession();
    }, [isAuthenticated, token, pathname, logout]);

    return null;
}
