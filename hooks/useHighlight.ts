import AsyncStorage from '@react-native-async-storage/async-storage';
import { useContext, useEffect, useState } from 'react';
import { AppContext } from './useappstore';

export interface Highlight {
  id: string;
  book: number;
  chapter: number;
  verse: number;
  text: string;
  color: string;
  timestamp: number;
  note?: string;
}

export const HIGHLIGHT_COLORS = [
  { name: 'Jaune', value: '#FFEB3B', bg: 'rgba(255, 235, 59, 0.3)' },
  { name: 'Vert', value: '#4CAF50', bg: 'rgba(76, 175, 80, 0.3)' },
  { name: 'Bleu', value: '#2196F3', bg: 'rgba(33, 150, 243, 0.3)' },
  { name: 'Orange', value: '#FF9800', bg: 'rgba(255, 152, 0, 0.3)' },
  { name: 'Rose', value: '#E91E63', bg: 'rgba(233, 30, 99, 0.3)' },
  { name: 'Violet', value: '#9C27B0', bg: 'rgba(156, 39, 176, 0.3)' },
  { name: 'Rouge', value: '#F44336', bg: 'rgba(244, 67, 54, 0.3)' },
];

export function useHighlight() {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const appState = useContext(AppContext);

  useEffect(() => {
    loadHighlights();
  }, []);

  const loadHighlights = async () => {
    try {
      const saved = await AsyncStorage.getItem('bible_highlights');
      if (saved) {
        setHighlights(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading highlights:', error);
    }
  };

  const saveHighlights = async (newHighlights: Highlight[]) => {
    try {
      await AsyncStorage.setItem('bible_highlights', JSON.stringify(newHighlights));
      setHighlights(newHighlights);
    } catch (error) {
      console.error('Error saving highlights:', error);
    }
  };

  const addHighlight = (highlight: Omit<Highlight, 'id' | 'timestamp'>) => {
    const newHighlight: Highlight = {
      ...highlight,
      id: `${highlight.book}-${highlight.chapter}-${highlight.verse}-${Date.now()}`,
      timestamp: Date.now(),
    };
    const newHighlights = [...highlights, newHighlight];
    saveHighlights(newHighlights);
    return newHighlight;
  };

  const removeHighlight = (id: string) => {
    const newHighlights = highlights.filter(h => h.id !== id);
    saveHighlights(newHighlights);
  };

  const updateHighlightNote = (id: string, note: string) => {
    const newHighlights = highlights.map(h =>
      h.id === id ? { ...h, note } : h
    );
    saveHighlights(newHighlights);
  };

  const getVerseHighlights = (book: number, chapter: number, verse: number) => {
    return highlights.filter(h => h.book === book && h.chapter === chapter && h.verse === verse);
  };

  const hasHighlight = (book: number, chapter: number, verse: number) => {
    return highlights.some(h => h.book === book && h.chapter === chapter && h.verse === verse);
  };

  const getHighlightColor = (book: number, chapter: number, verse: number) => {
    const highlight = highlights.find(h => h.book === book && h.chapter === chapter && h.verse === verse);
    return highlight?.color;
  };

  return {
    highlights,
    addHighlight,
    removeHighlight,
    updateHighlightNote,
    getVerseHighlights,
    hasHighlight,
    getHighlightColor,
  };
}