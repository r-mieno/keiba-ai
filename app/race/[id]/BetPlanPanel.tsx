'use client'

import { useState } from 'react'

const HIMO_OPTIONS = [3, 4, 5, 6, 7]
const AI_RECOMMENDED = 5

function computeCombinations(axisCount: number, himoCount: number): number {
  if (axisCount >= 3) return 1
  if (axisCount === 2) return Math.max(0, himoCount)
  return himoCount >= 2 ? (himoCount * (himoCount - 1)) / 2 : 0
}

function computeHimoValues(pct: number, count: number): number[] {
  const baseEdge = Math.round(10 + (100 - pct) * 0.2)
  return Array.from({ length: count }, (_, i) =>
    Math.max(1, Math.round(baseEdge * (1 - i * 0.15)))
  )
}

function buildComment(axisCount: number, himoCount: number, pct: number): string {
  if (axisCount === 1) {
    if (pct >= 61) {
      return `安定したレース構造のため、軸馬1頭の信頼度は高い。ヒモを${himoCount}頭に絞ることで点数を抑えながら、AIが評価した上位馬を確実にカバーする。コストパフォーマンスの高い買い方。`
    } else if (pct >= 41) {
      return `やや読みにくいレースのため、ヒモ${himoCount}頭で取りこぼしリスクを分散させる。軸の信頼度を維持しながら、AIが見出した穴馬まで網羅することで期待値を高める戦略。`
    } else {
      return `荒れが濃厚なレースのため、ヒモを${himoCount}頭に広げてミスリスクを最小化する。人気馬が飛ぶ展開でもAIの穴馬評価が機能するよう、カバー範囲を優先した構成。`
    }
  } else if (axisCount === 2) {
    return `2頭の軸を並立させることで単軸リスクを排除。どちらかが来れば的中圏内に入る安全志向の構成。ヒモ${himoCount}頭との組み合わせで十分なカバー力を確保している。`
  } else {
    return `AIが高く評価した${axisCount}頭を軸に、ヒモ${himoCount}頭を組み合わせた網羅的なフォーメーション。高配当圏を狙いつつ、複数の的中パターンを確保する積極的な構成。`
  }
}

type AxisDetail = {
  name: string
  styleLabel: string | null
  styleColor: string | null
  aiEval: number
  reason: string
}

type Props = {
  betType: string
  allHimoNames: string[]
  axisCount: number
  pct: number
  axisDetails: AxisDetail[]
}

export default function BetPlanPanel({
  betType,
  allHimoNames,
  axisCount,
  pct,
  axisDetails,
}: Props) {
  const [himoCount, setHimoCount] = useState(Math.min(AI_RECOMMENDED, allHimoNames.length))

  const selectedHimo = allHimoNames.slice(0, himoCount)
  const combinations = computeCombinations(axisCount, himoCount)
  const himoValues = computeHimoValues(pct, himoCount)
  const comment = buildComment(axisCount, himoCount, pct)

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: 10,
        padding: '20px 20px',
        border: '1px solid #e0dbd3',
        marginBottom: 16,
      }}
    >
      <p
        style={{
          color: '#6b6560',
          fontSize: 12,
          fontWeight: 700,
          marginBottom: 14,
        }}
      >
        🧾 AI買い目プラン
      </p>

      {/* Bet type */}
      <div style={{ marginBottom: 18 }}>
        <p style={{ color: '#9b9490', fontSize: 11, marginBottom: 6 }}>買い方</p>
        <span
          style={{
            display: 'inline-block',
            padding: '4px 12px',
            borderRadius: 9999,
            fontSize: 13,
            fontWeight: 700,
            background: 'rgba(26,92,53,0.08)',
            color: '#1a5c35',
            border: '1px solid rgba(26,92,53,0.2)',
          }}
        >
          {betType}
        </span>
      </div>

      {/* Himo count selector — horizontal buttons */}
      <div style={{ marginBottom: 14 }}>
        <p style={{ color: '#9b9490', fontSize: 11, marginBottom: 8 }}>ヒモ頭数を選択</p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {HIMO_OPTIONS.map((n) => {
            const disabled = n > allHimoNames.length
            const active = himoCount === n
            const isRecommended = n === AI_RECOMMENDED
            return (
              <button
                key={n}
                onClick={() => !disabled && setHimoCount(n)}
                disabled={disabled}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '6px 13px',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: active ? 700 : 400,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  border: active
                    ? '1px solid rgba(26,92,53,0.5)'
                    : '1px solid #e0dbd3',
                  background: active ? 'rgba(26,92,53,0.08)' : '#f5f2ed',
                  color: disabled ? '#c8c2bb' : active ? '#1a5c35' : '#7a7269',
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                }}
              >
                {n}頭
                {isRecommended && (
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      padding: '1px 5px',
                      borderRadius: 9999,
                      background: active
                        ? 'rgba(26,92,53,0.2)'
                        : 'rgba(26,92,53,0.08)',
                      color: disabled ? '#c8c2bb' : '#1a5c35',
                      letterSpacing: '0.03em',
                    }}
                  >
                    AI
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Total combinations */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#f5f2ed',
          borderRadius: 8,
          padding: '10px 14px',
          marginBottom: 18,
        }}
      >
        <span style={{ color: '#9b9490', fontSize: 13 }}>合計買い目点数</span>
        <span style={{ color: '#1e1b18', fontSize: 19, fontWeight: 800 }}>
          {combinations}
          <span style={{ color: '#9b9490', fontSize: 13, marginLeft: 4 }}>点</span>
        </span>
      </div>

      {/* Axis + Himo grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          marginBottom: 18,
        }}
      >
        {/* Axis horses */}
        <div
          style={{
            background: 'rgba(26,92,53,0.05)',
            borderRadius: 8,
            padding: '12px 14px',
            border: '1px solid rgba(26,92,53,0.15)',
          }}
        >
          <p style={{ color: '#1a5c35', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', marginBottom: 10 }}>
            軸馬
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {axisDetails.map((detail, i) => (
              <div
                key={detail.name}
                style={{
                  paddingBottom: i < axisDetails.length - 1 ? 12 : 0,
                  borderBottom: i < axisDetails.length - 1 ? '1px solid rgba(26,92,53,0.12)' : 'none',
                }}
              >
                <span style={{ color: '#1e1b18', fontSize: 14, fontWeight: 700 }}>{detail.name}</span>
                <div style={{ display: 'flex', gap: 10, marginTop: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'baseline' }}>
                    <span style={{ fontSize: 10, color: '#9b9490' }}>AI評価</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#1a5c35' }}>{detail.aiEval}%</span>
                  </div>
                  {detail.styleLabel && detail.styleColor && (
                    <div style={{ display: 'flex', gap: 4, alignItems: 'baseline' }}>
                      <span style={{ fontSize: 10, color: '#9b9490' }}>脚質</span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: detail.styleColor,
                          background: `${detail.styleColor}14`,
                          border: `1px solid ${detail.styleColor}38`,
                          borderRadius: 9999,
                          padding: '0px 6px',
                        }}
                      >
                        {detail.styleLabel}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <p style={{ fontSize: 10, color: '#9b9490', marginBottom: 3 }}>軸馬にした理由</p>
                  <p style={{ fontSize: 11, color: '#5c5650', lineHeight: 1.6, margin: 0 }}>{detail.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Himo horses */}
        <div
          style={{
            background: '#faf8f5',
            borderRadius: 8,
            padding: '12px 14px',
          }}
        >
          <p style={{ color: '#9b9490', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', marginBottom: 10 }}>
            ヒモ馬 ({selectedHimo.length}頭)
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {selectedHimo.map((name, i) => (
              <div
                key={name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 6,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                  <span style={{ color: '#c8c2bb', fontSize: 10, width: 14, flexShrink: 0 }}>{i + 1}</span>
                  <span
                    style={{
                      color: '#5c5650',
                      fontSize: 13,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {name}
                  </span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#1a6e3f', flexShrink: 0 }}>
                  +{himoValues[i]}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI comment */}
      <p style={{ color: '#7a7269', fontSize: 12, lineHeight: 1.7 }}>{comment}</p>
    </div>
  )
}
