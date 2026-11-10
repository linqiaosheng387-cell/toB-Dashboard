import { useEffect, useRef, useState } from 'react'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Animates a number from its previous value to the target value with an
 * ease-out cubic curve. On first mount it starts from zero, which gives the
 * "growing from nothing" feel; later target changes are smoothly tweened.
 */
export function useCountUp(target: number, duration = 900): number {
  const [display, setDisplay] = useState(0)
  const currentRef = useRef(0)
  const rafRef = useRef(0)

  useEffect(() => {
    const from = currentRef.current
    const runDuration = prefersReducedMotion() ? 1 : duration
    let startTime: number | null = null

    const tick = (now: number) => {
      if (startTime === null) startTime = now
      const progress = Math.min(1, (now - startTime) / runDuration)
      const eased = 1 - Math.pow(1 - progress, 3)
      const value = from + (target - from) * eased
      currentRef.current = value
      setDisplay(value)
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        currentRef.current = target
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, duration])

  return display
}

export function AnimatedNumber({
  value,
  duration,
  format,
}: {
  value: number
  duration?: number
  format?: (n: number) => string
}) {
  const animated = useCountUp(value, duration)
  return <>{format ? format(animated) : Math.round(animated).toLocaleString()}</>
}
