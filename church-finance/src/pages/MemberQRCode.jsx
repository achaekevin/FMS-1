/**
 * MemberQRCode — Admin page with:
 *  1. QR Code with full customization (color, size, label, style)
 *  2. Pending members approval workflow
 */
import { useState, useRef, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../utils/api'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import {
  QrCode, Download, Copy, Printer, CheckCircle, Users, Share2,
  Settings, RefreshCw, UserCheck, UserX, Eye, ChevronDown,
  Palette, Maximize2, AlignCenter, Clock,
} from 'lucide-react'
import QRCodeLib from 'qrcode'

const CHURCH = import.meta.env.VITE_CHURCH_NAME || 'Grace Life Church'

// ── Default QR options ────────────────────────────────────
const DEFAULT_OPTS = {
  darkColor:  '#1c1c52',
  lightColor: '#ffffff',
  size:        280,
  margin:      2,
  label:       CHURCH,
  showLabel:   true,
  errorLevel:  'H',
}

// ── QR Customizer panel ────────────────────────────────────
function QRCustomizer({ opts, onChange }) {
  const set = (k, v) => onChange({ ...opts, [k]: v })
  return (
    <div className="card p-4 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Palette className="w-4 h-4 text-brand-500" />
        <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">QR Code Customization</h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Dark color */}
        <div>
          <label className="label">Foreground</label>
          <div className="flex items-center gap-2">
            <input type="color" className="w-10 h-9 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer p-0.5"
              value={opts.darkColor} onChange={e => set('darkColor', e.target.value)} />
            <input className="input-field flex-1 font-mono text-xs" value={opts.darkColor}
              onChange={e => set('darkColor', e.target.value)} maxLength={7} />
          </div>
        </div>

        {/* Light color */}
        <div>
          <label className="label">Background</label>
          <div className="flex items-center gap-2">
            <input type="color" className="w-10 h-9 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer p-0.5"
              value={opts.lightColor} onChange={e => set('lightColor', e.target.value)} />
            <input className="input-field flex-1 font-mono text-xs" value={opts.lightColor}
              onChange={e => set('lightColor', e.target.value)} maxLength={7} />
          </div>
        </div>

        {/* Size */}
        <div>
          <label className="label flex items-center gap-1"><Maximize2 className="w-3 h-3" /> Size (px)</label>
          <select className="input-field" value={opts.size} onChange={e => set('size', Number(e.target.value))}>
            {[200, 250, 280, 320, 400, 500].map(s => (
              <option key={s} value={s}>{s} × {s}</option>
            ))}
          </select>
        </div>

        {/* Error correction */}
        <div>
          <label className="label">Error Level</label>
          <select className="input-field" value={opts.errorLevel} onChange={e => set('errorLevel', e.target.value)}>
            <option value="L">L — Low (7%)</option>
            <option value="M">M — Medium (15%)</option>
            <option value="Q">Q — High (25%)</option>
            <option value="H">H — Max (30%)</option>
          </select>
        </div>
      </div>

      {/* Label */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <label className="flex items-center gap-2 cursor-pointer flex-shrink-0">
          <input type="checkbox" className="rounded" checked={opts.showLabel}
            onChange={e => set('showLabel', e.target.checked)} />
          <span className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-1">
            <AlignCenter className="w-3.5 h-3.5" /> Show label below QR code
          </span>
        </label>
        {opts.showLabel && (
          <input className="input-field flex-1" placeholder="Label text..."
            value={opts.label} onChange={e => set('label', e.target.value)} maxLength={60} />
        )}
      </div>

      {/* Preset themes */}
      <div>
        <label className="label mb-2">Quick Themes</label>
        <div className="flex flex-wrap gap-2">
          {[
            { name: 'Church Blue',  dark: '#1c1c52', light: '#ffffff' },
            { name: 'Black',        dark: '#000000', light: '#ffffff' },
            { name: 'Deep Purple',  dark: '#4f4fe8', light: '#f0f4ff' },
            { name: 'Forest Green', dark: '#065f46', light: '#f0fdf4' },
            { name: 'Gold',         dark: '#92400e', light: '#fffbeb' },
            { name: 'Crimson',      dark: '#7f1d1d', light: '#fff1f2' },
          ].map(t => (
            <button key={t.name} type="button"
              onClick={() => onChange({ ...opts, darkColor: t.dark, lightColor: t.light })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-xs font-medium text-gray-600 dark:text-gray-300 hover:border-brand-400 transition-colors">
              <span className="w-3 h-3 rounded-full border border-gray-300 flex-shrink-0"
                style={{ background: t.dark }} />
              {t.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Pending Members Panel ─────────────────────────────────
function PendingMembers({ onApproved }) {
  const [members, setMembers]   = useState([])
  const [loading, setLoading]   = useState(false)
  const [acting,  setActing]    = useState(null)  // memberId being actioned

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/members?status=inactive&limit=50')
      // Filter to only self-registered (recently joined inactive)
      setMembers(res.data.data || [])
    } catch { setMembers([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const approve = async (id, name) => {
    setActing(id)
    try {
      await api.patch(`/members/${id}/approve`)
      toast.success(`✅ ${name} approved and activated!`)
      load()
      onApproved?.()
    } catch (err) { toast.error(err.message) }
    finally { setActing(null) }
  }

  const reject = async (id, name) => {
    if (!window.confirm(`Remove ${name}'s pending registration?`)) return
    setActing(id)
    try {
      await api.delete(`/members/${id}`)
      toast.success(`${name}'s registration removed`)
      load()
    } catch (err) { toast.error(err.message) }
    finally { setActing(null) }
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-500" />
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Pending Approvals</h3>
          {members.length > 0 && (
            <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-bold px-2 py-0.5 rounded-full">
              {members.length}
            </span>
          )}
        </div>
        <button onClick={load} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-colors">
          <RefreshCw className={clsx('w-4 h-4', loading && 'animate-spin')} />
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-400 text-sm">Loading…</div>
      ) : members.length === 0 ? (
        <div className="p-8 text-center">
          <CheckCircle className="w-8 h-8 text-green-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No pending registrations</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50 dark:divide-gray-700">
          {members.map(m => (
            <div key={m.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
              <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0 text-sm font-bold text-amber-700 dark:text-amber-300">
                {m.fullName?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 dark:text-gray-100 text-sm">{m.fullName}</p>
                <p className="text-xs text-gray-400">{m.phone}{m.email ? ` · ${m.email}` : ''}</p>
                <p className="text-xs text-gray-400">
                  Registered {new Date(m.createdAt).toLocaleDateString('en-KE', { dateStyle: 'medium' })}
                  {m.gender ? ` · ${m.gender}` : ''}
                </p>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                <button
                  onClick={() => approve(m.id, m.fullName)}
                  disabled={acting === m.id}
                  title="Approve"
                  className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors disabled:opacity-50">
                  {acting === m.id
                    ? <RefreshCw className="w-4 h-4 animate-spin" />
                    : <UserCheck className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => reject(m.id, m.fullName)}
                  disabled={acting === m.id}
                  title="Reject"
                  className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50">
                  <UserX className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────
export default function MemberQRCode() {
  const canvasRef     = useRef(null)
  const [opts, setOpts]   = useState(DEFAULT_OPTS)
  const [copied, setCopied] = useState(false)
  const [qrReady, setQrReady] = useState(false)
  const [showCustomizer, setShowCustomizer] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [tab, setTab] = useState('qr')   // 'qr' | 'pending'

  const getRegistrationUrl = () => {
    // Use VITE_PUBLIC_URL env var if set (for production/ngrok/real domain)
    // Otherwise fall back to the detected local network IP
    const envUrl = import.meta.env.VITE_PUBLIC_URL
    if (envUrl) return `${envUrl}/join`
    // Replace localhost with actual network IP so phones on the same WiFi can reach it
    return window.location.origin.replace('localhost', '192.168.100.29').replace('127.0.0.1', '192.168.100.29') + '/join'
  }
  const registrationUrl = getRegistrationUrl()

  // Re-generate QR whenever opts change
  useEffect(() => {
    if (!canvasRef.current) return
    setQrReady(false)
    QRCodeLib.toCanvas(canvasRef.current, registrationUrl, {
      width:               opts.size,
      margin:              opts.margin,
      errorCorrectionLevel: opts.errorLevel,
      color: { dark: opts.darkColor, light: opts.lightColor },
    }, err => { if (!err) setQrReady(true) })
  }, [opts, registrationUrl])

  // Fetch pending count for badge
  useEffect(() => {
    api.get('/members?status=inactive&limit=1')
      .then(r => setPendingCount(r.data.meta?.total || 0))
      .catch(() => {})
  }, [])

  const handleCopy = () => {
    navigator.clipboard.writeText(registrationUrl)
    setCopied(true)
    toast.success('Link copied!')
    setTimeout(() => setCopied(false), 2500)
  }

  const handleDownload = () => {
    if (!canvasRef.current) return
    // If label is shown, draw label onto a new canvas
    if (opts.showLabel && opts.label) {
      const src    = canvasRef.current
      const pad    = 20
      const lh     = 28
      const out    = document.createElement('canvas')
      out.width    = src.width + pad * 2
      out.height   = src.height + pad * 2 + lh
      const ctx    = out.getContext('2d')
      ctx.fillStyle = opts.lightColor
      ctx.fillRect(0, 0, out.width, out.height)
      ctx.drawImage(src, pad, pad)
      ctx.fillStyle  = opts.darkColor
      ctx.font       = `bold 14px sans-serif`
      ctx.textAlign  = 'center'
      ctx.fillText(opts.label, out.width / 2, src.height + pad + lh - 6)
      const link     = document.createElement('a')
      link.download  = `${CHURCH.replace(/\s+/g, '-')}-qr.png`
      link.href      = out.toDataURL('image/png')
      link.click()
    } else {
      const link    = document.createElement('a')
      link.download = `${CHURCH.replace(/\s+/g, '-')}-qr.png`
      link.href     = canvasRef.current.toDataURL('image/png')
      link.click()
    }
    toast.success('QR code downloaded!')
  }

  const handlePrint = () => {
    if (!canvasRef.current) return
    const dataUrl = canvasRef.current.toDataURL('image/png')
    const win     = window.open('', '_blank')
    win.document.write(`<!DOCTYPE html><html><head><title>${CHURCH} — Member Registration QR</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:sans-serif; background:white; }
        .page { width:148mm; margin:auto; padding:16mm; text-align:center; }
        .band { background:${opts.darkColor}; padding:18px 24px; border-radius:14px 14px 0 0; }
        .band h1 { color:${opts.lightColor === '#ffffff' ? '#f5c842' : opts.lightColor}; font-size:20px; font-weight:900; margin:0; }
        .band p { color:rgba(255,255,255,0.55); font-size:12px; margin:4px 0 0; }
        .box { border:2px solid ${opts.darkColor}; border-top:none; padding:20px 24px 24px; border-radius:0 0 14px 14px; }
        img { width:${Math.min(opts.size, 220)}px; height:${Math.min(opts.size, 220)}px; display:block; margin:0 auto 14px; }
        .label { font-size:15px; font-weight:700; color:${opts.darkColor}; margin:0 0 14px; }
        .steps { background:#f0f4ff; border-radius:10px; padding:12px 14px; text-align:left; margin-bottom:14px; }
        .steps p { font-size:11px; color:#374151; line-height:1.75; }
        .steps b { color:${opts.darkColor}; }
        .url { font-size:9px; color:#6b7280; word-break:break-all; }
        .footer { font-size:9px; color:#9ca3af; margin-top:12px; }
      </style></head><body>
      <div class="page">
        <div class="band"><h1>${CHURCH}</h1><p>Member Self-Registration</p></div>
        <div class="box">
          <img src="${dataUrl}" alt="QR Code" />
          ${opts.showLabel && opts.label ? `<p class="label">${opts.label}</p>` : ''}
          <div class="steps">
            <p><b>How to register:</b></p>
            <p>1. Open your Camera app on your phone</p>
            <p>2. Point it at this QR code</p>
            <p>3. Tap the link that appears</p>
            <p>4. Fill in your details and tap <b>Complete Registration</b></p>
          </div>
          <p class="url">Or visit: ${registrationUrl}</p>
        </div>
        <p class="footer">© ${new Date().getFullYear()} ${CHURCH} · Your data is private and secure.</p>
      </div></body></html>`)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 600)
  }

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: `Join ${CHURCH}`, url: registrationUrl }) } catch {}
    } else { handleCopy() }
  }

  return (
    <div className="space-y-5 max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <QrCode className="w-5 h-5 text-brand-500" /> Member Self-Registration
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Generate a QR code for members to register themselves. Review and approve pending registrations below.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
        {[
          { id: 'qr',      label: 'QR Code',          icon: QrCode  },
          { id: 'pending', label: `Pending Approvals${pendingCount > 0 ? ` (${pendingCount})` : ''}`, icon: Clock },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={clsx('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              tab === t.id
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200')}>
            <t.icon className="w-4 h-4" />{t.label}
            {t.id === 'pending' && pendingCount > 0 && (
              <span className="bg-amber-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {pendingCount > 9 ? '9+' : pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── QR Code Tab ── */}
      {tab === 'qr' && (
        <>
          {/* Customizer toggle */}
          <button onClick={() => setShowCustomizer(s => !s)}
            className="btn-secondary flex items-center gap-2 text-sm">
            <Settings className="w-4 h-4" />
            {showCustomizer ? 'Hide' : 'Customize QR Code'}
            <ChevronDown className={clsx('w-4 h-4 transition-transform', showCustomizer && 'rotate-180')} />
          </button>

          {showCustomizer && (
            <QRCustomizer opts={opts} onChange={setOpts} />
          )}

          {/* QR + actions card */}
          <div className="card p-6">
            <div className="flex flex-col sm:flex-row gap-8 items-center">

              {/* QR canvas + label */}
              <div className="flex-shrink-0 text-center">
                <div className="rounded-2xl overflow-hidden border-4 border-brand-100 dark:border-brand-800 inline-block shadow-xl">
                  <canvas ref={canvasRef} className="block" />
                </div>
                {opts.showLabel && opts.label && (
                  <p className="mt-2 text-sm font-bold" style={{ color: opts.darkColor }}>{opts.label}</p>
                )}
                {!qrReady && <p className="text-xs text-gray-400 mt-2">Generating…</p>}
              </div>

              {/* Info + actions */}
              <div className="flex-1 space-y-4 w-full">
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-100 mb-2">How it works</p>
                  <div className="space-y-2">
                    {[
                      'Print this QR code or display it on a screen at the entrance',
                      'Member scans it with their phone camera — no app needed',
                      'They fill in their name, phone, email and other details',
                      'Admin reviews and approves — member gets an email confirmation',
                    ].map((s, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                          {i + 1}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{s}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Link box */}
                <div className="rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 p-3">
                  <p className="text-xs text-gray-400 mb-1">Registration link</p>
                  <p className="text-sm font-medium text-brand-600 dark:text-brand-400 break-all">{registrationUrl}</p>
                </div>

                {/* Actions grid */}
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={handleCopy} className="btn-secondary justify-center">
                    {copied
                      ? <><CheckCircle className="w-4 h-4 text-green-500" /> Copied!</>
                      : <><Copy className="w-4 h-4" /> Copy Link</>}
                  </button>
                  <button onClick={handleShare} className="btn-secondary justify-center">
                    <Share2 className="w-4 h-4" /> Share
                  </button>
                  <button onClick={handleDownload} disabled={!qrReady} className="btn-secondary justify-center disabled:opacity-50">
                    <Download className="w-4 h-4" /> Save PNG
                  </button>
                  <button onClick={handlePrint} disabled={!qrReady} className="btn-primary justify-center disabled:opacity-50">
                    <Printer className="w-4 h-4" /> Print
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Preview link */}
          <div className="card p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-brand-500" />
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Preview the registration form</p>
                <p className="text-xs text-gray-400">See exactly what members will see when they scan the QR code</p>
              </div>
            </div>
            <a href="/join" target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs px-3 py-1.5 flex-shrink-0">
              Open Form →
            </a>
          </div>
        </>
      )}

      {/* ── Pending Tab ── */}
      {tab === 'pending' && (
        <PendingMembers onApproved={() => {
          api.get('/members?status=inactive&limit=1')
            .then(r => setPendingCount(r.data.meta?.total || 0))
            .catch(() => {})
        }} />
      )}
    </div>
  )
}
