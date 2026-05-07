'use client'

import { useState } from 'react'
import { upsertFormRecord, deleteFormRecord } from '../actions'

type FormRecord = {
  id: string
  race_seq: number
  race_name: string | null
  last3f: number | null
  corner_pos: number | null
  finish_pos: number | null
  field_size: number | null
}

const inputStyle = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 6,
  padding: '5px 8px',
  fontSize: 12,
  color: '#EEEEF5',
  outline: 'none',
  width: '100%',
}

const FIELDS = [
  { name: 'race_seq',   label: '#',       type: 'number', placeholder: '1',      width: 52,  step: '1'   },
  { name: 'race_name',  label: 'レース名', type: 'text',   placeholder: '桜花賞', width: 130, step: undefined },
  { name: 'last3f',     label: '上がり3F', type: 'number', placeholder: '33.5',   width: 72,  step: '0.1' },
  { name: 'corner_pos', label: '4角順位',  type: 'number', placeholder: '5',      width: 64,  step: '1'   },
  { name: 'finish_pos', label: '着順',     type: 'number', placeholder: '2',      width: 56,  step: '1'   },
  { name: 'field_size', label: '頭数',     type: 'number', placeholder: '18',     width: 56,  step: '1'   },
] as const

export default function FormRecordManager({
  horseId,
  records,
}: {
  horseId: string
  records: FormRecord[]
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [savedId, setSavedId] = useState<string | null>(null)

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
                const isSaving = savingId === r.id
                const isSaved = savedId === r.id
                const updateAction = upsertFormRecord.bind(null, horseId)
                return (
                  <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    {isEditing ? (
                      <td colSpan={7} style={{ padding: '10px 12px' }}>
                        <form
                          action={async (fd) => {
                            setSavingId(r.id)
                            await updateAction(fd)
                            setSavingId(null)
                            setSavedId(r.id)
                            setTimeout(() => { setSavedId(null); setEditingId(null) }, 1000)
                          }}
                          style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}
                        >
                          {FIELDS.map(({ name, label, type, placeholder, width, step }) => (
                            <div key={name} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <label style={{ fontSize: 10, color: '#62627A' }}>{label}</label>
                              <input
                                name={name}
                                type={type}
                                step={step}
                                placeholder={placeholder}
                                defaultValue={r[name] ?? ''}
                                readOnly={name === 'race_seq'}
                                style={{
                                  ...inputStyle,
                                  width,
                                  opacity: name === 'race_seq' ? 0.5 : 1,
                                }}
                              />
                            </div>
                          ))}
                          <div style={{ display: 'flex', gap: 6, alignSelf: 'flex-end' }}>
                            <button
                              type="submit"
                              disabled={isSaving}
                              style={{
                                background: isSaved ? 'rgba(20,184,166,0.2)' : '#14B8A6',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 6,
                                padding: '6px 12px',
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: isSaving ? 'not-allowed' : 'pointer',
                                minWidth: 72,
                                opacity: isSaving ? 0.7 : 1,
                                transition: 'background 0.2s',
                              }}
                            >
                              {isSaving ? '保存中…' : isSaved ? '✓ 保存済' : '保存'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              style={{ background: 'rgba(255,255,255,0.08)', color: '#9898B0', border: 'none', borderRadius: 6, padding: '6px 10px', fontSize: 12, cursor: 'pointer' }}
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
          {FIELDS.map(({ name, label, type, placeholder, width, step }) => (
            <div key={name} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, color: '#62627A' }}>{label}</label>
              <input
                name={name}
                type={type}
                step={step}
                placeholder={placeholder}
                required={name === 'race_seq'}
                style={{ ...inputStyle, width }}
              />
            </div>
          ))}
          <button
            type="submit"
            style={{ background: '#14B8A6', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-end' }}
          >
            保存
          </button>
        </form>
      </div>
    </div>
  )
}
