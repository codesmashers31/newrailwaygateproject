import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Image,
  TextInput,
  ActivityIndicator,
  Platform,
  RefreshControl,
  Alert,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../theme/theme';
import { useNavigation } from '../navigation/NavigationContext';
import { MaterialIcons, FontAwesome5, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { api } from '../services/api';

// Dynamically import WebView for native platforms to prevent crash on web
let WebView = null;
if (Platform.OS !== 'web') {
  try {
    WebView = require('react-native-webview').WebView;
  } catch (e) {
    console.warn('WebView could not be loaded:', e);
  }
}

const { width, height } = Dimensions.get('window');

// Responsive dimension variables
const TRACK_WIDTH = Math.min(width - 40, 420);

// Advertisement slide banners
const AD_SLIDES = [
  {
    id: 1,
    title: 'Upgrade to Premium',
    desc: 'Get ad-free navigation and priority voice alerts.',
    colors: ['#6366F1', '#4F46E5'],
    icon: 'star',
    actionText: 'Go Premium',
  },
  {
    id: 2,
    title: 'Safety First',
    desc: 'Never cross a closed gate arm. Stay safe, wait for green.',
    colors: ['#EF4444', '#DC2626'],
    icon: 'warning',
    actionText: 'Read Safety Rules',
  },
  {
    id: 3,
    title: 'IoT Sensor LC-22 Online',
    desc: 'New high-precision telemetry sensors added at Chromepet.',
    colors: ['#0D9488', '#0F766E'],
    icon: 'settings-input-antenna',
    actionText: 'View Details',
  },
  {
    id: 4,
    title: 'Share Gate Status',
    desc: 'Help friends avoid level crossing delays. Share app now!',
    colors: ['#F59E0B', '#D97706'],
    icon: 'share',
    actionText: 'Share App',
  },
  {
    id: 5,
    title: 'Monsoon delays active',
    desc: 'Expect extra gate wait times during heavy rain alerts.',
    colors: ['#2563EB', '#1D4ED8'],
    icon: 'cloud-queue',
    actionText: 'Check Alerts',
  },
];

// Mock database of all level crossing gates with coordinates
const ALL_GATES = [
  {
    id: 'lc-21',
    name: 'Tambaram Crossing (LC-21)',
    status: 'OPEN',
    statusDesc: 'Open for road traffic',
    timerText: 'Open',
    trainName: 'No trains in proximity',
    trainSpeed: '0 km/h',
    trainDistance: 'N/A',
    avgWait: '4m 30s',
    dailyClosures: '18 times',
    latitude: 12.9275,
    longitude: 80.1215,
    location: 'Tambaram Main Rd',
    color: '#10B981', // COLORS.success
  },
  {
    id: 'lc-22',
    name: 'Chromepet Crossing (LC-22)',
    status: 'CLOSED',
    statusDesc: 'Closed for Beach Express passing',
    timerText: '04:15',
    trainName: 'Chennai Beach Express (#16102)',
    trainSpeed: '42 km/h',
    trainDistance: '1.2 km away',
    avgWait: '5m 45s',
    dailyClosures: '24 times',
    latitude: 12.9150,
    longitude: 80.1180,
    location: 'MIT Subway Rd',
    color: '#EF4444', // COLORS.accent
  },
  {
    id: 'lc-23',
    name: 'Pallavaram Crossing (LC-23)',
    status: 'WARNING',
    statusDesc: 'Closing in 2 minutes',
    timerText: '02:10',
    trainName: 'Chengalpattu Fast Local (#16892)',
    trainSpeed: '35 km/h',
    trainDistance: '0.6 km away',
    avgWait: '6m 12s',
    dailyClosures: '20 times',
    latitude: 12.9430,
    longitude: 80.1340,
    location: 'Station Rd',
    color: '#F59E0B', // COLORS.warning
  },
  {
    id: 'lc-24',
    name: 'Guindy Gate (LC-24)',
    status: 'OPEN',
    statusDesc: 'Open for road traffic',
    timerText: 'Open',
    trainName: 'No trains in proximity',
    trainSpeed: '0 km/h',
    trainDistance: 'N/A',
    avgWait: '5m 00s',
    dailyClosures: '22 times',
    latitude: 12.9800,
    longitude: 80.1800,
    location: 'Guindy National Park Rd',
    color: '#10B981', // COLORS.success
  },
];

// Distance calculation using Haversine formula
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Format distance value nicely
const formatDistance = (dist) => {
  if (dist < 1) {
    return `${(dist * 1000).toFixed(0)} m away`;
  }
  return `${dist.toFixed(1)} km away`;
};

// Map status to color
const getGateColor = (status) => {
  if (status === 'OPEN') return '#10B981';
  if (status === 'CLOSED') return '#EF4444';
  return '#F59E0B'; // WARNING or UNKNOWN
};

export default function DashboardScreen({ onNotificationPress }) {
  const { isDarkMode, navigate } = useNavigation();

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

  const [activeAd, setActiveAd] = useState(0);
  const webViewRef = useRef(null);

  // API Gate lists and refreshing states
  const [gatesList, setGatesList] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('Rahul Sharma');
  const [favouriteGateIds, setFavouriteGateIds] = useState([]);
  const [loadingGates, setLoadingGates] = useState(true);
  const [isFetchingGates, setIsFetchingGates] = useState(false);

  const fetchProfile = async () => {
    try {
      const response = await api.users.getProfile();
      if (response.data.success) {
        const user = response.data.data;
        const favouriteIds = (user.favouriteGates || []).map((gate) => gate._id || gate);
        setUserName(user.name || 'User');
        setFavouriteGateIds(favouriteIds);
        setDefaultGateId(favouriteIds[0] || null);
      }
    } catch (error) {
      console.warn('Failed to fetch profile in dashboard:', error);
    }
  };

  const fetchGates = async (silent = false) => {
    if (!silent) setLoadingGates(true);
    setIsFetchingGates(true);
    try {
      const response = await api.gates.list();
      if (response.data.success) {
        setGatesList(response.data.data);
      }
    } catch (error) {
      console.warn('Failed to fetch gates:', error);
    } finally {
      setLoadingGates(false);
      setIsFetchingGates(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchGates(true), fetchProfile()]);
    setRefreshing(false);
  };

  const handleToggleGateStatus = async (gateId, currentStatus) => {
    const nextStatus = currentStatus === 'OPEN' ? 'CLOSED' : 'OPEN';
    try {
      const response = await api.gates.updateStatus(gateId, nextStatus);
      if (response.data.success) {
        await fetchGates(true);
      }
    } catch (error) {
      console.warn('Failed to toggle gate status:', error);
      Alert.alert('Status Update Failed', error.response?.data?.message || 'Could not update gate status.');
    }
  };

  useEffect(() => {
    fetchGates(false);
    fetchProfile();
    const interval = setInterval(() => fetchGates(true), 3000); // Check for updates every 3 seconds

    return () => clearInterval(interval);
  }, []);

  // Map & Location states
  const [locationPermission, setLocationPermission] = useState(null);
  const [address, setAddress] = useState('Fetching location...');
  const [coords, setCoords] = useState({ latitude: 12.9249, longitude: 80.1245 }); // Default Tambaram
  const [mapQuery, setMapQuery] = useState('Tambaram Station');
  const [searchVal, setSearchVal] = useState('');
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [defaultGateId, setDefaultGateId] = useState(null);

  const handleSetDefaultGate = async (gateId) => {
    try {
      const updatedFavouriteIds = [
        gateId,
        ...favouriteGateIds.filter((favouriteGateId) => favouriteGateId !== gateId),
      ];
      await api.users.updateFavouriteGates(updatedFavouriteIds);
      setFavouriteGateIds(updatedFavouriteIds);
      setDefaultGateId(gateId);
    } catch (err) {
      console.warn('Failed to save favourite gate:', err);
    }
  };

  const handleChooseGate = (gateId) => {
    navigate('GATE_DETAILS', { gateId });
  };

  // Recent Locations search inputs list
  const [recentLocations, setRecentLocations] = useState([
    {
      id: 1,
      title: 'Voyage Software Technologies Private Li...',
      subtitle: '3rd Cross Street, Phase-2, Thirumalai Nagar Anne...',
      latitude: 12.9204,
      longitude: 80.1198,
      favorite: false,
    },
    {
      id: 2,
      title: 'Vijayanagaram medavakkam',
      subtitle: '2nd Main Road, Vijayanagaram, Santhosapuram, M...',
      latitude: 12.9095,
      longitude: 80.1652,
      favorite: false,
    },
    {
      id: 3,
      title: 'Tambaram Sanatorium Bus Stand',
      subtitle: 'Unnamed Road, Subramaniam Rail Nagar, Tambar...',
      latitude: 12.9328,
      longitude: 80.1287,
      favorite: false,
    },
  ]);

  // Carousel timer loop
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveAd((prev) => (prev + 1) % AD_SLIDES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Helper to dynamically reverse-geocode coordinates (supports Web via OSM Nominatim)
  const updateAddressFromCoords = async (latitude, longitude) => {
    try {
      if (Platform.OS !== 'web') {
        const response = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (response && response.length > 0) {
          const current = response[0];
          const name = current.name || '';
          const street = current.street || '';
          const district = current.district || current.city || '';
          const finalAddr = `${name ? name + ', ' : ''}${street ? street + ', ' : ''}${district}`;
          setAddress(finalAddr || 'Location detected');
        } else {
          setAddress('Location detected');
        }
      } else {
        // Fetch from OSM Nominatim API for web geocoding to resolve coordinates to address
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
        );
        const data = await response.json();
        if (data && data.address) {
          const addr = data.address;
          const road = addr.road || addr.suburb || addr.neighbourhood || '';
          const city = addr.city || addr.town || addr.village || '';
          const state = addr.state || '';
          const finalAddr = [road, city, state].filter(Boolean).join(', ');
          setAddress(finalAddr || data.display_name || 'Location detected');
        } else {
          setAddress('Balaji Nagar, Tambaram, Chennai (Web)');
        }
      }
    } catch (error) {
      console.warn('Reverse geocode failed:', error);
      setAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
    }
  };

  // Request Location permissions on mount
  useEffect(() => {
    const requestLocation = async () => {
      try {
        setLoadingLocation(true);
        const { status } = await Location.requestForegroundPermissionsAsync();
        setLocationPermission(status);

        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          const { latitude, longitude } = loc.coords;
          
          setCoords({ latitude, longitude });
          setMapQuery('Your Current Location');
          await updateAddressFromCoords(latitude, longitude);
        } else {
          // Fallback to coordinates from user screenshot
          setAddress('13, Roja Garden 2nd St, Balaji Nagar, Tamb... (Demo)');
          setCoords({ latitude: 12.9204, longitude: 80.1198 });
        }
      } catch (err) {
        console.warn('GPS tracking error:', err);
        setAddress('13, Roja Garden 2nd St, Balaji Nagar, Tamb... (Demo)');
        setCoords({ latitude: 12.9204, longitude: 80.1198 });
      } finally {
        setLoadingLocation(false);
      }
    };
    requestLocation();
  }, []);

  // Sync coords updates to the map inside the WebView/iframe dynamically
  useEffect(() => {
    const payload = JSON.stringify({
      type: 'UPDATE_COORDS',
      lat: coords.latitude,
      lng: coords.longitude,
      q: mapQuery,
    });

    if (Platform.OS === 'web') {
      if (webViewRef.current) {
        webViewRef.current.contentWindow?.postMessage(payload, '*');
      }
    } else {
      if (webViewRef.current) {
        webViewRef.current.postMessage(payload);
      }
    }
  }, [coords, mapQuery]);

  // Handle location item click in bottom sheet list
  const handleLocationSelect = (item) => {
    setSearchVal('');
    setCoords({ latitude: item.latitude, longitude: item.longitude });
    setMapQuery(item.title);
    setAddress(item.subtitle || item.title);
  };

  // Toggle favorite status
  const toggleFavorite = (id) => {
    setRecentLocations((prev) =>
      prev.map((loc) => (loc.id === id ? { ...loc, favorite: !loc.favorite } : loc))
    );
  };

  // Trigger locating check
  const handleRecenter = async () => {
    if (locationPermission === 'granted') {
      try {
        setLoadingLocation(true);
        let loc = null;
        try {
          loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
            timeout: 5000,
          });
        } catch (e) {
          console.warn('getCurrentPositionAsync failed, trying last known position:', e);
          try {
            loc = await Location.getLastKnownPositionAsync({});
          } catch (e2) {
            console.warn('getLastKnownPositionAsync failed too:', e2);
          }
        }

        if (loc) {
          const { latitude, longitude } = loc.coords;
          setCoords({ latitude, longitude });
          setMapQuery('Your Current Location');
          await updateAddressFromCoords(latitude, longitude);
        } else {
          // If both fail (common on emulators/offline), fallback to Tambaram coords
          setAddress('Tambaram, Chennai (Fallback Location)');
          setCoords({ latitude: 12.9204, longitude: 80.1198 });
        }
      } catch (err) {
        console.warn('Failed to recenter:', err);
        // Fallback to Tambaram coords
        setAddress('Tambaram, Chennai (Fallback Location)');
        setCoords({ latitude: 12.9204, longitude: 80.1198 });
      } finally {
        setLoadingLocation(false);
      }
    } else {
      // If no permission, fallback to Tambaram coords
      setAddress('Tambaram, Chennai (Fallback Location)');
      setCoords({ latitude: 12.9204, longitude: 80.1198 });
    }
  };

  // Interactive Leaflet wrapper using official Google Maps tileset
  const mapHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          html, body, #map {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            background-color: #F8FAFC;
          }
          /* Custom marker glow circle matching visual layout */
          .glow-pin {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background-color: #10B981;
            border: 3.5px solid #ffffff;
            box-shadow: 0 0 12px rgba(16, 185, 129, 0.9);
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          // Initialize Map
          const map = L.map('map', { 
            zoomControl: false, 
            attributionControl: false 
          }).setView([${coords.latitude}, ${coords.longitude}], 16);
          
          // Load Google Maps roadmap tiles directly for high-clarity street details
          L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
            maxZoom: 20
          }).addTo(map);

          const customIcon = L.divIcon({
            className: 'custom-div-icon',
            html: '<div class="glow-pin"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          });

          let marker = L.marker([${coords.latitude}, ${coords.longitude}], { icon: customIcon }).addTo(map);
          marker.bindPopup("<b>" + "${mapQuery}" + "</b>").openPopup();
          
          // Coordinate change listener
          window.addEventListener('message', (e) => {
            try {
              const data = JSON.parse(e.data);
              if (data.type === 'UPDATE_COORDS') {
                map.setView([data.lat, data.lng], 16);
                marker.setLatLng([data.lat, data.lng]);
                marker.bindPopup("<b>" + data.q + "</b>").openPopup();
              }
            } catch (err) {}
          });
        </script>
      </body>
    </html>
  `;

  // Filter recent locations list based on search value
  const filteredRecent = recentLocations.filter(item => 
    item.title.toLowerCase().includes(searchVal.toLowerCase()) ||
    item.subtitle.toLowerCase().includes(searchVal.toLowerCase())
  );

  // Compute nearby gates based on current coordinates, sorted by proximity
  const activeGates = gatesList;

  const nearbyGates = activeGates.map((gate) => {
    const dist = getDistance(coords.latitude, coords.longitude, gate.latitude, gate.longitude);
    
    // Format dynamic status update date & time directly from database
    let waitingTime = '';
    if (gate.lastStatusChangedAt) {
      const d = new Date(gate.lastStatusChangedAt);
      const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
      const day = d.getDate();
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthStr = monthNames[d.getMonth()];
      waitingTime = `${gate.currentStatus === 'OPEN' ? 'Open since' : 'Closed since'} ${timeStr} (${day} ${monthStr})`;
    } else {
      waitingTime = gate.currentStatus === 'OPEN' ? 'Open' : 'Closed';
    }

    const nextTrain = gate.currentDevice?.deviceCode 
      ? `Sensor: ${gate.currentDevice.deviceCode}` 
      : 'No telemetry linked';
    
    return {
      id: gate._id || gate.id,
      name: gate.gateName || gate.name,
      status: gate.currentStatus || gate.status || 'UNKNOWN',
      statusDesc: gate.currentStatus === 'OPEN' 
        ? 'Open for road traffic' 
        : gate.currentStatus === 'CLOSED' 
        ? 'Closed for train passing' 
        : (gate.statusDesc || 'Status unknown'),
      timerText: gate.currentStatus === 'OPEN' ? 'Open' : (gate.timerText || 'N/A'),
      trainName: nextTrain,
      trainSpeed: gate.trainSpeed || 'Live data',
      trainDistance: gate.trainDistance || 'N/A',
      avgWait: gate.avgWait || '5m 00s',
      dailyClosures: gate.dailyClosures || '20 times',
      latitude: gate.latitude,
      longitude: gate.longitude,
      location: gate.address || gate.location || 'Unknown Location',
      color: getGateColor(gate.currentStatus || gate.status),
      distanceVal: dist,
      waitingTime,
      nextTrain,
    };
  })
    .sort((a, b) => a.distanceVal - b.distanceVal); // Show all gates sorted by proximity

  const isSearching = searchVal && searchVal.trim() !== '' && searchVal.trim() !== 'Current Location';

  const filteredGates = isSearching
    ? nearbyGates.filter(gate => 
        gate.name.toLowerCase().includes(searchVal.trim().toLowerCase()) ||
        gate.location.toLowerCase().includes(searchVal.trim().toLowerCase())
      )
    : nearbyGates;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        
        {/* Header Section (Welcome with Username + Alert on Right) */}
        <View style={styles.headerRow}>
          <View style={styles.welcomeInfo}>
            <Text style={styles.welcomeText}>Welcome,</Text>
            <Text style={[styles.usernameText, { color: theme.textPrimary }]}>{userName}!</Text>
            
            <View style={[styles.brandRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.logoWrapper}>
                <Image
                  source={require('../../assets/logo.jpg')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.brandText}>TrainGateView</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.notificationBtn, { backgroundColor: theme.card, borderColor: theme.border }]} 
            activeOpacity={0.7}
            onPress={onNotificationPress}
          >
            <MaterialIcons name="notifications-none" size={26} color={isDarkMode ? '#FFFFFF' : '#1E293B'} />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>
 
         {/* Carousel slide banners */}
         <View style={styles.carouselContainer}>
           <LinearGradient
             colors={AD_SLIDES[activeAd].colors}
             start={{ x: 0, y: 0 }}
             end={{ x: 1, y: 1 }}
             style={styles.adCard}
           >
             <View style={styles.adContent}>
               <View style={styles.adTextSide}>
                 <Text style={styles.adTitle}>{AD_SLIDES[activeAd].title}</Text>
                 <Text style={styles.adDesc}>{AD_SLIDES[activeAd].desc}</Text>
                 <TouchableOpacity 
                   style={styles.adActionBtn}
                   onPress={() => {
                     if (AD_SLIDES[activeAd].actionText === 'Check Alerts') {
                       onNotificationPress?.();
                     }
                   }}
                 >
                   <Text style={styles.adActionBtnText}>{AD_SLIDES[activeAd].actionText}</Text>
                 </TouchableOpacity>
               </View>
              <View style={styles.adIconSide}>
                <MaterialIcons name={AD_SLIDES[activeAd].icon} size={48} color="rgba(255,255,255,0.75)" />
              </View>
            </View>

            <View style={styles.paginationDots}>
              {AD_SLIDES.map((slide, idx) => (
                <View
                  key={slide.id}
                  style={[
                    styles.dot,
                    activeAd === idx ? styles.activeDot : styles.inactiveDot
                  ]}
                />
              ))}
            </View>
          </LinearGradient>
        </View>

        {/* MAP & LOCATION MODULE CARD (Replacing spacePlaceholder) */}
        <View style={[styles.mapCardFrame, { backgroundColor: theme.card, borderColor: theme.border }]}>
          
          {/* 1. Interactive map Webview container */}
          <View style={styles.mapViewContainer}>
            {Platform.OS === 'web' ? (
              <iframe
                ref={webViewRef}
                srcDoc={mapHtml}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="Interactive Map"
              />
            ) : WebView ? (
              <WebView
                ref={webViewRef}
                originWhitelist={['*']}
                source={{ html: mapHtml }}
                style={{ flex: 1 }}
                javaScriptEnabled
                domStorageEnabled
              />
            ) : (
              <View style={styles.mapFallback}>
                <MaterialIcons name="map" size={48} color="#94A3B8" />
                <Text style={styles.mapFallbackText}>WebView package missing</Text>
              </View>
            )}
          </View>

          {/* 2. FLOATING ADDRESS BAR indicator (Top of map overlay) */}
          <View style={[styles.floatingAddressBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.greenCircleDot} />
            <Text style={[styles.addressText, { color: theme.textPrimary }]} numberOfLines={1} ellipsizeMode="tail">
              {loadingLocation ? 'Detecting current coordinates...' : address}
            </Text>
            {loadingLocation ? (
              <ActivityIndicator size="small" color="#64748B" style={{ marginLeft: 6 }} />
            ) : (
              <TouchableOpacity onPress={handleRecenter} style={styles.gpsButton}>
                <MaterialIcons name="my-location" size={18} color={isDarkMode ? '#FFFFFF' : '#64748B'} />
              </TouchableOpacity>
            )}
          </View>

          {/* 3. SEARCH BOTTOM SHEET (Absolute positioned overlay at the bottom) */}
          <View style={[styles.bottomSheetCard, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
            {/* Top Sheet handle bar line */}
            <View style={[styles.sheetHandleLine, { backgroundColor: theme.border }]} />

            {/* Search Input Box */}
            <View style={[styles.searchInputBox, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <MaterialIcons name="search" size={20} color="#64748B" style={styles.searchIcon} />
              <TextInput
                style={[styles.searchInput, { color: theme.textPrimary }]}
                placeholder="Search railway gates, crossings or locations..."
                placeholderTextColor="#64748B"
                value={searchVal}
                onChangeText={setSearchVal}
              />
            </View>

            {/* Recent/Suggested list items */}
            <View style={styles.recentListContainer}>
              {/* Option to pick dynamic current location */}
              {locationPermission === 'granted' && (
                <View style={[styles.recentItemRow, { borderBottomColor: theme.itemBorder }]}>
                  <TouchableOpacity 
                    style={styles.recentItemTouchable}
                    onPress={() => {
                      setSearchVal('');
                      handleRecenter();
                    }}
                  >
                    <MaterialIcons name="my-location" size={20} color="#10B981" />
                    <View style={styles.recentTextCol}>
                      <Text style={[styles.recentTitle, { color: '#10B981' }]} numberOfLines={1}>
                        Use Current Location
                      </Text>
                      <Text style={[styles.recentSubtitle, { color: theme.textSecondary }]} numberOfLines={1}>
                        {address}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              )}

              {filteredRecent.map((item, idx) => (
                <View 
                  key={item.id} 
                  style={[
                    styles.recentItemRow,
                    { borderBottomColor: theme.itemBorder },
                    idx === filteredRecent.length - 1 && { borderBottomWidth: 0 }
                  ]}
                >
                  <TouchableOpacity 
                    style={styles.recentItemTouchable}
                    onPress={() => handleLocationSelect(item)}
                  >
                    <MaterialIcons name="history" size={20} color={isDarkMode ? '#94A3B8' : '#64748B'} />
                    <View style={styles.recentTextCol}>
                      <Text style={[styles.recentTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={[styles.recentSubtitle, { color: theme.textSecondary }]} numberOfLines={1}>
                        {item.subtitle}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.favoriteButton} 
                    onPress={() => toggleFavorite(item.id)}
                  >
                    <Feather 
                      name="heart" 
                      size={18} 
                      color={item.favorite ? '#EF4444' : '#64748B'}
                      style={item.favorite && styles.favoriteFilled} 
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

        </View>

        {/* NEARBY RAILWAY GATES SECTION */}
        <View style={styles.nearbySectionHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={[styles.nearbySectionTitle, { color: theme.textPrimary }]}>Nearby Level Crossings</Text>
            {isFetchingGates && (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <ActivityIndicator size="small" color="#7C3AED" style={{ marginRight: 6 }} />
                <Text style={{ fontSize: 11, color: '#7C3AED', fontWeight: 'bold' }}>Syncing Live</Text>
              </View>
            )}
          </View>
          <Text style={[styles.nearbySectionSubtitle, { color: theme.textSecondary }]}>
            Showing nearest gates from your detected/chosen location
          </Text>
        </View>

        {loadingGates ? (
          <View style={{ paddingVertical: 40, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color="#7C3AED" />
            <Text style={{ marginTop: 12, color: theme.textSecondary, fontWeight: '600', fontSize: 13 }}>Syncing with live database...</Text>
          </View>
        ) : filteredGates.length === 0 ? (
          <View style={[styles.gateCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.gateCardName, { color: theme.textPrimary }]}>No live gates found</Text>
            <Text style={[styles.gateCardSub, { color: theme.textSecondary }]}>Pull down to refresh the registered railway gates.</Text>
          </View>
        ) : filteredGates.map((gate) => {
          const isDefault = defaultGateId === gate.id;
          return (
            <View
              key={gate.id}
              style={[
                styles.gateCard,
                { backgroundColor: theme.card, borderColor: theme.border },
                isDefault && [styles.defaultGateHighlight, { borderColor: '#7C3AED' }]
              ]}
            >
              {/* Top part: Status Icon and info */}
              <View style={styles.gateCardHeader}>
                <View style={[styles.statusIndicatorCircle, { backgroundColor: gate.color }]} />
                <View style={styles.gateInfoCol}>
                  <View style={styles.gateNameRow}>
                    <Text style={[styles.gateCardName, { color: theme.textPrimary }]} numberOfLines={1}>
                      {gate.name}
                    </Text>
                    {isDefault && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>DEFAULT</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.gateCardSub, { color: theme.textSecondary }]}>
                    {gate.location} • {formatDistance(gate.distanceVal)}
                  </Text>
                </View>
                
                <View style={[styles.statusTextBadge, { backgroundColor: gate.status === 'OPEN' ? 'rgba(16, 185, 129, 0.1)' : gate.status === 'CLOSED' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)' }]}>
                  <Text style={[styles.statusText, { color: gate.color }]}>{gate.status}</Text>
                </View>
              </View>

              {/* Middle part: Live train info / status times */}
              <View style={[styles.gateDivider, { backgroundColor: theme.itemBorder }]} />
              <View style={styles.gateStatsRow}>
                <View style={styles.gateStatItem}>
                  <MaterialIcons name="schedule" size={15} color={theme.textSecondary} />
                  <Text style={[styles.gateStatVal, { color: gate.color }]}> {gate.waitingTime}</Text>
                </View>
                <View style={styles.gateStatItem}>
                  <MaterialIcons name="train" size={15} color={theme.textSecondary} />
                  <Text style={[styles.gateStatText, { color: theme.textPrimary }]} numberOfLines={1}>
                    {' '}{gate.nextTrain}
                  </Text>
                </View>
              </View>

              {/* Action Buttons Row */}
              <View style={styles.actionsBtnContainer}>
                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    styles.setDefaultBtn,
                    isDefault ? styles.activeDefaultBtn : { borderColor: theme.border }
                  ]}
                  onPress={() => handleSetDefaultGate(gate.id)}
                  activeOpacity={0.7}
                >
                  <MaterialIcons
                    name={isDefault ? 'check-circle' : 'star-border'}
                    size={15}
                    color={isDefault ? '#FFFFFF' : (isDarkMode ? '#94A3B8' : '#64748B')}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={[
                    styles.actionBtnText,
                    isDefault ? styles.activeDefaultBtnText : { color: isDarkMode ? '#FFFFFF' : '#475569' }
                  ]}>
                    {isDefault ? 'Default' : 'Set Default'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    {
                      backgroundColor: gate.status === 'OPEN' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                      borderColor: gate.status === 'OPEN' ? '#EF4444' : '#10B981',
                      borderWidth: 1
                    }
                  ]}
                  onPress={() => handleToggleGateStatus(gate.id, gate.status)}
                  activeOpacity={0.7}
                >
                  <MaterialIcons
                    name={gate.status === 'OPEN' ? 'lock' : 'lock-open'}
                    size={15}
                    color={gate.status === 'OPEN' ? '#EF4444' : '#10B981'}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={[
                    styles.actionBtnText,
                    { color: gate.status === 'OPEN' ? '#EF4444' : '#10B981' }
                  ]}>
                    {gate.status === 'OPEN' ? 'Close' : 'Open'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.chooseGateBtn]}
                  onPress={() => handleChooseGate(gate.id)}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="explore" size={15} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={[styles.actionBtnText, styles.chooseGateBtnText]}>
                    Choose
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    marginTop: 8,
  },
  welcomeInfo: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  usernameText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.sm,
  },
  logoWrapper: {
    width: 24,
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    marginRight: 8,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  brandText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0F766E',
  },
  notificationBtn: {
    backgroundColor: '#FFF',
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
    ...SHADOWS.sm,
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  carouselContainer: {
    width: '100%',
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    ...SHADOWS.md,
  },
  adCard: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  adContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  adTextSide: {
    flex: 1,
    marginRight: 10,
  },
  adTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  adDesc: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
    lineHeight: 14,
  },
  adActionBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  adActionBtnText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  adIconSide: {
    paddingLeft: 10,
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  dot: {
    height: 5,
    borderRadius: 2.5,
    marginHorizontal: 3,
  },
  activeDot: {
    width: 14,
    backgroundColor: '#fff',
  },
  inactiveDot: {
    width: 5,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },

  /* MAP MODULE CARD STYLING */
  mapCardFrame: {
    width: '100%',
    height: 540,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    position: 'relative',
    marginBottom: 16,
    ...SHADOWS.lg,
  },
  mapViewContainer: {
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  mapFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  mapFallbackText: {
    marginTop: 10,
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },

  /* FLOATING ADDRESS BAR PILL */
  floatingAddressBar: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    zIndex: 10,
    ...SHADOWS.md,
  },
  greenCircleDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
  },
  addressText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '600',
    color: '#334155',
  },
  gpsButton: {
    padding: 6,
  },

  /* BOTTOM SHEET OVERLAY CARD */
  bottomSheetCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 14,
    zIndex: 10,
    borderTopWidth: 1.2,
    borderTopColor: '#F1F5F9',
    ...SHADOWS.lg,
  },
  sheetHandleLine: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginVertical: 10,
  },
  searchInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 24,
    height: 46,
    marginHorizontal: 16,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: 'bold',
    color: '#0F172A',
    height: '100%',
  },
  recentListContainer: {
    marginHorizontal: 16,
    marginTop: 4,
  },
  recentItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    borderStyle: 'dashed',
  },
  recentItemTouchable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  recentTextCol: {
    flex: 1,
    marginLeft: 12,
    marginRight: 10,
  },
  recentTitle: {
    fontSize: 13.5,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  recentSubtitle: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1.5,
  },
  favoriteButton: {
    padding: 8,
  },
  favoriteFilled: {
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
  },

  /* NEARBY GATES STYLING */
  nearbySectionHeader: {
    marginTop: 24,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  nearbySectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  nearbySectionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  gateCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    ...SHADOWS.sm,
  },
  defaultGateHighlight: {
    borderWidth: 1.5,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gateCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicatorCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  gateInfoCol: {
    flex: 1,
    marginRight: 8,
  },
  gateNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gateCardName: {
    fontSize: 14.5,
    fontWeight: 'bold',
    maxWidth: '75%',
  },
  defaultBadge: {
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    marginLeft: 6,
  },
  defaultBadgeText: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#7C3AED',
  },
  gateCardSub: {
    fontSize: 11.5,
    marginTop: 2,
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
  gateDivider: {
    height: 1,
    marginVertical: 12,
  },
  gateStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gateStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  gateStatVal: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  gateStatText: {
    fontSize: 12,
  },
  actionsBtnContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  setDefaultBtn: {
    backgroundColor: 'transparent',
  },
  activeDefaultBtn: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  activeDefaultBtnText: {
    color: '#FFFFFF',
  },
  chooseGateBtn: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
  },
  chooseGateBtnText: {
    color: '#FFFFFF',
  },
});
