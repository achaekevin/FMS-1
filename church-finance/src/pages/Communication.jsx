import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../utils/api'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import {
  MessageSquare, Mail, MessageCircle, Send, Users, Bell,
  CalendarDays, Receipt, Megaphone, FileText, Loader2, CheckCircle2,
  Phone, AtSign, ChevronDown, ChevronUp, AlertCircle,
} from 'lucide-react'

// ─── tiny helpers ─────────────────────────────────────────
const Section = ({ title, icon: Icon, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors"
      >
        <span className="flex items-center gap-2 font-semibold text-gray-800 dark:text-gray-100 text-sm">
          <Icon className="w-4 h-4 text-brand-600" />
          {title}
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && <div className="p-5 space-y-4">{children}</div>}
    </div>
  )
}

const Field = ({ label, children }) => (
  <div>
    <label className="label">{label}</label>
    {children}
  </div>
)

const StatusBadge = ({ status }) => {
  if (!status) return null
  return status.ok ? (
    <div className="flex items-center gap-1.5 text-green-600 text-sm mt-2">
      <CheckCircle2 className="w-4 h-4" /> {status.msg}
    </div>
  ) : (
    <div className="flex items-center gap-1.5 text-red-500 text-sm mt-2">
      <AlertCircle className="w-4 h-4" /> {status.msg}
    </div>
  )
}

// ─── Tab bar ──────────────────────────────────────────────
const TABS = [
  { id: 'sms',       label: 'SMS',       icon: MessageSquare },
  { id: 'email',     label: 'Email',     icon: Mail },
  { id: 'whatsapp',  label: 'WhatsApp',  icon: MessageCircle },
]

// ═══════════════════════════════════════════════════════════
// SMS TAB
// ═══════════════════════════════════════════════════════════
function SmsTab() {
  const [eventReminder, setEventReminder] = useState({ eventId: '' })
  const [donation, setDonation]           = useState({ phone: '', name: '', amount: '', receiptNo: '' })
  const [custom, setCustom]               = useState({ phones: '', message: '' })
  const [loading, setLoading]             = useState({})
  const [status, setStatus]               = useState({})

  const run = async (key, fn) => {
    setLoading(l => ({ ...l, [key]: true }))
    setStatus(s => ({ ...s, [key]: null }))
    try {
      const res = await fn()
      setStatus(s => ({ ...s, [key]: { ok: true, msg: res.data?.message || 'Sent successfully' } }))
      toast.success(res.data?.message || 'SMS sent')
    } catch (err) {
      setStatus(s => ({ ...s, [key]: { ok: false, msg: err.message } }))
      toast.error(err.message)
    } finally {
      setLoading(l => ({ ...l, [key]: false }))
    }
  }

  return (
    <div className="space-y-4">
      {/* Event Reminders */}
      <Section title="Event Reminders" icon={CalendarDays}>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Send an SMS reminder to all active members for a specific event.
        </p>
        <Field label="Event ID">
          <input
            type="number" min="1"
            className="input-field"
            placeholder="e.g. 12"
            value={eventReminder.eventId}
            onChange={e => setEventReminder({ eventId: e.target.value })}
          />
        </Field>
        <button
          disabled={!eventReminder.eventId || loading.evtReminder}
          onClick={() => run('evtReminder', () =>
            api.post('/communications/sms/event-reminders', { eventId: Number(eventReminder.eventId) })
          )}
          className="btn-primary disabled:opacity-60"
        >
          {loading.evtReminder ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Send Reminders
        </button>
        <StatusBadge status={status.evtReminder} />
      </Section>

      {/* Donation Confirmation */}
      <Section title="Donation Confirmation" icon={Receipt} defaultOpen={false}>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Re-send a donation confirmation SMS to a member.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Phone Number">
            <input className="input-field" placeholder="+254712345678" value={donation.phone}
              onChange={e => setDonation(d => ({ ...d, phone: e.target.value }))} />
          </Field>
          <Field label="Member Name">
            <input className="input-field" placeholder="John Doe" value={donation.name}
              onChange={e => setDonation(d => ({ ...d, name: e.target.value }))} />
          </Field>
          <Field label="Amount (KES)">
            <input type="number" className="input-field" placeholder="1000" value={donation.amount}
              onChange={e => setDonation(d => ({ ...d, amount: e.target.value }))} />
          </Field>
          <Field label="Receipt No.">
            <input className="input-field" placeholder="RCP-0001" value={donation.receiptNo}
              onChange={e => setDonation(d => ({ ...d, receiptNo: e.target.value }))} />
          </Field>
        </div>
        <button
          disabled={!donation.phone || !donation.name || !donation.amount || !donation.receiptNo || loading.donSms}
          onClick={() => run('donSms', () =>
            api.post('/communications/sms/donation-confirmation', {
              phone: donation.phone, name: donation.name,
              amount: Number(donation.amount), receiptNo: donation.receiptNo,
            })
          )}
          className="btn-primary disabled:opacity-60"
        >
          {loading.donSms ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Send SMS
        </button>
        <StatusBadge status={status.donSms} />
      </Section>

      {/* Custom SMS */}
      <Section title="Custom SMS" icon={MessageSquare} defaultOpen={false}>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Send a custom SMS to one or more phone numbers (admin only). Separate multiple numbers with commas.
        </p>
        <Field label="Phone Number(s)">
          <input className="input-field" placeholder="+254712345678, +254700000000"
            value={custom.phones} onChange={e => setCustom(c => ({ ...c, phones: e.target.value }))} />
        </Field>
        <Field label={`Message (${custom.message.length}/160)`}>
          <textarea
            className="input-field resize-none" rows={3} maxLength={160}
            placeholder="Type your message..."
            value={custom.message}
            onChange={e => setCustom(c => ({ ...c, message: e.target.value }))}
          />
        </Field>
        <button
          disabled={!custom.phones || !custom.message || loading.customSms}
          onClick={() => run('customSms', () => {
            const phones = custom.phones.split(',').map(p => p.trim()).filter(Boolean)
            return api.post('/communications/sms/custom', { phones, message: custom.message })
          })}
          className="btn-primary disabled:opacity-60"
        >
          {loading.customSms ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Send SMS
        </button>
        <StatusBadge status={status.customSms} />
      </Section>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// EMAIL TAB
// ═══════════════════════════════════════════════════════════
function EmailTab() {
  const [announcement, setAnnouncement] = useState({ announcementId: '' })
  const [statement, setStatement]       = useState({ memberId: '', startDate: '', endDate: '', period: '' })
  const [custom, setCustom]             = useState({ to: '', subject: '', text: '' })
  const [loading, setLoading]           = useState({})
  const [status, setStatus]             = useState({})

  const run = async (key, fn) => {
    setLoading(l => ({ ...l, [key]: true }))
    setStatus(s => ({ ...s, [key]: null }))
    try {
      const res = await fn()
      setStatus(s => ({ ...s, [key]: { ok: true, msg: res.data?.message || 'Email queued' } }))
      toast.success(res.data?.message || 'Email queued successfully')
    } catch (err) {
      setStatus(s => ({ ...s, [key]: { ok: false, msg: err.message } }))
      toast.error(err.message)
    } finally {
      setLoading(l => ({ ...l, [key]: false }))
    }
  }

  return (
    <div className="space-y-4">
      {/* Announcement Email */}
      <Section title="Announcement Email Blast" icon={Megaphone}>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Email an announcement to all active members who have an email address on record.
        </p>
        <Field label="Announcement ID">
          <input type="number" min="1" className="input-field" placeholder="e.g. 5"
            value={announcement.announcementId}
            onChange={e => setAnnouncement({ announcementId: e.target.value })} />
        </Field>
        <button
          disabled={!announcement.announcementId || loading.annEmail}
          onClick={() => run('annEmail', () =>
            api.post('/communications/email/announcement', { announcementId: Number(announcement.announcementId) })
          )}
          className="btn-primary disabled:opacity-60"
        >
          {loading.annEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Send Announcement
        </button>
        <StatusBadge status={status.annEmail} />
      </Section>

      {/* Giving Statement */}
      <Section title="Giving Statement" icon={FileText} defaultOpen={false}>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Email a giving statement to a member (or all members if no ID given) for a date range.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Member ID (optional)">
            <input type="number" className="input-field" placeholder="Leave blank for all"
              value={statement.memberId}
              onChange={e => setStatement(s => ({ ...s, memberId: e.target.value }))} />
          </Field>
          <Field label="Period Label (optional)">
            <input className="input-field" placeholder="e.g. Q1 2026"
              value={statement.period}
              onChange={e => setStatement(s => ({ ...s, period: e.target.value }))} />
          </Field>
          <Field label="Start Date">
            <input type="date" className="input-field"
              value={statement.startDate}
              onChange={e => setStatement(s => ({ ...s, startDate: e.target.value }))} />
          </Field>
          <Field label="End Date">
            <input type="date" className="input-field"
              value={statement.endDate}
              onChange={e => setStatement(s => ({ ...s, endDate: e.target.value }))} />
          </Field>
        </div>
        <button
          disabled={!statement.startDate || !statement.endDate || loading.stmtEmail}
          onClick={() => run('stmtEmail', () =>
            api.post('/communications/email/statement', {
              startDate: statement.startDate,
              endDate:   statement.endDate,
              memberId:  statement.memberId ? Number(statement.memberId) : undefined,
              period:    statement.period || undefined,
            })
          )}
          className="btn-primary disabled:opacity-60"
        >
          {loading.stmtEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Send Statements
        </button>
        <StatusBadge status={status.stmtEmail} />
      </Section>

      {/* Custom Email */}
      <Section title="Custom Email" icon={Mail} defaultOpen={false}>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Compose and send a custom email to one or more addresses (admin only). Separate multiple with commas.
        </p>
        <Field label="To (email address/es)">
          <input className="input-field" placeholder="john@example.com, jane@example.com"
            value={custom.to} onChange={e => setCustom(c => ({ ...c, to: e.target.value }))} />
        </Field>
        <Field label="Subject">
          <input className="input-field" placeholder="Email subject"
            value={custom.subject} onChange={e => setCustom(c => ({ ...c, subject: e.target.value }))} />
        </Field>
        <Field label="Message">
          <textarea className="input-field resize-none" rows={5}
            placeholder="Email body..."
            value={custom.text} onChange={e => setCustom(c => ({ ...c, text: e.target.value }))} />
        </Field>
        <button
          disabled={!custom.to || !custom.subject || !custom.text || loading.customEmail}
          onClick={() => run('customEmail', () => {
            const to = custom.to.split(',').map(a => a.trim()).filter(Boolean)
            return api.post('/communications/email/custom', {
              to, subject: custom.subject, text: custom.text,
            })
          })}
          className="btn-primary disabled:opacity-60"
        >
          {loading.customEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Send Email
        </button>
        <StatusBadge status={status.customEmail} />
      </Section>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// WHATSAPP TAB
// ═══════════════════════════════════════════════════════════
function WhatsAppTab() {
  const [announcement, setAnnouncement] = useState({ announcementId: '' })
  const [payment, setPayment]           = useState({ phone: '', name: '', amount: '', reference: '' })
  const [custom, setCustom]             = useState({ phones: '', message: '' })
  const [loading, setLoading]           = useState({})
  const [status, setStatus]             = useState({})

  const run = async (key, fn) => {
    setLoading(l => ({ ...l, [key]: true }))
    setStatus(s => ({ ...s, [key]: null }))
    try {
      const res = await fn()
      setStatus(s => ({ ...s, [key]: { ok: true, msg: res.data?.message || 'Message sent' } }))
      toast.success(res.data?.message || 'WhatsApp message sent')
    } catch (err) {
      setStatus(s => ({ ...s, [key]: { ok: false, msg: err.message } }))
      toast.error(err.message)
    } finally {
      setLoading(l => ({ ...l, [key]: false }))
    }
  }

  return (
    <div className="space-y-4">
      {/* Announcement */}
      <Section title="Announcement Broadcast" icon={Megaphone}>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Broadcast an announcement via WhatsApp to all active members with phone numbers.
        </p>
        <Field label="Announcement ID">
          <input type="number" min="1" className="input-field" placeholder="e.g. 5"
            value={announcement.announcementId}
            onChange={e => setAnnouncement({ announcementId: e.target.value })} />
        </Field>
        <button
          disabled={!announcement.announcementId || loading.waAnn}
          onClick={() => run('waAnn', () =>
            api.post('/communications/whatsapp/announcement', { announcementId: Number(announcement.announcementId) })
          )}
          className="btn-primary disabled:opacity-60"
        >
          {loading.waAnn ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Broadcast
        </button>
        <StatusBadge status={status.waAnn} />
      </Section>

      {/* Payment Confirmation */}
      <Section title="Payment Confirmation" icon={Receipt} defaultOpen={false}>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Send a payment confirmation WhatsApp message to a specific number.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Phone Number">
            <input className="input-field" placeholder="+254712345678" value={payment.phone}
              onChange={e => setPayment(p => ({ ...p, phone: e.target.value }))} />
          </Field>
          <Field label="Member Name">
            <input className="input-field" placeholder="John Doe" value={payment.name}
              onChange={e => setPayment(p => ({ ...p, name: e.target.value }))} />
          </Field>
          <Field label="Amount (KES)">
            <input type="number" className="input-field" placeholder="1000" value={payment.amount}
              onChange={e => setPayment(p => ({ ...p, amount: e.target.value }))} />
          </Field>
          <Field label="Reference / Receipt No.">
            <input className="input-field" placeholder="QWERTY123" value={payment.reference}
              onChange={e => setPayment(p => ({ ...p, reference: e.target.value }))} />
          </Field>
        </div>
        <button
          disabled={!payment.phone || !payment.name || !payment.amount || !payment.reference || loading.waPayment}
          onClick={() => run('waPayment', () =>
            api.post('/communications/whatsapp/payment-confirmation', {
              phone: payment.phone, name: payment.name,
              amount: Number(payment.amount), reference: payment.reference,
            })
          )}
          className="btn-primary disabled:opacity-60"
        >
          {loading.waPayment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Send Confirmation
        </button>
        <StatusBadge status={status.waPayment} />
      </Section>

      {/* Custom WhatsApp */}
      <Section title="Custom Message" icon={MessageCircle} defaultOpen={false}>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Send a custom WhatsApp message to specific numbers (admin only). Separate multiple with commas.
        </p>
        <Field label="Phone Number(s)">
          <input className="input-field" placeholder="+254712345678, +254700000000"
            value={custom.phones} onChange={e => setCustom(c => ({ ...c, phones: e.target.value }))} />
        </Field>
        <Field label="Message">
          <textarea className="input-field resize-none" rows={4}
            placeholder="Your WhatsApp message..."
            value={custom.message} onChange={e => setCustom(c => ({ ...c, message: e.target.value }))} />
        </Field>
        <button
          disabled={!custom.phones || !custom.message || loading.waCustom}
          onClick={() => run('waCustom', () => {
            const phones = custom.phones.split(',').map(p => p.trim()).filter(Boolean)
            return api.post('/communications/whatsapp/custom', { phones, message: custom.message })
          })}
          className="btn-primary disabled:opacity-60"
        >
          {loading.waCustom ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Send Message
        </button>
        <StatusBadge status={status.waCustom} />
      </Section>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════
export default function Communication() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('sms')

  const isAdmin = user?.role === 'administrator'

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="page-title">Communications</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Send SMS, emails and WhatsApp messages to members
        </p>
      </div>

      {/* Access note for non-admin */}
      {!isAdmin && (
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-xl text-sm text-yellow-700 dark:text-yellow-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          Custom messages are restricted to administrators. Treasurers can send templated messages only.
        </div>
      )}

      {/* Channel stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'SMS', sub: 'Africa\'s Talking', icon: MessageSquare, color: 'brand' },
          { label: 'Email', sub: 'Nodemailer / SMTP', icon: Mail, color: 'blue' },
          { label: 'WhatsApp', sub: 'Twilio', icon: MessageCircle, color: 'green' },
        ].map(c => (
          <div key={c.label} className="card p-3 text-center">
            <c.icon className={`w-6 h-6 text-${c.color}-600 mx-auto mb-1`} />
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{c.label}</p>
            <p className="text-xs text-gray-400">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={clsx(
                'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                activeTab === t.id
                  ? 'bg-white dark:bg-gray-700 text-brand-700 dark:text-brand-300 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              )}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'sms'      && <SmsTab />}
      {activeTab === 'email'    && <EmailTab />}
      {activeTab === 'whatsapp' && <WhatsAppTab />}
    </div>
  )
}
