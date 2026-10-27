import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Atom,
  Box,
  Shield,
  Sparkles,
  Orbit,
  Zap,
  Table2,
  Award,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

const NAV_ITEMS = [
  { name: 'Consensus Predict', path: '/predict', icon: Atom, badge: 'Ensemble' },
  { name: '3D Conformation', path: '/viewer', icon: Box },
  { name: 'ADMET Radar', path: '/admet', icon: Shield },
  { name: 'Pharmacophore Saliency', path: '/explain', icon: Sparkles },
  { name: 'Chemical Space', path: '/space', icon: Orbit },
  { name: 'Lead Optimization', path: '/analogs', icon: Zap },
  { name: 'Batch Screening', path: '/batch', icon: Table2 },
  { name: 'Verified Benchmarks', path: '/benchmarks', icon: Award },
  { name: 'Help & Glossary', path: '/help', icon: HelpCircle },
];

export const Sidebar: React.FC = () => {
  const { sidebarCollapsed, setSidebarCollapsed } = useAppStore();

  return (
    <aside
      id="sidebar-nav"
      className={`${
        sidebarCollapsed ? 'w-20' : 'w-64'
      } border-r border-black/[0.06] dark:border-white/[0.04] bg-surface-container-low/70 backdrop-blur-2xl p-3.5 flex flex-col justify-between transition-all duration-300 select-none z-30 shrink-0 shadow-apple-sm dark:shadow-2xl`}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between px-2 mb-2">
          {!sidebarCollapsed && (
            <span className="text-[10px] font-mono uppercase tracking-widest text-outline font-semibold">
              Discovery Engine
            </span>
          )}
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 rounded-xl text-outline hover:text-on-surface hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition ml-auto"
            title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-primary/15 text-primary border border-primary/30 shadow-apple-sm dark:shadow-[0_0_15px_rgba(241,207,156,0.12)] font-semibold'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-black/[0.04] dark:hover:bg-white/[0.05] border border-transparent'
                  } ${sidebarCollapsed ? 'justify-center px-0' : ''}`
                }
                title={sidebarCollapsed ? item.name : undefined}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && (
                  <div className="flex items-center justify-between flex-1">
                    <span>{item.name}</span>
                    {item.badge && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/25 font-semibold">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-black/[0.06] dark:border-white/[0.06] pt-3 px-2">
        {!sidebarCollapsed ? (
          <div className="text-[11px] font-mono text-outline space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              <span className="font-semibold text-on-surface">BioGraph AI v2.0</span>
            </div>
            <div className="text-[10px]">PyG 2.8 · RDKit · Strict Scaffolds</div>
            <div className="text-[10px] pt-1 text-on-surface-variant">
              Handcrafted by{' '}
              <a
                href="https://vsrajhavel.github.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-semibold"
              >
                RAJHAVEL V S
              </a>
            </div>
          </div>
        ) : (
          <div className="text-center text-[10px] text-outline font-mono">v2.0</div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
