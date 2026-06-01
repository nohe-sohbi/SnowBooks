
import FileUploader from "./components/FileUploader.tsx";
import { DemoBanner } from "./components/DemoBanner";
import { WinterAtmosphere } from "./components/WinterAtmosphere";

// Decorative audio waveform that gently breathes, ties the hero to "audio".
function Waveform() {
  const bars = [10, 18, 28, 16, 34, 22, 44, 30, 52, 36, 60, 40, 52, 30, 44, 22, 34, 16, 28, 18, 10];
  return (
    <svg
      width="320"
      height="64"
      viewBox="0 0 320 64"
      fill="none"
      className="max-w-full opacity-90"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="wf" x1="0" y1="0" x2="320" y2="0" gradientUnits="userSpaceOnUse">
          <stop stopColor="#60a5fa" />
          <stop offset="0.6" stopColor="#3b82f6" />
          <stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      {bars.map((h, i) => {
        const dur = 2.2 + (i % 5) * 0.35;
        const low = Math.max(6, h - 16);
        return (
          <rect
            key={i}
            x={i * 15 + 3}
            y={(64 - h) / 2}
            width="6"
            height={h}
            rx="3"
            fill="url(#wf)"
            opacity={0.5 + h / 140}
          >
            <animate
              attributeName="height"
              values={`${h};${low};${h}`}
              dur={`${dur}s`}
              repeatCount="indefinite"
            />
            <animate
              attributeName="y"
              values={`${(64 - h) / 2};${(64 - low) / 2};${(64 - h) / 2}`}
              dur={`${dur}s`}
              repeatCount="indefinite"
            />
          </rect>
        );
      })}
    </svg>
  );
}

function App() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <WinterAtmosphere />

      {/* Screen reader live regions */}
      <div aria-live="polite" aria-atomic="true" className="sr-only" id="announcements" />
      <div aria-live="assertive" aria-atomic="true" className="sr-only" id="urgent-announcements" />

      <div className="relative z-10">
        <DemoBanner />

        {/* Hero */}
        <header className="px-4 pt-14 pb-8 sm:pt-20 sm:pb-12" role="banner">
          <div className="mx-auto max-w-3xl text-center">
            <p
              className="animate-rise mb-6 inline-flex items-center gap-2 rounded-full glass-frost px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-winter-blue-700"
              style={{ animationDelay: "0ms" }}
            >
              <span className="text-warm-amber-500">❄</span> Ambient audiobook studio
            </p>

            <h1
              className="animate-rise font-display text-6xl font-semibold leading-[0.92] tracking-tight text-ice-gray-900 sm:text-7xl md:text-8xl"
              style={{ animationDelay: "80ms" }}
            >
              Snow
              <span className="bg-gradient-to-br from-winter-blue-500 via-winter-blue-700 to-winter-blue-900 bg-clip-text text-transparent">
                Books
              </span>
            </h1>

            <p
              className="animate-rise mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ice-gray-600 sm:text-xl"
              style={{ animationDelay: "160ms" }}
            >
              SnowBooks mixes a steady layer of white noise into your audiobook
              chapters, so the narration stays clear while background sounds and
              distractions fade into the quiet.
            </p>
            <p
              className="animate-rise mx-auto mt-4 max-w-xl text-base leading-relaxed text-ice-gray-500"
              style={{ animationDelay: "220ms" }}
            >
              Drop in a ZIP of MP3 chapters, set the white-noise intensity, preview
              the mix, and download your calmer collection.{" "}
              <span className="font-display italic text-ice-gray-700">
                Made for reading while it snows.
              </span>
            </p>

            <div className="animate-rise mt-9 flex justify-center" style={{ animationDelay: "240ms" }}>
              <Waveform />
            </div>
          </div>
        </header>

        {/* Main application */}
        <main className="px-3 pb-16 sm:px-4" id="main-content" role="main">
          <div className="animate-rise mx-auto max-w-5xl" style={{ animationDelay: "320ms" }}>
            <h2 className="sr-only">Audio Processing Workflow</h2>
            <FileUploader />
          </div>
        </main>

        {/* Footer */}
        <footer className="px-4 py-10">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-sm text-ice-gray-500">
              Built for audiobook nights · powered by the Web Audio API, no server
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
