import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  FileText,
  Download,
  Eye,
  CheckCircle,
  AlertCircle,
  Clock,
  Calendar,
  Trash2,
  Loader2,
  Search,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { logActivity } from '@/lib/activityLog';
import { useAuth } from '@/hooks/useAuth';
import {
  getExpiry,
  removeExpiry,
  getExpiryStatus,
  formatExpiryDate,
  daysUntilExpiry,
} from '@/lib/documentExpiry';

interface Document {
  id: string;
  document_type: string;
  document_name: string;
  file_url: string;
  verification_status: string;
  created_at: string;
}

interface DocumentListProps {
  documents: Document[];
  onDelete?: () => void;
}

const STATUS_FILTERS = ['all', 'verified', 'pending', 'rejected'] as const;
type StatusFilter = typeof STATUS_FILTERS[number];

export default function DocumentList({ documents, onDelete }: DocumentListProps) {
  const { user } = useAuth();
  const [confirmDoc, setConfirmDoc] = useState<Document | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const filtered = useMemo(() => {
    let list = documents;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (d) =>
          d.document_name.toLowerCase().includes(q) ||
          getDocumentTypeLabel(d.document_type).toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') {
      list = list.filter((d) => d.verification_status === statusFilter);
    }
    return list;
  }, [documents, search, statusFilter]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'rejected': return <AlertCircle className="h-4 w-4 text-destructive" />;
      default: return <Clock className="h-4 w-4 text-warning" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-success/10 text-success border-success/20';
      case 'rejected': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-warning/10 text-warning border-warning/20';
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      aadhaar: 'Aadhaar Card',
      pan_card: 'PAN Card',
      voter_id: 'Voter ID',
      driving_license: 'Driving License',
      passport: 'Passport',
      birth_certificate: 'Birth Certificate',
      income_certificate: 'Income Certificate',
      caste_certificate: 'Caste Certificate',
      domicile_certificate: 'Domicile Certificate',
      other: 'Other',
    };
    return typeMap[type] || type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const normalizePath = (urlOrPath: string) => {
    if (!urlOrPath) return urlOrPath;
    if (urlOrPath.startsWith('http')) {
      const pubMarker = '/object/public/documents/';
      const pubIdx = urlOrPath.indexOf(pubMarker);
      if (pubIdx !== -1) return urlOrPath.slice(pubIdx + pubMarker.length);
      const anyIdx = urlOrPath.indexOf('/documents/');
      if (anyIdx !== -1) return urlOrPath.slice(anyIdx + '/documents/'.length);
    }
    return urlOrPath.replace(/^\/+/, '');
  };

  const handleView = async (document: Document) => {
    try {
      if (!document.file_url) { toast.error('Document URL not available'); return; }
      const path = normalizePath(document.file_url);
      const { data, error } = await supabase.storage.from('documents').createSignedUrl(path, 60 * 10);
      if (error || !data?.signedUrl) throw error || new Error('No signed URL');
      window.open(data.signedUrl, '_blank');
    } catch {
      toast.error('Failed to open document');
    }
  };

  const handleDownload = async (document: Document) => {
    try {
      if (!document.file_url) { toast.error('Document URL not available'); return; }
      const path = normalizePath(document.file_url);
      const { data, error } = await supabase.storage.from('documents').createSignedUrl(path, 60 * 10);
      if (error || !data?.signedUrl) throw error || new Error('No signed URL');
      const link = window.document.createElement('a');
      link.href = data.signedUrl;
      link.download = document.document_name;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      toast.success('Download started');
    } catch {
      toast.error('Failed to download document');
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!confirmDoc) return;
    setDeletingId(confirmDoc.id);
    setConfirmDoc(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) throw new Error('Not authenticated');

      const res = await fetch('/api/delete-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: confirmDoc.id,
          userId,
          filePath: normalizePath(confirmDoc.file_url),
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Delete failed');

      toast.success(`"${confirmDoc.document_name}" deleted successfully`);
      removeExpiry(userId, confirmDoc.id);
      logActivity(userId, {
        type: 'document_deleted',
        title: confirmDoc.document_name,
        description: `${confirmDoc.document_type.replace(/_/g, ' ')} removed from your vault.`,
      });
      onDelete?.();
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error(err.message || 'Failed to delete document. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  if (documents.length === 0) {
    return (
      <Card className="card-3d border-0">
        <CardHeader>
          <CardTitle>Your Documents</CardTitle>
          <CardDescription>No documents uploaded yet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No documents found</h3>
            <p className="text-muted-foreground">Upload your first document using the form above</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const statusColors: Record<StatusFilter, string> = {
    all: 'bg-slate-100 text-slate-700 border-slate-300',
    verified: 'bg-green-50 text-[#138808] border-green-300',
    pending: 'bg-amber-50 text-amber-700 border-amber-300',
    rejected: 'bg-red-50 text-red-700 border-red-300',
  };

  return (
    <>
      <Card className="card-3d border-0">
        <CardHeader>
          <CardTitle>Your Documents</CardTitle>
          <CardDescription>
            {documents.length} document{documents.length !== 1 ? 's' : ''} uploaded
          </CardDescription>
        </CardHeader>

        {/* ── Search & Filter bar ── */}
        <div className="px-6 pb-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or document type…"
              className="pl-9 pr-9 bg-slate-50 border-slate-200 focus:bg-white"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-500 shrink-0">Filter:</span>
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`text-xs px-3 py-1 rounded-full border font-medium transition-colors capitalize ${
                  statusFilter === s
                    ? statusColors[s] + ' ring-1 ring-offset-1 ring-current'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                {s === 'all' ? `All (${documents.length})` : `${s} (${documents.filter((d) => d.verification_status === s).length})`}
              </button>
            ))}
          </div>

          {filtered.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-4">
              No documents match your search. <button className="text-[#0B3D91] underline" onClick={() => { setSearch(''); setStatusFilter('all'); }}>Clear filters</button>
            </p>
          )}
        </div>

        <CardContent className="pt-0">
          <div className="space-y-4">
            {filtered.map((doc) => (
              <div
                key={doc.id}
                className="p-4 bg-card-glass/30 rounded-xl border border-border/10 hover:border-border/20 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-lg truncate">{doc.document_name}</h4>
                      <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                        <span className="capitalize">{getDocumentTypeLabel(doc.document_type)}</span>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                        </div>
                        {/* ── Expiry badge ── */}
                        {(() => {
                          if (!user) return null;
                          const rec = getExpiry(user.id, doc.id);
                          if (!rec) return null;
                          if (!rec.expiryDate) return (
                            <span className="text-xs text-slate-400 italic">No expiry</span>
                          );
                          const st = getExpiryStatus(rec.expiryDate);
                          const days = daysUntilExpiry(rec.expiryDate);
                          const styleMap = {
                            expired: 'bg-red-100 text-red-700 border-red-300',
                            critical: 'bg-red-50 text-red-600 border-red-200',
                            warning: 'bg-amber-50 text-amber-700 border-amber-200',
                            ok: 'bg-green-50 text-[#138808] border-green-200',
                            none: '',
                          };
                          const label =
                            st === 'expired' ? `Expired ${formatExpiryDate(rec.expiryDate)}` :
                            st === 'critical' ? `Expires in ${days}d` :
                            st === 'warning' ? `Expires in ${days}d` :
                            `Valid till ${formatExpiryDate(rec.expiryDate)}`;
                          return (
                            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${styleMap[st]}`}>
                              {label}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Badge variant="outline" className={getStatusColor(doc.verification_status)}>
                      {getStatusIcon(doc.verification_status)}
                      <span className="ml-1 capitalize">{doc.verification_status}</span>
                    </Badge>

                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleView(doc)}
                        className="hover:bg-primary/10"
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(doc)}
                        className="hover:bg-primary/10"
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmDoc(doc)}
                        disabled={deletingId === doc.id}
                        className="hover:bg-destructive/10 hover:text-destructive text-muted-foreground"
                        title="Delete"
                      >
                        {deletingId === doc.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmDoc} onOpenChange={(open) => !open && setConfirmDoc(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-semibold text-foreground">"{confirmDoc?.document_name}"</span>?
              This will permanently remove the file and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirmed}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
