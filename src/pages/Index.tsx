import React from 'react';
import { Link } from 'react-router-dom';
import GovLayout, { GovCard } from '@/components/GovLayout';
import {
  ShieldCheck,
  QrCode,
  FileText,
  Lock,
  CheckCircle,
  ArrowRight,
  ScanLine,
  IdCard,
  HelpCircle,
} from 'lucide-react';

const services = [
  {
    icon: IdCard,
    title: 'Digital Identity Card',
    description:
      'Generate a unified digital identity card that aggregates your essential government IDs.',
    to: '/dashboard',
  },
  {
    icon: FileText,
    title: 'Document Vault',
    description:
      'Securely upload and store Aadhaar, PAN, Driving License, Passport, and other certificates.',
    to: '/dashboard',
  },
  {
    icon: QrCode,
    title: 'Emergency QR Access',
    description:
      'Share documents during emergencies through a PIN-protected, time-limited QR code.',
    to: '/scan',
  },
  {
    icon: ShieldCheck,
    title: 'Verified Records',
    description:
      'AI-assisted verification keeps your records up to date with status indicators.',
    to: '/features',
  },
];

const announcements = [
  {
    date: '23 Apr 2026',
    text: 'New: Secure document viewer with anti-screenshot protection now live.',
  },
  {
    date: '15 Apr 2026',
    text: 'Premium plan introduced with full AI assistant and emergency QR sharing.',
  },
  {
    date: '02 Apr 2026',
    text: 'Two-factor login via OTP is now available for all citizens.',
  },
];

export default function Index() {
  return (
    <GovLayout>
      {/* Hero */}
      <section className="bg-white border-b border-slate-200">
        <div className="container mx-auto max-w-7xl px-4 py-10 sm:py-14 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-xs font-semibold text-[#0B3D91] tracking-[0.2em] uppercase">
              Citizen Portal
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0B3D91] mt-2 leading-tight">
              Secure Digital Identity &amp;<br />
              Document Access Platform
            </h1>
            <p className="text-slate-700 mt-4 max-w-xl leading-relaxed">
              Virtual Setu is a government-style document management portal that
              lets every citizen store, verify and share essential documents
              securely from a single account.
            </p>
            <div className="flex flex-wrap gap-3 mt-6">
              <Link
                to="/scan"
                className="inline-flex items-center gap-2 bg-[#0B3D91] text-white px-5 py-2.5 rounded font-medium hover:bg-[#082c6c]"
              >
                <ScanLine className="h-4 w-4" /> Access Documents
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 border border-[#0B3D91] text-[#0B3D91] px-5 py-2.5 rounded font-medium hover:bg-blue-50"
              >
                Create Account <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-700">
              {[
                '256-bit encrypted document storage',
                'PIN-protected emergency sharing',
                'AI-assisted document verification',
                'WCAG 2.1 AA accessible portal',
              ].map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-[#138808] mt-0.5 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>

          <GovCard className="p-6">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="p-2 rounded bg-blue-50 text-[#0B3D91]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Quick Citizen Services
                </p>
                <p className="text-xs text-slate-500">Choose a service to begin</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              {[
                { icon: ScanLine, label: 'Verify via QR', to: '/scan' },
                { icon: IdCard, label: 'Citizen Login', to: '/auth' },
                { icon: FileText, label: 'My Dashboard', to: '/dashboard' },
                { icon: HelpCircle, label: 'Help &amp; Support', to: '/help' },
              ].map(({ icon: Icon, label, to }) => (
                <Link
                  key={label}
                  to={to}
                  className="flex items-center gap-3 p-3 border border-slate-200 rounded hover:border-[#0B3D91] hover:bg-blue-50/50 transition"
                >
                  <Icon className="h-5 w-5 text-[#0B3D91]" />
                  <span
                    className="text-sm font-medium text-slate-700"
                    dangerouslySetInnerHTML={{ __html: label }}
                  />
                </Link>
              ))}
            </div>
            <div className="mt-4 p-3 rounded bg-slate-50 border border-slate-200 flex items-start gap-2">
              <Lock className="h-4 w-4 text-[#0B3D91] mt-0.5" />
              <p className="text-xs text-slate-600">
                All actions are PIN-verified and encrypted. We never share your
                personal data with third parties.
              </p>
            </div>
          </GovCard>
        </div>
      </section>

      {/* Services */}
      <section className="container mx-auto max-w-7xl px-4 py-10">
        <div className="flex items-end justify-between flex-wrap gap-2 mb-5">
          <div>
            <p className="text-xs font-semibold text-[#0B3D91] tracking-[0.2em] uppercase">
              Services
            </p>
            <h2 className="text-2xl font-bold text-slate-900">
              What you can do on Virtual Setu
            </h2>
          </div>
          <Link
            to="/features"
            className="text-sm text-[#0B3D91] hover:underline"
          >
            View all features →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {services.map((s) => (
            <Link key={s.title} to={s.to}>
              <GovCard className="p-5 h-full hover:border-[#0B3D91] transition">
                <div className="p-2 rounded bg-blue-50 text-[#0B3D91] w-fit mb-3">
                  <s.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-slate-900">{s.title}</h3>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                  {s.description}
                </p>
              </GovCard>
            </Link>
          ))}
        </div>
      </section>

      {/* Announcements + Steps */}
      <section className="container mx-auto max-w-7xl px-4 pb-12 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GovCard className="lg:col-span-2">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60">
            <h3 className="font-semibold text-slate-900">How it works</h3>
            <p className="text-xs text-slate-500">
              Three simple steps to manage your documents securely.
            </p>
          </div>
          <ol className="divide-y divide-slate-100">
            {[
              {
                n: 1,
                t: 'Register with your mobile / email',
                d: 'Verify your identity using OTP and set a 4-digit access PIN.',
              },
              {
                n: 2,
                t: 'Upload your documents',
                d: 'Add Aadhaar, PAN, Passport and other government IDs to your secure vault.',
              },
              {
                n: 3,
                t: 'Access anywhere with your QR card',
                d: 'Use your Digital ID Card QR for verified, view-only emergency access.',
              },
            ].map((s) => (
              <li key={s.n} className="flex gap-4 px-5 py-4">
                <div className="w-8 h-8 rounded-full bg-[#0B3D91] text-white text-sm font-semibold flex items-center justify-center shrink-0">
                  {s.n}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{s.t}</p>
                  <p className="text-sm text-slate-600">{s.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </GovCard>

        <GovCard>
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60">
            <h3 className="font-semibold text-slate-900">Announcements</h3>
            <p className="text-xs text-slate-500">Latest updates from Virtual Setu</p>
          </div>
          <ul className="divide-y divide-slate-100">
            {announcements.map((a, i) => (
              <li key={i} className="px-5 py-3">
                <p className="text-[11px] text-slate-500">{a.date}</p>
                <p className="text-sm text-slate-800">{a.text}</p>
              </li>
            ))}
          </ul>
        </GovCard>
      </section>
    </GovLayout>
  );
}
