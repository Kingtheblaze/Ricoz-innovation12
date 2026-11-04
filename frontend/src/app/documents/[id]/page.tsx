'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import { GeneratedDocument } from '@/types';
import toast from 'react-hot-toast';
import { 
  FileText, 
  Download, 
  ShieldCheck, 
  History, 
  ArrowLeft, 
  Calendar, 
  Building, 
  Scale, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';

export default function DocumentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const docId = params?.id as string;

  const [contractDoc, setContractDoc] = useState<GeneratedDocument | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const res = await api.get(`/documents/${docId}`);
        if (res.data?.success) {
          setContractDoc(res.data.data);
        }
      } catch (err) {
        toast.error('Failed to load contract details');
      } finally {
        setLoading(false);
      }
    };

    if (docId) fetchDoc();
  }, [docId]);

  const handleDownload = async (format: 'pdf' | 'docx') => {
    if (!contractDoc) return;
    try {
      toast.loading(`Exporting ${format.toUpperCase()}...`, { id: 'export' });
      const res = await api.get(`/documents/${docId}/${format}`, {
        responseType: 'blob',
      });

      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${contractDoc.title.replace(/\s+/g, '_')}.${format}`);
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(`${format.toUpperCase()} exported successfully!`, { id: 'export' });
    } catch (err) {
      toast.error('Export failed', { id: 'export' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  if (!contractDoc) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h2 className="text-xl font-bold text-slate-800">Document not found</h2>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 px-4 py-2 bg-sky-600 text-white text-sm rounded-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Navigation */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
          </button>

          <div className="flex space-x-3">
            <button
              onClick={() => handleDownload('pdf')}
              className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Download Official PDF
            </button>

            <button
              onClick={() => handleDownload('docx')}
              className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Download Word DOCX
            </button>
          </div>
        </div>

        {/* Contract Preview & Audit Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Contract Viewer */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              {/* Header */}
              <div className="border-b border-slate-100 pb-6 text-center">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-3 py-1 rounded-full">
                  {contractDoc.documentType.replace(/_/g, ' ')}
                </span>
                <h1 className="text-2xl font-extrabold text-slate-900 mt-3">{contractDoc.title}</h1>
                <p className="text-xs text-slate-500 mt-1">
                  Jurisdiction: <span className="font-semibold text-slate-700">{contractDoc.jurisdictionSnapshot.name}</span> ({contractDoc.jurisdictionSnapshot.code}) • Version: {contractDoc.jurisdictionSnapshot.versionUsed}
                </p>
              </div>

              {/* Summary Terms Card */}
              <div className="my-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Appointment Key Provisions
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs text-slate-700">
                  <div><span className="text-slate-400">Candidate:</span> <span className="font-semibold">{contractDoc.candidate.fullName}</span></div>
                  <div><span className="text-slate-400">Role:</span> <span className="font-semibold">{contractDoc.roleDetails.jobTitle}</span></div>
                  <div><span className="text-slate-400">Start Date:</span> <span className="font-semibold">{new Date(contractDoc.roleDetails.startDate).toLocaleDateString()}</span></div>
                  <div><span className="text-slate-400">Base Salary:</span> <span className="font-semibold">{contractDoc.compensation.currency} {Number(contractDoc.compensation.baseSalary).toLocaleString()} ({contractDoc.compensation.payFrequency})</span></div>
                  <div><span className="text-slate-400">Work Mode:</span> <span className="font-semibold">{contractDoc.roleDetails.workArrangement}</span></div>
                  <div><span className="text-slate-400">Department:</span> <span className="font-semibold">{contractDoc.roleDetails.department}</span></div>
                </div>
              </div>

              {/* Applied Clauses List */}
              <div className="space-y-6">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Mandatory & Applied Clauses ({contractDoc.appliedClauses.length})
                </h3>

                {contractDoc.appliedClauses.map((clause, idx) => (
                  <div key={idx} className="border-l-2 border-sky-600 pl-4 py-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-bold text-slate-900">
                        {idx + 1}. {clause.title}
                      </h4>
                      {clause.isMandatory && (
                        <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                          Mandatory
                        </span>
                      )}
                    </div>
                    {clause.legalReference && (
                      <p className="text-[11px] font-medium text-slate-400 mb-2">
                        Statutory Basis: {clause.legalReference}
                      </p>
                    )}
                    <p className="text-xs text-slate-600 leading-relaxed text-justify">
                      {clause.renderedText}
                    </p>
                  </div>
                ))}

                {contractDoc.customClausesAdded && contractDoc.customClausesAdded.length > 0 && (
                  <div className="pt-4 border-t border-slate-100">
                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
                      Supplementary Company Provisions
                    </h4>
                    {contractDoc.customClausesAdded.map((c, i) => (
                      <div key={i} className="border-l-2 border-teal-600 pl-4 py-1 mb-4">
                        <h5 className="text-xs font-bold text-teal-800">{c.title}</h5>
                        <p className="text-xs text-slate-600 mt-1">{c.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Legal Disclaimer Box */}
              <div className="mt-8 p-4 rounded-xl bg-slate-100 border border-slate-200 text-[11px] text-slate-500 leading-relaxed">
                {contractDoc.legalDisclaimer}
              </div>
            </div>
          </div>

          {/* Sidebar: Compliance & Audit Trail */}
          <div className="space-y-6">
            {/* Compliance Badge */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Statutory Compliance Verified</h3>
                  <p className="text-xs text-slate-500">Governing Law: {contractDoc.jurisdictionSnapshot.governingLaw}</p>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Jurisdiction Code:</span>
                  <span className="font-mono font-bold text-slate-800">{contractDoc.jurisdictionSnapshot.code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Rule Matrix Version:</span>
                  <span className="font-semibold text-slate-800">{contractDoc.jurisdictionSnapshot.versionUsed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Non-Compete Enforceability:</span>
                  <span className="font-semibold text-rose-600">{contractDoc.jurisdictionSnapshot.nonCompeteStatus || 'Enforced per statute'}</span>
                </div>
              </div>
            </div>

            {/* Audit Trail Log */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <History className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-bold text-slate-900">Statutory Audit Trail</h3>
              </div>

              <div className="space-y-4">
                {contractDoc.auditTrail?.map((log, idx) => (
                  <div key={idx} className="relative pl-5 pb-2 border-l border-slate-200 last:border-0 last:pb-0">
                    <div className="absolute -left-1.5 top-0.5 w-3 h-3 rounded-full bg-sky-500 border-2 border-white" />
                    <div className="text-xs font-bold text-slate-800">{log.action.replace(/_/g, ' ')}</div>
                    <div className="text-[11px] text-slate-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                    {log.performedByName && (
                      <div className="text-[11px] text-slate-500">By {log.performedByName}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
