import ScopedIntlProvider from '@/components/i18n/ScopedIntlProvider'

type Props = {
    children: React.ReactNode
    params: Promise<{ locale: string }>
}

export default async function UseCasesLayout({ children, params }: Props) {
    const { locale } = await params
    return <ScopedIntlProvider scope="use-cases" locale={locale}>{children}</ScopedIntlProvider>
}
