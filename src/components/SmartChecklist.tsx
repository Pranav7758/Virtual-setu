import React, { useState, useEffect, useRef } from 'react';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  CheckCircle2, XCircle, Loader2, RefreshCw, Sparkles,
  FileText, ChevronDown, ChevronUp, AlertCircle, Target,
  ListChecks, Info, Search, X,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useChecklist } from '@/hooks/useChecklist';

interface UserDocument {
  id: string;
  document_name: string;
  document_type: string;
  created_at: string;
}

const QUICK_PURPOSES = [
  { id: 'passport_application',   label: 'Passport' },
  { id: 'pan_card_application',   label: 'PAN Card' },
  { id: 'driving_license',        label: 'Driving License' },
  { id: 'voter_id_registration',  label: 'Voter ID' },
  { id: 'bank_account_opening',   label: 'Bank Account' },
  { id: 'aadhaar_enrollment',     label: 'Aadhaar' },
  { id: 'job_application',        label: 'Job Application' },
  { id: 'college_admission',      label: 'College Admission' },
];

export default function SmartChecklist() {
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [userDocs, setUserDocs] = useState<UserDocument[]>([]);
  const [stepsOpen, setStepsOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);

  const { status, data, error, fetch: fetchChecklist, reset } = useChecklist();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadUserDocuments();
  }, []);

  const loadUserDocuments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: docs, error: err } = await supabase
        .from('documents')
        .select('id, document_name, document_type, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (err) { console.error('loadUserDocuments:', err); return; }
      setUserDocs(docs ?? []);
    } catch (err) {
      console.error('loadUserDocuments:', err);
    }
  };

  const handleSearch = (purposeLabel: string) => {
    const trimmed = purposeLabel.trim();
    if (!trimmed) return;
    setSubmittedQuery(trimmed);
    setStepsOpen(false);
    setNotesOpen(false);
    const id = trimmed.toLowerCase().replace(/\s+/g, '_');
    fetchChecklist(id, trimmed, userDocs);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  const handleQuickSelect = (label: string) => {
    setQuery(label);
    handleSearch(label);
  };

  const handleClear = () => {
    setQuery('');
    setSubmittedQuery('');
    reset();
    inputRef.current?.focus();
  };

  const handleRefresh = () => {
    if (!submittedQuery) return;
    const id = submittedQuery.toLowerCase().replace(/\s+/g, '_');
    fetchChecklist(id, submittedQuery, userDocs, true);
  };

  const available = data?.requiredDocuments.filter((d) => d.status === 'available') ?? [];
  const missing = data?.requiredDocuments.filter((d) => d.status === 'missing') ?? [];
  const requiredMissing = missing.filter((d) => d.required);
  const total = data?.requiredDocuments.length ?? 0;
  const pct = total > 0 ? Math.round((available.length / total) * 100) : 0;

  const barColor =
    pct === 100 ? 'bg-green-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-red-400';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            AI-Powered Document Checklist
            {data && (
              <Badge
                variant="secondary"
                className={`ml-auto flex items-center gap-1 text-xs font-normal ${
                  data.source === 'scraped'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                    : ''
                }`}
              >
                <Sparkles className="h-3 w-3" />
                {data.source === 'scraped' ? 'Live from govt. website' : 'AI Generated'}
              </Badge>
            )}
            {!data && (
              <Badge variant="secondary" className="ml-auto flex items-center gap-1 text-xs font-normal">
                <Sparkles className="h-3 w-3" />
                AI + Web Scraping
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Search for any application or service — the AI builds a personalised checklist
            and checks which documents you already have uploaded.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Search bar */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search any purpose — passport, ration card, GST registration…"
                className="pl-9 pr-9"
              />
              {query && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button
              type="submit"
              disabled={!query.trim() || status === 'loading'}
              className="bg-gradient-primary glow-primary"
            >
              {status === 'loading' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span className="ml-2 hidden sm:inline">Search</span>
            </Button>
            {submittedQuery && status !== 'loading' && (
              <Button variant="outline" size="icon" onClick={handleRefresh} title="Refresh from AI">
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </form>

          {/* Quick-select chips */}
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground font-medium">Quick select:</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_PURPOSES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleQuickSelect(p.label)}
                  disabled={status === 'loading'}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all hover:border-primary/50 hover:bg-primary/10 disabled:opacity-50 ${
                    submittedQuery.toLowerCase() === p.label.toLowerCase()
                      ? 'border-primary bg-primary/15 text-primary'
                      : 'border-border bg-muted/40 text-muted-foreground'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Loading state */}
          {status === 'loading' && (
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium">AI is generating your checklist…</p>
              <p className="text-xs">Building requirements for: <span className="font-semibold text-foreground">{submittedQuery}</span></p>
            </div>
          )}

          {/* Error state */}
          {status === 'error' && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 flex gap-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-destructive">Failed to generate checklist</p>
                <p className="text-xs text-muted-foreground">{error}</p>
                <Button variant="outline" size="sm" onClick={handleRefresh} className="mt-2">
                  <RefreshCw className="h-3 w-3 mr-2" /> Try again
                </Button>
              </div>
            </div>
          )}

          {/* Results */}
          {status === 'success' && data && (
            <div className="space-y-5">
              {/* Active query pill */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Results for:</span>
                <Badge variant="outline" className="flex items-center gap-1 text-xs font-medium capitalize">
                  <Search className="h-3 w-3" />
                  {submittedQuery}
                  <button onClick={handleClear} className="ml-1 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    {available.length} / {total} documents ready
                  </span>
                  <span className={`font-semibold ${pct === 100 ? 'text-green-600' : pct >= 60 ? 'text-yellow-600' : 'text-red-500'}`}>
                    {pct}%
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {data.fromCache && (
                  <p className="text-xs text-muted-foreground text-right">
                    Cached result ·{' '}
                    <button onClick={handleRefresh} className="underline hover:no-underline">
                      Re-fetch from AI
                    </button>
                  </p>
                )}
              </div>

              {/* Document list */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <ListChecks className="h-4 w-4" /> Required Documents
                </h4>
                {data.requiredDocuments.map((doc, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                      doc.status === 'available'
                        ? 'border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950/40'
                        : doc.required
                        ? 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/40'
                        : 'border-border bg-muted/30'
                    }`}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {doc.status === 'available' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <XCircle className={`h-5 w-5 ${doc.required ? 'text-red-500 dark:text-red-400' : 'text-muted-foreground'}`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-semibold ${
                          doc.status === 'available'
                            ? 'text-green-900 dark:text-green-100'
                            : doc.required
                            ? 'text-red-900 dark:text-red-100'
                            : 'text-foreground'
                        }`}>{doc.name}</span>
                        <Badge
                          variant={doc.status === 'available' ? 'default' : 'secondary'}
                          className={`text-xs ${
                            doc.status === 'available'
                              ? 'bg-green-500 hover:bg-green-600 text-white'
                              : doc.required
                              ? 'bg-red-500 hover:bg-red-600 text-white'
                              : ''
                          }`}
                        >
                          {doc.status === 'available' ? '✓ Uploaded' : doc.required ? 'Missing' : 'Optional'}
                        </Badge>
                      </div>
                      <p className={`text-xs mt-0.5 ${
                        doc.status === 'available'
                          ? 'text-green-700 dark:text-green-300'
                          : doc.required
                          ? 'text-red-700 dark:text-red-300'
                          : 'text-muted-foreground'
                      }`}>{doc.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Required missing alert */}
              {requiredMissing.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 p-4">
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {requiredMissing.length} required document{requiredMissing.length > 1 ? 's' : ''} still missing
                  </p>
                  <ul className="text-xs text-amber-700 dark:text-amber-400 space-y-1">
                    {requiredMissing.map((d, i) => (
                      <li key={i} className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                        {d.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {pct === 100 && (
                <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30 p-4 flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                      You're ready to apply!
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      All required documents are uploaded.
                    </p>
                  </div>
                </div>
              )}

              {/* Steps (collapsible) */}
              {data.steps.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 bg-muted/40 hover:bg-muted/60 transition-colors text-sm font-medium"
                    onClick={() => setStepsOpen((v) => !v)}
                  >
                    <span className="flex items-center gap-2">
                      <FileText className="h-4 w-4" /> Application Steps
                    </span>
                    {stepsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  {stepsOpen && (
                    <ol className="px-4 py-3 space-y-2">
                      {data.steps.map((step, i) => (
                        <li key={i} className="flex gap-3 text-sm">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                            {i + 1}
                          </span>
                          <span className="text-muted-foreground">{step.replace(/^Step \d+:\s*/i, '')}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              )}

              {/* Notes (collapsible) */}
              {data.notes.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 bg-muted/40 hover:bg-muted/60 transition-colors text-sm font-medium"
                    onClick={() => setNotesOpen((v) => !v)}
                  >
                    <span className="flex items-center gap-2">
                      <Info className="h-4 w-4" /> Important Notes
                    </span>
                    {notesOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  {notesOpen && (
                    <ul className="px-4 py-3 space-y-2">
                      {data.notes.map((note, i) => (
                        <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                          <span className="text-primary flex-shrink-0 mt-0.5">•</span>
                          {note}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Empty idle state */}
          {status === 'idle' && !submittedQuery && (
            <div className="text-center py-10 text-muted-foreground space-y-2">
              <Search className="h-10 w-10 mx-auto opacity-30" />
              <p className="text-sm">
                Type any application or service above — or pick a quick option.
              </p>
              <p className="text-xs opacity-70">
                Examples: ration card, GST registration, marriage certificate, scholarship…
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
