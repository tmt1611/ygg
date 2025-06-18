import { useState, useCallback, useEffect } from 'react';
import * as geminiService from '../services/geminiService.js';

export const useApiKey = (addHistoryEntry) => {
  const [selectedMode, setSelectedMode] = useState('environment');
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

  const changeMode = useCallback((newMode) => {
    if (selectedMode === newMode) return;
    setSelectedMode(newMode);
    // If user selects 'environment', re-check it, but don't clear a valid pasted key.
    if (newMode === 'environment' && status.source !== 'environment') {
        const checkEnv = async () => {
            setIsProcessing(true);
            const result = await geminiService.attemptLoadEnvKey();
            if (result.success) {
                _updateStatus(result, 'mode_change_env_success');
            }
            // If it fails, we just keep the current status (which might be a valid pasted key)
            // and let the user see the 'environment' radio selected.
            setIsProcessing(false);
        };
        checkEnv();
    }
  }, [selectedMode, status.source, _updateStatus]);

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

  const hookReturn = {
    selectedMode,
    inputKey,
    status,
    isProcessing,
    changeMode,
    setInputKey,
    submitPastedKey,
    clearActiveUserKey,
  };
  
  return hookReturn;
};