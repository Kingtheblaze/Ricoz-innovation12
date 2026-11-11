'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { 
  ShieldCheck, 
  Settings, 
  Scale, 
  FileCheck, 
  History, 
  Plus, 
  Edit3, 
  Save, 
  Lock, 
  Unlock,
  AlertCircle,
  Building,
  CheckCircle2,
  Download,
  Users
} from 'lucide-react';
import { Jurisdiction, ClauseRule } from '@/types';

interface AuditLedgerEntry {
  documentId: string;
  documentTitle: string;
  candidateName: string;
  jurisdiction: string;
  status: string;
  action: string;
  performedByName: string;
  timestamp: string;
  details?: Record<string, any>;
}

export default function AdminConsolePage() {
  const [activeTab, setActiveTab] = useState<'matrix' | 'org' | 'ledger'>('matrix');
  const [jurisdictions, setJurisdictions] = useState<Jurisdiction[]>([]);
  const [selectedJurCode, setSelectedJurCode] = useState<string>('US-CA');
  const [activeJurisdiction, setActiveJurisdiction] = useState<Jurisdiction | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<AuditLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Editing Rule State
  const [editingRuleIndex, setEditingRuleIndex] = useState<number | null>(null);
  const [ruleForm, setRuleForm] = useState<ClauseRule | null>(null);
  const [versionBumpNotes, setVersionBumpNotes] = useState<string>('Regular statutory compliance review');
  const [isSavingMatrix, setIsSavingMatrix] = useState(false);

  // Organization Settings State
  const [orgData, setOrgData] = useState({
    name: 'Acme Corporation Inc.',
    defaultJurisdiction: 'US-CA',
    settings: {
      standardNoticeDays: 30,
      allowCustomClauses: true,
      primarySignatoryName: 'Jane Doe',
      primarySignatoryTitle: 'Chief Legal Officer',
    },
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [jurRes, orgRes, ledgerRes] = await Promise.all([
        api.get('/jurisdictions'),
        api.get('/organization').catch(() => ({ data: { success: false } })),
        api.get('/organization/audit-ledger').catch(() => ({ data: { success: false } })),
      ]);

      if (jurRes.data?.success) {
        setJurisdictions(jurRes.data.data);
        const active = jurRes.data.data.find((j: Jurisdiction) => j.code === selectedJurCode) || jurRes.data.data[0];
        if (active) {
          fetchSingleJurisdiction(active.code);
        }
      }

      if (orgRes.data?.success && orgRes.data?.data) {
        setOrgData(orgRes.data.data);
      }

      if (ledgerRes.data?.success && ledgerRes.data?.data) {
        setLedgerEntries(ledgerRes.data.data);
      }
    } catch (err) {
      toast.error('Failed to load administrative settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchSingleJurisdiction = async (code: string) => {
    try {
      const res = await api.get(`/jurisdictions/${code}`);
      if (res.data?.success) {
        setActiveJurisdiction(res.data.data);
        setSelectedJurCode(code);
      }
    } catch (err) {
      toast.error('Failed to retrieve jurisdiction rule matrix');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectJurisdiction = (code: string) => {
    fetchSingleJurisdiction(code);
    setEditingRuleIndex(null);
    setRuleForm(null);
  };

  const handleEditRule = (index: number) => {
    if (!activeJurisdiction?.rules) return;
    setEditingRuleIndex(index);
    setRuleForm({ ...activeJurisdiction.rules[index] });
  };

  const handleSaveRuleToState = () => {
    if (!ruleForm || editingRuleIndex === null || !activeJurisdiction?.rules) return;
    const updatedRules = [...activeJurisdiction.rules];
    updatedRules[editingRuleIndex] = ruleForm;
    setActiveJurisdiction({ ...activeJurisdiction, rules: updatedRules });
    setEditingRuleIndex(null);
    setRuleForm(null);
    toast.success('Clause changes staged for deployment');
  };

  const handlePublishNewMatrixVersion = async () => {
    if (!activeJurisdiction || !activeJurisdiction.rules) return;
    setIsSavingMatrix(true);

    try {
      const currentVerNum = parseFloat(activeJurisdiction.currentVersion) || 2026.1;
      const nextVer = (currentVerNum + 0.1).toFixed(1);

      const res = await api.put(`/jurisdictions/${activeJurisdiction.code}/rules`, {
        version: nextVer,
        summaryOfChanges: versionBumpNotes,
        rules: activeJurisdiction.rules,
      });

      if (res.data?.success) {
        toast.success(`Rule matrix deployed as Version ${nextVer}!`);
        setActiveJurisdiction(res.data.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update rule matrix');
    } finally {
      setIsSavingMatrix(false);
    }
  };

  const handleSaveOrgSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.put('/organization', orgData);
      if (res.data?.success) {
        toast.success('Organization compliance parameters updated!');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update settings');
    }
  };

  const exportLedgerCSV = () => {
    if (ledgerEntries.length === 0) return;
    const headers = ['Document ID', 'Document Title', 'Candidate', 'Jurisdiction', 'Status', 'Action', 'Actor', 'Timestamp'];
    const rows = ledgerEntries.map((l) => [
      l.documentId,
      `"${l.documentTitle}"`,
      `"${l.candidateName}"`,
      l.jurisdiction,
      l.status,
      l.action,
      `"${l.performedByName}"`,
      l.timestamp,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Compliance_Audit_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success('Audit ledger CSV exported!');
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Admin Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 rounded-3xl p-8 text-white shadow-xl mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs tracking-wider uppercase mb-1">
              <ShieldCheck className="w-4 h-4" /> Enterprise Legal Administration
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Admin & Compliance Control Console</h1>
            <p className="text-xs text-slate-400 mt-1">
              Modify versioned statutory clause matrices, enforce company signing defaults, and inspect legal audit ledgers.
            </p>
          </div>
          <span className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-bold rounded-full">
            Admin Authorized
          </span>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 mb-8 space-x-8">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'matrix'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Scale className="w-4 h-4" /> Statutory Rule Matrix Editor
          </button>
          <button
            onClick={() => setActiveTab('org')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'org'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building className="w-4 h-4" /> Company Template Defaults
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'ledger'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-4 h-4" /> Organization Audit Ledger ({ledgerEntries.length})
          </button>
        </div>

        {/* TAB 1: Statutory Rule Matrix Editor */}
        {activeTab === 'matrix' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Jurisdiction Selector (4 cols) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Select Target Jurisdiction
                </h3>
                <div className="space-y-2">
                  {jurisdictions.map((j) => (
                    <div
                      key={j.code}
                      onClick={() => handleSelectJurisdiction(j.code)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        selectedJurCode === j.code
                          ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-xs text-slate-900">{j.name}</span>
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {j.code}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        Active Version: <span className="font-semibold text-slate-800">{j.currentVersion}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {activeJurisdiction && (
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Deploy Versioned Update
                  </h3>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Release & Audit Notes
                    </label>
                    <textarea
                      rows={2}
                      value={versionBumpNotes}
                      onChange={(e) => setVersionBumpNotes(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <button
                    onClick={handlePublishNewMatrixVersion}
                    disabled={isSavingMatrix}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {isSavingMatrix ? 'Publishing Version...' : 'Publish & Deploy New Version'}
                  </button>
                </div>
              )}
            </div>

            {/* Right: Clause Rules Editor (8 cols) */}
            <div className="lg:col-span-8 space-y-4">
              {activeJurisdiction?.rules && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                    <div>
                      <h2 className="text-base font-extrabold text-slate-900">
                        {activeJurisdiction.name} ({activeJurisdiction.code}) Rule Matrix
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Current Deployed Version: <span className="font-bold text-indigo-700">{activeJurisdiction.currentVersion}</span>
                      </p>
                    </div>
                    <span className="text-xs text-slate-400 font-medium">
                      {activeJurisdiction.rules.length} Statutory Rules Configured
                    </span>
                  </div>

                  {/* Rules Accordion / Cards */}
                  <div className="space-y-4">
                    {activeJurisdiction.rules.map((rule, idx) => {
                      const isEditing = editingRuleIndex === idx;

                      return (
                        <div
                          key={rule.clauseKey}
                          className={`p-5 rounded-2xl border transition-all ${
                            isEditing
                              ? 'border-indigo-500 bg-indigo-50/20 shadow-sm'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-3 mb-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-xs text-slate-900">{rule.title}</h3>
                                {rule.isMandatory ? (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-100 flex items-center gap-1">
                                    <Lock className="w-2.5 h-2.5" /> Mandatory
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 flex items-center gap-1">
                                    <Unlock className="w-2.5 h-2.5" /> Discretionary
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] font-mono text-slate-400 block mt-0.5">
                                Key: {rule.clauseKey} • Ref: {rule.legalReference || 'Standard Statute'}
                              </span>
                            </div>

                            {!isEditing && (
                              <button
                                onClick={() => handleEditRule(idx)}
                                className="px-3 py-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-1"
                              >
                                <Edit3 className="w-3 h-3" /> Edit Clause
                              </button>
                            )}
                          </div>

                          {isEditing && ruleForm ? (
                            <div className="mt-4 pt-4 border-t border-indigo-100 space-y-3">
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Clause Title</label>
                                <input
                                  type="text"
                                  value={ruleForm.title}
                                  onChange={(e) => setRuleForm({ ...ruleForm, title: e.target.value })}
                                  className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Statutory Authority / Legal Reference</label>
                                <input
                                  type="text"
                                  value={ruleForm.legalReference || ''}
                                  onChange={(e) => setRuleForm({ ...ruleForm, legalReference: e.target.value })}
                                  className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Clause Content Template (Interpolation syntax: &#123;&#123;candidate_name&#125;&#125;, &#123;&#123;base_salary&#125;&#125;)</label>
                                <textarea
                                  rows={4}
                                  value={ruleForm.contentTemplate}
                                  onChange={(e) => setRuleForm({ ...ruleForm, contentTemplate: e.target.value })}
                                  className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white font-mono"
                                />
                              </div>
                              <div className="flex justify-end gap-2 pt-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingRuleIndex(null);
                                    setRuleForm(null);
                                  }}
                                  className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={handleSaveRuleToState}
                                  className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
                                >
                                  Stage Changes
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-600 font-mono bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed text-justify mt-2">
                              {rule.contentTemplate}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Company Template Defaults */}
        {activeTab === 'org' && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm max-w-3xl mx-auto">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Company-Wide Contract Signing Defaults</h2>
            <p className="text-xs text-slate-500 mb-6">These parameters are automatically injected into every contract generated by your HR team.</p>

            <form onSubmit={handleSaveOrgSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Organization Legal Name</label>
                <input
                  type="text"
                  value={orgData.name}
                  onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
                  className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Default Governing Region</label>
                  <select
                    value={orgData.defaultJurisdiction}
                    onChange={(e) => setOrgData({ ...orgData, defaultJurisdiction: e.target.value })}
                    className="w-full text-xs p-3 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    {jurisdictions.map((j) => (
                      <option key={j.code} value={j.code}>
                        {j.name} ({j.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Standard Separation Notice (Days)</label>
                  <input
                    type="number"
                    value={orgData.settings?.standardNoticeDays || 30}
                    onChange={(e) => setOrgData({
                      ...orgData,
                      settings: { ...orgData.settings, standardNoticeDays: Number(e.target.value) }
                    })}
                    className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Executive Signatory Name</label>
                  <input
                    type="text"
                    value={orgData.settings?.primarySignatoryName || ''}
                    onChange={(e) => setOrgData({
                      ...orgData,
                      settings: { ...orgData.settings, primarySignatoryName: e.target.value }
                    })}
                    className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Signatory Title</label>
                  <input
                    type="text"
                    value={orgData.settings?.primarySignatoryTitle || ''}
                    onChange={(e) => setOrgData({
                      ...orgData,
                      settings: { ...orgData.settings, primarySignatoryTitle: e.target.value }
                    })}
                    className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20"
                >
                  Save Default Parameters
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: Organization Audit Ledger */}
        {activeTab === 'ledger' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Immutable Compliance Audit Ledger</h2>
                <p className="text-xs text-slate-500">Chronological history of contract generations, downloads, overrides, and e-signatures.</p>
              </div>
              <button
                onClick={exportLedgerCSV}
                className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 border border-slate-200 bg-white hover:bg-slate-50 shadow-sm"
              >
                <Download className="w-3.5 h-3.5 mr-1.5 text-indigo-600" /> Export CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="pb-3">Timestamp</th>
                    <th className="pb-3">Action</th>
                    <th className="pb-3">Candidate / Document</th>
                    <th className="pb-3">Region</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Actor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ledgerEntries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No audit trail entries recorded yet.
                      </td>
                    </tr>
                  ) : (
                    ledgerEntries.map((log, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-3 font-mono text-[11px] text-slate-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            log.action === 'CUSTOM_CLAUSE_OVERRIDDEN'
                              ? 'bg-amber-100 text-amber-800'
                              : log.action.includes('DOWNLOAD')
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {log.action.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3 font-semibold text-slate-800">
                          {log.candidateName} <span className="text-[11px] text-slate-400 font-normal">({log.documentTitle})</span>
                        </td>
                        <td className="py-3 font-mono font-bold text-slate-600">{log.jurisdiction}</td>
                        <td className="py-3">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {log.status}
                          </span>
                        </td>
                        <td className="py-3 text-slate-600">{log.performedByName}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
