import React, { useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import LoginForm from '@/components/Auth/LoginForm';
import SignupForm from '@/components/Auth/SignupForm';
import OtpForm from '@/components/Auth/OtpForm';

export default function Auth() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'login';

  // Auto-redirect logged-in users
  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-mesh flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-mesh">
      <div className="max-w-md w-full space-y-6">
        {/* Back Button */}
        <div className="text-center">
          <Link
            to="/"
            className="inline-flex items-center text-foreground/70 hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </div>

        {/* Auth Card */}
        <Card className="card-3d border-0 shadow-3d">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 p-3 bg-gradient-primary rounded-2xl w-fit glow-primary">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gradient">Virtual Setu</CardTitle>
            <CardDescription className="text-foreground/70">
              Secure your digital identity
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue={defaultTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
                <TabsTrigger value="otp">OTP Login</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <LoginForm />
              </TabsContent>

              <TabsContent value="signup">
                <SignupForm />
              </TabsContent>

              <TabsContent value="otp">
                <OtpForm />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          By continuing, you agree to Virtual Setu's Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
