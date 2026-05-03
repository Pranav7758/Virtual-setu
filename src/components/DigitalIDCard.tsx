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
}

/* ── Exact ISO ID-1 (ATM / PAN card) dimensions at 2× screen scale ── */
const W = 480;
const H = 302; /* 85.6 : 54 mm = 1.585 ratio → 480 × 302.5 */

const SAFFRON = '#FF9933';
const GREEN   = '#138808';
const NAVY    = '#003580';
const BLUE    = '#0047ab';
const WHITE   = '#FFFFFF';

/* ── thin tricolor bar ── */
function Tricolor() {
  return (
    <div style={{ display: 'flex', height: 4, width: '100%' }}>
      <div style={{ flex: 1, background: SAFFRON }} />
      <div style={{ flex: 1, background: WHITE, borderTop: '0.5px solid #ddd', borderBottom: '0.5px solid #ddd' }} />
      <div style={{ flex: 1, background: GREEN }} />
    </div>
  );
}

/* ── Ashoka Chakra as a styled circle ── */
function Chakra({ size = 28, color = 'rgba(255,255,255,0.85)' }: { size?: number; color?: string }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `1.5px solid ${color}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
      background: 'rgba(255,255,255,0.08)',
    }}>
      <span style={{ fontSize: size * 0.52, lineHeight: 1, color }}>☸</span>
    </div>
  );
}

/* ── top header band shared by both sides ── */
function Header() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '5px 12px',
      background: `linear-gradient(90deg, ${NAVY} 0%, ${BLUE} 100%)`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Chakra size={24} />
        <div>
          <p style={{ color: WHITE, fontWeight: 800, fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', margin: 0, lineHeight: 1 }}>
            Virtual Setu
          </p>
          <p style={{ color: '#93c5fd', fontSize: 6, letterSpacing: '0.04em', margin: '2px 0 0 0', lineHeight: 1 }}>
            Digital Identity Authority of India
          </p>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <p style={{ color: '#bfdbfe', fontSize: 6, letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
          Government of India
        </p>
        <p style={{ color: WHITE, fontSize: 8, fontWeight: 700, margin: '2px 0 0 0', lineHeight: 1 }}>भारत सरकार</p>
      </div>
    </div>
  );
}

/* ── small label pill ── */
function Pill({ text }: { text: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '3px 0 2px' }}>
      <span style={{
        display: 'inline-block', fontSize: 6, fontWeight: 700,
        letterSpacing: '0.3em', textTransform: 'uppercase',
        color: WHITE, background: NAVY, borderRadius: 20,
        padding: '2px 10px',
      }}>{text}</span>
    </div>
  );
}

/* ── field label + value ── */
function Field({ label, value, mono = false, large = false }: { label: string; value: string; mono?: boolean; large?: boolean }) {
  return (
    <div>
      <p style={{ fontSize: 5.5, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0, lineHeight: 1 }}>
        {label}
      </p>
      <p style={{
        fontSize: large ? 13 : 8.5,
        fontWeight: large ? 700 : 500,
        color: large ? '#0f172a' : '#1e3a5f',
        margin: '1.5px 0 0 0', lineHeight: 1.15,
        fontFamily: mono ? '"Courier New", monospace' : 'inherit',
        letterSpacing: mono ? '0.18em' : 'normal',
      }}>
        {value || '—'}
      </p>
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

  const qrData        = shareUrl || `${window.location.origin}/i/${userId}`;
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

  return (
    <div className="flex flex-col items-center gap-4">
      {/* flip container */}
      <div style={{ width: W, height: H, perspective: 1400, cursor: 'pointer' }}
           onClick={() => setFlipped(f => !f)}>
        <div style={{
          width: '100%', height: '100%', position: 'relative',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.65s cubic-bezier(0.4,0.2,0.2,1)',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}>

          {/* ━━━━━━━━━━━━━━━ FRONT ━━━━━━━━━━━━━━━ */}
          <div ref={frontRef} style={{
            ...CARD,
            background: 'linear-gradient(150deg, #f0f6ff 0%, #e4eefa 60%, #d6e8f7 100%)',
            display: 'flex', flexDirection: 'column',
          }}>
            <Tricolor />
            <Header />
            <Pill text="Digital Identity Card" />

            {/* ── body ── */}
            <div style={{ display: 'flex', gap: 10, padding: '8px 13px 7px 13px', alignItems: 'stretch' }}>

              {/* left column: photo + chip */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, paddingBottom: 2 }}>
                {/* photo placeholder */}
                <div style={{
                  width: 70, height: 88, borderRadius: 6,
                  background: 'linear-gradient(160deg, #e2e8f0 0%, #cbd5e1 100%)',
                  border: '1.5px solid #93aec8',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 2,
                  flexShrink: 0,
                }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#94a3b8' }} />
                  <div style={{ width: 40, height: 20, borderRadius: '50% 50% 0 0', background: '#94a3b8', marginTop: 3 }} />
                </div>
                {/* EMV chip */}
                <div style={{
                  width: 38, height: 28, borderRadius: 4, marginTop: 6,
                  background: 'linear-gradient(135deg, #d4a843 0%, #f0c860 40%, #c49030 100%)',
                  border: '0.5px solid #b8902a',
                  display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                  gap: 2, padding: 5,
                }}>
                  {[...Array(6)].map((_, i) => (
                    <div key={i} style={{ borderRadius: 1, background: i % 2 === 0 ? '#c49030' : '#f0c860' }} />
                  ))}
                </div>
              </div>

              {/* middle column: fields — justified to fill full height */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
                <Field label="Name / नाम" value={name} large />
                <div style={{ display: 'flex', gap: 14 }}>
                  {dob && <Field label="Date of Birth / जन्म तिथि" value={dob} />}
                  <Field label="Mobile / मोबाइल" value={phone || 'Not provided'} />
                </div>
                <Field label="Enrolled Since / नामांकन" value={memberSince || '—'} />
              </div>

              {/* right column: QR */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, flexShrink: 0 }}>
                <div style={{
                  padding: 4, background: WHITE, borderRadius: 6,
                  border: '1.5px solid #93c5e8',
                  boxShadow: '0 1px 6px rgba(0,0,0,0.1)',
                }}>
                  <QRCode data={qrData} size={86} errorCorrectionLevel="M" />
                </div>
                <p style={{ fontSize: 5.5, color: '#9ca3af', textAlign: 'center', margin: 0 }}>Scan to verify</p>
              </div>
            </div>

            {/* ── Aadhaar number band ── */}
            <div style={{
              margin: '6px 13px 0 13px',
              padding: '5px 10px',
              borderRadius: 6,
              background: 'rgba(0,53,128,0.07)',
              border: '1px solid rgba(0,53,128,0.14)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
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
                }}>
                  {displayAadhaar}
                </p>
              </div>
              {aadhaarVerified && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <CheckCircle2 style={{ width: 12, height: 12, color: '#16a34a' }} />
                  <span style={{ fontSize: 7, color: '#15803d', fontWeight: 700, letterSpacing: '0.05em' }}>
                    Aadhaar Verified
                  </span>
                </div>
              )}
            </div>

            {/* ── footer row ── */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '4px 13px',
              background: 'rgba(0,53,128,0.04)',
              borderTop: '1px solid rgba(0,53,128,0.09)',
              marginTop: 5,
            }}>
              <p style={{ fontSize: 6, color: '#94a3b8', margin: 0, letterSpacing: '0.05em' }}>
                ID: VS-{shortId}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e' }} />
                <p style={{ fontSize: 6, color: '#16a34a', fontWeight: 600, margin: 0 }}>Active</p>
              </div>
              <p style={{ fontSize: 6, color: '#94a3b8', margin: 0 }}>Click to view back →</p>
            </div>

            <Tricolor />
          </div>

          {/* ━━━━━━━━━━━━━━━ BACK ━━━━━━━━━━━━━━━ */}
          <div ref={backRef} style={{
            ...CARD,
            background: 'linear-gradient(150deg, #f5f8ff 0%, #eaf0fa 60%, #dde8f5 100%)',
            display: 'flex', flexDirection: 'column',
            transform: 'rotateY(180deg)',
          }}>
            <Tricolor />
            <Header />

            {/* magnetic stripe */}
            <div style={{
              height: 28,
              background: 'linear-gradient(90deg, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%)',
              margin: '5px 0 0 0',
              display: 'flex', alignItems: 'center', padding: '0 12px',
              justifyContent: 'flex-end',
            }}>
              <p style={{ fontSize: 6, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.2em', margin: 0, textTransform: 'uppercase' }}>
                Virtual Setu · Digital ID
              </p>
            </div>

            {/* address section */}
            <div style={{ padding: '8px 13px 0 13px', flex: 1 }}>
              <p style={{
                fontSize: 5.5, color: '#6b7280', textTransform: 'uppercase',
                letterSpacing: '0.14em', margin: 0, fontWeight: 600,
              }}>
                Registered Address / पंजीकृत पता
              </p>
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

            {/* signature + validity */}
            <div style={{
              display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
              padding: '8px 13px 0 13px',
            }}>
              {/* signature block */}
              <div>
                <div style={{
                  width: 100, height: 22,
                  borderBottom: '1px solid #94a3b8',
                  marginBottom: 3,
                  display: 'flex', alignItems: 'flex-end', paddingBottom: 2,
                }}>
                  <p style={{
                    fontSize: 11, color: '#475569', margin: 0,
                    fontFamily: 'Georgia, serif', fontStyle: 'italic',
                    lineHeight: 1,
                  }}>Virtual Setu</p>
                </div>
                <p style={{ fontSize: 6, color: '#6b7280', margin: 0 }}>Authorised Signatory</p>
                <p style={{ fontSize: 5.5, color: '#9ca3af', margin: '1px 0 0 0' }}>
                  Digital Identity Authority of India
                </p>
              </div>

              {/* validity block */}
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  display: 'inline-block',
                  padding: '3px 8px', borderRadius: 4,
                  background: 'rgba(19,136,8,0.08)',
                  border: '1px solid rgba(19,136,8,0.2)',
                  marginBottom: 4,
                }}>
                  <p style={{ fontSize: 7, color: GREEN, fontWeight: 700, margin: 0, letterSpacing: '0.1em' }}>
                    LIFETIME VALIDITY
                  </p>
                </div>
                <p style={{ fontSize: 5.5, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
                  Valid From
                </p>
                <p style={{ fontSize: 8.5, color: NAVY, fontWeight: 600, margin: '1px 0 0 0' }}>
                  {memberSince || '—'}
                </p>
              </div>
            </div>

            {/* bottom info row */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '5px 13px',
              background: 'rgba(0,53,128,0.04)',
              borderTop: '1px solid rgba(0,53,128,0.09)',
              marginTop: 6,
            }}>
              <p style={{ fontSize: 6, color: '#94a3b8', margin: 0 }}>
                ID: VS-{shortId}
              </p>
              <p style={{ fontSize: 6, color: '#6b7280', margin: 0, fontStyle: 'italic' }}>
                If found, please return to nearest Govt. office
              </p>
              <p style={{ fontSize: 6, color: '#94a3b8', margin: 0 }}>virtualsetu.gov.in</p>
            </div>

            <Tricolor />
          </div>

        </div>
      </div>

      {/* hint */}
      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        <RotateCcw className="h-3 w-3" />
        Click the card to flip · Front shows Aadhaar number · Back shows registered address
      </p>

      {/* action buttons */}
      <div className="flex gap-3 no-print">
        <Button onClick={() => window.print()} variant="outline"
          className="gap-2 border-slate-200">
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
