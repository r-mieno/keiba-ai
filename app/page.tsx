import DebugRaceList from './DebugRaceList'
import GradeCalendar from './GradeCalendar'

type Race = {
  id: string
  race_name: string
  date: string
  is_test: boolean
  grade?: string | null
}

export default async function Home() {
  let races: Race[] = []
  let resultRaceIds = new Set<string>()
  let errorMessage = ''

  try {
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const headers = { apikey: key, Authorization: `Bearer ${key}` }

    const [racesRes, resultsRes] = await Promise.all([
      fetch(`${base}/rest/v1/races?select=id,race_name,date,is_test,grade&order=date.desc`, {
        headers, cache: 'no-store',
      }),
      fetch(`${base}/rest/v1/race_results?select=race_id`, {
        headers, cache: 'no-store',
      }),
    ])

    if (!racesRes.ok) {
      errorMessage = `取得失敗: ${racesRes.status}`
    } else {
      races = await racesRes.json()
    }
    if (resultsRes.ok) {
      const results: { race_id: string }[] = await resultsRes.json()
      resultRaceIds = new Set(results.map((r) => r.race_id))
    }
  } catch (e) {
    errorMessage = e instanceof Error ? e.message : 'unknown error'
  }

  const normalRaces = races.filter((r) => !r.is_test)
  const testRaces = races.filter((r) => r.is_test)

  const gradeStyle = (grade: string) => {
    if (grade === 'G1') return { color: '#FBBF24', border: '1px solid rgba(251,191,36,0.35)', background: 'rgba(251,191,36,0.08)' }
    if (grade === 'G2') return { color: '#C0C8D0', border: '1px solid rgba(192,200,208,0.35)', background: 'rgba(192,200,208,0.08)' }
    if (grade === 'G3') return { color: '#CD8B5A', border: '1px solid rgba(205,139,90,0.35)', background: 'rgba(205,139,90,0.08)' }
    return { color: '#9D9DA3', border: '1px solid rgba(157,157,163,0.25)', background: 'rgba(157,157,163,0.06)' }
  }

  const RaceRow = (race: Race, showTestBadge = false) => {
    const hasResult = resultRaceIds.has(race.id)
    const d = new Date(race.date + 'T12:00:00')
    const dow = ['日','月','火','水','木','金','土'][d.getDay()]
    const dowColor = d.getDay() === 0 ? '#F87171' : d.getDay() === 6 ? '#60A5FA' : '#9D9DA3'
    return (
      <a key={race.id} href={`/race/${race.id}`} className="race-link">
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {hasResult ? (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, flexShrink: 0,
              background: 'rgba(52,211,153,0.1)', color: '#34D399', border: '1px solid rgba(52,211,153,0.25)',
            }}>
              結果
            </span>
          ) : (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, flexShrink: 0,
              background: 'rgba(99,102,241,0.1)', color: '#818CF8', border: '1px solid rgba(99,102,241,0.25)',
            }}>
              予想中
            </span>
          )}
          {race.grade && (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, flexShrink: 0,
              ...gradeStyle(race.grade),
            }}>
              {race.grade}
            </span>
          )}
          {showTestBadge && (
            <span style={{
              fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4, flexShrink: 0,
              background: 'rgba(251,191,36,0.08)', color: '#FBBF24', border: '1px solid rgba(251,191,36,0.2)',
            }}>
              検証用
            </span>
          )}
          <span style={{ fontSize: 14, fontWeight: 500, color: '#E8E8EA' }}>
            {race.race_name}
          </span>
        </span>
        <span style={{ fontSize: 12, color: '#9D9DA3', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
          {d.getMonth() + 1}/{d.getDate()}<span style={{ color: dowColor }}>({dow})</span>
        </span>
      </a>
    )
  }

  const SectionHeader = () => (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 100px',
      padding: '0 16px 10px',
      borderBottom: '1px solid rgba(255,255,255,0.1)',
    }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: '#9D9DA3', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        Race
      </span>
      <span style={{ fontSize: 11, fontWeight: 600, color: '#9D9DA3', letterSpacing: '0.06em', textTransform: 'uppercase', textAlign: 'right' }}>
        Date
      </span>
    </div>
  )

  return (
    <main style={{
      minHeight: '100vh',
      background: '#0C0C0E',
      fontFamily: 'var(--font-geist-sans), -apple-system, Inter, Arial, sans-serif',
    }}>

      {/* ── Top bar ────────────────────────────────────────────────── */}
      <div style={{
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '0 24px',
        height: 52,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <span style={{
          width: 28,
          height: 28,
          borderRadius: 6,
          background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          fontSize: 16,
          lineHeight: 1,
        }}>♞</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#E8E8EA', letterSpacing: '-0.01em' }}>
          Keiba AI
        </span>
        <span style={{
          marginLeft: 4,
          fontSize: 12,
          color: '#5C5C63',
          letterSpacing: '0.01em',
        }}>
          AI競馬フォーメーション予想
        </span>
      </div>

      {/* ── Content ─────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px' }}>

        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: '#6366F1', textTransform: 'uppercase', margin: '0 0 10px' }}>
          AI Horse Racing
        </p>
        <h1 style={{
          fontSize: 24,
          fontWeight: 700,
          color: '#E8E8EA',
          margin: '0 0 10px',
          letterSpacing: '-0.02em',
        }}>
          脚質・展開・騎手から<br />フォーメーションを自動生成
        </h1>
        <p style={{ fontSize: 13, color: '#7A7A84', lineHeight: 1.8, margin: '0 0 32px' }}>
          各レースの出走馬データをAIが分析し、軸馬・ヒモ馬のフォーメーション予想を提示します。
        </p>
        <p style={{ fontSize: 12, fontWeight: 600, color: '#9D9DA3', letterSpacing: '0.04em', margin: '0 0 12px' }}>
          レース一覧
        </p>

        {errorMessage && (
          <div style={{
            background: 'rgba(248,113,113,0.08)',
            border: '1px solid rgba(248,113,113,0.2)',
            borderRadius: 6,
            padding: '10px 14px',
            color: '#F87171',
            fontSize: 13,
            marginBottom: 20,
          }}>
            {errorMessage}
          </div>
        )}

        <SectionHeader />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {normalRaces.map((race) => RaceRow(race, false))}
        </div>
        {normalRaces.length === 0 && !errorMessage && (
          <p style={{ color: '#5C5C63', fontSize: 13, textAlign: 'center', padding: '32px 0' }}>
            レースデータがありません
          </p>
        )}

        {/* ── 重賞カレンダー ───────────────────────────────────────────── */}
        <GradeCalendar today={new Date().toISOString().slice(0, 10)} />

        {/* ── 検証レース（DEBUG トグル） ──────────────────────────────── */}
        {testRaces.length > 0 && (
          <DebugRaceList
            races={testRaces}
            resultRaceIds={[...resultRaceIds]}
          />
        )}
      </div>
    </main>
  )
}
