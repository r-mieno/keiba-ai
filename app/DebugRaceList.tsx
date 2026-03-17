'use client'

import { useState } from 'react'

type Race = {
  id: string
  race_name: string
  date: string
  is_test: boolean
  grade?: string | null
}

type Props = {
  races: Race[]
  resultRaceIds: string[]
}

const gradeStyle = (grade: string) => {
  if (grade === 'G1') return { color: '#92400E', border: '1px solid rgba(146,64,14,0.30)',  background: 'rgba(146,64,14,0.07)'  }
  if (grade === 'G2') return { color: '#374151', border: '1px solid rgba(55,65,81,0.25)',   background: 'rgba(55,65,81,0.07)'   }
  if (grade === 'G3') return { color: '#1E4F9C', border: '1px solid rgba(30,79,156,0.25)',  background: 'rgba(30,79,156,0.07)'  }
  return              { color: '#7A7571', border: '1px solid rgba(122,117,113,0.2)',         background: 'rgba(122,117,113,0.05)' }
}

export default function DebugRaceList({ races, resultRaceIds }: Props) {
  const [open, setOpen] = useState(false)
  const resultSet = new Set(resultRaceIds)

  return (
    <div style={{ marginTop: 48 }}>
      {/* toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 10px',
          borderRadius: 4,
          background: open ? 'rgba(146,64,14,0.07)' : 'transparent',
          border: '1px solid rgba(146,64,14,0.22)',
          color: '#92400E',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.06em',
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: open ? '#92400E' : 'rgba(146,64,14,0.35)',
          flexShrink: 0,
        }} />
        DEBUG
        <span style={{ opacity: 0.6, fontWeight: 400, marginLeft: 2 }}>
          {open ? '▲' : '▼'}
        </span>
      </button>

      {/* 検証レース一覧 */}
      {open && (
        <div style={{ marginTop: 14 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '0 16px 10px',
            borderBottom: '1px solid #DDD9D1',
          }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#A09C97', letterSpacing: '0.06em', textTransform: 'uppercase', width: 56, flexShrink: 0 }}>Date</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#A09C97', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Race</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {races.map((race) => {
              const d = new Date(race.date + 'T12:00:00')
              const dow = ['日','月','火','水','木','金','土'][d.getDay()]
              const dowColor = d.getDay() === 0 ? '#DC2626' : d.getDay() === 6 ? '#2563EB' : '#A09C97'
              return (
              <a key={race.id} href={`/race/${race.id}`} className="race-link">
                <span style={{ fontSize: 12, color: '#7A7571', flexShrink: 0, fontVariantNumeric: 'tabular-nums', width: 56 }}>
                  {d.getMonth() + 1}/{d.getDate()}<span style={{ color: dowColor }}>({dow})</span>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, flexShrink: 0,
                    background: resultSet.has(race.id) ? 'rgba(22,101,52,0.08)'  : 'rgba(30,79,156,0.08)',
                    color:      resultSet.has(race.id) ? '#166534'               : '#1E4F9C',
                    border:    `1px solid ${resultSet.has(race.id) ? 'rgba(22,101,52,0.25)' : 'rgba(30,79,156,0.22)'}`,
                  }}>
                    {resultSet.has(race.id) ? '結果' : '予想中'}
                  </span>
                  {race.grade && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, flexShrink: 0,
                      ...gradeStyle(race.grade),
                    }}>
                      {race.grade}
                    </span>
                  )}
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4, flexShrink: 0,
                    background: 'rgba(146,64,14,0.07)', color: '#92400E', border: '1px solid rgba(146,64,14,0.22)',
                  }}>
                    検証用
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 500, color: '#1A1814' }}>
                    {race.race_name}
                  </span>
                </span>
              </a>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
