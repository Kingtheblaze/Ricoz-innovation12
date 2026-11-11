'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { 
  FileText, 
  CheckCircle2, 
  PenTool, 
  ShieldCheck, 
  AlertCircle, 
  RotateCcw,
  Building2,
  Calendar,
  DollarSign,
  Lock
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function CandidateSigningPage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;

  const [documentData, setDocumentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [candidateFullName, setCandidateFullName] = useState('');
  const [agreeChecked, setAgreeChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signedSuccess, setSignedSuccess] = useState(false);

  // Signature Canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const fetchByToken = async () => {
      try {
        const res = await axios.get(`${API_BASE}/documents/sign/${token}`);
        if (res.data?.success) {
          setDocumentData(res.data.data);
          setCandidateFullName(res.data.data.candidate.fullName);
        }
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Invalid or expired signing link');
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchByToken();
  }, [token]);

  // Canvas drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f172a';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleSignSubmit = async () => {
    if (!agreeChecked) {
      toast.error('Please confirm your review and consent checkbox');
      return;
    }
    if (!candidateFullName.trim()) {
      toast.error('Please confirm your full legal name');
      return;
    }
    if (!hasDrawn || !canvasRef.current) {
      toast.error('Please draw your digital signature on the pad');
      return;
    }

    const signatureDataUrl = canvasRef.current.toDataURL('image/png');

    setIsSubmitting(true);
    try {
      const res = await axios.post(`${API_BASE}/documents/sign/${token}`, {
        fullName: candidateFullName,
        signatureImage: signatureDataUrl,
      });

      if (res.data?.success) {
        setSignedSuccess(true);
        toast.success('Agreement successfully executed!');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Execution failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-slate-500 font-medium">Validating secure signing token...</p>
        </div>
      </div>
    );
  }

  if (!documentData) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-slate-200">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-900">Invalid or Expired Link</h2>
          <p className="text-xs text-slate-500 mt-2">
            This contract execution link has expired or has already been fulfilled. Please contact the hiring company for a new invitation.
          </p>
        </div>
      </div>
    );
  }

  if (signedSuccess || documentData.status === 'SIGNED') {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <Toaster position="top-right" />
        <div className="bg-white p-8 sm:p-12 rounded-3xl shadow-xl max-w-lg w-full text-center border border-slate-200">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Agreement Executed!</h2>
          <p className="text-xs text-slate-600 mt-2">
            Thank you, <span className="font-bold text-slate-800">{documentData.candidate.fullName}</span>. Your employment agreement has been digitally signed and stored in the immutable compliance audit ledger.
          </p>
          <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs text-slate-600 space-y-1">
            <div><span className="text-slate-400">Position:</span> <span className="font-semibold text-slate-800">{documentData.roleDetails.jobTitle}</span></div>
            <div><span className="text-slate-400">Jurisdiction:</span> <span className="font-semibold text-slate-800">{documentData.jurisdictionSnapshot.governingLaw}</span></div>
            <div><span className="text-slate-400">Timestamp:</span> <span className="font-semibold text-slate-800">{new Date().toLocaleString()}</span></div>
          </div>
          <p className="text-[11px] text-slate-400 mt-6">
            A finalized copy with digital certificate has been forwarded to the HR department. You may close this tab.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 pb-20">
      <Toaster position="top-right" />

      {/* Top Banner */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 sticky top-0 z-40 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <span className="font-extrabold text-slate-900 text-base">JurisFlow Secure E-Sign</span>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100 flex items-center gap-1">
            <Lock className="w-3 h-3" /> TLS 1.3 256-Bit Encrypted
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-8">
        {/* Document Header Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-slate-100 text-slate-600">
                Official Employment Offer & Agreement
              </span>
              <h1 className="text-2xl font-extrabold text-slate-900 mt-1">{documentData.title}</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Prepared for <span className="font-semibold text-slate-800">{documentData.candidate.fullName}</span> ({documentData.candidate.email})
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Governing Law</span>
              <span className="text-xs font-bold text-indigo-900">{documentData.jurisdictionSnapshot.governingLaw}</span>
            </div>
          </div>

          {/* Key Terms Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">Role</span>
              <span className="font-bold text-slate-800">{documentData.roleDetails.jobTitle}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Start Date</span>
              <span className="font-bold text-slate-800">{documentData.roleDetails.startDate}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Base Salary</span>
              <span className="font-bold text-slate-800 font-mono">
                {documentData.compensation.currency} {documentData.compensation.baseSalary.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Location</span>
              <span className="font-bold text-slate-800">{documentData.roleDetails.workLocation}</span>
            </div>
          </div>
        </div>

        {/* Contract Text Body */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm mb-8 space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3">
            Contract Terms & Statutory Covenants
          </h2>

          <div className="space-y-6">
            {documentData.appliedClauses?.map((clause: any, index: number) => (
              <div key={index} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-bold text-slate-900">{clause.title}</h3>
                  {clause.isMandatory && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-700">
                      STATUTORY
                    </span>
                  )}
                </div>
                {clause.legalReference && (
                  <p className="text-[11px] font-mono text-slate-400 mb-2">{clause.legalReference}</p>
                )}
                <p className="text-slate-600 leading-relaxed text-justify">{clause.renderedText}</p>
              </div>
            ))}

            {documentData.customClausesAdded?.map((clause: any, index: number) => (
              <div key={index} className="p-4 rounded-2xl bg-teal-50/50 border border-teal-200 text-xs">
                <h3 className="font-bold text-teal-900 mb-1">{clause.title}</h3>
                <p className="text-slate-600 leading-relaxed text-justify">{clause.content}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Digital Signature Adoption Section */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-2">
            <PenTool className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Execute Digital Signature</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm Legal Name</label>
              <input
                type="text"
                value={candidateFullName}
                onChange={(e) => setCandidateFullName(e.target.value)}
                className="w-full text-xs font-semibold p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Execution Date</label>
              <input
                type="text"
                value={new Date().toLocaleDateString()}
                readOnly
                className="w-full text-xs font-semibold p-3 border border-slate-200 bg-slate-50 text-slate-500 rounded-xl"
              />
            </div>
          </div>

          {/* Signature Canvas Pad */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Draw Your Signature Below *
              </label>
              <button
                type="button"
                onClick={clearCanvas}
                className="inline-flex items-center text-[11px] font-semibold text-slate-500 hover:text-slate-800"
              >
                <RotateCcw className="w-3 h-3 mr-1" /> Clear Pad
              </button>
            </div>
            <div className="border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 overflow-hidden relative">
              <canvas
                ref={canvasRef}
                width={700}
                height={160}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-40 cursor-crosshair touch-none"
              />
              {!hasDrawn && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-xs text-slate-400">
                  Click or touch to write your signature
                </div>
              )}
            </div>
          </div>

          {/* Legal Consent Checkbox */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
            <input
              type="checkbox"
              id="consent"
              checked={agreeChecked}
              onChange={(e) => setAgreeChecked(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
            />
            <label htmlFor="consent" className="text-xs text-slate-600 leading-relaxed cursor-pointer">
              I acknowledge that I have carefully reviewed this offer agreement and agree to be bound by its terms. Pursuant to the Electronic Signatures in Global and National Commerce Act (E-SIGN) and applicable local laws, my electronic signature holds the same legal validity as a handwritten signature.
            </label>
          </div>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSignSubmit}
            className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? 'Recording Signature & Timestamp...' : 'Adopt & Sign Agreement'}
            {!isSubmitting && <CheckCircle2 className="w-4 h-4" />}
          </button>
        </div>
      </main>
    </div>
  );
}

