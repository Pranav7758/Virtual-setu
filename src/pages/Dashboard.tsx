import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import GovLayout, { GovCard, GovPageHeader } from '@/components/GovLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Shield, Upload, FileText, CheckCircle, AlertCircle, Clock,
  MessageCircle, Zap, Crown, Lock,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useUserPlan } from '@/hooks/useUserPlan';
import DocumentUpload from '@/components/DocumentUpload';
import DocumentList from '@/components/DocumentList';
import SmartChecklist from '@/components/SmartChecklist';
import AIChatbot from '@/components/AIChatbot';
import DigitalIDCard from '@/components/DigitalIDCard';
import ActivityLog from '@/components/ActivityLog';
import { logActivity } from '@/lib/activityLog';

interface Profile {
  id: string;
  full_name: string;
  phone: string;
  pin_hash: string;
  emergency_contact: string;
  created_at: string;
}

interface Document {
  id: string;
  document_type: string;
  document_name: string;
  file_url: string;
  verification_status: string;
  created_at: string;
}

function PlanBadge({ plan }: { plan: string }) {
  if (plan === 'platinum') {
    return (
      <Badge className="bg-amber-100 text-amber-800 border-amber-200 capitalize">
        <Crown className="h-3 w-3 mr-1" /> Platinum
      </Badge>
    );
  }
  if (plan === 'premium') {
    return (
      <Badge className="bg-blue-100 text-[#0B3D91] border-blue-200 capitalize">
        <Zap className="h-3 w-3 mr-1" /> Premium
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="capitalize border-slate-300 text-slate-700">
      <Shield className="h-3 w-3 mr-1" /> Free
    </Badge>
  );
}

const VALID_TABS = ['overview', 'documents', 'checklist', 'digital-id', 'profile'];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { plan, limits, canUploadDocument } = useUserPlan();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showChatbot, setShowChatbot] = useState(false);

  const tabParam = searchParams.get('tab');
  const activeTab = VALID_TABS.includes(tabParam ?? '') ? tabParam! : 'overview';

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    fetchProfile().catch(console.error);
    fetchDocuments().catch(console.error);
    // Log sign-in once per session (only if not already logged in last 10 min)
    const lastLogin = sessionStorage.getItem('vs_last_login');
    if (!lastLogin) {
      logActivity(user.id, { type: 'login', title: 'Signed in', description: `Logged in as ${user.email}` });
      sessionStorage.setItem('vs_last_login', Date.now().toString());
    }
  }, [user, navigate]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('user_id', user?.id).single();
      if (error) console.error(error); else setProfile(data);
    } finally { setLoading(false); }
  };

  const fetchDocuments = async () => {
    const { data, error } = await supabase.from('documents').select('*').eq('user_id', user?.id).order('created_at', { ascending: false });
    if (error) console.error(error); else setDocuments(data || []);
  };

  const getStatusIcon = (s: string) =>
    s === 'verified' ? <CheckCircle className="h-4 w-4 text-[#138808]" /> :
    s === 'rejected' ? <AlertCircle className="h-4 w-4 text-red-600" /> :
    <Clock className="h-4 w-4 text-amber-600" />;

  const getStatusColor = (s: string) =>
    s === 'verified' ? 'bg-green-50 text-[#138808] border-green-200' :
    s === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
    'bg-amber-50 text-amber-700 border-amber-200';

  const docLimit = limits.maxDocuments === Infinity ? '∞' : limits.maxDocuments;
  const uploadAllowed = canUploadDocument(documents.length);

  const sectionTitle: Record<string, string> = {
    overview: 'Dashboard Overview',
    documents: 'My Documents',
    checklist: 'Document Checklist',
    'digital-id': 'Digital ID Card',
    profile: 'My Profile',
  };

  if (loading) {
    return (
      <GovLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#0B3D91] border-t-transparent" />
        </div>
      </GovLayout>
    );
  }

  return (
    <GovLayout>
      <GovPageHeader
        breadcrumb={`Citizen ID · ${user?.id?.slice(0, 8) || ''}`}
        title={`${profile?.full_name || user?.email}`}
        subtitle={sectionTitle[activeTab]}
      />

      <section className="container mx-auto max-w-7xl px-4 py-6 space-y-5">

        {/* Plan badge row */}
        <div className="flex flex-wrap items-center gap-3">
          <PlanBadge plan={plan} />
          {plan === 'free' && (
            <Link to="/pricing">
              <Button size="sm" className="bg-[#0B3D91] hover:bg-[#082c6c] text-white">
                <Zap className="h-4 w-4 mr-1" /> Upgrade Plan
              </Button>
            </Link>
          )}
        </div>

        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && (
          <>
            {plan === 'free' && !uploadAllowed && (
              <GovCard className="border-amber-200 bg-amber-50">
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                    <p className="text-sm text-amber-800">You've reached the 5-document limit on the Free plan.</p>
                  </div>
                  <Link to="/pricing">
                    <Button size="sm" className="bg-[#0B3D91] hover:bg-[#082c6c] text-white">
                      <Zap className="h-4 w-4 mr-1" /> Upgrade
                    </Button>
                  </Link>
                </div>
              </GovCard>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: FileText, label: 'Documents', value: `${documents.length} / ${docLimit}`, sub: 'Total uploaded' },
                { icon: CheckCircle, label: 'Verified', value: documents.filter(d => d.verification_status === 'verified').length.toString(), sub: 'Documents verified' },
                { icon: Shield, label: 'Plan', value: plan, sub: plan === 'free' ? 'Free tier' : 'Active subscription', cap: true },
              ].map((s, i) => (
                <GovCard key={i} className="p-5">
                  <div className="flex items-center gap-2 text-[#0B3D91]">
                    <s.icon className="h-4 w-4" />
                    <p className="text-sm font-semibold">{s.label}</p>
                  </div>
                  <p className={`text-3xl font-bold text-slate-900 mt-2 ${s.cap ? 'capitalize' : ''}`}>{s.value}</p>
                  <p className="text-xs text-slate-500 mt-1">{s.sub}</p>
                </GovCard>
              ))}
            </div>

            <GovCard>
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/60">
                <p className="font-semibold text-slate-900 text-sm">Recent Documents</p>
                <p className="text-xs text-slate-500">Your latest uploaded documents and their verification status</p>
              </div>
              {documents.length === 0 ? (
                <div className="text-center py-10 px-4">
                  <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p className="font-medium text-slate-700">No documents yet</p>
                  <p className="text-sm text-slate-500 mb-4">Upload your first document to get started.</p>
                  <Button
                    className="bg-[#0B3D91] hover:bg-[#082c6c] text-white"
                    onClick={() => setSearchParams({ tab: 'documents' })}
                  >
                    <Upload className="h-4 w-4 mr-2" /> Upload Document
                  </Button>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {documents.slice(0, 5).map((doc) => (
                    <li key={doc.id} className="flex items-center justify-between px-5 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="h-6 w-6 text-[#0B3D91] shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 text-sm truncate">{doc.document_name}</p>
                          <p className="text-xs text-slate-500 capitalize">{doc.document_type.replace('_', ' ')}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className={getStatusColor(doc.verification_status)}>
                        {getStatusIcon(doc.verification_status)}
                        <span className="ml-1 capitalize">{doc.verification_status}</span>
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </GovCard>

            {plan === 'free' && (
              <GovCard className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-blue-200 bg-blue-50/40">
                <div>
                  <p className="font-semibold text-slate-900">Unlock more with Premium</p>
                  <p className="text-sm text-slate-600">100 documents, QR sharing, full AI assistant and more — from ₹299/year.</p>
                </div>
                <Link to="/pricing">
                  <Button className="bg-[#0B3D91] hover:bg-[#082c6c] text-white whitespace-nowrap">
                    <Zap className="h-4 w-4 mr-2" /> View Plans
                  </Button>
                </Link>
              </GovCard>
            )}

            {/* Activity Log */}
            <GovCard>
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/60">
                <p className="font-semibold text-slate-900 text-sm">Activity Log</p>
                <p className="text-xs text-slate-500">Recent actions on your account — uploads, verifications, deletions</p>
              </div>
              <ActivityLog userId={user?.id || ''} />
            </GovCard>
          </>
        )}

        {/* ── DOCUMENTS ── */}
        {activeTab === 'documents' && (
          <>
            {uploadAllowed ? (
              <div id="document-upload"><DocumentUpload onUploadComplete={fetchDocuments} /></div>
            ) : (
              <GovCard className="p-8 text-center space-y-3">
                <Lock className="h-10 w-10 text-amber-600 mx-auto" />
                <p className="font-semibold text-slate-900">Upload Limit Reached</p>
                <p className="text-sm text-slate-600">You've used all {limits.maxDocuments} document slots on the Free plan.</p>
                <Link to="/pricing">
                  <Button className="bg-[#0B3D91] hover:bg-[#082c6c] text-white">
                    <Zap className="h-4 w-4 mr-2" /> Upgrade to Upload More
                  </Button>
                </Link>
              </GovCard>
            )}
            <DocumentList documents={documents} onDelete={fetchDocuments} />
          </>
        )}

        {/* ── CHECKLIST ── */}
        {activeTab === 'checklist' && <SmartChecklist />}

        {/* ── DIGITAL ID ── */}
        {activeTab === 'digital-id' && (
          <GovCard>
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/60">
              <p className="font-semibold text-slate-900 text-sm">Digital ID Card</p>
              <p className="text-xs text-slate-500">Your secure digital identity card — print or download as PDF</p>
            </div>
            <div className="flex justify-center py-6 px-4">
              <DigitalIDCard
                name={profile?.full_name || ''}
                email={user?.email || ''}
                phone={profile?.phone || ''}
                userId={user?.id || 'unknown'}
                memberSince={profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short' }) : undefined}
                shareUrl={`${window.location.origin}/i/${user?.id}`}
              />
            </div>
            {!limits.qrEmergencySharing && (
              <div className="mx-5 mb-5 p-3 rounded border border-slate-200 bg-slate-50 flex items-center gap-2">
                <Lock className="h-4 w-4 text-slate-500" />
                <p className="text-sm text-slate-600">
                  QR emergency sharing requires{' '}
                  <Link to="/pricing" className="text-[#0B3D91] underline">Premium or Platinum</Link>
                </p>
              </div>
            )}
          </GovCard>
        )}

        {/* ── PROFILE ── */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <GovCard>
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/60">
                <p className="font-semibold text-slate-900 text-sm">Personal Information</p>
                <p className="text-xs text-slate-500">Your account details and contact information</p>
              </div>
              <div className="p-5 space-y-4">
                {[
                  { label: 'Full Name', value: profile?.full_name || 'Not provided' },
                  { label: 'Email Address', value: user?.email },
                  { label: 'Phone Number', value: profile?.phone || 'Not provided' },
                  { label: 'Member Since', value: profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown' },
                ].map((f) => (
                  <div key={f.label}>
                    <Label className="text-xs uppercase tracking-wider text-slate-500">{f.label}</Label>
                    <p className="text-slate-900">{f.value}</p>
                  </div>
                ))}
              </div>
            </GovCard>

            <GovCard>
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/60">
                <p className="font-semibold text-slate-900 text-sm">Security &amp; Plan</p>
                <p className="text-xs text-slate-500">Your security preferences and subscription</p>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between p-3 border border-slate-200 rounded">
                  <div>
                    <p className="font-medium text-slate-900 text-sm">Current Plan</p>
                    <p className="text-xs text-slate-500 capitalize">
                      {plan} — {plan === 'free' ? '5 documents' : plan === 'premium' ? '100 documents' : 'Unlimited'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <PlanBadge plan={plan} />
                    {plan !== 'platinum' && (
                      <Link to="/pricing">
                        <Button size="sm" variant="outline" className="border-[#0B3D91] text-[#0B3D91]">Upgrade</Button>
                      </Link>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 border border-slate-200 rounded">
                  <div>
                    <p className="font-medium text-slate-900 text-sm">PIN Protection</p>
                    <p className="text-xs text-slate-500">4-digit PIN for card access</p>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-[#138808] border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" /> Active
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 border border-slate-200 rounded">
                  <div>
                    <p className="font-medium text-slate-900 text-sm">Email Verification</p>
                    <p className="text-xs text-slate-500">Email address verification status</p>
                  </div>
                  <Badge variant="outline" className={user?.email_confirmed_at ? 'bg-green-50 text-[#138808] border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}>
                    {user?.email_confirmed_at ? <><CheckCircle className="h-3 w-3 mr-1" /> Verified</> : <><Clock className="h-3 w-3 mr-1" /> Pending</>}
                  </Badge>
                </div>
              </div>
            </GovCard>
          </div>
        )}

      </section>

      {/* Floating Chatbot */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => {
            if (!limits.aiChatbot) { toast.error('AI Chatbot is not available on your plan'); return; }
            setShowChatbot(!showChatbot);
          }}
          className="rounded-full w-14 h-14 shadow-lg bg-[#0B3D91] hover:bg-[#082c6c] text-white"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>
      {showChatbot && (
        <div className="fixed bottom-24 right-6 z-50 w-80 h-96">
          <AIChatbot documents={documents} onClose={() => setShowChatbot(false)} />
        </div>
      )}
    </GovLayout>
  );
}
