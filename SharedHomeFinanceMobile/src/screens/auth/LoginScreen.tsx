import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgUri } from 'react-native-svg';
import { Svg, Path } from 'react-native-svg';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import {
  useFonts,
  Montserrat_700Bold,
  Montserrat_400Regular,
  Montserrat_600SemiBold,
} from '@expo-google-fonts/montserrat';
import { Asset } from 'expo-asset';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { AuthStackParamList } from '../../navigation/types';
import { emailLogin, googleLogin } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { useHome } from '../../context/HomeContext';
import { useTranslation } from 'react-i18next';

type Nav = StackNavigationProp<AuthStackParamList, 'Login'>;

const { height } = Dimensions.get('window');
const ILLUSTRATION_HEIGHT = height * 0.27;

interface FormData {
  email: string;
  password: string;
}

const illustrationUri = Asset.fromModule(
  require('../../../assets/illustrations/login.svg'),
).uri;

export default function LoginScreen() {
  const { t } = useTranslation();
  const schema = yup.object({
    email: yup.string().email(t('auth.emailValidation')).required(t('auth.emailRequired')),
    password: yup.string().min(6, t('auth.passwordMin')).required(t('auth.passwordRequired')),
  });
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();
  const { login } = useAuth();
  const { clearHomes } = useHome();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const slideAnim = useRef(new Animated.Value(height)).current;

  const [fontsLoaded] = useFonts({
    Montserrat_700Bold,
    Montserrat_400Regular,
    Montserrat_600SemiBold,
  });

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      friction: 10,
      tension: 60,
      useNativeDriver: true,
    }).start();
  }, []);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: FormData) => {
    setApiError('');
    setIsLoading(true);
    try {
      const { user, token } = await emailLogin(data.email, data.password);
      queryClient.clear();
      clearHomes();
      await login({ id: user.id, email: user.email, fullName: user.name }, token);
    } catch (err: unknown) {
      const firebaseErr = err as { code?: string; message?: string };
      const code = firebaseErr.code ?? '';
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setApiError(t('auth.invalidCredentials'));
      } else if (code === 'auth/too-many-requests') {
        setApiError(t('auth.tooManyAttempts'));
      } else if (code === 'auth/network-request-failed') {
        setApiError(t('auth.noInternet'));
      } else {
        setApiError(t('auth.loginError'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onGoogleLogin = async () => {
    setApiError('');
    setIsLoading(true);
    try {
      const { user, token } = await googleLogin();
      queryClient.clear();
      clearHomes();
      await login({ id: user.id, email: user.email, fullName: user.name }, token);
    } catch (err: unknown) {
      const firebaseErr = err as { code?: string };
      if (firebaseErr.code !== 'SIGN_IN_CANCELLED') {
        setApiError(t('auth.googleLoginError'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -100}
      >
        <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
          {/* İllüstrasyon */}
          <View style={styles.illustrationWrapper}>
            <SvgUri
              width="100%"
              height={ILLUSTRATION_HEIGHT}
              uri={illustrationUri}
            />
          </View>

          <View style={styles.formContent}>
            <View style={styles.titleGroup}>
              <Text style={styles.title}>{t('auth.login')}</Text>
              <Text style={styles.subtitle}>{t('auth.welcomeBack')}</Text>
            </View>

            {apiError ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color={colors.danger} />
                <Text style={styles.errorBoxText}>{apiError}</Text>
              </View>
            ) : null}

            {/* Email */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{t('auth.email')}</Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={[styles.inputRow, errors.email && styles.inputError]}>
                    <Ionicons name="mail-outline" size={18} color={colors.subText} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="ornek@email.com"
                      placeholderTextColor={colors.subText}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                    />
                  </View>
                )}
              />
              {errors.email && <Text style={styles.errorMsg}>{errors.email.message}</Text>}
            </View>

            {/* Şifre */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{t('auth.password')}</Text>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={[styles.inputRow, errors.password && styles.inputError]}>
                    <Ionicons name="lock-closed-outline" size={18} color={colors.subText} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="••••••••"
                      placeholderTextColor={colors.subText}
                      secureTextEntry={!showPassword}
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eyeBtn}>
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={18}
                        color={colors.subText}
                      />
                    </TouchableOpacity>
                  </View>
                )}
              />
              {errors.password && <Text style={styles.errorMsg}>{errors.password.message}</Text>}
            </View>

            <TouchableOpacity
              style={styles.forgotRow}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={styles.forgotText}>{t('auth.forgotPassword')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryBtn, isLoading && styles.primaryBtnDisabled]}
              activeOpacity={0.85}
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
            >
              <LinearGradient
                colors={['#1E40AF', '#0D9488']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
              >
                <Text style={styles.primaryBtnText}>
                  {isLoading ? t('auth.loginLoading') : t('auth.login')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>veya</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity style={styles.googleBtn} activeOpacity={0.85} onPress={onGoogleLogin}>
              <Svg width={20} height={20} viewBox="0 0 48 48">
                <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <Path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                <Path fill="none" d="M0 0h48v48H0z"/>
              </Svg>
              <Text style={styles.googleBtnText}>{t('auth.googleLogin')}</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>{t('auth.noAccount')} </Text>
              <TouchableOpacity onPress={() => navigation.replace('Register')}>
                <Text style={styles.footerLink}>{t('auth.register')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.background },


  illustrationWrapper: {
    width: '100%',
    height: ILLUSTRATION_HEIGHT,
    paddingLeft: 48,
    paddingRight: 16,
    marginTop: -80,
  },

  formContent: {
    paddingHorizontal: 28,
    paddingBottom: 40,
  },

  titleGroup: { marginBottom: 24 },
  title: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 26,
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 14,
    color: colors.subText,
  },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
  },
  errorBoxText: { color: colors.danger, fontSize: 13, flex: 1, fontFamily: 'Montserrat_400Regular' },

  fieldGroup: { marginBottom: 16 },
  label: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 13,
    color: colors.text,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  inputError: {
    borderColor: colors.danger,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    fontFamily: 'Montserrat_400Regular',
  },
  eyeBtn: { padding: 4 },
  errorMsg: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 12,
    color: colors.danger,
    marginTop: 5,
    marginLeft: 4,
  },

  forgotRow: { alignSelf: 'flex-end', marginBottom: 24, marginTop: 4 },
  forgotText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 13,
    color: colors.primary,
  },

  primaryBtn: {
    borderRadius: 30,
    height: 52,
    overflow: 'hidden',
    marginBottom: 20,
  },
  primaryBtnDisabled: { opacity: 0.7 },
  primaryBtnText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 13,
    color: colors.subText,
  },

  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 30,
    height: 52,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: 28,
  },
  googleBtnText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 15,
    color: colors.text,
  },

  footer: { flexDirection: 'row', justifyContent: 'center' },
  footerText: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 14,
    color: colors.subText,
  },
  footerLink: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 14,
    color: colors.primary,
  },
});
