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
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { C, F, R } from '../../components/lucent/theme';
import { api, resolveImageUrl } from '../../lib/api';

const SKIN_TYPES = ['Normal', 'Oily', 'Dry', 'Combination', 'Sensitive', 'Acne-Prone'];
const SKIN_CONCERNS = [
  'Acne',
  'Dryness',
  'Hyperpigmentation',
  'Redness',
  'Fine Lines',
  'Pores',
  'Dullness',
  'Oil Control',
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [image, setImage] = useState('');
  const [skinType, setSkinType] = useState('');
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([]);

  useEffect(() => {
    api.getProfile().then((res) => {
      if (res.data) {
        setName(res.data.name || '');
        setEmail(res.data.email || '');
        setImage(res.data.image || '');
        setSkinType(res.data.skinType || '');
        if (res.data.skinConcerns) {
          setSelectedConcerns(
            res.data.skinConcerns.split(',').map((s) => s.trim()).filter(Boolean)
          );
        }
      }
      setLoading(false);
    });
  }, []);

  const toggleConcern = (concern: string) => {
    void Haptics.selectionAsync().catch(() => {});
    setSelectedConcerns((prev) =>
      prev.includes(concern) ? prev.filter((c) => c !== concern) : [...prev, concern]
    );
  };

  const handlePickAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission Needed', 'Please allow photo library access to update your avatar.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        name: asset.fileName || `avatar-${Date.now()}.jpg`,
        type: asset.mimeType || 'image/jpeg',
      } as any);

      const res = await api.uploadImage(formData);
      if (res.error) Alert.alert('Upload Failed', res.error);
      else if (res.data?.url) setImage(res.data.url);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to upload avatar.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Name Required', 'Please enter your name.');
      return;
    }
    setSaving(true);
    try {
      const res = await api.updateProfile({
        name: name.trim(),
        image: image || undefined,
        skinType: skinType || undefined,
        skinConcerns: selectedConcerns.join(', '),
        onboardingCompleted: true,
      });
      if (res.error) {
        Alert.alert('Save Failed', res.error);
        return;
      }
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[s.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={C.sage} />
      </View>
    );
  }

  const initial = name.trim()?.[0]?.toUpperCase() || email?.[0]?.toUpperCase() || 'L';

  return (
    <KeyboardAvoidingView
      style={[s.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={s.header}>
        <Pressable style={s.backBtn} onPress={() => router.back()} hitSlop={10}>
          <Feather name="arrow-left" size={20} color={C.ink} />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={s.eyebrow}>ACCOUNT & SKIN PROFILE</Text>
          <Text style={s.title}>Edit Profile</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 40 }}
      >
        <View style={s.avatarSection}>
          <Pressable style={s.avatarCircle} onPress={handlePickAvatar} disabled={uploading}>
            {image ? (
              <Image source={{ uri: resolveImageUrl(image) }} style={s.avatarImg} />
            ) : (
              <Text style={s.avatarInitial}>{initial}</Text>
            )}
            <View style={s.cameraBadge}>
              {uploading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Feather name="camera" size={12} color="#FFFFFF" />
              )}
            </View>
          </Pressable>
          <Text style={s.emailText}>{email}</Text>
        </View>

        <Text style={s.label}>FULL NAME</Text>
        <TextInput
          style={s.input}
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          placeholderTextColor="#9EA3AF"
        />

        <Text style={s.label}>SKIN TYPE</Text>
        <View style={s.pillWrap}>
          {SKIN_TYPES.map((st) => {
            const sel = skinType === st;
            return (
              <Pressable
                key={st}
                style={[s.pill, sel && s.pillActive]}
                onPress={() => {
                  void Haptics.selectionAsync().catch(() => {});
                  setSkinType(st);
                }}
              >
                <Text style={[s.pillText, sel && s.pillTextActive]}>{st}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={s.label}>SKIN CONCERNS</Text>
        <View style={s.pillWrap}>
          {SKIN_CONCERNS.map((c) => {
            const sel = selectedConcerns.includes(c);
            return (
              <Pressable key={c} style={[s.pill, sel && s.pillActive]} onPress={() => toggleConcern(c)}>
                <Text style={[s.pillText, sel && s.pillTextActive]}>{c}</Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable style={[s.saveBtn, saving && { opacity: 0.7 }]} disabled={saving} onPress={handleSave}>
          {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={s.saveBtnText}>Save Profile</Text>}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.cream },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.cream },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#ECE5DB',
  },
  eyebrow: { fontFamily: F.mono, fontSize: 9.5, letterSpacing: 1.5, color: C.sage, fontWeight: '600' },
  title: { fontFamily: F.serifBold, fontSize: 24, color: C.ink },
  avatarSection: { alignItems: 'center', marginVertical: 18 },
  avatarCircle: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: C.sage,
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  avatarImg: { width: 88, height: 88, borderRadius: 44 },
  avatarInitial: { fontFamily: F.serifBold, fontSize: 34, color: '#FFFFFF' },
  cameraBadge: {
    position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14,
    backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: C.cream,
  },
  emailText: { fontFamily: F.sansRegular, fontSize: 13, color: C.ink2, marginTop: 10 },
  label: {
    fontFamily: F.mono, fontSize: 10, letterSpacing: 1.5, color: C.muted,
    fontWeight: '700', marginTop: 18, marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8E2D8', borderRadius: 14,
    paddingHorizontal: 14, height: 48, fontFamily: F.sansRegular, fontSize: 14, color: C.ink,
  },
  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: R.pill,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8E2D8',
  },
  pillActive: { backgroundColor: C.sage, borderColor: C.sage },
  pillText: { fontFamily: F.sans, fontSize: 12.5, color: C.ink2 },
  pillTextActive: { color: '#FFFFFF', fontWeight: '600' },
  saveBtn: {
    backgroundColor: C.sage, height: 50, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', marginTop: 28,
  },
  saveBtnText: { color: '#FFFFFF', fontFamily: F.sans, fontSize: 14.5, fontWeight: '600' },
});
