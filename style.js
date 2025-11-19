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
    // Initialize all slideshows
    const slideshowContainers = document.querySelectorAll('.slideshow-container');
    
    slideshowContainers.forEach((container, index) => {
        const interval = index === 0 ? 4000 : 5000;
        new Slideshow(container, true, interval);
    });
    
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
    
    const navMenu = document.querySelector('.nav-menu');
    const mobileToggle = document.querySelector('.mobile-toggle');

    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            navMenu.classList.toggle('hidden');
            const expanded = this.getAttribute('aria-expanded') === 'true';
            this.setAttribute('aria-expanded', (!expanded).toString());
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
                    behavior: 'smooth'
                });
                
                // Update URL hash without jumping
                history.pushState(null, '', targetId);
                
                // Update active nav link
                setActiveNavLink();
                
                if (navMenu) {
                    navMenu.classList.remove('active');
                    if (window.innerWidth < 768 && !navMenu.classList.contains('hidden')) {
                        navMenu.classList.add('hidden');
                    }
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
        toast.className = `fixed top-24 right-6 z-50 rounded-2xl px-6 py-4 shadow-2xl transition-all transform translate-x-0 ${
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
            toast.style.transform = 'translateX(400px)';
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

    // Add loading animation to hero section
    window.addEventListener('load', function() {
        document.querySelector('.hero-content').classList.add('fade-in-up');
        document.querySelector('.hero-image').classList.add('fade-in-up');
    });

    // Add scroll to top functionality
    const scrollToTop = document.createElement('button');
    scrollToTop.innerHTML = '<i class="fas fa-chevron-up"></i>';
    scrollToTop.className = 'scroll-to-top';
    scrollToTop.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 50px;
        height: 50px;
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
            behavior: 'smooth'
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
            <img class="lightbox-image max-h-[90vh] max-w-[90vw] rounded-2xl object-contain" src="" alt="Gallery Image" />
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

    const openLightbox = (index) => {
        visibleImages = Array.from(galleryItems).filter(item => 
            item.style.display !== 'none'
        ).map(item => item.querySelector('img').src);
        
        currentImageIndex = visibleImages.indexOf(galleryItems[index].querySelector('img').src);
        if (currentImageIndex === -1) currentImageIndex = 0;
        
        lightboxImage.src = visibleImages[currentImageIndex];
        lightbox.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    };

    const closeLightbox = () => {
        lightbox.style.display = 'none';
        document.body.style.overflow = '';
    };

    const showNextImage = () => {
        currentImageIndex = (currentImageIndex + 1) % visibleImages.length;
        lightboxImage.src = visibleImages[currentImageIndex];
    };

    const showPrevImage = () => {
        currentImageIndex = (currentImageIndex - 1 + visibleImages.length) % visibleImages.length;
        lightboxImage.src = visibleImages[currentImageIndex];
    };

    // Add click event to gallery items
    galleryItems.forEach((item, index) => {
        item.addEventListener('click', () => openLightbox(index));
    });

    lightboxClose.addEventListener('click', closeLightbox);
    lightboxNext.addEventListener('click', showNextImage);
    lightboxPrev.addEventListener('click', showPrevImage);
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });

    // Keyboard navigation for lightbox
    document.addEventListener('keydown', (e) => {
        if (lightbox.style.display === 'flex') {
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowRight') showNextImage();
            if (e.key === 'ArrowLeft') showPrevImage();
        }
    });

    // Initialize gallery items with transition
    galleryItems.forEach(item => {
        item.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    });
});
