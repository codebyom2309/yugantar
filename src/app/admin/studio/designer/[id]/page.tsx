'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  Eye,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid,
  Layers,
  Type,
  QrCode,
  Square,
  Circle,
  Minus,
  Image as ImageIcon,
  Upload,
  Copy,
  Trash2,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  Sliders,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Download,
  AlertTriangle,
  Sparkles,
  Printer,
  ChevronDown,
  ChevronRight,
  Search,
  Plus,
  RotateCw,
  X,
  Shield,
  FileText,
  Check,
  Smartphone,
  Monitor,
  RefreshCw,
  AlertCircle,
  Move,
  Columns,
  Layers3,
  Bookmark,
  Compass,
} from 'lucide-react';
import {
  PassTemplate,
  StudioElement,
  TextElement,
  FieldElement,
  QrElement,
  ShapeElement,
  ImageElement,
  PaperSize,
  Orientation,
  PAPER_DIMENSIONS,
  FontFamily,
  ShapeType,
  QrVerificationType,
  TextFittingMode,
  ValidationReport,
  ReusableDesignBlock,
} from '@/types/studio';
import { DATA_TOKEN_CATEGORIES, getSampleTokenValues, resolveTokens } from '@/lib/studioTokens';
import { COMPETITIONS } from '@/data/events';
import { validateTemplate, REUSABLE_DESIGN_BLOCKS } from '@/lib/studioValidation';

export default function StudioDesignerPage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params?.id as string;

  // ---------------------------------------------------------------------------
  // STATE MANAGEMENT
  // ---------------------------------------------------------------------------
  const [template, setTemplate] = useState<PassTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(true);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Undo / Redo history
  const [history, setHistory] = useState<StudioElement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Viewport & Canvas settings
  const [zoom, setZoom] = useState(0.85);
  const [showGrid, setShowGrid] = useState(true);
  const [gridSize, setGridSize] = useState(16); // pt
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [snapToCenter, setSnapToCenter] = useState(true);
  const [activeGuideX, setActiveGuideX] = useState<number | null>(null);
  const [activeGuideY, setActiveGuideY] = useState<number | null>(null);

  // Preview options
  const [previewSampleData, setPreviewSampleData] = useState(true);
  const [previewCompSlug, setPreviewCompSlug] = useState('project-competition');
  const [testLongName, setTestLongName] = useState(false);

  // Left panel tabs: 6 tabs as required by Phase 2
  // 'elements' | 'fields' | 'uploads' | 'layers' | 'templates' | 'page'
  const [leftTab, setLeftTab] = useState<'elements' | 'fields' | 'uploads' | 'layers' | 'templates' | 'page'>('elements');
  const [tokenSearch, setTokenSearch] = useState('');

  // Mobile layout state (Phase 3)
  const [isMobile, setIsMobile] = useState(false);
  const [mobileActiveSheet, setMobileActiveSheet] = useState<'none' | 'elements' | 'fields' | 'layers' | 'properties' | 'page'>('none');

  // Selection & drag state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0, mouseX: 0, mouseY: 0 });

  // Workspace layout and collapsing state
  const mainContainerRef = useRef<HTMLElement>(null);
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);
  const [showMobilePropsModal, setShowMobilePropsModal] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; elementId: string } | null>(null);

  // Guide labels
  const [guideLabelX, setGuideLabelX] = useState<string | null>(null);
  const [guideLabelY, setGuideLabelY] = useState<string | null>(null);

  // Background upload & quality
  const [isUploadingBg, setIsUploadingBg] = useState(false);
  const [bgResolutionWarning, setBgResolutionWarning] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modals
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewMode, setPreviewMode] = useState<'design' | 'participant' | 'team' | 'certificate' | 'pdf'>('design');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  // Local draft recovery notification
  const [showDraftRecovery, setShowDraftRecovery] = useState(false);
  const [recoveredDraft, setRecoveredDraft] = useState<PassTemplate | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);

  // Dynamic Fit to Screen calculation
  const handleFitToScreen = useCallback(() => {
    if (!mainContainerRef.current || !template) return;
    const padding = 64;
    const containerW = mainContainerRef.current.clientWidth - padding;
    const containerH = mainContainerRef.current.clientHeight - padding;
    if (containerW <= 0 || containerH <= 0) return;
    const scaleW = containerW / template.width_pt;
    const scaleH = containerH / template.height_pt;
    const scale = Math.min(scaleW, scaleH);
    setZoom(Math.max(0.2, Math.min(2.5, Number(scale.toFixed(2)))));
  }, [template]);

  // ---------------------------------------------------------------------------
  // RESPONSIVE DETECTION (Phase 3)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile && zoom > 0.6) {
        setZoom(0.5);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-fit to screen on initial load
  useEffect(() => {
    if (!loading && template && mainContainerRef.current) {
      const timer = setTimeout(() => {
        handleFitToScreen();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [loading, template?.id, template?.width_pt, template?.height_pt, handleFitToScreen]);

  // ---------------------------------------------------------------------------
  // SAMPLE DATA TOKENS
  // ---------------------------------------------------------------------------
  const baseSampleValues = getSampleTokenValues(previewCompSlug);
  const sampleValues: Record<string, string> = {
    ...baseSampleValues,
    ...(testLongName
      ? {
          '{{participant.name}}': 'Dr. Christopher Montgomery-Vanderbilt Jr. III',
          '{{team.name}}': 'Advanced Quantum Autonomous Robotics & Cybernetics Consortium',
          '{{participant.college}}': 'International Institute of Advanced Computational Engineering & Applied Technology, Nagpur Campus',
        }
      : {}),
  };

  // ---------------------------------------------------------------------------
  // 1. LOAD TEMPLATE & DRAFT RECOVERY (Phase 12)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    async function fetchTemplate() {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/studio/templates/${templateId}`);
        const data = await res.json();
        if (data.template) {
          const loadedTpl: PassTemplate = data.template;
          setTemplate(loadedTpl);
          const initialElements = loadedTpl.elements || [];
          setHistory([initialElements]);
          setHistoryIndex(0);

          // Check if a local unsaved draft exists
          try {
            const localDraftJson = localStorage.getItem(`studio_draft_${templateId}`);
            if (localDraftJson) {
              const draft = JSON.parse(localDraftJson);
              if (draft && draft.updated_at && (!loadedTpl.updated_at || new Date(draft.updated_at) > new Date(loadedTpl.updated_at))) {
                setRecoveredDraft(draft);
                setShowDraftRecovery(true);
              }
            }
          } catch (e) {
            console.warn('LocalStorage check skipped:', e);
          }
        } else {
          alert('Template not found');
          router.push('/admin/studio');
        }
      } catch (err) {
        console.error('Failed to load template:', err);
      } finally {
        setLoading(false);
      }
    }
    if (templateId) fetchTemplate();
  }, [templateId, router]);

  // Unsaved changes browser prompt
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isSaved) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isSaved]);

  // ---------------------------------------------------------------------------
  // 2. UNDO / REDO HISTORY (Phase 5)
  // ---------------------------------------------------------------------------
  const pushHistory = useCallback(
    (newElements: StudioElement[]) => {
      setHistory((prev) => {
        const next = prev.slice(0, historyIndex + 1);
        return [...next, newElements];
      });
      setHistoryIndex((prev) => prev + 1);
      setIsSaved(false);

      // Local draft backup
      if (template) {
        try {
          const draftToSave = {
            ...template,
            elements: newElements,
            updated_at: new Date().toISOString(),
          };
          localStorage.setItem(`studio_draft_${template.id}`, JSON.stringify(draftToSave));
        } catch (e) {
          console.warn('Draft save failed:', e);
        }
      }
    },
    [historyIndex, template]
  );

  const undo = () => {
    if (historyIndex > 0) {
      const targetIndex = historyIndex - 1;
      setHistoryIndex(targetIndex);
      const targetElements = history[targetIndex];
      setTemplate((prev) => (prev ? { ...prev, elements: targetElements } : prev));
      setIsSaved(false);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const targetIndex = historyIndex + 1;
      setHistoryIndex(targetIndex);
      const targetElements = history[targetIndex];
      setTemplate((prev) => (prev ? { ...prev, elements: targetElements } : prev));
      setIsSaved(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 3. KEYBOARD SHORTCUTS
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        if (selectedId) duplicateElement(selectedId);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId) {
          e.preventDefault();
          deleteElement(selectedId);
        }
      } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        if (selectedId) {
          e.preventDefault();
          const step = e.shiftKey ? 10 : 1;
          const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
          const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
          nudgeElement(selectedId, dx, dy);
        }
      } else if (e.key === 'Escape') {
        setSelectedId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, historyIndex, history]);

  // ---------------------------------------------------------------------------
  // 4. SAVE & AUTOSAVE (Phase 12)
  // ---------------------------------------------------------------------------
  const handleSave = async () => {
    if (!template) return;
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const res = await fetch(`/api/admin/studio/templates/${template.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      });
      const data = await res.json();
      if (res.ok) {
        setIsSaved(true);
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastSavedTime(timeStr);
        setSaveMessage(`Saved v${data.version} at ${timeStr}`);
        localStorage.removeItem(`studio_draft_${template.id}`);
        setTimeout(() => setSaveMessage(null), 3500);
      } else {
        alert(data.error || 'Failed to save template');
      }
    } catch (err) {
      console.error('Error saving template:', err);
      alert('Save failed. Check network connection.');
    } finally {
      setIsSaving(false);
    }
  };

  // Debounced Autosave (3 seconds)
  useEffect(() => {
    if (isSaved || !template) return;

    const timer = setTimeout(() => {
      handleSave();
    }, 3000);

    return () => clearTimeout(timer);
  }, [template, isSaved]);

  // ---------------------------------------------------------------------------
  // 5. ELEMENT CRUD OPERATIONS (Phase 4 & 5)
  // ---------------------------------------------------------------------------
  const addElement = (newElement: StudioElement) => {
    if (!template) return;
    const elements = [...(template.elements || []), newElement];
    setTemplate({ ...template, elements });
    pushHistory(elements);
    setSelectedId(newElement.id);
  };

  const updateSelectedElement = (updates: Partial<StudioElement>) => {
    if (!template || !selectedId) return;
    const elements = template.elements.map((el) =>
      el.id === selectedId ? ({ ...el, ...updates } as StudioElement) : el
    );
    setTemplate({ ...template, elements });
    pushHistory(elements);
  };

  const deleteElement = (id: string) => {
    if (!template) return;
    const elements = template.elements.filter((el) => el.id !== id);
    setTemplate({ ...template, elements });
    pushHistory(elements);
    if (selectedId === id) setSelectedId(null);
  };

  const duplicateElement = (id: string) => {
    if (!template) return;
    const target = template.elements.find((el) => el.id === id);
    if (!target) return;
    const clone: StudioElement = {
      ...target,
      id: `el_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: target.name ? `${target.name} (Copy)` : undefined,
      x: target.x + 16,
      y: target.y + 16,
      zIndex: (template.elements.length || 0) + 1,
    };
    addElement(clone);
  };

  const nudgeElement = (id: string, dx: number, dy: number) => {
    if (!template) return;
    const elements = template.elements.map((el) =>
      el.id === id ? { ...el, x: Math.max(0, el.x + dx), y: Math.max(0, el.y + dy) } : el
    );
    setTemplate({ ...template, elements });
    pushHistory(elements);
  };

  // Layer Ordering
  const bringForward = (id: string) => {
    if (!template) return;
    const elements = [...template.elements];
    const idx = elements.findIndex((el) => el.id === id);
    if (idx < elements.length - 1) {
      const temp = elements[idx];
      elements[idx] = elements[idx + 1];
      elements[idx + 1] = temp;
      elements.forEach((el, i) => (el.zIndex = i + 1));
      setTemplate({ ...template, elements });
      pushHistory(elements);
    }
  };

  const sendBackward = (id: string) => {
    if (!template) return;
    const elements = [...template.elements];
    const idx = elements.findIndex((el) => el.id === id);
    if (idx > 0) {
      const temp = elements[idx];
      elements[idx] = elements[idx - 1];
      elements[idx - 1] = temp;
      elements.forEach((el, i) => (el.zIndex = i + 1));
      setTemplate({ ...template, elements });
      pushHistory(elements);
    }
  };

  const bringToFront = (id: string) => {
    if (!template) return;
    const target = template.elements.find((el) => el.id === id);
    if (!target) return;
    const elements = [...template.elements.filter((el) => el.id !== id), target];
    elements.forEach((el, i) => (el.zIndex = i + 1));
    setTemplate({ ...template, elements });
    pushHistory(elements);
  };

  const sendToBack = (id: string) => {
    if (!template) return;
    const target = template.elements.find((el) => el.id === id);
    if (!target) return;
    const elements = [target, ...template.elements.filter((el) => el.id !== id)];
    elements.forEach((el, i) => (el.zIndex = i + 1));
    setTemplate({ ...template, elements });
    pushHistory(elements);
  };

  // Alignments
  const alignElement = (type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (!template || !selectedId) return;
    const el = template.elements.find((e) => e.id === selectedId);
    if (!el) return;

    let newX = el.x;
    let newY = el.y;
    const canvasW = template.width_pt;
    const canvasH = template.height_pt;

    if (type === 'left') newX = 30;
    if (type === 'center') newX = (canvasW - el.width) / 2;
    if (type === 'right') newX = canvasW - el.width - 30;
    if (type === 'top') newY = 30;
    if (type === 'middle') newY = (canvasH - el.height) / 2;
    if (type === 'bottom') newY = canvasH - el.height - 30;

    updateSelectedElement({ x: Math.round(newX), y: Math.round(newY) });
  };

  // ---------------------------------------------------------------------------
  // 6. REUSABLE DESIGN BLOCKS & TEMPLATE DUPLICATION (Phase 9)
  // ---------------------------------------------------------------------------
  const handleInsertDesignBlock = (block: ReusableDesignBlock) => {
    if (!template) return;
    const timestamp = Date.now();
    const clonedElements: StudioElement[] = block.elements.map((el, i) => ({
      ...el,
      id: `block_el_${timestamp}_${i}`,
      zIndex: (template.elements.length || 0) + i + 1,
    }));

    const combined = [...template.elements, ...clonedElements];
    setTemplate({ ...template, elements: combined });
    pushHistory(combined);
    if (clonedElements.length > 0) setSelectedId(clonedElements[0].id);
  };

  const handleDuplicateTemplate = async () => {
    if (!template) return;
    const newName = prompt('Enter title for duplicated template:', `${template.title} (Duplicate)`);
    if (!newName) return;

    try {
      const res = await fetch('/api/admin/studio/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duplicateFromId: template.id,
          title: newName,
        }),
      });
      const data = await res.json();
      if (data.template) {
        alert('Template duplicated successfully!');
        router.push(`/admin/studio/designer/${data.template.id}`);
      } else {
        alert(data.error || 'Failed to duplicate template');
      }
    } catch (e) {
      console.error('Duplication error:', e);
      alert('Error duplicating template');
    }
  };

  // ---------------------------------------------------------------------------
  // 7. BACKGROUND UPLOAD & RESOLUTION CHECK (Phase 7)
  // ---------------------------------------------------------------------------
  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !template) return;
    setIsUploadingBg(true);
    setBgResolutionWarning(null);

    // Read image dimensions locally for resolution check
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      // 150 DPI threshold: width in pt * (150 / 72)
      const minRecommendedW = template.width_pt * 2;
      const minRecommendedH = template.height_pt * 2;
      if (img.naturalWidth < minRecommendedW || img.naturalHeight < minRecommendedH) {
        setBgResolutionWarning(
          `Image resolution (${img.naturalWidth} × ${img.naturalHeight}px) may appear slightly soft when printed. Recommended: at least ${Math.round(minRecommendedW)} × ${Math.round(minRecommendedH)}px.`
        );
      }
    };

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('role', 'studio_background');

      const res = await fetch('/api/admin/studio/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.url) {
        setTemplate({ ...template, background_url: data.url });
        setIsSaved(false);
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Upload failed. Check connection.');
    } finally {
      setIsUploadingBg(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 8. ELEMENT CREATION HELPERS (Phase 4)
  // ---------------------------------------------------------------------------
  const handleAddText = (content = 'Official Heading', isHeading = true) => {
    const el: TextElement = {
      id: `el_text_${Date.now()}`,
      name: isHeading ? 'Heading Block' : 'Body Text',
      type: 'text',
      content,
      fontFamily: isHeading ? 'Helvetica-Bold' : 'Helvetica',
      fontSize: isHeading ? 20 : 12,
      fontWeight: isHeading ? 'bold' : 'normal',
      color: '#0F172A',
      textAlign: 'left',
      x: 60,
      y: 100,
      width: isHeading ? 320 : 260,
      height: isHeading ? 30 : 20,
      textFitting: 'wrap',
      minFontSize: 8,
      zIndex: (template?.elements?.length || 0) + 1,
    };
    addElement(el);
  };

  const handleAddField = (token: string, name: string) => {
    const el: FieldElement = {
      id: `el_field_${Date.now()}`,
      name: name || 'Dynamic Field',
      type: 'field',
      token,
      fallbackText: name,
      fontFamily: 'Helvetica-Bold',
      fontSize: 14,
      fontWeight: 'bold',
      color: '#0F172A',
      textAlign: 'left',
      x: 60,
      y: 160,
      width: 290,
      height: 24,
      textFitting: 'shrink',
      minFontSize: 9,
      zIndex: (template?.elements?.length || 0) + 1,
    };
    addElement(el);
  };

  const handleAddQr = (qrType: QrVerificationType = 'pass_verification') => {
    const el: QrElement = {
      id: `el_qr_${Date.now()}`,
      name: qrType === 'pass_verification' ? 'Pass Verification QR' : 'Certificate QR',
      type: 'qr',
      qrType,
      darkColor: '#0F172A',
      lightColor: '#FFFFFF',
      showQuietZone: true,
      showCaption: true,
      captionText: qrType === 'pass_verification' ? 'SCAN TO VERIFY' : 'VERIFY CERTIFICATE',
      x: 390,
      y: 140,
      width: 120,
      height: 120,
      zIndex: (template?.elements?.length || 0) + 1,
    };
    addElement(el);
  };

  const handleAddShape = (shapeType: ShapeType) => {
    const el: ShapeElement = {
      id: `el_shape_${Date.now()}`,
      name: shapeType === 'line' ? 'Divider Line' : shapeType === 'circle' ? 'Circle Accent' : 'Card Frame',
      type: 'shape',
      shapeType,
      fillColor: shapeType === 'line' ? 'transparent' : '#F8FAFC',
      borderColor: '#CBD5E1',
      borderWidth: 1,
      borderRadius: shapeType === 'rounded_rectangle' ? 8 : 0,
      x: 50,
      y: 120,
      width: shapeType === 'line' ? 495 : 200,
      height: shapeType === 'line' ? 2 : 100,
      zIndex: (template?.elements?.length || 0) + 1,
    };
    addElement(el);
  };

  const handleAddImage = (imageUrl = '', name = 'Image Element') => {
    const el: ImageElement = {
      id: `el_img_${Date.now()}`,
      name,
      type: 'image',
      imageUrl,
      altText: name,
      fit: 'contain',
      x: 100,
      y: 150,
      width: 140,
      height: 140,
      zIndex: (template?.elements?.length || 0) + 1,
    };
    addElement(el);
  };

  const handleAddSignature = (signatureUrl = '', signatoryName = 'Authorized Signatory', designation = 'Coordinator') => {
    const sigImgId = `el_sig_${Date.now()}`;
    const sigEl: ImageElement = {
      id: sigImgId,
      name: `Signature (${signatoryName})`,
      type: 'image',
      imageUrl: signatureUrl,
      altText: `Signature of ${signatoryName}`,
      fit: 'contain',
      x: 60,
      y: Math.max(20, (template?.height_pt || 595) - 130),
      width: 130,
      height: 50,
      zIndex: (template?.elements?.length || 0) + 1,
    };

    const textEl: TextElement = {
      id: `el_sig_txt_${Date.now()}`,
      name: `Signatory Label (${signatoryName})`,
      type: 'text',
      content: `${signatoryName}\n${designation}`,
      fontFamily: 'Helvetica-Bold',
      fontSize: 9,
      fontWeight: 'bold',
      color: '#0F172A',
      textAlign: 'center',
      x: 60,
      y: Math.max(60, (template?.height_pt || 595) - 75),
      width: 130,
      height: 30,
      zIndex: (template?.elements?.length || 0) + 2,
    };

    if (!template) return;
    const combined = [...(template.elements || []), sigEl, textEl];
    setTemplate({ ...template, elements: combined });
    pushHistory(combined);
    setSelectedId(sigImgId);
  };

  const handleSelectPaperPreset = (size: PaperSize) => {
    if (!template) return;
    if (size === 'CUSTOM') {
      setTemplate({ ...template, paper_size: 'CUSTOM' });
      setIsSaved(false);
      return;
    }
    const preset = PAPER_DIMENSIONS[size]?.[template.orientation];
    if (!preset) return;

    const newW = preset.widthPt;
    const newH = preset.heightPt;

    const clampedElements = template.elements.map((el) => ({
      ...el,
      x: Math.min(el.x, Math.max(0, newW - (el.width || 40))),
      y: Math.min(el.y, Math.max(0, newH - (el.height || 20))),
    }));

    setTemplate({
      ...template,
      paper_size: size,
      width_pt: newW,
      height_pt: newH,
      elements: clampedElements,
    });
    setIsSaved(false);
    pushHistory(clampedElements);
  };

  const handleToggleOrientation = (ori: Orientation) => {
    if (!template || template.orientation === ori) return;

    let newW = template.height_pt;
    let newH = template.width_pt;

    if (template.paper_size !== 'CUSTOM' && PAPER_DIMENSIONS[template.paper_size]) {
      const preset = PAPER_DIMENSIONS[template.paper_size][ori];
      if (preset) {
        newW = preset.widthPt;
        newH = preset.heightPt;
      }
    }

    const clampedElements = template.elements.map((el) => ({
      ...el,
      x: Math.min(el.x, Math.max(0, newW - (el.width || 40))),
      y: Math.min(el.y, Math.max(0, newH - (el.height || 20))),
    }));

    setTemplate({
      ...template,
      orientation: ori,
      width_pt: newW,
      height_pt: newH,
      elements: clampedElements,
    });
    setIsSaved(false);
    pushHistory(clampedElements);
  };

  const handleCustomDimensionChange = (key: 'width_pt' | 'height_pt', value: number) => {
    if (!template) return;
    const clampedVal = Math.max(50, Math.min(5000, value));
    const newTemplate = {
      ...template,
      paper_size: 'CUSTOM' as PaperSize,
      [key]: clampedVal,
    };
    if (key === 'width_pt') {
      newTemplate.elements = newTemplate.elements.map((el) => ({
        ...el,
        x: Math.min(el.x, Math.max(0, clampedVal - (el.width || 40))),
      }));
    } else {
      newTemplate.elements = newTemplate.elements.map((el) => ({
        ...el,
        y: Math.min(el.y, Math.max(0, clampedVal - (el.height || 20))),
      }));
    }
    setTemplate(newTemplate);
    setIsSaved(false);
  };

  // ---------------------------------------------------------------------------
  // 9. SMART ALIGNMENT & CANVAS DRAG / RESIZE (Phase 5)
  // ---------------------------------------------------------------------------
  const handleMouseDownElement = (e: React.MouseEvent, el: StudioElement) => {
    e.stopPropagation();
    setSelectedId(el.id);
    setContextMenu(null);
    if (el.isLocked) {
      return;
    }

    setIsDragging(true);
    setDragOffset({
      x: e.clientX / zoom - el.x,
      y: e.clientY / zoom - el.y,
    });
  };

  const handleContextMenuElement = (e: React.MouseEvent, el: StudioElement) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedId(el.id);
    setContextMenu({
      x: Math.min(window.innerWidth - 210, e.clientX),
      y: Math.min(window.innerHeight - 240, e.clientY),
      elementId: el.id,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!template || !selectedId) return;

    if (isDragging) {
      let newX = e.clientX / zoom - dragOffset.x;
      let newY = e.clientY / zoom - dragOffset.y;

      const activeEl = template.elements.find((el) => el.id === selectedId);
      const elW = activeEl?.width || 50;
      const elH = activeEl?.height || 20;

      // Document-coordinate alignment guides & snapping
      const snapThreshold = 6;
      let guideX: number | null = null;
      let guideY: number | null = null;
      let gLabelX: string | null = null;
      let gLabelY: string | null = null;

      const elementCenterX = newX + elW / 2;
      const elementCenterY = newY + elH / 2;

      if (snapToCenter) {
        // Page Center X
        const canvasCenterX = template.width_pt / 2;
        if (Math.abs(elementCenterX - canvasCenterX) < snapThreshold) {
          newX = canvasCenterX - elW / 2;
          guideX = canvasCenterX;
          gLabelX = 'Page Center';
        }
        // Page Center Y
        const canvasCenterY = template.height_pt / 2;
        if (Math.abs(elementCenterY - canvasCenterY) < snapThreshold) {
          newY = canvasCenterY - elH / 2;
          guideY = canvasCenterY;
          gLabelY = 'Page Center';
        }

        // Align with page boundaries
        if (guideX === null) {
          if (Math.abs(newX) < snapThreshold) {
            newX = 0;
            guideX = 0;
            gLabelX = 'Page Left';
          } else if (Math.abs(newX + elW - template.width_pt) < snapThreshold) {
            newX = template.width_pt - elW;
            guideX = template.width_pt;
            gLabelX = 'Page Right';
          }
        }

        if (guideY === null) {
          if (Math.abs(newY) < snapThreshold) {
            newY = 0;
            guideY = 0;
            gLabelY = 'Page Top';
          } else if (Math.abs(newY + elH - template.height_pt) < snapThreshold) {
            newY = template.height_pt - elH;
            guideY = template.height_pt;
            gLabelY = 'Page Bottom';
          }
        }

        // Align with other visible elements
        for (const other of template.elements) {
          if (other.id === selectedId || other.isHidden) continue;
          const otherCenterX = other.x + (other.width || 0) / 2;
          const otherCenterY = other.y + (other.height || 0) / 2;

          if (guideX === null) {
            if (Math.abs(elementCenterX - otherCenterX) < snapThreshold) {
              newX = otherCenterX - elW / 2;
              guideX = otherCenterX;
              gLabelX = 'Align Center';
            } else if (Math.abs(newX - other.x) < snapThreshold) {
              newX = other.x;
              guideX = other.x;
              gLabelX = 'Align Left';
            } else if (Math.abs(newX + elW - (other.x + (other.width || 0))) < snapThreshold) {
              newX = other.x + (other.width || 0) - elW;
              guideX = other.x + (other.width || 0);
              gLabelX = 'Align Right';
            }
          }

          if (guideY === null) {
            if (Math.abs(elementCenterY - otherCenterY) < snapThreshold) {
              newY = otherCenterY - elH / 2;
              guideY = otherCenterY;
              gLabelY = 'Align Middle';
            } else if (Math.abs(newY - other.y) < snapThreshold) {
              newY = other.y;
              guideY = other.y;
              gLabelY = 'Align Top';
            } else if (Math.abs(newY + elH - (other.y + (other.height || 0))) < snapThreshold) {
              newY = other.y + (other.height || 0) - elH;
              guideY = other.y + (other.height || 0);
              gLabelY = 'Align Bottom';
            }
          }
        }
      }

      // Snap to Grid if no guide line
      if (snapToGrid && guideX === null && guideY === null) {
        newX = Math.round(newX / gridSize) * gridSize;
        newY = Math.round(newY / gridSize) * gridSize;
      }

      setActiveGuideX(guideX);
      setActiveGuideY(guideY);
      setGuideLabelX(gLabelX);
      setGuideLabelY(gLabelY);

      // Clamp inside canvas boundary
      const clampedX = Math.max(0, Math.min(Math.round(newX), template.width_pt - 10));
      const clampedY = Math.max(0, Math.min(Math.round(newY), template.height_pt - 10));

      setTemplate((prev) =>
        prev
          ? {
              ...prev,
              elements: prev.elements.map((el) =>
                el.id === selectedId ? { ...el, x: clampedX, y: clampedY } : el
              ),
            }
          : prev
      );
    } else if (isResizing && resizeHandle) {
      const deltaX = (e.clientX - resizeStart.mouseX) / zoom;
      const deltaY = (e.clientY - resizeStart.mouseY) / zoom;

      let newWidth = resizeStart.width;
      let newHeight = resizeStart.height;
      let newX = resizeStart.x;
      let newY = resizeStart.y;

      if (resizeHandle.includes('e')) newWidth = Math.max(20, resizeStart.width + deltaX);
      if (resizeHandle.includes('s')) newHeight = Math.max(10, resizeStart.height + deltaY);
      if (resizeHandle.includes('w')) {
        const potentialW = Math.max(20, resizeStart.width - deltaX);
        newX = resizeStart.x + (resizeStart.width - potentialW);
        newWidth = potentialW;
      }
      if (resizeHandle.includes('n')) {
        const potentialH = Math.max(10, resizeStart.height - deltaY);
        newY = resizeStart.y + (resizeStart.height - potentialH);
        newHeight = potentialH;
      }

      setTemplate((prev) =>
        prev
          ? {
              ...prev,
              elements: prev.elements.map((el) =>
                el.id === selectedId
                  ? {
                      ...el,
                      x: Math.round(newX),
                      y: Math.round(newY),
                      width: Math.round(newWidth),
                      height: Math.round(newHeight),
                    }
                  : el
              ),
            }
          : prev
      );
    }
  };

  const handleMouseUp = () => {
    setActiveGuideX(null);
    setActiveGuideY(null);
    setGuideLabelX(null);
    setGuideLabelY(null);
    if (isDragging || isResizing) {
      setIsDragging(false);
      setIsResizing(false);
      setResizeHandle(null);
      if (template) pushHistory(template.elements);
    }
  };

  const handleStartResize = (e: React.MouseEvent, handle: string, el: StudioElement) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeHandle(handle);
    setResizeStart({
      x: el.x,
      y: el.y,
      width: el.width,
      height: el.height,
      mouseX: e.clientX,
      mouseY: e.clientY,
    });
  };

  // ---------------------------------------------------------------------------
  // 10. VALIDATION & PDF PREVIEW GENERATION (Phase 10 & 11)
  // ---------------------------------------------------------------------------
  const handleOpenValidation = () => {
    if (!template) return;
    const report = validateTemplate(template);
    setValidationReport(report);
    setShowValidationModal(true);
  };

  const openPdfPreview = async () => {
    if (!template) return;
    setShowPreviewModal(true);
    setPreviewMode('pdf');
    setPdfLoading(true);

    try {
      const res = await fetch('/api/admin/studio/preview/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template,
          competitionSlug: previewCompSlug,
        }),
      });

      if (res.ok) {
        const blob = await res.blob();
        if (pdfUrl) URL.revokeObjectURL(pdfUrl);
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      }
    } catch (err) {
      console.error('Error generating PDF preview:', err);
    } finally {
      setPdfLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // RENDER CHECKS
  // ---------------------------------------------------------------------------
  if (loading || !template) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-600 bg-slate-50">
        <Sparkles className="w-8 h-8 animate-spin text-blue-600 mb-3" />
        <span className="text-sm font-semibold tracking-wide">Loading YUGANTAR 2026 Visual Design Studio...</span>
      </div>
    );
  }

  const selectedElement = template.elements.find((el) => el.id === selectedId);
  const aspectRatio = (template.width_pt / template.height_pt).toFixed(2);
  const quickReport = validateTemplate(template);

  return (
    <div
      className="flex flex-col h-[calc(100vh-4.5rem)] select-none overflow-hidden -mx-4 sm:-mx-6 -mb-8 bg-slate-100 text-slate-800"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* --------------------------------------------------------------------- */}
      {/* DRAFT RECOVERY BANNER (Phase 12)                                       */}
      {/* --------------------------------------------------------------------- */}
      {showDraftRecovery && recoveredDraft && (
        <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-between text-xs font-medium z-50 shadow-md">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Found an autosaved local draft with unsaved changes. Would you like to restore it?</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setTemplate(recoveredDraft);
                setHistory([recoveredDraft.elements]);
                setHistoryIndex(0);
                setIsSaved(false);
                setShowDraftRecovery(false);
              }}
              className="px-2.5 py-1 bg-white text-amber-800 rounded font-bold hover:bg-amber-50 transition-colors"
            >
              Restore Draft
            </button>
            <button
              onClick={() => {
                localStorage.removeItem(`studio_draft_${templateId}`);
                setShowDraftRecovery(false);
              }}
              className="px-2 py-1 text-white hover:underline"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 1. TOP STUDIO TOOLBAR (Phase 2 & 3)                                    */}
      {/* ===================================================================== */}
      <header className="h-14 bg-white border-b border-slate-200 px-3 sm:px-4 flex items-center justify-between gap-3 z-30 shrink-0 shadow-xs">
        {/* Left: Back & Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link
            href="/admin/studio"
            className="p-1.5 sm:p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0"
            title="Back to Studio Library"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <button
            onClick={() => setIsLeftCollapsed(!isLeftCollapsed)}
            className={`hidden md:flex p-1.5 rounded-lg border transition-colors cursor-pointer shrink-0 ${
              isLeftCollapsed ? 'bg-blue-50 border-blue-200 text-blue-600' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
            title={isLeftCollapsed ? 'Expand Tools Sidebar' : 'Collapse Tools Sidebar (Maximize Canvas)'}
          >
            <Columns className="w-4 h-4" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={template.title}
                onChange={(e) => {
                  setTemplate({ ...template, title: e.target.value });
                  setIsSaved(false);
                }}
                className="font-bold text-xs sm:text-sm text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-600 focus:outline-none px-1 truncate max-w-[130px] sm:max-w-xs"
              />
              <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 uppercase tracking-wide border border-blue-200">
                {template.type.replace('_', ' ')}
              </span>
            </div>
            <div className="hidden sm:flex text-[11px] text-slate-500 px-1 items-center gap-2">
              <span>{template.paper_size} ({Math.round(template.width_pt)} × {Math.round(template.height_pt)} pt)</span>
              <span>•</span>
              <span>v{template.version}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${isSaved ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                {isSaving ? 'Autosaving...' : isSaved ? (lastSavedTime ? `Saved at ${lastSavedTime}` : 'All changes saved') : 'Unsaved changes'}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Desktop Controls (Zoom, Fit, Grid, Undo/Redo) */}
        <div className="hidden md:flex items-center gap-2">
          {/* Zoom Controls */}
          <div className="flex items-center rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
            <button
              onClick={() => setZoom((z) => Math.max(0.2, Number((z - 0.1).toFixed(2))))}
              className="p-1.5 rounded hover:bg-white text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <select
              value={Math.round(zoom * 100)}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'fit') handleFitToScreen();
                else setZoom(Number(val) / 100);
              }}
              className="px-1.5 py-0.5 bg-transparent font-mono font-semibold text-slate-700 text-xs focus:outline-none cursor-pointer"
            >
              <option value="50">50%</option>
              <option value="75">75%</option>
              <option value="100">100%</option>
              <option value="125">125%</option>
              <option value="150">150%</option>
              <option value="200">200%</option>
              <option value="fit">Fit</option>
            </select>
            <button
              onClick={() => setZoom((z) => Math.min(2.5, Number((z + 0.1).toFixed(2))))}
              className="p-1.5 rounded hover:bg-white text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleFitToScreen}
              className="px-2 py-1 rounded hover:bg-white text-[11px] text-slate-600 hover:text-blue-600 font-medium transition-colors cursor-pointer"
              title="Fit Document to Screen"
            >
              Fit
            </button>
            <button
              onClick={() => setZoom(1.0)}
              className="px-1.5 py-1 rounded hover:bg-white text-[11px] text-slate-500 hover:text-slate-800 font-medium transition-colors cursor-pointer"
              title="Reset Zoom to 100%"
            >
              1:1
            </button>
          </div>

          {/* Grid & Snapping Toggles */}
          <button
            onClick={() => setShowGrid((g) => !g)}
            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
              showGrid ? 'bg-blue-50 border-blue-200 text-blue-600 font-semibold' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
            title="Toggle Grid (16pt)"
          >
            <Grid className="w-4 h-4" />
          </button>

          <button
            onClick={() => setSnapToCenter((s) => !s)}
            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
              snapToCenter ? 'bg-blue-50 border-blue-200 text-blue-600 font-semibold' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
            title="Toggle Center Alignment Guides & Snapping"
          >
            <Compass className="w-4 h-4" />
          </button>

          {/* Sample Data Toggle */}
          <button
            onClick={() => setPreviewSampleData((p) => !p)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
              previewSampleData ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            {previewSampleData ? 'Sample Data' : 'Raw Tokens'}
          </button>

          {/* Preview Arena Selector */}
          {previewSampleData && (
            <select
              value={previewCompSlug}
              onChange={(e) => setPreviewCompSlug(e.target.value)}
              className="px-2 py-1 text-xs rounded-lg bg-white border border-slate-200 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {COMPETITIONS.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          )}

          {/* Undo / Redo */}
          <div className="flex items-center gap-1 ml-1">
            <button
              onClick={undo}
              disabled={historyIndex <= 0}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-30 hover:bg-slate-50 cursor-pointer"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-30 hover:bg-slate-50 cursor-pointer"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Checklist, Preview, Duplicate, Save */}
        <div className="flex items-center gap-2">
          {/* Properties Panel Toggle (Desktop) */}
          <button
            onClick={() => setIsRightCollapsed(!isRightCollapsed)}
            className={`hidden lg:flex p-1.5 rounded-lg border transition-colors cursor-pointer shrink-0 ${
              isRightCollapsed ? 'bg-blue-50 border-blue-200 text-blue-600' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
            title={isRightCollapsed ? 'Expand Properties Inspector' : 'Collapse Properties Inspector (Maximize Canvas)'}
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Properties Sheet Toggle (Mobile/Tablet) */}
          <button
            onClick={() => setShowMobilePropsModal(true)}
            className={`lg:hidden inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-xs ${
              selectedId ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title="Inspect Element Properties"
          >
            <Sliders className="w-3.5 h-3.5 text-blue-600" />
            <span>Props</span>
          </button>

          {saveMessage && (
            <span className="hidden lg:inline text-xs text-emerald-600 font-semibold animate-pulse">
              {saveMessage}
            </span>
          )}

          {/* Pre-publish Checklist Button */}
          <button
            id="btn-open-checklist"
            onClick={handleOpenValidation}
            className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-xs ${
              quickReport.isValid
                ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                : 'bg-amber-50 border-amber-300 text-amber-700'
            }`}
            title="Pre-publish Template Validation Checklist"
          >
            <CheckCircle2 className={`w-3.5 h-3.5 ${quickReport.isValid ? 'text-emerald-500' : 'text-amber-500'}`} />
            <span className="hidden sm:inline">Checklist</span>
            <span className={`px-1 rounded text-[10px] font-bold ${quickReport.isValid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-200 text-amber-900'}`}>
              {quickReport.items.filter((i) => i.status === 'pass').length}/{quickReport.items.length}
            </span>
          </button>

          {/* Live Preview Button */}
          <button
            id="btn-open-preview"
            onClick={() => {
              setShowPreviewModal(true);
              setPreviewMode('design');
            }}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Preview</span>
          </button>

          {/* Save Button */}
          <button
            id="btn-save-template"
            onClick={handleSave}
            disabled={isSaving}
            className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl text-xs font-semibold text-white transition-all shadow-xs cursor-pointer disabled:opacity-50 ${
              isSaved ? 'bg-slate-800 hover:bg-slate-900' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20 shadow-md'
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : isSaved ? 'Saved' : 'Save'}</span>
          </button>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* 2. MAIN 3-PANEL STUDIO WORKSPACE (Phase 2 & 3)                        */}
      {/* ===================================================================== */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* ------------------------------------------------------------------- */}
        {/* LEFT PANEL: 6 ORGANIZED TABS (Desktop & Tablet)                     */}
        {/* ------------------------------------------------------------------- */}
        <aside className={`${isLeftCollapsed ? 'hidden' : 'hidden md:flex'} w-72 lg:w-80 bg-white border-r border-slate-200 flex-col shrink-0 z-20 shadow-xs`}>
          {/* Tab Navigation (6 Tabs) */}
          <div className="grid grid-cols-6 border-b border-slate-200 bg-slate-50 p-1 gap-0.5 text-slate-600">
            {[
              { id: 'elements', label: 'Add', icon: Plus, title: 'Add Elements' },
              { id: 'fields', label: 'Fields', icon: Type, title: 'Dynamic Data Fields' },
              { id: 'uploads', label: 'Upload', icon: Upload, title: 'Canva / Background Uploads' },
              { id: 'layers', label: 'Layers', icon: Layers, title: 'Layers & Ordering' },
              { id: 'templates', label: 'Blocks', icon: Bookmark, title: 'Reusable Design Blocks' },
              { id: 'page', label: 'Page', icon: Columns, title: 'Page Sizing & Grid' },
            ].map((tab) => (
              <button
                key={tab.id}
                id={`tab-btn-${tab.id}`}
                onClick={() => setLeftTab(tab.id as any)}
                title={tab.title}
                className={`py-2 text-[10px] font-bold rounded flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                  leftTab === tab.id
                    ? 'bg-white text-blue-600 shadow-xs border border-slate-200'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                <span className="truncate">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* TAB 1: ADD BASIC ELEMENTS (Phase 4) */}
          {leftTab === 'elements' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {/* Text Elements */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Typography Blocks
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleAddText('Official Heading', true)}
                    className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-left transition-all cursor-pointer group"
                  >
                    <div className="font-bold text-xs text-slate-900 group-hover:text-blue-700">Heading</div>
                    <div className="text-[10px] text-slate-500">20pt bold</div>
                  </button>
                  <button
                    onClick={() => handleAddText('Subheading / Caption', false)}
                    className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-left transition-all cursor-pointer group"
                  >
                    <div className="font-medium text-xs text-slate-900 group-hover:text-blue-700">Subheading</div>
                    <div className="text-[10px] text-slate-500">12pt regular</div>
                  </button>
                </div>
              </div>

              {/* Security QR Codes */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Security QR Codes
                </span>
                <div className="space-y-2">
                  <button
                    onClick={() => handleAddQr('pass_verification')}
                    className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-left flex items-center gap-3 transition-all cursor-pointer group"
                  >
                    <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                        Pass Verification QR
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Resolves to /verify/[token]
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleAddQr('cert_verification')}
                    className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 text-left flex items-center gap-3 transition-all cursor-pointer group"
                  >
                    <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-amber-800">
                        Certificate Verification QR
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Tamper-proof credential audit
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Shapes & Accents */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Shapes & Accents
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleAddShape('rectangle')}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center gap-2 text-xs font-medium text-slate-800 cursor-pointer"
                  >
                    <Square className="w-4 h-4 text-blue-600" />
                    Rectangle
                  </button>
                  <button
                    onClick={() => handleAddShape('rounded_rectangle')}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center gap-2 text-xs font-medium text-slate-800 cursor-pointer"
                  >
                    <div className="w-4 h-4 border-2 border-blue-600 rounded" />
                    Card / Pill
                  </button>
                  <button
                    onClick={() => handleAddShape('circle')}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center gap-2 text-xs font-medium text-slate-800 cursor-pointer"
                  >
                    <Circle className="w-4 h-4 text-blue-600" />
                    Circle
                  </button>
                  <button
                    onClick={() => handleAddShape('line')}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center gap-2 text-xs font-medium text-slate-800 cursor-pointer"
                  >
                    <Minus className="w-4 h-4 text-blue-600" />
                    Divider Line
                  </button>
                </div>
              </div>

              {/* Images, Logos & Signatures */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Images &amp; Signatures
                </span>
                <div className="space-y-2">
                  <label className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-left flex items-center gap-3 transition-all cursor-pointer group">
                    <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                        Insert Image / Logo
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Upload PNG, JPEG, SVG stamp or emblem
                      </div>
                    </div>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const formData = new FormData();
                        formData.append('file', file);
                        formData.append('role', 'studio_element');
                        try {
                          const res = await fetch('/api/admin/studio/upload', {
                            method: 'POST',
                            body: formData,
                          });
                          const data = await res.json();
                          if (data.url) {
                            handleAddImage(data.url, file.name.replace(/\.[^/.]+$/, ''));
                          } else {
                            alert(data.error || 'Upload failed');
                          }
                        } catch (err) {
                          alert('Upload failed');
                        }
                      }}
                    />
                  </label>

                  <label className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-left flex items-center gap-3 transition-all cursor-pointer group">
                    <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">
                        Add Official Signature
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Upload signature PNG + signatory title
                      </div>
                    </div>
                    <input
                      type="file"
                      accept="image/png,image/webp,image/svg+xml"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const sigName = prompt('Enter Signatory Name:', 'Dr. S. A. Patil') || 'Authorized Signatory';
                        const sigRole = prompt('Enter Signatory Designation:', 'Head of Department') || 'Coordinator';
                        const formData = new FormData();
                        formData.append('file', file);
                        formData.append('role', 'studio_signature');
                        try {
                          const res = await fetch('/api/admin/studio/upload', {
                            method: 'POST',
                            body: formData,
                          });
                          const data = await res.json();
                          if (data.url) {
                            handleAddSignature(data.url, sigName, sigRole);
                          } else {
                            alert(data.error || 'Upload failed');
                          }
                        } catch (err) {
                          alert('Upload failed');
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DATA FIELDS (Phase 4) */}
          {leftTab === 'fields' && (
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search participant, team, cert tokens..."
                  value={tokenSearch}
                  onChange={(e) => setTokenSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-4">
                {DATA_TOKEN_CATEGORIES.map((category) => {
                  const filteredTokens = category.tokens.filter(
                    (t) =>
                      t.name.toLowerCase().includes(tokenSearch.toLowerCase()) ||
                      t.token.toLowerCase().includes(tokenSearch.toLowerCase())
                  );
                  if (filteredTokens.length === 0) return null;

                  return (
                    <div key={category.category} className="space-y-1.5">
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-1">
                        {category.category}
                      </div>
                      <div className="space-y-1">
                        {filteredTokens.map((t) => (
                          <button
                            key={t.token}
                            onClick={() => handleAddField(t.token, t.name)}
                            className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 transition-all flex items-center justify-between group cursor-pointer"
                          >
                            <div>
                              <div className="text-xs font-semibold text-slate-800 group-hover:text-blue-700">
                                {t.name}
                              </div>
                              <code className="text-[10px] text-slate-500 font-mono">
                                {t.token}
                              </code>
                            </div>
                            <Plus className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: CANVA / AI ARTWORK UPLOAD & SIZING (Phase 7) */}
          {leftTab === 'uploads' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              <div>
                <h4 className="text-xs font-bold text-slate-900 mb-1">
                  Upload Canva / AI Artwork
                </h4>
                <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
                  Upload a PNG, JPEG, or WebP background. Dynamic text, badges, and QR codes will overlay with vector precision.
                </p>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleBgUpload}
                  className="hidden"
                />

                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingBg}
                  className="w-full py-5 px-3 border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/50 rounded-xl flex flex-col items-center justify-center gap-2 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                >
                  <Upload className="w-5 h-5 text-blue-600" />
                  {isUploadingBg ? 'Uploading image...' : 'Click to Upload Background'}
                  <span className="text-[10px] text-slate-400 font-normal">
                    Max 10MB • High-res PNG/JPEG recommended
                  </span>
                </button>
              </div>

              {bgResolutionWarning && (
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-start gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                  <span>{bgResolutionWarning}</span>
                </div>
              )}

              {template.background_url && (
                <div className="space-y-3 pt-3 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      Active Background
                    </span>
                    <button
                      onClick={() => {
                        setTemplate({ ...template, background_url: null });
                        setIsSaved(false);
                      }}
                      className="text-xs text-rose-600 hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="w-full h-24 rounded-lg bg-slate-900 overflow-hidden relative border border-slate-200">
                    <img
                      src={template.background_url}
                      alt="Background preview"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Fitting options */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Background Fitting
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 text-xs">
                      {(['cover', 'contain', 'stretch'] as const).map((fit) => (
                        <button
                          key={fit}
                          onClick={() => {
                            setTemplate({ ...template, background_fit: fit });
                            setIsSaved(false);
                          }}
                          className={`py-1.5 rounded-lg border font-medium capitalize transition-colors cursor-pointer ${
                            template.background_fit === fit
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {fit}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Background Opacity */}
                  <div>
                    <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                      <span>Opacity</span>
                      <span>{Math.round((template.background_opacity ?? 1) * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.05"
                      value={template.background_opacity ?? 1}
                      onChange={(e) => {
                        setTemplate({ ...template, background_opacity: parseFloat(e.target.value) });
                        setIsSaved(false);
                      }}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: LAYERS MANAGER (Phase 8) */}
          {leftTab === 'layers' && (
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider px-1 mb-2">
                <span>Layers ({template.elements.length})</span>
                <span className="text-[10px] lowercase font-normal">top to bottom</span>
              </div>
              {template.elements.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-400">
                  No elements on canvas.
                </div>
              ) : (
                [...template.elements].reverse().map((el) => (
                  <div
                    key={el.id}
                    onClick={() => setSelectedId(el.id)}
                    className={`p-2 rounded-xl border flex items-center justify-between text-xs transition-colors cursor-pointer ${
                      selectedId === el.id
                        ? 'bg-blue-50 border-blue-400 text-blue-700 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate flex-1 mr-2">
                      {el.type === 'qr' && <QrCode className="w-3.5 h-3.5 shrink-0 text-blue-600" />}
                      {el.type === 'text' && <Type className="w-3.5 h-3.5 shrink-0 text-amber-600" />}
                      {el.type === 'field' && <Sparkles className="w-3.5 h-3.5 shrink-0 text-emerald-600" />}
                      {el.type === 'shape' && <Square className="w-3.5 h-3.5 shrink-0 text-purple-600" />}
                      <span className="truncate font-medium text-[11px]">
                        {el.name ||
                          (el.type === 'field'
                            ? (el as FieldElement).token
                            : el.type === 'text'
                            ? (el as TextElement).content
                            : el.type.toUpperCase())}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateSelectedElement({ isLocked: !el.isLocked });
                        }}
                        className="p-1 text-slate-400 hover:text-blue-600"
                        title={el.isLocked ? 'Unlock Element' : 'Lock Element'}
                      >
                        {el.isLocked ? <Lock className="w-3.5 h-3.5 text-amber-600" /> : <Unlock className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateSelectedElement({ isHidden: !el.isHidden });
                        }}
                        className="p-1 text-slate-400 hover:text-blue-600"
                        title={el.isHidden ? 'Unhide Element' : 'Hide Element'}
                      >
                        {el.isHidden ? <XCircle className="w-3.5 h-3.5 text-rose-500" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteElement(el.id);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600"
                        title="Delete Element"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 5: REUSABLE DESIGN BLOCKS & TEMPLATE DUPLICATION (Phase 9) */}
          {leftTab === 'templates' && (
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-900">Template Duplication</span>
                  <Copy className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-[11px] text-blue-700 leading-relaxed">
                  Clone this template to create competition-specific variations or backup drafts safely.
                </p>
                <button
                  onClick={handleDuplicateTemplate}
                  className="w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Duplicate Template
                </button>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-1">
                  Reusable Design Blocks
                </span>
                <p className="text-[11px] text-slate-500 px-1">
                  1-Click insertion of curated, styled visual blocks.
                </p>

                <div className="space-y-2 pt-1">
                  {REUSABLE_DESIGN_BLOCKS.map((block) => (
                    <div
                      key={block.id}
                      className="p-3 rounded-xl bg-slate-50 hover:bg-white border border-slate-200 hover:border-blue-300 transition-all space-y-2 shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{block.name}</span>
                        <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                          {block.elements.length} el
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">{block.description}</p>
                      <button
                        onClick={() => handleInsertDesignBlock(block)}
                        className="w-full py-1.5 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg text-xs font-semibold text-slate-700 hover:text-blue-700 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Insert Block
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: PAGE & DOCUMENT SETTINGS (Phase 2 & 5) */}
          {leftTab === 'page' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-900">Standard Paper Presets</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['A4', 'A5', 'ID_BADGE', 'CERTIFICATE'] as PaperSize[]).map((size) => {
                    const preset = PAPER_DIMENSIONS[size][template.orientation];
                    const label = size === 'ID_BADGE' ? 'ID / Badge' : size === 'CERTIFICATE' ? 'Certificate' : size;
                    return (
                      <button
                        key={size}
                        onClick={() => handleSelectPaperPreset(size)}
                        className={`p-2 rounded-lg border text-left transition-colors cursor-pointer ${
                          template.paper_size === size
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="font-bold text-xs">{label}</div>
                        <div className="text-[9px] opacity-80">{preset.mm}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Orientation Toggle */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-600">Orientation</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {(['portrait', 'landscape'] as Orientation[]).map((ori) => (
                    <button
                      key={ori}
                      onClick={() => handleToggleOrientation(ori)}
                      className={`py-1.5 rounded-lg border font-semibold capitalize transition-colors cursor-pointer ${
                        template.orientation === ori
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {ori}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dimensions Input */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-slate-600">Custom Dimensions (pt)</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Width</label>
                    <input
                      type="number"
                      value={Math.round(template.width_pt)}
                      onChange={(e) => handleCustomDimensionChange('width_pt', parseFloat(e.target.value) || 100)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Height</label>
                    <input
                      type="number"
                      value={Math.round(template.height_pt)}
                      onChange={(e) => handleCustomDimensionChange('height_pt', parseFloat(e.target.value) || 100)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Grid & Alignment Precision */}
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <span className="text-xs font-bold text-slate-900">Grid & Snapping Options</span>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Snap to Grid</span>
                    <input
                      type="checkbox"
                      checked={snapToGrid}
                      onChange={(e) => setSnapToGrid(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Snap to Center Guides</span>
                    <input
                      type="checkbox"
                      checked={snapToCenter}
                      onChange={(e) => setSnapToCenter(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Grid Size (pt)</span>
                    <input
                      type="number"
                      value={gridSize}
                      onChange={(e) => setGridSize(Math.max(4, parseInt(e.target.value) || 16))}
                      className="w-16 px-2 py-1 rounded bg-slate-50 border border-slate-200 text-center font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* ------------------------------------------------------------------- */}
        {/* CENTER PANEL: INTERACTIVE DESIGN CANVAS                             */}
        {/* ------------------------------------------------------------------- */}
        <main
          ref={mainContainerRef}
          className="flex-1 bg-slate-200/70 overflow-auto p-4 sm:p-8 relative select-none flex"
          onClick={() => {
            setSelectedId(null);
            setContextMenu(null);
          }}
        >
          <div className="min-w-max min-h-max m-auto flex items-center justify-center">
            {/* Main Visual Canvas Sheet */}
            <div
              ref={canvasRef}
              onClick={(e) => {
                if (e.target === canvasRef.current) {
                  setSelectedId(null);
                  setContextMenu(null);
                }
              }}
              className="relative shadow-2xl transition-all duration-75 select-none bg-white border border-slate-300"
              style={{
                width: `${template.width_pt * zoom}px`,
                height: `${template.height_pt * zoom}px`,
                backgroundImage: showGrid
                  ? 'radial-gradient(circle, rgba(100, 116, 139, 0.3) 1px, transparent 1px)'
                  : undefined,
                backgroundSize: `${gridSize * zoom}px ${gridSize * zoom}px`,
              }}
            >
              {/* Background Layer */}
              {template.background_url && (
                <div
                  className="absolute inset-0 pointer-events-none overflow-hidden"
                  style={{
                    backgroundImage: `url(${template.background_url})`,
                    backgroundSize: template.background_fit || 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    opacity: template.background_opacity ?? 1,
                  }}
                />
              )}

              {/* Smart Center & Alignment Guides */}
              {activeGuideX !== null && (
                <div
                  className="absolute top-0 bottom-0 pointer-events-none z-40 border-l-2 border-dashed border-rose-500"
                  style={{ left: `${activeGuideX * zoom}px` }}
                >
                  {guideLabelX && (
                    <span className="absolute top-1 left-1 px-1 py-0.5 rounded bg-rose-500 text-white text-[9px] font-mono font-bold shadow-xs whitespace-nowrap">
                      {guideLabelX}
                    </span>
                  )}
                </div>
              )}
              {activeGuideY !== null && (
                <div
                  className="absolute left-0 right-0 pointer-events-none z-40 border-t-2 border-dashed border-rose-500"
                  style={{ top: `${activeGuideY * zoom}px` }}
                >
                  {guideLabelY && (
                    <span className="absolute left-1 top-1 px-1 py-0.5 rounded bg-rose-500 text-white text-[9px] font-mono font-bold shadow-xs whitespace-nowrap">
                      {guideLabelY}
                    </span>
                  )}
                </div>
              )}

              {/* Render Canvas Elements */}
              {template.elements.map((el) => {
                if (el.isHidden) return null;
                const isSelected = selectedId === el.id;

                const scaledX = el.x * zoom;
                const scaledY = el.y * zoom;
                const scaledW = el.width * zoom;
                const scaledH = el.height * zoom;

                return (
                  <div
                    key={el.id}
                    onMouseDown={(e) => handleMouseDownElement(e, el)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedId(el.id);
                      setContextMenu(null);
                    }}
                    onContextMenu={(e) => handleContextMenuElement(e, el)}
                    className={`absolute group cursor-move ${
                      isSelected
                        ? 'ring-2 ring-blue-600 ring-offset-1 z-30 shadow-md'
                        : 'hover:ring-1 hover:ring-blue-400'
                    }`}
                    style={{
                      left: `${scaledX}px`,
                      top: `${scaledY}px`,
                      width: `${scaledW}px`,
                      height: `${scaledH}px`,
                      opacity: el.opacity ?? 1,
                      transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
                      zIndex: isSelected ? 40 : el.zIndex || 1,
                    }}
                  >
                    {/* Content: Shape */}
                    {el.type === 'shape' && (
                      <div
                        className="w-full h-full"
                        style={{
                          backgroundColor: (el as ShapeElement).fillColor || 'transparent',
                          borderColor: (el as ShapeElement).borderColor || 'transparent',
                          borderWidth: `${((el as ShapeElement).borderWidth || 1) * zoom}px`,
                          borderStyle: 'solid',
                          borderRadius:
                            (el as ShapeElement).shapeType === 'circle'
                              ? '9999px'
                              : `${((el as ShapeElement).borderRadius || 0) * zoom}px`,
                        }}
                      />
                    )}

                    {/* Content: Image / Signature */}
                    {el.type === 'image' && (
                      <div className="w-full h-full overflow-hidden flex items-center justify-center pointer-events-none select-none">
                        {(el as ImageElement).imageUrl ? (
                          <img
                            src={(el as ImageElement).imageUrl}
                            alt={(el as ImageElement).altText || 'Image'}
                            className="w-full h-full pointer-events-none select-none"
                            style={{
                              objectFit:
                                (el as ImageElement).fit === 'fill'
                                  ? 'fill'
                                  : (el as ImageElement).fit === 'cover'
                                  ? 'cover'
                                  : 'contain',
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-100 border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 text-[10px]">
                            <ImageIcon className="w-5 h-5 mb-1 text-slate-400" />
                            <span>Image Block</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Content: Typography & Fields */}
                    {(el.type === 'text' || el.type === 'field') && (
                      <div
                        className="w-full h-full flex flex-col justify-center overflow-hidden leading-tight"
                        style={{
                          fontSize: `${(el as TextElement | FieldElement).fontSize * zoom}px`,
                          fontWeight: (el as TextElement | FieldElement).fontWeight === 'bold' ? 700 : 400,
                          color: (el as TextElement | FieldElement).color || '#0F172A',
                          textAlign: (el as TextElement | FieldElement).textAlign || 'left',
                          letterSpacing: `${((el as TextElement | FieldElement).letterSpacing || 0) * zoom}px`,
                          whiteSpace: (el as any).textFitting === 'shrink' ? 'nowrap' : 'normal',
                        }}
                      >
                        {el.type === 'field' ? (
                          previewSampleData ? (
                            sampleValues[(el as FieldElement).token] || (el as FieldElement).fallbackText
                          ) : (
                            <span className="font-mono text-emerald-700 bg-emerald-50 px-1 rounded border border-emerald-200">
                              {(el as FieldElement).token}
                            </span>
                          )
                        ) : previewSampleData ? (
                          resolveTokens((el as TextElement).content, sampleValues)
                        ) : (
                          (el as TextElement).content
                        )}
                      </div>
                    )}

                    {/* Content: Security QR Code */}
                    {el.type === 'qr' && (
                      <div
                        className="w-full h-full bg-white p-1 rounded shadow-xs flex flex-col items-center justify-center border border-slate-200"
                        style={{
                          backgroundColor: (el as QrElement).lightColor || '#FFFFFF',
                        }}
                      >
                        <div className="w-full h-full flex items-center justify-center">
                          <QrCode
                            className="w-full h-full"
                            style={{ color: (el as QrElement).darkColor || '#0F172A' }}
                          />
                        </div>
                        {(el as QrElement).showCaption && (el as QrElement).captionText && (
                          <div
                            className="text-[8px] font-bold tracking-wider mt-0.5 truncate uppercase"
                            style={{
                              color: (el as QrElement).darkColor || '#0F172A',
                              fontSize: `${Math.max(6, 8 * zoom)}px`,
                            }}
                          >
                            {(el as QrElement).captionText}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 8-Point Resize Handles (Active Selection) */}
                    {isSelected && !el.isLocked && (
                      <>
                        {/* Corners */}
                        <div
                          onMouseDown={(e) => handleStartResize(e, 'nw', el)}
                          onClick={(e) => e.stopPropagation()}
                          className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-blue-600 rounded-full cursor-nwse-resize z-50 shadow-xs"
                        />
                        <div
                          onMouseDown={(e) => handleStartResize(e, 'ne', el)}
                          onClick={(e) => e.stopPropagation()}
                          className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-blue-600 rounded-full cursor-nesw-resize z-50 shadow-xs"
                        />
                        <div
                          onMouseDown={(e) => handleStartResize(e, 'sw', el)}
                          onClick={(e) => e.stopPropagation()}
                          className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-blue-600 rounded-full cursor-nesw-resize z-50 shadow-xs"
                        />
                        <div
                          onMouseDown={(e) => handleStartResize(e, 'se', el)}
                          onClick={(e) => e.stopPropagation()}
                          className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-blue-600 rounded-full cursor-nwse-resize z-50 shadow-xs"
                        />

                        {/* Edges */}
                        <div
                          onMouseDown={(e) => handleStartResize(e, 'n', el)}
                          onClick={(e) => e.stopPropagation()}
                          className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-600 rounded-full cursor-ns-resize z-50"
                        />
                        <div
                          onMouseDown={(e) => handleStartResize(e, 's', el)}
                          onClick={(e) => e.stopPropagation()}
                          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-600 rounded-full cursor-ns-resize z-50"
                        />
                        <div
                          onMouseDown={(e) => handleStartResize(e, 'w', el)}
                          onClick={(e) => e.stopPropagation()}
                          className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-blue-600 rounded-full cursor-ew-resize z-50"
                        />
                        <div
                          onMouseDown={(e) => handleStartResize(e, 'e', el)}
                          onClick={(e) => e.stopPropagation()}
                          className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 bg-blue-600 rounded-full cursor-ew-resize z-50"
                        />
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Context Menu Popover */}
          {contextMenu && (
            <div
              className="fixed z-50 bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 w-48 text-xs font-medium text-slate-700 animate-in fade-in zoom-in-95 duration-100 select-none"
              style={{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  duplicateElement(contextMenu.elementId);
                  setContextMenu(null);
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-blue-50 hover:text-blue-700 flex items-center justify-between cursor-pointer"
              >
                <span>Duplicate</span>
                <span className="text-[10px] text-slate-400">Ctrl+D</span>
              </button>
              <button
                onClick={() => {
                  bringToFront(contextMenu.elementId);
                  setContextMenu(null);
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
              >
                <span>Bring to Front</span>
              </button>
              <button
                onClick={() => {
                  sendToBack(contextMenu.elementId);
                  setContextMenu(null);
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
              >
                <span>Send to Back</span>
              </button>
              <div className="my-1 border-t border-slate-100" />
              <button
                onClick={() => {
                  const target = template?.elements.find((el) => el.id === contextMenu.elementId);
                  if (target) updateSelectedElement({ isLocked: !target.isLocked });
                  setContextMenu(null);
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
              >
                <span>
                  {template?.elements.find((el) => el.id === contextMenu.elementId)?.isLocked
                    ? 'Unlock Element'
                    : 'Lock Element'}
                </span>
              </button>
              <button
                onClick={() => {
                  deleteElement(contextMenu.elementId);
                  setContextMenu(null);
                }}
                className="w-full px-3 py-1.5 text-left text-rose-600 hover:bg-rose-50 flex items-center justify-between cursor-pointer"
              >
                <span>Delete</span>
                <span className="text-[10px] text-rose-400">Del</span>
              </button>
            </div>
          )}
        </main>

        {/* ------------------------------------------------------------------- */}
        {/* RIGHT PANEL: CONTEXTUAL PROPERTIES INSPECTOR (Phase 2 & 6 & 8)      */}
        {/* ------------------------------------------------------------------- */}
        <aside
          onClick={(e) => e.stopPropagation()}
          className={`${
            isRightCollapsed ? 'hidden' : 'hidden lg:flex'
          } w-80 bg-white border-l border-slate-200 flex-col shrink-0 z-20 overflow-y-auto p-4 space-y-5 shadow-xs`}
        >
          {selectedElement ? (
            <div className="space-y-5">
              {/* Header & Quick Action Buttons */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                    {selectedElement.type} Properties
                  </h3>
                  <input
                    type="text"
                    value={selectedElement.name || ''}
                    placeholder="Layer Name"
                    onChange={(e) => updateSelectedElement({ name: e.target.value })}
                    className="text-xs text-blue-600 font-semibold bg-transparent border-b border-transparent hover:border-slate-300 focus:outline-none w-36"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => duplicateElement(selectedElement.id)}
                    className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                    title="Duplicate Element (Ctrl+D)"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteElement(selectedElement.id)}
                    className="p-1.5 rounded hover:bg-rose-50 text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
                    title="Delete Element (Del)"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Coordinates & Geometry (PDF Points) */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Position & Size (pt)
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">X</label>
                    <input
                      type="number"
                      value={selectedElement.x}
                      onChange={(e) => updateSelectedElement({ x: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Y</label>
                    <input
                      type="number"
                      value={selectedElement.y}
                      onChange={(e) => updateSelectedElement({ y: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Width</label>
                    <input
                      type="number"
                      value={selectedElement.width}
                      onChange={(e) => updateSelectedElement({ width: parseFloat(e.target.value) || 10 })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Height</label>
                    <input
                      type="number"
                      value={selectedElement.height}
                      onChange={(e) => updateSelectedElement({ height: parseFloat(e.target.value) || 10 })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-slate-800"
                    />
                  </div>
                </div>

                {/* Rotation */}
                <div className="pt-1 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-500">Rotation (0°-360°)</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      max="360"
                      value={selectedElement.rotation || 0}
                      onChange={(e) => updateSelectedElement({ rotation: parseInt(e.target.value) || 0 })}
                      className="w-16 px-2 py-1 rounded bg-slate-50 border border-slate-200 text-center font-mono"
                    />
                    <button
                      onClick={() => updateSelectedElement({ rotation: ((selectedElement.rotation || 0) + 90) % 360 })}
                      className="p-1 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200"
                      title="Rotate 90 degrees"
                    >
                      <RotateCw className="w-3.5 h-3.5 text-slate-600" />
                    </button>
                  </div>
                </div>

                {/* Quick Alignment Buttons */}
                <div className="pt-2">
                  <label className="block text-[10px] text-slate-500 mb-1">Canvas Alignment</label>
                  <div className="grid grid-cols-6 gap-1 text-xs">
                    <button
                      onClick={() => alignElement('left')}
                      className="p-1.5 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-center font-semibold"
                      title="Align Left"
                    >
                      L
                    </button>
                    <button
                      onClick={() => alignElement('center')}
                      className="p-1.5 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-center font-semibold"
                      title="Align Center Horizontal"
                    >
                      C
                    </button>
                    <button
                      onClick={() => alignElement('right')}
                      className="p-1.5 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-center font-semibold"
                      title="Align Right"
                    >
                      R
                    </button>
                    <button
                      onClick={() => alignElement('top')}
                      className="p-1.5 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-center font-semibold"
                      title="Align Top"
                    >
                      T
                    </button>
                    <button
                      onClick={() => alignElement('middle')}
                      className="p-1.5 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-center font-semibold"
                      title="Align Middle Vertical"
                    >
                      M
                    </button>
                    <button
                      onClick={() => alignElement('bottom')}
                      className="p-1.5 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-center font-semibold"
                      title="Align Bottom"
                    >
                      B
                    </button>
                  </div>
                </div>
              </div>

              {/* Typography & Text-Fitting Settings (Phase 6) */}
              {(selectedElement.type === 'text' || selectedElement.type === 'field') && (
                <div className="space-y-3 pt-3 border-t border-slate-200">
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Typography & Fitting
                  </span>

                  {selectedElement.type === 'text' && (
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Content Text</label>
                      <textarea
                        rows={2}
                        value={(selectedElement as TextElement).content}
                        onChange={(e) => updateSelectedElement({ content: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs focus:outline-none"
                      />
                    </div>
                  )}

                  {selectedElement.type === 'field' && (
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Dynamic Token</label>
                      <input
                        type="text"
                        value={(selectedElement as FieldElement).token}
                        onChange={(e) => updateSelectedElement({ token: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-emerald-700"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Font Family</label>
                      <select
                        value={(selectedElement as TextElement).fontFamily || 'Helvetica'}
                        onChange={(e) => updateSelectedElement({ fontFamily: e.target.value as FontFamily })}
                        className="w-full px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                      >
                        <option value="Helvetica">Helvetica</option>
                        <option value="Helvetica-Bold">Helvetica Bold</option>
                        <option value="Times-Roman">Times Roman</option>
                        <option value="Times-Bold">Times Bold</option>
                        <option value="Courier">Courier</option>
                        <option value="Courier-Bold">Courier Bold</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Font Size (pt)</label>
                      <input
                        type="number"
                        value={(selectedElement as TextElement).fontSize || 12}
                        onChange={(e) => updateSelectedElement({ fontSize: parseFloat(e.target.value) || 8 })}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono"
                      />
                    </div>
                  </div>

                  {/* Font Size Warning if < 7pt */}
                  {(selectedElement as TextElement).fontSize < 7 && (
                    <div className="p-2 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[10px] flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                      <span>Font size &lt; 7pt may not be legible when printed.</span>
                    </div>
                  )}

                  {/* Text Color & Alignment */}
                  <div className="grid grid-cols-2 gap-2 items-center">
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Color</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={(selectedElement as TextElement).color || '#0F172A'}
                          onChange={(e) => updateSelectedElement({ color: e.target.value })}
                          className="w-7 h-7 rounded border-none cursor-pointer"
                        />
                        <input
                          type="text"
                          value={(selectedElement as TextElement).color || '#0F172A'}
                          onChange={(e) => updateSelectedElement({ color: e.target.value })}
                          className="w-full px-2 py-1 text-[11px] rounded font-mono bg-slate-50 border border-slate-200 uppercase"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Alignment</label>
                      <div className="grid grid-cols-3 gap-1">
                        {(['left', 'center', 'right'] as const).map((align) => (
                          <button
                            key={align}
                            onClick={() => updateSelectedElement({ textAlign: align })}
                            className={`p-1 rounded text-center text-xs font-semibold capitalize ${
                              (selectedElement as TextElement).textAlign === align
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-50 border border-slate-200 text-slate-700'
                            }`}
                          >
                            {align[0].toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Text-Fitting Mode (Phase 6) */}
                  <div className="space-y-1.5 pt-1">
                    <label className="block text-[10px] font-semibold text-slate-600">
                      Fitting Mode for Long Text
                    </label>
                    <div className="grid grid-cols-3 gap-1 text-[11px]">
                      {[
                        { id: 'shrink', label: 'Shrink' },
                        { id: 'wrap', label: 'Wrap' },
                        { id: 'fixed', label: 'Fixed' },
                      ].map((mode) => (
                        <button
                          key={mode.id}
                          onClick={() => updateSelectedElement({ textFitting: mode.id as TextFittingMode })}
                          className={`py-1 rounded font-medium transition-colors ${
                            (selectedElement as any).textFitting === mode.id || (!((selectedElement as any).textFitting) && mode.id === 'wrap')
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {mode.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Long Name Stress Test Toggle */}
                  <div className="pt-2">
                    <button
                      onClick={() => setTestLongName((t) => !t)}
                      className={`w-full py-1.5 px-2 rounded-lg text-xs font-medium border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                        testLongName
                          ? 'bg-amber-100 border-amber-300 text-amber-900 font-semibold'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      {testLongName ? 'Testing Long Name Active' : 'Test with Long Name'}
                    </button>
                  </div>
                </div>
              )}

              {/* Security QR Properties */}
              {selectedElement.type === 'qr' && (
                <div className="space-y-3 pt-3 border-t border-slate-200 text-xs">
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    QR Security Settings
                  </span>

                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Verification Mode</label>
                    <select
                      value={(selectedElement as QrElement).qrType || 'pass_verification'}
                      onChange={(e) => updateSelectedElement({ qrType: e.target.value as QrVerificationType })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                    >
                      <option value="pass_verification">Pass Entry Token (/verify/[token])</option>
                      <option value="cert_verification">Certificate Token (/verify/[certId])</option>
                      <option value="custom_url">Custom External URL</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Caption Label</label>
                    <input
                      type="text"
                      value={(selectedElement as QrElement).captionText || ''}
                      onChange={(e) => updateSelectedElement({ captionText: e.target.value })}
                      placeholder="e.g. SCAN AT VENUE"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs uppercase"
                    />
                  </div>

                  {selectedElement.width < 70 && (
                    <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                      <span>Warning: QR width &lt; 70pt may be hard to scan on physical passes.</span>
                    </div>
                  )}
                </div>
              )}

              {/* Shape Properties */}
              {selectedElement.type === 'shape' && (
                <div className="space-y-3 pt-3 border-t border-slate-200 text-xs">
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Shape Styling
                  </span>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Fill Color</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="color"
                          value={
                            (selectedElement as ShapeElement).fillColor === 'transparent'
                              ? '#ffffff'
                              : (selectedElement as ShapeElement).fillColor
                          }
                          onChange={(e) => updateSelectedElement({ fillColor: e.target.value })}
                          className="w-7 h-7 rounded border-none cursor-pointer"
                        />
                        <button
                          onClick={() => updateSelectedElement({ fillColor: 'transparent' })}
                          className="text-[9px] px-1.5 py-1 rounded bg-slate-50 border border-slate-200 text-slate-600"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Border Color</label>
                      <input
                        type="color"
                        value={(selectedElement as ShapeElement).borderColor || '#CBD5E1'}
                        onChange={(e) => updateSelectedElement({ borderColor: e.target.value })}
                        className="w-7 h-7 rounded border-none cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Border Width (pt)</label>
                      <input
                        type="number"
                        value={(selectedElement as ShapeElement).borderWidth || 0}
                        onChange={(e) => updateSelectedElement({ borderWidth: parseFloat(e.target.value) || 0 })}
                        className="w-full px-2 py-1 rounded bg-slate-50 border border-slate-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Corner Radius</label>
                      <input
                        type="number"
                        value={(selectedElement as ShapeElement).borderRadius || 0}
                        onChange={(e) => updateSelectedElement({ borderRadius: parseFloat(e.target.value) || 0 })}
                        className="w-full px-2 py-1 rounded bg-slate-50 border border-slate-200 font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Image & Signature Properties */}
              {selectedElement.type === 'image' && (
                <div className="space-y-3 pt-3 border-t border-slate-200 text-xs">
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Image / Signature Settings
                  </span>

                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Replace / Upload Image</label>
                    <label className="w-full py-2 px-3 border border-slate-200 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg flex items-center justify-center gap-1.5 font-semibold text-xs cursor-pointer transition-colors">
                      <Upload className="w-3.5 h-3.5 text-blue-600" />
                      <span>Choose New Image...</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const formData = new FormData();
                          formData.append('file', file);
                          formData.append('role', 'studio_element');
                          try {
                            const res = await fetch('/api/admin/studio/upload', {
                              method: 'POST',
                              body: formData,
                            });
                            const data = await res.json();
                            if (data.url) {
                              updateSelectedElement({ imageUrl: data.url });
                            } else {
                              alert(data.error || 'Upload failed');
                            }
                          } catch (err) {
                            alert('Upload failed');
                          }
                        }}
                      />
                    </label>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Image URL</label>
                    <input
                      type="text"
                      value={(selectedElement as ImageElement).imageUrl || ''}
                      onChange={(e) => updateSelectedElement({ imageUrl: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-[11px]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Fitting Mode</label>
                    <div className="grid grid-cols-3 gap-1">
                      {(['contain', 'cover', 'fill'] as const).map((fit) => (
                        <button
                          key={fit}
                          onClick={() => updateSelectedElement({ fit })}
                          className={`py-1.5 rounded text-center text-xs font-semibold capitalize cursor-pointer ${
                            ((selectedElement as ImageElement).fit || 'contain') === fit
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {fit === 'fill' ? 'Stretch' : fit}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Description / Alt</label>
                    <input
                      type="text"
                      value={(selectedElement as ImageElement).altText || ''}
                      onChange={(e) => updateSelectedElement({ altText: e.target.value })}
                      placeholder="e.g. Authorized Signatory / Logo"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Layer Actions (Phase 8) */}
              <div className="pt-3 border-t border-slate-200 space-y-2">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Layer Ordering
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => bringForward(selectedElement.id)}
                    className="p-1.5 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-center font-medium"
                  >
                    Bring Forward
                  </button>
                  <button
                    onClick={() => sendBackward(selectedElement.id)}
                    className="p-1.5 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-center font-medium"
                  >
                    Send Backward
                  </button>
                  <button
                    onClick={() => bringToFront(selectedElement.id)}
                    className="p-1.5 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-center font-medium"
                  >
                    Bring to Front
                  </button>
                  <button
                    onClick={() => sendToBack(selectedElement.id)}
                    className="p-1.5 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-center font-medium"
                  >
                    Send to Back
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Document Summary when nothing is selected */
            <div className="space-y-5 text-xs">
              <div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 mb-1">
                  Document Settings
                </h3>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Click any element on canvas to inspect its geometry, styling, and text-fitting settings.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Format:</span>
                  <span className="font-semibold text-slate-900">
                    {template.paper_size} {template.orientation}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Dimensions:</span>
                  <span className="font-mono text-slate-900">
                    {Math.round(template.width_pt)} × {Math.round(template.height_pt)} pt
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Aspect Ratio:</span>
                  <span className="font-mono text-slate-900">{aspectRatio} : 1</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Elements:</span>
                  <span className="font-mono text-slate-900">{template.elements.length} layers</span>
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* ===================================================================== */}
      {/* 3. DEDICATED MOBILE BOTTOM NAVIGATION & CONTROLS (Phase 3)             */}
      {/* ===================================================================== */}
      <div className="md:hidden bg-white border-t border-slate-200 shrink-0 z-30">
        <div className="grid grid-cols-5 text-slate-600">
          {[
            { id: 'elements', label: 'Add', icon: Plus },
            { id: 'fields', label: 'Fields', icon: Type },
            { id: 'layers', label: 'Layers', icon: Layers },
            { id: 'properties', label: 'Inspect', icon: Sliders },
            { id: 'page', label: 'Page', icon: Columns },
          ].map((item) => (
            <button
              key={item.id}
              id={`mobile-tab-${item.id}`}
              onClick={() => {
                setMobileActiveSheet((prev) => (prev === item.id ? 'none' : (item.id as any)));
              }}
              className={`py-2.5 flex flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-colors cursor-pointer min-h-[44px] ${
                mobileActiveSheet === item.id ? 'text-blue-600 bg-blue-50/50' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Drawer Bottom Sheet */}
      {mobileActiveSheet !== 'none' && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex flex-col justify-end">
          <div className="bg-white rounded-t-2xl max-h-[75vh] flex flex-col shadow-2xl overflow-hidden border-t border-slate-200 animate-in slide-in-from-bottom duration-200">
            {/* Drawer Header */}
            <div className="p-3 border-b border-slate-200 flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-900">
                {mobileActiveSheet === 'properties'
                  ? selectedElement
                    ? `${selectedElement.type} Properties`
                    : 'Document Properties'
                  : mobileActiveSheet.toUpperCase()}
              </span>
              <button
                onClick={() => setMobileActiveSheet('none')}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {mobileActiveSheet === 'elements' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        handleAddText('Heading Block', true);
                        setMobileActiveSheet('none');
                      }}
                      className="p-3 rounded-lg bg-slate-50 border text-left"
                    >
                      <div className="font-bold text-xs">Heading</div>
                      <div className="text-[10px] text-slate-500">20pt bold</div>
                    </button>
                    <button
                      onClick={() => {
                        handleAddText('Subheading Block', false);
                        setMobileActiveSheet('none');
                      }}
                      className="p-3 rounded-lg bg-slate-50 border text-left"
                    >
                      <div className="font-bold text-xs">Subheading</div>
                      <div className="text-[10px] text-slate-500">12pt regular</div>
                    </button>
                    <button
                      onClick={() => {
                        handleAddQr('pass_verification');
                        setMobileActiveSheet('none');
                      }}
                      className="p-3 rounded-lg bg-slate-50 border text-left"
                    >
                      <div className="font-bold text-xs">Pass QR</div>
                      <div className="text-[10px] text-slate-500">Entry scan</div>
                    </button>
                    <button
                      onClick={() => {
                        handleAddShape('rounded_rectangle');
                        setMobileActiveSheet('none');
                      }}
                      className="p-3 rounded-lg bg-slate-50 border text-left"
                    >
                      <div className="font-bold text-xs">Card Shape</div>
                      <div className="text-[10px] text-slate-500">Pill frame</div>
                    </button>
                  </div>
                </div>
              )}

              {mobileActiveSheet === 'fields' && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-500">Common Fields</span>
                  <div className="space-y-1">
                    {[
                      { token: '{{participant.name}}', name: 'Participant Name' },
                      { token: '{{registration.id}}', name: 'Registration ID' },
                      { token: '{{competition.name}}', name: 'Competition Title' },
                      { token: '{{team.name}}', name: 'Team Name' },
                      { token: '{{certificate.rank}}', name: 'Award Rank' },
                    ].map((f) => (
                      <button
                        key={f.token}
                        onClick={() => {
                          handleAddField(f.token, f.name);
                          setMobileActiveSheet('none');
                        }}
                        className="w-full p-2.5 rounded-lg bg-slate-50 border text-left flex justify-between items-center"
                      >
                        <span className="text-xs font-semibold text-slate-800">{f.name}</span>
                        <code className="text-[10px] text-slate-500 font-mono">{f.token}</code>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {mobileActiveSheet === 'layers' && (
                <div className="space-y-2">
                  {[...template.elements].reverse().map((el) => (
                    <div
                      key={el.id}
                      onClick={() => {
                        setSelectedId(el.id);
                        setMobileActiveSheet('properties');
                      }}
                      className={`p-2.5 rounded-lg border flex items-center justify-between text-xs ${
                        selectedId === el.id ? 'bg-blue-50 border-blue-400 text-blue-700' : 'bg-slate-50'
                      }`}
                    >
                      <span className="font-semibold truncate">
                        {el.name || (el.type === 'field' ? (el as FieldElement).token : el.type.toUpperCase())}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  ))}
                </div>
              )}

              {mobileActiveSheet === 'properties' && selectedElement && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] text-slate-500">X Position (pt)</label>
                      <input
                        type="number"
                        value={selectedElement.x}
                        onChange={(e) => updateSelectedElement({ x: parseFloat(e.target.value) || 0 })}
                        className="w-full p-2 rounded bg-slate-50 border font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500">Y Position (pt)</label>
                      <input
                        type="number"
                        value={selectedElement.y}
                        onChange={(e) => updateSelectedElement({ y: parseFloat(e.target.value) || 0 })}
                        className="w-full p-2 rounded bg-slate-50 border font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500">Width (pt)</label>
                      <input
                        type="number"
                        value={selectedElement.width}
                        onChange={(e) => updateSelectedElement({ width: parseFloat(e.target.value) || 10 })}
                        className="w-full p-2 rounded bg-slate-50 border font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500">Height (pt)</label>
                      <input
                        type="number"
                        value={selectedElement.height}
                        onChange={(e) => updateSelectedElement({ height: parseFloat(e.target.value) || 10 })}
                        className="w-full p-2 rounded bg-slate-50 border font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => duplicateElement(selectedElement.id)}
                      className="flex-1 py-2 bg-slate-100 rounded text-xs font-semibold"
                    >
                      Duplicate
                    </button>
                    <button
                      onClick={() => {
                        deleteElement(selectedElement.id);
                        setMobileActiveSheet('none');
                      }}
                      className="flex-1 py-2 bg-rose-50 text-rose-600 rounded text-xs font-semibold"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}

              {mobileActiveSheet === 'page' && (
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-900">Format: {template.paper_size} {template.orientation}</span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {(['A4', 'A5', 'ID_BADGE'] as PaperSize[]).map((size) => (
                      <button
                        key={size}
                        onClick={() => {
                          const preset = PAPER_DIMENSIONS[size][template.orientation];
                          setTemplate({
                            ...template,
                            paper_size: size,
                            width_pt: preset.widthPt,
                            height_pt: preset.heightPt,
                          });
                          setIsSaved(false);
                          setMobileActiveSheet('none');
                        }}
                        className={`p-2 rounded border font-semibold ${
                          template.paper_size === size ? 'bg-blue-600 text-white' : 'bg-slate-50'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 4. PRE-PUBLISH VALIDATION CHECKLIST MODAL (Phase 11)                   */}
      {/* ===================================================================== */}
      {showValidationModal && validationReport && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl border border-slate-200 flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Pre-Publish Template Checklist
                </h3>
              </div>
              <button
                onClick={() => setShowValidationModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Summary Status Banner */}
              <div
                className={`p-3 rounded-xl border flex items-center gap-3 ${
                  validationReport.canPublish
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                {validationReport.canPublish ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                )}
                <div>
                  <div className="text-xs font-bold">
                    {validationReport.canPublish
                      ? 'Template Verified & Ready to Publish'
                      : 'Blocking Errors Detected — Please Resolve Before Publishing'}
                  </div>
                  <div className="text-[11px] opacity-80">
                    {validationReport.items.filter((i) => i.status === 'pass').length} passed,{' '}
                    {validationReport.items.filter((i) => i.status === 'warning').length} warnings,{' '}
                    {validationReport.items.filter((i) => i.status === 'error').length} blocking errors.
                  </div>
                </div>
              </div>

              {/* Checklist Items */}
              <div className="space-y-2">
                {validationReport.items.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5 text-xs"
                  >
                    {item.status === 'pass' && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    )}
                    {item.status === 'warning' && (
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    )}
                    {item.status === 'error' && (
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="font-bold text-slate-800">{item.title}</div>
                      <div className="text-[11px] text-slate-600 mt-0.5">{item.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowValidationModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100"
              >
                Close
              </button>
              {validationReport.canPublish && (
                <button
                  onClick={() => {
                    setShowValidationModal(false);
                    handleSave();
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
                >
                  Save & Confirm Validated
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 5. 5-MODE LIVE PREVIEW MODAL (Phase 10)                                */}
      {/* ===================================================================== */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white w-full max-w-4xl h-[90vh] rounded-2xl border border-slate-200 flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="p-3 sm:p-4 border-b border-slate-200 flex items-center justify-between gap-4 bg-slate-50">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-xs sm:text-base">
                  Live Studio Preview — {template.title}
                </h3>
              </div>

              {/* Mode Switcher */}
              <div className="hidden sm:flex rounded-lg border border-slate-200 p-0.5 bg-white text-xs font-medium">
                {[
                  { id: 'design', label: 'Design' },
                  { id: 'participant', label: 'Participant' },
                  { id: 'team', label: 'Team' },
                  { id: 'certificate', label: 'Certificate' },
                  { id: 'pdf', label: 'PDF Vector' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    id={`modal-btn-${mode.id}-mode`}
                    onClick={() => {
                      setPreviewMode(mode.id as any);
                      if (mode.id === 'pdf' && !pdfUrl) openPdfPreview();
                    }}
                    className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                      previewMode === mode.id
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                {pdfUrl && previewMode === 'pdf' && (
                  <a
                    href={pdfUrl}
                    download={`yugantar-${template.title.toLowerCase().replace(/\s+/g, '-')}.pdf`}
                    className="p-1.5 sm:p-2 rounded-lg text-slate-700 hover:text-blue-600 hover:bg-slate-100"
                    title="Download Generated PDF"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                )}
                <button
                  id="btn-close-preview-modal"
                  onClick={() => {
                    setShowPreviewModal(false);
                    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
                    setPdfUrl(null);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Mobile Mode Switcher */}
            <div className="sm:hidden flex border-b border-slate-200 bg-white p-1 text-[11px] font-medium overflow-x-auto">
              {[
                { id: 'design', label: 'Design' },
                { id: 'participant', label: 'Participant' },
                { id: 'team', label: 'Team' },
                { id: 'certificate', label: 'Certificate' },
                { id: 'pdf', label: 'PDF' },
              ].map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => {
                    setPreviewMode(mode.id as any);
                    if (mode.id === 'pdf' && !pdfUrl) openPdfPreview();
                  }}
                  className={`px-3 py-1 rounded shrink-0 ${
                    previewMode === mode.id ? 'bg-blue-600 text-white font-semibold' : 'text-slate-600'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            {/* Modal Body */}
            <div className="flex-1 bg-slate-900 relative overflow-auto flex items-center justify-center p-4">
              {previewMode === 'pdf' ? (
                pdfLoading ? (
                  <div className="flex flex-col items-center justify-center text-slate-400 text-xs">
                    <Sparkles className="w-7 h-7 animate-spin text-blue-500 mb-2" />
                    Rendering Vector PDF via pdf-lib engine...
                  </div>
                ) : pdfUrl ? (
                  <iframe src={pdfUrl} title="Live PDF Output" className="w-full h-full border-none rounded-lg" />
                ) : (
                  <div className="text-slate-400 text-xs">Failed to compile PDF.</div>
                )
              ) : (
                /* Scaled Preview Sheet */
                <div
                  className="bg-white shadow-2xl relative overflow-hidden"
                  style={{
                    width: `${template.width_pt * 0.75}px`,
                    height: `${template.height_pt * 0.75}px`,
                  }}
                >
                  {template.background_url && (
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        backgroundImage: `url(${template.background_url})`,
                        backgroundSize: template.background_fit || 'cover',
                        backgroundPosition: 'center',
                        opacity: template.background_opacity ?? 1,
                      }}
                    />
                  )}

                  {template.elements.map((el) => {
                    if (el.isHidden) return null;
                    const pZoom = 0.75;
                    const pValues: Record<string, string> =
                      previewMode === 'team'
                        ? {
                            ...sampleValues,
                            '{{team.name}}': 'Autonomous Drone Knights',
                            '{{team.membersList}}': 'Rohan Verma (Lead), Sneha Patil, Kunal Joshi',
                          }
                        : previewMode === 'certificate'
                        ? {
                            ...sampleValues,
                            '{{participant.name}}': 'Aarav Deshmukh',
                            '{{certificate.rank}}': 'First Prize Winner with Distinction',
                          }
                        : sampleValues;

                    return (
                      <div
                        key={el.id}
                        className="absolute"
                        style={{
                          left: `${el.x * pZoom}px`,
                          top: `${el.y * pZoom}px`,
                          width: `${el.width * pZoom}px`,
                          height: `${el.height * pZoom}px`,
                          transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
                        }}
                      >
                        {el.type === 'shape' && (
                          <div
                            className="w-full h-full"
                            style={{
                              backgroundColor: (el as ShapeElement).fillColor || 'transparent',
                              borderColor: (el as ShapeElement).borderColor || 'transparent',
                              borderWidth: `${((el as ShapeElement).borderWidth || 1) * pZoom}px`,
                              borderStyle: 'solid',
                              borderRadius:
                                (el as ShapeElement).shapeType === 'circle'
                                  ? '9999px'
                                  : `${((el as ShapeElement).borderRadius || 0) * pZoom}px`,
                            }}
                          />
                        )}

                        {(el.type === 'text' || el.type === 'field') && (
                          <div
                            className="w-full h-full flex flex-col justify-center overflow-hidden leading-tight"
                            style={{
                              fontSize: `${(el as TextElement).fontSize * pZoom}px`,
                              fontWeight: (el as TextElement).fontWeight === 'bold' ? 700 : 400,
                              color: (el as TextElement).color || '#0F172A',
                              textAlign: (el as TextElement).textAlign || 'left',
                            }}
                          >
                            {el.type === 'field'
                              ? pValues[(el as FieldElement).token] || (el as FieldElement).fallbackText
                              : resolveTokens((el as TextElement).content, pValues)}
                          </div>
                        )}

                        {el.type === 'image' && (
                          <div className="w-full h-full overflow-hidden flex items-center justify-center">
                            {(el as ImageElement).imageUrl ? (
                              <img
                                src={(el as ImageElement).imageUrl}
                                alt={(el as ImageElement).altText || 'Image'}
                                className="w-full h-full"
                                style={{
                                  objectFit:
                                    (el as ImageElement).fit === 'fill'
                                      ? 'fill'
                                      : (el as ImageElement).fit === 'cover'
                                      ? 'cover'
                                      : 'contain',
                                }}
                              />
                            ) : null}
                          </div>
                        )}

                        {el.type === 'qr' && (
                          <div className="w-full h-full bg-white p-1 rounded flex flex-col items-center justify-center border border-slate-200">
                            <QrCode className="w-full h-full text-slate-900" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Properties Modal */}
      {showMobilePropsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex flex-col justify-end lg:hidden animate-in fade-in duration-150">
          <div className="bg-white rounded-t-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">
                {selectedElement ? `${selectedElement.type.toUpperCase()} Properties` : 'Inspector (No Selection)'}
              </h3>
              <button
                onClick={() => setShowMobilePropsModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto space-y-4">
              {selectedElement ? (
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Layer Name</label>
                    <input
                      type="text"
                      value={selectedElement.name || ''}
                      onChange={(e) => updateSelectedElement({ name: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 font-semibold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">X Position</label>
                      <input
                        type="number"
                        value={Math.round(selectedElement.x)}
                        onChange={(e) => updateSelectedElement({ x: parseFloat(e.target.value) || 0 })}
                        className="w-full px-2 py-1 rounded bg-slate-50 border border-slate-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Y Position</label>
                      <input
                        type="number"
                        value={Math.round(selectedElement.y)}
                        onChange={(e) => updateSelectedElement({ y: parseFloat(e.target.value) || 0 })}
                        className="w-full px-2 py-1 rounded bg-slate-50 border border-slate-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Width</label>
                      <input
                        type="number"
                        value={Math.round(selectedElement.width)}
                        onChange={(e) => updateSelectedElement({ width: parseFloat(e.target.value) || 10 })}
                        className="w-full px-2 py-1 rounded bg-slate-50 border border-slate-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Height</label>
                      <input
                        type="number"
                        value={Math.round(selectedElement.height)}
                        onChange={(e) => updateSelectedElement({ height: parseFloat(e.target.value) || 10 })}
                        className="w-full px-2 py-1 rounded bg-slate-50 border border-slate-200 font-mono"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                    <button
                      onClick={() => duplicateElement(selectedElement.id)}
                      className="flex-1 py-2 rounded-xl bg-blue-50 text-blue-700 font-bold hover:bg-blue-100 transition-colors"
                    >
                      Duplicate
                    </button>
                    <button
                      onClick={() => {
                        deleteElement(selectedElement.id);
                        setShowMobilePropsModal(false);
                      }}
                      className="flex-1 py-2 rounded-xl bg-rose-50 text-rose-700 font-bold hover:bg-rose-100 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <p>No element is currently selected.</p>
                  <p className="text-[11px] mt-1">Tap an element on the canvas to inspect and edit its properties.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
