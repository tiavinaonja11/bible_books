import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Modal,
  Platform,
  SectionList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BOOKS } from '@/constants/books';
import { AppContext } from '@/hooks/useappstore';
import { useBible } from '@/hooks/usebible ';
import { useReadingProgress } from '@/hooks/useReadingProgress';

const { width, height } = Dimensions.get('window');
const COLS = 5;
const CELL = (width - 32 - (COLS - 1) * 10) / COLS;

// ─── Données des livres ────────────────────────────────────────────────────────

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
  { title: 'Pentateuque',        color: ['#7B2D10','#C05A35'], range: [1,5]   },
  { title: 'Livres historiques', color: ['#0F5C3A','#1E8B57'], range: [6,17]  },
  { title: 'Livres poétiques',   color: ['#1A3A6B','#2952A3'], range: [18,22] },
  { title: 'Grands prophètes',   color: ['#5A1A7A','#8B2FC9'], range: [23,27] },
  { title: 'Petits prophètes',   color: ['#6B4A1A','#A0702A'], range: [28,39] },
];

const NT_CATS: Category[] = [
  { title: 'Évangiles',          color: ['#7B2D10','#C05A35'], range: [40,43] },
  { title: 'Actes',              color: ['#0F5C3A','#1E8B57'], range: [44,44] },
  { title: 'Épîtres de Paul',    color: ['#1A3A6B','#2952A3'], range: [45,57] },
  { title: 'Épîtres générales',  color: ['#5A1A7A','#8B2FC9'], range: [58,65] },
  { title: 'Apocalypse',         color: ['#7A1A1A','#C92F2F'], range: [66,66] },
];

const ALL_CATS = [...OT_CATS, ...NT_CATS];

// ─── Modal : sélecteur de livre ───────────────────────────────────────────────

function BookPickerModal({
  visible,
  currentBookNumber,
  lang,
  onSelect,
  onClose,
}: {
  visible: boolean;
  currentBookNumber: number;
  lang: string;
  onSelect: (bookNumber: number, bookName: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const slideAnim = useRef(new Animated.Value(height)).current;

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
        toValue: height,
        duration: 260,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  // Construction des sections
  const sections = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (query.length > 0) {
      // Mode recherche : liste plate filtrée
      const filtered = BOOKS.filter(b => {
        const name = lang === 'fr' ? b.fr : b.en;
        return name.toLowerCase().includes(query);
      });
      return [{ cat: null, data: filtered }];
    }

    // Mode normal : par catégories
    return ALL_CATS.map(cat => ({
      cat,
      data: BOOKS.filter(b => b.book >= cat.range[0] && b.book <= cat.range[1]),
    })).filter(s => s.data.length > 0);
  }, [search, lang]);

  const renderBook = ({ item, section }: { item: any; section: any }) => {
    const name    = lang === 'fr' ? item.fr : item.en;
    const abbrev  = BOOK_ABBREV[item.book] || name.slice(0, 2);
    const chapCount = CHAPTER_COUNTS[item.book] || 0;
    const isCurrent = item.book === currentBookNumber;
    const color   = section.cat?.color || (['#6B3A2A', '#A0522D'] as [string, string]);

    return (
      <TouchableOpacity
        style={[styles.bookRow, isCurrent && styles.bookRowActive]}
        onPress={() => onSelect(item.book, name)}
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

        {isCurrent
          ? <View style={styles.currentBadge}>
              <Ionicons name="bookmark" size={12} color="#8B4513" />
              <ThemedText style={styles.currentBadgeText}>Actuel</ThemedText>
            </View>
          : <Ionicons name="chevron-forward" size={16} color="#D0B8AC" />
        }
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
      {/* Fond semi-transparent cliquable */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      {/* Sheet animée */}
      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        {/* Handle */}
        <View style={styles.sheetHandle} />

        {/* En-tête du modal */}
        <View style={styles.sheetHeader}>
          <View>
            <ThemedText style={styles.sheetTitle}>Choisir un livre</ThemedText>
            <ThemedText style={styles.sheetSub}>66 livres · Ancien & Nouveau Testament</ThemedText>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={20} color="#8B4513" />
          </TouchableOpacity>
        </View>

        {/* Séparateur AT / NT */}
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

        {/* Barre de recherche */}
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

        {/* Liste des livres */}
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
      </Animated.View>
    </Modal>
  );
}

// ─── Écran principal ──────────────────────────────────────────────────────────

export default function ChaptersScreen() {
  const router   = useRouter();
  const appState = useContext(AppContext);
  const { book, bookName } = useLocalSearchParams<{ book: string; bookName: string }>();
  const lang = appState?.lang || 'fr';
  const { getChapters } = useBible(lang as 'fr' | 'en');
  const { isChapterComplete, getChapterReadCount } = useReadingProgress();

  const [showBookPicker, setShowBookPicker] = useState(false);

  const bookNumber    = parseInt(book || '0', 10);
  const chapters      = useMemo(() => getChapters(bookNumber), [bookNumber, getChapters]);
  const currentChapter = appState?.bookmark?.chapter || 1;

  // Progression depuis useReadingProgress (versets lus)
  // On considère un chapitre "lu" si au moins 1 verset a été vu
  const readCount = useMemo(
    () => chapters.filter(ch => getChapterReadCount(bookNumber, ch) > 0).length,
    [chapters, bookNumber, getChapterReadCount],
  );
  const progress = chapters.length > 0 ? Math.round((readCount / chapters.length) * 100) : 0;

  // ── Naviguer vers un autre livre via le sélecteur ────────────────────────────
  const handleBookSelect = (selectedBookNumber: number, selectedBookName: string) => {
    setShowBookPicker(false);
    // Petite pause pour laisser le modal se fermer
    setTimeout(() => {
      router.replace({
        pathname: '/(books)/chapters',
        params: { book: selectedBookNumber.toString(), bookName: selectedBookName },
      });
    }, 200);
  };

  const handleChapterPress = (chapter: number) => {
    router.push({
      pathname: '/(books)/verses',
      params: {
        book:     bookNumber.toString(),
        chapter:  chapter.toString(),
        bookName: bookName as string,
      },
    });
  };

  const renderChapter = ({ item }: { item: number }) => {
    const readVerses = getChapterReadCount(bookNumber, item);
    const isRead     = readVerses > 0;
    const isCurrent  = item === currentChapter;

    return (
      <TouchableOpacity
        style={[
          styles.cell,
          isRead    && styles.cellRead,
          isCurrent && styles.cellCurrent,
        ]}
        onPress={() => handleChapterPress(item)}
        activeOpacity={0.7}
      >
        {isRead ? (
          <LinearGradient colors={['#6B3A2A', '#A0522D']} style={styles.cellGradient}>
            <ThemedText style={styles.cellNumRead}>{item}</ThemedText>
            <View style={styles.checkDot}>
              <Ionicons name="checkmark" size={8} color="#fff" />
            </View>
          </LinearGradient>
        ) : (
          <View style={[styles.cellInner, isCurrent && styles.cellInnerCurrent]}>
            <ThemedText style={[styles.cellNum, isCurrent && styles.cellNumCurrent]}>
              {item}
            </ThemedText>
            {isCurrent && (
              <View style={styles.currentIndicator}>
                <Ionicons name="bookmark" size={10} color="#6B3A2A" />
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={styles.container}>

      {/* ══ HEADER ══ */}
      <LinearGradient colors={['#3D1F14', '#6B3A2A']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>

          {/* ▶ NOM DU LIVRE — CLIQUABLE pour ouvrir le sélecteur */}
          <TouchableOpacity
            style={styles.bookNameBtn}
            onPress={() => setShowBookPicker(true)}
            activeOpacity={0.75}
          >
            <ThemedText style={styles.headerBook}>{bookName}</ThemedText>
            <View style={styles.bookNameChevron}>
              <Ionicons name="chevron-down" size={14} color="rgba(255,255,255,0.7)" />
            </View>
          </TouchableOpacity>

          <View style={{ width: 38 }} />
        </View>

        {/* Progression */}
        <View style={styles.headerProgress}>
          <View style={styles.progressLabelRow}>
            <ThemedText style={styles.progressLabel}>Progression de lecture</ThemedText>
            <ThemedText style={styles.progressPct}>{progress}%</ThemedText>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` as any }]} />
          </View>
          <ThemedText style={styles.progressSub}>
            {readCount} / {chapters.length} chapitres lus
          </ThemedText>
        </View>
      </LinearGradient>

      {/* Légende */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#6B3A2A' }]} />
          <ThemedText style={styles.legendText}>Lu</ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#F0E6DF', borderWidth: 1, borderColor: '#D4BEB5' }]} />
          <ThemedText style={styles.legendText}>Non lu</ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FFD4A8', borderWidth: 1, borderColor: '#D4BEB5' }]} />
          <ThemedText style={styles.legendText}>Actuel</ThemedText>
        </View>
        <ThemedText style={styles.chapterCount}>{chapters.length} ch.</ThemedText>
      </View>

      {/* Grille des chapitres */}
      <FlatList
        data={chapters}
        keyExtractor={item => item.toString()}
        numColumns={COLS}
        renderItem={renderChapter}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
      />

      {/* ══ MODAL SÉLECTEUR DE LIVRE ══ */}
      <BookPickerModal
        visible={showBookPicker}
        currentBookNumber={bookNumber}
        lang={lang}
        onSelect={handleBookSelect}
        onClose={() => setShowBookPicker(false)}
      />
    </ThemedView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF6F2' },

  // Header
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
  backBtn: {
    padding: 8, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },

  // ▶ Bouton nom du livre
  bookNameBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  headerBook: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  bookNameChevron: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Progression
  headerProgress:  {},
  progressLabelRow:{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel:   { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '500', letterSpacing: 0.5 },
  progressPct:     { color: '#FFD4A8', fontSize: 14, fontWeight: '700' },
  progressTrack:   { height: 5, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  progressFill:    { height: '100%', backgroundColor: '#FFD4A8', borderRadius: 3 },
  progressSub:     { color: 'rgba(255,255,255,0.55)', fontSize: 11 },

  // Légende
  legend: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#EDE5DF',
    flexWrap: 'wrap',
  },
  legendItem:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot:   { width: 12, height: 12, borderRadius: 3 },
  legendText:  { fontSize: 12, color: '#888' },
  chapterCount:{ marginLeft: 'auto', fontSize: 12, color: '#888', fontWeight: '500' },

  // Grille
  grid: { padding: 16, paddingTop: 14 },
  row:  { gap: 10, marginBottom: 10 },
  cell: {
    width: CELL, height: CELL, borderRadius: 12, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
  },
  cellRead:    { shadowColor: '#6B3A2A', shadowOpacity: 0.2 },
  cellCurrent: { shadowColor: '#FFD4A8', shadowOpacity: 0.4, shadowRadius: 6, borderWidth: 2, borderColor: '#FFD4A8' },
  cellGradient:{ flex: 1, alignItems: 'center', justifyContent: 'center' },
  cellInner: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#EDE5DF', borderRadius: 12,
  },
  cellInnerCurrent: { backgroundColor: '#FFF8F0', borderColor: '#FFD4A8', borderWidth: 2 },
  cellNum:        { fontSize: 16, fontWeight: '600', color: '#4A2A1E' },
  cellNumCurrent: { fontSize: 16, fontWeight: '800', color: '#6B3A2A' },
  cellNumRead:    { fontSize: 16, fontWeight: '700', color: '#fff' },
  checkDot: {
    position: 'absolute', bottom: 5, right: 5,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  currentIndicator: {
    position: 'absolute', bottom: 5, right: 5,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: '#FFD4A8',
    alignItems: 'center', justifyContent: 'center',
  },

  // ══ Modal BookPicker ══
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: height * 0.85,
    backgroundColor: '#FFFAF6',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#DDD',
    alignSelf: 'center',
    marginTop: 12, marginBottom: 0,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E8E0',
  },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: '#1E0C04' },
  sheetSub:   { fontSize: 12, color: '#A08880', marginTop: 3 },
  closeBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#F5EDE8',
    alignItems: 'center', justifyContent: 'center',
  },

  // Séparateur AT/NT
  testamentRow: {
    flexDirection: 'row', gap: 8,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  testamentBadge: {
    flex: 1, paddingVertical: 6, borderRadius: 10,
    alignItems: 'center',
  },
  testamentText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },

  // Recherche
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16, marginBottom: 6,
    backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#EDE5DF',
    borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#2A1510' },

  // Liste des livres
  bookList: { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 4 },
  sectionHead: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, paddingHorizontal: 4,
    marginTop: 6,
  },
  sectionHeadDot: {
    width: 4, height: 24, borderRadius: 2,
  },
  sectionHeadTitle: { fontSize: 13, fontWeight: '700', color: '#3D1F14', flex: 1, letterSpacing: 0.2 },
  sectionHeadCount: { fontSize: 11, color: '#B0988A' },

  bookRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 11,
    marginBottom: 5,
    borderWidth: 1, borderColor: '#F0E8E0',
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 3, elevation: 1,
  },
  bookRowActive: {
    backgroundColor: '#FFF4EC',
    borderColor: '#E8C4A0',
    borderWidth: 1.5,
  },
  bookAvatar: {
    width: 42, height: 42, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  bookAbbrev:  { color: '#fff', fontSize: 13, fontWeight: '700', letterSpacing: 0.3 },
  bookMeta:    { flex: 1 },
  bookName:    { fontSize: 15, fontWeight: '600', color: '#1E0C04' },
  bookNameActive: { color: '#8B4513', fontWeight: '700' },
  bookSub:     { fontSize: 11, color: '#A08880', marginTop: 2 },
  currentBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F5E6D3',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10,
  },
  currentBadgeText: { fontSize: 11, color: '#8B4513', fontWeight: '700' },
});