'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'
import { correctDisplayAmount } from '@/lib/amount-display'
import { parseDbDateTime } from '@/lib/date-utils'
import { getStoredAdminToken } from '@/lib/client-admin-auth'
import { normalizeEstimateViewToken } from '@/lib/quotation-view-token'
import {
  DEFAULT_SHIPPING_SETTINGS,
  formatFreeShippingHint,
  parseShippingSettings,
  resolveShippingFee,
  type ShippingSettings,
} from '@/lib/shipping-settings'

function getPersistedUserToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('wow3d-auth')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    const t = parsed?.state?.token
    return typeof t === 'string' && t.trim() ? t : null
  } catch {
    return null
  }
}

function formatEstimateDate(value: string | Date | null | undefined, locale: string): string {
  const d = value ? parseDbDateTime(value) : new Date()
  if (!d) return '-'
  return d.toLocaleDateString(locale === 'en' ? 'en-US' : 'ko-KR', { timeZone: 'Asia/Seoul' })
}

type CompanyInfo = {
  business_number?: string
  company_name?: string
  representative?: string
  business_type?: string
  business_item?: string
  address?: string
  phone?: string
  fax?: string
  email?: string
  logo_url?: string
  estimate_valid_days?: number
  estimate_header_note?: string
  estimate_footer_note?: string
  bank_name?: string
  bank_account?: string
  bank_holder?: string
  seal_url?: string
}

const DEFAULT_COMPANY: CompanyInfo = {
  company_name: '와우쓰리디(Wow3D)',
  representative: '서정주',
  business_type: '제조업',
  business_item: '3D프린팅',
  address: '서울시 금천구 가산디지털1로 1, 101호',
  estimate_valid_days: 14,
  seal_url: '',
}

export default function EstimatePrintPage() {
  const t = useTranslations('Print')
  const locale = useLocale()
  const params = useParams()
  const searchParams = useSearchParams()
  const id = params?.id
  const isTemp = searchParams.get('temp') === 'true'
  const token = normalizeEstimateViewToken(searchParams.get('token'))

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState('')
  const [errorHint, setErrorHint] = useState('')
  const [company, setCompany] = useState<CompanyInfo>(DEFAULT_COMPANY)
  const [shippingSettings, setShippingSettings] = useState<ShippingSettings>(DEFAULT_SHIPPING_SETTINGS)

  useEffect(() => {
    if (!id) return

    if (token) {
      fetch(`/api/orders/${id}/estimate?token=${encodeURIComponent(token)}`)
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.data) {
            const { order, items, company: dbCompany, shippingSettings: rows } = json.data
            setData({ order, items, shipping_fee: json.data.shipping_fee })
            if (dbCompany) {
              setCompany({ ...DEFAULT_COMPANY, ...dbCompany })
            }
            if (rows) setShippingSettings(parseShippingSettings(rows))
          } else {
            setError(json.error || t('errorLoadEstimate'))
            setErrorHint(t('errorHintToken'))
          }
        })
        .catch((err) => {
          setError(t('errorLoadData'))
          setErrorHint(t('errorHintRetry'))
          console.error(err)
        })
        .finally(() => setLoading(false))
      return
    }

    const userToken = getPersistedUserToken()
    if (userToken) {
      fetch(`/api/orders/${id}/estimate`, {
        headers: { Authorization: `Bearer ${userToken}` },
      })
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.data) {
            const { order, items, company: dbCompany, shippingSettings: rows } = json.data
            setData({ order, items, shipping_fee: json.data.shipping_fee })
            if (dbCompany) {
              setCompany({ ...DEFAULT_COMPANY, ...dbCompany })
            }
            if (rows) setShippingSettings(parseShippingSettings(rows))
            setLoading(false)
            return true
          }
          return false
        })
        .then((ok) => {
          if (ok) return
          loadAdminEstimate()
        })
        .catch(() => loadAdminEstimate())
      return
    }

    loadAdminEstimate()

    function loadAdminEstimate() {
      const savedToken = getStoredAdminToken()
      const authHeader: Record<string, string> = {}
      if (savedToken) authHeader['Authorization'] = `Bearer ${savedToken}`

      if (savedToken) {
        fetch('/api/admin/company', { headers: authHeader })
          .then((r) => r.json())
          .then((json) => {
            if (json.success && json.data) {
              setCompany({ ...DEFAULT_COMPANY, ...json.data })
            }
          })
          .catch((e) => console.warn('Company info load failed', e))
      }

      fetch('/api/settings')
        .then((r) => r.json())
        .then((json) => {
          if (json.success && Array.isArray(json.data)) {
            setShippingSettings(parseShippingSettings(json.data))
          }
        })
        .catch(() => {})

      if (isTemp) {
        try {
          const stored = localStorage.getItem(`quote_temp_${id}`)
          if (stored) {
            setData(JSON.parse(stored))
            setLoading(false)
            return
          }
        } catch (e) {
          console.error('Failed to load temp quote', e)
        }
      }

      fetch(`/api/admin/orders/${id}`, { headers: authHeader })
        .then((res) => res.json())
        .then((json) => {
          if (json.success) {
            setData(json.data)
          } else {
            setError(json.error || t('errorLoadOrder'))
            setErrorHint(savedToken ? t('errorHintAdmin') : t('errorHintUser'))
          }
        })
        .catch((err) => {
          setError(t('errorLoadData'))
          setErrorHint(t('errorHintRetry'))
          console.error(err)
        })
        .finally(() => setLoading(false))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- id/token drive fetch; t is stable enough for UI copy
  }, [id, isTemp, token])

  const orderNumber = data?.order?.order_number
  useEffect(() => {
    if (orderNumber) {
      const prev = document.title
      document.title = t('documentTitle', { orderNumber })
      return () => {
        document.title = prev
      }
    }
  }, [orderNumber, t])

  const displayItems = useMemo(() => {
    if (!data) return []
    const { order, items: apiItems } = data
    const hasExpert = order?.has_expert_quote || order?.hasExpertQuote
    const rawExpert = order?.expert_quote_data ?? order?.expertQuoteData
    if (hasExpert && rawExpert) {
      try {
        const expert = typeof rawExpert === 'string' ? JSON.parse(rawExpert) : rawExpert
        const list = expert?.items
        if (Array.isArray(list) && list.length > 0) {
          return list.map((it: any, idx: number) => {
            const unitPrice = Math.round(Number(it.unit_price) || 0)
            const qty = Math.max(1, Number(it.quantity) || 1)
            return {
              id: it.id ?? idx,
              file_name: it.name ?? it.file_name ?? t('itemFallback', { n: idx + 1 }),
              print_method: it.spec ?? it.print_method ?? '',
              material_name: it.material_name ?? '',
              quantity: qty,
              unit_price: unitPrice,
              subtotal: unitPrice * qty,
            }
          })
        }
      } catch (_) {}
    }
    return (apiItems || []).map((item: any) => {
      const raw = Number(item.unit_price || 0)
      const unitPrice = correctDisplayAmount(raw) ?? Math.round(raw)
      const qty = Math.max(1, Number(item.quantity) || 1)
      return {
        ...item,
        unit_price: unitPrice,
        subtotal: unitPrice * qty,
      }
    })
  }, [data, t])

  const totalAmount = displayItems.reduce(
    (acc: number, item: any) =>
      acc + Math.round(Number(item.unit_price || 0) * Number(item.quantity || 0)),
    0
  )

  const shippingOverride = useMemo(() => {
    if (!data) return null
    if (data.shipping_fee != null && data.shipping_fee !== '') {
      const n = Number(data.shipping_fee)
      return Number.isFinite(n) ? n : null
    }
    const rawExpert = data.order?.expert_quote_data ?? data.order?.expertQuoteData
    if (!rawExpert) return null
    try {
      const expert = typeof rawExpert === 'string' ? JSON.parse(rawExpert) : rawExpert
      if (expert?.shipping_fee != null && expert.shipping_fee !== '') {
        const n = Number(expert.shipping_fee)
        return Number.isFinite(n) ? n : null
      }
    } catch {
      /* ignore */
    }
    return null
  }, [data])

  const shippingFee = resolveShippingFee(totalAmount, shippingSettings, shippingOverride)
  const grandTotal = totalAmount + shippingFee
  const totalSupply = Math.round(grandTotal / 1.1)
  const totalVat = grandTotal - totalSupply
  const shippingHint = formatFreeShippingHint(shippingSettings.freeThreshold, locale)
  const footerLines = [
    ...(company.estimate_footer_note
      ? company.estimate_footer_note.split('\n').filter(Boolean)
      : [
          t('footerValidDays', { days: company.estimate_valid_days || 14 }),
          t('footerSpecChange'),
          t('footerBaseDoc'),
        ]),
    shippingFee > 0
      ? t('footerShippingPaid', {
          fee: shippingFee.toLocaleString(locale === 'en' ? 'en-US' : 'ko-KR'),
          hint: shippingHint,
        })
      : t('footerShippingFree', { hint: shippingHint }),
  ]

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    )

  if (error)
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-4 text-center p-8">
        <div className="text-red-500 text-lg font-bold">
          {token ? t('errorTitleToken') : t('errorTitleAccess')}
        </div>
        <div className="text-slate-600 text-sm max-w-sm">{error}</div>
        {errorHint && <div className="text-slate-400 text-xs mt-2 max-w-sm">{errorHint}</div>}
      </div>
    )

  if (!data) return null

  const { order } = data
  const estimateDate = formatEstimateDate(order.created_at, locale)

  return (
    <div className="bg-white text-black min-h-screen">
      <style jsx global>{`
        @page {
          size: A4;
          margin: 12mm;
        }
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          thead {
            display: table-header-group;
          }
          tfoot {
            display: table-footer-group;
          }
          tr {
            break-inside: avoid;
          }
          .print-avoid-break {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="print:hidden bg-slate-800 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <span className="text-white text-sm font-medium">{t('previewBar')}</span>
        <div className="flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-3">
          <span className="text-xs text-slate-400 max-w-[240px] sm:max-w-none">{t('previewPdfHint')}</span>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => window.close()}
              className="px-4 py-1.5 text-sm text-slate-300 hover:text-white border border-slate-600 rounded transition-colors"
            >
              {t('close')}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-5 py-1.5 text-sm bg-slate-600 hover:bg-slate-500 text-white rounded font-bold transition-colors"
            >
              {t('print')}
            </button>
          </div>
        </div>
      </div>

      <div className="p-8 md:p-12 print:p-6">
        <div className="max-w-[210mm] mx-auto bg-white print:max-w-none">
          <div className="flex justify-between items-start mb-10 border-b-2 border-black pb-4">
            <div className="flex items-center gap-4">
              {company.logo_url && (
                <img src={company.logo_url} alt="company logo" className="h-14 object-contain" />
              )}
              <div>
                <h1 className="text-4xl font-serif font-bold tracking-widest">{t('title')}</h1>
                {company.company_name && (
                  <div className="text-sm text-slate-500 mt-1">{company.company_name}</div>
                )}
              </div>
            </div>
            <div className="text-sm text-right">
              <div className="font-bold mb-1">
                {t('estimateNumber')} : {order.order_number}
              </div>
              <div>{t('estimateDate')} : {estimateDate}</div>
            </div>
          </div>

          {company.estimate_header_note && (
            <div className="mb-6 text-sm text-slate-600 italic border-l-4 border-slate-300 pl-3">
              {company.estimate_header_note}
            </div>
          )}

          <div className="flex flex-row gap-0 border border-black mb-6">
            <div className="flex-1 min-w-0 p-0 border-r border-black">
              <div className="bg-slate-100 py-1.5 px-2 text-center font-bold border-b border-black text-xs">
                {t('buyerTitle')}
              </div>
              <div className="p-2 space-y-1 text-xs">
                <InfoRow label={t('labelName')} value={order.recipient_name} compact />
                <InfoRow label={t('labelPhone')} value={order.recipient_phone} compact />
                <InfoRow
                  label={t('labelEmail')}
                  value={order.user_email || order.guest_email || '-'}
                  compact
                />
                <InfoRow label={t('labelAddress')} value={order.shipping_address} compact />
              </div>
            </div>

            <div className="flex-1 min-w-0 p-0">
              <div className="bg-slate-100 py-1.5 px-2 text-center font-bold border-b border-black text-xs">
                {t('sellerTitle')}
              </div>
              <div className="p-2 space-y-1 text-xs relative">
                {company.business_number && (
                  <InfoRow label={t('labelBizNumber')} value={company.business_number} compact />
                )}
                <div className="flex min-w-0 gap-2">
                  <div className="flex items-center shrink-0">
                    <span className="w-[4.5rem] flex-shrink-0 font-bold text-slate-500 whitespace-nowrap">
                      {t('labelCompany')}
                    </span>
                    <span className="font-bold text-sm whitespace-nowrap">{company.company_name}</span>
                  </div>
                  <div className="flex items-center ml-4">
                    <span className="w-11 flex-shrink-0 font-bold text-slate-500 whitespace-nowrap">
                      {t('labelCeo')}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-sm whitespace-nowrap">
                        {company.representative}
                      </span>
                      <div className="relative flex items-center justify-center ml-1">
                        <span className="border border-red-500 text-red-500 rounded-sm px-1 text-[10px] select-none flex-shrink-0 opacity-40 font-bold">
                          {t('sealMark')}
                        </span>
                        {company.seal_url && (
                          <img
                            src={company.seal_url}
                            alt="seal"
                            className="absolute w-12 h-12 min-w-[3rem] object-contain rotate-[-5deg] print:opacity-100"
                            style={{
                              left: '50%',
                              top: '50%',
                              transform: 'translate(-50%, -50%) rotate(-5deg)',
                              maxWidth: 'none',
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                {company.address && (
                  <InfoRow label={t('labelBizAddress')} value={company.address} compact />
                )}
                {(company.business_type || company.business_item) && (
                  <InfoRow
                    label={t('labelBizType')}
                    value={`${company.business_type || ''} / ${company.business_item || ''}`}
                    compact
                  />
                )}
                {company.phone && <InfoRow label={t('labelTel')} value={company.phone} compact />}
              </div>
            </div>
          </div>

          <div className="print-avoid-break border-b-2 border-black pb-2 mb-6 space-y-2">
            <div className="flex justify-between items-end text-sm">
              <span className="text-slate-600">{t('itemsSubtotalVat')}</span>
              <span>₩ {totalAmount.toLocaleString(locale === 'en' ? 'en-US' : 'ko-KR')}</span>
            </div>
            <div className="flex justify-between items-end text-sm">
              <span className="text-slate-600">
                {t('shipping')}
                {shippingFee > 0 ? (
                  <span className="text-xs text-slate-400 ml-2">({shippingHint})</span>
                ) : null}
              </span>
              <span>
                {shippingFee === 0
                  ? t('shippingFree')
                  : `₩ ${shippingFee.toLocaleString(locale === 'en' ? 'en-US' : 'ko-KR')}`}
              </span>
            </div>
            <div className="flex justify-between items-end pt-1">
              <span className="font-bold text-lg">{t('grandTotal')}</span>
              <span className="text-2xl font-bold">
                ₩ {grandTotal.toLocaleString(locale === 'en' ? 'en-US' : 'ko-KR')}
                <span className="text-sm font-normal text-slate-600"> {t('vatIncluded')}</span>
              </span>
            </div>
          </div>

          <table className="w-full text-sm border-collapse mb-8 border border-black">
            <thead>
              <tr className="bg-slate-100 text-center">
                <th className="border border-black p-2 font-bold w-10">{t('colNo')}</th>
                <th className="border border-black p-2 font-bold">{t('colItem')}</th>
                <th className="border border-black p-2 font-bold w-14">{t('colQty')}</th>
                <th className="border border-black p-2 font-bold w-24">{t('colUnit')}</th>
                <th className="border border-black p-2 font-bold w-24">{t('colSupply')}</th>
                <th className="border border-black p-2 font-bold w-20">{t('colVat')}</th>
              </tr>
            </thead>
            <tbody>
              {displayItems.map((item: any, idx: number) => {
                const itemTotal = Math.round(
                  Number(item.unit_price || 0) * Number(item.quantity || 0)
                )
                const itemSupply = Math.round(itemTotal / 1.1)
                const itemVat = itemTotal - itemSupply
                const numLocale = locale === 'en' ? 'en-US' : 'ko-KR'
                return (
                  <tr key={item.id ?? idx} className="text-center">
                    <td className="border border-black p-2">{idx + 1}</td>
                    <td className="border border-black p-2 text-left">
                      <div className="font-bold">{item.file_name}</div>
                      <div className="text-xs text-slate-500">
                        {item.print_method ? String(item.print_method).toUpperCase() : ''}
                        {item.material_name ? ` / ${item.material_name}` : ''}
                      </div>
                    </td>
                    <td className="border border-black p-2">{item.quantity}</td>
                    <td className="border border-black p-2 text-right">
                      {Number(item.unit_price || 0).toLocaleString(numLocale)}
                    </td>
                    <td className="border border-black p-2 text-right">
                      {itemSupply.toLocaleString(numLocale)}
                    </td>
                    <td className="border border-black p-2 text-right">
                      {itemVat.toLocaleString(numLocale)}
                    </td>
                  </tr>
                )
              })}
              {Array.from({ length: Math.max(0, 10 - displayItems.length) }).map((_, i) => (
                <tr key={`empty-${i}`} className="text-center h-8">
                  {[...Array(6)].map((_, j) => (
                    <td key={j} className="border border-black p-2"></td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 font-bold">
                <td className="border border-black p-2 text-center" colSpan={2}>
                  {t('rowItemsTotal')}
                </td>
                <td className="border border-black p-2 text-center">
                  {displayItems.reduce(
                    (acc: number, curr: any) => acc + Number(curr.quantity || 0),
                    0
                  )}
                </td>
                <td className="border border-black p-2 text-right">-</td>
                <td className="border border-black p-2 text-right">
                  {Math.round(totalAmount / 1.1).toLocaleString(
                    locale === 'en' ? 'en-US' : 'ko-KR'
                  )}
                </td>
                <td className="border border-black p-2 text-right">
                  {(totalAmount - Math.round(totalAmount / 1.1)).toLocaleString(
                    locale === 'en' ? 'en-US' : 'ko-KR'
                  )}
                </td>
              </tr>
              <tr className="bg-white">
                <td className="border border-black p-2 text-center" colSpan={2}>
                  {t('rowShipping')}
                </td>
                <td className="border border-black p-2 text-center">-</td>
                <td className="border border-black p-2 text-right">-</td>
                <td className="border border-black p-2 text-right" colSpan={2}>
                  {shippingFee === 0
                    ? t('shippingFree')
                    : `₩ ${shippingFee.toLocaleString(locale === 'en' ? 'en-US' : 'ko-KR')}`}
                </td>
              </tr>
              <tr className="bg-slate-50 font-bold">
                <td className="border border-black p-2 text-center" colSpan={2}>
                  {t('rowGrandTotal')}
                </td>
                <td className="border border-black p-2 text-center">-</td>
                <td className="border border-black p-2 text-right">-</td>
                <td className="border border-black p-2 text-right">
                  {totalSupply.toLocaleString(locale === 'en' ? 'en-US' : 'ko-KR')}
                </td>
                <td className="border border-black p-2 text-right">
                  {totalVat.toLocaleString(locale === 'en' ? 'en-US' : 'ko-KR')}
                </td>
              </tr>
            </tfoot>
          </table>

          {(company.bank_name || company.bank_account) && (
            <div className="mb-6 p-3 border border-slate-300 rounded text-sm">
              <span className="font-bold text-slate-700">{t('bankAccount')}</span>{' '}
              {company.bank_name} {company.bank_account}
              {company.bank_holder ? ` (${company.bank_holder})` : ''}
            </div>
          )}

          <div className="print-avoid-break mt-6 text-sm space-y-2">
            <p className="font-bold border-b border-black inline-block mb-2">{t('notesTitle')}</p>
            <ul className="list-disc list-inside space-y-1 text-slate-700">
              {footerLines.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </div>

          <div className="mt-16 text-center">
            <p className="text-lg font-serif">{t('signLine')}</p>
            <p className="mt-4 font-bold">{estimateDate}</p>
            <p className="mt-2 font-bold text-xl">
              {company.company_name || t('defaultCompany')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoRow({
  label,
  value,
  compact,
}: {
  label: string
  value?: string
  compact?: boolean
}) {
  if (!value) return null
  return (
    <div className="flex min-w-0">
      <span className={`font-bold text-slate-500 flex-shrink-0 ${compact ? 'w-14' : 'w-20'}`}>
        {label}
      </span>
      <span className="flex-1 min-w-0 break-words">{value}</span>
    </div>
  )
}
