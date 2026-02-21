import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  Bell,
  Calendar,
  Check,
  ClipboardList,
  CloudSun,
  Crown,
  Download,
  Flame,
  Moon,
  Image as ImageIcon,
  LayoutGrid,
  Lock,
  LogIn,
  MapPin,
  MessageSquare,
  Sun,
  Pencil,
  Plus,
  Trophy,
  Trash2,
  Upload,
  Users,
  Video as VideoIcon,
  X,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const STORAGE_KEY = "skateflow_clean_v1";

const DEFAULT_PLANS = {
  "Grind Day": [
    { id: "gd-1", label: "FS Grinds (Big Bowl / Small Wall)", target: 30, notes: "Bonus: deep end at Harbor" },
    { id: "gd-2", label: "FS 50-50", target: 20, notes: "If too easy, change to grinds" },
    { id: "gd-3", label: "BS 50-50 Grinds", target: 20 },
    { id: "gd-4", label: "Rock n Rolls", target: 5 },
    { id: "gd-5", label: "Fakie Smith", target: 3 },
    { id: "gd-6", label: "50-50 Stall (Deep End)", target: 2, notes: "Harbor deep end" },
  ],
  "Frontside Day": [
    { id: "fs-1", label: "FS Grinds", target: 35, notes: "Frontside only — no backside turns" },
    { id: "fs-2", label: "FS 50-50", target: 25 },
    { id: "fs-3", label: "FS Airs (Lift / Grab / Pull)", target: 30 },
  ],
  "Air Day": [
    { id: "ad-1", label: "FS Airs (BIG lift)", target: 40, notes: "Should be close to tile. Can warm up halfway" },
    { id: "ad-2", label: "BS Airs", target: 30, notes: "Back wheels fully lapped over coping THEN grab" },
  ],
};

const SOCIAL_PRESETS = {
  reels: { key: "reels", label: "Reels/TikTok (9:16)", width: 720, height: 1280 },
  square: { key: "square", label: "Square (1:1)", width: 1080, height: 1080 },
  feed: { key: "feed", label: "Feed (4:5)", width: 864, height: 1080 },
  wide: { key: "wide", label: "YouTube (16:9)", width: 1280, height: 720 },
};

const SOCIAL_QUALITY = {
  small: { key: "small", label: "Small file", imageQ: 0.72, videoScale: 0.7, bitrate: 1200000 },
  medium: { key: "medium", label: "Balanced", imageQ: 0.82, videoScale: 0.85, bitrate: 2400000 },
  high: { key: "high", label: "High quality", imageQ: 0.92, videoScale: 1, bitrate: 4200000 },
};

const SKATE_PARK_SUGGESTIONS = [
  "Vans Off The Wall Skatepark Huntington Beach CA",
  "Channel Street Skatepark San Pedro CA",
  "Venice Beach Skatepark Los Angeles CA",
  "Stoner Skate Plaza Los Angeles CA",
  "Linda Vista Skatepark San Diego CA",
];

const WEATHER_CODE_LABELS = {
  0: "Clear",
  1: "Mainly Clear",
  2: "Partly Cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Rime Fog",
  51: "Light Drizzle",
  53: "Drizzle",
  55: "Dense Drizzle",
  56: "Freezing Drizzle",
  57: "Dense Freezing Drizzle",
  61: "Light Rain",
  63: "Rain",
  65: "Heavy Rain",
  66: "Freezing Rain",
  67: "Heavy Freezing Rain",
  71: "Light Snow",
  73: "Snow",
  75: "Heavy Snow",
  77: "Snow Grains",
  80: "Rain Showers",
  81: "Heavy Rain Showers",
  82: "Violent Showers",
  85: "Snow Showers",
  86: "Heavy Snow Showers",
  95: "Thunderstorm",
  96: "Thunderstorm + Hail",
  99: "Heavy Thunderstorm + Hail",
};

const INITIAL_STORE = {
  members: [
    { id: "m-1", name: "Myisha", role: "owner", pin: "", photoUrl: "" },
    { id: "m-2", name: "Coach", role: "coach", pin: "", photoUrl: "" },
    { id: "m-3", name: "Dad", role: "dad", pin: "", photoUrl: "" },
  ],
  skaters: [{ id: "s-1", name: "Conner", photoUrl: "" }],
  plans: DEFAULT_PLANS,
  sessions: [],
  chatBySkaterId: {},
  practiceEvents: [],
  xpBySkaterId: {},
  xpMilestonesBySkaterId: {},
  practiceSettings: { durationMin: 60, remindMin: 60, title: "SkateFlow Practice" },
  reminders: { enabled: false, time: "17:00" },
  draft: { date: todayISO(), park: "", dayType: Object.keys(DEFAULT_PLANS)[0], completedByTaskId: {} },
  auth: { loggedInMemberId: null },
  ui: { view: "log", activeMemberId: "m-1", activeSkaterId: "s-1", theme: "dark" },
  contestBySkaterId: {},
  coachDemosBySkaterId: {},
  dayTripsBySkaterId: {},
  achievementCardsBySkaterId: {},
};

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(16).slice(2)}`;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function clampNum(n) {
  if (n === "") return "";
  const v = Number(n);
  if (Number.isNaN(v)) return "";
  return Math.max(0, Math.floor(v));
}

function pct(a, b) {
  if (!b) return 0;
  return Math.max(0, Math.min(100, Math.round((a / b) * 100)));
}

function formatShortDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function weatherLabelFromCode(code) {
  return WEATHER_CODE_LABELS[Number(code)] || "Unknown";
}

function getISOWeekKey(dateISO) {
  const [y, m, d] = dateISO.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + 4 - (dt.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((dt - yearStart) / 86400000) + 1) / 7);
  return `${dt.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function formatWeekLabel(weekKey) {
  const [yy, ww] = String(weekKey || "").split("-W");
  return `Week ${Number(ww) || ""} • ${yy || ""}`.trim();
}

function getCardTier(percent) {
  if (percent >= 95) return { label: "LEGENDARY", color: "text-yellow-300", ring: "ring-yellow-500/40" };
  if (percent >= 85) return { label: "GOLD", color: "text-amber-300", ring: "ring-amber-500/40" };
  if (percent >= 70) return { label: "SILVER", color: "text-slate-200", ring: "ring-slate-500/40" };
  return { label: "BRONZE", color: "text-orange-300", ring: "ring-orange-500/40" };
}

function computeOVR(session) {
  const completion = pct(session.totalCompleted || 0, session.totalTarget || 1);
  const bonus = session.freePlayEarned ? 5 : 0;
  const mediaBonus = (session.media?.length || 0) > 0 ? 2 : 0;
  const commentBonus = (session.comments?.length || 0) > 0 ? 2 : 0;
  return Math.min(99, Math.round(completion * 0.9 + bonus + mediaBonus + commentBonus));
}

const XP_LEVELS = [
  { key: "ROOKIE", min: 0, next: 500 },
  { key: "AM", min: 500, next: 1500 },
  { key: "PRO", min: 1500, next: 3000 },
  { key: "ELITE", min: 3000, next: Infinity },
];

function levelFromXP(totalXP) {
  const xp = Math.max(0, Number(totalXP) || 0);
  const found = XP_LEVELS.slice().reverse().find((l) => xp >= l.min) || XP_LEVELS[0];
  const idx = XP_LEVELS.findIndex((l) => l.key === found.key);
  const next = XP_LEVELS[Math.min(XP_LEVELS.length - 1, idx + 1)];
  return {
    key: found.key,
    min: found.min,
    next: found.next,
    nextKey: next?.key || found.key,
    pctToNext: found.next === Infinity ? 100 : pct(xp - found.min, found.next - found.min),
  };
}

function xpForSession(session) {
  const completion = pct(session.totalCompleted || 0, session.totalTarget || 1);
  const base = Math.round(completion * 2);
  const freePlay = session.freePlayEarned ? 25 : 0;
  const media = Math.min(3, session.media?.length || 0) * 15;
  const coach = (session.comments?.length || 0) > 0 ? 10 : 0;
  const intensity = session.dayType === "Air Day" ? 10 : 0;
  return Math.max(0, base + freePlay + media + coach + intensity);
}

function getPlayerLevel(ovr) {
  if (ovr >= 92) return { label: "ELITE", color: "text-fuchsia-300" };
  if (ovr >= 82) return { label: "PRO", color: "text-cyan-300" };
  if (ovr >= 70) return { label: "AM", color: "text-emerald-300" };
  return { label: "ROOKIE", color: "text-amber-300" };
}

function pickHeroMedia(media) {
  if (!media?.length) return null;
  const vid = media.find((m) => m.type?.startsWith("video/"));
  return vid || media[0];
}

function mediaFromFiles(fileList) {
  return Array.from(fileList || []).map((f) => ({
    id: `m-${uid()}`,
    type: f.type,
    name: f.name,
    size: f.size,
    url: URL.createObjectURL(f),
    comment: "",
  }));
}

function downloadTextFile(filename, text, mime = "text/plain") {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadBlobFile(filename, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function chooseRecorderMimeType() {
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];
  for (const c of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported?.(c)) return c;
  }
  return "";
}

function drawCoverFrame(ctx, source, outW, outH, srcW, srcH) {
  const targetRatio = outW / outH;
  const srcRatio = srcW / srcH;
  let sx = 0;
  let sy = 0;
  let sw = srcW;
  let sh = srcH;

  if (srcRatio > targetRatio) {
    sw = srcH * targetRatio;
    sx = (srcW - sw) / 2;
  } else {
    sh = srcW / targetRatio;
    sy = (srcH - sh) / 2;
  }
  ctx.drawImage(source, sx, sy, sw, sh, 0, 0, outW, outH);
}

function exportCSV(sessions) {
  const headers = [
    "skater",
    "date",
    "dayType",
    "park",
    "totalCompleted",
    "totalTarget",
    "completionPct",
    "freePlay",
    "ovr",
    "xpGained",
    "xpTotalAfter",
  ];

  const esc = (v) => {
    const s = String(v ?? "");
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const rows = (sessions || []).map((s) => {
    const completionPct2 = pct(s.totalCompleted || 0, s.totalTarget || 1);
    const ovr = computeOVR(s);
    const xpGained = typeof s.xpGained === "number" ? s.xpGained : xpForSession(s);

    return [
      s.skaterName || "",
      s.date || "",
      s.dayType || "",
      String(s.park || "").replace(/\r?\n/g, " "),
      s.totalCompleted ?? 0,
      s.totalTarget ?? 0,
      completionPct2,
      s.freePlayEarned ? "Yes" : "No",
      ovr,
      xpGained,
      s.xpTotalAfter ?? "",
    ];
  });

  const csv = [headers.join(","), ...rows.map((r) => r.map(esc).join(","))].join("\n");
  downloadTextFile(`skateflow-sessions-${todayISO()}.csv`, csv, "text/csv");
}

function exportICSPractice(dateISO, title, notes, opts = {}) {
  const { time = "17:00", durationMin = 60, remindMin = 60 } = opts;

  const pad = (n) => String(n).padStart(2, "0");
  const formatLocal = (d) =>
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;

  const [hh, mm] = String(time || "17:00").split(":").map((x) => parseInt(x, 10));

  const startLocal = new Date(`${String(dateISO || todayISO())}T${pad(hh || 0)}:${pad(mm || 0)}:00`);
  const endLocal = new Date(startLocal.getTime() + Math.max(5, Number(durationMin) || 60) * 60 * 1000);

  const safeNotes = String(notes || "").replace(/\r?\n/g, " ");
  const safeTitle = String(title || "SkateFlow Practice").replace(/\r?\n/g, " ");
  const alarm = Math.max(0, Number(remindMin) || 0);
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SkateFlow//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid()}@skateflow`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
    `DTSTART:${formatLocal(startLocal)}`,
    `DTEND:${formatLocal(endLocal)}`,
    `SUMMARY:${safeTitle}`,
    `DESCRIPTION:${safeNotes}`,
    ...(alarm
      ? [
          "BEGIN:VALARM",
          "ACTION:DISPLAY",
          `DESCRIPTION:${safeTitle}`,
          `TRIGGER:-PT${alarm}M`,
          "END:VALARM",
        ]
      : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\n");

  downloadTextFile(`skateflow-practice-${dateISO}.ics`, ics, "text/calendar");
}

function parseICSDateTime(value) {
  const v = String(value || "").trim();
  if (!v) return null;

  const datePart = v.slice(0, 8);
  const y = Number(datePart.slice(0, 4));
  const m = Number(datePart.slice(4, 6));
  const d = Number(datePart.slice(6, 8));

  if (!v.includes("T")) {
    return {
      dateISO: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      time: "09:00",
      dateObj: new Date(y, m - 1, d, 9, 0, 0),
    };
  }

  const timePart = v.split("T")[1].replace("Z", "");
  const hh = Number(timePart.slice(0, 2) || 0);
  const mm = Number(timePart.slice(2, 4) || 0);

  return {
    dateISO: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
    time: `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`,
    dateObj: new Date(y, m - 1, d, hh, mm, 0),
  };
}

function importPracticesFromICS(icsText, fallback = {}) {
  const text = String(icsText || "");
  const events = [];
  const blocks = text.split("BEGIN:VEVENT").slice(1);

  for (const b of blocks) {
    const block = b.split("END:VEVENT")[0] || "";
    const get = (key) => {
      const m = block.match(new RegExp(`^${key}(?:;[^:]*)?:(.*)$`, "m"));
      return m ? String(m[1] || "").trim() : "";
    };

    const dtStartRaw = get("DTSTART");
    const dtEndRaw = get("DTEND");
    const summary = get("SUMMARY") || fallback.title || "SkateFlow Practice";
    const desc = get("DESCRIPTION") || "";

    const start = parseICSDateTime(dtStartRaw);
    const end = parseICSDateTime(dtEndRaw);
    if (!start) continue;

    const durationMin = end?.dateObj
      ? Math.max(5, Math.round((end.dateObj.getTime() - start.dateObj.getTime()) / 60000))
      : Number(fallback.durationMin) || 60;

    events.push({
      id: `pe-${uid()}`,
      dateISO: start.dateISO,
      time: start.time,
      durationMin,
      remindMin: Number(fallback.remindMin) || 60,
      title: summary,
      notes: desc.replace(/\n/g, "\n"),
      skaterId: fallback.skaterId || "",
      skaterName: fallback.skaterName || "",
      createdAt: new Date().toISOString(),
      source: "ics",
    });
  }

  return events;
}

function useLocalStorageState(key, initialValue) {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return initialValue;
      return JSON.parse(raw);
    } catch {
      return initialValue;
    }
  });

  React.useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [key, state]);

  return [state, setState];
}

function Pill({ children, tone = "neutral" }) {
  const map = {
    neutral: "bg-white/10 text-white ring-white/10",
    good: "bg-emerald-500/15 text-emerald-200 ring-emerald-500/20",
    bad: "bg-rose-500/15 text-rose-200 ring-rose-500/20",
    warn: "bg-amber-500/15 text-amber-200 ring-amber-500/20",
    cyan: "bg-cyan-500/15 text-cyan-200 ring-cyan-500/20",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${map[tone] || map.neutral}`}>
      {children}
    </span>
  );
}

function TabButton({ active, icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-2xl px-3 py-2.5 text-sm font-semibold inline-flex items-center justify-center gap-2 ring-1 transition shadow-sm ${
        active ? "bg-white text-black ring-white" : "bg-white/5 text-white ring-white/10 hover:bg-white/10"
      }`}
    >
      <Icon className="h-4 w-4" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function Stat({ label, value, tone = "neutral" }) {
  const toneClass = {
    neutral: "text-white",
    good: "text-emerald-300",
    bad: "text-rose-300",
    cyan: "text-cyan-300",
    gold: "text-amber-300",
  };
  return (
    <div className="rounded-2xl bg-black/30 p-3 ring-1 ring-white/10">
      <div className="text-xs text-white/60">{label}</div>
      <div className={`mt-1 text-lg font-bold ${toneClass[tone] || toneClass.neutral}`}>{value}</div>
    </div>
  );
}

function Toasts({ toasts, onDismiss }) {
  return (
    <div className="fixed bottom-4 right-4 z-[999] w-[min(420px,calc(100vw-2rem))] space-y-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            className="rounded-2xl bg-black/80 backdrop-blur ring-1 ring-white/10 p-3 shadow-2xl"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {t.type === "success" ? (
                  <div className="h-8 w-8 rounded-xl bg-emerald-500/15 ring-1 ring-emerald-500/20 flex items-center justify-center">
                    <Check className="h-4 w-4 text-emerald-200" />
                  </div>
                ) : t.type === "warn" ? (
                  <div className="h-8 w-8 rounded-xl bg-amber-500/15 ring-1 ring-amber-500/20 flex items-center justify-center">
                    <Bell className="h-4 w-4 text-amber-200" />
                  </div>
                ) : (
                  <div className="h-8 w-8 rounded-xl bg-cyan-500/15 ring-1 ring-cyan-500/20 flex items-center justify-center">
                    <MessageSquare className="h-4 w-4 text-cyan-200" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold">{t.title}</div>
                {t.message ? <div className="mt-0.5 text-sm text-white/70">{t.message}</div> : null}
              </div>
              <button
                type="button"
                onClick={() => onDismiss(t.id)}
                className="rounded-xl p-2 hover:bg-white/5 ring-1 ring-white/10"
                title="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function Modal({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        className="relative w-full max-w-lg rounded-3xl bg-gradient-to-br from-zinc-950 via-black to-zinc-900 ring-1 ring-white/10 shadow-2xl p-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs tracking-widest text-white/50">SECURE ACCESS</div>
            <div className="mt-1 text-xl font-extrabold">{title}</div>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 hover:bg-white/5 ring-1 ring-white/10" title="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </motion.div>
    </div>
  );
}

export default function SkateTrainingPlanApp() {
  const [cardsMode, setCardsMode] = useState("sessions");
  const [binderFilter, setBinderFilter] = useState("all"); // all | newtrick | levelup | xp | weekly | achievement
  const [xpPop, setXpPop] = useState(null); // { id, amount, levelUp }
  const [achievementPop, setAchievementPop] = useState(null); // card object
  const [store, setStore] = useLocalStorageState(STORAGE_KEY, INITIAL_STORE);

  const setSlice = (patch) => setStore((prev) => ({ ...(prev || {}), ...patch }));

  const members = store.members || [];
  const skaters = store.skaters || [];
  const plans = store.plans || DEFAULT_PLANS;
  const sessions = store.sessions || [];
  const chatBySkaterId = store.chatBySkaterId || {};
  const practiceEvents = store.practiceEvents || [];
  const practiceSettings = store.practiceSettings || { durationMin: 60, remindMin: 60, title: "SkateFlow Practice" };
  const reminders = store.reminders || { enabled: false, time: "17:00" };
  const draft = store.draft || { date: todayISO(), park: "", dayType: Object.keys(plans)[0], completedByTaskId: {} };
  const auth = store.auth || { loggedInMemberId: null };
  const ui = store.ui || { view: "log", activeMemberId: members[0]?.id, activeSkaterId: skaters[0]?.id, theme: "dark" };
  const xpBySkaterId = store.xpBySkaterId || {};
  const xpMilestonesBySkaterId = store.xpMilestonesBySkaterId || {};
  const contestBySkaterId = store.contestBySkaterId || {};
  const coachDemosBySkaterId = store.coachDemosBySkaterId || {};
  const dayTripsBySkaterId = store.dayTripsBySkaterId || {};
  const achievementCardsBySkaterId = store.achievementCardsBySkaterId || {};
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState(() => new Date());

  const setUI = (patch) => setSlice({ ui: { ...ui, ...patch } });
  const setDraft = (patch) => {
    setSlice({ draft: { ...draft, ...patch } });
    setLastDraftSavedAt(new Date());
  };

  const [toasts, setToasts] = useState([]);
  const toast = (title, message = "", type = "info") => {
    const id = `t-${uid()}`;
    setToasts((p) => [...p, { id, title, message, type }]);
    window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3500);
  };

  const activeMember = useMemo(() => members.find((m) => m.id === ui.activeMemberId) || members[0], [members, ui.activeMemberId]);
  const activeSkater = useMemo(() => skaters.find((s) => s.id === ui.activeSkaterId) || skaters[0], [skaters, ui.activeSkaterId]);

  const canEditPlans = activeMember?.role === "owner" || activeMember?.role === "coach";
  const canComment = activeMember?.role === "owner" || activeMember?.role === "coach";
  const canManageTeam = activeMember?.role === "owner";
  const roleKey = String(activeMember?.role || "").trim().toLowerCase();
  const canUseCoachCorner =
    roleKey === "owner" || roleKey === "coach" || roleKey === "dad" || roleKey === "parent";
  const isSkaterSelf =
    (activeMember?.role || "").toLowerCase() === "skater" ||
    String(activeMember?.name || "").trim().toLowerCase() === String(activeSkater?.name || "").trim().toLowerCase();
  const canUploadDayTrips = canUseCoachCorner || isSkaterSelf;
  const isLightMode = (ui.theme || "dark") === "light";

  const tasks = useMemo(() => plans[draft.dayType] || [], [plans, draft.dayType]);
  const totalTarget = useMemo(() => tasks.reduce((sum, t) => sum + (Number(t.target) || 0), 0), [tasks]);
  const totalCompleted = useMemo(
    () => tasks.reduce((sum, t) => sum + (Number(draft.completedByTaskId?.[t.id]) || 0), 0),
    [tasks, draft.completedByTaskId]
  );
  const completionPct = useMemo(() => pct(totalCompleted, totalTarget || 1), [totalCompleted, totalTarget]);
  const halfwayReached = completionPct >= 50;

  const streakBySkater = useMemo(() => {
    const by = new Map();
    const sorted = [...sessions].sort((a, b) => (a.date < b.date ? 1 : -1));
    for (const s of sorted) {
      if (!by.has(s.skaterId)) by.set(s.skaterId, []);
      by.get(s.skaterId).push(s);
    }
    const streak = {};
    for (const [skaterId, arr] of by.entries()) {
      let count = 0;
      for (const sess of arr) {
        const p = pct(sess.totalCompleted || 0, sess.totalTarget || 1);
        if (p >= 70) count += 1;
        else break;
      }
      streak[skaterId] = count;
    }
    return streak;
  }, [sessions]);

  const topStreak = streakBySkater[ui.activeSkaterId] || 0;

  const [loginOpen, setLoginOpen] = useState(!auth.loggedInMemberId);
  const [loginPickId, setLoginPickId] = useState(auth.loggedInMemberId || members[0]?.id);
  const [loginPin, setLoginPin] = useState("");
  const [loginError, setLoginError] = useState("");

  const ensurePinRequired = (memberId) => {
    const m = members.find((x) => x.id === memberId);
    if (!m) return true;
    if (m.pin && String(m.pin).trim().length >= 4) return true;

    let nextPin = prompt(`Set a PIN for ${m.name} (required — min 4 digits):`, "");
    if (nextPin == null) return false;
    nextPin = String(nextPin).trim();
    if (nextPin.length < 4) {
      alert("PIN must be at least 4 characters.");
      return false;
    }
    setSlice({ members: members.map((x) => (x.id === memberId ? { ...x, pin: nextPin } : x)) });
    return true;
  };

  const attemptLogin = (memberId, pin) => {
    const m = members.find((x) => x.id === memberId);
    if (!m) return false;
    if (!ensurePinRequired(memberId)) return false;
    const stored = String(m.pin || "").trim();
    return String(pin || "").trim() === stored;
  };

  const [draftMedia, setDraftMedia] = useState([]);
  const [socialEditor, setSocialEditor] = useState({
    open: false,
    mediaId: "",
    presetKey: "reels",
    qualityKey: "medium",
    trimStart: 0,
    trimEnd: 0,
    duration: 0,
    exporting: false,
  });
  const clearDraftMedia = ({ revoke = true } = {}) => {
    setDraftMedia((prev) => {
      if (revoke) {
        for (const m of prev) {
          if (m?.url) URL.revokeObjectURL(m.url);
        }
      }
      return [];
    });
    setSocialEditor((prev) => ({ ...prev, open: false, mediaId: "", exporting: false }));
  };
  const activeSocialMedia = useMemo(
    () => draftMedia.find((m) => m.id === socialEditor.mediaId) || null,
    [draftMedia, socialEditor.mediaId]
  );

  const addMediaFromFiles = (fileList) => {
    const next = mediaFromFiles(fileList);
    if (!next.length) return;
    setDraftMedia((prev) => [...prev, ...next]);
    toast("Media added", `${next.length} item(s) added.`, "success");
  };

  const removeDraftMedia = (id) => {
    setDraftMedia((prev) => {
      const item = prev.find((x) => x.id === id);
      if (item?.url) URL.revokeObjectURL(item.url);
      return prev.filter((x) => x.id !== id);
    });
  };

  const openSocialEditorForMedia = (media) => {
    if (!media) return;
    setSocialEditor({
      open: true,
      mediaId: media.id,
      presetKey: "reels",
      qualityKey: "medium",
      trimStart: 0,
      trimEnd: 0,
      duration: 0,
      exporting: false,
    });
  };

  const closeSocialEditor = () => {
    setSocialEditor((prev) => ({ ...prev, open: false, exporting: false }));
  };

  useEffect(() => {
    if (!socialEditor.open) return;
    if (!activeSocialMedia?.type?.startsWith("video/")) return;
    const video = document.createElement("video");
    video.preload = "metadata";
    video.src = activeSocialMedia.url;
    const onMeta = () => {
      const duration = Number(video.duration) || 0;
      setSocialEditor((prev) => ({
        ...prev,
        duration,
        trimStart: 0,
        trimEnd: duration ? Math.min(duration, Math.max(1, duration)) : 0,
      }));
    };
    video.addEventListener("loadedmetadata", onMeta);
    return () => {
      video.removeEventListener("loadedmetadata", onMeta);
      video.src = "";
    };
  }, [socialEditor.open, activeSocialMedia?.id]);

  const exportSocialImage = async (media, preset, quality) => {
    const img = new Image();
    img.src = media.url;
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });
    const canvas = document.createElement("canvas");
    canvas.width = preset.width;
    canvas.height = preset.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable");
    drawCoverFrame(ctx, img, canvas.width, canvas.height, img.width, img.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality.imageQ));
    if (!blob) throw new Error("Image export failed");
    const base = (media.name || "photo").replace(/\.[^.]+$/, "");
    downloadBlobFile(`${base}-${preset.key}-${quality.key}.jpg`, blob);
  };

  const exportSocialVideo = async (media, preset, quality, trimStart, trimEnd, duration) => {
    if (typeof MediaRecorder === "undefined") throw new Error("Video export not supported in this browser");

    const video = document.createElement("video");
    video.src = media.url;
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    await new Promise((resolve, reject) => {
      video.onloadedmetadata = resolve;
      video.onerror = reject;
    });

    const maxDuration = Number(duration) || Number(video.duration) || 0;
    const safeStart = Math.max(0, Math.min(Number(trimStart) || 0, Math.max(0, maxDuration - 0.2)));
    const safeEndRaw = Number(trimEnd) || maxDuration;
    const safeEnd = Math.max(safeStart + 0.2, Math.min(safeEndRaw, maxDuration));

    const scale = quality.videoScale || 1;
    const outW = Math.max(320, Math.round((preset.width || 720) * scale));
    const outH = Math.max(320, Math.round((preset.height || 1280) * scale));

    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable");

    const composed = canvas.captureStream(30);
    let sourceWithAudio = null;
    try {
      sourceWithAudio = video.captureStream?.();
      sourceWithAudio?.getAudioTracks?.().forEach((t) => composed.addTrack(t));
    } catch {
      // no audio stream fallback
    }

    const mimeType = chooseRecorderMimeType();
    const recorder = mimeType
      ? new MediaRecorder(composed, { mimeType, videoBitsPerSecond: quality.bitrate })
      : new MediaRecorder(composed, { videoBitsPerSecond: quality.bitrate });
    const chunks = [];
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    const seekTo = (time) =>
      new Promise((resolve) => {
        const onSeeked = () => {
          video.removeEventListener("seeked", onSeeked);
          resolve();
        };
        video.addEventListener("seeked", onSeeked);
        video.currentTime = Math.min(Math.max(0, time), maxDuration || time);
      });

    await seekTo(safeStart);

    const drawFrame = () => {
      if (video.ended || video.paused) return;
      if (video.currentTime >= safeEnd) {
        video.pause();
        if (recorder.state !== "inactive") recorder.stop();
        return;
      }
      drawCoverFrame(ctx, video, outW, outH, video.videoWidth || outW, video.videoHeight || outH);
      requestAnimationFrame(drawFrame);
    };

    const stopPromise = new Promise((resolve) => {
      recorder.onstop = resolve;
    });

    recorder.start(250);
    await video.play();
    drawFrame();
    await stopPromise;
    video.pause();
    video.src = "";

    const blob = new Blob(chunks, { type: mimeType || "video/webm" });
    const ext = (mimeType || "video/webm").includes("webm") ? "webm" : "mp4";
    const base = (media.name || "clip").replace(/\.[^.]+$/, "");
    downloadBlobFile(`${base}-${preset.key}-${quality.key}-trim.${ext}`, blob);
  };

  const runSocialExport = async () => {
    const media = activeSocialMedia;
    if (!media) return;
    const preset = SOCIAL_PRESETS[socialEditor.presetKey] || SOCIAL_PRESETS.reels;
    const quality = SOCIAL_QUALITY[socialEditor.qualityKey] || SOCIAL_QUALITY.medium;

    try {
      setSocialEditor((prev) => ({ ...prev, exporting: true }));
      if (media.type?.startsWith("image/")) {
        await exportSocialImage(media, preset, quality);
      } else if (media.type?.startsWith("video/")) {
        await exportSocialVideo(media, preset, quality, socialEditor.trimStart, socialEditor.trimEnd, socialEditor.duration);
      } else {
        throw new Error("Unsupported media type");
      }
      toast("Social export ready", "Edited media downloaded.", "success");
    } catch (err) {
      toast("Export failed", err?.message || "Could not export media.", "warn");
    } finally {
      setSocialEditor((prev) => ({ ...prev, exporting: false }));
    }
  };

  const [coachDraft, setCoachDraft] = useState({ trickName: "", notes: "", media: [] });
  const [contestDraft, setContestDraft] = useState({
    date: todayISO(),
    contestName: "",
    roundName: "",
    runNumber: "",
    score: "",
    tricks: [{ id: `trk-${uid()}`, name: "", landed: false, points: 10, notes: "" }],
    notes: "",
    media: [],
  });
  const [dayTripDraft, setDayTripDraft] = useState({
    date: todayISO(),
    park: "",
    notes: "",
    media: [],
  });

  const activeCoachDemos = useMemo(() => coachDemosBySkaterId[ui.activeSkaterId] || [], [coachDemosBySkaterId, ui.activeSkaterId]);
  const activeContestRuns = useMemo(() => contestBySkaterId[ui.activeSkaterId] || [], [contestBySkaterId, ui.activeSkaterId]);
  const activeDayTrips = useMemo(() => dayTripsBySkaterId[ui.activeSkaterId] || [], [dayTripsBySkaterId, ui.activeSkaterId]);
  const activeCoachVideos = useMemo(
    () =>
      activeCoachDemos.flatMap((demo) =>
        (demo.media || [])
          .filter((m) => m?.type?.startsWith("video/"))
          .map((m) => ({ ...m, demoId: demo.id, trickName: demo.trickName, createdAt: demo.createdAt }))
      ),
    [activeCoachDemos]
  );
  const [contestDragRunId, setContestDragRunId] = useState("");
  const [contestTimerSeconds, setContestTimerSeconds] = useState(45);
  const [contestTimerLeft, setContestTimerLeft] = useState(45);
  const [contestTimerRunning, setContestTimerRunning] = useState(false);
  const [weatherParkQuery, setWeatherParkQuery] = useState(
    () => (draft.park && String(draft.park).trim()) || SKATE_PARK_SUGGESTIONS[0]
  );
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState("");
  const [weatherData, setWeatherData] = useState(null);

  const addCoachDraftMedia = (fileList) => {
    const next = mediaFromFiles(fileList);
    if (!next.length) return;
    setCoachDraft((prev) => ({ ...prev, media: [...prev.media, ...next] }));
  };

  const removeCoachDraftMedia = (mediaId) => {
    setCoachDraft((prev) => {
      const found = prev.media.find((m) => m.id === mediaId);
      if (found?.url) URL.revokeObjectURL(found.url);
      return { ...prev, media: prev.media.filter((m) => m.id !== mediaId) };
    });
  };

  const saveCoachDemo = () => {
    if (!canUseCoachCorner) {
      toast("Restricted feature", "Only owner, coach, or parent can add trick demos.", "warn");
      return;
    }
    const trickName = String(coachDraft.trickName || "").trim();
    if (!trickName) {
      toast("Missing trick name", "Add a trick name first.", "warn");
      return;
    }
    const nextDemo = {
      id: `cd-${uid()}`,
      trickName,
      notes: String(coachDraft.notes || "").trim(),
      media: coachDraft.media.map((m) => ({ ...m })),
      skaterId: ui.activeSkaterId,
      skaterName: activeSkater?.name || "",
      createdBy: activeMember?.name || "",
      createdAt: new Date().toISOString(),
    };
    setSlice({
      coachDemosBySkaterId: {
        ...coachDemosBySkaterId,
        [ui.activeSkaterId]: [nextDemo, ...activeCoachDemos].slice(0, 200),
      },
    });
    setCoachDraft({ trickName: "", notes: "", media: [] });
    toast("Coach demo added", `${trickName} saved for ${activeSkater?.name || "skater"}.`, "success");
  };

  const deleteCoachDemo = (demoId) => {
    if (!canUseCoachCorner) return;
    const found = activeCoachDemos.find((d) => d.id === demoId);
    if (!found) return;
    if (!confirm("Delete this coach demo?")) return;
    for (const m of found.media || []) {
      if (m?.url) URL.revokeObjectURL(m.url);
    }
    setSlice({
      coachDemosBySkaterId: {
        ...coachDemosBySkaterId,
        [ui.activeSkaterId]: activeCoachDemos.filter((d) => d.id !== demoId),
      },
    });
    toast("Coach demo removed", "Demo deleted.", "warn");
  };

  const addContestDraftMedia = (fileList) => {
    const next = mediaFromFiles(fileList);
    if (!next.length) return;
    setContestDraft((prev) => ({ ...prev, media: [...prev.media, ...next] }));
  };

  const removeContestDraftMedia = (mediaId) => {
    setContestDraft((prev) => {
      const found = prev.media.find((m) => m.id === mediaId);
      if (found?.url) URL.revokeObjectURL(found.url);
      return { ...prev, media: prev.media.filter((m) => m.id !== mediaId) };
    });
  };

  const addContestTrickRow = () => {
    setContestDraft((prev) => ({
      ...prev,
      tricks: [...(prev.tricks || []), { id: `trk-${uid()}`, name: "", landed: false, points: 10, notes: "" }],
    }));
  };

  const updateContestTrick = (trickId, patch) => {
    setContestDraft((prev) => ({
      ...prev,
      tricks: (prev.tricks || []).map((t) => (t.id === trickId ? { ...t, ...patch } : t)),
    }));
  };

  const removeContestTrick = (trickId) => {
    setContestDraft((prev) => {
      const nextTricks = (prev.tricks || []).filter((t) => t.id !== trickId);
      return {
        ...prev,
        tricks: nextTricks.length ? nextTricks : [{ id: `trk-${uid()}`, name: "", landed: false, points: 10, notes: "" }],
      };
    });
  };

  const getDraftTrickScorePreview = () => {
    const tricks = (contestDraft.tricks || []).filter((t) => String(t.name || "").trim());
    const totalPossible = tricks.reduce((sum, t) => sum + (Number(t.points) || 0), 0);
    const landedPoints = tricks.reduce((sum, t) => sum + (t.landed ? Number(t.points) || 0 : 0), 0);
    const allLanded = tricks.length > 0 && tricks.every((t) => t.landed);
    const consistencyBonus = allLanded ? 5 : 0;
    const autoScore = totalPossible ? Math.min(100, Math.round((landedPoints / totalPossible) * 90 + consistencyBonus)) : 0;
    return { totalPossible, landedPoints, autoScore };
  };

  const formatTimer = (seconds) => {
    const safe = Math.max(0, Number(seconds) || 0);
    const mm = String(Math.floor(safe / 60)).padStart(2, "0");
    const ss = String(safe % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  };

  const startContestTimer = () => {
    setContestTimerRunning(true);
  };

  const pauseContestTimer = () => {
    setContestTimerRunning(false);
  };

  const resetContestTimer = () => {
    setContestTimerRunning(false);
    setContestTimerLeft(Math.max(5, Number(contestTimerSeconds) || 45));
  };

  useEffect(() => {
    if (!contestTimerRunning) return;
    if (contestTimerLeft <= 0) {
      setContestTimerRunning(false);
      toast("Run timer complete", "Time is up for this run.", "warn");
      return;
    }
    const id = window.setTimeout(() => setContestTimerLeft((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearTimeout(id);
  }, [contestTimerRunning, contestTimerLeft]);

  useEffect(() => {
    setContestTimerLeft(Math.max(5, Number(contestTimerSeconds) || 45));
  }, [contestTimerSeconds]);

  const reorderContestRuns = (draggedRunId, targetRunId) => {
    if (!draggedRunId || !targetRunId || draggedRunId === targetRunId) return;
    const list = [...activeContestRuns];
    const from = list.findIndex((r) => r.id === draggedRunId);
    const to = list.findIndex((r) => r.id === targetRunId);
    if (from < 0 || to < 0) return;
    const [moved] = list.splice(from, 1);
    list.splice(to, 0, moved);
    setSlice({
      contestBySkaterId: {
        ...contestBySkaterId,
        [ui.activeSkaterId]: list,
      },
    });
  };

  const loadParkWeather = async (rawQuery) => {
    const query = String(rawQuery || "").trim();
    if (!query) {
      setWeatherError("Enter a skate park or city first.");
      setWeatherData(null);
      return;
    }

    setWeatherLoading(true);
    setWeatherError("");
    try {
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`
      );
      const geoJson = await geoRes.json();
      const place = geoJson?.results?.[0];
      if (!place) throw new Error("Could not find that skate park. Add city/state for better results.");

      const forecastRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,apparent_temperature,precipitation,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=3`
      );
      const forecastJson = await forecastRes.json();
      setWeatherData({
        placeName: [place.name, place.admin1, place.country].filter(Boolean).join(", "),
        latitude: place.latitude,
        longitude: place.longitude,
        current: forecastJson.current || null,
        daily: forecastJson.daily || null,
      });
    } catch (err) {
      setWeatherData(null);
      setWeatherError(err?.message || "Weather lookup failed.");
    } finally {
      setWeatherLoading(false);
    }
  };

  useEffect(() => {
    if (!weatherParkQuery) return;
    loadParkWeather(weatherParkQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyContestPreset = (preset) => {
    setContestDraft((prev) => ({
      ...prev,
      date: prev.date || todayISO(),
      contestName: prev.contestName || "Contest Day",
      roundName: preset.roundName,
      runNumber: preset.runNumber === "" ? "" : clampNum(preset.runNumber),
    }));
    toast("Preset loaded", `${preset.label} ready`, "info");
  };

  const saveContestRun = () => {
    const contestName = String(contestDraft.contestName || "").trim();
    if (!contestName) {
      toast("Missing contest name", "Add contest name first.", "warn");
      return;
    }
    const scorePreview = getDraftTrickScorePreview();
    const manualScore = String(contestDraft.score || "").trim();
    const tricks = (contestDraft.tricks || [])
      .map((t) => ({
        id: t.id || `trk-${uid()}`,
        name: String(t.name || "").trim(),
        landed: Boolean(t.landed),
        points: Math.max(0, Number(t.points) || 0),
        notes: String(t.notes || "").trim(),
      }))
      .filter((t) => t.name);

    const run = {
      id: `run-${uid()}`,
      date: contestDraft.date || todayISO(),
      contestName,
      roundName: String(contestDraft.roundName || "").trim(),
      runNumber: clampNum(contestDraft.runNumber) || "",
      score: manualScore || String(scorePreview.autoScore),
      manualScore,
      autoScore: scorePreview.autoScore,
      landedPoints: scorePreview.landedPoints,
      totalPossiblePoints: scorePreview.totalPossible,
      notes: String(contestDraft.notes || "").trim(),
      tricks,
      media: contestDraft.media.map((m) => ({ ...m })),
      skaterId: ui.activeSkaterId,
      skaterName: activeSkater?.name || "",
      createdBy: activeMember?.name || "",
      createdAt: new Date().toISOString(),
    };

    setSlice({
      contestBySkaterId: {
        ...contestBySkaterId,
        [ui.activeSkaterId]: [run, ...activeContestRuns].slice(0, 200),
      },
    });
    setContestDraft({
      date: todayISO(),
      contestName: "",
      roundName: "",
      runNumber: "",
      score: "",
      tricks: [{ id: `trk-${uid()}`, name: "", landed: false, points: 10, notes: "" }],
      notes: "",
      media: [],
    });
    toast("Contest run saved", `${contestName} run added.`, "success");
  };

  const deleteContestRun = (runId) => {
    const found = activeContestRuns.find((r) => r.id === runId);
    if (!found) return;
    if (!confirm("Delete this contest run?")) return;
    for (const m of found.media || []) {
      if (m?.url) URL.revokeObjectURL(m.url);
    }
    setSlice({
      contestBySkaterId: {
        ...contestBySkaterId,
        [ui.activeSkaterId]: activeContestRuns.filter((r) => r.id !== runId),
      },
    });
    toast("Contest run removed", "Run deleted.", "warn");
  };

  const addDayTripDraftMedia = (fileList) => {
    if (!canUploadDayTrips) {
      toast("Upload blocked", "Only coach, parent, or the active skater account can upload day-trip photos.", "warn");
      return;
    }
    const next = mediaFromFiles(fileList);
    if (!next.length) return;
    setDayTripDraft((prev) => ({ ...prev, media: [...prev.media, ...next] }));
  };

  const removeDayTripDraftMedia = (mediaId) => {
    setDayTripDraft((prev) => {
      const found = prev.media.find((m) => m.id === mediaId);
      if (found?.url) URL.revokeObjectURL(found.url);
      return { ...prev, media: prev.media.filter((m) => m.id !== mediaId) };
    });
  };

  const saveDayTrip = () => {
    if (!canUploadDayTrips) {
      toast("Upload blocked", "Only coach, parent, or the active skater account can save day trips.", "warn");
      return;
    }
    const park = String(dayTripDraft.park || "").trim();
    if (!park) {
      toast("Missing skate park", "Add a skate park name first.", "warn");
      return;
    }
    const trip = {
      id: `trip-${uid()}`,
      date: dayTripDraft.date || todayISO(),
      park,
      notes: String(dayTripDraft.notes || "").trim(),
      media: dayTripDraft.media.map((m) => ({ ...m })),
      skaterId: ui.activeSkaterId,
      skaterName: activeSkater?.name || "",
      createdBy: activeMember?.name || "",
      createdByRole: activeMember?.role || "",
      createdAt: new Date().toISOString(),
    };
    setSlice({
      dayTripsBySkaterId: {
        ...dayTripsBySkaterId,
        [ui.activeSkaterId]: [trip, ...activeDayTrips].slice(0, 200),
      },
    });
    setDayTripDraft({ date: todayISO(), park: "", notes: "", media: [] });
    toast("Day trip saved", `${park} added for ${activeSkater?.name || "skater"}.`, "success");
  };

  const deleteDayTrip = (tripId) => {
    const found = activeDayTrips.find((t) => t.id === tripId);
    if (!found) return;
    if (!canUploadDayTrips) {
      toast("Delete blocked", "Only coach, parent, or the active skater account can remove day trips.", "warn");
      return;
    }
    if (!confirm("Delete this day trip?")) return;
    for (const m of found.media || []) {
      if (m?.url) URL.revokeObjectURL(m.url);
    }
    setSlice({
      dayTripsBySkaterId: {
        ...dayTripsBySkaterId,
        [ui.activeSkaterId]: activeDayTrips.filter((t) => t.id !== tripId),
      },
    });
    toast("Day trip removed", "Trip deleted.", "warn");
  };

  const updateReps = (task, nextValue) => {
    const next = clampNum(nextValue);
    if (next === "") {
      setDraft({ completedByTaskId: { ...(draft.completedByTaskId || {}), [task.id]: "" } });
      return;
    }

    const target = Number(task.target) || 0;
    const prevNum = Number(draft.completedByTaskId?.[task.id]) || 0;
    const nextNum = Number(next) || 0;

    if (target > 0 && prevNum < target && nextNum >= target) {
      toast("New trick achieved!", `${task.label} — hit ${target} reps`, "success");
    }

    setDraft({ completedByTaskId: { ...(draft.completedByTaskId || {}), [task.id]: nextNum } });
  };

  const bumpReps = (task, delta) => {
    const cur = Number(draft.completedByTaskId?.[task.id]) || 0;
    updateReps(task, Math.max(0, cur + delta));
  };

  const resetDraft = () => {
    if (!confirm("Reset this session draft?")) return;
    clearDraftMedia({ revoke: true });
    setDraft({ date: todayISO(), park: "", dayType: Object.keys(plans)[0] || "Grind Day", completedByTaskId: {} });
    toast("Draft reset", "Session builder cleared.", "info");
  };

  const saveSession = () => {
    if (!activeSkater) return;

    const taskRecords = tasks.map((t) => ({
      taskId: t.id,
      label: t.label,
      target: Number(t.target) || 0,
      completed: Number(draft.completedByTaskId?.[t.id]) || 0,
      notes: t.notes || "",
    }));

    const totalTarget2 = taskRecords.reduce((s, r) => s + r.target, 0);
    const totalCompleted2 = taskRecords.reduce((s, r) => s + r.completed, 0);
    const pct2 = pct(totalCompleted2, totalTarget2 || 1);
    const freePlayEarned = pct2 >= 50;

    const baseSession = {
      id: `sess-${uid()}`,
      skaterId: activeSkater.id,
      skaterName: activeSkater.name,
      skaterPhotoUrl: activeSkater.photoUrl || "",
      createdBy: activeMember?.name || "",
      createdByRole: activeMember?.role || "",
      date: draft.date,
      park: (draft.park || "").trim(),
      dayType: draft.dayType,
      tasks: taskRecords,
      totalTarget: totalTarget2,
      totalCompleted: totalCompleted2,
      freePlayEarned,
      media: draftMedia.map((m) => ({ ...m })),
      comments: [],
      createdAt: new Date().toISOString(),
    };

    const gainedXP = xpForSession(baseSession);
    const prevXP = xpBySkaterId[activeSkater.id] || 0;
    const nextXP = prevXP + gainedXP;

    const prevLvl = levelFromXP(prevXP);
    const nextLvl = levelFromXP(nextXP);

    const session = {
      ...baseSession,
      xpGained: gainedXP,
      xpTotalAfter: nextXP,
    };

    const milestoneStep = 500;
    const prevMilestone = Math.floor(prevXP / milestoneStep);
    const nextMilestone = Math.floor(nextXP / milestoneStep);
    const milestoneHit = nextMilestone > prevMilestone;
    const heroMedia = pickHeroMedia(baseSession.media || []);

    const achievedBefore = new Set();
    for (const prevSession of sessions.filter((s) => s.skaterId === activeSkater.id)) {
      for (const t of prevSession.tasks || []) {
        if ((t.target || 0) > 0 && (t.completed || 0) >= (t.target || 0)) {
          achievedBefore.add(`${t.label}::${t.target}`);
        }
      }
    }

    const newlyUnlockedTricks = taskRecords.filter((t) => {
      if (!t.target || t.target <= 0) return false;
      if ((t.completed || 0) < t.target) return false;
      return !achievedBefore.has(`${t.label}::${t.target}`);
    });

    const newAchievementCards = [];

    if (nextLvl.key !== prevLvl.key) {
      newAchievementCards.push({
        id: `ac-${uid()}`,
        type: "achievement",
        achievementKind: "levelup",
        date: draft.date,
        title: `${activeSkater.name} LEVEL UP`,
        subtitle: `${prevLvl.key} → ${nextLvl.key}`,
        badge: nextLvl.key,
        ovr: computeOVR(session),
        pct: pct2,
        park: session.park || "",
        meta: `+${gainedXP} XP • ${session.dayType}`,
        media: heroMedia,
      });
    }

    if (milestoneHit) {
      newAchievementCards.push({
        id: `ac-${uid()}`,
        type: "achievement",
        achievementKind: "milestone",
        date: draft.date,
        title: "XP MILESTONE UNLOCKED",
        subtitle: `${activeSkater.name} reached ${nextMilestone * milestoneStep} XP`,
        badge: `${nextMilestone * milestoneStep} XP`,
        ovr: computeOVR(session),
        pct: pct2,
        park: session.park || "",
        meta: `+${gainedXP} XP this session`,
        media: heroMedia,
      });
    }

    for (const t of newlyUnlockedTricks) {
      newAchievementCards.push({
        id: `ac-${uid()}`,
        type: "achievement",
        achievementKind: "newtrick",
        date: draft.date,
        title: "NEW TRICK UNLOCKED",
        subtitle: t.label,
        badge: "UNLOCK",
        ovr: computeOVR(session),
        pct: pct2,
        park: session.park || "",
        meta: `${t.completed}/${t.target} reps`,
        media: heroMedia,
      });
    }

    setSlice({
      sessions: [session, ...sessions],
      xpBySkaterId: { ...xpBySkaterId, [activeSkater.id]: nextXP },
      xpMilestonesBySkaterId: { ...xpMilestonesBySkaterId, [activeSkater.id]: nextMilestone },
      achievementCardsBySkaterId: {
        ...achievementCardsBySkaterId,
        [activeSkater.id]: [...newAchievementCards, ...(achievementCardsBySkaterId[activeSkater.id] || [])].slice(0, 300),
      },
    });
    const popId = `xp-${uid()}`;
    setXpPop({ id: popId, amount: gainedXP, levelUp: nextLvl.key !== prevLvl.key });
    window.setTimeout(() => {
      setXpPop((prev) => (prev?.id === popId ? null : prev));
    }, 1400);

    if (newAchievementCards.length) {
      const achPopId = `ach-${uid()}`;
      setAchievementPop({ ...newAchievementCards[0], _popId: achPopId });
      window.setTimeout(() => {
        setAchievementPop((prev) => (prev?._popId === achPopId ? null : prev));
      }, 2600);
    }

    // Keep object URLs alive after save because session cards use those URLs.
    clearDraftMedia({ revoke: false });
    setDraft({ date: todayISO(), park: "", dayType: draft.dayType, completedByTaskId: {} });

    if (nextLvl.key !== prevLvl.key) {
      toast("LEVEL UP!", `${activeSkater.name} -> ${nextLvl.key} • +${gainedXP} XP`, "success");
    } else if (milestoneHit) {
      toast("XP MILESTONE!", `Hit ${nextMilestone * milestoneStep} XP • +${gainedXP} XP`, "success");
    } else {
      toast(
        "New practice saved",
        `${activeSkater.name} • ${draft.dayType} • ${pct2}%${freePlayEarned ? " • Free play earned" : ""} • +${gainedXP} XP`,
        "success"
      );
    }
  };

  const deleteSession = (id) => {
    if (!confirm("Delete this session card?")) return;
    const found = sessions.find((s) => s.id === id);
    if (found?.media?.length) for (const m of found.media) if (m?.url) URL.revokeObjectURL(m.url);
    setSlice({ sessions: sessions.filter((s) => s.id !== id) });
    toast("Card deleted", "Session card removed.", "warn");
  };

  const addCommentToSession = (sessionId, text) => {
    const msg = (text || "").trim();
    if (!msg) return;
    setSlice({
      sessions: sessions.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              comments: [
                { id: `c-${uid()}`, by: activeMember?.name || "", role: activeMember?.role || "", text: msg, at: new Date().toISOString() },
                ...(s.comments || []),
              ],
            }
          : s
      ),
    });
    toast("New comment", "Comment added.", "info");
  };

  const setMediaComment = (sessionId, mediaId, text) => {
    setSlice({
      sessions: sessions.map((s) =>
        s.id === sessionId
          ? { ...s, media: (s.media || []).map((m) => (m.id === mediaId ? { ...m, comment: text } : m)) }
          : s
      ),
    });
  };

  const addSkater = () => {
    const name = prompt("Skater name:");
    if (!name) return;
    const next = { id: `s-${uid()}`, name: name.trim(), photoUrl: "" };
    setSlice({ skaters: [...skaters, next], ui: { ...ui, activeSkaterId: next.id } });
    toast("Skater added", `${next.name} added.`, "success");
  };

  const renameSkater = (skater) => {
    const name = prompt("Rename skater:", skater.name);
    if (!name) return;
    const nextName = name.trim();
    const nextCoachDemos = (coachDemosBySkaterId[skater.id] || []).map((d) => ({ ...d, skaterName: nextName }));
    const nextContestRuns = (contestBySkaterId[skater.id] || []).map((r) => ({ ...r, skaterName: nextName }));
    const nextDayTrips = (dayTripsBySkaterId[skater.id] || []).map((t) => ({ ...t, skaterName: nextName }));
    setSlice({
      skaters: skaters.map((s) => (s.id === skater.id ? { ...s, name: nextName } : s)),
      sessions: sessions.map((sess) => (sess.skaterId === skater.id ? { ...sess, skaterName: nextName } : sess)),
      coachDemosBySkaterId: { ...coachDemosBySkaterId, [skater.id]: nextCoachDemos },
      contestBySkaterId: { ...contestBySkaterId, [skater.id]: nextContestRuns },
      dayTripsBySkaterId: { ...dayTripsBySkaterId, [skater.id]: nextDayTrips },
    });
    toast("Skater renamed", `Updated to ${nextName}.`, "info");
  };

  const deleteSkater = (skater) => {
    if (!confirm(`Delete ${skater.name}?`)) return;
    const nextCoachDemosBySkaterId = { ...coachDemosBySkaterId };
    const nextContestBySkaterId = { ...contestBySkaterId };
    const nextDayTripsBySkaterId = { ...dayTripsBySkaterId };
    delete nextCoachDemosBySkaterId[skater.id];
    delete nextContestBySkaterId[skater.id];
    delete nextDayTripsBySkaterId[skater.id];
    setSlice({
      skaters: skaters.filter((s) => s.id !== skater.id),
      sessions: sessions.filter((s) => s.skaterId !== skater.id),
      coachDemosBySkaterId: nextCoachDemosBySkaterId,
      contestBySkaterId: nextContestBySkaterId,
      dayTripsBySkaterId: nextDayTripsBySkaterId,
      ui: {
        ...ui,
        activeSkaterId:
          ui.activeSkaterId === skater.id ? (skaters.find((s) => s.id !== skater.id)?.id || skaters[0]?.id) : ui.activeSkaterId,
      },
    });
    toast("Skater removed", `${skater.name} removed.`, "warn");
  };

  const uploadSkaterPhoto = (skater, file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setSlice({ skaters: skaters.map((s) => (s.id === skater.id ? { ...s, photoUrl: url } : s)) });
    toast("Photo updated", `New photo for ${skater.name}.`, "success");
  };

  const addDayType = () => {
    const name = prompt("New day type name:");
    if (!name) return;
    const key = name.trim();
    setSlice({ plans: { ...plans, [key]: [] } });
    setDraft({ dayType: key });
    toast("Plan added", `New day type: ${key}`, "success");
  };

  const renameDayType = (oldName) => {
    const nextName = prompt("Rename day type:", oldName);
    if (!nextName) return;
    const key = nextName.trim();
    if (key === oldName) return;
    const copy = { ...plans };
    const tasks2 = copy[oldName] || [];
    delete copy[oldName];
    copy[key] = tasks2;
    setSlice({ plans: copy });
    if (draft.dayType === oldName) setDraft({ dayType: key });
    toast("Plan renamed", `${oldName} → ${key}`, "info");
  };

  const deleteDayType = (name) => {
    if (!confirm(`Delete "${name}"?`)) return;
    const copy = { ...plans };
    delete copy[name];
    const keys = Object.keys(copy);
    setSlice({ plans: copy });
    if (draft.dayType === name) setDraft({ dayType: keys[0] || "Grind Day" });
    toast("Plan deleted", `${name} removed.`, "warn");
  };

  const addTaskToDay = (dayName) => {
    const label = prompt("New task name:");
    if (!label) return;
    const targetRaw = prompt("Target reps:", "10");
    if (targetRaw == null) return;
    const notes = (prompt("Notes (optional):", "") ?? "").trim();
    setSlice({
      plans: {
        ...plans,
        [dayName]: [...(plans[dayName] || []), { id: `t-${uid()}`, label: label.trim(), target: Number(targetRaw) || 0, notes }],
      },
    });
    toast("Task added", `${label.trim()} (${dayName})`, "success");
  };

  const editTask = (dayName, task) => {
    const label = prompt("Task name:", task.label);
    if (!label) return;
    const targetRaw = prompt("Target reps:", String(task.target));
    if (targetRaw == null) return;
    const notes = (prompt("Notes (optional):", task.notes || "") ?? "").trim();
    setSlice({
      plans: {
        ...plans,
        [dayName]: (plans[dayName] || []).map((t) =>
          t.id === task.id ? { ...t, label: label.trim(), target: Number(targetRaw) || 0, notes } : t
        ),
      },
    });
    toast("Task updated", `${label.trim()} (${dayName})`, "info");
  };

  const deleteTask = (dayName, taskId) => {
    if (!confirm("Delete this task?")) return;
    setSlice({ plans: { ...plans, [dayName]: (plans[dayName] || []).filter((t) => t.id !== taskId) } });
    toast("Task removed", "Task deleted.", "warn");
  };

  const activeChat = useMemo(() => chatBySkaterId[ui.activeSkaterId] || [], [chatBySkaterId, ui.activeSkaterId]);
  const sendChatMessage = (text) => {
    const msg = (text || "").trim();
    if (!msg) return;
    const next = {
      id: `msg-${uid()}`,
      memberId: activeMember?.id || "",
      by: activeMember?.name || "",
      role: activeMember?.role || "",
      text: msg,
      at: new Date().toISOString(),
    };
    setSlice({
      chatBySkaterId: {
        ...chatBySkaterId,
        [ui.activeSkaterId]: [next, ...(chatBySkaterId[ui.activeSkaterId] || [])].slice(0, 200),
      },
    });
    toast("New message", "Posted.", "info");
  };

  const enableNotifications = async () => {
    if (!("Notification" in window)) {
      alert("Notifications not supported in this browser.");
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm !== "granted") {
      alert("Permission not granted.");
      return;
    }
    setSlice({ reminders: { ...reminders, enabled: true } });
    new Notification("SkateFlow", { body: "Reminders enabled. Tip: Calendar events are most reliable." });
    toast("Notifications enabled", "Browser alerts allowed.", "success");
  };

  const addPracticeToCalendar = (dateOverride = draft.date) => {
    if (!activeSkater) return;
    const ev = {
      id: `pe-${uid()}`,
      dateISO: dateOverride,
      time: reminders.time,
      durationMin: Number(practiceSettings.durationMin) || 60,
      remindMin: Number(practiceSettings.remindMin) || 60,
      title: practiceSettings.title || "SkateFlow Practice",
      notes: `Skater: ${activeSkater.name}\nDay: ${draft.dayType}\nPark: ${draft.park || ""}`,
      skaterId: activeSkater.id,
      skaterName: activeSkater.name,
      createdAt: new Date().toISOString(),
    };
    setSlice({ practiceEvents: [ev, ...practiceEvents].slice(0, 50) });
    exportICSPractice(ev.dateISO, ev.title, ev.notes, { time: ev.time, durationMin: ev.durationMin, remindMin: ev.remindMin });
    toast("Calendar event downloaded", `${ev.dateISO} ${ev.time} • reminder ${ev.remindMin}m`, "success");
  };

  const exportPracticeEvent = (ev) => {
    exportICSPractice(ev.dateISO, ev.title, ev.notes, { time: ev.time, durationMin: ev.durationMin, remindMin: ev.remindMin });
    toast("iCal downloaded", `${ev.dateISO} ${ev.time}`, "success");
  };

  const removePracticeEvent = (id) => {
    setSlice({ practiceEvents: practiceEvents.filter((x) => x.id !== id) });
    toast("Removed", "Practice removed.", "warn");
  };

  const importICSFile = async (file) => {
    if (!file) return;
    const text = await file.text();
    const imported = importPracticesFromICS(text, {
      title: practiceSettings.title,
      durationMin: practiceSettings.durationMin,
      remindMin: practiceSettings.remindMin,
      skaterId: activeSkater?.id || "",
      skaterName: activeSkater?.name || "",
    });

    if (!imported.length) {
      toast("No events found", "That .ics file didn’t contain readable events.", "warn");
      return;
    }

    setSlice({ practiceEvents: [...imported, ...practiceEvents].slice(0, 200) });
    toast("Imported calendar", `${imported.length} practice(s) added from .ics`, "success");
  };

  const progressCards = useMemo(() => {
    const list = sessions
      .filter((s) => s.skaterId === ui.activeSkaterId)
      .slice()
      .sort((a, b) => (a.date > b.date ? 1 : -1));
    const savedAchievementCards = (achievementCardsBySkaterId[ui.activeSkaterId] || []).map((c) => ({
      ...c,
      type: c.type || "achievement",
    }));

    const levelUps = [];
    let prevLevelRank = -1;
    const rank = (lvl) => (lvl === "ELITE" ? 3 : lvl === "PRO" ? 2 : lvl === "AM" ? 1 : 0);

    for (const s of list) {
      const ovr = computeOVR(s);
      const lvl = getPlayerLevel(ovr);
      const r = rank(lvl.label);
      if (prevLevelRank >= 0 && r > prevLevelRank) {
        levelUps.push({
          id: `pc-lvl-${s.id}`,
          type: "levelup",
          date: s.date,
          title: `LEVEL UP → ${lvl.label}`,
          subtitle: `${s.skaterName} • ${s.dayType}`,
          badge: lvl.label,
          ovr,
          pct: pct(s.totalCompleted || 0, s.totalTarget || 1),
          park: s.park || "",
          media: pickHeroMedia(s.media || []),
        });
      }
      prevLevelRank = Math.max(prevLevelRank, r);
    }

    const achieved = new Set();
    const newTricks = [];
    for (const s of list) {
      for (const t of s.tasks || []) {
        const key = `${t.label}::${t.target}`;
        if (!t.target || t.target <= 0) continue;
        if ((t.completed || 0) >= t.target && !achieved.has(key)) {
          achieved.add(key);
          newTricks.push({
            id: `pc-trick-${s.id}-${t.taskId}`,
            type: "newtrick",
            date: s.date,
            title: "NEW TRICK UNLOCKED",
            subtitle: t.label,
            badge: "UNLOCK",
            ovr: computeOVR(s),
            pct: pct(s.totalCompleted || 0, s.totalTarget || 1),
            park: s.park || "",
            meta: `${t.completed}/${t.target} reps`,
            media: pickHeroMedia(s.media || []),
          });
        }
      }
    }

    const byWeek = new Map();
    for (const s of list) {
      const wk = getISOWeekKey(s.date);
      const cur = byWeek.get(wk) || { weekKey: wk, sessions: 0, pctSum: 0, bestOVR: 0, lastDate: s.date, parks: new Set() };
      cur.sessions += 1;
      cur.pctSum += pct(s.totalCompleted || 0, s.totalTarget || 1);
      cur.bestOVR = Math.max(cur.bestOVR, computeOVR(s));
      cur.lastDate = s.date;
      if (s.park) cur.parks.add(s.park);
      byWeek.set(wk, cur);
    }

    const weekly = [...byWeek.values()]
      .sort((a, b) => (a.weekKey > b.weekKey ? -1 : 1))
      .map((w) => ({
        id: `pc-week-${w.weekKey}`,
        type: "weekly",
        date: w.lastDate,
        title: "WEEKLY RECAP",
        subtitle: formatWeekLabel(w.weekKey),
        badge: `${w.sessions} sessions`,
        ovr: w.bestOVR,
        pct: w.sessions ? Math.round(w.pctSum / w.sessions) : 0,
        meta: w.parks.size ? `Parks: ${[...w.parks].slice(0, 2).join(", ")}${w.parks.size > 2 ? " +" + (w.parks.size - 2) : ""}` : "",
      }));

    const xpCards = [];
    let runningXP = 0;
    const milestoneStep = 500;
    for (const s of list) {
      const gained = Number(s.xpGained ?? xpForSession(s));
      const after = Number(s.xpTotalAfter ?? runningXP + gained);
      const prevMilestone = Math.floor(runningXP / milestoneStep);
      const nextMilestone = Math.floor(after / milestoneStep);
      if (nextMilestone > prevMilestone) {
        for (let m = prevMilestone + 1; m <= nextMilestone; m += 1) {
          xpCards.push({
            id: `pc-xp-${s.id}-${m}`,
            type: "xp",
            date: s.date,
            title: "XP MILESTONE",
            subtitle: `${s.skaterName} • +${gained} XP`,
            badge: `${m * milestoneStep} XP`,
            ovr: computeOVR(s),
            pct: pct(s.totalCompleted || 0, s.totalTarget || 1),
            park: s.park || "",
            meta: `${s.dayType} • Total XP ${after}`,
            media: pickHeroMedia(s.media || []),
          });
        }
      }
      runningXP = after;
    }

    return [...savedAchievementCards, ...levelUps, ...newTricks, ...xpCards, ...weekly].sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [sessions, ui.activeSkaterId, achievementCardsBySkaterId]);

  const filteredProgressCards = useMemo(() => {
    if (binderFilter === "all") return progressCards;
    return progressCards.filter((c) => c.type === binderFilter);
  }, [progressCards, binderFilter]);

  const contestDraftScore = useMemo(() => getDraftTrickScorePreview(), [contestDraft.tricks]);

  const chartData = useMemo(() => {
    const filtered = sessions
      .filter((s) => s.skaterId === ui.activeSkaterId)
      .slice()
      .sort((a, b) => (a.date > b.date ? 1 : -1))
      .slice(-14);
    return filtered.map((s) => ({
      date: formatShortDate(s.date),
      pct: pct(s.totalCompleted || 0, s.totalTarget || 1),
      ovr: computeOVR(s),
    }));
  }, [sessions, ui.activeSkaterId]);

  const dayTypeBars = useMemo(() => {
    const filtered = sessions.filter((s) => s.skaterId === ui.activeSkaterId);
    const map = new Map();
    for (const s of filtered) {
      const p = pct(s.totalCompleted || 0, s.totalTarget || 1);
      const cur = map.get(s.dayType) || { dayType: s.dayType, sessions: 0, avg: 0 };
      cur.sessions += 1;
      cur.avg += p;
      map.set(s.dayType, cur);
    }
    return [...map.values()].map((x) => ({ ...x, avg: x.sessions ? Math.round(x.avg / x.sessions) : 0 }));
  }, [sessions, ui.activeSkaterId]);

  const uploadMemberPhoto = (member, file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setSlice({ members: members.map((m) => (m.id === member.id ? { ...m, photoUrl: url } : m)) });
    toast("Profile photo updated", `New photo for ${member.name}.`, "success");
  };

  const renameMember = (member) => {
    const nextName = prompt("Rename member:", member.name);
    if (!nextName) return;
    const name = String(nextName).trim();
    if (!name) return;
    const oldName = member.name;

    const nextChatBySkaterId = Object.fromEntries(
      Object.entries(chatBySkaterId).map(([skaterId, msgs]) => [
        skaterId,
        (msgs || []).map((msg) => (msg.memberId === member.id ? { ...msg, by: name } : msg)),
      ])
    );

    setSlice({
      members: members.map((m) => (m.id === member.id ? { ...m, name } : m)),
      sessions: sessions.map((sess) => ({
        ...sess,
        createdBy: sess.createdBy === oldName ? name : sess.createdBy,
        comments: (sess.comments || []).map((c) => (c.by === oldName ? { ...c, by: name } : c)),
      })),
      chatBySkaterId: nextChatBySkaterId,
    });
    toast("Member renamed", `${oldName} -> ${name}`, "info");
  };

  const LoginBody = () => {
    const picked = members.find((m) => m.id === loginPickId) || members[0];
    const requirePin = !picked?.pin || String(picked.pin).trim().length < 4;

    return (
      <div>
        <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-3">
          <div className="text-xs text-white/60">Choose account</div>
          <select
            value={loginPickId}
            onChange={(e) => {
              setLoginPickId(e.target.value);
              setLoginPin("");
              setLoginError("");
            }}
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.role})
              </option>
            ))}
          </select>

          <div className="mt-3 text-xs text-white/60">
            {requirePin ? "This account needs a PIN. You’ll set it now." : "Enter your PIN to continue."}
          </div>

          <div className="mt-2 flex gap-2">
            <input
              value={loginPin}
              onChange={(e) => setLoginPin(e.target.value)}
              placeholder={requirePin ? "Set PIN (min 4)" : "PIN"}
              type="password"
              className="flex-1 rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
            />
            <button
              type="button"
              className="rounded-xl bg-white text-black px-4 py-2 text-sm font-extrabold hover:bg-white/90 inline-flex items-center gap-2"
              onClick={() => {
                const nextId = loginPickId;
                const m = members.find((x) => x.id === nextId);
                if (!m) return;

                if (requirePin) {
                  const pin = String(loginPin || "").trim();
                  if (pin.length < 4) {
                    setLoginError("PIN must be at least 4 characters.");
                    return;
                  }
                  setSlice({
                    members: members.map((x) => (x.id === nextId ? { ...x, pin } : x)),
                    auth: { loggedInMemberId: nextId },
                    ui: { ...ui, activeMemberId: nextId },
                  });
                  setLoginOpen(false);
                  setLoginError("");
                  toast("PIN set", `Welcome, ${m.name}.`, "success");
                  return;
                }

                if (!attemptLogin(nextId, loginPin)) {
                  setLoginError("Wrong PIN. Try again.");
                  return;
                }

                setSlice({ auth: { loggedInMemberId: nextId }, ui: { ...ui, activeMemberId: nextId } });
                setLoginOpen(false);
                setLoginError("");
                toast("Logged in", `Welcome back, ${m.name}.`, "success");
              }}
            >
              <LogIn className="h-4 w-4" />
              Enter
            </button>
          </div>

          {loginError ? <div className="mt-2 text-sm text-rose-200">{loginError}</div> : null}
        </div>
        <div className="mt-3 text-xs text-white/50">Local-only login (device-based).</div>
      </div>
    );
  };

  const activeXP = xpBySkaterId[ui.activeSkaterId] || 0;
  const xpLevel = levelFromXP(activeXP);

  return (
    <div
      className={`min-h-screen ${
        isLightMode
          ? "bg-gradient-to-b from-slate-100 via-white to-slate-100 text-slate-900 light-mode"
          : "bg-gradient-to-b from-black via-slate-950 to-black text-white"
      }`}
    >
      {isLightMode ? (
        <style>{`
          .light-mode [class*="text-white"] { color: #0f172a !important; }
          .light-mode [class*="bg-black"] { background-color: rgba(255,255,255,0.88) !important; }
          .light-mode [class*="from-black"] { --tw-gradient-from: #f1f5f9 var(--tw-gradient-from-position) !important; }
          .light-mode [class*="to-black"] { --tw-gradient-to: rgb(255 255 255 / 1) var(--tw-gradient-to-position) !important; }
          .light-mode [class*="ring-white"] { --tw-ring-color: rgba(15,23,42,0.14) !important; }
          .light-mode [class*="border-white"] { border-color: rgba(15,23,42,0.14) !important; }
        `}</style>
      ) : null}
      <Toasts toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((x) => x.id !== id))} />
      <AnimatePresence>
        {xpPop ? (
          <motion.div
            key={xpPop.id}
            initial={{ opacity: 0, scale: 0.6, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.1, y: -18 }}
            transition={{ duration: 0.45 }}
            className="pointer-events-none fixed inset-0 z-[1000] flex items-center justify-center"
          >
            <div className="rounded-3xl px-6 py-4 text-center bg-black/80 ring-1 ring-cyan-300/40 shadow-2xl">
              <div className="text-xs tracking-[0.25em] text-cyan-200/90">{xpPop.levelUp ? "LEVEL UP BONUS" : "XP GAINED"}</div>
              <div className="mt-1 text-4xl font-black text-cyan-200">+{xpPop.amount} XP</div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {achievementPop ? (
          <motion.div
            key={achievementPop._popId || achievementPop.id}
            initial={{ opacity: 0, y: 20, scale: 0.88 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.98 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0 z-[1001] pointer-events-none flex items-center justify-center p-4"
          >
            <div className="w-full max-w-md rounded-[28px] overflow-hidden shadow-2xl ring-1 ring-red-300/40 bg-gradient-to-br from-red-700 via-zinc-900 to-black">
              <div className="px-4 py-2 bg-black/50 text-[11px] font-extrabold tracking-[0.28em] text-red-100/90">ACHIEVEMENT UNLOCKED</div>
              <div className="p-4">
                <div className="text-xl font-black tracking-tight text-white">{achievementPop.title}</div>
                <div className="mt-1 text-sm text-white/80">{achievementPop.subtitle}</div>
                <div className="mt-3 inline-flex items-center rounded-xl bg-white/90 text-black px-3 py-1 text-xs font-black">
                  {achievementPop.badge}
                </div>
                {achievementPop.media ? (
                  <div className="mt-3 overflow-hidden rounded-2xl ring-1 ring-white/10 bg-black">
                    <div className="aspect-video">
                      {achievementPop.media.type?.startsWith("video/") ? (
                        <video src={achievementPop.media.url} className="h-full w-full object-cover" muted playsInline />
                      ) : (
                        <img src={achievementPop.media.url} alt={achievementPop.media.name || "achievement"} className="h-full w-full object-cover" />
                      )}
                    </div>
                  </div>
                ) : null}
                <div className="mt-3 text-xs text-white/70">{achievementPop.meta || "Saved to Card Binder"}</div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <Modal
        open={loginOpen}
        title="Login"
        onClose={() => {
          if (auth.loggedInMemberId) setLoginOpen(false);
        }}
      >
        <LoginBody />
      </Modal>

      <Modal
        open={socialEditor.open}
        title="Phase 1 Social Export"
        onClose={closeSocialEditor}
      >
        {activeSocialMedia ? (
          <div>
            <div className="text-xs text-white/60">Choose a platform preset, then export a trimmed/compressed copy.</div>

            <div className="mt-3 flex flex-wrap gap-2">
              {Object.values(SOCIAL_PRESETS).map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setSocialEditor((prev) => ({ ...prev, presetKey: p.key }))}
                  className={`rounded-xl px-3 py-2 text-xs font-bold ring-1 ${
                    socialEditor.presetKey === p.key
                      ? "bg-white text-black ring-white"
                      : "bg-white/5 text-white ring-white/10 hover:bg-white/10"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="mt-3 rounded-2xl bg-white/5 ring-1 ring-white/10 p-3">
              <div className="text-xs text-white/60">Quality</div>
              <select
                value={socialEditor.qualityKey}
                onChange={(e) => setSocialEditor((prev) => ({ ...prev, qualityKey: e.target.value }))}
                className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
              >
                {Object.values(SOCIAL_QUALITY).map((q) => (
                  <option key={q.key} value={q.key}>{q.label}</option>
                ))}
              </select>
            </div>

            <div className="mt-3 rounded-2xl bg-white/5 ring-1 ring-white/10 p-3">
              <div className="aspect-video overflow-hidden rounded-xl bg-black ring-1 ring-white/10">
                {activeSocialMedia.type?.startsWith("video/") ? (
                  <video src={activeSocialMedia.url} controls className="h-full w-full object-cover" playsInline />
                ) : (
                  <img src={activeSocialMedia.url} alt={activeSocialMedia.name || "media"} className="h-full w-full object-cover" />
                )}
              </div>
            </div>

            {activeSocialMedia.type?.startsWith("video/") ? (
              <div className="mt-3 rounded-2xl bg-white/5 ring-1 ring-white/10 p-3">
                <div className="text-xs text-white/60">
                  Trim (seconds) • Duration {Math.round(socialEditor.duration || 0)}s
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    min={0}
                    max={Math.max(0, socialEditor.duration || 0)}
                    step={0.1}
                    value={socialEditor.trimStart}
                    onChange={(e) =>
                      setSocialEditor((prev) => ({
                        ...prev,
                        trimStart: Math.max(0, Number(e.target.value) || 0),
                      }))
                    }
                    className="rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                    title="Trim start"
                  />
                  <input
                    type="number"
                    min={0}
                    max={Math.max(0, socialEditor.duration || 0)}
                    step={0.1}
                    value={socialEditor.trimEnd}
                    onChange={(e) =>
                      setSocialEditor((prev) => ({
                        ...prev,
                        trimEnd: Math.max(0, Number(e.target.value) || 0),
                      }))
                    }
                    className="rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                    title="Trim end"
                  />
                </div>
              </div>
            ) : (
              <div className="mt-3 text-xs text-white/60">Images export as platform-cropped JPEG.</div>
            )}

            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={runSocialExport}
                disabled={socialEditor.exporting}
                className={`rounded-2xl px-4 py-2 text-sm font-extrabold ${
                  socialEditor.exporting
                    ? "bg-white/20 text-white/60 cursor-not-allowed"
                    : "bg-gradient-to-r from-cyan-400 to-emerald-300 text-black hover:opacity-95"
                }`}
              >
                {socialEditor.exporting ? "Exporting..." : "Export Media"}
              </button>
              <button
                type="button"
                onClick={closeSocialEditor}
                className="rounded-2xl bg-white/5 ring-1 ring-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/10"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-white/70">No media selected.</div>
        )}
      </Modal>

      <div className="mx-auto max-w-5xl p-4 sm:p-6">
        <div
          className={`sticky top-0 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 pt-4 pb-3 backdrop-blur border-b ${
            isLightMode
              ? "bg-gradient-to-b from-white/95 to-slate-100/80 border-slate-900/10"
              : "bg-gradient-to-b from-black/95 to-black/70 border-white/10"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] font-extrabold tracking-[0.28em] text-white/50">SKATEFLOW</div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <div className="text-base sm:text-lg font-bold tracking-tight">Trading Card Athlete System</div>
                <Pill tone="cyan">
                  <Flame className="h-3.5 w-3.5" /> Streak {topStreak}
                </Pill>
                <Pill tone="neutral">XP {activeXP} • {xpLevel.key} ({xpLevel.pctToNext}%)</Pill>
                {activeMember?.role === "owner" ? (
                  <Pill tone="good">
                    <Crown className="h-3.5 w-3.5" /> Owner
                  </Pill>
                ) : activeMember?.role === "coach" ? (
                  <Pill tone="warn">
                    <Crown className="h-3.5 w-3.5" /> Coach
                  </Pill>
                ) : (
                  <Pill tone="neutral">
                    <Users className="h-3.5 w-3.5" /> Dad
                  </Pill>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setUI({ theme: isLightMode ? "dark" : "light" })}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 inline-flex items-center gap-2"
                title="Toggle light/dark mode"
              >
                {isLightMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                <span className="hidden sm:inline">{isLightMode ? "Dark" : "Light"}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setLoginPickId(ui.activeMemberId);
                  setLoginPin("");
                  setLoginError("");
                  setLoginOpen(true);
                }}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 inline-flex items-center gap-2"
                title="Switch user (PIN required)"
              >
                <Lock className="h-4 w-4" />
                <span className="hidden sm:inline">{activeMember?.name || "Account"}</span>
              </button>

              <select
                value={ui.activeSkaterId}
                onChange={(e) => setUI({ activeSkaterId: e.target.value })}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                title="Active skater"
              >
                {skaters.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-4 sm:grid-cols-9 gap-2">
            <TabButton active={ui.view === "log"} icon={ClipboardList} label="Log" onClick={() => setUI({ view: "log" })} />
            <TabButton active={ui.view === "cards"} icon={LayoutGrid} label="Cards" onClick={() => setUI({ view: "cards" })} />
            <TabButton active={ui.view === "dash"} icon={BarChart3} label="Stats" onClick={() => setUI({ view: "dash" })} />
            <TabButton active={ui.view === "plans"} icon={Pencil} label="Plans" onClick={() => setUI({ view: "plans" })} />
            <TabButton active={ui.view === "coach"} icon={VideoIcon} label="Coach" onClick={() => setUI({ view: "coach" })} />
            <TabButton active={ui.view === "contest"} icon={Trophy} label="Contest" onClick={() => setUI({ view: "contest" })} />
            <TabButton active={ui.view === "trips"} icon={MapPin} label="Trips" onClick={() => setUI({ view: "trips" })} />
            <TabButton active={ui.view === "team"} icon={Users} label="Team" onClick={() => setUI({ view: "team" })} />
            <TabButton active={ui.view === "chat"} icon={MessageSquare} label="Chat" onClick={() => setUI({ view: "chat" })} />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {ui.view === "log" ? (
            <motion.div key="log" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-4">
              <div className="rounded-3xl bg-gradient-to-br from-zinc-950 via-black to-zinc-900 p-5 sm:p-7 shadow-2xl ring-1 ring-white/10">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs tracking-widest text-white/50">SESSION BUILDER</div>
                    <div className="mt-1 text-xl font-extrabold tracking-tight">Log Today’s Work</div>
                    <div className="mt-1 text-xs text-white/50">
                      Auto-saved at {lastDraftSavedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Pill tone={halfwayReached ? "good" : "bad"}>
                        {halfwayReached ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                        Halfway {halfwayReached ? "Hit" : "Not Yet"}
                      </Pill>
                      <Pill tone={halfwayReached ? "good" : "bad"}>
                        <Flame className="h-3.5 w-3.5" /> Free Play {halfwayReached ? "Earned" : "Locked"}
                      </Pill>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button type="button" onClick={() => exportCSV(sessions)} className="rounded-2xl bg-white text-black px-4 py-2 text-sm font-bold hover:bg-white/90">
                      <Download className="h-4 w-4 inline-block mr-2" /> Export CSV
                    </button>
                    <button type="button" onClick={resetDraft} className="rounded-2xl bg-white/5 ring-1 ring-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/10">
                      Reset
                    </button>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-3">
                    <div className="text-xs text-white/60">Date</div>
                    <input value={draft.date} onChange={(e) => setDraft({ date: e.target.value })} type="date" className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2" />
                  </div>
                  <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-3">
                    <div className="text-xs text-white/60">Day Type</div>
                    <select value={draft.dayType} onChange={(e) => setDraft({ dayType: e.target.value })} className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2">
                      {Object.keys(plans).map((k) => (
                        <option key={k} value={k}>
                          {k}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-3">
                    <div className="text-xs text-white/60">Park</div>
                    <input value={draft.park} onChange={(e) => setDraft({ park: e.target.value })} placeholder="Harbor / Channel / Vans…" className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2" />
                  </div>
                </div>

                <div className="mt-4 rounded-2xl bg-white/5 ring-1 ring-white/10 p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">Progress</div>
                    <div className="text-sm font-bold text-cyan-300">{completionPct}%</div>
                  </div>
                  <div className="mt-3 h-3 rounded-full bg-white/10 overflow-hidden ring-1 ring-white/10">
                    <div className="h-full bg-gradient-to-r from-cyan-400 to-emerald-300" style={{ width: `${completionPct}%` }} />
                  </div>
                  <div className="mt-2 text-xs text-white/60">Total reps: {totalCompleted} / {totalTarget}</div>
                </div>

                <div className="mt-4 space-y-2">
                  {tasks.map((t) => {
                    const done = Number(draft.completedByTaskId?.[t.id]) || 0;
                    const target = Number(t.target) || 0;
                    const tp = pct(done, target || 1);
                    return (
                      <div key={t.id} className="rounded-2xl bg-black/30 ring-1 ring-white/10 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold truncate">{t.label}</div>
                            {t.notes ? <div className="mt-1 text-xs text-white/60">{t.notes}</div> : null}
                          </div>
                          <Pill tone={tp >= 100 ? "good" : tp >= 50 ? "warn" : "neutral"}>
                            {done}/{target}
                          </Pill>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <button type="button" className="rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-sm font-bold hover:bg-white/10" onClick={() => bumpReps(t, -1)} title="Decrease">
                            −
                          </button>
                          <input
                            value={draft.completedByTaskId?.[t.id] ?? ""}
                            onChange={(e) => updateReps(t, e.target.value)}
                            inputMode="numeric"
                            className="w-24 rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                            placeholder="0"
                          />
                          <button type="button" className="rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-sm font-bold hover:bg-white/10" onClick={() => bumpReps(t, +1)} title="Increase">
                            +
                          </button>
                          <button type="button" className="rounded-xl bg-cyan-500/20 ring-1 ring-cyan-400/30 px-3 py-2 text-sm font-bold hover:bg-cyan-500/30 text-cyan-100" onClick={() => bumpReps(t, +5)} title="Increase by 5">
                            +5
                          </button>
                          <div className="ml-auto flex items-center gap-2">
                            <div className="text-xs text-white/60">{tp}%</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-5 rounded-3xl bg-white/5 ring-1 ring-white/10 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold">Clips & Photos</div>
                      <div className="text-xs text-white/60">Upload proof. Coach can comment per clip on the card.</div>
                    </div>
                    <label className="cursor-pointer rounded-2xl bg-white text-black px-4 py-2 text-sm font-bold hover:bg-white/90 inline-flex items-center gap-2">
                      <Upload className="h-4 w-4" /> Add Media
                      <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={(e) => addMediaFromFiles(e.target.files)} />
                    </label>
                  </div>

                  {draftMedia.length ? (
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {draftMedia.map((m) => {
                        const isVideo = m.type?.startsWith("video/");
                        return (
                          <div key={m.id} className="relative overflow-hidden rounded-2xl bg-black ring-1 ring-white/10">
                            <div className="aspect-square">
                              {isVideo ? <video src={m.url} className="h-full w-full object-cover" controls playsInline /> : <img src={m.url} alt={m.name} className="h-full w-full object-cover" />}
                            </div>
                            <button type="button" className="absolute top-2 right-2 rounded-full bg-black/70 ring-1 ring-white/10 p-2 hover:bg-black" onClick={() => removeDraftMedia(m.id)} title="Remove">
                              <X className="h-4 w-4" />
                            </button>
                            <div className="absolute bottom-2 left-2">
                              <Pill tone="neutral">
                                {isVideo ? <VideoIcon className="h-3.5 w-3.5" /> : <ImageIcon className="h-3.5 w-3.5" />} {isVideo ? "Video" : "Photo"}
                              </Pill>
                            </div>
                            <button
                              type="button"
                              onClick={() => openSocialEditorForMedia(m)}
                              className="absolute bottom-2 right-2 rounded-xl bg-black/75 ring-1 ring-white/20 px-2 py-1 text-[11px] font-bold hover:bg-black"
                              title="Phase 1 social edit"
                            >
                              Edit
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="mt-3 text-sm text-white/60">No media yet. Add clips to build the card.</div>
                  )}
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button type="button" onClick={saveSession} className="rounded-2xl bg-gradient-to-r from-cyan-400 to-emerald-300 text-black px-5 py-3 text-sm font-extrabold hover:opacity-95">
                    Save Session Card
                  </button>

                  <button
                    type="button"
                    onClick={addPracticeToCalendar}
                    className="rounded-2xl bg-white/5 ring-1 ring-white/10 px-5 py-3 text-sm font-semibold hover:bg-white/10"
                    title="Downloads an iCal event you can add to Calendar"
                  >
                    <Calendar className="h-4 w-4 inline-block mr-2" /> Add Practice to Calendar
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const today = todayISO();
                      setDraft({ date: today });
                      addPracticeToCalendar(today);
                    }}
                    className="rounded-2xl bg-cyan-500/20 ring-1 ring-cyan-400/30 px-5 py-3 text-sm font-semibold hover:bg-cyan-500/30 text-cyan-100"
                    title="One-tap schedule for today"
                  >
                    <Calendar className="h-4 w-4 inline-block mr-2" /> Practice Today
                  </button>

                  <Pill tone={halfwayReached ? "good" : "bad"}>
                    <Flame className="h-3.5 w-3.5" /> Free Play: {halfwayReached ? "15 min" : "Locked"}
                  </Pill>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
                {sessions
                  .filter((s) => s.skaterId === ui.activeSkaterId)
                  .slice(0, 2)
                  .map((s) => (
                    <SessionCard
                      key={s.id}
                      session={s}
                      canComment={canComment}
                      onDelete={() => deleteSession(s.id)}
                      onAddComment={(txt) => addCommentToSession(s.id, txt)}
                      onSetMediaComment={(mid, txt) => setMediaComment(s.id, mid, txt)}
                    />
                  ))}
              </div>
            </motion.div>
          ) : null}

          {ui.view === "cards" ? (
            <motion.div key="cards" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="text-xs tracking-widest text-white/50">COLLECTION</div>
                  <div className="mt-1 text-xl font-extrabold">Cards</div>
                  <div className="mt-1 text-sm text-white/60">Sessions + Level Ups + New Tricks + Weekly recaps</div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-1 inline-flex">
                    <button
                      type="button"
                      onClick={() => setCardsMode("sessions")}
                      className={`rounded-xl px-3 py-2 text-sm font-bold ${cardsMode === "sessions" ? "bg-white text-black" : "text-white/80 hover:bg-white/10"}`}
                    >
                      Sessions
                    </button>
                    <button
                      type="button"
                      onClick={() => setCardsMode("progress")}
                      className={`rounded-xl px-3 py-2 text-sm font-bold ${cardsMode === "progress" ? "bg-white text-black" : "text-white/80 hover:bg-white/10"}`}
                    >
                      Progress
                    </button>
                  </div>

                  <button type="button" onClick={() => exportCSV(sessions)} className="rounded-2xl bg-white text-black px-4 py-2 text-sm font-bold hover:bg-white/90">
                    <Download className="h-4 w-4 inline-block mr-2" /> Export
                  </button>
                </div>
              </div>

              {cardsMode === "sessions" ? (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {sessions
                    .filter((s) => s.skaterId === ui.activeSkaterId)
                    .map((s) => (
                      <SessionCard
                        key={s.id}
                        session={s}
                        canComment={canComment}
                        onDelete={() => deleteSession(s.id)}
                        onAddComment={(txt) => addCommentToSession(s.id, txt)}
                        onSetMediaComment={(mid, txt) => setMediaComment(s.id, mid, txt)}
                      />
                    ))}
                </div>
              ) : (
                <>
                  <div className="mt-4 rounded-3xl bg-white/5 ring-1 ring-white/10 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {[
                        ["all", "ALL"],
                        ["newtrick", "NEW TRICKS"],
                        ["levelup", "LEVEL UPS"],
                        ["achievement", "ACHIEVEMENTS"],
                        ["xp", "XP"],
                        ["weekly", "WEEKLY"],
                      ].map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setBinderFilter(value)}
                          className={`rounded-xl px-3 py-2 text-xs font-extrabold tracking-wide ring-1 transition ${
                            binderFilter === value
                              ? "bg-white text-black ring-white"
                              : "bg-black/30 text-white/80 ring-white/15 hover:bg-white/10"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                      <div className="ml-auto text-xs text-white/60">
                        Binder: {filteredProgressCards.length} card{filteredProgressCards.length === 1 ? "" : "s"}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {filteredProgressCards.map((c) => (
                      <ProgressCard key={c.id} card={c} skater={activeSkater} />
                    ))}
                  </div>
                </>
              )}

              {cardsMode === "sessions" && !sessions.filter((s) => s.skaterId === ui.activeSkaterId).length ? (
                <div className="mt-6 rounded-3xl bg-white/5 ring-1 ring-white/10 p-5 text-white/70">
                  No cards yet. Go to <span className="font-bold text-white">Log</span> and save your first session.
                </div>
              ) : null}

              {cardsMode === "progress" && !progressCards.length ? (
                <div className="mt-6 rounded-3xl bg-white/5 ring-1 ring-white/10 p-5 text-white/70">
                  No progress cards yet. Log sessions and hit targets to unlock <span className="font-bold text-white">NEW TRICK</span> and <span className="font-bold text-white">LEVEL UP</span> cards.
                </div>
              ) : null}

              {cardsMode === "progress" && progressCards.length > 0 && !filteredProgressCards.length ? (
                <div className="mt-6 rounded-3xl bg-white/5 ring-1 ring-white/10 p-5 text-white/70">
                  No cards in this binder filter yet.
                </div>
              ) : null}
            </motion.div>
          ) : null}

          {ui.view === "dash" ? (
            <motion.div key="dash" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-4">
              <div>
                <div className="text-xs tracking-widest text-white/50">PROGRESSION</div>
                <div className="mt-1 text-xl font-extrabold">Stats & Charts</div>
              </div>

              <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-3">
                <Stat label="Current Streak" value={`${topStreak} sessions`} tone={topStreak >= 3 ? "good" : "neutral"} />
                <Stat
                  label="Career High OVR"
                  value={(() => {
                    const max = Math.max(0, ...sessions.filter((s) => s.skaterId === ui.activeSkaterId).map((s) => computeOVR(s)));
                    return max ? `${max} OVR` : "—";
                  })()}
                  tone="gold"
                />
                <Stat label="Total Sessions" value={`${sessions.filter((s) => s.skaterId === ui.activeSkaterId).length}`} tone="cyan" />
              </div>

              <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div className="rounded-3xl bg-white/5 ring-1 ring-white/10 p-4">
                  <div className="text-sm font-semibold">Completion % (last sessions)</div>
                  <div className="mt-3 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Line type="monotone" dataKey="pct" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-3xl bg-white/5 ring-1 ring-white/10 p-4">
                  <div className="text-sm font-semibold">Avg % by Day Type</div>
                  <div className="mt-3 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dayTypeBars}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="dayType" hide />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Bar dataKey="avg" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-2 text-xs text-white/60">Hover bars to see the day type.</div>
                </div>
              </div>

              <div className="mt-4 rounded-3xl bg-white/5 ring-1 ring-white/10 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold inline-flex items-center gap-2">
                      <CloudSun className="h-4 w-4" /> Skate Park Weather
                    </div>
                    <div className="text-xs text-white/60">Check weather before practice or day trips.</div>
                  </div>
                </div>

                <div className="mt-3 rounded-2xl bg-black/30 ring-1 ring-white/10 p-3">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      value={weatherParkQuery}
                      onChange={(e) => setWeatherParkQuery(e.target.value)}
                      placeholder="Enter skate park or city"
                      className="flex-1 rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => loadParkWeather(weatherParkQuery)}
                      className="rounded-xl bg-white text-black px-4 py-2 text-sm font-bold hover:bg-white/90"
                    >
                      {weatherLoading ? "Loading..." : "Get Weather"}
                    </button>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {SKATE_PARK_SUGGESTIONS.map((name) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => {
                          setWeatherParkQuery(name);
                          loadParkWeather(name);
                        }}
                        className="rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/10"
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>

                {weatherError ? <div className="mt-3 text-sm text-rose-200">{weatherError}</div> : null}

                {weatherData?.current ? (
                  <div className="mt-3 rounded-2xl bg-black/30 ring-1 ring-white/10 p-4">
                    <div className="text-sm font-bold">{weatherData.placeName}</div>
                    <div className="mt-1 text-xs text-white/60">
                      {weatherData.latitude}, {weatherData.longitude}
                    </div>
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <Stat label="Now" value={`${Math.round(weatherData.current.temperature_2m ?? 0)}°`} tone="cyan" />
                      <Stat label="Feels" value={`${Math.round(weatherData.current.apparent_temperature ?? 0)}°`} tone="neutral" />
                      <Stat label="Wind" value={`${Math.round(weatherData.current.wind_speed_10m ?? 0)} km/h`} tone="neutral" />
                      <Stat label="Condition" value={weatherLabelFromCode(weatherData.current.weather_code)} tone="good" />
                    </div>
                    {weatherData.daily?.time?.length ? (
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {weatherData.daily.time.map((d, idx) => (
                          <div key={d} className="rounded-xl bg-white/5 ring-1 ring-white/10 p-3">
                            <div className="text-xs text-white/60">{formatShortDate(d)}</div>
                            <div className="mt-1 text-sm font-bold">
                              {Math.round(weatherData.daily.temperature_2m_max?.[idx] ?? 0)}° / {Math.round(weatherData.daily.temperature_2m_min?.[idx] ?? 0)}°
                            </div>
                            <div className="mt-1 text-xs text-white/70">
                              {weatherLabelFromCode(weatherData.daily.weather_code?.[idx])} • Rain {weatherData.daily.precipitation_probability_max?.[idx] ?? 0}%
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className="mt-4 rounded-3xl bg-white/5 ring-1 ring-white/10 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">Practice Calendar</div>
                    <div className="text-xs text-white/60">Best reminders = Calendar events. Browser notifications aren’t reliable when closed.</div>
                  </div>
                  <div className="flex gap-2">
                    {!reminders.enabled ? (
                      <button type="button" onClick={enableNotifications} className="rounded-2xl bg-white text-black px-4 py-2 text-sm font-bold hover:bg-white/90">
                        <Bell className="h-4 w-4 inline-block mr-2" /> Enable Alerts
                      </button>
                    ) : (
                      <Pill tone="good">
                        <Bell className="h-3.5 w-3.5" /> Enabled
                      </Pill>
                    )}
                    <div className="flex gap-2">
                      <button type="button" onClick={addPracticeToCalendar} className="rounded-2xl bg-white/5 ring-1 ring-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/10" title="Downloads an iCal file you can add to Calendar">
                        <Calendar className="h-4 w-4 inline-block mr-2" /> Add Practice
                      </button>

                      <label className="cursor-pointer rounded-2xl bg-white text-black px-4 py-2 text-sm font-bold hover:bg-white/90 inline-flex items-center gap-2" title="Import an .ics from Google Calendar or iOS/Apple Calendar">
                        <Upload className="h-4 w-4" /> Import .ics
                        <input type="file" accept="text/calendar,.ics" className="hidden" onChange={(e) => importICSFile(e.target.files?.[0])} />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="rounded-2xl bg-black/30 ring-1 ring-white/10 p-3">
                    <div className="text-xs text-white/60">Practice Date</div>
                    <input value={draft.date} onChange={(e) => setDraft({ date: e.target.value })} type="date" className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2" />
                  </div>
                  <div className="rounded-2xl bg-black/30 ring-1 ring-white/10 p-3">
                    <div className="text-xs text-white/60">Start Time</div>
                    <input value={reminders.time} onChange={(e) => setSlice({ reminders: { ...reminders, time: e.target.value } })} type="time" className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2" />
                  </div>
                  <div className="rounded-2xl bg-black/30 ring-1 ring-white/10 p-3">
                    <div className="text-xs text-white/60">Duration (min)</div>
                    <input
                      value={practiceSettings.durationMin}
                      onChange={(e) => setSlice({ practiceSettings: { ...practiceSettings, durationMin: clampNum(e.target.value) || 0 } })}
                      inputMode="numeric"
                      className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2"
                    />
                  </div>
                  <div className="rounded-2xl bg-black/30 ring-1 ring-white/10 p-3">
                    <div className="text-xs text-white/60">Reminder (min before)</div>
                    <input
                      value={practiceSettings.remindMin}
                      onChange={(e) => setSlice({ practiceSettings: { ...practiceSettings, remindMin: clampNum(e.target.value) || 0 } })}
                      inputMode="numeric"
                      className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2"
                    />
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-black/30 ring-1 ring-white/10 p-3">
                    <div className="text-xs text-white/60">Event Title</div>
                    <input value={practiceSettings.title} onChange={(e) => setSlice({ practiceSettings: { ...practiceSettings, title: e.target.value } })} className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2" />
                  </div>
                  <div className="rounded-2xl bg-black/30 ring-1 ring-white/10 p-3">
                    <div className="text-xs text-white/60">Tip</div>
                    <div className="mt-1 text-sm">Tap <span className="font-bold">Add Practice</span> → open the .ics → Add to Calendar.</div>
                  </div>
                </div>

                {practiceEvents.length ? (
                  <div className="mt-4 rounded-3xl bg-black/30 ring-1 ring-white/10 p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold">Scheduled Practices (this device)</div>
                      <Pill tone="neutral">{practiceEvents.length}</Pill>
                    </div>
                    <div className="mt-3 space-y-2">
                      {practiceEvents.slice(0, 8).map((ev) => (
                        <div key={ev.id} className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="text-sm font-bold">
                              {ev.dateISO} • {ev.time}
                              <span className="text-white/60 font-normal"> • {ev.skaterName}</span>
                            </div>
                            <div className="flex gap-2">
                              <button type="button" onClick={() => exportPracticeEvent(ev)} className="rounded-xl bg-white text-black px-3 py-2 text-xs font-extrabold hover:bg-white/90">
                                Download
                              </button>
                              <button type="button" onClick={() => removePracticeEvent(ev.id)} className="rounded-xl bg-rose-500/15 ring-1 ring-rose-500/20 px-3 py-2 text-xs font-semibold hover:bg-rose-500/20 text-rose-200">
                                Remove
                              </button>
                            </div>
                          </div>
                          <div className="mt-1 text-xs text-white/60">{ev.title} • {ev.durationMin} min • Reminder {ev.remindMin} min before</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </motion.div>
          ) : null}

          {ui.view === "plans" ? (
            <motion.div key="plans" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-4">
              <div className="rounded-3xl bg-white/5 ring-1 ring-white/10 p-5 sm:p-7">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs tracking-widest text-white/50">PROGRAM</div>
                    <div className="mt-1 text-xl font-extrabold">Training Plans</div>
                    <div className="mt-2 text-sm text-white/60">Owner + Coach can edit. Dad can view/log.</div>
                  </div>
                  {canEditPlans ? (
                    <button type="button" onClick={addDayType} className="rounded-2xl bg-white text-black px-4 py-2 text-sm font-bold hover:bg-white/90">
                      <Plus className="h-4 w-4 inline-block mr-2" /> Add Day
                    </button>
                  ) : (
                    <Pill tone="warn">View only</Pill>
                  )}
                </div>

                <div className="mt-5 space-y-3">
                  {Object.entries(plans).map(([dayName, dayTasks]) => (
                    <div key={dayName} className="rounded-3xl bg-black/30 ring-1 ring-white/10 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-bold">{dayName}</div>
                        {canEditPlans ? (
                          <div className="flex gap-2">
                            <button type="button" onClick={() => renameDayType(dayName)} className="rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/10">
                              Rename
                            </button>
                            <button type="button" onClick={() => deleteDayType(dayName)} className="rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/10">
                              Delete
                            </button>
                          </div>
                        ) : null}
                      </div>

                      <div className="mt-3 space-y-2">
                        {dayTasks.map((t) => (
                          <div key={t.id} className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-sm font-semibold truncate">{t.label}</div>
                                <div className="mt-1 text-xs text-white/60">
                                  Target: <span className="font-bold text-white">{t.target}</span>
                                  {t.notes ? ` • ${t.notes}` : ""}
                                </div>
                              </div>
                              {canEditPlans ? (
                                <div className="flex gap-2">
                                  <button type="button" onClick={() => editTask(dayName, t)} className="rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/10">
                                    Edit
                                  </button>
                                  <button type="button" onClick={() => deleteTask(dayName, t.id)} className="rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/10">
                                    Remove
                                  </button>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>

                      {canEditPlans ? (
                        <div className="mt-3">
                          <button type="button" onClick={() => addTaskToDay(dayName)} className="rounded-2xl bg-gradient-to-r from-cyan-400 to-emerald-300 text-black px-4 py-2 text-sm font-extrabold hover:opacity-95">
                            <Plus className="h-4 w-4 inline-block mr-2" /> Add Task
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : null}

          {ui.view === "coach" ? (
            <motion.div key="coach" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-4">
              <div className="rounded-3xl bg-gradient-to-br from-zinc-950 via-black to-zinc-900 p-5 sm:p-7 shadow-2xl ring-1 ring-white/10">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs tracking-widest text-white/50">COACH CORNER</div>
                    <div className="mt-1 text-xl font-extrabold">Trick Demos for {activeSkater?.name || "Skater"}</div>
                    <div className="mt-2 text-sm text-white/60">Save trick examples with clips/photos so skaters can review technique anytime.</div>
                  </div>
                  <Pill tone={canUseCoachCorner ? "good" : "warn"}>{canUseCoachCorner ? "Coach/Parent edit" : "View only"}</Pill>
                </div>

                <div className="mt-4 rounded-3xl bg-white/5 ring-1 ring-white/10 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold">Coach Video Library</div>
                      <div className="text-xs text-white/60">Video-only demo clips for quick playback before a session.</div>
                    </div>
                    <Pill tone="cyan">{activeCoachVideos.length} videos</Pill>
                  </div>
                  {activeCoachVideos.length ? (
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {activeCoachVideos.slice(0, 9).map((v) => (
                        <div key={v.id} className="rounded-2xl overflow-hidden bg-black ring-1 ring-white/10">
                          <div className="aspect-video">
                            <video src={v.url} className="h-full w-full object-cover" controls playsInline />
                          </div>
                          <div className="p-2">
                            <div className="text-xs font-semibold truncate">{v.trickName || "Coach Demo"}</div>
                            <div className="text-[11px] text-white/60">{new Date(v.createdAt).toLocaleDateString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-2 text-sm text-white/60">No videos yet. Upload a demo clip to build the library.</div>
                  )}
                </div>

                <div className="mt-5 rounded-3xl bg-white/5 ring-1 ring-white/10 p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-black/30 ring-1 ring-white/10 p-3">
                      <div className="text-xs text-white/60">Trick Name</div>
                      <input
                        value={coachDraft.trickName}
                        onChange={(e) => setCoachDraft((prev) => ({ ...prev, trickName: e.target.value }))}
                        placeholder="e.g. Frontside Air"
                        className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2"
                        disabled={!canUseCoachCorner}
                      />
                    </div>
                    <div className="rounded-2xl bg-black/30 ring-1 ring-white/10 p-3">
                      <div className="text-xs text-white/60">Coach Notes</div>
                      <input
                        value={coachDraft.notes}
                        onChange={(e) => setCoachDraft((prev) => ({ ...prev, notes: e.target.value }))}
                        placeholder="Key cues, timing, grab notes..."
                        className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2"
                        disabled={!canUseCoachCorner}
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <label className={`cursor-pointer rounded-2xl px-4 py-2 text-sm font-bold inline-flex items-center gap-2 ${canUseCoachCorner ? "bg-white text-black hover:bg-white/90" : "bg-white/10 text-white/60 cursor-not-allowed"}`}>
                      <Upload className="h-4 w-4" /> Add Demo Media
                      <input
                        type="file"
                        multiple
                        accept="image/*,video/*"
                        className="hidden"
                        onChange={(e) => addCoachDraftMedia(e.target.files)}
                        disabled={!canUseCoachCorner}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={saveCoachDemo}
                      className={`rounded-2xl px-4 py-2 text-sm font-extrabold ${canUseCoachCorner ? "bg-gradient-to-r from-cyan-400 to-emerald-300 text-black hover:opacity-95" : "bg-white/10 text-white/60 cursor-not-allowed"}`}
                      disabled={!canUseCoachCorner}
                    >
                      Save Demo
                    </button>
                  </div>

                  {coachDraft.media.length ? (
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {coachDraft.media.map((m) => {
                        const isVideo = m.type?.startsWith("video/");
                        return (
                          <div key={m.id} className="relative overflow-hidden rounded-2xl bg-black ring-1 ring-white/10">
                            <div className="aspect-square">
                              {isVideo ? <video src={m.url} className="h-full w-full object-cover" controls playsInline /> : <img src={m.url} alt={m.name} className="h-full w-full object-cover" />}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeCoachDraftMedia(m.id)}
                              className="absolute top-2 right-2 rounded-full bg-black/70 ring-1 ring-white/10 p-1.5 hover:bg-black"
                              title="Remove"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>

                <div className="mt-5 space-y-3">
                  {activeCoachDemos.length ? (
                    activeCoachDemos.map((demo) => (
                      <div key={demo.id} className="rounded-3xl bg-white/5 ring-1 ring-white/10 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-extrabold">{demo.trickName}</div>
                            {demo.notes ? <div className="mt-1 text-xs text-white/70">{demo.notes}</div> : null}
                            <div className="mt-1 text-[11px] text-white/50">
                              Added by {demo.createdBy || "Coach"} • {new Date(demo.createdAt).toLocaleString()}
                            </div>
                          </div>
                          {canUseCoachCorner ? (
                            <button
                              type="button"
                              onClick={() => deleteCoachDemo(demo.id)}
                              className="rounded-xl bg-rose-500/15 ring-1 ring-rose-500/25 px-3 py-2 text-xs font-semibold text-rose-200 hover:bg-rose-500/20"
                            >
                              Remove
                            </button>
                          ) : null}
                        </div>

                        {(demo.media || []).length ? (
                          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {(demo.media || []).map((m) => {
                              const isVideo = m.type?.startsWith("video/");
                              return (
                                <div key={m.id} className="overflow-hidden rounded-2xl bg-black ring-1 ring-white/10">
                                  <div className="aspect-square">
                                    {isVideo ? <video src={m.url} className="h-full w-full object-cover" controls playsInline /> : <img src={m.url} alt={m.name} className="h-full w-full object-cover" />}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-3xl bg-white/5 ring-1 ring-white/10 p-4 text-sm text-white/70">No trick demos yet for this skater.</div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : null}

          {ui.view === "contest" ? (
            <motion.div key="contest" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-4">
              <div className="rounded-3xl bg-gradient-to-br from-zinc-950 via-black to-zinc-900 p-5 sm:p-7 shadow-2xl ring-1 ring-white/10">
                <div>
                  <div className="text-xs tracking-widest text-white/50">CONTEST RUNS</div>
                  <div className="mt-1 text-xl font-extrabold">{activeSkater?.name || "Skater"} Contest Journal</div>
                  <div className="mt-2 text-sm text-white/60">Track each run with tricks landed, score, and video/photo proof.</div>
                </div>

                <div className="mt-5 rounded-3xl bg-white/5 ring-1 ring-white/10 p-4">
                  <div className="rounded-2xl bg-black/30 ring-1 ring-white/10 p-3">
                    <div className="text-xs text-white/60">Quick Add Run</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {[
                        { label: "Run 1", roundName: "Qualifier", runNumber: 1 },
                        { label: "Run 2", roundName: "Qualifier", runNumber: 2 },
                        { label: "Run 3", roundName: "Qualifier", runNumber: 3 },
                        { label: "Finals", roundName: "Finals", runNumber: "" },
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => applyContestPreset(preset)}
                          className="rounded-xl bg-cyan-500/15 ring-1 ring-cyan-500/25 px-3 py-2 text-xs font-bold text-cyan-100 hover:bg-cyan-500/25"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-black/30 ring-1 ring-white/10 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs text-white/60">Run Timer Mode</div>
                        <Pill tone={contestTimerRunning ? "warn" : "neutral"}>
                          {contestTimerRunning ? "Running" : "Idle"}
                        </Pill>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <input
                          value={contestTimerSeconds}
                          onChange={(e) => setContestTimerSeconds(clampNum(e.target.value) || 5)}
                          inputMode="numeric"
                          className="w-20 rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                          title="Timer seconds"
                        />
                        <button type="button" onClick={startContestTimer} className="rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/10">
                          Start
                        </button>
                        <button type="button" onClick={pauseContestTimer} className="rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/10">
                          Pause
                        </button>
                        <button type="button" onClick={resetContestTimer} className="rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/10">
                          Reset
                        </button>
                      </div>
                      <div className="mt-2 text-2xl font-black tracking-wide">{formatTimer(contestTimerLeft)}</div>
                    </div>

                    <div className="rounded-2xl bg-black/30 ring-1 ring-white/10 p-3">
                      <div className="text-xs text-white/60">Contest Scoring Preview</div>
                      <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                        <div className="rounded-xl bg-black/40 ring-1 ring-white/10 p-2">
                          <div className="text-white/60">Auto Score</div>
                          <div className="mt-1 text-base font-extrabold text-cyan-200">{contestDraftScore.autoScore}</div>
                        </div>
                        <div className="rounded-xl bg-black/40 ring-1 ring-white/10 p-2">
                          <div className="text-white/60">Landed</div>
                          <div className="mt-1 text-base font-extrabold">{contestDraftScore.landedPoints}</div>
                        </div>
                        <div className="rounded-xl bg-black/40 ring-1 ring-white/10 p-2">
                          <div className="text-white/60">Possible</div>
                          <div className="mt-1 text-base font-extrabold">{contestDraftScore.totalPossible}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setContestDraft((prev) => ({ ...prev, score: String(contestDraftScore.autoScore) }))}
                        className="mt-2 rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/10"
                      >
                        Use Auto Score
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-5 gap-3">
                    <div className="rounded-2xl bg-black/30 ring-1 ring-white/10 p-3">
                      <div className="text-xs text-white/60">Date</div>
                      <input
                        value={contestDraft.date}
                        onChange={(e) => setContestDraft((prev) => ({ ...prev, date: e.target.value }))}
                        type="date"
                        className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2"
                      />
                    </div>
                    <div className="rounded-2xl bg-black/30 ring-1 ring-white/10 p-3">
                      <div className="text-xs text-white/60">Contest</div>
                      <input
                        value={contestDraft.contestName}
                        onChange={(e) => setContestDraft((prev) => ({ ...prev, contestName: e.target.value }))}
                        placeholder="Vans Park Series"
                        className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2"
                      />
                    </div>
                    <div className="rounded-2xl bg-black/30 ring-1 ring-white/10 p-3">
                      <div className="text-xs text-white/60">Round</div>
                      <input
                        value={contestDraft.roundName}
                        onChange={(e) => setContestDraft((prev) => ({ ...prev, roundName: e.target.value }))}
                        placeholder="Qualifier / Finals"
                        className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2"
                      />
                    </div>
                    <div className="rounded-2xl bg-black/30 ring-1 ring-white/10 p-3">
                      <div className="text-xs text-white/60">Run #</div>
                      <input
                        value={contestDraft.runNumber}
                        onChange={(e) => setContestDraft((prev) => ({ ...prev, runNumber: clampNum(e.target.value) }))}
                        inputMode="numeric"
                        placeholder="1"
                        className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2"
                      />
                    </div>
                    <div className="rounded-2xl bg-black/30 ring-1 ring-white/10 p-3">
                      <div className="text-xs text-white/60">Score</div>
                      <input
                        value={contestDraft.score}
                        onChange={(e) => setContestDraft((prev) => ({ ...prev, score: e.target.value }))}
                        placeholder="87.5"
                        className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2"
                      />
                    </div>
                  </div>

                  <div className="mt-3 rounded-2xl bg-black/30 ring-1 ring-white/10 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs text-white/60">Run Tricks</div>
                      <button
                        type="button"
                        onClick={addContestTrickRow}
                        className="rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/10"
                      >
                        <Plus className="h-3.5 w-3.5 inline-block mr-1" /> Add Trick
                      </button>
                    </div>
                    <div className="mt-2 space-y-2">
                      {(contestDraft.tricks || []).map((trick, idx) => (
                        <div key={trick.id} className="rounded-xl bg-black/30 ring-1 ring-white/10 p-2">
                          <div className="grid grid-cols-1 sm:grid-cols-[1.2fr_auto_90px_1fr_auto] gap-2 items-center">
                            <input
                              value={trick.name}
                              onChange={(e) => updateContestTrick(trick.id, { name: e.target.value })}
                              placeholder={`Trick ${idx + 1} (name)`}
                              className="rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                            />
                            <label className="inline-flex items-center gap-2 text-xs text-white/70">
                              <input
                                type="checkbox"
                                checked={Boolean(trick.landed)}
                                onChange={(e) => updateContestTrick(trick.id, { landed: e.target.checked })}
                              />
                              Landed
                            </label>
                            <input
                              value={trick.points ?? 10}
                              onChange={(e) => updateContestTrick(trick.id, { points: clampNum(e.target.value) || 0 })}
                              inputMode="numeric"
                              placeholder="Points"
                              className="rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                            />
                            <input
                              value={trick.notes || ""}
                              onChange={(e) => updateContestTrick(trick.id, { notes: e.target.value })}
                              placeholder="Notes (style, miss, setup)"
                              className="rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => removeContestTrick(trick.id)}
                              className="rounded-xl bg-rose-500/15 ring-1 ring-rose-500/25 px-3 py-2 text-xs font-semibold text-rose-200 hover:bg-rose-500/20"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3 rounded-2xl bg-black/30 ring-1 ring-white/10 p-3">
                    <div className="text-xs text-white/60">Run Notes</div>
                    <textarea
                      value={contestDraft.notes}
                      onChange={(e) => setContestDraft((prev) => ({ ...prev, notes: e.target.value }))}
                      placeholder="What worked, what to improve..."
                      rows={4}
                      className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <label className="cursor-pointer rounded-2xl bg-white text-black px-4 py-2 text-sm font-bold hover:bg-white/90 inline-flex items-center gap-2">
                      <Upload className="h-4 w-4" /> Add Run Media
                      <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={(e) => addContestDraftMedia(e.target.files)} />
                    </label>
                    <button
                      type="button"
                      onClick={saveContestRun}
                      className="rounded-2xl bg-gradient-to-r from-cyan-400 to-emerald-300 text-black px-4 py-2 text-sm font-extrabold hover:opacity-95"
                    >
                      Save Run
                    </button>
                  </div>

                  {contestDraft.media.length ? (
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {contestDraft.media.map((m) => {
                        const isVideo = m.type?.startsWith("video/");
                        return (
                          <div key={m.id} className="relative overflow-hidden rounded-2xl bg-black ring-1 ring-white/10">
                            <div className="aspect-square">
                              {isVideo ? <video src={m.url} className="h-full w-full object-cover" controls playsInline /> : <img src={m.url} alt={m.name} className="h-full w-full object-cover" />}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeContestDraftMedia(m.id)}
                              className="absolute top-2 right-2 rounded-full bg-black/70 ring-1 ring-white/10 p-1.5 hover:bg-black"
                              title="Remove"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>

                <div className="mt-5 space-y-3">
                  {activeContestRuns.length ? (
                    activeContestRuns.map((run) => (
                      <div
                        key={run.id}
                        className={`rounded-3xl bg-white/5 ring-1 p-4 ${contestDragRunId === run.id ? "ring-cyan-400/50" : "ring-white/10"}`}
                        draggable
                        onDragStart={() => setContestDragRunId(run.id)}
                        onDragEnd={() => setContestDragRunId("")}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => {
                          reorderContestRuns(contestDragRunId, run.id);
                          setContestDragRunId("");
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-extrabold">
                              <span className="mr-2 text-white/40 cursor-grab select-none" title="Drag to reorder by heat time">⋮⋮</span>
                              {run.date} • {run.contestName}
                              {run.roundName ? <span className="text-white/70 font-semibold"> • {run.roundName}</span> : null}
                              {run.runNumber ? <span className="text-white/70 font-semibold"> • Run {run.runNumber}</span> : null}
                            </div>
                            <div className="mt-1 text-xs text-white/70">
                              Score: {run.score || "—"}
                              {run.manualScore ? <span> (manual override)</span> : null}
                              {typeof run.autoScore === "number" ? <span> • Auto {run.autoScore}</span> : null}
                              {typeof run.landedPoints === "number" && typeof run.totalPossiblePoints === "number" ? (
                                <span> • Landed {run.landedPoints}/{run.totalPossiblePoints}</span>
                              ) : null}
                              <span> • Added by {run.createdBy || "Team"}</span>
                            </div>
                            {run.notes ? <div className="mt-2 text-sm text-white/80 whitespace-pre-wrap">{run.notes}</div> : null}
                          </div>
                          <button
                            type="button"
                            onClick={() => deleteContestRun(run.id)}
                            className="rounded-xl bg-rose-500/15 ring-1 ring-rose-500/25 px-3 py-2 text-xs font-semibold text-rose-200 hover:bg-rose-500/20"
                          >
                            Remove
                          </button>
                        </div>

                        <div className="mt-3">
                          <div className="text-xs text-white/60">Tricks</div>
                          {run.tricks?.length ? (
                            <div className="mt-2 space-y-2">
                              {run.tricks.map((trick, idx) => {
                                if (typeof trick === "string") {
                                  return (
                                    <div key={`${run.id}-${idx}`} className="rounded-xl bg-black/30 ring-1 ring-white/10 p-2 text-sm">
                                      <span className="font-semibold">{trick}</span>
                                    </div>
                                  );
                                }
                                return (
                                  <div key={trick.id || `${run.id}-${idx}`} className="rounded-xl bg-black/30 ring-1 ring-white/10 p-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="text-sm font-semibold">{trick.name || "Unnamed trick"}</span>
                                      <Pill tone={trick.landed ? "good" : "warn"}>{trick.landed ? "Landed" : "Missed"}</Pill>
                                      {typeof trick.points === "number" ? <Pill tone="neutral">{trick.points} pts</Pill> : null}
                                    </div>
                                    {trick.notes ? <div className="mt-1 text-xs text-white/70">{trick.notes}</div> : null}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="mt-1 text-sm text-white/60">No tricks listed.</div>
                          )}
                        </div>

                        {(run.media || []).length ? (
                          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {(run.media || []).map((m) => {
                              const isVideo = m.type?.startsWith("video/");
                              return (
                                <div key={m.id} className="overflow-hidden rounded-2xl bg-black ring-1 ring-white/10">
                                  <div className="aspect-square">
                                    {isVideo ? <video src={m.url} className="h-full w-full object-cover" controls playsInline /> : <img src={m.url} alt={m.name} className="h-full w-full object-cover" />}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-3xl bg-white/5 ring-1 ring-white/10 p-4 text-sm text-white/70">No contest runs yet for this skater.</div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : null}

          {ui.view === "trips" ? (
            <motion.div key="trips" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-4">
              <div className="rounded-3xl bg-gradient-to-br from-zinc-950 via-black to-zinc-900 p-5 sm:p-7 shadow-2xl ring-1 ring-white/10">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs tracking-widest text-white/50">DAY TRIPS</div>
                    <div className="mt-1 text-xl font-extrabold">{activeSkater?.name || "Skater"} Skate Park Days</div>
                    <div className="mt-2 text-sm text-white/60">Log skate park trips by day and upload photos/videos from that day.</div>
                  </div>
                  <Pill tone={canUploadDayTrips ? "good" : "warn"}>
                    {canUploadDayTrips ? "Coach/Skater upload" : "View only"}
                  </Pill>
                </div>

                <div className="mt-5 rounded-3xl bg-white/5 ring-1 ring-white/10 p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-2xl bg-black/30 ring-1 ring-white/10 p-3">
                      <div className="text-xs text-white/60">Trip Date</div>
                      <input
                        value={dayTripDraft.date}
                        onChange={(e) => setDayTripDraft((prev) => ({ ...prev, date: e.target.value }))}
                        type="date"
                        className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2"
                        disabled={!canUploadDayTrips}
                      />
                    </div>
                    <div className="rounded-2xl bg-black/30 ring-1 ring-white/10 p-3 sm:col-span-2">
                      <div className="text-xs text-white/60">Skate Park</div>
                      <input
                        value={dayTripDraft.park}
                        onChange={(e) => setDayTripDraft((prev) => ({ ...prev, park: e.target.value }))}
                        placeholder="e.g. Vans HB / Harbor / Channel Street"
                        className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2"
                        disabled={!canUploadDayTrips}
                      />
                    </div>
                  </div>

                  <div className="mt-3 rounded-2xl bg-black/30 ring-1 ring-white/10 p-3">
                    <div className="text-xs text-white/60">Day Notes</div>
                    <textarea
                      value={dayTripDraft.notes}
                      onChange={(e) => setDayTripDraft((prev) => ({ ...prev, notes: e.target.value }))}
                      rows={4}
                      placeholder="What parks, what tricks, what to improve..."
                      className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                      disabled={!canUploadDayTrips}
                    />
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <label className={`cursor-pointer rounded-2xl px-4 py-2 text-sm font-bold inline-flex items-center gap-2 ${canUploadDayTrips ? "bg-white text-black hover:bg-white/90" : "bg-white/10 text-white/60 cursor-not-allowed"}`}>
                      <Upload className="h-4 w-4" /> Add Day Photos/Videos
                      <input
                        type="file"
                        multiple
                        accept="image/*,video/*"
                        className="hidden"
                        onChange={(e) => addDayTripDraftMedia(e.target.files)}
                        disabled={!canUploadDayTrips}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={saveDayTrip}
                      className={`rounded-2xl px-4 py-2 text-sm font-extrabold ${canUploadDayTrips ? "bg-gradient-to-r from-cyan-400 to-emerald-300 text-black hover:opacity-95" : "bg-white/10 text-white/60 cursor-not-allowed"}`}
                      disabled={!canUploadDayTrips}
                    >
                      Save Day Trip
                    </button>
                  </div>

                  {dayTripDraft.media.length ? (
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {dayTripDraft.media.map((m) => {
                        const isVideo = m.type?.startsWith("video/");
                        return (
                          <div key={m.id} className="relative overflow-hidden rounded-2xl bg-black ring-1 ring-white/10">
                            <div className="aspect-square">
                              {isVideo ? <video src={m.url} className="h-full w-full object-cover" controls playsInline /> : <img src={m.url} alt={m.name} className="h-full w-full object-cover" />}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeDayTripDraftMedia(m.id)}
                              className="absolute top-2 right-2 rounded-full bg-black/70 ring-1 ring-white/10 p-1.5 hover:bg-black"
                              title="Remove"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>

                <div className="mt-5 space-y-3">
                  {activeDayTrips.length ? (
                    activeDayTrips.map((trip) => (
                      <div key={trip.id} className="rounded-3xl bg-white/5 ring-1 ring-white/10 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-extrabold">
                              {trip.date} • {trip.park}
                            </div>
                            <div className="mt-1 text-xs text-white/60">
                              Added by {trip.createdBy || "Team"} ({trip.createdByRole || "member"})
                            </div>
                            {trip.notes ? <div className="mt-2 text-sm text-white/80 whitespace-pre-wrap">{trip.notes}</div> : null}
                          </div>
                          {canUploadDayTrips ? (
                            <button
                              type="button"
                              onClick={() => deleteDayTrip(trip.id)}
                              className="rounded-xl bg-rose-500/15 ring-1 ring-rose-500/25 px-3 py-2 text-xs font-semibold text-rose-200 hover:bg-rose-500/20"
                            >
                              Remove
                            </button>
                          ) : null}
                        </div>

                        {(trip.media || []).length ? (
                          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {(trip.media || []).map((m) => {
                              const isVideo = m.type?.startsWith("video/");
                              return (
                                <div key={m.id} className="overflow-hidden rounded-2xl bg-black ring-1 ring-white/10">
                                  <div className="aspect-square">
                                    {isVideo ? <video src={m.url} className="h-full w-full object-cover" controls playsInline /> : <img src={m.url} alt={m.name} className="h-full w-full object-cover" />}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="mt-2 text-sm text-white/60">No media uploaded for this trip.</div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-3xl bg-white/5 ring-1 ring-white/10 p-4 text-sm text-white/70">
                      No day trips yet. Add a skate park trip and upload photos from that day.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : null}

          {ui.view === "team" ? (
            <motion.div key="team" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-4">
              <div className="rounded-3xl bg-white/5 ring-1 ring-white/10 p-5 sm:p-7">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs tracking-widest text-white/50">ACCESS</div>
                    <div className="mt-1 text-xl font-extrabold">Coach + Dad</div>
                    <div className="mt-2 text-sm text-white/60">Owner can manage team + profiles.</div>
                  </div>
                </div>

                {canManageTeam ? (
                  <div className="mt-5 rounded-3xl bg-black/30 ring-1 ring-white/10 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold">Manage Team</div>
                        <div className="text-xs text-white/60">Photos • Roles • PINs</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const name = prompt("Member name:");
                          if (!name) return;
                          const role = (prompt("Role (owner/coach/dad):", "dad") || "dad").trim();
                          const pin = (prompt("Set PIN (required, min 4):", "") || "").trim();
                          if (pin.length < 4) {
                            alert("PIN must be at least 4 characters.");
                            return;
                          }
                          const m = { id: `m-${uid()}`, name: name.trim(), role: role || "dad", pin, photoUrl: "" };
                          setSlice({ members: [...members, m] });
                          toast("Member added", `${m.name} (${m.role}) added.`, "success");
                        }}
                        className="rounded-2xl bg-white text-black px-4 py-2 text-sm font-bold hover:bg-white/90"
                      >
                        <Plus className="h-4 w-4 inline-block mr-2" /> Add Member
                      </button>
                    </div>

                    <div className="mt-4 space-y-2">
                      {members.map((m) => (
                        <div key={m.id} className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-3">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="h-12 w-12 overflow-hidden rounded-2xl ring-1 ring-white/10 bg-black">
                                {m.photoUrl ? <img src={m.photoUrl} alt={m.name} className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-xs text-white/50">IMG</div>}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-bold truncate">{m.name}</div>
                                <div className="text-xs text-white/60 mt-1">Role: {m.role} • PIN: {m.pin ? "set" : "missing"}</div>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <label className="cursor-pointer rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/10">
                                Photo
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadMemberPhoto(m, e.target.files?.[0])} />
                              </label>

                              <button
                                type="button"
                                onClick={() => renameMember(m)}
                                className="rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/10"
                              >
                                Rename
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  const nextRole = prompt("Role (owner/coach/dad):", m.role);
                                  if (!nextRole) return;
                                  setSlice({ members: members.map((x) => (x.id === m.id ? { ...x, role: nextRole.trim() } : x)) });
                                  toast("Role updated", `${m.name} → ${nextRole.trim()}`, "info");
                                }}
                                className="rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/10"
                              >
                                Change Role
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  const nextPin = prompt("Set/Change PIN (min 4):", m.pin || "");
                                  if (nextPin == null) return;
                                  const v = String(nextPin).trim();
                                  if (v.length < 4) {
                                    alert("PIN must be at least 4 characters.");
                                    return;
                                  }
                                  setSlice({ members: members.map((x) => (x.id === m.id ? { ...x, pin: v } : x)) });
                                  toast("PIN updated", `${m.name} PIN updated.`, "success");
                                }}
                                className="rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/10"
                              >
                                Set PIN
                              </button>

                              {members.length > 1 && m.role !== "owner" ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!confirm(`Remove ${m.name}?`)) return;
                                    setSlice({ members: members.filter((x) => x.id !== m.id) });
                                    if (ui.activeMemberId === m.id) setUI({ activeMemberId: members[0]?.id || "m-1" });
                                    toast("Member removed", `${m.name} removed.`, "warn");
                                  }}
                                  className="rounded-xl bg-rose-500/15 ring-1 ring-rose-500/20 px-3 py-2 text-xs font-semibold hover:bg-rose-500/20 text-rose-200"
                                >
                                  Remove
                                </button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mt-5 rounded-3xl bg-black/30 ring-1 ring-white/10 p-4 text-white/70">Only the <span className="font-bold text-white">Owner</span> can manage the team.</div>
                )}

                <div className="mt-5 rounded-3xl bg-black/30 ring-1 ring-white/10 p-4">
                  <div className="text-sm font-semibold">Skater Profiles</div>
                  <div className="mt-3 space-y-2">
                    {skaters.map((s) => (
                      <div key={s.id} className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-3">
                        <div className="flex items-center gap-3">
                          <div className="h-20 w-20 overflow-hidden rounded-3xl ring-1 ring-white/10 bg-black">
                            {s.photoUrl ? <img src={s.photoUrl} alt={s.name} className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-xs text-white/50">IMG</div>}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-bold">{s.name}</div>
                            <div className="text-xs text-white/60">Sessions: {sessions.filter((x) => x.skaterId === s.id).length}</div>
                            <div className="text-xs text-white/60">XP: {xpBySkaterId[s.id] || 0}</div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <label className="cursor-pointer rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/10">
                              Photo
                              <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadSkaterPhoto(s, e.target.files?.[0])} />
                            </label>
                            <button type="button" onClick={() => renameSkater(s)} className="rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/10">
                              Rename
                            </button>
                            {skaters.length > 1 ? (
                              <button type="button" onClick={() => deleteSkater(s)} className="rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/10">
                                Delete
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3">
                    <button type="button" onClick={addSkater} className="rounded-2xl bg-gradient-to-r from-cyan-400 to-emerald-300 text-black px-4 py-2 text-sm font-extrabold hover:opacity-95">
                      <Plus className="h-4 w-4 inline-block mr-2" /> Add Skater
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : null}

          {ui.view === "chat" ? (
            <motion.div key="chat" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-4">
              <div className="rounded-3xl bg-gradient-to-br from-zinc-950 via-black to-zinc-900 p-5 sm:p-7 shadow-2xl ring-1 ring-white/10">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs tracking-widest text-white/50">TEAM CHAT</div>
                    <div className="mt-1 text-xl font-extrabold">{activeSkater?.name || "Skater"} Chat</div>
                    <div className="mt-2 text-sm text-white/60">Local-only chat on this device.</div>
                  </div>
                  <Pill tone="neutral">
                    <MessageSquare className="h-3.5 w-3.5" /> {activeChat.length}
                  </Pill>
                </div>

                <div className="mt-5 rounded-3xl bg-black/30 ring-1 ring-white/10 p-4">
                  <div className="flex gap-2">
                    <input
                      className="flex-1 rounded-2xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                      placeholder="Type a message…"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          sendChatMessage(e.currentTarget.value);
                          e.currentTarget.value = "";
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        const input = e.currentTarget.parentElement?.querySelector("input");
                        if (!input) return;
                        sendChatMessage(input.value);
                        input.value = "";
                      }}
                      className="rounded-2xl bg-white text-black px-4 py-2 text-sm font-bold hover:bg-white/90"
                    >
                      Send
                    </button>
                  </div>

                  <div className="mt-4 space-y-2">
                    {activeChat.length ? (
                      activeChat.map((m) => (
                        <div key={m.id} className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-xs text-white/60">
                              <span className="font-bold text-white">{m.by || ""}</span> • {m.role || ""}
                            </div>
                            <div className="text-[11px] text-white/40">{new Date(m.at).toLocaleString()}</div>
                          </div>
                          <div className="mt-1 text-sm text-white/80 whitespace-pre-wrap">{m.text}</div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-white/60">No messages yet. Start the thread.</div>
                    )}
                  </div>

                  {activeChat.length ? (
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => {
                          if (!confirm("Clear chat for this skater on this device?")) return;
                          setSlice({ chatBySkaterId: { ...chatBySkaterId, [ui.activeSkaterId]: [] } });
                          toast("Chat cleared", "This device chat history was cleared.", "warn");
                        }}
                        className="rounded-2xl bg-white/5 ring-1 ring-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/10"
                      >
                        Clear Chat
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="mt-6 text-xs text-white/40">Local-first build. For real sharing across devices: add Firebase (Auth + Firestore + Storage).</div>
      </div>
    </div>
  );
}

function SessionCard({ session, onDelete, canComment, onAddComment, onSetMediaComment }) {
  const completionPct = pct(session.totalCompleted || 0, session.totalTarget || 1);
  const tier = getCardTier(completionPct);
  const ovr = computeOVR(session);
  const hero = pickHeroMedia(session.media || []);
  const [commentText, setCommentText] = useState("");

  return (
    <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-950 via-black to-zinc-900 p-4 shadow-2xl ring-1 ${tier.ring}`}>
      <div className="absolute right-3 top-3 z-20 rounded-xl bg-black/80 px-3 py-1 text-sm font-extrabold text-white ring-1 ring-white/10">{ovr} OVR</div>
      <div className="absolute left-3 top-3 z-20 rounded-xl bg-black/80 px-3 py-1 text-sm font-extrabold text-white ring-1 ring-white/10">
        +{session.xpGained ?? 0} XP
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.10),transparent_40%)] pointer-events-none" />
      {tier.label === "LEGENDARY" ? (
        <motion.div
          className="absolute inset-0 pointer-events-none mix-blend-screen opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(115deg, rgba(255,255,255,0.05) 15%, rgba(244,208,63,0.45) 35%, rgba(56,189,248,0.35) 55%, rgba(255,255,255,0.05) 75%)",
            backgroundSize: "220% 220%",
          }}
          animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "linear" }}
        />
      ) : null}

      <div className="relative z-10">
        {hero ? (
          <div className="mb-3 overflow-hidden rounded-2xl ring-1 ring-white/10 bg-black">
            <div className="aspect-video w-full">
              {hero.type?.startsWith("video/") ? (
                <video className="h-full w-full object-cover" src={hero.url} controls playsInline />
              ) : (
                <img className="h-full w-full object-cover" src={hero.url} alt={hero.name || "media"} />
              )}
            </div>
          </div>
        ) : null}

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs tracking-widest text-white/50">
              SESSION CARD • <span className={`${tier.color} font-extrabold`}>{tier.label}</span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              {session.skaterPhotoUrl ? (
                <div className="h-12 w-12 overflow-hidden rounded-2xl ring-1 ring-white/10 bg-black">
                  <img src={session.skaterPhotoUrl} alt={session.skaterName} className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="h-12 w-12 overflow-hidden rounded-2xl ring-1 ring-white/10 bg-black flex items-center justify-center text-xs text-white/50">IMG</div>
              )}
              <div className="min-w-0">
                <div className="text-lg font-extrabold tracking-tight truncate">{session.dayType}</div>
                <div className="mt-0.5 text-xs text-white/60 truncate">
                  {session.date} • {session.park || "Unknown Park"} • {session.skaterName}
                </div>
              </div>
            </div>
          </div>

          <button type="button" onClick={onDelete} className="rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/10" title="Delete">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <Stat label="TOTAL REPS" value={`${session.totalCompleted} / ${session.totalTarget}`} tone="neutral" />
          <Stat label="FREE PLAY" value={session.freePlayEarned ? "YES" : "NO"} tone={session.freePlayEarned ? "good" : "bad"} />
          <Stat label="SCORE" value={`${completionPct}%`} tone="cyan" />
        </div>

        {(session.media || []).length ? (
          <div className="mt-4">
            <div className="text-xs tracking-widest text-white/50">MEDIA</div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(session.media || []).slice(0, 4).map((m) => {
                const isVideo = m.type?.startsWith("video/");
                return (
                  <div key={m.id} className="rounded-2xl overflow-hidden bg-black ring-1 ring-white/10">
                    <div className="aspect-square">
                      {isVideo ? (
                        <video src={m.url} className="h-full w-full object-cover" controls playsInline />
                      ) : (
                        <img src={m.url} alt={m.name} className="h-full w-full object-cover" />
                      )}
                    </div>
                    {canComment ? (
                      <div className="p-2 bg-black/60 ring-1 ring-white/10">
                        <div className="text-[11px] text-white/60">Coach note</div>
                        <input
                          value={m.comment || ""}
                          onChange={(e) => onSetMediaComment?.(m.id, e.target.value)}
                          placeholder="Add comment…"
                          className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-2 py-1 text-xs"
                        />
                      </div>
                    ) : m.comment ? (
                      <div className="p-2 text-xs text-white/70">{m.comment}</div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="mt-4 rounded-2xl bg-white/5 ring-1 ring-white/10 p-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold inline-flex items-center gap-2">
              <MessageSquare className="h-4 w-4" /> Coach Comments
            </div>
            <Pill tone="neutral">{(session.comments || []).length}</Pill>
          </div>

          {canComment ? (
            <div className="mt-3 flex gap-2">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a note…"
                className="flex-1 rounded-2xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => {
                  const t = commentText.trim();
                  if (!t) return;
                  onAddComment?.(t);
                  setCommentText("");
                }}
                className="rounded-2xl bg-white text-black px-4 py-2 text-sm font-bold hover:bg-white/90"
              >
                Add
              </button>
            </div>
          ) : null}

          {(session.comments || []).length ? (
            <div className="mt-3 space-y-2">
              {(session.comments || []).slice(0, 3).map((c) => (
                <div key={c.id} className="rounded-2xl bg-black/30 ring-1 ring-white/10 p-2">
                  <div className="text-xs text-white/60">
                    {c.by} ({c.role})
                  </div>
                  <div className="text-sm">{c.text}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-2 text-sm text-white/60">No comments yet.</div>
          )}
        </div>

        <div className="mt-3 text-xs text-white/50">Created by {session.createdBy} ({session.createdByRole})</div>
      </div>
    </div>
  );
}

function ProgressCard({ card, skater }) {
  const meta = card.meta || card.park || "";
  const dateLabel = formatShortDate(card.date || todayISO());

  const spec =
    card.type === "achievement"
      ? {
          tag: card.achievementKind === "newtrick" ? "ACHIEVEMENT • NEW TRICK" : "ACHIEVEMENT",
          accent: "from-red-600/40 via-orange-500/20 to-transparent",
          ring: "ring-red-500/35",
          sticker: "bg-white/90 text-black ring-white/60",
          title: "text-red-100",
        }
      : card.type === "levelup"
      ? {
          tag: "LEVEL UP",
          accent: "from-fuchsia-500/35 via-rose-500/20 to-transparent",
          ring: "ring-fuchsia-500/30",
          sticker: "bg-fuchsia-500/20 text-fuchsia-100 ring-fuchsia-400/30",
          title: "text-fuchsia-100",
        }
      : card.type === "newtrick"
      ? {
          tag: "NEW TRICK",
          accent: "from-emerald-500/30 via-cyan-500/15 to-transparent",
          ring: "ring-emerald-500/30",
          sticker: "bg-emerald-500/20 text-emerald-100 ring-emerald-400/30",
          title: "text-emerald-50",
        }
      : {
          tag: "WEEKLY",
          accent: "from-cyan-500/30 via-sky-500/15 to-transparent",
          ring: "ring-cyan-500/30",
          sticker: "bg-cyan-500/20 text-cyan-100 ring-cyan-400/30",
          title: "text-white",
        };

  return (
    <div className={"relative overflow-hidden rounded-[28px] bg-gradient-to-br from-zinc-950 via-black to-zinc-900 shadow-2xl ring-1 " + spec.ring}>
      <div className={`absolute inset-0 bg-gradient-to-br ${spec.accent} pointer-events-none`} />
      <div className="absolute inset-0 opacity-[0.12] pointer-events-none bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.35),transparent_38%),radial-gradient(circle_at_80%_30%,rgba(255,255,255,0.18),transparent_42%),radial-gradient(circle_at_40%_90%,rgba(255,255,255,0.12),transparent_45%)]" />
      <div className="absolute inset-0 pointer-events-none opacity-[0.10] bg-[linear-gradient(transparent_0,transparent_6px,rgba(255,255,255,0.05)_6px,rgba(255,255,255,0.05)_7px)] bg-[length:100%_10px]" />

      <div className="relative z-10 px-4 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] font-extrabold tracking-[0.28em] text-white/60">SKATEFLOW • {spec.tag}</div>
            <div className={`mt-1 text-xl font-extrabold tracking-tight ${spec.title}`}>{card.title}</div>
            <div className="mt-1 text-sm text-white/70 truncate">{card.subtitle}</div>
          </div>

          <div className="text-right">
            <div className={`inline-flex items-center gap-2 rounded-2xl px-3 py-1 text-sm font-extrabold ring-1 ${spec.sticker}`}>{card.badge}</div>
            <div className="mt-2 text-[11px] text-white/55">{dateLabel}</div>
          </div>
        </div>
      </div>

      {card.media ? (
        <div className="relative z-10 mt-4 px-4">
          <div className="overflow-hidden rounded-2xl ring-1 ring-white/10 bg-black">
            <div className="aspect-video w-full">
              {card.media.type?.startsWith("video/") ? (
                <video className="h-full w-full object-cover" src={card.media.url} controls playsInline />
              ) : (
                <img className="h-full w-full object-cover" src={card.media.url} alt={card.media.name || "media"} />
              )}
            </div>
          </div>
        </div>
      ) : null}

      <div className="relative z-10 mt-4 px-4 pb-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-black/35 p-3 ring-1 ring-white/10">
            <div className="text-[11px] text-white/60">SKATER</div>
            <div className="mt-1 text-sm font-extrabold truncate">{skater?.name || "—"}</div>
          </div>
          <div className="rounded-2xl bg-black/35 p-3 ring-1 ring-white/10">
            <div className="text-[11px] text-white/60">SCORE</div>
            <div className="mt-1 text-sm font-extrabold text-cyan-200">{card.pct ?? 0}%</div>
          </div>
          <div className="rounded-2xl bg-black/35 p-3 ring-1 ring-white/10">
            <div className="text-[11px] text-white/60">DETAIL</div>
            <div className="mt-1 text-sm font-extrabold truncate">{meta || "—"}</div>
          </div>
        </div>

        {typeof card.ovr === "number" ? (
          <div className="mt-3 flex items-center justify-between">
            <div className="text-xs text-white/55">Best OVR</div>
            <div className="rounded-xl bg-black/60 ring-1 ring-white/10 px-3 py-1 text-sm font-extrabold">{card.ovr}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
