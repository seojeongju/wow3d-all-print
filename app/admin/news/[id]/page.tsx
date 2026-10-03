'use client'

import { use } from 'react'
import { notFound } from 'next/navigation'
import NewsEditor from '../_components/NewsEditor'

export default function AdminNewsEditPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: idRaw } = use(params)
    const id = Number(idRaw)
    if (!Number.isInteger(id) || id < 1) notFound()
    return <NewsEditor postId={id} />
}
