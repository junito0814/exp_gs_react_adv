'use client'
// app/history/DeleteButton.tsx — 履歴 1 件の削除
// 削除中はボタンを押せなくする（連打すると 2 回目以降が 404 になるため）。
// 一覧が新しくなるまでロックを保つので、DELETE の完了ではなく
// router.refresh() の完了まで待つ（useTransition の isPending を使う）。

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { WAITING } from '@/lib/messages'

export function DeleteButton({ id }: { id: number }) {
    const router = useRouter()
    const [deleting, setDeleting] = useState(false)   // DELETE の送信中
    const [refreshing, startTransition] = useTransition() // 一覧の作り直し中
    const busy = deleting || refreshing

    async function handleDelete() {
        if (busy) return
        if (!confirm('この履歴を削除しますか？')) return

        setDeleting(true)
        try {
            const res = await fetch(`/api/sessions/${id}`, { method: 'DELETE' })
            if (!res.ok) {
                alert(res.status === 404 ? '見つかりませんでした' : '削除に失敗しました')
                setDeleting(false)
                return
            }
        } catch {
            alert('削除に失敗しました。通信を確認してください。')
            setDeleting(false)
            return
        }
        // 成功時はこの行ごと消えるので、ロックは解かない
        startTransition(() => router.refresh())
    }

    return (
        <button
            onClick={handleDelete}
            disabled={busy}
            className="bg-red-400 text-white px-3 py-1 rounded text-sm
            hover:bg-red-500 transition duration-300 cursor-pointer
            disabled:opacity-50 disabled:cursor-not-allowed">
            {busy ? WAITING.deleting : '削除'}
        </button>
    )
}
