'use client'

import { use } from 'react'
import { notFound } from 'next/navigation'
import CustomProductEditor from '../_components/CustomProductEditor'

export default function AdminCustomProductEditPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id: idRaw } = use(params)
    const id = Number(idRaw)
    if (!Number.isInteger(id) || id < 1) notFound()
    return <CustomProductEditor productId={id} />
}
