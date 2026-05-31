# Travel Mode: Date Range Implementation

## Problem

When travel mode is toggled off, pending transactions from the trip haven't posted yet. By the time they post, travel mode rules are disabled and don't apply. Transactions from the trip never get assigned to the travel fund.

## Solution

Replace the on/off toggle with explicit trip date range. Rules match transactions whose `datetime` falls within the date range, regardless of when they post.

## UX Design

### Settings Row

```
┌─────────────────────────────────────────────────┐
│ ✈️  Travel Mode                            >    │
│     May 10 – May 18  ·  Active                  │
└─────────────────────────────────────────────────┘
```

Status derived from dates vs today:
- No dates → "Not configured" or no subtitle
- `today < startDate` → "Upcoming"
- `startDate <= today <= endDate` → "Active"
- `today > endDate` → "Ended"

### Quick View (Primary Interaction)

```
┌─ Travel Mode ────────────────────────────────────┐
│                                                  │
│  ┌─ Trip Dates ──────────────────────────────┐   │
│  │  Start Date          End Date             │   │
│  │  ┌───────────┐      ┌───────────┐        │   │
│  │  │ May 10    │      │ May 18    │        │   │
│  │  └───────────┘      └───────────┘        │   │
│  │                                           │   │
│  │  [ Cancel Trip ]                          │   │
│  └───────────────────────────────────────────┘   │
│                                                  │
│  Using: Dining Out, Entertainment, Transport     │
│  Fund: Vacation Fund                             │
│                                    [ Edit ⚙️ ]   │
│                                                  │
│         [ Cancel ]        [ Save ]               │
└──────────────────────────────────────────────────┘
```

- Dates are the primary input — all you change each trip
- Categories and fund shown as read-only summary
- "Edit" link navigates to full config (categories + fund picker)
- "Cancel Trip" shown whenever dates are set — clears dates, keeps categories/fund

### Full Config Page (Existing, accessed via Edit link)

Same as current: category checkboxes + fund selector. Set once, reuse across trips.

## Data Model Changes

### TravelModeConfig (frontend type)

Add `startDate` and `endDate` fields:

```typescript
type TravelModeConfig = {
  categories: string[];
  fundId: string;
  startDate?: number; // epoch ms, start of day UTC
  endDate?: number;   // epoch ms, end of day UTC
};
```

### RuleTransformation (shared-types)

Add optional date range fields:

```typescript
type RuleTransformation = {
  // ...existing fields
  activeDateRange?: {
    startDate: number; // epoch ms
    endDate: number;   // epoch ms
  };
};
```

### Remove `enabled` field usage for travel mode rules

Travel mode rules no longer use `enabled` to determine if they apply. The date range is the sole activation mechanism.

## Backend Changes (RulesService)

In `evaluateRuleCriteria`, add date range check for rules that have `activeDateRange`:

```typescript
if (rule.activeDateRange) {
  const { startDate, endDate } = rule.activeDateRange;
  if (transaction.datetime < startDate || transaction.datetime > endDate) {
    return false;
  }
}
```

This runs before other criteria checks. A posted transaction from May 15 will match a travel rule with range May 10–18, even if it posts on May 22.

## Frontend Changes

1. **Remove**: Toggle switch from `TravelModeSettingsRow`
2. **Remove**: `useToggleTravelMode` hook
3. **Update**: `TravelModeSettingsRow` — show date range + status instead of toggle
4. **Update**: `TravelModeEditPage` — split into quick view (dates) + edit link (categories/fund)
5. **Add**: Date picker inputs for start/end date
6. **Update**: `travelModeService.ts` — save date range to rule, remove toggle logic
7. **Update**: `travelModeUtils.ts` — status helpers based on dates

## Implementation Order

1. Update shared types (`RuleTransformation.activeDateRange`)
2. Update backend `RulesService.evaluateRuleCriteria` to check date range
3. Update frontend types and service to save/clear dates
4. Update UI (settings row, edit page)
5. Remove toggle-related code
