'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useAuthStore } from '@/store/useAuthStore';
import { isTokenExpired, validateAuthToken } from '@/lib/auth-session';
import { showToast } from '@/lib/toast-helper';

/** 로그인 상태 UI와 JWT 만료를 동기화 (admin/auth 페이지 제외) */
export default function SessionValidator() {
    const pathname = usePathname();
    const locale = useLocale();
    const t = useTranslations('Common');
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
                showToast.info(t('sessionExpiredTitle'), t('sessionExpiredDesc'), locale);
                checkedRef.current = cacheKey;
                return;
            }

            const result = await validateAuthToken(token);
            if (!result.ok && result.reason !== 'network_error') {
                logout({ keepCart: true });
                showToast.info(
                    t('sessionExpiredTitle'),
                    result.reason === 'token_expired'
                        ? t('sessionExpiredLong')
                        : t('sessionInvalid'),
                    locale
                );
            }
            checkedRef.current = cacheKey;
        };

        void syncSession();
    }, [isAuthenticated, token, pathname, logout, t, locale]);

    return null;
}
