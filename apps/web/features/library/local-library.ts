"use client";

/**
 * ข้อมูลส่วนตัวของผู้อ่านที่เก็บใน localStorage (ยังไม่มีระบบล็อกอินผู้อ่าน)
 * - บุ๊กมาร์ก:        bookmarked_slugs = ["slug-a", "slug-b"]  (ต่อท้ายเมื่อเพิ่มใหม่)
 * - ประวัติการอ่าน:   book_page_{slug}, book_time_{slug} (วินาที),
 *                    book_total_{slug} (จำนวนหน้าทั้งเล่ม), book_last_{slug} (epoch ms)
 *
 * ใช้ useSyncExternalStore → ทุก component ที่ใช้ hook เดียวกันอัปเดตพร้อมกัน
 * (รวมถึงข้ามแท็บผ่าน event "storage")
 * TODO: เมื่อมี Auth.js ให้ย้ายไปเก็บที่ตาราง ReadingProgress / Bookmark แทน
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

export const BOOKMARKS_KEY = "bookmarked_slugs";
const PAGE_PREFIX = "book_page_";
const TIME_PREFIX = "book_time_";
const TOTAL_PREFIX = "book_total_";
const LAST_PREFIX = "book_last_";
const CHANGE_EVENT = "local-library-change";

/** อ่านไม่ถึงเกณฑ์นี้ (และยังอยู่หน้าแรก) = เปิดผ่านๆ ไม่นับเป็น "อ่านค้าง" */
const MIN_SECONDS_TO_COUNT = 10;

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* โหมดส่วนตัว / พื้นที่เต็ม: ข้ามไป */
  }
}

function safeRemove(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

function notify() {
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

/** ฝั่ง server ยังไม่รู้ข้อมูล → คืน null เพื่อให้ UI แสดงสถานะกำลังโหลด */
const getServerSnapshot = () => null;

function toInt(v: string | null): number | null {
  if (v == null) return null;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

// ───────────────────────── Bookmarks ─────────────────────────

function parseSlugs(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((s): s is string => typeof s === "string")
      : [];
  } catch {
    return [];
  }
}

const getBookmarksSnapshot = () => safeGet(BOOKMARKS_KEY) ?? "[]";

export function toggleBookmark(slug: string) {
  const slugs = parseSlugs(safeGet(BOOKMARKS_KEY));
  const next = slugs.includes(slug)
    ? slugs.filter((s) => s !== slug)
    : [...slugs, slug];
  safeSet(BOOKMARKS_KEY, JSON.stringify(next));
  notify();
}

/**
 * slugs: เรียงจากที่บุ๊กมาร์กล่าสุดก่อน, เป็น null ระหว่างรอ hydrate
 */
export function useBookmarks() {
  const raw = useSyncExternalStore(
    subscribe,
    getBookmarksSnapshot,
    getServerSnapshot,
  );
  const slugs = useMemo(
    () => (raw === null ? null : parseSlugs(raw).reverse()),
    [raw],
  );
  const isBookmarked = useCallback(
    (slug: string) => slugs?.includes(slug) ?? false,
    [slugs],
  );
  return { slugs, isBookmarked, toggle: toggleBookmark };
}

// ───────────────────────── Reading history ─────────────────────────

export type ReadingEntry = {
  slug: string;
  page: number;
  totalPages: number | null;
  seconds: number;
  lastReadAt: number | null;
};

/** สแนปช็อตเป็น string (เทียบค่าได้) เพื่อให้ useSyncExternalStore ไม่ render วน */
function getHistorySnapshot(): string {
  let keys: string[] = [];
  try {
    keys = Object.keys(localStorage);
  } catch {
    return "[]";
  }
  const slugs = new Set<string>();
  for (const k of keys) {
    if (k.startsWith(PAGE_PREFIX)) slugs.add(k.slice(PAGE_PREFIX.length));
    else if (k.startsWith(TIME_PREFIX)) slugs.add(k.slice(TIME_PREFIX.length));
  }

  const entries: ReadingEntry[] = [];
  for (const slug of slugs) {
    const page = toInt(safeGet(PAGE_PREFIX + slug)) ?? 1;
    const seconds = toInt(safeGet(TIME_PREFIX + slug)) ?? 0;
    if (page <= 1 && seconds < MIN_SECONDS_TO_COUNT) continue;
    const total = toInt(safeGet(TOTAL_PREFIX + slug));
    entries.push({
      slug,
      page: Math.max(1, page),
      totalPages: total && total > 0 ? total : null,
      seconds: Math.max(0, seconds),
      lastReadAt: toInt(safeGet(LAST_PREFIX + slug)),
    });
  }

  // อ่านล่าสุดก่อน; ข้อมูลเก่าที่ยังไม่มี lastReadAt ให้เรียงตามเวลาอ่านสะสม
  entries.sort(
    (a, b) =>
      (b.lastReadAt ?? 0) - (a.lastReadAt ?? 0) || b.seconds - a.seconds,
  );
  return JSON.stringify(entries);
}

export function removeFromHistory(slug: string) {
  for (const prefix of [PAGE_PREFIX, TIME_PREFIX, TOTAL_PREFIX, LAST_PREFIX]) {
    safeRemove(prefix + slug);
  }
  notify();
}

/** entries: เป็น null ระหว่างรอ hydrate */
export function useReadingHistory() {
  const raw = useSyncExternalStore(
    subscribe,
    getHistorySnapshot,
    getServerSnapshot,
  );
  const entries = useMemo<ReadingEntry[] | null>(
    () => (raw === null ? null : (JSON.parse(raw) as ReadingEntry[])),
    [raw],
  );
  return { entries, remove: removeFromHistory };
}

/** reader เรียกเพื่อบันทึกจำนวนหน้าทั้งเล่ม (ใช้คำนวณ % ความคืบหน้า) */
export function saveTotalPages(slug: string, totalPages: number) {
  if (totalPages > 0) safeSet(TOTAL_PREFIX + slug, String(totalPages));
}

/** reader เรียกเมื่อเปิดอ่าน / พลิกหน้า เพื่อเรียงลำดับ "อ่านค้างไว้" */
export function touchLastRead(slug: string) {
  safeSet(LAST_PREFIX + slug, String(Date.now()));
}

// ───────────────────────── Fetch books by slug ─────────────────────────

export type BookCard = {
  id: string;
  title: string;
  slug: string;
  author: string;
  coverUrl: string | null;
  fileType?: string;
};

type FetchState =
  | { status: "loading"; books: BookCard[] | null }
  | { status: "ready"; books: BookCard[] }
  | { status: "error"; books: BookCard[] | null };

/**
 * ดึงข้อมูลหนังสือ (เฉพาะที่เผยแพร่) จาก slug ที่เก็บในเครื่อง
 * slugs = null → ยังไม่ hydrate (คงสถานะ loading)
 * ระหว่างโหลดรอบใหม่จะเก็บผลรอบก่อนไว้ ไม่ให้ UI กะพริบ
 */
export function useBooksBySlugs(slugs: string[] | null) {
  const key = slugs?.join(",") ?? null;
  const [state, setState] = useState<FetchState>({
    status: "loading",
    books: null,
  });

  useEffect(() => {
    if (key === null) return;
    if (key === "") {
      setState({ status: "ready", books: [] });
      return;
    }
    const controller = new AbortController();
    setState((prev) => ({ status: "loading", books: prev.books }));
    fetch(`/api/books?slugs=${encodeURIComponent(key)}`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json() as Promise<{ books: BookCard[] }>;
      })
      .then(({ books }) => setState({ status: "ready", books }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        console.error("โหลดข้อมูลหนังสือไม่สำเร็จ", err);
        setState((prev) => ({ status: "error", books: prev.books }));
      });
    return () => controller.abort();
  }, [key]);

  return state;
}
