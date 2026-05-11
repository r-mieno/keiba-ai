'use client'

import { useState } from 'react'
import { addEntry, updateEntry, deleteEntry, toggleScratched, bulkUpdateEntries } from '../actions'

type Entry = {
  horse_id: string
  horse_name: string
  horse_number: number | null
  jockey_name: string | null
  weight_kg: number | null
  finish_position: number | null
  popularity_rank: number | null
  scratched: boolean | null
  days_since_last_race: number | null
  is_distance_debut: boolean | null
  is_venue_debut: boolean | null
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

type BulkRow = {
  horse_number: string
  jockey_name: string
  weight_kg: string
  finish_position: string
  popularity_rank: string
  days_since_last_race: string
  is_distance_debut: string   // 'true' | 'false'
  is_venue_debut: string      // 'true' | 'false'
}

export default function EntryManager({
  raceId,
  entries,
  allHorseNames,
  allJockeyNames,
}: {
  raceId: string
  entries: Entry[]
  allHorseNames: string[]
  allJockeyNames: string[]
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [savedId, setSavedId] = useState<string | null>(null)

  // 一括編集
  const [isBulkEdit, setIsBulkEdit] = useState(false)
  const [isBulkSaving, setIsBulkSaving] = useState(false)
  const [isBulkSaved, setIsBulkSaved] = useState(false)
  const [bulkData, setBulkData] = useState<Record<string, BulkRow>>({})

  const sorted = [...entries].sort((a, b) => (a.horse_number ?? 99) - (b.horse_number ?? 99))

  function initBulkData() {
    const init: Record<string, BulkRow> = {}
    for (const e of sorted) {
      init[e.horse_id] = {
        horse_number:         e.horse_number         != null ? String(e.horse_number)         : '',
        jockey_name:          e.jockey_name          ?? '',
        weight_kg:            e.weight_kg            != null ? String(e.weight_kg)            : '',
        finish_position:      e.finish_position      != null ? String(e.finish_position)      : '',
        popularity_rank:      e.popularity_rank      != null ? String(e.popularity_rank)      : '',
        days_since_last_race: e.days_since_last_race != null ? String(e.days_since_last_race) : '',
        is_distance_debut:    e.is_distance_debut    ? 'true' : 'false',
        is_venue_debut:       e.is_venue_debut       ? 'true' : 'false',
      }
    }
    return init
  }

  function handleBulkToggle() {
    if (!isBulkEdit) {
      setBulkData(initBulkData())
      setEditingId(null)
    }
    setIsBulkEdit(!isBulkEdit)
    setIsBulkSaved(false)
  }

  function updateBulkField(horseId: string, field: keyof BulkRow, value: string) {
    setBulkData((prev) => ({ ...prev, [horseId]: { ...prev[horseId], [field]: value } }))
  }

  async function handleBulkSave() {
    setIsBulkSaving(true)
    const updates = sorted.map((e) => {
      const row = bulkData[e.horse_id]
      return {
        horse_id:             e.horse_id,
        horse_number:         row.horse_number         ? Number(row.horse_number)         : null,
        jockey_name:          row.jockey_name.replace(/\s+/g, '') || null,
        weight_kg:            row.weight_kg            ? Number(row.weight_kg)            : null,
        finish_position:      row.finish_position      ? Number(row.finish_position)      : null,
        popularity_rank:      row.popularity_rank      ? Number(row.popularity_rank)      : null,
        days_since_last_race: row.days_since_last_race ? Number(row.days_since_last_race) : null,
        is_distance_debut:    row.is_distance_debut === 'true',
        is_venue_debut:       row.is_venue_debut === 'true',
      }
    })
    await bulkUpdateEntries(raceId, updates)
    setIsBulkSaving(false)
    setIsBulkSaved(true)
    setTimeout(() => { setIsBulkSaved(false); setIsBulkEdit(false) }, 1200)
  }

  const addAction = addEntry.bind(null, raceId)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <datalist id="jockey-list">
        {allJockeyNames.map((n) => <option key={n} value={n} />)}
      </datalist>

      {/* ツールバー */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        {isBulkEdit ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleBulkSave}
              disabled={isBulkSaving}
              style={{
                background: isBulkSaved ? 'rgba(20,184,166,0.2)' : '#14B8A6',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '7px 18px',
                fontSize: 13,
                fontWeight: 600,
                cursor: isBulkSaving ? 'not-allowed' : 'pointer',
                opacity: isBulkSaving ? 0.7 : 1,
                transition: 'background 0.2s',
              }}
            >
              {isBulkSaving ? '保存中…' : isBulkSaved ? '✓ 保存済' : '全て保存'}
            </button>
            <button
              onClick={handleBulkToggle}
              style={{ background: 'rgba(255,255,255,0.08)', color: '#9898B0', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 13, cursor: 'pointer' }}
            >
              キャンセル
            </button>
          </div>
        ) : (
          <button
            onClick={handleBulkToggle}
            style={{ background: 'rgba(255,255,255,0.07)', color: '#EEEEF5', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '7px 16px', fontSize: 13, cursor: 'pointer' }}
          >
            一括編集
          </button>
        )}
      </div>

      {/* エントリー一覧 */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              {['馬番', '馬名', '騎手', '斤量', '着順', '人気', '前走', '初距離', '初コース', ''].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: '#62627A', fontWeight: 600, fontSize: 11, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((entry) => {
              const isScratched = entry.scratched === true

              // ── 一括編集行 ──────────────────────────────────────────
              if (isBulkEdit) {
                const row = bulkData[entry.horse_id] ?? {
                  horse_number: '', jockey_name: '', weight_kg: '', finish_position: '', popularity_rank: '',
                }
                const cellInput = (field: keyof BulkRow, width: number, type = 'text', list?: string) => (
                  <input
                    type={type}
                    value={row[field]}
                    list={list}
                    onChange={(e) => updateBulkField(entry.horse_id, field, e.target.value)}
                    style={{ ...inputStyle, width }}
                  />
                )
                return (
                  <tr key={entry.horse_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', opacity: isScratched ? 0.45 : 1 }}>
                    <td style={{ padding: '6px 10px' }}>{cellInput('horse_number', 52, 'number')}</td>
                    <td style={{ padding: '6px 10px', color: '#EEEEF5', fontWeight: 500, whiteSpace: 'nowrap' }}>
                      {entry.horse_name}
                      {isScratched && <span style={{ fontSize: 10, color: '#F87171', marginLeft: 6, fontWeight: 700 }}>取消</span>}
                    </td>
                    <td style={{ padding: '6px 10px' }}>{cellInput('jockey_name', 110, 'text', 'jockey-list')}</td>
                    <td style={{ padding: '6px 10px' }}>{cellInput('weight_kg', 60, 'number')}</td>
                    <td style={{ padding: '6px 10px' }}>{cellInput('finish_position', 52, 'number')}</td>
                    <td style={{ padding: '6px 10px' }}>{cellInput('popularity_rank', 52, 'number')}</td>
                    <td style={{ padding: '6px 10px' }}>{cellInput('days_since_last_race', 52, 'number')}</td>
                    <td style={{ padding: '6px 10px' }}>
                      <select
                        value={row.is_distance_debut}
                        onChange={(e) => updateBulkField(entry.horse_id, 'is_distance_debut', e.target.value)}
                        style={{ ...inputStyle, width: 52, cursor: 'pointer' }}
                      >
                        <option value="false">—</option>
                        <option value="true">初</option>
                      </select>
                    </td>
                    <td style={{ padding: '6px 10px' }}>
                      <select
                        value={row.is_venue_debut}
                        onChange={(e) => updateBulkField(entry.horse_id, 'is_venue_debut', e.target.value)}
                        style={{ ...inputStyle, width: 52, cursor: 'pointer' }}
                      >
                        <option value="false">—</option>
                        <option value="true">初</option>
                      </select>
                    </td>
                    <td />
                  </tr>
                )
              }

              // ── 個別編集行 ──────────────────────────────────────────
              const isEditing = editingId === entry.horse_id
              const isSaving = savingId === entry.horse_id
              const isSaved = savedId === entry.horse_id
              const updateAction = updateEntry.bind(null, raceId, entry.horse_id)

              return (
                <tr key={entry.horse_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', opacity: isScratched ? 0.45 : 1 }}>
                  {isEditing ? (
                    <td colSpan={10} style={{ padding: '10px' }}>
                      <form
                        action={async (fd) => {
                          setSavingId(entry.horse_id)
                          await updateAction(fd)
                          setSavingId(null)
                          setSavedId(entry.horse_id)
                          setTimeout(() => { setSavedId(null); setEditingId(null) }, 1000)
                        }}
                        style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}
                      >
                        <span style={{ fontSize: 12, color: '#EEEEF5', fontWeight: 600, minWidth: 80 }}>{entry.horse_name}</span>
                        <SelectField name="horse_number"    label="馬番" value={entry.horse_number}    options={HORSE_NUMBERS} width={60} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <label style={{ fontSize: 10, color: '#62627A' }}>騎手</label>
                          <input name="jockey_name" defaultValue={entry.jockey_name ?? ''} list="jockey-list" style={{ ...inputStyle, width: 110 }} />
                        </div>
                        <SelectField name="weight_kg"       label="斤量" value={entry.weight_kg}       options={WEIGHT_OPTIONS} width={65} />
                        <SelectField name="finish_position" label="着順" value={entry.finish_position} options={RANK_OPTIONS}   width={60} />
                        <SelectField name="popularity_rank" label="人気" value={entry.popularity_rank} options={RANK_OPTIONS}   width={60} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <label style={{ fontSize: 10, color: '#62627A' }}>前走間隔(日)</label>
                          <input name="days_since_last_race" type="number" defaultValue={entry.days_since_last_race ?? ''} placeholder="28" style={{ ...inputStyle, width: 70 }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <label style={{ fontSize: 10, color: '#62627A' }}>初距離</label>
                          <select name="is_distance_debut" defaultValue={entry.is_distance_debut ? 'true' : 'false'} style={{ ...inputStyle, width: 60, cursor: 'pointer' }}>
                            <option value="false">—</option>
                            <option value="true">初</option>
                          </select>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <label style={{ fontSize: 10, color: '#62627A' }}>初コース</label>
                          <select name="is_venue_debut" defaultValue={entry.is_venue_debut ? 'true' : 'false'} style={{ ...inputStyle, width: 60, cursor: 'pointer' }}>
                            <option value="false">—</option>
                            <option value="true">初</option>
                          </select>
                        </div>
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
                          <button type="button" onClick={() => setEditingId(null)} style={{ background: 'rgba(255,255,255,0.08)', color: '#9898B0', border: 'none', borderRadius: 6, padding: '6px 10px', fontSize: 12, cursor: 'pointer' }}>×</button>
                        </div>
                      </form>
                    </td>
                  ) : (
                    <>
                      <td style={{ padding: '10px', color: '#EEEEF5' }}>{entry.horse_number ?? '—'}</td>
                      <td style={{ padding: '10px', color: '#EEEEF5', fontWeight: 500 }}>
                        {entry.horse_name}
                        {isScratched && <span style={{ fontSize: 10, color: '#F87171', marginLeft: 6, fontWeight: 700 }}>取消</span>}
                      </td>
                      <td style={{ padding: '10px', color: '#9898B0' }}>{entry.jockey_name ?? '—'}</td>
                      <td style={{ padding: '10px', color: '#9898B0' }}>{entry.weight_kg ?? '—'}</td>
                      <td style={{ padding: '10px', color: '#9898B0' }}>{entry.finish_position ?? '—'}</td>
                      <td style={{ padding: '10px', color: '#9898B0' }}>{entry.popularity_rank ?? '—'}</td>
                      <td style={{ padding: '10px', color: '#9898B0' }}>{entry.days_since_last_race != null ? `${entry.days_since_last_race}日` : '—'}</td>
                      <td style={{ padding: '10px' }}>
                        {entry.is_distance_debut ? <span style={{ fontSize: 10, fontWeight: 700, color: '#FBBF24', background: 'rgba(251,191,36,0.12)', padding: '1px 6px', borderRadius: 3 }}>初</span> : <span style={{ color: '#62627A' }}>—</span>}
                      </td>
                      <td style={{ padding: '10px' }}>
                        {entry.is_venue_debut ? <span style={{ fontSize: 10, fontWeight: 700, color: '#FBBF24', background: 'rgba(251,191,36,0.12)', padding: '1px 6px', borderRadius: 3 }}>初</span> : <span style={{ color: '#62627A' }}>—</span>}
                      </td>
                      <td style={{ padding: '10px' }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => setEditingId(entry.horse_id)} style={{ background: 'rgba(255,255,255,0.07)', color: '#9898B0', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>編集</button>
                          <form action={toggleScratched.bind(null, raceId, entry.horse_id, !isScratched)}>
                            <button type="submit" style={{ background: isScratched ? 'rgba(20,184,166,0.1)' : 'rgba(251,191,36,0.1)', color: isScratched ? '#14B8A6' : '#FBBF24', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>
                              {isScratched ? '取消解除' : '取消'}
                            </button>
                          </form>
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
      {!isBulkEdit && (
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
              <input name="jockey_name" type="text" placeholder="騎手名" list="jockey-list" style={{ ...inputStyle, width: 120 }} />
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
      )}
    </div>
  )
}
