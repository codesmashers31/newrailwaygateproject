import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Switch,
  Alert,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../theme/theme';
import { useNavigation } from '../navigation/NavigationContext';
import { MaterialIcons, FontAwesome5, Feather } from '@expo/vector-icons';
import { api } from '../services/api';

// Translations dictionary
const TRANSLATIONS = {
  English: {
    sectionConfig: 'App Configurations',
    darkMode: 'Dark Theme Appearance',
    langSelect: 'Language Selection',
    autoRefresh: 'Auto Refresh Gate Status',
    sectionAlerts: 'Alert Settings',
    warningAlerts: 'Receive Warning Alerts',
    soundAlerts: 'Alert Sound On/Off',
    vibrationAlerts: 'Vibration On/Off',
    sectionLoc: 'Location Services',
    locPerm: 'Location Permission',
    gpsAcc: 'GPS Accuracy Mode',
    sectionLegal: 'Legal & Support',
    dataUsage: 'Data Usage Settings',
    privacy: 'Privacy Policy',
    terms: 'Terms & Conditions',
    help: 'Help & Support',
    rate: 'Rate App',
    share: 'Share App with Friends',
    about: 'About App',
  },
  Tamil: {
    sectionConfig: 'பயன்பாட்டு அமைப்புகள்',
    darkMode: 'இருண்ட தீம் தோற்றம்',
    langSelect: 'மொழி தேர்வு',
    autoRefresh: 'தானியங்கி புதுப்பிப்பு நிலை',
    sectionAlerts: 'எச்சரிக்கை அமைப்புகள்',
    warningAlerts: 'எச்சரிக்கை அறிவிப்புகள்',
    soundAlerts: 'எச்சரிக்கை ஒலி ஆன்/ஆஃப்',
    vibrationAlerts: 'அதிர்வு ஆன்/ஆஃப்',
    sectionLoc: 'இருப்பிட சேவைகள்',
    locPerm: 'இருப்பிட அனுமதி',
    gpsAcc: 'ஜிபிஎஸ் துல்லியம்',
    sectionLegal: 'சட்ட மற்றும் ஆதரவு',
    dataUsage: 'தரவு பயன்பாட்டு அமைப்புகள்',
    privacy: 'தனியுரிமைக் கொள்கை',
    terms: 'விதிமுறைகள் மற்றும் நிபந்தனைகள்',
    help: 'உதவி மற்றும் ஆதரவு',
    rate: 'பயன்பாட்டை மதிப்பிடவும்',
    share: 'நண்பர்களுடன் பகிரவும்',
    about: 'பயன்பாட்டைப் பற்றி',
  }
};

export default function SettingsScreen() {
  const { isDarkMode, setIsDarkMode } = useNavigation();

  // Settings states
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [locationPermission, setLocationPermission] = useState(true);
  const [receiveWarnings, setReceiveWarnings] = useState(true);
  
  // Selector states
  const [language, setLanguage] = useState('English'); // English / Tamil
  const [gpsAccuracy, setGpsAccuracy] = useState('High Precision'); // High Precision / Balanced
  const [refreshInterval, setRefreshInterval] = useState('Every 30s'); // 30s / 1m

  useEffect(() => {
    const loadNotificationPreference = async () => {
      try {
        const response = await api.users.getProfile();
        if (response.data?.success) {
          setReceiveWarnings(response.data.data.notificationEnabled !== false);
        }
      } catch (error) {
        console.warn('Failed to load notification preference:', error);
      }
    };

    loadNotificationPreference();
  }, []);

  // Dynamic Theme Palette to make theme switch work
  const theme = {
    background: isDarkMode ? '#0B0F19' : '#F8FAFC',
    card: isDarkMode ? '#161F30' : '#FFFFFF',
    border: isDarkMode ? '#23304A' : '#E2E8F0',
    textPrimary: isDarkMode ? '#FFFFFF' : '#0F172A',
    textSecondary: isDarkMode ? '#94A3B8' : '#64748B',
    textMuted: isDarkMode ? '#475569' : '#94A3B8',
    itemBorder: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9',
  };

  const handleLanguageToggle = () => {
    const nextLang = language === 'English' ? 'Tamil' : 'English';
    setLanguage(nextLang);
    Alert.alert('Language Updated', `Application language set to ${nextLang === 'Tamil' ? 'தமிழ் (Tamil)' : 'English'}.`);
  };

  const handleGpsToggle = () => {
    const nextGps = gpsAccuracy === 'High Precision' ? 'Balanced' : 'High Precision';
    setGpsAccuracy(nextGps);
    Alert.alert('GPS Mode Changed', `GPS Accuracy set to: ${nextGps}`);
  };

  const handleRefreshToggle = () => {
    const nextInterval = refreshInterval === 'Every 30s' ? 'Every 1m' : 'Every 30s';
    setRefreshInterval(nextInterval);
    Alert.alert('Refresh Rate Changed', `Gate status auto-refreshes: ${nextInterval}`);
  };

  const handleNotificationToggle = async (enabled) => {
    const previousValue = receiveWarnings;
    setReceiveWarnings(enabled);

    try {
      if (enabled) {
        await api.users.enableNotifications();
      } else {
        await api.users.disableNotifications();
      }
    } catch (error) {
      setReceiveWarnings(previousValue);
      Alert.alert('Update failed', error.response?.data?.message || 'Could not update notification settings.');
    }
  };

  const t = TRANSLATIONS[language];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* App Customizations Category */}
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t.sectionConfig}</Text>
        <View style={[styles.settingsGroup, { backgroundColor: theme.card, borderColor: theme.border }]}>
          
          {/* Working Dark Mode/Light Mode toggle */}
          <View style={[styles.settingRow, { borderBottomColor: theme.itemBorder }]}>
            <View style={styles.settingTextCol}>
              <Feather name={isDarkMode ? 'sun' : 'moon'} size={18} color="#0F766E" style={styles.menuIcon} />
              <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>{t.darkMode}</Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={(val) => {
                setIsDarkMode(val);
                Alert.alert('Theme Switch', `Theme changed to: ${val ? 'Dark Mode' : 'Light Mode'}`);
              }}
              trackColor={{ false: '#E2E8F0', true: '#0F766E' }}
              thumbColor="#fff"
            />
          </View>

          {/* Language Selection */}
          <TouchableOpacity 
            style={[styles.settingRow, { borderBottomColor: theme.itemBorder }]} 
            onPress={handleLanguageToggle}
          >
            <View style={styles.settingTextCol}>
              <Feather name="globe" size={18} color="#0F766E" style={styles.menuIcon} />
              <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>{t.langSelect}</Text>
            </View>
            <View style={styles.selectorCol}>
              <Text style={[styles.selectorValue, { color: theme.textSecondary }]}>
                {language === 'English' ? 'English' : 'தமிழ் (Tamil)'}
              </Text>
              <MaterialIcons name="chevron-right" size={18} color={theme.textMuted} />
            </View>
          </TouchableOpacity>

          {/* Auto Refresh Interval */}
          <TouchableOpacity 
            style={[styles.settingRow, { borderBottomColor: theme.itemBorder, borderBottomWidth: 0 }]} 
            onPress={handleRefreshToggle}
          >
            <View style={styles.settingTextCol}>
              <Feather name="refresh-cw" size={18} color="#0F766E" style={styles.menuIcon} />
              <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>{t.autoRefresh}</Text>
            </View>
            <View style={styles.selectorCol}>
              <Text style={[styles.selectorValue, { color: theme.textSecondary }]}>{refreshInterval}</Text>
              <MaterialIcons name="chevron-right" size={18} color={theme.textMuted} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Notifications Settings Category */}
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t.sectionAlerts}</Text>
        <View style={[styles.settingsGroup, { backgroundColor: theme.card, borderColor: theme.border }]}>
          
          {/* Notification Settings Toggle */}
          <View style={[styles.settingRow, { borderBottomColor: theme.itemBorder }]}>
            <View style={styles.settingTextCol}>
              <Feather name="bell" size={18} color="#0F766E" style={styles.menuIcon} />
              <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>{t.warningAlerts}</Text>
            </View>
            <Switch
              value={receiveWarnings}
              onValueChange={handleNotificationToggle}
              trackColor={{ false: '#E2E8F0', true: '#0F766E' }}
            />
          </View>

          {/* Sound toggle */}
          <View style={[styles.settingRow, { borderBottomColor: theme.itemBorder }]}>
            <View style={styles.settingTextCol}>
              <Feather name="volume-2" size={18} color="#0F766E" style={styles.menuIcon} />
              <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>{t.soundAlerts}</Text>
            </View>
            <Switch
              value={soundEnabled}
              onValueChange={setSoundEnabled}
              trackColor={{ false: '#E2E8F0', true: '#0F766E' }}
            />
          </View>

          {/* Vibration toggle */}
          <View style={[styles.settingRow, { borderBottomColor: theme.itemBorder, borderBottomWidth: 0 }]}>
            <View style={styles.settingTextCol}>
              <Feather name="smartphone" size={18} color="#0F766E" style={styles.menuIcon} />
              <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>{t.vibrationAlerts}</Text>
            </View>
            <Switch
              value={vibrationEnabled}
              onValueChange={setVibrationEnabled}
              trackColor={{ false: '#E2E8F0', true: '#0F766E' }}
            />
          </View>
        </View>

        {/* GPS Permission Category */}
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t.sectionLoc}</Text>
        <View style={[styles.settingsGroup, { backgroundColor: theme.card, borderColor: theme.border }]}>
          
          {/* Location permission toggle */}
          <View style={[styles.settingRow, { borderBottomColor: theme.itemBorder }]}>
            <View style={styles.settingTextCol}>
              <Feather name="map-pin" size={18} color="#0F766E" style={styles.menuIcon} />
              <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>{t.locPerm}</Text>
            </View>
            <Switch
              value={locationPermission}
              onValueChange={setLocationPermission}
              trackColor={{ false: '#E2E8F0', true: '#0F766E' }}
            />
          </View>

          {/* GPS Accuracy select */}
          <TouchableOpacity 
            style={[styles.settingRow, { borderBottomColor: theme.itemBorder, borderBottomWidth: 0 }]} 
            onPress={handleGpsToggle}
          >
            <View style={styles.settingTextCol}>
              <Feather name="compass" size={18} color="#0F766E" style={styles.menuIcon} />
              <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>{t.gpsAcc}</Text>
            </View>
            <View style={styles.selectorCol}>
              <Text style={[styles.selectorValue, { color: theme.textSecondary }]}>{gpsAccuracy}</Text>
              <MaterialIcons name="chevron-right" size={18} color={theme.textMuted} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Info Category */}
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t.sectionLegal}</Text>
        <View style={[styles.settingsGroup, { backgroundColor: theme.card, borderColor: theme.border }]}>
          
          {/* Data usage */}
          <TouchableOpacity 
            style={[styles.settingRow, { borderBottomColor: theme.itemBorder }]} 
            onPress={() => Alert.alert('Data Usage', 'Map and tracking telemetry uses less than 5MB per hour.')}
          >
            <View style={styles.settingTextCol}>
              <Feather name="database" size={18} color="#475569" style={styles.menuIcon} />
              <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>{t.dataUsage}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={18} color={theme.textMuted} />
          </TouchableOpacity>

          {/* Privacy Policy */}
          <TouchableOpacity 
            style={[styles.settingRow, { borderBottomColor: theme.itemBorder }]} 
            onPress={() => Alert.alert('Privacy Policy', 'Standard Privacy Terms applied.')}
          >
            <View style={styles.settingTextCol}>
              <Feather name="shield" size={18} color="#475569" style={styles.menuIcon} />
              <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>{t.privacy}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={18} color={theme.textMuted} />
          </TouchableOpacity>

          {/* Terms & Conditions */}
          <TouchableOpacity 
            style={[styles.settingRow, { borderBottomColor: theme.itemBorder }]} 
            onPress={() => Alert.alert('Terms & Conditions', 'Standard Terms & Conditions applied.')}
          >
            <View style={styles.settingTextCol}>
              <Feather name="file-text" size={18} color="#475569" style={styles.menuIcon} />
              <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>{t.terms}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={18} color={theme.textMuted} />
          </TouchableOpacity>

          {/* Help & Support */}
          <TouchableOpacity 
            style={[styles.settingRow, { borderBottomColor: theme.itemBorder }]} 
            onPress={() => Alert.alert('Help & Support', 'Reach support at support@traingateview.com')}
          >
            <View style={styles.settingTextCol}>
              <Feather name="help-circle" size={18} color="#475569" style={styles.menuIcon} />
              <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>{t.help}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={18} color={theme.textMuted} />
          </TouchableOpacity>

          {/* Rate App */}
          <TouchableOpacity 
            style={[styles.settingRow, { borderBottomColor: theme.itemBorder }]} 
            onPress={() => Alert.alert('Rate App', 'Redirecting to App Store rating page...')}
          >
            <View style={styles.settingTextCol}>
              <Feather name="star" size={18} color="#475569" style={styles.menuIcon} />
              <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>{t.rate}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={18} color={theme.textMuted} />
          </TouchableOpacity>

          {/* Share App */}
          <TouchableOpacity 
            style={[styles.settingRow, { borderBottomColor: theme.itemBorder }]} 
            onPress={() => Alert.alert('Share App', 'Generate download links to share.')}
          >
            <View style={styles.settingTextCol}>
              <Feather name="share-2" size={18} color="#475569" style={styles.menuIcon} />
              <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>{t.share}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={18} color={theme.textMuted} />
          </TouchableOpacity>

          {/* About App */}
          <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
            <View style={styles.settingTextCol}>
              <Feather name="info" size={18} color="#475569" style={styles.menuIcon} />
              <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>{t.about}</Text>
            </View>
            <Text style={styles.infoAppVersion}>v1.0.0 (Expo)</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginLeft: 4,
  },
  settingsGroup: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    marginBottom: 24,
    ...SHADOWS.sm,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  settingTextCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  selectorCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectorValue: {
    fontSize: 13,
    marginRight: 6,
    fontWeight: '500',
  },
  infoAppVersion: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: 'bold',
  },
});
