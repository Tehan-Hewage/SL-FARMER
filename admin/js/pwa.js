let deferredInstallPrompt = null;
let installButton = null;
const SW_VERSION = "20260220-4";

document.addEventListener("DOMContentLoaded", () => {
  installButton = document.getElementById("installAppBtn");
  if (!installButton) return;

  installButton.addEventListener("click", handleInstallClick);
  registerServiceWorker();
  syncInstallUiState();
});

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  syncInstallUiState();
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  document.body.classList.add("app-installed");
  syncInstallUiState();
});

async function handleInstallClick() {
  if (!installButton) return;

  if (isStandaloneMode()) {
    installButton.hidden = true;
    return;
  }

  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    syncInstallUiState();
    return;
  }

  if (isIosSafari()) {
    window.alert("On iPhone/iPad: tap Share, then choose 'Add to Home Screen'.");
    return;
  }

  window.alert("Install is not available yet on this browser. Keep using HTTPS and try again.");
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    if (isLocalDevHost()) {
      cleanupDevServiceWorkers();
      return;
    }

    let reloading = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    });

    navigator.serviceWorker.register(`./service-worker.js?v=${SW_VERSION}`)
      .then((registration) => {
        setupSwUpdateFlow(registration);
        registration.update().catch(() => {});
      })
      .catch((error) => {
        console.warn("Service worker registration failed:", error);
      });
  });
}

function setupSwUpdateFlow(registration) {
  if (registration.waiting) {
    registration.waiting.postMessage({ type: "SKIP_WAITING" });
  }

  registration.addEventListener("updatefound", () => {
    const worker = registration.installing;
    if (!worker) return;

    worker.addEventListener("statechange", () => {
      if (worker.state === "installed" && navigator.serviceWorker.controller) {
        worker.postMessage({ type: "SKIP_WAITING" });
      }
    });
  });
}

function isLocalDevHost() {
  return ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname);
}

async function cleanupDevServiceWorkers() {
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("pineapple-farm-shell-"))
          .map((key) => caches.delete(key))
      );
    }
  } catch (error) {
    console.warn("Service worker cleanup (dev mode) failed:", error);
  }
}

function syncInstallUiState() {
  if (!installButton) return;
  const standalone = isStandaloneMode();
  document.body.classList.toggle("app-installed", standalone);
  installButton.hidden = standalone;
}

function isStandaloneMode() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function isIosSafari() {
  const ua = window.navigator.userAgent || "";
  const isIos = /iPhone|iPad|iPod/i.test(ua);
  const isSafari = /Safari/i.test(ua) && !/CriOS|FxiOS|OPiOS|EdgiOS/i.test(ua);
  return isIos && isSafari;
}
