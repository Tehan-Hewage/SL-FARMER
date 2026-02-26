// Professional Pineapple Farm Management System
// Main JavaScript File

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    console.log('Pineapple Farm Management System Initialized');
    
    // Initialize all components
    initTooltips();
    initFormValidation();
    initDatePickers();
    initMobileMenu();
    initExpenseCategorySelectors();
    initTableSorting();
    initAutoDismissAlerts();
    initDynamicYear();
    initCharts();
    
    // Initialize other features
    initFilterForms();
    initExportButtons();
    initQuickActions();
});

// ===== COMPONENT INITIALIZATIONS =====

// Tooltip system
function initTooltips() {
    const tooltips = document.querySelectorAll('[data-toggle="tooltip"]');
    
    tooltips.forEach(tooltip => {
        tooltip.addEventListener('mouseenter', function(e) {
            const text = this.getAttribute('title');
            if (!text) return;
            
            const tooltipEl = document.createElement('div');
            tooltipEl.className = 'custom-tooltip';
            tooltipEl.textContent = text;
            document.body.appendChild(tooltipEl);
            
            const rect = this.getBoundingClientRect();
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
            
            // Position tooltip
            let top = rect.top + scrollTop - tooltipEl.offsetHeight - 10;
            let left = rect.left + scrollLeft + (rect.width / 2) - (tooltipEl.offsetWidth / 2);
            
            // Adjust if tooltip goes off screen
            if (left < 10) left = 10;
            if (left + tooltipEl.offsetWidth > window.innerWidth - 10) {
                left = window.innerWidth - tooltipEl.offsetWidth - 10;
            }
            
            tooltipEl.style.top = `${top}px`;
            tooltipEl.style.left = `${left}px`;
            
            this.removeAttribute('title');
            this.dataset.tooltip = text;
        });
        
        tooltip.addEventListener('mouseleave', function() {
            const tooltips = document.querySelectorAll('.custom-tooltip');
            tooltips.forEach(t => t.remove());
            
            if (this.dataset.tooltip) {
                this.setAttribute('title', this.dataset.tooltip);
                delete this.dataset.tooltip;
            }
        });
    });
}

// Form validation with enhanced UX
function initFormValidation() {
    const forms = document.querySelectorAll('form[data-validate]');
    
    forms.forEach(form => {
        form.setAttribute('novalidate', '');
        
        form.addEventListener('submit', function(e) {
            const requiredFields = this.querySelectorAll('[required]');
            let isValid = true;
            let firstError = null;
            
            requiredFields.forEach(field => {
                // Clear previous error
                field.classList.remove('error');
                const errorMsg = field.parentNode.querySelector('.error-message');
                if (errorMsg) errorMsg.remove();
                
                // Validate field
                if (!field.value.trim()) {
                    field.classList.add('error');
                    field.style.borderColor = '#dc3545';
                    isValid = false;
                    
                    // Create error message
                    const error = document.createElement('div');
                    error.className = 'error-message';
                    error.textContent = field.dataset.error || `${field.labels?.[0]?.textContent || 'This field'} is required`;
                    field.parentNode.appendChild(error);
                    
                    if (!firstError) firstError = field;
                } else {
                    field.style.borderColor = '#4CAF50';
                    
                    // Additional validations based on field type
                    if (field.type === 'email' && !isValidEmail(field.value)) {
                        showFieldError(field, 'Please enter a valid email address');
                        isValid = false;
                    }
                    
                    if (field.type === 'number' && field.min) {
                        const min = parseFloat(field.min);
                        const value = parseFloat(field.value);
                        if (value < min) {
                            showFieldError(field, `Minimum value is ${min}`);
                            isValid = false;
                        }
                    }
                    
                    if (field.type === 'number' && field.max) {
                        const max = parseFloat(field.max);
                        const value = parseFloat(field.value);
                        if (value > max) {
                            showFieldError(field, `Maximum value is ${max}`);
                            isValid = false;
                        }
                    }
                }
            });
            
            if (!isValid) {
                e.preventDefault();
                e.stopPropagation();
                
                // Scroll to first error with smooth animation
                if (firstError) {
                    firstError.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });
                    firstError.focus();
                    
                    // Add shake animation to error field
                    firstError.classList.add('shake');
                    setTimeout(() => firstError.classList.remove('shake'), 500);
                }
                
                // Show toast notification
                showToast('Please fix the errors in the form', 'error');
            }
        });
        
        // Real-time validation on input
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', function() {
                if (this.hasAttribute('required') && !this.value.trim()) {
                    this.classList.add('error');
                    this.style.borderColor = '#dc3545';
                } else {
                    this.classList.remove('error');
                    this.style.borderColor = '#4CAF50';
                }
            });
            
            // Clear error on input
            input.addEventListener('input', function() {
                this.classList.remove('error');
                this.style.borderColor = '';
                const errorMsg = this.parentNode.querySelector('.error-message');
                if (errorMsg) errorMsg.remove();
            });
        });
    });
}

function showFieldError(field, message) {
    field.classList.add('error');
    field.style.borderColor = '#dc3545';
    
    const error = document.createElement('div');
    error.className = 'error-message';
    error.textContent = message;
    field.parentNode.appendChild(error);
}

// Date picker initialization
function initDatePickers() {
    const today = new Date().toISOString().split('T')[0];
    
    // Set max date to today for future dates
    const futureDateInputs = document.querySelectorAll('input[type="date"][max="today"]');
    futureDateInputs.forEach(input => {
        input.max = today;
        if (!input.value) input.value = today;
    });
    
    // Set default date range for filters (last 30 days)
    const dateFromInputs = document.querySelectorAll('input[name="date_from"]');
    const dateToInputs = document.querySelectorAll('input[name="date_to"]');
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
    
    dateFromInputs.forEach(input => {
        if (!input.value) input.value = thirtyDaysAgoStr;
        input.addEventListener('change', function() {
            const dateTo = this.closest('form')?.querySelector('input[name="date_to"]');
            if (dateTo && this.value > dateTo.value) {
                dateTo.value = this.value;
            }
        });
    });
    
    dateToInputs.forEach(input => {
        if (!input.value) input.value = today;
        input.max = today;
        input.addEventListener('change', function() {
            const dateFrom = this.closest('form')?.querySelector('input[name="date_from"]');
            if (dateFrom && this.value < dateFrom.value) {
                dateFrom.value = this.value;
            }
        });
    });
    
    // Add calendar icons to date inputs
    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach(input => {
        const parent = input.parentNode;
        if (!parent.classList.contains('input-group')) {
            const wrapper = document.createElement('div');
            wrapper.className = 'input-group';
            
            const icon = document.createElement('span');
            icon.className = 'input-group-text';
            icon.innerHTML = '<i class="fas fa-calendar-alt"></i>';
            
            wrapper.appendChild(input.cloneNode(true));
            wrapper.appendChild(icon);
            parent.replaceChild(wrapper, input);
        }
    });
}

// Mobile menu toggle
function initMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            navLinks.classList.toggle('show');
            this.classList.toggle('active');
            this.innerHTML = this.classList.contains('active') 
                ? '<i class="fas fa-times"></i>'
                : '<i class="fas fa-bars"></i>';
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!navLinks.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                navLinks.classList.remove('show');
                mobileMenuBtn.classList.remove('active');
                mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
            }
        });
        
        // Close menu on window resize
        window.addEventListener('resize', function() {
            if (window.innerWidth > 768) {
                navLinks.classList.remove('show');
                mobileMenuBtn.classList.remove('active');
                mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
            }
        });
    }
}

// Expense category selectors
function initExpenseCategorySelectors() {
    const expenseCategories = {
        'labor': ['Daily Wages', 'Contract Labor', 'Supervisor Salary', 'Overtime', 'Benefits', 'Other'],
        'fertilizer': ['Urea', 'TSP', 'MOP', 'Organic', 'Liquid Fertilizer', 'Other'],
        'chemicals': ['Pesticides', 'Herbicides', 'Fungicides', 'Growth Regulators', 'Other'],
        'tools_equipment': ['Purchase', 'Repair', 'Maintenance', 'Rental', 'Fuel', 'Other'],
        'transport': ['Vehicle Fuel', 'Vehicle Maintenance', 'Driver Wages', 'Transport Rental', 'Other'],
        'irrigation': ['Water Pump', 'Pipes & Hoses', 'Electricity', 'Water Charges', 'Maintenance', 'Other'],
        'land_preparation': ['Plowing', 'Leveling', 'Fencing', 'Drainage', 'Soil Testing', 'Other'],
        'extra': ['Administrative', 'Miscellaneous', 'Unexpected Costs', 'Other']
    };
    
    document.querySelectorAll('select[name="expense_type"]').forEach(select => {
        select.addEventListener('change', function() {
            const categorySelect = this.closest('form')?.querySelector('select[name="category"]');
            if (!categorySelect) return;
            
            const selectedType = this.value;
            const currentValue = categorySelect.value;
            
            // Clear and rebuild options
            categorySelect.innerHTML = '<option value="">-- Select Category --</option>';
            
            if (selectedType && expenseCategories[selectedType]) {
                expenseCategories[selectedType].forEach(category => {
                    const option = document.createElement('option');
                    option.value = category;
                    option.textContent = category;
                    option.selected = (category === currentValue);
                    categorySelect.appendChild(option);
                });
                
                // Enable select
                categorySelect.disabled = false;
                categorySelect.style.opacity = '1';
            } else {
                categorySelect.disabled = true;
                categorySelect.style.opacity = '0.5';
            }
        });
        
        // Trigger change event on page load
        if (select.value) {
            select.dispatchEvent(new Event('change'));
        }
    });
}

// Table sorting functionality
function initTableSorting() {
    const sortableTables = document.querySelectorAll('.data-table[data-sortable="true"]');
    
    sortableTables.forEach(table => {
        const headers = table.querySelectorAll('th[data-sort]');
        
        headers.forEach(header => {
            header.style.cursor = 'pointer';
            header.addEventListener('click', function() {
                const columnIndex = Array.from(this.parentNode.children).indexOf(this);
                const isAscending = !this.classList.contains('sort-asc');
                
                // Reset all headers
                headers.forEach(h => {
                    h.classList.remove('sort-asc', 'sort-desc');
                });
                
                // Set current header state
                this.classList.add(isAscending ? 'sort-asc' : 'sort-desc');
                
                // Sort table
                sortTable(table, columnIndex, isAscending);
                
                // Add visual feedback
                this.classList.add('sorting');
                setTimeout(() => this.classList.remove('sorting'), 300);
            });
        });
    });
}

function sortTable(table, columnIndex, ascending = true) {
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    rows.sort((a, b) => {
        let aValue = a.children[columnIndex].textContent.trim();
        let bValue = b.children[columnIndex].textContent.trim();
        
        // Parse values for sorting
        const aParsed = parseValue(aValue);
        const bParsed = parseValue(bValue);
        
        if (typeof aParsed === 'number' && typeof bParsed === 'number') {
            return ascending ? aParsed - bParsed : bParsed - aParsed;
        } else {
            const comparison = aValue.localeCompare(bValue, undefined, {
                numeric: true,
                sensitivity: 'base'
            });
            return ascending ? comparison : -comparison;
        }
    });
    
    // Re-add sorted rows with animation
    rows.forEach((row, index) => {
        row.style.opacity = '0';
        row.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            tbody.appendChild(row);
            
            setTimeout(() => {
                row.style.transition = 'all 0.3s ease';
                row.style.opacity = '1';
                row.style.transform = 'translateY(0)';
            }, index * 20);
        }, index * 20);
    });
}

function parseValue(value) {
    // Try to parse as currency
    const currencyMatch = value.match(/Rs\.\s*([\d,]+\.?\d*)/);
    if (currencyMatch) {
        return parseFloat(currencyMatch[1].replace(/,/g, ''));
    }
    
    // Try to parse as number
    const num = parseFloat(value.replace(/,/g, ''));
    if (!isNaN(num)) {
        return num;
    }
    
    // Return as string
    return value;
}

// Auto-dismiss alerts
function initAutoDismissAlerts() {
    const alerts = document.querySelectorAll('.alert:not(.alert-persistent)');
    
    alerts.forEach(alert => {
        const duration = alert.dataset.dismiss || 5000;
        
        setTimeout(() => {
            alert.style.opacity = '0';
            alert.style.transform = 'translateX(100%)';
            
            setTimeout(() => {
                if (alert.parentNode) {
                    alert.parentNode.removeChild(alert);
                }
            }, 300);
        }, parseInt(duration));
        
        // Add close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'alert-close';
        closeBtn.innerHTML = '<i class="fas fa-times"></i>';
        closeBtn.addEventListener('click', () => {
            alert.style.opacity = '0';
            setTimeout(() => alert.remove(), 300);
        });
        
        alert.appendChild(closeBtn);
    });
}

// Dynamic year in footer
function initDynamicYear() {
    const yearSpans = document.querySelectorAll('[data-year]');
    yearSpans.forEach(span => {
        span.textContent = new Date().getFullYear();
    });
}

// Charts initialization
function initCharts() {
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js not loaded');
        return;
    }
    
    // Revenue Chart
    const revenueCtx = document.getElementById('revenueChart');
    if (revenueCtx) {
        new Chart(revenueCtx.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [{
                    label: 'Revenue (Rs.)',
                    data: [1200000, 1900000, 1500000, 2500000, 2200000, 3000000, 2800000, 3200000, 3500000, 3800000, 4000000, 4200000],
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#2E7D32',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        callbacks: {
                            label: function(context) {
                                return `Revenue: Rs. ${formatCurrency(context.raw)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            callback: function(value) {
                                return 'Rs. ' + (value / 1000000).toFixed(1) + 'M';
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'nearest'
                }
            }
        });
    }
    
    // Expense Chart
    const expenseCtx = document.getElementById('expenseChart');
    if (expenseCtx) {
        const expenseData = window.expenseChartData || {
            labels: ['Labour', 'Fertilizer', 'Chemicals', 'Tools', 'Transport', 'Irrigation', 'Land Prep', 'Extra'],
            data: [45000, 32000, 18000, 25000, 15000, 12000, 28000, 8000]
        };
        
        new Chart(expenseCtx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: expenseData.labels,
                datasets: [{
                    data: expenseData.data,
                    backgroundColor: [
                        '#e3f2fd', '#f1f8e9', '#fff3e0', '#f3e5f5',
                        '#e8eaf6', '#e0f7fa', '#e8f5e9', '#f5f5f5'
                    ],
                    borderColor: [
                        '#1565c0', '#558b2f', '#ef6c00', '#7b1fa2',
                        '#3949ab', '#006064', '#1b5e20', '#424242'
                    ],
                    borderWidth: 1,
                    hoverOffset: 15
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: Rs. ${formatCurrency(value)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
}

// Filter forms initialization
function initFilterForms() {
    const filterForms = document.querySelectorAll('.filter-form');
    
    filterForms.forEach(form => {
        const resetBtn = form.querySelector('[type="reset"]');
        if (resetBtn) {
            resetBtn.addEventListener('click', function() {
                setTimeout(() => {
                    form.submit();
                }, 100);
            });
        }
        
        // Add debounced submit on change
        const inputs = form.querySelectorAll('select, input[type="date"]');
        inputs.forEach(input => {
            let timeout;
            input.addEventListener('change', function() {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    form.submit();
                }, 500);
            });
        });
    });
}

// Export buttons initialization
function initExportButtons() {
    document.querySelectorAll('.export-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const format = this.dataset.format;
            
            if (format === 'print') {
                printExpenseReport();
            } else {
                exportExpenses(format);
            }
        });
    });
}

// Quick actions initialization
function initQuickActions() {
    document.querySelectorAll('[data-quick-action]').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const action = this.dataset.quickAction;
            const landId = this.dataset.landId;
            
            if (action === 'add-expense') {
                quickAddExpense('labor', landId);
            }
        });
    });
}

// ===== UTILITY FUNCTIONS =====

function formatCurrency(amount) {
    return 'Rs. ' + parseFloat(amount).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// ===== EXPENSE MANAGEMENT FUNCTIONS =====

function exportExpenses(format) {
    const form = document.querySelector('.filter-form');
    if (!form) {
        showToast('No filter form found', 'error');
        return;
    }
    
    const formData = new FormData(form);
    formData.append('export', '1');
    formData.append('format', format);
    
    // Show loading state
    const btn = document.querySelector(`.export-btn[data-format="${format}"]`);
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Exporting...';
    btn.disabled = true;
    
    // Create temporary form for submission
    const tempForm = document.createElement('form');
    tempForm.method = 'GET';
    tempForm.action = 'export_expenses.php';
    tempForm.style.display = 'none';
    
    for (const [key, value] of formData.entries()) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        tempForm.appendChild(input);
    }
    
    document.body.appendChild(tempForm);
    tempForm.submit();
    
    // Reset button state
    setTimeout(() => {
        btn.innerHTML = originalText;
        btn.disabled = false;
        document.body.removeChild(tempForm);
    }, 1000);
}

function printExpenseReport() {
    const printContent = document.querySelector('.table-section');
    if (!printContent) {
        showToast('No content to print', 'error');
        return;
    }
    
    const printWindow = window.open('', '_blank');
    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Expense Report - Pineapple Farm</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap');
                
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: 'Poppins', sans-serif;
                    color: #1e293b;
                    line-height: 1.6;
                    padding: 30px;
                    background: #ffffff;
                }
                
                .print-header {
                    text-align: center;
                    margin-bottom: 40px;
                    padding-bottom: 20px;
                    border-bottom: 3px solid #1B5E20;
                }
                
                .print-title {
                    font-size: 28px;
                    color: #1B5E20;
                    margin-bottom: 10px;
                    font-weight: 600;
                }
                
                .print-subtitle {
                    color: #475569;
                    font-size: 16px;
                    margin-bottom: 15px;
                }
                
                .print-date {
                    color: #64748b;
                    font-size: 14px;
                    font-style: italic;
                }
                
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 25px 0;
                    font-size: 14px;
                }
                
                th {
                    background: #f1f5f9;
                    color: #1B5E20;
                    font-weight: 600;
                    text-align: left;
                    padding: 12px 15px;
                    border-bottom: 2px solid #4CAF50;
                }
                
                td {
                    padding: 10px 15px;
                    border-bottom: 1px solid #e2e8f0;
                }
                
                tbody tr:hover {
                    background: #f8fafc;
                }
                
                .total-row {
                    font-weight: 600;
                    background: #f1f5f9;
                }
                
                .amount {
                    font-weight: 600;
                    color: #dc3545;
                    font-family: 'SF Mono', Monaco, monospace;
                }
                
                .status-badge {
                    padding: 4px 10px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 500;
                    display: inline-block;
                }
                
                .print-footer {
                    margin-top: 50px;
                    padding-top: 20px;
                    border-top: 1px solid #e2e8f0;
                    text-align: center;
                    color: #64748b;
                    font-size: 12px;
                }
                
                @media print {
                    body {
                        padding: 20px;
                    }
                    
                    .no-print {
                        display: none;
                    }
                    
                    .page-break {
                        page-break-before: always;
                    }
                }
            </style>
        </head>
        <body>
            <div class="print-header">
                <h1 class="print-title">Pineapple Farm Management System</h1>
                <div class="print-subtitle">Expense Report</div>
                <div class="print-date">Generated on ${today}</div>
            </div>
            
            <div class="print-content">
    `);
    
    printWindow.document.write(printContent.innerHTML);
    printWindow.document.write(`
            </div>
            
            <div class="print-footer">
                <p>This report was generated by Pineapple Farm Management System</p>
                <p>Govinna & Kulupana Projects | Version 1.0</p>
            </div>
            
            <script>
                window.onload = function() {
                    window.print();
                    setTimeout(function() {
                        window.close();
                    }, 1000);
                };
            </script>
        </body>
        </html>
    `);
    
    printWindow.document.close();
}

function quickAddExpense(type, landId = '') {
    // This function opens a modal for quick expense addition
    // Implementation depends on your modal system
    console.log('Quick add expense:', type, landId);
    showToast('Quick add feature coming soon!', 'info');
}

// ===== NOTIFICATION SYSTEM =====

function showToast(message, type = 'info') {
    // Remove existing toasts
    document.querySelectorAll('.toast').forEach(toast => toast.remove());
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas fa-${getToastIcon(type)}"></i>
        </div>
        <div class="toast-content">${message}</div>
        <button class="toast-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.body.appendChild(toast);
    
    // Add CSS if not already added
    if (!document.querySelector('#toast-styles')) {
        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
            .toast {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 16px 20px;
                border-radius: 12px;
                color: white;
                font-weight: 500;
                z-index: 10001;
                animation: slideInRight 0.3s ease;
                display: flex;
                align-items: center;
                gap: 12px;
                min-width: 300px;
                max-width: 400px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                backdrop-filter: blur(10px);
            }
            
            .toast-success {
                background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%);
            }
            
            .toast-error {
                background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
            }
            
            .toast-warning {
                background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
            }
            
            .toast-info {
                background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
            }
            
            .toast-icon {
                font-size: 20px;
            }
            
            .toast-content {
                flex: 1;
            }
            
            .toast-close {
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                font-size: 16px;
                opacity: 0.7;
                transition: opacity 0.2s;
            }
            
            .toast-close:hover {
                opacity: 1;
            }
            
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Add close button functionality
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }
    }, 5000);
}

function getToastIcon(type) {
    const icons = {
        'success': 'check-circle',
        'error': 'exclamation-circle',
        'warning': 'exclamation-triangle',
        'info': 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// ===== AJAX HELPER =====

function ajaxRequest(url, options = {}) {
    const {
        method = 'GET',
        data = null,
        headers = {},
        timeout = 30000
    } = options;
    
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open(method, url);
        xhr.timeout = timeout;
        
        // Set headers
        if (!(data instanceof FormData)) {
            xhr.setRequestHeader('Content-Type', 'application/json');
        }
        
        Object.entries(headers).forEach(([key, value]) => {
            xhr.setRequestHeader(key, value);
        });
        
        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    resolve(JSON.parse(xhr.responseText));
                } catch {
                    resolve(xhr.responseText);
                }
            } else {
                reject(new Error(`Request failed with status ${xhr.status}`));
            }
        };
        
        xhr.onerror = function() {
            reject(new Error('Network error occurred'));
        };
        
        xhr.ontimeout = function() {
            reject(new Error('Request timed out'));
        };
        
        if (data instanceof FormData) {
            xhr.send(data);
        } else if (data) {
            xhr.send(JSON.stringify(data));
        } else {
            xhr.send();
        }
    });
}

// ===== GLOBAL EXPORTS =====

// Make functions available globally
window.PineappleFarm = {
    formatCurrency,
    formatDate,
    formatDateTime,
    exportExpenses,
    printExpenseReport,
    quickAddExpense,
    showToast,
    ajaxRequest
};

// Add shake animation CSS
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
    
    .shake {
        animation: shake 0.5s ease-in-out;
    }
    
    .error {
        border-color: #dc3545 !important;
    }
`;
document.head.appendChild(shakeStyle);

console.log('Professional Pineapple Farm Management System Loaded Successfully!');