// SUNRISE LANDER — HOME ( / )
// The paid-traffic destination. Assembled from the main site's components, then
// stripped down:
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

// The tiers that actually render, in scroll order. Single source of truth for
// both the switcher bar and the stacked panels so the two can never disagree.
const LIVE_TIERS: TierKey[] = (['5', '10', '30', '60'] as TierKey[])
  .filter((k) => SHOW_NON_LIVE_PRODUCTS || k !== '5')

const panelDomId = (tier: TierKey) => `tier-${tier}mg`

function liveFlavors(tier: TierKey): Flavor[] {
  return TIERS[tier].flavors.filter(
    (f) => SHOW_NON_LIVE_PRODUCTS || LIVE_SLUGS.has(toSlug(tier, f)),
  )
}

export const Route = createFileRoute('/')({
  component: LanderHome,
  head: () => ({
    meta: [
      { title: 'SUNRISE — Refresh the way the world drinks' },
      { name: 'description', content: 'Refresh the way the world drinks.' },
    ],
  }),
})

function LanderHome() {
  // FLAT SELECTOR: every tier renders as its own stacked panel. `activeTier`
  // no longer gates content — it only drives the switcher bar's highlight,
  // which is now a scroll-spy / jump-nav rather than a content toggle.
  const [activeTier, setActiveTier] = useState<TierKey>(LIVE_TIERS[0])

  // Refs for brand-mark painting
  const heroWmRef = useRef<HTMLDivElement>(null)
  // One lockup slot per stacked panel (was: one slot for the single panel).
  const panelLockupRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const switch5Ref = useRef<HTMLDivElement>(null)
  const switch10Ref = useRef<HTMLDivElement>(null)
  const switch30Ref = useRef<HTMLDivElement>(null)
  const switch60Ref = useRef<HTMLDivElement>(null)
  const switchRefs: Record<TierKey, RefObject<HTMLDivElement | null>> = {
    '5': switch5Ref, '10': switch10Ref, '30': switch30Ref, '60': switch60Ref,
  }
  // Corner blend-lockups are now keyed `${tier}-${index}` — a flat array can no
  // longer identify a card once all three tiers are on the page at once.
  const cornerRefs = useRef<Record<string, HTMLSpanElement | null>>({})
  // Panel elements, for jump-scroll + scroll-spy.
  const panelRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const goToTier = (tier: TierKey) => {
    setActiveTier(tier)
    panelRefs.current[tier]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  useEffect(() => {
    const paint = () => {
      const base = getBasePx()
      if (heroWmRef.current) heroWmRef.current.innerHTML = renderWordmark(base * 2.8, 'cream')

      const lockupFor = (tier: TierKey, size: number, color: string): string => {
        if (tier === '10') return render10mgActiveLockup(size, color)
        if (tier === '30') return render30mgActiveLockup(size, color)
        if (tier === '60') return render60mgActiveLockup(size, color)
        return ''
      }

      LIVE_TIERS.forEach((tier) => {
        // Panel lockup — one per stacked panel, always cream on the tier fill.
        const panelRef = panelLockupRefs.current[tier]
        if (panelRef) panelRef.innerHTML = lockupFor(tier, base * LOCKUP_SIZE, '#FEFBE0')

        // Switcher lockup — cream when it's the tier you're scrolled to.
        const switchRef = switchRefs[tier].current
        if (switchRef) {
          const color = tier === activeTier ? '#FEFBE0' : TIERS[tier].color
          switchRef.innerHTML = lockupFor(tier, base * 1.2, color)
        }

        // Corner blend-lockups for every card in every panel, not just one tier.
        liveFlavors(tier).forEach((f, i) => {
          const ref = cornerRefs.current[`${tier}-${i}`]
          if (!ref || !f.cannabinoid) return
          ref.innerHTML = renderBlendLockup(base * 0.91, '#FEFBE0')
        })
      })
    }
    paint()
    if (document.fonts) document.fonts.ready.then(paint)
    window.addEventListener('resize', paint)
    return () => window.removeEventListener('resize', paint)
  }, [activeTier])

  // SCROLL-SPY: the switcher bar is now navigation, not a toggle. Highlight
  // whichever panel currently occupies the upper-middle of the viewport so the
  // bar still reads as "you are here" while the visitor scrolls the full line.
  useEffect(() => {
    const els = LIVE_TIERS
      .map((tier) => panelRefs.current[tier])
      .filter((el): el is HTMLDivElement => Boolean(el))
    if (!els.length || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        const tier = visible?.target.getAttribute('data-tier') as TierKey | undefined
        if (tier) setActiveTier(tier)
      },
      { rootMargin: '-20% 0px -40% 0px', threshold: [0.15, 0.5, 0.85] },
    )
    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

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
            {/* The tagline is a CLOSING anchor in the brand voice — never an
                opener. It does not belong in the hero, which is the first thing
                on the page. See the hero-subtitle note below. */}
            <h1 className="sr-only">SUNRISE — Crafted Beverages</h1>
            <div className="hero-wordmark-slot" ref={heroWmRef} />
            {/* "Crafted Beverages" — NOT the tagline.

                A prior pass set this to "Refresh the way the world drinks" while
                purging Hemp Beverage Expo strings. But "Crafted Beverages" was
                never an HBE reference — it is the main store's hero subtitle —
                so it was collateral, and it broke a brand rule: the tagline is
                a closing anchor ONLY, never an opener. Sitting directly under
                the wordmark at the top of the page is the most opening position
                there is.

                "Crafted Beverages" carries zero restricted vocabulary, so it
                satisfies the reason the string was being changed in the first
                place, without spending the tagline. */}
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
            {/* Jump-nav. Non-sticky: it sits at the top of the section and
                scrolls away. Clicking a tier scrolls to its panel; the active
                state is driven by the scroll-spy above, not by a click. */}
            <nav className="p-switcher-bar" aria-label="Jump to potency">
              {LIVE_TIERS.map((k) => (
                <button
                  key={k}
                  type="button"
                  className={'p-switch' + (activeTier === k ? ' active' : '')}
                  onClick={() => goToTier(k)}
                  style={activeTier === k ? { background: TIERS[k].color } : undefined}
                  aria-current={activeTier === k ? 'true' : undefined}
                >
                  <div className="p-switch-lockup" ref={switchRefs[k]} />
                  <div className="p-switch-name" style={activeTier !== k ? { color: TIERS[k].color } : undefined}>
                    {TIERS[k].short.split(' ').map((word, wi) => (
                      <span key={wi}>{word}</span>
                    ))}
                  </div>
                </button>
              ))}
            </nav>

            {/* FLAT STACK — every tier on the page, one box above the next.
                Equal box heights are enforced in index.css (grid-auto-rows:1fr)
                so the stack reads as three matched cards rather than three
                differently-sized ones. */}
            <div className="p-panel-stack">
              {LIVE_TIERS.map((tier) => (
                <div
                  key={tier}
                  id={panelDomId(tier)}
                  data-tier={tier}
                  ref={(el) => { panelRefs.current[tier] = el }}
                  className="p-panel"
                  style={{
                    background: TIERS[tier].color,
                    ['--p-tier-color' as string]: TIERS[tier].color,
                  } as React.CSSProperties}
                >
                  <div className="p-panel-head">
                    <div
                      className="p-panel-lockup"
                      ref={(el) => { panelLockupRefs.current[tier] = el }}
                    />
                    <div className="p-panel-head-text">
                      <div className="p-panel-eyebrow">{TIERS[tier].descriptors}</div>
                      <h3 className="p-panel-tier-name">{TIERS[tier].name}</h3>
                      <p className="p-panel-copy">{TIERS[tier].copy}</p>
                    </div>
                  </div>

                  <div className="p-flavor-grid">
                    {liveFlavors(tier).map((f, i) => {
                      const slug = toSlug(tier, f)
                      const img = getCanImage(slug)
                      return (
                        <a
                          key={slug}
                          href={`https://www.savorsunrise.com/products/${slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-flavor-card"
                          aria-label={`${f.name} — ${TIERS[tier].name}${f.cannabinoid ? ` with ${f.cannabinoid}` : ''}`}
                          style={{ ['--flavor-color' as string]: f.flavorColor } as React.CSSProperties}
                        >
                          {img ? (
                            <div className="p-flavor-can has-image">
                              <img src={img} alt={`SUNRISE ${f.name}`} loading="lazy" />
                            </div>
                          ) : (
                            <div className="p-flavor-can" />
                          )}
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
                              ref={(el) => { cornerRefs.current[`${tier}-${i}`] = el }}
                              aria-label={`+${f.cannabinoid}`}
                            />
                          )}
                        </a>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>
      <SiteFooter />
    </>
  )
}
