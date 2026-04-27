/**
 * useReadingProgress
 * ─────────────────────────────────────────────────────────────────────────────
 * Zéro dépendance externe — utilise uniquement React + react-native.
 *
 * Stockage :
 *   - Web      → localStorage
 *   - Mobile   → expo-file-system si disponible, sinon mémoire uniquement
 *
 * Structure : Record<"bookNumber-chapter-verse", dateISO>
 * Exemple   : { "40-5-1": "2026-04-25T10:30:00Z", ... }
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

// ─── Types ────────────────────────────────────────────────────────────────────

type ReadMap = Record<string, string>; // "book-chapter-verse" → dateISO

// ─── Singleton global (partagé entre toutes les instances du hook) ─────────────

let _map: ReadMap           = {};
let _loaded                 = false;
let _initPromise: Promise<void> | null = null;
let _listeners: Array<() => void>      = [];

const STORAGE_KEY = 'bible_read_progress';

// ─── Persistance ──────────────────────────────────────────────────────────────

async function _load(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) _map = JSON.parse(raw);
      }
    } else {
      // Tente expo-file-system (déjà présent dans Expo)
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const FS   = require('expo-file-system');
      const path = `${FS.documentDirectory}${STORAGE_KEY}.json`;
      const info = await FS.getInfoAsync(path);
      if (info.exists) {
        const raw = await FS.readAsStringAsync(path);
        _map = JSON.parse(raw);
      }
    }
  } catch {
    // Pas de stockage dispo → mémoire uniquement, aucun crash
  } finally {
    _loaded = true;
    _notify();
  }
}

function _save(): void {
  const data = JSON.stringify(_map);
  try {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, data);
      }
    } else {
      // Écriture asynchrone, on ne bloque pas le thread
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const FS   = require('expo-file-system');
      const path = `${FS.documentDirectory}${STORAGE_KEY}.json`;
      FS.writeAsStringAsync(path, data).catch(() => {/* silencieux */});
    }
  } catch {/* silencieux */}
}

function _notify(): void {
  _listeners.forEach(fn => fn());
}

function _ensureLoaded(): Promise<void> {
  if (!_initPromise) _initPromise = _load();
  return _initPromise;
}

// ─── Clés ─────────────────────────────────────────────────────────────────────

const vKey    = (b: number, c: number, v: number) => `${b}-${c}-${v}`;
const cPrefix = (b: number, c: number)             => `${b}-${c}-`;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useReadingProgress() {
  const [, setTick] = useState(0);
  const rerender    = useCallback(() => setTick(n => n + 1), []);

  // Abonnement aux mises à jour globales + chargement initial
  useEffect(() => {
    _listeners.push(rerender);
    _ensureLoaded();
    return () => { _listeners = _listeners.filter(fn => fn !== rerender); };
  }, [rerender]);

  // ── Mutations ────────────────────────────────────────────────────────────────

  /** Marque un verset comme lu (idempotent) */
  const markVerseRead = useCallback(
    (book: number, chapter: number, verse: number) => {
      const key = vKey(book, chapter, verse);
      if (_map[key]) return;                          // déjà marqué
      _map = { ..._map, [key]: new Date().toISOString() };
      _notify();
      _save();
    },
    [],
  );

  /** Marque tous les versets d'un chapitre comme lus */
  const markChapterRead = useCallback(
    (book: number, chapter: number, verseNumbers: number[]) => {
      const now  = new Date().toISOString();
      const next = { ..._map };
      let changed = false;
      verseNumbers.forEach(v => {
        const k = vKey(book, chapter, v);
        if (!next[k]) { next[k] = now; changed = true; }
      });
      if (!changed) return;
      _map = next;
      _notify();
      _save();
    },
    [],
  );

  /** Remet à zéro toute la progression */
  const resetProgress = useCallback(() => {
    _map = {};
    _notify();
    _save();
  }, []);

  // ── Lecture ──────────────────────────────────────────────────────────────────

  /** Est-ce que ce verset a été lu ? */
  const isVerseRead = useCallback(
    (book: number, chapter: number, verse: number): boolean =>
      Boolean(_map[vKey(book, chapter, verse)]),
    [],
  );

  /** Date de première lecture (ou null) */
  const getVerseReadDate = useCallback(
    (book: number, chapter: number, verse: number): Date | null => {
      const v = _map[vKey(book, chapter, verse)];
      return v ? new Date(v) : null;
    },
    [],
  );

  /** Nombre de versets lus dans ce chapitre */
  const getChapterReadCount = useCallback(
    (book: number, chapter: number): number => {
      const prefix = cPrefix(book, chapter);
      return Object.keys(_map).filter(k => k.startsWith(prefix)).length;
    },
    [],
  );

  /** Pourcentage de lecture d'un chapitre (0-100) */
  const getChapterProgress = useCallback(
    (book: number, chapter: number, totalVerses: number): number => {
      if (totalVerses === 0) return 0;
      const count = Object.keys(_map)
        .filter(k => k.startsWith(cPrefix(book, chapter))).length;
      return Math.round((count / totalVerses) * 100);
    },
    [],
  );

  /** Le chapitre est-il entièrement lu ? */
  const isChapterComplete = useCallback(
    (book: number, chapter: number, totalVerses: number): boolean => {
      if (totalVerses === 0) return false;
      const count = Object.keys(_map)
        .filter(k => k.startsWith(cPrefix(book, chapter))).length;
      return count >= totalVerses;
    },
    [],
  );

  /** Nombre de chapitres entièrement lus pour un livre donné */
  const getBookReadChapters = useCallback(
    (book: number, chapterVerseCounts: Record<number, number>): number =>
      Object.entries(chapterVerseCounts).filter(([ch, total]) =>
        isChapterComplete(book, Number(ch), total)
      ).length,
    [isChapterComplete],
  );

  return {
    loaded: _loaded,

    // Vérifications
    isVerseRead,
    getVerseReadDate,
    getChapterReadCount,
    getChapterProgress,
    isChapterComplete,
    getBookReadChapters,

    // Mutations
    markVerseRead,
    markChapterRead,
    resetProgress,
  };
}