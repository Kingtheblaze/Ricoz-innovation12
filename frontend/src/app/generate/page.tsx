'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import { Jurisdiction } from '@/types';
import toast from 'react-hot-toast';
import { 
  Building2, 
  User, 
  Briefcase, 
  DollarSign, 
  ShieldCheck, 
  FileText, 
  AlertCircle,
  Plus, 
  Trash2, 
  Check, 
  ChevronRight, 
  ChevronLeft 
} from 'lucide-react';

export default function GenerateContractPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [jurisdictions, setJurisdictions] = useState<Jurisdiction[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    jurisdictionCode: 'US-CA',
    documentType: 'FULL_COMPLIANCE_BUNDLE' as 'OFFER_LETTER' | 'EMPLOYMENT_AGREEMENT' | 'FULL_COMPLIANCE_BUNDLE',
    candidate: {
      fullName: '',
      email: '',
      phone: '',
      residentialAddress: {
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'United States',
      },
    },
    roleDetails: {
      jobTitle: '',
      department: 'Engineering',
      reportingTo: 'Engineering VP',
      employmentType: 'Full-Time' as const,
      workArrangement: 'Remote' as const,
      workLocation: 'Remote / Home Office',
      startDate: new Date().toISOString().split('T')[0],
    },
    compensation: {
      baseSalary: 120000,
      currency: 'USD',
      payFrequency: 'Annual' as const,
      equityGrantDetails: '0.1% Incentive Stock Options with 4-year vesting and 1-year cliff.',
      bonusStructure: 'Annual performance target bonus up to 15% of base compensation.',
      benefitsSummary: 'Comprehensive health, dental, vision insurance and 401(k) retirement matching.',
    },
    customClauses: [] as Array<{ title: string; content: string; category?: string }>,
  });

  // State for adding a new custom clause
  const [newClause, setNewClause] = useState({ title: '', content: '' });

  useEffect(() => {
    const fetchJurisdictions = async () => {
      try {
        const res = await api.get('/jurisdictions');
        if (res.data?.success) {
          setJurisdictions(res.data.data);
        }
      } catch (err) {
        toast.error('Failed to load jurisdictions');
      }
    };
    fetchJurisdictions();
  }, []);

  const handleJurisdictionChange = (code: string) => {
    const selected = jurisdictions.find((j) => j.code === code);
    setFormData((prev) => ({
      ...prev,
      jurisdictionCode: code,
      compensation: {
        ...prev.compensation,
        currency: selected?.standardCurrency || 'USD',
      },
      candidate: {
        ...prev.candidate,
        residentialAddress: {
          ...prev.candidate.residentialAddress,
          country: code === 'GB-UK' ? 'United Kingdom' : 'United States',
        },
      },
    }));
  };

  const addCustomClause = () => {
    if (!newClause.title || !newClause.content) {
      toast.error('Please enter clause title and text');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      customClauses: [...prev.customClauses, { ...newClause, category: 'company_custom' }],
    }));
    setNewClause({ title: '', content: '' });
  };

  const removeCustomClause = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      customClauses: prev.customClauses.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    if (!formData.candidate.fullName || !formData.candidate.email || !formData.roleDetails.jobTitle) {
      toast.error('Please complete required fields (Candidate Name, Email, Job Title)');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/documents/generate', formData);
      if (res.data?.success) {
        toast.success('Contract generated and localized successfully!');
        if (res.data.data.complianceWarnings?.length > 0) {
          toast(res.data.data.complianceWarnings[0].warning, { icon: '⚠️', duration: 6000 });
        }
        router.push(`/documents/${res.data.data.document._id}`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to generate document');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedJurisdictionInfo = jurisdictions.find((j) => j.code === formData.jurisdictionCode);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Contract Localization Wizard</h1>
              <p className="text-sm text-slate-500 mt-1">
                Step {step} of 4: {step === 1 ? 'Jurisdiction & Format' : step === 2 ? 'Candidate & Position' : step === 3 ? 'Compensation & Benefits' : 'Custom Clauses & Review'}
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-sky-100 text-sky-800 rounded-full">
              Engine Ready
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 mt-6">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all ${
                  step >= s ? 'bg-sky-600' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Wizard Form Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          {/* STEP 1: Jurisdiction & Document Type */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">
                  Select Target Governing Jurisdiction
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {jurisdictions.map((j) => {
                    const isSelected = formData.jurisdictionCode === j.code;
                    return (
                      <div
                        key={j.code}
                        onClick={() => handleJurisdictionChange(j.code)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-sky-600 bg-sky-50/50'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-sm text-slate-900">{j.name}</span>
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-100 font-mono text-slate-700">
                            {j.code}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">Version: {j.currentVersion} • Currency: {j.standardCurrency}</p>
                        <p className="text-xs text-slate-600 font-medium mt-2">
                          Non-Compete: <span className="text-rose-600">{j.nonCompeteEnforceability}</span>
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">
                  Document Type to Generate
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'FULL_COMPLIANCE_BUNDLE', title: 'Full Agreement Bundle', desc: 'Complete contract with statutory clauses' },
                    { id: 'OFFER_LETTER', title: 'Formal Offer Letter', desc: 'Standardized appointment offer' },
                    { id: 'EMPLOYMENT_AGREEMENT', title: 'Standard Agreement', desc: 'Individual employment covenant' },
                  ].map((type) => (
                    <div
                      key={type.id}
                      onClick={() => setFormData({ ...formData, documentType: type.id as any })}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        formData.documentType === type.id
                          ? 'border-sky-600 bg-sky-50/50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <h4 className="font-semibold text-xs text-slate-900">{type.title}</h4>
                      <p className="text-xs text-slate-500 mt-1">{type.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {selectedJurisdictionInfo?.nonCompeteEnforceability === 'VOID_AND_UNENFORCEABLE' && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start space-x-3 text-xs text-amber-800">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Notice:</span> In {selectedJurisdictionInfo.name}, non-compete covenants are prohibited by statute. The engine will automatically enforce mandatory compliance wording.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Candidate & Role Context */}
          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
                Candidate Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.candidate.fullName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        candidate: { ...formData.candidate, fullName: e.target.value },
                      })
                    }
                    placeholder="e.g. Alexander Morgan"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.candidate.email}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        candidate: { ...formData.candidate, email: e.target.value },
                      })
                    }
                    placeholder="alex@example.com"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Residential Address</label>
                  <input
                    type="text"
                    value={formData.candidate.residentialAddress.street}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        candidate: {
                          ...formData.candidate,
                          residentialAddress: {
                            ...formData.candidate.residentialAddress,
                            street: e.target.value,
                          },
                        },
                      })
                    }
                    placeholder="Street Address, City, State/Province, Country"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>
              </div>

              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider pt-4 pb-2 border-b border-slate-100">
                Position & Appointment
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Job Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.roleDetails.jobTitle}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        roleDetails: { ...formData.roleDetails, jobTitle: e.target.value },
                      })
                    }
                    placeholder="e.g. Senior Software Architect"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={formData.roleDetails.department}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        roleDetails: { ...formData.roleDetails, department: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Work Arrangement</label>
                  <select
                    value={formData.roleDetails.workArrangement}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        roleDetails: { ...formData.roleDetails, workArrangement: e.target.value as any },
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  >
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="On-Site">On-Site</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.roleDetails.startDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        roleDetails: { ...formData.roleDetails, startDate: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Compensation & Benefits */}
          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
                Remuneration & Pay Schedule
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Base Salary Amount *</label>
                  <input
                    type="number"
                    value={formData.compensation.baseSalary}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        compensation: { ...formData.compensation, baseSalary: Number(e.target.value) },
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Currency</label>
                  <input
                    type="text"
                    value={formData.compensation.currency}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        compensation: { ...formData.compensation, currency: e.target.value.toUpperCase() },
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pay Frequency</label>
                  <select
                    value={formData.compensation.payFrequency}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        compensation: { ...formData.compensation, payFrequency: e.target.value as any },
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  >
                    <option value="Annual">Annual</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Bi-Weekly">Bi-Weekly</option>
                    <option value="Semi-Monthly">Semi-Monthly</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Bonus Incentive Structure</label>
                <textarea
                  rows={2}
                  value={formData.compensation.bonusStructure}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      compensation: { ...formData.compensation, bonusStructure: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Equity & Stock Options Terms</label>
                <textarea
                  rows={2}
                  value={formData.compensation.equityGrantDetails}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      compensation: { ...formData.compensation, equityGrantDetails: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Benefits Package Summary</label>
                <textarea
                  rows={2}
                  value={formData.compensation.benefitsSummary}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      compensation: { ...formData.compensation, benefitsSummary: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>
            </div>
          )}

          {/* STEP 4: Custom Clauses & Final Review */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="text-sm font-bold text-slate-900 mb-2">Generation Summary</h4>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <div>Candidate: <span className="font-semibold text-slate-800">{formData.candidate.fullName || 'Not entered'}</span></div>
                  <div>Jurisdiction: <span className="font-semibold text-slate-800">{formData.jurisdictionCode}</span></div>
                  <div>Job Title: <span className="font-semibold text-slate-800">{formData.roleDetails.jobTitle || 'Not entered'}</span></div>
                  <div>Compensation: <span className="font-semibold text-slate-800">{formData.compensation.currency} {Number(formData.compensation.baseSalary).toLocaleString()}</span></div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-2">Add Company-Specific Custom Clauses</h4>
                <p className="text-xs text-slate-500 mb-4">
                  Add custom company provisions (e.g. equipment return, wellness stipends). Mandatory statutory labor rules will not be overridden.
                </p>

                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <input
                    type="text"
                    placeholder="Clause Title (e.g., Home Office Equipment Allowance)"
                    value={newClause.title}
                    onChange={(e) => setNewClause({ ...newClause, title: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  />
                  <textarea
                    rows={2}
                    placeholder="Clause Text..."
                    value={newClause.content}
                    onChange={(e) => setNewClause({ ...newClause, content: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  />
                  <button
                    type="button"
                    onClick={addCustomClause}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-sky-700 bg-sky-100 hover:bg-sky-200 rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Custom Clause
                  </button>
                </div>

                {formData.customClauses.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {formData.customClauses.map((c, i) => (
                      <div key={i} className="flex items-start justify-between p-3 bg-white border border-slate-200 rounded-lg text-xs">
                        <div>
                          <div className="font-semibold text-slate-800">{c.title}</div>
                          <div className="text-slate-500 mt-1">{c.content}</div>
                        </div>
                        <button
                          onClick={() => removeCustomClause(i)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="mt-8 pt-5 border-t border-slate-100 flex justify-between items-center">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="inline-flex items-center px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </button>
            ) : <div />}

            {step < 4 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="inline-flex items-center px-5 py-2.5 rounded-lg text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700"
              >
                Continue <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmit}
                className="inline-flex items-center px-6 py-2.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/20 disabled:opacity-50"
              >
                {submitting ? 'Localizing & Compiling...' : 'Generate & Localize Contract'}
                {!submitting && <Check className="w-4 h-4 ml-1.5" />}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
