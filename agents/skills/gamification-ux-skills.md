# Gamification & UX Designer Skills

## Skill 1: Points & Rewards System
**Trigger**: "implement points system" or "build rewards"
**Process**:
1. Define point actions: scan (+5), read (+3), quiz correct (+10), streak (+20/day)
2. Create GamificationStore (Zustand) with points, level, streak, badges
3. Implement level thresholds: Beginner (0-100), Explorer (100-500), Scholar (500-2000), Master (2000+)
4. Design point animation: floating +N text on action
5. Implement daily reset for streak tracking
6. Persist to Firebase for cross-device sync
**Output**: GamificationService + animated point feedback components

## Skill 2: Badge & Achievement System
**Trigger**: "implement badges" or "create achievements"
**Process**:
1. Define badge categories:
   - Explorer badges: 10/50/100/500 words scanned
   - Scholar badges: 10/50/100 quizzes passed
   - Streak badges: 3/7/14/30 day streaks
   - Subject badges: master 20 words in Science/Math/History/etc.
   - Special: first scan, first quiz, first AR interaction
2. Create badge assets (icons, descriptions, unlock conditions)
3. Implement badge check on every gamification event
4. Design badge unlock animation (pop-up celebration)
5. Create badge gallery in ProfileScreen
**Output**: BadgeService + BadgeGallery component + badge assets

## Skill 3: Quiz Mini-Game Design
**Trigger**: "design quiz game" or "build quiz UX"
**Process**:
1. Design quick quiz card UI (swipeable, tappable)
2. Question types: 4-choice MCQ, true/false, match pairs
3. Timer: 15 seconds per question for urgency
4. Visual feedback: green glow (correct), red shake (wrong)
5. Combo multiplier: consecutive correct answers = 2x, 3x points
6. End screen: score, XP gained, badges earned, "play again"
**Output**: QuizScreen with game-like interactions

## Skill 4: Student Dashboard Design
**Trigger**: "design dashboard" or "build profile screen"
**Process**:
1. Progress ring: daily goal progress (words scanned / target)
2. Streak calendar: heat map of daily activity
3. Vocabulary mastery chart: pie chart of unseen/learning/mastered
4. Recent scans list: last 20 scanned words with mastery level
5. Badge showcase: top 3 badges prominently displayed
6. Stats cards: total words, quiz accuracy, days active, current level
**Output**: ProfileScreen with dashboard widgets

## Skill 5: Onboarding Flow Design
**Trigger**: "design onboarding" or "first-time experience"
**Process**:
1. Welcome screen with app value proposition (3 slides max)
2. Camera permission prompt with clear explanation
3. Guided first scan: highlight a demo text, guide user to scan
4. Show first AR overlay with tooltip explaining the feature
5. Award "First Scan" badge with celebration animation
6. Set daily goal (suggest 5 words/day, adjustable)
**Output**: OnboardingFlow component (3-5 screens)
