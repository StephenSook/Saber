"use client";

import { useState } from "react";
import { X, Lightbulb, Calendar, Plus, Check } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import type { UiClassification } from "@/lib/ui";
import { getClassificationColor, getInitials, getInitialsBgColor } from "@/lib/ui";

export interface StudentDetailPanelStudent {
  id: number;
  name: string;
  classification: UiClassification;
  skills: Array<{
    skillTag: string;
    classification: UiClassification;
    explanation: string | null;
    diagnosticCount: number;
  }>;
}

interface StudentDetailPanelProps {
  student: StudentDetailPanelStudent;
  onClose: () => void;
}

export default function StudentDetailPanel({
  student,
  onClose,
}: StudentDetailPanelProps) {
  const { t } = useLanguage();
  const initials = getInitials(student.name);
  const bgColor = getInitialsBgColor(student.name);
  const classInfo = getClassificationColor(student.classification);
  const [assignedSkills, setAssignedSkills] = useState<Set<string>>(new Set());
  const [assigningSkill, setAssigningSkill] = useState<string | null>(null);

  const handleAssign = async (skillTag: string): Promise<void> => {
    setAssigningSkill(skillTag);
    try {
      await fetch(`/api/students/${student.id}/quests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillTag }),
      });
      setAssignedSkills((prev) => new Set(prev).add(skillTag));
    } finally {
      setAssigningSkill(null);
    }
  };

  return (
    <div className="sticky top-0 flex h-screen w-80 flex-col border-l border-gray-100 bg-white">
      <div className="flex items-start justify-between p-5 pb-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white ${bgColor}`}
          >
            {initials}
          </div>
          <div>
            <h3 className="text-base font-bold text-navy">{student.name}</h3>
            <span
              className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${classInfo.bg} ${classInfo.text}`}
            >
              {classInfo.label}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5">
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          {t("detail.skillsMastery")}
          <span className="float-right normal-case tracking-normal text-gray-300">
            {t("detail.masteryLevel")}
          </span>
        </h4>

        <div className="space-y-4">
          {student.skills.length > 0 ? (
            student.skills.map((skill, skillIndex) => {
              const skillColor = getClassificationColor(skill.classification);
              const seed = skill.skillTag.length + skillIndex;
              const mastery =
                skill.classification === "language"
                  ? 65 + (seed % 20)
                  : skill.classification === "content"
                    ? 25 + (seed % 20)
                    : skill.classification === "ontrack"
                      ? 85 + (seed % 10)
                      : 45 + (seed % 15);

              const isAssigned = assignedSkills.has(skill.skillTag);
              const isAssigning = assigningSkill === skill.skillTag;

              return (
                <div key={skill.skillTag}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-medium text-navy">
                      {skill.skillTag}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{mastery}%</span>
                      <button
                        onClick={() => void handleAssign(skill.skillTag)}
                        disabled={isAssigned || isAssigning}
                        title={isAssigned ? "Quest assigned" : "Assign practice quest"}
                        className={`flex h-5 w-5 items-center justify-center rounded-full transition-all duration-200 ${
                          isAssigned
                            ? "bg-teal/20 text-teal"
                            : "bg-gray-100 text-gray-400 hover:bg-teal/20 hover:text-teal"
                        } disabled:cursor-default`}
                      >
                        {isAssigned ? (
                          <Check className="h-3 w-3" strokeWidth={2.5} />
                        ) : (
                          <Plus className="h-3 w-3" strokeWidth={2.5} />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={`h-full rounded-full ${skillColor.bg} transition-all duration-500`}
                      style={{ width: `${mastery}%` }}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-gray-400">{t("detail.noSkills")}</p>
          )}
        </div>

        {student.skills.length > 0 && (
          <div className="mt-6 rounded-xl bg-gold/10 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-gold" strokeWidth={2} />
              <span className="text-sm font-semibold text-navy">
                {t("detail.coachInsight")}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-gray-600">
              {student.skills[0]?.explanation ?? t("detail.noSkills")}
            </p>
          </div>
        )}

        <div className="mb-4 mt-6">
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            {t("detail.classMilestones")}
          </h4>
          <div className="flex items-center gap-3 rounded-lg border border-gray-100 p-3">
            <Calendar className="h-5 w-5 text-gray-300" strokeWidth={1.5} />
            <div>
              <p className="text-sm font-medium text-navy">{t("detail.midTerm")}</p>
              <p className="text-xs text-gray-400">{t("detail.today")}</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
