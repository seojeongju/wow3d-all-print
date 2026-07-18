/** 네이버 톡톡 스타일 말풍선 아이콘 (흰색 아웃라인) */
export function NaverTalkTalkIcon({ className = 'w-7 h-7' }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            aria-hidden
        >
            {/* 원형 말풍선 + 좌하단 꼬리 */}
            <path
                d="M12 3.5c-4.42 0-8 3.13-8 7 0 2.42 1.28 4.55 3.25 5.78L6.2 20.1c-.2.35.18.74.55.6l3.7-1.42c.5.12 1.02.18 1.55.18 4.42 0 8-3.13 8-7s-3.58-7-8-7Z"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinejoin="round"
                strokeLinecap="round"
            />
        </svg>
    );
}
