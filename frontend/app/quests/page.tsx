"use client";

import { useState, useCallback } from "react";
import { X, Check, Trophy, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { mockDiagnosticQuestions } from "@/lib/mockData";
import XPAnimation from "@/components/XPAnimation";
import MicButton from "@/components/MicButton";
import useSpeechToText from "@/hooks/useSpeechToText";
import { useLanguage } from "@/components/LanguageProvider";

export default function QuestView() {
  const { t } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ correct: boolean } | null>(null);
  const [showXP, setShowXP] = useState(false);
  const [totalXP, setTotalXP] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [textAnswer, setTextAnswer] = useState("");

  const { transcript, isListening, startListening, stopListening, resetTranscript } =
    useSpeechToText("es-ES");

  // Use diagnostic questions as quest questions
  const questions = mockDiagnosticQuestions.slice(0, 4);
  const question = questions[currentIndex];
  const totalQuestions = questions.length;
  const progressPct = ((currentIndex + 1) / totalQuestions) * 100;
  const letters = ["A", "B", "C", "D"];

  const handleSelect = useCallback(
    (index: number) => {
      if (feedback) return;
      setSelectedAnswer(index);
    },
    [feedback]
  );

  const handleSubmit = useCallback(() => {
    if (selectedAnswer === null) return;

    const isCorrect = selectedAnswer === question.correctAnswer;
    if (isCorrect) {
      setTotalXP((xp) => xp + 30);
      setShowXP(true);
      setTimeout(() => setShowXP(false), 1100);
    }
    setFeedback({ correct: isCorrect });
  }, [selectedAnswer, question]);

  const handleContinue = useCallback(() => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
      setFeedback(null);
      setTextAnswer("");
      resetTranscript();
    } else {
      setCompleted(true);
    }
  }, [currentIndex, totalQuestions, resetTranscript]);

  const handleMicToggle = useCallback(() => {
    if (isListening) {
      stopListening();
      setTextAnswer(transcript);
    } else {
      resetTranscript();
      startListening();
    }
  }, [isListening, startListening, stopListening, transcript, resetTranscript]);

  // Completion screen
  if (completed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-offwhite px-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-md">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gold/20">
            <Trophy className="h-10 w-10 text-gold" strokeWidth={1.5} />
          </div>
          <h2 className="text-2xl font-bold text-navy">{t("quest.complete")}</h2>
          <p className="mt-2 text-sm text-gray-400">
            {t("quest.masterMath")}
          </p>
          <div className="my-6 rounded-xl bg-gold/10 px-6 py-4">
            <p className="text-3xl font-bold text-navy">{totalXP} XP</p>
            <p className="text-xs text-gray-500">{t("quest.earned")}</p>
          </div>
          <Link
            href="/student"
            className="inline-flex items-center gap-2 rounded-lg bg-teal px-6 py-3 text-sm font-medium text-white transition-all duration-200 hover:scale-[1.02]"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("quest.backToDashboard")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-offwhite">
      {/* Top Bar */}
      <header className="flex items-center justify-between bg-white px-6 py-3 shadow-sm">
        <Link
          href="/student"
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </Link>
        <div>
          <span className="text-lg font-bold text-teal">Saber</span>
          <span className="ml-3 text-sm text-gray-400">
            {t("quest.masterMath")}
          </span>
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

      {/* Question Area */}
      <main className="flex flex-1 flex-col items-center px-4 py-8">
        <div className="w-full max-w-2xl">
          <p className="mb-6 text-center text-xs font-semibold uppercase tracking-widest text-gray-400">
            {t("quest.exercise")} {currentIndex + 1} {t("quest.of")} {totalQuestions}
          </p>

          <h2 className="mb-2 text-center text-2xl font-bold leading-snug text-navy">
            {question.questionEs}
          </h2>
          <p className="mb-8 text-center text-sm italic text-gray-400">
            {question.questionEn}
          </p>

          {/* Answer Cards */}
          <div className="relative mb-6 grid grid-cols-2 gap-3">
            <XPAnimation xp={30} show={showXP} />

            {question.choicesEs.map((choice, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrect = feedback && index === question.correctAnswer;
              const isWrong = feedback && isSelected && index !== question.correctAnswer;

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
                    {question.choicesEn[index]}
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

          {/* Text input + mic */}
          <div className="mb-6 rounded-xl bg-white p-4 shadow-sm">
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

          {/* Button */}
          {!feedback ? (
            <button
              onClick={handleSubmit}
              disabled={selectedAnswer === null}
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
