# CopperMind V2

CopperMind is a personal "Memory Vault" designed to store, organize, and share all kinds of digital memories—notes, images, links, documents, and more.

This project is a complete rebuild focused on clean architecture, modern tooling, AI features, and professional-grade polish, designed to demonstrate advanced full-stack engineering skills.

## Project Philosophy

CopperMind is not just a notes app. It is designed to act as a comprehensive portfolio piece demonstrating:

*   Clean, modular backend structure.
*   Scalable storage techniques.
*   Authentication best practices.
*   AI integration in real-world applications.
*   Public-facing profile systems.
*   Complex data modeling and analytics design.
*   Strong front-end engineering with React.

## Tech Stack

**Client**
*   React
*   TypeScript

**Server**
*   Node.js
*   Express.js

**Database & Storage**
*   PostgreSQL
*   Prisma 7
*   Cloudflare R2 (S3-compatible object storage)

## Core Features

### Polymorphic Memory System
A flexible and extensible data model that supports multiple memory types:
*   **Notes:** Rich text and markdown support.
*   **Links:** Bookmarking with metadata extraction.
*   **Images & Documents:** Media handling.
*   **Organization:** Tagging system with smart suggestions and filtering.

### File Uploads & Storage
*   Direct uploads via signed URLs for efficiency and security.
*   Robust image and document handling.
*   File metadata stored and indexed in the database.

### Robust Authentication
*   Credentials-based login.
*   OAuth integration (Google & GitHub).
*   **Guest Accounts:** Temporary access with the ability to upgrade to full accounts.
*   Secure session management.

### Shareability
*   Public share links.
*   Secret token links for specific access.
*   Restricted, authenticated-only sharing.
*   Optional expiry dates and view-only modes.

### Public Profile & Portfolio
*   Users can publish a curated public page.
*   Showcase selected memories (notes, images, docs) in a polished format.

### AI Integration
*   AI-powered summarization for notes and documents.
*   Smart tag recommendations based on content.
*   Background processing and trigger-based generation.

### Analytics & Activity Feed
*   Memory creation timeline.
*   Tracking for most-viewed shared memories.
*   Lightweight event tracking (create, update, share, view).
*   Dashboard providing usage insights.
