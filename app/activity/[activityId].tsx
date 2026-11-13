import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ActivityMap from '../../components/ActivityMap';
import { Colors, EMOJI_FONT, Radius, Shadows, Spacing, Typography, withEmoji } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

const AVATAR_COLORS = ['#FF4A2D', '#FF9F1C', '#2EC4A6', '#5E60CE', '#F72585', '#4A90D9'];
function getColor(name: string) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

function formatCountdown(date: string) {
    const diff = new Date(date).getTime() - Date.now();
    if (diff <= 0) return 'Happening now!';
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    if (h > 24) return `In ${Math.floor(h / 24)}d`;
    if (h > 0) return `In ${h}h ${m}m`;
    return `In ${m}m`;
}

export default function ActivityDetail() {
    const { activityId } = useLocalSearchParams();
    const [activity, setActivity] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [participants, setParticipants] = useState<any[]>([]);
    const [myStatus, setMyStatus] = useState<string | null>(null);
    const [userLocation, setUserLocation] = useState<{ latitude: number, longitude: number } | null>(null);
    const router = useRouter();
    const insets = useSafeAreaInsets();

    useEffect(() => {
        fetchActivityDetails();
    }, [activityId, userLocation]);

    useEffect(() => {
        getUserLocation();
    }, []);

    async function getUserLocation() {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;
            const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            setUserLocation({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            });
        } catch (_) { }
    }

    async function fetchActivityDetails() {
        try {
            setLoading(true);

            let activityData: any, partData: any[];

            if (activityId === 'dummy-1' || activityId?.toString().startsWith('dummy-')) {
                const lat = userLocation?.latitude || 34.0522;
                const lng = userLocation?.longitude || -118.2437;
                const dummyMap: Record<string, any> = {
                    'dummy-1': { id: 'dummy-1', title: 'Beach Volleyball', emoji: '🏐', creator: { username: 'Nam' }, crew: { name: 'LA Squad' }, scheduled_at: new Date(Date.now() + 7200000).toISOString(), latitude: lat - 0.007, longitude: lng - 0.001, threshold: 6 },
                    'dummy-2': { id: 'dummy-2', title: 'Pizza Run', emoji: '🍕', creator: { username: 'Alex' }, crew: { name: 'Foodies' }, scheduled_at: new Date(Date.now() + 3600000).toISOString(), latitude: lat + 0.007, longitude: lng + 0.004, threshold: 4 },
                    'dummy-3': { id: 'dummy-3', title: 'Late Night Movie', emoji: '🎬', creator: { username: 'Jordan' }, crew: { name: 'Cinema Crew' }, scheduled_at: new Date(Date.now() + 14400000).toISOString(), latitude: lat + 0.012, longitude: lng + 0.01, threshold: 5 },
                    'dummy-4': { id: 'dummy-4', title: 'Pickup Basketball', emoji: '🏀', creator: { username: 'Sam' }, crew: { name: 'Ballers' }, scheduled_at: new Date(Date.now() + 1800000).toISOString(), latitude: lat + 0.003, longitude: lng - 0.008, threshold: 10 },
                };
                activityData = dummyMap[activityId as string] || dummyMap['dummy-1'];
                partData = [];
            } else {
                const { data, error } = await supabase
                    .from('activities')
                    .select('*, creator:profiles!creator_id(username, avatar_url), crew:crews(name)')
                    .eq('id', activityId)
                    .single();

                if (error) throw error;
                activityData = data;

                const { data: dbPartData } = await supabase
                    .from('activity_participants')
                    .select('*, profiles(username, avatar_url)')
                    .eq('activity_id', activityId);

                partData = dbPartData || [];
            }

            setActivity(activityData);

            // Pad with dummy participants for visual completeness
            const dummyNames = ['Alex', 'Sam', 'Jordan', 'Taylor', 'Casey', 'Morgan', 'Riley'];
            const extras = Array.from({ length: Math.max(0, 5 - partData.length) }).map((_, i) => ({
                id: `dummy-${i}`,
                status: i < 3 ? 'committed' : 'interested',
                profiles: { username: dummyNames[i % dummyNames.length] },
            }));
            setParticipants([...partData, ...extras]);
        } catch (error) {
            console.error('Error fetching activity:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleRSVP(status: 'committed' | 'interested' | 'declined') {
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                Alert.alert('Vámonos!', 'Saved for this session only - sign in to keep your RSVP.');
                setMyStatus(status);
                return;
            }

            await supabase.from('activity_participants').upsert({
                activity_id: activityId,
                user_id: user.id,
                status,
                updated_at: new Date().toISOString(),
            });

            setMyStatus(status);
            fetchActivityDetails();
            Alert.alert(status === 'committed' ? '🔥 You\'re in!' : '👀 Maybe later', '');
        } catch (_) {
            Alert.alert('Error', 'Failed to update RSVP');
        }
    }

    const confirmedCount = participants.filter(p => p.status === 'committed').length;
    const threshold = activity?.threshold || 1;
    const progress = Math.min(confirmedCount / threshold, 1);
    const isHype = confirmedCount >= threshold;

    if (loading || !activity) {
        return (
            <View style={[styles.centered, { paddingTop: insets.top }]}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Map hero */}
            <View style={styles.mapHero}>
                <ActivityMap activity={activity} participants={participants} userLocation={userLocation} />

                {/* Back button overlay */}
                <TouchableOpacity
                    style={[styles.backBtn, { top: insets.top + 12 }]}
                    onPress={() => router.back()}
                >
                    <View style={styles.backBtnSolid}>
                        <Ionicons name="chevron-back" size={20} color={Colors.text} />
                    </View>
                </TouchableOpacity>

                {/* Share button */}
                <TouchableOpacity
                    style={[styles.shareBtn, { top: insets.top + 12 }]}
                >
                    <View style={styles.backBtnSolid}>
                        <Ionicons name="share-outline" size={18} color={Colors.text} />
                    </View>
                </TouchableOpacity>
            </View>

            {/* Detail sheet */}
            <View style={styles.detailSheet}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>

                    {/* Title row */}
                    <View style={styles.titleSection}>
                        <View style={styles.emojiPill}>
                            <Text style={styles.titleEmoji}>{activity.emoji || '✨'}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.activityTitle}>{activity.title}</Text>
                            <Text style={styles.crewText}>{activity.crew?.name} · by {activity.creator?.username}</Text>
                        </View>
                        {isHype && (
                            <View style={styles.hypeFlag}>
                                <Text style={styles.hypeFlagText}>🔥 ON</Text>
                            </View>
                        )}
                        {activity.id?.toString().startsWith('dummy-') && (
                            <View style={styles.sampleFlag}>
                                <Text style={styles.sampleFlagText}>SAMPLE</Text>
                            </View>
                        )}
                    </View>

                    {/* Stats strip */}
                    <View style={styles.statsRow}>
                        {/* RSVP Progress */}
                        <View style={styles.statCard}>
                            <Text style={styles.statNum}>{confirmedCount}</Text>
                            <Text style={styles.statCaption}>Down</Text>
                        </View>

                        {/* Divider */}
                        <View style={styles.statDivider} />

                        <View style={styles.statCard}>
                            <Text style={styles.statNum}>{threshold}</Text>
                            <Text style={styles.statCaption}>Needed</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statCard}>
                            <Text style={styles.statNum}>{formatCountdown(activity.scheduled_at)}</Text>
                            <Text style={styles.statCaption}>Starts</Text>
                        </View>
                    </View>

                    {/* Progress bar */}
                    <View style={styles.progressSection}>
                        <View style={styles.progressRow}>
                            <Text style={styles.progressLabel}>
                                {isHype ? "🎉 It's happening!" : `${threshold - confirmedCount} more to confirm`}
                            </Text>
                            <Text style={styles.progressPct}>{Math.round(progress * 100)}%</Text>
                        </View>
                        <View style={styles.progressBg}>
                            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
                        </View>
                    </View>

                    {/* Time info */}
                    <View style={styles.infoRow}>
                        <View style={styles.infoIcon}>
                            <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
                        </View>
                        <Text style={styles.infoText}>{formatTime(activity.scheduled_at)}</Text>
                    </View>

                    {/* RSVP buttons */}
                    <View style={styles.rsvpRow}>
                        <TouchableOpacity
                            style={[styles.rsvpBtn, styles.rsvpPrimary, myStatus === 'committed' && styles.rsvpActive]}
                            onPress={() => handleRSVP('committed')}
                            activeOpacity={0.85}
                        >
                            <Text style={[styles.rsvpPrimaryText, myStatus === 'committed' && { color: Colors.ink }]}>
                                {myStatus === 'committed' ? '✓ I\'m In!' : 'I\'m Down! 🚀'}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.rsvpBtn, styles.rsvpSecondary, myStatus === 'interested' && styles.rsvpSecondaryActive]}
                            onPress={() => handleRSVP('interested')}
                            activeOpacity={0.85}
                        >
                            <Text style={[styles.rsvpSecondaryText, myStatus === 'interested' && { color: Colors.text }]}>
                                Maybe 👀
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Participants */}
                    <Text style={styles.sectionTitle}>Who's in</Text>

                    {/* Horizontal avatar scroll */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -Spacing.xxl }} contentContainerStyle={{ paddingHorizontal: Spacing.xxl, gap: 12 }}>
                        {participants.map((p, idx) => {
                            const name = p.profiles?.username || 'User';
                            const committed = p.status === 'committed';
                            return (
                                <View key={idx} style={styles.participantChip}>
                                    <View style={[styles.participantAvatar, { backgroundColor: getColor(name) }]}>
                                        <Text style={styles.participantInitial}>{name[0]?.toUpperCase()}</Text>
                                        <View style={[styles.statusDot, { backgroundColor: committed ? Colors.success : Colors.warning }]} />
                                    </View>
                                    <Text style={styles.participantName}>{name.split(' ')[0]}</Text>
                                    <Text style={styles.participantStatus}>{committed ? '✓' : '~'}</Text>
                                </View>
                            );
                        })}
                    </ScrollView>
                </ScrollView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.paper,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
    },

    // Map hero
    mapHero: {
        height: 320,
        backgroundColor: Colors.background,
    },
    backBtn: {
        position: 'absolute',
        left: Spacing.xl,
        width: 38,
        height: 38,
        borderRadius: 19,
        overflow: 'hidden',
        ...Shadows.medium,
    },
    shareBtn: {
        position: 'absolute',
        right: Spacing.xl,
        width: 38,
        height: 38,
        borderRadius: 19,
        overflow: 'hidden',
        ...Shadows.medium,
    },
    backBtnSolid: {
        flex: 1,
        backgroundColor: Colors.card,
        borderRadius: 19,
        borderWidth: 2,
        borderColor: Colors.ink,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Detail sheet
    detailSheet: {
        flex: 1,
        backgroundColor: Colors.paper,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        borderTopWidth: 2,
        borderColor: Colors.ink,
        marginTop: -28,
        paddingHorizontal: Spacing.xxl,
        paddingTop: Spacing.xxl,
        ...Shadows.sheet,
    },

    // Title
    titleSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        marginBottom: Spacing.xl,
    },
    emojiPill: {
        width: 52,
        height: 52,
        borderRadius: Radius.md,
        backgroundColor: Colors.card,
        borderWidth: 2,
        borderColor: Colors.ink,
        justifyContent: 'center',
        alignItems: 'center',
    },
    titleEmoji: { fontSize: 26, fontFamily: EMOJI_FONT },
    activityTitle: {
        ...Typography.title2,
        color: Colors.text,
        lineHeight: 28,
    },
    crewText: {
        ...Typography.footnote,
        color: Colors.textSecondary,
        marginTop: 2,
        fontWeight: '500',
    },
    hypeFlag: {
        backgroundColor: Colors.butter,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: Radius.pill,
        borderWidth: 2,
        borderColor: Colors.ink,
    },
    sampleFlag: {
        backgroundColor: Colors.backgroundTertiary,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: Radius.pill,
        borderWidth: 1.5,
        borderColor: Colors.ink,
    },
    sampleFlagText: {
        color: Colors.inkSoft,
        fontSize: 10,
        letterSpacing: 1,
        fontFamily: 'Archivo_800ExtraBold',
    },
    hypeFlagText: {
        color: Colors.ink,
        fontSize: 12,
        fontFamily: withEmoji('Archivo_800ExtraBold'),
    },

    // Stats
    statsRow: {
        flexDirection: 'row',
        backgroundColor: Colors.card,
        borderRadius: Radius.xl,
        borderWidth: 2,
        borderColor: Colors.ink,
        padding: Spacing.lg,
        marginBottom: Spacing.xl,
        alignItems: 'center',
        ...Shadows.small,
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
    },
    statNum: {
        ...Typography.title3,
        color: Colors.text,
        textAlign: 'center',
        fontSize: 16,
    },
    statCaption: {
        ...Typography.caption2,
        color: Colors.textSecondary,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        height: 32,
        backgroundColor: Colors.backgroundTertiary,
    },

    // Progress
    progressSection: {
        marginBottom: Spacing.xl,
        gap: 8,
    },
    progressRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    progressLabel: {
        ...Typography.footnote,
        fontFamily: withEmoji('Archivo_600SemiBold'),
        color: Colors.textSecondary,
    },
    progressPct: {
        ...Typography.footnote,
        color: Colors.primary,
    },
    progressBg: {
        height: 10,
        backgroundColor: Colors.backgroundTertiary,
        borderRadius: Radius.pill,
        borderWidth: 1.5,
        borderColor: Colors.ink,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: Colors.primary,
        borderRadius: Radius.pill,
    },

    // Info row
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        backgroundColor: Colors.card,
        borderWidth: 2,
        borderColor: Colors.ink,
        padding: Spacing.md,
        borderRadius: Radius.lg,
        marginBottom: Spacing.xxl,
    },
    infoIcon: {
        width: 34,
        height: 34,
        borderRadius: Radius.sm,
        backgroundColor: Colors.butter,
        borderWidth: 1.5,
        borderColor: Colors.ink,
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoText: {
        ...Typography.callout,
        color: Colors.text,
        fontWeight: '500',
    },

    // RSVP buttons
    rsvpRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: Spacing.xxxl,
    },
    rsvpBtn: {
        flex: 1,
        height: 56,
        borderRadius: Radius.pill,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadows.medium,
    },
    rsvpPrimary: {
        flex: 2,
        backgroundColor: Colors.primary,
        borderWidth: 2,
        borderColor: Colors.ink,
    },
    rsvpActive: {
        backgroundColor: Colors.butter,
    },
    rsvpPrimaryText: {
        color: Colors.card,
        fontFamily: withEmoji('Archivo_800ExtraBold'),
        fontSize: 17,
    },
    rsvpSecondary: {
        backgroundColor: Colors.card,
        borderWidth: 2,
        borderColor: Colors.ink,
    },
    rsvpSecondaryActive: {
        backgroundColor: Colors.backgroundTertiary,
    },
    rsvpSecondaryText: {
        color: Colors.ink,
        fontFamily: withEmoji('Archivo_700Bold'),
        fontSize: 16,
    },

    // Participants
    sectionTitle: {
        ...Typography.title3,
        color: Colors.text,
        marginBottom: Spacing.lg,
    },
    participantChip: {
        alignItems: 'center',
        gap: 4,
    },
    participantAvatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadows.small,
    },
    participantInitial: {
        color: Colors.white,
        fontWeight: '700',
        fontSize: 20,
    },
    statusDot: {
        position: 'absolute',
        bottom: 1,
        right: 1,
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: Colors.white,
    },
    participantName: {
        ...Typography.caption1,
        color: Colors.text,
        fontWeight: '600',
    },
    participantStatus: {
        ...Typography.caption2,
        color: Colors.textSecondary,
    },
});
