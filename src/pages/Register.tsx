import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import GovLayout, { GovCard, GovPageHeader } from '@/components/GovLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Mail, Lock, User, Phone, ShieldCheck, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export default function Register() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    pin: '',
    ownedDocuments: [] as string[],
    agreeToTerms: false,
  });

  const documentTypes = [
    { id: 'aadhaar', label: 'Aadhaar Card' },
    { id: 'pan', label: 'PAN Card' },
    { id: 'passport', label: 'Passport' },
    { id: 'driving_license', label: 'Driving License' },
    { id: 'voter_id', label: 'Voter ID' },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleDocumentChange = (id: string, checked: boolean) => {
    setFormData((p) => ({
      ...p,
      ownedDocuments: checked
        ? [...p.ownedDocuments, id]
        : p.ownedDocuments.filter((x) => x !== id),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) return toast.error('Passwords do not match');
    if (formData.pin.length !== 4) return toast.error('PIN must be exactly 4 digits');
    if (!formData.agreeToTerms) return toast.error('Please agree to the terms and conditions');

    try {
      const { error } = await signUp(formData.email, formData.password, {
        full_name: formData.fullName,
        phone: formData.phone,
        pin: formData.pin,
        owned_documents: formData.ownedDocuments,
      });
      if (error) return toast.error(error.message);
      toast.success('Registration successful! Please check your email for verification.');
      navigate('/auth');
    } catch {
      toast.error('An unexpected error occurred');
    }
  };

  const fieldClass =
    'mt-1 bg-white border-slate-300 focus:border-[#0B3D91] focus:ring-1 focus:ring-[#0B3D91]';

  return (
    <GovLayout>
      <GovPageHeader
        breadcrumb="Citizen Portal · New Registration"
        title="Citizen Account Registration"
        subtitle="Provide your details below to create a secure Virtual Setu account."
      />

      <section className="container mx-auto max-w-7xl px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GovCard className="lg:col-span-2 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <p className="text-xs font-semibold text-[#0B3D91] tracking-[0.18em] uppercase mb-3">
                Personal Information
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Label htmlFor="fullName" className="text-sm flex items-center gap-2 text-slate-700">
                    <User className="h-3.5 w-3.5 text-[#0B3D91]" /> Full Name
                  </Label>
                  <Input id="fullName" name="fullName" required value={formData.fullName} onChange={handleInputChange} className={fieldClass} placeholder="As per government ID" />
                </div>
                <div>
                  <Label htmlFor="email" className="text-sm flex items-center gap-2 text-slate-700">
                    <Mail className="h-3.5 w-3.5 text-[#0B3D91]" /> Email Address
                  </Label>
                  <Input id="email" name="email" type="email" required value={formData.email} onChange={handleInputChange} className={fieldClass} placeholder="your.email@example.com" />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-sm flex items-center gap-2 text-slate-700">
                    <Phone className="h-3.5 w-3.5 text-[#0B3D91]" /> Mobile Number
                  </Label>
                  <Input id="phone" name="phone" type="tel" required value={formData.phone} onChange={handleInputChange} className={fieldClass} placeholder="+91 98765 43210" />
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-[#0B3D91] tracking-[0.18em] uppercase mb-3">
                Security Credentials
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="password" className="text-sm flex items-center gap-2 text-slate-700">
                    <Lock className="h-3.5 w-3.5 text-[#0B3D91]" /> Password
                  </Label>
                  <Input id="password" name="password" type="password" required value={formData.password} onChange={handleInputChange} className={fieldClass} placeholder="Minimum 8 characters" />
                </div>
                <div>
                  <Label htmlFor="confirmPassword" className="text-sm text-slate-700">Confirm Password</Label>
                  <Input id="confirmPassword" name="confirmPassword" type="password" required value={formData.confirmPassword} onChange={handleInputChange} className={fieldClass} placeholder="Re-enter password" />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="pin" className="text-sm flex items-center gap-2 text-slate-700">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#0B3D91]" /> 4-Digit Access PIN
                  </Label>
                  <Input id="pin" name="pin" type="password" maxLength={4} required value={formData.pin} onChange={handleInputChange} className={fieldClass + ' tracking-widest'} placeholder="• • • •" />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Used as a second factor to access your Digital ID Card.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-[#0B3D91] tracking-[0.18em] uppercase mb-3">
                Documents You Currently Own
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 border border-slate-200 rounded bg-slate-50/60">
                {documentTypes.map((doc) => (
                  <label key={doc.id} htmlFor={doc.id} className="flex items-center gap-2 p-1.5 cursor-pointer hover:bg-white rounded">
                    <Checkbox id={doc.id} checked={formData.ownedDocuments.includes(doc.id)} onCheckedChange={(c) => handleDocumentChange(doc.id, c as boolean)} />
                    <span className="text-sm text-slate-700">{doc.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-2 pt-2 border-t border-slate-100">
              <Checkbox id="terms" checked={formData.agreeToTerms} onCheckedChange={(c) => setFormData((p) => ({ ...p, agreeToTerms: c as boolean }))} />
              <Label htmlFor="terms" className="text-xs text-slate-600 leading-relaxed">
                I confirm the information above is accurate and I agree to the{' '}
                <Link to="/terms" className="text-[#0B3D91] underline">Terms of Service</Link> and{' '}
                <Link to="/privacy" className="text-[#0B3D91] underline">Privacy Policy</Link>.
              </Label>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button type="submit" className="flex-1 bg-[#0B3D91] hover:bg-[#082c6c] text-white" size="lg">
                Submit Registration
              </Button>
              <Link to="/auth" className="flex-1">
                <Button type="button" variant="outline" size="lg" className="w-full border-slate-300 text-slate-700">
                  I already have an account
                </Button>
              </Link>
            </div>
          </form>
        </GovCard>

        <div className="space-y-4">
          <GovCard className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-[#0B3D91]" />
              <p className="font-semibold text-slate-900 text-sm">Before you begin</p>
            </div>
            <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
              <li>Use a valid mobile number for OTP verification.</li>
              <li>Choose a 4-digit PIN you can remember but no one can guess.</li>
              <li>Your data is encrypted and never shared with third parties.</li>
            </ul>
          </GovCard>

          <GovCard className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="h-4 w-4 text-[#138808]" />
              <p className="font-semibold text-slate-900 text-sm">Privacy Notice</p>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Personal information collected during registration is used solely
              to create and secure your Virtual Setu account, in accordance with
              applicable data protection laws.
            </p>
          </GovCard>
        </div>
      </section>
    </GovLayout>
  );
}
