# Email Notifications Setup Guide

This project does **not** currently send emails. To add email notifications, follow these steps.

---

## 1. Choose an Email Service

| Service | Pros | Free Tier | Best For |
|---------|-----|-----------|----------|
| **Resend** | Simple API, good deliverability | 3,000 emails/month | Quick setup |
| **SendGrid** | Widely used, templates | 100 emails/day | Production |
| **Nodemailer + SMTP** | Use any SMTP (Gmail, Outlook) | Depends on provider | Self-hosted / Gmail |
| **Supabase Auth** | Built-in if using Supabase Auth | Limited | Auth emails only |

**Recommended:** [Resend](https://resend.com) for simplicity, or **Nodemailer** with Gmail SMTP for zero cost.

---

## 2. Option A: Resend (Recommended)

### 2.1 Sign up and get API key

1. Go to [resend.com](https://resend.com) and create an account
2. Add and verify your domain (or use their sandbox domain for testing)
3. Go to **API Keys** → Create API Key → Copy the key (starts with `re_`)

### 2.2 Add to backend

```bash
cd backend
npm install resend
```

Add to `backend/.env`:

```env
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com
```

### 2.3 Create email utility

Create `backend/utils/email.js`:

```javascript
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || 'onboarding@resend.dev';

async function sendEmail({ to, subject, html, text }) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('Email not configured: RESEND_API_KEY missing');
    return { ok: false, error: 'Email not configured' };
  }
  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: Array.isArray(to) ? to : [to],
      subject,
      html: html || text,
    });
    if (error) {
      console.error('Email send error:', error);
      return { ok: false, error };
    }
    return { ok: true, id: data?.id };
  } catch (err) {
    console.error('Email send error:', err);
    return { ok: false, error: err.message };
  }
}

module.exports = { sendEmail };
```

### 2.4 Use in your backend

Example: send order confirmation after payment:

```javascript
const { sendEmail } = require('./utils/email');

// After payment success (e.g. in webhook or order flow)
await sendEmail({
  to: userEmail,
  subject: 'Order confirmed – BMSCE Merch',
  html: `
    <h2>Thank you for your order!</h2>
    <p>Order #${orderNumber} has been confirmed.</p>
    <p>Total: ₹${totalAmount}</p>
  `,
});
```

---

## 3. Option B: Nodemailer (Gmail SMTP)

### 3.1 Enable Gmail App Password

1. Use a Gmail account
2. Enable 2FA on that account
3. Go to [Google Account → Security → App passwords](https://myaccount.google.com/apppasswords)
4. Create an app password for "Mail"

### 3.2 Add to backend

```bash
cd backend
npm install nodemailer
```

Add to `backend/.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
EMAIL_FROM=your-email@gmail.com
```

### 3.3 Create email utility

Create `backend/utils/email.js`:

```javascript
const nodemailer = require('nodemailer');

let transporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function sendEmail({ to, subject, html, text }) {
  if (!transporter) {
    console.warn('Email not configured: SMTP vars missing');
    return { ok: false, error: 'Email not configured' };
  }
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html: html || text,
      text: text || (html ? html.replace(/<[^>]*>/g, '') : ''),
    });
    return { ok: true, id: info.messageId };
  } catch (err) {
    console.error('Email send error:', err);
    return { ok: false, error: err.message };
  }
}

module.exports = { sendEmail };
```

---

## 4. Where to Send Emails

| Event | Recipient | When |
|-------|-----------|------|
| Order placed | Customer | After `POST /api/orders/create` |
| Payment confirmed | Customer | Cashfree webhook → `payment_status = 'paid'` |
| Resell listing approved | Seller | Admin approves in AdminItems |
| Resell listing rejected | Seller | Admin rejects |
| New resell feedback | Seller | When buyer leaves feedback (optional) |

---

## 5. Quick Start Checklist

- [ ] Pick a provider (Resend or Nodemailer)
- [ ] Get API key (Resend) or Gmail app password (Nodemailer)
- [ ] Add env vars to `backend/.env`
- [ ] Create `backend/utils/email.js`
- [ ] Call `sendEmail()` from the relevant API routes
- [ ] Test with a real email address

---

## 6. Vercel / Production

If your backend runs on Vercel (serverless), ensure:

1. Add the same env vars in **Vercel Dashboard → Project → Settings → Environment Variables**
2. Resend works well with serverless; Nodemailer may need connection pooling disabled for cold starts

---

## 7. Security Notes

- Never commit API keys or passwords to git
- Use `EMAIL_FROM` with a verified domain for better deliverability
- For Resend: verify your domain to avoid "via resend.dev" in headers
