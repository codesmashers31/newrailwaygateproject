import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, StatusBar, Dimensions } from 'react-native';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../theme/theme';
import { useNavigation } from '../navigation/NavigationContext';
import DashboardScreen from './DashboardScreen';
import SearchScreen from './SearchScreen'; // Serving as Live Track / Search
import AlertsScreen from './AlertsScreen'; // Serving as History / Notification logs
import SettingsScreen from './SettingsScreen'; // Serving as app settings
import ProfileScreen from './ProfileScreen'; // Serving as Profile Settings Screen
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function MainTabScreen() {
  const { isDarkMode } = useNavigation();

  // Dynamic Theme Palette
  const theme = {
    background: isDarkMode ? '#0B0F19' : '#F8FAFC',
    card: isDarkMode ? '#161F30' : '#FFFFFF',
    border: isDarkMode ? '#23304A' : '#E2E8F0',
    textPrimary: isDarkMode ? '#FFFFFF' : '#0F172A',
    textSecondary: isDarkMode ? '#94A3B8' : '#64748B',
    textMuted: isDarkMode ? '#475569' : '#94A3B8',
    itemBorder: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9',
  };

  const [activeTab, setActiveTab] = useState('HOME');

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'HOME':
        return <DashboardScreen onNotificationPress={() => setActiveTab('HISTORY')} />;
      case 'TRACK':
        return <SearchScreen />; // Search screen handles Live Route crossings tracking
      case 'HISTORY':
        return <AlertsScreen />; // Alerts logs acts as History of notifications
      case 'PROFILE':
        return <ProfileScreen />; // Profile screen to edit details & saved routes
      case 'SETTINGS':
        return <SettingsScreen />; // App settings via the center floating tab
      default:
        return <DashboardScreen />;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar 
        barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
        backgroundColor={theme.background} 
      />

      {/* Main Screen Content Area */}
      <View style={styles.content}>{renderActiveScreen()}</View>

      {/* Step 4: Arched Custom Bottom Tab Bar Footer (Matching the reference picture layout) */}
      <View style={styles.tabBarWrapper}>
        {/* The arched tab bar container */}
        <View style={[styles.tabBar, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
          
          {/* Tab 1: Home */}
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setActiveTab('HOME')}
            activeOpacity={0.8}
          >
            <MaterialIcons
              name="home"
              size={26}
              color={activeTab === 'HOME' ? '#7C3AED' : theme.textSecondary} // Active purple, inactive slate-gray
            />
            <Text style={[styles.tabLabel, { color: theme.textSecondary }, activeTab === 'HOME' && styles.activeTabLabel]}>
              Home
            </Text>
          </TouchableOpacity>

          {/* Tab 2: Live Track */}
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setActiveTab('TRACK')}
            activeOpacity={0.8}
          >
            <MaterialIcons
              name="directions-transit"
              size={24}
              color={activeTab === 'TRACK' ? '#7C3AED' : theme.textSecondary}
            />
            <Text style={[styles.tabLabel, { color: theme.textSecondary }, activeTab === 'TRACK' && styles.activeTabLabel]}>
              Live Track
            </Text>
          </TouchableOpacity>

          {/* Dummy spacing placeholder for the center floating button */}
          <View style={styles.centerGapPlaceholder} />

          {/* Tab 3: History */}
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setActiveTab('HISTORY')}
            activeOpacity={0.8}
          >
            <MaterialIcons
              name="history"
              size={26}
              color={activeTab === 'HISTORY' ? '#7C3AED' : theme.textSecondary}
            />
            <Text style={[styles.tabLabel, { color: theme.textSecondary }, activeTab === 'HISTORY' && styles.activeTabLabel]}>
              History
            </Text>
          </TouchableOpacity>

          {/* Tab 4: Profile */}
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setActiveTab('PROFILE')}
            activeOpacity={0.8}
          >
            <MaterialIcons
              name="person"
              size={26}
              color={activeTab === 'PROFILE' ? '#7C3AED' : theme.textSecondary}
            />
            <Text style={[styles.tabLabel, { color: theme.textSecondary }, activeTab === 'PROFILE' && styles.activeTabLabel]}>
              Profile
            </Text>
          </TouchableOpacity>
        </View>

        {/* Step 4: Raised Circular Center Floating Button (Settings in heart place) */}
        <TouchableOpacity
          style={[styles.floatingCenterBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => setActiveTab('SETTINGS')}
          activeOpacity={0.9}
        >
          <View style={[
            styles.floatingBtnInner,
            { backgroundColor: theme.background },
            activeTab === 'SETTINGS' && styles.floatingBtnInnerActive
          ]}>
            <MaterialIcons
              name="settings"
              size={28}
              color={activeTab === 'SETTINGS' ? '#FFF' : '#7C3AED'} // Active turns white, inactive is purple
            />
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
  },
  // Custom arched tab bar footer layout styling
  tabBarWrapper: {
    position: 'relative',
    backgroundColor: 'transparent',
    width: '100%',
    height: 68,
    justifyContent: 'flex-end',
  },
  tabBar: {
    flexDirection: 'row',
    height: 60,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1.2,
    borderTopColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 4,
    // Soft outer shadow for the navbar
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 4,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    height: '100%',
  },
  tabLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '700',
    marginTop: 3,
  },
  activeTabLabel: {
    color: '#7C3AED', // Active indicator color
  },
  centerGapPlaceholder: {
    width: 68,
    height: '100%',
  },
  // Step 4: Floating circular button styled exactly like reference image
  floatingCenterBtn: {
    position: 'absolute',
    alignSelf: 'center',
    top: 2, // Centered in the notch cutout style
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    // High premium drop shadow for the floating circle button
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 4.5,
    elevation: 5,
    zIndex: 100,
  },
  floatingBtnInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9', // Soft light backdrop inside button
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingBtnInnerActive: {
    backgroundColor: '#7C3AED', // Primary color when active
  },
});
