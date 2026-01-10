# main.py
import os
import re
import uuid
import shutil
import subprocess
import asyncio
from datetime import datetime, timedelta
from typing import Optional
from fastapi import FastAPI, HTTPException, Header, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel
import logging
from dotenv import load_dotenv
import os as _os

# media libs
import yt_dlp
import instaloader
import zipfile

# ---------- Config ----------
DOWNLOAD_ROOT = os.path.join(os.getcwd(), "downloads")
os.makedirs(DOWNLOAD_ROOT, exist_ok=True)

# Load .env from repository root if present so API_KEY set in repo .env is used
root_env = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
if os.path.exists(root_env):
    load_dotenv(root_env)

# API key via env var, fallback to a generated one (printed at startup)
API_KEY = os.environ.get("API_KEY") or str(uuid.uuid4())
PRINT_API_KEY = os.environ.get("PRINT_API_KEY", "1")

# TTL for files and cleanup interval
FILE_TTL = timedelta(hours=1)
CLEANUP_INTERVAL_SECONDS = 600

# Allowed CORS origins (set to '*' or specific frontends)
CORS_ALLOW_ORIGINS = os.environ.get("CORS_ALLOW_ORIGINS", "*").split(",") if os.environ.get("CORS_ALLOW_ORIGINS") else ["*"]

app = FastAPI(title="Universal Media Downloader API")
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("media-downloader")

# allow CORS from frontend(s)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ALLOW_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

# Simple request model
class DownloadRequest(BaseModel):
    url: str
    platform: Optional[str] = None  # instagram | youtube | spotify | x
    media_type: Optional[str] = None  # audio | video
    filename: Optional[str] = None  # desired filename without extension

# File registry
FILE_REGISTRY = {}  # file_id -> {"path": str, "created": datetime}

# ----------------- Helpers -----------------
def validate_api_key(x_api_key: str = Header(None)):
    if not x_api_key or x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")

def detect_platform(url: str) -> str:
    u = url.lower()
    if "instagram.com" in u:
        return "instagram"
    if "spotify.com" in u:
        return "spotify"
    if "youtube.com" in u or "youtu.be" in u:
        return "youtube"
    if "twitter.com" in u or "x.com" in u:
        return "x"
    raise ValueError("Could not detect platform from URL")

def sanitize_filename(name: str) -> str:
    # basic sanitization and trimming
    name = re.sub(r'[\\/:"*?<>|]+', "_", name).strip()
    name = re.sub(r'\s+', ' ', name)
    return name[:200]  # limit length

def make_task_dir() -> str:
    task_id = str(uuid.uuid4())
    path = os.path.join(DOWNLOAD_ROOT, task_id)
    os.makedirs(path, exist_ok=True)
    return path

def register_file(path: str) -> str:
    file_id = str(uuid.uuid4())
    FILE_REGISTRY[file_id] = {"path": path, "created": datetime.utcnow()}
    return file_id

def file_path_by_id(file_id: str) -> str:
    meta = FILE_REGISTRY.get(file_id)
    if not meta:
        raise HTTPException(status_code=404, detail="File not found")
    return meta["path"]

async def cleanup_old_files_loop():
    while True:
        now = datetime.utcnow()
        to_delete = []
        for fid, meta in list(FILE_REGISTRY.items()):
            created = meta["created"]
            if now - created > FILE_TTL:
                to_delete.append((fid, meta["path"]))
        for fid, path in to_delete:
            try:
                if os.path.isdir(path):
                    shutil.rmtree(path, ignore_errors=True)
                elif os.path.isfile(path):
                    os.remove(path)
            except Exception as e:
                logger.warning("Cleanup error removing %s: %s", path, e)
            FILE_REGISTRY.pop(fid, None)
        await asyncio.sleep(CLEANUP_INTERVAL_SECONDS)


def _safe_remove_path(path: str):
    """Remove a file or directory safely. Ignore errors."""
    try:
        if os.path.isdir(path):
            shutil.rmtree(path, ignore_errors=True)
        elif os.path.isfile(path):
            os.remove(path)
        # attempt to remove parent dir if empty and inside DOWNLOAD_ROOT
        parent = os.path.dirname(path)
        if parent and os.path.commonpath([os.path.abspath(parent), os.path.abspath(DOWNLOAD_ROOT)]) == os.path.abspath(DOWNLOAD_ROOT):
            try:
                if os.path.isdir(parent) and not os.listdir(parent):
                    os.rmdir(parent)
            except Exception:
                pass
    except Exception:
        # swallow exceptions; cleanup loop will handle remaining files
        logger.exception('Error removing path in background: %s', path)


def schedule_remove(background: BackgroundTasks, path: str, file_id: Optional[str] = None):
    """Schedule removal of a path after response. If file_id provided, remove registry entry too."""
    if file_id:
        def _remove_and_unreg():
            try:
                _safe_remove_path(path)
            finally:
                FILE_REGISTRY.pop(file_id, None)
    else:
        def _remove_and_unreg():
            _safe_remove_path(path)

    background.add_task(_remove_and_unreg)

@app.on_event("startup")
async def startup_event():
    if PRINT_API_KEY == "1":
        logger.info("API Key (use header 'x-api-key'): %s", API_KEY)
    asyncio.create_task(cleanup_old_files_loop())

# ----------------- Download implementations -----------------
def extract_instagram_shortcode(url: str) -> Optional[str]:
    # support /p/, /reel/, /reels/, /tv/ and query parameters
    m = re.search(r"(?:/p/|/reel/|/reels/|/tv/)([A-Za-z0-9_-]+)", url)
    return m.group(1) if m else None

def download_instagram(url: str, target_dir: str) -> str:
    shortcode = extract_instagram_shortcode(url)
    if not shortcode:
        raise RuntimeError("Invalid Instagram URL (shortcode not found).")

    # Normalize URL (strip query strings)
    url = url.split('?')[0]

    # Ensure Instaloader places files under target_dir/<shortcode>/ by using a dirname_pattern
    # Instaloader uses the 'target' argument as a folder name under dirname_pattern.
    L = instaloader.Instaloader(dirname_pattern=os.path.join(target_dir, '{target}'), download_comments=False, save_metadata=False)

    # Optional authentication: use session file or username/password from env
    session_file = os.environ.get('INSTALOADER_SESSION_FILE')
    instaloader_user = os.environ.get('INSTALOADER_USERNAME')
    instaloader_pass = os.environ.get('INSTALOADER_PASSWORD')
    try:
        if instaloader_user and session_file and os.path.exists(session_file):
            # Preferred: load session via helper which accepts username and filename
            try:
                L.load_session_from_file(instaloader_user, session_file)
                logger.info('Loaded instaloader session from %s for user %s', session_file, instaloader_user)
            except Exception:
                # Some older/newer Instaloader versions require a file-like object
                try:
                    with open(session_file, 'rb') as sf:
                        L.context.load_session_from_file(instaloader_user, sf)
                    logger.info('Loaded instaloader session (file-like) from %s for user %s', session_file, instaloader_user)
                except Exception:
                    logger.exception('Failed to load instaloader session from %s', session_file)
        elif instaloader_user and instaloader_pass:
            logger.info('Logging into Instagram as %s', instaloader_user)
            L.login(instaloader_user, instaloader_pass)
    except Exception:
        logger.exception('Instaloader authentication failed; continuing without auth')

    # Download the post into target_dir/<shortcode>/
    post = instaloader.Post.from_shortcode(L.context, shortcode)
    L.download_post(post, target=shortcode)

    post_folder = os.path.join(target_dir, shortcode)
    if os.path.isdir(post_folder):
        # recursively scan for media files in the post folder
        media = []
        for root, dirs, files in os.walk(post_folder):
            for f in files:
                if f.lower().endswith(('.mp4', '.jpg', '.jpeg', '.png')):
                    media.append(os.path.join(root, f))
        # prefer mp4 if present; return ordered list [video, image] or up to two images
        mp4s = [p for p in media if p.lower().endswith('.mp4')]
        images = [p for p in media if p.lower().endswith(('.jpg', '.jpeg', '.png'))]
        selected = []
        if mp4s:
            mp4s.sort(key=lambda p: os.path.getsize(p), reverse=True)
            selected.append(mp4s[0])
        if images and len(selected) < 2:
            images.sort(key=lambda p: os.path.getsize(p), reverse=True)
            selected.append(images[0])

        if selected:
            logger.info('Selected media for return: %s', selected)
            return selected

        # instaloader may only have saved a cover image for videos; try yt-dlp fallback
        logger.warning('instaloader did not find mp4 in %s, attempting yt-dlp fallback', post_folder)
        try:
            # Stronger yt-dlp attempt: include UA headers and retries
            # If Instaloader loaded a session, try to export cookies to a Netscape cookiefile for yt-dlp
            cookiefile = None
            try:
                cookiejar = None
                if hasattr(L.context, 'cookie_jar'):
                    cookiejar = L.context.cookie_jar
                elif hasattr(L.context, '_session'):
                    cookiejar = getattr(L.context, '_session')

                cj = None
                # requests.Session stores cookies in .cookies
                if cookiejar is not None and hasattr(cookiejar, 'cookies'):
                    cj = cookiejar.cookies
                else:
                    cj = cookiejar

                if cj:
                    cookies_path = os.path.join(target_dir, 'cookies.txt')
                    try:
                        with open(cookies_path, 'w', encoding='utf-8') as cf:
                            cf.write('# Netscape HTTP Cookie File\n')
                            for c in cj:
                                domain = getattr(c, 'domain', '.instagram.com')
                                pathc = getattr(c, 'path', '/')
                                secure = 'TRUE' if getattr(c, 'secure', False) else 'FALSE'
                                expires = str(getattr(c, 'expires', 0) or 0)
                                name = getattr(c, 'name', '')
                                value = getattr(c, 'value', '')
                                cf.write(f"{domain}\tTRUE\t{pathc}\t{secure}\t{expires}\t{name}\t{value}\n")
                        cookiefile = cookies_path
                        logger.info('Wrote cookiefile for yt-dlp: %s', cookiefile)
                    except Exception:
                        logger.exception('Failed to write cookiefile for yt-dlp')
            except Exception:
                logger.exception('Failed to extract cookies from instaloader context')

            # Allow overriding with a pre-exported cookiefile (from browser) via env var
            ext_cookie = os.environ.get('INSTALOADER_COOKIEFILE')
            if ext_cookie and os.path.exists(ext_cookie):
                cookiefile = ext_cookie
                logger.info('Using external cookiefile for yt-dlp: %s', cookiefile)

            http_headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0 Safari/537.36'
            }
            ydl_opts = {
                'outtmpl': os.path.join(target_dir, '%(title)s.%(ext)s'),
                'format': 'bestvideo+bestaudio/best',
                'merge_output_format': 'mp4',
                'quiet': True,
                'noplaylist': True,
                'http_headers': http_headers,
            }
            if cookiefile:
                ydl_opts['cookiefile'] = cookiefile
            logger.info('Running yt-dlp fallback for Instagram post: %s', url)
            # try multiple attempts
            for attempt in range(2):
                try:
                    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                        ydl.extract_info(url, download=True)
                    # Check for downloaded video files
                    files = [f for f in os.listdir(target_dir) if f.lower().endswith(('.mp4', '.webm', '.mkv'))]
                    if files:
                        files_full = [os.path.join(target_dir, f) for f in files]
                        files_full.sort(key=lambda p: os.path.getsize(p), reverse=True)
                        logger.info('yt-dlp produced files: %s', files_full)
                        vids = [p for p in files_full if p.lower().endswith(('.mp4', '.webm', '.mkv'))]
                        imgs = [p for p in files_full if p.lower().endswith(('.jpg', '.jpeg', '.png'))]
                        selected = []
                        if vids:
                            selected.append(vids[0])
                        if imgs and len(selected) < 2:
                            selected.append(imgs[0])
                        if selected:
                            logger.info('Selected media after yt-dlp: %s', selected)
                            return selected
                        return files_full[0:1]
                except Exception:
                    logger.exception('yt-dlp attempt %s failed', attempt+1)

            # If no video found, try extracting direct video URL from page meta tags (og:video)
            logger.info('No video file found after yt-dlp. Attempting to parse page for og:video...')
            try:
                import urllib.request
                resp = urllib.request.urlopen(url, timeout=10)
                html = resp.read().decode('utf-8', errors='ignore')
                m = re.search(r'<meta\s+property="og:video"\s+content="([^"]+)"', html) or re.search(r'<meta\s+property="og:video:secure_url"\s+content="([^"]+)"', html)
                if m:
                    video_url = m.group(1)
                    logger.info('Found og:video URL, downloading direct media: %s', video_url)
                    ydl_opts2 = {
                        'outtmpl': os.path.join(target_dir, '%(title)s.%(ext)s'),
                        'format': 'bestvideo+bestaudio/best',
                        'merge_output_format': 'mp4',
                        'quiet': True,
                        'noplaylist': True,
                    }
                    with yt_dlp.YoutubeDL(ydl_opts2) as ydl2:
                        ydl2.extract_info(video_url, download=True)

                    files2 = [f for f in os.listdir(target_dir) if f.lower().endswith(('.mp4', '.webm', '.mkv'))]
                    if files2:
                        files2_full = [os.path.join(target_dir, f) for f in files2]
                        files2_full.sort(key=lambda p: os.path.getsize(p), reverse=True)
                        logger.info('Downloaded direct og:video file(s): %s', files2_full)
                        vids = [p for p in files2_full if p.lower().endswith(('.mp4', '.webm', '.mkv'))]
                        imgs = [p for p in files2_full if p.lower().endswith(('.jpg', '.jpeg', '.png'))]
                        selected = []
                        if vids:
                            selected.append(vids[0])
                        if imgs and len(selected) < 2:
                            selected.append(imgs[0])
                        if selected:
                            logger.info('Selected media from og:video: %s', selected)
                            return selected
                        return files2_full[0:1]
            except Exception:
                logger.exception('Parsing page for og:video or downloading direct media failed')

            # Log directory contents to aid debugging
            logger.warning('Directory listing for %s after Instagram fallback: %s', target_dir, os.listdir(target_dir))

        except Exception:
            logger.exception('yt-dlp fallback for Instagram failed')

        # CLI fallback: try invoking the `instaloader` binary directly. This can behave
        # slightly differently and may succeed when the Python API didn't.
        try:
            logger.info('Attempting instaloader CLI fallback for shortcode %s into %s', shortcode, target_dir)
            cli_cmd = ['instaloader', '--dirname-pattern', target_dir, '--no-metadata-json', '--no-compress-json', '--no-captions', '--no-profile-pic']
            # if session file and username available, pass --session
            if instaloader_user and session_file and os.path.exists(session_file):
                cli_cmd += ['--session', session_file]
            # Download only the post by shortcode
            cli_cmd += [f'--', f'--post={shortcode}'] if False else [shortcode]
            # Run CLI (capture output)
            try:
                res = subprocess.run(cli_cmd, cwd=target_dir, capture_output=True, text=True, timeout=120)
                logger.info('instaloader CLI stdout: %s', res.stdout)
                logger.info('instaloader CLI stderr: %s', res.stderr)
            except Exception:
                logger.exception('instaloader CLI invocation failed')

            # scan the target_dir for any mp4s produced by the CLI
            files_after = []
            for root, dirs, files in os.walk(target_dir):
                for f in files:
                    if f.lower().endswith('.mp4'):
                        files_after.append(os.path.join(root, f))
            if files_after:
                files_after.sort(key=lambda p: os.path.getsize(p), reverse=True)
                logger.info('instaloader CLI produced mp4(s): %s', files_after)
                return files_after[0]
        except Exception:
            logger.exception('instaloader CLI fallback failed')

        # if no video found, but images exist, bundle up to two images (or return first if zip fails)
        if media:
            imgs = [p for p in media if p.lower().endswith(('.jpg', '.jpeg', '.png'))]
            imgs.sort(key=lambda p: os.path.getsize(p), reverse=True)
            selected = imgs[:2]
            if selected:
                logger.info('Selected image-only media: %s', selected)
                return selected
        raise RuntimeError("No media files downloaded by instaloader or fallback.")
    else:
        # fallback: any media in target_dir; bundle up to two files
        media = [os.path.join(target_dir, f) for f in os.listdir(target_dir) if f.lower().endswith((".mp4", ".jpg", ".jpeg", ".png"))]
        if media:
            media.sort(key=lambda p: os.path.getsize(p), reverse=True)
            selected = media[:2]
            if selected:
                bundle_path = os.path.join(target_dir, f"{shortcode}_bundle.zip")
                try:
                    with zipfile.ZipFile(bundle_path, 'w', compression=zipfile.ZIP_DEFLATED) as zf:
                        for p in selected:
                            zf.write(p, arcname=os.path.basename(p))
                    logger.info('Created fallback bundle zip: %s', bundle_path)
                    return bundle_path
                except Exception:
                    logger.exception('Failed to create fallback bundle zip; returning first media')
                    return selected[0]
        raise RuntimeError("No media files found after instaloader.")

def download_yt(url: str, target_dir: str, media_type: str = "video") -> str:
    outtmpl = os.path.join(target_dir, "%(title)s.%(ext)s")
    if media_type == "audio":
        ydl_opts = {
            "outtmpl": outtmpl,
            "format": "bestaudio/best",
            "postprocessors": [{"key": "FFmpegExtractAudio", "preferredcodec": "mp3", "preferredquality": "192"}],
            "quiet": True,
            "noplaylist": True,
        }
    else:
        ydl_opts = {
            "outtmpl": outtmpl,
            "format": "bestvideo+bestaudio/best",
            "merge_output_format": "mp4",
            "quiet": True,
            "noplaylist": True,
        }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        filepath = ydl.prepare_filename(info)
        if media_type == "audio":
            filepath = os.path.splitext(filepath)[0] + ".mp3"
        return filepath

def download_x(url: str, target_dir: str) -> str:
    # treat like YouTube video
    return download_yt(url, target_dir, media_type="video")

def download_spotify(url: str, target_dir: str, enforce_mp3: bool = True) -> str:
    # Primary attempt: use spotdl CLI
    cmd = ["spotdl", "download", url, "--output", target_dir]
    if enforce_mp3:
        cmd += ["--format", "mp3"]

    result = subprocess.run(cmd, capture_output=True, text=True)
    logger.info("spotdl stdout: %s", result.stdout)
    logger.info("spotdl stderr: %s", result.stderr)

    # If spotdl failed outright, log and fall through to fallback
    if result.returncode == 0:
        audio_files = [f for f in os.listdir(target_dir) if f.lower().endswith((".mp3", ".m4a", ".webm", ".flac"))]
        if audio_files:
            return os.path.join(target_dir, audio_files[0])
        logger.warning("spotdl returned success but no audio files found in %s", target_dir)
    else:
        logger.warning("spotdl failed with returncode %s: %s", result.returncode, result.stderr)

    # Fallback: Try to resolve song metadata from Spotify and search YouTube
    try:
        import json
        import urllib.request

        logger.info("Attempting Spotify -> YouTube fallback for URL: %s", url)
        # Use Spotify oEmbed or simple scraping for title/artist
        oembed_api = f"https://open.spotify.com/oembed?url={urllib.parse.quote(url, safe='') }"
        with urllib.request.urlopen(oembed_api, timeout=10) as r:
            raw = r.read().decode('utf-8')
            meta = json.loads(raw)
        title = meta.get('title') or ''
        # title from oEmbed is usually like "Track Name - Artist"
        query = title or url

        # Use yt-dlp to search YouTube and try multiple candidates/strategies.
        # Search multiple candidates (ytsearch5) and try audio-only and video+audio downloads for each.
        search_query = f"ytsearch5:{query}"
        search_opts = {
            'outtmpl': os.path.join(target_dir, '%(title)s.%(ext)s'),
            'quiet': True,
            'noplaylist': True,
            'ignoreerrors': True,
            'default_search': 'ytsearch',
            'no_warnings': True,
            'socket_timeout': 10,
        }
        try:
            with yt_dlp.YoutubeDL(search_opts) as ydl:
                logger.info('Searching YouTube for query: %s', query)
                info = ydl.extract_info(search_query, download=False)

            entries = info.get('entries') if info and isinstance(info, dict) else None
            if not entries:
                # If single result returned as a video info
                entries = [info] if info else []

            # Limit how many candidates we try
            candidates = entries[:5]
            logger.info('Found %s candidate(s) for query', len(candidates))

            last_exc = None
            for idx, entry in enumerate(candidates):
                if not entry:
                    continue
                video_url = entry.get('webpage_url') or entry.get('url')
                if not video_url and 'id' in entry:
                    video_url = f"https://www.youtube.com/watch?v={entry['id']}"
                if not video_url:
                    continue

                # Try audio-only first, then video+audio extraction
                candidate_formats = [
                    'bestaudio/best',
                    'bestvideo+bestaudio/best',
                ]

                for fmt in candidate_formats:
                    opts = dict(search_opts)
                    opts['format'] = fmt
                    # if video+audio, set merge format
                    if 'bestvideo' in fmt:
                        opts['merge_output_format'] = 'mp4'
                    if enforce_mp3:
                        opts.setdefault('postprocessors', []).append({'key': 'FFmpegExtractAudio', 'preferredcodec': 'mp3', 'preferredquality': '192'})
                    opts['http_headers'] = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

                    try:
                        logger.info('Attempting candidate %s (video %s) with format %s', idx + 1, video_url, fmt)
                        with yt_dlp.YoutubeDL(opts) as ydl2:
                            ydl2.extract_info(video_url, download=True)

                        # After download, scan target_dir for audio files
                        audio_files = [f for f in os.listdir(target_dir) if f.lower().endswith(('.mp3', '.m4a', '.webm', '.flac', '.mp4'))]
                        if audio_files:
                            audio_files_full = [os.path.join(target_dir, f) for f in audio_files]
                            audio_files_full.sort(key=lambda p: os.path.getsize(p), reverse=True)
                            chosen = audio_files_full[0]
                            logger.info('Fallback download succeeded (candidate %s): %s', idx + 1, chosen)
                            return chosen
                        else:
                            logger.warning('Candidate %s with format %s produced no files', idx + 1, fmt)
                    except Exception as e:
                        last_exc = e
                        logger.exception('Candidate %s failed with format %s', idx + 1, fmt)

            if last_exc:
                logger.error('All candidate attempts failed for query %s: %s', query, last_exc)
        except Exception as e:
            logger.exception('Search/extract phase failed for Spotify fallback: %s', e)
    except Exception as fb_err:
        logger.exception('Spotify fallback failed: %s', fb_err)

    # If we reach this point, both spotdl and fallback failed
    raise RuntimeError('spotdl completed but no audio files found.')

# ----------------- Main API -----------------
@app.post("/download")
async def download_endpoint(req: DownloadRequest, x_api_key: str = Header(None)):
    validate_api_key(x_api_key)

    url = req.url.strip()
    platform = (req.platform or "").lower().strip() if req.platform else None
    media_type = (req.media_type or "").lower().strip() if req.media_type else None
    desired_name = req.filename.strip() if req.filename else None

    if not platform:
        try:
            platform = detect_platform(url)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

    task_dir = make_task_dir()
    try:
        if platform == "instagram":
            filepaths = download_instagram(url, task_dir)

        elif platform == "youtube":
            mt = media_type if media_type in ("audio", "video") else "video"
            filepath = download_yt(url, task_dir, media_type=mt)

        elif platform in ("x", "twitter"):
            filepath = download_x(url, task_dir)

        elif platform == "spotify":
            filepath = download_spotify(url, task_dir, enforce_mp3=True)

        else:
            raise HTTPException(status_code=400, detail=f"Unsupported platform: {platform}")

        # If instagram returned multiple file paths, register each and return ordered list
        if platform == "instagram":
            if not isinstance(filepaths, (list, tuple)):
                filepaths = [filepaths]
            # apply desired_name only to the first file (if provided)
            out_entries = []
            for idx, fp in enumerate(filepaths):
                orig_ext = os.path.splitext(fp)[1] or ""
                if idx == 0 and desired_name:
                    safe_name = sanitize_filename(desired_name)
                    newpath = os.path.join(os.path.dirname(fp), safe_name + orig_ext)
                    if os.path.exists(newpath):
                        newpath = os.path.join(os.path.dirname(fp), f"{safe_name}_{str(uuid.uuid4())[:8]}{orig_ext}")
                    os.rename(fp, newpath)
                    fp = newpath

                file_id = register_file(fp)
                out_entries.append({
                    "file_id": file_id,
                    "download_url": f"/files/{file_id}",
                    "filename": os.path.basename(fp)
                })

            return JSONResponse(status_code=200, content={
                "status": "ok",
                "files": out_entries
            })

        # non-instagram (single file) flow continues below
        filepath = filepaths if not isinstance(filepaths, (list, tuple)) else filepaths[0]

        # If desired filename provided, rename file to that name (preserve extension)
        if desired_name:
            safe_name = sanitize_filename(desired_name)
            ext = os.path.splitext(filepath)[1] or ""
            newpath = os.path.join(os.path.dirname(filepath), safe_name + ext)
            # if target exists, append uuid short
            if os.path.exists(newpath):
                newpath = os.path.join(os.path.dirname(filepath), f"{safe_name}_{str(uuid.uuid4())[:8]}{ext}")
            os.rename(filepath, newpath)
            filepath = newpath

        # Register and return download info for single file
        file_id = register_file(filepath)
        download_url = f"/files/{file_id}"
        return JSONResponse(status_code=200, content={
            "status": "ok",
            "file_id": file_id,
            "download_url": download_url,
            "filename": os.path.basename(filepath)
        })
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Download failed")
        try:
            shutil.rmtree(task_dir, ignore_errors=True)
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/files/{file_id}")
async def serve_file(file_id: str, x_api_key: str = Header(None), background: BackgroundTasks = None):
    validate_api_key(x_api_key)
    path = file_path_by_id(file_id)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="File not found")
    # Determine appropriate media_type header for browser
    ext = os.path.splitext(path)[1].lower()
    media_type = "application/octet-stream"
    if ext in (".mp3",):
        media_type = "audio/mpeg"
    elif ext in (".mp4", ".mov", ".mkv"):
        media_type = "video/mp4"
    elif ext in (".jpg", ".jpeg"):
        media_type = "image/jpeg"
    elif ext in (".png",):
        media_type = "image/png"
    # schedule deletion and remove registry entry after response
    if background is not None:
        schedule_remove(background, path, file_id=file_id)
    return FileResponse(path, media_type=media_type, filename=os.path.basename(path))

@app.get("/download")
async def download_get(url: str, media_type: Optional[str] = None, x_api_key: str = Header(None), background: BackgroundTasks = None):
    """Accept simple GET requests like /download?url=... with x-api-key header.
    This mirrors the POST /download behavior but returns the file directly.
    """
    validate_api_key(x_api_key)

    try:
        # basic platform detection
        platform = None
        try:
            platform = detect_platform(url)
        except ValueError:
            raise HTTPException(status_code=400, detail="Unsupported or invalid URL")

        task_dir = make_task_dir()
        if platform == "instagram":
            filepaths = download_instagram(url, task_dir)
            if not isinstance(filepaths, (list, tuple)):
                filepaths = [filepaths]
            out_entries = []
            for fp in filepaths:
                fid = register_file(fp)
                out_entries.append({"file_id": fid, "download_url": f"/files/{fid}", "filename": os.path.basename(fp)})
            return JSONResponse(status_code=200, content={"status": "ok", "files": out_entries})
        elif platform == "youtube":
            mt = media_type if media_type in ("audio", "video") else "video"
            filepath = download_yt(url, task_dir, media_type=mt)
        elif platform in ("x", "twitter"):
            filepath = download_x(url, task_dir)
        elif platform == "spotify":
            filepath = download_spotify(url, task_dir, enforce_mp3=True)
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported platform: {platform}")

        # Schedule deletion of the file and its parent dir after sending
        if background is not None:
            schedule_remove(background, filepath)
        return FileResponse(filepath, filename=os.path.basename(filepath))
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("GET download failed")
        try:
            shutil.rmtree(task_dir, ignore_errors=True)
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=str(e))


@app.get('/diag/instaloader')
async def diag_instaloader():
    session_file = os.environ.get('INSTALOADER_SESSION_FILE')
    username = os.environ.get('INSTALOADER_USERNAME')
    result = {'session_file': session_file, 'session_exists': False, 'loaded': False, 'cookies': []}
    try:
        if session_file and os.path.exists(session_file):
            result['session_exists'] = True
            try:
                L = instaloader.Instaloader()
                try:
                    with open(session_file, 'rb') as sf:
                        L.context.load_session_from_file(username, sf)
                    result['loaded'] = True
                except TypeError:
                    try:
                        L.load_session_from_file(username, session_file)
                        result['loaded'] = True
                    except Exception:
                        result['loaded'] = False
                # attempt to list cookie names
                cj = None
                if hasattr(L.context, 'cookie_jar'):
                    cj = L.context.cookie_jar
                elif hasattr(L.context, '_session'):
                    cj = getattr(L.context, '_session')
                if cj:
                    try:
                        for c in cj:
                            result['cookies'].append(getattr(c, 'name', str(c)))
                    except Exception:
                        try:
                            result['cookies'] = list(cj.keys())
                        except Exception:
                            result['cookies'] = []
            except Exception:
                logger.exception('Diag load failed')
    except Exception:
        logger.exception('Diag endpoint failure')
    return result
