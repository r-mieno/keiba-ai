type Race = {
  id: string
  race_name: string
  date: string
}

export default async function Home() {
  let races: Race[] = []
  let errorMessage = ''

  try {
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/races?select=id,race_name,date&order=date.asc`

    const res = await fetch(url, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      cache: 'no-store',
    })

    if (!res.ok) {
      errorMessage = `取得失敗: ${res.status}`
    } else {
      races = await res.json()
    }
  } catch (e) {
    errorMessage = e instanceof Error ? e.message : 'unknown error'
  }

  return (
    <main style={{ minHeight: '100vh', background: '#f5f2ed', fontFamily: 'var(--font-geist-sans), Arial, sans-serif' }}>

      {/* ── Hero header ─────────────────────────────────────────────── */}
      <div style={{ background: '#0f1117', padding: '40px 24px 36px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <p style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.14em',
            color: '#1a5c35',
            textTransform: 'uppercase',
            marginBottom: 12,
          }}>
            AI Horse Racing Analysis
          </p>
          <h1 style={{
            fontSize: 32,
            fontWeight: 800,
            color: '#f5f2ed',
            margin: 0,
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
          }}>
            競馬AI予想
          </h1>
          <p style={{ color: '#4a4540', fontSize: 13, marginTop: 10, lineHeight: 1.6 }}>
            レース構造・展開・期待値をAIが分析
          </p>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '36px 24px' }}>

        <p style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.1em',
          color: '#9b9490',
          textTransform: 'uppercase',
          marginBottom: 16,
        }}>
          Races
        </p>

        {errorMessage && (
          <div style={{
            background: '#fdf2f2',
            border: '1px solid #e8c8c8',
            borderRadius: 6,
            padding: '10px 14px',
            color: '#a83030',
            fontSize: 13,
            marginBottom: 20,
          }}>
            エラー: {errorMessage}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {races.map((race) => (
            <a key={race.id} href={`/race/${race.id}`} className="race-link">
              <span style={{ color: '#1e1b18', fontSize: 15, fontWeight: 600 }}>
                {race.race_name}
              </span>
              <span style={{
                fontSize: 11,
                fontWeight: 600,
                color: '#9b9490',
                background: '#f0ece6',
                padding: '3px 10px',
                borderRadius: 4,
                flexShrink: 0,
                letterSpacing: '0.03em',
              }}>
                {race.date.replace(/-/g, '/')}
              </span>
            </a>
          ))}
        </div>

        {races.length === 0 && !errorMessage && (
          <p style={{ color: '#9b9490', fontSize: 13, textAlign: 'center', padding: '40px 0' }}>
            レースデータがありません
          </p>
        )}
      </div>
    </main>
  )
}
