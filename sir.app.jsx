import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getApps as getFirebaseApps, initializeApp as initializeFirebaseApp } from "firebase/app";
import { getToken as getFirebaseAppCheckToken, initializeAppCheck as initializeFirebaseAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";
import { getAuth as getFirebaseAuth, onAuthStateChanged as onFirebaseAuthStateChanged, signInAnonymously as signInAnonymouslyFirebase } from "firebase/auth";
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
  School,
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

const FIREBASE_CLOUDSYNC_AUTH_MODE = String(import.meta.env.VITE_FIREBASE_CLOUDSYNC_AUTH_MODE || "anonymous")
  .trim()
  .toLowerCase();
const FIREBASE_APPCHECK_SITE_KEY = String(import.meta.env.VITE_FIREBASE_APPCHECK_SITE_KEY || "").trim();
const FIREBASE_CLOUDSYNC_AUTH_DISABLED = FIREBASE_CLOUDSYNC_AUTH_MODE === "none";

const STORAGE_KEY = "skateflow_clean_v1";
const APP_NAME = "Athlete Flow Training Hub";
const APP_WORDMARK = "ATHLETEFLOW";
const APP_TAGLINE = "Training Hub for families, coaches, and pro reviewers";
const APP_FILE_PREFIX = "athleteflow";
const APP_PRACTICE_TITLE = `${APP_NAME} Practice`;
const PROGRAM_TYPE_OPTIONS = ["family", "school-team", "club-team"];
const PROGRAM_LEVEL_OPTIONS = ["youth", "middle-school", "high-school", "college", "adult"];
const BACKGROUND_PRESETS = [
  { key: "aurora", label: "Aurora", css: "linear-gradient(135deg, #05232f 0%, #144d68 45%, #1f7a5d 100%)" },
  { key: "sunset", label: "Sunset", css: "linear-gradient(135deg, #331122 0%, #8a2545 45%, #e16d3d 100%)" },
  { key: "slate", label: "Slate", css: "linear-gradient(135deg, #0b1020 0%, #1e293b 55%, #334155 100%)" },
  { key: "forest", label: "Forest", css: "linear-gradient(135deg, #071a12 0%, #134e4a 50%, #166534 100%)" },
  { key: "royal", label: "Royal", css: "linear-gradient(135deg, #111827 0%, #3730a3 50%, #1d4ed8 100%)" },
];
const UI_LANGUAGE_PREFS = new Set([
  "auto",
  "en",
  "zh-Hans",
  "zh-Hant",
  "ko",
  "ja",
  "fil",
  "th",
  "es",
  "fr",
  "de",
  "it",
  "pt-BR",
  "pt-PT",
  "ru",
  "uk",
  "pl",
  "nl",
  "tr",
  "ar",
  "hi",
  "id",
  "vi",
  "ms",
  "sv",
  "no",
  "da",
  "fi",
  "ro",
  "el",
  "he",
]);
const UI_LANGUAGE_OPTIONS = [
  { value: "auto", label: "Auto (Device)" },
  { value: "en", label: "English" },
  { value: "zh-Hans", label: "中文 (简体)" },
  { value: "zh-Hant", label: "中文 (繁體)" },
  { value: "ko", label: "한국어" },
  { value: "ja", label: "日本語" },
  { value: "fil", label: "Filipino" },
  { value: "th", label: "ไทย" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
  { value: "it", label: "Italiano" },
  { value: "pt-BR", label: "Português (Brasil)" },
  { value: "pt-PT", label: "Português (Portugal)" },
  { value: "ru", label: "Русский" },
  { value: "uk", label: "Українська" },
  { value: "pl", label: "Polski" },
  { value: "nl", label: "Nederlands" },
  { value: "tr", label: "Türkçe" },
  { value: "ar", label: "العربية" },
  { value: "hi", label: "हिन्दी" },
  { value: "id", label: "Bahasa Indonesia" },
  { value: "vi", label: "Tiếng Việt" },
  { value: "ms", label: "Bahasa Melayu" },
  { value: "sv", label: "Svenska" },
  { value: "no", label: "Norsk" },
  { value: "da", label: "Dansk" },
  { value: "fi", label: "Suomi" },
  { value: "ro", label: "Română" },
  { value: "el", label: "Ελληνικά" },
  { value: "he", label: "עברית" },
];
const UI_COPY = {
  en: {
    "app.tagline": "Training Hub for families, coaches, and pro reviewers",
    "tabs.log": "Log",
    "tabs.cards": "Cards",
    "tabs.calendar": "Calendar",
    "tabs.stats": "Stats",
    "tabs.plans": "Plans",
    "tabs.pro": "Pro",
    "tabs.coach": "Coach",
    "tabs.freeSkate": "Free Skate",
    "tabs.contest": "Contest",
    "tabs.team": "Team",
    "tabs.chat": "Chat",
    "tabs.academy": "Academy",
    "tabs.settings": "Settings",
    "settings.language.title": "Language",
    "settings.language.detail": "Set app language for labels and timestamps.",
    "settings.language.label": "App language",
    "settings.theme.title": "Theme",
    "settings.theme.detail": "Switch between dark and light mode.",
    "settings.theme.dark": "Use Dark Mode",
    "settings.theme.light": "Use Light Mode",
    "role.owner": "Owner",
    "role.coach": "Coach",
    "role.dad": "Dad",
    "role.proskater": "Pro Skater",
    "role.media": "Media",
  },
  "zh-Hans": {
    "app.tagline": "面向家庭、教练与职业评审的训练中心",
    "tabs.log": "记录",
    "tabs.cards": "卡片",
    "tabs.calendar": "日历",
    "tabs.stats": "统计",
    "tabs.plans": "计划",
    "tabs.pro": "职业反馈",
    "tabs.coach": "教练",
    "tabs.freeSkate": "自由滑",
    "tabs.contest": "比赛",
    "tabs.team": "团队",
    "tabs.chat": "聊天",
    "tabs.academy": "学院",
    "tabs.settings": "设置",
    "settings.language.title": "语言",
    "settings.language.detail": "设置应用语言与时间显示格式。",
    "settings.language.label": "应用语言",
    "settings.theme.title": "主题",
    "settings.theme.detail": "在深色与浅色模式间切换。",
    "settings.theme.dark": "使用深色模式",
    "settings.theme.light": "使用浅色模式",
    "role.owner": "所有者",
    "role.coach": "教练",
    "role.dad": "家长",
    "role.proskater": "职业滑手",
    "role.media": "媒体",
  },
  ko: {
    "app.tagline": "가족, 코치, 프로 리뷰어를 위한 트레이닝 허브",
    "tabs.log": "기록",
    "tabs.cards": "카드",
    "tabs.calendar": "캘린더",
    "tabs.stats": "통계",
    "tabs.plans": "플랜",
    "tabs.pro": "프로",
    "tabs.coach": "코치",
    "tabs.freeSkate": "프리 스케이트",
    "tabs.contest": "대회",
    "tabs.team": "팀",
    "tabs.chat": "채팅",
    "tabs.academy": "아카데미",
    "tabs.settings": "설정",
    "settings.language.title": "언어",
    "settings.language.detail": "앱 라벨과 시간 표시 언어를 설정합니다.",
    "settings.language.label": "앱 언어",
    "settings.theme.title": "테마",
    "settings.theme.detail": "다크/라이트 모드를 전환합니다.",
    "settings.theme.dark": "다크 모드 사용",
    "settings.theme.light": "라이트 모드 사용",
    "role.owner": "소유자",
    "role.coach": "코치",
    "role.dad": "보호자",
    "role.proskater": "프로 스케이터",
    "role.media": "미디어",
  },
  ja: {
    "app.tagline": "家族・コーチ・プロレビュー向けトレーニングハブ",
    "tabs.log": "記録",
    "tabs.cards": "カード",
    "tabs.calendar": "カレンダー",
    "tabs.stats": "統計",
    "tabs.plans": "プラン",
    "tabs.pro": "プロ",
    "tabs.coach": "コーチ",
    "tabs.freeSkate": "フリースケート",
    "tabs.contest": "大会",
    "tabs.team": "チーム",
    "tabs.chat": "チャット",
    "tabs.academy": "アカデミー",
    "tabs.settings": "設定",
    "settings.language.title": "言語",
    "settings.language.detail": "アプリ表示と言語別の日時表記を設定します。",
    "settings.language.label": "アプリ言語",
    "settings.theme.title": "テーマ",
    "settings.theme.detail": "ダーク/ライトモードを切り替えます。",
    "settings.theme.dark": "ダークモード",
    "settings.theme.light": "ライトモード",
    "role.owner": "オーナー",
    "role.coach": "コーチ",
    "role.dad": "保護者",
    "role.proskater": "プロスケーター",
    "role.media": "メディア",
  },
  fil: {
    "app.tagline": "Training Hub para sa pamilya, coaches, at pro reviewers",
    "tabs.log": "Log",
    "tabs.cards": "Cards",
    "tabs.calendar": "Kalendaryo",
    "tabs.stats": "Stats",
    "tabs.plans": "Plano",
    "tabs.pro": "Pro",
    "tabs.coach": "Coach",
    "tabs.freeSkate": "Free Skate",
    "tabs.contest": "Contest",
    "tabs.team": "Team",
    "tabs.chat": "Chat",
    "tabs.academy": "Academy",
    "tabs.settings": "Settings",
    "settings.language.title": "Wika",
    "settings.language.detail": "Itakda ang wika para sa labels at oras/petsa.",
    "settings.language.label": "Wika ng app",
    "settings.theme.title": "Theme",
    "settings.theme.detail": "Palitan sa dark o light mode.",
    "settings.theme.dark": "Gamitin ang Dark Mode",
    "settings.theme.light": "Gamitin ang Light Mode",
    "role.owner": "Owner",
    "role.coach": "Coach",
    "role.dad": "Parent",
    "role.proskater": "Pro Skater",
    "role.media": "Media",
  },
  th: {
    "app.tagline": "ระบบฝึกซ้อมสำหรับครอบครัว โค้ช และโปรรีวิว",
    "tabs.log": "บันทึก",
    "tabs.cards": "การ์ด",
    "tabs.calendar": "ปฏิทิน",
    "tabs.stats": "สถิติ",
    "tabs.plans": "แผน",
    "tabs.pro": "โปร",
    "tabs.coach": "โค้ช",
    "tabs.freeSkate": "ฟรีสเก็ต",
    "tabs.contest": "แข่งขัน",
    "tabs.team": "ทีม",
    "tabs.chat": "แชต",
    "tabs.academy": "อะคาเดมี",
    "tabs.settings": "ตั้งค่า",
    "settings.language.title": "ภาษา",
    "settings.language.detail": "ตั้งค่าภาษาและรูปแบบวันเวลาในแอป",
    "settings.language.label": "ภาษาแอป",
    "settings.theme.title": "ธีม",
    "settings.theme.detail": "สลับโหมดมืด/สว่าง",
    "settings.theme.dark": "ใช้โหมดมืด",
    "settings.theme.light": "ใช้โหมดสว่าง",
    "role.owner": "เจ้าของ",
    "role.coach": "โค้ช",
    "role.dad": "ผู้ปกครอง",
    "role.proskater": "โปรสเก็ต",
    "role.media": "มีเดีย",
  },
};

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

const KIKO_TEST_PLAN_TEMPLATE = {
  "Kiko Weekly List": [
    { label: "Warm-up carving laps", target: 8, notes: "4 frontside + 4 backside flow laps." },
    { label: "Core trick reps", target: 20, notes: "Focus on clean landings and speed control." },
    { label: "Line consistency runs", target: 6, notes: "Run full line without stopping." },
  ],
  "Kiko Video Tasks": [
    { label: "Record 3 angle clips", target: 3, notes: "Front, side, and follow angle." },
    { label: "Coach annotation review", target: 1, notes: "Review draw-over corrections and notes." },
    { label: "Fix + re-record attempts", target: 6, notes: "Apply correction and compare side-by-side." },
  ],
  "Kiko Contest Prep": [
    { label: "Contest run draft", target: 1, notes: "Build run order in Contest tab timeline." },
    { label: "Landed scoring tricks", target: 10, notes: "Prioritize tricks planned for judges." },
    { label: "Final clean run", target: 3, notes: "Simulate official timed run." },
  ],
};

const TRAINING_SPORT_OPTIONS = [
  { key: "skate", label: "Skateboarding" },
  { key: "bmx", label: "BMX" },
  { key: "roller", label: "Roller Skating / Roller Blades" },
  { key: "scooter", label: "Scooter" },
  { key: "track", label: "Track & Field" },
  { key: "swimming", label: "Swimming" },
  { key: "flag-football", label: "Football (Flag)" },
  { key: "pop-warner", label: "Football (Pop Warner)" },
  { key: "football-7v7-highschool", label: "Football (7v7 + High School)" },
  { key: "gymnastics", label: "Gymnastics" },
  { key: "soccer", label: "Soccer" },
  { key: "baseball", label: "Baseball" },
  { key: "basketball", label: "Basketball" },
  { key: "lacrosse", label: "Lacrosse" },
  { key: "martial-arts", label: "Martial Arts" },
  { key: "surfing", label: "Surfing" },
  { key: "snowboarding", label: "Snowboarding" },
];

const LEGACY_SPORT_KEY_ALIASES = {
  "football-7v7": "football-7v7-highschool",
  "football-highschool": "football-7v7-highschool",
};

const SPORT_PACKAGE_SINGLE = "single";
const SPORT_PACKAGE_MULTI = "multi";

const SPORT_PLAN_TEMPLATES = {
  skate: DEFAULT_PLANS,
  bmx: {
    "Gate Start Day": [
      { label: "Explosive gate starts", target: 12, notes: "First 2 pedals all power." },
      { label: "Clip-in reaction starts", target: 10, notes: "Coach whistle cue." },
      { label: "Sprint finish efforts", target: 8, notes: "20-30m max effort." },
    ],
    "Corner + Pump Day": [
      { label: "Berm corner laps", target: 14, notes: "Eyes through exit." },
      { label: "Pump track laps", target: 10, notes: "No pedaling if possible." },
      { label: "Manual timing reps", target: 8, notes: "Balance + hip control." },
    ],
  },
  roller: {
    "Edge Control Day": [
      { label: "Inside/outside edge circles", target: 16, notes: "Both directions." },
      { label: "One-foot glides", target: 12, notes: "Stable core." },
      { label: "Stop technique reps", target: 10, notes: "T-stop or hockey stop." },
    ],
    "Speed + Footwork Day": [
      { label: "Crossover lanes", target: 12, notes: "Keep shoulders level." },
      { label: "Stride acceleration", target: 10, notes: "5-10 second bursts." },
      { label: "Backward transitions", target: 10, notes: "Forward <-> backward." },
    ],
  },
  scooter: {
    "Street Skill Day": [
      { label: "Barspin progressions", target: 20, notes: "Flat first then obstacle." },
      { label: "Tailwhip catches", target: 18, notes: "Eyes on deck catch." },
      { label: "Bunny hop accuracy", target: 15, notes: "Land on target marks." },
    ],
    "Park Flow Day": [
      { label: "Quarter pipe entries", target: 14, notes: "Control speed to coping." },
      { label: "Fly-out attempts", target: 12, notes: "Compact posture in air." },
      { label: "Line consistency", target: 8, notes: "Complete run clean." },
    ],
  },
  track: {
    "Sprint Mechanics Day": [
      { label: "A-skip / B-skip drills", target: 10, notes: "Technical quality first." },
      { label: "Acceleration starts (10-20m)", target: 12, notes: "Drive phase focus." },
      { label: "Max velocity reps", target: 8, notes: "Full recovery between reps." },
    ],
    "Power + Endurance Day": [
      { label: "Hill sprints", target: 10, notes: "Explosive knee drive." },
      { label: "Tempo intervals", target: 8, notes: "Controlled pace consistency." },
      { label: "Core + mobility set", target: 1, notes: "15-20 min post-run." },
    ],
  },
  swimming: {
    "Technique Day": [
      { label: "Kickboard laps", target: 10, notes: "Body line and kick tempo." },
      { label: "Catch/pull drills", target: 10, notes: "Early vertical forearm." },
      { label: "Breathing pattern sets", target: 8, notes: "Bilateral control." },
    ],
    "Speed + Endurance Day": [
      { label: "Sprint intervals", target: 12, notes: "15-25m max speed." },
      { label: "Pace sets", target: 8, notes: "Hold race pace form." },
      { label: "Turns + push-offs", target: 14, notes: "Wall efficiency." },
    ],
  },
  "flag-football": {
    "Route + Catch Day": [
      { label: "Route tree reps", target: 18, notes: "Sharp cuts + timing." },
      { label: "Hands catches", target: 30, notes: "No body catches." },
      { label: "Flag pull drills", target: 20, notes: "Break down and finish." },
    ],
    "QB + Team Day": [
      { label: "QB drop + throw timing", target: 20, notes: "Set feet quickly." },
      { label: "7-on-7 reads", target: 12, notes: "Primary/secondary read." },
      { label: "Two-minute drive reps", target: 6, notes: "Clock management." },
    ],
  },
  "pop-warner": {
    "Contact Fundamentals Day": [
      { label: "Form tackle reps", target: 16, notes: "Head up, shoulder leverage." },
      { label: "Block fit-ups", target: 16, notes: "Hands inside, low pad level." },
      { label: "Pursuit angles", target: 12, notes: "Team pursuit lanes." },
    ],
    "Position + Team Day": [
      { label: "Position circuit", target: 10, notes: "Role-specific station work." },
      { label: "Special teams reps", target: 10, notes: "Snap/contain discipline." },
      { label: "Scripted team periods", target: 8, notes: "Install + execute." },
    ],
  },
  "football-7v7-highschool": {
    "Timing + Routes Day": [
      { label: "Timing route throws", target: 24, notes: "Rhythm and anticipation." },
      { label: "WR release drills", target: 20, notes: "Beat press quickly." },
      { label: "DB break drills", target: 16, notes: "Plant + drive to ball." },
    ],
    "Coverage + Situational Day": [
      { label: "Red zone concepts", target: 10, notes: "Condensed spacing." },
      { label: "Third-down scenarios", target: 10, notes: "Move chains under pressure." },
      { label: "Turnover circuit", target: 12, notes: "Ball disruption focus." },
    ],
    "Strength + Speed Day": [
      { label: "Explosive lift blocks", target: 6, notes: "Coach-supervised intensity." },
      { label: "40-yard acceleration reps", target: 10, notes: "Fast first 10 yards." },
      { label: "Conditioning finishers", target: 6, notes: "Game-speed effort." },
    ],
    "Install + Film Day": [
      { label: "Install walkthrough", target: 1, notes: "Assignment clarity." },
      { label: "Team period reps", target: 10, notes: "Live execution." },
      { label: "Film correction notes", target: 1, notes: "3 takeaways each session." },
    ],
  },
  gymnastics: {
    "Core Skills Day": [
      { label: "Handstand holds / kicks", target: 16, notes: "Stacked body line." },
      { label: "Cartwheel/roundoff reps", target: 14, notes: "Entry and landing control." },
      { label: "Split + mobility set", target: 1, notes: "Daily flexibility block." },
    ],
    "Power + Routine Day": [
      { label: "Tumble pass attempts", target: 12, notes: "Quality over quantity." },
      { label: "Beam/bars basics", target: 12, notes: "Event confidence." },
      { label: "Routine linking reps", target: 8, notes: "Connection timing." },
    ],
  },
  soccer: {
    "Technical Day": [
      { label: "First touch circuits", target: 20, notes: "Both feet." },
      { label: "Passing combinations", target: 24, notes: "One- and two-touch." },
      { label: "Finishing reps", target: 18, notes: "Different shot angles." },
    ],
    "Tactical + Conditioning Day": [
      { label: "Press/shape drills", target: 12, notes: "Compact team spacing." },
      { label: "1v1 defending", target: 16, notes: "Force outside channel." },
      { label: "Small-sided games", target: 8, notes: "High tempo decisions." },
    ],
  },
  baseball: {
    "Hitting Day": [
      { label: "Tee + front toss swings", target: 40, notes: "Barrel path and timing." },
      { label: "Live batting rounds", target: 12, notes: "Approach by count." },
      { label: "Baserunning starts", target: 14, notes: "Read pitcher rhythm." },
    ],
    "Fielding + Throwing Day": [
      { label: "Infield/outfield reps", target: 24, notes: "Footwork to throw." },
      { label: "Throwing progression", target: 18, notes: "Arm care pacing." },
      { label: "Double play/relay reps", target: 12, notes: "Clean transitions." },
    ],
  },
  basketball: {
    "Skill Work Day": [
      { label: "Ball-handling series", target: 20, notes: "Both hands, game pace." },
      { label: "Shooting spots", target: 60, notes: "Track makes by location." },
      { label: "Finishing package reps", target: 24, notes: "Inside hand + contact." },
    ],
    "Game IQ + Defense Day": [
      { label: "Closeout + slide drills", target: 20, notes: "High hands, no blow-by." },
      { label: "PnR reads", target: 16, notes: "Decision under pressure." },
      { label: "Transition reps", target: 12, notes: "Sprint lanes + spacing." },
    ],
  },
  lacrosse: {
    "Stick Skills Day": [
      { label: "Wall ball routine", target: 80, notes: "Strong + weak hand." },
      { label: "Ground ball pickups", target: 24, notes: "Scoop through traffic." },
      { label: "Passing on the run", target: 20, notes: "Hit target in stride." },
    ],
    "Offense + Defense Day": [
      { label: "Dodging reps", target: 18, notes: "Change of speed." },
      { label: "Shooting accuracy", target: 30, notes: "Corners + quick release." },
      { label: "Defensive footwork", target: 18, notes: "Body position + checks." },
    ],
  },
  "martial-arts": {
    "Technique Day": [
      { label: "Stance + footwork rounds", target: 16, notes: "Balance, guard, clean movement." },
      { label: "Strike/kick form reps", target: 24, notes: "Precision and controlled power." },
      { label: "Defense drill rounds", target: 14, notes: "Block, slip, and counter timing." },
    ],
    "Spar + Conditioning Day": [
      { label: "Partner combo rounds", target: 12, notes: "Light contact and control." },
      { label: "Reaction/counter drills", target: 14, notes: "See cue, respond fast." },
      { label: "Core + cardio finish", target: 1, notes: "15-20 min conditioning block." },
    ],
  },
  surfing: {
    "Paddle + Pop-Up Day": [
      { label: "Paddle endurance intervals", target: 10, notes: "Strong catch and long strokes." },
      { label: "Pop-up speed reps", target: 20, notes: "Explosive feet placement." },
      { label: "Wave entry timing reps", target: 14, notes: "Commit early and angle in." },
    ],
    "Turns + Flow Day": [
      { label: "Bottom turn practice", target: 16, notes: "Compress then drive through." },
      { label: "Top turn control reps", target: 14, notes: "Eyes and shoulders lead." },
      { label: "Linking maneuvers", target: 10, notes: "Flow without stalling." },
    ],
  },
  snowboarding: {
    "Edge Control Day": [
      { label: "Heel/toe edge transitions", target: 20, notes: "Smooth edge changes." },
      { label: "Carving laps", target: 14, notes: "Pressure through turns." },
      { label: "Stopping + speed control", target: 16, notes: "Confident braking on slope." },
    ],
    "Park + Skills Day": [
      { label: "Ollie / flat-ground pop", target: 18, notes: "Stable stance on landing." },
      { label: "Box/rail approach reps", target: 12, notes: "Straight line entry and exit." },
      { label: "Small jump timing reps", target: 12, notes: "Absorb and land centered." },
    ],
  },
};

function sportLabelFromKey(key) {
  return TRAINING_SPORT_OPTIONS.find((s) => s.key === key)?.label || "Sport";
}

function normalizeSportKey(value, fallback = "skate") {
  const keyRaw = String(value || "").trim().toLowerCase();
  const key = LEGACY_SPORT_KEY_ALIASES[keyRaw] || keyRaw;
  if (TRAINING_SPORT_OPTIONS.some((s) => s.key === key)) return key;
  const fallbackRaw = String(fallback || "").trim().toLowerCase();
  const fallbackKey = LEGACY_SPORT_KEY_ALIASES[fallbackRaw] || fallbackRaw;
  if (TRAINING_SPORT_OPTIONS.some((s) => s.key === fallbackKey)) return fallbackKey;
  return "skate";
}

function normalizeSportPackage(value, fallback = SPORT_PACKAGE_SINGLE) {
  return String(value || "").trim().toLowerCase() === SPORT_PACKAGE_MULTI ? SPORT_PACKAGE_MULTI : fallback;
}

function buildSportPlanSections(sportKey, opts = {}) {
  const template = toObj(SPORT_PLAN_TEMPLATES[sportKey], {});
  const prefixDays = opts?.prefixDays !== false;
  const prefix = prefixDays ? `${sportLabelFromKey(sportKey)} • ` : "";
  const next = {};
  for (const [dayName, tasks] of Object.entries(template)) {
    next[`${prefix}${dayName}`] = toArray(tasks).map((task, idx) => ({
      id: `t-${sportKey}-${idx}-${uid()}`,
      label: String(task?.label || ""),
      target: Math.max(0, Number(task?.target) || 0),
      notes: String(task?.notes || ""),
    }));
  }
  return next;
}

function normalizePlansMap(inputPlans, fallbackPlans = DEFAULT_PLANS) {
  const base = toObj(inputPlans, {});
  const out = {};
  for (const [dayNameRaw, tasks] of Object.entries(base)) {
    const dayName = String(dayNameRaw || "").trim();
    if (!dayName) continue;
    out[dayName] = toArray(tasks).map((task, idx) => ({
      id: String(task?.id || `t-${uid()}`),
      label: String(task?.label || `Task ${idx + 1}`),
      target: Math.max(0, Number(task?.target) || 0),
      notes: String(task?.notes || ""),
    }));
  }
  if (Object.keys(out).length) return out;

  const fallback = toObj(fallbackPlans, {});
  const fallbackOut = {};
  for (const [dayNameRaw, tasks] of Object.entries(fallback)) {
    const dayName = String(dayNameRaw || "").trim();
    if (!dayName) continue;
    fallbackOut[dayName] = toArray(tasks).map((task, idx) => ({
      id: String(task?.id || `t-${uid()}`),
      label: String(task?.label || `Task ${idx + 1}`),
      target: Math.max(0, Number(task?.target) || 0),
      notes: String(task?.notes || ""),
    }));
  }
  return Object.keys(fallbackOut).length ? fallbackOut : { "Training Day": [] };
}

function defaultPlansForSport(sportKey) {
  const normalizedSportKey = normalizeSportKey(sportKey, "skate");
  return normalizePlansMap(buildSportPlanSections(normalizedSportKey, { prefixDays: false }), DEFAULT_PLANS);
}

function resolveDraftDayTypeForPlans(planMap, currentDayType = "") {
  const plans = toObj(planMap, {});
  const dayType = String(currentDayType || "");
  if (dayType === MEDIA_DAY_LABEL) return MEDIA_DAY_LABEL;
  if (dayType && plans[dayType]) return dayType;
  return Object.keys(plans)[0] || "Grind Day";
}

function participantLabelForSport(sportKey, opts = {}) {
  const singular = normalizeSportKey(sportKey, "skate") === "skate" ? "Skater" : "Athlete";
  const plural = singular === "Skater" ? "Skaters" : "Athletes";
  if (opts?.plural) return opts?.lower ? plural.toLowerCase() : plural;
  return opts?.lower ? singular.toLowerCase() : singular;
}

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
  autoSyncEnabled: true,
  autoSyncIntervalMin: 1,
  autoPullOnLoad: true,
  lastSyncAt: "",
  lastDirection: "",
};

function createDefaultBetaCheck() {
  return { checkedById: {}, notesById: {}, updatedAt: "" };
}

function createDefaultBackgroundPref() {
  return {
    mode: "default", // default | preset | image
    presetKey: "aurora",
    imageUrl: "",
    imageLayout: "fit", // fit | tile
  };
}

function createDefaultProgramProfile() {
  return {
    enabled: false,
    programType: "family",
    level: "youth",
    schoolName: "",
    teamName: "",
    cityState: "",
    season: "",
    notes: "",
  };
}

function createDefaultProFeedback() {
  return {
    enabled: false,
    priceUsd: 65,
    ownerShareUsd: 30,
    weeklyPayoutDay: "Friday",
    paypalMeUrl: "",
    paypalEmail: "",
    paymentUrl: "",
    instructions: "Families pay your PayPal first. Pro payouts are sent weekly after payment is confirmed.",
    requestsBySkaterId: {},
  };
}

const MEMBER_ROLES = new Set(["owner", "coach", "dad", "proskater", "media", "skater"]);

function normalizeMemberRole(value, fallback = "dad") {
  const role = String(value || "").trim().toLowerCase();
  if (MEMBER_ROLES.has(role)) return role;
  return MEMBER_ROLES.has(String(fallback || "").trim().toLowerCase()) ? String(fallback || "").trim().toLowerCase() : "dad";
}

const INITIAL_STORE = {
  members: [
    { id: "m-1", name: "Myisha", role: "owner", pin: "", photoUrl: "", biometricCredentialId: "" },
    { id: "m-2", name: "Coach", role: "coach", pin: "", photoUrl: "", biometricCredentialId: "" },
    { id: "m-3", name: "Dad", role: "dad", pin: "", photoUrl: "", biometricCredentialId: "" },
    { id: "m-5", name: "Pro Skater", role: "proskater", pin: "", photoUrl: "", biometricCredentialId: "" },
    { id: "m-6", name: "Media", role: "media", pin: "", photoUrl: "", biometricCredentialId: "" },
    { id: "m-4", name: "Conner", role: "skater", pin: "", photoUrl: "", biometricCredentialId: "" },
    { id: "m-7", name: "Kiko Test", role: "skater", pin: "", photoUrl: "", biometricCredentialId: "" },
  ],
  skaters: [
    { id: "s-1", name: "Conner", photoUrl: "" },
    { id: "s-2", name: "Kiko Test", photoUrl: "" },
  ],
  plans: normalizePlansMap(DEFAULT_PLANS, DEFAULT_PLANS),
  sessions: [],
  chatBySkaterId: {},
  practiceEvents: [],
  xpBySkaterId: {},
  xpMilestonesBySkaterId: {},
  practiceSettings: { durationMin: 60, remindMin: 60, title: APP_PRACTICE_TITLE, park: "" },
  reminders: { enabled: false, time: "17:00" },
  draft: { date: todayISO(), park: "", dayType: Object.keys(DEFAULT_PLANS)[0], completedByTaskId: {}, missedByTaskId: {} },
  auth: { loggedInMemberId: null },
  ui: { view: "log", activeMemberId: "m-1", activeSkaterId: "s-1" },
  contestBySkaterId: {},
  coachCornerBySkaterId: {},
  trickProfileBySkaterId: {},
  academyBySkaterId: {},
  skateDaysBySkaterId: {},
  trainingSportBySkaterId: { "s-1": "skate", "s-2": "skate" },
  primarySportBySkaterId: { "s-1": "skate", "s-2": "skate" },
  sportPackageBySkaterId: { "s-1": SPORT_PACKAGE_SINGLE, "s-2": SPORT_PACKAGE_SINGLE },
  plansBySportBySkaterId: {
    "s-1": {
      skate: normalizePlansMap(DEFAULT_PLANS, DEFAULT_PLANS),
    },
    "s-2": {
      skate: normalizePlansMap(DEFAULT_PLANS, DEFAULT_PLANS),
    },
  },
  parkProfiles: DEFAULT_PARK_PROFILES,
  parkPrefsBySkaterId: {},
  appPrefs: { theme: "dark", language: "auto", backgroundByMemberId: {}, copyOverridesByLanguage: {} },
  programProfile: createDefaultProgramProfile(),
  cloudSync: DEFAULT_CLOUD_SYNC,
  betaCheck: createDefaultBetaCheck(),
  proFeedback: createDefaultProFeedback(),
};

const VALID_VIEWS = new Set(["log", "cards", "calendar", "dash", "plans", "coach", "skateday", "contest", "academy", "team", "chat", "profeedback", "settings"]);
const MEDIA_DAY_LABEL = "Media Day";
const FREE_SKATE_KIND = "free-skate";
const SKATE_TRIP_KIND = "skate-trip";
const MAX_UPLOAD_COUNT = 24;
const MAX_MEDIA_FILE_BYTES = 80 * 1024 * 1024;
const MAX_IMAGE_FILE_BYTES = 25 * 1024 * 1024;
const MAX_BACKUP_BYTES = 8 * 1024 * 1024;
const MAX_ICS_BYTES = 2 * 1024 * 1024;
const MAX_EMBEDDED_MEDIA_BYTES = 2 * 1024 * 1024;
const BUILD_STAMP = "beta-2026-02-22-1";
const GOSKATE_LISTING_API = "https://goskate.com/sp/wp-json/wp/v2/listing";
const GOSKATE_LISTING_FIELDS = "id,link,title.rendered,property_meta.REAL_HOMES_property_location,property_meta.REAL_HOMES_property_address,modified";

const BETA_CHECK_ITEMS = [
  { id: "login", label: "Login and member switching", detail: "PIN login works for owner/coach/dad/pro/media and the athlete profile role." },
  { id: "log_session", label: "Log and save session", detail: "Session saves with reps and scores." },
  { id: "media_upload", label: "Media upload", detail: "Photo/video upload works in Log and Cards." },
  { id: "media_trim", label: "Video trim/edit", detail: "Trim tool saves updated clip." },
  { id: "contest", label: "Contest run tracking", detail: "Runs, tricks, song, and media save correctly." },
  { id: "skate_day", label: "Free Skate tab", detail: "Free skate/skate trip entry and media save correctly." },
  { id: "chat", label: "Team chat", detail: "Chat send/clear works for the active athlete profile." },
  { id: "cloud_sync", label: "Cloud sync", detail: "Push/Pull and auto sync work across devices." },
  { id: "ios_pwa", label: "iPhone home screen", detail: "App opens from Add to Home Screen." },
  { id: "light_mode", label: "Light mode readability", detail: "Text/buttons remain readable in light mode." },
];

const SKATE_TRICK_CATALOG = [
  {
    key: "street",
    label: "Street",
    tricks: [
      "Ollie",
      "Nollie",
      "Fakie Ollie",
      "Switch Ollie",
      "Kickflip",
      "Heelflip",
      "Varial Kickflip",
      "Varial Heelflip",
      "Hardflip",
      "Inward Heelflip",
      "360 Flip",
      "Laser Flip",
      "Bigspin",
      "Bigflip",
      "Frontside Shove-it",
      "Backside Shove-it",
      "Frontside Pop Shove-it",
      "Backside Pop Shove-it",
      "Impossible",
      "Boneless",
      "Wallie",
      "No Comply",
      "Manual",
      "Nose Manual",
      "50-50 Grind",
      "5-0 Grind",
      "Nose Grind",
      "Smith Grind",
      "Feeble Grind",
      "Crooked Grind",
      "Over Crook",
      "Noseblunt Slide",
      "Boardslide",
      "Lipslide",
      "Noseslide",
      "Tailslide",
      "Frontside Bluntslide",
      "Backside Tailslide",
    ],
  },
  {
    key: "vert",
    label: "Vert",
    tricks: [
      "Frontside Air",
      "Backside Air",
      "Indy Air",
      "Melon Grab",
      "Mute Grab",
      "Method Air",
      "Stalefish",
      "Lien Air",
      "Crail Air",
      "Nosegrab",
      "Tailgrab",
      "Japan Air",
      "Madonna",
      "Benihana",
      "Frontside Invert",
      "Backside Invert",
      "Andrecht",
      "Handplant",
      "Eggplant",
      "McTwist",
      "540",
      "720",
      "900",
      "Caballerial",
      "Half Cab",
      "Varial 540",
      "Stalefish 540",
      "Backside Boneless",
    ],
  },
  {
    key: "pool_bowl",
    label: "Pool/Bowl",
    tricks: [
      "Carve",
      "Layback Carve",
      "Slash Grind",
      "Frontside Grind",
      "Backside Grind",
      "Rock to Fakie",
      "Rock and Roll",
      "Fakie Rock",
      "Disaster",
      "Frontside Disaster",
      "Backside Disaster",
      "Axle Stall",
      "Smith Stall",
      "Feeble Stall",
      "Nose Stall",
      "5-0 Stall",
      "Blunt Stall",
      "Boneless in Bowl",
      "Frontside Air Over Hip",
      "Backside Air Over Hip",
      "Transfer Air",
      "Pool Invert",
      "Bowl Invert",
      "Fakie Smith",
      "Fakie 5-0",
      "Frontside Smith Grind",
      "Backside Smith Grind",
      "Hurricane Grind",
    ],
  },
  {
    key: "combi",
    label: "Combi",
    tricks: [
      "Line: FS Air to Grind",
      "Line: BS Air to Disaster",
      "Line: Invert to Grind",
      "Line: Caballerial to Air",
      "Line: Grind Transfer",
      "Line: Hip Transfer",
      "Line: Air to Lip Trick",
      "Line: Lip Trick to Revert",
      "Line: Revert to Air",
      "Line: Trick Combo (3+)",
      "Combi Extension Transfer",
      "Combi Deep End Air",
      "Combi Frontside Layback",
      "Combi Backside Layback",
      "Combi Speed Pump Line",
      "Combi Last-Hit Finisher",
    ],
  },
  {
    key: "mega",
    label: "Mega Ramp",
    tricks: [
      "Mega Frontside Air",
      "Mega Backside Air",
      "Mega Indy",
      "Mega Melon",
      "Mega Stalefish",
      "Mega Method",
      "Mega 360",
      "Mega 540",
      "Mega 720",
      "Mega 900",
      "Mega Bigspin",
      "Mega Heelflip",
      "Mega Kickflip",
      "Mega Flip Variation",
      "Mega Transfer",
      "Mega Gap to Rail",
      "Mega Frontside Grind",
      "Mega Backside Grind",
      "Mega Tailgrab",
      "Mega Trick Combo",
    ],
  },
];

function trickIdFromName(categoryKey, name) {
  const cat = String(categoryKey || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const slug = String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${cat}:${slug || `trick-${uid()}`}`;
}

const SKATE_TRICK_LIBRARY = SKATE_TRICK_CATALOG.flatMap((cat) =>
  toArray(cat.tricks).map((name) => ({
    id: trickIdFromName(cat.key, name),
    name: String(name || "").trim(),
    category: String(cat.key || ""),
    categoryLabel: String(cat.label || ""),
  }))
);

const SKATE_TRICK_LIBRARY_BY_ID = Object.fromEntries(SKATE_TRICK_LIBRARY.map((t) => [t.id, t]));
const SKATE_TRICK_LIBRARY_BY_NAME = Object.fromEntries(
  SKATE_TRICK_LIBRARY.map((t) => [String(t?.name || "").trim().toLowerCase(), t]).filter(([name]) => !!name)
);

function findTrickByName(name) {
  const key = String(name || "").trim().toLowerCase();
  if (!key) return null;
  return SKATE_TRICK_LIBRARY_BY_NAME[key] || null;
}

const TRICK_TOKEN_ALIASES = {
  fs: "frontside",
  bs: "backside",
  "b/s": "backside",
  "f/s": "frontside",
};

function normalizeTrickSearchText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\.[a-z0-9]{2,6}$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizeTrickSearchText(value) {
  return Array.from(
    new Set(
      normalizeTrickSearchText(value)
        .split(" ")
        .filter(Boolean)
        .map((token) => TRICK_TOKEN_ALIASES[token] || token)
    )
  );
}

function inferTrickSuggestionsFromFileName(fileName, maxResults = 3) {
  const sourceText = normalizeTrickSearchText(fileName);
  if (!sourceText) return [];
  const sourceTokens = tokenizeTrickSearchText(sourceText);
  if (!sourceTokens.length) return [];
  const sourceSet = new Set(sourceTokens);
  const scored = [];

  for (const trick of SKATE_TRICK_LIBRARY) {
    const trickName = String(trick?.name || "");
    const trickText = normalizeTrickSearchText(trickName);
    if (!trickText) continue;
    const trickTokens = tokenizeTrickSearchText(trickText);
    if (!trickTokens.length) continue;

    const tokenHits = trickTokens.reduce((sum, token) => sum + (sourceSet.has(token) ? 1 : 0), 0);
    const fullPhraseHit = sourceText.includes(trickText);
    if (!tokenHits && !fullPhraseHit) continue;

    const tokenScore = tokenHits / trickTokens.length;
    const phraseBonus = fullPhraseHit ? 0.38 : 0;
    const shortClipHintBonus = sourceTokens.length <= 3 && tokenHits > 0 ? 0.08 : 0;
    const rawScore = tokenScore * 0.75 + phraseBonus + shortClipHintBonus;
    const confidence = Math.max(0.25, Math.min(0.98, Number(rawScore.toFixed(2))));
    scored.push({
      id: String(trick.id || ""),
      name: trickName,
      confidence,
    });
  }

  return scored.sort((a, b) => b.confidence - a.confidence || a.name.length - b.name.length).slice(0, Math.max(1, Number(maxResults) || 3));
}

function normalizeTrickAssist(value, fallbackFileName = "") {
  const src = toObj(value, {});
  const fallbackSuggestions = inferTrickSuggestionsFromFileName(fallbackFileName, 3);
  const suggestionsRaw = toArray(src.suggestions).length ? toArray(src.suggestions) : fallbackSuggestions;
  const suggestions = suggestionsRaw
    .map((item) => {
      const id = String(item?.id || "");
      const fallbackName = SKATE_TRICK_LIBRARY_BY_ID[id]?.name || "";
      const name = String(item?.name || fallbackName).trim();
      if (!name) return null;
      const confidenceRaw = Number(item?.confidence);
      const confidence = Number.isFinite(confidenceRaw) ? Math.max(0, Math.min(0.99, confidenceRaw)) : 0.5;
      return { id: id || trickIdFromName("assist", name), name, confidence: Number(confidence.toFixed(2)) };
    })
    .filter(Boolean)
    .slice(0, 3);

  const selectedNameRaw = String(src.selectedTrickName || "").trim();
  const selectedIdRaw = String(src.selectedTrickId || "").trim();
  let selectedTrickId = selectedIdRaw;
  let selectedTrickName = selectedNameRaw;
  if (!selectedTrickName && suggestions[0]?.name) selectedTrickName = suggestions[0].name;
  if (!selectedTrickId && suggestions[0]?.id) selectedTrickId = suggestions[0].id;
  if (selectedTrickName && !selectedTrickId) {
    const byName = findTrickByName(selectedTrickName);
    if (byName?.id) selectedTrickId = byName.id;
  }
  if (selectedTrickId && !selectedTrickName) {
    selectedTrickName = SKATE_TRICK_LIBRARY_BY_ID[selectedTrickId]?.name || selectedTrickName;
  }

  return {
    source: String(src.source || "filename-assist-v1"),
    suggestions,
    selectedTrickId: selectedTrickId || "",
    selectedTrickName: selectedTrickName || "",
  };
}

function createDefaultTrickProfile() {
  return {
    learnedIds: [],
    wishlistIds: [],
    customTricks: [],
  };
}

function normalizeTrickProfile(value) {
  const src = { ...createDefaultTrickProfile(), ...toObj(value, {}) };
  const cleanIds = (input) =>
    Array.from(
      new Set(
        toArray(input)
          .map((v) => String(v || "").trim())
          .filter(Boolean)
      )
    ).slice(0, 1200);
  const customTricks = toArray(src.customTricks)
    .map((item) => {
      const name = String(item?.name || "").trim();
      const category = String(item?.category || "street")
        .trim()
        .toLowerCase();
      if (!name) return null;
      const id = String(item?.id || trickIdFromName(category || "street", name));
      return {
        id,
        name,
        category: ["street", "vert", "pool_bowl", "combi", "mega"].includes(category) ? category : "street",
      };
    })
    .filter(Boolean)
    .slice(0, 500);
  const validCustomIds = new Set(customTricks.map((x) => x.id));
  const validIds = new Set([...Object.keys(SKATE_TRICK_LIBRARY_BY_ID), ...validCustomIds]);
  const learnedIds = cleanIds(src.learnedIds).filter((id) => validIds.has(id));
  const wishlistIds = cleanIds(src.wishlistIds).filter((id) => validIds.has(id));
  return { learnedIds, wishlistIds, customTricks };
}

function normalizeHexColor(value, fallback = "#84cc16") {
  const raw = String(value || "").trim();
  if (/^#[0-9a-f]{6}$/i.test(raw)) return raw.toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(raw)) {
    const [r, g, b] = raw.slice(1).split("");
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return fallback;
}

function normalizeMoneyAmount(value, fallback = 0) {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return fallback;
  return Math.round(num * 100) / 100;
}

function normalizeCurrencyCode(value, fallback = "USD") {
  const allowed = new Set(["USD", "CAD", "MXN", "EUR", "GBP", "JPY", "KRW", "PHP", "THB", "AUD", "NZD"]);
  const code = String(value || "")
    .trim()
    .toUpperCase();
  if (allowed.has(code)) return code;
  return allowed.has(fallback) ? fallback : "USD";
}

function normalizeImageOrExternalUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^data:image\//i.test(raw)) return raw;
  return normalizeExternalUrl(raw);
}

function createDefaultAcademyState() {
  return {
    programName: "First Class Skate",
    enabled: true,
    membersOnly: true,
    memberIds: [],
    branding: {
      logoUrl: "",
      bannerUrl: "",
      accentColor: "#84cc16",
      cardColor: "#0f172a",
      textColor: "#ffffff",
      subtitle: "",
    },
    fees: {
      enabled: false,
      currency: "USD",
      monthlyPrice: 0,
      yearlyPrice: 0,
      dropInPrice: 0,
      privateLessonPrice: 0,
      paymentUrl: "",
      notes: "",
    },
    courses: [],
  };
}

function normalizeAcademyState(value) {
  const src = { ...createDefaultAcademyState(), ...toObj(value, {}) };
  const srcBranding = { ...createDefaultAcademyState().branding, ...toObj(src.branding, {}) };
  const srcFees = { ...createDefaultAcademyState().fees, ...toObj(src.fees, {}) };
  return {
    programName: String(src.programName || "First Class Skate").trim() || "First Class Skate",
    enabled: src.enabled !== false,
    membersOnly: src.membersOnly !== false,
    memberIds: Array.from(
      new Set(
        toArray(src.memberIds)
          .map((v) => String(v || "").trim())
          .filter(Boolean)
      )
    ),
    branding: {
      logoUrl: normalizeImageOrExternalUrl(srcBranding.logoUrl),
      bannerUrl: normalizeImageOrExternalUrl(srcBranding.bannerUrl),
      accentColor: normalizeHexColor(srcBranding.accentColor, "#84cc16"),
      cardColor: normalizeHexColor(srcBranding.cardColor, "#0f172a"),
      textColor: normalizeHexColor(srcBranding.textColor, "#ffffff"),
      subtitle: String(srcBranding.subtitle || "").slice(0, 140),
    },
    fees: {
      enabled: !!srcFees.enabled,
      currency: normalizeCurrencyCode(srcFees.currency, "USD"),
      monthlyPrice: normalizeMoneyAmount(srcFees.monthlyPrice, 0),
      yearlyPrice: normalizeMoneyAmount(srcFees.yearlyPrice, 0),
      dropInPrice: normalizeMoneyAmount(srcFees.dropInPrice, 0),
      privateLessonPrice: normalizeMoneyAmount(srcFees.privateLessonPrice, 0),
      paymentUrl: normalizeExternalUrl(srcFees.paymentUrl || ""),
      notes: String(srcFees.notes || "").slice(0, 500),
    },
    courses: toArray(src.courses)
      .map((course) => {
        const title = String(course?.title || "").trim();
        if (!title) return null;
        return {
          id: String(course?.id || `ac-${uid()}`),
          title,
          summary: String(course?.summary || ""),
          level: String(course?.level || "All Levels"),
          media: toArray(course?.media).map((m) => ({
            id: String(m?.id || `acm-${uid()}`),
            type: String(m?.type || ""),
            name: String(m?.name || ""),
            size: Math.max(0, Number(m?.size) || 0),
            url: String(m?.url || ""),
            dataUrl: String(m?.dataUrl || ""),
            trickAssist: normalizeTrickAssist(m?.trickAssist, m?.name || ""),
          })),
          createdBy: String(course?.createdBy || ""),
          createdAt: String(course?.createdAt || new Date().toISOString()),
        };
      })
      .filter(Boolean)
      .slice(0, 300),
  };
}

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

const firebaseCloudSyncRuntime = {
  app: null,
  appKey: "",
  appCheck: null,
  appCheckReady: false,
  appCheckKey: "",
};

function buildFirebaseWebConfigForCloudSync(config) {
  const projectId = normalizeFirebaseProjectId(config?.projectId);
  const apiKey = String(config?.apiKey || "").trim();
  if (!projectId || !apiKey) return null;
  return {
    apiKey,
    projectId,
    authDomain: `${projectId}.firebaseapp.com`,
    storageBucket: `${projectId}.appspot.com`,
  };
}

function getFirebaseCloudSyncApp(config) {
  const firebaseConfig = buildFirebaseWebConfigForCloudSync(config);
  if (!firebaseConfig) return null;
  const appKey = `${firebaseConfig.projectId}|${firebaseConfig.apiKey}`;
  if (firebaseCloudSyncRuntime.app && firebaseCloudSyncRuntime.appKey === appKey) return firebaseCloudSyncRuntime.app;
  const appName = "athleteflow-cloud-sync";
  const app = getFirebaseApps().find((entry) => entry.name === appName) || initializeFirebaseApp(firebaseConfig, appName);
  firebaseCloudSyncRuntime.app = app;
  firebaseCloudSyncRuntime.appKey = appKey;
  firebaseCloudSyncRuntime.appCheck = null;
  firebaseCloudSyncRuntime.appCheckReady = false;
  firebaseCloudSyncRuntime.appCheckKey = "";
  return app;
}

async function waitForFirebaseAuthUser(auth, timeoutMs = 8000) {
  if (!auth) return null;
  if (auth.currentUser) return auth.currentUser;
  return await new Promise((resolve) => {
    let done = false;
    const stop = onFirebaseAuthStateChanged(
      auth,
      (user) => {
        if (done) return;
        done = true;
        try {
          stop();
        } catch {
          // ignore
        }
        resolve(user || null);
      },
      () => {
        if (done) return;
        done = true;
        try {
          stop();
        } catch {
          // ignore
        }
        resolve(null);
      }
    );
    window.setTimeout(() => {
      if (done) return;
      done = true;
      try {
        stop();
      } catch {
        // ignore
      }
      resolve(auth.currentUser || null);
    }, Math.max(2000, Number(timeoutMs) || 8000));
  });
}

async function getCloudSyncAuthIdToken(config) {
  if (FIREBASE_CLOUDSYNC_AUTH_DISABLED) return "";
  try {
    const app = getFirebaseCloudSyncApp(config);
    if (!app) return "";
    const auth = getFirebaseAuth(app);
    if (!auth.currentUser && FIREBASE_CLOUDSYNC_AUTH_MODE === "anonymous") {
      await signInAnonymouslyFirebase(auth);
    }
    const user = auth.currentUser || (await waitForFirebaseAuthUser(auth));
    if (!user) return "";
    return await user.getIdToken();
  } catch (err) {
    console.warn("Cloud sync auth token unavailable:", err);
    return "";
  }
}

async function getCloudSyncAppCheckToken(config) {
  if (!FIREBASE_APPCHECK_SITE_KEY) return "";
  try {
    const app = getFirebaseCloudSyncApp(config);
    if (!app) return "";
    const appCheckKey = `${firebaseCloudSyncRuntime.appKey}|${FIREBASE_APPCHECK_SITE_KEY}`;
    if (!firebaseCloudSyncRuntime.appCheckReady || firebaseCloudSyncRuntime.appCheckKey !== appCheckKey) {
      firebaseCloudSyncRuntime.appCheck = initializeFirebaseAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(FIREBASE_APPCHECK_SITE_KEY),
        isTokenAutoRefreshEnabled: true,
      });
      firebaseCloudSyncRuntime.appCheckReady = true;
      firebaseCloudSyncRuntime.appCheckKey = appCheckKey;
    }
    if (!firebaseCloudSyncRuntime.appCheck) return "";
    const tokenResult = await getFirebaseAppCheckToken(firebaseCloudSyncRuntime.appCheck, false);
    return String(tokenResult?.token || "");
  } catch (err) {
    console.warn("Cloud sync App Check token unavailable:", err);
    return "";
  }
}

async function buildCloudSyncRequestHeaders(config, opts = {}) {
  const headers = {};
  if (opts.contentType !== false) headers["Content-Type"] = "application/json";
  const [idToken, appCheckToken] = await Promise.all([getCloudSyncAuthIdToken(config), getCloudSyncAppCheckToken(config)]);
  if (idToken) headers.Authorization = `Bearer ${idToken}`;
  if (appCheckToken) headers["X-Firebase-AppCheck"] = appCheckToken;
  return headers;
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
    academyBySkaterId: Object.fromEntries(
      Object.entries(toObj(normalized.academyBySkaterId, {})).map(([k, state]) => [
        k,
        {
          ...toObj(state, {}),
          courses: toArray(state?.courses).map((course) => ({
            ...toObj(course, {}),
            media: toArray(course?.media).map(makeCloudSafeMedia),
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

function normalizeWeekday(value, fallback = "Friday") {
  const allowed = new Set(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]);
  const raw = String(value || "").trim().toLowerCase();
  const found = Array.from(allowed).find((day) => day.toLowerCase() === raw);
  if (found) return found;
  return allowed.has(fallback) ? fallback : "Friday";
}

function normalizeBackgroundPref(value) {
  const src = toObj(value, {});
  const modeRaw = String(src.mode || "").trim().toLowerCase();
  const mode = modeRaw === "preset" || modeRaw === "image" ? modeRaw : "default";
  const presetFallback = createDefaultBackgroundPref().presetKey;
  const presetCandidate = String(src.presetKey || "").trim().toLowerCase();
  const presetKey = BACKGROUND_PRESETS.some((p) => p.key === presetCandidate) ? presetCandidate : presetFallback;
  const imageUrl = String(src.imageUrl || "");
  const imageLayout = String(src.imageLayout || "").trim().toLowerCase() === "tile" ? "tile" : "fit";
  return {
    mode,
    presetKey,
    imageUrl: mode === "image" ? imageUrl : mode === "preset" ? "" : "",
    imageLayout,
  };
}

function normalizeUiLanguagePref(value, fallback = "auto") {
  const next = String(value || "").trim();
  if (UI_LANGUAGE_PREFS.has(next)) return next;
  return UI_LANGUAGE_PREFS.has(fallback) ? fallback : "auto";
}

function detectUiLanguageFromNavigator() {
  if (typeof navigator === "undefined") return "en";
  const raw = String(navigator.language || "").toLowerCase();
  if (raw.startsWith("zh-hant") || raw.startsWith("zh-tw") || raw.startsWith("zh-hk") || raw.startsWith("zh-mo")) return "zh-Hant";
  if (raw.startsWith("zh")) return "zh-Hans";
  if (raw.startsWith("ko")) return "ko";
  if (raw.startsWith("ja")) return "ja";
  if (raw.startsWith("th")) return "th";
  if (raw.startsWith("fil") || raw.startsWith("tl")) return "fil";
  if (raw.startsWith("es")) return "es";
  if (raw.startsWith("fr")) return "fr";
  if (raw.startsWith("de")) return "de";
  if (raw.startsWith("it")) return "it";
  if (raw.startsWith("pt-br")) return "pt-BR";
  if (raw.startsWith("pt")) return "pt-PT";
  if (raw.startsWith("ru")) return "ru";
  if (raw.startsWith("uk")) return "uk";
  if (raw.startsWith("pl")) return "pl";
  if (raw.startsWith("nl")) return "nl";
  if (raw.startsWith("tr")) return "tr";
  if (raw.startsWith("ar")) return "ar";
  if (raw.startsWith("hi")) return "hi";
  if (raw.startsWith("id")) return "id";
  if (raw.startsWith("vi")) return "vi";
  if (raw.startsWith("ms")) return "ms";
  if (raw.startsWith("sv")) return "sv";
  if (raw.startsWith("no") || raw.startsWith("nb") || raw.startsWith("nn")) return "no";
  if (raw.startsWith("da")) return "da";
  if (raw.startsWith("fi")) return "fi";
  if (raw.startsWith("ro")) return "ro";
  if (raw.startsWith("el")) return "el";
  if (raw.startsWith("he") || raw.startsWith("iw")) return "he";
  return "en";
}

function resolveUiLanguage(pref) {
  const normalized = normalizeUiLanguagePref(pref, "auto");
  if (normalized === "auto") return detectUiLanguageFromNavigator();
  return UI_LANGUAGE_PREFS.has(normalized) && normalized !== "auto" ? normalized : "en";
}

function localeFromUiLanguage(language) {
  const normalized = resolveUiLanguage(language);
  if (normalized === "zh-Hans") return "zh-CN";
  if (normalized === "zh-Hant") return "zh-TW";
  if (normalized === "ko") return "ko-KR";
  if (normalized === "ja") return "ja-JP";
  if (normalized === "fil") return "fil-PH";
  if (normalized === "th") return "th-TH";
  if (normalized === "es") return "es-ES";
  if (normalized === "fr") return "fr-FR";
  if (normalized === "de") return "de-DE";
  if (normalized === "it") return "it-IT";
  if (normalized === "pt-BR") return "pt-BR";
  if (normalized === "pt-PT") return "pt-PT";
  if (normalized === "ru") return "ru-RU";
  if (normalized === "uk") return "uk-UA";
  if (normalized === "pl") return "pl-PL";
  if (normalized === "nl") return "nl-NL";
  if (normalized === "tr") return "tr-TR";
  if (normalized === "ar") return "ar-SA";
  if (normalized === "hi") return "hi-IN";
  if (normalized === "id") return "id-ID";
  if (normalized === "vi") return "vi-VN";
  if (normalized === "ms") return "ms-MY";
  if (normalized === "sv") return "sv-SE";
  if (normalized === "no") return "nb-NO";
  if (normalized === "da") return "da-DK";
  if (normalized === "fi") return "fi-FI";
  if (normalized === "ro") return "ro-RO";
  if (normalized === "el") return "el-GR";
  if (normalized === "he") return "he-IL";
  return "en-US";
}

function openMeteoLanguageCode(language) {
  const normalized = resolveUiLanguage(language);
  if (normalized === "zh-Hans") return "zh";
  if (normalized === "zh-Hant") return "zh";
  if (normalized === "ko") return "ko";
  if (normalized === "ja") return "ja";
  if (normalized === "th") return "th";
  if (normalized === "es") return "es";
  if (normalized === "fr") return "fr";
  if (normalized === "de") return "de";
  if (normalized === "it") return "it";
  if (normalized === "pt-BR" || normalized === "pt-PT") return "pt";
  if (normalized === "ru") return "ru";
  if (normalized === "uk") return "uk";
  if (normalized === "pl") return "pl";
  if (normalized === "nl") return "nl";
  if (normalized === "tr") return "tr";
  if (normalized === "ar") return "ar";
  if (normalized === "hi") return "hi";
  if (normalized === "id") return "id";
  if (normalized === "vi") return "vi";
  return "en";
}

function copyText(language, key, fallback = "") {
  const lang = resolveUiLanguage(language);
  return String(UI_COPY?.[lang]?.[key] || UI_COPY?.en?.[key] || fallback || key);
}

function normalizeProgramType(value, fallback = "family") {
  const type = String(value || "").trim().toLowerCase();
  if (PROGRAM_TYPE_OPTIONS.includes(type)) return type;
  return PROGRAM_TYPE_OPTIONS.includes(fallback) ? fallback : "family";
}

function normalizeProgramLevel(value, fallback = "youth") {
  const level = String(value || "").trim().toLowerCase();
  if (PROGRAM_LEVEL_OPTIONS.includes(level)) return level;
  return PROGRAM_LEVEL_OPTIONS.includes(fallback) ? fallback : "youth";
}

function looksLikeEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function buildPayPalMeCheckoutUrl(paypalMeUrl, amountUsd) {
  const normalized = normalizeExternalUrl(paypalMeUrl || "");
  if (!isOpenableExternalUrl(normalized)) return "";
  try {
    const parsed = new URL(normalized);
    const host = parsed.hostname.toLowerCase();
    if (host !== "paypal.me" && host !== "www.paypal.me") return normalized;
    const pathParts = parsed.pathname.split("/").filter(Boolean);
    if (!pathParts.length) return normalized;
    const lastSegment = String(pathParts[pathParts.length - 1] || "");
    if (/^\d+(?:\.\d{1,2})?$/.test(lastSegment)) pathParts.pop();
    const amount = Math.max(0, Number(amountUsd) || 0);
    const base = `https://paypal.me/${pathParts.join("/")}`;
    return amount > 0 ? `${base}/${amount.toFixed(2)}` : base;
  } catch {
    return normalized;
  }
}

function buildPayPalEmailCheckoutUrl(paypalEmail, amountUsd, itemName = "Pro Feedback Review") {
  const email = String(paypalEmail || "").trim();
  if (!looksLikeEmail(email)) return "";
  const amount = Math.max(0, Number(amountUsd) || 0);
  const params = new URLSearchParams({
    cmd: "_xclick",
    business: email,
    item_name: String(itemName || "Pro Feedback Review"),
    currency_code: "USD",
  });
  if (amount > 0) params.set("amount", amount.toFixed(2));
  return `https://www.paypal.com/cgi-bin/webscr?${params.toString()}`;
}

function buildProFeedbackPaymentDetails(config, amountUsd, itemName = "Pro Feedback Review") {
  const paypalMeUrl = buildPayPalMeCheckoutUrl(config?.paypalMeUrl || "", amountUsd);
  if (isOpenableExternalUrl(paypalMeUrl)) return { url: paypalMeUrl, provider: "paypal" };
  const paypalEmailUrl = buildPayPalEmailCheckoutUrl(config?.paypalEmail || "", amountUsd, itemName);
  if (isOpenableExternalUrl(paypalEmailUrl)) return { url: paypalEmailUrl, provider: "paypal" };
  const fallback = normalizeExternalUrl(config?.paymentUrl || "");
  if (isOpenableExternalUrl(fallback)) return { url: fallback, provider: /paypal/i.test(fallback) ? "paypal" : "external" };
  return { url: "", provider: "external" };
}

function musicProviderLabelFromUrl(value) {
  const url = String(value || "").toLowerCase();
  if (url.includes("music.youtube.com") || url.includes("youtube.com") || url.includes("youtu.be")) return "YouTube Music";
  if (url.includes("music.apple.com") || url.includes("itunes.apple.com")) return "Apple Music";
  return "Music link";
}

function buildMusicSearchUrl(provider, query) {
  const q = String(query || "").trim();
  if (!q) return "";
  if (provider === "youtube") return `https://music.youtube.com/search?q=${encodeURIComponent(q)}`;
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
  const legacyPlans = normalizePlansMap(src.plans, DEFAULT_PLANS);
  const skaters = toArray(src.skaters)
    .map((s) => ({
      id: String(s?.id || `s-${uid()}`),
      name: String(s?.name || "Skater"),
      photoUrl: String(s?.photoUrl || ""),
    }))
    .filter((s) => s.id);
  const membersBase = toArray(src.members)
    .map((m) => ({
      id: String(m?.id || `m-${uid()}`),
      name: String(m?.name || "Member"),
      role: normalizeMemberRole(m?.role, "dad"),
      pin: sanitizePin(m?.pin || ""),
      photoUrl: String(m?.photoUrl || ""),
      biometricCredentialId: String(m?.biometricCredentialId || ""),
    }))
    .filter((m) => m.id);
  const hasSkaterMember = membersBase.some((m) => m.role === "skater");
  const firstSkater = skaters[0] || { id: "s-1", name: "Skater" };
  const desiredSkaterMemberId = `m-skater-${firstSkater.id}`;
  const skaterMemberExistsById = membersBase.some((m) => m.id === desiredSkaterMemberId);
  let members =
    !membersBase.length || hasSkaterMember || !firstSkater?.id
      ? membersBase
      : [
          ...membersBase,
          {
            id: skaterMemberExistsById ? `m-${uid()}` : desiredSkaterMemberId,
            name: String(firstSkater?.name || "Skater"),
            role: "skater",
            pin: "",
            photoUrl: "",
            biometricCredentialId: "",
          },
        ];
  if (members.length && !members.some((m) => m.role === "proskater")) {
    const defaultProMemberId = "m-pro-1";
    members = [
      ...members,
      {
        id: members.some((m) => m.id === defaultProMemberId) ? `m-${uid()}` : defaultProMemberId,
        name: "Pro Skater",
        role: "proskater",
        pin: "",
        photoUrl: "",
        biometricCredentialId: "",
      },
    ];
  }

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
      dayType: String(s?.dayType || Object.keys(legacyPlans)[0] || "Grind Day"),
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
        trickAssist: normalizeTrickAssist(m?.trickAssist, m?.name || ""),
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
  const trainingSportBySkaterId = Object.fromEntries(
    Object.entries(toObj(src.trainingSportBySkaterId, {}))
      .map(([k, v]) => [String(k || ""), normalizeSportKey(v, "skate")])
      .filter(([k]) => k)
  );
  const primarySportBySkaterId = Object.fromEntries(
    Object.entries(toObj(src.primarySportBySkaterId, {}))
      .map(([k, v]) => [String(k || ""), normalizeSportKey(v, "skate")])
      .filter(([k]) => k)
  );
  const sportPackageBySkaterId = Object.fromEntries(
    Object.entries(toObj(src.sportPackageBySkaterId, {}))
      .map(([k, v]) => [String(k || ""), normalizeSportPackage(v, SPORT_PACKAGE_SINGLE)])
      .filter(([k]) => k)
  );
  const rawPlansBySportBySkaterId = toObj(src.plansBySportBySkaterId, {});
  const plansBySportBySkaterId = {};
  for (const skater of skaters.length ? skaters : INITIAL_STORE.skaters) {
    const skaterId = String(skater?.id || "");
    if (!skaterId) continue;
    const activeSport = normalizeSportKey(trainingSportBySkaterId[skaterId], "skate");
    const primarySport = normalizeSportKey(primarySportBySkaterId[skaterId] || activeSport, activeSport);
    const packageTier = normalizeSportPackage(sportPackageBySkaterId[skaterId], SPORT_PACKAGE_SINGLE);
    const rawBySport = toObj(rawPlansBySportBySkaterId[skaterId], {});
    const nextBySport = {};
    for (const [sportKeyRaw, planMap] of Object.entries(rawBySport)) {
      const sportKeyLegacyRaw = String(sportKeyRaw || "").trim().toLowerCase();
      const sportKey = LEGACY_SPORT_KEY_ALIASES[sportKeyLegacyRaw] || sportKeyLegacyRaw;
      if (!TRAINING_SPORT_OPTIONS.some((s) => s.key === sportKey)) continue;
      const normalizedPlanMap = normalizePlansMap(planMap, {});
      if (!nextBySport[sportKey]) {
        nextBySport[sportKey] = normalizedPlanMap;
        continue;
      }
      const mergedPlanMap = { ...nextBySport[sportKey] };
      for (const [rawDayName, tasks] of Object.entries(normalizedPlanMap)) {
        let dayName = rawDayName;
        let copyNo = 2;
        while (mergedPlanMap[dayName]) {
          dayName = `${rawDayName} (${copyNo})`;
          copyNo += 1;
        }
        mergedPlanMap[dayName] = tasks;
      }
      nextBySport[sportKey] = mergedPlanMap;
    }
    if (!Object.keys(nextBySport).length) {
      nextBySport[activeSport] = normalizePlansMap(legacyPlans, DEFAULT_PLANS);
    }
    if (!nextBySport[primarySport]) {
      nextBySport[primarySport] = normalizePlansMap(nextBySport[activeSport], DEFAULT_PLANS);
    }
    if (!nextBySport[activeSport]) {
      nextBySport[activeSport] = normalizePlansMap(nextBySport[primarySport], DEFAULT_PLANS);
    }
    trainingSportBySkaterId[skaterId] = packageTier === SPORT_PACKAGE_MULTI ? activeSport : primarySport;
    primarySportBySkaterId[skaterId] = primarySport;
    sportPackageBySkaterId[skaterId] = packageTier;
    plansBySportBySkaterId[skaterId] = nextBySport;
  }
  const skateDaysBySkaterId = Object.fromEntries(
    Object.entries(toObj(src.skateDaysBySkaterId, {}))
      .map(([skaterId, list]) => [
        String(skaterId || ""),
        toArray(list).map((d) => ({
          id: String(d?.id || `sd-${uid()}`),
          kind:
            String(d?.kind || "").trim() === SKATE_TRIP_KIND
              ? SKATE_TRIP_KIND
              : String(d?.kind || "").trim() === FREE_SKATE_KIND
              ? FREE_SKATE_KIND
              : /trip/i.test(String(d?.title || ""))
              ? SKATE_TRIP_KIND
              : FREE_SKATE_KIND,
          title: String(d?.title || "Free Skate"),
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
            trickAssist: normalizeTrickAssist(m?.trickAssist, m?.name || ""),
          })),
        })),
      ])
      .filter(([k]) => k)
  );
  const trickProfileBySkaterId = Object.fromEntries(
    Object.entries(toObj(src.trickProfileBySkaterId, {}))
      .map(([skaterId, profile]) => [String(skaterId || ""), normalizeTrickProfile(profile)])
      .filter(([k]) => k)
  );
  const academyBySkaterId = Object.fromEntries(
    Object.entries(toObj(src.academyBySkaterId, {}))
      .map(([skaterId, state]) => [String(skaterId || ""), normalizeAcademyState(state)])
      .filter(([k]) => k)
  );
  const proFeedbackSrc = { ...createDefaultProFeedback(), ...toObj(src.proFeedback, {}) };
  const proFeedbackRequestsBySkaterId = Object.fromEntries(
    Object.entries(toObj(proFeedbackSrc.requestsBySkaterId, {}))
      .map(([skaterId, list]) => [
        String(skaterId || ""),
        toArray(list).map((item) => {
          const chargeUsd = Math.max(0, Number(item?.chargeUsd) || 0);
          const ownerShareRaw = Number(item?.ownerShareUsd);
          const defaultOwnerShare = Math.max(0, Number(proFeedbackSrc.ownerShareUsd) || 0);
          const ownerShareUsd = Math.max(0, Math.min(chargeUsd, Number.isFinite(ownerShareRaw) ? ownerShareRaw : defaultOwnerShare));
          const paymentUrl = normalizeExternalUrl(item?.paymentUrl || item?.paypalPayUrl || "");
          const paymentProviderRaw = String(item?.paymentProvider || "").toLowerCase();
          const paymentProvider = paymentProviderRaw === "paypal" || /paypal/i.test(paymentUrl) ? "paypal" : "external";
          return {
            id: String(item?.id || `pfr-${uid()}`),
            skaterId: String(item?.skaterId || skaterId || ""),
            skaterName: String(item?.skaterName || ""),
            sportKey: normalizeSportKey(item?.sportKey || trainingSportBySkaterId?.[String(skaterId || "")] || "skate", "skate"),
            title: String(item?.title || "").trim(),
            question: String(item?.question || "").trim(),
            clipUrl: normalizeExternalUrl(item?.clipUrl || ""),
            preferredResponse: String(item?.preferredResponse || "").trim(),
            requestedBy: String(item?.requestedBy || ""),
            requestedByRole: String(item?.requestedByRole || ""),
            chargeUsd,
            ownerShareUsd,
            paymentStatus: String(item?.paymentStatus || "").toLowerCase() === "paid" ? "paid" : "unpaid",
            paymentProvider,
            paymentUrl,
            payoutStatus: String(item?.payoutStatus || "").toLowerCase() === "sent" ? "sent" : "pending",
            payoutSentAt: String(item?.payoutSentAt || ""),
            payoutSentById: String(item?.payoutSentById || ""),
            payoutSentByName: String(item?.payoutSentByName || ""),
            status: ["pending", "in-review", "delivered", "closed"].includes(String(item?.status || "").toLowerCase())
              ? String(item.status).toLowerCase()
              : "pending",
            proReply: String(item?.proReply || ""),
            reviewedById: String(item?.reviewedById || ""),
            reviewedByName: String(item?.reviewedByName || ""),
            reviewedAt: String(item?.reviewedAt || ""),
            createdAt: String(item?.createdAt || new Date().toISOString()),
            updatedAt: String(item?.updatedAt || item?.createdAt || new Date().toISOString()),
          };
        }),
      ])
      .filter(([k]) => k)
  );

  const merged = {
    ...INITIAL_STORE,
    ...src,
    members: members.length ? members : INITIAL_STORE.members,
    skaters: skaters.length ? skaters : INITIAL_STORE.skaters,
    plans: legacyPlans,
    sessions,
    chatBySkaterId: toObj(src.chatBySkaterId, {}),
    practiceEvents: toArray(src.practiceEvents).map((ev) => ({
      id: String(ev?.id || `pe-${uid()}`),
      dateISO: String(ev?.dateISO || todayISO()),
      time: String(ev?.time || "17:00"),
      durationMin: Math.max(5, Number(ev?.durationMin) || 60),
      remindMin: Math.max(0, Number(ev?.remindMin) || 60),
      title: String(ev?.title || INITIAL_STORE.practiceSettings.title),
      park: String(ev?.park || ""),
      notes: String(ev?.notes || ""),
      skaterId: String(ev?.skaterId || ""),
      skaterName: String(ev?.skaterName || ""),
      createdAt: String(ev?.createdAt || new Date().toISOString()),
      source: String(ev?.source || ""),
    })),
    xpBySkaterId: toObj(src.xpBySkaterId, {}),
    xpMilestonesBySkaterId: toObj(src.xpMilestonesBySkaterId, {}),
    contestBySkaterId: toObj(src.contestBySkaterId, {}),
    coachCornerBySkaterId: toObj(src.coachCornerBySkaterId, {}),
    skateDaysBySkaterId,
    trickProfileBySkaterId,
    academyBySkaterId,
    trainingSportBySkaterId,
    primarySportBySkaterId,
    sportPackageBySkaterId,
    plansBySportBySkaterId,
    parkProfiles: parkProfiles.length ? parkProfiles : INITIAL_STORE.parkProfiles,
    parkPrefsBySkaterId,
    practiceSettings: {
      ...INITIAL_STORE.practiceSettings,
      ...toObj(src.practiceSettings, {}),
      durationMin: Math.max(5, Number(src?.practiceSettings?.durationMin) || INITIAL_STORE.practiceSettings.durationMin),
      remindMin: Math.max(0, Number(src?.practiceSettings?.remindMin) || INITIAL_STORE.practiceSettings.remindMin),
      title: String(src?.practiceSettings?.title || INITIAL_STORE.practiceSettings.title),
      park: String(src?.practiceSettings?.park || INITIAL_STORE.practiceSettings.park),
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
      dayType: String(src?.draft?.dayType || Object.keys(legacyPlans)[0] || "Grind Day"),
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
      language: normalizeUiLanguagePref(src?.appPrefs?.language, INITIAL_STORE.appPrefs.language),
      backgroundByMemberId: Object.fromEntries(
        Object.entries(toObj(src?.appPrefs?.backgroundByMemberId, {}))
          .map(([memberId, pref]) => [String(memberId || ""), normalizeBackgroundPref(pref)])
          .filter(([memberId]) => memberId)
      ),
      copyOverridesByLanguage: Object.fromEntries(
        Object.entries(toObj(src?.appPrefs?.copyOverridesByLanguage, {}))
          .map(([langKey, langMap]) => [
            String(langKey || ""),
            Object.fromEntries(
              Object.entries(toObj(langMap, {}))
                .map(([copyKey, text]) => [String(copyKey || ""), String(text || "")])
                .filter(([copyKey, text]) => copyKey && text)
            ),
          ])
          .filter(([langKey]) => langKey)
      ),
    },
    programProfile: {
      ...createDefaultProgramProfile(),
      ...toObj(src.programProfile, {}),
      enabled: !!src?.programProfile?.enabled,
      programType: normalizeProgramType(src?.programProfile?.programType, createDefaultProgramProfile().programType),
      level: normalizeProgramLevel(src?.programProfile?.level, createDefaultProgramProfile().level),
      schoolName: String(src?.programProfile?.schoolName || "").trim(),
      teamName: String(src?.programProfile?.teamName || "").trim(),
      cityState: String(src?.programProfile?.cityState || "").trim(),
      season: String(src?.programProfile?.season || "").trim(),
      notes: String(src?.programProfile?.notes || ""),
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
    proFeedback: {
      ...createDefaultProFeedback(),
      ...proFeedbackSrc,
      enabled: !!proFeedbackSrc.enabled,
      priceUsd: Math.max(0, Number(proFeedbackSrc.priceUsd) || 0),
      ownerShareUsd: Math.max(
        0,
        Math.min(
          Math.max(0, Number(proFeedbackSrc.priceUsd) || 0),
          Number(proFeedbackSrc.ownerShareUsd) || createDefaultProFeedback().ownerShareUsd || 0
        )
      ),
      weeklyPayoutDay: normalizeWeekday(proFeedbackSrc.weeklyPayoutDay, createDefaultProFeedback().weeklyPayoutDay || "Friday"),
      paypalMeUrl: normalizeExternalUrl(proFeedbackSrc.paypalMeUrl || ""),
      paypalEmail: String(proFeedbackSrc.paypalEmail || "").trim(),
      paymentUrl: normalizeExternalUrl(proFeedbackSrc.paymentUrl || ""),
      instructions: String(proFeedbackSrc.instructions || createDefaultProFeedback().instructions || ""),
      requestsBySkaterId: proFeedbackRequestsBySkaterId,
    },
  };

  // Migration/seed: always provide a dedicated Kiko test skater profile and linked skater login.
  const KIKO_TEST_SKATER_NAME = "Kiko Test";
  const KIKO_TEST_SKATER_ID = "s-kiko-test";
  const KIKO_TEST_MEMBER_ID = "m-skater-kiko-test";
  const existingKikoSkater =
    toArray(merged.skaters).find((s) => String(s?.id || "") === KIKO_TEST_SKATER_ID) ||
    toArray(merged.skaters).find((s) => String(s?.name || "").trim().toLowerCase() === KIKO_TEST_SKATER_NAME.toLowerCase());
  if (!existingKikoSkater) {
    merged.skaters = [...toArray(merged.skaters), { id: KIKO_TEST_SKATER_ID, name: KIKO_TEST_SKATER_NAME, photoUrl: "" }];
  }
  const activeKikoSkater =
    toArray(merged.skaters).find((s) => String(s?.id || "") === KIKO_TEST_SKATER_ID) ||
    toArray(merged.skaters).find((s) => String(s?.name || "").trim().toLowerCase() === KIKO_TEST_SKATER_NAME.toLowerCase()) ||
    null;
  const activeKikoSkaterId = String(activeKikoSkater?.id || "");
  if (activeKikoSkaterId) {
    const hasKikoSkaterMember = toArray(merged.members).some(
      (m) =>
        String(m?.role || "") === "skater" &&
        (String(m?.id || "") === KIKO_TEST_MEMBER_ID || String(m?.name || "").trim().toLowerCase() === KIKO_TEST_SKATER_NAME.toLowerCase())
    );
    if (!hasKikoSkaterMember) {
      merged.members = [
        ...toArray(merged.members),
        {
          id: toArray(merged.members).some((m) => String(m?.id || "") === KIKO_TEST_MEMBER_ID) ? `m-${uid()}` : KIKO_TEST_MEMBER_ID,
          name: KIKO_TEST_SKATER_NAME,
          role: "skater",
          pin: "",
          photoUrl: "",
          biometricCredentialId: "",
        },
      ];
    }

    merged.trainingSportBySkaterId = {
      ...toObj(merged.trainingSportBySkaterId, {}),
      [activeKikoSkaterId]: normalizeSportKey(toObj(merged.trainingSportBySkaterId, {})[activeKikoSkaterId], "skate"),
    };
    merged.primarySportBySkaterId = {
      ...toObj(merged.primarySportBySkaterId, {}),
      [activeKikoSkaterId]: normalizeSportKey(toObj(merged.primarySportBySkaterId, {})[activeKikoSkaterId], "skate"),
    };
    merged.sportPackageBySkaterId = {
      ...toObj(merged.sportPackageBySkaterId, {}),
      [activeKikoSkaterId]: normalizeSportPackage(toObj(merged.sportPackageBySkaterId, {})[activeKikoSkaterId], SPORT_PACKAGE_SINGLE),
    };
    const nextPlansBySport = { ...toObj(merged.plansBySportBySkaterId, {}) };
    const nextKikoPlansBySport = { ...toObj(nextPlansBySport[activeKikoSkaterId], {}) };
    const existingKikoSkatePlans = normalizePlansMap(toObj(nextKikoPlansBySport.skate, {}), {});
    const kikoTemplatePlans = normalizePlansMap(KIKO_TEST_PLAN_TEMPLATE, KIKO_TEST_PLAN_TEMPLATE);
    const mergedKikoSkatePlans = { ...existingKikoSkatePlans };
    for (const [dayName, tasks] of Object.entries(kikoTemplatePlans)) {
      if (!mergedKikoSkatePlans[dayName]) mergedKikoSkatePlans[dayName] = tasks;
    }
    if (!Object.keys(mergedKikoSkatePlans).length) {
      nextKikoPlansBySport.skate = normalizePlansMap(KIKO_TEST_PLAN_TEMPLATE, KIKO_TEST_PLAN_TEMPLATE);
    } else {
      nextKikoPlansBySport.skate = mergedKikoSkatePlans;
    }
    nextPlansBySport[activeKikoSkaterId] = nextKikoPlansBySport;
    merged.plansBySportBySkaterId = nextPlansBySport;

    merged.academyBySkaterId = {
      ...toObj(merged.academyBySkaterId, {}),
      [activeKikoSkaterId]: normalizeAcademyState(toObj(merged.academyBySkaterId, {})[activeKikoSkaterId]),
    };
    merged.trickProfileBySkaterId = {
      ...toObj(merged.trickProfileBySkaterId, {}),
      [activeKikoSkaterId]: normalizeTrickProfile(toObj(merged.trickProfileBySkaterId, {})[activeKikoSkaterId]),
    };
    merged.contestBySkaterId = {
      ...toObj(merged.contestBySkaterId, {}),
      [activeKikoSkaterId]: toObj(toObj(merged.contestBySkaterId, {})[activeKikoSkaterId], {}),
    };
    merged.coachCornerBySkaterId = {
      ...toObj(merged.coachCornerBySkaterId, {}),
      [activeKikoSkaterId]: toArray(toObj(merged.coachCornerBySkaterId, {})[activeKikoSkaterId]),
    };
    merged.skateDaysBySkaterId = {
      ...toObj(merged.skateDaysBySkaterId, {}),
      [activeKikoSkaterId]: toArray(toObj(merged.skateDaysBySkaterId, {})[activeKikoSkaterId]),
    };
    merged.chatBySkaterId = {
      ...toObj(merged.chatBySkaterId, {}),
      [activeKikoSkaterId]: toArray(toObj(merged.chatBySkaterId, {})[activeKikoSkaterId]),
    };
    merged.xpBySkaterId = {
      ...toObj(merged.xpBySkaterId, {}),
      [activeKikoSkaterId]: Math.max(0, Number(toObj(merged.xpBySkaterId, {})[activeKikoSkaterId]) || 0),
    };
    merged.xpMilestonesBySkaterId = {
      ...toObj(merged.xpMilestonesBySkaterId, {}),
      [activeKikoSkaterId]: Math.max(0, Number(toObj(merged.xpMilestonesBySkaterId, {})[activeKikoSkaterId]) || 0),
    };
  }

  const mergedActiveSkaterId = String(merged?.ui?.activeSkaterId || merged?.skaters?.[0]?.id || "");
  const mergedPrimarySport = normalizeSportKey(
    merged?.primarySportBySkaterId?.[mergedActiveSkaterId] || merged?.trainingSportBySkaterId?.[mergedActiveSkaterId] || "skate",
    "skate"
  );
  const mergedPackage = normalizeSportPackage(merged?.sportPackageBySkaterId?.[mergedActiveSkaterId], SPORT_PACKAGE_SINGLE);
  const mergedSportKey =
    mergedPackage === SPORT_PACKAGE_MULTI
      ? normalizeSportKey(merged?.trainingSportBySkaterId?.[mergedActiveSkaterId] || mergedPrimarySport, mergedPrimarySport)
      : mergedPrimarySport;
  const mergedPlansBySport = toObj(merged?.plansBySportBySkaterId?.[mergedActiveSkaterId], {});
  const mergedActivePlans = Object.keys(toObj(mergedPlansBySport[mergedSportKey], {})).length
    ? toObj(mergedPlansBySport[mergedSportKey], {})
    : legacyPlans;
  merged.plans = mergedActivePlans;
  merged.draft = {
    ...merged.draft,
    dayType: resolveDraftDayTypeForPlans(mergedActivePlans, merged?.draft?.dayType),
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

function formatShortDate(iso, locale = undefined) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(locale, { month: "short", day: "numeric" });
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

function formatStandardTime(timeHHMM = "00:00", locale = undefined) {
  const safeTime = isValidTimeHHMM(timeHHMM) ? String(timeHHMM) : "00:00";
  const [hh, mm] = safeTime.split(":").map((v) => Number(v) || 0);
  const dt = new Date();
  dt.setHours(hh, mm, 0, 0);
  return dt.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" });
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

function formatMonthLabel(monthKey, locale = undefined) {
  const [y, m] = String(monthKey || "").split("-").map(Number);
  const dt = new Date(Number(y) || new Date().getFullYear(), Math.max(0, (Number(m) || 1) - 1), 1);
  return dt.toLocaleDateString(locale, { month: "long", year: "numeric" });
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

function normalizeParkLookupResults(rawResults) {
  const rows = toArray(rawResults)
    .map((r) => ({
      name: String(r?.name || "").trim(),
      admin1: String(r?.admin1 || "").trim(),
      country: String(r?.country || "").trim(),
      lat: Number(r?.latitude),
      lon: Number(r?.longitude),
      source: "open-meteo",
      sourceUrl: "",
    }))
    .filter((r) => r.name && Number.isFinite(r.lat) && Number.isFinite(r.lon));
  const seen = new Set();
  return rows.filter((r) => {
    const location = [r.admin1, r.country].filter(Boolean).join(", ");
    const key = parkIdentityKey(r.name, location);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeGoSkateLookupResults(rawResults) {
  const rows = toArray(rawResults)
    .map((r) => {
      const name = String(r?.title?.rendered || "").replace(/<[^>]+>/g, "").trim();
      const address = String(r?.property_meta?.REAL_HOMES_property_address || "").trim();
      const lat = Number(r?.property_meta?.REAL_HOMES_property_location?.latitude);
      const lon = Number(r?.property_meta?.REAL_HOMES_property_location?.longitude);
      return {
        name,
        admin1: address,
        country: "",
        lat,
        lon,
        source: "goskate",
        sourceUrl: String(r?.link || ""),
      };
    })
    .filter((r) => r.name && Number.isFinite(r.lat) && Number.isFinite(r.lon));
  const seen = new Set();
  return rows.filter((r) => {
    const location = [r.admin1, r.country].filter(Boolean).join(", ");
    const key = parkIdentityKey(r.name, location);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function mergeParkLookupResults(...groups) {
  const out = [];
  const seen = new Set();
  for (const group of groups) {
    for (const item of toArray(group)) {
      const name = String(item?.name || "").trim();
      if (!name) continue;
      const admin1 = String(item?.admin1 || "").trim();
      const country = String(item?.country || "").trim();
      const location = [admin1, country].filter(Boolean).join(", ");
      const key = parkIdentityKey(name, location);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        ...item,
        name,
        admin1,
        country,
      });
    }
  }
  return out;
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

function normalizeOverlayStrokes(input) {
  return toArray(input)
    .map((s) => ({
      color: String(s?.color || "#f43f5e"),
      width: Math.max(1, Number(s?.width) || 4),
      points: toArray(s?.points)
        .map((p) => ({
          x: Math.max(0, Math.min(1, Number(p?.x) || 0)),
          y: Math.max(0, Math.min(1, Number(p?.y) || 0)),
        }))
        .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y)),
    }))
    .filter((s) => s.points.length >= 2);
}

function drawOverlayStrokes(ctx, strokes, width, height) {
  if (!ctx || !strokes?.length) return;
  const scale = Math.max(width, height) / 800;
  for (const stroke of strokes) {
    const points = stroke.points || [];
    if (points.length < 2) continue;
    const color = /^#[0-9a-f]{3,8}$/i.test(String(stroke.color || "")) ? String(stroke.color) : "#f43f5e";
    ctx.save();
    ctx.beginPath();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1, Number(stroke.width) * Math.max(0.7, scale));
    ctx.moveTo(points[0].x * width, points[0].y * height);
    for (let i = 1; i < points.length; i += 1) {
      ctx.lineTo(points[i].x * width, points[i].y * height);
    }
    ctx.stroke();
    ctx.restore();
  }
}

const STICK_FIGURE_PRESET_PATCHES = {
  neutral: { turn: 0, bend: 0.36, scale: 1, y: 0.6 },
  bowl_vert: { turn: 0.22, bend: 0.62, scale: 1.04, y: 0.62 },
  deep_turn: { turn: 0.42, bend: 0.78, scale: 1.06, y: 0.64 },
  fs_big_air_grab: { turn: 0.56, bend: 0.76, scale: 1.08, y: 0.63 },
  bs_big_air_grab: { turn: -0.56, bend: 0.76, scale: 1.08, y: 0.63 },
  fakie_smith: { turn: -0.24, bend: 0.68, scale: 1.03, y: 0.64 },
  fs_invert: { turn: 0.4, bend: 0.74, scale: 1.07, y: 0.64 },
  bs_invert: { turn: -0.4, bend: 0.74, scale: 1.07, y: 0.64 },
  lien_air: { turn: -0.3, bend: 0.72, scale: 1.06, y: 0.64 },
  crail_air: { turn: 0.32, bend: 0.72, scale: 1.06, y: 0.64 },
  slash_grind: { turn: 0.28, bend: 0.58, scale: 1.02, y: 0.62 },
  rock_n_roll: { turn: 0.16, bend: 0.6, scale: 1.02, y: 0.62 },
  tony_900: { turn: 0.1, bend: 0.83, scale: 1.1, y: 0.66 },
  tony_mctwist: { turn: -0.62, bend: 0.82, scale: 1.1, y: 0.65 },
  tony_madonna: { turn: 0.46, bend: 0.78, scale: 1.12, y: 0.66 },
  tony_stalefish_540: { turn: -0.38, bend: 0.8, scale: 1.09, y: 0.65 },
  tony_varial_540: { turn: 0.48, bend: 0.82, scale: 1.1, y: 0.66 },
  tony_backside_air: { turn: -0.28, bend: 0.74, scale: 1.06, y: 0.64 },
  tony_frontside_air: { turn: 0.28, bend: 0.74, scale: 1.06, y: 0.64 },
  cab_caballerial: { turn: -0.34, bend: 0.7, scale: 1.05, y: 0.63 },
  cab_half_cab: { turn: -0.2, bend: 0.62, scale: 1.02, y: 0.62 },
  cab_frontside_boardslide: { turn: 0.3, bend: 0.64, scale: 1.02, y: 0.62 },
  cab_backside_boneless: { turn: -0.36, bend: 0.7, scale: 1.06, y: 0.64 },
  cab_switch_invert: { turn: 0.42, bend: 0.78, scale: 1.08, y: 0.65 },
  burnquist_fakie_900: { turn: -0.68, bend: 0.82, scale: 1.12, y: 0.67 },
  burnquist_wee_willy_grind: { turn: 0.28, bend: 0.6, scale: 1.01, y: 0.62 },
  burnquist_fakie_5_0_kickflip_out: { turn: -0.26, bend: 0.68, scale: 1.04, y: 0.64 },
  burnquist_switch_stance_flow: { turn: -0.2, bend: 0.62, scale: 1.03, y: 0.63 },
  burnquist_mega_launch: { turn: 0.18, bend: 0.84, scale: 1.14, y: 0.67 },
  clairmont_big_air: { turn: 0.58, bend: 0.84, scale: 1.13, y: 0.67 },
  jackalope_big_air: { turn: 0.52, bend: 0.86, scale: 1.14, y: 0.67 },
  greyson_frontside_air: { turn: 0.5, bend: 0.76, scale: 1.09, y: 0.65 },
  greyson_layback_carve: { turn: 0.44, bend: 0.72, scale: 1.06, y: 0.64 },
  greyson_invert: { turn: 0.36, bend: 0.78, scale: 1.08, y: 0.65 },
  greyson_lien_air: { turn: -0.26, bend: 0.72, scale: 1.06, y: 0.64 },
  greyson_stalefish: { turn: -0.32, bend: 0.74, scale: 1.07, y: 0.64 },
  kiko_bowl_flow: { turn: 0.24, bend: 0.66, scale: 1.05, y: 0.63 },
  kiko_rock_roll: { turn: 0.16, bend: 0.6, scale: 1.02, y: 0.62 },
  kiko_backside_air: { turn: -0.24, bend: 0.72, scale: 1.06, y: 0.64 },
  kiko_frontside_grind: { turn: 0.22, bend: 0.58, scale: 1.02, y: 0.62 },
  kiko_slash_grind: { turn: 0.3, bend: 0.56, scale: 1.02, y: 0.62 },
  kiko_fakie_rock: { turn: -0.18, bend: 0.62, scale: 1.02, y: 0.62 },
};

const STICK_FIGURE_PRESET_OPTIONS = [
  { key: "neutral", label: "Neutral", group: "Core" },
  { key: "bowl_vert", label: "Bowl/Vert", group: "Core" },
  { key: "deep_turn", label: "Deep Turn", group: "Core" },
  { key: "fs_big_air_grab", label: "FS Big Air Grab", group: "Core" },
  { key: "bs_big_air_grab", label: "BS Big Air Grab", group: "Core" },
  { key: "fakie_smith", label: "Fakie Smith", group: "Core" },
  { key: "fs_invert", label: "FS Invert", group: "Core" },
  { key: "bs_invert", label: "BS Invert", group: "Core" },
  { key: "lien_air", label: "Lien Air", group: "Core" },
  { key: "crail_air", label: "Crail Air", group: "Core" },
  { key: "slash_grind", label: "Slash Grind", group: "Core" },
  { key: "rock_n_roll", label: "Rock N Roll", group: "Core" },
  { key: "tony_900", label: "Tony Hawk 900", group: "Tony Hawk" },
  { key: "tony_mctwist", label: "Tony Hawk McTwist", group: "Tony Hawk" },
  { key: "tony_madonna", label: "Tony Hawk Madonna", group: "Tony Hawk" },
  { key: "tony_stalefish_540", label: "Tony Hawk Stalefish 540", group: "Tony Hawk" },
  { key: "tony_varial_540", label: "Tony Hawk Varial 540", group: "Tony Hawk" },
  { key: "tony_backside_air", label: "Tony Hawk Backside Air", group: "Tony Hawk" },
  { key: "tony_frontside_air", label: "Tony Hawk Frontside Air", group: "Tony Hawk" },
  { key: "cab_caballerial", label: "Steve Cab Caballerial", group: "Steve Caballero" },
  { key: "cab_half_cab", label: "Steve Cab Half Cab", group: "Steve Caballero" },
  { key: "cab_frontside_boardslide", label: "Steve Cab FS Boardslide", group: "Steve Caballero" },
  { key: "cab_backside_boneless", label: "Steve Cab BS Boneless", group: "Steve Caballero" },
  { key: "cab_switch_invert", label: "Steve Cab Switch Invert", group: "Steve Caballero" },
  { key: "burnquist_fakie_900", label: "Bob Burnquist Fakie 900", group: "Bob Burnquist" },
  { key: "burnquist_wee_willy_grind", label: "Bob Burnquist Wee Willy", group: "Bob Burnquist" },
  { key: "burnquist_fakie_5_0_kickflip_out", label: "Bob Burnquist Fakie 5-0 Kickflip Out", group: "Bob Burnquist" },
  { key: "burnquist_switch_stance_flow", label: "Bob Burnquist Switch Stance", group: "Bob Burnquist" },
  { key: "burnquist_mega_launch", label: "Bob Burnquist Mega Launch", group: "Bob Burnquist" },
  { key: "clairmont_big_air", label: "Clairmont Big Air (San Diego)", group: "San Diego Parks" },
  { key: "jackalope_big_air", label: "Jackalope Big Air", group: "Events" },
  { key: "greyson_frontside_air", label: "Greyson Fletcher FS Air", group: "Greyson Fletcher" },
  { key: "greyson_layback_carve", label: "Greyson Fletcher Layback", group: "Greyson Fletcher" },
  { key: "greyson_invert", label: "Greyson Fletcher Invert", group: "Greyson Fletcher" },
  { key: "greyson_lien_air", label: "Greyson Fletcher Lien Air", group: "Greyson Fletcher" },
  { key: "greyson_stalefish", label: "Greyson Fletcher Stalefish", group: "Greyson Fletcher" },
  { key: "kiko_bowl_flow", label: "Kiko Francisco Bowl Flow", group: "Kiko Francisco" },
  { key: "kiko_rock_roll", label: "Kiko Francisco Rock & Roll", group: "Kiko Francisco" },
  { key: "kiko_backside_air", label: "Kiko Francisco Backside Air", group: "Kiko Francisco" },
  { key: "kiko_frontside_grind", label: "Kiko Francisco Frontside Grind", group: "Kiko Francisco" },
  { key: "kiko_slash_grind", label: "Kiko Francisco Slash Grind", group: "Kiko Francisco" },
  { key: "kiko_fakie_rock", label: "Kiko Francisco Fakie Rock", group: "Kiko Francisco" },
];
const STICK_FIGURE_PRESET_LABELS = Object.fromEntries(STICK_FIGURE_PRESET_OPTIONS.map((p) => [p.key, p.label]));
const STICK_FIGURE_QUICK_PRESET_KEYS = [
  "bowl_vert",
  "fs_big_air_grab",
  "bs_big_air_grab",
  "fakie_smith",
  "tony_900",
  "cab_caballerial",
  "burnquist_fakie_900",
  "clairmont_big_air",
  "jackalope_big_air",
  "greyson_frontside_air",
  "kiko_bowl_flow",
];

function getStickFigurePresetPatch(presetKey) {
  return toObj(STICK_FIGURE_PRESET_PATCHES[String(presetKey || "").trim().toLowerCase()], {});
}

function normalizeStickFigureGuide(value, fallback = {}) {
  const src = { ...toObj(fallback, {}), ...toObj(value, {}) };
  const colorRaw = String(src.color || "#22d3ee").trim();
  const color = /^#[0-9a-f]{3,8}$/i.test(colorRaw) ? colorRaw : "#22d3ee";
  const turnRaw = Number(src.turn);
  const bendRaw = Number(src.bend);
  return {
    enabled: !!src.enabled,
    x: Math.max(0.08, Math.min(0.92, Number(src.x) || 0.5)),
    y: Math.max(0.18, Math.min(0.92, Number(src.y) || 0.62)),
    scale: Math.max(0.65, Math.min(1.55, Number(src.scale) || 1)),
    opacity: Math.max(0.2, Math.min(1, Number(src.opacity) || 0.84)),
    turn: Math.max(-1, Math.min(1, Number.isFinite(turnRaw) ? turnRaw : 0.22)),
    bend: Math.max(0, Math.min(1, Number.isFinite(bendRaw) ? bendRaw : 0.62)),
    color,
    lineWidth: Math.max(1, Math.min(10, Number(src.lineWidth) || 3)),
  };
}

function createDefaultStickFigureGuide(overrides = {}) {
  return normalizeStickFigureGuide(
    {
      enabled: false,
      x: 0.5,
      y: 0.62,
      scale: 1.04,
      opacity: 0.84,
      turn: 0.22,
      bend: 0.62,
      color: "#22d3ee",
      lineWidth: 3,
      ...toObj(overrides, {}),
    },
    { color: "#22d3ee" }
  );
}

function buildStickFigureGeometry(guide, width, height) {
  const safe = normalizeStickFigureGuide(guide);
  const w = Math.max(1, Number(width) || 1);
  const h = Math.max(1, Number(height) || 1);
  const base = Math.min(w, h);
  const bodyH = Math.max(base * 0.2, Math.min(base * 0.85, base * 0.56 * safe.scale));
  const cx = safe.x * w;
  const pelvisY = safe.y * h;
  const turn = safe.turn;
  const turnMag = Math.abs(turn);
  const turnSign = turn === 0 ? 0 : turn > 0 ? 1 : -1;
  const bend = safe.bend;
  const shoulderWidth = bodyH * (0.32 - bend * 0.05);
  const hipWidth = bodyH * (0.22 - bend * 0.03);
  const torsoLeanX = bodyH * (0.04 + bend * 0.14) * turn;
  const torsoDrop = bodyH * (0.05 + bend * 0.1);
  const torsoBackY = pelvisY - (bodyH * 0.36 - torsoDrop * 0.4);
  const headR = bodyH * 0.095;
  const neck = { x: cx + torsoLeanX, y: torsoBackY + bodyH * 0.07 };
  const headC = { x: neck.x + turn * bodyH * 0.02, y: neck.y - bodyH * 0.15 };
  const shoulderL = {
    x: neck.x - shoulderWidth * 0.5 + turn * bodyH * 0.03,
    y: neck.y + bodyH * (0.035 + turn * 0.03),
  };
  const shoulderR = {
    x: neck.x + shoulderWidth * 0.5 + turn * bodyH * 0.03,
    y: neck.y + bodyH * (0.035 - turn * 0.03),
  };
  const hipL = { x: cx - hipWidth * 0.5, y: pelvisY + bodyH * (0.01 + turn * 0.015) };
  const hipR = { x: cx + hipWidth * 0.5, y: pelvisY + bodyH * (0.01 - turn * 0.015) };

  const buildArm = (sideSign, shoulder) => {
    const frontFactor = turnSign * sideSign;
    const elbow = {
      x: shoulder.x + sideSign * bodyH * (0.13 - bend * 0.015) + frontFactor * bodyH * 0.05,
      y: shoulder.y + bodyH * (0.155 + bend * 0.11 - frontFactor * 0.045),
    };
    const wrist = {
      x: elbow.x + sideSign * bodyH * (0.11 + turnMag * 0.03) + frontFactor * bodyH * 0.04,
      y: elbow.y + bodyH * (0.145 + bend * 0.09 - frontFactor * 0.05),
    };
    return { elbow, wrist };
  };
  const leftArm = buildArm(-1, shoulderL);
  const rightArm = buildArm(1, shoulderR);
  const elbowL = leftArm.elbow;
  const elbowR = rightArm.elbow;
  const wristL = leftArm.wrist;
  const wristR = rightArm.wrist;

  const buildLeg = (sideSign, hip) => {
    const knee = {
      x: hip.x + sideSign * bodyH * (0.058 + bend * 0.028) + turn * bodyH * 0.11,
      y: hip.y + bodyH * (0.19 + bend * 0.18),
    };
    const ankle = {
      x: knee.x + sideSign * bodyH * (0.03 + turnMag * 0.06) + turn * bodyH * 0.06,
      y: knee.y + bodyH * (0.16 + bend * 0.12),
    };
    const foot = {
      x: ankle.x + sideSign * bodyH * 0.085,
      y: ankle.y + bodyH * 0.028,
    };
    return { knee, ankle, foot };
  };
  const leftLeg = buildLeg(-1, hipL);
  const rightLeg = buildLeg(1, hipR);
  const kneeL = leftLeg.knee;
  const kneeR = rightLeg.knee;
  const ankleL = leftLeg.ankle;
  const ankleR = rightLeg.ankle;
  const footL = leftLeg.foot;
  const footR = rightLeg.foot;
  return {
    safe,
    headR,
    points: {
      headC,
      neck,
      shoulderL,
      shoulderR,
      elbowL,
      elbowR,
      wristL,
      wristR,
      hipL,
      hipR,
      kneeL,
      kneeR,
      ankleL,
      ankleR,
      footL,
      footR,
    },
  };
}

function stickFigureSegments(points) {
  return [
    [points.neck, points.shoulderL],
    [points.neck, points.shoulderR],
    [points.shoulderL, points.elbowL],
    [points.elbowL, points.wristL],
    [points.shoulderR, points.elbowR],
    [points.elbowR, points.wristR],
    [points.neck, points.hipL],
    [points.neck, points.hipR],
    [points.hipL, points.kneeL],
    [points.kneeL, points.ankleL],
    [points.ankleL, points.footL],
    [points.hipR, points.kneeR],
    [points.kneeR, points.ankleR],
    [points.ankleR, points.footR],
  ];
}

function stickFigureGuideLines(points) {
  return [
    [points.shoulderL, points.shoulderR],
    [points.hipL, points.hipR],
    [points.footL, points.footR],
  ];
}

function drawStickFigureGuide(ctx, guide, width, height) {
  if (!ctx || !guide?.enabled) return;
  const { safe, headR, points } = buildStickFigureGeometry(guide, width, height);
  const scale = Math.max(width, height) / 800;
  const segments = stickFigureSegments(points);
  const guideLines = stickFigureGuideLines(points);

  ctx.save();
  ctx.globalAlpha = safe.opacity;
  ctx.strokeStyle = safe.color;
  ctx.fillStyle = safe.color;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(1.2, safe.lineWidth * Math.max(0.7, scale));

  ctx.beginPath();
  ctx.arc(points.headC.x, points.headC.y, headR, 0, Math.PI * 2);
  ctx.stroke();

  ctx.save();
  ctx.globalAlpha = safe.opacity * 0.5;
  ctx.setLineDash([Math.max(2, ctx.lineWidth * 1.3), Math.max(2, ctx.lineWidth * 1.1)]);
  for (const [a, b] of guideLines) {
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  ctx.restore();

  for (const [a, b] of segments) {
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  const jointRadius = Math.max(1.5, ctx.lineWidth * 0.5);
  const joints = [
    points.neck,
    points.shoulderL,
    points.shoulderR,
    points.elbowL,
    points.elbowR,
    points.wristL,
    points.wristR,
    points.hipL,
    points.hipR,
    points.kneeL,
    points.kneeR,
    points.ankleL,
    points.ankleR,
    points.footL,
    points.footR,
  ];
  for (const joint of joints) {
    ctx.beginPath();
    ctx.arc(joint.x, joint.y, jointRadius, 0, Math.PI * 2);
    ctx.fill();
  }
  const handRadius = Math.max(2, jointRadius * 1.45);
  for (const hand of [points.wristL, points.wristR]) {
    ctx.beginPath();
    ctx.arc(hand.x, hand.y, handRadius, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

function StickFigureOverlay({ guide }) {
  if (!guide?.enabled) return null;
  const { safe, headR, points } = buildStickFigureGeometry(guide, 100, 100);
  const segments = stickFigureSegments(points);
  const guideLines = stickFigureGuideLines(points);
  const strokeWidth = Math.max(0.8, safe.lineWidth * 0.24);
  const jointRadius = Math.max(0.35, strokeWidth * 0.45);
  const handRadius = Math.max(0.5, jointRadius * 1.45);

  return (
    <svg className="absolute inset-0 h-full w-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
      <g stroke={safe.color} fill={safe.color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" opacity={safe.opacity}>
        <circle cx={points.headC.x} cy={points.headC.y} r={headR} fill="none" />
        <g opacity="0.5" strokeDasharray="1.8 1.6">
          {guideLines.map(([a, b], idx) => (
            <line key={`gl-${idx}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
          ))}
        </g>
        {segments.map(([a, b], idx) => (
          <line key={`sg-${idx}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
        ))}
        {[
          points.neck,
          points.shoulderL,
          points.shoulderR,
          points.elbowL,
          points.elbowR,
          points.wristL,
          points.wristR,
          points.hipL,
          points.hipR,
          points.kneeL,
          points.kneeR,
          points.ankleL,
          points.ankleR,
          points.footL,
          points.footR,
        ].map((p, idx) => (
          <circle key={`jt-${idx}`} cx={p.x} cy={p.y} r={jointRadius} />
        ))}
        {[points.wristL, points.wristR].map((p, idx) => (
          <circle key={`hd-${idx}`} cx={p.x} cy={p.y} r={handRadius} fill="none" />
        ))}
      </g>
    </svg>
  );
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
  const overlayStrokes = normalizeOverlayStrokes(opts.overlayStrokes);
  const overlayStickFigure = normalizeStickFigureGuide(opts.overlayStickFigure, createDefaultStickFigureGuide());

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
      drawOverlayStrokes(ctx, overlayStrokes, outW, outH);
      drawStickFigureGuide(ctx, overlayStickFigure, outW, outH);
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
  downloadTextFile(`${APP_FILE_PREFIX}-sessions-${todayISO()}.csv`, csv, "text/csv");
}

function exportICSPractice(dateISO, title, notes, opts = {}) {
  const { time = "17:00", durationMin = 60, remindMin = 60, location = "" } = opts;

  const pad = (n) => String(n).padStart(2, "0");
  const formatLocal = (d) =>
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;

  const safeDate = /^\d{4}-\d{2}-\d{2}$/.test(String(dateISO || "")) ? String(dateISO) : todayISO();
  const safeTime = /^\d{2}:\d{2}$/.test(String(time || "")) ? String(time) : "17:00";
  const [hh, mm] = safeTime.split(":").map((x) => parseInt(x, 10));

  const startLocal = new Date(`${safeDate}T${pad(hh || 0)}:${pad(mm || 0)}:00`);
  const endLocal = new Date(startLocal.getTime() + Math.max(5, Number(durationMin) || 60) * 60 * 1000);

  const safeNotes = String(notes || "").replace(/\r?\n/g, " ");
  const safeTitle = String(title || APP_PRACTICE_TITLE).replace(/\r?\n/g, " ");
  const safeLocation = String(location || "").replace(/\r?\n/g, " ");
  const alarm = Math.max(0, Number(remindMin) || 0);
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${APP_NAME}//EN`,
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid()}@${APP_FILE_PREFIX}`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
    `DTSTART:${formatLocal(startLocal)}`,
    `DTEND:${formatLocal(endLocal)}`,
    `SUMMARY:${safeTitle}`,
    `DESCRIPTION:${safeNotes}`,
    ...(safeLocation ? [`LOCATION:${safeLocation}`] : []),
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

  return downloadTextFile(`${APP_FILE_PREFIX}-practice-${safeDate}.ics`, ics, "text/calendar");
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
    const summary = get("SUMMARY") || fallback.title || APP_PRACTICE_TITLE;
    const desc = get("DESCRIPTION") || "";
    const location = get("LOCATION") || fallback.park || "";

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
      park: location,
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

function TabButton({ active, icon: Icon, label, onClick, lightMode = false, tabKey = "log", skaterMode = false }) {
  const toneByTab = {
    log: { light: "bg-cyan-100 text-cyan-900 ring-cyan-300", dark: "bg-cyan-500/20 text-cyan-100 ring-cyan-400/40" },
    cards: { light: "bg-fuchsia-100 text-fuchsia-900 ring-fuchsia-300", dark: "bg-fuchsia-500/20 text-fuchsia-100 ring-fuchsia-400/40" },
    calendar: { light: "bg-emerald-100 text-emerald-900 ring-emerald-300", dark: "bg-emerald-500/20 text-emerald-100 ring-emerald-400/40" },
    dash: { light: "bg-amber-100 text-amber-900 ring-amber-300", dark: "bg-amber-500/20 text-amber-100 ring-amber-400/40" },
    plans: { light: "bg-indigo-100 text-indigo-900 ring-indigo-300", dark: "bg-indigo-500/20 text-indigo-100 ring-indigo-400/40" },
    profeedback: { light: "bg-yellow-100 text-yellow-900 ring-yellow-300", dark: "bg-yellow-500/20 text-yellow-100 ring-yellow-400/40" },
    coach: { light: "bg-rose-100 text-rose-900 ring-rose-300", dark: "bg-rose-500/20 text-rose-100 ring-rose-400/40" },
    skateday: { light: "bg-teal-100 text-teal-900 ring-teal-300", dark: "bg-teal-500/20 text-teal-100 ring-teal-400/40" },
    contest: { light: "bg-orange-100 text-orange-900 ring-orange-300", dark: "bg-orange-500/20 text-orange-100 ring-orange-400/40" },
    academy: { light: "bg-lime-100 text-lime-900 ring-lime-300", dark: "bg-lime-500/20 text-lime-100 ring-lime-400/40" },
    team: { light: "bg-blue-100 text-blue-900 ring-blue-300", dark: "bg-blue-500/20 text-blue-100 ring-blue-400/40" },
    chat: { light: "bg-violet-100 text-violet-900 ring-violet-300", dark: "bg-violet-500/20 text-violet-100 ring-violet-400/40" },
    settings: { light: "bg-slate-200 text-slate-900 ring-slate-400", dark: "bg-slate-300/20 text-slate-100 ring-slate-200/35" },
  };
  const tone = toneByTab[tabKey] || toneByTab.log;
  const activeTone = lightMode ? tone.light : tone.dark;
  const skaterActiveTone = lightMode
    ? "bg-gradient-to-r from-cyan-100 via-teal-100 to-sky-100 text-cyan-900 ring-cyan-300"
    : "bg-gradient-to-r from-cyan-500/25 via-teal-500/20 to-blue-500/25 text-cyan-100 ring-cyan-400/40";
  const skaterInactiveTone = lightMode
    ? "bg-white/90 text-slate-700 ring-cyan-200 hover:bg-cyan-50"
    : "bg-slate-900/75 text-slate-100 ring-cyan-500/25 hover:bg-cyan-500/10";
  const inactiveTone = lightMode ? "bg-white text-slate-700 ring-slate-300 hover:bg-slate-100" : "bg-white/5 text-white ring-white/10 hover:bg-white/10";
  const className = `flex-1 rounded-xl sm:rounded-2xl px-2 sm:px-3 py-2 sm:py-2.5 text-[11px] sm:text-sm font-semibold inline-flex items-center justify-center gap-1 sm:gap-2 ring-1 transition shadow-sm ${
    skaterMode ? (active ? skaterActiveTone : skaterInactiveTone) : active ? activeTone : inactiveTone
  }`;
  return (
    <button type="button" onClick={onClick} className={className}>
      <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      <span className={skaterMode ? "hidden" : "hidden sm:inline"}>{label}</span>
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
  const trainingSportBySkaterId = store.trainingSportBySkaterId || {};
  const primarySportBySkaterId = store.primarySportBySkaterId || {};
  const sportPackageBySkaterId = store.sportPackageBySkaterId || {};
  const plansBySportBySkaterId = store.plansBySportBySkaterId || {};
  const sessions = store.sessions || [];
  const chatBySkaterId = store.chatBySkaterId || {};
  const practiceEvents = store.practiceEvents || [];
  const practiceSettings = store.practiceSettings || { durationMin: 60, remindMin: 60, title: APP_PRACTICE_TITLE, park: "" };
  const reminders = store.reminders || { enabled: false, time: "17:00" };
  const auth = store.auth || { loggedInMemberId: null };
  const ui = store.ui || { view: "log", activeMemberId: members[0]?.id, activeSkaterId: skaters[0]?.id };
  const activeMemberForGate = members.find((m) => m.id === ui.activeMemberId) || members[0];
  const activeMemberRoleForGate = String(activeMemberForGate?.role || "");
  const activeSkaterId = String(ui.activeSkaterId || skaters[0]?.id || "");
  const primarySportKey = normalizeSportKey(primarySportBySkaterId?.[activeSkaterId] || trainingSportBySkaterId?.[activeSkaterId] || "skate", "skate");
  const activeSportPackage = normalizeSportPackage(sportPackageBySkaterId?.[activeSkaterId], SPORT_PACKAGE_SINGLE);
  const requestedSportKey = normalizeSportKey(trainingSportBySkaterId?.[activeSkaterId] || primarySportKey, primarySportKey);
  const activeSportKey = activeSportPackage === SPORT_PACKAGE_MULTI ? requestedSportKey : primarySportKey;
  const participantLabel = participantLabelForSport(activeSportKey);
  const participantLabelLower = participantLabel.toLowerCase();
  const participantPluralLabel = participantLabelForSport(activeSportKey, { plural: true });
  const participantPluralLabelLower = participantPluralLabel.toLowerCase();
  const skaterRoleHint = participantLabel === "Skater" ? "" : " (use skater for athlete)";
  const plansFromSportMap = toObj(toObj(plansBySportBySkaterId?.[activeSkaterId], {})[activeSportKey], {});
  const plans = Object.keys(plansFromSportMap).length ? plansFromSportMap : toObj(store.plans, DEFAULT_PLANS);
  const draft = store.draft || { date: todayISO(), park: "", dayType: Object.keys(plans)[0], completedByTaskId: {}, missedByTaskId: {} };
  const xpBySkaterId = store.xpBySkaterId || {};
  const xpMilestonesBySkaterId = store.xpMilestonesBySkaterId || {};
  const contestBySkaterId = store.contestBySkaterId || {};
  const coachCornerBySkaterId = store.coachCornerBySkaterId || {};
  const skateDaysBySkaterId = store.skateDaysBySkaterId || {};
  const trickProfileBySkaterId = store.trickProfileBySkaterId || {};
  const academyBySkaterId = store.academyBySkaterId || {};
  const parkProfiles = store.parkProfiles || DEFAULT_PARK_PROFILES;
  const parkPrefsBySkaterId = store.parkPrefsBySkaterId || {};
  const appPrefs = store.appPrefs || { theme: "dark", language: "auto", backgroundByMemberId: {}, copyOverridesByLanguage: {} };
  const uiLanguagePref = normalizeUiLanguagePref(appPrefs.language, "auto");
  const uiLanguage = resolveUiLanguage(uiLanguagePref);
  const uiLocale = localeFromUiLanguage(uiLanguage);
  const copyOverridesByLanguage = toObj(appPrefs.copyOverridesByLanguage, {});
  const activeCopyOverrides = toObj(copyOverridesByLanguage[uiLanguage], {});
  const tx = (key, fallback = "") => String(activeCopyOverrides[key] || copyText(uiLanguage, key, fallback));
  const programProfileRaw = { ...createDefaultProgramProfile(), ...toObj(store.programProfile, {}) };
  const programProfile = {
    ...programProfileRaw,
    enabled: !!programProfileRaw.enabled,
    programType: normalizeProgramType(programProfileRaw.programType, createDefaultProgramProfile().programType),
    level: normalizeProgramLevel(programProfileRaw.level, createDefaultProgramProfile().level),
    schoolName: String(programProfileRaw.schoolName || "").trim(),
    teamName: String(programProfileRaw.teamName || "").trim(),
    cityState: String(programProfileRaw.cityState || "").trim(),
    season: String(programProfileRaw.season || "").trim(),
    notes: String(programProfileRaw.notes || ""),
  };
  const programLevelLabelMap = {
    youth: "Youth",
    "middle-school": "Middle School",
    "high-school": "High School",
    college: "College",
    adult: "Adult",
  };
  const programTypeLabelMap = {
    family: "Family",
    "school-team": "School Team",
    "club-team": "Club Team",
  };
  const programLevelLabel = programLevelLabelMap[programProfile.level] || "Youth";
  const programTypeLabel = programTypeLabelMap[programProfile.programType] || "Family";
  const isHighSchoolProgram = !!programProfile.enabled && programProfile.level === "high-school";
  const programHeaderLabel = programProfile.teamName || programProfile.schoolName || (isHighSchoolProgram ? "High School Team" : programTypeLabel);
  const cloudSync = { ...DEFAULT_CLOUD_SYNC, ...toObj(store.cloudSync, {}) };
  const betaCheck = { ...createDefaultBetaCheck(), ...toObj(store.betaCheck, {}) };
  const proFeedback = { ...createDefaultProFeedback(), ...toObj(store.proFeedback, {}) };
  const proFeedbackRequestsBySkaterId = toObj(proFeedback.requestsBySkaterId, {});
  const proFeedbackEnabled = !!proFeedback.enabled;
  const proFeedbackAvailable = proFeedbackEnabled && (activeSportKey === "skate" || activeMemberRoleForGate === "proskater");
  const proFeedbackPriceUsd = Math.max(0, Number(proFeedback.priceUsd) || 0);
  const proFeedbackOwnerShareUsd = Math.max(0, Math.min(proFeedbackPriceUsd, Number(proFeedback.ownerShareUsd) || 0));
  const proFeedbackProShareUsd = Math.max(0, Number((proFeedbackPriceUsd - proFeedbackOwnerShareUsd).toFixed(2)));
  const proFeedbackWeeklyPayoutDay = normalizeWeekday(proFeedback.weeklyPayoutDay, "Friday");
  const activeProFeedbackRequests = toArray(proFeedbackRequestsBySkaterId[activeSkaterId]).slice().sort((a, b) => {
    const aMs = Date.parse(String(a?.createdAt || "")) || 0;
    const bMs = Date.parse(String(b?.createdAt || "")) || 0;
    return bMs - aMs;
  });
  const allProFeedbackRequests = Object.entries(proFeedbackRequestsBySkaterId)
    .flatMap(([skaterId, list]) =>
      toArray(list).map((item) => ({
        ...item,
        skaterId: String(item?.skaterId || skaterId || ""),
      }))
    )
    .sort((a, b) => {
      const aMs = Date.parse(String(a?.createdAt || "")) || 0;
      const bMs = Date.parse(String(b?.createdAt || "")) || 0;
      return bMs - aMs;
    });
  const betaCheckedById = toObj(betaCheck.checkedById, {});
  const betaNotesById = toObj(betaCheck.notesById, {});
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState(() => new Date());
  const [cloudSyncBusy, setCloudSyncBusy] = useState(false);
  const [cloudSyncError, setCloudSyncError] = useState("");
  const storeRef = useRef(store);
  const cloudSyncBusyRef = useRef(false);
  const autoSyncBootKeyRef = useRef("");
  useEffect(() => {
    const intervalMin = Math.max(1, Number(cloudSync.autoSyncIntervalMin) || 1);
    if (cloudSync.autoSyncEnabled && cloudSync.autoPullOnLoad !== false && intervalMin === 1) return;
    setSlice({
      cloudSync: {
        ...cloudSync,
        autoSyncEnabled: true,
        autoPullOnLoad: true,
        autoSyncIntervalMin: 1,
      },
    });
  }, [cloudSync.autoSyncEnabled, cloudSync.autoPullOnLoad, cloudSync.autoSyncIntervalMin]);

  const setUI = (patch) => setSlice({ ui: { ...ui, ...patch } });
  const setDraft = (patch) => {
    setSlice({ draft: { ...draft, ...patch } });
    setLastDraftSavedAt(new Date());
  };
  const [mobileTabsOpen, setMobileTabsOpen] = useState(false);
  const switchView = (nextView) => {
    setUI({ view: nextView });
    if (!isSkaterMember && typeof window !== "undefined" && window.innerWidth < 640) {
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

  const isSkaterMember = activeMember?.role === "skater";
  const isProSkaterMember = activeMember?.role === "proskater";
  const isMediaMember = activeMember?.role === "media";
  const canEditPlans = activeMember?.role === "owner" || activeMember?.role === "coach" || activeMember?.role === "skater";
  const canManageSportPackage = ["owner", "coach", "dad"].includes(String(activeMember?.role || ""));
  const canComment = !!activeMember;
  const canEditStudentMedia = ["owner", "coach", "dad", "media"].includes(String(activeMember?.role || ""));
  const canManageCoachCorner = ["owner", "coach", "dad", "proskater", "media"].includes(String(activeMember?.role || ""));
  const canManageAcademy =
    ["owner", "proskater", "coach", "media"].includes(String(activeMember?.role || "")) || /kiko/i.test(String(activeMember?.name || ""));
  const canManageTeam = activeMember?.role === "owner";
  const canManageProFeedback = ["owner", "coach", "dad", "proskater"].includes(String(activeMember?.role || ""));
  const canManageProBilling = ["owner", "coach", "dad"].includes(String(activeMember?.role || ""));
  const canManageProPayout = activeMember?.role === "owner";
  const canDeleteProFeedbackRequest = ["owner", "coach", "dad"].includes(String(activeMember?.role || ""));
  const roleDisplayLabel = (role) => {
    const normalizedRole = String(role || "").trim().toLowerCase();
    if (normalizedRole === "skater") return participantLabel;
    if (normalizedRole === "proskater") return tx("role.proskater", "Pro Skater");
    if (normalizedRole === "owner") return tx("role.owner", "Owner");
    if (normalizedRole === "coach") return tx("role.coach", "Coach");
    if (normalizedRole === "dad") return tx("role.dad", "Dad");
    if (normalizedRole === "media") return tx("role.media", "Media");
    return normalizedRole || "Member";
  };
  const roleAllowedViews = useMemo(
    () => {
      if (isSkaterMember) return new Set(["log", "cards", "calendar", "dash", "plans", "coach", "skateday", "contest", "academy", "chat", "profeedback"]);
      if (isProSkaterMember) return new Set(["log", "cards", "calendar", "dash", "plans", "skateday", "contest", "academy", "chat", "profeedback", "settings"]);
      if (isMediaMember) return new Set(["log", "cards", "calendar", "dash", "coach", "skateday", "contest", "academy", "chat"]);
      return VALID_VIEWS;
    },
    [isSkaterMember, isProSkaterMember, isMediaMember]
  );
  const visibleProFeedbackRequests = useMemo(
    () => (isProSkaterMember ? allProFeedbackRequests : activeProFeedbackRequests),
    [isProSkaterMember, allProFeedbackRequests, activeProFeedbackRequests]
  );
  const proFeedbackDefaultPayment = useMemo(
    () => buildProFeedbackPaymentDetails(proFeedback, proFeedbackPriceUsd, "Pro Feedback Review"),
    [proFeedback, proFeedbackPriceUsd]
  );
  const [calendarMonthKey, setCalendarMonthKey] = useState(() => monthKeyFromDate(new Date()));
  const [calendarNowMs, setCalendarNowMs] = useState(() => Date.now());
  const reminderFiredRef = useRef(new Set());
  const reminderExportBusyRef = useRef(false);
  const [editingPracticeId, setEditingPracticeId] = useState("");
  const [practiceEditDraft, setPracticeEditDraft] = useState({
    dateISO: "",
    time: "17:00",
    durationMin: 60,
    remindMin: 60,
    title: "",
    park: "",
    notes: "",
  });
  const [proFeedbackDraft, setProFeedbackDraft] = useState({
    title: "",
    question: "",
    clipUrl: "",
    preferredResponse: "Video breakdown",
  });

  useEffect(() => {
    const timerId = window.setInterval(() => setCalendarNowMs(Date.now()), 30000);
    return () => window.clearInterval(timerId);
  }, []);

  useEffect(() => {
    setEditingPracticeId("");
  }, [ui.activeSkaterId, ui.view]);

  useEffect(() => {
    if (roleAllowedViews.has(ui.view)) return;
    setUI({ view: "log" });
  }, [roleAllowedViews, ui.view]);
  useEffect(() => {
    if (ui.view !== "profeedback") return;
    if (proFeedbackAvailable) return;
    setUI({ view: "log" });
  }, [ui.view, proFeedbackAvailable]);

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
    const now = calendarNowMs;
    return activePracticeEvents.find((ev) => parseLocalDateTime(ev.dateISO, ev.time).getTime() >= now) || null;
  }, [activePracticeEvents, calendarNowMs]);
  const nextPracticeCountdown = useMemo(() => {
    if (!nextPracticeEvent) return "No upcoming practice";
    const now = calendarNowMs;
    const ms = parseLocalDateTime(nextPracticeEvent.dateISO, nextPracticeEvent.time).getTime() - now;
    if (ms <= 0) return "Starting now";
    const totalMin = Math.round(ms / 60000);
    const days = Math.floor(totalMin / 1440);
    const hours = Math.floor((totalMin % 1440) / 60);
    const mins = totalMin % 60;
    if (days > 0) return `In ${days}d ${hours}h`;
    if (hours > 0) return `In ${hours}h ${mins}m`;
    return `In ${mins}m`;
  }, [nextPracticeEvent, calendarNowMs]);

  const tasks = useMemo(() => plans[draft.dayType] || [], [plans, draft.dayType]);
  useEffect(() => {
    const nextDayType = resolveDraftDayTypeForPlans(plans, draft.dayType);
    if (nextDayType === draft.dayType) return;
    setStore((prev) => ({
      ...(prev || {}),
      draft: {
        ...toObj(prev?.draft, {}),
        dayType: nextDayType,
      },
    }));
  }, [plans, draft.dayType]);
  const isMediaDayDraft = draft.dayType === MEDIA_DAY_LABEL;
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
        rp: { name: APP_NAME },
        user: {
          id: userIdBytes,
          name: `${member.id}@${APP_FILE_PREFIX}.local`,
          displayName: member.name || APP_NAME,
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
          trickAssist: f.type?.startsWith("video/") ? normalizeTrickAssist({}, f.name) : undefined,
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
  const updateDraftMediaTrickAssist = (mediaId, updater) => {
    setDraftMedia((prev) =>
      prev.map((item) => {
        if (item.id !== mediaId) return item;
        const base = normalizeTrickAssist(item?.trickAssist, item?.name || "");
        const nextRaw = typeof updater === "function" ? updater(base, item) : updater;
        return {
          ...item,
          trickAssist: normalizeTrickAssist(nextRaw, item?.name || ""),
        };
      })
    );
  };
  const setDraftMediaTrickFromSuggestion = (mediaId, suggestion) => {
    updateDraftMediaTrickAssist(mediaId, (base) => ({
      ...base,
      selectedTrickId: String(suggestion?.id || ""),
      selectedTrickName: String(suggestion?.name || ""),
    }));
  };
  const setDraftMediaTrickName = (mediaId, nextName) => {
    const raw = String(nextName || "");
    const trimmed = raw.trim();
    const known = findTrickByName(trimmed);
    updateDraftMediaTrickAssist(mediaId, (base) => ({
      ...base,
      selectedTrickName: raw,
      selectedTrickId: trimmed ? String(known?.id || trickIdFromName("assist", trimmed)) : "",
    }));
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
  const [videoDrawEnabled, setVideoDrawEnabled] = useState(false);
  const [videoDrawColor, setVideoDrawColor] = useState("#f43f5e");
  const [videoDrawWidth, setVideoDrawWidth] = useState(4);
  const [videoDrawStrokes, setVideoDrawStrokes] = useState([]);
  const [videoStickFigure, setVideoStickFigure] = useState(() => createDefaultStickFigureGuide());
  const [videoStickPresetKey, setVideoStickPresetKey] = useState("bowl_vert");
  const applyVideoStickPreset = (presetKey) => {
    const patch = getStickFigurePresetPatch(presetKey);
    if (!Object.keys(patch).length) return;
    setVideoStickFigure((prev) => normalizeStickFigureGuide({ ...toObj(prev, {}), ...patch }, prev));
  };
  const videoDrawStrokesRef = useRef([]);
  const videoDrawWrapRef = useRef(null);
  const videoDrawCanvasRef = useRef(null);
  const activeVideoDrawStrokeIdRef = useRef("");

  const resetVideoDrawState = () => {
    setVideoDrawEnabled(false);
    setVideoDrawColor("#f43f5e");
    setVideoDrawWidth(4);
    setVideoDrawStrokes([]);
    setVideoStickFigure(createDefaultStickFigureGuide());
    setVideoStickPresetKey("bowl_vert");
    videoDrawStrokesRef.current = [];
    activeVideoDrawStrokeIdRef.current = "";
  };

  const ensureVideoDrawCanvas = () => {
    const canvas = videoDrawCanvasRef.current;
    const wrap = videoDrawWrapRef.current;
    if (!canvas || !wrap) return null;
    const dpr = Math.max(1, Number(window.devicePixelRatio) || 1);
    const width = Math.max(1, Math.round(wrap.clientWidth));
    const height = Math.max(1, Math.round(wrap.clientHeight));
    const pixelW = Math.max(1, Math.round(width * dpr));
    const pixelH = Math.max(1, Math.round(height * dpr));
    if (canvas.width !== pixelW || canvas.height !== pixelH) {
      canvas.width = pixelW;
      canvas.height = pixelH;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, width, height };
  };

  const redrawVideoDrawLayer = () => {
    const layer = ensureVideoDrawCanvas();
    if (!layer) return;
    const { ctx, width, height } = layer;
    ctx.clearRect(0, 0, width, height);
    drawOverlayStrokes(ctx, normalizeOverlayStrokes(videoDrawStrokesRef.current), width, height);
    drawStickFigureGuide(ctx, normalizeStickFigureGuide(videoStickFigure, createDefaultStickFigureGuide()), width, height);
  };

  const eventToDrawPoint = (event) => {
    const wrap = videoDrawWrapRef.current;
    if (!wrap) return null;
    const rect = wrap.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const x = (Number(event.clientX) - rect.left) / rect.width;
    const y = (Number(event.clientY) - rect.top) / rect.height;
    return {
      x: Math.max(0, Math.min(1, x)),
      y: Math.max(0, Math.min(1, y)),
    };
  };

  const handleVideoDrawPointerDown = (event) => {
    if (!videoDrawEnabled) return;
    const point = eventToDrawPoint(event);
    if (!point) return;
    event.preventDefault();
    const id = `stroke-${uid()}`;
    activeVideoDrawStrokeIdRef.current = id;
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // ignore
    }
    setVideoDrawStrokes((prev) => [...prev, { id, color: videoDrawColor, width: videoDrawWidth, points: [point] }]);
  };

  const handleVideoDrawPointerMove = (event) => {
    const strokeId = activeVideoDrawStrokeIdRef.current;
    if (!videoDrawEnabled || !strokeId) return;
    const point = eventToDrawPoint(event);
    if (!point) return;
    event.preventDefault();
    setVideoDrawStrokes((prev) =>
      prev.map((stroke) => (stroke.id === strokeId ? { ...stroke, points: [...(stroke.points || []), point] } : stroke))
    );
  };

  const endVideoDrawStroke = (event) => {
    if (event) {
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        // ignore
      }
    }
    activeVideoDrawStrokeIdRef.current = "";
  };

  useEffect(() => {
    videoDrawStrokesRef.current = videoDrawStrokes;
    if (videoEdit.open) redrawVideoDrawLayer();
  }, [videoDrawStrokes, videoEdit.open]);

  useEffect(() => {
    if (!videoEdit.open) return;
    redrawVideoDrawLayer();
  }, [videoStickFigure, videoEdit.open]);

  useEffect(() => {
    if (!videoEdit.open) return undefined;
    const onResize = () => redrawVideoDrawLayer();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }
    const observer = new ResizeObserver(onResize);
    if (videoDrawWrapRef.current) observer.observe(videoDrawWrapRef.current);
    return () => observer.disconnect();
  }, [videoEdit.open]);

  const closeVideoEditor = () => {
    if (videoEdit.processing) return;
    resetVideoDrawState();
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
      resetVideoDrawState();
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
      resetVideoDrawState();
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
        overlayStrokes: videoDrawStrokes,
        overlayStickFigure: videoStickFigure,
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
                          trickAssist: normalizeTrickAssist(item?.trickAssist, nextName),
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
                  trickAssist: normalizeTrickAssist(item?.trickAssist, nextName),
                }
              : item
          )
        );
      }
      safeRevokeObjectURL(media.url);
      closeVideoEditor();
      const hasCoachOverlay = videoDrawStrokes.length || videoStickFigure.enabled;
      toast(
        "Video updated",
        `${Math.max(0.25, out.durationSec).toFixed(1)}s • ${out.width}x${out.height} • ${formatBytes(out.blob.size)}${hasCoachOverlay ? " • Coach overlay added" : ""}`,
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
  const formatDateTime = (value) => {
    const dt = new Date(value);
    return Number.isNaN(dt.getTime()) ? "" : dt.toLocaleString(uiLocale);
  };
  const formatClockTime = (value) => {
    const dt = new Date(value);
    return Number.isNaN(dt.getTime()) ? "" : dt.toLocaleTimeString(uiLocale, { hour: "numeric", minute: "2-digit" });
  };
  const toggleTheme = () => setSlice({ appPrefs: { ...appPrefs, theme: isLightMode ? "dark" : "light" } });
  const setLanguagePreference = (nextLanguage) =>
    setSlice({ appPrefs: { ...appPrefs, language: normalizeUiLanguagePref(nextLanguage, appPrefs.language || "auto") } });
  const selectedLanguageOverrideMap = useMemo(() => toObj(copyOverridesByLanguage[uiLanguage], {}), [copyOverridesByLanguage, uiLanguage]);
  const [languageOverrideDraft, setLanguageOverrideDraft] = useState(() => JSON.stringify(selectedLanguageOverrideMap, null, 2));
  useEffect(() => {
    setLanguageOverrideDraft(JSON.stringify(selectedLanguageOverrideMap, null, 2));
  }, [uiLanguage, selectedLanguageOverrideMap]);
  const saveLanguageOverrideDraft = () => {
    try {
      const parsed = JSON.parse(String(languageOverrideDraft || "{}"));
      if (!isPlainObject(parsed)) throw new Error("Translation JSON must be an object.");
      const cleaned = Object.fromEntries(
        Object.entries(parsed)
          .map(([k, v]) => [String(k || ""), String(v || "")])
          .filter(([k, v]) => k && v)
      );
      setSlice({
        appPrefs: {
          ...appPrefs,
          copyOverridesByLanguage: {
            ...copyOverridesByLanguage,
            [uiLanguage]: cleaned,
          },
        },
      });
      toast("Language overrides saved", `${Object.keys(cleaned).length} key(s) updated for ${uiLanguage}.`, "success");
    } catch (err) {
      toast("Invalid translation JSON", err?.message || "JSON parse failed.", "warn");
    }
  };
  const clearLanguageOverrideDraft = () => {
    const next = { ...copyOverridesByLanguage };
    delete next[uiLanguage];
    setSlice({ appPrefs: { ...appPrefs, copyOverridesByLanguage: next } });
    setLanguageOverrideDraft("{}");
    toast("Language overrides cleared", `Custom copy removed for ${uiLanguage}.`, "warn");
  };
  const activeMemberIdForPrefs = String(activeMember?.id || ui.activeMemberId || "default");
  const backgroundByMemberId = toObj(appPrefs.backgroundByMemberId, {});
  const activeBackgroundPref = normalizeBackgroundPref(backgroundByMemberId[activeMemberIdForPrefs]);
  const saveActiveBackgroundPref = (patch = {}) => {
    const merged = normalizeBackgroundPref({ ...activeBackgroundPref, ...toObj(patch, {}) });
    setSlice({
      appPrefs: {
        ...appPrefs,
        backgroundByMemberId: {
          ...backgroundByMemberId,
          [activeMemberIdForPrefs]: merged,
        },
      },
    });
  };
  const applyBackgroundPreset = (presetKey) => saveActiveBackgroundPref({ mode: "preset", presetKey, imageUrl: "" });
  const clearBackgroundPersonalization = () => saveActiveBackgroundPref({ mode: "default", imageUrl: "" });
  const setBackgroundImageLayout = (layout) => {
    const normalized = String(layout || "").toLowerCase() === "tile" ? "tile" : "fit";
    if (!activeBackgroundPref.imageUrl) return;
    saveActiveBackgroundPref({ mode: "image", imageLayout: normalized });
  };
  const uploadBackgroundImage = async (file) => {
    if (!file || !String(file.type || "").startsWith("image/")) {
      toast("Invalid image", "Choose a photo/image file.", "warn");
      return;
    }
    if ((Number(file.size) || 0) > MAX_IMAGE_FILE_BYTES) {
      toast("Image too large", "Use an image under 25MB.", "warn");
      return;
    }
    try {
      const compressed = await compressImageFile(file, { maxW: 1280, maxH: 1280, quality: 0.8, maxBytes: 550 * 1024 });
      const imageUrl = await fileToDataUrl(compressed);
      saveActiveBackgroundPref({
        mode: "image",
        imageUrl,
        presetKey: activeBackgroundPref.presetKey || "aurora",
        imageLayout: activeBackgroundPref.imageLayout === "tile" ? "tile" : "fit",
      });
      toast("Background updated", `${activeMember?.name || "User"} personalization saved (optimized).`, "success");
    } catch {
      toast("Background failed", "Could not process this image.", "warn");
    }
  };
  const activeBackgroundPresetCss = BACKGROUND_PRESETS.find((p) => p.key === activeBackgroundPref.presetKey)?.css || BACKGROUND_PRESETS[0].css;
  const backgroundImageLayout = activeBackgroundPref.imageLayout === "tile" ? "tile" : "fit";
  const appShellPersonalStyle =
    activeBackgroundPref.mode === "image" && activeBackgroundPref.imageUrl
      ? {
          backgroundImage:
            backgroundImageLayout === "tile"
              ? isLightMode
                ? `linear-gradient(rgba(248,250,252,0.58), rgba(226,232,240,0.48)), url("${activeBackgroundPref.imageUrl}")`
                : `linear-gradient(rgba(2,6,23,0.46), rgba(2,6,23,0.32)), url("${activeBackgroundPref.imageUrl}")`
              : isLightMode
              ? `linear-gradient(rgba(248,250,252,0.64), rgba(226,232,240,0.50)), url("${activeBackgroundPref.imageUrl}")`
              : `linear-gradient(rgba(2,6,23,0.50), rgba(2,6,23,0.40)), url("${activeBackgroundPref.imageUrl}")`,
          backgroundSize: backgroundImageLayout === "tile" ? "100% 100%, 200px 200px" : "100% 100%, cover",
          backgroundPosition: backgroundImageLayout === "tile" ? "center, top left" : "center, center",
          backgroundRepeat: backgroundImageLayout === "tile" ? "no-repeat, repeat" : "no-repeat, no-repeat",
          backgroundAttachment: backgroundImageLayout === "fit" ? "scroll, fixed" : "scroll, scroll",
          backgroundColor: isLightMode ? "#e2e8f0" : "#020617",
        }
      : activeBackgroundPref.mode === "preset"
      ? {
          backgroundImage: activeBackgroundPresetCss,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }
      : undefined;
  const updateProgramProfile = (patch = {}) =>
    setSlice({
      programProfile: {
        ...programProfile,
        ...patch,
        enabled: Object.prototype.hasOwnProperty.call(patch, "enabled") ? !!patch.enabled : !!programProfile.enabled,
        programType: normalizeProgramType(patch.programType ?? programProfile.programType, programProfile.programType),
        level: normalizeProgramLevel(patch.level ?? programProfile.level, programProfile.level),
        schoolName: String(patch.schoolName ?? programProfile.schoolName ?? "").trim(),
        teamName: String(patch.teamName ?? programProfile.teamName ?? "").trim(),
        cityState: String(patch.cityState ?? programProfile.cityState ?? "").trim(),
        season: String(patch.season ?? programProfile.season ?? "").trim(),
        notes: String(patch.notes ?? programProfile.notes ?? ""),
      },
    });
  const appTagline = tx("app.tagline", APP_TAGLINE);
  const openMeteoLang = openMeteoLanguageCode(uiLanguage);
  const selectedParkId = parkPrefsBySkaterId[ui.activeSkaterId] || parkProfiles[0]?.id || "";
  const selectedParkProfile = useMemo(
    () => parkProfiles.find((p) => p.id === selectedParkId) || null,
    [parkProfiles, selectedParkId]
  );
  const [parkLookupQuery, setParkLookupQuery] = useState("");
  const [parkLookupLoading, setParkLookupLoading] = useState(false);
  const [parkLookupResults, setParkLookupResults] = useState([]);
  const [parkTypeaheadQuery, setParkTypeaheadQuery] = useState("");
  const [parkTypeaheadResults, setParkTypeaheadResults] = useState([]);
  const parkTypeaheadReqRef = useRef(0);
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

  const queueParkTypeahead = (value) => {
    setParkTypeaheadQuery(String(value || "").trim());
  };

  const fetchOpenMeteoParkResults = async (query, count = 8) => {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=${Math.max(1, Math.min(30, Number(count) || 8))}&language=${encodeURIComponent(
      openMeteoLang
    )}&format=json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Location search unavailable.");
    const data = await res.json();
    return normalizeParkLookupResults(data?.results);
  };

  const fetchGoSkateParkResults = async (query, count = 12) => {
    const params = new URLSearchParams({
      search: String(query || "").trim(),
      per_page: String(Math.max(1, Math.min(40, Number(count) || 12))),
      page: "1",
      _fields: GOSKATE_LISTING_FIELDS,
    });
    const res = await fetch(`${GOSKATE_LISTING_API}?${params.toString()}`);
    if (!res.ok) throw new Error("GoSkate search unavailable.");
    const data = await res.json();
    return normalizeGoSkateLookupResults(data);
  };

  useEffect(() => {
    const query = String(parkTypeaheadQuery || "").trim();
    if (query.length < 2) {
      setParkTypeaheadResults([]);
      return undefined;
    }
    const reqId = parkTypeaheadReqRef.current + 1;
    parkTypeaheadReqRef.current = reqId;
    const timerId = window.setTimeout(async () => {
      const [goSkateRes, openMeteoRes] = await Promise.allSettled([
        query.length >= 3 ? fetchGoSkateParkResults(query, 12) : Promise.resolve([]),
        fetchOpenMeteoParkResults(query, 12),
      ]);
      if (parkTypeaheadReqRef.current !== reqId) return;
      const goSkateRows = goSkateRes.status === "fulfilled" ? goSkateRes.value : [];
      const openMeteoRows = openMeteoRes.status === "fulfilled" ? openMeteoRes.value : [];
      setParkTypeaheadResults(mergeParkLookupResults(goSkateRows, openMeteoRows).slice(0, 24));
    }, 220);
    return () => window.clearTimeout(timerId);
  }, [parkTypeaheadQuery]);

  const parkAutocompleteOptions = useMemo(() => {
    const out = [];
    const seen = new Set();
    const addOption = (name, location = "") => {
      const n = String(name || "").trim();
      if (!n) return;
      const loc = String(location || "").trim();
      const key = `${n.toLowerCase()}|${loc.toLowerCase()}`;
      if (seen.has(key)) return;
      seen.add(key);
      out.push({ name: n, location: loc });
    };
    for (const p of parkProfiles) addOption(p?.name, p?.location);
    for (const r of parkTypeaheadResults) addOption(r?.name, [r?.admin1, r?.country].filter(Boolean).join(", "));
    return out.slice(0, 80);
  }, [parkProfiles, parkTypeaheadResults]);

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
        "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max" +
        "&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=auto";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Weather service unavailable.");
      const data = await res.json();
      const dailyDates = toArray(data?.daily?.time);
      const daily = dailyDates.slice(0, 5).map((dateISO, idx) => ({
        dateISO: String(dateISO || ""),
        code: Number(data?.daily?.weather_code?.[idx] ?? 0),
        maxF: Math.round(Number(data?.daily?.temperature_2m_max?.[idx] ?? 0)),
        minF: Math.round(Number(data?.daily?.temperature_2m_min?.[idx] ?? 0)),
        rainPct: Math.max(0, Math.round(Number(data?.daily?.precipitation_probability_max?.[idx] ?? 0))),
      }));
      setWeatherState({
        loading: false,
        error: "",
        current: null,
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
      const [goSkateRes, openMeteoRes] = await Promise.allSettled([
        fetchGoSkateParkResults(query, 20),
        fetchOpenMeteoParkResults(query, 12),
      ]);
      const goSkateRows = goSkateRes.status === "fulfilled" ? goSkateRes.value : [];
      const openMeteoRows = openMeteoRes.status === "fulfilled" ? openMeteoRes.value : [];
      const results = mergeParkLookupResults(goSkateRows, openMeteoRows).slice(0, 40);
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
      notes: item.source === "goskate" ? "Added from GoSkate" : "Added from search",
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
        notes: r.source === "goskate" ? "Added from GoSkate" : "Added from search",
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

    const oldName = String(selectedParkProfile.name || "").trim();
    const oldNameLc = oldName.toLowerCase();
    const matchesOldParkName = (value) => String(value || "").trim().toLowerCase() === oldNameLc;
    const shouldUpdateDraftPark = matchesOldParkName(draft.park);
    const shouldUpdatePracticeDefaultPark = matchesOldParkName(practiceSettings.park);
    const nextPracticeEvents = practiceEvents.map((ev) =>
      matchesOldParkName(ev?.park)
        ? {
            ...ev,
            park: nextName,
          }
        : ev
    );
    const changedPracticeCount = nextPracticeEvents.reduce((count, ev, idx) => (ev === practiceEvents[idx] ? count : count + 1), 0);

    setSlice({
      parkProfiles: parkProfiles.map((p) => (p.id === selectedParkProfile.id ? nextPark : p)),
      ...(shouldUpdateDraftPark ? { draft: { ...draft, park: nextName } } : {}),
      ...(shouldUpdatePracticeDefaultPark ? { practiceSettings: { ...practiceSettings, park: nextName } } : {}),
      ...(changedPracticeCount ? { practiceEvents: nextPracticeEvents } : {}),
    });
    toast(
      "Park updated",
      `${nextPark.name}${nextPark.location ? ` • ${nextPark.location}` : ""}${changedPracticeCount ? ` • ${changedPracticeCount} practice(s) updated` : ""}`,
      "success"
    );
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
    downloadTextFile(`${APP_FILE_PREFIX}-backup-${todayISO()}.json`, JSON.stringify(store, null, 2), "application/json");
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
    if (/Missing or insufficient permissions|PERMISSION_DENIED/i.test(msg)) {
      return `${msg} Check firestore.rules for your sync path and make sure this account has a role claim (owner/coach/dad/proskater for write).`;
    }
    if (/UNAUTHENTICATED|authentication credentials|Request had invalid authentication credentials/i.test(msg)) {
      return `${msg} Enable Firebase Auth (Anonymous is fine for beta) and make sure authorized domains include this Hosting URL.`;
    }
    if (/AppCheck|APP_CHECK_TOKEN|app check/i.test(msg)) {
      return `${msg} If App Check enforcement is on, set VITE_FIREBASE_APPCHECK_SITE_KEY and register this domain in App Check.`;
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
          updatedBy: { stringValue: activeMember?.name || APP_NAME },
          buildStamp: { stringValue: BUILD_STAMP },
        },
      };
      const headers = await buildCloudSyncRequestHeaders(cfg, { contentType: true });
      const res = await fetch(url, {
        method: "PATCH",
        headers,
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
      const headers = await buildCloudSyncRequestHeaders(cfg, { contentType: false });
      const res = await fetch(url, { method: "GET", headers });
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
            const file = new File([blob], `${APP_FILE_PREFIX}-card.${ext}`, { type: blob.type || "application/octet-stream" });
            if (navigator.canShare({ files: [file] })) {
              await navigator.share({ title: `${APP_NAME} Card`, text, files: [file] });
              return;
            }
          } catch {
            // fall through to text share
          }
        }
        await navigator.share({ title: `${APP_NAME} Card`, text });
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
  const coachDemoVideoClips = useMemo(() => {
    return activeCoachItems
      .flatMap((item) =>
        toArray(item.media)
          .filter((m) => String(m?.type || "").startsWith("video/"))
          .map((m) => ({
            key: `${item.id}:${m.id}`,
            itemId: item.id,
            mediaId: m.id,
            media: m,
            title: item.title || "Coach Demo",
            trickLabel: item.taskLabel || "",
            notes: item.notes || "",
          }))
      )
      .slice(0, 20);
  }, [activeCoachItems]);
  const coachStudentVideoClips = useMemo(() => {
    return sessions
      .filter((s) => s.skaterId === ui.activeSkaterId)
      .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")))
      .flatMap((s) =>
        toArray(s.media)
          .filter((m) => String(m?.type || "").startsWith("video/"))
          .map((m) => ({
            key: `${s.id}:${m.id}`,
            sessionId: s.id,
            mediaId: m.id,
            media: m,
            date: s.date,
            dayType: s.dayType,
            park: s.park,
            trickLabel: String(m?.trickAssist?.selectedTrickName || "").trim(),
          }))
      )
      .slice(0, 12);
  }, [sessions, ui.activeSkaterId]);
  const [compareCoachClipKey, setCompareCoachClipKey] = useState("");
  const [compareStudentClipKey, setCompareStudentClipKey] = useState("");
  const [comparePlaybackRate, setComparePlaybackRate] = useState(1);
  const compareCoachVideoRef = useRef(null);
  const compareStudentVideoRef = useRef(null);
  const [compareStickFigureBySide, setCompareStickFigureBySide] = useState(() => ({
    coach: createDefaultStickFigureGuide({ color: "#22d3ee", opacity: 0.84 }),
    student: createDefaultStickFigureGuide({ color: "#f59e0b", opacity: 0.84 }),
  }));
  const [compareStickPresetKeyBySide, setCompareStickPresetKeyBySide] = useState({ coach: "bowl_vert", student: "bowl_vert" });
  const applyCompareStickPreset = (side, presetKey) => {
    const patch = getStickFigurePresetPatch(presetKey);
    if (!Object.keys(patch).length) return;
    updateCompareStickFigure(side, patch);
  };
  const updateCompareStickFigure = (side, patch = {}) => {
    const key = side === "student" ? "student" : "coach";
    setCompareStickFigureBySide((prev) => ({
      ...prev,
      [key]: normalizeStickFigureGuide(
        {
          ...createDefaultStickFigureGuide(key === "student" ? { color: "#f59e0b" } : { color: "#22d3ee" }),
          ...toObj(prev[key], {}),
          ...toObj(patch, {}),
        },
        key === "student" ? { color: "#f59e0b" } : { color: "#22d3ee" }
      ),
    }));
  };

  useEffect(() => {
    if (!coachDemoVideoClips.length) {
      if (compareCoachClipKey) setCompareCoachClipKey("");
      return;
    }
    if (coachDemoVideoClips.some((c) => c.key === compareCoachClipKey)) return;
    setCompareCoachClipKey(coachDemoVideoClips[0].key);
  }, [coachDemoVideoClips, compareCoachClipKey]);

  useEffect(() => {
    if (!coachStudentVideoClips.length) {
      if (compareStudentClipKey) setCompareStudentClipKey("");
      return;
    }
    if (coachStudentVideoClips.some((c) => c.key === compareStudentClipKey)) return;
    setCompareStudentClipKey(coachStudentVideoClips[0].key);
  }, [coachStudentVideoClips, compareStudentClipKey]);

  const selectedCoachCompareClip = useMemo(
    () => coachDemoVideoClips.find((clip) => clip.key === compareCoachClipKey) || null,
    [coachDemoVideoClips, compareCoachClipKey]
  );
  const selectedStudentCompareClip = useMemo(
    () => coachStudentVideoClips.find((clip) => clip.key === compareStudentClipKey) || null,
    [coachStudentVideoClips, compareStudentClipKey]
  );

  const pauseCompareVideos = () => {
    try {
      compareCoachVideoRef.current?.pause();
    } catch {
      // ignore
    }
    try {
      compareStudentVideoRef.current?.pause();
    } catch {
      // ignore
    }
  };

  const resetCompareVideos = () => {
    pauseCompareVideos();
    if (compareCoachVideoRef.current) compareCoachVideoRef.current.currentTime = 0;
    if (compareStudentVideoRef.current) compareStudentVideoRef.current.currentTime = 0;
  };

  const stepCompareVideos = (direction) => {
    if (!compareCoachVideoRef.current || !compareStudentVideoRef.current) return;
    pauseCompareVideos();
    const frameStep = (1 / 30) * (direction >= 0 ? 1 : -1);
    const coachNow = Number(compareCoachVideoRef.current.currentTime) || 0;
    const studentNow = Number(compareStudentVideoRef.current.currentTime) || 0;
    let nextTime = Math.max(0, Math.min(coachNow, studentNow) + frameStep);
    const coachDur = Number(compareCoachVideoRef.current.duration);
    const studentDur = Number(compareStudentVideoRef.current.duration);
    const caps = [coachDur, studentDur].filter((d) => Number.isFinite(d) && d > 0);
    if (caps.length) {
      const cap = Math.max(0, Math.min(...caps) - 0.001);
      nextTime = Math.min(nextTime, cap);
    }
    compareCoachVideoRef.current.currentTime = nextTime;
    compareStudentVideoRef.current.currentTime = nextTime;
  };

  const playCompareVideos = async () => {
    if (!compareCoachVideoRef.current || !compareStudentVideoRef.current) return;
    const rate = Math.max(0.25, Math.min(2, Number(comparePlaybackRate) || 1));
    compareCoachVideoRef.current.playbackRate = rate;
    compareStudentVideoRef.current.playbackRate = rate;
    const coachTime = Number(compareCoachVideoRef.current.currentTime) || 0;
    const studentTime = Number(compareStudentVideoRef.current.currentTime) || 0;
    const syncTime = Math.min(coachTime, studentTime);
    compareCoachVideoRef.current.currentTime = syncTime;
    compareStudentVideoRef.current.currentTime = syncTime;
    const results = await Promise.allSettled([compareCoachVideoRef.current.play(), compareStudentVideoRef.current.play()]);
    if (results.some((r) => r.status === "rejected")) {
      toast("Compare playback blocked", "Tap play directly on each video once, then use Play Both.", "warn");
    }
  };

  useEffect(() => {
    const rate = Math.max(0.25, Math.min(2, Number(comparePlaybackRate) || 1));
    if (compareCoachVideoRef.current) compareCoachVideoRef.current.playbackRate = rate;
    if (compareStudentVideoRef.current) compareStudentVideoRef.current.playbackRate = rate;
  }, [comparePlaybackRate, selectedCoachCompareClip, selectedStudentCompareClip]);

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
          trickAssist: f.type?.startsWith("video/") ? normalizeTrickAssist({}, f.name) : undefined,
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

  const activeTrickProfile = normalizeTrickProfile(trickProfileBySkaterId[ui.activeSkaterId]);
  const setActiveTrickProfile = (next) =>
    setSlice({
      trickProfileBySkaterId: {
        ...trickProfileBySkaterId,
        [ui.activeSkaterId]: normalizeTrickProfile(next),
      },
    });
  const [trickCategoryFilter, setTrickCategoryFilter] = useState("all");
  const [trickSearch, setTrickSearch] = useState("");
  const [customTrickDraft, setCustomTrickDraft] = useState({ name: "", category: "street" });
  const trickCategoryOptions = useMemo(
    () => [{ key: "all", label: "All Categories" }, ...SKATE_TRICK_CATALOG.map((cat) => ({ key: cat.key, label: cat.label }))],
    []
  );
  const trickCatalogOptions = useMemo(() => {
    const custom = toArray(activeTrickProfile.customTricks).map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      categoryLabel: SKATE_TRICK_CATALOG.find((cat) => cat.key === item.category)?.label || "Custom",
      isCustom: true,
    }));
    return [...SKATE_TRICK_LIBRARY.map((x) => ({ ...x, isCustom: false })), ...custom];
  }, [activeTrickProfile.customTricks]);
  const filteredTrickCatalog = useMemo(() => {
    const q = String(trickSearch || "").trim().toLowerCase();
    return trickCatalogOptions
      .filter((trick) => (trickCategoryFilter === "all" ? true : trick.category === trickCategoryFilter))
      .filter((trick) => (!q ? true : `${trick.name} ${trick.categoryLabel}`.toLowerCase().includes(q)))
      .slice(0, 500);
  }, [trickCatalogOptions, trickCategoryFilter, trickSearch]);
  const planTrickDropdownOptions = useMemo(() => {
    const learned = new Set(toArray(activeTrickProfile.learnedIds));
    const wishlist = new Set(toArray(activeTrickProfile.wishlistIds));
    const seenByName = new Set();
    return trickCatalogOptions
      .filter((trick) => {
        const key = String(trick?.name || "").trim().toLowerCase();
        if (!key || seenByName.has(key)) return false;
        seenByName.add(key);
        return true;
      })
      .sort((a, b) => {
        const scoreA = (learned.has(a.id) ? 2 : 0) + (wishlist.has(a.id) ? 1 : 0);
        const scoreB = (learned.has(b.id) ? 2 : 0) + (wishlist.has(b.id) ? 1 : 0);
        if (scoreA !== scoreB) return scoreB - scoreA;
        return String(a.name || "").localeCompare(String(b.name || ""));
      })
      .slice(0, 800);
  }, [trickCatalogOptions, activeTrickProfile.learnedIds, activeTrickProfile.wishlistIds]);
  const learnedTrickCount = toArray(activeTrickProfile.learnedIds).length;
  const wishlistTrickCount = toArray(activeTrickProfile.wishlistIds).length;
  const toggleTrickLearned = (trickId, nextChecked) => {
    const nextSet = new Set(toArray(activeTrickProfile.learnedIds));
    if (nextChecked) nextSet.add(trickId);
    else nextSet.delete(trickId);
    setActiveTrickProfile({ ...activeTrickProfile, learnedIds: [...nextSet] });
  };
  const toggleTrickWishlist = (trickId, nextChecked) => {
    const nextSet = new Set(toArray(activeTrickProfile.wishlistIds));
    if (nextChecked) nextSet.add(trickId);
    else nextSet.delete(trickId);
    setActiveTrickProfile({ ...activeTrickProfile, wishlistIds: [...nextSet] });
  };
  const addCustomCatalogTrick = () => {
    const name = String(customTrickDraft.name || "").trim();
    const category = String(customTrickDraft.category || "street")
      .trim()
      .toLowerCase();
    if (!name) {
      toast("Custom trick missing", "Type a trick name first.", "warn");
      return;
    }
    const cat = SKATE_TRICK_CATALOG.some((x) => x.key === category) ? category : "street";
    const id = trickIdFromName(cat, `custom-${name}`);
    const exists = trickCatalogOptions.some((t) => t.id === id || String(t.name || "").toLowerCase() === name.toLowerCase());
    if (exists) {
      toast("Trick already exists", "This trick is already in your catalog.", "warn");
      return;
    }
    setActiveTrickProfile({
      ...activeTrickProfile,
      customTricks: [...toArray(activeTrickProfile.customTricks), { id, name, category: cat }],
      learnedIds: [...new Set([...(activeTrickProfile.learnedIds || []), id])],
    });
    setCustomTrickDraft({ name: "", category: cat });
    toast("Custom trick added", `${name} added to catalog.`, "success");
  };
  const removeCustomCatalogTrick = (trickId) => {
    const custom = toArray(activeTrickProfile.customTricks);
    const found = custom.find((x) => x.id === trickId);
    if (!found) return;
    setActiveTrickProfile({
      ...activeTrickProfile,
      customTricks: custom.filter((x) => x.id !== trickId),
      learnedIds: toArray(activeTrickProfile.learnedIds).filter((id) => id !== trickId),
      wishlistIds: toArray(activeTrickProfile.wishlistIds).filter((id) => id !== trickId),
    });
    toast("Custom trick removed", `${found.name} removed.`, "warn");
  };

  const academyState = normalizeAcademyState(academyBySkaterId[ui.activeSkaterId]);
  const setAcademyState = (next) =>
    setSlice({
      academyBySkaterId: {
        ...academyBySkaterId,
        [ui.activeSkaterId]: normalizeAcademyState(next),
      },
    });
  const patchAcademyState = (patch) => setAcademyState({ ...academyState, ...toObj(patch, {}) });
  const academyHasAccess =
    canManageAcademy || !academyState.membersOnly || toArray(academyState.memberIds).includes(String(activeMember?.id || ""));
  const academyBranding = toObj(academyState.branding, {});
  const academyFees = toObj(academyState.fees, {});
  const academyAccentColor = normalizeHexColor(academyBranding.accentColor, "#84cc16");
  const academyCardColor = normalizeHexColor(academyBranding.cardColor, "#0f172a");
  const academyTextColor = normalizeHexColor(academyBranding.textColor, "#ffffff");
  const academyFeeFormatter = useMemo(
    () =>
      new Intl.NumberFormat(uiLocale || undefined, {
        style: "currency",
        currency: normalizeCurrencyCode(academyFees.currency, "USD"),
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }),
    [uiLocale, academyFees.currency]
  );
  const formatAcademyPrice = (value) => academyFeeFormatter.format(Math.max(0, Number(value) || 0));
  const patchAcademyBranding = (patch) =>
    patchAcademyState({
      branding: {
        ...academyBranding,
        ...toObj(patch, {}),
      },
    });
  const patchAcademyFees = (patch) =>
    patchAcademyState({
      fees: {
        ...academyFees,
        ...toObj(patch, {}),
      },
    });
  const setAcademyBrandAsset = async (targetKey, fileList) => {
    if (!canManageAcademy) return;
    const { valid: files, stats } = guardUploadFiles(fileList, {
      maxCount: 1,
      maxBytes: MAX_IMAGE_FILE_BYTES,
      allowedPrefixes: ["image/"],
    });
    const first = files[0];
    if (!first) {
      toast("No image selected", "Use a PNG/JPG/WebP image for academy branding.", "warn");
      return;
    }
    try {
      const compressed = await compressImageFile(first, { maxW: 1800, maxH: 1800, quality: 0.86, maxBytes: 1200 * 1024 });
      const dataUrl = await fileToDataUrl(compressed);
      patchAcademyBranding({ [targetKey]: dataUrl });
      toast("Brand image updated", `${targetKey === "logoUrl" ? "Logo" : "Banner"} saved.`, "success");
    } catch (err) {
      console.error("Academy branding upload failed:", err);
      toast("Upload failed", "Could not process that image.", "warn");
    }
    if (stats.trimmed || stats.tooLarge || stats.wrongType) {
      toast(
        "Some files skipped",
        `${stats.trimmed ? `${stats.trimmed} over limit, ` : ""}${stats.tooLarge ? `${stats.tooLarge} too large, ` : ""}${stats.wrongType ? `${stats.wrongType} wrong type` : ""}`.replace(/, $/, ""),
        "warn"
      );
    }
  };
  const clearAcademyBrandAsset = (targetKey) => {
    if (!canManageAcademy) return;
    patchAcademyBranding({ [targetKey]: "" });
    toast("Brand image removed", `${targetKey === "logoUrl" ? "Logo" : "Banner"} cleared.`, "warn");
  };
  const openAcademyPaymentLink = () => {
    const url = normalizeExternalUrl(academyFees.paymentUrl || "");
    if (!isOpenableExternalUrl(url)) {
      toast("Payment link missing", "Add a valid payment URL first.", "warn");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };
  const [academyDraft, setAcademyDraft] = useState({ title: "", summary: "", level: "All Levels" });
  const addAcademyCourseFromFiles = async (fileList) => {
    if (!canManageAcademy) return;
    const title = String(academyDraft.title || "").trim();
    if (!title) {
      toast("Course title needed", "Enter a lesson title first.", "warn");
      return;
    }
    const { valid: files, stats } = guardUploadFiles(fileList, {
      maxCount: MAX_UPLOAD_COUNT,
      maxBytes: MAX_MEDIA_FILE_BYTES,
      allowedPrefixes: ["image/", "video/"],
    });
    if (!files.length) {
      toast("No lesson media added", "Files were invalid, too large, or unsupported.", "warn");
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
          id: `acm-${uid()}`,
          type: f.type,
          name: f.name,
          size: f.size,
          url: URL.createObjectURL(f),
          dataUrl,
          trickAssist: f.type?.startsWith("video/") ? normalizeTrickAssist({}, f.name) : undefined,
        };
      })
    );
    const nextCourse = {
      id: `ac-${uid()}`,
      title,
      summary: String(academyDraft.summary || "").trim(),
      level: String(academyDraft.level || "All Levels"),
      media,
      createdBy: activeMember?.name || "",
      createdAt: new Date().toISOString(),
    };
    patchAcademyState({ courses: [nextCourse, ...toArray(academyState.courses)].slice(0, 300) });
    setAcademyDraft({ title: "", summary: "", level: "All Levels" });
    toast("Academy lesson added", `${media.length} media item(s) uploaded.`, "success");
    if (stats.trimmed || stats.tooLarge || stats.wrongType) {
      toast(
        "Some files skipped",
        `${stats.trimmed ? `${stats.trimmed} over limit, ` : ""}${stats.tooLarge ? `${stats.tooLarge} too large, ` : ""}${stats.wrongType ? `${stats.wrongType} wrong type` : ""}`.replace(/, $/, ""),
        "warn"
      );
    }
  };
  const removeAcademyCourse = (courseId) => {
    if (!canManageAcademy) return;
    const found = toArray(academyState.courses).find((x) => x.id === courseId);
    if (!found) return;
    for (const m of found.media || []) if (m?.url) safeRevokeObjectURL(m.url);
    patchAcademyState({ courses: toArray(academyState.courses).filter((x) => x.id !== courseId) });
    toast("Lesson removed", "Academy lesson deleted.", "warn");
  };
  const removeAcademyMedia = (courseId, mediaId) => {
    if (!canManageAcademy) return;
    const courses = toArray(academyState.courses);
    const nextCourses = courses.map((course) =>
      course.id === courseId
        ? {
            ...course,
            media: toArray(course.media).filter((m) => {
              if (m.id === mediaId && m?.url) safeRevokeObjectURL(m.url);
              return m.id !== mediaId;
            }),
          }
        : course
    );
    patchAcademyState({ courses: nextCourses });
  };
  const toggleAcademyMember = (memberId, checked) => {
    if (!canManageAcademy) return;
    const next = new Set(toArray(academyState.memberIds).map((id) => String(id || "")));
    if (checked) next.add(String(memberId || ""));
    else next.delete(String(memberId || ""));
    patchAcademyState({ memberIds: [...next] });
  };

  const defaultContestState = {
    eventName: "",
    eventDate: todayISO(),
    eventPark: "",
    eventDivision: "",
    round: "Qualifiers",
    virtualEnabled: false,
    liveNow: false,
    liveMembersOnly: true,
    liveTitle: "",
    liveStreamUrl: "",
    nonProfitUrl: "",
    firstClassMembersUrl: "",
    runs: [],
  };
  const contestState = {
    ...defaultContestState,
    ...toObj(contestBySkaterId[ui.activeSkaterId], {}),
    runs: toArray(contestBySkaterId[ui.activeSkaterId]?.runs),
  };
  const contestLiveHasAccess = canManageAcademy || !contestState.liveMembersOnly || academyHasAccess;
  const setContestState = (next) =>
    setSlice({
      contestBySkaterId: {
        ...contestBySkaterId,
        [ui.activeSkaterId]: next,
      },
    });

  const patchContestState = (patch) => setContestState({ ...contestState, ...patch });
  const openContestExternalUrl = (value, label, options = {}) => {
    const normalized = normalizeExternalUrl(value || "");
    if (!isOpenableExternalUrl(normalized)) {
      toast("Invalid link", `Add a valid https:// URL for ${label}.`, "warn");
      return;
    }
    if (options.requireMemberAccess && !contestLiveHasAccess) {
      toast("Members-only access", "This link is members-only for First Class Skate members.", "warn");
      return;
    }
    window.open(normalized, "_blank", "noopener,noreferrer");
  };

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
      linePlan: [],
      lineDraftSourceKey: "",
      createdAt: new Date().toISOString(),
    };
    patchContestState({ runs: [...(contestState.runs || []), nextRun] });
    toast("Run added", `Run ${nextRun.runNo} created.`, "success");
  };

  const updateContestRun = (runId, patch) => {
    patchContestState({
      runs: (contestState.runs || []).map((r) =>
        r.id === runId ? { ...r, ...toObj(patch, {}), linePlan: toArray(patch?.linePlan ?? r.linePlan) } : r
      ),
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
    toast("Music link set", `${provider === "youtube" ? "YouTube Music" : "Apple Music"} search link added.`, "success");
  };

  const openContestRunMusicLink = (run) => {
    const url = normalizeExternalUrl(run?.musicUrl || "");
    if (!isOpenableExternalUrl(url)) {
      toast("Invalid music link", "Add a full URL (YouTube Music or Apple Music).", "warn");
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
          trickAssist: f.type?.startsWith("video/") ? normalizeTrickAssist({}, f.name) : undefined,
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

  const contestRunClipOptions = (run) => {
    const runClips = toArray(run?.media)
      .filter((m) => String(m?.type || "").startsWith("video/"))
      .map((m) => ({ key: `run:${m.id}`, label: `Run Upload • ${m.name || m.id}`, media: m }));
    const sessionClips = coachStudentVideoClips.map((clip) => ({
      key: `session:${clip.sessionId}:${clip.mediaId}`,
      label: `Session • ${clip.date || "No date"} • ${clip.dayType || "Session"}${clip.trickLabel ? ` • ${clip.trickLabel}` : ""}`,
      media: clip.media,
    }));
    const coachClips = coachDemoVideoClips.map((clip) => ({
      key: `coach:${clip.itemId}:${clip.mediaId}`,
      label: `Coach Demo • ${clip.title}`,
      media: clip.media,
    }));
    return [...runClips, ...sessionClips, ...coachClips].slice(0, 400);
  };

  const parseContestClipSource = (sourceKey) => {
    const raw = String(sourceKey || "");
    if (!raw) return null;
    const parts = raw.split(":");
    if (parts[0] === "run" && parts[1]) return { type: "run", mediaId: parts[1] };
    if (parts[0] === "session" && parts[1] && parts[2]) return { type: "session", sessionId: parts[1], mediaId: parts[2] };
    if (parts[0] === "coach" && parts[1] && parts[2]) return { type: "coach", itemId: parts[1], mediaId: parts[2] };
    return null;
  };

  const contestClipFromSource = (run, sourceKey) => {
    const parsed = parseContestClipSource(sourceKey);
    if (!parsed) return null;
    if (parsed.type === "run") {
      const media = toArray(run?.media).find((m) => m.id === parsed.mediaId);
      if (!media) return null;
      return { media, label: `Run Upload • ${media.name || media.id}` };
    }
    if (parsed.type === "session") {
      const session = sessions.find((s) => s.id === parsed.sessionId);
      const media = toArray(session?.media).find((m) => m.id === parsed.mediaId);
      if (!media) return null;
      return { media, label: `Session • ${session?.date || "No date"}` };
    }
    const demo = activeCoachItems.find((item) => item.id === parsed.itemId);
    const media = toArray(demo?.media).find((m) => m.id === parsed.mediaId);
    if (!media) return null;
    return { media, label: `Coach Demo • ${demo?.title || "Demo"}` };
  };

  const lineSegmentDurationSec = (seg) => {
    const start = Math.max(0, Number(seg?.startSec) || 0);
    const end = Math.max(start + 0.1, Number(seg?.endSec) || start + 3);
    return Math.max(0.1, end - start);
  };

  const linePlanTotalSec = (run) => toArray(run?.linePlan).reduce((sum, seg) => sum + lineSegmentDurationSec(seg), 0);

  const addContestLineSegment = (runId, sourceKey = "") => {
    const run = (contestState.runs || []).find((r) => r.id === runId);
    if (!run) return;
    const options = contestRunClipOptions(run);
    const selected = options.find((x) => x.key === sourceKey) || options[0];
    if (!selected) {
      toast("No source clips", "Upload a run video or use session/coach clips first.", "warn");
      return;
    }
    const nextSeg = {
      id: `ln-${uid()}`,
      sourceKey: selected.key,
      title: selected.label,
      startSec: 0,
      endSec: 3,
      note: "",
    };
    updateContestRun(runId, { linePlan: [...toArray(run.linePlan), nextSeg] });
  };

  const updateContestLineSegment = (runId, segmentId, patch = {}) => {
    const run = (contestState.runs || []).find((r) => r.id === runId);
    if (!run) return;
    updateContestRun(runId, {
      linePlan: toArray(run.linePlan).map((seg) => {
        if (seg.id !== segmentId) return seg;
        const next = { ...seg, ...toObj(patch, {}) };
        const start = Math.max(0, Number(next.startSec) || 0);
        const end = Math.max(start + 0.1, Number(next.endSec) || start + 3);
        return { ...next, startSec: start, endSec: end };
      }),
    });
  };

  const removeContestLineSegment = (runId, segmentId) => {
    const run = (contestState.runs || []).find((r) => r.id === runId);
    if (!run) return;
    updateContestRun(runId, { linePlan: toArray(run.linePlan).filter((seg) => seg.id !== segmentId) });
  };

  const moveContestLineSegment = (runId, segmentId, dir) => {
    const run = (contestState.runs || []).find((r) => r.id === runId);
    if (!run) return;
    const list = [...toArray(run.linePlan)];
    const idx = list.findIndex((seg) => seg.id === segmentId);
    if (idx < 0) return;
    const nextIdx = idx + dir;
    if (nextIdx < 0 || nextIdx >= list.length) return;
    const [item] = list.splice(idx, 1);
    list.splice(nextIdx, 0, item);
    updateContestRun(runId, { linePlan: list });
  };

  const freshSkateDayDraft = () => ({
    kind: FREE_SKATE_KIND,
    title: "Free Skate",
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
    const kind = skateDayDraft.kind === SKATE_TRIP_KIND ? SKATE_TRIP_KIND : FREE_SKATE_KIND;
    const defaultTitle = kind === SKATE_TRIP_KIND ? "Skate Trip" : "Free Skate";
    const next = {
      id: `sd-${uid()}`,
      kind,
      title: String(skateDayDraft.title || defaultTitle).trim(),
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
    toast(kind === SKATE_TRIP_KIND ? "Skate trip created" : "Free skate created", `${next.dateISO}${next.park ? ` • ${next.park}` : ""}`, "success");
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
    if (!confirm("Delete this free skate/skate trip entry?")) return;
    const found = activeSkateDays.find((d) => d.id === entryId);
    if (found?.media?.length) for (const m of found.media) if (m?.url) safeRevokeObjectURL(m.url);
    setSkateDaysForActiveSkater(activeSkateDays.filter((d) => d.id !== entryId));
    toast("Entry removed", "Free skate/skate trip deleted.", "warn");
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
      toast("No entry media added", "Files were invalid, too large, or unsupported.", "warn");
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
          trickAssist: f.type?.startsWith("video/") ? normalizeTrickAssist({}, f.name) : undefined,
        };
      })
    );
    updateSkateDayEntry(entryId, { media: [...(entry.media || []), ...media] });
    toast("Entry media added", `${media.length} item(s) uploaded.`, "success");
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
    addCheck(
      "skaters_present",
      `${participantPluralLabel} exist`,
      skaterIds.length ? "pass" : "fail",
      skaterIds.length ? `${skaterIds.length} ${participantLabelLower}(s)` : `No ${participantPluralLabelLower} found`
    );
    addCheck(
      "unique_member_ids",
      "Member IDs unique",
      dupMemberCount ? "fail" : "pass",
      dupMemberCount ? `${dupMemberCount} duplicate member ID(s)` : "No duplicates"
    );
    addCheck(
      "unique_skater_ids",
      `${participantLabel} IDs unique`,
      dupSkaterCount ? "fail" : "pass",
      dupSkaterCount ? `${dupSkaterCount} duplicate ${participantLabelLower} ID(s)` : "No duplicates"
    );

    const activeMemberOk = memberSet.has(String(ui2.activeMemberId || ""));
    const activeSkaterOk = skaterSet.has(String(ui2.activeSkaterId || ""));
    addCheck("active_member", "Active member is valid", activeMemberOk ? "pass" : "warn", activeMemberOk ? String(ui2.activeMemberId || "") : "Active member missing");
    addCheck(
      "active_skater",
      `Active ${participantLabelLower} is valid`,
      activeSkaterOk ? "pass" : "warn",
      activeSkaterOk ? String(ui2.activeSkaterId || "") : `Active ${participantLabelLower} missing`
    );

    addCheck(
      "ui_view_valid",
      "UI tab value is valid",
      VALID_VIEWS.has(String(ui2.view || "")) ? "pass" : "warn",
      `View: ${String(ui2.view || "(missing)")}`
    );

    const draftDayValue = String(draft2.dayType || "");
    const draftDayExists = draftDayValue === MEDIA_DAY_LABEL || !!plans2[draftDayValue];
    addCheck(
      "draft_day_type",
      "Draft day type exists in plans/media day",
      draftDayExists ? "pass" : "warn",
      draftDayExists ? draftDayValue : `Missing day type: ${String(draft2.dayType || "(empty)")}`
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
      `Sessions reference valid ${participantPluralLabelLower}`,
      sessionMissingSkater ? "warn" : "pass",
      sessionMissingSkater ? `${sessionMissingSkater} session(s) reference missing ${participantLabelLower} IDs` : "All linked"
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
      `XP map keys match ${participantPluralLabelLower}`,
      unknownXPKeys.length ? "warn" : "pass",
      unknownXPKeys.length ? `${unknownXPKeys.length} orphan XP key(s)` : "XP map clean"
    );

    const unknownContestKeys = Object.keys(contestBySkater2).filter((k) => !skaterSet.has(String(k)));
    const unknownCoachKeys = Object.keys(coachBySkater2).filter((k) => !skaterSet.has(String(k)));
    const unknownSkateDayKeys = Object.keys(skateDaysBySkater2).filter((k) => !skaterSet.has(String(k)));
    addCheck(
      "contest_keys",
      `Contest map keys match ${participantPluralLabelLower}`,
      unknownContestKeys.length ? "warn" : "pass",
      unknownContestKeys.length ? `${unknownContestKeys.length} orphan contest key(s)` : "Contest map clean"
    );
    addCheck(
      "coach_keys",
      `Coach map keys match ${participantPluralLabelLower}`,
      unknownCoachKeys.length ? "warn" : "pass",
      unknownCoachKeys.length ? `${unknownCoachKeys.length} orphan coach key(s)` : "Coach map clean"
    );
    addCheck(
      "skateday_keys",
      `Skate day map keys match ${participantPluralLabelLower}`,
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
    downloadTextFile(`${APP_FILE_PREFIX}-health-${todayISO()}.json`, JSON.stringify(healthReport, null, 2), "application/json");
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
    if (isMediaDayDraft && !draftMedia.length) {
      toast("Add media first", "Media Day cards need at least one photo or video.", "warn");
      return;
    }

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
        isMediaDayDraft ? "New media day card saved" : "New practice saved",
        `${activeSkater.name} • ${draft.dayType}${isMediaDayDraft ? "" : ` • ${pct2}%${freePlayEarned ? " • Free play earned" : ""}`} • +${gainedXP} XP`,
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
    const name = prompt(`${participantLabel} name:`);
    if (!name) return;
    const next = { id: `s-${uid()}`, name: name.trim(), photoUrl: "" };
    const defaultSport = "skate";
    const nextPlansForSkater = {
      [defaultSport]: defaultPlansForSport(defaultSport),
    };
    setSlice({
      skaters: [...skaters, next],
      trainingSportBySkaterId: {
        ...trainingSportBySkaterId,
        [next.id]: defaultSport,
      },
      primarySportBySkaterId: {
        ...primarySportBySkaterId,
        [next.id]: defaultSport,
      },
      sportPackageBySkaterId: {
        ...sportPackageBySkaterId,
        [next.id]: SPORT_PACKAGE_SINGLE,
      },
      plansBySportBySkaterId: {
        ...plansBySportBySkaterId,
        [next.id]: nextPlansForSkater,
      },
      trickProfileBySkaterId: {
        ...trickProfileBySkaterId,
        [next.id]: createDefaultTrickProfile(),
      },
      academyBySkaterId: {
        ...academyBySkaterId,
        [next.id]: createDefaultAcademyState(),
      },
      plans: nextPlansForSkater[defaultSport],
      ui: { ...ui, activeSkaterId: next.id },
    });
    toast(`${participantLabel} added`, `${next.name} added.`, "success");
  };

  const renameSkater = (skater) => {
    const name = prompt(`Rename ${participantLabelLower}:`, skater.name);
    if (!name) return;
    const nextName = name.trim();
    setSlice({
      skaters: skaters.map((s) => (s.id === skater.id ? { ...s, name: nextName } : s)),
      sessions: sessions.map((sess) => (sess.skaterId === skater.id ? { ...sess, skaterName: nextName } : sess)),
    });
    toast(`${participantLabel} renamed`, `Updated to ${nextName}.`, "info");
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
      trickProfileBySkaterId: Object.fromEntries(Object.entries(trickProfileBySkaterId).filter(([k]) => k !== skater.id)),
      academyBySkaterId: Object.fromEntries(Object.entries(academyBySkaterId).filter(([k]) => k !== skater.id)),
      trainingSportBySkaterId: Object.fromEntries(Object.entries(trainingSportBySkaterId).filter(([k]) => k !== skater.id)),
      primarySportBySkaterId: Object.fromEntries(Object.entries(primarySportBySkaterId).filter(([k]) => k !== skater.id)),
      sportPackageBySkaterId: Object.fromEntries(Object.entries(sportPackageBySkaterId).filter(([k]) => k !== skater.id)),
      plansBySportBySkaterId: Object.fromEntries(Object.entries(plansBySportBySkaterId).filter(([k]) => k !== skater.id)),
      proFeedback: {
        ...proFeedback,
        requestsBySkaterId: Object.fromEntries(Object.entries(proFeedbackRequestsBySkaterId).filter(([k]) => k !== skater.id)),
      },
      ui: {
        ...ui,
        activeSkaterId:
          ui.activeSkaterId === skater.id ? (skaters.find((s) => s.id !== skater.id)?.id || skaters[0]?.id) : ui.activeSkaterId,
      },
    });
    toast(`${participantLabel} removed`, `${skater.name} removed.`, "warn");
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

  const [newPlanDayName, setNewPlanDayName] = useState("");
  const [planDayNameDrafts, setPlanDayNameDrafts] = useState({});
  const [newTaskDraftByDay, setNewTaskDraftByDay] = useState({});
  const canUseMultiSportPackage = activeSportPackage === SPORT_PACKAGE_MULTI;
  const [sportTemplatePick, setSportTemplatePick] = useState(activeSportKey);

  useEffect(() => {
    setSportTemplatePick(activeSportKey);
  }, [activeSportKey, ui.activeSkaterId]);

  useEffect(() => {
    const keys = Object.keys(plans || {});
    setPlanDayNameDrafts((prev) => {
      const next = {};
      let changed = false;
      for (const key of keys) {
        const v = String(prev?.[key] || key);
        next[key] = v;
        if (v !== String(prev?.[key] || "")) changed = true;
      }
      if (Object.keys(prev || {}).length !== keys.length) changed = true;
      return changed ? next : prev;
    });
    setNewTaskDraftByDay((prev) => {
      const next = {};
      let changed = false;
      for (const key of keys) {
        const row = toObj(prev?.[key], {});
        next[key] = {
          label: String(row.label || ""),
          target: String(row.target || ""),
          notes: String(row.notes || ""),
        };
        if (!prev?.[key]) changed = true;
      }
      if (Object.keys(prev || {}).length !== keys.length) changed = true;
      return changed ? next : prev;
    });
  }, [plans]);

  const writePlansForSport = (nextPlanMap, opts = {}) => {
    if (!activeSkaterId) return;
    const targetSportKey = normalizeSportKey(opts.sportKey || activeSportKey, primarySportKey);
    const normalizedNextPlans = normalizePlansMap(nextPlanMap, {});
    const currentBySport = toObj(plansBySportBySkaterId?.[activeSkaterId], {});
    const nextBySport = {
      ...currentBySport,
      [targetSportKey]: normalizedNextPlans,
    };
    const nextDraftDayType = resolveDraftDayTypeForPlans(normalizedNextPlans, opts.nextDayType ?? draft.dayType);
    setSlice({
      ...(toObj(opts.extraPatch, {})),
      plansBySportBySkaterId: {
        ...plansBySportBySkaterId,
        [activeSkaterId]: nextBySport,
      },
      plans: normalizedNextPlans,
      draft: { ...draft, dayType: nextDraftDayType },
    });
  };

  const setSportPackageForActiveSkater = (packageTierRaw) => {
    if (!activeSkaterId) return;
    const nextPackage = normalizeSportPackage(packageTierRaw, SPORT_PACKAGE_SINGLE);
    if (nextPackage === activeSportPackage) return;
    const currentBySport = toObj(plansBySportBySkaterId?.[activeSkaterId], {});
    const nextPrimarySport = normalizeSportKey(primarySportBySkaterId?.[activeSkaterId] || activeSportKey, "skate");
    const nextSelectedSport = nextPackage === SPORT_PACKAGE_MULTI ? activeSportKey : nextPrimarySport;
    const nextBySport = { ...currentBySport };
    if (!nextBySport[nextPrimarySport]) nextBySport[nextPrimarySport] = defaultPlansForSport(nextPrimarySport);
    if (!nextBySport[nextSelectedSport]) nextBySport[nextSelectedSport] = defaultPlansForSport(nextSelectedSport);
    const nextPlans = normalizePlansMap(nextBySport[nextSelectedSport], DEFAULT_PLANS);
    const nextDayType = resolveDraftDayTypeForPlans(nextPlans, draft.dayType);
    setSlice({
      sportPackageBySkaterId: {
        ...sportPackageBySkaterId,
        [activeSkaterId]: nextPackage,
      },
      primarySportBySkaterId: {
        ...primarySportBySkaterId,
        [activeSkaterId]: nextPrimarySport,
      },
      trainingSportBySkaterId: {
        ...trainingSportBySkaterId,
        [activeSkaterId]: nextSelectedSport,
      },
      plansBySportBySkaterId: {
        ...plansBySportBySkaterId,
        [activeSkaterId]: nextBySport,
      },
      plans: nextPlans,
      draft: { ...draft, dayType: nextDayType },
    });
    toast(
      nextPackage === SPORT_PACKAGE_MULTI ? "Multi-sport unlocked" : "Single-sport package active",
      nextPackage === SPORT_PACKAGE_MULTI
        ? `This ${participantLabelLower} can now keep separate plans for multiple sports.`
        : `${sportLabelFromKey(nextPrimarySport)} remains active. Upgrade to multi package for multiple sports.`,
      "info"
    );
  };

  const setPrimarySportForActiveSkater = (sportKey) => {
    if (!activeSkaterId) return;
    if (!TRAINING_SPORT_OPTIONS.some((s) => s.key === sportKey)) return;
    const currentBySport = toObj(plansBySportBySkaterId?.[activeSkaterId], {});
    const nextBySport = {
      ...currentBySport,
      [sportKey]: currentBySport[sportKey] ? normalizePlansMap(currentBySport[sportKey], DEFAULT_PLANS) : defaultPlansForSport(sportKey),
    };
    const nextSelectedSport = canUseMultiSportPackage ? activeSportKey : sportKey;
    if (!nextBySport[nextSelectedSport]) {
      nextBySport[nextSelectedSport] = defaultPlansForSport(nextSelectedSport);
    }
    const nextPlans = normalizePlansMap(nextBySport[nextSelectedSport], DEFAULT_PLANS);
    setSlice({
      primarySportBySkaterId: {
        ...primarySportBySkaterId,
        [activeSkaterId]: sportKey,
      },
      trainingSportBySkaterId: {
        ...trainingSportBySkaterId,
        [activeSkaterId]: nextSelectedSport,
      },
      plansBySportBySkaterId: {
        ...plansBySportBySkaterId,
        [activeSkaterId]: nextBySport,
      },
      plans: nextPlans,
      draft: { ...draft, dayType: resolveDraftDayTypeForPlans(nextPlans, draft.dayType) },
    });
  };

  const setActiveTrainingSport = (sportKey) => {
    if (!TRAINING_SPORT_OPTIONS.some((s) => s.key === sportKey)) return false;
    if (!canUseMultiSportPackage && sportKey !== primarySportKey) {
      toast("Multi package required", `Upgrade this ${participantLabelLower} to multi package to use more than one sport.`, "warn");
      return false;
    }
    const currentBySport = toObj(plansBySportBySkaterId?.[activeSkaterId], {});
    const nextBySport = {
      ...currentBySport,
      [sportKey]: currentBySport[sportKey] ? normalizePlansMap(currentBySport[sportKey], DEFAULT_PLANS) : defaultPlansForSport(sportKey),
    };
    const nextPlans = normalizePlansMap(nextBySport[sportKey], DEFAULT_PLANS);
    setSlice({
      trainingSportBySkaterId: {
        ...trainingSportBySkaterId,
        [activeSkaterId]: sportKey,
      },
      plansBySportBySkaterId: {
        ...plansBySportBySkaterId,
        [activeSkaterId]: nextBySport,
      },
      plans: nextPlans,
      draft: { ...draft, dayType: resolveDraftDayTypeForPlans(nextPlans, draft.dayType) },
    });
    return true;
  };

  const importSportPlanSections = (sportKey, mode = "append") => {
    if (!TRAINING_SPORT_OPTIONS.some((s) => s.key === sportKey)) return;
    if (!canUseMultiSportPackage && sportKey !== primarySportKey) {
      toast("Multi package required", `Upgrade this ${participantLabelLower} to multi package to import extra sport sections.`, "warn");
      return;
    }
    const currentBySport = toObj(plansBySportBySkaterId?.[activeSkaterId], {});
    const sourcePlans = currentBySport[sportKey] ? normalizePlansMap(currentBySport[sportKey], {}) : defaultPlansForSport(sportKey);
    const base = mode === "replace" ? {} : { ...sourcePlans };
    const incoming = buildSportPlanSections(sportKey, { prefixDays: true });
    const nextPlans = { ...base };
    for (const [rawName, tasks] of Object.entries(incoming)) {
      let dayName = rawName;
      let copyNo = 2;
      while (nextPlans[dayName]) {
        dayName = `${rawName} (${copyNo})`;
        copyNo += 1;
      }
      nextPlans[dayName] = tasks;
    }
    writePlansForSport(nextPlans, {
      sportKey,
      nextDayType: Object.keys(nextPlans)[0] || draft.dayType || "Training Day",
      extraPatch: {
        trainingSportBySkaterId: {
          ...trainingSportBySkaterId,
          [activeSkaterId]: sportKey,
        },
      },
    });
    const sportLabel = sportLabelFromKey(sportKey);
    toast(
      mode === "replace" ? "Training plan replaced" : "Training sections added",
      `${sportLabel} • ${Object.keys(incoming).length} section(s)`,
      "success"
    );
  };

  const addDayType = (nameRaw = "") => {
    const key = String(nameRaw || newPlanDayName).trim();
    if (!key) {
      toast("Missing day name", "Enter a day type name first.", "warn");
      return;
    }
    if (plans[key]) {
      toast("Day exists", "That day type already exists.", "warn");
      return;
    }
    writePlansForSport({ ...plans, [key]: [] }, { nextDayType: key });
    setNewPlanDayName("");
    toast("Plan added", `New day type: ${key}`, "success");
  };

  const renameDayType = (oldName, nextNameRaw = "") => {
    const key = String(nextNameRaw || oldName).trim();
    if (!key) return;
    if (key === oldName) return;
    if (plans[key]) {
      toast("Day exists", "Pick a unique day type name.", "warn");
      return;
    }
    const copy = { ...plans };
    const tasks2 = copy[oldName] || [];
    delete copy[oldName];
    copy[key] = tasks2;
    writePlansForSport(copy, { nextDayType: draft.dayType === oldName ? key : draft.dayType });
    setPlanDayNameDrafts((prev) => {
      const next = { ...prev };
      delete next[oldName];
      next[key] = key;
      return next;
    });
    toast("Plan renamed", `${oldName} → ${key}`, "info");
  };

  const deleteDayType = (name) => {
    if (!confirm(`Delete "${name}"?`)) return;
    const copy = { ...plans };
    delete copy[name];
    writePlansForSport(copy, { nextDayType: draft.dayType === name ? Object.keys(copy)[0] || "Grind Day" : draft.dayType });
    toast("Plan deleted", `${name} removed.`, "warn");
  };

  const updatePlanTask = (dayName, taskId, patch) => {
    writePlansForSport({
      ...plans,
      [dayName]: (plans[dayName] || []).map((t) =>
        t.id === taskId
          ? {
              ...t,
              ...patch,
              label: String((patch?.label ?? t.label) || ""),
              target: Math.max(0, Number(patch?.target ?? t.target) || 0),
              notes: String((patch?.notes ?? t.notes) || ""),
            }
          : t
      ),
    });
  };
  const applyCatalogTrickToTask = (dayName, taskId, trickNameRaw = "") => {
    const trickName = String(trickNameRaw || "").trim();
    if (!trickName) return;
    updatePlanTask(dayName, taskId, { label: trickName });
  };

  const setNewTaskDraftField = (dayName, field, value) => {
    setNewTaskDraftByDay((prev) => ({
      ...prev,
      [dayName]: {
        ...toObj(prev?.[dayName], {}),
        [field]: value,
      },
    }));
  };
  const applyCatalogTrickToNewTask = (dayName, trickNameRaw = "") => {
    const trickName = String(trickNameRaw || "").trim();
    if (!trickName) return;
    setNewTaskDraftField(dayName, "label", trickName);
  };

  const addTaskToDay = (dayName) => {
    const row = toObj(newTaskDraftByDay?.[dayName], {});
    const label = String(row.label || "").trim();
    if (!label) {
      toast("Missing task", "Add a task name before saving.", "warn");
      return;
    }
    const target = Math.max(0, Number(row.target) || 0);
    const notes = String(row.notes || "").trim();
    writePlansForSport({
      ...plans,
      [dayName]: [...(plans[dayName] || []), { id: `t-${uid()}`, label, target, notes }],
    });
    setNewTaskDraftByDay((prev) => ({
      ...prev,
      [dayName]: { label: "", target: "", notes: "" },
    }));
    toast("Task added", `${label} (${dayName})`, "success");
  };

  const deleteTask = (dayName, taskId) => {
    if (!confirm("Delete this task?")) return;
    writePlansForSport({ ...plans, [dayName]: (plans[dayName] || []).filter((t) => t.id !== taskId) });
    toast("Task removed", "Task deleted.", "warn");
  };

  const updateProFeedback = (patch) => {
    setSlice({
      proFeedback: {
        ...proFeedback,
        ...patch,
      },
    });
  };

  const setProFeedbackRequestsForSkater = (skaterId, nextList) => {
    const key = String(skaterId || "");
    if (!key) return;
    updateProFeedback({
      requestsBySkaterId: {
        ...proFeedbackRequestsBySkaterId,
        [key]: toArray(nextList),
      },
    });
  };

  const submitProFeedbackRequest = () => {
    if (!activeSkater) return;
    if (!proFeedbackAvailable) {
      toast("Pro feedback unavailable", "This section is currently off or not on the skateboarding profile.", "warn");
      return;
    }
    const title = String(proFeedbackDraft.title || "").trim();
    const question = String(proFeedbackDraft.question || "").trim();
    if (!title && !question) {
      toast("Add details", "Enter a title or question for the pro reviewer.", "warn");
      return;
    }
    const clipUrl = normalizeExternalUrl(proFeedbackDraft.clipUrl || "");
    const preferredResponse = String(proFeedbackDraft.preferredResponse || "").trim();
    const paymentDetails = buildProFeedbackPaymentDetails(
      proFeedback,
      proFeedbackPriceUsd,
      `${activeSkater?.name || "Skater"} - ${title || "Pro Feedback Request"}`
    );
    const next = {
      id: `pfr-${uid()}`,
      skaterId: activeSkater.id,
      skaterName: activeSkater.name,
      sportKey: activeSportKey,
      title: title || "General Feedback Request",
      question,
      clipUrl,
      preferredResponse,
      requestedBy: String(activeMember?.name || ""),
      requestedByRole: String(activeMember?.role || ""),
      chargeUsd: proFeedbackPriceUsd,
      ownerShareUsd: proFeedbackOwnerShareUsd,
      paymentStatus: "unpaid",
      paymentProvider: paymentDetails.provider,
      paymentUrl: paymentDetails.url,
      payoutStatus: "pending",
      payoutSentAt: "",
      payoutSentById: "",
      payoutSentByName: "",
      status: "pending",
      proReply: "",
      reviewedById: "",
      reviewedByName: "",
      reviewedAt: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const current = toArray(proFeedbackRequestsBySkaterId[activeSkater.id]);
    setProFeedbackRequestsForSkater(activeSkater.id, [next, ...current].slice(0, 200));
    setProFeedbackDraft({ title: "", question: "", clipUrl: "", preferredResponse: "Video breakdown" });
    toast(
      "Pro feedback request saved",
      paymentDetails.url
        ? `Charge $${proFeedbackPriceUsd}: $${proFeedbackOwnerShareUsd} owner / $${proFeedbackProShareUsd} pro. Pay to owner first, then weekly payout.`
        : `Charge set to $${proFeedbackPriceUsd}. Add PayPal in Settings to attach a payment link.`,
      paymentDetails.url ? "success" : "warn"
    );
  };

  const patchProFeedbackRequest = (requestId, patch, skaterIdOverride = "") => {
    const requestSkaterId = String(skaterIdOverride || activeSkater?.id || "");
    if (!requestSkaterId) return;
    const current = toArray(proFeedbackRequestsBySkaterId[requestSkaterId]);
    const nextUpdatedAt = new Date().toISOString();
    setProFeedbackRequestsForSkater(
      requestSkaterId,
      current.map((item) => {
        if (item.id !== requestId) return item;
        const paymentRaw = String(patch?.paymentStatus ?? item?.paymentStatus ?? "").toLowerCase();
        const statusRaw = String(patch?.status ?? item?.status ?? "").toLowerCase();
        const payoutRaw = String(patch?.payoutStatus ?? item?.payoutStatus ?? "").toLowerCase();
        const nextItem = {
          ...item,
          ...patch,
          paymentStatus: paymentRaw === "paid" ? "paid" : "unpaid",
          payoutStatus: payoutRaw === "sent" ? "sent" : "pending",
          status: ["pending", "in-review", "delivered", "closed"].includes(statusRaw) ? statusRaw : "pending",
          updatedAt: nextUpdatedAt,
        };
        if (Object.prototype.hasOwnProperty.call(toObj(patch, {}), "payoutStatus")) {
          if (payoutRaw === "sent") {
            nextItem.payoutSentAt = nextUpdatedAt;
            nextItem.payoutSentById = String(activeMember?.id || item?.payoutSentById || "");
            nextItem.payoutSentByName = String(activeMember?.name || item?.payoutSentByName || "");
          } else {
            nextItem.payoutSentAt = "";
            nextItem.payoutSentById = "";
            nextItem.payoutSentByName = "";
          }
        }
        if (Object.prototype.hasOwnProperty.call(toObj(patch, {}), "proReply")) {
          nextItem.reviewedById = String(activeMember?.id || item?.reviewedById || "");
          nextItem.reviewedByName = String(activeMember?.name || item?.reviewedByName || "");
          nextItem.reviewedAt = nextUpdatedAt;
        }
        return nextItem;
      })
    );
  };

  const removeProFeedbackRequest = (requestId, skaterIdOverride = "") => {
    const requestSkaterId = String(skaterIdOverride || activeSkater?.id || "");
    if (!requestSkaterId) return;
    if (!confirm("Delete this pro feedback request?")) return;
    const current = toArray(proFeedbackRequestsBySkaterId[requestSkaterId]);
    setProFeedbackRequestsForSkater(
      requestSkaterId,
      current.filter((item) => item.id !== requestId)
    );
    toast("Request removed", "Pro feedback request deleted.", "warn");
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
            new Notification(`${APP_NAME} Reminder`, {
              body: `${ev.title || "Practice"} • ${ev.dateISO} ${formatStandardTime(ev.time, uiLocale)}${ev.park ? ` • ${ev.park}` : ""} (${ev.skaterName || activeSkater?.name || participantLabel})`,
            });
          } catch {
            // ignore notification failures
          }
        }
      }
    }, 30000);
    return () => window.clearInterval(timerId);
  }, [reminders.enabled, activePracticeEvents, practiceSettings.remindMin, activeSkater?.name, participantLabel]);

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
    new Notification(APP_NAME, { body: "Reminders enabled. Tip: Calendar events are most reliable." });
    toast("Notifications enabled", "Browser alerts allowed.", "success");
  };

  const createPracticeEvent = (dateOverride = draft.date, opts = {}) => {
    if (!activeSkater) return;
    const safeDate = isValidISODate(String(dateOverride || "")) ? String(dateOverride) : todayISO();
    const safeTime = isValidTimeHHMM(String(reminders.time || "")) ? String(reminders.time) : "17:00";
    const selectedParkName = String(practiceSettings.park || draft.park || selectedParkProfile?.name || "").trim();
    const ev = {
      id: `pe-${uid()}`,
      dateISO: safeDate,
      time: safeTime,
      durationMin: Number(practiceSettings.durationMin) || 60,
      remindMin: Number(practiceSettings.remindMin) || 60,
      title: practiceSettings.title || APP_PRACTICE_TITLE,
      park: selectedParkName,
      notes: `${participantLabel}: ${activeSkater.name}\nDay: ${draft.dayType}\nPark: ${selectedParkName}`,
      skaterId: activeSkater.id,
      skaterName: activeSkater.name,
      createdAt: new Date().toISOString(),
    };
    setSlice({ practiceEvents: [ev, ...practiceEvents].slice(0, 50) });
    if (opts.downloadICS !== false) {
      if (reminderExportBusyRef.current) {
        toast("Reminder in progress", "Please wait a second and try again.", "warn");
        return ev;
      }
      reminderExportBusyRef.current = true;
      const downloaded = exportICSPractice(ev.dateISO, ev.title, ev.notes, {
        time: ev.time,
        durationMin: ev.durationMin,
        remindMin: ev.remindMin,
        location: ev.park,
      });
      window.setTimeout(() => {
        reminderExportBusyRef.current = false;
      }, 800);
      if (downloaded) {
        toast("Calendar event ready", `${ev.dateISO} ${formatStandardTime(ev.time, uiLocale)} • reminder ${ev.remindMin}m`, "success");
      } else {
        toast("Calendar export failed", "Could not create calendar file on this browser.", "warn");
      }
      return ev;
    }
    toast("Practice scheduled", `${ev.dateISO} ${formatStandardTime(ev.time, uiLocale)} • reminder ${ev.remindMin}m`, "success");
    return ev;
  };

  const addPracticeToCalendar = (dateOverride = draft.date) => {
    if (!activeSkater) return;
    const safeDate = isValidISODate(String(dateOverride || "")) ? String(dateOverride) : todayISO();
    const safeTime = isValidTimeHHMM(String(reminders.time || "")) ? String(reminders.time) : "17:00";
    const selectedParkName = String(practiceSettings.park || draft.park || selectedParkProfile?.name || "").trim();
    const selectedTitle = String(practiceSettings.title || APP_PRACTICE_TITLE).trim();
    const existing = toArray(practiceEvents).find((ev) => {
      const evSkaterId = String(ev?.skaterId || "");
      const skaterMatch = !evSkaterId || evSkaterId === activeSkater.id;
      return (
        skaterMatch &&
        String(ev?.dateISO || "") === safeDate &&
        String(ev?.time || "") === safeTime &&
        String(ev?.title || "").trim() === selectedTitle &&
        String(ev?.park || "").trim() === selectedParkName
      );
    });
    if (existing) {
      exportPracticeEvent(existing);
      toast("Reminder refreshed", "Used your existing matching practice event.", "info");
      return;
    }
    createPracticeEvent(safeDate, { downloadICS: true });
  };

  const exportPracticeEvent = (ev) => {
    if (reminderExportBusyRef.current) {
      toast("Reminder in progress", "Please wait a second and try again.", "warn");
      return;
    }
    reminderExportBusyRef.current = true;
    const downloaded = exportICSPractice(ev.dateISO, ev.title, ev.notes, {
      time: ev.time,
      durationMin: ev.durationMin,
      remindMin: ev.remindMin,
      location: ev.park,
    });
    window.setTimeout(() => {
      reminderExportBusyRef.current = false;
    }, 800);
    if (downloaded) {
      toast("iCal ready", `${ev.dateISO} ${formatStandardTime(ev.time, uiLocale)}`, "success");
    } else {
      toast("iCal failed", "Could not create calendar file on this browser.", "warn");
    }
  };

  const openPracticeEditor = (ev) => {
    if (!ev?.id) return;
    setEditingPracticeId(ev.id);
    setPracticeEditDraft({
      dateISO: isValidISODate(ev.dateISO) ? ev.dateISO : todayISO(),
      time: isValidTimeHHMM(ev.time) ? ev.time : "17:00",
      durationMin: Math.max(5, Number(ev.durationMin) || 60),
      remindMin: Math.max(0, Number(ev.remindMin) || 60),
      title: String(ev.title || APP_PRACTICE_TITLE),
      park: String(ev.park || ""),
      notes: String(ev.notes || ""),
    });
  };

  const cancelPracticeEditor = () => {
    setEditingPracticeId("");
    setPracticeEditDraft({
      dateISO: "",
      time: "17:00",
      durationMin: 60,
      remindMin: 60,
      title: "",
      park: "",
      notes: "",
    });
  };

  const savePracticeEdit = () => {
    const eventId = String(editingPracticeId || "");
    if (!eventId) return;
    const safeDate = isValidISODate(practiceEditDraft.dateISO) ? practiceEditDraft.dateISO : todayISO();
    const safeTime = isValidTimeHHMM(practiceEditDraft.time) ? practiceEditDraft.time : "17:00";
    const safeDuration = Math.max(5, Number(practiceEditDraft.durationMin) || 60);
    const safeRemind = Math.max(0, Number(practiceEditDraft.remindMin) || 60);
    const safeTitle = String(practiceEditDraft.title || "").trim() || APP_PRACTICE_TITLE;
    const safePark = String(practiceEditDraft.park || "").trim();
    const safeNotes = String(practiceEditDraft.notes || "").trim();
    setSlice({
      practiceEvents: practiceEvents.map((ev) =>
        ev.id === eventId
          ? {
              ...ev,
              dateISO: safeDate,
              time: safeTime,
              durationMin: safeDuration,
              remindMin: safeRemind,
              title: safeTitle,
              park: safePark,
              notes: safeNotes,
            }
          : ev
      ),
    });
    toast("Practice updated", `${safeDate} ${formatStandardTime(safeTime, uiLocale)} saved.`, "success");
    cancelPracticeEditor();
  };

  const removePracticeEvent = (id) => {
    setSlice({ practiceEvents: practiceEvents.filter((x) => x.id !== id) });
    if (editingPracticeId === id) cancelPracticeEditor();
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
        park: practiceSettings.park,
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

  const activeSkaterSessions = useMemo(
    () => sessions.filter((s) => s.skaterId === ui.activeSkaterId),
    [sessions, ui.activeSkaterId]
  );

  const uniqueParkCount = useMemo(() => {
    const unique = new Set(
      activeSkaterSessions
        .map((s) => String(s.park || "").trim())
        .filter(Boolean)
        .map((name) => name.toLowerCase())
    );
    return unique.size;
  }, [activeSkaterSessions]);

  const chartData = useMemo(() => {
    const filtered = activeSkaterSessions
      .slice()
      .sort((a, b) => (a.date > b.date ? 1 : -1))
      .slice(-14);
    return filtered.map((s) => ({
      date: formatShortDate(s.date, uiLocale),
      pct: pct(s.totalCompleted || 0, s.totalTarget || 1),
      ovr: computeOVR(s),
      park: String(s.park || "").trim() || "Unknown Park",
    }));
  }, [activeSkaterSessions]);

  const dayTypeBars = useMemo(() => {
    const map = new Map();
    for (const s of activeSkaterSessions) {
      const p = pct(s.totalCompleted || 0, s.totalTarget || 1);
      const cur = map.get(s.dayType) || { dayType: s.dayType, sessions: 0, avg: 0 };
      cur.sessions += 1;
      cur.avg += p;
      map.set(s.dayType, cur);
    }
    return [...map.values()].map((x) => ({ ...x, avg: x.sessions ? Math.round(x.avg / x.sessions) : 0 }));
  }, [activeSkaterSessions]);

  const parkBars = useMemo(() => {
    const map = new Map();
    for (const s of activeSkaterSessions) {
      const park = String(s.park || "").trim() || "Unknown Park";
      const p = pct(s.totalCompleted || 0, s.totalTarget || 1);
      const cur = map.get(park) || { park, sessions: 0, avg: 0 };
      cur.sessions += 1;
      cur.avg += p;
      map.set(park, cur);
    }
    return [...map.values()]
      .map((x) => ({ ...x, avg: x.sessions ? Math.round(x.avg / x.sessions) : 0 }))
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 8);
  }, [activeSkaterSessions]);

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
                {m.name} ({roleDisplayLabel(m.role)})
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
  const appShellThemeClass = isLightMode ? "af-shell af-shell--light" : "af-shell af-shell--dark";
  const appShellClass = isSkaterMember
    ? isLightMode
      ? "min-h-dvh overflow-x-hidden bg-gradient-to-b from-cyan-50 via-sky-100 to-teal-100 text-slate-900"
      : "min-h-dvh overflow-x-hidden bg-gradient-to-b from-[#05121a] via-[#072438] to-[#0a1f31] text-white"
    : isLightMode
      ? "min-h-dvh overflow-x-hidden bg-slate-100 text-slate-900"
      : "min-h-dvh overflow-x-hidden bg-gradient-to-b from-black via-slate-950 to-black text-white";
  const headerShellClass = isSkaterMember
    ? isLightMode
      ? "bg-gradient-to-b from-white/95 via-cyan-50/95 to-sky-100/85 border-cyan-300/70"
      : "bg-gradient-to-b from-cyan-950/95 via-slate-950/95 to-slate-950/80 border-cyan-400/30"
    : isLightMode
      ? "bg-gradient-to-b from-white/95 to-slate-100/85 border-slate-300/70"
      : "bg-gradient-to-b from-black/95 to-black/70 border-white/10";
  const brandTextClass = isSkaterMember
    ? isLightMode
      ? "text-cyan-700"
      : "text-cyan-200/80"
    : isLightMode
      ? "text-slate-500"
      : "text-white/50";
  const buildTextClass = isSkaterMember
    ? isLightMode
      ? "text-cyan-700/80"
      : "text-cyan-200/60"
    : isLightMode
      ? "text-slate-500"
      : "text-white/40";
  const tabThemeProps = { lightMode: isLightMode, skaterMode: isSkaterMember };

  return (
    <div className={`${appShellClass} ${appShellThemeClass} transition-[background-image,background-size] duration-500`} style={appShellPersonalStyle}>
      <style>{`
        .af-shell :is(input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="file"]), select, textarea) {
          backdrop-filter: blur(5px);
        }
        .af-shell.af-shell--dark :is(input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="file"]), select, textarea) {
          background-color: rgba(2, 6, 23, 0.32);
          border-color: rgba(255, 255, 255, 0.22);
        }
        .af-shell.af-shell--light :is(input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="file"]), select, textarea) {
          background-color: rgba(255, 255, 255, 0.74);
          border-color: rgba(148, 163, 184, 0.45);
        }
      `}</style>
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
              onChange={(e) => {
                const nextPark = e.target.value;
                setSessionEdit((prev) => ({ ...prev, park: nextPark }));
                queueParkTypeahead(nextPark);
              }}
              onFocus={(e) => queueParkTypeahead(e.target.value)}
              list="park-name-list"
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

      <Modal open={videoEdit.open} title="Coach Video Editor" onClose={closeVideoEditor}>
        <div className="space-y-3">
          <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-3">
            <div className="text-sm font-semibold truncate">{videoEdit.name || "Video Clip"}</div>
            <div className="mt-1 text-xs text-white/60">
              Original: {formatDurationSec(videoEdit.durationSec)} • {formatBytes(editingVideoMedia?.size || 0)}
            </div>
            <div className="mt-1 text-xs text-cyan-200/90">
              Output: {formatDurationSec(trimmedDurationSec)} • max {videoEdit.maxDim}p • {videoEdit.fps}fps • {videoEdit.bitrateKbps} kbps
              {videoDrawStrokes.length ? ` • ${videoDrawStrokes.length} overlay stroke(s)` : ""}
              {videoStickFigure.enabled ? " • stick figure guide" : ""}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl bg-black ring-1 ring-white/10">
            <div ref={videoDrawWrapRef} className="aspect-video relative">
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
              <canvas
                ref={videoDrawCanvasRef}
                onPointerDown={handleVideoDrawPointerDown}
                onPointerMove={handleVideoDrawPointerMove}
                onPointerUp={endVideoDrawStroke}
                onPointerCancel={endVideoDrawStroke}
                className={`absolute inset-0 h-full w-full ${videoDrawEnabled ? "cursor-crosshair pointer-events-auto" : "pointer-events-none"}`}
                style={{ touchAction: "none" }}
              />
            </div>
          </div>

          <div className="rounded-2xl bg-black/30 ring-1 ring-white/10 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setVideoDrawEnabled((v) => !v)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold ring-1 ${
                  videoDrawEnabled ? "bg-cyan-500/20 ring-cyan-400/30 text-cyan-100" : "bg-white/5 ring-white/10 hover:bg-white/10"
                }`}
              >
                <Pencil className="h-3.5 w-3.5 inline-block mr-1" />
                {videoDrawEnabled ? "Drawing On" : "Draw Corrections"}
              </button>
              <button
                type="button"
                onClick={() => setVideoStickFigure((prev) => ({ ...prev, enabled: !prev.enabled }))}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold ring-1 ${
                  videoStickFigure.enabled ? "bg-amber-500/20 ring-amber-400/30 text-amber-100" : "bg-white/5 ring-white/10 hover:bg-white/10"
                }`}
              >
                {videoStickFigure.enabled ? "Stick Figure On" : "Stick Figure Guide"}
              </button>
              <button
                type="button"
                onClick={() => setVideoDrawStrokes((prev) => prev.slice(0, -1))}
                disabled={!videoDrawStrokes.length}
                className="rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/10 disabled:opacity-50"
              >
                Undo
              </button>
              <button
                type="button"
                onClick={() => setVideoDrawStrokes([])}
                disabled={!videoDrawStrokes.length}
                className="rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/10 disabled:opacity-50"
              >
                Clear
              </button>
              <span className="text-xs text-white/60">Stroke</span>
              {[2, 4, 6].map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setVideoDrawWidth(w)}
                  className={`rounded-lg px-2 py-1 text-[11px] ring-1 ${videoDrawWidth === w ? "bg-white text-black ring-white" : "bg-white/5 ring-white/10 hover:bg-white/10"}`}
                >
                  {w}px
                </button>
              ))}
              {["#f43f5e", "#22d3ee", "#f59e0b", "#ffffff"].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setVideoDrawColor(c)}
                  className={`h-6 w-6 rounded-full ring-2 ${videoDrawColor === c ? "ring-white" : "ring-white/20"}`}
                  style={{ backgroundColor: c }}
                  title={`Color ${c}`}
                />
              ))}
            </div>
            {videoStickFigure.enabled ? (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 rounded-xl bg-black/30 ring-1 ring-white/10 p-2">
                <label className="text-[11px] text-white/70">
                  Size
                  <input
                    type="range"
                    min={0.65}
                    max={1.55}
                    step={0.01}
                    value={videoStickFigure.scale}
                    onChange={(e) => setVideoStickFigure((prev) => ({ ...prev, scale: Number(e.target.value) || 1 }))}
                    className="mt-1 w-full"
                  />
                </label>
                <label className="text-[11px] text-white/70">
                  X Position
                  <input
                    type="range"
                    min={0.08}
                    max={0.92}
                    step={0.01}
                    value={videoStickFigure.x}
                    onChange={(e) => setVideoStickFigure((prev) => ({ ...prev, x: Number(e.target.value) || 0.5 }))}
                    className="mt-1 w-full"
                  />
                </label>
                <label className="text-[11px] text-white/70">
                  Y Position
                  <input
                    type="range"
                    min={0.18}
                    max={0.92}
                    step={0.01}
                    value={videoStickFigure.y}
                    onChange={(e) => setVideoStickFigure((prev) => ({ ...prev, y: Number(e.target.value) || 0.58 }))}
                    className="mt-1 w-full"
                  />
                </label>
                <label className="text-[11px] text-white/70">
                  Turn Angle
                  <input
                    type="range"
                    min={-1}
                    max={1}
                    step={0.01}
                    value={videoStickFigure.turn}
                    onChange={(e) => setVideoStickFigure((prev) => ({ ...prev, turn: Number(e.target.value) || 0 }))}
                    className="mt-1 w-full"
                  />
                </label>
                <label className="text-[11px] text-white/70">
                  Leg Bend
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={videoStickFigure.bend}
                    onChange={(e) => setVideoStickFigure((prev) => ({ ...prev, bend: Number(e.target.value) || 0 }))}
                    className="mt-1 w-full"
                  />
                </label>
                <label className="text-[11px] text-white/70">
                  Opacity
                  <input
                    type="range"
                    min={0.2}
                    max={1}
                    step={0.01}
                    value={videoStickFigure.opacity}
                    onChange={(e) => setVideoStickFigure((prev) => ({ ...prev, opacity: Number(e.target.value) || 0.84 }))}
                    className="mt-1 w-full"
                  />
                </label>
                <div className="sm:col-span-2 lg:col-span-4 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] text-white/60">Trick Preset</span>
                  <select
                    value={videoStickPresetKey}
                    onChange={(e) => setVideoStickPresetKey(e.target.value)}
                    className="min-w-[220px] rounded-lg bg-black/40 border border-white/10 px-2 py-1 text-[11px]"
                  >
                    {STICK_FIGURE_PRESET_OPTIONS.map((preset) => (
                      <option key={`vsp-opt-${preset.key}`} value={preset.key}>
                        {preset.group ? `${preset.group} • ` : ""}{preset.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => applyVideoStickPreset(videoStickPresetKey)}
                    className="rounded-lg bg-cyan-500/20 ring-1 ring-cyan-400/30 px-2 py-1 text-[11px] font-semibold text-cyan-100 hover:bg-cyan-500/30"
                  >
                    Apply
                  </button>
                  {STICK_FIGURE_QUICK_PRESET_KEYS.map((key) => (
                    <button
                      key={`vsp-quick-${key}`}
                      type="button"
                      onClick={() => {
                        setVideoStickPresetKey(key);
                        applyVideoStickPreset(key);
                      }}
                      className="rounded-lg bg-white/5 ring-1 ring-white/10 px-2 py-1 text-[11px] font-semibold hover:bg-white/10"
                    >
                      {STICK_FIGURE_PRESET_LABELS[key] || key}
                    </button>
                  ))}
                </div>
                <div className="sm:col-span-2 lg:col-span-4 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] text-white/60">Guide Color</span>
                  {["#22d3ee", "#f59e0b", "#f43f5e", "#ffffff"].map((c) => (
                    <button
                      key={`fig-${c}`}
                      type="button"
                      onClick={() => setVideoStickFigure((prev) => ({ ...prev, color: c }))}
                      className={`h-6 w-6 rounded-full ring-2 ${videoStickFigure.color === c ? "ring-white" : "ring-white/20"}`}
                      style={{ backgroundColor: c }}
                      title={`Guide color ${c}`}
                    />
                  ))}
                </div>
              </div>
            ) : null}
            <div className="mt-2 text-[11px] text-white/60">
              Turn drawing on to mark movement. For vert/bowl, use Turn Angle + Leg Bend to line up shoulders, arms/hands, and legs during carves and turns.
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
            headerShellClass
          }
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className={`text-[11px] font-extrabold tracking-[0.28em] ${brandTextClass}`}>{APP_WORDMARK}</div>
              <div className={`mt-0.5 text-[10px] ${buildTextClass}`}>Build {BUILD_STAMP}</div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <div className="text-base sm:text-lg font-bold tracking-tight">{APP_NAME}</div>
                <Pill tone="cyan" lightMode={isLightMode}>
                  <Flame className="h-3.5 w-3.5" /> Streak {topStreak}
                </Pill>
                <Pill tone="neutral" lightMode={isLightMode}>
                  XP {activeXP} • {xpLevel.key} ({xpLevel.pctToNext}%)
                </Pill>
                {activeMember?.role === "owner" ? (
                  <Pill tone="good" lightMode={isLightMode}>
                    <Crown className="h-3.5 w-3.5" /> {tx("role.owner", "Owner")}
                  </Pill>
                ) : activeMember?.role === "coach" ? (
                  <Pill tone="warn" lightMode={isLightMode}>
                    <Crown className="h-3.5 w-3.5" /> {tx("role.coach", "Coach")}
                  </Pill>
                ) : activeMember?.role === "proskater" ? (
                  <Pill tone="good" lightMode={isLightMode}>
                    <Crown className="h-3.5 w-3.5" /> {tx("role.proskater", "Pro Skater")}
                  </Pill>
                ) : activeMember?.role === "media" ? (
                  <Pill tone="neutral" lightMode={isLightMode}>
                    <VideoIcon className="h-3.5 w-3.5" /> {tx("role.media", "Media")}
                  </Pill>
                ) : activeMember?.role === "skater" ? (
                  <Pill tone="cyan" lightMode={isLightMode}>
                    <Users className="h-3.5 w-3.5" /> {participantLabel}
                  </Pill>
                ) : (
                  <Pill tone="neutral" lightMode={isLightMode}>
                    <Users className="h-3.5 w-3.5" /> {tx("role.dad", "Dad")}
                  </Pill>
                )}
                {programProfile.enabled ? (
                  <Pill tone={isHighSchoolProgram ? "warn" : "neutral"} lightMode={isLightMode}>
                    <Users className="h-3.5 w-3.5" /> {isHighSchoolProgram ? "High School Team" : programHeaderLabel}
                  </Pill>
                ) : null}
              </div>
              <div className={`mt-1 text-[11px] ${buildTextClass}`}>{appTagline}</div>
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
                title={`Active ${participantLabelLower}`}
              >
                {skaters.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {!isSkaterMember ? (
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
          ) : null}

          <div
            className={
              (isSkaterMember
                ? "mt-3 grid grid-cols-5 gap-1.5"
                : mobileTabsOpen
                ? "mt-3 grid grid-cols-5 gap-1.5"
                : "hidden") + " sm:mt-3 sm:grid sm:grid-cols-6 lg:grid-cols-12 sm:gap-2"
            }
          >
            <TabButton active={ui.view === "log"} tabKey="log" icon={ClipboardList} label={tx("tabs.log", "Log")} {...tabThemeProps} onClick={() => switchView("log")} />
            <TabButton active={ui.view === "cards"} tabKey="cards" icon={LayoutGrid} label={tx("tabs.cards", "Cards")} {...tabThemeProps} onClick={() => switchView("cards")} />
            <TabButton active={ui.view === "calendar"} tabKey="calendar" icon={Calendar} label={tx("tabs.calendar", "Calendar")} {...tabThemeProps} onClick={() => switchView("calendar")} />
            <TabButton active={ui.view === "dash"} tabKey="dash" icon={BarChart3} label={tx("tabs.stats", "Stats")} {...tabThemeProps} onClick={() => switchView("dash")} />
            <TabButton active={ui.view === "plans"} tabKey="plans" icon={Pencil} label={tx("tabs.plans", "Plans")} {...tabThemeProps} onClick={() => switchView("plans")} />
            {proFeedbackAvailable ? (
              <TabButton active={ui.view === "profeedback"} tabKey="profeedback" icon={Crown} label={tx("tabs.pro", "Pro")} {...tabThemeProps} onClick={() => switchView("profeedback")} />
            ) : null}
            {roleAllowedViews.has("coach") ? (
              <TabButton active={ui.view === "coach"} tabKey="coach" icon={VideoIcon} label={tx("tabs.coach", "Coach")} {...tabThemeProps} onClick={() => switchView("coach")} />
            ) : null}
            <TabButton active={ui.view === "skateday"} tabKey="skateday" icon={MapPin} label={tx("tabs.freeSkate", "Free Skate")} {...tabThemeProps} onClick={() => switchView("skateday")} />
            <TabButton active={ui.view === "contest"} tabKey="contest" icon={Trophy} label={tx("tabs.contest", "Contest")} {...tabThemeProps} onClick={() => switchView("contest")} />
            {roleAllowedViews.has("academy") ? (
              <TabButton active={ui.view === "academy"} tabKey="academy" icon={School} label={tx("tabs.academy", "Academy")} {...tabThemeProps} onClick={() => switchView("academy")} />
            ) : null}
            {roleAllowedViews.has("team") ? (
              <TabButton active={ui.view === "team"} tabKey="team" icon={Users} label={tx("tabs.team", "Team")} {...tabThemeProps} onClick={() => switchView("team")} />
            ) : null}
            <TabButton active={ui.view === "chat"} tabKey="chat" icon={MessageSquare} label={tx("tabs.chat", "Chat")} {...tabThemeProps} onClick={() => switchView("chat")} />
            {roleAllowedViews.has("settings") ? (
              <TabButton active={ui.view === "settings"} tabKey="settings" icon={Settings} label={tx("tabs.settings", "Settings")} {...tabThemeProps} onClick={() => switchView("settings")} />
            ) : null}
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
                      Auto-saved at {formatClockTime(lastDraftSavedAt)}
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
                      <option value={MEDIA_DAY_LABEL}>{MEDIA_DAY_LABEL}</option>
                    </select>
                  </div>
                  <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-3">
                    <div className="text-xs text-white/60">Park</div>
                    <input
                      value={draft.park}
                      onChange={(e) => {
                        const nextPark = e.target.value;
                        setDraft({ park: nextPark });
                        queueParkTypeahead(nextPark);
                      }}
                      onFocus={(e) => queueParkTypeahead(e.target.value)}
                      list="park-name-list"
                      placeholder="Harbor / Channel / Vans..."
                      className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2"
                    />
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
                  <div className="mt-2 text-xs text-white/60">
                    {isMediaDayDraft ? "Media Day: upload photos/videos and save a trading card without practice reps." : `Total reps: ${totalCompleted} / ${totalTarget} • Missed: ${totalMissed}`}
                  </div>
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
                  {isMediaDayDraft ? (
                    <div className="rounded-2xl bg-cyan-500/10 ring-1 ring-cyan-400/30 p-4 text-sm text-cyan-100">
                      Non-practice mode is on. Add media below and tap <span className="font-bold">Save Session Card</span> to create a trading card.
                    </div>
                  ) : null}
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
                        const trickAssist = normalizeTrickAssist(m?.trickAssist, m?.name || "");
                        const selectedTrickName = String(trickAssist.selectedTrickName || "");
                        const trickSuggestions = toArray(trickAssist.suggestions);
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
                            {isVideo ? (
                              <div className="border-t border-white/10 bg-black/70 p-2 space-y-1.5">
                                <div className="text-[10px] uppercase tracking-wide text-cyan-200/80">AI trick detect</div>
                                <input
                                  value={selectedTrickName}
                                  onChange={(e) => setDraftMediaTrickName(m.id, e.target.value)}
                                  placeholder="Set trick"
                                  list="trick-name-list"
                                  className="w-full rounded-lg bg-black/50 border border-white/10 px-2 py-1.5 text-[11px]"
                                />
                                {trickSuggestions.length ? (
                                  <div className="flex flex-wrap gap-1">
                                    {trickSuggestions.map((sugg) => {
                                      const isActive = selectedTrickName.trim().toLowerCase() === String(sugg?.name || "").trim().toLowerCase();
                                      return (
                                        <button
                                          key={`${m.id}:${sugg.id}`}
                                          type="button"
                                          onClick={() => setDraftMediaTrickFromSuggestion(m.id, sugg)}
                                          className={`rounded-md px-1.5 py-1 text-[10px] font-semibold ring-1 ${
                                            isActive
                                              ? "bg-cyan-500/30 text-cyan-100 ring-cyan-400/40"
                                              : "bg-white/5 text-white/90 ring-white/10 hover:bg-white/10"
                                          }`}
                                        >
                                          {sugg.name} • {Math.round((Number(sugg.confidence) || 0) * 100)}%
                                        </button>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className="text-[10px] text-white/55">No strong filename match. Type trick manually.</div>
                                )}
                              </div>
                            ) : null}
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
                      canEditMedia={canEditStudentMedia}
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
                        canEditMedia={canEditStudentMedia}
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
                      <ProgressCard key={c.id} card={c} skater={activeSkater} locale={uiLocale} />
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
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
                      <div className={isLightMode ? "mt-1 text-[11px] text-slate-500" : "mt-1 text-[11px] text-white/50"}>{formatStandardTime(reminders.time, uiLocale)}</div>
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
                    <div>
                      <div className={isLightMode ? "text-xs text-slate-500" : "text-xs text-white/60"}>Skate Park</div>
                      <input
                        value={practiceSettings.park || ""}
                        onChange={(e) => {
                          const nextPark = e.target.value;
                          setSlice({ practiceSettings: { ...practiceSettings, park: nextPark } });
                          queueParkTypeahead(nextPark);
                        }}
                        onFocus={(e) => queueParkTypeahead(e.target.value)}
                        list="park-name-list"
                        placeholder="Harbor City Skate Park"
                        className={isLightMode ? "mt-1 w-full rounded-xl bg-white border border-slate-300 px-3 py-2" : "mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2"}
                      />
                      {selectedParkProfile ? (
                        <button
                          type="button"
                          onClick={() => setSlice({ practiceSettings: { ...practiceSettings, park: selectedParkProfile.name } })}
                          className={isLightMode ? "mt-1 rounded-lg bg-slate-100 ring-1 ring-slate-300 px-2 py-1 text-[11px] font-semibold hover:bg-slate-200" : "mt-1 rounded-lg bg-white/5 ring-1 ring-white/10 px-2 py-1 text-[11px] font-semibold hover:bg-white/10"}
                        >
                          Use Selected Park
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className={isLightMode ? "mt-4 rounded-2xl bg-slate-50 ring-1 ring-slate-300 p-4" : "mt-4 rounded-2xl bg-black/30 ring-1 ring-white/10 p-4"}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className={isLightMode ? "text-xs text-slate-500" : "text-xs text-white/60"}>Next Practice</div>
                      <div className="text-sm font-bold">
                        {nextPracticeEvent
                          ? `${nextPracticeEvent.title || "Practice"} • ${nextPracticeEvent.dateISO} ${formatStandardTime(nextPracticeEvent.time, uiLocale)}${nextPracticeEvent.park ? ` • ${nextPracticeEvent.park}` : ""}`
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
                  <div className="text-sm font-extrabold">{formatMonthLabel(calendarMonthKey, uiLocale)}</div>
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
                              {formatStandardTime(ev.time, uiLocale)} {ev.title || "Practice"}{ev.park ? ` @ ${ev.park}` : ""}
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
                            {ev.dateISO} • {formatStandardTime(ev.time, uiLocale)} • {ev.title || "Practice"}{ev.park ? ` • ${ev.park}` : ""}
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => openPracticeEditor(ev)}
                              className={isLightMode ? "rounded-lg bg-cyan-50 ring-1 ring-cyan-300 text-cyan-700 px-3 py-1.5 text-xs font-semibold hover:bg-cyan-100" : "rounded-lg bg-cyan-500/15 ring-1 ring-cyan-500/30 text-cyan-200 px-3 py-1.5 text-xs font-semibold hover:bg-cyan-500/25"}
                            >
                              Edit
                            </button>
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
                        {editingPracticeId === ev.id ? (
                          <div className={isLightMode ? "mt-3 rounded-xl bg-white ring-1 ring-slate-300 p-3" : "mt-3 rounded-xl bg-black/40 ring-1 ring-white/10 p-3"}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                              <div>
                                <div className={isLightMode ? "text-[11px] text-slate-500" : "text-[11px] text-white/50"}>Date</div>
                                <input
                                  type="date"
                                  value={practiceEditDraft.dateISO}
                                  onChange={(e) => setPracticeEditDraft((p) => ({ ...p, dateISO: e.target.value }))}
                                  className={isLightMode ? "mt-1 w-full rounded-lg bg-white border border-slate-300 px-2 py-1.5 text-sm" : "mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-2 py-1.5 text-sm"}
                                />
                              </div>
                              <div>
                                <div className={isLightMode ? "text-[11px] text-slate-500" : "text-[11px] text-white/50"}>Time</div>
                                <input
                                  type="time"
                                  value={practiceEditDraft.time}
                                  onChange={(e) => setPracticeEditDraft((p) => ({ ...p, time: e.target.value }))}
                                  className={isLightMode ? "mt-1 w-full rounded-lg bg-white border border-slate-300 px-2 py-1.5 text-sm" : "mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-2 py-1.5 text-sm"}
                                />
                              </div>
                              <div>
                                <div className={isLightMode ? "text-[11px] text-slate-500" : "text-[11px] text-white/50"}>Title</div>
                                <input
                                  value={practiceEditDraft.title}
                                  onChange={(e) => setPracticeEditDraft((p) => ({ ...p, title: e.target.value }))}
                                  className={isLightMode ? "mt-1 w-full rounded-lg bg-white border border-slate-300 px-2 py-1.5 text-sm" : "mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-2 py-1.5 text-sm"}
                                />
                              </div>
                              <div>
                                <div className={isLightMode ? "text-[11px] text-slate-500" : "text-[11px] text-white/50"}>Park</div>
                                <input
                                  value={practiceEditDraft.park}
                                  onChange={(e) => {
                                    const nextPark = e.target.value;
                                    setPracticeEditDraft((p) => ({ ...p, park: nextPark }));
                                    queueParkTypeahead(nextPark);
                                  }}
                                  onFocus={(e) => queueParkTypeahead(e.target.value)}
                                  list="park-name-list"
                                  className={isLightMode ? "mt-1 w-full rounded-lg bg-white border border-slate-300 px-2 py-1.5 text-sm" : "mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-2 py-1.5 text-sm"}
                                />
                              </div>
                              <div>
                                <div className={isLightMode ? "text-[11px] text-slate-500" : "text-[11px] text-white/50"}>Duration (min)</div>
                                <input
                                  inputMode="numeric"
                                  value={practiceEditDraft.durationMin}
                                  onChange={(e) => setPracticeEditDraft((p) => ({ ...p, durationMin: clampNum(e.target.value) || 0 }))}
                                  className={isLightMode ? "mt-1 w-full rounded-lg bg-white border border-slate-300 px-2 py-1.5 text-sm" : "mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-2 py-1.5 text-sm"}
                                />
                              </div>
                              <div>
                                <div className={isLightMode ? "text-[11px] text-slate-500" : "text-[11px] text-white/50"}>Reminder (min before)</div>
                                <input
                                  inputMode="numeric"
                                  value={practiceEditDraft.remindMin}
                                  onChange={(e) => setPracticeEditDraft((p) => ({ ...p, remindMin: clampNum(e.target.value) || 0 }))}
                                  className={isLightMode ? "mt-1 w-full rounded-lg bg-white border border-slate-300 px-2 py-1.5 text-sm" : "mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-2 py-1.5 text-sm"}
                                />
                              </div>
                            </div>
                            <div className="mt-2">
                              <div className={isLightMode ? "text-[11px] text-slate-500" : "text-[11px] text-white/50"}>Notes</div>
                              <textarea
                                rows={2}
                                value={practiceEditDraft.notes}
                                onChange={(e) => setPracticeEditDraft((p) => ({ ...p, notes: e.target.value }))}
                                className={isLightMode ? "mt-1 w-full rounded-lg bg-white border border-slate-300 px-2 py-1.5 text-sm" : "mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-2 py-1.5 text-sm"}
                              />
                            </div>
                            <div className="mt-2 flex gap-2">
                              <button
                                type="button"
                                onClick={savePracticeEdit}
                                className={isLightMode ? "rounded-lg bg-slate-900 text-white px-3 py-1.5 text-xs font-semibold hover:bg-slate-800" : "rounded-lg bg-white text-black px-3 py-1.5 text-xs font-semibold hover:bg-white/90"}
                              >
                                Save Changes
                              </button>
                              <button
                                type="button"
                                onClick={cancelPracticeEditor}
                                className={isLightMode ? "rounded-lg bg-slate-100 ring-1 ring-slate-300 px-3 py-1.5 text-xs font-semibold hover:bg-slate-200" : "rounded-lg bg-white/5 ring-1 ring-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/10"}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : null}
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

              <div className="mt-4 grid grid-cols-1 lg:grid-cols-4 gap-3">
                <Stat label="Current Streak" value={`${topStreak} sessions`} tone={topStreak >= 3 ? "good" : "neutral"} />
                <Stat
                  label="Career High OVR"
                  value={(() => {
                    const max = Math.max(0, ...activeSkaterSessions.map((s) => computeOVR(s)));
                    return max ? `${max} OVR` : "—";
                  })()}
                  tone="gold"
                />
                <Stat label="Total Sessions" value={`${activeSkaterSessions.length}`} tone="cyan" />
                <Stat label="Parks Skated" value={`${uniqueParkCount}`} tone={uniqueParkCount >= 3 ? "good" : "neutral"} />
              </div>

              <div className={`mt-4 rounded-3xl p-4 ${isLightMode ? "bg-white ring-1 ring-slate-300" : "bg-white/5 ring-1 ring-white/10"}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold inline-flex items-center gap-2">
                      <CloudSun className="h-4 w-4" /> Park Conditions
                    </div>
                    <div className={`text-xs mt-1 ${isLightMode ? "text-slate-600" : "text-white/60"}`}>
                      Search any skate park/city (including GoSkate listings), save it, and check weather before practice.
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
                        setSlice({
                          draft: { ...draft, park: selectedParkProfile.name },
                          practiceSettings: { ...practiceSettings, park: selectedParkProfile.name },
                        });
                        toast("Park set for practice", `${selectedParkProfile.name} set for today’s practice.`, "success");
                      }}
                      className="rounded-xl bg-white text-black px-3 py-2 text-xs font-extrabold hover:bg-white/90 inline-flex items-center gap-2"
                    >
                      <MapPin className="h-3.5 w-3.5" /> Use For Practice
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
                    placeholder="Find park or city (GoSkate + maps)"
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
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-sm font-semibold">{r.name}</div>
                            {r.source === "goskate" ? (
                              <span className={isLightMode ? "text-[10px] rounded-full bg-teal-100 text-teal-800 px-2 py-0.5" : "text-[10px] rounded-full bg-teal-500/20 text-teal-100 px-2 py-0.5"}>GoSkate</span>
                            ) : null}
                          </div>
                          <div className={`text-xs mt-1 ${isLightMode ? "text-slate-600" : "text-white/60"}`}>
                            {[r.admin1, r.country].filter(Boolean).join(", ")}
                          </div>
                          <div className={isLightMode ? "text-[11px] mt-1 text-slate-500" : "text-[11px] mt-1 text-white/50"}>
                            {Number(r.lat).toFixed(4)}, {Number(r.lon).toFixed(4)}
                          </div>
                          <div className="mt-2">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => addParkFromLookup(r)}
                                className={isLightMode ? "rounded-lg bg-slate-100 ring-1 ring-slate-300 px-3 py-1.5 text-xs font-semibold hover:bg-slate-200" : "rounded-lg bg-white/5 ring-1 ring-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/10"}
                              >
                                Save Park
                              </button>
                              {r.sourceUrl ? (
                                <button
                                  type="button"
                                  onClick={() => window.open(r.sourceUrl, "_blank", "noopener,noreferrer")}
                                  className={isLightMode ? "rounded-lg bg-white ring-1 ring-slate-300 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50 inline-flex items-center gap-1" : "rounded-lg bg-black/40 ring-1 ring-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-black/60 inline-flex items-center gap-1"}
                                >
                                  <ExternalLink className="h-3 w-3" /> Source
                                </button>
                              ) : null}
                            </div>
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
                  ) : weatherState.daily?.length ? (
                    <div className="space-y-3">
                      <div className={`text-xs ${isLightMode ? "text-slate-600" : "text-white/60"}`}>
                        {weatherState.parkName || selectedParkProfile?.name || "Selected park"} • Updated{" "}
                        {weatherState.fetchedAt ? formatClockTime(weatherState.fetchedAt) : "now"}
                      </div>
                      <div className={`text-xs ${isLightMode ? "text-slate-600" : "text-white/60"}`}>Daily forecast (today + next 4 days)</div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                        {weatherState.daily.slice(0, 5).map((d, idx) => (
                          <div key={d.dateISO} className={isLightMode ? "rounded-xl bg-slate-50 ring-1 ring-slate-300 p-3" : "rounded-xl bg-black/30 ring-1 ring-white/10 p-3"}>
                            <div className={`text-[11px] ${isLightMode ? "text-slate-500" : "text-white/60"}`}>{idx === 0 ? "Today" : formatShortDate(d.dateISO, uiLocale)}</div>
                            <div className="mt-1 text-sm font-bold">{weatherCodeLabel(d.code)}</div>
                            <div className={`text-xs mt-1 ${isLightMode ? "text-slate-600" : "text-white/70"}`}>
                              {d.maxF}F / {d.minF}F
                            </div>
                            <div className={`text-[11px] mt-1 ${isLightMode ? "text-slate-500" : "text-white/60"}`}>Rain {d.rainPct}%</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className={`text-sm ${isLightMode ? "text-slate-600" : "text-white/70"}`}>Pick a park to load weather.</div>
                  )}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-3">
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

                <div className="rounded-3xl bg-white/5 ring-1 ring-white/10 p-4">
                  <div className="text-sm font-semibold">Sessions by Park</div>
                  <div className="mt-3 h-64">
                    {parkBars.length ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={parkBars}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="park" hide />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Bar dataKey="sessions" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className={`h-full flex items-center justify-center text-sm ${isLightMode ? "text-slate-600" : "text-white/60"}`}>No park data yet.</div>
                    )}
                  </div>
                  <div className="mt-2 text-xs text-white/60">Top parks by session count for this {participantLabelLower}.</div>
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
                    <div className="mt-2 text-sm text-white/60">Owner + Coach + {participantLabel} can edit. Dad can view/log.</div>
                  </div>
                  {canEditPlans ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        value={newPlanDayName}
                        onChange={(e) => setNewPlanDayName(e.target.value)}
                        placeholder="New day type name"
                        className="rounded-2xl bg-black/40 border border-white/10 px-3 py-2 text-sm min-w-[210px]"
                      />
                      <button type="button" onClick={() => addDayType(newPlanDayName)} className="rounded-2xl bg-white text-black px-4 py-2 text-sm font-bold hover:bg-white/90">
                        <Plus className="h-4 w-4 inline-block mr-2" /> Add Day
                      </button>
                    </div>
                  ) : (
                    <Pill tone="warn">View only</Pill>
                  )}
                </div>

                <div className="mt-4 rounded-3xl bg-black/30 ring-1 ring-white/10 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold">Sport Package + Training Sections</div>
                      <div className="text-xs text-white/60">
                        Single package keeps one sport. Multi package unlocks separate plans per sport.
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Pill tone={canUseMultiSportPackage ? "good" : "warn"}>
                        {canUseMultiSportPackage ? "Multi Package" : "Single Package"}
                      </Pill>
                      <Pill tone="cyan">{sportLabelFromKey(activeSportKey)}</Pill>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <div className="sm:col-span-4">
                      <div className="text-[11px] text-white/60">Package</div>
                      {canManageSportPackage ? (
                        <select
                          value={activeSportPackage}
                          onChange={(e) => setSportPackageForActiveSkater(e.target.value)}
                          className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                        >
                          <option value={SPORT_PACKAGE_SINGLE}>Single Sport</option>
                          <option value={SPORT_PACKAGE_MULTI}>Multi Sport</option>
                        </select>
                      ) : (
                        <div className="mt-1 rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm">{canUseMultiSportPackage ? "Multi Sport" : "Single Sport"}</div>
                      )}
                    </div>
                    <div className="sm:col-span-4">
                      <div className="text-[11px] text-white/60">Single Package Sport</div>
                      {canManageSportPackage ? (
                        <select
                          value={primarySportKey}
                          onChange={(e) => setPrimarySportForActiveSkater(e.target.value)}
                          className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                        >
                          {TRAINING_SPORT_OPTIONS.map((sport) => (
                            <option key={`primary-${sport.key}`} value={sport.key}>
                              {sport.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="mt-1 rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm">{sportLabelFromKey(primarySportKey)}</div>
                      )}
                    </div>
                    <div className="sm:col-span-4">
                      <div className="text-[11px] text-white/60">Sport</div>
                      <select
                        value={sportTemplatePick}
                        onChange={(e) => {
                          const next = e.target.value;
                          const changed = setActiveTrainingSport(next);
                          setSportTemplatePick(changed ? next : activeSportKey);
                        }}
                        className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                      >
                        {TRAINING_SPORT_OPTIONS.map((sport) => (
                          <option key={sport.key} value={sport.key} disabled={!canUseMultiSportPackage && sport.key !== primarySportKey}>
                            {sport.label}
                            {!canUseMultiSportPackage && sport.key !== primarySportKey ? " (Multi package)" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-12 flex flex-wrap items-end gap-2">
                      {canEditPlans ? (
                        <>
                          <button
                            type="button"
                            onClick={() => importSportPlanSections(sportTemplatePick, "append")}
                            disabled={!canUseMultiSportPackage && sportTemplatePick !== primarySportKey}
                            className="rounded-xl bg-cyan-500/20 ring-1 ring-cyan-400/30 px-3 py-2 text-xs font-semibold text-cyan-100 hover:bg-cyan-500/30"
                          >
                            Add Sport Sections
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (!confirm(`Replace current plan with ${sportLabelFromKey(sportTemplatePick)} sections?`)) return;
                              importSportPlanSections(sportTemplatePick, "replace");
                            }}
                            disabled={!canUseMultiSportPackage && sportTemplatePick !== primarySportKey}
                            className="rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/10"
                          >
                            Replace Full Plan
                          </button>
                        </>
                      ) : (
                        <div className="text-xs text-white/60">View-only role. Ask owner/coach/{participantLabelLower} to import sections.</div>
                      )}
                    </div>
                  </div>
                  {!canUseMultiSportPackage ? (
                    <div className="mt-3 text-xs text-amber-200">
                      Multi-sport is locked for this {participantLabelLower}. Upgrade to Multi Sport package to maintain separate plans for additional sports.
                    </div>
                  ) : null}
                </div>

                <div className="mt-4 rounded-3xl bg-black/30 ring-1 ring-white/10 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold">Skate Trick Catalog</div>
                      <div className="text-xs text-white/60">
                        Street • Vert • Pool/Bowl • Combi • Mega. Save learned tricks and wishlist to this {participantLabelLower} profile.
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Pill tone="good">Learned {learnedTrickCount}</Pill>
                      <Pill tone="warn">Wishlist {wishlistTrickCount}</Pill>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <div className="sm:col-span-3">
                      <select
                        value={trickCategoryFilter}
                        onChange={(e) => setTrickCategoryFilter(e.target.value)}
                        className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                      >
                        {trickCategoryOptions.map((opt) => (
                          <option key={`cat-${opt.key}`} value={opt.key}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-5">
                      <input
                        value={trickSearch}
                        onChange={(e) => setTrickSearch(e.target.value)}
                        placeholder="Search trick..."
                        className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="sm:col-span-4 text-xs text-white/60 flex items-center justify-start sm:justify-end">
                      Showing {filteredTrickCatalog.length} trick{filteredTrickCatalog.length === 1 ? "" : "s"}
                    </div>
                  </div>

                  {canEditPlans ? (
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-12 gap-2">
                      <div className="sm:col-span-5">
                        <input
                          value={customTrickDraft.name}
                          onChange={(e) => setCustomTrickDraft((prev) => ({ ...prev, name: e.target.value }))}
                          placeholder="Add custom trick (e.g., Alley-oop air)"
                          className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="sm:col-span-4">
                        <select
                          value={customTrickDraft.category}
                          onChange={(e) => setCustomTrickDraft((prev) => ({ ...prev, category: e.target.value }))}
                          className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                        >
                          {SKATE_TRICK_CATALOG.map((cat) => (
                            <option key={`custom-${cat.key}`} value={cat.key}>
                              {cat.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="sm:col-span-3">
                        <button
                          type="button"
                          onClick={addCustomCatalogTrick}
                          className="w-full rounded-xl bg-cyan-500/20 ring-1 ring-cyan-400/30 px-3 py-2 text-sm font-semibold text-cyan-100 hover:bg-cyan-500/30"
                        >
                          Add Custom Trick
                        </button>
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-3 max-h-[44vh] overflow-auto space-y-2 pr-1">
                    {filteredTrickCatalog.map((trick) => {
                      const learned = toArray(activeTrickProfile.learnedIds).includes(trick.id);
                      const wish = toArray(activeTrickProfile.wishlistIds).includes(trick.id);
                      return (
                        <div key={trick.id} className="rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-semibold truncate">{trick.name}</div>
                              <div className="text-[11px] text-white/60">{trick.categoryLabel}</div>
                            </div>
                            <label className="inline-flex items-center gap-2 rounded-lg bg-white/5 ring-1 ring-white/10 px-2 py-1 text-xs">
                              <input
                                type="checkbox"
                                checked={learned}
                                onChange={(e) => toggleTrickLearned(trick.id, e.target.checked)}
                              />
                              Learned
                            </label>
                            <label className="inline-flex items-center gap-2 rounded-lg bg-white/5 ring-1 ring-white/10 px-2 py-1 text-xs">
                              <input
                                type="checkbox"
                                checked={wish}
                                onChange={(e) => toggleTrickWishlist(trick.id, e.target.checked)}
                              />
                              Wishlist
                            </label>
                            {trick.isCustom && canEditPlans ? (
                              <button
                                type="button"
                                onClick={() => removeCustomCatalogTrick(trick.id)}
                                className="rounded-lg bg-white/5 ring-1 ring-white/10 px-2 py-1 text-xs font-semibold hover:bg-white/10"
                              >
                                Remove
                              </button>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                    {!filteredTrickCatalog.length ? <div className="text-xs text-white/60">No tricks match this filter.</div> : null}
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {Object.entries(plans).map(([dayName, dayTasks]) => (
                    <div key={dayName} className="rounded-3xl bg-black/30 ring-1 ring-white/10 p-4">
                      {canEditPlans ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            value={String(planDayNameDrafts?.[dayName] ?? dayName)}
                            onChange={(e) => setPlanDayNameDrafts((prev) => ({ ...prev, [dayName]: e.target.value }))}
                            className="flex-1 min-w-[220px] rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm font-semibold"
                          />
                          <button
                            type="button"
                            onClick={() => renameDayType(dayName, planDayNameDrafts?.[dayName] || dayName)}
                            disabled={!String(planDayNameDrafts?.[dayName] || "").trim() || String(planDayNameDrafts?.[dayName] || "").trim() === dayName}
                            className="rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/10 disabled:opacity-50"
                          >
                            Save Name
                          </button>
                          <button type="button" onClick={() => deleteDayType(dayName)} className="rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/10">
                            Delete
                          </button>
                        </div>
                      ) : (
                        <div className="text-sm font-bold">{dayName}</div>
                      )}

                      <div className="mt-3 space-y-2">
                        {dayTasks.map((t) => (
                          <div key={t.id} className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-3">
                            {canEditPlans ? (
                              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                                <div className="sm:col-span-4">
                                  <div className="text-[11px] text-white/60">Task</div>
                                  <input
                                    value={t.label || ""}
                                    onChange={(e) => updatePlanTask(dayName, t.id, { label: e.target.value })}
                                    list="trick-name-list"
                                    className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                                  />
                                  <select
                                    defaultValue=""
                                    onChange={(e) => {
                                      applyCatalogTrickToTask(dayName, t.id, e.target.value);
                                      e.currentTarget.value = "";
                                    }}
                                    className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-xs"
                                  >
                                    <option value="">Pick from trick catalog...</option>
                                    {planTrickDropdownOptions.map((trick) => (
                                      <option key={`task-pick-${dayName}-${t.id}-${trick.id}`} value={trick.name}>
                                        {trick.name} • {trick.categoryLabel}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className="sm:col-span-2">
                                  <div className="text-[11px] text-white/60">Reps</div>
                                  <input
                                    value={String(t.target ?? "")}
                                    onChange={(e) => {
                                      const next = clampNum(e.target.value);
                                      updatePlanTask(dayName, t.id, { target: next === "" ? 0 : Number(next) || 0 });
                                    }}
                                    inputMode="numeric"
                                    className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                                  />
                                </div>
                                <div className="sm:col-span-5">
                                  <div className="text-[11px] text-white/60">Notes</div>
                                  <input
                                    value={t.notes || ""}
                                    onChange={(e) => updatePlanTask(dayName, t.id, { notes: e.target.value })}
                                    className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                                  />
                                </div>
                                <div className="sm:col-span-1 flex items-end">
                                  <button type="button" onClick={() => deleteTask(dayName, t.id)} className="w-full rounded-xl bg-white/5 ring-1 ring-white/10 px-2 py-2 text-xs font-semibold hover:bg-white/10">
                                    Remove
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="min-w-0">
                                <div className="text-sm font-semibold truncate">{t.label}</div>
                                <div className="mt-1 text-xs text-white/60">
                                  Target: <span className="font-bold text-white">{t.target}</span>
                                  {t.notes ? ` • ${t.notes}` : ""}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {canEditPlans ? (
                        <div className="mt-3 rounded-2xl bg-black/40 ring-1 ring-white/10 p-3">
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                            <div className="sm:col-span-4">
                              <div className="text-[11px] text-white/60">Task</div>
                              <input
                                value={String(newTaskDraftByDay?.[dayName]?.label || "")}
                                onChange={(e) => setNewTaskDraftField(dayName, "label", e.target.value)}
                                list="trick-name-list"
                                placeholder="New task"
                                className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                              />
                              <select
                                defaultValue=""
                                onChange={(e) => {
                                  applyCatalogTrickToNewTask(dayName, e.target.value);
                                  e.currentTarget.value = "";
                                }}
                                className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-xs"
                              >
                                <option value="">Pick from trick catalog...</option>
                                {planTrickDropdownOptions.map((trick) => (
                                  <option key={`new-task-pick-${dayName}-${trick.id}`} value={trick.name}>
                                    {trick.name} • {trick.categoryLabel}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="sm:col-span-2">
                              <div className="text-[11px] text-white/60">Reps</div>
                              <input
                                value={String(newTaskDraftByDay?.[dayName]?.target || "")}
                                onChange={(e) => setNewTaskDraftField(dayName, "target", clampNum(e.target.value))}
                                inputMode="numeric"
                                placeholder="0"
                                className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                              />
                            </div>
                            <div className="sm:col-span-5">
                              <div className="text-[11px] text-white/60">Notes</div>
                              <input
                                value={String(newTaskDraftByDay?.[dayName]?.notes || "")}
                                onChange={(e) => setNewTaskDraftField(dayName, "notes", e.target.value)}
                                placeholder="Optional notes"
                                className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                              />
                            </div>
                            <div className="sm:col-span-1 flex items-end">
                              <button type="button" onClick={() => addTaskToDay(dayName)} className="w-full rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-300 text-black px-2 py-2 text-xs font-extrabold hover:opacity-95">
                                Add
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : null}

          {ui.view === "coach" && roleAllowedViews.has("coach") ? (
            <motion.div key="coach" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-4">
              <div className="rounded-3xl bg-white/5 ring-1 ring-white/10 p-5 sm:p-7">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs tracking-widest text-white/50">{isSkaterMember ? "COACH VIEW" : "COACH CORNER"}</div>
                    <div className="mt-1 text-xl font-extrabold">Demo Library • {activeSkater?.name || participantLabel}</div>
                    <div className="mt-2 text-sm text-white/60">
                      {isSkaterMember
                        ? "Skater mode can view demo clips, compare videos, and review body mechanics overlays."
                        : "Coach, parent, or owner can upload trick demos and link them to plan tricks."}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {isSkaterMember ? <Pill tone="warn">Skater View (Read-only)</Pill> : null}
                    <Pill tone="neutral">{activeCoachItems.length} demos</Pill>
                  </div>
                </div>

                {canManageCoachCorner ? (
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
                ) : (
                  <div className="mt-4 rounded-3xl bg-cyan-500/10 ring-1 ring-cyan-400/30 p-4 text-sm text-cyan-100">
                    Skater mode is view-only here. Coach/parent/owner can add or edit demo clips from their login.
                  </div>
                )}

                <div className="mt-4 rounded-3xl bg-black/30 ring-1 ring-white/10 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold">Student Clips</div>
                      <div className="text-xs text-white/60">Trim and draw corrections directly on saved practice videos.</div>
                    </div>
                    <Pill tone="cyan">{coachStudentVideoClips.length} clips</Pill>
                  </div>
                  {coachStudentVideoClips.length ? (
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                      {coachStudentVideoClips.map((clip) => (
                        <div key={clip.key} className="rounded-2xl bg-black/40 ring-1 ring-white/10 p-2">
                          <div className="aspect-video overflow-hidden rounded-xl bg-black ring-1 ring-white/10">
                            <video src={mediaSrc(clip.media)} className="h-full w-full object-cover" controls playsInline />
                          </div>
                          <div className="mt-2 text-[11px] text-white/60">
                            {clip.date || "No date"} • {clip.dayType || "Session"}{clip.park ? ` • ${clip.park}` : ""}
                          </div>
                          {clip.trickLabel ? <div className="mt-1 text-[11px] text-cyan-200">Trick: {clip.trickLabel}</div> : null}
                          {canManageCoachCorner ? (
                            <button
                              type="button"
                              onClick={() => openSessionVideoEditor(clip.sessionId, clip.mediaId)}
                              className="mt-2 rounded-xl bg-cyan-500/20 ring-1 ring-cyan-400/30 px-3 py-1.5 text-xs font-semibold text-cyan-100 hover:bg-cyan-500/30"
                            >
                              <Pencil className="h-3.5 w-3.5 inline-block mr-1" />
                              Coach Edit Clip
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => setCompareStudentClipKey(clip.key)}
                            className={`mt-2 ml-2 rounded-xl px-3 py-1.5 text-xs font-semibold ring-1 ${
                              compareStudentClipKey === clip.key
                                ? "bg-white text-black ring-white"
                                : "bg-white/5 ring-white/10 text-white hover:bg-white/10"
                            }`}
                          >
                            Use In Compare
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-2 text-xs text-white/60">No student video clips yet. Save a session with video to edit here.</div>
                  )}
                </div>

                <div className="mt-4 rounded-3xl bg-black/30 ring-1 ring-white/10 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold">Coach vs Student Compare</div>
                      <div className="text-xs text-white/60">Select one coach demo and one student clip, then play both side-by-side.</div>
                    </div>
                    <Pill tone="cyan">Side by side</Pill>
                  </div>

                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-white/60">Coach demo clip</div>
                      <select
                        value={compareCoachClipKey}
                        onChange={(e) => setCompareCoachClipKey(e.target.value)}
                        className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                      >
                        {!coachDemoVideoClips.length ? <option value="">No coach demo videos yet</option> : null}
                        {coachDemoVideoClips.map((clip) => (
                          <option key={clip.key} value={clip.key}>
                            {clip.title}{clip.trickLabel ? ` • ${clip.trickLabel}` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <div className="text-xs text-white/60">Student clip</div>
                      <select
                        value={compareStudentClipKey}
                        onChange={(e) => setCompareStudentClipKey(e.target.value)}
                        className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                      >
                        {!coachStudentVideoClips.length ? <option value="">No student videos yet</option> : null}
                        {coachStudentVideoClips.map((clip) => (
                          <option key={clip.key} value={clip.key}>
                            {clip.date || "No date"} • {clip.dayType || "Session"}{clip.park ? ` • ${clip.park}` : ""}{clip.trickLabel ? ` • ${clip.trickLabel}` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={playCompareVideos}
                      disabled={!selectedCoachCompareClip || !selectedStudentCompareClip}
                      className="rounded-xl bg-cyan-500/20 ring-1 ring-cyan-400/30 px-3 py-2 text-xs font-semibold text-cyan-100 hover:bg-cyan-500/30 disabled:opacity-50"
                    >
                      Play Both
                    </button>
                    <button
                      type="button"
                      onClick={pauseCompareVideos}
                      disabled={!selectedCoachCompareClip || !selectedStudentCompareClip}
                      className="rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/10 disabled:opacity-50"
                    >
                      Pause Both
                    </button>
                    <button
                      type="button"
                      onClick={resetCompareVideos}
                      disabled={!selectedCoachCompareClip || !selectedStudentCompareClip}
                      className="rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/10 disabled:opacity-50"
                    >
                      Reset To 0s
                    </button>
                    <button
                      type="button"
                      onClick={() => stepCompareVideos(-1)}
                      disabled={!selectedCoachCompareClip || !selectedStudentCompareClip}
                      className="rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/10 disabled:opacity-50"
                    >
                      Step -1f
                    </button>
                    <button
                      type="button"
                      onClick={() => stepCompareVideos(1)}
                      disabled={!selectedCoachCompareClip || !selectedStudentCompareClip}
                      className="rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/10 disabled:opacity-50"
                    >
                      Step +1f
                    </button>
                    <div className="inline-flex items-center gap-2 rounded-xl bg-white/5 ring-1 ring-white/10 px-2 py-1.5">
                      <span className="text-[11px] text-white/70">Speed</span>
                      <select
                        value={String(comparePlaybackRate)}
                        onChange={(e) => setComparePlaybackRate(Number(e.target.value) || 1)}
                        className="rounded-lg bg-black/40 border border-white/10 px-2 py-1 text-xs"
                      >
                        <option value="0.5">0.5x</option>
                        <option value="0.75">0.75x</option>
                        <option value="1">1.0x</option>
                        <option value="1.25">1.25x</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-3 rounded-2xl bg-black/35 ring-1 ring-white/10 p-3">
                    <div className="text-xs text-white/70">Biomechanics stick figure overlay</div>
                    <div className="mt-2 grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {[
                        { key: "coach", label: "Coach Guide", accent: "text-cyan-200" },
                        { key: "student", label: "Student Guide", accent: "text-amber-200" },
                      ].map((item) => {
                        const guide = compareStickFigureBySide[item.key];
                        return (
                          <div key={item.key} className="rounded-xl bg-black/30 ring-1 ring-white/10 p-2.5">
                            <div className="flex items-center justify-between gap-2">
                              <div className={`text-xs font-semibold ${item.accent}`}>{item.label}</div>
                              <button
                                type="button"
                                onClick={() => updateCompareStickFigure(item.key, { enabled: !guide.enabled })}
                                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold ring-1 ${
                                  guide.enabled
                                    ? item.key === "coach"
                                      ? "bg-cyan-500/20 ring-cyan-400/30 text-cyan-100"
                                      : "bg-amber-500/20 ring-amber-400/30 text-amber-100"
                                    : "bg-white/5 ring-white/10 text-white/80 hover:bg-white/10"
                                }`}
                              >
                                {guide.enabled ? "On" : "Off"}
                              </button>
                            </div>
                            {guide.enabled ? (
                              <>
                                <label className="mt-2 block text-[11px] text-white/60">
                                  Size
                                  <input
                                    type="range"
                                    min={0.65}
                                    max={1.55}
                                    step={0.01}
                                    value={guide.scale}
                                    onChange={(e) => updateCompareStickFigure(item.key, { scale: Number(e.target.value) || 1 })}
                                    className="mt-1 w-full"
                                  />
                                </label>
                                <label className="mt-2 block text-[11px] text-white/60">
                                  Opacity
                                  <input
                                    type="range"
                                    min={0.2}
                                    max={1}
                                    step={0.01}
                                    value={guide.opacity}
                                    onChange={(e) => updateCompareStickFigure(item.key, { opacity: Number(e.target.value) || 0.84 })}
                                    className="mt-1 w-full"
                                  />
                                </label>
                                <label className="mt-2 block text-[11px] text-white/60">
                                  X Position
                                  <input
                                    type="range"
                                    min={0.08}
                                    max={0.92}
                                    step={0.01}
                                    value={guide.x}
                                    onChange={(e) => updateCompareStickFigure(item.key, { x: Number(e.target.value) || 0.5 })}
                                    className="mt-1 w-full"
                                  />
                                </label>
                                <label className="mt-2 block text-[11px] text-white/60">
                                  Y Position
                                  <input
                                    type="range"
                                    min={0.18}
                                    max={0.92}
                                    step={0.01}
                                    value={guide.y}
                                    onChange={(e) => updateCompareStickFigure(item.key, { y: Number(e.target.value) || 0.58 })}
                                    className="mt-1 w-full"
                                  />
                                </label>
                                <label className="mt-2 block text-[11px] text-white/60">
                                  Turn Angle
                                  <input
                                    type="range"
                                    min={-1}
                                    max={1}
                                    step={0.01}
                                    value={guide.turn}
                                    onChange={(e) => updateCompareStickFigure(item.key, { turn: Number(e.target.value) || 0 })}
                                    className="mt-1 w-full"
                                  />
                                </label>
                                <label className="mt-2 block text-[11px] text-white/60">
                                  Leg Bend
                                  <input
                                    type="range"
                                    min={0}
                                    max={1}
                                    step={0.01}
                                    value={guide.bend}
                                    onChange={(e) => updateCompareStickFigure(item.key, { bend: Number(e.target.value) || 0 })}
                                    className="mt-1 w-full"
                                  />
                                </label>
                                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                  <span className="text-[10px] text-white/55">Preset</span>
                                  <select
                                    value={compareStickPresetKeyBySide[item.key] || "bowl_vert"}
                                    onChange={(e) =>
                                      setCompareStickPresetKeyBySide((prev) => ({
                                        ...toObj(prev, {}),
                                        [item.key]: e.target.value,
                                      }))
                                    }
                                    className="min-w-[180px] rounded-md bg-black/40 border border-white/10 px-1.5 py-1 text-[10px]"
                                  >
                                    {STICK_FIGURE_PRESET_OPTIONS.map((preset) => (
                                      <option key={`csp-opt-${item.key}-${preset.key}`} value={preset.key}>
                                        {preset.group ? `${preset.group} • ` : ""}{preset.label}
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    type="button"
                                    onClick={() => applyCompareStickPreset(item.key, compareStickPresetKeyBySide[item.key] || "bowl_vert")}
                                    className="rounded-md bg-cyan-500/20 ring-1 ring-cyan-400/30 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-100 hover:bg-cyan-500/30"
                                  >
                                    Apply
                                  </button>
                                  {STICK_FIGURE_QUICK_PRESET_KEYS.map((key) => (
                                    <button
                                      key={`csp-quick-${item.key}-${key}`}
                                      type="button"
                                      onClick={() => {
                                        setCompareStickPresetKeyBySide((prev) => ({
                                          ...toObj(prev, {}),
                                          [item.key]: key,
                                        }));
                                        applyCompareStickPreset(item.key, key);
                                      }}
                                      className="rounded-md bg-white/5 ring-1 ring-white/10 px-1.5 py-0.5 text-[10px] font-semibold hover:bg-white/10"
                                    >
                                      {STICK_FIGURE_PRESET_LABELS[key] || key}
                                    </button>
                                  ))}
                                </div>
                              </>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-black/40 ring-1 ring-white/10 p-2">
                      <div className="mb-2 text-xs text-white/60 truncate">
                        Coach: {selectedCoachCompareClip ? `${selectedCoachCompareClip.title}${selectedCoachCompareClip.trickLabel ? ` • ${selectedCoachCompareClip.trickLabel}` : ""}` : "No coach clip selected"}
                      </div>
                      <div className="relative aspect-video overflow-hidden rounded-xl bg-black ring-1 ring-white/10">
                        {selectedCoachCompareClip ? (
                          <video ref={compareCoachVideoRef} src={mediaSrc(selectedCoachCompareClip.media)} className="h-full w-full object-cover" controls playsInline />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-xs text-white/60">Select a coach demo video.</div>
                        )}
                        <StickFigureOverlay guide={compareStickFigureBySide.coach} />
                      </div>
                    </div>
                    <div className="rounded-2xl bg-black/40 ring-1 ring-white/10 p-2">
                      <div className="mb-2 text-xs text-white/60 truncate">
                        Student:{" "}
                        {selectedStudentCompareClip
                          ? `${selectedStudentCompareClip.date || "No date"} • ${selectedStudentCompareClip.dayType || "Session"}${selectedStudentCompareClip.park ? ` • ${selectedStudentCompareClip.park}` : ""}${
                              selectedStudentCompareClip.trickLabel ? ` • ${selectedStudentCompareClip.trickLabel}` : ""
                            }`
                          : "No student clip selected"}
                      </div>
                      <div className="relative aspect-video overflow-hidden rounded-xl bg-black ring-1 ring-white/10">
                        {selectedStudentCompareClip ? (
                          <video ref={compareStudentVideoRef} src={mediaSrc(selectedStudentCompareClip.media)} className="h-full w-full object-cover" controls playsInline />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-xs text-white/60">Select a student video.</div>
                        )}
                        <StickFigureOverlay guide={compareStickFigureBySide.student} />
                      </div>
                    </div>
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
                        {canManageCoachCorner ? (
                          <button type="button" onClick={() => deleteCoachDemo(item.id)} className="rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-xs hover:bg-white/10">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        ) : null}
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
                            {m.type?.startsWith("video/") ? (
                              <button
                                type="button"
                                onClick={() => setCompareCoachClipKey(`${item.id}:${m.id}`)}
                                className={`w-full border-t px-2 py-1 text-[11px] font-semibold ${
                                  compareCoachClipKey === `${item.id}:${m.id}`
                                    ? "bg-white text-black border-white"
                                    : "bg-white/5 text-white border-white/10 hover:bg-white/10"
                                }`}
                              >
                                Use In Compare
                              </button>
                            ) : null}
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
                    <div className="text-xs tracking-widest text-white/50">FREE SKATE</div>
                    <div className="mt-1 text-xl font-extrabold">{activeSkater?.name || participantLabel} Free Skate + Skate Trips</div>
                    <div className="mt-2 text-sm text-white/60">Track free skate sessions and skate trips with park details, notes, photos, and videos.</div>
                  </div>
                  <Pill tone="neutral">{activeSkateDays.length} entry{activeSkateDays.length === 1 ? "" : "ies"}</Pill>
                </div>

                <div className="mt-4 rounded-3xl bg-black/30 ring-1 ring-white/10 p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <div className="text-xs text-white/60">Session Type</div>
                      <select
                        value={skateDayDraft.kind || FREE_SKATE_KIND}
                        onChange={(e) => {
                          const nextKind = e.target.value === SKATE_TRIP_KIND ? SKATE_TRIP_KIND : FREE_SKATE_KIND;
                          setSkateDayDraft((p) => ({
                            ...p,
                            kind: nextKind,
                            title:
                              !String(p.title || "").trim() || ["Monthly Skate Day", "Free Skate", "Skate Trip"].includes(String(p.title || "").trim())
                                ? nextKind === SKATE_TRIP_KIND
                                  ? "Skate Trip"
                                  : "Free Skate"
                                : p.title,
                          }));
                        }}
                        className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                      >
                        <option value={FREE_SKATE_KIND}>Free Skate</option>
                        <option value={SKATE_TRIP_KIND}>Skate Trip</option>
                      </select>
                    </div>
                    <div>
                      <div className="text-xs text-white/60">Title</div>
                      <input
                        value={skateDayDraft.title}
                        onChange={(e) => setSkateDayDraft((p) => ({ ...p, title: e.target.value }))}
                        placeholder="Free Skate Session"
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
                        onChange={(e) => {
                          const nextPark = e.target.value;
                          setSkateDayDraft((p) => ({ ...p, park: nextPark }));
                          queueParkTypeahead(nextPark);
                        }}
                        onFocus={(e) => queueParkTypeahead(e.target.value)}
                        list="park-name-list"
                        placeholder="Harbor / Vans / Trip park..."
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
                      {activeSkater?.name || participantLabel} attended
                    </label>
                  </div>

                  <div className="mt-3">
                    <div className="text-xs text-white/60">Day Notes</div>
                    <textarea
                      value={skateDayDraft.notes}
                      onChange={(e) => setSkateDayDraft((p) => ({ ...p, notes: e.target.value }))}
                      placeholder="Session/trip notes, goals, highlights..."
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
                      <Plus className="h-4 w-4 inline-block mr-2" /> Create Entry
                    </button>
                  </div>
                </div>

                {activeSkateDays.length ? (
                  <div className="mt-4 space-y-3">
                    {activeSkateDays.map((day) => (
                      <div key={day.id} className="rounded-3xl bg-black/30 ring-1 ring-white/10 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-bold">{day.title || "Free Skate"}</div>
                              <Pill tone={day.kind === SKATE_TRIP_KIND ? "warn" : "cyan"}>{day.kind === SKATE_TRIP_KIND ? "Skate Trip" : "Free Skate"}</Pill>
                            </div>
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
                            {activeSkater?.name || participantLabel} attended
                          </label>
                        </div>

                        <textarea
                          value={day.notes || ""}
                          onChange={(e) => updateSkateDayEntry(day.id, { notes: e.target.value })}
                          placeholder="Session notes..."
                          rows={3}
                          className="mt-3 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                        />

                        <div className="mt-3">
                          <label className="cursor-pointer rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/10 inline-flex items-center gap-2">
                            <Upload className="h-4 w-4" /> Upload Session Media
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
                          <div className="mt-2 text-xs text-white/60">No media yet for this entry.</div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 rounded-3xl bg-black/30 ring-1 ring-white/10 p-4 text-sm text-white/70">
                    No free skate entries yet. Add free skate sessions and skate trips here.
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
                    <div className="mt-1 text-xl font-extrabold">{activeSkater?.name || participantLabel} Runs</div>
                    <div className="mt-2 text-sm text-white/60">Track rounds, runs, trick lines, scores, media, and reorder by heat time.</div>
                  </div>
                  <button type="button" onClick={addContestRun} className="rounded-2xl bg-white text-black px-4 py-2 text-sm font-bold hover:bg-white/90">
                    <Plus className="h-4 w-4 inline-block mr-2" /> Add Run
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-5 gap-3">
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
                    <div className="text-xs text-white/60">Park</div>
                    <input
                      value={contestState.eventPark || ""}
                      onChange={(e) => patchContestState({ eventPark: e.target.value })}
                      placeholder="Clairmont Skatepark"
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
                  <div className="rounded-2xl bg-black/30 ring-1 ring-white/10 p-3">
                    <div className="text-xs text-white/60">Division</div>
                    <input
                      value={contestState.eventDivision || ""}
                      onChange={(e) => patchContestState({ eventDivision: e.target.value })}
                      placeholder="Open / Pro / AM"
                      className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2"
                    />
                  </div>
                </div>

                <div className="mt-3 rounded-2xl bg-black/30 ring-1 ring-white/10 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold">Virtual Event Hub</div>
                      <div className="text-xs text-white/60">Host live contest streams, link your nonprofit website, and route members into First Class Skate.</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Pill tone={contestState.liveNow ? "warn" : contestState.virtualEnabled ? "good" : "neutral"}>
                        {contestState.liveNow ? "LIVE NOW" : contestState.virtualEnabled ? "Ready to Go Live" : "Virtual Off"}
                      </Pill>
                      <Pill tone={contestState.liveMembersOnly ? "warn" : "good"}>{contestState.liveMembersOnly ? "Members-only stream" : "Public stream"}</Pill>
                    </div>
                  </div>

                  {canManageAcademy ? (
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <label className="inline-flex items-center gap-2 rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2">
                        <input
                          type="checkbox"
                          checked={!!contestState.virtualEnabled}
                          onChange={(e) => patchContestState({ virtualEnabled: e.target.checked, liveNow: e.target.checked ? contestState.liveNow : false })}
                        />
                        Enable virtual contest
                      </label>
                      <label className="inline-flex items-center gap-2 rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2">
                        <input
                          type="checkbox"
                          checked={!!contestState.liveNow}
                          onChange={(e) => patchContestState({ liveNow: e.target.checked, virtualEnabled: e.target.checked ? true : contestState.virtualEnabled })}
                        />
                        Mark event live now
                      </label>
                      <label className="inline-flex items-center gap-2 rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2">
                        <input
                          type="checkbox"
                          checked={!!contestState.liveMembersOnly}
                          onChange={(e) => patchContestState({ liveMembersOnly: e.target.checked })}
                        />
                        Restrict stream to members
                      </label>
                    </div>
                  ) : (
                    <div className="mt-2 text-xs text-white/60">Owner/Coach/Pro can configure live event settings.</div>
                  )}

                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      value={contestState.liveTitle || ""}
                      onChange={(e) => patchContestState({ liveTitle: e.target.value })}
                      placeholder="Live event title (e.g., Jackalope Finals Live)"
                      className="rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                    />
                    <input
                      value={contestState.liveStreamUrl || ""}
                      onChange={(e) => patchContestState({ liveStreamUrl: e.target.value })}
                      onBlur={(e) => patchContestState({ liveStreamUrl: normalizeExternalUrl(e.target.value) })}
                      placeholder="Live stream URL (YouTube/Vimeo/OBS page)"
                      className="rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                    />
                    <input
                      value={contestState.nonProfitUrl || ""}
                      onChange={(e) => patchContestState({ nonProfitUrl: e.target.value })}
                      onBlur={(e) => patchContestState({ nonProfitUrl: normalizeExternalUrl(e.target.value) })}
                      placeholder="Nonprofit website URL"
                      className="rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                    />
                    <input
                      value={contestState.firstClassMembersUrl || ""}
                      onChange={(e) => patchContestState({ firstClassMembersUrl: e.target.value })}
                      onBlur={(e) => patchContestState({ firstClassMembersUrl: normalizeExternalUrl(e.target.value) })}
                      placeholder="First Class Skate members portal URL (optional)"
                      className="rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => openContestExternalUrl(contestState.liveStreamUrl, "the live stream", { requireMemberAccess: !!contestState.liveMembersOnly })}
                      disabled={!contestState.virtualEnabled || !isOpenableExternalUrl(normalizeExternalUrl(contestState.liveStreamUrl || "")) || (contestState.liveMembersOnly && !contestLiveHasAccess)}
                      className="rounded-xl bg-cyan-500/20 ring-1 ring-cyan-400/30 px-3 py-2 text-xs font-semibold hover:bg-cyan-500/30 text-cyan-100 disabled:opacity-50"
                    >
                      <ExternalLink className="h-4 w-4 inline-block mr-1" />
                      Open Live Stream
                    </button>
                    <button
                      type="button"
                      onClick={() => openContestExternalUrl(contestState.nonProfitUrl, "the nonprofit site")}
                      disabled={!isOpenableExternalUrl(normalizeExternalUrl(contestState.nonProfitUrl || ""))}
                      className="rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/10 disabled:opacity-50"
                    >
                      <ExternalLink className="h-4 w-4 inline-block mr-1" />
                      Open Nonprofit Site
                    </button>
                    <button
                      type="button"
                      onClick={() => switchView("academy")}
                      className="rounded-xl bg-lime-500/20 ring-1 ring-lime-400/30 px-3 py-2 text-xs font-semibold hover:bg-lime-500/30 text-lime-100"
                    >
                      <School className="h-4 w-4 inline-block mr-1" />
                      Open First Class Skate
                    </button>
                    <button
                      type="button"
                      onClick={() => openContestExternalUrl(contestState.firstClassMembersUrl, "the First Class Skate portal", { requireMemberAccess: true })}
                      disabled={!isOpenableExternalUrl(normalizeExternalUrl(contestState.firstClassMembersUrl || "")) || !contestLiveHasAccess}
                      className="rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/10 disabled:opacity-50"
                    >
                      <Lock className="h-4 w-4 inline-block mr-1" />
                      Open Members Portal
                    </button>
                  </div>

                  {contestState.liveMembersOnly && !contestLiveHasAccess ? (
                    <div className="mt-2 rounded-xl bg-amber-500/10 ring-1 ring-amber-400/20 px-3 py-2 text-xs text-amber-100">
                      Members-only live event. Ask owner/coach/pro to add this login to First Class Skate members.
                    </div>
                  ) : null}
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
                          <div className="text-xs text-white/60">Music Link (YouTube Music or Apple Music)</div>
                          <div className="mt-2 grid grid-cols-1 sm:grid-cols-4 gap-2">
                            <input
                              value={run.musicUrl || ""}
                              onChange={(e) => updateContestRun(run.id, { musicUrl: e.target.value })}
                              onBlur={(e) => updateContestRun(run.id, { musicUrl: normalizeExternalUrl(e.target.value) })}
                              placeholder="Paste YouTube Music / Apple Music URL"
                              className="sm:col-span-2 rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => setContestRunMusicLink(run.id, "youtube")}
                              className="rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/10"
                            >
                              <Search className="h-4 w-4 inline-block mr-1" />
                              YouTube Music
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

                        <div className="mt-3 rounded-2xl bg-white/5 ring-1 ring-white/10 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <div className="text-sm font-semibold">Video Run Builder</div>
                              <div className="text-xs text-white/60">Build a timed storyboard from uploaded/session/coach clips.</div>
                            </div>
                            <Pill tone="cyan">Timeline {linePlanTotalSec(run).toFixed(1)}s</Pill>
                          </div>
                          <div className="mt-2 grid grid-cols-1 sm:grid-cols-10 gap-2">
                            <select
                              value={run.lineDraftSourceKey || ""}
                              onChange={(e) => updateContestRun(run.id, { lineDraftSourceKey: e.target.value })}
                              className="sm:col-span-8 rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                            >
                              <option value="">Pick source clip</option>
                              {contestRunClipOptions(run).map((opt) => (
                                <option key={`run-opt-${run.id}-${opt.key}`} value={opt.key}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => addContestLineSegment(run.id, run.lineDraftSourceKey || "")}
                              className="sm:col-span-2 rounded-xl bg-cyan-500/20 ring-1 ring-cyan-400/30 px-3 py-2 text-xs font-semibold text-cyan-100 hover:bg-cyan-500/30"
                            >
                              Add Segment
                            </button>
                          </div>
                          <div className="mt-2 space-y-2">
                            {toArray(run.linePlan).map((seg, segIdx) => {
                              const clip = contestClipFromSource(run, seg.sourceKey);
                              return (
                                <div key={seg.id} className="rounded-xl bg-black/30 ring-1 ring-white/10 p-2">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <div className="text-xs text-white/70">#{segIdx + 1}</div>
                                    <input
                                      value={seg.title || ""}
                                      onChange={(e) => updateContestLineSegment(run.id, seg.id, { title: e.target.value })}
                                      placeholder="Segment title"
                                      className="flex-1 min-w-[180px] rounded-lg bg-black/40 border border-white/10 px-2 py-1 text-xs"
                                    />
                                    <input
                                      value={seg.startSec ?? 0}
                                      onChange={(e) => updateContestLineSegment(run.id, seg.id, { startSec: Number(e.target.value) || 0 })}
                                      inputMode="decimal"
                                      placeholder="Start"
                                      className="w-20 rounded-lg bg-black/40 border border-white/10 px-2 py-1 text-xs"
                                    />
                                    <input
                                      value={seg.endSec ?? 3}
                                      onChange={(e) => updateContestLineSegment(run.id, seg.id, { endSec: Number(e.target.value) || 0 })}
                                      inputMode="decimal"
                                      placeholder="End"
                                      className="w-20 rounded-lg bg-black/40 border border-white/10 px-2 py-1 text-xs"
                                    />
                                    <div className="text-xs text-cyan-200">{lineSegmentDurationSec(seg).toFixed(1)}s</div>
                                    <button type="button" onClick={() => moveContestLineSegment(run.id, seg.id, -1)} className="rounded-lg bg-white/5 ring-1 ring-white/10 px-2 py-1 text-xs hover:bg-white/10">
                                      <ChevronUp className="h-3.5 w-3.5" />
                                    </button>
                                    <button type="button" onClick={() => moveContestLineSegment(run.id, seg.id, +1)} className="rounded-lg bg-white/5 ring-1 ring-white/10 px-2 py-1 text-xs hover:bg-white/10">
                                      <ChevronDown className="h-3.5 w-3.5" />
                                    </button>
                                    <button type="button" onClick={() => removeContestLineSegment(run.id, seg.id)} className="rounded-lg bg-white/5 ring-1 ring-white/10 px-2 py-1 text-xs hover:bg-white/10">
                                      <X className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                  <div className="mt-1 text-[11px] text-white/60 truncate">
                                    Source: {clip?.label || "Source clip missing"}{clip?.media?.name ? ` • ${clip.media.name}` : ""}
                                  </div>
                                </div>
                              );
                            })}
                            {!toArray(run.linePlan).length ? <div className="text-xs text-white/60">No segments yet. Add clips to build the run timeline.</div> : null}
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => startRunTimer({ ...run, durationSec: Math.max(5, Math.round(linePlanTotalSec(run) || run.durationSec || 45)) })}
                              className="rounded-xl bg-amber-500/20 ring-1 ring-amber-400/30 px-3 py-2 text-xs font-semibold text-amber-100 hover:bg-amber-500/30"
                            >
                              Start Timeline Timer
                            </button>
                            <div className="text-xs text-white/60">
                              Timeline uses segment durations; tune Start/End seconds to simulate full run timing.
                            </div>
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

          {ui.view === "academy" && roleAllowedViews.has("academy") ? (
            <motion.div key="academy" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-4">
              <div className="rounded-3xl bg-white/5 ring-1 ring-white/10 p-5 sm:p-7">
                <div
                  className="relative overflow-hidden rounded-3xl ring-1 p-4 sm:p-5"
                  style={{
                    backgroundColor: academyCardColor,
                    color: academyTextColor,
                    borderColor: `${academyAccentColor}66`,
                    backgroundImage: academyBranding.bannerUrl
                      ? `linear-gradient(135deg, rgba(2,6,23,0.85) 0%, rgba(2,6,23,0.35) 100%), url(${academyBranding.bannerUrl})`
                      : `linear-gradient(135deg, ${academyCardColor} 0%, #020617 100%)`,
                    backgroundSize: academyBranding.bannerUrl ? "cover" : undefined,
                    backgroundPosition: academyBranding.bannerUrl ? "center" : undefined,
                  }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs tracking-widest opacity-80">LEARNING ACADEMY</div>
                      <div className="mt-1 flex items-center gap-3">
                        {academyBranding.logoUrl ? (
                          <div className="h-14 w-14 overflow-hidden rounded-2xl ring-1 ring-white/20 bg-black/40">
                            <img src={academyBranding.logoUrl} alt="Academy logo" className="h-full w-full object-cover" />
                          </div>
                        ) : null}
                        <div className="min-w-0">
                          <div className="text-xl font-extrabold truncate">{academyState.programName || "First Class Skate"}</div>
                          {academyBranding.subtitle ? <div className="text-xs opacity-85 mt-0.5">{academyBranding.subtitle}</div> : null}
                        </div>
                      </div>
                      <div className="mt-2 text-sm opacity-90">
                        Members-only video lessons. Kiko/pro team can upload curriculum and sessions for this {participantLabelLower}.
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Pill tone={academyState.enabled ? "good" : "warn"}>{academyState.enabled ? "Program Live" : "Program Hidden"}</Pill>
                      <Pill tone={academyState.membersOnly ? "warn" : "neutral"}>{academyState.membersOnly ? "Members Only" : "Open Access"}</Pill>
                      <Pill tone="cyan">{toArray(academyState.courses).length} lesson(s)</Pill>
                    </div>
                  </div>
                </div>

                {canManageAcademy ? (
                  <div className="mt-4 rounded-3xl bg-black/30 ring-1 ring-white/10 p-4">
                    <div className="text-sm font-semibold">Program Controls</div>
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <label className="inline-flex items-center gap-2 rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-xs">
                        <input type="checkbox" checked={!!academyState.enabled} onChange={(e) => patchAcademyState({ enabled: e.target.checked })} />
                        Enable program
                      </label>
                      <label className="inline-flex items-center gap-2 rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-xs">
                        <input type="checkbox" checked={!!academyState.membersOnly} onChange={(e) => patchAcademyState({ membersOnly: e.target.checked })} />
                        Members-only access
                      </label>
                    </div>
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <div className="text-xs text-white/60">Program Name</div>
                        <input
                          value={academyState.programName || ""}
                          onChange={(e) => patchAcademyState({ programName: e.target.value })}
                          placeholder="First Class Skate"
                          className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <div className="text-xs text-white/60">Subtitle / Tagline</div>
                        <input
                          value={academyBranding.subtitle || ""}
                          onChange={(e) => patchAcademyBranding({ subtitle: e.target.value })}
                          placeholder="Train smart. Skate with purpose."
                          className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                        />
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl bg-black/30 ring-1 ring-white/10 p-3">
                      <div className="text-xs font-semibold tracking-wide text-white/80">Brand Personalization</div>
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                        <label className="cursor-pointer rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/10">
                          Upload Logo
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => setAcademyBrandAsset("logoUrl", e.target.files)} />
                        </label>
                        <label className="cursor-pointer rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/10">
                          Upload Banner
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => setAcademyBrandAsset("bannerUrl", e.target.files)} />
                        </label>
                        <button
                          type="button"
                          onClick={() => clearAcademyBrandAsset("logoUrl")}
                          className="rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/10"
                        >
                          Clear Logo
                        </button>
                        <button
                          type="button"
                          onClick={() => clearAcademyBrandAsset("bannerUrl")}
                          className="rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/10"
                        >
                          Clear Banner
                        </button>
                      </div>
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <label className="rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-xs">
                          Accent Color
                          <input
                            type="color"
                            value={academyAccentColor}
                            onChange={(e) => patchAcademyBranding({ accentColor: e.target.value })}
                            className="mt-1 h-9 w-full rounded-lg bg-transparent"
                          />
                        </label>
                        <label className="rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-xs">
                          Card Color
                          <input
                            type="color"
                            value={academyCardColor}
                            onChange={(e) => patchAcademyBranding({ cardColor: e.target.value })}
                            className="mt-1 h-9 w-full rounded-lg bg-transparent"
                          />
                        </label>
                        <label className="rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-xs">
                          Text Color
                          <input
                            type="color"
                            value={academyTextColor}
                            onChange={(e) => patchAcademyBranding({ textColor: e.target.value })}
                            className="mt-1 h-9 w-full rounded-lg bg-transparent"
                          />
                        </label>
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl bg-black/30 ring-1 ring-white/10 p-3">
                      <div className="text-xs font-semibold tracking-wide text-white/80">Fee-Based System</div>
                      <label className="mt-2 inline-flex items-center gap-2 rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-xs">
                        <input type="checkbox" checked={!!academyFees.enabled} onChange={(e) => patchAcademyFees({ enabled: e.target.checked })} />
                        Enable paid memberships
                      </label>
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                        <select
                          value={normalizeCurrencyCode(academyFees.currency, "USD")}
                          onChange={(e) => patchAcademyFees({ currency: normalizeCurrencyCode(e.target.value, "USD") })}
                          className="rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                        >
                          {["USD", "CAD", "MXN", "EUR", "GBP", "JPY", "KRW", "PHP", "THB", "AUD", "NZD"].map((code) => (
                            <option key={`ac-fee-currency-${code}`} value={code}>
                              {code}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={String(academyFees.monthlyPrice ?? 0)}
                          onChange={(e) => patchAcademyFees({ monthlyPrice: normalizeMoneyAmount(e.target.value, 0) })}
                          placeholder="Monthly"
                          className="rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                        />
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={String(academyFees.yearlyPrice ?? 0)}
                          onChange={(e) => patchAcademyFees({ yearlyPrice: normalizeMoneyAmount(e.target.value, 0) })}
                          placeholder="Yearly"
                          className="rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                        />
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={String(academyFees.dropInPrice ?? 0)}
                          onChange={(e) => patchAcademyFees({ dropInPrice: normalizeMoneyAmount(e.target.value, 0) })}
                          placeholder="Drop-in"
                          className="rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                        />
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={String(academyFees.privateLessonPrice ?? 0)}
                          onChange={(e) => patchAcademyFees({ privateLessonPrice: normalizeMoneyAmount(e.target.value, 0) })}
                          placeholder="Private Lesson"
                          className="rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-5 gap-2">
                        <input
                          value={academyFees.paymentUrl || ""}
                          onChange={(e) => patchAcademyFees({ paymentUrl: e.target.value })}
                          onBlur={(e) => patchAcademyFees({ paymentUrl: normalizeExternalUrl(e.target.value) })}
                          placeholder="Payment URL (PayPal/Stripe checkout)"
                          className="sm:col-span-4 rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                        />
                        <button
                          type="button"
                          onClick={openAcademyPaymentLink}
                          disabled={!isOpenableExternalUrl(normalizeExternalUrl(academyFees.paymentUrl || ""))}
                          className="rounded-xl bg-emerald-500/20 ring-1 ring-emerald-400/30 px-3 py-2 text-xs font-semibold hover:bg-emerald-500/30 text-emerald-100 disabled:opacity-50"
                        >
                          <ExternalLink className="h-4 w-4 inline-block mr-1" />
                          Open Pay Link
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        value={academyFees.notes || ""}
                        onChange={(e) => patchAcademyFees({ notes: e.target.value })}
                        placeholder="Fee notes (billing cycle, refund terms, family discounts)."
                        className="mt-2 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                      />
                      <div className="mt-2 text-[11px] text-white/60">
                        Pricing preview: Monthly {formatAcademyPrice(academyFees.monthlyPrice)} • Yearly {formatAcademyPrice(academyFees.yearlyPrice)} • Drop-in{" "}
                        {formatAcademyPrice(academyFees.dropInPrice)} • Private {formatAcademyPrice(academyFees.privateLessonPrice)}
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="text-xs text-white/60">Member Access</div>
                      <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {members.map((m) => {
                          const checked = toArray(academyState.memberIds).includes(String(m.id));
                          return (
                            <label key={`ac-m-${m.id}`} className="inline-flex items-center gap-2 rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-xs">
                              <input type="checkbox" checked={checked} onChange={(e) => toggleAcademyMember(m.id, e.target.checked)} />
                              {m.name} • {roleDisplayLabel(m.role)}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : null}

                {!academyState.enabled ? (
                  <div className="mt-4 rounded-3xl bg-black/30 ring-1 ring-white/10 p-4 text-sm text-white/70">
                    This academy is currently hidden. Ask owner/coach/pro to enable it.
                  </div>
                ) : academyHasAccess ? (
                  <>
                    {academyFees.enabled ? (
                      <div className="mt-4 rounded-3xl ring-1 p-4" style={{ borderColor: `${academyAccentColor}55`, backgroundColor: `${academyCardColor}66` }}>
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <div className="text-sm font-semibold">Membership & Fees</div>
                            <div className="text-xs text-white/70 mt-1">
                              Monthly {formatAcademyPrice(academyFees.monthlyPrice)} • Yearly {formatAcademyPrice(academyFees.yearlyPrice)} • Drop-in{" "}
                              {formatAcademyPrice(academyFees.dropInPrice)} • Private {formatAcademyPrice(academyFees.privateLessonPrice)}
                            </div>
                            {academyFees.notes ? <div className="text-xs text-white/60 mt-2">{academyFees.notes}</div> : null}
                          </div>
                          <button
                            type="button"
                            onClick={openAcademyPaymentLink}
                            disabled={!isOpenableExternalUrl(normalizeExternalUrl(academyFees.paymentUrl || ""))}
                            className="rounded-xl bg-emerald-500/20 ring-1 ring-emerald-400/30 px-3 py-2 text-xs font-semibold hover:bg-emerald-500/30 text-emerald-100 disabled:opacity-50"
                          >
                            <ExternalLink className="h-4 w-4 inline-block mr-1" />
                            Join / Pay
                          </button>
                        </div>
                      </div>
                    ) : null}

                    {canManageAcademy ? (
                      <div className="mt-4 rounded-3xl bg-black/30 ring-1 ring-white/10 p-4">
                        <div className="text-sm font-semibold">Add Lesson</div>
                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-12 gap-2">
                          <input
                            value={academyDraft.title}
                            onChange={(e) => setAcademyDraft((prev) => ({ ...prev, title: e.target.value }))}
                            placeholder="Lesson title"
                            className="sm:col-span-4 rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                          />
                          <input
                            value={academyDraft.level}
                            onChange={(e) => setAcademyDraft((prev) => ({ ...prev, level: e.target.value }))}
                            placeholder="Level (Beginner/Intermediate/Advanced)"
                            className="sm:col-span-3 rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                          />
                          <input
                            value={academyDraft.summary}
                            onChange={(e) => setAcademyDraft((prev) => ({ ...prev, summary: e.target.value }))}
                            placeholder="Lesson summary"
                            className="sm:col-span-5 rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                          />
                        </div>
                        <div className="mt-3">
                          <label className="cursor-pointer rounded-2xl bg-white text-black px-4 py-2 text-sm font-bold hover:bg-white/90 inline-flex items-center gap-2">
                            <Upload className="h-4 w-4" /> Upload Lesson Media
                            <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={(e) => addAcademyCourseFromFiles(e.target.files)} />
                          </label>
                        </div>
                      </div>
                    ) : null}

                    <div className="mt-4 space-y-3">
                      {toArray(academyState.courses).map((course) => (
                        <div key={course.id} className="rounded-3xl bg-black/30 ring-1 ring-white/10 p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="text-sm font-bold">{course.title}</div>
                              <div className="text-xs text-white/60">{course.level || "All Levels"}{course.summary ? ` • ${course.summary}` : ""}</div>
                              <div className="text-[11px] text-white/50 mt-1">By {course.createdBy || "Coach/Pro"} • {formatDateTime(course.createdAt)}</div>
                            </div>
                            {canManageAcademy ? (
                              <button type="button" onClick={() => removeAcademyCourse(course.id)} className="rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-xs hover:bg-white/10">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            ) : null}
                          </div>
                          {(course.media || []).length ? (
                            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                              {(course.media || []).map((m) => (
                                <div key={m.id} className="relative rounded-xl overflow-hidden bg-black ring-1 ring-white/10">
                                  <div className="aspect-square">
                                    {m.type?.startsWith("video/") ? (
                                      <video src={mediaSrc(m)} className="h-full w-full object-cover" controls playsInline />
                                    ) : (
                                      <img src={mediaSrc(m)} alt={m.name} className="h-full w-full object-cover" />
                                    )}
                                  </div>
                                  {canManageAcademy ? (
                                    <button
                                      type="button"
                                      onClick={() => removeAcademyMedia(course.id, m.id)}
                                      className="absolute top-1 right-1 rounded-full bg-black/70 ring-1 ring-white/10 p-1"
                                      title="Remove media"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </button>
                                  ) : null}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="mt-2 text-xs text-white/60">No media attached yet.</div>
                          )}
                        </div>
                      ))}
                      {!toArray(academyState.courses).length ? (
                        <div className="rounded-3xl bg-black/30 ring-1 ring-white/10 p-4 text-sm text-white/70">
                          No lessons published yet.
                        </div>
                      ) : null}
                    </div>
                  </>
                ) : (
                  <div className="mt-4 rounded-3xl bg-black/30 ring-1 ring-white/10 p-4">
                    <div className="inline-flex items-center gap-2 rounded-xl bg-amber-500/15 ring-1 ring-amber-500/20 px-3 py-2 text-amber-100">
                      <Lock className="h-4 w-4" /> Members-only content
                    </div>
                    <div className="mt-2 text-sm text-white/70">
                      Access is restricted. Ask owner/coach/pro to add your login to academy members.
                    </div>
                    {academyFees.enabled ? (
                      <div className="mt-3 rounded-2xl bg-black/30 ring-1 ring-white/10 p-3">
                        <div className="text-xs text-white/80">
                          Pricing: Monthly {formatAcademyPrice(academyFees.monthlyPrice)} • Yearly {formatAcademyPrice(academyFees.yearlyPrice)} • Drop-in{" "}
                          {formatAcademyPrice(academyFees.dropInPrice)}
                        </div>
                        <button
                          type="button"
                          onClick={openAcademyPaymentLink}
                          disabled={!isOpenableExternalUrl(normalizeExternalUrl(academyFees.paymentUrl || ""))}
                          className="mt-2 rounded-xl bg-emerald-500/20 ring-1 ring-emerald-400/30 px-3 py-2 text-xs font-semibold hover:bg-emerald-500/30 text-emerald-100 disabled:opacity-50"
                        >
                          <ExternalLink className="h-4 w-4 inline-block mr-1" />
                          Membership Payment
                        </button>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </motion.div>
          ) : null}

          {ui.view === "team" && roleAllowedViews.has("team") ? (
            <motion.div key="team" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-4">
              <div className="rounded-3xl bg-white/5 ring-1 ring-white/10 p-5 sm:p-7">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs tracking-widest text-white/50">ACCESS</div>
                    <div className="mt-1 text-xl font-extrabold">Coach + Dad + Pro</div>
                    <div className="mt-2 text-sm text-white/60">Owner can manage team + profiles.</div>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl bg-black/30 ring-1 ring-white/10 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold">Program Profile</div>
                    <Pill tone={isHighSchoolProgram ? "warn" : programProfile.enabled ? "good" : "neutral"}>
                      {programProfile.enabled ? (isHighSchoolProgram ? "High School" : programTypeLabel) : "Family Mode"}
                    </Pill>
                  </div>
                  <div className="mt-2 text-xs text-white/65">
                    {programProfile.enabled
                      ? `${programProfile.schoolName || "School not set"}${programProfile.teamName ? ` • ${programProfile.teamName}` : ""} • ${programLevelLabel}${
                          programProfile.cityState ? ` • ${programProfile.cityState}` : ""
                        }`
                      : "Enable School + Team Mode in Settings to set a school/team profile."}
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
                          const role = normalizeMemberRole(prompt(`Role (owner/coach/dad/proskater/media/skater)${skaterRoleHint}:`, "dad"), "dad");
                          const pin = sanitizePin(prompt("Set PIN (required, exactly 4 digits):", "") || "");
                          if (pin.length !== 4) {
                            alert("PIN must be exactly 4 digits.");
                            return;
                          }
                          const m = { id: `m-${uid()}`, name: name.trim(), role, pin, photoUrl: "", biometricCredentialId: "" };
                          setSlice({ members: [...members, m] });
                          toast("Member added", `${m.name} (${roleDisplayLabel(m.role)}) added.`, "success");
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
                                <div className="text-xs text-white/60 mt-1">Role: {roleDisplayLabel(m.role)} • PIN: {m.pin ? "set" : "missing"}</div>
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
                                  const nextRoleInput = prompt(`Role (owner/coach/dad/proskater/media/skater)${skaterRoleHint}:`, m.role);
                                  if (nextRoleInput == null) return;
                                  const nextRole = normalizeMemberRole(nextRoleInput, m.role || "dad");
                                  if (!nextRole) return;
                                  setSlice({ members: members.map((x) => (x.id === m.id ? { ...x, role: nextRole } : x)) });
                                  toast("Role updated", `${m.name} → ${nextRole}`, "info");
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
                  <div className="text-sm font-semibold">{participantPluralLabel} Profiles</div>
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
                      <Plus className="h-4 w-4 inline-block mr-2" /> Add {participantLabel}
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
                    <div className="mt-1 text-xl font-extrabold">{activeSkater?.name || participantLabel} Chat</div>
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
                              <span className="font-bold text-white">{m.by || ""}</span> • {roleDisplayLabel(m.role)}
                            </div>
                            <div className="text-[11px] text-white/40">{formatDateTime(m.at)}</div>
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
                          if (!confirm(`Clear chat for this ${participantLabelLower} on this device?`)) return;
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

          {ui.view === "profeedback" && proFeedbackAvailable ? (
            <motion.div key="profeedback" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-4">
              <div className="rounded-3xl bg-gradient-to-br from-zinc-950 via-black to-zinc-900 p-5 sm:p-7 shadow-2xl ring-1 ring-white/10 text-white">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs tracking-widest text-white/50">SKATEBOARDING ONLY</div>
                    <div className="mt-1 text-xl font-extrabold">Pro Feedback • {activeSkater?.name || participantLabel}</div>
                    <div className="mt-2 text-sm text-white/60">
                      {isProSkaterMember
                        ? "Review and respond to requests across all skaters from your pro login."
                        : "Submit clip links and questions for a paid pro review. Family payments go to owner first; pro payout is weekly."}
                    </div>
                  </div>
                  <Pill tone="warn">
                    <Crown className="h-3.5 w-3.5" /> ${proFeedbackPriceUsd}
                  </Pill>
                </div>

                <div className="mt-4 rounded-2xl bg-white/5 ring-1 ring-white/10 p-4">
                  <div className="text-xs text-white/70">{String(proFeedback.instructions || "").trim() || "Paid pro review requests for skateboarding."}</div>
                  {isOpenableExternalUrl(proFeedbackDefaultPayment.url) ? (
                    <a
                      href={proFeedbackDefaultPayment.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white text-black px-3 py-2 text-xs font-bold hover:bg-white/90"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      {proFeedbackDefaultPayment.provider === "paypal" ? "Open PayPal" : "Open Payment Link"}
                    </a>
                  ) : null}
                </div>

                {!isProSkaterMember ? (
                  <div className="mt-4 rounded-2xl bg-black/30 ring-1 ring-white/10 p-4">
                    <div className="text-sm font-semibold">New Request</div>
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        value={proFeedbackDraft.title}
                        onChange={(e) => setProFeedbackDraft((p) => ({ ...p, title: e.target.value }))}
                        placeholder="Request title (e.g., Frontside Air)"
                        className="rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                      />
                      <select
                        value={proFeedbackDraft.preferredResponse}
                        onChange={(e) => setProFeedbackDraft((p) => ({ ...p, preferredResponse: e.target.value }))}
                        className="rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                      >
                        <option value="Video breakdown">Video breakdown</option>
                        <option value="Written notes">Written notes</option>
                        <option value="Voice note">Voice note</option>
                      </select>
                      <input
                        value={proFeedbackDraft.clipUrl}
                        onChange={(e) => setProFeedbackDraft((p) => ({ ...p, clipUrl: e.target.value }))}
                        placeholder="Optional clip URL"
                        className="sm:col-span-2 rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                      />
                      <textarea
                        value={proFeedbackDraft.question}
                        onChange={(e) => setProFeedbackDraft((p) => ({ ...p, question: e.target.value }))}
                        rows={3}
                        placeholder="What should the pro review?"
                        className="sm:col-span-2 rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={submitProFeedbackRequest}
                        className="rounded-2xl bg-white text-black px-4 py-2 text-sm font-bold hover:bg-white/90"
                      >
                        Submit Paid Request
                      </button>
                      <div className="text-xs text-white/60">
                        Charge ${proFeedbackPriceUsd}: ${proFeedbackOwnerShareUsd} owner / ${proFeedbackProShareUsd} pro • Payout {proFeedbackWeeklyPayoutDay}
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="mt-4 space-y-3">
                  {visibleProFeedbackRequests.length ? (
                    visibleProFeedbackRequests.map((item) => {
                      const requestChargeUsd = Math.max(0, Number(item.chargeUsd) || 0);
                      const requestOwnerShareUsd = Math.max(
                        0,
                        Math.min(
                          requestChargeUsd,
                          Number.isFinite(Number(item.ownerShareUsd)) ? Number(item.ownerShareUsd) : proFeedbackOwnerShareUsd
                        )
                      );
                      const requestProShareUsd = Math.max(0, Number((requestChargeUsd - requestOwnerShareUsd).toFixed(2)));
                      const requestPaymentDetails = isOpenableExternalUrl(item.paymentUrl)
                        ? { url: item.paymentUrl, provider: item.paymentProvider === "paypal" ? "paypal" : /paypal/i.test(item.paymentUrl || "") ? "paypal" : "external" }
                        : buildProFeedbackPaymentDetails(
                            proFeedback,
                            requestChargeUsd || proFeedbackPriceUsd,
                            `${item.skaterName || activeSkater?.name || "Skater"} - ${item.title || "Pro Feedback"}`
                          );
                      return (
                        <div key={item.id} className="rounded-2xl bg-black/30 ring-1 ring-white/10 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <div className="text-sm font-bold">{item.title || "Feedback Request"}</div>
                            <div className="text-xs text-white/60">
                              {item.skaterName || skaters.find((s) => s.id === item.skaterId)?.name || activeSkater?.name || participantLabel} • {formatDateTime(item.createdAt)} • by{" "}
                              {item.requestedBy || "Team"}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Pill tone={item.paymentStatus === "paid" ? "good" : "warn"}>{item.paymentStatus === "paid" ? "Paid" : "Unpaid"}</Pill>
                            <Pill tone={String(item.payoutStatus || "pending") === "sent" ? "good" : "neutral"}>
                              {String(item.payoutStatus || "pending") === "sent" ? "Pro Paid" : "Pro Payout Pending"}
                            </Pill>
                            <Pill tone={item.status === "delivered" || item.status === "closed" ? "good" : item.status === "in-review" ? "cyan" : "neutral"}>
                              {String(item.status || "pending")}
                            </Pill>
                          </div>
                        </div>
                        {item.question ? <div className="mt-2 text-sm text-white/80 whitespace-pre-wrap">{item.question}</div> : null}
                        {isOpenableExternalUrl(item.clipUrl) ? (
                          <a href={item.clipUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-cyan-200 hover:text-cyan-100">
                            <ExternalLink className="h-3.5 w-3.5" />
                            Open Clip
                          </a>
                        ) : null}
                        {isOpenableExternalUrl(requestPaymentDetails.url) ? (
                          <a
                            href={requestPaymentDetails.url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 ml-3 inline-flex items-center gap-1 text-xs text-emerald-200 hover:text-emerald-100"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            {requestPaymentDetails.provider === "paypal" ? "Pay with PayPal" : "Open Payment Link"}
                          </a>
                        ) : null}
                        <div className="mt-2 text-xs text-white/60">
                          Preferred response: {item.preferredResponse || "Any"} • Charge ${requestChargeUsd} • Split ${requestOwnerShareUsd} owner / ${requestProShareUsd} pro
                        </div>
                        {String(item.payoutStatus || "pending") === "sent" ? (
                          <div className="mt-1 text-[11px] text-emerald-200">
                            Pro payout sent {item.payoutSentAt ? formatDateTime(item.payoutSentAt) : ""} {item.payoutSentByName ? `by ${item.payoutSentByName}` : ""}
                          </div>
                        ) : (
                          <div className="mt-1 text-[11px] text-white/50">Pro payout scheduled for weekly batch ({proFeedbackWeeklyPayoutDay}).</div>
                        )}

                        {canManageProFeedback ? (
                          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {canManageProBilling ? (
                              <select
                                value={item.paymentStatus || "unpaid"}
                                onChange={(e) => patchProFeedbackRequest(item.id, { paymentStatus: e.target.value }, item.skaterId)}
                                className="rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-xs"
                              >
                                <option value="unpaid">Unpaid</option>
                                <option value="paid">Paid</option>
                              </select>
                            ) : null}
                            <select
                              value={item.status || "pending"}
                              onChange={(e) => patchProFeedbackRequest(item.id, { status: e.target.value }, item.skaterId)}
                              className="rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-xs"
                            >
                              <option value="pending">pending</option>
                              <option value="in-review">in-review</option>
                              <option value="delivered">delivered</option>
                              <option value="closed">closed</option>
                            </select>
                            {canManageProPayout ? (
                              <select
                                value={String(item.payoutStatus || "pending") === "sent" ? "sent" : "pending"}
                                onChange={(e) => patchProFeedbackRequest(item.id, { payoutStatus: e.target.value }, item.skaterId)}
                                className="rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-xs"
                              >
                                <option value="pending">payout pending</option>
                                <option value="sent">payout sent</option>
                              </select>
                            ) : null}
                            {canDeleteProFeedbackRequest ? (
                              <button
                                type="button"
                                onClick={() => removeProFeedbackRequest(item.id, item.skaterId)}
                                className="rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/10"
                              >
                                Delete
                              </button>
                            ) : null}
                            <textarea
                              value={String(item.proReply || "")}
                              onChange={(e) => patchProFeedbackRequest(item.id, { proReply: e.target.value }, item.skaterId)}
                              placeholder="Pro response / notes"
                              rows={2}
                              className="sm:col-span-3 rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-xs"
                            />
                          </div>
                        ) : item.proReply ? (
                          <div className="mt-3 rounded-xl bg-white/5 ring-1 ring-white/10 p-3 text-xs whitespace-pre-wrap">
                            {item.proReply}
                            {item.reviewedByName ? <div className="mt-2 text-[11px] text-white/60">Reviewed by {item.reviewedByName}</div> : null}
                          </div>
                        ) : null}
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-2xl bg-black/30 ring-1 ring-white/10 p-4 text-sm text-white/60">
                      {isProSkaterMember ? "No pro feedback requests are queued yet." : "No pro feedback requests yet."}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : null}

          {ui.view === "settings" && roleAllowedViews.has("settings") ? (
            <motion.div key="settings" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-4">
              <div className={settingsPanelClass}>
                <div>
                  <div className={`text-xs tracking-widest ${isLightMode ? "text-slate-500" : "text-white/50"}`}>SETTINGS</div>
                  <div className="mt-1 text-xl font-extrabold">Backup, Theme, and Device Setup</div>
                </div>

                <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <div className={settingsCardClass}>
                    <div className="text-sm font-semibold">{tx("settings.theme.title", "Theme")}</div>
                    <div className={settingsMutedTextClass}>{tx("settings.theme.detail", "Switch between dark and light mode.")}</div>
                    <button
                      type="button"
                      onClick={toggleTheme}
                      className="mt-3 rounded-2xl bg-white text-black px-4 py-2 text-sm font-bold hover:bg-white/90"
                    >
                      {isLightMode ? tx("settings.theme.dark", "Use Dark Mode") : tx("settings.theme.light", "Use Light Mode")}
                    </button>
                  </div>

                  <div className={settingsCardClass}>
                    <div className="text-sm font-semibold">{tx("settings.language.title", "Language")}</div>
                    <div className={settingsMutedTextClass}>{tx("settings.language.detail", "Set app language for labels and timestamps.")}</div>
                    <div className="mt-3">
                      <label className={settingsMutedTextClass}>{tx("settings.language.label", "App language")}</label>
                      <select
                        value={uiLanguagePref}
                        onChange={(e) => setLanguagePreference(e.target.value)}
                        className={
                          "mt-2 w-full rounded-xl border px-3 py-2 text-sm " +
                          (isLightMode ? "bg-white border-slate-300 text-slate-900" : "bg-black/40 border-white/10 text-white")
                        }
                      >
                        {UI_LANGUAGE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="mt-3">
                      <div className={settingsMutedTextClass}>Custom translation overrides (JSON for current language: {uiLanguage})</div>
                      <textarea
                        value={languageOverrideDraft}
                        onChange={(e) => setLanguageOverrideDraft(e.target.value)}
                        rows={8}
                        className={
                          "mt-2 w-full rounded-xl border px-3 py-2 text-xs font-mono " +
                          (isLightMode ? "bg-white border-slate-300 text-slate-900" : "bg-black/40 border-white/10 text-white")
                        }
                      />
                      <div className="mt-2 text-[11px] text-white/60">
                        Example keys: <code>tabs.log</code>, <code>tabs.plans</code>, <code>settings.theme.title</code>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button type="button" onClick={saveLanguageOverrideDraft} className={settingsGhostBtnClass}>
                          Save Overrides
                        </button>
                        <button type="button" onClick={clearLanguageOverrideDraft} className={settingsGhostBtnClass}>
                          Clear Overrides
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className={settingsCardClass}>
                    <div className="text-sm font-semibold">Personalize Background</div>
                    <div className={settingsMutedTextClass}>Set a custom background per login profile. Great for athletes, parents, and coaches sharing one device.</div>
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {BACKGROUND_PRESETS.map((preset) => (
                        <button
                          key={preset.key}
                          type="button"
                          onClick={() => applyBackgroundPreset(preset.key)}
                          className={`rounded-xl border px-2 py-2 text-[11px] font-semibold ${
                            activeBackgroundPref.mode === "preset" && activeBackgroundPref.presetKey === preset.key
                              ? isLightMode
                                ? "border-slate-900 bg-slate-900 text-white"
                                : "border-white bg-white text-black"
                              : isLightMode
                              ? "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                              : "border-white/10 bg-black/40 text-white/90 hover:bg-white/10"
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <label className={`cursor-pointer ${settingsGhostBtnClass}`}>
                        <Upload className="h-4 w-4 inline-block mr-2" /> Upload Image
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadBackgroundImage(e.target.files?.[0])} />
                      </label>
                      <button type="button" onClick={clearBackgroundPersonalization} className={settingsGhostBtnClass}>
                        Reset Default
                      </button>
                    </div>
                    <div className="mt-3">
                      <div className={settingsMutedTextClass}>Image layout</div>
                      <div className="mt-2 inline-flex rounded-xl p-1 ring-1 ring-white/10 bg-black/20">
                        <button
                          type="button"
                          onClick={() => setBackgroundImageLayout("fit")}
                          disabled={!activeBackgroundPref.imageUrl}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                            backgroundImageLayout === "fit"
                              ? isLightMode
                                ? "bg-slate-900 text-white"
                                : "bg-white text-black"
                              : isLightMode
                              ? "text-slate-700 hover:bg-white/80"
                              : "text-white/80 hover:bg-white/10"
                          } disabled:opacity-40`}
                        >
                          Fit Screen
                        </button>
                        <button
                          type="button"
                          onClick={() => setBackgroundImageLayout("tile")}
                          disabled={!activeBackgroundPref.imageUrl}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                            backgroundImageLayout === "tile"
                              ? isLightMode
                                ? "bg-slate-900 text-white"
                                : "bg-white text-black"
                              : isLightMode
                              ? "text-slate-700 hover:bg-white/80"
                              : "text-white/80 hover:bg-white/10"
                          } disabled:opacity-40`}
                        >
                          Tile
                        </button>
                      </div>
                    </div>
                    <div className={settingsMutedTextClass}>
                      Current profile: {activeMember?.name || "User"} • Mode:{" "}
                      {activeBackgroundPref.mode === "image" ? "Custom Image" : activeBackgroundPref.mode === "preset" ? "Preset" : "Default"}
                    </div>
                    <div className={settingsMutedTextClass}>Uploaded images are auto-resized and can display as fit-screen or tiled wallpaper.</div>
                  </div>

                  <div className={settingsCardClass}>
                    <div className="text-sm font-semibold">School + Team Mode</div>
                    <div className={settingsMutedTextClass}>Enable school/team operations and mark programs like High School for recruiting workflows.</div>
                    <label className="mt-3 inline-flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={!!programProfile.enabled}
                        onChange={(e) => updateProgramProfile({ enabled: e.target.checked })}
                      />
                      Enable school/team profile
                    </label>
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <select
                        value={programProfile.programType}
                        onChange={(e) => updateProgramProfile({ programType: e.target.value })}
                        className={
                          "rounded-xl border px-3 py-2 text-sm " +
                          (isLightMode ? "bg-white border-slate-300 text-slate-900" : "bg-black/40 border-white/10 text-white")
                        }
                      >
                        <option value="family">Family</option>
                        <option value="school-team">School Team</option>
                        <option value="club-team">Club Team</option>
                      </select>
                      <select
                        value={programProfile.level}
                        onChange={(e) => updateProgramProfile({ level: e.target.value })}
                        className={
                          "rounded-xl border px-3 py-2 text-sm " +
                          (isLightMode ? "bg-white border-slate-300 text-slate-900" : "bg-black/40 border-white/10 text-white")
                        }
                      >
                        <option value="youth">Youth</option>
                        <option value="middle-school">Middle School</option>
                        <option value="high-school">High School</option>
                        <option value="college">College</option>
                        <option value="adult">Adult</option>
                      </select>
                      <input
                        value={programProfile.schoolName}
                        onChange={(e) => updateProgramProfile({ schoolName: e.target.value })}
                        placeholder="School name"
                        className={
                          "rounded-xl border px-3 py-2 text-sm " +
                          (isLightMode
                            ? "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
                            : "bg-black/40 border-white/10 text-white placeholder:text-white/40")
                        }
                      />
                      <input
                        value={programProfile.teamName}
                        onChange={(e) => updateProgramProfile({ teamName: e.target.value })}
                        placeholder="Team name"
                        className={
                          "rounded-xl border px-3 py-2 text-sm " +
                          (isLightMode
                            ? "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
                            : "bg-black/40 border-white/10 text-white placeholder:text-white/40")
                        }
                      />
                      <input
                        value={programProfile.cityState}
                        onChange={(e) => updateProgramProfile({ cityState: e.target.value })}
                        placeholder="City, State"
                        className={
                          "rounded-xl border px-3 py-2 text-sm " +
                          (isLightMode
                            ? "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
                            : "bg-black/40 border-white/10 text-white placeholder:text-white/40")
                        }
                      />
                      <input
                        value={programProfile.season}
                        onChange={(e) => updateProgramProfile({ season: e.target.value })}
                        placeholder="Season (e.g., Fall 2026)"
                        className={
                          "rounded-xl border px-3 py-2 text-sm " +
                          (isLightMode
                            ? "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
                            : "bg-black/40 border-white/10 text-white placeholder:text-white/40")
                        }
                      />
                    </div>
                    <textarea
                      value={programProfile.notes}
                      onChange={(e) => updateProgramProfile({ notes: e.target.value })}
                      rows={2}
                      placeholder="Program notes (division, district, schedule)."
                      className={
                        "mt-2 w-full rounded-xl border px-3 py-2 text-sm " +
                        (isLightMode
                          ? "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
                          : "bg-black/40 border-white/10 text-white placeholder:text-white/40")
                      }
                    />
                    <div className={settingsMutedTextClass}>
                      Current profile: {programProfile.enabled ? `${programTypeLabel} • ${programLevelLabel}` : "Family Mode"}{" "}
                      {isHighSchoolProgram ? "• High School marker ON" : ""}
                    </div>
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

                  <div className={settingsCardClass}>
                    <div className="text-sm font-semibold">Pro Feedback (Skateboarding)</div>
                    <div className={settingsMutedTextClass}>
                      Toggle paid pro-review, collect to owner PayPal, and track weekly pro payouts.
                    </div>
                    <label className="mt-3 inline-flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={proFeedbackEnabled}
                        onChange={(e) => updateProFeedback({ enabled: e.target.checked })}
                      />
                      Enable Pro Feedback section
                    </label>
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="number"
                        min="0"
                        value={String(proFeedbackPriceUsd)}
                        onChange={(e) => updateProFeedback({ priceUsd: Math.max(0, Number(e.target.value) || 0) })}
                        placeholder="Charge (USD)"
                        className={
                          "rounded-xl border px-3 py-2 text-sm " +
                          (isLightMode
                            ? "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
                            : "bg-black/40 border-white/10 text-white placeholder:text-white/40")
                        }
                      />
                      <input
                        type="number"
                        min="0"
                        value={String(proFeedbackOwnerShareUsd)}
                        onChange={(e) => updateProFeedback({ ownerShareUsd: Math.max(0, Number(e.target.value) || 0) })}
                        placeholder="Owner share (USD)"
                        className={
                          "rounded-xl border px-3 py-2 text-sm " +
                          (isLightMode
                            ? "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
                            : "bg-black/40 border-white/10 text-white placeholder:text-white/40")
                        }
                      />
                      <select
                        value={proFeedbackWeeklyPayoutDay}
                        onChange={(e) => updateProFeedback({ weeklyPayoutDay: normalizeWeekday(e.target.value, proFeedbackWeeklyPayoutDay) })}
                        className={
                          "rounded-xl border px-3 py-2 text-sm " +
                          (isLightMode ? "bg-white border-slate-300 text-slate-900" : "bg-black/40 border-white/10 text-white")
                        }
                      >
                        {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                          <option key={day} value={day}>
                            {day}
                          </option>
                        ))}
                      </select>
                      <input
                        value={String(proFeedback.paypalMeUrl || "")}
                        onChange={(e) => updateProFeedback({ paypalMeUrl: e.target.value })}
                        onBlur={() => updateProFeedback({ paypalMeUrl: normalizeExternalUrl(proFeedback.paypalMeUrl || "") })}
                        placeholder="PayPal.me URL (recommended)"
                        className={
                          "rounded-xl border px-3 py-2 text-sm " +
                          (isLightMode
                            ? "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
                            : "bg-black/40 border-white/10 text-white placeholder:text-white/40")
                        }
                      />
                      <input
                        type="email"
                        value={String(proFeedback.paypalEmail || "")}
                        onChange={(e) => updateProFeedback({ paypalEmail: String(e.target.value || "").trim() })}
                        placeholder="PayPal email (optional fallback)"
                        className={
                          "rounded-xl border px-3 py-2 text-sm " +
                          (isLightMode
                            ? "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
                            : "bg-black/40 border-white/10 text-white placeholder:text-white/40")
                        }
                      />
                      <input
                        value={String(proFeedback.paymentUrl || "")}
                        onChange={(e) => updateProFeedback({ paymentUrl: e.target.value })}
                        onBlur={() => updateProFeedback({ paymentUrl: normalizeExternalUrl(proFeedback.paymentUrl || "") })}
                        placeholder="Fallback payment link (optional)"
                        className={
                          "rounded-xl border px-3 py-2 text-sm " +
                          (isLightMode
                            ? "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
                            : "bg-black/40 border-white/10 text-white placeholder:text-white/40")
                        }
                      />
                    </div>
                    <textarea
                      value={String(proFeedback.instructions || "")}
                      onChange={(e) => updateProFeedback({ instructions: e.target.value })}
                      rows={2}
                      placeholder="Instructions for families before submitting."
                      className={
                        "mt-2 w-full rounded-xl border px-3 py-2 text-sm " +
                        (isLightMode
                          ? "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
                          : "bg-black/40 border-white/10 text-white placeholder:text-white/40")
                      }
                    />
                    <div className={settingsMutedTextClass}>
                      Current state: {proFeedbackEnabled ? "ON" : "OFF"} • Charge: ${proFeedbackPriceUsd} • Split: ${proFeedbackOwnerShareUsd} owner / ${proFeedbackProShareUsd} pro • Weekly payout:{" "}
                      {proFeedbackWeeklyPayoutDay} • PayPal{" "}
                      {isOpenableExternalUrl(buildPayPalMeCheckoutUrl(proFeedback.paypalMeUrl || "", proFeedbackPriceUsd)) || looksLikeEmail(proFeedback.paypalEmail || "")
                        ? "ready"
                        : "not set"}
                    </div>
                  </div>
                </div>

                <div className={`mt-4 ${settingsCardClass}`}>
                  <div className="text-sm font-semibold">Cloud Sync (Firebase Firestore)</div>
                  <div className={settingsMutedTextClass}>
                    Always-on sync for beta: app auto-pulls on open and syncs every minute across devices. Sync requests now attach Firebase Auth tokens and optional App Check tokens when configured.
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
                        disabled
                        onChange={(e) => updateCloudSync({ autoSyncEnabled: e.target.checked })}
                      />
                      Auto sync (locked on)
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm">
                      <span>Every</span>
                      <input
                        value={cloudSync.autoSyncIntervalMin}
                        disabled
                        onChange={(e) => updateCloudSync({ autoSyncIntervalMin: clampNum(e.target.value) || 1 })}
                        inputMode="numeric"
                        className={
                          "w-20 rounded-xl border px-2 py-1 text-sm disabled:opacity-70 " +
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
                        disabled
                        onChange={(e) => updateCloudSync({ autoPullOnLoad: e.target.checked })}
                      />
                      Pull on app open (locked on)
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
                      {cloudSync.lastSyncAt ? formatDateTime(cloudSync.lastSyncAt) : "never"}
                    </Pill>
                    {cloudSync.autoSyncEnabled ? (
                      <Pill tone="cyan" lightMode={isLightMode}>
                        Auto every {Math.max(1, Number(cloudSync.autoSyncIntervalMin) || 1)}m
                      </Pill>
                    ) : null}
                    <Pill tone={FIREBASE_CLOUDSYNC_AUTH_DISABLED ? "warn" : "good"} lightMode={isLightMode}>
                      Auth: {FIREBASE_CLOUDSYNC_AUTH_DISABLED ? "off (not recommended)" : FIREBASE_CLOUDSYNC_AUTH_MODE}
                    </Pill>
                    <Pill tone={FIREBASE_APPCHECK_SITE_KEY ? "good" : "warn"} lightMode={isLightMode}>
                      App Check: {FIREBASE_APPCHECK_SITE_KEY ? "enabled" : "env key missing"}
                    </Pill>
                  </div>
                  {cloudSyncError ? (
                    <div className={`mt-2 text-xs ${isLightMode ? "text-rose-700" : "text-rose-200"}`}>{cloudSyncError}</div>
                  ) : (
                    <div className={`mt-2 text-xs ${isLightMode ? "text-slate-600" : "text-white/60"}`}>
                      Security tip: keep Firestore rules locked to your sync doc path, use role claims for write, and add this beta domain under Firebase Auth authorized domains.
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
                        Updated {formatDateTime(betaCheck.updatedAt)}
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
                        <div className={`text-[11px] ${isLightMode ? "text-slate-500" : "text-white/50"}`}>Last run {formatDateTime(healthReport.generatedAt)}</div>
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

        <datalist id="park-name-list">
          {parkAutocompleteOptions.map((p) => (
            <option key={`${p.name}|${p.location}`} value={p.name}>
              {p.location || ""}
            </option>
          ))}
        </datalist>
        <datalist id="trick-name-list">
          {SKATE_TRICK_LIBRARY.map((trick) => (
            <option key={trick.id} value={trick.name}>
              {trick.categoryLabel}
            </option>
          ))}
        </datalist>

        <div className="mt-6 text-xs text-white/40">Local-first build. For real sharing across devices: add Firebase (Auth + Firestore + Storage).</div>
      </div>
    </div>
  );
}

function SessionCard({ session, onEdit, onEditMedia, onShare, onDelete, canComment, canEditMedia, onAddComment, onSetMediaComment }) {
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
                const trickLabel = String(m?.trickAssist?.selectedTrickName || "").trim();
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
                    {isVideo && trickLabel ? <div className="px-2 py-1.5 text-[11px] text-cyan-200 bg-black/70 ring-1 ring-white/10">Trick: {trickLabel}</div> : null}
                    {canComment ? (
                      <div className="p-2 bg-black/60 ring-1 ring-white/10">
                        {isVideo && canEditMedia ? (
                          <button
                            type="button"
                            onClick={() => onEditMedia?.(m.id)}
                            className="mb-2 rounded-xl bg-white/10 ring-1 ring-white/15 px-2.5 py-1 text-[11px] font-bold hover:bg-white/20"
                            title="Trim and draw correction lines"
                          >
                            Edit clip
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

function ProgressCard({ card, skater, locale = undefined }) {
  const meta = card.meta || card.park || "";
  const dateLabel = formatShortDate(card.date || todayISO(), locale);

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
            <div className="text-[11px] font-extrabold tracking-[0.28em] text-white/60">{APP_WORDMARK} • {spec.tag}</div>
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
