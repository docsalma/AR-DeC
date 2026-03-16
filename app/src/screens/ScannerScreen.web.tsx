import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { scanImage, extractWords, OcrError } from '../services/ocrService';
import { useScanStore } from '../store/scanStore';
import { onWordScanned } from '../services/gamificationService';
import type { ScannedWord } from '../models/types';
import { colors, spacing, radii, shadows } from '../theme';

type ScannerScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export default function ScannerScreen({ navigation }: ScannerScreenProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [scannedThisSession, setScannedThisSession] = useState<ScannedWord[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const addWord = useScanStore((s) => s.addWord);

  const handleWordPress = useCallback(
    (word: ScannedWord) => {
      useScanStore.getState().setCurrentWord(word);
      navigation.navigate('Result');
    },
    [navigation],
  );

  const handleFile = useCallback(async (event: any) => {
    const file = event.target?.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    try {
      const uri = URL.createObjectURL(file);
      const blocks = await scanImage(uri);
      const words = extractWords(blocks);

      const newWords: ScannedWord[] = words.map((w, i) => ({
        id: `${Date.now()}-${i}`,
        text: w.text,
        context: w.context,
        timestamp: Date.now(),
        masteryLevel: 0,
        explanations: [],
      }));

      for (const word of newWords) {
        addWord(word);
        onWordScanned(word.text);
      }

      setScannedThisSession((prev) => [...newWords, ...prev]);

      if (newWords.length === 0) {
        Alert.alert('No text detected', 'Try a clearer image with printed text.');
      }

      URL.revokeObjectURL(uri);
    } catch (error) {
      if (error instanceof OcrError) {
        Alert.alert('OCR Error', error.message);
      } else {
        Alert.alert('Scan Error', 'Failed to process image.');
      }
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [addWord]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconBg}>
          <Text style={styles.icon}>{'\u{1F4F8}'}</Text>
        </View>
        <Text style={styles.title}>Scan Text from Image</Text>
        <Text style={styles.subtitle}>
          Upload a photo of a textbook page to scan words with OCR.
        </Text>

        {isProcessing ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : (
          <TouchableOpacity
            style={styles.button}
            onPress={() => fileInputRef.current?.click()}
          >
            <Text style={styles.buttonText}>Choose Image</Text>
          </TouchableOpacity>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef as any}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFile}
          style={{ display: 'none' }}
        />

        {scannedThisSession.length > 0 && (
          <View style={styles.wordListSection}>
            <Text style={styles.wordListTitle}>
              {scannedThisSession.length} word{scannedThisSession.length !== 1 ? 's' : ''} found
            </Text>
            <FlatList
              horizontal
              data={scannedThisSession.slice(0, 20)}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.wordChip} onPress={() => handleWordPress(item)}>
                  <Text style={styles.wordChipText}>{item.text}</Text>
                </TouchableOpacity>
              )}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.wordListContent}
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxxl,
  },
  iconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  icon: { fontSize: 36 },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xxxl,
    paddingVertical: spacing.lg,
    borderRadius: radii.lg,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    ...shadows.lg,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  wordListSection: {
    marginTop: spacing.xxl,
    alignItems: 'center',
  },
  wordListTitle: {
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  wordListContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  wordChip: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
  },
  wordChipText: {
    color: '#fff',
    fontWeight: '600',
  },
});
