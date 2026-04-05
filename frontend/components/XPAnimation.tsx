interface XPAnimationProps {
  xp: number;
  show: boolean;
}

export default function XPAnimation({ xp, show }: XPAnimationProps) {
  if (!show) return null;

  return (
    <div className="pointer-events-none absolute -top-2 right-4 z-10">
      <span className="animate-xp-float inline-flex items-center gap-1 rounded-full bg-gold px-3 py-1 text-sm font-bold text-navy shadow-lg">
        +{xp} XP
      </span>
    </div>
  );
}
