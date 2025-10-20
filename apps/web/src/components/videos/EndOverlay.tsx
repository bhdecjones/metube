'use client';

interface Props {
  onReplay: () => void;
  onExit: () => void;
}

export function EndOverlay({ onReplay, onExit }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-gray-800 bg-gray-900/90 p-8 text-center">
      <h2 className="text-2xl font-semibold">Finished watching?</h2>
      <div className="flex flex-wrap justify-center gap-4">
        <button
          onClick={onReplay}
          className="rounded bg-white px-6 py-3 text-black hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          Replay
        </button>
        <button
          onClick={onExit}
          className="rounded border border-white px-6 py-3 text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}
