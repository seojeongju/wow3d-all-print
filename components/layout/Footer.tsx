'use client'

import Link from 'next/link'
import { MapPin, Phone, Mail } from 'lucide-react'

export default function Footer() {
    return (
        <footer className="border-t border-border/40 bg-muted/20">
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* 회사 소개 */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                                <span className="font-bold text-primary-foreground">W</span>
                            </div>
                            <span className="font-bold text-lg">Wow3D</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            3D 프린팅 전문 업체
                            <br />
                            빠르고 정확한 견적과
                            <br />
                            최고 품질의 출력 서비스
                        </p>
                    </div>

                    {/* 센터 정보 */}
                    <div className="md:col-span-2">
                        <h3 className="font-semibold mb-4">센터 안내</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                <div>
                                    <div className="font-medium">홍대센터</div>
                                    <div className="text-muted-foreground">서울시 마포구 독막로 93 상수빌딩 4층</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                <div>
                                    <div className="font-medium">구미센터</div>
                                    <div className="text-muted-foreground">경북 구미시 산호대로 253 구미첨단의료기술타워 606호</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                <div>
                                    <div className="font-medium">전주센터</div>
                                    <div className="text-muted-foreground">전북특별자치도 전주시 덕진구 반룡로 109 테크노빌A동 207호</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 연락처 */}
                    <div>
                        <h3 className="font-semibold mb-4">문의하기</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                                <div>
                                    <div>02-3144-3137</div>
                                    <div>054-464-3144</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <Mail className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                <div className="break-all">
                                    <a href="mailto:3dcookidhd@naver.com" className="hover:text-primary transition-colors">
                                        3dcookidhd@naver.com
                                    </a>
                                    <br />
                                    <a href="mailto:wow3d16@naver.com" className="hover:text-primary transition-colors">
                                        wow3d16@naver.com
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 구분선 */}
                <div className="border-t border-border/40 mt-8 pt-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
                        <div>
                            © {new Date().getFullYear()} Wow3D. All rights reserved.
                        </div>
                        <div className="flex gap-6">
                            <Link href="/terms" className="hover:text-foreground transition-colors">
                                이용약관
                            </Link>
                            <Link href="/privacy" className="hover:text-foreground transition-colors">
                                개인정보처리방침
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}
