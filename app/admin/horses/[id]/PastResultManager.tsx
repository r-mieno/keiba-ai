'use client'

import { useState } from 'react'
import { updatePastResult, deletePastResult, addPastResult } from '../actions'

type PastResult = {
  id: string
  race_name: string
  grade: string | null
  distance_m: number | null
  finish_pos: number
  field_size: number
}

const GRADE_OPTIONS = ['G1', 'G2', 'G3']
const DISTANCE_OPTIONS = [1200, 1400, 1600, 1800, 2000, 2200, 2400, 2500, 3000, 3200, 3600]
const FINISH_OPTIONS = Array.from({ length: 18 }, (_, i) => i + 1)
const FIELD_OPTIONS = Array.from({ length: 11 }, (_, i) => i + 8)  // 8〜18頭

const sel: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 8,
  padding: '6px 8px',
  fontSize: 12,
  color: '#EEEEF5',
  outline: 'none',
}

const inp: React.CSSProperties = { ...sel, width: '100%' }

export default function PastResultManager({ horseId, results }: { horseId: string; results: PastResult[] }) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const handleSave = async (resultId: string, formData: FormData) => {
    setSaving(true)
    await updatePastResult(resultId, horseId, formData)
    setSaving(false)
    setEditingId(null)
  }

  return (
    <div>
      {/* 実績一覧 */}
      {results.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 24 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              {['レース名', 'G', '距離', '着順', '頭数', ''].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: '#62627A', fontWeight: 600, fontSize: 11 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                {editingId === r.id ? (
                  <td colSpan={6} style={{ padding: '10px 8px' }}>
                    <form
                      action={async (fd) => { await handleSave(r.id, fd) }}
                      style={{ display: 'flex', gap: 6, alignItems: 'flex-end', flexWrap: 'wrap' }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <label style={{ fontSize: 10, color: '#62627A' }}>レース名</label>
                        <input name="race_name" defaultValue={r.race_name} required style={{ ...inp, width: 150 }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <label style={{ fontSize: 10, color: '#62627A' }}>グレード</label>
                        <select name="grade" defaultValue={r.grade ?? ''} style={{ ...sel, width: 72 }}>
                          <option value="">—</option>
                          {GRADE_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
                        </select>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <label style={{ fontSize: 10, color: '#62627A' }}>距離</label>
                        <select name="distance_m" defaultValue={r.distance_m ?? ''} style={{ ...sel, width: 88 }}>
                          <option value="">—</option>
                          {DISTANCE_OPTIONS.map((d) => <option key={d} value={d}>{d}m</option>)}
                        </select>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <label style={{ fontSize: 10, color: '#62627A' }}>着順</label>
                        <select name="finish_pos" defaultValue={r.finish_pos} style={{ ...sel, width: 68 }}>
                          {FINISH_OPTIONS.map((n) => <option key={n} value={n}>{n}着</option>)}
                        </select>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <label style={{ fontSize: 10, color: '#62627A' }}>頭数</label>
                        <select name="field_size" defaultValue={r.field_size} style={{ ...sel, width: 68 }}>
                          {FIELD_OPTIONS.map((n) => <option key={n} value={n}>{n}頭</option>)}
                        </select>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button type="submit" disabled={saving} style={{ background: 'rgba(20,184,166,0.15)', color: '#14B8A6', border: '1px solid rgba(20,184,166,0.3)', borderRadius: 6, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>
                          {saving ? '保存中…' : '保存'}
                        </button>
                        <button type="button" onClick={() => setEditingId(null)} style={{ background: 'rgba(255,255,255,0.05)', color: '#9898B0', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '6px 10px', fontSize: 12, cursor: 'pointer' }}>
                          ×
                        </button>
                      </div>
                    </form>
                  </td>
                ) : (
                  <>
                    <td style={{ padding: '9px 12px', color: '#EEEEF5' }}>{r.race_name}</td>
                    <td style={{ padding: '9px 12px', color: '#9898B0' }}>{r.grade ?? '—'}</td>
                    <td style={{ padding: '9px 12px', color: '#9898B0' }}>{r.distance_m ? `${r.distance_m}m` : '—'}</td>
                    <td style={{ padding: '9px 12px', color: '#9898B0' }}>{r.finish_pos}着</td>
                    <td style={{ padding: '9px 12px', color: '#9898B0' }}>{r.field_size}頭</td>
                    <td style={{ padding: '9px 12px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => setEditingId(r.id)}
                          style={{ background: 'rgba(255,255,255,0.06)', color: '#9898B0', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}
                        >
                          編集
                        </button>
                        <form action={deletePastResult.bind(null, r.id, horseId)}>
                          <button type="submit" style={{ background: 'rgba(248,113,113,0.1)', color: '#F87171', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>
                            削除
                          </button>
                        </form>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* 実績追加フォーム */}
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: '#62627A', margin: '0 0 12px' }}>
        実績を追加
      </p>
      <form action={addPastResult.bind(null, horseId)} style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, color: '#62627A' }}>レース名</label>
          <input name="race_name" type="text" placeholder="スプリンターズS" required style={{ ...inp, width: 160 }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, color: '#62627A' }}>グレード</label>
          <select name="grade" style={{ ...sel, width: 80 }}>
            <option value="">—</option>
            {GRADE_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, color: '#62627A' }}>距離</label>
          <select name="distance_m" style={{ ...sel, width: 96 }}>
            <option value="">—</option>
            {DISTANCE_OPTIONS.map((d) => <option key={d} value={d}>{d}m</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, color: '#62627A' }}>着順</label>
          <select name="finish_pos" defaultValue="1" style={{ ...sel, width: 72 }}>
            {FINISH_OPTIONS.map((n) => <option key={n} value={n}>{n}着</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, color: '#62627A' }}>頭数</label>
          <select name="field_size" defaultValue="16" style={{ ...sel, width: 72 }}>
            {FIELD_OPTIONS.map((n) => <option key={n} value={n}>{n}頭</option>)}
          </select>
        </div>
        <button type="submit" style={{ background: 'rgba(20,184,166,0.15)', color: '#14B8A6', border: '1px solid rgba(20,184,166,0.3)', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
          追加
        </button>
      </form>
    </div>
  )
}
