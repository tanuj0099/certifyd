## 2026-05-09 - [DynamicIslandNav React.memo Optimization]
**Learning:** `DynamicIslandNav` was deeply coupled to the `App.jsx` render loop, causing redundant re-renders of the navigation and Framer Motion layout algorithms every time `App.jsx` state changed (e.g., when the `currentPage` or auth modal toggled).
**Action:** Wrapped `DynamicIslandNav` with `React.memo` to skip re-renders when route props or user profile haven't actually changed, improving overall page paint and scroll performance by eliminating unnecessary layout calculations for the heavy sticky header.
