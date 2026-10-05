import ScopedIntlProvider from '@/components/i18n/ScopedIntlProvider'

type Props = {
    children: React.ReactNode
    params: Promise<{ locale: string }>
}

export default async function HardwareLayout({ children, params }: Props) {
    const { locale } = await params
    return <ScopedIntlProvider scope="hardware" locale={locale}>{children}</ScopedIntlProvider>
}
