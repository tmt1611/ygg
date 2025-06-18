
import { useState, useCallback, useEffect } from 'react';
import { APP_STORAGE_KEYS } from '../constants.js';

const THEME_CYCLE = ['dark', 'light', 'nebula'];

export const useAppThemeAndLayout = (addHistoryEntry) => {
  const [themeMode, setThemeMode] = useState(() => {
    const savedTheme = localStorage.getItem(APP_STORAGE_KEYS.THEME_MODE);
    return THEME_CYCLE.includes(savedTheme) ? savedTheme : 'dark';
  });

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const savedState = localStorage.getItem(APP_STORAGE_KEYS.SIDEBAR_COLLAPSED_STATE);
    return savedState ? JSON.parse(savedState) : false;
  });

  const [yggdrasilViewMode, _setYggdrasilViewMode] = useState(() => (localStorage.getItem(APP_STORAGE_KEYS.ACTIVE_MAIN_VIEW)) || 'workspace');
  const [activeOverlayPanel, _setActiveOverlayPanel] = useState(null);


  useEffect(() => {
    document.documentElement.dataset.theme = themeMode;
    localStorage.setItem(APP_STORAGE_KEYS.THEME_MODE, themeMode);
  }, [themeMode]);

  useEffect(() => {
    localStorage.setItem(APP_STORAGE_KEYS.SIDEBAR_COLLAPSED_STATE, JSON.stringify(isSidebarCollapsed));
     const appContainer = document.querySelector('.yggdrasil-app-container'); 
    if (appContainer) {
        if (isSidebarCollapsed) appContainer.classList.add('sidebar-collapsed');
        else appContainer.classList.remove('sidebar-collapsed');
    } else { 
        const bodyElement = document.querySelector('.yggdrasil-app-body') || document.body;
        if (isSidebarCollapsed) bodyElement.classList.add('sidebar-collapsed');
        else bodyElement.classList.remove('sidebar-collapsed');
    }
  }, [isSidebarCollapsed]);
  
  useEffect(() => { localStorage.setItem(APP_STORAGE_KEYS.ACTIVE_MAIN_VIEW, yggdrasilViewMode); }, [yggdrasilViewMode]);
  
  useEffect(() => {
    _setActiveOverlayPanel(null); 
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
            addHistoryEntry('VIEW_CHANGED', `Main view changed to ${resolvedNewMode}.`);
        }
        return resolvedNewMode;
    });
  }, [addHistoryEntry]);

  const setActiveOverlayPanel = useCallback((newPanel) => {
    _setActiveOverlayPanel(prevPanel => {
        const resolvedNewPanel = typeof newPanel === 'function' ? newPanel(prevPanel) : newPanel;
        if (prevPanel !== resolvedNewPanel) {
            if (resolvedNewPanel) {
                addHistoryEntry('VIEW_CHANGED', `Overlay panel "${resolvedNewPanel}" opened.`);
            } else {
                addHistoryEntry('VIEW_CHANGED', `Overlay panel "${prevPanel}" closed.`);
            }
        }
        return resolvedNewPanel;
    });
  }, [addHistoryEntry]);


  return {
    themeMode,
    isSidebarCollapsed,
    yggdrasilViewMode,
    activeOverlayPanel,
    toggleTheme,
    toggleSidebar,
    setYggdrasilViewMode,
    setActiveOverlayPanel,
  };
};
