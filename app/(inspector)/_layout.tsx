import { Tabs } from 'expo-router';
import { StyleSheet, View, Text } from 'react-native';
import { COLORS } from '../../src/theme';

function TabIcon({ icon, focused, color }: { icon: string; focused: boolean; color: string | any }) {
  const colorStr = typeof color === 'string' ? color : String(color);
  return (
    <View style={[styles.iconWrap, focused && { backgroundColor: colorStr + '20' }]}>
      <Text style={{ fontSize: 20 }}>{icon}</Text>
    </View>
  );
}

export default function InspectorLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: COLORS.inspectorBlue,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'My Tasks',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon icon="📋" focused={focused} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="inspection/[id]"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.surface,
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
    height: 64,
    paddingBottom: 8,
  },
  tabLabel: { fontSize: 10, fontWeight: '600' },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
