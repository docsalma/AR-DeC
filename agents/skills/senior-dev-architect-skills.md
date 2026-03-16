# Senior Dev Architect Skills

## Skill 1: System Design Review
**Trigger**: "review architecture" or "validate design"
**Process**:
1. Audit module boundaries: are services properly decoupled?
2. Check data flow: OCR → ITS → AR → Gamification pipeline complete?
3. Verify interface contracts: TypeScript types match across modules
4. Review error handling: graceful degradation at every boundary
5. Check offline-first compliance: does core functionality work without internet?
6. Validate: does the architecture support research data collection?
**Output**: Architecture review document with action items

## Skill 2: Task Delegation & Coordination
**Trigger**: "plan sprint" or "delegate tasks" or "coordinate agents"
**Process**:
1. Break down feature into sub-tasks per agent:
   - mobile-ar-architect: UI + camera + AR rendering
   - its-ai-engineer: AI logic + student model
   - gamification-ux-designer: points + badges + quiz UX
   - data-engineer: backend + data persistence
   - research-scientist: corresponding article section
   - latex-specialist: figures/tables for the feature
2. Define interfaces between tasks (shared types, events, stores)
3. Set priority order (build from data layer up to UI)
4. Identify blockers and dependencies
**Output**: Task breakdown with assignments and order

## Skill 3: Code Standards Enforcement
**Trigger**: "set coding standards" or "create conventions"
**Process**:
1. TypeScript strict mode, no `any` types
2. Component naming: PascalCase, files match component name
3. Service pattern: class with static methods or hooks-based
4. Store pattern: Zustand slices with actions and selectors
5. Error handling: Result<T, E> pattern for service calls
6. Testing: jest + react-native-testing-library, min 70% coverage
7. Linting: ESLint + Prettier with React Native config
**Output**: .eslintrc.js, .prettierrc, tsconfig.json, CONTRIBUTING.md

## Skill 4: Integration Testing Strategy
**Trigger**: "design tests" or "testing strategy"
**Process**:
1. Unit tests: service logic, store actions, utility functions
2. Component tests: screens render correctly, user interactions work
3. Integration tests: OCR → ITS pipeline, gamification event flow
4. E2E tests: Detox for full user journeys (scan → explain → quiz)
5. AR visual tests: snapshot testing for AR scene composition
6. Research data tests: verify analytics events fire correctly
**Output**: Test plan + example test files

## Skill 5: Build & Deployment Pipeline
**Trigger**: "set up CI/CD" or "configure builds"
**Process**:
1. Configure EAS Build for iOS and Android
2. Set up environment variables (.env for API keys)
3. GitHub Actions workflow: lint → test → build
4. Configure OTA updates via Expo Updates
5. Set up Firebase project with dev/staging/prod environments
6. Create build scripts in package.json
**Output**: eas.json, GitHub Actions workflow, environment configs
