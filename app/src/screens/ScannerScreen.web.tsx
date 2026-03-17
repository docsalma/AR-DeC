/**
 * ScannerScreen — Web version
 * Uses getUserMedia directly (NOT expo-camera) to avoid Chrome bugs.
 * Back camera only. No flip button.
 */
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

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function ScannerScreen({ navigation }: Props) {
  const [processing, setProcessing] = useState(false);
  const [words, setWords] = useState<ScannedWord[]>([]);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const addWord = useScanStore((s) => s.addWord);

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // Start back camera only
  const startCamera = useCallback(async () => {
    setError(null);
    try {
      // Always stop old stream first (Chrome requirement)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      // Request back camera — use "ideal" for compat, never "exact"
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('autoplay', 'true');
        videoRef.current.muted = true;
        await videoRef.current.play();
      }

      setStarted(true);
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setError('Camera blocked. Allow camera in browser settings, then reload.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No camera found on this device.');
      } else if (err.name === 'NotReadableError') {
        setError('Camera is in use by another app. Close it and try again.');
      } else {
        setError(`Camera failed: ${err.message}`);
      }
    }
  }, []);

  // Capture current frame → OCR
  const capture = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || processing) return;

    setProcessing(true);
    try {
      const v = videoRef.current;
      const c = canvasRef.current;
      c.width = v.videoWidth;
      c.height = v.videoHeight;
      const ctx = c.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(v, 0, 0);

      const blob = await new Promise<Blob | null>((res) =>
        c.toBlob(res, 'image/jpeg', 0.85),
      );
      if (!blob) return;

      const uri = URL.createObjectURL(blob);
      try {
        const blocks = await scanImage(uri);
        const extracted = extractWords(blocks);

        const newWords: ScannedWord[] = extracted.map((w, i) => ({
          id: `${Date.now()}-${i}`,
          text: w.text,
          context: w.context,
          timestamp: Date.now(),
          masteryLevel: 0,
          explanations: [],
        }));

        for (const w of newWords) {
          addWord(w);
          onWordScanned(w.text);
        }
        setWords((prev) => [...newWords, ...prev]);

        if (newWords.length === 0) {
          Alert.alert('No text found', 'Point the camera at printed text and try again.');
        }
      } finally {
        URL.revokeObjectURL(uri);
      }
    } catch (err) {
      if (err instanceof OcrError) {
        Alert.alert('OCR Error', err.message);
      } else {
        Alert.alert('Scan Error', 'Failed to process image.');
      }
    } finally {
      setProcessing(false);
    }
  }, [processing, addWord]);

  const tapWord = useCallback(
    (word: ScannedWord) => {
      useScanStore.getState().setCurrentWord(word);
      navigation.navigate('Result');
    },
    [navigation],
  );

  // --- Not started: show start button ---
  if (!started) {
    return (
      <View style={s.center}>
        <View style={s.card}>
          <MaterialCommunityIcons name="camera" size={48} color={colors.primary} />
          <Text style={s.cardTitle}>Scan Text</Text>
          <Text style={s.cardText}>
            Open the back camera to scan words from textbooks.
          </Text>
          {error && <Text style={s.errMsg}>{error}</Text>}
          <TouchableOpacity style={s.cardBtn} onPress={startCamera}>
            <MaterialCommunityIcons name="camera" size={20} color="#fff" />
            <Text style={s.cardBtnText}> Open Camera</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // --- Camera active: live feed ---
  return (
    <View style={s.root}>
      {/* Native <video> — direct getUserMedia, no expo-camera */}
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
          background: '#000',
        }}
      />
      {/* Hidden capture canvas */}
      <canvas ref={canvasRef as any} style={{ display: 'none' }} />

      {/* Scan frame overlay */}
      <View style={s.overlay} pointerEvents="box-none">
        <View style={s.hintRow}>
          <View style={s.pill}>
            <Text style={s.pillText}>
              {processing ? 'Analyzing...' : 'Point at text'}
            </Text>
          </View>
        </View>
        <View style={s.frame}>
          <View style={[s.co, s.tl]} />
          <View style={[s.co, s.tr]} />
          <View style={[s.co, s.bl]} />
          <View style={[s.co, s.br]} />
        </View>
      </View>

      {processing && (
        <View style={s.spinner} pointerEvents="none">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {/* Bottom controls */}
      <View style={s.controls}>
        {words.length > 0 && (
          <FlatList
            horizontal
            data={words.slice(0, 20)}
            keyExtractor={(w) => w.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={s.chip} onPress={() => tapWord(item)}>
                <Text style={s.chipText}>{item.text}</Text>
              </TouchableOpacity>
            )}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.chips}
            style={s.chipList}
          />
        )}

        <TouchableOpacity
          style={[s.capBtn, processing && s.capBtnActive]}
          onPress={capture}
          disabled={processing}
          activeOpacity={0.8}
        >
          <View style={[s.capInner, processing && s.capInnerActive]} />
        </TouchableOpacity>

        <Text style={s.hint}>
          {words.length > 0
            ? `${words.length} word${words.length !== 1 ? 's' : ''} found`
            : 'Tap to scan'}
        </Text>
      </View>
    </View>
  );
}

const CS = 28;
const CW = 3;

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000', position: 'relative' as any },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.xxxl,
  },

  // Card
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xxl,
    padding: spacing.xxxl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    ...shadows.lg,
  },
  cardTitle: { color: colors.text, fontSize: 20, fontWeight: '700', marginTop: spacing.lg },
  cardText: { color: colors.textMuted, textAlign: 'center', marginVertical: spacing.lg },
  cardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: radii.lg,
    width: '100%',
  },
  cardBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  errMsg: { color: colors.error, textAlign: 'center', marginBottom: spacing.lg, fontSize: 13 },

  // Overlay
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hintRow: { position: 'absolute', top: 20, left: 0, right: 0, alignItems: 'center' },
  pill: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
  },
  pillText: { color: '#fff' },

  frame: { width: 300, height: 220 },
  co: { position: 'absolute', width: CS, height: CS },
  tl: { top: 0, left: 0, borderTopWidth: CW, borderLeftWidth: CW, borderColor: colors.primary, borderTopLeftRadius: radii.sm },
  tr: { top: 0, right: 0, borderTopWidth: CW, borderRightWidth: CW, borderColor: colors.primary, borderTopRightRadius: radii.sm },
  bl: { bottom: 0, left: 0, borderBottomWidth: CW, borderLeftWidth: CW, borderColor: colors.primary, borderBottomLeftRadius: radii.sm },
  br: { bottom: 0, right: 0, borderBottomWidth: CW, borderRightWidth: CW, borderColor: colors.primary, borderBottomRightRadius: radii.sm },

  spinner: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },

  // Controls
  controls: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    alignItems: 'center',
    paddingBottom: spacing.xxxl,
  },
  chipList: { marginBottom: spacing.lg, maxHeight: 44 },
  chips: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  chip: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
  },
  chipText: { color: '#fff', fontWeight: '600' },
  capBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  capBtnActive: { borderColor: colors.primary },
  capInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff' },
  capInnerActive: { backgroundColor: colors.primary },
  hint: { color: 'rgba(255,255,255,0.7)', marginTop: spacing.sm },
});
