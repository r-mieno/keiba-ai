'use client'

import { createClient } from '@/lib/supabase-browser'
import { useState } from 'react'

type Horse = { id: string; name: string; number?: number | null }

type Pick = {
  id: string
  user_email: string
  horse_ids: string[]
}

type Props = {
  raceId: string
  userId: string
  userEmail: string
  raceDate: string   // 'YYYY-MM-DD'
  horses: Horse[]
  initialPicks: Pick[]
}

export default function PicksPanel({ raceId, userId, userEmail, raceDate, horses, initialPicks }: Props) {
  const supabase = createClient()
  const [picks, setPicks] = useState<Pick[]>(initialPicks)
  const [loading, setLoading] = useState(false)

  const myPick = picks.find((p) => p.user_email === userEmail) ?? null
  const [selected, setSelected] = useState<string[]>(myPick?.horse_ids ?? [])

  // 当日14:00で締め切り
  const deadline = new Date(raceDate + 'T14:00:00')
  const isClosed = new Date() >= deadline

  const displayName = (email: string) => email.split('@')[0]

  const horseName = (id: string) => {
    const h = horses.find((h) => h.id === id)
    if (!h) return id
    return h.number != null ? `${h.number}番 ${h.name}` : h.name
  }

  const toggleHorse = (id: string) => {
    if (myPick || isClosed) return
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((h) => h !== id) : prev.length < 3 ? [...prev, id] : prev
    )
  }

  const submit = async () => {
    if (selected.length !== 3 || loading || isClosed) return
    setLoading(true)
    const { data, error } = await supabase
      .from('race_picks')
      .insert({ race_id: raceId, user_id: userId, user_email: userEmail, horse_ids: selected })
      .select()
      .single()
    if (!error && data) {
      setPicks((prev) => [...prev, data as Pick])
    }
    setLoading(false)
  }

  const deletePick = async () => {
    if (!myPick || loading || isClosed) return
    setLoading(true)
    await supabase.from('race_picks').delete().eq('id', myPick.id)
    setPicks((prev) => prev.filter((p) => p.id !== myPick.id))
    setSelected([])
    setLoading(false)
  }

  const sectionLabel: React.CSSProperties = {
    fontSize: 10, fontWeight: 700, letterSpacing: '0.10em',
    textTransform: 'uppercase', color: '#62627A', margin: '0 0 14px',
  }

  return (
    <div id="picks" style={{
      background: '#13141F',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 12,
      padding: '16px 16px',
      marginTop: 8,
      scrollMarginTop: 64,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <p style={{ ...sectionLabel, margin: 0 }}>みんなの予想</p>
        {isClosed && (
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
            background: 'rgba(98,98,122,0.15)', color: '#62627A',
            border: '1px solid rgba(98,98,122,0.25)',
          }}>締め切り済み</span>
        )}
      </div>

      {!isClosed && (
        <p style={{ fontSize: 12, color: '#62627A', margin: '0 0 16px', lineHeight: 1.6 }}>
          3着以内に入ると思う馬を3頭選んでください（順不同）
        </p>
      )}

      {/* 馬選択 — 投票前かつ締め切り前のみ */}
      {!myPick && !isClosed && (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
            {horses.map((horse) => {
              const isSelected = selected.includes(horse.id)
              const isDisabled = !isSelected && selected.length >= 3
              return (
                <button
                  key={horse.id}
                  onClick={() => toggleHorse(horse.id)}
                  disabled={isDisabled}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: isSelected ? 700 : 400,
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                    border: isSelected
                      ? '1px solid rgba(244,114,182,0.60)'
                      : '1px solid rgba(255,255,255,0.10)',
                    background: isSelected
                      ? 'rgba(244,114,182,0.12)'
                      : 'rgba(255,255,255,0.03)',
                    color: isSelected ? '#F472B6' : isDisabled ? '#3A3A50' : '#9898B0',
                    transition: 'all 0.15s',
                  }}
                >
                  {horse.number != null && (
                    <span style={{ fontSize: 11, color: isSelected ? '#F472B6' : '#62627A', marginRight: 4 }}>
                      {horse.number}
                    </span>
                  )}
                  {horse.name}
                </button>
              )
            })}
          </div>

          <button
            onClick={submit}
            disabled={selected.length !== 3 || loading}
            style={{
              width: '100%',
              padding: '11px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              cursor: selected.length !== 3 || loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              border: 'none',
              background: selected.length === 3 ? 'rgba(244,114,182,0.15)' : 'rgba(255,255,255,0.04)',
              color: selected.length === 3 ? '#F472B6' : '#3A3A50',
              transition: 'all 0.15s',
            }}
          >
            {selected.length === 3 ? '投稿する' : `あと${3 - selected.length}頭選んでください`}
          </button>
        </>
      )}

      {/* 自分の投稿済み表示 */}
      {myPick && (
        <div style={{
          background: 'rgba(244,114,182,0.06)',
          border: '1px solid rgba(244,114,182,0.20)',
          borderRadius: 8,
          padding: '10px 14px',
          marginBottom: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}>
          <span style={{ fontSize: 13, color: '#F472B6', fontWeight: 600 }}>
            あなたの予想：{myPick.horse_ids.map((id) => horseName(id)).join('・')}
          </span>
          {!isClosed && (
            <button
              onClick={deletePick}
              disabled={loading}
              style={{
                fontSize: 11, color: '#62627A', background: 'transparent',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6,
                padding: '3px 8px', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
              }}
            >
              取消
            </button>
          )}
        </div>
      )}

      {/* みんなの予想一覧 */}
      {picks.length === 0 ? (
        <p style={{ fontSize: 12, color: '#3A3A50', textAlign: 'center', padding: '12px 0' }}>
          まだ誰も投稿していません
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {picks.map((pick) => {
            const isMe = pick.user_email === userEmail
            return (
              <div
                key={pick.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                <span style={{
                  fontSize: 11, fontWeight: 700, color: isMe ? '#F472B6' : '#62627A',
                  flexShrink: 0, minWidth: 56,
                }}>
                  {displayName(pick.user_email)}
                </span>
                <span style={{ fontSize: 13, color: isMe ? '#EEEEF5' : '#9898B0' }}>
                  {pick.horse_ids.map((id) => horseName(id)).join('・')}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
