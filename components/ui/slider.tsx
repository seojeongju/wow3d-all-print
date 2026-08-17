"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
    value: number[]
    onValueChange: (value: number[]) => void
    max?: number
    min?: number
    step?: number
    className?: string
}

export function Slider({
    value,
    onValueChange,
    min = 0,
    max = 100,
    step = 1,
    className,
    onPointerDown,
    ...props
}: SliderProps) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onValueChange([parseFloat(e.target.value)])
    }

    /** 드래그 중 옆 메뉴 텍스트가 선택·끌려가지 않도록 */
    const handlePointerDown = (e: React.PointerEvent<HTMLInputElement>) => {
        window.getSelection()?.removeAllRanges()
        document.body.classList.add('select-none')
        const release = () => {
            document.body.classList.remove('select-none')
            window.removeEventListener('pointerup', release)
            window.removeEventListener('pointercancel', release)
        }
        window.addEventListener('pointerup', release)
        window.addEventListener('pointercancel', release)
        onPointerDown?.(e)
    }

    return (
        <input
            type="range"
            value={value[0]}
            onChange={handleChange}
            min={min}
            max={max}
            step={step}
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
            onPointerDown={handlePointerDown}
            className={cn(
                "w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 select-none touch-none",
                className
            )}
            {...props}
        />
    )
}
