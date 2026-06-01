// Top banner shown only in the GitHub Pages demo build. Makes the "no real
// processing, clone for the full app" contract explicit and honest.
const IS_DEMO = import.meta.env.VITE_DEMO_MODE === 'true';
const REPO_URL = 'https://github.com/nohe-sohbi/SnowBooks';

export function DemoBanner() {
  if (!IS_DEMO) return null;
  return (
    <div className="bg-gradient-to-r from-winter-blue-600 to-warm-amber-500 text-white" role="note">
      <div className="max-w-5xl mx-auto px-4 py-2.5 flex flex-col sm:flex-row items-center justify-center gap-x-3 gap-y-1 text-center text-sm">
        <span className="font-semibold whitespace-nowrap">Demo mode</span>
        <span className="opacity-95">
          Runs entirely in your browser, no server. Processes a built-in sample clip.
        </span>
        <a
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
          className="underline font-medium hover:opacity-80 whitespace-nowrap"
        >
          Clone the repo for the full app →
        </a>
      </div>
    </div>
  );
}

export default DemoBanner;
