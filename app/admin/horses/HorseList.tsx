'use client'

import { useState } from 'react'
import Link from 'next/link'

type Horse = {
  id: string
  name: string
  sire_name: string | null
  father_line: string | null
  style: string | null
}

const STYLE_LABELS: Record<string, string> = {
  front: '逃げ', stalker: '先行', closer: '差し', deep_closer: '追い込み',
}
const LINE_LABELS: Record<string, string> = {
  sunday: 'サンデー系', mrprospector: 'ミスプロ系',
  northerndancer: 'ノーザンダンサー系', roberto: 'ロベルト系',
  nasrullah: 'ナスルーラ系', other: 'その他',
}

export default function HorseList({ horses }: { horses: Horse[] }) {
  const [query, setQuery] = useState('')

  const filtered = query
    ? horses.filter((h) => h.name.includes(query) || (h.sire_name ?? '').includes(query))
    : horses

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <input
        type="text"
        placeholder="馬名・父名で検索..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 8,
          padding: '9px 14px',
          fontSize: 13,
          color: '#EEEEF5',
          outline: 'none',
          width: 280,
        }}
      />

      <div style={{ background: '#13141F', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              {['馬名', '父', '父系統', '脚質', ''].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: '#62627A', fontWeight: 600, fontSize: 11 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((horse) => (
              <tr key={horse.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '11px 16px', color: '#EEEEF5', fontWeight: 500 }}>{horse.name}</td>
                <td style={{ padding: '11px 16px', color: '#9898B0' }}>{horse.sire_name ?? '—'}</td>
                <td style={{ padding: '11px 16px', color: '#9898B0', fontSize: 12 }}>
                  {horse.father_line ? (LINE_LABELS[horse.father_line] ?? horse.father_line) : '—'}
                </td>
                <td style={{ padding: '11px 16px', color: '#9898B0', fontSize: 12 }}>
                  {horse.style ? (STYLE_LABELS[horse.style] ?? horse.style) : '—'}
                </td>
                <td style={{ padding: '11px 16px' }}>
                  <Link href={`/admin/horses/${horse.id}`} style={{ fontSize: 12, color: '#14B8A6', textDecoration: 'none', fontWeight: 600 }}>
                    編集 →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p style={{ textAlign: 'center', padding: '32px', color: '#62627A', fontSize: 13 }}>該当なし</p>
        )}
      </div>

      <p style={{ fontSize: 12, color: '#62627A', margin: 0 }}>{filtered.length} 頭表示中（全 {horses.length} 頭）</p>
    </div>
  )
}
