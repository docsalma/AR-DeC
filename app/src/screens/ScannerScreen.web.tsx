import React, { useState, useCallback, useRef, useEffect } from 'react';
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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ScannedWord } from '../models/types';
import { colors, spacing, radii, shadows } from '../theme';

type ScannerScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export default function ScannerScreen({ navigation }: ScannerScreenProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [scannedThisSession, setScannedThisSession] = useState<ScannedWord[]>([]);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const addWord = useScanStore((s) => s.addWord);

  // Start camera with getUserMedia directly (bypasses expo-camera web bugs)
  const startCamera = useCallback(async () => {
    try {
      // Stop any existing stream first (Chrome requires this before switching)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
      setCameraError(null);
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setCameraError('Camera permission denied. Please allow camera access in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setCameraError('No camera found on this device.');
      } else {
        setCameraError(`Camera error: ${err.message}`);
      }
    }
  }, []);

  // Stop camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Capture frame from video and run OCR
  const handleCapture = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || isProcessing) return;

    setIsProcessing(true);
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(video, 0, 0);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', 0.8),
      );
      if (!blob) return;

      const uri = URL.createObjectURL(blob);
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
      URL.revokeObjectURL(uri);

      if (newWords.length === 0) {
        Alert.alert('No text detected', 'Try pointing the camera at printed text.');
      }
    } catch (error) {
      if (error instanceof OcrError) {
        Alert.alert('OCR Error', error.message);
      } else {
        Alert.alert('Scan Error', 'Failed to process image.');
      }
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, addWord]);

  const handleWordPress = useCallback(
    (word: ScannedWord) => {
      useScanStore.getState().setCurrentWord(word);
      navigation.navigate('Result');
    },
    [navigation],
  );

  // Camera not started yet — show start button
  if (!cameraActive) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconBg}>
            <MaterialCommunityIcons name="camera" size={36} color={colors.primary} />
          </View>
          <Text style={styles.title}>Scan Text</Text>
          <Text style={styles.subtitle}>
            Use your camera to scan words from textbooks.
          </Text>

          {cameraError && (
            <Text style={styles.errorText}>{cameraError}</Text>
          )}

          <TouchableOpacity style={styles.button} onPress={startCamera}>
            <MaterialCommunityIcons name="camera" size={20} color="#fff" />
            <Text style={styles.buttonText}>Open Camera</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Camera active — show live feed
  return (
    <View style={styles.cameraContainer}>
      {/* Live camera via native <video> element — bypasses expo-camera web bugs */}
      <video
        ref={videoRef as any}
        autoPlay
        playsInline
        muted
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef as any} style={{ display: 'none' }} />

      {/* Scan frame overlay */}
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

      {/* Controls */}
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

        <TouchableOpacity
          style={[styles.captureButton, isProcessing && styles.captureButtonProcessing]}
          onPress={handleCapture}
          disabled={isProcessing}
          activeOpacity={0.8}
        >
          <View style={[styles.captureInner, isProcessing && styles.captureInnerProcessing]} />
        </TouchableOpacity>

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
  errorText: {
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xxxl,
    paddingVertical: spacing.lg,
    borderRadius: radii.lg,
    width: '100%',
    maxWidth: 320,
    justifyContent: 'center',
    ...shadows.lg,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },

  // Camera view
  cameraContainer: { flex: 1, backgroundColor: '#000', position: 'relative' as any },
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinnerOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  topBar: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  hintPill: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
  },
  hintText: { color: '#fff' },
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
});
