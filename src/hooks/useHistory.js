import { useState, useEffect } from "react";

/**
 * Custom hook to manage history in localStorage
 * @param {string} key - LocalStorage key
 * @param {number} maxItems - Maximum number of items to keep
 * @returns {object} - { history, addToHistory, clearHistory, removeFromHistory }
 */
export function useHistory(key, maxItems = 20) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(key);
      const timer = setTimeout(() => {
        if (saved) {
          setHistory(JSON.parse(saved));
        }
      }, 0);
      return () => clearTimeout(timer);
    } catch (e) {
      console.error(`Failed to load history for key "${key}":`, e);
    }
  }, [key]);

  const addToHistory = (item) => {
    setHistory((prev) => {
      // Check for duplicates (optional, based on deep equality or simple JSON stringify)
      const newItemJson = JSON.stringify(item);
      const filtered = prev.filter((i) => JSON.stringify(i) !== newItemJson);

      const newHistory = [item, ...filtered].slice(0, maxItems);

      try {
        localStorage.setItem(key, JSON.stringify(newHistory));
      } catch (e) {
        console.error("Failed to save history:", e);
      }
      return newHistory;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(key);
  };

  const removeFromHistory = (index) => {
    setHistory((prev) => {
      const newHistory = [...prev];
      newHistory.splice(index, 1);
      localStorage.setItem(key, JSON.stringify(newHistory));
      return newHistory;
    });
  };

  return { history, addToHistory, clearHistory, removeFromHistory };
}
