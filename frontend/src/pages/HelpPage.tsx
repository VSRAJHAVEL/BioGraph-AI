import { useState } from 'react';
import {
  HelpCircle,
  BookOpen,
  Keyboard,
  Workflow,
  Search,
  ChevronDown,
} from 'lucide-react';
import { GLOSSARY, FAQS, SHORTCUTS, WORKFLOWS } from '@/guide/content';
import GuideCard from '@/components/GuideCard';

export default function HelpPage() {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const filteredGlossary = GLOSSARY.filter((item) => {
    const q = searchTerm.toLowerCase();
    return item.term.toLowerCase().includes(q) || item.definition.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* 1. Header Banner */}
      <div className="space-y-1">
        <span className="text-xs uppercase tracking-widest text-primary font-semibold font-mono">
          Knowledge Base &amp; Documentation
        </span>
        <h1 className="font-headline text-3xl md:text-4xl text-on-surface font-normal tracking-tight flex items-center gap-3">
          <HelpCircle className="w-8 h-8 text-primary" />
          Documentation, Scientific Glossary &amp; Shortcuts
        </h1>
        <p className="text-sm text-on-surface-variant">
          Comprehensive reference guide for Graph Neural Networks in drug discovery, cheminformatics terminology, and platform workflows.
        </p>
      </div>

      <GuideCard pageId="help" />

      {/* 2. Common Workflows Section */}
      <section className="space-y-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-primary font-semibold">
            Standard Operating Procedures
          </span>
          <h2 className="font-headline text-2xl text-on-surface font-normal flex items-center gap-2">
            <Workflow className="w-5 h-5 text-primary" />
            Recommended Discovery Workflows
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {WORKFLOWS.map((wf) => (
            <div
              key={wf.title}
              className="rounded-3xl bg-surface-container-low/80 backdrop-blur-2xl p-7 shadow-xl border border-white/[0.04] flex flex-col justify-between space-y-4"
            >
              <div>
                <h3 className="font-headline text-lg text-on-surface font-normal">{wf.title}</h3>
                <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{wf.description}</p>
                <div className="mt-4 space-y-2.5">
                  {wf.steps.map((st, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-on-surface">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 border border-primary/20">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{st}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Keyboard Shortcuts Section */}
      <section className="space-y-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-primary font-semibold">
            Productivity Cheatsheet
          </span>
          <h2 className="font-headline text-2xl text-on-surface font-normal flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-secondary" />
            Global Keyboard Shortcuts
          </h2>
        </div>

        <div className="rounded-3xl bg-surface-container-low/80 backdrop-blur-2xl p-7 shadow-xl border border-white/[0.04]">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {SHORTCUTS.map((sc: { key: string; description: string }) => (
              <div
                key={sc.key}
                className="p-3.5 bg-surface-container rounded-2xl border border-white/[0.02] flex items-center justify-between"
              >
                <span className="text-xs text-on-surface-variant font-medium">{sc.description}</span>
                <kbd className="px-2.5 py-1 bg-black/[0.04] dark:bg-[#08090b] border border-black/[0.08] dark:border-white/10 rounded-xl text-primary text-xs font-mono shadow-inner font-semibold">
                  {sc.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Glossary Section */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-widest text-primary font-semibold">
              Cheminformatics Lexicon
            </span>
            <h2 className="font-headline text-2xl text-on-surface font-normal flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Scientific Glossary &amp; Metrics
            </h2>
          </div>

          <div className="relative w-72">
            <Search className="w-3.5 h-3.5 text-outline absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search terms, metrics, assays..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-surface-container border border-white/[0.04] rounded-xl text-xs text-on-surface placeholder:text-outline focus:ring-1 focus:ring-primary outline-none font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredGlossary.map((item) => (
            <div
              key={item.term}
              className="rounded-3xl bg-surface-container-low/80 backdrop-blur-2xl p-6 shadow-xl border border-white/[0.04] space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-headline text-base text-primary font-medium">{item.term}</span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {item.definition}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. FAQs Accordion */}
      <section className="space-y-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-primary font-semibold">
            Common Inquiries
          </span>
          <h2 className="font-headline text-2xl text-on-surface font-normal">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="rounded-3xl bg-surface-container-low/80 backdrop-blur-2xl p-6 shadow-xl border border-white/[0.04] divide-y divide-surface-container-highest/40">
          {FAQS.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div key={index} className="py-4 first:pt-0 last:pb-0">
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full flex items-center justify-between text-left text-sm font-medium text-on-surface hover:text-primary transition group"
                >
                  <span className="font-headline text-base">{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-outline group-hover:text-primary transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <p className="text-xs text-on-surface-variant leading-relaxed mt-2.5 pt-1">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
