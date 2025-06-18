
import { useState, useCallback, useEffect } from 'react';
import * as geminiService from '../services/geminiService.js';

export const useApiKey = (addHistoryEntry) => {
  const [selectedMode, setSelectedMode] = useState('environment');
  const [inputKey, setInputKey] = useState('');
  const [status, setStatus] = useState({ message: null, type: null, isSet: false });
  const [isProcessing, setIsProcessing] = useState(false);

  const _updateStatusFromService = useCallback((serviceResult, context) => {
    const message = serviceResult.message || "Status could not be determined.";
    setStatus({
      message: message,
      type: serviceResult.success ? 'success' : (message.toLowerCase().includes("invalid") || message.toLowerCase().includes("failed") ? 'error' : 'info'),
      isSet: serviceResult.success,
    });
    if (serviceResult.success && serviceResult.source) {
      setSelectedMode(serviceResult.source);
      if(addHistoryEntry && context !== 'initial_silent_load') {
          addHistoryEntry('API_KEY_STATUS_CHANGED', `API Key from ${serviceResult.source} set successfully.`);
      }
    } else if (!serviceResult.success && context !== 'initial_silent_load' && addHistoryEntry) {
        let historyMessage = `API Key update: ${message}`;
        if (serviceResult.source) {
            historyMessage = `API Key from ${serviceResult.source} failed: ${message}`;
        }
        addHistoryEntry('API_KEY_STATUS_CHANGED', historyMessage);
    }
  }, [addHistoryEntry]);
  
  const refreshStatus = useCallback(() => {
    setIsProcessing(true);
    const currentServiceStatus = geminiService.getApiKeyStatus();
    _updateStatusFromService({
        success: currentServiceStatus.available,
        message: currentServiceStatus.message,
        source: currentServiceStatus.source
    }, 'refresh'); 
    if (!currentServiceStatus.available && selectedMode === 'environment' && !process.env.API_KEY) {
        setSelectedMode('pasted'); 
    }
    setIsProcessing(false);
  }, [_updateStatusFromService, selectedMode]);


  useEffect(() => {
    const init = async () => {
      setIsProcessing(true);
      const result = await geminiService.attemptLoadEnvKey();
      _updateStatusFromService(result, 'initial_silent_load'); 
      if (!result.success) {
          const currentServiceStatus = geminiService.getApiKeyStatus();
          if(!currentServiceStatus.available) { 
            setSelectedMode('pasted'); 
             setStatus(prev => ({
                ...prev, 
                message: prev.message || "Environment API_KEY not found or invalid. Select 'Enter API Key Manually' or set it in your environment.", 
                type: 'info'
            }));
          }
      }
      setIsProcessing(false);
    };
    init();
  }, [_updateStatusFromService]); 

  const changeMode = useCallback(async (newMode) => {
    setIsProcessing(true);
    setSelectedMode(newMode);
    if (newMode === 'environment') {
      const result = await geminiService.attemptLoadEnvKey();
      _updateStatusFromService(result, 'mode_change_env');
    } else { 
      const currentServiceStatus = geminiService.getApiKeyStatus();
      if (currentServiceStatus.available && currentServiceStatus.source === 'environment') {
        setStatus({ message: "Manual input selected. Enter API Key to override active environment key, or clear the environment key if you wish to only use pasted keys.", type: 'info', isSet: true });
      } else if (inputKey.trim()) {
        const result = await geminiService.setPastedApiKey(inputKey);
        _updateStatusFromService(result, 'mode_change_pasted_with_key');
      } else {
        geminiService.clearActiveApiKey(); 
        const result = geminiService.getApiKeyStatus();
         _updateStatusFromService({success: result.available, message: result.message || "Manual input selected. Enter API Key.", source: null}, 'mode_change_pasted_no_key');
      }
    }
    setIsProcessing(false);
  }, [_updateStatusFromService, inputKey]);

  const submitPastedKey = useCallback(async (keyToSubmit) => {
    setIsProcessing(true);
    const key = (keyToSubmit || inputKey).trim();
    if (!key) {
        _updateStatusFromService({success: false, message: "Pasted API Key cannot be empty.", source: null}, 'submit_pasted_empty');
        setIsProcessing(false);
        return;
    }
    const result = await geminiService.setPastedApiKey(key);
    _updateStatusFromService(result, 'submit_pasted');
    if (result.success) {
      setInputKey(key); 
    }
    setIsProcessing(false);
  }, [_updateStatusFromService, inputKey]);

  const clearActiveUserKey = useCallback(async () => {
    setIsProcessing(true);
    geminiService.clearActiveApiKey(); 
    if (addHistoryEntry) addHistoryEntry('API_KEY_STATUS_CHANGED', 'API Key cleared by user.');
    const envResult = await geminiService.attemptLoadEnvKey();
    _updateStatusFromService(envResult, 'clear_key');
    
    if (envResult.success && envResult.source === 'environment') {
        setSelectedMode('environment');
    } else {
        setSelectedMode('pasted'); 
        const finalStatus = geminiService.getApiKeyStatus(); 
        setStatus({ 
            message: finalStatus.message || "API Key cleared. Provide a new key or set environment variable.",
            type: 'info',
            isSet: false
        });
    }
    setInputKey(''); 
    setIsProcessing(false);
  }, [_updateStatusFromService, addHistoryEntry]);

  const hookReturn = {
    selectedMode,
    inputKey,
    status,
    isProcessing,
    changeMode,
    setInputKey,
    submitPastedKey,
    clearActiveUserKey,
    refreshStatus,
  };
  if(addHistoryEntry) hookReturn.addHistoryEntry = addHistoryEntry;

  return hookReturn;
};
