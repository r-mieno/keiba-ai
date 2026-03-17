import { ChevronLeft } from 'lucide-react'

type Term = {
  word: string
  reading?: string
  body: string
  tags?: string[]
}

const TERMS: Term[] = [
  // ── 馬券の買い方 ──────────────────────────────────────────────
  {
    word: '買い目',
    reading: 'かいめ',
    body: '馬券で購入する組み合わせのこと。「どの馬が何着に来るか」を指定したもので、1点ごとに金額を設定して購入する。',
    tags: ['馬券'],
  },
  {
    word: '軸馬',
    reading: 'じくうま',
    body: 'フォーメーション買いで中心に据える馬。必ず絡むと読んだ1〜2頭を選び、その馬を基点に相手を広げる。',
    tags: ['馬券'],
  },
  {
    word: '相手（ヒモ）',
    reading: 'あいて（ひも）',
    body: '軸馬と組み合わせる馬のこと。軸が来たときに一緒に絡むことで馬券が的中する。広く取るほど的中率は上がるが、投資額も増える。',
    tags: ['馬券'],
  },
  {
    word: 'フォーメーション',
    body: '軸馬と相手馬をそれぞれ複数指定し、その組み合わせをまとめて購入する買い方。全通り（ボックス）より少ない点数で効率よくカバーできる。',
    tags: ['馬券'],
  },
  {
    word: '三連複',
    reading: 'さんれんぷく',
    body: '1・2・3着に入る馬3頭を着順関係なく当てる馬券。着順は問わないが3頭すべてを当てる必要があり、高配当が出やすい。',
    tags: ['馬券'],
  },
  // ── レースの展開・ペース ───────────────────────────────────────
  {
    word: '展開',
    reading: 'てんかい',
    body: 'レース中のペースや位置取りの流れのこと。「ハイペース」「スローペース」などにより、どの脚質の馬が有利になるかが大きく変わる。',
    tags: ['展開'],
  },
  {
    word: 'ペース',
    body: 'レース序盤〜中盤の走る速さの目安。速い（ハイペース）と先行馬が消耗しやすく差し・追い込みが有利に。遅い（スローペース）と前残りになりやすい。',
    tags: ['展開'],
  },
  // ── 脚質 ─────────────────────────────────────────────────────
  {
    word: '脚質',
    reading: 'きゃくしつ',
    body: '各馬がレースで好む位置取りや走り方の傾向。逃げ・先行・差し・追い込みの4種類に分類される。コースや展開との相性が成績に影響する。',
    tags: ['脚質'],
  },
  {
    word: '逃げ',
    reading: 'にげ',
    body: 'スタート直後からハナ（先頭）に立ち、そのまま先頭でペースをつくるスタイル。スローに持ち込めば粘り込みが効くが、ハイペースになると後半に失速しやすい。',
    tags: ['脚質'],
  },
  {
    word: '先行',
    reading: 'せんこう',
    body: '先頭集団の直後（2〜4番手）につける位置取り。好位から直線で先頭を交わすことを狙う。安定感があり、多くの重賞馬が得意とするスタイル。',
    tags: ['脚質'],
  },
  {
    word: '差し',
    reading: 'さし',
    body: '中団からレースを進め、直線で加速して前の馬を交わす戦法。ハイペースで前が崩れる展開に強い。末脚の確かさが問われる。',
    tags: ['脚質'],
  },
  {
    word: '追い込み',
    reading: 'おいこみ',
    body: '後方待機から直線で一気に末脚を炸裂させるスタイル。展開にハマれば大外から突き抜けることもあるが、前が止まらないと届かないリスクもある。',
    tags: ['脚質'],
  },
  // ── レースの種別・グレード ─────────────────────────────────────
  {
    word: '重賞',
    reading: 'じゅうしょう',
    body: 'G1・G2・G3の格付けがついた特別重要なレース。賞金や出走条件が一般より高く設定されており、競馬のハイライトとなる。',
    tags: ['レース'],
  },
  {
    word: 'G1 / G2 / G3',
    body: '重賞レースの格付け。G1が最高位で日本ダービー・有馬記念などが該当。G2・G3は次点の重要レース。数字が小さいほど高格付け。',
    tags: ['レース'],
  },
  // ── コース種別 ────────────────────────────────────────────────
  {
    word: '芝',
    reading: 'しば',
    body: '芝生のコース。クッション性が高くスピードが問われる。日本の主要G1レースの多くは芝で行われる。雨の影響を受けやすい。',
    tags: ['コース'],
  },
  {
    word: 'ダート',
    body: '砂のコース。芝より力強さとスタミナが求められ、重くなりやすい。雨が降ると馬場が締まり、速いタイムが出やすくなる場合もある。',
    tags: ['コース'],
  },
]

const TAG_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  馬券: { color: '#14B8A6', bg: 'rgba(20,184,166,0.10)', border: 'rgba(20,184,166,0.25)' },
  展開: { color: '#60A5FA', bg: 'rgba(96,165,250,0.10)', border: 'rgba(96,165,250,0.25)' },
  脚質: { color: '#FBBF24', bg: 'rgba(251,191,36,0.10)', border: 'rgba(251,191,36,0.25)' },
  レース: { color: '#C0C8D0', bg: 'rgba(192,200,208,0.08)', border: 'rgba(192,200,208,0.25)' },
  コース: { color: '#A78BFA', bg: 'rgba(167,139,250,0.10)', border: 'rgba(167,139,250,0.25)' },
}

// Group by tags[0]
const TAG_ORDER = ['馬券', '展開', '脚質', 'レース', 'コース']
const TAG_LABELS: Record<string, string> = {
  馬券: '馬券の買い方',
  展開: '展開・ペース',
  脚質: '脚質',
  レース: 'レースの種別',
  コース: 'コース種別',
}

export default function GlossaryPage() {
  const grouped = TAG_ORDER.map((tag) => ({
    tag,
    label: TAG_LABELS[tag],
    terms: TERMS.filter((t) => (t.tags?.[0] ?? '') === tag),
  }))

  return (
    <main style={{
      minHeight: '100vh',
      background: '#0C0D14',
      fontFamily: 'var(--font-geist-sans), -apple-system, Inter, Arial, sans-serif',
      color: '#EEEEF5',
    }}>

      {/* ── Top bar ──────────────────────────────────────────────── */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '0 20px',
        height: 52,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <a href="/" className="back-link">
          <ChevronLeft size={14} strokeWidth={2} />
          レース一覧
        </a>
        <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 14 }}>/</span>
        <span style={{ fontSize: 13, color: '#9898B0' }}>競馬用語集</span>
      </div>

      {/* ── Content ──────────────────────────────────────────────── */}
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '40px 20px 64px' }}>

        {/* Header */}
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: '#14B8A6', textTransform: 'uppercase', marginBottom: 10 }}>
          Glossary
        </p>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#EEEEF5', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
          競馬用語集
        </h1>
        <p style={{ fontSize: 13, color: '#62627A', lineHeight: 1.8, margin: '0 0 40px' }}>
          このサイトで使われている競馬用語を簡単に説明します。
          馬券の仕組みから脚質・展開まで、予想をより深く読み取るための参考にしてください。
        </p>

        {/* Grouped sections */}
        {grouped.map(({ tag, label, terms }) => (
          <section key={tag} style={{ marginBottom: 36 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{
                fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
                color: TAG_COLORS[tag].color,
                background: TAG_COLORS[tag].bg,
                border: `1px solid ${TAG_COLORS[tag].border}`,
                letterSpacing: '0.06em',
              }}>
                {tag}
              </span>
              <h2 style={{ fontSize: 10, fontWeight: 700, color: '#62627A', letterSpacing: '0.10em', textTransform: 'uppercase', margin: 0 }}>
                {label}
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {terms.map((term) => (
                <div
                  key={term.word}
                  style={{
                    padding: '14px 16px',
                    background: '#13141F',
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#EEEEF5' }}>
                      {term.word}
                    </span>
                    {term.reading && (
                      <span style={{ fontSize: 11, color: '#62627A' }}>
                        {term.reading}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 12, color: '#9898B0', lineHeight: 1.75, margin: 0 }}>
                    {term.body}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* Footer note */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 20 }}>
          <p style={{ fontSize: 11, color: '#62627A', lineHeight: 1.9, margin: 0 }}>
            用語の説明はこのサイト内での使用文脈に合わせたものです。
            より詳しい情報はJRA公式サイトをご参照ください。
          </p>
        </div>

      </div>
    </main>
  )
}
