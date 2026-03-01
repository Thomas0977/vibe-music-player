import { useState, useEffect, useRef, useCallback } from "react";
import YouTube from "react-youtube";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, TrendingUp, Users, Zap,
  Search, ChevronRight, Activity, Star,
  Music, Radio, BarChart2, Sparkles,
  PlayCircle, PauseCircle, SkipForward, Heart, Volume2,
  Globe, LogOut, Menu, X, Key, Library,
  ListMusic, RefreshCw, ChevronDown, SkipBack, Repeat,
  Repeat1, Shuffle, Plus, Mic2, List, AlertCircle
} from "lucide-react";
import "./App.css";

const BASE = "https://www.googleapis.com/youtube/v3";

const T = {
  accent:      "#7c3aed",
  accentLight: "#a78bfa",
  accentGlow:  "rgba(124,58,237,0.4)",
  accentSoft:  "rgba(124,58,237,0.12)",
  surface:     "rgba(255,255,255,0.04)",
  border:      "rgba(255,255,255,0.08)",
  text2:       "rgba(255,255,255,0.45)",
  text3:       "rgba(255,255,255,0.25)",
  bg:          "#090914",
  bg2:         "#0e0e1a",
};

const fadeUp  = { hidden:{opacity:0,y:20}, show:{opacity:1,y:0,transition:{duration:0.45,ease:[0.25,0.46,0.45,0.94]}} };
const scaleIn = { hidden:{opacity:0,scale:0.93}, show:{opacity:1,scale:1,transition:{duration:0.4,ease:[0.25,0.46,0.45,0.94]}} };
const stagger = { hidden:{}, show:{transition:{staggerChildren:0.07}} };

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function parseDuration(iso=""){
  const m=iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if(!m) return 0;
  return (+(m[1]||0))*3600 + (+(m[2]||0))*60 + (+(m[3]||0));
}
function fmtTime(s){
  s=Math.floor(s||0);
  const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=s%60;
  if(h>0) return `${h}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
  return `${m}:${String(sec).padStart(2,"0")}`;
}
function fmtViews(n){
  if(!n) return "";
  const num=parseInt(n);
  if(num>=1e9) return (num/1e9).toFixed(1)+"B";
  if(num>=1e6) return (num/1e6).toFixed(1)+"M";
  if(num>=1e3) return (num/1e3).toFixed(1)+"K";
  return String(num);
}
function cleanArtist(name){ return name.replace(/\s*(VEVO|Official|Music|Records|Topic)\s*/gi,"").trim()||name; }
function extractArtist(title,channel){
  const d=title.match(/^(.+?)\s[-–—]\s/);
  return d?d[1].trim():cleanArtist(channel);
}
function cleanForLyrics(str){
  return str
    .replace(/\(.*?\)|\[.*?\]/g,"")
    .replace(/ft\..*$/i,"")
    .replace(/feat\..*$/i,"")
    .replace(/official.*$/i,"")
    .replace(/lyrics.*$/i,"")
    .replace(/video.*$/i,"")
    .replace(/audio.*$/i,"")
    .trim();
}

function getDominantColor(imgUrl,cb){
  const img=new Image(); img.crossOrigin="anonymous";
  img.src=imgUrl+"?t="+Date.now();
  img.onload=()=>{
    try{
      const c=document.createElement("canvas"); c.width=8; c.height=8;
      const ctx=c.getContext("2d"); ctx.drawImage(img,0,0,8,8);
      const d=ctx.getImageData(0,0,8,8).data;
      let r=0,g=0,b=0,n=0;
      for(let i=0;i<d.length;i+=4){r+=d[i];g+=d[i+1];b+=d[i+2];n++;}
      cb(`${Math.floor(r/n)},${Math.floor(g/n)},${Math.floor(b/n)}`);
    }catch{cb("124,58,237");}
  };
  img.onerror=()=>cb("124,58,237");
}

// ── Multi-source lyrics fetcher with 3 fallback APIs ──────────────────────
async function fetchLyrics(title, artist){
  const t = cleanForLyrics(title);
  const a = cleanForLyrics(artist);

  // Source 1: lyrist
  try{
    const r = await fetch(
      `https://lyrist.vercel.app/api/${encodeURIComponent(t)}/${encodeURIComponent(a)}`,
      {signal: AbortSignal.timeout(6000)}
    );
    if(r.ok){
      const d = await r.json();
      if(d.lyrics && d.lyrics.length > 30) return d.lyrics;
    }
  }catch{}

  // Source 2: lyrics.ovh
  try{
    const r = await fetch(
      `https://api.lyrics.ovh/v1/${encodeURIComponent(a)}/${encodeURIComponent(t)}`,
      {signal: AbortSignal.timeout(6000)}
    );
    if(r.ok){
      const d = await r.json();
      if(d.lyrics && d.lyrics.length > 30) return d.lyrics;
    }
  }catch{}

  // Source 3: lrclib
  try{
    const r = await fetch(
      `https://lrclib.net/api/search?q=${encodeURIComponent(t+" "+a)}`,
      {signal: AbortSignal.timeout(6000)}
    );
    if(r.ok){
      const results = await r.json();
      const match = results.find(x=>x.plainLyrics);
      if(match?.plainLyrics && match.plainLyrics.length > 30) return match.plainLyrics;
    }
  }catch{}

  return null;
}

// ─── API ─────────────────────────────────────────────────────────────────────
async function apiSearch(query, maxResults=20){
  const key=localStorage.getItem("yt_api_key");
  if(!key) throw new Error("NO_KEY");
  const sr=await fetch(`${BASE}/search?key=${key}&q=${encodeURIComponent(query)}&part=snippet&type=video&videoCategoryId=10&maxResults=${maxResults}`).then(r=>r.json());
  if(sr.error) throw new Error(sr.error.message);
  const ids=sr.items.map(i=>i.id.videoId).join(",");
  const dr=await fetch(`${BASE}/videos?key=${key}&id=${ids}&part=contentDetails,statistics`).then(r=>r.json());
  const dm={}; (dr.items||[]).forEach(i=>(dm[i.id]=i));
  return sr.items.map(item=>{
    const d=dm[item.id.videoId]||{};
    const dur=parseDuration(d.contentDetails?.duration);
    return {
      id:item.id.videoId,
      title:item.snippet.title,
      channel:item.snippet.channelTitle,
      thumb:item.snippet.thumbnails?.high?.url||item.snippet.thumbnails?.default?.url,
      duration:dur, durationFmt:fmtTime(dur),
      views:fmtViews(d.statistics?.viewCount)
    };
  });
}
async function apiTrending(maxResults=20){
  const key=localStorage.getItem("yt_api_key");
  if(!key) throw new Error("NO_KEY");
  const r=await fetch(`${BASE}/videos?key=${key}&part=snippet,contentDetails,statistics&chart=mostPopular&videoCategoryId=10&maxResults=${maxResults}&regionCode=US`).then(r=>r.json());
  if(r.error) throw new Error(r.error.message);
  return r.items.map(item=>{
    const dur=parseDuration(item.contentDetails?.duration);
    return {
      id:item.id,
      title:item.snippet.title,
      channel:item.snippet.channelTitle,
      thumb:item.snippet.thumbnails?.high?.url||item.snippet.thumbnails?.default?.url,
      duration:dur, durationFmt:fmtTime(dur),
      views:fmtViews(item.statistics?.viewCount)
    };
  });
}

const LS={
  get:(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d;}catch{return d;}},
  set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch{}}
};

const QUICK=["Top hits 2024","Lo-fi chill","Workout beats","Pop classics","Hip hop","Acoustic","Electronic","Jazz","Indie rock","K-Pop"];
const statsData=[
  {label:"Total Streams",value:"2.4M",delta:"+18%",up:true,Icon:Activity,color:"#7c3aed"},
  {label:"Listeners",   value:"84.3K",delta:"+6.7%",up:true,Icon:Users,  color:"#06b6d4"},
  {label:"Revenue",     value:"$12,840",delta:"+24%",up:true,Icon:TrendingUp,color:"#10b981"},
  {label:"Avg. Session",value:"34m",  delta:"-2.3%",up:false,Icon:Zap,   color:"#f59e0b"},
];
const barH=[38,62,50,78,68,92,55];
const days=["M","T","W","T","F","S","S"];
const navItems=[
  {id:"home",   Icon:LayoutDashboard, label:"Dashboard"},
  {id:"search", Icon:Search,          label:"Search"},
  {id:"library",Icon:Library,         label:"Library"},
  {id:"artists",Icon:Mic2,            label:"Artists"},
];

// ─── GLASS CARD ──────────────────────────────────────────────────────────────
function GCard({children,style={},glow,hover=true,onClick}){
  return(
    <motion.div variants={scaleIn}
      whileHover={hover?{scale:1.012,transition:{duration:0.2}}:{}}
      onClick={onClick}
      style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:24,
        backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",
        position:"relative",overflow:"hidden",cursor:onClick?"pointer":"default",...style}}>
      {glow&&<div style={{position:"absolute",top:-40,right:-40,width:120,height:120,borderRadius:"50%",
        background:`radial-gradient(circle,${glow}25 0%,transparent 70%)`,pointerEvents:"none"}}/>}
      {children}
    </motion.div>
  );
}

// ─── PILL BUTTON ─────────────────────────────────────────────────────────────
function Pill({children,primary,small,onClick,icon:Icon,disabled,style={}}){
  return(
    <motion.button whileHover={{scale:disabled?1:1.04}} whileTap={{scale:disabled?1:0.96}}
      onClick={onClick} disabled={disabled}
      style={{display:"inline-flex",alignItems:"center",gap:6,
        padding:small?"7px 16px":"11px 24px",borderRadius:999,
        border:primary?"none":`1px solid ${T.border}`,
        background:primary?`linear-gradient(135deg,#7c3aed,#5b21b6)`:T.surface,
        color:"#fff",fontSize:small?12:13,fontWeight:600,cursor:disabled?"not-allowed":"pointer",
        opacity:disabled?0.5:1,boxShadow:primary?`0 0 20px ${T.accentGlow}`:"none",
        backdropFilter:"blur(10px)",fontFamily:"inherit",letterSpacing:0.2,...style}}>
      {Icon&&<Icon size={small?13:15}/>}{children}
    </motion.button>
  );
}

// ─── MINI BAR CHART ──────────────────────────────────────────────────────────
function MiniBar(){
  return(
    <div style={{display:"flex",alignItems:"flex-end",gap:5,height:72}}>
      {barH.map((h,i)=>(
        <motion.div key={i} initial={{scaleY:0,originY:1}} animate={{scaleY:1}}
          transition={{delay:0.5+i*0.06,duration:0.45,ease:"easeOut"}}
          style={{flex:1,height:`${h}%`,borderRadius:5,
            background:i===5?`linear-gradient(180deg,#7c3aed,#a78bfa)`:"rgba(124,58,237,0.2)",
            border:i===5?"1px solid rgba(167,139,250,0.3)":"1px solid rgba(124,58,237,0.1)",
            transformOrigin:"bottom"}}/>
      ))}
    </div>
  );
}

// ─── STAT CARD ───────────────────────────────────────────────────────────────
function StatCard({s}){
  const {Icon}=s;
  return(
    <GCard glow={s.color}>
      <div style={{padding:"22px 22px 18px"}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:14}}>
          <div style={{width:42,height:42,borderRadius:13,background:`${s.color}18`,
            border:`1px solid ${s.color}28`,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <Icon size={18} color={s.color}/>
          </div>
          <span style={{fontSize:11,fontWeight:700,
            color:s.up?"#10b981":"#ef4444",
            background:s.up?"rgba(16,185,129,0.12)":"rgba(239,68,68,0.12)",
            padding:"2px 8px",borderRadius:999}}>{s.delta}</span>
        </div>
        <div style={{fontSize:26,fontWeight:800,color:"#fff",letterSpacing:-1,lineHeight:1}}>{s.value}</div>
        <div style={{fontSize:12,color:T.text2,marginTop:5}}>{s.label}</div>
      </div>
      <div style={{height:3,background:`linear-gradient(90deg,${s.color}50,transparent)`}}/>
    </GCard>
  );
}

// ─── TRACK ROW ───────────────────────────────────────────────────────────────
function TrackRow({video,index,isActive,isPlaying,onPlay,onLike,liked,onAdd,onArtist}){
  return(
    <motion.div className="track-row" onClick={onPlay}
      whileHover={{backgroundColor:"rgba(124,58,237,0.07)"}}
      style={{display:"grid",gridTemplateColumns:"32px 44px 1fr auto auto",
        alignItems:"center",gap:12,padding:"8px 10px",borderRadius:10,cursor:"pointer",
        background:isActive?"rgba(124,58,237,0.1)":"transparent",transition:"background 0.15s"}}>
      <span style={{fontSize:12,color:isActive?T.accentLight:T.text3,textAlign:"center",
        display:"flex",alignItems:"center",justifyContent:"center"}}>
        {isActive?(isPlaying?<Music size={13} color={T.accentLight}/>:"❙❙"):index}
      </span>
      <img src={video.thumb} alt="" style={{width:44,height:44,borderRadius:8,objectFit:"cover",background:T.bg2}}/>
      <div style={{overflow:"hidden"}}>
        <p style={{fontSize:13,fontWeight:500,color:isActive?T.accentLight:"#fff",
          whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",marginBottom:2}}>{video.title}</p>
        <p style={{fontSize:11,color:T.text2,display:"flex",alignItems:"center",gap:4}}>
          {onArtist
            ?<button onClick={e=>{e.stopPropagation();onArtist();}}
                style={{background:"none",border:"none",color:T.text2,fontSize:11,cursor:"pointer",
                  fontFamily:"inherit",padding:0,transition:"color 0.15s"}}
                onMouseEnter={e=>e.target.style.color="#fff"}
                onMouseLeave={e=>e.target.style.color=T.text2}>
                {video.channel}
              </button>
            :video.channel}
          {video.views&&<span style={{color:T.text3}}>· {video.views}</span>}
        </p>
      </div>
      <span style={{fontSize:11,color:T.text3,fontVariantNumeric:"tabular-nums"}}>{video.durationFmt}</span>
      <div className="track-actions" style={{display:"flex",gap:2,opacity:0,transition:"opacity 0.15s"}}>
        <button onClick={e=>{e.stopPropagation();onLike();}}
          style={{background:"none",border:"none",cursor:"pointer",
            color:liked?"#f43f5e":T.text3,padding:6,display:"flex"}}>
          <Heart size={14} fill={liked?"#f43f5e":"none"} color={liked?"#f43f5e":T.text3}/>
        </button>
        <button onClick={e=>{e.stopPropagation();onAdd();}}
          style={{background:"none",border:"none",cursor:"pointer",color:T.text3,padding:6,display:"flex"}}>
          <Plus size={14}/>
        </button>
      </div>
    </motion.div>
  );
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────
function Sidebar({view,setView,collapsed,setCollapsed,playlists,liked,selectedPlaylist,setSelectedPlaylist,setShowCreatePlaylist}){
  return(
    <motion.aside animate={{width:collapsed?68:228}} transition={{duration:0.28,ease:[0.25,0.46,0.45,0.94]}}
      style={{height:"100vh",position:"fixed",left:0,top:0,
        background:"rgba(9,9,20,0.95)",backdropFilter:"blur(28px)",WebkitBackdropFilter:"blur(28px)",
        borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",
        zIndex:200,overflow:"hidden"}}>
      {/* Logo */}
      <div style={{padding:"20px 16px 18px",borderBottom:`1px solid ${T.border}`,
        display:"flex",alignItems:"center",justifyContent:"space-between",minHeight:64}}>
        <div style={{display:"flex",alignItems:"center",gap:10,overflow:"hidden"}}>
          <div style={{width:34,height:34,borderRadius:10,flexShrink:0,
            background:"linear-gradient(135deg,#7c3aed,#a78bfa)",
            display:"flex",alignItems:"center",justifyContent:"center"}}>
            <Sparkles size={16} color="#fff"/>
          </div>
          <AnimatePresence>
            {!collapsed&&(
              <motion.span initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-8}}
                style={{fontSize:17,fontWeight:800,color:"#fff",letterSpacing:-0.5,whiteSpace:"nowrap"}}>
                Vibecore
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        {!collapsed&&(
          <motion.button whileTap={{scale:0.9}} onClick={()=>setCollapsed(true)}
            style={{background:"none",border:"none",cursor:"pointer",color:T.text3,padding:4,display:"flex",flexShrink:0}}>
            <X size={15}/>
          </motion.button>
        )}
      </div>
      {/* Nav */}
      <nav style={{padding:"12px 10px",display:"flex",flexDirection:"column",gap:3}}>
        {navItems.map(item=>{
          const active=view===item.id||(item.id==="library"&&["library","playlist","liked"].includes(view));
          return(
            <motion.button key={item.id} whileTap={{scale:0.97}}
              onClick={()=>{setView(item.id);if(collapsed)setCollapsed(false);}}
              style={{display:"flex",alignItems:"center",gap:12,
                padding:collapsed?"11px":"10px 13px",borderRadius:11,border:"none",
                background:active?T.accentSoft:"transparent",
                color:active?T.accentLight:T.text2,
                fontSize:13,fontWeight:active?600:500,cursor:"pointer",
                justifyContent:collapsed?"center":"flex-start",
                fontFamily:"inherit",position:"relative",transition:"all 0.15s"}}>
              {active&&<motion.div layoutId="nav-pill"
                style={{position:"absolute",left:0,top:"50%",transform:"translateY(-50%)",
                  width:3,height:18,borderRadius:2,
                  background:`linear-gradient(180deg,#7c3aed,#a78bfa)`}}/>}
              <item.Icon size={17}/>
              <AnimatePresence>
                {!collapsed&&(
                  <motion.span initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                    style={{whiteSpace:"nowrap"}}>{item.label}</motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </nav>
      {/* Playlists */}
      <AnimatePresence>
        {!collapsed&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            style={{flex:1,overflow:"hidden auto",padding:"0 10px"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
              padding:"12px 4px 8px",fontSize:10,fontWeight:700,letterSpacing:1.5,color:T.text3}}>
              <span>PLAYLISTS</span>
              <motion.button whileTap={{scale:0.9}} onClick={()=>setShowCreatePlaylist(true)}
                style={{background:"none",border:"none",cursor:"pointer",color:T.text3,padding:2,display:"flex"}}
                onMouseEnter={e=>e.currentTarget.style.color=T.accentLight}
                onMouseLeave={e=>e.currentTarget.style.color=T.text3}>
                <Plus size={14}/>
              </motion.button>
            </div>
            {playlists.map(pl=>(
              <button key={pl.id}
                onClick={()=>{setSelectedPlaylist(pl);setView("playlist");}}
                style={{display:"block",width:"100%",textAlign:"left",background:"none",border:"none",
                  color:selectedPlaylist?.id===pl.id&&view==="playlist"?T.accentLight:T.text2,
                  fontSize:12,padding:"6px 8px",borderRadius:8,cursor:"pointer",
                  overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",
                  transition:"all 0.15s",fontFamily:"inherit"}}>
                ♪ {pl.name}
              </button>
            ))}
            {liked.length>0&&(
              <button onClick={()=>setView("liked")}
                style={{display:"block",width:"100%",textAlign:"left",background:"none",border:"none",
                  color:view==="liked"?T.accentLight:T.text2,fontSize:12,padding:"6px 8px",
                  borderRadius:8,cursor:"pointer",transition:"all 0.15s",fontFamily:"inherit"}}>
                ♥ Liked Songs
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      {/* Sign out */}
      <div style={{padding:"12px 10px",borderTop:`1px solid ${T.border}`}}>
        <motion.button whileTap={{scale:0.95}}
          onClick={()=>{localStorage.removeItem("yt_api_key");window.location.reload();}}
          style={{display:"flex",alignItems:"center",gap:10,padding:collapsed?"10px":"9px 12px",
            borderRadius:10,border:"none",background:"none",color:T.text3,
            fontSize:12,cursor:"pointer",width:"100%",justifyContent:collapsed?"center":"flex-start",
            fontFamily:"inherit",transition:"color 0.15s"}}
          onMouseEnter={e=>e.currentTarget.style.color="#ef4444"}
          onMouseLeave={e=>e.currentTarget.style.color=T.text3}>
          <LogOut size={15}/>
          {!collapsed&&<span>Reset API Key</span>}
        </motion.button>
      </div>
    </motion.aside>
  );
}

// ─── TOP BAR ─────────────────────────────────────────────────────────────────
function TopBar({collapsed,setCollapsed,setView}){
  return(
    <div style={{position:"fixed",top:0,right:0,left:collapsed?68:228,height:64,zIndex:100,
      background:"rgba(9,9,20,0.85)",backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",
      borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",
      padding:"0 24px",gap:14,transition:"left 0.28s cubic-bezier(0.25,0.46,0.45,0.94)"}}>
      <motion.button whileTap={{scale:0.9}} onClick={()=>setCollapsed(c=>!c)}
        style={{background:"none",border:"none",cursor:"pointer",color:T.text2,padding:6,
          borderRadius:8,display:"flex"}}>
        <Menu size={17}/>
      </motion.button>
      <div style={{flex:1,maxWidth:380,display:"flex",alignItems:"center",gap:9,
        background:"rgba(255,255,255,0.05)",border:`1px solid ${T.border}`,
        borderRadius:12,padding:"8px 14px",cursor:"pointer"}}
        onClick={()=>setView("search")}>
        <Search size={14} color={T.text3}/>
        <span style={{fontSize:13,color:T.text3}}>Search music...</span>
      </div>
      <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:10}}>
        <Pill small primary icon={Sparkles} onClick={()=>{}}>Pro</Pill>
        <div style={{width:34,height:34,borderRadius:10,
          background:"linear-gradient(135deg,#7c3aed,#a78bfa)",
          display:"flex",alignItems:"center",justifyContent:"center",
          fontSize:14,fontWeight:700,color:"#fff",cursor:"pointer",userSelect:"none"}}>
          V
        </div>
      </div>
    </div>
  );
}

// ─── LYRICS PANEL (desktop) ──────────────────────────────────────────────────
function LyricsPanel({current,lyrics,lyricsLoading,onClose}){
  return(
    <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:10}}
      style={{position:"absolute",bottom:"100%",left:"50%",transform:"translateX(-50%)",
        width:"min(420px,95vw)",maxHeight:460,background:"rgba(14,14,26,0.99)",
        border:`1px solid ${T.border}`,borderRadius:"16px 16px 0 0",
        overflow:"hidden",boxShadow:"0 -8px 40px rgba(0,0,0,0.7)",zIndex:10}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
        padding:"14px 16px",borderBottom:`1px solid ${T.border}`,fontSize:14,fontWeight:600}}>
        <span style={{display:"flex",alignItems:"center",gap:6}}><Music size={14}/> Lyrics</span>
        <motion.button whileTap={{scale:0.9}} onClick={onClose}
          style={{background:"none",border:"none",cursor:"pointer",color:T.text3,display:"flex"}}>
          <X size={15}/>
        </motion.button>
      </div>
      <div style={{overflowY:"auto",padding:"18px 20px",maxHeight:400}}>
        {lyricsLoading?(
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:12,padding:"30px 0",color:T.text2}}>
            <div style={{width:28,height:28,border:"3px solid rgba(255,255,255,0.1)",
              borderTopColor:T.accent,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
            <p style={{fontSize:13}}>Searching lyrics...</p>
          </div>
        ):(
          <>
            <p style={{fontSize:15,fontWeight:700,marginBottom:3,color:"#fff"}}>{current.title}</p>
            <p style={{fontSize:12,color:T.text3,marginBottom:18}}>{current.channel}</p>
            {lyrics && lyrics !== "NOT_FOUND" ? (
              <pre style={{fontSize:13,lineHeight:1.9,color:T.text2,whiteSpace:"pre-wrap"}}>{lyrics}</pre>
            ):(
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:10,
                padding:"24px 0",color:T.text2,textAlign:"center"}}>
                <AlertCircle size={28} color={T.text3}/>
                <p style={{fontSize:13}}>Lyrics not found for this track.</p>
                <p style={{fontSize:11,color:T.text3}}>Try searching on Genius or AZLyrics.</p>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App(){
  // Auth
  const [apiKey,setApiKey]       = useState(localStorage.getItem("yt_api_key")||"");
  const [keyInput,setKeyInput]   = useState("");
  const [keyError,setKeyError]   = useState("");
  const [showApiSetup,setShowApiSetup] = useState(!localStorage.getItem("yt_api_key"));

  // UI
  const [view,setView]           = useState("home");
  const [collapsed,setCollapsed] = useState(false);
  const [isMobile,setIsMobile]   = useState(window.innerWidth<=900);
  const [selectedPlaylist,setSelectedPlaylist] = useState(null);
  const [selectedArtist,setSelectedArtist]     = useState(null);
  const [artistSongs,setArtistSongs]           = useState([]);
  const [artistLoading,setArtistLoading]       = useState(false);

  // Player state
  const [current,setCurrent]     = useState(null);
  const [queue,setQueue]         = useState([]);
  const [queueIdx,setQueueIdx]   = useState(0);
  const [playing,setPlaying]     = useState(false);
  const [progress,setProgress]   = useState(0);
  const [duration,setDuration]   = useState(0);
  const [volume,setVolume]       = useState(80);
  const [muted,setMuted]         = useState(false);
  const [repeat,setRepeat]       = useState("off");
  const [shuffle,setShuffle]     = useState(false);
  const [showQueue,setShowQueue] = useState(false);
  const [showMobilePlayer,setShowMobilePlayer] = useState(false);
  const [mobileTab,setMobileTab] = useState("cover");
  const [lyrics,setLyrics]       = useState(null);
  const [lyricsLoading,setLyricsLoading] = useState(false);
  const [showLyrics,setShowLyrics]       = useState(false);
  const [bgColor,setBgColor]     = useState("124,58,237");

  // Playback error / retry
  const [playError,setPlayError]   = useState(false);
  const retryCount                 = useRef(0);
  const retryTimer                 = useRef(null);

  // Library
  const [playlists,setPlaylists] = useState(()=>LS.get("playlists",[]));
  const [liked,setLiked]         = useState(()=>LS.get("liked",[]));
  const [recent,setRecent]       = useState(()=>LS.get("recent",[]));
  const [showCreatePlaylist,setShowCreatePlaylist] = useState(false);
  const [newPLName,setNewPLName] = useState("");
  const [showAddTo,setShowAddTo] = useState(null);

  // Data
  const [trending,setTrending]           = useState([]);
  const [trendingLoading,setTrendingLoading] = useState(false);
  const [suggestions,setSuggestions]     = useState([]);
  const [searchQ,setSearchQ]             = useState("");
  const [searchResults,setSearchResults] = useState([]);
  const [searching,setSearching]         = useState(false);
  const [searchError,setSearchError]     = useState("");

  const ytRef           = useRef(null);
  const progressInterval= useRef(null);
  const adCheckInterval = useRef(null);
  const searchTimeout   = useRef(null);
  const touchStartX     = useRef(0);
  const touchStartY     = useRef(0);

  // ── Responsive ─────────────────────────────────────────────────────────────
  useEffect(()=>{
    function onResize(){
      const mobile = window.innerWidth<=900;
      setIsMobile(mobile);
      if(mobile) setCollapsed(true);
    }
    onResize();
    window.addEventListener("resize",onResize);
    return ()=>window.removeEventListener("resize",onResize);
  },[]);

  // ── Persist ─────────────────────────────────────────────────────────────────
  useEffect(()=>{LS.set("playlists",playlists);},[playlists]);
  useEffect(()=>{LS.set("liked",liked);},[liked]);
  useEffect(()=>{LS.set("recent",recent);},[recent]);

  // ── Load trending ───────────────────────────────────────────────────────────
  useEffect(()=>{
    if(view==="home"&&apiKey&&trending.length===0){
      setTrendingLoading(true);
      apiTrending(20).then(setTrending).catch(()=>{}).finally(()=>setTrendingLoading(false));
    }
  },[view,apiKey,trending.length]);

  // ── Suggestions ─────────────────────────────────────────────────────────────
  const loadSuggestions = useCallback(async()=>{
    try{
      const seeds=[...new Set(recent.slice(0,3).map(v=>extractArtist(v.title,v.channel)))];
      const res=await apiSearch(seeds.slice(0,2).join(" ")+" similar songs",12);
      const ids=new Set(recent.map(v=>v.id));
      setSuggestions(res.filter(v=>!ids.has(v.id)).slice(0,8));
    }catch{}
  },[recent]);

  useEffect(()=>{
    if(view==="home"&&apiKey&&recent.length>0&&suggestions.length===0) loadSuggestions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[view,apiKey,recent.length]);

  // ── Dynamic bg ──────────────────────────────────────────────────────────────
  useEffect(()=>{ if(current?.thumb) getDominantColor(current.thumb,setBgColor); },[current?.thumb]);

  // ── Lyrics: fetch when panel opened or tab changed ──────────────────────────
  useEffect(()=>{
    if(!current) return;
    const shouldFetch = (showLyrics || mobileTab==="lyrics");
    if(!shouldFetch) return;
    if(lyrics!==null) return; // already fetched for this track
    setLyricsLoading(true);
    const artist = extractArtist(current.title, current.channel);
    fetchLyrics(current.title, artist)
      .then(l=>setLyrics(l||"NOT_FOUND"))
      .catch(()=>setLyrics("NOT_FOUND"))
      .finally(()=>setLyricsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[current?.id, showLyrics, mobileTab]);

  // ── Progress ticker ─────────────────────────────────────────────────────────
  useEffect(()=>{
    clearInterval(progressInterval.current);
    if(playing) progressInterval.current=setInterval(()=>{
      setProgress(ytRef.current?.getCurrentTime?.()||0);
      setDuration(ytRef.current?.getDuration?.()||0);
    },500);
    return()=>clearInterval(progressInterval.current);
  },[playing]);

  // ── Ad skip ─────────────────────────────────────────────────────────────────
  useEffect(()=>{
    clearInterval(adCheckInterval.current);
    if(playing) adCheckInterval.current=setInterval(()=>{
      try{
        const dur=ytRef.current?.getDuration?.()||0;
        const pos=ytRef.current?.getCurrentTime?.()||0;
        if(dur>0&&dur<35&&pos>5) ytRef.current?.seekTo(dur-0.1,true);
      }catch{}
    },2000);
    return()=>clearInterval(adCheckInterval.current);
  },[playing]);

  // ──────────────────────────────────────────────────────────────────────────
  // PLAYER FUNCTIONS
  // ──────────────────────────────────────────────────────────────────────────
  function playVideo(video, playlist=null, idx=0){
    clearTimeout(retryTimer.current);
    retryCount.current = 0;
    setPlayError(false);
    if(playlist){setQueue(playlist);setQueueIdx(idx);}
    else{setQueue([video]);setQueueIdx(0);}
    setCurrent(video);
    setPlaying(true);
    setLyrics(null);
    setLyricsLoading(false);
    setRecent(r=>[video,...r.filter(v=>v.id!==video.id)].slice(0,50));
    setSuggestions([]);
  }

  function togglePlay(){
    if(!ytRef.current) return;
    if(playing){ytRef.current.pauseVideo();setPlaying(false);}
    else{ytRef.current.playVideo();setPlaying(true);}
  }

  function skipNext(fromError=false){
    if(queue.length<1) return;
    clearTimeout(retryTimer.current);
    retryCount.current = 0;
    setPlayError(false);
    const n=shuffle
      ?Math.floor(Math.random()*queue.length)
      :(queueIdx+1)%queue.length;
    setQueueIdx(n);
    setCurrent(queue[n]);
    setPlaying(true);
    setLyrics(null);
    setLyricsLoading(false);
  }

  function skipPrev(){
    if(progress>3){ytRef.current?.seekTo(0,true);return;}
    clearTimeout(retryTimer.current);
    retryCount.current=0;
    setPlayError(false);
    const p=(queueIdx-1+queue.length)%queue.length;
    setQueueIdx(p);
    setCurrent(queue[p]);
    setPlaying(true);
    setLyrics(null);
    setLyricsLoading(false);
  }

  function onEnd(){
    if(repeat==="one"){ytRef.current?.seekTo(0,true);ytRef.current?.playVideo();return;}
    if(repeat==="all"||queueIdx<queue.length-1) skipNext();
    else setPlaying(false);
  }

  // ── Auto-retry on playback error (state 5=cued/unstarted after error) ───────
  // YouTube player state -1=unstarted, 0=ended, 1=playing, 2=paused, 3=buffering, 5=cued
  function handlePlayerStateChange(e){
    if(e.data===1){ setPlaying(true); setPlayError(false); retryCount.current=0; }
    if(e.data===2){ setPlaying(false); }
    if(e.data===0){ onEnd(); }
  }

  function handlePlayerError(e){
    // Error codes 2,5,100,101,150 = video unavailable / not embeddable
    console.warn("YT error code:", e.data);
    if(retryCount.current < 3){
      retryCount.current++;
      // Small delay then re-trigger play
      retryTimer.current = setTimeout(()=>{
        try{ ytRef.current?.playVideo(); }catch{}
      }, 800 * retryCount.current);
    } else {
      setPlayError(true);
      setPlaying(false);
      // Auto-skip to next if in a queue
      if(queue.length > 1){
        retryTimer.current = setTimeout(()=>skipNext(true), 1500);
      }
    }
  }

  function handlePlayerReady(e){
    ytRef.current = e.target;
    e.target.setVolume(volume);
    // Attempt to play immediately
    try{ e.target.playVideo(); }catch{}
    // Safety retry in case first attempt ignored (common on mobile)
    setTimeout(()=>{
      try{
        if(ytRef.current?.getPlayerState?.()!==1){
          ytRef.current?.playVideo();
        }
      }catch{}
    }, 1000);
  }

  function seekTo(pct){ const t=(pct/100)*duration; ytRef.current?.seekTo(t,true); setProgress(t); }
  function onVol(v){ setVolume(v);setMuted(v===0); ytRef.current?.setVolume(v); if(v===0) ytRef.current?.mute(); else ytRef.current?.unMute(); }
  function toggleMute(){ if(muted){ytRef.current?.unMute();ytRef.current?.setVolume(volume);setMuted(false);}else{ytRef.current?.mute();setMuted(true);} }

  // ── Library ─────────────────────────────────────────────────────────────────
  const isLiked = useCallback(id=>liked.some(v=>v.id===id),[liked]);
  function toggleLike(video){ setLiked(l=>isLiked(video.id)?l.filter(v=>v.id!==video.id):[video,...l]); }
  function createPlaylist(name){ if(!name.trim()) return; setPlaylists(p=>[...p,{id:`pl_${Date.now()}`,name,videos:[],cover:null}]); setNewPLName("");setShowCreatePlaylist(false); }
  function deletePlaylist(id){ setPlaylists(p=>p.filter(pl=>pl.id!==id)); }
  function addToPlaylist(plId,video){ setPlaylists(p=>p.map(pl=>pl.id===plId?{...pl,videos:pl.videos.some(v=>v.id===video.id)?pl.videos:[...pl.videos,video],cover:pl.cover||video.thumb}:pl)); setShowAddTo(null); }

  // ── Search ──────────────────────────────────────────────────────────────────
  function handleSearch(val){
    setSearchQ(val);
    clearTimeout(searchTimeout.current);
    if(val.length>2) searchTimeout.current=setTimeout(()=>doSearch(val),700);
    if(!val) setSearchResults([]);
  }
  async function doSearch(q){
    if(!q.trim()) return;
    setSearching(true); setSearchError("");
    try{ setSearchResults(await apiSearch(q)); }
    catch(e){ setSearchError(e.message==="NO_KEY"?"Set your API key first.":"Search failed: "+e.message); }
    setSearching(false);
  }

  function saveKey(){ if(!keyInput.trim()){setKeyError("Enter a key");return;} localStorage.setItem("yt_api_key",keyInput.trim()); setApiKey(keyInput.trim());setShowApiSetup(false);setKeyError(""); }

  async function openArtist(name,thumb){
    setSelectedArtist({name,thumb});
    setView("artist");
    setArtistLoading(true);
    try{ setArtistSongs(await apiSearch(`${cleanArtist(name)} official music`,20)); }
    catch{ setArtistSongs([]); }
    setArtistLoading(false);
  }

  // ── Touch swipe ─────────────────────────────────────────────────────────────
  function onTouchStart(e){ touchStartX.current=e.touches[0].clientX; touchStartY.current=e.touches[0].clientY; }
  function onTouchEnd(e){
    const dx=e.changedTouches[0].clientX-touchStartX.current;
    const dy=Math.abs(e.changedTouches[0].clientY-touchStartY.current);
    if(Math.abs(dx)>50&&dy<80) setMobileTab(dx<0?"lyrics":"cover");
  }

  // ── Derived ─────────────────────────────────────────────────────────────────
  const pct    = duration>0?(progress/duration)*100:0;
  const sideW  = isMobile ? 0 : (collapsed?68:228);

  const artistMap={};
  [...trending,...recent].forEach(v=>{
    if(!artistMap[v.channel]) artistMap[v.channel]={name:v.channel,thumb:v.thumb,count:0};
    artistMap[v.channel].count++;
  });
  const artistCards=Object.values(artistMap).sort((a,b)=>b.count-a.count).slice(0,12);
  const dynStyle={"--dr":bgColor.split(",")[0],"--dg":bgColor.split(",")[1],"--db":bgColor.split(",")[2]};

  return(
    <div style={{minHeight:"100vh",background:T.bg,
      fontFamily:"'Plus Jakarta Sans','DM Sans',system-ui,sans-serif",color:"#fff",...dynStyle}}>

      <div className="orb1"/><div className="orb2"/>

      {/* ── HIDDEN YOUTUBE PLAYER ──────────────────────────────────────────────
          Use visibility:hidden NOT left:-9999/opacity:0.
          Off-screen iframes break YouTube postMessage origin checks.
          visibility:hidden keeps the iframe in DOM so the YouTube JS API
          cross-origin communication works without errors.                */}
      {current&&(
        <div style={{
          position:"fixed",bottom:0,left:0,
          width:1,height:1,
          visibility:"hidden",
          pointerEvents:"none",
          zIndex:-1
        }}>
          <YouTube
            key={current.id}
            videoId={current.id}
            onReady={handlePlayerReady}
            onStateChange={handlePlayerStateChange}
            onError={handlePlayerError}
            opts={{
              height:"1",width:"1",
              playerVars:{
                autoplay:1,
                controls:0,
                rel:0,
                playsinline:1,
                enablejsapi:1,
                modestbranding:1,
              }
            }}
          />
        </div>
      )}

      {/* ══ API KEY MODAL ══ */}
      <AnimatePresence>
        {showApiSetup&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",display:"flex",
              alignItems:"center",justifyContent:"center",zIndex:1000,backdropFilter:"blur(8px)"}}>
            <motion.div initial={{scale:0.9,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.9,opacity:0}}
              style={{background:"rgba(14,14,26,0.99)",border:`1px solid ${T.border}`,borderRadius:24,
                padding:"36px 32px",maxWidth:440,width:"92%",textAlign:"center"}}>
              <div style={{width:56,height:56,borderRadius:18,background:"rgba(124,58,237,0.15)",
                border:"1px solid rgba(124,58,237,0.3)",display:"flex",alignItems:"center",
                justifyContent:"center",margin:"0 auto 20px"}}>
                <Key size={24} color={T.accentLight}/>
              </div>
              <h2 style={{fontSize:24,fontWeight:800,color:"#fff",marginBottom:8,letterSpacing:-0.5}}>YouTube API Key</h2>
              <p style={{fontSize:13,color:T.text2,lineHeight:1.6,marginBottom:24}}>Free · 10,000 units/day. Get yours from Google Cloud Console.</p>
              <div style={{background:"rgba(255,255,255,0.03)",borderRadius:14,padding:16,marginBottom:20,textAlign:"left"}}>
                {[["1","Go to console.cloud.google.com"],["2","New project → Enable YouTube Data API v3"],["3","Credentials → Create API Key"],["4","Paste your key below"]].map(([n,t])=>(
                  <div key={n} style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:10,fontSize:13,color:T.text2}}>
                    <span style={{width:22,height:22,borderRadius:"50%",background:"rgba(124,58,237,0.15)",
                      color:T.accentLight,fontSize:11,fontWeight:700,display:"flex",alignItems:"center",
                      justifyContent:"center",flexShrink:0}}>{n}</span>
                    <span>{t}</span>
                  </div>
                ))}
              </div>
              <input value={keyInput} onChange={e=>setKeyInput(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&saveKey()} placeholder="AIza..." autoFocus
                style={{width:"100%",background:"rgba(255,255,255,0.05)",border:`1px solid ${T.border}`,
                  borderRadius:12,padding:"11px 15px",color:"#fff",fontSize:14,outline:"none",marginBottom:8}}/>
              {keyError&&<p style={{fontSize:12,color:"#ef4444",marginBottom:8}}>{keyError}</p>}
              <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={saveKey}
                style={{width:"100%",background:"linear-gradient(135deg,#7c3aed,#5b21b6)",border:"none",
                  borderRadius:12,color:"#fff",fontSize:15,fontWeight:700,padding:"13px",cursor:"pointer",
                  boxShadow:`0 0 24px ${T.accentGlow}`,marginBottom:12,fontFamily:"inherit"}}>
                Save & Start →
              </motion.button>
              <p style={{fontSize:11,color:T.text3}}>Stored only in your browser.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ ADD TO PLAYLIST MODAL ══ */}
      <AnimatePresence>
        {showAddTo&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            onClick={()=>setShowAddTo(null)}
            style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",
              alignItems:"center",justifyContent:"center",zIndex:900,backdropFilter:"blur(6px)"}}>
            <motion.div initial={{scale:0.92,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.92,opacity:0}}
              onClick={e=>e.stopPropagation()}
              style={{background:"rgba(14,14,26,0.99)",border:`1px solid ${T.border}`,borderRadius:20,
                padding:24,maxWidth:340,width:"92%"}}>
              <h3 style={{fontSize:17,fontWeight:700,marginBottom:6}}>Add to Playlist</h3>
              <p style={{fontSize:12,color:T.text2,marginBottom:16,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{showAddTo.title}</p>
              {playlists.length===0
                ?<div style={{textAlign:"center",padding:"20px 0"}}>
                    <p style={{color:T.text2,fontSize:13,marginBottom:12}}>No playlists yet.</p>
                    <Pill small primary onClick={()=>{setShowAddTo(null);setShowCreatePlaylist(true);}}>Create one</Pill>
                  </div>
                :<div style={{display:"flex",flexDirection:"column",gap:4,maxHeight:240,overflowY:"auto",marginBottom:12}}>
                    {playlists.map(pl=>(
                      <motion.button key={pl.id} whileHover={{background:"rgba(124,58,237,0.1)"}}
                        onClick={()=>addToPlaylist(pl.id,showAddTo)}
                        style={{display:"flex",alignItems:"center",gap:10,background:"rgba(255,255,255,0.04)",
                          border:`1px solid ${T.border}`,borderRadius:10,padding:"9px 12px",
                          color:"#fff",fontSize:13,cursor:"pointer",textAlign:"left",fontFamily:"inherit"}}>
                        <Music size={14} color={T.accentLight}/>
                        <span style={{flex:1}}>{pl.name}</span>
                        <span style={{fontSize:11,color:T.text3}}>{pl.videos.length}</span>
                      </motion.button>
                    ))}
                  </div>}
              <Pill onClick={()=>setShowAddTo(null)} style={{width:"100%",justifyContent:"center"}}>Cancel</Pill>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ CREATE PLAYLIST MODAL ══ */}
      <AnimatePresence>
        {showCreatePlaylist&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            onClick={()=>setShowCreatePlaylist(false)}
            style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",
              alignItems:"center",justifyContent:"center",zIndex:900,backdropFilter:"blur(6px)"}}>
            <motion.div initial={{scale:0.92,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.92,opacity:0}}
              onClick={e=>e.stopPropagation()}
              style={{background:"rgba(14,14,26,0.99)",border:`1px solid ${T.border}`,borderRadius:20,padding:24,maxWidth:340,width:"92%"}}>
              <h3 style={{fontSize:17,fontWeight:700,marginBottom:16}}>New Playlist</h3>
              <input autoFocus placeholder="Playlist name..." value={newPLName}
                onChange={e=>setNewPLName(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&createPlaylist(newPLName)}
                style={{width:"100%",background:"rgba(255,255,255,0.05)",border:`1px solid ${T.border}`,
                  borderRadius:10,padding:"10px 14px",color:"#fff",fontSize:14,outline:"none",marginBottom:14}}/>
              <div style={{display:"flex",gap:8}}>
                <Pill onClick={()=>setShowCreatePlaylist(false)} style={{flex:1,justifyContent:"center"}}>Cancel</Pill>
                <Pill primary onClick={()=>createPlaylist(newPLName)} style={{flex:1,justifyContent:"center"}}>Create</Pill>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ MOBILE FULL PLAYER ══ */}
      <AnimatePresence>
        {showMobilePlayer&&current&&(
          <motion.div initial={{y:"100%"}} animate={{y:0}} exit={{y:"100%"}}
            transition={{type:"spring",damping:26,stiffness:280}}
            onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
            style={{position:"fixed",inset:0,zIndex:500,
              background:`linear-gradient(160deg,rgba(${bgColor},0.88) 0%,${T.bg} 50%)`,
              display:"flex",flexDirection:"column",
              padding:"env(safe-area-inset-top,20px) 24px env(safe-area-inset-bottom,20px)",
              overflow:"hidden"}}>

            {/* Header */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6,paddingTop:8}}>
              <motion.button whileTap={{scale:0.9}} onClick={()=>setShowMobilePlayer(false)}
                style={{background:"none",border:"none",cursor:"pointer",color:T.text2,display:"flex",padding:8}}>
                <ChevronDown size={26}/>
              </motion.button>
              <div style={{display:"flex",gap:3,background:"rgba(255,255,255,0.07)",borderRadius:20,padding:"3px 4px"}}>
                {["cover","lyrics"].map(tab=>(
                  <button key={tab} onClick={()=>setMobileTab(tab)}
                    style={{background:mobileTab===tab?"rgba(255,255,255,0.12)":"none",border:"none",
                      color:mobileTab===tab?"#fff":T.text2,fontSize:12,fontWeight:500,
                      padding:"5px 14px",borderRadius:16,cursor:"pointer",
                      display:"flex",alignItems:"center",gap:5,fontFamily:"inherit",transition:"all 0.15s"}}>
                    {tab==="lyrics"&&<Music size={12}/>}
                    {tab==="cover"?"Now Playing":"Lyrics"}
                  </button>
                ))}
              </div>
              <motion.button whileTap={{scale:0.9}} onClick={()=>setShowAddTo(current)}
                style={{background:"none",border:"none",cursor:"pointer",color:T.text2,display:"flex",padding:8}}>
                <Plus size={22}/>
              </motion.button>
            </div>

            {/* Tab dots */}
            <div style={{display:"flex",justifyContent:"center",gap:6,marginBottom:12}}>
              {["cover","lyrics"].map(t=>(
                <motion.div key={t} animate={{width:mobileTab===t?18:6,
                  background:mobileTab===t?T.accent:"rgba(255,255,255,0.2)"}}
                  style={{height:6,borderRadius:3}}/>
              ))}
            </div>

            {/* Cover tab */}
            {mobileTab==="cover"&&(
              <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
                <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",position:"relative",minHeight:0}}>
                  <div style={{position:"absolute",inset:0,background:`rgba(${bgColor},0.25)`,
                    filter:"blur(50px)",borderRadius:"50%",transform:"scale(0.8)"}}/>
                  <motion.img src={current.thumb} alt=""
                    style={{width:"min(280px,70vw)",aspectRatio:"1",objectFit:"cover",
                      borderRadius:20,boxShadow:"0 20px 60px rgba(0,0,0,0.6)",position:"relative",zIndex:1}}/>
                </div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:20,marginBottom:4}}>
                  <div style={{overflow:"hidden",flex:1,paddingRight:12}}>
                    <p style={{fontSize:20,fontWeight:700,color:"#fff",whiteSpace:"nowrap",
                      overflow:"hidden",textOverflow:"ellipsis",letterSpacing:-0.3}}>{current.title}</p>
                    <p style={{fontSize:13,color:T.text2,marginTop:3}}>{current.channel}</p>
                  </div>
                  <motion.button whileTap={{scale:0.85}} onClick={()=>toggleLike(current)}
                    style={{background:"none",border:"none",cursor:"pointer",flexShrink:0,padding:4}}>
                    <Heart size={22} fill={isLiked(current.id)?"#f43f5e":"none"} color={isLiked(current.id)?"#f43f5e":T.text2}/>
                  </motion.button>
                </div>
              </div>
            )}

            {/* Lyrics tab */}
            {mobileTab==="lyrics"&&(
              <div style={{flex:1,overflowY:"auto",paddingBottom:8,scrollbarWidth:"none"}}>
                {lyricsLoading?(
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:12,paddingTop:40,color:T.text2}}>
                    <div style={{width:32,height:32,border:"3px solid rgba(255,255,255,0.1)",
                      borderTopColor:T.accent,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
                    <p>Searching lyrics...</p>
                  </div>
                ):lyrics&&lyrics!=="NOT_FOUND"?(
                  <div>
                    <p style={{fontSize:16,fontWeight:700,color:"#fff",marginBottom:3}}>{current.title}</p>
                    <p style={{fontSize:12,color:T.text3,marginBottom:18}}>{current.channel}</p>
                    <pre style={{fontSize:14,lineHeight:1.9,color:T.text2,whiteSpace:"pre-wrap"}}>{lyrics}</pre>
                  </div>
                ):(
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:10,
                    paddingTop:40,color:T.text2,textAlign:"center"}}>
                    <AlertCircle size={32} color={T.text3}/>
                    <p>Lyrics not found for this track.</p>
                    <p style={{fontSize:12,color:T.text3}}>Try Genius or AZLyrics.</p>
                  </div>
                )}
              </div>
            )}

            {/* Progress */}
            <div style={{marginTop:16}}>
              <input type="range" min="0" max="100" value={pct}
                onChange={e=>seekTo(+e.target.value)}
                style={{width:"100%",accentColor:T.accent,marginBottom:4}}/>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:T.text3}}>
                <span>{fmtTime(progress)}</span><span>{fmtTime(duration)}</span>
              </div>
            </div>

            {/* Playback error notice */}
            {playError&&(
              <div style={{display:"flex",alignItems:"center",gap:8,fontSize:12,color:"#f59e0b",
                background:"rgba(245,158,11,0.1)",borderRadius:8,padding:"6px 12px",marginTop:8}}>
                <AlertCircle size={14}/>
                <span>This video can't be played. Skipping...</span>
              </div>
            )}

            {/* Controls */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:16}}>
              <motion.button whileTap={{scale:0.85}} onClick={()=>setShuffle(s=>!s)}
                style={{background:"none",border:"none",cursor:"pointer",
                  color:shuffle?T.accentLight:T.text3,display:"flex",padding:8}}>
                <Shuffle size={20}/>
              </motion.button>
              <motion.button whileTap={{scale:0.85}} onClick={skipPrev}
                style={{background:"none",border:"none",cursor:"pointer",color:"#fff",display:"flex",padding:8}}>
                <SkipBack size={28}/>
              </motion.button>
              <motion.button whileTap={{scale:0.92}} onClick={togglePlay}
                style={{width:68,height:68,borderRadius:"50%",
                  background:`linear-gradient(135deg,#7c3aed,#5b21b6)`,
                  border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
                  boxShadow:`0 0 28px ${T.accentGlow}`}}>
                {playing
                  ?<PauseCircle size={34} fill="white" color="transparent"/>
                  :<PlayCircle size={34} fill="white" color="transparent"/>}
              </motion.button>
              <motion.button whileTap={{scale:0.85}} onClick={()=>skipNext()}
                style={{background:"none",border:"none",cursor:"pointer",color:"#fff",display:"flex",padding:8}}>
                <SkipForward size={28}/>
              </motion.button>
              <motion.button whileTap={{scale:0.85}}
                onClick={()=>setRepeat(r=>r==="off"?"all":r==="all"?"one":"off")}
                style={{background:"none",border:"none",cursor:"pointer",
                  color:repeat!=="off"?T.accentLight:T.text3,display:"flex",padding:8}}>
                {repeat==="one"?<Repeat1 size={20}/>:<Repeat size={20}/>}
              </motion.button>
            </div>

            <p style={{textAlign:"center",fontSize:11,color:T.text3,marginTop:10}}>← swipe for lyrics →</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ SIDEBAR ══ */}
      {!isMobile&&(
        <Sidebar view={view} setView={setView} collapsed={collapsed} setCollapsed={setCollapsed}
          playlists={playlists} liked={liked} selectedPlaylist={selectedPlaylist}
          setSelectedPlaylist={setSelectedPlaylist} setShowCreatePlaylist={setShowCreatePlaylist}/>
      )}

      {/* ══ TOP BAR ══ */}
      <TopBar collapsed={isMobile?true:collapsed} setCollapsed={setCollapsed} setView={setView}/>

      {/* ══ MAIN CONTENT ══ */}
      <div style={{marginLeft:sideW,paddingTop:64,minHeight:"100vh",position:"relative",zIndex:1,
        paddingBottom:current?90:0,transition:"margin-left 0.28s cubic-bezier(0.25,0.46,0.45,0.94)"}}>
        <div style={{padding:"0 16px 60px",maxWidth:1400,margin:"0 auto"}}>

          {/* ════ HOME ════ */}
          {view==="home"&&(
            <motion.div initial="hidden" animate="show" variants={stagger} style={{paddingTop:28}}>

              <motion.div variants={fadeUp}
                style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",
                  flexWrap:"wrap",gap:12,marginBottom:24}}>
                <div>
                  <p style={{fontSize:11,fontWeight:600,color:T.accentLight,letterSpacing:1.2,
                    textTransform:"uppercase",marginBottom:6}}>Good morning ✦</p>
                  <h1 style={{fontSize:"clamp(24px,5vw,36px)",fontWeight:800,color:"#fff",
                    letterSpacing:-1,lineHeight:1}}>Your Dashboard</h1>
                </div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  <Pill icon={BarChart2} onClick={()=>{}}>Export</Pill>
                  <Pill primary icon={Globe} onClick={()=>{}}>Go Live</Pill>
                </div>
              </motion.div>

              {!apiKey&&(
                <motion.div variants={fadeUp}
                  style={{background:"rgba(124,58,237,0.08)",border:"1px solid rgba(124,58,237,0.25)",
                    borderRadius:14,padding:"12px 16px",marginBottom:20,
                    display:"flex",alignItems:"center",gap:12,fontSize:13,color:T.text2,flexWrap:"wrap"}}>
                  <Key size={16} color={T.accentLight}/>
                  <span>Add your YouTube API key to load music</span>
                  <Pill small primary onClick={()=>setShowApiSetup(true)} style={{marginLeft:"auto"}}>Setup →</Pill>
                </motion.div>
              )}

              {/* Stat cards — responsive grid */}
              <motion.div variants={stagger}
                style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12,marginBottom:16}}>
                {statsData.map(s=>(
                  <motion.div key={s.label} variants={scaleIn}><StatCard s={s}/></motion.div>
                ))}
              </motion.div>

              {/* Row 2: depends on screen width */}
              <div className="dash-row2" style={{display:"grid",gap:12,marginBottom:16}}>
                {/* Chart */}
                <motion.div variants={scaleIn}>
                  <GCard hover={false}>
                    <div style={{padding:"20px 20px 16px"}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                        <p style={{fontSize:15,fontWeight:700,color:"#fff"}}>Weekly Streams</p>
                        <span style={{fontSize:11,color:T.text3,background:"rgba(255,255,255,0.05)",padding:"2px 10px",borderRadius:999}}>This week</span>
                      </div>
                      <p style={{fontSize:24,fontWeight:800,color:"#fff",letterSpacing:-1,marginBottom:2}}>
                        847K <span style={{fontSize:12,fontWeight:500,color:"#10b981"}}>↑ 14.2%</span>
                      </p>
                      <p style={{fontSize:11,color:T.text3,marginBottom:16}}>vs 741K last week</p>
                      <MiniBar/>
                      <div style={{display:"flex",gap:4,marginTop:8,justifyContent:"space-around"}}>
                        {days.map((d,i)=><span key={i} style={{flex:1,textAlign:"center",fontSize:10,color:T.text3}}>{d}</span>)}
                      </div>
                    </div>
                  </GCard>
                </motion.div>

                {/* Now Playing card */}
                <motion.div variants={scaleIn}>
                  <GCard glow="#7c3aed" hover={false} style={{height:"100%"}}>
                    <div style={{padding:20,height:"100%",display:"flex",flexDirection:"column"}}>
                      <p style={{fontSize:11,fontWeight:600,letterSpacing:1.2,color:T.accentLight,
                        textTransform:"uppercase",marginBottom:14}}>
                        {current?"Now Playing":"No track"}
                      </p>
                      {current?(
                        <>
                          <img src={current.thumb} alt=""
                            style={{width:"100%",aspectRatio:"1",objectFit:"cover",borderRadius:12,
                              marginBottom:12,boxShadow:`0 12px 30px rgba(${bgColor},0.4)`}}/>
                          <p style={{fontSize:13,fontWeight:700,color:"#fff",overflow:"hidden",
                            textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:2}}>{current.title}</p>
                          <p style={{fontSize:11,color:T.text2,marginBottom:10}}>{current.channel}</p>
                          <div style={{height:3,background:"rgba(255,255,255,0.1)",borderRadius:2,overflow:"hidden",marginBottom:12}}>
                            <div style={{height:"100%",background:`linear-gradient(90deg,${T.accent},${T.accentLight})`,
                              width:`${pct}%`,transition:"width 0.5s linear"}}/>
                          </div>
                          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12,marginTop:"auto"}}>
                            <motion.button whileTap={{scale:0.85}} onClick={skipPrev}
                              style={{background:"none",border:"none",cursor:"pointer",color:T.text2,display:"flex"}}>
                              <SkipBack size={18}/>
                            </motion.button>
                            <motion.button whileTap={{scale:0.9}} onClick={togglePlay}
                              style={{width:42,height:42,borderRadius:"50%",
                                background:`linear-gradient(135deg,${T.accent},#5b21b6)`,
                                border:"none",cursor:"pointer",display:"flex",alignItems:"center",
                                justifyContent:"center",boxShadow:`0 0 18px ${T.accentGlow}`}}>
                              {playing
                                ?<PauseCircle size={20} fill="white" color="transparent"/>
                                :<PlayCircle size={20} fill="white" color="transparent"/>}
                            </motion.button>
                            <motion.button whileTap={{scale:0.85}} onClick={()=>skipNext()}
                              style={{background:"none",border:"none",cursor:"pointer",color:T.text2,display:"flex"}}>
                              <SkipForward size={18}/>
                            </motion.button>
                          </div>
                        </>
                      ):(
                        <div style={{flex:1,display:"flex",flexDirection:"column",
                          alignItems:"center",justifyContent:"center",gap:10,color:T.text2}}>
                          <div style={{width:54,height:54,borderRadius:18,background:"rgba(124,58,237,0.1)",
                            display:"flex",alignItems:"center",justifyContent:"center"}}>
                            <Music size={22} color={T.accentLight}/>
                          </div>
                          <p style={{fontSize:13,textAlign:"center"}}>Play a track to get started</p>
                          <Pill small primary onClick={()=>setView("search")}>Browse Music</Pill>
                        </div>
                      )}
                    </div>
                  </GCard>
                </motion.div>

                {/* Quick stats */}
                <motion.div variants={stagger} style={{display:"flex",flexDirection:"column",gap:10}}>
                  {[
                    {label:"Top Genre",   value:"Electronic",Icon:Zap,     color:"#7c3aed"},
                    {label:"New Followers",value:"+2,841",  Icon:Users,    color:"#06b6d4"},
                    {label:"Avg. Rating", value:"4.87 ★",  Icon:Star,     color:"#f59e0b"},
                  ].map(item=>(
                    <motion.div key={item.label} variants={scaleIn}>
                      <GCard glow={item.color}>
                        <div style={{padding:"12px 16px",display:"flex",alignItems:"center",gap:12}}>
                          <div style={{width:36,height:36,borderRadius:10,background:`${item.color}15`,
                            border:`1px solid ${item.color}25`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                            <item.Icon size={16} color={item.color}/>
                          </div>
                          <div>
                            <p style={{fontSize:11,color:T.text2,marginBottom:2}}>{item.label}</p>
                            <p style={{fontSize:15,fontWeight:700,color:"#fff"}}>{item.value}</p>
                          </div>
                        </div>
                      </GCard>
                    </motion.div>
                  ))}
                </motion.div>
              </div>

              {/* Row 3: Trending + Artists */}
              <div className="dash-row3" style={{display:"grid",gap:12,marginBottom:16}}>
                {/* Trending */}
                <motion.div variants={scaleIn}>
                  <GCard hover={false}>
                    <div style={{padding:"20px 20px 8px"}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
                        <div>
                          <p style={{fontSize:15,fontWeight:700,color:"#fff"}}>Trending Tracks</p>
                          <p style={{fontSize:11,color:T.text2,marginTop:2}}>YouTube Charts</p>
                        </div>
                        <Pill small onClick={()=>setView("search")}>See All <ChevronRight size={12}/></Pill>
                      </div>
                      {trendingLoading&&(
                        <div style={{display:"flex",alignItems:"center",gap:10,padding:"16px 0",color:T.text2}}>
                          <div style={{width:24,height:24,border:"3px solid rgba(255,255,255,0.1)",
                            borderTopColor:T.accent,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
                          <span style={{fontSize:12}}>Loading...</span>
                        </div>
                      )}
                      {!apiKey&&!trendingLoading&&(
                        <p style={{color:T.text2,fontSize:13,padding:"16px 0"}}>Set your API key to view trending.</p>
                      )}
                      {trending.slice(0,6).map((v,i)=>(
                        <motion.div key={v.id} initial={{opacity:0,x:-12}} animate={{opacity:1,x:0}}
                          transition={{delay:0.4+i*0.07}}
                          onClick={()=>playVideo(v,trending,i)}
                          style={{display:"flex",alignItems:"center",gap:12,padding:"9px 0",
                            borderBottom:i<5?"1px solid rgba(255,255,255,0.04)":"none",
                            cursor:"pointer",borderRadius:8,transition:"background 0.15s"}}
                          onMouseEnter={e=>e.currentTarget.style.background="rgba(124,58,237,0.06)"}
                          onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                          <span style={{fontSize:12,fontWeight:700,color:i<3?T.accentLight:T.text3,
                            width:16,textAlign:"center",flexShrink:0}}>{i+1}</span>
                          <img src={v.thumb} alt="" style={{width:36,height:36,borderRadius:8,objectFit:"cover",flexShrink:0}}/>
                          <div style={{flex:1,overflow:"hidden"}}>
                            <p style={{fontSize:13,fontWeight:600,color:"#fff",overflow:"hidden",
                              textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v.title}</p>
                            <p style={{fontSize:11,color:T.text2}}>{v.channel}</p>
                          </div>
                          <span style={{fontSize:11,color:T.text3,flexShrink:0}}>{v.durationFmt}</span>
                        </motion.div>
                      ))}
                    </div>
                  </GCard>
                </motion.div>

                {/* Artists */}
                <motion.div variants={scaleIn}>
                  <GCard hover={false} style={{height:"100%"}}>
                    <div style={{padding:"20px 20px 10px"}}>
                      <p style={{fontSize:15,fontWeight:700,color:"#fff",marginBottom:16}}>Artists</p>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
                        {(artistCards.length?artistCards:Array(6).fill({name:"...",thumb:null,count:0}))
                          .slice(0,6).map((a,i)=>(
                          <motion.div key={a.name+i} whileHover={{scale:1.06}}
                            onClick={()=>a.thumb&&openArtist(a.name,a.thumb)}
                            style={{textAlign:"center",cursor:a.thumb?"pointer":"default"}}>
                            <div style={{width:"100%",aspectRatio:"1",borderRadius:"50%",overflow:"hidden",
                              background:a.thumb?"#1c1c30":`linear-gradient(135deg,hsl(${240+i*25},50%,25%),hsl(${260+i*20},60%,35%))`,
                              margin:"0 auto 6px",boxShadow:"0 4px 16px rgba(0,0,0,0.4)",
                              display:"flex",alignItems:"center",justifyContent:"center"}}>
                              {a.thumb
                                ?<img src={a.thumb} alt={a.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                                :<Music size={18} color="rgba(255,255,255,0.3)"/>}
                            </div>
                            <p style={{fontSize:10,fontWeight:600,color:"#fff",overflow:"hidden",
                              textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{cleanArtist(a.name)||"..."}</p>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </GCard>
                </motion.div>
              </div>

              {/* Recently played */}
              {recent.length>0&&(
                <motion.div variants={scaleIn}>
                  <GCard hover={false}>
                    <div style={{padding:"20px 20px 10px"}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                        <p style={{fontSize:15,fontWeight:700,color:"#fff"}}>Recently Played</p>
                        <motion.button whileHover={{rotate:180}} transition={{duration:0.3}}
                          onClick={()=>{setSuggestions([]);loadSuggestions();}}
                          style={{background:"none",border:"none",cursor:"pointer",color:T.text3,display:"flex"}}>
                          <RefreshCw size={14}/>
                        </motion.button>
                      </div>
                      <div style={{display:"flex",gap:12,overflowX:"auto",paddingBottom:6,scrollbarWidth:"none"}}>
                        {recent.slice(0,12).map(v=>(
                          <motion.div key={v.id} whileHover={{scale:1.04}} onClick={()=>playVideo(v)}
                            style={{flexShrink:0,width:100,cursor:"pointer"}}>
                            <div style={{position:"relative",width:100,height:100,borderRadius:12,
                              overflow:"hidden",marginBottom:6}}>
                              <img src={v.thumb} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                              <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.45)",
                                display:"flex",alignItems:"center",justifyContent:"center",
                                opacity:0,transition:"opacity 0.15s"}}
                                onMouseEnter={e=>e.currentTarget.style.opacity=1}
                                onMouseLeave={e=>e.currentTarget.style.opacity=0}>
                                <PlayCircle size={26} color="white"/>
                              </div>
                            </div>
                            <p style={{fontSize:11,color:T.text2,overflow:"hidden",textOverflow:"ellipsis",
                              whiteSpace:"nowrap",lineHeight:1.3}}>{v.title}</p>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </GCard>
                </motion.div>
              )}

              {/* CTA Banner */}
              <motion.div variants={scaleIn} style={{marginTop:12}}>
                <GCard hover={false}>
                  <div style={{padding:"20px 24px",display:"flex",alignItems:"center",
                    justifyContent:"space-between",flexWrap:"wrap",gap:14}}>
                    <div style={{display:"flex",alignItems:"center",gap:16}}>
                      <div style={{width:48,height:48,borderRadius:14,flexShrink:0,
                        background:`linear-gradient(135deg,${T.accent},#a78bfa)`,
                        display:"flex",alignItems:"center",justifyContent:"center",
                        boxShadow:`0 0 24px ${T.accentGlow}`}}>
                        <Radio size={20} color="#fff"/>
                      </div>
                      <div>
                        <p style={{fontSize:16,fontWeight:700,color:"#fff",letterSpacing:-0.3}}>Distribute Your Music</p>
                        <p style={{fontSize:12,color:T.text2,marginTop:2}}>Reach 50+ platforms instantly.</p>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:8}}>
                      <Pill>Learn More</Pill>
                      <Pill primary icon={Sparkles}>Start Now</Pill>
                    </div>
                  </div>
                  <div style={{height:2,background:`linear-gradient(90deg,${T.accent}80,#06b6d480,#10b98180,transparent)`}}/>
                </GCard>
              </motion.div>
            </motion.div>
          )}

          {/* ════ SEARCH ════ */}
          {view==="search"&&(
            <motion.div initial="hidden" animate="show" variants={stagger} style={{paddingTop:28}}>
              <motion.div variants={fadeUp}
                style={{display:"flex",alignItems:"center",gap:12,
                  background:"rgba(255,255,255,0.05)",border:`1px solid ${T.border}`,
                  borderRadius:14,padding:"11px 18px",marginBottom:24}}>
                <Search size={17} color={T.text3}/>
                <input value={searchQ} onChange={e=>handleSearch(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&doSearch(searchQ)}
                  placeholder="Search songs, artists, albums..." autoFocus
                  style={{flex:1,background:"none",border:"none",outline:"none",color:"#fff",fontSize:15,fontFamily:"inherit"}}/>
                {searchQ&&(
                  <motion.button whileTap={{scale:0.9}} onClick={()=>{setSearchQ("");setSearchResults([]);}}
                    style={{background:"none",border:"none",cursor:"pointer",color:T.text3,display:"flex"}}>
                    <X size={16}/>
                  </motion.button>
                )}
              </motion.div>

              {!searchQ&&(
                <motion.div variants={fadeUp}>
                  <p style={{fontSize:15,fontWeight:700,marginBottom:12}}>Quick Searches</p>
                  <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                    {QUICK.map(q=>(
                      <motion.button key={q} whileHover={{scale:1.04}} whileTap={{scale:0.96}}
                        onClick={()=>{setSearchQ(q);doSearch(q);}}
                        style={{background:"rgba(255,255,255,0.05)",border:`1px solid ${T.border}`,
                          borderRadius:999,color:T.text2,fontSize:13,padding:"8px 16px",
                          cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s"}}
                        onMouseEnter={e=>{e.currentTarget.style.borderColor=T.accent;e.currentTarget.style.color=T.accentLight;}}
                        onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color=T.text2;}}>
                        {q}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {searching&&(
                <div style={{display:"flex",alignItems:"center",gap:12,padding:"24px 0",color:T.text2}}>
                  <div style={{width:24,height:24,border:"3px solid rgba(255,255,255,0.1)",
                    borderTopColor:T.accent,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
                  Searching...
                </div>
              )}
              {searchError&&(
                <div style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.3)",
                  borderRadius:12,padding:"11px 16px",color:"#fca5a5",marginBottom:16,fontSize:13}}>
                  {searchError}
                </div>
              )}

              {searchResults.length>0&&(
                <motion.div variants={stagger}>
                  <p style={{fontSize:12,color:T.text3,marginBottom:12,paddingLeft:4}}>
                    {searchResults.length} results for "{searchQ}"
                  </p>
                  {searchResults.map((v,i)=>(
                    <motion.div key={v.id} variants={fadeUp}>
                      <TrackRow video={v} index={i+1}
                        isActive={current?.id===v.id} isPlaying={current?.id===v.id&&playing}
                        onPlay={()=>playVideo(v,searchResults,i)}
                        onLike={()=>toggleLike(v)} liked={isLiked(v.id)}
                        onAdd={()=>setShowAddTo(v)}
                        onArtist={()=>openArtist(v.channel,v.thumb)}/>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ════ LIBRARY ════ */}
          {view==="library"&&(
            <motion.div initial="hidden" animate="show" variants={stagger} style={{paddingTop:28}}>
              <motion.div variants={fadeUp}
                style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",marginBottom:24}}>
                <h1 style={{fontSize:"clamp(22px,5vw,32px)",fontWeight:800,letterSpacing:-0.8}}>My Library</h1>
                <Pill primary icon={Plus} onClick={()=>setShowCreatePlaylist(true)}>New Playlist</Pill>
              </motion.div>

              <motion.div variants={stagger}
                style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:12,marginBottom:28}}>
                {playlists.map(pl=>(
                  <motion.div key={pl.id} variants={scaleIn}>
                    <GCard onClick={()=>{setSelectedPlaylist(pl);setView("playlist");}}>
                      <div style={{padding:"12px 12px 10px"}}>
                        <div style={{width:"100%",aspectRatio:"1",borderRadius:10,overflow:"hidden",
                          background:"rgba(124,58,237,0.1)",display:"flex",alignItems:"center",
                          justifyContent:"center",marginBottom:8}}>
                          {pl.cover
                            ?<img src={pl.cover} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                            :<Music size={28} color="rgba(124,58,237,0.5)"/>}
                        </div>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                          <div style={{overflow:"hidden",flex:1}}>
                            <p style={{fontSize:12,fontWeight:600,color:"#fff",overflow:"hidden",
                              textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{pl.name}</p>
                            <p style={{fontSize:10,color:T.text3,marginTop:2}}>{pl.videos.length} songs</p>
                          </div>
                          <motion.button whileTap={{scale:0.9}}
                            onClick={e=>{e.stopPropagation();deletePlaylist(pl.id);}}
                            style={{background:"none",border:"none",cursor:"pointer",
                              color:T.text3,padding:2,display:"flex",flexShrink:0}}
                            onMouseEnter={e=>e.currentTarget.style.color="#ef4444"}
                            onMouseLeave={e=>e.currentTarget.style.color=T.text3}>
                            <X size={12}/>
                          </motion.button>
                        </div>
                      </div>
                    </GCard>
                  </motion.div>
                ))}
                {playlists.length===0&&(
                  <motion.div variants={scaleIn} style={{gridColumn:"1/-1"}}>
                    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:12,
                      padding:"48px 0",color:T.text2}}>
                      <div style={{width:52,height:52,borderRadius:16,background:"rgba(124,58,237,0.1)",
                        display:"flex",alignItems:"center",justifyContent:"center"}}>
                        <ListMusic size={22} color={T.accentLight}/>
                      </div>
                      <p style={{fontSize:14}}>No playlists yet</p>
                      <Pill primary onClick={()=>setShowCreatePlaylist(true)}>Create Playlist</Pill>
                    </div>
                  </motion.div>
                )}
              </motion.div>

              {liked.length>0&&(
                <motion.div variants={fadeUp}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                    <h2 style={{fontSize:18,fontWeight:700}}>♥ Liked Songs ({liked.length})</h2>
                    <Pill small primary onClick={()=>playVideo(liked[0],liked,0)} icon={PlayCircle}>Play All</Pill>
                  </div>
                  {liked.map((v,i)=>(
                    <TrackRow key={v.id} video={v} index={i+1}
                      isActive={current?.id===v.id} isPlaying={current?.id===v.id&&playing}
                      onPlay={()=>playVideo(v,liked,i)} onLike={()=>toggleLike(v)} liked={isLiked(v.id)}
                      onAdd={()=>setShowAddTo(v)} onArtist={()=>openArtist(v.channel,v.thumb)}/>
                  ))}
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ════ PLAYLIST DETAIL ════ */}
          {view==="playlist"&&selectedPlaylist&&(()=>{
            const pl=playlists.find(p=>p.id===selectedPlaylist.id)||selectedPlaylist;
            return(
              <motion.div initial="hidden" animate="show" variants={stagger} style={{paddingTop:28}}>
                <motion.button variants={fadeUp} onClick={()=>setView("library")}
                  style={{background:"none",border:"none",cursor:"pointer",color:T.accentLight,
                    fontSize:13,display:"flex",alignItems:"center",gap:6,marginBottom:20,fontFamily:"inherit"}}>
                  ← Library
                </motion.button>
                <motion.div variants={fadeUp}
                  style={{display:"flex",gap:20,alignItems:"flex-end",marginBottom:24,flexWrap:"wrap"}}>
                  <div style={{width:160,height:160,flexShrink:0,borderRadius:16,overflow:"hidden",
                    background:"rgba(124,58,237,0.1)",display:"flex",alignItems:"center",
                    justifyContent:"center",boxShadow:"0 12px 40px rgba(0,0,0,0.5)"}}>
                    {pl.cover
                      ?<img src={pl.cover} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                      :<Music size={48} color="rgba(124,58,237,0.5)"/>}
                  </div>
                  <div>
                    <p style={{fontSize:10,fontWeight:700,letterSpacing:2,color:T.text3,marginBottom:6,textTransform:"uppercase"}}>Playlist</p>
                    <h1 style={{fontSize:"clamp(24px,5vw,38px)",fontWeight:800,letterSpacing:-0.8,lineHeight:1,marginBottom:8}}>{pl.name}</h1>
                    <p style={{fontSize:13,color:T.text2,marginBottom:16}}>{pl.videos.length} songs · {fmtTime(pl.videos.reduce((a,v)=>a+(v.duration||0),0))}</p>
                    {pl.videos.length>0&&(
                      <div style={{display:"flex",gap:8}}>
                        <Pill primary icon={PlayCircle} onClick={()=>playVideo(pl.videos[0],pl.videos,0)}>Play All</Pill>
                        <Pill icon={Shuffle} onClick={()=>{const s=[...pl.videos].sort(()=>Math.random()-.5);playVideo(s[0],s,0);}}>Shuffle</Pill>
                      </div>
                    )}
                  </div>
                </motion.div>
                {pl.videos.length===0
                  ?<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:12,
                      padding:"48px 0",color:T.text2}}>
                      <p>No songs yet. Search and add some!</p>
                    </div>
                  :pl.videos.map((v,i)=>(
                    <TrackRow key={v.id} video={v} index={i+1}
                      isActive={current?.id===v.id} isPlaying={current?.id===v.id&&playing}
                      onPlay={()=>playVideo(v,pl.videos,i)} onLike={()=>toggleLike(v)} liked={isLiked(v.id)}
                      onAdd={()=>setShowAddTo(v)} onArtist={()=>openArtist(v.channel,v.thumb)}/>
                  ))}
              </motion.div>
            );
          })()}

          {/* ════ LIKED ════ */}
          {view==="liked"&&(
            <motion.div initial="hidden" animate="show" variants={stagger} style={{paddingTop:28}}>
              <motion.button variants={fadeUp} onClick={()=>setView("library")}
                style={{background:"none",border:"none",cursor:"pointer",color:T.accentLight,
                  fontSize:13,display:"flex",alignItems:"center",gap:6,marginBottom:20,fontFamily:"inherit"}}>
                ← Library
              </motion.button>
              <motion.div variants={fadeUp}
                style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
                <h1 style={{fontSize:"clamp(22px,5vw,32px)",fontWeight:800,letterSpacing:-0.8}}>♥ Liked Songs</h1>
                {liked.length>0&&(
                  <Pill primary icon={PlayCircle} onClick={()=>playVideo(liked[0],liked,0)}>
                    Play All ({liked.length})
                  </Pill>
                )}
              </motion.div>
              {liked.map((v,i)=>(
                <motion.div key={v.id} variants={fadeUp}>
                  <TrackRow video={v} index={i+1} isActive={current?.id===v.id} isPlaying={current?.id===v.id&&playing}
                    onPlay={()=>playVideo(v,liked,i)} onLike={()=>toggleLike(v)} liked={isLiked(v.id)}
                    onAdd={()=>setShowAddTo(v)} onArtist={()=>openArtist(v.channel,v.thumb)}/>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* ════ ARTIST PAGE ════ */}
          {view==="artist"&&selectedArtist&&(
            <motion.div initial="hidden" animate="show" variants={stagger} style={{paddingTop:28}}>
              <motion.button variants={fadeUp} onClick={()=>setView("home")}
                style={{background:"none",border:"none",cursor:"pointer",color:T.accentLight,
                  fontSize:13,display:"flex",alignItems:"center",gap:6,marginBottom:20,fontFamily:"inherit"}}>
                ← Back
              </motion.button>
              <motion.div variants={fadeUp}
                style={{display:"flex",gap:20,alignItems:"flex-end",marginBottom:24,flexWrap:"wrap"}}>
                <div style={{width:160,height:160,flexShrink:0,borderRadius:"50%",overflow:"hidden",
                  background:"rgba(124,58,237,0.1)",display:"flex",alignItems:"center",
                  justifyContent:"center",boxShadow:"0 12px 40px rgba(0,0,0,0.5)"}}>
                  {selectedArtist.thumb
                    ?<img src={selectedArtist.thumb} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                    :<Music size={48} color="rgba(124,58,237,0.5)"/>}
                </div>
                <div>
                  <p style={{fontSize:10,fontWeight:700,letterSpacing:2,color:T.text3,marginBottom:6,textTransform:"uppercase"}}>Artist</p>
                  <h1 style={{fontSize:"clamp(24px,5vw,38px)",fontWeight:800,letterSpacing:-0.8,lineHeight:1,marginBottom:16}}>
                    {cleanArtist(selectedArtist.name)}
                  </h1>
                  {artistSongs.length>0&&(
                    <div style={{display:"flex",gap:8}}>
                      <Pill primary icon={PlayCircle} onClick={()=>playVideo(artistSongs[0],artistSongs,0)}>Play All</Pill>
                      <Pill icon={Shuffle} onClick={()=>{const s=[...artistSongs].sort(()=>Math.random()-.5);playVideo(s[0],s,0);}}>Shuffle</Pill>
                    </div>
                  )}
                </div>
              </motion.div>
              {artistLoading?(
                <div style={{display:"flex",gap:12,padding:"20px 0",color:T.text2,alignItems:"center"}}>
                  <div style={{width:24,height:24,border:"3px solid rgba(255,255,255,0.1)",
                    borderTopColor:T.accent,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
                  Loading...
                </div>
              ):artistSongs.map((v,i)=>(
                <TrackRow key={v.id} video={v} index={i+1}
                  isActive={current?.id===v.id} isPlaying={current?.id===v.id&&playing}
                  onPlay={()=>playVideo(v,artistSongs,i)} onLike={()=>toggleLike(v)} liked={isLiked(v.id)}
                  onAdd={()=>setShowAddTo(v)} onArtist={null}/>
              ))}
            </motion.div>
          )}

          {/* ════ ARTISTS BROWSE ════ */}
          {view==="artists"&&(
            <motion.div initial="hidden" animate="show" variants={stagger} style={{paddingTop:28}}>
              <motion.h1 variants={fadeUp}
                style={{fontSize:"clamp(22px,5vw,32px)",fontWeight:800,letterSpacing:-0.8,marginBottom:24}}>
                Artists
              </motion.h1>
              {artistCards.length===0?(
                <p style={{color:T.text2,fontSize:14}}>Play some songs to discover artists.</p>
              ):(
                <motion.div variants={stagger}
                  style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))",gap:18}}>
                  {artistCards.map((a,i)=>(
                    <motion.div key={a.name+i} variants={scaleIn} whileHover={{scale:1.05}}
                      onClick={()=>openArtist(a.name,a.thumb)}
                      style={{textAlign:"center",cursor:"pointer"}}>
                      <div style={{width:"100%",aspectRatio:"1",borderRadius:"50%",overflow:"hidden",
                        background:`linear-gradient(135deg,hsl(${240+i*18},50%,22%),hsl(${260+i*15},60%,32%))`,
                        marginBottom:8,boxShadow:"0 6px 20px rgba(0,0,0,0.5)"}}>
                        {a.thumb&&<img src={a.thumb} alt={a.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>}
                      </div>
                      <p style={{fontSize:12,fontWeight:600,color:"#fff",overflow:"hidden",
                        textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{cleanArtist(a.name)}</p>
                      <p style={{fontSize:10,color:T.text3,marginTop:2}}>Artist</p>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          )}

        </div>
      </div>

      {/* ══ BOTTOM NAV (mobile) ══ */}
      {isMobile&&(
        <div style={{position:"fixed",bottom:current?76:0,left:0,right:0,
          background:"rgba(9,9,20,0.97)",borderTop:`1px solid ${T.border}`,
          backdropFilter:"blur(20px)",zIndex:99,
          paddingBottom:"env(safe-area-inset-bottom,0)",
          display:"flex"}}>
          {navItems.map(item=>(
            <button key={item.id} onClick={()=>setView(item.id)}
              style={{flex:1,background:"none",border:"none",
                color:(item.id==="home"&&["home","artist"].includes(view))||
                      (item.id==="library"&&["library","playlist","liked"].includes(view))||
                      view===item.id ? T.accentLight : T.text3,
                display:"flex",flexDirection:"column",alignItems:"center",gap:3,
                padding:"10px 4px",cursor:"pointer",fontFamily:"inherit",minHeight:58}}>
              <item.Icon size={20}/>
              <span style={{fontSize:10,fontWeight:500}}>{item.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* ══ PLAYER BAR ══ */}
      <AnimatePresence>
        {current&&(
          <motion.div initial={{y:90}} animate={{y:0}} exit={{y:90}}
            transition={{type:"spring",damping:24,stiffness:260}}
            style={{position:"fixed",bottom:isMobile?58:0,right:0,left:sideW,zIndex:150,
              background:"rgba(9,9,20,0.98)",backdropFilter:"blur(28px)",
              borderTop:`1px solid ${T.border}`,
              boxShadow:`0 -4px 30px rgba(${bgColor},0.15)`,
              transition:"left 0.28s cubic-bezier(0.25,0.46,0.45,0.94)"}}>

            {/* Queue panel */}
            <AnimatePresence>
              {showQueue&&(
                <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:10}}
                  style={{position:"absolute",bottom:"100%",right:20,width:"min(340px,90vw)",maxHeight:420,
                    background:"rgba(14,14,26,0.99)",border:`1px solid ${T.border}`,
                    borderRadius:"16px 16px 0 0",overflow:"hidden",
                    boxShadow:"0 -8px 40px rgba(0,0,0,0.6)"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
                    padding:"14px 16px",borderBottom:`1px solid ${T.border}`,fontSize:14,fontWeight:600}}>
                    <span>Up Next ({queue.length})</span>
                    <motion.button whileTap={{scale:0.9}} onClick={()=>setShowQueue(false)}
                      style={{background:"none",border:"none",cursor:"pointer",color:T.text3,display:"flex"}}>
                      <X size={15}/>
                    </motion.button>
                  </div>
                  <div style={{overflowY:"auto",maxHeight:360}}>
                    {queue.map((v,i)=>(
                      <motion.div key={`${v.id}-${i}`} whileHover={{background:"rgba(124,58,237,0.08)"}}
                        onClick={()=>{setCurrent(v);setQueueIdx(i);setPlaying(true);setLyrics(null);}}
                        style={{display:"flex",alignItems:"center",gap:10,padding:"8px 16px",cursor:"pointer",
                          background:i===queueIdx?"rgba(124,58,237,0.1)":"transparent",transition:"background 0.15s"}}>
                        <img src={v.thumb} alt="" style={{width:36,height:36,borderRadius:8,objectFit:"cover"}}/>
                        <div style={{flex:1,overflow:"hidden"}}>
                          <p style={{fontSize:12,fontWeight:500,color:i===queueIdx?T.accentLight:"#fff",
                            overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v.title}</p>
                          <p style={{fontSize:11,color:T.text3}}>{v.channel}</p>
                        </div>
                        {i===queueIdx&&<PlayCircle size={13} color={T.accentLight}/>}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Desktop Lyrics panel */}
            <AnimatePresence>
              {showLyrics&&!isMobile&&(
                <LyricsPanel
                  current={current}
                  lyrics={lyrics}
                  lyricsLoading={lyricsLoading}
                  onClose={()=>setShowLyrics(false)}
                />
              )}
            </AnimatePresence>

            {/* Progress line */}
            <div style={{height:2,background:"rgba(255,255,255,0.06)"}}>
              <div style={{height:"100%",
                background:`linear-gradient(90deg,${T.accent},${T.accentLight})`,
                width:`${pct}%`,transition:"width 0.5s linear"}}/>
            </div>

            <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 16px 8px"}}>
              {/* Track info — tap opens mobile player */}
              <div style={{display:"flex",alignItems:"center",gap:10,flex:"0 0 auto",
                maxWidth:isMobile?"calc(100% - 130px)":"280px",
                minWidth:0,cursor:"pointer",overflow:"hidden"}}
                onClick={()=>isMobile&&setShowMobilePlayer(true)}>
                <div style={{position:"relative",flexShrink:0}}>
                  <img src={current.thumb} alt="" style={{width:42,height:42,borderRadius:9,objectFit:"cover"}}/>
                  {playing&&<div style={{position:"absolute",inset:-3,borderRadius:12,
                    border:`2px solid ${T.accent}`,animation:"pulse 2s ease-in-out infinite"}}/>}
                </div>
                <div style={{overflow:"hidden",minWidth:0}}>
                  <p style={{fontSize:13,fontWeight:500,color:"#fff",whiteSpace:"nowrap",
                    overflow:"hidden",textOverflow:"ellipsis"}}>{current.title}</p>
                  <p style={{fontSize:11,color:T.text2,marginTop:2,whiteSpace:"nowrap",
                    overflow:"hidden",textOverflow:"ellipsis"}}>{current.channel}</p>
                </div>
              </div>

              {/* Desktop controls */}
              {!isMobile&&(
                <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
                  <motion.button whileTap={{scale:0.85}} onClick={()=>setShuffle(s=>!s)}
                    style={{background:"none",border:"none",cursor:"pointer",
                      color:shuffle?T.accentLight:T.text3,padding:7,borderRadius:"50%",display:"flex"}}>
                    <Shuffle size={15}/>
                  </motion.button>
                  <motion.button whileTap={{scale:0.85}} onClick={skipPrev}
                    style={{background:"none",border:"none",cursor:"pointer",color:"#fff",padding:7,borderRadius:"50%",display:"flex"}}>
                    <SkipBack size={19}/>
                  </motion.button>
                  <motion.button whileTap={{scale:0.9}} onClick={togglePlay}
                    style={{width:40,height:40,borderRadius:"50%",
                      background:`linear-gradient(135deg,${T.accent},#5b21b6)`,
                      border:"none",cursor:"pointer",display:"flex",alignItems:"center",
                      justifyContent:"center",boxShadow:`0 0 18px ${T.accentGlow}`}}>
                    {playing
                      ?<PauseCircle size={19} fill="white" color="transparent"/>
                      :<PlayCircle size={19} fill="white" color="transparent"/>}
                  </motion.button>
                  <motion.button whileTap={{scale:0.85}} onClick={()=>skipNext()}
                    style={{background:"none",border:"none",cursor:"pointer",color:"#fff",padding:7,borderRadius:"50%",display:"flex"}}>
                    <SkipForward size={19}/>
                  </motion.button>
                  <motion.button whileTap={{scale:0.85}}
                    onClick={()=>setRepeat(r=>r==="off"?"all":r==="all"?"one":"off")}
                    style={{background:"none",border:"none",cursor:"pointer",
                      color:repeat!=="off"?T.accentLight:T.text3,padding:7,borderRadius:"50%",display:"flex"}}>
                    {repeat==="one"?<Repeat1 size={15}/>:<Repeat size={15}/>}
                  </motion.button>
                </div>
              )}

              {/* Mobile compact controls */}
              {isMobile&&(
                <div style={{display:"flex",alignItems:"center",gap:4,marginLeft:"auto",flexShrink:0}}>
                  <motion.button whileTap={{scale:0.85}} onClick={skipPrev}
                    style={{background:"none",border:"none",cursor:"pointer",color:T.text2,padding:8,display:"flex"}}>
                    <SkipBack size={18}/>
                  </motion.button>
                  <motion.button whileTap={{scale:0.9}} onClick={togglePlay}
                    style={{width:38,height:38,borderRadius:"50%",
                      background:`linear-gradient(135deg,${T.accent},#5b21b6)`,
                      border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    {playing
                      ?<PauseCircle size={18} fill="white" color="transparent"/>
                      :<PlayCircle size={18} fill="white" color="transparent"/>}
                  </motion.button>
                  <motion.button whileTap={{scale:0.85}} onClick={()=>skipNext()}
                    style={{background:"none",border:"none",cursor:"pointer",color:T.text2,padding:8,display:"flex"}}>
                    <SkipForward size={18}/>
                  </motion.button>
                </div>
              )}

              {/* Desktop right controls */}
              {!isMobile&&(
                <div style={{display:"flex",alignItems:"center",gap:2,flexShrink:0}}>
                  <motion.button whileTap={{scale:0.85}} onClick={()=>toggleLike(current)}
                    style={{background:"none",border:"none",cursor:"pointer",padding:7,borderRadius:"50%",display:"flex",
                      color:isLiked(current.id)?"#f43f5e":T.text3}}>
                    <Heart size={14} fill={isLiked(current.id)?"#f43f5e":"none"} color={isLiked(current.id)?"#f43f5e":T.text3}/>
                  </motion.button>
                  <motion.button whileTap={{scale:0.85}} onClick={()=>setShowAddTo(current)}
                    style={{background:"none",border:"none",cursor:"pointer",color:T.text3,padding:7,borderRadius:"50%",display:"flex"}}>
                    <Plus size={14}/>
                  </motion.button>
                  <motion.button whileTap={{scale:0.85}} onClick={()=>setShowLyrics(l=>!l)}
                    style={{background:"none",border:"none",cursor:"pointer",padding:7,borderRadius:"50%",display:"flex",
                      color:showLyrics?T.accentLight:T.text3}}>
                    <Music size={14}/>
                  </motion.button>
                  <motion.button whileTap={{scale:0.85}} onClick={()=>setShowQueue(q=>!q)}
                    style={{background:"none",border:"none",cursor:"pointer",padding:7,borderRadius:"50%",display:"flex",
                      color:showQueue?T.accentLight:T.text3}}>
                    <List size={14}/>
                  </motion.button>
                  <motion.button whileTap={{scale:0.85}} onClick={toggleMute}
                    style={{background:"none",border:"none",cursor:"pointer",
                      color:muted?T.text3:T.text2,padding:7,borderRadius:"50%",display:"flex"}}>
                    <Volume2 size={14}/>
                  </motion.button>
                  <input type="range" min="0" max="100" value={muted?0:volume}
                    onChange={e=>onVol(+e.target.value)}
                    style={{width:70,accentColor:T.accent,cursor:"pointer"}}/>
                </div>
              )}
            </div>

            {/* Desktop seek bar */}
            {!isMobile&&(
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"0 16px 8px",
                fontSize:11,color:T.text3,fontVariantNumeric:"tabular-nums"}}>
                <span>{fmtTime(progress)}</span>
                <input type="range" min="0" max="100" value={pct} onChange={e=>seekTo(+e.target.value)}
                  style={{flex:1,accentColor:T.accent,cursor:"pointer",height:3}}/>
                <span>{fmtTime(duration)}</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}