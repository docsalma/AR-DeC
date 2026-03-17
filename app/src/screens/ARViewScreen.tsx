import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useIsFocused } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useScanStore } from '../store/scanStore';
import { getGltfUrlForWord } from '../services/modelService';
import ARScene from '../ar/ARScene';
import { colors, spacing, radii } from '../theme';

type ARViewScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export default function ARViewScreen({ navigation }: ARViewScreenProps) {
  const currentWord = useScanStore((s) => s.currentWord);
  const isFocused = useIsFocused();
  const [permission, requestPermission] = useCameraPermissions();

  const word = currentWord?.text ?? 'education';
  const gltfModel = useMemo(() => getGltfUrlForWord(word), [word]);

  // Permission loading
  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Permission denied
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionCard}>
          <MaterialCommunityIcons name="camera" size={48} color={colors.primary} />
          <Text style={styles.permissionTitle}>Camera Access Needed</Text>
          <Text style={styles.permissionText}>
            AR view needs camera access to overlay 3D models on the real world.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Enable Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
            <Text style={styles.backLinkText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Layer 1: Camera feed (bottom) */}
      {isFocused && (
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
        />
      )}

      {/* Layer 2: Three.js GL scene with transparent background */}
      <ARScene
        modelUrl={gltfModel.url}
        isProcedural={gltfModel.isProcedural}
        label={gltfModel.label}
      />

      {/* Layer 3: UI overlay (pass-through touches to ARScene below) */}
      <View style={styles.uiOverlay} pointerEvents="box-none">
        {/* Top bar */}
        <View style={styles.topBar} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            accessibilityLabel="Go back"
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.wordChip}>
            <MaterialCommunityIcons name="cube-scan" size={14} color="#fff" />
            <Text style={styles.wordChipText}>{word}</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Bottom bar */}
        <View style={styles.bottomBar} pointerEvents="box-none">
          <View style={styles.modelLabel}>
            <Text style={styles.modelLabelText}>{gltfModel.label}</Text>
            {gltfModel.isProcedural && (
              <Text style={styles.modelLabelSub}>Procedural shape</Text>
            )}
          </View>
          {currentWord && (
            <TouchableOpacity
              style={styles.detailBtn}
              onPress={() => navigation.navigate('Result')}
            >
              <MaterialCommunityIcons name="text-box-outline" size={16} color="#fff" />
              <Text style={styles.detailBtnText}>Word Details</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Permission card
  permissionCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xxl,
    padding: spacing.xxxl,
    alignItems: 'center',
    marginHorizontal: spacing.xxxl,
  },
  permissionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  permissionText: {
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xxl,
    lineHeight: 22,
  },
  permissionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xxxl,
    paddingVertical: spacing.lg,
    borderRadius: radii.lg,
    width: '100%',
    alignItems: 'center',
  },
  permissionButtonText: { color: '#fff', fontWeight: '600' },
  backLink: { marginTop: spacing.lg },
  backLinkText: { color: colors.primary, fontWeight: '600' },

  // UI overlay
  uiOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: spacing.lg,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wordChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
  },
  wordChipText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },

  // Bottom bar
  bottomBar: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
    alignItems: 'center',
    gap: spacing.md,
  },
  modelLabel: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    alignItems: 'center',
  },
  modelLabelText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  modelLabelSub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
  },
  detailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
  },
  detailBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
});
