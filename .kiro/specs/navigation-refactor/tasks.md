# Implementation Plan: Navigation Refactor

## Overview

This plan implements a refactored navigation structure that reduces the bottom navigation from 6 tabs to 4 tabs, while maintaining full-page routes for Institutions and Rules pages accessible via the Settings page. The implementation follows a component-first approach, building from the foundation (types and core components) up to the integration layer.

## Tasks

- [x] 1. Update Tabs component type definitions and filtering logic
  - [x] 1.1 Add `showInNav` boolean flag to path configuration type in Tabs.tsx
    - Update `TabsProps` type to include `showInNav: boolean` field
    - Update `TabMenuItemProps` if needed for consistency
    - _Requirements: 1.1, 1.7, 5.1_

  - [x] 1.2 Implement navigation filtering in Tabs component
    - Create `navPaths` variable that filters `paths` where `showInNav === true`
    - Update bottom navigation to render only `navPaths` in TabMenuItem components
    - Ensure all routes (both primary and secondary) are still registered in Routes
    - _Requirements: 1.1, 2.4, 5.2_

  - [x] 1.3 Uncomment and display tab labels in TabMenuItem
    - Uncomment the `<span className="text-xs mt-1">{name}</span>` line
    - Verify label displays correctly below icon
    - _Requirements: 1.8, 6.1_

  - [ ]* 1.4 Add ARIA labels to tab navigation elements
    - Add `aria-label` prop to Link in TabMenuItem: `Navigate to ${name}`
    - Add `aria-current="page"` when `isActive` is true
    - _Requirements: 7.1, 7.2_

- [x] 2. Create BackButton component
  - [x] 2.1 Create BackButton component file
    - Create `easy-csp/src/components/common/BackButton.tsx`
    - Implement component with `to` (optional string) and `label` (optional string, default "Back") props
    - Use `useNavigate` hook from react-router-dom
    - Use `ArrowLeft` icon from lucide-react
    - Use existing Button component with `variant="ghost"`
    - If `to` is provided, navigate to that path; otherwise use `navigate(-1)` for browser back
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 2.2 Add ARIA label to BackButton
    - Add `aria-label="Go back to Settings"` or similar to button element
    - Make label dynamic based on context if needed
    - _Requirements: 7.2, 7.3_

- [x] 3. Update App.tsx with showInNav flags
  - [x] 3.1 Add `showInNav: true` to primary navigation paths
    - Add flag to "/" (Spending)
    - Add flag to "/savingTargets" (Savings)
    - Add flag to "/transactions" (Transactions)
    - Add flag to "/settings" (Settings)
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 5.1_

  - [x] 3.2 Add `showInNav: false` to secondary pages
    - Add flag to "/institutions" (Financial Institutions)
    - Add flag to "/rules" (Transaction Rules)
    - _Requirements: 2.1, 2.2, 2.4, 5.1_

- [x] 4. Update SettingsPage with navigation to secondary pages
  - [x] 4.1 Add imports and navigation setup
    - Import `useNavigate` from react-router-dom
    - Import `Building2`, `Filter`, and `ChevronRight` icons from lucide-react
    - Initialize `navigate` hook
    - _Requirements: 4.1, 4.2, 4.5_

  - [x] 4.2 Create "Manage" section with navigation buttons
    - Add new Card component below User Information card
    - Add CardHeader with "Manage" title
    - Create navigation button for Financial Institutions with icon, title, description, and chevron
    - Create navigation button for Transaction Rules with icon, title, description, and chevron
    - Style buttons with hover effects: `hover:bg-gray-100`, `rounded-lg`, `p-3`
    - Wire onClick handlers to navigate to `/institutions` and `/rules`
    - _Requirements: 4.1, 4.2, 4.3, 6.5_

- [x] 5. Add BackButton to FinancialInstitutionsPage
  - [x] 5.1 Import and render BackButton component
    - Import BackButton from `../../components/common/BackButton`
    - Add BackButton with `to="/settings"` prop at the top of page content
    - Position inside a `<div className="mb-4">` wrapper before existing content
    - _Requirements: 3.1, 3.3, 4.4_

  - [ ]* 5.2 Verify keyboard accessibility
    - Test that BackButton is keyboard accessible (Tab key navigation)
    - Test that Enter/Space keys trigger navigation
    - _Requirements: 7.3, 7.4_

- [x] 6. Add BackButton to RulesPage
  - [x] 6.1 Import and render BackButton component
    - Import BackButton from `../../components/common/BackButton`
    - Add BackButton with `to="/settings"` prop at the top of page content
    - Position inside a `<div className="mb-4">` wrapper before existing content
    - _Requirements: 3.2, 3.3, 4.4_

  - [ ]* 6.2 Verify keyboard accessibility
    - Test that BackButton is keyboard accessible (Tab key navigation)
    - Test that Enter/Space keys trigger navigation
    - _Requirements: 7.3, 7.4_

- [x] 7. Checkpoint - Test navigation flow and verify requirements
  - Verify bottom navigation shows exactly 4 tabs (Spending, Savings, Transactions, Settings)
  - Verify tab labels are visible below icons
  - Verify Settings page shows navigation buttons for Institutions and Rules
  - Verify clicking Institutions button navigates to /institutions page
  - Verify clicking Rules button navigates to /rules page
  - Verify BackButton on Institutions page returns to Settings
  - Verify BackButton on Rules page returns to Settings
  - Verify browser back/forward buttons work correctly
  - Verify active tab indicator works on all 4 tabs
  - Verify glassmorphism styling is preserved on bottom navigation
  - Verify direct URL navigation to /institutions and /rules works
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- The implementation maintains backward compatibility with all existing page components
- No changes to Firebase integration, authentication flow, or existing hooks
- All styling uses Tailwind CSS v4 consistent with existing design
- React Router v7 compatibility is maintained throughout
