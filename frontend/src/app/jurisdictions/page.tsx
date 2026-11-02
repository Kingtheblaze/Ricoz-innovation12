'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import { Jurisdiction } from '@/types';
import { Globe2, ShieldAlert, CheckCircle, Scale, BookOpen, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function JurisdictionsPage() {
  const [jurisdictions, setJurisdictions] = useState<Jurisdiction[]>([]);
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<Jurisdiction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJurisdictions = async () => {
      try {
        const res = await api.get('/jurisdictions');
        if (res.data?.success) {
          setJurisdictions(res.data.data);
          if (res.data.data.length > 0) {
            // Fetch detailed first one
            fetchDetails(res.data.data[0].code);
          }
        }
      } catch (err) {
        toast.error('Failed to load jurisdictions');
      } finally {
        setLoading(false);
      }
    };

    fetchJurisdictions();
  }, []);

  const fetchDetails = async (code: string) => {
    try {
      const res = await api.get(`/jurisdictions/${code}`);
      if (res.data?.success) {
        setSelectedJurisdiction(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load jurisdiction details');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold leading-7 text-slate-900 sm:text-3xl">
            Jurisdiction Labor Rule Matrix
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Version-controlled statutory labor rules, statutory notice, and non-compete enforceability doctrines.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Jurisdiction Selector List */}
          <div className="space-y-4">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Configured Jurisdictions ({jurisdictions.length})
            </h2>

            {jurisdictions.map((j) => {
              const isSelected = selectedJurisdiction?.code === j.code;
              return (
                <div
                  key={j.code}
                  onClick={() => fetchDetails(j.code)}
                  className={`p-5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-white border-sky-500 shadow-md ring-2 ring-sky-500/20'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-2.5 py-1 rounded bg-slate-100 text-slate-800">
                      {j.code}
                    </span>
                    <span className="text-xs font-medium text-sky-600 bg-sky-50 px-2 py-0.5 rounded">
                      v{j.currentVersion}
                    </span>
                  </div>

                  <h3 className="mt-3 text-base font-bold text-slate-900">{j.name}</h3>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-500">
                    <div className="flex items-center">
                      <Scale className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                      <span>{j.governingLawDescription}</span>
                    </div>
                    <div className="flex items-center">
                      <ShieldAlert className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                      <span>Non-Compete: {j.nonCompeteEnforceability}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Rule Matrix Panel */}
          <div className="lg:col-span-2 space-y-6">
            {selectedJurisdiction ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-100">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h2 className="text-xl font-bold text-slate-900">{selectedJurisdiction.name}</h2>
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Active Matrix
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Governing Law: {selectedJurisdiction.governingLawDescription}
                    </p>
                  </div>

                  <div className="mt-4 sm:mt-0 flex items-center space-x-3 text-xs">
                    <span className="bg-slate-100 px-3 py-1.5 rounded-lg text-slate-700 font-medium">
                      Currency: {selectedJurisdiction.standardCurrency}
                    </span>
                    <span className="bg-slate-100 px-3 py-1.5 rounded-lg text-slate-700 font-medium">
                      At-Will: {selectedJurisdiction.atWillDoctrineApplies ? 'Yes (Presumed)' : 'No (Statutory Cause)'}
                    </span>
                  </div>
                </div>

                {/* Non-Compete Statutory Notice Banner */}
                {selectedJurisdiction.nonCompeteEnforceability === 'VOID_AND_UNENFORCEABLE' && (
                  <div className="my-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold text-amber-900">Strict Non-Compete Prohibition Active</h4>
                      <p className="text-xs text-amber-800 mt-1">
                        Pursuant to California Business & Professions Code Section 16600, post-employment restrictive covenants are void as a matter of law. Any attempt to enforce non-competes subjects the employer to statutory civil penalties.
                      </p>
                    </div>
                  </div>
                )}

                {/* Rules List */}
                <div className="mt-6">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
                    Mandatory & Localized Clauses ({selectedJurisdiction.rules?.length || 0})
                  </h3>

                  <div className="space-y-4">
                    {selectedJurisdiction.rules?.map((rule, idx) => (
                      <div key={rule.clauseKey} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 text-xs font-bold flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="text-sm font-bold text-slate-800">{rule.title}</span>
                          </div>
                          <span
                            className={`text-xs px-2 py-0.5 rounded font-semibold ${
                              rule.isMandatory
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {rule.isMandatory ? 'Mandatory Statutory' : 'Optional / Flexible'}
                          </span>
                        </div>

                        {rule.legalReference && (
                          <div className="flex items-center text-xs text-indigo-600 font-medium mb-2">
                            <BookOpen className="w-3.5 h-3.5 mr-1" />
                            <span>Statutory Basis: {rule.legalReference}</span>
                          </div>
                        )}

                        <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs text-slate-600 font-mono leading-relaxed">
                          {rule.contentTemplate}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
                Select a jurisdiction to inspect rule details.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
