import React from 'react';
import { TouchableOpacity } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { HomeSelectionStackParamList } from './types';
import HomeSelectionScreen from '../screens/home/HomeSelectionScreen';
import CreateHomeScreen from '../screens/home/CreateHomeScreen';
import JoinHomeScreen from '../screens/home/JoinHomeScreen';
import { colors } from '../theme/colors';
import { useTranslation } from 'react-i18next';

const Stack = createStackNavigator<HomeSelectionStackParamList>();

export default function HomeSelectionNavigator() {
  const { t } = useTranslation();
  return (
    <Stack.Navigator
      screenOptions={({ navigation }) => ({
        gestureEnabled: true,
        headerShown: true,
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: 'bold' },
        headerLeft: () => (
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ paddingLeft: 16 }}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        ),
      })}
    >
      <Stack.Screen
        name="HomeSelectionMain"
        component={HomeSelectionScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CreateHome"
        component={CreateHomeScreen}
        options={{ title: t('home.createHome') }}
      />
      <Stack.Screen
        name="JoinHome"
        component={JoinHomeScreen}
        options={{ title: t('home.joinHome') }}
      />
    </Stack.Navigator>
  );
}
