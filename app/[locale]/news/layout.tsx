import ScopedIntlProvider from '@/components/i18n/ScopedIntlProvider'

type Props = {
    children: React.ReactNode
    params: Promise<{ locale: string }>
}

export default async function NewsLayout({ children, params }: Props) {
    const { locale } = await params
    return <ScopedIntlProvider scope="news" locale={locale}>{children}</ScopedIntlProvider>
}
