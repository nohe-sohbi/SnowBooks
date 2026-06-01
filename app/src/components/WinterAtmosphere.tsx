import { useMemo } from 'react';

// Fixed, behind-everything atmosphere layer for the frosted winter daylight look:
// drifting snow, soft floating light orbs (warm + cool) and a faint film grain.
// Decorative only (aria-hidden); snow is disabled under prefers-reduced-motion via CSS.

const SNOW_COUNT = 40;

// Index-seeded pseudo-random so the layout is stable across renders (no Math.random
// flicker) while still looking scattered.
function seeded(i: number, salt: number) {
  const x = Math.sin((i + 1) * salt) * 10000;
  return x - Math.floor(x);
}

function makeFlake(i: number) {
  return {
    size: 2 + seeded(i, 12.9898) * 5, // 2-7px
    left: seeded(i, 78.233) * 100, // 0-100%
    duration: 9 + seeded(i, 43.123) * 13, // 9-22s
    delay: -seeded(i, 91.7) * 22, // negative => already mid-fall on load
    drift: seeded(i, 27.4) * 70 - 35, // -35..35px horizontal drift
    opacity: 0.4 + seeded(i, 55.1) * 0.5, // 0.4-0.9
  };
}

export function WinterAtmosphere() {
  const flakes = useMemo(() => Array.from({ length: SNOW_COUNT }, (_, i) => makeFlake(i)), []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Floating light orbs add depth over the body gradient */}
      <div className="animate-float absolute -top-24 right-[-7rem] h-[30rem] w-[30rem] rounded-full bg-warm-amber-300/25 blur-3xl" />
      <div
        className="animate-float absolute left-[-9rem] top-1/3 h-[28rem] w-[28rem] rounded-full bg-winter-blue-300/25 blur-3xl"
        style={{ animationDelay: '-3.5s' }}
      />
      <div
        className="animate-float absolute bottom-[-6rem] right-1/4 h-[22rem] w-[22rem] rounded-full bg-winter-blue-200/30 blur-3xl"
        style={{ animationDelay: '-1.5s' }}
      />

      {/* Faint grain to remove the flat-white feel */}
      <div className="grain-overlay absolute inset-0 opacity-[0.06]" />

      {/* Drifting snow */}
      {flakes.map((f, i) => (
        <span
          key={i}
          className="snowflake"
          style={
            {
              left: `${f.left}%`,
              width: `${f.size}px`,
              height: `${f.size}px`,
              animationDuration: `${f.duration}s`,
              animationDelay: `${f.delay}s`,
              '--snow-drift': `${f.drift}px`,
              '--snow-opacity': f.opacity,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

export default WinterAtmosphere;
