import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeMap from '../../components/HomeMap';
import { ActivityCategories, Colors, EMOJI_FONT, Radius, Shadows, Spacing, Typography, withEmoji } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

// Bottom sheet snap points
const SNAP_FULL = 0.12;      // full open (12% from top)
const SNAP_HALF = 0.55;      // half open (55% from top)
const SNAP_COLLAPSED = 0.80; // peek (80% from top)

// Dummy activity data for when DB is empty
const DUMMY_ACTIVITIES = [
  {
    id: 'dummy-1',
    title: 'Beach Volleyball',
    emoji: '🏐',
    creator: { username: 'Nam' },
    crew: { name: 'LA Squad' },
    scheduled_at: new Date(Date.now() + 7200000).toISOString(),
    latitude: 34.0125,
    longitude: -118.496,
    threshold: 6,
    committed: 4,
    category: 'sports',
  },
  {
    id: 'dummy-2',
    title: 'Pizza Run 🍕',
    emoji: '🍕',
    creator: { username: 'Alex' },
    crew: { name: 'Foodies' },
    scheduled_at: new Date(Date.now() + 3600000).toISOString(),
    latitude: 34.0195,
    longitude: -118.491,
    threshold: 4,
    committed: 3,
    category: 'food',
  },
  {
    id: 'dummy-3',
    title: 'Late Night Movie',
    emoji: '🎬',
    creator: { username: 'Jordan' },
    crew: { name: 'Cinema Crew' },
    scheduled_at: new Date(Date.now() + 14400000).toISOString(),
    latitude: 34.023,
    longitude: -118.485,
    threshold: 5,
    committed: 2,
    category: 'movies',
  },
  {
    id: 'dummy-4',
    title: 'Pickup Basketball',
    emoji: '🏀',
    creator: { username: 'Sam' },
    crew: { name: 'Ballers' },
    scheduled_at: new Date(Date.now() + 1800000).toISOString(),
    latitude: 34.016,
    longitude: -118.502,
    threshold: 10,
    committed: 7,
    category: 'sports',
  },
];

function formatCountdown(date: string) {
  const diff = new Date(date).getTime() - Date.now();
  if (diff <= 0) return 'Now!';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 0) return `In ${h}h ${m}m`;
  return `In ${m}m`;
}

export default function Index() {
  const [activities, setActivities] = useState<any[]>(DUMMY_ACTIVITIES);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [userLocation, setUserLocation] = useState<{ latitude: number, longitude: number } | null>(null);
  const [newActivityTitle, setNewActivityTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Bottom sheet animation
  const sheetY = useRef(new Animated.Value(SCREEN_HEIGHT * SNAP_HALF)).current;
  const currentSnap = useRef(SNAP_HALF);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, { dy }) => Math.abs(dy) > 5,
      onPanResponderMove: (_, { dy }) => {
        const newY = SCREEN_HEIGHT * currentSnap.current + dy;
        const minY = SCREEN_HEIGHT * SNAP_FULL;
        const maxY = SCREEN_HEIGHT * SNAP_COLLAPSED;
        sheetY.setValue(Math.max(minY, Math.min(maxY, newY)));
      },
      onPanResponderRelease: (_, { dy, vy }) => {
        const currentY = SCREEN_HEIGHT * currentSnap.current + dy;
        const fullY = SCREEN_HEIGHT * SNAP_FULL;
        const halfY = SCREEN_HEIGHT * SNAP_HALF;
        const collapsedY = SCREEN_HEIGHT * SNAP_COLLAPSED;

        let target: number;
        let snapConst: number;

        if (vy < -0.5 || currentY < (fullY + halfY) / 2) {
          if (vy < -1 || currentY < (fullY + halfY) / 2) {
            target = fullY;
            snapConst = SNAP_FULL;
          } else {
            target = halfY;
            snapConst = SNAP_HALF;
          }
        } else if (vy > 0.5 || currentY > (halfY + collapsedY) / 2) {
          target = collapsedY;
          snapConst = SNAP_COLLAPSED;
        } else {
          target = halfY;
          snapConst = SNAP_HALF;
        }

        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        currentSnap.current = snapConst;
        Animated.spring(sheetY, {
          toValue: target,
          useNativeDriver: false,
          damping: 25,
          stiffness: 200,
        }).start();
      },
    })
  ).current;

  function snapSheet(snap: number) {
    currentSnap.current = snap;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(sheetY, {
      toValue: SCREEN_HEIGHT * snap,
      useNativeDriver: false,
      damping: 25,
      stiffness: 200,
    }).start();
  }

  useEffect(() => {
    fetchActivities();
    getUserLocation();
  }, []);

  async function getUserLocation() {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Permission to access location was denied');
        return;
      }
      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const currentLoc = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setUserLocation(currentLoc);

      // Update activities if they are dummy ones to be near the user
      setActivities(prev => prev.map((a, i) => {
        if (a.id.startsWith('dummy-')) {
          return {
            ...a,
            latitude: currentLoc.latitude + (Math.random() - 0.5) * 0.03,
            longitude: currentLoc.longitude + (Math.random() - 0.5) * 0.03,
          };
        }
        return a;
      }));
    } catch (_) {
      console.warn('Could not fetch location');
    }
  }

  async function fetchActivities() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('activities')
        .select(`*, creator:profiles!creator_id(username, avatar_url), crew:crews(name)`)
        .order('scheduled_at', { ascending: true });

      if (!error && data && data.length > 0) {
        setActivities(data);
      }
    } catch (_) {
      // use dummy data on error
    } finally {
      setLoading(false);
    }
  }

  const categoryFiltered = selectedCategory === 'all'
    ? activities
    : activities.filter(a => a.category === selectedCategory);
  const q = searchQuery.trim().toLowerCase();
  const filteredActivities = q
    ? categoryFiltered.filter(a =>
        (a.title || '').toLowerCase().includes(q) ||
        (a.crew?.name || '').toLowerCase().includes(q))
    : categoryFiltered;
  const showingSample = filteredActivities.length > 0 && filteredActivities.every(a => a.id?.toString().startsWith('dummy-'));

  const renderCategoryPill = ({ item }: { item: typeof ActivityCategories[number] }) => {
    const active = selectedCategory === item.id;
    return (
      <TouchableOpacity
        style={[styles.categoryPill, active && styles.categoryPillActive]}
        onPress={() => {
          if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setSelectedCategory(item.id);
        }}
        activeOpacity={0.7}
      >
        <Text style={styles.categoryEmoji}>{item.emoji}</Text>
        <Text style={[styles.categoryLabel, active && styles.categoryLabelActive]}>{item.label}</Text>
      </TouchableOpacity>
    );
  };

  const renderActivity = ({ item }: { item: any }) => {
    const committed = item.committed ?? 0;
    const threshold = item.threshold ?? 1;
    const progress = Math.min(committed / threshold, 1);
    const hype = committed >= threshold;

    return (
      <TouchableOpacity
        style={styles.activityCard}
        onPress={() => {
          if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push(`/activity/${item.id}`);
        }}
        activeOpacity={0.92}
      >
        <View style={styles.cardLeft}>
          <View style={[styles.cardEmoji, hype && styles.cardEmojiHype]}>
            <Text style={styles.cardEmojiText}>{item.emoji || '✨'}</Text>
          </View>
        </View>
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
            {hype && <View style={styles.hypeTag}><Text style={styles.hypeTagText}>🔥 On!</Text></View>}
          </View>
          <Text style={styles.cardMeta}>
            {item.crew?.name || 'Local'} · {formatCountdown(item.scheduled_at)}
          </Text>
          {/* RSVP progress bar */}
          <View style={styles.progressRow}>
            <View style={styles.progressBar}>
              <Animated.View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
            <Text style={styles.progressLabel}>{committed}/{threshold}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} style={{ marginTop: 2 }} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>

      {/* ── FULL-BLEED MAP ── */}
      <HomeMap
        activities={filteredActivities}
        userLocation={userLocation}
        onPinPress={(id) => router.push(`/activity/${id}`)}
        onMapPress={() => snapSheet(SNAP_COLLAPSED)}
      />

      {/* ── FLOATING HEADER ── */}
      <View style={[styles.headerFloat, { top: insets.top + 12 }]} pointerEvents="box-none">
        <View style={styles.headerCard}>
          <View style={styles.headerInner}>
            <View>
              <Text style={styles.headerEyebrow}>VÁMONOS!</Text>
              <Text style={styles.headerGreeting}>What's the vibe?</Text>
            </View>
            <TouchableOpacity style={styles.avatarButton}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>N</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ── BOTTOM SHEET ── */}
      <Animated.View style={[styles.sheet, { top: sheetY }]}>

        {/* Drag Handle */}
        <View {...panResponder.panHandlers} style={styles.dragArea}>
          <View style={styles.dragger} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color={Colors.textSecondary} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="What are we doing?"
              placeholderTextColor={Colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => snapSheet(SNAP_FULL)}
            />
          </View>
          <TouchableOpacity
            style={styles.createFAB}
            onPress={() => {
              if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/create' as any);
            }}
          >
            <Ionicons name="add" size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Category Pills */}
        <FlatList
          data={ActivityCategories as any}
          keyExtractor={item => item.id}
          renderItem={renderCategoryPill}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsContainer}
          style={styles.pillsList}
        />

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={styles.sectionTitle}>Nearby Activities</Text>
            {showingSample && (
              <View style={styles.sampleTag}><Text style={styles.sampleTagText}>SAMPLE</Text></View>
            )}
          </View>
          <Text style={styles.sectionCount}>{filteredActivities.length} spots</Text>
        </View>

        {/* Activity List */}
        <FlatList
          data={filteredActivities}
          keyExtractor={item => item.id}
          renderItem={renderActivity}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🌅</Text>
              <Text style={styles.emptyTitle}>All quiet nearby</Text>
              <Text style={styles.emptySubtitle}>Be the spark — start something!</Text>
            </View>
          }
          onRefresh={fetchActivities}
          refreshing={loading}
        />
      </Animated.View>

      {/* Current location button */}
      <TouchableOpacity
        style={[styles.locationButton, { top: insets.top + 100 }]}
        onPress={() => {
          if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
      >
        <Ionicons name="locate" size={20} color={Colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8E8ED',
  },

  // Map
  mapFallback: {
    backgroundColor: '#E8EDF0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapFallbackText: {
    fontSize: 48,
  },
  mapPin: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 8,
    ...Shadows.medium,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  mapPinEmoji: {
    fontSize: 18,
  },

  // Floating header
  headerFloat: {
    position: 'absolute',
    left: Spacing.xl,
    right: Spacing.xl,
    zIndex: 100,
  },
  headerCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    borderWidth: 2,
    borderColor: Colors.ink,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  headerEyebrow: {
    ...Typography.eyebrow,
    color: Colors.primary,
    marginBottom: 2,
  },
  headerGreeting: {
    ...Typography.title2,
    color: Colors.text,
  },
  avatarButton: {},
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.butter,
    borderWidth: 2,
    borderColor: Colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: Colors.ink,
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 15,
  },

  // Bottom sheet
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.paper,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 2,
    borderColor: Colors.ink,
    ...Shadows.sheet,
  },
  dragArea: {
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
  },
  dragger: {
    width: 44,
    height: 5,
    backgroundColor: Colors.ink,
    borderRadius: Radius.pill,
  },

  // Search row
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.pill,
    borderWidth: 2,
    borderColor: Colors.ink,
    paddingHorizontal: Spacing.lg,
    height: 48,
  },
  searchInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 15,
    fontFamily: 'Archivo_600SemiBold',
    outlineStyle: 'none',
  } as any,
  createFAB: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.medium,
  },

  // Category pills
  pillsList: {
    flexGrow: 0,
  },
  pillsContainer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    gap: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    borderWidth: 2,
    borderColor: Colors.ink,
    marginRight: 8,
  },
  categoryPillActive: {
    backgroundColor: Colors.ink,
  },
  categoryEmoji: {
    fontSize: 14,
    fontFamily: EMOJI_FONT,
  },
  categoryLabel: {
    ...Typography.footnote,
    color: Colors.text,
  },
  categoryLabelActive: {
    color: Colors.card,
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    marginBottom: 12,
  },
  sectionTitle: {
    ...Typography.eyebrow,
    fontSize: 13,
    color: Colors.text,
  },
  sectionCount: {
    ...Typography.footnote,
    color: Colors.textSecondary,
  },
  sampleTag: {
    backgroundColor: Colors.butter,
    borderWidth: 1.5,
    borderColor: Colors.ink,
    borderRadius: Radius.pill,
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
  sampleTagText: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 9,
    letterSpacing: 1,
    color: Colors.ink,
  },

  // Activity cards
  listContent: {
    paddingHorizontal: Spacing.xl,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: 12,
    ...Shadows.small,
    borderWidth: 2,
    borderColor: Colors.ink,
    gap: 12,
  },
  cardLeft: {},
  cardEmoji: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.backgroundTertiary,
    borderWidth: 2,
    borderColor: Colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardEmojiHype: {
    backgroundColor: Colors.butter,
  },
  cardEmojiText: {
    fontSize: 22,
    fontFamily: EMOJI_FONT,
  },
  cardContent: {
    flex: 1,
    gap: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    ...Typography.headline,
    fontFamily: withEmoji('Archivo_700Bold'),
    color: Colors.text,
    flex: 1,
  },
  hypeTag: {
    backgroundColor: Colors.butter,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    borderColor: Colors.ink,
  },
  hypeTagText: {
    fontSize: 11,
    fontFamily: withEmoji('Archivo_800ExtraBold'),
    color: Colors.ink,
  },
  cardMeta: {
    ...Typography.footnote,
    color: Colors.textSecondary,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.ink,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
  },
  progressLabel: {
    ...Typography.caption2,
    color: Colors.ink,
    minWidth: 28,
    textAlign: 'right',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.huge,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: Spacing.md,
    fontFamily: EMOJI_FONT,
  },
  emptyTitle: {
    ...Typography.title3,
    color: Colors.text,
    marginBottom: 4,
  },
  emptySubtitle: {
    ...Typography.subhead,
    color: Colors.textSecondary,
  },

  // Location button
  locationButton: {
    position: 'absolute',
    right: Spacing.xl,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.card,
    borderWidth: 2,
    borderColor: Colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.medium,
  },
});
