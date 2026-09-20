'use client'

import { useRouter } from 'next/navigation'

export function DeleteButton({ id }: { id: number }) {
    const router = useRouter()

    async function handleDelete() {
        if (!confirm('この履歴を削除しますか？')) return

        const res = await fetch(`/api/sessions/${id}`, { method: 'DELETE' })
        if (!res.ok) {
            alert(res.status === 404 ? '見つかりませんでした' : '削除に失敗しました')
            return
        }
        router.refresh()
    }

    return (
        <button
            onClick={handleDelete}
            className="bg-red-400 text-white px-3 py-1 rounded text-sm
            hover:bg-red-500 transition duration-300 cursor-pointer">
            削除
        </button>
    )
}