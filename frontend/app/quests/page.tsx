"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { X, Check, Trophy, ArrowLeft, Lightbulb } from "lucide-react";
import LanguageToggle from "@/components/ui/LanguageToggle";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import XPAnimation from "@/components/XPAnimation";
import MicButton from "@/components/MicButton";
import useSpeechToText from "@/hooks/useSpeechToText";
import { useLanguage } from "@/components/LanguageProvider";
import {
  explainQuestion,
  getStudentDashboard,
  getStudentDiagnostic,
  submitDiagnosticAnswer,
  type QuestionExplanationData,
  type StudentDiagnosticResponseData,
  type StudentProfileResponseData,
} from "@/lib/api";

export default function QuestView() {
  const searchParams = useSearchParams();
  const { lang, t } = useLanguage();
  const studentId = parseStudentId(searchParams.get("studentId"));
  const questId = parseQuestId(searchParams.get("questId"));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ correct: boolean } | null>(null);
  const [showXP, setShowXP] = useState(false);
  const [totalXP, setTotalXP] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [textAnswer, setTextAnswer] = useState("");
  const [inputMethod, setInputMethod] = useState<"text" | "speech">("text");
  const [profile, setProfile] = useState<StudentProfileResponseData | null>(null);
  const [diagnostic, setDiagnostic] = useState<StudentDiagnosticResponseData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aiExplanation, setAiExplanation] = useState<QuestionExplanationData | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);

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

        if (!cancelled) {
          setProfile(nextProfile);
          setDiagnostic(nextDiagnostic);
          setError(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : "Failed to load the quest.",
          );
        }
      }
    };

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [studentId]);

  const quest = useMemo(() => {
    return profile?.quests.find((entry) => entry.id === questId) ?? profile?.quests[0] ?? null;
  }, [profile, questId]);

  const questions = useMemo(() => {
    const allQuestions = diagnostic?.questions ?? [];

    if (quest === null) {
      return allQuestions.slice(0, 4);
    }

    const matchingQuestions = allQuestions.filter((question) => {
      return question.skillTag === quest.skillTag;
    });

    return (matchingQuestions.length > 0 ? matchingQuestions : allQuestions).slice(0, 4);
  }, [diagnostic, quest]);

  const question = questions[currentIndex];
  const totalQuestions = questions.length;
  const progressPct = totalQuestions === 0 ? 0 : ((currentIndex + 1) / totalQuestions) * 100;
  const letters = ["A", "B", "C", "D"];
  const transcriptAnswer = transcript.trim();
  const typedAnswer = textAnswer.trim();
  const freeResponseAnswer = (isListening ? transcriptAnswer : typedAnswer).trim();
  const canSubmit = selectedAnswer !== null || (!isListening && freeResponseAnswer.length > 0);

  const handleSelect = useCallback(
    (index: number) => {
      if (feedback) return;
      setSelectedAnswer(index);
      setTextAnswer("");
      setInputMethod("text");
    },
    [feedback]
  );

  const handleSubmit = useCallback(() => {
    if (question === undefined || !canSubmit) {
      return;
    }

    const answerEs =
      selectedAnswer === null
        ? freeResponseAnswer
        : question.choicesEs?.[selectedAnswer] ?? question.choicesEn?.[selectedAnswer] ?? "";
    const nextInputMethod = selectedAnswer === null ? inputMethod : "text";

    const submitAnswer = async (): Promise<void> => {
      try {
        const answerResult = await submitDiagnosticAnswer({
          studentId,
          questionId: question.id,
          answerEs,
          inputMethod: nextInputMethod,
        });

        if (answerResult.correct) {
          setTotalXP((xp) => xp + answerResult.xpEarned);
          setShowXP(true);
          setTimeout(() => setShowXP(false), 1100);
        }

        setFeedback({ correct: answerResult.correct });
      } catch (submitError) {
        setError(
          submitError instanceof Error ? submitError.message : "Failed to submit the quest answer.",
        );
      }
    };

    void submitAnswer();
  }, [canSubmit, freeResponseAnswer, inputMethod, question, selectedAnswer, studentId]);

  const handleContinue = useCallback(() => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
      setFeedback(null);
      setTextAnswer("");
      setInputMethod("text");
      setAiExplanation(null);
      resetTranscript();
    } else {
      setCompleted(true);
    }
  }, [currentIndex, totalQuestions, resetTranscript]);

  const handleExplain = useCallback(() => {
    if (question === undefined || isExplaining) return;

    const studentAnswer =
      selectedAnswer !== null
        ? (question.choicesEs?.[selectedAnswer] ?? question.choicesEn?.[selectedAnswer] ?? "")
        : textAnswer.trim();

    const runExplain = async (): Promise<void> => {
      setIsExplaining(true);
      try {
        const result = await explainQuestion({
          questionEn: question.questionEn,
          questionEs: question.questionEs,
          correctAnswer: question.correctAnswer,
          studentAnswer: studentAnswer.length > 0 ? studentAnswer : "(no answer)",
          subject: question.subject,
          responseLang: lang === "es" ? "es" : "en",
        });
        setAiExplanation(result);
      } catch (explainError) {
        setAiExplanation(null);
        setError(explainError instanceof Error ? explainError.message : "Could not load the explanation. Try again.");
      } finally {
        setIsExplaining(false);
      }
    };

    void runExplain();
  }, [question, isExplaining, selectedAnswer, textAnswer, lang]);

  const handleMicToggle = useCallback(() => {
    if (isListening) {
      stopListening();
      const spokenAnswer = transcript.trim();
      setTextAnswer(spokenAnswer);
      if (spokenAnswer.length > 0) {
        setInputMethod("speech");
      }
    } else {
      setSelectedAnswer(null);
      setInputMethod("speech");
      resetTranscript();
      startListening();
    }
  }, [isListening, startListening, stopListening, transcript, resetTranscript]);

  if (completed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-offwhite px-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-md">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gold/20">
            <Trophy className="h-10 w-10 text-gold" strokeWidth={1.5} />
          </div>
          <h2 className="text-2xl font-bold text-navy">{t("quest.complete")}</h2>
          <p className="mt-2 text-sm text-gray-400">
            {quest?.skillTag ?? t("quest.masterMath")}
          </p>
          <div className="my-6 rounded-xl bg-gold/10 px-6 py-4">
            <p className="text-3xl font-bold text-navy">{totalXP} XP</p>
            <p className="text-xs text-gray-500">{t("quest.earned")}</p>
          </div>
          <Link
            href={`/student?studentId=${studentId}`}
            className="inline-flex items-center gap-2 rounded-lg bg-teal px-6 py-3 text-sm font-medium text-white transition-all duration-200 hover:scale-[1.02]"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("quest.backToDashboard")}
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
        No quest questions are ready yet for this student.
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-offwhite">
      <header className="flex items-center justify-between bg-white px-6 py-3 shadow-sm">
        <Link
          href={`/student?studentId=${studentId}`}
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-teal">Saber</span>
          <span className="text-sm text-gray-400">
            {quest?.skillTag ?? t("quest.masterMath")}
          </span>
          <LanguageToggle />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-2 w-32 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-gold transition-all duration-600"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-xs text-gray-400">
            {currentIndex + 1}/{totalQuestions}
          </span>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center px-4 py-8">
        <div className="w-full max-w-2xl">
          <p className="mb-6 text-center text-xs font-semibold uppercase tracking-widest text-gray-400">
            {t("quest.exercise")} {currentIndex + 1} {t("quest.of")} {totalQuestions}
          </p>

          <h2 className="mb-2 text-center text-2xl font-bold leading-snug text-navy">
            {lang === "es" ? question.questionEs : question.questionEn}
          </h2>
          <p className="mb-8 text-center text-sm italic text-gray-400">
            {lang === "es" ? question.questionEn : question.questionEs}
          </p>

          <div className="relative mb-6 grid grid-cols-2 gap-3">
            <XPAnimation xp={30} show={showXP} />

            {(lang === "es" ? (question.choicesEs ?? []) : (question.choicesEn ?? [])).map((choice, index) => {
              const isSelected = selectedAnswer === index;
              const correctChoiceIndex = getChoiceIndex(question.correctAnswer);
              const isCorrect = feedback && index === correctChoiceIndex;
              const isWrong = feedback && isSelected && index !== correctChoiceIndex;
              const subtitleChoices = lang === "es" ? question.choicesEn : question.choicesEs;

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
                  <span className="mt-0.5 text-xs text-gray-400">
                    {subtitleChoices?.[index]}
                  </span>
                  {(isSelected && !feedback) || isCorrect ? (
                    <div className="absolute right-3 top-3">
                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded-full ${
                          isCorrect ? "bg-success" : "bg-teal"
                        }`}
                      >
                        <Check className="h-3 w-3 text-white" strokeWidth={3} />
                      </div>
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>

          {feedback && !feedback.correct && (
            <div className="mb-4 rounded-xl bg-coral/5 p-4">
              <p className="text-sm font-medium text-navy">
                {t("test.keepGoing")}
              </p>

              {!aiExplanation && (
                <button
                  onClick={handleExplain}
                  disabled={isExplaining}
                  className="mt-3 flex items-center gap-2 rounded-lg bg-gold/20 px-4 py-2 text-sm font-medium text-navy transition-all hover:bg-gold/30 disabled:opacity-50"
                >
                  <Lightbulb className="h-4 w-4 text-gold" strokeWidth={2} />
                  {isExplaining
                    ? lang === "es" ? "Analizando..." : "Breaking it down..."
                    : lang === "es" ? "Explícamelo" : "Break it down for me"}
                </button>
              )}

              {aiExplanation && (
                <div className="mt-3 space-y-3 rounded-xl border border-gold/30 bg-white p-4">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-gold" strokeWidth={2} />
                    <span className="text-sm font-bold text-navy">
                      {lang === "es" ? "Desglose de Saber" : "Saber Breakdown"}
                    </span>
                  </div>

                  {aiExplanation.keywords.length > 0 && (
                    <div>
                      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                        {lang === "es" ? "Palabras clave" : "Key Words"}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {aiExplanation.keywords.map((kw) => (
                          <span
                            key={kw.word}
                            className="inline-flex flex-col rounded-lg bg-teal/10 px-3 py-1.5"
                          >
                            <span className="text-xs font-bold text-teal">{kw.word}</span>
                            <span className="text-xs text-gray-500">{kw.definition}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
                      {lang === "es" ? "El concepto" : "The Concept"}
                    </p>
                    <p className="text-sm leading-relaxed text-navy">
                      {aiExplanation.conceptExplanation}
                    </p>
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
                      {lang === "es" ? "Paso a paso" : "Step by Step"}
                    </p>
                    <p className="text-sm leading-relaxed text-navy">
                      {aiExplanation.stepByStep}
                    </p>
                  </div>

                  {aiExplanation.languageTip && (
                    <div className="rounded-lg bg-gold/10 px-3 py-2">
                      <p className="text-xs font-semibold text-navy">
                        {lang === "es" ? "Tip de lenguaje" : "Language Tip"}
                      </p>
                      <p className="text-xs leading-relaxed text-gray-600">
                        {aiExplanation.languageTip}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="mb-6 rounded-xl bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder={t("test.placeholder")}
                value={isListening ? transcript : textAnswer}
                onChange={(e) => {
                  setSelectedAnswer(null);
                  setTextAnswer(e.target.value);
                  setInputMethod("text");
                }}
                className="flex-1 rounded-lg border border-gray-100 bg-gray-50 px-4 py-2.5 text-sm text-navy placeholder:text-gray-300 focus:border-teal focus:outline-none"
              />
              <MicButton isListening={isListening} onClick={handleMicToggle} />
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-coral/20 bg-coral/5 p-4 text-sm text-navy">
              {error}
            </div>
          )}

          {!feedback ? (
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full rounded-lg bg-navy py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t("quest.submit")}
            </button>
          ) : (
            <button
              onClick={handleContinue}
              className="w-full rounded-lg bg-teal py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.01]"
            >
              {t("quest.continue")}
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

function parseQuestId(value: string | null): number | null {
  if (value === null) {
    return null;
  }

  const parsedValue = Number(value);

  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : null;
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
