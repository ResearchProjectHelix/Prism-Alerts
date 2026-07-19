import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();
  const { deactivated } = useLocalSearchParams<{ deactivated?: string }>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setError(null);
    setIsLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError('Invalid credentials. Please try again.');
      setIsLoading(false);
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace('/alerts');
  };

  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top + webTopInset + 60,
            paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 0) + 40,
          },
        ]}
      >
        {/* Logo area */}
        <View style={styles.logoArea}>
          <Image
            source={require('@/assets/images/icon.png')}
            style={styles.prismIcon}
            resizeMode="contain"
          />
          <View style={styles.brandText}>
            <Text style={[styles.wordmarkPrism, { color: colors.foreground }]}>
              PRISM
            </Text>
            <Text style={[styles.wordmarkAlerts, { color: colors.primary }]}>
              ALERTS
            </Text>
          </View>
        </View>

        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Sign in with your PRISM account
        </Text>

        {/* Deactivated-account notice */}
        {deactivated === '1' && (
          <View
            style={[
              styles.deactivatedBox,
              { backgroundColor: '#cf5a5a18', borderColor: '#cf5a5a44' },
            ]}
          >
            <MaterialIcons name="block" size={16} color={colors.destructive} />
            <Text style={[styles.deactivatedText, { color: colors.destructive }]}>
              Your account has been deactivated. Please contact your organisation
              administrator.
            </Text>
          </View>
        )}

        {/* Form */}
        <View style={[styles.form, { marginTop: 48 }]}>
          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>
              Email
            </Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: colors.input,
                  borderColor: colors.border,
                },
              ]}
            >
              <MaterialIcons
                name="email"
                size={18}
                color={colors.mutedForeground}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                value={email}
                onChangeText={setEmail}
                placeholder="clinician@hospital.ie"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>
              Password
            </Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: colors.input,
                  borderColor: colors.border,
                },
              ]}
            >
              <MaterialIcons
                name="lock"
                size={18}
                color={colors.mutedForeground}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.mutedForeground}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password"
                returnKeyType="go"
                onSubmitEditing={handleSignIn}
              />
              <Pressable
                onPress={() => setShowPassword((v) => !v)}
                style={styles.eyeButton}
                hitSlop={8}
              >
                <MaterialIcons
                  name={showPassword ? 'visibility-off' : 'visibility'}
                  size={18}
                  color={colors.mutedForeground}
                />
              </Pressable>
            </View>
          </View>

          {/* Error */}
          {error && (
            <View
              style={[
                styles.errorBox,
                { backgroundColor: '#cf5a5a18', borderColor: '#cf5a5a44' },
              ]}
            >
              <MaterialIcons name="error-outline" size={16} color={colors.destructive} />
              <Text style={[styles.errorText, { color: colors.destructive }]}>
                {error}
              </Text>
            </View>
          )}

          {/* Sign in button */}
          <Pressable
            onPress={handleSignIn}
            disabled={isLoading}
            style={({ pressed }) => [
              styles.signInButton,
              {
                backgroundColor: colors.primary,
                opacity: isLoading || pressed ? 0.7 : 1,
              },
            ]}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.signInText}>Sign In</Text>
            )}
          </Pressable>
        </View>

        <Text style={[styles.footerNote, { color: colors.mutedForeground }]}>
          No account creation — contact your administrator.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 28,
  },
  logoArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  prismIcon: {
    width: 56,
    height: 56,
  },
  brandText: {
    gap: 0,
  },
  wordmarkPrism: {
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 4,
    lineHeight: 30,
  },
  wordmarkAlerts: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 3,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginTop: 8,
  },
  form: {
    gap: 16,
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    height: 50,
    paddingHorizontal: 14,
    gap: 10,
  },
  inputIcon: {},
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    height: '100%',
  },
  eyeButton: {
    padding: 4,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
  },
  errorText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    flex: 1,
  },
  signInButton: {
    borderRadius: 10,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  signInText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.3,
  },
  footerNote: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginTop: 'auto',
  },
  deactivatedBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    marginTop: 16,
  },
  deactivatedText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    flex: 1,
    lineHeight: 19,
  },
});
