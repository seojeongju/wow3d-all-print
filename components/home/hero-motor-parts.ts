/**
 * 홈 히어로 '모터 분해·조립' 레이어 데이터 (자동 생성).
 * 실사 분해도 이미지를 배경 제거 → 3D프린팅 질감(무광 PLA·틸 PETG·적층 링) 변환 → 부품 5개(+볼트) 레이어로 분리했다.
 * 좌표는 원본 1100×825px 기준, s는 모터 축 방향으로 전체 중심에서의 거리(px).
 */
export const MOTOR_SIZE = { width: 1100, height: 825 } as const;
/** 모터 축 방향 단위 벡터 (조립 시 이 방향으로 모임) */
export const MOTOR_AXIS = [0.9859, 0.1676] as const;

export type MotorLayer = { kind: 'body' | 'bolts'; src: string; x: number; y: number; w: number; h: number };
export type MotorGroup = { s: number; center: readonly [number, number]; layers: MotorLayer[] };

export const MOTOR_GROUPS: MotorGroup[] = [
    {
        s: -343,
        center: [
            183,
            343
        ],
        layers: [
            {
                kind: 'body',
                src: '/images/hero/motor/part-1-body.webp',
                x: 19,
                y: 122,
                w: 274,
                h: 444
            },
            {
                kind: 'bolts',
                src: '/images/hero/motor/part-1-bolts.webp',
                x: 22,
                y: 74,
                w: 242,
                h: 531
            }
        ]
    },
    {
        s: -187,
        center: [
            337,
            369
        ],
        layers: [
            {
                kind: 'body',
                src: '/images/hero/motor/part-2-body.webp',
                x: 270,
                y: 193,
                w: 133,
                h: 339
            },
            {
                kind: 'bolts',
                src: '/images/hero/motor/part-2-bolts.webp',
                x: 264,
                y: 137,
                w: 113,
                h: 433
            }
        ]
    },
    {
        s: -25,
        center: [
            498,
            387
        ],
        layers: [
            {
                kind: 'body',
                src: '/images/hero/motor/part-3-body.webp',
                x: 385,
                y: 236,
                w: 232,
                h: 302
            }
        ]
    },
    {
        s: 156,
        center: [
            675,
            427
        ],
        layers: [
            {
                kind: 'body',
                src: '/images/hero/motor/part-4-body.webp',
                x: 598,
                y: 305,
                w: 152,
                h: 244
            },
            {
                kind: 'bolts',
                src: '/images/hero/motor/part-4-bolts.webp',
                x: 595,
                y: 269,
                w: 155,
                h: 301
            }
        ]
    },
    {
        s: 376,
        center: [
            893,
            459
        ],
        layers: [
            {
                kind: 'body',
                src: '/images/hero/motor/part-5-body.webp',
                x: 746,
                y: 284,
                w: 331,
                h: 340
            },
            {
                kind: 'bolts',
                src: '/images/hero/motor/part-5-bolts.webp',
                x: 746,
                y: 318,
                w: 302,
                h: 260
            }
        ]
    }
];
