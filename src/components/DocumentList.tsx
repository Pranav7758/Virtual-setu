import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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

export default function DocumentList({ documents, onDelete }: DocumentListProps) {
  const [confirmDoc, setConfirmDoc] = useState<Document | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  return (
    <>
      <Card className="card-3d border-0">
        <CardHeader>
          <CardTitle>Your Documents</CardTitle>
          <CardDescription>
            {documents.length} document{documents.length !== 1 ? 's' : ''} uploaded
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {documents.map((doc) => (
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
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                        <span className="capitalize">{getDocumentTypeLabel(doc.document_type)}</span>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                        </div>
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
