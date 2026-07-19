import { Stack } from 'expo-router';

// This group is no longer used as a tab bar — replaced by a direct Stack navigation.
// Kept as a layout wrapper to avoid breaking the file-based routing structure.
export default function TabsLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
