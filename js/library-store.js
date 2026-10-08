/**
 * Library Data Store & Persistence Layer
 * Handles Catalogue Resources, Patrons, Circulation, Shelf Locations,
 * Inventory Audit, Audit Trail, and Analytics Reports.
 * Supports offline-first LocalStorage synchronization.
 */

class LibraryStore {
  constructor() {
    this.STORAGE_KEY = "naijalib_system_state_v1";
    this.resources = [];
    this.patrons = [];
    this.loans = [];
    this.locations = [];
    this.auditLogs = [];
    this.inventoryScans = [];
    this.currentMode = "librarian"; // 'student', 'librarian', 'classificationist'
    this.init();
  }

  init() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        this.resources = data.resources || [];
        this.patrons = data.patrons || [];
        this.loans = data.loans || [];
        this.locations = data.locations || [];
        this.auditLogs = data.auditLogs || [];
        this.inventoryScans = data.inventoryScans || [];
      } catch (e) {
        console.warn("Could not parse saved storage, loading defaults", e);
        this.loadDefaults();
      }
    } else {
      this.loadDefaults();
    }
  }

  loadDefaults() {
    this.resources = [...(window.INITIAL_RESOURCES || [])];
    this.patrons = [...(window.INITIAL_PATRONS || [])];
    this.loans = [...(window.INITIAL_LOANS || [])];
    this.locations = [...(window.INITIAL_SHELF_LOCATIONS || [])];
    this.auditLogs = [...(window.INITIAL_AUDIT_LOGS || [])];
    this.inventoryScans = [];
    this.save();
  }

  save() {
    try {
      const payload = {
        resources: this.resources,
        patrons: this.patrons,
        loans: this.loans,
        locations: this.locations,
        auditLogs: this.auditLogs,
        inventoryScans: this.inventoryScans
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.error("Error saving state to localStorage:", e);
    }
  }

  logAction(user, action, object, oldValue, newValue) {
    const log = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      user: user || "Active Librarian",
      action,
      object,
      oldValue: String(oldValue),
      newValue: String(newValue),
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      ip: "192.168.1.15"
    };
    this.auditLogs.unshift(log);
    if (this.auditLogs.length > 200) this.auditLogs.pop();
    this.save();
    return log;
  }

  // ==========================================
  // CATALOGUE / RESOURCE OPERATIONS
  // ==========================================

  getResources(filter = {}) {
    let result = [...this.resources];
    if (filter.search) {
      const q = filter.search.toLowerCase().trim();
      result = result.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.author.toLowerCase().includes(q) ||
        (r.classificationNumber && r.classificationNumber.toLowerCase().includes(q)) ||
        (r.callNumber && r.callNumber.toLowerCase().includes(q)) ||
        (r.accessionNumber && r.accessionNumber.toLowerCase().includes(q)) ||
        (r.subject && r.subject.toLowerCase().includes(q)) ||
        (r.isbn && r.isbn.toLowerCase().includes(q))
      );
    }

    if (filter.classificationPrefix) {
      result = result.filter(r => r.classificationNumber && r.classificationNumber.startsWith(filter.classificationPrefix));
    }

    if (filter.status) {
      result = result.filter(r => r.status === filter.status);
    }

    if (filter.resourceType) {
      result = result.filter(r => r.resourceType === filter.resourceType);
    }

    if (filter.isDigital !== undefined) {
      result = result.filter(r => r.isDigital === filter.isDigital);
    }

    return result;
  }

  getResourceById(id) {
    return this.resources.find(r => r.id === id);
  }

  addResource(resourceData) {
    // Validate classification code
    const validation = window.classificationEngine.validateCode(resourceData.classificationNumber);
    if (!validation.valid && !resourceData.allowOverride) {
      throw new Error(validation.error);
    }

    // Auto-generate accession number if missing
    const accessionNumber = resourceData.accessionNumber || `2026-${String(this.resources.length + 891).padStart(4, "0")}`;

    // Auto-generate Cutter and Call Number if missing
    let authorNumber = resourceData.authorNumber;
    if (!authorNumber) {
      authorNumber = window.cutterEngine.generateCutterNumber(resourceData.author);
    }

    let callNumber = resourceData.callNumber;
    if (!callNumber) {
      callNumber = window.cutterEngine.buildCallNumber(resourceData.classificationNumber, authorNumber, resourceData.copyVol || "C.1");
    }

    const newResource = {
      id: `res-${Date.now()}`,
      accessionNumber,
      title: resourceData.title.trim(),
      subtitle: resourceData.subtitle ? resourceData.subtitle.trim() : "",
      author: resourceData.author.trim(),
      otherContributors: resourceData.otherContributors || "",
      edition: resourceData.edition || "1st Edition",
      publisher: resourceData.publisher || "NERDC Press",
      placeOfPublication: resourceData.placeOfPublication || "Lagos, Nigeria",
      year: parseInt(resourceData.year, 10) || 2026,
      isbn: resourceData.isbn || "N/A",
      language: resourceData.language || "English",
      pages: parseInt(resourceData.pages, 10) || 250,
      physicalDescription: resourceData.physicalDescription || "Paperback, 22cm",
      series: resourceData.series || "Secondary Library Collection",
      subject: resourceData.subject || "General",
      classificationNumber: resourceData.classificationNumber.trim(),
      authorNumber,
      callNumber,
      resourceType: resourceData.resourceType || "Textbook",
      format: resourceData.format || "Print Paperback",
      isDigital: Boolean(resourceData.isDigital),
      duration: resourceData.duration || null,
      fileType: resourceData.fileType || null,
      url: resourceData.url || null,
      shelfLocation: resourceData.shelfLocation || "Science & Technology / Shelf 01",
      locationId: resourceData.locationId || "loc-1",
      acquisitionDate: resourceData.acquisitionDate || new Date().toISOString().split("T")[0],
      acquisitionSource: resourceData.acquisitionSource || "School Procurement",
      cost: resourceData.cost || "₦5,000",
      status: resourceData.status || "AVAILABLE",
      notes: resourceData.notes || "",
      coverImage: resourceData.coverImage || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=400&q=80",
      tags: resourceData.tags || []
    };

    this.resources.unshift(newResource);
    this.logAction("Librarian Desk", "ACCESSION_RESOURCE", `Resource #${newResource.accessionNumber} (${newResource.title})`, "NONE", newResource.classificationNumber);
    this.save();
    return newResource;
  }

  updateResource(id, updateData) {
    const index = this.resources.findIndex(r => r.id === id);
    if (index === -1) throw new Error("Resource not found");

    const old = this.resources[index];
    this.resources[index] = { ...old, ...updateData };
    this.logAction("Librarian Desk", "UPDATE_RESOURCE", `Resource #${old.accessionNumber}`, old.classificationNumber, updateData.classificationNumber || old.classificationNumber);
    this.save();
    return this.resources[index];
  }

  deleteResource(id) {
    const index = this.resources.findIndex(r => r.id === id);
    if (index === -1) throw new Error("Resource not found");
    const item = this.resources[index];
    this.resources.splice(index, 1);
    this.logAction("Librarian Desk", "DELETE_RESOURCE", `Resource #${item.accessionNumber} (${item.title})`, "ACTIVE", "DELETED");
    this.save();
    return true;
  }

  // ==========================================
  // CIRCULATION DESK OPERATIONS
  // ==========================================

  issueItem(resourceId, patronId, loanDays = 14) {
    const resource = this.getResourceById(resourceId);
    if (!resource) throw new Error("Resource not found");
    if (resource.status === "CHECKED_OUT") throw new Error("Resource is already checked out.");

    const patron = this.patrons.find(p => p.id === patronId);
    if (!patron) throw new Error("Patron not found");

    // Check borrowing limit
    const activePatronLoans = this.loans.filter(l => l.patronId === patronId && l.status !== "RETURNED");
    if (activePatronLoans.length >= patron.borrowingLimit) {
      throw new Error(`Borrowing limit of ${patron.borrowingLimit} reached for ${patron.name}.`);
    }

    const now = new Date();
    const issueDate = now.toISOString().split("T")[0];
    const dueDateObj = new Date(now.getTime() + loanDays * 24 * 60 * 60 * 1000);
    const dueDate = dueDateObj.toISOString().split("T")[0];

    const newLoan = {
      id: `loan-${Date.now()}`,
      resourceId,
      accessionNumber: resource.accessionNumber,
      resourceTitle: resource.title,
      patronId,
      patronName: patron.name,
      patronType: `${patron.patronType} (${patron.classDepartment})`,
      issueDate,
      dueDate,
      returnDate: null,
      status: "ACTIVE",
      daysOverdue: 0,
      fineAccrued: "₦0",
      renewalCount: 0
    };

    this.loans.unshift(newLoan);
    resource.status = "CHECKED_OUT";
    patron.activeLoansCount = (patron.activeLoansCount || 0) + 1;

    this.logAction("Circulation Desk", "ISSUE_BOOK", `Resource #${resource.accessionNumber} to ${patron.name}`, "AVAILABLE", `ISSUED (Due: ${dueDate})`);
    this.save();
    return newLoan;
  }

  returnItem(loanId) {
    const loan = this.loans.find(l => l.id === loanId);
    if (!loan) throw new Error("Loan record not found");

    loan.returnDate = new Date().toISOString().split("T")[0];
    loan.status = "RETURNED";

    const resource = this.getResourceById(loan.resourceId);
    if (resource) {
      resource.status = "AVAILABLE";
    }

    const patron = this.patrons.find(p => p.id === loan.patronId);
    if (patron && patron.activeLoansCount > 0) {
      patron.activeLoansCount -= 1;
    }

    this.logAction("Circulation Desk", "RETURN_BOOK", `Resource #${loan.accessionNumber} from ${loan.patronName}`, "CHECKED_OUT", "AVAILABLE");
    this.save();
    return loan;
  }

  renewItem(loanId, extensionDays = 14) {
    const loan = this.loans.find(l => l.id === loanId);
    if (!loan) throw new Error("Loan record not found");
    if (loan.status === "RETURNED") throw new Error("Cannot renew a returned loan.");
    if (loan.renewalCount >= 2) throw new Error("Maximum of 2 renewals reached.");

    const currentDue = new Date(loan.dueDate);
    const newDue = new Date(currentDue.getTime() + extensionDays * 24 * 60 * 60 * 1000);
    const oldDate = loan.dueDate;
    loan.dueDate = newDue.toISOString().split("T")[0];
    loan.renewalCount += 1;
    loan.status = "ACTIVE";
    loan.daysOverdue = 0;
    loan.fineAccrued = "₦0";

    this.logAction("Circulation Desk", "RENEW_BOOK", `Loan #${loan.id} (${loan.resourceTitle})`, oldDate, loan.dueDate);
    this.save();
    return loan;
  }

  markLostOrDamaged(resourceId, condition = "LOST") {
    const resource = this.getResourceById(resourceId);
    if (!resource) throw new Error("Resource not found");

    const oldStatus = resource.status;
    resource.status = condition; // 'LOST' or 'DAMAGED'
    this.logAction("Circulation Desk", "MARK_STATUS", `Resource #${resource.accessionNumber}`, oldStatus, condition);
    this.save();
    return resource;
  }

  // ==========================================
  // PATRON OPERATIONS
  // ==========================================

  addPatron(patronData) {
    const newPatron = {
      id: `pat-${Date.now()}`,
      patronId: patronData.patronId || `KC-${Date.now().toString().slice(-4)}`,
      name: patronData.name.trim(),
      patronType: patronData.patronType || "Student",
      classDepartment: patronData.classDepartment || "SS1",
      gender: patronData.gender || "Not Specified",
      phone: patronData.phone || "+234 800 000 0000",
      email: patronData.email || "",
      dateRegistered: new Date().toISOString().split("T")[0],
      status: "ACTIVE",
      borrowingLimit: parseInt(patronData.borrowingLimit, 10) || 4,
      activeLoansCount: 0,
      avatar: patronData.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
    };

    this.patrons.push(newPatron);
    this.logAction("Patron Management", "REGISTER_PATRON", `Patron ${newPatron.name} (${newPatron.patronId})`, "NONE", "ACTIVE");
    this.save();
    return newPatron;
  }

  // ==========================================
  // INVENTORY SCAN AUDIT MODE (PRD Sec 98 & 99)
  // ==========================================

  recordInventoryScan(callNumber, locationId, status = "FOUND") {
    const resource = this.resources.find(r => r.callNumber === callNumber || r.accessionNumber === callNumber);
    const scanRecord = {
      id: `scan-${Date.now()}`,
      callNumber,
      accessionNumber: resource ? resource.accessionNumber : "UNKNOWN",
      title: resource ? resource.title : "Uncatalogued / Unknown Item",
      expectedShelf: resource ? resource.shelfLocation : "Not Assigned",
      scannedAt: new Date().toISOString().replace("T", " ").substring(0, 19),
      locationId,
      status // 'FOUND', 'MISSING', 'MISPLACED', 'DAMAGED', 'UNCLASSIFIED'
    };

    this.inventoryScans.unshift(scanRecord);
    this.save();
    return scanRecord;
  }

  // ==========================================
  // ANALYTICS & COLLECTION METRICS (PRD Sec 56, 57)
  // ==========================================

  getMetrics() {
    const totalResources = this.resources.length;
    const booksCount = this.resources.filter(r => r.resourceType === "Book" || r.resourceType === "Textbook").length;
    const mediaCount = this.resources.filter(r => ["Audio", "Video", "Photograph", "Map", "Other Media"].includes(r.resourceType)).length;
    const digitalCount = this.resources.filter(r => r.isDigital || r.resourceType === "Educational Software" || r.resourceType === "Digital Resource").length;
    const referenceCount = this.resources.filter(r => ["Reference Book", "Dictionary", "Encyclopedia", "Atlas"].includes(r.resourceType)).length;

    const classifiedCount = this.resources.filter(r => r.classificationNumber && r.classificationNumber !== "UNCLASSIFIED").length;
    const unclassifiedCount = totalResources - classifiedCount;

    const activeLoans = this.loans.filter(l => l.status === "ACTIVE").length;
    const overdueLoans = this.loans.filter(l => l.status === "OVERDUE").length;

    // Array Breakdown (0, 01, 02, 03)
    const arrayBreakdown = {
      "0": this.resources.filter(r => r.classificationNumber && r.classificationNumber.startsWith("00")).length,
      "01": this.resources.filter(r => r.classificationNumber && r.classificationNumber.startsWith("01")).length,
      "02": this.resources.filter(r => r.classificationNumber && r.classificationNumber.startsWith("02")).length,
      "03": this.resources.filter(r => r.classificationNumber && r.classificationNumber.startsWith("03")).length
    };

    return {
      totalResources,
      booksCount,
      mediaCount,
      digitalCount,
      referenceCount,
      classifiedCount,
      unclassifiedCount,
      coveragePercent: totalResources > 0 ? ((classifiedCount / totalResources) * 100).toFixed(1) : "100.0",
      activeLoans,
      overdueLoans,
      arrayBreakdown
    };
  }
}

window.libraryStore = new LibraryStore();
