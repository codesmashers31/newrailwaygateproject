import React from 'react';
import { StyleSheet, View, LogBox } from 'react-native';
import { NavigationProvider, useNavigation } from './src/navigation/NavigationContext';

// Ignore specific warnings globally to keep screen clean on emulators/devices
LogBox.ignoreLogs([
  'SafeAreaView has been deprecated',
  'Failed to recenter',
  'GPS tracking error',
  'Current location is unavailable'
]);
import SplashScreen from './src/screens/SplashScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import MainTabScreen from './src/screens/MainTabScreen';
import GateDetailsScreen from './src/screens/GateDetailsScreen';
import { COLORS } from './src/theme/theme';

function AppContent() {
  const { currentScreen } = useNavigation();

  const renderScreen = () => {
    switch (currentScreen) {
      case 'SPLASH':
        return <SplashScreen />;
      case 'ONBOARDING':
      case 'WELCOME':
        return <WelcomeScreen />;
      case 'LOGIN':
        return <LoginScreen />;
      case 'MAIN':
        return <MainTabScreen />;
      case 'GATE_DETAILS':
        return <GateDetailsScreen />;
      default:
        return <SplashScreen />;
    }
  };

  return <View style={styles.container}>{renderScreen()}</View>;
}

export default function App() {
  return (
    <NavigationProvider initialScreen="SPLASH">
      <AppContent />
    </NavigationProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
