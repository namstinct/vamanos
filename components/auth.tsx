import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { Colors, Radius, Shadows, Typography } from '../constants/theme';
import { supabase, supabaseConfigured } from '../lib/supabase';
import { submitWaitlistEmail } from '../lib/waitlist';

interface AuthProps { onSuccess?: () => void; }

/** Examples are illustrative, not live activity or adoption claims. */
function PlanPreview() {
  return <View style={styles.preview} accessibilityLabel="Illustrative activity preview">
    <View style={styles.previewHeader}><Text style={styles.previewTitle}>A little plan. A real connection.</Text><Text style={styles.previewLabel}>ILLUSTRATIVE PREVIEW</Text></View>
    <View style={styles.map}>
      <View style={[styles.street, { top: 55, transform: [{ rotate: '-24deg' }] }]} />
      <View style={[styles.street, { top: 180, transform: [{ rotate: '18deg' }] }]} />
      <View style={[styles.street, { top: 130, transform: [{ rotate: '75deg' }] }]} />
      <View style={styles.park}><Text style={styles.parkText}>GET OUT THERE</Text></View>
      <View style={[styles.pin, { left: '23%', top: 55 }]}><Text style={styles.pinNum}>01</Text></View>
      <View style={[styles.pin, { right: '22%', top: 165 }]}><Text style={styles.pinNum}>02</Text></View>
      <View style={[styles.pin, styles.pinHot, { left: '52%', top: 120 }]}><Text style={[styles.pinNum, { color: Colors.card }]}>03</Text></View>
    </View>
    <View style={styles.plan}><Text style={styles.planNumber}>01</Text><View style={{ flex: 1 }}><Text style={styles.planName}>A walk before sunset</Text><Text style={styles.planMeta}>Outside · A change of scenery</Text></View><View style={styles.goBadge}><Text style={styles.goBadgeText}>GO</Text></View></View>
    <View style={styles.plan}><Text style={styles.planNumber}>02</Text><View style={{ flex: 1 }}><Text style={styles.planName}>Coffee, no occasion</Text><Text style={styles.planMeta}>A familiar spot · Good company</Text></View><View style={styles.goBadge}><Text style={styles.goBadgeText}>GO</Text></View></View>
  </View>;
}

export default function Auth({ onSuccess }: AuthProps) {
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState('');
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  async function handleJoinWaitlist() {
    if (loading) return;
    if (!valid) { setError('Enter a valid email address.'); return; }
    setLoading(true); setError('');
    try {
      // Only a confirmed result counts; FormSubmit fallback disclosed in privacy copy.
      await submitWaitlistEmail(email, {
        supabase: supabaseConfigured ? supabase : null,
        fetchImpl: fetch,
        formsubmitUrl: 'https://formsubmit.co/ajax/Namkhangnle@hotmail.com',
      });
      setJoined(true);
    } catch {
      setError("We couldn't confirm your signup. Please try again. You haven't been added yet.");
    } finally { setLoading(false); }
  }

  return <ScrollView style={styles.page} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
    <View style={styles.shell}>
      <View style={styles.nav}><Text style={styles.brand}>vámonos<Text style={styles.brandDot}>!</Text></Text><Text style={styles.navNote}>YOUR THIRD PLACE</Text></View>
      <View style={[styles.hero, wide && styles.heroWide]}>
        <View style={[styles.copy, wide && styles.copyWide]}>
          <View style={styles.eyebrowRow}><View style={styles.dot} /><Text style={styles.eyebrow}>LESS SCROLLING. MORE LIVING.</Text></View>
          <Text accessibilityRole="header" style={[styles.title, !wide && styles.titleMobile]}>Less group chat.{"\n"}More <Text style={styles.titleAccent}>going out.</Text></Text>
          <Text style={styles.lede}>Spontaneous activities with friends. A map for finding a plan, and a reason to leave the house.</Text>
          {joined ? <View style={styles.form} accessibilityLiveRegion="polite">
            <Text style={styles.formTitle}>You're on the list.</Text>
            <Text style={styles.formCopy}>Thanks for being early. You're ready to explore the map.</Text>
            <Pressable accessibilityRole="button" style={styles.button} onPress={onSuccess}><Text style={styles.buttonText}>Explore the map ↗</Text></Pressable>
          </View> : <View style={styles.form}>
            <Text style={styles.formTitle}>Be part of the first plans.</Text>
            <Text style={styles.formCopy}>Join the waitlist for early access.</Text>
            <Text style={styles.inputLabel}>Email address</Text>
            <View style={[styles.formRow, !wide && styles.formRowMobile]}>
              <TextInput accessibilityLabel="Email address" placeholder="you@example.com" placeholderTextColor={Colors.textTertiary} value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" style={styles.input} onSubmitEditing={handleJoinWaitlist} />
              <Pressable accessibilityRole="button" accessibilityState={{ disabled: loading }} disabled={loading} style={[styles.button, loading && styles.disabled]} onPress={handleJoinWaitlist}>{loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Join the waitlist ↗</Text>}</Pressable>
            </View>
            {error ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
            <Text style={styles.privacy}>Your email is used for the waitlist. Signup may be processed by FormSubmit if our database is unavailable.</Text>
          </View>}
        </View>
        <View style={[styles.visual, wide && styles.visualWide]}><PlanPreview /></View>
      </View>
      <View style={[styles.principles, !wide && styles.principlesMobile]}>
        {[
          ['01', 'Find a plan', 'See activities on a map, not buried in a message thread.'],
          ['02', 'Make it happen', 'Pick something to do. Give your next hangout a place to start.'],
          ['03', 'Bring your people', 'Because the best third place is the one you share.'],
        ].map(([n, title, body]) => <View style={styles.principle} key={n}><Text style={styles.principleNumber}>{n}</Text><Text style={styles.principleTitle}>{title}</Text><Text style={styles.principleBody}>{body}</Text></View>)}
      </View>
      <View style={styles.footer}><Text style={styles.footerBrand}>vámonos!</Text><Text style={styles.footerText}>Plans worth putting your phone down for.</Text></View>
    </View>
  </ScrollView>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.paper }, scroll: { flexGrow: 1 },
  shell: { width: '100%', maxWidth: 1280, alignSelf: 'center', paddingHorizontal: 28 },
  nav: { height: 96, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 2, borderBottomColor: Colors.ink },
  brand: { ...Typography.largeTitle, fontSize: 30, color: Colors.ink, letterSpacing: -1.2 }, brandDot: { color: Colors.primary },
  navNote: { ...Typography.eyebrow, color: Colors.inkSoft },
  hero: { paddingVertical: 48, gap: 44 }, heroWide: { flexDirection: 'row', alignItems: 'center', paddingVertical: 84, gap: 64 },
  copy: { flex: 1 }, copyWide: { flex: 1.15 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 26 }, dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  eyebrow: { ...Typography.eyebrow, color: Colors.inkSoft },
  title: { ...Typography.display, fontSize: 64, lineHeight: 62, color: Colors.ink }, titleMobile: { fontSize: 42, lineHeight: 42 },
  titleAccent: { color: Colors.primary },
  lede: { ...Typography.body, fontSize: 18, lineHeight: 28, color: Colors.inkSoft, marginTop: 24, maxWidth: 480 },
  form: { marginTop: 34 }, formTitle: { ...Typography.title3, color: Colors.ink }, formCopy: { ...Typography.subhead, color: Colors.inkSoft, marginTop: 6, marginBottom: 20 },
  inputLabel: { ...Typography.eyebrow, fontSize: 10, color: Colors.inkSoft, marginBottom: 8 }, formRow: { flexDirection: 'row', gap: 10 }, formRowMobile: { flexDirection: 'column' },
  input: { flex: 1, minHeight: 54, minWidth: 0, borderWidth: 2, borderColor: Colors.ink, borderRadius: Radius.md, backgroundColor: Colors.card, paddingHorizontal: 16, fontSize: 15, color: Colors.ink, fontFamily: 'Archivo_500Medium' },
  button: { minHeight: 54, backgroundColor: Colors.primary, borderRadius: Radius.md, borderWidth: 2, borderColor: Colors.ink, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22, ...Shadows.medium }, buttonText: { color: Colors.card, fontFamily: 'Archivo_800ExtraBold', fontSize: 14, letterSpacing: 0.3 }, disabled: { opacity: 0.6 },
  privacy: { ...Typography.caption1, fontFamily: 'Archivo_400Regular', lineHeight: 17, color: Colors.inkSoft, marginTop: 12, maxWidth: 460 }, error: { color: Colors.danger, lineHeight: 20, fontSize: 13, marginTop: 12, fontFamily: 'Archivo_600SemiBold' },
  visual: { flex: 1 }, visualWide: { flex: 1 },
  preview: { borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.card, borderRadius: Radius.xl, overflow: 'hidden', ...Shadows.large },
  previewHeader: { padding: 22, gap: 8 }, previewTitle: { ...Typography.title3, color: Colors.ink }, previewLabel: { ...Typography.eyebrow, fontSize: 8, color: Colors.textTertiary },
  map: { height: 270, backgroundColor: Colors.ink, overflow: 'hidden', position: 'relative', borderTopWidth: 2, borderTopColor: Colors.ink },
  street: { position: 'absolute', height: 22, width: '150%', backgroundColor: '#3A2E24', left: '-25%' },
  park: { position: 'absolute', top: 80, right: 30, width: 130, height: 95, borderRadius: 30, backgroundColor: Colors.butter, transform: [{ rotate: '-20deg' }], alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.ink }, parkText: { color: Colors.ink, fontSize: 9, letterSpacing: 1.5, fontFamily: 'Archivo_800ExtraBold' },
  pin: { position: 'absolute', width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.card, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: Colors.ink },
  pinHot: { backgroundColor: Colors.primary }, pinNum: { fontSize: 12, fontFamily: 'Archivo_800ExtraBold', color: Colors.ink },
  plan: { flexDirection: 'row', gap: 14, alignItems: 'center', borderTopWidth: 2, borderTopColor: Colors.ink, padding: 20 }, planNumber: { color: Colors.primary, ...Typography.eyebrow }, planName: { color: Colors.ink, ...Typography.headline, fontSize: 15 }, planMeta: { color: Colors.inkSoft, fontSize: 11, marginTop: 5, fontFamily: 'Archivo_500Medium' },
  goBadge: { backgroundColor: Colors.butter, borderWidth: 2, borderColor: Colors.ink, borderRadius: Radius.pill, paddingHorizontal: 10, paddingVertical: 4 }, goBadgeText: { ...Typography.caption2, color: Colors.ink },
  principles: { flexDirection: 'row', gap: 38, paddingVertical: 40, borderTopWidth: 2, borderTopColor: Colors.ink }, principlesMobile: { flexDirection: 'column', gap: 28 }, principle: { flex: 1 }, principleNumber: { color: Colors.primary, ...Typography.eyebrow, marginBottom: 14 }, principleTitle: { color: Colors.ink, ...Typography.title3 }, principleBody: { color: Colors.inkSoft, fontSize: 14, lineHeight: 23, marginTop: 10, maxWidth: 310, fontFamily: 'Archivo_400Regular' },
  footer: { borderTopWidth: 2, borderTopColor: Colors.ink, paddingVertical: 28, gap: 8 }, footerBrand: { ...Typography.title3, letterSpacing: -0.6, color: Colors.ink }, footerText: { fontSize: 11, color: Colors.inkSoft, fontFamily: 'Archivo_500Medium' },
});
