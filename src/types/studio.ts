export type DocumentType =
  | 'registration_pass'
  | 'delegate_pass'
  | 'team_pass'
  | 'participation_cert'
  | 'winner_cert'
  | 'custom_cert';

export type PaperSize = 'A4' | 'A5' | 'ID_BADGE' | 'CERTIFICATE' | 'CUSTOM';

export type Orientation = 'portrait' | 'landscape';

export type BackgroundFit = 'cover' | 'contain' | 'stretch';

export interface PaperDimensions {
  widthPt: number;
  heightPt: number;
  label: string;
  mm: string;
}

export const PAPER_DIMENSIONS: Record<PaperSize, Record<Orientation, { widthPt: number; heightPt: number; label: string; mm: string }>> = {
  A4: {
    portrait: { widthPt: 595.28, heightPt: 841.89, label: 'A4 Portrait', mm: '210 × 297 mm' },
    landscape: { widthPt: 841.89, heightPt: 595.28, label: 'A4 Landscape', mm: '297 × 210 mm' },
  },
  A5: {
    portrait: { widthPt: 419.53, heightPt: 595.28, label: 'A5 Portrait', mm: '148 × 210 mm' },
    landscape: { widthPt: 595.28, heightPt: 419.53, label: 'A5 Landscape', mm: '210 × 148 mm' },
  },
  ID_BADGE: {
    portrait: { widthPt: 153.07, heightPt: 243.78, label: 'ID/Badge Portrait', mm: '54 × 86 mm' },
    landscape: { widthPt: 243.78, heightPt: 153.07, label: 'ID/Badge Landscape', mm: '86 × 54 mm' },
  },
  CERTIFICATE: {
    portrait: { widthPt: 612, heightPt: 792, label: 'Certificate Portrait', mm: '216 × 279 mm' },
    landscape: { widthPt: 792, heightPt: 612, label: 'Certificate Landscape', mm: '279 × 216 mm' },
  },
  CUSTOM: {
    portrait: { widthPt: 595.28, heightPt: 841.89, label: 'Custom Portrait', mm: 'Custom Size' },
    landscape: { widthPt: 841.89, heightPt: 595.28, label: 'Custom Landscape', mm: 'Custom Size' },
  },
};

export type ElementType = 'text' | 'field' | 'qr' | 'shape' | 'image';

export type FontFamily =
  | 'Helvetica'
  | 'Helvetica-Bold'
  | 'Times-Roman'
  | 'Times-Bold'
  | 'Courier'
  | 'Courier-Bold';

export type ShapeType = 'rectangle' | 'rounded_rectangle' | 'circle' | 'line';

export type QrVerificationType = 'pass_verification' | 'cert_verification' | 'custom_url';

export interface BaseElement {
  id: string;
  type: ElementType;
  name?: string; // Human-readable layer name
  x: number; // in PDF points (pt)
  y: number; // in PDF points (pt)
  width: number; // in PDF points (pt)
  height: number; // in PDF points (pt)
  rotation?: number; // 0-360
  opacity?: number; // 0-1
  zIndex?: number;
  isLocked?: boolean;
  isHidden?: boolean;
  groupId?: string; // Grouping identifier
}

export type TextFittingMode = 'wrap' | 'shrink' | 'fixed';

export interface TextElement extends BaseElement {
  type: 'text';
  content: string;
  fontFamily: FontFamily;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  color: string;
  textAlign: 'left' | 'center' | 'right';
  lineHeight?: number;
  letterSpacing?: number;
  maxLines?: number;
  textFitting?: TextFittingMode;
  minFontSize?: number;
}

export interface FieldElement extends BaseElement {
  type: 'field';
  token: string; // e.g. {{participant.name}}
  fallbackText: string;
  label?: string;
  fontFamily: FontFamily;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  color: string;
  textAlign: 'left' | 'center' | 'right';
  lineHeight?: number;
  letterSpacing?: number;
  maxLines?: number;
  textFitting?: TextFittingMode;
  minFontSize?: number;
  showWhen?: {
    field: string;
    hasValue?: boolean;
    equals?: string;
  };
}

export interface QrElement extends BaseElement {
  type: 'qr';
  qrType: QrVerificationType;
  customUrl?: string;
  darkColor: string;
  lightColor: string;
  showQuietZone: boolean;
  showCaption?: boolean;
  captionText?: string;
}

export interface ShapeElement extends BaseElement {
  type: 'shape';
  shapeType: ShapeType;
  fillColor: string;
  borderColor: string;
  borderWidth: number;
  borderRadius?: number;
}

export interface ImageElement extends BaseElement {
  type: 'image';
  imageUrl: string;
  altText?: string;
  fit: 'contain' | 'cover' | 'fill';
}

export type StudioElement = TextElement | FieldElement | QrElement | ShapeElement | ImageElement;

export interface PassTemplate {
  id: string;
  title: string;
  description?: string | null;
  type: DocumentType;
  paper_size: PaperSize;
  orientation: Orientation;
  width_pt: number;
  height_pt: number;
  background_url?: string | null;
  background_fit: BackgroundFit;
  background_opacity: number;
  elements: StudioElement[];
  is_published: number | boolean;
  is_global: number | boolean;
  version: number;
  created_by?: string | null;
  updated_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CompetitionAssignment {
  id: string;
  competition_slug: string;
  document_type: DocumentType;
  template_id: string;
  template_title?: string;
  updated_at?: string;
}

export interface DataTokenCategory {
  category: string;
  description: string;
  tokens: DataTokenDefinition[];
}

export interface DataTokenDefinition {
  token: string;
  name: string;
  description: string;
  dataType: 'string' | 'number' | 'date' | 'url';
  sampleValue: string;
  category: string;
  isCommon: boolean;
  applicableCompetitions?: string[]; // undefined = all competitions
}

export interface ValidationCheckItem {
  id: string;
  category: 'document' | 'text' | 'qr' | 'assignment' | 'export';
  title: string;
  status: 'pass' | 'warning' | 'error';
  message: string;
}

export interface ValidationReport {
  isValid: boolean;
  canPublish: boolean;
  items: ValidationCheckItem[];
}

export interface ReusableDesignBlock {
  id: string;
  name: string;
  description: string;
  category: 'header' | 'footer' | 'qr_badge' | 'participant_info' | 'sponsor_row' | 'decorative';
  elements: StudioElement[];
}
