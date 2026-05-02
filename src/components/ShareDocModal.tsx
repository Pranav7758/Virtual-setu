import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import QRCode from '@/components/QRCode';
import { toast } from 'sonner';
import {
  QrCode, Copy, Clock, Lock, ShieldCheck, X, CheckCircle, Share2,
} from 'lucide-react';

interface ShareDocModalProps {
  open: boolean;
  onClose: () => void;
  documentId: string;
  documentName: string;
  userId: string;
}

const DURATIONS = [
  { label: '1 Hour',   value: 1 },
  { label: '6 Hours',  value: 6 },
  { label: '24 Hours', value: 24 },
];

export default function ShareDocModal({
  open, onClose, documentId, documentName, userId,
}: ShareDocModalProps) {
  const [pin, setPin] = useState('');
  const [duration, setDuration] = useState(6);
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    if (pin.length < 4) { toast.error('PIN must be at least 4 digits'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/create-doc-share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId, userId, pin, durationHours: duration }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create share');
      setShareUrl(`${window.location.origin}/s/${data.token}`);
    } catch (e: any) {
      toast.error(e.message || 'Failed to create share link');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setPin(''); setShareUrl(null); setCopied(false); onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-md bg-white border border-[#cdd3da] rounded-sm p-0 overflow-hidden">

        {/* Header */}
        <div className="bg-[#003580] text-white px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-[#FF9933]" />
              <div>
                <DialogTitle className="text-sm font-bold text-white">Emergency QR Share</DialogTitle>
                <p className="text-[11px] text-blue-200 mt-0.5">Create a time-limited, PIN-protected link</p>
              </div>
            </div>
            <button onClick={handleClose} className="text-blue-200 hover:text-white transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Document name */}
          <div className="p-3 bg-[#f0f4fa] border border-[#c8d4e8] rounded-sm flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#003580] shrink-0" />
            <p className="text-sm font-semibold text-slate-800 truncate">{documentName}</p>
          </div>

          {!shareUrl ? (
            <>
              {/* Share PIN */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Set Share PIN <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="password"
                  inputMode="numeric"
                  placeholder="4–6 digit PIN"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                  className="border-slate-300 rounded-sm focus-visible:ring-[#003580]"
                />
                <p className="text-[11px] text-slate-500">The recipient will need this PIN to view the document.</p>
              </div>

              {/* Duration */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Link Valid For
                </Label>
                <div className="flex gap-2">
                  {DURATIONS.map((d) => (
                    <button
                      key={d.value}
                      onClick={() => setDuration(d.value)}
                      className={`flex-1 py-2 text-xs font-semibold border rounded-sm transition-colors ${
                        duration === d.value
                          ? 'bg-[#003580] text-white border-[#003580]'
                          : 'bg-white text-slate-700 border-slate-300 hover:border-[#003580]'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notice */}
              <div className="p-3 bg-[#fff8e1] border-l-4 border-[#f9a825]">
                <p className="text-xs text-[#5d4037]">
                  <strong>Important:</strong> This link will expire automatically after {duration} hour{duration > 1 ? 's' : ''}.
                  Share only with trusted individuals.
                </p>
              </div>

              <Button
                onClick={handleCreate}
                disabled={loading || pin.length < 4}
                className="w-full bg-[#003580] hover:bg-[#002060] text-white font-semibold rounded-sm"
              >
                {loading ? 'Generating…' : <><QrCode className="h-4 w-4 mr-2" /> Generate QR Code</>}
              </Button>
            </>
          ) : (
            /* ── QR Code display ── */
            <>
              <div className="flex flex-col items-center gap-3 py-2">
                <div className="p-3 bg-white border-2 border-[#003580] rounded-sm inline-block">
                  <QRCode data={shareUrl} size={180} errorCorrectionLevel="M" />
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-[#138808]">
                    <CheckCircle className="h-4 w-4" />
                    <p className="text-sm font-semibold">Share link created!</p>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Expires in {duration} hour{duration > 1 ? 's' : ''}</p>
                </div>
              </div>

              {/* Link copy */}
              <div className="flex gap-2">
                <Input
                  value={shareUrl}
                  readOnly
                  className="text-xs border-slate-300 rounded-sm bg-slate-50 flex-1"
                />
                <Button
                  onClick={copyLink}
                  variant="outline"
                  className="shrink-0 border-[#003580] text-[#003580] rounded-sm hover:bg-blue-50"
                >
                  {copied ? <CheckCircle className="h-4 w-4 text-[#138808]" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>

              <div className="p-3 bg-[#e8f5e9] border-l-4 border-[#138808]">
                <p className="text-xs text-[#1b5e20]">
                  <strong>Reminder:</strong> The recipient will need the PIN you set: <strong>{'•'.repeat(pin.length)}</strong>.
                  Share the PIN separately from the link.
                </p>
              </div>

              <Button onClick={handleClose} variant="outline" className="w-full border-slate-300 rounded-sm text-sm">
                Done
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
