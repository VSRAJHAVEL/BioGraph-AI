import React from 'react';
import { Heart, Globe, ExternalLink, Atom } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-16 pt-8 pb-10 border-t border-black/[0.06] dark:border-white/[0.06] text-on-surface-variant text-xs select-none">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Brand & Creator Credit */}
        <div className="flex flex-col items-center md:items-start gap-1.5 text-center md:text-left">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
              <Atom className="w-3.5 h-3.5" />
            </div>
            <span className="font-headline font-semibold text-sm text-on-surface tracking-tight">
              BioGraph AI
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              v2.0
            </span>
          </div>
          <p className="text-xs text-on-surface-variant flex items-center gap-1.5 flex-wrap justify-center md:justify-start">
            <span>Handcrafted by</span>
            <a
              href="https://vsrajhavel.github.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-semibold tracking-wide hover:underline inline-flex items-center gap-1"
            >
              <span>RAJHAVEL V S</span>
              <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400 inline" />
            </a>
          </p>
        </div>

        {/* Social / Profile Links */}
        <div className="flex items-center gap-2.5 flex-wrap justify-center">
          {/* Portfolio */}
          <a
            href="https://vsrajhavel.github.io"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface hover:text-primary transition-all border border-black/[0.04] dark:border-white/[0.06] hover:border-primary/30 group active:scale-95"
            title="Portfolio · vsrajhavel.github.io"
          >
            <Globe className="w-3.5 h-3.5 text-primary group-hover:rotate-12 transition-transform" />
            <span className="font-mono text-xs font-medium">Portfolio</span>
            <ExternalLink className="w-3 h-3 text-outline group-hover:text-primary transition-colors" />
          </a>

          {/* LinkedIn */}
          <a
            href="https://in.linkedin.com/in/rajhavelvs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface hover:text-[#0A66C2] transition-all border border-black/[0.04] dark:border-white/[0.06] hover:border-[#0A66C2]/40 group active:scale-95"
            title="LinkedIn · in/rajhavelvs"
          >
            <svg className="w-3.5 h-3.5 fill-current text-[#0A66C2]" viewBox="0 0 24 24">
              <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
            </svg>
            <span className="font-mono text-xs font-medium">LinkedIn</span>
            <ExternalLink className="w-3 h-3 text-outline group-hover:text-[#0A66C2] transition-colors" />
          </a>

          {/* GitHub */}
          <a
            href="https://github.com/VSRAJHAVEL"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface hover:text-primary transition-all border border-black/[0.04] dark:border-white/[0.06] hover:border-primary/30 group active:scale-95"
            title="GitHub · VSRAJHAVEL"
          >
            <svg className="w-3.5 h-3.5 fill-current text-on-surface group-hover:text-primary transition-colors" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
            </svg>
            <span className="font-mono text-xs font-medium">GitHub</span>
            <ExternalLink className="w-3 h-3 text-outline group-hover:text-primary transition-colors" />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
