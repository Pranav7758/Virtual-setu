import React from 'react';
import { Link } from 'react-router-dom';
import { Navigation } from '@/components/ui/navigation';
import { Footer } from '@/components/ui/footer';
import { Button } from '@/components/ui/button';
import {
  Shield, Upload, CheckSquare, CreditCard, QrCode, Zap,
  Lock, FileText, Bell, Smartphone, Cloud, Users, ArrowRight
} from 'lucide-react';

const coreFeatures = [
  {
    icon: Shield,
    title: 'Secure Authentication',
    description: 'Multi-layer security with 4-digit PIN protection, encrypted storage, and support for OTP-based passwordless login.',
    gradient: 'bg-gradient-primary',
  },
  {
    icon: Upload,
    title: 'Smart Document Upload',
    description: 'AI-powered document type recognition automatically categorises Aadhaar, PAN, Passport, and more as you upload.',
    gradient: 'bg-gradient-secondary',
  },
  {
    icon: CheckSquare,
    title: 'Dynamic Checklists',
    description: 'Personalised document requirement checklists tailored to your life events — visa, job, education, banking, and more.',
    gradient: 'bg-gradient-hero',
  },
  {
    icon: CreditCard,
    title: 'Virtual Smart Card',
    description: 'A beautiful digital identity card that aggregates all your essential government IDs in one place.',
    gradient: 'bg-gradient-primary',
  },
  {
    icon: QrCode,
    title: 'Emergency QR Access',
    description: 'Generate a secure QR code so trusted contacts can access your documents instantly during emergencies.',
    gradient: 'bg-gradient-secondary',
  },
  {
    icon: Zap,
    title: 'Instant Verification',
    description: 'Real-time document status tracking with verification indicators to show which documents are active and valid.',
    gradient: 'bg-gradient-hero',
  },
];

const advancedFeatures = [
  { icon: Lock, title: 'End-to-End Encryption', description: '256-bit AES encryption ensures only you can access your data.' },
  { icon: FileText, title: 'Multi-format Support', description: 'Upload PDFs, JPGs, PNGs and more — all stored securely.' },
  { icon: Bell, title: 'Expiry Reminders', description: 'Never miss a document renewal with automated alerts.' },
  { icon: Smartphone, title: 'Mobile-First Design', description: 'Fully responsive — use Virtual Setu on any device seamlessly.' },
  { icon: Cloud, title: 'Cloud Sync', description: 'Documents sync instantly across all your devices in real time.' },
  { icon: Users, title: 'Family Profiles', description: 'Manage documents for your entire family under one account (Platinum).' },
];

const stats = [
  { value: '99.9%', label: 'Uptime Guarantee', color: 'text-primary' },
  { value: '256-bit', label: 'AES Encryption', color: 'text-secondary' },
  { value: '5+', label: 'Document Types', color: 'text-accent' },
  { value: '24/7', label: 'Secure Access', color: 'text-primary' },
];

export default function Features() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 bg-mesh text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
            <Zap className="h-4 w-4 mr-2" /> Everything you need, in one place
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold">
            <span className="text-gradient">Powerful Features</span><br />
            Built for India
          </h1>
          <p className="text-lg text-foreground/70 max-w-xl mx-auto">
            Virtual Setu gives you a complete digital identity vault — secure, smart, and always accessible.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-gradient-primary glow-primary hover:scale-105 transition-transform">
              <Link to="/register">Get Started Free <ArrowRight className="h-4 w-4 ml-2" /></Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-border/30">
              <Link to="/pricing">View Plans</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 border-y border-border/20">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          {stats.map(s => (
            <div key={s.label}>
              <div className={`text-3xl font-bold ${s.color} mb-1`}>{s.value}</div>
              <div className="text-sm text-foreground/60">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Core Features Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3"><span className="text-gradient">Core Features</span></h2>
            <p className="text-foreground/70 max-w-xl mx-auto">The essentials that make Virtual Setu the most trusted digital ID platform in India.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {coreFeatures.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div key={i} className="card-3d p-8 group hover:scale-[1.03] transition-all duration-300 relative overflow-hidden">
                  <div className={`p-4 ${feature.gradient} rounded-2xl mb-5 w-fit group-hover:scale-110 transition-transform glow-primary`}>
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-card-foreground mb-2">{feature.title}</h3>
                  <p className="text-foreground/70 text-sm leading-relaxed">{feature.description}</p>
                  <div className="absolute inset-0 bg-gradient-primary/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Advanced Features */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-card-glass/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3"><span className="text-gradient">And Much More</span></h2>
            <p className="text-foreground/70">Built-in tools that make managing your documents effortless.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {advancedFeatures.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="flex items-start gap-4 p-5 card-3d">
                  <div className="p-2 bg-primary/10 rounded-xl shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">{f.title}</h4>
                    <p className="text-foreground/60 text-xs leading-relaxed">{f.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-2xl mx-auto card-3d p-10 space-y-6">
          <h2 className="text-3xl font-bold"><span className="text-gradient">Ready to get started?</span></h2>
          <p className="text-foreground/70">Join thousands of Indians who trust Virtual Setu with their digital identity.</p>
          <Button asChild size="lg" className="bg-gradient-primary glow-primary hover:scale-105 transition-transform">
            <Link to="/register">Create Free Account <ArrowRight className="h-4 w-4 ml-2" /></Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
