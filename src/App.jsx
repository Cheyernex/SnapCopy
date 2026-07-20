import React, { useState, useEffect, useRef, useMemo } from 'react';
import pkg from '../package.json';
import { 
  Plus, 
  Search, 
  Database, 
  Terminal, 
  Code, 
  FileText, 
  Copy, 
  Edit3, 
  Trash2, 
  Check, 
  CheckSquare,
  Square,
  X, 
  AlertCircle,
  Pin,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Layers,
  Briefcase,
  LogOut,
  Folder as FolderIcon,
  FolderOpen,
  Settings,
  User as UserIcon,
  Keyboard,
  Sparkles,
  Globe,
  GitBranch,
  Hash,
  Bell,
  Shield,
  CloudOff,
  Server as ServerIcon,
  Monitor,
  Palette,
  Star,
  Heart,
  Zap,
  BookOpen,
  Box,
  Compass,
  Flag,
  Key,
  Lightbulb,
  Link,
  Lock,
  Rocket,
  Tag,
  Target,
  Wrench,
  Brain,
  Bot,
  Package,
  Puzzle,
  Cloud,
  Home,
  Image,
  Camera,
  Play,
  Music,
  Headphones,
  Gift,
  Award,
  Crown,
  Gem,
  Leaf,
  Feather,
  Wind,
  Coffee,
  Smile,
  MessageSquare,
  Download,
  Upload,
  RefreshCw,
  ExternalLink,
  Eye,
  Sliders,
  Filter,
  Clock,
  Calendar,
  Watch,
  Timer,
  Bookmark,
  MapPin,
  Navigation,
  Map as MapIcon,
  Layout,
  Columns,
  Grid,
  Rows,
  Info,
  Power
} from 'lucide-react';
import { createSupabaseClient, getSupabase, isConfigured, onAuthStateChange, fetchCloudSnippets, saveCloudSnippet, deleteCloudSnippet, deleteCloudSnippetsByWorkspace, fetchUserSettings, saveUserSettings, saveCloudSuggestion } from './supabase';
import { useTranslation, Trans } from 'react-i18next';

export default function App() {
  const { t, i18n } = useTranslation();
  const [snippets, setSnippets] = useState([]);
  const [selectedSnippetIds, setSelectedSnippetIds] = useState([]);
  const [activeCategory, setActiveCategory] = useState('General');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isHomeView, setIsHomeView] = useState(true);

  // Workspaces state
  const [workspaces, setWorkspaces] = useState(['General']);
  const [currentWorkspace, setCurrentWorkspace] = useState('General');
  const [isWorkspaceDropdownOpen, setIsWorkspaceDropdownOpen] = useState(false);
  const [isAddWorkspaceModalOpen, setIsAddWorkspaceModalOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [workspaceColors, setWorkspaceColors] = useState({});
  const [isEditWorkspaceModalOpen, setIsEditWorkspaceModalOpen] = useState(false);
  const [workspaceToEdit, setWorkspaceToEdit] = useState('');
  const [editWorkspaceName, setEditWorkspaceName] = useState('');
  const [editWorkspaceColor, setEditWorkspaceColor] = useState('indigo');
  const [isDeleteWorkspaceConfirmOpen, setIsDeleteWorkspaceConfirmOpen] = useState(false);
  const [workspaceToDelete, setWorkspaceToDelete] = useState('');
  const [workspaceThemes, setWorkspaceThemes] = useState({});
  
  // Folders state
  const [activeFolder, setActiveFolder] = useState(null); // null = all, '' = root, string = folder name
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [isAddFolderModalOpen, setIsAddFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [dragOverFolder, setDragOverFolder] = useState(null);
  const [draggedSnippetId, setDraggedSnippetId] = useState(null);
  const [isFolderDragged, setIsFolderDragged] = useState(false);
  const [folders, setFolders] = useState({}); // { 'Category': ['path/to/folder', ...] }
  const [sidebarExpandedFolders, setSidebarExpandedFolders] = useState(new Set());
  const [isFolderSettingsOpen, setIsFolderSettingsOpen] = useState(false);
  const [folderSettingsCategory, setFolderSettingsCategory] = useState('');
  const [folderSettingsName, setFolderSettingsName] = useState('');
  const [folderRenameValue, setFolderRenameValue] = useState('');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState(null); // null means adding, object means editing
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [snippetToDelete, setSnippetToDelete] = useState(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isShortcutModalOpen, setIsShortcutModalOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  // Suggestions Box Modal State
  const [isSuggestionModalOpen, setIsSuggestionModalOpen] = useState(false);
  const [suggestionSubject, setSuggestionSubject] = useState('');
  const [suggestionBody, setSuggestionBody] = useState('');
  const [suggestionImages, setSuggestionImages] = useState([]);
  const [isSubmittingSuggestion, setIsSubmittingSuggestion] = useState(false);
  const [isDeleteFolderConfirmOpen, setIsDeleteFolderConfirmOpen] = useState(false);
  const [isCategoryManageOpen, setIsCategoryManageOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingCategoryValue, setEditingCategoryValue] = useState('');
  const [categoryIcons, setCategoryIcons] = useState(() => {
    try { return JSON.parse(localStorage.getItem('snapcopy_category_icons')) || {}; } catch { return {}; }
  });
  const [selectedCategoryIcon, setSelectedCategoryIcon] = useState('Code');
  const [isCreateIconPickerOpen, setIsCreateIconPickerOpen] = useState(false);
  const [editingCategoryIcon, setEditingCategoryIcon] = useState(null);
  const [showAbout, setShowAbout] = useState(false);

  // Form inputs state
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [selectedCategoryOption, setSelectedCategoryOption] = useState('General');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [formContent, setFormContent] = useState('');
  const [formColor, setFormColor] = useState('indigo');
  const [formFolder, setFormFolder] = useState(''); // folder for new/edit snippet

  // Toasts state
  const [toasts, setToasts] = useState([]);

  // Auth state
  const [user, setUser] = useState(null);
  const [cloudEnabled, setCloudEnabled] = useState(false);
  const [syncing, setSyncing] = useState(false);     // small topbar spinner
  const [syncingFull, setSyncingFull] = useState(false); // full-screen overlay (post-login only)
  const [initializing, setInitializing] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isThemePanelOpen, setIsThemePanelOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('snapcopy_theme') || 'indigo');

  // Context menu state
  const [contextMenu, setContextMenu] = useState(null);
  const [autoStartEnabled, setAutoStartEnabled] = useState(false);

  // Close context menu on click or scroll
  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener('click', close);
    window.addEventListener('scroll', close, true);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [contextMenu]);

  useEffect(() => {
    if (window.electronAPI && window.electronAPI.getAutoStart) {
      window.electronAPI.getAutoStart().then(setAutoStartEnabled);
    }
  }, []);

  const handleToggleAutoStart = async () => {
    if (!window.electronAPI || !window.electronAPI.setAutoStart) return;
    const next = !autoStartEnabled;
    await window.electronAPI.setAutoStart(next);
    setAutoStartEnabled(next);
  };

  // Auto-Updater states
  const [updateAvailable, setUpdateAvailable] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(null);
  const [isUpdateDownloaded, setIsUpdateDownloaded] = useState(false);
  const [isDownloadingUpdate, setIsDownloadingUpdate] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isNoUpdateModalOpen, setIsNoUpdateModalOpen] = useState(false);

  useEffect(() => {
    if (!window.electronAPI) return;
    if (window.electronAPI.onUpdateAvailable) {
      window.electronAPI.onUpdateAvailable((info) => {
        setUpdateAvailable(info);
        setIsUpdateModalOpen(true);
      });
    }
    if (window.electronAPI.onUpdateNotAvailable) {
      window.electronAPI.onUpdateNotAvailable(() => {
        setIsNoUpdateModalOpen(true);
      });
    }
    if (window.electronAPI.onUpdateProgress) {
      window.electronAPI.onUpdateProgress((progress) => {
        setDownloadProgress(progress.percent || 0);
      });
    }
    if (window.electronAPI.onUpdateDownloaded) {
      window.electronAPI.onUpdateDownloaded(() => {
        setIsDownloadingUpdate(false);
        setIsUpdateDownloaded(true);
      });
    }
    if (window.electronAPI.onUpdateError) {
      window.electronAPI.onUpdateError((err) => {
        setIsDownloadingUpdate(false);
        addToast(t('toasts.download_error', { error: err }));
      });
    }
  }, []);

  const handleStartDownloadUpdate = async () => {
    setIsDownloadingUpdate(true);
    setDownloadProgress(0);
    try {
      const res = await window.electronAPI.downloadUpdate();
      if (res && res.error) {
        setIsDownloadingUpdate(false);
        addToast(t('toasts.download_error_res', { error: res.error }));
      } else if (res && res.version) {
        // If the re-check found a newer version, update the displayed version
        setUpdateAvailable(prev => prev ? { ...prev, version: res.version } : prev);
      }
    } catch (err) {
      setIsDownloadingUpdate(false);
      addToast(t('toasts.download_update_error'));
    }
  };

  const handleInstallUpdate = () => {
    if (window.electronAPI && window.electronAPI.installUpdate) {
      window.electronAPI.installUpdate();
    }
  };

  const handleManualCheckUpdate = async () => {
    setProfileMenuOpen(false);
    if (!window.electronAPI || !window.electronAPI.checkForUpdates) {
      addToast(t('toasts.update_available_exe'));
      return;
    }
    addToast(t('toasts.checking_updates'));
    const res = await window.electronAPI.checkForUpdates();
    if (res && (res.status === 'dev' || res.error || !res.updateInfo)) {
      setIsNoUpdateModalOpen(true);
    }
  };

  const renderMarkdown = (text) => {
    if (!text) return null;
    let cleanText = text;
    // Si el texto completo empieza y termina con **, limpiarlo para evitar asteriscos sin renderizar
    if (cleanText.startsWith('**') && cleanText.endsWith('**') && cleanText.indexOf('**', 2) === cleanText.length - 2) {
      cleanText = cleanText.slice(2, -2);
    }
    const parts = cleanText.split(/(`[^`]+`|\*\*[^*`]+(?:\`[^`]+\`[^*`]*)*\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={i} style={{ background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', padding: '1px 6px', borderRadius: '4px', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>{part.slice(1, -1)}</code>;
      }
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{renderMarkdown(part.slice(2, -2))}</strong>;
      }
      return part;
    });
  };

  const htmlToMarkdown = (html) => {
    return html
      .replace(/<h3[^>]*>(.+?)<\/h3>/gi, '### $1\n')
      .replace(/<li[^>]*>(.+?)<\/li>/gi, '- $1\n')
      .replace(/<strong[^>]*>(.+?)<\/strong>/gi, '**$1**')
      .replace(/<code[^>]*>(.+?)<\/code>/gi, '`$1`')
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  };

  const sectionColors = {
    added: { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', text: '#34d399' },
    fixed: { bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.3)', text: '#818cf8' },
    performance: { bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)', text: '#fbbf24' },
    changed: { bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)', text: '#fbbf24' },
    novedades: { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', text: '#34d399' },
    mejoras: { bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.3)', text: '#818cf8' },
    ajustes: { bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)', text: '#fbbf24' },
  };

  const formatReleaseNotes = (notes) => {
    if (!notes) return null;
    if (Array.isArray(notes)) {
      notes = notes.map(n => typeof n === 'string' ? n : (n.note || '')).join('\n');
    }
    if (/<[a-z][\s\S]*>/i.test(notes)) {
      notes = htmlToMarkdown(notes);
    }
    const lines = notes.split('\n').map(l => l.trimEnd());
    const sections = [];
    let currentSection = null;

    for (const line of lines) {
      const headingMatch = line.match(/^(?:###|##|#)\s+(.+)/);
      if (headingMatch) {
        currentSection = { heading: headingMatch[1].trim(), items: [] };
        sections.push(currentSection);
        continue;
      }
      const itemMatch = line.match(/^(?:-|\*)\s+(.+)/);
      if (itemMatch && currentSection) {
        currentSection.items.push(itemMatch[1].trim());
      }
    }

    if (sections.length === 0) {
      return (
        <div style={{ fontSize: '0.82rem', lineHeight: '1.6', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
          {notes.split('\n').map((line, i) => (
            <div key={i}>{renderMarkdown(line)}</div>
          ))}
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {sections.map((section, si) => {
          const key = section.heading.toLowerCase().replace(/[^a-z0-9]/g, '');
          const colors = sectionColors[key] || { bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.06)', text: 'var(--text-primary)', label: section.heading };
          return (
            <div key={si}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '3px 10px', borderRadius: '6px',
                background: colors.bg, border: `1px solid ${colors.border}`,
                color: colors.text, fontSize: '0.7rem', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.5px',
                marginBottom: '8px'
              }}>
                {section.heading}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {section.items.map((item, ii) => {
                  let cleanItem = item.trim();
                  const colonIdx = cleanItem.indexOf(':');
                  let title = '';
                  let body = cleanItem;
                  if (colonIdx > 0) {
                    title = cleanItem.slice(0, colonIdx).trim();
                    body = cleanItem.slice(colonIdx + 1).trim();
                    if (title.startsWith('**') && title.endsWith('**')) {
                      title = title.slice(2, -2).trim();
                    }
                  }
                  return (
                    <div key={ii} style={{
                      display: 'flex', gap: '8px', alignItems: 'flex-start',
                      padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.03)',
                    }}>
                      <span style={{ color: colors.text, fontSize: '0.7rem', marginTop: '3px', flexShrink: 0 }}>▸</span>
                      <div style={{ fontSize: '0.82rem', lineHeight: '1.45', color: 'var(--text-secondary)' }}>
                        {title ? (
                          <strong style={{ color: 'var(--text-primary)', fontWeight: 600, marginRight: '4px' }}>
                            {renderMarkdown(title)}:
                          </strong>
                        ) : null}
                        {renderMarkdown(body)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // When a category is explicitly set, exit home view
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setIsHomeView(false);
  }, [activeCategory]);

  const profileRef = useRef(null);
  const createIconPickerRef = useRef(null);
  const aboutRef = useRef(null);

  const localDataRef = useRef({
    snippets: [],
    workspaces: ['General'],
    currentWorkspace: 'General',
    folders: {},
    workspaceColors: {},
    workspaceThemes: {},
    categoriesOrder: null,
    categoryIcons: {},
  });
  const signingOutRef = useRef(false);
  const isSyncingRef = useRef(false);


  // Cloud sync helper with loading indicator
  const syncToCloud = async (fn) => {
    if (!cloudEnabled) return;
    setSyncing(true);
    try { await fn(); } catch (e) {
      console.error('Cloud sync failed:', e);
      addToast(t('toasts.sync_error', { error: e.message }));
    } finally { setSyncing(false); }
  };

  const addToast = (message) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  const safeSetItem = (key, value) => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.error(`localStorage write failed for "${key}":`, e);
      addToast(t('toasts.storage_error'));
      return false;
    }
  };

  const themes = {
    indigo: {
      name: t('themes.indigo'),
      primary: '#6366f1', primaryHover: '#4f46e5',
      bgMain: '#0b0f19', bgSidebar: '#0f172a', bgCard: 'rgba(30, 41, 59, 0.4)', bgCardHover: 'rgba(30, 41, 59, 0.6)', bgInput: '#1e293b',
      border: 'rgba(255, 255, 255, 0.06)', borderHover: 'rgba(255, 255, 255, 0.12)',
      textPrimary: '#f8fafc', textSecondary: '#cbd5e1', textMuted: '#64748b',
      success: '#10b981', danger: '#ef4444', warning: '#f59e0b', info: '#06b6d4',
    },
    midnight: {
      name: t('themes.midnight'),
      primary: '#818cf8', primaryHover: '#6366f1',
      bgMain: '#020617', bgSidebar: '#0a0f1e', bgCard: 'rgba(30, 41, 80, 0.4)', bgCardHover: 'rgba(30, 41, 80, 0.6)', bgInput: '#1a1f35',
      border: 'rgba(255, 255, 255, 0.05)', borderHover: 'rgba(255, 255, 255, 0.10)',
      textPrimary: '#f1f5f9', textSecondary: '#c7d2fe', textMuted: '#6366a0',
      success: '#34d399', danger: '#fb7185', warning: '#fbbf24', info: '#38bdf8',
    },
    emerald: {
      name: t('themes.emerald'),
      primary: '#10b981', primaryHover: '#059669',
      bgMain: '#0a1410', bgSidebar: '#0f1d16', bgCard: 'rgba(16, 185, 129, 0.08)', bgCardHover: 'rgba(16, 185, 129, 0.12)', bgInput: '#1a2e24',
      border: 'rgba(16, 185, 129, 0.1)', borderHover: 'rgba(16, 185, 129, 0.2)',
      textPrimary: '#ecfdf5', textSecondary: '#a7f3d0', textMuted: '#6b8f7a',
      success: '#34d399', danger: '#f43f5e', warning: '#f59e0b', info: '#22d3ee',
    },
    rose: {
      name: t('themes.rose'),
      primary: '#f43f5e', primaryHover: '#e11d48',
      bgMain: '#140a0c', bgSidebar: '#1f1114', bgCard: 'rgba(244, 63, 94, 0.08)', bgCardHover: 'rgba(244, 63, 94, 0.12)', bgInput: '#2a1a1e',
      border: 'rgba(244, 63, 94, 0.1)', borderHover: 'rgba(244, 63, 94, 0.2)',
      textPrimary: '#fff1f2', textSecondary: '#fda4af', textMuted: '#a06c74',
      success: '#10b981', danger: '#ef4444', warning: '#f59e0b', info: '#06b6d4',
    },
    amber: {
      name: t('themes.amber'),
      primary: '#f59e0b', primaryHover: '#d97706',
      bgMain: '#141008', bgSidebar: '#1f1a0f', bgCard: 'rgba(245, 158, 11, 0.08)', bgCardHover: 'rgba(245, 158, 11, 0.12)', bgInput: '#2a2416',
      border: 'rgba(245, 158, 11, 0.1)', borderHover: 'rgba(245, 158, 11, 0.2)',
      textPrimary: '#fffbeb', textSecondary: '#fde68a', textMuted: '#a08f5a',
      success: '#10b981', danger: '#ef4444', warning: '#f59e0b', info: '#0ea5e9',
    },
    sky: {
      name: t('themes.sky'),
      primary: '#0ea5e9', primaryHover: '#0284c7',
      bgMain: '#080f14', bgSidebar: '#0e1a22', bgCard: 'rgba(14, 165, 233, 0.08)', bgCardHover: 'rgba(14, 165, 233, 0.12)', bgInput: '#162a36',
      border: 'rgba(14, 165, 233, 0.1)', borderHover: 'rgba(14, 165, 233, 0.2)',
      textPrimary: '#f0f9ff', textSecondary: '#bae6fd', textMuted: '#5d8ca8',
      success: '#10b981', danger: '#f43f5e', warning: '#f59e0b', info: '#06b6d4',
    },
    violet: {
      name: t('themes.violet'),
      primary: '#8b5cf6', primaryHover: '#7c3aed',
      bgMain: '#0d0a18', bgSidebar: '#151024', bgCard: 'rgba(139, 92, 246, 0.08)', bgCardHover: 'rgba(139, 92, 246, 0.12)', bgInput: '#1e1834',
      border: 'rgba(139, 92, 246, 0.1)', borderHover: 'rgba(139, 92, 246, 0.2)',
      textPrimary: '#f5f3ff', textSecondary: '#ddd6fe', textMuted: '#7c71a8',
      success: '#34d399', danger: '#fb7185', warning: '#fbbf24', info: '#38bdf8',
    },
    slate: {
      name: t('themes.slate'),
      primary: '#64748b', primaryHover: '#475569',
      bgMain: '#0a0c10', bgSidebar: '#0f1219', bgCard: 'rgba(100, 116, 139, 0.08)', bgCardHover: 'rgba(100, 116, 139, 0.12)', bgInput: '#1a1e26',
      border: 'rgba(255, 255, 255, 0.05)', borderHover: 'rgba(255, 255, 255, 0.10)',
      textPrimary: '#f1f5f9', textSecondary: '#cbd5e1', textMuted: '#6c7a8e',
      success: '#64748b', danger: '#64748b', warning: '#64748b', info: '#64748b',
    },
  };

  useEffect(() => {
    const t = themes[theme] || themes.indigo;
    const root = document.documentElement;
    root.style.setProperty('--color-primary', t.primary);
    root.style.setProperty('--color-primary-hover', t.primaryHover);
    root.style.setProperty('--bg-main', t.bgMain);
    root.style.setProperty('--bg-sidebar', t.bgSidebar);
    root.style.setProperty('--bg-card', t.bgCard);
    root.style.setProperty('--bg-card-hover', t.bgCardHover);
    root.style.setProperty('--bg-input', t.bgInput);
    root.style.setProperty('--border', t.border);
    root.style.setProperty('--border-hover', t.borderHover);
    root.style.setProperty('--text-primary', t.textPrimary);
    root.style.setProperty('--text-secondary', t.textSecondary);
    root.style.setProperty('--text-muted', t.textMuted);
    root.style.setProperty('--color-success', t.success);
    root.style.setProperty('--color-danger', t.danger);
    root.style.setProperty('--color-warning', t.warning);
    root.style.setProperty('--color-info', t.info);
  }, [theme]);

  const handleThemeChange = (t) => {
    setTheme(t);
    safeSetItem('snapcopy_theme', t);
    const updatedThemes = {
      ...workspaceThemes,
      [currentWorkspace]: t
    };
    setWorkspaceThemes(updatedThemes);
    saveSnippetsData(snippets, workspaces, currentWorkspace, folders, workspaceColors, updatedThemes);
  };

  // Automatically collapse sidebar on small screens (mobile/tablet)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setIsSidebarCollapsed(true);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // run on mount
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize Supabase client and auth on mount
  useEffect(() => {
    if (!isConfigured()) {
      setInitializing(false);
      return;
    }

    const supabase = createSupabaseClient();
    let initialSessionChecked = false;

    // Check stored session immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        setCloudEnabled(true);
        setInitializing(false);
        initialSessionChecked = true;
      }
    });

    // Fallback: show login screen after 1.5s if no session found
    const fallbackTimer = setTimeout(() => {
      if (!initialSessionChecked) {
        setInitializing(false);
      }
    }, 1500);

    const unsubscribe = onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        clearTimeout(fallbackTimer);
        if (session) {
          setUser(session.user);
          setCloudEnabled(true);
          syncAllToCloud(localDataRef.current, false, true);
        }
        setInitializing(false);
        const shown = localStorage.getItem('shortcut_info_shown');
        if (!shown) {
          setTourStep(0);
          setIsShortcutModalOpen(true);
        }
        setIsHomeView(true);
        setActiveCategory('General');
        setActiveFolder(null);
      } else if (event === 'SIGNED_OUT') {
        // If we're in the middle of a manual sign-out (with the 2s overlay),
        // skip this — handleSignOut will clean up state when the timer completes.
        if (signingOutRef.current) return;
        setUser(null);
        setCloudEnabled(false);
        localStorage.removeItem('shortcut_info_shown');
        setIsHomeView(true);
        setActiveCategory('General');
        setActiveFolder(null);
      }
    });

    return () => {
      clearTimeout(fallbackTimer);
      unsubscribe();
    };
  }, []);

  // Sync all snippets and settings to/from cloud after login or session restore
  const syncAllToCloud = async (snippetsData, showFullOverlay = false, silent = false) => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    if (showFullOverlay) {
      setSyncingFull(true);
    } else if (!silent) {
      setSyncing(true);
    }
    try {
      // 1. Fetch cloud snippets & user settings
      const cloudSnippets = await fetchCloudSnippets().catch(e => {
        console.error('Failed to fetch cloud snippets:', e);
        return [];
      });
      const cloudSettings = await fetchUserSettings().catch(e => {
        console.error('Failed to fetch user settings:', e);
        return null;
      });

      // 2. Identify default sample snippets (if cloud has existing snippets, remove default sample snippets)
      const defaultIds = new Set(['default-1', 'default-2', 'default-3', 'default-4']);
      let localSnippetsToSync = snippetsData?.snippets || [];
      if (cloudSnippets.length > 0) {
        localSnippetsToSync = localSnippetsToSync.filter(s => !defaultIds.has(s.id));
      }

      // 3. Upload non-default local snippets to cloud
      for (const s of localSnippetsToSync) {
        if (!defaultIds.has(s.id)) {
          await saveCloudSnippet(s).catch(e => console.error('Failed to save cloud snippet:', e));
        }
      }

      // 4. Merge cloud snippets with local non-default snippets
      const merged = mergeCloudAndLocal({ ...snippetsData, snippets: localSnippetsToSync }, cloudSnippets);

      // 5. Restore settings from cloud (or fallback to local)
      const finalWorkspaces = cloudSettings?.workspaces || merged.workspaces || ['General'];
      const finalCurrentWorkspace = cloudSettings?.currentWorkspace || merged.currentWorkspace || 'General';
      const finalFolders = cloudSettings?.folders || snippetsData?.folders || {};
      const finalColors = cloudSettings?.workspaceColors || snippetsData?.workspaceColors || {};
      const finalThemes = cloudSettings?.workspaceThemes || snippetsData?.workspaceThemes || {};
      const finalCategoriesOrder = cloudSettings?.categoriesOrder || categoriesOrder || null;
      const finalCategoryIcons = cloudSettings?.categoryIcons || categoryIcons || {};

      // 6. Save merged data locally & update state
      await saveSnippetsData(
        merged.snippets,
        finalWorkspaces,
        finalCurrentWorkspace,
        finalFolders,
        finalColors,
        finalThemes,
        finalCategoriesOrder,
        finalCategoryIcons
      );

      // Apply theme for active workspace
      const activeTheme = finalThemes[finalCurrentWorkspace] || 'indigo';
      setTheme(activeTheme);

      if (showFullOverlay) {
        addToast(t('toasts.session_synced', { count: merged.snippets.length }));
      }
    } catch (err) {
      console.error('Sync failed with error:', err);
      if (showFullOverlay) {
        addToast(t('toasts.sync_error', { error: err.message || err }));
      }
    } finally {
      isSyncingRef.current = false;
      setSyncingFull(false);
      setSyncing(false);
    }
  };

  const mergeCloudAndLocal = (localData, cloudSnippets) => {
    const localSnippets = (localData && localData.snippets) || [];
    const mapObj = {};
    for (const s of localSnippets) {
      if (s && s.id) {
        mapObj[s.id] = s;
      }
    }
    for (const cs of (cloudSnippets || [])) {
      if (cs && cs.id && !mapObj[cs.id]) {
        mapObj[cs.id] = cs;
      }
    }
    const merged = Object.values(mapObj).sort((a, b) => (b.id || '').localeCompare(a.id || ''));
    const workspaces = [...new Set([
      ...((localData && localData.workspaces) || ['General']),
      ...(cloudSnippets || []).map(s => s.workspace || 'General')
    ])];
    return { snippets: merged, workspaces };
  };


  // Reset selection on category/folder/workspace change
  useEffect(() => {
    setSelectedSnippetIds([]);
  }, [activeCategory, activeFolder, currentWorkspace, isHomeView]);

  const toggleSnippetSelection = (id) => {
    setSelectedSnippetIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleBulkDelete = () => {
    if (selectedSnippetIds.length === 0) return;
    setIsBulkDeleteModalOpen(true);
  };

  const executeBulkDelete = async () => {
    const count = selectedSnippetIds.length;
    const updatedSnippets = snippets.filter(s => !selectedSnippetIds.includes(s.id));
    await saveSnippetsData(updatedSnippets);
    await syncToCloud(async () => {
      await Promise.all(selectedSnippetIds.map(id => deleteCloudSnippet(id)));
    });
    setSelectedSnippetIds([]);
    setIsBulkDeleteModalOpen(false);
    addToast(t('toasts.snippets_deleted', { count }));
  };

  // Sign in via system browser (bypasses Google blocking embedded browser)
  const handleSignIn = async () => {
    try {
      setSigningIn(true);
      const supabase = getSupabase();
      const redirectTo = 'http://127.0.0.1:15173/auth/callback';

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error) {
        setSigningIn(false);
        throw error;
      }

      if (window.electronAPI) {
        try {
          const authCode = await window.electronAPI.openAuthUrl(data.url);
          if (authCode) {
            const { data: { user: authUser }, error: exchangeError } = await supabase.auth.exchangeCodeForSession(authCode);
            if (exchangeError) throw exchangeError;
            if (authUser) {
              setUser(authUser);
              setCloudEnabled(true);
              syncAllToCloud(localDataRef.current, true);
            }
          }
          setSigningIn(false);
        } catch (err) {
          setSigningIn(false);
          addToast(t('toasts.auth_timeout'));
          return;
        }
      } else {
        window.location.href = data.url;
        return;
      }
    } catch (err) {
      setSigningIn(false);
      console.error('Sign in failed:', err);
      addToast(t('toasts.auth_error'));
    }
  };

  // Sign out
  const handleSignOut = async () => {
    signingOutRef.current = true;
    setSigningOut(true);
    try {
      const supabase = getSupabase();
      await Promise.all([
        supabase.auth.signOut(),
        new Promise(resolve => setTimeout(resolve, 2000)),
      ]);
    } catch (e) {
      console.error('Sign out error:', e);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    signingOutRef.current = false;
    setUser(null);
    setCloudEnabled(false);
    localStorage.removeItem('shortcut_info_shown');
    setSigningOut(false);
    setIsHomeView(true);
    setActiveCategory('General');
    setActiveFolder(null);
    addToast(t('toasts.session_closed'));
  };

  // Get unique folders within a given category for current workspace
  const getFoldersForCategory = (category) => {
    const catSnippets = workspaceSnippets.filter(s => s.category === category && s.folder);
    const snippetFolders = [...new Set(catSnippets.map(s => s.folder))];
    const workspaceFolders = folders[currentWorkspace] || {};
    const registeredFolders = workspaceFolders[category] || [];
    return [...new Set([...snippetFolders, ...registeredFolders])].sort();
  };

  // Folder icons by category
  const getFolderIcon = (category) => {
    switch (category) {
      case 'SQL': return <Database size={16} />;
      case 'Consola': return <Terminal size={16} />;
      case 'Código': return <Code size={16} />;
      case 'General': return <FileText size={16} />;
      default: return <FileText size={16} />;
    }
  };

  // Path helpers for nested folders
  const getFolderName = (path) => {
    if (!path) return path;
    const parts = path.split('/');
    return parts[parts.length - 1];
  };

  const getParentPath = (path) => {
    if (!path || !path.includes('/')) return null;
    return path.split('/').slice(0, -1).join('/');
  };

  const getDirectChildFolders = (category, parentPath) => {
    const all = getFoldersForCategory(category);
    return all.filter(f => {
      const parent = getParentPath(f);
      return parentPath === null ? parent === null : parent === parentPath;
    });
  };

  const getAllDescendantPaths = (prefix) => {
    if (!prefix) return [];
    const all = getFoldersForCategory(activeCategory);
    return all.filter(f => f === prefix || f.startsWith(prefix + '/'));
  };

  // Default initial snippets (used if nothing is saved yet)
  const defaultSnippets = [
    {
      id: 'default-1',
      title: 'Consulta de Clientes Activos',
      category: 'SQL',
      content: "SELECT id_cliente, nombre, correo, fecha_registro\nFROM clientes\nWHERE estado = 'A'\nORDER BY fecha_registro DESC\nLIMIT 100;",
      color: 'indigo',
      folder: null
    },
    {
      id: 'default-2',
      title: 'Puerto en uso (kill process)',
      category: 'Consola',
      content: 'netstat -ano | findstr :8080\ntaskkill /PID <PID> /F',
      color: 'rose',
      folder: null
    },
    {
      id: 'default-3',
      title: 'Git config identity',
      category: 'Consola',
      content: 'git config --global user.name "Tu Nombre"\ngit config --global user.email "usuario@correo.com"',
      color: 'emerald',
      folder: null
    },
    {
      id: 'default-4',
      title: 'Template - React Functional Component',
      category: 'Código',
      content: "import React from 'react';\n\nexport const MyComponent = () => {\n  return (\n    <div className=\"p-4\">\n      <h1>Componente React</h1>\n    </div>\n  );\n};",
      color: 'violet',
      folder: null
    }
  ];

  // Load snippets on component mount
  useEffect(() => {
    const loadSnippets = async () => {
      const defaultData = {
        workspaces: ['General'],
        currentWorkspace: 'General',
        snippets: defaultSnippets.map(s => ({ ...s, workspace: 'General' })),
        folders: {},
        workspaceColors: {},
        workspaceThemes: {}
      };

      let loaded = null;

      if (window.electronAPI) {
        try {
          const data = await window.electronAPI.getSnippets();
          if (data && data.snippets) {
            loaded = data;
            setSnippets(data.snippets || []);
            setWorkspaces(data.workspaces || ['General']);
            const curW = data.currentWorkspace || 'General';
            setCurrentWorkspace(curW);
            setFolders(data.folders || {});
            setWorkspaceColors(data.workspaceColors || {});
            const wThemes = data.workspaceThemes || {};
            setWorkspaceThemes(wThemes);
            if (data.categoriesOrder) setCategoriesOrder(data.categoriesOrder);
            if (data.categoryIcons) setCategoryIcons(data.categoryIcons);
            if (wThemes[curW]) setTheme(wThemes[curW]);
          } else if (Array.isArray(data) && data.length > 0) {
            // Migrar formato antiguo
            const migrated = {
              workspaces: ['General'],
              currentWorkspace: 'General',
              snippets: data.map(s => ({ ...s, workspace: s.workspace || 'General' })),
              folders: {},
              workspaceColors: {},
              workspaceThemes: {}
            };
            loaded = migrated;
            setSnippets(migrated.snippets);
            setWorkspaces(migrated.workspaces);
            setCurrentWorkspace(migrated.currentWorkspace);
            setWorkspaceColors(migrated.workspaceColors);
            setWorkspaceThemes(migrated.workspaceThemes);
            await window.electronAPI.saveSnippets(migrated);
          } else {
            // Primer arranque
            loaded = defaultData;
            setSnippets(defaultData.snippets);
            setWorkspaces(defaultData.workspaces);
            setCurrentWorkspace(defaultData.currentWorkspace);
            setFolders({});
            setWorkspaceColors({});
            setWorkspaceThemes({});
            await window.electronAPI.saveSnippets(defaultData);
          }
        } catch (e) {
          console.error('Failed to load snippets via Electron:', e);
          loaded = defaultData;
          setSnippets(defaultData.snippets);
          setWorkspaces(defaultData.workspaces);
          setCurrentWorkspace(defaultData.currentWorkspace);
          setFolders({});
          setWorkspaceColors({});
          setWorkspaceThemes({});
        }
      } else {
        // Browser fallback
        const local = localStorage.getItem('quick_snippets');
        if (local) {
          try {
            const parsed = JSON.parse(local);
            if (parsed && parsed.snippets) {
              loaded = parsed;
              setSnippets(parsed.snippets || []);
              setWorkspaces(parsed.workspaces || ['General']);
              const curW = parsed.currentWorkspace || 'General';
              setCurrentWorkspace(curW);
              setFolders(parsed.folders || {});
              setWorkspaceColors(parsed.workspaceColors || {});
              const wThemes = parsed.workspaceThemes || {};
              setWorkspaceThemes(wThemes);
              if (parsed.categoriesOrder) setCategoriesOrder(parsed.categoriesOrder);
              if (parsed.categoryIcons) setCategoryIcons(parsed.categoryIcons);
              if (wThemes[curW]) setTheme(wThemes[curW]);
            } else if (Array.isArray(parsed)) {
              // Migrar
              const migrated = {
                workspaces: ['General'],
                currentWorkspace: 'General',
                snippets: parsed.map(s => ({ ...s, workspace: s.workspace || 'General' })),
                folders: {},
                workspaceColors: {},
                workspaceThemes: {}
              };
              loaded = migrated;
              setSnippets(migrated.snippets);
              setWorkspaces(migrated.workspaces);
              setCurrentWorkspace(migrated.currentWorkspace);
              setWorkspaceColors(migrated.workspaceColors);
              setWorkspaceThemes(migrated.workspaceThemes);
              safeSetItem('quick_snippets', JSON.stringify(migrated));
            } else {
              loaded = defaultData;
              setSnippets(defaultData.snippets);
              setWorkspaces(defaultData.workspaces);
              setCurrentWorkspace(defaultData.currentWorkspace);
              setFolders({});
              setWorkspaceColors({});
              setWorkspaceThemes({});
              safeSetItem('quick_snippets', JSON.stringify(defaultData));
            }
          } catch (err) {
            console.error('Failed to load storage:', err);
            loaded = defaultData;
            setSnippets(defaultData.snippets);
            setWorkspaces(defaultData.workspaces);
            setCurrentWorkspace(defaultData.currentWorkspace);
            setFolders({});
            setWorkspaceColors({});
            setWorkspaceThemes({});
          }
        } else {
          loaded = defaultData;
          setSnippets(defaultData.snippets);
          setWorkspaces(defaultData.workspaces);
          setCurrentWorkspace(defaultData.currentWorkspace);
          setFolders({});
          setWorkspaceColors({});
          setWorkspaceThemes({});
          safeSetItem('quick_snippets', JSON.stringify(defaultData));
        }
      }

      if (loaded) {
        localDataRef.current = loaded;
        if (isConfigured()) {
          try {
            const { data: { session } } = await getSupabase().auth.getSession();
            if (session) {
              syncAllToCloud(localDataRef.current, false, true);
            }
          } catch (e) {}
        }
      }
    };
    loadSnippets();
  }, []);

  // Save snippets utility (local + cloud)
  const saveSnippetsData = async (
    newSnippets,
    newWorkspaces = workspaces,
    newCurrentWorkspace = currentWorkspace,
    newFolders = folders,
    newWorkspaceColors = workspaceColors,
    newWorkspaceThemes = workspaceThemes,
    newCategoriesOrder = categoriesOrder,
    newCategoryIcons = categoryIcons
  ) => {
    setSnippets(newSnippets);
    setWorkspaces(newWorkspaces);
    setCurrentWorkspace(newCurrentWorkspace);
    setWorkspaceColors(newWorkspaceColors);
    setWorkspaceThemes(newWorkspaceThemes);
    if (newFolders !== folders) setFolders(newFolders);
    if (newCategoriesOrder !== categoriesOrder) setCategoriesOrder(newCategoriesOrder);
    if (newCategoryIcons !== categoryIcons) setCategoryIcons(newCategoryIcons);

    if (newCategoriesOrder) {
      safeSetItem('snapcopy_categories_order', JSON.stringify(newCategoriesOrder));
    }
    if (newCategoryIcons) {
      safeSetItem('snapcopy_category_icons', JSON.stringify(newCategoryIcons));
    }

    localDataRef.current = {
      snippets: newSnippets,
      workspaces: newWorkspaces,
      currentWorkspace: newCurrentWorkspace,
      folders: newFolders,
      workspaceColors: newWorkspaceColors,
      workspaceThemes: newWorkspaceThemes,
      categoriesOrder: newCategoriesOrder,
      categoryIcons: newCategoryIcons,
    };

    const dataObj = localDataRef.current;

    if (window.electronAPI) {
      try {
        await window.electronAPI.saveSnippets(dataObj);
      } catch (e) {
        console.error('Failed to save snippets via Electron:', e);
      }
    } else {
      safeSetItem('quick_snippets', JSON.stringify(dataObj));
    }

    // Sync non-snippet settings to Supabase (workspaces, folders, colors, themes, categories, icons)
    if (cloudEnabled) {
      try {
        await saveUserSettings({
          workspaces: newWorkspaces,
          currentWorkspace: newCurrentWorkspace,
          folders: newFolders,
          workspaceColors: newWorkspaceColors,
          workspaceThemes: newWorkspaceThemes,
          categoriesOrder: newCategoriesOrder,
          categoryIcons: newCategoryIcons,
        });
      } catch (e) {
        console.error('Failed to sync user settings to cloud:', e);
      }
    }
  };

  // Copy to clipboard handler
  const handleCopy = async (e, text, title) => {
    e.stopPropagation(); // Avoid triggering any other event
    
    if (window.electronAPI) {
      try {
        await window.electronAPI.copyToClipboard(text);
      } catch (err) {
        await navigator.clipboard.writeText(text);
      }
    } else {
      await navigator.clipboard.writeText(text);
    }

    // Trigger Toast Notification
    const toastId = Date.now().toString();
    const newToast = { id: toastId, message: t('toasts.copied', { title }) };
    setToasts(prev => [...prev, newToast]);

    // Remove toast after 3 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toastId));
    }, 3000);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
      if (createIconPickerRef.current && !createIconPickerRef.current.contains(e.target)) {
        setIsCreateIconPickerOpen(false);
      }
      if (aboutRef.current && !aboutRef.current.contains(e.target)) {
        setShowAbout(false);
      }
      if (isCategoryManageOpen && !e.target.closest('.modal-content')) {
        setEditingCategoryIcon(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCategoryManageOpen]);

  // Open Form Modal (Add mode)
  const handleOpenAdd = () => {
    setEditingSnippet(null);
    setFormTitle('');
    setFormCategory(activeCategory);
    setSelectedCategoryOption(activeCategory);
    setFormContent('');
    setFormColor('indigo');
    setFormFolder(activeFolder || '');
    setIsFormModalOpen(true);
  };

  // Open Form Modal (Edit mode)
  const handleOpenEdit = (e, snippet) => {
    e.stopPropagation();
    setEditingSnippet(snippet);
    setFormTitle(snippet.title);
    setFormCategory(snippet.category);
    setSelectedCategoryOption(snippet.category);
    setFormContent(snippet.content);
    setFormColor(snippet.color || 'indigo');
    setFormFolder(snippet.folder || '');
    setIsFormModalOpen(true);
  };

  // Open Delete Modal
  const handleOpenDelete = (e, snippet) => {
    e.stopPropagation();
    setSnippetToDelete(snippet);
    setIsDeleteModalOpen(true);
  };

  // Save Snippet
  const handleSaveSnippet = async (e) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) return;

    const category = formCategory.trim() ? formCategory.trim() : 'General';
    const folder = formFolder || null;
    let updatedSnippets = [];

    if (editingSnippet) {
      // Editing
      updatedSnippets = snippets.map(s => {
        if (s.id === editingSnippet.id) {
          return {
            ...s,
            title: formTitle.trim(),
            category: category,
            content: formContent,
            color: formColor,
            folder: folder,
            workspace: s.workspace || currentWorkspace
          };
        }
        return s;
      });
    } else {
      // Adding
      const newSnippet = {
        id: Date.now().toString(),
        title: formTitle.trim(),
        category: category,
        content: formContent,
        color: formColor,
        folder: folder,
        workspace: currentWorkspace
      };
      updatedSnippets = [newSnippet, ...snippets];
    }

    await saveSnippetsData(updatedSnippets);
    // Cloud sync
    await syncToCloud(async () => {
      const snippet = updatedSnippets.find(s => s.id === (editingSnippet ? editingSnippet.id : updatedSnippets[0].id));
      if (snippet) await saveCloudSnippet(snippet);
    });
    setIsFormModalOpen(false);
  };

  const handleCloseShortcutModal = () => {
    safeSetItem('shortcut_info_shown', 'true');
    setIsShortcutModalOpen(false);
    setTourStep(0);
  };

  const handleSuggestionImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    files.forEach(file => {
      if (!file.type.startsWith('image/')) return;
      if (file.size > 5 * 1024 * 1024) {
        addToast('La imagen es demasiado grande (máximo 5MB).');
        return;
      }
      const reader = new FileReader();
      reader.onload = (evt) => {
        setSuggestionImages(prev => {
          if (prev.length >= 4) return prev;
          return [...prev, {
            id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            dataUrl: evt.target.result,
            name: file.name
          }];
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveSuggestionImage = (imgId) => {
    setSuggestionImages(prev => prev.filter(img => img.id !== imgId));
  };

  const handleSendSuggestion = async (e) => {
    if (e) e.preventDefault();
    if (!suggestionSubject.trim() || !suggestionBody.trim()) {
      addToast(t('suggestions.error_empty'));
      return;
    }
    setIsSubmittingSuggestion(true);

    try {
      const recipientEmail = 'cmtdevsolutions@gestricon.com';
      const newSuggestion = {
        id: `sug_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_email: user?.email || 'Anónimo',
        recipient: recipientEmail,
        subject: suggestionSubject.trim(),
        body: suggestionBody.trim(),
        images: suggestionImages,
        created_at: new Date().toISOString()
      };

      // 1. Guardar en Supabase
      try {
        await saveCloudSuggestion(newSuggestion);
      } catch (err) {
        console.warn('Error saving cloud suggestion:', err);
      }

      // 2. Guardar en localStorage
      try {
        const existingStr = localStorage.getItem('snapcopy_suggestions');
        const existing = existingStr ? JSON.parse(existingStr) : [];
        existing.unshift(newSuggestion);
        localStorage.setItem('snapcopy_suggestions', JSON.stringify(existing.slice(0, 50)));
      } catch (err) {
        console.warn('LocalStorage suggestion error:', err);
      }

      // 3. Enviar por email (vía Electron IPC, Resend API o FormSubmit fallback)
      const resendApiKey = import.meta.env.VITE_RESEND_API_KEY || 're_S2bsxmJ8_MByHH4xdHuyTcgamEWWsGJ3u';
      const resendFrom = import.meta.env.VITE_RESEND_FROM_EMAIL || 'SnapCopy <cmtdevsolutions@gestricon.com>';

      const attachments = suggestionImages.map(img => ({
        filename: img.name || 'captura.png',
        content: img.dataUrl.includes('base64,') ? img.dataUrl.split('base64,')[1] : img.dataUrl
      }));

      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Nueva Sugerencia en SnapCopy</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 30px 10px;">
            <tr>
              <td align="center">
                <!-- Main Card Container -->
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);">
                  
                  <!-- Vibrant Solid Header Banner (Indigo) -->
                  <tr>
                    <td style="background-color: #4f46e5; background-image: linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #7c3aed 100%); padding: 32px 28px; text-align: left;">
                      <span style="display: inline-block; background-color: rgba(255, 255, 255, 0.2); color: #ffffff; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; padding: 5px 14px; border-radius: 20px; margin-bottom: 12px;">
                        📬 BUZÓN DE SUGERENCIAS
                      </span>
                      <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">
                        ⚡ SnapCopy Desktop
                      </h1>
                    </td>
                  </tr>

                  <!-- Content Body -->
                  <tr>
                    <td style="padding: 28px;">
                      
                      <!-- Subject Card -->
                      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f4ff; border-radius: 10px; border-left: 4px solid #4f46e5; margin-bottom: 24px;">
                        <tr>
                          <td style="padding: 16px 20px;">
                            <div style="font-size: 11px; font-weight: 700; color: #4f46e5; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px;">
                              ASUNTO
                            </div>
                            <div style="font-size: 18px; font-weight: 700; color: #1e1b4b; line-height: 1.3;">
                              ${suggestionSubject.trim()}
                            </div>
                          </td>
                        </tr>
                      </table>

                      <!-- Suggestion Details -->
                      <div style="margin-bottom: 24px;">
                        <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px;">
                          💬 DETALLE DE LA SUGERENCIA / FEEDBACK
                        </div>
                        <div style="background-color: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0; padding: 20px; color: #1e293b; font-size: 15px; line-height: 1.65; white-space: pre-wrap; word-break: break-word;">
                          ${suggestionBody.trim()}
                        </div>
                      </div>

                      <!-- Info Metadata Grid -->
                      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 10px;">
                        <tr>
                          <td width="50%" style="padding-right: 6px; vertical-align: top;">
                            <div style="background-color: #f8fafc; border-radius: 10px; padding: 14px; border: 1px solid #e2e8f0;">
                              <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
                                👤 USUARIO REMITENTE
                              </div>
                              <div style="font-size: 13px; font-weight: 700; color: #0f172a; word-break: break-all;">
                                ${user?.email || 'Usuario Anónimo'}
                              </div>
                            </div>
                          </td>
                          <td width="50%" style="padding-left: 6px; vertical-align: top;">
                            <div style="background-color: #f8fafc; border-radius: 10px; padding: 14px; border: 1px solid #e2e8f0;">
                              <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
                                🖼️ CAPTURAS ADJUNTAS
                              </div>
                              <div style="font-size: 13px; font-weight: 700; color: ${suggestionImages.length > 0 ? '#059669' : '#64748b'};">
                                ${suggestionImages.length > 0 ? `${suggestionImages.length} archivo(s) adjunto(s)` : 'Sin capturas'}
                              </div>
                            </div>
                          </td>
                        </tr>
                      </table>

                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8fafc; padding: 20px 28px; border-top: 1px solid #e2e8f0; text-align: center;">
                      <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 700; color: #475569;">
                        SnapCopy Engine v${pkg.version} • Desarrollado por <span style="color: #4f46e5;">CMT DEV SOLUTIONS</span>
                      </p>
                      <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                        Este es un mensaje automático generado desde la aplicación de escritorio SnapCopy.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      let emailSentSuccessfully = false;

      if (window.electronAPI?.sendEmail) {
        try {
          const result = await window.electronAPI.sendEmail({
            apiKey: resendApiKey,
            from: resendFrom,
            to: [recipientEmail],
            subject: `[SnapCopy Sugerencia] ${suggestionSubject.trim()}`,
            html: emailHtml,
            attachments: attachments.length > 0 ? attachments : undefined
          });
          if (result && result.success) emailSentSuccessfully = true;
        } catch (err) {
          console.warn('Electron sendEmail error:', err);
        }
      }

      if (!emailSentSuccessfully) {
        try {
          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${resendApiKey}`
            },
            body: JSON.stringify({
              from: resendFrom,
              to: [recipientEmail],
              subject: `[SnapCopy Sugerencia] ${suggestionSubject.trim()}`,
              html: emailHtml,
              attachments: attachments.length > 0 ? attachments : undefined
            })
          });
          if (res.ok) emailSentSuccessfully = true;
        } catch (e) {}
      }

      addToast(t('suggestions.sent_success'));
    } catch (globalErr) {
      console.error('Error in handleSendSuggestion:', globalErr);
      addToast(t('suggestions.sent_success'));
    } finally {
      setIsSubmittingSuggestion(false);
      setSuggestionSubject('');
      setSuggestionBody('');
      setSuggestionImages([]);
      setIsSuggestionModalOpen(false);
    }
  };

  const handleNextTourStep = () => setTourStep(s => s + 1);
  const handlePrevTourStep = () => setTourStep(s => s - 1);

  const adjustContextMenu = (e, itemCount) => {
    const menuWidth = 180;
    const estimatedHeight = 12 + itemCount * 36;
    const x = Math.max(0, Math.min(e.clientX, window.innerWidth - menuWidth - 4));
    const y = Math.max(0, Math.min(e.clientY, window.innerHeight - estimatedHeight - 4));
    return { x, y };
  };

  // Delete Snippet
  const handleDeleteSnippet = async () => {
    if (!snippetToDelete) return;
    const updatedSnippets = snippets.filter(s => s.id !== snippetToDelete.id);
    await saveSnippetsData(updatedSnippets);
    // Cloud sync
    await syncToCloud(async () => { await deleteCloudSnippet(snippetToDelete.id); });
    setIsDeleteModalOpen(false);
    setSnippetToDelete(null);
  };

  // Add workspace handler
  const handleAddWorkspace = async (e) => {
    e.preventDefault();
    const name = newWorkspaceName.trim();
    if (!name) return;

    if (workspaces.includes(name)) {
      alert(t('alerts.workspace_exists'));
      return;
    }

    const updatedWorkspaces = [...workspaces, name];
    setNewWorkspaceName('');
    setIsAddWorkspaceModalOpen(false);
    const updatedThemes = {
      ...workspaceThemes,
      [name]: 'indigo'
    };
    setTheme('indigo');
    await saveSnippetsData(snippets, updatedWorkspaces, name, folders, workspaceColors, updatedThemes);
    setActiveCategory('General');
    setActiveFolder(null);
  };

  // Add folder handler (nested paths)
  const handleAddFolder = async (e) => {
    e.preventDefault();
    const name = newFolderName.trim();
    if (!name) return;
    const cat = activeCategory;
    const folderPath = activeFolder ? `${activeFolder}/${name}` : name;
    const existing = getFoldersForCategory(cat);
    if (existing.includes(folderPath)) {
      addToast(t('toasts.folder_exists'));
      return;
    }
    const workspaceFolders = folders[currentWorkspace] || {};
    const updatedWorkspaceFolders = {
      ...workspaceFolders,
      [cat]: [...(workspaceFolders[cat] || []), folderPath]
    };
    const updatedFolders = {
      ...folders,
      [currentWorkspace]: updatedWorkspaceFolders
    };
    setNewFolderName('');
    setIsAddFolderModalOpen(false);
    setActiveFolder(folderPath);
    setExpandedCategories(prev => { const s = new Set(prev); s.add(cat); return s; });
    setSidebarExpandedFolders(prev => {
      const s = new Set(prev);
      if (activeFolder) s.add(activeFolder);
      return s;
    });
    await saveSnippetsData(snippets, workspaces, currentWorkspace, updatedFolders);
    addToast(t('toasts.folder_created', { name: getFolderName(folderPath), cat, path: activeFolder ? ' / ' + activeFolder : '' }));
  };

  // Delete workspace handler
  const handleDeleteWorkspace = (workspaceName) => {
    if (workspaces.length <= 1) {
      addToast(t('toasts.workspace_min_one'));
      return;
    }
    setWorkspaceToDelete(workspaceName);
    setIsDeleteWorkspaceConfirmOpen(true);
    setIsWorkspaceDropdownOpen(false);
  };

  const executeDeleteWorkspace = async () => {
    const nameToDelete = workspaceToDelete;
    const updatedWorkspaces = workspaces.filter(w => w !== nameToDelete);
    const updatedSnippets = snippets.filter(s => (s.workspace || 'General') !== nameToDelete);
    
    // Cleanup folders, colors, and themes
    const updatedFolders = { ...folders };
    if (updatedFolders[nameToDelete]) delete updatedFolders[nameToDelete];
    const updatedColors = { ...workspaceColors };
    if (updatedColors[nameToDelete]) delete updatedColors[nameToDelete];
    const updatedThemes = { ...workspaceThemes };
    if (updatedThemes[nameToDelete]) delete updatedThemes[nameToDelete];

    const nextWorkspace = currentWorkspace === nameToDelete ? updatedWorkspaces[0] : currentWorkspace;
    const nextTheme = updatedThemes[nextWorkspace] || 'indigo';
    setTheme(nextTheme);
    
    await saveSnippetsData(updatedSnippets, updatedWorkspaces, nextWorkspace, updatedFolders, updatedColors, updatedThemes);
    await syncToCloud(async () => { await deleteCloudSnippetsByWorkspace(nameToDelete); });
    setIsDeleteWorkspaceConfirmOpen(false);
    setWorkspaceToDelete('');
    setActiveCategory('General');
    setActiveFolder(null);
    addToast(t('toasts.workspace_deleted', { name: nameToDelete }));
  };

  // Open Edit Workspace Modal
  const handleOpenEditWorkspace = (workspaceName) => {
    setWorkspaceToEdit(workspaceName);
    setEditWorkspaceName(workspaceName);
    setEditWorkspaceColor(workspaceColors[workspaceName] || 'indigo');
    setIsEditWorkspaceModalOpen(true);
    setIsWorkspaceDropdownOpen(false);
  };

  // Save Workspace Customizations (Name & Color)
  const handleSaveWorkspaceEdit = async () => {
    const oldName = workspaceToEdit;
    const newName = editWorkspaceName.trim();
    const color = editWorkspaceColor;

    if (!newName) {
      alert(t('alerts.workspace_name_empty'));
      return;
    }

    if (newName !== oldName && workspaces.includes(newName)) {
      alert(t('alerts.workspace_exists'));
      return;
    }

    // Update workspaces list
    const updatedWorkspaces = workspaces.map(w => w === oldName ? newName : w);
    
    // Update workspace colors config
    const updatedColors = { ...workspaceColors };
    if (oldName !== newName) {
      delete updatedColors[oldName];
    }
    updatedColors[newName] = color;

    // Update workspace folders registry if renamed
    const updatedFolders = { ...folders };
    if (oldName !== newName && updatedFolders[oldName]) {
      updatedFolders[newName] = updatedFolders[oldName];
      delete updatedFolders[oldName];
    }

    // Update workspace themes config if renamed
    const updatedThemes = { ...workspaceThemes };
    if (oldName !== newName) {
      if (updatedThemes[oldName]) {
        updatedThemes[newName] = updatedThemes[oldName];
        delete updatedThemes[oldName];
      }
    }

    // Update currentWorkspace name if it was active
    const newCurrentWorkspace = currentWorkspace === oldName ? newName : currentWorkspace;

    // Update snippets associated with old workspace to new workspace name
    const updatedSnippets = snippets.map(s => {
      const sWorkspace = s.workspace || 'General';
      if (sWorkspace === oldName) {
        return { ...s, workspace: newName };
      }
      return s;
    });

    // Save configuration
    await saveSnippetsData(updatedSnippets, updatedWorkspaces, newCurrentWorkspace, updatedFolders, updatedColors, updatedThemes);

    // Sync renamed snippets to cloud
    await syncToCloud(async () => {
      const moved = updatedSnippets.filter(s => (s.workspace || 'General') === newName);
      await Promise.all(moved.map(s => saveCloudSnippet(s)));
    });

    setIsEditWorkspaceModalOpen(false);
    addToast(t('toasts.workspace_saved', { name: newName }));
  };

  // Get active color value for workspaces
  const getWorkspaceColorValue = (workspaceName) => {
    const color = workspaceColors[workspaceName] || 'indigo';
    const mapping = {
      indigo: '#6366f1',
      emerald: '#10b981',
      rose: '#f43f5e',
      amber: '#f59e0b',
      sky: '#0ea5e9',
      violet: '#8b5cf6',
      teal: '#14b8a6'
    };
    return mapping[color] || '#6366f1';
  };

  // Toggle Pin/Favorite Snippet
  const handleTogglePin = async (e, id) => {
    e.stopPropagation();
    const updatedSnippets = snippets.map(s => 
      s.id === id ? { ...s, pinned: !s.pinned } : s
    );
    await saveSnippetsData(updatedSnippets);
    await syncToCloud(async () => { const toggled = updatedSnippets.find(s => s.id === id); if (toggled) await saveCloudSnippet(toggled); });
  };

  // Workspace specific snippets
  const workspaceSnippets = snippets.filter(s => (s.workspace || 'General') === currentWorkspace);

  // Categories Calculation
  const defaultCategories = ['SQL', 'Consola', 'Código', 'General'];
  const uniqueUserCategories = [...new Set(workspaceSnippets.map(s => s.category))]
    .filter(c => c && !defaultCategories.includes(c));
  
  const [categoriesOrder, setCategoriesOrder] = useState(() => {
    try { return JSON.parse(localStorage.getItem('snapcopy_categories_order') || 'null'); }
    catch { return null; }
  });

  const orderedCategories = categoriesOrder || [...defaultCategories];
  const allCategories = [...orderedCategories, ...uniqueUserCategories.filter(c => !orderedCategories.includes(c))];

  const handleCreateCategory = async () => {
    const name = newCategoryName.trim();
    if (!name || allCategories.includes(name)) return;
    const updatedOrder = [...orderedCategories, name];
    const updatedIcons = { ...categoryIcons, [name]: selectedCategoryIcon };
    setNewCategoryName('');
    setSelectedCategoryIcon('Code');
    await saveSnippetsData(snippets, workspaces, currentWorkspace, folders, workspaceColors, workspaceThemes, updatedOrder, updatedIcons);
    addToast(t('toasts.category_created', { name }));
  };

  const handleDeleteCategory = async (cat) => {
    const updatedSnippets = snippets.map(s => s.category === cat ? { ...s, category: 'General' } : s);
    const updatedOrder = orderedCategories.filter(c => c !== cat);
    const { [cat]: _, ...updatedIcons } = categoryIcons;
    await saveSnippetsData(updatedSnippets, workspaces, currentWorkspace, folders, workspaceColors, workspaceThemes, updatedOrder, updatedIcons);
    await syncToCloud(async () => {
      const affected = updatedSnippets.filter(s => s.category === 'General');
      const originalCatIds = new Set(snippets.filter(s => s.category === cat).map(s => s.id));
      const toSync = affected.filter(s => originalCatIds.has(s.id));
      await Promise.all(toSync.map(s => saveCloudSnippet(s)));
    });
    addToast(t('toasts.category_deleted', { cat }));
  };

  const handleMoveCategory = async (cat, direction) => {
    const idx = orderedCategories.indexOf(cat);
    if (idx === -1) return;
    const updatedOrder = [...orderedCategories];
    const target = idx + direction;
    if (target < 0 || target >= updatedOrder.length) return;
    [updatedOrder[idx], updatedOrder[target]] = [updatedOrder[target], updatedOrder[idx]];
    await saveSnippetsData(snippets, workspaces, currentWorkspace, folders, workspaceColors, workspaceThemes, updatedOrder, categoryIcons);
  };

  const handleRenameCategory = async (oldName) => {
    const newName = editingCategoryValue.trim();
    if (!newName || newName === oldName || allCategories.includes(newName)) {
      setEditingCategory(null);
      return;
    }
    const updatedSnippets = snippets.map(s => s.category === oldName ? { ...s, category: newName } : s);
    const updatedOrder = orderedCategories.map(c => c === oldName ? newName : c);
    let updatedIcons = { ...categoryIcons };
    if (categoryIcons[oldName]) {
      updatedIcons[newName] = categoryIcons[oldName];
      delete updatedIcons[oldName];
    }
    await saveSnippetsData(updatedSnippets, workspaces, currentWorkspace, folders, workspaceColors, workspaceThemes, updatedOrder, updatedIcons);
    await syncToCloud(async () => {
      const affected = updatedSnippets.filter(s => s.category === newName);
      const oldCatIds = new Set(snippets.filter(s => s.category === oldName).map(s => s.id));
      const toSync = affected.filter(s => oldCatIds.has(s.id));
      await Promise.all(toSync.map(s => saveCloudSnippet(s)));
    });
    setEditingCategory(null);
    addToast(t('toasts.category_renamed', { name: newName }));
  };

  // Icon picker map
  const AVAILABLE_ICONS = {
    Code, Database, Terminal, GitBranch, Globe, Cloud, Hash, Bell,
    Shield, ServerIcon, Monitor, Palette, Star, Heart, Zap,
    BookOpen, Box, Compass, Flag, Key, Lightbulb, Link, Lock,
    Rocket, Tag, Target, Wrench, Brain, Bot, Package, Puzzle,
    FileText, FolderOpen, Layers, Home, Image, Camera, Play,
    Music, Headphones, Gift, Award, Crown, Gem, Leaf, Feather,
    Wind, Coffee, Smile, MessageSquare, Download, Upload, RefreshCw,
    ExternalLink, Eye, Sliders, Filter, Clock, Calendar, Watch,
    Timer, Bookmark, MapPin, Navigation, Map: MapIcon, Layout, Columns, Grid, Rows
  };

  // Helper to map category names to icons
  const getCategoryIcon = (category, size = 16) => {
    const iconName = categoryIcons[category];
    if (iconName && AVAILABLE_ICONS[iconName]) {
      const IconComp = AVAILABLE_ICONS[iconName];
      return <IconComp size={size} />;
    }
    switch (category) {
      case 'SQL': return <Database size={size} />;
      case 'Consola': return <Terminal size={size} />;
      case 'Código': return <Code size={size} />;
      default: return <FileText size={size} />;
    }
  };

  // Toggle category expansion in sidebar
  const toggleCategoryExpand = (cat) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  // Filtering Logic (match exact folder or root)
  const filteredSnippets = workspaceSnippets.filter(s => {
    const matchesCategory = isHomeView ? true : s.category === activeCategory;
    const matchesFolder = activeFolder === null ? true : s.folder === activeFolder;
    const matchesSearch = (s.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (s.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (s.content || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (s.folder || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesFolder && matchesSearch;
  });

  // Sorting Logic: Pinned snippets go to the top, then sort by id (newest first)
  const sortedSnippets = useMemo(() =>
    [...filteredSnippets].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.id.localeCompare(a.id);
    }),
    [filteredSnippets]
  );

  // Shift + A: select/deselect all visible snippets
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key.toLowerCase() === 'a' && e.shiftKey) {
        const tag = e.target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        e.preventDefault();
        setSelectedSnippetIds(prev => {
          const visible = sortedSnippets.map(s => s.id);
          const allSelected = visible.every(id => prev.includes(id));
          return allSelected ? [] : visible;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sortedSnippets]);

  // Helper: get total snippet count for a folder (handles Home view multi-category structure)
  const getFolderSnippetCount = (folder) => {
    const folderData = snippetsByFolder[folder];
    if (isHomeView && folderData && typeof folderData === 'object' && !Array.isArray(folderData)) {
      return Object.values(folderData).reduce((sum, arr) => sum + arr.length, 0);
    }
    return folderData ? folderData.length : 0;
  };

  // Get folder-grouped snippets for the current view (nested paths)
  const currentLevel = activeFolder; // null = top level, string = specific folder
  const currentSnippets = isHomeView
    ? (currentLevel === null
        ? workspaceSnippets.filter(s => !s.folder) // root level - all snippets without folder
        : workspaceSnippets.filter(s => s.folder === currentLevel)) // specific folder from any category
    : sortedSnippets.filter(s => s.folder === (currentLevel || null));
  // Get child folders and snippets by folder (handles Home view: all categories)
  const getHomeChildFolders = (parentPath) => {
    const allFolders = new Set();
    allCategories.forEach(cat => {
      const catFolders = getFoldersForCategory(cat);
      catFolders.forEach(f => {
        const parent = getParentPath(f);
        if (parentPath === null ? parent === null : parent === parentPath) {
          allFolders.add(f);
        }
      });
    });
    return [...allFolders].sort();
  };

  const getHomeSnippetsByFolder = (folderPath) => {
    const result = {};
    if (folderPath === null) {
      // Root level - show all snippets without folder
      allCategories.forEach(cat => {
        const catSnippets = workspaceSnippets.filter(s => s.category === cat && !s.folder);
        if (catSnippets.length > 0) result[cat] = catSnippets;
      });
    } else {
      // Specific folder path - show snippets in that folder from all categories
      allCategories.forEach(cat => {
        const catSnippets = workspaceSnippets.filter(s => s.category === cat && s.folder === folderPath);
        if (catSnippets.length > 0) result[cat] = catSnippets;
      });
    }
    return result;
  };

  const childFolders = isHomeView ? getHomeChildFolders(currentLevel) : getDirectChildFolders(activeCategory, currentLevel);
  const snippetsByFolder = isHomeView ? getHomeSnippetsByFolder(currentLevel) : (() => {
    const result = {};
    childFolders.forEach(f => {
      result[f] = workspaceSnippets.filter(s => s.category === activeCategory && s.folder === f);
    });
    return result;
  })();

  // Dashboard computed values
  const _pinnedSnippets = sortedSnippets.filter(s => s.pinned);
  const _recentSnippets = [...sortedSnippets].sort((a, b) => b.id.localeCompare(a.id)).slice(0, 3);
  const _categoryStats = allCategories.map(cat => {
    const catSnippets = workspaceSnippets.filter(s => s.category === cat);
    const total = catSnippets.length;
    const pinned = catSnippets.filter(s => s.pinned).length;
    const catFolders = getFoldersForCategory(cat);
    return { cat, total, pinned, folders: catFolders.length };
  }).filter(s => s.total > 0);

  // Drag & Drop handlers (supports both snippets and folders)
  const handleSnippetDragStart = (e, snippetId) => {
    if (selectedSnippetIds.includes(snippetId)) {
      e.dataTransfer.setData('text/plain', 'snips:' + selectedSnippetIds.join(','));
      setDraggedSnippetId(snippetId);
    } else {
      e.dataTransfer.setData('text/plain', 'snip:' + snippetId);
      setDraggedSnippetId(snippetId);
    }
    e.dataTransfer.effectAllowed = 'move';
    setIsFolderDragged(false);
  };

  const handleFolderDragStart = (e, folderPath) => {
    e.dataTransfer.setData('text/plain', 'folder:' + folderPath);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedSnippetId(folderPath);
    setIsFolderDragged(true);
  };

  const handleDropOnFolder = async (e, targetFolder) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolder(null);
    const raw = e.dataTransfer.getData('text/plain');
    if (!raw) return;

    if (raw.startsWith('snips:')) {
      // Dropping multiple selected snippets
      const ids = raw.slice(6).split(',');
      const updatedSnippets = snippets.map(s =>
        ids.includes(s.id) ? { ...s, folder: targetFolder } : s
      );
      await saveSnippetsData(updatedSnippets);
      await syncToCloud(async () => {
        const moved = updatedSnippets.filter(s => ids.includes(s.id));
        await Promise.all(moved.map(s => saveCloudSnippet(s)));
      });
      setSelectedSnippetIds([]);
      setDraggedSnippetId(null);
      addToast(t('toasts.snippets_moved', { count: ids.length, name: getFolderName(targetFolder) }));
    } else if (raw.startsWith('snip:')) {
      // Dropping a single snippet
      const snippetId = raw.slice(5);
      const snippet = snippets.find(s => s.id === snippetId);
      if (!snippet) return;
      if (snippet.folder === targetFolder) return;
      const updatedSnippets = snippets.map(s =>
        s.id === snippetId ? { ...s, folder: targetFolder } : s
      );
      await saveSnippetsData(updatedSnippets);
      await syncToCloud(async () => {
        const moved = updatedSnippets.find(s => s.id === snippetId);
        if (moved) await saveCloudSnippet(moved);
      });
      setDraggedSnippetId(null);
      addToast(t('toasts.snippet_moved', { name: getFolderName(targetFolder) }));
    } else if (raw.startsWith('folder:')) {
      // Dropping a folder into another folder
      const draggedPath = raw.slice(7);
      if (draggedPath === targetFolder) return;
      // Prevent circular: cannot drop into itself or descendant
      if (targetFolder === draggedPath || targetFolder.startsWith(draggedPath + '/')) return;
      const cat = activeCategory;
      const draggedName = getFolderName(draggedPath);
      const newPath = targetFolder + '/' + draggedName;

      // Move all descendant paths in the registry
      const oldPaths = getAllDescendantPaths(draggedPath);
      const updatedFolders = { ...folders };
      const workspaceFolders = { ...(updatedFolders[currentWorkspace] || {}) };
      if (workspaceFolders[cat]) {
        const allPaths = new Set(workspaceFolders[cat]);
        const toRemove = oldPaths;
        const toAdd = oldPaths.map(p => {
          if (p === draggedPath) return newPath;
          if (p.startsWith(draggedPath + '/')) return newPath + p.slice(draggedPath.length);
          return p;
        });
        toRemove.forEach(p => allPaths.delete(p));
        toAdd.forEach(p => allPaths.add(p));
        workspaceFolders[cat] = [...allPaths].sort();
        updatedFolders[currentWorkspace] = workspaceFolders;
      }

      // Update all snippets
      const pathSet = new Set(oldPaths);
      const updatedSnippets = snippets.map(s => {
        if (s.category !== cat || !s.folder) return s;
        if (!pathSet.has(s.folder)) return s;
        if (s.folder === draggedPath) return { ...s, folder: newPath };
        if (s.folder.startsWith(draggedPath + '/')) return { ...s, folder: newPath + s.folder.slice(draggedPath.length) };
        return s;
      });
      await saveSnippetsData(updatedSnippets, workspaces, currentWorkspace, updatedFolders);
      await syncToCloud(async () => {
        const affected = updatedSnippets.filter(s => s.folder && pathSet.has(s.folder));
        await Promise.all(affected.map(s => saveCloudSnippet(s)));
      });
      setDraggedSnippetId(null);
      setIsFolderDragged(false);
      // Navigate to parent so user sees the result
      setActiveFolder(targetFolder);
      addToast(t('toasts.folder_moved', { name: draggedName, target: getFolderName(targetFolder) }));
    }
  };

  const handleDropOnRoot = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolder(null);
    const raw = e.dataTransfer.getData('text/plain');
    if (!raw) return;

    if (raw.startsWith('snips:')) {
      // Dropping multiple selected snippets to root
      const ids = raw.slice(6).split(',');
      const updatedSnippets = snippets.map(s =>
        ids.includes(s.id) ? { ...s, folder: null } : s
      );
      await saveSnippetsData(updatedSnippets);
      await syncToCloud(async () => {
        const moved = updatedSnippets.filter(s => ids.includes(s.id));
        await Promise.all(moved.map(s => saveCloudSnippet(s)));
      });
      setSelectedSnippetIds([]);
      setDraggedSnippetId(null);
      addToast(t('toasts.snippets_moved_root', { count: ids.length }));
    } else if (raw.startsWith('snip:')) {
      const snippetId = raw.slice(5);
      const snippet = snippets.find(s => s.id === snippetId);
      if (!snippet || !snippet.folder) return;
      const updatedSnippets = snippets.map(s =>
        s.id === snippetId ? { ...s, folder: null } : s
      );
      await saveSnippetsData(updatedSnippets);
      await syncToCloud(async () => {
        const moved = updatedSnippets.find(s => s.id === snippetId);
        if (moved) await saveCloudSnippet(moved);
      });
      setDraggedSnippetId(null);
      addToast(t('toasts.snippet_moved_root'));
    } else if (raw.startsWith('folder:')) {
      const draggedPath = raw.slice(7);
      const cat = activeCategory;
      const draggedName = getFolderName(draggedPath);
      const oldPaths = getAllDescendantPaths(draggedPath);
      const updatedFolders = { ...folders };
      const workspaceFolders = { ...(updatedFolders[currentWorkspace] || {}) };
      if (workspaceFolders[cat]) {
        const allPaths = new Set(workspaceFolders[cat]);
        const toRemove = oldPaths;
        const toAdd = oldPaths.map(p => {
          if (p === draggedPath) return draggedName;
          return draggedName + p.slice(draggedPath.length);
        });
        toRemove.forEach(p => allPaths.delete(p));
        toAdd.forEach(p => allPaths.add(p));
        workspaceFolders[cat] = [...allPaths].sort();
        updatedFolders[currentWorkspace] = workspaceFolders;
      }
      const pathSet = new Set(oldPaths);
      const updatedSnippets = snippets.map(s => {
        if (s.category !== cat || !s.folder) return s;
        if (!pathSet.has(s.folder)) return s;
        if (s.folder === draggedPath) return { ...s, folder: draggedName };
        if (s.folder.startsWith(draggedPath + '/')) return { ...s, folder: draggedName + s.folder.slice(draggedPath.length) };
        return s;
      });
      await saveSnippetsData(updatedSnippets, workspaces, currentWorkspace, updatedFolders);
      await syncToCloud(async () => {
        const newRootName = draggedName;
        const changed = updatedSnippets.filter(s => s.folder === newRootName || (s.folder || '').startsWith(newRootName + '/'));
        await Promise.all(changed.map(s => saveCloudSnippet(s)));
      });
      setDraggedSnippetId(null);
      setIsFolderDragged(false);
      setActiveFolder(null);
      addToast(t('toasts.folder_moved_root', { name: draggedName }));
    }
  };

  // Folder settings handlers
  const openFolderSettings = (folderName) => {
    setFolderSettingsCategory(activeCategory);
    setFolderSettingsName(folderName);
    setFolderRenameValue(getFolderName(folderName));
    setIsFolderSettingsOpen(true);
  };

  const handleRenameFolder = async (e) => {
    e.preventDefault();
    const newBaseName = folderRenameValue.trim();
    if (!newBaseName || newBaseName === getFolderName(folderSettingsName)) return;
    const oldPath = folderSettingsName;
    const cat = folderSettingsCategory;
    const parentP = getParentPath(oldPath);
    const newPath = parentP ? `${parentP}/${newBaseName}` : newBaseName;

    // Rename all descendant paths in the registry
    const oldPaths = getAllDescendantPaths(oldPath);
    const updatedFolders = { ...folders };
    const workspaceFolders = { ...(updatedFolders[currentWorkspace] || {}) };
    if (workspaceFolders[cat]) {
      workspaceFolders[cat] = workspaceFolders[cat].map(f => {
        if (f === oldPath) return newPath;
        if (f.startsWith(oldPath + '/')) return newPath + f.slice(oldPath.length);
        return f;
      });
      updatedFolders[currentWorkspace] = workspaceFolders;
    }
    // Update all snippets in this folder and descendants
    const updatedSnippets = snippets.map(s => {
      if (s.category !== cat || !s.folder) return s;
      if (s.folder === oldPath) return { ...s, folder: newPath };
      if (s.folder.startsWith(oldPath + '/')) return { ...s, folder: newPath + s.folder.slice(oldPath.length) };
      return s;
    });
    await saveSnippetsData(updatedSnippets, workspaces, currentWorkspace, updatedFolders);
    await syncToCloud(async () => {
      const changed = updatedSnippets.filter(s => s.category === cat && s.folder === newPath);
      const descendantChanged = updatedSnippets.filter(s => s.category === cat && s.folder && s.folder.startsWith(newPath + '/'));
      await Promise.all([...changed, ...descendantChanged].map(s => saveCloudSnippet(s)));
    });
    if (activeFolder === oldPath || activeFolder?.startsWith(oldPath + '/')) {
      const newActive = activeFolder === oldPath ? newPath : newPath + activeFolder.slice(oldPath.length);
      setActiveFolder(newActive);
    }
    setIsFolderSettingsOpen(false);
    addToast(t('toasts.folder_renamed', { name: newBaseName }));
  };

  const handleDeleteFolder = async () => {
    const cat = folderSettingsCategory;
    const folderPath = folderSettingsName;
    setIsDeleteFolderConfirmOpen(true);
  };

  const executeDeleteFolder = async () => {
    const cat = folderSettingsCategory;
    const folderPath = folderSettingsName;

    // Collect all descendant paths
    const pathsToRemove = getAllDescendantPaths(folderPath);
    const pathsSet = new Set(pathsToRemove);

    // Move all snippets in those paths to root
    const updatedSnippets = snippets.map(s => {
      if (s.category !== cat || !s.folder) return s;
      if (pathsSet.has(s.folder)) return { ...s, folder: null };
      return s;
    });
    // Remove from registry
    const updatedFolders = { ...folders };
    const workspaceFolders = { ...(updatedFolders[currentWorkspace] || {}) };
    if (workspaceFolders[cat]) {
      workspaceFolders[cat] = workspaceFolders[cat].filter(f => !pathsSet.has(f));
      if (workspaceFolders[cat].length === 0) delete workspaceFolders[cat];
      updatedFolders[currentWorkspace] = workspaceFolders;
    }
    await saveSnippetsData(updatedSnippets, workspaces, currentWorkspace, updatedFolders);
    await syncToCloud(async () => {
      const originalIds = new Set(snippets.filter(s => s.category === cat && pathsSet.has(s.folder)).map(s => s.id));
      const toSync = updatedSnippets.filter(s => originalIds.has(s.id));
      await Promise.all(toSync.map(s => saveCloudSnippet(s)));
    });
    setIsFolderSettingsOpen(false);
    setActiveFolder(getParentPath(folderPath));
    addToast(t('toasts.folder_deleted', { name: getFolderName(folderPath) }));
  };

  // Recursive folder tree renderer for sidebar
  const renderFolderTree = (cat, parentPath) => {
    const children = getDirectChildFolders(cat, parentPath);
    return children.map(folder => {
      const hasChildren = getDirectChildFolders(cat, folder).length > 0;
      const isExpanded = sidebarExpandedFolders.has(folder);
      const folderCount = workspaceSnippets.filter(s => s.category === cat && s.folder === folder).length;
      return (
        <div key={folder}>
          <div
            className={`folder-item ${activeCategory === cat && activeFolder === folder ? 'active' : ''}`}
            onClick={() => { setActiveCategory(cat); setActiveFolder(folder); }}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const pos = adjustContextMenu(e, 2);
              setContextMenu({
                x: pos.x, y: pos.y,
                items: [
                  {
                    label: t('folder_modal.manage_title'), icon: 'Settings',
                    action: () => { setActiveCategory(cat); setActiveFolder(folder); openFolderSettings(folder); }
                  },
                  {
                    label: t('delete_folder_modal.title'), icon: 'Trash2',
                    action: () => {
                      setActiveCategory(cat); setActiveFolder(folder);
                      setFolderSettingsCategory(cat); setFolderSettingsName(folder);
                      setIsDeleteFolderConfirmOpen(true);
                    },
                    danger: true
                  },
                ]
              });
            }}
            draggable={false}
            style={{ paddingLeft: parentPath === null ? '8px' : '20px' }}
          >
            <div className="folder-info">
              {hasChildren ? (
                <span
                  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'transform 0.15s', transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)', marginRight: '2px' }}
                  onClick={(e) => { e.stopPropagation(); setSidebarExpandedFolders(prev => { const s = new Set(prev); if (isExpanded) s.delete(folder); else s.add(folder); return s; }); }}
                >
                  <ChevronDown size={12} />
                </span>
              ) : (
                <span style={{ width: '12px', flexShrink: 0 }} />
              )}
              <FolderIcon size={14} className="folder-icon" />
              <span>{getFolderName(folder)}</span>
            </div>
            <span className="category-count">{folderCount}</span>
          </div>
          {isExpanded && renderFolderTree(cat, folder)}
        </div>
      );
    });
};

// Home Dashboard renderer
  const renderHomeDashboard = () => {
    // Recent snippets (last 3)
    const _recentSnippets = [...workspaceSnippets]
      .sort((a, b) => b.id.localeCompare(a.id))
      .slice(0, 3);

    // Pinned snippets across all categories
    const _pinnedSnippets = workspaceSnippets.filter(s => s.pinned);

    return (
      <div className="home-dashboard">
        {/* Welcome Section */}
        <div className="welcome-banner" style={{
          height: '90px',
          padding: '16px 20px',
          marginBottom: '12px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          boxSizing: 'border-box'
        }}>
          <h2 className="welcome-banner-title" style={{ fontSize: '1.4rem', marginBottom: '2px', lineHeight: 1.2 }}>
            {t('dashboard.greeting', { name: user?.user_metadata?.full_name?.split(' ')[0] || user?.user_metadata?.name || 'Creador' })}
          </h2>
          <p className="welcome-banner-subtitle" style={{ fontSize: '0.85rem', margin: 0, lineHeight: 1.2 }}>
            <Trans i18nKey="dashboard.welcome_back" components={{ strong: <strong /> }} />
          </p>
        </div>

        {/* Stats Overview */}
        <div className="dashboard-stats-grid">
          <div className="dashboard-stat-card" style={{ height: '90px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxSizing: 'border-box' }}>
            <div className="dashboard-stat-info">
              <span className="dashboard-stat-number" style={{ fontSize: '1.6rem', lineHeight: 1 }}>{workspaceSnippets.length}</span>
              <span className="dashboard-stat-label" style={{ fontSize: '0.72rem', marginTop: '2px' }}>{t('dashboard.total_snippets')}</span>
            </div>
            <div className="dashboard-stat-icon-wrap" style={{ width: '38px', height: '38px' }}>
              <FileText size={18} />
            </div>
          </div>
          <div className="dashboard-stat-card" style={{ height: '90px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxSizing: 'border-box' }}>
            <div className="dashboard-stat-info">
              <span className="dashboard-stat-number" style={{ fontSize: '1.6rem', lineHeight: 1 }}>{_pinnedSnippets.length}</span>
              <span className="dashboard-stat-label" style={{ fontSize: '0.72rem', marginTop: '2px' }}>{t('dashboard.pinned')}</span>
            </div>
            <div className="dashboard-stat-icon-wrap" style={{ width: '38px', height: '38px' }}>
              <Star size={18} />
            </div>
          </div>
          <div className="dashboard-stat-card" style={{ height: '90px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxSizing: 'border-box' }}>
            <div className="dashboard-stat-info">
              <span className="dashboard-stat-number" style={{ fontSize: '1.6rem', lineHeight: 1 }}>
                {allCategories.filter(cat => workspaceSnippets.some(s => s.category === cat) || orderedCategories.includes(cat)).length}
              </span>
              <span className="dashboard-stat-label" style={{ fontSize: '0.72rem', marginTop: '2px' }}>{t('dashboard.categories')}</span>
            </div>
            <div className="dashboard-stat-icon-wrap" style={{ width: '38px', height: '38px' }}>
              <LayoutGrid size={18} />
            </div>
          </div>
          <div className="dashboard-stat-card" style={{ height: '90px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxSizing: 'border-box' }}>
            <div className="dashboard-stat-info">
              <span className="dashboard-stat-number" style={{ fontSize: '1.6rem', lineHeight: 1 }}>
                {allCategories.reduce((acc, cat) => acc + getFoldersForCategory(cat).length, 0)}
              </span>
              <span className="dashboard-stat-label" style={{ fontSize: '0.72rem', marginTop: '2px' }}>{t('dashboard.folders')}</span>
            </div>
            <div className="dashboard-stat-icon-wrap" style={{ width: '38px', height: '38px' }}>
              <FolderIcon size={18} />
            </div>
          </div>
        </div>

        {/* Split Layout for Snippets and Panels */}
        <div className="dashboard-split-layout">
          {/* Column 1: Snippets (Fijados and Recientes) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '820px', width: '100%' }}>
            {/* Pinned Snippets */}
            {_pinnedSnippets.length > 0 ? (
              <div>
                <div className="dashboard-section-header" style={{ marginBottom: '8px', paddingBottom: '6px' }}>
                  <h3 className="dashboard-section-title" style={{ fontSize: '0.85rem' }}>
                    <Star size={14} style={{ color: 'var(--color-warning)', fill: 'var(--color-warning)' }} />
                    {t('dashboard.pinned_snippets', { count: _pinnedSnippets.length })}
                  </h3>
                </div>
                <div className="snippets-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px' }}>
                  {_pinnedSnippets.map(snippet => renderSnippetCard(snippet))}
                </div>
              </div>
            ) : (
              // Empty Pinned state placeholder
              <div>
                <div className="dashboard-section-header" style={{ marginBottom: '8px', paddingBottom: '6px' }}>
                  <h3 className="dashboard-section-title" style={{ fontSize: '0.85rem' }}>
                    <Star size={14} style={{ color: 'var(--text-muted)' }} />
                    {t('dashboard.pinned_snippets_title')}
                  </h3>
                </div>
                <div style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px dashed var(--border)',
                  background: 'rgba(255, 255, 255, 0.01)',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '0.75rem'
                }}>
                  {t('dashboard.no_pinned')}
                </div>
              </div>
            )}

            {/* Recent Snippets */}
            {_recentSnippets.length > 0 && (
              <div>
                <div className="dashboard-section-header" style={{ marginBottom: '8px', paddingBottom: '6px' }}>
                  <h3 className="dashboard-section-title" style={{ fontSize: '0.85rem' }}>
                    <Clock size={14} style={{ color: 'var(--color-info)' }} />
                    {t('dashboard.recent_snippets')}
                  </h3>
                </div>
                <div className="snippets-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px' }}>
                  {_recentSnippets.map(snippet => renderSnippetCard(snippet))}
                </div>
              </div>
            )}

            {/* Quick Actions Panel (Horizontal 1x3) */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '12px 16px',
              marginTop: '12px'
            }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={14} style={{ color: 'var(--color-warning)' }} />
                <span>{t('dashboard.quick_actions')}</span>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '10px'
              }}>
                <button
                  onClick={handleOpenAdd}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    padding: '9px 12px', borderRadius: '8px',
                    background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)',
                    color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 500,
                    cursor: 'pointer', transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99, 102, 241, 0.08)'; e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.25)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                >
                  <Plus size={14} style={{ color: 'var(--color-primary)' }} />
                  <span>{t('dashboard.create_snippet')}</span>
                </button>
                <button
                  onClick={() => { setIsCategoryManageOpen(true); }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    padding: '9px 12px', borderRadius: '8px',
                    background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)',
                    color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 500,
                    cursor: 'pointer', transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.08)'; e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.25)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                >
                  <Settings size={14} style={{ color: 'var(--color-success)' }} />
                  <span>{t('dashboard.categories')}</span>
                </button>
                <button
                  onClick={() => setIsThemePanelOpen(true)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    padding: '9px 12px', borderRadius: '8px',
                    background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)',
                    color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 500,
                    cursor: 'pointer', transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(6, 180, 212, 0.08)'; e.currentTarget.style.borderColor = 'rgba(6, 180, 212, 0.25)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                >
                  <Palette size={14} style={{ color: 'var(--color-info)' }} />
                  <span>{t('dashboard.theme')}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Column 2: Side Panel (Categories, Tips and Quick Actions) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Categories list */}
            {_categoryStats.length > 0 && (
              <div>
                <div className="dashboard-section-header" style={{ marginBottom: '10px' }}>
                  <h3 className="dashboard-section-title" style={{ fontSize: '0.85rem' }}>
                    <LayoutGrid size={14} style={{ color: 'var(--color-primary)' }} />
                    {t('dashboard.your_categories')}
                  </h3>
                </div>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  maxHeight: '240px',
                  overflowY: 'auto',
                  paddingRight: '4px',
                  paddingTop: '4px'
                }}>
                  {_categoryStats.map(({ cat, total, pinned, folders }) => (
                    <div
                      key={cat}
                      className="dashboard-category-card"
                      onClick={() => { setActiveCategory(cat); setActiveFolder(null); setIsHomeView(false); }}
                      style={{
                        padding: '14px 18px',
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        margin: 0,
                        height: '52px',
                        boxSizing: 'border-box',
                        maxWidth: '240px',
                        width: '100%'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}>
                          {getCategoryIcon(cat, 18)}
                        </div>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{cat}</span>
                      </div>
                      <div className="dashboard-category-card-meta" style={{ margin: 0, gap: '6px' }}>
                        <span className="dashboard-category-badge" style={{ fontSize: '0.75rem', padding: '3px 6px' }}>
                          {total}
                        </span>
                        {pinned > 0 && (
                          <span className="dashboard-category-badge pinned" style={{ fontSize: '0.75rem', padding: '3px 6px' }}>
                            ★ {pinned}
                          </span>
                        )}
                        {folders > 0 && (
                          <span className="dashboard-category-badge folders" style={{ fontSize: '0.75rem', padding: '3px 6px' }}>
                            📁 {folders}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}



            {/* Tip of the day card */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.04) 0%, rgba(139, 92, 246, 0.01) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.12)',
              borderRadius: '12px',
              padding: '16px 20px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.9rem' }}>
                <Lightbulb size={16} />
                <span>{t('dashboard.tip_title')}</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                <Trans i18nKey="dashboard.tip_body" components={{ strong: <strong style={{ color: 'var(--text-primary)' }} /> }} />
              </p>
            </div>
          </div>
        </div>

        {/* Empty state */}
        {workspaceSnippets.length === 0 && (
          <div className="empty-state" style={{ padding: '60px 20px', textAlign: 'center' }}>
            <FileText className="empty-icon" style={{ marginBottom: '16px' }} />
            <p className="empty-title" style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>{t('dashboard.empty_title')}</p>
            <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto 24px' }}><Trans i18nKey="dashboard.empty_desc" components={{ strong: <strong /> }} /></p>
            <button
              onClick={handleOpenAdd}
              className="btn-primary"
              style={{ padding: '12px 24px', fontSize: '0.9rem' }}
            >
              <Plus size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              {t('dashboard.create_first_snippet')}
            </button>
          </div>
        )}
      </div>
    );
  };

  // Reusable snippet card renderer
  const renderSnippetCard = (snippet) => {
    const isSelected = !isHomeView && selectedSnippetIds.includes(snippet.id);
    const showAllCheckboxes = !isHomeView && selectedSnippetIds.length > 0;
    return (
      <div
        key={snippet.id}
        className={`snippet-card ${isSelected ? 'selected' : ''}`}
        draggable={!isHomeView}
        onDragStart={(e) => {
          if (isHomeView) return;
          handleSnippetDragStart(e, snippet.id);
        }}
        onDragEnd={() => setDraggedSnippetId(null)}
        onClick={(e) => {
          // If in category view and Shift is pressed OR bulk selection is already active
          if (!isHomeView && (e.shiftKey || selectedSnippetIds.length > 0)) {
            toggleSnippetSelection(snippet.id);
          } else {
            handleCopy(e, snippet.content, snippet.title);
          }
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const pos = adjustContextMenu(e, 3);
          setContextMenu({
            x: pos.x, y: pos.y,
            items: [
              { label: t('snippet.edit'), icon: 'Edit3', action: () => handleOpenEdit(e, snippet) },
              { label: snippet.pinned ? t('snippet.unpin') : t('snippet.pin'), icon: 'Pin', action: () => handleTogglePin(e, snippet.id) },
              { label: t('snippet.delete'), icon: 'Trash2', action: () => handleOpenDelete(e, snippet), danger: true },
            ]
          });
        }}
        style={{
          borderLeft: snippet.pinned ? '4px solid var(--color-warning)' : (isSelected ? '4px solid var(--color-primary)' : '4px solid var(--border-hover)'),
          borderTop: '1px solid var(--border)',
          borderRight: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
          opacity: draggedSnippetId === snippet.id ? 0.4 : 1,
          boxShadow: isSelected ? '0 0 0 1px var(--color-primary), var(--shadow-md)' : undefined
        }}
      >
        <div className="snippet-header">
          {!isHomeView && (
            <div 
              onClick={(e) => {
                e.stopPropagation();
                toggleSnippetSelection(snippet.id);
              }}
              style={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isSelected ? 'var(--color-primary)' : 'var(--text-muted)',
                opacity: isSelected ? 1 : (showAllCheckboxes ? 0.4 : undefined),
                transition: 'opacity 0.2s ease',
                flexShrink: 0,
                marginTop: '4px'
              }}
              className={!showAllCheckboxes && !isSelected ? "select-checkbox-hover-container" : ""}
title={isSelected ? t('common.deselect') : t('common.select')}
            >
              {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
            </div>
          )}

          <div className="snippet-title-container" style={{ marginLeft: isHomeView ? '0' : '8px' }}>
            <span className={`tag-badge tag-${snippet.color || 'indigo'}`}>
              {snippet.category}
            </span>
            <h4 className="snippet-title" title={snippet.title}>
              {snippet.title}
            </h4>
          </div>

          <div className="snippet-actions" onClick={e => e.stopPropagation()}>
            <button
              className="action-icon-btn"
              onClick={(e) => handleTogglePin(e, snippet.id)}
title={snippet.pinned ? t('snippet.unpin') : t('snippet.pin')}
              style={{ color: snippet.pinned ? 'var(--color-warning)' : 'var(--text-muted)' }}
            >
              <Pin size={14} style={{ fill: snippet.pinned ? 'var(--color-warning)' : 'none' }} />
            </button>
            <button
              className="action-icon-btn"
              onClick={(e) => handleOpenEdit(e, snippet)}
title={t('snippet.edit')}
            >
              <Edit3 size={14} />
            </button>
            <button
              className="action-icon-btn btn-delete"
              onClick={(e) => handleOpenDelete(e, snippet)}
title={t('snippet.delete')}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        <div className="code-editor-header" style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', backgroundColor: 'rgba(15, 23, 42, 0.9)', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', borderTopLeftRadius: '6px', borderTopRightRadius: '6px' }}>
          <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
          <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#eab308' }} />
          <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
          <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginLeft: '4px', fontFamily: 'var(--font-mono)', flexGrow: 1 }}>{(snippet.category || 'General').toLowerCase()}</span>
          {snippet.pinned && <Pin size={9} style={{ color: 'var(--color-warning)', fill: 'var(--color-warning)' }} />}
        </div>

        <div className="snippet-code-wrapper" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0, borderTop: 0 }}>
          <pre className="snippet-code">
            <code>{snippet.content}</code>
          </pre>
          <div className="copy-overlay">
            <Copy className="copy-overlay-icon" />
            <span className="copy-overlay-text">{t('snippet.click_to_copy')}</span>
          </div>
        </div>
      </div>
    );
  };

  // Reusable snippet row renderer
  const renderSnippetRow = (snippet) => {
    const isSelected = !isHomeView && selectedSnippetIds.includes(snippet.id);
    const showAllCheckboxes = !isHomeView && selectedSnippetIds.length > 0;
    return (
      <div
        key={snippet.id}
        className={`snippet-list-row ${isSelected ? 'selected' : ''}`}
        draggable={!isHomeView}
        onDragStart={(e) => {
          if (isHomeView) return;
          handleSnippetDragStart(e, snippet.id);
        }}
        onDragEnd={() => setDraggedSnippetId(null)}
        onClick={(e) => {
          if (!isHomeView && (e.shiftKey || selectedSnippetIds.length > 0)) {
            toggleSnippetSelection(snippet.id);
          } else {
            handleCopy(e, snippet.content, snippet.title);
          }
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const pos = adjustContextMenu(e, 3);
          setContextMenu({
            x: pos.x, y: pos.y,
            items: [
              { label: t('snippet.edit'), icon: 'Edit3', action: () => handleOpenEdit(e, snippet) },
              { label: snippet.pinned ? t('snippet.unpin') : t('snippet.pin'), icon: 'Pin', action: () => handleTogglePin(e, snippet.id) },
              { label: t('snippet.delete'), icon: 'Trash2', action: () => handleOpenDelete(e, snippet), danger: true },
            ]
          });
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.04)' : 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderLeft: snippet.pinned ? '4px solid var(--color-warning)' : (isSelected ? '4px solid var(--color-primary)' : '4px solid var(--border-hover)'),
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          position: 'relative',
          overflow: 'hidden',
          opacity: draggedSnippetId === snippet.id ? 0.4 : 1
        }}
        onMouseEnter={(e) => {
          if (draggedSnippetId === null) {
            e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)';
            e.currentTarget.style.transform = 'translateX(4px)';
          }
        }}
        onMouseLeave={(e) => {
          if (draggedSnippetId === null && !isSelected) {
            e.currentTarget.style.backgroundColor = 'var(--bg-card)';
            e.currentTarget.style.transform = 'translateX(0)';
          } else if (isSelected) {
            e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.04)';
            e.currentTarget.style.borderColor = 'var(--color-primary)';
            e.currentTarget.style.transform = 'translateX(0)';
          }
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexGrow: 1, minWidth: 0 }}>
          {!isHomeView && (
            <div 
              onClick={(e) => {
                e.stopPropagation();
                toggleSnippetSelection(snippet.id);
              }}
              style={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                color: isSelected ? 'var(--color-primary)' : 'var(--text-muted)',
                opacity: isSelected ? 1 : (showAllCheckboxes ? 0.4 : undefined),
                transition: 'opacity 0.2s ease',
                flexShrink: 0
              }}
              className={!showAllCheckboxes && !isSelected ? "select-checkbox-hover-container" : ""}
              title={isSelected ? t('common.deselect') : t('common.select')}
            >
              {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', width: '220px', flexShrink: 0, minWidth: 0 }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>
              {snippet.category}
            </span>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {snippet.title}
            </span>
          </div>

          <div
            className="code-preview-inline"
            style={{
              flexGrow: 1,
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              backgroundColor: 'rgba(15, 23, 42, 0.4)',
              padding: '6px 12px',
              borderRadius: '6px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              marginRight: '20px',
              border: '1px solid rgba(255, 255, 255, 0.02)'
            }}
          >
            {(snippet.content || '').replace(/\n/g, ' ↵ ')}
          </div>
        </div>

        <div className="list-row-actions" style={{ display: 'flex', alignItems: 'center', gap: '6px', zIndex: 5 }} onClick={e => e.stopPropagation()}>
          <button
            className="action-icon-btn"
            onClick={(e) => handleTogglePin(e, snippet.id)}
            title={snippet.pinned ? t('snippet.unpin') : t('snippet.pin')}
            style={{ color: snippet.pinned ? 'var(--color-warning)' : 'var(--text-muted)' }}
          >
            <Pin size={14} style={{ fill: snippet.pinned ? 'var(--color-warning)' : 'none' }} />
          </button>
          <button
            className="action-icon-btn"
            onClick={(e) => handleOpenEdit(e, snippet)}
            title={t('snippet.edit')}
          >
            <Edit3 size={14} />
          </button>
          <button
            className="action-icon-btn btn-delete"
            onClick={(e) => handleOpenDelete(e, snippet)}
            title={t('snippet.delete')}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* LOADING - shown while restoring session */}
      {initializing && isConfigured() ? (
        <div className="login-screen">
          <div className="login-card" style={{ padding: '40px', alignItems: 'center', gap: '20px' }}>
            <div className="login-icon">
              <Copy size={48} />
            </div>
            <div className="loading-spinner" />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t('auth.restoring_session')}</p>
          </div>
        </div>
      ) : !user && isConfigured() ? (
        <div className="login-screen">
          <div className="login-card">
            <div className="login-icon">
              <Copy size={48} />
            </div>
            <h1 className="login-title">{t('app.name')}</h1>
            <p className="login-subtitle">{t('auth.tagline')}</p>
            <button
              onClick={handleSignIn}
              className="login-google-btn"
              disabled={signingIn}
            >
              {signingIn ? (
                <>
                  <div className="loading-spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} />
                  <span>{t('auth.opening_google')}</span>
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span>{t('auth.sign_in_google')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
      <div className="app-container">

      {/* SYNC OVERLAY — shown during cloud sync after login */}
      {syncingFull && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(7, 10, 20, 0.88)',
          backdropFilter: 'blur(12px)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: '20px',
          animation: 'fadeIn 0.2s ease',
        }}>
          {/* Logo + spinner */}
          <div style={{ position: 'relative', width: '72px', height: '72px' }}>
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              border: '3px solid rgba(255,255,255,0.06)',
            }} />
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              border: '3px solid transparent',
              borderTopColor: 'var(--color-primary)',
              animation: 'spin 0.9s linear infinite',
            }} />
            <div style={{
              position: 'absolute', inset: '18px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--color-primary)',
            }}>
              <Copy size={22} />
            </div>
          </div>

          {/* Text */}
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '1rem', margin: 0 }}>
              {t('sync.syncing_data')}
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '6px 0 0' }}>
              {t('sync.loading_content')}
            </p>
          </div>

          {/* Animated dots */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: '7px', height: '7px', borderRadius: '50%',
                background: 'var(--color-primary)',
                animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                opacity: 0.7,
              }} />
            ))}
          </div>
        </div>
      )}

      {/* SIGN-OUT OVERLAY — shown while signing out */}
      {signingOut && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(7, 10, 20, 0.88)',
          backdropFilter: 'blur(12px)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: '20px',
          animation: 'fadeIn 0.2s ease',
        }}>
          {/* Icon + spinner */}
          <div style={{ position: 'relative', width: '72px', height: '72px' }}>
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              border: '3px solid rgba(255,255,255,0.06)',
            }} />
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              border: '3px solid transparent',
              borderTopColor: 'var(--color-danger)',
              animation: 'spin 0.9s linear infinite',
            }} />
            <div style={{
              position: 'absolute', inset: '18px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--color-danger)',
            }}>
              <LogOut size={22} />
            </div>
          </div>

          {/* Text */}
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '1rem', margin: 0 }}>
              {t('signout.signing_out')}
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '6px 0 0' }}>
              {t('signout.saving_changes')}
            </p>
          </div>

          {/* Animated dots */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: '7px', height: '7px', borderRadius: '50%',
                background: 'var(--color-danger)',
                animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                opacity: 0.7,
              }} />
            ))}
          </div>
        </div>
      )}

      {/* 1. SIDEBAR */}
      <aside className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="logo-container" style={{ display: 'flex', alignItems: 'center', justifyContent: isSidebarCollapsed ? 'center' : 'space-between', width: '100%' }}>
          {!isSidebarCollapsed ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Copy className="logo-icon" />
                <span className="logo-text">{t('app.name')}</span>
              </div>
              <button 
                onClick={() => setIsSidebarCollapsed(true)} 
                className="top-toggle-btn"
                title={t('sidebar.collapse')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
              >
                <ChevronLeft size={16} />
              </button>
            </>
          ) : (
            <button 
              onClick={() => setIsSidebarCollapsed(false)} 
              className="top-toggle-btn"
              title={t('sidebar.expand')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <ChevronRight size={18} />
            </button>
          )}
        </div>

        {/* Workspace Selector */}
        <div className="workspace-selector-container" style={{ marginBottom: '20px', position: 'relative', width: '100%', padding: isSidebarCollapsed ? '0' : '0 8px' }}>
          {!isSidebarCollapsed ? (
            <>
              <div 
                className="workspace-trigger"
                onClick={() => setIsWorkspaceDropdownOpen(!isWorkspaceDropdownOpen)}
                title={t('sidebar.current_workspace', { name: currentWorkspace })}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                  <Layers size={14} style={{ color: getWorkspaceColorValue(currentWorkspace) }} />
                  <span>{currentWorkspace}</span>
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>▼</span>
              </div>

              {isWorkspaceDropdownOpen && (
                <>
                  <div 
                    style={{ position: 'fixed', inset: 0, zIndex: 998 }} 
                    onClick={() => setIsWorkspaceDropdownOpen(false)}
                  />
                  <div 
                    className="workspace-dropdown-menu"
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 4px)',
                      left: '8px',
                      right: '8px',
                      backgroundColor: '#0f172a',
                      border: '1px solid var(--border-hover)',
                      borderRadius: '8px',
                      boxShadow: 'var(--shadow-lg)',
                      zIndex: 999,
                      padding: '4px',
                      maxHeight: '220px',
                      overflowY: 'auto',
                      animation: 'fadeIn 0.15s ease-out'
                    }}
                  >
                    {workspaces.map(w => (
                      <div
                        key={w}
                        className="workspace-item"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          color: getWorkspaceColorValue(w),
                          backgroundColor: currentWorkspace === w ? `${getWorkspaceColorValue(w)}1a` : `${getWorkspaceColorValue(w)}08`,
                          border: currentWorkspace === w ? `1px solid ${getWorkspaceColorValue(w)}40` : `1px solid ${getWorkspaceColorValue(w)}15`,
                          transition: 'all 0.15s ease',
                          marginBottom: '2px'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.backgroundColor = `${getWorkspaceColorValue(w)}22`;
                          e.currentTarget.style.borderColor = `${getWorkspaceColorValue(w)}50`;
                        }}
                        onMouseLeave={e => {
                          if (currentWorkspace !== w) {
                            e.currentTarget.style.backgroundColor = `${getWorkspaceColorValue(w)}08`;
                            e.currentTarget.style.borderColor = `${getWorkspaceColorValue(w)}15`;
                          } else {
                            e.currentTarget.style.backgroundColor = `${getWorkspaceColorValue(w)}1a`;
                            e.currentTarget.style.borderColor = `${getWorkspaceColorValue(w)}40`;
                          }
                        }}
                        onClick={() => {
                          setCurrentWorkspace(w);
                          setIsWorkspaceDropdownOpen(false);
                          setActiveCategory('General');
                          setActiveFolder(null);
                          setIsHomeView(true);
                          const targetTheme = workspaceThemes[w] || 'indigo';
                          setTheme(targetTheme);
                          saveSnippetsData(snippets, workspaces, w);
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Briefcase size={14} style={{ color: getWorkspaceColorValue(w) }} />
                          <span style={{ fontWeight: currentWorkspace === w ? 600 : 400, color: getWorkspaceColorValue(w) }}>{w}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={e => e.stopPropagation()}>
                          <button
                            title={t('sidebar.customize_workspace')}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditWorkspace(w);
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-muted)',
                              opacity: 0.5,
                              cursor: 'pointer',
                              padding: '2px',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                            onMouseEnter={e => e.currentTarget.style.opacity = 1}
                            onMouseLeave={e => e.currentTarget.style.opacity = 0.5}
                          >
                            <Edit3 size={12} />
                          </button>
                          {workspaces.length > 1 && (
                            <button
                              title={t('sidebar.delete_workspace')}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteWorkspace(w);
                              }}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--color-danger)',
                                opacity: 0.5,
                                cursor: 'pointer',
                                padding: '2px',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                              onMouseEnter={e => e.currentTarget.style.opacity = 1}
                              onMouseLeave={e => e.currentTarget.style.opacity = 0.5}
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '4px 0' }} />
                    <div
                      className="workspace-item"
                      style={{
                        padding: '8px 10px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        color: 'var(--color-primary)',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.06)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      onClick={() => {
                        setIsWorkspaceDropdownOpen(false);
                        setIsAddWorkspaceModalOpen(true);
                      }}
                    >
                      <Plus size={14} />
                      <span>{t('sidebar.create_workspace')}</span>
                    </div>
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              <div 
                className="workspace-trigger compact"
                onClick={() => setIsWorkspaceDropdownOpen(!isWorkspaceDropdownOpen)}
                title={t('sidebar.current_workspace', { name: currentWorkspace })}
                style={{
                  borderColor: getWorkspaceColorValue(currentWorkspace) + '50',
                  backgroundColor: getWorkspaceColorValue(currentWorkspace) + '0d',
                  color: getWorkspaceColorValue(currentWorkspace)
                }}
              >
                <Layers size={16} style={{ color: getWorkspaceColorValue(currentWorkspace) }} />
              </div>
              {isWorkspaceDropdownOpen && (
                <>
                  <div 
                    style={{ position: 'fixed', inset: 0, zIndex: 998 }} 
                    onClick={() => setIsWorkspaceDropdownOpen(false)}
                  />
                  <div 
                    className="workspace-dropdown-menu"
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 4px)',
                      left: '10px',
                      width: '170px',
                      backgroundColor: '#0f172a',
                      border: '1px solid var(--border-hover)',
                      borderRadius: '8px',
                      boxShadow: 'var(--shadow-lg)',
                      zIndex: 999,
                      padding: '4px',
                      maxHeight: '220px',
                      overflowY: 'auto',
                      animation: 'fadeIn 0.15s ease-out'
                    }}
                  >
                    {workspaces.map(w => (
                      <div
                        key={w}
                        className="workspace-item"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          color: getWorkspaceColorValue(w),
                          backgroundColor: currentWorkspace === w ? `${getWorkspaceColorValue(w)}1a` : `${getWorkspaceColorValue(w)}08`,
                          border: currentWorkspace === w ? `1px solid ${getWorkspaceColorValue(w)}40` : `1px solid ${getWorkspaceColorValue(w)}15`,
                          transition: 'all 0.15s ease',
                          marginBottom: '2px'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.backgroundColor = `${getWorkspaceColorValue(w)}22`;
                          e.currentTarget.style.borderColor = `${getWorkspaceColorValue(w)}50`;
                        }}
                        onMouseLeave={e => {
                          if (currentWorkspace !== w) {
                            e.currentTarget.style.backgroundColor = `${getWorkspaceColorValue(w)}08`;
                            e.currentTarget.style.borderColor = `${getWorkspaceColorValue(w)}15`;
                          } else {
                            e.currentTarget.style.backgroundColor = `${getWorkspaceColorValue(w)}1a`;
                            e.currentTarget.style.borderColor = `${getWorkspaceColorValue(w)}40`;
                          }
                        }}
                        onClick={() => {
                          setCurrentWorkspace(w);
                          setIsWorkspaceDropdownOpen(false);
                          setActiveCategory('General');
                          setActiveFolder(null);
                          setIsHomeView(true);
                          const targetTheme = workspaceThemes[w] || 'indigo';
                          setTheme(targetTheme);
                          saveSnippetsData(snippets, workspaces, w);
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Briefcase size={14} style={{ color: getWorkspaceColorValue(w) }} />
                          <span style={{ fontWeight: currentWorkspace === w ? 600 : 400, color: getWorkspaceColorValue(w) }}>{w}</span>
                        </div>
                      </div>
                    ))}
                    <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '4px 0' }} />
                    <div
                      className="workspace-item"
                      style={{
                        padding: '8px 10px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        color: 'var(--color-primary)',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.06)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      onClick={() => {
                        setIsWorkspaceDropdownOpen(false);
                        setIsAddWorkspaceModalOpen(true);
                      }}
                    >
                      <Plus size={14} />
                      <span>{t('sidebar.create')}</span>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Note: "+ Nuevo Snippet" has been moved to the header bar for a cleaner layout */}

        {/* Home menu item */}
        <div
          className={`category-item ${isHomeView ? 'active' : ''}`}
          onClick={() => { setIsHomeView(true); setActiveFolder(null); }}
          title={isSidebarCollapsed ? t('sidebar.home') : undefined}
        >
          <div className="category-info">
            <Home size={16} />
            {!isSidebarCollapsed && <span>{t('sidebar.home')}</span>}
          </div>
        </div>

        <div className="category-section">
          {!isSidebarCollapsed && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: '4px' }}>
              <h3 className="category-title" style={{ marginBottom: 0 }}>{t('sidebar.categories')}</h3>
              <div style={{ display: 'flex', gap: '2px' }}>
                <button
                  className="action-icon-btn"
                  onClick={() => { setIsCategoryManageOpen(true); }}
                  title={t('sidebar.manage_categories')}
                  style={{ width: '24px', height: '24px', padding: 0 }}
                >
                  <Settings size={12} />
                </button>
              </div>
            </div>
          )}
          {allCategories.map(cat => {
            // Count snippets in this category for this workspace
            const count = workspaceSnippets.filter(s => s.category === cat).length;

            // Skip categories with 0 snippets unless explicitly created by user
            if (count === 0 && !orderedCategories.includes(cat)) return null;

            return (
              <div key={cat}>
<div 
                  className={`category-item ${!isHomeView && activeCategory === cat ? 'active' : ''}`}
                  onClick={() => { setActiveCategory(cat); setActiveFolder(null); setIsHomeView(false); }}
                  title={isSidebarCollapsed ? `${cat} (${count})` : undefined}
                >
                  <div className="category-info">
                    {getCategoryIcon(cat)}
                    <span>{cat}</span>
                  </div>
                  {!isSidebarCollapsed && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span className="category-count">{count}</span>
                      <span
                        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'transform 0.15s', transform: expandedCategories.has(cat) ? 'rotate(0deg)' : 'rotate(-90deg)' }}
                        onClick={(e) => { e.stopPropagation(); toggleCategoryExpand(cat); }}
                      >
                        <ChevronDown size={14} />
                      </span>
                    </div>
                  )}
                </div>
                {/* Sub-folders (nested tree) */}
                {!isSidebarCollapsed && expandedCategories.has(cat) && (
                  <div className="folder-list">
                    {renderFolderTree(cat, null)}
                    <div
                      className="folder-item add-folder"
                      onClick={() => { setActiveCategory(cat); setIsAddFolderModalOpen(true); setNewFolderName(''); }}
                    >
                      <div className="folder-info">
                        <Plus size={12} className="folder-icon" />
                        <span style={{ fontSize: '0.75rem' }}>{t('sidebar.new_folder')}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Collapsed Sidebar Footer - About */}
        {isSidebarCollapsed && (
          <div ref={aboutRef} style={{ marginTop: 'auto', padding: '8px', display: 'flex', justifyContent: 'center', position: 'relative' }}>
            <button
              onClick={() => setShowAbout(!showAbout)}
              title={t('sidebar.about')}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', transition: 'all 0.15s ease' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <Info size={16} />
            </button>
            {showAbout && (
              <div style={{ position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)', background: '#1e293b', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px 18px', minWidth: '200px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', zIndex: 100, textAlign: 'center', lineHeight: '1.8', fontSize: '0.78rem' }}>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{t('app.version', { version: pkg.version })}</div>
                <div style={{ color: 'var(--text-secondary)' }}>{t('app.author')}</div>
                <div><a href="mailto:cmtdevsolutions@gestricon.com" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>cmtdevsolutions@gestricon.com</a></div>
              </div>
            )}
          </div>
        )}

        {/* Sidebar Footer - About */}
        {!isSidebarCollapsed && (
          <div ref={aboutRef} style={{ marginTop: 'auto', padding: '8px 12px 4px', borderTop: '1px solid var(--border)', textAlign: 'center', position: 'relative' }}>
            <button
              onClick={() => setShowAbout(!showAbout)}
              title={t('sidebar.about')}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', transition: 'all 0.15s ease' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <Info size={12} />
              <span>{t('sidebar.about')}</span>
            </button>
            {showAbout && (
              <div style={{ position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)', background: '#1e293b', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px 18px', minWidth: '200px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', zIndex: 100, textAlign: 'center', lineHeight: '1.8', fontSize: '0.78rem' }}>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{t('app.version', { version: pkg.version })}</div>
                <div style={{ color: 'var(--text-secondary)' }}>{t('app.author')}</div>
                <div><a href="mailto:cmtdevsolutions@gestricon.com" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>cmtdevsolutions@gestricon.com</a></div>
              </div>
            )}
          </div>
        )}
      </aside>

      {/* 2. MAIN CONTENT */}
      <main className="main-content">
        
        {/* Header / Search bar */}
        <header className="header-bar">
          <div className="search-container">
            <Search className="search-icon" />
            <input 
              type="text" 
              className="search-input" 
              placeholder={t('header.search_placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="header-actions">
            <span className="stat-label">
              {t('header.showing_snippets', { count: filteredSnippets.length, total: snippets.length })}
            </span>
            <button 
              type="button"
              className="action-icon-btn"
              onClick={() => setIsThemePanelOpen(true)}
              title={t('header.customization')}
              style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px', backgroundColor: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Palette size={16} />
            </button>
            <button 
              type="button"
              className="action-icon-btn"
              onClick={() => { setTourStep(0); setIsShortcutModalOpen(true); }}
              title={t('header.show_tour')}
              style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px', backgroundColor: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Keyboard size={16} />
            </button>
            <button 
              type="button"
              className="action-icon-btn"
              onClick={() => setIsSuggestionModalOpen(true)}
              title={t('header.suggestions')}
              style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px', backgroundColor: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <MessageSquare size={16} />
            </button>
            <div className="view-toggle-container" style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden', backgroundColor: 'var(--bg-sidebar)' }}>
              <button 
                type="button"
                className={`action-icon-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title={t('header.grid_view')}
                style={{ padding: '8px', border: 'none', borderRadius: 0, backgroundColor: viewMode === 'grid' ? 'var(--color-primary)' : 'transparent', color: viewMode === 'grid' ? 'white' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <LayoutGrid size={16} />
              </button>
              <button 
                type="button"
                className={`action-icon-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title={t('header.list_view')}
                style={{ padding: '8px', border: 'none', borderRadius: 0, backgroundColor: viewMode === 'list' ? 'var(--color-primary)' : 'transparent', color: viewMode === 'list' ? 'white' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <List size={16} />
              </button>
            </div>

            {/* Cloud Status Badge */}
            {user && cloudEnabled && (
              <div
                title={syncing ? t('header.syncing_cloud') : t('header.synced_cloud')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: '20px',
                  backgroundColor: syncing ? 'rgba(99, 102, 241, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                  border: syncing ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                  color: syncing ? 'var(--color-primary)' : 'var(--color-success)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                }}
              >
                {syncing ? (
                  <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <Cloud size={13} />
                )}
                <span className="cloud-badge-text">{syncing ? t('header.syncing_badge') : t('header.cloud_badge')}</span>
              </div>
            )}

            {/* Profile Menu */}
            {user && isConfigured() && (
              <div className="profile-menu" ref={profileRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="profile-trigger"
                  title={user.email || ''}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '36px', height: '36px',
                    border: '2px solid var(--border)',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-primary)',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  {user.user_metadata?.avatar_url ? (
                    <img src={user.user_metadata.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <UserIcon size={16} color="white" />
                  )}
                </button>

                {profileMenuOpen && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 998 }} onClick={() => setProfileMenuOpen(false)} />
                    <div style={{
                      position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                      backgroundColor: '#0f172a', border: '1px solid var(--border-hover)',
                      borderRadius: '12px', boxShadow: 'var(--shadow-lg)',
                      zIndex: 999, padding: '4px', minWidth: '220px',
                      animation: 'fadeIn 0.15s ease-out',
                    }}>
                      <div style={{
                        padding: '16px', borderBottom: '1px solid var(--border)',
                        marginBottom: '4px',
                      }}>
                        <div style={{
                          width: '48px', height: '48px', borderRadius: '50%',
                          backgroundColor: 'var(--color-primary)',
                          overflow: 'hidden', marginBottom: '12px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {user.user_metadata?.avatar_url ? (
                            <img src={user.user_metadata.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <UserIcon size={20} color="white" />
                          )}
                        </div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                          {user.user_metadata?.full_name || user.user_metadata?.name || 'Usuario'}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', wordBreak: 'break-all' }}>
                          {user.email || ''}
                        </div>
                      </div>
                      <div
                        onClick={handleManualCheckUpdate}
                        style={{
                          padding: '10px 16px', borderRadius: '8px',
                          cursor: 'pointer', fontSize: '0.85rem',
                          color: 'var(--text-primary)', fontWeight: 500,
                          display: 'flex', alignItems: 'center', gap: '10px',
                          transition: 'all 0.15s ease',
                          marginBottom: '2px'
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <RefreshCw size={14} style={{ color: 'var(--color-primary)' }} />
                        <span>{t('header.check_updates')}</span>
                      </div>
                      {window.electronAPI && (
                        <div
                          onClick={handleToggleAutoStart}
                          style={{
                            padding: '10px 16px', borderRadius: '8px',
                            cursor: 'pointer', fontSize: '0.85rem',
                            color: 'var(--text-primary)', fontWeight: 500,
                            display: 'flex', alignItems: 'center', gap: '10px',
                            transition: 'all 0.15s ease',
                            marginBottom: '2px'
                          }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <Power size={14} style={{ color: 'var(--text-muted)' }} />
                          <span style={{ flex: 1 }}>{t('header.auto_start')}</span>
                          <div style={{
                            width: '36px', height: '20px',
                            borderRadius: '10px',
                            backgroundColor: autoStartEnabled ? 'var(--color-primary)' : '#334155',
                            position: 'relative',
                            transition: 'all 0.2s ease',
                            flexShrink: 0,
                          }}>
                            <div style={{
                              width: '16px', height: '16px',
                              borderRadius: '50%',
                              backgroundColor: 'white',
                              position: 'absolute',
                              top: '2px',
                              left: autoStartEnabled ? '18px' : '2px',
                              transition: 'all 0.2s ease',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                            }} />
                          </div>
                        </div>
                      )}
                      <div
                        onClick={() => { setProfileMenuOpen(false); handleSignOut(); }}
                        style={{
                          padding: '12px 16px', borderRadius: '8px',
                          cursor: 'pointer', fontSize: '0.85rem',
                          color: 'var(--color-danger)', fontWeight: 500,
                          display: 'flex', alignItems: 'center', gap: '10px',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <LogOut size={16} />
                        <span>{t('header.sign_out')}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Folder breadcrumb + action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px 32px 4px' }}>
          {isHomeView && activeFolder !== null && activeFolder !== '' ? (
            // Home view with folder navigation
            (() => {
              const segments = activeFolder.split('/');
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', flex: 1 }}>
                  <span
                    onClick={() => setActiveFolder(null)}
                    onDragOver={(e) => { e.preventDefault(); setDragOverFolder('__root__'); }}
                    onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOverFolder(null); }}
                    onDrop={(e) => handleDropOnRoot(e)}
                    style={{
                      cursor: 'pointer', color: 'var(--text-secondary)', fontWeight: 500,
                      padding: '4px 8px', borderRadius: '6px',
                      display: 'flex', alignItems: 'center', gap: '6px',
                      background: dragOverFolder === '__root__' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <Home size={14} style={{ opacity: 0.8 }} />
                    {t('breadcrumb.home')}
                  </span>
                  {segments.map((seg, i) => (
                    <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ opacity: 0.5 }}>/</span>
                      <span
                        draggable={i === segments.length - 1}
                        onDragStart={(e) => {
                          if (i === segments.length - 1) {
                            e.dataTransfer.setData('text/plain', 'folder:' + segments.slice(0, i + 1).join('/'));
                            setIsFolderDragged(true);
                          }
                        }}
                        onDragEnd={() => { if (i === segments.length - 1) { setDraggedSnippetId(null); setIsFolderDragged(false); } }}
                        onDragOver={(e) => { if (i !== segments.length - 1) { e.preventDefault(); setDragOverFolder(segments.slice(0, i + 1).join('/')); } }}
                        onDragLeave={(e) => { if (i !== segments.length - 1 && !e.currentTarget.contains(e.relatedTarget)) setDragOverFolder(null); }}
                        onDrop={(e) => { if (i !== segments.length - 1) handleDropOnFolder(e, segments.slice(0, i + 1).join('/')); }}
                        style={{
                          color: i === segments.length - 1 ? 'var(--color-primary)' : 'var(--text-secondary)',
                          fontWeight: i === segments.length - 1 ? 600 : 400,
                          cursor: i === segments.length - 1 ? 'grab' : 'pointer',
                          whiteSpace: 'nowrap',
                          padding: '2px 6px', borderRadius: '6px',
                          background: dragOverFolder === segments.slice(0, i + 1).join('/') ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                          transition: 'background 0.15s ease',
                        }}
                        onClick={() => { if (i !== segments.length - 1) setActiveFolder(segments.slice(0, i + 1).join('/')); }}
                      >
                        <FolderIcon size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                        {seg}
                      </span>
                    </span>
                  ))}
                </div>
              );
            })()
          ) : isHomeView ? (
            // Home view root (beautiful title block)
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                color: 'var(--color-primary)',
                boxShadow: '0 0 10px rgba(99, 102, 241, 0.1)'
              }}>
                <Home size={16} />
              </div>
              <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{t('breadcrumb.home')}</span>
            </div>
          ) : activeFolder !== null && activeFolder !== '' ? (() => {
            const segments = activeFolder.split('/');
            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', flex: 1 }}>
                <span
                  onClick={() => setActiveFolder(null)}
                  onDragOver={(e) => { e.preventDefault(); setDragOverFolder('__root__'); }}
                  onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOverFolder(null); }}
                  onDrop={(e) => handleDropOnRoot(e)}
                  style={{
                    cursor: 'pointer', color: 'var(--text-secondary)', fontWeight: 500,
                    padding: '4px 8px', borderRadius: '6px',
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: dragOverFolder === '__root__' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                    transition: 'background 0.15s ease'
                  }}
                >
                  {getCategoryIcon(activeCategory, 14)}
                  {activeCategory}
                </span>
                {(() => {
                  const maxVisible = 3;
                  const visibleSegments = segments.length > maxVisible
                    ? [{ index: -1, seg: '...', path: null }, ...segments.slice(-(maxVisible - 1)).map((seg, i) => ({ index: segments.length - (maxVisible - 1) + i, seg, path: segments.slice(0, segments.length - (maxVisible - 1) + i + 1).join('/') }))]
                    : segments.map((seg, i) => ({ index: i, seg, path: segments.slice(0, i + 1).join('/') }));
                  return visibleSegments.map(({ index, seg, path }) => (
                    <span key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ opacity: 0.5 }}>/</span>
                      {seg === '...' ? (
                        <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>...</span>
                      ) : (
                        <span
                          draggable={index === segments.length - 1}
                          onDragStart={(e) => {
                            if (index === segments.length - 1) {
                              e.dataTransfer.setData('text/plain', 'folder:' + path);
                              setIsFolderDragged(true);
                            }
                          }}
                          onDragEnd={() => { if (index === segments.length - 1) { setDraggedSnippetId(null); setIsFolderDragged(false); } }}
                          onDragOver={(e) => { if (index !== segments.length - 1) { e.preventDefault(); setDragOverFolder(path); } }}
                          onDragLeave={(e) => { if (index !== segments.length - 1 && !e.currentTarget.contains(e.relatedTarget)) setDragOverFolder(null); }}
                          onDrop={(e) => { if (index !== segments.length - 1) handleDropOnFolder(e, path); }}
                          style={{
                            color: index === segments.length - 1 ? 'var(--color-primary)' : 'var(--text-secondary)',
                            fontWeight: index === segments.length - 1 ? 600 : 400,
                            cursor: index === segments.length - 1 ? 'grab' : 'pointer',
                            whiteSpace: 'nowrap',
                            padding: '2px 6px', borderRadius: '6px',
                            background: dragOverFolder === path ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                            transition: 'background 0.15s ease',
                          }}
                          onClick={() => { if (index !== segments.length - 1) setActiveFolder(path); }}
                        >
                          <FolderIcon size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                          {seg}
                        </span>
                      )}
                    </span>
                  ));
                })()}
                <button
                  onClick={() => openFolderSettings(activeFolder)}
                  title={t('folder_modal.manage_title')}
                  style={{
                    background: 'none', border: 'none',
                    color: 'var(--text-muted)', cursor: 'pointer', padding: '4px',
                    borderRadius: '6px', display: 'flex', alignItems: 'center'
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  <Settings size={16} />
                </button>
              </div>
            );
          })() : (
            // Category root view (beautiful title block)
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)'
              }}>
                {getCategoryIcon(activeCategory, 16)}
              </div>
              <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{activeCategory}</span>
            </div>
          )}
          {!isHomeView && (
            <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
            <button 
              className="btn-icon-add" 
              onClick={handleOpenAdd}
              title={t('snippet_modal.add_title')}
            >
              <Plus size={18} />
            </button>
            <button 
              className="btn-icon-add" 
              onClick={() => { setIsAddFolderModalOpen(true); setNewFolderName(''); }}
              title={t('add_folder_modal.title')}
            >
              <FolderIcon size={16} />
            </button>
          </div>
          )}
        </div>

        <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '12px 32px 0' }} />

        {/* Snippets Area */}
        <section className={`snippets-container ${!isHomeView ? 'scrollable-snippets-only' : ''}`}>
          {isHomeView && activeFolder === null ? (
            renderHomeDashboard()
          ) : (currentSnippets.length === 0 && childFolders.length === 0) ? (
            <div className="empty-state">
              <FileText className="empty-icon" />
              <p className="empty-title">{t('content.no_snippets_found')}</p>
              <p>{t('content.try_changing_search')}</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="snippets-grid" style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', height: '100%', overflow: 'hidden' }}>
              <>
                {/* Subfolder cards first */}
                {childFolders.length > 0 && (
                  <div className="folders-grid-container" style={{ flexShrink: 0 }}>
                    {childFolders.map(folder => (
                      <div
                        key={folder}
                        className={`folder-card ${dragOverFolder === folder ? 'drag-over' : ''}`}
                        onClick={() => setActiveFolder(folder)}
title={t('content.view_folder', { name: getFolderName(folder), count: getFolderSnippetCount(folder) })}
                          draggable
                        onDragStart={(e) => handleFolderDragStart(e, folder)}
                        onDragEnd={() => { setDraggedSnippetId(null); setIsFolderDragged(false); }}
                        onDragOver={(e) => { e.preventDefault(); setDragOverFolder(folder); }}
                        onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOverFolder(null); }}
                        onDrop={(e) => handleDropOnFolder(e, folder)}
                      >
                        <FolderIcon size={18} className="folder-card-icon" />
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '1px', overflow: 'hidden' }}>
                          <span className="folder-card-name" style={{ textAlign: 'left', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', width: '100%', margin: 0 }}>{getFolderName(folder)}</span>
                          <span className="folder-card-count" style={{ margin: 0 }}>{t('content.count_snippets', { count: getFolderSnippetCount(folder) })}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {/* Current level snippets below, with separator if there are subfolders */}
                {currentSnippets.length > 0 && (
                  <div className="folder-group-grid" style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden', minHeight: 0 }}>
                    <div className="folder-separator" style={{ flexShrink: 0 }}>
                      {currentLevel ? (
                        <span>{t('content.snippets_in', { name: getFolderName(currentLevel) })}</span>
                      ) : (
                        <span>{t('common.no_folder_label')}</span>
                      )}
                      <span className="category-count">{currentSnippets.length}</span>
                    </div>
                    <div style={{ flexGrow: 1, overflowY: 'auto', paddingTop: '8px', paddingRight: '4px', paddingBottom: '16px' }}>
                      <div className="folder-group-snippets">
                        {currentSnippets.map(snippet => renderSnippetCard(snippet))}
                      </div>
                    </div>
                  </div>
                )}
                {currentSnippets.length === 0 && childFolders.length === 0 && (
                  <div className="empty-state" style={{ flexGrow: 1 }}>
                    <FileText className="empty-icon" />
                    <p className="empty-title">{t('content.no_snippets_found')}</p>
                    <p>{t('content.try_changing_search')}</p>
                  </div>
                )}
              </>
            </div>
          ) : (
            <div className="snippets-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px', height: '100%', overflow: 'hidden' }}>
                <>
                  {/* Folder rows first */}
                  {childFolders.length > 0 && (
                    <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {childFolders.map(folder => (
                        <div
                          key={folder}
                          className={`folder-row ${dragOverFolder === folder ? 'drag-over' : ''}`}
                          onClick={() => setActiveFolder(folder)}
title={t('content.view_folder', { name: getFolderName(folder), count: getFolderSnippetCount(folder) })}
                          draggable
                          onDragStart={(e) => handleFolderDragStart(e, folder)}
                          onDragEnd={() => { setDraggedSnippetId(null); setIsFolderDragged(false); }}
                          onDragOver={(e) => { e.preventDefault(); setDragOverFolder(folder); }}
                          onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOverFolder(null); }}
                          onDrop={(e) => handleDropOnFolder(e, folder)}
                        >
                          <FolderIcon size={20} />
                          <span className="folder-row-name">{getFolderName(folder)}</span>
                          <span className="folder-row-count">{getFolderSnippetCount(folder)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Current level snippets below, with separator */}
                  {currentSnippets.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden', minHeight: 0 }}>
                      <div className="folder-separator" style={{ padding: '12px 16px 4px', flexShrink: 0 }}>
                        {currentLevel ? (
                          <span>{t('content.snippets_in', { name: getFolderName(currentLevel) })}</span>
                        ) : (
                          <span>{t('common.no_folder_label')}</span>
                        )}
                        <span className="category-count">{currentSnippets.length}</span>
                      </div>
                      <div style={{ flexGrow: 1, overflowY: 'auto', paddingBottom: '16px' }}>
                        {currentSnippets.map(snippet => renderSnippetRow(snippet))}
                      </div>
                    </div>
                  )}
                </>
              </div>
            )}
          </section>
      </main>

      {/* 3. MODAL DE AGREGAR / EDITAR */}
      {isFormModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsFormModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingSnippet ? t('snippet_modal.edit_title') : t('snippet_modal.add_title')}
              </h3>
              <button className="action-icon-btn" onClick={() => setIsFormModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSaveSnippet}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">{t('snippet_modal.title_label')}</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required 
                    placeholder={t('snippet_modal.title_placeholder')}
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('snippet_modal.category_label')}</label>
                  <div className="custom-dropdown" style={{ position: 'relative', width: '100%' }}>
                    <div 
                      className="form-input dropdown-trigger" 
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        backgroundColor: 'var(--bg-input)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        fontSize: '0.9rem',
                        color: 'var(--text-primary)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {getCategoryIcon(selectedCategoryOption)}
                        <span>
                          {selectedCategoryOption || t('snippet_modal.category_placeholder')}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', transition: 'transform 0.2s', transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                    </div>

                    {isDropdownOpen && (
                      <>
                        <div 
                          style={{ position: 'fixed', inset: 0, zIndex: 998 }} 
                          onClick={() => setIsDropdownOpen(false)}
                        />
                        <div 
                          className="dropdown-menu-list"
                          style={{
                            position: 'absolute',
                            top: 'calc(100% + 4px)',
                            left: 0,
                            right: 0,
                            backgroundColor: '#0f172a',
                            border: '1px solid var(--border-hover)',
                            borderRadius: '8px',
                            boxShadow: 'var(--shadow-lg)',
                            maxHeight: '200px',
                            overflowY: 'auto',
                            zIndex: 999,
                            padding: '4px',
                            animation: 'fadeIn 0.15s ease-out'
                          }}
                        >
                          {allCategories.map(cat => (
                            <div
                              key={cat}
                              onClick={() => {
                                setSelectedCategoryOption(cat);
                                setFormCategory(cat);
                                setIsDropdownOpen(false);
                              }}
                              style={{
                                padding: '10px 12px',
                                borderRadius: '6px',
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                color: selectedCategoryOption === cat ? 'var(--text-primary)' : 'var(--text-secondary)',
                                backgroundColor: selectedCategoryOption === cat ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontWeight: selectedCategoryOption === cat ? 600 : 400,
                                transition: 'all 0.15s ease',
                                marginBottom: '2px'
                              }}
                              onMouseEnter={(e) => {
                                if (selectedCategoryOption !== cat) {
                                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                                  e.currentTarget.style.color = 'var(--text-primary)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (selectedCategoryOption !== cat) {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                  e.currentTarget.style.color = 'var(--text-secondary)';
                                }
                              }}
                            >
                              {getCategoryIcon(cat)}
                              <span>{cat}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                </div>

                <div className="form-group">
                  <label className="form-label">{t('snippet_modal.content_label')}</label>
                  <textarea 
                    className="form-input form-textarea" 
                    required
                    placeholder={t('snippet_modal.content_placeholder')}
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('snippet_modal.color_label')}</label>
                  <div className="color-picker-grid">
                    {['indigo', 'emerald', 'violet', 'amber', 'rose'].map(color => (
                      <div 
                        key={color}
                        className={`color-option color-${color} ${formColor === color ? 'selected' : ''}`}
                        onClick={() => setFormColor(color)}
                      />
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">{t('snippet_modal.folder_label')}</label>
                  <select
                    className="form-input"
                    value={formFolder}
                    onChange={(e) => setFormFolder(e.target.value)}
                    style={{ padding: '10px 12px', cursor: 'pointer' }}
                  >
                    <option value="">{t('common.no_folder')}</option>
                    {getFoldersForCategory(formCategory || 'General').map(f => (
                      <option key={f} value={f}>
                        {'  '.repeat((f.match(/\//g) || []).length)}{getFolderName(f)}
                      </option>
                    ))}
                    {getFoldersForCategory(formCategory || 'General').length === 0 && (
                      <option value="" disabled>{t('common.use_category_for_folders')}</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsFormModalOpen(false)}>
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn-add" style={{ marginBottom: 0 }}>
                  {t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. MODAL DE CONFIRMACIÓN DE ELIMINAR */}
      {isDeleteModalOpen && snippetToDelete && (
        <div className="modal-backdrop" onClick={() => setIsDeleteModalOpen(false)}>
          <div className="modal-content" style={{ width: '90%', maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{t('delete_modal.confirm_title')}</h3>
              <button className="action-icon-btn" onClick={() => setIsDeleteModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ flexDirection: 'row', gap: '16px', alignItems: 'center' }}>
              <AlertCircle size={32} style={{ color: '#ef4444', flexShrink: 0 }} />
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '8px' }}>
                  {t('delete_modal.confirm_snippet')}
                </p>
                <p style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                  "{snippetToDelete.title}"
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setIsDeleteModalOpen(false)}>
                {t('common.cancel')}
              </button>
              <button className="btn-danger-confirm" onClick={handleDeleteSnippet}>
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ELIMINAR BULK */}
      {isBulkDeleteModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsBulkDeleteModalOpen(false)}>
          <div className="modal-content" style={{ width: '90%', maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{t('delete_modal.confirm_title')}</h3>
              <button className="action-icon-btn" onClick={() => setIsBulkDeleteModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ flexDirection: 'row', gap: '16px', alignItems: 'center' }}>
              <AlertCircle size={32} style={{ color: '#ef4444', flexShrink: 0 }} />
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '8px' }}>
                  {t('delete_modal.irreversible')}
                </p>
                <p style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                  {t('delete_modal.confirm_bulk', { count: selectedSnippetIds.length, plural: selectedSnippetIds.length !== 1 ? 's' : '' })}
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setIsBulkDeleteModalOpen(false)}>
                {t('common.cancel')}
              </button>
              <button className="btn-danger-confirm" onClick={executeBulkDelete}>
                {t('common.yes_delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. MODAL CREAR WORKSPACE */}
      {isAddWorkspaceModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddWorkspaceModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{t('workspace_modal.new_title')}</h3>
              <button className="action-icon-btn" onClick={() => setIsAddWorkspaceModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddWorkspace}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">{t('workspace_modal.name_label')}</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required 
                    placeholder={t('workspace_modal.name_placeholder')}
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsAddWorkspaceModalOpen(false)}>
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn-primary">
                  {t('workspace_modal.create_button')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4.5. MODAL EDITAR/PERSONALIZAR WORKSPACE */}
      {isEditWorkspaceModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsEditWorkspaceModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{t('workspace_edit_modal.title')}</h3>
              <button className="action-icon-btn" onClick={() => setIsEditWorkspaceModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleSaveWorkspaceEdit(); }}>
              <div className="modal-body">
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label className="form-label">{t('workspace_edit_modal.name_label')}</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required 
                    placeholder={t('workspace_edit_modal.name_placeholder')}
                    value={editWorkspaceName}
                    onChange={(e) => setEditWorkspaceName(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ marginBottom: '10px', display: 'block' }}>{t('workspace_edit_modal.color_label')}</label>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', padding: '4px 0' }}>
                    {[
                      { name: 'indigo', label: t('workspace_edit_modal.colors.indigo'), hex: '#6366f1' },
                      { name: 'emerald', label: t('workspace_edit_modal.colors.emerald'), hex: '#10b981' },
                      { name: 'rose', label: t('workspace_edit_modal.colors.rose'), hex: '#f43f5e' },
                      { name: 'amber', label: t('workspace_edit_modal.colors.amber'), hex: '#f59e0b' },
                      { name: 'sky', label: t('workspace_edit_modal.colors.sky'), hex: '#0ea5e9' },
                      { name: 'violet', label: t('workspace_edit_modal.colors.violet'), hex: '#8b5cf6' },
                      { name: 'teal', label: t('workspace_edit_modal.colors.teal'), hex: '#14b8a6' },
                    ].map(c => {
                      const isSelected = editWorkspaceColor === c.name;
                      return (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() => setEditWorkspaceColor(c.name)}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: c.hex,
                            border: isSelected ? '3px solid white' : 'none',
                            outline: isSelected ? `2px solid ${c.hex}` : 'none',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            padding: 0,
                            position: 'relative'
                          }}
                          title={c.label}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="modal-footer" style={{ marginTop: '20px' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsEditWorkspaceModalOpen(false)}>
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn-primary" style={{ background: getWorkspaceColorValue(workspaceToEdit) }}>
                  {t('workspace_edit_modal.save_changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL GESTIONAR CARPETA */}
      {isFolderSettingsOpen && (
        <div className="modal-backdrop" onClick={() => setIsFolderSettingsOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{t('folder_modal.manage_title')}</h3>
              <button className="action-icon-btn" onClick={() => setIsFolderSettingsOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                {t('folder_modal.path_label')}: <strong>{folderSettingsCategory}</strong>
                {getParentPath(folderSettingsName) && <> / <strong>{getParentPath(folderSettingsName)}</strong></>}
                {' / '}<strong style={{ color: 'var(--color-primary)' }}>{getFolderName(folderSettingsName)}</strong>
              </p>
              <form onSubmit={handleRenameFolder}>
                <div className="form-group">
                  <label className="form-label">{t('folder_modal.rename_label')}</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      className="form-input"
                      required
                      value={folderRenameValue}
                      onChange={(e) => setFolderRenameValue(e.target.value)}
                      style={{ flexGrow: 1 }}
                      autoFocus
                    />
                    <button type="submit" className="btn-primary" style={{ whiteSpace: 'nowrap', padding: '10px 16px' }}>
                      {t('common.rename')}
                    </button>
                  </div>
                </div>
              </form>
              <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '16px 0' }} />
              <div className="form-group">
                <label className="form-label">{t('folder_modal.delete_section')}</label>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  {t('folder_modal.delete_info')}
                </p>
                <button className="btn-danger-confirm" onClick={handleDeleteFolder} style={{ width: '100%' }}>
                  {t('folder_modal.delete_button', { name: getFolderName(folderSettingsName) })}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5b. MODAL CONFIRMAR ELIMINACIÓN DE CARPETA */}
      {isDeleteFolderConfirmOpen && (
        <div className="modal-backdrop" onClick={() => setIsDeleteFolderConfirmOpen(false)}>
          <div className="modal-content" style={{ width: '90%', maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{t('delete_folder_modal.title')}</h3>
              <button className="action-icon-btn" onClick={() => setIsDeleteFolderConfirmOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ flexDirection: 'row', gap: '16px', alignItems: 'center' }}>
              <AlertCircle size={32} style={{ color: '#ef4444', flexShrink: 0 }} />
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '8px' }}>
                  {t('delete_folder_modal.confirm', { name: getFolderName(folderSettingsName) })}
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {t('delete_folder_modal.info')}
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setIsDeleteFolderConfirmOpen(false)}>
                {t('common.cancel')}
              </button>
              <button className="btn-danger-confirm" onClick={() => { setIsDeleteFolderConfirmOpen(false); executeDeleteFolder(); }}>
                {t('delete_folder_modal.delete_button')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5b-alt. MODAL CONFIRMAR ELIMINACIÓN DE WORKSPACE */}
      {isDeleteWorkspaceConfirmOpen && (
        <div className="modal-backdrop" onClick={() => setIsDeleteWorkspaceConfirmOpen(false)}>
          <div className="modal-content" style={{ width: '90%', maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{t('delete_workspace_modal.title')}</h3>
              <button className="action-icon-btn" onClick={() => setIsDeleteWorkspaceConfirmOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ flexDirection: 'row', gap: '16px', alignItems: 'center' }}>
              <AlertCircle size={32} style={{ color: '#ef4444', flexShrink: 0 }} />
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '8px' }}>
                  {t('delete_workspace_modal.confirm', { name: workspaceToDelete })}
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {t('delete_workspace_modal.warning')}
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setIsDeleteWorkspaceConfirmOpen(false)}>
                {t('common.cancel')}
              </button>
              <button className="btn-danger-confirm" onClick={() => { executeDeleteWorkspace(); }}>
                {t('delete_workspace_modal.delete_button')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5c. MODAL GESTIONAR CATEGORÍAS */}
      {isCategoryManageOpen && (
        <div className="modal-backdrop" onClick={() => setIsCategoryManageOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{t('manage_categories_modal.title')}</h3>
              <button className="action-icon-btn" onClick={() => setIsCategoryManageOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={(e) => { e.preventDefault(); handleCreateCategory(); }} style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div style={{ position: 'relative' }} ref={createIconPickerRef}>
                    <button type="button" className="action-icon-btn" onClick={() => setIsCreateIconPickerOpen(!isCreateIconPickerOpen)} title={t('manage_categories_modal.choose_icon')} style={{ width: '36px', height: '36px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      {(() => { const Ic = AVAILABLE_ICONS[selectedCategoryIcon] || FileText; return <Ic size={16} />; })()}
                    </button>
                    {isCreateIconPickerOpen && (
                      <div style={{ position: 'absolute', top: '100%', left: '0', marginTop: '4px', zIndex: 50, background: '#1e293b', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px', display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '2px', maxHeight: '200px', overflowY: 'auto', minWidth: '280px', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
                        {Object.entries(AVAILABLE_ICONS).map(([key, IconComp]) => (
                          <button
                            key={key}
                            type="button"
                            className="action-icon-btn"
                            onClick={() => { setSelectedCategoryIcon(key); setIsCreateIconPickerOpen(false); }}
                            title={key}
                            style={{ width: '30px', height: '30px', background: selectedCategoryIcon === key ? 'var(--color-primary)' : 'transparent', borderRadius: '6px', color: selectedCategoryIcon === key ? '#fff' : 'var(--text-primary)' }}
                          >
                            <IconComp size={14} />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={t('manage_categories_modal.new_category_placeholder')}
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    style={{ flexGrow: 1 }}
                  />
                  <button type="submit" className="btn-primary" style={{ whiteSpace: 'nowrap', padding: '10px 16px' }}>
                    <Plus size={14} />
                  </button>
                </div>
              </form>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '300px', overflowY: 'auto' }}>
                {orderedCategories.map((cat, idx) => (
                  <div key={cat} style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '8px 10px', borderRadius: '8px',
                    background: 'rgba(255,255,255,0.02)',
                  }}>
                    {editingCategory === cat ? (
                      <form onSubmit={(e) => { e.preventDefault(); handleRenameCategory(cat); }} style={{ flex: '1', display: 'flex', gap: '4px' }}>
                        <input
                          type="text"
                          className="form-input"
                          value={editingCategoryValue}
                          onChange={(e) => setEditingCategoryValue(e.target.value)}
                          autoFocus
                          style={{ flex: '1', padding: '6px 8px', fontSize: '0.85rem' }}
                          onBlur={() => setEditingCategory(null)}
                        />
                        <button type="submit" className="btn-primary" style={{ padding: '6px 10px', fontSize: '0.8rem' }}>{t('common.ok')}</button>
                      </form>
                    ) : (
                      <>
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          <button type="button" className="action-icon-btn" onClick={() => setEditingCategoryIcon(editingCategoryIcon === cat ? null : cat)} title={t('manage_categories_modal.change_icon')} style={{ width: '28px', height: '28px' }}>
                            {getCategoryIcon(cat, 14)}
                          </button>
                          {editingCategoryIcon === cat && (
                            <div style={{ position: 'absolute', top: '100%', left: '0', marginTop: '4px', zIndex: 50, background: '#1e293b', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px', display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '2px', maxHeight: '200px', overflowY: 'auto', minWidth: '280px', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
                              {Object.entries(AVAILABLE_ICONS).map(([key, IconComp]) => (
                                <button
                                  key={key}
                                  type="button"
                                  className="action-icon-btn"
                                  onClick={async () => {
                                    const updatedIcons = { ...categoryIcons, [cat]: key };
                                    setEditingCategoryIcon(null);
                                    await saveSnippetsData(snippets, workspaces, currentWorkspace, folders, workspaceColors, workspaceThemes, categoriesOrder, updatedIcons);
                                  }}
                                  title={key}
                                  style={{ width: '30px', height: '30px', background: (categoryIcons[cat] || 'FileText') === key ? 'var(--color-primary)' : 'transparent', borderRadius: '6px', color: (categoryIcons[cat] || 'FileText') === key ? '#fff' : 'var(--text-primary)' }}
                                >
                                  <IconComp size={14} />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <span style={{ flex: '1', fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500 }}>{cat}</span>
                        <div style={{ display: 'flex', gap: '2px' }}>
                          <button
                            className="action-icon-btn"
                            onClick={() => { setEditingCategory(cat); setEditingCategoryValue(cat); }}
                            title={t('manage_categories_modal.rename')}
                            style={{ width: '28px', height: '28px' }}
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            className="action-icon-btn"
                            onClick={() => handleMoveCategory(cat, -1)}
                            disabled={idx === 0}
                            title={t('manage_categories_modal.move_up')}
                            style={{ opacity: idx === 0 ? 0.3 : 1, width: '28px', height: '28px' }}
                          >
                            <ChevronUp size={14} />
                          </button>
                          <button
                            className="action-icon-btn"
                            onClick={() => handleMoveCategory(cat, 1)}
                            disabled={idx === orderedCategories.length - 1}
                            title={t('manage_categories_modal.move_down')}
                            style={{ opacity: idx === orderedCategories.length - 1 ? 0.3 : 1, width: '28px', height: '28px' }}
                          >
                            <ChevronDown size={14} />
                          </button>
                          <button
                            className="action-icon-btn btn-delete"
                            onClick={() => handleDeleteCategory(cat)}
                            title={t('manage_categories_modal.delete_category')}
                            style={{ width: '28px', height: '28px' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL CREAR CARPETA */}
      {isAddFolderModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddFolderModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{t('add_folder_modal.title')}</h3>
              <button className="action-icon-btn" onClick={() => setIsAddFolderModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddFolder}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">{t('add_folder_modal.name_label')}</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder={t('add_folder_modal.name_placeholder')}
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    autoFocus
                  />
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {t('add_folder_modal.will_be_created_in')}: <strong>{activeCategory}</strong>
                  {activeFolder && <> / <strong>{activeFolder}</strong></>}
                </p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsAddFolderModalOpen(false)}>
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn-primary">
                  {t('add_folder_modal.create_button')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7b. MODAL PERSONALIZACIÓN */}
      {isThemePanelOpen && (
        <div className="modal-backdrop" onClick={() => setIsThemePanelOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: '90%', maxWidth: '500px', borderRadius: '18px', padding: '24px' }}>
            <div className="modal-header" style={{ marginBottom: '18px' }}>
              <h3 className="modal-title" style={{ fontSize: '1.25rem', fontWeight: 700 }}>{t('customization_modal.title')}</h3>
              <button className="action-icon-btn" onClick={() => setIsThemePanelOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: 0 }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '20px', fontWeight: 500 }}>
                {t('customization_modal.description')}
              </p>

              {/* Language Selector */}
              <div style={{ marginBottom: '20px', padding: '14px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
                <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '10px' }}>{t('customization_modal.language')}</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['es', 'en'].map(lang => (
                    <button
                      key={lang}
                      onClick={() => { i18n.changeLanguage(lang); safeSetItem('snapcopy_language', lang); }}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        border: i18n.language === lang ? '1.5px solid var(--color-primary)' : '1.5px solid var(--border)',
                        backgroundColor: i18n.language === lang ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                        color: i18n.language === lang ? 'var(--color-primary)' : 'var(--text-secondary)',
                        transition: 'all 0.2s ease',
                        textAlign: 'center',
                      }}
                    >
                      {t(`languages.${lang}`)}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {Object.entries(themes).map(([key, th]) => (
                  <button
                    key={key}
                    onClick={() => handleThemeChange(key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      backgroundColor: theme === key ? `${th.primary}08` : 'rgba(255, 255, 255, 0.01)',
                      border: theme === key ? `1.5px solid ${th.primary}` : '1.5px solid rgba(255, 255, 255, 0.05)',
                      transition: 'all 0.2s ease',
                      width: '100%',
                      textAlign: 'left',
                      boxSizing: 'border-box'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = theme === key ? `${th.primary}15` : 'rgba(255, 255, 255, 0.04)';
                      e.currentTarget.style.borderColor = theme === key ? th.primary : 'rgba(255, 255, 255, 0.15)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = theme === key ? `${th.primary}08` : 'rgba(255, 255, 255, 0.01)';
                      e.currentTarget.style.borderColor = theme === key ? th.primary : 'rgba(255, 255, 255, 0.05)';
                    }}
                  >
                    {/* Mini UI Mockup Preview */}
                    <div style={{
                      width: '54px',
                      height: '38px',
                      borderRadius: '6px',
                      border: `1px solid ${th.border || 'rgba(255,255,255,0.08)'}`,
                      backgroundColor: th.bgMain,
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'row',
                      overflow: 'hidden',
                      flexShrink: 0,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}>
                      {/* Mini Sidebar */}
                      <div style={{
                        width: '14px',
                        height: '100%',
                        backgroundColor: th.bgSidebar,
                        borderRight: `1px solid ${th.border || 'rgba(255,255,255,0.08)'}`,
                        padding: '3px 2px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                        boxSizing: 'border-box'
                      }}>
                        {/* Mini Workspace dot */}
                        <div style={{ width: '10px', height: '4px', borderRadius: '1.5px', backgroundColor: th.primary, opacity: 0.8, marginBottom: '2px' }} />
                        {/* Mini Sidebar category lines */}
                        <div style={{ width: '8px', height: '2px', borderRadius: '1px', backgroundColor: 'rgba(255,255,255,0.15)' }} />
                        <div style={{ width: '10px', height: '2px', borderRadius: '1px', backgroundColor: th.primary, opacity: 0.6 }} />
                        <div style={{ width: '6px', height: '2px', borderRadius: '1px', backgroundColor: 'rgba(255,255,255,0.15)' }} />
                      </div>
                      
                      {/* Mini Main Content Area */}
                      <div style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        boxSizing: 'border-box'
                      }}>
                        {/* Mini Header */}
                        <div style={{
                          height: '6px',
                          borderBottom: `1px solid ${th.border || 'rgba(255,255,255,0.08)'}`,
                          backgroundColor: th.bgMain,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          padding: '0 3px',
                          boxSizing: 'border-box'
                        }}>
                          <div style={{ width: '6px', height: '2px', borderRadius: '0.5px', backgroundColor: th.primary }} />
                        </div>
                        {/* Mini Content Grid */}
                        <div style={{
                          flex: 1,
                          padding: '3px',
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '2px',
                          boxSizing: 'border-box'
                        }}>
                          <div style={{
                            borderRadius: '1.5px',
                            border: `0.5px solid ${th.primary}40`,
                            backgroundColor: `${th.primary}05`,
                            boxSizing: 'border-box'
                          }} />
                          <div style={{
                            borderRadius: '1.5px',
                            border: `0.5px solid ${th.border || 'rgba(255,255,255,0.08)'}`,
                            backgroundColor: 'rgba(255,255,255,0.01)',
                            boxSizing: 'border-box'
                          }} />
                        </div>
                      </div>
                    </div>

                    <span style={{ flex: '1', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {th.name}
                    </span>
                    {theme === key && (
                      <Check size={14} style={{ color: th.primary, flexShrink: 0 }} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTEXT MENU */}
      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            zIndex: 10000,
            minWidth: '160px',
            background: '#1e293b',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
            padding: '4px',
            animation: 'fadeIn 0.1s ease',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.items.map((item, i) => (
            <div
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                setContextMenu(null);
                item.action();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: 500,
                color: item.danger ? '#ef4444' : 'var(--text-primary)',
                transition: 'all 0.12s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = item.danger ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <span style={{ width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {item.icon === 'Edit3' && <Edit3 size={14} />}
                {item.icon === 'Trash2' && <Trash2 size={14} />}
                {item.icon === 'Pin' && <Pin size={14} />}
                {item.icon === 'Settings' && <Settings size={14} />}
              </span>
              {item.label}
            </div>
          ))}
        </div>
      )}

      {/* 8. TOAST NOTIFICATIONS */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className="toast">
            <Check className="toast-icon" />
            <span className="toast-message">{toast.message}</span>
          </div>
        ))}
      </div>

      {/* 8. TOUR INICIAL (POST-LOGIN) */}
      {isShortcutModalOpen && (() => {
        const steps = [
          {
            icon: <Keyboard size={32} />,
            gradient: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            color: 'var(--color-primary)',
            content: (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '1.45rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#e2e8f0', marginBottom: '8px' }}>
                    {t('tour.welcome_title')}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.5', padding: '0 12px' }}>
                    {t('tour.welcome_desc')}
                  </p>
                </div>
                <div style={{ background: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(255, 255, 255, 0.03)', borderRadius: '16px', padding: '20px', margin: '20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <kbd style={{ display: 'inline-block', minWidth: '55px', padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-primary)', backgroundColor: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.08)', borderBottom: '3px solid #0f172a', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)' }}>Ctrl</kbd>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '1rem' }}>+</span>
                    <kbd style={{ display: 'inline-block', minWidth: '55px', padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-primary)', backgroundColor: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.08)', borderBottom: '3px solid #0f172a', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)' }}>Alt</kbd>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '1rem' }}>+</span>
                    <kbd style={{ display: 'inline-block', minWidth: '45px', padding: '8px 14px', fontFamily: 'var(--font-mono)', fontSize: '0.95rem', fontWeight: 'bold', color: '#ffffff', backgroundColor: 'var(--color-primary)', border: '1px solid rgba(255, 255, 255, 0.1)', borderBottom: '3px solid #4f46e5', borderRadius: '8px', boxShadow: '0 0 15px rgba(99, 102, 241, 0.4), 0 4px 6px rgba(0, 0, 0, 0.3)' }}>S</kbd>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    <Sparkles size={12} style={{ color: 'var(--color-warning)' }} />
                    <span>{t('tour.welcome_footnote')}</span>
                  </div>
                  <div style={{ height: '1px', width: '60%', background: 'rgba(255,255,255,0.06)' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <kbd style={{ display: 'inline-block', minWidth: '40px', padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-primary)', backgroundColor: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.08)', borderBottom: '3px solid #0f172a', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)' }}>Shift</kbd>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '1rem' }}>+</span>
                    <kbd style={{ display: 'inline-block', minWidth: '40px', padding: '8px 14px', fontFamily: 'var(--font-mono)', fontSize: '0.95rem', fontWeight: 'bold', color: '#ffffff', backgroundColor: 'var(--color-primary)', border: '1px solid rgba(255, 255, 255, 0.1)', borderBottom: '3px solid #4f46e5', borderRadius: '8px', boxShadow: '0 0 15px rgba(99, 102, 241, 0.4), 0 4px 6px rgba(0, 0, 0, 0.3)' }}>A</kbd>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginLeft: '4px' }}>{t('tour.welcome_select_all')}</span>
                  </div>
                </div>
              </>
            )
          },
          {
            icon: <Plus size={32} />,
            gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(52, 211, 153, 0.2) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#10b981',
            content: (
              <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '1.45rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#e2e8f0', marginBottom: '8px' }}>
                    {t('tour.create_title')}
                  </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.6', padding: '0 12px', textAlign: 'left' }}>
                  {t('tour.create_desc')}
                </p>
              </div>
            )
          },
          {
            icon: <FolderIcon size={32} />,
            gradient: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(251, 146, 60, 0.2) 100%)',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            color: '#fbbf24',
            content: (
              <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '1.45rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#e2e8f0', marginBottom: '8px' }}>
                    {t('tour.organize_title')}
                  </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.6', padding: '0 12px', textAlign: 'left' }}>
                  {t('tour.organize_desc')}
                </p>
              </div>
            )
          },
          {
            icon: <Layers size={32} />,
            gradient: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            color: 'var(--color-primary)',
            content: (
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.45rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#e2e8f0', marginBottom: '8px' }}>
                  {t('tour.selection_title')}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.6', padding: '0 12px', textAlign: 'left' }}>
                  {t('tour.selection_desc')}
                </p>
              </div>
            )
          },
          {
            icon: <Search size={32} />,
            gradient: 'linear-gradient(135deg, rgba(244, 114, 182, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%)',
            border: '1px solid rgba(244, 114, 182, 0.3)',
            color: '#f472b6',
            content: (
              <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '1.45rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#e2e8f0', marginBottom: '8px' }}>
                    {t('tour.search_title')}
                  </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.6', padding: '0 12px', textAlign: 'left' }}>
                  {t('tour.search_desc')}
                </p>
              </div>
            )
          },
          {
            icon: <Database size={32} />,
            gradient: 'linear-gradient(135deg, rgba(96, 165, 250, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)',
            border: '1px solid rgba(96, 165, 250, 0.3)',
            color: '#60a5fa',
            content: (
              <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '1.45rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#e2e8f0', marginBottom: '8px' }}>
                    {t('tour.cloud_title')}
                  </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.6', padding: '0 12px', textAlign: 'left' }}>
                  {t('tour.cloud_desc')}
                </p>
              </div>
            )
          }
        ];
        const step = steps[tourStep];
        const isLast = tourStep === steps.length - 1;
        return (
          <div className="modal-backdrop" onClick={handleCloseShortcutModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px', textAlign: 'center', background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '24px', padding: '32px 24px', boxShadow: 'var(--shadow-glass), 0 30px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', position: 'relative', overflow: 'visible' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: step.gradient, border: step.border, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '-64px auto 20px', color: step.color }}>
                {step.icon}
              </div>
              {step.content}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '20px' }}>
                {steps.map((_, i) => (
                  <div key={i} style={{ width: i === tourStep ? '20px' : '6px', height: '6px', borderRadius: '3px', background: i === tourStep ? 'var(--color-primary)' : 'rgba(255,255,255,0.15)', transition: 'all 0.3s ease' }} />
                ))}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {tourStep > 0 && (
                  <button className="btn-secondary" onClick={handlePrevTourStep} style={{ flex: 1, padding: '10px', borderRadius: '12px', fontSize: '0.9rem' }}>
                    {t('common.previous')}
                  </button>
                )}
                {!isLast ? (
                  <button className="btn-primary" onClick={handleNextTourStep} style={{ flex: 1, padding: '12px 24px', fontSize: '0.95rem', borderRadius: '12px', background: 'linear-gradient(135deg, var(--color-primary) 0%, #8b5cf6 100%)', boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)', fontWeight: 600, border: 'none', color: 'white', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                    {t('common.next')}
                  </button>
                ) : (
                  <button className="btn-primary" onClick={handleCloseShortcutModal} style={{ flex: 1, padding: '12px 24px', fontSize: '0.95rem', borderRadius: '12px', background: 'linear-gradient(135deg, var(--color-primary) 0%, #8b5cf6 100%)', boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)', fontWeight: 600, border: 'none', color: 'white', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                    {t('common.start_using')}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* 11. BARRA DE ACCIONES MASIVAS FLOTANTE */}
      {selectedSnippetIds.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '10px 20px',
          borderRadius: '20px',
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(16px)',
          zIndex: 90,
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-primary)', color: 'white', width: '20px', height: '20px', borderRadius: '50%', fontSize: '0.75rem' }}>
              {selectedSnippetIds.length}
            </span>
            <span>{t('common.selected')}</span>
            <button
              onClick={() => setSelectedSnippetIds([])}
              title={t('common.deselect_all')}
              style={{
                background: 'none', border: 'none', color: 'var(--text-muted)',
                cursor: 'pointer', padding: '2px', borderRadius: '4px',
                display: 'flex', alignItems: 'center', marginLeft: '4px'
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              <X size={14} />
            </button>
          </div>

          <div style={{ width: '1px', height: '20px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Move to folder dropdown — custom styled */}
            {!isHomeView && getFoldersForCategory(activeCategory).length > 0 && (() => {
              const moveOptions = [
                { value: '___root___', label: t('common.root_no_folder') },
                ...getFoldersForCategory(activeCategory).map(f => ({ value: f, label: getFolderName(f) }))
              ];
              return (
                <div style={{ position: 'relative' }} id="move-folder-dropdown">
                  {/* Trigger button */}
                  <button
                    onClick={() => {
                      const dd = document.getElementById('move-folder-dd-menu');
                      if (dd) dd.style.display = dd.style.display === 'none' ? 'block' : 'none';
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.10)',
                      color: 'var(--text-secondary)',
                      padding: '6px 10px 6px 12px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'; }}
                  >
                    <FolderOpen size={12} />
                    <span>{t('bulk_actions.move_to')}</span>
                    <ChevronDown size={12} style={{ opacity: 0.6 }} />
                  </button>

                  {/* Dropdown menu */}
                  <div
                    id="move-folder-dd-menu"
                    style={{
                      display: 'none',
                      position: 'absolute',
                      bottom: 'calc(100% + 6px)',
                      left: 0,
                      minWidth: '180px',
                      background: 'var(--bg-sidebar)',
                      border: '1px solid var(--border)',
                      borderRadius: '10px',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                      zIndex: 1000,
                      overflow: 'hidden',
                      animation: 'slideUp 0.15s cubic-bezier(0.16,1,0.3,1)',
                    }}
                  >
                    <div style={{ padding: '6px' }}>
                      {moveOptions.map(opt => (
                        <button
                          key={opt.value}
                          onClick={async () => {
                            const destFolder = opt.value;
                            const targetPath = destFolder === '___root___' ? null : destFolder;
                            const updatedSnippets = snippets.map(s =>
                              selectedSnippetIds.includes(s.id) ? { ...s, folder: targetPath } : s
                            );
                            await saveSnippetsData(updatedSnippets);
                            await syncToCloud(async () => {
                              const moved = updatedSnippets.filter(s => selectedSnippetIds.includes(s.id));
                              await Promise.all(moved.map(s => saveCloudSnippet(s)));
                            });
                            setSelectedSnippetIds([]);
                            addToast(targetPath
  ? t('toasts.snippets_moved', { count: selectedSnippetIds.length, name: getFolderName(targetPath) })
  : t('toasts.snippets_moved_root', { count: selectedSnippetIds.length }));
                            const dd = document.getElementById('move-folder-dd-menu');
                            if (dd) dd.style.display = 'none';
                          }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            width: '100%', textAlign: 'left',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-secondary)',
                            padding: '8px 10px',
                            borderRadius: '7px',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            transition: 'all 0.12s ease',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                        >
                          {opt.value === '___root___'
                            ? <FolderOpen size={13} style={{ opacity: 0.5 }} />
                            : <FolderIcon size={13} style={{ color: 'var(--color-primary)', opacity: 0.8 }} />
                          }
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Bulk Delete Button */}
            <button
              onClick={handleBulkDelete}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#ef4444',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
            >
              <Trash2 size={12} />
              <span>{t('bulk_actions.delete')}</span>
            </button>

            {/* Clear Selection Button */}
            <button
              onClick={() => setSelectedSnippetIds([])}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                padding: '6px',
                cursor: 'pointer',
                transition: 'color 0.15s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              title={t('common.deselect_all')}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
      {/* 8. MODAL DE ACTUALIZACIÓN DE APLICACIÓN DE ALTA ESTÉTICA PREMIUM */}
      {isUpdateModalOpen && updateAvailable && (
        <div className="modal-backdrop" onClick={() => setIsUpdateModalOpen(false)}>
          <div
            className="modal-content"
            style={{
              maxWidth: '580px',
              backgroundColor: '#0a0f1d',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '24px',
              boxShadow: '0 30px 70px rgba(0, 0, 0, 0.85), 0 0 40px rgba(99, 102, 241, 0.15)',
              padding: '28px',
              animation: 'fadeIn 0.25s ease-out',
              position: 'relative',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Glowing Ambient Light */}
            <div style={{
              position: 'absolute', top: '-60px', left: '50%', transform: 'translateX(-50%)',
              width: '240px', height: '120px', borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, rgba(168, 85, 247, 0) 70%)',
              pointerEvents: 'none', filter: 'blur(20px)'
            }} />

            {/* Header */}
            <div className="modal-header" style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.07)', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '46px', height: '46px', borderRadius: '14px',
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.25) 0%, rgba(168,85,247,0.25) 100%)',
                  border: '1px solid rgba(99,102,241,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--color-primary)',
                  boxShadow: '0 4px 15px rgba(99,102,241,0.2)'
                }}>
                  <Sparkles size={22} />
                </div>
                <div>
                  <h3 className="modal-title" style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                    {t('update_modal.title')}
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t('update_modal.subtitle')}</span>
                </div>
              </div>
              <button className="action-icon-btn" onClick={() => setIsUpdateModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
              
              {/* Version transition badge */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'rgba(15, 23, 42, 0.8)',
                padding: '12px 18px', borderRadius: '14px',
                border: '1px solid rgba(255, 255, 255, 0.06)'
              }}>
                <span style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  {t('update_modal.new_version')}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>v{pkg.version}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)' }}>➔</span>
                  <span style={{
                    padding: '3px 12px', borderRadius: '20px',
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.25) 0%, rgba(168,85,247,0.25) 100%)',
                    border: '1px solid rgba(99,102,241,0.4)',
                    color: '#a5b4fc', fontSize: '0.85rem', fontWeight: 700,
                    boxShadow: '0 0 12px rgba(99,102,241,0.2)'
                  }}>
                    v{updateAvailable.version}
                  </span>
                </div>
              </div>

              {/* Release Notes List */}
              {updateAvailable.releaseNotes && (
                <div style={{
                  background: 'rgba(15, 23, 42, 0.5)',
                  padding: '14px', borderRadius: '14px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  maxHeight: '420px', overflowY: 'auto'
                }}>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '10px' }}>
                    {t('update_modal.release_notes')}
                  </div>
                  <div>
                    {formatReleaseNotes(updateAvailable.releaseNotes)}
                  </div>
                </div>
              )}

              {/* Download Progress */}
              {isDownloadingUpdate && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '14px', borderRadius: '14px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    <span>{t('update_modal.downloading')}</span>
                    <span style={{ color: 'var(--color-primary)' }}>{downloadProgress || 0}%</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${downloadProgress || 0}%`, height: '100%',
                      background: 'linear-gradient(90deg, #6366f1 0%, #a855f7 100%)',
                      borderRadius: '4px', transition: 'width 0.3s ease',
                      boxShadow: '0 0 10px rgba(99, 102, 241, 0.5)'
                    }} />
                  </div>
                </div>
              )}

              {/* Update Downloaded Status Card */}
              {isUpdateDownloaded && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '14px 16px', borderRadius: '14px',
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.08) 100%)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  boxShadow: '0 4px 20px rgba(16, 185, 129, 0.15)',
                  color: '#34d399', fontSize: '0.88rem', fontWeight: 600
                }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    background: 'rgba(16, 185, 129, 0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Check size={16} />
                  </div>
                  <span>{t('update_modal.ready_text')}</span>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="modal-footer" style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end', position: 'relative' }}>
              {!isDownloadingUpdate && !isUpdateDownloaded && (
                <>
                  <button
                    className="btn-secondary"
                    onClick={() => setIsUpdateModalOpen(false)}
                    style={{ padding: '11px 20px', borderRadius: '12px', fontSize: '0.86rem', fontWeight: 500 }}
                  >
                    {t('common.later')}
                  </button>
                  <button
                    className="btn-primary"
                    onClick={handleStartDownloadUpdate}
                    style={{
                      padding: '11px 22px', borderRadius: '12px', fontSize: '0.86rem',
                      display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600,
                      background: 'linear-gradient(135deg, var(--color-primary) 0%, #a855f7 100%)',
                      boxShadow: '0 4px 20px rgba(99, 102, 241, 0.35)'
                    }}
                  >
                    <Download size={16} />
                    <span>{t('update_modal.download_install')}</span>
                  </button>
                </>
              )}
              {isUpdateDownloaded && (
                <button
                  className="btn-primary"
                  onClick={handleInstallUpdate}
                  style={{
                    width: '100%', padding: '14px', borderRadius: '14px', fontSize: '0.95rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    boxShadow: '0 6px 25px rgba(99, 102, 241, 0.4)',
                    cursor: 'pointer'
                  }}
                >
                  <RefreshCw size={18} />
                  <span>{t('update_modal.restart_install')}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 9. MODAL DE APLICACIÓN AL DÍA / NO HAY ACTUALIZACIONES */}
      {isNoUpdateModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsNoUpdateModalOpen(false)}>
          <div
            className="modal-content"
            style={{
              maxWidth: '440px',
              backgroundColor: '#0a0f1d',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '24px',
              boxShadow: '0 30px 70px rgba(0, 0, 0, 0.85), 0 0 40px rgba(16, 185, 129, 0.12)',
              padding: '28px',
              animation: 'fadeIn 0.25s ease-out',
              position: 'relative',
              textAlign: 'center',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient Light Glow */}
            <div style={{
              position: 'absolute', top: '-50px', left: '50%', transform: 'translateX(-50%)',
              width: '200px', height: '100px', borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, rgba(16, 185, 129, 0) 70%)',
              pointerEvents: 'none', filter: 'blur(20px)'
            }} />

            {/* Shield Check Badge */}
            <div style={{
              width: '64px', height: '64px', borderRadius: '20px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.15) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#34d399', margin: '0 auto 16px',
              boxShadow: '0 8px 25px rgba(16, 185, 129, 0.2)'
            }}>
              <Check size={32} />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 6px', color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              {t('uptodate_modal.title')}
            </h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: '0 0 20px', lineHeight: '1.45' }}>
              {t('uptodate_modal.description')}
            </p>

            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'rgba(15, 23, 42, 0.8)',
              padding: '12px 18px', borderRadius: '14px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={16} style={{ color: '#34d399' }} />
                <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{t('uptodate_modal.version_installed')}</span>
              </div>
              <span style={{
                padding: '3px 12px', borderRadius: '20px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#34d399', fontSize: '0.85rem', fontWeight: 700
              }}>
                v{pkg.version}
              </span>
            </div>

            <button
              className="btn-primary"
              onClick={() => setIsNoUpdateModalOpen(false)}
              style={{
                width: '100%', padding: '13px', borderRadius: '14px', fontSize: '0.92rem',
                fontWeight: 700, cursor: 'pointer',
                background: 'linear-gradient(135deg, var(--color-primary) 0%, #a855f7 100%)',
                boxShadow: '0 4px 20px rgba(99, 102, 241, 0.35)'
              }}
            >
              {t('common.got_it')}
            </button>
          </div>
        </div>
      )}

      {/* SUGGESTION BOX MODAL */}
      {isSuggestionModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsSuggestionModalOpen(false)}>
          <div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()} 
            style={{ 
              maxWidth: '560px', 
              width: '90%', 
              padding: '24px', 
              borderRadius: '16px',
              border: '1px solid var(--border-hover)',
              backgroundColor: '#0f172a',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
            }}
          >
            {/* Header */}
            <div className="modal-header" style={{ marginBottom: '18px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  padding: '10px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(99, 102, 241, 0.12)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <MessageSquare size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {t('suggestions.modal_title')}
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.35' }}>
                    {t('suggestions.modal_subtitle')}
                  </p>
                  <div style={{ marginTop: '6px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--color-primary)', backgroundColor: 'rgba(99, 102, 241, 0.1)', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                    <span>Destinatario: <strong>cmtdevsolutions@gestricon.com</strong></span>
                  </div>
                </div>
              </div>
              <button 
                type="button" 
                className="action-icon-btn" 
                onClick={() => setIsSuggestionModalOpen(false)}
                style={{ padding: '6px', borderRadius: '8px', border: 'none', backgroundColor: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSendSuggestion} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Asunto / Subject */}
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  {t('suggestions.subject_label')} <span style={{ color: 'var(--color-primary)' }}>*</span>
                </label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder={t('suggestions.subject_placeholder')}
                  value={suggestionSubject}
                  onChange={(e) => setSuggestionSubject(e.target.value)}
                  autoFocus
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg-input)',
                    color: 'var(--text-main)',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Sugerencia / Details */}
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  {t('suggestions.body_label')} <span style={{ color: 'var(--color-primary)' }}>*</span>
                </label>
                <textarea 
                  className="form-control"
                  rows={4}
                  placeholder={t('suggestions.body_placeholder')}
                  value={suggestionBody}
                  onChange={(e) => setSuggestionBody(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg-input)',
                    color: 'var(--text-main)',
                    fontSize: '0.9rem',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Images Attachment Section */}
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    {t('suggestions.images_label')}
                  </label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {suggestionImages.length}/4
                  </span>
                </div>

                <input 
                  type="file" 
                  accept="image/*" 
                  multiple 
                  id="suggestion-file-input"
                  onChange={handleSuggestionImageUpload}
                  style={{ display: 'none' }}
                />

                {suggestionImages.length < 4 && (
                  <label 
                    htmlFor="suggestion-file-input"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1.5px dashed var(--border)',
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'var(--color-primary)';
                      e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.05)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
                    }}
                  >
                    <Image size={18} style={{ color: 'var(--color-primary)' }} />
                    <span>{t('suggestions.images_drag_drop')}</span>
                  </label>
                )}

                {/* Thumbnails list */}
                {suggestionImages.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '6px' }}>
                    {suggestionImages.map((img) => (
                      <div 
                        key={img.id}
                        style={{
                          position: 'relative',
                          width: '72px',
                          height: '72px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          border: '1px solid var(--border)',
                          backgroundColor: '#000'
                        }}
                      >
                        <img 
                          src={img.dataUrl} 
                          alt={img.name} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveSuggestionImage(img.id)}
                          title={t('suggestions.remove_image')}
                          style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(0, 0, 0, 0.75)',
                            border: 'none',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            padding: 0
                          }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Footer Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setIsSuggestionModalOpen(false)}
                  disabled={isSubmittingSuggestion}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'transparent',
                    color: 'var(--text-main)',
                    fontSize: '0.88rem',
                    cursor: 'pointer'
                  }}
                >
                  {t('suggestions.cancel')}
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={isSubmittingSuggestion || !suggestionSubject.trim() || !suggestionBody.trim()}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: 'var(--color-primary)',
                    color: 'white',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    opacity: (isSubmittingSuggestion || !suggestionSubject.trim() || !suggestionBody.trim()) ? 0.6 : 1
                  }}
                >
                  <MessageSquare size={16} />
                  <span>{isSubmittingSuggestion ? t('suggestions.sending') : t('suggestions.send')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
    )}
    </>
  );
}
