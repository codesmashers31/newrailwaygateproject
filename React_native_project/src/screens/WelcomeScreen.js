import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  ScrollView,
  PanResponder,
  Animated,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../theme/theme';
import { useNavigation } from '../navigation/NavigationContext';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

// Swipe track layout configuration
const TRACK_WIDTH = Math.min(width - 48, 400);
const KNOB_SIZE = 46;
const TRACK_PADDING = 4;
const MAX_TRANSLATE = TRACK_WIDTH - KNOB_SIZE - TRACK_PADDING * 2;

// Adaptive dimensions based on screen width
const isSmallScreen = width < 375;
const logoSize = Math.min(width * 0.28, 110);

const FEATURES = [
  {
    id: 0,
    title: 'Live Gate Status',
    description: 'Monitor level crossing gates in real-time. Avoid delays by seeing whether gates are Open or Closed.',
    icon: 'traffic',
    iconColor: COLORS.primary,
  },
  {
    id: 1,
    title: 'Smart Countdown',
    description: 'Exact timing predictions for gate opening and closing, powered by live train movement data.',
    icon: 'hourglass-empty',
    iconColor: COLORS.warning,
  },
  {
    id: 2,
    title: 'Instant Detour Alerts',
    description: 'Receive smart warning push notifications 5 minutes before crossing gates close on your route.',
    icon: 'notifications-active',
    iconColor: COLORS.accent,
  },
];

export default function WelcomeScreen() {
  const { navigate } = useNavigation();
  const [activeFeature, setActiveFeature] = useState(0);

  // Swipe to login gesture state
  const pan = useRef(new Animated.Value(0)).current;
  const [isCompleted, setIsCompleted] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation loop for resting chevron indicator
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {},
      onPanResponderMove: (e, gestureState) => {
        // Lock X translation between 0 and MAX_TRANSLATE limit
        const nextX = Math.min(Math.max(0, gestureState.dx), MAX_TRANSLATE);
        pan.setValue(nextX);
      },
      onPanResponderRelease: (e, gestureState) => {
        if (gestureState.dx >= MAX_TRANSLATE * 0.85) {
          // Success: Complete swipe and navigate
          Animated.timing(pan, {
            toValue: MAX_TRANSLATE,
            duration: 150,
            useNativeDriver: true,
          }).start(() => {
            setIsCompleted(true);
            navigate('LOGIN');
            
            // Return to start after navigation is triggered to allow seamless back-navigation
            setTimeout(() => {
              Animated.timing(pan, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
              }).start(() => {
                setIsCompleted(false);
              });
            }, 600);
          });
        } else {
          // Snap back to start
          Animated.spring(pan, {
            toValue: 0,
            friction: 5,
            tension: 40,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Interpolated animation styles
  const progressScaleX = pan.interpolate({
    inputRange: [0, MAX_TRANSLATE],
    outputRange: [0.01, 1],
    extrapolate: 'clamp',
  });

  const textOpacity = pan.interpolate({
    inputRange: [0, MAX_TRANSLATE / 2, MAX_TRANSLATE],
    outputRange: [1, 0.4, 0],
    extrapolate: 'clamp',
  });

  const knobRotate = pan.interpolate({
    inputRange: [0, MAX_TRANSLATE],
    outputRange: ['0deg', '360deg'],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % FEATURES.length);
    }, 3000); // Switches features every 3 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header Row with Skip */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.skipBtn} 
          onPress={() => navigate('LOGIN')}
          accessibilityLabel="Go to login page"
        >
          <Text style={styles.skipText}>Skip</Text>
          <MaterialIcons name="chevron-right" size={18} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Step 1: Welcome Logo & Title */}
        <View style={styles.brandContainer}>
          <View style={styles.logoCircle}>
            <Image
              source={require('../../assets/logo.jpg')}
              style={styles.logo}
              resizeMode="cover"
            />
          </View>
          <Text style={styles.title}>TrainGateView</Text>
          <Text style={styles.subtitle}>Smart Railway Crossing Alerts</Text>
        </View>

        {/* Step 2: Key Features Interactive Section */}
        <View style={styles.showcaseCard}>
          <Text style={styles.sectionHeader}>Key Features</Text>
          
          <View style={styles.featureContent}>
            <View style={[styles.iconWrapper, { backgroundColor: FEATURES[activeFeature].iconColor + '15' }]}>
              <MaterialIcons
                name={FEATURES[activeFeature].icon}
                size={34}
                color={FEATURES[activeFeature].iconColor}
              />
            </View>
            <Text style={styles.featureTitle}>{FEATURES[activeFeature].title}</Text>
            <Text style={styles.featureDesc}>{FEATURES[activeFeature].description}</Text>
          </View>

          {/* Indicators / Feature Tabs */}
          <View style={styles.tabsRow}>
            {FEATURES.map((feat) => (
              <TouchableOpacity
                key={feat.id}
                style={[
                  styles.tabButton,
                  activeFeature === feat.id && { 
                    borderColor: feat.iconColor, 
                    backgroundColor: feat.iconColor + '10' 
                  },
                ]}
                onPress={() => setActiveFeature(feat.id)}
              >
                <MaterialIcons
                  name={feat.icon}
                  size={18}
                  color={activeFeature === feat.id ? feat.iconColor : COLORS.textMuted}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Step 2 Continued: Swipe to Login button at bottom */}
        <View style={styles.footerContainer}>
          <View style={styles.swipeTrack}>
            {/* Animated colorful progress background underlay */}
            <Animated.View 
              style={[
                styles.swipeProgress, 
                {
                  transform: [
                    { translateX: -TRACK_WIDTH / 2 },
                    { scaleX: progressScaleX },
                    { translateX: TRACK_WIDTH / 2 }
                  ]
                }
              ]}
            >
              <LinearGradient
                colors={['#7C3AED', '#3B82F6', '#10B981']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFillObject}
              />
            </Animated.View>

            {/* Glowing instructional swipe text */}
            <Animated.Text 
              pointerEvents="none" 
              style={[styles.swipeText, { opacity: textOpacity }]}
            >
              Swipe to Log In
            </Animated.Text>

            {/* Drag thumb button */}
            <Animated.View
              style={[
                styles.swipeKnob,
                {
                  transform: [
                    { translateX: pan },
                    { rotate: knobRotate }
                  ]
                }
              ]}
              {...panResponder.panHandlers}
            >
              <LinearGradient
                colors={['#3B82F6', '#7C3AED']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.knobGradient}
              >
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <MaterialIcons name="chevron-right" size={24} color="#fff" />
                </Animated.View>
              </LinearGradient>
            </Animated.View>
          </View>
          
          <Text style={styles.versionLabel}>Version 1.0.0 • Mobile UI Shell</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: height * 0.015,
    paddingBottom: 4,
    height: 50,
    alignItems: 'center',
  },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  skipText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: height * 0.03,
  },
  brandContainer: {
    alignItems: 'center',
    marginTop: height * 0.02,
    marginBottom: height * 0.03,
  },
  logoCircle: {
    width: logoSize,
    height: logoSize,
    borderRadius: logoSize / 2,
    borderWidth: 2.5,
    borderColor: COLORS.primary,
    overflow: 'hidden',
    backgroundColor: '#fff',
    ...SHADOWS.md,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  title: {
    ...TYPOGRAPHY.h1,
    fontSize: isSmallScreen ? 24 : 28,
    marginTop: 12,
    color: '#fff',
    textAlign: 'center',
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  showcaseCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    width: '100%',
    maxWidth: 450, // Limits width on tablet/web
    padding: isSmallScreen ? 18 : 22,
    alignItems: 'center',
    marginBottom: height * 0.03,
    ...SHADOWS.md,
  },
  sectionHeader: {
    ...TYPOGRAPHY.caption,
    fontSize: 10,
    letterSpacing: 2,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    marginBottom: isSmallScreen ? 12 : 16,
  },
  featureContent: {
    alignItems: 'center',
    minHeight: 140,
    justifyContent: 'center',
    width: '100%',
  },
  iconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 16,
    color: '#fff',
    marginBottom: 6,
    textAlign: 'center',
  },
  featureDesc: {
    ...TYPOGRAPHY.body,
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 16,
    width: '100%',
  },
  tabButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  footerContainer: {
    width: '100%',
    maxWidth: 450,
    alignItems: 'center',
  },
  swipeTrack: {
    width: TRACK_WIDTH,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(22, 31, 48, 0.7)',
    borderWidth: 1.5,
    borderColor: 'rgba(91, 76, 245, 0.35)',
    justifyContent: 'center',
    paddingHorizontal: TRACK_PADDING,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 14,
    ...SHADOWS.md,
  },
  swipeProgress: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: TRACK_WIDTH,
    borderRadius: 28,
  },
  swipeText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    textAlign: 'center',
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 1,
  },
  swipeKnob: {
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
    zIndex: 2,
    ...SHADOWS.md,
  },
  knobGradient: {
    flex: 1,
    borderRadius: KNOB_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  versionLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
});
