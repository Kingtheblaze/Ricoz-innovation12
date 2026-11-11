'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { 
  ShieldAlert, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  ArrowRight,
  Sparkles,
  Info
} from 'lucide-react';

interface ScanIssue {
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  ruleKey: string;
  title: string;
  statute: string;
  foundTextSample: string;
  explanation: string;
  recommendation: string;
}

export default function RiskScannerPage() {
  const [clauseText, setClauseText] = useState('');
  const [jurisdictionCode, setJurisdictionCode] = useState('US-CA');
  const [scanning, setScanning] = useState(false);
  const [scanResults, setScanResults] = useState<{
    score: number;
    issues: ScanIssue[];
    summary: string;
  } | null>(null);

  const sampleClauses: Record<string, string> = {
    'California Non-Compete (High Risk)': 
      'Employee agrees that for a period of twelve (12) months following termination of employment for any reason, Employee shall not directly or indirectly engage in, perform services for, or own any interest in any business competing with the Company within the State of California.',
    'UK Notice Period (Medium Risk)': 
      'Either party may terminate this agreement at any time by giving two (2) days written notice to the other party, irrespective of the employee length of service.',
    'Compliant IP Assignment (Low Risk)': 
      'Employee assigns to Company all right, title, and interest in Inventions created during employment, except as provided by California Labor Code Section 2870 for works developed entirely on employee own time without company equipment.',
  };

  const handleScan = async () => {
    if (!clauseText.trim()) {
      toast.error('Please enter clause text to analyze');
      return;
    }

    setScanning(true);
    try {
      const res = await api.post('/documents/scan-risk', {
        text: clauseText,
        jurisdictionCode,
      });

      if (res.data?.success) {
        setScanResults(res.data.data);
        toast.success('Compliance scan completed');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to analyze text');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Banner */}
        <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-indigo-950 rounded-3xl p-8 text-white shadow-xl mb-8 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs tracking-wider uppercase mb-2">
            <Sparkles className="w-4 h-4" /> AI & Heuristic Compliance Scanner
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Statutory Clause Risk Analyzer
          </h1>
          <p className="mt-2 text-slate-300 max-w-2xl text-sm leading-relaxed">
            Paste an existing offer letter clause, restrictive covenant, or handbook provision. The engine scans against local statutes (e.g. SB 699, ERA 1996, NachwG) and flags compliance liabilities.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Input Form Column (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Target Jurisdiction
                </label>
                <select
                  value={jurisdictionCode}
                  onChange={(e) => setJurisdictionCode(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold bg-slate-50 focus:ring-2 focus:ring-sky-500"
                >
                  <option value="US-CA">California, USA (US-CA)</option>
                  <option value="GB-UK">United Kingdom (GB-UK)</option>
                  <option value="US-NY">New York, USA (US-NY)</option>
                  <option value="US-TX">Texas, USA (US-TX)</option>
                  <option value="DE-DE">Germany (DE-DE)</option>
                  <option value="IN-IN">India (IN-IN)</option>
                </select>
              </div>

              {/* Sample Quick-fill buttons */}
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block mb-2">
                  Test with pre-configured contract clauses:
                </span>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(sampleClauses).map(([label, text]) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setClauseText(text)}
                      className="px-3 py-1 text-[11px] rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors font-medium"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Clause Content to Scan
                </label>
                <textarea
                  rows={8}
                  value={clauseText}
                  onChange={(e) => setClauseText(e.target.value)}
                  placeholder="Paste clause or paragraph text here..."
                  className="w-full text-xs text-slate-800 p-4 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-sky-500 leading-relaxed"
                />
              </div>

              <button
                type="button"
                disabled={scanning}
                onClick={handleScan}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-sky-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {scanning ? 'Running Statutory Analysis...' : 'Run Compliance Scan'}
                {!scanning && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Results Column (5 Cols) */}
          <div className="lg:col-span-5">
            {scanResults ? (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">Risk Assessment</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{scanResults.summary}</p>
                  </div>
                  <div className={`px-4 py-2 rounded-2xl font-black text-lg border ${
                    scanResults.score >= 80 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : scanResults.score >= 50 
                      ? 'bg-amber-50 text-amber-700 border-amber-200' 
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    {scanResults.score}/100
                  </div>
                </div>

                <div className="space-y-4">
                  {scanResults.issues.length === 0 ? (
                    <div className="p-6 text-center rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                      <h4 className="font-bold text-sm">No Statutory Violations Detected</h4>
                      <p className="text-xs text-emerald-700 mt-1">
                        The analyzed text aligns with mandatory standards in {jurisdictionCode}.
                      </p>
                    </div>
                  ) : (
                    scanResults.issues.map((issue, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-2xl border ${
                          issue.severity === 'HIGH'
                            ? 'bg-rose-50/60 border-rose-200'
                            : issue.severity === 'MEDIUM'
                            ? 'bg-amber-50/60 border-amber-200'
                            : 'bg-blue-50/60 border-blue-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs text-slate-900">{issue.title}</span>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            issue.severity === 'HIGH'
                              ? 'bg-rose-600 text-white'
                              : issue.severity === 'MEDIUM'
                              ? 'bg-amber-600 text-white'
                              : 'bg-blue-600 text-white'
                          }`}>
                            {issue.severity} RISK
                          </span>
                        </div>
                        <p className="text-[11px] font-mono text-slate-500 mb-2">Statute: {issue.statute}</p>
                        <p className="text-xs text-slate-700 leading-relaxed mb-2">{issue.explanation}</p>
                        <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-[11px] text-slate-600">
                          <span className="font-bold text-slate-800">Recommendation:</span> {issue.recommendation}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center text-slate-400">
                <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="font-bold text-slate-700 text-sm">Awaiting Clause Input</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Paste any contractual clause on the left and run the scan to evaluate statutory enforceability.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

