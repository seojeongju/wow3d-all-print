import ScopedIntlProvider from '@/components/i18n/ScopedIntlProvider'

export default async function QnALayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  return <ScopedIntlProvider scope="qna" locale={locale}>{children}</ScopedIntlProvider>
}
