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
    <main
      style={{
        minHeight: '100vh',
        background: '#f5f2ed',
        padding: '40px 24px',
        fontFamily: 'var(--font-geist-sans), Arial, sans-serif',
      }}
    >
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        {/* Header */}
        <div
          style={{
            borderBottom: '2px solid #1a5c35',
            paddingBottom: 16,
            marginBottom: 32,
          }}
        >
          <h1
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: '#1e1b18',
              margin: 0,
              letterSpacing: '0.02em',
            }}
          >
            競馬AI予想
          </h1>
          <p style={{ color: '#9b9490', fontSize: 13, marginTop: 4 }}>
            AIによるレース分析・フォーメーション予想
          </p>
        </div>

        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.08em',
            color: '#9b9490',
            textTransform: 'uppercase',
            marginBottom: 12,
          }}
        >
          レース一覧
        </p>

        {errorMessage && (
          <div
            style={{
              background: '#fdf2f2',
              border: '1px solid #e8c8c8',
              borderRadius: 8,
              padding: '10px 14px',
              color: '#a83030',
              fontSize: 13,
              marginBottom: 20,
            }}
          >
            エラー: {errorMessage}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {races.map((race) => (
            <a
              key={race.id}
              href={`/race/${race.id}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                background: '#ffffff',
                border: '1px solid #e0dbd3',
                borderRadius: 8,
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <span style={{ color: '#1e1b18', fontSize: 15, fontWeight: 500 }}>
                {race.race_name}
              </span>
              <span style={{ color: '#9b9490', fontSize: 13 }}>{race.date}</span>
            </a>
          ))}
        </div>
      </div>
    </main>
  )
}
