/**
 * MemberQRCode — Admin page to display, print and share the self-registration QR code.
 * Accessible at /members/qr  (protected, admin/treasurer only)
 */
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { QrCode, Download, Copy, Printer, CheckCircle, Users, Share2 } from 'lucide-react'
import toast from 'react-hot-toast'
import QRCodeLib from 'qrcode'

const CHURCH = import.meta.env.VITE_CHURCH_NAME || 'Grace Life Church'

export default function MemberQRCode() {
  const { user } = useAuth()
  const canvasRef  = useRef(null)
  const [copied,   setCopied]   = useState(false)
  const [qrReady,  setQrReady]  = useState(false)

  const registrationUrl = `${window.location.origin}/join`

  // Generate QR code on canvas
  useEffect(() => {
    if (!canvasRef.current) return
    QRCodeLib.toCanvas(canvasRef.current, registrationUrl, {
      width:           300,
      margin:          2,
      color: {
        dark:  '#1c1c52',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    }, (err) => {
      if (!err) setQrReady(true)
    })
  }, [registrationUrl])

  const handleCopy = () => {
    navigator.clipboard.writeText(registrationUrl)
    setCopied(true)
    toast.success('Link copied to clipboard!')
    setTimeout(() => setCopied(false), 2500)
  }

  const handleDownload = () => {
    if (!canvasRef.current) return
    const link = document.createElement('a')
    link.download = `${CHURCH.replace(/\s+/g, '-')}-member-registration-qr.png`
    link.href = canvasRef.current.toDataURL('image/png')
    link.click()
    toast.success('QR code downloaded!')
  }

  const handlePrint = () => {
    if (!canvasRef.current) return
    const dataUrl = canvasRef.current.toDataURL('image/png')
    const win     = window.open('', '_blank')
    win.document.write(`
      <html>
        <head>
          <title>${CHURCH} — Member Registration</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: sans-serif; background: white; }
            .page { width: 148mm; margin: auto; padding: 20mm; text-align: center; }
            .logo-band { background: #1c1c52; padding: 16px; border-radius: 12px 12px 0 0; margin-bottom: 0; }
            .logo-band h1 { color: #f5c842; font-size: 22px; font-weight: 900; margin: 0; }
            .logo-band p  { color: rgba(255,255,255,0.6); font-size: 12px; margin: 4px 0 0; }
            .qr-box  { border: 2px solid #1c1c52; padding: 24px; border-radius: 0 0 12px 12px; margin-bottom: 16px; }
            img      { width: 200px; height: 200px; display: block; margin: 0 auto 16px; }
            .steps   { background: #f0f4ff; border-radius: 10px; padding: 14px; text-align: left; margin-bottom: 12px; }
            .steps p { font-size: 11px; color: #374151; line-height: 1.7; }
            .steps b { color: #1c1c52; }
            .url     { font-size: 10px; color: #6b7280; word-break: break-all; margin-top: 8px; }
            .footer  { font-size: 10px; color: #9ca3af; margin-top: 12px; }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="logo-band">
              <h1>${CHURCH}</h1>
              <p>Member Self-Registration</p>
            </div>
            <div class="qr-box">
              <img src="${dataUrl}" alt="QR Code" />
              <div class="steps">
                <p><b>How to register:</b></p>
                <p>1. Open the Camera app on your phone</p>
                <p>2. Point it at this QR code</p>
                <p>3. Tap the link that appears</p>
                <p>4. Fill in your details and tap <b>Complete Registration</b></p>
              </div>
              <p class="url">Or visit: ${registrationUrl}</p>
            </div>
            <p class="footer">© ${new Date().getFullYear()} ${CHURCH} · Your data is kept private and secure.</p>
          </div>
        </body>
      </html>
    `)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 500)
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${CHURCH}`,
          text: `Register as a church member at ${CHURCH}`,
          url: registrationUrl,
        })
      } catch {}
    } else {
      handleCopy()
    }
  }

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="page-title flex items-center gap-2">
          <QrCode className="w-5 h-5 text-brand-500" /> Member Self-Registration
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Share this QR code or link so members can register themselves — no manual data entry needed.
        </p>
      </div>

      {/* Main card */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row gap-8 items-center">

          {/* QR Code */}
          <div className="flex-shrink-0 text-center">
            <div className="rounded-2xl overflow-hidden border-4 border-brand-100 dark:border-brand-800 inline-block shadow-lg">
              <canvas ref={canvasRef} className="block" />
            </div>
            {!qrReady && (
              <p className="text-xs text-gray-400 mt-2">Generating QR code…</p>
            )}
          </div>

          {/* Info + Actions */}
          <div className="flex-1 space-y-4 w-full">
            <div>
              <p className="font-semibold text-gray-800 dark:text-gray-100 mb-1">How it works</p>
              <div className="space-y-2">
                {[
                  { n: '1', text: 'Print this QR code or display it on a screen at the entrance' },
                  { n: '2', text: 'Member scans it with their phone camera' },
                  { n: '3', text: 'They fill in their details on the form that opens' },
                  { n: '4', text: 'Their record appears instantly in the Members list' },
                ].map(s => (
                  <div key={s.n} className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      {s.n}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{s.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Link */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 p-3">
              <p className="text-xs text-gray-400 mb-1">Registration link</p>
              <p className="text-sm font-medium text-brand-600 dark:text-brand-400 break-all">{registrationUrl}</p>
            </div>

            {/* Action buttons */}
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
          <Users className="w-4 h-4 text-brand-500" />
          <div>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Preview the registration form</p>
            <p className="text-xs text-gray-400">See exactly what members will see when they scan the QR code</p>
          </div>
        </div>
        <a href="/join" target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs px-3 py-1.5 flex-shrink-0">
          Open Form →
        </a>
      </div>
    </div>
  )
}
