import { useMemo } from 'react';
import { Lang } from '../constants/i18n';
import { Verse } from './useAppStore';

// Static imports — bundled at build time (fast, no async needed)
const KJV_DATA = require('../assets/data/kjv.json');
const SEG_DATA = require('../assets/data/segond_1910.json');

const kjvVerses: Verse[] = KJV_DATA.verses;
const segVerses: Verse[] = SEG_DATA.verses;

// Build indexes once at module load (not per render)
const buildIndex = (verses: Verse[]) => {
  const byBook = new Map<number, Verse[]>();
  for (const v of verses) {
    if (!byBook.has(v.book)) byBook.set(v.book, []);
    byBook.get(v.book)!.push(v);
  }
  return byBook;
};

const kjvIndex = buildIndex(kjvVerses);
const segIndex = buildIndex(segVerses);

export function useBible(lang: Lang) {
  const index = lang === 'en' ? kjvIndex : segIndex;
  const allVerses = lang === 'en' ? kjvVerses : segVerses;

  const getChapters = useMemo(() => (book: number): number[] => {
    const verses = index.get(book) || [];
    const seen = new Set<number>();
    const chapters: number[] = [];
    for (const v of verses) {
      if (!seen.has(v.chapter)) {
        seen.add(v.chapter);
        chapters.push(v.chapter);
      }
    }
    return chapters.sort((a, b) => a - b);
  }, [index]);

  const getVerses = useMemo(() => (book: number, chapter: number): Verse[] => {
    return (index.get(book) || []).filter(v => v.chapter === chapter);
  }, [index]);

  const searchVerses = (query: string, limit = 100): Verse[] => {
    if (!query.trim() || query.length < 2) return [];
    const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return allVerses
      .filter(v => {
        const text = v.text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return text.includes(q);
      })
      .slice(0, limit);
  };

  const getVerse = (book: number, chapter: number, verse: number): Verse | undefined => {
    return (index.get(book) || []).find(v => v.chapter === chapter && v.verse === verse);
  };

  // Get same verse in other language
  const getParallelVerse = (book: number, chapter: number, verse: number, targetLang: Lang): Verse | undefined => {
    const targetIndex = targetLang === 'en' ? kjvIndex : segIndex;
    return (targetIndex.get(book) || []).find(v => v.chapter === chapter && v.verse === verse);
  };

  return { getChapters, getVerses, searchVerses, getVerse, getParallelVerse };
}