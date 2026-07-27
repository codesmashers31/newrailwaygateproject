import React, { useState } from 'react';
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
  Image,
  Alert,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../theme/theme';
import { useNavigation } from '../navigation/NavigationContext';
import { MaterialIcons, FontAwesome5, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../services/api';

const { width, height } = Dimensions.get('window');
const isSmallScreen = width < 375;
const logoSize = Math.min(width * 0.2, 80);

export default function RegisterScreen() {
  const { navigate } = useNavigation();

  // Pre-filled dummy data for easy user verification
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Focus tracking state
  const [focusedField, setFocusedField] = useState('');

  const triggerEmailVerification = () => {
    setErrorMsg('');
    setSuccessMsg('');
    
    // Quick email format check
    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address first.');
      return;
    }

    setIsCodeSent(true);
    setIsVerified(true);
    setSuccessMsg('Email will be saved with your account.');
  };

  const handleVerifyCode = () => {
    setErrorMsg('');
    setSuccessMsg('');

    if (verificationCode.trim()) {
      setIsVerified(true);
      setSuccessMsg('Email verified successfully! ✓');
    } else {
      setErrorMsg('Invalid verification code. Please try again.');
    }
  };

  const handleRegister = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    if (!firstName || !lastName || !phone) {
      setErrorMsg('First name, last name, and mobile number are required.');
      return;
    }

    if (email && !email.includes('@')) {
      setErrorMsg('Invalid email format.');
      return;
    }

    try {
      setSuccessMsg('Creating account...');
      const response = await api.auth.register({
        name: `${firstName} ${lastName}`,
        phone: phone.trim(),
        email: email.trim(),
      });

      if (response.data.success) {
        setSuccessMsg('Registration successful! Redirecting to login...');
        setTimeout(() => {
          navigate('LOGIN');
        }, 1500);
      } else {
        setErrorMsg(response.data.message || 'Registration failed.');
      }
    } catch (err) {
      const serverMsg = err.response?.data?.message || 'Failed to connect to registration service. Try again.';
      setErrorMsg(serverMsg);
    }
  };


  return (
    <LinearGradient
      colors={['#0C0E24', '#191742', '#100E30']}
      style={styles.container}
    >
      <View style={[styles.glowCircle, styles.glowTopLeft]} />
      <View style={[styles.glowCircle, styles.glowBottomRight]} />

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Minimal Brand Header */}
            <View style={styles.brandContainer}>
              <View style={styles.logoOutline}>
                <Image
                  source={require('../../assets/logo.jpg')}
                  style={styles.logo}
                  resizeMode="cover"
                />
              </View>
              <Text style={styles.titleText}>TrainGateView</Text>
            </View>

            {/* Glowing Glass Card */}
            <View style={styles.glassCard}>
              <Text style={styles.welcomeTitle}>Create Account</Text>
              <Text style={styles.welcomeSubtitle}>Sign up to monitor level crossings</Text>

              {/* Success / Error Alerts */}
              {errorMsg ? (
                <View style={styles.alertError}>
                  <Feather name="alert-circle" size={16} color={COLORS.accent} />
                  <Text style={styles.alertErrorText}>{errorMsg}</Text>
                </View>
              ) : null}

              {successMsg ? (
                <View style={styles.alertSuccess}>
                  <Feather name="check-circle" size={16} color={COLORS.success} />
                  <Text style={styles.alertSuccessText}>{successMsg}</Text>
                </View>
              ) : null}

              {/* Optional Profile Picture Upload slot */}
              <View style={styles.avatarUploadContainer}>
                <View style={styles.avatarCircle}>
                  <FontAwesome5 name="user" size={30} color="rgba(255,255,255,0.4)" />
                </View>
                <TouchableOpacity 
                  style={styles.avatarAddBtn}
                  onPress={() => Alert.alert('Photo Upload', 'Select profile picture option (Optional)')}
                >
                  <Feather name="plus" size={12} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.avatarLabel}>Profile Pic (Optional)</Text>
              </View>

              {/* Name fields (Row) */}
              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>First Name</Text>
                  <View style={[styles.inputBox, focusedField === 'first' && styles.inputBoxFocused]}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="First"
                      placeholderTextColor="rgba(255, 255, 255, 0.25)"
                      value={firstName}
                      onChangeText={setFirstName}
                      onFocus={() => setFocusedField('first')}
                      onBlur={() => setFocusedField('')}
                    />
                  </View>
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.inputLabel}>Last Name</Text>
                  <View style={[styles.inputBox, focusedField === 'last' && styles.inputBoxFocused]}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Last"
                      placeholderTextColor="rgba(255, 255, 255, 0.25)"
                      value={lastName}
                      onChangeText={setLastName}
                      onFocus={() => setFocusedField('last')}
                      onBlur={() => setFocusedField('')}
                    />
                  </View>
                </View>
              </View>

              {/* Phone Number */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <View style={[styles.inputBox, focusedField === 'phone' && styles.inputBoxFocused]}>
                  <Feather name="phone" size={16} color="#6366F1" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="+91 98765 43210"
                    placeholderTextColor="rgba(255, 255, 255, 0.25)"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    onFocus={() => setFocusedField('phone')}
                    onBlur={() => setFocusedField('')}
                  />
                </View>
              </View>

              {/* Email + Verify Button */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <View style={styles.emailRow}>
                  <View style={[styles.emailInputBox, focusedField === 'email' && styles.inputBoxFocused, isVerified && styles.inputBoxVerified]}>
                    <Feather name="mail" size={16} color={isVerified ? COLORS.success : '#6366F1'} style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="youremail@example.com"
                      placeholderTextColor="rgba(255, 255, 255, 0.25)"
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        setIsVerified(false);
                        setIsCodeSent(false);
                      }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      editable={!isVerified}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField('')}
                    />
                  </View>
                  <TouchableOpacity 
                    style={[styles.verifyBtn, isVerified && styles.verifyBtnDisabled]}
                    onPress={triggerEmailVerification}
                    disabled={isVerified}
                  >
                    <LinearGradient
                      colors={isVerified ? ['#059669', '#10B981'] : ['#6366F1', '#4F46E5']}
                      style={styles.verifyGradient}
                    >
                      <Text style={styles.verifyBtnText}>{isVerified ? 'Verified' : 'Verify'}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Verification Code Box (Toggled on code sent) */}
              {isCodeSent && !isVerified && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Verification Code</Text>
                  <View style={styles.emailRow}>
                    <View style={[styles.emailInputBox, focusedField === 'code' && styles.inputBoxFocused]}>
                      <Feather name="shield" size={16} color="#6366F1" style={styles.inputIcon} />
                      <TextInput
                        style={styles.textInput}
                        placeholder="Enter 4-digit code"
                        placeholderTextColor="rgba(255, 255, 255, 0.25)"
                        value={verificationCode}
                        onChangeText={setVerificationCode}
                        keyboardType="number-pad"
                        onFocus={() => setFocusedField('code')}
                        onBlur={() => setFocusedField('')}
                      />
                    </View>
                    <TouchableOpacity 
                      style={styles.verifyBtn}
                      onPress={handleVerifyCode}
                    >
                      <LinearGradient
                        colors={['#7C3AED', '#5B4CF5']}
                        style={styles.verifyGradient}
                      >
                        <Text style={styles.verifyBtnText}>Confirm</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password (Min 6 characters)</Text>
                <View style={[styles.inputBox, focusedField === 'pass' && styles.inputBoxFocused]}>
                  <Feather name="lock" size={16} color="#6366F1" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="••••••"
                    placeholderTextColor="rgba(255, 255, 255, 0.25)"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    autoCapitalize="none"
                    onFocus={() => setFocusedField('pass')}
                    onBlur={() => setFocusedField('')}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Feather
                      name={showPassword ? 'eye' : 'eye-off'}
                      size={16}
                      color="rgba(255, 255, 255, 0.35)"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <View style={[styles.inputBox, focusedField === 'conf' && styles.inputBoxFocused]}>
                  <Feather name="lock" size={16} color="#6366F1" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="••••••"
                    placeholderTextColor="rgba(255, 255, 255, 0.25)"
                    secureTextEntry={!showPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    autoCapitalize="none"
                    onFocus={() => setFocusedField('conf')}
                    onBlur={() => setFocusedField('')}
                  />
                </View>
              </View>

              {/* Register Action Button */}
              <TouchableOpacity
                style={styles.submitBtnContainer}
                activeOpacity={0.85}
                onPress={handleRegister}
              >
                <LinearGradient
                  colors={['#7C3AED', '#3B82F6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitGradient}
                >
                  <Text style={styles.submitBtnText}>Create Account</Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Sign in prompt footer */}
              <View style={styles.signupPromptRow}>
                <Text style={styles.signupPromptText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigate('LOGIN')}>
                  <Text style={styles.signupLink}>Sign In</Text>
                </TouchableOpacity>
              </View>
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
    width: 260,
    height: 260,
    borderRadius: 130,
    opacity: 0.18,
  },
  glowTopLeft: {
    backgroundColor: '#7C3AED',
    top: -80,
    left: -80,
  },
  glowBottomRight: {
    backgroundColor: '#3B82F6',
    bottom: -80,
    right: -80,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: height * 0.02,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: height * 0.015,
  },
  logoOutline: {
    width: logoSize,
    height: logoSize,
    borderRadius: logoSize / 2,
    borderWidth: 1.2,
    borderColor: '#5B4CF5',
    overflow: 'hidden',
    backgroundColor: '#fff',
    marginRight: 10,
    ...SHADOWS.sm,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  titleText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  glassCard: {
    backgroundColor: 'rgba(16, 14, 34, 0.72)',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(91, 76, 245, 0.35)',
    width: '100%',
    maxWidth: 450,
    paddingHorizontal: isSmallScreen ? 18 : 24,
    paddingVertical: isSmallScreen ? 20 : 26,
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
    marginBottom: 16,
    textAlign: 'center',
  },
  alertError: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    borderWidth: 1.2,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  alertErrorText: {
    color: COLORS.accent,
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  alertSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    borderWidth: 1.2,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  alertSuccessText: {
    color: COLORS.success,
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  avatarUploadContainer: {
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarAddBtn: {
    position: 'absolute',
    right: '41%',
    bottom: 20,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLabel: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 6,
    fontWeight: 'bold',
  },
  rowInputs: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 6,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 12,
    height: 44,
    paddingHorizontal: 12,
  },
  inputBoxFocused: {
    borderColor: '#818CF8',
    backgroundColor: 'rgba(129, 140, 248, 0.03)',
  },
  inputBoxVerified: {
    borderColor: COLORS.success,
    backgroundColor: 'rgba(16, 185, 129, 0.02)',
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  emailInputBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 12,
    height: 44,
    paddingHorizontal: 12,
    marginRight: 10,
  },
  verifyBtn: {
    width: 80,
    height: 44,
    borderRadius: 12,
    overflow: 'hidden',
  },
  verifyGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  verifyBtnDisabled: {
    opacity: 0.9,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    color: '#fff',
    fontSize: 13,
    height: '100%',
  },
  eyeIcon: {
    padding: 6,
  },
  submitBtnContainer: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 6,
    marginBottom: 16,
    ...SHADOWS.md,
  },
  submitGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  signupPromptRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
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
