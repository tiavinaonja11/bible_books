import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert, Animated, Clipboard, FlatList, Modal,
  PanResponder, Platform, Share, StatusBar,
  StyleSheet, TextInput, TouchableOpacity, View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppContext, BookmarkPosition, Verse } from '@/hooks/useappstore';
import { useBible } from '@/hooks/usebible ';
import { HIGHLIGHT_COLORS, useHighlight } from '@/hooks/useHighlight';

const CHAPTER_TITLES: Record<string, Record<number, string>> = {
  Matthieu:   { 1: "La Naissance de Jésus", 5: "Les Béatitudes", 6: "Le Notre Père", 8: "Les Miracles", 27: "La Crucifixion", 28: "La Résurrection" },
  Jean:       { 1: "Le Verbe fait chair", 3: "La Nouvelle Naissance", 11: "La Résurrection de Lazare", 14: "Je suis le chemin", 17: "La prière sacerdotale" },
  Genese:     { 1: "La Création", 2: "Le Jardin d'Eden", 3: "La Chute", 6: "Noe et le Déluge", 12: "La vocation d'Abraham" },
  Psaumes:    { 1: "Le juste et le méchant", 23: "Le Bon Berger", 91: "La protection divine", 119: "Eloge de la Loi", 150: "Louez Dieu" },
  Romains:    { 8: "Vie dans l'Esprit", 12: "Le sacrifice vivant" },
  Apocalypse: { 1: "La Vision de Jean", 21: "La Nouvelle Jérusalem", 22: "La Rivière de Vie" },
};

const getChapterTitle = (bookName: string, chap: number): string | null => {
  const book = Object.keys(CHAPTER_TITLES).find(k =>
    bookName?.toLowerCase().startsWith(k.toLowerCase())
  );
  return book ? (CHAPTER_TITLES[book][chap] || null) : null;
};

export default function VersesScreen() {
  const appState = useContext(AppContext);
  const router = useRouter();
  const { book, chapter, bookName, verse: initialVerse } = useLocalSearchParams<{
    book: string; chapter: string; bookName: string; verse?: string;
  }>();

  const lang = appState?.lang || 'fr';
  const { getVerses, getChapters } = useBible(lang as 'fr' | 'en');
  const { addHighlight, removeHighlight, getHighlightColor, hasHighlight, getVerseHighlights } = useHighlight();

  const [fontSize, setFontSize] = useState(16);
  const [showFontPanel, setShowFontPanel] = useState(false);
  const [selectedVerse, setSelectedVerse] = useState<Verse | null>(null);
  const [showHighlightModal, setShowHighlightModal] = useState(false);
  const [note, setNote] = useState('');
  const [tempColor, setTempColor] = useState(HIGHLIGHT_COLORS[0].value);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Swipe animation
  const swipeX = useRef(new Animated.Value(0)).current;
  const isNavigating = useRef(false);

  // ✅ Correction: Valeurs par défaut pour éviter undefined
  const bookNumber = parseInt(book || '0', 10);
  const chapterNumber = parseInt(chapter || '1', 10);
  const verses = useMemo(() => getVerses(bookNumber, chapterNumber), [bookNumber, chapterNumber, getVerses]);
  const chapterTitle = getChapterTitle(bookName as string, chapterNumber);

  // Vérifier si le chapitre est en marque-page (UNIQUEMENT pour l'affichage)
  useEffect(() => {
    const checkBookmark = () => {
      if (appState?.bookmark) {
        const isMarked = appState.bookmark.book === bookNumber && appState.bookmark.chapter === chapterNumber;
        setIsBookmarked(isMarked);
      } else {
        setIsBookmarked(false);
      }
    };
    checkBookmark();
  }, [appState?.bookmark, bookNumber, chapterNumber]);

  // ── Marque-page (UNIQUEMENT au clic) ──────────────────────────────────────────────
  const handleBookmark = useCallback(() => {
    if (!appState) return;
    
    if (isBookmarked) {
      // Retirer le marque-page
      appState.clearBookmark();
      setIsBookmarked(false);
      Alert.alert('Marque-page retiré', `Chapitre ${chapterNumber} retiré des marque-pages`);
    } else {
      // Ajouter le marque-page
      const bookmarkPos: BookmarkPosition = {
        book: bookNumber,
        chapter: chapterNumber,
        verse: 1,
        book_name_fr: bookName as string,
        book_name_en: bookName as string,
        timestamp: Date.now(),
      };
      appState.setBookmark(bookmarkPos);
      setIsBookmarked(true);
      Alert.alert('Marque-page ajouté', `Chapitre ${chapterNumber} ajouté à vos marque-pages`);
    }
  }, [appState, isBookmarked, bookNumber, chapterNumber, bookName]);

  // ── Navigation avec animation swipe ──────────────────────────────────────────
  const navigateChapter = useCallback((dir: 'prev' | 'next') => {
    if (isNavigating.current) return;
    const next = dir === 'next' ? chapterNumber + 1 : chapterNumber - 1;
    const all = getChapters(bookNumber);
    const max = all.length > 0 ? Math.max(...all) : 150;
    if (next < 1 || next > max) return;

    isNavigating.current = true;
    const toValue = dir === 'next' ? -400 : 400;

    Animated.timing(swipeX, {
      toValue,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      swipeX.setValue(dir === 'next' ? 400 : -400);
      router.replace({
        pathname: '/(books)/verses',
        params: { book: bookNumber.toString(), chapter: next.toString(), bookName: bookName as string },
      });
      Animated.timing(swipeX, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => { isNavigating.current = false; });
    });
  }, [chapterNumber, bookNumber, bookName, getChapters, router, swipeX]);

  // ── PanResponder pour détecter le swipe ──────────────────────────────────────
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderMove: (_, g) => {
        swipeX.setValue(g.dx * 0.25);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx < -60) {
          navigateChapter('next');
        } else if (g.dx > 60) {
          navigateChapter('prev');
        } else {
          Animated.spring(swipeX, { toValue: 0, useNativeDriver: true }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(swipeX, { toValue: 0, useNativeDriver: true }).start();
      },
    })
  ).current;

  // ── Favoris ──────────────────────────────────────────────────────────────────
  const handleFavorite = useCallback((verse: Verse) => {
    if (!appState) return;
    const isFav = appState.isFavorite(verse.book, verse.chapter, verse.verse);
    if (isFav) {
      appState.removeFavorite(verse.book, verse.chapter, verse.verse);
    } else {
      appState.addFavorite(verse, lang as 'fr' | 'en');
    }
  }, [appState, lang]);

  // ── Surlignage ───────────────────────────────────────────────────────────────
  const openHighlight = (verse: Verse) => {
    const ex = getVerseHighlights(verse.book, verse.chapter, verse.verse)[0];
    setSelectedVerse(verse);
    setTempColor(ex?.color || HIGHLIGHT_COLORS[0].value);
    setNote(ex?.note || '');
    setShowHighlightModal(true);
  };

  const saveHighlight = () => {
    if (!selectedVerse) return;
    addHighlight({
      book: selectedVerse.book, chapter: selectedVerse.chapter,
      verse: selectedVerse.verse, text: selectedVerse.text,
      color: tempColor, note,
    });
    setShowHighlightModal(false);
    setSelectedVerse(null);
    setNote('');
  };

  const removeHighlightFn = () => {
    if (!selectedVerse) return;
    const ex = getVerseHighlights(selectedVerse.book, selectedVerse.chapter, selectedVerse.verse);
    if (ex[0]) removeHighlight(ex[0].id);
    setShowHighlightModal(false);
    setSelectedVerse(null);
  };

  // ── Copier / Partager ─────────────────────────────────────────────────────────
  const handleCopy = useCallback((verse: Verse) => {
    Clipboard.setString(`${bookName} ${chapterNumber}:${verse.verse}\n${verse.text}`);
    Alert.alert('✓', 'Verset copié');
  }, [bookName, chapterNumber]);

  const handleShare = useCallback(async (verse: Verse) => {
    try {
      await Share.share({ message: `« ${verse.text} »\n— ${bookName} ${chapterNumber}:${verse.verse}` });
    } catch (e: any) { Alert.alert('Erreur', e.message); }
  }, [bookName, chapterNumber]);

  // ── Couleur surlignage ────────────────────────────────────────────────────────
  const getVerseBg = (verse: Verse) => {
    const color = getHighlightColor(verse.book, verse.chapter, verse.verse);
    if (!color) return 'transparent';
    return HIGHLIGHT_COLORS.find(c => c.value === color)?.bg || 'transparent';
  };

  // ── Rendu verset ─────────────────────────────────────────────────────────────
  const renderVerse = ({ item }: { item: Verse }) => {
    const isFav = appState?.isFavorite(item.book, item.chapter, item.verse);
    const highlighted = hasHighlight(item.book, item.chapter, item.verse);
    const hlColor = getHighlightColor(item.book, item.chapter, item.verse);
    const bg = getVerseBg(item);
    const existingNote = getVerseHighlights(item.book, item.chapter, item.verse)[0]?.note;
    const isTarget = initialVerse && parseInt(initialVerse) === item.verse;

    return (
      <View style={[
        styles.verseCard,
        isTarget && styles.verseTarget,
        bg !== 'transparent' && { backgroundColor: bg },
      ]}>
        <View style={styles.verseRow}>
          <View style={styles.numBox}>
            <ThemedText style={styles.numText}>{item.verse}</ThemedText>
          </View>
          <ThemedText style={[styles.verseText, { fontSize, lineHeight: fontSize * 1.7 }]}>
            {item.text}
          </ThemedText>
        </View>

        <View style={styles.actionBar}>
          <TouchableOpacity onPress={() => handleFavorite(item)} style={styles.actionBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name={isFav ? 'star' : 'star-outline'} size={17} color={isFav ? '#C9922A' : '#B8A49C'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => openHighlight(item)} style={styles.actionBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="color-fill-outline" size={17} color={highlighted ? (hlColor || '#4CAF50') : '#B8A49C'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleCopy(item)} style={styles.actionBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="copy-outline" size={17} color="#B8A49C" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleShare(item)} style={styles.actionBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="share-social-outline" size={17} color="#B8A49C" />
          </TouchableOpacity>
        </View>

        {highlighted && existingNote ? (
          <View style={styles.noteRow}>
            <Ionicons name="chatbubble-outline" size={11} color="#6B3A2A" />
            <ThemedText style={styles.noteText}>{existingNote}</ThemedText>
          </View>
        ) : null}
      </View>
    );
  };

  // ── Indicateur de swipe en bas ────────────────────────────────────────────────
  const renderFooter = () => {
    const all = getChapters(bookNumber);
    const max = all.length > 0 ? Math.max(...all) : 150;
    return (
      <View style={styles.swipeHint}>
        {chapterNumber > 1 && (
          <View style={styles.swipeHintItem}>
            <Ionicons name="chevron-back" size={14} color="#C8B4AC" />
            <ThemedText style={styles.swipeHintText}>Ch. {chapterNumber - 1}</ThemedText>
          </View>
        )}
        <View style={styles.swipeDots}>
          {[...Array(3)].map((_, i) => (
            <View key={i} style={[styles.swipeDot, i === 1 && styles.swipeDotActive]} />
          ))}
        </View>
        {chapterNumber < max && (
          <View style={styles.swipeHintItem}>
            <ThemedText style={styles.swipeHintText}>Ch. {chapterNumber + 1}</ThemedText>
            <Ionicons name="chevron-forward" size={14} color="#C8B4AC" />
          </View>
        )}
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ── HEADER ── */}
      <LinearGradient colors={['#2C1208', '#5C2E15', '#7A3D20']} style={styles.header}>
        {/* Ligne nav */}
        <View style={styles.headerNav}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerIconBtn}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>

          <View style={styles.headerNavCenter}>
            <ThemedText style={styles.headerNavBook} numberOfLines={1}>{bookName}</ThemedText>
            <View style={styles.chapBadge}>
              <ThemedText style={styles.headerNavChap}>{chapterNumber}</ThemedText>
            </View>
          </View>

          <TouchableOpacity onPress={() => setShowFontPanel(p => !p)} style={styles.headerIconBtn}>
            <Ionicons name="text-outline" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Titre du passage */}
        {chapterTitle ? (
          <View style={styles.headerBody}>
            <ThemedText style={styles.headerLabel}>CHAPITRE</ThemedText>
            <ThemedText style={styles.headerTitle}>{chapterTitle}</ThemedText>
            <View style={styles.headerActions}>
              <TouchableOpacity 
                style={[styles.headerActionBtn, isBookmarked && styles.headerActionBtnActive]} 
                onPress={handleBookmark}>
                <Ionicons name={isBookmarked ? 'bookmark' : 'bookmark-outline'} size={13} color="#fff" />
                <ThemedText style={styles.headerActionText}>
                  {isBookmarked ? 'Marqué' : 'Marque-page'}
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerActionBtn}
                onPress={() => Alert.alert('Audio', 'Lecture audio à venir')}>
                <Ionicons name="headset-outline" size={13} color="#fff" />
                <ThemedText style={styles.headerActionText}>Écouter</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={[styles.headerActionBtn, isBookmarked && styles.headerActionBtnActive]} 
              onPress={handleBookmark}>
              <Ionicons name={isBookmarked ? 'bookmark' : 'bookmark-outline'} size={13} color="#fff" />
              <ThemedText style={styles.headerActionText}>
                {isBookmarked ? 'Marqué' : 'Marque-page'}
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerActionBtn}
              onPress={() => Alert.alert('Audio', 'Lecture audio à venir')}>
              <Ionicons name="headset-outline" size={13} color="#fff" />
              <ThemedText style={styles.headerActionText}>Écouter</ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {/* Panneau police */}
        {showFontPanel && (
          <View style={styles.fontPanel}>
            <TouchableOpacity style={styles.fontBtn} onPress={() => setFontSize(s => Math.max(12, s - 1))}>
              <ThemedText style={styles.fontBtnText}>A−</ThemedText>
            </TouchableOpacity>
            <ThemedText style={styles.fontSizeLabel}>{fontSize}</ThemedText>
            <TouchableOpacity style={styles.fontBtn} onPress={() => setFontSize(s => Math.min(28, s + 1))}>
              <ThemedText style={styles.fontBtnText}>A+</ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {/* Indicateur swipe sous le header */}
        <View style={styles.swipeIndicator}>
          <Ionicons name="chevron-back" size={12} color="rgba(255,255,255,0.35)" />
          <ThemedText style={styles.swipeIndicatorText}>glisser pour changer de chapitre</ThemedText>
          <Ionicons name="chevron-forward" size={12} color="rgba(255,255,255,0.35)" />
        </View>
      </LinearGradient>

      {/* ── LISTE AVEC SWIPE ── */}
      <Animated.View
        style={[styles.listContainer, { transform: [{ translateX: swipeX }] }]}
        {...panResponder.panHandlers}
      >
        <FlatList
          data={verses}
          keyExtractor={item => item.verse.toString()}
          renderItem={renderVerse}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          ListFooterComponent={renderFooter}
          scrollEventThrottle={16}
        />
      </Animated.View>

      {/* ── MODAL SURLIGNAGE ── */}
      <Modal visible={showHighlightModal} transparent animationType="slide"
        onRequestClose={() => setShowHighlightModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.modalHead}>
              <ThemedText style={styles.modalTitle}>Surligner le verset</ThemedText>
              <TouchableOpacity onPress={() => setShowHighlightModal(false)}>
                <Ionicons name="close" size={22} color="#999" />
              </TouchableOpacity>
            </View>

            <View style={styles.previewBox}>
              <ThemedText style={styles.previewText} numberOfLines={3}>{selectedVerse?.text}</ThemedText>
              <ThemedText style={styles.previewRef}>
                {bookName} {chapterNumber}:{selectedVerse?.verse}
              </ThemedText>
            </View>

            <ThemedText style={styles.modalLabel}>Couleur</ThemedText>
            <View style={styles.colorRow}>
              {HIGHLIGHT_COLORS.map(c => (
                <TouchableOpacity
                  key={c.value}
                  style={[styles.colorCircle, { backgroundColor: c.value }, tempColor === c.value && styles.colorCircleActive]}
                  onPress={() => setTempColor(c.value)}
                >
                  {tempColor === c.value && <Ionicons name="checkmark" size={16} color="#fff" />}
                </TouchableOpacity>
              ))}
            </View>

            <ThemedText style={styles.modalLabel}>Note personnelle</ThemedText>
            <TextInput
              style={styles.noteInput}
              placeholder="Ajouter une note..."
              placeholderTextColor="#B0A09A"
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalBtns}>
              {selectedVerse && getVerseHighlights(selectedVerse.book, selectedVerse.chapter, selectedVerse.verse)[0] && (
                <TouchableOpacity style={styles.btnRemove} onPress={removeHighlightFn}>
                  <ThemedText style={styles.btnRemoveText}>Supprimer</ThemedText>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.btnSave} onPress={saveHighlight}>
                <LinearGradient colors={['#5C2E15', '#8B4513']} style={styles.btnSaveGrad}>
                  <ThemedText style={styles.btnSaveText}>Sauvegarder</ThemedText>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF6F2' },

  // ── Header ───────────────────────────────────────────────────────────────────
  header: {
    paddingTop: Platform.OS === 'ios' ? 52 : 36,
    paddingBottom: 10,
    paddingHorizontal: 12,
  },
  headerNav: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 12,
  },
  headerIconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerNavCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerNavBook: { color: 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: '600' },
  chapBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2,
  },
  headerNavChap: { color: '#FFD4A8', fontSize: 14, fontWeight: '700' },

  headerBody: { gap: 4, paddingHorizontal: 2, marginBottom: 10 },
  headerLabel: { color: 'rgba(255,255,255,0.45)', fontSize: 9, fontWeight: '700', letterSpacing: 1.5 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800', letterSpacing: 0.1 },

  headerActions: { flexDirection: 'row', gap: 8, marginTop: 4, marginBottom: 8 },
  headerActionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderRadius: 20, paddingHorizontal: 11, paddingVertical: 6,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  headerActionBtnActive: {
    backgroundColor: 'rgba(255,215,0,0.3)',
    borderColor: '#FFD700',
  },
  headerActionText: { color: '#fff', fontSize: 11, fontWeight: '600' },

  fontPanel: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 20, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.12)',
    marginTop: 4,
  },
  fontBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8, paddingHorizontal: 18, paddingVertical: 7,
  },
  fontBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  fontSizeLabel: { color: '#FFD4A8', fontSize: 15, fontWeight: '700', minWidth: 28, textAlign: 'center' },

  swipeIndicator: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 6,
  },
  swipeIndicatorText: {
    color: 'rgba(255,255,255,0.35)', fontSize: 10, fontStyle: 'italic',
  },

  // ── Liste ─────────────────────────────────────────────────────────────────────
  listContainer: { flex: 1 },
  list: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 20 },

  verseCard: {
    borderRadius: 10, marginBottom: 4,
    paddingHorizontal: 12, paddingTop: 12, paddingBottom: 4,
  },
  verseTarget: { borderLeftWidth: 3, borderLeftColor: '#C9922A', paddingLeft: 9 },

  verseRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  numBox: {
    minWidth: 26, height: 26, borderRadius: 7,
    backgroundColor: '#6B3A2A',
    alignItems: 'center', justifyContent: 'center',
    marginTop: 2, flexShrink: 0,
  },
  numText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  verseText: { flex: 1, color: '#2A1510', letterSpacing: 0.1 },

  actionBar: {
    flexDirection: 'row', justifyContent: 'flex-end', gap: 2,
    marginTop: 8, paddingTop: 6, paddingBottom: 4,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#EDE5DF',
  },
  actionBtn: { padding: 7, borderRadius: 8 },

  noteRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#F5EDE8', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6, marginTop: 6, marginBottom: 4,
  },
  noteText: { flex: 1, fontSize: 12, color: '#6B3A2A', fontStyle: 'italic' },

  // ── Footer swipe hint ─────────────────────────────────────────────────────────
  swipeHint: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 20, paddingHorizontal: 8, marginTop: 12,
    borderTopWidth: 1, borderTopColor: '#EDE5DF',
  },
  swipeHintItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  swipeHintText: { fontSize: 12, color: '#C8B4AC', fontWeight: '500' },
  swipeDots: { flexDirection: 'row', gap: 5 },
  swipeDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#E0D4CE' },
  swipeDotActive: { backgroundColor: '#6B3A2A', width: 16, borderRadius: 4 },

  // ── Modal ─────────────────────────────────────────────────────────────────────
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingTop: 12,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#DDD', alignSelf: 'center', marginBottom: 16,
  },
  modalHead: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#2C1208' },
  previewBox: {
    backgroundColor: '#F5EDE8', borderRadius: 12,
    padding: 12, marginBottom: 16, gap: 6,
  },
  previewText: { fontSize: 13, color: '#4A2A1E', fontStyle: 'italic', lineHeight: 20 },
  previewRef: { fontSize: 11, fontWeight: '700', color: '#6B3A2A', textAlign: 'right' },
  modalLabel: { fontSize: 12, fontWeight: '700', color: '#6B5048', letterSpacing: 0.5, marginBottom: 10 },
  colorRow: { flexDirection: 'row', gap: 14, marginBottom: 20, flexWrap: 'wrap' },
  colorCircle: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3, elevation: 2,
  },
  colorCircleActive: { borderWidth: 3, borderColor: '#2C1208' },
  noteInput: {
    backgroundColor: '#FAF6F2', borderWidth: 1, borderColor: '#EDE5DF',
    borderRadius: 12, padding: 12, fontSize: 14, color: '#333',
    textAlignVertical: 'top', minHeight: 80, marginBottom: 16,
  },
  modalBtns: { flexDirection: 'row', gap: 10 },
  btnRemove: {
    flex: 1, paddingVertical: 13, borderRadius: 12,
    backgroundColor: '#FFF0EE', alignItems: 'center',
  },
  btnRemoveText: { color: '#E05A4A', fontWeight: '700', fontSize: 14 },
  btnSave: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  btnSaveGrad: { paddingVertical: 13, alignItems: 'center' },
  btnSaveText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});