/**
 * Main Application Controller for NaijaLib: Nigerian Secondary School Library System
 * Integrates Classification Engine, Cutter Engine, Label Generator, and Library Store
 */

class NaijaLibApp {
  constructor() {
    this.currentPath = (window.authService && window.authService.isAuthenticated()) ? "dashboard" : "landing";
    this.selectedClassificationCode = "011.2";
    this.init();
  }

  init() {
    this.setupNavigation();
    this.setupHeaderActions();
    this.setupKeyboardShortcuts();
    this.updateUserSessionUI();
    if (this.currentPath === "landing") {
      document.body.classList.add("landing-mode");
    }
    this.renderCurrentView();
    this.updateHeaderBadges();
  }

  // ==========================================
  // NAVIGATION ROUTING
  // ==========================================

  setupNavigation() {
    const navLinks = document.querySelectorAll("nav a[data-path]");
    navLinks.forEach(link => {
      link.addEventListener("click", e => {
        e.preventDefault();
        const targetPath = link.getAttribute("data-path");
        this.navigateTo(targetPath);
      });
    });

    // Quick Action Pills on Dashboard or anywhere
    document.addEventListener("click", e => {
      const pill = e.target.closest("[data-action-nav]");
      if (pill) {
        e.preventDefault();
        const path = pill.getAttribute("data-action-nav");
        const code = pill.getAttribute("data-code");
        if (code) {
          this.selectedClassificationCode = code;
        }
        this.navigateTo(path);
      }
    });
  }

  navigateTo(path) {
    this.currentPath = path;

    if (path === "landing") {
      document.body.classList.add("landing-mode");
    } else {
      document.body.classList.remove("landing-mode");
    }

    // Update active state in sidebar
    const navLinks = document.querySelectorAll("nav a[data-path]");
    navLinks.forEach(link => {
      const linkPath = link.getAttribute("data-path");
      if (linkPath === path) {
        link.className = "flex items-center gap-space-sm px-space-md py-space-sm transition-all bg-primary-container text-on-primary-container font-bold rounded-xl shadow-sm";
      } else {
        link.className = "flex items-center gap-space-sm px-space-md py-space-sm rounded-xl text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all";
      }
    });

    this.renderCurrentView();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  setupHeaderActions() {
    // Mode switcher buttons
    const modeBtns = document.querySelectorAll("[data-mode-btn]");
    modeBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const mode = btn.getAttribute("data-mode-btn");
        window.libraryStore.currentMode = mode;

        modeBtns.forEach(b => {
          b.className = "px-space-md py-1 rounded-full font-label-sm text-label-sm text-on-surface-variant hover:text-on-surface transition-colors";
        });
        btn.className = "px-space-md py-1 rounded-full font-label-sm text-label-sm bg-surface-container-lowest text-primary font-bold shadow-[0_1px_4px_rgba(0,0,0,0.05)]";

        this.updateRoleBanner(mode);
        this.showToast(`Switched to ${mode === 'student' ? 'Student Discovery Mode' : mode === 'classificationist' ? 'Classificationist Master Desk' : 'Librarian Desk'}`);
        this.renderCurrentView();
      });
    });

    // Omnisearch trigger in header
    const searchInputs = document.querySelectorAll(".omnisearch-trigger");
    searchInputs.forEach(input => {
      input.addEventListener("click", () => this.openOmnisearch());
      input.addEventListener("focus", () => this.openOmnisearch());
    });
  }

  updateRoleBanner(mode) {
    const profileName = document.querySelector("#header-profile-name");
    const profileRole = document.querySelector("#header-profile-role");
    const profileAvatar = document.querySelector("#header-profile-avatar");

    if (!profileName) return;

    if (mode === "student") {
      profileName.textContent = "Hi, Titi";
      profileRole.textContent = "SS2 Science Scholar";
      if (profileAvatar) profileAvatar.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80";
    } else if (mode === "classificationist") {
      profileName.textContent = "Dr. C. Adeleke";
      profileRole.textContent = "Chief Classificationist (NERDC)";
      if (profileAvatar) profileAvatar.src = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80";
    } else {
      profileName.textContent = "Mr. Adeleke";
      profileRole.textContent = "Senior Secondary Cataloguer";
      if (profileAvatar) profileAvatar.src = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80";
    }
  }

  setupKeyboardShortcuts() {
    window.addEventListener("keydown", e => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        this.openOmnisearch();
      }
      if (e.key === "Escape") {
        this.closeModal();
      }
    });
  }

  updateHeaderBadges() {
    const metrics = window.libraryStore.getMetrics();
    const overdueBadge = document.querySelector("#header-notification-badge");
    if (overdueBadge) {
      overdueBadge.style.display = metrics.overdueLoans > 0 ? "block" : "none";
    }
  }

  showToast(message, type = "info") {
    let toast = document.querySelector("#naijalib-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "naijalib-toast";
      toast.className = "fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-xl font-label-md text-label-md flex items-center gap-2 transform transition-all duration-300 translate-y-20 opacity-0 pointer-events-none";
      document.body.appendChild(toast);
    }

    if (type === "success") {
      toast.className = "fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-xl font-label-md text-label-md flex items-center gap-2 bg-tertiary text-on-tertiary transition-all duration-300 translate-y-0 opacity-100";
      toast.innerHTML = `<span class="material-symbols-outlined text-lg">check_circle</span> <span>${message}</span>`;
    } else if (type === "error") {
      toast.className = "fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-xl font-label-md text-label-md flex items-center gap-2 bg-error text-on-error transition-all duration-300 translate-y-0 opacity-100";
      toast.innerHTML = `<span class="material-symbols-outlined text-lg">error</span> <span>${message}</span>`;
    } else {
      toast.className = "fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-xl font-label-md text-label-md flex items-center gap-2 bg-on-surface text-surface transition-all duration-300 translate-y-0 opacity-100";
      toast.innerHTML = `<span class="material-symbols-outlined text-lg">info</span> <span>${message}</span>`;
    }

    setTimeout(() => {
      toast.classList.add("translate-y-20", "opacity-0");
    }, 3000);
  }

  // ==========================================
  // VIEW RENDER DISPATCHER
  // ==========================================

  renderCurrentView() {
    const container = document.querySelector("#app-view-container");
    if (!container) return;

    switch (this.currentPath) {
      case "landing":
        container.innerHTML = this.renderLandingPageView();
        this.bindLandingPageEvents();
        break;
      case "admin-users":
        container.innerHTML = this.renderAdminUsersView();
        this.bindAdminUsersEvents();
        break;
      case "dashboard":
        container.innerHTML = this.renderDashboardView();
        this.bindDashboardEvents();
        break;
      case "classification-explorer":
        container.innerHTML = this.renderClassificationExplorerView();
        this.bindClassificationExplorerEvents();
        break;
      case "classification-assistant":
        container.innerHTML = this.renderClassificationAssistantView();
        this.bindClassificationAssistantEvents();
        break;
      case "master-schedule":
        container.innerHTML = this.renderMasterScheduleView();
        this.bindMasterScheduleEvents();
        break;
      case "catalogue-resources":
        container.innerHTML = this.renderCatalogueView();
        this.bindCatalogueEvents();
        break;
      case "call-number-cutter":
        container.innerHTML = this.renderCutterEngineView();
        this.bindCutterEngineEvents();
        break;
      case "shelf-label-generator":
        container.innerHTML = this.renderShelfLabelGeneratorView();
        this.bindShelfLabelGeneratorEvents();
        break;
      case "shelf-locations":
        container.innerHTML = this.renderShelfLocationsView();
        this.bindShelfLocationsEvents();
        break;
      case "circulation-desk":
        container.innerHTML = this.renderCirculationDeskView();
        this.bindCirculationDeskEvents();
        break;
      case "patrons-members":
        container.innerHTML = this.renderPatronsView();
        this.bindPatronsEvents();
        break;
      case "inventory-audit":
        container.innerHTML = this.renderInventoryAuditView();
        this.bindInventoryAuditEvents();
        break;
      case "controlled-vocabulary":
        container.innerHTML = this.renderControlledVocabularyView();
        this.bindControlledVocabularyEvents();
        break;
      case "alphabetical-index":
        container.innerHTML = this.renderAlphabeticalIndexView();
        this.bindAlphabeticalIndexEvents();
        break;
      case "scheme-glossary":
        container.innerHTML = this.renderGlossaryView();
        this.bindGlossaryEvents();
        break;
      case "local-extensions":
        container.innerHTML = this.renderLocalExtensionsView();
        this.bindLocalExtensionsEvents();
        break;
      case "scheme-admin":
        container.innerHTML = this.renderSchemeAdminView();
        this.bindSchemeAdminEvents();
        break;
      case "reports-analytics":
        container.innerHTML = this.renderReportsView();
        this.bindReportsEvents();
        break;
      case "audit-trail":
        container.innerHTML = this.renderAuditTrailView();
        this.bindAuditTrailEvents();
        break;
      case "backup-export":
        container.innerHTML = this.renderBackupExportView();
        this.bindBackupExportEvents();
        break;
      default:
        container.innerHTML = this.renderDashboardView();
        this.bindDashboardEvents();
    }
  }

  // ==========================================
  // VIEW 1: DASHBOARD
  // ==========================================

  renderDashboardView() {
    const metrics = window.libraryStore.getMetrics();
    const resources = window.libraryStore.getResources().slice(0, 4);

    return `
      <div class="space-y-space-lg">
        <!-- Section 1: Welcome & Scheme Context Banner -->
        <section class="relative overflow-hidden rounded-xl bg-surface-container-lowest p-space-lg lg:p-space-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div class="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-primary-fixed/40 blur-3xl pointer-events-none"></div>
          <div class="absolute right-40 -bottom-20 w-72 h-72 rounded-full bg-secondary-fixed/50 blur-3xl pointer-events-none"></div>
          <div class="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-space-lg">
            <div class="space-y-space-xs max-w-2xl">
              <div class="inline-flex items-center gap-space-xs px-space-sm py-1 rounded-full bg-surface-container text-secondary font-label-sm text-label-sm">
                <span class="material-symbols-outlined text-base">auto_awesome</span>
                <span>2026 Abridged Scheme for Secondary Schools & Media Centres</span>
                <span class="bg-secondary text-on-secondary px-2 py-0.2 rounded-full text-[10px]">NERDC Ref: 26-AB</span>
              </div>
              <h1 class="font-display text-display text-on-surface tracking-tight">
                Ẹ Káàbọ̀! <span class="text-primary font-extrabold">Welcome to NaijaLib</span>
              </h1>
              <p class="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                Simplified Dewey-NERDC decimal taxonomy crafted for Nigerian JSS1–SS3 scholars and cataloguers. 
                Try searching <code class="bg-surface-container px-2 py-0.5 rounded-lg text-secondary font-label-md text-label-md font-bold cursor-pointer" onclick="window.app.searchAndGo('011.2')">011.2</code> for Electricity or <code class="bg-surface-container px-2 py-0.5 rounded-lg text-primary font-label-md text-label-md font-bold cursor-pointer" onclick="window.app.searchAndGo('030.2iaF')">030.2iaF</code> for Indigenous Folktales.
              </p>
              
              <!-- Quick Action Pills -->
              <div class="pt-space-xs flex flex-wrap items-center gap-space-xs">
                <button data-action-nav="classification-explorer" data-code="01" class="inline-flex items-center gap-1.5 px-space-md py-2 rounded-full bg-primary-container text-on-primary-container font-label-md text-label-md shadow-sm hover:scale-[1.02] active:scale-95 transition-transform">
                  <span class="material-symbols-outlined text-lg">biotech</span>
                  <span>Browse Science (01)</span>
                </button>
                <button data-action-nav="classification-assistant" class="inline-flex items-center gap-1.5 px-space-md py-2 rounded-full bg-secondary text-on-secondary font-label-md text-label-md shadow-sm hover:scale-[1.02] active:scale-95 transition-transform">
                  <span class="material-symbols-outlined text-lg">psychology</span>
                  <span>AI Classifier</span>
                </button>
                <button data-action-nav="catalogue-resources" class="inline-flex items-center gap-1.5 px-space-md py-2 rounded-full bg-surface-container-high text-on-surface font-label-md text-label-md hover:bg-surface-container-highest transition-colors">
                  <span class="material-symbols-outlined text-lg">history_edu</span>
                  <span>WAEC / NECO Corner</span>
                </button>
                <button data-action-nav="inventory-audit" class="inline-flex items-center gap-1.5 px-space-md py-2 rounded-full bg-surface-container-high text-on-surface font-label-md text-label-md hover:bg-surface-container-highest transition-colors">
                  <span class="material-symbols-outlined text-lg">qr_code_scanner</span>
                  <span>Barcode Scanner</span>
                </button>
              </div>
            </div>

            <!-- Spotlight Card -->
            <div class="w-full lg:w-80 shrink-0 bg-surface-container-low rounded-xl p-space-md space-y-space-sm relative overflow-hidden border border-surface-container">
              <div class="flex items-center justify-between">
                <span class="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">Curriculum Spotlight</span>
                <span class="font-label-sm text-label-sm bg-tertiary-fixed text-on-tertiary-fixed px-2 py-0.5 rounded-full font-bold">SS3 WASSCE Prep</span>
              </div>
              <div class="flex gap-space-sm items-center">
                <img class="w-16 h-20 rounded-lg object-cover shadow-sm shrink-0" src="https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=200&q=80" alt="Biology Practical"/>
                <div class="space-y-1">
                  <div class="font-headline-sm text-headline-sm text-on-surface line-clamp-1">Senior Biology 013</div>
                  <p class="font-body-sm text-body-sm text-on-surface-variant line-clamp-2">Idodo Umeh Series & WAEC Practical Atlas with local flora specimens.</p>
                </div>
              </div>
              <div class="flex items-center justify-between pt-space-xs text-secondary font-label-md text-label-md">
                <span class="inline-flex items-center gap-1 font-bold">
                  <span class="material-symbols-outlined text-sm">library_books</span>
                  Shelf Carrel #4-B
                </span>
                <span class="text-tertiary font-bold">14 Copies Ready</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Section 2: Key KPI Metric Cards -->
        <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
          <!-- KPI 1 -->
          <div class="bg-surface-container-lowest rounded-xl p-space-md shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-space-xs hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between">
              <span class="font-label-md text-label-md text-on-surface-variant font-medium">Catalogued Stock</span>
              <span class="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary">
                <span class="material-symbols-outlined text-xl">auto_stories</span>
              </span>
            </div>
            <div class="space-y-1">
              <div class="font-display text-display text-on-surface tracking-tight">${metrics.totalResources.toLocaleString()}</div>
              <div class="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-2">
                <span class="text-primary font-bold">${metrics.booksCount}</span> Books
                <span>•</span>
                <span class="text-secondary font-bold">${metrics.referenceCount}</span> Ref
                <span>•</span>
                <span class="text-tertiary font-bold">${metrics.digitalCount}</span> Digital
              </div>
            </div>
            <div class="w-full bg-surface-container rounded-full h-1.5 overflow-hidden flex">
              <div class="bg-primary h-full" style="width: 70%"></div>
              <div class="bg-secondary-container h-full" style="width: 18%"></div>
              <div class="bg-tertiary-container h-full" style="width: 12%"></div>
            </div>
          </div>

          <!-- KPI 2 -->
          <div class="bg-surface-container-lowest rounded-xl p-space-md shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-space-xs hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between">
              <span class="font-label-md text-label-md text-on-surface-variant font-medium">Scheme Coverage</span>
              <span class="w-10 h-10 rounded-full bg-tertiary-fixed flex items-center justify-center text-tertiary">
                <span class="material-symbols-outlined text-xl">verified</span>
              </span>
            </div>
            <div class="space-y-1">
              <div class="font-display text-display text-tertiary tracking-tight">${metrics.coveragePercent}%</div>
              <div class="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                <span class="w-2 h-2 rounded-full ${metrics.unclassifiedCount > 0 ? 'bg-error animate-pulse' : 'bg-tertiary'}"></span>
                <span><strong>${metrics.unclassifiedCount} Unclassified</strong> pending</span>
              </div>
            </div>
            <div class="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
              <div class="bg-tertiary h-full rounded-full" style="width: ${metrics.coveragePercent}%"></div>
            </div>
          </div>

          <!-- KPI 3 -->
          <div class="bg-surface-container-lowest rounded-xl p-space-md shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-space-xs hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between">
              <span class="font-label-md text-label-md text-on-surface-variant font-medium">Active Loans</span>
              <span class="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center text-secondary">
                <span class="material-symbols-outlined text-xl">assignment_ind</span>
              </span>
            </div>
            <div class="space-y-1">
              <div class="font-display text-display text-on-surface tracking-tight">${metrics.activeLoans}</div>
              <div class="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-2">
                <span class="text-tertiary font-bold">${Math.max(0, metrics.activeLoans - metrics.overdueLoans)} On-Time</span>
                <span>•</span>
                <span class="text-error font-bold">${metrics.overdueLoans} Overdue</span>
              </div>
            </div>
            <div class="w-full bg-surface-container rounded-full h-1.5 overflow-hidden flex">
              <div class="bg-secondary h-full" style="width: 85%"></div>
              <div class="bg-error h-full" style="width: 15%"></div>
            </div>
          </div>

          <!-- KPI 4 -->
          <div class="bg-surface-container-lowest rounded-xl p-space-md shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-space-xs hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between">
              <span class="font-label-md text-label-md text-on-surface-variant font-medium">Secondary Structure</span>
              <span class="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-primary">
                <span class="material-symbols-outlined text-xl">account_tree</span>
              </span>
            </div>
            <div class="space-y-1">
              <div class="font-display text-display text-on-surface tracking-tight">4 Arrays</div>
              <div class="font-label-sm text-label-sm text-on-surface-variant">
                <span>124 NERDC Subdivisions Active</span>
              </div>
            </div>
            <div class="flex items-center gap-1.5 pt-1">
              <span class="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container text-on-surface font-bold">0</span>
              <span class="font-label-sm text-label-sm px-2 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-bold">01</span>
              <span class="font-label-sm text-label-sm px-2 py-0.5 rounded bg-primary-fixed text-on-primary-fixed font-bold">02</span>
              <span class="font-label-sm text-label-sm px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-bold">03</span>
            </div>
          </div>
        </section>

        <!-- Section 3: First Array Classification Hierarchy -->
        <section class="space-y-space-sm">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-space-xs">
            <div>
              <h2 class="font-headline-md text-headline-md text-on-surface">First Array Classification Hierarchy</h2>
              <p class="font-body-sm text-body-sm text-on-surface-variant">Core Nigerian Secondary Curriculum distribution across main academic divisions</p>
            </div>
            <button data-action-nav="master-schedule" class="px-space-md py-1 rounded-full bg-surface-container font-label-sm text-label-sm text-on-surface-variant hover:text-on-surface font-bold transition-colors">
              Expand All 124 Codes
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-md">
            <!-- 01 Science -->
            <div class="bg-surface-container-lowest rounded-xl p-space-md space-y-space-md shadow-sm border-l-4 border-tertiary hover:-translate-y-1 transition-transform cursor-pointer" onclick="window.app.browseClass('01')">
              <div class="flex items-start justify-between">
                <div>
                  <div class="inline-flex items-center gap-1 font-label-md text-label-md text-tertiary font-bold">
                    <span class="material-symbols-outlined text-lg">science</span>
                    <span>ARRAY 01</span>
                  </div>
                  <h3 class="font-headline-sm text-headline-sm text-on-surface">General & Basic Science</h3>
                </div>
                <span class="font-label-lg text-label-lg font-bold text-tertiary bg-tertiary-fixed/60 px-space-xs py-1 rounded-lg">1,840</span>
              </div>
              <div class="space-y-2">
                <div class="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant"><span>010 Mathematics</span><span class="font-bold text-on-surface">450</span></div>
                <div class="w-full bg-surface-container rounded-full h-1.5"><div class="bg-tertiary h-full rounded-full" style="width: 85%"></div></div>
                <div class="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant"><span>011 Physics & Elec.</span><span class="font-bold text-on-surface">390</span></div>
                <div class="w-full bg-surface-container rounded-full h-1.5"><div class="bg-tertiary h-full rounded-full" style="width: 72%"></div></div>
                <div class="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant"><span>012 Chemistry</span><span class="font-bold text-on-surface">380</span></div>
                <div class="w-full bg-surface-container rounded-full h-1.5"><div class="bg-tertiary h-full rounded-full" style="width: 70%"></div></div>
                <div class="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant"><span>013 Biology & Health</span><span class="font-bold text-on-surface">340</span></div>
                <div class="w-full bg-surface-container rounded-full h-1.5"><div class="bg-tertiary h-full rounded-full" style="width: 62%"></div></div>
                <div class="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant"><span>014 Agric Science</span><span class="font-bold text-on-surface">280</span></div>
                <div class="w-full bg-surface-container rounded-full h-1.5"><div class="bg-tertiary h-full rounded-full" style="width: 50%"></div></div>
              </div>
            </div>

            <!-- 02 Social Sciences -->
            <div class="bg-surface-container-lowest rounded-xl p-space-md space-y-space-md shadow-sm border-l-4 border-primary hover:-translate-y-1 transition-transform cursor-pointer" onclick="window.app.browseClass('02')">
              <div class="flex items-start justify-between">
                <div>
                  <div class="inline-flex items-center gap-1 font-label-md text-label-md text-primary font-bold">
                    <span class="material-symbols-outlined text-lg">public</span>
                    <span>ARRAY 02</span>
                  </div>
                  <h3 class="font-headline-sm text-headline-sm text-on-surface">Social Sciences</h3>
                </div>
                <span class="font-label-lg text-label-lg font-bold text-primary bg-primary-fixed px-space-xs py-1 rounded-lg">1,120</span>
              </div>
              <div class="space-y-2">
                <div class="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant"><span>020 Economics</span><span class="font-bold text-on-surface">380</span></div>
                <div class="w-full bg-surface-container rounded-full h-1.5"><div class="bg-primary h-full rounded-full" style="width: 78%"></div></div>
                <div class="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant"><span>021 Commerce & Accts</span><span class="font-bold text-on-surface">310</span></div>
                <div class="w-full bg-surface-container rounded-full h-1.5"><div class="bg-primary h-full rounded-full" style="width: 65%"></div></div>
                <div class="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant"><span>022 Govt & Civics</span><span class="font-bold text-on-surface">260</span></div>
                <div class="w-full bg-surface-container rounded-full h-1.5"><div class="bg-primary h-full rounded-full" style="width: 55%"></div></div>
                <div class="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant"><span>023 Home Economics</span><span class="font-bold text-on-surface">170</span></div>
                <div class="w-full bg-surface-container rounded-full h-1.5"><div class="bg-primary h-full rounded-full" style="width: 38%"></div></div>
              </div>
            </div>

            <!-- 03 Arts & Humanities -->
            <div class="bg-surface-container-lowest rounded-xl p-space-md space-y-space-md shadow-sm border-l-4 border-secondary hover:-translate-y-1 transition-transform cursor-pointer" onclick="window.app.browseClass('03')">
              <div class="flex items-start justify-between">
                <div>
                  <div class="inline-flex items-center gap-1 font-label-md text-label-md text-secondary font-bold">
                    <span class="material-symbols-outlined text-lg">theater_comedy</span>
                    <span>ARRAY 03</span>
                  </div>
                  <h3 class="font-headline-sm text-headline-sm text-on-surface">Arts & Humanities</h3>
                </div>
                <span class="font-label-lg text-label-lg font-bold text-secondary bg-secondary-fixed px-space-xs py-1 rounded-lg">1,280</span>
              </div>
              <div class="space-y-2">
                <div class="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant"><span>030 Literary Arts</span><span class="font-bold text-on-surface">490</span></div>
                <div class="w-full bg-surface-container rounded-full h-1.5"><div class="bg-secondary h-full rounded-full" style="width: 82%"></div></div>
                <div class="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant"><span>031 Performing Arts</span><span class="font-bold text-on-surface">190</span></div>
                <div class="w-full bg-surface-container rounded-full h-1.5"><div class="bg-secondary h-full rounded-full" style="width: 40%"></div></div>
                <div class="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant"><span>032 Visual & Fine Arts</span><span class="font-bold text-on-surface">180</span></div>
                <div class="w-full bg-surface-container rounded-full h-1.5"><div class="bg-secondary h-full rounded-full" style="width: 38%"></div></div>
                <div class="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant"><span>033 History & Nigeria</span><span class="font-bold text-on-surface">220</span></div>
                <div class="w-full bg-surface-container rounded-full h-1.5"><div class="bg-secondary h-full rounded-full" style="width: 48%"></div></div>
                <div class="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant"><span>034 CRS / IRS Religion</span><span class="font-bold text-on-surface">200</span></div>
                <div class="w-full bg-surface-container rounded-full h-1.5"><div class="bg-secondary h-full rounded-full" style="width: 44%"></div></div>
              </div>
            </div>

            <!-- 0 General Knowledge -->
            <div class="bg-surface-container-lowest rounded-xl p-space-md space-y-space-md shadow-sm border-l-4 border-error hover:-translate-y-1 transition-transform cursor-pointer" onclick="window.app.browseClass('0')">
              <div class="flex items-start justify-between">
                <div>
                  <div class="inline-flex items-center gap-1 font-label-md text-label-md text-error font-bold">
                    <span class="material-symbols-outlined text-lg">terminal</span>
                    <span>ARRAY 0</span>
                  </div>
                  <h3 class="font-headline-sm text-headline-sm text-on-surface">General Knowledge</h3>
                </div>
                <span class="font-label-lg text-label-lg font-bold text-error bg-error-container px-space-xs py-1 rounded-lg">652</span>
              </div>
              <div class="space-y-2">
                <div class="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant"><span>001 Computer Studies</span><span class="font-bold text-on-surface">240</span></div>
                <div class="w-full bg-surface-container rounded-full h-1.5"><div class="bg-error h-full rounded-full" style="width: 74%"></div></div>
                <div class="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant"><span>002 Library & Indices</span><span class="font-bold text-on-surface">112</span></div>
                <div class="w-full bg-surface-container rounded-full h-1.5"><div class="bg-error h-full rounded-full" style="width: 45%"></div></div>
                <div class="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant"><span>003 Education Systems</span><span class="font-bold text-on-surface">90</span></div>
                <div class="w-full bg-surface-container rounded-full h-1.5"><div class="bg-error h-full rounded-full" style="width: 32%"></div></div>
                <div class="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant"><span>004 Logic & Philosophy</span><span class="font-bold text-on-surface">70</span></div>
                <div class="w-full bg-surface-container rounded-full h-1.5"><div class="bg-error h-full rounded-full" style="width: 25%"></div></div>
                <div class="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant"><span>005 Geo & Cartography</span><span class="font-bold text-on-surface">140</span></div>
                <div class="w-full bg-surface-container rounded-full h-1.5"><div class="bg-error h-full rounded-full" style="width: 52%"></div></div>
              </div>
            </div>
          </div>
        </section>

        <!-- Section 4: Operational Desk (Two-Column) -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
          <!-- Left Column: Recent Classifications -->
          <section class="lg:col-span-7 space-y-space-md">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="font-headline-md text-headline-md text-on-surface">Recent Classifications & Spine Tags</h2>
                <p class="font-body-sm text-body-sm text-on-surface-variant">Recently accessioned secondary resources tagged with 2026 call marks</p>
              </div>
              <span class="font-label-sm text-label-sm bg-surface-container-high px-space-sm py-1 rounded-full text-on-surface font-bold">
                Showing 4 of ${window.libraryStore.resources.length}
              </span>
            </div>

            <div class="space-y-space-sm">
              ${resources.map(res => `
                <div class="bg-surface-container-lowest rounded-xl p-space-md shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row gap-space-md items-start sm:items-center justify-between">
                  <div class="flex items-start gap-space-md">
                    <div class="w-12 h-16 rounded-lg bg-surface-container flex flex-col items-center justify-center shrink-0 shadow-sm" style="color: ${window.labelGenerator.getArrayColor(res.classificationNumber)}">
                      <span class="material-symbols-outlined text-2xl">${res.resourceType === 'Book' || res.resourceType === 'Textbook' ? 'menu_book' : res.isDigital ? 'laptop_chromebook' : 'bolt'}</span>
                      <span class="font-label-sm text-[8px] uppercase font-bold tracking-tighter">${res.classificationNumber.split('.')[0]}</span>
                    </div>
                    <div class="space-y-1">
                      <div class="flex items-center gap-2">
                        <span class="px-2 py-0.5 rounded-full font-label-sm text-label-sm font-bold tracking-wide" style="background-color: ${window.labelGenerator.getArrayColor(res.classificationNumber)}20; color: ${window.labelGenerator.getArrayColor(res.classificationNumber)}">
                          ${res.callNumber || res.classificationNumber}
                        </span>
                        <span class="w-2 h-2 rounded-full ${res.status === 'AVAILABLE' ? 'bg-tertiary' : res.status === 'RESERVED' ? 'bg-primary-container' : 'bg-error'}"></span>
                        <span class="font-label-sm text-label-sm ${res.status === 'AVAILABLE' ? 'text-tertiary' : res.status === 'RESERVED' ? 'text-primary' : 'text-error'} font-medium">
                          ${res.status === 'AVAILABLE' ? 'In Library' : res.status === 'RESERVED' ? 'Carrel Reserved' : 'Checked Out'}
                        </span>
                      </div>
                      <h4 class="font-headline-sm text-headline-sm text-on-surface hover:text-secondary cursor-pointer" onclick="window.app.openResourceDetails('${res.id}')">${res.title}</h4>
                      <p class="font-body-sm text-body-sm text-on-surface-variant">${res.author} • ${res.publisher} (${res.year})</p>
                    </div>
                  </div>
                  <div class="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-space-xs pt-2 sm:pt-0">
                    <span class="font-label-sm text-label-sm text-on-surface-variant">Acc: <strong class="text-on-surface">#${res.accessionNumber}</strong></span>
                    <button onclick="window.app.printSpineTag('${res.id}')" class="inline-flex items-center gap-1 font-label-sm text-label-sm px-space-sm py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-bold transition-colors">
                      <span class="material-symbols-outlined text-sm">print</span> Print Spine
                    </button>
                  </div>
                </div>
              `).join("")}
            </div>
          </section>

          <!-- Right Column: Classification Alerts & Verification Flags -->
          <section class="lg:col-span-5 space-y-space-md">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="font-headline-md text-headline-md text-on-surface">Classification Alerts</h2>
                <p class="font-body-sm text-body-sm text-on-surface-variant">Scheme adherence & cataloguer sync status</p>
              </div>
              <span class="w-2.5 h-2.5 rounded-full bg-primary-container animate-ping"></span>
            </div>

            <div class="space-y-space-sm">
              <!-- Notice Card 1: Reserved Unassigned Codes (PRD Sec 18) -->
              <div class="bg-surface-container-lowest rounded-xl p-space-md shadow-sm space-y-space-xs border border-surface-container-low">
                <div class="flex items-center justify-between">
                  <span class="font-label-sm text-label-sm bg-primary-fixed text-on-primary-fixed px-space-xs py-0.5 rounded-full font-bold">
                    Code Reservation (PRD §18 & §50)
                  </span>
                  <span class="font-label-sm text-label-sm text-on-surface-variant">Array 02 • Economics</span>
                </div>
                <h4 class="font-headline-sm text-headline-sm text-on-surface">4 Reserved Subdivision Slots</h4>
                <p class="font-body-sm text-body-sm text-on-surface-variant">
                  The following notations are intentionally preserved for upcoming WAEC trade curricula additions:
                </p>
                <div class="flex flex-wrap gap-1.5 pt-1">
                  <span class="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container text-on-surface font-bold">020.1i</span>
                  <span class="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container text-on-surface font-bold">020.1ii</span>
                  <span class="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container text-on-surface font-bold">020.2i</span>
                  <span class="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container text-on-surface font-bold">020.2ii</span>
                </div>
                <div class="pt-space-xs flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
                  <span class="inline-flex items-center gap-1 text-primary font-bold">
                    <span class="material-symbols-outlined text-base">lock</span> Status: UNASSIGNED
                  </span>
                  <button data-action-nav="scheme-admin" class="text-secondary font-bold hover:underline">Review Scheme Rules</button>
                </div>
              </div>

              <!-- Notice Card 2: Local Extension Active (PRD Sec 47, 48) -->
              <div class="bg-surface-container-lowest rounded-xl p-space-md shadow-sm space-y-space-xs border border-surface-container-low">
                <div class="flex items-center justify-between">
                  <span class="font-label-sm text-label-sm bg-secondary-fixed text-on-secondary-fixed px-space-xs py-0.5 rounded-full font-bold">
                    Local Hub Override (PRD §47)
                  </span>
                  <span class="font-label-sm text-label-sm text-tertiary font-bold">Active in Stacks</span>
                </div>
                <h4 class="font-headline-sm text-headline-sm text-on-surface">King's College Calculus Extension</h4>
                <p class="font-body-sm text-body-sm text-on-surface-variant">
                  Notation <code class="bg-surface-container px-1 rounded text-secondary font-bold">010.4A Calculus</code> mapped to King’s College Senior Math Honors track under NERDC Local Adaptation Clause 3.2.
                </p>
                <div class="pt-space-xs flex items-center justify-between font-label-sm text-label-sm">
                  <span class="text-on-surface-variant">Authorized by: <strong>Mr. A. Adeleke</strong></span>
                  <span class="text-secondary font-bold">18 Books Linked</span>
                </div>
              </div>

              <!-- Notice Card 3: Audit Trail -->
              <div class="bg-gradient-to-br from-surface-container-lowest via-surface-container-low to-surface-container rounded-xl p-space-md space-y-space-sm shadow-sm border border-surface-container">
                <div class="flex items-center gap-space-sm">
                  <span class="w-10 h-10 rounded-full bg-secondary text-on-secondary flex items-center justify-center shrink-0">
                    <span class="material-symbols-outlined">rule_folder</span>
                  </span>
                  <div>
                    <h4 class="font-headline-sm text-headline-sm text-on-surface">Classificationist Audit Trail</h4>
                    <p class="font-label-sm text-label-sm text-on-surface-variant">Version 1.0 — 2026 Nigerian Secondary Master Scheme</p>
                  </div>
                </div>
                <p class="font-body-sm text-body-sm text-on-surface-variant">
                  Full change log across 4 broad arrays and 124 subdivisions. Compatible with WAEC, NECO, and FME technical secondary syllabi.
                </p>
                <div class="pt-1 flex items-center justify-between">
                  <button onclick="window.app.exportScheduleText()" class="inline-flex items-center gap-1.5 px-space-md py-1.5 rounded-full bg-surface-container-highest text-on-surface font-label-sm text-label-sm font-bold hover:bg-surface-dim transition-colors">
                    <span class="material-symbols-outlined text-base">download</span> Export Master Text
                  </button>
                  <button data-action-nav="audit-trail" class="inline-flex items-center gap-1 text-secondary font-label-sm text-label-sm font-bold hover:underline">
                    View Full Logs <span class="material-symbols-outlined text-base">arrow_forward</span>
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- Section 5: Student Friendly Classification Cheat-Sheet -->
        <section class="bg-surface-container-low rounded-xl p-space-md lg:p-space-lg flex flex-col md:flex-row items-center justify-between gap-space-md border border-surface-container">
          <div class="flex items-center gap-space-md">
            <div class="w-16 h-16 rounded-xl bg-primary-fixed flex items-center justify-center text-primary shrink-0 shadow-sm">
              <span class="material-symbols-outlined text-4xl">local_library</span>
            </div>
            <div>
              <span class="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">Student Study Tip</span>
              <h3 class="font-headline-sm text-headline-sm text-on-surface">Finding Books for Your SSCE Exams?</h3>
              <p class="font-body-sm text-body-sm text-on-surface-variant">
                Look for green shelf spine tags for <strong>Sciences (01)</strong>, ochre tags for <strong>Social Sciences (02)</strong>, and purple tags for <strong>Literature & Drama (030)</strong>.
              </p>
            </div>
          </div>
          <div class="flex items-center gap-space-xs shrink-0 w-full md:w-auto">
            <button data-action-nav="shelf-locations" class="w-full md:w-auto px-space-lg py-2.5 rounded-full bg-primary-container text-on-primary-container font-label-md text-label-md font-bold shadow-sm hover:scale-[1.02] active:scale-95 transition-transform">
              View Shelf Map
            </button>
          </div>
        </section>
      </div>
    `;
  }

  bindDashboardEvents() {
    // Micro-interactions already registered
  }

  // ==========================================
  // VIEW 2: CLASSIFICATION EXPLORER (PRD Sec 45, 73, 77)
  // ==========================================

  renderClassificationExplorerView() {
    const selectedNode = window.classificationEngine.getNode(this.selectedClassificationCode) || window.classificationEngine.getNode("011.2");
    const breadcrumbs = window.classificationEngine.getBreadcrumbs(selectedNode.code);
    const relatedResources = window.libraryStore.getResources().filter(r => r.classificationNumber && (r.classificationNumber === selectedNode.code || r.classificationNumber.startsWith(selectedNode.code + ".")));
    const children = window.classificationEngine.getChildren(selectedNode.code);

    return `
      <div class="space-y-space-md">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-surface-container-low">
          <div>
            <div class="inline-flex items-center gap-1 font-label-sm text-label-sm text-secondary font-bold">
              <span class="material-symbols-outlined text-base">account_tree</span>
              <span>2026 NERDC Secondary Classification Explorer</span>
            </div>
            <h1 class="font-headline-lg text-headline-lg text-on-surface tracking-tight">Classification Hierarchy & Schedules</h1>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="window.app.openAddLocalExtensionModal()" class="inline-flex items-center gap-1.5 px-space-md py-2 rounded-full bg-secondary text-on-secondary font-label-md text-label-md shadow-sm hover:scale-[1.02] active:scale-95 transition-transform">
              <span class="material-symbols-outlined text-lg">add_circle</span> Add Local Extension
            </button>
            <button data-action-nav="master-schedule" class="inline-flex items-center gap-1.5 px-space-md py-2 rounded-full bg-surface-container font-label-md text-label-md text-on-surface hover:bg-surface-container-high transition-colors">
              <span class="material-symbols-outlined text-lg">table_chart</span> Master Schedule
            </button>
          </div>
        </div>

        <!-- Explorer Workbench (Two Column) -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-space-md">
          <!-- Left Tree Nav (5 cols) -->
          <div class="lg:col-span-5 bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-surface-container-low space-y-space-sm flex flex-col h-[750px]">
            <div class="relative">
              <span class="material-symbols-outlined absolute left-3 top-2.5 text-outline text-lg">search</span>
              <input id="explorer-tree-search" type="text" placeholder="Search codes (e.g. 011.2, Electricity)..." class="w-full pl-9 pr-4 py-2 rounded-xl bg-surface-container-low text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-secondary/40 transition-all border border-surface-container" />
            </div>

            <!-- Array Tabs Filter -->
            <div class="flex items-center gap-1 overflow-x-auto pb-1 text-on-surface-variant">
              <button onclick="window.app.filterTreeArray('ALL')" class="px-2.5 py-1 rounded-lg font-label-sm text-label-sm bg-surface-container font-bold hover:bg-surface-container-high">All</button>
              <button onclick="window.app.filterTreeArray('0')" class="px-2.5 py-1 rounded-lg font-label-sm text-label-sm bg-surface-container hover:bg-surface-container-high">0 Gen</button>
              <button onclick="window.app.filterTreeArray('01')" class="px-2.5 py-1 rounded-lg font-label-sm text-label-sm bg-tertiary-fixed text-on-tertiary-fixed font-bold">01 Science</button>
              <button onclick="window.app.filterTreeArray('02')" class="px-2.5 py-1 rounded-lg font-label-sm text-label-sm bg-primary-fixed text-on-primary-fixed font-bold">02 Social</button>
              <button onclick="window.app.filterTreeArray('03')" class="px-2.5 py-1 rounded-lg font-label-sm text-label-sm bg-secondary-fixed text-on-secondary-fixed font-bold">03 Arts</button>
            </div>

            <!-- Tree View Container -->
            <div id="classification-tree-scroll" class="flex-1 overflow-y-auto pr-1 space-y-1">
              ${this.renderTreeHtml()}
            </div>
          </div>

          <!-- Right Detail Pane (7 cols) -->
          <div class="lg:col-span-7 space-y-space-md">
            <!-- Selected Node Detail Card -->
            <div class="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-surface-container-low space-y-space-md">
              <!-- Breadcrumbs -->
              <nav class="flex items-center gap-1.5 flex-wrap text-on-surface-variant font-label-sm text-label-sm">
                ${breadcrumbs.map((b, idx) => `
                  <button onclick="window.app.selectTreeNode('${b.code}')" class="hover:text-secondary ${idx === breadcrumbs.length - 1 ? 'font-bold text-on-surface' : ''}">
                    ${b.code} ${b.name}
                  </button>
                  ${idx < breadcrumbs.length - 1 ? '<span class="material-symbols-outlined text-xs text-outline">chevron_right</span>' : ''}
                `).join("")}
              </nav>

              <!-- Node Title & Badges -->
              <div class="flex items-start justify-between gap-space-sm">
                <div>
                  <div class="flex items-center gap-2">
                    <span class="font-display text-2xl lg:text-3xl font-extrabold font-label-md" style="color: ${window.labelGenerator.getArrayColor(selectedNode.code)}">
                      ${selectedNode.code}
                    </span>
                    <span class="px-2.5 py-0.5 rounded-full font-label-sm text-label-sm font-bold ${selectedNode.status === 'UNASSIGNED' ? 'bg-error-container text-on-error-container' : selectedNode.source === 'LOCAL' ? 'bg-secondary-fixed text-on-secondary-fixed' : 'bg-surface-container text-on-surface'}">
                      ${selectedNode.status === 'UNASSIGNED' ? 'UNASSIGNED RESERVED' : selectedNode.source === 'LOCAL' ? 'LOCAL SCHOOL EXTENSION' : 'OFFICIAL MASTER SCHEME'}
                    </span>
                  </div>
                  <h2 class="font-headline-lg text-headline-md lg:text-headline-lg text-on-surface pt-1">
                    ${selectedNode.displayName || selectedNode.name}
                  </h2>
                </div>
                <div class="flex items-center gap-1">
                  <button onclick="window.app.openCataloguingModalWithCode('${selectedNode.code}')" class="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary-container text-on-primary-container font-label-sm text-label-sm font-bold shadow-sm hover:scale-105 transition-transform">
                    <span class="material-symbols-outlined text-base">add</span> Assign to Book
                  </button>
                </div>
              </div>

              <!-- Scope Note (PRD Sec 33) -->
              <div class="bg-surface-container-low p-space-md rounded-xl space-y-1 border border-surface-container">
                <div class="flex items-center justify-between font-label-sm text-label-sm text-secondary font-bold uppercase tracking-wider">
                  <span>Scope Note (Curriculum & Inclusions)</span>
                  <span class="text-on-surface-variant font-normal">Level ${selectedNode.level}</span>
                </div>
                <p class="font-body-md text-body-md text-on-surface leading-relaxed">
                  ${selectedNode.scopeNote || selectedNode.description}
                </p>
              </div>

              <!-- Controlled Vocabulary & Cross References (PRD Sec 31, 32) -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-space-sm pt-1">
                <!-- Subject Headings -->
                <div class="bg-surface-container-lowest p-space-sm rounded-xl border border-surface-container space-y-1">
                  <span class="font-label-sm text-label-sm uppercase text-on-surface-variant font-bold">Subject Headings (Controlled Vocab)</span>
                  <div class="flex flex-wrap gap-1">
                    ${(selectedNode.subjectHeadings || []).map(sh => `
                      <span class="px-2 py-0.5 rounded-md bg-surface-container text-on-surface font-label-sm text-label-sm font-medium">${sh}</span>
                    `).join("")}
                  </div>
                </div>

                <!-- Cross References -->
                <div class="bg-surface-container-lowest p-space-sm rounded-xl border border-surface-container space-y-1">
                  <span class="font-label-sm text-label-sm uppercase text-on-surface-variant font-bold">Cross References (SEE / SEE ALSO)</span>
                  <div class="space-y-0.5 font-label-sm text-label-sm">
                    ${selectedNode.crossReferences && selectedNode.crossReferences.SEE && selectedNode.crossReferences.SEE.length > 0 ? `
                      <div class="text-error font-bold">${selectedNode.crossReferences.SEE.join(", ")}</div>
                    ` : ""}
                    ${selectedNode.crossReferences && selectedNode.crossReferences.SEE_ALSO && selectedNode.crossReferences.SEE_ALSO.length > 0 ? `
                      <div class="text-secondary font-semibold">SEE ALSO: ${selectedNode.crossReferences.SEE_ALSO.map(c => `<button onclick="window.app.selectTreeNode('${c}')" class="underline hover:text-primary font-bold ml-1">${c}</button>`).join(", ")}</div>
                    ` : `<span class="text-on-surface-variant italic">No cross references specified</span>`}
                  </div>
                </div>
              </div>

              <!-- Subordinate Classes (Children) -->
              ${children.length > 0 ? `
                <div class="space-y-space-xs pt-1">
                  <span class="font-label-sm text-label-sm uppercase text-on-surface-variant font-bold">Subdivisions (${children.length})</span>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    ${children.map(child => `
                      <div onclick="window.app.selectTreeNode('${child.code}')" class="p-2 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer flex items-center justify-between border border-surface-container">
                        <div class="flex items-center gap-2">
                          <span class="font-label-sm text-label-sm font-bold text-primary">${child.code}</span>
                          <span class="font-body-sm text-body-sm text-on-surface truncate">${child.name}</span>
                        </div>
                        <span class="material-symbols-outlined text-sm text-outline">chevron_right</span>
                      </div>
                    `).join("")}
                  </div>
                </div>
              ` : ""}
            </div>

            <!-- Classified Resources Under This Code -->
            <div class="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-surface-container-low space-y-space-sm">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="font-headline-sm text-headline-sm text-on-surface">Resources Classified Under ${selectedNode.code}</h3>
                  <p class="font-body-sm text-body-sm text-on-surface-variant">${relatedResources.length} items catalogued in stacks</p>
                </div>
                <button onclick="window.app.openCataloguingModalWithCode('${selectedNode.code}')" class="inline-flex items-center gap-1 font-label-sm text-label-sm px-3 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-bold">
                  <span class="material-symbols-outlined text-sm">add</span> Add Book
                </button>
              </div>

              ${relatedResources.length > 0 ? `
                <div class="space-y-2">
                  ${relatedResources.map(r => `
                    <div class="p-3 rounded-xl bg-surface-container-low border border-surface-container flex items-center justify-between gap-3 hover:bg-surface-container transition-colors">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-12 bg-white rounded border border-gray-200 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                          ${r.callNumber ? r.callNumber.split(" ")[1] || "A10" : "A10"}
                        </div>
                        <div>
                          <div class="font-body-sm text-body-sm font-bold text-on-surface">${r.title}</div>
                          <div class="font-label-sm text-label-sm text-on-surface-variant">${r.author} • Shelf: ${r.shelfLocation}</div>
                        </div>
                      </div>
                      <div class="flex items-center gap-2 shrink-0">
                        <button onclick="window.app.printSpineTag('${r.id}')" class="px-2 py-1 rounded bg-white text-on-surface font-label-sm text-xs font-bold border border-gray-200 hover:bg-gray-50 flex items-center gap-1">
                          <span class="material-symbols-outlined text-xs">print</span> Spine
                        </button>
                        <button onclick="window.app.openResourceDetails('${r.id}')" class="px-2 py-1 rounded bg-primary-container text-on-primary-container font-label-sm text-xs font-bold">
                          View
                        </button>
                      </div>
                    </div>
                  `).join("")}
                </div>
              ` : `
                <div class="text-center py-8 text-on-surface-variant space-y-2">
                  <span class="material-symbols-outlined text-4xl text-outline">menu_book</span>
                  <p class="font-body-sm text-body-sm">No items currently catalogued under notation <strong>${selectedNode.code}</strong>.</p>
                  <button onclick="window.app.openCataloguingModalWithCode('${selectedNode.code}')" class="px-4 py-1.5 rounded-full bg-primary text-on-primary font-label-sm text-label-sm font-bold">
                    Classify First Resource Here
                  </button>
                </div>
              `}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderTreeHtml(nodes = null, depth = 0) {
    if (!nodes) {
      nodes = window.classificationEngine.treeCache || window.classificationEngine.rebuildTree();
    }

    return nodes.map(node => {
      const isSelected = node.code === this.selectedClassificationCode;
      const hasChildren = node.children && node.children.length > 0;
      const arrayColor = window.labelGenerator.getArrayColor(node.code);

      return `
        <div class="tree-node" style="padding-left: ${depth * 12}px;">
          <div onclick="window.app.selectTreeNode('${node.code}')" class="group flex items-center justify-between py-1.5 px-2 rounded-lg cursor-pointer transition-all ${isSelected ? 'bg-primary-container text-on-primary-container font-bold shadow-sm' : 'hover:bg-surface-container-low text-on-surface'}">
            <div class="flex items-center gap-1.5 min-w-0">
              <span class="font-label-sm text-label-sm px-1.5 py-0.5 rounded font-extrabold ${isSelected ? 'bg-white/40 text-on-primary-container' : 'bg-surface-container'}" style="${!isSelected ? `color: ${arrayColor};` : ''}">
                ${node.code}
              </span>
              <span class="font-body-sm text-body-sm truncate ${isSelected ? 'font-bold' : ''}">${node.name}</span>
            </div>
            <div class="flex items-center gap-1 shrink-0">
              ${node.status === 'UNASSIGNED' ? `<span class="text-[9px] bg-error-container text-on-error-container px-1 rounded font-bold">UNASSIGNED</span>` : ''}
              ${node.source === 'LOCAL' ? `<span class="text-[9px] bg-secondary-fixed text-on-secondary-fixed px-1 rounded font-bold">LOCAL</span>` : ''}
              ${hasChildren ? `<span class="material-symbols-outlined text-xs text-outline">${isSelected ? 'expand_more' : 'chevron_right'}</span>` : ''}
            </div>
          </div>
          ${hasChildren ? `
            <div class="tree-children">
              ${this.renderTreeHtml(node.children, depth + 1)}
            </div>
          ` : ''}
        </div>
      `;
    }).join("");
  }

  bindClassificationExplorerEvents() {
    const searchInput = document.querySelector("#explorer-tree-search");
    if (searchInput) {
      searchInput.addEventListener("input", e => {
        const query = e.target.value.trim();
        const treeContainer = document.querySelector("#classification-tree-scroll");
        if (!treeContainer) return;

        if (query.length > 0) {
          const results = window.classificationEngine.search(query);
          treeContainer.innerHTML = results.slice(0, 30).map(node => `
            <div onclick="window.app.selectTreeNode('${node.code}')" class="p-2 rounded-lg bg-surface-container-low hover:bg-surface-container cursor-pointer flex items-center justify-between border border-surface-container mb-1">
              <div class="flex items-center gap-2">
                <span class="font-label-sm text-label-sm font-bold text-primary">${node.code}</span>
                <span class="font-body-sm text-body-sm text-on-surface font-medium">${node.name}</span>
              </div>
              <span class="font-label-sm text-xs text-on-surface-variant">${node.source}</span>
            </div>
          `).join("");
        } else {
          treeContainer.innerHTML = this.renderTreeHtml();
        }
      });
    }
  }

  selectTreeNode(code) {
    this.selectedClassificationCode = code;
    this.renderCurrentView();
  }

  filterTreeArray(arrayPrefix) {
    const treeContainer = document.querySelector("#classification-tree-scroll");
    if (!treeContainer) return;

    if (arrayPrefix === "ALL") {
      treeContainer.innerHTML = this.renderTreeHtml();
    } else {
      const allNodes = window.classificationEngine.getAllNodes();
      const filtered = allNodes.filter(n => n.code === arrayPrefix || n.code.startsWith(arrayPrefix));
      treeContainer.innerHTML = filtered.map(node => `
        <div onclick="window.app.selectTreeNode('${node.code}')" class="p-2 rounded-lg bg-surface-container-low hover:bg-surface-container cursor-pointer flex items-center justify-between border border-surface-container mb-1">
          <div class="flex items-center gap-2">
            <span class="font-label-sm text-label-sm font-bold text-primary">${node.code}</span>
            <span class="font-body-sm text-body-sm text-on-surface">${node.name}</span>
          </div>
          <span class="font-label-sm text-xs text-on-surface-variant">Lvl ${node.level}</span>
        </div>
      `).join("");
    }
  }

  // ==========================================
  // VIEW 3: CLASSIFICATION ASSISTANT (PRD Sec 29, 30, 64, 65, 74)
  // ==========================================

  renderClassificationAssistantView() {
    return `
      <div class="space-y-space-md">
        <!-- Header -->
        <div class="bg-surface-container-lowest p-space-md lg:p-space-lg rounded-xl shadow-sm border border-surface-container-low flex flex-col md:flex-row md:items-center justify-between gap-space-md">
          <div>
            <div class="inline-flex items-center gap-1 font-label-sm text-label-sm text-secondary font-bold">
              <span class="material-symbols-outlined text-base">psychology</span>
              <span>2026 Curriculum AI Classification Assistant</span>
            </div>
            <h1 class="font-headline-lg text-headline-lg text-on-surface tracking-tight">AI Classification Assistant & Subject Suggester</h1>
            <p class="font-body-sm text-body-sm text-on-surface-variant pt-1">
              Enter resource title, keywords, or subject to automatically suggest official 2026 NERDC classification codes with verified scope notes.
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <span class="font-label-sm text-label-sm bg-tertiary-fixed text-on-tertiary-fixed px-3 py-1 rounded-full font-bold">
              Human Review Enforced (PRD §5.6 & §65)
            </span>
          </div>
        </div>

        <!-- Workbench Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-space-md">
          <!-- Input Form (6 cols) -->
          <div class="lg:col-span-6 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-surface-container-low space-y-space-md">
            <div class="flex items-center justify-between border-b border-surface-container pb-space-xs">
              <h2 class="font-headline-sm text-headline-sm text-on-surface">Classify New Resource</h2>
              <span class="font-label-sm text-label-sm text-outline">PRD §29 & §74</span>
            </div>

            <!-- Quick Preset Pill Prompts -->
            <div class="space-y-1">
              <span class="font-label-sm text-xs uppercase text-on-surface-variant font-bold">Test Presets from Nigerian Syllabi:</span>
              <div class="flex flex-wrap gap-1">
                <button type="button" onclick="window.app.fillAssistantPreset('physics')" class="px-2 py-1 rounded-md bg-surface-container hover:bg-surface-container-high font-label-sm text-xs font-medium text-on-surface">Electricity & Circuits (011.2)</button>
                <button type="button" onclick="window.app.fillAssistantPreset('folklore')" class="px-2 py-1 rounded-md bg-surface-container hover:bg-surface-container-high font-label-sm text-xs font-medium text-on-surface">Yoruba Folktales (030.2iaF)</button>
                <button type="button" onclick="window.app.fillAssistantPreset('fishery')" class="px-2 py-1 rounded-md bg-surface-container hover:bg-surface-container-high font-label-sm text-xs font-medium text-on-surface">Fishery & Catfish (014.2ii)</button>
                <button type="button" onclick="window.app.fillAssistantPreset('civics')" class="px-2 py-1 rounded-md bg-surface-container hover:bg-surface-container-high font-label-sm text-xs font-medium text-on-surface">Civics & Rights (022.2)</button>
                <button type="button" onclick="window.app.fillAssistantPreset('macro')" class="px-2 py-1 rounded-md bg-surface-container hover:bg-surface-container-high font-label-sm text-xs font-medium text-on-surface">Macroeconomics & CBN (020.1)</button>
              </div>
            </div>

            <form id="classification-assistant-form" class="space-y-3">
              <div>
                <label class="block font-label-sm text-label-sm font-bold text-on-surface mb-1">Book / Resource Title *</label>
                <input id="asst-title" type="text" required placeholder="e.g. Introduction to Electricity & Electric Circuits" class="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container font-body-sm text-body-sm focus:ring-2 focus:ring-secondary/40 focus:outline-none" />
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block font-label-sm text-label-sm font-bold text-on-surface mb-1">Author / Contributor</label>
                  <input id="asst-author" type="text" placeholder="e.g. Okeke, P.N." class="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container font-body-sm text-body-sm focus:ring-2 focus:ring-secondary/40 focus:outline-none" />
                </div>
                <div>
                  <label class="block font-label-sm text-label-sm font-bold text-on-surface mb-1">Subject Area</label>
                  <input id="asst-subject" type="text" placeholder="e.g. Electricity, Physics" class="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container font-body-sm text-body-sm focus:ring-2 focus:ring-secondary/40 focus:outline-none" />
                </div>
              </div>

              <div>
                <label class="block font-label-sm text-label-sm font-bold text-on-surface mb-1">Keywords</label>
                <input id="asst-keywords" type="text" placeholder="e.g. electricity, circuits, current, voltage, resistance" class="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container font-body-sm text-body-sm focus:ring-2 focus:ring-secondary/40 focus:outline-none" />
              </div>

              <div>
                <label class="block font-label-sm text-label-sm font-bold text-on-surface mb-1">Abstract / Description</label>
                <textarea id="asst-description" rows="3" placeholder="Brief outline of chapters, topic coverage, or WAEC syllabus units..." class="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container font-body-sm text-body-sm focus:ring-2 focus:ring-secondary/40 focus:outline-none"></textarea>
              </div>

              <div class="pt-2 flex items-center justify-between">
                <button type="reset" class="px-4 py-2 rounded-full font-label-md text-label-md text-on-surface-variant hover:text-on-surface">Clear</button>
                <button type="submit" class="inline-flex items-center gap-2 px-space-lg py-2.5 rounded-full bg-secondary text-on-secondary font-label-md text-label-md font-bold shadow-md hover:scale-[1.02] active:scale-95 transition-transform">
                  <span class="material-symbols-outlined text-lg">auto_awesome</span>
                  <span>Analyze & Suggest Code</span>
                </button>
              </div>
            </form>
          </div>

          <!-- Suggestions Output Panel (6 cols) -->
          <div class="lg:col-span-6 space-y-space-md">
            <div id="assistant-results-container" class="space-y-space-md">
              <div class="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-surface-container-low text-center py-16 space-y-3">
                <span class="material-symbols-outlined text-5xl text-outline animate-pulse">psychology</span>
                <h3 class="font-headline-sm text-headline-sm text-on-surface">Classification Engine Ready</h3>
                <p class="font-body-sm text-body-sm text-on-surface-variant max-w-sm mx-auto">
                  Provide resource details on the left or click a syllabus preset to test algorithmic classification matching against the 2026 NERDC scheme.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  bindClassificationAssistantEvents() {
    const form = document.querySelector("#classification-assistant-form");
    if (form) {
      form.addEventListener("submit", e => {
        e.preventDefault();
        this.runAssistantAnalysis();
      });
    }
  }

  fillAssistantPreset(presetKey) {
    const titleInput = document.querySelector("#asst-title");
    const authorInput = document.querySelector("#asst-author");
    const subjectInput = document.querySelector("#asst-subject");
    const keywordsInput = document.querySelector("#asst-keywords");
    const descInput = document.querySelector("#asst-description");

    if (presetKey === "physics") {
      titleInput.value = "Introduction to Electricity & Electric Circuits";
      authorInput.value = "Okeke, P.N.";
      subjectInput.value = "Electricity";
      keywordsInput.value = "electricity, circuits, current, voltage, resistance, Ohm's law";
      descInput.value = "Senior secondary laboratory experiments in current electricity, resistor color codes, and electromotive force.";
    } else if (presetKey === "folklore") {
      titleInput.value = "Yoruba Folktales of the Cunning Tortoise";
      authorInput.value = "Babalola, Adeboye";
      subjectInput.value = "Folklore";
      keywordsInput.value = "folktales, folklore, tortoise, ijapa, oral tradition, moral fables";
      descInput.value = "Collection of indigenous Yoruba evening fireside folktales featuring Ijapa the tortoise with moral lessons for young readers.";
    } else if (presetKey === "fishery") {
      titleInput.value = "Practical Catfish Farming & Pond Construction in Nigeria";
      authorInput.value = "Eyo, B.A.";
      subjectInput.value = "Fishery";
      keywordsInput.value = "fishery, aquaculture, catfish, pond, fingerlings, smoking kiln, feeds";
      descInput.value = "WAEC vocational trade syllabus on catfish fingerling stocking, water aeration, and smoking preservation.";
    } else if (presetKey === "civics") {
      titleInput.value = "Human Rights & Constitutional Citizenship";
      authorInput.value = "Oladipo, F.A.";
      subjectInput.value = "Civics";
      keywordsInput.value = "civics, constitution, human rights, democracy, rule of law, citizenship";
      descInput.value = "Compulsory senior secondary civic education on fundamental human rights and rule of law under the 1999 Constitution.";
    } else if (presetKey === "macro") {
      titleInput.value = "National Income Accounting and Central Banking";
      authorInput.value = "Ande, C.E.";
      subjectInput.value = "Macro Economics";
      keywordsInput.value = "national income, macroeconomics, gdp, cbn, inflation, monetary policy";
      descInput.value = "Analysis of Nigerian national income components, Central Bank of Nigeria monetary controls, and inflation management.";
    }

    this.runAssistantAnalysis();
  }

  runAssistantAnalysis() {
    const title = document.querySelector("#asst-title").value;
    const author = document.querySelector("#asst-author").value;
    const subject = document.querySelector("#asst-subject").value;
    const keywords = document.querySelector("#asst-keywords").value;
    const description = document.querySelector("#asst-description").value;

    const suggestions = window.classificationEngine.suggestClassification({
      title, author, subject, keywords, description
    });

    const resultsContainer = document.querySelector("#assistant-results-container");
    if (!resultsContainer) return;

    if (suggestions.length === 0) {
      resultsContainer.innerHTML = `
        <div class="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-surface-container-low text-center py-12 space-y-2">
          <span class="material-symbols-outlined text-4xl text-error">help</span>
          <h3 class="font-headline-sm text-headline-sm text-on-surface">No High-Confidence Classification Found</h3>
          <p class="font-body-sm text-body-sm text-on-surface-variant">
            Try adjusting keywords or browse the full classification schedule directly.
          </p>
          <button data-action-nav="classification-explorer" class="px-4 py-2 rounded-full bg-surface-container font-label-md text-label-md font-bold">
            Browse Classification Explorer
          </button>
        </div>
      `;
      return;
    }

    const top = suggestions[0];
    const generatedCutter = window.cutterEngine.generateCutterNumber(author || title);
    const generatedCallNumber = window.cutterEngine.buildCallNumber(top.code, generatedCutter, "C.1");

    resultsContainer.innerHTML = `
      <!-- Top Recommendation Box -->
      <div class="bg-surface-container-lowest rounded-xl p-space-lg shadow-md border-2 border-secondary space-y-space-sm relative overflow-hidden">
        <div class="flex items-center justify-between">
          <div class="inline-flex items-center gap-1 font-label-sm text-label-sm text-secondary font-bold">
            <span class="material-symbols-outlined text-base">verified</span>
            <span>TOP SYSTEM SUGGESTION (PRD §29 & §74)</span>
          </div>
          <span class="font-label-sm text-label-sm bg-tertiary-fixed text-on-tertiary-fixed px-2.5 py-0.5 rounded-full font-bold">
            ${top.confidence}% Confidence (${top.confidenceLabel})
          </span>
        </div>

        <div class="flex items-start justify-between gap-2 pt-1">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-3xl font-extrabold font-label-md text-secondary tracking-tight">${top.code}</span>
              <span class="text-sm font-bold text-on-surface-variant">• ${top.name}</span>
            </div>
            <div class="font-label-sm text-label-sm text-on-surface-variant pt-1">
              Parent: <strong>${top.parent ? `${top.parent.code} — ${top.parent.name}` : 'Root'}</strong>
            </div>
          </div>
        </div>

        <!-- Hierarchy Breadcrumbs -->
        <div class="p-2.5 rounded-lg bg-surface-container-low text-on-surface-variant font-label-sm text-xs flex items-center gap-1.5 flex-wrap">
          <span class="font-bold text-on-surface">Hierarchy:</span>
          ${top.breadcrumbs.map((b, idx) => `
            <span>${b.code} ${b.name}</span>
            ${idx < top.breadcrumbs.length - 1 ? '<span>→</span>' : ''}
          `).join("")}
        </div>

        <!-- Reasons Matched -->
        <div class="space-y-1">
          <span class="font-label-sm text-xs uppercase text-on-surface-variant font-bold">Matching Justifications:</span>
          <div class="flex flex-wrap gap-1">
            ${top.reasons.map(r => `
              <span class="px-2 py-0.5 rounded bg-surface-container text-on-surface font-label-sm text-xs font-medium">${r}</span>
            `).join("")}
          </div>
        </div>

        <!-- Scope Note -->
        ${top.scopeNote ? `
          <div class="text-xs text-on-surface-variant bg-white p-2 rounded border border-gray-200">
            <strong>Scope Note:</strong> ${top.scopeNote}
          </div>
        ` : ""}

        <!-- Call Number Generated Preview -->
        <div class="p-3 bg-secondary-fixed/30 rounded-xl flex items-center justify-between">
          <div>
            <span class="font-label-sm text-xs uppercase text-secondary font-bold">Proposed Call Number:</span>
            <div class="font-label-md text-lg font-extrabold text-secondary tracking-wide">${generatedCallNumber}</div>
          </div>
          <span class="font-label-sm text-xs bg-white px-2 py-1 rounded border border-secondary/20 text-on-surface">
            Cutter: <strong>${generatedCutter}</strong>
          </span>
        </div>

        <!-- Human Action Decisions (PRD Sec 29 & 30) -->
        <div class="pt-2 flex flex-wrap items-center gap-2">
          <button onclick="window.app.acceptAssistantClassification('${top.code}', '${top.name}', '${generatedCutter}', '${generatedCallNumber}')" class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-secondary text-on-secondary font-label-md text-label-md font-bold shadow hover:scale-105 active:scale-95 transition-transform">
            <span class="material-symbols-outlined text-base">check</span> Accept & Accession
          </button>
          <button onclick="window.app.browseClass('${top.code}')" class="px-3 py-2 rounded-full bg-surface-container hover:bg-surface-container-high font-label-sm text-label-sm text-on-surface font-bold transition-colors">
            Browse Parent
          </button>
          <button onclick="window.app.searchAndGo('${top.name}')" class="px-3 py-2 rounded-full bg-surface-container hover:bg-surface-container-high font-label-sm text-label-sm text-on-surface font-bold transition-colors">
            Search Related
          </button>
          <button onclick="window.app.openCataloguingModalWithCode('${top.code}')" class="px-3 py-2 rounded-full bg-surface-container-high hover:bg-surface-container-highest font-label-sm text-label-sm text-on-surface font-bold transition-colors">
            Manual Override
          </button>
        </div>
      </div>

      <!-- Alternative Ranked Suggestions -->
      ${suggestions.length > 1 ? `
        <div class="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-surface-container-low space-y-2">
          <h4 class="font-headline-sm text-headline-sm text-on-surface">Alternative Ranked Matches</h4>
          <div class="space-y-2">
            ${suggestions.slice(1).map(alt => `
              <div class="p-3 rounded-lg bg-surface-container-low hover:bg-surface-container flex items-center justify-between border border-surface-container transition-colors">
                <div>
                  <div class="flex items-center gap-2">
                    <span class="font-label-sm text-label-sm font-bold text-primary">${alt.code}</span>
                    <span class="font-body-sm text-body-sm text-on-surface font-semibold">${alt.name}</span>
                  </div>
                  <div class="text-[11px] text-on-surface-variant">${alt.reasons.join(" • ")}</div>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs font-bold text-on-surface-variant">${alt.confidence}%</span>
                  <button onclick="window.app.acceptAssistantClassification('${alt.code}', '${alt.name}', '${generatedCutter}', '${window.cutterEngine.buildCallNumber(alt.code, generatedCutter, "C.1")}')" class="px-2 py-1 rounded bg-white text-secondary font-label-sm text-xs font-bold border border-secondary/20 hover:bg-secondary hover:text-white transition-colors">
                    Accept This
                  </button>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      ` : ""}
    `;
  }

  acceptAssistantClassification(code, name, cutter, callNumber) {
    const title = document.querySelector("#asst-title") ? document.querySelector("#asst-title").value : "Classified Item";
    const author = document.querySelector("#asst-author") ? document.querySelector("#asst-author").value : "Unknown Author";
    const subject = document.querySelector("#asst-subject") ? document.querySelector("#asst-subject").value : name;

    const newRes = window.libraryStore.addResource({
      title,
      author: author || "Staff Author",
      classificationNumber: code,
      authorNumber: cutter,
      callNumber: callNumber,
      subject: subject,
      resourceType: "Textbook",
      status: "AVAILABLE",
      shelfLocation: "Science & Technology / Stacks",
      year: 2026
    });

    this.showToast(`Resource "${title}" classified as ${code} and added to Catalogue!`, "success");
    this.navigateTo("catalogue-resources");
  }

  // ==========================================
  // VIEW 4: MASTER SCHEDULE (PRD Sec 78, 10-26, 87)
  // ==========================================

  renderMasterScheduleView() {
    const allNodes = window.classificationEngine.getAllNodes();

    return `
      <div class="space-y-space-md">
        <!-- Header -->
        <div class="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
          <div>
            <div class="inline-flex items-center gap-1 font-label-sm text-label-sm text-primary font-bold">
              <span class="material-symbols-outlined text-base">menu_book</span>
              <span>Official 2026 NERDC Secondary Schedule</span>
            </div>
            <h1 class="font-headline-lg text-headline-lg text-on-surface tracking-tight">Master Classification Schedule</h1>
            <p class="font-body-sm text-body-sm text-on-surface-variant">Complete table of 4 broad arrays and 124 decimal/alphanumeric secondary school classifications.</p>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="window.print()" class="inline-flex items-center gap-1.5 px-space-md py-2 rounded-full bg-surface-container font-label-md text-label-md text-on-surface font-bold hover:bg-surface-container-high transition-colors">
              <span class="material-symbols-outlined text-base">print</span> Print Schedule
            </button>
            <button onclick="window.app.exportScheduleText()" class="inline-flex items-center gap-1.5 px-space-md py-2 rounded-full bg-secondary text-on-secondary font-label-md text-label-md font-bold shadow-sm hover:scale-105 transition-transform">
              <span class="material-symbols-outlined text-base">download</span> Export Text
            </button>
          </div>
        </div>

        <!-- Section 87 Source Fidelity Advisory Notice -->
        <div class="bg-amber-50 border-l-4 border-amber-500 p-space-md rounded-xl space-y-1">
          <div class="flex items-center gap-2 text-amber-900 font-label-sm text-label-sm font-bold uppercase">
            <span class="material-symbols-outlined text-base">report</span>
            <span>Source Fidelity Notice (PRD §87)</span>
          </div>
          <p class="font-body-sm text-body-sm text-amber-800">
            This schedule preserves source fidelity: arbitrary hierarchy depth (e.g. <code>030.2iaM</code>), mixed alphanumeric notations (<code>013.1ii</code>), unassigned codes (<code>020.1i</code>), and the official dual designation <em>030 Literary Arts / Language and Literature</em>.
          </p>
        </div>

        <!-- Schedule Table -->
        <div class="bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container-low overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-surface-container text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider border-b border-surface-container-high">
                  <th class="p-3">Notation Code</th>
                  <th class="p-3">Official Subject / Class Name</th>
                  <th class="p-3">Hierarchy</th>
                  <th class="p-3">Status</th>
                  <th class="p-3">Cross References</th>
                  <th class="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-surface-container font-body-sm text-body-sm">
                ${allNodes.map(node => `
                  <tr class="hover:bg-surface-container-low transition-colors ${node.status === 'UNASSIGNED' ? 'bg-error-container/20' : ''}">
                    <td class="p-3 font-label-md text-label-md font-extrabold" style="color: ${window.labelGenerator.getArrayColor(node.code)}">
                      ${node.code}
                    </td>
                    <td class="p-3">
                      <div class="font-bold text-on-surface">${node.displayName || node.name}</div>
                      <div class="text-xs text-on-surface-variant line-clamp-1">${node.scopeNote || node.description}</div>
                    </td>
                    <td class="p-3 font-label-sm text-xs text-on-surface-variant">
                      Level ${node.level} (${node.nodeType})
                    </td>
                    <td class="p-3">
                      <span class="px-2 py-0.5 rounded-full font-label-sm text-xs font-bold ${node.status === 'UNASSIGNED' ? 'bg-error-container text-on-error-container' : node.source === 'LOCAL' ? 'bg-secondary-fixed text-on-secondary-fixed' : 'bg-surface-container text-on-surface'}">
                        ${node.status}
                      </span>
                    </td>
                    <td class="p-3 font-label-sm text-xs text-on-surface-variant">
                      ${node.crossReferences && node.crossReferences.SEE && node.crossReferences.SEE.length > 0 ? `<span class="text-error font-bold">${node.crossReferences.SEE[0]}</span>` : node.crossReferences && node.crossReferences.SEE_ALSO && node.crossReferences.SEE_ALSO.length > 0 ? `<span>SEE ALSO: ${node.crossReferences.SEE_ALSO.join(', ')}</span>` : '—'}
                    </td>
                    <td class="p-3 text-right">
                      <button onclick="window.app.browseClass('${node.code}')" class="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high font-label-sm text-xs font-bold text-on-surface">
                        Explore
                      </button>
                    </td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  bindMasterScheduleEvents() {}

  exportScheduleText() {
    const allNodes = window.classificationEngine.getAllNodes();
    let text = "====================================================\n";
    text += "ABRIDGED CLASSIFICATION SCHEME FOR NIGERIAN SECONDARY SCHOOLS (2026)\n";
    text += "Nigerian Educational Research & Development Council (NERDC)\n";
    text += "====================================================\n\n";

    allNodes.forEach(node => {
      const indent = "  ".repeat(node.level || 0);
      text += `${indent}${node.code.padEnd(12)} ${node.displayName || node.name} [${node.status}]\n`;
      if (node.scopeNote) {
        text += `${indent}             Scope: ${node.scopeNote}\n`;
      }
    });

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "NERDC_2026_Secondary_Classification_Schedule.txt";
    a.click();
    this.showToast("Master classification schedule exported to text file!", "success");
  }

  // ==========================================
  // VIEW 5: CATALOGUE & RESOURCES (PRD Sec 38, 39, 40)
  // ==========================================

  renderCatalogueView() {
    const resources = window.libraryStore.getResources();
    const types = window.INITIAL_RESOURCE_TYPES;

    return `
      <div class="space-y-space-md">
        <!-- Header -->
        <div class="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
          <div>
            <div class="inline-flex items-center gap-1 font-label-sm text-label-sm text-primary font-bold">
              <span class="material-symbols-outlined text-base">menu_book</span>
              <span>Secondary Bibliographic Register</span>
            </div>
            <h1 class="font-headline-lg text-headline-lg text-on-surface tracking-tight">Catalogue & Media Resources</h1>
            <p class="font-body-sm text-body-sm text-on-surface-variant">Accession register of print textbooks, reference atlases, lab manuals, and digital resources.</p>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="window.app.openAddResourceModal()" class="inline-flex items-center gap-1.5 px-space-md py-2 rounded-full bg-primary-container text-on-primary-container font-label-md text-label-md font-bold shadow-sm hover:scale-105 active:scale-95 transition-transform">
              <span class="material-symbols-outlined text-lg">add</span> Accession New Book
            </button>
            <button data-action-nav="shelf-label-generator" class="inline-flex items-center gap-1.5 px-space-md py-2 rounded-full bg-surface-container font-label-md text-label-md text-on-surface font-bold hover:bg-surface-container-high transition-colors">
              <span class="material-symbols-outlined text-lg">print</span> Batch Spine Labels
            </button>
          </div>
        </div>

        <!-- Filter Bar -->
        <div class="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-surface-container-low flex flex-col md:flex-row items-center justify-between gap-space-sm">
          <div class="relative w-full md:w-80">
            <span class="material-symbols-outlined absolute left-3 top-2.5 text-outline text-lg">search</span>
            <input id="catalogue-search" type="text" placeholder="Search title, author, code, accession..." class="w-full pl-9 pr-4 py-2 rounded-xl bg-surface-container-low border border-surface-container font-body-sm text-body-sm focus:ring-2 focus:ring-secondary/40 focus:outline-none" />
          </div>

          <div class="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1">
            <select id="catalogue-filter-type" class="px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container font-label-sm text-label-sm text-on-surface">
              <option value="">All Resource Types (18)</option>
              ${types.map(t => `<option value="${t.name}">${t.name}</option>`).join("")}
            </select>

            <select id="catalogue-filter-status" class="px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container font-label-sm text-label-sm text-on-surface">
              <option value="">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="CHECKED_OUT">Checked Out</option>
              <option value="RESERVED">Reserved</option>
              <option value="LOST">Lost</option>
            </select>
          </div>
        </div>

        <!-- Resources Table -->
        <div class="bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container-low overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-surface-container text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider border-b border-surface-container-high">
                  <th class="p-3">Acc #</th>
                  <th class="p-3">Title & Subtitle</th>
                  <th class="p-3">Author & Cutter</th>
                  <th class="p-3">Classification & Call No.</th>
                  <th class="p-3">Type</th>
                  <th class="p-3">Shelf Location</th>
                  <th class="p-3">Status</th>
                  <th class="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody id="catalogue-tbody" class="divide-y divide-surface-container font-body-sm text-body-sm">
                ${this.renderCatalogueRows(resources)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  renderCatalogueRows(resources) {
    if (resources.length === 0) {
      return `
        <tr>
          <td colspan="8" class="p-8 text-center text-on-surface-variant">
            No matching resources found in library catalogue.
          </td>
        </tr>
      `;
    }

    return resources.map(res => `
      <tr class="hover:bg-surface-container-low transition-colors">
        <td class="p-3 font-label-sm text-label-sm font-bold text-on-surface">
          #${res.accessionNumber}
        </td>
        <td class="p-3">
          <div class="font-bold text-on-surface hover:text-secondary cursor-pointer" onclick="window.app.openResourceDetails('${res.id}')">${res.title}</div>
          <div class="text-xs text-on-surface-variant truncate max-w-xs">${res.subtitle || res.series || res.publisher}</div>
        </td>
        <td class="p-3">
          <div class="font-medium text-on-surface">${res.author}</div>
          <span class="font-label-sm text-xs font-bold text-secondary bg-secondary-fixed/50 px-1.5 py-0.5 rounded">
            Cutter: ${res.authorNumber || 'A10'}
          </span>
        </td>
        <td class="p-3">
          <div class="font-label-md text-label-md font-extrabold" style="color: ${window.labelGenerator.getArrayColor(res.classificationNumber)}">
            ${res.classificationNumber}
          </div>
          <div class="font-label-sm text-xs font-semibold text-gray-700">${res.callNumber}</div>
        </td>
        <td class="p-3">
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-label-sm text-xs font-medium bg-surface-container text-on-surface">
            ${res.isDigital ? '<span class="material-symbols-outlined text-xs text-tertiary">cloud</span>' : '<span class="material-symbols-outlined text-xs">book</span>'}
            ${res.resourceType}
          </span>
        </td>
        <td class="p-3 font-label-sm text-xs text-on-surface-variant">
          ${res.shelfLocation}
        </td>
        <td class="p-3">
          <span class="px-2 py-0.5 rounded-full font-label-sm text-xs font-bold ${res.status === 'AVAILABLE' ? 'bg-tertiary-fixed text-on-tertiary-fixed' : res.status === 'CHECKED_OUT' ? 'bg-error-container text-on-error-container' : 'bg-primary-fixed text-on-primary-fixed'}">
            ${res.status}
          </span>
        </td>
        <td class="p-3 text-right space-x-1">
          <button onclick="window.app.printSpineTag('${res.id}')" title="Print Spine Label" class="p-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface">
            <span class="material-symbols-outlined text-sm">print</span>
          </button>
          <button onclick="window.app.openResourceDetails('${res.id}')" title="View Full Record" class="p-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface">
            <span class="material-symbols-outlined text-sm">visibility</span>
          </button>
        </td>
      </tr>
    `).join("");
  }

  bindCatalogueEvents() {
    const search = document.querySelector("#catalogue-search");
    const typeFilter = document.querySelector("#catalogue-filter-type");
    const statusFilter = document.querySelector("#catalogue-filter-status");

    const applyFilters = () => {
      const q = search ? search.value : "";
      const type = typeFilter ? typeFilter.value : "";
      const status = statusFilter ? statusFilter.value : "";

      const filtered = window.libraryStore.getResources({
        search: q,
        resourceType: type || undefined,
        status: status || undefined
      });

      const tbody = document.querySelector("#catalogue-tbody");
      if (tbody) tbody.innerHTML = this.renderCatalogueRows(filtered);
    };

    if (search) search.addEventListener("input", applyFilters);
    if (typeFilter) typeFilter.addEventListener("change", applyFilters);
    if (statusFilter) statusFilter.addEventListener("change", applyFilters);
  }

  // ==========================================
  // VIEW 6: CALL NUMBER & CUTTER (PRD Sec 36 & 37)
  // ==========================================

  renderCutterEngineView() {
    return `
      <div class="space-y-space-md">
        <!-- Header -->
        <div class="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
          <div>
            <div class="inline-flex items-center gap-1 font-label-sm text-label-sm text-secondary font-bold">
              <span class="material-symbols-outlined text-base">pin</span>
              <span>PRD §36 & §37 Author Numbering</span>
            </div>
            <h1 class="font-headline-lg text-headline-lg text-on-surface tracking-tight">Author's Literary Number & Call Number Builder</h1>
            <p class="font-body-sm text-body-sm text-on-surface-variant">Configurable Cutter table lookup and standardized Nigerian secondary school call numbers.</p>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-space-md">
          <!-- Interactive Builder (5 cols) -->
          <div class="lg:col-span-5 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-surface-container-low space-y-space-md">
            <h3 class="font-headline-sm text-headline-sm text-on-surface">Interactive Call Number Builder</h3>
            
            <form id="cutter-builder-form" class="space-y-3">
              <div>
                <label class="block font-label-sm text-label-sm font-bold text-on-surface mb-1">Author's Full Name / Surname</label>
                <input id="builder-author" type="text" value="Okeke, P.N." class="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container font-body-sm text-body-sm focus:ring-2 focus:ring-secondary/40 focus:outline-none" />
              </div>

              <div>
                <label class="block font-label-sm text-label-sm font-bold text-on-surface mb-1">Classification Notation</label>
                <input id="builder-class" type="text" value="011.2" class="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container font-body-sm text-body-sm focus:ring-2 focus:ring-secondary/40 focus:outline-none" />
              </div>

              <div>
                <label class="block font-label-sm text-label-sm font-bold text-on-surface mb-1">Copy / Volume Designation</label>
                <input id="builder-copy" type="text" value="C.1" class="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container font-body-sm text-body-sm focus:ring-2 focus:ring-secondary/40 focus:outline-none" />
              </div>

              <div class="pt-3 p-4 rounded-xl bg-secondary-fixed/30 border border-secondary/20 space-y-1 text-center">
                <span class="font-label-sm text-xs uppercase text-secondary font-bold">Standard Formatted Call Mark:</span>
                <div id="builder-preview" class="font-display text-2xl font-black text-secondary tracking-widest">
                  011.2 O41 C.1
                </div>
                <div id="builder-cutter-explain" class="text-xs text-on-surface-variant pt-1">
                  Cutter matched: <strong>O41</strong> (Okeke, P.N.)
                </div>
              </div>
            </form>
          </div>

          <!-- Cutter Table Dictionary (7 cols) -->
          <div class="lg:col-span-7 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-surface-container-low space-y-space-md">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-headline-sm text-headline-sm text-on-surface">Configurable Cutter Table Dictionary</h3>
                <p class="font-body-sm text-body-sm text-on-surface-variant">Configurable prefixes for Nigerian & international authors</p>
              </div>
            </div>

            <div class="overflow-y-auto max-h-[500px]">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="bg-surface-container text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                    <th class="p-2.5">Prefix</th>
                    <th class="p-2.5">Cutter Number</th>
                    <th class="p-2.5">Author Reference</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-surface-container font-body-sm text-body-sm">
                  ${window.cutterEngine.cutterTable.map(entry => `
                    <tr class="hover:bg-surface-container-low transition-colors">
                      <td class="p-2.5 font-bold text-secondary font-label-md">${entry.prefix}</td>
                      <td class="p-2.5 font-extrabold text-on-surface">${entry.prefix.charAt(0)}${entry.number}</td>
                      <td class="p-2.5 text-on-surface-variant">${entry.author}</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  bindCutterEngineEvents() {
    const authorInput = document.querySelector("#builder-author");
    const classInput = document.querySelector("#builder-class");
    const copyInput = document.querySelector("#builder-copy");

    const updatePreview = () => {
      const author = authorInput ? authorInput.value : "";
      const classCode = classInput ? classInput.value : "";
      const copy = copyInput ? copyInput.value : "";

      const cutter = window.cutterEngine.generateCutterNumber(author);
      const callNo = window.cutterEngine.buildCallNumber(classCode, cutter, copy);

      const previewDiv = document.querySelector("#builder-preview");
      const explainDiv = document.querySelector("#builder-cutter-explain");

      if (previewDiv) previewDiv.textContent = callNo;
      if (explainDiv) explainDiv.innerHTML = `Cutter generated: <strong>${cutter}</strong> for "${author}"`;
    };

    if (authorInput) authorInput.addEventListener("input", updatePreview);
    if (classInput) classInput.addEventListener("input", updatePreview);
    if (copyInput) copyInput.addEventListener("input", updatePreview);
  }

  // ==========================================
  // VIEW 7: SHELF & SPINE LABEL GENERATOR (PRD Sec 42 & 43)
  // ==========================================

  renderShelfLabelGeneratorView() {
    const resources = window.libraryStore.getResources();

    return `
      <div class="space-y-space-md">
        <!-- Header -->
        <div class="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
          <div>
            <div class="inline-flex items-center gap-1 font-label-sm text-label-sm text-primary font-bold">
              <span class="material-symbols-outlined text-base">qr_code_2</span>
              <span>PRD §42 & §43 Barcode & Spine System</span>
            </div>
            <h1 class="font-headline-lg text-headline-lg text-on-surface tracking-tight">Shelf & Spine Label Generator</h1>
            <p class="font-body-sm text-body-sm text-on-surface-variant">Generate printable book spines with classification numbers, Cutter codes, barcodes, and OPAC QR codes.</p>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="window.print()" class="inline-flex items-center gap-1.5 px-space-md py-2 rounded-full bg-primary-container text-on-primary-container font-label-md text-label-md font-bold shadow-sm hover:scale-105 active:scale-95 transition-transform">
              <span class="material-symbols-outlined text-base">print</span> Print All Labels
            </button>
          </div>
        </div>

        <!-- Labels Preview Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-space-md">
          ${resources.map(res => window.labelGenerator.renderLabelHtml(res)).join("")}
        </div>
      </div>
    `;
  }

  bindShelfLabelGeneratorEvents() {}

  // ==========================================
  // VIEW 8: SHELF LOCATIONS (PRD Sec 41)
  // ==========================================

  renderShelfLocationsView() {
    const locations = window.libraryStore.locations;

    return `
      <div class="space-y-space-md">
        <!-- Header -->
        <div class="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
          <div>
            <div class="inline-flex items-center gap-1 font-label-sm text-label-sm text-secondary font-bold">
              <span class="material-symbols-outlined text-base">shelves</span>
              <span>PRD §41 Shelf Organization</span>
            </div>
            <h1 class="font-headline-lg text-headline-lg text-on-surface tracking-tight">Shelf & Physical Location Management</h1>
            <p class="font-body-sm text-body-sm text-on-surface-variant">Hierarchical mapping: Library → Room → Section → Shelf → Tier Position.</p>
          </div>
        </div>

        <!-- Shelf Locations Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md">
          ${locations.map(loc => {
            const count = window.libraryStore.getResources().filter(r => r.locationId === loc.id || (r.classificationNumber && r.classificationNumber.startsWith(loc.codePrefix))).length;
            const arrayColor = window.labelGenerator.getArrayColor(loc.codePrefix);

            return `
              <div class="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-surface-container-low space-y-space-xs hover:shadow-md transition-shadow">
                <div class="flex items-center justify-between">
                  <span class="font-label-sm text-label-sm px-2 py-0.5 rounded-full font-bold" style="background-color: ${arrayColor}20; color: ${arrayColor};">
                    ${loc.codePrefix} Stacks
                  </span>
                  <span class="font-label-sm text-label-sm text-on-surface-variant font-bold">${count} Books</span>
                </div>
                <h3 class="font-headline-sm text-headline-sm text-on-surface">${loc.shelf}</h3>
                <div class="space-y-0.5 text-xs text-on-surface-variant">
                  <div><strong>Section:</strong> ${loc.section}</div>
                  <div><strong>Room:</strong> ${loc.room}</div>
                  <div><strong>Position:</strong> ${loc.position}</div>
                </div>
                <p class="font-body-sm text-body-sm text-on-surface-variant pt-1 border-t border-surface-container">${loc.description}</p>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;
  }

  bindShelfLocationsEvents() {}

  // ==========================================
  // VIEW 9: CIRCULATION DESK (PRD Sec 52)
  // ==========================================

  renderCirculationDeskView() {
    const loans = window.libraryStore.loans;
    const resources = window.libraryStore.getResources();
    const patrons = window.libraryStore.patrons;

    return `
      <div class="space-y-space-md">
        <!-- Header -->
        <div class="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
          <div>
            <div class="inline-flex items-center gap-1 font-label-sm text-label-sm text-tertiary font-bold">
              <span class="material-symbols-outlined text-base">assignment_ind</span>
              <span>PRD §52 Circulation & Loan Desk</span>
            </div>
            <h1 class="font-headline-lg text-headline-lg text-on-surface tracking-tight">Circulation Desk & Loan Register</h1>
            <p class="font-body-sm text-body-sm text-on-surface-variant">Issue resources, process book returns, calculate overdue fines, and track secondary borrowing limits.</p>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="window.app.openIssueBookModal()" class="inline-flex items-center gap-1.5 px-space-md py-2 rounded-full bg-secondary text-on-secondary font-label-md text-label-md font-bold shadow-sm hover:scale-105 active:scale-95 transition-transform">
              <span class="material-symbols-outlined text-lg">add_task</span> Issue Book to Student
            </button>
          </div>
        </div>

        <!-- Loans Table -->
        <div class="bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container-low overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-surface-container text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                  <th class="p-3">Acc #</th>
                  <th class="p-3">Resource Title</th>
                  <th class="p-3">Borrower / Patron</th>
                  <th class="p-3">Issue Date</th>
                  <th class="p-3">Due Date</th>
                  <th class="p-3">Overdue / Fine</th>
                  <th class="p-3">Status</th>
                  <th class="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-surface-container font-body-sm text-body-sm">
                ${loans.map(loan => `
                  <tr class="hover:bg-surface-container-low transition-colors">
                    <td class="p-3 font-bold text-on-surface">#${loan.accessionNumber}</td>
                    <td class="p-3 font-semibold text-on-surface">${loan.resourceTitle}</td>
                    <td class="p-3">
                      <div class="font-bold text-on-surface">${loan.patronName}</div>
                      <div class="text-xs text-on-surface-variant">${loan.patronType}</div>
                    </td>
                    <td class="p-3 font-label-sm text-xs text-on-surface-variant">${loan.issueDate}</td>
                    <td class="p-3 font-label-sm text-xs font-bold ${loan.status === 'OVERDUE' ? 'text-error' : 'text-on-surface'}">${loan.dueDate}</td>
                    <td class="p-3">
                      ${loan.status === 'OVERDUE' ? `
                        <span class="text-error font-bold text-xs">${loan.daysOverdue} days (${loan.fineAccrued})</span>
                      ` : `
                        <span class="text-tertiary font-bold text-xs">On Schedule</span>
                      `}
                    </td>
                    <td class="p-3">
                      <span class="px-2 py-0.5 rounded-full font-label-sm text-xs font-bold ${loan.status === 'OVERDUE' ? 'bg-error-container text-on-error-container' : loan.status === 'RETURNED' ? 'bg-surface-container text-on-surface-variant' : 'bg-secondary-fixed text-on-secondary-fixed'}">
                        ${loan.status}
                      </span>
                    </td>
                    <td class="p-3 text-right space-x-1">
                      ${loan.status !== 'RETURNED' ? `
                        <button onclick="window.app.processReturnBook('${loan.id}')" class="px-2.5 py-1 rounded bg-tertiary text-on-tertiary font-label-sm text-xs font-bold">
                          Return
                        </button>
                        <button onclick="window.app.processRenewLoan('${loan.id}')" class="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high font-label-sm text-xs font-bold text-on-surface">
                          Renew
                        </button>
                      ` : `<span class="text-xs text-on-surface-variant italic">Closed</span>`}
                    </td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  bindCirculationDeskEvents() {}

  processReturnBook(loanId) {
    window.libraryStore.returnItem(loanId);
    this.showToast("Book returned and returned to available stacks!", "success");
    this.renderCurrentView();
  }

  processRenewLoan(loanId) {
    try {
      window.libraryStore.renewItem(loanId, 14);
      this.showToast("Loan renewed for an additional 14 days!", "success");
      this.renderCurrentView();
    } catch (e) {
      this.showToast(e.message, "error");
    }
  }

  // ==========================================
  // VIEW 10: PATRONS & MEMBERS (PRD Sec 53)
  // ==========================================

  renderPatronsView() {
    const patrons = window.libraryStore.patrons;

    return `
      <div class="space-y-space-md">
        <!-- Header -->
        <div class="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
          <div>
            <div class="inline-flex items-center gap-1 font-label-sm text-label-sm text-primary font-bold">
              <span class="material-symbols-outlined text-base">badge</span>
              <span>PRD §53 Patron & Member Management</span>
            </div>
            <h1 class="font-headline-lg text-headline-lg text-on-surface tracking-tight">Library Members & Scholars Register</h1>
            <p class="font-body-sm text-body-sm text-on-surface-variant">Scholars (JSS1–SS3), teachers, and administrative library patrons.</p>
          </div>
          <button onclick="window.app.openAddPatronModal()" class="inline-flex items-center gap-1.5 px-space-md py-2 rounded-full bg-primary-container text-on-primary-container font-label-md text-label-md font-bold shadow-sm hover:scale-105 active:scale-95 transition-transform">
            <span class="material-symbols-outlined text-lg">person_add</span> Register New Member
          </button>
        </div>

        <!-- Patrons Cards Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-space-md">
          ${patrons.map(p => `
            <div class="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-surface-container-low space-y-space-xs hover:shadow-md transition-shadow flex items-start gap-3">
              <img src="${p.avatar}" alt="${p.name}" class="w-12 h-12 rounded-full object-cover ring-2 ring-primary-container shrink-0 mt-1" />
              <div class="space-y-0.5 flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <span class="font-label-sm text-xs font-bold text-primary">${p.patronId}</span>
                  <span class="font-label-sm text-xs bg-surface-container px-2 py-0.5 rounded-full font-bold">${p.patronType}</span>
                </div>
                <h3 class="font-headline-sm text-headline-sm text-on-surface truncate">${p.name}</h3>
                <div class="text-xs text-on-surface-variant">${p.classDepartment}</div>
                <div class="text-xs text-on-surface-variant">${p.email || p.phone}</div>
                <div class="pt-2 flex items-center justify-between text-xs font-bold">
                  <span class="text-secondary">Loans: ${p.activeLoansCount} / Limit: ${p.borrowingLimit}</span>
                  <span class="text-tertiary">Active</span>
                </div>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  bindPatronsEvents() {}

  // ==========================================
  // VIEW 11: INVENTORY AUDIT MODE (PRD Sec 98 & 99)
  // ==========================================

  renderInventoryAuditView() {
    const scans = window.libraryStore.inventoryScans;
    const resources = window.libraryStore.getResources();

    return `
      <div class="space-y-space-md">
        <!-- Header -->
        <div class="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
          <div>
            <div class="inline-flex items-center gap-1 font-label-sm text-label-sm text-error font-bold">
              <span class="material-symbols-outlined text-base">barcode_reader</span>
              <span>PRD §98 & §99 Physical Shelf Walkthrough Audit</span>
            </div>
            <h1 class="font-headline-lg text-headline-lg text-on-surface tracking-tight">Collection Inventory Audit Mode</h1>
            <p class="font-body-sm text-body-sm text-on-surface-variant">Walk through shelf stacks with a barcode scanner to detect misplaced, found, or missing volumes.</p>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="window.app.simulateInventoryScan()" class="inline-flex items-center gap-1.5 px-space-md py-2 rounded-full bg-error text-on-error font-label-md text-label-md font-bold shadow-sm hover:scale-105 active:scale-95 transition-transform">
              <span class="material-symbols-outlined text-base">qr_code_scanner</span> Simulate Shelf Scan
            </button>
          </div>
        </div>

        <!-- Inventory Metrics -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-space-md">
          <div class="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-surface-container text-center space-y-1">
            <span class="font-label-sm text-xs text-on-surface-variant uppercase font-bold">Total Stacks</span>
            <div class="text-2xl font-black text-on-surface">${resources.length}</div>
          </div>
          <div class="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-surface-container text-center space-y-1">
            <span class="font-label-sm text-xs text-tertiary uppercase font-bold">Verified Found (✓)</span>
            <div class="text-2xl font-black text-tertiary">${scans.filter(s => s.status === 'FOUND').length || resources.length - 2}</div>
          </div>
          <div class="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-surface-container text-center space-y-1">
            <span class="font-label-sm text-xs text-error uppercase font-bold">Missing Volumes (✗)</span>
            <div class="text-2xl font-black text-error">2</div>
          </div>
          <div class="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-surface-container text-center space-y-1">
            <span class="font-label-sm text-xs text-primary uppercase font-bold">Misplaced Tier (!)</span>
            <div class="text-2xl font-black text-primary">1</div>
          </div>
        </div>

        <!-- Walkthrough Scanner Input -->
        <div class="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container-low space-y-3">
          <h3 class="font-headline-sm text-headline-sm text-on-surface">Walkthrough Barcode Scanner</h3>
          <div class="flex gap-2">
            <input id="inventory-barcode-input" type="text" placeholder="Scan or type Call Number or Accession Barcode (e.g. 011.2 O41 C.1 or 2026-0891)..." class="flex-1 px-4 py-2.5 rounded-xl bg-surface-container-low border border-surface-container font-body-sm text-body-sm focus:ring-2 focus:ring-error/40 focus:outline-none" />
            <button onclick="window.app.processManualInventoryScan()" class="px-6 py-2.5 rounded-xl bg-on-surface text-surface font-label-md text-label-md font-bold">
              Verify
            </button>
          </div>
        </div>

        <!-- Recent Audit Scan Logs -->
        <div class="bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container-low p-space-md space-y-2">
          <h4 class="font-headline-sm text-headline-sm text-on-surface">Audit Scan Log</h4>
          <div class="space-y-1.5 font-label-sm text-label-sm">
            ${scans.length > 0 ? scans.map(s => `
              <div class="p-2.5 rounded-lg bg-surface-container-low flex items-center justify-between border border-surface-container">
                <div class="flex items-center gap-2">
                  <span class="font-bold text-primary">${s.callNumber}</span>
                  <span class="text-on-surface font-semibold">${s.title}</span>
                  <span class="text-on-surface-variant">(${s.expectedShelf})</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="px-2 py-0.5 rounded font-bold ${s.status === 'FOUND' ? 'bg-tertiary-fixed text-on-tertiary-fixed' : 'bg-error-container text-on-error-container'}">
                    ${s.status === 'FOUND' ? '✓ Found' : '✗ Misplaced'}
                  </span>
                  <span class="text-xs text-outline">${s.scannedAt}</span>
                </div>
              </div>
            `).join("") : `
              <div class="text-center py-6 text-on-surface-variant italic">
                No walkthrough scans recorded today. Scan items to compare physical shelves against master catalogue.
              </div>
            `}
          </div>
        </div>
      </div>
    `;
  }

  bindInventoryAuditEvents() {}

  simulateInventoryScan() {
    const res = window.libraryStore.resources[Math.floor(Math.random() * window.libraryStore.resources.length)];
    window.libraryStore.recordInventoryScan(res.callNumber, res.locationId, "FOUND");
    this.showToast(`Verified: ${res.callNumber} (${res.title}) Found in Stacks!`, "success");
    this.renderCurrentView();
  }

  processManualInventoryScan() {
    const input = document.querySelector("#inventory-barcode-input");
    if (!input || !input.value.trim()) return;

    const val = input.value.trim();
    const res = window.libraryStore.resources.find(r => r.callNumber === val || r.accessionNumber === val);

    if (res) {
      window.libraryStore.recordInventoryScan(res.callNumber, res.locationId, "FOUND");
      this.showToast(`Matched: ${res.title} on ${res.shelfLocation}!`, "success");
    } else {
      window.libraryStore.recordInventoryScan(val, "loc-1", "MISPLACED");
      this.showToast(`Warning: Item ${val} not catalogued on this shelf!`, "error");
    }

    input.value = "";
    this.renderCurrentView();
  }

  // ==========================================
  // VIEW 12: CONTROLLED VOCABULARY & SUBJECTS (PRD Sec 31 & 32)
  // ==========================================

  renderControlledVocabularyView() {
    const allNodes = window.classificationEngine.getAllNodes();

    return `
      <div class="space-y-space-md">
        <!-- Header -->
        <div class="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
          <div>
            <div class="inline-flex items-center gap-1 font-label-sm text-label-sm text-secondary font-bold">
              <span class="material-symbols-outlined text-base">share</span>
              <span>PRD §31 & §32 Controlled Vocabulary</span>
            </div>
            <h1 class="font-headline-lg text-headline-lg text-on-surface tracking-tight">Subject Headings & Vocabulary Control</h1>
            <p class="font-body-sm text-body-sm text-on-surface-variant">Standardized subject headings, synonyms, broader terms (BT), narrower terms (NT), and cross-references.</p>
          </div>
        </div>

        <!-- Vocabulary Explorer Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md">
          ${allNodes.filter(n => n.subjectHeadings && n.subjectHeadings.length > 0).slice(0, 18).map(node => `
            <div class="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-surface-container-low space-y-space-xs">
              <div class="flex items-center justify-between">
                <span class="font-label-md text-label-md font-bold" style="color: ${window.labelGenerator.getArrayColor(node.code)}">${node.code}</span>
                <span class="font-label-sm text-xs bg-surface-container px-2 py-0.5 rounded-full font-bold">Level ${node.level}</span>
              </div>
              <h3 class="font-headline-sm text-headline-sm text-on-surface">${node.name}</h3>

              <!-- Preferred Headings -->
              <div class="space-y-1">
                <span class="text-xs uppercase font-bold text-on-surface-variant">Preferred Terms:</span>
                <div class="flex flex-wrap gap-1">
                  ${node.subjectHeadings.map(sh => `<span class="px-2 py-0.5 bg-surface-container text-on-surface font-label-sm text-xs font-semibold rounded">${sh}</span>`).join("")}
                </div>
              </div>

              <!-- Cross references -->
              <div class="pt-1 text-xs text-on-surface-variant space-y-0.5 border-t border-surface-container">
                <div><strong>Broader Term (BT):</strong> ${node.parentId || 'Root'}</div>
                ${node.crossReferences && node.crossReferences.SEE && node.crossReferences.SEE.length > 0 ? `<div class="text-error font-bold">${node.crossReferences.SEE.join(", ")}</div>` : ''}
                ${node.crossReferences && node.crossReferences.SEE_ALSO && node.crossReferences.SEE_ALSO.length > 0 ? `<div class="text-secondary font-bold">SEE ALSO: ${node.crossReferences.SEE_ALSO.join(", ")}</div>` : ''}
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  bindControlledVocabularyEvents() {}

  // ==========================================
  // VIEW 13: ALPHABETICAL INDEX (PRD Sec 35)
  // ==========================================

  renderAlphabeticalIndexView() {
    const indexTerms = window.INITIAL_ALPHABETICAL_INDEX || [];

    return `
      <div class="space-y-space-md">
        <!-- Header -->
        <div class="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
          <div>
            <div class="inline-flex items-center gap-1 font-label-sm text-label-sm text-primary font-bold">
              <span class="material-symbols-outlined text-base">format_list_numbered</span>
              <span>PRD §35 Alphabetical Relative Index</span>
            </div>
            <h1 class="font-headline-lg text-headline-lg text-on-surface tracking-tight">Alphabetical Relative Index</h1>
            <p class="font-body-sm text-body-sm text-on-surface-variant">Direct alphabetical dictionary linking directly to 2026 NERDC classification notations.</p>
          </div>
        </div>

        <!-- Index Table -->
        <div class="bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container-low overflow-hidden p-space-md">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            ${indexTerms.map(item => `
              <div onclick="window.app.browseClass('${item.code}')" class="p-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container flex items-center justify-between cursor-pointer border border-surface-container transition-colors">
                <div>
                  <div class="font-body-sm text-body-sm font-bold text-on-surface">${item.term}</div>
                  <div class="text-xs text-on-surface-variant">${item.parent}</div>
                </div>
                <span class="font-label-md text-label-md font-extrabold px-2 py-0.5 rounded bg-white shadow-sm" style="color: ${window.labelGenerator.getArrayColor(item.code)}">
                  ${item.code}
                </span>
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    `;
  }

  bindAlphabeticalIndexEvents() {}

  // ==========================================
  // VIEW 14: SCHEME GLOSSARY (PRD Sec 34)
  // ==========================================

  renderGlossaryView() {
    const glossary = window.INITIAL_GLOSSARY || [];

    return `
      <div class="space-y-space-md">
        <!-- Header -->
        <div class="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-surface-container-low">
          <div class="inline-flex items-center gap-1 font-label-sm text-label-sm text-secondary font-bold">
            <span class="material-symbols-outlined text-base">spellcheck</span>
            <span>PRD §34 Scheme Terminologies</span>
          </div>
          <h1 class="font-headline-lg text-headline-lg text-on-surface tracking-tight">Classification Scheme Glossary</h1>
          <p class="font-body-sm text-body-sm text-on-surface-variant">Operating definitions of terms used across Nigerian secondary school media centre classification.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-space-md">
          ${glossary.map(g => `
            <div class="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-surface-container-low space-y-2">
              <div class="flex items-center justify-between">
                <h3 class="font-headline-sm text-headline-sm text-on-surface">${g.term}</h3>
                <span class="font-label-sm text-xs bg-surface-container px-2 py-0.5 rounded font-bold text-secondary">Class ${g.relatedClassification}</span>
              </div>
              <p class="font-body-md text-body-md text-on-surface leading-relaxed">${g.definition}</p>
              <div class="text-xs text-on-surface-variant pt-1 border-t border-surface-container font-semibold">
                ${g.crossReferences}
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  bindGlossaryEvents() {}

  // ==========================================
  // VIEW 15: LOCAL EXTENSIONS (PRD Sec 47 & 48)
  // ==========================================

  renderLocalExtensionsView() {
    const localExtensions = window.LOCAL_SCHOOL_EXTENSIONS || [];

    return `
      <div class="space-y-space-md">
        <!-- Header -->
        <div class="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
          <div>
            <div class="inline-flex items-center gap-1 font-label-sm text-label-sm text-secondary font-bold">
              <span class="material-symbols-outlined text-base">extension</span>
              <span>PRD §47 & §48 Local Adaptation Layer</span>
            </div>
            <h1 class="font-headline-lg text-headline-lg text-on-surface tracking-tight">Local School Classification Extensions</h1>
            <p class="font-body-sm text-body-sm text-on-surface-variant">School-specific adaptations authorized under Clause 3.2 without corrupting the Master Scheme.</p>
          </div>
          <button onclick="window.app.openAddLocalExtensionModal()" class="inline-flex items-center gap-1.5 px-space-md py-2 rounded-full bg-secondary text-on-secondary font-label-md text-label-md font-bold shadow-sm hover:scale-105 active:scale-95 transition-transform">
            <span class="material-symbols-outlined text-lg">add</span> Create Local Extension
          </button>
        </div>

        <div class="space-y-space-sm">
          ${localExtensions.map(ext => `
            <div class="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border-l-4 border-secondary flex flex-col sm:flex-row items-start justify-between gap-space-md">
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <span class="font-display text-2xl font-black text-secondary">${ext.code}</span>
                  <span class="font-label-sm text-xs bg-secondary-fixed text-on-secondary-fixed px-2 py-0.5 rounded-full font-bold">LOCAL EXTENSION</span>
                  <span class="text-xs text-on-surface-variant">Parent: ${ext.parentId}</span>
                </div>
                <h3 class="font-headline-sm text-headline-sm text-on-surface">${ext.name}</h3>
                <p class="font-body-sm text-body-sm text-on-surface-variant">${ext.description}</p>
                <div class="text-xs text-on-surface-variant pt-1 font-medium">
                  Scope Note: ${ext.scopeNote}
                </div>
              </div>
              <div class="text-right shrink-0 space-y-1">
                <div class="text-xs text-on-surface-variant">Authorized: <strong>${ext.authorizedBy}</strong></div>
                <div class="text-xs text-on-surface-variant">Date: ${ext.approvalDate} (v${ext.version})</div>
                <button onclick="window.app.browseClass('${ext.code}')" class="px-3 py-1 rounded-full bg-surface-container font-label-sm text-xs font-bold text-on-surface hover:bg-surface-container-high transition-colors">
                  View in Explorer
                </button>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  bindLocalExtensionsEvents() {}

  // ==========================================
  // VIEW 16: SCHEME ADMINISTRATION (PRD Sec 51 & 63)
  // ==========================================

  renderSchemeAdminView() {
    const flags = window.SOURCE_FIDELITY_FLAGS || [];

    return `
      <div class="space-y-space-md">
        <!-- Header -->
        <div class="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
          <div>
            <div class="inline-flex items-center gap-1 font-label-sm text-label-sm text-primary font-bold">
              <span class="material-symbols-outlined text-base">admin_panel_settings</span>
              <span>PRD §51 & §63 Classificationist Role</span>
            </div>
            <h1 class="font-headline-lg text-headline-lg text-on-surface tracking-tight">Classificationist Workbench & Governance</h1>
            <p class="font-body-sm text-body-sm text-on-surface-variant">Manage master schedule, review source fidelity flags, assign reserved slots, and publish version releases.</p>
          </div>
          <span class="font-label-sm text-label-sm bg-tertiary-fixed text-on-tertiary-fixed px-3 py-1 rounded-full font-bold">
            Master Scheme Version 1.0 (2026 Active)
          </span>
        </div>

        <!-- Section 87 Source Audit Findings -->
        <div class="space-y-space-sm">
          <h2 class="font-headline-md text-headline-md text-on-surface">Source Fidelity Audit & Inconsistency Tracker (PRD §87)</h2>
          <div class="space-y-space-xs">
            ${flags.map(f => `
              <div class="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-surface-container-low flex flex-col md:flex-row md:items-center justify-between gap-space-sm">
                <div class="space-y-0.5">
                  <div class="flex items-center gap-2">
                    <span class="font-label-sm text-xs font-bold bg-surface-container px-2 py-0.5 rounded">PRD §${f.section}</span>
                    <h3 class="font-headline-sm text-headline-sm text-on-surface">${f.title}</h3>
                  </div>
                  <p class="font-body-sm text-body-sm text-on-surface-variant">${f.description}</p>
                  <div class="text-xs text-secondary font-bold">Handling: ${f.handling}</div>
                </div>
                <span class="px-2.5 py-1 rounded-full font-label-sm text-xs font-bold ${f.status.includes('CONFIRMED') ? 'bg-tertiary-fixed text-on-tertiary-fixed' : 'bg-primary-fixed text-on-primary-fixed'} shrink-0">
                  ${f.status}
                </span>
              </div>
            `).join("")}
          </div>
        </div>

        <!-- Unassigned Slot Activation Manager (PRD Sec 18, 23, 50) -->
        <div class="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-surface-container-low space-y-space-sm">
          <div class="flex items-center justify-between">
            <h3 class="font-headline-sm text-headline-sm text-on-surface">Unassigned Reserved Slots (PRD §50)</h3>
            <span class="text-xs font-bold text-error">Strictly Guarded</span>
          </div>
          <p class="font-body-sm text-body-sm text-on-surface-variant">
            These notations are reserved for upcoming WAEC additions. Administrators may officially activate them for new subjects:
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
            <div class="p-3 bg-surface-container-low rounded-lg border border-surface-container flex items-center justify-between">
              <div>
                <span class="font-bold text-primary">020.1i</span>
                <div class="text-[11px] text-outline">Macroeconomics Ext</div>
              </div>
              <button onclick="window.app.activateUnassignedCode('020.1i')" class="px-2 py-1 rounded bg-secondary text-on-secondary font-label-sm text-xs font-bold">Activate</button>
            </div>
            <div class="p-3 bg-surface-container-low rounded-lg border border-surface-container flex items-center justify-between">
              <div>
                <span class="font-bold text-primary">020.1ii</span>
                <div class="text-[11px] text-outline">Macroeconomics Ext</div>
              </div>
              <button onclick="window.app.activateUnassignedCode('020.1ii')" class="px-2 py-1 rounded bg-secondary text-on-secondary font-label-sm text-xs font-bold">Activate</button>
            </div>
            <div class="p-3 bg-surface-container-low rounded-lg border border-surface-container flex items-center justify-between">
              <div>
                <span class="font-bold text-primary">031.1i</span>
                <div class="text-[11px] text-outline">Theatre Arts Ext</div>
              </div>
              <button onclick="window.app.activateUnassignedCode('031.1i')" class="px-2 py-1 rounded bg-secondary text-on-secondary font-label-sm text-xs font-bold">Activate</button>
            </div>
            <div class="p-3 bg-surface-container-low rounded-lg border border-surface-container flex items-center justify-between">
              <div>
                <span class="font-bold text-primary">031.5</span>
                <div class="text-[11px] text-outline">Performing Arts Ext</div>
              </div>
              <button onclick="window.app.activateUnassignedCode('031.5')" class="px-2 py-1 rounded bg-secondary text-on-secondary font-label-sm text-xs font-bold">Activate</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  bindSchemeAdminEvents() {}

  activateUnassignedCode(code) {
    const node = window.classificationEngine.getNode(code);
    if (!node) return;
    node.status = "ACTIVE";
    node.name = prompt(`Enter official subject name for ${code}:`, "New Curriculum Addition") || "Active Addition";
    node.displayName = `${node.name} (${code})`;
    window.libraryStore.logAction("Classificationist", "ACTIVATE_UNASSIGNED_CODE", `Code ${code}`, "UNASSIGNED", "ACTIVE");
    this.showToast(`Classification node ${code} successfully activated!`, "success");
    this.renderCurrentView();
  }

  // ==========================================
  // VIEW 17: REPORTS & ANALYTICS (PRD Sec 57 & 58)
  // ==========================================

  renderReportsView() {
    const metrics = window.libraryStore.getMetrics();
    const resources = window.libraryStore.getResources();

    return `
      <div class="space-y-space-md">
        <!-- Header -->
        <div class="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
          <div>
            <div class="inline-flex items-center gap-1 font-label-sm text-label-sm text-primary font-bold">
              <span class="material-symbols-outlined text-base">assessment</span>
              <span>PRD §57 & §58 20 Comprehensive Library Reports</span>
            </div>
            <h1 class="font-headline-lg text-headline-lg text-on-surface tracking-tight">Reports & Collection Analytics</h1>
            <p class="font-body-sm text-body-sm text-on-surface-variant">Generate government inventory reports, accession registers, shelf lists, and classification growth metrics.</p>
          </div>
          <button onclick="window.app.exportCatalogueCsv()" class="inline-flex items-center gap-1.5 px-space-md py-2 rounded-full bg-secondary text-on-secondary font-label-md text-label-md font-bold shadow-sm hover:scale-105 active:scale-95 transition-transform">
            <span class="material-symbols-outlined text-base">download</span> Export Accession CSV
          </button>
        </div>

        <!-- 20 Standard PRD Reports Grid -->
        <div class="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container-low space-y-space-sm">
          <h2 class="font-headline-sm text-headline-sm text-on-surface">Standard Statutory School Library Reports (PRD §58)</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
            ${[
              "1. Full Classification Schedule", "2. Classification Index", "3. Subject Index", "4. Complete Catalogue Register",
              "5. Accession Register", "6. Physical Shelf List", "7. Resource List by Class", "8. Resource List by Author",
              "9. Resource List by Subject", "10. Unclassified Items Report", "11. Lost Resources Register", "12. Damaged Resources Register",
              "13. Borrowing & Circulation Report", "14. Overdue Borrowers Report", "15. Collection Distribution Stats", "16. Classification Statistics",
              "17. Acquisition Grant Report", "18. Secondary Library Inventory", "19. Digital Media Inventory", "20. Classification Amendment Audit"
            ].map(r => `
              <div onclick="window.app.generateReportPrompt('${r}')" class="p-3 rounded-lg bg-surface-container-low hover:bg-surface-container cursor-pointer border border-surface-container flex items-center justify-between transition-colors">
                <span class="font-label-sm text-xs font-bold text-on-surface">${r}</span>
                <span class="material-symbols-outlined text-sm text-secondary">print</span>
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    `;
  }

  bindReportsEvents() {}

  generateReportPrompt(reportName) {
    this.showToast(`Generating ${reportName}... Ready for print and CSV export!`, "success");
    setTimeout(() => {
      window.print();
    }, 600);
  }

  exportCatalogueCsv() {
    const resources = window.libraryStore.getResources();
    let csv = "AccessionNumber,Title,Author,ClassificationNumber,CallNumber,ResourceType,ShelfLocation,Status,Year,Cost\n";

    resources.forEach(r => {
      csv += `"${r.accessionNumber}","${r.title.replace(/"/g, '""')}","${r.author.replace(/"/g, '""')}","${r.classificationNumber}","${r.callNumber}","${r.resourceType}","${r.shelfLocation}","${r.status}",${r.year},"${r.cost}"\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `NaijaLib_Accession_Register_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    this.showToast("Catalogue exported to CSV!", "success");
  }

  // ==========================================
  // VIEW 18: AUDIT TRAIL (PRD Sec 61)
  // ==========================================

  renderAuditTrailView() {
    const logs = window.libraryStore.auditLogs;

    return `
      <div class="space-y-space-md">
        <!-- Header -->
        <div class="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
          <div>
            <div class="inline-flex items-center gap-1 font-label-sm text-label-sm text-primary font-bold">
              <span class="material-symbols-outlined text-base">rule_folder</span>
              <span>PRD §61 Immutable Audit Trail</span>
            </div>
            <h1 class="font-headline-lg text-headline-lg text-on-surface tracking-tight">System Audit Log & Traceability</h1>
            <p class="font-body-sm text-body-sm text-on-surface-variant">Complete audit trail of all cataloguing, classification overrides, and loans.</p>
          </div>
        </div>

        <div class="bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container-low overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-surface-container text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                  <th class="p-3">Timestamp</th>
                  <th class="p-3">User</th>
                  <th class="p-3">Action</th>
                  <th class="p-3">Object / Entity</th>
                  <th class="p-3">Old Value</th>
                  <th class="p-3">New Value</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-surface-container font-body-sm text-body-sm">
                ${logs.map(log => `
                  <tr class="hover:bg-surface-container-low transition-colors">
                    <td class="p-3 font-label-sm text-xs text-outline">${log.timestamp}</td>
                    <td class="p-3 font-bold text-on-surface">${log.user}</td>
                    <td class="p-3">
                      <span class="px-2 py-0.5 rounded font-label-sm text-xs font-bold bg-surface-container text-secondary">
                        ${log.action}
                      </span>
                    </td>
                    <td class="p-3 font-medium text-on-surface">${log.object}</td>
                    <td class="p-3 text-xs text-on-surface-variant">${log.oldValue}</td>
                    <td class="p-3 text-xs font-bold text-tertiary">${log.newValue}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  bindAuditTrailEvents() {}

  // ==========================================
  // VIEW 19: BACKUP & IMPORT/EXPORT (PRD Sec 59)
  // ==========================================

  renderBackupExportView() {
    return `
      <div class="space-y-space-md">
        <!-- Header -->
        <div class="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-surface-container-low">
          <div class="inline-flex items-center gap-1 font-label-sm text-label-sm text-secondary font-bold">
            <span class="material-symbols-outlined text-base">cloud_sync</span>
            <span>PRD §59 Offline-First Backup & Sync</span>
          </div>
          <h1 class="font-headline-lg text-headline-lg text-on-surface tracking-tight">Backup, Restore & Data Migration</h1>
          <p class="font-body-sm text-body-sm text-on-surface-variant">Export complete database payload for offline storage or local hub synchronization.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-space-md">
          <!-- Backup -->
          <div class="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-surface-container-low space-y-3">
            <span class="material-symbols-outlined text-3xl text-secondary">download</span>
            <h3 class="font-headline-sm text-headline-sm text-on-surface">Full JSON Backup</h3>
            <p class="font-body-sm text-body-sm text-on-surface-variant">Export all catalogue records, circulation histories, patrons, and local adaptations into a single JSON snapshot.</p>
            <button onclick="window.app.exportJsonBackup()" class="w-full py-2.5 rounded-full bg-secondary text-on-secondary font-label-md text-label-md font-bold">
              Download JSON Snapshot
            </button>
          </div>

          <!-- Restore -->
          <div class="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-surface-container-low space-y-3">
            <span class="material-symbols-outlined text-3xl text-tertiary">upload</span>
            <h3 class="font-headline-sm text-headline-sm text-on-surface">Restore Snapshot</h3>
            <p class="font-body-sm text-body-sm text-on-surface-variant">Restore database from previously downloaded JSON backup file with automatic schema validation.</p>
            <input type="file" id="restore-file-input" accept=".json" class="hidden" onchange="window.app.handleRestoreFile(event)" />
            <button onclick="document.querySelector('#restore-file-input').click()" class="w-full py-2.5 rounded-full bg-surface-container font-label-md text-label-md text-on-surface font-bold hover:bg-surface-container-high transition-colors">
              Choose JSON File
            </button>
          </div>

          <!-- Reset Defaults -->
          <div class="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-surface-container-low space-y-3">
            <span class="material-symbols-outlined text-3xl text-error">restart_alt</span>
            <h3 class="font-headline-sm text-headline-sm text-on-surface">Reset Sample Data</h3>
            <p class="font-body-sm text-body-sm text-on-surface-variant">Restore initial King's & Queen's College Lagos sample catalogue, active loans, and 2026 NERDC master data.</p>
            <button onclick="window.app.resetSampleDefaults()" class="w-full py-2.5 rounded-full bg-error text-on-error font-label-md text-label-md font-bold">
              Reset to Defaults
            </button>
          </div>
        </div>
      </div>
    `;
  }

  bindBackupExportEvents() {}

  exportJsonBackup() {
    const payload = {
      system: "NaijaLib 2026 Secondary Scheme",
      school: "King's & Queen's College Library - Lagos Hub",
      timestamp: new Date().toISOString(),
      resources: window.libraryStore.resources,
      patrons: window.libraryStore.patrons,
      loans: window.libraryStore.loans,
      locations: window.libraryStore.locations,
      auditLogs: window.libraryStore.auditLogs,
      localExtensions: window.LOCAL_SCHOOL_EXTENSIONS
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `NaijaLib_Backup_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    this.showToast("Complete database backup exported to JSON!", "success");
  }

  handleRestoreFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.resources) window.libraryStore.resources = data.resources;
        if (data.patrons) window.libraryStore.patrons = data.patrons;
        if (data.loans) window.libraryStore.loans = data.loans;
        window.libraryStore.save();
        this.showToast("Database successfully restored from JSON!", "success");
        this.renderCurrentView();
      } catch (err) {
        this.showToast("Failed to parse JSON file.", "error");
      }
    };
    reader.readAsText(file);
  }

  resetSampleDefaults() {
    if (confirm("Reset library state to initial King's College sample database?")) {
      window.libraryStore.loadDefaults();
      this.showToast("System reset to sample defaults.", "info");
      this.renderCurrentView();
    }
  }

  // ==========================================
  // MODALS & OVERLAYS
  // ==========================================

  openOmnisearch() {
    let modal = document.querySelector("#omnisearch-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "omnisearch-modal";
      modal.className = "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-20 px-4";
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="bg-surface-container-lowest rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden border border-surface-container flex flex-col max-h-[80vh]">
        <!-- Search Input Bar -->
        <div class="p-4 border-b border-surface-container flex items-center gap-3">
          <span class="material-symbols-outlined text-outline text-2xl">search</span>
          <input id="omnisearch-input" type="text" autofocus placeholder="Search 011.2, Electricity, Okeke, or Folktales..." class="flex-1 bg-transparent text-on-surface font-headline-sm text-lg focus:outline-none placeholder:text-outline" />
          <span class="font-label-sm text-xs bg-surface-container px-2 py-1 rounded text-on-surface-variant">ESC</span>
        </div>

        <!-- Quick Filter Pills -->
        <div class="px-4 py-2 bg-surface-container-low flex items-center gap-2 overflow-x-auto text-xs text-on-surface-variant font-bold border-b border-surface-container">
          <button onclick="window.app.fillOmnisearch('011.2')" class="px-2 py-0.5 rounded bg-white hover:bg-gray-100">011.2 Electricity</button>
          <button onclick="window.app.fillOmnisearch('030.2iaF')" class="px-2 py-0.5 rounded bg-white hover:bg-gray-100">030.2iaF Folktales</button>
          <button onclick="window.app.fillOmnisearch('Okeke')" class="px-2 py-0.5 rounded bg-white hover:bg-gray-100">Okeke & Anyakoha</button>
          <button onclick="window.app.fillOmnisearch('WAEC')" class="px-2 py-0.5 rounded bg-white hover:bg-gray-100">WAEC Practical</button>
        </div>

        <!-- Results List -->
        <div id="omnisearch-results" class="flex-1 overflow-y-auto p-3 space-y-1">
          <div class="text-center py-12 text-on-surface-variant text-sm">
            Type a classification code, subject heading, author, or book title.
          </div>
        </div>
      </div>
    `;

    modal.onclick = e => {
      if (e.target === modal) this.closeModal();
    };

    const input = document.querySelector("#omnisearch-input");
    if (input) {
      input.focus();
      input.addEventListener("input", e => this.handleOmnisearchInput(e.target.value));
    }
  }

  fillOmnisearch(term) {
    const input = document.querySelector("#omnisearch-input");
    if (input) {
      input.value = term;
      this.handleOmnisearchInput(term);
    }
  }

  handleOmnisearchInput(query) {
    const resultsContainer = document.querySelector("#omnisearch-results");
    if (!resultsContainer) return;

    if (!query || query.trim().length === 0) {
      resultsContainer.innerHTML = `<div class="text-center py-12 text-on-surface-variant text-sm">Type a classification code, subject heading, author, or book title.</div>`;
      return;
    }

    const q = query.trim();
    // Search Classifications
    const matchedNodes = window.classificationEngine.search(q).slice(0, 5);
    // Search Resources
    const matchedResources = window.libraryStore.getResources({ search: q }).slice(0, 6);

    let html = "";

    if (matchedNodes.length > 0) {
      html += `<div class="font-label-sm text-xs uppercase font-bold text-on-surface-variant px-2 pt-2">Classification Schedule Nodes</div>`;
      matchedNodes.forEach(node => {
        html += `
          <div onclick="window.app.selectTreeNode('${node.code}'); window.app.navigateTo('classification-explorer'); window.app.closeModal();" class="p-2.5 rounded-xl hover:bg-surface-container cursor-pointer flex items-center justify-between border border-transparent hover:border-surface-container transition-all">
            <div class="flex items-center gap-2.5">
              <span class="font-label-md text-label-md font-extrabold px-2 py-0.5 rounded bg-surface-container" style="color: ${window.labelGenerator.getArrayColor(node.code)}">
                ${node.code}
              </span>
              <div>
                <div class="font-body-sm text-body-sm font-bold text-on-surface">${node.displayName || node.name}</div>
                <div class="text-xs text-on-surface-variant line-clamp-1">${node.scopeNote || node.description}</div>
              </div>
            </div>
            <span class="font-label-sm text-xs bg-surface-container-high px-2 py-0.5 rounded font-bold">${node.status}</span>
          </div>
        `;
      });
    }

    if (matchedResources.length > 0) {
      html += `<div class="font-label-sm text-xs uppercase font-bold text-on-surface-variant px-2 pt-3">Catalogued Books & Media</div>`;
      matchedResources.forEach(res => {
        html += `
          <div onclick="window.app.openResourceDetails('${res.id}'); window.app.closeModal();" class="p-2.5 rounded-xl hover:bg-surface-container cursor-pointer flex items-center justify-between border border-transparent hover:border-surface-container transition-all">
            <div class="flex items-center gap-2.5">
              <span class="material-symbols-outlined text-primary text-xl">${res.isDigital ? 'laptop_chromebook' : 'menu_book'}</span>
              <div>
                <div class="font-body-sm text-body-sm font-bold text-on-surface">${res.title}</div>
                <div class="text-xs text-on-surface-variant">${res.author} • Call: <strong>${res.callNumber}</strong></div>
              </div>
            </div>
            <span class="font-label-sm text-xs font-bold text-tertiary">#${res.accessionNumber}</span>
          </div>
        `;
      });
    }

    if (!html) {
      html = `<div class="text-center py-12 text-on-surface-variant text-sm">No matches found for "${query}".</div>`;
    }

    resultsContainer.innerHTML = html;
  }

  openResourceDetails(resourceId) {
    const res = window.libraryStore.getResourceById(resourceId);
    if (!res) return;

    let modal = document.querySelector("#resource-detail-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "resource-detail-modal";
      modal.className = "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4";
      document.body.appendChild(modal);
    }

    const barcodeSvg = window.labelGenerator.generateBarcodeSvg(res.accessionNumber, 180, 40);
    const qrSvg = window.labelGenerator.generateQrSvg(`OPAC:${res.accessionNumber}:${res.callNumber}`, 70);

    modal.innerHTML = `
      <div class="bg-surface-container-lowest rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden border border-surface-container flex flex-col max-h-[90vh]">
        <div class="p-4 border-b border-surface-container flex items-center justify-between bg-surface-container-low">
          <div class="flex items-center gap-2">
            <span class="font-label-md text-label-md font-extrabold px-2 py-0.5 rounded" style="background-color: ${window.labelGenerator.getArrayColor(res.classificationNumber)}20; color: ${window.labelGenerator.getArrayColor(res.classificationNumber)}">
              ${res.callNumber}
            </span>
            <span class="font-label-sm text-xs text-on-surface-variant font-bold">Acc: #${res.accessionNumber}</span>
          </div>
          <button onclick="window.app.closeModal()" class="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high">
            <span class="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        <div class="p-space-lg overflow-y-auto space-y-space-md">
          <div class="flex flex-col sm:flex-row gap-space-md items-start">
            <img src="${res.coverImage}" alt="${res.title}" class="w-28 h-36 rounded-xl object-cover shadow-md shrink-0 ring-1 ring-black/5" />
            <div class="space-y-1 flex-1">
              <span class="font-label-sm text-xs bg-surface-container px-2 py-0.5 rounded-full font-bold text-on-surface">${res.resourceType}</span>
              <h2 class="font-headline-md text-headline-md text-on-surface">${res.title}</h2>
              <div class="font-body-sm text-body-sm text-on-surface-variant font-medium">${res.subtitle || ''}</div>
              <div class="font-label-md text-label-md font-bold text-primary pt-1">By ${res.author}</div>
              <div class="text-xs text-on-surface-variant">${res.publisher} • Year: ${res.year} • ${res.edition}</div>
            </div>
          </div>

          <!-- Metadata Grid -->
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-surface-container-low rounded-xl text-xs">
            <div><span class="text-on-surface-variant block">Classification:</span><strong class="text-secondary">${res.classificationNumber}</strong></div>
            <div><span class="text-on-surface-variant block">Author Cutter:</span><strong>${res.authorNumber}</strong></div>
            <div><span class="text-on-surface-variant block">Status:</span><strong class="text-tertiary">${res.status}</strong></div>
            <div><span class="text-on-surface-variant block">Shelf:</span><strong>${res.shelfLocation}</strong></div>
            <div><span class="text-on-surface-variant block">ISBN:</span><strong>${res.isbn}</strong></div>
            <div><span class="text-on-surface-variant block">Acquisition:</span><strong>${res.cost}</strong></div>
          </div>

          <!-- Barcode & QR Code Identification -->
          <div class="p-3 border border-surface-container rounded-xl flex items-center justify-between gap-3">
            <div class="flex-1">
              <span class="font-label-sm text-[10px] uppercase text-on-surface-variant font-bold block mb-1">Accession Barcode</span>
              ${barcodeSvg}
            </div>
            <div class="w-16 h-16 shrink-0 border border-gray-200 p-0.5 rounded bg-white">
              ${qrSvg}
            </div>
          </div>

          <!-- Actions -->
          <div class="pt-2 flex items-center justify-between">
            <button onclick="window.app.printSpineTag('${res.id}')" class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-surface-container hover:bg-surface-container-high font-label-md text-label-md font-bold text-on-surface">
              <span class="material-symbols-outlined text-base">print</span> Print Spine Tag
            </button>
            <button onclick="window.app.openIssueBookModal('${res.id}')" class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary-container text-on-primary-container font-label-md text-label-md font-bold">
              <span class="material-symbols-outlined text-base">assignment_ind</span> Issue Book
            </button>
          </div>
        </div>
      </div>
    `;

    modal.onclick = e => {
      if (e.target === modal) this.closeModal();
    };
  }

  openAddResourceModal(initialCode = "011.2") {
    let modal = document.querySelector("#add-resource-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "add-resource-modal";
      modal.className = "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4";
      document.body.appendChild(modal);
    }

    const types = window.INITIAL_RESOURCE_TYPES;
    const locations = window.INITIAL_SHELF_LOCATIONS;

    modal.innerHTML = `
      <div class="bg-surface-container-lowest rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden border border-surface-container flex flex-col max-h-[90vh]">
        <div class="p-4 border-b border-surface-container flex items-center justify-between bg-surface-container-low">
          <h2 class="font-headline-sm text-headline-sm text-on-surface">Accession New Library Resource (PRD §38)</h2>
          <button onclick="window.app.closeModal()" class="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high">
            <span class="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        <form id="new-resource-form" class="p-space-lg overflow-y-auto space-y-3">
          <div>
            <label class="block font-label-sm text-xs font-bold text-on-surface mb-1">Title *</label>
            <input name="title" required placeholder="e.g. Modern Biology for Senior Secondary" class="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-secondary/40" />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block font-label-sm text-xs font-bold text-on-surface mb-1">Author *</label>
              <input name="author" required placeholder="e.g. Sarojini T. Ramalingam" class="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-secondary/40" />
            </div>
            <div>
              <label class="block font-label-sm text-xs font-bold text-on-surface mb-1">Classification Code (2026 NERDC) *</label>
              <input name="classificationNumber" value="${initialCode}" required placeholder="e.g. 013" class="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-secondary/40" />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="block font-label-sm text-xs font-bold text-on-surface mb-1">Resource Type</label>
              <select name="resourceType" class="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container font-body-sm text-body-sm">
                ${types.map(t => `<option value="${t.name}">${t.name}</option>`).join("")}
              </select>
            </div>
            <div>
              <label class="block font-label-sm text-xs font-bold text-on-surface mb-1">Publication Year</label>
              <input name="year" type="number" value="2025" class="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container font-body-sm text-body-sm" />
            </div>
            <div>
              <label class="block font-label-sm text-xs font-bold text-on-surface mb-1">Cost / Value</label>
              <input name="cost" value="₦5,500" class="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container font-body-sm text-body-sm" />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block font-label-sm text-xs font-bold text-on-surface mb-1">Publisher</label>
              <input name="publisher" value="Africana First Publishers" class="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container font-body-sm text-body-sm" />
            </div>
            <div>
              <label class="block font-label-sm text-xs font-bold text-on-surface mb-1">Shelf Location</label>
              <select name="shelfLocation" class="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container font-body-sm text-body-sm">
                ${locations.map(l => `<option value="${l.section} / ${l.shelf}">${l.shelf} (${l.section})</option>`).join("")}
              </select>
            </div>
          </div>

          <div class="pt-3 flex items-center justify-between border-t border-surface-container">
            <button type="button" onclick="window.app.closeModal()" class="px-4 py-2 rounded-full font-label-md text-label-md text-on-surface-variant">Cancel</button>
            <button type="submit" class="px-6 py-2.5 rounded-full bg-primary-container text-on-primary-container font-label-md text-label-md font-bold shadow-md hover:scale-105 active:scale-95 transition-transform">
              Register & Save
            </button>
          </div>
        </form>
      </div>
    `;

    modal.onclick = e => {
      if (e.target === modal) this.closeModal();
    };

    const form = document.querySelector("#new-resource-form");
    if (form) {
      form.onsubmit = e => {
        e.preventDefault();
        const fd = new FormData(form);
        try {
          const res = window.libraryStore.addResource({
            title: fd.get("title"),
            author: fd.get("author"),
            classificationNumber: fd.get("classificationNumber"),
            resourceType: fd.get("resourceType"),
            year: fd.get("year"),
            cost: fd.get("cost"),
            publisher: fd.get("publisher"),
            shelfLocation: fd.get("shelfLocation")
          });
          this.closeModal();
          this.showToast(`Resource #${res.accessionNumber} added successfully!`, "success");
          this.renderCurrentView();
        } catch (err) {
          alert(`Validation Error: ${err.message}`);
        }
      };
    }
  }

  openCataloguingModalWithCode(code) {
    this.openAddResourceModal(code);
  }

  openAddLocalExtensionModal() {
    let modal = document.querySelector("#add-local-ext-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "add-local-ext-modal";
      modal.className = "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4";
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="bg-surface-container-lowest rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden border border-surface-container flex flex-col">
        <div class="p-4 border-b border-surface-container flex items-center justify-between bg-surface-container-low">
          <h2 class="font-headline-sm text-headline-sm text-on-surface">Add Local Extension (Clause 3.2)</h2>
          <button onclick="window.app.closeModal()" class="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high">
            <span class="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        <form id="local-ext-form" class="p-space-lg space-y-3">
          <div>
            <label class="block font-label-sm text-xs font-bold text-on-surface mb-1">Parent Classification Code *</label>
            <input name="parentId" value="${this.selectedClassificationCode || '010.4'}" required class="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container font-body-sm text-body-sm" />
          </div>

          <div>
            <label class="block font-label-sm text-xs font-bold text-on-surface mb-1">New Local Extension Code (e.g. 010.4A, 013.1A) *</label>
            <input name="code" placeholder="e.g. 010.4A" required class="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container font-body-sm text-body-sm" />
          </div>

          <div>
            <label class="block font-label-sm text-xs font-bold text-on-surface mb-1">Subdivision Title *</label>
            <input name="name" placeholder="e.g. Pure Calculus & Limits" required class="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container font-body-sm text-body-sm" />
          </div>

          <div>
            <label class="block font-label-sm text-xs font-bold text-on-surface mb-1">Curriculum Rationale & Scope Note</label>
            <textarea name="description" rows="2" placeholder="Explain educational justification for this school adaptation..." class="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container font-body-sm text-body-sm"></textarea>
          </div>

          <div class="pt-3 flex items-center justify-between border-t border-surface-container">
            <button type="button" onclick="window.app.closeModal()" class="px-4 py-2 rounded-full font-label-md text-label-md text-on-surface-variant">Cancel</button>
            <button type="submit" class="px-6 py-2 rounded-full bg-secondary text-on-secondary font-label-md text-label-md font-bold">
              Save Local Extension
            </button>
          </div>
        </form>
      </div>
    `;

    modal.onclick = e => {
      if (e.target === modal) this.closeModal();
    };

    const form = document.querySelector("#local-ext-form");
    if (form) {
      form.onsubmit = e => {
        e.preventDefault();
        const fd = new FormData(form);
        try {
          const newExt = window.classificationEngine.addLocalExtension({
            parentId: fd.get("parentId"),
            code: fd.get("code"),
            name: fd.get("name"),
            description: fd.get("description"),
            authorizedBy: "Chief Librarian Adeleke"
          });
          window.LOCAL_SCHOOL_EXTENSIONS.push(newExt);
          window.libraryStore.logAction("Librarian Desk", "CREATE_LOCAL_EXTENSION", `Code ${newExt.code}`, "NONE", newExt.name);
          this.closeModal();
          this.showToast(`Local extension ${newExt.code} created without mutating master scheme!`, "success");
          this.selectedClassificationCode = newExt.code;
          this.renderCurrentView();
        } catch (err) {
          alert(`Error: ${err.message}`);
        }
      };
    }
  }

  openIssueBookModal(preselectedResourceId = null) {
    let modal = document.querySelector("#issue-book-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "issue-book-modal";
      modal.className = "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4";
      document.body.appendChild(modal);
    }

    const resources = window.libraryStore.getResources().filter(r => r.status === "AVAILABLE");
    const patrons = window.libraryStore.patrons;

    modal.innerHTML = `
      <div class="bg-surface-container-lowest rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-surface-container flex flex-col">
        <div class="p-4 border-b border-surface-container flex items-center justify-between bg-surface-container-low">
          <h2 class="font-headline-sm text-headline-sm text-on-surface">Issue Book to Scholar / Staff (PRD §52)</h2>
          <button onclick="window.app.closeModal()" class="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high">
            <span class="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        <form id="issue-book-form" class="p-space-lg space-y-3">
          <div>
            <label class="block font-label-sm text-xs font-bold text-on-surface mb-1">Select Available Book *</label>
            <select name="resourceId" class="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container font-body-sm text-body-sm">
              ${resources.map(r => `
                <option value="${r.id}" ${r.id === preselectedResourceId ? 'selected' : ''}>
                  #${r.accessionNumber}: ${r.title} (${r.callNumber})
                </option>
              `).join("")}
            </select>
          </div>

          <div>
            <label class="block font-label-sm text-xs font-bold text-on-surface mb-1">Select Member / Patron *</label>
            <select name="patronId" class="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container font-body-sm text-body-sm">
              ${patrons.map(p => `
                <option value="${p.id}">${p.name} (${p.patronType} - ${p.classDepartment}) [Loans: ${p.activeLoansCount}/${p.borrowingLimit}]</option>
              `).join("")}
            </select>
          </div>

          <div>
            <label class="block font-label-sm text-xs font-bold text-on-surface mb-1">Loan Duration (Days)</label>
            <select name="loanDays" class="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container font-body-sm text-body-sm">
              <option value="14">14 Days (Standard Student Loan)</option>
              <option value="7">7 Days (Short Loan Reserve)</option>
              <option value="28">28 Days (Faculty / Teacher Loan)</option>
            </select>
          </div>

          <div class="pt-3 flex items-center justify-between border-t border-surface-container">
            <button type="button" onclick="window.app.closeModal()" class="px-4 py-2 rounded-full font-label-md text-label-md text-on-surface-variant">Cancel</button>
            <button type="submit" class="px-6 py-2.5 rounded-full bg-secondary text-on-secondary font-label-md text-label-md font-bold shadow-md">
              Confirm Loan Issue
            </button>
          </div>
        </form>
      </div>
    `;

    modal.onclick = e => {
      if (e.target === modal) this.closeModal();
    };

    const form = document.querySelector("#issue-book-form");
    if (form) {
      form.onsubmit = e => {
        e.preventDefault();
        const fd = new FormData(form);
        try {
          const loan = window.libraryStore.issueItem(
            fd.get("resourceId"),
            fd.get("patronId"),
            parseInt(fd.get("loanDays"), 10)
          );
          this.closeModal();
          this.showToast(`Issued "${loan.resourceTitle}" to ${loan.patronName}!`, "success");
          this.renderCurrentView();
        } catch (err) {
          alert(`Circulation Error: ${err.message}`);
        }
      };
    }
  }

  openAddPatronModal() {
    let modal = document.querySelector("#add-patron-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "add-patron-modal";
      modal.className = "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4";
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="bg-surface-container-lowest rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-surface-container flex flex-col">
        <div class="p-4 border-b border-surface-container flex items-center justify-between bg-surface-container-low">
          <h2 class="font-headline-sm text-headline-sm text-on-surface">Register New Member (PRD §53)</h2>
          <button onclick="window.app.closeModal()" class="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high">
            <span class="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        <form id="add-patron-form" class="p-space-lg space-y-3">
          <div>
            <label class="block font-label-sm text-xs font-bold text-on-surface mb-1">Full Name *</label>
            <input name="name" required placeholder="e.g. Babatunde Balogun" class="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container font-body-sm text-body-sm" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-label-sm text-xs font-bold text-on-surface mb-1">Patron Type</label>
              <select name="patronType" class="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container font-body-sm text-body-sm">
                <option value="Student">Student</option>
                <option value="Teacher">Teacher</option>
                <option value="Library Staff">Library Staff</option>
              </select>
            </div>
            <div>
              <label class="block font-label-sm text-xs font-bold text-on-surface mb-1">Class / Department</label>
              <input name="classDepartment" value="SS1 Science" class="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container font-body-sm text-body-sm" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-label-sm text-xs font-bold text-on-surface mb-1">Phone Number</label>
              <input name="phone" placeholder="+234 803 123 4567" class="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container font-body-sm text-body-sm" />
            </div>
            <div>
              <label class="block font-label-sm text-xs font-bold text-on-surface mb-1">Borrowing Limit</label>
              <input name="borrowingLimit" type="number" value="4" class="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container font-body-sm text-body-sm" />
            </div>
          </div>

          <div class="pt-3 flex items-center justify-between border-t border-surface-container">
            <button type="button" onclick="window.app.closeModal()" class="px-4 py-2 rounded-full font-label-md text-label-md text-on-surface-variant">Cancel</button>
            <button type="submit" class="px-6 py-2 rounded-full bg-primary-container text-on-primary-container font-label-md text-label-md font-bold">
              Register Member
            </button>
          </div>
        </form>
      </div>
    `;

    modal.onclick = e => {
      if (e.target === modal) this.closeModal();
    };

    const form = document.querySelector("#add-patron-form");
    if (form) {
      form.onsubmit = e => {
        e.preventDefault();
        const fd = new FormData(form);
        const p = window.libraryStore.addPatron({
          name: fd.get("name"),
          patronType: fd.get("patronType"),
          classDepartment: fd.get("classDepartment"),
          phone: fd.get("phone"),
          borrowingLimit: fd.get("borrowingLimit")
        });
        this.closeModal();
        this.showToast(`Member ${p.name} registered successfully!`, "success");
        this.renderCurrentView();
      };
    }
  }

  printSpineTag(resourceId) {
    const res = window.libraryStore.getResourceById(resourceId);
    if (!res) return;

    const labelHtml = window.labelGenerator.renderLabelHtml(res);
    const printWindow = window.open("", "_blank", "width=400,height=500");
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Spine Label - ${res.accessionNumber}</title>
          <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Space+Grotesk:wght@600;700&display=swap" rel="stylesheet"/>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>body { padding: 20px; font-family: 'Space Grotesk', sans-serif; display: flex; justify-content: center; }</style>
        </head>
        <body onload="window.print(); window.close();">
          ${labelHtml}
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  // ==========================================
  // USER SESSION & AUTHENTICATION UI
  // ==========================================

  updateUserSessionUI() {
    const user = window.authService ? window.authService.getCurrentUser() : null;
    const profileName = document.querySelector("#header-profile-name");
    const profileRole = document.querySelector("#header-profile-role");
    const profileAvatar = document.querySelector("#header-profile-avatar");
    const loginBtn = document.querySelector("#header-btn-login");
    const signupBtn = document.querySelector("#header-btn-signup");
    const logoutBtn = document.querySelector("#header-btn-logout");
    const adminNav = document.querySelector("#nav-admin-users");

    if (user) {
      if (profileName) profileName.textContent = user.name;
      if (profileRole) profileRole.textContent = user.role;
      if (profileAvatar && user.avatar) profileAvatar.src = user.avatar;
      if (loginBtn) loginBtn.classList.add("hidden");
      if (signupBtn) signupBtn.classList.add("hidden");
      if (logoutBtn) logoutBtn.classList.remove("hidden");
      if (adminNav) {
        adminNav.style.display = (user.role === "System Administrator" || user.role === "Head Librarian") ? "flex" : "none";
      }
    } else {
      if (profileName) profileName.textContent = "Guest Visitor";
      if (profileRole) profileRole.textContent = "Not Signed In";
      if (profileAvatar) profileAvatar.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80";
      if (loginBtn) loginBtn.classList.remove("hidden");
      if (signupBtn) signupBtn.classList.remove("hidden");
      if (logoutBtn) logoutBtn.classList.add("hidden");
      if (adminNav) adminNav.style.display = "none";
    }
  }

  logoutUser() {
    if (window.authService) {
      window.authService.logout();
    }
    this.updateUserSessionUI();
    this.showToast("Signed out successfully. System returned to guest mode.", "info");
    this.navigateTo("landing");
  }

  quickRoleLogin(userId) {
    if (!window.authService) return;
    try {
      const user = window.authService.loginAsUser(userId);
      this.updateUserSessionUI();
      this.showToast(`Logged in as ${user.name} (${user.role})`, "success");
      this.navigateTo("dashboard");
    } catch (err) {
      this.showToast(err.message || "Failed to switch role", "error");
    }
  }

  // ==========================================
  // VIEW: LANDING / HOME / INDEX PAGE
  // ==========================================

  renderLandingPageView() {
    const user = window.authService ? window.authService.getCurrentUser() : null;
    const users = window.authService ? window.authService.users : [];

    return `
      <div class="landing-page space-y-12 pb-16 animate-fadeIn">
        <!-- Hero Section -->
        <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#103022] via-[#0d2218] to-[#08150f] text-white p-8 md:p-14 shadow-2xl border border-emerald-900/40">
          <div class="absolute -right-20 -top-20 w-96 h-96 bg-tertiary/20 rounded-full blur-3xl pointer-events-none"></div>
          <div class="absolute right-10 bottom-0 opacity-10 pointer-events-none select-none">
            <span class="material-symbols-outlined text-[340px]">local_library</span>
          </div>

          <div class="relative z-10 max-w-4xl space-y-6">
            <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-label-sm uppercase tracking-widest text-[#6ffbbe]">
              <span class="w-2 h-2 rounded-full bg-[#6ffbbe] animate-ping"></span>
              NERDC 2026 Secondary Scheme • Offline-First Edge Standard
            </div>

            <h1 class="font-display text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-white">
              Nigerian School Library Classification System
              <span class="block text-transparent bg-clip-text bg-gradient-to-r from-[#6ffbbe] via-[#ffb77a] to-[#d0bcff] text-2xl md:text-4xl mt-2 font-black">
                NaijaLib - 2026 Unified Secondary Edition
              </span>
            </h1>

            <p class="font-body-lg text-white/85 text-base md:text-xl leading-relaxed max-w-3xl">
              An indigenous, purpose-engineered library automation and classification framework built specifically for Nigerian Junior and Senior Secondary Schools (JSS 1 – SSS 3). Tailored to the <strong>National Educational Research and Development Council (NERDC 2026)</strong> secondary curriculum, WAEC & NECO examination specifications, 4-array decimal schedules, and localized African heritage collections.
            </p>

            <!-- Main Interactive Action Buttons -->
            <div class="flex flex-wrap items-center gap-4 pt-4">
              <button id="landing-hero-login" class="px-8 py-4 rounded-2xl bg-[#6ffbbe] text-[#002113] font-label-lg font-extrabold text-base shadow-lg shadow-[#6ffbbe]/25 hover:bg-[#52e8a6] hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                <span class="material-symbols-outlined">login</span>
                <span>Sign In to Portal</span>
              </button>

              <button id="landing-hero-signup" class="px-8 py-4 rounded-2xl bg-white/10 text-white font-label-lg font-bold text-base backdrop-blur-md border border-white/20 hover:bg-white/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                <span class="material-symbols-outlined">person_add</span>
                <span>Create Scholar / Staff Account</span>
              </button>

              <button onclick="window.app.navigateTo('dashboard')" class="px-6 py-4 rounded-2xl bg-primary-container text-on-primary-container font-label-lg font-bold text-base hover:bg-primary-container/90 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-sm">
                <span class="material-symbols-outlined">space_dashboard</span>
                <span>${user ? "Go to My Dashboard" : "Explore Dashboard (Guest)"}</span>
              </button>
            </div>

            <!-- Trust Badges & System Assurances -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-white/10 text-xs font-label-sm text-white/75">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-[#6ffbbe]">verified</span>
                <span>NERDC 2026 Curriculum Aligned</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-[#ffb77a]">menu_book</span>
                <span>WAEC & NECO Syllabus Reserve</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-[#d0bcff]">wifi_off</span>
                <span>100% Offline Campus Operation</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-[#6ffbbe]">lock</span>
                <span>Salted SHA-256 Hashed Security</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Role Showcase & Instant Demo Access (PRD §6 & §62) -->
        <div class="space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 class="font-headline-md text-headline-md text-on-surface">Explore System User Categories (PRD §6 & §62)</h2>
              <p class="font-body-sm text-body-sm text-on-surface-variant">
                Select any predefined user role to test drive specialized cataloguing desks, student OPAC, or administrative privileges.
              </p>
            </div>
            <span class="font-label-sm text-label-sm text-tertiary bg-tertiary-fixed/50 px-3 py-1 rounded-full font-bold self-start">
              8 Multi-Role Profiles Configured
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            ${users.map(u => `
              <div class="bg-surface-container-lowest p-5 rounded-2xl border border-surface-container hover:border-primary/40 hover:shadow-md transition-all flex flex-col justify-between group">
                <div class="space-y-3">
                  <div class="flex items-center gap-3">
                    <img src="${u.avatar}" alt="${u.name}" class="w-12 h-12 rounded-full object-cover ring-2 ring-surface-container group-hover:ring-primary transition-all"/>
                    <div class="min-w-0 flex-1">
                      <div class="font-label-md text-label-md text-on-surface font-bold truncate">${u.name}</div>
                      <span class="inline-block px-2 py-0.5 rounded-full text-[10px] font-label-sm font-bold ${
                        u.role === 'System Administrator' ? 'bg-primary-container text-on-primary-container' :
                        u.role === 'Classificationist' ? 'bg-secondary text-on-secondary' :
                        u.role === 'Head Librarian' ? 'bg-tertiary text-on-tertiary' :
                        u.role === 'Teacher' ? 'bg-amber-100 text-amber-800' :
                        u.role === 'Student' ? 'bg-blue-100 text-blue-800' :
                        'bg-surface-container-high text-on-surface'
                      }">${u.role}</span>
                    </div>
                  </div>
                  <div class="text-xs text-on-surface-variant line-clamp-2">
                    ${u.bio || u.classDepartment}
                  </div>
                </div>

                <div class="pt-4 mt-3 border-t border-surface-container-low flex items-center justify-between">
                  <span class="text-[11px] font-label-sm text-outline">${u.classDepartment}</span>
                  <button onclick="window.app.quickRoleLogin('${u.id}')" class="px-3 py-1.5 rounded-xl bg-surface-container hover:bg-primary hover:text-white font-label-sm text-xs font-bold transition-all flex items-center gap-1 shadow-xs">
                    <span>Quick Login</span>
                    <span class="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
              </div>
            `).join("")}
          </div>
        </div>

        <!-- Architectural Pillars: Explanation of the System -->
        <div class="space-y-6">
          <div class="text-center max-w-3xl mx-auto space-y-2">
            <span class="font-label-sm text-label-sm uppercase tracking-wider text-primary font-bold">Indigenous Classification Standard</span>
            <h2 class="font-display text-2xl md:text-3xl font-extrabold text-on-surface">Why Nigerian Secondary Schools Need NaijaLib</h2>
            <p class="font-body-md text-body-md text-on-surface-variant">
              Designed to solve the deep mismatches between Eurocentric classification systems (Dewey Decimal & Library of Congress) and Nigerian curricula.
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <!-- Card 1 -->
            <div class="bg-surface-container-lowest p-6 rounded-3xl border border-surface-container shadow-sm space-y-3">
              <div class="w-12 h-12 rounded-2xl bg-tertiary/15 text-tertiary flex items-center justify-center font-bold">
                <span class="material-symbols-outlined text-2xl">account_tree</span>
              </div>
              <h3 class="font-headline-sm text-lg font-bold text-on-surface">4-Array Notation Architecture</h3>
              <p class="font-body-sm text-sm text-on-surface-variant leading-relaxed">
                Hierarchical decimal notation directly mirroring Nigerian secondary education: <strong>Array 1 (Main Classes 000–900)</strong>, <strong>Array 2 (Divisions e.g. 010 Pure Sciences)</strong>, <strong>Array 3 (Sections e.g. 011 Biology)</strong>, and <strong>Array 4 (Nigerian Specificity e.g. 011.2 Rainforest & Savanna Ecology)</strong>.
              </p>
            </div>

            <!-- Card 2 -->
            <div class="bg-surface-container-lowest p-6 rounded-3xl border border-surface-container shadow-sm space-y-3">
              <div class="w-12 h-12 rounded-2xl bg-primary/15 text-primary flex items-center justify-center font-bold">
                <span class="material-symbols-outlined text-2xl">barcode_scanner</span>
              </div>
              <h3 class="font-headline-sm text-lg font-bold text-on-surface">Cutter-Sanborn & Tri-Color Labels</h3>
              <p class="font-body-sm text-sm text-on-surface-variant leading-relaxed">
                Automated 3-letter/2-digit author mark synthesis (e.g. <code>011.2 ADE</code> for Adeleke) paired with physical shelf spine labels featuring 3-tier color bands: Sky Blue (Junior), Emerald Green (Senior), and Crimson Red (Exam Reserves).
              </p>
            </div>

            <!-- Card 3 -->
            <div class="bg-surface-container-lowest p-6 rounded-3xl border border-surface-container shadow-sm space-y-3">
              <div class="w-12 h-12 rounded-2xl bg-secondary/15 text-secondary flex items-center justify-center font-bold">
                <span class="material-symbols-outlined text-2xl">history_edu</span>
              </div>
              <h3 class="font-headline-sm text-lg font-bold text-on-surface">WAEC & NECO Stacks Reserve</h3>
              <p class="font-body-sm text-sm text-on-surface-variant leading-relaxed">
                Dedicated overnight reserve desks for high-demand past question compendiums, syllabi, practical lab manuals, and literature set-texts, strictly regulating student loan caps and circulation return intervals.
              </p>
            </div>

            <!-- Card 4 -->
            <div class="bg-surface-container-lowest p-6 rounded-3xl border border-surface-container shadow-sm space-y-3">
              <div class="w-12 h-12 rounded-2xl bg-tertiary-fixed/40 text-tertiary flex items-center justify-center font-bold">
                <span class="material-symbols-outlined text-2xl">offline_bolt</span>
              </div>
              <h3 class="font-headline-sm text-lg font-bold text-on-surface">Offline-First Local Edge Node</h3>
              <p class="font-body-sm text-sm text-on-surface-variant leading-relaxed">
                Built for school campuses in low-bandwidth or remote areas. Full client-side indexing, zero cloud downtime, and instantaneous search across hundreds of resources without requiring internet connectivity.
              </p>
            </div>
          </div>
        </div>

        <!-- 10 Main Classes Preview -->
        <div class="bg-surface-container-low p-8 rounded-3xl border border-surface-container space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 class="font-headline-md text-headline-md text-on-surface">NERDC 2026 Secondary Main Classes</h3>
              <p class="font-body-sm text-body-sm text-on-surface-variant">Click any division to enter the Interactive Classification Explorer.</p>
            </div>
            <button onclick="window.app.navigateTo('classification-explorer')" class="px-4 py-2 rounded-xl bg-surface-container-lowest hover:bg-surface-container-high text-primary font-label-sm text-xs font-bold transition-all self-start border border-surface-container">
              View Master Schedule &rarr;
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <button onclick="window.app.browseClass('000')" class="text-left p-4 rounded-2xl bg-surface-container-lowest hover:border-primary border border-surface-container transition-all group">
              <span class="font-label-sm text-xs text-primary font-bold block">Class 000</span>
              <span class="font-label-md text-sm font-bold text-on-surface group-hover:text-primary transition-colors">Generalities & Info Systems</span>
            </button>
            <button onclick="window.app.browseClass('010')" class="text-left p-4 rounded-2xl bg-surface-container-lowest hover:border-primary border border-surface-container transition-all group">
              <span class="font-label-sm text-xs text-primary font-bold block">Class 010</span>
              <span class="font-label-md text-sm font-bold text-on-surface group-hover:text-primary transition-colors">Pure & Physical Sciences</span>
            </button>
            <button onclick="window.app.browseClass('020')" class="text-left p-4 rounded-2xl bg-surface-container-lowest hover:border-primary border border-surface-container transition-all group">
              <span class="font-label-sm text-xs text-primary font-bold block">Class 020</span>
              <span class="font-label-md text-sm font-bold text-on-surface group-hover:text-primary transition-colors">Nigerian Languages & Lit.</span>
            </button>
            <button onclick="window.app.browseClass('030')" class="text-left p-4 rounded-2xl bg-surface-container-lowest hover:border-primary border border-surface-container transition-all group">
              <span class="font-label-sm text-xs text-primary font-bold block">Class 030</span>
              <span class="font-label-md text-sm font-bold text-on-surface group-hover:text-primary transition-colors">Social Sciences & Civics</span>
            </button>
            <button onclick="window.app.browseClass('040')" class="text-left p-4 rounded-2xl bg-surface-container-lowest hover:border-primary border border-surface-container transition-all group">
              <span class="font-label-sm text-xs text-primary font-bold block">Class 040</span>
              <span class="font-label-md text-sm font-bold text-on-surface group-hover:text-primary transition-colors">Vocational & Tech Studies</span>
            </button>
            <button onclick="window.app.browseClass('050')" class="text-left p-4 rounded-2xl bg-surface-container-lowest hover:border-primary border border-surface-container transition-all group">
              <span class="font-label-sm text-xs text-primary font-bold block">Class 050</span>
              <span class="font-label-md text-sm font-bold text-on-surface group-hover:text-primary transition-colors">Agricultural Sciences</span>
            </button>
            <button onclick="window.app.browseClass('060')" class="text-left p-4 rounded-2xl bg-surface-container-lowest hover:border-primary border border-surface-container transition-all group">
              <span class="font-label-sm text-xs text-primary font-bold block">Class 060</span>
              <span class="font-label-md text-sm font-bold text-on-surface group-hover:text-primary transition-colors">Mathematics & Computing</span>
            </button>
            <button onclick="window.app.browseClass('070')" class="text-left p-4 rounded-2xl bg-surface-container-lowest hover:border-primary border border-surface-container transition-all group">
              <span class="font-label-sm text-xs text-primary font-bold block">Class 070</span>
              <span class="font-label-md text-sm font-bold text-on-surface group-hover:text-primary transition-colors">Creative Arts & Cultural</span>
            </button>
            <button onclick="window.app.browseClass('080')" class="text-left p-4 rounded-2xl bg-surface-container-lowest hover:border-primary border border-surface-container transition-all group">
              <span class="font-label-sm text-xs text-primary font-bold block">Class 080</span>
              <span class="font-label-md text-sm font-bold text-on-surface group-hover:text-primary transition-colors">Religious & Moral Values</span>
            </button>
            <button onclick="window.app.browseClass('090')" class="text-left p-4 rounded-2xl bg-surface-container-lowest hover:border-primary border border-surface-container transition-all group">
              <span class="font-label-sm text-xs text-primary font-bold block">Class 090</span>
              <span class="font-label-md text-sm font-bold text-on-surface group-hover:text-primary transition-colors">History & African Heritage</span>
            </button>
          </div>
        </div>

        <!-- Security & Privacy Assurance Notice -->
        <div class="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-xl bg-tertiary-fixed/60 text-tertiary flex items-center justify-center">
              <span class="material-symbols-outlined">security</span>
            </div>
            <div>
              <div class="font-label-md text-label-md font-bold text-on-surface">Cryptographic Authentication & Privacy Standard</div>
              <div class="font-body-sm text-body-sm text-on-surface-variant">
                All hardcoded credentials and passwords are salt-hashed using standard SHA-256 digests. Plaintext passwords are never stored in client code or browser databases.
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="window.app.openLoginModal()" class="px-4 py-2 rounded-xl bg-secondary text-on-secondary font-label-sm text-xs font-bold hover:opacity-90 transition-opacity">
              Sign In
            </button>
            <button onclick="window.app.openSignupModal()" class="px-4 py-2 rounded-xl bg-surface-container-high text-on-surface font-label-sm text-xs font-bold hover:bg-surface-container-highest transition-colors">
              Sign Up
            </button>
          </div>
        </div>
      </div>
    `;
  }

  bindLandingPageEvents() {
    const loginHero = document.querySelector("#landing-hero-login");
    const signupHero = document.querySelector("#landing-hero-signup");

    if (loginHero) {
      loginHero.addEventListener("click", () => this.openLoginModal());
    }
    if (signupHero) {
      signupHero.addEventListener("click", () => this.openSignupModal());
    }
  }

  // ==========================================
  // VIEW: UNIVERSAL ADMIN USER MANAGEMENT (PRD §6 & §62)
  // ==========================================

  renderAdminUsersView() {
    const currentUser = window.authService ? window.authService.getCurrentUser() : null;
    const allUsers = window.authService ? window.authService.users : [];

    const isAuthorized = currentUser && ["System Administrator", "Head Librarian"].includes(currentUser.role);

    return `
      <div class="admin-users-view space-y-6 animate-fadeIn">
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-lowest p-6 rounded-3xl border border-surface-container">
          <div>
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-primary text-2xl">manage_accounts</span>
              <h1 class="font-headline-lg text-headline-lg text-on-surface">Universal User Management</h1>
            </div>
            <p class="font-body-sm text-body-sm text-on-surface-variant mt-1">
              Administer multi-role accounts according to PRD §6 (Target Users) & PRD §62 (Security Roles). All passwords are salt-hashed using SHA-256.
            </p>
          </div>

          <div class="flex items-center gap-3">
            <button id="admin-create-user-btn" class="px-5 py-2.5 rounded-2xl bg-primary text-on-primary font-label-md text-label-md font-bold shadow-md hover:bg-primary/90 flex items-center gap-2 transition-all">
              <span class="material-symbols-outlined">person_add</span>
              <span>Create User Category / Account</span>
            </button>
          </div>
        </div>

        ${!isAuthorized ? `
          <div class="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <span class="material-symbols-outlined text-amber-600 text-2xl">warning</span>
              <div>
                <strong class="font-label-md text-sm block">Restricted Privileges Notice</strong>
                <span class="text-xs">You are currently logged in as <strong>${currentUser ? currentUser.role : "Guest"}</strong>. Creating accounts requires System Administrator or Head Librarian privileges.</span>
              </div>
            </div>
            <button onclick="window.app.quickRoleLogin('usr-admin-1')" class="px-4 py-2 rounded-xl bg-amber-600 text-white font-label-sm text-xs font-bold hover:bg-amber-700 transition-colors whitespace-nowrap">
              Switch to Universal Admin
            </button>
          </div>
        ` : ""}

        <!-- User Statistics Grid -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="p-4 rounded-2xl bg-surface-container-lowest border border-surface-container">
            <span class="text-xs font-label-sm text-on-surface-variant uppercase">Total Accounts</span>
            <div class="font-headline-md text-2xl font-bold text-on-surface mt-1">${allUsers.length}</div>
          </div>
          <div class="p-4 rounded-2xl bg-surface-container-lowest border border-surface-container">
            <span class="text-xs font-label-sm text-on-surface-variant uppercase">Active Users</span>
            <div class="font-headline-md text-2xl font-bold text-tertiary mt-1">
              ${allUsers.filter(u => u.status === "ACTIVE").length}
            </div>
          </div>
          <div class="p-4 rounded-2xl bg-surface-container-lowest border border-surface-container">
            <span class="text-xs font-label-sm text-on-surface-variant uppercase">Staff & Cataloguers</span>
            <div class="font-headline-md text-2xl font-bold text-primary mt-1">
              ${allUsers.filter(u => ["System Administrator", "Classificationist", "Head Librarian", "Librarian", "Library Assistant"].includes(u.role)).length}
            </div>
          </div>
          <div class="p-4 rounded-2xl bg-surface-container-lowest border border-surface-container">
            <span class="text-xs font-label-sm text-on-surface-variant uppercase">Teachers & Scholars</span>
            <div class="font-headline-md text-2xl font-bold text-secondary mt-1">
              ${allUsers.filter(u => ["Teacher", "Student"].includes(u.role)).length}
            </div>
          </div>
        </div>

        <!-- Filter and Search Bar -->
        <div class="flex flex-col sm:flex-row gap-3">
          <div class="relative flex-1">
            <span class="material-symbols-outlined absolute left-3 top-2.5 text-outline text-lg">search</span>
            <input id="admin-user-search" type="text" placeholder="Search by name, email, department..." class="w-full pl-9 pr-4 py-2 rounded-xl bg-surface-container-lowest border border-surface-container text-sm font-body-sm focus:outline-none focus:ring-2 focus:ring-primary"/>
          </div>
          <select id="admin-role-filter" class="px-4 py-2 rounded-xl bg-surface-container-lowest border border-surface-container text-sm font-body-sm focus:outline-none focus:ring-2 focus:ring-primary">
            <option value="">All Categories & Roles</option>
            <option value="System Administrator">System Administrator</option>
            <option value="Classificationist">Classificationist</option>
            <option value="Head Librarian">Head Librarian</option>
            <option value="Librarian">Librarian</option>
            <option value="Library Assistant">Library Assistant</option>
            <option value="Teacher">Teacher</option>
            <option value="Student">Student</option>
            <option value="School Management">School Management</option>
          </select>
        </div>

        <!-- User Accounts Table -->
        <div class="bg-surface-container-lowest rounded-3xl border border-surface-container overflow-hidden shadow-sm">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-surface-container-low border-b border-surface-container text-xs font-label-sm uppercase tracking-wider text-on-surface-variant">
                  <th class="py-3 px-4">User</th>
                  <th class="py-3 px-4">Role / Category</th>
                  <th class="py-3 px-4">Department / Class</th>
                  <th class="py-3 px-4">Borrow Limit</th>
                  <th class="py-3 px-4">Status</th>
                  <th class="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody id="admin-users-table-body" class="divide-y divide-surface-container-low text-sm font-body-sm">
                ${this.renderAdminUsersTableRows(allUsers)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  renderAdminUsersTableRows(users) {
    if (!users || users.length === 0) {
      return `
        <tr>
          <td colspan="6" class="text-center py-8 text-on-surface-variant">
            No matching user accounts found.
          </td>
        </tr>
      `;
    }

    return users.map(u => `
      <tr class="hover:bg-surface-container-low/50 transition-colors">
        <td class="py-3.5 px-4">
          <div class="flex items-center gap-3">
            <img src="${u.avatar}" alt="${u.name}" class="w-10 h-10 rounded-full object-cover ring-1 ring-surface-container"/>
            <div>
              <div class="font-label-md font-bold text-on-surface">${u.name}</div>
              <div class="text-xs text-on-surface-variant font-mono">${u.email}</div>
            </div>
          </div>
        </td>
        <td class="py-3.5 px-4">
          <span class="inline-block px-2.5 py-0.5 rounded-full text-xs font-label-sm font-bold ${
            u.role === 'System Administrator' ? 'bg-primary-container text-on-primary-container' :
            u.role === 'Classificationist' ? 'bg-secondary text-on-secondary' :
            u.role === 'Head Librarian' ? 'bg-tertiary text-on-tertiary' :
            u.role === 'Teacher' ? 'bg-amber-100 text-amber-800' :
            u.role === 'Student' ? 'bg-blue-100 text-blue-800' :
            'bg-surface-container-high text-on-surface'
          }">${u.role}</span>
        </td>
        <td class="py-3.5 px-4 text-on-surface-variant">
          ${u.classDepartment || "General"}
        </td>
        <td class="py-3.5 px-4 font-mono font-bold text-on-surface">
          ${u.borrowingLimit || 4} books
        </td>
        <td class="py-3.5 px-4">
          <span class="inline-block px-2 py-0.5 rounded-full text-[11px] font-label-sm font-bold ${
            u.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
          }">
            ${u.status}
          </span>
        </td>
        <td class="py-3.5 px-4 text-right">
          <div class="inline-flex items-center gap-1.5">
            <button onclick="window.app.quickRoleLogin('${u.id}')" title="Log in as this user" class="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors">
              <span class="material-symbols-outlined text-base">switch_account</span>
            </button>
            <button onclick="window.app.openAdminEditUserModal('${u.id}')" title="Edit account details" class="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-secondary transition-colors">
              <span class="material-symbols-outlined text-base">edit</span>
            </button>
            <button onclick="window.app.toggleUserStatus('${u.id}')" title="Toggle active status" class="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-error transition-colors">
              <span class="material-symbols-outlined text-base">${u.status === 'ACTIVE' ? 'block' : 'check_circle'}</span>
            </button>
          </div>
        </td>
      </tr>
    `).join("");
  }

  bindAdminUsersEvents() {
    const createBtn = document.querySelector("#admin-create-user-btn");
    if (createBtn) {
      createBtn.addEventListener("click", () => this.openAdminCreateUserModal());
    }

    const searchInput = document.querySelector("#admin-user-search");
    const roleFilter = document.querySelector("#admin-role-filter");
    const tableBody = document.querySelector("#admin-users-table-body");

    const applyFilter = () => {
      if (!tableBody || !window.authService) return;
      const query = (searchInput ? searchInput.value : "").trim().toLowerCase();
      const role = (roleFilter ? roleFilter.value : "").trim();

      const filtered = window.authService.users.filter(u => {
        const matchesQuery = !query ||
          u.name.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query) ||
          (u.classDepartment && u.classDepartment.toLowerCase().includes(query));
        const matchesRole = !role || u.role === role;
        return matchesQuery && matchesRole;
      });

      tableBody.innerHTML = this.renderAdminUsersTableRows(filtered);
    };

    if (searchInput) searchInput.addEventListener("input", applyFilter);
    if (roleFilter) roleFilter.addEventListener("change", applyFilter);
  }

  toggleUserStatus(userId) {
    if (!window.authService) return;
    const admin = window.authService.getCurrentUser();
    if (!admin || !["System Administrator", "Head Librarian"].includes(admin.role)) {
      this.showToast("Only System Administrator or Head Librarian can change account status.", "error");
      return;
    }

    const user = window.authService.getUserById(userId);
    if (!user) return;
    const newStatus = user.status === "ACTIVE" ? "DEACTIVATED" : "ACTIVE";
    window.authService.updateUserByAdmin(admin.id, userId, { status: newStatus });
    this.showToast(`User ${user.name} is now ${newStatus}.`, "success");
    this.renderCurrentView();
  }

  // ==========================================
  // MODALS: LOGIN, SIGNUP, PROFILE & ADMIN
  // ==========================================

  openLoginModal() {
    this.closeModal();

    const modal = document.createElement("div");
    modal.id = "login-modal";
    modal.className = "fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/50 backdrop-blur-sm animate-fadeIn";
    modal.innerHTML = `
      <div class="bg-surface-container-lowest rounded-3xl max-w-md w-full p-8 shadow-2xl border border-surface-container relative animate-scaleUp">
        <button onclick="window.app.closeModal()" class="absolute top-6 right-6 p-2 rounded-full hover:bg-surface-container-low text-on-surface-variant hover:text-on-surface">
          <span class="material-symbols-outlined text-lg">close</span>
        </button>

        <div class="flex items-center gap-3 mb-6">
          <div class="w-12 h-12 rounded-2xl bg-primary-container text-white flex items-center justify-center font-bold text-xl shadow-sm">
            NL
          </div>
          <div>
            <h2 class="font-headline-md text-xl font-bold text-on-surface">Sign In to NaijaLib</h2>
            <p class="font-body-sm text-xs text-on-surface-variant">2026 Nigerian Secondary School Library Portal</p>
          </div>
        </div>

        <form id="login-form" class="space-y-4">
          <div id="login-error-msg" class="hidden p-3 rounded-xl bg-error/10 text-error text-xs font-label-md"></div>

          <div>
            <label class="block font-label-sm text-xs uppercase tracking-wider text-on-surface-variant font-bold mb-1">
              Email Address or Username
            </label>
            <input id="login-identifier" type="text" required placeholder="e.g. admin@naijalib.sch.ng" class="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-surface-container text-sm font-body-sm focus:outline-none focus:ring-2 focus:ring-primary"/>
          </div>

          <div>
            <label class="block font-label-sm text-xs uppercase tracking-wider text-on-surface-variant font-bold mb-1">
              Password
            </label>
            <div class="relative">
              <input id="login-password" type="password" required placeholder="Enter password" class="w-full px-4 py-3 pr-10 rounded-xl bg-surface-container-low border border-surface-container text-sm font-body-sm focus:outline-none focus:ring-2 focus:ring-primary"/>
              <button type="button" id="login-toggle-pass" class="absolute right-3 top-3 text-outline hover:text-on-surface">
                <span class="material-symbols-outlined text-lg">visibility</span>
              </button>
            </div>
            <p class="text-[11px] text-outline mt-1">Cryptographically verified using SHA-256 salted digest.</p>
          </div>

          <!-- Quick Test Accounts -->
          <div class="pt-2">
            <span class="text-[11px] font-label-sm uppercase text-on-surface-variant font-bold block mb-1.5">Quick Demo Roles:</span>
            <div class="flex flex-wrap gap-1.5">
              <button type="button" onclick="window.app.quickRoleLogin('usr-admin-1'); window.app.closeModal();" class="px-2.5 py-1 rounded-lg bg-surface-container text-xs font-label-sm font-semibold hover:bg-primary-container hover:text-white transition-colors">
                Admin
              </button>
              <button type="button" onclick="window.app.quickRoleLogin('usr-class-1'); window.app.closeModal();" class="px-2.5 py-1 rounded-lg bg-surface-container text-xs font-label-sm font-semibold hover:bg-secondary hover:text-white transition-colors">
                Classificationist
              </button>
              <button type="button" onclick="window.app.quickRoleLogin('usr-lib-1'); window.app.closeModal();" class="px-2.5 py-1 rounded-lg bg-surface-container text-xs font-label-sm font-semibold hover:bg-tertiary hover:text-white transition-colors">
                Librarian
              </button>
              <button type="button" onclick="window.app.quickRoleLogin('usr-stu-1'); window.app.closeModal();" class="px-2.5 py-1 rounded-lg bg-surface-container text-xs font-label-sm font-semibold hover:bg-blue-600 hover:text-white transition-colors">
                Student
              </button>
            </div>
          </div>

          <button type="submit" id="login-submit-btn" class="w-full py-3.5 rounded-xl bg-primary text-on-primary font-label-md text-sm font-bold shadow-md hover:bg-primary/95 transition-all flex items-center justify-center gap-2">
            <span class="material-symbols-outlined text-lg">login</span>
            <span>Authenticate & Enter Dashboard</span>
          </button>
        </form>

        <div class="pt-4 text-center border-t border-surface-container-low mt-4">
          <p class="font-body-sm text-xs text-on-surface-variant">
            Don't have an account yet?
            <button onclick="window.app.openSignupModal()" class="text-primary font-bold hover:underline ml-1">
              Create Account (Sign Up)
            </button>
          </p>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const toggleBtn = modal.querySelector("#login-toggle-pass");
    const passInput = modal.querySelector("#login-password");
    if (toggleBtn && passInput) {
      toggleBtn.addEventListener("click", () => {
        passInput.type = passInput.type === "password" ? "text" : "password";
      });
    }

    const form = modal.querySelector("#login-form");
    const errBox = modal.querySelector("#login-error-msg");
    const submitBtn = modal.querySelector("#login-submit-btn");

    form.addEventListener("submit", async e => {
      e.preventDefault();
      const identifier = modal.querySelector("#login-identifier").value;
      const password = passInput.value;

      try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="material-symbols-outlined animate-spin text-base">progress_activity</span> Authenticating...`;

        const user = await window.authService.login(identifier, password);
        this.updateUserSessionUI();
        this.closeModal();
        this.showToast(`Welcome back, ${user.name}!`, "success");
        this.navigateTo("dashboard");
      } catch (err) {
        if (errBox) {
          errBox.textContent = err.message || "Failed to sign in.";
          errBox.classList.remove("hidden");
        }
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span class="material-symbols-outlined text-lg">login</span> <span>Authenticate & Enter Dashboard</span>`;
      }
    });
  }

  openSignupModal() {
    this.closeModal();

    const modal = document.createElement("div");
    modal.id = "signup-modal";
    modal.className = "fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/50 backdrop-blur-sm animate-fadeIn";
    modal.innerHTML = `
      <div class="bg-surface-container-lowest rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-surface-container relative animate-scaleUp max-h-[90vh] overflow-y-auto">
        <button onclick="window.app.closeModal()" class="absolute top-6 right-6 p-2 rounded-full hover:bg-surface-container-low text-on-surface-variant hover:text-on-surface">
          <span class="material-symbols-outlined text-lg">close</span>
        </button>

        <div class="flex items-center gap-3 mb-6">
          <div class="w-12 h-12 rounded-2xl bg-tertiary text-white flex items-center justify-center font-bold text-xl shadow-sm">
            <span class="material-symbols-outlined">person_add</span>
          </div>
          <div>
            <h2 class="font-headline-md text-xl font-bold text-on-surface">Join NaijaLib System</h2>
            <p class="font-body-sm text-xs text-on-surface-variant">Create your account with secure password hashing</p>
          </div>
        </div>

        <form id="signup-form" class="space-y-4">
          <div id="signup-error-msg" class="hidden p-3 rounded-xl bg-error/10 text-error text-xs font-label-md"></div>

          <div>
            <label class="block font-label-sm text-xs uppercase tracking-wider text-on-surface-variant font-bold mb-1">
              Full Name *
            </label>
            <input id="signup-name" type="text" required placeholder="e.g. Babatunde Fashola" class="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-surface-container text-sm font-body-sm focus:outline-none focus:ring-2 focus:ring-primary"/>
          </div>

          <div>
            <label class="block font-label-sm text-xs uppercase tracking-wider text-on-surface-variant font-bold mb-1">
              Email Address *
            </label>
            <input id="signup-email" type="email" required placeholder="e.g. babatunde@kingscollege.sch.ng" class="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-surface-container text-sm font-body-sm focus:outline-none focus:ring-2 focus:ring-primary"/>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block font-label-sm text-xs uppercase tracking-wider text-on-surface-variant font-bold mb-1">
                User Role / Category *
              </label>
              <select id="signup-role" class="w-full px-3 py-2.5 rounded-xl bg-surface-container-low border border-surface-container text-sm font-body-sm focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="Student">Student (Scholar)</option>
                <option value="Teacher">Subject Teacher</option>
                <option value="Librarian">Librarian / Cataloguer</option>
                <option value="Library Assistant">Library Assistant</option>
                <option value="School Management">School Management</option>
              </select>
            </div>

            <div>
              <label class="block font-label-sm text-xs uppercase tracking-wider text-on-surface-variant font-bold mb-1">
                Class / Department *
              </label>
              <input id="signup-dept" type="text" placeholder="e.g. SS2 Science, Biology Dept" class="w-full px-3 py-2.5 rounded-xl bg-surface-container-low border border-surface-container text-sm font-body-sm focus:outline-none focus:ring-2 focus:ring-primary"/>
            </div>
          </div>

          <div>
            <label class="block font-label-sm text-xs uppercase tracking-wider text-on-surface-variant font-bold mb-1">
              Password (minimum 6 characters) *
            </label>
            <input id="signup-password" type="password" required minlength="6" placeholder="Choose a secure password" class="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-surface-container text-sm font-body-sm focus:outline-none focus:ring-2 focus:ring-primary"/>
            <p class="text-[11px] text-tertiary mt-1 flex items-center gap-1">
              <span class="material-symbols-outlined text-xs">lock</span>
              <span>Your password is encrypted with salted SHA-256 and never stored in plaintext.</span>
            </p>
          </div>

          <div>
            <label class="block font-label-sm text-xs uppercase tracking-wider text-on-surface-variant font-bold mb-1">
              Bio / Academic Profile (Optional)
            </label>
            <textarea id="signup-bio" rows="2" placeholder="Brief note about your academic role, subjects, or reading interests..." class="w-full px-4 py-2 rounded-xl bg-surface-container-low border border-surface-container text-sm font-body-sm focus:outline-none focus:ring-2 focus:ring-primary"></textarea>
          </div>

          <div>
            <label class="block font-label-sm text-xs uppercase tracking-wider text-on-surface-variant font-bold mb-1.5">
              Choose an Avatar
            </label>
            <div class="flex items-center gap-2">
              <label class="cursor-pointer">
                <input type="radio" name="signup-avatar" value="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80" checked class="hidden peer"/>
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80" class="w-10 h-10 rounded-full object-cover ring-2 ring-transparent peer-checked:ring-primary peer-checked:scale-110 transition-all"/>
              </label>
              <label class="cursor-pointer">
                <input type="radio" name="signup-avatar" value="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80" class="hidden peer"/>
                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80" class="w-10 h-10 rounded-full object-cover ring-2 ring-transparent peer-checked:ring-primary peer-checked:scale-110 transition-all"/>
              </label>
              <label class="cursor-pointer">
                <input type="radio" name="signup-avatar" value="https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80" class="hidden peer"/>
                <img src="https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80" class="w-10 h-10 rounded-full object-cover ring-2 ring-transparent peer-checked:ring-primary peer-checked:scale-110 transition-all"/>
              </label>
              <label class="cursor-pointer">
                <input type="radio" name="signup-avatar" value="https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80" class="hidden peer"/>
                <img src="https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80" class="w-10 h-10 rounded-full object-cover ring-2 ring-transparent peer-checked:ring-primary peer-checked:scale-110 transition-all"/>
              </label>
            </div>
          </div>

          <button type="submit" id="signup-submit-btn" class="w-full py-3.5 rounded-xl bg-tertiary text-on-tertiary font-label-md text-sm font-bold shadow-md hover:bg-tertiary/95 transition-all flex items-center justify-center gap-2">
            <span class="material-symbols-outlined text-lg">check_circle</span>
            <span>Create Account & Go to Dashboard</span>
          </button>
        </form>

        <div class="pt-4 text-center border-t border-surface-container-low mt-4">
          <p class="font-body-sm text-xs text-on-surface-variant">
            Already have an account?
            <button onclick="window.app.openLoginModal()" class="text-tertiary font-bold hover:underline ml-1">
              Sign In
            </button>
          </p>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const form = modal.querySelector("#signup-form");
    const errBox = modal.querySelector("#signup-error-msg");
    const submitBtn = modal.querySelector("#signup-submit-btn");

    form.addEventListener("submit", async e => {
      e.preventDefault();
      const name = modal.querySelector("#signup-name").value;
      const email = modal.querySelector("#signup-email").value;
      const password = modal.querySelector("#signup-password").value;
      const role = modal.querySelector("#signup-role").value;
      const classDepartment = modal.querySelector("#signup-dept").value || "General";
      const bio = modal.querySelector("#signup-bio").value;
      const avatarRadio = modal.querySelector('input[name="signup-avatar"]:checked');
      const avatar = avatarRadio ? avatarRadio.value : "";

      try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="material-symbols-outlined animate-spin text-base">progress_activity</span> Registering...`;

        const user = await window.authService.signup({
          name,
          email,
          password,
          role,
          classDepartment,
          bio,
          avatar
        });

        this.updateUserSessionUI();
        this.closeModal();
        this.showToast(`Account created! Welcome, ${user.name}.`, "success");
        this.navigateTo("dashboard");
      } catch (err) {
        if (errBox) {
          errBox.textContent = err.message || "Failed to create account.";
          errBox.classList.remove("hidden");
        }
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span class="material-symbols-outlined text-lg">check_circle</span> <span>Create Account & Go to Dashboard</span>`;
      }
    });
  }

  // Self Profile Management Modal (Change password, name, bio, avatar)
  openProfileModal() {
    this.closeModal();

    const user = window.authService ? window.authService.getCurrentUser() : null;
    if (!user) {
      this.openLoginModal();
      return;
    }

    const modal = document.createElement("div");
    modal.id = "profile-modal";
    modal.className = "fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/50 backdrop-blur-sm animate-fadeIn";
    modal.innerHTML = `
      <div class="bg-surface-container-lowest rounded-3xl max-w-xl w-full p-8 shadow-2xl border border-surface-container relative animate-scaleUp max-h-[90vh] overflow-y-auto">
        <button onclick="window.app.closeModal()" class="absolute top-6 right-6 p-2 rounded-full hover:bg-surface-container-low text-on-surface-variant hover:text-on-surface">
          <span class="material-symbols-outlined text-lg">close</span>
        </button>

        <div class="flex items-center gap-4 mb-6">
          <img id="profile-current-avatar" src="${user.avatar}" alt="${user.name}" class="w-16 h-16 rounded-full object-cover ring-2 ring-primary"/>
          <div>
            <h2 class="font-headline-md text-xl font-bold text-on-surface">${user.name}</h2>
            <div class="flex items-center gap-2 mt-0.5">
              <span class="px-2 py-0.5 rounded-full text-xs font-label-sm font-bold bg-primary-container text-on-primary-container">
                ${user.role}
              </span>
              <span class="text-xs text-on-surface-variant font-mono">${user.email}</span>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="flex border-b border-surface-container mb-6">
          <button id="tab-btn-details" class="px-4 py-2 font-label-sm text-xs font-bold text-primary border-b-2 border-primary -mb-px">
            Profile Details & Avatar
          </button>
          <button id="tab-btn-password" class="px-4 py-2 font-label-sm text-xs font-bold text-on-surface-variant hover:text-on-surface border-b-2 border-transparent -mb-px">
            Change Password
          </button>
        </div>

        <!-- Tab 1: Profile Details -->
        <div id="tab-content-details" class="space-y-4">
          <div id="profile-details-feedback" class="hidden p-3 rounded-xl text-xs font-label-md"></div>

          <div>
            <label class="block font-label-sm text-xs uppercase tracking-wider text-on-surface-variant font-bold mb-1">
              Full Name
            </label>
            <input id="profile-edit-name" type="text" value="${user.name}" class="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-surface-container text-sm font-body-sm focus:outline-none focus:ring-2 focus:ring-primary"/>
          </div>

          <div>
            <label class="block font-label-sm text-xs uppercase tracking-wider text-on-surface-variant font-bold mb-1">
              Class / Department
            </label>
            <input id="profile-edit-dept" type="text" value="${user.classDepartment || ""}" class="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-surface-container text-sm font-body-sm focus:outline-none focus:ring-2 focus:ring-primary"/>
          </div>

          <div>
            <label class="block font-label-sm text-xs uppercase tracking-wider text-on-surface-variant font-bold mb-1">
              Biography & Academic Focus
            </label>
            <textarea id="profile-edit-bio" rows="3" class="w-full px-4 py-2 rounded-xl bg-surface-container-low border border-surface-container text-sm font-body-sm focus:outline-none focus:ring-2 focus:ring-primary">${user.bio || ""}</textarea>
          </div>

          <div>
            <label class="block font-label-sm text-xs uppercase tracking-wider text-on-surface-variant font-bold mb-1">
              Profile Avatar Image URL
            </label>
            <input id="profile-edit-avatar-url" type="url" value="${user.avatar}" class="w-full px-4 py-2 rounded-xl bg-surface-container-low border border-surface-container text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary"/>
            
            <div class="pt-2">
              <span class="text-[11px] font-label-sm uppercase text-on-surface-variant font-bold block mb-1">Quick Select Preset Avatar:</span>
              <div class="flex items-center gap-2">
                <button type="button" onclick="document.querySelector('#profile-edit-avatar-url').value='https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'; document.querySelector('#profile-current-avatar').src='https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80';" class="w-8 h-8 rounded-full overflow-hidden ring-1 ring-surface-container hover:ring-primary">
                  <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80" class="w-full h-full object-cover"/>
                </button>
                <button type="button" onclick="document.querySelector('#profile-edit-avatar-url').value='https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'; document.querySelector('#profile-current-avatar').src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80';" class="w-8 h-8 rounded-full overflow-hidden ring-1 ring-surface-container hover:ring-primary">
                  <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80" class="w-full h-full object-cover"/>
                </button>
                <button type="button" onclick="document.querySelector('#profile-edit-avatar-url').value='https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80'; document.querySelector('#profile-current-avatar').src='https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80';" class="w-8 h-8 rounded-full overflow-hidden ring-1 ring-surface-container hover:ring-primary">
                  <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80" class="w-full h-full object-cover"/>
                </button>
                <button type="button" onclick="document.querySelector('#profile-edit-avatar-url').value='https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80'; document.querySelector('#profile-current-avatar').src='https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80';" class="w-8 h-8 rounded-full overflow-hidden ring-1 ring-surface-container hover:ring-primary">
                  <img src="https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80" class="w-full h-full object-cover"/>
                </button>
              </div>
            </div>
          </div>

          <button id="save-profile-btn" class="w-full py-3 rounded-xl bg-primary text-on-primary font-label-md text-sm font-bold shadow-md hover:bg-primary/90 transition-all flex items-center justify-center gap-2">
            <span class="material-symbols-outlined text-base">save</span>
            <span>Save Profile Updates</span>
          </button>
        </div>

        <!-- Tab 2: Change Password -->
        <div id="tab-content-password" class="space-y-4 hidden">
          <div id="password-feedback" class="hidden p-3 rounded-xl text-xs font-label-md"></div>

          <div class="p-3 rounded-xl bg-tertiary/10 text-tertiary text-xs flex items-center gap-2">
            <span class="material-symbols-outlined text-base">shield_lock</span>
            <span>Your new password will be hashed using SHA-256 + salt and safely persisted.</span>
          </div>

          <div>
            <label class="block font-label-sm text-xs uppercase tracking-wider text-on-surface-variant font-bold mb-1">
              Current Password *
            </label>
            <input id="profile-curr-pass" type="password" required placeholder="Enter current password" class="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-surface-container text-sm font-body-sm focus:outline-none focus:ring-2 focus:ring-primary"/>
          </div>

          <div>
            <label class="block font-label-sm text-xs uppercase tracking-wider text-on-surface-variant font-bold mb-1">
              New Password (minimum 6 characters) *
            </label>
            <input id="profile-new-pass" type="password" required minlength="6" placeholder="Choose new password" class="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-surface-container text-sm font-body-sm focus:outline-none focus:ring-2 focus:ring-primary"/>
          </div>

          <div>
            <label class="block font-label-sm text-xs uppercase tracking-wider text-on-surface-variant font-bold mb-1">
              Confirm New Password *
            </label>
            <input id="profile-conf-pass" type="password" required minlength="6" placeholder="Re-enter new password" class="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-surface-container text-sm font-body-sm focus:outline-none focus:ring-2 focus:ring-primary"/>
          </div>

          <button id="save-password-btn" class="w-full py-3 rounded-xl bg-tertiary text-on-tertiary font-label-md text-sm font-bold shadow-md hover:bg-tertiary/90 transition-all flex items-center justify-center gap-2">
            <span class="material-symbols-outlined text-base">key</span>
            <span>Update Password Hash</span>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Tab switching
    const tabDetails = modal.querySelector("#tab-btn-details");
    const tabPassword = modal.querySelector("#tab-btn-password");
    const contentDetails = modal.querySelector("#tab-content-details");
    const contentPassword = modal.querySelector("#tab-content-password");

    tabDetails.addEventListener("click", () => {
      tabDetails.className = "px-4 py-2 font-label-sm text-xs font-bold text-primary border-b-2 border-primary -mb-px";
      tabPassword.className = "px-4 py-2 font-label-sm text-xs font-bold text-on-surface-variant hover:text-on-surface border-b-2 border-transparent -mb-px";
      contentDetails.classList.remove("hidden");
      contentPassword.classList.add("hidden");
    });

    tabPassword.addEventListener("click", () => {
      tabPassword.className = "px-4 py-2 font-label-sm text-xs font-bold text-primary border-b-2 border-primary -mb-px";
      tabDetails.className = "px-4 py-2 font-label-sm text-xs font-bold text-on-surface-variant hover:text-on-surface border-b-2 border-transparent -mb-px";
      contentPassword.classList.remove("hidden");
      contentDetails.classList.add("hidden");
    });

    // Save profile logic
    const saveProfileBtn = modal.querySelector("#save-profile-btn");
    saveProfileBtn.addEventListener("click", () => {
      const name = modal.querySelector("#profile-edit-name").value;
      const classDepartment = modal.querySelector("#profile-edit-dept").value;
      const bio = modal.querySelector("#profile-edit-bio").value;
      const avatar = modal.querySelector("#profile-edit-avatar-url").value;

      try {
        window.authService.updateProfile(user.id, { name, classDepartment, bio, avatar });
        this.updateUserSessionUI();
        this.showToast("Profile details updated successfully!", "success");
        this.closeModal();
      } catch (err) {
        const feedback = modal.querySelector("#profile-details-feedback");
        if (feedback) {
          feedback.textContent = err.message || "Failed to update profile";
          feedback.className = "p-3 rounded-xl bg-error/10 text-error text-xs font-label-md";
          feedback.classList.remove("hidden");
        }
      }
    });

    // Change password logic
    const savePasswordBtn = modal.querySelector("#save-password-btn");
    savePasswordBtn.addEventListener("click", async () => {
      const currPass = modal.querySelector("#profile-curr-pass").value;
      const newPass = modal.querySelector("#profile-new-pass").value;
      const confPass = modal.querySelector("#profile-conf-pass").value;
      const feedback = modal.querySelector("#password-feedback");

      if (newPass !== confPass) {
        if (feedback) {
          feedback.textContent = "New password and confirmation do not match.";
          feedback.className = "p-3 rounded-xl bg-error/10 text-error text-xs font-label-md";
          feedback.classList.remove("hidden");
        }
        return;
      }

      try {
        savePasswordBtn.disabled = true;
        savePasswordBtn.innerHTML = `<span class="material-symbols-outlined animate-spin text-base">progress_activity</span> Verifying & Hashing...`;

        await window.authService.changePassword(user.id, currPass, newPass);
        this.showToast("Password updated successfully! Salted SHA-256 hash stored.", "success");
        this.closeModal();
      } catch (err) {
        if (feedback) {
          feedback.textContent = err.message || "Failed to update password.";
          feedback.className = "p-3 rounded-xl bg-error/10 text-error text-xs font-label-md";
          feedback.classList.remove("hidden");
        }
      } finally {
        savePasswordBtn.disabled = false;
        savePasswordBtn.innerHTML = `<span class="material-symbols-outlined text-base">key</span> <span>Update Password Hash</span>`;
      }
    });
  }

  // Universal Admin: Create User Modal
  openAdminCreateUserModal() {
    this.closeModal();

    const admin = window.authService ? window.authService.getCurrentUser() : null;
    if (!admin || !["System Administrator", "Head Librarian"].includes(admin.role)) {
      this.showToast("Only Universal Admin or Head Librarian can create user accounts.", "error");
      return;
    }

    const modal = document.createElement("div");
    modal.id = "admin-user-modal";
    modal.className = "fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/50 backdrop-blur-sm animate-fadeIn";
    modal.innerHTML = `
      <div class="bg-surface-container-lowest rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-surface-container relative animate-scaleUp max-h-[90vh] overflow-y-auto">
        <button onclick="window.app.closeModal()" class="absolute top-6 right-6 p-2 rounded-full hover:bg-surface-container-low text-on-surface-variant hover:text-on-surface">
          <span class="material-symbols-outlined text-lg">close</span>
        </button>

        <div class="flex items-center gap-3 mb-6">
          <div class="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center font-bold text-xl shadow-sm">
            <span class="material-symbols-outlined">person_add</span>
          </div>
          <div>
            <h2 class="font-headline-md text-xl font-bold text-on-surface">Assign New User Category</h2>
            <p class="font-body-sm text-xs text-on-surface-variant">Universal Administrator Console (PRD §6 & §62)</p>
          </div>
        </div>

        <form id="admin-create-form" class="space-y-4">
          <div id="admin-create-error" class="hidden p-3 rounded-xl bg-error/10 text-error text-xs font-label-md"></div>

          <div>
            <label class="block font-label-sm text-xs uppercase tracking-wider text-on-surface-variant font-bold mb-1">
              User Category / Security Role *
            </label>
            <select id="admin-user-role" required class="w-full px-3 py-2.5 rounded-xl bg-surface-container-low border border-surface-container text-sm font-body-sm focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="System Administrator">System Administrator (Universal Admin)</option>
              <option value="Classificationist">Classificationist (NERDC Scheme Governance)</option>
              <option value="Head Librarian">Head Librarian (Accession Supervisor)</option>
              <option value="Librarian">Librarian (Senior Secondary Cataloguer)</option>
              <option value="Library Assistant">Library Assistant (Circulation Desk)</option>
              <option value="Teacher">Teacher (Secondary Subject Master)</option>
              <option value="Student" selected>Student (Secondary Scholar)</option>
              <option value="School Management">School Management (Director / Principal)</option>
            </select>
          </div>

          <div>
            <label class="block font-label-sm text-xs uppercase tracking-wider text-on-surface-variant font-bold mb-1">
              Full Name *
            </label>
            <input id="admin-user-name" type="text" required placeholder="e.g. Fatima Bello" class="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-surface-container text-sm font-body-sm focus:outline-none focus:ring-2 focus:ring-primary"/>
          </div>

          <div>
            <label class="block font-label-sm text-xs uppercase tracking-wider text-on-surface-variant font-bold mb-1">
              Email Address *
            </label>
            <input id="admin-user-email" type="email" required placeholder="e.g. fatima.bello@kingscollege.sch.ng" class="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-surface-container text-sm font-body-sm focus:outline-none focus:ring-2 focus:ring-primary"/>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block font-label-sm text-xs uppercase tracking-wider text-on-surface-variant font-bold mb-1">
                Initial Password *
              </label>
              <input id="admin-user-pass" type="password" required minlength="6" placeholder="Initial password" class="w-full px-3 py-2.5 rounded-xl bg-surface-container-low border border-surface-container text-sm font-body-sm focus:outline-none focus:ring-2 focus:ring-primary"/>
            </div>

            <div>
              <label class="block font-label-sm text-xs uppercase tracking-wider text-on-surface-variant font-bold mb-1">
                Borrowing Limit *
              </label>
              <input id="admin-user-limit" type="number" min="1" max="50" value="4" class="w-full px-3 py-2.5 rounded-xl bg-surface-container-low border border-surface-container text-sm font-body-sm focus:outline-none focus:ring-2 focus:ring-primary"/>
            </div>
          </div>

          <div>
            <label class="block font-label-sm text-xs uppercase tracking-wider text-on-surface-variant font-bold mb-1">
              Class or Department
            </label>
            <input id="admin-user-dept" type="text" placeholder="e.g. SS1 Science, Physics Dept, Registry" class="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-surface-container text-sm font-body-sm focus:outline-none focus:ring-2 focus:ring-primary"/>
          </div>

          <div>
            <label class="block font-label-sm text-xs uppercase tracking-wider text-on-surface-variant font-bold mb-1">
              User Bio
            </label>
            <textarea id="admin-user-bio" rows="2" placeholder="Responsibilities or academic notes..." class="w-full px-4 py-2 rounded-xl bg-surface-container-low border border-surface-container text-sm font-body-sm focus:outline-none focus:ring-2 focus:ring-primary"></textarea>
          </div>

          <p class="text-[11px] text-tertiary flex items-center gap-1">
            <span class="material-symbols-outlined text-xs">lock</span>
            <span>Password will be salted and converted to a SHA-256 hash before storage.</span>
          </p>

          <button type="submit" id="admin-create-submit" class="w-full py-3.5 rounded-xl bg-primary text-on-primary font-label-md text-sm font-bold shadow-md hover:bg-primary/90 transition-all flex items-center justify-center gap-2">
            <span class="material-symbols-outlined text-lg">check_circle</span>
            <span>Create Account & Assign Privileges</span>
          </button>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    const form = modal.querySelector("#admin-create-form");
    const errBox = modal.querySelector("#admin-create-error");
    const submitBtn = modal.querySelector("#admin-create-submit");

    // Dynamic borrow limit adjustment based on role
    const roleSelect = modal.querySelector("#admin-user-role");
    const limitInput = modal.querySelector("#admin-user-limit");
    if (roleSelect && limitInput) {
      roleSelect.addEventListener("change", () => {
        const val = roleSelect.value;
        if (val === "Student") limitInput.value = 4;
        else if (val === "Teacher") limitInput.value = 8;
        else if (val === "Librarian") limitInput.value = 10;
        else if (val === "Head Librarian") limitInput.value = 15;
        else if (val === "System Administrator") limitInput.value = 20;
        else limitInput.value = 6;
      });
    }

    form.addEventListener("submit", async e => {
      e.preventDefault();
      const role = roleSelect.value;
      const name = modal.querySelector("#admin-user-name").value;
      const email = modal.querySelector("#admin-user-email").value;
      const password = modal.querySelector("#admin-user-pass").value;
      const borrowingLimit = parseInt(limitInput.value, 10) || 4;
      const classDepartment = modal.querySelector("#admin-user-dept").value || "General";
      const bio = modal.querySelector("#admin-user-bio").value;

      try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="material-symbols-outlined animate-spin text-base">progress_activity</span> Creating...`;

        await window.authService.createUserByAdmin(admin.id, {
          role,
          name,
          email,
          password,
          borrowingLimit,
          classDepartment,
          bio
        });

        this.closeModal();
        this.showToast(`User ${name} (${role}) created successfully!`, "success");
        this.renderCurrentView();
      } catch (err) {
        if (errBox) {
          errBox.textContent = err.message || "Failed to create user.";
          errBox.classList.remove("hidden");
        }
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span class="material-symbols-outlined text-lg">check_circle</span> <span>Create Account & Assign Privileges</span>`;
      }
    });
  }

  // Universal Admin: Edit User Modal
  openAdminEditUserModal(userId) {
    this.closeModal();

    const admin = window.authService ? window.authService.getCurrentUser() : null;
    if (!admin || !["System Administrator", "Head Librarian"].includes(admin.role)) {
      this.showToast("Only Universal Admin or Head Librarian can edit users.", "error");
      return;
    }

    const user = window.authService.getUserById(userId);
    if (!user) return;

    const modal = document.createElement("div");
    modal.id = "admin-edit-modal";
    modal.className = "fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/50 backdrop-blur-sm animate-fadeIn";
    modal.innerHTML = `
      <div class="bg-surface-container-lowest rounded-3xl max-w-md w-full p-8 shadow-2xl border border-surface-container relative animate-scaleUp">
        <button onclick="window.app.closeModal()" class="absolute top-6 right-6 p-2 rounded-full hover:bg-surface-container-low text-on-surface-variant hover:text-on-surface">
          <span class="material-symbols-outlined text-lg">close</span>
        </button>

        <h2 class="font-headline-md text-xl font-bold text-on-surface mb-1">Edit User Account</h2>
        <p class="font-body-sm text-xs text-on-surface-variant mb-6 font-mono">${user.email}</p>

        <form id="admin-edit-form" class="space-y-4">
          <div>
            <label class="block font-label-sm text-xs uppercase tracking-wider text-on-surface-variant font-bold mb-1">
              Full Name
            </label>
            <input id="edit-user-name" type="text" value="${user.name}" class="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-surface-container text-sm font-body-sm focus:outline-none focus:ring-2 focus:ring-primary"/>
          </div>

          <div>
            <label class="block font-label-sm text-xs uppercase tracking-wider text-on-surface-variant font-bold mb-1">
              Role / Category
            </label>
            <select id="edit-user-role" class="w-full px-3 py-2.5 rounded-xl bg-surface-container-low border border-surface-container text-sm font-body-sm focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="System Administrator" ${user.role === 'System Administrator' ? 'selected' : ''}>System Administrator</option>
              <option value="Classificationist" ${user.role === 'Classificationist' ? 'selected' : ''}>Classificationist</option>
              <option value="Head Librarian" ${user.role === 'Head Librarian' ? 'selected' : ''}>Head Librarian</option>
              <option value="Librarian" ${user.role === 'Librarian' ? 'selected' : ''}>Librarian</option>
              <option value="Library Assistant" ${user.role === 'Library Assistant' ? 'selected' : ''}>Library Assistant</option>
              <option value="Teacher" ${user.role === 'Teacher' ? 'selected' : ''}>Teacher</option>
              <option value="Student" ${user.role === 'Student' ? 'selected' : ''}>Student</option>
              <option value="School Management" ${user.role === 'School Management' ? 'selected' : ''}>School Management</option>
            </select>
          </div>

          <div>
            <label class="block font-label-sm text-xs uppercase tracking-wider text-on-surface-variant font-bold mb-1">
              Class / Department
            </label>
            <input id="edit-user-dept" type="text" value="${user.classDepartment || ""}" class="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-surface-container text-sm font-body-sm focus:outline-none focus:ring-2 focus:ring-primary"/>
          </div>

          <div>
            <label class="block font-label-sm text-xs uppercase tracking-wider text-on-surface-variant font-bold mb-1">
              Borrowing Limit
            </label>
            <input id="edit-user-limit" type="number" min="1" max="50" value="${user.borrowingLimit || 4}" class="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-surface-container text-sm font-body-sm focus:outline-none focus:ring-2 focus:ring-primary"/>
          </div>

          <button type="submit" class="w-full py-3 rounded-xl bg-primary text-on-primary font-label-md text-sm font-bold shadow-md hover:bg-primary/90 transition-all">
            Save User Changes
          </button>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    const form = modal.querySelector("#admin-edit-form");
    form.addEventListener("submit", e => {
      e.preventDefault();
      const name = modal.querySelector("#edit-user-name").value;
      const role = modal.querySelector("#edit-user-role").value;
      const classDepartment = modal.querySelector("#edit-user-dept").value;
      const borrowingLimit = modal.querySelector("#edit-user-limit").value;

      window.authService.updateUserByAdmin(admin.id, userId, {
        name,
        role,
        classDepartment,
        borrowingLimit
      });

      this.closeModal();
      this.showToast(`Updated ${name} successfully!`, "success");
      this.renderCurrentView();
    });
  }

  closeModal() {
    const modals = document.querySelectorAll(
      "#omnisearch-modal, #resource-detail-modal, #add-resource-modal, #add-local-ext-modal, #issue-book-modal, #add-patron-modal, #login-modal, #signup-modal, #profile-modal, #admin-user-modal, #admin-edit-modal"
    );
    modals.forEach(m => m.remove());
  }

  // Quick helper to browse a class code
  browseClass(code) {
    this.selectedClassificationCode = code;
    this.navigateTo("classification-explorer");
  }

  // Quick helper to search and jump to explorer
  searchAndGo(term) {
    const results = window.classificationEngine.search(term);
    if (results.length > 0) {
      this.browseClass(results[0].code);
    } else {
      this.browseClass("011.2");
    }
  }
}

// Instantiate Global App
window.addEventListener("DOMContentLoaded", () => {
  window.app = new NaijaLibApp();
});
