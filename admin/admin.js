// Admin System for Product Availability Management
const AdminSystem = {
  products: [],
  originalProducts: [],

  // Initialize login page
  initLogin() {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');

    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        // Simple authentication (in production, use proper authentication)
        if (username === 'admin' && password === 'admin123') {
          localStorage.setItem('adminAuthenticated', 'true');
          window.location.href = 'dashboard.html';
        } else {
          errorMessage.textContent = 'Invalid username or password';
          errorMessage.classList.remove('hidden');
        }
      });
    }

    // Check if already authenticated
    if (localStorage.getItem('adminAuthenticated') === 'true') {
      window.location.href = 'dashboard.html';
    }
  },

  // Initialize dashboard
  async initDashboard() {
    // Check authentication
    if (localStorage.getItem('adminAuthenticated') !== 'true') {
      window.location.href = 'index.html';
      return;
    }

    // Setup logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('adminAuthenticated');
        window.location.href = 'index.html';
      });
    }

    // Setup theme toggle
    this.initThemeToggle();

    // Load products
    await this.loadProducts();

    // Setup buttons
    this.setupButtons();
  },

  // Initialize theme toggle
  initThemeToggle() {
    const html = document.documentElement;
    const themeToggle = document.getElementById('themeToggle');
    const themeToggleIcon = document.getElementById('themeToggleIcon');
    const storedTheme = localStorage.getItem('slfarmer-theme');

    if (storedTheme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
      if (!storedTheme) {
        localStorage.setItem('slfarmer-theme', 'light');
      }
    }

    function updateThemeToggleIcon() {
      if (!themeToggleIcon) return;
      if (html.classList.contains('dark')) {
        themeToggleIcon.classList.remove('fa-moon');
        themeToggleIcon.classList.add('fa-sun');
      } else {
        themeToggleIcon.classList.remove('fa-sun');
        themeToggleIcon.classList.add('fa-moon');
      }
    }

    updateThemeToggleIcon();

    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        const isDark = html.classList.toggle('dark');
        localStorage.setItem('slfarmer-theme', isDark ? 'dark' : 'light');
        updateThemeToggleIcon();
      });
    }
  },

  // Load products from JSON file
  async loadProducts() {
    try {
      const response = await fetch('products.json');
      if (!response.ok) {
        throw new Error('Failed to load products.json');
      }

      const data = await response.json();
      this.products = data.products || [];
      this.originalProducts = JSON.parse(JSON.stringify(this.products)); // Deep copy

      this.renderProducts();
    } catch (error) {
      console.error('Error loading products:', error);
      this.showStatus('Error loading products. Please refresh the page.', 'error');
    }
  },

  // Render products in the dashboard
  renderProducts() {
    const productsList = document.getElementById('productsList');
    if (!productsList) return;

    if (this.products.length === 0) {
      productsList.innerHTML = '<p class="text-slate-600 dark:text-slate-300">No products found.</p>';
      return;
    }

    productsList.innerHTML = this.products.map((product, index) => `
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-farm-200 dark:border-farm-700 bg-white dark:bg-slate-800 p-4 sm:p-6">
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white">${product.name}</h3>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">ID: ${product.id}</p>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-sm font-medium text-slate-700 dark:text-slate-300">
            ${product.available ? 'Available' : 'Unavailable'}
          </span>
          <label class="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              class="sr-only peer"
              data-product-index="${index}"
              ${product.available ? 'checked' : ''}
            />
            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-farm-300 dark:peer-focus:ring-farm-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-farm-600"></div>
          </label>
        </div>
      </div>
    `).join('');

    // Add event listeners to toggles
    productsList.querySelectorAll('input[type="checkbox"]').forEach(toggle => {
      toggle.addEventListener('change', (e) => {
        const index = parseInt(e.target.getAttribute('data-product-index'));
        this.products[index].available = e.target.checked;
      });
    });
  },

  // Setup button event listeners
  setupButtons() {
    const saveAllBtn = document.getElementById('saveAllBtn');
    const makeAllAvailableBtn = document.getElementById('makeAllAvailableBtn');
    const makeAllUnavailableBtn = document.getElementById('makeAllUnavailableBtn');

    if (saveAllBtn) {
      saveAllBtn.addEventListener('click', () => this.saveProducts());
    }

    if (makeAllAvailableBtn) {
      makeAllAvailableBtn.addEventListener('click', () => {
        this.products.forEach(product => product.available = true);
        this.renderProducts();
        this.showStatus('All products set to available. Click "Save All Changes" to save.', 'info');
      });
    }

    if (makeAllUnavailableBtn) {
      makeAllUnavailableBtn.addEventListener('click', () => {
        this.products.forEach(product => product.available = false);
        this.renderProducts();
        this.showStatus('All products set to unavailable. Click "Save All Changes" to save.', 'info');
      });
    }
  },

  // Save products to JSON file
  async saveProducts() {
    try {
      // Update lastUpdated timestamp
      const updatedData = {
        products: this.products,
        lastUpdated: new Date().toISOString()
      };

      const jsonString = JSON.stringify(updatedData, null, 2);

      // Try to save directly via PUT request
      try {
        const response = await fetch('products.json', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: jsonString
        });

        if (response.ok) {
          this.showStatus('Products updated successfully!', 'success');
          this.originalProducts = JSON.parse(JSON.stringify(this.products)); // Update original
          return;
        }
      } catch (putError) {
        // PUT failed, fall back to download method
        console.log('Direct save not available, using download method');
      }

      // Fallback: Create downloadable JSON file
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'products.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      this.showStatus('Products.json downloaded! Replace admin/products.json with the downloaded file, then refresh the page.', 'info');
      
    } catch (error) {
      console.error('Error saving products:', error);
      this.showStatus('Error saving products. Please try again.', 'error');
    }
  },

  // Show status message
  showStatus(message, type = 'info') {
    const statusMessage = document.getElementById('statusMessage');
    if (!statusMessage) return;

    statusMessage.textContent = message;
    statusMessage.classList.remove('hidden');

    // Set color based on type
    statusMessage.className = 'mb-6 rounded-xl border px-4 py-3 text-sm';
    if (type === 'success') {
      statusMessage.classList.add('bg-green-50', 'border-green-200', 'text-green-800', 'dark:bg-green-900/20', 'dark:border-green-800', 'dark:text-green-200');
    } else if (type === 'error') {
      statusMessage.classList.add('bg-red-50', 'border-red-200', 'text-red-800', 'dark:bg-red-900/20', 'dark:border-red-800', 'dark:text-red-200');
    } else {
      statusMessage.classList.add('bg-blue-50', 'border-blue-200', 'text-blue-800', 'dark:bg-blue-900/20', 'dark:border-blue-800', 'dark:text-blue-200');
    }

    // Auto-hide after 5 seconds
    setTimeout(() => {
      statusMessage.classList.add('hidden');
    }, 5000);
  }
};

