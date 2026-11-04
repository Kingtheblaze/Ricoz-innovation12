'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import { GeneratedDocument } from '@/types';
import { 
  FileText, 
  Download, 
  Plus, 
  Clock, 
  ShieldCheck, 
  ExternalLink, 
  Search, 
  Calendar, 
  Building,
  CheckCircle2,
  FileCheck2
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchDocuments = async () => {
    try {
      const res = await api.get('/documents');
      if (res.data?.success) {
        setDocuments(res.data.data);
      }
    } catch (err: any) {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleDownload = async (docId: string, format: 'pdf' | 'docx', candidateName: string) => {
    try {
      toast.loading(`Preparing ${format.toUpperCase()} export...`, { id: 'download' });
      const res = await api.get(`/documents/${docId}/${format}`, {
        responseType: 'blob',
      });

      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Contract_${candidateName.replace(/\s+/g, '_')}.${format}`);
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(`${format.toUpperCase()} downloaded successfully!`, { id: 'download' });
    } catch (err) {
      toast.error(`Download failed`, { id: 'download' });
    }
  };

  const filteredDocs = documents.filter((doc) =>
    doc.candidate.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.roleDetails.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.jurisdictionSnapshot.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Action Bar */}
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold leading-7 text-slate-900 sm:text-3xl sm:truncate">
              Compliance Document Repository
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Generated Offer Letters & Employment Agreements with full statutory audit trails
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
            <Link
              href="/generate"
              className="inline-flex items-center px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Generate Localized Contract
            </Link>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
          <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-slate-200 p-5 flex items-center space-x-4">
            <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Documents</p>
              <p className="text-2xl font-bold text-slate-900">{documents.length}</p>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-slate-200 p-5 flex items-center space-x-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Jurisdiction Coverage</p>
              <p className="text-2xl font-bold text-slate-900">California & United Kingdom</p>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-slate-200 p-5 flex items-center space-x-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Compliance Status</p>
              <p className="text-2xl font-bold text-emerald-600">100% Up to Date</p>
            </div>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
          <div className="relative rounded-lg shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="h-5 w-5" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by candidate name, role, or jurisdiction..."
              className="block w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            />
          </div>
        </div>

        {/* Document List Table */}
        <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto mb-3"></div>
              Loading compliance documents...
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800">No documents found</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                {searchTerm ? 'No results matched your search criteria.' : 'Get started by creating your first localized employment agreement or offer letter.'}
              </p>
              {!searchTerm && (
                <Link
                  href="/generate"
                  className="mt-5 inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700"
                >
                  <Plus className="w-4 h-4 mr-1.5" /> Generate First Contract
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Candidate & Role
                    </th>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Jurisdiction
                    </th>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Version & Law
                    </th>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Generated On
                    </th>
                    <th scope="col" className="px-6 py-3.5 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {filteredDocs.map((doc) => (
                    <tr key={doc._id} className="hover:bg-slate-50/75 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-9 h-9 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-sm">
                            {doc.candidate.fullName.charAt(0)}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-semibold text-slate-900">{doc.candidate.fullName}</div>
                            <div className="text-xs text-slate-500">{doc.roleDetails.jobTitle} • {doc.compensation.currency} {Number(doc.compensation.baseSalary).toLocaleString()}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-800">
                          {doc.jurisdictionSnapshot.code}
                        </span>
                        <div className="text-xs text-slate-500 mt-0.5">{doc.jurisdictionSnapshot.name}</div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs font-medium text-slate-800">v{doc.jurisdictionSnapshot.versionUsed}</div>
                        <div className="text-xs text-slate-400 max-w-xs truncate">{doc.jurisdictionSnapshot.governingLaw}</div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                        {new Date(doc.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <Link
                          href={`/documents/${doc._id}`}
                          className="inline-flex items-center px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          View
                        </Link>

                        <button
                          onClick={() => handleDownload(doc._id, 'pdf', doc.candidate.fullName)}
                          className="inline-flex items-center px-2.5 py-1.5 border border-transparent rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5 mr-1" />
                          PDF
                        </button>

                        <button
                          onClick={() => handleDownload(doc._id, 'docx', doc.candidate.fullName)}
                          className="inline-flex items-center px-2.5 py-1.5 border border-transparent rounded-lg text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5 mr-1" />
                          DOCX
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
