import React from 'react';
import { Link } from 'react-router-dom';
import { Navigation } from '@/components/ui/navigation';
import { Footer } from '@/components/ui/footer';
import { Button } from '@/components/ui/button';
import { Shield, Target, Heart, Users, Award, Globe, Mail, ArrowRight } from 'lucide-react';

const values = [
  {
    icon: Shield,
    title: 'Security First',
    description: 'Every feature is designed with your data security as the top priority. We use enterprise-grade encryption and never share your data.',
    gradient: 'bg-gradient-primary',
  },
  {
    icon: Heart,
    title: 'Built for India',
    description: 'We understand the unique challenges Indian citizens face with government documentation and built Virtual Setu specifically to solve them.',
    gradient: 'bg-gradient-secondary',
  },
  {
    icon: Target,
    title: 'Simplicity Matters',
    description: 'Complex problems deserve simple solutions. Our interface is designed so anyone — regardless of tech comfort — can use it with ease.',
    gradient: 'bg-gradient-hero',
  },
  {
    icon: Globe,
    title: 'Always Available',
    description: '99.9% uptime means your documents are always accessible, whether you are at a government office or in an emergency.',
    gradient: 'bg-gradient-primary',
  },
];


export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 bg-mesh text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
            <Users className="h-4 w-4 mr-2" /> Our Story
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold">
            Building India's<br />
            <span className="text-gradient">Digital Identity Future</span>
          </h1>
          <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
            Virtual Setu was born out of a simple observation — Indians carry a dozen government documents yet have no secure, unified way to manage them. We set out to change that.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-5">
            <div className="p-3 bg-gradient-primary rounded-2xl w-fit glow-primary">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold"><span className="text-gradient">Our Mission</span></h2>
            <p className="text-foreground/70 leading-relaxed">
              To empower every Indian citizen with a secure, intelligent, and always-accessible digital identity vault — eliminating the frustration of lost documents, missed renewals, and emergency inaccessibility.
            </p>
            <p className="text-foreground/70 leading-relaxed">
              We believe managing your Aadhaar, PAN, Passport, and other government IDs should be as effortless as checking your phone. Virtual Setu is the bridge between India's digital ambitions and everyday citizens.
            </p>
          </div>
          <div className="card-3d p-8 space-y-6">
            <h3 className="font-semibold text-lg">The Problem We Solve</h3>
            <div className="space-y-4">
              {[
                'Valuable documents stored in unsafe physical folders',
                'No central place for all government IDs',
                'Missed renewal deadlines costing time and money',
                'No reliable way to share documents in emergencies',
              ].map((p, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-destructive text-xs font-bold">✗</span>
                  </div>
                  <p className="text-sm text-foreground/70">{p}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-card-glass/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3"><span className="text-gradient">Our Values</span></h2>
            <p className="text-foreground/70">The principles that guide every decision we make.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => {
              const Icon = v.icon;
              return (
                <div key={i} className="card-3d p-6 text-center group hover:scale-[1.03] transition-all duration-300">
                  <div className={`p-4 ${v.gradient} rounded-2xl mb-5 w-fit mx-auto group-hover:scale-110 transition-transform glow-primary`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold mb-2">{v.title}</h3>
                  <p className="text-foreground/60 text-sm leading-relaxed">{v.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Awards / Recognition */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="card-3d p-8 space-y-6">
            <div className="flex items-center justify-center gap-3">
              <Award className="h-7 w-7 text-primary" />
              <h2 className="text-2xl font-bold"><span className="text-gradient">Recognition</span></h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
              {[
                { label: 'Digital India Initiative Partner', sub: 'Ministry of Electronics & IT' },
                { label: 'Best FinTech Startup 2025', sub: 'India Tech Awards' },
                { label: 'ISO 27001 Certified', sub: 'Information Security Management' },
              ].map((r, i) => (
                <div key={i} className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <p className="font-semibold text-foreground">{r.label}</p>
                  <p className="text-foreground/50 text-xs mt-1">{r.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact & CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-3xl font-bold"><span className="text-gradient">Get in Touch</span></h2>
          <p className="text-foreground/70">Questions, partnerships, or feedback — we'd love to hear from you.</p>
          <div className="flex items-center justify-center gap-2 text-foreground/70">
            <Mail className="h-4 w-4 text-primary" />
            <span>support@virtualsetu.in</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <Button asChild size="lg" className="bg-gradient-primary glow-primary hover:scale-105 transition-transform">
              <Link to="/register">Start for Free <ArrowRight className="h-4 w-4 ml-2" /></Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-border/30">
              <Link to="/features">View Features</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
