import { Tabs } from 'expo-router';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { C, F, R } from '../../../components/lucent/theme';
import { useCart } from '../../../lib/cart-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { totalCount } = useCart();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarShowLabel: true,
        tabBarActiveTintColor: C.sage,
        tabBarInactiveTintColor: '#8A92A0',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#ECE6DD',
          borderTopWidth: 1,
          height: 60 + (insets.bottom > 0 ? insets.bottom - 4 : 12),
          paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
          paddingTop: 8,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontFamily: F.sans,
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
      screenListeners={{
        tabPress: () => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Shop',
          tabBarIcon: ({ color }) => (
            <Feather name="grid" size={20} color={String(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="shops"
        options={{
          title: 'Brands',
          tabBarIcon: ({ color }) => (
            <Feather name="award" size={20} color={String(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'AI Skin',
          tabBarIcon: ({ color }) => (
            <Feather name="message-circle" size={20} color={String(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ color }) => (
            <View style={{ width: 24, height: 24, justifyContent: 'center', alignItems: 'center' }}>
              <Feather name="shopping-bag" size={20} color={String(color)} />
              {totalCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {totalCount > 99 ? '99+' : totalCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Account',
          tabBarIcon: ({ color }) => (
            <Feather name="user" size={20} color={String(color)} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -5,
    right: -10,
    backgroundColor: C.danger,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontFamily: F.sans,
    fontWeight: '700',
  },
});
