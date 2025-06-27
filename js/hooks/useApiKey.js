import { useState, useCallback, useEffect, useMemo } from 'react';
import * as geminiService from '../services/geminiService.js';
import { APP_STORAGE_KEYS } from '../constants.js';

export const useApiKey = (addHistoryEntry) => {
  const [selectedModel, setSelectedModel] = useState(() => {
    return localStorage.getItem(APP_STORAGE_KEYS.AI_MODEL) || geminiService.AVAILABLE_MODELS[0].id;
  });
  const [inputKey, setInputKey] = useState('');
  const [status, setStatus] = useState({ message: 'Awaiting API Key...', type: 'info', isSet: false });
  const [isProcessing, setIsProcessing] = useState(false); // No processing on initial load

  const _updateStatus = useCallback((serviceResult) => {
    const { success, message } = serviceResult;
    setStatus({
      message: message || "Status could not be determined.",
      type: success ? 'success' : 'error',
      isSet: success,
    });

    if (success && addHistoryEntry) {
      addHistoryEntry('API_KEY_STATUS_CHANGED', `API Key set successfully.`);
    } else if (!success && addHistoryEntry) {
      const historyMessage = `API Key update failed: ${message}`;
      addHistoryEntry('API_KEY_STATUS_CHANGED', historyMessage);
    }
  }, [addHistoryEntry]);

  useEffect(() => {
    geminiService.setActiveModel(selectedModel);
    localStorage.setItem(APP_STORAGE_KEYS.AI_MODEL, selectedModel);
  }, [selectedModel]);

  const clearActiveUserKey = useCallback(async () => {
    setIsProcessing(true);
    geminiService.clearActiveApiKey();
    if (addHistoryEntry) addHistoryEntry('API_KEY_STATUS_CHANGED', 'API Key cleared by user.');
    _updateStatus({ success: false, message: "API Key cleared. Provide a new key to enable AI features." });
    setInputKey('');
    setIsProcessing(false);
  }, [_updateStatus, addHistoryEntry]);

  const setApiKey = useCallback(async (keyToSubmit) => {
    setIsProcessing(true);
    const key = (keyToSubmit || inputKey).trim();
    if (!key) {
      _updateStatus({ success: false, message: "API Key cannot be empty." });
      setIsProcessing(false);
      return;
    }
    // geminiService.setApiKey is async.
    const result = await geminiService.setApiKey(key);
    _updateStatus(result);
    if (result.success) {
      setInputKey(key);
    }
    setIsProcessing(false);
  }, [_updateStatus, inputKey]);

  return useMemo(() => ({
    selectedModel,
    inputKey,
    status,
    isProcessing,
    setSelectedModel,
    setInputKey,
    setApiKey,
    clearActiveUserKey,
  }), [selectedModel, inputKey, status, isProcessing, setSelectedModel, setInputKey, setApiKey, clearActiveUserKey]);
};