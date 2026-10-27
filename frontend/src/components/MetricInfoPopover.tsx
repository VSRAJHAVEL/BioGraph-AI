import { useState } from 'react';
import { Info, X } from 'lucide-react';
import { METRIC_EXPLAINERS } from '../guide/content';

interface MetricInfoPopoverProps {
  metricKey: keyof typeof METRIC_EXPLAINERS | string;
  className?: string;
}

export const MetricInfoPopover: React.FC<MetricInfoPopoverProps> = ({ metricKey, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const info = (METRIC_EXPLAINERS as Record<string, any>)[metricKey];

  if (!info) return null;

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Information about ${info.title}`}
        className="text-outline hover:text-primary transition p-0.5 rounded focus:outline-none"
      >
        <Info className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute left-0 bottom-full mb-2 z-50 w-72 p-4 bg-white/95 dark:bg-surface-container-high/95 backdrop-blur-2xl border border-black/[0.08] dark:border-white/[0.08] rounded-2xl shadow-apple-md dark:shadow-2xl text-xs space-y-2 text-on-surface animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-black/[0.06] dark:border-white/[0.06] pb-2">
              <span className="font-semibold text-primary">{info.title}</span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-outline hover:text-on-surface"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-on-surface-variant leading-relaxed">{info.description}</p>
            <div className="pt-1.5 border-t border-black/[0.06] dark:border-white/[0.06] text-[11px] space-y-1">
              <div>
                <span className="text-outline font-semibold">Interpretation: </span>
                <span className="text-on-surface">{info.interpretation}</span>
              </div>
              <div>
                <span className="text-outline font-semibold">Optimal Range: </span>
                <span className="text-secondary font-mono font-semibold">{info.optimalRange}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MetricInfoPopover;
