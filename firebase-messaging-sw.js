/* global firebase, importScripts */
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js");

const firebaseConfig = {
  apiKey: "AIzaSyAWmJKc2v41zWnHKM_i-EALzKXQ4QAqEBY",
  authDomain: "pineapplesystem-df3ca.firebaseapp.com",
  projectId: "pineapplesystem-df3ca",
  storageBucket: "pineapplesystem-df3ca.firebasestorage.app",
  messagingSenderId: "292505870376",
  appId: "1:292505870376:web:cd6b3f0bab69944b5e951d"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const messaging = firebase.messaging();
const DEFAULT_TARGET_URL = "/admin/index.html?section=tasks";
const DEFAULT_ICON = "/admin/Img/icon-192.png";

messaging.onBackgroundMessage((payload) => {
  const notification = payload?.notification || {};
  const data = payload?.data || {};

  // When an explicit notification payload exists, FCM can render it automatically.
  if (notification.title || notification.body) return;

  const title = data.title || "Task Reminder";
  const body = data.body || "You have a pending task reminder.";
  const targetUrl = data.url || DEFAULT_TARGET_URL;

  self.registration.showNotification(title, {
    body,
    icon: DEFAULT_ICON,
    badge: DEFAULT_ICON,
    tag: data.tag || "task-reminder",
    renotify: true,
    data: {
      url: targetUrl
    }
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification?.close();

  const targetUrl = event.notification?.data?.url || DEFAULT_TARGET_URL;
  event.waitUntil((async () => {
    const clientsList = await clients.matchAll({ type: "window", includeUncontrolled: true });

    for (const client of clientsList) {
      try {
        if ("navigate" in client) {
          await client.navigate(targetUrl);
        }
      } catch (error) {
        // Ignore navigation error and keep trying to focus.
      }

      if ("focus" in client) {
        await client.focus();
        return;
      }
    }

    if (clients.openWindow) {
      await clients.openWindow(targetUrl);
    }
  })());
});
