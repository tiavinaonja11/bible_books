import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useContext, useState } from 'react';
import {
  Alert, FlatList, Platform, StatusBar,
  StyleSheet, TouchableOpacity, View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BOOKS } from '@/constants/books';
import { AppContext } from '@/hooks/useappstore';
import { useFocusEffect } from '@react-navigation/native';

// ── Couleurs de fond par livre (cycle) ────────────────────────────────────────
const CARD_ACCENTS = [
  '#6B3A2A', '#1A5C3A', '#1A3A6B', '#5A1A7A',
  '#7A3D20', '#2E5C4A', '#3A1A6B', '#6B4A1A',
];

const getBookName = (bookNumber: number, lang: string): string => {
  const b = BOOKS.find(x => x.book === bookNumber);
  return b ? (lang === 'fr' ? b.fr : b.en) : `Livre ${bookNumber}`;
};

const getAccent = (index: number) => CARD_ACCENTS[index % CARD_ACCENTS.length];

export default function FavoritesScreen() {
  const appState = useContext(AppContext);
  const router = useRouter();
  const [refresh, setRefresh] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);

  useFocusEffect(
    useCallback(() => { setRefresh(p => p + 1); }, [])
  );

  const lang = appState?.lang || 'fr';
  const favorites = appState?.favorites || [];

  // ── Navigation vers le verset ─────────────────────────────────────────────────
  const goToVerse = (item: any) => {
    const bookName = getBookName(item.book, lang);
    router.push({
      pathname: '/(books)/verses',
      params: {
        book: item.book.toString(),
        chapter: item.chapter.toString(),
        bookName,
        verse: item.verse.toString(),
      },
    });
  };

  // ── Suppression ───────────────────────────────────────────────────────────────
  const confirmRemove = (item: any) => {
    Alert.alert(
      'Retirer des favoris',
      'Voulez-vous retirer ce verset ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Retirer', style: 'destructive',
          onPress: () => {
            appState?.removeFavorite(item.book, item.chapter, item.verse);
            setRefresh(p => p + 1);
          },
        },
      ]
    );
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const deleteSelected = () => {
    Alert.alert(
      'Supprimer',
      `Supprimer ${selectedIds.size} favori${selectedIds.size > 1 ? 's' : ''} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer', style: 'destructive',
          onPress: () => {
            selectedIds.forEach(id => {
              const [b, c, v] = id.split('-').map(Number);
              appState?.removeFavorite(b, c, v);
            });
            setSelectedIds(new Set());
            setSelectionMode(false);
            setRefresh(p => p + 1);
          },
        },
      ]
    );
  };

  // ── Rendu carte favori ────────────────────────────────────────────────────────
  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const id = `${item.book}-${item.chapter}-${item.verse}`;
    const isSelected = selectedIds.has(id);
    const bookName = getBookName(item.book, lang);
    const accent = getAccent(index);
    const date = item.timestamp
      ? new Date(item.timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
      : null;

    return (
      <TouchableOpacity
        activeOpacity={0.82}
        onPress={() => selectionMode ? toggleSelect(id) : goToVerse(item)}
        onLongPress={() => { setSelectionMode(true); toggleSelect(id); }}
        style={styles.cardWrapper}
      >
        <View style={[styles.card, isSelected && styles.cardSelected]}>
          {/* Bande colorée gauche */}
          <View style={[styles.cardAccent, { backgroundColor: accent }]} />

          <View style={styles.cardBody}>
            {/* Ligne haute : référence + actions */}
            <View style={styles.cardHeader}>
              <View style={styles.refRow}>
                {isSelected ? (
                  <View style={[styles.checkCircle, { backgroundColor: accent }]}>
                    <Ionicons name="checkmark" size={12} color="#fff" />
                  </View>
                ) : (
                  <View style={[styles.bookDot, { backgroundColor: accent + '22' }]}>
                    <Ionicons name="book" size={10} color={accent} />
                  </View>
                )}
                <ThemedText style={[styles.refText, { color: accent }]}>
                  {bookName} {item.chapter}:{item.verse}
                </ThemedText>
              </View>

              {!selectionMode && (
                <TouchableOpacity
                  onPress={() => confirmRemove(item)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.removeBtn}
                >
                  <Ionicons name="close" size={16} color="#C8B4AC" />
                </TouchableOpacity>
              )}
            </View>

            {/* Texte du verset */}
            <ThemedText style={styles.verseText} numberOfLines={4}>
              {item.text}
            </ThemedText>

            {/* Pied de carte */}
            <View style={styles.cardFooter}>
              <View style={styles.versionPill}>
                <ThemedText style={styles.versionText}>
                  {item.lang === 'fr' ? 'LSG 1910' : 'KJV'}
                </ThemedText>
              </View>
              {date && (
                <ThemedText style={styles.dateText}>{date}</ThemedText>
              )}
              <TouchableOpacity
                onPress={() => goToVerse(item)}
                style={styles.readBtn}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <ThemedText style={[styles.readBtnText, { color: accent }]}>Lire</ThemedText>
                <Ionicons name="arrow-forward" size={12} color={accent} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ── Header de la liste ────────────────────────────────────────────────────────
  const renderHeader = () => (
    <View style={styles.listHeader}>
      <ThemedText style={styles.listHeaderCount}>
        {favorites.length} verset{favorites.length > 1 ? 's' : ''}
      </ThemedText>
      {favorites.length > 0 && (
        <TouchableOpacity
          onPress={() => { setSelectionMode(p => !p); setSelectedIds(new Set()); }}
          style={styles.selectToggle}
        >
          <ThemedText style={styles.selectToggleText}>
            {selectionMode ? 'Annuler' : 'Sélectionner'}
          </ThemedText>
        </TouchableOpacity>
      )}
    </View>
  );

  // ── État vide ─────────────────────────────────────────────────────────────────
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrap}>
        <LinearGradient colors={['#6B3A2A', '#A0522D']} style={styles.emptyIconGrad}>
          <Ionicons name="star" size={36} color="#FFD4A8" />
        </LinearGradient>
      </View>
      <ThemedText style={styles.emptyTitle}>Aucun favori</ThemedText>
      <ThemedText style={styles.emptySub}>
        Appuyez sur ★ lors de la lecture pour sauvegarder un verset ici
      </ThemedText>
      <TouchableOpacity
        style={styles.exploreBtn}
        onPress={() => router.push('/(tabs)/explore')}
      >
        <LinearGradient colors={['#5C2E15', '#8B4513']} style={styles.exploreBtnGrad}>
          <Ionicons name="search-outline" size={16} color="#fff" />
          <ThemedText style={styles.exploreBtnText}>Explorer la Bible</ThemedText>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ── HEADER FIXE ── */}
      <LinearGradient colors={['#2C1208', '#5C2E15']} style={styles.header}>
        <View style={styles.headerInner}>
          <View style={styles.headerLeft}>
            <Ionicons name="star" size={20} color="#FFD4A8" />
            <ThemedText style={styles.headerTitle}>Mes favoris</ThemedText>
          </View>
          {selectionMode && selectedIds.size > 0 && (
            <TouchableOpacity onPress={deleteSelected} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={16} color="#fff" />
              <ThemedText style={styles.deleteBtnText}>
                Supprimer ({selectedIds.size})
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>

        {/* Barre de stats */}
        {favorites.length > 0 && (
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <ThemedText style={styles.statNum}>{favorites.length}</ThemedText>
              <ThemedText style={styles.statLabel}>Versets</ThemedText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <ThemedText style={styles.statNum}>
                {new Set(favorites.map((f: any) => f.book)).size}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Livres</ThemedText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <ThemedText style={styles.statNum}>
                {new Set(favorites.map((f: any) => `${f.book}-${f.chapter}`)).size}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Chapitres</ThemedText>
            </View>
          </View>
        )}
      </LinearGradient>

      {/* ── LISTE ── */}
      <FlatList
        key={refresh}
        data={favorites}
        renderItem={renderItem}
        keyExtractor={(item, i) => `${item.book}-${item.chapter}-${item.verse}-${i}`}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          favorites.length === 0 && styles.listContentEmpty,
        ]}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF6F2' },

  // ── Header ───────────────────────────────────────────────────────────────────
  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
    gap: 16,
  },
  headerInner: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: 0.2 },

  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#C0392B', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  deleteBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14, paddingVertical: 12, paddingHorizontal: 20,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statNum: { color: '#FFD4A8', fontSize: 20, fontWeight: '800' },
  statLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: '500' },
  statDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.12)' },

  // ── Liste ─────────────────────────────────────────────────────────────────────
  listContent: { paddingHorizontal: 14, paddingBottom: 32 },
  listContentEmpty: { flexGrow: 1 },

  listHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16, paddingBottom: 10, paddingHorizontal: 2,
  },
  listHeaderCount: { fontSize: 13, color: '#A08880', fontWeight: '500' },
  selectToggle: {
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: '#F0E8E4', borderRadius: 20,
  },
  selectToggleText: { fontSize: 13, color: '#6B3A2A', fontWeight: '600' },

  // ── Carte ─────────────────────────────────────────────────────────────────────
  cardWrapper: { marginBottom: 10 },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#2C1208',
    shadowOpacity: 0.07,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cardSelected: {
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  cardAccent: { width: 4 },
  cardBody: { flex: 1, padding: 14, gap: 10 },

  cardHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
  },
  refRow: { flexDirection: 'row', alignItems: 'center', gap: 7, flex: 1 },
  bookDot: {
    width: 20, height: 20, borderRadius: 6,
    alignItems: 'center', justifyContent: 'center',
  },
  checkCircle: {
    width: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  refText: { fontSize: 13, fontWeight: '700', letterSpacing: 0.2 },
  removeBtn: { padding: 4 },

  verseText: {
    fontSize: 15, lineHeight: 23,
    color: '#3A2018', letterSpacing: 0.1,
  },

  cardFooter: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#F0E8E4',
    paddingTop: 8,
  },
  versionPill: {
    backgroundColor: '#F5EDE8', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  versionText: { fontSize: 10, color: '#A08880', fontWeight: '600' },
  dateText: { fontSize: 11, color: '#C8B4AC', flex: 1 },
  readBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
  },
  readBtnText: { fontSize: 12, fontWeight: '700' },

  // ── État vide ─────────────────────────────────────────────────────────────────
  emptyContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32, paddingVertical: 60, gap: 14,
  },
  emptyIconWrap: { marginBottom: 8 },
  emptyIconGrad: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#6B3A2A', shadowOpacity: 0.25, shadowRadius: 12, elevation: 6,
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#2C1208' },
  emptySub: {
    fontSize: 14, color: '#A08880', textAlign: 'center', lineHeight: 21,
  },
  exploreBtn: { marginTop: 8, borderRadius: 25, overflow: 'hidden' },
  exploreBtnGrad: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 24, paddingVertical: 13,
  },
  exploreBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});