import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../theme/theme';
import { useNavigation } from '../navigation/NavigationContext';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { api } from '../services/api';

const { width } = Dimensions.get('window');

const STATION_SUGGESTIONS = [
  'Tambaram',
  'Chromepet',
  'Pallavaram',
  'Tirusulam',
  'Minambakkam',
  'Palavanthangal',
  'St. Thomas Mount',
  'Guindy',
];

const ROUTE_RESULTS = {
  'Tambaram-Chromepet': [
    {
      id: 'lc-21',
      name: 'Tambaram North (LC-21)',
      status: 'OPEN',
      distance: '0.5 km from start',
      waitingTime: 'Open',
      nextTrain: 'No trains',
      color: COLORS.success,
    },
    {
      id: 'lc-22',
      name: 'Chromepet South (LC-22)',
      status: 'CLOSED',
      distance: '2.8 km from start',
      waitingTime: '4m 15s remaining',
      nextTrain: 'Chennai Beach Express in 1m',
      color: COLORS.accent,
    },
  ],
  'Tambaram-Guindy': [
    {
      id: 'lc-21',
      name: 'Tambaram North (LC-21)',
      status: 'OPEN',
      distance: '0.5 km',
      waitingTime: 'Open',
      nextTrain: 'No trains',
      color: COLORS.success,
    },
    {
      id: 'lc-22',
      name: 'Chromepet South (LC-22)',
      status: 'CLOSED',
      distance: '2.8 km',
      waitingTime: '4m 15s remaining',
      nextTrain: 'Chennai Beach Express',
      color: COLORS.accent,
    },
    {
      id: 'lc-23',
      name: 'Pallavaram Crossing (LC-23)',
      status: 'WARNING',
      distance: '4.2 km',
      waitingTime: 'Closing in 2m',
      nextTrain: 'Chengalpattu Fast Local',
      color: COLORS.warning,
    },
    {
      id: 'lc-24',
      name: 'Guindy Gate (LC-24)',
      status: 'OPEN',
      distance: '8.5 km',
      waitingTime: 'Open',
      nextTrain: 'No trains',
      color: COLORS.success,
    },
  ],
};

export default function SearchScreen() {
  const { navigate } = useNavigation();
  const [source, setSource] = useState('Tambaram');
  const [destination, setDestination] = useState('Chromepet');
  const [activeInput, setActiveInput] = useState(null); // 'source' or 'destination'
  const [searched, setSearched] = useState(true);
  const [gates, setGates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGates = async () => {
      try {
        const response = await api.gates.list();
        if (response.data?.success) {
          setGates(response.data.data);
        }
      } catch (error) {
        console.warn('Failed to load live gates:', error);
      } finally {
        setLoading(false);
      }
    };

    loadGates();
  }, []);

  const searchTerms = [source, destination]
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  const routeResults = gates
    .filter((gate) => {
      if (searchTerms.length === 0) return true;
      const gateText = [gate.gateName, gate.gateCode, gate.address, gate.city, gate.state]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchTerms.some((term) => gateText.includes(term));
    })
    .map((gate) => ({
      id: gate._id,
      name: gate.gateName,
      status: gate.currentStatus || 'UNKNOWN',
      distance: [gate.address, gate.city].filter(Boolean).join(', ') || gate.gateCode,
      waitingTime: gate.currentStatus === 'OPEN' ? 'Open for road traffic' : 'Live status update',
      nextTrain: gate.currentDevice?.deviceCode
        ? `Sensor ${gate.currentDevice.deviceCode} reporting`
        : 'No active sensor details',
      color: gate.currentStatus === 'OPEN'
        ? COLORS.success
        : gate.currentStatus === 'CLOSED'
        ? COLORS.accent
        : COLORS.warning,
    }));

  const selectStation = (station) => {
    if (activeInput === 'source') {
      setSource(station);
    } else if (activeInput === 'destination') {
      setDestination(station);
    }
    setActiveInput(null);
  };

  const handleSwap = () => {
    const temp = source;
    setSource(destination);
    setDestination(temp);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchHeader}>
        {/* Form */}
        <View style={styles.searchFormCard}>
          <View style={styles.inputContainer}>
            <View style={[styles.inputDot, { backgroundColor: '#7C3AED' }]} />
            <TextInput
              style={styles.textInput}
              value={source}
              onChangeText={(text) => {
                setSource(text);
                setSearched(false);
              }}
              placeholder="Enter Source Station"
              placeholderTextColor="#94A3B8"
              onFocus={() => setActiveInput('source')}
            />
            {source ? (
              <TouchableOpacity onPress={() => setSource('')}>
                <MaterialIcons name="cancel" size={16} color="#94A3B8" />
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.formDividerRow}>
            <View style={styles.dashedLine} />
            <TouchableOpacity style={styles.swapBtn} onPress={handleSwap}>
              <MaterialIcons name="swap-vert" size={20} color="#7C3AED" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <View style={[styles.inputDot, { backgroundColor: '#EF4444' }]} />
            <TextInput
              style={styles.textInput}
              value={destination}
              onChangeText={(text) => {
                setDestination(text);
                setSearched(false);
              }}
              placeholder="Enter Destination Station"
              placeholderTextColor="#94A3B8"
              onFocus={() => setActiveInput('destination')}
            />
            {destination ? (
              <TouchableOpacity onPress={() => setDestination('')}>
                <MaterialIcons name="cancel" size={16} color="#94A3B8" />
              </TouchableOpacity>
            ) : null}
          </View>

          <TouchableOpacity style={styles.searchBtn} onPress={() => setSearched(true)}>
            <Text style={styles.searchBtnText}>Analyze Crossings on Route</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Suggestion list overlay if input active */}
      {activeInput && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>Suggested Stations</Text>
          <ScrollView keyboardShouldPersistTaps="handled">
            {STATION_SUGGESTIONS.filter((s) =>
              s.toLowerCase().includes((activeInput === 'source' ? source : destination).toLowerCase())
            ).map((station) => (
              <TouchableOpacity
                key={station}
                style={styles.suggestionItem}
                onPress={() => selectStation(station)}
              >
                <MaterialIcons name="train" size={16} color="#64748B" style={{ marginRight: 12 }} />
                <Text style={styles.suggestionText}>{station}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Search results */}
      {searched && !activeInput && (
        <ScrollView contentContainerStyle={styles.resultsScroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.resultTitle}>Route Summary</Text>
          <Text style={styles.resultSubtitle}>Live status for registered level crossings matching {source || 'your search'} and {destination || 'your search'}.</Text>

          {loading ? (
            <ActivityIndicator color="#7C3AED" style={{ marginTop: 28 }} />
          ) : routeResults.length === 0 ? (
            <View style={styles.timelineCard}>
              <Text style={styles.gateDetailsText}>No live gates match this search. Try a gate name, code, city, or state.</Text>
            </View>
          ) : (
            <View style={styles.timelineCard}>
              <View style={styles.timelineList}>
                {routeResults.map((gate, index) => (
                <View key={gate.id} style={styles.timelineItem}>
                  {/* Left Column: Icon/Line */}
                  <View style={styles.timelineLineContainer}>
                    <View
                      style={[
                        styles.timelineNode,
                        { borderColor: gate.color, backgroundColor: gate.status === 'CLOSED' ? gate.color : '#FFFFFF' },
                      ]}
                    >
                      <FontAwesome5
                        name={gate.status === 'CLOSED' ? 'lock' : 'lock-open'}
                        size={10}
                        color={gate.status === 'CLOSED' ? '#fff' : gate.color}
                      />
                    </View>
                    {index < routeResults.length - 1 && <View style={styles.timelineVerticalLine} />}
                  </View>

                  {/* Right Column: Gate Status Content */}
                  <TouchableOpacity
                    style={styles.timelineContentCard}
                    onPress={() => navigate('GATE_DETAILS', { gateId: gate.id })}
                  >
                    <View style={styles.timelineCardHeader}>
                      <Text style={styles.gateName}>{gate.name}</Text>
                      <View
                        style={[
                          styles.statusTextBadge,
                          {
                            backgroundColor:
                              gate.status === 'OPEN'
                                ? 'rgba(16, 185, 129, 0.1)'
                                : gate.status === 'CLOSED'
                                ? 'rgba(239, 68, 68, 0.1)'
                                : 'rgba(245, 158, 11, 0.1)',
                          },
                        ]}
                      >
                        <Text style={[styles.statusText, { color: gate.color }]}>{gate.status}</Text>
                      </View>
                    </View>

                    <Text style={styles.gateDetailsText}>{gate.distance}</Text>

                    <View style={styles.gateFooter}>
                      <View style={styles.gateTimeRow}>
                        <MaterialIcons name="schedule" size={14} color="#64748B" />
                        <Text style={[styles.gateTimeText, { color: gate.color }]}> {gate.waitingTime}</Text>
                      </View>
                      <View style={styles.trainRow}>
                        <MaterialIcons name="train" size={14} color="#94A3B8" />
                        <Text style={styles.trainText}> {gate.nextTrain}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC', // Light Theme Background
  },
  searchHeader: {
    padding: 20,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  searchFormCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
  },
  inputDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    color: '#0F172A',
    fontSize: 14,
    height: '100%',
  },
  formDividerRow: {
    height: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  dashedLine: {
    width: 2,
    height: '100%',
    backgroundColor: '#E2E8F0',
    borderStyle: 'dashed',
    marginLeft: 1,
  },
  swapBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBtn: {
    backgroundColor: '#7C3AED',
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    ...SHADOWS.sm,
  },
  searchBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 180,
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    maxHeight: 250,
    zIndex: 100,
    padding: 12,
    ...SHADOWS.md,
  },
  suggestionsTitle: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  suggestionText: {
    color: '#0F172A',
    fontSize: 14,
  },
  resultsScroll: {
    padding: 20,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  resultSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 16,
  },
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.sm,
  },
  timelineList: {
    marginTop: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineLineContainer: {
    alignItems: 'center',
    marginRight: 16,
  },
  timelineNode: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  timelineVerticalLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginTop: 4,
  },
  timelineContentCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
  },
  timelineCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gateName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
    flex: 1,
    marginRight: 8,
    flexWrap: 'wrap',
  },
  statusTextBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  gateDetailsText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  gateFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
    gap: 6,
  },
  gateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    marginRight: 6,
  },
  gateTimeText: {
    fontSize: 12,
    fontWeight: 'bold',
    flexShrink: 1,
  },
  trainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  trainText: {
    fontSize: 12,
    color: '#64748B',
    flexShrink: 1,
  },
});
