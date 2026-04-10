'use client'

import { useState } from 'react'
import { updateJockey, deleteJockey } from './actions'

type Jockey = {
  jockey_name: string
  place3_rate: number | null
}

const inputStyle = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 6,
  padding: '5px 8px',
  fontSize: 13,
  color: '#EEEEF5',
  outline: 'none',
  width: 80,
}

export default function JockeyList({ jockeys }: { jockeys: Jockey[] }) {
  const [query, setQuery] = useState('')
  const [editingName, setEditingName] = useState<string | null>(null)

  const filtered = query
    ? jockeys.filter((j) => j.jockey_name.includes(query))
    : jockeys

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <input
        type="text"
        placeholder="騎手名で検索..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 8,
          padding: '9px 14px',
          fontSize: 13,
          color: '#EEEEF5',
          outline: 'none',
          width: 280,
        }}
      />

      <div style={{ background: '#13141F', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              {['騎手名', '3着内率', ''].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: '#62627A', fontWeight: 600, fontSize: 11 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((j) => {
              const isEditing = editingName === j.jockey_name
              return (
                <tr key={j.jockey_name} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  {isEditing ? (
                    <>
                      <td style={{ padding: '8px 16px', color: '#EEEEF5', fontWeight: 500 }}>{j.jockey_name}</td>
                      <td colSpan={2} style={{ padding: '8px 16px' }}>
                        <form
                          action={async (fd) => { await updateJockey(fd); setEditingName(null) }}
                          style={{ display: 'flex', gap: 8, alignItems: 'center' }}
                        >
                          <input type="hidden" name="jockey_name" value={j.jockey_name} />
                          <input
                            name="place3_rate"
                            type="number"
                            step="0.001"
                            min="0"
                            max="1"
                            defaultValue={j.place3_rate ?? ''}
                            placeholder="0.350"
                            style={inputStyle}
                          />
                          <button type="submit" style={{ background: '#14B8A6', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>保存</button>
                          <button type="button" onClick={() => setEditingName(null)} style={{ background: 'rgba(255,255,255,0.08)', color: '#9898B0', border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 12, cursor: 'pointer' }}>×</button>
                        </form>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ padding: '12px 16px', color: '#EEEEF5', fontWeight: 500 }}>{j.jockey_name}</td>
                      <td style={{ padding: '12px 16px', color: '#9898B0' }}>
                        {j.place3_rate != null ? j.place3_rate.toFixed(3) : '—'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={() => setEditingName(j.jockey_name)}
                            style={{ background: 'rgba(255,255,255,0.07)', color: '#9898B0', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}
                          >
                            編集
                          </button>
                          <form action={deleteJockey.bind(null, j.jockey_name)}>
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
        {filtered.length === 0 && (
          <p style={{ textAlign: 'center', padding: '32px', color: '#62627A', fontSize: 13 }}>該当なし</p>
        )}
      </div>

      <p style={{ fontSize: 12, color: '#62627A', margin: 0 }}>{filtered.length} 名表示中（全 {jockeys.length} 名）</p>
    </div>
  )
}
