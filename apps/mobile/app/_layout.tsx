import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { mobileTheme } from '../src/constants/theme';
import { AuthProvider } from '../src/context/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" backgroundColor={mobileTheme.colors.background} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: mobileTheme.colors.background,
          },
          headerTintColor: mobileTheme.colors.darkGreen,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          contentStyle: {
            backgroundColor: mobileTheme.colors.background,
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: 'ParkEase',
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="(auth)/login"
          options={{
            title: 'Sign In',
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="(auth)/register"
          options={{
            title: 'Create Account',
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="(auth)/forgot-password"
          options={{
            title: 'Forgot Password',
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="(auth)/reset-password"
          options={{
            title: 'Reset Password',
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="(app)/profile"
          options={{
            title: 'My Profile',
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="(app)/vehicles"
          options={{
            title: 'My Vehicles',
            headerShadowVisible: false,
          }}
        />
      </Stack>
    </AuthProvider>
  );
}
