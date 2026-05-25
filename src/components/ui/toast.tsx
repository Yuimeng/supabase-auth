'use client'

import { useEffect, useState } from 'react'

export function Toast({
  message,
  show,
  onClose,
  timeout = 3000,
}: {
  message: string
  show: boolean
  onClose: () => void
  timeout?: number
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (show) {
      const frame = requestAnimationFrame(() => setMounted(true))
      return () => cancelAnimationFrame(frame)
    }
    const frame = requestAnimationFrame(() => setMounted(false))
    return () => cancelAnimationFrame(frame)
  }, [show])

  useEffect(() => {
    if (!show) return
    const timer = setTimeout(onClose, timeout)
    return () => clearTimeout(timer)
  }, [show, timeout, onClose])

  return (
    <div
      className={`fixed right-6 bottom-6 z-50 transition-all duration-300 ease-out ${
        mounted && show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-5 py-3 shadow-2xl shadow-black/40 backdrop-blur-sm">
        <p className="text-sm text-emerald-400">{message}</p>
      </div>
    </div>
  )
}
