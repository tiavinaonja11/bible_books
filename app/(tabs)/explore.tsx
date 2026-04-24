import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useContext, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated, FlatList,
  Platform, ScrollView, StyleSheet, TextInput,
  TouchableOpacity, View
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BOOKS } from '@/constants/books';
import { AppContext } from '@/hooks/useappstore';
import { useBible } from '@/hooks/usebible ';

const SUGGESTIONS = ['amour', 'paix', 'foi', 'espoir', 'grâce', 'lumière', 'Dieu', 'Jésus'];

const QUICK_REFS = [
  { ref: 'Jean 3:16',   book: 43, chapter: 3,  verse: 16 },
  { ref: 'Ps 23:1',     book: 19, chapter: 23, verse: 1  },
  { ref: 'Rm 8:28',     book: 45, chapter: 8,  verse: 28 },
  { ref: 'Ph 4:13',     book: 50, chapter: 4,  verse: 13 },
];

export default function SearchScreen() {
  const appState = useContext(AppContext);
  const router = useRouter();
  const lang = appState?.lang || 'fr';
  const { searchVerses } = useBible(lang as 'fr' | 'en');

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<TextInput>(null);
  const barAnim = useRef(new Animated.Value(0)).current;

  const getBookName = (bookNumber: number): string => {
    const b = BOOKS.find(x => x.book === bookNumber);
    return b ? (lang === 'fr' ? b.fr : b.en) : `Livre ${bookNumber}`;
  };

  const doSearch = useCallback((text: string) => {
    setQuery(text);
    if (text.length < 2) { setResults([]); return; }
    setIsLoading(true);
    setTimeout(() => {
      const found = searchVerses(text, 80);
      setResults(found);
      setIsLoading(false);
      if (found.length > 0) {
        setRecentSearches(prev => [text, ...prev.filter(s => s !== text)].slice(0, 6));
      }
    }, 280);
  }, [searchVerses]);

  const handleAddFavorite = useCallback((verse: any) => {
    if (!appState) return;
    const isFav = appState.isFavorite(verse.book, verse.chapter, verse.verse);
    if (isFav) {
      appState.removeFavorite(verse.book, verse.chapter, verse.verse);
    } else {
      appState.addFavorite(verse, lang as 'fr' | 'en');
    }
    setResults(prev => [...prev]);
  }, [appState, lang]);

  const goToVerse = (book: number, chapter: number, verse: number) => {
    router.push({
      pathname: '/(books)/verses',
      params: { book: book.toString(), chapter: chapter.toString(), bookName: getBookName(book), verse: verse.toString() },
    });
  };

  // ── Empty / Home state ──────────────────────────────────────────────────────
  const renderHome = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.homeContent}>
      {/* Quick references */}
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Versets populaires</ThemedText>
        <View style={styles.quickGrid}>
          {QUICK_REFS.map(item => (
            <TouchableOpacity
              key={item.ref}
              style={styles.quickCard}
              onPress={() => goToVerse(item.book, item.chapter, item.verse)}
              activeOpacity={0.75}
            >
              <LinearGradient colors={['#6B3A2A', '#A0522D']} style={styles.quickCardGrad}>
                <Ionicons name="bookmark" size={14} color="rgba(255,255,255,0.7)" />
                <ThemedText style={styles.quickCardRef}>{item.ref}</ThemedText>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Suggestions */}
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Thèmes à explorer</ThemedText>
        <View style={styles.chips}>
          {SUGGESTIONS.map(s => (
            <TouchableOpacity key={s} style={styles.chip} onPress={() => doSearch(s)}>
              <ThemedText style={styles.chipText}>{s}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Recent */}
      {recentSearches.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <ThemedText style={styles.sectionTitle}>Récents</ThemedText>
            <TouchableOpacity onPress={() => setRecentSearches([])}>
              <ThemedText style={styles.clearBtn}>Effacer</ThemedText>
            </TouchableOpacity>
          </View>
          {recentSearches.map((s, i) => (
            <TouchableOpacity key={i} style={styles.recentRow} onPress={() => doSearch(s)}>
              <Ionicons name="time-outline" size={15} color="#A08880" />
              <ThemedText style={styles.recentText}>{s}</ThemedText>
              <Ionicons name="arrow-forward" size={13} color="#C8B4AC" />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );

  // ── Result card ─────────────────────────────────────────────────────────────
  const renderResult = ({ item }: { item: any }) => {
    const isFav = appState?.isFavorite(item.book, item.chapter, item.verse);
    const bookName = getBookName(item.book);
    const preview = item.text.length > 120 ? item.text.substring(0, 120) + '…' : item.text;

    return (
      <TouchableOpacity
        style={styles.resultCard}
        onPress={() => goToVerse(item.book, item.chapter, item.verse)}
        activeOpacity={0.75}
      >
        {/* Left accent */}
        <View style={styles.resultAccent} />

        <View style={styles.resultBody}>
          <View style={styles.resultHeader}>
            <View style={styles.resultRefBadge}>
              <ThemedText style={styles.resultRef}>{bookName} {item.chapter}:{item.verse}</ThemedText>
            </View>
            <TouchableOpacity
              onPress={() => handleAddFavorite(item)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name={isFav ? 'star' : 'star-outline'} size={18} color={isFav ? '#C9922A' : '#C8B4AC'} />
            </TouchableOpacity>
          </View>

          <ThemedText style={styles.resultText}>{preview}</ThemedText>

          <View style={styles.resultFooter}>
            <Ionicons name="book-outline" size={11} color="#C8B4AC" />
            <ThemedText style={styles.resultVersion}>
              {lang === 'fr' ? 'Louis Segond 1910' : 'KJV'}
            </ThemedText>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const showResults = query.length >= 2;
  const hasResults = results.length > 0;

  return (
    <ThemedView style={styles.container}>
      {/* Fixed search header */}
      <LinearGradient colors={['#3D1F14', '#6B3A2A']} style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerTitles}>
            <ThemedText style={styles.headerTitle}>Explorer la Bible</ThemedText>
            <ThemedText style={styles.headerSub}>Recherchez par mot-clé ou référence</ThemedText>
          </View>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={17} color="#A08880" />
            <TextInput
              ref={inputRef}
              style={styles.searchInput}
              placeholder="Chercher un verset, un thème..."
              placeholderTextColor="#A08880"
              value={query}
              onChangeText={doSearch}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => { setQuery(''); setResults([]); }}>
                <Ionicons name="close-circle" size={17} color="#A08880" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>

      {/* Results count bar */}
      {showResults && !isLoading && (
        <View style={styles.countBar}>
          <ThemedText style={styles.countText}>
            {hasResults ? `${results.length} résultat${results.length > 1 ? 's' : ''} pour « ${query} »` : `Aucun résultat pour « ${query} »`}
          </ThemedText>
        </View>
      )}

      {/* Loading */}
      {isLoading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#6B3A2A" size="large" />
          <ThemedText style={styles.loadingText}>Recherche…</ThemedText>
        </View>
      )}

      {/* Results list */}
      {!isLoading && showResults && hasResults && (
        <FlatList
          data={results}
          renderItem={renderResult}
          keyExtractor={(item, i) => `${item.book}-${item.chapter}-${item.verse}-${i}`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.resultsList}
        />
      )}

      {/* No results */}
      {!isLoading && showResults && !hasResults && (
        <View style={styles.emptyBox}>
          <View style={styles.emptyIcon}>
            <Ionicons name="search" size={32} color="#C8B4AC" />
          </View>
          <ThemedText style={styles.emptyTitle}>Aucun résultat</ThemedText>
          <ThemedText style={styles.emptySub}>Essayez un autre mot-clé ou vérifiez l'orthographe</ThemedText>
          <View style={styles.chips} style={{ marginTop: 16 }}>
            {SUGGESTIONS.slice(0, 4).map(s => (
              <TouchableOpacity key={s} style={styles.chip} onPress={() => doSearch(s)}>
                <ThemedText style={styles.chipText}>{s}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Home / empty state */}
      {!isLoading && !showResults && renderHome()}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF6F2' },

  // Header
  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 20,
    paddingHorizontal: 16,
    gap: 14,
  },
  headerTop: { flexDirection: 'row', alignItems: 'flex-start' },
  headerTitles: { flex: 1 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '700', letterSpacing: 0.2 },
  headerSub: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 3 },

  searchRow: {},
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#2A1510' },

  // Count bar
  countBar: {
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#EDE5DF',
  },
  countText: { fontSize: 12, color: '#888', fontWeight: '500' },

  // Loading
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: '#A08880' },

  // Results
  resultsList: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32 },
  resultCard: {
    flexDirection: 'row', backgroundColor: '#fff',
    borderRadius: 14, marginBottom: 10, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  resultAccent: { width: 4, backgroundColor: '#6B3A2A' },
  resultBody: { flex: 1, padding: 14, gap: 8 },
  resultHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  resultRefBadge: {
    backgroundColor: '#F5EDE8', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  resultRef: { fontSize: 13, fontWeight: '700', color: '#6B3A2A' },
  resultText: { fontSize: 14, lineHeight: 22, color: '#4A3530' },
  resultFooter: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  resultVersion: { fontSize: 11, color: '#C8B4AC' },

  // Empty / no results
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#F5EDE8', alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#4A3530' },
  emptySub: { fontSize: 13, color: '#A08880', textAlign: 'center' },

  // Home state
  homeContent: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 40, gap: 24 },
  section: { gap: 10 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#3D1F14', letterSpacing: 0.2 },
  clearBtn: { fontSize: 13, color: '#A08880' },

  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickCard: { borderRadius: 12, overflow: 'hidden', minWidth: '44%', flex: 1 },
  quickCardGrad: {
    paddingHorizontal: 14, paddingVertical: 14, gap: 6,
    alignItems: 'flex-start',
  },
  quickCardRef: { color: '#fff', fontSize: 14, fontWeight: '700' },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: '#fff', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: '#EDE5DF',
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 2, elevation: 1,
  },
  chipText: { fontSize: 13, color: '#6B3A2A', fontWeight: '500' },

  recentRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 11,
    marginBottom: 4,
    borderWidth: 1, borderColor: '#F0E8E4',
  },
  recentText: { flex: 1, fontSize: 14, color: '#4A3530' },
});