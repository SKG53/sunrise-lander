// srbev.com landing — deliberately minimal age-gate splash for paid traffic.
// Shell provides the rotating announcement bar + cream background + site-wide
// noindex. This page is: (1) a horizontally auto-scrolling strip of the (blurred)
// cans, then (2) an inline age gate — "Are you 21 or older?" with Yes / No.
//   • YES  → same-tab to the main store's products page. The shell's link
//            rewriter appends ?ref=srbev at click time (spin suppression today;
//            the future fbc/fbp pixel passthrough will hook the same click).
//   • NO   → terminal refusal message in place (matches the main-site gate copy,
//            minus the restricted-vocab product disclosure — reworded per brand).
// The Spin & Save wheel is intentionally NOT armed on this route (see SpinWheel).
// The previous full lander is preserved verbatim at /neverpull/oghome-fys.
import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { getCanImage } from '../lib/canImages'
import { renderWordmark, getBasePx } from '../lib/sunrise-components'
import './index.css'

// Every blurred can, in tier order, for the marquee. Names are flavor-only —
// no potency/cannabinoid wording (restricted-vocab surface).
const MARQUEE_CANS: { slug: string; name: string }[] = [
  { slug: '10mg-strawberry', name: 'Strawberry' },
  { slug: '30mg-cherry-limeade', name: 'Cherry Limeade' },
  { slug: '60mg-blueberry-lemonade', name: 'Blueberry Lemonade' },
  { slug: '10mg-watermelon', name: 'Watermelon' },
  { slug: '30mg-peach-mango', name: 'Peach Mango' },
  { slug: '60mg-blood-orange-cbg', name: 'Blood Orange' },
  { slug: '10mg-lemonade', name: 'Lemonade' },
  { slug: '30mg-blueberry-pomegranate-cbn', name: 'Blueberry Pomegranate' },
  { slug: '60mg-strawberry-kiwi-thcv', name: 'Strawberry Kiwi' },
  { slug: '30mg-orange-lemonade', name: 'Orange Lemonade' },
  { slug: '60mg-blackberry-cbn', name: 'Blackberry' },
  { slug: '30mg-kiwi-watermelon-cbg', name: 'Kiwi Watermelon' },
  { slug: '60mg-passionfruit-mango', name: 'Passionfruit Mango' },
  { slug: '30mg-strawberry-watermelon-thcv', name: 'Strawberry Watermelon' },
  { slug: '60mg-wild-cherry-peach', name: 'Wild Cherry Peach' },
]

export const Route = createFileRoute('/')({
  component: LanderHome,
})

function LanderHome() {
  const [refused, setRefused] = useState(false)
  const wmRef = useRef<HTMLSpanElement>(null)

  // Paint the SUNRISE wordmark (gradient) into the gate, sized to base.
  useEffect(() => {
    const paint = () => {
      if (!wmRef.current) return
      const base = getBasePx()
      const size = window.innerWidth <= 768 ? base * 1.15 : base * 1.4
      wmRef.current.innerHTML = renderWordmark(size, 'gradient')
    }
    paint()
    window.addEventListener('resize', paint)
    return () => window.removeEventListener('resize', paint)
  }, [])

  // Duplicated once for a seamless -50% marquee loop.
  const loop = [...MARQUEE_CANS, ...MARQUEE_CANS]

  return (
    <main className="srb">
      {/* Cans marquee */}
      <section className="srb-marquee" aria-label="SUNRISE flavors">
        <div className="srb-marquee-track">
          {loop.map((c, i) => {
            const src = getCanImage(c.slug)
            if (!src) return null
            const dup = i >= MARQUEE_CANS.length
            return (
              <img
                key={`${c.slug}-${i}`}
                className="srb-marquee-can"
                src={src}
                alt={dup ? '' : `SUNRISE ${c.name}`}
                aria-hidden={dup || undefined}
                loading={i < 6 ? 'eager' : 'lazy'}
              />
            )
          })}
        </div>
      </section>

      {/* Inline age gate */}
      <section className="srb-gate">
        <span className="srb-gate-wm" ref={wmRef} aria-label="SUNRISE" />
        {!refused ? (
          <>
            <h1 className="srb-gate-heading">Are you 21 or older?</h1>
            <div className="srb-gate-actions">
              <a className="srb-gate-btn srb-gate-btn-primary" href="https://www.savorsunrise.com/products">
                Yes, I&rsquo;m 21+
              </a>
              <button
                type="button"
                className="srb-gate-btn srb-gate-btn-secondary"
                onClick={() => setRefused(true)}
              >
                No
              </button>
            </div>
          </>
        ) : (
          <h1 className="srb-gate-heading srb-gate-heading-refused">
            Sorry, you must be 21+ to view this site.
          </h1>
        )}
        <p className="srb-gate-disclosure">Must be 21+ to enter.</p>
      </section>
    </main>
  )
}
