import React, { useEffect, useState } from 'react';
import { View, StyleSheet, SafeAreaView, Platform } from 'react-native';
import {
  Text,
  Button,
  IconButton,
  Card,
  ActivityIndicator,
  Chip,
  Searchbar,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useScanStore } from '../store/scanStore';
import { searchModels, getModelForWord, type Model3D } from '../services/modelService';
import { colors, spacing, radii } from '../theme';

type ARViewScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

// Sketchfab iframe embed — works on web, streamed from CDN, zero storage
function SketchfabViewer({ embedUrl }: { embedUrl: string }) {
  if (Platform.OS === 'web') {
    // On web, render iframe directly
    return (
      <View style={styles.viewerContainer}>
        <iframe
          src={embedUrl}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            borderRadius: 16,
          }}
          allow="autoplay; fullscreen; xr-spatial-tracking"
          allowFullScreen
        />
      </View>
    );
  }

  // On native, use WebView (lazy import to avoid web bundle issues)
  const WebView = require('react-native-webview').default;
  return (
    <View style={styles.viewerContainer}>
      <WebView
        source={{ uri: embedUrl }}
        style={styles.webview}
        allowsInlineMediaPlayback
        javaScriptEnabled
      />
    </View>
  );
}

function ModelCard({
  model,
  onPress,
  selected,
}: {
  model: Model3D;
  onPress: () => void;
  selected: boolean;
}) {
  return (
    <Card
      style={[styles.modelCard, selected && styles.modelCardSelected]}
      onPress={onPress}
      mode="elevated"
    >
      <Card.Cover
        source={{ uri: model.thumbnailUrl }}
        style={styles.modelThumb}
        resizeMode="cover"
      />
      <Card.Content style={styles.modelInfo}>
        <Text variant="labelSmall" numberOfLines={1} style={styles.modelName}>
          {model.name}
        </Text>
      </Card.Content>
    </Card>
  );
}

export default function ARViewScreen({ navigation }: ARViewScreenProps) {
  const currentWord = useScanStore((s) => s.currentWord);
  const [loading, setLoading] = useState(true);
  const [models, setModels] = useState<Model3D[]>([]);
  const [selectedModel, setSelectedModel] = useState<Model3D | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Auto-search for the scanned word
  useEffect(() => {
    const word = currentWord?.text ?? 'education';
    setSearchQuery(word);
    loadModels(word);
  }, [currentWord?.id]);

  async function loadModels(query: string) {
    setLoading(true);
    setError(null);
    let timeoutId: ReturnType<typeof setTimeout>;
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('timeout')), 10000);
      });
      const results = await Promise.race([searchModels(query, 6), timeoutPromise]);
      clearTimeout(timeoutId!);
      setModels(results);
      setSelectedModel(results[0] ?? null);
    } catch (e) {
      clearTimeout(timeoutId!);
      setError('Failed to load 3D models. Check your connection.');
    } finally {
      setLoading(false);
    }
  }

  function handleSearch() {
    if (searchQuery.trim()) {
      loadModels(searchQuery.trim());
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          iconColor="#fff"
          size={22}
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          accessibilityLabel="Go back"
        />
        <Text variant="titleMedium" style={styles.title}>
          3D Explorer
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search bar */}
      <View style={styles.searchRow}>
        <Searchbar
          placeholder="Search 3D models..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
          iconColor="rgba(255,255,255,0.6)"
          placeholderTextColor="rgba(255,255,255,0.4)"
          theme={{ colors: { onSurfaceVariant: 'rgba(255,255,255,0.8)' } }}
        />
      </View>

      {/* 3D Viewer */}
      {error && !loading ? (
        <View style={styles.loadingContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color="rgba(255,255,255,0.7)" />
          <Text variant="titleMedium" style={styles.noModelText}>
            {error}
          </Text>
          <Button mode="contained" onPress={() => loadModels(searchQuery)} style={{ marginTop: 16 }}>
            Retry
          </Button>
        </View>
      ) : loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text variant="bodyMedium" style={styles.loadingText}>
            Finding 3D models for "{searchQuery}"...
          </Text>
        </View>
      ) : selectedModel ? (
        <SketchfabViewer embedUrl={selectedModel.embedUrl} />
      ) : (
        <View style={styles.loadingContainer}>
          <MaterialCommunityIcons name="magnify" size={48} color="rgba(255,255,255,0.7)" />
          <Text variant="titleMedium" style={styles.noModelText}>
            No 3D models found
          </Text>
          <Text variant="bodySmall" style={styles.noModelHint}>
            Try searching for something else
          </Text>
        </View>
      )}

      {/* Model info overlay */}
      {selectedModel && !loading && (
        <View style={styles.infoOverlay}>
          <View style={styles.infoRow}>
            <Text variant="titleSmall" style={styles.modelTitle} numberOfLines={1}>
              {selectedModel.name}
            </Text>
            <Chip compact textStyle={styles.authorChipText} style={styles.authorChip}>
              by {selectedModel.author}
            </Chip>
          </View>
        </View>
      )}

      {/* Model picker */}
      {models.length > 1 && (
        <View style={styles.pickerContainer}>
          <Text variant="labelMedium" style={styles.pickerLabel}>
            More models ({models.length})
          </Text>
          <View style={styles.pickerRow}>
            {models.map((model) => (
              <ModelCard
                key={model.uid}
                model={model}
                selected={selectedModel?.uid === model.uid}
                onPress={() => setSelectedModel(model)}
              />
            ))}
          </View>
        </View>
      )}

      {/* Bottom actions */}
      <View style={styles.bottom}>
        {currentWord && (
          <Button
            mode="contained"
            icon="text-box-outline"
            onPress={() => navigation.navigate('Result')}
            style={styles.detailBtn}
          >
            View Word Details
          </Button>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceDark },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  backBtn: { backgroundColor: 'rgba(255,255,255,0.1)' },
  title: { color: '#fff', fontWeight: '700' },

  searchRow: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  searchBar: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: radii.lg,
    height: 44,
  },
  searchInput: {
    color: '#fff',
    fontSize: 14,
  },

  viewerContainer: {
    flex: 1,
    marginHorizontal: spacing.lg,
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: '#1a2332',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: { color: 'rgba(255,255,255,0.6)' },
  noModelEmoji: { fontSize: 48 },
  noModelText: { color: 'rgba(255,255,255,0.7)' },
  noModelHint: { color: 'rgba(255,255,255,0.4)' },

  infoOverlay: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modelTitle: { color: '#fff', fontWeight: '600', flex: 1, marginRight: spacing.sm },
  authorChip: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    height: 28,
  },
  authorChipText: { color: 'rgba(255,255,255,0.6)', fontSize: 10 },

  pickerContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  pickerLabel: { color: 'rgba(255,255,255,0.5)', marginBottom: spacing.xs },
  pickerRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  modelCard: {
    width: 80,
    borderRadius: radii.sm,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  modelCardSelected: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  modelThumb: {
    height: 60,
    borderTopLeftRadius: radii.sm,
    borderTopRightRadius: radii.sm,
  },
  modelInfo: { padding: 4 },
  modelName: { color: 'rgba(255,255,255,0.7)', fontSize: 9 },

  bottom: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  detailBtn: { borderRadius: radii.lg, backgroundColor: colors.primary },
});
