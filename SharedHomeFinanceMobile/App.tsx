import 'react-native-gesture-handler';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';

import { AuthProvider } from './src/context/AuthContext';
import { HomeProvider } from './src/context/HomeContext';
import { appTheme } from './src/theme';
import RootNavigator from './src/navigation/RootNavigator';
import './src/i18n';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5,
    },
  },
});

export default function App() {
  GoogleSignin.configure({
    webClientId: '89105206900-f9miisl09qq24sqqb3mqre9h465apdvs.apps.googleusercontent.com',
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <HomeProvider>
            <PaperProvider theme={appTheme}>
              <NavigationContainer>
                <StatusBar style="auto" />
                <RootNavigator />
                <Toast />
              </NavigationContainer>
            </PaperProvider>
          </HomeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
