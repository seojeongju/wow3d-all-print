/**
 * 홈 히어로 "맞물림 기어열" 데이터 (자동 생성).
 * 인볼류트 기어 4개(잇수 36·24·18·12, 모듈 1)를 3D프린팅 질감으로 정면 렌더링한 투명 WebP와 배치값.
 * - 좌표·크기 단위는 모듈(1) 기준, 박스는 84.641×53.676
 * - 맞물리는 쌍의 중심거리 = 피치원 반지름 합, theta0는 상대 기어의 이홈에 이가 들어가도록 계산한 시작 각도(°, 시계 방향 +)
 * - periodS는 한 바퀴 시간(잇수에 비례), dir는 회전 방향(1 시계 · -1 반시계) — 맞물린 기어끼리 반대
 */
export const GEAR_TRAIN_SIZE = { width: 84.641, height: 53.676 } as const;

export type TrainGear = { z: number; src: string; cx: number; cy: number; half: number; theta0: number; periodS: number; dir: 1 | -1 };

export const GEAR_TRAIN: TrainGear[] = [
    { z: 36, src: '/images/hero/gears/gear-36.webp', cx: 40.481, cy: 24.176, half: 20.2, theta0: 0, periodS: 24, dir: 1 },
    { z: 18, src: '/images/hero/gears/gear-18.webp', cx: 64.32, cy: 11.5, half: 11.2, theta0: 106, periodS: 12, dir: -1 },
    { z: 24, src: '/images/hero/gears/gear-24.webp', cx: 14.5, cy: 39.176, half: 14.2, theta0: 202.5, periodS: 16, dir: -1 },
    { z: 12, src: '/images/hero/gears/gear-12.webp', cx: 76.141, cy: 20.735, half: 8.2, theta0: 131, periodS: 8, dir: 1 },
];
