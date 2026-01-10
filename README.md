# Universal Media Downloader

A small FastAPI + Vite React TypeScript application that downloads media from Instagram, YouTube, X/Twitter, Spotify and more.

> Disclaimer: This project is provided for educational purposes only. Do not use it to infringe copyrights or to download content you do not have permission to access.

## Features
- Backend: FastAPI service that downloads media using `yt-dlp`, `instaloader`, and `spotdl`.
- Frontend: Vite + React + TypeScript UI to enter URLs and manage downloads.

## Requirements
- Python 3.10+ (3.11 recommended)
- Node.js 18+ and npm
- ffmpeg installed and available on your PATH (required by yt-dlp / ffmpeg postprocessing)

## Quick start (development)

1. Clone the repository

```powershell
git clone https://github.com/Cheekurthi-Vamsi/Universal-Media-Downloader-.git
```

2. Backend setup

```powershell
pip install -r requirements.txt
# optionally create a .env file in repo root to set API_KEY and other env vars
```

3. Run backend

```powershell
# from repository root
uvicorn downloads.main:app --reload --host 0.0.0.0 --port 8000
```

4. Frontend setup & run

```powershell
cd frontend
npm install
npm run dev
```

Open the frontend URL shown by Vite (usually http://localhost:5173) and use the app. The backend defaults to http://localhost:8000.

## Environment variables
- `API_KEY` - optional, set to protect endpoints. If not set the server prints a generated key on startup.
- `INSTALOADER_SESSION_FILE`, `INSTALOADER_USERNAME`, `INSTALOADER_PASSWORD` - optional for Instagram private content.
- `CORS_ALLOW_ORIGINS` - comma-separated list of origins allowed for CORS (defaults to `*`).

## Usage
- Use the frontend to paste a URL and choose media type (audio/video). The backend will return a `file_id` and a download endpoint which will delete the file after it's served (cleanup also runs on TTL).

## Security / Legal
This tool can download content from third-party services. Make sure you have permission to download and store any content. Do not use this project to violate terms of service or infringe copyright.

## Troubleshooting
- If downloads fail, check backend logs printed by uvicorn.
- Ensure `ffmpeg` is installed on your system and available in PATH for audio/video conversions.
- For Instagram private content, set up `INSTALOADER_SESSION_FILE` or login credentials as env vars.

## Development notes
- The backend stores temporary downloads under `downloads/` and removes them after serving or via a cleanup TTL.
- The frontend assets (favicon) are in `frontend/src/assets/`.

---

If you'd like, I can:
- Start the dev servers and run a quick smoke test here.
- Generate a `favicon.ico` and add multiple icon sizes for production.
