# ◈ VIBE — YouTube Music Player (React JS)

A sleek, full-featured web music player powered by YouTube Data API v3.

## ✨ Features
- 🔥 Trending music discovery
- 🔍 Real-time YouTube search (with auto-trigger)
- ▶ Background-compatible playback via YouTube IFrame API
- 📋 Queue management + shuffle + repeat
- ♥ Like songs & persist library
- 🎵 Create & manage playlists
- 🕐 Recently played history
- 💾 Everything saved in localStorage (no backend needed)
- 📱 Responsive — works on desktop & mobile browsers

---

## 🔑 How to Get Your FREE YouTube API Key

> **The YouTube Data API v3 is completely free.** You get **10,000 units/day** at no cost.
> A search costs 100 units, so that's ~100 searches/day per project. Multiple projects = more quota.

### Step-by-Step (takes ~5 minutes):

**Step 1 — Go to Google Cloud Console**
→ https://console.cloud.google.com
(Sign in with any Google account — Gmail works fine)

**Step 2 — Create a Project**
- Click the project dropdown at the top → "New Project"
- Name it anything (e.g., "MyMusicApp") → Click **Create**

**Step 3 — Enable YouTube Data API v3**
- In the left menu → "APIs & Services" → "Library"
- Search for **"YouTube Data API v3"**
- Click it → Click **"Enable"**

**Step 4 — Create an API Key**
- In the left menu → "APIs & Services" → **"Credentials"**
- Click **"+ Create Credentials"** → **"API Key"**
- Your key will appear (starts with `AIza...`)
- Copy it!

**Step 5 (Optional but recommended) — Restrict the key**
- Click "Edit API key"
- Under "API restrictions" → select "YouTube Data API v3"
- Under "Application restrictions" → select "HTTP referrers"
- Add `localhost:3000/*` for development
- Click **Save**

**Step 6 — Paste it into the app**
When you first open the app, a setup screen will appear. Paste your key there.
It's saved in your browser's localStorage — never sent anywhere else.

---

## 🚀 Running the App

### Option A — Local Development (recommended)
```bash
# 1. Clone or download this project
# 2. Install dependencies
npm install

# 3. Start the development server
npm start

# 4. Open http://localhost:3000 in your browser
# 5. Enter your API key when prompted
```

### Option B — Quick Static Deploy

You can also deploy to **Netlify**, **Vercel**, or **GitHub Pages** for free:

```bash
# Build for production
npm run build

# The /build folder contains the deployable static site
```

**Deploy to Netlify (30 seconds):**
1. Run `npm run build`
2. Go to https://app.netlify.com/drop
3. Drag and drop the `build` folder
4. Done — your app is live!

---

## 📁 Project Structure

```
vibe-music-player/
├── public/
│   └── index.html          # HTML entry point
├── src/
│   ├── App.jsx             # Main app (all screens + player logic)
│   ├── App.css             # All styles (dark cinematic theme)
│   └── index.js            # React root
└── package.json
```

The entire app is in just **2 files** (App.jsx + App.css) for simplicity.

---

## 🎛 How It Works

### Architecture
- **React 18** with hooks (useState, useEffect, useRef, useCallback)
- **react-youtube** — official YouTube IFrame API wrapper for React
- **YouTube Data API v3** — search and metadata (video titles, thumbnails, duration, view counts)
- **localStorage** — persist playlists, liked songs, recently played, and API key
- **No backend required** — fully client-side

### Playback
YouTube's IFrame Player API is used to play audio/video. The player is rendered invisibly (1×1px, off-screen). This uses YouTube's official embed, which is fully compliant with YouTube's Terms of Service.

### API Quota
| Action | Units Used |
|--------|-----------|
| Search (per query) | 100 |
| Trending (per load) | 1 |
| Video details (per batch) | 1 |
| Daily free quota | **10,000** |

Tips to save quota:
- Results are shown as you type (debounced 700ms)
- Trending loads once and is cached during the session
- Use the "Quick Searches" chips to reuse common queries

---

## 🔧 Customization

### Change the accent color
In `App.css`, edit the CSS variable:
```css
--accent: #e8174a;   /* Hot red/pink — change to any color */
```

### Add more quick search chips
In `App.jsx`, edit the `QUICK` array:
```js
const QUICK = ["Top hits 2024", "Lo-fi chill", "Your custom search", ...];
```

### Change region for trending
In `App.jsx`, find `apiTrending()` and change `regionCode`:
```js
regionCode=US   // Change to: GB, IN, JP, DE, etc.
```

---

## ❓ FAQ

**Q: Is this legal?**
Yes. The app uses YouTube's official IFrame embed (same as embedding YouTube on any website) and the official YouTube Data API v3. Both are fully compliant with YouTube's Terms of Service.

**Q: Why can't I play in the background on mobile?**
Browser limitation — mobile browsers pause JavaScript when in the background. For true background playback on mobile, use the React Native version of this app.

**Q: I'm getting "quotaExceeded" errors**
You've used your 10,000 units for the day. Wait until midnight Pacific Time for the quota to reset. Or create a second Google Cloud project with a new API key.

**Q: Can I add more quota?**
Yes — create multiple Google Cloud projects, each with its own free 10,000 unit/day quota. Or apply for a quota increase in the Google Cloud Console (free, just requires justification).

**Q: Is my API key safe?**
Your key is stored in localStorage and only used for direct calls from your browser to the YouTube API. It's never sent to any third-party server. Restrict the key to your domain in Google Cloud Console for extra security.
