# Requirements Document: Travel Mode

## 1. Functional Requirements

### 1.1 Settings Page Integration

The system shall add a "Travel Mode" option to the Settings page under the "Manage" section.

**Acceptance Criteria:**
- Travel Mode option appears in Settings page card layout
- Option displays with Plane icon from lucide-react
- Option shows descriptive text: "Travel Mode" (title) and "Auto-mark travel spending to a fund" (subtitle)
- Option includes ChevronRight icon for navigation consistency

### 1.2 Travel Mode Configuration

The system shall provide a configuration dialog for setting up travel mode.

**Acceptance Criteria:**
- Clicking the Travel Mode row opens the configuration dialog
- Dialog displays CSP categories grouped by bucket (Income, Fixed Cost, Savings, etc.)
- Each category has a checkbox for selection
- Dialog displays saving fund selector using existing SavingTargetSelector component
- Default categories are pre-selected: gifts, diningOut, others (guilt-free spending categories)
- Dialog validates that at least one category is selected
- Dialog validates that a saving fund is selected
- Dialog has Save and Cancel buttons
- Save button is disabled until valid configuration is provided

### 1.3 Travel Mode Toggle

The system shall allow users to enable/disable travel mode after configuration.

**Acceptance Criteria:**
- Toggle switch appears on Travel Mode row in Settings after configuration
- Toggle reflects current travel mode status (on/off)
- Clicking toggle enables/disables travel mode rules (does not open dialog)
- Toggle change shows success feedback (toast notification)
- Toggle is only visible after initial configuration is complete
- Clicking the row (outside the toggle) opens the configuration dialog for editing

### 1.4 Rule Creation and Management

The system shall create and manage rules in Firestore to power travel mode.

**Acceptance Criteria:**
- System creates one RuleTransformation per selected category
- Each rule has name: `__system:travel-mode` for identification (reserved system prefix)
- Each rule uses RuleCondition.Exact for category matching
- Each rule uses assignSavingTargetId action with selected fund
- Rules are enabled by default when created
- Reconfiguring travel mode replaces old rules with new rules
- Toggling travel mode updates enabled field on all travel mode rules
- All rule operations use Firestore transactions for atomicity

### 1.5 Transaction Marking

The system shall automatically mark matching transactions to the selected saving fund.

**Acceptance Criteria:**
- Transactions matching travel mode categories are assigned savingTargetId
- Transaction marking happens during transaction sync/processing
- Existing transaction processing logic applies travel mode rules
- Only transactions in selected categories are affected
- Travel mode rules respect rule priority and execution order

### 1.6 Configuration Persistence

The system shall persist travel mode configuration in Firestore.

**Acceptance Criteria:**
- Configuration is stored in user's Rule document
- Configuration survives page refresh
- Configuration is loaded on Settings page mount
- Multiple travel mode rules are stored as separate transformations
- Travel mode rules are distinguishable by name field

### 1.7 Default Category Selection

The system shall pre-select guilt-free spending categories by default.

**Acceptance Criteria:**
- If user has not configured travel mode, default categories are: gifts, diningOut, others
- Default categories are derived from CSPBucket.GuildFreeSpending mapping
- User can modify default selection before saving
- Default selection is only applied on first configuration, not on reconfiguration

## 2. Non-Functional Requirements

### 2.1 Performance

**2.1.1** Travel mode status shall load within 500ms on Settings page mount.

**2.1.2** Configuration save operation shall complete within 2 seconds under normal network conditions.

**2.1.3** Toggle operation shall complete within 1 second under normal network conditions.

### 2.2 Usability

**2.2.1** Configuration dialog shall be intuitive and require no more than 3 clicks to complete.

**2.2.2** Error messages shall be clear and actionable.

**2.2.3** Travel mode status shall be immediately visible on Settings page.

**2.2.4** Toggle switch shall provide immediate visual feedback on state change.

### 2.3 Reliability

**2.3.1** Rule creation shall be atomic - either all rules are created or none are created.

**2.3.2** System shall handle network failures gracefully with retry options.

**2.3.3** System shall validate saving target existence before creating rules.

**2.3.4** System shall prevent orphaned rules if saving target is deleted.

### 2.4 Security

**2.4.1** All Firestore operations shall validate user authentication.

**2.4.2** Users shall only access their own travel mode configuration.

**2.4.3** Saving target IDs shall be validated to belong to the authenticated user.

**2.4.4** Category values shall be validated against CSPCategory enum.

### 2.5 Maintainability

**2.5.1** Travel mode code shall follow existing project patterns (React Query for data fetching).

**2.5.2** Travel mode components shall be modular and reusable.

**2.5.3** Travel mode rules shall be identifiable by name field for future maintenance.

**2.5.4** Code shall include TypeScript types for all interfaces and functions.

## 3. Data Requirements

### 3.1 Travel Mode Configuration Data

**Structure:**
```typescript
{
  categories: string[];      // Array of CSPCategory values
  savingTargetId: string;    // ID of selected saving fund
}
```

**Constraints:**
- categories must be non-empty array
- categories must contain valid CSPCategory enum values
- savingTargetId must reference existing SavingTarget document
- savingTargetId must belong to authenticated user

### 3.2 Travel Mode Rule Data

**Structure:**
```typescript
{
  name: '__system:travel-mode';  // Reserved system identifier
  enabled: boolean;
  matchingCriteria: {
    category: {
      value: string;
      condition: RuleCondition.Exact;
    };
  };
  action: {
    assignSavingTargetId: string;
  };
}
```

**Constraints:**
- name must be exactly `__system:travel-mode` (reserved for system-managed rules)
- enabled must be boolean
- matchingCriteria.category.value must be valid CSPCategory
- matchingCriteria.category.condition must be RuleCondition.Exact
- action.assignSavingTargetId must reference existing SavingTarget

### 3.3 Storage Location

- Travel mode rules stored in: `rules/{uid}/transformations[]`
- Multiple travel mode rules stored as array elements
- Rules identified by name field: `__system:travel-mode`
- The `__system:` prefix is reserved for system-managed rules to prevent conflicts with user-created rules

## 4. Interface Requirements

### 4.1 User Interface

**4.1.1 Settings Page**
- Add Travel Mode row to Manage card
- Display Plane icon, title, subtitle, and ChevronRight
- Show toggle switch on the right when configured
- Row is clickable and opens configuration dialog
- Toggle click is handled separately (does not open dialog)

**4.1.2 Configuration Dialog**
- Modal dialog with title "Configure Travel Mode"
- Categories displayed grouped by CSP bucket (Income, Fixed Cost, Savings, Investment, Guilt-Free Spending, Ignored)
- Each category has a checkbox for selection
- Saving fund dropdown selector using SavingTargetSelector
- Save and Cancel buttons
- Loading state during save operation
- Error message display area

**4.1.3 Visual Feedback**
- Toast notification on successful save
- Toast notification on successful toggle
- Error toast on operation failure
- Loading spinner during async operations

### 4.2 API Interface

**4.2.1 getTravelModeConfig**
```typescript
function getTravelModeConfig(uid: string): Promise<TravelModeConfig | null>
```

**4.2.2 createOrUpdateTravelModeRule**
```typescript
function createOrUpdateTravelModeRule(
  uid: string,
  config: TravelModeConfig
): Promise<void>
```

**4.2.3 toggleTravelMode**
```typescript
function toggleTravelMode(uid: string, enabled: boolean): Promise<void>
```

**4.2.4 getDefaultTravelCategories**
```typescript
function getDefaultTravelCategories(): string[]
```

### 4.3 React Query Hooks

**4.3.1 useUserRules**
```typescript
function useUserRules(): UseQueryResult<Rule | null>
// Fetches user's Rule document from Firestore
// Components use helper functions to derive travel mode state
```

**4.3.2 useSaveTravelMode**
```typescript
function useSaveTravelMode(): UseMutationResult<void, Error, TravelModeConfig>
```

**4.3.3 useToggleTravelMode**
```typescript
function useToggleTravelMode(): UseMutationResult<void, Error, boolean>
```

## 5. Integration Requirements

### 5.1 Existing Rules System

**5.1.1** Travel mode shall use existing RuleTransformation interface without modifications.

**5.1.2** Travel mode rules shall be processed by existing transaction rule engine.

**5.1.3** Travel mode shall not interfere with other user-created rules.

**5.1.4** Travel mode rules shall follow same priority and execution order as other rules.

### 5.2 Existing Components

**5.2.1** Travel mode shall use existing SavingTargetSelector component for fund selection.

**5.2.2** Travel mode shall use existing Card, Button, Switch components for UI.

**5.2.3** Travel mode shall use existing toast notification system for feedback.

**5.2.4** Travel mode shall follow existing Settings page layout patterns.

### 5.3 Firestore Integration

**5.3.1** Travel mode shall read/write to existing rules collection.

**5.3.2** Travel mode shall use Firestore transactions for atomic updates.

**5.3.3** Travel mode shall validate user authentication before Firestore operations.

**5.3.4** Travel mode shall handle Firestore errors gracefully.

## 6. Constraints

### 6.1 Technical Constraints

**6.1.1** Must use React Query for all data fetching (per project guidelines).

**6.1.2** Must use TypeScript for all code.

**6.1.3** Must use Tailwind CSS v4 for styling.

**6.1.4** Must use Firebase SDK for Firestore operations.

**6.1.5** Must not modify existing RuleTransformation interface.

### 6.2 Business Constraints

**6.2.1** Travel mode is a user-level feature (not shared across users).

**6.2.2** Travel mode configuration is optional (users can choose not to use it).

**6.2.3** Travel mode must not break existing transaction processing.

**6.2.4** Travel mode must be reversible (can be disabled without data loss).

### 6.3 Design Constraints

**6.3.1** Must follow existing Settings page card-based layout.

**6.3.2** Must use existing icon library (lucide-react).

**6.3.3** Must follow existing modal dialog patterns.

**6.3.4** Must use existing form control components.

## 7. Assumptions

### 7.1 User Assumptions

**7.1.1** Users understand the concept of saving funds (SavingTarget).

**7.1.2** Users have at least one saving fund configured before using travel mode.

**7.1.3** Users understand CSP categories and their meanings.

**7.1.4** Users will configure travel mode before traveling, not during.

### 7.2 System Assumptions

**7.2.1** Existing rules system is functioning correctly.

**7.2.2** Transaction processing applies rules automatically.

**7.2.3** Firestore security rules allow authenticated users to read/write their own rules.

**7.2.4** SavingTarget documents exist and are accessible.

### 7.3 Data Assumptions

**7.3.1** CSPCategory enum values are stable and won't change frequently.

**7.3.2** CSPBucket.GuildFreeSpending mapping is accurate for travel categories.

**7.3.3** Rule document structure supports multiple transformations.

**7.3.4** Transaction documents have category field populated.

## 8. Dependencies

### 8.1 External Dependencies

- React Query (`@tanstack/react-query`) - v5.x
- Firebase SDK (`firebase`) - v10.x
- Lucide React (`lucide-react`) - v0.x
- React (`react`) - v19.x

### 8.2 Internal Dependencies

- `easy-csp-shared-types` package
  - Rule, RuleTransformation, RuleCondition types
  - CSPCategory, CSPBucket enums
  - SavingTarget type
  - CSP_CATEGORY_TO_BUCKET_MAPPING constant

### 8.3 Component Dependencies

- `SavingTargetSelector` component
- `Card`, `CardContent`, `CardHeader` components
- `Button`, `Switch` components
- Toast notification system
- Settings page layout

### 8.4 Service Dependencies

- Firestore service functions
- Authentication service (Firebase Auth)
- Rules service (to be created)

## 9. Success Criteria

### 9.1 Feature Completeness

- [ ] Travel Mode option appears in Settings page
- [ ] Configuration dialog allows category and fund selection
- [ ] Toggle switch enables/disables travel mode
- [ ] Rules are created and stored in Firestore
- [ ] Transactions are automatically marked to selected fund
- [ ] Configuration persists across sessions

### 9.2 Quality Criteria

- [ ] All unit tests pass
- [ ] All property-based tests pass
- [ ] All integration tests pass
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Code follows project patterns

### 9.3 User Experience Criteria

- [ ] Configuration takes less than 1 minute
- [ ] Toggle response is immediate (< 1 second)
- [ ] Error messages are clear and helpful
- [ ] UI is consistent with existing Settings page
- [ ] Feature is discoverable without documentation

## 10. Out of Scope

### 10.1 Not Included in This Release

- Automatic travel detection based on location
- Travel mode scheduling (start/end dates)
- Multiple travel mode configurations
- Travel mode analytics or reporting
- Travel mode budget tracking
- Integration with calendar apps
- Travel mode notifications
- Undo/redo for travel mode changes
- Travel mode history or audit log

### 10.2 Future Enhancements

- Date range selection for automatic enable/disable
- Travel mode templates (e.g., "International Travel", "Weekend Trip")
- Travel mode spending reports
- Integration with transaction splitting
- Travel mode recommendations based on past behavior
