// Add this slideshow functionality to your existing JavaScript

// Slideshow Class
class Slideshow {
    constructor(container, autoPlay = true, interval = 4000) {
        this.container = container;
        this.slides = container.querySelectorAll('.slide');
        this.dots = container.querySelectorAll('.dot');
        this.prevBtn = container.querySelector('.prev-btn');
        this.nextBtn = container.querySelector('.next-btn');
        this.autoPlay = autoPlay;
        this.interval = interval;
        this.currentSlide = 0;
        this.slideInterval = null;
        
        this.init();
    }
    
    init() {
        // Event listeners for navigation
        this.prevBtn.addEventListener('click', () => this.prevSlide());
        this.nextBtn.addEventListener('click', () => this.nextSlide());
        
        // Event listeners for dots
        this.dots.forEach(dot => {
            dot.addEventListener('click', (e) => {
                const slideIndex = parseInt(e.target.getAttribute('data-slide'));
                this.goToSlide(slideIndex);
            });
        });
        
        // Auto-play
        if (this.autoPlay) {
            this.startAutoPlay();
            
            // Pause on hover
            this.container.addEventListener('mouseenter', () => this.stopAutoPlay());
            this.container.addEventListener('mouseleave', () => this.startAutoPlay());
        }
    }
    
    showSlide(index) {
        // Hide all slides
        this.slides.forEach(slide => slide.classList.remove('active'));
        this.dots.forEach(dot => dot.classList.remove('active'));
        
        // Show current slide
        this.slides[index].classList.add('active');
        this.dots[index].classList.add('active');
        
        this.currentSlide = index;
    }
    
    nextSlide() {
        let nextIndex = this.currentSlide + 1;
        if (nextIndex >= this.slides.length) {
            nextIndex = 0;
        }
        this.showSlide(nextIndex);
    }
    
    prevSlide() {
        let prevIndex = this.currentSlide - 1;
        if (prevIndex < 0) {
            prevIndex = this.slides.length - 1;
        }
        this.showSlide(prevIndex);
    }
    
    goToSlide(index) {
        if (index >= 0 && index < this.slides.length) {
            this.showSlide(index);
        }
    }
    
    startAutoPlay() {
        this.stopAutoPlay();
        this.slideInterval = setInterval(() => this.nextSlide(), this.interval);
    }
    
    stopAutoPlay() {
        if (this.slideInterval) {
            clearInterval(this.slideInterval);
            this.slideInterval = null;
        }
    }
}

// Initialize slideshows when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scrollBehavior = prefersReducedMotion ? 'auto' : 'smooth';

    // Initialize all slideshows
    const slideshowContainers = document.querySelectorAll('.slideshow-container');
    
    slideshowContainers.forEach((container, index) => {
        const interval = index === 0 ? 4000 : 5000;
        new Slideshow(container, !prefersReducedMotion, interval);
    });

    // Founder profiles slider (Owner 2 first, then Owner 1)
    const ownerSlideshowImage = document.querySelector('[data-owner-slideshow]');
    const founderNameEl = document.getElementById('founderName');
    const founderRoleEl = document.getElementById('founderRole');
    const founderBio1El = document.getElementById('founderBio1');
    const founderBio2El = document.getElementById('founderBio2');
    const founderBio3El = document.getElementById('founderBio3');
    const founderAchievement1El = document.getElementById('founderAchievement1');
    const founderAchievement2El = document.getElementById('founderAchievement2');
    const founderPrevBtn = document.getElementById('founderPrevBtn');
    const founderNextBtn = document.getElementById('founderNextBtn');
    const founderDotsEl = document.getElementById('founderDots');

    const canInitFounderSlider = [
        ownerSlideshowImage,
        founderNameEl,
        founderRoleEl,
        founderBio1El,
        founderBio2El,
        founderBio3El,
        founderAchievement1El,
        founderAchievement2El,
        founderDotsEl
    ].every(Boolean);

    if (canInitFounderSlider) {
        const founderProfiles = [
            {
                key: 'owner-2',
                name: 'Upul Premakumara',
                role: 'Founder - SL Farmer',
                image: 'images/owner 2.jpg',
                alt: 'Upul Premakumara - Founder & SL Farmer',
                bio: [
                    'Upul Premakumara is a hands-on farm leader focused on practical growth, crop health, and disciplined field operations. His day-to-day management helps keep SL Farmer productive through every season.',
                    'With a strong commitment to sustainable methods, Upul supports efficient planting, expense control, and quality-first harvesting standards across the farm.',
                    'His leadership strengthens SL Farmer\'s mission to deliver naturally grown produce while building long-term value for the local farming community.'
                ],
                achievements: ['2+ Years Farming Experience', 'Farm Operations Leader']
            },
            {
                key: 'owner-1',
                name: 'Jayasanka Peiris',
                role: 'Founder - SL Farmer',
                image: 'images/owner.JPG',
                alt: 'Jayasanka Peiris - Founder & SL Farmer',
                bio: [
                    'Rooted in more than a decade of hands-on experience in sustainable agriculture, Jayasanka Peiris created SL Farmer with a simple purpose: to grow premium, naturally cultivated produce while honoring farming traditions passed down through generations.',
                    'Raised in a family of farmers, Jayasanka blends ancient agricultural wisdom with modern sustainable innovations, crafting a farming model that is both environmentally responsible and exceptionally productive.',
                    'Guided by purpose, driven by heritage, and committed to purity, Jayasanka continues to lead SL Farmer toward a future where sustainability and excellence grow side by side.'
                ],
                achievements: ['2+ Years Farming Experience', 'Local Community Leader']
            }
        ];

        const validateFounderImage = (profile) => new Promise((resolve) => {
            const probe = new Image();
            probe.onload = () => resolve(profile);
            probe.onerror = () => resolve(null);
            probe.src = profile.image;
        });

        Promise.all(founderProfiles.map(validateFounderImage)).then((validProfiles) => {
            const profiles = validProfiles.filter(Boolean);
            if (!profiles.length) return;

            let currentFounderIndex = 0;
            let founderIntervalId = null;

            const renderFounder = (index) => {
                currentFounderIndex = (index + profiles.length) % profiles.length;
                const profile = profiles[currentFounderIndex];

                founderNameEl.textContent = profile.name;
                founderRoleEl.textContent = profile.role;
                founderBio1El.textContent = profile.bio[0] || '';
                founderBio2El.textContent = profile.bio[1] || '';
                founderBio3El.textContent = profile.bio[2] || '';
                founderAchievement1El.textContent = profile.achievements[0] || '';
                founderAchievement2El.textContent = profile.achievements[1] || '';
                ownerSlideshowImage.src = profile.image;
                ownerSlideshowImage.alt = profile.alt;

                Array.from(founderDotsEl.children).forEach((dot, dotIndex) => {
                    dot.classList.toggle('active', dotIndex === currentFounderIndex);
                    dot.setAttribute('aria-selected', dotIndex === currentFounderIndex ? 'true' : 'false');
                });
            };

            const stopFounderAutoSlide = () => {
                if (!founderIntervalId) return;
                clearInterval(founderIntervalId);
                founderIntervalId = null;
            };

            const startFounderAutoSlide = () => {
                stopFounderAutoSlide();
                if (profiles.length < 2 || prefersReducedMotion) return;
                founderIntervalId = setInterval(() => {
                    renderFounder(currentFounderIndex + 1);
                }, 5000);
            };

            founderDotsEl.innerHTML = '';
            profiles.forEach((profile, index) => {
                const dot = document.createElement('button');
                dot.type = 'button';
                dot.className = 'founder-dot';
                dot.setAttribute('aria-label', `Show ${profile.name} profile`);
                dot.setAttribute('aria-selected', 'false');
                dot.addEventListener('click', () => {
                    renderFounder(index);
                    startFounderAutoSlide();
                });
                founderDotsEl.appendChild(dot);
            });

            if (profiles.length < 2) {
                founderPrevBtn?.setAttribute('hidden', '');
                founderNextBtn?.setAttribute('hidden', '');
                founderDotsEl.innerHTML = '';
            } else {
                founderPrevBtn?.removeAttribute('hidden');
                founderNextBtn?.removeAttribute('hidden');
            }

            founderPrevBtn?.addEventListener('click', () => {
                renderFounder(currentFounderIndex - 1);
                startFounderAutoSlide();
            });

            founderNextBtn?.addEventListener('click', () => {
                renderFounder(currentFounderIndex + 1);
                startFounderAutoSlide();
            });

            const storyContainer = document.querySelector('#story .story-content');
            if (storyContainer && profiles.length > 1) {
                storyContainer.addEventListener('mouseenter', stopFounderAutoSlide);
                storyContainer.addEventListener('mouseleave', startFounderAutoSlide);
            }

            renderFounder(0);
            startFounderAutoSlide();
        });
    }
    
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
    
    const headerElement = document.querySelector('.site-header') || document.querySelector('header');
    const navMenu = document.querySelector('.nav-menu');
    const mobileToggle = document.querySelector('.mobile-toggle');
    const navBackdrop = document.querySelector('[data-nav-backdrop]');
    const desktopMediaQuery = window.matchMedia('(min-width: 768px)');
    const mobileToggleIcon = mobileToggle?.querySelector('i');
    let lastMenuFocusedElement = null;

    const syncHeaderHeight = () => {
        if (!headerElement) return;
        const measuredHeight = Math.ceil(headerElement.getBoundingClientRect().height);
        if (measuredHeight > 0) {
            document.documentElement.style.setProperty('--header-height', `${measuredHeight}px`);
        }
    };

    const isMenuOpen = () => mobileToggle?.getAttribute('aria-expanded') === 'true';
    const isVisible = (element) => !!(element && element.offsetParent !== null);

    const closeMobileMenu = ({ restoreFocus = true } = {}) => {
        if (!mobileToggle || !navMenu) return;
        navMenu.classList.add('hidden');
        navMenu.classList.remove('active');
        mobileToggle.setAttribute('aria-expanded', 'false');
        if (mobileToggleIcon) {
            mobileToggleIcon.classList.remove('fa-xmark');
            mobileToggleIcon.classList.add('fa-bars');
        }
        document.body.classList.remove('mobile-menu-open');
        if (navBackdrop) {
            navBackdrop.classList.remove('is-open');
        }

        if (restoreFocus) {
            if (lastMenuFocusedElement instanceof HTMLElement && document.contains(lastMenuFocusedElement)) {
                lastMenuFocusedElement.focus();
            } else {
                mobileToggle.focus();
            }
        }
        lastMenuFocusedElement = null;
    };

    const openMobileMenu = () => {
        if (!mobileToggle || !navMenu) return;
        lastMenuFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : mobileToggle;
        navMenu.classList.remove('hidden');
        navMenu.classList.add('active');
        mobileToggle.setAttribute('aria-expanded', 'true');
        if (mobileToggleIcon) {
            mobileToggleIcon.classList.remove('fa-bars');
            mobileToggleIcon.classList.add('fa-xmark');
        }
        document.body.classList.add('mobile-menu-open');
        if (navBackdrop) {
            navBackdrop.classList.add('is-open');
        }

        const firstMenuAction = navMenu.querySelector('a, button');
        if (firstMenuAction instanceof HTMLElement) {
            firstMenuAction.focus();
        }
    };

    const trapFocusInMenu = (event) => {
        if (!mobileToggle || !navMenu || !isMenuOpen()) return;
        const focusableElements = [
            mobileToggle,
            ...Array.from(navMenu.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'))
        ].filter(el => el instanceof HTMLElement && isVisible(el));

        if (!focusableElements.length) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        const activeElement = document.activeElement;

        if (event.shiftKey && activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
            return;
        }

        if (!event.shiftKey && activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
        }
    };

    syncHeaderHeight();
    window.addEventListener('resize', syncHeaderHeight);

    if (mobileToggle && navMenu) {
        closeMobileMenu({ restoreFocus: false });

        mobileToggle.addEventListener('click', () => {
            if (isMenuOpen()) {
                closeMobileMenu({ restoreFocus: false });
            } else {
                openMobileMenu();
            }
        });

        navMenu.querySelectorAll('a[href]').forEach((link) => {
            link.addEventListener('click', () => {
                if (!desktopMediaQuery.matches) {
                    closeMobileMenu({ restoreFocus: false });
                }
            });
        });

        if (navBackdrop) {
            navBackdrop.addEventListener('click', () => closeMobileMenu());
        }

        desktopMediaQuery.addEventListener('change', (event) => {
            if (event.matches) {
                closeMobileMenu({ restoreFocus: false });
            }
        });
    }

    // Set active navigation link based on current page
    function setActiveNavLink() {
        const navLinks = document.querySelectorAll('.nav-link');
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const currentHash = window.location.hash;
        
        // Remove active class from all links first
        navLinks.forEach(link => {
            link.classList.remove('active');
        });
        
        // Find and activate the correct link
        navLinks.forEach(link => {
            const linkHref = link.getAttribute('href');
            if (!linkHref) return;
            
            let shouldBeActive = false;
            
            // Case 1: Direct page matches (products.html, gallery.html, contact.html)
            if (linkHref === currentPage) {
                shouldBeActive = true;
            }
            // Case 2: Home page (index.html) without hash
            else if (linkHref === 'index.html' && (currentPage === 'index.html' || currentPage === '') && !currentHash) {
                shouldBeActive = true;
            }
            // Case 3: Hash links on index.html (e.g., #about, #story)
            else if (linkHref.startsWith('#') && (currentPage === 'index.html' || currentPage === '')) {
                if (currentHash === linkHref) {
                    shouldBeActive = true;
                }
            }
            // Case 4: Links from other pages pointing to index.html with hash (e.g., index.html#about)
            else if (linkHref.startsWith('index.html#')) {
                const linkHash = '#' + linkHref.split('#')[1];
                if ((currentPage === 'index.html' || currentPage === '') && currentHash === linkHash) {
                    shouldBeActive = true;
                }
            }
            // Case 5: Links from other pages pointing to index.html without hash
            else if (linkHref === 'index.html' && (currentPage === 'index.html' || currentPage === '') && !currentHash) {
                shouldBeActive = true;
            }
            
            if (shouldBeActive) {
                link.classList.add('active');
            }
        });
    }
    
    // Set active nav link on page load
    setActiveNavLink();
    
    // Update active nav link when hash changes (for anchor links)
    window.addEventListener('hashchange', setActiveNavLink);
    
    // Update active nav link on scroll for hash sections (for smooth UX)
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            if (window.location.pathname.split('/').pop() === 'index.html' || window.location.pathname.split('/').pop() === '') {
                const aboutSection = document.getElementById('about');
                const storySection = document.getElementById('story');
                const scrollPos = window.scrollY + 150; // Offset for header
                
                if (aboutSection && scrollPos >= aboutSection.offsetTop && scrollPos < (storySection ? storySection.offsetTop : Infinity)) {
                    if (window.location.hash !== '#about') {
                        history.replaceState(null, '', '#about');
                        setActiveNavLink();
                    }
                } else if (storySection && scrollPos >= storySection.offsetTop) {
                    if (window.location.hash !== '#story') {
                        history.replaceState(null, '', '#story');
                        setActiveNavLink();
                    }
                } else if (scrollPos < (aboutSection ? aboutSection.offsetTop : Infinity)) {
                    if (window.location.hash !== '') {
                        history.replaceState(null, '', window.location.pathname);
                        setActiveNavLink();
                    }
                }
            }
        }, 100);
    });

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if(targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if(targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: scrollBehavior
                });
                
                // Update URL hash without jumping
                history.pushState(null, '', targetId);
                
                // Update active nav link
                setActiveNavLink();
                
                if (navMenu && !desktopMediaQuery.matches) {
                    closeMobileMenu({ restoreFocus: false });
                }
            }
        });
    });

    // Initialize EmailJS (replace with your public key)
    if (typeof emailjs !== 'undefined') {
        emailjs.init('-NUm6X27a_ROmJlh4'); // Replace with your EmailJS public key
    }

    // Contact form submission handler with EmailJS
    const contactForm = document.getElementById('contactForm');
    const submitBtn = document.getElementById('submitBtn');

    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form values
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const phone = document.getElementById('phone').value;
            const message = document.getElementById('message').value;
            
            // Simple validation
            if (!name || !email || !message) {
                showToast('Please fill in all required fields', 'error');
                return;
            }
            
            // Show loading state
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            submitBtn.disabled = true;
            
            // EmailJS integration (replace with your service ID and template ID)
            if (typeof emailjs !== 'undefined') {
                emailjs.send('service_jaa5u9j', 'template_xit5a6c', {
                    from_name: name,
                    from_email: email,
                    phone: phone || 'Not provided',
                    message: message
                })
                .then(() => {
                    showToast('Message sent successfully!', 'success');
                    submitBtn.innerHTML = '<i class="fas fa-check"></i> Message Sent!';
                    submitBtn.classList.add('submit-success');
                    contactForm.reset();
                    
                    setTimeout(() => {
                        submitBtn.innerHTML = originalBtnText;
                        submitBtn.classList.remove('submit-success');
                        submitBtn.disabled = false;
                    }, 3000);
                })
                .catch((error) => {
                    console.error('EmailJS Error:', error);
                    showToast('Failed to send message. Please try again or contact us directly.', 'error');
                    submitBtn.innerHTML = originalBtnText;
                    submitBtn.disabled = false;
                });
            } else {
                // Fallback if EmailJS is not configured
                showToast('Message sent successfully!', 'success');
                submitBtn.innerHTML = '<i class="fas fa-check"></i> Message Sent!';
                submitBtn.classList.add('submit-success');
                contactForm.reset();
                
                setTimeout(() => {
                    submitBtn.innerHTML = originalBtnText;
                    submitBtn.classList.remove('submit-success');
                    submitBtn.disabled = false;
                }, 3000);
            }
        });
    }

    // Toast notification function
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast fixed z-50 rounded-2xl px-4 py-3 shadow-2xl transition-all ${
            type === 'success' 
                ? 'bg-green-500 text-white' 
                : 'bg-red-500 text-white'
        }`;
        toast.innerHTML = `
            <div class="flex items-center gap-3">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.transform = 'translateX(calc(100% + 1rem))';
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Add some interactive effects to form inputs
    const formInputs = document.querySelectorAll('.form-control');
    formInputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            if (this.value === '') {
                this.parentElement.classList.remove('focused');
            }
        });
    });

    // Add scroll animations
    if (!prefersReducedMotion) {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        // Observe elements for animation
        document.querySelectorAll('.feature-card, .product-card, .testimonial-card, .contact-item, .story-content').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
    }

    // Add loading animation to hero section
    window.addEventListener('load', function() {
        if (prefersReducedMotion) return;
        const heroContent = document.querySelector('.hero-content');
        const heroImage = document.querySelector('.hero-image');
        if (heroContent) {
            heroContent.classList.add('fade-in-up');
        }
        if (heroImage) {
            heroImage.classList.add('fade-in-up');
        }
    });

    // Add scroll to top functionality
    const scrollToTop = document.createElement('button');
    scrollToTop.innerHTML = '<i class="fas fa-chevron-up"></i>';
    scrollToTop.className = 'scroll-to-top';
    scrollToTop.style.cssText = `
        position: fixed;
        bottom: max(16px, env(safe-area-inset-bottom));
        right: max(16px, env(safe-area-inset-right));
        width: 48px;
        height: 48px;
        background: linear-gradient(135deg, #4fa34f, #215021);
        color: #ffffff;
        border: 1px solid rgba(33, 80, 33, 0.15);
        border-radius: 50%;
        cursor: pointer;
        font-size: 18px;
        box-shadow: 0 4px 15px rgba(245, 166, 35, 0.3);
        transition: all 0.3s;
        z-index: 1000;
        display: none;
    `;

    scrollToTop.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: scrollBehavior
        });
    });

    document.body.appendChild(scrollToTop);

    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            scrollToTop.style.display = 'block';
        } else {
            scrollToTop.style.display = 'none';
        }
    });

    // Add hover effect to scroll to top button
    scrollToTop.addEventListener('mouseenter', () => {
        scrollToTop.style.transform = 'translateY(-3px)';
        scrollToTop.style.boxShadow = '0 6px 20px rgba(245, 166, 35, 0.4)';
    });

    scrollToTop.addEventListener('mouseleave', () => {
        scrollToTop.style.transform = 'translateY(0)';
        scrollToTop.style.boxShadow = '0 4px 15px rgba(245, 166, 35, 0.3)';
    });

    // Gallery Filter Functionality
    const galleryFilters = document.querySelectorAll('.gallery-filter');
    const galleryItems = document.querySelectorAll('.gallery-item');

    galleryFilters.forEach(filter => {
        filter.addEventListener('click', function() {
            // Remove active class from all filters
            galleryFilters.forEach(f => {
                f.classList.remove('active', 'bg-farm-500', 'text-white');
                f.classList.add('bg-farm-100', 'text-farm-700', 'dark:bg-slate-800', 'dark:text-amber-200');
            });
            
            // Add active class to clicked filter
            this.classList.add('active', 'bg-farm-500', 'text-white');
            this.classList.remove('bg-farm-100', 'text-farm-700', 'dark:bg-slate-800', 'dark:text-amber-200');
            
            const filterValue = this.getAttribute('data-filter');
            
            // Filter gallery items
            galleryItems.forEach(item => {
                if (filterValue === 'all' || item.getAttribute('data-category') === filterValue) {
                    item.style.display = 'block';
                    setTimeout(() => {
                        item.style.opacity = '1';
                        item.style.transform = 'scale(1)';
                    }, 10);
                } else {
                    item.style.opacity = '0';
                    item.style.transform = 'scale(0.8)';
                    setTimeout(() => {
                        item.style.display = 'none';
                    }, 300);
                }
            });
        });
    });

    // Gallery Lightbox Functionality
    const createLightbox = () => {
        const lightbox = document.createElement('div');
        lightbox.className = 'lightbox fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm';
        lightbox.style.display = 'none';
        lightbox.setAttribute('role', 'dialog');
        lightbox.setAttribute('aria-modal', 'true');
        lightbox.setAttribute('aria-label', 'Gallery image viewer');
        lightbox.setAttribute('tabindex', '-1');
        lightbox.innerHTML = `
            <button class="lightbox-close absolute top-6 right-6 z-10 rounded-full bg-white/20 p-3 text-white transition hover:bg-white/30" aria-label="Close lightbox">
                <i class="fas fa-times text-2xl"></i>
            </button>
            <button class="lightbox-prev absolute left-6 z-10 rounded-full bg-white/20 p-3 text-white transition hover:bg-white/30" aria-label="Previous image">
                <i class="fas fa-chevron-left text-2xl"></i>
            </button>
            <button class="lightbox-next absolute right-6 z-10 rounded-full bg-white/20 p-3 text-white transition hover:bg-white/30" aria-label="Next image">
                <i class="fas fa-chevron-right text-2xl"></i>
            </button>
            <img class="lightbox-image rounded-2xl object-contain" src="" alt="Gallery Image" />
        `;
        document.body.appendChild(lightbox);
        return lightbox;
    };

    const lightbox = createLightbox();
    const lightboxImage = lightbox.querySelector('.lightbox-image');
    const lightboxClose = lightbox.querySelector('.lightbox-close');
    const lightboxPrev = lightbox.querySelector('.lightbox-prev');
    const lightboxNext = lightbox.querySelector('.lightbox-next');
    let currentImageIndex = 0;
    let visibleImages = [];
    let lightboxLastFocusedElement = null;

    const focusableInLightbox = () => Array.from(
        lightbox.querySelectorAll('button:not([disabled]), [tabindex]:not([tabindex="-1"])')
    ).filter(el => el instanceof HTMLElement && isVisible(el));

    const trapFocusInLightbox = (event) => {
        const focusableElements = focusableInLightbox();
        if (!focusableElements.length) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        const activeElement = document.activeElement;

        if (event.shiftKey && activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
            return;
        }

        if (!event.shiftKey && activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
        }
    };

    const updateLightboxNavState = () => {
        const hasMultipleImages = visibleImages.length > 1;
        lightboxPrev.classList.toggle('hidden', !hasMultipleImages);
        lightboxNext.classList.toggle('hidden', !hasMultipleImages);
        lightboxPrev.setAttribute('aria-hidden', hasMultipleImages ? 'false' : 'true');
        lightboxNext.setAttribute('aria-hidden', hasMultipleImages ? 'false' : 'true');
    };

    const openLightbox = (index) => {
        visibleImages = Array.from(galleryItems).filter(item => 
            item.style.display !== 'none'
        ).map(item => item.querySelector('img').src);

        if (!visibleImages.length) return;
        const clickedImage = galleryItems[index]?.querySelector('img');
        currentImageIndex = visibleImages.indexOf(clickedImage?.src || '');
        if (currentImageIndex === -1) currentImageIndex = 0;

        lightboxLastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        lightboxImage.src = visibleImages[currentImageIndex];
        updateLightboxNavState();
        lightbox.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        requestAnimationFrame(() => lightboxClose.focus());
    };

    const closeLightbox = ({ restoreFocus = true } = {}) => {
        lightbox.style.display = 'none';
        document.body.style.overflow = '';
        if (restoreFocus && lightboxLastFocusedElement instanceof HTMLElement && document.contains(lightboxLastFocusedElement)) {
            lightboxLastFocusedElement.focus();
        }
        lightboxLastFocusedElement = null;
    };

    const showNextImage = () => {
        if (!visibleImages.length) return;
        currentImageIndex = (currentImageIndex + 1) % visibleImages.length;
        lightboxImage.src = visibleImages[currentImageIndex];
    };

    const showPrevImage = () => {
        if (!visibleImages.length) return;
        currentImageIndex = (currentImageIndex - 1 + visibleImages.length) % visibleImages.length;
        lightboxImage.src = visibleImages[currentImageIndex];
    };

    // Add click event to gallery items
    galleryItems.forEach((item, index) => {
        item.addEventListener('click', () => openLightbox(index));
    });

    lightboxClose.addEventListener('click', () => closeLightbox());
    lightboxNext.addEventListener('click', showNextImage);
    lightboxPrev.addEventListener('click', showPrevImage);
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });

    // Keyboard navigation for lightbox and mobile menu
    document.addEventListener('keydown', (e) => {
        if (!desktopMediaQuery.matches && isMenuOpen()) {
            if (e.key === 'Escape') {
                e.preventDefault();
                closeMobileMenu();
                return;
            }
            if (e.key === 'Tab') {
                trapFocusInMenu(e);
            }
        }

        if (lightbox.style.display === 'flex') {
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowRight') showNextImage();
            if (e.key === 'ArrowLeft') showPrevImage();
            if (e.key === 'Tab') trapFocusInLightbox(e);
        }
    });

    // Initialize gallery items with transition
    galleryItems.forEach(item => {
        item.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    });

    // ============================================
    // ENHANCED DESIGN EFFECTS & ANIMATIONS
    // ============================================

    // Scroll Progress Indicator
    const scrollProgress = document.createElement('div');
    scrollProgress.className = 'scroll-progress';
    scrollProgress.style.width = '0%';
    document.body.appendChild(scrollProgress);

    window.addEventListener('scroll', () => {
        const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (window.scrollY / windowHeight) * 100;
        scrollProgress.style.width = scrolled + '%';
    });

    // Scroll Reveal Animation with Intersection Observer
    if (!prefersReducedMotion) {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        });

        // Add reveal class to elements
        document.querySelectorAll('.product-card, .feature-card, .testimonial-card, .contact-item, section > div').forEach(el => {
            el.classList.add('reveal');
            revealObserver.observe(el);
        });
    }

    // Floating Decorative Elements
    const createFloatingElements = () => {
        const floatingContainer = document.createElement('div');
        floatingContainer.className = 'floating-elements';
        
        const leafIcons = ['\u{1F343}', '\u{1F33F}', '\u{1F340}', '\u{1F331}'];
        for (let i = 0; i < 4; i++) {
            const leaf = document.createElement('div');
            leaf.className = 'floating-leaf';
            leaf.textContent = leafIcons[i] || '\u{1F343}';
            leaf.style.fontSize = `${Math.random() * 1.5 + 1.5}rem`;
            floatingContainer.appendChild(leaf);
        }
        
        document.body.appendChild(floatingContainer);
    };

    // Only add floating elements on desktop
    if (!prefersReducedMotion && window.innerWidth > 768) {
        createFloatingElements();
    }

    // Parallax Effect for Hero Section
    const heroSection = document.querySelector('.hero');
    if (heroSection && !prefersReducedMotion) {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const heroContent = heroSection.querySelector('.hero-content');
            if (heroContent && scrolled < window.innerHeight) {
                heroContent.style.transform = `translateY(${scrolled * 0.3}px)`;
                heroContent.style.opacity = 1 - (scrolled / window.innerHeight) * 0.5;
            }
        });
    }

    // Enhanced Button Ripple Effect
    document.querySelectorAll('.btn, a[class*="rounded-full"][class*="bg-gradient"]').forEach(button => {
        button.addEventListener('click', function(e) {
            if (prefersReducedMotion) return;
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.5);
                left: ${x}px;
                top: ${y}px;
                transform: scale(0);
                animation: ripple 0.6s ease-out;
                pointer-events: none;
            `;
            
            this.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        });
    });

    // Add ripple animation to CSS dynamically
    if (!document.querySelector('#ripple-style')) {
        const style = document.createElement('style');
        style.id = 'ripple-style';
        style.textContent = `
            @keyframes ripple {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Magnetic Hover Effect for Feature Cards (not product cards)
    document.querySelectorAll('.feature-card').forEach(card => {
        card.addEventListener('mousemove', function(e) {
            if (prefersReducedMotion) return;
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const moveX = (x - centerX) / 10;
            const moveY = (y - centerY) / 10;
            
            this.style.transform = `translateY(-12px) scale(1.02) perspective(1000px) rotateY(${moveX}deg) rotateX(${-moveY}deg)`;
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    });

    // Stagger Animation for Product Cards on Load
    const productCards = document.querySelectorAll('.product-card');
    if (!prefersReducedMotion) {
        productCards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(50px)';
            
            setTimeout(() => {
                card.style.transition = 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    // Add gradient text class to headings
    document.querySelectorAll('h1, h2').forEach(heading => {
        if (heading.textContent.includes('Premium') || heading.textContent.includes('Natural')) {
            heading.classList.add('gradient-text');
        }
    });

    // Enhanced Image Loading with Blur Effect
    document.querySelectorAll('img').forEach(img => {
        if (!img.complete) {
            img.style.filter = 'blur(5px)';
            img.style.transition = 'filter 0.3s ease';
            
            img.addEventListener('load', function() {
                this.style.filter = 'blur(0)';
            });
        }
    });

    // Counter Animation for Statistics
    const animateCounter = (element, target, duration = 2000) => {
        const start = 0;
        const increment = target / (duration / 16);
        let current = start;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                element.textContent = target + (element.textContent.includes('+') ? '+' : '');
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(current) + (element.textContent.includes('+') ? '+' : '');
            }
        }, 16);
    };

    // Observe statistics for counter animation
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const text = entry.target.textContent;
                const number = parseInt(text.replace(/\D/g, ''));
                if (number) {
                    animateCounter(entry.target, number);
                    statsObserver.unobserve(entry.target);
                }
            }
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('dd, .stat-number').forEach(stat => {
        statsObserver.observe(stat);
    });

    // Add shimmer effect to product cards on hover
    document.querySelectorAll('.product-card').forEach(card => {
        card.classList.add('shimmer');
    });

    // Section Title Animation
    document.querySelectorAll('.section-title h2, section h2').forEach(title => {
        if (!title.querySelector('::after')) {
            title.style.position = 'relative';
        }
    });
});
