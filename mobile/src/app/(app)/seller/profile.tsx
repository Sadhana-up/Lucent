import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { C, F, R } from '../../../components/lucent/theme';
import { api, resolveImageUrl } from '../../../lib/api';
import { SellerProfile } from '../../../lib/types';

type ImageKind = 'logo' | 'banner';

export default function SellerProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<ImageKind | null>(null);
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [error, setError] = useState('');

  const [storeName, setStoreName] = useState('');
  const [bio, setBio] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [logo, setLogo] = useState('');
  const [banner, setBanner] = useState('');

  useEffect(() => {
    let mounted = true;
    api.getSellerProfile().then((res) => {
      if (!mounted) return;
      if (res.data) {
        setProfile(res.data);
        setStoreName(res.data.storeName || '');
        setBio(res.data.bio || '');
        setContactEmail(res.data.contactEmail || '');
        setPhone(res.data.phone || '');
        setLogo(res.data.logo || '');
        setBanner(res.data.banner || '');
      } else if (res.error) {
        setError(res.error);
      }
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const pickImage = async (kind: ImageKind) => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission Needed', 'Please allow photo library access to upload store images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: kind === 'logo' ? [1, 1] : [3, 1],
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    setUploading(kind);
    setError('');
    try {
      const formData = new FormData();
      const file = {
        uri: asset.uri,
        name: asset.fileName || `seller-${kind}-${Date.now()}.jpg`,
        type: asset.mimeType || 'image/jpeg',
      } as unknown as Blob;
      formData.append('file', file);
      const res = await api.uploadImage(formData);
      if (res.error) {
        setError(res.error);
      } else if (res.data?.url) {
        if (kind === 'logo') setLogo(res.data.url);
        else setBanner(res.data.url);
      }
    } catch {
      setError('Could not upload this image. Please try again.');
    } finally {
      setUploading(null);
    }
  };

  const handleSave = async () => {
    setError('');
    if (!storeName.trim()) {
      setError('Store name is required.');
      return;
    }

    setSaving(true);
    try {
      const res = await api.updateSellerProfile({
        storeName: storeName.trim(),
        bio: bio.trim(),
        contactEmail: contactEmail.trim(),
        phone: phone.trim(),
        logo: logo.trim(),
        banner: banner.trim(),
      });
      if (res.error) {
        setError(res.error);
        return;
      }
      if (res.data) {
        setProfile(res.data);
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        Alert.alert('Store saved', 'Your storefront settings are up to date.', [
          { text: 'Done', onPress: () => router.back() },
        ]);
      }
    } catch {
      setError('Could not save store settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(app)/(tabs)/dashboard'))}
          hitSlop={10}
          style={s.backBtn}
        >
          <Feather name="arrow-left" size={20} color={C.ink} />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={s.eyebrow}>SELLER HUB</Text>
          <Text style={s.title}>Store Settings</Text>
        </View>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={C.sage} />
        </View>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: insets.bottom + 32 }}
          >
            {profile ? (
              <View style={s.statusCard}>
                <View style={{ flex: 1 }}>
                  <Text style={s.statusTitle}>{profile.storeName}</Text>
                  <Text style={s.statusSub}>lucent.app/shop/{profile.storeSlug}</Text>
                </View>
                <View style={[s.badge, profile.isVerified ? s.badgeVerified : s.badgePending]}>
                  <Feather
                    name={profile.isVerified ? 'check-circle' : 'clock'}
                    size={11}
                    color={profile.isVerified ? C.sage : '#B45309'}
                  />
                  <Text style={[s.badgeText, { color: profile.isVerified ? C.sage : '#B45309' }]}>
                    {profile.isVerified ? 'VERIFIED' : 'PENDING'}
                  </Text>
                </View>
              </View>
            ) : null}

            <Text style={s.label}>STORE NAME *</Text>
            <TextInput
              style={s.input}
              value={storeName}
              onChangeText={setStoreName}
              placeholder="e.g. Pure Botanicals Skincare"
              placeholderTextColor="#9EA3AF"
            />

            <Text style={s.label}>STORE BIO</Text>
            <TextInput
              style={[s.input, s.textArea]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell customers about your formulations and story."
              placeholderTextColor="#9EA3AF"
              multiline
              textAlignVertical="top"
            />

            <Text style={s.label}>SUPPORT EMAIL</Text>
            <TextInput
              style={s.input}
              value={contactEmail}
              onChangeText={setContactEmail}
              placeholder="support@yourbrand.com"
              placeholderTextColor="#9EA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={s.label}>CONTACT PHONE</Text>
            <TextInput
              style={s.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+977-98XXXXXXXX"
              placeholderTextColor="#9EA3AF"
              keyboardType="phone-pad"
            />

            <View style={s.imageCard}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={s.imageTitle}>Brand avatar</Text>
                <Text style={s.imageSub}>Square logo shown on product cards and receipts.</Text>
              </View>
              <Pressable style={s.imageBox} onPress={() => void pickImage('logo')} disabled={uploading !== null}>
                {uploading === 'logo' ? (
                  <ActivityIndicator color={C.sage} />
                ) : logo ? (
                  <Image alt="" source={{ uri: resolveImageUrl(logo) }} style={s.image} />
                ) : (
                  <Feather name="image" size={20} color={C.sage} />
                )}
              </Pressable>
            </View>

            <View style={s.imageCard}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={s.imageTitle}>Storefront banner</Text>
                <Text style={s.imageSub}>Wide cover image shown on your public shop page.</Text>
              </View>
              <Pressable style={[s.imageBox, s.bannerBox]} onPress={() => void pickImage('banner')} disabled={uploading !== null}>
                {uploading === 'banner' ? (
                  <ActivityIndicator color={C.sage} />
                ) : banner ? (
                  <Image alt="" source={{ uri: resolveImageUrl(banner) }} style={s.image} />
                ) : (
                  <Feather name="image" size={20} color={C.sage} />
                )}
              </Pressable>
            </View>

            {error ? <Text style={s.error}>{error}</Text> : null}

            <Pressable
              style={[s.saveBtn, saving && { opacity: 0.6 }]}
              disabled={saving}
              onPress={handleSave}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="save" size={15} color="#FFFFFF" />
                  <Text style={s.saveText}>Save Store Settings</Text>
                </>
              )}
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.cream },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 12 },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#ECE5DB',
  },
  eyebrow: { fontFamily: F.mono, fontSize: 10, letterSpacing: 2, color: C.sage, fontWeight: '600' },
  title: { fontFamily: F.serifBold, fontSize: 24, color: C.ink },
  statusCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    borderRadius: 14, padding: 13, marginBottom: 16, borderWidth: 1, borderColor: '#ECE5DB',
  },
  statusTitle: { fontFamily: F.serifBold, fontSize: 17, color: C.ink },
  statusSub: { fontFamily: F.sansRegular, fontSize: 11.5, color: C.muted, marginTop: 2 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: R.pill },
  badgeVerified: { backgroundColor: '#EDF5EF' },
  badgePending: { backgroundColor: '#FEF3C7' },
  badgeText: { fontFamily: F.mono, fontSize: 9, fontWeight: '700' },
  label: { fontFamily: F.mono, fontSize: 9.5, letterSpacing: 1.2, color: C.muted, fontWeight: '700', marginBottom: 5, marginTop: 12 },
  input: {
    borderWidth: 1, borderColor: '#E8E2D8', borderRadius: 12, minHeight: 44,
    paddingHorizontal: 12, paddingVertical: 10, fontFamily: F.sansRegular, fontSize: 13,
    color: C.ink, backgroundColor: '#FFFFFF',
  },
  textArea: { minHeight: 100 },
  imageCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    borderRadius: 14, padding: 12, marginTop: 12, borderWidth: 1, borderColor: '#ECE5DB',
  },
  imageTitle: { fontFamily: F.sans, fontSize: 13, color: C.ink, fontWeight: '600' },
  imageSub: { fontFamily: F.sansRegular, fontSize: 11, color: C.muted, marginTop: 2, lineHeight: 15 },
  imageBox: {
    width: 56, height: 56, borderRadius: 12, backgroundColor: '#F3EFEA',
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1, borderColor: '#E8E2D8',
  },
  bannerBox: { width: 84, height: 56 },
  image: { width: '100%', height: '100%' },
  error: {
    fontFamily: F.sansRegular, fontSize: 12.5, color: C.danger, backgroundColor: '#FDECEC',
    borderRadius: 10, padding: 10, marginTop: 14,
  },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.sage, height: 50, borderRadius: 14, marginTop: 20,
  },
  saveText: { fontFamily: F.sans, fontSize: 14, color: '#FFFFFF', fontWeight: '700' },
});
