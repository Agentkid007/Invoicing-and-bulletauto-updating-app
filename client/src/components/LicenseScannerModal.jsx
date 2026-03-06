/**
 * client/src/components/LicenseScannerModal.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Full-screen modal that opens the webcam, scans a South-African license disk
 * (QR code or barcode) and returns parsed vehicle / owner data to the parent.
 *
 * Detection pipeline:
 *   1. jsQR          – pure-JS QR detector, works in every browser
 *   2. BarcodeDetector API (Chrome ≥ 88 / Edge) – native, handles PDF417 /
 *      Code-128 / Code-39 / Aztec in addition to QR
 *
 * Props
 *   onScan  (parsedData: object) => void   called when admin confirms a result
 *   onClose ()                   => void   called when modal is dismissed
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { parseLicenseDisk } from '../../../shared/utils/parseLicense.js';

// ─── LicenseScannerModal ──────────────────────────────────────────────────────
export default function LicenseScannerModal({ onScan, onClose }) {
  /* ── refs ─────────────────────────────────────────────────────────────── */
  const videoRef     = useRef(null); // <video> live camera feed
  const canvasRef    = useRef(null); // hidden <canvas> for pixel analysis
  const streamRef    = useRef(null); // MediaStream — must be stopped on close
  const rafRef       = useRef(null); // requestAnimationFrame handle
  const detectingRef = useRef(false); // prevents overlapping BarcodeDetector calls

  /* ── state ────────────────────────────────────────────────────────────── */
  // phase: 'init' | 'scanning' | 'result' | 'error'
  const [phase,  setPhase]  = useState('init');
  const [errMsg, setErrMsg] = useState('');
  const [result, setResult] = useState(null);

  /* ── inject CSS keyframe animation (self-cleaning) ────────────────────── */
  useEffect(() => {
    const ID = 'ba-scanner-kf';
    if (!document.getElementById(ID)) {
      const s = document.createElement('style');
      s.id = ID;
      // Scan line sweeps top-to-bottom; corner brackets gently pulse
      s.textContent = `
        @keyframes baScanLine  { 0%,100%{top:5px} 50%{top:calc(100% - 8px)} }
        @keyframes baCornerPls { 0%,100%{opacity:1} 50%{opacity:.25} }
      `;
      document.head.appendChild(s);
    }
    return () => document.getElementById(ID)?.remove();
  }, []);

  /* ── stop camera + cancel animation frame ─────────────────────────────── */
  const stopCamera = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  /* ── handle a confirmed detection ────────────────────────────────────── */
  const handleDetected = useCallback((rawText) => {
    stopCamera();
    navigator.vibrate?.(150); // haptic feedback on mobile devices
    setResult(parseLicenseDisk(rawText));
    setPhase('result');
  }, [stopCamera]);

  /* ── per-frame scanning logic ─────────────────────────────────────────── */
  const startScanLoop = useCallback(() => {
    const tick = () => {
      const vid = videoRef.current;
      const cvs = canvasRef.current;

      // Wait until the video stream has actual pixel data
      if (!vid || !cvs || vid.readyState < 2) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      // Step 1 — render the current video frame onto our hidden canvas
      cvs.width  = vid.videoWidth;
      cvs.height = vid.videoHeight;
      const ctx = cvs.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(vid, 0, 0);
      const imgData = ctx.getImageData(0, 0, cvs.width, cvs.height);

      // Step 2 — jsQR: pure-JS QR decoder (works in all browsers)
      const qr = jsQR(imgData.data, imgData.width, imgData.height, {
        inversionAttempts: 'attemptBoth', // handle both dark-on-light and light-on-dark
      });
      if (qr?.data) { handleDetected(qr.data); return; }

      // Step 3 — BarcodeDetector API: Chrome/Edge native, detects PDF417, Code-128, etc.
      if ('BarcodeDetector' in window && !detectingRef.current) {
        detectingRef.current = true;
        new BarcodeDetector({
          formats: ['qr_code', 'pdf417', 'code_128', 'code_39', 'aztec', 'data_matrix'],
        })
          .detect(vid)
          .then(codes => {
            if (codes.length && codes[0].rawValue) {
              handleDetected(codes[0].rawValue);
            } else {
              rafRef.current = requestAnimationFrame(tick);
            }
          })
          .catch(() => { rafRef.current = requestAnimationFrame(tick); })
          .finally(() => { detectingRef.current = false; });
      } else {
        // BarcodeDetector not available — keep looping with jsQR only
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [handleDetected]);

  /* ── request camera permission and begin streaming ────────────────────── */
  const startCamera = useCallback(async () => {
    setPhase('init');
    setResult(null);
    try {
      // Prefer the rear camera on mobile devices ("environment")
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width:  { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setPhase('scanning');
      startScanLoop();
    } catch (err) {
      setPhase('error');
      setErrMsg(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access in your browser settings and try again.'
          : err.name === 'NotFoundError'
          ? 'No camera was found on this device.'
          : `Camera error: ${err.message}`,
      );
    }
  }, [startScanLoop]);

  /* ── start on mount, clean up on unmount ─────────────────────────────── */
  useEffect(() => {
    startCamera();
    return stopCamera;
  }, [startCamera, stopCamera]);

  /* ── inline styles (self-contained, won't pollute global CSS) ─────────── */
  const S = {
    overlay:   { position:'fixed', inset:0, background:'rgba(0,0,0,.88)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:16 },
    modal:     { background:'#111', borderRadius:18, width:'min(94vw,440px)', maxHeight:'90vh', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 32px 80px rgba(0,0,0,.9), 0 0 0 1px rgba(63,81,181,.3)' },
    header:    { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', background:'linear-gradient(135deg,#0d0d0d 0%,#1a237e 100%)', borderBottom:'1px solid rgba(63,81,181,.4)', flexShrink:0 },
    htitle:    { fontFamily:'"Orbitron",sans-serif', fontSize:13, fontWeight:700, letterSpacing:1.5, color:'#fff' },
    closeBtn:  { background:'none', border:'1px solid rgba(255,255,255,.2)', color:'rgba(255,255,255,.7)', fontSize:18, cursor:'pointer', padding:'2px 10px', borderRadius:6, lineHeight:'24px' },
    // Camera viewport
    camWrap:   { position:'relative', width:'100%', aspectRatio:'4/3', background:'#000', flexShrink:0, overflow:'hidden' },
    video:     { width:'100%', height:'100%', objectFit:'cover', display:'block' },
    // Scanning overlay — dim area outside scan box
    dimOuter:  { position:'absolute', inset:0, background:'radial-gradient(ellipse 65% 65% at 50% 50%, transparent 38%, rgba(0,0,0,.6) 100%)', pointerEvents:'none' },
    scanOvl:   { position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' },
    scanFrame: { position:'relative', width:'64%', aspectRatio:'1' },
    // Corner bracket helper — caller adds position + border sides
    cornerBase:{ position:'absolute', width:26, height:26, border:'3px solid #5c6bc0', animation:'baCornerPls 2.5s ease-in-out infinite' },
    // Animated sweep line
    scanLine:  { position:'absolute', left:6, right:6, height:3, background:'linear-gradient(90deg,transparent,#5c6bc0,#9575cd,#5c6bc0,transparent)', borderRadius:2, animation:'baScanLine 2s linear infinite', boxShadow:'0 0 14px #5c6bc0', pointerEvents:'none' },
    instruct:  { padding:'14px 20px 6px', textAlign:'center', fontSize:13, color:'rgba(255,255,255,.55)', lineHeight:1.6, flexShrink:0 },
    cancelBtn: { margin:'12px 20px 18px', padding:'13px', background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.14)', borderRadius:10, color:'rgba(255,255,255,.8)', fontSize:14, cursor:'pointer', letterSpacing:.4 },
    // Result pane
    resultWrap:{ padding:'16px 20px', overflowY:'auto' },
    rawBox:    { background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:8, padding:'10px 14px', marginBottom:14 },
    rawLbl:    { fontSize:10, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:1, marginBottom:4 },
    rawTxt:    { fontSize:11, color:'rgba(255,255,255,.45)', fontFamily:'monospace', wordBreak:'break-all', lineHeight:1.5 },
    grid:      { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px 10px', marginBottom:18 },
    fCard:     { background:'rgba(63,81,181,.13)', border:'1px solid rgba(63,81,181,.28)', borderRadius:9, padding:'9px 12px' },
    fLbl:      { fontSize:10, color:'rgba(255,255,255,.38)', textTransform:'uppercase', letterSpacing:.7, marginBottom:3 },
    fVal:      { fontSize:13, color:'#fff', fontWeight:600 },
    actRow:    { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 },
    rescanBtn: { padding:'13px', background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.15)', borderRadius:10, color:'#fff', fontSize:14, cursor:'pointer' },
    useBtn:    { padding:'13px', background:'linear-gradient(135deg,#3949ab,#7b1fa2)', border:'none', borderRadius:10, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', letterSpacing:.3 },
    // Error pane
    errWrap:   { display:'flex', flexDirection:'column', alignItems:'center', padding:'32px 24px', gap:14 },
    errIcon:   { fontSize:52 },
    errTxt:    { textAlign:'center', color:'rgba(255,255,255,.65)', fontSize:14, lineHeight:1.7 },
    retryBtn:  { padding:'12px 28px', background:'#3949ab', border:'none', borderRadius:10, color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer' },
  };

  /* ── corner helper ─────────────────────────────────────────────────────── */
  const Corner = ({ style }) => <div style={{ ...S.cornerBase, ...style }} />;

  /* ── render ───────────────────────────────────────────────────────────── */
  return (
    /* Clicking the backdrop dismisses the modal */
    <div style={S.overlay} onClick={e => { if (e.target === e.currentTarget) { stopCamera(); onClose(); } }}>
      <div style={S.modal}>

        {/* ── HEADER ── */}
        <div style={S.header}>
          <span style={S.htitle}>
            {phase === 'result' ? '✅ SCAN SUCCESSFUL' : '📷 SCAN LICENSE DISK'}
          </span>
          <button style={S.closeBtn} onClick={() => { stopCamera(); onClose(); }}>✕</button>
        </div>

        {/* ── SCANNING / INIT PHASE ── */}
        {(phase === 'init' || phase === 'scanning') && (
          <>
            {/* Camera viewport */}
            <div style={S.camWrap}>
              <video ref={videoRef} style={S.video} muted playsInline autoPlay />
              {/* Hidden canvas — used only for pixel data, never displayed */}
              <canvas ref={canvasRef} style={{ display: 'none' }} />

              {/* Radial dim to focus attention on centre */}
              <div style={S.dimOuter} />

              {/* Scan-zone brackets + sweep line */}
              <div style={S.scanOvl}>
                <div style={S.scanFrame}>
                  {/* Four corner brackets */}
                  <Corner style={{ top:0,    left:0,  borderRight:'none', borderBottom:'none' }} />
                  <Corner style={{ top:0,    right:0, borderLeft:'none',  borderBottom:'none' }} />
                  <Corner style={{ bottom:0, left:0,  borderRight:'none', borderTop:'none'    }} />
                  <Corner style={{ bottom:0, right:0, borderLeft:'none',  borderTop:'none'    }} />
                  {/* Animated line visible only while camera is active */}
                  {phase === 'scanning' && <div style={S.scanLine} />}
                </div>
              </div>
            </div>

            {/* Instruction text */}
            <div style={S.instruct}>
              {phase === 'init'
                ? '🔄 Initialising camera…'
                : <>Hold the <strong style={{ color:'#7986cb' }}>barcode or QR code</strong> steady inside the brackets</>}
            </div>

            <button style={S.cancelBtn} onClick={() => { stopCamera(); onClose(); }}>
              Cancel
            </button>
          </>
        )}

        {/* ── RESULT PHASE ── */}
        {phase === 'result' && result && (
          <div style={S.resultWrap}>
            {/* Show raw detected string for transparency */}
            <div style={S.rawBox}>
              <div style={S.rawLbl}>Raw scan data</div>
              <div style={S.rawTxt}>{result.raw_data}</div>
            </div>

            {/* Parsed fields grid — only show non-empty fields */}
            <div style={S.grid}>
              {[
                ['Registration', result.registration],
                ['Make',         result.make],
                ['Model',        result.model],
                ['Year',         result.year],
                ['VIN',          result.vin_no],
                ['Engine No.',   result.engine_no],
                ['Colour',       result.colour],
                ['Owner',        result.owner_name],
                ['Expiry',       result.license_expiry],
              ].filter(([, v]) => v).map(([label, value]) => (
                <div key={label} style={S.fCard}>
                  <div style={S.fLbl}>{label}</div>
                  <div style={S.fVal}>{value}</div>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div style={S.actRow}>
              <button
                style={S.rescanBtn}
                onClick={() => { setResult(null); startCamera(); }}
              >
                🔄 Scan Again
              </button>
              <button
                style={S.useBtn}
                onClick={() => { onScan(result); onClose(); }}
              >
                ✓ Use This Data
              </button>
            </div>
          </div>
        )}

        {/* ── ERROR PHASE ── */}
        {phase === 'error' && (
          <div style={S.errWrap}>
            <div style={S.errIcon}>📷</div>
            <div style={S.errTxt}>{errMsg}</div>
            <button style={S.retryBtn} onClick={startCamera}>🔄 Try Again</button>
            <button style={{ ...S.cancelBtn, margin:0 }} onClick={() => { stopCamera(); onClose(); }}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
