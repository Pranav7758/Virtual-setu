import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle, X, Zap, Crown, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useUserPlan, Plan } from '@/hooks/useUserPlan';
import { supabase } from '@/integrations/supabase/client';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface PricingPlan {
  id: Plan;
  name: string;
  price: number;
  priceLabel: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
  features: { text: string; included: boolean }[];
  color: string;
  buttonLabel: string;
}

const PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    priceLabel: '₹0',
    description: 'Get started with basic document management',
    icon: <Shield className="h-6 w-6" />,
    color: 'border-border/20',
    buttonLabel: 'Current Plan',
    features: [
      { text: 'Up to 5 document uploads', included: true },
      { text: 'Basic AI chatbot access', included: true },
      { text: 'Digital ID card', included: true },
      { text: 'Smart checklist', included: true },
      { text: 'QR emergency sharing', included: false },
      { text: 'Full AI assistant', included: false },
      { text: 'Priority verification', included: false },
      { text: 'Advanced AI analysis', included: false },
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 29900,
    priceLabel: '₹299',
    description: 'Everything you need for complete document management',
    icon: <Zap className="h-6 w-6" />,
    badge: 'Most Popular',
    color: 'border-primary/40 ring-2 ring-primary/20',
    buttonLabel: 'Upgrade to Premium',
    features: [
      { text: 'Up to 100 document uploads', included: true },
      { text: 'Basic AI chatbot access', included: true },
      { text: 'Digital ID card', included: true },
      { text: 'Smart checklist', included: true },
      { text: 'QR emergency sharing', included: true },
      { text: 'Full AI assistant', included: true },
      { text: 'Priority verification', included: true },
      { text: 'Advanced AI analysis', included: false },
    ],
  },
  {
    id: 'platinum',
    name: 'Platinum',
    price: 59900,
    priceLabel: '₹599',
    description: 'Unlimited access with all advanced features',
    icon: <Crown className="h-6 w-6" />,
    color: 'border-yellow-500/40 ring-2 ring-yellow-500/20',
    buttonLabel: 'Upgrade to Platinum',
    features: [
      { text: 'Unlimited document uploads', included: true },
      { text: 'Basic AI chatbot access', included: true },
      { text: 'Digital ID card', included: true },
      { text: 'Smart checklist', included: true },
      { text: 'QR emergency sharing', included: true },
      { text: 'Full AI assistant', included: true },
      { text: 'Priority verification', included: true },
      { text: 'Advanced AI analysis', included: true },
      { text: 'Instant QR access (no PIN delay)', included: true },
      { text: 'Future features — early access', included: true },
    ],
  },
];

export default function Pricing() {
  const { user } = useAuth();
  const { plan: currentPlan, refreshPlan } = useUserPlan();
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState<Plan | null>(null);

  const loadRazorpay = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleUpgrade = async (targetPlan: Plan) => {
    if (!user) {
      toast.error('Please sign in to upgrade your plan');
      navigate('/auth');
      return;
    }

    if (targetPlan === 'free') return;
    if (targetPlan === currentPlan) {
      toast.info('You are already on this plan');
      return;
    }

    const planConfig = PLANS.find(p => p.id === targetPlan)!;
    setLoadingPlan(targetPlan);

    try {
      const loaded = await loadRazorpay();
      if (!loaded) {
        toast.error('Could not load payment gateway. Please check your connection.');
        return;
      }

      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: targetPlan, amount: planConfig.price }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create order');
      }

      const { orderId, amount, currency, keyId } = await res.json();

      const options = {
        key: keyId,
        amount,
        currency,
        name: 'Virtual Setu',
        description: `${planConfig.name} Plan Subscription`,
        order_id: orderId,
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan: targetPlan,
                userId: user.id,
              }),
            });

            if (!verifyRes.ok) {
              const err = await verifyRes.json();
              throw new Error(err.error || 'Payment verification failed');
            }

            await refreshPlan();
            toast.success(`Successfully upgraded to ${planConfig.name} plan!`);
            navigate('/dashboard');
          } catch (err: any) {
            toast.error(err.message || 'Payment verification failed');
          }
        },
        prefill: {
          email: user.email,
        },
        theme: { color: '#6366f1' },
        modal: {
          ondismiss: () => setLoadingPlan(null),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoadingPlan(null);
    }
  };

  const getPlanOrder = (p: Plan) => ({ free: 0, premium: 1, platinum: 2 }[p]);

  const getButtonState = (planId: Plan) => {
    if (planId === 'free') return { disabled: true, label: currentPlan === 'free' ? 'Current Plan' : 'Downgrade not available' };
    if (planId === currentPlan) return { disabled: true, label: 'Current Plan' };
    if (getPlanOrder(planId) < getPlanOrder(currentPlan)) return { disabled: true, label: 'Downgrade not available' };
    return { disabled: false, label: PLANS.find(p => p.id === planId)!.buttonLabel };
  };

  return (
    <div className="min-h-screen bg-mesh">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back */}
        <div className="mb-8">
          <Link to="/dashboard" className="inline-flex items-center text-foreground/70 hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="mx-auto mb-4 p-3 bg-gradient-primary rounded-2xl w-fit glow-primary">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gradient mb-4">Choose Your Plan</h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Upgrade to unlock more uploads, AI-powered features, and emergency document sharing
          </p>
          {currentPlan !== 'free' && (
            <Badge className="mt-4 bg-primary/20 text-primary border-primary/30 capitalize">
              Current plan: {currentPlan}
            </Badge>
          )}
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {PLANS.map((p) => {
            const btn = getButtonState(p.id);
            const isLoading = loadingPlan === p.id;

            return (
              <Card key={p.id} className={`card-3d border relative ${p.color} ${p.badge ? 'scale-[1.03]' : ''}`}>
                {p.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-primary text-white border-0 shadow-lg px-4 py-1">
                      {p.badge}
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <div className={`mx-auto mb-3 p-3 rounded-xl w-fit ${
                    p.id === 'platinum' ? 'bg-yellow-500/20 text-yellow-500' :
                    p.id === 'premium' ? 'bg-primary/20 text-primary' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {p.icon}
                  </div>
                  <CardTitle className="text-xl font-bold">{p.name}</CardTitle>
                  <div className="mt-2">
                    <span className="text-4xl font-bold text-gradient">{p.priceLabel}</span>
                    {p.price > 0 && <span className="text-muted-foreground text-sm">/year</span>}
                  </div>
                  <CardDescription className="mt-2">{p.description}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {p.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        {feature.included ? (
                          <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground/40 mt-0.5 flex-shrink-0" />
                        )}
                        <span className={`text-sm ${feature.included ? '' : 'text-muted-foreground/50'}`}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`w-full mt-4 ${
                      p.id === 'platinum' ? 'bg-yellow-500 hover:bg-yellow-600 text-black' :
                      p.id === 'premium' ? 'bg-gradient-primary glow-primary' :
                      ''
                    }`}
                    variant={p.id === 'free' ? 'outline' : 'default'}
                    disabled={btn.disabled || isLoading}
                    onClick={() => handleUpgrade(p.id)}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing…
                      </>
                    ) : btn.label}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Security note */}
        <p className="text-center text-sm text-muted-foreground mt-10">
          All payments are secured by Razorpay. Prices are in Indian Rupees (INR).
        </p>
      </div>
    </div>
  );
}
