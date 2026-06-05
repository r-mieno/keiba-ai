'use client'

import { useState } from 'react'
import { upsertFormRecord, updateFormRecord, deleteFormRecord } from '../actions'
import SubmitButton from '../../components/SubmitButton'

type FormRecord = {
  id: string
  race_seq: number
  race_name: string | null
  last3f: number | null
  corner_pos: number | null
  finish_pos: number | null
  field_size: number | null
}

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 6,
  padding: '5px 8px',
  fontSize: 12,
  color: '#EEEEF5',
  outline: 'none',
  width: '100%',
}

const SEQ_OPTIONS    = Array.from({ length: 10 }, (_, i) => i + 1)           // 1〜10
const CORNER_OPTIONS = Array.from({ length: 18 }, (_, i) => i + 1)           // 1〜18
const FINISH_OPTIONS = Array.from({ length: 18 }, (_, i) => i + 1)           // 1〜18
const FIELD_OPTIONS  = Array.from({ length: 11 }, (_, i) => i + 8)           // 8〜18

export default function FormRecordManager({
  horseId,
  records,
}: {
  horseId: string
  records: FormRecord[]
}) {
  const [editingId, setEditingId] = useState<string | null>(null)

  const upsertAction = upsertFormRecord.bind(null, horseId)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* 一覧テーブル */}
      {records.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                {['#', 'レース名', '上がり3F', '4角順位', '着順', '頭数', ''].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: '#62627A', fontWeight: 600, fontSize: 11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((r) => {
                const isEditing = editingId === r.id
                return (
                  <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    {isEditing ? (
                      <td colSpan={7} style={{ padding: '10px 12px' }}>
                        <form
                          action={updateFormRecord.bind(null, r.id, horseId)}
                          style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}
                        >
                          {/* # */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <label style={{ fontSize: 10, color: '#62627A' }}>#</label>
                            <select name="race_seq" defaultValue={r.race_seq} style={{ ...inputStyle, width: 56 }}>
                              {SEQ_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
                            </select>
                          </div>
                          {/* レース名 */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <label style={{ fontSize: 10, color: '#62627A' }}>レース名</label>
                            <input name="race_name" type="text" placeholder="桜花賞" defaultValue={r.race_name ?? ''} style={{ ...inputStyle, width: 130 }} />
                          </div>
                          {/* 上がり3F */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <label style={{ fontSize: 10, color: '#62627A' }}>上がり3F</label>
                            <input name="last3f" type="number" step="0.1" placeholder="33.5" defaultValue={r.last3f ?? ''} style={{ ...inputStyle, width: 72 }} />
                          </div>
                          {/* 4角順位 */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <label style={{ fontSize: 10, color: '#62627A' }}>4角順位</label>
                            <select name="corner_pos" defaultValue={r.corner_pos ?? ''} style={{ ...inputStyle, width: 68 }}>
                              <option value="">—</option>
                              {CORNER_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
                            </select>
                          </div>
                          {/* 着順 */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <label style={{ fontSize: 10, color: '#62627A' }}>着順</label>
                            <select name="finish_pos" defaultValue={r.finish_pos ?? ''} style={{ ...inputStyle, width: 68 }}>
                              <option value="">—</option>
                              {FINISH_OPTIONS.map((n) => <option key={n} value={n}>{n}着</option>)}
                            </select>
                          </div>
                          {/* 頭数 */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <label style={{ fontSize: 10, color: '#62627A' }}>頭数</label>
                            <select name="field_size" defaultValue={r.field_size ?? ''} style={{ ...inputStyle, width: 68 }}>
                              <option value="">—</option>
                              {FIELD_OPTIONS.map((n) => <option key={n} value={n}>{n}頭</option>)}
                            </select>
                          </div>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
                            <SubmitButton label="保存" loadingLabel="保存中…" />
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              style={{ background: 'rgba(255,255,255,0.08)', color: '#9898B0', border: 'none', borderRadius: 8, padding: '9px 10px', fontSize: 12, cursor: 'pointer' }}
                            >
                              ×
                            </button>
                          </div>
                        </form>
                      </td>
                    ) : (
                      <>
                        <td style={{ padding: '9px 12px', color: '#62627A', fontSize: 11 }}>{r.race_seq}</td>
                        <td style={{ padding: '9px 12px', color: '#EEEEF5' }}>{r.race_name ?? '—'}</td>
                        <td style={{ padding: '9px 12px', color: '#9898B0' }}>{r.last3f ?? '—'}</td>
                        <td style={{ padding: '9px 12px', color: '#9898B0' }}>{r.corner_pos ?? '—'}</td>
                        <td style={{ padding: '9px 12px', color: '#9898B0' }}>{r.finish_pos != null ? `${r.finish_pos}着` : '—'}</td>
                        <td style={{ padding: '9px 12px', color: '#9898B0' }}>{r.field_size != null ? `${r.field_size}頭` : '—'}</td>
                        <td style={{ padding: '9px 12px' }}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              onClick={() => setEditingId(r.id)}
                              style={{ background: 'rgba(255,255,255,0.07)', color: '#9898B0', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}
                            >
                              編集
                            </button>
                            <form action={deleteFormRecord.bind(null, r.id, horseId)}>
                              <button
                                type="submit"
                                style={{ background: 'rgba(248,113,113,0.1)', color: '#F87171', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}
                              >
                                削除
                              </button>
                            </form>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 追加フォーム */}
      <div>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: '#62627A', margin: '0 0 12px' }}>
          追加・更新（同じ走目は上書き）
        </p>
        <form action={upsertAction} style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          {/* # */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, color: '#62627A' }}>#</label>
            <select name="race_seq" required style={{ ...inputStyle, width: 56 }}>
              <option value="">—</option>
              {SEQ_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          {/* レース名 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, color: '#62627A' }}>レース名</label>
            <input name="race_name" type="text" placeholder="桜花賞" style={{ ...inputStyle, width: 130 }} />
          </div>
          {/* 上がり3F */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, color: '#62627A' }}>上がり3F</label>
            <input name="last3f" type="number" step="0.1" placeholder="33.5" style={{ ...inputStyle, width: 72 }} />
          </div>
          {/* 4角順位 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, color: '#62627A' }}>4角順位</label>
            <select name="corner_pos" style={{ ...inputStyle, width: 68 }}>
              <option value="">—</option>
              {CORNER_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          {/* 着順 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, color: '#62627A' }}>着順</label>
            <select name="finish_pos" style={{ ...inputStyle, width: 68 }}>
              <option value="">—</option>
              {FINISH_OPTIONS.map((n) => <option key={n} value={n}>{n}着</option>)}
            </select>
          </div>
          {/* 頭数 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, color: '#62627A' }}>頭数</label>
            <select name="field_size" style={{ ...inputStyle, width: 68 }}>
              <option value="">—</option>
              {FIELD_OPTIONS.map((n) => <option key={n} value={n}>{n}頭</option>)}
            </select>
          </div>
          <SubmitButton label="保存" loadingLabel="保存中…" />
        </form>
      </div>
    </div>
  )
}
