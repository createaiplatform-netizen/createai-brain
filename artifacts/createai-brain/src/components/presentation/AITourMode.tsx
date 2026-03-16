// ─── AI Tour Mode — Floating Guided Assistant ─────────────────────────────────
// An optional floating panel that provides step-by-step guided highlights.
// Triggered by a button, dismissible, minimal UI.

import React, { useState } from "react";

export interface TourStep {
  title: string;
  body: string;
  highlight?: string; // section id to point to
}

interface AITourModeProps {
  steps: TourStep[];
  productName?: string;
  accentColor?: string;
}

export function AITourMode({ steps, productName = "AI Guide", accentColor = "#007AFF" }: AITourModeProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [completed, setCompleted] = useState(false);

  const current = steps[step];
  const progress = ((step + 1) / steps.length) * 100;

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(s => s + 1);
    } else {
      setCompleted(true);
      setTimeout(() => { setOpen(false); setCompleted(false); setStep(0); }, 1500);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setStep(0);
    setCompleted(false);
  };

  return (
    <>
      {/* Floating trigger button */}
      {!open && (
        <button
          onClick={() => { setOpen(true); setStep(0); setCompleted(false); }}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl text-white shadow-xl hover:opacity-90 active:scale-95 transition-all text-[13px] font-bold"
          style={{ backgroundColor: accentColor, boxShadow: `0 8px 32px ${accentColor}50` }}
          title="Start guided tour"
        >
          <span className="text-base">🧭</span>
          <span>Guided Tour</span>
        </button>
      )}

      {/* Tour panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-80 bg-background rounded-2xl shadow-2xl border border-border/50 overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="h-12 flex items-center justify-between px-4 border-b border-border/30" style={{ backgroundColor: accentColor + "15" }}>
            <div className="flex items-center gap-2">
              <span className="text-base">🧭</span>
              <span className="font-bold text-[13px] text-foreground">{productName}</span>
            </div>
            <button onClick={handleClose} className="w-6 h-6 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors text-[11px]">
              ✕
            </button>
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-muted/50">
            <div
              className="h-full transition-all duration-500 rounded-full"
              style={{ width: `${progress}%`, backgroundColor: accentColor }}
            />
          </div>

          {/* Content */}
          <div className="p-5 space-y-4">
            {completed ? (
              <div className="text-center py-4 space-y-3">
                <p className="text-3xl">✅</p>
                <p className="font-bold text-foreground">Tour Complete!</p>
                <p className="text-[12px] text-muted-foreground">You've seen all the highlights. Explore freely now.</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: accentColor }}>
                      Step {step + 1} of {steps.length}
                    </span>
                  </div>
                  <h3 className="font-bold text-[15px] text-foreground">{current.title}</h3>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">{current.body}</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setStep(s => Math.max(0, s - 1))}
                    disabled={step === 0}
                    className="px-3 py-2 text-[12px] font-semibold border border-border/50 text-muted-foreground rounded-xl disabled:opacity-30 hover:bg-muted transition-colors"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleNext}
                    className="flex-1 py-2 text-[13px] font-bold text-white rounded-xl hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: accentColor }}
                  >
                    {step === steps.length - 1 ? "Finish ✓" : "Next →"}
                  </button>
                </div>

                {/* Step dots */}
                <div className="flex justify-center gap-1.5 pt-1">
                  {steps.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setStep(i)}
                      className="w-2 h-2 rounded-full transition-colors"
                      style={{ backgroundColor: i === step ? accentColor : "#e5e7eb" }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
