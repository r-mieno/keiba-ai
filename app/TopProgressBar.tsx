'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

export default function TopProgressBar() {
  const pathname = usePathname()
  const [width, setWidth] = useState(0)
  const [opacity, setOpacity] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const navigating = useRef(false)

  const start = () => {
    if (navigating.current) return
    navigating.current = true
    setOpacity(1)
    setWidth(12)
    let cur = 12
    intervalRef.current = setInterval(() => {
      cur = Math.min(88, cur + (88 - cur) * 0.12)
      setWidth(cur)
    }, 180)
  }

  const finish = () => {
    if (!navigating.current) return
    navigating.current = false
    if (intervalRef.current) clearInterval(intervalRef.current)
    setWidth(100)
    setTimeout(() => setOpacity(0), 220)
    setTimeout(() => setWidth(0), 600)
  }

  // 遷移完了を検知
  useEffect(() => { finish() }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  // リンククリックで開始
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const a = (e.target as Element).closest('a')
      if (!a) return
      const href = a.getAttribute('href')
      if (!href || !href.startsWith('/') || href === pathname) return
      start()
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      height: 2,
      width: `${width}%`,
      background: 'linear-gradient(90deg, #0D9488, #14B8A6)',
      boxShadow: '0 0 8px rgba(20,184,166,0.7)',
      zIndex: 99999,
      opacity,
      transition: width === 100
        ? 'width 0.18s ease-out, opacity 0.35s ease 0.22s'
        : width === 0
        ? 'none'
        : 'width 0.18s ease-out',
      pointerEvents: 'none',
    }} />
  )
}
