'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Filter, MoreHorizontal, Download, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function OrderList() {
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState<any[]>([]);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const res = await fetch('/api/admin/orders');
                const data = await res.json();
                if (data.success) {
                    setOrders(data.data);
                }
            } catch (e) {
                console.error("Failed to fetch orders");
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, []);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending': return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">접수 대기</Badge>;
            case 'confirmed': return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">주문 확인</Badge>;
            case 'production': return <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">제작 중</Badge>;
            case 'shipping': return <Badge variant="outline" className="bg-indigo-100 text-indigo-800 border-indigo-200">배송 중</Badge>;
            case 'completed': return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">완료됨</Badge>;
            default: return <Badge variant="outline">미정</Badge>;
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">주문 관리</h1>
                    <p className="text-muted-foreground">접수된 주문을 확인하고 상태를 변경할 수 있습니다.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline"><Download className="w-4 h-4 mr-2" /> 엑셀 다운로드</Button>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input type="search" placeholder="주문번호, 이름 검색..." className="pl-8" />
                </div>
                <Button variant="outline" size="icon"><Filter className="w-4 h-4" /></Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    <div className="rounded-md border">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="p-4 font-medium">주문번호</th>
                                    <th className="p-4 font-medium">고객명</th>
                                    <th className="p-4 font-medium">주문 내역</th>
                                    <th className="p-4 font-medium">금액</th>
                                    <th className="p-4 font-medium">상태</th>
                                    <th className="p-4 font-medium">날짜</th>
                                    <th className="p-4 font-medium text-right">관리</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => (
                                    <tr key={order.id} className="border-t hover:bg-muted/50 transition-colors">
                                        <td className="p-4 font-medium">{order.order_number}</td>
                                        <td className="p-4">{order.recipient_name}</td>
                                        <td className="p-4 text-muted-foreground">
                                            {/* item_count might be missing if API fails, fallback */}
                                            {order.item_count || 1}개 품목
                                        </td>
                                        <td className="p-4 font-bold">₩ {(order.total_amount || 0).toLocaleString()}</td>
                                        <td className="p-4">{getStatusBadge(order.status)}</td>
                                        <td className="p-4 text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</td>
                                        <td className="p-4 text-right">
                                            <Button variant="ghost" size="icon">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {orders.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-muted-foreground">접수된 주문이 없습니다.</td>
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
