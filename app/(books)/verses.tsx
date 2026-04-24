import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useContext, useMemo, useState } from 'react';
import { Alert, Clipboard, FlatList, Modal, Share, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AppContext } from '@/hooks/useappstore';
import { useBible } from '@/hooks/usebible ';
import { HIGHLIGHT_COLORS, useHighlight } from '@/hooks/useHighlight';

export default function VersesScreen() {
  const colorScheme = useColorScheme();
  const appState = useContext(AppContext);
  const router = useRouter();
  const { book, chapter, bookName, verse: initialVerse } = useLocalSearchParams<{
    book: string;
    chapter: string;
    bookName: string;
    verse?: string;
  }>();
  const lang = appState?.lang || 'fr';
  const { getVerses, getChapters } = useBible(lang as 'fr' | 'en');
  const {
    addHighlight,
    removeHighlight,
    getHighlightColor,
    hasHighlight,
    getVerseHighlights,
  } = useHighlight();

  const [fontSize, setFontSize] = useState(16);
  const [showControls, setShowControls] = useState(false);
  const [selectedVerse, setSelectedVerse] = useState<any>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [note, setNote] = useState('');
  const [tempColor, setTempColor] = useState(HIGHLIGHT_COLORS[0].value);

  const bookNumber = parseInt(book || '0', 10);
  const chapterNumber = parseInt(chapter || '1', 10);
  const verses = useMemo(
    () => getVerses(bookNumber, chapterNumber),
    [bookNumber, chapterNumber, getVerses]
  );

  // ─── Favoris ─────────────────────────────────────────────────────────────────
  const handleAddFavorite = useCallback(
    (verse: any) => {
      if (!appState) return;
      const isFav = appState.isFavorite(verse.book, verse.chapter, verse.verse);
      if (isFav) {
        appState.removeFavorite(verse.book, verse.chapter, verse.verse);
        Alert.alert('Favori', 'Verset retiré des favoris');
      } else {
        appState.addFavorite(verse, lang as 'fr' | 'en');
        Alert.alert('Favori', 'Verset ajouté aux favoris');
      }
    },
    [appState, lang]
  );

  // ─── Surlignage ──────────────────────────────────────────────────────────────
  const openHighlightModal = (verse: any) => {
    const existingHighlight = getVerseHighlights(verse.book, verse.chapter, verse.verse)[0];
    setSelectedVerse(verse);
    setTempColor(existingHighlight?.color || HIGHLIGHT_COLORS[0].value);
    setNote(existingHighlight?.note || '');
    setShowActionModal(true);
  };

  const handleSaveHighlight = () => {
    if (!selectedVerse) return;
    addHighlight({
      book: selectedVerse.book,
      chapter: selectedVerse.chapter,
      verse: selectedVerse.verse,
      text: selectedVerse.text,
      color: tempColor,
      note: note,
    });
    Alert.alert('Surlignage', 'Le verset a été surligné avec succès');
    setShowActionModal(false);
    setSelectedVerse(null);
    setNote('');
  };

  const handleRemoveHighlight = () => {
    if (!selectedVerse) return;
    const existingHighlights = getVerseHighlights(selectedVerse.book, selectedVerse.chapter, selectedVerse.verse);
    if (existingHighlights[0]) {
      removeHighlight(existingHighlights[0].id);
      Alert.alert('Surlignage', 'Le surlignage a été retiré');
    }
    setShowActionModal(false);
    setSelectedVerse(null);
  };

  // ─── Copier ───────────────────────────────────────────────────────────────────
  const handleCopyVerse = useCallback((verse: any) => {
    const ref = `${bookName} ${chapterNumber}:${verse.verse}`;
    Clipboard.setString(`${ref}\n${verse.text}`);
    Alert.alert('Copié', 'Le verset a été copié dans le presse-papiers');
  }, [bookName, chapterNumber]);

  // ─── Partager ─────────────────────────────────────────────────────────────────
  const handleShareVerse = useCallback(async (verse: any) => {
    const ref = `${bookName} ${chapterNumber}:${verse.verse}`;
    try {
      await Share.share({ message: `${ref}\n\n"${verse.text}"`, title: ref });
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    }
  }, [bookName, chapterNumber]);

  // ─── Taille de police ────────────────────────────────────────────────────────
  const changeFontSize = (delta: number) => {
    setFontSize(prev => Math.min(28, Math.max(12, prev + delta)));
  };

  // ─── Navigation chapitres ────────────────────────────────────────────────────
  const navigateChapter = (direction: 'prev' | 'next') => {
    const newChapter = direction === 'next' ? chapterNumber + 1 : chapterNumber - 1;
    const allChapters = getChapters(bookNumber);
    const maxChapter = allChapters.length > 0 ? Math.max(...allChapters) : 150;
    if (newChapter >= 1 && newChapter <= maxChapter) {
      router.push({
        pathname: '/(books)/verses',
        params: { book: bookNumber, chapter: newChapter.toString(), bookName },
      });
    } else {
      Alert.alert('Information', direction === 'next' ? 'Dernier chapitre' : 'Premier chapitre');
    }
  };

  // ─── Couleur de fond selon surlignage ────────────────────────────────────────
  const getVerseBackground = (verse: any) => {
    const highlightColor = getHighlightColor(verse.book, verse.chapter, verse.verse);
    if (highlightColor) {
      const colorObj = HIGHLIGHT_COLORS.find(c => c.value === highlightColor);
      return colorObj?.bg || 'transparent';
    }
    return 'transparent';
  };

  // ─── Rendu d'un verset ───────────────────────────────────────────────────────
  const renderVerse = ({ item }: { item: any }) => {
    const isFavorite = appState?.isFavorite(item.book, item.chapter, item.verse);
    const hasHighlight_ = hasHighlight(item.book, item.chapter, item.verse);
    const highlightColor = getHighlightColor(item.book, item.chapter, item.verse);
    const verseBg = getVerseBackground(item);
    const existingHighlights = getVerseHighlights(item.book, item.chapter, item.verse);
    const existingNote = existingHighlights[0]?.note;
    const isInitialVerse = initialVerse && parseInt(initialVerse) === item.verse;

    return (
      <View
        style={[
          styles.verseCard,
          { backgroundColor: verseBg || '#ffffff' },
          isInitialVerse && styles.initialVerse,
        ]}
      >
        {/* En-tête : numéro + icônes */}
        <View style={styles.verseHeaderRow}>
          {/* Numéro du verset */}
          <LinearGradient colors={['#8B4513', '#D2691E']} style={styles.verseNumberGradient}>
            <ThemedText style={styles.verseNumber}>{item.verse}</ThemedText>
          </LinearGradient>

          {/* Barre d'icônes */}
          <View style={styles.actionButtonsRow}>
            {/* ⭐ Favori */}
            <TouchableOpacity
              onPress={() => handleAddFavorite(item)}
              style={styles.iconButton}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            >
              <Ionicons
                name={isFavorite ? 'star' : 'star-outline'}
                size={21}
                color={isFavorite ? '#FFD700' : '#8B4513'}
              />
            </TouchableOpacity>

            <View style={styles.iconDivider} />

            {/* 🖍️ Surligner */}
            <TouchableOpacity
              onPress={() => openHighlightModal(item)}
              style={styles.iconButton}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            >
              <Ionicons
                name="color-fill-outline"
                size={21}
                color={hasHighlight_ ? (highlightColor || '#4CAF50') : '#8B4513'}
              />
            </TouchableOpacity>

            <View style={styles.iconDivider} />

            {/* 📋 Copier */}
            <TouchableOpacity
              onPress={() => handleCopyVerse(item)}
              style={styles.iconButton}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            >
              <Ionicons name="copy-outline" size={21} color="#8B4513" />
            </TouchableOpacity>

            <View style={styles.iconDivider} />

            {/* 📤 Partager */}
            <TouchableOpacity
              onPress={() => handleShareVerse(item)}
              style={styles.iconButton}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            >
              <Ionicons name="share-social-outline" size={21} color="#8B4513" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Texte du verset */}
        <ThemedText style={[styles.verseText, { fontSize }]}>
          {item.text}
        </ThemedText>

        {/* Note si présente */}
        {hasHighlight_ && existingNote ? (
          <View style={styles.noteBox}>
            <Ionicons name="document-text-outline" size={14} color="#8B4513" />
            <ThemedText style={styles.noteText}>{existingNote}</ThemedText>
          </View>
        ) : null}
      </View>
    );
  };

  // ─── Rendu principal ─────────────────────────────────────────────────────────
  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#8B4513', '#D2691E']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>

          <View style={styles.headerTextContainer}>
            <ThemedText style={styles.bookTitle}>{bookName}</ThemedText>
            <ThemedText style={styles.chapterText}>Chapitre {chapterNumber}</ThemedText>
          </View>

          <TouchableOpacity onPress={() => setShowControls(!showControls)} style={styles.headerButton}>
            <Ionicons name="text" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Barre de contrôle taille de police */}
      {showControls && (
        <View style={styles.controlBar}>
          <TouchableOpacity onPress={() => changeFontSize(-2)} style={styles.controlButton}>
            <ThemedText style={styles.controlButtonText}>A-</ThemedText>
          </TouchableOpacity>
          <ThemedText style={styles.fontSizeLabel}>{fontSize}px</ThemedText>
          <TouchableOpacity onPress={() => changeFontSize(2)} style={styles.controlButton}>
            <ThemedText style={styles.controlButtonText}>A+</ThemedText>
          </TouchableOpacity>
          <View style={styles.divider} />
          <ThemedText style={styles.hintText}>⭐ Favori | 🖍️ Surligner</ThemedText>
        </View>
      )}

      {/* Liste des versets */}
      <FlatList
        data={verses}
        keyExtractor={(item) => item.verse.toString()}
        renderItem={renderVerse}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />

      {/* Barre de navigation chapitres */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navButton} onPress={() => navigateChapter('prev')}>
          <Ionicons name="chevron-back" size={20} color="white" />
          <ThemedText style={styles.navButtonText}>Précédent</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navButton, styles.navButtonRight]} onPress={() => navigateChapter('next')}>
          <ThemedText style={styles.navButtonText}>Suivant</ThemedText>
          <Ionicons name="chevron-forward" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Modal surlignage */}
      <Modal
        visible={showActionModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowActionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient colors={['#ffffff', '#faf5f0']} style={styles.modalInner}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>Surligner le verset</ThemedText>
                <TouchableOpacity onPress={() => setShowActionModal(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalVerseBox}>
                <ThemedText style={styles.modalVerseText} numberOfLines={3}>
                  {selectedVerse?.text}
                </ThemedText>
                <ThemedText style={styles.modalVerseRef}>
                  {bookName} {chapterNumber}:{selectedVerse?.verse}
                </ThemedText>
              </View>

              <ThemedText style={styles.sectionLabel}>Couleurs</ThemedText>
              <View style={styles.colorList}>
                {HIGHLIGHT_COLORS.map(color => (
                  <TouchableOpacity
                    key={color.value}
                    style={[
                      styles.colorItem,
                      { backgroundColor: color.bg },
                      tempColor === color.value && styles.colorItemSelected,
                    ]}
                    onPress={() => setTempColor(color.value)}
                  >
                    <View style={[styles.colorDot, { backgroundColor: color.value }]} />
                    <ThemedText style={styles.colorName}>{color.name}</ThemedText>
                    {tempColor === color.value && (
                      <Ionicons name="checkmark" size={16} color={color.value} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <ThemedText style={styles.sectionLabel}>Note (optionnel)</ThemedText>
              <TextInput
                style={styles.noteInput}
                placeholder="Ajouter une note personnelle..."
                placeholderTextColor="#aaa"
                value={note}
                onChangeText={setNote}
                multiline
                numberOfLines={3}
              />

              <View style={styles.modalButtons}>
                {getVerseHighlights(selectedVerse?.book, selectedVerse?.chapter, selectedVerse?.verse)[0] && (
                  <TouchableOpacity
                    style={[styles.modalButton, styles.removeButton]}
                    onPress={handleRemoveHighlight}
                  >
                    <ThemedText style={styles.removeButtonText}>Supprimer</ThemedText>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleSaveHighlight}>
                  <LinearGradient colors={['#8B4513', '#D2691E']} style={styles.saveButtonGradient}>
                    <ThemedText style={styles.saveButtonText}>Sauvegarder</ThemedText>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f3ef',
  },
  header: {
    paddingTop: 55,
    paddingBottom: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerButton: {
    padding: 8,
  },
  headerTextContainer: {
    alignItems: 'center',
  },
  bookTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  chapterText: {
    color: 'white',
    fontSize: 13,
    opacity: 0.8,
    marginTop: 2,
  },
  controlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 15,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 25,
    gap: 15,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },
  controlButton: {
    backgroundColor: '#F5E6D3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  controlButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  fontSizeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B4513',
  },
  divider: {
    width: 1,
    height: 25,
    backgroundColor: '#f0e0d0',
  },
  hintText: {
    fontSize: 11,
    color: '#999',
  },
  listContent: {
    padding: 16,
    paddingBottom: 90,
  },
  verseCard: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  initialVerse: {
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
  },
  verseHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  verseNumberGradient: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verseNumber: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDF6EF',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#EDD9C8',
    gap: 2,
  },
  iconButton: {
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  iconDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#EDD9C8',
  },
  verseText: {
    lineHeight: 26,
    color: '#333',
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5E6D3',
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
    gap: 8,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: '#8B4513',
    fontStyle: 'italic',
  },
  navBar: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#8B4513',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  navButtonRight: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  navButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '85%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalInner: {
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  modalVerseBox: {
    backgroundColor: '#F5E6D3',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  modalVerseText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  modalVerseRef: {
    fontSize: 12,
    color: '#8B4513',
    fontWeight: '600',
    textAlign: 'right',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    marginTop: 5,
  },
  colorList: {
    gap: 10,
    marginBottom: 16,
  },
  colorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    gap: 12,
    borderWidth: 1,
    borderColor: '#f0e0d0',
  },
  colorItemSelected: {
    borderColor: '#8B4513',
    borderWidth: 2,
  },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  colorName: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  noteInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#f0e0d0',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#333',
    textAlignVertical: 'top',
    minHeight: 80,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButton: {
    overflow: 'hidden',
  },
  saveButtonGradient: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  removeButton: {
    backgroundColor: '#ffebee',
  },
  removeButtonText: {
    color: '#ff4444',
    fontSize: 14,
    fontWeight: '600',
  },
});