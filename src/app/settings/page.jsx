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
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { useFavorites } from "@/components/FavoritesProvider";
import { useToast } from "@/components/Toast";
import styles from "./page.module.css";
import pkg from "../../../package.json";

export default function Settings() {
  const { theme, setTheme, availableThemes } = useTheme();
  const { clearData } = useFavorites();
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleClearData = () => {
    if (
      confirm(
        "Are you sure you want to clear all favorites and history? This cannot be undone.",
      )
    ) {
      clearData();
      showToast("All data cleared successfully.", "success");
    }
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
                Clear all favorites, history, and local preferences.
              </p>
            </div>
            <button className={styles.dangerBtn} onClick={handleClearData}>
              <Trash2 size={16} />
              <span>Clear Data</span>
            </button>
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
                Powered by Groq (Llama 3.3 70B). API key is configured
                server-side for security.
              </p>
            </div>
            <span
              style={{ color: "#4ade80", fontSize: "0.85rem", fontWeight: 500 }}
            >
              ✓ Active
            </span>
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
