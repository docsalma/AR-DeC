import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useScanStore } from '../store/scanStore';
import { useStudentStore } from '../store/studentStore';
import { onQuizAnswer } from '../services/gamificationService';
import type { QuizQuestion } from '../models/types';
import { colors, spacing, radii, shadows } from '../theme';

const RESULT_ICONS: Record<string, { name: string; color: string }> = {
  trophy: { name: 'trophy', color: colors.gold },
  clap: { name: 'hand-clap', color: colors.secondary },
  muscle: { name: 'arm-flex', color: colors.primary },
  book: { name: 'book-open-variant', color: colors.textMuted },
};

type QuizScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

function generateQuestions(words: { text: string; context: string }[]): QuizQuestion[] {
  if (words.length < 2) return [];
  return words.slice(0, 10).map((word, i) => {
    const otherWords = words.filter((_, j) => j !== i).map((w) => w.text);
    const shuffled = otherWords.sort(() => Math.random() - 0.5).slice(0, 3);
    const options = [...shuffled, word.text].sort(() => Math.random() - 0.5);
    return {
      id: `quiz-${Date.now()}-${i}`,
      word: word.text,
      type: 'mcq' as const,
      prompt: `Which word was found in: "${word.context.slice(0, 80)}..."?`,
      options,
      correctAnswer: word.text,
    };
  });
}

export default function QuizScreen({ navigation }: QuizScreenProps) {
  const scannedWords = useScanStore((s) => s.scannedWords);
  const updateMastery = useStudentStore((s) => s.updateMastery);

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timer, setTimer] = useState(15);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const progressAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const q = generateQuestions(scannedWords);
    setQuestions(q);
    if (q.length === 0) setIsFinished(true);
  }, []);

  const handleAnswer = useCallback(
    (answer: string | null) => {
      if (selectedAnswer) return;
      clearInterval(timerRef.current);

      const question = questions[currentIndex];
      if (!question) return;
      setSelectedAnswer(answer);
      const correct = answer === question.correctAnswer;

      if (correct) {
        setScore((s) => s + 1);
        setCombo((c) => c + 1);
      } else {
        setCombo(0);
        // Shake animation on wrong answer
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 5, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
      }

      onQuizAnswer(correct);
      const word = scannedWords.find((w) => w.text === question.word);
      if (word) {
        const delta = correct ? 0.1 : -0.05;
        updateMastery(word.id, Math.max(0, Math.min(1, word.masteryLevel + delta)));
      }

      setTimeout(() => {
        if (currentIndex + 1 >= questions.length) {
          setIsFinished(true);
        } else {
          setCurrentIndex((i) => i + 1);
          setSelectedAnswer(null);
          setTimer(15);
          shakeAnim.setValue(0);
        }
      }, 1200);
    },
    [currentIndex, questions, selectedAnswer, scannedWords],
  );

  // Keep a ref to the latest handleAnswer so the interval never holds a stale closure
  const handleAnswerRef = useRef(handleAnswer);
  handleAnswerRef.current = handleAnswer;

  // Timer countdown ref to avoid side effects inside state updater
  const timerValueRef = useRef(15);

  useEffect(() => {
    if (isFinished || selectedAnswer) return;
    timerValueRef.current = 15;
    setTimer(15);
    progressAnim.setValue(1);
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: 15000,
      useNativeDriver: false,
    }).start();

    timerRef.current = setInterval(() => {
      timerValueRef.current -= 1;
      if (timerValueRef.current <= 0) {
        handleAnswerRef.current(null);
      } else {
        setTimer(timerValueRef.current);
      }
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [currentIndex, isFinished, selectedAnswer]);

  // Finished screen
  if (isFinished) {
    const percent = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
    const resultIcon = percent >= 80 ? RESULT_ICONS.trophy : percent >= 50 ? RESULT_ICONS.clap : percent > 0 ? RESULT_ICONS.muscle : RESULT_ICONS.book;

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.finishedContainer}>
          <View style={styles.finishedIconBg}>
            <MaterialCommunityIcons name={resultIcon.name as any} size={48} color={resultIcon.color} />
          </View>
          <Text style={styles.finishedTitle}>Quiz Complete!</Text>
          <Text style={styles.finishedScore}>
            {score} / {questions.length}
          </Text>
          <Text style={styles.finishedPercent}>
            {questions.length > 0 ? `${percent}%` : ''}
          </Text>
          <Text style={styles.finishedHint}>
            {questions.length === 0
              ? 'Scan at least 2 words first, then come back for a quiz!'
              : percent >= 80 ? 'Outstanding work!' : percent >= 50 ? 'Great progress!' : 'Keep practicing!'}
          </Text>
          <TouchableOpacity style={styles.doneButton} onPress={() => navigation.goBack()}>
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const question = questions[currentIndex];
  if (!question) return null;

  const timerColor = timer <= 5 ? colors.error : timer <= 10 ? colors.secondary : colors.primary;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="Exit quiz">
          <Text style={styles.exitText}>{'\u2715'}</Text>
        </TouchableOpacity>
        <Text style={styles.questionCount}>
          {currentIndex + 1} of {questions.length}
        </Text>
        <View style={styles.timerCircle}>
          <Text style={[styles.timerText, { color: timerColor }]}>{timer}</Text>
        </View>
      </View>

      {/* Timer bar */}
      <View style={styles.timerBar}>
        <Animated.View
          style={[
            styles.timerFill,
            {
              backgroundColor: timerColor,
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>

      {/* Combo indicator */}
      {combo > 1 && (
        <View style={styles.comboBanner}>
          <Text style={styles.comboText}>
            <MaterialCommunityIcons name="fire" size={16} color={colors.secondary} /> {combo}x Combo!
          </Text>
        </View>
      )}

      {/* Question */}
      <Animated.View style={[styles.questionContainer, { transform: [{ translateX: shakeAnim }] }]}>
        <Text style={styles.questionText}>{question.prompt}</Text>
      </Animated.View>

      {/* Options */}
      <View style={styles.optionsContainer}>
        {question.options.map((option, i) => {
          const isCorrect = option === question.correctAnswer;
          const isSelected = option === selectedAnswer;
          const revealed = !!selectedAnswer;

          let cardStyle = styles.option;
          let labelBg = colors.surfaceVariant;
          let labelColor = colors.text;

          if (revealed && isCorrect) {
            cardStyle = { ...styles.option, ...styles.optionCorrect };
            labelBg = colors.tertiary;
            labelColor = '#fff';
          } else if (revealed && isSelected) {
            cardStyle = { ...styles.option, ...styles.optionWrong };
            labelBg = colors.error;
            labelColor = '#fff';
          }

          return (
            <TouchableOpacity
              key={i}
              style={cardStyle}
              onPress={() => handleAnswer(option)}
              disabled={!!selectedAnswer}
              activeOpacity={0.7}
            >
              <View style={[styles.optionLabel, { backgroundColor: labelBg }]}>
                <Text style={[styles.optionLabelText, { color: labelColor }]}>
                  {String.fromCharCode(65 + i)}
                </Text>
              </View>
              <Text style={styles.optionText}>{option}</Text>
              {revealed && isCorrect && <Text style={styles.checkMark}>{'\u2713'}</Text>}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Score footer */}
      <View style={styles.footer}>
        <Text style={styles.scoreFooter}>Score: {score}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  exitText: {
    fontSize: 18,
    color: colors.textMuted,
  },
  questionCount: {
    color: colors.textMuted,
  },
  timerCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  timerText: {
    fontSize: 16,
    fontWeight: '700',
  },

  timerBar: {
    height: 4,
    backgroundColor: colors.outlineVariant,
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    borderRadius: 2,
    overflow: 'hidden',
  },
  timerFill: {
    height: '100%',
    borderRadius: 2,
  },

  comboBanner: {
    alignSelf: 'center',
    backgroundColor: colors.secondaryLight,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  comboText: {
    color: colors.secondary,
  },

  questionContainer: {
    padding: spacing.xxl,
    paddingTop: spacing.xxxl,
  },
  questionText: {
    color: colors.text,
    textAlign: 'center',
    lineHeight: 30,
  },

  optionsContainer: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.outlineVariant,
    ...shadows.sm,
  },
  optionCorrect: {
    borderColor: colors.tertiary,
    backgroundColor: colors.tertiaryLight,
  },
  optionWrong: {
    borderColor: colors.error,
    backgroundColor: colors.errorLight,
  },
  optionLabel: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  optionLabelText: {
    fontSize: 14,
    fontWeight: '700',
  },
  optionText: {
    color: colors.text,
    fontWeight: '600',
    flex: 1,
  },
  checkMark: {
    fontSize: 18,
    color: colors.tertiary,
    fontWeight: '700',
  },

  footer: {
    position: 'absolute',
    bottom: spacing.xxxl,
    alignSelf: 'center',
  },
  scoreFooter: {
    color: colors.textMuted,
  },

  finishedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxxl,
  },
  finishedIconBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.secondaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
    borderWidth: 3,
    borderColor: colors.gold,
  },
  finishedEmoji: { fontSize: 48 },
  finishedTitle: {
    color: colors.text,
  },
  finishedScore: {
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  finishedPercent: {
    color: colors.primary,
    marginTop: spacing.md,
  },
  finishedHint: {
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  doneButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.huge,
    paddingVertical: spacing.lg,
    borderRadius: radii.lg,
    marginTop: spacing.xxxl,
    ...shadows.lg,
  },
  doneButtonText: {
    color: '#fff',
  },
});
