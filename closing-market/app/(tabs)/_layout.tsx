import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { View, Platform, Text } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAuthStore } from "@/lib/auth-store";
import { trpc } from "@/lib/trpc";

function TabBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <View
      style={{
        position: "absolute",
        top: -4,
        right: -10,
        backgroundColor: "#EF4444",
        borderRadius: 9,
        minWidth: 18,
        height: 18,
        paddingHorizontal: 4,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>
        {count > 99 ? "99+" : count}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 56 + bottomPadding;
  const { token } = useAuthStore();
  const isAuthenticated = !!token;

  const { data: chatList } = trpc.chats.list.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 10000,
  });
  const unreadCount = chatList?.reduce((sum: number, room: any) => sum + (room.unreadCount ?? 0), 0) ?? 0;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          paddingTop: 8,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "홈",
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="companies"
        options={{
          title: "업체찾기",
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="storefront.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="category"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="register"
        options={{
          title: "등록하기",
          tabBarIcon: ({ color }) => (
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: colors.primary,
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 16,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              <IconSymbol size={28} name="plus.circle.fill" color="#FFFFFF" />
            </View>
          ),
          tabBarLabel: () => null,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "채팅",
          tabBarIcon: ({ color }) => (
            <View>
              <IconSymbol size={26} name="bubble.left.fill" color={color} />
              <TabBadge count={unreadCount} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="mypage"
        options={{
          title: "마이페이지",
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="person.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
