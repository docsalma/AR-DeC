# Mobile AR Architect Skills

## Skill 1: Project Scaffolding
**Trigger**: "scaffold the React Native app" or "initialize mobile project"
**Process**:
1. Create Expo project with TypeScript template
2. Install core dependencies: ViroReact, react-native-mlkit-ocr, zustand, react-navigation
3. Set up directory structure (screens/, components/, services/, store/, ar/, assets/)
4. Configure app.json with AR permissions (camera, storage)
5. Create base navigation stack
**Output**: Fully initialized React Native project with navigation and dependencies

## Skill 2: OCR Pipeline Implementation
**Trigger**: "implement OCR scanning" or "build text scanner"
**Process**:
1. Set up camera view with react-native-camera or expo-camera
2. Integrate react-native-mlkit-ocr for text recognition
3. Implement real-time frame processing with throttling (200ms intervals)
4. Build word extraction from OCR blocks (tokenization, filtering)
5. Create ScannerScreen with overlay guides and scan button
6. Emit scanned words to ITS service via Zustand store
**Output**: Working OCR scanner screen that extracts text from camera feed

## Skill 3: AR Scene Builder
**Trigger**: "build AR overlay" or "implement AR visualization"
**Process**:
1. Set up ViroARSceneNavigator as the AR container
2. Create ARDefinitionOverlay component (text floating in AR space)
3. Create ARInteractiveModel component (3D models for concepts)
4. Implement AR anchor placement (attach overlays to detected surfaces)
5. Build AR animation system (fade-in, float, pulse for attention)
6. Handle AR session lifecycle (pause, resume, reset)
**Output**: AR scene components that render educational overlays

## Skill 4: Screen Flow Implementation
**Trigger**: "build navigation" or "implement screen flow"
**Process**:
1. HomeScreen: dashboard with quick scan button, recent words, streaks
2. ScannerScreen: camera + OCR + scan button
3. ARViewScreen: AR overlay with definition/3D model
4. ResultScreen: detailed explanation, examples, quiz prompt
5. ProfileScreen: progress, badges, vocabulary history
6. QuizScreen: quick quiz from scanned vocabulary
**Output**: Full navigation stack with all screens

## Skill 5: Performance Optimization
**Trigger**: "optimize performance" or "fix lag"
**Process**:
1. Profile with React Native Perf Monitor and Flipper
2. Optimize OCR: skip frames, reduce resolution for processing
3. Optimize AR: LOD (level of detail) for 3D models, texture compression
4. Implement lazy loading for AR assets
5. Memory management: release camera/AR resources on unmount
6. Battery optimization: reduce GPS/sensor polling frequency
**Output**: Performance report + optimization patches
