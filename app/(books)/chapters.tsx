import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useContext, useMemo } from 'react';
import {
  Dimensions, FlatList, Platform, StyleSheet,
  TouchableOpacity, View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppContext } from '@/hooks/useappstore';
import { useBible } from '@/hooks/usebible ';

const { width } = Dimensions.get('window');
const COLS = 5;
const CELL = (width - 32 - (COLS - 1) * 10) / COLS;

export default function ChaptersScreen() {
  const router = useRouter();
  const appState = useContext(AppContext);
  const { book, bookName } = useLocalSearchParams<{ book: string; bookName: string }>();
  const lang = appState?.lang || 'fr';
  const { getChapters } = useBible(lang as 'fr' | 'en');

  const bookNumber = parseInt(book || '0', 10);
  const chapters = useMemo(() => getChapters(bookNumber), [bookNumber, getChapters]);

  // Fonction pour vérifier si un chapitre est marqué (bookmark)
  const isChapterBookmarked = (chapter: number): boolean => {
    if (!appState?.bookmark) return false;
    return appState.bookmark.book === bookNumber && appState.bookmark.chapter === chapter;
  };

  // Compter uniquement les chapitres marqués (pas automatiquement tous les chapitres visités)
  const bookmarkedChapters = chapters.filter(ch => isChapterBookmarked(ch));
  const bookmarkedCount = bookmarkedChapters.length;
  
  // Pour la progression, on peut aussi montrer le dernier chapitre lu
  const currentChapter = appState?.bookmark?.chapter || 0;
  const progress = chapters.length > 0 ? Math.round((currentChapter / chapters.length) * 100) : 0;

  const handleChapterPress = (chapter: number) => {
    router.push({
      pathname: '/(books)/verses',
      params: { book: bookNumber, chapter: chapter.toString(), bookName },
    });
  };

  const renderChapter = ({ item }: { item: number }) => {
    const isBookmarked = isChapterBookmarked(item);
    return (
      <TouchableOpacity
        style={[styles.cell, isBookmarked && styles.cellRead]}
        onPress={() => handleChapterPress(item)}
        activeOpacity={0.7}
      >
        {isBookmarked ? (
          <LinearGradient colors={['#6B3A2A', '#A0522D']} style={styles.cellGradient}>
            <ThemedText style={styles.cellNumRead}>{item}</ThemedText>
            <View style={styles.checkDot}>
              <Ionicons name="bookmark" size={8} color="#fff" />
            </View>
          </LinearGradient>
        ) : (
          <View style={styles.cellInner}>
            <ThemedText style={styles.cellNum}>{item}</ThemedText>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header compact */}
      <LinearGradient colors={['#3D1F14', '#6B3A2A']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <ThemedText style={styles.headerBook}>{bookName}</ThemedText>
          <View style={{ width: 38 }} />
        </View>

        {/* Progress inside header */}
        <View style={styles.headerProgress}>
          <View style={styles.progressLabelRow}>
            <ThemedText style={styles.progressLabel}>Progression de lecture</ThemedText>
            <ThemedText style={styles.progressPct}>{progress}%</ThemedText>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <ThemedText style={styles.progressSub}>
            Chapitre actuel: {currentChapter} / {chapters.length}
          </ThemedText>
          {bookmarkedCount > 0 && (
            <ThemedText style={styles.bookmarkSub}>
              📖 {bookmarkedCount} chapitre{bookmarkedCount > 1 ? 's' : ''} marqué{bookmarkedCount > 1 ? 's' : ''}
            </ThemedText>
          )}
        </View>
      </LinearGradient>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#6B3A2A' }]} />
          <ThemedText style={styles.legendText}>Marque-page</ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#F0E6DF', borderWidth: 1, borderColor: '#D4BEB5' }]} />
          <ThemedText style={styles.legendText}>Non marqué</ThemedText>
        </View>
        <ThemedText style={styles.chapterCount}>{chapters.length} chapitres</ThemedText>
      </View>

      {/* Grid */}
      <FlatList
        data={chapters}
        keyExtractor={item => item.toString()}
        numColumns={COLS}
        renderItem={renderChapter}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF6F2' },

  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backBtn: { padding: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)' },
  headerBook: { color: '#fff', fontSize: 20, fontWeight: '700', letterSpacing: 0.3 },

  headerProgress: {},
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '500', letterSpacing: 0.5 },
  progressPct: { color: '#FFD4A8', fontSize: 14, fontWeight: '700' },
  progressTrack: {
    height: 5, backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3, overflow: 'hidden', marginBottom: 6,
  },
  progressFill: { height: '100%', backgroundColor: '#FFD4A8', borderRadius: 3 },
  progressSub: { color: 'rgba(255,255,255,0.55)', fontSize: 11 },
  bookmarkSub: { color: '#FFD4A8', fontSize: 11, marginTop: 4 },

  legend: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#EDE5DF',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 12, height: 12, borderRadius: 3 },
  legendText: { fontSize: 12, color: '#888' },
  chapterCount: { marginLeft: 'auto', fontSize: 12, color: '#888', fontWeight: '500' },

  grid: { padding: 16, paddingTop: 14 },
  row: { gap: 10, marginBottom: 10 },

  cell: {
    width: CELL, height: CELL, borderRadius: 12, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
  },
  cellRead: { shadowColor: '#6B3A2A', shadowOpacity: 0.2 },
  cellGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cellInner: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#EDE5DF',
    borderRadius: 12,
  },
  cellNum: { fontSize: 16, fontWeight: '600', color: '#4A2A1E' },
  cellNumRead: { fontSize: 16, fontWeight: '700', color: '#fff' },
  checkDot: {
    position: 'absolute', bottom: 5, right: 5,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
});