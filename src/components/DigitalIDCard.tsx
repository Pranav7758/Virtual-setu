import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, Download, RotateCcw, CheckCircle2 } from 'lucide-react';
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
  photoUrl?: string;
  bloodGroup?: string;
  _forceFlipped?: boolean;
}

/* ISO ID-1 = 85.6 × 54 mm  →  480 × 302 px */
const W = 480;
const H = 302;

const SAFFRON = '#FF9933';
const GREEN   = '#138808';
const NAVY    = '#003580';
const BLUE    = '#0047ab';
const WHITE   = '#FFFFFF';

function Tricolor() {
  return (
    <div style={{ display: 'flex', height: 4, width: '100%', flexShrink: 0 }}>
      <div style={{ flex: 1, background: SAFFRON }} />
      <div style={{ flex: 1, background: WHITE, borderTop: '0.5px solid #dde3ea', borderBottom: '0.5px solid #dde3ea' }} />
      <div style={{ flex: 1, background: GREEN }} />
    </div>
  );
}

function Header() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '5px 12px', flexShrink: 0,
      background: `linear-gradient(90deg, ${NAVY} 0%, ${BLUE} 100%)`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{
          width: 24, height: 24, borderRadius: '50%',
          border: '1.5px solid rgba(255,255,255,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(255,255,255,0.1)', flexShrink: 0,
        }}>
          <span style={{ fontSize: 13, lineHeight: 1, color: 'rgba(255,255,255,0.9)' }}>☸</span>
        </div>
        <div>
          <p style={{ color: WHITE, fontWeight: 800, fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', margin: 0, lineHeight: 1 }}>Virtual Setu</p>
          <p style={{ color: '#93c5fd', fontSize: 6, letterSpacing: '0.04em', margin: '2px 0 0 0', lineHeight: 1 }}>Digital Identity Authority of India</p>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <p style={{ color: '#bfdbfe', fontSize: 6, letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>Government of India</p>
        <p style={{ color: WHITE, fontSize: 8, fontWeight: 700, margin: '2px 0 0 0', lineHeight: 1 }}>भारत सरकार</p>
      </div>
    </div>
  );
}

/* Initials block shown when no photo uploaded */
function InitialsAvatar({ name, w, h }: { name: string; w: number; h: number }) {
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0].toUpperCase()).join('');
  return (
    <div style={{
      width: w, height: h, borderRadius: 6, flexShrink: 0,
      background: `linear-gradient(135deg, ${NAVY} 0%, ${BLUE} 100%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: '1.5px solid #93aec8',
    }}>
      <span style={{ color: WHITE, fontSize: w * 0.34, fontWeight: 700, letterSpacing: '0.04em' }}>{initials || '?'}</span>
    </div>
  );
}

export default function DigitalIDCard({
  name, phone, userId, memberSince, shareUrl,
  aadhaarMasked, aadhaarAddress, dob, aadhaarVerified,
  photoUrl, bloodGroup, _forceFlipped,
}: DigitalIDCardProps) {
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef  = useRef<HTMLDivElement>(null);
  const [flipped, setFlipped] = useState(_forceFlipped ?? false);

  React.useEffect(() => {
    if (_forceFlipped !== undefined) setFlipped(_forceFlipped);
  }, [_forceFlipped]);

  const qrData         = shareUrl || `${window.location.origin}/i/${userId}`;
  const displayAadhaar = aadhaarMasked || 'XXXX XXXX XXXX';
  const shortId        = userId.slice(0, 8).toUpperCase();

  const CARD: React.CSSProperties = {
    width: W, height: H, borderRadius: 12,
    border: '1px solid #b0c4de',
    boxShadow: '0 10px 40px rgba(0,0,0,0.2), 0 2px 8px rgba(0,0,0,0.1)',
    fontFamily: '"Segoe UI", system-ui, sans-serif',
    position: 'absolute', top: 0, left: 0,
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    overflow: 'hidden', userSelect: 'none',
    display: 'flex', flexDirection: 'column',
  };

  const handleDownload = async (ref: React.RefObject<HTMLDivElement>, side: string) => {
    if (!ref.current) return;
    try {
      const { toPng } = await import('html-to-image');
      const url = await toPng(ref.current, { pixelRatio: 4, cacheBust: true });
      const a = document.createElement('a');
      a.download = `VirtualSetu_ID_${side}_${shortId}.png`;
      a.href = url; a.click();
    } catch (e) { console.error(e); }
  };

  const PH = 116;  /* photo height */
  const PW = 92;   /* photo width  */

  return (
    <div className="flex flex-col items-center gap-4">
      <div style={{ width: W, height: H, perspective: 1400, cursor: 'pointer' }}
           onClick={() => setFlipped(f => !f)}>
        <div style={{
          width: '100%', height: '100%', position: 'relative',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.65s cubic-bezier(0.4,0.2,0.2,1)',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}>

          {/* ══════════════ FRONT ══════════════ */}
          <div ref={frontRef} style={{
            ...CARD,
            background: 'linear-gradient(150deg, #f0f6ff 0%, #e4eefa 60%, #d6e8f7 100%)',
          }}>
            <Tricolor />
            <Header />

            {/* DIGITAL IDENTITY CARD pill */}
            <div style={{ textAlign: 'center', padding: '3px 0 2px', flexShrink: 0 }}>
              <span style={{
                display: 'inline-block', fontSize: 6, fontWeight: 700,
                letterSpacing: '0.3em', textTransform: 'uppercase',
                color: WHITE, background: NAVY, borderRadius: 20, padding: '2px 10px',
              }}>Digital Identity Card</span>
            </div>

            {/* ── Body: photo | fields | QR ── */}
            <div style={{ flex: 1, display: 'flex', gap: 11, padding: '7px 13px 6px 13px', minHeight: 0, alignItems: 'center' }}>

              {/* LEFT — photo only */}
              <div style={{ flexShrink: 0 }}>
                {photoUrl
                  ? <img src={photoUrl} alt={name} style={{ width: PW, height: PH, objectFit: 'cover', borderRadius: 6, border: '1.5px solid #93aec8', display: 'block' }} />
                  : <InitialsAvatar name={name} w={PW} h={PH} />
                }
              </div>

              {/* MIDDLE — all fields, tightly packed */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 }}>

                {/* Name + Blood Group on same row */}
                <div>
                  <p style={{ fontSize: 5.5, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0, lineHeight: 1 }}>Name / नाम</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2, flexWrap: 'wrap' }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0, lineHeight: 1.1 }}>{name || '—'}</p>
                    {bloodGroup && (
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 2,
                        padding: '2px 7px', borderRadius: 20,
                        background: '#fef2f2', border: '1px solid #fca5a5',
                        flexShrink: 0,
                      }}>
                        <span style={{ fontSize: 8 }}>🩸</span>
                        <span style={{ fontSize: 9, fontWeight: 800, color: '#dc2626', letterSpacing: '0.05em' }}>{bloodGroup}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* DOB + Mobile row */}
                <div style={{ display: 'flex', gap: 16 }}>
                  {dob && (
                    <div>
                      <p style={{ fontSize: 5.5, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0, lineHeight: 1 }}>Date of Birth / जन्म तिथि</p>
                      <p style={{ fontSize: 8.5, fontWeight: 500, color: '#1e3a5f', margin: '1.5px 0 0 0', lineHeight: 1 }}>{dob}</p>
                    </div>
                  )}
                  <div>
                    <p style={{ fontSize: 5.5, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0, lineHeight: 1 }}>Mobile / मोबाइल</p>
                    <p style={{ fontSize: 8.5, fontWeight: 500, color: '#1e3a5f', margin: '1.5px 0 0 0', lineHeight: 1 }}>{phone || '—'}</p>
                  </div>
                </div>

                {/* Enrolled */}
                <div>
                  <p style={{ fontSize: 5.5, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0, lineHeight: 1 }}>Enrolled Since / नामांकन</p>
                  <p style={{ fontSize: 8.5, fontWeight: 500, color: '#1e3a5f', margin: '1.5px 0 0 0', lineHeight: 1 }}>{memberSince || '—'}</p>
                </div>

              </div>

              {/* RIGHT — QR code */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                <div style={{ padding: 4, background: WHITE, borderRadius: 6, border: '1.5px solid #93c5e8', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
                  <QRCode data={qrData} size={82} errorCorrectionLevel="M" />
                </div>
                <p style={{ fontSize: 5.5, color: '#9ca3af', textAlign: 'center', margin: 0 }}>Scan to verify</p>
              </div>
            </div>

            {/* ── Aadhaar number band ── */}
            <div style={{
              margin: '0 13px 5px 13px', padding: '5px 10px',
              borderRadius: 6, flexShrink: 0,
              background: 'rgba(0,53,128,0.07)', border: '1px solid rgba(0,53,128,0.14)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <p style={{ fontSize: 5.5, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0 }}>Aadhaar No / आधार संख्या</p>
                <p style={{ fontFamily: '"Courier New", monospace', fontWeight: 700, fontSize: 16, letterSpacing: '0.25em', color: NAVY, margin: '2px 0 0 0', lineHeight: 1 }}>
                  {displayAadhaar}
                </p>
              </div>
              {aadhaarVerified && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <CheckCircle2 style={{ width: 11, height: 11, color: '#16a34a' }} />
                  <span style={{ fontSize: 7, color: '#15803d', fontWeight: 700 }}>Aadhaar Verified</span>
                </div>
              )}
            </div>

            {/* ── Footer ── */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '3px 13px', flexShrink: 0,
              background: 'rgba(0,53,128,0.04)', borderTop: '1px solid rgba(0,53,128,0.09)',
            }}>
              <p style={{ fontSize: 5.5, color: '#94a3b8', margin: 0 }}>ID: VS-{shortId}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e' }} />
                <p style={{ fontSize: 6, color: '#16a34a', fontWeight: 600, margin: 0 }}>Active</p>
              </div>
              <p style={{ fontSize: 5.5, color: '#94a3b8', margin: 0 }}>Click to view back →</p>
            </div>

            <Tricolor />
          </div>

          {/* ══════════════ BACK ══════════════ */}
          <div ref={backRef} style={{
            ...CARD,
            background: 'linear-gradient(150deg, #f0f6ff 0%, #e4eefa 60%, #d6e8f7 100%)',
            transform: 'rotateY(180deg)',
            position: 'relative',
          }}>
            {/* Watermark Ashoka Chakra */}
            <div style={{
              position: 'absolute', right: 18, top: '50%', transform: 'translateY(-50%)',
              fontSize: 110, color: 'rgba(0,53,128,0.05)', lineHeight: 1,
              pointerEvents: 'none', userSelect: 'none', zIndex: 0,
            }}>☸</div>

            <Tricolor />
            <Header />

            {/* Body */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '9px 14px 7px 14px', gap: 8, position: 'relative', zIndex: 1, minHeight: 0 }}>

              {/* Address block */}
              <div style={{
                background: 'rgba(0,53,128,0.05)', border: '1px solid rgba(0,53,128,0.13)',
                borderRadius: 7, padding: '7px 10px', flex: 1,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                  <span style={{ fontSize: 9 }}>📍</span>
                  <p style={{ fontSize: 5.5, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.18em', fontWeight: 700, margin: 0 }}>
                    Registered Address / पंजीकृत पता
                  </p>
                </div>
                <p style={{
                  fontSize: 9.5, color: '#1e3a5f', margin: 0, lineHeight: 1.6,
                  display: '-webkit-box', WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>
                  {aadhaarAddress || 'Address will appear here after Aadhaar verification is complete.'}
                </p>
              </div>

              {/* Bottom row: signature left, info right */}
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexShrink: 0 }}>

                {/* Signature */}
                <div>
                  <p style={{ fontSize: 13, color: NAVY, margin: 0, fontFamily: 'Georgia, serif', fontStyle: 'italic', lineHeight: 1.1 }}>Virtual Setu</p>
                  <div style={{ width: 110, height: 1, background: 'rgba(0,53,128,0.25)', margin: '4px 0 3px 0' }} />
                  <p style={{ fontSize: 6, color: '#475569', margin: 0, fontWeight: 600 }}>Authorised Signatory</p>
                  <p style={{ fontSize: 5.5, color: '#94a3b8', margin: '1px 0 0 0' }}>Digital Identity Authority of India</p>
                </div>

                {/* Right info stack */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
                  {/* Validity badge */}
                  <div style={{
                    padding: '3px 9px', borderRadius: 20,
                    background: 'rgba(19,136,8,0.09)', border: '1px solid rgba(19,136,8,0.25)',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: GREEN, flexShrink: 0 }} />
                    <p style={{ fontSize: 7, color: '#15803d', fontWeight: 700, margin: 0, letterSpacing: '0.07em' }}>LIFETIME VALID</p>
                  </div>
                  {/* Member since */}
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 5.5, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Valid From</p>
                    <p style={{ fontSize: 9, color: NAVY, fontWeight: 700, margin: '1px 0 0 0', lineHeight: 1 }}>{memberSince || '—'}</p>
                  </div>
                  {/* Helpline */}
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 5.5, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Helpline</p>
                    <p style={{ fontSize: 8, color: NAVY, fontWeight: 600, margin: '1px 0 0 0', lineHeight: 1 }}>1800-XXX-XXXX</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '3px 13px', flexShrink: 0,
              background: 'rgba(0,53,128,0.05)', borderTop: '1px solid rgba(0,53,128,0.1)',
              position: 'relative', zIndex: 1,
            }}>
              <p style={{ fontSize: 5.5, color: '#94a3b8', margin: 0 }}>ID: VS-{shortId}</p>
              <p style={{ fontSize: 5.5, color: '#6b7280', margin: 0, fontStyle: 'italic' }}>यदि मिले तो निकटतम सरकारी कार्यालय में जमा करें</p>
              <p style={{ fontSize: 5.5, color: '#94a3b8', margin: 0 }}>virtualsetu.gov.in</p>
            </div>

            <Tricolor />
          </div>

        </div>
      </div>

      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        <RotateCcw className="h-3 w-3" />
        Click the card to flip · Front shows Aadhaar number · Back shows registered address
      </p>

      <div className="flex gap-3 no-print">
        <Button onClick={() => window.print()} variant="outline" className="gap-2 border-slate-200">
          <Printer className="h-4 w-4" /> Print
        </Button>
        <Button onClick={() => handleDownload(flipped ? backRef : frontRef, flipped ? 'back' : 'front')}
          className="bg-gradient-to-r from-[#003580] to-[#0047ab] text-white gap-2 hover:opacity-90">
          <Download className="h-4 w-4" /> Download {flipped ? 'Back' : 'Front'}
        </Button>
      </div>
    </div>
  );
}
