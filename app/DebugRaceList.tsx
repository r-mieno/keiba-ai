'use client'

import { useState } from 'react'

type Race = {
  id: string
  race_name: string
  date: string
  is_test: boolean
}

type Props = {
  races: Race[]
  resultRaceIds: string[]
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
          background: open ? 'rgba(251,191,36,0.08)' : 'transparent',
          border: '1px solid rgba(251,191,36,0.2)',
          color: '#FBBF24',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.06em',
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: open ? '#FBBF24' : 'rgba(251,191,36,0.4)',
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
            display: 'grid',
            gridTemplateColumns: '1fr 100px',
            padding: '0 16px 10px',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#9D9DA3', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Race</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#9D9DA3', letterSpacing: '0.06em', textTransform: 'uppercase', textAlign: 'right' }}>Date</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {races.map((race) => (
              <a key={race.id} href={`/race/${race.id}`} className="race-link">
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, flexShrink: 0,
                    background: resultSet.has(race.id) ? 'rgba(52,211,153,0.1)' : 'rgba(99,102,241,0.1)',
                    color: resultSet.has(race.id) ? '#34D399' : '#818CF8',
                    border: `1px solid ${resultSet.has(race.id) ? 'rgba(52,211,153,0.25)' : 'rgba(99,102,241,0.25)'}`,
                  }}>
                    {resultSet.has(race.id) ? '結果' : '予想中'}
                  </span>
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4, flexShrink: 0,
                    background: 'rgba(251,191,36,0.08)', color: '#FBBF24', border: '1px solid rgba(251,191,36,0.2)',
                  }}>
                    検証用
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 500, color: '#E8E8EA' }}>
                    {race.race_name}
                  </span>
                </span>
                <span style={{ fontSize: 12, color: '#9D9DA3', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                  {race.date.replace(/-/g, '/')}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
