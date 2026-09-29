"use client";

import { useEffect, useState } from "react";
import { ThingrMark } from "./ThingrLogo";

type Platform = "ios" | "samsung" | "android" | "other";

/** Chrome's install event (not in TypeScript's built-in types). */
type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const DISMISS_KEY = "thingr-install-dismissed";

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return "ios";
  if (/SamsungBrowser/.test(ua)) return "samsung";
  if (/Android/.test(ua)) return "android";
  return "other";
}

function isInstalled() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

const STEPS: Record<Platform, string[]> = {
  ios: [
    "Open this page in Safari.",
    "Tap the Share button (the square with an arrow pointing up).",
    "Scroll down and tap “Add to Home Screen”, then “Add”.",
  ],
  samsung: ["Tap the menu button (☰) at the bottom.", "Tap “Add page to”, then “Home screen”."],
  android: ["Tap the menu button (⋮) at the top right in Chrome.", "Tap “Add to Home screen” or “Install app”."],
  other: [
    "On a phone, open this page in Safari (iPhone) or Chrome (Android).",
    "Use the browser’s menu or Share button and choose “Add to Home Screen”.",
  ],
};

/**
 * Explains how to put Thingr on the phone's home screen, with steps for the
 * visitor's phone. Hidden once the app is opened from the home screen.
 * `dismissible` shows a "Not now" link (used on Home); the choice is
 * remembered on this phone only.
 */
export function InstallPrompt({ dismissible = false }: { dismissible?: boolean }) {
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isInstalled()) return;
    if (dismissible) {
      try {
        if (localStorage.getItem(DISMISS_KEY)) return;
      } catch {
        // Storage blocked — just show the prompt.
      }
    }
    setPlatform(detectPlatform());
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as InstallEvent);
    };
    const onInstalled = () => setPlatform(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [dismissible]);

  if (!platform) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Not remembered — fine.
    }
    setPlatform(null);
  };

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    setInstallEvent(null);
    if (outcome === "accepted") setPlatform(null);
  };

  return (
    <section aria-labelledby="install-title" className="space-y-3 rounded-3xl bg-card p-5">
      <div className="flex items-center gap-3">
        <ThingrMark size={40} />
        <div className="flex-1">
          <h2 id="install-title" className="font-semibold">
            Add Thingr to your home screen
          </h2>
          <p className="text-[15px] text-text-2">Open it in one tap, just like an app.</p>
        </div>
      </div>

      {installEvent ? (
        <button
          type="button"
          onClick={install}
          className="w-full rounded-2xl bg-accent px-5 py-3 text-[17px] font-semibold text-white"
        >
          Add to home screen
        </button>
      ) : open ? (
        <ol className="list-decimal space-y-1.5 pl-5 text-[15px]">
          {STEPS[platform].map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full rounded-2xl bg-fill px-5 py-3 text-[17px] font-semibold"
        >
          Show me how
        </button>
      )}

      {dismissible && (
        <button type="button" onClick={dismiss} className="block w-full text-center text-[15px] text-text-2">
          Not now
        </button>
      )}
    </section>
  );
}
