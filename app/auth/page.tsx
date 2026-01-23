'use client'

import { useState } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Loader2, Mail, Lock, User, Phone } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

export default function AuthModal() {
    const [isLogin, setIsLogin] = useState(true)
    const [isLoading, setIsLoading] = useState(false)
    const { setUser } = useAuthStore()
    const { toast } = useToast()
    const router = useRouter()

    // Form states
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || '로그인 실패')
            }

            const result = await response.json()
            setUser(result.data.user, result.data.token)

            toast({
                title: '✅ 로그인 성공',
                description: `환영합니다, ${result.data.user.name}님!`,
            })

            router.push('/cart')
        } catch (error) {
            toast({
                title: '❌ 로그인 실패',
                description: error instanceof Error ? error.message : '로그인 중 오류가 발생했습니다',
                variant: 'destructive',
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name, phone }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || '회원가입 실패')
            }

            const result = await response.json()
            setUser(result.data.user, result.data.token)

            toast({
                title: '✅ 회원가입 성공',
                description: `환영합니다, ${result.data.user.name}님!`,
            })

            router.push('/cart')
        } catch (error) {
            toast({
                title: '❌ 회원가입 실패',
                description: error instanceof Error ? error.message : '회원가입 중 오류가 발생했습니다',
                variant: 'destructive',
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>{isLogin ? '로그인' : '회원가입'}</CardTitle>
                    <CardDescription>
                        {isLogin
                            ? 'Wow3D 계정으로 로그인하세요'
                            : '새로운 계정을 만들어보세요'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={isLogin ? handleLogin : handleSignup} className="space-y-4">
                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="email">이메일</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="example@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-9"
                                    required
                                />
                            </div>
                        </div>

                        {/* Name (Signup only) */}
                        {!isLogin && (
                            <div className="space-y-2">
                                <Label htmlFor="name">이름</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="name"
                                        type="text"
                                        placeholder="홍길동"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="pl-9"
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        {/* Phone (Signup only) */}
                        {!isLogin && (
                            <div className="space-y-2">
                                <Label htmlFor="phone">전화번호 (선택)</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="phone"
                                        type="tel"
                                        placeholder="010-1234-5678"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Password */}
                        <div className="space-y-2">
                            <Label htmlFor="password">비밀번호</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="최소 8자 이상"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-9"
                                    required
                                    minLength={8}
                                />
                            </div>
                            {!isLogin && (
                                <p className="text-xs text-muted-foreground">
                                    비밀번호는 최소 8자 이상이어야 합니다
                                </p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            className="w-full"
                            size="lg"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    처리중...
                                </>
                            ) : (
                                isLogin ? '로그인' : '회원가입'
                            )}
                        </Button>
                    </form>

                    <Separator className="my-6" />

                    {/* Toggle */}
                    <div className="text-center text-sm">
                        {isLogin ? (
                            <p className="text-muted-foreground">
                                계정이 없으신가요?{' '}
                                <button
                                    type="button"
                                    onClick={() => setIsLogin(false)}
                                    className="text-primary hover:underline font-medium"
                                >
                                    회원가입
                                </button>
                            </p>
                        ) : (
                            <p className="text-muted-foreground">
                                이미 계정이 있으신가요?{' '}
                                <button
                                    type="button"
                                    onClick={() => setIsLogin(true)}
                                    className="text-primary hover:underline font-medium"
                                >
                                    로그인
                                </button>
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
