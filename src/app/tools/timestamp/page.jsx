"use client";

import { useState, useEffect } from "react";
import { format, fromUnixTime, getUnixTime, parseISO } from "date-fns";
import { Clock, Play, Pause, Copy, RefreshCw } from "lucide-react";
import { useUrlState } from "@/hooks/useUrlState";
import styles from "./page.module.css";

export default function TimestampTool() {
  const [now, setNow] = useState(new Date());
  const [isPaused, setIsPaused] = useState(false);

  // Input states
  const [unixInput, setUnixInput] = useUrlState("ts", "");
  const [dateInput, setDateInput] = useState("");

  // Live Clock
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused]);

  // Initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      if (unixInput) {
        // If loaded from URL, sync date input
        try {
          const date = fromUnixTime(Number(unixInput));
          if (!isNaN(date.getTime())) {
            setDateInput(date.toISOString().slice(0, 16));
          }
        } catch (e) {}
      } else {
        // Default to now
        const current = new Date();
        setUnixInput(getUnixTime(current).toString());
        setDateInput(current.toISOString().slice(0, 16));
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleUnixChange = (val) => {
    setUnixInput(val);
    try {
      const date = fromUnixTime(Number(val));
      if (!isNaN(date.getTime())) {
        setDateInput(date.toISOString().slice(0, 16));
      }
    } catch (e) {}
  };

  const handleDateChange = (val) => {
    setDateInput(val);
    try {
      const date = parseISO(val);
      if (!isNaN(date.getTime())) {
        setUnixInput(getUnixTime(date).toString());
      }
    } catch (e) {}
  };

  const setTimestampToNow = () => {
    const current = new Date();
    setUnixInput(getUnixTime(current).toString());
    setDateInput(current.toISOString().slice(0, 16));
  };

  // Derived display values based on unixInput
  let displayDate = null;
  try {
    const d = fromUnixTime(Number(unixInput));
    if (!isNaN(d.getTime())) displayDate = d;
  } catch (e) {}

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Timestamp Converter</h1>
        <div className={styles.currentClock}>
          <Clock size={18} />
          <span>{format(now, "yyyy-MM-dd HH:mm:ss")}</span>
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={styles.iconBtn}
          >
            {isPaused ? <Play size={14} /> : <Pause size={14} />}
          </button>
        </div>
      </header>

      <div className={styles.grid}>
        {/* Converter Section */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Converter</h2>

          <div className={styles.field}>
            <label>Unix Timestamp (Seconds)</label>
            <div className={styles.inputGroup}>
              <input
                type="number"
                value={unixInput}
                onChange={(e) => handleUnixChange(e.target.value)}
                className={styles.input}
              />
              <button
                onClick={() => navigator.clipboard.writeText(unixInput)}
                className={styles.copyBtn}
                title="Copy"
              >
                <Copy size={16} />
              </button>
            </div>
          </div>

          <div className={styles.field}>
            <label>Date & Time (ISO 8601)</label>
            <div className={styles.inputGroup}>
              <input
                type="datetime-local"
                value={dateInput}
                onChange={(e) => handleDateChange(e.target.value)}
                className={styles.input}
              />
            </div>
          </div>

          <button onClick={setTimestampToNow} className={styles.actionBtn}>
            <RefreshCw size={16} /> Reset to Now
          </button>
        </div>

        {/* Formats Section */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Formats</h2>
          {displayDate ? (
            <div className={styles.formatList}>
              <FormatRow label="UTC" value={displayDate.toUTCString()} />
              <FormatRow label="ISO 8601" value={displayDate.toISOString()} />
              <FormatRow label="Local" value={displayDate.toString()} />
              <FormatRow
                label="Relative"
                value={format(displayDate, "yyyy-MM-dd 'at' HH:mm")}
              />
              <FormatRow
                label="Day of Year"
                value={format(displayDate, "ddd")}
              />
              <FormatRow
                label="Week of Year"
                value={format(displayDate, "wo")}
              />
            </div>
          ) : (
            <div className={styles.error}>Invalid Timestamp</div>
          )}
        </div>
      </div>
    </div>
  );
}

function FormatRow({ label, value }) {
  return (
    <div className={styles.row}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{value}</span>
      <button
        onClick={() => navigator.clipboard.writeText(value)}
        className={styles.rowCopy}
      >
        <Copy size={14} />
      </button>
    </div>
  );
}
