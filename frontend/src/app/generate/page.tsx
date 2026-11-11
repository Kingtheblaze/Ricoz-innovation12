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
  ChevronLeft,
  Eye,
  CheckCircle2,
  Calendar,
  MapPin,
  Scale
} from 'lucide-react';

export default function GenerateContractPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [jurisdictions, setJurisdictions] = useState<Jurisdiction[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showLivePreview, setShowLivePreview] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    jurisdictionCode: 'US-CA',
    documentType: 'FULL_COMPLIANCE_BUNDLE' as 'OFFER_LETTER' | 'EMPLOYMENT_AGREEMENT' | 'FULL_COMPLIANCE_BUNDLE',
    candidate: {
      fullName: 'Alex Vance',
      email: 'alex.vance@example.com',
      phone: '+1 (555) 234-5678',
      residentialAddress: {
        street: '742 Evergreen Terrace',
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94107',
        country: 'United States',
      },
    },
    roleDetails: {
      jobTitle: 'Senior Full Stack Engineer',
      department: 'Product Engineering',
      reportingTo: 'VP of Engineering',
      employmentType: 'Full-Time' as const,
      workArrangement: 'Remote' as const,
      workLocation: 'Remote / Home Office',
      startDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    },
    compensation: {
      baseSalary: 145000,
      currency: 'USD',
      payFrequency: 'Annual' as const,
      equityGrantDetails: '0.15% Incentive Stock Options with 4-year monthly vesting and 1-year cliff.',
      bonusStructure: 'Annual performance target bonus up to 15% of annual base compensation.',
      benefitsSummary: 'Comprehensive health, dental, vision insurance, and 401(k) retirement matching.',
    },
    customClauses: [] as Array<{ title: string; content: string; category?: string }>,
  });

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
      toast.error('Please enter both clause title and body text');
      return;
    }
    setFormData({
      ...formData,
      customClauses: [...formData.customClauses, { ...newClause, category: 'Company Specific' }],
    });
    setNewClause({ title: '', content: '' });
    toast.success('Custom clause added');
  };

  const removeCustomClause = (idx: number) => {
    setFormData({
      ...formData,
      customClauses: formData.customClauses.filter((_, i) => i !== idx),
    });
  };

  const handleSubmit = async () => {
    if (!formData.candidate.fullName || !formData.candidate.email || !formData.roleDetails.jobTitle) {
      toast.error('Please complete mandatory candidate and role fields');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/documents/generate', formData);
      if (res.data?.success) {
        toast.success('Contract generated and localized successfully!');
        router.push(`/documents/${res.data.data._id}`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to generate contract');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedJur = jurisdictions.find((j) => j.code === formData.jurisdictionCode);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Contract Localization Wizard</h1>
            <p className="text-sm text-slate-500 mt-1">
              Step {step} of 4: {step === 1 ? 'Jurisdiction & Format' : step === 2 ? 'Candidate & Position' : step === 3 ? 'Compensation & Benefits' : 'Custom Clauses & Legal Review'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowLivePreview(!showLivePreview)}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-sm"
            >
              <Eye className="w-3.5 h-3.5 text-sky-600" />
              {showLivePreview ? 'Hide Split Preview' : 'Show Live Preview'}
            </button>
            <span className="text-xs font-semibold px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Statutory Matrix Active
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="grid grid-cols-4 gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all ${
                step >= s ? 'bg-sky-600' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>

        {/* Main Content Grid: Left Form, Right Live Preview */}
        <div className={`grid grid-cols-1 ${showLivePreview ? 'lg:grid-cols-12' : ''} gap-8`}>
          {/* Form Container */}
          <div className={showLivePreview ? 'lg:col-span-7' : 'max-w-3xl mx-auto w-full'}>
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-8">
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
                            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                              isSelected
                                ? 'border-sky-600 bg-sky-50/50 shadow-sm'
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
                            <div className="mt-2 text-[11px] font-semibold text-slate-600">
                              Non-Compete: <span className="text-rose-600 font-bold">{j.nonCompeteEnforceability}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-900 mb-2">
                      Document Package Type
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { id: 'FULL_COMPLIANCE_BUNDLE', title: 'Full Agreement Bundle', desc: 'Complete contract with statutory rider' },
                        { id: 'OFFER_LETTER', title: 'Formal Offer Letter', desc: 'Summary appointment letter' },
                        { id: 'EMPLOYMENT_AGREEMENT', title: 'Standard Agreement', desc: 'Formal employment covenant' },
                      ].map((type) => (
                        <div
                          key={type.id}
                          onClick={() => setFormData({ ...formData, documentType: type.id as any })}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                            formData.documentType === type.id
                              ? 'border-sky-600 bg-sky-50/50 shadow-sm'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <h4 className="font-semibold text-xs text-slate-900">{type.title}</h4>
                          <p className="text-[11px] text-slate-500 mt-1">{type.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedJur && (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start space-x-3 text-xs text-slate-700">
                      <Scale className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-900">Statutory Notice:</span> {selectedJur.governingLawDescription}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: Candidate & Role */}
              {step === 2 && (
                <div className="space-y-6">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Candidate Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name *</label>
                      <input
                        type="text"
                        value={formData.candidate.fullName}
                        onChange={(e) => setFormData({ ...formData, candidate: { ...formData.candidate, fullName: e.target.value } })}
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                      <input
                        type="email"
                        value={formData.candidate.email}
                        onChange={(e) => setFormData({ ...formData, candidate: { ...formData.candidate, email: e.target.value } })}
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">City & State/Province</label>
                      <input
                        type="text"
                        value={`${formData.candidate.residentialAddress.city}, ${formData.candidate.residentialAddress.state}`}
                        onChange={(e) => {
                          const parts = e.target.value.split(',');
                          setFormData({
                            ...formData,
                            candidate: {
                              ...formData.candidate,
                              residentialAddress: {
                                ...formData.candidate.residentialAddress,
                                city: parts[0]?.trim() || '',
                                state: parts[1]?.trim() || '',
                              },
                            },
                          });
                        }}
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Country</label>
                      <input
                        type="text"
                        value={formData.candidate.residentialAddress.country}
                        onChange={(e) => setFormData({
                          ...formData,
                          candidate: {
                            ...formData.candidate,
                            residentialAddress: { ...formData.candidate.residentialAddress, country: e.target.value }
                          }
                        })}
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>

                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 pt-4 border-t border-slate-100">Role & Position</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Job Title *</label>
                      <input
                        type="text"
                        value={formData.roleDetails.jobTitle}
                        onChange={(e) => setFormData({ ...formData, roleDetails: { ...formData.roleDetails, jobTitle: e.target.value } })}
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                      <input
                        type="text"
                        value={formData.roleDetails.department}
                        onChange={(e) => setFormData({ ...formData, roleDetails: { ...formData.roleDetails, department: e.target.value } })}
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Work Arrangement</label>
                      <select
                        value={formData.roleDetails.workArrangement}
                        onChange={(e) => setFormData({ ...formData, roleDetails: { ...formData.roleDetails, workArrangement: e.target.value as any } })}
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 bg-white"
                      >
                        <option value="Remote">Remote</option>
                        <option value="Hybrid">Hybrid</option>
                        <option value="On-Site">On-Site</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Target Start Date</label>
                      <input
                        type="date"
                        value={formData.roleDetails.startDate}
                        onChange={(e) => setFormData({ ...formData, roleDetails: { ...formData.roleDetails, startDate: e.target.value } })}
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Compensation & Benefits */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Annual Base Compensation *</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-mono font-bold">
                          {formData.compensation.currency === 'USD' ? '$' : formData.compensation.currency === 'GBP' ? '£' : '€'}
                        </span>
                        <input
                          type="number"
                          value={formData.compensation.baseSalary}
                          onChange={(e) => setFormData({ ...formData, compensation: { ...formData.compensation, baseSalary: Number(e.target.value) } })}
                          className="w-full pl-8 pr-3 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 font-semibold"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Currency</label>
                      <input
                        type="text"
                        value={formData.compensation.currency}
                        readOnly
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-200 bg-slate-100 rounded-xl font-mono text-slate-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Equity & Stock Options</label>
                    <textarea
                      rows={2}
                      value={formData.compensation.equityGrantDetails}
                      onChange={(e) => setFormData({ ...formData, compensation: { ...formData.compensation, equityGrantDetails: e.target.value } })}
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Bonus & Incentives</label>
                    <textarea
                      rows={2}
                      value={formData.compensation.bonusStructure}
                      onChange={(e) => setFormData({ ...formData, compensation: { ...formData.compensation, bonusStructure: e.target.value } })}
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Benefits & Allowances</label>
                    <textarea
                      rows={2}
                      value={formData.compensation.benefitsSummary}
                      onChange={(e) => setFormData({ ...formData, compensation: { ...formData.compensation, benefitsSummary: e.target.value } })}
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>
              )}

              {/* STEP 4: Custom Clauses & Final Review */}
              {step === 4 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">Add Custom Company Clauses</h3>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <input
                        type="text"
                        placeholder="Clause Title (e.g., Intellectual Property Pre-Existing Works)"
                        value={newClause.title}
                        onChange={(e) => setNewClause({ ...newClause, title: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white"
                      />
                      <textarea
                        rows={2}
                        placeholder="Clause Body Text..."
                        value={newClause.content}
                        onChange={(e) => setNewClause({ ...newClause, content: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white"
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
                          <div key={i} className="flex items-start justify-between p-3 bg-white border border-slate-200 rounded-xl text-xs">
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
                    className="inline-flex items-center px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back
                  </button>
                ) : <div />}

                {step < 4 ? (
                  <button
                    type="button"
                    onClick={() => setStep(step + 1)}
                    className="inline-flex items-center px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 shadow-md shadow-sky-500/20"
                  >
                    Continue <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleSubmit}
                    className="inline-flex items-center px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/20 disabled:opacity-50"
                  >
                    {submitting ? 'Localizing & Compiling...' : 'Generate & Localize Contract'}
                    {!submitting && <Check className="w-4 h-4 ml-1.5" />}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Live Interactive Contract Preview Pane */}
          {showLivePreview && (
            <div className="lg:col-span-5">
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sticky top-24">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-sky-600" />
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-800">
                      Live Document Preview
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-100">
                    {formData.jurisdictionCode}
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-xs text-slate-700 space-y-4 max-h-[600px] overflow-y-auto">
                  <div className="text-center pb-3 border-b border-slate-200">
                    <div className="font-extrabold text-sm text-slate-900 tracking-tight">
                      {formData.documentType === 'FULL_COMPLIANCE_BUNDLE' 
                        ? 'EMPLOYMENT AGREEMENT & STATUTORY COVENANT' 
                        : formData.documentType === 'OFFER_LETTER' 
                        ? 'FORMAL APPOINTMENT OFFER' 
                        : 'INDIVIDUAL EMPLOYMENT AGREEMENT'}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Governing Jurisdiction: <span className="font-bold text-slate-800">{selectedJur?.name || formData.jurisdictionCode}</span>
                    </div>
                  </div>

                  <div>
                    <span className="font-bold text-slate-900">Candidate:</span> {formData.candidate.fullName || '—'}<br />
                    <span className="font-bold text-slate-900">Position:</span> {formData.roleDetails.jobTitle || '—'}<br />
                    <span className="font-bold text-slate-900">Start Date:</span> {formData.roleDetails.startDate || '—'}<br />
                    <span className="font-bold text-slate-900">Base Salary:</span> {formData.compensation.currency} {Number(formData.compensation.baseSalary).toLocaleString()} ({formData.compensation.payFrequency})
                  </div>

                  {/* Statutory Clauses Live Injection Preview */}
                  <div className="pt-2 border-t border-slate-200 space-y-2">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Statutory Clauses Applied ({formData.jurisdictionCode}):
                    </div>

                    {formData.jurisdictionCode === 'US-CA' && (
                      <>
                        <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px]">
                          <span className="font-bold text-emerald-900">At-Will Employment:</span> California Labor Code § 2922 at-will presumption applied.
                        </div>
                        <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-[11px]">
                          <span className="font-bold text-rose-900">Non-Compete Ban:</span> Protected under SB 699 & AB 1076. Restrictive post-employment covenants void.
                        </div>
                        <div className="p-2.5 rounded-lg bg-sky-50 border border-sky-200 text-[11px]">
                          <span className="font-bold text-sky-900">IP Inventions:</span> Labor Code § 2870 statutory invention carve-out included.
                        </div>
                      </>
                    )}

                    {formData.jurisdictionCode === 'GB-UK' && (
                      <>
                        <div className="p-2.5 rounded-lg bg-indigo-50 border border-indigo-200 text-[11px]">
                          <span className="font-bold text-indigo-900">Written Particulars:</span> Section 1 Employment Rights Act 1996 compliant.
                        </div>
                        <div className="p-2.5 rounded-lg bg-sky-50 border border-sky-200 text-[11px]">
                          <span className="font-bold text-sky-900">Working Time:</span> WTR 1998 48-hour week opt-out election included.
                        </div>
                        <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px]">
                          <span className="font-bold text-emerald-900">Statutory Notice:</span> ERA 1996 progressive notice scale (1-12 weeks) enforced.
                        </div>
                      </>
                    )}

                    {formData.customClauses.map((clause, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px]">
                        <span className="font-bold text-amber-900">{clause.title}:</span> {clause.content}
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-slate-200 text-[10px] text-slate-400 italic">
                    * This preview renders real-time statutory rule adaptations. The complete signed document with audit hash is generated upon clicking Compile.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
