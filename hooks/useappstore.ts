import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Lang } from '../constants/i18n';

export interface Verse {
  book_name: string;
  book: number;
  chapter: number;
  verse: number;
  text: string;
}

export interface BookmarkPosition {
  book: number;
  chapter: number;
  verse: number;
  book_name_fr: string;
  book_name_en: string;
  timestamp: number;
}

export interface FavoriteVerse extends Verse {
  lang: Lang;
  addedAt: number;
}

interface AppState {
  lang: Lang;
  darkMode: boolean;
  favorites: FavoriteVerse[];
  bookmark: BookmarkPosition | null;
  setLang: (lang: Lang) => void;
  toggleDarkMode: () => void;
  addFavorite: (verse: Verse, lang: Lang) => void;
  removeFavorite: (book: number, chapter: number, verse: number) => void;
  isFavorite: (book: number, chapter: number, verse: number) => boolean;
  setBookmark: (pos: BookmarkPosition) => void;
  clearBookmark: () => void;
}

const KEYS = {
  LANG:      '@bible_lang',
  DARK:      '@bible_dark',
  FAVORITES: '@bible_favorites',
  BOOKMARK:  '@bible_bookmark',
};

export const AppContext = createContext<AppState>({} as AppState);

export function useAppStore(): AppState {
  const [lang, setLangState] = useState<Lang>('fr');
  const [darkMode, setDarkMode] = useState(false);
  const [favorites, setFavorites] = useState<FavoriteVerse[]>([]);
  const [bookmark, setBookmarkState] = useState<BookmarkPosition | null>(null);

  // Load persisted state on mount
  useEffect(() => {
    const load = async () => {
      try {
        const [l, d, f, b] = await Promise.all([
          AsyncStorage.getItem(KEYS.LANG),
          AsyncStorage.getItem(KEYS.DARK),
          AsyncStorage.getItem(KEYS.FAVORITES),
          AsyncStorage.getItem(KEYS.BOOKMARK),
        ]);
        if (l) setLangState(l as Lang);
        if (d) setDarkMode(d === 'true');
        if (f) setFavorites(JSON.parse(f));
        if (b) setBookmarkState(JSON.parse(b));
      } catch {}
    };
    load();
  }, []);

  const setLang = useCallback(async (l: Lang) => {
    setLangState(l);
    await AsyncStorage.setItem(KEYS.LANG, l);
  }, []);

  const toggleDarkMode = useCallback(async () => {
    const next = !darkMode;
    setDarkMode(next);
    await AsyncStorage.setItem(KEYS.DARK, String(next));
  }, [darkMode]);

  const addFavorite = useCallback(async (verse: Verse, lang: Lang) => {
    const fav: FavoriteVerse = { ...verse, lang, addedAt: Date.now() };
    setFavorites(prev => {
      const next = [fav, ...prev.filter(f =>
        !(f.book === verse.book && f.chapter === verse.chapter && f.verse === verse.verse)
      )];
      AsyncStorage.setItem(KEYS.FAVORITES, JSON.stringify(next));
      return next;
    });
  }, []);

  const removeFavorite = useCallback(async (book: number, chapter: number, verse: number) => {
    setFavorites(prev => {
      const next = prev.filter(f =>
        !(f.book === book && f.chapter === chapter && f.verse === verse)
      );
      AsyncStorage.setItem(KEYS.FAVORITES, JSON.stringify(next));
      return next;
    });
  }, []);

  const isFavorite = useCallback((book: number, chapter: number, verse: number): boolean => {
    return favorites.some(f => f.book === book && f.chapter === chapter && f.verse === verse);
  }, [favorites]);

  const setBookmark = useCallback(async (pos: BookmarkPosition) => {
    setBookmarkState(pos);
    await AsyncStorage.setItem(KEYS.BOOKMARK, JSON.stringify(pos));
  }, []);

  const clearBookmark = useCallback(async () => {
    setBookmarkState(null);
    await AsyncStorage.removeItem(KEYS.BOOKMARK);
  }, []);

  return {
    lang, darkMode, favorites, bookmark,
    setLang, toggleDarkMode,
    addFavorite, removeFavorite, isFavorite,
    setBookmark, clearBookmark,
  };
}

export const useApp = () => useContext(AppContext);