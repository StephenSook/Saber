"use client";

import Link from "next/link";
import { Upload, Languages, BarChart3, Quote, LayoutDashboard, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/components/LanguageProvider";
import LanguageToggle from "@/components/ui/LanguageToggle";
import { Typewriter } from "@/components/ui/typewriter";
import { ScrollReveal, ScrollStagger } from "@/components/ui/ScrollReveal";

export default function Landing() {
  const { t } = useLanguage();

  const steps = [
    {
      icon: Upload,
      title: t("landing.step1Title"),
      description: t("landing.step1Desc"),
    },
    {
      icon: Languages,
      title: t("landing.step2Title"),
      description: t("landing.step2Desc"),
    },
    {
      icon: BarChart3,
      title: t("landing.step3Title"),
      description: t("landing.step3Desc"),
    },
  ];

  const stats = [
    { value: "5.3M", label: t("landing.stat1Label") },
    { value: "108K", label: t("landing.stat2Label") },
    { value: "0", label: t("landing.stat3Label") },
  ];

  return (
    <div className="min-h-screen bg-offwhite overflow-x-hidden">
      {/* Nav */}
      <nav className="flex items-center justify-between bg-white px-8 py-4 shadow-sm">
        <span className="inline-block w-[120px]">
          <Typewriter
            text={["Saber", "To Know"]}
            speed={80}
            className="text-xl font-bold text-teal"
            waitTime={3000}
            deleteSpeed={50}
            cursorChar="_"
            cursorClassName="text-teal/40 font-light"
          />
        </span>
        <LanguageToggle />
      </nav>

      {/* Hero — entrance animation */}
      <section className="px-8 pb-16 pt-20">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center gap-16">
            {/* Left — text slides in from left */}
            <motion.div
              className="flex-1"
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
              <h1 className="text-5xl font-bold leading-tight text-navy">
                {t("landing.heroLine1")}{" "}
                <span className="text-teal">{t("landing.heroHighlight")}</span>
              </h1>
              <p className="mt-4 max-w-md text-lg text-gray-500">
                {t("landing.subtitle")}
              </p>
              <motion.div
                className="mt-8 flex gap-5"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
              >
                <Link href="/signup" className="group relative">
                  <div className="absolute -inset-[2px] rounded-xl bg-gradient-to-r from-teal via-success to-teal opacity-60 blur-lg transition-all duration-500 group-hover:opacity-100 group-hover:blur-xl" />
                  <span className="relative flex items-center gap-2 rounded-xl bg-teal px-7 py-3.5 text-sm font-semibold text-white shadow-xl transition-all duration-300 group-hover:bg-teal/90 group-hover:scale-[1.03] group-hover:shadow-teal/25">
                    <LayoutDashboard className="h-4 w-4" strokeWidth={2} />
                    Get Started
                  </span>
                </Link>

                <Link href="/login" className="group relative">
                  <div className="absolute -inset-[2px] rounded-xl bg-gradient-to-r from-coral via-gold to-coral opacity-50 blur-lg transition-all duration-500 group-hover:opacity-90 group-hover:blur-xl" />
                  <span className="relative flex items-center gap-2 rounded-xl border-2 border-navy/10 bg-white px-7 py-3.5 text-sm font-semibold text-navy shadow-xl transition-all duration-300 group-hover:scale-[1.03] group-hover:border-coral/30 group-hover:shadow-coral/20">
                    <BookOpen className="h-4 w-4 text-coral transition-transform duration-300 group-hover:scale-110" strokeWidth={2} />
                    Sign In
                  </span>
                </Link>
              </motion.div>
            </motion.div>

            {/* Right — illustration slides in from right */}
            <motion.div
              className="flex-1"
              initial={{ opacity: 0, x: 40, rotate: 2 }}
              animate={{ opacity: 1, x: 0, rotate: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            >
              <img
                src="/hero-illustration.png"
                alt="Student having an aha moment in both English and Spanish"
                className="w-full rounded-2xl shadow-2xl"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Banner — each stat pops in staggered */}
      <section className="bg-teal py-6">
        <div className="mx-auto flex max-w-3xl items-center justify-around">
          {stats.map((stat, i) => (
            <ScrollStagger key={stat.label} staggerIndex={i} className="text-center">
              <p className="text-3xl font-bold text-white">{stat.value}</p>
              <p className="text-sm text-white/70">{stat.label}</p>
            </ScrollStagger>
          ))}
        </div>
      </section>

      {/* How It Works — heading fades in, cards stagger up */}
      <section className="px-8 py-20">
        <div className="mx-auto max-w-5xl">
          <ScrollReveal direction="up" distance={30}>
            <h2 className="mb-12 text-center text-3xl font-bold text-navy">
              {t("landing.howItWorks")}
            </h2>
          </ScrollReveal>

          <div className="grid grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <ScrollStagger key={step.title} staggerIndex={i}>
                <div className="rounded-xl bg-white p-6 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-teal/10">
                    <step.icon
                      className="h-6 w-6 text-teal"
                      strokeWidth={1.5}
                    />
                  </div>
                  <h3 className="mb-2 text-base font-bold text-navy">
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-gray-500">
                    {step.description}
                  </p>
                </div>
              </ScrollStagger>
            ))}
          </div>
        </div>
      </section>

      {/* Educator Insight — slides in from the left with slight rotation */}
      <section className="bg-navy/5 px-8 py-16">
        <div className="mx-auto max-w-3xl">
          <ScrollReveal direction="left" distance={50} scaleFrom={0.95} rotate={-1}>
            <div className="rounded-2xl bg-white p-8 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-coral/10">
                  <Quote className="h-4 w-4 text-coral" strokeWidth={2} />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {t("landing.educatorInsight")}
                </span>
              </div>
              <blockquote className="text-lg leading-relaxed text-navy">
                &ldquo;{t("landing.quote")}&rdquo;
              </blockquote>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer — subtle fade up */}
      <ScrollReveal distance={20}>
        <footer className="border-t border-gray-200 bg-white px-8 py-6">
          <div className="mx-auto max-w-5xl text-xs text-gray-400">
            <span>
              2026 SABER {t("landing.heroLine1").toUpperCase()}{" "}
              {t("landing.heroHighlight").toUpperCase()}.
            </span>
          </div>
        </footer>
      </ScrollReveal>
    </div>
  );
}
