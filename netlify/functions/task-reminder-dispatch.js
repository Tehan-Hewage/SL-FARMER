const crypto = require("crypto");
const { schedule } = require("@netlify/functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

const TASK_COLLECTION = "fertilizer_schedule";
const LANDS_COLLECTION = "lands";
const USERS_COLLECTION = "users";
const TOKEN_COLLECTION = "notification_tokens";
const LOG_COLLECTION = "task_reminder_dispatch_log";
const REMINDER_DAYS = [3, 2, 1, 0];
const DEFAULT_TZ = "Asia/Colombo";
const DEFAULT_OFFSET = "+05:30";
const DEFAULT_TIME = "09:00";

function normalizeId(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function parseCsv(value) {
  return normalizeId(value)
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function normalizeTaskTime(value) {
  const raw = normalizeId(value);
  const match = raw.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!match) return DEFAULT_TIME;
  return `${match[1]}:${match[2]}`;
}

function normalizeDatePart(value) {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);
  if (value?.toDate) {
    const date = value.toDate();
    return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function toDateKey(date, timeZone) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function formatDate(date, timeZone) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(date);
}

function formatTime(date, timeZone) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  }).format(date);
}

function formatDateTime(date, timeZone) {
  return `${formatDate(date, timeZone)} ${formatTime(date, timeZone)}`;
}

function label(value) {
  return normalizeId(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function dueAtFromTask(task, tzOffset) {
  const datePart = normalizeDatePart(task.next_date);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return null;
  const timePart = normalizeTaskTime(task.task_time);
  const dueAt = new Date(`${datePart}T${timePart}:00${tzOffset}`);
  if (Number.isNaN(dueAt.getTime())) return null;
  return dueAt;
}

function buildReminderLogId(taskId, dueDate, taskTime, daysBefore) {
  const payload = `${taskId}|${dueDate}|${taskTime}|d${daysBefore}`;
  return crypto.createHash("sha1").update(payload).digest("hex");
}

function chunk(array, size) {
  if (!Array.isArray(array) || size <= 0) return [];
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

function parseServiceAccount() {
  const projectId = normalizeId(process.env.FIREBASE_PROJECT_ID);
  const clientEmail = normalizeId(process.env.FIREBASE_CLIENT_EMAIL);
  const privateKeyRaw = normalizeId(process.env.FIREBASE_PRIVATE_KEY);
  if (projectId && clientEmail && privateKeyRaw) {
    return {
      type: "service_account",
      project_id: projectId,
      client_email: clientEmail,
      private_key: privateKeyRaw.replace(/\\n/g, "\n")
    };
  }

  const raw = normalizeId(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  if (!raw) {
    throw new Error("Firebase credentials are missing. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY.");
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (jsonError) {
    try {
      const decoded = Buffer.from(raw, "base64").toString("utf8");
      parsed = JSON.parse(decoded);
    } catch (base64Error) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON or base64 JSON.");
    }
  }

  if (parsed.private_key) {
    parsed.private_key = String(parsed.private_key).replace(/\\n/g, "\n");
  }
  return parsed;
}

function getFirebaseApp() {
  if (admin.apps.length) return admin.app();
  const serviceAccount = parseServiceAccount();
  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

function createMailer() {
  const host = normalizeId(process.env.SMTP_HOST);
  const port = Number(process.env.SMTP_PORT || 587);
  const user = normalizeId(process.env.SMTP_USER);
  const pass = normalizeId(process.env.SMTP_PASS);
  const from = normalizeId(process.env.EMAIL_FROM);

  if (!host || !from) {
    return null;
  }

  const secure = normalizeId(process.env.SMTP_SECURE).toLowerCase() === "true" || port === 465;
  const auth = user && pass ? { user, pass } : undefined;
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth
  });

  return { transporter, from };
}

async function loadLandsMap(db) {
  const landsMap = new Map();
  const snap = await db.collection(LANDS_COLLECTION).get();
  snap.forEach((docSnap) => {
    const data = docSnap.data() || {};
    const landName = normalizeId(data.land_name) || "Unknown";
    [docSnap.id, data.land_id, data._land_key]
      .map((entry) => normalizeId(entry))
      .filter(Boolean)
      .forEach((key) => landsMap.set(key, landName));
  });
  return landsMap;
}

async function loadPushTargets(db) {
  const tokenDocByToken = new Map();
  const snap = await db.collection(TOKEN_COLLECTION).get();

  snap.forEach((docSnap) => {
    const data = docSnap.data() || {};
    if (data.enabled === false) return;
    const role = normalizeId(data.role).toLowerCase();
    if (role && role !== "admin") return;
    const token = normalizeId(data.token);
    if (!token) return;
    tokenDocByToken.set(token, docSnap.id);
  });

  return {
    tokens: [...tokenDocByToken.keys()],
    tokenDocByToken
  };
}

async function loadAdminEmails(db) {
  const recipients = new Set(parseCsv(process.env.TASK_REMINDER_EMAILS).map((email) => email.toLowerCase()));
  const snap = await db.collection(USERS_COLLECTION).where("role", "==", "admin").get();
  snap.forEach((docSnap) => {
    const email = normalizeId(docSnap.data()?.email).toLowerCase();
    if (email) recipients.add(email);
  });
  return [...recipients];
}

function buildReminderPayload(task, landName, dueAt, daysBefore, now, timeZone, adminUrl) {
  const expenseType = label(task.expense_type || "task");
  const category = normalizeId(task.category || task.fertilizer_type);
  const categoryLabel = category ? label(category) : "";
  const taskName = categoryLabel ? `${expenseType} - ${categoryLabel}` : expenseType;
  const dueText = formatDateTime(dueAt, timeZone);
  const whenText = daysBefore === 0
    ? "Task is due today"
    : `Task is due in ${daysBefore} day${daysBefore === 1 ? "" : "s"}`;
  const title = daysBefore === 0 ? `Task Day: ${taskName}` : `Task Reminder: ${taskName}`;
  const body = `${whenText}. Land: ${landName}. When: ${dueText}`;
  const subject = daysBefore === 0
    ? `Task Due Today: ${taskName}`
    : `Task Reminder (${daysBefore} day${daysBefore === 1 ? "" : "s"} left): ${taskName}`;

  return {
    title,
    body,
    subject,
    taskName,
    whenText,
    dueText,
    taskId: normalizeId(task.id),
    landName,
    daysBefore,
    dueDate: formatDate(dueAt, timeZone),
    dueTime: formatTime(dueAt, timeZone),
    adminUrl,
    nowIso: now.toISOString()
  };
}

async function sendPushReminder(messaging, pushTargets, payload, iconUrl) {
  if (!pushTargets.tokens.length) {
    return { sent: false, successCount: 0, failureCount: 0, invalidTokens: [] };
  }

  const webpushNotification = {
    tag: `task-reminder-${payload.taskId || "task"}`,
    renotify: true
  };
  if (iconUrl) {
    webpushNotification.icon = iconUrl;
    webpushNotification.badge = iconUrl;
  }

  const webpush = {
    notification: webpushNotification
  };
  if (payload.adminUrl) {
    webpush.fcmOptions = { link: payload.adminUrl };
  }

  const baseMessage = {
    notification: {
      title: payload.title,
      body: payload.body
    },
    data: {
      url: payload.adminUrl,
      taskId: payload.taskId,
      daysBefore: String(payload.daysBefore),
      dueDate: payload.dueDate,
      dueTime: payload.dueTime,
      title: payload.title,
      body: payload.body,
      tag: `task-reminder-${payload.taskId || "task"}`
    },
    webpush
  };

  let successCount = 0;
  let failureCount = 0;
  const invalidTokens = [];
  const tokenChunks = chunk(pushTargets.tokens, 500);

  for (const tokenChunk of tokenChunks) {
    const response = await messaging.sendEachForMulticast({
      ...baseMessage,
      tokens: tokenChunk
    });

    successCount += response.successCount;
    failureCount += response.failureCount;

    response.responses.forEach((entry, index) => {
      if (entry.success) return;
      const errorCode = normalizeId(entry?.error?.code);
      if (errorCode === "messaging/registration-token-not-registered" || errorCode === "messaging/invalid-registration-token") {
        invalidTokens.push(tokenChunk[index]);
      }
    });
  }

  return {
    sent: successCount > 0,
    successCount,
    failureCount,
    invalidTokens
  };
}

async function cleanupInvalidPushTokens(db, pushTargets, invalidTokens) {
  if (!invalidTokens.length) return;
  const batch = db.batch();
  let hasDeletes = false;

  invalidTokens.forEach((token) => {
    const docId = pushTargets.tokenDocByToken.get(token);
    if (!docId) return;
    batch.delete(db.collection(TOKEN_COLLECTION).doc(docId));
    hasDeletes = true;
  });

  if (hasDeletes) {
    await batch.commit();
  }
}

async function sendEmailReminder(mailer, recipients, payload) {
  if (!mailer || !recipients.length) {
    return { sent: false, skipped: true };
  }

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2 style="margin: 0 0 12px;">${payload.title}</h2>
      <p style="margin: 0 0 10px;">${payload.whenText}</p>
      <p style="margin: 0 0 6px;"><strong>Land:</strong> ${payload.landName}</p>
      <p style="margin: 0 0 6px;"><strong>Task:</strong> ${payload.taskName}</p>
      <p style="margin: 0 0 14px;"><strong>When:</strong> ${payload.dueText}</p>
      <p style="margin: 0;">Open admin tasks: <a href="${payload.adminUrl}">${payload.adminUrl}</a></p>
    </div>
  `;

  const text = [
    payload.title,
    payload.whenText,
    `Land: ${payload.landName}`,
    `Task: ${payload.taskName}`,
    `When: ${payload.dueText}`,
    `Open admin tasks: ${payload.adminUrl}`
  ].join("\n");

  await mailer.transporter.sendMail({
    from: mailer.from,
    to: mailer.from,
    bcc: recipients.join(","),
    subject: payload.subject,
    text,
    html
  });

  return { sent: true, skipped: false };
}

exports.handler = schedule("*/15 * * * *", async () => {
  const timeZone = normalizeId(process.env.TASK_REMINDER_TIMEZONE) || DEFAULT_TZ;
  const tzOffset = normalizeId(process.env.TASK_REMINDER_TZ_OFFSET) || DEFAULT_OFFSET;
  const siteUrl = normalizeId(process.env.SITE_URL || process.env.URL).replace(/\/+$/, "");
  const adminUrl = normalizeId(process.env.TASK_REMINDER_TARGET_URL) || (siteUrl ? `${siteUrl}/admin/index.html?section=tasks` : "");
  const iconUrl = normalizeId(process.env.TASK_REMINDER_ICON_URL) || (siteUrl ? `${siteUrl}/admin/Img/icon-192.png` : "");

  getFirebaseApp();
  const db = admin.firestore();
  const messaging = admin.messaging();
  const mailer = createMailer();
  const now = new Date();
  const todayKey = toDateKey(now, timeZone);

  const summary = {
    checkedTasks: 0,
    dueTodayCandidates: 0,
    remindersTriggered: 0,
    remindersSkippedLogged: 0,
    pushSent: 0,
    pushFailed: 0,
    emailSent: 0,
    emailFailed: 0,
    invalidTokensRemoved: 0
  };

  const [tasksSnap, landsMap, pushTargets, emailRecipients] = await Promise.all([
    db.collection(TASK_COLLECTION).get(),
    loadLandsMap(db),
    loadPushTargets(db),
    loadAdminEmails(db)
  ]);

  const tasks = tasksSnap.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() || {})
  }));

  summary.checkedTasks = tasks.length;

  for (const task of tasks) {
    const status = normalizeId(task.status).toLowerCase();
    if (status === "completed") continue;

    const dueAt = dueAtFromTask(task, tzOffset);
    if (!dueAt) continue;
    if (now > dueAt) continue;

    const dueDateKey = toDateKey(dueAt, timeZone);
    if (todayKey > dueDateKey) continue;

    const landId = normalizeId(task.land_id);
    const landName = landsMap.get(landId) || "Unknown";
    const taskTime = normalizeTaskTime(task.task_time);
    const dueDate = normalizeDatePart(task.next_date);

    for (const daysBefore of REMINDER_DAYS) {
      const reminderDate = new Date(dueAt);
      reminderDate.setUTCDate(reminderDate.getUTCDate() - daysBefore);
      if (toDateKey(reminderDate, timeZone) !== todayKey) continue;

      summary.dueTodayCandidates += 1;

      const logId = buildReminderLogId(task.id, dueDate, taskTime, daysBefore);
      const logRef = db.collection(LOG_COLLECTION).doc(logId);
      const alreadySent = await logRef.get();
      if (alreadySent.exists) {
        summary.remindersSkippedLogged += 1;
        continue;
      }

      const payload = buildReminderPayload(task, landName, dueAt, daysBefore, now, timeZone, adminUrl);

      let pushResult = { sent: false, successCount: 0, failureCount: 0, invalidTokens: [] };
      let emailResult = { sent: false };

      try {
        pushResult = await sendPushReminder(messaging, pushTargets, payload, iconUrl);
      } catch (error) {
        console.error("Push reminder failed:", error);
      }

      try {
        emailResult = await sendEmailReminder(mailer, emailRecipients, payload);
      } catch (error) {
        console.error("Email reminder failed:", error);
        summary.emailFailed += 1;
      }

      if (pushResult.invalidTokens.length) {
        try {
          await cleanupInvalidPushTokens(db, pushTargets, pushResult.invalidTokens);
          summary.invalidTokensRemoved += pushResult.invalidTokens.length;
        } catch (error) {
          console.error("Invalid token cleanup failed:", error);
        }
      }

      summary.pushSent += pushResult.successCount;
      summary.pushFailed += pushResult.failureCount;
      if (emailResult.sent) summary.emailSent += 1;

      if (pushResult.sent || emailResult.sent) {
        await logRef.set({
          task_id: normalizeId(task.id),
          task_date: dueDate,
          task_time: taskTime,
          days_before: daysBefore,
          sent_at: admin.firestore.FieldValue.serverTimestamp(),
          timezone: timeZone,
          push_success_count: pushResult.successCount,
          push_failure_count: pushResult.failureCount,
          email_sent: Boolean(emailResult.sent),
          admin_url: adminUrl
        }, { merge: true });
        summary.remindersTriggered += 1;
      }
    }
  }

  console.log("Task reminder dispatch summary:", summary);
  return {
    statusCode: 200,
    body: JSON.stringify(summary)
  };
});
