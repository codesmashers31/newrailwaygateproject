import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions, SafeAreaView } from 'react-native';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../theme/theme';
import { useNavigation } from '../navigation/NavigationContext';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: 1,
    title: 'Live Gate Status',
    description: 'Monitor level crossing gates in real-time. Avoid getting stuck by viewing live Open/Closed gates powered by IoT sensors.',
    icon: 'traffic',
    iconColor: COLORS.primary,
    bgColor: '#1E293B',
    renderIllustration: () => (
      <View style={styles.illustrationContainer}>
        <View style={[styles.circleGlow, { borderColor: COLORS.primary }]} />
        <FontAwesome5 name="train" size={64} color={COLORS.primary} />
        {/* Simple gate drawing */}
        <View style={styles.gateBarHorizontal} />
        <View style={styles.gatePost} />
      </View>
    ),
  },
  {
    id: 2,
    title: 'Smart Waiting Prediction',
    description: 'Our backend uses live train tracking data to predict exact gate closing and opening times. Plan your departures ahead of time.',
    icon: 'hourglass-empty',
    iconColor: COLORS.warning,
    bgColor: '#1E293B',
    renderIllustration: () => (
      <View style={styles.illustrationContainer}>
        <View style={[styles.circleGlow, { borderColor: COLORS.warning }]} />
        <MaterialIcons name="hourglass-empty" size={80} color={COLORS.warning} />
        <Text style={styles.illustrationText}>5m 30s</Text>
      </View>
    ),
  },
  {
    id: 3,
    title: 'Instant Detour Alerts',
    description: 'Receive personalized proximity alerts and push notifications 5–10 minutes before a railway gate on your route closes.',
    icon: 'notifications-active',
    iconColor: COLORS.accent,
    bgColor: '#1E293B',
    renderIllustration: () => (
      <View style={styles.illustrationContainer}>
        <View style={[styles.circleGlow, { borderColor: COLORS.accent }]} />
        <MaterialIcons name="notifications-active" size={80} color={COLORS.accent} />
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>ALERT</Text>
        </View>
      </View>
    ),
  },
];

export default function OnboardingScreen() {
  const { navigate } = useNavigation();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const handleNext = () => {
    if (currentSlideIndex < SLIDES.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    } else {
      navigate('LOGIN');
    }
  };

  const handleSkip = () => {
    navigate('LOGIN');
  };

  const slide = SLIDES[currentSlideIndex];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Slide Content */}
      <View style={styles.slideContainer}>
        {slide.renderIllustration()}
        
        <View style={styles.textContainer}>
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.description}>{slide.description}</Text>
        </View>
      </View>

      {/* Footer Controls */}
      <View style={styles.footer}>
        {/* Pagination Dots */}
        <View style={styles.dotsContainer}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentSlideIndex
                  ? styles.activeDot
                  : styles.inactiveDot,
              ]}
            />
          ))}
        </View>

        {/* Action Button */}
        <TouchableOpacity style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>
            {currentSlideIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
          </Text>
          <MaterialIcons
            name={currentSlideIndex === SLIDES.length - 1 ? 'check' : 'arrow-forward'}
            size={20}
            color="#fff"
            style={{ marginLeft: 8 }}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: 'flex-end',
  },
  skipText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.textSecondary,
    fontSize: 15,
  },
  slideContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  illustrationContainer: {
    width: width * 0.65,
    height: width * 0.65,
    borderRadius: (width * 0.65) / 2,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    position: 'relative',
    ...SHADOWS.lg,
  },
  circleGlow: {
    position: 'absolute',
    width: '90%',
    height: '90%',
    borderRadius: (width * 0.65 * 0.9) / 2,
    borderWidth: 2,
    borderStyle: 'dashed',
    opacity: 0.3,
  },
  illustrationText: {
    ...TYPOGRAPHY.h2,
    color: '#fff',
    marginTop: 10,
  },
  badgeContainer: {
    position: 'absolute',
    top: 30,
    right: 30,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  gatePost: {
    position: 'absolute',
    bottom: 50,
    right: 60,
    width: 12,
    height: 40,
    backgroundColor: COLORS.textSecondary,
    borderRadius: 2,
  },
  gateBarHorizontal: {
    position: 'absolute',
    bottom: 75,
    right: 66,
    width: 100,
    height: 6,
    backgroundColor: COLORS.accent,
    borderRadius: 2,
    transform: [{ rotate: '-15deg' }],
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  title: {
    ...TYPOGRAPHY.h2,
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 24,
  },
  description: {
    ...TYPOGRAPHY.body,
    textAlign: 'center',
    lineHeight: 22,
    fontSize: 15,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 24,
    backgroundColor: COLORS.primary,
  },
  inactiveDot: {
    width: 8,
    backgroundColor: COLORS.textMuted,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    ...SHADOWS.md,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
