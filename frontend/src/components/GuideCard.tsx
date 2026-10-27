import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { PAGE_GUIDANCE } from '../guide/content';
import { useAppStore } from '../store/useAppStore';

interface GuideCardProps {
  pageKey?: keyof typeof PAGE_GUIDANCE | string;
  pageId?: keyof typeof PAGE_GUIDANCE | string;
  onTryExample?: (smiles: string) => void;
}

export const GuideCard: React.FC<GuideCardProps> = ({ pageKey, pageId, onTryExample }) => {
  const key = (pageKey || pageId || 'predict') as keyof typeof PAGE_GUIDANCE;
  const guidance = PAGE_GUIDANCE[key] || PAGE_GUIDANCE.predict;
  const { dismissedGuides, toggleGuideDismissed } = useAppStore();
  const isDismissed = dismissedGuides.includes(guidance.id);
  const [isExpanded, setIsExpanded] = useState(!isDismissed);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    toggleGuideDismissed(guidance.id);
  };

  return (
    <div className="rounded-3xl bg-surface-container-low/75 backdrop-blur-2xl p-6 shadow-apple-md dark:shadow-xl border border-black/[0.06] dark:border-white/[0.04] mb-6 transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-2xl bg-surface-container-high/90 flex items-center justify-center text-primary border border-black/[0.05] dark:border-white/[0.08] shadow-apple-sm dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)]">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-headline text-base font-medium text-on-surface">{guidance.title}</h3>
            <p className="text-xs text-on-surface-variant">Step-by-step guidance & biophysical interpretation</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {guidance.exampleSmiles && onTryExample && (
            <button
              onClick={() => onTryExample(guidance.exampleSmiles)}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-2xl bg-surface-container-high hover:bg-surface-container-highest border border-primary/30 text-primary flex items-center gap-1.5 transition active:scale-95 shadow-apple-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Try Example ({guidance.exampleName})
            </button>
          )}

          <button
            onClick={handleToggle}
            aria-label="Toggle Guide Visibility"
            className="p-2 rounded-2xl text-outline hover:text-on-surface hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-4 mt-4 border-t border-black/[0.06] dark:border-white/[0.06] text-xs space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="font-mono font-semibold text-outline block mb-2 uppercase text-[10px] tracking-wider">
                    Step-by-Step Instructions:
                  </span>
                  <ol className="list-decimal list-inside space-y-1.5 text-on-surface-variant">
                    {guidance.steps.map((s, idx) => (
                      <li key={idx} className="leading-relaxed">
                        <span className="text-on-surface">{s}</span>
                      </li>
                    ))}
                  </ol>
                </div>
                <div>
                  <span className="font-mono font-semibold text-outline block mb-2 uppercase text-[10px] tracking-wider">
                    What am I looking at? (Biophysical Interpretation):
                  </span>
                  <p className="text-on-surface-variant leading-relaxed">{guidance.whatAmILookingAt}</p>
                </div>
              </div>

              <div className="pt-2 text-[11px] text-outline font-mono flex items-center justify-between border-t border-black/[0.04] dark:border-white/[0.04]">
                <span>Shortcut hint: Press <strong>?</strong> anywhere to open Docs & Glossary</span>
                <button
                  onClick={handleToggle}
                  className="text-primary hover:underline font-sans font-medium"
                >
                  Collapse Guide
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GuideCard;
