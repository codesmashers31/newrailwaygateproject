import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Animated,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { api } from '../services/api';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../theme/theme';
import { useNavigation } from '../navigation/NavigationContext';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const GATE_DATA = {
  'lc-22': {
    id: 'lc-22',
    name: 'Chromepet Crossing (LC-22)',
    location: '0.8 km away • Tambaram Main Rd',
    status: 'CLOSED',
    statusDesc: 'Closed for Beach Express passing',
    timerText: '04:15',
    trainName: 'Chennai Beach Express (#16102)',
    trainSpeed: '42 km/h',
    trainDistance: '1.2 km away',
    avgWait: '5m 45s',
    dailyClosures: '24 times',
    alternatives: [
      { name: 'Chromepet Flyover Route', detour: '+2 mins detour', time: '8m total' },
      { name: 'MIT Subway Route', detour: '+4 mins detour', time: '10m total' },
    ],
  },
  'lc-21': {
    id: 'lc-21',
    name: 'Tambaram Crossing (LC-21)',
    location: '2.3 km away • Velachery High Rd',
    status: 'OPEN',
    statusDesc: 'Open for road traffic',
    timerText: 'Open',
    trainName: 'No trains in proximity',
    trainSpeed: '0 km/h',
    trainDistance: 'N/A',
    avgWait: '4m 30s',
    dailyClosures: '18 times',
    alternatives: [],
  },
  'lc-23': {
    id: 'lc-23',
    name: 'Pallavaram Crossing (LC-23)',
    location: '3.5 km away • Station Rd',
    status: 'WARNING',
    statusDesc: 'Closing in 2 minutes',
    timerText: '02:10',
    trainName: 'Chengalpattu Fast Local (#16892)',
    trainSpeed: '35 km/h',
    trainDistance: '0.6 km away',
    avgWait: '6m 12s',
    dailyClosures: '20 times',
    alternatives: [
      { name: 'Pallavaram Flyover', detour: '+1 min detour', time: '6m total' },
    ],
  },
};

export default function GateDetailsScreen() {
  const { params, goBack } = useNavigation();
  const gateId = params.gateId;

  const [gateDetails, setGateDetails] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alertMinutes, setAlertMinutes] = useState(5);
  const [alertEnabled, setAlertEnabled] = useState(true);
  const trainAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let active = true;
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const [detailsResponse, historyResponse] = await Promise.all([
          api.gates.getById(gateId),
          api.gates.getHistory(gateId),
        ]);
        if (detailsResponse.data.success && active) {
          setGateDetails(detailsResponse.data.data);
        }
        if (historyResponse.data.success && active) {
          setHistory(historyResponse.data.data);
        }
      } catch (err) {
        console.warn('Failed to fetch gate details:', err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchDetails();

    // Polling status
    const interval = setInterval(async () => {
      try {
        const statusRes = await api.gates.getCurrentStatus(gateId);
        if (statusRes.data.success && active) {
          setGateDetails(prev => prev ? {
            ...prev,
            currentStatus: statusRes.data.data.currentStatus,
            lastStatusChangedAt: statusRes.data.data.lastStatusChangedAt,
            lastOpenedAt: statusRes.data.data.lastOpenedAt,
            lastClosedAt: statusRes.data.data.lastClosedAt,
          } : null);
        }
      } catch (err) {
        console.warn('Status poll failed:', err);
      }
    }, 15000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [gateId]);

  const data = gateDetails ? {
    id: gateDetails._id,
    name: gateDetails.gateName,
    location: gateDetails.address || 'Local Road',
    status: gateDetails.currentStatus,
    statusDesc: gateDetails.lastStatusChangedAt
      ? `${gateDetails.currentStatus === 'OPEN' ? 'Open for road traffic' : 'Closed for train passing'}\nUpdated: ${new Date(gateDetails.lastStatusChangedAt).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })}`
      : gateDetails.currentStatus === 'OPEN' 
      ? 'Open for road traffic' 
      : gateDetails.currentStatus === 'CLOSED' 
      ? 'Closed for train passing' 
      : 'Status unknown',
    timerText: gateDetails.lastStatusChangedAt
      ? new Date(gateDetails.lastStatusChangedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
      : gateDetails.currentStatus === 'OPEN' ? 'Open' : 'Closed',
    trainName: gateDetails.currentDevice?.deviceCode
      ? `Sensor ${gateDetails.currentDevice.deviceCode} is reporting`
      : 'No linked sensor telemetry',
    trainSpeed: 'Live status',
    trainDistance: 'Not available',
    avgWait: 'Not available',
    dailyClosures: `${history.length} recent events`,
    alternatives: [],
  } : null;

  useEffect(() => {
    if (data?.status !== 'OPEN') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(trainAnim, {
            toValue: 1,
            duration: 8000,
            useNativeDriver: false,
          }),
          Animated.timing(trainAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: false,
          }),
        ])
      ).start();
    }
  }, [data?.status, trainAnim]);

  const handleAlertToggle = async () => {
    const nextValue = !alertEnabled;
    setAlertEnabled(nextValue);

    try {
      if (nextValue) {
        await api.users.enableNotifications();
      } else {
        await api.users.disableNotifications();
      }
    } catch (error) {
      setAlertEnabled(!nextValue);
      console.warn('Failed to update notification preference:', error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' }]}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={{ marginTop: 12, color: '#64748B', fontWeight: '600' }}>Loading crossing details...</Text>
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' }]}>
        <Text style={{ color: '#64748B', fontWeight: '600' }}>Gate details are not available.</Text>
      </SafeAreaView>
    );
  }

  const trainPositionLeft = trainAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '90%'],
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={goBack}>
          <MaterialIcons name="arrow-back-ios" size={20} color="#0F172A" />
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Crossing Details</Text>
        <TouchableOpacity style={styles.bellBtn} onPress={handleAlertToggle}>
          <MaterialIcons
            name={alertEnabled ? 'notifications-active' : 'notifications-none'}
            size={22}
            color={alertEnabled ? '#7C3AED' : '#0F172A'}
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Gate Name Card */}
        <View style={styles.nameCard}>
          <Text style={styles.gateName}>{data.name}</Text>
          <Text style={styles.gateLocation}>{data.location}</Text>
        </View>

        {/* Circular Countdown Timer */}
        <View style={styles.timerContainer}>
          <View
            style={[
              styles.outerCircle,
              {
                borderColor:
                  data.status === 'OPEN'
                    ? COLORS.success
                    : data.status === 'CLOSED'
                    ? COLORS.accent
                    : COLORS.warning,
              },
            ]}
          >
            <View style={styles.innerCircle}>
              <Text style={styles.timerStatus}>{data.status}</Text>
              <Text style={styles.timerCount}>{data.timerText}</Text>
              <Text style={styles.timerSub}>{data.statusDesc}</Text>
            </View>
            {/* Indicator Light */}
            {data.status !== 'OPEN' && (
              <View
                style={[
                  styles.blinkingIndicator,
                  { backgroundColor: data.status === 'CLOSED' ? COLORS.accent : COLORS.warning },
                ]}
              />
            )}
          </View>
        </View>

        {/* Dynamic Admin/Testing Quick Action to Toggle Gate Status */}
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: data.status === 'OPEN' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
              borderColor: data.status === 'OPEN' ? '#EF4444' : '#10B981',
              borderWidth: 1.5,
              borderRadius: 20,
              paddingVertical: 10,
              paddingHorizontal: 20,
            }}
            onPress={async () => {
              const nextStatus = data.status === 'OPEN' ? 'CLOSED' : 'OPEN';
              try {
                setLoading(true);
                const response = await api.gates.updateStatus(gateId, nextStatus);
                if (response.data.success) {
                  // Re-fetch the gate details and history
                  const [detailsResponse, historyResponse] = await Promise.all([
                    api.gates.getById(gateId),
                    api.gates.getHistory(gateId),
                  ]);
                  if (detailsResponse.data.success) {
                    setGateDetails(detailsResponse.data.data);
                  }
                  if (historyResponse.data.success) {
                    setHistory(historyResponse.data.data);
                  }
                }
              } catch (error) {
                console.warn('Failed to toggle gate status:', error);
                Alert.alert('Update Failed', error.response?.data?.message || 'Could not toggle gate status.');
              } finally {
                setLoading(false);
              }
            }}
          >
            <MaterialIcons
              name={data.status === 'OPEN' ? 'lock' : 'lock-open'}
              size={18}
              color={data.status === 'OPEN' ? '#EF4444' : '#10B981'}
              style={{ marginRight: 8 }}
            />
            <Text style={{ color: data.status === 'OPEN' ? '#EF4444' : '#10B981', fontWeight: 'bold', fontSize: 14 }}>
              Quick Action: {data.status === 'OPEN' ? 'Close Gate' : 'Open Gate'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Train Tracking Visualizer */}
        {data.status !== 'OPEN' && (
          <View style={styles.trackerCard}>
            <Text style={styles.trackerTitle}>Live Train Tracking</Text>
            <View style={styles.trackContainer}>
              {/* Rails */}
              <View style={styles.railwayTrack}>
                <View style={styles.sleeperLine} />
                <View style={styles.sleeperLine} />
                <View style={styles.sleeperLine} />
                <View style={styles.sleeperLine} />
                <View style={styles.sleeperLine} />
                <View style={styles.sleeperLine} />
                <View style={styles.sleeperLine} />
                <View style={styles.sleeperLine} />
              </View>

              {/* Crossing bar (centered) */}
              <View style={styles.crossingGateIndicator}>
                <View style={styles.crossingGatePost} />
                <View style={styles.crossingGateBar} />
              </View>

              {/* Animated Train */}
              <Animated.View style={[styles.trainWrapper, { left: trainPositionLeft }]}>
                <FontAwesome5 name="train" size={20} color="#7C3AED" style={styles.trainIcon} />
                <Text style={styles.trainSpeedLabel}>{data.trainSpeed}</Text>
              </Animated.View>
            </View>

            <View style={styles.trainInfoRow}>
              <View>
                <Text style={styles.infoLabel}>INCOMING TRAIN</Text>
                <Text style={styles.infoValue}>{data.trainName}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.infoLabel}>DISTANCE</Text>
                <Text style={styles.infoValue}>{data.trainDistance}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Smart Alert Manager */}
        <View style={styles.alertsCard}>
          <Text style={styles.cardTitle}>Set Crossing Warning</Text>
          <Text style={styles.cardSubtitle}>Get alert before gate closes so you don't get trapped</Text>

          <View style={styles.optionsRow}>
            {[2, 5, 10].map((min) => (
              <TouchableOpacity
                key={min}
                style={[
                  styles.optionButton,
                  alertEnabled && alertMinutes === min && styles.optionButtonActive,
                ]}
                onPress={() => {
                  setAlertMinutes(min);
                  setAlertEnabled(true);
                }}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    alertEnabled && alertMinutes === min && styles.optionButtonTextActive,
                  ]}
                >
                  {min} Min Before
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.alertConfigToggle, alertEnabled && styles.alertConfigToggleActive]}
            onPress={handleAlertToggle}
          >
            <MaterialIcons
              name={alertEnabled ? 'notifications-active' : 'notifications-off'}
              size={18}
              color="#fff"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.alertConfigToggleText}>
              {alertEnabled ? 'Smart Alert Enabled' : 'Enable Smart Notification'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Crossing Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.cardTitle}>Crossing Historical Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>AVG. CLOSE TIME</Text>
              <Text style={styles.statValue}>{data.avgWait}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>DAILY CLOSURES</Text>
              <Text style={styles.statValue}>{data.dailyClosures}</Text>
            </View>
          </View>
        </View>

        {/* Alternatives Card */}
        {data.alternatives && data.alternatives.length > 0 && (
          <View style={styles.alternativesCard}>
            <Text style={styles.cardTitle}>Recommended Detour Routes</Text>
            <Text style={styles.cardSubtitle}>Avoid waiting at this crossing using local flyovers</Text>

            {data.alternatives.map((alt, idx) => (
              <View key={idx} style={styles.alternativeItem}>
                <View>
                  <Text style={styles.altName}>{alt.name}</Text>
                  <Text style={styles.altDetour}>{alt.detour}</Text>
                </View>
                <View style={styles.altRight}>
                  <Text style={styles.altTime}>{alt.time}</Text>
                  <MaterialIcons name="navigation" size={16} color="#7C3AED" style={{ marginLeft: 8 }} />
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingRight: 12,
  },
  backBtnText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  bellBtn: {
    padding: 6,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  nameCard: {
    marginBottom: 20,
  },
  gateName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  gateLocation: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  timerContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  outerCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    position: 'relative',
    ...SHADOWS.sm,
  },
  innerCircle: {
    width: 176,
    height: 176,
    borderRadius: 88,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
  },
  timerStatus: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
    color: '#64748B',
    textTransform: 'uppercase',
  },
  timerCount: {
    fontSize: 40,
    fontWeight: '800',
    color: '#0F172A',
    marginVertical: 4,
  },
  timerSub: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
  },
  blinkingIndicator: {
    position: 'absolute',
    top: 10,
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  trackerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
    ...SHADOWS.sm,
  },
  trackerTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 16,
  },
  trackContainer: {
    height: 60,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    position: 'relative',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  railwayTrack: {
    height: 6,
    backgroundColor: '#94A3B8',
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  sleeperLine: {
    width: 2,
    height: 16,
    backgroundColor: '#94A3B8',
  },
  crossingGateIndicator: {
    position: 'absolute',
    left: '50%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  crossingGatePost: {
    width: 8,
    height: 36,
    backgroundColor: '#64748B',
    borderRadius: 2,
  },
  crossingGateBar: {
    position: 'absolute',
    top: 10,
    left: -4,
    width: 28,
    height: 4,
    backgroundColor: COLORS.accent,
    transform: [{ rotate: '-45deg' }],
  },
  trainWrapper: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 10,
  },
  trainIcon: {
    backgroundColor: '#FFFFFF',
    padding: 4,
    borderRadius: 6,
    borderWidth: 1.2,
    borderColor: '#7C3AED',
  },
  trainSpeedLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#7C3AED',
    marginTop: 2,
  },
  trainInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  infoLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#94A3B8',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0F172A',
    marginTop: 2,
  },
  alertsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
    ...SHADOWS.sm,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 16,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  optionButton: {
    flex: 1,
    height: 42,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  optionButtonActive: {
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
    borderColor: '#7C3AED',
  },
  optionButtonText: {
    color: '#64748B',
    fontWeight: '600',
    fontSize: 12,
  },
  optionButtonTextActive: {
    color: '#7C3AED',
  },
  alertConfigToggle: {
    flexDirection: 'row',
    height: 46,
    backgroundColor: '#94A3B8',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  alertConfigToggleActive: {
    backgroundColor: '#7C3AED',
  },
  alertConfigToggleText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
    ...SHADOWS.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    marginTop: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#94A3B8',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    marginTop: 4,
  },
  alternativesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    ...SHADOWS.sm,
  },
  alternativeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  altName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  altDetour: {
    fontSize: 11,
    color: COLORS.accent,
    marginTop: 2,
  },
  altRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  altTime: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.success,
  },
});
