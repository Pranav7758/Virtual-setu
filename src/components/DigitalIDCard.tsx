import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, Download, Shield, Mail, Phone, Hash, CheckCircle } from 'lucide-react';
import QRCode from '@/components/QRCode';

interface DigitalIDCardProps {
  name: string;
  email: string;
  phone: string;
  userId: string;
  memberSince?: string;
  shareUrl?: string;
}

export default function DigitalIDCard({
  name,
  email,
  phone,
  userId,
  memberSince,
  shareUrl,
}: DigitalIDCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const cardId = userId ? userId.slice(0, 8).toUpperCase().match(/.{1,4}/g)?.join(' ') : 'XXXX XXXX';
  const qrData = shareUrl || `${window.location.origin}/i/${userId}`;

  const handlePrint = () => window.print();

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
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [100, 60] });
    pdf.addImage(imgData, 'PNG', 0, 0, 100, 60);
    pdf.save(`VirtualSetu_ID_${userId.slice(0, 8).toUpperCase()}.pdf`);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* ── FRONT of card ── */}
      <div
        ref={cardRef}
        className="relative w-[380px] rounded-2xl overflow-hidden select-none"
        style={{
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          background: 'linear-gradient(135deg, #fafafa 0%, #e8f4fd 60%, #d4eaf7 100%)',
          border: '1px solid #b8d8f0',
          fontFamily: '"Segoe UI", system-ui, sans-serif',
        }}
      >
        {/* Top tricolor stripe */}
        <div className="h-2 w-full flex">
          <div className="flex-1" style={{ background: '#FF9933' }} />
          <div className="flex-1" style={{ background: '#FFFFFF' }} />
          <div className="flex-1" style={{ background: '#138808' }} />
        </div>

        {/* Header bar */}
        <div
          className="flex items-center justify-between px-4 py-2.5"
          style={{ background: 'linear-gradient(90deg, #003580 0%, #0059b3 100%)' }}
        >
          <div className="flex items-center gap-2">
            <div className="p-1 bg-white/20 rounded-lg">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-[11px] tracking-widest leading-none uppercase">
                Virtual Setu
              </p>
              <p className="text-sky-200 text-[8px] leading-none mt-0.5 tracking-wider">
                Digital Identity Authority of India
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sky-300 text-[7px] uppercase tracking-widest">Government of India</p>
            <p className="text-white text-[8px] font-semibold mt-0.5">भारत सरकार</p>
          </div>
        </div>

        {/* Card body */}
        <div className="px-5 pt-4 pb-3">
          {/* Card type label */}
          <div className="text-center mb-3">
            <span
              className="text-[9px] font-bold tracking-[0.3em] uppercase px-3 py-0.5 rounded-full"
              style={{ background: '#003580', color: 'white' }}
            >
              Digital Identity Card
            </span>
          </div>

          {/* Main content: info left, QR right */}
          <div className="flex items-start gap-4">
            {/* Left: identity info */}
            <div className="flex-1 space-y-2.5">
              {/* Name */}
              <div>
                <p className="text-[8px] text-gray-500 uppercase tracking-wider font-semibold">Name / नाम</p>
                <p className="text-gray-900 font-bold text-sm leading-tight mt-0.5">
                  {name || 'Name Not Provided'}
                </p>
              </div>

              {/* Email */}
              <div>
                <p className="text-[8px] text-gray-500 uppercase tracking-wider font-semibold">Email Address</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Mail className="h-2.5 w-2.5 text-blue-600 flex-shrink-0" />
                  <p className="text-gray-700 text-[10px] truncate">{email || '—'}</p>
                </div>
              </div>

              {/* Phone */}
              <div>
                <p className="text-[8px] text-gray-500 uppercase tracking-wider font-semibold">Mobile / मोबाइल</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Phone className="h-2.5 w-2.5 text-blue-600 flex-shrink-0" />
                  <p className="text-gray-700 text-[10px]">{phone || 'Not provided'}</p>
                </div>
              </div>

              {/* Member since */}
              {memberSince && (
                <div>
                  <p className="text-[8px] text-gray-500 uppercase tracking-wider font-semibold">Enrolled Since</p>
                  <p className="text-gray-700 text-[10px] mt-0.5">{memberSince}</p>
                </div>
              )}
            </div>

            {/* Right: QR Code */}
            <div className="flex-shrink-0 flex flex-col items-center gap-1">
              <div
                className="p-1.5 rounded-xl"
                style={{
                  background: 'white',
                  border: '1.5px solid #b8d8f0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
              >
                <QRCode data={qrData} size={80} />
              </div>
              <p className="text-[7px] text-gray-400 text-center leading-tight">
                Scan to verify
              </p>
            </div>
          </div>

          {/* ID number row */}
          <div
            className="mt-3 px-3 py-2 rounded-xl flex items-center justify-between"
            style={{ background: 'rgba(0, 53, 128, 0.06)', border: '1px solid rgba(0,53,128,0.12)' }}
          >
            <div>
              <p className="text-[7px] text-gray-400 uppercase tracking-wider">ID Number</p>
              <p
                className="font-mono font-bold text-sm tracking-[0.15em] mt-0.5"
                style={{ color: '#003580' }}
              >
                {cardId}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-600" />
              <span className="text-[8px] text-green-700 font-semibold">Verified</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-5 py-2"
          style={{ background: 'rgba(0, 53, 128, 0.05)', borderTop: '1px solid rgba(0,53,128,0.1)' }}
        >
          <p className="text-[7px] text-gray-400 uppercase tracking-widest">
            This is a digitally issued identity document
          </p>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <p className="text-[7px] text-green-600 font-semibold">Active</p>
          </div>
        </div>

        {/* Bottom tricolor stripe */}
        <div className="h-1.5 w-full flex">
          <div className="flex-1" style={{ background: '#FF9933' }} />
          <div className="flex-1" style={{ background: '#FFFFFF', borderTop: '1px solid #ddd' }} />
          <div className="flex-1" style={{ background: '#138808' }} />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 no-print">
        <Button
          onClick={handlePrint}
          variant="outline"
          className="bg-card-glass/50 backdrop-blur-xl border-border/20 gap-2"
        >
          <Printer className="h-4 w-4" />
          Print
        </Button>
        <Button
          onClick={handleDownloadPDF}
          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white gap-2 hover:opacity-90"
        >
          <Download className="h-4 w-4" />
          Download PDF
        </Button>
      </div>
    </div>
  );
}
