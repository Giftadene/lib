/**
 * Classification Engine for 2026 Nigerian Secondary School Scheme
 * Implements PRD Sections 8, 27, 28, 29, 30, 45, 47, 48, 50, 60, 64, 65, 77, 86
 */

class ClassificationEngine {
  constructor() {
    this.masterNodes = new Map();
    this.localNodes = new Map();
    this.treeCache = null;
    this.init();
  }

  init() {
    // Load Master Schedule
    if (window.MASTER_CLASSIFICATION_SCHEDULE) {
      window.MASTER_CLASSIFICATION_SCHEDULE.forEach(node => {
        this.masterNodes.set(node.code, { ...node, source: "MASTER" });
      });
    }

    // Load Local School Extensions
    if (window.LOCAL_SCHOOL_EXTENSIONS) {
      window.LOCAL_SCHOOL_EXTENSIONS.forEach(ext => {
        this.localNodes.set(ext.code, { ...ext, source: "LOCAL" });
      });
    }

    this.rebuildTree();
  }

  /**
   * Rebuild hierarchical tree structure from nodes
   */
  rebuildTree() {
    const allNodes = this.getAllNodes();
    const nodeMap = new Map();
    const rootNodes = [];

    // Clone nodes for tree construction
    allNodes.forEach(node => {
      nodeMap.set(node.code, { ...node, children: [] });
    });

    // Link parents and children
    nodeMap.forEach(node => {
      if (!node.parentId || node.code === "0") {
        rootNodes.push(node);
      } else {
        // Parent may be code or parent code
        const parentNode = nodeMap.get(node.parentId);
        if (parentNode) {
          parentNode.children.push(node);
        } else {
          // If parent is not found, treat as top level
          rootNodes.push(node);
        }
      }
    });

    this.treeCache = rootNodes;
    return this.treeCache;
  }

  /**
   * Retrieve all nodes (master + local)
   */
  getAllNodes() {
    const nodes = [];
    this.masterNodes.forEach(n => nodes.push(n));
    this.localNodes.forEach(n => nodes.push(n));
    return nodes;
  }

  /**
   * Find a node by exact code
   */
  getNode(code) {
    if (!code) return null;
    const cleanCode = String(code).trim();
    return this.localNodes.get(cleanCode) || this.masterNodes.get(cleanCode) || null;
  }

  /**
   * Search classifications by query (code, title, subject heading, synonym, index term)
   */
  search(query, options = {}) {
    if (!query || typeof query !== "string") return [];
    const q = query.trim().toLowerCase();
    const allNodes = this.getAllNodes();
    const results = [];

    allNodes.forEach(node => {
      let score = 0;
      const codeLower = String(node.code).toLowerCase();
      const nameLower = (node.name || "").toLowerCase();
      const displayLower = (node.displayName || "").toLowerCase();
      const descLower = (node.description || "").toLowerCase();

      // Exact code match
      if (codeLower === q) {
        score += 100;
      } else if (codeLower.startsWith(q)) {
        score += 60;
      } else if (codeLower.includes(q)) {
        score += 40;
      }

      // Title / Name match
      if (nameLower === q || displayLower === q) {
        score += 80;
      } else if (nameLower.includes(q) || displayLower.includes(q)) {
        score += 50;
      }

      // Subject headings match
      if (node.subjectHeadings) {
        node.subjectHeadings.forEach(sh => {
          const shLower = sh.toLowerCase();
          if (shLower === q) score += 70;
          else if (shLower.includes(q)) score += 35;
        });
      }

      // Synonyms match
      if (node.synonyms) {
        node.synonyms.forEach(syn => {
          const synLower = syn.toLowerCase();
          if (synLower === q) score += 65;
          else if (synLower.includes(q)) score += 30;
        });
      }

      // Index terms match
      if (node.indexTerms) {
        node.indexTerms.forEach(term => {
          const tLower = term.toLowerCase();
          if (tLower === q) score += 60;
          else if (tLower.includes(q)) score += 25;
        });
      }

      // Description / Scope note match
      if (descLower.includes(q)) score += 15;
      if (node.scopeNote && node.scopeNote.toLowerCase().includes(q)) score += 15;

      if (score > 0) {
        results.push({ node, score });
      }
    });

    // Sort by relevance score descending
    results.sort((a, b) => b.score - a.score);
    return results.map(r => r.node);
  }

  /**
   * Breadcrumb generator: returns hierarchy path up to root
   */
  getBreadcrumbs(code) {
    const crumbs = [];
    let current = this.getNode(code);

    while (current) {
      crumbs.unshift(current);
      if (current.parentId && current.parentId !== current.code) {
        current = this.getNode(current.parentId);
      } else {
        break;
      }
    }

    return crumbs;
  }

  /**
   * Get direct children of a node
   */
  getChildren(code) {
    const allNodes = this.getAllNodes();
    return allNodes.filter(n => n.parentId === code);
  }

  /**
   * Classification Suggester / AI Assistant Engine
   * Implements PRD Sec 29, 30, 64, 65, 74
   */
  suggestClassification(input) {
    const { title = "", author = "", keywords = "", description = "", subject = "" } = input;
    const combinedTokens = [
      ...title.toLowerCase().split(/[\s,.:;?!/()-]+/),
      ...keywords.toLowerCase().split(/[\s,.:;?!/()-]+/),
      ...description.toLowerCase().split(/[\s,.:;?!/()-]+/),
      ...subject.toLowerCase().split(/[\s,.:;?!/()-]+/)
    ].filter(t => t.length > 2);

    const scoredNodes = new Map();

    const addScore = (code, points, reason) => {
      const node = this.getNode(code);
      if (!node) return;
      if (node.status === "UNASSIGNED") return; // PRD Sec 83: Do not suggest unassigned nodes as active subjects

      const current = scoredNodes.get(code) || { node, score: 0, matchedReasons: [] };
      current.score += points;
      if (reason && !current.matchedReasons.includes(reason)) {
        current.matchedReasons.push(reason);
      }
      scoredNodes.set(code, current);
    };

    // Specific domain heuristics for Nigerian secondary curriculum
    const textBlob = `${title} ${keywords} ${description} ${subject}`.toLowerCase();

    // Physics / Electricity
    if (/electric|current|voltage|circuit|resistance|ohm|transformer|magnet|battery/.test(textBlob)) {
      addScore("011.2", 85, "Matched Electrical Principles & Circuits");
      addScore("011", 50, "Parent Physics Class");
    }
    // Mechanics
    if (/mechanics|force|motion|friction|gravity|work|energy|power|pulley|lever|momentum/.test(textBlob)) {
      addScore("011.3", 85, "Matched Mechanics & Force");
      addScore("011", 50, "Parent Physics Class");
    }
    // Sound / Waves
    if (/sound|echo|resonance|frequency|acoustic|vibration|wavelength/.test(textBlob)) {
      addScore("011.1", 85, "Matched Acoustics & Sound Waves");
      addScore("011", 50, "Parent Physics Class");
    }
    // Optics
    if (/light|reflection|refraction|lens|prism|telescope|microscope|mirror|shadow/.test(textBlob)) {
      addScore("011.4", 85, "Matched Optics & Light");
      addScore("011", 50, "Parent Physics Class");
    }
    // Chemistry: Organic
    if (/organic|hydrocarbon|alkane|alkene|alkyne|petroleum|crude oil|methane|polymer/.test(textBlob)) {
      addScore("012.1", 85, "Matched Organic Chemistry & Hydrocarbons");
      addScore("012", 50, "Parent Chemistry Class");
    }
    // Chemistry: Analytical / Practical
    if (/titration|volumetric|qualitative|acid-base titration|reagent|salt analysis/.test(textBlob)) {
      addScore("012.4", 85, "Matched Analytical & Practical Chemistry");
      addScore("012", 50, "Parent Chemistry Class");
    }
    // Biology: Flowering Plants
    if (/flower|angiosperm|monocot|dicot|pollination|root|stem|petal|photosynthesis/.test(textBlob)) {
      addScore("013.1i", 90, "Matched Angiosperms & Flowering Botany");
      addScore("013.1", 60, "Plant Kingdom");
      addScore("013", 40, "General Biology");
    }
    // Biology: Vertebrates
    if (/vertebrate|mammal|bird|reptile|amphibian|fish|skeleton|circulatory system/.test(textBlob)) {
      addScore("013.2i", 90, "Matched Vertebrates & Zoology");
      addScore("013.2", 60, "Animal Kingdom");
      addScore("013", 40, "General Biology");
    }
    // Agriculture: Fishery
    if (/fishery|fish|aquaculture|catfish|tilapia|fingerling|pond|smoking kiln/.test(textBlob)) {
      addScore("014.2ii", 95, "Matched Aquaculture & Fishery Trade Syllabus");
      addScore("014.2", 60, "Animal Science");
      addScore("014", 40, "Agricultural Science");
    }
    // Agriculture: Crop farming
    if (/crop|cassava|yam|maize|cocoa|tuber|cereal|grain|harvest|fertilizer/.test(textBlob)) {
      addScore("014.1i", 90, "Matched Crop Farming & Agronomy");
      addScore("014.1", 60, "Plant Science");
      addScore("014", 40, "Agricultural Science");
    }
    // Economics: Macro
    if (/national income|macro|inflation|gdp|unemployment|cbn|fiscal policy|monetary/.test(textBlob)) {
      addScore("020.1", 90, "Matched Macro Economics");
      addScore("020", 50, "Economics");
    }
    // Civics
    if (/civic|rights|rule of law|constitution|democracy|citizenship|integrity|values/.test(textBlob)) {
      addScore("022.2", 90, "Matched Civic Education & Rights");
      addScore("022", 60, "Government & Civics");
    }
    // Law -> Subsumed under Government (PRD Sec 20)
    if (/\blaw\b|judicial|court|legal|statute|magistrate|constitution/.test(textBlob)) {
      addScore("022.1", 88, "Cross-Reference: Law SEE Government (022.1)");
      addScore("022", 60, "Government & Civics");
    }
    // Literature: Folklore / Oral
    if (/folktale|folklore|tortoise|ijapa|tales|fables|oral tradition|myth|legend/.test(textBlob)) {
      addScore("030.2iaF", 95, "Matched Indigenous Folklore & Oral Tradition");
      addScore("030.2ia", 70, "Fiction Subclass");
      addScore("030.2", 50, "Literature");
    }
    // Literature: Prose / Novels
    if (/novel|prose|short story|fiction|narrative|things fall apart|achebe/.test(textBlob)) {
      addScore("030.2i", 90, "Matched Prose Fiction");
      addScore("030.2", 50, "Literature");
    }
    // Literature: Drama / Plays
    if (/drama|play|theatre|stage|act|scene|dialogue|soyinka|lion and the jewel/.test(textBlob)) {
      addScore("030.2ii", 90, "Matched Dramatic Literature");
      addScore("031.1", 70, "Theatre Arts Production");
    }
    // Religion: Monotheism / CRS / IRS
    if (/bible|quran|jesus|prophet muhammad|crs|irs|christian|islam|prayer|hadith/.test(textBlob)) {
      addScore("034.1i", 95, "Matched Monotheism (Christianity & Islam Core)");
      addScore("034.1", 60, "Theistic Religion");
      addScore("034", 40, "Religion");
    }

    // Token analysis across all nodes
    const allNodes = this.getAllNodes();
    allNodes.forEach(node => {
      if (node.status === "UNASSIGNED") return;

      combinedTokens.forEach(token => {
        // Match code
        if (node.code.toLowerCase() === token) {
          addScore(node.code, 60, `Direct Code Match [${node.code}]`);
        }
        // Match Name
        if ((node.name || "").toLowerCase().includes(token)) {
          addScore(node.code, 20, `Term in Title: ${token}`);
        }
        // Match Subject Headings
        if (node.subjectHeadings) {
          node.subjectHeadings.forEach(sh => {
            if (sh.toLowerCase().includes(token)) {
              addScore(node.code, 25, `Subject Heading: ${sh}`);
            }
          });
        }
        // Match Synonyms
        if (node.synonyms) {
          node.synonyms.forEach(syn => {
            if (syn.toLowerCase().includes(token)) {
              addScore(node.code, 22, `Synonym: ${syn}`);
            }
          });
        }
      });
    });

    const suggestions = Array.from(scoredNodes.values())
      .filter(item => item.score > 20)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(item => {
        // Calculate confidence percentage
        let confidence = Math.min(98, Math.max(55, Math.round(item.score * 0.95)));
        let confidenceLabel = confidence >= 85 ? "High" : confidence >= 70 ? "Medium" : "Moderate";
        const breadcrumbs = this.getBreadcrumbs(item.node.code);

        return {
          code: item.node.code,
          name: item.node.name,
          displayName: item.node.displayName || item.node.name,
          score: item.score,
          confidence,
          confidenceLabel,
          reasons: item.matchedReasons.slice(0, 3),
          breadcrumbs,
          parent: this.getNode(item.node.parentId),
          scopeNote: item.node.scopeNote,
          crossReferences: item.node.crossReferences,
          source: item.node.source
        };
      });

    return suggestions;
  }

  /**
   * Validate a classification code according to PRD Section 60
   */
  validateCode(code) {
    if (!code || typeof code !== "string" || !code.trim()) {
      return { valid: false, error: "Classification code cannot be empty and must be a string." };
    }

    const cleanCode = code.trim();
    const node = this.getNode(cleanCode);

    if (!node) {
      return {
        valid: false,
        code: cleanCode,
        error: `Classification code "${cleanCode}" does not exist in the active 2026 master or local scheme.`,
        canCreateLocal: true
      };
    }

    if (node.status === "UNASSIGNED") {
      return {
        valid: false,
        code: cleanCode,
        error: `Classification "${cleanCode}" is explicitly UNASSIGNED in the 2026 NERDC scheme and reserved for future curricula.`,
        isUnassigned: true
      };
    }

    return {
      valid: true,
      code: cleanCode,
      node,
      isLocal: node.source === "LOCAL"
    };
  }

  /**
   * Add a local extension safely without corrupting the master scheme (PRD Sec 47, 48)
   */
  addLocalExtension(extensionData) {
    const { code, name, parentId, description, authorizedBy, schoolId = "sch-kings-lagos" } = extensionData;

    if (!code || !name || !parentId) {
      throw new Error("Code, Name, and Parent ID are required for local extensions.");
    }

    const cleanCode = String(code).trim();

    // Check if code conflicts with existing master code
    if (this.masterNodes.has(cleanCode)) {
      throw new Error(`Cannot override official Master Scheme code "${cleanCode}". Choose a local subdivision (e.g. ${cleanCode}A).`);
    }

    const parentNode = this.getNode(parentId);
    if (!parentNode) {
      throw new Error(`Parent classification "${parentId}" does not exist.`);
    }

    const newLocalNode = {
      id: `local-${Date.now()}`,
      schoolId,
      code: cleanCode,
      name,
      displayName: `${name} [Local Extension]`,
      parentId,
      level: (parentNode.level || 3) + 1,
      nodeType: "LOCAL_EXTENSION",
      description: description || "School-level curriculum adaptation.",
      scopeNote: `Local adaptation under NERDC Local Adaptation Clause 3.2. Authorized by: ${authorizedBy || "Chief Librarian"}`,
      subjectHeadings: [name],
      synonyms: [],
      crossReferences: { BT: parentId, NT: [], SEE: [], SEE_ALSO: [] },
      indexTerms: [name],
      status: "ACTIVE",
      source: "LOCAL",
      isSystemDefined: false,
      isCustom: true,
      authorizedBy: authorizedBy || "School Librarian",
      approvalDate: new Date().toISOString().split("T")[0],
      version: "1.1"
    };

    this.localNodes.set(cleanCode, newLocalNode);
    this.rebuildTree();
    return newLocalNode;
  }
}

window.classificationEngine = new ClassificationEngine();
