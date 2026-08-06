type AbrilWordmarkProps = {
  className?: string;
  accentClassName?: string;
};

export default function AbrilWordmark({
  className = "text-2xl font-black",
  accentClassName = "text-violet-500",
}: AbrilWordmarkProps) {
  return (
    <span className={className} aria-label="ABRIL360">
      ABRIL<span className={accentClassName}>360</span>
    </span>
  );
}
