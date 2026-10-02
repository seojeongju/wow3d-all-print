// 견적 데이터 타입 정의

export interface QuoteData {
    id?: number;
    // 파일 정보
    fileName: string;
    fileSize: number;
    fileUrl?: string;

    // 지오메트리 정보
    volumeCm3: number;
    surfaceAreaCm2: number;
    dimensionsX: number;
    dimensionsY: number;
    dimensionsZ: number;
    /** 현재 배치(바닥 방향) 기준 서포트 오버행 면적 — 서버 재계산용 */
    overhangAreaCm2?: number;
    /** 현재 배치 기준 서포트 그림자 부피 — 서버 재계산용 */
    supportVolumeCm3?: number;
    /** 현재 배치 기준 측면·윗면·바닥·베드 접촉 면적 — 서버 출력 시간 재계산용 */
    lateralAreaCm2?: number;
    topAreaCm2?: number;
    bottomAreaCm2?: number;
    bedAreaCm2?: number;
    /** 현재 배치 기준 외벽 오버행 감속 추가분 (등가 측면 cm²) */
    slowWallAreaCm2?: number;
    /** 현재 배치 기준 곡선 윤곽 측면 (cm²) */
    curvedWallAreaCm2?: number;
    /** 현재 배치 기준 단면 윤곽 루프 수 × 높이 (루프·mm) */
    contourLoopsMm?: number;
    /** 다중 객체 3MF 플레이트 — 객체 수·객체 높이 합(mm)·이웃 객체 평균 거리(mm) */
    partCount?: number;
    partHeightSumMm?: number;
    partSpacingMm?: number;

    // 출력 방식
    printMethod: 'fdm' | 'sla' | 'dlp';

    // FDM 옵션
    fdmMaterial?: 'PLA' | 'ABS' | 'PETG' | 'TPU';
    fdmInfill?: number;
    fdmLayerHeight?: number;
    fdmSupport?: boolean;

    // SLA/DLP 옵션
    resinType?: 'Standard' | 'Tough' | 'Clear' | 'Flexible';
    layerThickness?: number;
    postProcessing?: boolean;

    // 가격 정보
    totalPrice: number;
    estimatedTimeHours: number;
    /** 1개당 변동비(공급가) — 수량 배치 견적용 */
    variableCostKrw?: number;
    /** 건당 셋업(공급가) */
    setupCostKrw?: number;
    /** 견적 시점 최소(기본) 금액 */
    minPriceKrw?: number;

    // 가이드 유입 정보
    guideSource?: string;
    guideTopic?: string;

    /** 뷰어에서 적용한 스케일·평면 배치·90° 회전 — 관리자 STL 다운로드 시 베이크 */
    modelTransform?: {
        scalePercent: number;
        rotX: number;
        rotY: number;
        rotZ: number;
        snapToBed?: boolean;
        /** 바닥에 놓은 평면의 바깥 법선 (원본 좌표) */
        layFlat?: [number, number, number] | null;
    };
}

export interface Quote extends QuoteData {
    id: number;
    userId?: number;
    sessionId?: string;
    createdAt: string;
    updatedAt: string;
    /** STL 등에서 생성한 썸네일 data URL (장바구니 미리보기용) */
    thumbnailDataUrl?: string;
}

export interface User {
    id: number;
    email: string;
    name: string;
    phone?: string;
    role?: 'user' | 'admin' | 'super_admin';
    store_id?: number;
    createdAt: string;
    updatedAt: string;
}

export interface CartItem {
    id: number;
    userId?: number;
    sessionId?: string;
    quoteId: number;
    quantity: number;
    createdAt: string;
    quote?: Quote;
}

export interface Order {
    id: number;
    userId: number;
    orderNumber: string;
    recipientName: string;
    recipientPhone: string;
    shippingAddress: string;
    shippingPostalCode?: string;
    totalAmount: number;
    status: 'pending' | 'confirmed' | 'quote_sent' | 'payment_confirmed' | 'production' | 'shipping' | 'delivered' | 'completed' | 'cancelled';
    paymentMethod?: string;
    paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
    customerNote?: string;
    adminNote?: string;
    createdAt: string;
    updatedAt: string;
    items?: OrderItem[];
    /** 수정견적 JSON */
    expertQuoteData?: string | null;
    hasExpertQuote?: boolean;
    quotationSentAt?: string | null;
    /** 마이페이지에서 견적서 보기 가능 여부 */
    canViewEstimate?: boolean;
}

export interface OrderItem {
    id: number;
    orderId: number;
    quoteId: number;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    createdAt: string;
    quote?: Quote;
}

export interface Shipment {
    id: number;
    orderId: number;
    trackingNumber?: string;
    carrier?: string;
    shippedAt?: string;
    deliveredAt?: string;
    status: 'preparing' | 'shipped' | 'in_transit' | 'delivered';
    createdAt: string;
    updatedAt: string;
}

// Admin & Settings Types
export interface Material {
    id: number;
    name: string;
    type: string;
    pricePerGram: number;
    pricePerMl?: number | null; // SLA/DLP용 원/mL
    density: number;
    colors: string[]; // Parsed from JSON
    isActive: boolean;
    description?: string;
}

export interface PrintSetting {
    key: string;
    value: string;
    category: string;
    description?: string;
    updatedAt: string;
}

export interface Inquiry {
    id: number;
    userId?: number;
    name: string;
    email: string;
    phone?: string;
    category?: 'general' | 'quote' | 'tech' | 'partnership' | 'other';
    subject?: string;
    message: string;
    status: 'new' | 'read' | 'replied' | 'closed';
    adminNote?: string;
    createdAt: string;
    updatedAt: string;
}
