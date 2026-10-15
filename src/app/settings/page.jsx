"use client";

import { useState, useEffect } from "react";
import {
  Monitor,
  Moon,
  Sun,
  Trash2,
  RotateCcw,
  Info,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { useFavorites } from "@/components/FavoritesProvider";
import { useToast } from "@/components/Toast";
import { ANALYTICS_OPT_OUT_KEY, isAnalyticsOptedOut } from "@/components/AnalyticsGate";
import styles from "./page.module.css";
import pkg from "../../../package.json";

export default function Settings() {
  const { theme, setTheme, availableThemes } = useTheme();
  const { clearData } = useFavorites();
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [analyticsOff, setAnalyticsOff] = useState(false);
  const [gpc, setGpc] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
      setAnalyticsOff(isAnalyticsOptedOut());
      setGpc(Boolean(navigator.globalPrivacyControl));
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const toggleAnalytics = () => {
    const next = !analyticsOff;
    try {
      if (next) localStorage.setItem(ANALYTICS_OPT_OUT_KEY, "1");
      else localStorage.removeItem(ANALYTICS_OPT_OUT_KEY);
    } catch { /* storage unavailable */ }
    setAnalyticsOff(next);
    showToast(
      next ? "Analytics turned off" : "Analytics turned on",
      "success",
      next ? "No analytics script will load from now on." : "Takes effect on the next page load.",
    );
  };

  // Everything UtilHub stores starts with "utilhub"; theme and the analytics
  // opt-out are kept so a reset never silently re-enables analytics.
  const handleClearData = async () => {
    const keep = new Set([ANALYTICS_OPT_OUT_KEY]);
    for (const store of [localStorage, sessionStorage]) {
      try {
        Object.keys(store)
          .filter((key) => key.startsWith("utilhub") && !keep.has(key))
          .forEach((key) => store.removeItem(key));
      } catch { /* storage unavailable */ }
    }
    try {
      if ("caches" in window) {
        const names = await caches.keys();
        await Promise.all(names.map((name) => caches.delete(name)));
      }
    } catch { /* Cache Storage unavailable */ }
    clearData();
    setConfirmingClear(false);
    showToast("All local data cleared", "success", "Reloading to reset every tool…");
    setTimeout(() => window.location.reload(), 800);
  };

  if (!mounted) return null;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Settings</h1>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <Monitor size={20} />
          <span>Appearance</span>
        </h2>

        <div className={styles.card}>
          <div className={styles.row}>
            <div className={styles.label}>
              <span>Theme</span>
              <p className={styles.description}>
                Select your preferred interface appearance.
              </p>
            </div>

            <div className={styles.themeGrid}>
              {availableThemes.map((t) => (
                <button
                  key={t.id}
                  className={`${styles.themeOption} ${theme === t.id ? styles.activeTheme : ""}`}
                  onClick={() => setTheme(t.id)}
                  title={t.name}
                >
                  <div
                    className={styles.themePreview}
                    style={{ background: t.color }}
                  >
                    {theme === t.id && (
                      <div className={styles.checkIndicator}>✓</div>
                    )}
                  </div>
                  <span className={styles.themeName}>{t.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <RotateCcw size={20} />
          <span>Data Management</span>
        </h2>

        <div className={styles.card}>
          <div className={styles.row}>
            <div className={styles.label}>
              <span>Reset Application</span>
              <p className={styles.description}>
                Everything UtilHub keeps lives only in this browser. This clears
                favorites, history, saved API requests, environments, pipelines,
                preferences and offline caches. Your theme is kept.
              </p>
            </div>
            {confirmingClear ? (
              <div className={styles.confirmRow}>
                <button className={styles.secondaryBtn} onClick={() => setConfirmingClear(false)}>
                  Cancel
                </button>
                <button className={styles.dangerBtn} onClick={handleClearData}>
                  <Trash2 size={16} />
                  <span>Yes, clear everything</span>
                </button>
              </div>
            ) : (
              <button className={styles.dangerBtn} onClick={() => setConfirmingClear(true)}>
                <Trash2 size={16} />
                <span>Clear Data</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <ShieldCheck size={20} />
          <span>Privacy</span>
        </h2>

        <div className={styles.card}>
          <div className={styles.row}>
            <div className={styles.label}>
              <span>Usage analytics</span>
              <p className={styles.description}>
                Anonymous page views through Vercel Web Analytics — the page path
                only. Tool input, query strings and URL fragments are stripped
                before anything is sent.
                {gpc && " Off because your browser sends Global Privacy Control."}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={!analyticsOff && !gpc}
              aria-label="Usage analytics"
              className={`${styles.switch} ${!analyticsOff && !gpc ? styles.switchOn : ""}`}
              onClick={toggleAnalytics}
              disabled={gpc}
            >
              <span className={styles.switchKnob} />
            </button>
          </div>
          <div className={styles.row}>
            <div className={styles.label}>
              <span>Where your data goes</span>
              <p className={styles.description}>
                Tools run in your browser. Shareable state lives in the part of
                the URL after <code>#</code>, which browsers never send to a
                server; secrets such as JWTs and cURL commands are never put in
                the URL. Tools marked <strong>AI</strong> send only the text you
                choose to Groq, and only when you press an AI button. The API
                Client sends requests from your browser or your own local proxy
                unless you choose the UtilHub proxy.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <Sparkles size={20} />
          <span>AI Configuration</span>
        </h2>

        <div className={styles.card}>
          <div className={styles.row}>
            <div className={styles.label}>
              <span>AI Assist</span>
              <p className={styles.description}>
                Optional, powered by Groq (Llama 3.3 70B). Nothing is sent until
                you press an AI button; the API key stays on the server.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <Info size={20} />
          <span>About</span>
        </h2>

        <div className={styles.card}>
          <div className={styles.row}>
            <div className={styles.label}>
              <span>Version</span>
            </div>
            <span className={styles.value}>v{pkg.version}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
