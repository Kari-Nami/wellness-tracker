import { createDemoDatabase, type DemoDatabase } from './data';
import { reconcile } from './calculations';
const key = 'daywell-demo-data-v1';
const sessionKey = 'daywell-demo-session';
let memory: DemoDatabase | undefined;
export function getDatabase() {
  if (!memory) {
    try {
      const saved = localStorage.getItem(key);
      if (saved) memory = JSON.parse(saved) as DemoDatabase;
    } catch {
      /* Storage may be unavailable in private browsing. */
    }
    if (
      !memory ||
      !Array.isArray(memory.accounts) ||
      !memory.records ||
      !memory.habits ||
      !Array.isArray(memory.rules)
    ) {
      memory = createDemoDatabase();
      for (const { user } of memory.accounts) reconcile(memory, user);
      persistDatabase();
    }
  }
  return memory;
}
export function persistDatabase() {
  try {
    localStorage.setItem(key, JSON.stringify(memory));
  } catch {
    /* The demo remains usable in memory when storage is full. */
  }
}
let session: string | null | undefined;
export function getDemoSession() {
  if (session === undefined) {
    try {
      session = sessionStorage.getItem(sessionKey);
    } catch {
      session = null;
    }
  }
  return session;
}
export function setDemoSession(id: string | null) {
  session = id;
  try {
    if (id) sessionStorage.setItem(sessionKey, id);
    else sessionStorage.removeItem(sessionKey);
  } catch {
    /* Keep the current tab session in memory. */
  }
}
export function resetDemoData() {
  memory = undefined;
  try {
    localStorage.removeItem(key);
  } catch {
    /* Memory will be regenerated. */
  }
  setDemoSession(null);
  return getDatabase();
}
export async function passwordDigest(password: string) {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(password),
  );
  return Array.from(new Uint8Array(digest), (v) =>
    v.toString(16).padStart(2, '0'),
  ).join('');
}
