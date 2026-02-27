import { useState, useEffect, useRef, useCallback } from "react";
import YouTube from "react-youtube";
import "./App.css";

const BASE = "https://www.googleapis.com/youtube/v3";

// ─── SVG ICONS ────────────────────────────────────────────────────────────────
const Icons = {
  Play: () => (<svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em"><path d="M8 5v14l11-7z"/></svg>),
  Pause: () => (<svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em"><path d="M6 19h4V5H6zm8-14v14h4V5z"/></svg>),
  SkipNext: () => (<svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>),
  SkipPrev: () => (<svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>),
  Shuffle: () => (<svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>),
  Repeat: () => (<svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>),
  RepeatOne: () => (<svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z"/></svg>),
  Heart: ({ filled }) => (<svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" width="1em" height="1em"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>),
  Queue: () => (<svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/></svg>),
  VolumeUp: () => (<svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>),
  VolumeMute: () => (<svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>),
  Add: () => (<svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>),
  Search: () => (<svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>),
  Home: () => (<svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>),
  Library: () => (<svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z"/></svg>),
  Close: () => (<svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>),
  ChevronDown: () => (<svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em"><path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"/></svg>),
  Lyrics: () => (<svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>),
  ArrowBack: () => (<svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>),
  Key: () => (<svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em"><path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/></svg>),
  Refresh: () => (<svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>),
  MusicNote: () => (<svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>),
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function parseDuration(iso = "") {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (+(m[1]||0))*3600 + (+(m[2]||0))*60 + +(m[3]||0);
}
function fmtTime(s) {
  s = Math.floor(s || 0);
  const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60;
  if (h > 0) return `${h}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
  return `${m}:${String(sec).padStart(2,"0")}`;
}
function fmtViews(n) {
  if (!n) return "";
  const num = parseInt(n);
  if (num >= 1e9) return (num/1e9).toFixed(1)+"B";
  if (num >= 1e6) return (num/1e6).toFixed(1)+"M";
  if (num >= 1e3) return (num/1e3).toFixed(1)+"K";
  return String(num);
}
function cleanArtist(name) {
  return name.replace(/\s*(VEVO|Official|Music|Records|Topic)\s*/gi,"").trim() || name;
}
function extractArtist(title, channel) {
  const dash = title.match(/^(.+?)\s[-–]\s/);
  return dash ? dash[1].trim() : cleanArtist(channel);
}

// ─── DYNAMIC BG COLOR ─────────────────────────────────────────────────────────
function getDominantColor(imgUrl, callback) {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = imgUrl + "?t=" + Date.now();
  img.onload = () => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 8; canvas.height = 8;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, 8, 8);
      const d = ctx.getImageData(0,0,8,8).data;
      let r=0,g=0,b=0,count=0;
      for (let i=0;i<d.length;i+=4){r+=d[i];g+=d[i+1];b+=d[i+2];count++;}
      callback(`${Math.floor(r/count)},${Math.floor(g/count)},${Math.floor(b/count)}`);
    } catch { callback("232,23,74"); }
  };
  img.onerror = () => callback("232,23,74");
}

// ─── LYRICS ───────────────────────────────────────────────────────────────────
async function fetchLyrics(title, artist) {
  try {
    const clean = s => s.replace(/\(.*?\)|\[.*?\]/g,"").replace(/ft\..*$/i,"").trim();
    const t = encodeURIComponent(clean(title));
    const a = encodeURIComponent(clean(artist));
    const res = await fetch(`https://lyrist.vercel.app/api/${t}/${a}`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    return data.lyrics || null;
  } catch { return null; }
}

// ─── API ──────────────────────────────────────────────────────────────────────
async function apiSearch(query, maxResults=20) {
  const key = localStorage.getItem("yt_api_key");
  if (!key) throw new Error("NO_KEY");
  const sr = await fetch(`${BASE}/search?key=${key}&q=${encodeURIComponent(query)}&part=snippet&type=video&videoCategoryId=10&maxResults=${maxResults}`).then(r=>r.json());
  if (sr.error) throw new Error(sr.error.message);
  const ids = sr.items.map(i=>i.id.videoId).join(",");
  const dr = await fetch(`${BASE}/videos?key=${key}&id=${ids}&part=contentDetails,statistics`).then(r=>r.json());
  const dm={};(dr.items||[]).forEach(i=>(dm[i.id]=i));
  return sr.items.map(item=>{
    const d=dm[item.id.videoId]||{};
    const dur=parseDuration(d.contentDetails?.duration);
    return {id:item.id.videoId,title:item.snippet.title,channel:item.snippet.channelTitle,
      thumb:item.snippet.thumbnails?.high?.url||item.snippet.thumbnails?.default?.url,
      duration:dur,durationFmt:fmtTime(dur),views:fmtViews(d.statistics?.viewCount)};
  });
}
async function apiTrending(maxResults=24) {
  const key = localStorage.getItem("yt_api_key");
  if (!key) throw new Error("NO_KEY");
  const r = await fetch(`${BASE}/videos?key=${key}&part=snippet,contentDetails,statistics&chart=mostPopular&videoCategoryId=10&maxResults=${maxResults}&regionCode=US`).then(r=>r.json());
  if (r.error) throw new Error(r.error.message);
  return r.items.map(item=>{
    const dur=parseDuration(item.contentDetails?.duration);
    return {id:item.id,title:item.snippet.title,channel:item.snippet.channelTitle,
      thumb:item.snippet.thumbnails?.high?.url||item.snippet.thumbnails?.default?.url,
      duration:dur,durationFmt:fmtTime(dur),views:fmtViews(item.statistics?.viewCount)};
  });
}

const LS = {
  get:(k,def)=>{try{return JSON.parse(localStorage.getItem(k))??def;}catch{return def;}},
  set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch{}},
};

const QUICK = ["Top hits 2024","Lo-fi chill","Workout beats","Pop classics","Hip hop","Acoustic covers","Electronic","Jazz & soul","Indie rock","K-Pop"];

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [apiKey, setApiKey] = useState(localStorage.getItem("yt_api_key")||"");
  const [keyInput, setKeyInput] = useState("");
  const [keyError, setKeyError] = useState("");
  const [showApiSetup, setShowApiSetup] = useState(!localStorage.getItem("yt_api_key"));
  const [view, setView] = useState("home");
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [artistSongs, setArtistSongs] = useState([]);
  const [artistLoading, setArtistLoading] = useState(false);

  // Player
  const [current, setCurrent] = useState(null);
  const [queue, setQueue] = useState([]);
  const [queueIdx, setQueueIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const [muted, setMuted] = useState(false);
  const [repeat, setRepeat] = useState("off");
  const [shuffle, setShuffle] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [showMobilePlayer, setShowMobilePlayer] = useState(false);
  const [mobileTab, setMobileTab] = useState("cover"); // cover | lyrics

  // Lyrics
  const [lyrics, setLyrics] = useState(null);
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);

  // Dynamic bg
  const [bgColor, setBgColor] = useState("20,20,40");

  // Library
  const [playlists, setPlaylists] = useState(()=>LS.get("playlists",[]));
  const [liked, setLiked] = useState(()=>LS.get("liked",[]));
  const [recent, setRecent] = useState(()=>LS.get("recent",[]));

  // Search
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  // Home
  const [trending, setTrending] = useState([]);
  const [trendingLoading, setTrendingLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  // Modals
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [newPLName, setNewPLName] = useState("");
  const [showAddTo, setShowAddTo] = useState(null);

  // Refs
  const ytRef = useRef(null);
  const progressInterval = useRef(null);
  const adCheckInterval = useRef(null);
  const searchTimeout = useRef(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  // Persist
  useEffect(()=>{LS.set("playlists",playlists);},[playlists]);
  useEffect(()=>{LS.set("liked",liked);},[liked]);
  useEffect(()=>{LS.set("recent",recent);},[recent]);

  // Trending
  useEffect(()=>{
    if(view==="home"&&apiKey&&trending.length===0){
      setTrendingLoading(true);
      apiTrending().then(setTrending).catch(()=>{}).finally(()=>setTrendingLoading(false));
    }
  },[view,apiKey,trending.length]);

  // Suggestions
  useEffect(()=>{
    if(view==="home"&&apiKey&&recent.length>0&&suggestions.length===0) loadSuggestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[view,apiKey,recent.length]);

  const loadSuggestions = useCallback(async()=>{
    setSuggestionsLoading(true);
    try{
      const seeds=[...new Set(recent.slice(0,3).map(v=>extractArtist(v.title,v.channel)))];
      const results=await apiSearch(seeds.slice(0,2).join(" ")+" similar songs",14);
      const ids=new Set(recent.map(v=>v.id));
      setSuggestions(results.filter(v=>!ids.has(v.id)).slice(0,10));
    }catch{}
    setSuggestionsLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[recent]);

  // Dynamic bg on song change
  useEffect(()=>{
    if(current?.thumb) getDominantColor(current.thumb, setBgColor);
  },[current?.thumb]);

  // Lyrics when tab opened
  useEffect(()=>{
    if(current&&(showLyrics||mobileTab==="lyrics")&&!lyrics&&!lyricsLoading){
      setLyricsLoading(true);
      fetchLyrics(current.title, extractArtist(current.title,current.channel))
        .then(l=>setLyrics(l||"Lyrics not found for this song."))
        .finally(()=>setLyricsLoading(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[current?.id,showLyrics,mobileTab]);

  // Progress ticker
  useEffect(()=>{
    clearInterval(progressInterval.current);
    if(playing){
      progressInterval.current=setInterval(()=>{
        setProgress(ytRef.current?.getCurrentTime?.()||0);
        setDuration(ytRef.current?.getDuration?.()||0);
      },500);
    }
    return()=>clearInterval(progressInterval.current);
  },[playing]);

  // Ad auto-skip: short videos < 35s are likely ads
  useEffect(()=>{
    clearInterval(adCheckInterval.current);
    if(playing){
      adCheckInterval.current=setInterval(()=>{
        try{
          const dur=ytRef.current?.getDuration?.()||0;
          const pos=ytRef.current?.getCurrentTime?.()||0;
          if(dur>0&&dur<35&&pos>5) ytRef.current?.seekTo(dur-0.1,true);
        }catch{}
      },2000);
    }
    return()=>clearInterval(adCheckInterval.current);
  },[playing]);

  // Player controls
  function playVideo(video, playlist=null, idx=0){
    if(playlist){setQueue(playlist);setQueueIdx(idx);}
    else{setQueue([video]);setQueueIdx(0);}
    setCurrent(video); setPlaying(true);
    setLyrics(null); setLyricsLoading(false);
    setRecent(r=>[video,...r.filter(v=>v.id!==video.id)].slice(0,50));
    setSuggestions([]);
  }

  function togglePlay(){
    if(!ytRef.current) return;
    if(playing){ytRef.current.pauseVideo();setPlaying(false);}
    else{ytRef.current.playVideo();setPlaying(true);}
  }

  function skipNext(){
    if(queue.length<1) return;
    const next=shuffle?Math.floor(Math.random()*queue.length):(queueIdx+1)%queue.length;
    setQueueIdx(next);setCurrent(queue[next]);setPlaying(true);
    setLyrics(null);setLyricsLoading(false);
  }

  function skipPrev(){
    if(progress>3){ytRef.current?.seekTo(0,true);return;}
    const prev=(queueIdx-1+queue.length)%queue.length;
    setQueueIdx(prev);setCurrent(queue[prev]);setPlaying(true);
    setLyrics(null);setLyricsLoading(false);
  }

  function onEnd(){
    if(repeat==="one"){ytRef.current?.seekTo(0,true);ytRef.current?.playVideo();return;}
    if(repeat==="all"||queueIdx<queue.length-1) skipNext();
    else setPlaying(false);
  }

  function seekTo(pct){
    const t=(pct/100)*duration;
    ytRef.current?.seekTo(t,true);setProgress(t);
  }

  function onVolumeChange(v){
    setVolume(v);setMuted(v===0);
    ytRef.current?.setVolume(v);
    if(v===0) ytRef.current?.mute(); else ytRef.current?.unMute();
  }

  function toggleMute(){
    if(muted){ytRef.current?.unMute();ytRef.current?.setVolume(volume);setMuted(false);}
    else{ytRef.current?.mute();setMuted(true);}
  }

  // Library
  const isLiked = useCallback((id)=>liked.some(v=>v.id===id),[liked]);
  function toggleLike(video){setLiked(l=>isLiked(video.id)?l.filter(v=>v.id!==video.id):[video,...l]);}
  function createPlaylist(name){
    if(!name.trim()) return;
    setPlaylists(p=>[...p,{id:`pl_${Date.now()}`,name,videos:[],cover:null}]);
    setNewPLName("");setShowCreatePlaylist(false);
  }
  function deletePlaylist(id){setPlaylists(p=>p.filter(pl=>pl.id!==id));}
  function addToPlaylist(plId,video){
    setPlaylists(p=>p.map(pl=>pl.id===plId?{...pl,videos:pl.videos.some(v=>v.id===video.id)?pl.videos:[...pl.videos,video],cover:pl.cover||video.thumb}:pl));
    setShowAddTo(null);
  }
  function removeFromPlaylist(plId,vidId){setPlaylists(p=>p.map(pl=>pl.id===plId?{...pl,videos:pl.videos.filter(v=>v.id!==vidId)}:pl));}

  // Search
  function handleSearchInput(val){
    setSearchQ(val);clearTimeout(searchTimeout.current);
    if(val.length>2) searchTimeout.current=setTimeout(()=>doSearch(val),700);
    if(!val) setSearchResults([]);
  }
  async function doSearch(q){
    if(!q.trim()) return;
    setSearching(true);setSearchError("");
    try{setSearchResults(await apiSearch(q));}
    catch(e){setSearchError(e.message==="NO_KEY"?"Please set your API key first.":"Search failed: "+e.message);}
    setSearching(false);
  }
  function saveKey(){
    if(!keyInput.trim()){setKeyError("Please enter a key");return;}
    localStorage.setItem("yt_api_key",keyInput.trim());
    setApiKey(keyInput.trim());setShowApiSetup(false);setKeyError("");
  }
  async function openArtist(name,thumb){
    setSelectedArtist({name,thumb});setView("artist");setArtistLoading(true);
    try{setArtistSongs(await apiSearch(`${cleanArtist(name)} official music`,20));}
    catch{setArtistSongs([]);}
    setArtistLoading(false);
  }

  // Swipe on mobile player
  function onTouchStart(e){touchStartX.current=e.touches[0].clientX;touchStartY.current=e.touches[0].clientY;}
  function onTouchEnd(e){
    const dx=e.changedTouches[0].clientX-touchStartX.current;
    const dy=Math.abs(e.changedTouches[0].clientY-touchStartY.current);
    if(Math.abs(dx)>50&&dy<80){
      if(dx<0){setMobileTab("lyrics");}
      else{setMobileTab("cover");}
    }
  }

  const progressPct = duration>0?(progress/duration)*100:0;

  // Artist cards
  const artistMap={};
  [...trending,...recent].forEach(v=>{
    if(!artistMap[v.channel]) artistMap[v.channel]={name:v.channel,thumb:v.thumb,count:0};
    artistMap[v.channel].count++;
  });
  const artistCards=Object.values(artistMap).sort((a,b)=>b.count-a.count).slice(0,12);

  const dynStyle={"--dyn-r":bgColor.split(",")[0],"--dyn-g":bgColor.split(",")[1],"--dyn-b":bgColor.split(",")[2]};

  return (
    <div className={`app ${current?"has-player":""}`} style={dynStyle}>

      {/* Hidden YT Player */}
      {current && (
        <div className="yt-hidden">
          <YouTube videoId={current.id}
            onReady={e=>{ytRef.current=e.target;e.target.setVolume(volume);e.target.playVideo();}}
            onStateChange={e=>{
              if(e.data===1) setPlaying(true);
              if(e.data===2) setPlaying(false);
              if(e.data===0) onEnd();
            }}
            opts={{height:"1",width:"1",playerVars:{autoplay:1,controls:0,rel:0,modestbranding:1}}}
          />
        </div>
      )}

      {/* API Key Modal */}
      {showApiSetup&&(
        <div className="modal-overlay" onClick={()=>apiKey&&setShowApiSetup(false)}>
          <div className="api-modal" onClick={e=>e.stopPropagation()}>
            <div className="api-modal-icon">🔑</div>
            <h2>YouTube API Key</h2>
            <p>Free — 10,000 units/day via <strong>YouTube Data API v3</strong></p>
            <div className="api-steps">
              <div className="api-step"><span>1</span><span>Go to <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer">console.cloud.google.com</a></span></div>
              <div className="api-step"><span>2</span><span>New project → Enable <strong>YouTube Data API v3</strong></span></div>
              <div className="api-step"><span>3</span><span>Credentials → <strong>Create API Key</strong></span></div>
              <div className="api-step"><span>4</span><span>Paste your key below</span></div>
            </div>
            <input className="api-input" type="text" placeholder="AIza..." value={keyInput}
              onChange={e=>setKeyInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&saveKey()} autoFocus/>
            {keyError&&<p className="api-error">{keyError}</p>}
            <button className="api-save-btn" onClick={saveKey}>Save & Continue →</button>
            <p className="api-note">Stored only in your browser's localStorage.</p>
          </div>
        </div>
      )}

      {/* Add to Playlist Modal */}
      {showAddTo&&(
        <div className="modal-overlay" onClick={()=>setShowAddTo(null)}>
          <div className="addto-modal" onClick={e=>e.stopPropagation()}>
            <h3>Add to Playlist</h3>
            <p className="addto-title">{showAddTo.title}</p>
            {playlists.length===0?(
              <div className="addto-empty">
                <p>No playlists yet.</p>
                <button onClick={()=>{setShowAddTo(null);setShowCreatePlaylist(true);}}>Create one</button>
              </div>
            ):(
              <div className="addto-list">
                {playlists.map(pl=>(
                  <button key={pl.id} className="addto-item" onClick={()=>addToPlaylist(pl.id,showAddTo)}>
                    <span className="addto-pl-icon"><Icons.MusicNote/></span>
                    <span>{pl.name}</span>
                    <span className="addto-count">{pl.videos.length}</span>
                  </button>
                ))}
              </div>
            )}
            <button className="addto-cancel" onClick={()=>setShowAddTo(null)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Create Playlist Modal */}
      {showCreatePlaylist&&(
        <div className="modal-overlay" onClick={()=>setShowCreatePlaylist(false)}>
          <div className="create-pl-modal" onClick={e=>e.stopPropagation()}>
            <h3>New Playlist</h3>
            <input autoFocus placeholder="Playlist name..." value={newPLName}
              onChange={e=>setNewPLName(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&createPlaylist(newPLName)}/>
            <div className="create-pl-btns">
              <button className="cancel" onClick={()=>setShowCreatePlaylist(false)}>Cancel</button>
              <button className="create" onClick={()=>createPlaylist(newPLName)}>Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Full Player */}
      {showMobilePlayer&&current&&(
        <div className="mobile-full-player" style={dynStyle} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          <div className="mfp-header">
            <button className="mfp-close" onClick={()=>setShowMobilePlayer(false)}><Icons.ChevronDown/></button>
            <div className="mfp-tabs">
              <button className={mobileTab==="cover"?"active":""} onClick={()=>setMobileTab("cover")}>Now Playing</button>
              <button className={mobileTab==="lyrics"?"active":""} onClick={()=>setMobileTab("lyrics")}>
                <Icons.Lyrics/> Lyrics
              </button>
            </div>
            <button className="mfp-add" onClick={()=>setShowAddTo(current)}><Icons.Add/></button>
          </div>

          <div className="mfp-dots">
            <div className={`mfp-dot${mobileTab==="cover"?" active":""}`}/>
            <div className={`mfp-dot${mobileTab==="lyrics"?" active":""}`}/>
          </div>

          {mobileTab==="cover"&&(
            <>
              <div className="mfp-artwork-wrap">
                <div className="mfp-artwork-glow"/>
                <img src={current.thumb} alt="" className="mfp-artwork"/>
              </div>
              <div className="mfp-info">
                <div className="mfp-info-text">
                  <p className="mfp-title">{current.title}</p>
                  <p className="mfp-channel">{current.channel}</p>
                </div>
                <button className={`mfp-like${isLiked(current.id)?" liked":""}`} onClick={()=>toggleLike(current)}>
                  <Icons.Heart filled={isLiked(current.id)}/>
                </button>
              </div>
            </>
          )}

          {mobileTab==="lyrics"&&(
            <div className="mfp-lyrics-wrap">
              {lyricsLoading?(
                <div className="lyrics-loading"><div className="spinner"/><p>Finding lyrics...</p></div>
              ):(
                <div className="lyrics-content">
                  <p className="lyrics-song-name">{current.title}</p>
                  <p className="lyrics-artist">{current.channel}</p>
                  <pre className="lyrics-text">{lyrics||"No lyrics found."}</pre>
                </div>
              )}
            </div>
          )}

          <div className="mfp-progress-wrap">
            <input type="range" min="0" max="100" value={progressPct}
              onChange={e=>seekTo(+e.target.value)} className="progress-slider mfp-slider"/>
            <div className="mfp-times"><span>{fmtTime(progress)}</span><span>{fmtTime(duration)}</span></div>
          </div>

          <div className="mfp-controls">
            <button className={`mfp-ctrl-sm${shuffle?" active":""}`} onClick={()=>setShuffle(s=>!s)}><Icons.Shuffle/></button>
            <button className="mfp-ctrl-md" onClick={skipPrev}><Icons.SkipPrev/></button>
            <button className="mfp-ctrl-play" onClick={togglePlay}>{playing?<Icons.Pause/>:<Icons.Play/>}</button>
            <button className="mfp-ctrl-md" onClick={skipNext}><Icons.SkipNext/></button>
            <button className={`mfp-ctrl-sm${repeat!=="off"?" active":""}`}
              onClick={()=>setRepeat(r=>r==="off"?"all":r==="all"?"one":"off")}>
              {repeat==="one"?<Icons.RepeatOne/>:<Icons.Repeat/>}
            </button>
          </div>

          <div className="mfp-volume-row">
            <button className="mfp-ctrl-sm" onClick={toggleMute}>{muted?<Icons.VolumeMute/>:<Icons.VolumeUp/>}</button>
            <input type="range" min="0" max="100" value={muted?0:volume}
              onChange={e=>onVolumeChange(+e.target.value)} className="vol-slider-full"/>
          </div>
          <p className="mfp-swipe-hint">← swipe for lyrics →</p>
        </div>
      )}

      {/* Sidebar (desktop) */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-icon">◈</span>
          <span className="logo-text">VIBE</span>
        </div>
        <nav className="sidebar-nav">
          {[
            {id:"home",icon:<Icons.Home/>,label:"Discover"},
            {id:"search",icon:<Icons.Search/>,label:"Search"},
            {id:"library",icon:<Icons.Library/>,label:"Library"},
          ].map(item=>(
            <button key={item.id}
              className={`nav-item ${(item.id==="home"&&["home","artist"].includes(view))||(item.id==="library"&&["library","playlist","liked"].includes(view))||view===item.id?"active":""}`}
              onClick={()=>setView(item.id)}>
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-playlists">
          <div className="sidebar-pl-header">
            <span>PLAYLISTS</span>
            <button className="sidebar-pl-add" onClick={()=>setShowCreatePlaylist(true)}>+</button>
          </div>
          {playlists.map(pl=>(
            <button key={pl.id}
              className={`sidebar-pl-item${selectedPlaylist?.id===pl.id&&view==="playlist"?" active":""}`}
              onClick={()=>{setSelectedPlaylist(pl);setView("playlist");}}>
              ♪ {pl.name}
            </button>
          ))}
          {liked.length>0&&(
            <button className={`sidebar-pl-item${view==="liked"?" active":""}`} onClick={()=>setView("liked")}>
              ♥ Liked Songs
            </button>
          )}
        </div>
        <button className="sidebar-key-btn" onClick={()=>setShowApiSetup(true)}>
          <Icons.Key/><span>API Key</span>
        </button>
      </aside>

      {/* Main */}
      <main className="main">

        {/* HOME */}
        {view==="home"&&(
          <div className="view home-view">
            <div className="view-header">
              <h1>Discover <span className="accent">Music</span></h1>
              <button className="header-search-btn" onClick={()=>setView("search")}><Icons.Search/> Search</button>
            </div>
            {trendingLoading&&<div className="loading-state"><div className="spinner"/><p>Loading...</p></div>}
            {!apiKey&&!trendingLoading&&(
              <div className="no-key-banner">
                <Icons.Key/><span>Set your API key to see trending music</span>
                <button onClick={()=>setShowApiSetup(true)}>Setup →</button>
              </div>
            )}
            {trending.length>0&&(
              <>
                <section className="section">
                  <h2 className="section-title">🔥 Trending Now</h2>
                  <div className="featured-grid">
                    {trending.slice(0,4).map((v,i)=>(
                      <div key={v.id} className={`featured-card${i===0?" featured-card-large":""}`} onClick={()=>playVideo(v,trending,i)}>
                        <img src={v.thumb} alt={v.title} loading="lazy"/>
                        <div className="featured-overlay"/>
                        <div className="featured-info">
                          <p className="featured-title">{v.title}</p>
                          <p className="featured-channel">{v.channel}</p>
                        </div>
                        <div className="featured-play"><Icons.Play/></div>
                        {v.views&&<span className="featured-views">{v.views} views</span>}
                      </div>
                    ))}
                  </div>
                </section>

                {(suggestions.length>0||suggestionsLoading)&&(
                  <section className="section">
                    <div className="section-header">
                      <h2 className="section-title">✨ Suggested For You</h2>
                      <button className="section-refresh" onClick={()=>{setSuggestions([]);loadSuggestions();}}>
                        <Icons.Refresh/> Refresh
                      </button>
                    </div>
                    {suggestionsLoading?(
                      <div className="suggestions-row">{[...Array(5)].map((_,i)=><div key={i} className="skeleton-card"/>)}</div>
                    ):(
                      <div className="suggestions-row">
                        {suggestions.map((v,i)=>(
                          <div key={v.id} className="suggestion-card" onClick={()=>playVideo(v,suggestions,i)}>
                            <div className="suggestion-thumb-wrap">
                              <img src={v.thumb} alt="" loading="lazy"/>
                              <div className="suggestion-play-overlay"><Icons.Play/></div>
                            </div>
                            <p className="suggestion-title">{v.title}</p>
                            <p className="suggestion-channel">{v.channel}</p>
                            <p className="suggestion-dur">{v.durationFmt}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                )}

                {artistCards.length>0&&(
                  <section className="section">
                    <h2 className="section-title">🎤 Artists</h2>
                    <div className="artists-row">
                      {artistCards.map(a=>(
                        <div key={a.name} className="artist-card" onClick={()=>openArtist(a.name,a.thumb)}>
                          <div className="artist-avatar">
                            <img src={a.thumb} alt={a.name} loading="lazy"/>
                            <div className="artist-avatar-overlay"><Icons.Play/></div>
                          </div>
                          <p className="artist-name">{cleanArtist(a.name)}</p>
                          <p className="artist-type">Artist</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {recent.length>0&&(
                  <section className="section">
                    <h2 className="section-title">🕐 Recently Played</h2>
                    <div className="recent-row">
                      {recent.slice(0,10).map(v=>(
                        <div key={v.id} className="recent-card" onClick={()=>playVideo(v)}>
                          <div className="recent-img-wrap">
                            <img src={v.thumb} alt="" loading="lazy"/>
                            <div className="recent-play-overlay"><Icons.Play/></div>
                          </div>
                          <p>{v.title}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                <section className="section">
                  <h2 className="section-title">📈 Top Charts</h2>
                  <div className="track-list">
                    {trending.slice(4).map((v,i)=>(
                      <TrackRow key={v.id} video={v} index={i+5}
                        isActive={current?.id===v.id} isPlaying={current?.id===v.id&&playing}
                        onPlay={()=>playVideo(v,trending,i+4)}
                        onLike={()=>toggleLike(v)} liked={isLiked(v.id)}
                        onAdd={()=>setShowAddTo(v)}
                        onArtist={()=>openArtist(v.channel,v.thumb)}/>
                    ))}
                  </div>
                </section>
              </>
            )}
          </div>
        )}

        {/* SEARCH */}
        {view==="search"&&(
          <div className="view search-view">
            <div className="search-bar-wrap">
              <span className="search-icon"><Icons.Search/></span>
              <input className="search-input" placeholder="Search songs, artists, albums..."
                value={searchQ} onChange={e=>handleSearchInput(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&doSearch(searchQ)} autoFocus/>
              {searchQ&&<button className="search-clear" onClick={()=>{setSearchQ("");setSearchResults([]);}}><Icons.Close/></button>}
            </div>
            {!searchQ&&(
              <div className="quick-searches">
                <h3>Quick Searches</h3>
                <div className="quick-chips">
                  {QUICK.map(q=><button key={q} onClick={()=>{setSearchQ(q);doSearch(q);}}>{q}</button>)}
                </div>
              </div>
            )}
            {searching&&<div className="loading-state"><div className="spinner"/><p>Searching...</p></div>}
            {searchError&&<div className="error-msg">{searchError}</div>}
            {searchResults.length>0&&(
              <div className="track-list">
                <p className="results-count">{searchResults.length} results for "{searchQ}"</p>
                {searchResults.map((v,i)=>(
                  <TrackRow key={v.id} video={v} index={i+1}
                    isActive={current?.id===v.id} isPlaying={current?.id===v.id&&playing}
                    onPlay={()=>playVideo(v,searchResults,i)}
                    onLike={()=>toggleLike(v)} liked={isLiked(v.id)}
                    onAdd={()=>setShowAddTo(v)}
                    onArtist={()=>openArtist(v.channel,v.thumb)}/>
                ))}
              </div>
            )}
          </div>
        )}

        {/* LIBRARY */}
        {view==="library"&&(
          <div className="view library-view">
            <div className="view-header">
              <h1>My <span className="accent">Library</span></h1>
              <button className="create-pl-btn" onClick={()=>setShowCreatePlaylist(true)}>+ New Playlist</button>
            </div>
            <section className="section">
              <h2 className="section-title">Playlists</h2>
              {playlists.length===0?(
                <div className="empty-state"><span>🎵</span><p>No playlists yet</p>
                  <button onClick={()=>setShowCreatePlaylist(true)}>Create Playlist</button></div>
              ):(
                <div className="pl-grid">
                  {playlists.map(pl=>(
                    <div key={pl.id} className="pl-card" onClick={()=>{setSelectedPlaylist(pl);setView("playlist");}}>
                      <div className="pl-art">{pl.cover?<img src={pl.cover} alt=""/>:<span>♪</span>}</div>
                      <p className="pl-name">{pl.name}</p>
                      <p className="pl-count">{pl.videos.length} songs</p>
                      <button className="pl-delete" onClick={e=>{e.stopPropagation();deletePlaylist(pl.id);}}><Icons.Close/></button>
                    </div>
                  ))}
                </div>
              )}
            </section>
            {liked.length>0&&(
              <section className="section">
                <h2 className="section-title">♥ Liked Songs ({liked.length})</h2>
                <button className="play-all-btn" onClick={()=>liked[0]&&playVideo(liked[0],liked,0)}><Icons.Play/> Play All</button>
                <div className="track-list">
                  {liked.map((v,i)=>(
                    <TrackRow key={v.id} video={v} index={i+1}
                      isActive={current?.id===v.id} isPlaying={current?.id===v.id&&playing}
                      onPlay={()=>playVideo(v,liked,i)}
                      onLike={()=>toggleLike(v)} liked={isLiked(v.id)}
                      onAdd={()=>setShowAddTo(v)}
                      onArtist={()=>openArtist(v.channel,v.thumb)}/>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* PLAYLIST DETAIL */}
        {view==="playlist"&&selectedPlaylist&&(
          <PlaylistView
            playlist={playlists.find(p=>p.id===selectedPlaylist.id)||selectedPlaylist}
            current={current} playing={playing}
            onPlay={playVideo} onLike={toggleLike} isLiked={isLiked}
            onAdd={setShowAddTo} onRemove={removeFromPlaylist}
            onBack={()=>setView("library")} onArtist={openArtist}/>
        )}

        {/* LIKED */}
        {view==="liked"&&(
          <div className="view">
            <div className="view-header">
              <button className="back-btn" onClick={()=>setView("library")}><Icons.ArrowBack/></button>
              <h1>♥ Liked <span className="accent">Songs</span></h1>
            </div>
            {liked.length===0?(<div className="empty-state"><span>♡</span><p>No liked songs yet</p></div>):(
              <>
                <button className="play-all-btn" onClick={()=>playVideo(liked[0],liked,0)}><Icons.Play/> Play All ({liked.length})</button>
                <div className="track-list">
                  {liked.map((v,i)=>(
                    <TrackRow key={v.id} video={v} index={i+1}
                      isActive={current?.id===v.id} isPlaying={current?.id===v.id&&playing}
                      onPlay={()=>playVideo(v,liked,i)}
                      onLike={()=>toggleLike(v)} liked={isLiked(v.id)}
                      onAdd={()=>setShowAddTo(v)}
                      onArtist={()=>openArtist(v.channel,v.thumb)}/>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ARTIST VIEW */}
        {view==="artist"&&selectedArtist&&(
          <div className="view artist-view">
            <button className="back-btn" onClick={()=>setView("home")}><Icons.ArrowBack/></button>
            <div className="artist-hero">
              <div className="artist-hero-img">
                {selectedArtist.thumb?<img src={selectedArtist.thumb} alt=""/>:<span>🎤</span>}
              </div>
              <div className="artist-hero-info">
                <p className="playlist-label">ARTIST</p>
                <h1>{cleanArtist(selectedArtist.name)}</h1>
                {artistSongs.length>0&&(
                  <div className="playlist-actions" style={{marginTop:16}}>
                    <button className="play-all-btn" onClick={()=>playVideo(artistSongs[0],artistSongs,0)}><Icons.Play/> Play All</button>
                    <button className="shuffle-btn" onClick={()=>{const s=[...artistSongs].sort(()=>Math.random()-.5);playVideo(s[0],s,0);}}><Icons.Shuffle/> Shuffle</button>
                  </div>
                )}
              </div>
            </div>
            {artistLoading?(<div className="loading-state"><div className="spinner"/><p>Loading songs...</p></div>)
              :artistSongs.length===0?(<div className="empty-state"><span>🎵</span><p>No songs found</p></div>)
              :(
                <div className="track-list">
                  {artistSongs.map((v,i)=>(
                    <TrackRow key={v.id} video={v} index={i+1}
                      isActive={current?.id===v.id} isPlaying={current?.id===v.id&&playing}
                      onPlay={()=>playVideo(v,artistSongs,i)}
                      onLike={()=>toggleLike(v)} liked={isLiked(v.id)}
                      onAdd={()=>setShowAddTo(v)} onArtist={null}/>
                  ))}
                </div>
              )}
          </div>
        )}
      </main>

      {/* Bottom Nav (mobile) */}
      <nav className="bottom-nav">
        {[
          {id:"home",icon:<Icons.Home/>,label:"Home"},
          {id:"search",icon:<Icons.Search/>,label:"Search"},
          {id:"library",icon:<Icons.Library/>,label:"Library"},
        ].map(item=>(
          <button key={item.id}
            className={`bottom-nav-item${(item.id==="home"&&["home","artist"].includes(view))||(item.id==="library"&&["library","playlist","liked"].includes(view))||view===item.id?" active":""}`}
            onClick={()=>setView(item.id)}>
            <span className="bnav-icon">{item.icon}</span>
            <span className="bnav-label">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Player Bar */}
      {current&&(
        <div className="player-bar">
          {/* Queue Panel */}
          {showQueue&&(
            <div className="queue-panel">
              <div className="queue-header">
                <span>Up Next ({queue.length})</span>
                <button onClick={()=>setShowQueue(false)}><Icons.Close/></button>
              </div>
              <div className="queue-list">
                {queue.map((v,i)=>(
                  <div key={`${v.id}-${i}`} className={`queue-item${i===queueIdx?" active":""}`}
                    onClick={()=>{setCurrent(v);setQueueIdx(i);setPlaying(true);setLyrics(null);}}>
                    <img src={v.thumb} alt=""/>
                    <div><p>{v.title}</p><p>{v.channel}</p></div>
                    {i===queueIdx&&<span className="queue-playing"><Icons.Play/></span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lyrics Panel (desktop) */}
          {showLyrics&&(
            <div className="lyrics-panel">
              <div className="lyrics-panel-header">
                <span><Icons.Lyrics/> Lyrics</span>
                <button onClick={()=>setShowLyrics(false)}><Icons.Close/></button>
              </div>
              <div className="lyrics-panel-body">
                {lyricsLoading?(
                  <div className="lyrics-loading"><div className="spinner"/><p>Finding lyrics...</p></div>
                ):(
                  <div className="lyrics-content">
                    <p className="lyrics-song-name">{current.title}</p>
                    <p className="lyrics-artist">{current.channel}</p>
                    <pre className="lyrics-text">{lyrics||"No lyrics found."}</pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Thin progress line on top */}
          <div className="player-progress-top">
            <div className="player-progress-fill" style={{width:`${progressPct}%`}}/>
          </div>

          <div className="mini-player">
            <div className="mini-inner">
              {/* Song info */}
              <div className="mini-info" onClick={()=>setShowMobilePlayer(true)}>
                <div className="mini-thumb-wrap">
                  <img src={current.thumb} alt="" className="mini-thumb"/>
                  {playing&&<div className="mini-thumb-pulse"/>}
                </div>
                <div className="mini-text">
                  <p className="mini-title">{current.title}</p>
                  <p className="mini-channel">{current.channel}</p>
                </div>
              </div>

              {/* Desktop center controls */}
              <div className="mini-controls desktop-only">
                <button className={`ctrl-btn${shuffle?" active":""}`} title="Shuffle" onClick={()=>setShuffle(s=>!s)}><Icons.Shuffle/></button>
                <button className="ctrl-btn skip" title="Previous" onClick={skipPrev}><Icons.SkipPrev/></button>
                <button className="ctrl-btn play" title={playing?"Pause":"Play"} onClick={togglePlay}>
                  {playing?<Icons.Pause/>:<Icons.Play/>}
                </button>
                <button className="ctrl-btn skip" title="Next" onClick={skipNext}><Icons.SkipNext/></button>
                <button className={`ctrl-btn${repeat!=="off"?" active":""}`} title="Repeat"
                  onClick={()=>setRepeat(r=>r==="off"?"all":r==="all"?"one":"off")}>
                  {repeat==="one"?<Icons.RepeatOne/>:<Icons.Repeat/>}
                </button>
              </div>

              {/* Mobile mini controls */}
              <div className="mini-controls-mobile">
                <button className="ctrl-btn skip" onClick={skipPrev}><Icons.SkipPrev/></button>
                <button className="ctrl-btn play" onClick={togglePlay}>{playing?<Icons.Pause/>:<Icons.Play/>}</button>
                <button className="ctrl-btn skip" onClick={skipNext}><Icons.SkipNext/></button>
              </div>

              {/* Desktop right */}
              <div className="mini-extra desktop-only">
                <button className={`ctrl-btn sm${isLiked(current.id)?" liked":""}`} title="Like" onClick={()=>toggleLike(current)}>
                  <Icons.Heart filled={isLiked(current.id)}/>
                </button>
                <button className="ctrl-btn sm" title="Add to playlist" onClick={()=>setShowAddTo(current)}><Icons.Add/></button>
                <button className={`ctrl-btn sm${showLyrics?" active":""}`} title="Lyrics" onClick={()=>setShowLyrics(l=>!l)}><Icons.Lyrics/></button>
                <button className={`ctrl-btn sm${showQueue?" active":""}`} title="Queue" onClick={()=>setShowQueue(q=>!q)}><Icons.Queue/></button>
                <button className="ctrl-btn sm" title={muted?"Unmute":"Mute"} onClick={toggleMute}>
                  {muted?<Icons.VolumeMute/>:<Icons.VolumeUp/>}
                </button>
                <input type="range" min="0" max="100" value={muted?0:volume}
                  onChange={e=>onVolumeChange(+e.target.value)} className="vol-slider"/>
              </div>
            </div>

            {/* Desktop progress bar */}
            <div className="full-progress desktop-only">
              <span>{fmtTime(progress)}</span>
              <input type="range" min="0" max="100" value={progressPct}
                onChange={e=>seekTo(+e.target.value)} className="progress-slider"/>
              <span>{fmtTime(duration)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TRACK ROW ────────────────────────────────────────────────────────────────
function TrackRow({video,index,isActive,isPlaying,onPlay,onLike,liked,onAdd,onArtist}){
  return(
    <div className={`track-row${isActive?" active":""}`} onClick={onPlay}>
      <span className="track-num">{isActive?(isPlaying?<Icons.Play/>:"❙❙"):index}</span>
      <img className="track-thumb" src={video.thumb} alt="" loading="lazy"/>
      <div className="track-info">
        <p className="track-title">{video.title}</p>
        <p className="track-channel">
          {onArtist?<button className="artist-link" onClick={e=>{e.stopPropagation();onArtist();}}>{video.channel}</button>:video.channel}
          {video.views&&<span className="track-views"> · {video.views}</span>}
        </p>
      </div>
      <span className="track-dur">{video.durationFmt}</span>
      <div className="track-actions">
        <button className={`track-btn${liked?" liked":""}`} onClick={e=>{e.stopPropagation();onLike();}}><Icons.Heart filled={liked}/></button>
        <button className="track-btn" onClick={e=>{e.stopPropagation();onAdd();}}><Icons.Add/></button>
        <button className="track-btn play-btn" onClick={e=>{e.stopPropagation();onPlay();}}><Icons.Play/></button>
      </div>
    </div>
  );
}

// ─── PLAYLIST VIEW ────────────────────────────────────────────────────────────
function PlaylistView({playlist,current,playing,onPlay,onLike,isLiked,onAdd,onRemove,onBack,onArtist}){
  const totalSecs=playlist.videos.reduce((a,v)=>a+(v.duration||0),0);
  return(
    <div className="view playlist-view">
      <button className="back-btn" onClick={onBack}><Icons.ArrowBack/> Library</button>
      <div className="playlist-header">
        <div className="playlist-art-big">{playlist.cover?<img src={playlist.cover} alt=""/>:<span>♪</span>}</div>
        <div className="playlist-meta">
          <p className="playlist-label">PLAYLIST</p>
          <h1>{playlist.name}</h1>
          <p className="playlist-stats">{playlist.videos.length} songs · {fmtTime(totalSecs)}</p>
          {playlist.videos.length>0&&(
            <div className="playlist-actions">
              <button className="play-all-btn" onClick={()=>onPlay(playlist.videos[0],playlist.videos,0)}><Icons.Play/> Play All</button>
              <button className="shuffle-btn" onClick={()=>{const s=[...playlist.videos].sort(()=>Math.random()-.5);onPlay(s[0],s,0);}}><Icons.Shuffle/> Shuffle</button>
            </div>
          )}
        </div>
      </div>
      {playlist.videos.length===0?(<div className="empty-state"><span>🎵</span><p>No songs yet.</p></div>):(
        <div className="track-list">
          {playlist.videos.map((v,i)=>(
            <div key={v.id} className={`track-row${current?.id===v.id?" active":""}`} onClick={()=>onPlay(v,playlist.videos,i)}>
              <span className="track-num">{current?.id===v.id?(playing?<Icons.Play/>:"❙❙"):i+1}</span>
              <img className="track-thumb" src={v.thumb} alt=""/>
              <div className="track-info">
                <p className="track-title">{v.title}</p>
                <p className="track-channel">
                  <button className="artist-link" onClick={e=>{e.stopPropagation();onArtist(v.channel,v.thumb);}}>{v.channel}</button>
                </p>
              </div>
              <span className="track-dur">{v.durationFmt}</span>
              <div className="track-actions">
                <button className={`track-btn${isLiked(v.id)?" liked":""}`} onClick={e=>{e.stopPropagation();onLike(v);}}><Icons.Heart filled={isLiked(v.id)}/></button>
                <button className="track-btn" onClick={e=>{e.stopPropagation();onAdd(v);}}><Icons.Add/></button>
                <button className="track-btn remove" onClick={e=>{e.stopPropagation();onRemove(playlist.id,v.id);}}><Icons.Close/></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}