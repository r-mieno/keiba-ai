'use client'

import { useState } from 'react'
import { addEntry, updateEntry, deleteEntry } from '../actions'

type Entry = {
  horse_id: string
  horse_name: string
  horse_number: number | null
  jockey_name: string | null
  weight_kg: number | null
  last3f_1: number | null
  last3f_2: number | null
  last3f_3: number | null
  finish_position: number | null
  popularity_rank: number | null
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

const HORSE_NUMBERS = Array.from({ length: 20 }, (_, i) => i + 1)
const WEIGHT_OPTIONS = [50, 51, 52, 53, 54, 54.5, 55, 55.5, 56, 56.5, 57, 57.5, 58, 58.5, 59]
const RANK_OPTIONS = Array.from({ length: 20 }, (_, i) => i + 1)

function SelectField({ name, label, value, options, width, placeholder }: {
  name: string
  label: string
  value: number | null
  options: number[]
  width: number
  placeholder?: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <label style={{ fontSize: 10, color: '#62627A' }}>{label}</label>
      <select name={name} defaultValue={value ?? ''} style={{ ...inputStyle, width, cursor: 'pointer' }}>
        <option value="">{placeholder ?? '—'}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

export default function EntryManager({
  raceId,
  entries,
  allHorseNames,
}: {
  raceId: string
  entries: Entry[]
  allHorseNames: string[]
}) {
  const [editingId, setEditingId] = useState<string | null>(null)

  const addAction = addEntry.bind(null, raceId)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* エントリー一覧 */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              {['馬番', '馬名', '騎手', '斤量', '上がり1', '上がり2', '上がり3', '着順', '人気', ''].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: '#62627A', fontWeight: 600, fontSize: 11, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries
              .slice()
              .sort((a, b) => (a.horse_number ?? 99) - (b.horse_number ?? 99))
              .map((entry) => {
                const isEditing = editingId === entry.horse_id
                const updateAction = updateEntry.bind(null, raceId, entry.horse_id)
                return (
                  <tr key={entry.horse_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    {isEditing ? (
                      <td colSpan={9} style={{ padding: '10px' }}>
                        <form
                          action={async (fd) => { await updateAction(fd); setEditingId(null) }}
                          style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}
                        >
                          <span style={{ fontSize: 12, color: '#EEEEF5', fontWeight: 600, minWidth: 80 }}>{entry.horse_name}</span>
                          <SelectField name="horse_number"    label="馬番" value={entry.horse_number}    options={HORSE_NUMBERS} width={60} />
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <label style={{ fontSize: 10, color: '#62627A' }}>騎手</label>
                            <input name="jockey_name" defaultValue={entry.jockey_name ?? ''} style={{ ...inputStyle, width: 100 }} />
                          </div>
                          <SelectField name="weight_kg"       label="斤量" value={entry.weight_kg}       options={WEIGHT_OPTIONS} width={65} />
                          {(['last3f_1','last3f_2','last3f_3'] as const).map((name, i) => (
                            <div key={name} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <label style={{ fontSize: 10, color: '#62627A' }}>上り{i+1}</label>
                              <input name={name} defaultValue={(entry[name] as number | null) ?? ''} style={{ ...inputStyle, width: 55 }} />
                            </div>
                          ))}
                          <SelectField name="finish_position" label="着順" value={entry.finish_position} options={RANK_OPTIONS}   width={60} />
                          <SelectField name="popularity_rank" label="人気" value={entry.popularity_rank} options={RANK_OPTIONS}   width={60} />
                          <div style={{ display: 'flex', gap: 6, alignSelf: 'flex-end' }}>
                            <button type="submit" style={{ background: '#14B8A6', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>保存</button>
                            <button type="button" onClick={() => setEditingId(null)} style={{ background: 'rgba(255,255,255,0.08)', color: '#9898B0', border: 'none', borderRadius: 6, padding: '6px 10px', fontSize: 12, cursor: 'pointer' }}>×</button>
                          </div>
                        </form>
                      </td>
                    ) : (
                      <>
                        <td style={{ padding: '10px', color: '#EEEEF5' }}>{entry.horse_number ?? '—'}</td>
                        <td style={{ padding: '10px', color: '#EEEEF5', fontWeight: 500 }}>{entry.horse_name}</td>
                        <td style={{ padding: '10px', color: '#9898B0' }}>{entry.jockey_name ?? '—'}</td>
                        <td style={{ padding: '10px', color: '#9898B0' }}>{entry.weight_kg ?? '—'}</td>
                        <td style={{ padding: '10px', color: '#9898B0' }}>{entry.last3f_1 ?? '—'}</td>
                        <td style={{ padding: '10px', color: '#9898B0' }}>{entry.last3f_2 ?? '—'}</td>
                        <td style={{ padding: '10px', color: '#9898B0' }}>{entry.last3f_3 ?? '—'}</td>
                        <td style={{ padding: '10px', color: '#9898B0' }}>{entry.finish_position ?? '—'}</td>
                        <td style={{ padding: '10px', color: '#9898B0' }}>{entry.popularity_rank ?? '—'}</td>
                        <td style={{ padding: '10px' }}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => setEditingId(entry.horse_id)} style={{ background: 'rgba(255,255,255,0.07)', color: '#9898B0', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>編集</button>
                            <form action={deleteEntry.bind(null, raceId, entry.horse_id)}>
                              <button type="submit" style={{ background: 'rgba(248,113,113,0.1)', color: '#F87171', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>削除</button>
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

      {/* 馬の追加 */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: 16 }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: '#62627A', margin: '0 0 12px' }}>馬を追加</p>
        <form action={addAction} style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <datalist id="horse-list">
            {allHorseNames.map((n) => <option key={n} value={n} />)}
          </datalist>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, color: '#62627A' }}>馬名</label>
            <input name="horse_name" type="text" placeholder="馬名" list="horse-list" required style={{ ...inputStyle, width: 160 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, color: '#62627A' }}>馬番</label>
            <select name="horse_number" style={{ ...inputStyle, width: 70, cursor: 'pointer' }}>
              <option value="">—</option>
              {HORSE_NUMBERS.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, color: '#62627A' }}>騎手</label>
            <input name="jockey_name" type="text" placeholder="騎手名" style={{ ...inputStyle, width: 120 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, color: '#62627A' }}>斤量</label>
            <select name="weight_kg" style={{ ...inputStyle, width: 75, cursor: 'pointer' }}>
              <option value="">—</option>
              {WEIGHT_OPTIONS.map((w) => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
          <button type="submit" style={{ background: '#14B8A6', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-end' }}>
            追加
          </button>
        </form>
      </div>
    </div>
  )
}
