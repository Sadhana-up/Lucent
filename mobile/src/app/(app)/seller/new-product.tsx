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
import { C, F, R } from '../../../components/lucent/theme';
import { api, resolveImageUrl } from '../../../lib/api';
import { Category } from '../../../lib/types';

const SKIN_OPTIONS = ['All Skin Types', 'Oily', 'Dry', 'Combination', 'Sensitive', 'Normal'];

export default function NewProductScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [sellerVerified, setSellerVerified] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [stock, setStock] = useState('20');
  const [categoryId, setCategoryId] = useState('');
  const [skinType, setSkinType] = useState('All Skin Types');
  const [skinConcerns, setSkinConcerns] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [usageInstructions, setUsageInstructions] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.getCategories(), api.getSellerProfile()]).then(([catRes, profRes]) => {
      if (catRes.data) setCategories(catRes.data);
      if (profRes.data) setSellerVerified(Boolean(profRes.data.isVerified));
    });
  }, []);

  const handlePickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission Needed', 'Please allow photo library access to upload a product image.');
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
    setError('');

    try {
      const formData = new FormData();
      const filename = asset.fileName || `product-${Date.now()}.jpg`;
      const mimeType = asset.mimeType || 'image/jpeg';
      formData.append('file', {
        uri: asset.uri,
        name: filename,
        type: mimeType,
      } as any);

      const res = await api.uploadImage(formData);
      if (res.error) {
        setError(res.error);
      } else if (res.data?.url) {
        setImageUrl(res.data.url);
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to upload image.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setError('');
    if (!title.trim() || !description.trim() || !price.trim()) {
      setError('Title, description, and price are required.');
      return;
    }

    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      setError('Please enter a valid price in NPR.');
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        title: title.trim(),
        description: description.trim(),
        price: numPrice,
        discountPrice: discountPrice.trim() ? parseFloat(discountPrice) : undefined,
        stock: parseInt(stock, 10) || 0,
        categoryId: categoryId || undefined,
        skinType: skinType || undefined,
        skinConcerns: skinConcerns.trim() || undefined,
        ingredients: ingredients.trim() || undefined,
        usageInstructions: usageInstructions.trim() || undefined,
        status: sellerVerified ? 'ACTIVE' : 'DRAFT',
      };

      if (imageUrl.trim()) {
        payload.images = [imageUrl.trim()];
      }

      const res = await api.createProduct(payload);

      if (res.error) {
        setError(res.error);
        return;
      }

      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      router.back();
    } catch (e: any) {
      setError(e?.message || 'Failed to create formulation.');
    } finally {
      setSaving(false);
    }
  };

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
          <Text style={s.eyebrow}>APOTHECARY INVENTORY</Text>
          <Text style={s.title}>Add New Formulation</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 40 }}
      >
        {!sellerVerified && (
          <View style={s.verifyBanner}>
            <Feather name="info" size={16} color="#92400E" />
            <Text style={s.verifyBannerText}>
              Your store is pending verification. New formulations will be saved as Draft until verified.
            </Text>
          </View>
        )}

        <Text style={s.label}>FORMULATION TITLE *</Text>
        <TextInput
          style={s.input}
          placeholder="e.g. Himalayan Bakuchiol Restorative Serum"
          placeholderTextColor="#9EA3AF"
          value={title}
          onChangeText={setTitle}
        />

        <Text style={s.label}>DESCRIPTION *</Text>
        <TextInput
          style={[s.input, s.textArea]}
          multiline
          numberOfLines={4}
          placeholder="Describe the therapeutic benefits, botanical extracts, and textures..."
          placeholderTextColor="#9EA3AF"
          value={description}
          onChangeText={setDescription}
        />

        <View style={s.row}>
          <View style={{ flex: 1 }}>
            <Text style={s.label}>PRICE (RS.) *</Text>
            <TextInput
              style={s.input}
              keyboardType="numeric"
              placeholder="1850"
              placeholderTextColor="#9EA3AF"
              value={price}
              onChangeText={setPrice}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={s.label}>DISCOUNT PRICE (OPTIONAL)</Text>
            <TextInput
              style={s.input}
              keyboardType="numeric"
              placeholder="1650"
              placeholderTextColor="#9EA3AF"
              value={discountPrice}
              onChangeText={setDiscountPrice}
            />
          </View>
        </View>

        <View style={s.row}>
          <View style={{ flex: 1 }}>
            <Text style={s.label}>INVENTORY STOCK</Text>
            <TextInput
              style={s.input}
              keyboardType="numeric"
              placeholder="25"
              placeholderTextColor="#9EA3AF"
              value={stock}
              onChangeText={setStock}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={s.label}>PRODUCT IMAGE</Text>
            <Pressable style={s.uploadBtn} onPress={handlePickImage} disabled={uploading}>
              {uploading ? (
                <ActivityIndicator size="small" color={C.sage} />
              ) : (
                <>
                  <Feather name="upload" size={15} color={C.sage} />
                  <Text style={s.uploadBtnText}>{imageUrl ? 'Replace Photo' : 'Upload Photo'}</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>

        {!!imageUrl && (
          <View style={s.previewBox}>
            <Image source={{ uri: resolveImageUrl(imageUrl) }} style={s.previewImg} resizeMode="cover" />
            <Text style={s.previewUrl} numberOfLines={1}>{imageUrl}</Text>
            <Pressable onPress={() => setImageUrl('')} hitSlop={8}>
              <Feather name="x" size={16} color={C.danger} />
            </Pressable>
          </View>
        )}

        <Text style={s.label}>CATEGORY</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          <View style={s.pillRow}>
            {categories.map((c) => {
              const sel = categoryId === c.id;
              return (
                <Pressable
                  key={c.id}
                  style={[s.pill, sel && s.pillActive]}
                  onPress={() => setCategoryId(sel ? '' : c.id)}
                >
                  <Text style={[s.pillText, sel && s.pillTextActive]}>{c.name}</Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <Text style={s.label}>SKIN TYPE COMPATIBILITY</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          <View style={s.pillRow}>
            {SKIN_OPTIONS.map((st) => {
              const sel = skinType === st;
              return (
                <Pressable
                  key={st}
                  style={[s.pill, sel && s.pillActive]}
                  onPress={() => setSkinType(st)}
                >
                  <Text style={[s.pillText, sel && s.pillTextActive]}>{st}</Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <Text style={s.label}>TARGETED SKIN CONCERNS</Text>
        <TextInput
          style={s.input}
          placeholder="e.g. Hyperpigmentation, Dehydration, Barrier Redness"
          placeholderTextColor="#9EA3AF"
          value={skinConcerns}
          onChangeText={setSkinConcerns}
        />

        <Text style={s.label}>BOTANICAL INGREDIENTS LIST</Text>
        <TextInput
          style={[s.input, s.textArea]}
          multiline
          numberOfLines={3}
          placeholder="e.g. Bakuchiol (1%), Niacinamide (5%), Centella Asiatica, Squalane..."
          placeholderTextColor="#9EA3AF"
          value={ingredients}
          onChangeText={setIngredients}
        />

        <Text style={s.label}>APPLICATION RITUAL</Text>
        <TextInput
          style={[s.input, s.textArea]}
          multiline
          numberOfLines={3}
          placeholder="e.g. Warm 3-4 drops between fingertips, gently press into clean skin morning & evening."
          placeholderTextColor="#9EA3AF"
          value={usageInstructions}
          onChangeText={setUsageInstructions}
        />

        {error ? (
          <View style={s.errorBox}>
            <Feather name="alert-circle" size={16} color={C.danger} />
            <Text style={s.errorText}>{error}</Text>
          </View>
        ) : null}

        <Pressable
          style={[s.saveBtn, saving && { opacity: 0.7 }]}
          disabled={saving}
          onPress={handleSave}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={s.saveBtnText}>
              {sellerVerified ? 'Publish Formulation to Store' : 'Save as Draft'}
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.cream },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#ECE5DB',
  },
  eyebrow: { fontFamily: F.mono, fontSize: 9.5, letterSpacing: 1.5, color: C.sage, fontWeight: '600' },
  title: { fontFamily: F.serifBold, fontSize: 24, color: C.ink },
  verifyBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF3C7',
    padding: 12, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#FDE68A',
  },
  verifyBannerText: { flex: 1, fontFamily: F.sansRegular, fontSize: 12, color: '#92400E', lineHeight: 17 },
  label: {
    fontFamily: F.mono, fontSize: 10, letterSpacing: 1.5, color: C.muted,
    fontWeight: '700', marginTop: 14, marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8E2D8', borderRadius: 14,
    paddingHorizontal: 14, height: 46, fontFamily: F.sansRegular, fontSize: 13, color: C.ink,
  },
  textArea: { height: 85, paddingVertical: 10, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 12 },
  uploadBtn: {
    backgroundColor: '#EDF5EF', borderWidth: 1, borderColor: C.sage, borderRadius: 14,
    height: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  uploadBtnText: { fontFamily: F.sans, fontSize: 13, color: C.sage, fontWeight: '600' },
  previewBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFFFFF',
    borderRadius: 12, padding: 8, marginTop: 10, borderWidth: 1, borderColor: '#ECE5DB',
  },
  previewImg: { width: 44, height: 44, borderRadius: 8, backgroundColor: '#F3EFEA' },
  previewUrl: { flex: 1, fontFamily: F.sansRegular, fontSize: 12, color: C.ink2 },
  pillRow: { flexDirection: 'row', gap: 8 },
  pill: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: R.pill,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8E2D8',
  },
  pillActive: { backgroundColor: C.sage, borderColor: C.sage },
  pillText: { fontFamily: F.sans, fontSize: 12, color: C.ink2 },
  pillTextActive: { color: '#FFFFFF', fontWeight: '600' },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FDECEC',
    padding: 12, borderRadius: 12, marginTop: 14,
  },
  errorText: { color: C.danger, fontFamily: F.sansRegular, fontSize: 12.5, flex: 1 },
  saveBtn: {
    backgroundColor: C.sage, height: 50, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', marginTop: 22,
  },
  saveBtnText: { color: '#FFFFFF', fontFamily: F.sans, fontSize: 14, fontWeight: '600' },
});
