# Netlify Task Reminder Setup (Push + Email)

This project now includes:
- `netlify/functions/task-reminder-dispatch.js` (scheduled function, every 15 minutes)
- Web push token registration from `admin/js/firebase-app.js`
- Root messaging service worker `firebase-messaging-sw.js`

## 1) Netlify Environment Variables

Set these in Netlify site settings:

- `FIREBASE_SERVICE_ACCOUNT_JSON`  
  Service account JSON (raw JSON string or base64-encoded JSON).
- `TASK_REMINDER_TIMEZONE`  
  Example: `Asia/Colombo`
- `TASK_REMINDER_TZ_OFFSET`  
  Example: `+05:30`
- `TASK_REMINDER_TARGET_URL`  
  Example: `https://your-domain.com/admin/index.html?section=tasks`
- `TASK_REMINDER_ICON_URL`  
  Example: `https://your-domain.com/admin/Img/icon-192.png`

Email variables (SMTP):

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_SECURE` (`true` for SSL port 465, otherwise `false`)
- `EMAIL_FROM` (sender email)
- `TASK_REMINDER_EMAILS` (optional comma-separated extra recipients)

## 2) Admin VAPID Key

In `admin/index.html`, set the VAPID key:

```html
<meta name="pf-fcm-vapid-key" content="YOUR_PUBLIC_VAPID_KEY">
```

Use your Firebase Web Push certificate public key.

## 3) Firestore Collections Used

- `fertilizer_schedule` (tasks)
- `lands` (land names)
- `users` (admin emails)
- `notification_tokens` (web push tokens from admin devices)
- `task_reminder_dispatch_log` (dedupe log)

## 4) Deploy

1. Push code to your Git provider.
2. Trigger Netlify deploy.
3. Open admin, login as admin, and click `Turn On 3-to-Today Alerts` once on each device/browser.
4. Allow browser notifications.

## Notes

- Push while app/site is closed needs valid FCM token registration from admin devices.
- Scheduled function runs every 15 minutes and sends reminders for `3, 2, 1, 0` days before due time.
