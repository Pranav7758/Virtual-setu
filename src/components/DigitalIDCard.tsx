import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, Download, Shield, User, Mail, Phone, Hash } from 'lucide-react';
import QRCode from '@/components/QRCode';

interface DigitalIDCardProps {
  name: string;
  email: string;
  phone: string;
  userId: string;
  photoUrl?: string;
  memberSince?: string;
  shareUrl: string;
}

export default function DigitalIDCard({
  name,
  email,
  phone,
  userId,
  photoUrl,
  memberSince,
  shareUrl,
}: DigitalIDCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!cardRef.current) return;

    const html2canvas = (await import('html2canvas')).default;
    const jsPDF = (await import('jspdf')).default;

    const canvas = await html2canvas(cardRef.current, {
      scale: 3,
      useCORS: true,
      backgroundColor: null,
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [100, 60],
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`VirtualSetu_ID_${userId.slice(0, 8).toUpperCase()}.pdf`);
  };

  const cardId = userId.slice(0, 8).toUpperCase();

  return (
    <div className="flex flex-col items-center gap-6">
      {/* ID Card — targeted by print & html2canvas */}
      <div
        ref={cardRef}
        id="digital-id-card"
        className="relative w-[340px] rounded-2xl overflow-hidden shadow-2xl select-none"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
        }}
      >
        {/* Top stripe — saffron accent */}
        <div
          className="h-1.5 w-full"
          style={{ background: 'linear-gradient(90deg, #f97316, #facc15, #22c55e)' }}
        />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <div className="flex items-center gap-2">
            <div
              className="p-1.5 rounded-lg"
              style={{ background: 'linear-gradient(135deg, #0ea5e9, #2563eb)' }}
            >
              <Shield className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-white tracking-wider leading-none">
                VIRTUAL SETU
              </p>
              <p className="text-[9px] text-sky-300 leading-none mt-0.5">
                Digital Identity Card
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[8px] text-slate-400 uppercase tracking-widest">ID No.</p>
            <p className="text-[11px] font-mono font-bold text-sky-300">{cardId}</p>
          </div>
        </div>

        {/* Divider */}
        <div
          className="mx-5 mb-4"
          style={{ height: '1px', background: 'rgba(56, 189, 248, 0.2)' }}
        />

        {/* Body */}
        <div className="flex items-start gap-4 px-5 pb-4">
          {/* Photo */}
          <div
            className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #1e40af, #0ea5e9)',
              border: '2px solid rgba(56, 189, 248, 0.4)',
            }}
          >
            {photoUrl ? (
              <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="h-8 w-8 text-sky-200" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm leading-tight truncate">
              {name || 'Name Not Provided'}
            </p>
            <p className="text-[9px] text-slate-400 uppercase tracking-wider mt-0.5 mb-2">
              Registered Member
            </p>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <Mail className="h-2.5 w-2.5 text-sky-400 flex-shrink-0" />
                <p className="text-[9px] text-slate-300 truncate">{email}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="h-2.5 w-2.5 text-sky-400 flex-shrink-0" />
                <p className="text-[9px] text-slate-300">{phone || 'Not provided'}</p>
              </div>
              {memberSince && (
                <div className="flex items-center gap-1.5">
                  <Hash className="h-2.5 w-2.5 text-sky-400 flex-shrink-0" />
                  <p className="text-[9px] text-slate-300">Since {memberSince}</p>
                </div>
              )}
            </div>
          </div>

          {/* QR Code */}
          <div
            className="flex-shrink-0 p-1.5 rounded-lg"
            style={{ background: 'white' }}
          >
            <QRCode data={shareUrl} size={56} />
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-5 py-2"
          style={{ background: 'rgba(14, 165, 233, 0.08)' }}
        >
          <p className="text-[8px] text-slate-500 uppercase tracking-widest">
            Govt. of India Initiative
          </p>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <p className="text-[8px] text-green-400 font-medium">Verified</p>
          </div>
        </div>

        {/* Bottom stripe */}
        <div
          className="h-1 w-full"
          style={{ background: 'linear-gradient(90deg, #0ea5e9, #2563eb, #7c3aed)' }}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 no-print">
        <Button
          onClick={handlePrint}
          variant="outline"
          className="bg-card-glass/50 backdrop-blur-xl border-border/20 gap-2"
        >
          <Printer className="h-4 w-4" />
          Print ID Card
        </Button>
        <Button
          onClick={handleDownloadPDF}
          className="bg-gradient-to-r from-sky-500 to-blue-600 text-white gap-2 hover:opacity-90"
        >
          <Download className="h-4 w-4" />
          Download PDF
        </Button>
      </div>
    </div>
  );
}
