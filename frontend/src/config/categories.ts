import { CategoryConfig } from '../types';

export const categories: CategoryConfig[] = [
  {
    id: 'instagram',
    name: 'Instagram',
    description: 'Post / Reel / IGTV',
    icon: 'instagram',
    color: 'from-pink-500 to-rose-600',
    hoverColor: 'from-pink-600 to-rose-700',
    placeholder: 'https://instagram.com/p/...',
    hasMediaType: false,
  },
  {
    id: 'spotify',
    name: 'Spotify',
    description: 'Song (MP3)',
    icon: 'spotify',
    color: 'from-green-500 to-emerald-600',
    hoverColor: 'from-green-600 to-emerald-700',
    placeholder: 'https://open.spotify.com/track/...',
    hasMediaType: false,
  },
  {
    id: 'youtube',
    name: 'YouTube',
    description: 'Video / Audio',
    icon: 'youtube',
    color: 'from-red-500 to-red-600',
    hoverColor: 'from-red-600 to-red-700',
    placeholder: 'https://youtube.com/watch?v=...',
    hasMediaType: true,
    mediaTypes: [
      { value: 'video', label: 'Video (MP4)' },
      { value: 'audio', label: 'Audio (MP3)' },
    ],
  },
  {
    id: 'x',
    name: 'X / Twitter',
    description: 'Video',
    icon: 'x',
    color: 'from-blue-500 to-blue-600',
    hoverColor: 'from-blue-600 to-blue-700',
    placeholder: 'https://x.com/user/status/...',
    hasMediaType: false,
  },
];