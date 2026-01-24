// 견적 데이터 타입 정의

export interface QuoteData {
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
}

export interface Quote extends QuoteData {
    id: number;
    userId?: number;
    sessionId?: string;
    createdAt: string;
    updatedAt: string;
}

export interface User {
    id: number;
    email: string;
    name: string;
    phone?: string;
    role?: 'user' | 'admin';
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
    status: 'pending' | 'confirmed' | 'production' | 'shipping' | 'completed' | 'cancelled';
    paymentMethod?: string;
    paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
    customerNote?: string;
    adminNote?: string;
    createdAt: string;
    updatedAt: string;
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
