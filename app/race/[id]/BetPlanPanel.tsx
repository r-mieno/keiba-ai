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
  horseNumber: number | null
  styleLabel: string | null
  styleColor: string | null
  aiEval: number
  reason: string
}

type HimoHorse = {
  name: string
  number: number | null
}

type Props = {
  betType: string
  allHimoHorses: HimoHorse[]
  axisCount: number
  pct: number
  axisDetails: AxisDetail[]
}

function NumBadge({ num, isAxis }: { num: number | null; isAxis: boolean }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 24,
        height: 24,
        borderRadius: '50%',
        fontSize: 11,
        fontWeight: 700,
        background: isAxis ? '#6366F1' : 'rgba(255,255,255,0.15)',
        color: '#fff',
        flexShrink: 0,
      }}
    >
      {num ?? '?'}
    </span>
  )
}

export default function BetPlanPanel({
  betType,
  allHimoHorses,
  axisCount,
  pct,
  axisDetails,
}: Props) {
  const [himoCount, setHimoCount] = useState(Math.min(AI_RECOMMENDED, allHimoHorses.length))

  const selectedHimo = allHimoHorses.slice(0, himoCount)
  const combinations = computeCombinations(axisCount, himoCount)
  const himoValues = computeHimoValues(pct, himoCount)
  const comment = buildComment(axisCount, himoCount, pct)

  const axisNums = axisDetails.map((d) => d.horseNumber)
  const himoNums = selectedHimo.map((h) => h.number)
  const formationRows =
    axisCount >= 3
      ? [
          { label: '1着目', nums: axisNums, numAxisItems: axisNums.length },
          { label: '2着目', nums: [...axisNums, ...himoNums], numAxisItems: axisNums.length },
          { label: '3着目', nums: [...axisNums, ...himoNums], numAxisItems: axisNums.length },
        ]
      : [
          { label: '1着目', nums: axisNums, numAxisItems: axisNums.length },
          { label: '2着目', nums: himoNums, numAxisItems: 0 },
          { label: '3着目', nums: himoNums, numAxisItems: 0 },
        ]

  return (
    <div
      style={{
        background: '#141416',
        borderRadius: 8,
        padding: '20px 20px',
        border: '1px solid rgba(255,255,255,0.07)',
        marginBottom: 10,
      }}
    >
      <p style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase' as const,
        color: '#7A7A84',
        marginBottom: 14,
        paddingBottom: 10,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        AI買い目プラン
      </p>

      {/* Bet type */}
      <div style={{ marginBottom: 18 }}>
        <p style={{ color: '#7A7A84', fontSize: 11, marginBottom: 6 }}>買い方</p>
        <span
          style={{
            display: 'inline-block',
            padding: '4px 12px',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 600,
            background: 'rgba(99,102,241,0.12)',
            color: '#818CF8',
            border: '1px solid rgba(99,102,241,0.25)',
          }}
        >
          {betType}
        </span>
      </div>

      {/* Himo count selector */}
      <div style={{ marginBottom: 14 }}>
        <p style={{ color: '#7A7A84', fontSize: 11, marginBottom: 8 }}>ヒモ頭数を選択</p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {HIMO_OPTIONS.map((n) => {
            const disabled = n > allHimoHorses.length
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
                  border: active ? '1px solid rgba(99,102,241,0.5)' : '1px solid rgba(255,255,255,0.08)',
                  background: active ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.04)',
                  color: disabled ? '#3C3C42' : active ? '#818CF8' : '#B0B0B8',
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
                      background: active ? 'rgba(99,102,241,0.25)' : 'rgba(99,102,241,0.1)',
                      color: disabled ? '#3C3C42' : '#818CF8',
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
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 6,
          padding: '10px 14px',
          marginBottom: 14,
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <span style={{ color: '#7A7A84', fontSize: 13 }}>合計買い目点数</span>
        <span style={{ color: '#E8E8EA', fontSize: 19, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
          {combinations}
          <span style={{ color: '#7A7A84', fontSize: 13, marginLeft: 4 }}>点</span>
        </span>
      </div>

      {/* Formation summary */}
      <div style={{ marginBottom: 18 }}>
        <p style={{ color: '#7A7A84', fontSize: 11, marginBottom: 8 }}>フォーメーション確認</p>
        <div
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 6,
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {formationRows.map(({ label, nums, numAxisItems }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#7A7A84', fontSize: 10, width: 36, flexShrink: 0 }}>{label}</span>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {nums.map((num, i) => (
                  <NumBadge key={i} num={num} isAxis={i < numAxisItems} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Axis + Himo grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
        {/* Axis horses */}
        <div
          style={{
            background: 'rgba(99,102,241,0.06)',
            borderRadius: 6,
            padding: '12px 14px',
            border: '1px solid rgba(99,102,241,0.15)',
          }}
        >
          <p style={{ color: '#818CF8', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
            軸馬
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {axisDetails.map((detail, i) => (
              <div
                key={detail.name}
                style={{
                  paddingBottom: i < axisDetails.length - 1 ? 12 : 0,
                  borderBottom: i < axisDetails.length - 1 ? '1px solid rgba(99,102,241,0.12)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  {detail.horseNumber !== null && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        fontSize: 10,
                        fontWeight: 700,
                        background: '#6366F1',
                        color: '#fff',
                        flexShrink: 0,
                      }}
                    >
                      {detail.horseNumber}
                    </span>
                  )}
                  <span style={{ color: '#E8E8EA', fontSize: 14, fontWeight: 600 }}>{detail.name}</span>
                </div>
                <div style={{ display: 'flex', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'baseline' }}>
                    <span style={{ fontSize: 10, color: '#7A7A84' }}>AI評価</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#818CF8' }}>{detail.aiEval}%</span>
                  </div>
                  {detail.styleLabel && detail.styleColor && (
                    <div style={{ display: 'flex', gap: 4, alignItems: 'baseline' }}>
                      <span style={{ fontSize: 10, color: '#7A7A84' }}>脚質</span>
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
                  <p style={{ fontSize: 10, color: '#7A7A84', marginBottom: 3 }}>軸馬にした理由</p>
                  <p style={{ fontSize: 11, color: '#B0B0B8', lineHeight: 1.6, margin: 0 }}>{detail.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Himo horses */}
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 6, padding: '12px 14px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ color: '#7A7A84', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 10 }}>
            ヒモ馬 ({selectedHimo.length}頭)
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {selectedHimo.map((horse, i) => (
              <div
                key={horse.name}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
                  <span style={{ color: '#3C3C42', fontSize: 10, width: 14, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{i + 1}</span>
                  {horse.number !== null && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        fontSize: 9,
                        fontWeight: 700,
                        background: 'rgba(255,255,255,0.15)',
                        color: '#fff',
                        flexShrink: 0,
                      }}
                    >
                      {horse.number}
                    </span>
                  )}
                  <span
                    style={{
                      color: '#B0B0B8',
                      fontSize: 13,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {horse.name}
                  </span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#34D399', flexShrink: 0 }}>
                  +{himoValues[i]}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI comment */}
      <p style={{ color: '#B0B0B8', fontSize: 12, lineHeight: 1.8 }}>{comment}</p>
    </div>
  )
}
