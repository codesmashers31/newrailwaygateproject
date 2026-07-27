import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Switch,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../theme/theme';
import { useNavigation } from '../navigation/NavigationContext';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

const ALERTS_HISTORY = [
  {
    id: 1,
    gate: 'Chromepet Crossing (LC-22)',
    time: '2 mins ago',
    message: 'Gate closed due to Chennai Beach Local arrival.',
    type: 'CLOSE',
    icon: 'lock',
    color: COLORS.accent,
  },
  {
    id: 2,
    gate: 'Chromepet Crossing (LC-22)',
    time: '15 mins ago',
    message: 'Gate opened. Road traffic clearing.',
    type: 'OPEN',
    icon: 'lock-open',
    color: COLORS.success,
  },
  {
    id: 3,
    gate: 'Pallavaram Crossing (LC-23)',
    time: '45 mins ago',
    message: 'Gate closed due to Superfast Express passage.',
    type: 'CLOSE',
    icon: 'lock',
    color: COLORS.accent,
  },
  {
    id: 4,
    gate: 'Tambaram Crossing (LC-21)',
    time: '1 hour ago',
    message: 'Gate opened. Safe to cross.',
    type: 'OPEN',
    icon: 'lock-open',
    color: COLORS.success,
  },
];

export default function AlertsScreen() {
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

  const [smartAlerts, setSmartAlerts] = useState(true);
  const [voiceAlerts, setVoiceAlerts] = useState(false);
  const [nearbyGatesOnly, setNearbyGatesOnly] = useState(true);
  const [alerts, setAlerts] = useState(ALERTS_HISTORY);

  // Clear all logs
  const handleClearAll = () => {
    setAlerts([]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Smart Configuration */}
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Alert Configuration</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.settingRow, { borderBottomColor: theme.itemBorder }]}>
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>Proximity Notifications</Text>
              <Text style={[styles.settingDesc, { color: theme.textSecondary }]}>Notify me 5 mins before a gate on my route closes</Text>
            </View>
            <Switch
              value={smartAlerts}
              onValueChange={setSmartAlerts}
              trackColor={{ false: '#E2E8F0', true: '#7C3AED' }}
              thumbColor="#fff"
            />
          </View>

          <View style={[styles.settingRow, { borderBottomColor: theme.itemBorder }]}>
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>Voice Navigation Alerts</Text>
              <Text style={[styles.settingDesc, { color: theme.textSecondary }]}>Announce gate statuses over voice while driving</Text>
            </View>
            <Switch
              value={voiceAlerts}
              onValueChange={setVoiceAlerts}
              trackColor={{ false: '#E2E8F0', true: '#7C3AED' }}
              thumbColor="#fff"
            />
          </View>

          <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>Nearby Gates Only</Text>
              <Text style={[styles.settingDesc, { color: theme.textSecondary }]}>Only send alerts for gates within 5 km of my current location</Text>
            </View>
            <Switch
              value={nearbyGatesOnly}
              onValueChange={setNearbyGatesOnly}
              trackColor={{ false: '#E2E8F0', true: '#7C3AED' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Dynamic Alerts Logs */}
        <View style={styles.logHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Recent Updates & Logs</Text>
          <TouchableOpacity onPress={handleClearAll}>
            <Text style={styles.clearText}>Clear All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.logsContainer}>
          {alerts.length === 0 ? (
            <View style={[styles.emptyContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <MaterialIcons name="notifications-none" size={48} color={theme.textSecondary} style={{ marginBottom: 12 }} />
              <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No Alerts</Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>There are no recent updates or logs to show.</Text>
            </View>
          ) : (
            alerts.map((item) => (
              <View key={item.id} style={[styles.logCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={[styles.iconBox, { backgroundColor: item.color + '15' }]}>
                  <MaterialIcons name={item.icon} size={20} color={item.color} />
                </View>
                <View style={styles.logTextContainer}>
                  <View style={styles.logTopRow}>
                    <Text style={[styles.logGate, { color: theme.textPrimary }]}>{item.gate}</Text>
                    <Text style={[styles.logTime, { color: theme.textMuted }]}>{item.time}</Text>
                  </View>
                  <Text style={[styles.logMsg, { color: theme.textSecondary }]}>{item.message}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC', // Light theme background
  },
  scrollContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748B',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 28,
    ...SHADOWS.sm,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  settingTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  settingDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clearText: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  logsContainer: {
    marginBottom: 20,
  },
  logCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  logTextContainer: {
    flex: 1,
  },
  logTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  logGate: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  logTime: {
    fontSize: 11,
    color: '#94A3B8',
  },
  logMsg: {
    fontSize: 13,
    color: '#64748B',
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 10,
    ...SHADOWS.sm,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
});
