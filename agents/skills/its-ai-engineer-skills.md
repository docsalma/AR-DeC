# ITS AI Engineer Skills

## Skill 1: ITS Architecture Design
**Trigger**: "design ITS architecture" or "build tutoring system"
**Process**:
1. Define Domain Model: vocabulary database schema, concept relationships, difficulty taxonomy
2. Define Student Model: knowledge state representation, mastery tracking, learning preferences
3. Define Tutoring Model: pedagogical decision rules (when to explain, quiz, show AR)
4. Define Interface Model: presentation strategies for AR context
5. Create data flow: Word → Domain lookup → Student state check → Tutoring decision → Output
**Output**: ITS architecture document + TypeScript interfaces for each model

## Skill 2: AI Explanation Pipeline
**Trigger**: "implement explanation engine" or "generate word definitions"
**Process**:
1. Receive scanned word + surrounding context from OCR
2. Query local vocabulary cache first (offline-first)
3. If miss: call Claude API with educational prompt template
4. Prompt includes: word, context sentence, student level, Bloom's taxonomy target
5. Parse response: definition, examples, related concepts, difficulty rating
6. Cache result locally for future offline access
7. Format for AR display (short definition + detailed expandable)
**Output**: ExplanationService with cache + API fallback chain

## Skill 3: Student Knowledge Modeling
**Trigger**: "implement student model" or "track learning progress"
**Process**:
1. Implement Bayesian Knowledge Tracing (BKT) for word mastery
2. Track per-word states: unseen → encountered → practiced → mastered
3. Calculate mastery probability after each interaction (scan, read, quiz)
4. Model parameters: P(L0), P(T), P(G), P(S) per vocabulary domain
5. Store in Zustand + persist to Firebase
6. Generate learning analytics: words per session, mastery rate, weak areas
**Output**: StudentModelService with BKT implementation

## Skill 4: Adaptive Content Selection
**Trigger**: "implement adaptive difficulty" or "personalize content"
**Process**:
1. Map content to Bloom's levels: Remember → Understand → Apply → Analyze
2. Check student's current mastery level for the scanned word/topic
3. Select appropriate content depth:
   - Novice (Remember): Simple definition + image
   - Intermediate (Understand): Definition + example + context
   - Advanced (Apply): Definition + quiz + related concepts + AR model
4. Adjust explanation language complexity based on student profile
**Output**: AdaptiveContentSelector service

## Skill 5: Quiz Generation
**Trigger**: "implement quiz system" or "generate questions"
**Process**:
1. Select words from student's recent scans (prioritize low-mastery)
2. Generate question types: multiple choice, fill-in-blank, match definition
3. Use spaced repetition scheduling (SM-2 algorithm variant)
4. For MCQ: generate plausible distractors from same domain/difficulty
5. Score and update student model on answer
6. Provide feedback: correct answer + explanation + AR visualization
**Output**: QuizService with question generation and spaced repetition
