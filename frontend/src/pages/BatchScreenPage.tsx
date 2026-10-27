import { useState, useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Layers,
  UploadCloud,
  Download,
  Search,
  CheckCircle2,
  XCircle,
  ArrowUpDown,
  RefreshCw,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { api } from '@/lib/api/client';
import { useAppStore } from '@/store/useAppStore';
import GuideCard from '@/components/GuideCard';
import MetricInfoPopover from '@/components/MetricInfoPopover';
import { toast } from 'sonner';

const SAMPLE_BATCH_10 = `CC(=O)Oc1ccccc1C(=O)O,Aspirin
CC(=O)Nc1ccc(O)cc1,Paracetamol
CC(C)Cc1ccc(C(C)C(=O)O)cc1,Ibuprofen
CN1C=NC2=C1C(=O)N(C(=O)N2C)C,Caffeine
CN(C)CCCN1c2ccccc2Sc3ccccc13,Promethazine
Clc1ccc(cc1)C(c2ccccn2)CCN(C)C,Chlorpheniramine
COc1ccc2[nH]c3c(c2c1)C(=O)c4ccccc4C3,Ellipticine
CN1CCC[C@H]1c2cccnc2,Nicotine
COc1ccc(CC(=O)O)cc1,4-Methoxyphenylacetic acid
c1ccccc1,Benzene`;

const SAMPLE_BATCH_20 = `${SAMPLE_BATCH_10}
CC12CCC3C(C1CCC2O)CCC4=CC(=O)CCC34C,Testosterone
Cc1ncc(CCO)s1,4-Methyl-5-thiazoleethanol
c1c[nH]cn1,Imidazole
c1ccc(cc1)O,Phenol
CCOC(=O)c1ccccc1O,Ethyl salicylate
CC(C)CC(=O)O,Isovaleric acid
c1ccncc1,Pyridine
CC(=O)c1ccccc1,Acetophenone
CS(=O)C,DMSO
c1ccc2[nH]ccc2c1,Indole`;

type SortField = 'Compound ID' | 'Desirability Score' | 'QED' | 'Solubility logS' | 'MW (Da)' | 'LogP';

export default function BatchScreenPage() {
  const { setCurrentSmiles } = useAppStore();
  const [inputText, setInputText] = useState<string>(SAMPLE_BATCH_10);
  const [preferCns, setPreferCns] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('Desirability Score');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  const screenMutation = useMutation({
    mutationFn: async () => {
      const lines = inputText
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0 && !l.startsWith('#'));

      if (lines.length === 0) {
        throw new Error('Please input at least one SMILES line');
      }

      const smilesList: string[] = [];
      const compoundNames: string[] = [];

      for (let i = 0; i < lines.length; i++) {
        const parts = lines[i].split(',');
        if (parts.length >= 2) {
          smilesList.push(parts[0].trim());
          compoundNames.push(parts[1].trim());
        } else {
          smilesList.push(parts[0].trim());
          compoundNames.push(`Molecule_${i + 1}`);
        }
      }

      return api.screenBatch(smilesList, compoundNames, preferCns);
    },
    onSuccess: (data) => {
      toast.success(`Screened ${data.length} molecules across 5 GNN models & ADMET filters`);
    },
    onError: (err: any) => {
      toast.error('Batch screening failed: ' + err.message);
    },
  });

  const rawRecords = useMemo(() => screenMutation.data || [], [screenMutation.data]);

  const filteredAndSorted = useMemo(() => {
    let result = [...rawRecords];
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(
        (r) =>
          r['Compound ID'].toLowerCase().includes(lower) ||
          r.SMILES.toLowerCase().includes(lower)
      );
    }

    result.sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

    return result;
  }, [rawRecords, searchTerm, sortField, sortAsc]);

  const handleExportCsv = () => {
    if (rawRecords.length === 0) return;
    const headers = Object.keys(rawRecords[0]);
    const csvRows = [
      headers.join(','),
      ...rawRecords.map((r) =>
        headers
          .map((h) => {
            const val = (r as any)[h];
            return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
          })
          .join(',')
      ),
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `biograph_batch_screen_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Batch screening results exported to CSV');
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* 1. Header Banner */}
      <div className="space-y-1">
        <span className="text-xs uppercase tracking-widest text-primary font-semibold font-mono">
          Virtual Combinatorial Screening Engine
        </span>
        <h1 className="font-headline text-3xl md:text-4xl text-on-surface font-normal tracking-tight flex items-center gap-3">
          <Layers className="w-8 h-8 text-primary" />
          High-Throughput Batch Screening
        </h1>
        <p className="text-sm text-on-surface-variant">
          Screen multi-compound libraries against full 5-architecture GNN ensembles, toxicity alerts, and multi-parameter optimization (MPO) desirability score.
        </p>
      </div>

      <GuideCard
        pageId="batch"
        onTryExample={() => {
          setInputText(SAMPLE_BATCH_20);
          toast.success('Loaded 20-compound diverse library sample');
        }}
      />

      {/* 2. Ingestion Panel */}
      <section className="animate-stagger rounded-3xl bg-surface-container-low/80 backdrop-blur-2xl p-7 shadow-2xl border border-white/[0.04] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="text-xs font-mono font-semibold uppercase tracking-wider text-outline flex items-center gap-2">
            <UploadCloud className="w-4 h-4 text-primary" />
            Input SMILES Library (one per line, format: SMILES,Name or SMILES)
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setInputText(SAMPLE_BATCH_10)}
              className="text-xs px-3 py-1 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface border border-white/[0.04] font-mono transition"
            >
              10 Sample Drugs
            </button>
            <button
              type="button"
              onClick={() => setInputText(SAMPLE_BATCH_20)}
              className="text-xs px-3 py-1 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface border border-white/[0.04] font-mono transition"
            >
              20 Diverse Compounds
            </button>
            <button
              type="button"
              onClick={() => setInputText('')}
              className="text-xs px-3 py-1 rounded-xl bg-surface-container hover:bg-surface-container-high text-outline border border-white/[0.04] font-mono transition"
            >
              Clear
            </button>
          </div>
        </div>

        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          rows={5}
          placeholder="CC(=O)Oc1ccccc1C(=O)O,Aspirin&#10;CN1C=NC2=C1C(=O)N(C(=O)N2C)C,Caffeine"
          className="w-full bg-black/[0.03] dark:bg-[#08090b] border border-black/[0.08] dark:border-white/[0.04] rounded-2xl p-4 text-xs font-mono text-on-surface focus:ring-2 focus:ring-primary/40 outline-none leading-relaxed shadow-inner transition"
        />

        <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={preferCns}
              onChange={(e) => setPreferCns(e.target.checked)}
              className="rounded bg-surface-container border-white/10 text-primary focus:ring-primary"
            />
            <span className="text-xs text-on-surface-variant font-medium">
              Weight Central Nervous System (CNS) permeation heavily in MPO Desirability score
            </span>
          </label>

          <button
            type="button"
            onClick={() => screenMutation.mutate()}
            disabled={screenMutation.isPending || !inputText.trim()}
            className="px-6 py-2.5 rounded-2xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary-fixed shadow-[0_8px_20px_rgba(241,207,156,0.25)] flex items-center gap-2 transition active:scale-95 disabled:opacity-50"
          >
            {screenMutation.isPending ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Screening Library...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Run Batch Screen</span>
              </>
            )}
          </button>
        </div>
      </section>

      {/* 3. Results View */}
      {rawRecords.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          {/* Controls Bar: Search, Filters, CSV Export */}
          <div className="rounded-3xl bg-surface-container-low/80 backdrop-blur-2xl p-5 shadow-xl border border-white/[0.04] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 max-w-sm">
              <div className="relative w-full">
                <Search className="w-3.5 h-3.5 text-outline absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Filter by name or SMILES..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-surface-container border border-white/[0.04] rounded-xl text-xs text-on-surface placeholder:text-outline focus:ring-1 focus:ring-primary outline-none font-mono"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-xs text-outline font-mono">
                Showing {filteredAndSorted.length} of {rawRecords.length} compounds
              </span>

              <button
                type="button"
                onClick={handleExportCsv}
                className="px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high border border-white/[0.04] text-xs font-semibold text-primary flex items-center gap-2 transition active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="rounded-3xl bg-surface-container-low/80 backdrop-blur-2xl border border-white/[0.04] shadow-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-surface-container-highest/60 bg-surface-container/50 text-outline uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-3">#</th>
                    <th
                      onClick={() => handleSort('Compound ID')}
                      className="py-3 px-3 cursor-pointer hover:text-on-surface"
                    >
                      <div className="flex items-center gap-1 font-sans">
                        Compound Name <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('Desirability Score')}
                      className="py-3 px-3 cursor-pointer hover:text-primary"
                    >
                      <div className="flex items-center gap-1 text-primary font-bold">
                        Desirability <ArrowUpDown className="w-3 h-3" />
                        <MetricInfoPopover metricKey="desirability" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('QED')}
                      className="py-3 px-3 cursor-pointer hover:text-on-surface"
                    >
                      <div className="flex items-center gap-1">
                        QED <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('Solubility logS')}
                      className="py-3 px-3 cursor-pointer hover:text-on-surface"
                    >
                      <div className="flex items-center gap-1">
                        Solubility <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="py-3 px-3">BBB Status</th>
                    <th className="py-3 px-3">Max Tox Risk</th>
                    <th
                      onClick={() => handleSort('MW (Da)')}
                      className="py-3 px-3 cursor-pointer hover:text-on-surface"
                    >
                      <div className="flex items-center gap-1">
                        MW (Da) <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('LogP')}
                      className="py-3 px-3 cursor-pointer hover:text-on-surface"
                    >
                      <div className="flex items-center gap-1">
                        LogP <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="py-3 px-3">Lipinski</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-highest/30">
                  {filteredAndSorted.map((mol, idx) => {
                    const isDesirable = mol['Desirability Score'] >= 0.65;
                    return (
                      <tr key={idx} className="hover:bg-surface-container/40 transition-colors">
                        <td className="py-3 px-3 text-outline">{idx + 1}</td>
                        <td className="py-3 px-3 font-semibold text-on-surface font-sans">
                          {mol['Compound ID']}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold tabular-nums ${
                              isDesirable
                                ? 'bg-secondary/15 text-secondary border border-secondary/30'
                                : 'bg-surface-container text-on-surface border border-white/[0.04]'
                            }`}
                          >
                            {mol['Desirability Score'].toFixed(3)}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-secondary font-bold tabular-nums">{mol.QED.toFixed(3)}</td>
                        <td className="py-3 px-3 text-on-surface tabular-nums">{mol['Solubility logS'].toFixed(2)}</td>
                        <td className="py-3 px-3">
                          <span className="text-[11px] font-sans text-on-surface-variant">
                            {mol['BBB Probability']}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`text-[11px] font-sans font-semibold ${
                              mol['Max Tox Risk'].includes('HIGH')
                                ? 'text-rose-400'
                                : mol['Max Tox Risk'].includes('Moderate')
                                ? 'text-primary'
                                : 'text-secondary'
                            }`}
                          >
                            {mol['Max Tox Risk']}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-outline tabular-nums">{mol['MW (Da)'].toFixed(1)}</td>
                        <td className="py-3 px-3 text-outline tabular-nums">{mol.LogP.toFixed(2)}</td>
                        <td className="py-3 px-3">
                          {mol.Lipinski === 'Pass' ? (
                            <span className="text-secondary flex items-center text-[11px] font-sans font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Pass
                            </span>
                          ) : (
                            <span className="text-rose-400 flex items-center text-[11px] font-sans font-semibold">
                              <XCircle className="w-3.5 h-3.5 mr-1" /> Fail
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-sans">
                          <button
                            type="button"
                            onClick={() => {
                              setCurrentSmiles(mol.SMILES);
                              toast.success(`Selected ${mol['Compound ID']} for property prediction`);
                            }}
                            className="text-primary hover:text-[#ffdeac] font-semibold text-xs inline-flex items-center gap-1 active:scale-95 transition"
                          >
                            <span>Analyze</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
