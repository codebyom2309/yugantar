import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage, degrees } from 'pdf-lib';
import QRCode from 'qrcode';
import sharp from 'sharp';
import { PassTemplate, StudioElement, TextElement, FieldElement, QrElement, ShapeElement, ImageElement } from '@/types/studio';
import { resolveTokens, getSampleTokenValues } from '@/lib/studioTokens';

// Hex color to pdf-lib RGB helper
function hexToRgb(hex?: string | null) {
  if (!hex || hex === 'transparent') return null;
  const clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16) / 255;
    const g = parseInt(clean[1] + clean[1], 16) / 255;
    const b = parseInt(clean[2] + clean[2], 16) / 255;
    return rgb(r, g, b);
  }
  if (clean.length === 6) {
    const r = parseInt(clean.substring(0, 2), 16) / 255;
    const g = parseInt(clean.substring(2, 4), 16) / 255;
    const b = parseInt(clean.substring(4, 6), 16) / 255;
    return rgb(r, g, b);
  }
  return rgb(0.1, 0.1, 0.1);
}

// Unicode sanitizer for standard PDF-Lib fonts
function sanitizePdfText(str?: string | null): string {
  if (!str) return '';
  return String(str)
    .replace(/₹/g, 'INR ')
    .replace(/•/g, '|')
    .replace(/·/g, '|')
    .replace(/—/g, '-')
    .replace(/–/g, '-')
    .replace(/“/g, '"')
    .replace(/”/g, '"')
    .replace(/’/g, "'")
    .replace(/‘/g, "'")
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
}

// Word-wrapping helper for bounding box constraint in PDF
function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const paragraphs = text.split('\n');
  const result: string[] = [];
  for (const para of paragraphs) {
    if (!para.trim()) {
      result.push('');
      continue;
    }
    const words = para.split(/\s+/);
    let currentLine = '';
    for (const word of words) {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      let width = 0;
      try {
        width = font.widthOfTextAtSize(candidate, fontSize);
      } catch {
        width = candidate.length * (fontSize * 0.5);
      }
      if (width <= maxWidth || !currentLine) {
        currentLine = candidate;
      } else {
        result.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) result.push(currentLine);
  }
  return result;
}

export async function renderTemplateToPdfBuffer(
  template: PassTemplate,
  tokenDataMap?: Record<string, string>,
  verificationOverride?: { passToken?: string; certToken?: string }
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  // Page dimensions in PDF points
  const pageWidth = Number(template.width_pt) || 595.28;
  const pageHeight = Number(template.height_pt) || 841.89;
  const page = pdfDoc.addPage([pageWidth, pageHeight]);

  // Standard Fonts cache
  const fonts: Record<string, PDFFont> = {
    'Helvetica': await pdfDoc.embedFont(StandardFonts.Helvetica),
    'Helvetica-Bold': await pdfDoc.embedFont(StandardFonts.HelveticaBold),
    'Times-Roman': await pdfDoc.embedFont(StandardFonts.TimesRoman),
    'Times-Bold': await pdfDoc.embedFont(StandardFonts.TimesRomanBold),
    'Courier': await pdfDoc.embedFont(StandardFonts.Courier),
    'Courier-Bold': await pdfDoc.embedFont(StandardFonts.CourierBold),
  };

  const tokenValues = tokenDataMap || getSampleTokenValues();

  // 1. Draw Background Image if present
  if (template.background_url && template.background_url.trim()) {
    try {
      let imageBuffer: Buffer | null = null;
      const bgUrl = template.background_url.trim();

      if (bgUrl.startsWith('data:image/')) {
        const base64Data = bgUrl.split(';base64,')[1];
        if (base64Data) {
          imageBuffer = Buffer.from(base64Data, 'base64');
        }
      } else if (bgUrl.startsWith('http://') || bgUrl.startsWith('https://')) {
        const res = await fetch(bgUrl);
        if (res.ok) {
          const arrBuf = await res.arrayBuffer();
          imageBuffer = Buffer.from(arrBuf);
        }
      }

      if (imageBuffer) {
        // Convert any format (WebP, TIFF, SVG) to standard PNG buffer via Sharp
        const pngBuffer = await sharp(imageBuffer).png().toBuffer();
        const embeddedBg = await pdfDoc.embedPng(pngBuffer);

        const imgWidth = embeddedBg.width;
        const imgHeight = embeddedBg.height;
        const opacity = template.background_opacity !== undefined ? Number(template.background_opacity) : 1;

        let drawX = 0;
        let drawY = 0;
        let drawW = pageWidth;
        let drawH = pageHeight;

        if (template.background_fit === 'stretch') {
          drawW = pageWidth;
          drawH = pageHeight;
          drawX = 0;
          drawY = 0;
        } else if (template.background_fit === 'contain') {
          const pageRatio = pageWidth / pageHeight;
          const imgRatio = imgWidth / imgHeight;
          if (imgRatio > pageRatio) {
            drawW = pageWidth;
            drawH = pageWidth / imgRatio;
            drawX = 0;
            drawY = (pageHeight - drawH) / 2;
          } else {
            drawH = pageHeight;
            drawW = pageHeight * imgRatio;
            drawX = (pageWidth - drawW) / 2;
            drawY = 0;
          }
        } else {
          // 'cover' default
          const pageRatio = pageWidth / pageHeight;
          const imgRatio = imgWidth / imgHeight;
          if (imgRatio > pageRatio) {
            drawH = pageHeight;
            drawW = pageHeight * imgRatio;
            drawX = (pageWidth - drawW) / 2;
            drawY = 0;
          } else {
            drawW = pageWidth;
            drawH = pageWidth / imgRatio;
            drawX = 0;
            drawY = (pageHeight - drawH) / 2;
          }
        }

        page.drawImage(embeddedBg, {
          x: drawX,
          y: drawY,
          width: drawW,
          height: drawH,
          opacity,
        });
      }
    } catch (bgErr) {
      console.warn('Failed to load or embed background image in PDF:', bgErr);
    }
  }

  // 2. Sort elements by zIndex
  const elements = Array.isArray(template.elements)
    ? [...template.elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
    : [];

  // 3. Render Each Element
  for (const element of elements) {
    if (element.isHidden) continue;

    const elemX = Number(element.x) || 0;
    const elemY = Number(element.y) || 0;
    const elemW = Number(element.width) || 10;
    const elemH = Number(element.height) || 10;
    const elemOpacity = element.opacity !== undefined ? Number(element.opacity) : 1;

    // Convert Canvas Top-Left coordinate to PDF-Lib Bottom-Left coordinate
    const pdfY = pageHeight - elemY - elemH;

    switch (element.type) {
      case 'shape': {
        const shape = element as ShapeElement;
        const fillColor = hexToRgb(shape.fillColor);
        const borderColor = hexToRgb(shape.borderColor);
        const borderWidth = Number(shape.borderWidth) || 0;

        if (shape.shapeType === 'line') {
          page.drawLine({
            start: { x: elemX, y: pdfY + elemH / 2 },
            end: { x: elemX + elemW, y: pdfY + elemH / 2 },
            thickness: borderWidth || 1,
            color: borderColor || fillColor || rgb(0.2, 0.2, 0.2),
            opacity: elemOpacity,
          });
        } else if (shape.shapeType === 'circle') {
          const radius = Math.min(elemW, elemH) / 2;
          page.drawCircle({
            x: elemX + radius,
            y: pdfY + radius,
            size: radius,
            color: fillColor || undefined,
            borderColor: borderColor || undefined,
            borderWidth: borderWidth > 0 ? borderWidth : undefined,
            opacity: elemOpacity,
          });
        } else {
          // 'rectangle' or 'rounded_rectangle'
          page.drawRectangle({
            x: elemX,
            y: pdfY,
            width: elemW,
            height: elemH,
            color: fillColor || undefined,
            borderColor: borderColor || undefined,
            borderWidth: borderWidth > 0 ? borderWidth : undefined,
            opacity: elemOpacity,
            rotate: element.rotation ? degrees(element.rotation) : undefined,
          });
        }
        break;
      }

      case 'text':
      case 'field': {
        const textElem = element as TextElement | FieldElement;
        const fontKey = textElem.fontFamily || (textElem.fontWeight === 'bold' ? 'Helvetica-Bold' : 'Helvetica');
        const font = fonts[fontKey] || fonts['Helvetica'];
        const baseFontSize = Number(textElem.fontSize) || 12;
        const textColor = hexToRgb(textElem.color) || rgb(0.1, 0.1, 0.1);

        let rawText = '';
        if (textElem.type === 'field') {
          const field = textElem as FieldElement;
          rawText = tokenValues[field.token] || field.fallbackText || field.token;
        } else {
          rawText = resolveTokens((textElem as TextElement).content, tokenValues);
        }

        const cleanText = sanitizePdfText(rawText);
        const fitting = textElem.textFitting || 'wrap';
        let effectiveFontSize = baseFontSize;
        const minSize = textElem.minFontSize || 8;

        if (fitting === 'shrink') {
          let textWidth = 0;
          try {
            textWidth = font.widthOfTextAtSize(cleanText, effectiveFontSize);
          } catch {
            textWidth = cleanText.length * (effectiveFontSize * 0.5);
          }
          while (textWidth > elemW && effectiveFontSize > minSize) {
            effectiveFontSize = Math.max(minSize, effectiveFontSize - 0.5);
            try {
              textWidth = font.widthOfTextAtSize(cleanText, effectiveFontSize);
            } catch {
              textWidth = cleanText.length * (effectiveFontSize * 0.5);
            }
          }
        }

        const wrapped = fitting === 'wrap'
          ? wrapText(cleanText, font, effectiveFontSize, elemW)
          : cleanText.split('\n');

        const finalLines = textElem.maxLines && textElem.maxLines > 0
          ? wrapped.slice(0, textElem.maxLines)
          : wrapped;

        const lineHeight = effectiveFontSize * (textElem.lineHeight || 1.25);
        const totalTextHeight = finalLines.length * lineHeight;
        const verticalPad = Math.max(0, (elemH - totalTextHeight) / 2);

        for (let i = 0; i < finalLines.length; i++) {
          const line = finalLines[i];
          if (!line.trim() && finalLines.length > 1) continue;

          let textWidth = 0;
          try {
            textWidth = font.widthOfTextAtSize(line, effectiveFontSize);
          } catch {
            textWidth = line.length * (effectiveFontSize * 0.5);
          }

          let lineX = elemX;
          if (textElem.textAlign === 'center') {
            lineX = elemX + Math.max(0, (elemW - textWidth) / 2);
          } else if (textElem.textAlign === 'right') {
            lineX = elemX + Math.max(0, elemW - textWidth);
          }

          const lineY = pdfY + elemH - verticalPad - (i + 1) * lineHeight + (lineHeight - effectiveFontSize);

          try {
            page.drawText(line, {
              x: lineX,
              y: lineY,
              size: effectiveFontSize,
              font,
              color: textColor,
              opacity: elemOpacity,
              rotate: element.rotation ? degrees(element.rotation) : undefined,
            });
          } catch (textErr) {
            console.warn('Error drawing text in PDF:', textErr);
          }
        }
        break;
      }

      case 'qr': {
        const qrElem = element as QrElement;
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://yugantar2026.pce.ac.in';

        let targetUrl = `${appUrl}/verify/${verificationOverride?.passToken || tokenValues['{{registration.verifyToken}}'] || 'sample-pass-token'}`;
        if (qrElem.qrType === 'cert_verification') {
          targetUrl = `${appUrl}/verify/${verificationOverride?.certToken || tokenValues['{{certificate.id}}'] || 'sample-cert-token'}`;
        } else if (qrElem.qrType === 'custom_url' && qrElem.customUrl) {
          targetUrl = qrElem.customUrl;
        }

        try {
          const qrPng = await QRCode.toBuffer(targetUrl, {
            type: 'png',
            width: Math.max(160, Math.round(elemW * 2)),
            margin: qrElem.showQuietZone ? 1 : 0,
            color: {
              dark: qrElem.darkColor || '#10264A',
              light: qrElem.lightColor || '#FFFFFF',
            },
          });

          const qrImg = await pdfDoc.embedPng(qrPng);
          page.drawImage(qrImg, {
            x: elemX,
            y: pdfY,
            width: elemW,
            height: elemH,
            opacity: elemOpacity,
            rotate: element.rotation ? degrees(element.rotation) : undefined,
          });

          if (qrElem.showCaption && qrElem.captionText) {
            const captionFont = fonts['Helvetica'];
            const captionSize = 7.5;
            const captionClean = sanitizePdfText(qrElem.captionText);
            const captionWidth = captionFont.widthOfTextAtSize(captionClean, captionSize);
            const captionX = elemX + Math.max(0, (elemW - captionWidth) / 2);
            page.drawText(captionClean, {
              x: captionX,
              y: pdfY - 9,
              size: captionSize,
              font: captionFont,
              color: hexToRgb(qrElem.darkColor) || rgb(0.2, 0.2, 0.2),
              opacity: elemOpacity,
            });
          }
        } catch (qrErr) {
          console.warn('Error generating QR element in PDF:', qrErr);
        }
        break;
      }

      case 'image': {
        const imgElem = element as ImageElement;
        if (imgElem.imageUrl) {
          try {
            let imgBuf: Buffer | null = null;
            if (imgElem.imageUrl.startsWith('data:image/')) {
              const base64Data = imgElem.imageUrl.split(';base64,')[1];
              if (base64Data) imgBuf = Buffer.from(base64Data, 'base64');
            } else if (imgElem.imageUrl.startsWith('http')) {
              const res = await fetch(imgElem.imageUrl);
              if (res.ok) {
                const arr = await res.arrayBuffer();
                imgBuf = Buffer.from(arr);
              }
            }

            if (imgBuf) {
              const pngBuf = await sharp(imgBuf).png().toBuffer();
              const embedded = await pdfDoc.embedPng(pngBuf);
              page.drawImage(embedded, {
                x: elemX,
                y: pdfY,
                width: elemW,
                height: elemH,
                opacity: elemOpacity,
                rotate: element.rotation ? degrees(element.rotation) : undefined,
              });
            }
          } catch (imgErr) {
            console.warn('Error embedding element image in PDF:', imgErr);
          }
        }
        break;
      }
    }
  }

  return await pdfDoc.save();
}
