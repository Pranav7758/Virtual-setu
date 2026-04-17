import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, User, Phone, Shield, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface SignupFormProps {
  onSuccess?: () => void;
}

export default function SignupForm({ onSuccess }: SignupFormProps) {
  const { signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [registered, setRegistered] = useState(false);

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    pin: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (form.pin.length !== 4 || !/^\d{4}$/.test(form.pin)) {
      toast.error('PIN must be exactly 4 digits');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await signUp(form.email, form.password, {
        full_name: form.fullName,
        phone: form.phone,
        pin: form.pin,
      });

      if (error) {
        toast.error(error.message);
      } else {
        setRegistered(true);
        toast.success('Account created! Check your email to verify.');
        onSuccess?.();
      }
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (registered) {
    return (
      <div className="text-center space-y-4 py-4">
        <div className="mx-auto w-fit p-3 bg-success/10 rounded-xl">
          <Shield className="h-8 w-8 text-success" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Check your email</h3>
          <p className="text-sm text-muted-foreground mt-1">
            We sent a verification link to <strong>{form.email}</strong>.<br />
            Click it to activate your account and sign in.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Full Name */}
      <div>
        <Label htmlFor="signup-name" className="flex items-center space-x-2">
          <User className="h-4 w-4 text-primary" />
          <span>Full Name</span>
        </Label>
        <Input
          id="signup-name"
          name="fullName"
          type="text"
          required
          autoComplete="name"
          value={form.fullName}
          onChange={handleChange}
          className="mt-1 bg-input/50 backdrop-blur-xl border-border/20"
          placeholder="Rahul Sharma"
        />
      </div>

      {/* Email */}
      <div>
        <Label htmlFor="signup-email" className="flex items-center space-x-2">
          <Mail className="h-4 w-4 text-primary" />
          <span>Email Address</span>
        </Label>
        <Input
          id="signup-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={form.email}
          onChange={handleChange}
          className="mt-1 bg-input/50 backdrop-blur-xl border-border/20"
          placeholder="your.email@example.com"
        />
      </div>

      {/* Phone */}
      <div>
        <Label htmlFor="signup-phone" className="flex items-center space-x-2">
          <Phone className="h-4 w-4 text-primary" />
          <span>Phone Number</span>
        </Label>
        <Input
          id="signup-phone"
          name="phone"
          type="tel"
          required
          autoComplete="tel"
          value={form.phone}
          onChange={handleChange}
          className="mt-1 bg-input/50 backdrop-blur-xl border-border/20"
          placeholder="+91 98765 43210"
        />
      </div>

      {/* Password */}
      <div>
        <Label htmlFor="signup-password" className="flex items-center space-x-2">
          <Lock className="h-4 w-4 text-primary" />
          <span>Password</span>
        </Label>
        <div className="relative mt-1">
          <Input
            id="signup-password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete="new-password"
            value={form.password}
            onChange={handleChange}
            className="bg-input/50 backdrop-blur-xl border-border/20 pr-10"
            placeholder="Min. 8 characters"
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

      {/* Confirm Password */}
      <div>
        <Label htmlFor="signup-confirm" className="flex items-center space-x-2">
          <Lock className="h-4 w-4 text-primary" />
          <span>Confirm Password</span>
        </Label>
        <Input
          id="signup-confirm"
          name="confirmPassword"
          type="password"
          required
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={handleChange}
          className="mt-1 bg-input/50 backdrop-blur-xl border-border/20"
          placeholder="Re-enter password"
        />
      </div>

      {/* 4-digit PIN */}
      <div>
        <Label htmlFor="signup-pin" className="flex items-center space-x-2">
          <Shield className="h-4 w-4 text-primary" />
          <span>4-Digit Security PIN</span>
        </Label>
        <Input
          id="signup-pin"
          name="pin"
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          required
          maxLength={4}
          value={form.pin}
          onChange={handleChange}
          className="mt-1 bg-input/50 backdrop-blur-xl border-border/20 tracking-widest text-center text-lg"
          placeholder="••••"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Used for emergency document sharing access
        </p>
      </div>

      <Button
        type="submit"
        className="w-full bg-gradient-primary hover:scale-[1.02] transition-transform glow-primary"
        size="lg"
        disabled={isLoading}
      >
        {isLoading
          ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating Account…</>
          : 'Create Account'}
      </Button>
    </form>
  );
}
