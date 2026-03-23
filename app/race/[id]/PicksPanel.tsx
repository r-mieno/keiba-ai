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
  top3?: string[]    // 1〜3着のhorse_id（着順順）
}

export default function PicksPanel({ raceId, userId, userEmail, raceDate, horses, initialPicks, top3 = [] }: Props) {
  const supabase = createClient()
  const [picks, setPicks] = useState<Pick[]>(initialPicks)
  const [loading, setLoading] = useState(false)

  const myPick = picks.find((p) => p.user_email === userEmail) ?? null
  const [selected, setSelected] = useState<string[]>(myPick?.horse_ids ?? [])

  // 当日14:00で締め切り
  const deadline = new Date(raceDate + 'T14:00:00')
  const isClosed = new Date() >= deadline

  const displayName = (email: string) => email.split('@')[0]

  const circled = (n: number | null | undefined) =>
    n != null && n >= 1 && n <= 20 ? String.fromCharCode(0x245f + n) : null

  const horseName = (id: string) => {
    const h = horses.find((h) => h.id === id)
    if (!h) return '(取消)'
    const c = circled(h.number)
    return c ? `${c} ${h.name}` : h.name
  }

  const toggleHorse = (id: string) => {
    if (myPick || isClosed) return
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((h) => h !== id) : prev.length < 3 ? [...prev, id] : prev
    )
  }

  const deletePick = async () => {
    if (!myPick || loading || isClosed) return
    setLoading(true)
    await supabase.from('race_picks').delete().eq('id', myPick.id)
    setPicks((prev) => prev.filter((p) => p.id !== myPick.id))
    setSelected([])
    setLoading(false)
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

const hasResult = top3.length === 3

  // 各ユーザーの予想で何頭3着以内に入ったか
  const hitCount = (horseIds: string[]) =>
    horseIds.filter((id) => top3.includes(id)).length

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

      {/* レース結果 */}
      {hasResult && (
        <div style={{
          background: 'rgba(20,184,166,0.06)',
          border: '1px solid rgba(20,184,166,0.20)',
          borderRadius: 10, padding: '10px 14px', marginBottom: 16,
        }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', color: '#14B8A6', margin: '0 0 8px' }}>
            RESULT
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {top3.map((id, i) => (
              <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#14B8A6' }}>{i + 1}着</span>
                <span style={{ fontSize: 13, color: '#EEEEF5' }}>{horseName(id)}</span>
                {i < 2 && <span style={{ color: 'rgba(255,255,255,0.15)', marginLeft: 3 }}>—</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {!isClosed && !hasResult && (
        <>
          <p style={{ fontSize: 12, color: '#62627A', margin: '0 0 8px', lineHeight: 1.6 }}>
            3着以内に入ると思う馬を3頭選んでください（順不同）
          </p>
          <p style={{ fontSize: 11, color: '#FBBF24', margin: '0 0 16px', lineHeight: 1.7 }}>
            ※ 出走取消・除外になった馬を選択していた場合、その予想は無効扱いになります。<br />
            ※ 馬番は木曜夕方ごろ確定します。確定前は馬名のみ表示されます。
          </p>
        </>
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
                  {circled(horse.number) != null && (
                    <span style={{ fontSize: 13, color: isSelected ? '#F472B6' : '#62627A', marginRight: 4 }}>
                      {circled(horse.number)}
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
                <span style={{ fontSize: 13, color: isMe ? '#EEEEF5' : '#9898B0', flex: 1 }}>
                  {pick.horse_ids.map((id) => horseName(id)).join('・')}
                </span>
                {isMe && !isClosed && (
                  <button
                    onClick={deletePick}
                    disabled={loading}
                    style={{
                      fontSize: 11, color: '#62627A', background: 'transparent',
                      border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6,
                      padding: '3px 8px', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
                    }}
                  >取消</button>
                )}
                {hasResult && (() => {
                  const n = hitCount(pick.horse_ids)
                  return (
                    <span style={{
                      fontSize: 12, fontWeight: 700, flexShrink: 0,
                      color: n === 3 ? '#14B8A6' : n >= 1 ? '#F472B6' : '#3A3A50',
                    }}>
                      {n === 0 ? '的中なし' : `${n}/3的中`}
                    </span>
                  )
                })()}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
