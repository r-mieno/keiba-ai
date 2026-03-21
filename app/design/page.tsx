export default function DesignPage() {
  const sectionLabel: React.CSSProperties = {
    fontSize: 10, fontWeight: 700, letterSpacing: '0.10em',
    textTransform: 'uppercase', color: '#62627A', margin: '0 0 16px',
  }
  const card: React.CSSProperties = {
    background: '#13141F', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12, padding: '20px',
  }
  const section = (label: string, children: React.ReactNode) => (
    <div style={{ marginBottom: 40 }}>
      <p style={sectionLabel}>{label}</p>
      {children}
    </div>
  )

  return (
    <div style={{ background: '#0C0D14', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{
        background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '0 20px', height: 52, display: 'flex', alignItems: 'center', gap: 16,
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <a href="/" style={{ fontSize: 12, color: '#62627A', textDecoration: 'none' }}>← 戻る</a>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#EEEEF5' }}>Design System</span>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 20px 80px' }}>

        {/* ── カラーパレット ── */}
        {section('Color Palette', (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { name: 'ページ背景', value: '#0C0D14', sample: '#0C0D14', border: true },
              { name: 'カード背景', value: '#13141F', sample: '#13141F', border: true },
              { name: 'テキスト（高）', value: '#EEEEF5', sample: '#EEEEF5' },
              { name: 'テキスト（中）', value: '#9898B0', sample: '#9898B0' },
              { name: 'テキスト（低）', value: '#62627A', sample: '#62627A' },
              { name: 'アクセント Teal', value: '#14B8A6', sample: '#14B8A6' },
              { name: 'ピンク', value: '#F472B6', sample: '#F472B6' },
              { name: 'イエロー', value: '#FBBF24', sample: '#FBBF24' },
              { name: 'グリーン', value: '#34D399', sample: '#34D399' },
              { name: 'ボーダー', value: 'rgba(255,255,255,0.08)', sample: 'rgba(255,255,255,0.08)', border: true },
            ].map(({ name, value, sample, border }) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  background: sample,
                  border: border ? '1px solid rgba(255,255,255,0.15)' : undefined,
                }} />
                <span style={{ fontSize: 13, color: '#9898B0', width: 160 }}>{name}</span>
                <code style={{ fontSize: 11, color: '#62627A', fontFamily: 'monospace' }}>{value}</code>
              </div>
            ))}
          </div>
        ))}

        {/* ── タイポグラフィ ── */}
        {section('Typography', (
          <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#EEEEF5' }}>ページタイトル 22px/700</div>
              <code style={{ fontSize: 10, color: '#62627A' }}>fontSize:22, fontWeight:700, color:#EEEEF5</code>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#EEEEF5' }}>セクション見出し 15px/700</div>
              <code style={{ fontSize: 10, color: '#62627A' }}>fontSize:15, fontWeight:700, color:#EEEEF5</code>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 400, color: '#9898B0' }}>本文テキスト 13px/400</div>
              <code style={{ fontSize: 10, color: '#62627A' }}>fontSize:13, fontWeight:400, color:#9898B0</code>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 400, color: '#62627A' }}>キャプション 11px/400</div>
              <code style={{ fontSize: 10, color: '#62627A' }}>fontSize:11, fontWeight:400, color:#62627A</code>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: '#62627A' }}>
                Section Label 10px/700
              </div>
              <code style={{ fontSize: 10, color: '#62627A' }}>fontSize:10, fontWeight:700, letterSpacing:0.10em, uppercase</code>
            </div>
          </div>
        ))}

        {/* ── カード ── */}
        {section('Cards', (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: '#62627A', marginBottom: 8 }}>標準カード</div>
              <div style={{ background: '#13141F', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '16px 20px' }}>
                <span style={{ fontSize: 13, color: '#9898B0' }}>background: #13141F / borderRadius: 12</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#62627A', marginBottom: 8 }}>ガラスカード</div>
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: '16px 20px' }}>
                <span style={{ fontSize: 13, color: '#9898B0' }}>background: rgba(255,255,255,0.04) / borderRadius: 24</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#62627A', marginBottom: 8 }}>ティールカード（軸・結果）</div>
              <div style={{ background: 'rgba(20,184,166,0.06)', border: '1px solid rgba(20,184,166,0.20)', borderRadius: 10, padding: '16px 20px' }}>
                <span style={{ fontSize: 13, color: '#14B8A6' }}>background: rgba(20,184,166,0.06)</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#62627A', marginBottom: 8 }}>ピンクカード（みんなの予想）</div>
              <div style={{ background: 'rgba(244,114,182,0.06)', border: '1px solid rgba(244,114,182,0.20)', borderRadius: 8, padding: '16px 20px' }}>
                <span style={{ fontSize: 13, color: '#F472B6' }}>background: rgba(244,114,182,0.06)</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#62627A', marginBottom: 8 }}>エラーカード</div>
              <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.20)', borderRadius: 8, padding: '16px 20px' }}>
                <span style={{ fontSize: 13, color: '#F87171' }}>background: rgba(239,68,68,0.08)</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#62627A', marginBottom: 8 }}>ウォーニングカード（枠順未確定）</div>
              <div style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.20)', borderRadius: 8, padding: '16px 20px' }}>
                <span style={{ fontSize: 13, color: '#FBBF24' }}>background: rgba(251,191,36,0.06)</span>
              </div>
            </div>
          </div>
        ))}

        {/* ── バッジ ── */}
        {section('Badges', (
          <div style={{ ...card }}>
            {/* ステータス */}
            <div style={{ fontSize: 11, color: '#62627A', marginBottom: 10 }}>ステータス</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {[
                { label: '予想中', bg: 'rgba(244,114,182,0.10)', color: '#F472B6', border: 'rgba(244,114,182,0.25)' },
                { label: '結果', bg: 'rgba(52,211,153,0.10)', color: '#34D399', border: 'rgba(52,211,153,0.25)' },
                { label: '締め切り済み', bg: 'rgba(98,98,122,0.15)', color: '#62627A', border: 'rgba(98,98,122,0.25)' },
                { label: '的中', bg: 'rgba(239,68,68,0.12)', color: '#F87171', border: 'rgba(239,68,68,0.30)' },
                { label: '暫定予想', bg: 'rgba(251,191,36,0.10)', color: '#FBBF24', border: 'rgba(251,191,36,0.30)' },
              ].map(({ label, bg, color, border }) => (
                <span key={label} style={{
                  fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
                  background: bg, color, border: `1px solid ${border}`,
                }}>{label}</span>
              ))}
            </div>

            {/* グレード */}
            <div style={{ fontSize: 11, color: '#62627A', marginBottom: 10 }}>グレード</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {[
                { label: 'G1', color: '#FBBF24', border: 'rgba(251,191,36,0.35)', bg: 'rgba(251,191,36,0.10)' },
                { label: 'G2', color: '#C0C8D0', border: 'rgba(192,200,208,0.35)', bg: 'rgba(192,200,208,0.08)' },
                { label: 'G3', color: '#CD853F', border: 'rgba(205,133,63,0.35)', bg: 'rgba(205,133,63,0.08)' },
                { label: 'OP', color: '#62627A', border: 'rgba(98,98,122,0.25)', bg: 'rgba(98,98,122,0.06)' },
              ].map(({ label, color, border, bg }) => (
                <span key={label} style={{
                  fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                  color, border: `1px solid ${border}`, background: bg,
                }}>{label}</span>
              ))}
            </div>

            {/* 脚質 */}
            <div style={{ fontSize: 11, color: '#62627A', marginBottom: 10 }}>脚質</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {[
                { label: '逃げ', color: '#F87171', bg: 'rgba(248,113,113,0.10)', border: 'rgba(248,113,113,0.25)' },
                { label: '先行', color: '#FBBF24', bg: 'rgba(251,191,36,0.10)', border: 'rgba(251,191,36,0.25)' },
                { label: '差し', color: '#60A5FA', bg: 'rgba(96,165,250,0.10)', border: 'rgba(96,165,250,0.25)' },
                { label: '追込', color: '#A78BFA', bg: 'rgba(167,139,250,0.10)', border: 'rgba(167,139,250,0.25)' },
              ].map(({ label, color, bg, border }) => (
                <span key={label} style={{
                  fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                  color, background: bg, border: `1px solid ${border}`,
                }}>{label}</span>
              ))}
            </div>

            {/* 血統 */}
            <div style={{ fontSize: 11, color: '#62627A', marginBottom: 10 }}>血統系統</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {[
                { label: 'Sunday Racing', color: '#60A5FA', bg: 'rgba(96,165,250,0.10)', border: 'rgba(96,165,250,0.25)' },
                { label: 'Mr. Prospector', color: '#34D399', bg: 'rgba(52,211,153,0.10)', border: 'rgba(52,211,153,0.25)' },
                { label: 'Northern Dancer', color: '#C084FC', bg: 'rgba(192,132,252,0.10)', border: 'rgba(192,132,252,0.25)' },
                { label: 'Roberto', color: '#F87171', bg: 'rgba(248,113,113,0.10)', border: 'rgba(248,113,113,0.25)' },
                { label: 'Nasrullah', color: '#FBBF24', bg: 'rgba(251,191,36,0.10)', border: 'rgba(251,191,36,0.25)' },
                { label: 'Other', color: '#9898B0', bg: 'rgba(152,152,176,0.10)', border: 'rgba(152,152,176,0.25)' },
              ].map(({ label, color, bg, border }) => (
                <span key={label} style={{
                  fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6,
                  color, background: bg, border: `1px solid ${border}`,
                }}>{label}</span>
              ))}
            </div>
          </div>
        ))}

        {/* ── ボタン ── */}
        {section('Buttons', (
          <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: '#62627A', marginBottom: 10 }}>馬選択ボタン（非選択・選択・無効）</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button style={{
                  padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 400, cursor: 'pointer',
                  border: '1px solid rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.03)',
                  color: '#9898B0', fontFamily: 'inherit',
                }}>非選択</button>
                <button style={{
                  padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  border: '1px solid rgba(244,114,182,0.60)', background: 'rgba(244,114,182,0.12)',
                  color: '#F472B6', fontFamily: 'inherit',
                }}>選択中</button>
                <button style={{
                  padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 400, cursor: 'not-allowed',
                  border: '1px solid rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.03)',
                  color: '#3A3A50', fontFamily: 'inherit',
                }}>無効</button>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#62627A', marginBottom: 10 }}>頭数選択ボタン（非選択・選択）</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {['2頭', '4頭', '6頭'].map((label, i) => (
                  <button key={label} style={{
                    padding: '4px 14px', borderRadius: 6, fontSize: 12, fontWeight: i === 1 ? 700 : 400,
                    cursor: 'pointer', fontFamily: 'inherit',
                    border: i === 1 ? '1px solid rgba(20,184,166,0.50)' : '1px solid rgba(255,255,255,0.08)',
                    background: i === 1 ? 'rgba(20,184,166,0.12)' : 'rgba(255,255,255,0.04)',
                    color: i === 1 ? '#14B8A6' : '#9898B0',
                  }}>{label}</button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#62627A', marginBottom: 10 }}>送信ボタン（有効・無効）</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button style={{
                  width: '100%', padding: 11, borderRadius: 8, fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit', border: 'none',
                  background: 'rgba(244,114,182,0.15)', color: '#F472B6',
                }}>投稿する</button>
                <button style={{
                  width: '100%', padding: 11, borderRadius: 8, fontSize: 13, fontWeight: 700,
                  cursor: 'not-allowed', fontFamily: 'inherit', border: 'none',
                  background: 'rgba(255,255,255,0.04)', color: '#3A3A50',
                }}>あと2頭選んでください</button>
              </div>
            </div>
          </div>
        ))}

        {/* ── HorseRow ── */}
        {section('Horse Row (AI着順予測ランキング)', (
          <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              { rank: 1, name: 'アクアヴァーナル', num: '④', role: 'axis' as const, pop: 4, tag: '先行' },
              { rank: 2, name: 'ダノンシーマ', num: '⑤', role: 'himo' as const, pop: 3, tag: '逃げ' },
              { rank: 3, name: 'ファミリータイム', num: '③', role: 'himo' as const, pop: 5, tag: '差し' },
              { rank: 4, name: 'アドマイヤテラ', num: '①', role: 'other' as const, pop: 1, tag: null },
            ].map(({ rank, name, num, role, pop, tag }) => {
              const isAxis = role === 'axis'
              const isOther = role === 'other'
              return (
                <div key={rank} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: isAxis ? '11px 14px' : '9px 14px', borderRadius: 6,
                  background: isAxis ? 'rgba(20,184,166,0.08)' : 'transparent',
                  borderLeft: `3px solid ${isAxis ? '#14B8A6' : 'rgba(255,255,255,0.08)'}`,
                  marginBottom: 4, opacity: isOther ? 0.55 : 1,
                }}>
                  <span style={{
                    width: isAxis ? 28 : 22, height: isAxis ? 28 : 22,
                    borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: isAxis ? 13 : 10, fontWeight: 800, flexShrink: 0,
                    background: isAxis ? '#14B8A6' : 'rgba(255,255,255,0.08)',
                    color: isAxis ? '#fff' : '#9898B0',
                  }}>{rank}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{
                      display: 'block', fontWeight: isAxis ? 700 : 500,
                      fontSize: isAxis ? 15 : 13, color: isAxis ? '#EEEEF5' : '#9898B0',
                    }}>
                      <span style={{ fontSize: 13, color: '#62627A', marginRight: 5 }}>{num}</span>
                      {name}
                    </span>
                    <span style={{ fontSize: 10, color: '#9898B0', display: 'block' }}>{pop}番人気</span>
                  </div>
                  {tag && (
                    <span style={{
                      fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 700,
                      color: tag === '逃げ' ? '#F87171' : tag === '先行' ? '#FBBF24' : '#60A5FA',
                      background: tag === '逃げ' ? 'rgba(248,113,113,0.10)' : tag === '先行' ? 'rgba(251,191,36,0.10)' : 'rgba(96,165,250,0.10)',
                      border: `1px solid ${tag === '逃げ' ? 'rgba(248,113,113,0.25)' : tag === '先行' ? 'rgba(251,191,36,0.25)' : 'rgba(96,165,250,0.25)'}`,
                    }}>{tag}</span>
                  )}
                  {!isOther && (
                    <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, fontWeight: 700,
                      color: isAxis ? '#14B8A6' : '#A78BFA',
                      background: isAxis ? 'rgba(20,184,166,0.10)' : 'rgba(167,139,250,0.10)',
                      border: `1px solid ${isAxis ? 'rgba(20,184,166,0.25)' : 'rgba(167,139,250,0.25)'}`,
                    }}>{isAxis ? '軸' : 'ヒモ'}</span>
                  )}
                </div>
              )
            })}
          </div>
        ))}

        {/* ── みんなの予想 ── */}
        {section('Picks Row (みんなの予想)', (
          <div style={{ ...card }}>
            <div style={{
              background: 'rgba(20,184,166,0.06)', border: '1px solid rgba(20,184,166,0.20)',
              borderRadius: 10, padding: '10px 14px', marginBottom: 16,
            }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', color: '#14B8A6', margin: '0 0 8px' }}>RESULT</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['① スマートプリエール', '⑪ ロンギングセリーヌ', '⑧ イクシード'].map((label, i) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#14B8A6' }}>{i + 1}着</span>
                    <span style={{ fontSize: 13, color: '#EEEEF5' }}>{label}</span>
                    {i < 2 && <span style={{ color: 'rgba(255,255,255,0.15)', marginLeft: 3 }}>—</span>}
                  </div>
                ))}
              </div>
            </div>
            {[
              { email: 'ryuji.mieno', horses: '⑧ イクシード・⑬ アメティスタ・⑩ スマートプリエール', hit: 2, isMe: true },
              { email: 'taro.yamada', horses: '⑧ イクシード・③ ゴディアーモ・⑪ ロンギングセリーヌ', hit: 2, isMe: false },
              { email: 'hanako.suzuki', horses: '① エアビーアゲイル・③ ゴディアーモ・⑤ クリスレジーナ', hit: 0, isMe: false },
            ].map(({ email, horses, hit, isMe }) => (
              <div key={email} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: isMe ? '#F472B6' : '#62627A', flexShrink: 0, minWidth: 56 }}>
                  {email}
                </span>
                <span style={{ fontSize: 13, color: isMe ? '#EEEEF5' : '#9898B0', flex: 1 }}>{horses}</span>
                <span style={{
                  fontSize: 12, fontWeight: 700, flexShrink: 0,
                  color: hit === 3 ? '#14B8A6' : hit >= 1 ? '#F472B6' : '#3A3A50',
                }}>
                  {hit === 0 ? '的中なし' : `${hit}/3的中`}
                </span>
              </div>
            ))}
          </div>
        ))}

        {/* ── レース一覧行 ── */}
        {section('Race List Row', (
          <div style={{ ...card, padding: 0 }}>
            {[
              { date: '3/22(土)', name: '阪神大賞典', grade: 'G2', status: '予想中', statusColor: '#F472B6', statusBg: 'rgba(244,114,182,0.10)', statusBorder: 'rgba(244,114,182,0.25)' },
              { date: '3/21(金)', name: 'フラワーカップ', grade: 'G3', status: '結果', statusColor: '#34D399', statusBg: 'rgba(52,211,153,0.10)', statusBorder: 'rgba(52,211,153,0.25)' },
            ].map(({ date, name, grade, status, statusColor, statusBg, statusBorder }) => (
              <div key={name} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '13px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}>
                <span style={{ fontSize: 12, color: '#62627A', flexShrink: 0, width: 64 }}>{date}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 7, flex: 1 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4, flexShrink: 0, background: statusBg, color: statusColor, border: `1px solid ${statusBorder}` }}>{status}</span>
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, flexShrink: 0,
                    color: grade === 'G2' ? '#C0C8D0' : '#CD853F',
                    border: `1px solid ${grade === 'G2' ? 'rgba(192,200,208,0.35)' : 'rgba(205,133,63,0.35)'}`,
                    background: grade === 'G2' ? 'rgba(192,200,208,0.08)' : 'rgba(205,133,63,0.08)',
                  }}>{grade}</span>
                  <span style={{ fontSize: 14, fontWeight: 500, color: '#EEEEF5' }}>{name}</span>
                </span>
              </div>
            ))}
          </div>
        ))}

        {/* ── 情報ボックス ── */}
        {section('Info Boxes', (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ background: 'rgba(20,184,166,0.06)', border: '1px solid rgba(20,184,166,0.20)', borderRadius: 8, padding: '10px 14px' }}>
              <span style={{ fontSize: 13, color: '#14B8A6', fontWeight: 600 }}>ティール：軸馬・結果・RESULT表示</span>
            </div>
            <div style={{ background: 'rgba(244,114,182,0.06)', border: '1px solid rgba(244,114,182,0.20)', borderRadius: 8, padding: '10px 14px' }}>
              <span style={{ fontSize: 13, color: '#F472B6', fontWeight: 600 }}>ピンク：自分の予想・選択状態</span>
            </div>
            <div style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.20)', borderRadius: 8, padding: '10px 14px' }}>
              <span style={{ fontSize: 13, color: '#FBBF24', fontWeight: 600 }}>イエロー：警告・枠順未確定</span>
            </div>
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.20)', borderRadius: 8, padding: '10px 14px' }}>
              <span style={{ fontSize: 13, color: '#F87171', fontWeight: 600 }}>レッド：エラー・的中</span>
            </div>
          </div>
        ))}

        {/* ── 馬番サークル ── */}
        {section('Horse Numbers (①②③)', (
          <div style={{ ...card }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {Array.from({ length: 18 }, (_, i) => i + 1).map((n) => (
                <span key={n} style={{ fontSize: 18, color: '#9898B0' }}>
                  {String.fromCharCode(0x245f + n)}
                </span>
              ))}
            </div>
            <p style={{ fontSize: 11, color: '#62627A', margin: '12px 0 0' }}>
              String.fromCharCode(0x245f + n) — n: 1〜18対応
            </p>
          </div>
        ))}

      </div>
    </div>
  )
}
