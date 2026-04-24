import { Stack } from 'expo-router';

export default function BooksLayout() {
  return (
    <Stack>
      <Stack.Screen name="chapters" options={{ title: 'Chapters' }} />
      <Stack.Screen name="verses" options={{ title: 'Verses' }} />
    </Stack>
  );
}
