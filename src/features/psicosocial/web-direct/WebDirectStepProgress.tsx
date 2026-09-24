import { Progress } from "@/components/ui/progress";

type WebDirectStepProgressProps = {
  current: number;
  total: number;
  label?: string;
};

export function WebDirectStepProgress({ current, total, label }: WebDirectStepProgressProps) {
  const safeTotal = Math.max(total, 1);
  const safeCurrent = Math.min(Math.max(current, 0), safeTotal);
  const percentage = Math.round((safeCurrent / safeTotal) * 100);

  return (
    <div className="mb-5 rounded-2xl border border-border bg-surface px-4 py-3 shadow-sm sm:mb-6 sm:px-5">
      <div className="mb-2 flex items-center justify-between gap-4 text-xs font-bold sm:text-sm">
        <span>{label ?? `Paso ${safeCurrent} de ${safeTotal}`}</span>
        <span className="text-primary">{percentage}%</span>
      </div>
      <Progress
        value={percentage}
        aria-label={`${label ?? `Paso ${safeCurrent} de ${safeTotal}`}: ${percentage}% completado`}
      />
    </div>
  );
}
