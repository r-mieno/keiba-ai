'use client'

import { useState } from 'react'

type GradeRace = {
  date: string   // YYYY-MM-DD
  name: string
  grade: 'G1' | 'G2' | 'G3'
  venue: string
}

// 2026年 JRA 重賞スケジュール（暫定・参考）
const GRADE_RACES_2026: GradeRace[] = [
  // ── 1月 ──
  { date: '2026-01-11', name: 'シンザン記念',        grade: 'G3', venue: '京都' },
  { date: '2026-01-11', name: 'フェアリーS',          grade: 'G3', venue: '中山' },
  { date: '2026-01-18', name: '日経新春杯',           grade: 'G2', venue: '中京' },
  { date: '2026-01-18', name: '京成杯',               grade: 'G3', venue: '中山' },
  { date: '2026-01-25', name: 'AJCC',                grade: 'G2', venue: '中山' },
  { date: '2026-01-25', name: '東海S',                grade: 'G2', venue: '中京' },
  // ── 2月 ──
  { date: '2026-02-01', name: 'きさらぎ賞',           grade: 'G3', venue: '京都' },
  { date: '2026-02-08', name: '共同通信杯',           grade: 'G3', venue: '東京' },
  { date: '2026-02-08', name: 'クイーンC',            grade: 'G3', venue: '東京' },
  { date: '2026-02-15', name: '京都記念',             grade: 'G2', venue: '京都' },
  { date: '2026-02-15', name: '小倉大賞典',           grade: 'G3', venue: '小倉' },
  { date: '2026-02-22', name: 'フェブラリーS',        grade: 'G1', venue: '東京' },
  // ── 3月 ──
  { date: '2026-03-01', name: 'チューリップ賞',       grade: 'G2', venue: '阪神' },
  { date: '2026-03-08', name: '弥生賞ディープ記念',   grade: 'G2', venue: '中山' },
  { date: '2026-03-08', name: 'フィリーズレビュー',   grade: 'G2', venue: '阪神' },
  { date: '2026-03-15', name: '金鯱賞',               grade: 'G2', venue: '中京' },
  { date: '2026-03-22', name: 'スプリングS',          grade: 'G2', venue: '中山' },
  { date: '2026-03-22', name: '阪神大賞典',           grade: 'G2', venue: '阪神' },
  { date: '2026-03-29', name: '高松宮記念',           grade: 'G1', venue: '中京' },
  // ── 4月 ──
  { date: '2026-04-05', name: '大阪杯',               grade: 'G1', venue: '阪神' },
  { date: '2026-04-05', name: 'ニュージーランドT',    grade: 'G2', venue: '中山' },
  { date: '2026-04-12', name: '桜花賞',               grade: 'G1', venue: '阪神' },
  { date: '2026-04-12', name: 'アーリントンC',        grade: 'G3', venue: '阪神' },
  { date: '2026-04-19', name: '皐月賞',               grade: 'G1', venue: '中山' },
  { date: '2026-04-19', name: 'フローラS',            grade: 'G2', venue: '東京' },
  { date: '2026-04-26', name: '天皇賞（春）',         grade: 'G1', venue: '京都' },
  { date: '2026-04-26', name: 'マイラーズC',          grade: 'G2', venue: '京都' },
  // ── 5月 ──
  { date: '2026-05-03', name: 'NHKマイルC',           grade: 'G1', venue: '東京' },
  { date: '2026-05-10', name: 'ヴィクトリアM',        grade: 'G1', venue: '東京' },
  { date: '2026-05-17', name: 'オークス',             grade: 'G1', venue: '東京' },
  { date: '2026-05-24', name: '日本ダービー',         grade: 'G1', venue: '東京' },
  { date: '2026-05-24', name: '目黒記念',             grade: 'G2', venue: '東京' },
  // ── 6月 ──
  { date: '2026-06-07', name: '安田記念',             grade: 'G1', venue: '東京' },
  { date: '2026-06-14', name: 'エプソムC',            grade: 'G3', venue: '東京' },
  { date: '2026-06-21', name: 'マーメイドS',          grade: 'G3', venue: '阪神' },
  { date: '2026-06-28', name: '宝塚記念',             grade: 'G1', venue: '阪神' },
  // ── 7月 ──
  { date: '2026-07-05', name: '函館スプリントS',      grade: 'G3', venue: '函館' },
  { date: '2026-07-12', name: 'プロキオンS',          grade: 'G3', venue: '中京' },
  { date: '2026-07-12', name: 'CBC賞',                grade: 'G3', venue: '中京' },
  { date: '2026-07-19', name: '函館2歳S',             grade: 'G3', venue: '函館' },
  { date: '2026-07-19', name: '七夕賞',               grade: 'G3', venue: '福島' },
  // ── 8月 ──
  { date: '2026-08-02', name: 'クイーンS',            grade: 'G3', venue: '札幌' },
  { date: '2026-08-09', name: 'エルムS',              grade: 'G3', venue: '札幌' },
  { date: '2026-08-16', name: '札幌記念',             grade: 'G2', venue: '札幌' },
  { date: '2026-08-23', name: 'キーンランドC',        grade: 'G3', venue: '札幌' },
  { date: '2026-08-23', name: '新潟2歳S',             grade: 'G3', venue: '新潟' },
  { date: '2026-08-30', name: '札幌2歳S',             grade: 'G3', venue: '札幌' },
  // ── 9月 ──
  { date: '2026-09-06', name: 'セントウルS',          grade: 'G2', venue: '阪神' },
  { date: '2026-09-13', name: 'ローズS',              grade: 'G2', venue: '阪神' },
  { date: '2026-09-13', name: 'セントライト記念',     grade: 'G2', venue: '中山' },
  { date: '2026-09-20', name: '神戸新聞杯',           grade: 'G2', venue: '阪神' },
  { date: '2026-09-20', name: 'オールカマー',         grade: 'G2', venue: '中山' },
  { date: '2026-09-27', name: 'スプリンターズS',      grade: 'G1', venue: '中山' },
  // ── 10月 ──
  { date: '2026-10-04', name: 'シリウスS',            grade: 'G3', venue: '中京' },
  { date: '2026-10-11', name: '毎日王冠',             grade: 'G2', venue: '東京' },
  { date: '2026-10-11', name: '府中牝馬S',            grade: 'G2', venue: '東京' },
  { date: '2026-10-18', name: '秋華賞',               grade: 'G1', venue: '京都' },
  { date: '2026-10-25', name: '菊花賞',               grade: 'G1', venue: '京都' },
  { date: '2026-10-25', name: '富士S',                grade: 'G2', venue: '東京' },
  { date: '2026-11-01', name: 'スワンS',              grade: 'G2', venue: '京都' },
  { date: '2026-11-01', name: '天皇賞（秋）',         grade: 'G1', venue: '東京' },
  // ── 11月 ──
  { date: '2026-11-08', name: 'アルゼンチン共和国杯', grade: 'G2', venue: '東京' },
  { date: '2026-11-08', name: '武蔵野S',              grade: 'G3', venue: '東京' },
  { date: '2026-11-15', name: 'エリザベス女王杯',     grade: 'G1', venue: '京都' },
  { date: '2026-11-22', name: 'マイルCS',             grade: 'G1', venue: '京都' },
  { date: '2026-11-22', name: '東京スポーツ杯2歳S',  grade: 'G2', venue: '東京' },
  { date: '2026-11-29', name: 'ジャパンC',            grade: 'G1', venue: '東京' },
  // ── 12月 ──
  { date: '2026-12-06', name: 'チャンピオンズC',      grade: 'G1', venue: '中京' },
  { date: '2026-12-06', name: 'ステイヤーズS',        grade: 'G2', venue: '中山' },
  { date: '2026-12-13', name: '阪神JF',               grade: 'G1', venue: '阪神' },
  { date: '2026-12-20', name: '朝日杯FS',             grade: 'G1', venue: '阪神' },
  { date: '2026-12-27', name: '有馬記念',             grade: 'G1', venue: '中山' },
  { date: '2026-12-27', name: 'ホープフルS',          grade: 'G1', venue: '中山' },
]

const MONTH_NAMES = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']

const gradeColor: Record<string, { color: string; border: string; background: string }> = {
  G1: { color: '#FBBF24', border: '1px solid rgba(251,191,36,0.35)', background: 'rgba(251,191,36,0.08)' },
  G2: { color: '#C0C8D0', border: '1px solid rgba(192,200,208,0.35)', background: 'rgba(192,200,208,0.08)' },
  G3: { color: '#CD8B5A', border: '1px solid rgba(205,139,90,0.35)', background: 'rgba(205,139,90,0.08)' },
}

function RaceRows({ races, todayMs }: { races: GradeRace[]; todayMs: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {races.map((race, i) => {
        const isPast = new Date(race.date).getTime() < todayMs
        const g = gradeColor[race.grade]
        const d = new Date(race.date)
        const dayStr = `${d.getMonth() + 1}/${d.getDate()}`
        const DOW = ['日','月','火','水','木','金','土'][d.getDay()]
        const dowColor = d.getDay() === 0 ? '#F87171' : d.getDay() === 6 ? '#60A5FA' : '#9D9DA3'
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '7px 12px',
              borderRadius: 6,
              background: 'rgba(255,255,255,0.02)',
              opacity: isPast ? 0.35 : 1,
            }}
          >
            <span style={{
              fontSize: 12,
              color: '#9D9DA3',
              fontVariantNumeric: 'tabular-nums',
              width: 52,
              flexShrink: 0,
            }}>
              {dayStr}
              <span style={{ color: dowColor, marginLeft: 3, fontSize: 11 }}>({DOW})</span>
            </span>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
              flexShrink: 0, ...g,
            }}>
              {race.grade}
            </span>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#E8E8EA', flex: 1 }}>
              {race.name}
            </span>
            <span style={{ fontSize: 11, color: '#5C5C63', flexShrink: 0 }}>
              {race.venue}
            </span>
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
        color: isCurrentMonth ? '#818CF8' : '#9D9DA3',
        letterSpacing: '0.04em',
      }}>
        {MONTH_NAMES[month]}
      </span>
      {isCurrentMonth && (
        <span style={{
          fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3,
          background: 'rgba(99,102,241,0.12)', color: '#818CF8',
          border: '1px solid rgba(99,102,241,0.25)', letterSpacing: '0.04em',
        }}>
          今月
        </span>
      )}
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
    </div>
  )
}

export default function GradeCalendar({ today }: { today: string }) {
  const [futureOpen, setFutureOpen] = useState(false)

  const todayMs = new Date(today).getTime()
  const todayMonth = new Date(today).getMonth()

  // 月ごとにグループ化
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
    <div style={{ marginTop: 48 }}>

      {/* セクションラベル */}
      <p style={{
        fontSize: 12, fontWeight: 600, color: '#9D9DA3',
        letterSpacing: '0.04em', margin: '0 0 16px',
      }}>
        2026 重賞カレンダー
      </p>

      <p style={{ margin: '0 0 16px', fontSize: 11, color: '#5C5C63' }}>
        ※ 日程は暫定です。変更になる場合があります。
      </p>

      {/* 今月：常に表示 */}
      {currentMonthRaces.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <MonthHeader month={todayMonth} isCurrentMonth />
          <RaceRows races={currentMonthRaces} todayMs={todayMs} />
        </div>
      )}

      {/* 翌月以降：トグル */}
      {futureMonths.length > 0 && (
        <>
          <button
            onClick={() => setFutureOpen((v) => !v)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: 4,
              background: futureOpen ? 'rgba(99,102,241,0.08)' : 'transparent',
              border: '1px solid rgba(99,102,241,0.2)',
              color: '#818CF8',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.06em',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            翌月以降を見る
            <span style={{ opacity: 0.6, fontWeight: 400, marginLeft: 2 }}>
              {futureOpen ? '▲' : '▼'}
            </span>
          </button>

          {futureOpen && (
            <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 28 }}>
              {futureMonths.map((month) => (
                <div key={month}>
                  <MonthHeader month={month} isCurrentMonth={false} />
                  <RaceRows races={byMonth[month]} todayMs={todayMs} />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
