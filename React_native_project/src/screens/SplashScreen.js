import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Image, Text, Animated, Dimensions } from 'react-native';
import { COLORS, TYPOGRAPHY } from '../theme/theme';
import { useNavigation } from '../navigation/NavigationContext';
import { cookieManager } from '../utils/cookieManager';
import apiClient from '../services/api';

const { width } = Dimensions.get('window');

export default function SplashScreen() {
  const { navigate } = useNavigation();
  
  // Animation hooks
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Sequence of animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Fade in text and slide it up slightly
      Animated.parallel([
        Animated.timing(textFadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Check session and automatically log in if valid token is found
        const checkSessionAndNavigate = async () => {
          try {
            const token = await cookieManager.getCookie('session_token');
            if (token) {
              const response = await apiClient.get('/api/auth/validate-token', {
                headers: { Authorization: `Bearer ${token}` }
              });
              if (response.data && response.data.valid) {
                navigate('MAIN');
                return;
              }
            }
          } catch (e) {
            console.log('SplashScreen: Session auto-login check failed:', e);
            await cookieManager.clearCookie('session_token');
          }
          // Default fallback to onboarding/login
          navigate('ONBOARDING');
        };

        const timer = setTimeout(() => {
          checkSessionAndNavigate();
        }, 1200);
        return () => clearTimeout(timer);
      });
    });
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Image
          source={require('../../assets/logo.jpg')}
          style={styles.logo}
          resizeMode="cover"
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.textContainer,
          {
            opacity: textFadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Text style={styles.title}>TrainGateView</Text>
        <Text style={styles.subtitle}>Smart Railway Crossing Alerts</Text>
      </Animated.View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Powered by IoT Sensors</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: (width * 0.5) / 2,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
    backgroundColor: '#fff',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  title: {
    ...TYPOGRAPHY.h1,
    fontSize: 32,
    color: COLORS.textPrimary,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: 8,
    fontSize: 16,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
  },
  footerText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
