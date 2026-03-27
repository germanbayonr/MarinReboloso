'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

const LOADER_MS = 1800
const FADE_MS = 800
const STORAGE_KEY = 'preloader-seen'
const DONE_EVENT = 'marebo:preloader-done'

export default function Preloader() {
  const startedRef = useRef(false)
  const [shouldSkip, setShouldSkip] = useState(true)
  const [progress, setProgress] = useState(0)
  const [isFading, setIsFading] = useState(false)
  const [isDone, setIsDone] = useState(false)

  useEffect(() => {
    try {
      setShouldSkip(sessionStorage.getItem(STORAGE_KEY) !== null)
    } catch {
      setShouldSkip(true)
    }
  }, [])

  useEffect(() => {
    if (shouldSkip || startedRef.current) return

    startedRef.current = true
    let rafId = 0
    let dispatched = false
    const startedAt = performance.now()

    const startProgress = requestAnimationFrame(() => setProgress(100))

    function tick(now: number) {
      const elapsed = now - startedAt

      if (!dispatched && elapsed >= LOADER_MS) {
        dispatched = true
        setIsFading(true)
        try {
          sessionStorage.setItem(STORAGE_KEY, '1')
        } catch {}
        window.dispatchEvent(new Event(DONE_EVENT))
      }

      if (elapsed >= LOADER_MS + FADE_MS) {
        setIsDone(true)
        return
      }

      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(startProgress)
      cancelAnimationFrame(rafId)
    }
  }, [shouldSkip])

  if (shouldSkip || isDone) return null

  return (
    <div
      className={[
        'fixed inset-0 z-[100] flex flex-col items-center justify-center',
        'transition-opacity duration-[800ms] ease-out',
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100',
      ].join(' ')}
      aria-hidden
    >
      <div className="absolute inset-0">
        <Image unoptimized
          src="https://marebo.b-cdn.net/assets/WhatsApp%20Image%202026-03-11%20at%2006.58.03.jpeg"
          alt=""
          fill
          priority
          unoptimized
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/40 to-black/55" />
      </div>

      <div className="relative -translate-y-12 text-center">
        <div className="font-serif text-white tracking-[0.38em] text-2xl md:text-3xl">
          MAREBO :)
        </div>

        <div className="mt-6 w-56 md:w-64">
          <div className="relative h-[1px] w-full bg-white/20 overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full bg-white"
              style={{
                width: `${progress}%`,
                transitionProperty: 'width',
                transitionDuration: `${LOADER_MS}ms`,
                transitionTimingFunction: 'cubic-bezier(0.25, 0.8, 0.25, 1)',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
