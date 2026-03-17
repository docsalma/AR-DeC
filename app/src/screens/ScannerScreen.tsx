import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
  Animated,
  ActivityIndicator,
  Platform,
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

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function ScannerScreen({ navigation }: Props) {
  const isFocused = useIsFocused();
  const [permission, requestPermission] = useCameraPermissions();
  const [processing, setProcessing] = useState(false);
  const [words, setWords] = useState<ScannedWord[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mountKey, setMountKey] = useState(1);
  const cam = useRef<CameraView>(null);
  const addWord = useScanStore((s) => s.addWord);
  const pulse = useRef(new Animated.Value(1)).current;

  // When permission changes, bump the mount key to force fresh camera
  useEffect(() => {
    if (permission?.granted) {
      setMountKey((k) => k + 1);
    }
  }, [permission?.granted]);

  const capture = useCallback(async () => {
    if (!cam.current || processing || !ready) return;

    Animated.sequence([
      Animated.timing(pulse, { toValue: 0.9, duration: 100, useNativeDriver: true }),
      Animated.spring(pulse, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();

    setProcessing(true);
    try {
      const photo = await cam.current.takePictureAsync({ quality: 0.8 });
      if (!photo) return;

      const blocks = await scanImage(photo.uri);
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
        Alert.alert('No text detected', 'Try pointing the camera at printed text.');
      }
    } catch (err) {
      if (err instanceof OcrError) {
        Alert.alert(err.code === 'INVALID_URI' ? 'Invalid Image' : 'OCR Error', err.message);
      } else {
        Alert.alert('Scan Error', 'Failed to process image.');
      }
    } finally {
      setProcessing(false);
    }
  }, [processing, ready, addWord]);

  const tapWord = useCallback(
    (word: ScannedWord) => {
      useScanStore.getState().setCurrentWord(word);
      navigation.navigate('Result');
    },
    [navigation],
  );

  // Loading permission
  if (!permission) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Permission not granted
  if (!permission.granted) {
    return (
      <View style={s.center}>
        <View style={s.card}>
          <MaterialCommunityIcons name="camera" size={48} color={colors.primary} />
          <Text style={s.cardTitle}>Camera Access</Text>
          <Text style={s.cardText}>
            AR-DeC needs camera access to scan text from textbooks.
          </Text>
          <TouchableOpacity style={s.cardBtn} onPress={requestPermission}>
            <Text style={s.cardBtnText}>Enable Camera</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={s.root}>
      {/* Back camera only — no facing state, no flip */}
      {isFocused && (
        <CameraView
          key={`back-cam-${mountKey}`}
          ref={cam}
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onCameraReady={() => setReady(true)}
          onMountError={(e) => setError(e.message)}
        />
      )}

      {/* Scan frame */}
      <View style={s.overlay} pointerEvents="box-none">
        <View style={s.hintRow}>
          <View style={s.pill}>
            <Text style={s.pillText}>
              {processing ? 'Analyzing...' : 'Point at text'}
            </Text>
          </View>
        </View>
        <View style={s.frame}>
          <View style={[s.c, s.tl]} />
          <View style={[s.c, s.tr]} />
          <View style={[s.c, s.bl]} />
          <View style={[s.c, s.br]} />
        </View>
      </View>

      {processing && (
        <View style={s.spinner} pointerEvents="none">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {error && (
        <View style={s.errOverlay}>
          <MaterialCommunityIcons name="camera-off" size={48} color={colors.textMuted} />
          <Text style={s.errText}>Camera error: {error}</Text>
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

        <Animated.View style={{ transform: [{ scale: pulse }] }}>
          <TouchableOpacity
            style={[s.capBtn, processing && s.capBtnActive]}
            onPress={capture}
            disabled={!ready || processing}
            activeOpacity={0.8}
            accessibilityLabel="Capture"
          >
            <View style={[s.capInner, processing && s.capInnerActive]} />
          </TouchableOpacity>
        </Animated.View>

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
  root: { flex: 1, backgroundColor: '#000' },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.xxxl,
  },

  // Permission card
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xxl,
    padding: spacing.xxxl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    ...shadows.lg,
  },
  cardTitle: { color: colors.text, fontSize: 18, fontWeight: '700', marginTop: spacing.lg },
  cardText: { color: colors.textMuted, textAlign: 'center', marginVertical: spacing.lg },
  cardBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: radii.lg,
    width: '100%',
    alignItems: 'center',
  },
  cardBtnText: { color: '#fff', fontWeight: '700' },

  // Overlay
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hintRow: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  pill: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
  },
  pillText: { color: '#fff' },

  frame: { width: 300, height: 220 },
  c: { position: 'absolute', width: CS, height: CS },
  tl: { top: 0, left: 0, borderTopWidth: CW, borderLeftWidth: CW, borderColor: colors.primary, borderTopLeftRadius: radii.sm },
  tr: { top: 0, right: 0, borderTopWidth: CW, borderRightWidth: CW, borderColor: colors.primary, borderTopRightRadius: radii.sm },
  bl: { bottom: 0, left: 0, borderBottomWidth: CW, borderLeftWidth: CW, borderColor: colors.primary, borderBottomLeftRadius: radii.sm },
  br: { bottom: 0, right: 0, borderBottomWidth: CW, borderRightWidth: CW, borderColor: colors.primary, borderBottomRightRadius: radii.sm },

  spinner: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  errOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  errText: { color: colors.textMuted, marginTop: spacing.md, textAlign: 'center', paddingHorizontal: spacing.xxl },

  // Controls
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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
