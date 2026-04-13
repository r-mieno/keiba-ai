'use client'

import { deleteRace } from './actions'

export default function DeleteRaceButton({ raceId, raceName }: { raceId: string; raceName: string }) {
  return (
    <form
      action={async () => {
        if (!confirm(`「${raceName}」を削除しますか？\n関連するエントリーも削除されます。`)) return
        await deleteRace(raceId)
      }}
    >
      <button
        type="submit"
        style={{
          background: 'rgba(248,113,113,0.1)',
          color: '#F87171',
          border: 'none',
          borderRadius: 6,
          padding: '4px 10px',
          fontSize: 11,
          cursor: 'pointer',
        }}
      >
        削除
      </button>
    </form>
  )
}
