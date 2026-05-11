'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
// ボタンスタイルは GradeCalendar.tsx の「翌月以降を見る」ボタンと共通

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
  if (grade === 'G1') return { color: '#FBBF24', border: '1px solid rgba(251,191,36,0.35)',  background: 'rgba(251,191,36,0.10)'  }
  if (grade === 'G2') return { color: '#C0C8D0', border: '1px solid rgba(192,200,208,0.35)', background: 'rgba(192,200,208,0.08)' }
  if (grade === 'G3') return { color: '#CD853F', border: '1px solid rgba(205,133,63,0.35)',  background: 'rgba(205,133,63,0.08)'  }
  return              { color: '#62627A', border: '1px solid rgba(98,98,122,0.25)',            background: 'rgba(98,98,122,0.06)'   }
}

function RaceRow({ race, hasResult }: { race: Race; hasResult: boolean }) {
  const d = new Date(race.date + 'T12:00:00')
  const dow = ['日','月','火','水','木','金','土'][d.getDay()]
  const dowColor = d.getDay() === 0 ? '#F87171' : d.getDay() === 6 ? '#60A5FA' : '#62627A'

  return (
    <motion.a
      href={`/race/${race.id}`}
      className="race-link"
      whileHover={{ backgroundColor: 'rgba(255,255,255,0.04)', x: 3 }}
      whileTap={{ scale: 0.97, backgroundColor: 'rgba(255,255,255,0.07)' }}
      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      <span style={{
        fontSize: 12, color: '#62627A', flexShrink: 0,
        fontVariantNumeric: 'tabular-nums', width: 52,
      }}>
        {d.getMonth() + 1}/{d.getDate()}
        <span style={{ color: dowColor }}>({dow})</span>
      </span>

      <span style={{ display: 'flex', alignItems: 'center', gap: 7, flex: 1, minWidth: 0 }}>
        {hasResult ? (
          <span style={{
            fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4, flexShrink: 0,
            background: 'rgba(52,211,153,0.10)', color: '#34D399',
            border: '1px solid rgba(52,211,153,0.25)',
          }}>
            結果
          </span>
        ) : (
          <span style={{
            fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4, flexShrink: 0,
            background: 'rgba(244,114,182,0.10)', color: '#F472B6',
            border: '1px solid rgba(244,114,182,0.25)',
          }}>
            予想中
          </span>
        )}

        {race.grade && (
          <span style={{
            fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, flexShrink: 0,
            ...gradeStyle(race.grade),
          }}>
            {race.grade}
          </span>
        )}

        <span style={{
          fontSize: 14, fontWeight: 500, color: '#EEEEF5',
          flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {race.race_name}
        </span>
      </span>
    </motion.a>
  )
}

export default function RaceList({ races, resultRaceIds }: Props) {
  const [showOld, setShowOld] = useState(false)
  const resultSet = new Set(resultRaceIds)

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 60)
  const cutoffStr = cutoff.toISOString().slice(0, 10)

  const recentRaces = races.filter((r) => r.date >= cutoffStr)
  const oldRaces    = races.filter((r) => r.date <  cutoffStr)

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {recentRaces.map((race) => (
        <RaceRow key={race.id} race={race} hasResult={resultSet.has(race.id)} />
      ))}

      {oldRaces.length > 0 && (
        <>
          {showOld && oldRaces.map((race) => (
            <RaceRow key={race.id} race={race} hasResult={resultSet.has(race.id)} />
          ))}
          <motion.button
            onClick={() => setShowOld((v) => !v)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            style={{
              margin: '10px 0 4px',
              alignSelf: 'flex-start',
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 10,
              background: showOld ? 'rgba(20,184,166,0.12)' : 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(20,184,166,0.30)',
              color: '#14B8A6', fontSize: 12, fontWeight: 600,
              letterSpacing: '0.04em', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            {showOld ? '閉じる' : `過去のレースをもっと見る（${oldRaces.length}件）`}
            <span style={{ opacity: 0.6, fontWeight: 400, marginLeft: 2 }}>
              {showOld ? '▲' : '▼'}
            </span>
          </motion.button>
        </>
      )}
    </div>
  )
}
