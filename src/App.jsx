import { useState, useEffect, useRef } from "react";
import YouTube from "react-youtube";
import "./App.css";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const BASE = "https://www.googleapis.com/youtube/v3";

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function parseDuration(iso = "") {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (+(m[1] || 0)) * 3600 + (+(m[2] || 0)) * 60 + +(m[3] || 0);
}
function fmtTime(s) {
  s = Math.floor(s || 0);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}
function fmtViews(n) {
  if (!n) return "";
  const num = parseInt(n);
  if (num >= 1e9) return (num / 1e9).toFixed(1) + "B views";
  if (num >= 1e6) return (num / 1e6).toFixed(1) + "M views";
  if (num >= 1e3) return (num / 1e3).toFixed(1) + "K views";
  return num + " views";
}

// ─── API CALLS ───────────────────────────────────────────────────────────────
async function apiSearch(query, maxResults = 20) {
  const key = localStorage.getItem("yt_api_key");
  if (!key) throw new Error("NO_KEY");
  const sr = await fetch(
    `${BASE}/search?key=${key}&q=${encodeURIComponent(query)}&part=snippet&type=video&videoCategoryId=10&maxResults=${maxResults}`
  ).then((r) => r.json());
  if (sr.error) throw new Error(sr.error.message);
  const ids = sr.items.map((i) => i.id.videoId).join(",");
  const dr = await fetch(
    `${BASE}/videos?key=${key}&id=${ids}&part=contentDetails,statistics`
  ).then((r) => r.json());
  const dm = {};
  (dr.items || []).forEach((i) => (dm[i.id] = i));
  return sr.items.map((item) => {
    const d = dm[item.id.videoId] || {};
    const dur = parseDuration(d.contentDetails?.duration);
    return {
      id: item.id.videoId,
      title: item.snippet.title,
      channel: item.snippet.channelTitle,
      thumb: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
      duration: dur,
      durationFmt: fmtTime(dur),
      views: fmtViews(d.statistics?.viewCount),
    };
  });
}

async function apiTrending(maxResults = 24) {
  const key = localStorage.getItem("yt_api_key");
  if (!key) throw new Error("NO_KEY");
  const r = await fetch(
    `${BASE}/videos?key=${key}&part=snippet,contentDetails,statistics&chart=mostPopular&videoCategoryId=10&maxResults=${maxResults}&regionCode=US`
  ).then((r) => r.json());
  if (r.error) throw new Error(r.error.message);
  return r.items.map((item) => {
    const dur = parseDuration(item.contentDetails?.duration);
    return {
      id: item.id,
      title: item.snippet.title,
      channel: item.snippet.channelTitle,
      thumb: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
      duration: dur,
      durationFmt: fmtTime(dur),
      views: fmtViews(item.statistics?.viewCount),
    };
  });
}

// ─── LOCAL STORAGE HELPERS ───────────────────────────────────────────────────
const LS = {
  get: (k, def) => { try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch { return def; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

// ─── QUICK SEARCHES ──────────────────────────────────────────────────────────
const QUICK = ["Top hits 2024","Lo-fi chill","Workout beats","Pop classics","Hip hop bangers","Acoustic covers","Electronic dance","Jazz & soul","Indie rock","Classical focus"];

// ─── MAIN APP ────────────────────────────────────────────────────────────────
export default function App() {
  // API Key gate
  const [apiKey, setApiKey] = useState(localStorage.getItem("yt_api_key") || "");
  const [keyInput, setKeyInput] = useState("");
  const [keyError, setKeyError] = useState("");

  // View: "home" | "search" | "library" | "playlist"
  const [view, setView] = useState("home");
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);

  // Player state
  const [current, setCurrent] = useState(null);
  const [queue, setQueue] = useState([]);
  const [queueIdx, setQueueIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const [muted, setMuted] = useState(false);
  const [repeat, setRepeat] = useState("off"); // off | all | one
  const [shuffle, setShuffle] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [showQueue, setShowQueue] = useState(false);

  // Library
  const [playlists, setPlaylists] = useState(() => LS.get("playlists", []));
  const [liked, setLiked] = useState(() => LS.get("liked", []));
  const [recent, setRecent] = useState(() => LS.get("recent", []));

  // Search
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  // Home
  const [trending, setTrending] = useState([]);
  const [trendingLoading, setTrendingLoading] = useState(false);

  // Modals
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [newPLName, setNewPLName] = useState("");
  const [showAddTo, setShowAddTo] = useState(null); // video to add
  const [showApiSetup, setShowApiSetup] = useState(!apiKey);

  const ytRef = useRef(null);
  const progressInterval = useRef(null);

  // ── Persist library ─────────────────────────────────────────────────────
  useEffect(() => { LS.set("playlists", playlists); }, [playlists]);
  useEffect(() => { LS.set("liked", liked); }, [liked]);
  useEffect(() => { LS.set("recent", recent); }, [recent]);

  // ── Load trending on home ────────────────────────────────────────────────
  useEffect(() => {
    if (view === "home" && apiKey && trending.length === 0) {
      setTrendingLoading(true);
      apiTrending().then(setTrending).catch(() => {}).finally(() => setTrendingLoading(false));
    }
  }, [view, apiKey, trending.length]);

  // ── Progress ticker ──────────────────────────────────────────────────────
  useEffect(() => {
    clearInterval(progressInterval.current);
    if (playing) {
      progressInterval.current = setInterval(() => {
        const p = ytRef.current?.getCurrentTime?.() || 0;
        const d = ytRef.current?.getDuration?.() || 0;
        setProgress(p);
        setDuration(d);
      }, 500);
    }
    return () => clearInterval(progressInterval.current);
  }, [playing]);

  // ── Player controls ──────────────────────────────────────────────────────
  function playVideo(video, playlist = null, idx = 0) {
    if (playlist) {
      setQueue(playlist);
      setQueueIdx(idx);
    } else {
      setQueue([video]);
      setQueueIdx(0);
    }
    setCurrent(video);
    setPlaying(true);
    setShowPlayer(true);
    setRecent((r) => [video, ...r.filter((v) => v.id !== video.id)].slice(0, 50));
  }

  function togglePlay() { setPlaying((p) => !p); }
  function skipNext() {
    if (queue.length < 2) return;
    let next;
    if (shuffle) {
      next = Math.floor(Math.random() * queue.length);
    } else {
      next = (queueIdx + 1) % queue.length;
    }
    setQueueIdx(next);
    setCurrent(queue[next]);
    setPlaying(true);
  }
  function skipPrev() {
    if (progress > 3) { ytRef.current?.seekTo(0); return; }
    const prev = (queueIdx - 1 + queue.length) % queue.length;
    setQueueIdx(prev);
    setCurrent(queue[prev]);
    setPlaying(true);
  }
  function onEnd() {
    if (repeat === "one") { ytRef.current?.seekTo(0); ytRef.current?.playVideo(); return; }
    if (repeat === "all" || queueIdx < queue.length - 1) skipNext();
    else setPlaying(false);
  }
  function seekTo(pct) {
    const t = (pct / 100) * duration;
    ytRef.current?.seekTo(t);
    setProgress(t);
  }
  function onVolumeChange(v) {
    setVolume(v);
    ytRef.current?.setVolume(v);
  }

  // ── Library ──────────────────────────────────────────────────────────────
  const isLiked = (id) => liked.some((v) => v.id === id);
  function toggleLike(video) {
    setLiked((l) => isLiked(video.id) ? l.filter((v) => v.id !== video.id) : [video, ...l]);
  }
  function createPlaylist(name) {
    if (!name.trim()) return;
    setPlaylists((p) => [...p, { id: `pl_${Date.now()}`, name, videos: [], cover: null }]);
    setNewPLName("");
    setShowCreatePlaylist(false);
  }
  function deletePlaylist(id) {
    setPlaylists((p) => p.filter((pl) => pl.id !== id));
  }
  function addToPlaylist(plId, video) {
    setPlaylists((p) => p.map((pl) =>
      pl.id === plId
        ? { ...pl, videos: pl.videos.some((v) => v.id === video.id) ? pl.videos : [...pl.videos, video], cover: pl.cover || video.thumb }
        : pl
    ));
    setShowAddTo(null);
  }
  function removeFromPlaylist(plId, vidId) {
    setPlaylists((p) => p.map((pl) =>
      pl.id === plId ? { ...pl, videos: pl.videos.filter((v) => v.id !== vidId) } : pl
    ));
  }

  // ── Search ───────────────────────────────────────────────────────────────
  const searchTimeout = useRef();
  function handleSearchInput(val) {
    setSearchQ(val);
    clearTimeout(searchTimeout.current);
    if (val.length > 2) {
      searchTimeout.current = setTimeout(() => doSearch(val), 700);
    }
  }
  async function doSearch(q) {
    if (!q.trim()) return;
    setSearching(true);
    setSearchError("");
    try {
      const r = await apiSearch(q);
      setSearchResults(r);
    } catch (e) {
      setSearchError(e.message === "NO_KEY" ? "Please set your API key first." : "Search failed: " + e.message);
    }
    setSearching(false);
  }

  // ── API Key setup ────────────────────────────────────────────────────────
  function saveKey() {
    if (!keyInput.trim()) { setKeyError("Please enter a key"); return; }
    localStorage.setItem("yt_api_key", keyInput.trim());
    setApiKey(keyInput.trim());
    setShowApiSetup(false);
    setKeyError("");
  }

  const progressPct = duration > 0 ? (progress / duration) * 100 : 0;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="app">
      {/* Hidden YouTube player */}
      {current && (
        <div className="yt-hidden">
          <YouTube
            videoId={current.id}
            onReady={(e) => {
              ytRef.current = e.target;
              e.target.setVolume(volume);
              if (playing) e.target.playVideo();
            }}
            onStateChange={(e) => {
              if (e.data === 1) setPlaying(true);
              if (e.data === 2) setPlaying(false);
              if (e.data === 0) onEnd();
            }}
            opts={{ height: "1", width: "1", playerVars: { autoplay: 1, controls: 0 } }}
          />
        </div>
      )}

      {/* API Key setup modal */}
      {showApiSetup && (
        <div className="modal-overlay" onClick={() => apiKey && setShowApiSetup(false)}>
          <div className="api-modal" onClick={(e) => e.stopPropagation()}>
            <div className="api-modal-icon">🔑</div>
            <h2>YouTube API Key Required</h2>
            <p>This app uses the <strong>YouTube Data API v3</strong> (free). You need your own API key to search and discover music.</p>
            <div className="api-steps">
              <div className="api-step"><span>1</span><span>Go to <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer">console.cloud.google.com</a></span></div>
              <div className="api-step"><span>2</span><span>Create a project → Enable <strong>YouTube Data API v3</strong></span></div>
              <div className="api-step"><span>3</span><span>Go to Credentials → Create <strong>API Key</strong></span></div>
              <div className="api-step"><span>4</span><span>Paste it below — it's <strong>free</strong> (10,000 units/day)</span></div>
            </div>
            <input
              className="api-input"
              type="text"
              placeholder="AIza..."
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveKey()}
              autoFocus
            />
            {keyError && <p className="api-error">{keyError}</p>}
            <button className="api-save-btn" onClick={saveKey}>Save & Continue →</button>
            <p className="api-note">Your key is stored only in your browser's localStorage.</p>
          </div>
        </div>
      )}

      {/* Add to playlist modal */}
      {showAddTo && (
        <div className="modal-overlay" onClick={() => setShowAddTo(null)}>
          <div className="addto-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Add to Playlist</h3>
            <p className="addto-title">{showAddTo.title}</p>
            {playlists.length === 0 ? (
              <div className="addto-empty">
                <p>No playlists yet.</p>
                <button onClick={() => { setShowAddTo(null); setShowCreatePlaylist(true); }}>Create one</button>
              </div>
            ) : (
              <div className="addto-list">
                {playlists.map((pl) => (
                  <button key={pl.id} className="addto-item" onClick={() => addToPlaylist(pl.id, showAddTo)}>
                    <span className="addto-pl-icon">♪</span>
                    <span>{pl.name}</span>
                    <span className="addto-count">{pl.videos.length}</span>
                  </button>
                ))}
              </div>
            )}
            <button className="addto-cancel" onClick={() => setShowAddTo(null)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Create playlist modal */}
      {showCreatePlaylist && (
        <div className="modal-overlay" onClick={() => setShowCreatePlaylist(false)}>
          <div className="create-pl-modal" onClick={(e) => e.stopPropagation()}>
            <h3>New Playlist</h3>
            <input
              autoFocus
              placeholder="Playlist name..."
              value={newPLName}
              onChange={(e) => setNewPLName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createPlaylist(newPLName)}
            />
            <div className="create-pl-btns">
              <button className="cancel" onClick={() => setShowCreatePlaylist(false)}>Cancel</button>
              <button className="create" onClick={() => createPlaylist(newPLName)}>Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-icon">◈</span>
          <span className="logo-text">VIBE</span>
        </div>
        <nav className="sidebar-nav">
          {[
            { id: "home", icon: "⌂", label: "Discover" },
            { id: "search", icon: "⌕", label: "Search" },
            { id: "library", icon: "▤", label: "Library" },
          ].map((item) => (
            <button
              key={item.id}
              className={`nav-item ${view === item.id || (view === "playlist" && item.id === "library") ? "active" : ""}`}
              onClick={() => setView(item.id)}>
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-playlists">
          <div className="sidebar-pl-header">
            <span>PLAYLISTS</span>
            <button className="sidebar-pl-add" onClick={() => setShowCreatePlaylist(true)}>+</button>
          </div>
          {playlists.map((pl) => (
            <button
              key={pl.id}
              className={`sidebar-pl-item ${selectedPlaylist?.id === pl.id && view === "playlist" ? "active" : ""}`}
              onClick={() => { setSelectedPlaylist(pl); setView("playlist"); }}>
              ♪ {pl.name}
            </button>
          ))}
          {liked.length > 0 && (
            <button
              className={`sidebar-pl-item ${view === "liked" ? "active" : ""}`}
              onClick={() => setView("liked")}>
              ♥ Liked Songs
            </button>
          )}
        </div>

        <button className="sidebar-key-btn" onClick={() => setShowApiSetup(true)} title="API Key Settings">
          🔑 API Key
        </button>
      </aside>

      {/* Main content */}
      <main className="main">
        {/* ── HOME ───────────────────────────────────────────────────────── */}
        {view === "home" && (
          <div className="view home-view">
            <div className="view-header">
              <h1>Discover <span className="accent">Music</span></h1>
              <button className="header-search-btn" onClick={() => setView("search")}>⌕ Search</button>
            </div>

            {trendingLoading && (
              <div className="loading-state">
                <div className="spinner" />
                <p>Loading trending music...</p>
              </div>
            )}

            {!apiKey && !trendingLoading && (
              <div className="no-key-banner">
                <span>🔑</span>
                <span>Set your API key to see trending music</span>
                <button onClick={() => setShowApiSetup(true)}>Setup →</button>
              </div>
            )}

            {trending.length > 0 && (
              <>
                {/* Featured row */}
                <section className="section">
                  <h2 className="section-title">🔥 Trending Now</h2>
                  <div className="featured-grid">
                    {trending.slice(0, 4).map((v, i) => (
                      <div key={v.id} className={`featured-card ${i === 0 ? "featured-card-large" : ""}`}
                        onClick={() => playVideo(v, trending, i)}>
                        <img src={v.thumb} alt={v.title} loading="lazy" />
                        <div className="featured-overlay" />
                        <div className="featured-info">
                          <p className="featured-title">{v.title}</p>
                          <p className="featured-channel">{v.channel}</p>
                        </div>
                        <div className="featured-play">▶</div>
                        {v.views && <span className="featured-views">{v.views}</span>}
                      </div>
                    ))}
                  </div>
                </section>

                {/* Recently played */}
                {recent.length > 0 && (
                  <section className="section">
                    <h2 className="section-title">🕐 Recently Played</h2>
                    <div className="recent-row">
                      {recent.slice(0, 8).map((v) => (
                        <div key={v.id} className="recent-card" onClick={() => playVideo(v)}>
                          <img src={v.thumb} alt="" />
                          <p>{v.title}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Top Charts */}
                <section className="section">
                  <h2 className="section-title">📈 Top Charts</h2>
                  <div className="track-list">
                    {trending.slice(4).map((v, i) => (
                      <TrackRow
                        key={v.id}
                        video={v}
                        index={i + 5}
                        isActive={current?.id === v.id}
                        isPlaying={current?.id === v.id && playing}
                        onPlay={() => playVideo(v, trending, i + 4)}
                        onLike={() => toggleLike(v)}
                        liked={isLiked(v.id)}
                        onAdd={() => setShowAddTo(v)}
                      />
                    ))}
                  </div>
                </section>
              </>
            )}
          </div>
        )}

        {/* ── SEARCH ─────────────────────────────────────────────────────── */}
        {view === "search" && (
          <div className="view search-view">
            <div className="search-bar-wrap">
              <span className="search-icon">⌕</span>
              <input
                className="search-input"
                placeholder="Search songs, artists, albums..."
                value={searchQ}
                onChange={(e) => handleSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && doSearch(searchQ)}
                autoFocus
              />
              {searchQ && <button className="search-clear" onClick={() => { setSearchQ(""); setSearchResults([]); }}>✕</button>}
            </div>

            {!searchQ && (
              <div className="quick-searches">
                <h3>Quick Searches</h3>
                <div className="quick-chips">
                  {QUICK.map((q) => (
                    <button key={q} onClick={() => { setSearchQ(q); doSearch(q); }}>{q}</button>
                  ))}
                </div>
              </div>
            )}

            {searching && <div className="loading-state"><div className="spinner" /><p>Searching...</p></div>}
            {searchError && <div className="error-msg">{searchError}</div>}

            {searchResults.length > 0 && (
              <div className="track-list">
                <p className="results-count">{searchResults.length} results for "{searchQ}"</p>
                {searchResults.map((v, i) => (
                  <TrackRow
                    key={v.id}
                    video={v}
                    index={i + 1}
                    isActive={current?.id === v.id}
                    isPlaying={current?.id === v.id && playing}
                    onPlay={() => playVideo(v, searchResults, i)}
                    onLike={() => toggleLike(v)}
                    liked={isLiked(v.id)}
                    onAdd={() => setShowAddTo(v)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── LIBRARY ────────────────────────────────────────────────────── */}
        {view === "library" && (
          <div className="view library-view">
            <div className="view-header">
              <h1>My <span className="accent">Library</span></h1>
              <button className="create-pl-btn" onClick={() => setShowCreatePlaylist(true)}>+ New Playlist</button>
            </div>

            <section className="section">
              <h2 className="section-title">Playlists</h2>
              {playlists.length === 0 ? (
                <div className="empty-state">
                  <span>🎵</span>
                  <p>No playlists yet</p>
                  <button onClick={() => setShowCreatePlaylist(true)}>Create Playlist</button>
                </div>
              ) : (
                <div className="pl-grid">
                  {playlists.map((pl) => (
                    <div key={pl.id} className="pl-card"
                      onClick={() => { setSelectedPlaylist(pl); setView("playlist"); }}>
                      <div className="pl-art">
                        {pl.cover ? <img src={pl.cover} alt="" /> : <span>♪</span>}
                      </div>
                      <p className="pl-name">{pl.name}</p>
                      <p className="pl-count">{pl.videos.length} songs</p>
                      <button className="pl-delete" onClick={(e) => { e.stopPropagation(); deletePlaylist(pl.id); }}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {liked.length > 0 && (
              <section className="section">
                <h2 className="section-title">♥ Liked Songs ({liked.length})</h2>
                <button className="play-all-btn" onClick={() => liked[0] && playVideo(liked[0], liked, 0)}>▶ Play All</button>
                <div className="track-list">
                  {liked.map((v, i) => (
                    <TrackRow
                      key={v.id}
                      video={v}
                      index={i + 1}
                      isActive={current?.id === v.id}
                      isPlaying={current?.id === v.id && playing}
                      onPlay={() => playVideo(v, liked, i)}
                      onLike={() => toggleLike(v)}
                      liked={isLiked(v.id)}
                      onAdd={() => setShowAddTo(v)}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* ── PLAYLIST DETAIL ─────────────────────────────────────────────── */}
        {view === "playlist" && selectedPlaylist && (
          <PlaylistView
            playlist={playlists.find((p) => p.id === selectedPlaylist.id) || selectedPlaylist}
            current={current}
            playing={playing}
            onPlay={playVideo}
            onLike={toggleLike}
            isLiked={isLiked}
            onAdd={setShowAddTo}
            onRemove={removeFromPlaylist}
            onBack={() => setView("library")}
          />
        )}

        {/* ── LIKED VIEW ──────────────────────────────────────────────────── */}
        {view === "liked" && (
          <div className="view">
            <div className="view-header">
              <button className="back-btn" onClick={() => setView("library")}>←</button>
              <h1>♥ Liked <span className="accent">Songs</span></h1>
            </div>
            {liked.length === 0 ? (
              <div className="empty-state"><span>♡</span><p>No liked songs yet</p></div>
            ) : (
              <>
                <button className="play-all-btn" onClick={() => playVideo(liked[0], liked, 0)}>▶ Play All ({liked.length})</button>
                <div className="track-list">
                  {liked.map((v, i) => (
                    <TrackRow
                      key={v.id} video={v} index={i + 1}
                      isActive={current?.id === v.id} isPlaying={current?.id === v.id && playing}
                      onPlay={() => playVideo(v, liked, i)}
                      onLike={() => toggleLike(v)} liked={isLiked(v.id)}
                      onAdd={() => setShowAddTo(v)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* ── PLAYER BAR ───────────────────────────────────────────────────── */}
      {current && (
        <div className={`player-bar ${showPlayer ? "expanded" : ""}`}>
          {/* Queue panel */}
          {showQueue && (
            <div className="queue-panel">
              <div className="queue-header">
                <span>Up Next ({queue.length})</span>
                <button onClick={() => setShowQueue(false)}>✕</button>
              </div>
              <div className="queue-list">
                {queue.map((v, i) => (
                  <div
                    key={`${v.id}-${i}`}
                    className={`queue-item ${i === queueIdx ? "active" : ""}`}
                    onClick={() => { setCurrent(v); setQueueIdx(i); setPlaying(true); }}>
                    <img src={v.thumb} alt="" />
                    <div>
                      <p>{v.title}</p>
                      <p>{v.channel}</p>
                    </div>
                    {i === queueIdx && <span className="queue-playing">▶</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mini player (always visible) */}
          <div className="mini-player">
            {/* Progress bar at top */}
            <div className="mini-progress" onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              seekTo(((e.clientX - rect.left) / rect.width) * 100);
            }}>
              <div className="mini-progress-fill" style={{ width: `${progressPct}%` }} />
            </div>

            <div className="mini-inner">
              <div className="mini-info" onClick={() => setShowPlayer(!showPlayer)}>
                <img src={current.thumb} alt="" className="mini-thumb" />
                <div>
                  <p className="mini-title">{current.title}</p>
                  <p className="mini-channel">{current.channel}</p>
                </div>
              </div>

              <div className="mini-controls">
                <button className={`ctrl-btn ${shuffle ? "active" : ""}`} onClick={() => setShuffle(!shuffle)}>⇄</button>
                <button className="ctrl-btn skip" onClick={skipPrev}>⏮</button>
                <button className="ctrl-btn play" onClick={togglePlay}>{playing ? "⏸" : "▶"}</button>
                <button className="ctrl-btn skip" onClick={skipNext}>⏭</button>
                <button className={`ctrl-btn ${repeat !== "off" ? "active" : ""}`}
                  onClick={() => setRepeat(r => r === "off" ? "all" : r === "all" ? "one" : "off")}>
                  {repeat === "one" ? "🔂" : "🔁"}
                </button>
              </div>

              <div className="mini-extra">
                <span className="mini-time">{fmtTime(progress)} / {fmtTime(duration)}</span>
                <button className={`ctrl-btn sm ${isLiked(current.id) ? "liked" : ""}`} onClick={() => toggleLike(current)}>
                  {isLiked(current.id) ? "♥" : "♡"}
                </button>
                <button className="ctrl-btn sm" onClick={() => setShowAddTo(current)}>+</button>
                <button className={`ctrl-btn sm ${showQueue ? "active" : ""}`} onClick={() => setShowQueue(!showQueue)}>≡</button>
                <button className="ctrl-btn sm" onClick={() => setMuted(!muted)}>
                  {muted ? "🔇" : volume > 50 ? "🔊" : "🔉"}
                </button>
                <input type="range" min="0" max="100" value={muted ? 0 : volume}
                  onChange={(e) => { setMuted(false); onVolumeChange(+e.target.value); }}
                  className="vol-slider" />
              </div>
            </div>

            {/* Full progress (desktop) */}
            <div className="full-progress">
              <span>{fmtTime(progress)}</span>
              <input type="range" min="0" max="100" value={progressPct}
                onChange={(e) => seekTo(+e.target.value)}
                className="progress-slider" />
              <span>{fmtTime(duration)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TRACK ROW ───────────────────────────────────────────────────────────────
function TrackRow({ video, index, isActive, isPlaying, onPlay, onLike, liked, onAdd }) {
  return (
    <div className={`track-row ${isActive ? "active" : ""}`} onDoubleClick={onPlay}>
      <span className="track-num">{isActive ? (isPlaying ? "▶" : "❙❙") : index}</span>
      <img className="track-thumb" src={video.thumb} alt="" loading="lazy" />
      <div className="track-info">
        <p className="track-title">{video.title}</p>
        <p className="track-channel">{video.channel} {video.views && <span>· {video.views}</span>}</p>
      </div>
      <span className="track-dur">{video.durationFmt}</span>
      <div className="track-actions">
        <button className={`track-btn ${liked ? "liked" : ""}`} onClick={(e) => { e.stopPropagation(); onLike(); }}>{liked ? "♥" : "♡"}</button>
        <button className="track-btn" onClick={(e) => { e.stopPropagation(); onAdd(); }}>+</button>
        <button className="track-btn play-btn" onClick={(e) => { e.stopPropagation(); onPlay(); }}>▶</button>
      </div>
    </div>
  );
}

// ─── PLAYLIST VIEW ───────────────────────────────────────────────────────────
function PlaylistView({ playlist, current, playing, onPlay, onLike, isLiked, onAdd, onRemove, onBack }) {
  const totalSecs = playlist.videos.reduce((a, v) => a + (v.duration || 0), 0);
  return (
    <div className="view playlist-view">
      <button className="back-btn" onClick={onBack}>← Library</button>
      <div className="playlist-header">
        <div className="playlist-art-big">
          {playlist.cover ? <img src={playlist.cover} alt="" /> : <span>♪</span>}
        </div>
        <div className="playlist-meta">
          <p className="playlist-label">PLAYLIST</p>
          <h1>{playlist.name}</h1>
          <p className="playlist-stats">{playlist.videos.length} songs · {fmtTime(totalSecs)}</p>
          {playlist.videos.length > 0 && (
            <div className="playlist-actions">
              <button className="play-all-btn" onClick={() => onPlay(playlist.videos[0], playlist.videos, 0)}>▶ Play All</button>
              <button className="shuffle-btn" onClick={() => {
                const s = [...playlist.videos].sort(() => Math.random() - 0.5);
                onPlay(s[0], s, 0);
              }}>⇄ Shuffle</button>
            </div>
          )}
        </div>
      </div>
      {playlist.videos.length === 0 ? (
        <div className="empty-state"><span>🎵</span><p>No songs yet. Search and add some!</p></div>
      ) : (
        <div className="track-list">
          {playlist.videos.map((v, i) => (
            <div key={v.id} className={`track-row ${current?.id === v.id ? "active" : ""}`}
              onDoubleClick={() => onPlay(v, playlist.videos, i)}>
              <span className="track-num">{current?.id === v.id ? (playing ? "▶" : "❙❙") : i + 1}</span>
              <img className="track-thumb" src={v.thumb} alt="" />
              <div className="track-info">
                <p className="track-title">{v.title}</p>
                <p className="track-channel">{v.channel}</p>
              </div>
              <span className="track-dur">{v.durationFmt}</span>
              <div className="track-actions">
                <button className={`track-btn ${isLiked(v.id) ? "liked" : ""}`} onClick={() => onLike(v)}>{isLiked(v.id) ? "♥" : "♡"}</button>
                <button className="track-btn" onClick={() => onAdd(v)}>+</button>
                <button className="track-btn remove" onClick={() => onRemove(playlist.id, v.id)}>✕</button>
                <button className="track-btn play-btn" onClick={() => onPlay(v, playlist.videos, i)}>▶</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}