import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Upload, 
  FileText, 

  User, 
  Phone, 
  Mail, 
  LogOut,
  CheckCircle,
  AlertCircle,
  Clock,

  MessageCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import DocumentUpload from '@/components/DocumentUpload';
import DocumentList from '@/components/DocumentList';

import SmartChecklist from '@/components/SmartChecklist';
import AIChatbot from '@/components/AIChatbot';
import DigitalIDCard from '@/components/DigitalIDCard';

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

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showChatbot, setShowChatbot] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    fetchProfile();
    fetchDocuments();
  }, [user, navigate]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error);
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching documents:', error);
      } else {
        setDocuments(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error('Error signing out');
    } else {
      toast.success('Signed out successfully');
      navigate('/');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'rejected':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-warning" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-success/10 text-success border-success/20';
      case 'rejected':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-warning/10 text-warning border-warning/20';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-mesh flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mesh">
      {/* Header */}
      <header className="bg-card-glass/50 backdrop-blur-xl border-b border-border/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-primary rounded-xl glow-primary">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gradient">Virtual Setu</h1>
                <p className="text-sm text-muted-foreground">Digital Identity Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium">{profile?.full_name || user?.email}</p>
                <p className="text-xs text-muted-foreground">Welcome back</p>
              </div>
              <Button
                onClick={handleSignOut}
                variant="outline"
                size="sm"
                className="bg-card-glass/50 backdrop-blur-xl border-border/20"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-card-glass/50 backdrop-blur-xl">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="checklist">Smart Checklist</TabsTrigger>
            <TabsTrigger value="digital-id">Digital ID</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="card-3d border-0">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <span>Documents</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gradient">{documents.length}</div>
                  <p className="text-sm text-muted-foreground">Total uploaded</p>
                </CardContent>
              </Card>

              <Card className="card-3d border-0">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-success" />
                    <span>Verified</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gradient">
                    {documents.filter(doc => doc.verification_status === 'verified').length}
                  </div>
                  <p className="text-sm text-muted-foreground">Documents verified</p>
                </CardContent>
              </Card>

              <Card className="card-3d border-0">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-accent" />
                    <span>Security</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gradient">Active</div>
                  <p className="text-sm text-muted-foreground">PIN protection enabled</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Documents */}
            <Card className="card-3d border-0">
              <CardHeader>
                <CardTitle>Recent Documents</CardTitle>
                <CardDescription>Your latest uploaded documents and their verification status</CardDescription>
              </CardHeader>
              <CardContent>
                {documents.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No documents yet</h3>
                    <p className="text-muted-foreground mb-4">Upload your first document to get started</p>
                    <Button className="bg-gradient-primary glow-primary">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Document
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {documents.slice(0, 5).map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-4 bg-card-glass/30 rounded-xl">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-8 w-8 text-primary" />
                          <div>
                            <h4 className="font-medium">{doc.document_name}</h4>
                            <p className="text-sm text-muted-foreground capitalize">{doc.document_type.replace('_', ' ')}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline" className={getStatusColor(doc.verification_status)}>
                            {getStatusIcon(doc.verification_status)}
                            <span className="ml-1 capitalize">{doc.verification_status}</span>
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <div id="document-upload">
              <DocumentUpload onUploadComplete={fetchDocuments} />
            </div>
            <DocumentList documents={documents} />
          </TabsContent>

          <TabsContent value="checklist" className="space-y-6">
            <SmartChecklist />
          </TabsContent>

          <TabsContent value="digital-id">
            <Card className="card-3d border-0">
              <CardHeader>
                <CardTitle>Digital ID Card</CardTitle>
                <CardDescription>Your secure digital identity card — print or download as PDF</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center py-4">
                  <DigitalIDCard
                    name={profile?.full_name || ''}
                    email={user?.email || ''}
                    phone={profile?.phone || ''}
                    userId={user?.id || 'unknown'}
                    memberSince={profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short' }) : undefined}
                    shareUrl={`${window.location.origin}/i/${user?.id}`}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="card-3d border-0">
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Your account details and contact information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
                    <p className="text-lg">{profile?.full_name || 'Not provided'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Email Address</Label>
                    <p className="text-lg">{user?.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Phone Number</Label>
                    <p className="text-lg">{profile?.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Member Since</Label>
                    <p className="text-lg">
                      {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-3d border-0">
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Manage your security preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-card-glass/30 rounded-xl">
                    <div>
                      <h4 className="font-medium">PIN Protection</h4>
                      <p className="text-sm text-muted-foreground">4-digit PIN for card access</p>
                    </div>
                    <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-card-glass/30 rounded-xl">
                    <div>
                      <h4 className="font-medium">Email Verification</h4>
                      <p className="text-sm text-muted-foreground">Email address verification status</p>
                    </div>
                    <Badge variant="outline" className={user?.email_confirmed_at ? "bg-success/10 text-success border-success/20" : "bg-warning/10 text-warning border-warning/20"}>
                      {user?.email_confirmed_at ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </>
                      )}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Floating Chatbot Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setShowChatbot(!showChatbot)}
          className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-primary text-white"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>

      {/* AI Chatbot */}
      {showChatbot && (
        <div className="fixed bottom-24 right-6 z-50 w-80 h-96">
          <AIChatbot documents={documents} onClose={() => setShowChatbot(false)} />
        </div>
      )}
    </div>
  );
}