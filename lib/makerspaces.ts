export type MakerspaceId = 'hongdae' | 'gumi' | 'jeonju'

export type Makerspace = {
    id: MakerspaceId
    name: string
    label: string
    address: string
    addressDetail?: string
    /** 초기 표시용 좌표 (카카오 주소검색으로 보정 가능) */
    lat: number
    lng: number
    phone?: string
    hours?: string
    transit?: string
}

/** 푸터·찾아오는길 페이지 공통 제작센터(메이커스페이스) 목록 */
export const MAKERSPACES: Makerspace[] = [
    {
        id: 'hongdae',
        name: '홍대센터',
        label: '서울 · 홍대',
        address: '서울시 마포구 독막로 93',
        addressDetail: '상수빌딩 4층',
        lat: 37.5479183,
        lng: 126.9237718,
        phone: '02-3144-3137',
        hours: '평일 09:00 – 18:00',
        transit: '상수역·합정역 인근',
    },
    {
        id: 'gumi',
        name: '구미센터',
        label: '경북 · 구미',
        address: '경북 구미시 산호대로 253',
        lat: 36.1057,
        lng: 128.3885,
        phone: '054-464-3144',
        hours: '평일 09:00 – 18:00',
        transit: '구미 공단동 · 산호대로',
    },
    {
        id: 'jeonju',
        name: '전주센터',
        label: '전북 · 전주',
        address: '전북 전주시 반룡로 109',
        lat: 35.8577693,
        lng: 127.0862573,
        hours: '평일 09:00 – 18:00',
        transit: '덕진구 · 반룡로',
    },
]

export function getMakerspace(id: string | null | undefined): Makerspace | undefined {
    if (!id) return undefined
    return MAKERSPACES.find((c) => c.id === id)
}

export function kakaoMapViewUrl(center: Pick<Makerspace, 'name' | 'lat' | 'lng'>): string {
    return `https://map.kakao.com/link/map/${encodeURIComponent(center.name)},${center.lat},${center.lng}`
}

export function kakaoMapDirectionsUrl(center: Pick<Makerspace, 'name' | 'lat' | 'lng'>): string {
    return `https://map.kakao.com/link/to/${encodeURIComponent(center.name)},${center.lat},${center.lng}`
}
