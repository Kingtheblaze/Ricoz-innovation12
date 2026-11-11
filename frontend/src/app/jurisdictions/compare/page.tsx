'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import { Jurisdiction } from '@/types';
import toast from 'react-hot-toast';
import { 
  Scale, 
  ArrowRightLeft, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ShieldAlert, 
  FileText, 
  DollarSign, 
  Clock, 
  Calendar,
  Briefcase
} from 'lucide-react';

export default function CompareJurisdictionsPage() {
  const [jurisdictions, setJurisdictions] = useState<Jurisdiction[]>([]);
  const [loading, setLoading] = useState(true);
  const [jurA, setJurA] = useState<string>('US-CA');
  const [jurB, setJurB] = useState<string>('GB-UK');

  useEffect(() => {
    const fetchJurisdictions = async () => {
      try {
        const res = await api.get('/jurisdictions');
        if (res.data?.success) {
          setJurisdictions(res.data.data);
          if (res.data.data.length >= 2) {
            setJurA(res.data.data[0].code);
            setJurB(res.data.data[1].code);
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

  const dataA = jurisdictions.find((j) => j.code === jurA);
  const dataB = jurisdictions.find((j) => j.code === jurB);

  const renderNonCompeteBadge = (status?: string) => {
    switch (status) {
      case 'VOID_AND_UNENFORCEABLE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" /> Void & Strictly Illegal
          </span>
        );
      case 'RESTRICTED_REASONABLE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Restricted to Legitimate Interest
          </span>
        );
      case 'ENFORCEABLE_WITH_GARDEN_LEAVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" /> Enforceable (Compensated)
          </span>
        );
      default:
        return <span className="text-slate-500 text-xs">Standard Contract Law</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto"></div>
          <p className="mt-4 text-slate-500 font-medium">Loading statutory comparison matrix...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-900 via-indigo-900 to-slate-900 rounded-3xl p-8 text-white shadow-xl mb-8 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center gap-3 text-sky-400 font-semibold text-sm tracking-wide uppercase mb-2">
            <ArrowRightLeft className="w-4 h-4" /> Compliance Intelligence Engine
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Cross-Jurisdiction Statutory Comparator
          </h1>
          <p className="mt-2 text-slate-300 max-w-2xl text-base">
            Instantly evaluate employment law contrasts between global regions to align cross-border offers, termination covenants, and statutory mandatory benefits.
          </p>
        </div>

        {/* Jurisdiction Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Jurisdiction A */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Primary Jurisdiction (Region A)
            </label>
            <select
              value={jurA}
              onChange={(e) => setJurA(e.target.value)}
              className="w-full text-base font-semibold px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50"
            >
              {jurisdictions.map((j) => (
                <option key={j.code} value={j.code}>
                  {j.name} ({j.code}) — {j.countryCode}
                </option>
              ))}
            </select>
          </div>

          {/* Jurisdiction B */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Comparison Jurisdiction (Region B)
            </label>
            <select
              value={jurB}
              onChange={(e) => setJurB(e.target.value)}
              className="w-full text-base font-semibold px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
            >
              {jurisdictions.map((j) => (
                <option key={j.code} value={j.code}>
                  {j.name} ({j.code}) — {j.countryCode}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Side-by-Side Comparison Table */}
        {dataA && dataB && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-8">
            <div className="grid grid-cols-3 bg-slate-100 border-b border-slate-200 px-6 py-4 font-bold text-xs uppercase tracking-wider text-slate-600">
              <div>Legal Category / Doctrine</div>
              <div className="text-sky-800">{dataA.name} ({dataA.code})</div>
              <div className="text-indigo-800">{dataB.name} ({dataB.code})</div>
            </div>

            <div className="divide-y divide-slate-100 text-sm">
              {/* Region Type & Currency */}
              <div className="grid grid-cols-3 px-6 py-4 items-center">
                <div className="font-semibold text-slate-700 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-slate-400" /> Standard Currency & Region
                </div>
                <div>
                  <span className="font-mono font-bold text-slate-900">{dataA.standardCurrency}</span>
                  <span className="text-xs text-slate-500 ml-2">({dataA.regionType})</span>
                </div>
                <div>
                  <span className="font-mono font-bold text-slate-900">{dataB.standardCurrency}</span>
                  <span className="text-xs text-slate-500 ml-2">({dataB.regionType})</span>
                </div>
              </div>

              {/* At-Will Employment */}
              <div className="grid grid-cols-3 px-6 py-4 items-center">
                <div className="font-semibold text-slate-700 flex items-center gap-2">
                  <Scale className="w-4 h-4 text-slate-400" /> At-Will Employment Doctrine
                </div>
                <div>
                  {dataA.atWillDoctrineApplies ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" /> At-Will Recognized
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      <XCircle className="w-3.5 h-3.5 text-slate-500" /> Cause / Dismissal Protection Required
                    </span>
                  )}
                </div>
                <div>
                  {dataB.atWillDoctrineApplies ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" /> At-Will Recognized
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      <XCircle className="w-3.5 h-3.5 text-slate-500" /> Cause / Dismissal Protection Required
                    </span>
                  )}
                </div>
              </div>

              {/* Statutory Notice Period */}
              <div className="grid grid-cols-3 px-6 py-4 items-center">
                <div className="font-semibold text-slate-700 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" /> Statutory Notice Requirement
                </div>
                <div>
                  {dataA.statutoryNoticeWeeks > 0 ? (
                    <span className="font-semibold text-slate-900">
                      {dataA.statutoryNoticeWeeks} weeks statutory scale
                    </span>
                  ) : (
                    <span className="text-slate-600 font-medium">None (At-Will, 0 days mandatory)</span>
                  )}
                </div>
                <div>
                  {dataB.statutoryNoticeWeeks > 0 ? (
                    <span className="font-semibold text-slate-900">
                      {dataB.statutoryNoticeWeeks} weeks statutory scale
                    </span>
                  ) : (
                    <span className="text-slate-600 font-medium">None (At-Will, 0 days mandatory)</span>
                  )}
                </div>
              </div>

              {/* Non-Compete Covenants */}
              <div className="grid grid-cols-3 px-6 py-4 items-center">
                <div className="font-semibold text-slate-700 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-slate-400" /> Post-Employment Non-Compete
                </div>
                <div>{renderNonCompeteBadge(dataA.nonCompeteEnforceability)}</div>
                <div>{renderNonCompeteBadge(dataB.nonCompeteEnforceability)}</div>
              </div>

              {/* Governing Law Description */}
              <div className="grid grid-cols-3 px-6 py-4 items-start">
                <div className="font-semibold text-slate-700 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" /> Legal Framework & Precedents
                </div>
                <div className="text-xs text-slate-600 leading-relaxed pr-4">
                  {dataA.governingLawDescription}
                </div>
                <div className="text-xs text-slate-600 leading-relaxed pr-4">
                  {dataB.governingLawDescription}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mandatory Clauses Breakdown */}
        {dataA && dataB && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Rules in A */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                Mandatory Clauses in {dataA.name}
              </h2>
              <div className="space-y-3">
                {dataA.rules && dataA.rules.length > 0 ? (
                  dataA.rules.map((rule) => (
                    <div key={rule.clauseKey} className="p-4 rounded-xl border border-slate-100 bg-slate-50">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-900 text-sm">{rule.title}</span>
                        {rule.isMandatory && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-700">
                            MANDATORY
                          </span>
                        )}
                      </div>
                      {rule.legalReference && (
                        <p className="text-xs text-slate-500 font-mono">{rule.legalReference}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">Rule matrix available upon full compliance generation.</p>
                )}
              </div>
            </div>

            {/* Rules in B */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                Mandatory Clauses in {dataB.name}
              </h2>
              <div className="space-y-3">
                {dataB.rules && dataB.rules.length > 0 ? (
                  dataB.rules.map((rule) => (
                    <div key={rule.clauseKey} className="p-4 rounded-xl border border-slate-100 bg-slate-50">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-900 text-sm">{rule.title}</span>
                        {rule.isMandatory && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-700">
                            MANDATORY
                          </span>
                        )}
                      </div>
                      {rule.legalReference && (
                        <p className="text-xs text-slate-500 font-mono">{rule.legalReference}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">Rule matrix available upon full compliance generation.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

