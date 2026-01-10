export type Platform = 'instagram' | 'spotify' | 'youtube' | 'x';
export type MediaType = 'audio' | 'video';

export interface DownloadRequest {
  url: string;
  platform?: Platform;
  media_type?: MediaType;
  filename?: string;
}

export interface DownloadResponse {
  file_id: string;
  download_url: string;
  filename: string;
}

export interface CategoryConfig {
  id: Platform;
  name: string;
  description: string;
  icon: Platform;
  color: string;
  hoverColor: string;
  placeholder: string;
  hasMediaType: boolean;
  mediaTypes?: { value: MediaType; label: string }[];
}