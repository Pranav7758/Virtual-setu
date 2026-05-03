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
}

/* ISO ID-1 (ATM / PAN card) — 85.6 × 54 mm @ 5.6 px/mm */
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

function Chakra({ size = 24 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: '1.5px solid rgba(255,255,255,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(255,255,255,0.1)', flexShrink: 0,
    }}>
      <span style={{ fontSize: size * 0.52, lineHeight: 1, color: 'rgba(255,255,255,0.9)' }}>☸</span>
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
        <Chakra size={24} />
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

function Field({ label, value, mono = false, large = false }: { label: string; value: string; mono?: boolean; large?: boolean }) {
  return (
    <div>
      <p style={{ fontSize: 5.5, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0, lineHeight: 1 }}>{label}</p>
      <p style={{
        fontSize: large ? 13 : 8.5, fontWeight: large ? 700 : 500,
        color: large ? '#0f172a' : '#1e3a5f',
        margin: '1.5px 0 0 0', lineHeight: 1.2,
        fontFamily: mono ? '"Courier New", monospace' : 'inherit',
        letterSpacing: mono ? '0.15em' : 'normal',
      }}>{value || '—'}</p>
    </div>
  );
}

/* Initials avatar when no photo */
function InitialsAvatar({ name, size }: { name: string; size: number }) {
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
  return (
    <div style={{
      width: size, height: size * 1.25, borderRadius: 6,
      background: `linear-gradient(135deg, ${NAVY} 0%, ${BLUE} 100%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: '1.5px solid #93aec8', flexShrink: 0,
    }}>
      <span style={{ color: WHITE, fontSize: size * 0.35, fontWeight: 700, letterSpacing: '0.05em' }}>{initials || '?'}</span>
    </div>
  );
}

export default function DigitalIDCard({
  name, phone, userId, memberSince, shareUrl,
  aadhaarMasked, aadhaarAddress, dob, aadhaarVerified,
  photoUrl, bloodGroup,
}: DigitalIDCardProps) {
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef  = useRef<HTMLDivElement>(null);
  const [flipped, setFlipped] = useState(false);

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
    overflow: 'hidden',
    userSelect: 'none',
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

  const PHOTO_W = 62;
  const PHOTO_H = 78;

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

          {/* ━━━━━━━━━━━━━━━━━━ FRONT ━━━━━━━━━━━━━━━━━━ */}
          <div ref={frontRef} style={{
            ...CARD,
            background: 'linear-gradient(150deg, #f0f6ff 0%, #e4eefa 60%, #d6e8f7 100%)',
          }}>
            <Tricolor />
            <Header />

            {/* "DIGITAL IDENTITY CARD" label */}
            <div style={{ textAlign: 'center', padding: '4px 0 2px', flexShrink: 0 }}>
              <span style={{
                display: 'inline-block', fontSize: 6, fontWeight: 700,
                letterSpacing: '0.3em', textTransform: 'uppercase',
                color: WHITE, background: NAVY, borderRadius: 20, padding: '2px 10px',
              }}>Digital Identity Card</span>
            </div>

            {/* ── Body ── */}
            <div style={{
              flex: 1, display: 'flex', gap: 10,
              padding: '7px 13px 6px 13px', minHeight: 0,
            }}>
              {/* Left: photo */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, gap: 5 }}>
                {photoUrl ? (
                  <img src={photoUrl} alt={name}
                    style={{ width: PHOTO_W, height: PHOTO_H, objectFit: 'cover', borderRadius: 6, border: '1.5px solid #93aec8', flexShrink: 0 }} />
                ) : (
                  <InitialsAvatar name={name} size={PHOTO_W} />
                )}
                {/* Blood group badge */}
                {bloodGroup && (
                  <div style={{
                    padding: '2px 8px', borderRadius: 20,
                    background: '#fee2e2', border: '1px solid #fca5a5',
                    display: 'flex', alignItems: 'center', gap: 3,
                  }}>
                    <span style={{ fontSize: 7 }}>🩸</span>
                    <span style={{ fontSize: 8, fontWeight: 700, color: '#dc2626' }}>{bloodGroup}</span>
                  </div>
                )}
              </div>

              {/* Middle: fields */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
                <Field label="Name / नाम" value={name} large />
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {dob && <Field label="Date of Birth / जन्म तिथि" value={dob} />}
                  <Field label="Mobile / मोबाइल" value={phone || '—'} />
                </div>
                <Field label="Enrolled Since / नामांकन" value={memberSince || '—'} />
              </div>

              {/* Right: QR */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, flexShrink: 0 }}>
                <div style={{
                  padding: 4, background: WHITE, borderRadius: 6,
                  border: '1.5px solid #93c5e8',
                  boxShadow: '0 1px 6px rgba(0,0,0,0.1)',
                }}>
                  <QRCode data={qrData} size={84} errorCorrectionLevel="M" />
                </div>
                <p style={{ fontSize: 5.5, color: '#9ca3af', textAlign: 'center', margin: 0 }}>Scan to verify</p>
              </div>
            </div>

            {/* ── Aadhaar number band ── */}
            <div style={{
              margin: '0 13px 5px 13px',
              padding: '5px 10px',
              borderRadius: 6,
              background: 'rgba(0,53,128,0.07)',
              border: '1px solid rgba(0,53,128,0.14)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexShrink: 0,
            }}>
              <div>
                <p style={{ fontSize: 5.5, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0 }}>
                  Aadhaar No / आधार संख्या
                </p>
                <p style={{
                  fontFamily: '"Courier New", monospace',
                  fontWeight: 700, fontSize: 16,
                  letterSpacing: '0.25em', color: NAVY,
                  margin: '2px 0 0 0', lineHeight: 1,
                }}>{displayAadhaar}</p>
              </div>
              {aadhaarVerified && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <CheckCircle2 style={{ width: 11, height: 11, color: '#16a34a' }} />
                  <span style={{ fontSize: 7, color: '#15803d', fontWeight: 700, letterSpacing: '0.04em' }}>Aadhaar Verified</span>
                </div>
              )}
            </div>

            {/* ── Footer ── */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '3px 13px',
              background: 'rgba(0,53,128,0.04)',
              borderTop: '1px solid rgba(0,53,128,0.09)',
              flexShrink: 0,
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

          {/* ━━━━━━━━━━━━━━━━━━ BACK ━━━━━━━━━━━━━━━━━━ */}
          <div ref={backRef} style={{
            ...CARD,
            background: 'linear-gradient(150deg, #f5f8ff 0%, #eaf0fa 60%, #dde8f5 100%)',
            transform: 'rotateY(180deg)',
          }}>
            <Tricolor />
            <Header />

            {/* Magnetic stripe */}
            <div style={{
              height: 26, flexShrink: 0,
              background: 'linear-gradient(90deg, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%)',
              margin: '5px 0 0 0',
              display: 'flex', alignItems: 'center',
              padding: '0 12px', justifyContent: 'flex-end',
            }}>
              <p style={{ fontSize: 6, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.2em', margin: 0, textTransform: 'uppercase' }}>
                Virtual Setu · Digital ID
              </p>
            </div>

            {/* Address section */}
            <div style={{ flex: 1, padding: '7px 13px 0 13px', minHeight: 0 }}>
              <p style={{
                fontSize: 5.5, color: '#6b7280', textTransform: 'uppercase',
                letterSpacing: '0.14em', margin: 0, fontWeight: 600,
              }}>Registered Address / पंजीकृत पता</p>
              <p style={{
                fontSize: 9, color: '#1e3a5f', margin: '4px 0 0 0',
                lineHeight: 1.55,
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                {aadhaarAddress || 'Address not available — complete Aadhaar verification to populate.'}
              </p>
            </div>

            {/* Signature + Validity */}
            <div style={{
              display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
              padding: '6px 13px 0 13px', flexShrink: 0,
            }}>
              <div>
                <div style={{
                  width: 100, height: 20,
                  borderBottom: '1px solid #94a3b8',
                  marginBottom: 3,
                  display: 'flex', alignItems: 'flex-end', paddingBottom: 2,
                }}>
                  <p style={{ fontSize: 11, color: '#475569', margin: 0, fontFamily: 'Georgia, serif', fontStyle: 'italic', lineHeight: 1 }}>
                    Virtual Setu
                  </p>
                </div>
                <p style={{ fontSize: 6, color: '#6b7280', margin: 0 }}>Authorised Signatory</p>
                <p style={{ fontSize: 5.5, color: '#9ca3af', margin: '1px 0 0 0' }}>Digital Identity Authority of India</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  display: 'inline-block', padding: '2px 7px', borderRadius: 4, marginBottom: 4,
                  background: 'rgba(19,136,8,0.08)', border: '1px solid rgba(19,136,8,0.2)',
                }}>
                  <p style={{ fontSize: 7, color: GREEN, fontWeight: 700, margin: 0, letterSpacing: '0.08em' }}>LIFETIME VALIDITY</p>
                </div>
                <p style={{ fontSize: 5.5, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Valid From</p>
                <p style={{ fontSize: 8.5, color: NAVY, fontWeight: 600, margin: '1px 0 0 0' }}>{memberSince || '—'}</p>
              </div>
            </div>

            {/* Bottom info row */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '4px 13px', flexShrink: 0,
              background: 'rgba(0,53,128,0.04)',
              borderTop: '1px solid rgba(0,53,128,0.09)',
              marginTop: 5,
            }}>
              <p style={{ fontSize: 5.5, color: '#94a3b8', margin: 0 }}>ID: VS-{shortId}</p>
              <p style={{ fontSize: 5.5, color: '#6b7280', margin: 0, fontStyle: 'italic' }}>If found, return to nearest Govt. office</p>
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
        <Button
          onClick={() => handleDownload(flipped ? backRef : frontRef, flipped ? 'back' : 'front')}
          className="bg-gradient-to-r from-[#003580] to-[#0047ab] text-white gap-2 hover:opacity-90">
          <Download className="h-4 w-4" /> Download {flipped ? 'Back' : 'Front'}
        </Button>
      </div>
    </div>
  );
}
