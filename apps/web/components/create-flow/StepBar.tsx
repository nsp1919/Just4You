"use client";

import { Check } from "lucide-react";

const STEPS = ["Occasion", "Package", "Details", "Photos", "Media", "Preview", "Pay"];

interface Props {
  step: number;
  onStepChange: (step: number) => void;
}

export default function StepBar({ step, onStepChange }: Props) {
  return (
    <nav className="mb-10 overflow-hidden" aria-label="Creation progress">
      <ol className="mx-auto flex items-center justify-center gap-0.5 sm:gap-1">
        {STEPS.map((label, index) => (
          <li key={label} className="flex items-center gap-1">
            {index < step ? (
              <button
                type="button"
                onClick={() => onStepChange(index)}
                className="flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/20 px-2 py-1.5 text-xs font-semibold text-green-400 transition-all duration-300 hover:border-green-400/50 hover:bg-green-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400/70 sm:px-3"
                aria-label={`Go back to ${label}`}
                title={`Edit ${label}`}
              >
                <Check size={11} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ) : (
              <div
                className={`flex items-center gap-2 rounded-full border px-2 py-1.5 text-xs font-semibold transition-all duration-300 sm:px-3 ${index === step ? "text-white" : "border-transparent text-[var(--text-muted)]"}`}
                style={index === step ? { background: "rgba(168,85,247,0.2)", borderColor: "rgba(168,85,247,0.5)" } : {}}
                aria-current={index === step ? "step" : undefined}
              >
                <span className="w-4 text-center">{index + 1}</span>
                <span className="hidden sm:inline">{label}</span>
              </div>
            )}
            {index < STEPS.length - 1 && <div aria-hidden="true" className="h-px w-2 sm:w-4" style={{ background: index < step ? "#22c55e" : "rgba(255,255,255,0.1)" }} />}
          </li>
        ))}
      </ol>
    </nav>
  );
}
