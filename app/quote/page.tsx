import Scene from "@/components/canvas/Scene";
import { Button } from "@/components/ui/button";
import FileUpload from "@/components/upload/FileUpload";
import QuotePanel from "@/components/quote/QuotePanel";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function QuotePage() {
    return (
        <main className="min-h-screen bg-background text-foreground flex flex-col">
            {/* Header */}
            <header className="border-b border-border/40 backdrop-blur-md sticky top-0 z-50 bg-background/80">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                                <span className="font-bold text-primary-foreground">3D</span>
                            </div>
                            <span className="font-bold text-lg tracking-tight">Wow3D</span>
                        </Link>
                    </div>
                    <Link href="/">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            메인으로
                        </Button>
                    </Link>
                </div>
            </header>

            {/* Main Content Area */}
            <section className="flex-1 container mx-auto px-4 py-8 md:py-12">
                <div className="grid lg:grid-cols-12 gap-8 h-[calc(100vh-8rem)]">

                    {/* Left Column: Upload & Controls */}
                    <div className="lg:col-span-4 flex flex-col gap-6 overflow-y-auto pr-2">
                        <div className="space-y-4">
                            <h1 className="text-3xl font-bold tracking-tight">
                                실시간 견적 산출
                            </h1>
                            <p className="text-muted-foreground">
                                3D 모델 파일을 업로드하면 자동으로 견적이 계산됩니다.
                            </p>
                            <FileUpload />
                        </div>

                        <QuotePanel />
                    </div>

                    {/* Right Column: 3D Visualization */}
                    <div className="lg:col-span-8 flex flex-col gap-4">
                        <div className="relative flex-1 w-full rounded-2xl border border-border/50 bg-card/50 shadow-2xl backdrop-blur-sm overflow-hidden ring-1 ring-white/10 min-h-[500px]">
                            <Scene />
                        </div>
                        <div className="flex items-center gap-8 justify-center text-sm text-muted-foreground py-2">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-foreground">100+</span> 재료
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-foreground">24시간</span> 납기
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-foreground">±0.2mm</span> 정밀도
                            </div>
                        </div>
                    </div>

                </div>
            </section>
        </main>
    );
}
