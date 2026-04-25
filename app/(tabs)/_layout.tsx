import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';

// ─── Config des onglets ────────────────────────────────────────────────────────

const TAB_CONFIG = [
  {
    name:       'index',
    label_fr:   'Bible',
    label_en:   'Bible',
    icon:       'book-outline'       as const,
    iconActive: 'book'               as const,
  },
  {
    name:       'favorites',
    label_fr:   'Favoris',
    label_en:   'Favorites',
    icon:       'heart-outline'      as const,
    iconActive: 'heart'              as const,
  },
  {
    name:       'explore',
    label_fr:   'Recherche',
    label_en:   'Search',
    icon:       'search-outline'     as const,
    iconActive: 'search'             as const,
  },
];

// ─── Bouton animé ──────────────────────────────────────────────────────────────

function TabItem({
  config,
  isActive,
  onPress,
  isDark,
}: {
  config: typeof TAB_CONFIG[0];
  isActive: boolean;
  onPress: () => void;
  isDark: boolean;
}) {
  const scale   = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(isActive ? 1 : 0)).current;
  const dotY    = useRef(new Animated.Value(isActive ? 0 : -6)).current;

  useEffect(() => {
    const toActive = isActive;
    Animated.parallel([
      Animated.spring(scale, {
        toValue: toActive ? 1.12 : 1,
        friction: 7,
        tension: 180,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: toActive ? 1 : 0,
        duration: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
      Animated.spring(dotY, {
        toValue: toActive ? 0 : -6,
        friction: 7,
        tension: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isActive]);

  const BROWN      = '#8B4513';
  const BROWN_PALE = '#CD853F';

  const pillBg = opacity.interpolate({
    inputRange:  [0, 1],
    outputRange: [
      'rgba(0,0,0,0)',
      isDark ? 'rgba(205,133,63,0.16)' : 'rgba(139,69,19,0.09)',
    ],
  });

  return (
    <TouchableOpacity
      style={item.wrap}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={config.label_fr}
    >
      <Animated.View style={[item.pill, { backgroundColor: pillBg, transform: [{ scale }] }]}>
        {/* Point indicateur */}
        <Animated.View
          style={[
            item.dot,
            { backgroundColor: isDark ? BROWN_PALE : BROWN, transform: [{ translateY: dotY }] },
          ]}
        />

        {/* Icône */}
        <Ionicons
          name={isActive ? config.iconActive : config.icon}
          size={22}
          color={isActive ? (isDark ? BROWN_PALE : BROWN) : (isDark ? '#6B5040' : '#B0988A')}
        />

        {/* Label */}
        <ThemedText
          style={[
            item.label,
            isActive
              ? [item.labelActive, { color: isDark ? BROWN_PALE : BROWN }]
              : [item.labelInactive, { color: isDark ? '#6B5040' : '#B0988A' }],
          ]}
        >
          {config.label_fr}
        </ThemedText>
      </Animated.View>
    </TouchableOpacity>
  );
}

const item = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 2,
  },
  pill: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 22,
    gap: 3,
    minWidth: 68,
    position: 'relative',
  },
  dot: {
    position: 'absolute',
    top: 5,
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  label:        { fontSize: 10, letterSpacing: 0.3 },
  labelActive:  { fontWeight: '700' },
  labelInactive:{ fontWeight: '500' },
});

// ─── Barre personnalisée ───────────────────────────────────────────────────────

function CustomTabBar({ state, navigation }: any) {
  const insets      = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const isDark      = colorScheme === 'dark';

  return (
    <View
      style={[
        bar.container,
        {
          paddingBottom: Math.max(insets.bottom, 10),
          backgroundColor: isDark ? '#150C06' : '#FFFAF5',
          borderTopColor:  isDark ? 'rgba(205,133,63,0.15)' : 'rgba(139,69,19,0.12)',
          shadowColor:     isDark ? '#000' : '#8B4513',
        },
      ]}
    >
      {/* Ligne dorée décorative */}
      <View
        style={[
          bar.stripe,
          { backgroundColor: isDark ? 'rgba(205,133,63,0.25)' : 'rgba(139,69,19,0.12)' },
        ]}
      />

      <View style={bar.row}>
        {state.routes.map((route: any, index: number) => {
          const cfg      = TAB_CONFIG.find(t => t.name === route.name) ?? TAB_CONFIG[0];
          const isActive = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isActive && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TabItem
              key={route.key}
              config={cfg}
              isActive={isActive}
              onPress={onPress}
              isDark={isDark}
            />
          );
        })}
      </View>
    </View>
  );
}

const bar = StyleSheet.create({
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
    shadowOpacity:  0.10,
    shadowRadius:   16,
    shadowOffset:   { width: 0, height: -3 },
    elevation:      20,
  },
  stripe: {
    height:          1,
    marginHorizontal: 28,
    marginTop:       4,
    borderRadius:    1,
  },
  row: {
    flexDirection:  'row',
    paddingHorizontal: 8,
    paddingTop:     6,
    alignItems:     'flex-end',
  },
});

// ─── Layout principal ──────────────────────────────────────────────────────────

export default function TabLayout() {
  return (
    <Tabs
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index"     options={{ title: 'Bible' }} />
      <Tabs.Screen name="favorites" options={{ title: 'Favoris' }} />
      <Tabs.Screen name="explore"   options={{ title: 'Recherche' }} />
    </Tabs>
  );
}