import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useContext, useMemo, useRef, useState } from 'react';
import {
  Animated, Platform, SectionList, StyleSheet,
  TextInput, TouchableOpacity, View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BOOKS } from '@/constants/books';
import { AppContext } from '@/hooks/useappstore';

// ─── Catégories ────────────────────────────────────────────────────────────────
type Category = {
  title: string;
  subtitle: string;
  color: [string, string];
  icon: string;
  range: [number, number]; // book number range inclusive
};

const OT_CATEGORIES: Category[] = [
  { title: 'Pentateuque',       subtitle: '5 livres',  icon: 'flame-outline',      color: ['#8B3A1A', '#C05A35'], range: [1, 5] },
  { title: 'Livres historiques',subtitle: '12 livres', icon: 'hourglass-outline',  color: ['#1A5C3A', '#2E8B57'], range: [6, 17] },
  { title: 'Livres poétiques',  subtitle: '5 livres',  icon: 'musical-notes-outline', color: ['#1A3A6B', '#2952A3'], range: [18, 22] },
  { title: 'Grands prophètes',  subtitle: '5 livres',  icon: 'megaphone-outline',  color: ['#5A1A7A', '#8B2FC9'], range: [23, 27] },
  { title: 'Petits prophètes',  subtitle: '12 livres', icon: 'chatbubble-outline', color: ['#6B4A1A', '#A0702A'], range: [28, 39] },
];

const NT_CATEGORIES: Category[] = [
  { title: 'Évangiles',         subtitle: '4 livres',  icon: 'book-outline',       color: ['#8B3A1A', '#C05A35'], range: [40, 43] },
  { title: 'Actes',             subtitle: '1 livre',   icon: 'compass-outline',    color: ['#1A5C3A', '#2E8B57'], range: [44, 44] },
  { title: 'Épîtres de Paul',   subtitle: '13 livres', icon: 'mail-outline',       color: ['#1A3A6B', '#2952A3'], range: [45, 57] },
  { title: 'Épîtres générales', subtitle: '8 livres',  icon: 'globe-outline',      color: ['#5A1A7A', '#8B2FC9'], range: [58, 65] },
  { title: 'Apocalypse',        subtitle: '1 livre',   icon: 'eye-outline',        color: ['#7A1A1A', '#C92F2F'], range: [66, 66] },
];

const CHAPTER_COUNTS: Record<number, number> = {
  1:50,2:40,3:27,4:36,5:34,6:24,7:21,8:4,9:31,10:24,11:22,12:25,13:29,14:36,
  15:10,16:13,17:10,18:42,19:150,20:31,21:12,22:8,23:66,24:52,25:5,26:48,
  27:12,28:14,29:3,30:9,31:1,32:4,33:7,34:3,35:3,36:3,37:2,38:14,39:4,
  40:28,41:16,42:24,43:21,44:28,45:16,46:16,47:13,48:6,49:6,50:4,51:4,
  52:5,53:3,54:6,55:4,56:3,57:1,58:13,59:5,60:5,61:3,62:5,63:1,64:1,65:1,66:22,
};

// Initiales stylées pour chaque livre
const BOOK_ABBREV: Record<number, string> = {
  1:'Gn',2:'Ex',3:'Lv',4:'Nb',5:'Dt',6:'Jos',7:'Jg',8:'Rt',9:'1S',10:'2S',
  11:'1R',12:'2R',13:'1Ch',14:'2Ch',15:'Esd',16:'Né',17:'Est',18:'Jb',
  19:'Ps',20:'Pr',21:'Ec',22:'Ct',23:'Es',24:'Jr',25:'Lm',26:'Ez',27:'Dn',
  28:'Os',29:'Jl',30:'Am',31:'Ab',32:'Jon',33:'Mi',34:'Na',35:'Ha',36:'So',
  37:'Ag',38:'Za',39:'Ml',40:'Mt',41:'Mc',42:'Lc',43:'Jn',44:'Ac',45:'Rm',
  46:'1Co',47:'2Co',48:'Ga',49:'Ep',50:'Ph',51:'Col',52:'1Th',53:'2Th',
  54:'1Tm',55:'2Tm',56:'Tt',57:'Phm',58:'Hé',59:'Jc',60:'1P',61:'2P',
  62:'1Jn',63:'2Jn',64:'3Jn',65:'Jd',66:'Ap',
};

export default function QuickBooksScreen() {
  const { testament } = useLocalSearchParams<{ testament: 'OT' | 'NT' }>();
  const router = useRouter();
  const appState = useContext(AppContext);
  const lang = appState?.lang || 'fr';
  const [searchQuery, setSearchQuery] = useState('');
  const searchAnim = useRef(new Animated.Value(0)).current;

  const allBooks = BOOKS.filter(b => b.testament === testament);
  const categories = testament === 'OT' ? OT_CATEGORIES : NT_CATEGORIES;

  const handleBookPress = (bookNumber: number, bookName: string) => {
    router.push({ pathname: '/(books)/chapters', params: { book: bookNumber.toString(), bookName } });
  };

  // Build sections
  const sections = useMemo(() => {
    const filtered = searchQuery.length > 0
      ? allBooks.filter(b => (lang === 'fr' ? b.fr : b.en).toLowerCase().includes(searchQuery.toLowerCase()))
      : null;

    if (filtered) {
      return [{ cat: null, data: filtered }];
    }

    return categories.map(cat => ({
      cat,
      data: allBooks.filter(b => b.book >= cat.range[0] && b.book <= cat.range[1]),
    })).filter(s => s.data.length > 0);
  }, [searchQuery, allBooks, categories, lang]);

  const renderBook = ({ item, section }: { item: any; section: any }) => {
    const name = lang === 'fr' ? item.fr : item.en;
    const abbrev = BOOK_ABBREV[item.book] || name.substring(0, 2);
    const chapCount = CHAPTER_COUNTS[item.book] || 0;
    const color = section.cat?.color || ['#6B3A2A', '#A0522D'];

    return (
      <TouchableOpacity
        style={styles.bookRow}
        onPress={() => handleBookPress(item.book, name)}
        activeOpacity={0.7}
      >
        <LinearGradient colors={color} style={styles.bookAvatar}>
          <ThemedText style={styles.bookAbbrev}>{abbrev}</ThemedText>
        </LinearGradient>

        <View style={styles.bookMeta}>
          <ThemedText style={styles.bookName}>{name}</ThemedText>
          <ThemedText style={styles.bookSub}>{chapCount} chapitre{chapCount > 1 ? 's' : ''}</ThemedText>
        </View>

        <Ionicons name="chevron-forward" size={16} color="#C8B4AC" />
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section }: { section: any }) => {
    if (!section.cat) return null;
    const cat: Category = section.cat;
    return (
      <View style={styles.sectionHeader}>
        <LinearGradient colors={cat.color} style={styles.sectionIconBox}>
          <Ionicons name={cat.icon as any} size={14} color="#fff" />
        </LinearGradient>
        <View style={styles.sectionTitles}>
          <ThemedText style={styles.sectionTitle}>{cat.title}</ThemedText>
          <ThemedText style={styles.sectionSub}>{cat.subtitle}</ThemedText>
        </View>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#3D1F14', '#6B3A2A']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitles}>
            <ThemedText style={styles.headerTitle}>
              {testament === 'OT' ? 'Ancien Testament' : 'Nouveau Testament'}
            </ThemedText>
            <ThemedText style={styles.headerSub}>
              {testament === 'OT' ? '39 livres · 929 chapitres' : '27 livres · 260 chapitres'}
            </ThemedText>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={16} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un livre..."
            placeholderTextColor="#B0A09A"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* List */}
      <SectionList
        sections={sections as any}
        keyExtractor={item => item.book.toString()}
        renderItem={renderBook}
        renderSectionHeader={renderSectionHeader}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.listContent}
        SectionSeparatorComponent={() => <View style={{ height: 8 }} />}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF6F2' },

  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 20,
    paddingHorizontal: 16,
    gap: 16,
  },
  headerTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  backBtn: { padding: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', marginTop: 2 },
  headerTitles: { flex: 1 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '700', letterSpacing: 0.2 },
  headerSub: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 3 },

  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 11,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#333' },

  listContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 },

  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, paddingHorizontal: 4,
    marginTop: 4, marginBottom: 2,
  },
  sectionIconBox: {
    width: 28, height: 28, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  sectionTitles: {},
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#3D1F14', letterSpacing: 0.3 },
  sectionSub: { fontSize: 11, color: '#999', marginTop: 1 },

  bookRow: {
    flexDirection: 'row', alignItems: 'center', gap: 13,
    backgroundColor: '#fff', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    marginBottom: 6,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  bookAvatar: {
    width: 42, height: 42, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  bookAbbrev: { color: '#fff', fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
  bookMeta: { flex: 1 },
  bookName: { fontSize: 15, fontWeight: '600', color: '#2A1510' },
  bookSub: { fontSize: 12, color: '#A08880', marginTop: 2 },
}); 