> ⚠️ **SUPERSEDED — kept for history only.**
> The authoritative specification is [`docs/PRODUCT_SPEC.md`](docs/PRODUCT_SPEC.md).
> Where the two disagree, `docs/PRODUCT_SPEC.md` wins. Key changes since this document:
> Supabase backend instead of LocalStorage, TypeScript instead of JavaScript, dual
> auth (email+password OTP *and* Google), a full admin panel, RPC-gated phone numbers,
> reporting/moderation, and listing expiry.
> **Agents: do not build from this file.**

# KGP Bazaar - Complete Technical & Feature Specification

## 1. Executive Overview
KGP Bazaar is an installable Progressive Web Application (PWA) tailored specifically for IIT Kharagpur (KGP) students. It facilitates student-to-student transactions for buy/sell items and a community Wanted Board for item requests.

---

## 2. Branding & Visual Design System
- **Theme**: Light Mode with Sky/Light Blue Accents (`#0284C7` / `#38BDF8`).
- **Background**: Soft off-white Slate (`#F8FAFC`).
- **Cards & Surfaces**: Clean White (`#FFFFFF`) with rounded corners (`rounded-2xl`), subtle borders (`border-slate-200/80`), and elevated drop shadows.
- **Typography**: Google Font **Inter** for clean readability.
- **Animations**: Soft micro-animations with `framer-motion` (tab sliding indicator, scale feedback on clicks, toast popups, modal sheet transitions).
- **Navigation**:
  - **Mobile**: Fixed bottom navigation bar with 4 tabs:
    1. 🏠 **Home** (For Sale Feed & Wanted Board switcher)
    2. 📢 **Wanted** (Student Request Board)
    3. ➕ **Sell / Request** (Floating post button)
    4. 👤 **Profile** (Student credentials, my active/sold listings, logout)
  - **Desktop**: Top sticky glassmorphic navigation header.

---

## 3. Student Authentication & Profile Specification
- **Email Validation Requirement**: Strictly enforces email ending with `@kgpian.iitkgp.ac.in`.
- **Email Verification**: OTP verification step simulation / email confirmation logic.
- **Student Profile Fields**:
  - Full Name
  - Roll Number (e.g., `22CS10045`)
  - KGP Email (`username@kgpian.iitkgp.ac.in`)
  - Password
  - Hall of Residence (Dropdown list of KGP Halls: Azad, Patel, LBS, Nehru, RK, MMR, SAM, RP, VS, HBR, MS, SN/IG, MT, SAM, Gokhale, etc.)
  - WhatsApp Phone Number (Must be valid format for direct `wa.me` links)
- **Exclusions**: NO room number field, NO sports data or sports filters.

---

## 4. Feature Specifications

### A. For Sale Feed & Catalog
- **Categories (6 Types)**:
  1. 🚲 **Cycles & Accessories**
  2. 📚 **Books, Notes & Academics**
  3. 💻 **Electronics & Gadgets**
  4. 🛏️ **Room Essentials & Furniture**
  5. 🥼 **Lab & Course Gear**
  6. 📦 **Other / Misc**
- **Feed Features**:
  - **Instant Search Bar**: Filter by title or description text in real-time.
  - **Category Pills**: Horizontal scroll filter buttons.
  - **Sorting**: Newest First (Default), Price: Low to High, Price: High to Low.
  - **Item Cards**: Displays high-res product photo, price tag badge, item condition badge (*Brand New, Like New, Good, Fair*), negotiability badge (*Fixed* vs *Negotiable*), seller's Hall of Residence, and a **"Contact Seller on WhatsApp"** button.

### B. Wanted Board (Student Request System)
- **Dual Feed Segment Control**: Switch between `🛍️ For Sale` and `📢 Wanted Board` on the main screen.
- **Wanted Board Request Cards**: Displays requested item title, category badge, max budget badge (`Budget: Under ₹X`), description/specs, requester's Hall of Residence, and a prominent **"I Have This! (WhatsApp)"** response button.
- **WhatsApp Pre-filled Response**:
  - Opens `https://wa.me/<requester_phone>?text=...` with:
  *"Hi! I saw your request '[Item Title]' on KGP Bazaar Wanted Board. I have this item available!"*
- **Lifecycle**: Requester can mark request as **"Found / Fulfilled"** or delete it.

### C. Listing Creation & Management Flow
- **Fields Required for Posting an Item**:
  - Item Title
  - Category (from the 6 categories)
  - Price (in ₹)
  - Negotiable Toggle (*Fixed* vs *Negotiable*)
  - Condition (*Brand New*, *Like New*, *Good*, *Fair*)
  - Photos (Upload up to 4 images with preview)
  - Description
  - Hall of Residence (Auto-filled from user profile)
- **Item Management**:
  - **"Mark as Sold"**: Toggle item status to "SOLD" (displays a muted badge and disables contact buttons).
  - **Edit / Delete**: Ability to update price/details or delete listing.

### D. Direct 1-Click WhatsApp Buyer-Seller Communication
- Clicking **"Contact Seller"** opens:
  `https://wa.me/<seller_whatsapp>?text=Hi!%20I%20saw%20your%20listing%20"[Item Title]"%20for%20₹[Price]%20on%20KGP%20Bazaar.%20Is%20it%20available?`
- No in-app payment gateway required (Transactions take place in-person on campus via Cash or UPI).

### E. PWA Mobile Installation
- Includes `manifest.json` and service worker setup via `vite-plugin-pwa`.
- Displays an interactive **"Add to Home Screen"** banner on mobile browsers.

---

## 5. Technical Stack & Architecture
- **Framework**: Vite + React 18
- **Styling**: TailwindCSS / Vanilla CSS with custom design tokens for Light Blue (`#0284c7`)
- **Icons**: `lucide-react`
- **Animations**: `framer-motion`
- **Persistence**: LocalStorage with state hooks + modular adapter interface for easy Supabase / Firebase integration.
