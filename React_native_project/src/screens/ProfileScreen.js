import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../theme/theme';
import { useNavigation } from '../navigation/NavigationContext';
import { MaterialIcons, FontAwesome5, Feather } from '@expo/vector-icons';
import { api } from '../services/api';

export default function ProfileScreen() {
  const { reset } = useNavigation();

  // Profile data state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Saved routes dummy data
  const [savedRoutes, setSavedRoutes] = useState([]);

  // Travel history dummy data
  const travelHistory = [
    { id: 1, date: 'Today, 08:45 AM', route: 'Tambaram → Chromepet', waitSaved: 'Wait Saved: 6 mins' },
    { id: 2, date: 'Yesterday, 06:15 PM', route: 'Chromepet → Tambaram', waitSaved: 'Wait Saved: 4 mins' },
  ];

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.users.getProfile();
      if (response.data.success) {
        const user = response.data.data;
        setFullName(user.name || '');
        setEmail(user.email || '');
        setPhone(user.phone || '');
        setSavedRoutes((user.favouriteGates || []).map((gate) => ({
          id: gate._id || gate,
          from: gate.gateName || gate.gateCode || 'Saved gate',
          to: gate.address || gate.city || 'Railway crossing',
          alertsEnabled: user.notificationEnabled !== false,
        })));
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      Alert.alert('Error', 'Failed to load profile details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      Alert.alert('Validation Error', 'Full Name is required.');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Validation Error', 'Email Address is required.');
      return;
    }

    try {
      setLoading(true);
      const response = await api.users.updateProfile({
        name: fullName.trim(),
        email: email.trim(),
      });

      if (response.data.success) {
        setIsEditing(false);
        Alert.alert('Profile Saved', 'Your profile details have been successfully updated.');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update profile details.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await api.auth.logout();
    reset('LOGIN');
  };

  const handleDeleteAccount = () => {
    Alert.alert('Account deletion unavailable', 'The backend does not provide an account deletion endpoint yet.');
  };

  if (loading && !isEditing) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#0F766E" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Profile Pic & Header Card (Light Mode) */}
        <View style={styles.headerCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarOutline}>
              <FontAwesome5 name="user" size={40} color="#0F766E" />
            </View>
            <TouchableOpacity 
              style={styles.avatarEditBadge}
              onPress={() => Alert.alert('Upload Photo', 'Choose profile image source.')}
            >
              <Feather name="camera" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.headerName}>{fullName}</Text>
          <Text style={styles.headerEmail}>{email}</Text>
        </View>

        {/* Profile Settings Section */}
        <Text style={styles.sectionTitle}>Profile Details</Text>
        <View style={styles.detailsGroup}>
          
          {/* Full Name field */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Full Name</Text>
            {isEditing ? (
              <TextInput
                style={styles.infoInput}
                value={fullName}
                onChangeText={setFullName}
              />
            ) : (
              <Text style={styles.infoValue}>{fullName}</Text>
            )}
          </View>

          {/* Email Address field */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email Address</Text>
            {isEditing ? (
              <TextInput
                style={styles.infoInput}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            ) : (
              <Text style={styles.infoValue}>{email}</Text>
            )}
          </View>

          {/* Mobile Number field */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Mobile Number</Text>
            {isEditing ? (
              <TextInput
                style={styles.infoInput}
                value={phone}
                keyboardType="phone-pad"
                editable={false}
              />
            ) : (
              <Text style={styles.infoValue}>{phone}</Text>
            )}
          </View>

          {/* Edit / Change Password Actions */}
          <View style={styles.actionsRow}>
            {isEditing ? (
              <TouchableOpacity style={styles.primaryActionBtn} onPress={handleSaveProfile}>
                <Feather name="check-circle" size={16} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.primaryActionBtnText}>Save Info</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.primaryActionBtn} onPress={() => setIsEditing(true)}>
                <Feather name="edit" size={16} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.primaryActionBtnText}>Edit Profile</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={styles.secondaryActionBtn} 
              onPress={() => Alert.alert('Change Password', 'Enter your current and new password.')}
            >
              <Feather name="lock" size={16} color="#0F766E" style={{ marginRight: 6 }} />
              <Text style={styles.secondaryActionBtnText}>Password</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Saved Routes (Tambaram -> Chrompet) */}
        <Text style={styles.sectionTitle}>Saved Routes</Text>
        <View style={styles.detailsGroup}>
          {savedRoutes.map((route) => (
            <View key={route.id} style={styles.routeItem}>
              <View style={styles.routeTextCol}>
                <MaterialIcons name="navigation" size={16} color="#0F766E" style={{ marginRight: 8 }} />
                <Text style={styles.routeTitle}>{route.from} → {route.to}</Text>
              </View>
              <TouchableOpacity 
                style={[styles.routeBadge, route.alertsEnabled ? styles.badgeActive : styles.badgeMuted]}
                onPress={() => {
                  const updated = savedRoutes.map(r => r.id === route.id ? { ...r, alertsEnabled: !r.alertsEnabled } : r);
                  setSavedRoutes(updated);
                }}
              >
                <Text style={[styles.routeBadgeText, route.alertsEnabled ? styles.badgeTextActive : styles.badgeTextMuted]}>
                  {route.alertsEnabled ? 'Alerts On' : 'Alerts Off'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Travel History Log */}
        <Text style={styles.sectionTitle}>Recent Travel History</Text>
        <View style={styles.detailsGroup}>
          {travelHistory.map((item) => (
            <View key={item.id} style={styles.historyItem}>
              <View>
                <Text style={styles.historyRoute}>{item.route}</Text>
                <Text style={styles.historyDate}>{item.date}</Text>
              </View>
              <Text style={styles.historyWait}>{item.waitSaved}</Text>
            </View>
          ))}
        </View>

        {/* Account Controls */}
        <Text style={styles.sectionTitle}>Account Security</Text>
        <View style={styles.detailsGroup}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Feather name="log-out" size={18} color="#475569" style={{ marginRight: 10 }} />
            <Text style={styles.logoutBtnText}>Sign Out Account</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount}>
            <Feather name="trash-2" size={18} color="#EF4444" style={{ marginRight: 10 }} />
            <Text style={styles.deleteBtnText}>Delete My Account</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC', // Strictly Light Theme after login
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  headerCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
    ...SHADOWS.sm,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarOutline: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0F766E', // Accent Teal
  },
  avatarEditBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#0F766E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  headerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  headerEmail: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
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
  detailsGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 24,
    ...SHADOWS.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '700',
  },
  infoInput: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '700',
    borderBottomWidth: 1,
    borderBottomColor: '#0F766E',
    paddingVertical: 2,
    width: '60%',
    textAlign: 'right',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  primaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#0F766E',
    height: 38,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  primaryActionBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 118, 110, 0.1)',
    height: 38,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    borderWidth: 1,
    borderColor: 'rgba(15, 118, 110, 0.2)',
  },
  secondaryActionBtnText: {
    color: '#0F766E',
    fontSize: 12,
    fontWeight: 'bold',
  },
  routeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  routeTextCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  routeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  badgeMuted: {
    backgroundColor: '#F1F5F9',
  },
  routeBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  badgeTextActive: {
    color: '#10B981',
  },
  badgeTextMuted: {
    color: '#94A3B8',
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  historyRoute: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  historyDate: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  historyWait: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  logoutBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#475569',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  deleteBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#EF4444',
  },
});
