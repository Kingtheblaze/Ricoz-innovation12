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
  AlertTriangle,
  Send,
  Edit3,
  Check,
  X,
  Copy,
  ExternalLink,
  Lock
} from 'lucide-react';

export default function DocumentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const docId = params?.id as string;

  const [contractDoc, setContractDoc] = useState<GeneratedDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingClauseIndex, setEditingClauseIndex] = useState<number | null>(null);
  const [editedClauseText, setEditedClauseText] = useState<string>('');
  const [savingClause, setSavingClause] = useState(false);
  const [sendingModalOpen, setSendingModalOpen] = useState(false);
  const [candidateSignUrl, setCandidateSignUrl] = useState<string>('');

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

  useEffect(() => {
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
      toast.success(`${format.toUpperCase()} downloaded successfully`, { id: 'export' });
      fetchDoc();
    } catch (err) {
      toast.error(`Failed to export ${format.toUpperCase()}`, { id: 'export' });
    }
  };

  const startEditClause = (index: number, text: string) => {
    setEditingClauseIndex(index);
    setEditedClauseText(text);
  };

  const cancelEditClause = () => {
    setEditingClauseIndex(null);
    setEditedClauseText('');
  };

  const saveEditedClause = async (clauseKey: string, isMandatory: boolean) => {
    if (isMandatory) {
      toast.error('Statutory mandatory clauses cannot be altered directly without compliance override flag.');
      return;
    }

    setSavingClause(true);
    try {
      const res = await api.patch(`/documents/${docId}/clauses/${clauseKey}`, {
        renderedText: editedClauseText,
      });

      if (res.data?.success) {
        toast.success('Clause updated successfully and audit logged');
        setContractDoc(res.data.data);
        setEditingClauseIndex(null);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update clause');
    } finally {
      setSavingClause(false);
    }
  };

  const handleSendToCandidate = async () => {
    try {
      toast.loading('Generating candidate e-signing link...', { id: 'send' });
      const res = await api.post(`/documents/${docId}/send`);
      if (res.data?.success) {
        const token = res.data.data.signingToken;
        const fullSignUrl = `${window.location.origin}/sign/${token}`;
        setCandidateSignUrl(fullSignUrl);
        setSendingModalOpen(true);
        toast.success('Document marked as SENT to candidate!', { id: 'send' });
        fetchDoc();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send document', { id: 'send' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto"></div>
          <p className="mt-4 text-slate-500 font-medium">Retrieving localized contract details...</p>
        </div>
      </div>
    );
  }

  if (!contractDoc) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <h2 className="text-xl font-bold text-slate-900">Document Not Found</h2>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 px-4 py-2 bg-sky-600 text-white rounded-lg text-xs font-semibold"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const isSigned = contractDoc.status === 'SIGNED';
  const isSent = contractDoc.status === 'SENT';

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Top Header & Action Controls */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <button
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 mb-2 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Dashboard
            </button>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {contractDoc.title}
              </h1>
              {isSigned ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> SIGNED
                </span>
              ) : isSent ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-amber-600" /> SENT FOR SIGNATURE
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  DRAFT
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Generated on {new Date(contractDoc.createdAt).toLocaleDateString()} • Candidate: <span className="font-semibold text-slate-800">{contractDoc.candidate.fullName}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!isSigned && (
              <button
                type="button"
                onClick={handleSendToCandidate}
                className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all"
              >
                <Send className="w-4 h-4 mr-2" />
                {isSent ? 'Resend / Copy Sign Link' : 'Send for E-Signature'}
              </button>
            )}

            <button
              onClick={() => handleDownload('pdf')}
              className="inline-flex items-center px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 shadow-sm transition-all"
            >
              <Download className="w-4 h-4 mr-2 text-rose-500" />
              Download PDF
            </button>
            <button
              onClick={() => handleDownload('docx')}
              className="inline-flex items-center px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 shadow-sm transition-all"
            >
              <Download className="w-4 h-4 mr-2 text-blue-500" />
              Download DOCX
            </button>
          </div>
        </div>

        {/* E-Signature Banner if Signed */}
        {isSigned && contractDoc.signature && (
          <div className="mb-8 p-6 rounded-3xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-500/20">
                <Check className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Digitally Executed by Candidate</h3>
                <p className="text-xs text-slate-600">
                  Signed by <span className="font-semibold">{contractDoc.signature.signedBy}</span> ({contractDoc.signature.signerEmail}) on{' '}
                  {new Date(contractDoc.signature.signedAt || '').toLocaleString()}
                </p>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">Audit IP: {contractDoc.signature.signerIp || 'Verified Web Signature'}</p>
              </div>
            </div>
            {contractDoc.signature.signatureImage && (
              <div className="bg-white p-2 rounded-xl border border-emerald-200 shadow-sm">
                <img 
                  src={contractDoc.signature.signatureImage} 
                  alt="Candidate Signature" 
                  className="h-10 object-contain"
                />
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Contract View (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-10">
              {/* Document Header Details */}
              <div className="border-b border-slate-100 pb-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-slate-100 text-slate-600">
                    {contractDoc.documentType.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs font-mono text-slate-400">ID: {contractDoc._id}</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900">Summary of Key Terms</h2>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Position</span>
                    <span className="font-bold text-slate-800">{contractDoc.roleDetails.jobTitle}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Department</span>
                    <span className="font-bold text-slate-800">{contractDoc.roleDetails.department}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Start Date</span>
                    <span className="font-bold text-slate-800">{contractDoc.roleDetails.startDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Base Salary</span>
                    <span className="font-bold text-slate-800 font-mono">
                      {contractDoc.compensation.currency} {contractDoc.compensation.baseSalary.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Work Setup</span>
                    <span className="font-bold text-slate-800">{contractDoc.roleDetails.workArrangement}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Governing Region</span>
                    <span className="font-bold text-sky-700 font-mono">{contractDoc.jurisdictionSnapshot.code}</span>
                  </div>
                </div>
              </div>

              {/* Clauses Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Statutory & Contractual Provisions
                  </h3>
                  <span className="text-xs text-slate-400">Click edit icon on discretionary clauses</span>
                </div>

                {contractDoc.appliedClauses.map((clause, index) => {
                  const isEditing = editingClauseIndex === index;

                  return (
                    <div 
                      key={index} 
                      className={`p-5 rounded-2xl border transition-all ${
                        clause.isMandatory 
                          ? 'border-slate-200 bg-slate-50/50' 
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1.5">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">{clause.title}</h4>
                          {clause.isMandatory ? (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" /> Mandatory Statute
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-sky-700 bg-sky-50 border border-sky-100 px-2 py-0.5 rounded-full">
                              Discretionary
                            </span>
                          )}
                        </div>

                        {!clause.isMandatory && !isSigned && (
                          <div>
                            {!isEditing ? (
                              <button
                                onClick={() => startEditClause(index, clause.renderedText)}
                                className="text-slate-400 hover:text-sky-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                                title="Edit Clause"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => saveEditedClause(clause.clauseKey, clause.isMandatory)}
                                  disabled={savingClause}
                                  className="text-emerald-600 hover:text-emerald-700 p-1"
                                  title="Save Clause"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={cancelEditClause}
                                  className="text-slate-400 hover:text-slate-600 p-1"
                                  title="Cancel"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {clause.legalReference && (
                        <p className="text-[11px] font-mono text-slate-400 mb-2">
                          Statutory Authority: {clause.legalReference}
                        </p>
                      )}

                      {isEditing ? (
                        <div className="mt-2 space-y-2">
                          <textarea
                            rows={4}
                            value={editedClauseText}
                            onChange={(e) => setEditedClauseText(e.target.value)}
                            className="w-full text-xs text-slate-700 p-3 border border-sky-300 rounded-xl focus:ring-2 focus:ring-sky-500 bg-sky-50/20"
                          />
                          <div className="flex justify-end gap-2 text-xs">
                            <button
                              onClick={cancelEditClause}
                              className="px-3 py-1 text-slate-500 hover:text-slate-700"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => saveEditedClause(clause.clauseKey, clause.isMandatory)}
                              disabled={savingClause}
                              className="px-3 py-1 bg-sky-600 text-white rounded-lg font-semibold"
                            >
                              {savingClause ? 'Saving...' : 'Save Clause'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-600 leading-relaxed text-justify">
                          {clause.renderedText}
                        </p>
                      )}
                    </div>
                  );
                })}

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
              <div className="mt-8 p-4 rounded-2xl bg-slate-100 border border-slate-200 text-[11px] text-slate-500 leading-relaxed">
                {contractDoc.legalDisclaimer}
              </div>
            </div>
          </div>

          {/* Sidebar: Compliance & Audit Trail */}
          <div className="space-y-6">
            {/* Compliance Badge */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Compliance Verified</h3>
                  <p className="text-xs text-slate-500">Governing Law: {contractDoc.jurisdictionSnapshot.governingLaw}</p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Jurisdiction Code:</span>
                  <span className="font-mono font-bold text-slate-800">{contractDoc.jurisdictionSnapshot.code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Rule Matrix Version:</span>
                  <span className="font-semibold text-slate-800">{contractDoc.jurisdictionSnapshot.versionUsed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Non-Compete Policy:</span>
                  <span className="font-semibold text-rose-600">{contractDoc.jurisdictionSnapshot.nonCompeteStatus || 'Enforced per statute'}</span>
                </div>
              </div>
            </div>

            {/* Audit Trail Log */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <History className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-bold text-slate-900">Statutory Audit Trail</h3>
              </div>

              <div className="space-y-4">
                {contractDoc.auditTrail?.map((log, idx) => (
                  <div key={idx} className="relative pl-5 pb-3 border-l border-slate-200 last:border-0 last:pb-0">
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

        {/* Modal: Sent For Signature Link */}
        {sendingModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                <Send className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Candidate E-Signing Link Ready</h3>
              <p className="text-xs text-slate-500 mt-1">
                Share this secure direct link with <span className="font-semibold text-slate-800">{contractDoc.candidate.fullName}</span> to adopt and execute their digital signature.
              </p>

              <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
                <span className="text-xs font-mono text-slate-700 truncate">{candidateSignUrl}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(candidateSignUrl);
                    toast.success('Link copied to clipboard!');
                  }}
                  className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900"
                  title="Copy Link"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setSendingModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Close
                </button>
                <a
                  href={candidateSignUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700"
                >
                  Open Signing Page <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                </a>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
