import { useId } from "react";

interface RangeControlProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  valueLabel?: string;
  step?: number;
  hint?: string;
}

export function RangeControl({
  label,
  value,
  onChange,
  valueLabel = `${value}%`,
  step = 1,
  hint,
}: RangeControlProps) {
  const id = useId();
  return (
    <div className="range-control">
      <div className="flex justify-between gap-3 text-xs">
        <label htmlFor={id}>{label}</label>
        <output htmlFor={id} className="font-mono text-accent">
          {valueLabel}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        step={step}
        value={value}
        aria-valuetext={valueLabel}
        aria-describedby={hint ? `${id}-hint` : undefined}
        onChange={(event) => onChange(event.currentTarget.valueAsNumber)}
        className="mt-3 w-full accent-accent"
      />
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-xs leading-5 text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}
