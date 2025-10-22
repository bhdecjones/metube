'use client';

import { useEffect, useState } from 'react';
import { Video } from '@metube/shared-model';
import { VideoCard } from './VideoCard';
import { YTPlayer } from './YTPlayer';
import { EndOverlay } from './EndOverlay';

interface Props {
  videos: Video[];
}

export function ProfileHomeClient({ videos }: Props) {
  const [selected, setSelected] = useState<Video | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [playerKey, setPlayerKey] = useState(0);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Backspace') {
        if (selected) {
          event.preventDefault();
          setSelected(null);
          setShowOverlay(false);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selected]);

  const handleEnded = () => {
    setShowOverlay(true);
  };

  const handleReplay = () => {
    if (!selected) return;
    setShowOverlay(false);
    setPlayerKey((key) => key + 1);
  };

  const handleExit = () => {
    setSelected(null);
    setShowOverlay(false);
  };

  const handlePlay = (video: Video) => {
    setSelected(video);
    setShowOverlay(false);
    setPlayerKey((key) => key + 1);
  };

  return (
    <div className="space-y-8">
      {selected ? (
        <div className="relative mx-auto max-w-5xl">
          {!showOverlay ? (
            <YTPlayer key={`${selected.videoId}-${playerKey}`} videoId={selected.videoId} onEnded={handleEnded} />
          ) : (
            <div className="flex aspect-video items-center justify-center">
              <EndOverlay onReplay={handleReplay} onExit={handleExit} />
            </div>
          )}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {videos.map((video, index) => (
          <VideoCard key={video.videoId} video={video} onPlay={handlePlay} index={index} total={videos.length} />
        ))}
      </div>
    </div>
  );
}
