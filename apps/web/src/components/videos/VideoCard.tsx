'use client';

import Image from 'next/image';
import { useRef } from 'react';
import { Video } from '@mytube/shared-model';

interface Props {
  video: Video;
  onPlay: (video: Video) => void;
  index: number;
  total: number;
}

export function VideoCard({ video, onPlay, index, total }: Props) {
  const ref = useRef<HTMLButtonElement>(null);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!ref.current) return;
    const columns = 4;
    switch (event.key) {
      case 'ArrowRight': {
        const nextIndex = Math.min(total - 1, index + 1);
        if (nextIndex !== index) {
          event.preventDefault();
          ref.current.parentElement?.querySelectorAll('button')[nextIndex]?.focus();
        }
        break;
      }
      case 'ArrowLeft': {
        const prevIndex = Math.max(0, index - 1);
        if (prevIndex !== index) {
          event.preventDefault();
          ref.current.parentElement?.querySelectorAll('button')[prevIndex]?.focus();
        }
        break;
      }
      case 'ArrowDown': {
        const nextIndex = Math.min(total - 1, index + columns);
        if (nextIndex !== index) {
          event.preventDefault();
          ref.current.parentElement?.querySelectorAll('button')[nextIndex]?.focus();
        }
        break;
      }
      case 'ArrowUp': {
        const prevIndex = Math.max(0, index - columns);
        if (prevIndex !== index) {
          event.preventDefault();
          ref.current.parentElement?.querySelectorAll('button')[prevIndex]?.focus();
        }
        break;
      }
      case 'Enter':
      case ' ': {
        event.preventDefault();
        onPlay(video);
        break;
      }
    }
  };

  return (
    <button
      ref={ref}
      onClick={() => onPlay(video)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      className="group flex flex-col rounded-xl border border-gray-800 bg-gray-900 text-left shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
    >
      <div className="relative aspect-video w-full overflow-hidden rounded-t-xl">
        {video.thumbUrl ? (
          <Image
            src={video.thumbUrl}
            alt={video.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-800 text-gray-500">No preview</div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="line-clamp-2 text-sm font-semibold text-white">{video.title}</p>
        <p className="text-xs uppercase text-gray-400">{formatDuration(video.durationSeconds)}</p>
        {video.publishedAt ? (
          <p className="text-xs text-gray-500">{new Date(video.publishedAt).toLocaleDateString()}</p>
        ) : null}
      </div>
    </button>
  );
}

const formatDuration = (durationSeconds: number) => {
  const hours = Math.floor(durationSeconds / 3600);
  const minutes = Math.floor((durationSeconds % 3600) / 60);
  const seconds = durationSeconds % 60;
  const parts = [];
  if (hours > 0) parts.push(hours.toString());
  parts.push(hours > 0 ? minutes.toString().padStart(2, '0') : minutes.toString());
  parts.push(seconds.toString().padStart(2, '0'));
  return parts.join(':');
};
