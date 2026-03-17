/**
 * ScannerScreen — Web version
 * Finds back camera by enumerating devices (bypasses Chrome facingMode bugs).
 * Falls back to last camera in list if label matching fails.
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

type Props = { navigation: NativeStackNavigationProp<any> };

/**
 * Find the back camera deviceId by enumerating all video inputs.
 * Chrome's facingMode is unreliable — this is the proven workaround.
 */
async function findBackCameraId(): Promise<string | null> {
  try {
    // Need a temporary stream to get labeled devices (privacy restriction)
    const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
    const devices = await navigator.mediaDevices.enumerateDevices();
    // Stop temp stream immediately
    tempStream.getTracks().forEach((t) => t.stop());

    const videoDevices = devices.filter((d) => d.kind === 'videoinput');
    console.log('[Camera] Found video devices:', videoDevices.map((d) => `${d.label} (${d.deviceId.slice(0, 8)})`));

    if (videoDevices.length === 0) return null;
    if (videoDevices.length === 1) return videoDevices[0].deviceId; // only one camera

    // Match by label — back camera usually has these keywords
    const backKeywords = ['back', 'rear', 'environment', 'arrière', 'trasera'];
    const backDevice = videoDevices.find((d) =>
      backKeywords.some((kw) => d.label.toLowerCase().includes(kw)),
    );
    if (backDevice) {
      console.log('[Camera] Found back camera by label:', backDevice.label);
      return backDevice.deviceId;
    }

    // On most phones, back camera is the LAST in the list (or index 0 on some)
    // Try last device first (more common for back camera on Android Chrome)
    console.log('[Camera] No label match, using last device:', videoDevices[videoDevices.length - 1].label);
    return videoDevices[videoDevices.length - 1].deviceId;
  } catch (err) {
    console.warn('[Camera] enumerateDevices failed:', err);
    return null;
  }
}

export default function ScannerScreen({ navigation }: Props) {
  const [processing, setProcessing] = useState(false);
  const [words, setWords] = useState<ScannedWord[]>([]);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraLabel, setCameraLabel] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const addWord = useScanStore((s) => s.addWord);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);

    // Stop any existing stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    try {
      // Step 1: Find back camera by deviceId
      const backId = await findBackCameraId();

      // Step 2: Open that specific camera
      const constraints: MediaStreamConstraints = backId
        ? {
            video: {
              deviceId: { exact: backId },
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
            audio: false,
          }
        : {
            // Absolute fallback — no devices found, just try environment
            video: { facingMode: 'environment' },
            audio: false,
          };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Show which camera we got
      const track = stream.getVideoTracks()[0];
      const settings = track.getSettings();
      setCameraLabel(track.label || settings.facingMode || 'Camera');
      console.log('[Camera] Active:', track.label, 'facingMode:', settings.facingMode);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.muted = true;
        await videoRef.current.play();
      }

      setStarted(true);
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setError('Camera blocked. Allow camera access in browser settings.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found.');
      } else if (err.name === 'NotReadableError') {
        setError('Camera in use by another app.');
      } else {
        setError(`Camera error: ${err.message}`);
      }
    }
  }, []);

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

      const blob = await new Promise<Blob | null>((r) => c.toBlob(r, 'image/jpeg', 0.85));
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
        for (const w of newWords) { addWord(w); onWordScanned(w.text); }
        setWords((prev) => [...newWords, ...prev]);
        if (newWords.length === 0) Alert.alert('No text found', 'Point at printed text.');
      } finally {
        URL.revokeObjectURL(uri);
      }
    } catch (err) {
      if (err instanceof OcrError) Alert.alert('OCR Error', err.message);
      else Alert.alert('Scan Error', 'Failed to process image.');
    } finally {
      setProcessing(false);
    }
  }, [processing, addWord]);

  const tapWord = useCallback((word: ScannedWord) => {
    useScanStore.getState().setCurrentWord(word);
    navigation.navigate('Result');
  }, [navigation]);

  // --- Start screen ---
  if (!started) {
    return (
      <View style={st.center}>
        <View style={st.card}>
          <MaterialCommunityIcons name="camera" size={48} color={colors.primary} />
          <Text style={st.cardTitle}>Scan Text</Text>
          <Text style={st.cardText}>Open the camera to scan words from textbooks.</Text>
          {error && <Text style={st.errMsg}>{error}</Text>}
          <TouchableOpacity style={st.cardBtn} onPress={startCamera}>
            <Text style={st.cardBtnText}>Open Camera</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // --- Live camera ---
  return (
    <View style={st.root}>
      <video
        ref={videoRef as any}
        autoPlay playsInline muted
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', background: '#000' }}
      />
      <canvas ref={canvasRef as any} style={{ display: 'none' }} />

      <View style={st.overlay} pointerEvents="box-none">
        <View style={st.hintRow}>
          <View style={st.pill}>
            <Text style={st.pillText}>{processing ? 'Analyzing...' : 'Point at text'}</Text>
          </View>
        </View>
        {/* Camera indicator */}
        {cameraLabel ? (
          <View style={st.camLabelRow}>
            <View style={st.camLabelPill}>
              <MaterialCommunityIcons name="camera-rear" size={12} color="rgba(255,255,255,0.8)" />
              <Text style={st.camLabelText}>{cameraLabel}</Text>
            </View>
          </View>
        ) : null}
        <View style={st.frame}>
          <View style={[st.co, st.tl]} /><View style={[st.co, st.tr]} />
          <View style={[st.co, st.bl]} /><View style={[st.co, st.br]} />
        </View>
      </View>

      {processing && (
        <View style={st.spinner} pointerEvents="none">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      <View style={st.controls}>
        {words.length > 0 && (
          <FlatList
            horizontal data={words.slice(0, 20)} keyExtractor={(w) => w.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={st.chip} onPress={() => tapWord(item)}>
                <Text style={st.chipText}>{item.text}</Text>
              </TouchableOpacity>
            )}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={st.chips} style={st.chipList}
          />
        )}
        <TouchableOpacity
          style={[st.capBtn, processing && st.capBtnOn]}
          onPress={capture} disabled={processing} activeOpacity={0.8}
        >
          <View style={[st.capInner, processing && st.capInnerOn]} />
        </TouchableOpacity>
        <Text style={st.hint}>
          {words.length > 0 ? `${words.length} word${words.length !== 1 ? 's' : ''} found` : 'Tap to scan'}
        </Text>
      </View>
    </View>
  );
}

const CS = 28, CW = 3;
const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000', position: 'relative' as any },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, padding: spacing.xxxl },
  card: { backgroundColor: colors.surface, borderRadius: radii.xxl, padding: spacing.xxxl, alignItems: 'center', width: '100%', maxWidth: 360, ...shadows.lg },
  cardTitle: { color: colors.text, fontSize: 20, fontWeight: '700', marginTop: spacing.lg },
  cardText: { color: colors.textMuted, textAlign: 'center', marginVertical: spacing.lg },
  cardBtn: { backgroundColor: colors.primary, paddingVertical: spacing.lg, borderRadius: radii.lg, width: '100%', alignItems: 'center' },
  cardBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  errMsg: { color: colors.error, textAlign: 'center', marginBottom: spacing.lg, fontSize: 13 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  hintRow: { position: 'absolute', top: 20, left: 0, right: 0, alignItems: 'center' },
  pill: { backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radii.pill },
  pillText: { color: '#fff' },
  camLabelRow: { position: 'absolute', top: 56, left: 0, right: 0, alignItems: 'center' },
  camLabelPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: radii.pill },
  camLabelText: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
  frame: { width: 300, height: 220 },
  co: { position: 'absolute', width: CS, height: CS },
  tl: { top: 0, left: 0, borderTopWidth: CW, borderLeftWidth: CW, borderColor: colors.primary, borderTopLeftRadius: radii.sm },
  tr: { top: 0, right: 0, borderTopWidth: CW, borderRightWidth: CW, borderColor: colors.primary, borderTopRightRadius: radii.sm },
  bl: { bottom: 0, left: 0, borderBottomWidth: CW, borderLeftWidth: CW, borderColor: colors.primary, borderBottomLeftRadius: radii.sm },
  br: { bottom: 0, right: 0, borderBottomWidth: CW, borderRightWidth: CW, borderColor: colors.primary, borderBottomRightRadius: radii.sm },
  spinner: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' },
  controls: { position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center', paddingBottom: spacing.xxxl },
  chipList: { marginBottom: spacing.lg, maxHeight: 44 },
  chips: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  chip: { backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.pill },
  chipText: { color: '#fff', fontWeight: '600' },
  capBtn: { width: 76, height: 76, borderRadius: 38, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.6)' },
  capBtnOn: { borderColor: colors.primary },
  capInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff' },
  capInnerOn: { backgroundColor: colors.primary },
  hint: { color: 'rgba(255,255,255,0.7)', marginTop: spacing.sm },
});
