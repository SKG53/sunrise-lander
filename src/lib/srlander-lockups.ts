// ─────────────────────────────────────────────────────────────────────────
// SUNRISE LANDER — LOCKUP RENDERERS (LANDER-ONLY)
//
// Restricted vocabulary removed:
// "" -> "ACTIVE"
// "" / "" / "" -> "BLEND"
//
// Geometry, font, weights, sizes, letter-spacing and colors are IDENTICAL to
// the canonical lockups in src/lib/sunrise-components.ts. Only the terminal
// label string differs.
//
// NEVER use these on savorsunrise.com or any main-brand material — the
// canonical /// lockups remain authoritative there.
//
// Known cosmetic quirk, accepted: "ACTIVE" (6 chars) and "BLEND" (5) are wider
// than "" (3) and "" (3), so the label line runs wider than the number
// above it. This is expected. Do not "fix" it.
//
// Requires Montserrat wght 800+900 (already loaded site-wide via __root.tsx).
// ─────────────────────────────────────────────────────────────────────────

// ── Unified ACTIVE potency lockup — identical ratios across all tiers ──────
function _renderActiveLockup(dose: string, base: number, color: string): string {
  const mg = base * 0.27;
  const active = base * 0.66;
  return (
    `<span style="display:inline-block; vertical-align:top; line-height:0; text-align:left">` +
      `<span style="display:inline; font-family:Montserrat, sans-serif; font-size:${base}px; font-weight:900; letter-spacing:${base * -0.105}px; color:${color}; line-height:1">${dose}</span>` +
      `<span style="display:inline-block; vertical-align:top; margin-left:${base * 0.15}px; margin-top:${base * 0.11}px">` +
        `<span style="display:block; font-family:Montserrat, sans-serif; font-size:${mg}px; font-weight:900; letter-spacing:${mg * -0.15}px; color:${color}; line-height:1; margin-left:${base * -0.013}px; margin-bottom:${base * -0.075}px">MG</span>` +
        `<span style="display:block; font-family:Montserrat, sans-serif; font-size:${active}px; font-weight:800; letter-spacing:${active * -0.13}px; color:${color}; line-height:1">ACTIVE</span>` +
      `</span>` +
    `</span>`
  );
}

export function render5mgActiveLockup(base: number, color = "#C4922A"): string {
  return _renderActiveLockup("5", base, color);
}
export function render10mgActiveLockup(base: number, color = "#CC1F39"): string {
  return _renderActiveLockup("10", base, color);
}
export function render30mgActiveLockup(base: number, color = "#0B6134"): string {
  return _renderActiveLockup("30", base, color);
}
export function render60mgActiveLockup(base: number, color = "#61213A"): string {
  return _renderActiveLockup("60", base, color);
}

// ── Inline +BLEND lockup (stands in for + / + / +) ───────────────
// Counterpart to renderLockup / renderLockup / renderLockup.
// Pass the color of the it stands in for:
// orange #DC7F27 | purple #2E1E3D | red #CC1F39
export function renderBlendLockup(base: number, color = "#DC7F27"): string {
  return (
    `<span style="display:inline-block; text-align:left; line-height:1">` +
      `<span style="font-family:Montserrat, sans-serif; font-size:${base}px; font-weight:900; letter-spacing:0px; color:${color}; margin-left:${base * 0.01}px">+</span>` +
      `<span style="font-family:Montserrat, sans-serif; font-size:${base}px; font-weight:900; letter-spacing:${base * -0.105}px; color:${color}; margin-left:${base * -0.02}px">BLEND</span>` +
    `</span>`
  );
}

// ── Standalone BLEND text lockup (no plus sign) ────────────────────────────
export function renderBlendTextLockup(base: number, color = "#DC7F27"): string {
  return (
    `<span style="display:inline-block; text-align:left; line-height:1">` +
      `<span style="font-family:Montserrat, sans-serif; font-size:${base}px; font-weight:900; letter-spacing:${base * -0.105}px; color:${color}">BLEND</span>` +
    `</span>`
  );
}
