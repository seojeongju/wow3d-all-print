'use client';

import { CheckCircle2, Package, Truck, Settings, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface OrderTimelineProps {
    status: string;
}

export default function OrderTimeline({ status }: OrderTimelineProps) {
    const steps = [
        { key: 'pending', label: '접수 대기', icon: Clock },
        { key: 'confirmed', label: '주문 확인', icon: CheckCircle2 },
        { key: 'production', label: '제작 중', icon: Settings },
        { key: 'shipping', label: '배송 중', icon: Truck },
        { key: 'completed', label: '완료', icon: Package }
    ];

    const currentStepIndex = steps.findIndex(s => s.key === status);
    const isCancelled = status === 'cancelled';

    if (isCancelled) {
        return (
            <div className="flex items-center gap-2 text-destructive p-4 bg-destructive/10 rounded-lg">
                <AlertCircle className="w-5 h-5" />
                <span className="font-bold">주문 취소됨</span>
            </div>
        );
    }

    return (
        <div className="w-full relative">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-muted -translate-y-1/2 z-0 hidden md:block" />
            <div className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 z-0 hidden md:block transition-all duration-500"
                style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }} />

            <div className="relative z-10 flex flex-col md:flex-row justify-between gap-4 md:gap-0">
                {steps.map((step, index) => {
                    const isCompleted = index <= currentStepIndex;
                    const isCurrent = index === currentStepIndex;

                    return (
                        <div key={step.key} className="flex md:flex-col items-center gap-3 md:gap-2">
                            <motion.div
                                initial={false}
                                animate={{
                                    scale: isCurrent ? 1.2 : 1,
                                    backgroundColor: isCompleted ? 'var(--primary)' : 'var(--muted)',
                                    color: isCompleted ? 'var(--primary-foreground)' : 'var(--muted-foreground)'
                                }}
                                className={cn(
                                    "w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-4 border-background shadow-sm transition-colors duration-300"
                                )}
                            >
                                <step.icon className="w-4 h-4 md:w-5 md:h-5" />
                            </motion.div>
                            <span className={cn(
                                "text-sm font-medium transition-colors duration-300",
                                isCompleted ? "text-foreground" : "text-muted-foreground",
                                isCurrent && "font-bold text-primary"
                            )}>
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
