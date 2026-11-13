import Ionicons from '@expo/vector-icons/Ionicons';
import { Session } from '@supabase/supabase-js';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, EMOJI_FONT, Radius, Shadows, Spacing, Typography } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

const DUMMY_CREWS = [
  {
    id: 'd1',
    name: 'LA Squad',
    members: [{ profiles: { username: 'Nam' } }, { profiles: { username: 'Alex' } }, { profiles: { username: 'Sam' } }, { profiles: { username: 'Jordan' } }],
  },
  {
    id: 'd2',
    name: 'Foodies',
    members: [{ profiles: { username: 'Maya' } }, { profiles: { username: 'Chris' } }],
  },
  {
    id: 'd3',
    name: 'Ballers',
    members: [{ profiles: { username: 'Taylor' } }, { profiles: { username: 'Morgan' } }, { profiles: { username: 'Casey' } }],
  },
];

const AVATAR_COLORS = ['#FF4A2D', '#FF9F1C', '#2EC4A6', '#5E60CE', '#F72585', '#4A90D9'];

function getColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function AmigosScreen() {
  const insets = useSafeAreaInsets();
  const [session, setSession] = useState<Session | null>(null);
  const [crews, setCrews] = useState<any[]>(DUMMY_CREWS);
  const [loading, setLoading] = useState(false);
  const [newCrewName, setNewCrewName] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchCrews(session.user.id);
    });
  }, []);

  async function fetchCrews(userId: string) {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('crews')
        .select('*, members:crew_members(user_id, profiles(username, avatar_url))')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        setCrews(data);
      }
    } catch (_) { }
    finally { setLoading(false); }
  }

  async function handleCreateCrew() {
    if (!newCrewName.trim()) return;
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (!session?.user) {
      Alert.alert('Sign in required', 'You need to be signed in to create a crew.');
      return;
    }

    try {
      setLoading(true);
      const { data: crew, error: crewError } = await supabase
        .from('crews')
        .insert({ name: newCrewName, created_by: session.user.id })
        .select()
        .single();

      if (crewError) throw crewError;

      await supabase.from('crew_members').insert({ crew_id: crew.id, user_id: session.user.id });

      setNewCrewName('');
      fetchCrews(session.user.id);
    } catch (_) {
      Alert.alert('Error', 'Failed to create crew');
    } finally {
      setLoading(false);
    }
  }

  const renderCrew = ({ item }: { item: any }) => {
    const members = item.members || [];
    return (
      <TouchableOpacity style={styles.crewCard} activeOpacity={0.85}>
        <View style={styles.crewLeft}>
          <View style={styles.crewIconBg}>
            <Text style={styles.crewIcon}>👥</Text>
          </View>
        </View>
        <View style={styles.crewInfo}>
          <View style={styles.crewTitleRow}>
            <Text style={styles.crewName}>{item.name}</Text>
            <View style={styles.memberBadge}>
              <Text style={styles.memberBadgeText}>{members.length}</Text>
            </View>
          </View>
          {/* Avatar stack */}
          <View style={styles.avatarStack}>
            {members.slice(0, 5).map((m: any, idx: number) => {
              const name = m.profiles?.username || '?';
              return (
                <View
                  key={idx}
                  style={[
                    styles.stackAvatar,
                    { backgroundColor: getColor(name), marginLeft: idx === 0 ? 0 : -8, zIndex: 10 - idx }
                  ]}
                >
                  <Text style={styles.stackAvatarText}>{name[0].toUpperCase()}</Text>
                </View>
              );
            })}
            {members.length > 5 && (
              <View style={[styles.stackAvatar, { backgroundColor: Colors.backgroundTertiary, marginLeft: -8 }]}>
                <Text style={[styles.stackAvatarText, { color: Colors.textSecondary }]}>+{members.length - 5}</Text>
              </View>
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Amigos</Text>
        <Text style={styles.headerSub}>{crews.length > 0 && crews.every(c => c.id?.toString().startsWith('d')) ? 'Sample crews - sign in to sync your own' : 'Your crews'}</Text>
      </View>

      <FlatList
        data={crews}
        keyExtractor={item => item.id}
        renderItem={renderCrew}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]}
        onRefresh={() => session && fetchCrews(session.user.id)}
        refreshing={loading}
        ListHeaderComponent={
          crews.length === 0 ? null : undefined
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>👯</Text>
            <Text style={styles.emptyTitle}>No crews yet</Text>
            <Text style={styles.emptySub}>Create one below to get started!</Text>
          </View>
        }
      />

      {/* Create crew floating bar */}
      <View style={[styles.createBar, { paddingBottom: insets.bottom + 16 }]}>
        <TextInput
          style={styles.createInput}
          placeholder="New crew name..."
          placeholderTextColor={Colors.textSecondary}
          value={newCrewName}
          onChangeText={setNewCrewName}
          returnKeyType="done"
          onSubmitEditing={handleCreateCrew}
        />
        <TouchableOpacity
          style={[styles.createBtn, !newCrewName.trim() && styles.createBtnDisabled]}
          onPress={handleCreateCrew}
          disabled={!newCrewName.trim() || loading}
        >
          <Ionicons name="add" size={22} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Header
  header: {
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 2,
    borderBottomColor: Colors.ink,
  },
  headerTitle: {
    ...Typography.largeTitle,
    color: Colors.text,
  },
  headerSub: {
    ...Typography.subhead,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // List
  listContent: {
    padding: Spacing.xl,
    gap: 10,
  },

  // Crew card
  crewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundElevated,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: 10,
    gap: Spacing.md,
    ...Shadows.small,
    borderWidth: 2,
    borderColor: Colors.ink,
  },
  crewLeft: {},
  crewIconBg: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.butter,
    borderWidth: 2,
    borderColor: Colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  crewIcon: { fontSize: 24, fontFamily: EMOJI_FONT },
  crewInfo: {
    flex: 1,
    gap: 6,
  },
  crewTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  crewName: {
    ...Typography.headline,
    color: Colors.text,
  },
  memberBadge: {
    backgroundColor: Colors.butter,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    borderColor: Colors.ink,
  },
  memberBadgeText: {
    ...Typography.caption2,
    color: Colors.ink,
  },

  // Avatar stack
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stackAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: Colors.backgroundElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stackAvatarText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyEmoji: { fontSize: 56, marginBottom: Spacing.md, fontFamily: EMOJI_FONT },
  emptyTitle: { ...Typography.title3, color: Colors.text, marginBottom: 4 },
  emptySub: { ...Typography.subhead, color: Colors.textSecondary },

  // Create bar
  createBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    backgroundColor: Colors.card,
    borderTopWidth: 2,
    borderTopColor: Colors.ink,
    ...Shadows.sheet,
  },
  createInput: {
    flex: 1,
    height: 48,
    backgroundColor: Colors.paper,
    borderRadius: Radius.pill,
    borderWidth: 2,
    borderColor: Colors.ink,
    paddingHorizontal: Spacing.lg,
    ...Typography.callout,
    color: Colors.text,
    outlineStyle: 'none',
  } as any,
  createBtn: {
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
  createBtnDisabled: {
    backgroundColor: Colors.backgroundTertiary,
    shadowOpacity: 0,
  },
});
