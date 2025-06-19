
import { useState, useCallback, useRef, useMemo } from 'react';

export const useModalManager = () => {
  const lastFocusedElementRef = useRef(null);

  const [isProjectNameModalOpen, setIsProjectNameModalOpen] = useState(false);
  const [projectModalConfig, setProjectModalConfig] = useState(null);

  const [isAiSuggestionModalOpen, setIsAiSuggestionModalOpen] = useState(false);
  const [pendingAiSuggestion, setPendingAiSuggestion] = useState(null);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState(null);

  const [isNodeEditModalOpen, setIsNodeEditModalOpen] = useState(false);
  const [nodeEditModalConfig, setNodeEditModalConfig] = useState(null);

  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState(null);
  const [contextMenuNodeId, setContextMenuNodeId] = useState(null);
  const [contextMenuLinkSourceInfo, setContextMenuLinkSourceInfo] = useState(null);
  
  const [isTechExtractionModalOpen, setIsTechExtractionModalOpen] = useState(false);
  const [extractedTechsContent, setExtractedTechsContent] = useState('');
  const [extractionModalTitle, setExtractionModalTitle] = useState('Extracted Information');
  const [extractionMode, setExtractionMode] = useState('raw');

  const [isLinkProjectModalOpen, setIsLinkProjectModalOpen] = useState(false);
  const [linkProjectModalConfig, setLinkProjectModalConfig] = useState(null);


  const captureFocus = useCallback(() => {
    if (document.activeElement instanceof HTMLElement) {
      lastFocusedElementRef.current = document.activeElement;
    }
  }, []);
  const restoreFocus = useCallback(() => { lastFocusedElementRef.current?.focus(); }, []);

  const openProjectNameModal = useCallback((config) => {
    captureFocus(); setProjectModalConfig(config); setIsProjectNameModalOpen(true);
  }, [captureFocus]);
  const closeProjectNameModal = useCallback(() => {
    setIsProjectNameModalOpen(false); setProjectModalConfig(null); restoreFocus();
  }, [restoreFocus]);

  const openAiSuggestionModal = useCallback((suggestion) => {
    captureFocus(); setPendingAiSuggestion(suggestion); setIsAiSuggestionModalOpen(true);
  }, [captureFocus]);
  const closeAiSuggestionModal = useCallback(() => {
    setIsAiSuggestionModalOpen(false); setPendingAiSuggestion(null); restoreFocus();
  }, [restoreFocus]);

  const openConfirmModal = useCallback((config) => {
    captureFocus(); setConfirmModalConfig(config); setIsConfirmModalOpen(true);
  }, [captureFocus]);
  const closeConfirmModal = useCallback(() => {
    setIsConfirmModalOpen(false); setConfirmModalConfig(null); restoreFocus();
  }, [restoreFocus]);

  const openNodeEditModal = useCallback((config) => {
    captureFocus(); setNodeEditModalConfig({ ...config, isOpen: true }); setIsNodeEditModalOpen(true);
  }, [captureFocus]);
  const closeNodeEditModal = useCallback(() => {
    setIsNodeEditModalOpen(false); setNodeEditModalConfig(null); restoreFocus();
  }, [restoreFocus]);

  const openContextMenu = useCallback((nodeId, position, linkSourceInfo = null) => {
    captureFocus(); setContextMenuNodeId(nodeId); setContextMenuPosition(position); setContextMenuLinkSourceInfo(linkSourceInfo); setIsContextMenuOpen(true);
  }, [captureFocus]);
  const closeContextMenu = useCallback(() => {
    setIsContextMenuOpen(false); setContextMenuNodeId(null); setContextMenuPosition(null); setContextMenuLinkSourceInfo(null); restoreFocus();
  }, [restoreFocus]);
  
  const openTechExtractionModal = useCallback((content, title, mode) => {
    captureFocus(); setExtractedTechsContent(content); setExtractionModalTitle(title); setExtractionMode(mode); setIsTechExtractionModalOpen(true);
  }, [captureFocus]);
  const closeTechExtractionModal = useCallback(() => {
    setIsTechExtractionModalOpen(false); restoreFocus();
  }, [restoreFocus]);

  const openLinkProjectModal = useCallback((config) => {
    captureFocus(); setLinkProjectModalConfig({ ...config, isOpen: true }); setIsLinkProjectModalOpen(true);
  }, [captureFocus]);
  const closeLinkProjectModal = useCallback(() => {
    setIsLinkProjectModalOpen(false); setLinkProjectModalConfig(null); restoreFocus();
  }, [restoreFocus]);


  const value = useMemo(() => ({
    isProjectNameModalOpen, projectModalConfig, openProjectNameModal, closeProjectNameModal,
    isAiSuggestionModalOpen, pendingAiSuggestion, openAiSuggestionModal, closeAiSuggestionModal, setPendingAiSuggestion,
    isConfirmModalOpen, confirmModalConfig, openConfirmModal, closeConfirmModal,
    isNodeEditModalOpen, nodeEditModalConfig, openNodeEditModal, closeNodeEditModal,
    isContextMenuOpen, contextMenuPosition, contextMenuNodeId, contextMenuLinkSourceInfo, openContextMenu, closeContextMenu,
    isTechExtractionModalOpen, extractedTechsContent, extractionModalTitle, extractionMode, openTechExtractionModal, closeTechExtractionModal, setExtractionMode,
    isLinkProjectModalOpen, linkProjectModalConfig, openLinkProjectModal, closeLinkProjectModal,
    restoreFocus,
  }), [
    isProjectNameModalOpen, projectModalConfig, openProjectNameModal, closeProjectNameModal,
    isAiSuggestionModalOpen, pendingAiSuggestion, openAiSuggestionModal, closeAiSuggestionModal, setPendingAiSuggestion,
    isConfirmModalOpen, confirmModalConfig, openConfirmModal, closeConfirmModal,
    isNodeEditModalOpen, nodeEditModalConfig, openNodeEditModal, closeNodeEditModal,
    isContextMenuOpen, contextMenuPosition, contextMenuNodeId, contextMenuLinkSourceInfo, openContextMenu, closeContextMenu,
    isTechExtractionModalOpen, extractedTechsContent, extractionModalTitle, extractionMode, openTechExtractionModal, closeTechExtractionModal, setExtractionMode,
    isLinkProjectModalOpen, linkProjectModalConfig, openLinkProjectModal, closeLinkProjectModal,
    restoreFocus,
  ]);

  return value;
};
