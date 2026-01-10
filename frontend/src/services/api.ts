// Frontend API client: uses GET /download?url=... with x-api-key header
const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000/download';
const API_KEY = (import.meta as any).env?.VITE_API_KEY || '';

export interface ApiError {
  message: string;
  status?: number;
}

export async function downloadMedia(url: string, mediaType?: string): Promise<{ blob: Blob; filename: string } | Array<{ blob: Blob; filename: string }>> {
  try {
    if (!API_KEY) {
      throw new Error('Frontend API key is not set. Set VITE_API_KEY in project/.env or your environment before running the app.');
    }

  const mediaQuery = mediaType ? `&media_type=${encodeURIComponent(mediaType)}` : '';
  const response = await fetch(`${API_URL}?url=${encodeURIComponent(url)}${mediaQuery}`, {
      method: 'GET',
      headers: {
        'x-api-key': API_KEY,
        'Accept': '*/*',
      },
    });

    if (!response.ok) {
      let errorMessage = 'Download failed';
      
      try {
        const errorText = await response.text();
        if (errorText) {
          errorMessage = errorText;
        }
      } catch {
        switch (response.status) {
          case 400:
            errorMessage = 'Invalid URL provided';
            break;
          case 401:
            errorMessage = 'Authentication failed - invalid API key';
            break;
          case 403:
            errorMessage = 'Access forbidden';
            break;
          case 404:
            errorMessage = 'Media not found or unsupported platform';
            break;
          case 429:
            errorMessage = 'Rate limit exceeded - please try again later';
            break;
          case 500:
            errorMessage = 'Server error - please try again later';
            break;
          default:
            errorMessage = `Download failed (${response.status})`;
        }
      }

      throw new Error(errorMessage);
    }

    const respContentType = response.headers.get('content-type');
  if (respContentType && respContentType.includes('application/json')) {
      // Could be an error or a files-list response
      const json = await response.json();
      // If server returned files array, fetch each file sequentially
      if (json && Array.isArray(json.files) && json.files.length > 0) {
        const results: Array<{ blob: Blob; filename: string }> = [];
        for (const entry of json.files) {
          try {
            const fileResp = await fetch((import.meta as any).env?.VITE_API_URL?.replace('/download','') + entry.download_url, {
              method: 'GET',
              headers: { 'x-api-key': API_KEY, 'Accept': '*/*' }
            });
            if (!fileResp.ok) throw new Error(`Failed to fetch file: ${entry.filename} (${fileResp.status})`);
            const fileBlob = await fileResp.blob();
            results.push({ blob: fileBlob, filename: entry.filename });
          } catch (err) {
            throw err;
          }
        }
        return results;
      }

      // Otherwise treat it as an error
      throw new Error(json.error || json.message || 'Download failed');
    }

    const blob = await response.blob();

    if (blob.size === 0) {
      throw new Error('Received empty file - please try again');
    }

    // Try to get filename from Content-Disposition header
    const contentDisp = response.headers.get('content-disposition') || '';
    let filename = '';
    try {
      const match = /filename\*=UTF-8''([^;\n\r]+)/i.exec(contentDisp) || /filename="?([^";]+)"?/i.exec(contentDisp);
      if (match) {
        filename = decodeURIComponent(match[1]);
      }
    } catch {
      filename = '';
    }

    // Fallback: try to derive filename from URL or content-type
    if (!filename) {
      try {
        const urlObj = new URL(url);
        const last = urlObj.pathname.split('/').pop() || '';
        if (last && last.includes('.')) {
          filename = last;
        }
      } catch {
        // ignore
      }
    }

    const respContentType2 = response.headers.get('content-type') || '';
    if (!filename) {
      if (respContentType2.includes('audio')) filename = 'audio.mp3';
      else if (respContentType2.includes('video')) filename = 'video.mp4';
      else if (respContentType2.includes('image')) filename = 'image.jpg';
      else filename = 'downloaded_media';
    }

    return { blob, filename };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Network error - please check your connection and try again');
  }
}

export function downloadFile(blob: Blob, filename: string): void {
  try {
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => {
      URL.revokeObjectURL(downloadUrl);
    }, 100);
  } catch (error) {
    console.error('Error downloading file:', error);
    throw new Error('Failed to save file - please try again');
  }
}