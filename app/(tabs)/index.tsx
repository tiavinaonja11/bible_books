import { ThemedText } from '@/components/themed-text';
import { AppContext } from '@/hooks/useappstore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useContext, useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

// ─── Verset du jour ─────────────────────────────────────────────────────────────

const VERSES_OF_DAY = {
  fr: [
    { ref: 'Jean 3:16',        book: 43, chapter: 3,  verse: 16, text: 'Car Dieu a tant aimé le monde qu\'il a donné son Fils unique, afin que quiconque croit en lui ne périsse point, mais qu\'il ait la vie éternelle.' },
    { ref: 'Psaume 23:1',      book: 19, chapter: 23, verse: 1,  text: 'L\'Éternel est mon berger : je ne manquerai de rien.' },
    { ref: 'Philippiens 4:13', book: 50, chapter: 4,  verse: 13, text: 'Je puis tout par celui qui me fortifie.' },
    { ref: 'Romains 8:28',     book: 45, chapter: 8,  verse: 28, text: 'Nous savons, du reste, que toutes choses concourent au bien de ceux qui aiment Dieu.' },
    { ref: 'Matthieu 5:3',     book: 40, chapter: 5,  verse: 3,  text: 'Heureux les pauvres en esprit, car le royaume des cieux est à eux !' },
    { ref: 'Proverbes 3:5',    book: 20, chapter: 3,  verse: 5,  text: 'Confie-toi en l\'Éternel de tout ton cœur, et ne t\'appuie pas sur ta sagesse.' },
    { ref: 'Ésaïe 40:31',      book: 23, chapter: 40, verse: 31, text: 'Mais ceux qui se confient en l\'Éternel renouvellent leur force. Ils prennent le vol comme les aigles ; ils courent, et ne se lassent point.' },
  ],
  en: [
    { ref: 'John 3:16',        book: 43, chapter: 3,  verse: 16, text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.' },
    { ref: 'Psalm 23:1',       book: 19, chapter: 23, verse: 1,  text: 'The LORD is my shepherd; I shall not want.' },
    { ref: 'Philippians 4:13', book: 50, chapter: 4,  verse: 13, text: 'I can do all things through Christ which strengtheneth me.' },
    { ref: 'Romans 8:28',      book: 45, chapter: 8,  verse: 28, text: 'And we know that all things work together for good to them that love God.' },
    { ref: 'Matthew 5:3',      book: 40, chapter: 5,  verse: 3,  text: 'Blessed are the poor in spirit: for theirs is the kingdom of heaven.' },
    { ref: 'Proverbs 3:5',     book: 20, chapter: 3,  verse: 5,  text: 'Trust in the LORD with all thine heart; and lean not unto thine own understanding.' },
    { ref: 'Isaiah 40:31',     book: 23, chapter: 40, verse: 31, text: 'But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary.' },
  ],
};

function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

// ─── Plans de lecture ────────────────────────────────────────────────────────────

const READING_PLANS = {
  fr: [
    {
      id: 'gospel',
      icon: 'book-outline' as const,
      title: 'Lecture de l\'Évangile',
      subtitle: '30 jours à travers les Évangiles',
      totalDays: 30,
      currentDay: 8,
      books: [
        { book: 'Matthieu', bookNumber: 40, chapters: [1,2,3,4,5,6,7,8] },
        { book: 'Marc',     bookNumber: 41, chapters: [] as number[] },
        { book: 'Luc',      bookNumber: 42, chapters: [] as number[] },
        { book: 'Jean',     bookNumber: 43, chapters: [] as number[] },
      ],
      nextBook: 'Matthieu',
      nextBookNumber: 40,
      nextChapter: 9,
      color: ['#8B3A1A', '#C05A35'] as [string, string],
    },
    {
      id: 'psalms',
      icon: 'musical-notes-outline' as const,
      title: 'Psaumes et Proverbes',
      subtitle: 'Sagesse pour chaque jour',
      totalDays: 60,
      currentDay: 14,
      books: [
        { book: 'Psaumes',   bookNumber: 19, chapters: [1,2,3,4,5,6,7,8,9,10,11,12,13,14] },
        { book: 'Proverbes', bookNumber: 20, chapters: [] as number[] },
      ],
      nextBook: 'Psaumes',
      nextBookNumber: 19,
      nextChapter: 15,
      color: ['#1A3A6B', '#2952A3'] as [string, string],
    },
    {
      id: 'paul',
      icon: 'mail-outline' as const,
      title: 'Épîtres de Paul',
      subtitle: 'Les lettres apostoliques',
      totalDays: 45,
      currentDay: 3,
      books: [
        { book: 'Romains', bookNumber: 45, chapters: [1, 2, 3] },
      ],
      nextBook: 'Romains',
      nextBookNumber: 45,
      nextChapter: 4,
      color: ['#1A5C3A', '#2E8B57'] as [string, string],
    },
  ],
  en: [
    {
      id: 'gospel',
      icon: 'book-outline' as const,
      title: 'Gospel Reading',
      subtitle: '30 days through the Gospels',
      totalDays: 30,
      currentDay: 8,
      books: [
        { book: 'Matthew', bookNumber: 40, chapters: [1,2,3,4,5,6,7,8] },
        { book: 'Mark',    bookNumber: 41, chapters: [] as number[] },
        { book: 'Luke',    bookNumber: 42, chapters: [] as number[] },
        { book: 'John',    bookNumber: 43, chapters: [] as number[] },
      ],
      nextBook: 'Matthew',
      nextBookNumber: 40,
      nextChapter: 9,
      color: ['#8B3A1A', '#C05A35'] as [string, string],
    },
    {
      id: 'psalms',
      icon: 'musical-notes-outline' as const,
      title: 'Psalms & Proverbs',
      subtitle: 'Wisdom for every day',
      totalDays: 60,
      currentDay: 14,
      books: [
        { book: 'Psalms',   bookNumber: 19, chapters: [1,2,3,4,5,6,7,8,9,10,11,12,13,14] },
        { book: 'Proverbs', bookNumber: 20, chapters: [] as number[] },
      ],
      nextBook: 'Psalms',
      nextBookNumber: 19,
      nextChapter: 15,
      color: ['#1A3A6B', '#2952A3'] as [string, string],
    },
    {
      id: 'paul',
      icon: 'mail-outline' as const,
      title: 'Paul\'s Epistles',
      subtitle: 'The apostolic letters',
      totalDays: 45,
      currentDay: 3,
      books: [
        { book: 'Romans', bookNumber: 45, chapters: [1, 2, 3] },
      ],
      nextBook: 'Romans',
      nextBookNumber: 45,
      nextChapter: 4,
      color: ['#1A5C3A', '#2E8B57'] as [string, string],
    },
  ],
};

// ─── Textes UI bilingues ─────────────────────────────────────────────────────────

const UI_TEXT = {
  fr: {
    verseOfDay:      'Verset du jour',
    continueReading: 'Continuer la lecture',
    quickAccess:     'Accès rapide',
    oldTestament:    'Ancien Testament',
    newTestament:    'Nouveau Testament',
    books39:         '39 livres',
    books27:         '27 livres',
    yourActivity:    'Votre activité',
    favorites:       'Favoris',
    daysRead:        'Jours lus',
    progress:        'Progression',
    readingPlans:    'Plans de lecture',
    completed:       'complété',
    continueBtn:     'Continuer',
    startBtn:        'Commencer',
    chaptersRead:    'chapitres lus',
    newVerseBtn:     'Nouveau verset',
    langLabel:       'EN',
    addedFav:        'Ajouté aux favoris',
    removedFav:      'Retiré des favoris',
    version:         'Louis Segond 1910',
  },
  en: {
    verseOfDay:      'Verse of the Day',
    continueReading: 'Continue Reading',
    quickAccess:     'Quick Access',
    oldTestament:    'Old Testament',
    newTestament:    'New Testament',
    books39:         '39 books',
    books27:         '27 books',
    yourActivity:    'Your Activity',
    favorites:       'Favorites',
    daysRead:        'Days Read',
    progress:        'Progress',
    readingPlans:    'Reading Plans',
    completed:       'completed',
    continueBtn:     'Continue',
    startBtn:        'Start',
    chaptersRead:    'chapters read',
    newVerseBtn:     'New verse',
    langLabel:       'FR',
    addedFav:        'Added to favorites',
    removedFav:      'Removed from favorites',
    version:         'King James Version',
  },
};

const LAST_READ = {
  fr: { bookName: 'Matthieu', bookNumber: 40, chapter: 5, title: 'Les Béatitudes', abbrev: 'Mt', progress: 18 },
  en: { bookName: 'Matthew',  bookNumber: 40, chapter: 5, title: 'The Beatitudes',  abbrev: 'Mt', progress: 18 },
};

// ─── Type Plan ────────────────────────────────────────────────────────────────────

interface Plan {
  id: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle: string;
  totalDays: number;
  currentDay: number;
  books: { book: string; bookNumber: number; chapters: number[] }[];
  nextBook: string;
  nextBookNumber: number;
  nextChapter: number;
  color: [string, string];
}

// ─── Composant ReadingPlanCard ────────────────────────────────────────────────────

function ReadingPlanCard({
  plan,
  ui,
  onContinue,
}: {
  plan: Plan;
  ui: typeof UI_TEXT['fr'];
  onContinue: (bookNumber: number, bookName: string, chapter: number) => void;
}) {
  const pct = Math.round((plan.currentDay / plan.totalDays) * 100);
  const totalRead = plan.books.reduce((acc, b) => acc + b.chapters.length, 0);

  return (
    <View style={planStyles.card}>
      <LinearGradient colors={plan.color} style={planStyles.accentBar} />
      <View style={planStyles.inner}>
        {/* Header */}
        <View style={planStyles.header}>
          <LinearGradient colors={plan.color} style={planStyles.iconBox}>
            <Ionicons name={plan.icon} size={18} color="#fff" />
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <ThemedText style={planStyles.title}>{plan.title}</ThemedText>
            <ThemedText style={planStyles.subtitle}>{plan.subtitle}</ThemedText>
          </View>
          <View style={planStyles.dayBadge}>
            <ThemedText style={planStyles.dayNum}>{plan.currentDay}</ThemedText>
            <ThemedText style={planStyles.dayOf}>/{plan.totalDays}</ThemedText>
          </View>
        </View>

        {/* Barre de progression */}
        <View style={planStyles.progressArea}>
          <View style={planStyles.progressTrack}>
            <LinearGradient
              colors={plan.color}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[planStyles.progressFill, { width: `${pct}%` as any }]}
            />
          </View>
          <ThemedText style={planStyles.progressText}>{pct}% {ui.completed}</ThemedText>
        </View>

        {/* Footer */}
        <View style={planStyles.footer}>
          <View style={planStyles.statRow}>
            <Ionicons name="checkmark-circle-outline" size={13} color="#8B4513" />
            <ThemedText style={planStyles.statText}>
              {totalRead} {ui.chaptersRead}
            </ThemedText>
          </View>
          <TouchableOpacity
            style={[planStyles.continueBtn, { borderColor: plan.color[0] }]}
            onPress={() => onContinue(plan.nextBookNumber, plan.nextBook, plan.nextChapter)}
            activeOpacity={0.8}
          >
            <ThemedText style={[planStyles.continueBtnText, { color: plan.color[0] }]}>
              {plan.currentDay > 0 ? ui.continueBtn : ui.startBtn}
            </ThemedText>
            <Ionicons name="arrow-forward" size={13} color={plan.color[0]} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const planStyles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    marginBottom: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0E8E0',
  },
  accentBar: { width: 5 },
  inner: { flex: 1, padding: 16, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: {
    width: 40, height: 40, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  title:    { fontSize: 15, fontWeight: '700', color: '#2A1510', marginBottom: 2 },
  subtitle: { fontSize: 12, color: '#A08880' },
  dayBadge: { alignItems: 'flex-end' },
  dayNum:   { fontSize: 20, fontWeight: '800', color: '#8B4513', lineHeight: 22 },
  dayOf:    { fontSize: 11, color: '#C8B4AC' },
  progressArea:  { gap: 6 },
  progressTrack: {
    height: 6, backgroundColor: '#F0E8E0',
    borderRadius: 3, overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 3 },
  progressText: { fontSize: 11, color: '#A08880' },
  footer: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
  },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statText: { fontSize: 12, color: '#8B4513' },
  continueBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1.5, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  continueBtnText: { fontSize: 12, fontWeight: '700' },
});

// ─── Composant principal ─────────────────────────────────────────────────────────

function TabIndex() {
  const router = useRouter();
  const appState = useContext(AppContext);
  const [lang, setLang] = useState<'fr' | 'en'>((appState?.lang as 'fr' | 'en') || 'fr');
  const [verseIdx, setVerseIdx] = useState(() => getDayOfYear() % VERSES_OF_DAY['fr'].length);

  const ui       = UI_TEXT[lang];
  const verse    = VERSES_OF_DAY[lang][verseIdx];
  const lastRead = LAST_READ[lang];
  const plans    = READING_PLANS[lang];

  // Vérifier si le verset actuel est en favori
  const isVerseFav = appState?.isFavorite
    ? appState.isFavorite(verse.book, verse.chapter, verse.verse)
    : false;

  useEffect(() => {
    if (appState?.setLang) appState.setLang(lang);
  }, [lang]);

  // Basculer la langue
  const toggleLang = () => {
    const next = lang === 'fr' ? 'en' : 'fr';
    setLang(next);
    setVerseIdx(getDayOfYear() % VERSES_OF_DAY[next].length);
  };

  // Verset suivant
  const handleNewVerse = () => {
    setVerseIdx(prev => (prev + 1) % VERSES_OF_DAY[lang].length);
  };

  // ── Favori verset du jour ──────────────────────────────────────────────────────
  const handleVerseFavorite = useCallback(() => {
    if (!appState) return;
    const verseObj = { book: verse.book, chapter: verse.chapter, verse: verse.verse, text: verse.text };
    if (isVerseFav) {
      appState.removeFavorite(verse.book, verse.chapter, verse.verse);
      Alert.alert('', ui.removedFav);
    } else {
      appState.addFavorite(verseObj, lang as 'fr' | 'en');
      Alert.alert('', ui.addedFav);
    }
  }, [appState, verse, isVerseFav, lang, ui]);

  // ── Partager verset du jour ────────────────────────────────────────────────────
  const handleVerseShare = useCallback(async () => {
    try {
      await Share.share({ message: `« ${verse.text} »\n— ${verse.ref}` });
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    }
  }, [verse]);

  // ── Navigations ────────────────────────────────────────────────────────────────
  const handleQuickAccess = (testament: 'OT' | 'NT') => {
    router.push({ pathname: '/(books)/quick', params: { testament } });
  };

  const handleContinueReading = () => {
    router.push({
      pathname: '/(books)/verses',
      params: {
        book: lastRead.bookNumber.toString(),
        chapter: lastRead.chapter.toString(),
        bookName: lastRead.bookName,
      },
    });
  };

  const handlePlanContinue = (bookNumber: number, bookName: string, chapter: number) => {
    router.push({
      pathname: '/(books)/chapters',
      params: { book: bookNumber.toString(), bookName },
    });
  };

  // ── Données stats ──────────────────────────────────────────────────────────────
  const stats = {
    favoris:     appState?.favorites?.length || 0,
    jours:       45,
    progression: 8,
  };

  const today = new Date();
  const dateString = today.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const capitalizedDate = dateString.charAt(0).toUpperCase() + dateString.slice(1);

  // Header component (immobile)
  const Header = () => (
    <LinearGradient
      colors={['#5C1F08', '#8B4513', '#CD853F']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.headerGradient}
    >
      <View style={styles.decorCircle1} />
      <View style={styles.decorCircle2} />

      <View style={styles.headerContent}>
        <View style={styles.headerTop}>
          <View style={styles.headerTopLeft}>
            <Ionicons name="book" size={28} color="rgba(255,255,255,0.9)" />
            <ThemedText style={styles.appName}>Ma Bible</ThemedText>
          </View>
          <View style={styles.headerTopRight}>
            <TouchableOpacity style={styles.langBtn} onPress={toggleLang} activeOpacity={0.8}>
              <ThemedText style={styles.langBtnText}>{ui.langLabel}</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingsButton} onPress={() => router.push('/modal')}>
              <Ionicons name="settings-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <ThemedText style={styles.headerDate}>{capitalizedDate}</ThemedText>

        <View style={styles.versionRow}>
          <View style={styles.versionBadge}>
            <Ionicons name="shield-checkmark-outline" size={12} color="rgba(255,255,255,0.8)" />
            <ThemedText style={styles.headerVersion}>{ui.version}</ThemedText>
          </View>
        </View>
      </View>
    </LinearGradient>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#5C1F08" />
      {/* Header fixe - en dehors du ScrollView */}
      <Header />
      
      {/* Zone défilante */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ══ VERSET DU JOUR ══ */}
        <View style={styles.verseCard}>
          {/* En-tête */}
          <View style={styles.verseHeader}>
            <View style={styles.verseLabelRow}>
              <View style={styles.verseDot} />
              <ThemedText style={styles.verseTitle}>{ui.verseOfDay}</ThemedText>
            </View>
            <TouchableOpacity style={styles.newVerseBtn} onPress={handleNewVerse} activeOpacity={0.7}>
              <Ionicons name="refresh-outline" size={13} color="#8B4513" />
              <ThemedText style={styles.newVerseBtnText}>{ui.newVerseBtn}</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Corps */}
          <View style={styles.verseBody}>
            {/* Guillemet décoratif (pas Ionicons — caractère Unicode) */}
            <ThemedText style={styles.decorQuote}>{'\u201C'}</ThemedText>
            <ThemedText style={styles.verseText}>{verse.text}</ThemedText>
          </View>

          {/* Pied : référence + actions */}
          <View style={styles.verseFooter}>
            <View style={styles.verseRefBadge}>
              <Ionicons name="bookmark" size={12} color="#8B4513" />
              <ThemedText style={styles.verseRef}>{verse.ref}</ThemedText>
            </View>
            <View style={styles.verseActions}>
              {/* Favori */}
              <TouchableOpacity
                style={styles.verseActionBtn}
                onPress={handleVerseFavorite}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name={isVerseFav ? 'heart' : 'heart-outline'}
                  size={18}
                  color={isVerseFav ? '#D85A30' : '#C8B4AC'}
                />
              </TouchableOpacity>
              {/* Partager */}
              <TouchableOpacity
                style={styles.verseActionBtn}
                onPress={handleVerseShare}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="share-social-outline" size={18} color="#C8B4AC" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ══ CONTINUER LA LECTURE ══ */}
        <TouchableOpacity style={styles.continueCard} onPress={handleContinueReading} activeOpacity={0.85}>
          <LinearGradient colors={['#FAF0E8', '#FFF8F0']} style={styles.continueGradient}>
            <View style={styles.continueHeader}>
              <Ionicons name="play-circle" size={22} color="#8B4513" />
              <ThemedText style={styles.continueHeaderText}>{ui.continueReading}</ThemedText>
              <Ionicons name="chevron-forward" size={16} color="#C8B4AC" style={{ marginLeft: 'auto' }} />
            </View>
            <View style={styles.continueContent}>
              <LinearGradient colors={['#8B4513', '#CD853F']} style={styles.bookIconCircle}>
                <ThemedText style={styles.bookIconText}>{lastRead.abbrev}</ThemedText>
              </LinearGradient>
              <View style={styles.continueInfo}>
                <ThemedText style={styles.continueBook}>
                  {lastRead.bookName} {lastRead.chapter}
                </ThemedText>
                <ThemedText style={styles.continueTitle}>{lastRead.title}</ThemedText>
                <View style={styles.progressBarContainer}>
                  <View style={[styles.progressBar, { width: `${lastRead.progress}%` }]} />
                </View>
                <ThemedText style={styles.continueProgress}>
                  {lastRead.progress}% {ui.completed}
                </ThemedText>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* ══ ACCÈS RAPIDE ══ */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconBox}>
            <Ionicons name="flash" size={14} color="#8B4513" />
          </View>
          <ThemedText style={styles.sectionTitle}>{ui.quickAccess}</ThemedText>
        </View>

        <View style={styles.quickAccessContainer}>
          <TouchableOpacity style={styles.quickCard} onPress={() => handleQuickAccess('OT')} activeOpacity={0.88}>
            <LinearGradient colors={['#5C1F08', '#8B4513']} style={styles.quickGradient}>
              <View style={styles.quickIconBg}>
                <Ionicons name="library" size={26} color="#fff" />
              </View>
              <ThemedText style={styles.quickTitle}>{ui.oldTestament}</ThemedText>
              <ThemedText style={styles.quickSubtitle}>{ui.books39}</ThemedText>
              <View style={styles.quickArrow}>
                <Ionicons name="arrow-forward" size={14} color="rgba(255,255,255,0.6)" />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickCard} onPress={() => handleQuickAccess('NT')} activeOpacity={0.88}>
            <LinearGradient colors={['#CD853F', '#E8A050']} style={styles.quickGradient}>
              <View style={styles.quickIconBg}>
                <Ionicons name="book" size={26} color="#fff" />
              </View>
              <ThemedText style={styles.quickTitle}>{ui.newTestament}</ThemedText>
              <ThemedText style={styles.quickSubtitle}>{ui.books27}</ThemedText>
              <View style={styles.quickArrow}>
                <Ionicons name="arrow-forward" size={14} color="rgba(255,255,255,0.6)" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* ══ STATISTIQUES ══ */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconBox}>
            <Ionicons name="stats-chart" size={14} color="#8B4513" />
          </View>
          <ThemedText style={styles.sectionTitle}>{ui.yourActivity}</ThemedText>
        </View>

        <View style={styles.statsContainer}>
          <TouchableOpacity style={styles.statCard} onPress={() => router.push('/favorites')} activeOpacity={0.7}>
            <View style={[styles.statIconBox, { backgroundColor: '#FFF0EC' }]}>
              <Ionicons name="heart" size={20} color="#D85A30" />
            </View>
            <ThemedText style={styles.statValue}>{stats.favoris}</ThemedText>
            <ThemedText style={styles.statLabel}>{ui.favorites}</ThemedText>
          </TouchableOpacity>

          <View style={styles.statDivider} />

          <View style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: '#EDF5FF' }]}>
              <Ionicons name="calendar" size={20} color="#185FA5" />
            </View>
            <ThemedText style={styles.statValue}>{stats.jours}</ThemedText>
            <ThemedText style={styles.statLabel}>{ui.daysRead}</ThemedText>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: '#EEFBF2' }]}>
              <Ionicons name="trending-up" size={20} color="#0F6E56" />
            </View>
            <ThemedText style={styles.statValue}>{stats.progression}%</ThemedText>
            <ThemedText style={styles.statLabel}>{ui.progress}</ThemedText>
          </View>
        </View>

        {/* ══ PLANS DE LECTURE ══ */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconBox}>
            <Ionicons name="list" size={14} color="#8B4513" />
          </View>
          <ThemedText style={styles.sectionTitle}>{ui.readingPlans}</ThemedText>
        </View>

        {plans.map(plan => (
          <ReadingPlanCard
            key={plan.id}
            plan={plan}
            ui={ui}
            onContinue={handlePlanContinue}
          />
        ))}

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#5C1F08',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#FAF6F1',
  },
  scrollContent: {
    paddingBottom: 40,
    paddingTop: 16,
  },

  // Header
  headerGradient: {
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingTop: Platform.OS === 'ios' ? 12 : 12,
    paddingBottom: 28,
    overflow: 'hidden',
    shadowColor: '#5C1F08',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  decorCircle1: {
    position: 'absolute',
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -50, right: -40,
  },
  decorCircle2: {
    position: 'absolute',
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: 10, left: 20,
  },
  headerContent: { paddingHorizontal: 20, gap: 8 },
  headerTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 8,
  },
  headerTopLeft:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  appName:        { color: '#fff', fontSize: 26, fontWeight: '800', letterSpacing: 0.2 },
  headerTopRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  langBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  langBtnText:    { color: '#fff', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  settingsButton: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerDate:   { color: 'rgba(255,255,255,0.85)', fontSize: 14, letterSpacing: 0.1 },
  versionRow:   { flexDirection: 'row', marginTop: 4 },
  versionBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  headerVersion: { color: '#fff', fontSize: 12, fontWeight: '600' },

  // Contenu
  contentContainer: { padding: 16, paddingTop: 20 },

  // Section header
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginBottom: 12, marginTop: 20,
  },
  sectionIconBox: {
    width: 26, height: 26, borderRadius: 8,
    backgroundColor: '#F5E6D3',
    alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#2A1510', letterSpacing: 0.1 },

  // Verset du jour
  verseCard: {
    backgroundColor: '#fff',
    borderRadius: 20, marginBottom: 16,
    shadowColor: '#8B4513', shadowOpacity: 0.08, shadowRadius: 12,
    elevation: 4, borderWidth: 1, borderColor: '#F5E6D3', overflow: 'hidden',
    marginHorizontal: 16,
  },
  verseHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingTop: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#FBF3EC',
  },
  verseLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  verseDot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: '#8B4513' },
  verseTitle: {
    fontSize: 12, fontWeight: '700', color: '#8B4513',
    letterSpacing: 0.8, textTransform: 'uppercase',
  },
  newVerseBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FBF3EC', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12,
  },
  newVerseBtnText: { fontSize: 11, color: '#8B4513', fontWeight: '600' },
  verseBody: {
    paddingHorizontal: 18, paddingTop: 14, paddingBottom: 10,
    position: 'relative',
  },
  decorQuote: {
    fontSize: 64, color: '#F0E0D0',
    position: 'absolute', top: -8, left: 10,
    lineHeight: 70, fontWeight: '900',
  },
  verseText: {
    fontSize: 16, lineHeight: 26, color: '#3A2010',
    fontStyle: 'italic', paddingLeft: 8,
  },
  verseFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingBottom: 14, paddingTop: 4,
  },
  verseRefBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#F5E6D3', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
  },
  verseRef: { color: '#8B4513', fontWeight: '700', fontSize: 13 },
  verseActions: { flexDirection: 'row', gap: 6 },
  verseActionBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#FAF6F1',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#F0E8E0',
  },

  // Continuer la lecture
  continueCard: {
    borderRadius: 20, marginBottom: 16,
    shadowColor: '#8B4513', shadowOpacity: 0.08, shadowRadius: 10,
    elevation: 3, overflow: 'hidden',
    borderWidth: 1, borderColor: '#F0E0D0',
    marginHorizontal: 16,
  },
  continueGradient:   { padding: 16, gap: 14 },
  continueHeader:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  continueHeaderText: { fontSize: 15, fontWeight: '700', color: '#8B4513' },
  continueContent:    { flexDirection: 'row', alignItems: 'center', gap: 14 },
  bookIconCircle: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#8B4513', shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  bookIconText:    { color: '#fff', fontWeight: '800', fontSize: 18, letterSpacing: 0.5 },
  continueInfo:    { flex: 1, gap: 3 },
  continueBook:    { fontSize: 17, fontWeight: '800', color: '#5C1F08' },
  continueTitle:   { fontSize: 13, color: '#A08880' },
  progressBarContainer: {
    height: 5, backgroundColor: 'rgba(139,69,19,0.12)',
    borderRadius: 3, marginTop: 8, overflow: 'hidden',
  },
  progressBar:      { height: '100%', backgroundColor: '#8B4513', borderRadius: 3 },
  continueProgress: { fontSize: 11, color: '#B09080', marginTop: 3 },

  // Accès rapide
  quickAccessContainer: { flexDirection: 'row', gap: 12, marginBottom: 4, marginHorizontal: 16 },
  quickCard: {
    flex: 1, borderRadius: 18, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, elevation: 5,
  },
  quickGradient: { padding: 18, gap: 8, minHeight: 140 },
  quickIconBg: {
    width: 46, height: 46, borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  quickTitle:    { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 0.1 },
  quickSubtitle: { color: 'rgba(255,255,255,0.75)', fontSize: 12 },
  quickArrow:    { marginTop: 'auto' as any, alignSelf: 'flex-end' },

  // Stats
  statsContainer: {
    flexDirection: 'row', backgroundColor: '#fff',
    borderRadius: 20, padding: 16, marginBottom: 4,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
    justifyContent: 'space-around',
    borderWidth: 1, borderColor: '#F0E8E0',
    marginHorizontal: 16,
  },
  statCard: { alignItems: 'center', gap: 6, flex: 1 },
  statIconBox: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  statDivider: { width: 1, backgroundColor: '#F0E8E0', alignSelf: 'stretch', marginVertical: 8 },
  statValue:   { fontSize: 22, fontWeight: '800', color: '#2A1510' },
  statLabel:   { fontSize: 11, color: '#A08880', fontWeight: '500', textAlign: 'center' },
});

export default TabIndex;