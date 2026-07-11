// SUNRISE LANDER — HOME ( / )
// Recreated from the Hemp Beverage Expo page, then stripped down:
//   • SiteHeader (nav) removed entirely — the page opens on the hero color bars.
//   • Signup form removed (its /api/public/event-signup endpoint no longer
//     exists); the <section> shell is retained as intentional blank space.
//   • "Find your SUNRISE" effects section removed — it cannot be written
//     without naming THC / CBG / CBN / THCV.
//   • The blank <section> the form left behind is gone too — nothing is going
//     to fill it, and empty it was contributing ~3.8x base of dead vertical
//     space directly above the products hero.
// Potency lockups in the product selector use the LANDER-ONLY renderers from
// src/lib/srlander-lockups.ts (THC -> ACTIVE, CBG/CBN/THCV -> BLEND).
import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { SiteFooter } from '../components/SiteFooter'
import { getCanImage } from '../lib/canImages'
import {
  renderWordmark,
  getBasePx,
} from '../lib/sunrise-components'
import {
  render10mgActiveLockup,
  render30mgActiveLockup,
  render60mgActiveLockup,
  renderBlendLockup,
} from '../lib/srlander-lockups'
import './index.css'
import './contact.css'
import './home.css'
import './products.css'

const EVENT_NAME = 'Hemp Beverage Expo'

// ── PRODUCTS SECTION DATA (mirrors /products page) ───────────────────────
type Cannabinoid = 'CBG' | 'CBN' | 'THCV'
type TierKey = '5' | '10' | '30' | '60'

function toSlug(tier: TierKey, flavor: { name: string; cannabinoid?: Cannabinoid }): string {
  const flavorPart = flavor.name.toLowerCase().replace(/\s+/g, '-')
  const variantSuffix = flavor.cannabinoid ? `-${flavor.cannabinoid.toLowerCase()}` : ''
  return `${tier}mg-${flavorPart}${variantSuffix}`
}

type Flavor = { name: string; descriptor: string; flavorColor: string; cannabinoid?: Cannabinoid }
type TierData = { color: string; name: string; short: string; descriptors: string; copy: string; flavors: Flavor[] }

const SHOW_NON_LIVE_PRODUCTS = false
const LIVE_SLUGS = new Set<string>([
  '10mg-strawberry','10mg-watermelon','10mg-lemonade',
  '30mg-peach-mango','30mg-cherry-limeade','30mg-orange-lemonade',
  '30mg-kiwi-watermelon-cbg','30mg-blueberry-pomegranate-cbn','30mg-strawberry-watermelon-thcv',
  '60mg-wild-cherry-peach','60mg-blueberry-lemonade','60mg-passionfruit-mango',
  '60mg-blood-orange-cbg','60mg-blackberry-cbn','60mg-strawberry-kiwi-thcv',
])

const TIERS: Record<TierKey, TierData> = {
  '5':  { color: '#DC7F27', name: 'Subtle Lift', short: 'Subtle Lift', descriptors: 'Light · Bright · Casual',
    copy: 'First times, mid-week refreshments, or social sessions. Crisp, casual, easy to like.', flavors: [] },
  '10': { color: '#CC1F39', name: 'Perfect Buzz', short: 'Perfect Buzz', descriptors: 'Smooth · Balanced · Social',
    copy: 'Casual sips, afternoon resets, or social gatherings. The go-to tier — a steady, social lift.',
    flavors: [
      { name: 'Strawberry',          descriptor: 'Fresh + Fruity',  flavorColor: '#CC1F39' },
      { name: 'Watermelon',          descriptor: 'Sweet + Juicy',   flavorColor: '#0A6034' },
      { name: 'Lemonade',            descriptor: 'Crisp + Tangy',   flavorColor: '#E0AD2C' },
      { name: 'Tangerine',           descriptor: 'Bright + Zesty',  flavorColor: '#F89A1F', cannabinoid: 'CBG' },
      { name: 'Blackberry Lemonade', descriptor: 'Tart + Bold',     flavorColor: '#2E1E3D', cannabinoid: 'CBN' },
      { name: 'Blueberry Acai',      descriptor: 'Rich + Vibrant',  flavorColor: '#21285A', cannabinoid: 'THCV' },
    ] },
  '30': { color: '#0A6034', name: 'Deeper Dive', short: 'Deeper Dive', descriptors: 'Rich · Vibrant · Spirited',
    copy: 'Extended sessions, creative inspirations, or evening unwinds. For when the mood calls for something richer.',
    flavors: [
      { name: 'Peach Mango',           descriptor: 'Lush + Tropical',   flavorColor: '#E89B5B' },
      { name: 'Cherry Limeade',        descriptor: 'Tart + Refreshing', flavorColor: '#67092A' },
      { name: 'Orange Lemonade',       descriptor: 'Bright + Tart',     flavorColor: '#FAA819' },
      { name: 'Kiwi Watermelon',       descriptor: 'Crisp + Cool',      flavorColor: '#A4BC47', cannabinoid: 'CBG' },
      { name: 'Blueberry Pomegranate', descriptor: 'Tart + Vibrant',    flavorColor: '#21285A', cannabinoid: 'CBN' },
      { name: 'Strawberry Watermelon', descriptor: 'Sweet + Fresh',     flavorColor: '#0A6034', cannabinoid: 'THCV' },
    ] },
  '60': { color: '#2E1E3D', name: 'Elevated Experience', short: 'Elevated Experience', descriptors: 'Bold · Potent · Immersive',
    copy: 'Late nights, deep decompressions, or weekend relaxation. The full expression — patience and respect required.',
    flavors: [
      { name: 'Passionfruit Mango',  descriptor: 'Bright + Breezy', flavorColor: '#60203A' },
      { name: 'Wild Cherry Peach',   descriptor: 'Lush + Juicy',    flavorColor: '#861625' },
      { name: 'Blueberry Lemonade',  descriptor: 'Rich + Tangy',    flavorColor: '#21285A' },
      { name: 'Blood Orange',        descriptor: 'Tart + Punchy',   flavorColor: '#DC7F27', cannabinoid: 'CBG' },
      { name: 'Blackberry',          descriptor: 'Dark + Smooth',   flavorColor: '#2E1E3D', cannabinoid: 'CBN' },
      { name: 'Strawberry Kiwi',     descriptor: 'Sweet + Tangy',   flavorColor: '#CC1F39', cannabinoid: 'THCV' },
    ] },
}

const LOCKUP_SIZE = 2.2

const CANNABINOID_EFFECT: Record<Cannabinoid, string> = {
  CBG: 'Focus + Uplift',
  CBN: 'Relax + Unwind',
  THCV: 'Elevate + Engage',
}

export const Route = createFileRoute('/')({
  component: EventSignupPage,
  head: () => ({
    meta: [
      { title: `${EVENT_NAME} · SUNRISE` },
      {
        name: 'description',
        content: `Visiting SUNRISE at the ${EVENT_NAME}? Drop your name, email, and phone and we'll stay in touch.`,
      },
    ],
  }),
})

function EventSignupPage() {
  const [activeTier, setActiveTier] = useState<TierKey>('10')

  // Refs for brand-mark painting
  const heroWmRef = useRef<HTMLDivElement>(null)
  const panelLockupRef = useRef<HTMLDivElement>(null)
  const switch5Ref = useRef<HTMLDivElement>(null)
  const switch10Ref = useRef<HTMLDivElement>(null)
  const switch30Ref = useRef<HTMLDivElement>(null)
  const switch60Ref = useRef<HTMLDivElement>(null)
  const switchRefs: Record<TierKey, RefObject<HTMLDivElement | null>> = {
    '5': switch5Ref, '10': switch10Ref, '30': switch30Ref, '60': switch60Ref,
  }
  const cornerRefs = useRef<(HTMLSpanElement | null)[]>([])

  useEffect(() => {
    const paint = () => {
      const base = getBasePx()
      if (heroWmRef.current) heroWmRef.current.innerHTML = renderWordmark(base * 2.8, 'cream')

      if (panelLockupRef.current) {
        const size = base * LOCKUP_SIZE
        let html = ''
        if (activeTier === '10') html = render10mgActiveLockup(size, '#FEFBE0')
        if (activeTier === '30') html = render30mgActiveLockup(size, '#FEFBE0')
        if (activeTier === '60') html = render60mgActiveLockup(size, '#FEFBE0')
        panelLockupRef.current.innerHTML = html
      }

      ;(['5', '10', '30', '60'] as TierKey[])
        .filter((tier) => SHOW_NON_LIVE_PRODUCTS || tier !== '5')
        .forEach((tier) => {
          const ref = switchRefs[tier].current
          if (!ref) return
          const isActive = tier === activeTier
          const color = isActive ? '#FEFBE0' : TIERS[tier].color
          const size = base * 1.2
          let html = ''
          if (tier === '10') html = render10mgActiveLockup(size, color)
          if (tier === '30') html = render30mgActiveLockup(size, color)
          if (tier === '60') html = render60mgActiveLockup(size, color)
          ref.innerHTML = html
        })

      const tierData = TIERS[activeTier]
      tierData.flavors
        .filter((f) => SHOW_NON_LIVE_PRODUCTS || LIVE_SLUGS.has(toSlug(activeTier, f)))
        .forEach((f, i) => {
          const ref = cornerRefs.current[i]
          if (!ref || !f.cannabinoid) return
          const size = base * 0.91
          const html = renderBlendLockup(size, '#FEFBE0')
          ref.innerHTML = html
        })
    }
    paint()
    if (document.fonts) document.fonts.ready.then(paint)
    window.addEventListener('resize', paint)
    return () => window.removeEventListener('resize', paint)
  }, [activeTier])

  return (
    <>
      <main>
        {/* ── HERO — matches home page (4 tier strips + wordmark + subtitle) */}
        <section className="home-hero">
          <div className="hero-strip">
            <div className="hero-strip-col tier-5-bg" />
            <div className="hero-strip-col tier-10-bg" />
            <div className="hero-strip-col tier-30-bg" />
            <div className="hero-strip-col tier-60-bg" />
          </div>
          <div className="hero-overlay">
            <h1 className="sr-only">SUNRISE — Hemp Beverage Expo</h1>
            <div className="hero-wordmark-slot" ref={heroWmRef} />
            <div className="hero-subtitle">Crafted Beverages</div>
          </div>
          <div className="hero-scroll-cue" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </section>

        {/* ── PRODUCTS — Enjoy every last sip and pour ─────────────────── */}
        <section className="p-hero lh-hero" id="our-products">
          <div className="container">
            <div className="p-hero-inner">
              <h2 className="p-hero-headline">
                Enjoy every last<br />
                <span className="accent">sip and pour.</span>
              </h2>
              <p className="p-hero-body">
                Try one and try them all. Savor the SUNRISE with each and every one — all made with natural flavors.
              </p>
            </div>
          </div>
        </section>

        {/* ── TIER SWITCHER + PANEL ─────────────────────────────────────── */}
        <section className="p-switcher lh-switcher">
          <div className="container">
            <div className="p-switcher-bar">
              {(['5', '10', '30', '60'] as TierKey[])
                .filter((k) => SHOW_NON_LIVE_PRODUCTS || k !== '5')
                .map((k) => (
                  <button
                    key={k}
                    type="button"
                    className={'p-switch' + (activeTier === k ? ' active' : '')}
                    onClick={() => setActiveTier(k)}
                    style={activeTier === k ? { background: TIERS[k].color } : undefined}
                    aria-pressed={activeTier === k}
                  >
                    <div className="p-switch-lockup" ref={switchRefs[k]} />
                    <div className="p-switch-name" style={activeTier !== k ? { color: TIERS[k].color } : undefined}>
                      {TIERS[k].short.split(' ').map((word, wi) => (
                        <span key={wi}>{word}</span>
                      ))}
                    </div>
                  </button>
                ))}
            </div>

            <div
              className="p-panel"
              style={{
                background: TIERS[activeTier].color,
                ['--p-tier-color' as string]: TIERS[activeTier].color,
              } as React.CSSProperties}
            >
              <div className="p-panel-head">
                <div className="p-panel-lockup" ref={panelLockupRef} />
                <div className="p-panel-head-text">
                  <div className="p-panel-eyebrow">{TIERS[activeTier].descriptors}</div>
                  <h3 className="p-panel-tier-name">{TIERS[activeTier].name}</h3>
                  <p className="p-panel-copy">{TIERS[activeTier].copy}</p>
                </div>
              </div>

              <div className="p-flavor-grid">
                {TIERS[activeTier].flavors
                  .filter((f) => SHOW_NON_LIVE_PRODUCTS || LIVE_SLUGS.has(toSlug(activeTier, f)))
                  .map((f, i) => (
                    <a
                      key={i}
                      href={`https://www.savorsunrise.com/products/${toSlug(activeTier, f)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-flavor-card"
                      aria-label={`${f.name} — ${TIERS[activeTier].name}${f.cannabinoid ? ` with ${f.cannabinoid}` : ''}`}
                      style={{ ['--flavor-color' as string]: f.flavorColor } as React.CSSProperties}
                    >
                      {(() => {
                        const slug = toSlug(activeTier, f)
                        const img = getCanImage(slug)
                        return img ? (
                          <div className="p-flavor-can has-image">
                            <img src={img} alt={`SUNRISE ${f.name}`} loading="lazy" />
                          </div>
                        ) : (
                          <div className="p-flavor-can" />
                        )
                      })()}
                      <div className="p-flavor-meta">
                        <div className="p-flavor-name">{f.name}</div>
                        <div className="p-flavor-descriptor">{f.descriptor}</div>
                        {f.cannabinoid && (
                          <div className="p-flavor-pill">{CANNABINOID_EFFECT[f.cannabinoid]}</div>
                        )}
                      </div>
                      <div className="p-flavor-cta">
                        <span className="p-flavor-cta-label">Learn More</span>
                        <span className="p-flavor-cta-arrow">→</span>
                      </div>
                      {f.cannabinoid && (
                        <span
                          className="p-flavor-corner"
                          ref={(el) => { cornerRefs.current[i] = el }}
                          aria-label={`+${f.cannabinoid}`}
                        />
                      )}
                    </a>
                  ))}
              </div>
            </div>
          </div>
        </section>

      </main>
      <SiteFooter />
    </>
  )
}
