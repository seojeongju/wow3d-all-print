import type { AbstractIntlMessages } from 'next-intl'
import { CLIENT_NAMESPACES, type ClientNamespaceScope } from './client-namespaces.generated'

/** 범위(세그먼트)에서 클라이언트 컴포넌트가 쓰는 네임스페이스만 골라 직렬화 크기를 줄인다 */
export function pickClientMessages(
    messages: AbstractIntlMessages,
    scope: ClientNamespaceScope
): AbstractIntlMessages {
    const out: AbstractIntlMessages = {}
    for (const ns of CLIENT_NAMESPACES[scope]) {
        if (ns in messages) out[ns] = messages[ns]
    }
    return out
}
