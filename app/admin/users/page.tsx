'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/useAuthStore';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

type UserRow = {
    id: number;
    email: string;
    name: string;
    phone: string | null;
    role: string;
    created_at: string;
};

const ROLE_OPTIONS = [
    { value: 'user', label: '일반회원' },
    { value: 'admin', label: '관리자' },
];

function getRoleBadge(role: string) {
    if (role === 'admin') {
        return <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30">관리자</Badge>;
    }
    return <Badge variant="outline" className="bg-white/10 text-white/70 border-white/20">일반회원</Badge>;
}

export default function AdminUsersPage() {
    const { toast } = useToast();
    const { user: currentUser, token } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<UserRow[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQ, setDebouncedQ] = useState('');
    const [updatingId, setUpdatingId] = useState<number | null>(null);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedQ(searchQuery), 300);
        return () => clearTimeout(t);
    }, [searchQuery]);

    const fetchUsers = async () => {
        try {
            const q = debouncedQ.trim();
            const url = q ? `/api/admin/users?q=${encodeURIComponent(q)}` : '/api/admin/users';
            const res = await fetch(url, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            const data = await res.json();
            if (data.success) {
                setUsers(Array.isArray(data.data) ? data.data : []);
            } else {
                toast({ title: data.error || '사용자 목록 조회 실패', variant: 'destructive' });
            }
        } catch (e) {
            console.error('Failed to fetch users', e);
            toast({ title: '사용자 목록 조회 실패', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [debouncedQ]);

    const handleRoleChange = async (userId: number, newRole: string) => {
        if (userId === currentUser?.id) {
            toast({ title: '자신의 역할은 변경할 수 없습니다', variant: 'destructive' });
            return;
        }
        setUpdatingId(userId);
        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ role: newRole }),
            });
            const json = await res.json();
            if (json.success) {
                setUsers((prev) =>
                    prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
                );
                toast({ title: '역할이 변경되었습니다.' });
            } else {
                toast({ title: json.error || '변경 실패', variant: 'destructive' });
            }
        } catch (e) {
            toast({ title: '변경 중 오류가 발생했습니다.', variant: 'destructive' });
        } finally {
            setUpdatingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                    <Users className="w-8 h-8 text-primary" />
                    사용자 관리
                </h1>
                <p className="text-white/50 text-sm mt-1">
                    가입된 사용자 목록을 확인하고 역할(일반회원/관리자)을 변경할 수 있습니다.
                </p>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                    type="search"
                    placeholder="이메일, 이름 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />
            </div>

            <Card className="bg-white/[0.03] border-white/10 overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="p-4 font-medium text-white/70">ID</th>
                                    <th className="p-4 font-medium text-white/70">이메일</th>
                                    <th className="p-4 font-medium text-white/70">이름</th>
                                    <th className="p-4 font-medium text-white/70">연락처</th>
                                    <th className="p-4 font-medium text-white/70">역할</th>
                                    <th className="p-4 font-medium text-white/70">가입일</th>
                                    <th className="p-4 font-medium text-right text-white/70">역할 변경</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => (
                                    <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                        <td className="p-4 text-white/50 font-mono">{u.id}</td>
                                        <td className="p-4 font-medium text-white">{u.email}</td>
                                        <td className="p-4 text-white/90">{u.name}</td>
                                        <td className="p-4 text-white/70">{u.phone || '-'}</td>
                                        <td className="p-4">{getRoleBadge(u.role || 'user')}</td>
                                        <td className="p-4 text-white/50">
                                            {u.created_at ? new Date(u.created_at).toLocaleDateString('ko-KR') : '-'}
                                        </td>
                                        <td className="p-4 text-right">
                                            <Select
                                                value={u.role || 'user'}
                                                onValueChange={(v) => handleRoleChange(u.id, v)}
                                                disabled={updatingId === u.id || u.id === currentUser?.id}
                                            >
                                                <SelectTrigger className="w-[120px] h-8 bg-white/5 border-white/10 text-white text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {ROLE_OPTIONS.map((r) => (
                                                        <SelectItem key={r.value} value={r.value}>
                                                            {r.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {updatingId === u.id && (
                                                <Loader2 className="w-3 h-3 animate-spin inline-block ml-1 text-primary" />
                                            )}
                                            {u.id === currentUser?.id && (
                                                <span className="text-[10px] text-white/40 ml-1">(본인)</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {users.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="p-12 text-center text-white/40">
                                            {searchQuery.trim() ? '검색 결과가 없습니다.' : '등록된 사용자가 없습니다.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
