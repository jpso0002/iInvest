// Local analytics ring buffer (V1). Stored in localStorage; capped size.
// V2 will export/POST these to a backend.

const KEY = "iinvest.analytics.v1";
const MAX = 200;
const SESSION_KEY = "iinvest.analytics.lastSessionDay";

export type AnalyticsEvent =
  | { type: "onboarding_completed"; placementUnit: number }
  | { type: "lesson_started"; lessonId: string }
  | { type: "lesson_completed"; lessonId: string; unit: number; isUnitUp: boolean }
  | { type: "simulate_opened" }
  | { type: "news_opened" }
  | { type: "league_opened" }
  | { type: "trade_executed"; assetId: string; side: "buy" | "sell"; units: number; price: number }
  | { type: "real_action_reported"; kind: string }
  | { type: "dark_mode_toggled"; dark: boolean }
  | { type: "session_started" };

interface StoredEvent {
  event: AnalyticsEvent;
  at: string;
}

function read(): StoredEvent[] {
  try {
    if (typeof window === "undefined") return [];
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(events: StoredEvent[]): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(KEY, JSON.stringify(events.slice(-MAX)));
  } catch {
    /* noop — storage may be disabled */
  }
}

export function track(event: AnalyticsEvent): void {
  const events = read();
  events.push({ event, at: new Date().toISOString() });
  write(events);
}

export function markSessionStartedIfNewDay(): void {
  try {
    if (typeof window === "undefined") return;
    const today = new Date().toISOString().slice(0, 10);
    const last = window.localStorage.getItem(SESSION_KEY);
    if (last !== today) {
      window.localStorage.setItem(SESSION_KEY, today);
      track({ type: "session_started" });
    }
  } catch {
    /* noop */
  }
}

export function readAllEvents(): StoredEvent[] {
  return read();
}
