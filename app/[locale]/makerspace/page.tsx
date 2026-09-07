import type { Metadata } from 'next'
import MakerspaceVisitClient from '@/components/makerspace/MakerspaceVisitClient'
import { MAKERSPACES } from '@/lib/makerspaces'
import { SITE_URL } from '@/lib/site-url'

export const metadata: Metadata = {
    title: '메이커스페이스 찾아오는길 | 홍대·구미·전주 제작센터',
    description:
        '와우쓰리디 메이커스페이스(제작센터) 찾아오는길. 홍대센터·구미센터·전주센터 위치와 카카오맵 길안내를 확인하세요.',
    alternates: { canonical: '/makerspace' },
    openGraph: {
        title: '메이커스페이스 찾아오는길 | WOW3D',
        description: '홍대·구미·전주 제작센터 위치와 카카오맵 길안내',
        url: `${SITE_URL}/makerspace`,
        type: 'website',
    },
}

export default function MakerspacePage() {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'WOW3D 메이커스페이스(제작센터)',
        itemListElement: MAKERSPACES.map((center, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            item: {
                '@type': 'Place',
                name: `WOW3D ${center.name}`,
                address: {
                    '@type': 'PostalAddress',
                    streetAddress: center.addressDetail
                        ? `${center.address} ${center.addressDetail}`
                        : center.address,
                    addressCountry: 'KR',
                },
                geo: {
                    '@type': 'GeoCoordinates',
                    latitude: center.lat,
                    longitude: center.lng,
                },
                ...(center.phone ? { telephone: center.phone } : {}),
            },
        })),
    }

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <MakerspaceVisitClient />
        </>
    )
}
