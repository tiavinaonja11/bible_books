import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert, Animated, Clipboard, Dimensions, FlatList, Modal,
  PanResponder, Platform,
  SectionList,
  Share, StatusBar,
  StyleSheet, TextInput, TouchableOpacity, TouchableWithoutFeedback, View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BOOKS } from '@/constants/books';
import { AppContext, BookmarkPosition, Verse } from '@/hooks/useappstore';
import { useBible } from '@/hooks/usebible ';
import { HIGHLIGHT_COLORS, useHighlight } from '@/hooks/useHighlight';

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get('window');

// ─── Données ───────────────────────────────────────────────────────────────────

const CHAPTER_COUNTS: Record<number, number> = {
  1:50,2:40,3:27,4:36,5:34,6:24,7:21,8:4,9:31,10:24,11:22,12:25,13:29,14:36,
  15:10,16:13,17:10,18:42,19:150,20:31,21:12,22:8,23:66,24:52,25:5,26:48,
  27:12,28:14,29:3,30:9,31:1,32:4,33:7,34:3,35:3,36:3,37:2,38:14,39:4,
  40:28,41:16,42:24,43:21,44:28,45:16,46:16,47:13,48:6,49:6,50:4,51:4,
  52:5,53:3,54:6,55:4,56:3,57:1,58:13,59:5,60:5,61:3,62:5,63:1,64:1,65:1,66:22,
};

const BOOK_ABBREV: Record<number, string> = {
  1:'Gn',2:'Ex',3:'Lv',4:'Nb',5:'Dt',6:'Jos',7:'Jg',8:'Rt',9:'1S',10:'2S',
  11:'1R',12:'2R',13:'1Ch',14:'2Ch',15:'Esd',16:'Né',17:'Est',18:'Jb',
  19:'Ps',20:'Pr',21:'Ec',22:'Ct',23:'És',24:'Jr',25:'Lm',26:'Éz',27:'Dn',
  28:'Os',29:'Jl',30:'Am',31:'Ab',32:'Jon',33:'Mi',34:'Na',35:'Ha',36:'So',
  37:'Ag',38:'Za',39:'Ml',40:'Mt',41:'Mc',42:'Lc',43:'Jn',44:'Ac',45:'Rm',
  46:'1Co',47:'2Co',48:'Ga',49:'Ép',50:'Ph',51:'Col',52:'1Th',53:'2Th',
  54:'1Tm',55:'2Tm',56:'Tt',57:'Phm',58:'Hé',59:'Jc',60:'1P',61:'2P',
  62:'1Jn',63:'2Jn',64:'3Jn',65:'Jd',66:'Ap',
};

type Category = {
  title: string;
  color: [string, string];
  range: [number, number];
};

const OT_CATS: Category[] = [
  { title: 'Pentateuque', color: ['#7B2D10','#C05A35'], range: [1,5] },
  { title: 'Livres historiques', color: ['#0F5C3A','#1E8B57'], range: [6,17] },
  { title: 'Livres poétiques', color: ['#1A3A6B','#2952A3'], range: [18,22] },
  { title: 'Grands prophètes', color: ['#5A1A7A','#8B2FC9'], range: [23,27] },
  { title: 'Petits prophètes', color: ['#6B4A1A','#A0702A'], range: [28,39] },
];

const NT_CATS: Category[] = [
  { title: 'Évangiles', color: ['#7B2D10','#C05A35'], range: [40,43] },
  { title: 'Actes', color: ['#0F5C3A','#1E8B57'], range: [44,44] },
  { title: 'Épîtres de Paul', color: ['#1A3A6B','#2952A3'], range: [45,57] },
  { title: 'Épîtres générales', color: ['#5A1A7A','#8B2FC9'], range: [58,65] },
  { title: 'Apocalypse', color: ['#7A1A1A','#C92F2F'], range: [66,66] },
];

const ALL_CATS = [...OT_CATS, ...NT_CATS];

const getChapterTitle = (bookName: string, chap: number): string | null => {
  const CHAPTER_TITLES: Record<string, Record<number, string>> = {
    Matthieu: { 1: 'La Naissance de Jésus', 5: 'Les Béatitudes', 6: 'Le Notre Père' },
    Jean: { 1: 'Le Verbe fait chair', 3: 'La Nouvelle Naissance' },
    Genese: { 1: 'La Création', 2: "Le Jardin d'Eden", 3: 'La Chute' },
    Psaumes: { 1: 'Le juste et le méchant', 23: 'Le Bon Berger', 91: 'La protection divine' },
  };
  const key = Object.keys(CHAPTER_TITLES).find(k =>
    bookName?.toLowerCase().startsWith(k.toLowerCase())
  );
  return key ? (CHAPTER_TITLES[key][chap] || null) : null;
};

// ─── Modal : 2 options ─────────────────────────────────────────────────────────

function ActionPickerModal({
  visible,
  onSelectChapters,
  onSelectBooks,
  onClose,
}: {
  visible: boolean;
  onSelectChapters: () => void;
  onSelectBooks: () => void;
  onClose: () => void;
}) {
  const slideAnim = useRef(new Animated.Value(SCREEN_H)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_H,
        duration: 260,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      <Animated.View style={[styles.actionSheet, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.actionHandle} />
        
        <View style={styles.actionHeader}>
          <ThemedText style={styles.actionTitle}>Navigation</ThemedText>
          <ThemedText style={styles.actionSubtitle}>
            Choisissez ce que vous voulez voir
          </ThemedText>
        </View>

        <TouchableOpacity style={styles.actionOption} onPress={onSelectChapters}>
          <LinearGradient colors={['#1A3A6B', '#2952A3']} style={styles.actionIconCircle}>
            <Ionicons name="grid" size={22} color="#fff" />
          </LinearGradient>
          <View style={styles.actionOptionContent}>
            <ThemedText style={styles.actionOptionTitle}>Voir tous les chapitres</ThemedText>
            <ThemedText style={styles.actionOptionDesc}>
              Afficher la liste des chapitres du livre
            </ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#C8B4AC" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionOption} onPress={onSelectBooks}>
          <LinearGradient colors={['#5A1A7A', '#8B2FC9']} style={styles.actionIconCircle}>
            <Ionicons name="library" size={22} color="#fff" />
          </LinearGradient>
          <View style={styles.actionOptionContent}>
            <ThemedText style={styles.actionOptionTitle}>Voir tous les livres</ThemedText>
            <ThemedText style={styles.actionOptionDesc}>
              Parcourir tous les livres de la Bible
            </ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#C8B4AC" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCancelBtn} onPress={onClose}>
          <ThemedText style={styles.actionCancelText}>Annuler</ThemedText>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

// ─── Modal : sélecteur de livres ───────────────────────────────────────────────

function BookSelectorModal({
  visible,
  currentBookNumber,
  lang,
  onSelectBook,
  onClose,
}: {
  visible: boolean;
  currentBookNumber: number;
  lang: string;
  onSelectBook: (bookNumber: number, bookName: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const slideAnim = useRef(new Animated.Value(SCREEN_H)).current;

  useEffect(() => {
    if (visible) {
      setSearch('');
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_H,
        duration: 260,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const sections = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (query.length > 0) {
      const filtered = BOOKS.filter(b => {
        const name = lang === 'fr' ? b.fr : b.en;
        return name.toLowerCase().includes(query);
      });
      return [{ cat: null, data: filtered }];
    }
    return ALL_CATS.map(cat => ({
      cat,
      data: BOOKS.filter(b => b.book >= cat.range[0] && b.book <= cat.range[1]),
    })).filter(s => s.data.length > 0);
  }, [search, lang]);

  const renderBook = ({ item, section }: { item: any; section: any }) => {
    const name = lang === 'fr' ? item.fr : item.en;
    const abbrev = BOOK_ABBREV[item.book] || name.slice(0, 2);
    const chapCount = CHAPTER_COUNTS[item.book] || 0;
    const isCurrent = item.book === currentBookNumber;
    const color = section.cat?.color || (['#6B3A2A', '#A0522D'] as [string, string]);

    return (
      <TouchableOpacity
        style={[styles.bookRow, isCurrent && styles.bookRowActive]}
        onPress={() => onSelectBook(item.book, name)}
        activeOpacity={0.72}
      >
        <LinearGradient colors={color} style={styles.bookAvatar}>
          <ThemedText style={styles.bookAbbrev}>{abbrev}</ThemedText>
        </LinearGradient>
        <View style={styles.bookMeta}>
          <ThemedText style={[styles.bookName, isCurrent && styles.bookNameActive]}>
            {name}
          </ThemedText>
          <ThemedText style={styles.bookSub}>
            {chapCount} chapitre{chapCount > 1 ? 's' : ''}
          </ThemedText>
        </View>
        {isCurrent ? (
          <View style={styles.currentBadge}>
            <Ionicons name="bookmark" size={12} color="#8B4513" />
            <ThemedText style={styles.currentBadgeText}>Actuel</ThemedText>
          </View>
        ) : (
          <Ionicons name="chevron-forward" size={16} color="#D0B8AC" />
        )}
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section }: { section: any }) => {
    if (!section.cat) return null;
    const cat: Category = section.cat;
    return (
      <View style={styles.sectionHead}>
        <LinearGradient colors={cat.color} style={styles.sectionHeadDot} />
        <ThemedText style={styles.sectionHeadTitle}>{cat.title}</ThemedText>
        <ThemedText style={styles.sectionHeadCount}>
          {section.data.length} livre{section.data.length > 1 ? 's' : ''}
        </ThemedText>
      </View>
    );
  };

  const isSearching = search.length > 0;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      <Animated.View style={[styles.bookSheet, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.actionHandle} />
        
        <View style={styles.actionHeader}>
          <ThemedText style={styles.actionTitle}>Choisir un livre</ThemedText>
          <ThemedText style={styles.actionSubtitle}>66 livres · Ancien & Nouveau Testament</ThemedText>
        </View>

        {!isSearching && (
          <View style={styles.testamentRow}>
            <View style={[styles.testamentBadge, { backgroundColor: '#3D0F0210' }]}>
              <ThemedText style={[styles.testamentText, { color: '#7B2D10' }]}>
                Ancien Testament · 39
              </ThemedText>
            </View>
            <View style={[styles.testamentBadge, { backgroundColor: '#CD853F18' }]}>
              <ThemedText style={[styles.testamentText, { color: '#B85C28' }]}>
                Nouveau Testament · 27
              </ThemedText>
            </View>
          </View>
        )}

        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={16} color="#A08880" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un livre..."
            placeholderTextColor="#C0A89A"
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color="#A08880" />
            </TouchableOpacity>
          )}
        </View>

        <SectionList
          sections={sections as any}
          keyExtractor={item => item.book.toString()}
          renderItem={renderBook}
          renderSectionHeader={renderSectionHeader}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={styles.bookList}
          SectionSeparatorComponent={() => <View style={{ height: 4 }} />}
        />

        <TouchableOpacity style={styles.actionCancelBtn} onPress={onClose}>
          <ThemedText style={styles.actionCancelText}>Annuler</ThemedText>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

// ─── Écran principal Verses ────────────────────────────────────────────────────

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
  
  // États pour les modals
  const [showActionPicker, setShowActionPicker] = useState(false);
  const [showBookSelector, setShowBookSelector] = useState(false);
  const [chaptersList, setChaptersList] = useState<number[]>([]);

  const swipeX = useRef(new Animated.Value(0)).current;
  const isNavigating = useRef(false);

  const bookNumber = parseInt(book || '0', 10);
  const chapterNumber = parseInt(chapter || '1', 10);
  const verses = useMemo(() => getVerses(bookNumber, chapterNumber), [bookNumber, chapterNumber, getVerses]);
  const chapterTitle = getChapterTitle(bookName as string, chapterNumber);

  // Charger la liste des chapitres
  useEffect(() => {
    const loadChapters = () => {
      const chapters = getChapters(bookNumber);
      if (chapters && chapters.length > 0) {
        setChaptersList(chapters);
      } else {
        const max = CHAPTER_COUNTS[bookNumber] || 50;
        const fallback = Array.from({ length: max }, (_, i) => i + 1);
        setChaptersList(fallback);
      }
    };
    loadChapters();
  }, [bookNumber, getChapters]);

  // Vérifier le marque-page
  useEffect(() => {
    if (appState?.bookmark) {
      setIsBookmarked(
        appState.bookmark.book === bookNumber && appState.bookmark.chapter === chapterNumber
      );
    } else {
      setIsBookmarked(false);
    }
  }, [appState?.bookmark, bookNumber, chapterNumber]);

  // ── Gestionnaires ────────────────────────────────────────────────────────────

  const handleBookmark = useCallback(() => {
    if (!appState) return;
    if (isBookmarked) {
      appState.clearBookmark();
      setIsBookmarked(false);
      Alert.alert('Marque-page retiré', `Chapitre ${chapterNumber} retiré`);
    } else {
      const pos: BookmarkPosition = {
        book: bookNumber, chapter: chapterNumber, verse: 1,
        book_name_fr: bookName as string,
        book_name_en: bookName as string,
        timestamp: Date.now(),
      };
      appState.setBookmark(pos);
      setIsBookmarked(true);
      Alert.alert('Marque-page ajouté', `Chapitre ${chapterNumber} ajouté`);
    }
  }, [appState, isBookmarked, bookNumber, chapterNumber, bookName]);

  // Option 1: Voir tous les chapitres → navigue vers l'écran des chapitres
  const handleSelectChapters = useCallback(() => {
    setShowActionPicker(false);
    setTimeout(() => {
      router.push({
        pathname: '/(books)/chapters',
        params: { book: bookNumber.toString(), bookName: bookName as string },
      });
    }, 200);
  }, [router, bookNumber, bookName]);

  // Option 2: Voir tous les livres → ouvre le sélecteur de livres
  const handleSelectBooks = useCallback(() => {
    setShowActionPicker(false);
    setTimeout(() => setShowBookSelector(true), 200);
  }, []);

  // Sélection d'un livre → Naviguer vers l'écran des chapitres
  const handleBookSelect = useCallback((selectedBookNumber: number, selectedBookName: string) => {
    setShowBookSelector(false);
    setTimeout(() => {
      router.push({
        pathname: '/(books)/chapters',
        params: {
          book: selectedBookNumber.toString(),
          bookName: selectedBookName,
        },
      });
    }, 200);
  }, [router]);

  // Navigation swipe
  const navigateChapter = useCallback((dir: 'prev' | 'next') => {
    if (isNavigating.current) return;
    const next = dir === 'next' ? chapterNumber + 1 : chapterNumber - 1;
    const max = chaptersList.length > 0 ? Math.max(...chaptersList) : 150;
    if (next < 1 || next > max) return;

    isNavigating.current = true;
    Animated.timing(swipeX, { toValue: dir === 'next' ? -400 : 400, duration: 220, useNativeDriver: true })
      .start(() => {
        swipeX.setValue(dir === 'next' ? 400 : -400);
        router.replace({ pathname: '/(books)/verses', params: { book: bookNumber.toString(), chapter: next.toString(), bookName: bookName as string } });
        Animated.timing(swipeX, { toValue: 0, duration: 200, useNativeDriver: true })
          .start(() => { isNavigating.current = false; });
      });
  }, [chapterNumber, bookNumber, bookName, chaptersList, router, swipeX]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderMove: (_, g) => swipeX.setValue(g.dx * 0.25),
      onPanResponderRelease: (_, g) => {
        if (g.dx < -60) navigateChapter('next');
        else if (g.dx > 60) navigateChapter('prev');
        else Animated.spring(swipeX, { toValue: 0, useNativeDriver: true }).start();
      },
      onPanResponderTerminate: () => Animated.spring(swipeX, { toValue: 0, useNativeDriver: true }).start(),
    })
  ).current;

  // Favoris, surlignage, copier, partager
  const handleFavorite = useCallback((verse: Verse) => {
    if (!appState) return;
    const isFav = appState.isFavorite(verse.book, verse.chapter, verse.verse);
    if (isFav) appState.removeFavorite(verse.book, verse.chapter, verse.verse);
    else appState.addFavorite(verse, lang as 'fr' | 'en');
  }, [appState, lang]);

  const openHighlight = (verse: Verse) => {
    const ex = getVerseHighlights(verse.book, verse.chapter, verse.verse)[0];
    setSelectedVerse(verse);
    setTempColor(ex?.color || HIGHLIGHT_COLORS[0].value);
    setNote(ex?.note || '');
    setShowHighlightModal(true);
  };

  const saveHighlight = () => {
    if (!selectedVerse) return;
    addHighlight({ book: selectedVerse.book, chapter: selectedVerse.chapter, verse: selectedVerse.verse, text: selectedVerse.text, color: tempColor, note });
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

  const handleCopy = useCallback((verse: Verse) => {
    Clipboard.setString(`${bookName} ${chapterNumber}:${verse.verse}\n${verse.text}`);
    Alert.alert('✓', 'Verset copié');
  }, [bookName, chapterNumber]);

  const handleShare = useCallback(async (verse: Verse) => {
    try { await Share.share({ message: `« ${verse.text} »\n— ${bookName} ${chapterNumber}:${verse.verse}` }); }
    catch (e: any) { Alert.alert('Erreur', e.message); }
  }, [bookName, chapterNumber]);

  const getVerseBg = (verse: Verse) => {
    const color = getHighlightColor(verse.book, verse.chapter, verse.verse);
    if (!color) return 'transparent';
    return HIGHLIGHT_COLORS.find(c => c.value === color)?.bg || 'transparent';
  };

  // Rendu des versets
  const renderVerse = ({ item }: { item: Verse }) => {
    const isFav = appState?.isFavorite(item.book, item.chapter, item.verse);
    const highlighted = hasHighlight(item.book, item.chapter, item.verse);
    const hlColor = getHighlightColor(item.book, item.chapter, item.verse);
    const bg = getVerseBg(item);
    const existingNote = getVerseHighlights(item.book, item.chapter, item.verse)[0]?.note;
    const isTarget = initialVerse && parseInt(initialVerse) === item.verse;

    return (
      <View style={[styles.verseCard, isTarget && styles.verseTarget, bg !== 'transparent' && { backgroundColor: bg }]}>
        <View style={styles.verseRow}>
          <View style={styles.numBox}>
            <ThemedText style={styles.numText}>{item.verse}</ThemedText>
          </View>
          <ThemedText style={[styles.verseText, { fontSize, lineHeight: fontSize * 1.7 }]}>
            {item.text}
          </ThemedText>
        </View>

        <View style={styles.actionBar}>
          <TouchableOpacity onPress={() => handleFavorite(item)} style={styles.actionBtn}>
            <Ionicons name={isFav ? 'star' : 'star-outline'} size={17} color={isFav ? '#C9922A' : '#B8A49C'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => openHighlight(item)} style={styles.actionBtn}>
            <Ionicons name="color-fill-outline" size={17} color={highlighted ? (hlColor || '#4CAF50') : '#B8A49C'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleCopy(item)} style={styles.actionBtn}>
            <Ionicons name="copy-outline" size={17} color="#B8A49C" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleShare(item)} style={styles.actionBtn}>
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

  const renderFooter = () => {
    const max = chaptersList.length > 0 ? Math.max(...chaptersList) : 150;
    return (
      <View style={styles.swipeHint}>
        {chapterNumber > 1 && (
          <TouchableOpacity style={styles.swipeHintItem} onPress={() => navigateChapter('prev')}>
            <Ionicons name="chevron-back" size={14} color="#C8B4AC" />
            <ThemedText style={styles.swipeHintText}>Ch. {chapterNumber - 1}</ThemedText>
          </TouchableOpacity>
        )}
        <View style={styles.swipeDots}>
          {[...Array(3)].map((_, i) => (
            <View key={i} style={[styles.swipeDot, i === 1 && styles.swipeDotActive]} />
          ))}
        </View>
        {chapterNumber < max && (
          <TouchableOpacity style={styles.swipeHintItem} onPress={() => navigateChapter('next')}>
            <ThemedText style={styles.swipeHintText}>Ch. {chapterNumber + 1}</ThemedText>
            <Ionicons name="chevron-forward" size={14} color="#C8B4AC" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const headerActions = (
    <View style={styles.headerActions}>
      <TouchableOpacity style={[styles.headerActionBtn, isBookmarked && styles.headerActionBtnActive]} onPress={handleBookmark}>
        <Ionicons name={isBookmarked ? 'bookmark' : 'bookmark-outline'} size={13} color="#fff" />
        <ThemedText style={styles.headerActionText}>{isBookmarked ? 'Marqué' : 'Marque-page'}</ThemedText>
      </TouchableOpacity>
      <TouchableOpacity style={styles.headerActionBtn} onPress={() => Alert.alert('Audio', 'Lecture audio à venir')}>
        <Ionicons name="headset-outline" size={13} color="#fff" />
        <ThemedText style={styles.headerActionText}>Écouter</ThemedText>
      </TouchableOpacity>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient colors={['#2C1208', '#5C2E15', '#7A3D20']} style={styles.header}>
        <View style={styles.headerNav}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerIconBtn}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>

          {/* Bouton cliquable qui ouvre l'ActionPicker */}
          <TouchableOpacity
            style={styles.bookNameBtn}
            onPress={() => setShowActionPicker(true)}
            activeOpacity={0.75}
          >
            <ThemedText style={styles.headerNavBook} numberOfLines={1}>{bookName}</ThemedText>
            <View style={styles.chapBadge}>
              <ThemedText style={styles.headerNavChap}>{chapterNumber}</ThemedText>
            </View>
            <View style={styles.bookChevron}>
              <Ionicons name="chevron-down" size={12} color="rgba(255,255,255,0.65)" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setShowFontPanel(p => !p)} style={styles.headerIconBtn}>
            <Ionicons name="text-outline" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {chapterTitle ? (
          <View style={styles.headerBody}>
            <ThemedText style={styles.headerLabel}>CHAPITRE</ThemedText>
            <ThemedText style={styles.headerTitle}>{chapterTitle}</ThemedText>
            {headerActions}
          </View>
        ) : (
          headerActions
        )}

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

        <View style={styles.swipeIndicator}>
          <Ionicons name="chevron-back" size={12} color="rgba(255,255,255,0.35)" />
          <ThemedText style={styles.swipeIndicatorText}>glisser pour changer de chapitre</ThemedText>
          <Ionicons name="chevron-forward" size={12} color="rgba(255,255,255,0.35)" />
        </View>
      </LinearGradient>

      <Animated.View style={[styles.listContainer, { transform: [{ translateX: swipeX }] }]} {...panResponder.panHandlers}>
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

      {/* Modal des 2 options */}
      <ActionPickerModal
        visible={showActionPicker}
        onSelectChapters={handleSelectChapters}
        onSelectBooks={handleSelectBooks}
        onClose={() => setShowActionPicker(false)}
      />

      {/* Modal sélecteur de livres */}
      <BookSelectorModal
        visible={showBookSelector}
        currentBookNumber={bookNumber}
        lang={lang}
        onSelectBook={handleBookSelect}
        onClose={() => setShowBookSelector(false)}
      />

      {/* Modal surlignage */}
      <Modal visible={showHighlightModal} transparent animationType="slide" onRequestClose={() => setShowHighlightModal(false)}>
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
              <ThemedText style={styles.previewRef}>{bookName} {chapterNumber}:{selectedVerse?.verse}</ThemedText>
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

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF6F2' },
  header: { paddingTop: Platform.OS === 'ios' ? 52 : 36, paddingBottom: 10, paddingHorizontal: 12 },
  headerNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  headerIconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  bookNameBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.10)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' },
  headerNavBook: { color: 'rgba(255,255,255,0.9)', fontSize: 15, fontWeight: '700' },
  chapBadge: { backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  headerNavChap: { color: '#FFD4A8', fontSize: 13, fontWeight: '700' },
  bookChevron: { width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  headerBody: { gap: 4, paddingHorizontal: 2, marginBottom: 10 },
  headerLabel: { color: 'rgba(255,255,255,0.45)', fontSize: 9, fontWeight: '700', letterSpacing: 1.5 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800', letterSpacing: 0.1 },
  headerActions: { flexDirection: 'row', gap: 8, marginTop: 4, marginBottom: 8 },
  headerActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.13)', borderRadius: 20, paddingHorizontal: 11, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  headerActionBtnActive: { backgroundColor: 'rgba(255,215,0,0.28)', borderColor: '#FFD700' },
  headerActionText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  fontPanel: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, paddingVertical: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.12)', marginTop: 4 },
  fontBtn: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, paddingHorizontal: 18, paddingVertical: 7 },
  fontBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  fontSizeLabel: { color: '#FFD4A8', fontSize: 15, fontWeight: '700', minWidth: 28, textAlign: 'center' },
  swipeIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 6 },
  swipeIndicatorText: { color: 'rgba(255,255,255,0.35)', fontSize: 10, fontStyle: 'italic' },
  listContainer: { flex: 1 },
  list: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 20 },
  verseCard: { borderRadius: 10, marginBottom: 4, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 4 },
  verseTarget: { borderLeftWidth: 3, borderLeftColor: '#C9922A', paddingLeft: 9 },
  verseRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  numBox: { minWidth: 26, height: 26, borderRadius: 7, backgroundColor: '#6B3A2A', alignItems: 'center', justifyContent: 'center', marginTop: 2, flexShrink: 0 },
  numText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  verseText: { flex: 1, color: '#2A1510', letterSpacing: 0.1 },
  actionBar: { flexDirection: 'row', justifyContent: 'flex-end', gap: 2, marginTop: 8, paddingTop: 6, paddingBottom: 4, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#EDE5DF' },
  actionBtn: { padding: 7, borderRadius: 8 },
  noteRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F5EDE8', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginTop: 6, marginBottom: 4 },
  noteText: { flex: 1, fontSize: 12, color: '#6B3A2A', fontStyle: 'italic' },
  swipeHint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 20, paddingHorizontal: 8, marginTop: 12, borderTopWidth: 1, borderTopColor: '#EDE5DF' },
  swipeHintItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  swipeHintText: { fontSize: 12, color: '#C8B4AC', fontWeight: '500' },
  swipeDots: { flexDirection: 'row', gap: 5 },
  swipeDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#E0D4CE' },
  swipeDotActive: { backgroundColor: '#6B3A2A', width: 16, borderRadius: 4 },

  // Overlay commun
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.48)' },
  
  // Action Picker Sheet
  actionSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFAF6', borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden', paddingBottom: 20 },
  actionHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#DDD', alignSelf: 'center', marginTop: 12 },
  actionHeader: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F0E8E0' },
  actionTitle: { fontSize: 18, fontWeight: '800', color: '#1E0C04' },
  actionSubtitle: { fontSize: 12, color: '#A08880', marginTop: 3 },
  actionOption: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F0E8E0' },
  actionIconCircle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  actionOptionContent: { flex: 1 },
  actionOptionTitle: { fontSize: 16, fontWeight: '600', color: '#2A1510' },
  actionOptionDesc: { fontSize: 12, color: '#A08880', marginTop: 2 },
  actionCancelBtn: { marginTop: 8, paddingVertical: 14, alignItems: 'center', backgroundColor: '#F5EDE8', marginHorizontal: 16, borderRadius: 12 },
  actionCancelText: { fontSize: 16, fontWeight: '600', color: '#6B3A2A' },

  // Book Selector Sheet
  bookSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFAF6', borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden', paddingBottom: 20, maxHeight: SCREEN_H * 0.85 },
  
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, marginVertical: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#EDE5DF', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 14, color: '#2A1510' },

  // Book Selector styles
  testamentRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  testamentBadge: { flex: 1, paddingVertical: 6, borderRadius: 10, alignItems: 'center' },
  testamentText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  bookList: { paddingHorizontal: 16, paddingBottom: 20, paddingTop: 4 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 4, marginTop: 6 },
  sectionHeadDot: { width: 4, height: 24, borderRadius: 2 },
  sectionHeadTitle: { fontSize: 13, fontWeight: '700', color: '#3D1F14', flex: 1, letterSpacing: 0.2 },
  sectionHeadCount: { fontSize: 11, color: '#B0988A' },
  bookRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11, marginBottom: 5, borderWidth: 1, borderColor: '#F0E8E0', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 3, elevation: 1 },
  bookRowActive: { backgroundColor: '#FFF4EC', borderColor: '#E8C4A0', borderWidth: 1.5 },
  bookAvatar: { width: 42, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  bookAbbrev: { color: '#fff', fontSize: 13, fontWeight: '700', letterSpacing: 0.3 },
  bookMeta: { flex: 1 },
  bookName: { fontSize: 15, fontWeight: '600', color: '#1E0C04' },
  bookNameActive: { color: '#8B4513', fontWeight: '700' },
  bookSub: { fontSize: 11, color: '#A08880', marginTop: 2 },
  currentBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F5E6D3', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  currentBadgeText: { fontSize: 11, color: '#8B4513', fontWeight: '700' },

  // Modal surlignage
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingTop: 12 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#DDD', alignSelf: 'center', marginBottom: 16 },
  modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#2C1208' },
  previewBox: { backgroundColor: '#F5EDE8', borderRadius: 12, padding: 12, marginBottom: 16, gap: 6 },
  previewText: { fontSize: 13, color: '#4A2A1E', fontStyle: 'italic', lineHeight: 20 },
  previewRef: { fontSize: 11, fontWeight: '700', color: '#6B3A2A', textAlign: 'right' },
  modalLabel: { fontSize: 12, fontWeight: '700', color: '#6B5048', letterSpacing: 0.5, marginBottom: 10 },
  colorRow: { flexDirection: 'row', gap: 14, marginBottom: 20, flexWrap: 'wrap' },
  colorCircle: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  colorCircleActive: { borderWidth: 3, borderColor: '#2C1208' },
  noteInput: { backgroundColor: '#FAF6F2', borderWidth: 1, borderColor: '#EDE5DF', borderRadius: 12, padding: 12, fontSize: 14, color: '#333', textAlignVertical: 'top', minHeight: 80, marginBottom: 16 },
  modalBtns: { flexDirection: 'row', gap: 10 },
  btnRemove: { flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: '#FFF0EE', alignItems: 'center' },
  btnRemoveText: { color: '#E05A4A', fontWeight: '700', fontSize: 14 },
  btnSave: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  btnSaveGrad: { paddingVertical: 13, alignItems: 'center' },
  btnSaveText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});