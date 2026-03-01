# SL FARMER - LinkedIn Project Document

## Project Title
SL FARMER | Farm Showcase + Pineapple Farm Management System

## One-Line Summary
Built a modern, responsive agri-brand website and a Firebase-powered farm management dashboard to track lands, harvests, expenses, labor, and profitability in real time.

## Project Overview
SL FARMER is a Sri Lankan agriculture-focused web platform with two parts:
- Public marketing website for brand presence, products, gallery, and customer contact.
- Private admin system for day-to-day farm operations and financial tracking.

The solution helps bridge traditional farming with a digital workflow, making operational data easier to manage and analyze.

## Problem Statement
Farm data (land records, harvest entries, labor costs, and expenses) is often scattered across notebooks or spreadsheets, making it hard to:
- Track real profitability per land.
- Maintain consistent operational records.
- Present the brand professionally to customers online.

## Solution Implemented
I implemented:
- A responsive multi-page website (`index.html`, `products.html`, `gallery.html`) with dark mode, contact channels, and product presentation.
- A Firebase-based farm management app (`admin/index.html`) with authenticated access, role-based behavior, and real-time Firestore data sync.
- Financial and operational dashboards showing revenue, expenses, net profit, upcoming tasks, and harvest summaries.
- Mobile-friendly UX updates and PWA install support for app-like admin access.

## Key Features
### Public Website
- Responsive UI for desktop and mobile.
- Product listing with pricing display in LKR (`Rs.`).
- Farm gallery and founder story sections.
- WhatsApp and email contact options.
- SEO files (`robots.txt`, `sitemap.xml`) and structured content.

### Admin System (Pineapple Farm MS)
- Firebase Authentication (login/logout).
- Role-aware access (admin editing, user read-only mode).
- CRUD flows for:
  - Lands
  - Harvest records
  - Expenses
  - Laborers
  - Fertilizer/task schedules
- Filter, sort, and export options (CSV/print/PDF style reports).
- Real-time KPI cards (Revenue, Expenses, Net Profit, Tasks).
- PWA support with service worker and install prompt.

## Tech Stack
- Frontend: HTML5, CSS3, JavaScript (ES6+), Tailwind CSS, Font Awesome
- Backend services: Firebase Firestore + Firebase Auth
- PWA: Web App Manifest + Service Worker
- Deployment model: Static hosting friendly (GitHub/Netlify/Vercel compatible)

## My Role
Full-stack web developer (frontend-heavy + Firebase integration)
- Designed and refined UI/UX for public and admin areas.
- Implemented responsive behavior and dark mode improvements.
- Built data models and Firestore CRUD workflows.
- Added calculations for revenue, expense, and profit visibility.
- Improved layout behavior for long financial values and mobile usability.

## Challenges & How I Solved Them
1. Financial values overflowing UI cards
- Updated responsive layout logic and value containers so large numbers stay visible.

2. Mobile alignment and usability issues
- Reworked key control/button layouts and card grids to keep one-row mobile behavior where needed.

3. Role-based control without a traditional backend
- Implemented Firebase Auth + Firestore role checks and guarded destructive actions for admin users only.

## Outcome
- A production-ready brand website plus operational dashboard in one project.
- Better visibility into farm performance (cost, revenue, net profit).
- Faster and cleaner daily record management for agricultural operations.
- Improved mobile experience and installable admin interface.

## GitHub / Demo Links
- Repository: https://github.com/Tehan-Hewage/SL-FARMER
- Live URL: https://slfarmer.com

## LinkedIn Post Copy (Ready to Use)
I recently completed **SL FARMER**, a digital platform that combines a modern agriculture brand website with a real-time **Pineapple Farm Management System**.

The project includes a responsive public site for product marketing and a Firebase-powered admin dashboard for managing lands, harvests, expenses, labor, and tasks.

### What I built:
- Responsive multi-page web experience with dark mode
- Real-time Firestore-based records and KPI tracking
- Revenue, expense, and net profit visibility
- Role-based access (admin/user)
- PWA-ready admin panel for installable mobile usage

This project focused on solving real operational challenges in agriculture while keeping the product visually clean and mobile-friendly.

Repo: https://github.com/Tehan-Hewage/SL-FARMER  
Live: https://slfarmer.com

#webdevelopment #javascript #firebase #pwa #agritech #frontend #responsivewebdesign #tailwindcss #softwareengineering

## Short LinkedIn Version
Built **SL FARMER**: a responsive agriculture website + Firebase-powered farm management dashboard.  
Features include land/harvest/expense/labor tracking, role-based access, real-time profit metrics, dark mode, and PWA install support.

Repo: https://github.com/Tehan-Hewage/SL-FARMER  
Live: https://slfarmer.com
