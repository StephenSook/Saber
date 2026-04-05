"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { X, Check, Sparkles } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import XPAnimation from "@/components/XPAnimation";
import MicButton from "@/components/MicButton";
import useSpeechToText from "@/hooks/useSpeechToText";
import { useLanguage } from "@/components/LanguageProvider";
import LanguageToggle from "@/components/ui/LanguageToggle";
import {
  classifyDiagnosticAnswer,
  getStudentDashboard,
  getStudentDiagnostic,
  submitDiagnosticAnswer,
  type StudentDiagnosticResponseData,
  type StudentProfileResponseData,
} from "@/lib/api";

interface AnswerFeedback {
  correct: boolean;
  message: string;
  explanation?: string | null;
}

export default function DiagnosticTest() {
  const searchParams = useSearchParams();
  const { lang, t } = useLanguage();
  const studentId = parseStudentId(searchParams.get("studentId"));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const [showXP, setShowXP] = useState(false);
  const [textAnswer, setTextAnswer] = useState("");
  const [totalXP, setTotalXP] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<StudentProfileResponseData | null>(null);
  const [diagnostic, setDiagnostic] = useState<StudentDiagnosticResponseData | null>(null);
  const [questions, setQuestions] = useState<
    StudentDiagnosticResponseData["questions"]
  >([]);
  const [usedSpeechInput, setUsedSpeechInput] = useState(false);

  const { transcript, isListening, startListening, stopListening, resetTranscript } =
    useSpeechToText("es-ES");

  useEffect(() => {
    let cancelled = false;

    const loadData = async (): Promise<void> => {
      try {
        const [nextProfile, nextDiagnostic] = await Promise.all([
          getStudentDashboard(studentId),
          getStudentDiagnostic(studentId),
        ]);

        if (cancelled) {
          return;
        }

        setProfile(nextProfile);
        setDiagnostic(nextDiagnostic);
        setQuestions(nextDiagnostic.questions.filter((question) => !question.isCompleted));
        setError(null);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load the diagnostic.",
          );
        }
      }
    };

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [studentId]);

  useEffect(() => {
    if (questions.length === 0 && diagnostic !== null) {
      setShowResults(diagnostic.answeredQuestions > 0);
    }
  }, [diagnostic, questions]);

  const question = questions[currentIndex];
  const totalQuestions = questions.length;
  const progress = totalQuestions === 0 ? 0 : ((currentIndex + 1) / totalQuestions) * 100;

  const questionText = lang === "es" ? question?.questionEs : question?.questionEn;
  const subtitleText = lang === "es" ? question?.questionEn : question?.questionEs;
  const choices = lang === "es" ? question?.choicesEs : question?.choicesEn;
  const subtitleChoices = lang === "es" ? question?.choicesEn : question?.choicesEs;

  const handleSelect = useCallback((index: number) => {
    if (feedback) return;
    setSelectedAnswer(index);
  }, [feedback]);

  const handleSubmit = useCallback(() => {
    if (question === undefined) {
      return;
    }

    const answerEs =
      selectedAnswer !== null
        ? (question.choicesEs?.[selectedAnswer] ?? question.choicesEn?.[selectedAnswer] ?? "")
        : textAnswer.trim();

    if (answerEs.length === 0) {
      return;
    }

    const submitAnswer = async (): Promise<void> => {
      setIsSubmitting(true);
      setError(null);

      try {
        const answerResult = await submitDiagnosticAnswer({
          studentId,
          questionId: question.id,
          answerEs,
          inputMethod: usedSpeechInput ? "speech" : "text",
        });

        let explanation: string | null = null;
        let latestClassification = question.latestClassification;

        try {
          const classificationResult = await classifyDiagnosticAnswer({
            studentId,
            questionId: question.id,
            answerEs,
          });
          explanation = classificationResult.explanation;
          latestClassification = classificationResult.classification;
        } catch (classificationError) {
          explanation =
            classificationError instanceof Error ? classificationError.message : null;
        }

        if (answerResult.correct) {
          setCorrectCount((count) => count + 1);
          setTotalXP((xp) => xp + answerResult.xpEarned);
          setShowXP(true);
          setTimeout(() => setShowXP(false), 1100);
          setFeedback({
            correct: true,
            message: t("test.incredibleFocus"),
            explanation,
          });
        } else {
          setFeedback({
            correct: false,
            message: t("test.keepGoing"),
            explanation,
          });
        }

        setQuestions((currentQuestions) =>
          currentQuestions.map((currentQuestion) =>
            currentQuestion.id === question.id
              ? {
                  ...currentQuestion,
                  latestStudentAnswerEs: answerEs,
                  latestClassification,
                  latestExplanation: explanation,
                  isCompleted: true,
                }
              : currentQuestion,
          ),
        );
      } catch (submitError) {
        setError(
          submitError instanceof Error
            ? submitError.message
            : "Failed to submit the answer.",
        );
      } finally {
        setIsSubmitting(false);
      }
    };

    void submitAnswer();
  }, [question, selectedAnswer, textAnswer, t, studentId, usedSpeechInput]);

  const handleContinue = useCallback(() => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
      setFeedback(null);
      setTextAnswer("");
      setUsedSpeechInput(false);
      resetTranscript();
    } else {
      setShowResults(true);
    }
  }, [currentIndex, totalQuestions, resetTranscript]);

  const handleMicToggle = useCallback(() => {
    if (isListening) {
      stopListening();
      setTextAnswer(transcript);
      setUsedSpeechInput(true);
    } else {
      resetTranscript();
      startListening();
    }
  }, [isListening, startListening, stopListening, transcript, resetTranscript]);

  const languageGaps = useMemo(() => {
    return questions.filter((currentQuestion) => {
      return currentQuestion.latestClassification === "LANGUAGE";
    }).length;
  }, [questions]);

  const contentGaps = useMemo(() => {
    return questions.filter((currentQuestion) => {
      return currentQuestion.latestClassification === "CONTENT";
    }).length;
  }, [questions]);

  const mixedGaps = useMemo(() => {
    return questions.filter((currentQuestion) => {
      return currentQuestion.latestClassification === "MIXED";
    }).length;
  }, [questions]);

  if (showResults) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-offwhite px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal/10">
            <Sparkles className="h-8 w-8 text-teal" strokeWidth={1.5} />
          </div>
          <h2 className="text-2xl font-bold text-navy">
            {t("test.completed")} {totalQuestions} {t("test.questions")}
          </h2>
          <p className="mt-2 text-sm text-gray-400">{t("test.greatJob")}</p>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-teal/10 p-4">
              <p className="text-2xl font-bold text-teal">{correctCount}</p>
              <p className="text-xs text-gray-500">{t("test.correct")}</p>
            </div>
            <div className="rounded-xl bg-coral/10 p-4">
              <p className="text-2xl font-bold text-coral">
                {totalQuestions - correctCount}
              </p>
              <p className="text-xs text-gray-500">{t("test.toReview")}</p>
            </div>
            <div className="rounded-xl bg-gold/10 p-4">
              <p className="text-2xl font-bold text-navy">{totalXP}</p>
              <p className="text-xs text-gray-500">{t("test.xpEarned")}</p>
            </div>
          </div>

          <div className="mt-6 space-y-2 text-left">
            <div className="flex items-center justify-between rounded-lg bg-teal/5 px-4 py-2">
              <span className="text-sm text-gray-600">{t("test.languageBarriers")}</span>
              <span className="text-sm font-semibold text-teal">
                {languageGaps > 0 ? languageGaps : 0} {t("test.identified")}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-coral/5 px-4 py-2">
              <span className="text-sm text-gray-600">{t("test.contentGaps")}</span>
              <span className="text-sm font-semibold text-coral">
                {contentGaps > 0 ? contentGaps : 0} {t("test.identified")}
              </span>
            </div>
          </div>

          <p className="mt-6 text-xs text-gray-400">
            {t("test.teacherResults")}
          </p>

          {mixedGaps > 0 && (
            <p className="mt-2 text-xs text-gray-400">
              Mixed gaps identified: {mixedGaps}
            </p>
          )}

          <Link
            href={`/student?studentId=${studentId}`}
            className="mt-4 inline-block rounded-lg bg-teal px-6 py-3 text-sm font-medium text-white transition-all duration-200 hover:scale-[1.02]"
          >
            {t("test.backToDashboard")}
          </Link>
        </div>
      </div>
    );
  }

  if (error !== null && diagnostic === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-offwhite px-4 text-sm text-navy">
        {error}
      </div>
    );
  }

  if (question === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-offwhite px-4 text-sm text-gray-500">
        No diagnostic questions are ready yet. Upload student misses and generate Spanish questions first.
      </div>
    );
  }

  const letters = ["A", "B", "C", "D"];
  const correctChoiceIndex = getChoiceIndex(question.correctAnswer);

  return (
    <div className="flex min-h-screen flex-col bg-offwhite">
      {/* Top Bar */}
      <header className="flex items-center justify-between bg-white px-6 py-3 shadow-sm">
        <Link
          href={`/student?studentId=${studentId}`}
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </Link>

        <div className="flex items-center gap-4">
          <span className="text-lg font-bold text-teal">Saber</span>
          <LanguageToggle />
        </div>

        <div className="flex items-center gap-3">
          {/* Progress bar */}
          <div className="h-2 w-32 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-teal transition-all duration-600"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs font-medium text-gray-400">{t("test.progress")}</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold text-xs font-bold text-navy">
            {profile?.student.level ?? 1}
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center px-4 py-8">
        <div className="w-full max-w-2xl">
          <p className="mb-6 text-center text-xs font-semibold uppercase tracking-widest text-gray-400">
            {t("test.question")} {currentIndex + 1} {t("quest.of")} {totalQuestions}
          </p>

          <h2 className="mb-2 text-center text-2xl font-bold leading-snug text-navy">
            {questionText}
          </h2>
          <p className="mb-8 text-center text-sm italic text-gray-400">
            {subtitleText}
          </p>

          <div className="relative mb-6 grid grid-cols-2 gap-3">
            <XPAnimation xp={50} show={showXP} />

            {choices?.map((choice, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrect = feedback !== null && index === correctChoiceIndex;
              const isWrong =
                feedback !== null && isSelected && index !== correctChoiceIndex;

              return (
                <button
                  key={`${question.id}-${index}`}
                  onClick={() => handleSelect(index)}
                  disabled={!!feedback}
                  className={`relative flex flex-col rounded-xl border-2 p-4 text-left transition-all duration-200 ${
                    isCorrect
                      ? "border-success bg-success/10"
                      : isWrong
                        ? "border-coral bg-coral/5"
                        : isSelected
                          ? "border-teal bg-teal/5 scale-[1.02]"
                          : "border-gray-100 bg-white hover:border-teal/50 hover:scale-[1.02] hover:shadow-md"
                  }`}
                >
                  <span className="mb-1 text-xs font-bold text-teal">
                    {letters[index]}
                  </span>
                  <span className="text-sm font-medium text-navy">{choice}</span>
                  {subtitleChoices && (
                    <span className="mt-0.5 text-xs text-gray-400">
                      {subtitleChoices[index]}
                    </span>
                  )}
                  {isSelected && !feedback && (
                    <div className="absolute right-3 top-3">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-teal">
                        <Check className="h-3 w-3 text-white" strokeWidth={3} />
                      </div>
                    </div>
                  )}
                  {isCorrect && feedback && (
                    <div className="absolute right-3 top-3">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-success">
                        <Check className="h-3 w-3 text-white" strokeWidth={3} />
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {feedback?.correct && (
            <div className="mb-4 flex items-start gap-3 rounded-xl bg-gold/10 p-4">
              <Sparkles className="h-5 w-5 flex-shrink-0 text-gold" strokeWidth={2} />
              <div>
                <p className="text-sm font-bold text-navy">{feedback.message}</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {feedback.explanation ?? t("test.learningFast")}
                </p>
              </div>
            </div>
          )}

          {feedback && !feedback.correct && (
            <div className="mb-4 rounded-xl bg-coral/5 p-4">
              <p className="text-sm font-medium text-navy">{feedback.message}</p>
              {feedback.explanation && (
                <p className="mt-1 text-xs text-gray-500">{feedback.explanation}</p>
              )}
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-xl border border-coral/20 bg-coral/5 p-4 text-sm text-navy">
              {error}
            </div>
          )}

          <div className="mb-6 rounded-xl bg-white p-4 shadow-sm">
            <p className="mb-2 text-xs font-medium text-gray-400">
              {t("test.alternative")}
            </p>
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder={t("test.placeholder")}
                value={isListening ? transcript : textAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
                className="flex-1 rounded-lg border border-gray-100 bg-gray-50 px-4 py-2.5 text-sm text-navy placeholder:text-gray-300 focus:border-teal focus:outline-none"
              />
              <MicButton isListening={isListening} onClick={handleMicToggle} />
            </div>
          </div>

          {!feedback ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || (selectedAnswer === null && !textAnswer && !transcript)}
              className="w-full rounded-lg bg-navy py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSubmitting ? "Submitting..." : t("test.submitAnswer")}
            </button>
          ) : (
            <button
              onClick={handleContinue}
              className="w-full rounded-lg bg-teal py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.01]"
            >
              {t("test.continue")}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

function parseStudentId(value: string | null): number {
  if (value === null) {
    return 1;
  }

  const parsedValue = Number(value);

  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : 1;
}

function getChoiceIndex(correctAnswer: string): number | null {
  const choiceIndexMap: Record<string, number> = {
    a: 0,
    b: 1,
    c: 2,
    d: 3,
  };

  return choiceIndexMap[correctAnswer.trim().toLowerCase()] ?? null;
}
