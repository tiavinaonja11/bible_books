// components/HighlightModal.tsx
import { HIGHLIGHT_COLORS } from '@/hooks/useHighlight';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Modal, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { ThemedText } from './themed-text';
import { IconSymbol } from './ui/icon-symbol';

interface HighlightModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (color: string, note: string) => void;
  verseText: string;
  initialColor?: string;
  initialNote?: string;
}

export default function HighlightModal({
  visible,
  onClose,
  onSave,
  verseText,
  initialColor,
  initialNote,
}: HighlightModalProps) {
  const [selectedColor, setSelectedColor] = useState(initialColor || HIGHLIGHT_COLORS[0].value);
  const [note, setNote] = useState(initialNote || '');

  const handleSave = () => {
    onSave(selectedColor, note);
    setNote('');
    onClose();
  };

  const handleRemove = () => {
    onSave('', '');
    setNote('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <LinearGradient
            colors={['#fff', '#faf5f0']}
            style={styles.modalContent}
          >
            <View style={styles.header}>
              <ThemedText style={styles.title}>Surligner le verset</ThemedText>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <IconSymbol name="xmark" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.verseContainer}>
              <ThemedText style={styles.verseText} numberOfLines={3}>
                {verseText}
              </ThemedText>
            </View>

            <ThemedText style={styles.sectionTitle}>Couleurs</ThemedText>
            <View style={styles.colorsContainer}>
              {HIGHLIGHT_COLORS.map(color => (
                <TouchableOpacity
                  key={color.value}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color.bg },
                    selectedColor === color.value && styles.colorOptionSelected,
                  ]}
                  onPress={() => setSelectedColor(color.value)}
                >
                  <View style={[styles.colorDot, { backgroundColor: color.value }]} />
                  <ThemedText style={styles.colorName}>{color.name}</ThemedText>
                  {selectedColor === color.value && (
                    <IconSymbol name="checkmark" size={14} color={color.value} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <ThemedText style={styles.sectionTitle}>Note (optionnel)</ThemedText>
            <TextInput
              style={styles.noteInput}
              placeholder="Ajouter une note personnelle..."
              placeholderTextColor="#999"
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
            />

            <View style={styles.buttonsContainer}>
              {initialColor && (
                <TouchableOpacity style={styles.removeButton} onPress={handleRemove}>
                  <LinearGradient
                    colors={['#ff4444', '#cc0000']}
                    style={styles.buttonGradient}
                  >
                    <IconSymbol name="trash" size={16} color="#fff" />
                    <ThemedText style={styles.buttonText}>Supprimer</ThemedText>
                  </LinearGradient>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <LinearGradient
                  colors={['#8B4513', '#D2691E']}
                  style={styles.buttonGradient}
                >
                  <IconSymbol name="checkmark" size={16} color="#fff" />
                  <ThemedText style={styles.buttonText}>
                    {initialColor ? 'Modifier' : 'Surligner'}
                  </ThemedText>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  closeButton: {
    padding: 4,
  },
  verseContainer: {
    backgroundColor: '#F5E6D3',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  verseText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  colorsContainer: {
    gap: 10,
    marginBottom: 20,
  },
  colorOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    gap: 12,
    borderWidth: 1,
    borderColor: '#f0e0d0',
  },
  colorOptionSelected: {
    borderColor: '#8B4513',
    borderWidth: 2,
  },
  colorDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  colorName: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  noteInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f0e0d0',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#333',
    textAlignVertical: 'top',
    minHeight: 80,
    marginBottom: 20,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  saveButton: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 12,
  },
  removeButton: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 12,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});