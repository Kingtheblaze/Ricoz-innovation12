import Link from 'next/link';
import { ShieldCheck, ArrowRight, FileCheck, Globe2, Sparkles, Scale, Lock } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white selection:bg-sky-500 selection:text-white">
      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/25">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            Juris<span className="text-sky-400">Flow</span>
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <Link
            href="/login"
            className="text-sm font-semibold text-slate-300 hover:text-white transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-md shadow-sky-500/20 transition-all"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-16 pb-24 text-center">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-800 border border-slate-700 mb-8">
          <Sparkles className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-semibold text-slate-300">
            Compliant with California SB 699, AB 1076 & UK ERA 1996
          </span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight">
          Multi-Jurisdiction <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400">Employment Contract</span> Localizer
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Generate bulletproof, legally compliant Offer Letters and Employment Agreements tailored automatically to California, United Kingdom, and global labor jurisdictions.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-semibold text-white bg-sky-600 hover:bg-sky-500 shadow-lg shadow-sky-500/30 flex items-center justify-center space-x-2 transition-all"
          >
            <span>Start Free Trial</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700 transition-all"
          >
            Tenant Login
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="bg-slate-800/60 backdrop-blur border border-slate-700/60 rounded-2xl p-6">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center mb-4">
              <Globe2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-2">Versioned Rule Matrices</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Maintains real-time statutory matrices for jurisdictions like California and the United Kingdom, updating required notice, paid sick leave, and wage transparency.
            </p>
          </div>

          <div className="bg-slate-800/60 backdrop-blur border border-slate-700/60 rounded-2xl p-6">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
              <Scale className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-2">Non-Compete Compliance</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Automatically voids unenforceable post-employment restrictive covenants in prohibited regions (e.g. CA Bus. & Prof. Code § 16600), mitigating severe civil penalties.
            </p>
          </div>

          <div className="bg-slate-800/60 backdrop-blur border border-slate-700/60 rounded-2xl p-6">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
              <FileCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-2">Dual PDF & Word Export</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Export pixel-perfect PDF contracts with automated statutory disclaimers or fully editable Microsoft Word DOCX files with complete audit logging.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
