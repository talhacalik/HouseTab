import React, { useRef, useEffect } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { AuthStackParamList } from '../../navigation/types';
import { useTranslation } from 'react-i18next';
import auth from '@react-native-firebase/auth';

type Nav = StackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

const { height } = Dimensions.get('window');
const ILLUSTRATION_HEIGHT = height * 0.27;

interface FormData {
  email: string;
}


const illustrationUri = Asset.fromModule(
  require('../../../assets/illustrations/undraw_forgot_password.svg'),
).uri;

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const schema = yup.object({
    email: yup.string().email(t('auth.emailValidation')).required(t('auth.emailRequired')),
  });
  const navigation = useNavigation<Nav>();
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

  const { control, handleSubmit, formState: { errors, isSubmitting, isSubmitSuccessful } } =
    useForm<FormData>({
      resolver: yupResolver(schema),
      defaultValues: { email: '' },
    });

  const onSubmit = async (data: FormData) => {
    await auth().sendPasswordResetEmail(data.email);
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
              <Text style={styles.title}>{t('auth.forgotPasswordTitle')}</Text>
              <Text style={styles.subtitle}>{t('auth.forgotPasswordSubtitle')}</Text>
            </View>

            {isSubmitSuccessful ? (
              <View style={styles.successBox}>
                <Ionicons name="checkmark-circle" size={20} color={colors.secondary} />
                <Text style={styles.successText}>{t('auth.forgotPasswordSuccess')}</Text>
              </View>
            ) : (
              <>
                {/* Email */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>{t('auth.email')}</Text>
                  <Controller
                    control={control}
                    name="email"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View style={[styles.inputRow, errors.email && styles.inputError]}>
                        <Ionicons
                          name="mail-outline"
                          size={18}
                          color={colors.subText}
                          style={styles.inputIcon}
                        />
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

                <TouchableOpacity
                  style={[styles.primaryBtn, isSubmitting && styles.primaryBtnDisabled]}
                  activeOpacity={0.85}
                  onPress={handleSubmit(onSubmit)}
                  disabled={isSubmitting}
                >
                  <LinearGradient
                    colors={['#1E40AF', '#0D9488']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
                  >
                    <Text style={styles.primaryBtnText}>
                      {isSubmitting ? t('auth.forgotPasswordSending') : t('auth.forgotPasswordBtn')}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              style={styles.backToLoginRow}
              onPress={() => navigation.navigate('Login')}
            >
              <Ionicons name="chevron-back" size={14} color={colors.primary} />
              <Text style={styles.backToLoginText}>{t('auth.backToLogin')}</Text>
            </TouchableOpacity>
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
    paddingHorizontal: 36,
    marginTop: -30,
  },

  formContent: {
    paddingHorizontal: 28,
    paddingTop: 20,
    paddingBottom: 40,
  },

  titleGroup: { marginBottom: 28 },
  title: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 26,
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 14,
    color: colors.subText,
    lineHeight: 22,
  },

  successBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.25)',
  },
  successText: {
    flex: 1,
    fontFamily: 'Montserrat_400Regular',
    fontSize: 14,
    color: colors.secondary,
    lineHeight: 22,
  },

  fieldGroup: { marginBottom: 20 },
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
  inputError: { borderColor: colors.danger },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    fontFamily: 'Montserrat_400Regular',
  },
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
    marginBottom: 28,
  },
  primaryBtnDisabled: { opacity: 0.7 },
  primaryBtnText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },

  backToLoginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  backToLoginText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 14,
    color: colors.primary,
  },
});
