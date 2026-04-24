import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import GovLayout, { GovCard, GovPageHeader } from '@/components/GovLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import LoginForm from '@/components/Auth/LoginForm';
import SignupForm from '@/components/Auth/SignupForm';
import OtpForm from '@/components/Auth/OtpForm';
import { Lock, ShieldCheck, Info } from 'lucide-react';

export default function Auth() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'login';

  useEffect(() => {
    if (!loading && user) navigate('/dashboard', { replace: true });
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <GovLayout minimal>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#0B3D91] border-t-transparent" />
        </div>
      </GovLayout>
    );
  }

  return (
    <GovLayout>
      <GovPageHeader
        breadcrumb="Citizen Portal · Login"
        title="Citizen Account Access"
        subtitle="Sign in or register to manage your secure digital documents."
      />

      <section className="container mx-auto max-w-7xl px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GovCard className="lg:col-span-2 p-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
            <Lock className="h-4 w-4 text-[#0B3D91]" />
            <p className="text-sm font-semibold text-slate-800">
              Secure Authentication
            </p>
          </div>

          <Tabs defaultValue={defaultTab} className="w-full mt-4">
            <TabsList className="grid w-full grid-cols-3 bg-slate-100 rounded">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="signup">New Registration</TabsTrigger>
              <TabsTrigger value="otp">OTP Login</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="pt-6">
              <LoginForm />
            </TabsContent>
            <TabsContent value="signup" className="pt-6">
              <SignupForm />
            </TabsContent>
            <TabsContent value="otp" className="pt-6">
              <OtpForm />
            </TabsContent>
          </Tabs>

          <p className="text-xs text-slate-500 mt-6 leading-relaxed">
            By continuing, you agree to Virtual Setu's Terms of Service and
            Privacy Policy. Do not share your password or PIN with anyone.
          </p>
        </GovCard>

        <div className="space-y-4">
          <GovCard className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="h-4 w-4 text-[#138808]" />
              <p className="font-semibold text-slate-900 text-sm">
                Your Security
              </p>
            </div>
            <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
              <li>End-to-end 256-bit encryption</li>
              <li>4-digit PIN protected document access</li>
              <li>Device-aware login activity logs</li>
              <li>OTP-based passwordless option</li>
            </ul>
          </GovCard>

          <GovCard className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-[#0B3D91]" />
              <p className="font-semibold text-slate-900 text-sm">
                Need help?
              </p>
            </div>
            <p className="text-xs text-slate-600">
              Forgot your password or unable to log in? Visit our{' '}
              <a href="/help" className="text-[#0B3D91] underline">
                Help &amp; Support
              </a>{' '}
              section, or contact citizen support at 1800-XXX-XXXX.
            </p>
          </GovCard>
        </div>
      </section>
    </GovLayout>
  );
}
