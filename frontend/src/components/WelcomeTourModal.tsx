import { motion, AnimatePresence } from 'framer-motion';
import { driver } from 'driver.js';
import { Sparkles, ArrowRight, X } from 'lucide-react';
import { TOUR_STEPS } from '../guide/content';
import { useAppStore } from '../store/useAppStore';

export const WelcomeTourModal: React.FC = () => {
  const { welcomeModalOpen, setWelcomeModalOpen, tourCompleted, setTourCompleted } = useAppStore();

  const isOpen = welcomeModalOpen || !tourCompleted;
  if (!isOpen) return null;

  const startTour = () => {
    setWelcomeModalOpen(false);
    setTourCompleted(true);
    const driverObj = driver({
      showProgress: true,
      animate: true,
      steps: TOUR_STEPS,
      onDestroyStarted: () => {
        setTourCompleted(true);
        driverObj.destroy();
      },
    });
    driverObj.drive();
  };

  const handleSkip = () => {
    setWelcomeModalOpen(false);
    setTourCompleted(true);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="bg-white/90 dark:bg-surface-container-low/95 backdrop-blur-3xl max-w-lg w-full rounded-3xl p-6 shadow-apple-lg dark:shadow-2xl border border-black/[0.08] dark:border-white/[0.08] space-y-4"
        >
          <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.06] pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-2xl bg-primary/10 text-primary border border-primary/20">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-on-surface">Welcome to BioGraph AI</h3>
                <p className="text-xs text-on-surface-variant">Deep Graph Neural Network Molecular Property Prediction</p>
              </div>
            </div>
            <button
              onClick={handleSkip}
              className="p-1.5 rounded-xl text-outline hover:text-on-surface hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition"
              aria-label="Close welcome modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="text-xs text-on-surface-variant space-y-3 leading-relaxed">
            <p>
              BioGraph AI utilizes state-of-the-art <b>Graph Neural Networks (MPNN, GIN, GAT, GCN)</b> to predict chemical properties, oral bioavailability, and toxicity directly from molecular graph topology with zero scaffold leakage.
            </p>

            <div className="bg-black/[0.03] dark:bg-black/30 p-3.5 rounded-2xl border border-black/[0.06] dark:border-white/[0.06] space-y-1">
              <span className="font-bold text-primary uppercase text-[10px] tracking-wider block font-mono">
                What is a SMILES string?
              </span>
              <p className="text-outline">
                SMILES is a standard text notation describing chemical structures (e.g. <code className="text-primary font-mono font-semibold">CC(=O)Oc1ccccc1C(=O)O</code> for Aspirin). You can type a SMILES, select from presets, or draw with the vector sketcher.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-black/[0.06] dark:border-white/[0.06]">
            <button
              onClick={handleSkip}
              className="px-4 py-2 rounded-xl text-outline hover:text-on-surface text-xs font-semibold transition hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
            >
              Skip Introduction
            </button>
            <button
              onClick={startTour}
              className="px-5 py-2.5 rounded-2xl bg-primary text-on-primary font-semibold text-xs flex items-center gap-2 shadow-apple-sm dark:shadow-glow hover:opacity-95 transition active:scale-95"
            >
              <span>Start Guided Tour</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default WelcomeTourModal;
