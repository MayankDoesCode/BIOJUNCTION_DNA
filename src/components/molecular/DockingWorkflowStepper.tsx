import React from 'react';
import { Check, Dna, Pill, Crosshair, FileCheck2, Play } from 'lucide-react';

export interface StepItem {
  id: number;
  title: string;
  shortDesc: string;
  icon: React.ElementType;
}

export const DOCKING_STEPS: StepItem[] = [
  { id: 1, title: 'Target Protein', shortDesc: 'Select receptor structure', icon: Dna },
  { id: 2, title: 'Candidate Molecule', shortDesc: 'Choose drug ligand', icon: Pill },
  { id: 3, title: 'Binding / Search Region', shortDesc: 'Set grid box coordinates', icon: Crosshair },
  { id: 4, title: 'Review Configuration', shortDesc: 'Verify docking parameters', icon: FileCheck2 },
  { id: 5, title: 'Start Docking', shortDesc: 'Execute simulation job', icon: Play },
];

interface DockingWorkflowStepperProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
  completedSteps?: number[];
}

export const DockingWorkflowStepper: React.FC<DockingWorkflowStepperProps> = ({
  currentStep,
  onStepClick,
  completedSteps = [],
}) => {
  return (
    <div className="w-full bg-navy-900/40 backdrop-blur-md rounded-xl p-4 sm:p-5 border border-cyan-500/30 shadow-subtle">
      <div className="flex items-center justify-between overflow-x-auto pb-2 sm:pb-0 gap-2">
        {DOCKING_STEPS.map((step, idx) => {
          const isCompleted = completedSteps.includes(step.id) || step.id < currentStep;
          const isActive = step.id === currentStep;
          const isClickable = onStepClick && (isCompleted || step.id <= currentStep);
          const Icon = step.icon;

          return (
            <React.Fragment key={step.id}>
              {/* Step Item */}
              <div
                onClick={() => isClickable && onStepClick(step.id)}
                className={`flex items-center gap-3 shrink-0 ${
                  isClickable ? 'cursor-pointer' : 'cursor-default opacity-60'
                } group transition-all`}
              >
                {/* Step Circle Indicator */}
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all shadow-xs ${
                    isCompleted
                      ? 'bg-emerald-600 text-white'
                      : isActive
                      ? 'bg-brand-600 text-white ring-4 ring-brand-100'
                      : 'bg-navy-800/60 text-cyan-400/80 border border-cyan-500/30'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4 stroke-[2.5]" /> : <Icon className="w-4 h-4" />}
                </div>

                {/* Step Text Labels */}
                <div className="hidden md:block text-left">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        isActive ? 'text-brand-600' : 'text-slate-400'
                      }`}
                    >
                      Step {step.id}
                    </span>
                  </div>
                  <div
                    className={`text-xs font-bold leading-tight ${
                      isActive ? 'text-cyan-50' : 'text-cyan-300'
                    }`}
                  >
                    {step.title}
                  </div>
                </div>
              </div>

              {/* Connecting Line */}
              {idx < DOCKING_STEPS.length - 1 && (
                <div
                  className={`hidden sm:block flex-1 h-0.5 mx-2 rounded-full transition-colors ${
                    step.id < currentStep ? 'bg-emerald-500' : 'bg-slate-200'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
