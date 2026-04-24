import { Stack } from 'expo-router';

export default function BooksLayout() {
  return (
    <Stack>
      {/* Cache complètement le header système sur la page verses
          → supprime le double bouton retour */}
      <Stack.Screen
        name="verses"
        options={{
          headerShown: false,
          animation: 'slide_from_right',
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="chapters"
        options={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="quick"
        options={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
    </Stack>
  );
}