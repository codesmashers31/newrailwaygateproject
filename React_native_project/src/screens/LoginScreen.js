import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  Animated,
  ActivityIndicator,
  Image,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../theme/theme';
import { useNavigation } from '../navigation/NavigationContext';
import { MaterialIcons, FontAwesome5, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../services/api';

const { width, height } = Dimensions.get('window');
const isSmallScreen = width < 375;
const logoSize = Math.min(width * 0.28, 110);

export default function LoginScreen() {
  const { navigate } = useNavigation();

  // Primary states
  const [loginInput, setLoginInput] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Status & Loading states
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [focusedOtpIdx, setFocusedOtpIdx] = useState(-1);

  // Animation values
  const otpAnim = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(1)).current;

  // Refs for 6 OTP boxes
  const otpRefs = useRef([]);

  // Handle countdown timer
  useEffect(() => {
    let timer = null;
    if (otpSent && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0 && timer) {
      clearInterval(timer);
    }
    return () => clearInterval(timer);
  }, [otpSent, countdown]);

  // Check for existing valid session on mount
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        if (await api.auth.hasSession()) {
          setLoading(true);
          const response = await api.auth.me();
          if (response.data?.success) {
            navigate('MAIN');
          }
        }
      } catch (err) {
        console.log('Session validation failed, user must log in again.');
        await api.auth.clearSession();
      } finally {
        setLoading(false);
      }
    };
    checkExistingSession();
  }, []);

  // Validation functions
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.toLowerCase());
  };

  // Handler for sending OTP
  const handleSendOtp = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    const inputClean = loginInput.trim();

    if (!inputClean) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    if (!validateEmail(inputClean)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    try {
      setLoading(true);
      // Trigger scaling animation on brand logo
      Animated.sequence([
        Animated.timing(logoScale, { toValue: 0.9, duration: 150, useNativeDriver: true }),
        Animated.spring(logoScale, { toValue: 1, friction: 3, useNativeDriver: true }),
      ]).start();

      const response = await api.auth.login(inputClean);

      if (response.data.success) {
        setOtpSent(true);
        setCountdown(60);
        
        // Set user feedback message from backend
        const serverSuccessMsg = response.data.message || 'OTP generated. Enter the 6-digit code to continue.';
        setSuccessMsg(serverSuccessMsg);

        // Auto-fill OTP boxes if returned in response (e.g. when Render blocks SMTP)
        if (response.data.data?.otp) {
          const codeStr = String(response.data.data.otp);
          if (codeStr.length === 6) {
            setOtp(codeStr.split(''));
          }
        }

        // Smoothly animate in the OTP section
        Animated.spring(otpAnim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }).start(() => {
          // Focus the first OTP box if not auto-filled
          if (!response.data.data?.otp && otpRefs.current[0]) {
            otpRefs.current[0].focus();
          }
        });
      }
    } catch (err) {
      const serverMsg = err.response?.data?.message || 'Network issue encountered. Check your connection.';
      setErrorMsg(serverMsg);
    } finally {
      setLoading(false);
    }
  };

  // Handler for individual OTP digit input
  const handleOtpChange = (text, index) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    const newOtp = [...otp];
    newOtp[index] = cleaned;
    setOtp(newOtp);

    // If entered a digit, move focus forward
    if (cleaned !== '' && index < 5) {
      if (otpRefs.current[index + 1]) {
        otpRefs.current[index + 1].focus();
      }
    }
  };

  // Backspace navigation handler
  const handleOtpKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (otp[index] === '' && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        if (otpRefs.current[index - 1]) {
          otpRefs.current[index - 1].focus();
        }
      }
    }
  };

  // Handler for verifying OTP
  const handleVerifyOtp = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    const fullOtp = otp.join('');

    if (fullOtp.length < 6) {
      setErrorMsg('Please enter the full 6-digit OTP.');
      return;
    }

    try {
      setVerifying(true);
      const response = await api.auth.verifyOtp(loginInput.trim(), fullOtp);

      if (response.data.success) {
        setSuccessMsg('Verification successful! Access granted.');
        
        // Redirect after a brief delay for user feedback
        setTimeout(() => {
          navigate('MAIN');
        }, 1200);
      }
    } catch (err) {
      const serverMsg = err.response?.data?.message || 'Invalid OTP code. Please try again.';
      setErrorMsg(serverMsg);
      // Highlight boxes red and clear
      setOtp(['', '', '', '', '', '']);
      if (otpRefs.current[0]) {
        otpRefs.current[0].focus();
      }
    } finally {
      setVerifying(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg('Google sign-in is not enabled on the backend yet. Use email OTP to continue.');
  };

  // Interpolated animation styles
  const otpTranslateY = otpAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [30, 0],
  });
  const otpScale = otpAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.93, 1],
  });

  return (
    <LinearGradient
      colors={['#0C0E24', '#191742', '#100E30']}
      style={styles.container}
    >
      {/* Visual background glows - disabled pointer events to prevent touch interception */}
      <View style={[styles.glowCircle, styles.glowTopLeft]} pointerEvents="none" />
      <View style={[styles.glowCircle, styles.glowBottomRight]} pointerEvents="none" />

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Brand Header */}
            <View style={styles.brandContainer}>
              <View style={styles.logoOutline}>
                <Image
                  source={require('../../assets/logo.png')}
                  style={styles.logo}
                  resizeMode="cover"
                />
              </View>
              <Text style={styles.titleText}>TrainGateView</Text>
            </View>

            {/* Glassmorphic Login Form Card */}
            <View style={styles.glassCard}>
              <Text style={styles.welcomeTitle}>Welcome</Text>
              <Text style={styles.welcomeSubtitle}>Enter your email to continue</Text>

              {/* Success / Error Alerts */}
              {errorMsg ? (
                <View style={styles.alertError}>
                  <Feather name="alert-circle" size={16} color={COLORS.accent} />
                  <Text style={styles.alertErrorText}>{errorMsg}</Text>
                </View>
              ) : null}

              {/* Success Alert */}
              {successMsg ? (
                <View style={styles.alertSuccess}>
                  <Feather name="check-circle" size={16} color={COLORS.success} />
                  <Text style={styles.alertSuccessText}>{successMsg}</Text>
                </View>
              ) : null}

              {/* Identifier Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <View 
                  style={[
                    styles.inputBox, 
                    otpSent && styles.inputBoxDisabled
                  ]}
                >
                    <Feather name="mail" size={18} color="#818CF8" style={styles.inputIcon} />
                  
                  <TextInput
                    style={[styles.textInput, otpSent && { color: 'rgba(255, 255, 255, 0.4)' }]}
                    placeholder="Enter your email address"
                    placeholderTextColor="rgba(255, 255, 255, 0.25)"
                    value={loginInput}
                    onChangeText={(text) => {
                      if (!otpSent) setLoginInput(text);
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!otpSent}
                  />

                  {otpSent && (
                    <TouchableOpacity 
                      style={styles.editBtn} 
                      onPress={() => {
                        setOtpSent(false);
                        setOtp(['', '', '', '', '', '']);
                        otpAnim.setValue(0);
                        setErrorMsg('');
                        setSuccessMsg('');
                      }}
                    >
                      <Feather name="edit-2" size={14} color="#818CF8" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Action Button: Send OTP */}
              {!otpSent && (
                <TouchableOpacity
                  style={styles.submitBtnContainer}
                  activeOpacity={0.85}
                  onPress={handleSendOtp}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={['#7C3AED', '#3B82F6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.submitGradient}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <View style={styles.submitBtnContent}>
                        <Text style={styles.submitBtnText}>Send OTP</Text>
                        <Feather name="send" size={16} color="#fff" style={styles.arrowIcon} />
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              )}

              {/* Interactive OTP Box Panel (revealed on OTP sent) */}
              {otpSent && (
                <Animated.View
                  style={[
                    styles.otpContainer,
                    {
                      opacity: otpAnim,
                      transform: [{ translateY: otpTranslateY }, { scale: otpScale }],
                    },
                  ]}
                >
                  <Text style={styles.inputLabel}>Enter 6-Digit OTP</Text>
                  
                  {/* The 6 modern OTP input boxes */}
                  <View style={styles.otpBoxesRow}>
                    {otp.map((digit, idx) => (
                      <TextInput
                        key={idx}
                        ref={(el) => (otpRefs.current[idx] = el)}
                        style={[
                          styles.otpBox,
                          focusedOtpIdx === idx && styles.otpBoxFocused,
                        ]}
                        value={digit}
                        onChangeText={(text) => handleOtpChange(text, idx)}
                        onKeyPress={(e) => handleOtpKeyPress(e, idx)}
                        keyboardType="number-pad"
                        maxLength={1}
                        selectTextOnFocus
                        onFocus={() => setFocusedOtpIdx(idx)}
                        onBlur={() => setFocusedOtpIdx(-1)}
                      />
                    ))}
                  </View>

                  {/* Verification Actions */}
                  <TouchableOpacity
                    style={styles.submitBtnContainer}
                    activeOpacity={0.85}
                    onPress={handleVerifyOtp}
                    disabled={verifying}
                  >
                    <LinearGradient
                      colors={['#10B981', '#059669']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.submitGradient}
                    >
                      {verifying ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <View style={styles.submitBtnContent}>
                          <Text style={styles.submitBtnText}>Verify OTP</Text>
                          <Feather name="check" size={16} color="#fff" style={styles.arrowIcon} />
                        </View>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Countdown Timer and Resend option */}
                  <View style={styles.timerRow}>
                    {countdown > 0 ? (
                      <Text style={styles.timerText}>
                        Resend code in <Text style={styles.timerSec}>{countdown}s</Text>
                      </Text>
                    ) : (
                      <TouchableOpacity 
                        onPress={handleSendOtp}
                        style={styles.resendBtn}
                        disabled={loading}
                      >
                        <Text style={styles.resendText}>Resend OTP</Text>
                        <Feather name="refresh-cw" size={12} color="#818CF8" style={{ marginLeft: 4 }} />
                      </TouchableOpacity>
                    )}
                  </View>
                </Animated.View>
              )}

              {/* Visual Divider separator */}
              <View style={styles.orContainer}>
                <View style={styles.orLine} />
                <Text style={styles.orText}>OR</Text>
                <View style={styles.orLine} />
              </View>

              {/* Google login option */}
              <TouchableOpacity 
                style={styles.googleBtn} 
                activeOpacity={0.85} 
                onPress={handleGoogleLogin}
                disabled={loading || verifying}
              >
                <Image
                  source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg' }}
                  style={styles.googleIcon}
                  resizeMode="contain"
                />
                <Text style={styles.googleBtnText}>Continue with Google</Text>
              </TouchableOpacity>


            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  glowCircle: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.22,
  },
  glowTopLeft: {
    backgroundColor: '#7C3AED',
    top: -60,
    left: -60,
  },
  glowBottomRight: {
    backgroundColor: '#3B82F6',
    bottom: -60,
    right: -60,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: height * 0.03,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: height * 0.02,
  },
  logoOutline: {
    width: logoSize,
    height: logoSize,
    borderRadius: logoSize / 2,
    borderWidth: 1.5,
    borderColor: '#5B4CF5',
    overflow: 'hidden',
    backgroundColor: '#fff',
    ...SHADOWS.md,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  titleWhite: {
    fontSize: isSmallScreen ? 26 : 30,
    fontWeight: '800',
    color: '#fff',
  },
  titleBlue: {
    fontSize: isSmallScreen ? 26 : 30,
    fontWeight: '800',
    color: '#3B82F6',
  },
  indicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  indicatorLine: {
    width: 24,
    height: 1.5,
    backgroundColor: '#5B4CF5',
    opacity: 0.8,
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#5B4CF5',
    marginHorizontal: 6,
  },
  slogan: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '500',
  },
  glassCard: {
    backgroundColor: 'rgba(16, 14, 34, 0.72)',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(91, 76, 245, 0.35)', 
    width: '100%',
    maxWidth: 450,
    paddingHorizontal: isSmallScreen ? 18 : 24,
    paddingVertical: isSmallScreen ? 24 : 28,
    shadowColor: '#5B4CF5',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.38,
    shadowRadius: 18,
    elevation: 8,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 20,
    textAlign: 'center',
  },
  alertError: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
    borderWidth: 1.2,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  alertErrorText: {
    color: COLORS.accent,
    marginLeft: 8,
    fontSize: 12.5,
    fontWeight: '500',
    flex: 1,
  },
  alertSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
    borderWidth: 1.2,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  alertSuccessText: {
    color: COLORS.success,
    marginLeft: 8,
    fontSize: 12.5,
    fontWeight: '500',
    flex: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 8,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 12,
  },
  inputBoxFocused: {
    borderColor: '#818CF8',
    backgroundColor: 'rgba(129, 140, 248, 0.03)',
    shadowColor: '#818CF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  inputBoxDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    height: '100%',
  },
  editBtn: {
    padding: 8,
  },
  submitBtnContainer: {
    width: '100%',
    height: 50,
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 14,
    ...SHADOWS.md,
  },
  submitGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  arrowIcon: {
    marginLeft: 8,
  },
  otpContainer: {
    width: '100%',
    marginTop: 6,
  },
  otpBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 14,
    width: '100%',
  },
  otpBox: {
    width: (width - 48 - 48 - 40) / 6, // Adaptive to card boundaries
    maxWidth: 46,
    height: 52,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  otpBoxFocused: {
    borderColor: '#818CF8',
    backgroundColor: 'rgba(129, 140, 248, 0.06)',
    shadowColor: '#818CF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  timerRow: {
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  timerText: {
    fontSize: 13,
    color: '#64748B',
  },
  timerSec: {
    fontWeight: 'bold',
    color: '#818CF8',
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
  },
  resendText: {
    fontSize: 13,
    color: '#818CF8',
    fontWeight: 'bold',
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  orText: {
    fontSize: 11,
    color: '#475569',
    marginHorizontal: 12,
    fontWeight: 'bold',
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 12,
    height: 48,
    width: '100%',
    marginBottom: 18,
  },
  googleIcon: {
    width: 18,
    height: 18,
    marginRight: 10,
  },
  googleBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  signupPromptRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  signupPromptText: {
    fontSize: 12,
    color: '#64748B',
  },
  signupLink: {
    fontSize: 12,
    color: '#5B4CF5',
    fontWeight: 'bold',
  },
});
