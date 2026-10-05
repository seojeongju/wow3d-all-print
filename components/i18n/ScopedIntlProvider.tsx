import { NextIntlClientProvider, hasLocale } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import type { ClientNamespaceScope } from '@/i18n/client-namespaces.generated'
import { pickClientMessages } from '@/i18n/pick-client-messages'

type Props = {
    scope: ClientNamespaceScope
    locale: string
    children: React.ReactNode
}

/**
 * 세그먼트별 클라이언트 번역 Provider.
 * 중첩 Provider의 messages는 병합되지 않고 교체되므로, 범위에 필요한 네임스페이스를 모두 담는다
 * (목록은 scripts/gen-client-i18n-namespaces.mjs 가 import 그래프로 자동 산출).
 */
export default async function ScopedIntlProvider({ scope, locale: localeParam, children }: Props) {
    const locale = hasLocale(routing.locales, localeParam) ? localeParam : routing.defaultLocale
    const messages = await getMessages({ locale })
    return (
        <NextIntlClientProvider locale={locale} messages={pickClientMessages(messages, scope)}>
            {children}
        </NextIntlClientProvider>
    )
}
