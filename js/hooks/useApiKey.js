import { useState, useCallback, useEffect, useMemo } from 'react';
import * as geminiService from '../services/geminiService.js';
import { APP_STORAGE_KEYS } from '../constants.js';

export const useApiKey = (addHistoryEntry) => {
  const [selectedMode, setSelectedMode] = useState('environment');
  const [selectedModel, setSelectedModel] = useState(() => {
    return localStorage.getItem(APP_STORAGE_KEYS.AI_MODEL) || geminiService.AVAILABLE_MODELS[0].id;
  });
  const [inputKey, setInputKey] = useState('');
  const [status, setStatus] = useState({ message: 'Initializing...', type: 'info', isSet: false, source: null });
  const [isProcessing, setIsProcessing] = useState(true);

  const _updateStatus = useCallback((serviceResult, context) => {
    const { success, message, source } = serviceResult;
    setStatus({
      message: message || "Status could not be determined.",
      type: success ? 'success' : (message?.toLowerCase().includes("invalid") || message?.toLowerCase().includes("failed") ? 'error' : 'info'),
      isSet: success,
      source: source || null,
    });

    if (context === 'initial_silent_load') return;

    if (success && addHistoryEntry) {
      addHistoryEntry('API_KEY_STATUS_CHANGED', `API Key from ${source} set successfully.`);
    } else if (!success && addHistoryEntry) {
      const historyMessage = `API Key update failed: ${message}`;
      addHistoryEntry('API_KEY_STATUS_CHANGED', historyMessage);
    }
  }, [addHistoryEntry]);

  useEffect(() => {
    geminiService.setActiveModel(selectedModel);
    localStorage.setItem(APP_STORAGE_KEYS.AI_MODEL, selectedModel);
  }, [selectedModel]);

  useEffect(() => {
    const initializeApiKey = async () => {
      setIsProcessing(true);
      const result = await geminiService.attemptLoadEnvKey();
      _updateStatus(result, 'initial_silent_load');
      if (!result.success) {
        setSelectedMode('pasted');
      } else {
        setSelectedMode(result.source);
      }
      setIsProcessing(false);
    };
    initializeApiKey();
  }, [_updateStatus]);

  const clearActiveUserKey = useCallback(async () => {
    setIsProcessing(true);
    geminiService.clearActiveApiKey();
    if (addHistoryEntry) addHistoryEntry('API_KEY_STATUS_CHANGED', 'API Key cleared by user.');
    const envResult = await geminiService.attemptLoadEnvKey();
    if (envResult.success) {
      _updateStatus(envResult, 'clear_and_reinit_env');
      setSelectedMode('environment');
    } else {
      _updateStatus({ success: false, message: "API Key cleared. Provide a new key or set environment variable.", source: null }, 'clear_and_reinit_pasted');
      setSelectedMode('pasted');
    }
    setInputKey('');
    setIsProcessing(false);
  }, [_updateStatus, addHistoryEntry]);

  const changeMode = useCallback((newMode) => {
    if (selectedMode === newMode || isProcessing) return;

    // When switching to 'environment', we always want to attempt to load from there,
    // clearing any pasted key. `clearActiveUserKey` handles this logic.
    if (newMode === 'environment') {
        clearActiveUserKey();
    } else {
        // When switching to 'pasted', we just change the UI to show the input.
        // The currently active key (if any, from env) remains active until the user
        // submits a new pasted key.
        setSelectedMode('pasted');
    }
  }, [selectedMode, isProcessing, clearActiveUserKey]);

  const submitPastedKey = useCallback(async (keyToSubmit) => {
    setIsProcessing(true);
    const key = (keyToSubmit || inputKey).trim();
    if (!key) {
      _updateStatus({ success: false, message: "Pasted API Key cannot be empty.", source: null }, 'submit_pasted_empty');
      setIsProcessing(false);
      return;
    }
    const result = await geminiService.setPastedApiKey(key);
    _updateStatus(result, 'submit_pasted');
    if (result.success) {
      setInputKey(key);
      setSelectedMode('pasted');
    }
    setIsProcessing(false);
  }, [_updateStatus, inputKey]);

  return useMemo(() => ({
    selectedMode,
    selectedModel,
    inputKey,
    status,
    isProcessing,
    changeMode,
    setSelectedModel,
    setInputKey,
    submitPastedKey,
    clearActiveUserKey,
  }), [selectedMode, selectedModel, inputKey, status, isProcessing, changeMode, setSelectedModel, setInputKey, submitPastedKey, clearActiveUserKey]);
};