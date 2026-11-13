import { Session } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { Colors, Radius, Shadows, Typography } from '../constants/theme'
import { supabase } from '../lib/supabase'

export default function Account({ session }: { session: Session }) {
  const [loading, setLoading] = useState(true)
  const [username, setUsername] = useState('')
  const [website, setWebsite] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')

  useEffect(() => {
    if (session) getProfile()
  }, [session])

  async function getProfile() {
    try {
      setLoading(true)
      if (!session?.user) throw new Error('No user on the session!')

      const { data, error, status } = await supabase
        .from('profiles')
        .select(`username, website, avatar_url`)
        .eq('id', session?.user.id)
        .single()
      if (error && status !== 406) {
        throw error
      }

      if (data) {
        setUsername(data.username)
        setWebsite(data.website)
        setAvatarUrl(data.avatar_url)
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  async function updateProfile({
    username,
    website,
    avatar_url,
  }: {
    username: string
    website: string
    avatar_url: string
  }) {
    try {
      setLoading(true)
      if (!session?.user) throw new Error('No user on the session!')

      const updates = {
        id: session?.user.id,
        username,
        website,
        avatar_url,
        updated_at: new Date(),
      }

      const { error } = await supabase.from('profiles').upsert(updates)

      if (error) {
        throw error
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Text style={styles.label}>Email</Text>
        <View style={[styles.inputContainer, styles.inputDisabled]}>
          <Text style={styles.disabledText}>{session?.user?.email}</Text>
        </View>
      </View>
      <View style={styles.verticallySpaced}>
        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.inputContainer}
          value={username || ''}
          onChangeText={(text) => setUsername(text)}
          placeholderTextColor={Colors.textTertiary}
        />
      </View>
      <View style={styles.verticallySpaced}>
        <Text style={styles.label}>Website</Text>
        <TextInput
          style={styles.inputContainer}
          value={website || ''}
          onChangeText={(text) => setWebsite(text)}
          placeholderTextColor={Colors.textTertiary}
          autoCapitalize="none"
        />
      </View>

      <View style={[styles.verticallySpaced, styles.mt20]}>
        <TouchableOpacity
          style={[styles.primaryButton, loading && { opacity: 0.6 }]}
          onPress={() => updateProfile({ username, website, avatar_url: avatarUrl })}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonTitle}>{loading ? 'Loading ...' : 'Update'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.verticallySpaced}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => supabase.auth.signOut()}
          activeOpacity={0.85}
        >
          <Text style={styles.secondaryButtonTitle}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 40,
    padding: 24,
    backgroundColor: Colors.paper,
    flex: 1,
  },
  verticallySpaced: {
    paddingTop: 8,
    paddingBottom: 8,
    alignSelf: 'stretch',
  },
  mt20: {
    marginTop: 20,
  },
  label: {
    ...Typography.eyebrow,
    color: Colors.textSecondary,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: Colors.ink,
    paddingHorizontal: 16,
    height: 56,
    justifyContent: 'center',
    color: Colors.ink,
    fontSize: 16,
    fontFamily: 'Archivo_500Medium',
  },
  inputDisabled: {
    backgroundColor: Colors.backgroundTertiary,
  },
  disabledText: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontFamily: 'Archivo_500Medium',
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
    borderWidth: 2,
    borderColor: Colors.ink,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.medium,
  },
  secondaryButton: {
    backgroundColor: Colors.card,
    borderRadius: Radius.pill,
    borderWidth: 2,
    borderColor: Colors.ink,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonTitle: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 16,
    color: Colors.card,
  },
  secondaryButtonTitle: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 16,
    color: Colors.danger,
  },
})
