import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useContext, useState } from 'react';
import { Alert, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AppContext } from '@/hooks/useappstore';
import { useFocusEffect } from '@react-navigation/native';

export default function FavoritesScreen() {
  const colorScheme = useColorScheme();
  const appState = useContext(AppContext);
  const router = useRouter();
  const [refresh, setRefresh] = useState(0);
  const [selectedVerses, setSelectedVerses] = useState<Set<string>>(new Set());

  useFocusEffect(
    useCallback(() => {
      setRefresh(prev => prev + 1);
    }, [])
  );

  const handleRemoveFavorite = useCallback(
    (book: number, chapter: number, verse: number, verseText: string) => {
      Alert.alert(
        'Retirer des favoris',
        `Voulez-vous retirer ${book === 40 ? 'Matthieu' : 'ce verset'} ${chapter}:${verse} des favoris ?`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Retirer',
            style: 'destructive',
            onPress: () => {
              appState?.removeFavorite(book, chapter, verse);
              setRefresh(prev => prev + 1);
            },
          },
        ]
      );
    },
    [appState]
  );

  const handleVersePress = (book: number, chapter: number, verse: number, bookName: string) => {
    router.push({
      pathname: '/(books)/verses',
      params: { 
        book: book.toString(), 
        chapter: chapter.toString(), 
        bookName: bookName,
        verse: verse.toString()
      },
    });
  };

  const handleSelectVerse = (verseId: string) => {
    const newSelected = new Set(selectedVerses);
    if (newSelected.has(verseId)) {
      newSelected.delete(verseId);
    } else {
      newSelected.add(verseId);
    }
    setSelectedVerses(newSelected);
  };

  const handleDeleteSelected = () => {
    if (selectedVerses.size === 0) return;
    
    Alert.alert(
      'Supprimer plusieurs favoris',
      `Voulez-vous supprimer ${selectedVerses.size} favori${selectedVerses.size > 1 ? 's' : ''} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            selectedVerses.forEach(verseId => {
              const [book, chapter, verse] = verseId.split('-').map(Number);
              appState?.removeFavorite(book, chapter, verse);
            });
            setSelectedVerses(new Set());
            setRefresh(prev => prev + 1);
          },
        },
      ]
    );
  };

  const getBookName = (bookNumber: number, lang: string): string => {
    const bookNames: Record<number, { fr: string; en: string }> = {
      40: { fr: 'Matthieu', en: 'Matthew' },
      41: { fr: 'Marc', en: 'Mark' },
      42: { fr: 'Luc', en: 'Luke' },
      43: { fr: 'Jean', en: 'John' },
      // Ajoutez d'autres livres selon vos besoins
    };
    return bookNames[bookNumber]?.[lang as 'fr' | 'en'] || `Livre ${bookNumber}`;
  };

  const renderFavorite = ({ item }: { item: any }) => {
    const verseId = `${item.book}-${item.chapter}-${item.verse}`;
    const isSelected = selectedVerses.has(verseId);
    const bookName = getBookName(item.book, appState?.lang || 'fr');

    return (
      <TouchableOpacity
        style={[styles.favoriteCard, isSelected && styles.favoriteCardSelected]}
        onLongPress={() => handleSelectVerse(verseId)}
        onPress={() => !isSelected && handleVersePress(item.book, item.chapter, item.verse, bookName)}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={isSelected ? ['#8B4513', '#A0522D'] : ['#fff', '#faf5f0']}
          style={styles.favoriteGradient}
        >
          <View style={styles.favoriteContent}>
            <View style={styles.favoriteHeader}>
              <View style={styles.verseReference}>
                {isSelected && (
                  <View style={styles.checkIcon}>
                    <IconSymbol name="checkmark" size={16} color="#fff" />
                  </View>
                )}
                <ThemedText style={[styles.verseRef, isSelected && { color: '#fff' }]}>
                  {bookName} {item.chapter}:{item.verse}
                </ThemedText>
              </View>
              <TouchableOpacity
                onPress={() => handleRemoveFavorite(item.book, item.chapter, item.verse, item.text)}
                style={styles.removeButton}
              >
                <IconSymbol 
                  size={20} 
                  name="trash" 
                  color={isSelected ? '#fff' : '#ff4444'} 
                />
              </TouchableOpacity>
            </View>
            <ThemedText style={[styles.verseText, isSelected && { color: '#fff' }]}>
              {item.text}
            </ThemedText>
            <View style={styles.footerInfo}>
              <View style={styles.versionBadge}>
                <IconSymbol size={12} name="book" color={isSelected ? '#fff' : '#8B4513'} />
                <ThemedText style={[styles.versionText, isSelected && { color: '#fff' }]}>
                  {item.lang === 'fr' ? 'Louis Segond 1910' : 'King James Version'}
                </ThemedText>
              </View>
              <ThemedText style={[styles.dateText, isSelected && { color: '#fff' }]}>
                {item.timestamp ? new Date(item.timestamp).toLocaleDateString() : 'Ajouté récemment'}
              </ThemedText>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  if (!appState?.favorites || appState.favorites.length === 0) {
    return (
      <ParallaxScrollView
        headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
        headerImage={
          <ThemedView style={styles.headerIcon}>
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              style={styles.starIcon}
            >
              <IconSymbol size={60} name="star.fill" color="#fff" />
            </LinearGradient>
          </ThemedView>
        }
      >
        <ThemedView style={styles.emptyContainer}>
          <ThemedText type="title" style={styles.emptyTitle}>
            Aucun favori
          </ThemedText>
          <ThemedText style={styles.emptySubtext}>
            Ajoutez des versets à vos favoris pour les retrouver ici
          </ThemedText>
          <TouchableOpacity 
            style={styles.browseButton}
            onPress={() => router.push('/(tabs)/explore')}
          >
            <LinearGradient
              colors={['#8B4513', '#D2691E']}
              style={styles.browseGradient}
            >
              <ThemedText style={styles.browseButtonText}>Explorer la Bible</ThemedText>
            </LinearGradient>
          </TouchableOpacity>
        </ThemedView>
      </ParallaxScrollView>
    );
  }

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={
        <ThemedView style={styles.headerIcon}>
          <LinearGradient
            colors={['#FFD700', '#FFA500']}
            style={styles.starIcon}
          >
            <IconSymbol size={60} name="star.fill" color="#fff" />
          </LinearGradient>
        </ThemedView>
      }
    >
      <ThemedView style={styles.titleContainer}>
        <View style={styles.titleHeader}>
          <ThemedText type="title" style={styles.title}>
            Mes favoris
          </ThemedText>
          <View style={styles.countBadge}>
            <ThemedText style={styles.countText}>
              {appState.favorites.length}
            </ThemedText>
          </View>
        </View>
        <ThemedText style={styles.subtitle}>
          {appState.favorites.length} verset{appState.favorites.length > 1 ? 's enregistré' : ' enregistré'}
        </ThemedText>
      </ThemedView>

      {selectedVerses.size > 0 && (
        <View style={styles.selectionBar}>
          <ThemedText style={styles.selectionText}>
            {selectedVerses.size} sélectionné{selectedVerses.size > 1 ? 's' : ''}
          </ThemedText>
          <TouchableOpacity 
            style={styles.deleteSelectedButton}
            onPress={handleDeleteSelected}
          >
            <IconSymbol name="trash" size={18} color="#fff" />
            <ThemedText style={styles.deleteSelectedText}>Supprimer</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => setSelectedVerses(new Set())}
          >
            <ThemedText style={styles.cancelText}>Annuler</ThemedText>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        key={refresh}
        data={appState.favorites}
        renderItem={renderFavorite}
        keyExtractor={(item, index) => `${item.book}-${item.chapter}-${item.verse}-${index}`}
        scrollEnabled={false}
        contentContainerStyle={styles.listContent}
      />
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerIcon: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  starIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  titleContainer: {
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  titleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  countBadge: {
    backgroundColor: '#8B4513',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  countText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  selectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#8B4513',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  selectionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteSelectedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  deleteSelectedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  cancelText: {
    color: '#fff',
    fontSize: 12,
  },
  listContent: {
    paddingBottom: 20,
  },
  favoriteCard: {
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  favoriteCardSelected: {
    shadowColor: '#8B4513',
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  favoriteGradient: {
    padding: 16,
  },
  favoriteContent: {
    gap: 10,
  },
  favoriteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  verseReference: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verseRef: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  removeButton: {
    padding: 6,
  },
  verseText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
  },
  footerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  versionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  versionText: {
    fontSize: 11,
    color: '#999',
  },
  dateText: {
    fontSize: 11,
    color: '#999',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    marginBottom: 12,
    color: '#666',
  },
  emptySubtext: {
    textAlign: 'center',
    fontSize: 14,
    color: '#999',
    marginBottom: 30,
    paddingHorizontal: 40,
  },
  browseButton: {
    overflow: 'hidden',
    borderRadius: 25,
  },
  browseGradient: {
    paddingHorizontal: 30,
    paddingVertical: 12,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});