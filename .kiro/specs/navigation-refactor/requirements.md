# Requirements Document

## Introduction

This document specifies the requirements for refactoring the Easy CSP app navigation structure. The current implementation uses a 6-tab bottom navigation bar where all pages are rendered as full-page routes. The refactored navigation will reduce this to 4 primary tabs in the bottom navigation bar, while secondary pages (Institutions, Rules) remain as full-page routes but are accessed via navigation buttons/links rather than tab buttons.

## Glossary

- **Navigation_System**: The routing and UI components that control page navigation in the Easy CSP app
- **Primary_Page**: A top-level page accessible via the bottom navigation bar (CSP, Saving Funds, Transactions, Settings)
- **Secondary_Page**: A supporting page that remains a full-page route but is not included in the bottom navigation bar (Institutions, Rules)
- **Bottom_Navigation_Bar**: The fixed navigation component at the bottom of the screen containing tab buttons for Primary_Pages only
- **Tab_Button**: An interactive element in the Bottom_Navigation_Bar that navigates to a Primary_Page
- **Route**: A URL path that maps to a specific page component in React Router
- **Back_Button**: A navigation control that returns the user to the previous page

## Requirements

### Requirement 1: Primary Navigation Structure

**User Story:** As a user, I want to access the four main features of the app through a bottom navigation bar, so that I can quickly switch between core functionality.

#### Acceptance Criteria

1. THE Navigation_System SHALL display exactly 4 Tab_Buttons in the Bottom_Navigation_Bar
2. THE Navigation_System SHALL include a Tab_Button for the CSP page at path "/"
3. THE Navigation_System SHALL include a Tab_Button for the Saving Funds page at path "/savingTargets"
4. THE Navigation_System SHALL include a Tab_Button for the Transactions page at path "/transactions"
5. THE Navigation_System SHALL include a Tab_Button for the Settings page at path "/settings"
6. WHEN a user clicks a Tab_Button, THE Navigation_System SHALL navigate to the corresponding Primary_Page
7. THE Navigation_System SHALL display each Tab_Button with its associated icon from lucide-react
8. THE Navigation_System SHALL display each Tab_Button with both its icon and text label visible

### Requirement 2: Secondary Page Routing

**User Story:** As a user, I want to access supporting features like Institutions and Rules through navigation links, so that I can view or edit supporting data on dedicated pages.

#### Acceptance Criteria

1. THE Navigation_System SHALL define a Route for the Institutions page at path "/institutions"
2. THE Navigation_System SHALL define a Route for the Rules page at path "/rules"
3. THE Navigation_System SHALL render Secondary_Pages as full-page routes
4. THE Navigation_System SHALL NOT include Tab_Buttons for Secondary_Pages in the Bottom_Navigation_Bar
5. WHEN a user navigates to a Secondary_Page, THE Navigation_System SHALL render it as a full-page view

### Requirement 3: Secondary Page Navigation Controls

**User Story:** As a user, I want to easily return from secondary pages to the main app, so that I can navigate back to my previous context.

#### Acceptance Criteria

1. THE Institutions page SHALL include a Back_Button
2. THE Rules page SHALL include a Back_Button
3. WHEN a user clicks a Back_Button, THE Navigation_System SHALL navigate to the previous page in the browser history
4. THE Back_Button SHALL be visually consistent with the app's design system
5. THE Back_Button SHALL be positioned in a standard location (typically top-left or in a header)

### Requirement 4: Navigation Triggers for Secondary Pages

**User Story:** As a user, I want to access Institutions and Rules pages from the Settings page, so that I can manage supporting data when needed.

#### Acceptance Criteria

1. THE Settings page SHALL provide a navigation button to access the Institutions page
2. THE Settings page SHALL provide a navigation button to access the Rules page
3. WHEN a user clicks a navigation button on the Settings page, THE Navigation_System SHALL navigate to the corresponding Secondary_Page Route
4. WHEN a user clicks the Back_Button on a Secondary_Page, THE Navigation_System SHALL return to the Settings page
5. THE Navigation_System SHALL support programmatic navigation to Secondary_Pages via React Router

### Requirement 5: Route Management

**User Story:** As a developer, I want the routing system to clearly define all page routes, so that the navigation architecture is maintainable and extensible.

#### Acceptance Criteria

1. THE Navigation_System SHALL define Routes for all 6 pages (4 Primary_Pages and 2 Secondary_Pages)
2. THE Navigation_System SHALL include only Primary_Pages in the Bottom_Navigation_Bar
3. THE Navigation_System SHALL maintain React Router v7 compatibility
4. THE Navigation_System SHALL preserve the existing HashRouter implementation
5. THE Navigation_System SHALL maintain browser history navigation for all Routes

### Requirement 6: Visual Consistency

**User Story:** As a user, I want the navigation to maintain the existing visual design while adapting to the new structure, so that the app feels familiar and cohesive.

#### Acceptance Criteria

1. THE Bottom_Navigation_Bar SHALL maintain its current styling with Tailwind CSS v4
2. THE Bottom_Navigation_Bar SHALL maintain its fixed position at the bottom of the screen
3. THE Bottom_Navigation_Bar SHALL maintain the glassmorphism effect (backdrop-blur, transparency, border)
4. THE Bottom_Navigation_Bar SHALL maintain the active state visual indicator for the current tab
5. THE Secondary_Pages SHALL use Tailwind CSS v4 for styling consistent with the app design
6. THE Back_Button SHALL use consistent styling with other navigation elements in the app

### Requirement 7: Accessibility

**User Story:** As a user relying on assistive technology, I want the navigation system to be fully accessible, so that I can navigate the app effectively.

#### Acceptance Criteria

1. THE Navigation_System SHALL provide ARIA labels for all Tab_Buttons
2. THE Navigation_System SHALL provide ARIA labels for all Back_Buttons
3. THE Back_Button SHALL be keyboard accessible
4. THE Navigation_System SHALL support keyboard navigation for all interactive elements
5. THE Navigation_System SHALL maintain proper focus management when navigating between pages

### Requirement 8: Backward Compatibility

**User Story:** As a developer, I want the refactored navigation to preserve existing functionality, so that no features are broken during the transition.

#### Acceptance Criteria

1. THE Navigation_System SHALL preserve all existing page components without modification to their internal logic
2. THE Navigation_System SHALL maintain compatibility with existing hooks (useAuthState, useTransactions, etc.)
3. THE Navigation_System SHALL maintain Firebase integration without changes
4. THE Navigation_System SHALL maintain the existing authentication flow and SignInPage behavior
5. WHEN the refactor is complete, THE Navigation_System SHALL render all 6 pages (4 primary, 2 secondary) with their current functionality intact

### Requirement 9: Future Extensibility

**User Story:** As a developer, I want the navigation architecture to support adding new pages easily, so that future features can follow clear patterns.

#### Acceptance Criteria

1. THE Navigation_System SHALL provide a clear pattern for adding new Primary_Pages with Tab_Buttons
2. THE Navigation_System SHALL provide a clear pattern for adding new Secondary_Pages without Tab_Buttons
3. THE Navigation_System SHALL document the distinction between Primary_Pages and Secondary_Pages in code comments
4. THE Navigation_System SHALL support adding new Routes without requiring changes to the core navigation logic
