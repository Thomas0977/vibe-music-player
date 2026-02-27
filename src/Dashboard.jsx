import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, TrendingUp, Users, Zap, Bell, Settings,
  Search, ChevronRight, ArrowUpRight, Activity, Star,
  Music, Headphones, Radio, BarChart2, Moon, Sparkles,
  PlayCircle, PauseCircle, SkipForward, Heart, Volume2,
  Flame, Globe, Shield, LogOut, Menu, X
} from "lucide-react";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const tokens = {
  accent: "#7c3aed",       // deep violet
  accentLight: "#a78bfa",  // soft lavender
  accentGlow: "rgba(124,58,237,0.4)",
  accentSoft: "rgba(124,58,237,0.12)",
  surface: "rgba(255,255,255,0.04)",
  surfaceHover: "rgba(255,255,255,0.07)",
  border: "rgba(255,255,255,0.08)",
  borderHover: "rgba(124,58,237,0.5)",
};

// ─── MOTION VARIANTS ──────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
};
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } },
};
const slideRight = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0, transition: { duration: 0.4 } },
};

// ─── STATS DATA ───────────────────────────────────────────────────────────────
const stats = [
  { label: "Total Streams", value: "2.4M", delta: "+18.2%", up: true, icon: Activity, color: "#7c3aed" },
  { label: "Active Listeners", value: "84.3K", delta: "+6.7%", up: true, icon: Users, color: "#06b6d4" },
  { label: "Revenue", value: "$12,840", delta: "+24.1%", up: true, icon: TrendingUp, color: "#10b981" },
  { label: "Avg. Session", value: "34m 12s", delta: "-2.3%", up: false, icon: Zap, color: "#f59e0b" },
];

const trending = [
  { rank: 1, title: "Neon Drift", artist: "Solara", plays: "420K", change: "+12%", hot: true },
  { rank: 2, title: "Hollow Echo", artist: "The Voids", plays: "387K", change: "+8%", hot: true },
  { rank: 3, title: "Midnight Tape", artist: "Cassette Girl", plays: "312K", change: "+5%", hot: false },
  { rank: 4, title: "Glass Frequencies", artist: "Prism", plays: "298K", change: "+3%", hot: false },
  { rank: 5, title: "Orbital Hum", artist: "Deep Space", plays: "241K", change: "-1%", hot: false },
];

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", id: "dashboard" },
  { icon: Music, label: "Library", id: "library" },
  { icon: TrendingUp, label: "Analytics", id: "analytics" },
  { icon: Radio, label: "Discover", id: "discover" },
  { icon: Users, label: "Community", id: "community" },
  { icon: Shield, label: "Security", id: "security" },
];

const weeks = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const barHeights = [40, 65, 55, 80, 70, 95, 60];

// ─── GLASSMORPHISM CARD ───────────────────────────────────────────────────────
function GlassCard({ children, className = "", glowColor, onClick, hover = true }) {
  return (
    <motion.div
      variants={scaleIn}
      whileHover={hover ? { scale: 1.015, transition: { duration: 0.2 } } : {}}
      onClick={onClick}
      style={{
        background: tokens.surface,
        border: `1px solid ${tokens.border}`,
        borderRadius: 24,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        position: "relative",
        overflow: "hidden",
        cursor: onClick ? "pointer" : "default",
      }}
      className={className}
    >
      {/* Glow spot */}
      {glowColor && (
        <div style={{
          position: "absolute", top: -40, right: -40,
          width: 120, height: 120, borderRadius: "50%",
          background: `radial-gradient(circle, ${glowColor}30 0%, transparent 70%)`,
          pointerEvents: "none",
        }} />
      )}
      {children}
    </motion.div>
  );
}

// ─── PILL BUTTON ──────────────────────────────────────────────────────────────
function PillButton({ children, primary, small, onClick, icon: Icon }) {
  return (
    <motion.button
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        padding: small ? "8px 18px" : "12px 28px",
        borderRadius: 999,
        border: primary ? "none" : `1px solid ${tokens.border}`,
        background: primary
          ? `linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)`
          : tokens.surface,
        color: "#fff",
        fontSize: small ? 13 : 14,
        fontWeight: 600,
        cursor: "pointer",
        letterSpacing: 0.2,
        boxShadow: primary ? `0 0 24px ${tokens.accentGlow}` : "none",
        backdropFilter: "blur(10px)",
        transition: "box-shadow 0.2s",
        fontFamily: "inherit",
      }}
    >
      {Icon && <Icon size={small ? 14 : 16} />}
      {children}
    </motion.button>
  );
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────
function StatCard({ stat }) {
  const Icon = stat.icon;
  return (
    <GlassCard glowColor={stat.color} hover>
      <div style={{ padding: "24px 24px 20px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: `${stat.color}18`,
            border: `1px solid ${stat.color}30`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon size={20} color={stat.color} />
          </div>
          <span style={{
            fontSize: 12, fontWeight: 600,
            color: stat.up ? "#10b981" : "#ef4444",
            background: stat.up ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
            padding: "3px 8px", borderRadius: 999,
          }}>
            {stat.delta}
          </span>
        </div>
        <div style={{ fontSize: 28, fontWeight: 700, color: "#fff", letterSpacing: -1, lineHeight: 1 }}>
          {stat.value}
        </div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 6 }}>{stat.label}</div>
      </div>
      {/* Bottom shimmer line */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${stat.color}60 0%, transparent 100%)` }} />
    </GlassCard>
  );
}

// ─── BAR CHART ────────────────────────────────────────────────────────────────
function MiniBarChart() {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80 }}>
      {barHeights.map((h, i) => (
        <motion.div
          key={i}
          initial={{ scaleY: 0, originY: 1 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: 0.6 + i * 0.07, duration: 0.5, ease: "easeOut" }}
          style={{
            flex: 1, height: `${h}%`, borderRadius: 6,
            background: i === 5
              ? `linear-gradient(180deg, #7c3aed, #a78bfa)`
              : `rgba(124,58,237,0.25)`,
            transformOrigin: "bottom",
            border: i === 5 ? "1px solid rgba(167,139,250,0.4)" : "1px solid rgba(124,58,237,0.1)",
          }}
        />
      ))}
    </div>
  );
}

// ─── NOW PLAYING CARD ─────────────────────────────────────────────────────────
function NowPlayingCard() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [liked, setLiked] = useState(false);
  const [progress, setProgress] = useState(38);

  useEffect(() => {
    if (!isPlaying) return;
    const t = setInterval(() => setProgress(p => p >= 100 ? 0 : p + 0.3), 200);
    return () => clearInterval(t);
  }, [isPlaying]);

  return (
    <GlassCard hover={false} style={{ height: "100%" }}>
      <div style={{ padding: 24, height: "100%", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1.5, color: tokens.accentLight, textTransform: "uppercase" }}>
            Now Playing
          </span>
          <motion.div animate={{ rotate: isPlaying ? 360 : 0 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }}>
            <Headphones size={16} color={tokens.accentLight} />
          </motion.div>
        </div>

        {/* Album Art */}
        <div style={{ position: "relative", marginBottom: 20 }}>
          <div style={{
            width: "100%", aspectRatio: "1",
            borderRadius: 18, overflow: "hidden",
            background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #7c3aed 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 20px 40px rgba(124,58,237,0.4)`,
          }}>
            <motion.div
              animate={{ rotate: isPlaying ? 360 : 0 }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <Music size={24} color="rgba(255,255,255,0.7)" />
            </motion.div>
            {/* Vinyl grooves */}
            {[80, 100, 120].map((s, i) => (
              <div key={i} style={{
                position: "absolute", width: s, height: s, borderRadius: "50%",
                border: "1px solid rgba(255,255,255,0.05)", pointerEvents: "none",
              }} />
            ))}
          </div>
        </div>

        {/* Track Info */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", letterSpacing: -0.3 }}>Neon Drift</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>Solara · Electronic</div>
            </div>
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => setLiked(l => !l)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 6 }}
            >
              <Heart size={18} fill={liked ? "#f43f5e" : "none"} color={liked ? "#f43f5e" : "rgba(255,255,255,0.4)"} />
            </motion.button>
          </div>
        </div>

        {/* Progress */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ height: 3, background: "rgba(255,255,255,0.1)", borderRadius: 2, marginBottom: 6, overflow: "hidden" }}>
            <motion.div style={{ height: "100%", background: `linear-gradient(90deg, ${tokens.accent}, ${tokens.accentLight})`, borderRadius: 2, width: `${progress}%` }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
            <span>1:{String(Math.floor(progress * 0.3)).padStart(2,"0")}</span>
            <span>3:47</span>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, marginTop: "auto" }}>
          <Volume2 size={16} color="rgba(255,255,255,0.35)" />
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setIsPlaying(p => !p)}
            style={{ background: "none", border: "none", cursor: "pointer" }}>
            {isPlaying
              ? <PauseCircle size={42} fill={tokens.accent} color="transparent" />
              : <PlayCircle size={42} fill={tokens.accent} color="transparent" />}
          </motion.button>
          <SkipForward size={16} color="rgba(255,255,255,0.35)" />
        </div>
      </div>
    </GlassCard>
  );
}

// ─── TRENDING TABLE ───────────────────────────────────────────────────────────
function TrendingCard() {
  return (
    <GlassCard hover={false}>
      <div style={{ padding: "24px 24px 8px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#fff" }}>Trending Tracks</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>Last 7 days</div>
          </div>
          <PillButton small>View All <ChevronRight size={13} /></PillButton>
        </div>

        {trending.map((track, i) => (
          <motion.div
            key={track.rank}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + i * 0.07 }}
            whileHover={{ background: "rgba(124,58,237,0.08)", borderRadius: 12, marginLeft: -8, marginRight: -8, paddingLeft: 8, paddingRight: 8 }}
            style={{ display: "flex", alignItems: "center", gap: 14, padding: "11px 0", borderBottom: i < trending.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none", transition: "all 0.15s", cursor: "pointer" }}
          >
            <span style={{ fontSize: 13, fontWeight: 700, color: i < 3 ? tokens.accentLight : "rgba(255,255,255,0.25)", width: 18, textAlign: "center" }}>
              {track.rank}
            </span>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: `linear-gradient(135deg, hsl(${240 + i*25},70%,30%), hsl(${260 + i*20},80%,45%))`,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Music size={14} color="rgba(255,255,255,0.8)" />
            </div>
            <div style={{ flex: 1, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {track.title}
                </span>
                {track.hot && (
                  <span style={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Flame size={11} color="#f59e0b" />
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>{track.artist}</div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>{track.plays}</div>
              <div style={{ fontSize: 11, color: track.change.startsWith("+") ? "#10b981" : "#ef4444" }}>{track.change}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </GlassCard>
  );
}

// ─── FEATURE CARD ─────────────────────────────────────────────────────────────
export function FeatureCard({ icon: Icon, title, description, badge, accentColor = tokens.accent, large }) {
  return (
    <GlassCard glowColor={accentColor} hover>
      <div style={{ padding: large ? "32px" : "24px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{
            width: large ? 52 : 44, height: large ? 52 : 44, borderRadius: 16,
            background: `${accentColor}15`, border: `1px solid ${accentColor}30`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 0 20px ${accentColor}20`,
          }}>
            <Icon size={large ? 24 : 20} color={accentColor} />
          </div>
          {badge && (
            <span style={{
              fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
              color: accentColor,
              background: `${accentColor}15`,
              border: `1px solid ${accentColor}25`,
              padding: "3px 10px", borderRadius: 999,
            }}>
              {badge}
            </span>
          )}
        </div>
        <div style={{ fontSize: large ? 20 : 16, fontWeight: 700, color: "#fff", letterSpacing: -0.3, marginBottom: 8 }}>
          {title}
        </div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>
          {description}
        </div>
        <motion.div
          whileHover={{ x: 4 }}
          style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 18, color: accentColor, fontSize: 13, fontWeight: 600 }}
        >
          Explore <ArrowUpRight size={14} />
        </motion.div>
      </div>
    </GlassCard>
  );
}

// ─── FLOATING SIDEBAR ─────────────────────────────────────────────────────────
function Sidebar({ active, setActive, collapsed, setCollapsed }) {
  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{
        height: "100vh", position: "fixed", left: 0, top: 0,
        background: "rgba(9,9,20,0.85)",
        backdropFilter: "blur(30px)",
        WebkitBackdropFilter: "blur(30px)",
        borderRight: `1px solid ${tokens.border}`,
        display: "flex", flexDirection: "column",
        zIndex: 100, overflow: "hidden",
      }}
    >
      {/* Logo */}
      <div style={{ padding: "24px 20px 20px", borderBottom: `1px solid ${tokens.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              style={{ display: "flex", alignItems: "center", gap: 10 }}
            >
              <div style={{ width: 32, height: 32, borderRadius: 10, background: `linear-gradient(135deg, ${tokens.accent}, #a78bfa)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Sparkles size={16} color="#fff" />
              </div>
              <span style={{ fontSize: 17, fontWeight: 800, color: "#fff", letterSpacing: -0.5, whiteSpace: "nowrap" }}>Vibecore</span>
            </motion.div>
          )}
        </AnimatePresence>
        {collapsed && (
          <div style={{ width: 32, height: 32, borderRadius: 10, background: `linear-gradient(135deg, ${tokens.accent}, #a78bfa)`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
            <Sparkles size={16} color="#fff" />
          </div>
        )}
        {!collapsed && (
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setCollapsed(true)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", padding: 4 }}>
            <X size={16} />
          </motion.button>
        )}
      </div>

      {/* Nav Items */}
      <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
        {navItems.map(item => {
          const isActive = active === item.id;
          const Icon = item.icon;
          return (
            <motion.button
              key={item.id}
              whileHover={{ x: collapsed ? 0 : 3 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { setActive(item.id); if (collapsed) setCollapsed(false); }}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: collapsed ? "12px" : "11px 14px",
                borderRadius: 12, border: "none",
                background: isActive ? tokens.accentSoft : "transparent",
                color: isActive ? tokens.accentLight : "rgba(255,255,255,0.4)",
                fontSize: 14, fontWeight: isActive ? 600 : 500,
                cursor: "pointer", transition: "all 0.15s",
                justifyContent: collapsed ? "center" : "flex-start",
                fontFamily: "inherit",
                position: "relative",
              }}
            >
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  style={{
                    position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)",
                    width: 3, height: 20, borderRadius: 2,
                    background: `linear-gradient(180deg, ${tokens.accent}, ${tokens.accentLight})`,
                  }}
                />
              )}
              <Icon size={18} />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    style={{ whiteSpace: "nowrap", overflow: "hidden" }}
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{ padding: "12px", borderTop: `1px solid ${tokens.border}` }}>
        <motion.button
          whileHover={{ x: collapsed ? 0 : 3 }}
          style={{ display: "flex", alignItems: "center", gap: 12, padding: collapsed ? "12px" : "11px 14px", borderRadius: 12, border: "none", background: "transparent", color: "rgba(255,255,255,0.3)", fontSize: 14, cursor: "pointer", width: "100%", justifyContent: collapsed ? "center" : "flex-start", fontFamily: "inherit" }}
        >
          <LogOut size={18} />
          {!collapsed && <span>Sign Out</span>}
        </motion.button>
      </div>
    </motion.aside>
  );
}

// ─── TOP BAR ──────────────────────────────────────────────────────────────────
function TopBar({ collapsed, setCollapsed }) {
  const [query, setQuery] = useState("");
  return (
    <div style={{
      position: "fixed", top: 0, right: 0, left: collapsed ? 72 : 240,
      height: 68, zIndex: 90,
      background: "rgba(9,9,20,0.7)",
      backdropFilter: "blur(24px)",
      WebkitBackdropFilter: "blur(24px)",
      borderBottom: `1px solid ${tokens.border}`,
      display: "flex", alignItems: "center",
      padding: "0 28px", gap: 16,
      transition: "left 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    }}>
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => setCollapsed(c => !c)}
        style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", padding: 8, borderRadius: 10, display: "flex" }}
      >
        <Menu size={18} />
      </motion.button>

      {/* Search */}
      <div style={{
        flex: 1, maxWidth: 400, display: "flex", alignItems: "center", gap: 10,
        background: "rgba(255,255,255,0.05)", border: `1px solid ${tokens.border}`,
        borderRadius: 12, padding: "9px 14px",
        transition: "border-color 0.2s",
      }}>
        <Search size={15} color="rgba(255,255,255,0.3)" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search tracks, artists…"
          style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#fff", fontSize: 13, fontFamily: "inherit" }}
        />
      </div>

      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
        <PillButton small icon={Sparkles} primary>Upgrade</PillButton>

        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          style={{ position: "relative", background: tokens.surface, border: `1px solid ${tokens.border}`, borderRadius: 12, width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <Bell size={16} color="rgba(255,255,255,0.6)" />
          <div style={{ position: "absolute", top: 8, right: 8, width: 7, height: 7, borderRadius: "50%", background: tokens.accent, border: "2px solid #090914" }} />
        </motion.button>

        <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg, ${tokens.accent}, #a78bfa)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#fff", cursor: "pointer" }}>
          A
        </div>
      </div>
    </div>
  );
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#090914",
      fontFamily: "'Plus Jakarta Sans', 'DM Sans', system-ui, sans-serif",
      color: "#fff",
    }}>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::placeholder { color: rgba(255,255,255,0.25); }
        body { background: #090914; }

        /* Ambient bg orbs */
        .orb1 { position:fixed;top:-20%;left:10%;width:500px;height:500px;border-radius:50%;background:radial-gradient(circle,rgba(124,58,237,0.12) 0%,transparent 70%);pointer-events:none;z-index:0; }
        .orb2 { position:fixed;bottom:-10%;right:5%;width:400px;height:400px;border-radius:50%;background:radial-gradient(circle,rgba(6,182,212,0.08) 0%,transparent 70%);pointer-events:none;z-index:0; }
      `}</style>

      {/* Ambient orbs */}
      <div className="orb1" />
      <div className="orb2" />

      <Sidebar active={activeNav} setActive={setActiveNav} collapsed={collapsed} setCollapsed={setCollapsed} />
      <TopBar collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Page Content */}
      <motion.main
        animate={{ marginLeft: collapsed ? 72 : 240 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{ paddingTop: 68, minHeight: "100vh", position: "relative", zIndex: 1 }}
      >
        <div style={{ padding: "36px 32px 60px", maxWidth: 1280 }}>

          {/* Page Header */}
          <motion.div initial="hidden" animate="show" variants={stagger} style={{ marginBottom: 32 }}>
            <motion.div variants={fadeUp} style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: tokens.accentLight, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
                  Good morning, Alex ✦
                </div>
                <h1 style={{ fontSize: 34, fontWeight: 800, color: "#fff", letterSpacing: -1, lineHeight: 1.1 }}>
                  Your Dashboard
                </h1>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <PillButton icon={BarChart2}>Export</PillButton>
                <PillButton primary icon={Globe}>Go Live</PillButton>
              </div>
            </motion.div>
          </motion.div>

          {/* BENTO GRID */}
          <motion.div
            initial="hidden"
            animate="show"
            variants={stagger}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(12, 1fr)",
              gridTemplateRows: "auto",
              gap: 16,
            }}
          >
            {/* ── Row 1: Stats ── */}
            {stats.map((stat, i) => (
              <motion.div key={stat.label} variants={scaleIn} style={{ gridColumn: "span 3" }}>
                <StatCard stat={stat} />
              </motion.div>
            ))}

            {/* ── Row 2: Chart + Now Playing + Quick Stats ── */}

            {/* Weekly Streams Chart - spans 5 cols */}
            <motion.div variants={scaleIn} style={{ gridColumn: "span 5" }}>
              <GlassCard hover={false}>
                <div style={{ padding: "24px 24px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <div style={{ fontSize: 17, fontWeight: 700, color: "#fff" }}>Weekly Streams</div>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.05)", padding: "3px 10px", borderRadius: 999 }}>This week</span>
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: -1, marginBottom: 4 }}>
                    847K <span style={{ fontSize: 13, fontWeight: 500, color: "#10b981" }}>↑ 14.2%</span>
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginBottom: 20 }}>vs 741K last week</div>
                  <MiniBarChart />
                  <div style={{ display: "flex", gap: 4, marginTop: 8, justifyContent: "space-around" }}>
                    {weeks.map(d => (
                      <span key={d} style={{ flex: 1, textAlign: "center", fontSize: 10, color: "rgba(255,255,255,0.25)" }}>{d}</span>
                    ))}
                  </div>
                </div>
              </GlassCard>
            </motion.div>

            {/* Now Playing - spans 3 cols */}
            <motion.div variants={scaleIn} style={{ gridColumn: "span 3" }}>
              <NowPlayingCard />
            </motion.div>

            {/* Quick Stats panel - spans 4 cols */}
            <motion.div variants={scaleIn} style={{ gridColumn: "span 4", display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "Top Genre", value: "Electronic", icon: Zap, color: "#7c3aed" },
                { label: "New Followers", value: "+2,841", icon: Users, color: "#06b6d4" },
                { label: "Avg. Rating", value: "4.87 ★", icon: Star, color: "#f59e0b" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <GlassCard key={item.label} glowColor={item.color} hover>
                    <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: `${item.color}15`, border: `1px solid ${item.color}25`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Icon size={18} color={item.color} />
                      </div>
                      <div>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 3 }}>{item.label}</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{item.value}</div>
                      </div>
                    </div>
                  </GlassCard>
                );
              })}
            </motion.div>

            {/* ── Row 3: Trending + Feature Cards ── */}

            {/* Trending - spans 7 cols */}
            <motion.div variants={scaleIn} style={{ gridColumn: "span 7" }}>
              <TrendingCard />
            </motion.div>

            {/* Feature Cards column - spans 5 cols */}
            <motion.div variants={scaleIn} style={{ gridColumn: "span 5", display: "flex", flexDirection: "column", gap: 12 }}>
              <FeatureCard
                icon={Sparkles}
                title="AI Recommendations"
                description="Personalized playlists generated from your listening patterns using machine learning."
                badge="NEW"
                accentColor="#7c3aed"
              />
              <FeatureCard
                icon={Globe}
                title="Global Reach"
                description="Your music is streaming in 42 countries. Expand to new markets with one click."
                accentColor="#06b6d4"
              />
              <FeatureCard
                icon={Shield}
                title="Rights Protection"
                description="Automated DMCA monitoring across all major platforms."
                accentColor="#10b981"
              />
            </motion.div>

            {/* ── Row 4: Wide feature card ── */}
            <motion.div variants={scaleIn} style={{ gridColumn: "span 12" }}>
              <GlassCard hover={false}>
                <div style={{ padding: "28px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                    <div style={{ width: 56, height: 56, borderRadius: 18, background: `linear-gradient(135deg, ${tokens.accent}, #a78bfa)`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 30px ${tokens.accentGlow}` }}>
                      <Radio size={24} color="#fff" />
                    </div>
                    <div>
                      <div style={{ fontSize: 19, fontWeight: 700, color: "#fff", letterSpacing: -0.3 }}>Launch Your Next Release</div>
                      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 4 }}>
                        Distribute to Spotify, Apple Music, and 50+ platforms instantly. Your audience is waiting.
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <PillButton>Learn More</PillButton>
                    <PillButton primary icon={Zap}>Start Distribution</PillButton>
                  </div>
                </div>
                {/* Decorative gradient strip */}
                <div style={{ height: 2, background: `linear-gradient(90deg, ${tokens.accent}80, #06b6d480, #10b98180, transparent)` }} />
              </GlassCard>
            </motion.div>
          </motion.div>
        </div>
      </motion.main>
    </div>
  );
}
