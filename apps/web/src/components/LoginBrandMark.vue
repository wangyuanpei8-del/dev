<template>
  <svg
    class="brand-mark"
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="社員寮管理システム"
  >
    <defs>
      <linearGradient id="brand-bg" x1="8" y1="4" x2="72" y2="76" gradientUnits="userSpaceOnUse">
        <stop stop-color="#22d3ee" />
        <stop offset="0.45" stop-color="#0891b2" />
        <stop offset="1" stop-color="#6366f1" />
      </linearGradient>
      <linearGradient id="brand-shine" x1="20" y1="12" x2="56" y2="44" gradientUnits="userSpaceOnUse">
        <stop stop-color="#ffffff" stop-opacity="0.55" />
        <stop offset="1" stop-color="#ffffff" stop-opacity="0" />
      </linearGradient>
      <filter id="brand-glow" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    <!-- outer glow ring -->
    <circle cx="40" cy="40" r="36" stroke="url(#brand-bg)" stroke-width="1.5" opacity="0.35" />
    <circle cx="40" cy="40" r="33" fill="url(#brand-bg)" filter="url(#brand-glow)" />

    <!-- glass highlight -->
    <ellipse cx="32" cy="26" rx="18" ry="12" fill="url(#brand-shine)" />

    <!-- building mark -->
    <g transform="translate(40 42)" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <!-- roof -->
      <path d="M-14 -10 L0 -20 L14 -10" fill="none" />
      <!-- body -->
      <rect x="-12" y="-10" width="24" height="22" rx="2" fill="rgba(255,255,255,0.12)" stroke="#fff" />
      <!-- door -->
      <path d="M-3 12 L-3 2 A3 3 0 0 1 3 2 L3 12" fill="rgba(255,255,255,0.2)" />
      <!-- windows -->
      <rect x="-9" y="-5" width="5" height="5" rx="0.8" fill="rgba(255,255,255,0.85)" stroke="none" />
      <rect x="4" y="-5" width="5" height="5" rx="0.8" fill="rgba(255,255,255,0.85)" stroke="none" />
      <rect x="-9" y="4" width="5" height="5" rx="0.8" fill="rgba(255,255,255,0.55)" stroke="none" />
      <rect x="4" y="4" width="5" height="5" rx="0.8" fill="rgba(255,255,255,0.55)" stroke="none" />
    </g>
  </svg>
</template>

<style scoped>
.brand-mark {
  display: block;
  width: 72px;
  height: 72px;
}
</style>
