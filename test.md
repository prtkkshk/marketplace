# KGP Bazaar — Comprehensive Test Plan & Verification Checklist

This document details the complete testing strategy, automated test commands, security/RLS verification matrix, and manual QA checklist for **KGP Bazaar** (IIT Kharagpur Campus Marketplace PWA).

---

## 1. Overview & Verification Strategy

KGP Bazaar is a mobile-first installable PWA for IIT Kharagpur students. The verification strategy ensures 100% compliance across four dimensions:

1. **Strict Type Safety & Build**: Zero TypeScript errors (`npx tsc --noEmit`).
2. **Automated Unit & E2E Tests**: Vitest unit test suite and Playwright end-to-end user journeys.
3. **Database & RLS Security**: Row Level Security (RLS) policies tested for both positive (allowed) and negative (rejected) cases.
4. **PWA & Viewport Quality**: Mobile-first layout at 390px width, offline fallback shell, and Service Worker caching.

---

## 2. Automated Test Suite Commands

Run the following standard verification commands before declaring any feature or phase done:

```bash
# 1. Typecheck strict mode
npm run typecheck

# 2. Code Linting & Style check
npm run lint

# 3. Unit & Integration Tests (Vitest)
npm run test

# 4. Playwright End-to-End Golden Path Suite
npm run test:e2e

# 5. Build Production Bundle
npm run build
```

---

## 3. End-to-End (E2E) Test Scenarios

### Golden Path 1: Sign Up, Verification & Profile Completion
- **Target File**: `tests/e2e/golden_path_auth.spec.ts`
- **Steps**:
  1. Student enters institute email (`roll@kgpian.iitkgp.ac.in`) and password.
  2. Non-KGP emails (e.g. `user@gmail.com`) are rejected instantly with domain validation feedback.
  3. Sign-up triggers confirmation email and presents "Check Your Email" confirmation view.
  4. Following email verification link logs student in and opens `/complete-profile`.
  5. Profile form enforces name, valid roll number (`22CS10045`), hall selection, and Indian WhatsApp number (`+91XXXXXXXXXX`).
  6. Submitting profile redirects to main marketplace feed (`/`).

### Golden Path 2: Feed Browsing, Filtering & Contact Reveal
- **Target File**: `tests/e2e/golden_path_feed.spec.ts`
- **Steps**:
  1. Feed displays active listings with image thumbnails, price formatting (`₹...`), category badge, and hall of residence.
  2. Segmented control switches between "Buy / Sell" feed and "Wanted Board".
  3. Filter sheet filters items by Category (`cycles`), Condition (`good`), Hall, and Max Price.
  4. Search bar filters items dynamically by title/description.
  5. Tapping "Contact Seller" triggers `get_contact_number` RPC, logging contact event and opening WhatsApp deep link (`https://wa.me/91...`).
  6. Rate limiting enforces maximum 30 contact reveals per hour per student.

### Golden Path 3: Posting a Listing & Wanted Request
- **Target File**: `tests/e2e/golden_path_post.spec.ts`
- **Steps**:
  1. Student taps `+ Post` navigation button.
  2. Fills listing form (Title, Category, Price, Condition, Description, Photos).
  3. Form validates minimum 1 image and price limits (₹0 to ₹5,00,000).
  4. Submission uploads images to `listing-photos` bucket under user folder (`user_id/...`).
  5. Item appears at top of feed with confetti animation.
  6. Student posts a Wanted Request with title, budget, and description.

### Golden Path 4: Safety, Reporting & Admin Moderation Queue
- **Target File**: `tests/e2e/golden_path_report_admin.spec.ts`
- **Steps**:
  1. Student taps item menu (3 dots) and selects "Report".
  2. Selects reason (`prohibited`, `spam_scam`, `offensive`, etc.) and submits optional details.
  3. Admin logs into `/admin` panel and sees updated moderation queue count badge.
  4. Admin reviews report, selects action ("Hide", "Delete", or "Ban User"), and inputs resolution note.
  5. Action executes database update and logs entry in `admin_audit_log`.
  6. Reported item is removed from public student feed immediately.

---

## 4. Security & Row Level Security (RLS) Matrix

Every database table MUST enforce Row Level Security. Assert the following security policies:

| Table | Operation | Allowed Actor | Condition / Rule | Negative Test Case (Must Fail) |
| :--- | :--- | :--- | :--- | :--- |
| `profiles` | `SELECT` | Authenticated User | Own profile or active student public fields | Student A cannot view private fields of Student B |
| `profiles` | `UPDATE` | Profile Owner / Admin | `auth.uid() = id` (cannot change `is_admin`/`is_banned`) | Student cannot set `is_admin = true` |
| `listings` | `SELECT` | Public / Student | `status = 'active'` AND `deleted_at IS NULL` | Non-admin cannot view hidden/deleted listings |
| `listings` | `INSERT` | Active Student | `user_id = auth.uid()` AND `is_profile_complete = true` | Banned or incomplete profile student cannot post |
| `listings` | `UPDATE/DELETE`| Listing Owner / Admin| `user_id = auth.uid()` | Student A cannot edit/delete Student B's listing |
| `wanted_requests`| `SELECT/INSERT`| Active Student | `status = 'open'` AND `deleted_at IS NULL` | Non-owner cannot modify request |
| `saved_items` | `ALL` | Item Owner | `user_id = auth.uid()` | Student A cannot view Student B's saved items |
| `reports` | `INSERT` | Active Student | `reporter_id = auth.uid()` | Cannot report own listing; unique constraint on duplicate reports |
| `admin_audit_log`| `SELECT/INSERT`| Admin Only | `is_admin() = true` | Regular student rejected with RLS policy error |

---

## 5. PWA & Mobile Responsiveness Checklist (390px Viewport)

- [ ] **Viewport Target**: Verified layout at 390px × 844px (iPhone 12/13/14 baseline).
- [ ] **Navigation**: Bottom navigation tab bar visible on mobile screen (`<md`); desktop top navigation header visible on desktop (`≥md`).
- [ ] **Touch Targets**: All buttons, pills, and interactive icons have touch target area ≥ 44px × 44px.
- [ ] **Service Worker**: PWA Service Worker registered (`sw.js`). Update toast appears when new version is deployed.
- [ ] **Offline Shell**: Offline banner appears when network connection is disconnected, displaying cached offline state.
- [ ] **Manifest & Icons**: `manifest.json` valid with app name ("KGP Bazaar"), theme color (`#0f172a`), background color (`#f8fafc`), and icons (192px and 512px).
- [ ] **Font & Typography**: Standard rupee formatting helper `formatINR()` used across all prices (no raw string concatenated prices).

---

## 6. Manual Verification Pass Checklist

Before releasing a build or phase:

1. [ ] **Clean Console**: No React warnings, missing key warnings, or uncaught promise rejections.
2. [ ] **Image Upload**: Upload 1–4 photos, confirm WebP format conversion and storage path `listing-photos/USER_ID/FILENAME`.
3. [ ] **WhatsApp Deep Link**: Click contact button, verify deep link format `https://wa.me/91XXXXXXXXXX?text=...`.
4. [ ] **Admin Audit Trail**: Perform admin moderation action and check `/admin/audit` to confirm audit log entry.
