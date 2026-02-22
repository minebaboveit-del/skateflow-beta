import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  Bell,
  Calendar,
  Check,
  CloudSun,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Crown,
  Download,
  ExternalLink,
  Flame,
  Image as ImageIcon,
  LayoutGrid,
  Lock,
  LogIn,
  MapPin,
  MessageSquare,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Share2,
  Settings,
  Trash2,
  Trophy,
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

const DEFAULT_PARK_PROFILES = [
  { id: "park-harbor", name: "Harbor City Skate Park", location: "Harbor City, CA", lat: 33.7903, lon: -118.2987, notes: "Concrete • street + transition" },
  { id: "park-vans", name: "Vans Off The Wall Skatepark", location: "Huntington Beach, CA", lat: 33.6589, lon: -117.9988, notes: "Concrete • street + bowl" },
  { id: "park-channel", name: "Channel Street Skatepark", location: "San Pedro, CA", lat: 33.7174, lon: -118.2812, notes: "DIY concrete • transition + street" },
];

const DEFAULT_CLOUD_SYNC = {
  enabled: false,
  provider: "firebase-firestore-rest",
  projectId: "skaterflow",
  apiKey: "AIzaSyB8vZjXkvtNXojiI1woP6S-K-JFL87PaB0",
  documentPath: "skateflow/sharedState",
  autoSyncEnabled: false,
  autoSyncIntervalMin: 3,
  autoPullOnLoad: true,
  lastSyncAt: "",
  lastDirection: "",
};

function createDefaultBetaCheck() {
  return { checkedById: {}, notesById: {}, updatedAt: "" };
}

const INITIAL_STORE = {
  members: [
    { id: "m-1", name: "Myisha", role: "owner", pin: "", photoUrl: "", biometricCredentialId: "" },
    { id: "m-2", name: "Coach", role: "coach", pin: "", photoUrl: "", biometricCredentialId: "" },
    { id: "m-3", name: "Dad", role: "dad", pin: "", photoUrl: "", biometricCredentialId: "" },
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
  draft: { date: todayISO(), park: "", dayType: Object.keys(DEFAULT_PLANS)[0], completedByTaskId: {}, missedByTaskId: {} },
  auth: { loggedInMemberId: null },
  ui: { view: "log", activeMemberId: "m-1", activeSkaterId: "s-1" },
  contestBySkaterId: {},
  coachCornerBySkaterId: {},
  skateDaysBySkaterId: {},
  parkProfiles: DEFAULT_PARK_PROFILES,
  parkPrefsBySkaterId: {},
  appPrefs: { theme: "dark" },
  cloudSync: DEFAULT_CLOUD_SYNC,
  betaCheck: createDefaultBetaCheck(),
};

const VALID_VIEWS = new Set(["log", "cards", "calendar", "dash", "plans", "coach", "skateday", "contest", "team", "chat", "settings"]);
const MAX_UPLOAD_COUNT = 24;
const MAX_MEDIA_FILE_BYTES = 80 * 1024 * 1024;
const MAX_IMAGE_FILE_BYTES = 25 * 1024 * 1024;
const MAX_BACKUP_BYTES = 8 * 1024 * 1024;
const MAX_ICS_BYTES = 2 * 1024 * 1024;
const MAX_EMBEDDED_MEDIA_BYTES = 2 * 1024 * 1024;
const BUILD_STAMP = "beta-2026-02-22-1";

const BETA_CHECK_ITEMS = [
  { id: "login", label: "Login and member switching", detail: "PIN login works for owner/coach/dad." },
  { id: "log_session", label: "Log and save session", detail: "Session saves with reps and scores." },
  { id: "media_upload", label: "Media upload", detail: "Photo/video upload works in Log and Cards." },
  { id: "media_trim", label: "Video trim/edit", detail: "Trim tool saves updated clip." },
  { id: "contest", label: "Contest run tracking", detail: "Runs, tricks, song, and media save correctly." },
  { id: "skate_day", label: "Skate Day tab", detail: "Day trip entry and media save correctly." },
  { id: "chat", label: "Team chat", detail: "Chat send/clear works for active skater." },
  { id: "cloud_sync", label: "Cloud sync", detail: "Push/Pull and auto sync work across devices." },
  { id: "ios_pwa", label: "iPhone home screen", detail: "App opens from Add to Home Screen." },
  { id: "light_mode", label: "Light mode readability", detail: "Text/buttons remain readable in light mode." },
];

function isPlainObject(v) {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function toObj(v, fallback = {}) {
  return isPlainObject(v) ? v : fallback;
}

function toArray(v) {
  return Array.isArray(v) ? v : [];
}

function cloudSafeDocPath(path) {
  const cleaned = String(path || DEFAULT_CLOUD_SYNC.documentPath)
    .split("/")
    .map((x) => x.trim())
    .filter(Boolean);
  if (!cleaned.length) return DEFAULT_CLOUD_SYNC.documentPath;
  if (cleaned.length % 2 !== 0) cleaned.push("state");
  return cleaned.join("/");
}

function parkIdentityKey(name, location = "") {
  return `${String(name || "").trim().toLowerCase()}|${String(location || "").trim().toLowerCase()}`;
}

function normalizeFirebaseProjectId(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");
}

function buildFirestoreDocUrl(config) {
  const projectId = normalizeFirebaseProjectId(config?.projectId);
  const apiKey = String(config?.apiKey || "").trim();
  const path = cloudSafeDocPath(config?.documentPath);
  if (!projectId || !apiKey) return "";
  const encodedPath = path.split("/").map((x) => encodeURIComponent(x)).join("/");
  return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/${encodedPath}?key=${encodeURIComponent(apiKey)}`;
}

function makeCloudSafeMedia(media) {
  const dataUrl = String(media?.dataUrl || "");
  const rawUrl = String(media?.url || "");
  const safeUrl = rawUrl.startsWith("blob:") ? "" : rawUrl;
  return {
    ...media,
    dataUrl,
    url: dataUrl ? "" : safeUrl,
  };
}

function makeCloudSafeStoreShape(inputStore) {
  const normalized = normalizeStoreShape(inputStore);
  const withSafeMedia = {
    ...normalized,
    cloudSync: {
      ...DEFAULT_CLOUD_SYNC,
      ...toObj(normalized.cloudSync, {}),
      apiKey: "",
      enabled: !!normalized?.cloudSync?.enabled,
      autoSyncEnabled: !!normalized?.cloudSync?.autoSyncEnabled,
      autoPullOnLoad: normalized?.cloudSync?.autoPullOnLoad !== false,
      autoSyncIntervalMin: Math.max(1, Number(normalized?.cloudSync?.autoSyncIntervalMin) || DEFAULT_CLOUD_SYNC.autoSyncIntervalMin),
      documentPath: cloudSafeDocPath(normalized?.cloudSync?.documentPath),
    },
    sessions: toArray(normalized.sessions).map((s) => ({
      ...s,
      media: toArray(s.media).map(makeCloudSafeMedia),
    })),
    coachCornerBySkaterId: Object.fromEntries(
      Object.entries(toObj(normalized.coachCornerBySkaterId, {})).map(([k, list]) => [
        k,
        toArray(list).map((item) => ({
          ...item,
          media: toArray(item?.media).map(makeCloudSafeMedia),
        })),
      ])
    ),
    contestBySkaterId: Object.fromEntries(
      Object.entries(toObj(normalized.contestBySkaterId, {})).map(([k, state]) => [
        k,
        {
          ...toObj(state, {}),
          runs: toArray(state?.runs).map((r) => ({
            ...r,
            media: toArray(r?.media).map(makeCloudSafeMedia),
          })),
        },
      ])
    ),
    skateDaysBySkaterId: Object.fromEntries(
      Object.entries(toObj(normalized.skateDaysBySkaterId, {})).map(([k, list]) => [
        k,
        toArray(list).map((d) => ({
          ...d,
          media: toArray(d?.media).map(makeCloudSafeMedia),
        })),
      ])
    ),
  };
  return withSafeMedia;
}

function safeRevokeObjectURL(url) {
  if (!url || typeof url !== "string" || !url.startsWith("blob:")) return;
  try {
    URL.revokeObjectURL(url);
  } catch {
    // ignore
  }
}

function isLikelyIOSDevice() {
  if (typeof navigator === "undefined") return false;
  const ua = String(navigator.userAgent || "");
  const platform = String(navigator.platform || "");
  return /iPad|iPhone|iPod/i.test(ua) || (platform === "MacIntel" && Number(navigator.maxTouchPoints || 0) > 1);
}

async function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function fileToDataUrl(file) {
  if (!file) return "";
  return blobToDataUrl(file);
}

function bytesToBase64Url(bytes) {
  const bin = String.fromCharCode(...bytes);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function arrayBufferToBase64Url(buf) {
  return bytesToBase64Url(new Uint8Array(buf));
}

function base64UrlToArrayBuffer(input) {
  const normalized = String(input || "")
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(String(input || "").length / 4) * 4, "=");
  const bin = atob(normalized);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

function sanitizePin(value) {
  const normalized = String(value || "")
    .replace(/[０-９]/g, (d) => String(d.charCodeAt(0) - 0xff10))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
  return normalized.replace(/\D/g, "").slice(0, 4);
}

function normalizeExternalUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : /^[\w.-]+\.[a-z]{2,}(?:\/.*)?$/i.test(raw) ? `https://${raw}` : raw;
  try {
    const parsed = new URL(withProtocol);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return raw;
    return parsed.toString();
  } catch {
    return raw;
  }
}

function isOpenableExternalUrl(value) {
  try {
    const parsed = new URL(String(value || ""));
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function musicProviderLabelFromUrl(value) {
  const url = String(value || "").toLowerCase();
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "YouTube";
  if (url.includes("music.apple.com") || url.includes("itunes.apple.com")) return "Apple Music";
  return "Music link";
}

function buildMusicSearchUrl(provider, query) {
  const q = String(query || "").trim();
  if (!q) return "";
  if (provider === "youtube") return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
  if (provider === "apple") return `https://music.apple.com/us/search?term=${encodeURIComponent(q)}`;
  return "";
}

function getBiometricUnavailableReason() {
  if (typeof window === "undefined") return "Biometric login is unavailable in this environment.";
  if (!window.PublicKeyCredential || !navigator.credentials) return "Biometric login is not supported on this device/browser.";
  if (!window.isSecureContext) return "Face/Fingerprint needs HTTPS (or localhost). Open the app on a secure URL.";
  return "";
}

function guardUploadFiles(fileList, opts = {}) {
  const maxCount = Math.max(1, Number(opts.maxCount) || MAX_UPLOAD_COUNT);
  const maxBytes = Math.max(1, Number(opts.maxBytes) || MAX_MEDIA_FILE_BYTES);
  const allowedPrefixes = Array.isArray(opts.allowedPrefixes) && opts.allowedPrefixes.length ? opts.allowedPrefixes : ["image/", "video/"];
  const all = Array.from(fileList || []);
  const files = all.slice(0, maxCount);
  const stats = { trimmed: Math.max(0, all.length - files.length), tooLarge: 0, wrongType: 0 };
  const valid = [];

  for (const f of files) {
    const okType = allowedPrefixes.some((p) => String(f?.type || "").startsWith(p));
    if (!okType) {
      stats.wrongType += 1;
      continue;
    }
    if ((Number(f?.size) || 0) > maxBytes) {
      stats.tooLarge += 1;
      continue;
    }
    valid.push(f);
  }

  return { valid, stats };
}

function normalizeStoreShape(raw) {
  const src = toObj(raw, {});
  const plans = toObj(src.plans, DEFAULT_PLANS);
  const members = toArray(src.members)
    .map((m) => ({
      id: String(m?.id || `m-${uid()}`),
      name: String(m?.name || "Member"),
      role: String(m?.role || "dad"),
      pin: sanitizePin(m?.pin || ""),
      photoUrl: String(m?.photoUrl || ""),
      biometricCredentialId: String(m?.biometricCredentialId || ""),
    }))
    .filter((m) => m.id);
  const skaters = toArray(src.skaters)
    .map((s) => ({
      id: String(s?.id || `s-${uid()}`),
      name: String(s?.name || "Skater"),
      photoUrl: String(s?.photoUrl || ""),
    }))
    .filter((s) => s.id);

  const sessions = toArray(src.sessions).map((s) => {
    const tasks = toArray(s?.tasks).map((t) => ({
      taskId: String(t?.taskId || `t-${uid()}`),
      label: String(t?.label || ""),
      target: Math.max(0, Number(t?.target) || 0),
      completed: Math.max(0, Number(t?.completed) || 0),
      missed: Math.max(0, Number(t?.missed) || 0),
      notes: String(t?.notes || ""),
    }));
    return {
      ...toObj(s, {}),
      id: String(s?.id || `sess-${uid()}`),
      skaterId: String(s?.skaterId || skaters[0]?.id || ""),
      skaterName: String(s?.skaterName || skaters[0]?.name || ""),
      date: String(s?.date || todayISO()),
      dayType: String(s?.dayType || Object.keys(plans)[0] || "Grind Day"),
      park: String(s?.park || ""),
      tasks,
      totalTarget: Math.max(0, Number(s?.totalTarget) || tasks.reduce((sum, t) => sum + (Number(t.target) || 0), 0)),
      totalCompleted: Math.max(0, Number(s?.totalCompleted) || tasks.reduce((sum, t) => sum + (Number(t.completed) || 0), 0)),
      freePlayEarned: !!s?.freePlayEarned,
      media: toArray(s?.media).map((m) => ({
        id: String(m?.id || `m-${uid()}`),
        type: String(m?.type || ""),
        name: String(m?.name || ""),
        size: Math.max(0, Number(m?.size) || 0),
        url: String(m?.url || ""),
        dataUrl: String(m?.dataUrl || ""),
        comment: String(m?.comment || ""),
      })),
      comments: toArray(s?.comments).map((c) => ({
        id: String(c?.id || `c-${uid()}`),
        by: String(c?.by || ""),
        role: String(c?.role || ""),
        text: String(c?.text || ""),
        at: String(c?.at || new Date().toISOString()),
      })),
      createdAt: String(s?.createdAt || new Date().toISOString()),
      createdBy: String(s?.createdBy || ""),
      createdByRole: String(s?.createdByRole || ""),
      xpGained: Math.max(0, Number(s?.xpGained) || 0),
      xpTotalAfter: Number.isFinite(Number(s?.xpTotalAfter)) ? Math.max(0, Number(s?.xpTotalAfter)) : "",
    };
  });
  const parkProfiles = toArray(src.parkProfiles)
    .map((p) => ({
      id: String(p?.id || `park-${uid()}`),
      name: String(p?.name || "").trim(),
      location: String(p?.location || "").trim(),
      lat: Number.isFinite(Number(p?.lat)) ? Number(p.lat) : null,
      lon: Number.isFinite(Number(p?.lon)) ? Number(p.lon) : null,
      notes: String(p?.notes || "").trim(),
    }))
    .map((p) => {
      // Migration: fix old Harbor profile saved with incorrect city.
      if (p.id === "park-harbor" && String(p.location || "").toLowerCase() === "anaheim, ca") {
        return {
          ...p,
          name: "Harbor City Skate Park",
          location: "Harbor City, CA",
          lat: 33.7903,
          lon: -118.2987,
        };
      }
      return p;
    })
    .filter((p) => p.id && p.name);
  const parkPrefsRaw = toObj(src.parkPrefsBySkaterId, {});
  const parkPrefsBySkaterId = Object.fromEntries(
    Object.entries(parkPrefsRaw)
      .map(([k, v]) => [String(k || ""), String(v || "")])
      .filter(([k, v]) => k && v)
  );
  const skateDaysBySkaterId = Object.fromEntries(
    Object.entries(toObj(src.skateDaysBySkaterId, {}))
      .map(([skaterId, list]) => [
        String(skaterId || ""),
        toArray(list).map((d) => ({
          id: String(d?.id || `sd-${uid()}`),
          title: String(d?.title || "Skate Day"),
          dateISO: String(d?.dateISO || todayISO()),
          park: String(d?.park || ""),
          notes: String(d?.notes || ""),
          withCoach: d?.withCoach !== false,
          withSkater: d?.withSkater !== false,
          createdBy: String(d?.createdBy || ""),
          createdAt: String(d?.createdAt || new Date().toISOString()),
          media: toArray(d?.media).map((m) => ({
            id: String(m?.id || `sdm-${uid()}`),
            type: String(m?.type || ""),
            name: String(m?.name || ""),
            size: Math.max(0, Number(m?.size) || 0),
            url: String(m?.url || ""),
            dataUrl: String(m?.dataUrl || ""),
          })),
        })),
      ])
      .filter(([k]) => k)
  );

  const merged = {
    ...INITIAL_STORE,
    ...src,
    members: members.length ? members : INITIAL_STORE.members,
    skaters: skaters.length ? skaters : INITIAL_STORE.skaters,
    plans,
    sessions,
    chatBySkaterId: toObj(src.chatBySkaterId, {}),
    practiceEvents: toArray(src.practiceEvents),
    xpBySkaterId: toObj(src.xpBySkaterId, {}),
    xpMilestonesBySkaterId: toObj(src.xpMilestonesBySkaterId, {}),
    contestBySkaterId: toObj(src.contestBySkaterId, {}),
    coachCornerBySkaterId: toObj(src.coachCornerBySkaterId, {}),
    skateDaysBySkaterId,
    parkProfiles: parkProfiles.length ? parkProfiles : INITIAL_STORE.parkProfiles,
    parkPrefsBySkaterId,
    practiceSettings: {
      ...INITIAL_STORE.practiceSettings,
      ...toObj(src.practiceSettings, {}),
      durationMin: Math.max(5, Number(src?.practiceSettings?.durationMin) || INITIAL_STORE.practiceSettings.durationMin),
      remindMin: Math.max(0, Number(src?.practiceSettings?.remindMin) || INITIAL_STORE.practiceSettings.remindMin),
      title: String(src?.practiceSettings?.title || INITIAL_STORE.practiceSettings.title),
    },
    reminders: {
      ...INITIAL_STORE.reminders,
      ...toObj(src.reminders, {}),
      enabled: !!src?.reminders?.enabled,
      time: String(src?.reminders?.time || INITIAL_STORE.reminders.time),
    },
    draft: {
      ...INITIAL_STORE.draft,
      ...toObj(src.draft, {}),
      date: String(src?.draft?.date || todayISO()),
      park: String(src?.draft?.park || ""),
      dayType: String(src?.draft?.dayType || Object.keys(plans)[0] || "Grind Day"),
      completedByTaskId: toObj(src?.draft?.completedByTaskId, {}),
      missedByTaskId: toObj(src?.draft?.missedByTaskId, {}),
    },
    auth: {
      ...INITIAL_STORE.auth,
      ...toObj(src.auth, {}),
      loggedInMemberId: src?.auth?.loggedInMemberId ? String(src.auth.loggedInMemberId) : null,
    },
    ui: {
      ...INITIAL_STORE.ui,
      ...toObj(src.ui, {}),
      activeMemberId: String(src?.ui?.activeMemberId || members[0]?.id || INITIAL_STORE.ui.activeMemberId),
      activeSkaterId: String(src?.ui?.activeSkaterId || skaters[0]?.id || INITIAL_STORE.ui.activeSkaterId),
      view: VALID_VIEWS.has(String(src?.ui?.view || "")) ? String(src.ui.view) : INITIAL_STORE.ui.view,
    },
    appPrefs: {
      ...INITIAL_STORE.appPrefs,
      ...toObj(src.appPrefs, {}),
      theme: String(src?.appPrefs?.theme) === "light" ? "light" : "dark",
    },
    cloudSync: {
      ...DEFAULT_CLOUD_SYNC,
      ...toObj(src.cloudSync, {}),
      enabled: !!src?.cloudSync?.enabled,
      provider: DEFAULT_CLOUD_SYNC.provider,
      projectId: normalizeFirebaseProjectId(src?.cloudSync?.projectId || DEFAULT_CLOUD_SYNC.projectId),
      apiKey: String(src?.cloudSync?.apiKey || DEFAULT_CLOUD_SYNC.apiKey),
      documentPath: cloudSafeDocPath(src?.cloudSync?.documentPath),
      autoSyncEnabled: !!src?.cloudSync?.autoSyncEnabled,
      autoPullOnLoad: src?.cloudSync?.autoPullOnLoad !== false,
      autoSyncIntervalMin: Math.max(1, Number(src?.cloudSync?.autoSyncIntervalMin) || DEFAULT_CLOUD_SYNC.autoSyncIntervalMin),
      lastSyncAt: String(src?.cloudSync?.lastSyncAt || ""),
      lastDirection: ["push", "pull"].includes(String(src?.cloudSync?.lastDirection || ""))
        ? String(src.cloudSync.lastDirection)
        : "",
    },
    betaCheck: {
      ...createDefaultBetaCheck(),
      ...toObj(src.betaCheck, {}),
      checkedById: toObj(src?.betaCheck?.checkedById, {}),
      notesById: toObj(src?.betaCheck?.notesById, {}),
      updatedAt: String(src?.betaCheck?.updatedAt || ""),
    },
  };

  return merged;
}

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

function isValidISODate(iso) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(iso || ""));
}

function isValidTimeHHMM(v) {
  return /^\d{2}:\d{2}$/.test(String(v || ""));
}

function parseLocalDateTime(dateISO, timeHHMM = "00:00") {
  const safeDate = isValidISODate(dateISO) ? String(dateISO) : todayISO();
  const safeTime = isValidTimeHHMM(timeHHMM) ? String(timeHHMM) : "00:00";
  return new Date(`${safeDate}T${safeTime}:00`);
}

function toISODateLocal(d) {
  const dt = d instanceof Date ? d : new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function monthKeyFromDate(d) {
  const dt = d instanceof Date ? d : new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function shiftMonth(monthKey, delta) {
  const [y, m] = String(monthKey || "").split("-").map(Number);
  const dt = new Date((Number(y) || new Date().getFullYear()), Math.max(0, (Number(m) || 1) - 1), 1);
  dt.setMonth(dt.getMonth() + (Number(delta) || 0));
  return monthKeyFromDate(dt);
}

function formatMonthLabel(monthKey) {
  const [y, m] = String(monthKey || "").split("-").map(Number);
  const dt = new Date(Number(y) || new Date().getFullYear(), Math.max(0, (Number(m) || 1) - 1), 1);
  return dt.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function buildMonthGrid(monthKey) {
  const [y, m] = String(monthKey || "").split("-").map(Number);
  const start = new Date(Number(y) || new Date().getFullYear(), Math.max(0, (Number(m) || 1) - 1), 1);
  const month = start.getMonth();
  const startDay = start.getDay(); // 0=Sun
  const firstCell = new Date(start);
  firstCell.setDate(firstCell.getDate() - startDay);
  const cells = [];
  for (let i = 0; i < 42; i += 1) {
    const d = new Date(firstCell);
    d.setDate(firstCell.getDate() + i);
    cells.push({
      dateISO: toISODateLocal(d),
      dayNum: d.getDate(),
      inMonth: d.getMonth() === month,
    });
  }
  return cells;
}

function weatherCodeLabel(code) {
  const c = Number(code);
  if (c === 0) return "Clear";
  if ([1, 2].includes(c)) return "Partly cloudy";
  if (c === 3) return "Overcast";
  if ([45, 48].includes(c)) return "Fog";
  if ([51, 53, 55, 56, 57].includes(c)) return "Drizzle";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(c)) return "Rain";
  if ([71, 73, 75, 77, 85, 86].includes(c)) return "Snow";
  if ([95, 96, 99].includes(c)) return "Thunderstorm";
  return "Mixed";
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

async function compressImageFile(file, opts = {}) {
  const maxW = Math.max(320, Number(opts.maxW) || 1600);
  const maxH = Math.max(320, Number(opts.maxH) || 1600);
  const quality = Math.min(0.95, Math.max(0.5, Number(opts.quality) || 0.82));
  const maxBytes = Math.max(0, Number(opts.maxBytes) || 0);
  if (!file?.type?.startsWith("image/")) return file;

  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const img = await new Promise((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = String(dataUrl);
  });

  let outW = img.width;
  let outH = img.height;
  const ratio = Math.min(maxW / outW, maxH / outH, 1);
  outW = Math.max(1, Math.round(outW * ratio));
  outH = Math.max(1, Math.round(outH * ratio));

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;

  let curW = outW;
  let curH = outH;
  let bestBlob = null;
  const qualitySteps = [quality, 0.76, 0.68, 0.6, 0.52].filter((q, i, arr) => q > 0 && arr.indexOf(q) === i);

  for (let pass = 0; pass < 4; pass += 1) {
    canvas.width = curW;
    canvas.height = curH;
    ctx.clearRect(0, 0, curW, curH);
    ctx.drawImage(img, 0, 0, curW, curH);

    for (const q of qualitySteps) {
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", q));
      if (!blob) continue;
      if (!bestBlob || blob.size < bestBlob.size) bestBlob = blob;
      if (!maxBytes || blob.size <= maxBytes) {
        const outName = String(file.name || "image").replace(/\.[^.]+$/, "") + ".jpg";
        return new File([blob], outName, { type: "image/jpeg" });
      }
    }

    curW = Math.max(320, Math.round(curW * 0.84));
    curH = Math.max(320, Math.round(curH * 0.84));
  }

  if (!bestBlob) return file;
  const outName = String(file.name || "image").replace(/\.[^.]+$/, "") + ".jpg";
  return new File([bestBlob], outName, { type: "image/jpeg" });
}

function formatBytes(size) {
  const bytes = Math.max(0, Number(size) || 0);
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function formatDurationSec(totalSec) {
  const s = Math.max(0, Number(totalSec) || 0);
  const min = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  const tenth = Math.floor((s - Math.floor(s)) * 10);
  return `${min}:${String(sec).padStart(2, "0")}.${tenth}`;
}

function mediaSrc(media) {
  if (!media) return "";
  if (typeof media.dataUrl === "string" && media.dataUrl) return media.dataUrl;
  return String(media.url || "");
}

function supportedRecorderMimeType() {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4",
  ];
  return candidates.find((t) => MediaRecorder.isTypeSupported?.(t)) || "";
}

async function loadVideoMetadataFromUrl(sourceUrl) {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const cleanup = () => {
      video.removeEventListener("loadedmetadata", onLoaded);
      video.removeEventListener("error", onError);
    };
    const onLoaded = () => {
      cleanup();
      resolve({
        durationSec: Number.isFinite(Number(video.duration)) ? Number(video.duration) : 0,
        width: Number(video.videoWidth) || 0,
        height: Number(video.videoHeight) || 0,
      });
    };
    const onError = () => {
      cleanup();
      reject(new Error("Unable to read video metadata."));
    };
    video.preload = "metadata";
    video.playsInline = true;
    video.muted = true;
    video.src = String(sourceUrl || "");
    video.addEventListener("loadedmetadata", onLoaded);
    video.addEventListener("error", onError);
  });
}

async function trimAndCompressVideoFromUrl(sourceUrl, opts = {}) {
  if (!sourceUrl) throw new Error("Missing video source.");
  if (typeof document === "undefined") throw new Error("Video editor requires a browser environment.");

  const mimeType = supportedRecorderMimeType();
  if (!mimeType) throw new Error("This browser does not support video export yet.");

  const video = document.createElement("video");
  video.preload = "auto";
  video.playsInline = true;
  video.muted = true;
  video.src = String(sourceUrl);

  await new Promise((resolve, reject) => {
    const onLoaded = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error("Unable to load video for editing."));
    };
    const cleanup = () => {
      video.removeEventListener("loadedmetadata", onLoaded);
      video.removeEventListener("error", onError);
    };
    video.addEventListener("loadedmetadata", onLoaded);
    video.addEventListener("error", onError);
  });

  const sourceDuration = Math.max(0.25, Number(video.duration) || 0.25);
  const startSec = Math.max(0, Math.min(Number(opts.startSec) || 0, sourceDuration - 0.25));
  const endSec = Math.max(startSec + 0.25, Math.min(Number(opts.endSec) || sourceDuration, sourceDuration));
  const maxDim = Math.max(360, Number(opts.maxDim) || 1080);
  const fps = Math.min(60, Math.max(12, Number(opts.fps) || 30));
  const bitrateKbps = Math.min(12000, Math.max(700, Number(opts.bitrateKbps) || 3500));

  const srcW = Math.max(2, Number(video.videoWidth) || 1280);
  const srcH = Math.max(2, Number(video.videoHeight) || 720);
  const scale = Math.min(1, maxDim / Math.max(srcW, srcH));
  const outW = Math.max(2, Math.round((srcW * scale) / 2) * 2);
  const outH = Math.max(2, Math.round((srcH * scale) / 2) * 2);

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Video canvas context unavailable.");

  const canvasStream = canvas.captureStream(fps);

  const chunks = [];
  const recorder = new MediaRecorder(canvasStream, {
    mimeType,
    videoBitsPerSecond: bitrateKbps * 1000,
  });
  recorder.ondataavailable = (e) => {
    if (e?.data?.size) chunks.push(e.data);
  };

  const stopped = new Promise((resolve, reject) => {
    recorder.onstop = resolve;
    recorder.onerror = () => reject(new Error("Video recorder failed during export."));
  });

  await new Promise((resolve, reject) => {
    const onSeek = () => {
      cleanup();
      resolve();
    };
    const onErr = () => {
      cleanup();
      reject(new Error("Failed to seek to trim start."));
    };
    const cleanup = () => {
      video.removeEventListener("seeked", onSeek);
      video.removeEventListener("error", onErr);
    };
    video.addEventListener("seeked", onSeek);
    video.addEventListener("error", onErr);
    try {
      video.currentTime = startSec;
    } catch {
      cleanup();
      reject(new Error("Unable to set trim start."));
    }
  });

  try {
    await video.play();
  } catch {
    throw new Error("Unable to autoplay this clip for trimming. Try a different video format or trim outside the app.");
  }

  recorder.start(250);
  let rafId = 0;
  let failTimeout = 0;
  let finished = false;
  const stopAndCleanup = () => {
    if (finished) return;
    finished = true;
    try {
      cancelAnimationFrame(rafId);
    } catch {
      // ignore
    }
    if (failTimeout) {
      window.clearTimeout(failTimeout);
      failTimeout = 0;
    }
    try {
      video.pause();
    } catch {
      // ignore
    }
    try {
      recorder.stop();
    } catch {
      // ignore
    }
  };
  failTimeout = window.setTimeout(() => {
    stopAndCleanup();
  }, Math.max(1500, Math.round((endSec - startSec) * 1000) + 2500));

  const renderLoop = () => {
    if (finished) return;
    try {
      ctx.drawImage(video, 0, 0, outW, outH);
    } catch {
      // ignore draw glitches and continue
    }
    if (video.currentTime >= endSec || video.ended) {
      stopAndCleanup();
      return;
    }
    rafId = requestAnimationFrame(renderLoop);
  };
  rafId = requestAnimationFrame(renderLoop);

  await stopped;
  canvasStream.getTracks().forEach((t) => t.stop());
  if (!chunks.length) throw new Error("No output generated. Try a shorter clip.");

  const blob = new Blob(chunks, { type: mimeType });
  return {
    blob,
    mimeType,
    durationSec: Math.max(0, endSec - startSec),
    width: outW,
    height: outH,
  };
}

function downloadTextFile(filename, text, mime = "text/plain") {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  let clicked = false;
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener noreferrer";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    clicked = true;
    document.body.removeChild(a);

    // iOS Safari can ignore `download`; opening a preview tab makes .ics import reliable.
    if (isLikelyIOSDevice() && String(mime).includes("calendar")) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  } catch {
    clicked = false;
  } finally {
    window.setTimeout(() => safeRevokeObjectURL(url), 2000);
  }
  return clicked;
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

  const safeDate = /^\d{4}-\d{2}-\d{2}$/.test(String(dateISO || "")) ? String(dateISO) : todayISO();
  const safeTime = /^\d{2}:\d{2}$/.test(String(time || "")) ? String(time) : "17:00";
  const [hh, mm] = safeTime.split(":").map((x) => parseInt(x, 10));

  const startLocal = new Date(`${safeDate}T${pad(hh || 0)}:${pad(mm || 0)}:00`);
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

  return downloadTextFile(`skateflow-practice-${safeDate}.ics`, ics, "text/calendar");
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

function useLocalStorageState(key, initialValue, normalize) {
  const normalizeFn = typeof normalize === "function" ? normalize : (v) => v;
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return initialValue;
      return normalizeFn(JSON.parse(raw));
    } catch {
      return initialValue;
    }
  });

  React.useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(normalizeFn(state)));
    } catch {
      // ignore
    }
  }, [key, state, normalizeFn]);

  return [state, setState];
}

function Pill({ children, tone = "neutral", lightMode = false }) {
  const darkMap = {
    neutral: "bg-white/10 text-white ring-white/10",
    good: "bg-emerald-500/15 text-emerald-200 ring-emerald-500/20",
    bad: "bg-rose-500/15 text-rose-200 ring-rose-500/20",
    warn: "bg-amber-500/15 text-amber-200 ring-amber-500/20",
    cyan: "bg-cyan-500/15 text-cyan-200 ring-cyan-500/20",
  };
  const lightMap = {
    neutral: "bg-slate-200 text-slate-800 ring-slate-300",
    good: "bg-emerald-100 text-emerald-800 ring-emerald-200",
    bad: "bg-rose-100 text-rose-800 ring-rose-200",
    warn: "bg-amber-100 text-amber-800 ring-amber-200",
    cyan: "bg-cyan-100 text-cyan-800 ring-cyan-200",
  };
  const map = lightMode ? lightMap : darkMap;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${map[tone] || map.neutral}`}>
      {children}
    </span>
  );
}

function TabButton({ active, icon: Icon, label, onClick, lightMode = false }) {
  const className = lightMode
    ? `flex-1 rounded-2xl px-3 py-2.5 text-sm font-semibold inline-flex items-center justify-center gap-2 ring-1 transition shadow-sm ${
        active ? "bg-slate-200 text-slate-900 ring-slate-400" : "bg-white text-slate-700 ring-slate-300 hover:bg-slate-100"
      }`
    : `flex-1 rounded-2xl px-3 py-2.5 text-sm font-semibold inline-flex items-center justify-center gap-2 ring-1 transition shadow-sm ${
        active ? "bg-white text-black ring-white" : "bg-white/5 text-white ring-white/10 hover:bg-white/10"
      }`;
  return (
    <button type="button" onClick={onClick} className={className}>
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
        className="relative w-full max-w-lg rounded-3xl bg-gradient-to-br from-zinc-950 via-black to-zinc-900 ring-1 ring-white/10 shadow-2xl p-5 text-white"
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
  const [binderFilter, setBinderFilter] = useState("all"); // all | newtrick | levelup | xp | weekly
  const [xpPop, setXpPop] = useState(null); // { id, amount, levelUp }
  const [store, setStore] = useLocalStorageState(STORAGE_KEY, INITIAL_STORE, normalizeStoreShape);

  const setSlice = (patch) => setStore((prev) => ({ ...(prev || {}), ...patch }));

  const members = store.members || [];
  const skaters = store.skaters || [];
  const plans = store.plans || DEFAULT_PLANS;
  const sessions = store.sessions || [];
  const chatBySkaterId = store.chatBySkaterId || {};
  const practiceEvents = store.practiceEvents || [];
  const practiceSettings = store.practiceSettings || { durationMin: 60, remindMin: 60, title: "SkateFlow Practice" };
  const reminders = store.reminders || { enabled: false, time: "17:00" };
  const draft = store.draft || { date: todayISO(), park: "", dayType: Object.keys(plans)[0], completedByTaskId: {}, missedByTaskId: {} };
  const auth = store.auth || { loggedInMemberId: null };
  const ui = store.ui || { view: "log", activeMemberId: members[0]?.id, activeSkaterId: skaters[0]?.id };
  const xpBySkaterId = store.xpBySkaterId || {};
  const xpMilestonesBySkaterId = store.xpMilestonesBySkaterId || {};
  const contestBySkaterId = store.contestBySkaterId || {};
  const coachCornerBySkaterId = store.coachCornerBySkaterId || {};
  const skateDaysBySkaterId = store.skateDaysBySkaterId || {};
  const parkProfiles = store.parkProfiles || DEFAULT_PARK_PROFILES;
  const parkPrefsBySkaterId = store.parkPrefsBySkaterId || {};
  const appPrefs = store.appPrefs || { theme: "dark" };
  const cloudSync = { ...DEFAULT_CLOUD_SYNC, ...toObj(store.cloudSync, {}) };
  const betaCheck = { ...createDefaultBetaCheck(), ...toObj(store.betaCheck, {}) };
  const betaCheckedById = toObj(betaCheck.checkedById, {});
  const betaNotesById = toObj(betaCheck.notesById, {});
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState(() => new Date());
  const [cloudSyncBusy, setCloudSyncBusy] = useState(false);
  const [cloudSyncError, setCloudSyncError] = useState("");
  const storeRef = useRef(store);
  const cloudSyncBusyRef = useRef(false);
  const autoSyncBootKeyRef = useRef("");

  const setUI = (patch) => setSlice({ ui: { ...ui, ...patch } });
  const setDraft = (patch) => {
    setSlice({ draft: { ...draft, ...patch } });
    setLastDraftSavedAt(new Date());
  };
  const [mobileTabsOpen, setMobileTabsOpen] = useState(false);
  const switchView = (nextView) => {
    setUI({ view: nextView });
    if (typeof window !== "undefined" && window.innerWidth < 640) {
      setMobileTabsOpen(false);
    }
  };

  const betaStats = useMemo(() => {
    const total = BETA_CHECK_ITEMS.length;
    const pass = BETA_CHECK_ITEMS.reduce((sum, item) => sum + (betaCheckedById[item.id] ? 1 : 0), 0);
    return { total, pass, remaining: Math.max(0, total - pass) };
  }, [betaCheckedById]);

  const setBetaChecked = (itemId, checked) => {
    const nextCheckedById = { ...betaCheckedById, [itemId]: !!checked };
    setSlice({
      betaCheck: {
        ...betaCheck,
        checkedById: nextCheckedById,
        notesById: betaNotesById,
        updatedAt: new Date().toISOString(),
      },
    });
  };

  const setBetaNote = (itemId, text) => {
    const nextNotesById = { ...betaNotesById, [itemId]: String(text || "").slice(0, 180) };
    setSlice({
      betaCheck: {
        ...betaCheck,
        checkedById: betaCheckedById,
        notesById: nextNotesById,
        updatedAt: new Date().toISOString(),
      },
    });
  };

  const markAllBetaChecks = () => {
    const checkedById = Object.fromEntries(BETA_CHECK_ITEMS.map((item) => [item.id, true]));
    setSlice({
      betaCheck: {
        ...betaCheck,
        checkedById,
        notesById: betaNotesById,
        updatedAt: new Date().toISOString(),
      },
    });
    toast("Beta checker updated", "All checks marked complete.", "success");
  };

  const resetBetaChecks = () => {
    if (!confirm("Reset beta checklist status and notes?")) return;
    setSlice({ betaCheck: { ...createDefaultBetaCheck() } });
    toast("Beta checker reset", "Checklist cleared.", "warn");
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
  const [calendarMonthKey, setCalendarMonthKey] = useState(() => monthKeyFromDate(new Date()));
  const reminderFiredRef = useRef(new Set());

  const activePracticeEvents = useMemo(() => {
    const list = toArray(practiceEvents)
      .filter((ev) => {
        const evSkaterId = String(ev?.skaterId || "");
        return !evSkaterId || evSkaterId === ui.activeSkaterId;
      })
      .map((ev) => ({
        ...ev,
        dateISO: isValidISODate(ev?.dateISO) ? String(ev.dateISO) : todayISO(),
        time: isValidTimeHHMM(ev?.time) ? String(ev.time) : "17:00",
      }))
      .sort((a, b) => {
        const aMs = parseLocalDateTime(a.dateISO, a.time).getTime();
        const bMs = parseLocalDateTime(b.dateISO, b.time).getTime();
        return aMs - bMs;
      });
    return list;
  }, [practiceEvents, ui.activeSkaterId]);

  const calendarGrid = useMemo(() => buildMonthGrid(calendarMonthKey), [calendarMonthKey]);
  const practiceEventsByDate = useMemo(() => {
    const by = new Map();
    for (const ev of activePracticeEvents) {
      const key = String(ev.dateISO || "");
      if (!by.has(key)) by.set(key, []);
      by.get(key).push(ev);
    }
    return by;
  }, [activePracticeEvents]);

  const nextPracticeEvent = useMemo(() => {
    const now = Date.now();
    return activePracticeEvents.find((ev) => parseLocalDateTime(ev.dateISO, ev.time).getTime() >= now) || null;
  }, [activePracticeEvents]);
  const nextPracticeCountdown = useMemo(() => {
    if (!nextPracticeEvent) return "No upcoming practice";
    const now = Date.now();
    const ms = parseLocalDateTime(nextPracticeEvent.dateISO, nextPracticeEvent.time).getTime() - now;
    if (ms <= 0) return "Starting now";
    const totalMin = Math.round(ms / 60000);
    const days = Math.floor(totalMin / 1440);
    const hours = Math.floor((totalMin % 1440) / 60);
    const mins = totalMin % 60;
    if (days > 0) return `In ${days}d ${hours}h`;
    if (hours > 0) return `In ${hours}h ${mins}m`;
    return `In ${mins}m`;
  }, [nextPracticeEvent]);

  const tasks = useMemo(() => plans[draft.dayType] || [], [plans, draft.dayType]);
  const totalTarget = useMemo(() => tasks.reduce((sum, t) => sum + (Number(t.target) || 0), 0), [tasks]);
  const totalCompleted = useMemo(
    () => tasks.reduce((sum, t) => sum + (Number(draft.completedByTaskId?.[t.id]) || 0), 0),
    [tasks, draft.completedByTaskId]
  );
  const totalMissed = useMemo(
    () => tasks.reduce((sum, t) => sum + (Number(draft.missedByTaskId?.[t.id]) || 0), 0),
    [tasks, draft.missedByTaskId]
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
  const [biometricBusy, setBiometricBusy] = useState(false);
  const biometricUnavailableReason = getBiometricUnavailableReason();
  const biometricSupported = !biometricUnavailableReason;

  const ensurePinRequired = (memberId) => {
    const m = members.find((x) => x.id === memberId);
    if (!m) return true;
    if (m.pin && sanitizePin(m.pin).length === 4) return true;

    let nextPin = prompt(`Set a 4-digit PIN for ${m.name}:`, "");
    if (nextPin == null) return false;
    nextPin = sanitizePin(nextPin);
    if (nextPin.length !== 4) {
      alert("PIN must be exactly 4 digits.");
      return false;
    }
    setSlice({ members: members.map((x) => (x.id === memberId ? { ...x, pin: nextPin } : x)) });
    return true;
  };

  const attemptLogin = (memberId, pin) => {
    const m = members.find((x) => x.id === memberId);
    if (!m) return false;
    if (!ensurePinRequired(memberId)) return false;
    const stored = sanitizePin(m.pin || "");
    return sanitizePin(pin || "") === stored;
  };

  const createBiometricChallenge = (len = 32) => {
    const bytes = new Uint8Array(len);
    if (!window.crypto?.getRandomValues) return null;
    window.crypto.getRandomValues(bytes);
    return bytes;
  };

  const registerBiometricForMember = async (member) => {
    if (!member?.id) return false;
    const biometricReason = getBiometricUnavailableReason();
    if (biometricReason) {
      throw new Error(biometricReason);
    }
    const challenge = createBiometricChallenge(32);
    const userIdBytes = createBiometricChallenge(16);
    if (!challenge || !userIdBytes) throw new Error("Secure biometric setup is unavailable.");
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: "SkateFlow" },
        user: {
          id: userIdBytes,
          name: `${member.id}@skateflow.local`,
          displayName: member.name || "SkateFlow",
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 },
          { type: "public-key", alg: -257 },
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
          residentKey: "preferred",
        },
        timeout: 60000,
        attestation: "none",
      },
    });
    const id = credential?.rawId ? arrayBufferToBase64Url(credential.rawId) : "";
    if (!id) throw new Error("Unable to save biometric credential.");
    setSlice({
      members: members.map((x) => (x.id === member.id ? { ...x, biometricCredentialId: id } : x)),
    });
    return true;
  };

  const biometricLogin = async (memberId) => {
    const member = members.find((x) => x.id === memberId);
    if (!member) return false;
    const biometricReason = getBiometricUnavailableReason();
    if (biometricReason) {
      setLoginError(biometricReason);
      return false;
    }
    if (!member.biometricCredentialId) {
      setLoginError("No Face/Fingerprint login is set for this account yet.");
      return false;
    }
    try {
      setBiometricBusy(true);
      setLoginError("");
      const challenge = createBiometricChallenge(32);
      if (!challenge) throw new Error("Secure biometric challenge unavailable.");
      await navigator.credentials.get({
        publicKey: {
          challenge,
          allowCredentials: [{ type: "public-key", id: base64UrlToArrayBuffer(member.biometricCredentialId) }],
          userVerification: "required",
          timeout: 60000,
        },
      });
      setSlice({ auth: { loggedInMemberId: memberId }, ui: { ...ui, activeMemberId: memberId } });
      setLoginOpen(false);
      toast("Biometric login", `Welcome back, ${member.name}.`, "success");
      return true;
    } catch (err) {
      setLoginError(err?.message || "Biometric login failed.");
      return false;
    } finally {
      setBiometricBusy(false);
    }
  };

  const [draftMedia, setDraftMedia] = useState([]);
  const revokeAllDraftMedia = (opts = {}) => {
    const shouldRevoke = opts?.revoke !== false;
    setDraftMedia((prev) => {
      if (shouldRevoke) {
        for (const m of prev) if (m?.url) safeRevokeObjectURL(m.url);
      }
      return [];
    });
  };

  const addMediaFromFiles = async (fileList) => {
    const { valid: files, stats } = guardUploadFiles(fileList, {
      maxCount: MAX_UPLOAD_COUNT,
      maxBytes: MAX_MEDIA_FILE_BYTES,
      allowedPrefixes: ["image/", "video/"],
    });
    if (!files.length) {
      toast("No media added", "Files were invalid, too large, or unsupported.", "warn");
      return;
    }
    const processed = await Promise.all(
      files.map(async (f) => {
        if (f.type?.startsWith("image/")) {
          try {
            return await compressImageFile(f, { maxW: 1600, maxH: 1600, quality: 0.82, maxBytes: MAX_EMBEDDED_MEDIA_BYTES });
          } catch {
            return f;
          }
        }
        return f;
      })
    );
    const next = await Promise.all(
      processed.map(async (f) => {
        let dataUrl = "";
        if ((Number(f.size) || 0) <= MAX_EMBEDDED_MEDIA_BYTES) {
          try {
            dataUrl = await fileToDataUrl(f);
          } catch {
            dataUrl = "";
          }
        }
        return {
          id: `m-${uid()}`,
          type: f.type,
          name: f.name,
          size: f.size,
          url: URL.createObjectURL(f),
          dataUrl,
          comment: "",
        };
      })
    );
    setDraftMedia((prev) => [...prev, ...next]);
    const compressedCount = processed.filter((f, i) => f.size < (files[i]?.size || f.size)).length;
    toast(
      "Media added",
      `${files.length} item(s) added${compressedCount ? ` • ${compressedCount} image(s) compressed` : ""}.`,
      "success"
    );
    if (stats.trimmed || stats.tooLarge || stats.wrongType) {
      toast(
        "Some files skipped",
        `${stats.trimmed ? `${stats.trimmed} over limit, ` : ""}${stats.tooLarge ? `${stats.tooLarge} too large, ` : ""}${stats.wrongType ? `${stats.wrongType} wrong type` : ""}`.replace(/, $/, ""),
        "warn"
      );
    }
  };

  const removeDraftMedia = (id) => {
    setDraftMedia((prev) => {
      const item = prev.find((x) => x.id === id);
      if (item?.url) safeRevokeObjectURL(item.url);
      return prev.filter((x) => x.id !== id);
    });
  };

  const [videoEdit, setVideoEdit] = useState({
    open: false,
    sourceType: "draft",
    sessionId: "",
    mediaId: "",
    sourceUrl: "",
    name: "",
    durationSec: 0,
    startSec: 0,
    endSec: 0,
    maxDim: 1080,
    fps: 30,
    bitrateKbps: 3500,
    processing: false,
    error: "",
  });

  const closeVideoEditor = () => {
    if (videoEdit.processing) return;
    setVideoEdit({
      open: false,
      sourceType: "draft",
      sessionId: "",
      mediaId: "",
      sourceUrl: "",
      name: "",
      durationSec: 0,
      startSec: 0,
      endSec: 0,
      maxDim: 1080,
      fps: 30,
      bitrateKbps: 3500,
      processing: false,
      error: "",
    });
  };

  const setVideoEditStart = (raw) => {
    const v = Number(raw);
    setVideoEdit((prev) => {
      const duration = Math.max(0.25, Number(prev.durationSec) || 0.25);
      const end = Math.min(duration, Math.max(0.25, Number(prev.endSec) || duration));
      const start = Math.max(0, Math.min(Number.isFinite(v) ? v : 0, end - 0.25));
      return { ...prev, startSec: start };
    });
  };

  const setVideoEditEnd = (raw) => {
    const v = Number(raw);
    setVideoEdit((prev) => {
      const duration = Math.max(0.25, Number(prev.durationSec) || 0.25);
      const start = Math.max(0, Math.min(Number(prev.startSec) || 0, duration - 0.25));
      const end = Math.max(start + 0.25, Math.min(Number.isFinite(v) ? v : duration, duration));
      return { ...prev, endSec: end };
    });
  };

  const openDraftVideoEditor = async (media) => {
    const src = mediaSrc(media);
    if (!src || !media?.type?.startsWith("video/")) return;
    if (!supportedRecorderMimeType()) {
      toast("Trim unavailable", "This browser cannot export trimmed video. Use Chrome desktop for in-app trim.", "warn");
      return;
    }
    try {
      const meta = await loadVideoMetadataFromUrl(src);
      const duration = Math.max(0.25, Number(meta.durationSec) || 0.25);
      setVideoEdit({
        open: true,
        sourceType: "draft",
        sessionId: "",
        mediaId: media.id,
        sourceUrl: src,
        name: media.name || "video",
        durationSec: duration,
        startSec: 0,
        endSec: duration,
        maxDim: 1080,
        fps: 30,
        bitrateKbps: 3500,
        processing: false,
        error: "",
      });
    } catch (err) {
      toast("Cannot open editor", err?.message || "Failed to load video metadata.", "warn");
    }
  };

  const openSessionVideoEditor = async (sessionId, mediaId) => {
    const sess = sessions.find((s) => s.id === sessionId);
    const media = (sess?.media || []).find((m) => m.id === mediaId);
    const src = mediaSrc(media);
    if (!src || !media?.type?.startsWith("video/")) return;
    if (!supportedRecorderMimeType()) {
      toast("Trim unavailable", "This browser cannot export trimmed video. Use Chrome desktop for in-app trim.", "warn");
      return;
    }
    try {
      const meta = await loadVideoMetadataFromUrl(src);
      const duration = Math.max(0.25, Number(meta.durationSec) || 0.25);
      setVideoEdit({
        open: true,
        sourceType: "session",
        sessionId: String(sessionId || ""),
        mediaId: media.id,
        sourceUrl: src,
        name: media.name || "video",
        durationSec: duration,
        startSec: 0,
        endSec: duration,
        maxDim: 1080,
        fps: 30,
        bitrateKbps: 3500,
        processing: false,
        error: "",
      });
    } catch (err) {
      toast("Cannot open editor", err?.message || "Failed to load video metadata.", "warn");
    }
  };

  const saveDraftVideoEdit = async () => {
    if (!videoEdit.mediaId || videoEdit.processing) return;
    const media =
      videoEdit.sourceType === "session"
        ? (sessions.find((s) => s.id === videoEdit.sessionId)?.media || []).find((m) => m.id === videoEdit.mediaId)
        : draftMedia.find((m) => m.id === videoEdit.mediaId);
    if (!mediaSrc(media)) return;

    setVideoEdit((prev) => ({ ...prev, processing: true, error: "" }));
    try {
      const out = await trimAndCompressVideoFromUrl(mediaSrc(media), {
        startSec: videoEdit.startSec,
        endSec: videoEdit.endSec,
        maxDim: videoEdit.maxDim,
        fps: videoEdit.fps,
        bitrateKbps: videoEdit.bitrateKbps,
      });
      const ext = String(out.mimeType || "").includes("webm") ? "webm" : "mp4";
      const baseName = String(media.name || "clip").replace(/\.[^.]+$/, "");
      const nextName = `${baseName}-trim.${ext}`;
      const nextUrl = URL.createObjectURL(out.blob);
      let dataUrl = "";
      if ((Number(out.blob.size) || 0) <= MAX_EMBEDDED_MEDIA_BYTES) {
        try {
          dataUrl = await blobToDataUrl(out.blob);
        } catch {
          dataUrl = "";
        }
      }

      if (videoEdit.sourceType === "session") {
        setSlice({
          sessions: sessions.map((s) =>
            s.id === videoEdit.sessionId
              ? {
                  ...s,
                  media: (s.media || []).map((item) =>
                    item.id === media.id
                      ? {
                          ...item,
                          url: nextUrl,
                          dataUrl,
                          type: out.mimeType || item.type || "video/webm",
                          size: out.blob.size,
                          name: nextName,
                        }
                      : item
                  ),
                }
              : s
          ),
        });
      } else {
        setDraftMedia((prev) =>
          prev.map((item) =>
            item.id === media.id
              ? {
                  ...item,
                  url: nextUrl,
                  dataUrl,
                  type: out.mimeType || item.type || "video/webm",
                  size: out.blob.size,
                  name: nextName,
                }
              : item
          )
        );
      }
      safeRevokeObjectURL(media.url);
      closeVideoEditor();
      toast(
        "Video updated",
        `${Math.max(0.25, out.durationSec).toFixed(1)}s • ${out.width}x${out.height} • ${formatBytes(out.blob.size)}`,
        "success"
      );
    } catch (err) {
      setVideoEdit((prev) => ({ ...prev, processing: false, error: err?.message || "Video processing failed." }));
    }
  };
  const editingVideoMedia = useMemo(() => {
    if (!videoEdit.mediaId) return null;
    if (videoEdit.sourceType === "session") {
      const sess = sessions.find((s) => s.id === videoEdit.sessionId);
      return (sess?.media || []).find((m) => m.id === videoEdit.mediaId) || null;
    }
    return draftMedia.find((m) => m.id === videoEdit.mediaId) || null;
  }, [draftMedia, sessions, videoEdit.mediaId, videoEdit.sessionId, videoEdit.sourceType]);
  const trimmedDurationSec = Math.max(0.25, Number(videoEdit.endSec || 0) - Number(videoEdit.startSec || 0));

  useEffect(() => {
    if (!videoEdit.open) return;
    if (editingVideoMedia) return;
    closeVideoEditor();
  }, [videoEdit.open, editingVideoMedia]);

  const [sessionEdit, setSessionEdit] = useState({
    open: false,
    sessionId: "",
    date: todayISO(),
    park: "",
    dayType: "",
    tasks: [],
  });
  const editDayTypeOptions = useMemo(() => {
    const all = new Set(Object.keys(plans || {}));
    if (sessionEdit.dayType) all.add(sessionEdit.dayType);
    return [...all];
  }, [plans, sessionEdit.dayType]);
  const isLightMode = appPrefs.theme === "light";
  const toggleTheme = () => setSlice({ appPrefs: { ...appPrefs, theme: isLightMode ? "dark" : "light" } });
  const selectedParkId = parkPrefsBySkaterId[ui.activeSkaterId] || parkProfiles[0]?.id || "";
  const selectedParkProfile = useMemo(
    () => parkProfiles.find((p) => p.id === selectedParkId) || null,
    [parkProfiles, selectedParkId]
  );
  const [parkLookupQuery, setParkLookupQuery] = useState("");
  const [parkLookupLoading, setParkLookupLoading] = useState(false);
  const [parkLookupResults, setParkLookupResults] = useState([]);
  const [parkDraft, setParkDraft] = useState({
    name: "",
    location: "",
    lat: "",
    lon: "",
    notes: "",
  });
  const [weatherState, setWeatherState] = useState({
    loading: false,
    error: "",
    current: null,
    daily: [],
    fetchedAt: "",
    parkName: "",
  });

  const selectParkForActiveSkater = (parkId) =>
    setSlice({ parkPrefsBySkaterId: { ...parkPrefsBySkaterId, [ui.activeSkaterId]: parkId } });

  const hydrateParkDraft = (park) => {
    if (!park) return;
    setParkDraft({
      name: String(park.name || ""),
      location: String(park.location || ""),
      lat: Number.isFinite(Number(park.lat)) ? String(park.lat) : "",
      lon: Number.isFinite(Number(park.lon)) ? String(park.lon) : "",
      notes: String(park.notes || ""),
    });
  };

  const fetchWeatherForPark = async (park) => {
    if (!park || !Number.isFinite(Number(park.lat)) || !Number.isFinite(Number(park.lon))) {
      setWeatherState((prev) => ({ ...prev, error: "Pick a park with map coordinates first." }));
      return;
    }
    setWeatherState((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      const lat = Number(park.lat);
      const lon = Number(park.lon);
      const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}` +
        "&current=temperature_2m,weather_code,wind_speed_10m,precipitation" +
        "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max" +
        "&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=auto";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Weather service unavailable.");
      const data = await res.json();
      const dailyDates = toArray(data?.daily?.time);
      const daily = dailyDates.slice(0, 4).map((dateISO, idx) => ({
        dateISO: String(dateISO || ""),
        code: Number(data?.daily?.weather_code?.[idx] ?? 0),
        maxF: Math.round(Number(data?.daily?.temperature_2m_max?.[idx] ?? 0)),
        minF: Math.round(Number(data?.daily?.temperature_2m_min?.[idx] ?? 0)),
        rainPct: Math.max(0, Math.round(Number(data?.daily?.precipitation_probability_max?.[idx] ?? 0))),
      }));
      setWeatherState({
        loading: false,
        error: "",
        current: {
          tempF: Math.round(Number(data?.current?.temperature_2m ?? 0)),
          windMph: Math.round(Number(data?.current?.wind_speed_10m ?? 0)),
          precipIn: Number(data?.current?.precipitation ?? 0),
          code: Number(data?.current?.weather_code ?? 0),
        },
        daily,
        fetchedAt: new Date().toISOString(),
        parkName: park.name,
      });
    } catch (err) {
      setWeatherState((prev) => ({
        ...prev,
        loading: false,
        error: err?.message || "Unable to load weather right now.",
      }));
    }
  };

  const searchParkLocations = async () => {
    const query = String(parkLookupQuery || "").trim();
    if (query.length < 2) {
      toast("Add a search term", "Type a park or city name first.", "warn");
      return;
    }
    setParkLookupLoading(true);
    setParkLookupResults([]);
    try {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=8&language=en&format=json`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Location search unavailable.");
      const data = await res.json();
      const rawResults = toArray(data?.results)
        .map((r) => ({
          name: String(r?.name || "").trim(),
          admin1: String(r?.admin1 || "").trim(),
          country: String(r?.country || "").trim(),
          lat: Number(r?.latitude),
          lon: Number(r?.longitude),
        }))
        .filter((r) => r.name && Number.isFinite(r.lat) && Number.isFinite(r.lon));
      const seen = new Set();
      const results = rawResults.filter((r) => {
        const location = [r.admin1, r.country].filter(Boolean).join(", ");
        const key = parkIdentityKey(r.name, location);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setParkLookupResults(results);
      if (!results.length) toast("No locations found", "Try a broader park or city name.", "warn");
    } catch (err) {
      toast("Search failed", err?.message || "Could not search locations.", "warn");
    } finally {
      setParkLookupLoading(false);
    }
  };

  const addParkFromLookup = (item) => {
    if (!item?.name) return;
    const location = [item.admin1, item.country].filter(Boolean).join(", ");
    const existing = parkProfiles.find((p) => parkIdentityKey(p.name, p.location) === parkIdentityKey(item.name, location));
    if (existing) {
      selectParkForActiveSkater(existing.id);
      toast("Park already saved", `${existing.name} selected.`, "info");
      return;
    }
    const next = {
      id: `park-${uid()}`,
      name: item.name,
      location,
      lat: Number(item.lat),
      lon: Number(item.lon),
      notes: "Added from search",
    };
    setSlice({
      parkProfiles: [next, ...parkProfiles].slice(0, 200),
      parkPrefsBySkaterId: { ...parkPrefsBySkaterId, [ui.activeSkaterId]: next.id },
    });
    toast("Park added", `${next.name}${next.location ? ` • ${next.location}` : ""}`, "success");
    hydrateParkDraft(next);
  };

  const addAllParksFromLookup = () => {
    const results = toArray(parkLookupResults);
    if (!results.length) return;
    const existingKeys = new Set(parkProfiles.map((p) => parkIdentityKey(p.name, p.location)));
    const nextBatch = [];
    for (const r of results) {
      const location = [r.admin1, r.country].filter(Boolean).join(", ");
      const key = parkIdentityKey(r.name, location);
      if (existingKeys.has(key)) continue;
      existingKeys.add(key);
      nextBatch.push({
        id: `park-${uid()}`,
        name: r.name,
        location,
        lat: Number(r.lat),
        lon: Number(r.lon),
        notes: "Added from search",
      });
    }
    if (!nextBatch.length) {
      toast("No new parks", "All current results are already saved.", "info");
      return;
    }
    const first = nextBatch[0];
    setSlice({
      parkProfiles: [...nextBatch, ...parkProfiles].slice(0, 200),
      parkPrefsBySkaterId: { ...parkPrefsBySkaterId, [ui.activeSkaterId]: first.id },
    });
    hydrateParkDraft(first);
    toast("Parks added", `${nextBatch.length} location(s) saved to your park list.`, "success");
  };

  const saveSelectedParkEdits = () => {
    if (!selectedParkProfile) return;
    const nextName = String(parkDraft.name || "").trim();
    const nextLocation = String(parkDraft.location || "").trim();
    const nextNotes = String(parkDraft.notes || "").trim();
    const latRaw = String(parkDraft.lat || "").trim();
    const lonRaw = String(parkDraft.lon || "").trim();
    if (!nextName) {
      toast("Park name required", "Add a park name before saving.", "warn");
      return;
    }
    if (latRaw && !Number.isFinite(Number(latRaw))) {
      toast("Latitude invalid", "Enter a valid number for latitude.", "warn");
      return;
    }
    if (lonRaw && !Number.isFinite(Number(lonRaw))) {
      toast("Longitude invalid", "Enter a valid number for longitude.", "warn");
      return;
    }

    const nextPark = {
      ...selectedParkProfile,
      name: nextName,
      location: nextLocation,
      notes: nextNotes,
      lat: latRaw ? Number(latRaw) : null,
      lon: lonRaw ? Number(lonRaw) : null,
    };

    const shouldUpdateDraftPark =
      String(draft.park || "").trim().toLowerCase() === String(selectedParkProfile.name || "").trim().toLowerCase();

    setSlice({
      parkProfiles: parkProfiles.map((p) => (p.id === selectedParkProfile.id ? nextPark : p)),
      ...(shouldUpdateDraftPark ? { draft: { ...draft, park: nextName } } : {}),
    });
    toast("Park updated", `${nextPark.name}${nextPark.location ? ` • ${nextPark.location}` : ""}`, "success");
  };

  useEffect(() => {
    if (!selectedParkProfile) return;
    hydrateParkDraft(selectedParkProfile);
  }, [selectedParkId]);

  useEffect(() => {
    if (!selectedParkProfile) return;
    fetchWeatherForPark(selectedParkProfile);
  }, [selectedParkId]);

  useEffect(() => {
    storeRef.current = store;
  }, [store]);

  useEffect(() => {
    cloudSyncBusyRef.current = cloudSyncBusy;
  }, [cloudSyncBusy]);

  const exportBackupJSON = () => {
    downloadTextFile(`skateflow-backup-${todayISO()}.json`, JSON.stringify(store, null, 2), "application/json");
    toast("Backup exported", "JSON backup downloaded.", "success");
  };

  const importBackupFile = async (file) => {
    if (!file) return;
    if ((Number(file.size) || 0) > MAX_BACKUP_BYTES) {
      toast("Backup too large", "Please import a smaller backup file.", "warn");
      return;
    }
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== "object") throw new Error("Invalid backup format.");
      const merged = normalizeStoreShape(parsed);
      if (!confirm("Replace current local data with this backup?")) return;
      setStore(merged);
      toast("Backup restored", "Local data replaced from backup file.", "success");
    } catch (err) {
      toast("Import failed", err?.message || "Could not import backup JSON.", "warn");
    }
  };

  const updateCloudSync = (patch) => {
    const next = { ...cloudSync, ...patch };
    next.projectId = normalizeFirebaseProjectId(next.projectId);
    next.documentPath = cloudSafeDocPath(next.documentPath);
    next.autoSyncIntervalMin = Math.max(1, Number(next.autoSyncIntervalMin) || DEFAULT_CLOUD_SYNC.autoSyncIntervalMin);
    setSlice({ cloudSync: next });
  };

  const validateCloudSyncConfig = () => {
    const projectId = normalizeFirebaseProjectId(cloudSync.projectId);
    const apiKey = String(cloudSync.apiKey || "").trim();
    const documentPath = cloudSafeDocPath(cloudSync.documentPath);
    if (!projectId || !apiKey) {
      throw new Error("Add Firebase Project ID and Web API key first.");
    }
    return { ...cloudSync, projectId, apiKey, documentPath };
  };

  const parseFirestoreError = async (res) => {
    const raw = await res.text();
    let msg = "";
    try {
      const parsed = JSON.parse(raw);
      msg = parsed?.error?.message || raw || `HTTP ${res.status}`;
    } catch {
      msg = raw || `HTTP ${res.status}`;
    }
    if (/Permission denied on resource project/i.test(msg)) {
      return `${msg} Use lowercase project ID "skaterflow" and make sure Firestore Database is created in Firebase.`;
    }
    return msg;
  };

  const pushCloudSync = async (opts = {}) => {
    if (cloudSyncBusyRef.current) return false;
    const mode = opts?.mode === "auto" ? "auto" : "manual";
    const shouldToast = mode === "manual";
    try {
      setCloudSyncBusy(true);
      setCloudSyncError("");
      const cfg = validateCloudSyncConfig();
      const sourceStore = toObj(opts?.snapshot, null) || storeRef.current || store;
      const snapshot = makeCloudSafeStoreShape({
        ...sourceStore,
        cloudSync: { ...cfg, apiKey: "", enabled: true },
      });
      const payload = JSON.stringify(snapshot);
      const payloadBytes = new Blob([payload]).size;
      if (payloadBytes > 850000) {
        throw new Error(`Cloud payload too large (${formatBytes(payloadBytes)}). Trim media before syncing.`);
      }
      const url = buildFirestoreDocUrl(cfg);
      if (!url) throw new Error("Cloud sync URL is invalid.");
      const nowIso = new Date().toISOString();
      const body = {
        fields: {
          payload: { stringValue: payload },
          updatedAt: { timestampValue: nowIso },
          updatedBy: { stringValue: activeMember?.name || "SkateFlow" },
          buildStamp: { stringValue: BUILD_STAMP },
        },
      };
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        throw new Error(await parseFirestoreError(res));
      }
      updateCloudSync({
        projectId: cfg.projectId,
        apiKey: cfg.apiKey,
        documentPath: cfg.documentPath,
        enabled: true,
        lastSyncAt: nowIso,
        lastDirection: "push",
      });
      if (shouldToast) {
        toast("Cloud sync pushed", `Saved to Firestore (${cfg.documentPath}).`, "success");
      }
      return true;
    } catch (err) {
      const msg = err?.message || "Cloud push failed.";
      setCloudSyncError(msg);
      if (shouldToast) {
        toast("Cloud push failed", msg, "warn");
      }
      return false;
    } finally {
      setCloudSyncBusy(false);
    }
  };

  const pullCloudSync = async (opts = {}) => {
    if (cloudSyncBusyRef.current) return false;
    const mode = opts?.mode === "auto" ? "auto" : "manual";
    const shouldToast = mode === "manual";
    const skipConfirm = !!opts?.skipConfirm || mode === "auto";
    if (!skipConfirm && !confirm("Pull from cloud and replace local data on this device?")) return false;
    try {
      setCloudSyncBusy(true);
      setCloudSyncError("");
      const cfg = validateCloudSyncConfig();
      const url = buildFirestoreDocUrl(cfg);
      if (!url) throw new Error("Cloud sync URL is invalid.");
      const res = await fetch(url, { method: "GET" });
      if (res.status === 404) {
        throw new Error("No cloud document found yet. Push first from this or another device.");
      }
      if (!res.ok) {
        throw new Error(await parseFirestoreError(res));
      }
      const doc = await res.json();
      const payload = String(doc?.fields?.payload?.stringValue || "");
      if (!payload) {
        throw new Error("Cloud document has no app payload.");
      }
      const parsed = JSON.parse(payload);
      const normalized = makeCloudSafeStoreShape(parsed);
      const nowIso = new Date().toISOString();
      const currentLocalStore = storeRef.current || store;
      const merged = normalizeStoreShape({
        ...normalized,
        cloudSync: {
          ...DEFAULT_CLOUD_SYNC,
          ...toObj(normalized.cloudSync, {}),
          projectId: cfg.projectId,
          apiKey: cfg.apiKey,
          documentPath: cfg.documentPath,
          enabled: true,
          lastSyncAt: nowIso,
          lastDirection: "pull",
        },
        auth: currentLocalStore.auth,
        ui: currentLocalStore.ui,
      });
      setStore(merged);
      if (shouldToast) {
        toast("Cloud sync pulled", `Loaded from Firestore (${cfg.documentPath}).`, "success");
      }
      return true;
    } catch (err) {
      const msg = err?.message || "Cloud pull failed.";
      setCloudSyncError(msg);
      if (shouldToast) {
        toast("Cloud pull failed", msg, "warn");
      }
      return false;
    } finally {
      setCloudSyncBusy(false);
    }
  };

  useEffect(() => {
    const isReady = !!(
      cloudSync.autoSyncEnabled &&
      String(cloudSync.projectId || "").trim() &&
      String(cloudSync.apiKey || "").trim()
    );
    if (!isReady) {
      autoSyncBootKeyRef.current = "";
      return;
    }
    if (!cloudSync.autoPullOnLoad) return;
    const key = `${String(cloudSync.projectId || "").trim()}|${cloudSafeDocPath(cloudSync.documentPath)}|${String(cloudSync.apiKey || "").trim()}`;
    if (autoSyncBootKeyRef.current === key) return;
    autoSyncBootKeyRef.current = key;
    void pullCloudSync({ mode: "auto", skipConfirm: true });
  }, [cloudSync.autoSyncEnabled, cloudSync.autoPullOnLoad, cloudSync.projectId, cloudSync.apiKey, cloudSync.documentPath]);

  useEffect(() => {
    const isReady = !!(
      cloudSync.autoSyncEnabled &&
      String(cloudSync.projectId || "").trim() &&
      String(cloudSync.apiKey || "").trim()
    );
    if (!isReady) return;
    const intervalMin = Math.max(1, Number(cloudSync.autoSyncIntervalMin) || DEFAULT_CLOUD_SYNC.autoSyncIntervalMin);
    const timerId = window.setInterval(() => {
      if (cloudSyncBusyRef.current) return;
      const snapshot = storeRef.current;
      void (async () => {
        const pushed = await pushCloudSync({ mode: "auto", snapshot });
        if (!pushed) return;
        await pullCloudSync({ mode: "auto", skipConfirm: true });
      })();
    }, intervalMin * 60 * 1000);
    return () => window.clearInterval(timerId);
  }, [cloudSync.autoSyncEnabled, cloudSync.autoSyncIntervalMin, cloudSync.projectId, cloudSync.apiKey, cloudSync.documentPath]);

  const shareSessionCard = async (session) => {
    if (!session) return;
    const donePct = pct(session.totalCompleted || 0, session.totalTarget || 1);
    const text = `${session.skaterName} • ${session.dayType}\n${session.date} • ${session.park || "Unknown Park"}\nScore ${donePct}% • OVR ${computeOVR(session)} • XP +${session.xpGained ?? 0}`;
    const hero = pickHeroMedia(session.media || []);
    const heroSource = mediaSrc(hero);

    try {
      if (navigator.share) {
        if (heroSource && navigator.canShare) {
          try {
            const blob = await fetch(heroSource).then((r) => r.blob());
            const ext = blob.type.startsWith("video/") ? "mp4" : "jpg";
            const file = new File([blob], `skateflow-card.${ext}`, { type: blob.type || "application/octet-stream" });
            if (navigator.canShare({ files: [file] })) {
              await navigator.share({ title: "SkateFlow Card", text, files: [file] });
              return;
            }
          } catch {
            // fall through to text share
          }
        }
        await navigator.share({ title: "SkateFlow Card", text });
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        toast("Card copied", "Card summary copied to clipboard.", "success");
      } else {
        toast("Share unsupported", "Your browser does not support share/clipboard APIs.", "warn");
      }
    } catch {
      // user canceled or share failed
    }
  };

  const [coachDraft, setCoachDraft] = useState({ title: "", taskLabel: "", notes: "" });
  const coachTaskOptions = useMemo(
    () => [...new Set(Object.values(plans || {}).flatMap((dayTasks) => (dayTasks || []).map((t) => t.label).filter(Boolean)))],
    [plans]
  );
  const activeCoachItems = coachCornerBySkaterId[ui.activeSkaterId] || [];

  const addCoachDemoFromFiles = async (fileList) => {
    if (!activeSkater) return;
    const { valid: files, stats } = guardUploadFiles(fileList, {
      maxCount: MAX_UPLOAD_COUNT,
      maxBytes: MAX_MEDIA_FILE_BYTES,
      allowedPrefixes: ["image/", "video/"],
    });
    if (!files.length) {
      toast("No demo media added", "Files were invalid, too large, or unsupported.", "warn");
      return;
    }
    const processed = await Promise.all(
      files.map(async (f) => {
        if (f.type?.startsWith("image/")) {
          try {
            return await compressImageFile(f, { maxW: 1600, maxH: 1600, quality: 0.82, maxBytes: MAX_EMBEDDED_MEDIA_BYTES });
          } catch {
            return f;
          }
        }
        return f;
      })
    );
    const media = await Promise.all(
      processed.map(async (f) => {
        let dataUrl = "";
        if ((Number(f.size) || 0) <= MAX_EMBEDDED_MEDIA_BYTES) {
          try {
            dataUrl = await fileToDataUrl(f);
          } catch {
            dataUrl = "";
          }
        }
        return {
          id: `cm-${uid()}`,
          type: f.type,
          name: f.name,
          size: f.size,
          url: URL.createObjectURL(f),
          dataUrl,
        };
      })
    );
    const nextDemo = {
      id: `demo-${uid()}`,
      title: String(coachDraft.title || coachDraft.taskLabel || "Trick Demo").trim(),
      taskLabel: String(coachDraft.taskLabel || "").trim(),
      notes: String(coachDraft.notes || "").trim(),
      media,
      createdBy: activeMember?.name || "",
      createdAt: new Date().toISOString(),
    };
    setSlice({
      coachCornerBySkaterId: {
        ...coachCornerBySkaterId,
        [ui.activeSkaterId]: [nextDemo, ...(coachCornerBySkaterId[ui.activeSkaterId] || [])].slice(0, 300),
      },
    });
    setCoachDraft({ title: "", taskLabel: "", notes: "" });
    toast("Coach demo added", `${media.length} media item(s) saved.`, "success");
    if (stats.trimmed || stats.tooLarge || stats.wrongType) {
      toast(
        "Some files skipped",
        `${stats.trimmed ? `${stats.trimmed} over limit, ` : ""}${stats.tooLarge ? `${stats.tooLarge} too large, ` : ""}${stats.wrongType ? `${stats.wrongType} wrong type` : ""}`.replace(/, $/, ""),
        "warn"
      );
    }
  };

  const deleteCoachDemo = (demoId) => {
    const list = coachCornerBySkaterId[ui.activeSkaterId] || [];
    const found = list.find((x) => x.id === demoId);
    if (!found) return;
    for (const m of found.media || []) if (m?.url) safeRevokeObjectURL(m.url);
    setSlice({
      coachCornerBySkaterId: {
        ...coachCornerBySkaterId,
        [ui.activeSkaterId]: list.filter((x) => x.id !== demoId),
      },
    });
    toast("Coach demo removed", "Demo deleted.", "warn");
  };

  const defaultContestState = { eventName: "", eventDate: todayISO(), round: "Qualifiers", runs: [] };
  const contestState = contestBySkaterId[ui.activeSkaterId] || defaultContestState;
  const setContestState = (next) =>
    setSlice({
      contestBySkaterId: {
        ...contestBySkaterId,
        [ui.activeSkaterId]: next,
      },
    });

  const patchContestState = (patch) => setContestState({ ...contestState, ...patch });

  const addContestRun = () => {
    const nextRun = {
      id: `run-${uid()}`,
      runNo: (contestState.runs || []).length + 1,
      round: contestState.round || "Qualifiers",
      durationSec: 45,
      song: "",
      musicUrl: "",
      bpm: "",
      dropAt: "",
      score: "",
      notes: "",
      tricks: [],
      media: [],
      createdAt: new Date().toISOString(),
    };
    patchContestState({ runs: [...(contestState.runs || []), nextRun] });
    toast("Run added", `Run ${nextRun.runNo} created.`, "success");
  };

  const updateContestRun = (runId, patch) => {
    patchContestState({
      runs: (contestState.runs || []).map((r) => (r.id === runId ? { ...r, ...patch } : r)),
    });
  };

  const contestRunMusicQuery = (run) =>
    [String(run?.song || "").trim(), run?.bpm ? `${run.bpm} bpm` : "", String(contestState.eventName || "").trim()].filter(Boolean).join(" ");

  const setContestRunMusicLink = (runId, provider) => {
    const run = (contestState.runs || []).find((r) => r.id === runId);
    if (!run) return;
    const query = contestRunMusicQuery(run);
    if (!query) {
      toast("Add song details first", "Type song/artist (and optional BPM) before search.", "warn");
      return;
    }
    const nextUrl = buildMusicSearchUrl(provider, query);
    if (!nextUrl) return;
    updateContestRun(runId, { musicUrl: nextUrl });
    toast("Music link set", `${provider === "youtube" ? "YouTube" : "Apple Music"} search link added.`, "success");
  };

  const openContestRunMusicLink = (run) => {
    const url = normalizeExternalUrl(run?.musicUrl || "");
    if (!isOpenableExternalUrl(url)) {
      toast("Invalid music link", "Add a full URL (YouTube or Apple Music).", "warn");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const deleteContestRun = (runId) => {
    if (!confirm("Delete this run?")) return;
    const found = (contestState.runs || []).find((r) => r.id === runId);
    if (found?.media?.length) for (const m of found.media) if (m?.url) safeRevokeObjectURL(m.url);
    patchContestState({
      runs: (contestState.runs || []).filter((r) => r.id !== runId),
    });
  };

  const moveContestRun = (runId, dir) => {
    const list = [...(contestState.runs || [])];
    const idx = list.findIndex((r) => r.id === runId);
    if (idx < 0) return;
    const nextIdx = idx + dir;
    if (nextIdx < 0 || nextIdx >= list.length) return;
    const [item] = list.splice(idx, 1);
    list.splice(nextIdx, 0, item);
    patchContestState({ runs: list.map((r, i) => ({ ...r, runNo: i + 1 })) });
  };

  const addContestTrick = (runId) => {
    updateContestRun(runId, {
      tricks: [
        ...(((contestState.runs || []).find((r) => r.id === runId)?.tricks || [])),
        { id: `trk-${uid()}`, name: "", landed: false, notes: "" },
      ],
    });
  };

  const updateContestTrick = (runId, trickId, patch) => {
    const run = (contestState.runs || []).find((r) => r.id === runId);
    if (!run) return;
    updateContestRun(runId, {
      tricks: (run.tricks || []).map((t) => (t.id === trickId ? { ...t, ...patch } : t)),
    });
  };

  const removeContestTrick = (runId, trickId) => {
    const run = (contestState.runs || []).find((r) => r.id === runId);
    if (!run) return;
    updateContestRun(runId, {
      tricks: (run.tricks || []).filter((t) => t.id !== trickId),
    });
  };

  const addContestMediaFromFiles = async (runId, fileList) => {
    const run = (contestState.runs || []).find((r) => r.id === runId);
    if (!run) return;
    const { valid: files, stats } = guardUploadFiles(fileList, {
      maxCount: MAX_UPLOAD_COUNT,
      maxBytes: MAX_MEDIA_FILE_BYTES,
      allowedPrefixes: ["image/", "video/"],
    });
    if (!files.length) {
      toast("No run media added", "Files were invalid, too large, or unsupported.", "warn");
      return;
    }
    const processed = await Promise.all(
      files.map(async (f) => {
        if (f.type?.startsWith("image/")) {
          try {
            return await compressImageFile(f, { maxW: 1600, maxH: 1600, quality: 0.82, maxBytes: MAX_EMBEDDED_MEDIA_BYTES });
          } catch {
            return f;
          }
        }
        return f;
      })
    );
    const media = await Promise.all(
      processed.map(async (f) => {
        let dataUrl = "";
        if ((Number(f.size) || 0) <= MAX_EMBEDDED_MEDIA_BYTES) {
          try {
            dataUrl = await fileToDataUrl(f);
          } catch {
            dataUrl = "";
          }
        }
        return {
          id: `crm-${uid()}`,
          type: f.type,
          name: f.name,
          size: f.size,
          url: URL.createObjectURL(f),
          dataUrl,
        };
      })
    );
    updateContestRun(runId, { media: [...(run.media || []), ...media] });
    toast("Run media added", `${media.length} item(s) saved.`, "success");
    if (stats.trimmed || stats.tooLarge || stats.wrongType) {
      toast(
        "Some files skipped",
        `${stats.trimmed ? `${stats.trimmed} over limit, ` : ""}${stats.tooLarge ? `${stats.tooLarge} too large, ` : ""}${stats.wrongType ? `${stats.wrongType} wrong type` : ""}`.replace(/, $/, ""),
        "warn"
      );
    }
  };

  const removeContestMedia = (runId, mediaId) => {
    const run = (contestState.runs || []).find((r) => r.id === runId);
    if (!run) return;
    const found = (run.media || []).find((m) => m.id === mediaId);
    if (found?.url) safeRevokeObjectURL(found.url);
    updateContestRun(runId, { media: (run.media || []).filter((m) => m.id !== mediaId) });
  };

  const freshSkateDayDraft = () => ({
    title: "Monthly Skate Day",
    dateISO: todayISO(),
    park: "",
    notes: "",
    withCoach: true,
    withSkater: true,
  });
  const [skateDayDraft, setSkateDayDraft] = useState(() => freshSkateDayDraft());
  const activeSkateDays = skateDaysBySkaterId[ui.activeSkaterId] || [];
  const setSkateDaysForActiveSkater = (next) =>
    setStore((prev) => ({
      ...(prev || {}),
      skateDaysBySkaterId: {
        ...(prev?.skateDaysBySkaterId || {}),
        [ui.activeSkaterId]: next,
      },
    }));

  const addSkateDayEntry = () => {
    if (!activeSkater) return;
    const next = {
      id: `sd-${uid()}`,
      title: String(skateDayDraft.title || "Monthly Skate Day").trim(),
      dateISO: String(skateDayDraft.dateISO || todayISO()),
      park: String(skateDayDraft.park || "").trim(),
      notes: String(skateDayDraft.notes || "").trim(),
      withCoach: !!skateDayDraft.withCoach,
      withSkater: !!skateDayDraft.withSkater,
      createdBy: activeMember?.name || "",
      createdAt: new Date().toISOString(),
      media: [],
    };
    setSkateDaysForActiveSkater([next, ...activeSkateDays].slice(0, 200));
    setSkateDayDraft((prev) => ({ ...prev, notes: "" }));
    toast("Skate day created", `${next.dateISO}${next.park ? ` • ${next.park}` : ""}`, "success");
  };

  const updateSkateDayEntry = (entryId, patch) => {
    setStore((prev) => {
      const map = prev?.skateDaysBySkaterId || {};
      const list = (map[ui.activeSkaterId] || []).map((d) => (d.id === entryId ? { ...d, ...patch } : d));
      return {
        ...(prev || {}),
        skateDaysBySkaterId: {
          ...map,
          [ui.activeSkaterId]: list,
        },
      };
    });
  };

  const deleteSkateDayEntry = (entryId) => {
    if (!confirm("Delete this skate day entry?")) return;
    const found = activeSkateDays.find((d) => d.id === entryId);
    if (found?.media?.length) for (const m of found.media) if (m?.url) safeRevokeObjectURL(m.url);
    setSkateDaysForActiveSkater(activeSkateDays.filter((d) => d.id !== entryId));
    toast("Skate day removed", "Entry deleted.", "warn");
  };

  const addSkateDayMediaFromFiles = async (entryId, fileList) => {
    const entry = activeSkateDays.find((d) => d.id === entryId);
    if (!entry) return;
    const { valid: files, stats } = guardUploadFiles(fileList, {
      maxCount: MAX_UPLOAD_COUNT,
      maxBytes: MAX_MEDIA_FILE_BYTES,
      allowedPrefixes: ["image/", "video/"],
    });
    if (!files.length) {
      toast("No skate day media added", "Files were invalid, too large, or unsupported.", "warn");
      return;
    }
    const processed = await Promise.all(
      files.map(async (f) => {
        if (f.type?.startsWith("image/")) {
          try {
            return await compressImageFile(f, { maxW: 1600, maxH: 1600, quality: 0.82, maxBytes: MAX_EMBEDDED_MEDIA_BYTES });
          } catch {
            return f;
          }
        }
        return f;
      })
    );
    const media = await Promise.all(
      processed.map(async (f) => {
        let dataUrl = "";
        if ((Number(f.size) || 0) <= MAX_EMBEDDED_MEDIA_BYTES) {
          try {
            dataUrl = await fileToDataUrl(f);
          } catch {
            dataUrl = "";
          }
        }
        return {
          id: `sdm-${uid()}`,
          type: f.type,
          name: f.name,
          size: f.size,
          url: URL.createObjectURL(f),
          dataUrl,
        };
      })
    );
    updateSkateDayEntry(entryId, { media: [...(entry.media || []), ...media] });
    toast("Skate day media added", `${media.length} item(s) uploaded.`, "success");
    if (stats.trimmed || stats.tooLarge || stats.wrongType) {
      toast(
        "Some files skipped",
        `${stats.trimmed ? `${stats.trimmed} over limit, ` : ""}${stats.tooLarge ? `${stats.tooLarge} too large, ` : ""}${stats.wrongType ? `${stats.wrongType} wrong type` : ""}`.replace(/, $/, ""),
        "warn"
      );
    }
  };

  const removeSkateDayMedia = (entryId, mediaId) => {
    const entry = activeSkateDays.find((d) => d.id === entryId);
    if (!entry) return;
    const found = (entry.media || []).find((m) => m.id === mediaId);
    if (found?.url) safeRevokeObjectURL(found.url);
    updateSkateDayEntry(entryId, { media: (entry.media || []).filter((m) => m.id !== mediaId) });
  };

  const contestLeaderboard = useMemo(() => {
    return [...(contestState.runs || [])]
      .map((r) => ({ ...r, scoreNum: Number(r.score) || 0 }))
      .sort((a, b) => b.scoreNum - a.scoreNum || a.runNo - b.runNo);
  }, [contestState.runs]);

  const [runTimerSec, setRunTimerSec] = useState(0);
  const [runTimerLabel, setRunTimerLabel] = useState("");
  useEffect(() => {
    if (runTimerSec <= 0) return undefined;
    const t = window.setInterval(() => {
      setRunTimerSec((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearInterval(t);
  }, [runTimerSec]);

  const startRunTimer = (run) => {
    const sec = Math.max(5, Number(run?.durationSec) || 45);
    setRunTimerSec(sec);
    setRunTimerLabel(`Run ${run?.runNo || ""}`.trim());
  };

  const [healthReport, setHealthReport] = useState(null);

  const buildHealthReport = (inputStore = store) => {
    const normalized = normalizeStoreShape(inputStore);
    const checks = [];
    const addCheck = (id, title, status, detail) => {
      checks.push({ id, title, status, detail: String(detail || "") });
    };

    const members2 = toArray(normalized.members);
    const skaters2 = toArray(normalized.skaters);
    const sessions2 = toArray(normalized.sessions);
    const draft2 = toObj(normalized.draft, {});
    const ui2 = toObj(normalized.ui, {});
    const practiceEvents2 = toArray(normalized.practiceEvents);
    const xpBySkater2 = toObj(normalized.xpBySkaterId, {});
    const contestBySkater2 = toObj(normalized.contestBySkaterId, {});
    const coachBySkater2 = toObj(normalized.coachCornerBySkaterId, {});
    const skateDaysBySkater2 = toObj(normalized.skateDaysBySkaterId, {});
    const plans2 = toObj(normalized.plans, {});

    const memberIds = members2.map((m) => String(m?.id || "")).filter(Boolean);
    const skaterIds = skaters2.map((s) => String(s?.id || "")).filter(Boolean);
    const memberSet = new Set(memberIds);
    const skaterSet = new Set(skaterIds);
    const dupMemberCount = memberIds.length - memberSet.size;
    const dupSkaterCount = skaterIds.length - skaterSet.size;

    addCheck("members_present", "Members exist", memberIds.length ? "pass" : "fail", memberIds.length ? `${memberIds.length} member(s)` : "No members found");
    addCheck("skaters_present", "Skaters exist", skaterIds.length ? "pass" : "fail", skaterIds.length ? `${skaterIds.length} skater(s)` : "No skaters found");
    addCheck(
      "unique_member_ids",
      "Member IDs unique",
      dupMemberCount ? "fail" : "pass",
      dupMemberCount ? `${dupMemberCount} duplicate member ID(s)` : "No duplicates"
    );
    addCheck(
      "unique_skater_ids",
      "Skater IDs unique",
      dupSkaterCount ? "fail" : "pass",
      dupSkaterCount ? `${dupSkaterCount} duplicate skater ID(s)` : "No duplicates"
    );

    const activeMemberOk = memberSet.has(String(ui2.activeMemberId || ""));
    const activeSkaterOk = skaterSet.has(String(ui2.activeSkaterId || ""));
    addCheck("active_member", "Active member is valid", activeMemberOk ? "pass" : "warn", activeMemberOk ? String(ui2.activeMemberId || "") : "Active member missing");
    addCheck("active_skater", "Active skater is valid", activeSkaterOk ? "pass" : "warn", activeSkaterOk ? String(ui2.activeSkaterId || "") : "Active skater missing");

    addCheck(
      "ui_view_valid",
      "UI tab value is valid",
      VALID_VIEWS.has(String(ui2.view || "")) ? "pass" : "warn",
      `View: ${String(ui2.view || "(missing)")}`
    );

    const draftDayExists = !!plans2[String(draft2.dayType || "")];
    addCheck(
      "draft_day_type",
      "Draft day type exists in plans",
      draftDayExists ? "pass" : "warn",
      draftDayExists ? String(draft2.dayType || "") : `Missing day type: ${String(draft2.dayType || "(empty)")}`
    );

    let sessionMissingSkater = 0;
    let sessionTotalsMismatch = 0;
    let sessionInvalidDate = 0;
    let sessionInvalidTask = 0;
    let sessionInvalidMedia = 0;
    for (const s of sessions2) {
      if (!skaterSet.has(String(s?.skaterId || ""))) sessionMissingSkater += 1;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(s?.date || ""))) sessionInvalidDate += 1;
      const tasks2 = toArray(s?.tasks);
      const sumTarget = tasks2.reduce((sum, t) => sum + Math.max(0, Number(t?.target) || 0), 0);
      const sumCompleted = tasks2.reduce((sum, t) => sum + Math.max(0, Number(t?.completed) || 0), 0);
      if ((Number(s?.totalTarget) || 0) !== sumTarget || (Number(s?.totalCompleted) || 0) !== sumCompleted) sessionTotalsMismatch += 1;
      if (tasks2.some((t) => !String(t?.taskId || ""))) sessionInvalidTask += 1;
      const media2 = toArray(s?.media);
      if (media2.some((m) => m?.url && !/^(blob:|data:|https?:)/.test(String(m.url)))) sessionInvalidMedia += 1;
    }
    addCheck(
      "session_skater_links",
      "Sessions reference valid skaters",
      sessionMissingSkater ? "warn" : "pass",
      sessionMissingSkater ? `${sessionMissingSkater} session(s) reference missing skater IDs` : "All linked"
    );
    addCheck(
      "session_totals",
      "Session totals match task sums",
      sessionTotalsMismatch ? "warn" : "pass",
      sessionTotalsMismatch ? `${sessionTotalsMismatch} session(s) have mismatched totals` : "All totals consistent"
    );
    addCheck(
      "session_dates",
      "Session dates are valid ISO",
      sessionInvalidDate ? "warn" : "pass",
      sessionInvalidDate ? `${sessionInvalidDate} invalid session date(s)` : "All dates valid"
    );
    addCheck(
      "session_task_rows",
      "Session tasks have required IDs",
      sessionInvalidTask ? "warn" : "pass",
      sessionInvalidTask ? `${sessionInvalidTask} session(s) have malformed task rows` : "Task rows look good"
    );
    addCheck(
      "session_media_urls",
      "Session media URLs look valid",
      sessionInvalidMedia ? "warn" : "pass",
      sessionInvalidMedia ? `${sessionInvalidMedia} session(s) have suspicious media URLs` : "Media URLs look good"
    );

    let practiceInvalid = 0;
    for (const ev of practiceEvents2) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(ev?.dateISO || "")) || !/^\d{2}:\d{2}$/.test(String(ev?.time || ""))) {
        practiceInvalid += 1;
      }
    }
    addCheck(
      "practice_events",
      "Practice events have valid date/time",
      practiceInvalid ? "warn" : "pass",
      practiceInvalid ? `${practiceInvalid} event(s) malformed` : `${practiceEvents2.length} valid event(s)`
    );

    const unknownXPKeys = Object.keys(xpBySkater2).filter((k) => !skaterSet.has(String(k)));
    addCheck(
      "xp_keys",
      "XP map keys match skaters",
      unknownXPKeys.length ? "warn" : "pass",
      unknownXPKeys.length ? `${unknownXPKeys.length} orphan XP key(s)` : "XP map clean"
    );

    const unknownContestKeys = Object.keys(contestBySkater2).filter((k) => !skaterSet.has(String(k)));
    const unknownCoachKeys = Object.keys(coachBySkater2).filter((k) => !skaterSet.has(String(k)));
    const unknownSkateDayKeys = Object.keys(skateDaysBySkater2).filter((k) => !skaterSet.has(String(k)));
    addCheck(
      "contest_keys",
      "Contest map keys match skaters",
      unknownContestKeys.length ? "warn" : "pass",
      unknownContestKeys.length ? `${unknownContestKeys.length} orphan contest key(s)` : "Contest map clean"
    );
    addCheck(
      "coach_keys",
      "Coach map keys match skaters",
      unknownCoachKeys.length ? "warn" : "pass",
      unknownCoachKeys.length ? `${unknownCoachKeys.length} orphan coach key(s)` : "Coach map clean"
    );
    addCheck(
      "skateday_keys",
      "Skate day map keys match skaters",
      unknownSkateDayKeys.length ? "warn" : "pass",
      unknownSkateDayKeys.length ? `${unknownSkateDayKeys.length} orphan skate day key(s)` : "Skate day map clean"
    );

    const summary = checks.reduce(
      (acc, c) => {
        acc.total += 1;
        if (c.status === "fail") acc.fail += 1;
        else if (c.status === "warn") acc.warn += 1;
        else acc.pass += 1;
        return acc;
      },
      { total: 0, pass: 0, warn: 0, fail: 0 }
    );

    return {
      generatedAt: new Date().toISOString(),
      summary,
      checks,
      meta: {
        sessions: sessions2.length,
        practiceEvents: practiceEvents2.length,
        skaters: skaterIds.length,
        members: memberIds.length,
      },
    };
  };

  const runHealthCheck = () => {
    const report = buildHealthReport(store);
    setHealthReport(report);
    if (report.summary.fail > 0) {
      toast("Health check found failures", `${report.summary.fail} fail • ${report.summary.warn} warn`, "warn");
    } else if (report.summary.warn > 0) {
      toast("Health check warnings", `${report.summary.warn} warning(s)`, "warn");
    } else {
      toast("Health check clean", "All checks passed.", "success");
    }
  };

  const repairStoreNow = () => {
    const repaired = normalizeStoreShape(store);
    setStore(repaired);
    const report = buildHealthReport(repaired);
    setHealthReport(report);
    toast("Store repaired", "Applied safe data normalization.", report.summary.fail > 0 ? "warn" : "success");
  };

  const exportHealthReport = () => {
    if (!healthReport) {
      toast("No report yet", "Run Health Check first.", "warn");
      return;
    }
    downloadTextFile(`skateflow-health-${todayISO()}.json`, JSON.stringify(healthReport, null, 2), "application/json");
    toast("Health report exported", "Diagnostics JSON downloaded.", "success");
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

  const updateMissed = (task, nextValue) => {
    const next = clampNum(nextValue);
    if (next === "") {
      setDraft({ missedByTaskId: { ...(draft.missedByTaskId || {}), [task.id]: "" } });
      return;
    }
    const nextNum = Number(next) || 0;
    setDraft({ missedByTaskId: { ...(draft.missedByTaskId || {}), [task.id]: nextNum } });
  };

  const bumpMissed = (task, delta) => {
    const cur = Number(draft.missedByTaskId?.[task.id]) || 0;
    updateMissed(task, Math.max(0, cur + delta));
  };

  const resetDraft = () => {
    if (!confirm("Reset this session draft?")) return;
    revokeAllDraftMedia();
    setDraft({ date: todayISO(), park: "", dayType: Object.keys(plans)[0] || "Grind Day", completedByTaskId: {}, missedByTaskId: {} });
    toast("Draft reset", "Session builder cleared.", "info");
  };

  const saveSession = () => {
    if (!activeSkater) return;

    const taskRecords = tasks.map((t) => ({
      taskId: t.id,
      label: t.label,
      target: Number(t.target) || 0,
      completed: Number(draft.completedByTaskId?.[t.id]) || 0,
      missed: Number(draft.missedByTaskId?.[t.id]) || 0,
      notes: t.notes || "",
    }));

    const totalTarget2 = taskRecords.reduce((s, r) => s + r.target, 0);
    const totalCompleted2 = taskRecords.reduce((s, r) => s + r.completed, 0);
    const pct2 = pct(totalCompleted2, totalTarget2 || 1);
    const freePlayEarned = pct2 >= 50;

    const sessionMedia = draftMedia.map((m) => {
      const copy = { ...m };
      // Prefer persisted data URLs for saved sessions and release unused object URLs.
      if (copy.dataUrl) {
        safeRevokeObjectURL(copy.url);
        copy.url = "";
      }
      return copy;
    });

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
      media: sessionMedia,
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
    const nonEmbeddedCount = sessionMedia.filter((m) => !m?.dataUrl).length;

    const milestoneStep = 500;
    const prevMilestone = Math.floor(prevXP / milestoneStep);
    const nextMilestone = Math.floor(nextXP / milestoneStep);
    const milestoneHit = nextMilestone > prevMilestone;

    setSlice({
      sessions: [session, ...sessions],
      xpBySkaterId: { ...xpBySkaterId, [activeSkater.id]: nextXP },
      xpMilestonesBySkaterId: { ...xpMilestonesBySkaterId, [activeSkater.id]: nextMilestone },
    });
    if (nonEmbeddedCount > 0) {
      toast(
        "Large media note",
        `${nonEmbeddedCount} item(s) are saved only in this browser session. Trim/compress for durable local backup.`,
        "warn"
      );
    }
    const popId = `xp-${uid()}`;
    setXpPop({ id: popId, amount: gainedXP, levelUp: nextLvl.key !== prevLvl.key });
    window.setTimeout(() => {
      setXpPop((prev) => (prev?.id === popId ? null : prev));
    }, 1400);

    // Keep object URLs for non-embedded media that were moved into the saved session.
    revokeAllDraftMedia({ revoke: false });
    setDraft({ date: todayISO(), park: "", dayType: draft.dayType, completedByTaskId: {}, missedByTaskId: {} });

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
    if (found?.media?.length) for (const m of found.media) if (m?.url) safeRevokeObjectURL(m.url);
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

  const openSessionEditor = (session) => {
    if (!session) return;
    setSessionEdit({
      open: true,
      sessionId: session.id,
      date: session.date || todayISO(),
      park: session.park || "",
      dayType: session.dayType || "",
      tasks: (session.tasks || []).map((t) => ({
        taskId: t.taskId,
        label: t.label || "",
        target: Number(t.target) || 0,
        completed: Number(t.completed) || 0,
        missed: Number(t.missed) || 0,
        notes: t.notes || "",
      })),
    });
  };

  const closeSessionEditor = () => {
    setSessionEdit((prev) => ({ ...prev, open: false }));
  };

  const updateSessionEditTaskCompleted = (taskId, nextValue) => {
    const next = clampNum(nextValue);
    setSessionEdit((prev) => ({
      ...prev,
      tasks: (prev.tasks || []).map((t) =>
        t.taskId === taskId
          ? {
              ...t,
              completed: next === "" ? 0 : Number(next) || 0,
            }
          : t
      ),
    }));
  };

  const updateSessionEditTaskMissed = (taskId, nextValue) => {
    const next = clampNum(nextValue);
    setSessionEdit((prev) => ({
      ...prev,
      tasks: (prev.tasks || []).map((t) =>
        t.taskId === taskId
          ? {
              ...t,
              missed: next === "" ? 0 : Number(next) || 0,
            }
          : t
      ),
    }));
  };

  const saveSessionEdit = () => {
    if (!sessionEdit.sessionId) return;
    const current = sessions.find((s) => s.id === sessionEdit.sessionId);
    if (!current) {
      closeSessionEditor();
      return;
    }

    const updatedTasks = (sessionEdit.tasks || []).map((t) => ({
      ...t,
      target: Number(t.target) || 0,
      completed: Math.max(0, Number(t.completed) || 0),
      missed: Math.max(0, Number(t.missed) || 0),
    }));

    const totalTarget2 = updatedTasks.reduce((sum, t) => sum + (Number(t.target) || 0), 0);
    const totalCompleted2 = updatedTasks.reduce((sum, t) => sum + (Number(t.completed) || 0), 0);
    const freePlayEarned = pct(totalCompleted2, totalTarget2 || 1) >= 50;

    const updatedBase = {
      ...current,
      date: sessionEdit.date || current.date,
      park: String(sessionEdit.park || "").trim(),
      dayType: sessionEdit.dayType || current.dayType,
      tasks: updatedTasks,
      totalTarget: totalTarget2,
      totalCompleted: totalCompleted2,
      freePlayEarned,
    };

    const oldXp = Number(current.xpGained ?? xpForSession(current));
    const newXp = xpForSession(updatedBase);
    const xpDelta = newXp - oldXp;
    const nextXpTotalAfter = Number(current.xpTotalAfter);

    const updatedSession = {
      ...updatedBase,
      xpGained: newXp,
      xpTotalAfter: Number.isFinite(nextXpTotalAfter) ? Math.max(0, nextXpTotalAfter + xpDelta) : current.xpTotalAfter,
    };

    const nextXPForSkater = Math.max(0, Number(xpBySkaterId[current.skaterId] || 0) + xpDelta);

    setSlice({
      sessions: sessions.map((s) => (s.id === current.id ? updatedSession : s)),
      xpBySkaterId: { ...xpBySkaterId, [current.skaterId]: nextXPForSkater },
    });

    closeSessionEditor();
    toast("Session updated", `${updatedSession.dayType} • ${pct(updatedSession.totalCompleted, updatedSession.totalTarget || 1)}%`, "success");
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
    setSlice({
      skaters: skaters.map((s) => (s.id === skater.id ? { ...s, name: nextName } : s)),
      sessions: sessions.map((sess) => (sess.skaterId === skater.id ? { ...sess, skaterName: nextName } : sess)),
    });
    toast("Skater renamed", `Updated to ${nextName}.`, "info");
  };

  const deleteSkater = (skater) => {
    if (!confirm(`Delete ${skater.name}?`)) return;
    const skateDayList = skateDaysBySkaterId[skater.id] || [];
    for (const day of skateDayList) {
      for (const m of day.media || []) if (m?.url) safeRevokeObjectURL(m.url);
    }
    setSlice({
      skaters: skaters.filter((s) => s.id !== skater.id),
      sessions: sessions.filter((s) => s.skaterId !== skater.id),
      skateDaysBySkaterId: Object.fromEntries(Object.entries(skateDaysBySkaterId).filter(([k]) => k !== skater.id)),
      ui: {
        ...ui,
        activeSkaterId:
          ui.activeSkaterId === skater.id ? (skaters.find((s) => s.id !== skater.id)?.id || skaters[0]?.id) : ui.activeSkaterId,
      },
    });
    toast("Skater removed", `${skater.name} removed.`, "warn");
  };

  const uploadSkaterPhoto = async (skater, file) => {
    if (!file || !file.type.startsWith("image/")) {
      toast("Invalid photo", "Please upload an image file.", "warn");
      return;
    }
    if ((Number(file.size) || 0) > MAX_IMAGE_FILE_BYTES) {
      toast("Photo too large", "Use an image under 25MB.", "warn");
      return;
    }
    try {
      const compressed = await compressImageFile(file, { maxW: 1400, maxH: 1400, quality: 0.84, maxBytes: 900 * 1024 });
      const photoUrl = await fileToDataUrl(compressed);
      setSlice({ skaters: skaters.map((s) => (s.id === skater.id ? { ...s, photoUrl } : s)) });
      toast("Photo updated", `New photo for ${skater.name}.`, "success");
    } catch {
      toast("Photo failed", "Could not process image.", "warn");
    }
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

  useEffect(() => {
    if (!reminders.enabled) return undefined;
    if (typeof Notification === "undefined") return undefined;
    if (Notification.permission !== "granted") return undefined;
    const timerId = window.setInterval(() => {
      const now = Date.now();
      for (const ev of activePracticeEvents) {
        const eventAt = parseLocalDateTime(ev.dateISO, ev.time).getTime();
        const remindMin = Math.max(0, Number(ev?.remindMin) || Number(practiceSettings.remindMin) || 0);
        const remindAt = eventAt - remindMin * 60 * 1000;
        const key = `${ev.id}:${remindAt}`;
        if (reminderFiredRef.current.has(key)) continue;
        if (now >= remindAt && now <= eventAt + 60000) {
          reminderFiredRef.current.add(key);
          try {
            new Notification("SkateFlow Reminder", {
              body: `${ev.title || "Practice"} • ${ev.dateISO} ${ev.time} (${ev.skaterName || activeSkater?.name || "Skater"})`,
            });
          } catch {
            // ignore notification failures
          }
        }
      }
    }, 30000);
    return () => window.clearInterval(timerId);
  }, [reminders.enabled, activePracticeEvents, practiceSettings.remindMin, activeSkater?.name]);

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

  const createPracticeEvent = (dateOverride = draft.date, opts = {}) => {
    if (!activeSkater) return;
    const safeDate = isValidISODate(String(dateOverride || "")) ? String(dateOverride) : todayISO();
    const safeTime = isValidTimeHHMM(String(reminders.time || "")) ? String(reminders.time) : "17:00";
    const ev = {
      id: `pe-${uid()}`,
      dateISO: safeDate,
      time: safeTime,
      durationMin: Number(practiceSettings.durationMin) || 60,
      remindMin: Number(practiceSettings.remindMin) || 60,
      title: practiceSettings.title || "SkateFlow Practice",
      notes: `Skater: ${activeSkater.name}\nDay: ${draft.dayType}\nPark: ${draft.park || ""}`,
      skaterId: activeSkater.id,
      skaterName: activeSkater.name,
      createdAt: new Date().toISOString(),
    };
    setSlice({ practiceEvents: [ev, ...practiceEvents].slice(0, 50) });
    if (opts.downloadICS !== false) {
      const downloaded = exportICSPractice(ev.dateISO, ev.title, ev.notes, {
        time: ev.time,
        durationMin: ev.durationMin,
        remindMin: ev.remindMin,
      });
      if (downloaded) {
        toast("Calendar event ready", `${ev.dateISO} ${ev.time} • reminder ${ev.remindMin}m`, "success");
      } else {
        toast("Calendar export failed", "Could not create calendar file on this browser.", "warn");
      }
      return ev;
    }
    toast("Practice scheduled", `${ev.dateISO} ${ev.time} • reminder ${ev.remindMin}m`, "success");
    return ev;
  };

  const addPracticeToCalendar = (dateOverride = draft.date) => {
    createPracticeEvent(dateOverride, { downloadICS: true });
  };

  const exportPracticeEvent = (ev) => {
    const downloaded = exportICSPractice(ev.dateISO, ev.title, ev.notes, {
      time: ev.time,
      durationMin: ev.durationMin,
      remindMin: ev.remindMin,
    });
    if (downloaded) {
      toast("iCal ready", `${ev.dateISO} ${ev.time}`, "success");
    } else {
      toast("iCal failed", "Could not create calendar file on this browser.", "warn");
    }
  };

  const removePracticeEvent = (id) => {
    setSlice({ practiceEvents: practiceEvents.filter((x) => x.id !== id) });
    toast("Removed", "Practice removed.", "warn");
  };

  const importICSFile = async (file) => {
    if (!file) return;
    if ((Number(file.size) || 0) > MAX_ICS_BYTES) {
      toast("ICS too large", "Use a smaller calendar file.", "warn");
      return;
    }
    try {
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
    } catch {
      toast("Import failed", "Could not read that .ics file.", "warn");
    }
  };

  const progressCards = useMemo(() => {
    const list = sessions
      .filter((s) => s.skaterId === ui.activeSkaterId)
      .slice()
      .sort((a, b) => (a.date > b.date ? 1 : -1));

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

    return [...levelUps, ...newTricks, ...xpCards, ...weekly].sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [sessions, ui.activeSkaterId]);

  const filteredProgressCards = useMemo(() => {
    if (binderFilter === "all") return progressCards;
    return progressCards.filter((c) => c.type === binderFilter);
  }, [progressCards, binderFilter]);

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

  const uploadMemberPhoto = async (member, file) => {
    if (!file || !file.type.startsWith("image/")) {
      toast("Invalid photo", "Please upload an image file.", "warn");
      return;
    }
    if ((Number(file.size) || 0) > MAX_IMAGE_FILE_BYTES) {
      toast("Photo too large", "Use an image under 25MB.", "warn");
      return;
    }
    try {
      const compressed = await compressImageFile(file, { maxW: 1400, maxH: 1400, quality: 0.84, maxBytes: 900 * 1024 });
      const photoUrl = await fileToDataUrl(compressed);
      setSlice({ members: members.map((m) => (m.id === member.id ? { ...m, photoUrl } : m)) });
      toast("Profile photo updated", `New photo for ${member.name}.`, "success");
    } catch {
      toast("Photo failed", "Could not process image.", "warn");
    }
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

  const loginBody = (() => {
    const picked = members.find((m) => m.id === loginPickId) || members[0];
    const requirePin = sanitizePin(picked?.pin || "").length !== 4;
    const pinPadDigits = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

    const submitLogin = () => {
      const nextId = loginPickId;
      const m = members.find((x) => x.id === nextId);
      if (!m) return;

      if (requirePin) {
        const pin = sanitizePin(loginPin || "");
        if (pin.length !== 4) {
          setLoginError("PIN must be exactly 4 digits.");
          return;
        }
        setSlice({
          members: members.map((x) => (x.id === nextId ? { ...x, pin } : x)),
          auth: { loggedInMemberId: nextId },
          ui: { ...ui, activeMemberId: nextId },
        });
        setLoginOpen(false);
        setLoginError("");
        setLoginPin("");
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
      setLoginPin("");
      toast("Logged in", `Welcome back, ${m.name}.`, "success");
    };

    const appendPinDigit = (digit) => {
      setLoginPin((prev) => sanitizePin(`${prev}${digit}`));
      if (loginError) setLoginError("");
    };

    const removePinDigit = () => {
      setLoginPin((prev) => String(prev || "").slice(0, -1));
      if (loginError) setLoginError("");
    };

    const clearPinDigits = () => {
      setLoginPin("");
      if (loginError) setLoginError("");
    };

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
            {requirePin ? "This account needs a 4-digit PIN. You’ll set it now." : "Enter your 4-digit PIN to continue."}
          </div>

          <div className="mt-2 rounded-xl bg-black/40 border border-white/10 px-3 py-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs text-white/60">PIN</div>
              <div className="text-xs text-white/40">{loginPin.length}/4</div>
            </div>
            <div className="mt-2 flex items-center justify-center gap-2">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`h-3 w-3 rounded-full ring-1 ${idx < loginPin.length ? "bg-white ring-white/80" : "bg-transparent ring-white/30"}`}
                />
              ))}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {pinPadDigits.slice(0, 9).map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => appendPinDigit(digit)}
                  className="rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-sm font-bold hover:bg-white/10"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={clearPinDigits}
                className="rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/10"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => appendPinDigit("0")}
                className="rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-sm font-bold hover:bg-white/10"
              >
                0
              </button>
              <button
                type="button"
                onClick={removePinDigit}
                className="rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/10"
              >
                Back
              </button>
            </div>
            <button
              type="button"
              className="mt-3 w-full rounded-xl bg-white text-black px-4 py-2 text-sm font-extrabold hover:bg-white/90 inline-flex items-center justify-center gap-2 disabled:opacity-50"
              onClick={submitLogin}
              disabled={loginPin.length !== 4}
            >
              <LogIn className="h-4 w-4" />
              Enter
            </button>
          </div>

          {!requirePin && biometricSupported ? (
            <div className="mt-2">
              <button
                type="button"
                onClick={() => biometricLogin(loginPickId)}
                disabled={biometricBusy}
                className="w-full rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/10 disabled:opacity-60"
              >
                {biometricBusy ? "Checking Face/Fingerprint..." : "Use Face/Fingerprint"}
              </button>
            </div>
          ) : null}
          {!requirePin && !biometricSupported ? <div className="mt-2 text-xs text-amber-200">{biometricUnavailableReason}</div> : null}

          {loginError ? <div className="mt-2 text-sm text-rose-200">{loginError}</div> : null}
        </div>
        <div className="mt-3 text-xs text-white/50">
          Local-only login (device-based). Face/Fingerprint requires a secure app URL (HTTPS or localhost).
        </div>
      </div>
    );
  })();

  const activeXP = xpBySkaterId[ui.activeSkaterId] || 0;
  const xpLevel = levelFromXP(activeXP);
  const settingsPanelClass = isLightMode
    ? "rounded-3xl bg-slate-50 ring-1 ring-slate-300 p-5 sm:p-7"
    : "rounded-3xl bg-white/5 ring-1 ring-white/10 p-5 sm:p-7";
  const settingsCardClass = isLightMode
    ? "rounded-3xl bg-white ring-1 ring-slate-300 p-4"
    : "rounded-3xl bg-black/30 ring-1 ring-white/10 p-4";
  const settingsMutedTextClass = isLightMode ? "mt-2 text-xs text-slate-600" : "mt-2 text-xs text-white/60";
  const settingsGhostBtnClass = isLightMode
    ? "rounded-2xl bg-slate-100 ring-1 ring-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-200"
    : "rounded-2xl bg-white/5 ring-1 ring-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/10";

  return (
    <div className={isLightMode ? "min-h-dvh overflow-x-hidden bg-slate-100 text-slate-900" : "min-h-dvh overflow-x-hidden bg-gradient-to-b from-black via-slate-950 to-black text-white"}>
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

      <Modal
        open={loginOpen}
        title="Login"
        onClose={() => {
          if (auth.loggedInMemberId) setLoginOpen(false);
        }}
      >
        {loginBody}
      </Modal>

      <Modal open={sessionEdit.open} title="Edit Session Card" onClose={closeSessionEditor}>
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-3">
              <div className="text-xs text-white/60">Date</div>
              <input
                value={sessionEdit.date}
                onChange={(e) => setSessionEdit((prev) => ({ ...prev, date: e.target.value }))}
                type="date"
                className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2"
              />
            </div>
            <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-3">
              <div className="text-xs text-white/60">Day Type</div>
              <select
                value={sessionEdit.dayType}
                onChange={(e) => setSessionEdit((prev) => ({ ...prev, dayType: e.target.value }))}
                className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2"
              >
                {editDayTypeOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-3">
            <div className="text-xs text-white/60">Park</div>
            <input
              value={sessionEdit.park}
              onChange={(e) => setSessionEdit((prev) => ({ ...prev, park: e.target.value }))}
              className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2"
              placeholder="Harbor / Vans / Street spot"
            />
          </div>

          <div className="max-h-[44vh] overflow-auto rounded-2xl bg-black/30 ring-1 ring-white/10 p-3 space-y-2">
            {(sessionEdit.tasks || []).map((t) => (
              <div key={t.taskId} className="rounded-xl bg-white/5 ring-1 ring-white/10 p-2">
                <div className="text-xs text-white/60 truncate">{t.label}</div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="text-[11px] text-cyan-200/90 w-14">Landed</div>
                  <button
                    type="button"
                    onClick={() => updateSessionEditTaskCompleted(t.taskId, Math.max(0, (Number(t.completed) || 0) - 1))}
                    className="rounded-lg bg-white/5 ring-1 ring-white/10 px-2 py-1 text-xs font-bold hover:bg-white/10"
                    title="Decrease reps"
                  >
                    -
                  </button>
                  <input
                    value={t.completed}
                    onChange={(e) => updateSessionEditTaskCompleted(t.taskId, e.target.value)}
                    inputMode="numeric"
                    className="w-24 rounded-lg bg-black/40 border border-white/10 px-2 py-1 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => updateSessionEditTaskCompleted(t.taskId, (Number(t.completed) || 0) + 1)}
                    className="rounded-lg bg-white/5 ring-1 ring-white/10 px-2 py-1 text-xs font-bold hover:bg-white/10"
                    title="Increase reps"
                  >
                    +
                  </button>
                  <div className="ml-auto text-xs text-white/70">Target {t.target}</div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="text-[11px] text-rose-200/90 w-14">Missed</div>
                  <button
                    type="button"
                    onClick={() => updateSessionEditTaskMissed(t.taskId, Math.max(0, (Number(t.missed) || 0) - 1))}
                    className="rounded-lg bg-white/5 ring-1 ring-white/10 px-2 py-1 text-xs font-bold hover:bg-white/10"
                    title="Decrease misses"
                  >
                    -
                  </button>
                  <input
                    value={t.missed}
                    onChange={(e) => updateSessionEditTaskMissed(t.taskId, e.target.value)}
                    inputMode="numeric"
                    className="w-24 rounded-lg bg-black/40 border border-white/10 px-2 py-1 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => updateSessionEditTaskMissed(t.taskId, (Number(t.missed) || 0) + 1)}
                    className="rounded-lg bg-white/5 ring-1 ring-white/10 px-2 py-1 text-xs font-bold hover:bg-white/10"
                    title="Increase misses"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={closeSessionEditor}
              className="rounded-xl bg-white/5 ring-1 ring-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveSessionEdit}
              className="rounded-xl bg-white text-black px-4 py-2 text-sm font-extrabold hover:bg-white/90"
            >
              Save Changes
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={videoEdit.open} title="Trim & Compress Video" onClose={closeVideoEditor}>
        <div className="space-y-3">
          <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-3">
            <div className="text-sm font-semibold truncate">{videoEdit.name || "Video Clip"}</div>
            <div className="mt-1 text-xs text-white/60">
              Original: {formatDurationSec(videoEdit.durationSec)} • {formatBytes(editingVideoMedia?.size || 0)}
            </div>
            <div className="mt-1 text-xs text-cyan-200/90">
              Output: {formatDurationSec(trimmedDurationSec)} • max {videoEdit.maxDim}p • {videoEdit.fps}fps • {videoEdit.bitrateKbps} kbps
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl bg-black ring-1 ring-white/10">
            <div className="aspect-video">
              {videoEdit.sourceUrl ? (
                <video
                  key={`${videoEdit.sourceUrl}-${videoEdit.startSec}`}
                  src={videoEdit.sourceUrl}
                  className="h-full w-full object-contain bg-black"
                  controls
                  playsInline
                  onLoadedMetadata={(e) => {
                    try {
                      e.currentTarget.currentTime = Math.max(0, Number(videoEdit.startSec) || 0);
                    } catch {
                      // ignore seek errors
                    }
                  }}
                />
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl bg-black/30 ring-1 ring-white/10 p-3 space-y-3">
            <div>
              <div className="text-xs text-white/60">Trim Start ({formatDurationSec(videoEdit.startSec)})</div>
              <input
                type="range"
                min={0}
                max={Math.max(0, (Number(videoEdit.endSec) || 0) - 0.25)}
                step={0.1}
                value={videoEdit.startSec}
                onChange={(e) => setVideoEditStart(e.target.value)}
                className="mt-2 w-full"
              />
            </div>
            <div>
              <div className="text-xs text-white/60">Trim End ({formatDurationSec(videoEdit.endSec)})</div>
              <input
                type="range"
                min={Math.min(Number(videoEdit.durationSec) || 0, (Number(videoEdit.startSec) || 0) + 0.25)}
                max={Math.max(0.25, Number(videoEdit.durationSec) || 0.25)}
                step={0.1}
                value={videoEdit.endSec}
                onChange={(e) => setVideoEditEnd(e.target.value)}
                className="mt-2 w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-3">
              <div className="text-xs text-white/60">Resolution Max</div>
              <select
                value={videoEdit.maxDim}
                onChange={(e) => setVideoEdit((prev) => ({ ...prev, maxDim: Number(e.target.value) || 1080 }))}
                className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
              >
                <option value={720}>720p</option>
                <option value={1080}>1080p</option>
                <option value={1440}>1440p</option>
              </select>
            </div>
            <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-3">
              <div className="text-xs text-white/60">Frame Rate</div>
              <select
                value={videoEdit.fps}
                onChange={(e) => setVideoEdit((prev) => ({ ...prev, fps: Number(e.target.value) || 30 }))}
                className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
              >
                <option value={24}>24 fps</option>
                <option value={30}>30 fps</option>
                <option value={60}>60 fps</option>
              </select>
            </div>
            <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-3">
              <div className="text-xs text-white/60">Bitrate</div>
              <select
                value={videoEdit.bitrateKbps}
                onChange={(e) => setVideoEdit((prev) => ({ ...prev, bitrateKbps: Number(e.target.value) || 3500 }))}
                className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
              >
                <option value={1800}>Low (1800 kbps)</option>
                <option value={3500}>Medium (3500 kbps)</option>
                <option value={6000}>High (6000 kbps)</option>
              </select>
            </div>
          </div>

          {videoEdit.error ? <div className="rounded-xl bg-rose-500/15 ring-1 ring-rose-500/30 px-3 py-2 text-sm text-rose-200">{videoEdit.error}</div> : null}

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={closeVideoEditor}
              disabled={videoEdit.processing}
              className="rounded-xl bg-white/5 ring-1 ring-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/10 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveDraftVideoEdit}
              disabled={videoEdit.processing}
              className="rounded-xl bg-white text-black px-4 py-2 text-sm font-extrabold hover:bg-white/90 disabled:opacity-50"
            >
              {videoEdit.processing ? "Processing..." : "Save Video"}
            </button>
          </div>
        </div>
      </Modal>

      <div className="mx-auto max-w-5xl p-4 sm:p-6">
        <div
          className={
            "sm:sticky sm:top-0 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 pt-4 pb-3 backdrop-blur border-b " +
            (isLightMode ? "bg-gradient-to-b from-white/95 to-slate-100/85 border-slate-300/70" : "bg-gradient-to-b from-black/95 to-black/70 border-white/10")
          }
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className={`text-[11px] font-extrabold tracking-[0.28em] ${isLightMode ? "text-slate-500" : "text-white/50"}`}>SKATEFLOW</div>
              <div className={`mt-0.5 text-[10px] ${isLightMode ? "text-slate-500" : "text-white/40"}`}>Build {BUILD_STAMP}</div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <div className="text-base sm:text-lg font-bold tracking-tight">Trading Card Athlete System</div>
                <Pill tone="cyan" lightMode={isLightMode}>
                  <Flame className="h-3.5 w-3.5" /> Streak {topStreak}
                </Pill>
                <Pill tone="neutral" lightMode={isLightMode}>
                  XP {activeXP} • {xpLevel.key} ({xpLevel.pctToNext}%)
                </Pill>
                {activeMember?.role === "owner" ? (
                  <Pill tone="good" lightMode={isLightMode}>
                    <Crown className="h-3.5 w-3.5" /> Owner
                  </Pill>
                ) : activeMember?.role === "coach" ? (
                  <Pill tone="warn" lightMode={isLightMode}>
                    <Crown className="h-3.5 w-3.5" /> Coach
                  </Pill>
                ) : (
                  <Pill tone="neutral" lightMode={isLightMode}>
                    <Users className="h-3.5 w-3.5" /> Dad
                  </Pill>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setLoginPickId(ui.activeMemberId);
                  setLoginPin("");
                  setLoginError("");
                  setLoginOpen(true);
                }}
                className={
                  "rounded-xl border px-3 py-2 text-sm inline-flex items-center gap-2 " +
                  (isLightMode
                    ? "border-slate-300 bg-white text-slate-800 hover:bg-slate-100"
                    : "border-white/10 bg-white/5 hover:bg-white/10")
                }
                title="Switch user (PIN required)"
              >
                <Lock className="h-4 w-4" />
                <span className="hidden sm:inline">{activeMember?.name || "Account"}</span>
              </button>

              <select
                value={ui.activeSkaterId}
                onChange={(e) => setUI({ activeSkaterId: e.target.value })}
                className={
                  "rounded-xl border px-3 py-2 text-sm " +
                  (isLightMode ? "border-slate-300 bg-white text-slate-800" : "border-white/10 bg-white/5")
                }
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

          <div className="mt-3 sm:hidden">
            <button
              type="button"
              onClick={() => setMobileTabsOpen((v) => !v)}
              className={
                "w-full rounded-2xl border px-3 py-2 text-sm font-semibold inline-flex items-center justify-center gap-2 " +
                (isLightMode ? "border-slate-300 bg-white text-slate-800 hover:bg-slate-100" : "border-white/10 bg-white/5 hover:bg-white/10")
              }
            >
              {mobileTabsOpen ? "Hide sections" : "Show sections"}
              {mobileTabsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>

          <div className={(mobileTabsOpen ? "mt-3 grid grid-cols-4 gap-2" : "hidden") + " sm:mt-3 sm:grid sm:grid-cols-6 lg:grid-cols-11 sm:gap-2"}>
            <TabButton active={ui.view === "log"} icon={ClipboardList} label="Log" lightMode={isLightMode} onClick={() => switchView("log")} />
            <TabButton active={ui.view === "cards"} icon={LayoutGrid} label="Cards" lightMode={isLightMode} onClick={() => switchView("cards")} />
            <TabButton active={ui.view === "calendar"} icon={Calendar} label="Calendar" lightMode={isLightMode} onClick={() => switchView("calendar")} />
            <TabButton active={ui.view === "dash"} icon={BarChart3} label="Stats" lightMode={isLightMode} onClick={() => switchView("dash")} />
            <TabButton active={ui.view === "plans"} icon={Pencil} label="Plans" lightMode={isLightMode} onClick={() => switchView("plans")} />
            <TabButton active={ui.view === "coach"} icon={VideoIcon} label="Coach" lightMode={isLightMode} onClick={() => switchView("coach")} />
            <TabButton active={ui.view === "skateday"} icon={MapPin} label="Skate Day" lightMode={isLightMode} onClick={() => switchView("skateday")} />
            <TabButton active={ui.view === "contest"} icon={Trophy} label="Contest" lightMode={isLightMode} onClick={() => switchView("contest")} />
            <TabButton active={ui.view === "team"} icon={Users} label="Team" lightMode={isLightMode} onClick={() => switchView("team")} />
            <TabButton active={ui.view === "chat"} icon={MessageSquare} label="Chat" lightMode={isLightMode} onClick={() => switchView("chat")} />
            <TabButton active={ui.view === "settings"} icon={Settings} label="Settings" lightMode={isLightMode} onClick={() => switchView("settings")} />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {ui.view === "log" ? (
            <motion.div key="log" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-4">
              <div className="rounded-3xl bg-gradient-to-br from-zinc-950 via-black to-zinc-900 p-5 sm:p-7 shadow-2xl ring-1 ring-white/10 text-white" style={{ color: "#ffffff" }}>
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
                  <div className="mt-2 text-xs text-white/60">Total reps: {totalCompleted} / {totalTarget} • Missed: {totalMissed}</div>
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
                        <div className="mt-3 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="text-[11px] text-cyan-200/90 w-14">Landed</div>
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
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="text-[11px] text-rose-200/90 w-14">Missed</div>
                            <button type="button" className="rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-sm font-bold hover:bg-white/10" onClick={() => bumpMissed(t, -1)} title="Decrease misses">
                              −
                            </button>
                            <input
                              value={draft.missedByTaskId?.[t.id] ?? ""}
                              onChange={(e) => updateMissed(t, e.target.value)}
                              inputMode="numeric"
                              className="w-24 rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                              placeholder="0"
                            />
                            <button type="button" className="rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-sm font-bold hover:bg-white/10" onClick={() => bumpMissed(t, +1)} title="Increase misses">
                              +
                            </button>
                            <button type="button" className="rounded-xl bg-rose-500/20 ring-1 ring-rose-400/30 px-3 py-2 text-sm font-bold hover:bg-rose-500/30 text-rose-100" onClick={() => bumpMissed(t, +5)} title="Increase misses by 5">
                              +5
                            </button>
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
                              {isVideo ? <video src={mediaSrc(m)} className="h-full w-full object-cover" controls playsInline /> : <img src={mediaSrc(m)} alt={m.name} className="h-full w-full object-cover" />}
                            </div>
                            {isVideo ? (
                              <button
                                type="button"
                                className="absolute top-2 left-2 rounded-full bg-black/70 ring-1 ring-white/10 px-2.5 py-1 text-[11px] font-bold hover:bg-black"
                                onClick={() => openDraftVideoEditor(m)}
                                title="Trim & compress"
                              >
                                Trim
                              </button>
                            ) : null}
                            <button type="button" className="absolute top-2 right-2 rounded-full bg-black/70 ring-1 ring-white/10 p-2 hover:bg-black" onClick={() => removeDraftMedia(m.id)} title="Remove">
                              <X className="h-4 w-4" />
                            </button>
                            <div className="absolute bottom-2 left-2">
                              <Pill tone="neutral">
                                {isVideo ? <VideoIcon className="h-3.5 w-3.5" /> : <ImageIcon className="h-3.5 w-3.5" />} {isVideo ? "Video" : "Photo"}
                              </Pill>
                            </div>
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
                      onEdit={() => openSessionEditor(s)}
                      onEditMedia={(mid) => openSessionVideoEditor(s.id, mid)}
                      onShare={() => shareSessionCard(s)}
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
                        onEdit={() => openSessionEditor(s)}
                        onEditMedia={(mid) => openSessionVideoEditor(s.id, mid)}
                        onShare={() => shareSessionCard(s)}
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

          {ui.view === "calendar" ? (
            <motion.div key="calendar" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-4">
              <div className={isLightMode ? "rounded-3xl bg-white ring-1 ring-slate-300 p-4 sm:p-6" : "rounded-3xl bg-white/5 ring-1 ring-white/10 p-4 sm:p-6"}>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <div className={isLightMode ? "text-xs tracking-widest text-slate-500" : "text-xs tracking-widest text-white/50"}>CALENDAR</div>
                    <div className="mt-1 text-xl font-extrabold">Practice & Training Calendar</div>
                    <div className={isLightMode ? "mt-1 text-sm text-slate-600" : "mt-1 text-sm text-white/60"}>
                      Plan practices here, then add reminders to your device calendar so alerts fire outside the app.
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => createPracticeEvent(draft.date, { downloadICS: false })}
                      className={isLightMode ? "rounded-2xl bg-slate-900 text-white px-4 py-2 text-sm font-bold hover:bg-slate-800" : "rounded-2xl bg-white text-black px-4 py-2 text-sm font-bold hover:bg-white/90"}
                    >
                      <Plus className="h-4 w-4 inline-block mr-2" />
                      Add Practice
                    </button>
                    <button
                      type="button"
                      onClick={() => addPracticeToCalendar(draft.date)}
                      className={isLightMode ? "rounded-2xl bg-slate-100 ring-1 ring-slate-300 text-slate-900 px-4 py-2 text-sm font-semibold hover:bg-slate-200" : "rounded-2xl bg-white/5 ring-1 ring-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/10"}
                    >
                      <Calendar className="h-4 w-4 inline-block mr-2" />
                      Add Device Reminder
                    </button>
                  </div>
                </div>

                <div className={isLightMode ? "mt-4 rounded-2xl bg-slate-50 ring-1 ring-slate-300 p-4" : "mt-4 rounded-2xl bg-black/30 ring-1 ring-white/10 p-4"}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    <div>
                      <div className={isLightMode ? "text-xs text-slate-500" : "text-xs text-white/60"}>Practice Date</div>
                      <input
                        value={draft.date}
                        onChange={(e) => setDraft({ date: e.target.value })}
                        type="date"
                        className={isLightMode ? "mt-1 w-full rounded-xl bg-white border border-slate-300 px-3 py-2" : "mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2"}
                      />
                    </div>
                    <div>
                      <div className={isLightMode ? "text-xs text-slate-500" : "text-xs text-white/60"}>Start Time</div>
                      <input
                        value={reminders.time}
                        onChange={(e) => setSlice({ reminders: { ...reminders, time: e.target.value } })}
                        type="time"
                        className={isLightMode ? "mt-1 w-full rounded-xl bg-white border border-slate-300 px-3 py-2" : "mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2"}
                      />
                    </div>
                    <div>
                      <div className={isLightMode ? "text-xs text-slate-500" : "text-xs text-white/60"}>Duration (min)</div>
                      <input
                        value={practiceSettings.durationMin}
                        onChange={(e) => setSlice({ practiceSettings: { ...practiceSettings, durationMin: clampNum(e.target.value) || 0 } })}
                        inputMode="numeric"
                        className={isLightMode ? "mt-1 w-full rounded-xl bg-white border border-slate-300 px-3 py-2" : "mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2"}
                      />
                    </div>
                    <div>
                      <div className={isLightMode ? "text-xs text-slate-500" : "text-xs text-white/60"}>Reminder (min before)</div>
                      <input
                        value={practiceSettings.remindMin}
                        onChange={(e) => setSlice({ practiceSettings: { ...practiceSettings, remindMin: clampNum(e.target.value) || 0 } })}
                        inputMode="numeric"
                        className={isLightMode ? "mt-1 w-full rounded-xl bg-white border border-slate-300 px-3 py-2" : "mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2"}
                      />
                    </div>
                    <div>
                      <div className={isLightMode ? "text-xs text-slate-500" : "text-xs text-white/60"}>Event Title</div>
                      <input
                        value={practiceSettings.title}
                        onChange={(e) => setSlice({ practiceSettings: { ...practiceSettings, title: e.target.value } })}
                        className={isLightMode ? "mt-1 w-full rounded-xl bg-white border border-slate-300 px-3 py-2" : "mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2"}
                      />
                    </div>
                  </div>
                </div>

                <div className={isLightMode ? "mt-4 rounded-2xl bg-slate-50 ring-1 ring-slate-300 p-4" : "mt-4 rounded-2xl bg-black/30 ring-1 ring-white/10 p-4"}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className={isLightMode ? "text-xs text-slate-500" : "text-xs text-white/60"}>Next Practice</div>
                      <div className="text-sm font-bold">
                        {nextPracticeEvent
                          ? `${nextPracticeEvent.title || "Practice"} • ${nextPracticeEvent.dateISO} ${nextPracticeEvent.time}`
                          : "No upcoming practice"}
                      </div>
                    </div>
                    <Pill tone={nextPracticeEvent ? "cyan" : "neutral"} lightMode={isLightMode}>
                      <Bell className="h-3.5 w-3.5" /> {nextPracticeCountdown}
                    </Pill>
                  </div>
                  <div className={isLightMode ? "mt-2 text-xs text-slate-600" : "mt-2 text-xs text-white/60"}>
                    For outside-app alerts, tap <span className="font-bold">Add Device Reminder</span> or use an upcoming item’s reminder button.
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setCalendarMonthKey((p) => shiftMonth(p, -1))}
                    className={isLightMode ? "rounded-xl bg-slate-100 ring-1 ring-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-200" : "rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/10"}
                  >
                    Prev
                  </button>
                  <div className="text-sm font-extrabold">{formatMonthLabel(calendarMonthKey)}</div>
                  <button
                    type="button"
                    onClick={() => setCalendarMonthKey((p) => shiftMonth(p, 1))}
                    className={isLightMode ? "rounded-xl bg-slate-100 ring-1 ring-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-200" : "rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/10"}
                  >
                    Next
                  </button>
                </div>

                <div className={isLightMode ? "mt-3 grid grid-cols-7 gap-2 text-[11px] text-slate-600" : "mt-3 grid grid-cols-7 gap-2 text-[11px] text-white/60"}>
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                    <div key={d} className="text-center font-semibold">
                      {d}
                    </div>
                  ))}
                </div>
                <div className="mt-2 grid grid-cols-7 gap-2">
                  {calendarGrid.map((cell) => {
                    const events = practiceEventsByDate.get(cell.dateISO) || [];
                    const isToday = cell.dateISO === todayISO();
                    return (
                      <button
                        key={cell.dateISO}
                        type="button"
                        onClick={() => {
                          setDraft({ date: cell.dateISO });
                          createPracticeEvent(cell.dateISO, { downloadICS: false });
                        }}
                        className={
                          "min-h-[84px] rounded-xl border p-2 text-left transition " +
                          (isLightMode
                            ? `${cell.inMonth ? "bg-white border-slate-300" : "bg-slate-100 border-slate-200 text-slate-400"} ${isToday ? "ring-2 ring-cyan-400/60" : ""}`
                            : `${cell.inMonth ? "bg-black/30 border-white/10" : "bg-white/5 border-white/5 text-white/35"} ${isToday ? "ring-2 ring-cyan-400/60" : ""}`)
                        }
                        title={`${cell.dateISO}${events.length ? ` • ${events.length} event(s)` : ""}`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold">{cell.dayNum}</span>
                          {events.length ? <span className="text-[10px] font-bold">{events.length}</span> : null}
                        </div>
                        <div className="mt-1 space-y-1">
                          {events.slice(0, 2).map((ev) => (
                            <div key={ev.id} className="truncate text-[10px]">
                              {ev.time} {ev.title || "Practice"}
                            </div>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4">
                  <div className="text-sm font-semibold">Upcoming</div>
                  <div className="mt-2 space-y-2">
                    {activePracticeEvents.slice(0, 8).map((ev) => (
                      <div key={ev.id} className={isLightMode ? "rounded-xl bg-slate-50 ring-1 ring-slate-300 px-3 py-2" : "rounded-xl bg-black/30 ring-1 ring-white/10 px-3 py-2"}>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-sm font-bold">
                            {ev.dateISO} • {ev.time} • {ev.title || "Practice"}
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => exportPracticeEvent(ev)}
                              className={isLightMode ? "rounded-lg bg-slate-100 ring-1 ring-slate-300 px-3 py-1.5 text-xs font-semibold hover:bg-slate-200" : "rounded-lg bg-white/5 ring-1 ring-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/10"}
                            >
                              Add Reminder
                            </button>
                            <button
                              type="button"
                              onClick={() => removePracticeEvent(ev.id)}
                              className={isLightMode ? "rounded-lg bg-rose-50 ring-1 ring-rose-300 text-rose-700 px-3 py-1.5 text-xs font-semibold hover:bg-rose-100" : "rounded-lg bg-rose-500/15 ring-1 ring-rose-500/20 text-rose-200 px-3 py-1.5 text-xs font-semibold hover:bg-rose-500/20"}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                        <div className={isLightMode ? "text-xs text-slate-600" : "text-xs text-white/60"}>
                          Reminder {Math.max(0, Number(ev.remindMin) || 0)} min before
                        </div>
                      </div>
                    ))}
                    {!activePracticeEvents.length ? (
                      <div className={isLightMode ? "text-sm text-slate-600" : "text-sm text-white/60"}>No practices scheduled yet.</div>
                    ) : null}
                  </div>
                </div>
              </div>
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

              <div className={`mt-4 rounded-3xl p-4 ${isLightMode ? "bg-white ring-1 ring-slate-300" : "bg-white/5 ring-1 ring-white/10"}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold inline-flex items-center gap-2">
                      <CloudSun className="h-4 w-4" /> Park Conditions
                    </div>
                    <div className={`text-xs mt-1 ${isLightMode ? "text-slate-600" : "text-white/60"}`}>
                      Search any skate park/city, save it, and check weather before practice.
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => fetchWeatherForPark(selectedParkProfile)}
                      className={isLightMode ? "rounded-xl bg-slate-100 ring-1 ring-slate-300 px-3 py-2 text-xs font-semibold hover:bg-slate-200 inline-flex items-center gap-2" : "rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/10 inline-flex items-center gap-2"}
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> Refresh
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!selectedParkProfile?.name) return;
                        setDraft({ park: selectedParkProfile.name });
                        toast("Park set for session", `${selectedParkProfile.name} added to today’s draft.`, "success");
                      }}
                      className="rounded-xl bg-white text-black px-3 py-2 text-xs font-extrabold hover:bg-white/90 inline-flex items-center gap-2"
                    >
                      <MapPin className="h-3.5 w-3.5" /> Use For Session
                    </button>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 lg:grid-cols-3 gap-2">
                  <select
                    value={selectedParkId}
                    onChange={(e) => selectParkForActiveSkater(e.target.value)}
                    className={isLightMode ? "rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800" : "rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"}
                  >
                    {parkProfiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}{p.location ? ` • ${p.location}` : ""}
                      </option>
                    ))}
                  </select>
                  <input
                    value={parkLookupQuery}
                    onChange={(e) => setParkLookupQuery(e.target.value)}
                    placeholder="Find park or city (ex: Harbor City skate park)"
                    className={isLightMode ? "rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800" : "rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"}
                  />
                  <button
                    type="button"
                    onClick={searchParkLocations}
                    className={isLightMode ? "rounded-xl bg-slate-100 ring-1 ring-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-200 inline-flex items-center justify-center gap-2" : "rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/10 inline-flex items-center justify-center gap-2"}
                  >
                    <Search className="h-4 w-4" /> {parkLookupLoading ? "Searching..." : "Search"}
                  </button>
                </div>

                {parkLookupResults.length ? (
                  <div className="mt-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className={isLightMode ? "text-xs text-slate-600" : "text-xs text-white/60"}>
                        {parkLookupResults.length} location match(es)
                      </div>
                      <button
                        type="button"
                        onClick={addAllParksFromLookup}
                        className={isLightMode ? "rounded-lg bg-slate-100 ring-1 ring-slate-300 px-3 py-1.5 text-xs font-semibold hover:bg-slate-200" : "rounded-lg bg-white/5 ring-1 ring-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/10"}
                      >
                        Save All Results
                      </button>
                    </div>
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                      {parkLookupResults.slice(0, 12).map((r, idx) => (
                        <div key={`${r.name}-${idx}`} className={isLightMode ? "rounded-xl bg-slate-50 ring-1 ring-slate-300 p-3" : "rounded-xl bg-black/30 ring-1 ring-white/10 p-3"}>
                          <div className="text-sm font-semibold">{r.name}</div>
                          <div className={`text-xs mt-1 ${isLightMode ? "text-slate-600" : "text-white/60"}`}>
                            {[r.admin1, r.country].filter(Boolean).join(", ")}
                          </div>
                          <div className={isLightMode ? "text-[11px] mt-1 text-slate-500" : "text-[11px] mt-1 text-white/50"}>
                            {Number(r.lat).toFixed(4)}, {Number(r.lon).toFixed(4)}
                          </div>
                          <div className="mt-2">
                            <button
                              type="button"
                              onClick={() => addParkFromLookup(r)}
                              className={isLightMode ? "rounded-lg bg-slate-100 ring-1 ring-slate-300 px-3 py-1.5 text-xs font-semibold hover:bg-slate-200" : "rounded-lg bg-white/5 ring-1 ring-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/10"}
                            >
                              Save Park
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {selectedParkProfile ? (
                  <div className={`mt-3 rounded-2xl p-3 ${isLightMode ? "bg-slate-50 ring-1 ring-slate-300" : "bg-black/30 ring-1 ring-white/10"}`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm font-semibold">Edit Selected Park</div>
                      <button
                        type="button"
                        onClick={() => hydrateParkDraft(selectedParkProfile)}
                        className={isLightMode ? "rounded-lg bg-slate-100 ring-1 ring-slate-300 px-3 py-1.5 text-xs font-semibold hover:bg-slate-200" : "rounded-lg bg-white/5 ring-1 ring-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/10"}
                      >
                        Reset
                      </button>
                    </div>
                    <div className="mt-2 grid grid-cols-1 lg:grid-cols-2 gap-2">
                      <input
                        value={parkDraft.name}
                        onChange={(e) => setParkDraft((p) => ({ ...p, name: e.target.value }))}
                        placeholder="Park name"
                        className={isLightMode ? "rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800" : "rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"}
                      />
                      <input
                        value={parkDraft.location}
                        onChange={(e) => setParkDraft((p) => ({ ...p, location: e.target.value }))}
                        placeholder="City, State"
                        className={isLightMode ? "rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800" : "rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"}
                      />
                      <input
                        value={parkDraft.lat}
                        onChange={(e) => setParkDraft((p) => ({ ...p, lat: e.target.value }))}
                        placeholder="Latitude"
                        inputMode="decimal"
                        className={isLightMode ? "rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800" : "rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"}
                      />
                      <input
                        value={parkDraft.lon}
                        onChange={(e) => setParkDraft((p) => ({ ...p, lon: e.target.value }))}
                        placeholder="Longitude"
                        inputMode="decimal"
                        className={isLightMode ? "rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800" : "rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"}
                      />
                    </div>
                    <textarea
                      value={parkDraft.notes}
                      onChange={(e) => setParkDraft((p) => ({ ...p, notes: e.target.value }))}
                      placeholder="Notes"
                      rows={2}
                      className={isLightMode ? "mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800" : "mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"}
                    />
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={saveSelectedParkEdits}
                        className="rounded-xl bg-white text-black px-3 py-2 text-xs font-extrabold hover:bg-white/90"
                      >
                        Save Park Details
                      </button>
                    </div>
                  </div>
                ) : null}

                <div className="mt-3">
                  {weatherState.loading ? (
                    <div className={`text-sm ${isLightMode ? "text-slate-600" : "text-white/70"}`}>Loading weather...</div>
                  ) : weatherState.error ? (
                    <div className={`text-sm ${isLightMode ? "text-rose-700" : "text-rose-200"}`}>{weatherState.error}</div>
                  ) : weatherState.current ? (
                    <div className="space-y-3">
                      <div className={`text-xs ${isLightMode ? "text-slate-600" : "text-white/60"}`}>
                        {weatherState.parkName || selectedParkProfile?.name || "Selected park"} • {weatherCodeLabel(weatherState.current.code)} • Updated{" "}
                        {weatherState.fetchedAt ? new Date(weatherState.fetchedAt).toLocaleTimeString() : "now"}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div className={isLightMode ? "rounded-xl bg-slate-50 ring-1 ring-slate-300 p-3" : "rounded-xl bg-black/30 ring-1 ring-white/10 p-3"}>
                          <div className={`text-[11px] ${isLightMode ? "text-slate-500" : "text-white/60"}`}>Temp</div>
                          <div className="text-lg font-extrabold">{weatherState.current.tempF}F</div>
                        </div>
                        <div className={isLightMode ? "rounded-xl bg-slate-50 ring-1 ring-slate-300 p-3" : "rounded-xl bg-black/30 ring-1 ring-white/10 p-3"}>
                          <div className={`text-[11px] ${isLightMode ? "text-slate-500" : "text-white/60"}`}>Wind</div>
                          <div className="text-lg font-extrabold">{weatherState.current.windMph} mph</div>
                        </div>
                        <div className={isLightMode ? "rounded-xl bg-slate-50 ring-1 ring-slate-300 p-3" : "rounded-xl bg-black/30 ring-1 ring-white/10 p-3"}>
                          <div className={`text-[11px] ${isLightMode ? "text-slate-500" : "text-white/60"}`}>Precip</div>
                          <div className="text-lg font-extrabold">{weatherState.current.precipIn.toFixed(2)} in</div>
                        </div>
                        <div className={isLightMode ? "rounded-xl bg-slate-50 ring-1 ring-slate-300 p-3" : "rounded-xl bg-black/30 ring-1 ring-white/10 p-3"}>
                          <div className={`text-[11px] ${isLightMode ? "text-slate-500" : "text-white/60"}`}>Condition</div>
                          <div className="text-sm font-bold">{weatherCodeLabel(weatherState.current.code)}</div>
                        </div>
                      </div>
                      {weatherState.daily?.length ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {weatherState.daily.map((d) => (
                            <div key={d.dateISO} className={isLightMode ? "rounded-xl bg-slate-50 ring-1 ring-slate-300 p-3" : "rounded-xl bg-black/30 ring-1 ring-white/10 p-3"}>
                              <div className={`text-[11px] ${isLightMode ? "text-slate-500" : "text-white/60"}`}>{formatShortDate(d.dateISO)}</div>
                              <div className="mt-1 text-sm font-bold">{weatherCodeLabel(d.code)}</div>
                              <div className={`text-xs mt-1 ${isLightMode ? "text-slate-600" : "text-white/70"}`}>
                                {d.maxF}F / {d.minF}F • Rain {d.rainPct}%
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className={`text-sm ${isLightMode ? "text-slate-600" : "text-white/70"}`}>Pick a park to load weather.</div>
                  )}
                </div>
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

              <div className={`mt-4 rounded-3xl p-5 ${isLightMode ? "bg-white ring-1 ring-slate-300" : "bg-white/5 ring-1 ring-white/10"}`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">Practice Planner</div>
                    <div className={`text-xs mt-1 ${isLightMode ? "text-slate-600" : "text-white/60"}`}>
                      Practice scheduling was moved to the <span className="font-bold">Calendar</span> tab. Add practices there and create outside-app reminders.
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => switchView("calendar")}
                      className={isLightMode ? "rounded-2xl bg-slate-900 text-white px-4 py-2 text-sm font-bold hover:bg-slate-800" : "rounded-2xl bg-white text-black px-4 py-2 text-sm font-bold hover:bg-white/90"}
                    >
                      <Calendar className="h-4 w-4 inline-block mr-2" />
                      Open Calendar
                    </button>
                    <button
                      type="button"
                      onClick={() => addPracticeToCalendar(draft.date)}
                      className={isLightMode ? "rounded-2xl bg-slate-100 ring-1 ring-slate-300 text-slate-900 px-4 py-2 text-sm font-semibold hover:bg-slate-200" : "rounded-2xl bg-white/5 ring-1 ring-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/10"}
                    >
                      <Bell className="h-4 w-4 inline-block mr-2" />
                      Add Reminder
                    </button>
                  </div>
                </div>
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
              <div className="rounded-3xl bg-white/5 ring-1 ring-white/10 p-5 sm:p-7">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs tracking-widest text-white/50">COACH CORNER</div>
                    <div className="mt-1 text-xl font-extrabold">Demo Library • {activeSkater?.name || "Skater"}</div>
                    <div className="mt-2 text-sm text-white/60">Coach, parent, or owner can upload trick demos and link them to plan tricks.</div>
                  </div>
                  <Pill tone="neutral">{activeCoachItems.length} demos</Pill>
                </div>

                <div className="mt-4 rounded-3xl bg-black/30 ring-1 ring-white/10 p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <div className="text-xs text-white/60">Title</div>
                      <input
                        value={coachDraft.title}
                        onChange={(e) => setCoachDraft((p) => ({ ...p, title: e.target.value }))}
                        placeholder="Backside air demo"
                        className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <div className="text-xs text-white/60">Linked Trick</div>
                      <select
                        value={coachDraft.taskLabel}
                        onChange={(e) => setCoachDraft((p) => ({ ...p, taskLabel: e.target.value }))}
                        className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                      >
                        <option value="">Not linked</option>
                        {coachTaskOptions.map((label) => (
                          <option key={label} value={label}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <div className="text-xs text-white/60">Notes</div>
                      <input
                        value={coachDraft.notes}
                        onChange={(e) => setCoachDraft((p) => ({ ...p, notes: e.target.value }))}
                        placeholder="Focus on shoulder position"
                        className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <label className="cursor-pointer rounded-2xl bg-white text-black px-4 py-2 text-sm font-bold hover:bg-white/90 inline-flex items-center gap-2">
                      <Upload className="h-4 w-4" /> Add Demo Media
                      <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={(e) => addCoachDemoFromFiles(e.target.files)} />
                    </label>
                    <div className="text-xs text-white/60">Images auto-compress for easier uploads.</div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {activeCoachItems.map((item) => (
                    <div key={item.id} className="rounded-3xl bg-black/30 ring-1 ring-white/10 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-sm font-bold">{item.title || "Demo"}</div>
                          <div className="text-xs text-white/60">{item.taskLabel || "No trick link"}</div>
                        </div>
                        <button type="button" onClick={() => deleteCoachDemo(item.id)} className="rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-xs hover:bg-white/10">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      {item.notes ? <div className="mt-2 text-xs text-white/70">{item.notes}</div> : null}
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {(item.media || []).slice(0, 4).map((m) => (
                          <div key={m.id} className="rounded-xl overflow-hidden bg-black ring-1 ring-white/10">
                            <div className="aspect-square">
                              {m.type?.startsWith("video/") ? (
                                <video src={mediaSrc(m)} className="h-full w-full object-cover" controls playsInline />
                              ) : (
                                <img src={mediaSrc(m)} alt={m.name} className="h-full w-full object-cover" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 text-[11px] text-white/50">Added by {item.createdBy || "Team"}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : null}

          {ui.view === "skateday" ? (
            <motion.div key="skateday" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-4">
              <div className="rounded-3xl bg-white/5 ring-1 ring-white/10 p-5 sm:p-7">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs tracking-widest text-white/50">MONTHLY SKATE DAY</div>
                    <div className="mt-1 text-xl font-extrabold">{activeSkater?.name || "Skater"} + Coach Day Trips</div>
                    <div className="mt-2 text-sm text-white/60">Save one day-trip card each month with park details, notes, photos, and videos.</div>
                  </div>
                  <Pill tone="neutral">{activeSkateDays.length} day{activeSkateDays.length === 1 ? "" : "s"}</Pill>
                </div>

                <div className="mt-4 rounded-3xl bg-black/30 ring-1 ring-white/10 p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <div className="text-xs text-white/60">Title</div>
                      <input
                        value={skateDayDraft.title}
                        onChange={(e) => setSkateDayDraft((p) => ({ ...p, title: e.target.value }))}
                        placeholder="Monthly Skate Day"
                        className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <div className="text-xs text-white/60">Date</div>
                      <input
                        type="date"
                        value={skateDayDraft.dateISO}
                        onChange={(e) => setSkateDayDraft((p) => ({ ...p, dateISO: e.target.value }))}
                        className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <div className="text-xs text-white/60">Skate Park</div>
                      <input
                        value={skateDayDraft.park}
                        onChange={(e) => setSkateDayDraft((p) => ({ ...p, park: e.target.value }))}
                        placeholder="Harbor / Vans / Road trip park..."
                        className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                      />
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="inline-flex items-center gap-2 rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-xs">
                      <input
                        type="checkbox"
                        checked={!!skateDayDraft.withCoach}
                        onChange={(e) => setSkateDayDraft((p) => ({ ...p, withCoach: e.target.checked }))}
                      />
                      Coach attended
                    </label>
                    <label className="inline-flex items-center gap-2 rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-xs">
                      <input
                        type="checkbox"
                        checked={!!skateDayDraft.withSkater}
                        onChange={(e) => setSkateDayDraft((p) => ({ ...p, withSkater: e.target.checked }))}
                      />
                      {activeSkater?.name || "Skater"} attended
                    </label>
                  </div>

                  <div className="mt-3">
                    <div className="text-xs text-white/60">Day Notes</div>
                    <textarea
                      value={skateDayDraft.notes}
                      onChange={(e) => setSkateDayDraft((p) => ({ ...p, notes: e.target.value }))}
                      placeholder="Road trip notes, goals, highlights..."
                      rows={3}
                      className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={addSkateDayEntry}
                      className="rounded-2xl bg-white text-black px-4 py-2 text-sm font-bold hover:bg-white/90"
                    >
                      <Plus className="h-4 w-4 inline-block mr-2" /> Create Skate Day Entry
                    </button>
                  </div>
                </div>

                {activeSkateDays.length ? (
                  <div className="mt-4 space-y-3">
                    {activeSkateDays.map((day) => (
                      <div key={day.id} className="rounded-3xl bg-black/30 ring-1 ring-white/10 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <div className="text-sm font-bold">{day.title || "Skate Day"}</div>
                            <div className="text-xs text-white/60">
                              {day.dateISO} • {day.park || "Unknown Park"} • Added by {day.createdBy || "Team"}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => deleteSkateDayEntry(day.id)}
                            className="rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-xs hover:bg-white/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <label className="inline-flex items-center gap-2 rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-xs">
                            <input
                              type="checkbox"
                              checked={!!day.withCoach}
                              onChange={(e) => updateSkateDayEntry(day.id, { withCoach: e.target.checked })}
                            />
                            Coach attended
                          </label>
                          <label className="inline-flex items-center gap-2 rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-xs">
                            <input
                              type="checkbox"
                              checked={!!day.withSkater}
                              onChange={(e) => updateSkateDayEntry(day.id, { withSkater: e.target.checked })}
                            />
                            {activeSkater?.name || "Skater"} attended
                          </label>
                        </div>

                        <textarea
                          value={day.notes || ""}
                          onChange={(e) => updateSkateDayEntry(day.id, { notes: e.target.value })}
                          placeholder="Trip notes..."
                          rows={3}
                          className="mt-3 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                        />

                        <div className="mt-3">
                          <label className="cursor-pointer rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/10 inline-flex items-center gap-2">
                            <Upload className="h-4 w-4" /> Upload Day Media
                            <input
                              type="file"
                              multiple
                              accept="image/*,video/*"
                              className="hidden"
                              onChange={(e) => addSkateDayMediaFromFiles(day.id, e.target.files)}
                            />
                          </label>
                        </div>

                        {(day.media || []).length ? (
                          <div className="mt-2 grid grid-cols-3 sm:grid-cols-5 gap-2">
                            {(day.media || []).map((m) => (
                              <div key={m.id} className="relative rounded-xl overflow-hidden bg-black ring-1 ring-white/10">
                                <div className="aspect-square">
                                  {m.type?.startsWith("video/") ? (
                                    <video src={mediaSrc(m)} className="h-full w-full object-cover" controls playsInline />
                                  ) : (
                                    <img src={mediaSrc(m)} alt={m.name} className="h-full w-full object-cover" />
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeSkateDayMedia(day.id, m.id)}
                                  className="absolute top-1 right-1 rounded-full bg-black/70 ring-1 ring-white/10 p-1"
                                  title="Remove media"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="mt-2 text-xs text-white/60">No media yet for this day.</div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 rounded-3xl bg-black/30 ring-1 ring-white/10 p-4 text-sm text-white/70">
                    No skate day entries yet. Create one for each monthly coach + skater trip.
                  </div>
                )}
              </div>
            </motion.div>
          ) : null}

          {ui.view === "contest" ? (
            <motion.div key="contest" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-4">
              <div className="rounded-3xl bg-white/5 ring-1 ring-white/10 p-5 sm:p-7">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs tracking-widest text-white/50">CONTEST MODE</div>
                    <div className="mt-1 text-xl font-extrabold">{activeSkater?.name || "Skater"} Runs</div>
                    <div className="mt-2 text-sm text-white/60">Track rounds, runs, trick lines, scores, media, and reorder by heat time.</div>
                  </div>
                  <button type="button" onClick={addContestRun} className="rounded-2xl bg-white text-black px-4 py-2 text-sm font-bold hover:bg-white/90">
                    <Plus className="h-4 w-4 inline-block mr-2" /> Add Run
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="rounded-2xl bg-black/30 ring-1 ring-white/10 p-3 sm:col-span-2">
                    <div className="text-xs text-white/60">Contest Name</div>
                    <input
                      value={contestState.eventName || ""}
                      onChange={(e) => patchContestState({ eventName: e.target.value })}
                      placeholder="LIMUP Competition Series"
                      className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2"
                    />
                  </div>
                  <div className="rounded-2xl bg-black/30 ring-1 ring-white/10 p-3">
                    <div className="text-xs text-white/60">Date</div>
                    <input
                      type="date"
                      value={contestState.eventDate || todayISO()}
                      onChange={(e) => patchContestState({ eventDate: e.target.value })}
                      className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2"
                    />
                  </div>
                  <div className="rounded-2xl bg-black/30 ring-1 ring-white/10 p-3">
                    <div className="text-xs text-white/60">Round</div>
                    <input
                      value={contestState.round || ""}
                      onChange={(e) => patchContestState({ round: e.target.value })}
                      placeholder="Semis / Finals"
                      className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2"
                    />
                  </div>
                </div>

                <div className="mt-3 rounded-2xl bg-black/30 ring-1 ring-white/10 p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">Run Timer {runTimerLabel ? `• ${runTimerLabel}` : ""}</div>
                    <div className={`text-lg font-black ${runTimerSec <= 10 && runTimerSec > 0 ? "text-rose-300" : "text-cyan-200"}`}>
                      {String(Math.floor(runTimerSec / 60)).padStart(2, "0")}:{String(runTimerSec % 60).padStart(2, "0")}
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {(contestState.runs || []).map((run, idx) => {
                    const landedCount = (run.tricks || []).filter((t) => t.landed).length;
                    const totalTricks = (run.tricks || []).length;
                    return (
                      <div key={run.id} className="rounded-3xl bg-black/30 ring-1 ring-white/10 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="text-sm font-bold">Run #{run.runNo || idx + 1}</div>
                          <div className="flex gap-2">
                            <button type="button" onClick={() => moveContestRun(run.id, -1)} className="rounded-xl bg-white/5 ring-1 ring-white/10 px-2 py-2 text-xs hover:bg-white/10" title="Move up">
                              <ChevronUp className="h-4 w-4" />
                            </button>
                            <button type="button" onClick={() => moveContestRun(run.id, +1)} className="rounded-xl bg-white/5 ring-1 ring-white/10 px-2 py-2 text-xs hover:bg-white/10" title="Move down">
                              <ChevronDown className="h-4 w-4" />
                            </button>
                            <button type="button" onClick={() => startRunTimer(run)} className="rounded-xl bg-cyan-500/20 ring-1 ring-cyan-400/30 px-3 py-2 text-xs font-semibold hover:bg-cyan-500/30 text-cyan-100">
                              <Calendar className="h-4 w-4 inline-block mr-1" /> Start Timer
                            </button>
                            <button type="button" onClick={() => deleteContestRun(run.id)} className="rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-xs hover:bg-white/10">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-7 gap-2">
                          <input
                            value={run.round || ""}
                            onChange={(e) => updateContestRun(run.id, { round: e.target.value })}
                            placeholder="Round"
                            className="rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                          />
                          <input
                            value={run.durationSec ?? 45}
                            onChange={(e) => updateContestRun(run.id, { durationSec: clampNum(e.target.value) || 0 })}
                            placeholder="Duration sec"
                            inputMode="numeric"
                            className="rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                          />
                          <input
                            value={run.score ?? ""}
                            onChange={(e) => updateContestRun(run.id, { score: e.target.value })}
                            placeholder="Judge score"
                            className="rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                          />
                          <input
                            value={run.song || ""}
                            onChange={(e) => updateContestRun(run.id, { song: e.target.value })}
                            placeholder="Song / Artist / Beat cue"
                            className="rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                          />
                          <input
                            value={run.bpm ?? ""}
                            onChange={(e) => updateContestRun(run.id, { bpm: clampNum(e.target.value) || "" })}
                            placeholder="BPM"
                            inputMode="numeric"
                            className="rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                          />
                          <input
                            value={run.dropAt || ""}
                            onChange={(e) => updateContestRun(run.id, { dropAt: e.target.value })}
                            placeholder="Drop at (0:42)"
                            className="rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                          />
                          <div className="rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-sm">
                            Landed {landedCount}/{totalTricks || 0}
                          </div>
                        </div>

                        <div className="mt-2 rounded-2xl bg-black/30 ring-1 ring-white/10 p-3">
                          <div className="text-xs text-white/60">Music Link (YouTube or Apple Music)</div>
                          <div className="mt-2 grid grid-cols-1 sm:grid-cols-4 gap-2">
                            <input
                              value={run.musicUrl || ""}
                              onChange={(e) => updateContestRun(run.id, { musicUrl: e.target.value })}
                              onBlur={(e) => updateContestRun(run.id, { musicUrl: normalizeExternalUrl(e.target.value) })}
                              placeholder="Paste YouTube / Apple Music URL"
                              className="sm:col-span-2 rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => setContestRunMusicLink(run.id, "youtube")}
                              className="rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/10"
                            >
                              <Search className="h-4 w-4 inline-block mr-1" />
                              YouTube
                            </button>
                            <button
                              type="button"
                              onClick={() => setContestRunMusicLink(run.id, "apple")}
                              className="rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/10"
                            >
                              <Search className="h-4 w-4 inline-block mr-1" />
                              Apple Music
                            </button>
                          </div>
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <div className="text-[11px] text-white/60">
                              {run.musicUrl ? `${musicProviderLabelFromUrl(run.musicUrl)} link saved` : "No music link attached yet."}
                            </div>
                            <button
                              type="button"
                              onClick={() => openContestRunMusicLink(run)}
                              disabled={!isOpenableExternalUrl(normalizeExternalUrl(run.musicUrl || ""))}
                              className="rounded-xl bg-cyan-500/20 ring-1 ring-cyan-400/30 px-3 py-2 text-xs font-semibold hover:bg-cyan-500/30 text-cyan-100 disabled:opacity-50"
                            >
                              <ExternalLink className="h-4 w-4 inline-block mr-1" />
                              Open Link
                            </button>
                          </div>
                        </div>

                        <div className="mt-3 rounded-2xl bg-white/5 ring-1 ring-white/10 p-3">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-semibold">Trick line</div>
                            <button type="button" onClick={() => addContestTrick(run.id)} className="rounded-xl bg-white text-black px-3 py-2 text-xs font-bold hover:bg-white/90">
                              <Plus className="h-4 w-4 inline-block mr-1" /> Add Trick
                            </button>
                          </div>
                          <div className="mt-2 space-y-2">
                            {(run.tricks || []).map((trick) => (
                              <div key={trick.id} className="rounded-xl bg-black/30 ring-1 ring-white/10 p-2">
                                <div className="flex flex-wrap gap-2">
                                  <input
                                    value={trick.name}
                                    onChange={(e) => updateContestTrick(run.id, trick.id, { name: e.target.value })}
                                    placeholder="Trick name"
                                    className="flex-1 rounded-lg bg-black/40 border border-white/10 px-2 py-1 text-sm"
                                  />
                                  <label className="inline-flex items-center gap-2 rounded-lg bg-white/5 ring-1 ring-white/10 px-2 py-1 text-xs">
                                    <input
                                      type="checkbox"
                                      checked={!!trick.landed}
                                      onChange={(e) => updateContestTrick(run.id, trick.id, { landed: e.target.checked })}
                                    />
                                    Landed
                                  </label>
                                  <button type="button" onClick={() => removeContestTrick(run.id, trick.id)} className="rounded-lg bg-white/5 ring-1 ring-white/10 px-2 py-1 text-xs hover:bg-white/10">
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                                <input
                                  value={trick.notes || ""}
                                  onChange={(e) => updateContestTrick(run.id, trick.id, { notes: e.target.value })}
                                  placeholder="Notes"
                                  className="mt-2 w-full rounded-lg bg-black/40 border border-white/10 px-2 py-1 text-sm"
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="mt-3">
                          <label className="cursor-pointer rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/10 inline-flex items-center gap-2">
                            <Upload className="h-4 w-4" /> Upload Run Media
                            <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={(e) => addContestMediaFromFiles(run.id, e.target.files)} />
                          </label>
                          {(run.media || []).length ? (
                            <div className="mt-2 grid grid-cols-3 sm:grid-cols-5 gap-2">
                              {(run.media || []).map((m) => (
                                <div key={m.id} className="relative rounded-xl overflow-hidden bg-black ring-1 ring-white/10">
                                  <div className="aspect-square">
                                    {m.type?.startsWith("video/") ? (
                                      <video src={mediaSrc(m)} className="h-full w-full object-cover" controls playsInline />
                                    ) : (
                                      <img src={mediaSrc(m)} alt={m.name} className="h-full w-full object-cover" />
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeContestMedia(run.id, m.id)}
                                    className="absolute top-1 right-1 rounded-full bg-black/70 ring-1 ring-white/10 p-1"
                                    title="Remove media"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {contestLeaderboard.length ? (
                  <div className="mt-4 rounded-3xl bg-black/30 ring-1 ring-white/10 p-4">
                    <div className="text-sm font-semibold">Leaderboard</div>
                    <div className="mt-2 space-y-1">
                      {contestLeaderboard.slice(0, 3).map((r, i) => (
                        <div key={r.id} className="rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-sm">
                          #{i + 1} • Run {r.runNo} • Score {r.scoreNum || 0}
                          {r.song ? ` • ${r.song}` : ""}
                          {r.bpm ? ` • ${r.bpm} BPM` : ""}
                          {r.dropAt ? ` • Drop ${r.dropAt}` : ""}
                          {r.musicUrl ? ` • ${musicProviderLabelFromUrl(r.musicUrl)}` : ""}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
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
                          const pin = sanitizePin(prompt("Set PIN (required, exactly 4 digits):", "") || "");
                          if (pin.length !== 4) {
                            alert("PIN must be exactly 4 digits.");
                            return;
                          }
                          const m = { id: `m-${uid()}`, name: name.trim(), role: role || "dad", pin, photoUrl: "", biometricCredentialId: "" };
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
                                  const nextPin = prompt("Set/Change PIN (exactly 4 digits):", m.pin || "");
                                  if (nextPin == null) return;
                                  const v = sanitizePin(nextPin);
                                  if (v.length !== 4) {
                                    alert("PIN must be exactly 4 digits.");
                                    return;
                                  }
                                  setSlice({ members: members.map((x) => (x.id === m.id ? { ...x, pin: v } : x)) });
                                  toast("PIN updated", `${m.name} PIN updated.`, "success");
                                }}
                                className="rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/10"
                              >
                                Set PIN
                              </button>

                              <button
                                type="button"
                                onClick={async () => {
                                  if (!biometricSupported) {
                                    toast("Biometric unavailable", biometricUnavailableReason, "warn");
                                    return;
                                  }
                                  try {
                                    setBiometricBusy(true);
                                    await registerBiometricForMember(m);
                                    toast("Biometric set", `Face/Fingerprint ready for ${m.name}.`, "success");
                                  } catch (err) {
                                    toast("Biometric setup failed", err?.message || "Could not set biometric login.", "warn");
                                  } finally {
                                    setBiometricBusy(false);
                                  }
                                }}
                                disabled={!biometricSupported || biometricBusy}
                                title={!biometricSupported ? biometricUnavailableReason : "Register Face/Fingerprint on this device"}
                                className="rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/10 disabled:opacity-60"
                              >
                                Set Face/Fingerprint
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
              <div className="rounded-3xl bg-gradient-to-br from-zinc-950 via-black to-zinc-900 p-5 sm:p-7 shadow-2xl ring-1 ring-white/10 text-white" style={{ color: "#ffffff" }}>
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

          {ui.view === "settings" ? (
            <motion.div key="settings" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-4">
              <div className={settingsPanelClass}>
                <div>
                  <div className={`text-xs tracking-widest ${isLightMode ? "text-slate-500" : "text-white/50"}`}>SETTINGS</div>
                  <div className="mt-1 text-xl font-extrabold">Backup, Theme, and Device Setup</div>
                </div>

                <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <div className={settingsCardClass}>
                    <div className="text-sm font-semibold">Theme</div>
                    <div className={settingsMutedTextClass}>Switch between dark and light mode.</div>
                    <button
                      type="button"
                      onClick={toggleTheme}
                      className="mt-3 rounded-2xl bg-white text-black px-4 py-2 text-sm font-bold hover:bg-white/90"
                    >
                      {isLightMode ? "Use Dark Mode" : "Use Light Mode"}
                    </button>
                  </div>

                  <div className={settingsCardClass}>
                    <div className="text-sm font-semibold">Backup</div>
                    <div className={settingsMutedTextClass}>Export everything to JSON or restore from JSON backup.</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button type="button" onClick={exportBackupJSON} className="rounded-2xl bg-white text-black px-4 py-2 text-sm font-bold hover:bg-white/90">
                        <Download className="h-4 w-4 inline-block mr-2" /> Export Backup
                      </button>
                      <label className={`cursor-pointer inline-flex items-center gap-2 ${settingsGhostBtnClass}`}>
                        <Upload className="h-4 w-4" /> Import Backup
                        <input type="file" accept="application/json,.json" className="hidden" onChange={(e) => importBackupFile(e.target.files?.[0])} />
                      </label>
                    </div>
                  </div>
                </div>

                <div className={`mt-4 ${settingsCardClass}`}>
                  <div className="text-sm font-semibold">Cloud Sync (Firebase Firestore)</div>
                  <div className={settingsMutedTextClass}>
                    Manual + automatic sync across devices. Auto mode can pull on app open and run every few minutes.
                  </div>
                  <div className="mt-3 grid grid-cols-1 lg:grid-cols-3 gap-2">
                    <input
                      value={cloudSync.projectId}
                      onChange={(e) => {
                        setCloudSyncError("");
                        updateCloudSync({ projectId: e.target.value });
                      }}
                      placeholder="Firebase project ID"
                      className={
                        "rounded-xl border px-3 py-2 text-sm " +
                        (isLightMode
                          ? "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
                          : "bg-black/40 border-white/10 text-white placeholder:text-white/40")
                      }
                    />
                    <input
                      value={cloudSync.apiKey}
                      onChange={(e) => {
                        setCloudSyncError("");
                        updateCloudSync({ apiKey: e.target.value });
                      }}
                      placeholder="Firebase Web API key"
                      type="password"
                      className={
                        "rounded-xl border px-3 py-2 text-sm " +
                        (isLightMode
                          ? "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
                          : "bg-black/40 border-white/10 text-white placeholder:text-white/40")
                      }
                    />
                    <input
                      value={cloudSync.documentPath}
                      onChange={(e) => {
                        setCloudSyncError("");
                        updateCloudSync({ documentPath: e.target.value });
                      }}
                      onBlur={() => updateCloudSync({ documentPath: cloudSafeDocPath(cloudSync.documentPath) })}
                      placeholder="Document path (collection/doc)"
                      className={
                        "rounded-xl border px-3 py-2 text-sm " +
                        (isLightMode
                          ? "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
                          : "bg-black/40 border-white/10 text-white placeholder:text-white/40")
                      }
                    />
                  </div>
                  <div className="mt-3 grid grid-cols-1 lg:grid-cols-3 gap-2">
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={!!cloudSync.autoSyncEnabled}
                        onChange={(e) => updateCloudSync({ autoSyncEnabled: e.target.checked })}
                      />
                      Auto sync
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm">
                      <span>Every</span>
                      <input
                        value={cloudSync.autoSyncIntervalMin}
                        onChange={(e) => updateCloudSync({ autoSyncIntervalMin: clampNum(e.target.value) || 1 })}
                        inputMode="numeric"
                        className={
                          "w-20 rounded-xl border px-2 py-1 text-sm " +
                          (isLightMode
                            ? "bg-white border-slate-300 text-slate-900"
                            : "bg-black/40 border-white/10 text-white")
                        }
                      />
                      <span>min</span>
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={cloudSync.autoPullOnLoad !== false}
                        onChange={(e) => updateCloudSync({ autoPullOnLoad: e.target.checked })}
                      />
                      Pull on app open
                    </label>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 items-center">
                    <button
                      type="button"
                      onClick={pushCloudSync}
                      disabled={cloudSyncBusy}
                      className="rounded-2xl bg-white text-black px-4 py-2 text-sm font-bold hover:bg-white/90 disabled:opacity-60"
                    >
                      {cloudSyncBusy ? "Working..." : "Push to Cloud"}
                    </button>
                    <button type="button" onClick={pullCloudSync} disabled={cloudSyncBusy} className={`${settingsGhostBtnClass} disabled:opacity-60`}>
                      Pull from Cloud
                    </button>
                    <Pill tone="neutral" lightMode={isLightMode}>
                      Last: {cloudSync.lastDirection ? `${cloudSync.lastDirection} • ` : ""}
                      {cloudSync.lastSyncAt ? new Date(cloudSync.lastSyncAt).toLocaleString() : "never"}
                    </Pill>
                    {cloudSync.autoSyncEnabled ? (
                      <Pill tone="cyan" lightMode={isLightMode}>
                        Auto every {Math.max(1, Number(cloudSync.autoSyncIntervalMin) || 1)}m
                      </Pill>
                    ) : null}
                  </div>
                  {cloudSyncError ? (
                    <div className={`mt-2 text-xs ${isLightMode ? "text-rose-700" : "text-rose-200"}`}>{cloudSyncError}</div>
                  ) : (
                    <div className={`mt-2 text-xs ${isLightMode ? "text-slate-600" : "text-white/60"}`}>
                      Firestore rule tip for beta: allow read/write to your sync doc path only.
                    </div>
                  )}
                </div>

                <div className={`mt-4 ${settingsCardClass}`}>
                  <div className="text-sm font-semibold">PWA Setup</div>
                  <div className={settingsMutedTextClass}>
                    Install on iPhone/iPad/Android: open in browser and use Add to Home Screen. Offline support is enabled with the service worker.
                  </div>
                </div>

                <div className={`mt-4 ${settingsCardClass}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold">Beta Checker</div>
                      <div className={isLightMode ? "mt-1 text-xs text-slate-600" : "mt-1 text-xs text-white/60"}>
                        Track launch readiness with a simple pass/fail checklist.
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={markAllBetaChecks} className="rounded-2xl bg-white text-black px-4 py-2 text-sm font-bold hover:bg-white/90">
                        Mark All Pass
                      </button>
                      <button type="button" onClick={resetBetaChecks} className={settingsGhostBtnClass}>
                        Reset
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Pill tone="good" lightMode={isLightMode}>Pass {betaStats.pass}</Pill>
                    <Pill tone="warn" lightMode={isLightMode}>Remaining {betaStats.remaining}</Pill>
                    <Pill tone="neutral" lightMode={isLightMode}>Total {betaStats.total}</Pill>
                    {betaCheck.updatedAt ? (
                      <div className={`text-[11px] ${isLightMode ? "text-slate-500" : "text-white/50"}`}>
                        Updated {new Date(betaCheck.updatedAt).toLocaleString()}
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-3 space-y-2">
                    {BETA_CHECK_ITEMS.map((item) => {
                      const checked = !!betaCheckedById[item.id];
                      return (
                        <div key={item.id} className={`rounded-2xl p-3 ring-1 ${checked ? "bg-emerald-500/10 ring-emerald-500/30" : isLightMode ? "bg-slate-100 ring-slate-300" : "bg-white/5 ring-white/10"}`}>
                          <label className="flex items-start gap-3">
                            <input type="checkbox" checked={checked} onChange={(e) => setBetaChecked(item.id, e.target.checked)} className="mt-1 h-4 w-4" />
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-semibold">{item.label}</span>
                              <span className={isLightMode ? "block text-xs text-slate-600" : "block text-xs text-white/60"}>{item.detail}</span>
                            </span>
                          </label>
                          <input
                            value={betaNotesById[item.id] || ""}
                            onChange={(e) => setBetaNote(item.id, e.target.value)}
                            placeholder="Tester note (optional)"
                            className={
                              "mt-2 w-full rounded-xl border px-3 py-2 text-xs " +
                              (isLightMode
                                ? "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
                                : "bg-black/30 border-white/10 text-white placeholder:text-white/40")
                            }
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className={`mt-4 ${settingsCardClass}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold">Health & Debug</div>
                      <div className={isLightMode ? "mt-1 text-xs text-slate-600" : "mt-1 text-xs text-white/60"}>Run diagnostics, repair data shape, and export a health report.</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={runHealthCheck} className="rounded-2xl bg-white text-black px-4 py-2 text-sm font-bold hover:bg-white/90">
                        Run Health Check
                      </button>
                      <button type="button" onClick={repairStoreNow} className={settingsGhostBtnClass}>
                        Repair Store
                      </button>
                      <button type="button" onClick={exportHealthReport} className={settingsGhostBtnClass}>
                        Export Report
                      </button>
                    </div>
                  </div>

                  {healthReport ? (
                    <div className="mt-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Pill tone="good" lightMode={isLightMode}>Pass {healthReport.summary.pass}</Pill>
                        <Pill tone="warn" lightMode={isLightMode}>Warn {healthReport.summary.warn}</Pill>
                        <Pill tone="bad" lightMode={isLightMode}>Fail {healthReport.summary.fail}</Pill>
                        <Pill tone="neutral" lightMode={isLightMode}>Total {healthReport.summary.total}</Pill>
                        <div className={`text-[11px] ${isLightMode ? "text-slate-500" : "text-white/50"}`}>Last run {new Date(healthReport.generatedAt).toLocaleString()}</div>
                      </div>
                      <div className="mt-3 space-y-2 max-h-64 overflow-auto">
                        {healthReport.checks.map((c) => (
                          <div
                            key={c.id}
                            className={
                              "rounded-xl p-2 ring-1 " +
                              (c.status === "fail"
                                ? "bg-rose-500/10 ring-rose-500/30"
                                : c.status === "warn"
                                ? "bg-amber-500/10 ring-amber-500/30"
                                : "bg-emerald-500/10 ring-emerald-500/30")
                            }
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="text-sm font-semibold">{c.title}</div>
                              <div className="text-[11px] uppercase tracking-wide">{c.status}</div>
                            </div>
                            <div className={`mt-1 text-xs ${isLightMode ? "text-slate-700" : "text-white/70"}`}>{c.detail}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className={`mt-3 text-xs ${isLightMode ? "text-slate-600" : "text-white/60"}`}>No report yet. Tap Run Health Check.</div>
                  )}
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

function SessionCard({ session, onEdit, onEditMedia, onShare, onDelete, canComment, onAddComment, onSetMediaComment }) {
  const completionPct = pct(session.totalCompleted || 0, session.totalTarget || 1);
  const tier = getCardTier(completionPct);
  const ovr = computeOVR(session);
  const hero = pickHeroMedia(session.media || []);
  const totalMissed = (session.tasks || []).reduce((sum, t) => sum + (Number(t.missed) || 0), 0);
  const [commentText, setCommentText] = useState("");
  const [isOnline, setIsOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));
  const isOfflineOnlyMedia = (m) => !isOnline && !String(m?.dataUrl || "");

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

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
              {isOfflineOnlyMedia(hero) ? (
                <div className="h-full w-full flex items-center justify-center px-4 text-center text-xs text-white/70">
                  Offline preview unavailable for this clip. Reconnect or trim/compress to keep a local copy.
                </div>
              ) : hero.type?.startsWith("video/") ? (
                <video className="h-full w-full object-cover" src={mediaSrc(hero)} controls playsInline />
              ) : (
                <img
                  className="h-full w-full object-cover"
                  src={mediaSrc(hero)}
                  alt={hero.name || "media"}
                  onError={(e) => {
                    e.currentTarget.alt = "Photo unavailable";
                    e.currentTarget.style.opacity = "0.35";
                  }}
                />
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

          <div className="flex items-center gap-2">
            <button type="button" onClick={onEdit} className="rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/10" title="Edit">
              <Pencil className="h-4 w-4" />
            </button>
            <button type="button" onClick={onShare} className="rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/10" title="Share">
              <Share2 className="h-4 w-4" />
            </button>
            <button type="button" onClick={onDelete} className="rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/10" title="Delete">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <Stat label="TOTAL REPS" value={`${session.totalCompleted} / ${session.totalTarget}`} tone="neutral" />
          <Stat label="FREE PLAY" value={session.freePlayEarned ? "YES" : "NO"} tone={session.freePlayEarned ? "good" : "bad"} />
          <Stat label="SCORE" value={`${completionPct}%`} tone="cyan" />
        </div>
        <div className="mt-2 text-xs text-white/60">Missed attempts: {totalMissed}</div>

        {(session.media || []).length ? (
          <div className="mt-4">
            <div className="text-xs tracking-widest text-white/50">MEDIA</div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(session.media || []).slice(0, 4).map((m) => {
                const isVideo = m.type?.startsWith("video/");
                return (
                  <div key={m.id} className="rounded-2xl overflow-hidden bg-black ring-1 ring-white/10">
                    <div className="aspect-square">
                      {isOfflineOnlyMedia(m) ? (
                        <div className="h-full w-full flex items-center justify-center px-2 text-center text-[11px] text-white/70">
                          Offline unavailable
                        </div>
                      ) : isVideo ? (
                        <video src={mediaSrc(m)} className="h-full w-full object-cover" controls playsInline />
                      ) : (
                        <img
                          src={mediaSrc(m)}
                          alt={m.name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.currentTarget.alt = "Photo unavailable";
                            e.currentTarget.style.opacity = "0.35";
                          }}
                        />
                      )}
                    </div>
                    {canComment ? (
                      <div className="p-2 bg-black/60 ring-1 ring-white/10">
                        {isVideo ? (
                          <button
                            type="button"
                            onClick={() => onEditMedia?.(m.id)}
                            className="mb-2 rounded-xl bg-white/10 ring-1 ring-white/15 px-2.5 py-1 text-[11px] font-bold hover:bg-white/20"
                            title="Trim this saved video"
                          >
                            Trim video
                          </button>
                        ) : null}
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
    card.type === "levelup"
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
                <video className="h-full w-full object-cover" src={mediaSrc(card.media)} controls playsInline />
              ) : (
                <img className="h-full w-full object-cover" src={mediaSrc(card.media)} alt={card.media.name || "media"} />
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
