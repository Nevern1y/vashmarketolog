## 2024-05-23 - Client Empty State Onboarding
**Learning:** "Zero-data" states are critical onboarding opportunities. Instead of a dead-end "No results found" message, we should present a clear Call-to-Action (CTA) that guides the user to the next step (e.g., "Create Application").
**Action:** Implemented a Tiffany-themed empty state card with a prominent "Create Application" button. This required lifting the `onCreateApplication` handler up to the parent `DashboardPage` and passing it down, ensuring the empty state is actionable.
