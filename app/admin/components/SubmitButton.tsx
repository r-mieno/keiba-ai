'use client'

import { useFormStatus } from 'react-dom'

export default function SubmitButton({ label, loadingLabel }: { label: string; loadingLabel?: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      style={{
        background: pending ? 'rgba(20,184,166,0.5)' : '#14B8A6',
        color: '#fff',
        border: 'none',
        borderRadius: 8,
        padding: '9px 20px',
        fontSize: 13,
        fontWeight: 600,
        cursor: pending ? 'not-allowed' : 'pointer',
        transition: 'background 0.15s',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      {pending && (
        <span style={{
          width: 12, height: 12, border: '2px solid rgba(255,255,255,0.4)',
          borderTopColor: '#fff', borderRadius: '50%',
          display: 'inline-block', animation: 'spin 0.6s linear infinite',
        }} />
      )}
      {pending ? (loadingLabel ?? '保存中...') : label}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </button>
  )
}
