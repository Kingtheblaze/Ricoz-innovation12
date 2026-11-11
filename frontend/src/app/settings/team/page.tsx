'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { 
  Users, 
  Key, 
  Webhook, 
  UserPlus, 
  ShieldCheck, 
  Copy, 
  Trash2, 
  Check, 
  AlertCircle,
  ExternalLink,
  Code2
} from 'lucide-react';
import { TeamMember, WebhookConfig } from '@/types';

export default function TeamAndApiSettingsPage() {
  const [activeTab, setActiveTab] = useState<'team' | 'api' | 'webhooks'>('team');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [apiKey, setApiKey] = useState<string>('jf_live_8f3a9b21c4e70815da6e3f');
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ fullName: '', email: '', role: 'HR' as const });
  const [newWebhookUrl, setNewWebhookUrl] = useState('');

  useEffect(() => {
    // Initial data load
    setTeamMembers([
      { id: '1', fullName: 'Sarah Connor', email: 'sarah@acmecorp.com', role: 'Admin', createdAt: '2026-10-01' },
      { id: '2', fullName: 'David Miller', email: 'david@acmecorp.com', role: 'HR', createdAt: '2026-10-15' },
      { id: '3', fullName: 'Elena Rostova', email: 'elena@acmecorp.com', role: 'Viewer', createdAt: '2026-11-01' },
    ]);

    setWebhooks([
      { _id: 'wh_1', url: 'https://api.acmecorp.com/webhooks/contracts', events: ['document.signed', 'document.sent'], secretKey: 'whsec_994821a7c', isActive: true },
    ]);
  }, []);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.email || !inviteForm.fullName) {
      toast.error('Please enter name and email');
      return;
    }
    const newMember: TeamMember = {
      id: String(Date.now()),
      fullName: inviteForm.fullName,
      email: inviteForm.email,
      role: inviteForm.role,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setTeamMembers([...teamMembers, newMember]);
    setInviteModalOpen(false);
    setInviteForm({ fullName: '', email: '', role: 'HR' });
    toast.success(`Invitation email sent to ${inviteForm.email}!`);
  };

  const addWebhook = () => {
    if (!newWebhookUrl) {
      toast.error('Please enter an HTTPS endpoint');
      return;
    }
    const newWh: WebhookConfig = {
      _id: `wh_${Date.now()}`,
      url: newWebhookUrl,
      events: ['document.created', 'document.signed'],
      secretKey: `whsec_${Math.random().toString(36).substring(2, 11)}`,
      isActive: true,
    };
    setWebhooks([...webhooks, newWh]);
    setNewWebhookUrl('');
    toast.success('Webhook endpoint registered!');
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 text-white shadow-xl mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight">Organization & Developer Settings</h1>
          <p className="mt-2 text-slate-300 text-sm max-w-2xl">
            Manage your hiring team RBAC permissions, issue enterprise REST API keys for ATS integrations, and configure webhook listeners for contract lifecycles.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 mb-8 space-x-6">
          <button
            onClick={() => setActiveTab('team')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'team'
                ? 'border-sky-600 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" /> Team Members & Roles
          </button>
          <button
            onClick={() => setActiveTab('api')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'api'
                ? 'border-sky-600 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Key className="w-4 h-4" /> REST API Keys
          </button>
          <button
            onClick={() => setActiveTab('webhooks')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'webhooks'
                ? 'border-sky-600 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Webhook className="w-4 h-4" /> Event Webhooks
          </button>
        </div>

        {/* Tab 1: Team Members */}
        {activeTab === 'team' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Active Coworkers</h2>
                <p className="text-xs text-slate-500">Colleagues with authorization to generate or inspect localized contracts.</p>
              </div>
              <button
                onClick={() => setInviteModalOpen(true)}
                className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 shadow-md shadow-sky-500/20"
              >
                <UserPlus className="w-4 h-4 mr-1.5" /> Invite Team Member
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="pb-3">Name</th>
                    <th className="pb-3">Email Address</th>
                    <th className="pb-3">Assigned Role</th>
                    <th className="pb-3">Added Date</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teamMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-50/50">
                      <td className="py-3 font-semibold text-slate-900">{member.fullName}</td>
                      <td className="py-3 text-slate-600 font-mono">{member.email}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          member.role === 'Admin'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : member.role === 'HR'
                            ? 'bg-sky-50 text-sky-700 border border-sky-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {member.role}
                        </span>
                      </td>
                      <td className="py-3 text-slate-400">{member.createdAt}</td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => {
                            setTeamMembers(teamMembers.filter((m) => m.id !== member.id));
                            toast.success('Member removed');
                          }}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: REST API Keys */}
        {activeTab === 'api' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Production REST API Key</h2>
              <p className="text-xs text-slate-500">
                Authenticate programmatically to generate contracts from your ATS (Greenhouse, Lever, Workday) or internal HRIS.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
              <div className="font-mono text-xs font-semibold text-slate-800 truncate">
                {apiKey}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(apiKey);
                    toast.success('API Key copied to clipboard!');
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy Key
                </button>
                <button
                  onClick={() => {
                    const fresh = `jf_live_${Math.random().toString(36).substring(2, 15)}`;
                    setApiKey(fresh);
                    toast.success('New API key rolled!');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-xs font-semibold text-slate-800"
                >
                  Roll Key
                </button>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 text-slate-200 text-xs font-mono space-y-2">
              <div className="text-slate-400 font-sans font-bold flex items-center gap-2">
                <Code2 className="w-4 h-4 text-sky-400" /> Example cURL Request:
              </div>
              <pre className="overflow-x-auto text-sky-300">
{`curl -X POST https://api.jurisflow.com/api/documents/generate \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "jurisdictionCode": "US-CA",
    "documentType": "FULL_COMPLIANCE_BUNDLE",
    "candidate": { "fullName": "Jane Doe", "email": "jane@example.com" },
    "roleDetails": { "jobTitle": "Lead Architect", "startDate": "2026-12-01" },
    "compensation": { "baseSalary": 180000, "currency": "USD" }
  }'`}
              </pre>
            </div>
          </div>
        )}

        {/* Tab 3: Webhooks */}
        {activeTab === 'webhooks' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Event Webhooks</h2>
                <p className="text-xs text-slate-500">Receive HTTP POST payloads when contracts are signed or downloaded.</p>
              </div>
            </div>

            {/* Add webhook input */}
            <div className="flex gap-3">
              <input
                type="url"
                placeholder="https://your-domain.com/api/webhooks/contracts"
                value={newWebhookUrl}
                onChange={(e) => setNewWebhookUrl(e.target.value)}
                className="flex-1 text-xs border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-sky-500"
              />
              <button
                onClick={addWebhook}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-500/20"
              >
                Add Endpoint
              </button>
            </div>

            <div className="space-y-3">
              {webhooks.map((wh) => (
                <div key={wh._id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-bold text-slate-800">{wh.url}</span>
                    <div className="flex gap-2 mt-1">
                      {wh.events.map((ev) => (
                        <span key={ev} className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
                          {ev}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setWebhooks(webhooks.filter((w) => w._id !== wh._id));
                      toast.success('Webhook removed');
                    }}
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal: Invite Team Member */}
        {inviteModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 mb-1">Invite New Colleague</h3>
              <p className="text-xs text-slate-500 mb-4">Grant access to configure and draft localized employment contracts.</p>

              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={inviteForm.fullName}
                    onChange={(e) => setInviteForm({ ...inviteForm, fullName: e.target.value })}
                    className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Role & Authorization</label>
                  <select
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as any })}
                    className="w-full text-xs p-3 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="Admin">Admin (Full settings & rule changes)</option>
                    <option value="HR">HR Manager (Generate & export contracts)</option>
                    <option value="Viewer">Viewer (Read-only review)</option>
                  </select>
                </div>

                <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setInviteModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-sky-500/20"
                  >
                    Send Invitation
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
