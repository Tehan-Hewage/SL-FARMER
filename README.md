# SL Farmer - Premium Sri Lankan Produce Website

A modern, responsive website for SL Farmer, showcasing premium naturally grown pineapples, ginger, cinnamon, and other produce from Sri Lanka. Built with a focus on user experience, SEO optimization, and easy content management.

## 🌟 Overview

SL Farmer is a family-owned farm dedicated to growing premium produce using natural farming practices. This website serves as the digital storefront, allowing customers to browse products, view the farm gallery, learn about the founder, and get in touch via multiple channels.

**Founder:** Rashmi Perera  
**Location:** 85/1 Pokunuwita Kulupana, Sri Lanka  
**Website:** [slfarmer.com](https://slfarmer.com)

## ✨ Features

### Customer-Facing Features
- **Responsive Design**: Fully responsive layout that works seamlessly on desktop, tablet, and mobile devices
- **Dark Mode**: Toggle between light and dark themes with preference persistence
- **Product Showcase**: Beautiful product cards displaying:
  - Pineapples & Pineapple Plants
  - Ginger & Ginger Plants
  - Cinnamon & Cinnamon Plants
  - Scotch Bonnet Peppers (Nai Miris)
- **Dynamic Product Availability**: Real-time product availability status loaded from JSON storage
- **Image Gallery**: Farm and product photo gallery
- **Contact Form**: EmailJS-powered contact form for customer inquiries
- **WhatsApp Integration**: Direct WhatsApp chat button for instant communication
- **Interactive Slideshow**: Auto-playing hero slideshow with manual controls
- **Smooth Scrolling**: Enhanced navigation experience with smooth scroll behavior
- **SEO Optimized**: Comprehensive SEO meta tags, structured data (JSON-LD), and sitemap

### Admin Features
- **Admin Dashboard**: Secure admin panel for managing product availability
- **Product Management**: Toggle product availability status in real-time
- **JSON Storage**: Cloud-based product data storage (no backend required)
- **Authentication**: Simple password-protected admin access
- **Bulk Actions**: Make all products available/unavailable with one click

## 🛠️ Technologies Used

### Frontend
- **HTML5**: Semantic markup
- **CSS3**: Custom styling with Tailwind CSS
- **JavaScript (ES6+)**: Interactive functionality
- **Tailwind CSS**: Utility-first CSS framework (via CDN)
- **Font Awesome 6.4.0**: Icon library

### Third-Party Services
- **EmailJS**: Contact form email delivery
- **JSONStorage.net**: Cloud-based JSON storage for product data
- **Google Maps**: Embedded location map
- **WhatsApp Business API**: Direct messaging integration

### SEO & Analytics
- **Structured Data (JSON-LD)**: Organization, LocalBusiness, Product, and WebSite schemas
- **Open Graph Tags**: Social media sharing optimization
- **Twitter Cards**: Twitter sharing optimization
- **Sitemap.xml**: Search engine indexing
- **Robots.txt**: Search engine crawler instructions

## 📁 Project Structure

```
Hello/
├── admin/                    # Admin panel
│   ├── dashboard.html        # Admin dashboard page
│   ├── index.html           # Admin login page
│   ├── admin.js             # Admin functionality
│   ├── admin.css            # Admin styles
│   ├── products.json        # Product data (local backup)
│   └── README.md            # Admin panel documentation
├── images/                   # Image assets
│   ├── Products/            # Product images
│   ├── Farm/                # Farm gallery images
│   ├── logo.png             # Site logo
│   └── owner.jpg            # Founder photo
├── index.html               # Homepage
├── products.html            # Products page
├── gallery.html             # Gallery page
├── contact.html             # Contact page
├── style.css                # Main stylesheet
├── style.js                 # Main JavaScript
├── robots.txt               # SEO robots file
└── sitemap.xml              # SEO sitemap
```

## 🚀 Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- A web server (for local development) or web hosting (for production)
- Optional: EmailJS account for contact form functionality

### Installation

1. **Clone or download the repository**
   ```bash
   git clone <repository-url>
   cd Hello
   ```

2. **Set up a local web server** (choose one method):
   
   **Using Python:**
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Python 2
   python -m SimpleHTTPServer 8000
   ```
   
   **Using Node.js (http-server):**
   ```bash
   npx http-server -p 8000
   ```
   
   **Using PHP:**
   ```bash
   php -S localhost:8000
   ```

3. **Open in browser**
   ```
   http://localhost:8000
   ```

### Configuration

#### EmailJS Setup (Contact Form)
1. Create an account at [EmailJS](https://www.emailjs.com/)
2. Create an email service and template
3. Update the EmailJS configuration in `contact.html` and `index.html`:
   ```javascript
   emailjs.init("YOUR_PUBLIC_KEY");
   // Update service ID and template ID in form submission handler
   ```

#### Admin Panel Setup
1. Navigate to `/admin/index.html`
2. Login credentials:
   - **Username:** `admin`
   - **Password:** `admin123`
3. On first save, the system will create a JSON storage automatically
4. The storage ID will be saved in your browser's localStorage

## 📱 Pages Overview

### Homepage (`index.html`)
- Hero section with product slideshow
- Why Choose Us section
- About SL Farmer
- Founder's story (Rashmi Perera)
- Statistics and achievements
- Footer with contact information and social links

### Products Page (`products.html`)
- Product grid with all available items
- Dynamic availability status
- Pricing information
- Product descriptions
- Call-to-action sections

### Gallery Page (`gallery.html`)
- Farm and product photo gallery
- Image lightbox functionality

### Contact Page (`contact.html`)
- Contact form (EmailJS integration)
- Contact information cards
- Embedded Google Maps
- WhatsApp direct chat button

### Admin Dashboard (`admin/dashboard.html`)
- Product availability management
- Real-time status updates
- Bulk actions (make all available/unavailable)
- Theme toggle
- Logout functionality

## 🎨 Customization

### Colors
The site uses a custom "farm" color palette defined in Tailwind config:
- Primary: Green shades (`farm-500`, `farm-700`, etc.)
- Accent: Amber for dark mode highlights
- Background: Farm-50 (light) / Slate-950 (dark)

### Typography
- Headings: Bold, extra-bold weights
- Body: Slate color palette
- Custom tracking for uppercase labels

### Images
Replace images in the `images/` directory:
- Product images: `images/Products/`
- Farm gallery: `images/Farm/`
- Logo: `images/logo.png`
- Owner photo: `images/owner.jpg`

## 🔒 Security Notes

- Admin authentication is client-side only (basic protection)
- For production, implement proper server-side authentication
- Consider adding rate limiting for contact form submissions
- Validate and sanitize all user inputs

## 📊 SEO Features

- **Meta Tags**: Comprehensive meta descriptions and keywords
- **Structured Data**: JSON-LD schemas for:
  - Organization
  - LocalBusiness
  - Product (multiple products)
  - WebSite
- **Open Graph**: Social media sharing tags
- **Sitemap**: XML sitemap for search engines
- **Robots.txt**: Crawler instructions
- **Canonical URLs**: Prevent duplicate content
- **Semantic HTML**: Proper heading hierarchy and semantic elements

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 📞 Contact Information

- **Phone:** +94 75 151 9573
- **Email:** SLfarmercompany@gmail.com
- **Address:** 85/1 Pokunuwita Kulupana, Sri Lanka
- **WhatsApp:** [Chat on WhatsApp](https://wa.me/94751519573)
- **Facebook:** [SL Farmer Facebook](https://www.facebook.com/profile.php?id=61583678220885)
- **Instagram:** [@slfarmer](https://www.instagram.com/slfarmer)

## 🚀 Deployment

### Static Hosting Options
- **Netlify**: Drag and drop the folder or connect via Git
- **Vercel**: Deploy via CLI or Git integration
- **GitHub Pages**: Push to repository and enable Pages
- **Cloudflare Pages**: Connect repository for automatic deployments
- **Traditional Web Hosting**: Upload files via FTP/SFTP

### Deployment Checklist
- [ ] Update EmailJS configuration with production keys
- [ ] Test all forms and interactive features
- [ ] Verify all images load correctly
- [ ] Test on multiple devices and browsers
- [ ] Check SEO meta tags and structured data
- [ ] Verify sitemap.xml and robots.txt
- [ ] Test admin panel functionality
- [ ] Enable HTTPS (required for EmailJS)
- [ ] Set up analytics (Google Analytics, etc.)

## 🔄 Future Enhancements

Potential improvements for future versions:
- [ ] E-commerce integration (shopping cart, checkout)
- [ ] Payment gateway integration
- [ ] Customer reviews and ratings
- [ ] Blog section for farming tips and updates
- [ ] Newsletter subscription
- [ ] Multi-language support (Sinhala, Tamil)
- [ ] Advanced admin features (inventory management, order tracking)
- [ ] Product search and filtering
- [ ] Customer account system
- [ ] Order tracking system

## 📝 License

All rights reserved. © 2025 SL Farmer

## 👤 Author

**Rashmi Perera**  
Founder & Head Farmer  
SL Farmer

---

**Built with ❤️ for sustainable farming and premium produce**

