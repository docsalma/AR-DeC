import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useIsFocused } from '@react-navigation/native';
import { scanImage, extractWords, OcrError } from '../services/ocrService';
import { useScanStore } from '../store/scanStore';
import { onWordScanned } from '../services/gamificationService';
import type { ScannedWord } from '../models/types';
import { colors, spacing, radii, shadows } from '../theme';

type ScannerScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export default function ScannerScreen({ navigation }: ScannerScreenProps) {
  const isFocused = useIsFocused();
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [scannedThisSession, setScannedThisSession] = useState<ScannedWord[]>([]);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  const addWord = useScanStore((s) => s.addWord);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || isProcessing || !cameraReady) return;

    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 0.9, duration: 100, useNativeDriver: true }),
      Animated.spring(pulseAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();

    setIsProcessing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (!photo) return;

      const blocks = await scanImage(photo.uri);
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
        Alert.alert('No text detected', 'Try pointing the camera at printed text.');
      }
    } catch (error) {
      if (error instanceof OcrError) {
        const title = error.code === 'INVALID_URI' ? 'Invalid Image' : 'OCR Engine Error';
        Alert.alert(title, error.message);
      } else {
        Alert.alert('Scan Error', 'Failed to process image. Please try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, cameraReady, addWord]);

  const handleWordPress = useCallback(
    (word: ScannedWord) => {
      useScanStore.getState().setCurrentWord(word);
      navigation.navigate('Result');
    },
    [navigation],
  );

  if (!permission) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Starting camera…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <View style={styles.permissionCard}>
          <View style={styles.permissionIconBg}>
            <MaterialCommunityIcons name="camera" size={36} color={colors.primary} />
          </View>
          <Text style={styles.permissionTitle}>Camera Access</Text>
          <Text style={styles.permissionText}>
            AR-DeC needs your camera to scan text from textbooks and create AR overlays.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Enable Camera</Text>
          </TouchableOpacity>
          <Text style={styles.permissionNote}>
            Your camera feed stays on-device. We never store images.
          </Text>
        </View>
      </View>
    );
  }

  const captureDisabled = !cameraReady || isProcessing;

  return (
    <View style={styles.container}>
      {isFocused && (
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onCameraReady={() => setCameraReady(true)}
          onMountError={(e) => setCameraError(e.message)}
        />
      )}

      <View style={styles.overlay} pointerEvents="box-none">
        <View style={styles.topBar}>
          <View style={styles.hintPill}>
            <Text style={styles.hintText}>
              {isProcessing ? 'Analyzing text...' : 'Align text within the frame'}
            </Text>
          </View>
        </View>

        <View style={styles.scanFrame}>
          <View style={[styles.corner, styles.tl]} />
          <View style={[styles.corner, styles.tr]} />
          <View style={[styles.corner, styles.bl]} />
          <View style={[styles.corner, styles.br]} />
        </View>
      </View>

      {isProcessing && (
        <View style={styles.spinnerOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {cameraError && (
        <View style={styles.errorOverlay}>
          <MaterialCommunityIcons name="camera-off" size={48} color={colors.textMuted} />
          <Text style={styles.errorText}>Camera error: {cameraError}</Text>
        </View>
      )}

      <View style={styles.controls}>
        {scannedThisSession.length > 0 && (
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
            style={styles.wordList}
          />
        )}

        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            style={[styles.captureButton, isProcessing && styles.captureButtonProcessing]}
            onPress={handleCapture}
            disabled={captureDisabled}
            activeOpacity={0.8}
            accessibilityLabel="Capture photo"
          >
            <View style={[styles.captureInner, isProcessing && styles.captureInnerProcessing]} />
          </TouchableOpacity>
        </Animated.View>

        <Text style={styles.captureHint}>
          {scannedThisSession.length > 0
            ? `${scannedThisSession.length} word${scannedThisSession.length !== 1 ? 's' : ''} found`
            : 'Tap to scan'}
        </Text>
      </View>
    </View>
  );
}

const CS = 28;
const CW = 3;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    marginTop: spacing.md,
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  errorText: {
    color: colors.textMuted,
    marginTop: spacing.md,
    textAlign: 'center',
    paddingHorizontal: spacing.xxl,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinnerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  topBar: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  hintPill: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
  },
  hintText: {
    color: '#fff',
  },
  scanFrame: {
    width: 300,
    height: 220,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: CS,
    height: CS,
  },
  tl: {
    top: 0, left: 0,
    borderTopWidth: CW, borderLeftWidth: CW,
    borderColor: colors.primary,
    borderTopLeftRadius: radii.sm,
  },
  tr: {
    top: 0, right: 0,
    borderTopWidth: CW, borderRightWidth: CW,
    borderColor: colors.primary,
    borderTopRightRadius: radii.sm,
  },
  bl: {
    bottom: 0, left: 0,
    borderBottomWidth: CW, borderLeftWidth: CW,
    borderColor: colors.primary,
    borderBottomLeftRadius: radii.sm,
  },
  br: {
    bottom: 0, right: 0,
    borderBottomWidth: CW, borderRightWidth: CW,
    borderColor: colors.primary,
    borderBottomRightRadius: radii.sm,
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: spacing.xxxl,
  },
  wordList: {
    marginBottom: spacing.lg,
    maxHeight: 44,
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
  captureButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  captureButtonProcessing: {
    borderColor: colors.primary,
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  captureInnerProcessing: {
    backgroundColor: colors.primary,
  },
  captureHint: {
    color: 'rgba(255,255,255,0.7)',
    marginTop: spacing.sm,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxxl,
    backgroundColor: colors.background,
  },
  permissionCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xxl,
    padding: spacing.xxxl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    ...shadows.lg,
  },
  permissionIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  permissionIcon: { fontSize: 36 },
  permissionTitle: {
    color: colors.text,
    marginBottom: spacing.sm,
  },
  permissionText: {
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  permissionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xxxl,
    paddingVertical: spacing.lg,
    borderRadius: radii.lg,
    width: '100%',
    alignItems: 'center',
    ...shadows.lg,
  },
  permissionButtonText: {
    color: '#fff',
  },
  permissionNote: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
