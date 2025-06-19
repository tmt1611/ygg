
import { useState, useCallback, useEffect } from 'react';
import { generateUUID } from '../utils.js';
import { APP_STORAGE_KEYS } from '../constants.js';

export const useHistoryManager = () => {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem(APP_STORAGE_KEYS.TECH_TREE_HISTORY);
      if (storedHistory) {
        const parsedHistory = JSON.parse(storedHistory);
        if (Array.isArray(parsedHistory) && parsedHistory.every(entry => entry.id && entry.timestamp && entry.type && entry.summary)) {
          setHistory(parsedHistory);
        }
      }
    } catch (e) {
      console.error("Error loading history from localStorage:", e);
    }
  }, []);

  useEffect(() => {
    // Debounce localStorage update to avoid excessive writes.
    const handler = setTimeout(() => {
      if (history.length > 0) {
        localStorage.setItem(APP_STORAGE_KEYS.TECH_TREE_HISTORY, JSON.stringify(history));
      } else {
        localStorage.removeItem(APP_STORAGE_KEYS.TECH_TREE_HISTORY);
      }
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [history]);

  const addHistoryEntry = useCallback((type, summary, details) => {
    setHistory(prev => [{ id: generateUUID(), timestamp: new Date().toISOString(), type, summary, details }, ...prev.slice(0, 99)]);
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return { history, addHistoryEntry, clearHistory };
};
