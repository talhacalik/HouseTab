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
import { LinearGradient } from 'expo-linear-gradient';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import {
  useFonts,
  Montserrat_700Bold,
  Montserrat_400Regular,
  Montserrat_600SemiBold,
} from '@expo-google-fonts/montserrat';
import { Asset } from 'expo-asset';
import { colors } from '../../theme/colors';
import { AuthStackParamList } from '../../navigation/types';
import { emailRegister } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

type Nav = StackNavigationProp<AuthStackParamList, 'Register'>;

const { height } = Dimensions.get('window');
const ILLUSTRATION_HEIGHT = height * 0.27;

interface FormData {
  fullName: string;
  email: string;
  password: string;
  passwordConfirm: string;
}


const illustrationUri = Asset.fromModule(
  require('../../../assets/illustrations/register.svg'),
).uri;

function FieldGroup({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {error ? <Text style={styles.errorMsg}>{error}</Text> : null}
    </View>
  );
}

export default function RegisterScreen() {
  const { t } = useTranslation();
  const schema = yup.object({
    fullName: yup.string().min(2, t('auth.nameMin')).required(t('auth.nameRequired')),
    email: yup.string().email(t('auth.emailValidation')).required(t('auth.emailRequired')),
    password: yup.string().min(6, t('auth.passwordMin')).required(t('auth.passwordRequired')),
    passwordConfirm: yup
      .string()
      .oneOf([yup.ref('password')], t('auth.passwordConfirmMatch'))
      .required(t('auth.passwordConfirmRequired')),
  });
  const navigation = useNavigation<Nav>();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
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
    defaultValues: { fullName: '', email: '', password: '', passwordConfirm: '' },
  });

  const onSubmit = async (data: FormData) => {
    setApiError('');
    setIsLoading(true);
    try {
      const { user, token } = await emailRegister(data.email, data.password, data.fullName);
      await login({ id: user.id, email: user.email, fullName: user.name }, token);
    } catch (err: unknown) {
      const firebaseErr = err as { code?: string; message?: string };
      const code = firebaseErr.code ?? '';
      if (code === 'auth/email-already-in-use') {
        setApiError(t('auth.emailInUse'));
      } else if (code === 'auth/weak-password') {
        setApiError(t('auth.weakPassword'));
      } else if (code === 'auth/network-request-failed') {
        setApiError(t('auth.noInternet'));
      } else {
        setApiError(t('auth.registerError'));
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
              <Text style={styles.title}>{t('auth.register')}</Text>
              <Text style={styles.subtitle}>{t('auth.registerSubtitle')}</Text>
            </View>

            {apiError ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color={colors.danger} />
                <Text style={styles.errorBoxText}>{apiError}</Text>
              </View>
            ) : null}

            <FieldGroup label={t('auth.fullName')} error={errors.fullName?.message}>
              <Controller
                control={control}
                name="fullName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={[styles.inputRow, errors.fullName && styles.inputError]}>
                    <Ionicons name="person-outline" size={18} color={colors.subText} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Adın Soyadın"
                      placeholderTextColor={colors.subText}
                      autoCapitalize="words"
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                    />
                  </View>
                )}
              />
            </FieldGroup>

            <FieldGroup label={t('auth.email')} error={errors.email?.message}>
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
            </FieldGroup>

            <FieldGroup label={t('auth.password')} error={errors.password?.message}>
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
            </FieldGroup>

            <FieldGroup label={t('auth.passwordConfirm')} error={errors.passwordConfirm?.message}>
              <Controller
                control={control}
                name="passwordConfirm"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={[styles.inputRow, errors.passwordConfirm && styles.inputError]}>
                    <Ionicons name="lock-closed-outline" size={18} color={colors.subText} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="••••••••"
                      placeholderTextColor={colors.subText}
                      secureTextEntry={!showConfirm}
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                    />
                    <TouchableOpacity onPress={() => setShowConfirm(v => !v)} style={styles.eyeBtn}>
                      <Ionicons
                        name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                        size={18}
                        color={colors.subText}
                      />
                    </TouchableOpacity>
                  </View>
                )}
              />
            </FieldGroup>

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
                  {isLoading ? t('auth.registerLoading') : t('auth.register')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>{t('auth.hasAccount')} </Text>
              <TouchableOpacity onPress={() => navigation.replace('Login')}>
                <Text style={styles.footerLink}>{t('auth.login')}</Text>
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
    paddingLeft: 12,
    paddingRight: 52,
    marginTop: -90,
  },

  formContent: {
    paddingHorizontal: 28,
    paddingBottom: 40,
  },

  titleGroup: { marginBottom: 13 },
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
  errorBoxText: {
    color: colors.danger,
    fontSize: 13,
    flex: 1,
    fontFamily: 'Montserrat_400Regular',
  },

  fieldGroup: { marginBottom: 14 },
  label: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 13,
    color: colors.text,
    marginBottom: 4,
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

  primaryBtn: {
    borderRadius: 30,
    height: 52,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 24,
  },
  primaryBtnDisabled: { opacity: 0.7 },
  primaryBtnText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 16,
    color: '#FFFFFF',
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
