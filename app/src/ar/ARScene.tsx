import React, { useCallback, useRef, useEffect } from 'react';
import { StyleSheet, PanResponder, View, ActivityIndicator, Text } from 'react-native';
import { ExpoWebGLRenderingContext, GLView } from 'expo-gl';
import * as THREE from 'three';
// @ts-ignore — three/examples/jsm paths lack declarations in some setups
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { colors } from '../theme';

interface ARSceneProps {
  modelUrl: string;
  isProcedural: boolean;
  label: string;
}

export default function ARScene({ modelUrl, isProcedural, label }: ARSceneProps) {
  const rotationRef = useRef(0);
  const isDraggingRef = useRef(false);
  const autoRotateRef = useRef(true);
  const modelRef = useRef<THREE.Object3D | null>(null);
  const loadedRef = useRef(false);
  const [loading, setLoading] = React.useState(!isProcedural);

  // Resume auto-rotate 2s after release
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        isDraggingRef.current = true;
        autoRotateRef.current = false;
        if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
      },
      onPanResponderMove: (_, gesture) => {
        rotationRef.current += gesture.dx * 0.01;
      },
      onPanResponderRelease: () => {
        isDraggingRef.current = false;
        resumeTimerRef.current = setTimeout(() => {
          autoRotateRef.current = true;
        }, 2000);
      },
    }),
  ).current;

  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, []);

  const onContextCreate = useCallback(
    async (gl: ExpoWebGLRenderingContext) => {
      // Scene setup
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        60,
        gl.drawingBufferWidth / gl.drawingBufferHeight,
        0.1,
        1000,
      );
      camera.position.set(0, 0, 3);

      const renderer = new THREE.WebGLRenderer({
        // @ts-ignore — expo-gl context is compatible
        canvas: {
          width: gl.drawingBufferWidth,
          height: gl.drawingBufferHeight,
          style: {} as any,
          addEventListener: () => {},
          removeEventListener: () => {},
          clientHeight: gl.drawingBufferHeight,
        },
        context: gl as any,
      });
      renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
      renderer.setPixelRatio(1);
      // Transparent clear — camera feed shows through
      renderer.setClearColor(0x000000, 0);

      // Lighting
      const ambient = new THREE.AmbientLight(0xffffff, 0.7);
      scene.add(ambient);
      const directional = new THREE.DirectionalLight(0xffffff, 0.9);
      directional.position.set(2, 4, 3);
      scene.add(directional);

      let model: THREE.Object3D;

      if (isProcedural || !modelUrl) {
        // Procedural fallback: colored dodecahedron
        const geometry = new THREE.DodecahedronGeometry(0.8, 0);
        const material = new THREE.MeshPhongMaterial({
          color: 0x4a90d9,
          shininess: 80,
          flatShading: true,
        });
        model = new THREE.Mesh(geometry, material);
        scene.add(model);
        modelRef.current = model;
        loadedRef.current = true;
        setLoading(false);
      } else {
        // Load GLTF model
        const loader = new GLTFLoader();
        try {
          const gltf = await new Promise<any>((resolve, reject) => {
            loader.load(
              modelUrl,
              resolve,
              undefined,
              reject,
            );
          });
          model = gltf.scene;

          // Auto-scale to fit in view
          const box = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 1.5 / maxDim;
          model.scale.setScalar(scale);

          // Center the model
          const center = box.getCenter(new THREE.Vector3());
          model.position.sub(center.multiplyScalar(scale));

          scene.add(model);
          modelRef.current = model;
          loadedRef.current = true;
          setLoading(false);
        } catch (err) {
          console.warn('GLTF load failed, using procedural fallback:', err);
          const geometry = new THREE.DodecahedronGeometry(0.8, 0);
          const material = new THREE.MeshPhongMaterial({
            color: 0x4a90d9,
            shininess: 80,
            flatShading: true,
          });
          model = new THREE.Mesh(geometry, material);
          scene.add(model);
          modelRef.current = model;
          loadedRef.current = true;
          setLoading(false);
        }
      }

      // Render loop
      const animate = () => {
        requestAnimationFrame(animate);

        if (modelRef.current) {
          if (autoRotateRef.current) {
            rotationRef.current += 0.008;
          }
          modelRef.current.rotation.y = rotationRef.current;
        }

        renderer.render(scene, camera);
        gl.endFrameEXP();
      };

      animate();
    },
    [modelUrl, isProcedural],
  );

  return (
    <View style={StyleSheet.absoluteFill} {...panResponder.panHandlers}>
      <GLView style={StyleSheet.absoluteFill} onContextCreate={onContextCreate} />
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading 3D model…</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 8,
    fontSize: 13,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
