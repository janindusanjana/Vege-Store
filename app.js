// -------------------------------------------------------------
// 1. Initial Seed Data in Sri Lankan Rupees (Rs.)
// -------------------------------------------------------------
const DEFAULT_VEGETABLES = [
  { id: "veg_1", name: "Fresh Tomato", category: "Fruit Vegetable", emoji: "🍅", price: 480.00, stock: 45.0, alertLimit: 10.0, sellUnit: "kg" },
  { id: "veg_2", name: "Red Potato", category: "Root", emoji: "🥔", price: 280.00, stock: 80.0, alertLimit: 15.0, sellUnit: "kg" },
  { id: "veg_3", name: "Organic Carrot", category: "Root", emoji: "🥕", price: 380.00, stock: 35.0, alertLimit: 10.0, sellUnit: "kg" },
  { id: "veg_4", name: "Baby Spinach", category: "Leafy Green", emoji: "🥬", price: 220.00, stock: 12.0, alertLimit: 8.0, sellUnit: "kg" },
  { id: "veg_5", name: "Crown Broccoli", category: "Cruciferous", emoji: "🥦", price: 320.00, stock: 18.0, alertLimit: 8.0, sellUnit: "piece" },
  { id: "veg_6", name: "Fresh Cilantro", category: "Herb", emoji: "🌿", price: 180.00, stock: 8.5, alertLimit: 5.0, sellUnit: "kg" },
  { id: "veg_7", name: "English Cucumber", category: "Fruit Vegetable", emoji: "🥒", price: 240.00, stock: 25.0, alertLimit: 10.0, sellUnit: "kg" },
  { id: "veg_8", name: "Red Onion", category: "Root", emoji: "🧅", price: 320.00, stock: 90.0, alertLimit: 15.0, sellUnit: "kg" },
  { id: "veg_9", name: "Garlic Bulbs", category: "Root", emoji: "🧄", price: 95.00, stock: 14.0, alertLimit: 5.0, sellUnit: "piece" }
];

const DEFAULT_SETTINGS = {
  shopName: "FRESHCART MARKET",
  shopPhone: "(011) 2345-6789",
  shopAddress: "123 Eco-Drive, Colombo 03",
  taxRate: 5.0,
  receiptGreeting: "Thank You For Shopping Fresh! Please Come Again",
  firebaseEnabled: false,
  firebaseApiKey: "",
  firebaseDbUrl: "",
  firebaseProjectId: "",
  firebaseAppId: ""
};

const DEFAULT_AUTH = {
  adminUser: "admin",
  adminPass: "admin123",
  cashierUser: "cashier",
  cashierPass: "cashier123",
  recoveryPin: "1234"
};

// Global Firebase reference
let database = null;

// Helper to generate seed transactions over the last 30 days (scaled for LKR)
function generateSeedTransactions() {
  const txs = [];
  const now = new Date();
  
  function getDateDaysAgo(daysAgo) {
    const d = new Date(now);
    d.setDate(now.getDate() - daysAgo);
    d.setHours(9 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60), 0, 0);
    return d.toISOString();
  }

  for (let daysAgo = 29; daysAgo >= 1; daysAgo--) {
    const salesCount = 1 + Math.floor(Math.random() * 3);
    for (let s = 0; s < salesCount; s++) {
      const itemsCount = 1 + Math.floor(Math.random() * 3);
      const itemsList = [];
      let subtotal = 0;

      for (let i = 0; i < itemsCount; i++) {
        const itemSeed = DEFAULT_VEGETABLES[Math.floor(Math.random() * DEFAULT_VEGETABLES.length)];
        const qty = itemSeed.sellUnit === "kg" ? parseFloat((0.5 + Math.random() * 4).toFixed(2)) : (1 + Math.floor(Math.random() * 5));
        const cost = qty * itemSeed.price;
        subtotal += cost;
        itemsList.push({
          id: itemSeed.id,
          name: itemSeed.name,
          price: itemSeed.price,
          weight: qty,
          sellUnit: itemSeed.sellUnit,
          total: parseFloat(cost.toFixed(2))
        });
      }

      const discPercent = Math.random() > 0.7 ? 5 : 0;
      const discountAmount = parseFloat((subtotal * (discPercent / 100)).toFixed(2));
      const taxableAmount = subtotal - discountAmount;
      const tax = parseFloat((taxableAmount * 0.05).toFixed(2));
      const total = parseFloat((taxableAmount + tax).toFixed(2));

      txs.push({
        id: `TX-${1000 + txs.length}`,
        timestamp: getDateDaysAgo(daysAgo),
        items: itemsList,
        subtotal: parseFloat(subtotal.toFixed(2)),
        discountPercent: discPercent,
        discount: discountAmount,
        taxPercent: 5.0,
        tax: tax,
        total: total
      });
    }
  }

  const todaySales = [
    {
      id: "TX-2000",
      timestamp: new Date(now.setHours(10, 15, 0, 0)).toISOString(),
      items: [
        { id: "veg_1", name: "Fresh Tomato", price: 480.00, weight: 1.5, sellUnit: "kg", total: 720.00 },
        { id: "veg_3", name: "Organic Carrot", price: 380.00, weight: 2.2, sellUnit: "kg", total: 836.00 }
      ],
      subtotal: 1556.00,
      discountPercent: 0,
      discount: 0,
      taxPercent: 5.0,
      tax: 77.80,
      total: 1633.80
    },
    {
      id: "TX-2001",
      timestamp: new Date(now.setHours(11, 45, 0, 0)).toISOString(),
      items: [
        { id: "veg_2", name: "Red Potato", price: 280.00, weight: 5.0, sellUnit: "kg", total: 1400.00 },
        { id: "veg_8", name: "Red Onion", price: 320.00, weight: 3.5, sellUnit: "kg", total: 1120.00 },
        { id: "veg_9", name: "Garlic Bulbs", price: 95.00, weight: 6, sellUnit: "piece", total: 570.00 }
      ],
      subtotal: 3090.00,
      discountPercent: 5,
      discount: 154.50,
      taxPercent: 5.0,
      tax: 146.78,
      total: 3082.28
    }
  ];

  return [...txs, ...todaySales];
}

// -------------------------------------------------------------
// 2. State & Database Initialization
// -------------------------------------------------------------
class StoreDatabase {
  static getInventory() {
    const data = localStorage.getItem("veg_store_db");
    if (!data) {
      localStorage.setItem("veg_store_db", JSON.stringify(DEFAULT_VEGETABLES));
      return DEFAULT_VEGETABLES;
    }
    return JSON.parse(data);
  }

  static saveInventory(inventory) {
    localStorage.setItem("veg_store_db", JSON.stringify(inventory));
    if (AppState.firebaseSyncActive && database) {
      database.ref("inventory").set(inventory);
    }
  }

  static getTransactions() {
    const data = localStorage.getItem("veg_store_tx");
    if (!data) {
      const seed = generateSeedTransactions();
      localStorage.setItem("veg_store_tx", JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(data);
  }

  static saveTransactions(transactions) {
    localStorage.setItem("veg_store_tx", JSON.stringify(transactions));
    if (AppState.firebaseSyncActive && database) {
      database.ref("transactions").set(transactions);
    }
  }

  static getSettings() {
    const data = localStorage.getItem("veg_store_settings");
    if (!data) {
      localStorage.setItem("veg_store_settings", JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }
    const parsed = JSON.parse(data);
    return { ...DEFAULT_SETTINGS, ...parsed };
  }

  static saveSettings(settings) {
    localStorage.setItem("veg_store_settings", JSON.stringify(settings));
    if (AppState.firebaseSyncActive && database) {
      database.ref("settings").set(settings);
    }
  }

  static getAuth() {
    const data = localStorage.getItem("veg_store_auth");
    if (!data) {
      localStorage.setItem("veg_store_auth", JSON.stringify(DEFAULT_AUTH));
      return DEFAULT_AUTH;
    }
    const parsed = JSON.parse(data);
    return { ...DEFAULT_AUTH, ...parsed };
  }

  static saveAuth(auth) {
    localStorage.setItem("veg_store_auth", JSON.stringify(auth));
    if (AppState.firebaseSyncActive && database) {
      database.ref("auth").set(auth);
    }
  }
}

// Helper to get local date string YYYY-MM-DD
function getLocalDateString(dateObj = new Date()) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Global App State
const AppState = {
  inventory: StoreDatabase.getInventory(),
  transactions: StoreDatabase.getTransactions(),
  settings: StoreDatabase.getSettings(),
  auth: StoreDatabase.getAuth(),
  currentUserRole: null, 
  firebaseSyncActive: false,
  cart: [],
  currentView: "dashboard",
  posSearchSuggestions: [],
  posHighlightedSuggestionIndex: -1,
  inventorySearchQuery: "",
  txSearchQuery: "",
  dashboardChartRange: "7days",
  dashboardSelectedDate: getLocalDateString()
};

// -------------------------------------------------------------
// 3. Main App Controller & View router
// -------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  initDOM();
  initFirebase();
  checkSession();
  renderCurrentView();
  lucide.createIcons();
});

// Cache DOM elements and bind static event listeners
let dom = {};
function initDOM() {
  // Navigation & Header
  dom.navItems = document.querySelectorAll(".nav-item");
  dom.viewTitle = document.getElementById("view-title");
  dom.viewSubtitle = document.getElementById("view-subtitle");
  dom.dashboardDatePicker = document.getElementById("dashboard-date-picker");
  dom.sidebarShopName = document.getElementById("sidebar-shop-name");

  // Sidebar role configurations
  dom.sidebarRoleLabel = document.getElementById("sidebar-role-label");
  dom.btnLogout = document.getElementById("btn-logout");
  dom.navInventory = document.getElementById("nav-inventory");
  dom.navSettings = document.getElementById("nav-settings");
  dom.sidebarStatusDot = document.getElementById("sidebar-status-dot");
  dom.sidebarStatusText = document.getElementById("sidebar-status-text");

  // Authentication Overlays
  dom.loginOverlay = document.getElementById("login-overlay");
  dom.loginForm = document.getElementById("login-form");
  dom.loginUsername = document.getElementById("login-username");
  dom.loginPassword = document.getElementById("login-password");
  dom.loginErrorMsg = document.getElementById("login-error-msg");

  dom.btnGotoForgot = document.getElementById("btn-goto-forgot");
  dom.btnGotoLogin = document.getElementById("btn-goto-login");
  
  dom.recoveryForm = document.getElementById("recovery-form");
  dom.recoveryPin = document.getElementById("recovery-pin");
  dom.recoveryRole = document.getElementById("recovery-role");
  dom.recoveryNewUser = document.getElementById("recovery-new-user");
  dom.recoveryNewPass = document.getElementById("recovery-new-pass");
  dom.recoveryErrorMsg = document.getElementById("recovery-error-msg");
  dom.recoverySuccessMsg = document.getElementById("recovery-success-msg");

  // Views
  dom.views = {
    dashboard: document.getElementById("view-dashboard"),
    pos: document.getElementById("view-pos"),
    inventory: document.getElementById("view-inventory"),
    settings: document.getElementById("view-settings")
  };

  // Dashboard Stats & Tables
  dom.statRevenue = document.getElementById("stat-revenue");
  dom.statSalesCount = document.getElementById("stat-sales-count");
  dom.statStockWeight = document.getElementById("stat-stock-weight");
  dom.statLowStockCount = document.getElementById("stat-low-stock-count");
  dom.lowStockList = document.getElementById("low-stock-list");
  dom.recentTransactionsTbody = document.getElementById("recent-transactions-tbody");
  dom.chartContainer = document.getElementById("chart-container");
  dom.chartRangeSelect = document.getElementById("chart-range-select");
  dom.txSearchInput = document.getElementById("tx-search-input");
  dom.chartCardTitle = document.getElementById("chart-card-title");
  dom.chartCardSubtitle = document.getElementById("chart-card-subtitle");
  
  dom.labelRevenue = document.getElementById("label-revenue");
  dom.labelSalesCount = document.getElementById("label-sales-count");
  dom.txCardTitle = document.getElementById("tx-card-title");

  // POS Redesigned elements
  dom.posQuickAddForm = document.getElementById("pos-quick-add-form");
  dom.posProductSearch = document.getElementById("pos-product-search");
  dom.posSelectedProductId = document.getElementById("pos-selected-product-id");
  dom.btnClearSearchInput = document.getElementById("btn-clear-search-input");
  dom.posDropdownSuggestions = document.getElementById("pos-dropdown-suggestions");
  dom.posSellMethod = document.getElementById("pos-sell-method");
  dom.posWeightInput = document.getElementById("pos-weight-input");
  dom.posInputLabel = document.getElementById("pos-input-label");
  dom.posWeightUnit = document.getElementById("pos-weight-unit");
  
  dom.posBillTbody = document.getElementById("pos-bill-tbody");
  dom.posEmptyCartState = document.getElementById("pos-empty-cart-state");
  dom.posBillTable = document.getElementById("pos-bill-table");
  dom.btnClearCart = document.getElementById("btn-clear-cart");
  dom.discountInput = document.getElementById("discount-percent-input");
  dom.summarySubtotal = document.getElementById("summary-subtotal");
  dom.summaryTax = document.getElementById("summary-tax");
  dom.summaryTotal = document.getElementById("summary-total");
  dom.btnCheckout = document.getElementById("btn-checkout");

  // Inventory
  dom.inventorySearch = document.getElementById("inventory-search-input");
  dom.inventoryTableTbody = document.getElementById("inventory-table-tbody");
  dom.btnAddProduct = document.getElementById("btn-add-product");

  // Product Modal
  dom.productModal = document.getElementById("product-modal");
  dom.productForm = document.getElementById("product-form");
  dom.productModalTitle = document.getElementById("product-modal-title");
  dom.productIdInput = document.getElementById("product-id");
  dom.productNameInput = document.getElementById("product-name");
  dom.productCategorySelect = document.getElementById("product-category");
  dom.productUnitSelect = document.getElementById("product-unit");
  dom.productEmojiInput = document.getElementById("product-emoji");
  dom.productPriceInput = document.getElementById("product-price");
  dom.productStockInput = document.getElementById("product-stock");
  dom.productAlertInput = document.getElementById("product-alert");
  dom.btnCloseProductModal = document.getElementById("btn-close-product-modal");
  dom.btnCancelProduct = document.getElementById("btn-cancel-product");

  // Settings Forms
  dom.settingsForm = document.getElementById("settings-form");
  dom.settingsShopName = document.getElementById("settings-shop-name");
  dom.settingsShopPhone = document.getElementById("settings-shop-phone");
  dom.settingsShopAddress = document.getElementById("settings-shop-address");
  dom.settingsTaxRate = document.getElementById("settings-tax-rate");
  dom.settingsReceiptGreeting = document.getElementById("settings-receipt-greeting");

  dom.settingsAuthForm = document.getElementById("settings-auth-form");
  dom.settingsAdminUser = document.getElementById("settings-admin-user");
  dom.settingsAdminPass = document.getElementById("settings-admin-pass");
  dom.settingsCashierUser = document.getElementById("settings-cashier-user");
  dom.settingsCashierPass = document.getElementById("settings-cashier-pass");
  dom.settingsRecoveryPin = document.getElementById("settings-recovery-pin");

  dom.settingsFirebaseForm = document.getElementById("settings-firebase-form");
  dom.settingsFirebaseEnable = document.getElementById("settings-firebase-enable");
  dom.settingsFbApiKey = document.getElementById("settings-fb-apikey");
  dom.settingsFbDbUrl = document.getElementById("settings-fb-dburl");
  dom.settingsFbProjectId = document.getElementById("settings-fb-projectid");
  dom.settingsFbAppId = document.getElementById("settings-fb-appid");

  // Database Management & Maintenance
  dom.btnOpenBackupModal = document.getElementById("btn-open-backup-modal");
  dom.backupModal = document.getElementById("backup-modal");
  dom.databaseBackupJson = document.getElementById("database-backup-json");
  dom.btnCloseBackupModal = document.getElementById("btn-close-backup-modal");
  dom.btnCloseBackup = document.getElementById("btn-close-backup");
  dom.btnCopyBackup = document.getElementById("btn-copy-backup");
  dom.settingsDbPruneForm = document.getElementById("settings-db-prune-form");
  dom.settingsPruneType = document.getElementById("settings-prune-type");
  dom.settingsPruneDateGroup = document.getElementById("settings-prune-date-group");
  dom.settingsPruneDate = document.getElementById("settings-prune-date");
  dom.btnResetStock = document.getElementById("btn-reset-stock");
  dom.btnRestoreSeeds = document.getElementById("btn-restore-seeds");
  dom.btnFactoryReset = document.getElementById("btn-factory-reset");

  // Receipt Modal
  dom.receiptModal = document.getElementById("receipt-modal");
  dom.receiptPrintArea = document.getElementById("receipt-print-area");
  dom.btnSaveReceipt = document.getElementById("btn-print-receipt");
  dom.btnCloseReceiptModal = document.getElementById("btn-close-receipt-modal");
  dom.btnCloseReceipt = document.getElementById("btn-close-receipt");

  // Set default date value inside the header picker and bind listener
  dom.dashboardDatePicker.value = AppState.dashboardSelectedDate;
  dom.dashboardDatePicker.addEventListener("change", handleDashboardDateChange);
  updateStatsLabels();
  updateSidebarBrand();
  updateSyncStatusUI();

  // Bind Navigation
  dom.navItems.forEach(item => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const view = item.getAttribute("data-view");
      switchView(view);
    });
  });

  // --- Auth UI Listeners ---
  dom.loginForm.addEventListener("submit", handleLoginSubmit);
  dom.btnLogout.addEventListener("click", handleLogoutClick);
  dom.btnGotoForgot.addEventListener("click", (e) => {
    e.preventDefault();
    dom.loginForm.style.display = "none";
    dom.recoveryForm.style.display = "block";
    dom.recoveryForm.reset();
    hideAuthMessages();
  });
  dom.btnGotoLogin.addEventListener("click", (e) => {
    e.preventDefault();
    dom.recoveryForm.style.display = "none";
    dom.loginForm.style.display = "block";
    dom.loginForm.reset();
    hideAuthMessages();
  });
  dom.recoveryForm.addEventListener("submit", handleRecoverySubmit);

  // --- Dashboard Trend & Transactions Control Listeners ---
  dom.chartRangeSelect.addEventListener("change", (e) => {
    AppState.dashboardChartRange = e.target.value;
    renderDashboardChartHeader();
    renderWeeklySalesChart();
  });

  dom.txSearchInput.addEventListener("input", (e) => {
    AppState.txSearchQuery = e.target.value.toLowerCase().trim();
    renderTransactionsTable();
  });

  // --- POS Redesigned Autocomplete Listeners ---
  dom.posProductSearch.addEventListener("input", (e) => {
    handleSearchInput(e.target.value);
  });

  dom.posProductSearch.addEventListener("focus", (e) => {
    handleSearchInput(e.target.value);
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".dropdown-container")) {
      hideSuggestions();
    }
  });

  dom.btnClearSearchInput.addEventListener("click", clearSearchSelection);
  dom.posProductSearch.addEventListener("keydown", handleSearchKeyboardNav);
  dom.posSellMethod.addEventListener("change", handleBillingMethodChange);
  dom.posQuickAddForm.addEventListener("submit", handleQuickAddSubmit);

  // Payment inputs and clear cart
  dom.btnClearCart.addEventListener("click", () => {
    AppState.cart = [];
    renderCartTable();
  });

  dom.discountInput.addEventListener("input", () => {
    let val = parseInt(dom.discountInput.value) || 0;
    if (val < 0) dom.discountInput.value = 0;
    if (val > 100) dom.discountInput.value = 100;
    updateCartTotals();
  });

  dom.btnCheckout.addEventListener("click", processCheckout);

  // --- Inventory Listeners ---
  dom.inventorySearch.addEventListener("input", (e) => {
    AppState.inventorySearchQuery = e.target.value.toLowerCase().trim();
    renderInventoryTable();
  });

  // Modals actions
  dom.btnAddProduct.addEventListener("click", () => openProductModal(null));
  dom.btnCloseProductModal.addEventListener("click", closeProductModal);
  dom.btnCancelProduct.addEventListener("click", closeProductModal);
  dom.productForm.addEventListener("submit", handleProductFormSubmit);

  // Settings Save actions
  dom.settingsForm.addEventListener("submit", handleShopSettingsSubmit);
  dom.settingsAuthForm.addEventListener("submit", handleAuthSettingsSubmit);
  dom.settingsFirebaseForm.addEventListener("submit", handleFirebaseSettingsSubmit);

  // Receipt modal actions
  dom.btnCloseReceiptModal.addEventListener("click", closeReceiptModal);
  dom.btnCloseReceipt.addEventListener("click", closeReceiptModal);
  dom.btnSaveReceipt.addEventListener("click", () => window.print());

  // Database Management Actions
  dom.btnOpenBackupModal.addEventListener("click", openBackupModal);
  dom.btnCloseBackupModal.addEventListener("click", closeBackupModal);
  dom.btnCloseBackup.addEventListener("click", closeBackupModal);
  dom.btnCopyBackup.addEventListener("click", copyBackupToClipboard);
  dom.settingsPruneType.addEventListener("change", handlePruneTypeChange);
  dom.settingsDbPruneForm.addEventListener("submit", handleDbPruneSubmit);
  dom.btnResetStock.addEventListener("click", handleResetStockClick);
  dom.btnRestoreSeeds.addEventListener("click", handleRestoreSeedsClick);
  dom.btnFactoryReset.addEventListener("click", handleFactoryResetClick);
}

// -------------------------------------------------------------
// 4. Central Firebase Connection Settings
// -------------------------------------------------------------
function initFirebase() {
  const s = AppState.settings;
  if (!s.firebaseEnabled || !s.firebaseApiKey || !s.firebaseDbUrl || !s.firebaseProjectId || !s.firebaseAppId) {
    AppState.firebaseSyncActive = false;
    console.log("Firebase sync disabled. Running locally.");
    updateSyncStatusUI();
    return;
  }

  try {
    if (firebase.apps.length === 0) {
      firebase.initializeApp({
        apiKey: s.firebaseApiKey,
        databaseURL: s.firebaseDbUrl,
        projectId: s.firebaseProjectId,
        appId: s.firebaseAppId
      });
    }
    database = firebase.database();
    AppState.firebaseSyncActive = true;
    console.log("Firebase Cloud Database Connected.");
    setupFirebaseSync();
    updateSyncStatusUI();
  } catch (err) {
    console.error("Firebase Connection Failed: ", err);
    AppState.firebaseSyncActive = false;
    updateSyncStatusUI();
    alert("Could not connect to Firebase database. Check your internet connection or keys. Reverting to Offline Mode.");
  }
}

function setupFirebaseSync() {
  // Sync inventory
  database.ref("inventory").on("value", snapshot => {
    const data = snapshot.val();
    if (data) {
      AppState.inventory = data;
      localStorage.setItem("veg_store_db", JSON.stringify(data));
      if (AppState.currentUserRole) {
        if (AppState.currentView === "inventory") renderInventoryTable();
        if (AppState.currentView === "dashboard") renderDashboard();
      }
    } else {
      // Seed Firebase if empty
      database.ref("inventory").set(AppState.inventory);
    }
  });

  // Sync transactions
  database.ref("transactions").on("value", snapshot => {
    const data = snapshot.val() || [];
    AppState.transactions = data;
    localStorage.setItem("veg_store_tx", JSON.stringify(data));
    if (AppState.currentUserRole && AppState.currentView === "dashboard") {
      renderDashboard();
    }
  });

  // Sync shop profile configs
  database.ref("settings").on("value", snapshot => {
    const data = snapshot.val();
    if (data) {
      // Retain localized Firebase sync credentials to prevent locking other devices out of local Firebase instances
      const fbConfig = {
        firebaseEnabled: AppState.settings.firebaseEnabled,
        firebaseApiKey: AppState.settings.firebaseApiKey,
        firebaseDbUrl: AppState.settings.firebaseDbUrl,
        firebaseProjectId: AppState.settings.firebaseProjectId,
        firebaseAppId: AppState.settings.firebaseAppId
      };
      
      AppState.settings = { ...data, ...fbConfig };
      localStorage.setItem("veg_store_settings", JSON.stringify(AppState.settings));
      updateSidebarBrand();
      if (AppState.currentUserRole && AppState.currentView === "dashboard") {
        renderDashboard();
      }
    } else {
      database.ref("settings").set(AppState.settings);
    }
  });

  // Sync users authentication
  database.ref("auth").on("value", snapshot => {
    const data = snapshot.val();
    if (data) {
      AppState.auth = data;
      localStorage.setItem("veg_store_auth", JSON.stringify(data));
    } else {
      database.ref("auth").set(AppState.auth);
    }
  });
}

// -------------------------------------------------------------
// 5. Authentication Controllers & Security PIN Recovery
// -------------------------------------------------------------
function checkSession() {
  const savedRole = localStorage.getItem("freshcart_session");
  if (savedRole === "admin" || savedRole === "cashier") {
    AppState.currentUserRole = savedRole;
    dom.loginOverlay.classList.remove("active");
    applyRolePermissions();
  } else {
    AppState.currentUserRole = null;
    dom.loginOverlay.classList.add("active");
  }
}

function handleLoginSubmit(e) {
  e.preventDefault();
  const username = dom.loginUsername.value.trim();
  const password = dom.loginPassword.value.trim();
  const a = AppState.auth;

  let role = null;
  if (username === a.adminUser && password === a.adminPass) {
    role = "admin";
  } else if (username === a.cashierUser && password === a.cashierPass) {
    role = "cashier";
  }

  if (role) {
    AppState.currentUserRole = role;
    localStorage.setItem("freshcart_session", role);
    dom.loginOverlay.classList.remove("active");
    dom.loginForm.reset();
    hideAuthMessages();
    applyRolePermissions();
    switchView("dashboard");
  } else {
    dom.loginErrorMsg.innerText = "Invalid username or password. Check credentials or try resetting.";
    dom.loginErrorMsg.style.display = "block";
  }
}

function handleLogoutClick(e) {
  e.preventDefault();
  if (confirm("Are you sure you want to log out of your session?")) {
    localStorage.removeItem("freshcart_session");
    AppState.currentUserRole = null;
    dom.loginOverlay.classList.add("active");
    applyRolePermissions();
  }
}

function handleRecoverySubmit(e) {
  e.preventDefault();
  const pin = dom.recoveryPin.value.trim();
  const roleToReset = dom.recoveryRole.value;
  const newUsername = dom.recoveryNewUser.value.trim();
  const newPassword = dom.recoveryNewPass.value.trim();

  if (pin !== AppState.auth.recoveryPin) {
    dom.recoveryErrorMsg.innerText = "Incorrect Security PIN. Credentials Reset Denied.";
    dom.recoveryErrorMsg.style.display = "block";
    dom.recoverySuccessMsg.style.display = "none";
    return;
  }

  const updatedAuth = { ...AppState.auth };
  if (roleToReset === "admin") {
    updatedAuth.adminUser = newUsername;
    updatedAuth.adminPass = newPassword;
  } else {
    updatedAuth.cashierUser = newUsername;
    updatedAuth.cashierPass = newPassword;
  }

  StoreDatabase.saveAuth(updatedAuth);
  AppState.auth = updatedAuth;

  dom.recoveryErrorMsg.style.display = "none";
  dom.recoverySuccessMsg.innerText = "Credentials successfully reset! Returning to Login Portal...";
  dom.recoverySuccessMsg.style.display = "block";

  setTimeout(() => {
    dom.recoveryForm.style.display = "none";
    dom.loginForm.style.display = "block";
    dom.loginForm.reset();
    hideAuthMessages();
  }, 2500);
}

function hideAuthMessages() {
  dom.loginErrorMsg.style.display = "none";
  dom.recoveryErrorMsg.style.display = "none";
  dom.recoverySuccessMsg.style.display = "none";
}

function applyRolePermissions() {
  const role = AppState.currentUserRole;
  
  if (!role) {
    dom.sidebarRoleLabel.innerText = "Guest";
    return;
  }

  const isAdmin = (role === "admin");
  dom.sidebarRoleLabel.innerText = isAdmin ? "Administrator" : "Cashier Staff";

  // Hide or Show menu elements
  dom.navInventory.style.display = isAdmin ? "flex" : "none";
  dom.navSettings.style.display = isAdmin ? "flex" : "none";

  // Toggle visual states for admin actions (refund/deletes columns)
  document.querySelectorAll(".role-admin-only").forEach(el => {
    el.classList.toggle("hidden", !isAdmin);
  });

  // Re-render components to adapt row actions
  if (AppState.currentView === "dashboard") {
    renderDashboard();
  }
}

// -------------------------------------------------------------
// 6. View Controls & Rendering
// -------------------------------------------------------------

function handleDashboardDateChange(e) {
  let val = e.target.value;
  if (!val) {
    val = getLocalDateString();
    dom.dashboardDatePicker.value = val;
  }
  AppState.dashboardSelectedDate = val;
  updateStatsLabels();
  
  if (AppState.currentView === "dashboard") {
    renderDashboard();
  }
}

function updateStatsLabels() {
  const selectedDate = new Date(AppState.dashboardSelectedDate);
  const formattedDate = selectedDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  
  dom.labelRevenue.innerText = `Revenue (${formattedDate})`;
  dom.labelSalesCount.innerText = `Sales (${formattedDate})`;
  dom.txCardTitle.innerText = `Transactions (${formattedDate})`;
}

function updateSidebarBrand() {
  if (dom.sidebarShopName) {
    dom.sidebarShopName.innerText = AppState.settings.shopName;
  }
}

function updateSyncStatusUI() {
  if (!dom.sidebarStatusDot || !dom.sidebarStatusText) return;
  if (AppState.firebaseSyncActive) {
    dom.sidebarStatusDot.className = "status-indicator online";
    dom.sidebarStatusText.innerText = "Cloud Synced";
  } else {
    dom.sidebarStatusDot.className = "status-indicator offline";
    dom.sidebarStatusText.innerText = "Local Offline";
  }
}

function switchView(viewName) {
  // Role checks: Cashier cannot access Inventory or Settings
  if (AppState.currentUserRole === "cashier" && (viewName === "inventory" || viewName === "settings")) {
    viewName = "dashboard";
  }

  AppState.currentView = viewName;
  
  dom.navItems.forEach(item => {
    if (item.getAttribute("data-view") === viewName) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });

  renderCurrentView();
}

function renderCurrentView() {
  Object.keys(dom.views).forEach(key => {
    if (key === AppState.currentView) {
      dom.views[key].classList.add("active");
    } else {
      dom.views[key].classList.remove("active");
    }
  });

  if (AppState.currentView === "dashboard") {
    dom.viewTitle.innerText = "Dashboard Overview";
    dom.viewSubtitle.innerText = "Real-time look at your store's sales and current stock.";
    dom.txSearchInput.value = "";
    AppState.txSearchQuery = "";
    renderDashboard();
  } else if (AppState.currentView === "pos") {
    dom.viewTitle.innerText = "Point of Sale (POS) Billing";
    dom.viewSubtitle.innerText = "Fast billing by searching product name and adding weight.";
    clearSearchSelection();
    renderCartTable();
  } else if (AppState.currentView === "inventory") {
    dom.viewTitle.innerText = "Inventory Stock Ledger";
    dom.viewSubtitle.innerText = "Add new items, adjust stock levels, and set price thresholds.";
    renderInventoryTable();
  } else if (AppState.currentView === "settings") {
    dom.viewTitle.innerText = "Store Configuration Settings";
    dom.viewSubtitle.innerText = "Customize shop name, address, default sales tax rate, and credentials.";
    loadSettingsInputs();
  }

  lucide.createIcons();
}

// --- DASHBOARD VIEW ---
function renderDashboard() {
  const selectedDateStr = AppState.dashboardSelectedDate;
  
  // Calculate Stats based on selected date
  const selectedDayTransactions = AppState.transactions.filter(tx => {
    return new Date(tx.timestamp).toISOString().split('T')[0] === selectedDateStr;
  });
  
  const selectedDayRevenue = selectedDayTransactions.reduce((sum, tx) => sum + tx.total, 0);
  const selectedDaySalesCount = selectedDayTransactions.length;
  
  const totalStockWeight = AppState.inventory.reduce((sum, item) => sum + item.stock, 0);
  const lowStockCount = AppState.inventory.filter(item => item.stock <= item.alertLimit).length;

  dom.statRevenue.innerText = formatRupees(selectedDayRevenue);
  dom.statSalesCount.innerText = selectedDaySalesCount;
  dom.statStockWeight.innerText = `${totalStockWeight.toFixed(1)} kg`;
  dom.statLowStockCount.innerText = lowStockCount;

  // Render Low Stock list
  const lowStockItems = AppState.inventory.filter(item => item.stock <= item.alertLimit);
  dom.lowStockList.innerHTML = "";
  
  if (lowStockItems.length === 0) {
    dom.lowStockList.innerHTML = `
      <div class="alert-empty-state">
        <i data-lucide="check-circle-2"></i>
        <span>All Stocks Healthy!</span>
        <p>No vegetables are currently running low.</p>
      </div>
    `;
  } else {
    lowStockItems.forEach(item => {
      const alertDiv = document.createElement("div");
      alertDiv.className = "alert-item";
      alertDiv.innerHTML = `
        <span class="alert-item-emoji">${item.emoji}</span>
        <div class="alert-item-info">
          <div class="alert-item-name">${item.name}</div>
          <div class="alert-item-stock">Stock: ${item.stock.toFixed(2)} kg (Limit: ${item.alertLimit} kg)</div>
        </div>
        <span class="badge badge-danger">Restock</span>
      `;
      dom.lowStockList.appendChild(alertDiv);
    });
  }

  renderDashboardChartHeader();
  renderTransactionsTable();
  renderWeeklySalesChart();
}

function renderDashboardChartHeader() {
  if (AppState.dashboardChartRange === "today") {
    dom.chartCardTitle.innerText = "Hourly Sales Trend (Today)";
    dom.chartCardSubtitle.innerText = "Hourly sales revenue breakdown for today";
  } else if (AppState.dashboardChartRange === "7days") {
    dom.chartCardTitle.innerText = "Weekly Sales Trend (Rs.)";
    dom.chartCardSubtitle.innerText = "Daily revenue summary for the last 7 days";
  } else if (AppState.dashboardChartRange === "30days") {
    dom.chartCardTitle.innerText = "Monthly Sales Trend (Rs.)";
    dom.chartCardSubtitle.innerText = "Daily revenue summary for the last 30 days";
  }
}

function renderTransactionsTable() {
  dom.recentTransactionsTbody.innerHTML = "";
  
  let filteredTxs = [];
  
  if (AppState.txSearchQuery) {
    filteredTxs = AppState.transactions.filter(tx => tx.id.toLowerCase().includes(AppState.txSearchQuery));
  } else {
    filteredTxs = AppState.transactions.filter(tx => {
      return new Date(tx.timestamp).toISOString().split('T')[0] === AppState.dashboardSelectedDate;
    });
  }

  const sortedTxs = [...filteredTxs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  const displayLimit = AppState.txSearchQuery ? 15 : 10;
  const transactionsToDisplay = sortedTxs.slice(0, displayLimit);

  if (transactionsToDisplay.length === 0) {
    dom.recentTransactionsTbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-muted" style="text-align: center; padding: 2rem;">
          ${AppState.txSearchQuery ? "No matching invoice found." : "No transactions logged on this date."}
        </td>
      </tr>
    `;
    return;
  }

  const isAdmin = (AppState.currentUserRole === "admin");

  transactionsToDisplay.forEach(tx => {
    const timestampObj = new Date(tx.timestamp);
    const timeStr = timestampObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = timestampObj.toLocaleDateString([], { month: 'short', day: 'numeric' });
    const dateTimeStr = `${dateStr} ${timeStr}`;
    
    const itemsText = tx.items.map(it => `${it.name} (${it.weight.toFixed(2)}${it.sellUnit === 'kg' ? 'kg' : 'pcs'})`).join(", ");
    
    const tr = document.createElement("tr");

    // Conditionally display refund button for admins only. Cashiers can only reprint.
    const actionButtonsHTML = isAdmin 
      ? `<div class="action-buttons">
          <button class="btn-icon btn-reprint" title="Reprint Receipt" onclick="reprintReceipt('${tx.id}')">
            <i data-lucide="printer"></i>
          </button>
          <button class="btn-icon btn-delete" title="Refund / Delete Transaction" onclick="refundTransaction('${tx.id}')">
            <i data-lucide="rotate-ccw"></i>
          </button>
         </div>`
      : `<div class="action-buttons">
          <button class="btn-icon btn-reprint" title="Reprint Receipt" onclick="reprintReceipt('${tx.id}')">
            <i data-lucide="printer"></i>
          </button>
         </div>`;

    tr.innerHTML = `
      <td style="font-weight: 600; color: var(--primary);">${tx.id}</td>
      <td>${dateTimeStr}</td>
      <td style="max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${itemsText}">
        ${itemsText}
      </td>
      <td>Rs. ${tx.subtotal.toFixed(2)}</td>
      <td>${tx.discountPercent > 0 ? `${tx.discountPercent}% (Rs. ${tx.discount.toFixed(2)})` : '-'}</td>
      <td style="font-weight: 700; color: var(--primary-dark);">${formatRupees(tx.total)}</td>
      <td class="text-right role-admin-only-cell">${actionButtonsHTML}</td>
    `;

    // Strip actions cell for non-admins to ensure cleaner layout alignment
    if (!isAdmin) {
      const cell = tr.querySelector(".role-admin-only-cell");
      if (cell) cell.style.display = "none";
    }

    dom.recentTransactionsTbody.appendChild(tr);
  });

  lucide.createIcons();
}

window.reprintReceipt = function(txId) {
  const tx = AppState.transactions.find(t => t.id === txId);
  if (tx) {
    openReceiptModal(tx);
  }
};

window.refundTransaction = function(txId) {
  if (AppState.currentUserRole !== "admin") {
    alert("Authorization Denied: Only Administrators can refund sales.");
    return;
  }

  const index = AppState.transactions.findIndex(t => t.id === txId);
  if (index === -1) return;

  const tx = AppState.transactions[index];
  
  if (confirm(`Are you sure you want to refund invoice ${tx.id}? This will remove the transaction, adjust sales values, and return all quantities back to stock.`)) {
    
    tx.items.forEach(soldItem => {
      const inventoryItem = AppState.inventory.find(i => i.id === soldItem.id);
      if (inventoryItem) {
        inventoryItem.stock = parseFloat((inventoryItem.stock + soldItem.weight).toFixed(2));
      }
    });

    AppState.transactions.splice(index, 1);

    StoreDatabase.saveInventory(AppState.inventory);
    StoreDatabase.saveTransactions(AppState.transactions);

    renderDashboard();
    alert(`Invoice ${txId} successfully refunded and item stocks updated!`);
  }
};

function renderWeeklySalesChart() {
  dom.chartContainer.innerHTML = "";
  
  let chartDataPoints = [];
  let yCeilingVal = 5000;
  let stepsCount = 4;
  let width = 550;
  let height = 240;
  let paddingLeft = 60;
  let paddingRight = 20;
  let paddingTop = 20;
  let paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const selectedCenterDate = new Date(AppState.dashboardSelectedDate);

  if (AppState.dashboardChartRange === "today") {
    const slots = [8, 10, 12, 14, 16, 18, 20];
    chartDataPoints = slots.map(hour => {
      return {
        label: `${hour % 12 || 12}${hour >= 12 ? 'PM' : 'AM'}`,
        hourLimit: hour,
        totalSales: 0
      };
    });

    const filterDateStr = getLocalDateString(selectedCenterDate);
    AppState.transactions.forEach(tx => {
      const txDate = new Date(tx.timestamp);
      if (getLocalDateString(txDate) === filterDateStr) {
        const txHour = txDate.getHours();
        const matchedSlot = chartDataPoints.find(slot => txHour <= slot.hourLimit) || chartDataPoints[chartDataPoints.length - 1];
        matchedSlot.totalSales += tx.total;
      }
    });

    yCeilingVal = Math.max(...chartDataPoints.map(d => d.totalSales), 2000);
    yCeilingVal = Math.ceil(yCeilingVal / 1000) * 1000;

  } else if (AppState.dashboardChartRange === "7days") {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(selectedCenterDate);
      d.setDate(selectedCenterDate.getDate() - i);
      chartDataPoints.push({
        dateString: d.toDateString(),
        label: d.toLocaleDateString([], { weekday: 'short' }),
        totalSales: 0
      });
    }

    AppState.transactions.forEach(tx => {
      const txDateStr = new Date(tx.timestamp).toDateString();
      const match = chartDataPoints.find(day => day.dateString === txDateStr);
      if (match) match.totalSales += tx.total;
    });

    yCeilingVal = Math.max(...chartDataPoints.map(d => d.totalSales), 5000);
    yCeilingVal = Math.ceil(yCeilingVal / 5000) * 5000;

  } else if (AppState.dashboardChartRange === "30days") {
    for (let i = 29; i >= 0; i--) {
      const d = new Date(selectedCenterDate);
      d.setDate(selectedCenterDate.getDate() - i);
      chartDataPoints.push({
        dateString: d.toDateString(),
        label: d.getDate().toString(),
        totalSales: 0
      });
    }

    AppState.transactions.forEach(tx => {
      const txDateStr = new Date(tx.timestamp).toDateString();
      const match = chartDataPoints.find(day => day.dateString === txDateStr);
      if (match) match.totalSales += tx.total;
    });

    yCeilingVal = Math.max(...chartDataPoints.map(d => d.totalSales), 10000);
    yCeilingVal = Math.ceil(yCeilingVal / 5000) * 5000;
  }

  // Coordinate calculators
  const nPoints = chartDataPoints.length;
  function getX(index) {
    return paddingLeft + (index * (chartWidth / (nPoints - 1)));
  }
  function getY(value) {
    return paddingTop + chartHeight - ((value / yCeilingVal) * chartHeight);
  }

  // Render SVG
  let svgContent = `
    <svg class="chart-svg" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.4"/>
          <stop offset="100%" stop-color="var(--accent)" stop-opacity="0.0"/>
        </linearGradient>
      </defs>
  `;

  for (let i = 0; i <= stepsCount; i++) {
    const yVal = (yCeilingVal / stepsCount) * i;
    const yCoord = getY(yVal);
    svgContent += `<line class="chart-grid-line" x1="${paddingLeft}" y1="${yCoord}" x2="${width - paddingRight}" y2="${yCoord}" />`;
    
    let yText = `Rs. ${Math.round(yVal)}`;
    if (yVal >= 1000) {
      yText = `Rs. ${(yVal / 1000).toFixed(0)}k`;
    }
    svgContent += `<text class="chart-axis-text" x="${paddingLeft - 10}" y="${yCoord + 4}" text-anchor="end">${yText}</text>`;
  }

  const points = chartDataPoints.map((pt, index) => {
    return { x: getX(index), y: getY(pt.totalSales), label: pt.label, val: pt.totalSales };
  });

  let areaPath = `M ${points[0].x} ${paddingTop + chartHeight} `;
  points.forEach(pt => { areaPath += `L ${pt.x} ${pt.y} `; });
  areaPath += `L ${points[points.length - 1].x} ${paddingTop + chartHeight} Z`;
  svgContent += `<path class="chart-area" d="${areaPath}" />`;

  let linePath = `M ${points[0].x} ${points[0].y} `;
  for (let i = 1; i < points.length; i++) {
    linePath += `L ${points[i].x} ${points[i].y} `;
  }
  svgContent += `<path class="chart-line" d="${linePath}" />`;

  points.forEach((pt, index) => {
    const dotRadius = AppState.dashboardChartRange === "30days" ? 3.5 : 5;
    svgContent += `<circle class="chart-dot" cx="${pt.x}" cy="${pt.y}" r="${dotRadius}">
      <title>${pt.label}: Rs. ${pt.val.toFixed(2)}</title>
    </circle>`;
    
    let showLabel = true;
    if (AppState.dashboardChartRange === "30days") {
      showLabel = (index % 3 === 0);
    }
    if (showLabel) {
      svgContent += `<text class="chart-axis-text" x="${pt.x}" y="${height - 10}" text-anchor="middle">${pt.label}</text>`;
    }
  });

  svgContent += `</svg>`;
  dom.chartContainer.innerHTML = svgContent;
}

// --- POS BILLING ---
function handleSearchInput(query) {
  const term = query.toLowerCase().trim();
  
  if (term.length === 0) {
    AppState.posSearchSuggestions = AppState.inventory.slice(0, 6);
    dom.btnClearSearchInput.style.display = "none";
  } else {
    AppState.posSearchSuggestions = AppState.inventory.filter(item => {
      return item.name.toLowerCase().includes(term) || item.category.toLowerCase().includes(term);
    });
    dom.btnClearSearchInput.style.display = "flex";
  }

  AppState.posHighlightedSuggestionIndex = -1;
  renderSuggestionsList();
}

function renderSuggestionsList() {
  dom.posDropdownSuggestions.innerHTML = "";
  
  if (AppState.posSearchSuggestions.length === 0) {
    dom.posDropdownSuggestions.innerHTML = `
      <div style="padding: 1rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
        No vegetables matching this name.
      </div>
    `;
    dom.posDropdownSuggestions.classList.add("active");
    return;
  }

  AppState.posSearchSuggestions.forEach((item, index) => {
    const itemDiv = document.createElement("div");
    itemDiv.className = "suggestion-item";
    if (index === AppState.posHighlightedSuggestionIndex) {
      itemDiv.classList.add("highlighted");
    }

    const isOutOfStock = item.stock <= 0;
    const isLowStock = item.stock > 0 && item.stock <= item.alertLimit;
    
    const displayUnit = item.sellUnit === 'kg' ? 'kg' : 'piece';
    let stockStatusText = `${item.stock.toFixed(2)} kg available`;
    
    if (isOutOfStock) {
      stockStatusText = `<span class="out-of-stock">OUT OF STOCK</span>`;
    } else if (isLowStock) {
      stockStatusText = `<span class="low-stock">LOW STOCK (${item.stock.toFixed(2)} kg)</span>`;
    }

    itemDiv.innerHTML = `
      <span class="suggestion-emoji">${item.emoji}</span>
      <div class="suggestion-info">
        <span class="suggestion-name">${item.name}</span>
        <div class="suggestion-meta">
          <span>Rs. ${item.price.toFixed(2)} / ${displayUnit}</span>
          <span>${stockStatusText}</span>
        </div>
      </div>
    `;

    itemDiv.addEventListener("click", () => {
      selectProduct(item);
    });

    dom.posDropdownSuggestions.appendChild(itemDiv);
  });

  dom.posDropdownSuggestions.classList.add("active");
}

function handleSearchKeyboardNav(e) {
  const count = AppState.posSearchSuggestions.length;
  if (!dom.posDropdownSuggestions.classList.contains("active") || count === 0) return;

  if (e.key === "ArrowDown") {
    e.preventDefault();
    AppState.posHighlightedSuggestionIndex = (AppState.posHighlightedSuggestionIndex + 1) % count;
    renderSuggestionsList();
    scrollActiveSuggestionIntoView();
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    AppState.posHighlightedSuggestionIndex = (AppState.posHighlightedSuggestionIndex - 1 + count) % count;
    renderSuggestionsList();
    scrollActiveSuggestionIntoView();
  } else if (e.key === "Enter") {
    if (AppState.posHighlightedSuggestionIndex >= 0 && AppState.posHighlightedSuggestionIndex < count) {
      e.preventDefault();
      selectProduct(AppState.posSearchSuggestions[AppState.posHighlightedSuggestionIndex]);
    } else if (count > 0) {
      e.preventDefault();
      selectProduct(AppState.posSearchSuggestions[0]);
    }
  } else if (e.key === "Escape") {
    hideSuggestions();
  }
}

function scrollActiveSuggestionIntoView() {
  const container = dom.posDropdownSuggestions;
  const activeNode = container.querySelector(".suggestion-item.highlighted");
  if (!activeNode) return;

  const containerTop = container.scrollTop;
  const containerBottom = containerTop + container.clientHeight;
  const elemTop = activeNode.offsetTop;
  const elemBottom = elemTop + activeNode.clientHeight;

  if (elemTop < containerTop) {
    container.scrollTop = elemTop;
  } else if (elemBottom > containerBottom) {
    container.scrollTop = elemBottom - container.clientHeight;
  }
}

function selectProduct(product) {
  if (product.stock <= 0) {
    alert(`"${product.name}" is currently out of stock and cannot be added to the bill.`);
    return;
  }

  const displayUnit = product.sellUnit === 'kg' ? 'kg' : 'pcs';
  dom.posProductSearch.value = `${product.emoji} ${product.name} (Rs. ${product.price.toFixed(2)} / ${displayUnit})`;
  dom.posSelectedProductId.value = product.id;
  dom.btnClearSearchInput.style.display = "flex";
  
  dom.posSellMethod.innerHTML = "";
  
  if (product.sellUnit === "kg") {
    dom.posSellMethod.innerHTML = `
      <option value="weight" selected>By Weight (kg)</option>
      <option value="amount">By Amount (Rs.)</option>
    `;
  } else {
    dom.posSellMethod.innerHTML = `
      <option value="count" selected>By Count (pieces)</option>
      <option value="amount">By Amount (Rs.)</option>
    `;
  }

  hideSuggestions();
  handleBillingMethodChange();
  
  dom.posWeightInput.focus();
  dom.posWeightInput.select();
}

function handleBillingMethodChange() {
  const method = dom.posSellMethod.value;
  
  if (method === "weight") {
    dom.posInputLabel.innerText = "Weight Purchased";
    dom.posWeightUnit.innerText = "kg";
    dom.posWeightInput.step = "0.01";
    dom.posWeightInput.value = "1.00";
    dom.posWeightInput.min = "0.01";
  } else if (method === "count") {
    dom.posInputLabel.innerText = "Quantity Purchased";
    dom.posWeightUnit.innerText = "pcs";
    dom.posWeightInput.step = "1";
    dom.posWeightInput.value = "1";
    dom.posWeightInput.min = "1";
  } else if (method === "amount") {
    dom.posInputLabel.innerText = "Rupees Spent";
    dom.posWeightUnit.innerText = "Rs.";
    dom.posWeightInput.step = "10";
    dom.posWeightInput.value = "100";
    dom.posWeightInput.min = "1";
  }
}

function clearSearchSelection() {
  dom.posProductSearch.value = "";
  dom.posSelectedProductId.value = "";
  dom.btnClearSearchInput.style.display = "none";
  AppState.posHighlightedSuggestionIndex = -1;
  AppState.posSearchSuggestions = [];
  
  dom.posSellMethod.innerHTML = `
    <option value="weight" selected>By Weight (kg)</option>
    <option value="amount">By Amount (Rs.)</option>
    <option value="count">By Count (pcs)</option>
  `;
  handleBillingMethodChange();
  hideSuggestions();
}

function hideSuggestions() {
  dom.posDropdownSuggestions.classList.remove("active");
}

function handleQuickAddSubmit(e) {
  e.preventDefault();
  
  const productId = dom.posSelectedProductId.value;
  const inputVal = parseFloat(dom.posWeightInput.value);
  const method = dom.posSellMethod.value;

  if (!productId) {
    alert("Please search and select a valid vegetable product from the dropdown list first.");
    dom.posProductSearch.focus();
    return;
  }

  const product = AppState.inventory.find(i => i.id === productId);
  if (!product) return;

  if (isNaN(inputVal) || inputVal <= 0) {
    alert("Please enter a valid positive value inside the text field.");
    dom.posWeightInput.focus();
    return;
  }

  let weightToAdd = 0;
  
  if (method === "weight" || method === "count") {
    weightToAdd = inputVal;
  } else if (method === "amount") {
    weightToAdd = inputVal / product.price;
  }

  const existingCartItem = AppState.cart.find(it => it.productId === productId);
  const currentWeightInCart = existingCartItem ? existingCartItem.weight : 0;
  const requestedTotalWeight = currentWeightInCart + weightToAdd;

  if (requestedTotalWeight > product.stock) {
    const unitDisplay = product.sellUnit === 'kg' ? 'kg' : 'pcs';
    alert(`Insufficient Stock! Cannot add. Total requested quantity of ${requestedTotalWeight.toFixed(2)}${unitDisplay} exceeds available inventory of ${product.stock.toFixed(2)}kg for ${product.name}.`);
    dom.posWeightInput.focus();
    return;
  }

  if (existingCartItem) {
    existingCartItem.weight = parseFloat(requestedTotalWeight.toFixed(3));
  } else {
    AppState.cart.push({
      productId: productId,
      weight: parseFloat(weightToAdd.toFixed(3))
    });
  }

  renderCartTable();
  clearSearchSelection();
  dom.posWeightInput.value = "1.00";
  dom.posProductSearch.focus();
}

function renderCartTable() {
  dom.posBillTbody.innerHTML = "";
  
  if (AppState.cart.length === 0) {
    dom.posEmptyCartState.style.display = "flex";
    dom.posBillTable.style.display = "none";
    dom.btnCheckout.disabled = true;
    updateCartTotals();
    return;
  }

  dom.posEmptyCartState.style.display = "none";
  dom.posBillTable.style.display = "table";
  dom.btnCheckout.disabled = false;

  AppState.cart.forEach((cartItem, index) => {
    const prod = AppState.inventory.find(i => i.id === cartItem.productId);
    if (!prod) return;

    const rowTotal = prod.price * cartItem.weight;
    const unitLabel = prod.sellUnit === 'kg' ? 'kg' : 'pcs';
    const priceDisplayUnit = prod.sellUnit === 'kg' ? 'kg' : 'piece';

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>
        <div class="product-column">
          <span class="inventory-emoji">${prod.emoji}</span>
          <div class="product-name-info">
            <span style="font-weight:600;">${prod.name}</span>
          </div>
        </div>
      </td>
      <td>${prod.category}</td>
      <td class="text-right" style="font-weight:500;">Rs. ${prod.price.toFixed(2)} / ${priceDisplayUnit}</td>
      <td class="text-right">
        <span class="qty-badge-weight">${cartItem.weight.toFixed(3)} ${unitLabel}</span>
      </td>
      <td class="text-right" style="font-weight: 700; color: var(--primary-dark);">Rs. ${rowTotal.toFixed(2)}</td>
      <td class="text-right">
        <button class="btn-remove-item" onclick="removeCartItem(${index})" title="Remove item">
          <i data-lucide="trash-2"></i>
        </button>
      </td>
    `;
    dom.posBillTbody.appendChild(tr);
  });

  lucide.createIcons();
  updateCartTotals();
}

window.removeCartItem = function(index) {
  AppState.cart.splice(index, 1);
  renderCartTable();
};

function updateCartTotals() {
  let subtotal = 0;
  AppState.cart.forEach(cartItem => {
    const prod = AppState.inventory.find(i => i.id === cartItem.productId);
    if (prod) {
      subtotal += prod.price * cartItem.weight;
    }
  });

  const discountPercent = parseInt(dom.discountInput.value) || 0;
  const discountAmount = subtotal * (discountPercent / 100);
  const taxableAmount = subtotal - discountAmount;
  
  const taxRatePercent = AppState.settings.taxRate;
  const taxAmount = taxableAmount * (taxRatePercent / 100);
  const total = taxableAmount + taxAmount;

  dom.summarySubtotal.innerText = `Rs. ${subtotal.toFixed(2)}`;
  dom.summaryTax.previousElementSibling.innerText = `Tax (${taxRatePercent.toFixed(1)}%)`;
  dom.summaryTax.innerText = `Rs. ${taxAmount.toFixed(2)}`;
  dom.summaryTotal.innerText = `Rs. ${total.toFixed(2)}`;
}

function processCheckout() {
  if (AppState.cart.length === 0) return;

  let stockValidated = true;
  AppState.cart.forEach(cartItem => {
    const prod = AppState.inventory.find(i => i.id === cartItem.productId);
    if (!prod || prod.stock < cartItem.weight) {
      alert(`Transaction failed: Insufficient stock for ${prod ? prod.name : 'item'}.`);
      stockValidated = false;
    }
  });

  if (!stockValidated) return;

  const invoiceItems = [];
  let subtotal = 0;
  
  AppState.cart.forEach(cartItem => {
    const prod = AppState.inventory.find(i => i.id === cartItem.productId);
    
    prod.stock = parseFloat((prod.stock - cartItem.weight).toFixed(2));
    const cost = prod.price * cartItem.weight;
    subtotal += cost;
    
    invoiceItems.push({
      id: prod.id,
      name: prod.name,
      emoji: prod.emoji,
      price: prod.price,
      weight: cartItem.weight,
      sellUnit: prod.sellUnit,
      total: parseFloat(cost.toFixed(2))
    });
  });

  const discountPercent = parseInt(dom.discountInput.value) || 0;
  const discountAmount = parseFloat((subtotal * (discountPercent / 100)).toFixed(2));
  const taxableAmount = subtotal - discountAmount;
  
  const taxRatePercent = AppState.settings.taxRate;
  const taxAmount = parseFloat((taxableAmount * (taxRatePercent / 100)).toFixed(2));
  const grandTotal = parseFloat((taxableAmount + taxAmount).toFixed(2));

  const txId = `TX-${Date.now().toString().slice(-4)}`;
  const timestamp = new Date().toISOString();

  const newTx = {
    id: txId,
    timestamp: timestamp,
    items: invoiceItems,
    subtotal: parseFloat(subtotal.toFixed(2)),
    discountPercent: discountPercent,
    discount: discountAmount,
    taxPercent: taxRatePercent,
    tax: taxAmount,
    total: grandTotal
  };

  AppState.transactions.push(newTx);
  
  StoreDatabase.saveInventory(AppState.inventory);
  StoreDatabase.saveTransactions(AppState.transactions);

  AppState.cart = [];
  dom.discountInput.value = 0;

  openReceiptModal(newTx);
}

// --- INVENTORY VIEW ---
function renderInventoryTable() {
  dom.inventoryTableTbody.innerHTML = "";

  const filtered = AppState.inventory.filter(item => {
    return item.name.toLowerCase().includes(AppState.inventorySearchQuery);
  });

  if (filtered.length === 0) {
    dom.inventoryTableTbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-muted" style="text-align: center; padding: 3rem 1rem;">
          No matching products found in stock ledger.
        </td>
      </tr>
    `;
    return;
  }

  filtered.forEach(item => {
    const tr = document.createElement("tr");
    
    const isOutOfStock = item.stock <= 0;
    const isLowStock = item.stock > 0 && item.stock <= item.alertLimit;

    let statusBadge = `<span class="badge badge-success">In Stock</span>`;
    if (isOutOfStock) {
      statusBadge = `<span class="badge badge-danger">Out of Stock</span>`;
    } else if (isLowStock) {
      statusBadge = `<span class="badge badge-warning">Low Stock</span>`;
    }

    tr.innerHTML = `
      <td>
        <div class="product-column">
          <span class="inventory-emoji">${item.emoji}</span>
          <div class="product-name-info">
            <span>${item.name}</span>
            <small>${item.id}</small>
          </div>
        </div>
      </td>
      <td>${item.category}</td>
      <td style="font-weight: 600;">Rs. ${item.price.toFixed(2)} / kg</td>
      <td style="font-weight: 700; color: var(--primary-dark);">${item.stock.toFixed(2)} kg</td>
      <td>${statusBadge}</td>
      <td>
        <div class="action-buttons">
          <button class="btn-icon btn-edit" title="Edit Product" onclick="openProductModal('${item.id}')">
            <i data-lucide="edit-3"></i>
          </button>
          <button class="btn-icon btn-delete" title="Delete Product" onclick="deleteProduct('${item.id}')">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      </td>
    `;
    dom.inventoryTableTbody.appendChild(tr);
  });

  lucide.createIcons();
}

window.deleteProduct = function(id) {
  const index = AppState.inventory.findIndex(item => item.id === id);
  if (index === -1) return;

  const item = AppState.inventory[index];
  if (confirm(`Are you sure you want to completely delete "${item.emoji} ${item.name}" from your store records?`)) {
    AppState.inventory.splice(index, 1);
    StoreDatabase.saveInventory(AppState.inventory);
    renderInventoryTable();
  }
};

// --- SETTINGS VIEW CONTROLLERS ---
function loadSettingsInputs() {
  try {
    const s = AppState.settings;
    dom.settingsShopName.value = s.shopName || "";
    dom.settingsShopPhone.value = s.shopPhone || "";
    dom.settingsShopAddress.value = s.shopAddress || "";
    dom.settingsTaxRate.value = s.taxRate || 5.0;
    dom.settingsReceiptGreeting.value = s.receiptGreeting || "";

    // Load auth
    const a = AppState.auth;
    dom.settingsAdminUser.value = a.adminUser || "";
    dom.settingsAdminPass.value = a.adminPass || "";
    dom.settingsCashierUser.value = a.cashierUser || "";
    dom.settingsCashierPass.value = a.cashierPass || "";
    dom.settingsRecoveryPin.value = a.recoveryPin || "";

    // Load Firebase
    dom.settingsFirebaseEnable.checked = !!s.firebaseEnabled;
    dom.settingsFbApiKey.value = s.firebaseApiKey || "";
    dom.settingsFbDbUrl.value = s.firebaseDbUrl || "";
    dom.settingsFbProjectId.value = s.firebaseProjectId || "";
    dom.settingsFbAppId.value = s.firebaseAppId || "";
  } catch (err) {
    console.error("Error loading settings inputs: ", err);
  }
}

function handleShopSettingsSubmit(e) {
  e.preventDefault();
  
  const shopName = dom.settingsShopName.value.trim().toUpperCase();
  const shopPhone = dom.settingsShopPhone.value.trim();
  const shopAddress = dom.settingsShopAddress.value.trim();
  const taxRate = parseFloat(dom.settingsTaxRate.value);
  const receiptGreeting = dom.settingsReceiptGreeting.value.trim();

  if (!shopName || !shopPhone || !shopAddress || isNaN(taxRate) || !receiptGreeting) {
    alert("Please fill in all profile fields with valid inputs.");
    return;
  }

  const newSettings = {
    ...AppState.settings,
    shopName,
    shopPhone,
    shopAddress,
    taxRate: parseFloat(taxRate.toFixed(1)),
    receiptGreeting
  };

  StoreDatabase.saveSettings(newSettings);
  AppState.settings = newSettings;
  updateSidebarBrand();
  
  alert("Shop Profile Settings saved successfully!");
  switchView("dashboard");
}

function handleAuthSettingsSubmit(e) {
  e.preventDefault();
  
  const adminUser = dom.settingsAdminUser.value.trim();
  const adminPass = dom.settingsAdminPass.value.trim();
  const cashierUser = dom.settingsCashierUser.value.trim();
  const cashierPass = dom.settingsCashierPass.value.trim();
  const recoveryPin = dom.settingsRecoveryPin.value.trim();

  if (!adminUser || !adminPass || !cashierUser || !cashierPass || !recoveryPin || recoveryPin.length !== 4) {
    alert("Please fill in all credential fields. PIN must be exactly 4 digits.");
    return;
  }

  const newAuth = {
    adminUser,
    adminPass,
    cashierUser,
    cashierPass,
    recoveryPin
  };

  StoreDatabase.saveAuth(newAuth);
  AppState.auth = newAuth;
  
  alert("Store Credentials and Recovery PIN saved successfully!");
}

function handleFirebaseSettingsSubmit(e) {
  try {
    e.preventDefault();

    const enabled = dom.settingsFirebaseEnable.checked;
    const apiKey = dom.settingsFbApiKey.value.trim();
    const dbUrl = dom.settingsFbDbUrl.value.trim();
    const projectId = dom.settingsFbProjectId.value.trim();
    const appId = dom.settingsFbAppId.value.trim();

    if (enabled && (!apiKey || !dbUrl || !projectId || !appId)) {
      alert("Please paste all Firebase credentials to enable Cloud Synchronization.");
      return;
    }

    const updatedSettings = {
      ...AppState.settings,
      firebaseEnabled: enabled,
      firebaseApiKey: apiKey,
      firebaseDbUrl: dbUrl,
      firebaseProjectId: projectId,
      firebaseAppId: appId
    };

    StoreDatabase.saveSettings(updatedSettings);
    AppState.settings = updatedSettings;

    alert("Firebase configurations updated. Applying connection settings...");
    
    // Re-establish connection or disconnect
    if (enabled) {
      initFirebase();
    } else {
      database = null;
      AppState.firebaseSyncActive = false;
      updateSyncStatusUI();
      alert("Cloud Sync disabled. System running in Local Offline Mode.");
    }
  } catch (err) {
    alert("Error saving settings: " + err.message);
    console.error("Firebase submit error: ", err);
  }
}

// --- DATABASE MAINTENANCE HANDLERS (ADMIN ONLY) ---
function openBackupModal() {
  try {
    const backup = {
      inventory: AppState.inventory,
      transactions: AppState.transactions,
      settings: AppState.settings,
      auth: AppState.auth
    };
    dom.databaseBackupJson.value = JSON.stringify(backup, null, 2);
    dom.backupModal.classList.add("active");
  } catch (err) {
    alert("Error generating backup: " + err.message);
  }
}

function closeBackupModal() {
  dom.backupModal.classList.remove("active");
}

function copyBackupToClipboard() {
  try {
    dom.databaseBackupJson.select();
    document.execCommand("copy");
    alert("Database backup JSON copied to clipboard successfully!");
  } catch (err) {
    alert("Could not copy backup: " + err.message);
  }
}

function handlePruneTypeChange() {
  const type = dom.settingsPruneType.value;
  dom.settingsPruneDateGroup.style.display = (type === "date" ? "block" : "none");
  if (type === "date") {
    dom.settingsPruneDate.required = true;
    dom.settingsPruneDate.value = getLocalDateString();
  } else {
    dom.settingsPruneDate.required = false;
  }
}

function handleDbPruneSubmit(e) {
  try {
    e.preventDefault();
    const type = dom.settingsPruneType.value;
    
    let confirmMsg = "Are you sure you want to delete these transaction logs?";
    if (type === "7days") confirmMsg = "Are you sure you want to permanently delete all transactions older than 7 days?";
    else if (type === "30days") confirmMsg = "Are you sure you want to permanently delete all transactions older than 30 days?";
    else if (type === "date") {
      const dateVal = dom.settingsPruneDate.value;
      if (!dateVal) {
        alert("Please select a valid date for pruning.");
        return;
      }
      confirmMsg = `Are you sure you want to permanently delete all transactions logged on ${dateVal}?`;
    } else if (type === "all") {
      confirmMsg = "⚠️ WARNING: Are you sure you want to permanently delete ALL sales transactions in history? This cannot be undone.";
    }

    if (!confirm(confirmMsg)) return;

    let originalCount = AppState.transactions.length;
    let prunedList = [];

    if (type === "7days") {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7);
      prunedList = AppState.transactions.filter(tx => new Date(tx.timestamp) >= cutoff);
    } else if (type === "30days") {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      prunedList = AppState.transactions.filter(tx => new Date(tx.timestamp) >= cutoff);
    } else if (type === "date") {
      const dateVal = dom.settingsPruneDate.value; // YYYY-MM-DD
      prunedList = AppState.transactions.filter(tx => {
        const txDateStr = tx.timestamp.split("T")[0];
        return txDateStr !== dateVal;
      });
    } else if (type === "all") {
      prunedList = [];
    }

    AppState.transactions = prunedList;
    StoreDatabase.saveTransactions(AppState.transactions);

    const deletedCount = originalCount - prunedList.length;
    alert(`Prune complete. Successfully removed ${deletedCount} transaction logs.`);
    
    if (AppState.currentView === "dashboard") {
      renderDashboard();
    }
  } catch (err) {
    alert("Pruning failed: " + err.message);
  }
}

function handleResetStockClick() {
  try {
    if (!confirm("Are you sure you want to reset current stock levels of ALL vegetable items in the ledger to 0.00 kg? This action cannot be undone.")) {
      return;
    }
    
    AppState.inventory.forEach(item => {
      item.stock = 0.0;
    });

    StoreDatabase.saveInventory(AppState.inventory);
    alert("All stock quantities have been reset to 0.00 kg.");
    
    if (AppState.currentView === "inventory") {
      renderInventoryTable();
    } else if (AppState.currentView === "dashboard") {
      renderDashboard();
    }
  } catch (err) {
    alert("Stock reset failed: " + err.message);
  }
}

function handleRestoreSeedsClick() {
  try {
    if (!confirm("Are you sure you want to restore the default seed vegetable inventory? This will overwrite your current product ledger list.")) {
      return;
    }

    // Load defaults
    AppState.inventory = JSON.parse(JSON.stringify(DEFAULT_VEGETABLES));
    StoreDatabase.saveInventory(AppState.inventory);
    alert("Default seed vegetable inventory has been successfully restored.");

    if (AppState.currentView === "inventory") {
      renderInventoryTable();
    } else if (AppState.currentView === "dashboard") {
      renderDashboard();
    }
  } catch (err) {
    alert("Failed to restore default seeds: " + err.message);
  }
}

function handleFactoryResetClick() {
  try {
    const doubleConfirm = confirm("⚠️ EXTREME WARNING: You are about to perform a Factory Reset.\n\nThis will completely wipe all local configuration settings, auth account credentials, inventory ledger counts, and transactional logs. If cloud sync is active, it will also wipe the Firebase Realtime Database node.\n\nAre you sure you want to proceed?");
    
    if (!doubleConfirm) return;

    const confirmationWord = prompt("Please type 'RESET' in uppercase to confirm full system factory wipe:");
    if (confirmationWord !== "RESET") {
      alert("Factory reset cancelled. Confirmation word did not match.");
      return;
    }

    alert("Initiating factory system wipe. Wiping databases...");

    // Clean Firebase if active
    if (AppState.firebaseSyncActive && database) {
      database.ref().remove()
        .then(() => performLocalWipe())
        .catch(err => {
          console.error("Firebase wipe failed, performing local wipe anyway: ", err);
          performLocalWipe();
        });
    } else {
      performLocalWipe();
    }
  } catch (err) {
    alert("Factory reset encountered an error: " + err.message);
  }
}

function performLocalWipe() {
  localStorage.clear();
  alert("All local database records wiped! System will now refresh and restore starting seeds.");
  window.location.reload();
}

// -------------------------------------------------------------
// 7. Modal Controllers & Handlers
// -------------------------------------------------------------

// --- ADD/EDIT PRODUCT MODAL ---
function openProductModal(productId = null) {
  dom.productForm.reset();
  
  if (productId) {
    const item = AppState.inventory.find(i => i.id === productId);
    if (!item) return;

    dom.productModalTitle.innerText = "Edit Vegetable Details";
    dom.productIdInput.value = item.id;
    dom.productNameInput.value = item.name;
    dom.productCategorySelect.value = item.category;
    dom.productUnitSelect.value = item.sellUnit || "kg";
    dom.productEmojiInput.value = item.emoji;
    dom.productPriceInput.value = item.price;
    dom.productStockInput.value = item.stock;
    dom.productAlertInput.value = item.alertLimit;
    
    dom.productStockInput.disabled = false;
  } else {
    dom.productModalTitle.innerText = "Add New Vegetable";
    dom.productIdInput.value = "";
    dom.productStockInput.disabled = false;
  }

  dom.productModal.classList.add("active");
}

function closeProductModal() {
  dom.productModal.classList.remove("active");
}

function handleProductFormSubmit(e) {
  e.preventDefault();
  
  const id = dom.productIdInput.value;
  const name = dom.productNameInput.value.trim();
  const category = dom.productCategorySelect.value;
  const sellUnit = dom.productUnitSelect.value;
  const emoji = dom.productEmojiInput.value.trim() || "🥬";
  const price = parseFloat(dom.productPriceInput.value);
  const stock = parseFloat(dom.productStockInput.value);
  const alertLimit = parseFloat(dom.productAlertInput.value);

  if (!name || isNaN(price) || isNaN(stock) || isNaN(alertLimit)) {
    alert("Please fill in all mandatory fields with valid inputs.");
    return;
  }

  if (id) {
    const item = AppState.inventory.find(i => i.id === id);
    if (item) {
      item.name = name;
      item.category = category;
      item.sellUnit = sellUnit;
      item.emoji = emoji;
      item.price = price;
      item.stock = parseFloat(stock.toFixed(2));
      item.alertLimit = parseFloat(alertLimit.toFixed(2));
    }
  } else {
    const newId = `veg_${Date.now()}`;
    AppState.inventory.push({
      id: newId,
      name: name,
      category: category,
      sellUnit: sellUnit,
      emoji: emoji,
      price: price,
      stock: parseFloat(stock.toFixed(2)),
      alertLimit: parseFloat(alertLimit.toFixed(2))
    });
  }

  StoreDatabase.saveInventory(AppState.inventory);
  closeProductModal();
  renderInventoryTable();
}

// --- RECEIPT INVOICE MODAL ---
function openReceiptModal(tx) {
  dom.receiptPrintArea.innerHTML = "";
  
  const timestamp = new Date(tx.timestamp).toLocaleString("en-US", {
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });

  let itemsRows = "";
  tx.items.forEach(it => {
    const displayUnit = it.sellUnit === 'kg' ? 'kg' : 'pcs';
    const displayPriceUnit = it.sellUnit === 'kg' ? 'kg' : 'piece';
    itemsRows += `
      <div class="receipt-item-row">
        <div class="receipt-item-details">
          <span>${it.name}</span>
          <span>Rs. ${it.total.toFixed(2)}</span>
        </div>
        <div class="receipt-item-math">
          ${it.weight.toFixed(3)} ${displayUnit} @ Rs. ${it.price.toFixed(2)}/${displayPriceUnit}
        </div>
      </div>
    `;
  });

  const s = AppState.settings;

  const receiptHTML = `
    <div class="receipt-header">
      <h4>${s.shopName}</h4>
      <div>${s.shopAddress}</div>
      <div>Ph: ${s.shopPhone}</div>
      <div class="receipt-divider"></div>
      <div style="font-weight: bold; text-align: center; margin-bottom: 0.25rem;">INVOICE BILL</div>
      <div class="receipt-row">
        <span>Invoice ID:</span>
        <span>${tx.id}</span>
      </div>
      <div class="receipt-row">
        <span>Date/Time:</span>
        <span style="font-size: 0.75rem;">${timestamp}</span>
      </div>
    </div>
    
    <div class="receipt-divider"></div>
    
    <div class="receipt-items-container">
      ${itemsRows}
    </div>
    
    <div class="receipt-divider"></div>
    
    <div class="receipt-totals">
      <div class="receipt-row">
        <span>Subtotal:</span>
        <span>Rs. ${tx.subtotal.toFixed(2)}</span>
      </div>
      ${tx.discountPercent > 0 ? `
        <div class="receipt-row" style="font-weight: normal; color: #333;">
          <span>Discount (${tx.discountPercent}%):</span>
          <span>-Rs. ${tx.discount.toFixed(2)}</span>
        </div>
      ` : ''}
      <div class="receipt-row" style="font-weight: normal; color: #333;">
        <span>Sales Tax (${(tx.taxPercent || 5.0).toFixed(1)}%):</span>
        <span>Rs. ${tx.tax.toFixed(2)}</span>
      </div>
      <div class="receipt-row" style="font-size: 0.95rem; margin-top: 0.25rem; border-top: 1px solid #000; padding-top: 0.25rem;">
        <span>TOTAL AMOUNT:</span>
        <span>${formatRupees(tx.total)}</span>
      </div>
    </div>
    
    <div class="receipt-divider"></div>
    
    <div class="receipt-footer">
      <p>${s.receiptGreeting}</p>
      <p>Thank You For Your Business</p>
    </div>
  `;

  dom.receiptPrintArea.innerHTML = receiptHTML;
  dom.receiptModal.classList.add("active");
  lucide.createIcons();
}

function closeReceiptModal() {
  dom.receiptModal.classList.remove("active");
  const todayStr = getLocalDateString();
  AppState.dashboardSelectedDate = todayStr;
  dom.dashboardDatePicker.value = todayStr;
  updateStatsLabels();
  switchView("dashboard");
}

function formatRupees(amount) {
  return "Rs. " + amount.toLocaleString('en-LK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}
