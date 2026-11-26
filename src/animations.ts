import { useLayoutEffect, type RefObject } from 'react'
import gsap from 'gsap'

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function useHomeEntrance(containerRef: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el || prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      gsap.from('.balance-card', {
        y: 16,
        opacity: 0,
        duration: 0.45,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
      })
      gsap.from('.home-secondary-shortcuts .shortcut', {
        y: 12,
        opacity: 0,
        duration: 0.36,
        stagger: 0.06,
        delay: 0.08,
        ease: 'power2.out',
        clearProps: 'transform,opacity',
      })
      gsap.from('.home-grid .panel', {
        y: 16,
        opacity: 0,
        duration: 0.42,
        stagger: 0.08,
        delay: 0.14,
        ease: 'power2.out',
        clearProps: 'transform,opacity',
      })
    }, el)
    return () => ctx.revert()
  }, [containerRef])
}

export function useViewEntrance(containerRef: RefObject<HTMLElement | null>, viewKey: string) {
  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el || prefersReducedMotion() || viewKey === 'home') return
    const ctx = gsap.context(() => {
      gsap.from(el, {
        y: 12,
        opacity: 0,
        duration: 0.34,
        ease: 'power2.out',
        clearProps: 'transform,opacity',
      })
    }, el)
    return () => ctx.revert()
  }, [containerRef, viewKey])
}

export function useOnboardingStepAnimation(stageRef: RefObject<HTMLElement | null>, step: number) {
  useLayoutEffect(() => {
    const el = stageRef.current
    if (!el || prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      gsap.from('.onboarding-icon-ring', {
        scale: 0.84,
        opacity: 0,
        duration: 0.42,
        ease: 'back.out(1.6)',
        clearProps: 'transform,opacity',
      })
      gsap.from(['.onboarding-pill', '.onboarding-copy'], {
        y: 14,
        opacity: 0,
        duration: 0.38,
        stagger: 0.07,
        ease: 'power2.out',
        clearProps: 'transform,opacity',
      })
    }, el)
    return () => ctx.revert()
  }, [stageRef, step])
}

export function useWalletCardPulse(stackRef: RefObject<HTMLDivElement | null>, selectedId?: string) {
  useLayoutEffect(() => {
    const el = stackRef.current
    if (!el || !selectedId || prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      const topCard = el.querySelector('.wallet-card')
      if (topCard) {
        gsap.fromTo(
          topCard,
          { scale: 0.97, y: 6 },
          { scale: 1, y: 0, duration: 0.34, ease: 'back.out(1.5)', clearProps: 'transform' },
        )
      }
    }, el)
    return () => ctx.revert()
  }, [stackRef, selectedId])
}

export function runAccessTransition(overlayEl: HTMLElement | null, onDone: () => void) {
  if (!overlayEl || prefersReducedMotion()) {
    onDone()
    return () => {}
  }
  const ctx = gsap.context(() => {
    const tl = gsap.timeline({ onComplete: onDone })
    tl.fromTo(
      overlayEl,
      { opacity: 1 },
      { opacity: 1, duration: 0.16 },
    )
      .fromTo(
        overlayEl.querySelector('.access-transition-mark'),
        { scale: 0.92, opacity: 0.7 },
        { scale: 1.04, opacity: 1, duration: 0.28, ease: 'power2.out' },
        0,
      )
      .to(overlayEl, {
        opacity: 0,
        y: -14,
        duration: 0.36,
        ease: 'power2.inOut',
      })
  }, overlayEl)
  return () => ctx.revert()
}
