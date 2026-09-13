import evaIsotipoWhite from "@/assets/eva-isotipo-white.png";
import AbrilWordmark from "@/components/brand/AbrilWordmark";

type AbrilBrandLockupProps = {
  className?: string;
  subtitle?: string;
  subtitleClassName?: string;
  iconWrapperClassName?: string;
  iconClassName?: string;
  wordmarkClassName?: string;
  accentClassName?: string;
};

export default function AbrilBrandLockup({
  className = "",
  subtitle = "Gestión psicosocial",
  subtitleClassName = "text-xs uppercase tracking-[0.32em] text-cyan-100/70",
  iconWrapperClassName = "grid h-14 w-14 place-items-center rounded-3xl border border-white/10 bg-white/10 p-2 shadow-2xl shadow-violet-950/40",
  iconClassName = "h-full w-full scale-[0.94] translate-x-[5%] object-contain object-center",
  wordmarkClassName = "text-3xl font-black tracking-tight text-white",
  accentClassName = "text-cyan-400",
}: AbrilBrandLockupProps) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div className={`${iconWrapperClassName} overflow-hidden`}>
        <img src={evaIsotipoWhite} alt="" className={iconClassName} aria-hidden="true" />
      </div>
      <div>
        <AbrilWordmark className={wordmarkClassName} accentClassName={accentClassName} />
        <div className={subtitleClassName}>{subtitle}</div>
      </div>
    </div>
  );
}
