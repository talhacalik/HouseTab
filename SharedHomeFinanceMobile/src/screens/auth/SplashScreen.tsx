import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import {
  useFonts,
  Montserrat_700Bold,
  Montserrat_400Regular,
  Montserrat_600SemiBold,
} from '@expo-google-fonts/montserrat';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { AuthStackParamList } from '../../navigation/types';
import { useTranslation } from 'react-i18next';

type Nav = StackNavigationProp<AuthStackParamList, 'Splash'>;

const { width, height } = Dimensions.get('window');

function Background() {
  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {/* Tek dalgalı beyaz çizgi */}
      <Path
        d={`M0,${height * 0.38} C${width * 0.2},${height * 0.28} ${width * 0.5},${height * 0.5} ${width * 0.8},${height * 0.33} S${width * 1.1},${height * 0.2} ${width},${height * 0.3}`}
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="1.5"
        fill="none"
      />
      <Path
        d={`M0,${height * 0.42} C${width * 0.25},${height * 0.32} ${width * 0.55},${height * 0.54} ${width * 0.82},${height * 0.37} S${width * 1.1},${height * 0.24} ${width},${height * 0.34}`}
        stroke="rgba(255,255,255,0.07)"
        strokeWidth="1"
        fill="none"
      />
    </Svg>
  );
}

function GlowDollar() {
  return (
    <Svg width={180} height={180} viewBox="0 0 180 180">
      <Defs>
        <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#6BAAFF" stopOpacity="0.35" />
          <Stop offset="100%" stopColor="#0F172A" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      {/* Glow halkası */}
      <Circle cx="90" cy="90" r="88" fill="url(#glow)" />
      {/* İç çember */}
      <Circle
        cx="90"
        cy="90"
        r="62"
        fill="none"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="1.5"
      />
      <Circle
        cx="90"
        cy="90"
        r="50"
        fill="rgba(255,255,255,0.06)"
      />
    </Svg>
  );
}

export default function SplashScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();

  const [fontsLoaded] = useFonts({
    Montserrat_700Bold,
    Montserrat_400Regular,
    Montserrat_600SemiBold,
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={styles.container}>
      <Background />

      <View style={styles.content}>
        {/* Glow + $ ikonu */}
        <View style={styles.iconWrapper}>
          <View style={styles.glowContainer}>
            <GlowDollar />
          </View>
          <Text style={styles.dollarSign}>$</Text>
        </View>

        <Text style={styles.appName}>HouseTab</Text>
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.loginBtn}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginBtnText}>{t('auth.login')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.registerBtn}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Register')}
        >
          <LinearGradient
            colors={['#1E40AF', '#0D9488']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
          >
            <Text style={styles.registerBtnText}>{t('auth.register')}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  iconWrapper: {
    width: 180,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  glowContainer: {
    position: 'absolute',
  },
  dollarSign: {
    fontSize: 72,
    fontFamily: 'Montserrat_700Bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(107,170,255,0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 24,
  },
  appName: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 32,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  buttons: {
    paddingHorizontal: 28,
    paddingBottom: 40,
    gap: 14,
  },
  loginBtn: {
    borderRadius: 30,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  loginBtnText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  registerBtn: {
    borderRadius: 30,
    height: 64,
    overflow: 'hidden',
  },
  registerBtnText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});
