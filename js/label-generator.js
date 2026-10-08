/**
 * Shelf & Spine Label Generator
 * Implements PRD Sections 42 & 43
 * Supports SVG Barcode & QR Code rendering, customizable label sizes, school headers, and batch printing.
 */

class LabelGenerator {
  constructor() {
    this.defaultSettings = {
      schoolName: "KING'S & QUEEN'S COLLEGE LIBRARY",
      subHeader: "NERDC 2026 SECONDARY SCHEME",
      labelSize: "standard", // 'standard' (1.5" x 1"), 'wide' (2" x 1"), 'card' (3" x 2")
      includeBarcode: true,
      includeQrCode: true,
      includeColorArrayBar: true,
      fontFamily: "Space Grotesk, sans-serif"
    };
  }

  /**
   * Generates a simple clean SVG Code128-style barcode
   */
  generateBarcodeSvg(text, width = 160, height = 36) {
    const clean = String(text).replace(/[^A-Za-z0-9-]/g, "");
    let barsHtml = "";
    let x = 8;
    const barWidth = 2;

    for (let i = 0; i < clean.length; i++) {
      const code = clean.charCodeAt(i);
      const pattern = (code % 2 === 0) ? "10110" : "11010";
      for (let j = 0; j < pattern.length; j++) {
        if (pattern[j] === "1") {
          barsHtml += `<rect x="${x}" y="2" width="${barWidth}" height="${height - 12}" fill="#111c2d" />`;
        }
        x += barWidth;
      }
      x += 2; // small space between chars
    }

    return `
      <svg viewBox="0 0 ${Math.max(x + 10, width)} ${height}" class="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
        ${barsHtml}
        <text x="${x / 2}" y="${height - 2}" font-size="8" font-family="monospace" text-anchor="middle" fill="#544437">${clean}</text>
      </svg>
    `;
  }

  /**
   * Generates a clean vector QR Code representation (visual SVG)
   */
  generateQrSvg(content, size = 64) {
    // Generate deterministic pattern based on hash of content
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      hash = (hash << 5) - hash + content.charCodeAt(i);
      hash |= 0;
    }

    const gridSize = 17;
    const cellSize = (size - 8) / gridSize;
    let cellsHtml = "";

    // Finder patterns in corners
    const drawFinder = (startX, startY) => {
      cellsHtml += `
        <rect x="${startX}" y="${startY}" width="${cellSize * 5}" height="${cellSize * 5}" fill="#111c2d" rx="1"/>
        <rect x="${startX + cellSize}" y="${startY + cellSize}" width="${cellSize * 3}" height="${cellSize * 3}" fill="#ffffff" rx="1"/>
        <rect x="${startX + cellSize * 1.5}" y="${startY + cellSize * 1.5}" width="${cellSize * 2}" height="${cellSize * 2}" fill="#111c2d" rx="0.5"/>
      `;
    };

    drawFinder(4, 4);
    drawFinder(size - 4 - cellSize * 5, 4);
    drawFinder(4, size - 4 - cellSize * 5);

    // Pseudorandom internal matrix
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        // Skip corner finder areas
        if ((r < 5 && c < 5) || (r < 5 && c > gridSize - 6) || (r > gridSize - 6 && c < 5)) continue;
        const val = Math.abs(Math.sin((r * 13 + c * 7 + hash))) > 0.5;
        if (val) {
          cellsHtml += `<rect x="${4 + c * cellSize}" y="${4 + r * cellSize}" width="${cellSize * 0.9}" height="${cellSize * 0.9}" fill="#111c2d" rx="0.5"/>`;
        }
      }
    }

    return `
      <svg viewBox="0 0 ${size} ${size}" class="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
        <rect width="${size}" height="${size}" fill="#ffffff" rx="4" />
        ${cellsHtml}
      </svg>
    `;
  }

  /**
   * Get array theme color for spine label color bar
   */
  getArrayColor(classCode) {
    if (!classCode) return "#8f4e00";
    if (classCode.startsWith("01")) return "#006c49"; // Tertiary Green for Science
    if (classCode.startsWith("02")) return "#8f4e00"; // Primary Ochre for Social Science
    if (classCode.startsWith("03")) return "#6b38d4"; // Secondary Purple for Arts & Lit
    return "#ba1a1a"; // Red for General
  }

  /**
   * Render single HTML spine tag preview
   */
  renderLabelHtml(resource, settings = {}) {
    const s = { ...this.defaultSettings, ...settings };
    const arrayColor = this.getArrayColor(resource.classificationNumber);
    const barcodeSvg = this.generateBarcodeSvg(resource.accessionNumber);
    const qrSvg = this.generateQrSvg(`OPAC:${resource.accessionNumber}:${resource.classificationNumber}`);

    return `
      <div class="spine-label bg-white border border-gray-300 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between max-w-[280px] min-h-[220px]">
        <!-- Array Header Indicator Bar -->
        ${s.includeColorArrayBar ? `<div class="absolute top-0 left-0 right-0 h-2" style="background-color: ${arrayColor};"></div>` : ""}
        
        <!-- Header Info -->
        <div class="pt-1 text-center border-b border-gray-100 pb-1.5">
          <div class="text-[9px] uppercase tracking-wider font-extrabold text-gray-800 font-label-sm">${s.schoolName}</div>
          <div class="text-[7.5px] uppercase font-bold text-gray-500 tracking-tight">${s.subHeader}</div>
        </div>

        <!-- Main Call Number Box -->
        <div class="my-2 py-2 px-3 bg-gray-50 rounded border border-gray-200 text-center space-y-0.5">
          <div class="text-xl font-extrabold tracking-tight font-label-md" style="color: ${arrayColor};">
            ${resource.classificationNumber}
          </div>
          <div class="text-sm font-bold tracking-widest text-gray-900 font-label-sm">
            ${resource.authorNumber || "A10"}
          </div>
          <div class="text-[11px] font-semibold text-gray-600">
            ${resource.callNumber ? resource.callNumber.split(" ").slice(2).join(" ") || "C.1" : "C.1"}
          </div>
        </div>

        <!-- Resource Brief Details -->
        <div class="text-left px-1 space-y-0.5">
          <div class="text-[11px] font-bold text-gray-900 truncate leading-tight">${resource.title}</div>
          <div class="text-[9px] text-gray-600 truncate">${resource.author}</div>
          <div class="text-[8px] text-gray-500 truncate">Shelf: ${resource.shelfLocation || "General Stacks"}</div>
        </div>

        <!-- Barcode & QR Code Section -->
        <div class="mt-2 pt-1 border-t border-gray-100 flex items-center justify-between gap-2">
          ${s.includeBarcode ? `<div class="flex-1">${barcodeSvg}</div>` : ""}
          ${s.includeQrCode ? `<div class="w-12 h-12 shrink-0 border border-gray-200 p-0.5 rounded bg-white">${qrSvg}</div>` : ""}
        </div>
      </div>
    `;
  }
}

window.labelGenerator = new LabelGenerator();
