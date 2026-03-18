'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type GradeRace = {
  date: string   // YYYY-MM-DD
  name: string
  grade: 'G1' | 'G2' | 'G3'
  venue: string
}

// 2026年 JRA 重賞スケジュール（公式データ）
const GRADE_RACES_2026: GradeRace[] = [
  // ── 1月 ──
  { date: '2026-01-04', name: '中山金杯',             grade: 'G3', venue: '中山' },
  { date: '2026-01-04', name: '京都金杯',             grade: 'G3', venue: '京都' },
  { date: '2026-01-11', name: 'フェアリーS',          grade: 'G3', venue: '中山' },
  { date: '2026-01-12', name: 'シンザン記念',         grade: 'G3', venue: '京都' },
  { date: '2026-01-18', name: '京成杯',               grade: 'G3', venue: '中山' },
  { date: '2026-01-18', name: '日経新春杯',           grade: 'G2', venue: '京都' },
  { date: '2026-01-25', name: 'アメリカJCC',          grade: 'G2', venue: '中山' },
  { date: '2026-01-25', name: 'プロキオンS',          grade: 'G2', venue: '京都' },
  // ── 2月 ──
  { date: '2026-02-01', name: '根岸S',                grade: 'G3', venue: '東京' },
  { date: '2026-02-01', name: 'シルクロードS',        grade: 'G3', venue: '京都' },
  { date: '2026-02-10', name: 'きさらぎ賞',           grade: 'G3', venue: '京都' },
  { date: '2026-02-10', name: '東京新聞杯',           grade: 'G3', venue: '東京' },
  { date: '2026-02-15', name: '共同通信杯',           grade: 'G3', venue: '東京' },
  { date: '2026-02-15', name: '京都記念',             grade: 'G2', venue: '京都' },
  { date: '2026-02-22', name: 'フェブラリーS',        grade: 'G1', venue: '東京' },
  { date: '2026-02-22', name: '小倉大賞典',           grade: 'G3', venue: '小倉' },
  // ── 3月 ──
  { date: '2026-03-01', name: '中山記念',             grade: 'G2', venue: '中山' },
  { date: '2026-03-01', name: 'チューリップ賞',       grade: 'G2', venue: '阪神' },
  { date: '2026-03-08', name: '弥生賞',               grade: 'G2', venue: '中山' },
  { date: '2026-03-15', name: 'スプリングS',          grade: 'G2', venue: '中山' },
  { date: '2026-03-15', name: '金鯱賞',               grade: 'G2', venue: '中京' },
  { date: '2026-03-22', name: '阪神大賞典',           grade: 'G2', venue: '阪神' },
  { date: '2026-03-22', name: '愛知杯',               grade: 'G3', venue: '中京' },
  { date: '2026-03-29', name: 'マーチS',              grade: 'G3', venue: '中山' },
  { date: '2026-03-29', name: '高松宮記念',           grade: 'G1', venue: '中京' },
  // ── 4月 ──
  { date: '2026-04-05', name: '大阪杯',               grade: 'G1', venue: '阪神' },
  { date: '2026-04-12', name: '桜花賞',               grade: 'G1', venue: '阪神' },
  { date: '2026-04-19', name: '皐月賞',               grade: 'G1', venue: '中山' },
  { date: '2026-04-19', name: '福島牝馬S',            grade: 'G3', venue: '福島' },
  { date: '2026-04-26', name: 'フローラS',            grade: 'G2', venue: '東京' },
  { date: '2026-04-26', name: 'マイラーズC',          grade: 'G2', venue: '京都' },
  // ── 5月 ──
  { date: '2026-05-03', name: '天皇賞（春）',         grade: 'G1', venue: '京都' },
  { date: '2026-05-10', name: 'NHKマイルC',           grade: 'G1', venue: '東京' },
  { date: '2026-05-17', name: 'ヴィクトリアマイル',   grade: 'G1', venue: '東京' },
  { date: '2026-05-24', name: 'オークス',             grade: 'G1', venue: '東京' },
  { date: '2026-05-31', name: '日本ダービー',         grade: 'G1', venue: '東京' },
  { date: '2026-05-31', name: '目黒記念',             grade: 'G2', venue: '東京' },
  // ── 6月 ──
  { date: '2026-06-07', name: '安田記念',             grade: 'G1', venue: '東京' },
  { date: '2026-06-14', name: '宝塚記念',             grade: 'G1', venue: '阪神' },
  { date: '2026-06-21', name: '府中牝馬S',            grade: 'G3', venue: '東京' },
  { date: '2026-06-21', name: 'しらさぎS',            grade: 'G3', venue: '阪神' },
  { date: '2026-06-28', name: 'ラジオNIKKEI賞',       grade: 'G3', venue: '福島' },
  { date: '2026-06-28', name: '函館記念',             grade: 'G3', venue: '函館' },
  // ── 7月 ──
  { date: '2026-07-05', name: '北九州記念',           grade: 'G3', venue: '小倉' },
  { date: '2026-07-12', name: '七夕賞',               grade: 'G3', venue: '福島' },
  { date: '2026-07-19', name: '小倉記念',             grade: 'G3', venue: '小倉' },
  { date: '2026-07-19', name: '函館2歳S',             grade: 'G3', venue: '函館' },
  { date: '2026-07-26', name: '関屋記念',             grade: 'G3', venue: '新潟' },
  { date: '2026-07-26', name: '東海S',                grade: 'G3', venue: '中京' },
  // ── 8月 ──
  { date: '2026-08-02', name: 'アイビスサマーダッシュ', grade: 'G3', venue: '新潟' },
  { date: '2026-08-02', name: 'クイーンS',            grade: 'G3', venue: '札幌' },
  { date: '2026-08-09', name: 'レパードS',            grade: 'G3', venue: '新潟' },
  { date: '2026-08-09', name: 'CBC賞',                grade: 'G3', venue: '中京' },
  { date: '2026-08-16', name: '中京記念',             grade: 'G3', venue: '中京' },
  { date: '2026-08-16', name: '札幌記念',             grade: 'G2', venue: '札幌' },
  { date: '2026-08-23', name: '新潟2歳S',             grade: 'G3', venue: '新潟' },
  { date: '2026-08-23', name: 'キーンランドC',        grade: 'G3', venue: '札幌' },
  { date: '2026-08-30', name: '新潟記念',             grade: 'G3', venue: '新潟' },
  { date: '2026-08-30', name: '中京2歳S',             grade: 'G3', venue: '中京' },
  // ── 9月 ──
  { date: '2026-09-06', name: '紫苑S',                grade: 'G2', venue: '中山' },
  { date: '2026-09-06', name: 'セントウルS',          grade: 'G2', venue: '阪神' },
  { date: '2026-09-13', name: 'セントライト記念',     grade: 'G2', venue: '中山' },
  { date: '2026-09-13', name: 'ローズS',              grade: 'G2', venue: '阪神' },
  { date: '2026-09-20', name: 'オールカマー',         grade: 'G2', venue: '中山' },
  { date: '2026-09-21', name: '神戸新聞杯',           grade: 'G2', venue: '阪神' },
  { date: '2026-09-27', name: 'スプリンターズS',      grade: 'G1', venue: '中山' },
  // ── 10月 ──
  { date: '2026-10-04', name: '毎日王冠',             grade: 'G2', venue: '東京' },
  { date: '2026-10-04', name: '京都大賞典',           grade: 'G2', venue: '京都' },
  { date: '2026-10-11', name: 'アイルランドT',        grade: 'G2', venue: '東京' },
  { date: '2026-10-12', name: 'スワンS',              grade: 'G2', venue: '京都' },
  { date: '2026-10-18', name: '秋華賞',               grade: 'G1', venue: '京都' },
  { date: '2026-10-25', name: '菊花賞',               grade: 'G1', venue: '京都' },
  // ── 11月 ──
  { date: '2026-11-01', name: '天皇賞（秋）',         grade: 'G1', venue: '東京' },
  { date: '2026-11-08', name: 'アルゼンチン共和国杯', grade: 'G2', venue: '東京' },
  { date: '2026-11-08', name: 'みやこS',              grade: 'G3', venue: '京都' },
  { date: '2026-11-15', name: 'エリザベス女王杯',     grade: 'G1', venue: '京都' },
  { date: '2026-11-22', name: 'マイルチャンピオンシップ', grade: 'G1', venue: '京都' },
  { date: '2026-11-23', name: '東スポ杯2歳S',         grade: 'G2', venue: '東京' },
  { date: '2026-11-29', name: 'ジャパンC',            grade: 'G1', venue: '東京' },
  { date: '2026-11-29', name: '京阪杯',               grade: 'G3', venue: '京都' },
  // ── 12月 ──
  { date: '2026-12-06', name: 'チャンピオンズC',      grade: 'G1', venue: '中京' },
  { date: '2026-12-13', name: 'カペラS',              grade: 'G3', venue: '中山' },
  { date: '2026-12-13', name: '阪神ジュベナイルF',    grade: 'G1', venue: '阪神' },
  { date: '2026-12-20', name: '朝日杯フューチュリティS', grade: 'G1', venue: '阪神' },
  { date: '2026-12-27', name: '有馬記念',             grade: 'G1', venue: '中山' },
]

const MONTH_NAMES = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']

const gradeColor: Record<string, { color: string; border: string; background: string }> = {
  G1: { color: '#FBBF24', border: '1px solid rgba(251,191,36,0.40)',  background: 'rgba(251,191,36,0.10)' },
  G2: { color: '#C0C8D0', border: '1px solid rgba(192,200,208,0.35)', background: 'rgba(192,200,208,0.08)' },
  G3: { color: '#CD853F', border: '1px solid rgba(205,133,63,0.35)',  background: 'rgba(205,133,63,0.08)' },
}

function RaceRows({ races, today }: { races: GradeRace[]; today: string }) {
  const groups: GradeRace[][] = []
  const dateMap = new Map<string, GradeRace[]>()
  for (const r of races) {
    if (!dateMap.has(r.date)) {
      const group: GradeRace[] = []
      dateMap.set(r.date, group)
      groups.push(group)
    }
    dateMap.get(r.date)!.push(r)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {groups.map((group, gi) => {
        const d = new Date(group[0].date + 'T12:00:00')
        const isPast = group[0].date < today
        const dayStr = `${d.getMonth() + 1}/${d.getDate()}`
        const DOW = ['日','月','火','水','木','金','土'][d.getDay()]
        const dowColor = d.getDay() === 0 ? '#F87171' : d.getDay() === 6 ? '#60A5FA' : '#62627A'
        return (
          <div
            key={gi}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '7px 12px', borderRadius: 8,
              background: 'rgba(255,255,255,0.02)',
              opacity: isPast ? 0.35 : 1,
            }}
          >
            <span style={{
              fontSize: 12, color: '#62627A', fontVariantNumeric: 'tabular-nums',
              width: 52, flexShrink: 0,
            }}>
              {dayStr}<span style={{ color: dowColor, marginLeft: 2, fontSize: 11 }}>({DOW})</span>
            </span>
            <div style={{
              flex: 1, display: 'grid',
              gridTemplateColumns: group.length >= 2 ? '1fr 1fr' : '1fr',
              gap: 8,
            }}>
              {group.map((race, ri) => (
                <div key={ri} style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: '2px 5px', borderRadius: 4,
                    flexShrink: 0, ...gradeColor[race.grade],
                  }}>
                    {race.grade}
                  </span>
                  <span style={{
                    fontSize: 13, fontWeight: 500, color: '#EEEEF5',
                    flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {race.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function MonthHeader({ month, isCurrentMonth }: { month: number; isCurrentMonth: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
      <span style={{
        fontSize: 12, fontWeight: 700,
        color: isCurrentMonth ? '#14B8A6' : '#62627A',
        letterSpacing: '0.04em',
      }}>
        {MONTH_NAMES[month]}
      </span>
      {isCurrentMonth && (
        <span style={{
          fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3,
          background: 'rgba(20,184,166,0.10)', color: '#14B8A6',
          border: '1px solid rgba(20,184,166,0.25)', letterSpacing: '0.04em',
        }}>
          今月
        </span>
      )}
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
    </div>
  )
}

export default function GradeCalendar({ today }: { today: string }) {
  const [futureOpen, setFutureOpen] = useState(false)

  const todayMonth = new Date(today + 'T12:00:00').getMonth()

  const byMonth: Record<number, GradeRace[]> = {}
  for (const race of GRADE_RACES_2026) {
    const m = new Date(race.date).getMonth()
    if (!byMonth[m]) byMonth[m] = []
    byMonth[m].push(race)
  }

  const currentMonthRaces = byMonth[todayMonth] ?? []
  const futureMonths = Array.from({ length: 12 }, (_, i) => i).filter(
    (m) => m > todayMonth && byMonth[m]
  )

  return (
    <div style={{ marginTop: 24 }}>
      <p style={{
        fontSize: 10, fontWeight: 700, letterSpacing: '0.10em',
        color: '#62627A', textTransform: 'uppercase', margin: '0 0 12px',
      }}>
        2026 重賞カレンダー
      </p>

      <div style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 24,
        padding: '20px',
        overflow: 'hidden',
      }}>
        {currentMonthRaces.length > 0 && (
          <div style={{ marginBottom: futureMonths.length > 0 ? 20 : 0 }}>
            <MonthHeader month={todayMonth} isCurrentMonth />
            <RaceRows races={currentMonthRaces} today={today} />
          </div>
        )}

        {futureMonths.length > 0 && (
          <>
            <motion.button
              onClick={() => setFutureOpen((v) => !v)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 10,
                background: futureOpen ? 'rgba(20,184,166,0.12)' : 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(20,184,166,0.30)',
                color: '#14B8A6', fontSize: 12, fontWeight: 600,
                letterSpacing: '0.04em', cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              翌月以降を見る
              <span style={{ opacity: 0.6, fontWeight: 400, marginLeft: 2 }}>
                {futureOpen ? '▲' : '▼'}
              </span>
            </motion.button>

            <AnimatePresence>
              {futureOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 28 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {futureMonths.map((month) => (
                      <div key={month}>
                        <MonthHeader month={month} isCurrentMonth={false} />
                        <RaceRows races={byMonth[month]} today={today} />
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  )
}
