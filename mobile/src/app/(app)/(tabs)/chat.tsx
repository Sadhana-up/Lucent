import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
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
import { API_URL } from '../../../lib/auth-client';
import { useCart } from '../../../lib/cart-context';
import { api, formatCurrency, resolveImageUrl } from '../../../lib/api';
import { parseMessageMarkdown, productSlugFromHref } from '../../../lib/markdown';
import { Product } from '../../../lib/types';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  reasoning?: string;
  reasoningOpen?: boolean;
  streaming?: boolean;
  images?: string[];
  timestamp: string;
}

interface PendingImage {
  uri: string;
  mime_type: string;
  data: string;
}

const MAX_IMAGES = 3;

const QUICK_PROMPTS = [
  'How do I repair a damaged skin barrier?',
  'Best morning routine for combination skin',
  'Can I combine Niacinamide with Vitamin C?',
  'Recommend soothing botanicals for acne',
];

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const listRef = useRef<FlatList>(null);
  const turnRef = useRef(0);

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewSlug, setPreviewSlug] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Namaste! I am Lucent’s Botanical Intelligence. How may I assist your skincare ritual today? You can ask me about ingredients, pH balance, or routines tailored to Nepal’s climate.',
      timestamp: 'Just now',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<PendingImage[]>([]);

  const addAssets = (assets: ImagePicker.ImagePickerAsset[]) => {
    const picked: PendingImage[] = [];
    for (const asset of assets) {
      if (!asset.base64) continue;
      picked.push({
        uri: asset.uri,
        // Picker base64 is JPEG unless it reports a non-HEIC image type.
        mime_type: asset.mimeType?.startsWith('image/') && asset.mimeType !== 'image/heic' ? asset.mimeType : 'image/jpeg',
        data: asset.base64,
      });
    }
    setAttachments((prev) => [...prev, ...picked].slice(0, MAX_IMAGES));
  };

  const pickFromLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: Math.max(1, MAX_IMAGES - attachments.length),
        base64: true,
        quality: 0.7,
      });
      if (!result.canceled) addAssets(result.assets);
    } catch {
      Alert.alert('Could not open photos', 'Please try again.');
    }
  };

  const takePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        if (!permission.canAskAgain) {
          Alert.alert('Camera access needed', 'Enable camera access in Settings to take a photo.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]);
        }
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        cameraType: ImagePicker.CameraType.back,
        base64: true,
        quality: 0.7,
      });
      if (!result.canceled) addAssets(result.assets);
    } catch {
      Alert.alert('Could not open camera', 'Please try again.');
    }
  };

  const openImageOptions = () => {
    if (attachments.length >= MAX_IMAGES) return;
    Alert.alert('Add a photo', undefined, [
      { text: 'Take photo', onPress: () => void takePhoto() },
      { text: 'Choose from library', onPress: () => void pickFromLibrary() },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const toggleReasoning = (id: string) =>
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, reasoningOpen: !m.reasoningOpen } : m)));

  const openLink = (href: string) => {
    const slug = productSlugFromHref(href);
    if (slug) {
      setPreviewSlug(slug);
      return;
    }
    void Linking.openURL(href.startsWith('http') ? href : `${API_URL}${href}`).catch(() => {});
  };

  const sendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    const images = attachments;
    if ((!text && images.length === 0) || loading) return;

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setInputText('');
    setAttachments([]);

    const turn = ++turnRef.current;
    const userMsg: ChatMessage = {
      id: `user-${turn}`,
      sender: 'user',
      text: text || `${images.length} photo${images.length > 1 ? 's' : ''} shared`,
      images: images.length ? images.map((img) => img.uri) : undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const botId = `bot-${turn}`;
    const botMsg: ChatMessage = {
      id: botId,
      sender: 'assistant',
      text: '',
      streaming: true,
      reasoningOpen: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg, botMsg]);
    setLoading(true);

    const updateBot = (fn: (m: ChatMessage) => Partial<ChatMessage>) =>
      setMessages((prev) => prev.map((m) => (m.id === botId ? { ...m, ...fn(m) } : m)));

    try {
      const { error } = await api.streamChatMessage(
        text || 'Please analyze these images and recommend a skincare routine.',
        sessionId,
        {
          onSession: setSessionId,
          onReasoning: (chunk) => updateBot((m) => ({ reasoning: (m.reasoning ?? '') + chunk })),
          onAnswer: (chunk) => updateBot((m) => ({ text: m.text + chunk })),
        },
        images.map(({ mime_type, data }) => ({ mime_type, data }))
      );

      if (error) updateBot((m) => ({ text: m.text || `⚠ ${error}` }));
      else updateBot((m) => ({ text: m.text || '⚠ The assistant returned an empty response.' }));
    } finally {
      updateBot(() => ({ streaming: false }));
      setLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.sender === 'user';
    if (!isUser && !item.text && !item.reasoning) return null;
    return (
      <View style={[s.msgWrapper, isUser ? s.msgUserWrapper : s.msgBotWrapper]}>
        {!isUser && (
          <View style={s.botAvatar}>
            <Feather name="droplet" size={14} color={C.sage} />
          </View>
        )}
        <View style={[s.msgBubble, isUser ? s.msgUserBubble : s.msgBotBubble]}>
          {!!item.images?.length && (
            <View style={s.msgImages}>
              {item.images.map((uri) => (
                <Pressable
                  key={uri}
                  onPress={() => setPreviewImage(uri)}
                  accessibilityLabel="View attached photo"
                  accessibilityRole="imagebutton"
                >
                  <Image source={{ uri }} style={s.msgImage} alt="Attached photo" />
                </Pressable>
              ))}
            </View>
          )}
          {!isUser && !!item.reasoning && (
            <View style={s.reasoningBlock}>
              <Pressable style={s.reasoningHeader} onPress={() => toggleReasoning(item.id)}>
                {item.streaming && !item.text ? (
                  <ActivityIndicator size="small" color={C.sage} style={s.reasoningSpinner} />
                ) : (
                  <Feather name="zap" size={11} color={C.sage} />
                )}
                <Text style={s.reasoningLabel}>
                  {item.streaming && !item.text ? 'THINKING…' : 'THOUGHT PROCESS'}
                </Text>
                <Feather name={item.reasoningOpen ? 'chevron-up' : 'chevron-down'} size={12} color={C.muted} />
              </Pressable>
              {!!item.reasoningOpen && <Text style={s.reasoningText}>{item.reasoning}</Text>}
            </View>
          )}
          {!!item.text && (
            <Text style={[s.msgText, isUser ? s.msgUserText : s.msgBotText]}>
              {parseMessageMarkdown(item.text).map((token, i) => {
                if (token.type === 'link') {
                  return (
                    <Text
                      key={i}
                      style={[s.msgLink, token.bold && s.msgBold]}
                      onPress={() => openLink(token.href)}
                      accessibilityRole="link"
                    >
                      {token.text}
                    </Text>
                  );
                }
                return (
                  <Text key={i} style={token.bold ? s.msgBold : undefined}>
                    {token.text}
                  </Text>
                );
              })}
            </Text>
          )}
          {!!item.text && (
            <Text style={[s.timestamp, isUser ? s.timestampUser : s.timestampBot]}>
              {item.timestamp}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const lastMessage = messages[messages.length - 1];
  const showTyping = loading && !lastMessage?.text && !lastMessage?.reasoning;

  return (
    <KeyboardAvoidingView
      style={[s.root, { paddingTop: insets.top }]}
      behavior="padding"
    >
      {/* Top Header */}
      <View style={s.header}>
        <View>
          <Text style={s.eyebrow}>AI DERMATOLOGICAL ADVISOR</Text>
          <Text style={s.title}>Botanical Intelligence</Text>
        </View>
        <Pressable
          style={s.clearBtn}
          onPress={() => {
            setMessages([
              {
                id: 'welcome',
                sender: 'assistant',
                text: 'Chat history cleared. How can I help with your skincare today?',
                timestamp: 'Just now',
              },
            ]);
            setSessionId(null);
            setAttachments([]);
          }}
        >
          <Feather name="refresh-cw" size={14} color={C.ink2} />
        </Pressable>
      </View>

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => {
          if (loading) listRef.current?.scrollToEnd({ animated: false });
        }}
        ListFooterComponent={
          showTyping ? (
            <View style={s.typingIndicator}>
              <View style={s.botAvatar}>
                <Feather name="droplet" size={14} color={C.sage} />
              </View>
              <View style={s.typingBubble}>
                <ActivityIndicator size="small" color={C.sage} />
                <Text style={s.typingText}>Analyzing formulations...</Text>
              </View>
            </View>
          ) : undefined
        }
      />

      {/* Prompt Suggestions */}
      {messages.length <= 2 && (
        <View style={s.suggestionsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.suggestionsList}>
            {QUICK_PROMPTS.map((prompt, i) => (
              <Pressable
                key={i}
                style={s.promptChip}
                onPress={() => sendMessage(prompt)}
              >
                <Feather name="zap" size={12} color={C.sage} />
                <Text style={s.promptChipText}>{prompt}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Attachments */}
      {attachments.length > 0 && (
        <View style={s.attachmentRow}>
          {attachments.map((img) => (
            <View key={img.uri} style={s.attachmentWrap}>
              <Image source={{ uri: img.uri }} style={s.attachmentImage} alt="Selected photo" />
              <Pressable
                style={s.attachmentRemove}
                accessibilityLabel="Remove photo"
                onPress={() => setAttachments((prev) => prev.filter((p) => p.uri !== img.uri))}
              >
                <Feather name="x" size={11} color="#FFFFFF" />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {/* Input Bar */}
      <View style={[s.inputContainer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Pressable
          style={s.attachBtn}
          accessibilityLabel="Add a photo"
          disabled={loading || attachments.length >= MAX_IMAGES}
          onPress={openImageOptions}
        >
          <Feather name="camera" size={19} color={attachments.length >= MAX_IMAGES ? '#D1D7D3' : C.sage} />
        </Pressable>
        <TextInput
          style={s.textInput}
          placeholder="Ask about ingredients, routines, or a skin photo..."
          placeholderTextColor="#9EA3AF"
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={400}
        />
        <Pressable
          style={[s.sendBtn, (!inputText.trim() && attachments.length === 0) || loading ? s.sendBtnDisabled : null]}
          disabled={(!inputText.trim() && attachments.length === 0) || loading}
          onPress={() => sendMessage()}
        >
          <Feather name="arrow-up" size={18} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Full-screen photo viewer */}
      <Modal
        visible={!!previewImage}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewImage(null)}
      >
        <Pressable style={s.viewerBackdrop} onPress={() => setPreviewImage(null)}>
          {!!previewImage && (
            <Image source={{ uri: previewImage }} style={s.viewerImage} resizeMode="contain" alt="Attached photo" />
          )}
          <View style={s.viewerClose}>
            <Feather name="x" size={18} color="#FFFFFF" />
          </View>
        </Pressable>
      </Modal>

      {/* Product preview for links the assistant returns */}
      <ProductSheet
        key={previewSlug ?? 'none'}
        slug={previewSlug}
        onClose={() => setPreviewSlug(null)}
        onViewDetails={(slug) => {
          setPreviewSlug(null);
          router.push(`/product/${slug}`);
        }}
      />
    </KeyboardAvoidingView>
  );
}

function ProductSheet({
  slug,
  onClose,
  onViewDetails,
}: {
  slug: string | null;
  onClose: () => void;
  onViewDetails: (slug: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let alive = true;
    api
      .getProduct(slug)
      .then((res) => {
        if (alive) setProduct(res.data ?? null);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [slug]);

  const add = () => {
    if (!product) return;
    addToCart(product);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setAdded(true);
  };

  const imageUrl = resolveImageUrl(product?.images?.[0]?.url);
  const price = product?.discountPrice ?? product?.price ?? 0;

  return (
    <Modal visible={!!slug} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.sheetBackdrop} onPress={onClose}>
        <Pressable style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 18) }]} onPress={() => {}}>
          <View style={s.sheetHandle} />

          {loading && <ActivityIndicator color={C.sage} style={s.sheetLoading} />}
          {!loading && !product && <Text style={s.sheetError}>Could not load this product right now.</Text>}

          {!loading && product && (
            <>
              <View style={s.sheetTop}>
                {!!imageUrl && <Image source={{ uri: imageUrl }} style={s.sheetImage} alt={product.title} />}
                <View style={s.sheetInfo}>
                  {!!product.category?.name && (
                    <Text style={s.sheetEyebrow}>{product.category.name.toUpperCase()}</Text>
                  )}
                  <Text style={s.sheetTitle} numberOfLines={2}>
                    {product.title}
                  </Text>
                  {!!product.seller?.storeName && <Text style={s.sheetSeller}>{product.seller.storeName}</Text>}
                  <View style={s.sheetPriceRow}>
                    <Text style={s.sheetPrice}>{formatCurrency(price)}</Text>
                    {product.discountPrice != null && product.discountPrice < product.price && (
                      <Text style={s.sheetStrike}>{formatCurrency(product.price)}</Text>
                    )}
                  </View>
                  <Text style={[s.sheetStock, product.stock > 0 ? s.sheetInStock : s.sheetOutOfStock]}>
                    {product.stock > 0 ? `In stock · ${product.stock} left` : 'Out of stock'}
                  </Text>
                </View>
              </View>

              {!!product.description && (
                <Text style={s.sheetDesc} numberOfLines={3}>
                  {product.description}
                </Text>
              )}

              <View style={s.sheetActions}>
                <Pressable
                  style={[s.sheetBtn, s.sheetPrimary, (added || product.stock <= 0) && s.sheetBtnDisabled]}
                  disabled={added || product.stock <= 0}
                  onPress={add}
                >
                  <Feather name={added ? 'check' : 'shopping-bag'} size={14} color="#FFFFFF" />
                  <Text style={s.sheetPrimaryText}>
                    {added ? 'Added to cart' : product.stock > 0 ? 'Add to cart' : 'Out of stock'}
                  </Text>
                </Pressable>
                <Pressable style={[s.sheetBtn, s.sheetSecondary]} onPress={() => onViewDetails(product.slug)}>
                  <Text style={s.sheetSecondaryText}>View details</Text>
                </Pressable>
              </View>
            </>
          )}

          <Pressable style={s.sheetClose} onPress={onClose} accessibilityLabel="Close product preview">
            <Feather name="x" size={16} color={C.ink2} />
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.cream,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EDE7DE',
  },
  eyebrow: {
    fontFamily: F.mono,
    fontSize: 9.5,
    letterSpacing: 1.5,
    color: C.sage,
    fontWeight: '600',
    marginBottom: 2,
  },
  title: {
    fontFamily: F.serifBold,
    fontSize: 24,
    color: C.ink,
  },
  clearBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECE5DB',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  msgWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  msgUserWrapper: {
    justifyContent: 'flex-end',
  },
  msgBotWrapper: {
    justifyContent: 'flex-start',
  },
  botAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E7EFEA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  msgBubble: {
    maxWidth: '80%',
    borderRadius: 18,
    paddingHorizontal: 15,
    paddingVertical: 11,
  },
  msgUserBubble: {
    backgroundColor: C.sage,
    borderBottomRightRadius: 4,
  },
  msgBotBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#ECE5DB',
  },
  msgText: {
    fontFamily: F.sansRegular,
    fontSize: 13.5,
    lineHeight: 20,
  },
  msgUserText: {
    color: '#FFFFFF',
  },
  msgBotText: {
    color: C.ink,
  },
  msgLink: {
    color: C.sageDk,
    textDecorationLine: 'underline',
    fontFamily: F.sans,
  },
  msgBold: {
    fontFamily: F.sans,
  },
  reasoningBlock: {
    borderLeftWidth: 2,
    borderLeftColor: '#D9E5DD',
    paddingLeft: 8,
    marginBottom: 8,
  },
  reasoningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  reasoningSpinner: {
    width: 16,
    height: 16,
  },
  reasoningLabel: {
    flex: 1,
    fontFamily: F.mono,
    fontSize: 8.5,
    letterSpacing: 1,
    color: C.sage,
  },
  reasoningText: {
    fontFamily: F.sansRegular,
    fontSize: 11.5,
    lineHeight: 16,
    color: C.muted,
    marginTop: 5,
  },
  msgImages: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  msgImage: {
    width: 72,
    height: 72,
    borderRadius: 10,
  },
  timestamp: {
    fontFamily: F.mono,
    fontSize: 9,
    marginTop: 4,
  },
  timestampUser: {
    color: 'rgba(255,255,255,0.7)',
    alignSelf: 'flex-end',
  },
  timestampBot: {
    color: C.muted,
    alignSelf: 'flex-start',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ECE5DB',
  },
  typingText: {
    fontFamily: F.sansRegular,
    fontSize: 12,
    color: C.ink2,
  },
  suggestionsContainer: {
    paddingVertical: 8,
  },
  suggestionsList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  promptChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECE5DB',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: R.pill,
  },
  promptChipText: {
    fontFamily: F.sans,
    fontSize: 11.5,
    color: C.ink2,
  },
  attachmentRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 2,
    backgroundColor: '#FFFFFF',
  },
  attachmentWrap: {
    position: 'relative',
  },
  attachmentImage: {
    width: 52,
    height: 52,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8E2D8',
  },
  attachmentRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: C.sage,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  attachBtn: {
    width: 38,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#ECE5DB',
    gap: 10,
  },
  textInput: {
    flex: 1,
    minHeight: 42,
    maxHeight: 100,
    backgroundColor: '#FAF8F5',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: F.sansRegular,
    fontSize: 13,
    color: C.ink,
    borderWidth: 1,
    borderColor: '#E8E2D8',
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: C.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#D1D7D3',
  },
  viewerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(12,20,16,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerImage: {
    width: '100%',
    height: '82%',
  },
  viewerClose: {
    position: 'absolute',
    top: 48,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(12,20,16,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: C.cream,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DCD4C8',
    marginBottom: 14,
  },
  sheetLoading: {
    paddingVertical: 36,
  },
  sheetError: {
    fontFamily: F.sansRegular,
    fontSize: 13,
    color: C.ink2,
    paddingVertical: 30,
    textAlign: 'center',
  },
  sheetTop: {
    flexDirection: 'row',
    gap: 14,
  },
  sheetImage: {
    width: 96,
    height: 96,
    borderRadius: R.md,
    backgroundColor: '#EFE9E0',
  },
  sheetInfo: {
    flex: 1,
    gap: 2,
  },
  sheetEyebrow: {
    fontFamily: F.mono,
    fontSize: 8.5,
    letterSpacing: 1.2,
    color: C.sage,
  },
  sheetTitle: {
    fontFamily: F.serifBold,
    fontSize: 18,
    lineHeight: 22,
    color: C.ink,
  },
  sheetSeller: {
    fontFamily: F.sansRegular,
    fontSize: 11,
    color: C.muted,
  },
  sheetPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  sheetPrice: {
    fontFamily: F.sans,
    fontSize: 16,
    color: C.ink,
  },
  sheetStrike: {
    fontFamily: F.sansRegular,
    fontSize: 12,
    color: C.muted,
    textDecorationLine: 'line-through',
  },
  sheetStock: {
    fontFamily: F.mono,
    fontSize: 9.5,
    marginTop: 2,
  },
  sheetInStock: {
    color: C.sage,
  },
  sheetOutOfStock: {
    color: C.danger,
  },
  sheetDesc: {
    fontFamily: F.sansRegular,
    fontSize: 12,
    lineHeight: 18,
    color: C.ink2,
    marginTop: 14,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  sheetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: R.pill,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  sheetPrimary: {
    flex: 1.2,
    backgroundColor: C.sage,
  },
  sheetBtnDisabled: {
    backgroundColor: '#D1D7D3',
  },
  sheetPrimaryText: {
    fontFamily: F.sans,
    fontSize: 12.5,
    color: '#FFFFFF',
  },
  sheetSecondary: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4DCD1',
  },
  sheetSecondaryText: {
    fontFamily: F.sans,
    fontSize: 12.5,
    color: C.ink,
  },
  sheetClose: {
    position: 'absolute',
    top: 6,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECE5DB',
  },
});
