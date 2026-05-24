import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  GoogleAuthProvider,
  signInWithCredential,
  getIdToken,
} from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import axios from 'axios';

import Constants from 'expo-constants';

const API_URL: string =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  'http://10.0.2.2:8080/api';

export interface BackendUser {
  id: number;
  email: string;
  name: string;
  profilePhotoUrl: string | null;
  createdAt: string;
}

interface BackendApiResponse {
  data: BackendUser;
  message: string;
  success: boolean;
}

export interface BackendAuthResponse {
  token: string;
  user: BackendUser;
}

async function syncWithBackend(
  firebaseToken: string,
  displayName: string | null,
  email: string | null,
  photoURL: string | null,
): Promise<BackendAuthResponse> {
  const res = await axios.post<BackendApiResponse>(
    `${API_URL}/users/register`,
    { name: displayName, email, profilePhotoUrl: photoURL },
    { headers: { Authorization: `Bearer ${firebaseToken}` } },
  );
  return { user: res.data.data, token: firebaseToken };
}

export async function emailLogin(
  email: string,
  password: string,
): Promise<BackendAuthResponse> {
  try {
    const auth = getAuth();
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const { user } = credential;
    const firebaseToken = await getIdToken(user);
    const result = await syncWithBackend(firebaseToken, user.displayName, user.email, user.photoURL);
    return result;
  } catch (error: unknown) {
    throw error;
  }
}

export async function emailRegister(
  email: string,
  password: string,
  fullName: string,
): Promise<BackendAuthResponse> {
  const auth = getAuth();
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const { user } = credential;
  await updateProfile(user, { displayName: fullName });
  const firebaseToken = await getIdToken(user);
  return syncWithBackend(firebaseToken, fullName, user.email, user.photoURL);
}

export async function googleLogin(): Promise<BackendAuthResponse> {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const signInResult = await GoogleSignin.signIn();
  const idToken = signInResult.data?.idToken;
  if (!idToken) throw new Error('Google Sign-In başarısız: token alınamadı');
  const googleCredential = GoogleAuthProvider.credential(idToken);
  const auth = getAuth();
  const credential = await signInWithCredential(auth, googleCredential);
  const { user } = credential;
  const firebaseToken = await getIdToken(user);
  return syncWithBackend(firebaseToken, user.displayName, user.email, user.photoURL);
}

export async function logout(): Promise<void> {
  const auth = getAuth();
  await signOut(auth);
  try {
    await GoogleSignin.signOut();
  } catch {
    // Google ile giriş yapılmamışsa hata vermesin
  }
}

export function getCurrentUser() {
  return getAuth().currentUser;
}

export async function getToken(): Promise<string | null> {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) return null;
  return await getIdToken(user);
}
