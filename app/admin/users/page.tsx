'use client';

import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { showToast } from '@/lib/toast-helper';
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

type UsersPagination = { page: number; limit: number; total: number; totalPages: number };

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 400;

const ROLE_OPTIONS = [
    { value: 'user', label: '일반회원' },
    { value: 'admin', label: '관리자' },
];

const ROLE_FILTER_OPTIONS = [
    { value: 'all', label: '전체 역할' },
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
    const { user: currentUser, token } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<UserRow[]>([]);
    const [pagination, setPagination] = useState<UsersPagination>({
        page: 1,
        limit: PAGE_SIZE,
        total: 0,
        totalPages: 1,
    });
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const prevDebouncedRef = useRef('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [updatingId, setUpdatingId] = useState<number | null>(null);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: String(PAGE_SIZE),
            });
            if (debouncedSearch) params.set('q', debouncedSearch);
            if (roleFilter && roleFilter !== 'all') params.set('role', roleFilter);

            const res = await fetch(`/api/admin/users?${params}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                cache: 'no-store',
            });

            if (res.status === 401) {
                showToast.error('세션이 만료되었습니다. 다시 로그인해주세요.');
                return;
            }

            const data = await res.json();
            if (data.success && data.data?.items) {
                const pag = data.data.pagination || {
                    page: 1,
                    limit: PAGE_SIZE,
                    total: 0,
                    totalPages: 1,
                };
                setUsers(Array.isArray(data.data.items) ? data.data.items : []);
                setPagination(pag);
                if (pag.totalPages >= 1 && page > pag.totalPages) {
                    setPage(pag.totalPages);
                }
            } else {
                showToast.error('사용자 목록 조회 실패', data.error || data);
            }
        } catch (e) {
            console.error('Failed to fetch users', e);
            showToast.error('사용자 목록 조회 실패', e);
        } finally {
            setLoading(false);
        }
    }, [token, page, debouncedSearch, roleFilter]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    useEffect(() => {
        const t = setTimeout(() => {
            const next = searchQuery.trim();
            if (prevDebouncedRef.current === next) return;
            prevDebouncedRef.current = next;
            setDebouncedSearch(next);
            setPage(1);
        }, SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(t);
    }, [searchQuery]);

    const handleRoleChange = async (userId: number, newRole: string) => {
        if (userId === currentUser?.id) {
            showToast.info('주의', '자신의 역할은 변경할 수 없습니다.');
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
                showToast.success('역할이 변경되었습니다.');
            } else {
                showToast.error('변경 실패', json);
            }
        } catch (e) {
            showToast.error('변경 중 오류가 발생했습니다.', e);
        } finally {
            setUpdatingId(null);
        }
    };

    const { totalPages, total } = pagination;
    const showPagination = totalPages > 1;

    const renderPageButtons = () => {
        if (!showPagination) return null;
        const maxPagesToShow = 5;
        let startPage = Math.max(1, page - Math.floor(maxPagesToShow / 2));
        let endPage = startPage + maxPagesToShow - 1;
        if (endPage > totalPages) {
            endPage = totalPages;
            startPage = Math.max(1, endPage - maxPagesToShow + 1);
        }
        const buttons: ReactNode[] = [];
        for (let i = startPage; i <= endPage; i++) {
            buttons.push(
                <button
                    key={i}
                    type="button"
                    onClick={() => setPage(i)}
                    className={`min-w-[2.25rem] h-9 px-2 rounded-lg text-sm font-bold transition-colors ${
                        page === i
                            ? 'bg-primary text-primary-foreground shadow-md'
                            : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                >
                    {i}
                </button>
            );
        }
        return buttons;
    };

    const hasActiveFilter = Boolean(debouncedSearch || (roleFilter && roleFilter !== 'all'));

    if (loading && users.length === 0) {
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

            <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
                <div className="relative flex-1 min-w-[200px] max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <Input
                        type="search"
                        placeholder="이메일, 이름, 연락처 검색..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                    />
                </div>
                <Select
                    value={roleFilter}
                    onValueChange={(v) => {
                        setRoleFilter(v);
                        setPage(1);
                    }}
                >
                    <SelectTrigger className="w-full sm:w-[160px] bg-white/5 border-white/10 text-white">
                        <SelectValue placeholder="역할 필터" />
                    </SelectTrigger>
                    <SelectContent>
                        {ROLE_FILTER_OPTIONS.map((r) => (
                            <SelectItem key={r.value} value={r.value}>
                                {r.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <Card className="bg-white/[0.03] border-white/10 overflow-hidden">
                <CardContent className="p-0 relative">
                    {loading && users.length > 0 && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    )}
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
                                {users.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan={7} className="p-12 text-center text-white/40">
                                            {hasActiveFilter ? '검색·필터 결과가 없습니다.' : '등록된 사용자가 없습니다.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {(showPagination || total > 0) && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-white/10 bg-white/[0.02]">
                            <p className="text-xs text-white/40 font-medium order-2 sm:order-1">
                                총 <span className="text-white/70 font-bold">{total.toLocaleString()}</span>명
                                {hasActiveFilter ? ' (필터 적용)' : ''}
                                {' · '}{page}/{totalPages} 페이지
                            </p>
                            {showPagination && (
                                <div className="flex items-center gap-2 order-1 sm:order-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="h-9 w-9 bg-white/5 border-white/10 text-white hover:bg-white/10"
                                        disabled={page <= 1 || loading}
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        aria-label="이전 페이지"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </Button>
                                    <div className="flex items-center gap-1">{renderPageButtons()}</div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="h-9 w-9 bg-white/5 border-white/10 text-white hover:bg-white/10"
                                        disabled={page >= totalPages || loading}
                                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                        aria-label="다음 페이지"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
