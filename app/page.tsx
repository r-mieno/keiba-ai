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
    if (grade === 'G1') return { color: '#92400E', border: '1px solid rgba(146,64,14,0.3)',  background: 'rgba(146,64,14,0.07)' }
    if (grade === 'G2') return { color: '#374151', border: '1px solid rgba(55,65,81,0.25)',  background: 'rgba(55,65,81,0.07)'  }
    if (grade === 'G3') return { color: '#1E4F9C', border: '1px solid rgba(30,79,156,0.25)', background: 'rgba(30,79,156,0.07)' }
    return              { color: '#7A7571', border: '1px solid rgba(122,117,113,0.2)',        background: 'rgba(122,117,113,0.05)' }
  }

  const RaceRow = (race: Race, showTestBadge = false) => {
    const hasResult = resultRaceIds.has(race.id)
    const d = new Date(race.date + 'T12:00:00')
    const dow = ['日','月','火','水','木','金','土'][d.getDay()]
    const dowColor = d.getDay() === 0 ? '#DC2626' : d.getDay() === 6 ? '#2563EB' : '#A09C97'
    return (
      <a key={race.id} href={`/race/${race.id}`} className="race-link">
        <span style={{ fontSize: 12, color: '#7A7571', flexShrink: 0, fontVariantNumeric: 'tabular-nums', width: 56 }}>
          {d.getMonth() + 1}/{d.getDate()}<span style={{ color: dowColor }}>({dow})</span>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          {hasResult ? (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, flexShrink: 0,
              background: 'rgba(22,101,52,0.08)', color: '#166534', border: '1px solid rgba(22,101,52,0.25)',
            }}>
              結果
            </span>
          ) : (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, flexShrink: 0,
              background: 'rgba(30,79,156,0.08)', color: '#1E4F9C', border: '1px solid rgba(30,79,156,0.22)',
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
              background: 'rgba(146,64,14,0.07)', color: '#92400E', border: '1px solid rgba(146,64,14,0.22)',
            }}>
              検証用
            </span>
          )}
          <span style={{ fontSize: 14, fontWeight: 500, color: '#1A1814' }}>
            {race.race_name}
          </span>
        </span>
      </a>
    )
  }

  const SectionHeader = () => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '0 16px 10px',
      borderBottom: '1px solid #DDD9D1',
    }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: '#A09C97', letterSpacing: '0.06em', textTransform: 'uppercase', width: 56, flexShrink: 0 }}>
        Date
      </span>
      <span style={{ fontSize: 11, fontWeight: 600, color: '#A09C97', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        Race
      </span>
    </div>
  )

  return (
    <main style={{
      minHeight: '100vh',
      background: '#F4F0E8',
      fontFamily: 'var(--font-geist-sans), -apple-system, Inter, Arial, sans-serif',
    }}>

      {/* ── Top bar ────────────────────────────────────────────────── */}
      <div style={{
        background: '#1C1C1E',
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
          background: 'linear-gradient(135deg, #1E4F9C 0%, #163D7A 100%)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          fontSize: 16,
          lineHeight: 1,
          color: '#F4F0E8',
        }}>♞</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#F4F0E8', letterSpacing: '-0.01em' }}>
          Keiba AI
        </span>
        <span style={{
          marginLeft: 4,
          fontSize: 12,
          color: '#7A7571',
          letterSpacing: '0.01em',
        }}>
          AI競馬フォーメーション予想
        </span>
      </div>

      {/* ── Content ─────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px' }}>

        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: '#1E4F9C', textTransform: 'uppercase', margin: '0 0 10px' }}>
          AI Horse Racing
        </p>
        <h1 style={{
          fontSize: 24,
          fontWeight: 700,
          color: '#1A1814',
          margin: '0 0 10px',
          letterSpacing: '-0.02em',
          lineHeight: 1.4,
        }}>
          脚質・展開・騎手から<br />フォーメーションを自動生成
        </h1>
        <p style={{ fontSize: 13, color: '#5A5651', lineHeight: 1.9, margin: '0 0 32px' }}>
          各レースの出走馬データをAIが分析し、軸馬・ヒモ馬のフォーメーション予想を提示します。
        </p>
        <p style={{ fontSize: 12, fontWeight: 600, color: '#7A7571', letterSpacing: '0.04em', margin: '0 0 12px' }}>
          レース一覧
        </p>

        {errorMessage && (
          <div style={{
            background: 'rgba(185,28,28,0.06)',
            border: '1px solid rgba(185,28,28,0.18)',
            borderRadius: 6,
            padding: '10px 14px',
            color: '#B91C1C',
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
          <p style={{ color: '#A09C97', fontSize: 13, textAlign: 'center', padding: '32px 0' }}>
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
