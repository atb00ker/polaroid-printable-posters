(function () {
const DPI = 300;
const MM_TO_PX = DPI / 25.4;
const MARGIN_MM = 12.7;
const GUTTER_MM = 5;

const A4_LANDSCAPE_W_MM = 297;
const A4_LANDSCAPE_H_MM = 210;

const BASE_LAYOUT_WIDTH = 736;

const BG_COLOR = '#e1ddd9';
const TEXT_COLOR = '#000000';

const LINE_HEIGHT = 1.35;
const PARAGRAPH_LINE_HEIGHT = 1.5;
const HR_THICKNESS = 1;
const HR_COLOR = '#aaa8a4';

const FALLBACK = 'Helvetica, Arial, sans-serif';
const PARAGRAPH_TAG_RE = /(<br\s*\/?>|<hr\s*\/?>)/gi;

/**
 * @typedef {Object} Layout
 * @property {number} posterWidth
 * @property {number} posterHeight
 * @property {number} scale
 * @property {number} paddingX
 * @property {number} imageTop
 * @property {number} contentWidth
 * @property {number} imageSize
 * @property {number} titleSize
 * @property {number} yearSize
 * @property {number} metaSize
 * @property {number} paragraphSize
 * @property {number} labelWidth
 * @property {number} labelValueGap
 * @property {number} rowGap
 * @property {number} sectionGap
 * @property {number} paragraphGap
 * @property {number} hrGap
 */

/**
 * @typedef {Object} PosterData
 * @property {HTMLImageElement} image
 * @property {string} [name]
 * @property {string} [year]
 * @property {{ key: string, value: string }[]} metadata
 * @property {string} [paragraph]
 * @property {string} [fontPresetId]
 */

function mmToPx(mm) {
  return Math.round(mm * MM_TO_PX);
}

/**
 * @returns {Layout}
 */
function getLayout() {
  const cardWMm = (A4_LANDSCAPE_W_MM - MARGIN_MM * 2 - GUTTER_MM) / 2;
  const cardHMm = A4_LANDSCAPE_H_MM - MARGIN_MM * 2;

  const posterWidth = mmToPx(cardWMm);
  const posterHeight = mmToPx(cardHMm);
  const scale = posterWidth / BASE_LAYOUT_WIDTH;
  const paddingX = Math.round(posterWidth * 0.08);
  const imageTop = Math.round(posterWidth * 0.055);
  const contentWidth = posterWidth - paddingX * 2;
  const sectionGap = Math.round(24 * scale);

  let imageSize = contentWidth;
  if (posterHeight < posterWidth) {
    const textReserve = Math.round(posterHeight * 0.38);
    const maxImage = posterHeight - imageTop - sectionGap - textReserve;
    imageSize = Math.min(contentWidth, Math.max(maxImage, mmToPx(35)));
  }

  return {
    posterWidth,
    posterHeight,
    scale,
    paddingX,
    imageTop,
    contentWidth,
    imageSize,
    titleSize: Math.round(54 * scale),
    yearSize: Math.round(28 * scale),
    metaSize: Math.round(15 * scale),
    paragraphSize: Math.round(22 * scale),
    labelWidth: Math.round(120 * scale),
    labelValueGap: Math.round(12 * scale),
    rowGap: Math.round(7 * scale),
    sectionGap,
    paragraphGap: Math.round(18 * scale),
    hrGap: Math.round(10 * scale),
  };
}

function getFontFamilies(presetId) {
  const preset = window.PosterFonts.getPreset(presetId || window.PosterFonts.getActivePresetId());
  return {
    title: `${preset.titleFamily}, ${FALLBACK}`,
    body: `${preset.bodyFamily}, ${FALLBACK}`,
  };
}

function setFont(ctx, family, weight, size) {
  ctx.font = `${weight} ${size}px ${family}`;
}

function drawCoverImage(ctx, img, x, y, w, h) {
  const imgRatio = img.width / img.height;
  const boxRatio = w / h;
  let sx, sy, sw, sh;

  if (imgRatio > boxRatio) {
    sh = img.height;
    sw = sh * boxRatio;
    sx = (img.width - sw) / 2;
    sy = 0;
  } else {
    sw = img.width;
    sh = sw / boxRatio;
    sx = 0;
    sy = (img.height - sh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const lines = [];
  let current = words[0];

  for (let i = 1; i < words.length; i++) {
    const next = `${current} ${words[i]}`;
    if (ctx.measureText(next).width <= maxWidth) {
      current = next;
    } else {
      lines.push(current);
      current = words[i];
    }
  }
  lines.push(current);
  return lines;
}

function parseParagraphHtml(text) {
  /** @type {{ type: 'text' | 'break' | 'hr', content?: string }[]} */
  const tokens = [];
  let lastIndex = 0;
  let match;

  PARAGRAPH_TAG_RE.lastIndex = 0;
  while ((match = PARAGRAPH_TAG_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }

    const tag = match[1].toLowerCase();
    if (tag.startsWith('<br')) {
      tokens.push({ type: 'break' });
    } else if (tag.startsWith('<hr')) {
      tokens.push({ type: 'hr' });
    }

    lastIndex = PARAGRAPH_TAG_RE.lastIndex;
  }

  if (lastIndex < text.length) {
    tokens.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return tokens;
}

function wrapParagraphText(ctx, text, maxWidth) {
  const paragraphs = text.split(/\n/).map((p) => p.trim()).filter(Boolean);
  const lines = [];

  for (const paragraph of paragraphs) {
    lines.push(...wrapText(ctx, paragraph, maxWidth));
  }

  return lines;
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} bodyFont
 * @param {string} text
 * @param {number} x
 * @param {number} startY
 * @param {number} maxWidth
 * @param {Layout} layout
 * @returns {number}
 */
function drawParagraph(ctx, bodyFont, text, x, startY, maxWidth, layout) {
  setFont(ctx, bodyFont, 400, layout.paragraphSize);
  ctx.fillStyle = TEXT_COLOR;
  ctx.textBaseline = 'top';

  const paragraphLineHeight = Math.round(layout.paragraphSize * PARAGRAPH_LINE_HEIGHT);
  let y = startY;

  for (const token of parseParagraphHtml(text)) {
    if (token.type === 'break') {
      y += paragraphLineHeight;
      continue;
    }

    if (token.type === 'hr') {
      y += layout.hrGap;
      ctx.strokeStyle = HR_COLOR;
      ctx.lineWidth = HR_THICKNESS;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + maxWidth, y);
      ctx.stroke();
      y += layout.hrGap;
      continue;
    }

    const lines = wrapParagraphText(ctx, token.content || '', maxWidth);
    for (const line of lines) {
      ctx.fillText(line, x, y);
      y += paragraphLineHeight;
    }
  }

  return y;
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {PosterData} data
 * @param {Layout} layout
 * @param {number} offsetX
 * @param {number} offsetY
 */
function drawPosterCard(ctx, data, layout, offsetX, offsetY) {
  const { title: titleFont, body: bodyFont } = getFontFamilies(data.fontPresetId);
  const imageX = offsetX + layout.paddingX;
  const imageY = offsetY + layout.imageTop;

  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(offsetX, offsetY, layout.posterWidth, layout.posterHeight);

  drawCoverImage(ctx, data.image, imageX, imageY, layout.imageSize, layout.imageSize);

  let y = imageY + layout.imageSize + layout.sectionGap;

  if (data.name || data.year) {
    ctx.fillStyle = TEXT_COLOR;
    ctx.textBaseline = 'top';

    if (data.name) {
      setFont(ctx, titleFont, 700, layout.titleSize);
      const title = data.name.toUpperCase();
      ctx.fillText(title, offsetX + layout.paddingX, y);
    }

    if (data.year) {
      const yearX = data.name
        ? offsetX + layout.paddingX + ctx.measureText(data.name.toUpperCase()).width + Math.round(10 * layout.scale)
        : offsetX + layout.paddingX;
      setFont(ctx, bodyFont, 300, layout.yearSize);
      ctx.fillText(data.year, yearX, y + Math.round((layout.titleSize - layout.yearSize) * 0.15));
    }

    y += layout.titleSize + layout.sectionGap;
  }

  if (data.metadata.length > 0) {
    const valueX = offsetX + layout.paddingX + layout.labelWidth + layout.labelValueGap;
    const valueMaxWidth = layout.contentWidth - layout.labelWidth - layout.labelValueGap;
    const lineHeight = Math.round(layout.metaSize * LINE_HEIGHT);

    for (const { key, value } of data.metadata) {
      setFont(ctx, bodyFont, 700, layout.metaSize);
      ctx.fillStyle = TEXT_COLOR;
      ctx.textBaseline = 'top';
      ctx.fillText(key, offsetX + layout.paddingX, y);

      setFont(ctx, bodyFont, 400, layout.metaSize);
      const valueLines = wrapText(ctx, value.toUpperCase(), valueMaxWidth);

      for (let i = 0; i < valueLines.length; i++) {
        ctx.fillText(valueLines[i], valueX, y + i * lineHeight);
      }

      y += Math.max(lineHeight, valueLines.length * lineHeight) + layout.rowGap;
    }
  }

  if (data.paragraph) {
    y += layout.paragraphGap - layout.rowGap;
    drawParagraph(ctx, bodyFont, data.paragraph, offsetX + layout.paddingX, y, layout.contentWidth, layout);
  }
}

/**
 * Preview always uses the landscape A4 slot layout (tall card for side-by-side on landscape sheet).
 * @param {HTMLCanvasElement} canvas
 * @param {PosterData} data
 */
function renderPoster(canvas, data) {
  const layout = getLayout();
  canvas.width = layout.posterWidth;
  canvas.height = layout.posterHeight;

  const ctx = canvas.getContext('2d');
  drawPosterCard(ctx, data, layout, 0, 0);
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {PosterData[]} posters
 */
function renderA4LandscapeSheet(canvas, posters) {
  const layout = getLayout();
  const sheetW = mmToPx(A4_LANDSCAPE_W_MM);
  const sheetH = mmToPx(A4_LANDSCAPE_H_MM);
  const margin = mmToPx(MARGIN_MM);
  const gutter = mmToPx(GUTTER_MM);

  canvas.width = sheetW;
  canvas.height = sheetH;

  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, sheetW, sheetH);

  drawPosterCard(ctx, posters[0], layout, margin, margin);
  drawPosterCard(ctx, posters[1], layout, margin + layout.posterWidth + gutter, margin);
}

/**
 * @param {PosterData} data
 * @returns {HTMLCanvasElement}
 */
function createDownloadCanvas(data) {
  const layout = getLayout();
  const canvas = document.createElement('canvas');
  canvas.width = layout.posterWidth;
  canvas.height = layout.posterHeight;

  const ctx = canvas.getContext('2d');
  drawPosterCard(ctx, data, layout, 0, 0);
  return canvas;
}

function downloadCanvas(canvas, filename, format) {
  const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
  const quality = format === 'jpeg' ? 0.92 : undefined;

  canvas.toBlob(
    (blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    },
    mimeType,
    quality
  );
}

/**
 * @param {HTMLCanvasElement} _canvas
 * @param {PosterData} data
 * @param {'png' | 'jpeg'} format
 */
function downloadPoster(_canvas, data, format) {
  const exportCanvas = createDownloadCanvas(data);

  const namePart = sanitizeFilename(data.name || 'poster');
  const yearPart = data.year ? `-${sanitizeFilename(data.year)}` : '';
  const filename = `${namePart}${yearPart}.${format}`;
  downloadCanvas(exportCanvas, filename, format);
}

function getJsPDFConstructor() {
  if (window.jspdf && window.jspdf.jsPDF) {
    return window.jspdf.jsPDF;
  }
  if (typeof window.jsPDF === 'function') {
    return window.jsPDF;
  }
  throw new Error('jsPDF is not loaded. Check that ../deps/js/jspdf.umd.min.js is included before poster.js.');
}

/**
 * @param {PosterData[]} posters
 */
function downloadA4Pdf(posters) {
  const canvas = document.createElement('canvas');
  renderA4LandscapeSheet(canvas, posters);

  const imgData = canvas.toDataURL('image/jpeg', 0.92);
  const jsPDF = getJsPDFConstructor();
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  doc.addImage(imgData, 'JPEG', 0, 0, A4_LANDSCAPE_W_MM, A4_LANDSCAPE_H_MM);

  const name1 = sanitizeFilename(posters[0].name || 'poster-1');
  const name2 = sanitizeFilename(posters[1].name || 'poster-2');
  doc.save(`${name1}-${name2}-a4.pdf`);
}

function sanitizeFilename(text) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'poster';
}

function ensureFontsLoaded() {
  return window.PosterFonts.ensureFontsLoaded();
}

window.Poster = {
  renderPoster,
  renderA4LandscapeSheet,
  downloadPoster,
  downloadA4Pdf,
  ensureFontsLoaded,
};
})();
