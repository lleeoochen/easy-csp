# Design Document

## Overview

This document describes the technical design for refactoring the Easy CSP navigation system from a 6-tab bottom navigation to a 4-tab navigation with secondary pages accessible via the Settings page.

## Architecture

### Current State

- 6 tabs in bottom navigation: Spending, Savings, Institutions, Transactions, Rules, Settings
- All pages are full routes with tab buttons
- Tab labels are commented out in the UI

### Target State

- 4 tabs in bottom navigation: Spending, Savings, Transactions, Settings
- Tab labels visible below icons
- Institutions and Rules remain as full routes but accessed via Settings page
- Back buttons on secondary pages return to Settings

## Component Design

### 1. App.tsx Changes

**Current Implementation:**
```typescript
<Tabs
  paths={[
    { path: "/", name: "Spending", icon: BarChart3, element: <ConsciousSpendingPlanPage /> },
    { path: "/savingTargets", name: "Savings", icon: Target, element: <SavingTargetsPage /> },
    { path: "/institutions", name: "Institutions", icon: Building2, element: <FinancialInstitutionsPage /> },
    { path: "/transactions", name: "Transactions", icon: DollarSign, element: <TransactionsPage /> },
    { path: "/rules", name: "Rules", icon: Filter, element: <RulesPage /> },
    { path: "/settings", name: "Settings", icon: Settings, element: <SettingsPage /> },
  ]}
/>
```

**New Implementation:**
- Split the `paths` prop into two separate props: `primaryPaths` (for tabs) and `secondaryPaths` (for routes only)
- OR: Keep single `paths` array but add a `showInNav` boolean flag to each path
- Recommended: Use the flag approach for simplicity

```typescript
type PathConfig = {
  path: string;
  name: string;
  icon: ComponentType<LucideProps>;
  element: ReactNode;
  showInNav: boolean; // New flag
};

<Tabs
  paths={[
    { path: "/", name: "Spending", icon: BarChart3, element: <ConsciousSpendingPlanPage />, showInNav: true },
    { path: "/savingTargets", name: "Savings", icon: Target, element: <SavingTargetsPage />, showInNav: true },
    { path: "/transactions", name: "Transactions", icon: DollarSign, element: <TransactionsPage />, showInNav: true },
    { path: "/settings", name: "Settings", icon: Settings, element: <SettingsPage />, showInNav: true },
    { path: "/institutions", name: "Institutions", icon: Building2, element: <FinancialInstitutionsPage />, showInNav: false },
    { path: "/rules", name: "Rules", icon: Filter, element: <RulesPage />, showInNav: false },
  ]}
/>
```

### 2. Tabs.tsx Changes

**Type Updates:**
```typescript
type TabsProps = {
  paths: {
    path: string;
    name: string;
    element: ReactNode;
    icon: ComponentType<LucideProps>;
    showInNav: boolean; // Add this field
  }[]
};
```

**Component Logic:**
```typescript
export const Tabs = ({ paths }: TabsProps) => {
  // Filter paths for navigation display
  const navPaths = paths.filter(p => p.showInNav);

  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <main className="flex-1 pb-16 w-full">
          <Routes>
            {/* Render ALL routes, not just nav paths */}
            {paths.map(({ path, element }) => (
              <Route key={path} path={path} element={element} />
            ))}
          </Routes>
        </main>

        {/* Bottom Navigation - only show navPaths */}
        <nav className="fixed flex bottom-5 left-0 right-0 bg-white/20 z-10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30 w-fit mx-auto mb-[env(safe-area-inset-bottom)]">
          {navPaths.map(path => (
            <div key={path.path}>
              <TabMenuItem {...path} />
            </div>
          ))}
        </nav>
      </div>
    </Router>
  );
};
```

**TabMenuItem Updates:**
```typescript
export const TabMenuItem = ({ path, name, icon }: TabMenuItemProps) => {
  const IconElement = icon;
  const location = useLocation();
  const isActive = location.pathname === path;
  const strokeWidth = isActive ? 2 : 1.5;

  return (
    <Link
      to={path}
      className={cn(
        "flex flex-col flex-1 items-center py-2 px-2 rounded-2xl hover:bg-white/50 transition duration-200",
        {
          "font-bold": isActive,
          "bg-gray-300/70 shadow-2xl": isActive
        }
      )}
    >
      <IconElement className="size-7" strokeWidth={strokeWidth}/>
      {/* Uncomment and display label */}
      <span className="text-xs mt-1">{name}</span>
    </Link>
  );
};
```

### 3. New Component: BackButton

Create a reusable back button component for secondary pages.

**File:** `easy-csp/src/components/common/BackButton.tsx`

```typescript
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "./button";

type BackButtonProps = {
  to?: string; // Optional explicit path, defaults to -1 (browser back)
  label?: string; // Optional label, defaults to "Back"
};

export const BackButton = ({ to, label = "Back" }: BackButtonProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <Button
      variant="ghost"
      onClick={handleClick}
      className="flex items-center gap-2"
    >
      <ArrowLeft className="size-4" />
      {label}
    </Button>
  );
};
```

### 4. SettingsPage Updates

Add navigation cards/buttons for Rules and Financial Institutions.

**File:** `easy-csp/src/pages/SettingsPage.tsx`

```typescript
import { getAuth, signOut } from "firebase/auth";
import { useAuthState } from "../hooks/useAuthState";
import { User, Building2, Filter, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader } from "../components/common/card";
import { Page } from "../components/Page";
import { Button } from "../components/common/button";
import { useNavigate } from "react-router-dom";

const SettingsPage = () => {
  const { signedIn } = useAuthState();
  const auth = getAuth();
  const user = auth.currentUser;
  const navigate = useNavigate();

  const handleSignOut = () => {
    signOut(auth).then(() => {
      console.log('User signed out successfully');
    }).catch((error) => {
      console.error('Sign out error:', error);
    });
  };

  if (!signedIn) {
    return null;
  }

  return (
    <Page title="Settings">
      <div className="space-y-4">
        {/* User Information Section */}
        <Card>
          <CardHeader className="text-lg flex items-center">
            <User className="w-5 h-5 mr-2" />
            User Information
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <label className="font-medium text-gray-600">Name:</label>
              <p className="text-gray-900">
                {user?.displayName || user?.email || 'Anonymous User'}
              </p>
            </div>

            {user?.email && (
              <div>
                <label className="font-medium text-gray-600">Email:</label>
                <p className="text-gray-900">{user.email}</p>
              </div>
            )}
            <Button
              variant="primary"
              onClick={handleSignOut}
            >
              Sign Out
            </Button>
          </CardContent>
        </Card>

        {/* Management Section */}
        <Card>
          <CardHeader className="text-lg">
            Manage
          </CardHeader>
          <CardContent className="space-y-2">
            {/* Financial Institutions Button */}
            <button
              onClick={() => navigate('/institutions')}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-gray-600" />
                <div className="text-left">
                  <p className="font-medium">Financial Institutions</p>
                  <p className="text-sm text-gray-500">Manage connected accounts</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>

            {/* Rules Button */}
            <button
              onClick={() => navigate('/rules')}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Filter className="w-5 h-5 text-gray-600" />
                <div className="text-left">
                  <p className="font-medium">Transaction Rules</p>
                  <p className="text-sm text-gray-500">Manage categorization rules</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </CardContent>
        </Card>
      </div>
    </Page>
  );
};

export default SettingsPage;
```

### 5. Secondary Page Updates

Add back buttons to FinancialInstitutionsPage and RulesPage.

**FinancialInstitutionsPage:**
```typescript
import { BackButton } from "../components/common/BackButton";
import { Page } from "../components/Page";

const FinancialInstitutionsPage = () => {
  return (
    <Page
      title="Financial Institutions"
      headerAction={<BackButton to="/settings" />}
    >
      {/* Existing content */}
    </Page>
  );
};
```

**RulesPage:**
```typescript
import { BackButton } from "../components/common/BackButton";
import { Page } from "../components/Page";

const RulesPage = () => {
  return (
    <Page
      title="Transaction Rules"
      headerAction={<BackButton to="/settings" />}
    >
      {/* Existing content */}
    </Page>
  );
};
```

**Note:** If the `Page` component doesn't support a `headerAction` prop, add the BackButton directly in the page content:

```typescript
const FinancialInstitutionsPage = () => {
  return (
    <Page title="Financial Institutions">
      <div className="mb-4">
        <BackButton to="/settings" />
      </div>
      {/* Existing content */}
    </Page>
  );
};
```

## Data Flow

### Navigation Flow

```
User opens app
  ↓
Bottom nav shows 4 tabs: Spending, Savings, Transactions, Settings
  ↓
User clicks Settings tab
  ↓
Settings page displays with "Manage" section
  ↓
User clicks "Financial Institutions" or "Transaction Rules"
  ↓
Navigate to /institutions or /rules (full route)
  ↓
Page renders with back button
  ↓
User clicks back button
  ↓
Navigate to /settings
```

### Route Registration

All 6 routes are registered in React Router:
- `/` - Conscious Spending Plan (tab)
- `/savingTargets` - Saving Targets (tab)
- `/transactions` - Transactions (tab)
- `/settings` - Settings (tab)
- `/institutions` - Financial Institutions (no tab, accessed via Settings)
- `/rules` - Transaction Rules (no tab, accessed via Settings)

## Implementation Plan

### Phase 1: Update Type Definitions
1. Add `showInNav` boolean to path configuration type in Tabs.tsx
2. Update TabsProps and related types

### Phase 2: Update Tabs Component
1. Filter paths for navigation display
2. Render all routes but only show filtered paths in nav
3. Uncomment label display in TabMenuItem

### Phase 3: Create BackButton Component
1. Create `easy-csp/src/components/common/BackButton.tsx`
2. Implement navigation logic with useNavigate

### Phase 4: Update App.tsx
1. Add `showInNav: true` to primary pages
2. Add `showInNav: false` to secondary pages
3. Reorder paths array (optional, for clarity)

### Phase 5: Update SettingsPage
1. Add "Manage" section with Card
2. Add navigation buttons for Institutions and Rules
3. Style with hover effects and icons

### Phase 6: Update Secondary Pages
1. Add BackButton to FinancialInstitutionsPage
2. Add BackButton to RulesPage
3. Test navigation flow

## Testing Considerations

### Manual Testing Checklist
- [ ] Bottom navigation shows exactly 4 tabs
- [ ] Tab labels are visible below icons
- [ ] All 4 primary pages are accessible via tabs
- [ ] Settings page shows navigation buttons for Institutions and Rules
- [ ] Clicking Institutions button navigates to /institutions
- [ ] Clicking Rules button navigates to /rules
- [ ] Back button on Institutions page returns to Settings
- [ ] Back button on Rules page returns to Settings
- [ ] Browser back/forward buttons work correctly
- [ ] Active tab indicator works on all 4 tabs
- [ ] Tab styling (glassmorphism) is preserved
- [ ] Responsive design works on mobile

### Edge Cases
- Direct URL navigation to /institutions or /rules should work
- Browser refresh on secondary pages should work
- Back button should handle browser history correctly

## Accessibility

### ARIA Labels
- Add `aria-label` to tab buttons: "Navigate to {page name}"
- Add `aria-label` to back buttons: "Go back to Settings"
- Add `aria-current="page"` to active tab

### Keyboard Navigation
- All navigation elements must be keyboard accessible
- Tab order should be logical
- Focus management when navigating between pages

### Implementation Example
```typescript
<Link
  to={path}
  aria-label={`Navigate to ${name}`}
  aria-current={isActive ? "page" : undefined}
  className={/* ... */}
>
  {/* ... */}
</Link>
```

## Visual Design

### Tab Labels
- Font size: `text-xs` (Tailwind)
- Margin top: `mt-1`
- Color: Inherit from parent (changes with active state)

### Settings Navigation Buttons
- Full width cards with hover effect
- Icon on left, chevron on right
- Two-line layout: title + description
- Hover: `hover:bg-gray-100`
- Padding: `p-3`
- Border radius: `rounded-lg`

### Back Button
- Ghost variant (transparent background)
- Left-aligned arrow icon
- Text: "Back"
- Positioned at top of page content

## Dependencies

No new dependencies required. Uses existing:
- `react-router-dom` (v7)
- `lucide-react` (icons)
- `clsx` + `tailwind-merge` (styling)
- Tailwind CSS v4

## Migration Notes

### Breaking Changes
None. This is a UI refactoring that maintains all existing routes and functionality.

### Backward Compatibility
- All existing routes remain functional
- Direct URL access to all pages still works
- Browser history navigation preserved
- No changes to page components' internal logic

## Future Enhancements

### Potential Improvements
1. Add animation transitions when navigating to secondary pages
2. Add breadcrumb navigation for secondary pages
3. Support nested secondary pages if needed
4. Add analytics tracking for navigation patterns
5. Consider adding a "Recently Accessed" section in Settings
