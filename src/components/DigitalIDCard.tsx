import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, Download, Shield, CheckCircle } from 'lucide-react';
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

  const cardId = userId
    ? userId.slice(0, 10).toUpperCase().match(/.{1,4}/g)?.join(' ')
    : 'XXXX XXXX XX';
  const qrData = shareUrl || `${window.location.origin}/i/${userId}`;

  const handlePrint = () => window.print();

  const handleDownloadPDF = async () => {
    if (!cardRef.current) return;
    try {
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 4,
        cacheBust: true,
        backgroundColor: '#f0f6ff',
      });
      const link = document.createElement('a');
      link.download = `VirtualSetu_ID_${userId.slice(0, 8).toUpperCase()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/*
        PAN card ISO/IEC 7810 ID-1: 85.6 × 53.98 mm
        At 96 dpi × 1.5 scale → 487 × 307 px   (use 480 × 303)
        Aspect ratio: 85.6 / 53.98 ≈ 1.5857
      */}
      <div
        ref={cardRef}
        className="relative select-none overflow-hidden"
        style={{
          width: 480,
          height: 303,
          borderRadius: 10,
          background: 'linear-gradient(160deg, #f0f6ff 0%, #e4eefa 55%, #d8edf8 100%)',
          border: '1.5px solid #93c5e8',
          boxShadow: '0 8px 32px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.12)',
          fontFamily: '"Segoe UI", system-ui, sans-serif',
        }}
      >
        {/* ── Top tricolor stripe (3 px) ── */}
        <div style={{ display: 'flex', height: 4, width: '100%' }}>
          <div style={{ flex: 1, background: '#FF9933' }} />
          <div style={{ flex: 1, background: '#FFFFFF' }} />
          <div style={{ flex: 1, background: '#138808' }} />
        </div>

        {/* ── Header bar ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '5px 14px',
            background: 'linear-gradient(90deg, #00266e 0%, #0047ab 100%)',
          }}
        >
          {/* Left: logo + title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                padding: 3,
                borderRadius: 5,
                background: 'rgba(255,255,255,0.18)',
                display: 'flex',
              }}
            >
              <Shield style={{ width: 13, height: 13, color: 'white' }} />
            </div>
            <div>
              <p style={{ color: 'white', fontWeight: 800, fontSize: 10, letterSpacing: '0.18em', lineHeight: 1, textTransform: 'uppercase', margin: 0 }}>
                Virtual Setu
              </p>
              <p style={{ color: '#93c5fd', fontSize: 7, letterSpacing: '0.06em', lineHeight: 1, marginTop: 2, margin: 0 }}>
                Digital Identity Authority of India
              </p>
            </div>
          </div>
          {/* Right: "Govt of India" */}
          <div style={{ textAlign: 'right' }}>
            <p style={{ color: '#bfdbfe', fontSize: 7, letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
              Government of India
            </p>
            <p style={{ color: 'white', fontSize: 8, fontWeight: 600, margin: 0, marginTop: 1 }}>
              भारत सरकार
            </p>
          </div>
        </div>

        {/* ── "DIGITAL IDENTITY CARD" centre label ── */}
        <div style={{ textAlign: 'center', paddingTop: 7 }}>
          <span
            style={{
              display: 'inline-block',
              fontSize: 7.5,
              fontWeight: 700,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: 'white',
              background: '#00266e',
              borderRadius: 20,
              padding: '2px 10px',
            }}
          >
            Digital Identity Card
          </span>
        </div>

        {/* ── Main body: info + QR ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            padding: '8px 14px 0 14px',
            gap: 10,
          }}
        >
          {/* Left: field grid */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {/* Name */}
            <div>
              <p style={{ fontSize: 7, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
                Name / नाम
              </p>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: 0, marginTop: 1, lineHeight: 1.1 }}>
                {name || 'Name Not Provided'}
              </p>
            </div>

            {/* Email */}
            <div>
              <p style={{ fontSize: 7, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
                Email Address
              </p>
              <p style={{ fontSize: 9, color: '#1e3a5f', margin: 0, marginTop: 1 }}>
                {email || '—'}
              </p>
            </div>

            {/* Mobile */}
            <div>
              <p style={{ fontSize: 7, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
                Mobile / मोबाइल
              </p>
              <p style={{ fontSize: 9, color: '#1e3a5f', margin: 0, marginTop: 1 }}>
                {phone || 'Not provided'}
              </p>
            </div>

            {/* Enrolled since */}
            {memberSince && (
              <div>
                <p style={{ fontSize: 7, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
                  Enrolled Since
                </p>
                <p style={{ fontSize: 9, color: '#1e3a5f', margin: 0, marginTop: 1 }}>
                  {memberSince}
                </p>
              </div>
            )}
          </div>

          {/* Right: QR Code */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flexShrink: 0 }}>
            <div
              style={{
                padding: 4,
                background: 'white',
                borderRadius: 6,
                border: '1.5px solid #93c5e8',
                boxShadow: '0 1px 6px rgba(0,0,0,0.1)',
              }}
            >
              <QRCode data={qrData} size={92} errorCorrectionLevel="M" />
            </div>
            <p style={{ fontSize: 6.5, color: '#9ca3af', textAlign: 'center', margin: 0 }}>
              Scan to verify
            </p>
          </div>
        </div>

        {/* ── ID number row ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            margin: '8px 14px 0 14px',
            padding: '5px 10px',
            borderRadius: 6,
            background: 'rgba(0, 38, 110, 0.07)',
            border: '1px solid rgba(0,38,110,0.13)',
          }}
        >
          <div>
            <p style={{ fontSize: 6.5, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0 }}>
              ID Number
            </p>
            <p
              style={{
                fontFamily: '"Courier New", monospace',
                fontWeight: 700,
                fontSize: 14,
                letterSpacing: '0.2em',
                color: '#00266e',
                margin: 0,
                marginTop: 1,
              }}
            >
              {cardId}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <CheckCircle style={{ width: 11, height: 11, color: '#16a34a' }} />
            <span style={{ fontSize: 7.5, color: '#15803d', fontWeight: 600 }}>Verified</span>
          </div>
        </div>

        {/* ── Footer ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '5px 14px',
            marginTop: 6,
            borderTop: '1px solid rgba(0,38,110,0.1)',
            background: 'rgba(0,38,110,0.04)',
          }}
        >
          <p style={{ fontSize: 6.5, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
            Digitally issued identity document
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e' }} />
            <p style={{ fontSize: 7, color: '#16a34a', fontWeight: 600, margin: 0 }}>Active</p>
          </div>
        </div>

        {/* ── Bottom tricolor stripe (3 px) ── */}
        <div style={{ display: 'flex', height: 4, width: '100%', position: 'absolute', bottom: 0, left: 0 }}>
          <div style={{ flex: 1, background: '#FF9933' }} />
          <div style={{ flex: 1, background: '#FFFFFF' }} />
          <div style={{ flex: 1, background: '#138808' }} />
        </div>
      </div>

      {/* ── Action buttons ── */}
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
          className="bg-gradient-to-r from-blue-700 to-blue-800 text-white gap-2 hover:opacity-90"
        >
          <Download className="h-4 w-4" />
          Download Card
        </Button>
      </div>
    </div>
  );
}
