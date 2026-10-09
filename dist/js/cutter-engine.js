/**
 * Cutter Table & Call Number Builder Module
 * Implements PRD Sections 36 & 37
 * 
 * Generates Author Literary Numbers using configurable Cutter table rules
 * and builds standardized call numbers: [Classification] [AuthorNumber] [Copy/Volume]
 */

class CutterEngine {
  constructor() {
    this.cutterTable = [...(window.INITIAL_CUTTER_TABLE || [])];
  }

  /**
   * Generates or looks up an Author Cutter Number from author's surname
   * Example: "Okeke, P.N." -> "O41"
   * Example: "Achebe, Chinua" -> "A17"
   * Example: "Adeleke" -> "A234"
   */
  generateCutterNumber(authorName) {
    if (!authorName || typeof authorName !== "string") {
      return "A10";
    }

    // Extract primary surname
    let surname = authorName.trim();
    if (surname.includes(",")) {
      surname = surname.split(",")[0].trim();
    } else if (surname.includes(" ")) {
      // If full name like "Chinua Achebe" or "P.N. Okeke"
      const parts = surname.split(" ").filter(p => !p.endsWith("."));
      surname = parts[parts.length - 1] || parts[0];
    }

    const cleanSurname = surname.toUpperCase().replace(/[^A-Z]/g, "");
    if (!cleanSurname) return "A10";

    const initial = cleanSurname.charAt(0);
    const prefix3 = cleanSurname.substring(0, 3);
    const prefix2 = cleanSurname.substring(0, 2);

    // 1. Look for exact prefix in configurable Cutter table
    const match3 = this.cutterTable.find(entry => entry.prefix === prefix3);
    if (match3) {
      return `${initial}${match3.number}`;
    }

    const match2 = this.cutterTable.find(entry => entry.prefix === prefix2);
    if (match2) {
      return `${initial}${match2.number}`;
    }

    // 2. Standard Cutter-Sanborn algorithmic table fallback:
    // Surnames starting with consonants:
    // 2nd letter range: a-d=2, e-h=3, i-l=4, m-p=5, q-t=6, u-z=7
    // 3rd letter range: a-d=2, e-h=3, etc.
    let codeNum = "";
    for (let i = 1; i < Math.min(3, cleanSurname.length); i++) {
      const charCode = cleanSurname.charCodeAt(i) - 65; // 0 to 25
      const digit = Math.min(9, Math.max(1, Math.floor(charCode / 3) + 1));
      codeNum += digit;
    }

    if (codeNum.length === 0) codeNum = "12";
    if (codeNum.length === 1) codeNum += "5";

    return `${initial}${codeNum}`;
  }

  /**
   * Builds standardized complete Call Number
   * PRD Sec 37: [Classification] [AuthorNumber] [Optional Copy/Volume]
   * Example: "011.2 O41 C.1"
   */
  buildCallNumber(classificationCode, authorNumber, copyVol = "C.1") {
    const parts = [];
    if (classificationCode) parts.push(classificationCode.trim());
    if (authorNumber) parts.push(authorNumber.trim());
    if (copyVol && copyVol.trim()) parts.push(copyVol.trim());

    return parts.join(" ");
  }

  /**
   * Add or update an entry in the configurable Cutter table
   */
  addOrUpdateCutterEntry(prefix, number, author) {
    const cleanPrefix = prefix.toUpperCase().trim();
    const existingIndex = this.cutterTable.findIndex(e => e.prefix === cleanPrefix);

    if (existingIndex >= 0) {
      this.cutterTable[existingIndex] = { prefix: cleanPrefix, number: String(number).trim(), author };
    } else {
      this.cutterTable.push({ prefix: cleanPrefix, number: String(number).trim(), author });
    }

    // Sort table alphabetically
    this.cutterTable.sort((a, b) => a.prefix.localeCompare(b.prefix));
    return this.cutterTable;
  }
}

window.cutterEngine = new CutterEngine();
