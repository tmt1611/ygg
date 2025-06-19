
import { useState, useCallback, useEffect } from 'react';
import { APP_STORAGE_KEYS } from '../constants.js';

const THEME_CYCLE = ['dark', 'light', 'sol', 'nebula'];

export const useAppThemeAndLayout = (addHistoryEntry) => {
  const [themeMode, setThemeMode] = useState(() => {
    const savedTheme = localStorage.getItem(APP_STORAGE_KEYS.THEME_MODE);
    return THEME_CYCLE.includes(savedTheme) ? savedTheme : 'dark';
  });

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const savedState = localStorage.getItem(APP_STORAGE_KEYS.SIDEBAR_COLLAPSED_STATE);
    return savedState ? JSON.parse(savedState) : false;
  });

  const [yggdrasilViewMode, _setYggdrasilViewMode] = useState(() => {
    const savedView = localStorage.getItem(APP_STORAGE_KEYS.ACTIVE_MAIN_VIEW);
    const validViews = ['workspace', 'graph', 'list', 'focus'];
    return validViews.includes(savedView) ? savedView : 'workspace';
  });


  useEffect(() => {
    document.documentElement.dataset.theme = themeMode;
    localStorage.setItem(APP_STORAGE_KEYS.THEME_MODE, themeMode);
  }, [themeMode]);

  useEffect(() => {
    localStorage.setItem(APP_STORAGE_KEYS.SIDEBAR_COLLAPSED_STATE, JSON.stringify(isSidebarCollapsed));
  }, [isSidebarCollapsed]);
  
  useEffect(() => { 
    localStorage.setItem(APP_STORAGE_KEYS.ACTIVE_MAIN_VIEW, yggdrasilViewMode); 
  }, [yggdrasilViewMode]);
  
  const toggleTheme = useCallback(() => {
    setThemeMode(prevMode => {
        const currentIndex = THEME_CYCLE.indexOf(prevMode);
        const nextIndex = (currentIndex + 1) % THEME_CYCLE.length;
        const newMode = THEME_CYCLE[nextIndex];
        addHistoryEntry('THEME_CHANGED', `Theme switched to ${newMode} mode.`);
        return newMode;
    });
  }, [addHistoryEntry]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed(prev => !prev);
  }, []);

  const setYggdrasilViewMode = useCallback((newMode) => {
    _setYggdrasilViewMode(prevMode => {
        const resolvedNewMode = typeof newMode === 'function' ? newMode(prevMode) : newMode;
        if (prevMode !== resolvedNewMode) {
            addHistoryEntry('VIEW_CHANGED', `View changed to ${resolvedNewMode}.`);
        }
        return resolvedNewMode;
    });
  }, [addHistoryEntry]);


  return {
    themeMode,
    isSidebarCollapsed,
    yggdrasilViewMode,
    toggleTheme,
    toggleSidebar,
    setYggdrasilViewMode,
  };
};
