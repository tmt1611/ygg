/**
 * Custom hook to manage the Gemini API key and related state.
 * It handles key validation, status updates, and model selection,
 * providing a centralized interface for API interactions.
 *
 * @param {function(string, string, object=): void} addHistoryEntry - Function to add an entry to the application's history log.
 * @returns {{
 *   selectedModel: string,
 *   inputKey: string,
 *   status: {message: string, type: 'info'|'success'|'error', isSet: boolean},
 *   isProcessing: boolean,
 *   setSelectedModel: React.Dispatch<React.SetStateAction<string>>,
 *   setInputKey: React.Dispatch<React.SetStateAction<string>>,
 *   setApiKey: (keyToSubmit: string) => Promise<void>,
 *   clearActiveUserKey: () => void
 * }} An object containing the API key state and management functions.
 */
export const useApiKey = (addHistoryEntry) => {
  // State for the selected AI model, persisted in localStorage.
  const [selectedModel, setSelectedModel] = useState(() => {
    return localStorage.getItem(APP_STORAGE_KEYS.AI_MODEL) || geminiService.AVAILABLE_MODELS[0].id;
  });

  // State for the user's API key input field.
  const [inputKey, setInputKey] = useState('');

  // State for the current status of the API key (e.g., valid, invalid, awaiting).
  const [status, setStatus] = useState({ message: 'Awaiting API Key...', type: 'info', isSet: false });

  // State to indicate if an async API key operation is in progress.
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Internal helper to update the status and log history entries based on a service result.
   * @param {{success: boolean, message: string}} serviceResult - The result from a geminiService call.
   */
  const updateStatus = useCallback((serviceResult) => {
    const { success, message } = serviceResult;
    setStatus({
      message: message || "Status could not be determined.",
      type: success ? 'success' : 'error',
      isSet: success,
    });

    if (addHistoryEntry) {
        const historyMessage = success ? 'API Key set successfully.' : `API Key update failed: ${message}`;
        addHistoryEntry('API_KEY_STATUS_CHANGED', historyMessage);
    }
  }, [addHistoryEntry]);

  // Effect to update the geminiService and localStorage when the model changes.
  useEffect(() => {
    geminiService.setActiveModel(selectedModel);
    localStorage.setItem(APP_STORAGE_KEYS.AI_MODEL, selectedModel);
  }, [selectedModel]);

  /**
   * Clears the active API key from the service and resets the UI state.
   */
  const clearActiveUserKey = useCallback(() => {
    setIsProcessing(true);
    geminiService.clearActiveApiKey();
    if (addHistoryEntry) addHistoryEntry('API_KEY_STATUS_CHANGED', 'API Key cleared by user.');
    updateStatus({ success: false, message: "API Key cleared. Provide a new key to enable AI features." });
    setInputKey('');
    setIsProcessing(false);
  }, [updateStatus, addHistoryEntry]);

  /**
   * Sets and validates the provided API key using the geminiService.
   * Updates status and processing state accordingly.
   * @param {string} keyToSubmit - The API key to set and validate.
   */
  const setApiKey = useCallback(async (keyToSubmit) => {
    setIsProcessing(true);
    const key = keyToSubmit.trim();
    if (!key) {
      updateStatus({ success: false, message: "API Key cannot be empty." });
      setIsProcessing(false);
      return;
    }

    const result = await geminiService.setApiKey(key);
    updateStatus(result);
    if (result.success) {
      setInputKey(key);
    }
    setIsProcessing(false);
  }, [updateStatus]);

  // Memoize the returned object to prevent unnecessary re-renders in consumer components.
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