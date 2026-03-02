import { app, auth, db } from "./firebase-config.js?v=20260220-4";
import {
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
  getDoc,
  setDoc,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import {
  deleteToken,
  getMessaging,
  getToken,
  isSupported as isMessagingSupported,
  onMessage
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging.js";
import { ResponsiveTableCards } from "./responsive-table.js?v=20260220-4";

const state = {
  lands: [],
  plants: [],
  harvest: [],
  expenses: [],
  laborers: [],
  tasks: []
};

const authState = {
  user: null,
  role: "user",
  profile: null,
  listeners: [],
  hasSessionResolved: false
};
let accessNoticeTimeoutId = null;
const uiState = {
  editingLandId: "",
  recordModal: null
};
const TASK_REMINDER_DAYS = [3, 2, 1, 0];
const TASK_COUNTDOWN_SOON_THRESHOLD_DAYS = 3;
const TASK_REMINDER_DEFAULT_TIME = "09:00";
const TASK_REMINDER_CHECK_INTERVAL_MS = 60 * 1000;
const TASK_REMINDER_SW_READY_TIMEOUT_MS = 2000;
const TASK_REMINDER_LOG_KEY = "pf-task-reminders-v1";
const TASK_REMINDERS_ENABLED_KEY = "pf-task-reminders-enabled";
const TASK_FCM_TOKEN_KEY = "pf-task-fcm-token-v1";
const TASK_FCM_TOKEN_COLLECTION = "notification_tokens";
const TASK_FCM_SW_PATH = "/firebase-messaging-sw.js?v=20260302-1";
const TASK_FCM_SW_SCOPE = "/";

let taskReminderIntervalId = null;
let taskReminderVisibilityBound = false;
const taskMessagingState = {
  supportChecked: false,
  supported: false,
  instance: null,
  foregroundBound: false
};

const filters = {
  expenses: {
    land: "",
    type: "",
    from: "",
    to: ""
  },
  labor: {
    search: "",
    land: "",
    status: "",
    from: "",
    to: "",
    sortBy: "laborer_name",
    sortOrder: "asc"
  }
};

const expenseCategories = {
  plants: ["Loading", "Unloading", "Tip", "Pineapple Plants"],
  labor: ["Pineapple Planting", "Tip", "Daily Wages", "Hotel Rent", "Transport"],
  fertilizer: ["Urea", "Diarone", "Liquid Fertilizer", "Propenapose", "Pineapple Fertilizer"],
  chemicals: ["Pesticides", "Herbicides", "Fungicides", "Growth Regulators", "Other"],
  tools_equipment: ["Purchase", "Repair", "Maintenance", "Rental", "Fuel", "Other"],
  machines: ["Excavator", "JCB"],
  transport: ["Vehicle Fuel", "Vehicle Maintenance", "Driver Wages", "Transport Rental", "Other"],
  irrigation: ["Water Pump", "Pipes & Hoses", "Electricity", "Water Charges", "Maintenance", "Other"],
  land_preparation: ["Plowing", "Leveling", "Fencing", "Drainage", "Soil Testing", "Other"],
  extra: ["Administrative", "Miscellaneous", "Unexpected Costs", "Other"]
};

const refs = {
  lands: collection(db, "lands"),
  plants: collection(db, "plants"),
  harvest: collection(db, "harvest"),
  expenses: collection(db, "expenses"),
  laborers: collection(db, "laborers"),
  tasks: collection(db, "fertilizer_schedule")
};

const responsiveTables = new ResponsiveTableCards({
  breakpoint: 768,
  tableConfigs: {
    dashboardPendingTaskRows: {
      titleField: "Land",
      statusField: "Status",
      primaryFields: ["Date", "Time", "Countdown", "Type", "Category"]
    },
    harvestRows: {
      titleField: "Land",
      actionsField: "Actions",
      primaryFields: ["Date", "Total KG", "Grades (A/B/C)", "Revenue", "Avg Price/KG", "Buyer"]
    },
    expenseRows: {
      titleField: "Land",
      statusField: "Type",
      actionsField: "Actions",
      primaryFields: ["Date", "Category", "Plant Count", "Amount"]
    },
    laborRows: {
      titleField: "Name",
      statusField: "Status",
      actionsField: "Actions",
      primaryFields: ["ID", "Contact", "Join Date", "Assigned Land", "Skills"]
    },
    taskRows: {
      titleField: "Land",
      statusField: "Status",
      actionsField: "Actions",
      primaryFields: ["Date", "Time", "Countdown", "Type", "Category"]
    }
  }
});

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("year").textContent = new Date().getFullYear();

  renderForms();
  initNav();
  initUiControls();
  applyStartupSectionFromUrl();
  initTaskReminderControls();
  startTaskReminderEngine();
  initFilterHandlers();
  initExportHandlers();
  initSubmitHandlers();
  ensureRecordModal();
  responsiveTables.registerAll();
  initAuth();
});

function initAuth() {
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      setLoginError("");
      const email = value("loginEmail");
      const password = document.getElementById("loginPassword")?.value || "";

      if (!email || !password) {
        setLoginError("Please enter email and password.");
        return;
      }

      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (error) {
        console.error("Login failed:", error);
        setLoginError("Login failed. Check your email/password.");
      }
    });
  }

  bindLogoutButtons();

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      authState.user = user;
      authState.role = await resolveUserRole(user.uid);
      setLoginError("");
      await syncTaskFcmSubscription();
      initListeners();
      showAlert(`Signed in as ${authState.role.toUpperCase()}.`, "success");
    } else {
      await disableTaskFcmSubscription();
      clearRealtimeListeners();
      resetState();
      authState.user = null;
      authState.role = "user";
      authState.profile = null;
      renderAll();
      if (authState.hasSessionResolved) {
        showAlert("Signed out.", "info");
      }
    }

    authState.hasSessionResolved = true;
    applyRoleAccess();
  });
}

async function resolveUserRole(uid) {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (!snap.exists()) {
      authState.profile = buildDefaultProfile();
      await ensureUserProfile(uid);
      showAlert("User role not found. Defaulting to USER access.", "warning");
      return "user";
    }

    const profileData = snap.data() || {};
    authState.profile = profileData;
    const role = normalizeId(profileData.role).toLowerCase();
    if (role === "admin") return "admin";
    return "user";
  } catch (error) {
    console.error("Role lookup failed:", error);
    authState.profile = buildDefaultProfile();
    showAlert(`Role lookup failed: ${error.message}. Using USER access.`, "warning");
    return "user";
  }
}

async function ensureUserProfile(uid) {
  const defaults = buildDefaultProfile();
  try {
    await setDoc(doc(db, "users", uid), {
      role: defaults.role,
      email: defaults.email,
      display_name: defaults.display_name,
      phone: defaults.phone,
      location: defaults.location,
      bio: defaults.bio,
      updated_at: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.warn("Auto profile create skipped:", error);
  }
}

function applyRoleAccess() {
  const signedIn = Boolean(authState.user);
  const admin = isAdmin();

  document.body.classList.toggle("user-readonly", signedIn && !admin);

  const overlay = document.getElementById("authOverlay");
  if (overlay) overlay.classList.toggle("hidden", signedIn);
  if (!signedIn) {
    const loginPassword = document.getElementById("loginPassword");
    if (loginPassword) loginPassword.value = "";
  }

  const navAuth = document.getElementById("navAuth");
  if (navAuth) navAuth.hidden = !signedIn;

  const accessNotice = document.getElementById("accessNotice");
  if (accessNotice) {
    if (accessNoticeTimeoutId) {
      clearTimeout(accessNoticeTimeoutId);
      accessNoticeTimeoutId = null;
    }

    if (!signedIn) {
      accessNotice.innerHTML = "";
    } else if (admin) {
      accessNotice.innerHTML = `<div class="alert alert-success"><i class="fas fa-shield-alt"></i><div>Admin mode enabled. You can add, update, and delete records.</div></div>`;
    } else {
      accessNotice.innerHTML = `<div class="alert alert-info"><i class="fas fa-eye"></i><div>Read-only mode enabled. You can view data, but only admins can make changes.</div></div>`;
    }

    if (signedIn) {
      accessNoticeTimeoutId = setTimeout(() => {
        accessNotice.innerHTML = "";
        accessNoticeTimeoutId = null;
      }, 5000);
    }
  }

  updateTaskReminderUi();
  syncTaskFcmSubscription().catch((error) => {
    console.warn("Task FCM sync failed after role update:", error);
  });
  renderProfile();
}

function isAdmin() {
  return normalizeId(authState.role).toLowerCase() === "admin";
}

function requireAdmin(actionLabel = "perform this action") {
  if (!authState.user) {
    showAlert("Please login first.", "warning");
    return false;
  }
  if (isAdmin()) return true;
  showAlert(`Only admins can ${actionLabel}.`, "warning");
  return false;
}

function setLoginError(message) {
  const loginError = document.getElementById("loginError");
  if (loginError) loginError.textContent = message;
}

function clearRealtimeListeners() {
  authState.listeners.forEach((unsubscribe) => {
    try {
      unsubscribe();
    } catch (error) {
      console.warn("Listener cleanup failed:", error);
    }
  });
  authState.listeners = [];
}

function resetState() {
  state.lands = [];
  state.plants = [];
  state.harvest = [];
  state.expenses = [];
  state.laborers = [];
  state.tasks = [];
}

function renderForms() {
  const today = formatDateInput(new Date());

  document.getElementById("landForm").innerHTML = `
    <div class="simple-form-grid">
      <div class="form-group"><label>Land Name *</label><input id="land_name" class="form-control" required></div>
      <div class="form-group"><label>Location *</label><input id="land_location" class="form-control" required></div>
      <div class="form-group"><label>Planting Date *</label><input id="land_planting_date" class="form-control" type="date" value="${today}" required></div>
      <div class="form-group"><label>Expected Harvest</label><input id="land_expected_harvest_date" class="form-control" type="date"></div>
      <div class="form-group"><label>Size (Hectares)</label><input id="land_size_hectares" class="form-control" type="number" step="0.01" min="0"></div>
      <div class="form-group"><label>Size (Perches)</label><input id="land_size_perches" class="form-control" type="number" step="0.01" min="0"></div>
      <div class="form-group"><label>Soil Type</label><select id="land_soil_type" class="form-control"><option>Red Loam</option><option>Clay Loam</option><option>Sandy Loam</option><option>Alluvial</option><option>Laterite</option></select></div>
      <div class="form-group"><label>Irrigation Type</label><select id="land_irrigation_type" class="form-control"><option>Drip Irrigation</option><option>Sprinkler</option><option>Manual Watering</option><option>Rain-fed</option><option>Flood Irrigation</option></select></div>
      <div class="form-group"><label>Pineapple Variety</label><select id="land_variety" class="form-control"><option>Mauritius</option><option>MD2</option><option>Kew</option><option>Queen</option><option>Red Spanish</option><option>Smooth Cayenne</option></select></div>
      <div class="form-group"><label>Initial Plants</label><input id="land_initial_plants" class="form-control" type="number" min="0" value="0"></div>
    </div>
    <div class="form-actions-row">
      <button class="btn" id="landSubmitBtn" type="submit"><i class="fas fa-save"></i> Save Land</button>
      <button class="btn btn-secondary" id="landCancelEditBtn" type="button" hidden><i class="fas fa-times"></i> Cancel Edit</button>
    </div>
  `;

  document.getElementById("harvestForm").innerHTML = `
    <div class="simple-form-grid">
      <div class="form-group"><label>Land *</label><select id="harvest_land_id" class="form-control" required></select></div>
      <div class="form-group"><label>Date *</label><input id="harvest_date" class="form-control" type="date" value="${today}" required></div>
      <div class="form-group"><label>Quantity (kg) *</label><input id="harvest_quantity_kg" class="form-control" type="number" step="0.01" min="0" required></div>
      <div class="form-group"><label>Fruits Count</label><input id="harvest_quantity_fruits" class="form-control" type="number" min="0" value="0"></div>
      <div class="form-group"><label>Grade A (kg)</label><input id="harvest_grade_a" class="form-control" type="number" step="0.01" min="0" value="0"></div>
      <div class="form-group"><label>Grade A Price</label><input id="harvest_grade_a_price" class="form-control" type="number" step="0.01" min="0" value="0"></div>
      <div class="form-group"><label>Grade B (kg)</label><input id="harvest_grade_b" class="form-control" type="number" step="0.01" min="0" value="0"></div>
      <div class="form-group"><label>Grade B Price</label><input id="harvest_grade_b_price" class="form-control" type="number" step="0.01" min="0" value="0"></div>
      <div class="form-group"><label>Grade C (kg)</label><input id="harvest_grade_c" class="form-control" type="number" step="0.01" min="0" value="0"></div>
      <div class="form-group"><label>Grade C Price</label><input id="harvest_grade_c_price" class="form-control" type="number" step="0.01" min="0" value="0"></div>
      <div class="form-group"><label>Buyer</label><input id="harvest_buyer_name" class="form-control"></div>
      <div class="form-group"><label>Notes</label><input id="harvest_notes" class="form-control"></div>
    </div>
    <div class="form-actions-row"><button class="btn" type="submit"><i class="fas fa-save"></i> Save Harvest</button></div>
  `;

  document.getElementById("expenseForm").innerHTML = `
    <div class="simple-form-grid">
      <div class="form-group"><label>Land</label><select id="expense_land_id" class="form-control"></select></div>
      <div class="form-group"><label>Laborer</label><select id="expense_laborer_id" class="form-control"></select></div>
      <div class="form-group"><label>Type *</label><select id="expense_type" class="form-control" required><option value="">Select</option><option value="plants">Plants</option><option value="labor">Labor</option><option value="fertilizer">Fertilizer</option><option value="chemicals">Chemicals</option><option value="tools_equipment">Tools & Equipment</option><option value="machines">Machines</option><option value="transport">Transport</option><option value="irrigation">Irrigation</option><option value="land_preparation">Land Preparation</option><option value="extra">Extra</option></select></div>
      <div class="form-group"><label>Category *</label><select id="expense_category" class="form-control" required></select></div>
      <div class="form-group" id="expense_plant_count_wrap" hidden><label>Plant Count *</label><input id="expense_plant_count" class="form-control" type="number" min="1" step="1"></div>
      <div class="form-group"><label>Amount *</label><input id="expense_amount" class="form-control" type="number" step="0.01" min="0.01" required></div>
      <div class="form-group"><label>Date *</label><input id="expense_date" class="form-control" type="date" value="${today}" required></div>
      <div class="form-group"><label>Payment</label><select id="expense_payment_method" class="form-control"><option value="cash">Cash</option><option value="bank_transfer">Bank Transfer</option><option value="cheque">Cheque</option><option value="digital_wallet">Digital Wallet</option><option value="other">Other</option></select></div>
      <div class="form-group full"><label>Description *</label><textarea id="expense_description" class="form-control" required></textarea></div>
    </div>
    <div class="form-actions-row"><button class="btn" type="submit"><i class="fas fa-save"></i> Save Expense</button></div>
  `;

  document.getElementById("laborForm").innerHTML = `
    <div class="simple-form-grid">
      <div class="form-group"><label>Name *</label><input id="laborer_name" class="form-control" required></div>
      <div class="form-group"><label>Contact</label><input id="laborer_contact" class="form-control"></div>
      <div class="form-group"><label>Join Date</label><input id="laborer_join_date" class="form-control" type="date" value="${today}"></div>
      <div class="form-group"><label>Land</label><select id="laborer_land_id" class="form-control"></select></div>
      <div class="form-group"><label>Skills</label><input id="laborer_skills" class="form-control"></div>
      <div class="form-group"><label>Status</label><select id="laborer_status" class="form-control"><option value="active">Active</option><option value="inactive">Inactive</option><option value="on_leave">On Leave</option></select></div>
    </div>
    <div class="form-actions-row"><button class="btn" type="submit"><i class="fas fa-save"></i> Save Laborer</button></div>
  `;

  document.getElementById("taskForm").innerHTML = `
    <div class="simple-form-grid">
      <div class="form-group"><label>Land *</label><select id="task_land_id" class="form-control" required></select></div>
      <div class="form-group"><label>Type *</label><select id="task_type" class="form-control" required><option value="fertilizer">Fertilizer</option><option value="plants">Plants</option><option value="labor">Labor</option><option value="chemicals">Chemicals</option><option value="tools_equipment">Tools & Equipment</option><option value="machines">Machines</option><option value="transport">Transport</option><option value="irrigation">Irrigation</option><option value="land_preparation">Land Preparation</option><option value="extra">Extra</option></select></div>
      <div class="form-group"><label>Category *</label><select id="task_category" class="form-control" required></select></div>
      <div class="form-group"><label>Next Date *</label><input id="task_next_date" class="form-control" type="date" value="${today}" required></div>
      <div class="form-group"><label>Time *</label><input id="task_time" class="form-control" type="time" value="${TASK_REMINDER_DEFAULT_TIME}" required></div>
      <div class="form-group"><label>Status</label><select id="task_status" class="form-control"><option value="pending">Pending</option><option value="completed">Completed</option></select></div>
      <div class="form-group full"><label>Notes</label><input id="task_notes" class="form-control"></div>
    </div>
    <div class="form-actions-row"><button class="btn" type="submit"><i class="fas fa-save"></i> Save Task</button></div>
  `;

  document.getElementById("expense_type").addEventListener("change", () => refreshExpenseCategoryOptions());
  document.getElementById("expense_category")?.addEventListener("change", () => refreshExpensePlantCountInput());
  refreshExpenseCategoryOptions();
  document.getElementById("task_type")?.addEventListener("change", () => refreshTaskCategoryOptions());
  refreshTaskCategoryOptions();
  applyLandFormMode();
}

function initNav() {
  const mobileMenuBtn = document.getElementById("mobile-menu-btn");
  const navLinks = document.querySelector(".nav-links");
  const profileBtn = document.getElementById("openProfileBtn");

  if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener("click", () => {
      navLinks.classList.toggle("show");
      const open = navLinks.classList.contains("show");
      mobileMenuBtn.innerHTML = open ? '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
      mobileMenuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  document.querySelectorAll(".nav-links a[data-section]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const section = link.getAttribute("data-section");
      if (!section) return;

      document.querySelectorAll(".nav-links a[data-section]").forEach((n) => n.classList.remove("active"));
      document.querySelectorAll(".app-section").forEach((s) => s.classList.remove("active"));
      profileBtn?.classList.remove("active");

      link.classList.add("active");
      document.getElementById(`section-${section}`)?.classList.add("active");

      if (navLinks?.classList.contains("show")) {
        navLinks.classList.remove("show");
        if (mobileMenuBtn) {
          mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
          mobileMenuBtn.setAttribute("aria-expanded", "false");
        }
      }
    });
  });

  if (profileBtn) {
    profileBtn.addEventListener("click", (event) => {
      event.preventDefault();
      activateSection("profile");
      if (navLinks?.classList.contains("show")) {
        navLinks.classList.remove("show");
        if (mobileMenuBtn) {
          mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
          mobileMenuBtn.setAttribute("aria-expanded", "false");
        }
      }
    });
  }
}

function activateSection(section) {
  if (!section) return;
  document.querySelectorAll(".nav-links a[data-section]").forEach((n) => n.classList.remove("active"));
  document.querySelectorAll(".app-section").forEach((s) => s.classList.remove("active"));

  document.querySelector(`.nav-links a[data-section="${section}"]`)?.classList.add("active");
  document.getElementById(`section-${section}`)?.classList.add("active");
  document.getElementById("openProfileBtn")?.classList.toggle("active", section === "profile");
}

function applyStartupSectionFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const section = normalizeId(params.get("section")).toLowerCase();
  if (!section) return;

  const validSections = ["dashboard", "lands", "harvest", "expenses", "labor", "tasks", "profile"];
  if (!validSections.includes(section)) return;

  activateSection(section);

  params.delete("section");
  const nextQuery = params.toString();
  const cleanUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}${window.location.hash}`;
  window.history.replaceState({}, "", cleanUrl);
}
function initUiControls() {
  bindToggle("toggleLandFormBtn", "landFormPanel", "Add New Land", "Close Land Form");
  bindToggle("toggleHarvestFormBtn", "harvestFormPanel", "Add Harvest Record", "Close Harvest Form");
  bindToggle("toggleExpenseFormBtn", "expenseFormPanel", "Add New Expense", "Close Expense Form");
  bindToggle("toggleLaborFormBtn", "laborFormPanel", "Add New Laborer", "Close Labor Form");
  bindToggle("toggleTaskFormBtn", "taskFormPanel", "Add Task", "Close Task Form");
}

function bindToggle(buttonId, panelId, closedText, openText) {
  const button = document.getElementById(buttonId);
  const panel = document.getElementById(panelId);
  if (!button || !panel) return;

  button.dataset.closedText = closedText;
  button.dataset.openText = openText;
  button.innerHTML = iconFromText(closedText) + closedText;

  button.addEventListener("click", () => {
    if (!requireAdmin("open input forms")) return;
    panel.classList.toggle("open");
    const isOpen = panel.classList.contains("open");
    button.innerHTML = iconFromText(isOpen ? openText : closedText) + (isOpen ? openText : closedText);
    if (!isOpen && panelId === "landFormPanel") {
      resetLandForm();
    }
  });
}

function iconFromText(text) {
  if (text.includes("Close")) return '<i class="fas fa-times"></i> ';
  if (text.includes("Laborer")) return '<i class="fas fa-user-plus"></i> ';
  return '<i class="fas fa-plus"></i> ';
}

function initFilterHandlers() {
  const wireChange = (id, cb) => {
    const el = document.getElementById(id);
    if (!el) return;
    const eventName = el.tagName === "INPUT" ? "input" : "change";
    el.addEventListener(eventName, cb);
  };

  wireChange("expenseFilterLand", () => {
    filters.expenses.land = value("expenseFilterLand");
    renderExpenses();
  });
  wireChange("expenseFilterType", () => {
    filters.expenses.type = value("expenseFilterType");
    renderExpenses();
  });
  wireChange("expenseFilterFrom", () => {
    filters.expenses.from = value("expenseFilterFrom");
    renderExpenses();
  });
  wireChange("expenseFilterTo", () => {
    filters.expenses.to = value("expenseFilterTo");
    renderExpenses();
  });

  const resetExpense = document.getElementById("expenseFilterReset");
  if (resetExpense) {
    resetExpense.addEventListener("click", () => {
      filters.expenses = { land: "", type: "", from: "", to: "" };
      setValue("expenseFilterLand", "");
      setValue("expenseFilterType", "");
      setValue("expenseFilterFrom", "");
      setValue("expenseFilterTo", "");
      renderExpenses();
    });
  }

  wireChange("laborSearch", () => {
    filters.labor.search = value("laborSearch");
    renderLabor();
  });
  wireChange("laborFilterLand", () => {
    filters.labor.land = value("laborFilterLand");
    renderLabor();
  });
  wireChange("laborFilterStatus", () => {
    filters.labor.status = value("laborFilterStatus");
    renderLabor();
  });
  wireChange("laborFilterFrom", () => {
    filters.labor.from = value("laborFilterFrom");
    renderLabor();
  });
  wireChange("laborFilterTo", () => {
    filters.labor.to = value("laborFilterTo");
    renderLabor();
  });
  wireChange("laborSortBy", () => {
    filters.labor.sortBy = value("laborSortBy") || "laborer_name";
    renderLabor();
  });
  wireChange("laborSortOrder", () => {
    filters.labor.sortOrder = value("laborSortOrder") || "asc";
    renderLabor();
  });

  const laborSearchBtn = document.getElementById("laborSearchBtn");
  if (laborSearchBtn) {
    laborSearchBtn.addEventListener("click", () => {
      filters.labor.search = value("laborSearch");
      renderLabor();
    });
  }

  setValue("expenseFilterFrom", "");
  setValue("expenseFilterTo", "");
  filters.expenses.from = "";
  filters.expenses.to = "";
}

function initExportHandlers() {
  const laborPrintBtn = document.getElementById("laborPrintBtn");
  if (laborPrintBtn) laborPrintBtn.addEventListener("click", () => window.print());

  const laborExportCsv = document.getElementById("laborExportCsv");
  if (laborExportCsv) {
    laborExportCsv.addEventListener("click", () => {
      exportTableToCsv("laborRows", "laborers_export.csv", ["ID", "Name", "Contact", "Join Date", "Assigned Land", "Skills", "Status"]);
    });
  }

  const expensePrintBtn = document.getElementById("expensePrintBtn");
  if (expensePrintBtn) expensePrintBtn.addEventListener("click", () => window.print());

  const expenseExportCsv = document.getElementById("expenseExportCsv");
  if (expenseExportCsv) {
    expenseExportCsv.addEventListener("click", () => {
      exportTableToCsv("expenseRows", "expenses_export.csv", ["Date", "Land", "Type", "Category", "Plant Count", "Amount"]);
    });
  }

  const expenseExportPdf = document.getElementById("expenseExportPdf");
  if (expenseExportPdf) {
    expenseExportPdf.addEventListener("click", () => {
      window.print();
      showAlert("Print dialog opened. Save as PDF from your browser.", "info");
    });
  }
}

function openPanel(panelId, toggleBtnId) {
  if (!requireAdmin("open input forms")) return;
  const panel = document.getElementById(panelId);
  const btn = document.getElementById(toggleBtnId);
  if (!panel || !btn) return;
  if (!panel.classList.contains("open")) {
    panel.classList.add("open");
    const text = btn.dataset.openText || "Close";
    btn.innerHTML = iconFromText(text) + text;
  }
  panel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function closePanel(panelId, toggleBtnId) {
  const panel = document.getElementById(panelId);
  const btn = document.getElementById(toggleBtnId);
  if (!panel || !btn) return;
  panel.classList.remove("open");
  const text = btn.dataset.closedText || "Add";
  btn.innerHTML = iconFromText(text) + text;
  if (panelId === "landFormPanel") {
    resetLandForm();
  }
}

function applyLandFormMode(land = null) {
  uiState.editingLandId = land ? normalizeId(land.id) : "";

  const title = document.querySelector("#landFormPanel .form-title");
  if (title) {
    title.innerHTML = land
      ? '<i class="fas fa-pen-to-square"></i> Edit Land'
      : '<i class="fas fa-plus-circle"></i> Add New Land';
  }

  const submitBtn = document.getElementById("landSubmitBtn");
  if (submitBtn) {
    submitBtn.innerHTML = land
      ? '<i class="fas fa-save"></i> Update Land'
      : '<i class="fas fa-save"></i> Save Land';
  }

  const cancelBtn = document.getElementById("landCancelEditBtn");
  if (cancelBtn) {
    cancelBtn.hidden = !land;
  }
}

function resetLandForm() {
  applyLandFormMode(null);
  const landForm = document.getElementById("landForm");
  if (!landForm) return;
  landForm.reset();
  setValue("land_planting_date", formatDateInput(new Date()));
  setValue("land_initial_plants", "0");
}

function getLatestPlantEntryForLand(landKey, landId) {
  return [...state.plants]
    .filter((plant) => idsMatch(plant.land_id, landKey, landId))
    .sort((a, b) => dateVal(b.created_at || b.planting_date) - dateVal(a.created_at || a.planting_date))[0] || null;
}

function openLandEdit(landId) {
  const land = state.lands.find((entry) => normalizeId(entry.id) === normalizeId(landId));
  if (!land) {
    showAlert("Land record not found.", "warning");
    return;
  }

  const landKey = getLandKey(land);
  const latestPlant = getLatestPlantEntryForLand(landKey, land.id);
  applyLandFormMode(land);

  setValue("land_name", normalizeId(land.land_name));
  setValue("land_location", normalizeId(land.location));
  setValue("land_planting_date", toDateInputValue(land.planting_date) || formatDateInput(new Date()));
  setValue("land_expected_harvest_date", toDateInputValue(land.expected_harvest_date));
  setValue("land_size_hectares", normalizeId(land.size_hectares));
  setValue("land_size_perches", normalizeId(land.size_perches));
  setValue("land_soil_type", normalizeId(land.soil_type));
  setValue("land_irrigation_type", normalizeId(land.irrigation_type));
  setValue("land_variety", normalizeId(land.pineapple_variety));
  setValue("land_initial_plants", String(Number(latestPlant?.plant_count || 0)));

  openPanel("landFormPanel", "toggleLandFormBtn");
}

function toDateInputValue(raw) {
  const parsed = parseDate(raw);
  return parsed ? formatDateInput(parsed) : "";
}

function buildLandPayload(plantingDate, expectedDate) {
  return {
    land_name: value("land_name"),
    location: value("land_location"),
    size_hectares: numOrNull("land_size_hectares"),
    size_perches: numOrNull("land_size_perches"),
    soil_type: value("land_soil_type"),
    irrigation_type: value("land_irrigation_type"),
    planting_date: plantingDate,
    pineapple_variety: value("land_variety"),
    expected_harvest_date: expectedDate,
    status: "active"
  };
}

async function deleteRecordsByLand(collectionName, landCandidates) {
  const uniqueIds = new Set();
  let deleted = 0;

  for (const landCandidate of landCandidates) {
    if (!landCandidate) continue;
    const q = query(collection(db, collectionName), where("land_id", "==", landCandidate));
    const snap = await getDocs(q);
    for (const entry of snap.docs) {
      if (uniqueIds.has(entry.id)) continue;
      uniqueIds.add(entry.id);
      await deleteDoc(entry.ref);
      deleted += 1;
    }
  }

  return deleted;
}

async function deleteLandWithRelatedRecords(landId, landKey) {
  const candidates = Array.from(new Set([normalizeId(landId), normalizeId(landKey)].filter(Boolean)));
  const collections = ["plants", "harvest", "expenses", "laborers", "fertilizer_schedule"];
  let relatedDeleted = 0;

  for (const collectionName of collections) {
    relatedDeleted += await deleteRecordsByLand(collectionName, candidates);
  }

  await deleteDoc(doc(db, "lands", landId));
  return relatedDeleted;
}

function initListeners() {
  clearRealtimeListeners();
  authState.listeners.push(subscribeSnapshot(refs.lands, "lands", (d) => {
    const data = d.data();
    const landKey = normalizeId(data.land_id ?? d.id) || normalizeId(d.id);
    return { id: d.id, _land_key: landKey, ...data };
  }));
  authState.listeners.push(subscribeSnapshot(refs.plants, "plants"));
  authState.listeners.push(subscribeSnapshot(refs.harvest, "harvest"));
  authState.listeners.push(subscribeSnapshot(refs.expenses, "expenses"));
  authState.listeners.push(subscribeSnapshot(refs.laborers, "laborers"));
  authState.listeners.push(subscribeSnapshot(refs.tasks, "tasks"));
}

function subscribeSnapshot(collectionRef, stateKey, mapper = (d) => ({ id: d.id, ...d.data() })) {
  return onSnapshot(
    collectionRef,
    (snapshot) => {
      state[stateKey] = snapshot.docs.map(mapper);
      renderAll();
    },
    (error) => {
      console.error(`Firestore listener failed for ${stateKey}:`, error);
      showAlert(`Failed loading ${stateKey}: ${error.message}`, "danger");
    }
  );
}

function initSubmitHandlers() {
  document.getElementById("landForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const editing = Boolean(uiState.editingLandId);
    if (!requireAdmin(editing ? "update lands" : "add lands")) return;
    if (editing && !window.confirm("Do you want to save these land changes?")) return;
    try {
      const plantingDate = value("land_planting_date");
      let expectedDate = value("land_expected_harvest_date");
      if (!expectedDate && plantingDate) {
        const d = new Date(plantingDate);
        d.setMonth(d.getMonth() + 20);
        expectedDate = formatDateInput(d);
      }

      const payload = buildLandPayload(plantingDate, expectedDate);
      const initialPlants = num("land_initial_plants");

      if (editing) {
        const landId = uiState.editingLandId;
        const targetLand = state.lands.find((land) => normalizeId(land.id) === normalizeId(landId));
        if (!targetLand) throw new Error("Land record not found.");

        await updateDoc(doc(db, "lands", landId), {
          ...payload,
          status: normalizeId(targetLand.status) || "active",
          updated_at: serverTimestamp()
        });

        const landKey = getLandKey(targetLand);
        const latestPlant = getLatestPlantEntryForLand(landKey, landId);
        if (latestPlant) {
          await updateDoc(doc(db, "plants", latestPlant.id), {
            plant_count: initialPlants,
            planting_date: plantingDate,
            updated_at: serverTimestamp()
          });
        } else if (initialPlants > 0) {
          await addDoc(refs.plants, {
            land_id: landId,
            plant_count: initialPlants,
            planting_date: plantingDate,
            growth_stage: "planting",
            notes: "",
            created_at: serverTimestamp()
          });
        }
      } else {
        const landRef = await addDoc(refs.lands, {
          ...payload,
          created_at: serverTimestamp()
        });

        if (initialPlants > 0) {
          await addDoc(refs.plants, {
            land_id: landRef.id,
            plant_count: initialPlants,
            planting_date: plantingDate,
            growth_stage: "planting",
            notes: "",
            created_at: serverTimestamp()
          });
        }
      }

      closePanel("landFormPanel", "toggleLandFormBtn");
      showAlert(editing ? "Land updated successfully." : "Land saved successfully.", "success");
    } catch (error) {
      showAlert(`Error saving land: ${error.message}`, "danger");
    }
  });

  const landCancelEditBtn = document.getElementById("landCancelEditBtn");
  if (landCancelEditBtn) {
    landCancelEditBtn.addEventListener("click", () => closePanel("landFormPanel", "toggleLandFormBtn"));
  }

  document.getElementById("harvestForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!requireAdmin("add harvest records")) return;
    try {
      const gradeA = num("harvest_grade_a");
      const gradeB = num("harvest_grade_b");
      const gradeC = num("harvest_grade_c");
      const priceA = num("harvest_grade_a_price");
      const priceB = num("harvest_grade_b_price");
      const priceC = num("harvest_grade_c_price");
      const revA = gradeA * priceA;
      const revB = gradeB * priceB;
      const revC = gradeC * priceC;
      const totalRevenue = revA + revB + revC;
      const qtyKg = num("harvest_quantity_kg");

      await addDoc(refs.harvest, {
        land_id: value("harvest_land_id"),
        harvest_date: value("harvest_date"),
        quantity_kg: qtyKg,
        quantity_fruits: num("harvest_quantity_fruits"),
        grade_a: gradeA,
        grade_b: gradeB,
        grade_c: gradeC,
        grade_a_price: priceA,
        grade_b_price: priceB,
        grade_c_price: priceC,
        grade_a_revenue: revA,
        grade_b_revenue: revB,
        grade_c_revenue: revC,
        total_revenue: totalRevenue,
        avg_price_per_kg: qtyKg > 0 ? totalRevenue / qtyKg : 0,
        buyer_name: value("harvest_buyer_name"),
        notes: value("harvest_notes"),
        created_at: serverTimestamp()
      });

      event.target.reset();
      document.getElementById("harvest_date").value = formatDateInput(new Date());
      closePanel("harvestFormPanel", "toggleHarvestFormBtn");
      showAlert("Harvest saved successfully.", "success");
    } catch (error) {
      showAlert(`Error adding harvest: ${error.message}`, "danger");
    }
  });

  document.getElementById("expenseForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!requireAdmin("add expenses")) return;
    try {
      const expenseType = canonicalExpenseType(value("expense_type")) || normalizeId(value("expense_type"));
      const expenseCategory = value("expense_category");
      const requiresPlantCount = shouldTrackPlantCount(expenseType, expenseCategory);
      const plantCount = numOrNull("expense_plant_count");
      if (requiresPlantCount && (!plantCount || plantCount < 1)) {
        showAlert("Plant count is required for Pineapple Plants or Pineapple Planting categories.", "warning");
        return;
      }

      await addDoc(refs.expenses, {
        land_id: value("expense_land_id") || null,
        laborer_id: value("expense_laborer_id") || null,
        expense_type: value("expense_type"),
        category: expenseCategory,
        plant_count: requiresPlantCount ? Number(plantCount) : null,
        description: value("expense_description"),
        amount: num("expense_amount"),
        expense_date: value("expense_date"),
        payment_method: value("expense_payment_method"),
        created_at: serverTimestamp()
      });

      event.target.reset();
      document.getElementById("expense_date").value = formatDateInput(new Date());
      refreshExpenseCategoryOptions();
      closePanel("expenseFormPanel", "toggleExpenseFormBtn");
      showAlert("Expense saved successfully.", "success");
    } catch (error) {
      showAlert(`Error adding expense: ${error.message}`, "danger");
    }
  });

  document.getElementById("laborForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!requireAdmin("add laborers")) return;
    try {
      await addDoc(refs.laborers, {
        laborer_name: value("laborer_name"),
        contact: value("laborer_contact"),
        join_date: value("laborer_join_date"),
        land_id: value("laborer_land_id") || null,
        skills: value("laborer_skills"),
        status: value("laborer_status"),
        created_at: serverTimestamp()
      });

      event.target.reset();
      document.getElementById("laborer_join_date").value = formatDateInput(new Date());
      closePanel("laborFormPanel", "toggleLaborFormBtn");
      showAlert("Laborer saved successfully.", "success");
    } catch (error) {
      showAlert(`Error adding laborer: ${error.message}`, "danger");
    }
  });

  document.getElementById("taskForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!requireAdmin("add tasks")) return;
    try {
      const taskType = canonicalExpenseType(value("task_type")) || value("task_type");
      const taskCategory = value("task_category");

      await addDoc(refs.tasks, {
        land_id: value("task_land_id"),
        expense_type: taskType,
        category: taskCategory,
        fertilizer_type: taskCategory,
        next_date: value("task_next_date"),
        task_time: normalizeTaskTime(value("task_time")),
        status: value("task_status"),
        notes: value("task_notes"),
        created_at: serverTimestamp()
      });

      event.target.reset();
      setValue("task_type", "fertilizer");
      refreshTaskCategoryOptions();
      document.getElementById("task_next_date").value = formatDateInput(new Date());
      document.getElementById("task_time").value = TASK_REMINDER_DEFAULT_TIME;
      closePanel("taskFormPanel", "toggleTaskFormBtn");
      await checkAndSendTaskReminders();
      showAlert("Task saved successfully.", "success");
    } catch (error) {
      showAlert(`Error adding task: ${error.message}`, "danger");
    }
  });

  const profileForm = document.getElementById("profileForm");
  if (profileForm) {
    profileForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!authState.user) {
        showAlert("Please login first.", "warning");
        return;
      }

      const email = authState.user.email || value("profileEmail");
      const displayName = value("profileDisplayName") || defaultDisplayNameFromEmail(email);
      const updates = {
        display_name: displayName,
        phone: value("profilePhone"),
        location: value("profileLocation"),
        bio: value("profileBio"),
        updated_at: serverTimestamp()
      };

      try {
        await setDoc(doc(db, "users", authState.user.uid), updates, { merge: true });
        authState.profile = { ...(authState.profile || {}), ...updates, updated_at: new Date() };
        renderProfile();
        showAlert("Profile updated successfully.", "success");
      } catch (error) {
        showAlert(`Profile update failed: ${error.message}`, "danger");
      }
    });
  }
}

function renderAll() {
  fillReferenceSelects();
  renderDashboard();
  renderLands();
  renderHarvest();
  renderExpenses();
  renderLabor();
  renderTasks();
  renderProfile();
  checkAndSendTaskReminders();
}
function fillReferenceSelects() {
  const landOptions = ['<option value="">Select Land</option>']
    .concat(state.lands.map((l) => `<option value="${esc(getLandKey(l))}">${esc(l.land_name || "Unnamed")} - ${esc(l.location || "")}</option>`));
  const landFilterOptions = ['<option value="">All Lands</option>']
    .concat(state.lands.map((l) => `<option value="${esc(getLandKey(l))}">${esc(l.land_name || "Unnamed")}</option>`));

  ["harvest_land_id", "task_land_id"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const current = normalizeId(el.value);
    el.innerHTML = landOptions.join("");
    preserveSelectValue(el, current);
  });

  ["expense_land_id", "laborer_land_id"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const current = normalizeId(el.value);
    el.innerHTML = ['<option value="">None</option>'].concat(landOptions.slice(1)).join("");
    preserveSelectValue(el, current);
  });

  ["expenseFilterLand", "laborFilterLand"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const current = normalizeId(el.value);
    el.innerHTML = landFilterOptions.join("");
    preserveSelectValue(el, current);
  });

  const laborerSelect = document.getElementById("expense_laborer_id");
  if (laborerSelect) {
    const current = normalizeId(laborerSelect.value);
    laborerSelect.innerHTML = ['<option value="">None</option>']
      .concat(state.laborers.map((l) => `<option value="${esc(l.id)}">${esc(l.laborer_name || "Unknown")}</option>`)).join("");
    preserveSelectValue(laborerSelect, current);
  }
}

function refreshExpenseCategoryOptions() {
  const type = value("expense_type");
  const categoryEl = document.getElementById("expense_category");
  if (!categoryEl) return;
  const cats = expenseCategories[type] || [];
  categoryEl.innerHTML = ['<option value="">Select Category</option>']
    .concat(cats.map((c) => `<option value="${esc(c)}">${esc(c)}</option>`)).join("");
  refreshExpensePlantCountInput(type, categoryEl.value);
}

function refreshTaskCategoryOptions() {
  const taskTypeEl = document.getElementById("task_type");
  const categoryEl = document.getElementById("task_category");
  if (!taskTypeEl || !categoryEl) return;

  const selectedType = canonicalExpenseType(taskTypeEl.value) || "fertilizer";
  const selectedCategory = normalizeId(categoryEl.value);
  const categories = expenseCategories[selectedType] || ["Other"];

  categoryEl.innerHTML = ['<option value="">Select Category</option>']
    .concat(categories.map((c) => `<option value="${esc(c)}">${esc(c)}</option>`)).join("");

  if (selectedCategory && categories.includes(selectedCategory)) {
    categoryEl.value = selectedCategory;
  } else if (categories.length) {
    categoryEl.value = categories[0];
  }
}
function refreshExpensePlantCountInput(typeValue = value("expense_type"), categoryValue = value("expense_category")) {
  const wrap = document.getElementById("expense_plant_count_wrap");
  const input = document.getElementById("expense_plant_count");
  if (!wrap || !input) return;
  const shouldShow = shouldTrackPlantCount(typeValue, categoryValue);
  wrap.hidden = !shouldShow;
  input.required = shouldShow;
  input.disabled = !shouldShow;
  if (!shouldShow) input.value = "";
}

function renderDashboard() {
  const activeLands = state.lands.filter((l) => (l.status || "").toLowerCase() === "active").length;
  const totalPlants = state.plants
    .filter((plant) => isRecordLinkedToKnownLand(plant.land_id))
    .reduce((sum, p) => sum + Number(p.plant_count || 0), 0);
  const revenue = state.harvest.reduce((sum, h) => sum + Number(h.total_revenue || 0), 0);
  const expenses = state.expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const profit = revenue - expenses;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const in7 = new Date(now);
  in7.setDate(in7.getDate() + 7);
  const taskCount = state.tasks.filter((t) => {
    const d = parseDate(t.next_date);
    return d && d >= now && d <= in7 && normalizeId(t.status).toLowerCase() === "pending";
  }).length;

  text("statActiveLands", formatInt(activeLands));
  text("statTotalPlants", formatInt(totalPlants));
  text("statRevenue", formatCurrency(revenue));
  text("statExpenses", formatCurrency(expenses));
  text("statProfit", formatCurrency(profit));
  text("statTasks", formatInt(taskCount));

  const pendingRows = [...state.tasks]
    .filter((task) => normalizeId(task.status).toLowerCase() === "pending")
    .sort((a, b) => taskDateTimeVal(a) - taskDateTimeVal(b))
    .slice(0, 6)
    .map((task) => {
      const land = findLand(task.land_id);
      const dueAt = getTaskDateTime(task);
      const typeKey = canonicalExpenseType(task.expense_type || "");
      const typeLabel = label(typeKey || task.expense_type || "fertilizer");
      const categoryLabel = normalizeId(task.category || task.fertilizer_type) || "-";
      const countdown = formatTaskCountdown(dueAt);
      const countdownClass = taskCountdownClass(dueAt);
      const mobileExtras = mobileExtraFieldsAttr([
        { label: "Notes", value: task.notes || "-" }
      ]);
      return `<tr${mobileExtras}>
        <td>${esc(formatDate(task.next_date))}</td>
        <td>${esc(formatTaskTime(task.task_time))}</td>
        <td><span class="task-countdown-badge ${esc(countdownClass)}">${esc(countdown)}</span></td>
        <td>${esc(land?.land_name || "Unknown")}</td>
        <td>${esc(typeLabel)}</td>
        <td>${esc(categoryLabel)}</td>
        <td><span class="status-badge ${statusBadgeClass(task.status)}">${esc(label(task.status))}</span></td>
      </tr>`;
    });
  setRows("dashboardPendingTaskRows", pendingRows, 7, "No pending tasks found.");
}

function renderLands() {
  const grid = document.getElementById("landsGrid");
  if (!grid) return;
  const admin = isAdmin();

  const lands = state.lands.map((land) => {
    const landKey = getLandKey(land);
    const landPlants = state.plants.filter((p) => idsMatch(p.land_id, landKey, land.id));
    const latestPlant = landPlants.sort((a, b) => dateVal(b.created_at || b.planting_date) - dateVal(a.created_at || a.planting_date))[0];
    const plants = Number(latestPlant?.plant_count || 0);
    const revenue = state.harvest.filter((h) => idsMatch(h.land_id, landKey, land.id)).reduce((s, h) => s + Number(h.total_revenue || 0), 0);
    const expense = state.expenses.filter((e) => idsMatch(e.land_id, landKey, land.id)).reduce((s, e) => s + Number(e.amount || 0), 0);
    const profit = revenue - expense;
    const costPerPlant = plants > 0 ? expense / plants : 0;
    const size = land.size_hectares ? `${formatNum(Number(land.size_hectares))} Hectares` : (land.size_perches ? `${formatNum(Number(land.size_perches))} Perches` : "-");
    const plantingDate = parseDate(land.planting_date);
    const expectedHarvest = parseDate(land.expected_harvest_date);
    const ageMonths = plantingDate ? Math.max(0, Math.floor((new Date().getTime() - plantingDate.getTime()) / (1000 * 60 * 60 * 24 * 30))) : null;
    const daysToHarvest = expectedHarvest ? Math.ceil((expectedHarvest.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;
    const status = normalizeId(land.status).toLowerCase() || "active";
    const harvestStatus = daysToHarvest === null ? "later" : (daysToHarvest <= 30 ? "soon" : (daysToHarvest <= 90 ? "near" : "later"));
    const harvestLabel = expectedHarvest
      ? `Harvest: ${expectedHarvest.toLocaleDateString("en-US", { month: "short", year: "numeric" })} (${daysToHarvest >= 0 ? `${daysToHarvest} days` : `${Math.abs(daysToHarvest)} days overdue`})`
      : "Harvest: Not set";

    return {
      land,
      landKey,
      plants,
      revenue,
      expense,
      profit,
      costPerPlant,
      size,
      ageMonths,
      harvestStatus,
      harvestLabel,
      status
    };
  });

  const activeCount = lands.filter((l) => l.status === "active").length;
  const totalPlants = lands.reduce((sum, l) => sum + l.plants, 0);
  const totalRevenue = lands.reduce((sum, l) => sum + l.revenue, 0);

  text("landStatTotal", formatInt(lands.length));
  text("landStatActive", formatInt(activeCount));
  text("landStatPlants", formatInt(totalPlants));
  text("landStatRevenue", formatCurrency(totalRevenue));

  if (!lands.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-tractor fa-3x"></i>
        <h3>No Lands Added Yet</h3>
        <p>Start by adding your first pineapple farming land.</p>
        ${admin
    ? '<button class="btn" type="button" data-open-land-form><i class="fas fa-plus"></i> Add First Land</button>'
    : '<p class="muted">Read-only mode: contact admin to add land records.</p>'}
      </div>
    `;
    grid.querySelector("[data-open-land-form]")?.addEventListener("click", () => openPanel("landFormPanel", "toggleLandFormBtn"));
    return;
  }

  grid.innerHTML = lands.map((entry) => {
    const { land, landKey, plants, revenue, expense, profit, costPerPlant, size, ageMonths, harvestStatus, harvestLabel, status } = entry;
    const statusClass = status === "active" ? "active" : "inactive";

    return `
      <div class="land-card">
        <div class="land-card-header" style="background: ${esc(getLandColor(land.id))};">
          <h3>${esc(land.land_name || "Unnamed Land")}</h3>
          <span class="land-status ${statusClass}">${esc(label(status))}</span>
        </div>
        <div class="land-card-body">
          <div class="land-info-item"><i class="fas fa-map-marker-alt"></i><span>${esc(land.location || "-")}</span></div>
          <div class="land-info-item"><i class="fas fa-ruler-combined"></i><span>${esc(size)}</span></div>
          <div class="land-info-item"><i class="fas fa-seedling"></i><span>${esc(formatInt(plants))} Plants</span></div>
          <div class="land-info-item"><i class="fas fa-apple-alt"></i><span>${esc(land.pineapple_variety || "-")}</span></div>
          <div class="land-info-item"><i class="fas fa-calendar-day"></i><span>Planted: ${esc(formatDate(land.planting_date))}</span></div>
          <div class="land-info-item"><i class="fas fa-hourglass-half"></i><span>Age: ${esc(ageMonths !== null ? `${ageMonths} months` : "-")}</span></div>

          <div class="land-stats-box">
            <div class="stat"><div class="stat-label">Expenses</div><div class="stat-value expense">${esc(formatCurrency(expense))}</div></div>
            <div class="stat"><div class="stat-label">Cost / Plant</div><div class="stat-value cost">${esc(formatCurrency(costPerPlant))}</div></div>
            <div class="stat"><div class="stat-label">Revenue</div><div class="stat-value revenue">${esc(formatCurrency(revenue))}</div></div>
            <div class="stat"><div class="stat-label">Profit</div><div class="stat-value ${profit >= 0 ? "profit" : "loss"}">${esc(formatCurrency(profit))}</div></div>
          </div>

          <div class="harvest-indicator ${esc(harvestStatus)}"><i class="fas fa-calendar-check"></i><span>${esc(harvestLabel)}</span></div>
        </div>
        <div class="land-card-footer">
          <button class="btn btn-view" type="button" data-land-view="${esc(land.id)}"><i class="fas fa-eye"></i> View Details</button>
          ${admin
    ? `<div class="action-buttons">
            <button class="btn-icon" type="button" title="Edit Land" data-land-edit="${esc(land.id)}"><i class="fas fa-pen"></i></button>
            <button class="btn-icon" type="button" title="Record Harvest" data-land-harvest="${esc(landKey)}"><i class="fas fa-apple-alt"></i></button>
            <button class="btn-icon" type="button" title="Add Expense" data-land-expense="${esc(landKey)}"><i class="fas fa-money-bill-wave"></i></button>
            <button class="btn-icon btn-danger" type="button" title="Delete Land" data-land-delete="${esc(land.id)}" data-land-key="${esc(landKey)}"><i class="fas fa-trash"></i></button>
          </div>`
    : '<span class="muted">View only</span>'}
        </div>
      </div>
    `;
  }).join("");

  grid.querySelectorAll("button[data-land-edit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!requireAdmin("edit lands")) return;
      openLandEdit(btn.dataset.landEdit);
    });
  });

  grid.querySelectorAll("button[data-land-delete]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!requireAdmin("delete lands")) return;
      const landId = normalizeId(btn.dataset.landDelete);
      const landKey = normalizeId(btn.dataset.landKey);
      if (!landId) return;
      const ok = window.confirm("Delete this land and all related plants, harvest, expense, labor, and task records?");
      if (!ok) return;
      try {
        const relatedDeleted = await deleteLandWithRelatedRecords(landId, landKey);
        if (normalizeId(uiState.editingLandId) === landId) {
          closePanel("landFormPanel", "toggleLandFormBtn");
        }
        showAlert(`Land deleted. Removed ${formatInt(relatedDeleted)} related records.`, "success");
      } catch (error) {
        showAlert(`Delete failed: ${error.message}`, "danger");
      }
    });
  });

  grid.querySelectorAll("button[data-land-view]").forEach((btn) => {
    btn.addEventListener("click", () => {
      openRecordModal("lands", btn.dataset.landView, "view");
    });
  });

  grid.querySelectorAll("button[data-land-harvest]").forEach((btn) => {
    btn.addEventListener("click", () => {
      activateSection("harvest");
      setValue("harvest_land_id", normalizeId(btn.dataset.landHarvest));
      openPanel("harvestFormPanel", "toggleHarvestFormBtn");
    });
  });

  grid.querySelectorAll("button[data-land-expense]").forEach((btn) => {
    btn.addEventListener("click", () => {
      activateSection("expenses");
      setValue("expense_land_id", normalizeId(btn.dataset.landExpense));
      openPanel("expenseFormPanel", "toggleExpenseFormBtn");
    });
  });
}

function renderHarvest() {
  const admin = isAdmin();
  const sorted = [...state.harvest].sort((a, b) => dateVal(b.harvest_date) - dateVal(a.harvest_date));
  const totalPlants = state.plants
    .filter((plant) => isRecordLinkedToKnownLand(plant.land_id))
    .reduce((sum, p) => sum + Number(p.plant_count || 0), 0);
  const totalRevenue = sorted.reduce((sum, h) => sum + Number(h.total_revenue || 0), 0);
  const lastHarvestDate = sorted[0]?.harvest_date || null;

  text("harvestStatPlants", formatInt(totalPlants));
  text("harvestStatEvents", formatInt(sorted.length));
  text("harvestStatLast", lastHarvestDate ? formatDate(lastHarvestDate) : "N/A");
  text("harvestStatRevenue", formatCurrency(totalRevenue));

  const rows = sorted.map((h) => {
    const land = findLand(h.land_id);
    const gradeA = Number(h.grade_a || 0);
    const gradeB = Number(h.grade_b || 0);
    const gradeC = Number(h.grade_c || 0);
    const qty = Number(h.quantity_kg || 0);
    const totalRev = Number(h.total_revenue || 0);
    const avgPrice = qty > 0 ? (Number(h.avg_price_per_kg || 0) || (totalRev / qty)) : 0;
    const dateObj = parseDate(h.harvest_date);
    const day = dateObj ? String(dateObj.getDate()).padStart(2, "0") : "--";
    const month = dateObj ? dateObj.toLocaleDateString("en-US", { month: "short" }).toUpperCase() : "---";
    const mobileExtras = mobileExtraFieldsAttr([
      { label: "Notes", value: h.notes || "-" }
    ]);

    return `<tr${mobileExtras}>
      <td><div class="harvest-date-badge"><strong>${esc(day)}</strong><span>${esc(month)}</span></div></td>
      <td>${esc(land?.land_name || "Unknown")}</td>
      <td><strong>${esc(formatNum(qty))} kg</strong></td>
      <td>
        <div class="harvest-grades">
          <span class="grade-chip grade-a">A:${esc(formatNum(gradeA))}</span>
          <span class="grade-chip grade-b">B:${esc(formatNum(gradeB))}</span>
          <span class="grade-chip grade-c">C:${esc(formatNum(gradeC))}</span>
        </div>
      </td>
      <td><strong class="revenue-text">${esc(formatCurrency(totalRev))}</strong></td>
      <td><strong>${esc(formatCurrency(avgPrice))}</strong></td>
      <td>${esc(h.buyer_name || "-")}</td>
      <td>
        <div class="action-buttons">
          <button class="btn-icon" type="button" data-record-view="harvest" data-record-id="${esc(h.id)}"><i class="fas fa-eye"></i></button>
          ${admin ? `<button class="btn-icon" type="button" data-record-edit="harvest" data-record-id="${esc(h.id)}"><i class="fas fa-edit"></i></button>` : ""}
          ${admin ? `<button class="btn-icon btn-danger" type="button" data-delete="harvest" data-id="${esc(h.id)}"><i class="fas fa-trash"></i></button>` : ""}
        </div>
      </td>
    </tr>`;
  });

  setRows("harvestRows", rows, 8, "No harvest records found.");
}

function renderExpenses() {
  const admin = isAdmin();
  const selectedType = canonicalExpenseType(filters.expenses.type);
  const filtered = state.expenses
    .filter((e) => {
      const expenseDate = parseDate(e.expense_date);
      const dateKey = expenseDate ? formatDateInput(expenseDate) : "";
      const expenseType = canonicalExpenseType(e.expense_type);
      if (filters.expenses.land && !idsMatch(e.land_id, filters.expenses.land)) return false;
      if (selectedType && expenseType !== selectedType) return false;
      if (filters.expenses.from && dateKey && dateKey < filters.expenses.from) return false;
      if (filters.expenses.to && dateKey && dateKey > filters.expenses.to) return false;
      return true;
    })
    .sort((a, b) => dateVal(b.expense_date) - dateVal(a.expense_date));

  const totalAmount = filtered.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const now = new Date();
  const monthAmount = filtered.reduce((sum, e) => {
    const d = parseDate(e.expense_date);
    if (!d) return sum;
    if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) {
      return sum + Number(e.amount || 0);
    }
    return sum;
  }, 0);

  const typeTotals = {};
  filtered.forEach((e) => {
    const type = canonicalExpenseType(e.expense_type) || "other";
    typeTotals[type] = (typeTotals[type] || 0) + Number(e.amount || 0);
  });
  const topType = Object.keys(typeTotals).sort((a, b) => typeTotals[b] - typeTotals[a])[0] || "";
  const scopeLand = state.lands.find((l) => idsMatch(filters.expenses.land, getLandKey(l), l.id, l.land_id));

  text("expenseStatTotal", formatCurrency(totalAmount));
  text("expenseStatMonth", formatCurrency(monthAmount));
  text("expenseStatTopCategory", topType ? label(topType) : "N/A");
  text("expenseStatRecords", formatInt(filtered.length));
  text("expenseStatScope", scopeLand?.land_name || "All Lands");

  const rows = filtered.map((e) => {
    const land = findLand(e.land_id);
    const expenseType = canonicalExpenseType(e.expense_type) || "extra";
    const expenseTypeLabel = label(expenseType === "extra" ? (e.expense_type || "other") : expenseType);
    const plantCount = shouldTrackPlantCount(expenseType, e.category) && Number(e.plant_count || 0) > 0
      ? formatInt(Number(e.plant_count))
      : "-";
    const mobileExtras = mobileExtraFieldsAttr([
      { label: "Description", value: e.description || "-" }
    ]);
    return `<tr${mobileExtras}>
      <td>${esc(formatDate(e.expense_date))}</td>
      <td>${esc(land?.land_name || "General Expense")}</td>
      <td><span class="status-badge ${esc(expenseType)}">${esc(expenseTypeLabel)}</span></td>
      <td>${esc(e.category || "-")}</td>
      <td>${esc(plantCount)}</td>
      <td class="amount-cell">${esc(formatCurrency(Number(e.amount || 0)))}</td>
      <td>
        <div class="action-buttons">
          <button class="btn-icon" type="button" data-record-view="expenses" data-record-id="${esc(e.id)}"><i class="fas fa-eye"></i></button>
          ${admin ? `<button class="btn-icon" type="button" data-record-edit="expenses" data-record-id="${esc(e.id)}"><i class="fas fa-edit"></i></button>` : ""}
          ${admin ? `<button class="btn-icon btn-danger" type="button" data-delete="expenses" data-id="${esc(e.id)}"><i class="fas fa-trash"></i></button>` : ""}
        </div>
      </td>
    </tr>`;
  });

  setRows("expenseRows", rows, 7, "No expenses found with the selected filters.");
}

function renderLabor() {
  const admin = isAdmin();
  const total = state.laborers.length;
  const active = state.laborers.filter((l) => normalizeId(l.status).toLowerCase() === "active").length;
  const onLeave = state.laborers.filter((l) => normalizeId(l.status).toLowerCase() === "on_leave").length;
  const inactive = state.laborers.filter((l) => normalizeId(l.status).toLowerCase() === "inactive").length;

  text("laborStatTotal", formatInt(total));
  text("laborStatActive", formatInt(active));
  text("laborStatLeave", formatInt(onLeave));
  text("laborStatInactive", formatInt(inactive));

  const filtered = state.laborers
    .filter((l) => {
      const land = findLand(l.land_id);
      const haystack = `${normalizeId(l.laborer_name)} ${normalizeId(l.contact)} ${normalizeId(l.skills)} ${normalizeId(land?.land_name)}`.toLowerCase();
      const search = normalizeId(filters.labor.search).toLowerCase();
      if (search && !haystack.includes(search)) return false;
      if (filters.labor.land && !idsMatch(l.land_id, filters.labor.land)) return false;
      if (filters.labor.status && normalizeId(l.status) !== normalizeId(filters.labor.status)) return false;

      const joinDate = parseDate(l.join_date);
      const joinKey = joinDate ? formatDateInput(joinDate) : "";
      if (filters.labor.from && joinKey && joinKey < filters.labor.from) return false;
      if (filters.labor.to && joinKey && joinKey > filters.labor.to) return false;

      return true;
    })
    .sort((a, b) => {
      const landA = findLand(a.land_id);
      const landB = findLand(b.land_id);
      const sortBy = filters.labor.sortBy || "laborer_name";

      let comp = 0;
      if (sortBy === "join_date") {
        comp = dateVal(a.join_date) - dateVal(b.join_date);
      } else if (sortBy === "status") {
        comp = normalizeId(a.status).localeCompare(normalizeId(b.status));
      } else if (sortBy === "land_name") {
        comp = normalizeId(landA?.land_name).localeCompare(normalizeId(landB?.land_name));
      } else {
        comp = normalizeId(a.laborer_name).localeCompare(normalizeId(b.laborer_name));
      }

      return (filters.labor.sortOrder || "asc") === "desc" ? -comp : comp;
    });

  const rows = filtered.map((l, index) => {
    const land = findLand(l.land_id);
    return `<tr>
      <td>${esc(String(l.laborer_id || index + 1))}</td>
      <td><strong>${esc(l.laborer_name || "-")}</strong></td>
      <td>${esc(l.contact || "-")}</td>
      <td>${esc(formatDate(l.join_date))}</td>
      <td>${esc(land?.land_name || "Not Assigned")}</td>
      <td>${esc(l.skills || "-")}</td>
      <td><span class="status-badge ${statusBadgeClass(l.status)}">${esc(label(l.status))}</span></td>
      <td>
        <div class="action-buttons">
          <button class="btn-icon" type="button" data-record-view="laborers" data-record-id="${esc(l.id)}"><i class="fas fa-eye"></i></button>
          ${admin ? `<button class="btn-icon" type="button" data-record-edit="laborers" data-record-id="${esc(l.id)}"><i class="fas fa-edit"></i></button>` : ""}
          ${admin ? `<button class="btn-icon btn-danger" type="button" data-delete="laborers" data-id="${esc(l.id)}"><i class="fas fa-trash"></i></button>` : '<span class="muted">View only</span>'}
        </div>
      </td>
    </tr>`;
  });

  setRows("laborRows", rows, 8, "No laborers found. Add your first laborer above.");
}

function renderTasks() {
  const admin = isAdmin();
  const rows = [...state.tasks]
    .sort((a, b) => taskDateTimeVal(a) - taskDateTimeVal(b))
    .map((t) => {
      const land = findLand(t.land_id);
      const taskStatus = normalizeId(t.status).toLowerCase();
      const taskTime = normalizeTaskTime(t.task_time);
      const dueAt = getTaskDateTime(t);
      const typeKey = canonicalExpenseType(t.expense_type || "");
      const typeLabel = label(typeKey || t.expense_type || "fertilizer");
      const categoryLabel = normalizeId(t.category || t.fertilizer_type) || "-";
      const countdown = taskStatus === "completed" ? "-" : formatTaskCountdown(dueAt);
      const countdownClass = taskStatus === "completed" ? "countdown-unknown" : taskCountdownClass(dueAt);
      const countdownCell = taskStatus === "completed"
        ? `<td><span class="muted">Completed</span></td>`
        : `<td><span class="task-countdown-badge ${esc(countdownClass)}">${esc(countdown)}</span></td>`;
      const completeBtn = admin && taskStatus === "pending"
        ? `<button class="inline-btn complete" data-complete="${esc(t.id)}">Complete</button>`
        : "";
      const deleteBtn = admin ? `<button class="inline-btn delete" data-delete="tasks" data-id="${esc(t.id)}">Delete</button>` : "";
      const actionCell = (completeBtn || deleteBtn) ? `${completeBtn} ${deleteBtn}`.trim() : '<span class="muted">View only</span>';
      const mobileExtras = mobileExtraFieldsAttr([
        { label: "Due At", value: formatDateTime(dueAt) || "-" },
        { label: "Notes", value: t.notes || "-" }
      ]);
      return `<tr${mobileExtras}>
        <td>${esc(formatDate(t.next_date))}</td>
        <td>${esc(formatTaskTime(taskTime))}</td>
        ${countdownCell}
        <td>${esc(land?.land_name || "Unknown")}</td>
        <td>${esc(typeLabel)}</td>
        <td>${esc(categoryLabel)}</td>
        <td><span class="status-badge ${statusBadgeClass(t.status)}">${esc(label(t.status))}</span></td>
        <td><div class="task-action-buttons">${actionCell}</div></td>
      </tr>`;
    });
  setRows("taskRows", rows, 8, "No tasks found.");
}

function getTaskFcmVapidKey() {
  const meta = document.querySelector('meta[name="pf-fcm-vapid-key"]');
  return normalizeId(meta?.content);
}

function getStoredTaskFcmToken() {
  try {
    return normalizeId(localStorage.getItem(TASK_FCM_TOKEN_KEY));
  } catch (error) {
    console.warn("Unable to read stored FCM token:", error);
    return "";
  }
}

function setStoredTaskFcmToken(token) {
  try {
    localStorage.setItem(TASK_FCM_TOKEN_KEY, normalizeId(token));
  } catch (error) {
    console.warn("Unable to store FCM token:", error);
  }
}

function clearStoredTaskFcmToken() {
  try {
    localStorage.removeItem(TASK_FCM_TOKEN_KEY);
  } catch (error) {
    console.warn("Unable to clear stored FCM token:", error);
  }
}

function buildTaskFcmTokenDocId(token) {
  const safe = normalizeId(token).replace(/[^A-Za-z0-9_-]/g, "_");
  return `tok_${safe.slice(0, 1400)}`;
}

async function supportsTaskMessaging() {
  if (taskMessagingState.supportChecked) return taskMessagingState.supported;
  try {
    taskMessagingState.supported = await isMessagingSupported();
  } catch (error) {
    console.warn("Messaging support check failed:", error);
    taskMessagingState.supported = false;
  }
  taskMessagingState.supportChecked = true;
  return taskMessagingState.supported;
}

async function getTaskMessagingInstance() {
  const supported = await supportsTaskMessaging();
  if (!supported) return null;

  if (!taskMessagingState.instance) {
    taskMessagingState.instance = getMessaging(app);
  }

  if (!taskMessagingState.foregroundBound) {
    onMessage(taskMessagingState.instance, (payload) => {
      const title = normalizeId(payload?.notification?.title) || "Task Reminder";
      const body = normalizeId(payload?.notification?.body) || "You have a task reminder.";
      showAlert(`${title}: ${body}`, "info");
    });
    taskMessagingState.foregroundBound = true;
  }

  return taskMessagingState.instance;
}

async function getTaskFcmServiceWorkerRegistration() {
  if (!("serviceWorker" in navigator)) return null;

  try {
    const existing = await navigator.serviceWorker.getRegistration(TASK_FCM_SW_SCOPE);
    if (existing) return existing;
  } catch (error) {
    console.warn("Unable to read existing FCM service worker registration:", error);
  }

  try {
    const registration = await navigator.serviceWorker.register(TASK_FCM_SW_PATH, {
      scope: TASK_FCM_SW_SCOPE
    });
    return registration;
  } catch (error) {
    console.warn("FCM service worker registration failed:", error);
    return null;
  }
}

async function upsertTaskFcmTokenRecord(token) {
  if (!authState.user) return;
  const tokenId = buildTaskFcmTokenDocId(token);
  await setDoc(doc(db, TASK_FCM_TOKEN_COLLECTION, tokenId), {
    token: normalizeId(token),
    user_id: normalizeId(authState.user.uid),
    email: normalizeId(authState.user.email),
    role: isAdmin() ? "admin" : "user",
    enabled: true,
    source: "admin-web",
    user_agent: normalizeId(navigator.userAgent),
    updated_at: serverTimestamp(),
    last_seen_at: serverTimestamp()
  }, { merge: true });
}

async function removeTaskFcmTokenRecord(token) {
  const normalizedToken = normalizeId(token);
  if (!normalizedToken) return;
  const tokenId = buildTaskFcmTokenDocId(normalizedToken);
  try {
    await deleteDoc(doc(db, TASK_FCM_TOKEN_COLLECTION, tokenId));
  } catch (error) {
    console.warn("Unable to remove FCM token record:", error);
  }
}

async function registerTaskFcmSubscription() {
  if (!authState.user || !isAdmin() || !isTaskRemindersEnabled()) return false;
  if (!("Notification" in window) || Notification.permission !== "granted") return false;

  const messaging = await getTaskMessagingInstance();
  if (!messaging) return false;

  const swRegistration = await getTaskFcmServiceWorkerRegistration();
  if (!swRegistration) return false;

  const tokenOptions = { serviceWorkerRegistration: swRegistration };
  const vapidKey = getTaskFcmVapidKey();
  if (vapidKey) {
    tokenOptions.vapidKey = vapidKey;
  } else {
    console.warn("FCM VAPID key meta tag is empty. Add it to enable reliable web push on all browsers.");
  }

  try {
    const token = await getToken(messaging, tokenOptions);
    if (!normalizeId(token)) {
      console.warn("FCM token was not returned.");
      return false;
    }

    const previousToken = getStoredTaskFcmToken();
    if (previousToken && previousToken !== token) {
      await removeTaskFcmTokenRecord(previousToken);
    }

    await upsertTaskFcmTokenRecord(token);
    setStoredTaskFcmToken(token);
    return true;
  } catch (error) {
    console.warn("Unable to register FCM token:", error);
    return false;
  }
}

async function disableTaskFcmSubscription() {
  const previousToken = getStoredTaskFcmToken();
  if (previousToken) {
    await removeTaskFcmTokenRecord(previousToken);
  }

  const messaging = await getTaskMessagingInstance();
  if (messaging) {
    try {
      await deleteToken(messaging);
    } catch (error) {
      console.warn("Unable to delete local FCM token:", error);
    }
  }

  clearStoredTaskFcmToken();
}

async function syncTaskFcmSubscription() {
  if (!authState.user || !isAdmin() || !isTaskRemindersEnabled()) {
    await disableTaskFcmSubscription();
    return;
  }

  if (!("Notification" in window) || Notification.permission !== "granted") {
    await disableTaskFcmSubscription();
    return;
  }

  await registerTaskFcmSubscription();
}

function initTaskReminderControls() {
  const toggleBtn = document.getElementById("toggleTaskNotificationsBtn");
  if (!toggleBtn || toggleBtn.dataset.bound === "1") {
    updateTaskReminderUi();
    return;
  }

  toggleBtn.dataset.bound = "1";
  toggleBtn.addEventListener("click", async () => {
    const currentlyEnabled = isTaskRemindersEnabled();
    if (currentlyEnabled) {
      setTaskRemindersEnabled(false);
      await disableTaskFcmSubscription();
      updateTaskReminderUi();
      showAlert("3-to-today task alerts turned off.", "info");
      return;
    }

    const ok = await ensureTaskNotificationPermission();
    if (!ok) {
      updateTaskReminderUi();
      return;
    }

    setTaskRemindersEnabled(true);
    await syncTaskFcmSubscription();
    updateTaskReminderUi();
    await checkAndSendTaskReminders();
    showAlert("3-to-today task alerts turned on.", "success");
  });

  updateTaskReminderUi();
}

function updateTaskReminderUi() {
  const toggleBtn = document.getElementById("toggleTaskNotificationsBtn");
  if (!toggleBtn) return;

  if (!authState.user || !isAdmin()) {
    toggleBtn.disabled = true;
    toggleBtn.innerHTML = '<i class="fas fa-user-shield"></i> Admin Only Alerts';
    return;
  }

  if (!("Notification" in window)) {
    toggleBtn.disabled = true;
    toggleBtn.innerHTML = '<i class="fas fa-bell-slash"></i> Notifications Unavailable';
    return;
  }

  if (Notification.permission === "denied") {
    toggleBtn.disabled = true;
    toggleBtn.innerHTML = '<i class="fas fa-ban"></i> Notifications Blocked';
    return;
  }

  const enabled = isTaskRemindersEnabled();
  toggleBtn.disabled = false;
  toggleBtn.innerHTML = enabled
    ? '<i class="fas fa-bell-slash"></i> Turn Off 3-to-Today Alerts'
    : '<i class="fas fa-bell"></i> Turn On 3-to-Today Alerts';
}

async function ensureTaskNotificationPermission() {
  if (!("Notification" in window)) {
    showAlert("Notifications are not supported on this browser.", "warning");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission === "denied") {
    showAlert("Notifications are blocked. Please allow notifications in browser settings.", "warning");
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      return true;
    }
    showAlert("Notification permission was not granted.", "warning");
  } catch (error) {
    showAlert(`Unable to enable notifications: ${error.message}`, "danger");
  }

  return false;
}

function isTaskRemindersEnabled() {
  const raw = localStorage.getItem(TASK_REMINDERS_ENABLED_KEY);
  return raw === "1";
}

function setTaskRemindersEnabled(enabled) {
  try {
    localStorage.setItem(TASK_REMINDERS_ENABLED_KEY, enabled ? "1" : "0");
  } catch (error) {
    console.warn("Unable to update task reminder enabled state:", error);
  }
}
function startTaskReminderEngine() {
  if (taskReminderIntervalId) return;

  checkAndSendTaskReminders();
  refreshTaskCountdownViews();
  taskReminderIntervalId = window.setInterval(() => {
    checkAndSendTaskReminders();
    refreshTaskCountdownViews();
  }, TASK_REMINDER_CHECK_INTERVAL_MS);

  if (!taskReminderVisibilityBound) {
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        checkAndSendTaskReminders();
        refreshTaskCountdownViews();
      }
    });
    taskReminderVisibilityBound = true;
  }
}

function refreshTaskCountdownViews() {
  renderDashboard();
  renderTasks();
}

async function checkAndSendTaskReminders() {
  if (!authState.user || !isAdmin()) {
    return;
  }

  if (!isTaskRemindersEnabled()) {
    return;
  }

  if (!("Notification" in window) || Notification.permission !== "granted") {
    return;
  }

  if (!Array.isArray(state.tasks) || !state.tasks.length) {
    return;
  }

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const reminderLog = loadTaskReminderLog();
  let changed = false;

  for (const task of state.tasks) {
    if (normalizeId(task.status).toLowerCase() === "completed") continue;

    const dueAt = getTaskDateTime(task);
    if (!dueAt) continue;

    if (now > dueAt) continue;

    for (const daysBefore of TASK_REMINDER_DAYS) {
      const reminderDate = new Date(dueAt);
      reminderDate.setHours(0, 0, 0, 0);
      reminderDate.setDate(reminderDate.getDate() - daysBefore);
      if (todayStart.getTime() !== reminderDate.getTime()) continue;

      const token = buildTaskReminderToken(task, daysBefore, dueAt);
      if (reminderLog[token]) continue;

      const sent = await showTaskReminderNotification(task, dueAt, now);
      if (sent) {
        reminderLog[token] = Date.now();
        changed = true;
      }
    }
  }

  if (changed) {
    saveTaskReminderLog(reminderLog);
  }
}

async function getTaskNotificationRegistration() {
  if (!("serviceWorker" in navigator)) return null;

  try {
    const existingRegistration = await navigator.serviceWorker.getRegistration();
    if (existingRegistration?.showNotification) return existingRegistration;
  } catch (error) {
    console.warn("Unable to get service worker registration:", error);
  }

  try {
    const readyRegistration = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise((resolve) => window.setTimeout(() => resolve(null), TASK_REMINDER_SW_READY_TIMEOUT_MS))
    ]);
    if (readyRegistration?.showNotification) return readyRegistration;
  } catch (error) {
    console.warn("Service worker ready check failed:", error);
  }

  return null;
}

async function showTaskReminderNotification(task, dueAt, now = new Date()) {
  const land = findLand(task.land_id);
  const typeKey = canonicalExpenseType(task.expense_type || "");
  const typeLabel = label(typeKey || task.expense_type || "task");
  const categoryLabel = normalizeId(task.category || task.fertilizer_type);
  const taskName = categoryLabel ? `${typeLabel} - ${categoryLabel}` : typeLabel;
  const dueText = `${formatDate(dueAt)} at ${formatTaskTime(task.task_time)}`;
  const msPerDay = 24 * 60 * 60 * 1000;
  const remainingDays = Math.max(0, Math.ceil((dueAt.getTime() - now.getTime()) / msPerDay));
  const whenText = remainingDays === 0
    ? "Task is due today"
    : `Task is due in ${remainingDays} day${remainingDays === 1 ? "" : "s"}`;

  const title = remainingDays === 0
    ? `Task Day: ${taskName}`
    : `Task Reminder: ${taskName}`;

  const body = `${whenText}\nLand: ${land?.land_name || "Unknown"}\nWhen: ${dueText}`;

  const options = {
    body,
    icon: "./Img/icon-192.png",
    badge: "./Img/icon-192.png",
    tag: `task-reminder-${normalizeId(task.id) || normalizeId(taskName)}`,
    renotify: true,
    data: {
      url: "./index.html?section=tasks",
      taskId: normalizeId(task.id)
    }
  };

  try {
    const registration = await getTaskNotificationRegistration();
    if (registration?.showNotification) {
      await registration.showNotification(title, options);
      return true;
    }

    const fallbackNotification = new Notification(title, options);
    fallbackNotification.onclick = () => {
      window.focus();
      activateSection("tasks");
    };
    return true;
  } catch (error) {
    console.warn("Task reminder notification failed:", error);
    return false;
  }
}

function buildTaskReminderToken(task, daysBefore, dueAt) {
  const taskId = normalizeId(task.id) || `${normalizeId(task.land_id)}-${normalizeId(task.expense_type || "task")}-${normalizeId(task.category || task.fertilizer_type)}`;
  return `${taskId}|${formatDateInput(dueAt)}|${normalizeTaskTime(task.task_time)}|d${daysBefore}`;
}

function loadTaskReminderLog() {
  try {
    const raw = localStorage.getItem(TASK_REMINDER_LOG_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};

    const cutoff = Date.now() - (45 * 24 * 60 * 60 * 1000);
    Object.keys(parsed).forEach((key) => {
      if (!Number.isFinite(Number(parsed[key])) || Number(parsed[key]) < cutoff) {
        delete parsed[key];
      }
    });

    return parsed;
  } catch (error) {
    console.warn("Unable to read task reminder log:", error);
    return {};
  }
}

function saveTaskReminderLog(log) {
  try {
    localStorage.setItem(TASK_REMINDER_LOG_KEY, JSON.stringify(log || {}));
  } catch (error) {
    console.warn("Unable to save task reminder log:", error);
  }
}
function renderProfile() {
  const signedIn = Boolean(authState.user);
  const profile = authState.profile || {};
  const email = authState.user?.email || normalizeId(profile.email);
  const displayName = normalizeId(profile.display_name) || defaultDisplayNameFromEmail(email);
  const roleLabel = isAdmin() ? "Admin" : "User";
  const initials = profileInitials(displayName);

  text("navProfileInitials", initials);
  text("profileInitials", initials);
  text("profileNameHeading", signedIn ? displayName : "User");
  text("profileEmailText", signedIn ? email : "-");
  setValue("profileEmail", signedIn ? email : "");
  setValue("profileRole", signedIn ? roleLabel : "");
  setValue("profileDisplayName", signedIn ? displayName : "");
  setValue("profilePhone", signedIn ? normalizeId(profile.phone) : "");
  setValue("profileLocation", signedIn ? normalizeId(profile.location) : "");
  setValue("profileBio", signedIn ? normalizeId(profile.bio) : "");

  const roleBadge = document.getElementById("profileRoleBadge");
  if (roleBadge) {
    roleBadge.textContent = roleLabel;
    roleBadge.classList.remove("role-admin", "role-user");
    roleBadge.classList.add(isAdmin() ? "role-admin" : "role-user");
  }

  const updatedText = formatDateTime(profile.updated_at);
  text(
    "profileUpdatedAt",
    signedIn ? (updatedText ? `Last updated: ${updatedText}` : "No profile updates yet.") : "Sign in to manage your profile."
  );

  const saveBtn = document.getElementById("profileSaveBtn");
  if (saveBtn) saveBtn.disabled = !signedIn;
  const profileLogoutBtn = document.getElementById("profileLogoutBtn");
  if (profileLogoutBtn) profileLogoutBtn.disabled = !signedIn;
}

function bindLogoutButtons() {
  const ids = ["logoutBtn", "profileLogoutBtn"];
  ids.forEach((id) => {
    const btn = document.getElementById(id);
    if (!btn || btn.dataset.logoutBound === "1") return;
    btn.dataset.logoutBound = "1";
    btn.addEventListener("click", async () => {
      try {
        await disableTaskFcmSubscription();
        await signOut(auth);
        window.location.href = "../index.html";
      } catch (error) {
        showAlert(`Logout failed: ${error.message}`, "danger");
      }
    });
  });
}

function buildDefaultProfile() {
  const email = authState.user?.email || "";
  return {
    role: "user",
    email,
    display_name: defaultDisplayNameFromEmail(email),
    phone: "",
    location: "",
    bio: ""
  };
}

function defaultDisplayNameFromEmail(email) {
  const prefix = normalizeId(email).split("@")[0] || "User";
  return prefix
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function profileInitials(name) {
  const cleaned = normalizeId(name).trim();
  if (!cleaned) return "U";
  return cleaned
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function bindRowActionHandlers(root) {
  if (!root) return;

  root.querySelectorAll("button[data-record-view]").forEach((btn) => {
    btn.addEventListener("click", () => {
      openRecordModal(btn.dataset.recordView, btn.dataset.recordId, "view");
    });
  });

  root.querySelectorAll("button[data-record-edit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!requireAdmin("edit records")) return;
      openRecordModal(btn.dataset.recordEdit, btn.dataset.recordId, "edit");
    });
  });

  root.querySelectorAll("button[data-delete]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!requireAdmin("delete records")) return;
      try {
        const col = btn.dataset.delete;
        const idToDelete = btn.dataset.id;
        if (!col || !idToDelete) return;
        const deleteLabel = {
          harvest: "harvest record",
          expenses: "expense record",
          laborers: "labor record",
          tasks: "task record"
        }[col] || "record";
        if (!window.confirm(`Are you sure you want to delete this ${deleteLabel}?`)) return;
        await deleteDoc(doc(db, col === "tasks" ? "fertilizer_schedule" : col, idToDelete));
        showAlert("Record deleted.", "success");
      } catch (error) {
        showAlert(`Delete failed: ${error.message}`, "danger");
      }
    });
  });

  root.querySelectorAll("button[data-complete]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!requireAdmin("update task status")) return;
      try {
        await updateDoc(doc(db, "fertilizer_schedule", btn.dataset.complete), { status: "completed" });
        showAlert("Task marked complete.", "success");
      } catch (error) {
        showAlert(`Update failed: ${error.message}`, "danger");
      }
    });
  });

  root.querySelectorAll("button[data-info]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const msg = btn.dataset.info || "No additional information.";
      showAlert(unescapeHtml(msg), "info");
    });
  });
}

function mobileExtraFieldsAttr(fields = []) {
  const normalizedFields = fields
    .map((field) => ({
      label: normalizeId(field?.label),
      value: normalizeId(field?.value)
    }))
    .filter((field) => field.label || field.value);

  if (!normalizedFields.length) return "";

  const payload = encodeURIComponent(JSON.stringify(
    normalizedFields.map((field) => ({
      label: field.label || "Details",
      value: field.value || "-"
    }))
  ));
  return ` data-mobile-extra="${esc(payload)}"`;
}

function setRows(id, rows, colSpan, emptyText) {
  const el = document.getElementById(id);
  if (!el) return;
  if (!rows.length) {
    el.innerHTML = `<tr><td class="empty-row" colspan="${colSpan}">${esc(emptyText)}</td></tr>`;
  } else {
    el.innerHTML = rows.join("");
  }

  responsiveTables.sync(id);

  bindRowActionHandlers(el);
  const cardsContainer = responsiveTables.getCardsContainer(id);
  if (cardsContainer) bindRowActionHandlers(cardsContainer);
}

function ensureRecordModal() {
  if (document.getElementById("recordModalOverlay")) return;

  document.body.insertAdjacentHTML("beforeend", `
    <div id="recordModalOverlay" class="record-modal-overlay" hidden>
      <div class="record-modal-card" role="dialog" aria-modal="true" aria-labelledby="recordModalTitle">
        <div class="record-modal-header">
          <h3 id="recordModalTitle">Record Details</h3>
          <button type="button" class="record-modal-close" id="recordModalCloseBtn" aria-label="Close details">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="record-modal-body" id="recordModalBody"></div>
      </div>
    </div>
  `);

  const overlay = document.getElementById("recordModalOverlay");
  const closeBtn = document.getElementById("recordModalCloseBtn");
  if (closeBtn) closeBtn.addEventListener("click", closeRecordModal);
  if (overlay) {
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) closeRecordModal();
    });
  }
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && uiState.recordModal) closeRecordModal();
  });
}

function openRecordModal(recordType, recordId, mode = "view") {
  const normalizedType = normalizeId(recordType).toLowerCase();
  const normalizedId = normalizeId(recordId);
  const normalizedMode = mode === "edit" ? "edit" : "view";

  if (!normalizedType || !normalizedId) return;
  const record = getRecordByType(normalizedType, normalizedId);
  if (!record) {
    showAlert("Record not found.", "warning");
    return;
  }

  uiState.recordModal = { type: normalizedType, id: normalizedId, mode: normalizedMode };
  renderRecordModal();

  const overlay = document.getElementById("recordModalOverlay");
  if (overlay) overlay.hidden = false;
  document.body.classList.add("modal-open");
}

function closeRecordModal() {
  uiState.recordModal = null;
  const overlay = document.getElementById("recordModalOverlay");
  if (overlay) overlay.hidden = true;
  document.body.classList.remove("modal-open");
}

function renderRecordModal() {
  if (!uiState.recordModal) return;
  const { type, id, mode } = uiState.recordModal;
  const record = getRecordByType(type, id);
  if (!record) {
    closeRecordModal();
    showAlert("This record is no longer available.", "warning");
    return;
  }

  const title = document.getElementById("recordModalTitle");
  const body = document.getElementById("recordModalBody");
  if (!title || !body) return;

  title.textContent = `${recordTypeLabel(type)} ${mode === "edit" ? "Edit" : "Details"}`;
  body.innerHTML = mode === "edit" ? buildRecordEditMarkup(type, record) : buildRecordViewMarkup(type, record);

  bindRecordModalEvents(type, record);
}

function bindRecordModalEvents(recordType, record) {
  const body = document.getElementById("recordModalBody");
  if (!body) return;

  body.querySelectorAll("[data-record-close]").forEach((btn) => {
    btn.addEventListener("click", closeRecordModal);
  });

  body.querySelectorAll("[data-record-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const mode = btn.dataset.recordMode === "edit" ? "edit" : "view";
      if (recordType === "lands" && mode === "edit") {
        closeRecordModal();
        activateSection("lands");
        openLandEdit(record.id);
        return;
      }
      openRecordModal(recordType, record.id, mode);
    });
  });

  body.querySelectorAll("[data-record-delete]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!requireAdmin("delete records")) return;
      if (!window.confirm(`Are you sure you want to delete this ${recordTypeLabel(recordType).toLowerCase()}?`)) return;
      try {
        if (recordType === "lands") {
          const relatedDeleted = await deleteLandWithRelatedRecords(normalizeId(btn.dataset.recordDelete), getLandKey(record));
          closeRecordModal();
          showAlert(`Land deleted. Removed ${formatInt(relatedDeleted)} related records.`, "success");
          return;
        }
        await deleteDoc(doc(db, getCollectionNameByRecordType(recordType), normalizeId(btn.dataset.recordDelete)));
        closeRecordModal();
        showAlert("Record deleted.", "success");
      } catch (error) {
        showAlert(`Delete failed: ${error.message}`, "danger");
      }
    });
  });

  const editForm = body.querySelector("#recordEditForm");
  if (editForm) {
    editForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!requireAdmin("update records")) return;
      if (!window.confirm("Do you want to save these changes?")) return;
      try {
        await saveRecordModalChanges(recordType, record.id, editForm);
        closeRecordModal();
        showAlert(`${recordTypeLabel(recordType)} updated successfully.`, "success");
      } catch (error) {
        showAlert(`Update failed: ${error.message}`, "danger");
      }
    });
  }

  const expenseTypeSelect = body.querySelector("#modalExpenseType");
  if (expenseTypeSelect) {
    const expenseCategorySelect = body.querySelector("#modalExpenseCategory");
    refreshExpenseModalCategoryOptions(expenseTypeSelect.value, normalizeId(record.category));
    refreshExpenseModalPlantCountInput(expenseTypeSelect.value, expenseCategorySelect?.value || normalizeId(record.category));
    expenseTypeSelect.addEventListener("change", () => {
      refreshExpenseModalCategoryOptions(expenseTypeSelect.value, "");
      refreshExpenseModalPlantCountInput(expenseTypeSelect.value, expenseCategorySelect?.value || "");
    });
    expenseCategorySelect?.addEventListener("change", () => {
      refreshExpenseModalPlantCountInput(expenseTypeSelect.value, expenseCategorySelect.value);
    });
  }
}

function getRecordByType(type, id) {
  const listByType = {
    lands: state.lands,
    expenses: state.expenses,
    harvest: state.harvest,
    laborers: state.laborers
  };
  const list = listByType[type] || [];
  return list.find((entry) => normalizeId(entry.id) === normalizeId(id)) || null;
}

function getCollectionNameByRecordType(type) {
  return type === "tasks" ? "fertilizer_schedule" : type;
}

function recordTypeLabel(type) {
  return {
    lands: "Land Record",
    expenses: "Expense Record",
    harvest: "Harvest Record",
    laborers: "Labor Record"
  }[type] || "Record";
}

function buildRecordViewMarkup(type, record) {
  if (type === "lands") {
    const landKey = getLandKey(record);
    const latestPlant = getLatestPlantEntryForLand(landKey, record.id);
    const totalPlants = Number(latestPlant?.plant_count || 0);
    const revenue = state.harvest
      .filter((entry) => idsMatch(entry.land_id, landKey, record.id))
      .reduce((sum, entry) => sum + Number(entry.total_revenue || 0), 0);
    const expense = state.expenses
      .filter((entry) => idsMatch(entry.land_id, landKey, record.id))
      .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
    const sizeText = record.size_hectares
      ? `${formatNum(Number(record.size_hectares))} Hectares`
      : (record.size_perches ? `${formatNum(Number(record.size_perches))} Perches` : "-");

    const fields = [
      ["Land Name", record.land_name || "Unnamed Land"],
      ["Status", label(record.status || "active")],
      ["Location", record.location || "-"],
      ["Size", sizeText],
      ["Variety", record.pineapple_variety || "-"],
      ["Planting Date", formatDate(record.planting_date)],
      ["Expected Harvest", formatDate(record.expected_harvest_date)],
      ["Plants", formatInt(totalPlants)],
      ["Revenue", formatCurrency(revenue)],
      ["Expenses", formatCurrency(expense)],
      ["Profit", formatCurrency(revenue - expense)]
    ];
    return buildRecordDetailsMarkup(fields, type, record.id);
  }

  if (type === "harvest") {
    const land = findLand(record.land_id);
    const fields = [
      ["Land", land?.land_name || "Unknown"],
      ["Date", formatDate(record.harvest_date)],
      ["Quantity (kg)", `${formatNum(record.quantity_kg)} kg`],
      ["Fruits Count", formatInt(record.quantity_fruits)],
      ["Grade A/B/C (kg)", `${formatNum(record.grade_a)} / ${formatNum(record.grade_b)} / ${formatNum(record.grade_c)}`],
      ["Revenue", formatCurrency(record.total_revenue)],
      ["Average Price/KG", formatCurrency(record.avg_price_per_kg)],
      ["Buyer", record.buyer_name || "-"],
      ["Notes", record.notes || "-"]
    ];
    return buildRecordDetailsMarkup(fields, type, record.id);
  }

  if (type === "laborers") {
    const land = findLand(record.land_id);
    const fields = [
      ["Name", record.laborer_name || "-"],
      ["Contact", record.contact || "-"],
      ["Join Date", formatDate(record.join_date)],
      ["Assigned Land", land?.land_name || "Not Assigned"],
      ["Skills", record.skills || "-"],
      ["Status", label(record.status || "inactive")]
    ];
    return buildRecordDetailsMarkup(fields, type, record.id);
  }

  const land = findLand(record.land_id);
  const laborer = state.laborers.find((entry) => normalizeId(entry.id) === normalizeId(record.laborer_id));
  const normalizedType = canonicalExpenseType(record.expense_type) || normalizeId(record.expense_type);
  const fields = [
    ["Date", formatDate(record.expense_date)],
    ["Land", land?.land_name || "General Expense"],
    ["Laborer", laborer?.laborer_name || "-"],
    ["Type", label(normalizedType || "other")],
    ["Category", record.category || "-"],
    ["Plant Count", shouldTrackPlantCount(normalizedType, record.category) && Number(record.plant_count || 0) > 0 ? formatInt(Number(record.plant_count)) : "-"],
    ["Amount", formatCurrency(record.amount)],
    ["Payment Method", label(record.payment_method || "cash")],
    ["Description", record.description || "-"]
  ];
  return buildRecordDetailsMarkup(fields, type, record.id);
}

function buildRecordDetailsMarkup(fields, recordType, recordId) {
  const canEdit = isAdmin();
  return `
    <div class="record-details-grid">
      ${fields.map(([labelText, valueText]) => `
        <div class="record-detail-item">
          <div class="record-detail-label">${esc(labelText)}</div>
          <div class="record-detail-value">${esc(valueText)}</div>
        </div>
      `).join("")}
    </div>
    <div class="record-modal-actions">
      <button type="button" class="btn btn-secondary" data-record-close><i class="fas fa-times"></i> Close</button>
      ${canEdit ? '<button type="button" class="btn" data-record-mode="edit"><i class="fas fa-pen"></i> Edit</button>' : ""}
      ${canEdit ? `<button type="button" class="btn btn-danger" data-record-delete="${esc(recordId)}"><i class="fas fa-trash"></i> Delete</button>` : ""}
    </div>
  `;
}

function buildRecordEditMarkup(type, record) {
  if (type === "harvest") {
    const landOptions = state.lands
      .map((land) => `<option value="${esc(getLandKey(land))}" ${idsMatch(record.land_id, getLandKey(land), land.id) ? "selected" : ""}>${esc(land.land_name || "Unnamed")}</option>`)
      .join("");

    return `
      <form id="recordEditForm" class="simple-form">
        <div class="record-modal-grid">
          <div class="form-group"><label>Land</label><select name="land_id" class="form-control">${landOptions}</select></div>
          <div class="form-group"><label>Date</label><input name="harvest_date" class="form-control" type="date" value="${esc(toDateInputValue(record.harvest_date))}"></div>
          <div class="form-group"><label>Quantity (kg)</label><input name="quantity_kg" class="form-control" type="number" step="0.01" min="0" value="${esc(String(Number(record.quantity_kg || 0)))}"></div>
          <div class="form-group"><label>Fruits Count</label><input name="quantity_fruits" class="form-control" type="number" min="0" value="${esc(String(Number(record.quantity_fruits || 0)))}"></div>
          <div class="form-group"><label>Grade A (kg)</label><input name="grade_a" class="form-control" type="number" step="0.01" min="0" value="${esc(String(Number(record.grade_a || 0)))}"></div>
          <div class="form-group"><label>Grade A Price</label><input name="grade_a_price" class="form-control" type="number" step="0.01" min="0" value="${esc(String(Number(record.grade_a_price || 0)))}"></div>
          <div class="form-group"><label>Grade B (kg)</label><input name="grade_b" class="form-control" type="number" step="0.01" min="0" value="${esc(String(Number(record.grade_b || 0)))}"></div>
          <div class="form-group"><label>Grade B Price</label><input name="grade_b_price" class="form-control" type="number" step="0.01" min="0" value="${esc(String(Number(record.grade_b_price || 0)))}"></div>
          <div class="form-group"><label>Grade C (kg)</label><input name="grade_c" class="form-control" type="number" step="0.01" min="0" value="${esc(String(Number(record.grade_c || 0)))}"></div>
          <div class="form-group"><label>Grade C Price</label><input name="grade_c_price" class="form-control" type="number" step="0.01" min="0" value="${esc(String(Number(record.grade_c_price || 0)))}"></div>
          <div class="form-group"><label>Buyer</label><input name="buyer_name" class="form-control" value="${esc(record.buyer_name || "")}"></div>
          <div class="form-group full"><label>Notes</label><textarea name="notes" class="form-control">${esc(record.notes || "")}</textarea></div>
        </div>
        <div class="record-modal-actions">
          <button type="button" class="btn btn-secondary" data-record-mode="view"><i class="fas fa-arrow-left"></i> Back</button>
          <button type="submit" class="btn"><i class="fas fa-save"></i> Save Changes</button>
        </div>
      </form>
    `;
  }

  if (type === "laborers") {
    const landOptions = ['<option value="">None</option>']
      .concat(state.lands.map((land) => `<option value="${esc(getLandKey(land))}" ${idsMatch(record.land_id, getLandKey(land), land.id) ? "selected" : ""}>${esc(land.land_name || "Unnamed")}</option>`))
      .join("");

    return `
      <form id="recordEditForm" class="simple-form">
        <div class="record-modal-grid">
          <div class="form-group"><label>Name</label><input name="laborer_name" class="form-control" required value="${esc(record.laborer_name || "")}"></div>
          <div class="form-group"><label>Contact</label><input name="contact" class="form-control" value="${esc(record.contact || "")}"></div>
          <div class="form-group"><label>Join Date</label><input name="join_date" class="form-control" type="date" value="${esc(toDateInputValue(record.join_date))}"></div>
          <div class="form-group"><label>Assigned Land</label><select name="land_id" class="form-control">${landOptions}</select></div>
          <div class="form-group"><label>Skills</label><input name="skills" class="form-control" value="${esc(record.skills || "")}"></div>
          <div class="form-group">
            <label>Status</label>
            <select name="status" class="form-control">
              <option value="active" ${normalizeId(record.status) === "active" ? "selected" : ""}>Active</option>
              <option value="inactive" ${normalizeId(record.status) === "inactive" ? "selected" : ""}>Inactive</option>
              <option value="on_leave" ${normalizeId(record.status) === "on_leave" ? "selected" : ""}>On Leave</option>
            </select>
          </div>
        </div>
        <div class="record-modal-actions">
          <button type="button" class="btn btn-secondary" data-record-mode="view"><i class="fas fa-arrow-left"></i> Back</button>
          <button type="submit" class="btn"><i class="fas fa-save"></i> Save Changes</button>
        </div>
      </form>
    `;
  }

  const currentType = canonicalExpenseType(record.expense_type) || "extra";
  const typeOptions = ["plants", "labor", "fertilizer", "chemicals", "tools_equipment", "machines", "transport", "irrigation", "land_preparation", "extra"]
    .map((typeValue) => `<option value="${esc(typeValue)}" ${typeValue === currentType ? "selected" : ""}>${esc(label(typeValue))}</option>`)
    .join("");
  const landOptions = ['<option value="">None</option>']
    .concat(state.lands.map((land) => `<option value="${esc(getLandKey(land))}" ${idsMatch(record.land_id, getLandKey(land), land.id) ? "selected" : ""}>${esc(land.land_name || "Unnamed")}</option>`))
    .join("");
  const laborerOptions = ['<option value="">None</option>']
    .concat(state.laborers.map((laborer) => `<option value="${esc(laborer.id)}" ${idsMatch(record.laborer_id, laborer.id, laborer.laborer_id) ? "selected" : ""}>${esc(laborer.laborer_name || "Unknown")}</option>`))
    .join("");
  const paymentOptions = ["cash", "bank_transfer", "cheque", "digital_wallet", "other"]
    .map((payment) => `<option value="${esc(payment)}" ${normalizeId(record.payment_method) === payment ? "selected" : ""}>${esc(label(payment))}</option>`)
    .join("");
  const modalPlantCount = Number(record.plant_count || 0);

  return `
    <form id="recordEditForm" class="simple-form">
      <div class="record-modal-grid">
        <div class="form-group"><label>Land</label><select name="land_id" class="form-control">${landOptions}</select></div>
        <div class="form-group"><label>Laborer</label><select name="laborer_id" class="form-control">${laborerOptions}</select></div>
        <div class="form-group"><label>Type</label><select id="modalExpenseType" name="expense_type" class="form-control">${typeOptions}</select></div>
        <div class="form-group"><label>Category</label><select id="modalExpenseCategory" name="category" class="form-control"></select></div>
        <div class="form-group" id="modalExpensePlantCountWrap" ${shouldTrackPlantCount(currentType, record.category) ? "" : "hidden"}><label>Plant Count</label><input id="modalExpensePlantCount" name="plant_count" class="form-control" type="number" min="1" step="1" value="${esc(modalPlantCount > 0 ? String(modalPlantCount) : "")}"></div>
        <div class="form-group"><label>Amount</label><input name="amount" class="form-control" type="number" step="0.01" min="0.01" required value="${esc(String(Number(record.amount || 0)))}"></div>
        <div class="form-group"><label>Date</label><input name="expense_date" class="form-control" type="date" value="${esc(toDateInputValue(record.expense_date))}"></div>
        <div class="form-group"><label>Payment</label><select name="payment_method" class="form-control">${paymentOptions}</select></div>
        <div class="form-group full"><label>Description</label><textarea name="description" class="form-control" required>${esc(record.description || "")}</textarea></div>
      </div>
      <div class="record-modal-actions">
        <button type="button" class="btn btn-secondary" data-record-mode="view"><i class="fas fa-arrow-left"></i> Back</button>
        <button type="submit" class="btn"><i class="fas fa-save"></i> Save Changes</button>
      </div>
    </form>
  `;
}

function refreshExpenseModalCategoryOptions(type, selectedCategory) {
  const categorySelect = document.getElementById("modalExpenseCategory");
  if (!categorySelect) return;

  const normalizedType = canonicalExpenseType(type) || "extra";
  const categoryList = [...(expenseCategories[normalizedType] || [])];
  if (!categoryList.length) categoryList.push("Other");
  const currentCategory = normalizeId(selectedCategory);
  if (currentCategory && !categoryList.includes(currentCategory)) {
    categoryList.unshift(currentCategory);
  }

  categorySelect.innerHTML = ['<option value="">Select Category</option>']
    .concat(categoryList.map((category) => `<option value="${esc(category)}" ${category === currentCategory ? "selected" : ""}>${esc(category)}</option>`))
    .join("");
}

function refreshExpenseModalPlantCountInput(typeValue, categoryValue) {
  const wrap = document.getElementById("modalExpensePlantCountWrap");
  const input = document.getElementById("modalExpensePlantCount");
  if (!wrap || !input) return;
  const shouldShow = shouldTrackPlantCount(typeValue, categoryValue);
  wrap.hidden = !shouldShow;
  input.required = shouldShow;
  input.disabled = !shouldShow;
  if (!shouldShow) input.value = "";
}

async function saveRecordModalChanges(type, id, formEl) {
  const formData = new FormData(formEl);
  if (type === "harvest") {
    const quantityKg = Number(formData.get("quantity_kg") || 0);
    const gradeA = Number(formData.get("grade_a") || 0);
    const gradeB = Number(formData.get("grade_b") || 0);
    const gradeC = Number(formData.get("grade_c") || 0);
    const priceA = Number(formData.get("grade_a_price") || 0);
    const priceB = Number(formData.get("grade_b_price") || 0);
    const priceC = Number(formData.get("grade_c_price") || 0);
    const revA = gradeA * priceA;
    const revB = gradeB * priceB;
    const revC = gradeC * priceC;
    const totalRevenue = revA + revB + revC;

    await updateDoc(doc(db, "harvest", id), {
      land_id: normalizeId(formData.get("land_id")),
      harvest_date: normalizeId(formData.get("harvest_date")),
      quantity_kg: quantityKg,
      quantity_fruits: Number(formData.get("quantity_fruits") || 0),
      grade_a: gradeA,
      grade_b: gradeB,
      grade_c: gradeC,
      grade_a_price: priceA,
      grade_b_price: priceB,
      grade_c_price: priceC,
      grade_a_revenue: revA,
      grade_b_revenue: revB,
      grade_c_revenue: revC,
      total_revenue: totalRevenue,
      avg_price_per_kg: quantityKg > 0 ? totalRevenue / quantityKg : 0,
      buyer_name: normalizeId(formData.get("buyer_name")),
      notes: normalizeId(formData.get("notes")),
      updated_at: serverTimestamp()
    });
    return;
  }

  if (type === "laborers") {
    await updateDoc(doc(db, "laborers", id), {
      laborer_name: normalizeId(formData.get("laborer_name")),
      contact: normalizeId(formData.get("contact")),
      join_date: normalizeId(formData.get("join_date")),
      land_id: normalizeId(formData.get("land_id")) || null,
      skills: normalizeId(formData.get("skills")),
      status: normalizeId(formData.get("status")) || "active",
      updated_at: serverTimestamp()
    });
    return;
  }

  const updatedExpenseType = canonicalExpenseType(formData.get("expense_type")) || normalizeId(formData.get("expense_type"));
  const updatedCategory = normalizeId(formData.get("category"));
  const requiresPlantCount = shouldTrackPlantCount(updatedExpenseType, updatedCategory);
  const updatedPlantCount = Number(formData.get("plant_count") || 0);
  if (requiresPlantCount && !(updatedPlantCount > 0)) {
    throw new Error("Plant count is required for Pineapple Plants or Pineapple Planting categories.");
  }

  await updateDoc(doc(db, "expenses", id), {
    land_id: normalizeId(formData.get("land_id")) || null,
    laborer_id: normalizeId(formData.get("laborer_id")) || null,
    expense_type: normalizeId(formData.get("expense_type")),
    category: updatedCategory,
    plant_count: requiresPlantCount ? updatedPlantCount : null,
    description: normalizeId(formData.get("description")),
    amount: Number(formData.get("amount") || 0),
    expense_date: normalizeId(formData.get("expense_date")),
    payment_method: normalizeId(formData.get("payment_method")) || "cash",
    updated_at: serverTimestamp()
  });
}

function value(id) { return document.getElementById(id)?.value?.trim() || ""; }
function num(id) { return Number(document.getElementById(id)?.value || 0); }
function numOrNull(id) {
  const raw = document.getElementById(id)?.value;
  if (raw === "" || raw === null || raw === undefined) return null;
  const v = Number(raw);
  return Number.isFinite(v) ? v : null;
}
function text(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }
function setValue(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}
function preserveSelectValue(selectEl, currentValue) {
  if (!selectEl) return;
  if (!currentValue) {
    if (Array.from(selectEl.options).some((o) => o.value === "")) {
      selectEl.value = "";
    }
    return;
  }
  if (Array.from(selectEl.options).some((o) => o.value === currentValue)) {
    selectEl.value = currentValue;
  }
}
function exportTableToCsv(tbodyId, filename, headers = []) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  const rows = Array.from(tbody.querySelectorAll("tr"));
  if (!rows.length || rows[0].querySelector(".empty-row")) {
    showAlert("No rows available to export.", "warning");
    return;
  }

  const lines = [];
  if (headers.length) lines.push(headers.join(","));

  rows.forEach((row) => {
    const cols = Array.from(row.querySelectorAll("td"))
      .slice(0, headers.length || undefined)
      .map((td) => {
        const textValue = td.textContent.replace(/\s+/g, " ").trim().replace(/"/g, "\"\"");
        return `"${textValue}"`;
      });
    lines.push(cols.join(","));
  });

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
function normalizeId(v) {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}
function canonicalExpenseType(value) {
  const raw = normalizeId(value).toLowerCase();
  if (!raw) return "";
  const key = raw
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  if (key.includes("plant")) return "plants";
  if (key === "labor" || key === "labour") return "labor";
  if (key === "fertilizer" || key === "fertiliser") return "fertilizer";
  if (key === "chemicals" || key === "chemical") return "chemicals";
  if (key.includes("tools") && key.includes("equipment")) return "tools_equipment";
  if (key === "machines" || key === "machine" || key === "jcb" || key === "excavator") return "machines";
  if (key === "transport" || key === "transportation") return "transport";
  if (key === "irrigation") return "irrigation";
  if (key.includes("land") && key.includes("preparation")) return "land_preparation";
  if (key === "extra" || key === "other" || key === "misc" || key === "miscellaneous") return "extra";
  return key;
}
function canonicalExpenseCategory(value) {
  return normalizeId(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}
function shouldTrackPlantCount(expenseType, category) {
  const typeKey = canonicalExpenseType(expenseType);
  const categoryKey = canonicalExpenseCategory(category);
  return (typeKey === "plants" && categoryKey === "pineapple_plants")
    || (typeKey === "labor" && categoryKey === "pineapple_planting");
}
function getLandKey(land) {
  return normalizeId(land?._land_key ?? land?.land_id ?? land?.id);
}
function idsMatch(value, ...candidates) {
  const needle = normalizeId(value);
  if (!needle) return false;
  return candidates.some((candidate) => needle === normalizeId(candidate));
}
function findLand(id) {
  return state.lands.find((l) => idsMatch(id, getLandKey(l), l.id, l.land_id)) || null;
}
function isRecordLinkedToKnownLand(id) {
  if (!normalizeId(id)) return false;
  return Boolean(findLand(id));
}
function parseDate(v) { if (!v) return null; const d = v?.toDate ? v.toDate() : new Date(v); return Number.isNaN(d.getTime()) ? null : d; }
function normalizeTaskTime(v) {
  const raw = normalizeId(v);
  const match = raw.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!match) return TASK_REMINDER_DEFAULT_TIME;
  return `${match[1]}:${match[2]}`;
}
function getTaskDateTime(task) {
  const baseDate = parseDate(task?.next_date);
  if (!baseDate) return null;
  const [hours, minutes] = normalizeTaskTime(task?.task_time).split(":").map((part) => Number(part));
  baseDate.setHours(hours, minutes, 0, 0);
  return baseDate;
}
function taskDateTimeVal(task) {
  const date = getTaskDateTime(task);
  return date ? date.getTime() : 0;
}
function formatTaskTime(v) {
  const normalized = normalizeTaskTime(v);
  const [hours, minutes] = normalized.split(":").map((part) => Number(part));
  const dt = new Date();
  dt.setHours(hours, minutes, 0, 0);
  return dt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}
function taskCountdownClass(taskDateTime, now = new Date()) {
  if (!(taskDateTime instanceof Date) || Number.isNaN(taskDateTime.getTime())) return "countdown-unknown";
  const diffMs = taskDateTime.getTime() - now.getTime();
  if (diffMs < 0) return "countdown-overdue";
  if (diffMs <= (TASK_COUNTDOWN_SOON_THRESHOLD_DAYS * 24 * 60 * 60 * 1000)) return "countdown-soon";
  return "countdown-upcoming";
}
function formatTaskCountdown(taskDateTime, now = new Date()) {
  if (!(taskDateTime instanceof Date) || Number.isNaN(taskDateTime.getTime())) return "-";

  const diffMs = taskDateTime.getTime() - now.getTime();
  const absMinutes = Math.floor(Math.abs(diffMs) / (60 * 1000));
  const days = Math.floor(absMinutes / (24 * 60));
  const hours = Math.floor((absMinutes % (24 * 60)) / 60);
  const minutes = absMinutes % 60;

  if (diffMs >= 0 && absMinutes === 0) return "Due <1m";
  if (diffMs < 0 && absMinutes === 0) return "Overdue <1m";

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0 || days > 0) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);

  return diffMs >= 0 ? `In ${parts.join(" ")}` : `Overdue ${parts.join(" ")}`;
}
function dateVal(v) { const d = parseDate(v); return d ? d.getTime() : 0; }
function formatDate(v) { const d = parseDate(v); return d ? d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "-"; }
function formatDateTime(v) { const d = parseDate(v); return d ? d.toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : ""; }
function formatDateInput(d) { const x = new Date(d); const m = `${x.getMonth() + 1}`.padStart(2, "0"); const day = `${x.getDate()}`.padStart(2, "0"); return `${x.getFullYear()}-${m}-${day}`; }
function formatCurrency(v) { return `Rs. ${Number(v || 0).toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function formatNum(v) { return Number(v || 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 }); }
function formatInt(v) { return Number(v || 0).toLocaleString("en-US", { maximumFractionDigits: 0 }); }
function getLandColor(seed) {
  const colors = ["#4CAF50", "#2196F3", "#9C27B0", "#FF9800", "#F44336", "#00BCD4"];
  const raw = normalizeId(seed);
  if (!raw) return colors[0];
  const numeric = Number(raw);
  if (Number.isFinite(numeric)) return colors[Math.abs(Math.floor(numeric)) % colors.length];
  let hash = 0;
  for (let i = 0; i < raw.length; i += 1) {
    hash = ((hash << 5) - hash) + raw.charCodeAt(i);
    hash |= 0;
  }
  return colors[Math.abs(hash) % colors.length];
}
function label(v) { return (v || "").replaceAll("_", " ").replace(/\b\w/g, (m) => m.toUpperCase()); }
function statusBadgeClass(v) {
  const status = normalizeId(v).toLowerCase();
  return status === "active" || status === "completed" ? "normal" : (status === "pending" || status === "on_leave" ? "upcoming" : "urgent");
}
function esc(v) {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
function unescapeHtml(str) {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = str;
  return textarea.value;
}

function showAlert(message, type = "info") {
  const target = document.getElementById("appAlert");
  if (!target) return;
  const alertToken = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  target.dataset.alertToken = alertToken;
  target.innerHTML = `<div class="alert alert-${type}"><i class="fas fa-circle-info"></i><div>${esc(message)}</div></div>`;
  setTimeout(() => {
    if (target.dataset.alertToken === alertToken) target.innerHTML = "";
  }, 4500);
}
