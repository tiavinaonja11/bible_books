import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AppContext } from '@/hooks/useappstore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useContext } from 'react';
import { Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

function TabIndex() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const appState = useContext(AppContext);
  const lang = appState?.lang || 'fr';

  // Verset du jour (exemple statique)
  const verseOfDay = {
    ref: 'Jean 3:16',
    text: 'Car Dieu a tant aimé le monde qu’il a donné son Fils unique, afin que quiconque croit en lui ne périsse point, mais qu’il ait la vie éternelle.',
  };

  // Continuer la lecture (exemple statique)
  const lastRead = {
    book: 'Matthieu',
    chapter: 5,
    title: 'Les Béatitudes',
    progress: 18,
  };

  // Stats (exemple)
  const stats = {
    favoris: appState?.favorites?.length || 0,
    jours: 45,
    progression: 8,
  };

  const handleQuickAccess = (testament: 'OT' | 'NT') => {
    router.push({
      pathname: '/(books)/quick',
      params: { testament },
    });
  };

  const handleContinueReading = () => {
    // Naviguer vers la page des chapitres
    router.push({
      pathname: '/(books)/chapters',
      params: { 
        book: lastRead.book,
        chapter: lastRead.chapter.toString()
      },
    });
  };

  const handleOpenBook = (bookName: string) => {
    router.push({
      pathname: '/(books)/chapters',
      params: { book: bookName },
    });
  };

  const today = new Date();
  const dateString = today.toLocaleDateString('fr-FR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const capitalizedDate = dateString.charAt(0).toUpperCase() + dateString.slice(1);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header avec dégradé */}
      <LinearGradient
        colors={['#8B4513', '#D2691E', '#CD853F']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <Ionicons name="book-outline" size={32} color="#fff" />
            <TouchableOpacity style={styles.settingsButton} onPress={() => router.push('/modal')}>
              <Ionicons name="settings-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <ThemedText style={styles.headerTitle}>Ma Bible</ThemedText>
          <ThemedText style={styles.headerDate}>{capitalizedDate}</ThemedText>
          <View style={styles.versionBadge}>
            <ThemedText style={styles.headerVersion}>Louis Segond 1910</ThemedText>
          </View>
        </View>
      </LinearGradient>

      {/* Contenu principal */}
      <View style={styles.contentContainer}>
        
        {/* Verset du jour */}
        <TouchableOpacity style={styles.verseCard} onPress={() => router.push('/(books)/verses')}>
          <View style={styles.verseHeader}>
            <Ionicons name="calendar-outline" size={20} color="#8B4513" />
            <ThemedText style={styles.verseTitle}>Verset du jour</ThemedText>
          </View>
          <ThemedText style={styles.verseText}>"{verseOfDay.text}"</ThemedText>
          <View style={styles.verseRefContainer}>
            <View style={styles.verseRefBadge}>
              <ThemedText style={styles.verseRef}>{verseOfDay.ref}</ThemedText>
            </View>
          </View>
        </TouchableOpacity>

        {/* Continuer la lecture */}
        <TouchableOpacity style={styles.continueCard} onPress={handleContinueReading}>
          <View style={styles.continueHeader}>
            <Ionicons name="play-circle-outline" size={24} color="#8B4513" />
            <ThemedText style={styles.continueHeaderText}>Continuer la lecture</ThemedText>
          </View>
          <View style={styles.continueContent}>
            <View style={styles.bookIcon}>
              <ThemedText style={styles.bookIconText}>Mt</ThemedText>
            </View>
            <View style={styles.continueInfo}>
              <ThemedText style={styles.continueBook}>{lastRead.book} {lastRead.chapter}</ThemedText>
              <ThemedText style={styles.continueTitle}>{lastRead.title}</ThemedText>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: `${lastRead.progress}%` }]} />
              </View>
              <ThemedText style={styles.continueProgress}>{lastRead.progress}% complété</ThemedText>
            </View>
          </View>
        </TouchableOpacity>

        {/* Accès rapide */}
        <View style={styles.sectionHeader}>
          <Ionicons name="rocket-outline" size={22} color="#8B4513" />
          <ThemedText style={styles.sectionTitle}>Accès rapide</ThemedText>
        </View>
        
        <View style={styles.quickAccessContainer}>
          <TouchableOpacity 
            style={[styles.quickCard, styles.quickCardOT]}
            onPress={() => handleQuickAccess('OT')}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#8B4513', '#A0522D']}
              style={styles.quickGradient}
            >
              <Ionicons name="library-outline" size={32} color="#fff" />
              <ThemedText style={styles.quickTitle}>Ancien Testament</ThemedText>
              <ThemedText style={styles.quickSubtitle}>39 livres</ThemedText>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.quickCard, styles.quickCardNT]}
            onPress={() => handleQuickAccess('NT')}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#CD853F', '#D2691E']}
              style={styles.quickGradient}
            >
              <Ionicons name="book-outline" size={32} color="#fff" />
              <ThemedText style={styles.quickTitle}>Nouveau Testament</ThemedText>
              <ThemedText style={styles.quickSubtitle}>27 livres</ThemedText>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Statistiques */}
        <View style={styles.sectionHeader}>
          <Ionicons name="stats-chart-outline" size={22} color="#8B4513" />
          <ThemedText style={styles.sectionTitle}>Votre activité</ThemedText>
        </View>

        <View style={styles.statsContainer}>
          <TouchableOpacity style={styles.statCard} onPress={() => router.push('/favorites')}>
            <Ionicons name="heart-outline" size={28} color="#8B4513" />
            <ThemedText style={styles.statValue}>{stats.favoris}</ThemedText>
            <ThemedText style={styles.statLabel}>Favoris</ThemedText>
          </TouchableOpacity>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statCard}>
            <Ionicons name="calendar-outline" size={28} color="#8B4513" />
            <ThemedText style={styles.statValue}>{stats.jours}</ThemedText>
            <ThemedText style={styles.statLabel}>Jours lus</ThemedText>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statCard}>
            <Ionicons name="trending-up-outline" size={28} color="#8B4513" />
            <ThemedText style={styles.statValue}>{stats.progression}%</ThemedText>
            <ThemedText style={styles.statLabel}>Progression</ThemedText>
          </View>
        </View>

        {/* Plans de lecture */}
        <View style={styles.sectionHeader}>
          <Ionicons name="list-outline" size={22} color="#8B4513" />
          <ThemedText style={styles.sectionTitle}>Plans de lecture</ThemedText>
        </View>

        <TouchableOpacity style={styles.planCard} onPress={() => handleOpenBook('Matthieu')}>
          <View style={styles.planIcon}>
            <Ionicons name="book-outline" size={24} color="#8B4513" />
          </View>
          <View style={styles.planInfo}>
            <ThemedText style={styles.planTitle}>Lecture de l'Évangile</ThemedText>
            <ThemedText style={styles.planSubtitle}>30 jours à travers les Évangiles</ThemedText>
          </View>
          <Ionicons name="chevron-forward-outline" size={20} color="#8B4513" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.planCard} onPress={() => handleOpenBook('Psaumes')}>
          <View style={styles.planIcon}>
            <Ionicons name="time-outline" size={24} color="#8B4513" />
          </View>
          <View style={styles.planInfo}>
            <ThemedText style={styles.planTitle}>Psaumes et Proverbes</ThemedText>
            <ThemedText style={styles.planSubtitle}>Sagesse pour chaque jour</ThemedText>
          </View>
          <Ionicons name="chevron-forward-outline" size={20} color="#8B4513" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  headerGradient: {
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
    shadowColor: '#8B4513',
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  settingsButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 34,
    fontWeight: 'bold',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerDate: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.95,
    marginBottom: 12,
  },
  versionBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  headerVersion: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  contentContainer: {
    padding: 20,
    marginTop: -20,
  },
  verseCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#F5E6D3',
  },
  verseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  verseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B4513',
  },
  verseText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  verseRefContainer: {
    alignItems: 'flex-end',
  },
  verseRefBadge: {
    backgroundColor: '#F5E6D3',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verseRef: {
    color: '#8B4513',
    fontWeight: 'bold',
    fontSize: 14,
  },
  continueCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 5,
  },
  continueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  continueHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B4513',
  },
  continueContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  bookIcon: {
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: '#8B4513',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B4513',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  bookIconText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
  },
  continueInfo: {
    flex: 1,
    gap: 4,
  },
  continueBook: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  continueTitle: {
    fontSize: 14,
    color: '#666',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#F0E0D0',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#8B4513',
    borderRadius: 2,
  },
  continueProgress: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  quickAccessContainer: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 25,
  },
  quickCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  quickGradient: {
    padding: 20,
    alignItems: 'center',
    gap: 10,
  },
  quickCardOT: {
    shadowColor: '#8B4513',
  },
  quickCardNT: {
    shadowColor: '#CD853F',
  },
  quickTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  quickSubtitle: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.9,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 5,
    justifyContent: 'space-around',
  },
  statCard: {
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#F0E0D0',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  planIcon: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: '#F5E6D3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  planInfo: {
    flex: 1,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  planSubtitle: {
    fontSize: 13,
    color: '#666',
  },
});

export default TabIndex;