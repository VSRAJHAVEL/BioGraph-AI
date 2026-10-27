import { useState } from 'react';
import {
  HelpCircle,
  BookOpen,
  Keyboard,
  Workflow,
  Search,
  ChevronDown,
  Award,
  Globe,
  ExternalLink,
  Atom,
  Heart,
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

      {/* 6. Creator & Engineering Credits */}
      <section className="space-y-4 pt-6">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-primary font-semibold">
            Engineering &amp; Authorship
          </span>
          <h2 className="font-headline text-2xl text-on-surface font-normal flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            About the Creator &amp; Project Credits
          </h2>
        </div>

        <div className="rounded-3xl bg-surface-container-low/80 backdrop-blur-2xl p-8 shadow-2xl border border-white/[0.04] flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden">
          <div className="flex flex-col gap-3.5 max-w-2xl">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shadow-inner shrink-0">
                <Atom className="w-6 h-6 text-primary" />
              </div>
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-primary font-bold">
                  Lead Engineer &amp; Architect
                </span>
                <h3 className="font-headline text-2xl text-on-surface font-semibold flex items-center gap-2 flex-wrap">
                  <span>Handcrafted by RAJHAVEL V S</span>
                  <Heart className="w-4 h-4 text-rose-400 fill-rose-400 inline" />
                </h3>
              </div>
            </div>

            <p className="text-sm text-on-surface-variant leading-relaxed">
              BioGraph AI is an enterprise-grade Computer-Aided Drug Discovery (CADD) platform powered by Deep Graph Neural Networks (MPNN, GIN, GAT, GCN), RDKit cheminformatics, FastAPI, and reactive TypeScript UI. Architected with verified 0% scaffold leakage across MoleculeNet benchmarks (ESOL, BBBP, Tox21).
            </p>

            <div className="flex items-center gap-2 flex-wrap text-xs font-mono text-outline pt-1">
              <span className="px-3 py-1 rounded-full bg-surface-container border border-white/[0.04] text-on-surface-variant">
                Graph Neural Networks (PyG 2.8)
              </span>
              <span className="px-3 py-1 rounded-full bg-surface-container border border-white/[0.04] text-on-surface-variant">
                Cheminformatics &amp; 3D Force-Field (RDKit)
              </span>
              <span className="px-3 py-1 rounded-full bg-surface-container border border-white/[0.04] text-on-surface-variant">
                Full-Stack Discovery Studio
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full lg:w-72 shrink-0">
            {/* Portfolio Link */}
            <a
              href="https://vsrajhavel.github.io"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-4 px-5 py-3 rounded-2xl bg-surface-container hover:bg-surface-container-high text-on-surface hover:text-primary transition-all border border-white/[0.06] hover:border-primary/40 shadow-sm group active:scale-95"
            >
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-primary group-hover:rotate-12 transition-transform" />
                <span className="text-xs font-mono font-medium">Portfolio Website</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-outline group-hover:text-primary transition-colors" />
            </a>

            {/* LinkedIn Link */}
            <a
              href="https://in.linkedin.com/in/rajhavelvs"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-4 px-5 py-3 rounded-2xl bg-surface-container hover:bg-surface-container-high text-on-surface hover:text-[#0A66C2] transition-all border border-white/[0.06] hover:border-[#0A66C2]/40 shadow-sm group active:scale-95"
            >
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 fill-current text-[#0A66C2]" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                </svg>
                <span className="text-xs font-mono font-medium">LinkedIn Profile</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-outline group-hover:text-[#0A66C2] transition-colors" />
            </a>

            {/* GitHub Link */}
            <a
              href="https://github.com/VSRAJHAVEL"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-4 px-5 py-3 rounded-2xl bg-surface-container hover:bg-surface-container-high text-on-surface hover:text-primary transition-all border border-white/[0.06] hover:border-primary/40 shadow-sm group active:scale-95"
            >
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 fill-current text-on-surface group-hover:text-primary transition-colors" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                </svg>
                <span className="text-xs font-mono font-medium">GitHub Repository</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-outline group-hover:text-primary transition-colors" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
