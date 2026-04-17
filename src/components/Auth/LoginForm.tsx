import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, Eye, EyeOff, Loader2, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

type LoginView = 'login' | 'forgot';

export default function LoginForm() {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const [view, setView] = useState<LoginView>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(error.message === 'Invalid login credentials'
          ? 'Incorrect email or password'
          : error.message);
      } else {
        toast.success('Welcome back!');
        navigate('/dashboard');
      }
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error('Please enter your email address');
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth?tab=login`,
      });
      if (error) {
        toast.error(error.message);
      } else {
        setResetSent(true);
        toast.success('Password reset email sent!');
      }
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (view === 'forgot') {
    return (
      <div className="space-y-5">
        <div className="text-center space-y-1">
          <div className="mx-auto w-fit p-3 bg-primary/10 rounded-xl mb-3">
            <KeyRound className="h-6 w-6 text-primary" />
          </div>
          <h3 className="font-semibold text-lg">Reset your password</h3>
          <p className="text-sm text-muted-foreground">
            Enter your email and we'll send you a reset link
          </p>
        </div>

        {resetSent ? (
          <div className="text-center space-y-4">
            <div className="p-4 rounded-xl bg-success/10 border border-success/20 text-success text-sm">
              Check your inbox — a password reset link has been sent to <strong>{resetEmail}</strong>
            </div>
            <Button
              variant="outline"
              className="w-full border-border/20"
              onClick={() => { setView('login'); setResetSent(false); setResetEmail(''); }}
            >
              Back to Sign In
            </Button>
          </div>
        ) : (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <Label htmlFor="reset-email" className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-primary" />
                <span>Email Address</span>
              </Label>
              <Input
                id="reset-email"
                type="email"
                required
                value={resetEmail}
                onChange={e => setResetEmail(e.target.value)}
                className="mt-1 bg-input/50 backdrop-blur-xl border-border/20"
                placeholder="your.email@example.com"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-primary glow-primary"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending…</> : 'Send Reset Link'}
            </Button>
            <button
              type="button"
              onClick={() => setView('login')}
              className="w-full text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              ← Back to Sign In
            </button>
          </form>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div>
        <Label htmlFor="login-email" className="flex items-center space-x-2">
          <Mail className="h-4 w-4 text-primary" />
          <span>Email Address</span>
        </Label>
        <Input
          id="login-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="mt-1 bg-input/50 backdrop-blur-xl border-border/20"
          placeholder="your.email@example.com"
        />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor="login-password" className="flex items-center space-x-2">
            <Lock className="h-4 w-4 text-primary" />
            <span>Password</span>
          </Label>
          <button
            type="button"
            onClick={() => setView('forgot')}
            className="text-xs text-primary hover:underline underline-offset-2"
          >
            Forgot password?
          </button>
        </div>
        <div className="relative mt-1">
          <Input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="bg-input/50 backdrop-blur-xl border-border/20 pr-10"
            placeholder="Enter your password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(p => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full bg-gradient-primary hover:scale-[1.02] transition-transform glow-primary"
        size="lg"
        disabled={isLoading}
      >
        {isLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Signing In…</> : 'Sign In'}
      </Button>
    </form>
  );
}
