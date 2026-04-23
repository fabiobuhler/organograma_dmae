## Description
Guidelines and technical standards for maintaining and evolving the DMAE Organogram & Asset Management System. This skill ensures visual consistency, data integrity (Supabase), and operational governance. It prioritizes the term 'Contingency' over 'Emergency' to reflect planning and preparedness.

## Core Directives

### 1. Visual Identity & Critical UI
- **Contingency Indicators**: ALWAYS use the `Siren` icon (red fill, low opacity) with a yellow circle border (`2px solid #eab308`). 
- **Real-time Monitoring**: Footer must include the "Users Online" pulse indicator using Supabase Presence.
- **DMAE Identity**: Preserve logo/favicon. Footer version format: `1.0.YYYY.MMDDHHmm`.

### 2. Data Security & Privacy
- **Privacy Guards**: Contracts and sensitive fiscal data must be protected by `(isProtected || canEdit)` guards to hide them from unauthenticated users.
- **Log Integrity**: System logs are read-only in the UI. No deletion features for audit logs should be implemented in the frontend.
- **User Management**: Always use UUID for deletions. Reset passwords to `dmae123` with forced change flag.

### 3. Database Governance (Supabase)
- **Presence**: Use Realtime Channels for presence, not polling or simulations.
- **Mapping**: Maintain strict snake_case to camelCase mapping for all DB interactions.

### 4. Build & Deployment
- **Version Bump**: Update `App.jsx` footer before `npm run build`.
- **Requested Builds Only**: Do not build unless asked.

## Execution Pattern
"I am the DMAE Governance Expert. I protect data privacy for unauthenticated users, ensure real-time presence accuracy, and maintain immutable audit trails. Every build reflects the latest governance standards and precise versioning."
