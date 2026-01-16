"use client";

import { useState, useEffect } from "react";
import zxcvbn from "zxcvbn";
import {
  ShieldCheck,
  Eye,
  EyeOff,
  Check,
  X,
  AlertTriangle,
} from "lucide-react";
import styles from "./page.module.css";

export default function PasswordTool() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (password) {
        setResult(zxcvbn(password));
      } else {
        setResult(null);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [password]);

  const getScoreColor = (score) => {
    switch (score) {
      case 0:
        return "#ff4444"; // Very Weak
      case 1:
        return "#ffbb33"; // Weak
      case 2:
        return "#ffbb33"; // Fair
      case 3:
        return "#00C851"; // Good
      case 4:
        return "#007E33"; // Strong
      default:
        return "#ccc";
    }
  };

  const getScoreLabel = (score) => {
    switch (score) {
      case 0:
        return "Very Weak";
      case 1:
        return "Weak";
      case 2:
        return "Fair";
      case 3:
        return "Strong";
      case 4:
        return "Very Strong";
      default:
        return "";
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Password Audit</h1>
      </header>

      <div className={styles.content}>
        <div className={styles.inputWrapper}>
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password to analyze..."
            className={styles.passwordInput}
          />
          <button
            className={styles.eyeBtn}
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        {result && password && (
          <div className={styles.analysis}>
            <div className={styles.scoreSection}>
              <div className={styles.scoreHeader}>
                <span>Strength Score: {result.score}/4</span>
                <span
                  style={{ color: getScoreColor(result.score) }}
                  className={styles.scoreLabel}
                >
                  {getScoreLabel(result.score)}
                </span>
              </div>
              <div className={styles.meter}>
                <div
                  className={styles.fill}
                  style={{
                    width: `${(result.score + 1) * 20}%`,
                    backgroundColor: getScoreColor(result.score),
                  }}
                />
              </div>
            </div>

            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <label>Guesses</label>
                <div>{result.guesses.toExponential(1)}</div>
              </div>
              <div className={styles.statCard}>
                <label>Crack Time (Online)</label>
                <div>
                  {
                    result.crack_times_display
                      .online_no_throttling_10_per_second
                  }
                </div>
              </div>
              <div className={styles.statCard}>
                <label>Crack Time (Offline)</label>
                <div>
                  {
                    result.crack_times_display
                      .offline_slow_hashing_1e4_per_second
                  }
                </div>
              </div>
            </div>

            {(result.feedback.warning ||
              result.feedback.suggestions.length > 0) && (
              <div className={styles.feedback}>
                {result.feedback.warning && (
                  <div className={styles.warning}>
                    <AlertTriangle size={16} /> {result.feedback.warning}
                  </div>
                )}
                {result.feedback.suggestions.map((s, i) => (
                  <div key={i} className={styles.suggestion}>
                    {" "}
                    • {s}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
