import { ChevronLeft, ExternalLink } from 'lucide-react'

const STEPS = [
  {
    num: '1',
    title: 'JRAネット投票サービスに登録',
    body: 'JRAの公式ネット投票サービス（即PAT）にアカウントを作成します。氏名・住所・生年月日などの基本情報を入力して会員登録します。',
  },
  {
    num: '2',
    title: '対応銀行口座を連携',
    body: '即PATに対応した銀行口座を登録します。インターネットバンキングが使える口座が必要です。',
  },
  {
    num: '3',
    title: '入金（チャージ）',
    body: '登録した銀行口座から即PATへ入金します。購入したい金額だけ入金すればOKです。',
  },
  {
    num: '4',
    title: 'レースを選んで馬券を購入',
    body: 'レースを選び、馬番・馬券種・金額を入力して購入完了です。スマホからでも操作できます。',
  },
]

const BANKS = [
  'みずほ銀行', '三菱UFJ銀行', '三井住友銀行', 'ゆうちょ銀行',
  'りそな銀行', '楽天銀行', 'PayPay銀行', 'auじぶん銀行',
]

export default function HowToBuyPage() {
  return (
    <main style={{
      minHeight: '100vh',
      background: '#0C0C0E',
      fontFamily: 'var(--font-geist-sans), -apple-system, Inter, Arial, sans-serif',
      color: '#E8E8EA',
    }}>

      {/* ── Top bar ──────────────────────────────────────────────── */}
      <div style={{
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '0 20px',
        height: 52,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}>
        <a href="/" className="back-link">
          <ChevronLeft size={14} strokeWidth={2} />
          レース一覧
        </a>
        <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 14 }}>/</span>
        <span style={{ fontSize: 13, color: '#B0B0B8' }}>ネット馬券の買い方</span>
      </div>

      {/* ── Content ──────────────────────────────────────────────── */}
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '40px 20px 64px' }}>

        {/* Header */}
        <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', color: '#6366F1', textTransform: 'uppercase', marginBottom: 10 }}>
          Guide
        </p>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#E8E8EA', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
          ネット馬券の買い方
        </h1>
        <p style={{ fontSize: 13, color: '#7A7A84', lineHeight: 1.8, margin: '0 0 36px' }}>
          競馬場やWINSに行かなくても、スマホ・PCからネットで馬券を購入できます。
          このページは「どうやって買うのか」を簡単に知るための案内です。購入を強く勧めるものではありません。
        </p>

        {/* Steps */}
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 12, fontWeight: 600, color: '#9D9DA3', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 16 }}>
            購入までの流れ
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {STEPS.map((step) => (
              <div
                key={step.num}
                style={{
                  display: 'flex',
                  gap: 14,
                  padding: '14px 16px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <span style={{
                  width: 26, height: 26, borderRadius: 6,
                  background: 'rgba(99,102,241,0.15)', color: '#818CF8',
                  fontSize: 12, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, marginTop: 1,
                }}>
                  {step.num}
                </span>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#E8E8EA', margin: '0 0 4px' }}>{step.title}</p>
                  <p style={{ fontSize: 12, color: '#B0B0B8', lineHeight: 1.7, margin: 0 }}>{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Banks */}
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 12, fontWeight: 600, color: '#9D9DA3', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
            対応銀行の例
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {BANKS.map((bank) => (
              <span
                key={bank}
                style={{
                  fontSize: 12, color: '#B0B0B8',
                  padding: '4px 10px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 4,
                }}
              >
                {bank}
              </span>
            ))}
          </div>
          <p style={{ fontSize: 11, color: '#5C5C63', marginTop: 10 }}>
            ※ 対応状況は変わる場合があります。最新情報はJRA公式サイトでご確認ください。
          </p>
        </section>

        {/* Official links */}
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 12, fontWeight: 600, color: '#9D9DA3', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
            公式サイト
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <a
              href="https://www.jra.go.jp/kouza/voting/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 14px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8,
                color: '#B0B0B8',
                fontSize: 13,
                transition: 'background 0.12s',
              }}
            >
              <span>JRA公式 ネット投票サービスを確認する</span>
              <ExternalLink size={13} strokeWidth={2} style={{ flexShrink: 0, opacity: 0.5 }} />
            </a>
            <a
              href="https://www.ipat.jra.go.jp/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 14px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8,
                color: '#B0B0B8',
                fontSize: 13,
                transition: 'background 0.12s',
              }}
            >
              <span>即PAT（JRAネット投票）を確認する</span>
              <ExternalLink size={13} strokeWidth={2} style={{ flexShrink: 0, opacity: 0.5 }} />
            </a>
          </div>
        </section>

        {/* Disclaimer */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          paddingTop: 20,
        }}>
          <p style={{ fontSize: 11, color: '#5C5C63', lineHeight: 1.9, margin: 0 }}>
            馬券の購入は自己判断・自己責任のもとで行ってください。
            20歳未満の方は馬券を購入できません。
            のめり込みに注意し、余裕のある範囲で楽しんでください。
          </p>
        </div>

      </div>
    </main>
  )
}
