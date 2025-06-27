import { useState, useEffect, useMemo, useCallback } from 'react';
import * as geminiService from '../services/geminiService.js';
import { APP_STORAGE_KEYS } from '../constants.js';

/**
 * Manages the Gemini API key, model selection, and validation status.
 * This hook centralizes API-related state and logic.
 *
 * @param {function(string, string, object=): void} addHistoryEntry - Function to log actions to the application's history.
 * @returns {object} The API key management state and functions.
 * @property {string} selectedModel The ID of the currently selected AI model.
 * @property {React.Dispatch<React.SetStateAction<string>>} setSelectedModel Function to update the selected AI model.
 * @property {string} inputKey The current value in the API key input field.
 * @property {React.Dispatch<React.SetStateAction<string>>} setInputKey Function to update the API key input field.
 * @property {object} status An object representing the current API key status.
 * @property {string} status.message A user-friendly message about the key's status.
 * @property {'info'|'success'|'error'} status.type The type of the status message.
 * @property {boolean} status.isSet True if a valid API key is currently active.
 * @property {boolean} isProcessing True if an API key validation is in progress.
 * @property {(keyToSubmit: string) => Promise<void>} setApiKey Validates and sets a new API key.
 * @property {() => void} clearActiveUserKey Clears the active API key.
 */
export const useApiKey = (addHistoryEntry) => {
  // Lazily initialize state from localStorage to avoid reading on every render.
  const [selectedModel, setSelectedModel] = useState(() =>
    localStorage.getItem(APP_STORAGE_KEYS.AI_MODEL) || geminiService.AVAILABLE_MODELS[0].id
  );

  const [inputKey, setInputKey] = useState('');
  const [status, setStatus] = useState({ message: 'Awaiting API Key...', type: 'info', isSet: false });
  const [isProcessing, setIsProcessing] = useState(false);

  // Persist model selection to localStorage and update the service when it changes.
  useEffect(() => {
    geminiService.setActiveModel(selectedModel);
    localStorage.setItem(APP_STORAGE_KEYS.AI_MODEL, selectedModel);
  }, [selectedModel]);
  
  /**
   * Validates and sets the provided API key using the geminiService.
   * Updates status and processing state accordingly.
   * @param {string} keyToSubmit - The API key to set.
   */
  const setApiKey = useCallback((keyToSubmit) => {
    setIsProcessing(true);
    setStatus({ message: 'Validating key...', type: 'info', isSet: false });
    const key = keyToSubmit.trim();

    if (!key) {
      setStatus({ message: "API Key cannot be empty.", type: 'error', isSet: false });
      setIsProcessing(false);
      return;
    }

    // The setApiKey service is synchronous and returns a result object.
    const result = geminiService.setApiKey(key);
    
    setStatus({
      message: result.message || 'Status could not be determined.',
      type: result.success ? 'success' : 'error',
      isSet: result.success,
    });
    
    const historyMessage = result.success ? 'API Key set successfully.' : `API Key validation failed: ${result.message}`;
    addHistoryEntry('API_KEY_STATUS_CHANGED', historyMessage);
    
    if (result.success) {
      // Keep the input field populated on success for user reference,
      // as the service internally stores the key.
      setInputKey(key); 
    }
    
    setIsProcessing(false);
  }, [addHistoryEntry]);
  
  /**
   * Clears the active API key from the service and resets the UI state.
   */
  const clearActiveUserKey = useCallback(() => {
    geminiService.clearActiveApiKey();
    addHistoryEntry('API_KEY_STATUS_CHANGED', 'API Key cleared by user.');
    setStatus({ message: "API Key cleared. Provide a new key to enable AI features.", type: 'info', isSet: false });
    setInputKey('');
  }, [addHistoryEntry]);


  // Memoize the returned object to ensure consumers don't re-render unnecessarily.
  // The hook's consumers receive a stable object unless its properties actually change.
  return useMemo(() => ({
    selectedModel,
    inputKey,
    status,
    isProcessing,
    setSelectedModel,
    setInputKey,
    setApiKey,
    clearActiveUserKey,
  }), [selectedModel, inputKey, status, isProcessing, setApiKey, clearActiveUserKey]);
};