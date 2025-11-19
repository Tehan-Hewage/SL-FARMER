// Admin System for Product Availability Management with Supabase

// --- Supabase setup ---
// Make sure the Supabase CDN script is loaded BEFORE this file:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

// ⬇️ REPLACE THESE TWO WITH YOUR REAL VALUES FROM SUPABASE
const SUPABASE_URL = "https://puxiktpaztheoiglwsyl.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_svw-D9G9WubR9lDGoewQ1g_OBVg_zJD";

// Initialize Supabase client (with error handling)
let db = null;

function initSupabase() {
  if (typeof supabase === 'undefined') {
    console.error('Supabase is not loaded. Make sure the Supabase CDN script is included before admin.js');
    return false;
  }
  
  try {
    const { createClient } = supabase;
    db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return true;
  } catch (error) {
    console.error('Error initializing Supabase:', error);
    return false;
  }
}

// Try to initialize Supabase immediately, or wait for it to load
if (typeof supabase !== 'undefined') {
  initSupabase();
} else {
  // Wait for Supabase to load
  const checkSupabase = setInterval(() => {
    if (typeof supabase !== 'undefined') {
      initSupabase();
      clearInterval(checkSupabase);
    }
  }, 100);
  
  // Timeout after 5 seconds
  setTimeout(() => {
    clearInterval(checkSupabase);
    if (!db) {
      console.error('Supabase failed to load after 5 seconds');
    }
  }, 5000);
}

// --- Admin System ---

const AdminSystem = {
  products: [],
  originalProducts: [],
  filteredProducts: [],
  searchQuery: "",

  // Initialize login page
  async initLogin() {
    const loginForm = document.getElementById("loginForm");
    const errorMessage = document.getElementById("errorMessage");

    // Wait for Supabase to be ready
    let attempts = 0;
    while (!db && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    if (!db) {
      if (errorMessage) {
        errorMessage.textContent = "Database connection not available. Please refresh the page.";
        errorMessage.classList.remove("hidden");
      }
      return;
    }

    // Check if already authenticated
    const { data: { session } } = await db.auth.getSession();
    if (session) {
      window.location.href = "dashboard.html";
      return;
    }

    if (loginForm) {
      loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        
        // Disable button during login
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = "Signing in...";
        }

        try {
          // Supabase auth uses email, so we'll use the username as email
          const { data, error } = await db.auth.signInWithPassword({
            email: username, // Use username as email (slfarmer_admin)
            password: password
          });

          if (error) {
            throw error;
          }

          if (data.session) {
            // Successful login
            window.location.href = "dashboard.html";
          } else {
            throw new Error("No session created");
          }
        } catch (error) {
          console.error("Login error:", error);
          if (errorMessage) {
            errorMessage.textContent = error.message || "Invalid username or password";
            errorMessage.classList.remove("hidden");
          }
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Sign In";
          }
        }
      });
    }
  },

  // Initialize dashboard
  async initDashboard() {
    // Wait for Supabase to be ready
    let attempts = 0;
    while (!db && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    if (!db) {
      this.showStatus(
        "Error: Supabase is not loaded. Please refresh the page and make sure you have an internet connection.",
        "error"
      );
      return;
    }

    // Check authentication with Supabase
    const { data: { session }, error: sessionError } = await db.auth.getSession();
    
    if (!session || sessionError) {
      window.location.href = "index.html";
      return;
    }

    // Setup logout
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", async () => {
        try {
          await db.auth.signOut();
        } catch (error) {
          console.error("Logout error:", error);
        }
        window.location.href = "index.html";
      });
    }

    // Setup theme toggle
    this.initThemeToggle();

    // Setup search and refresh
    this.setupSearch();
    this.setupRefresh();

    // Setup confirmation modal
    this.setupConfirmationModal();

    // Setup toast notifications
    this.setupToast();

    // Load products from Supabase
    await this.loadProducts();

    // Setup buttons
    this.setupButtons();

    // Update statistics
    this.updateStatistics();
  },

  // Initialize theme toggle
  initThemeToggle() {
    const html = document.documentElement;
    const themeToggle = document.getElementById("themeToggle");
    const themeToggleIcon = document.getElementById("themeToggleIcon");
    const storedTheme = localStorage.getItem("slfarmer-theme");

    if (storedTheme === "dark") {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
      if (!storedTheme) {
        localStorage.setItem("slfarmer-theme", "light");
      }
    }

    function updateThemeToggleIcon() {
      if (!themeToggleIcon) return;
      if (html.classList.contains("dark")) {
        themeToggleIcon.classList.remove("fa-moon");
        themeToggleIcon.classList.add("fa-sun");
      } else {
        themeToggleIcon.classList.remove("fa-sun");
        themeToggleIcon.classList.add("fa-moon");
      }
    }

    updateThemeToggleIcon();

    if (themeToggle) {
      themeToggle.addEventListener("click", () => {
        const isDark = html.classList.toggle("dark");
        localStorage.setItem("slfarmer-theme", isDark ? "dark" : "light");
        updateThemeToggleIcon();
      });
    }
  },

  // Load products from Supabase
  async loadProducts() {
    if (!db) {
      this.showStatus(
        "Error: Database connection not available. Please refresh the page.",
        "error"
      );
      return;
    }

    try {
      const { data, error } = await db
        .from("products")
        .select("id, name, available")
        .order("name", { ascending: true });

      if (error) {
        throw error;
      }

      this.products = data || [];
      this.originalProducts = JSON.parse(JSON.stringify(this.products)); // Deep copy

      this.updateStatistics();
      this.updateSaveButton();
      this.renderProducts();
      if (!data || data.length === 0) {
        this.showStatus(
          "No products found in the database. Add some rows in Supabase.",
          "info"
        );
      }
    } catch (error) {
      console.error("Error loading products from Supabase:", error);
      this.showStatus(
        "Error loading products from the database. Please refresh the page.",
        "error"
      );
    }
  },

  // Get product icon based on name
  getProductIcon(productName) {
    const name = productName.toLowerCase();
    // Check for plants first
    if (name.includes("plant")) {
      if (name.includes("pineapple")) return "fa-seedling";
      if (name.includes("ginger")) return "fa-seedling";
      if (name.includes("cinnamon")) return "fa-tree";
      return "fa-leaf";
    }
    // Then check for specific products
    if (name.includes("pineapple")) return "fa-apple-whole";
    if (name.includes("ginger")) return "fa-seedling";
    if (name.includes("cinnamon")) return "fa-tree";
    if (name.includes("pepper") || name.includes("miris")) return "fa-pepper-hot";
    return "fa-box";
  },

  // Render products in the dashboard
  renderProducts() {
    const productsList = document.getElementById("productsList");
    const loadingSkeleton = document.getElementById("loadingSkeleton");
    if (!productsList) return;

    // Hide loading skeleton
    if (loadingSkeleton) loadingSkeleton.classList.add("hidden");

    // Filter products based on search
    this.filteredProducts = this.products.filter((product) =>
      product.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      product.id.toLowerCase().includes(this.searchQuery.toLowerCase())
    );

    if (!this.filteredProducts || this.filteredProducts.length === 0) {
      productsList.innerHTML = `
        <div class="text-center py-12">
          <i class="fas fa-search text-4xl text-slate-400 mb-4"></i>
          <p class="text-slate-600 dark:text-slate-300 text-lg">No products found</p>
          <p class="text-slate-500 dark:text-slate-400 text-sm mt-2">${this.searchQuery ? 'Try a different search term' : 'No products in database'}</p>
        </div>
      `;
      this.updateStatistics();
      return;
    }

    productsList.innerHTML = this.filteredProducts
      .map((product) => {
        const originalProduct = this.originalProducts.find(p => p.id === product.id);
        const hasChanged = originalProduct && originalProduct.available !== product.available;
        const icon = this.getProductIcon(product.name);
        
        return `
      <div class="product-item flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border transition-all ${
        hasChanged 
          ? 'border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-900/10 shadow-md' 
          : 'border-farm-200 dark:border-farm-700 bg-white dark:bg-slate-800'
      } p-4 sm:p-6 hover:shadow-lg">
        <div class="flex items-center gap-4 flex-1">
          <div class="h-12 w-12 rounded-xl bg-farm-100 dark:bg-farm-900/40 flex items-center justify-center">
            <i class="fas ${icon} text-xl text-farm-600 dark:text-farm-400"></i>
          </div>
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <h3 class="text-lg font-semibold text-slate-900 dark:text-white">${product.name}</h3>
              ${hasChanged ? '<span class="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-xs font-semibold rounded-full">Modified</span>' : ''}
            </div>
            <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">ID: ${product.id}</p>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-sm font-medium px-3 py-1 rounded-full ${
            product.available 
              ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' 
              : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
          }">
            <i class="fas ${product.available ? 'fa-check-circle' : 'fa-times-circle'} mr-1"></i>
            ${product.available ? "Available" : "Unavailable"}
          </span>
          <label class="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              class="sr-only peer"
              data-product-id="${product.id}"
              ${product.available ? "checked" : ""}
            />
            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-farm-300 dark:peer-focus:ring-farm-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-farm-600"></div>
          </label>
        </div>
      </div>
    `;
      })
      .join("");

    // Add event listeners to toggles
    productsList.querySelectorAll('input[type="checkbox"]').forEach((toggle) => {
      toggle.addEventListener("change", (e) => {
        const productId = e.target.getAttribute("data-product-id");
        const product = this.products.find(p => p.id === productId);
        if (product) {
          product.available = e.target.checked;
          this.updateStatistics();
          this.updateSaveButton();
          this.renderProducts(); // Re-render to show change indicator
        }
      });
    });
  },

  // Setup search functionality
  setupSearch() {
    const searchInput = document.getElementById("searchProducts");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.searchQuery = e.target.value;
        this.renderProducts();
      });
    }
  },

  // Setup refresh button
  setupRefresh() {
    const refreshBtn = document.getElementById("refreshBtn");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", async () => {
        refreshBtn.classList.add("animate-spin");
        await this.loadProducts();
        setTimeout(() => {
          refreshBtn.classList.remove("animate-spin");
        }, 500);
      });
    }
  },

  // Setup confirmation modal
  setupConfirmationModal() {
    const modal = document.getElementById("confirmModal");
    const confirmCancel = document.getElementById("confirmCancel");
    const confirmSave = document.getElementById("confirmSave");

    if (confirmCancel) {
      confirmCancel.addEventListener("click", () => {
        modal.classList.add("hidden");
      });
    }

    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          modal.classList.add("hidden");
        }
      });
    }

    if (confirmSave) {
      confirmSave.addEventListener("click", async () => {
        modal.classList.add("hidden");
        await this.confirmedSave();
      });
    }
  },

  // Setup toast notifications
  setupToast() {
    const toast = document.getElementById("toast");
    const toastClose = document.getElementById("toastClose");

    if (toastClose) {
      toastClose.addEventListener("click", () => {
        toast.classList.add("hidden");
      });
    }
  },

  // Show toast notification
  showToast(message, description = "", type = "success") {
    const toast = document.getElementById("toast");
    const toastIcon = document.getElementById("toastIcon");
    const toastMessage = document.getElementById("toastMessage");
    const toastDescription = document.getElementById("toastDescription");

    if (!toast) return;

    // Set icon and colors
    const icons = {
      success: { icon: "fa-check-circle", bg: "bg-green-100 dark:bg-green-900/40", text: "text-green-600 dark:text-green-400" },
      error: { icon: "fa-times-circle", bg: "bg-red-100 dark:bg-red-900/40", text: "text-red-600 dark:text-red-400" },
      info: { icon: "fa-info-circle", bg: "bg-blue-100 dark:bg-blue-900/40", text: "text-blue-600 dark:text-blue-400" },
      warning: { icon: "fa-exclamation-triangle", bg: "bg-amber-100 dark:bg-amber-900/40", text: "text-amber-600 dark:text-amber-400" }
    };

    const iconConfig = icons[type] || icons.success;
    toastIcon.className = `h-10 w-10 rounded-full flex items-center justify-center ${iconConfig.bg}`;
    toastIcon.innerHTML = `<i class="fas ${iconConfig.icon} ${iconConfig.text}"></i>`;

    toastMessage.textContent = message;
    toastDescription.textContent = description;

    toast.classList.remove("hidden");

    // Auto-hide after 5 seconds
    setTimeout(() => {
      toast.classList.add("hidden");
    }, 5000);
  },

  // Get changes summary
  getChangesSummary() {
    const changes = [];
    this.products.forEach((product) => {
      const original = this.originalProducts.find(p => p.id === product.id);
      if (original && original.available !== product.available) {
        changes.push({
          name: product.name,
          from: original.available ? "Available" : "Unavailable",
          to: product.available ? "Available" : "Unavailable"
        });
      }
    });
    return changes;
  },

  // Show confirmation modal
  showConfirmationModal() {
    const modal = document.getElementById("confirmModal");
    const confirmMessage = document.getElementById("confirmMessage");
    const changesPreview = document.getElementById("changesPreview");

    if (!modal) return;

    const changes = this.getChangesSummary();
    const changesCount = changes.length;

    confirmMessage.textContent = `You are about to save ${changesCount} change${changesCount !== 1 ? 's' : ''}. Are you sure you want to continue?`;

    if (changes.length > 0) {
      changesPreview.innerHTML = changes.map(change => `
        <div class="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700 last:border-0">
          <span class="font-medium text-slate-900 dark:text-white">${change.name}</span>
          <div class="flex items-center gap-2">
            <span class="px-2 py-1 rounded text-xs ${change.from === 'Available' ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'}">${change.from}</span>
            <i class="fas fa-arrow-right text-slate-400"></i>
            <span class="px-2 py-1 rounded text-xs ${change.to === 'Available' ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'}">${change.to}</span>
          </div>
        </div>
      `).join("");
    } else {
      changesPreview.innerHTML = '<p class="text-slate-500 dark:text-slate-400 text-sm">No changes detected.</p>';
    }

    modal.classList.remove("hidden");
  },

  // Confirmed save (after confirmation)
  async confirmedSave() {
    await this.saveProducts();
  },

  // Update statistics
  updateStatistics() {
    const available = this.products.filter(p => p.available).length;
    const unavailable = this.products.filter(p => !p.available).length;
    const total = this.products.length;
    const changes = this.getChangesSummary().length;

    const availableCount = document.getElementById("availableCount");
    const unavailableCount = document.getElementById("unavailableCount");
    const totalCount = document.getElementById("totalCount");
    const changesCount = document.getElementById("changesCount");

    if (availableCount) availableCount.textContent = available;
    if (unavailableCount) unavailableCount.textContent = unavailable;
    if (totalCount) totalCount.textContent = total;
    if (changesCount) {
      changesCount.textContent = changes;
      if (changes > 0) {
        changesCount.parentElement.parentElement.classList.add("ring-2", "ring-amber-400");
      } else {
        changesCount.parentElement.parentElement.classList.remove("ring-2", "ring-amber-400");
      }
    }
  },

  // Update save button state
  updateSaveButton() {
    const saveBtn = document.getElementById("saveAllBtn");
    const saveBtnBadge = document.getElementById("saveBtnBadge");
    const changes = this.getChangesSummary().length;

    if (saveBtn) {
      if (changes > 0) {
        saveBtn.disabled = false;
        if (saveBtnBadge) {
          saveBtnBadge.textContent = changes;
          saveBtnBadge.classList.remove("hidden");
        }
      } else {
        saveBtn.disabled = true;
        if (saveBtnBadge) {
          saveBtnBadge.classList.add("hidden");
        }
      }
    }
  },

  // Setup button event listeners
  setupButtons() {
    const saveAllBtn = document.getElementById("saveAllBtn");
    const makeAllAvailableBtn = document.getElementById("makeAllAvailableBtn");
    const makeAllUnavailableBtn = document.getElementById("makeAllUnavailableBtn");
    const discardChangesBtn = document.getElementById("discardChangesBtn");

    if (saveAllBtn) {
      saveAllBtn.addEventListener("click", () => {
        const changes = this.getChangesSummary();
        if (changes.length > 0) {
          this.showConfirmationModal();
        } else {
          this.showToast("No changes to save", "All products are up to date.", "info");
        }
      });
    }

    if (makeAllAvailableBtn) {
      makeAllAvailableBtn.addEventListener("click", () => {
        this.products.forEach((product) => (product.available = true));
        this.updateStatistics();
        this.updateSaveButton();
        this.renderProducts();
        this.showToast("All products set to available", "Click 'Save All Changes' to apply.", "info");
      });
    }

    if (makeAllUnavailableBtn) {
      makeAllUnavailableBtn.addEventListener("click", () => {
        this.products.forEach((product) => (product.available = false));
        this.updateStatistics();
        this.updateSaveButton();
        this.renderProducts();
        this.showToast("All products set to unavailable", "Click 'Save All Changes' to apply.", "warning");
      });
    }

    if (discardChangesBtn) {
      discardChangesBtn.addEventListener("click", () => {
        this.products = JSON.parse(JSON.stringify(this.originalProducts));
        this.updateStatistics();
        this.updateSaveButton();
        this.renderProducts();
        this.showToast("Changes discarded", "All modifications have been reverted.", "info");
      });
    }
  },

  // Save products to Supabase
  async saveProducts() {
    if (!db) {
      this.showStatus(
        "Error: Database connection not available. Please refresh the page.",
        "error"
      );
      return;
    }

    try {
      if (!this.products || this.products.length === 0) {
        this.showStatus("No products to save.", "info");
        return;
      }

      const { error } = await db.from("products").upsert(this.products);

      if (error) {
        throw error;
      }

      this.showStatus("Products updated successfully in the database!", "success");
      this.originalProducts = JSON.parse(JSON.stringify(this.products));
      this.updateStatistics();
      this.updateSaveButton();
      this.renderProducts();
      this.showToast("Changes saved successfully!", "Product availability has been updated.", "success");
    } catch (error) {
      console.error("Error saving products:", error);
      this.showStatus(
        "Error saving products to the database. Please try again.",
        "error"
      );
    }
  },

  // Show status message
  showStatus(message, type = "info") {
    const statusMessage = document.getElementById("statusMessage");
    if (!statusMessage) return;

    statusMessage.textContent = message;
    statusMessage.classList.remove("hidden");

    // Reset classes
    statusMessage.className =
      "mb-6 rounded-xl border px-4 py-3 text-sm transition";

    if (type === "success") {
      statusMessage.classList.add(
        "bg-green-50",
        "border-green-200",
        "text-green-800",
        "dark:bg-green-900/20",
        "dark:border-green-800",
        "dark:text-green-200"
      );
    } else if (type === "error") {
      statusMessage.classList.add(
        "bg-red-50",
        "border-red-200",
        "text-red-800",
        "dark:bg-red-900/20",
        "dark:border-red-800",
        "dark:text-red-200"
      );
    } else {
      statusMessage.classList.add(
        "bg-blue-50",
        "border-blue-200",
        "text-blue-800",
        "dark:bg-blue-900/20",
        "dark:border-blue-800",
        "dark:text-blue-200"
      );
    }

    // Auto-hide after 5 seconds
    setTimeout(() => {
      statusMessage.classList.add("hidden");
    }, 5000);
  },
};
