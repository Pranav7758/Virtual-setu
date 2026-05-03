import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, Download, Shield, CheckCircle, RotateCcw } from 'lucide-react';
import QRCode from '@/components/QRCode';

interface DigitalIDCardProps {
  name: string;
  phone: string;
  userId: string;
  memberSince?: string;
  shareUrl?: string;
  aadhaarMasked?: string;
  aadhaarAddress?: string;
  dob?: string;
  aadhaarVerified?: boolean;
}

const SAFFRON = '#FF9933';
const WHITE   = '#FFFFFF';
const GREEN   = '#138808';
const NAVY    = '#00266e';
const BLUE    = '#0047ab';

function Tricolor({ pos }: { pos: 'top' | 'bottom' }) {
  const style: React.CSSProperties = {
    display: 'flex', height: 5, width: '100%',
    ...(pos === 'bottom' ? { position: 'absolute', bottom: 0, left: 0 } : {}),
  };
  return (
    <div style={style}>
      <div style={{ flex: 1, background: SAFFRON }} />
      <div style={{ flex: 1, background: WHITE, borderTop: pos === 'bottom' ? '1px solid #e5e7eb' : undefined }} />
      <div style={{ flex: 1, background: GREEN }} />
    </div>
  );
}

function CardHeader() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '5px 14px',
      background: `linear-gradient(90deg, ${NAVY} 0%, ${BLUE} 100%)`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        {/* Ashoka Chakra symbol */}
        <div style={{
          width: 26, height: 26, borderRadius: '50%',
          background: 'rgba(255,255,255,0.15)',
          border: '1.5px solid rgba(255,255,255,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 14, lineHeight: 1 }}>☸</span>
        </div>
        <div>
          <p style={{ color: WHITE, fontWeight: 800, fontSize: 9.5, letterSpacing: '0.2em', lineHeight: 1, textTransform: 'uppercase', margin: 0 }}>
            Virtual Setu
          </p>
          <p style={{ color: '#93c5fd', fontSize: 6.5, letterSpacing: '0.05em', lineHeight: 1, marginTop: 2, margin: '2px 0 0 0' }}>
            Digital Identity Authority of India
          </p>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <p style={{ color: '#bfdbfe', fontSize: 6.5, letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0 }}>
          Government of India
        </p>
        <p style={{ color: WHITE, fontSize: 8.5, fontWeight: 700, margin: '2px 0 0 0' }}>भारत सरकार</p>
      </div>
    </div>
  );
}

export default function DigitalIDCard({
  name, phone, userId, memberSince, shareUrl,
  aadhaarMasked, aadhaarAddress, dob, aadhaarVerified,
}: DigitalIDCardProps) {
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef  = useRef<HTMLDivElement>(null);
  const [flipped, setFlipped] = useState(false);

  const qrData = shareUrl || `${window.location.origin}/i/${userId}`;
  const displayAadhaar = aadhaarMasked || 'XXXX XXXX XXXX';

  const CARD_W = 480;
  const CARD_H = 303;
  const CARD_STYLE: React.CSSProperties = {
    width: CARD_W, height: CARD_H, borderRadius: 10,
    border: '1.5px solid #93c5e8',
    boxShadow: '0 8px 32px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.12)',
    fontFamily: '"Segoe UI", system-ui, sans-serif',
    position: 'absolute', top: 0, left: 0,
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    overflow: 'hidden',
  };

  const handleDownload = async (ref: React.RefObject<HTMLDivElement>, side: string) => {
    if (!ref.current) return;
    try {
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(ref.current, { pixelRatio: 4, cacheBust: true });
      const link = document.createElement('a');
      link.download = `VirtualSetu_ID_${side}_${userId.slice(0, 8).toUpperCase()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) { console.error('Download error:', err); }
  };

  return (
    <div className="flex flex-col items-center gap-5">
      {/* 3-D flip container */}
      <div style={{ width: CARD_W, height: CARD_H, perspective: 1200, cursor: 'pointer' }}
           onClick={() => setFlipped(f => !f)}>
        <div style={{
          width: '100%', height: '100%', position: 'relative',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.65s cubic-bezier(0.4,0.2,0.2,1)',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}>

          {/* ══════════════ FRONT ══════════════ */}
          <div ref={frontRef} style={{
            ...CARD_STYLE,
            background: 'linear-gradient(160deg, #f0f6ff 0%, #e4eefa 55%, #d8edf8 100%)',
          }}>
            <Tricolor pos="top" />
            <CardHeader />

            {/* "DIGITAL IDENTITY CARD" label */}
            <div style={{ textAlign: 'center', paddingTop: 6 }}>
              <span style={{
                display: 'inline-block', fontSize: 7, fontWeight: 700,
                letterSpacing: '0.3em', textTransform: 'uppercase',
                color: WHITE, background: NAVY, borderRadius: 20, padding: '2px 10px',
              }}>Digital Identity Card</span>
            </div>

            {/* Body */}
            <div style={{ display: 'flex', alignItems: 'flex-start', padding: '7px 14px 0 14px', gap: 10 }}>
              {/* Left: fields */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div>
                  <p style={{ fontSize: 6.5, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Name / नाम</p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: '1px 0 0 0', lineHeight: 1.1 }}>
                    {name || 'Name Not Provided'}
                  </p>
                </div>
                {dob && (
                  <div>
                    <p style={{ fontSize: 6.5, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>DOB / जन्म तिथि</p>
                    <p style={{ fontSize: 9, color: '#1e3a5f', margin: '1px 0 0 0' }}>{dob}</p>
                  </div>
                )}
                <div>
                  <p style={{ fontSize: 6.5, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Mobile / मोबाइल</p>
                  <p style={{ fontSize: 9, color: '#1e3a5f', margin: '1px 0 0 0' }}>{phone || 'Not provided'}</p>
                </div>
                {memberSince && (
                  <div>
                    <p style={{ fontSize: 6.5, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Enrolled Since</p>
                    <p style={{ fontSize: 9, color: '#1e3a5f', margin: '1px 0 0 0' }}>{memberSince}</p>
                  </div>
                )}
              </div>

              {/* Right: QR */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                <div style={{
                  padding: 4, background: WHITE, borderRadius: 6,
                  border: '1.5px solid #93c5e8', boxShadow: '0 1px 6px rgba(0,0,0,0.1)',
                }}>
                  <QRCode data={qrData} size={88} errorCorrectionLevel="M" />
                </div>
                <p style={{ fontSize: 6, color: '#9ca3af', textAlign: 'center', margin: 0 }}>Scan to verify</p>
              </div>
            </div>

            {/* Aadhaar number row */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              margin: '7px 14px 0 14px', padding: '5px 10px',
              borderRadius: 6, background: 'rgba(0,38,110,0.07)',
              border: '1px solid rgba(0,38,110,0.13)',
            }}>
              <div>
                <p style={{ fontSize: 6, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0 }}>
                  Aadhaar No / आधार संख्या
                </p>
                <p style={{
                  fontFamily: '"Courier New", monospace', fontWeight: 700,
                  fontSize: 15, letterSpacing: '0.22em', color: NAVY, margin: '1px 0 0 0',
                }}>
                  {displayAadhaar}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <CheckCircle style={{ width: 11, height: 11, color: '#16a34a' }} />
                <span style={{ fontSize: 7, color: '#15803d', fontWeight: 700 }}>
                  {aadhaarVerified ? 'Aadhaar Verified' : 'Verified'}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '4px 14px', marginTop: 5,
              borderTop: '1px solid rgba(0,38,110,0.1)',
              background: 'rgba(0,38,110,0.04)',
            }}>
              <p style={{ fontSize: 6, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
                Digitally issued · Click card to view back
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e' }} />
                <p style={{ fontSize: 6.5, color: '#16a34a', fontWeight: 600, margin: 0 }}>Active</p>
              </div>
            </div>

            <Tricolor pos="bottom" />
          </div>

          {/* ══════════════ BACK ══════════════ */}
          <div ref={backRef} style={{
            ...CARD_STYLE,
            background: 'linear-gradient(160deg, #f5f0ff 0%, #ede8ff 55%, #e0d8f8 100%)',
            transform: 'rotateY(180deg)',
          }}>
            <Tricolor pos="top" />
            <CardHeader />

            {/* Magnetic stripe look */}
            <div style={{ height: 22, background: 'linear-gradient(90deg, #1e1e2e 0%, #2d2d3e 100%)', margin: '6px 0 0 0' }} />

            {/* Address section */}
            <div style={{ padding: '7px 14px 0 14px' }}>
              <p style={{ fontSize: 6.5, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0, fontWeight: 600 }}>
                Registered Address / पंजीकृत पता
              </p>
              <p style={{
                fontSize: 8.5, color: '#1e3a5f', margin: '3px 0 0 0', lineHeight: 1.45,
                minHeight: 36,
                display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>
                {aadhaarAddress || 'Address not available — Aadhaar verification required'}
              </p>
            </div>

            {/* Signature + Validity row */}
            <div style={{
              display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
              padding: '8px 14px 0 14px',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ borderBottom: '1px solid #94a3b8', width: 120, marginBottom: 2 }} />
                <p style={{ fontSize: 6.5, color: '#6b7280', margin: 0 }}>Authorised Signature</p>
                <p style={{ fontSize: 6.5, color: '#6b7280', margin: '1px 0 0 0' }}>Digital Identity Authority of India</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 6.5, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Valid From</p>
                <p style={{ fontSize: 8.5, color: NAVY, fontWeight: 600, margin: '1px 0 0 0' }}>{memberSince || '—'}</p>
                <p style={{ fontSize: 6.5, color: GREEN, fontWeight: 600, margin: '1px 0 0 0' }}>LIFETIME VALIDITY</p>
              </div>
            </div>

            {/* MRZ-style strip */}
            <div style={{
              margin: '7px 14px 0 14px', padding: '4px 8px',
              background: 'rgba(0,38,110,0.06)', borderRadius: 4,
              borderTop: '1px solid rgba(0,38,110,0.12)',
            }}>
              <p style={{
                fontFamily: '"Courier New", monospace', fontSize: 6.5,
                color: '#475569', letterSpacing: '0.08em', margin: 0,
                overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
              }}>
                {`IDIN<<${(name || 'HOLDER').toUpperCase().replace(/\s+/g, '<')}<<<<<<<<`.slice(0, 44)}
              </p>
              <p style={{
                fontFamily: '"Courier New", monospace', fontSize: 6.5,
                color: '#475569', letterSpacing: '0.08em', margin: '2px 0 0 0',
                overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
              }}>
                {`${displayAadhaar.replace(/\s/g, '')}IND${(dob || '000000').replace(/\//g, '')}`.slice(0, 44)}
              </p>
            </div>

            {/* Footer */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '4px 14px', marginTop: 5,
              borderTop: '1px solid rgba(0,38,110,0.1)',
              background: 'rgba(0,38,110,0.04)',
            }}>
              <p style={{ fontSize: 6, color: '#9ca3af', margin: 0 }}>
                If found, please return to nearest Government office
              </p>
              <p style={{ fontSize: 6, color: '#9ca3af', margin: 0 }}>virtualsetu.gov.in</p>
            </div>

            <Tricolor pos="bottom" />
          </div>
        </div>
      </div>

      {/* Hint */}
      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        <RotateCcw className="h-3 w-3" />
        Click card to flip · Front shows Aadhaar number · Back shows address
      </p>

      {/* Buttons */}
      <div className="flex gap-3 no-print">
        <Button onClick={() => window.print()} variant="outline"
          className="bg-card-glass/50 backdrop-blur-xl border-border/20 gap-2">
          <Printer className="h-4 w-4" /> Print
        </Button>
        <Button
          onClick={() => handleDownload(flipped ? backRef : frontRef, flipped ? 'back' : 'front')}
          className="bg-gradient-to-r from-blue-700 to-blue-800 text-white gap-2 hover:opacity-90"
        >
          <Download className="h-4 w-4" /> Download {flipped ? 'Back' : 'Front'}
        </Button>
      </div>
    </div>
  );
}
