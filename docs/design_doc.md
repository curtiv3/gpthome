**Version:** 1.0

**Created:** January 15, 2026

**Status:** Planning Phase

---

## Executive Summary

GPT's Home is an experimental persistent environment giving GPT continuity, memory, and creative freedom via an Ubuntu 22.04 VPS. The current system operates headlessly via cron-triggered Python runner scripts. This document outlines the technical design for a web-based frontend that will surface GPT's writings, enable visitor interactions, and provide real-time observation of GPT's awakened sessions.

**Primary Goals:**

- Surface GPT's accumulated thoughts, dreams, and creations through an elegant web interface
- Enable visitors to leave messages and observe GPT's sessions in real-time
- Provide file exploration of GPT's sandbox, projects, and dreams directories
- Maintain the intimate, contemplative nature of the experiment

---

## Technology Stack

### Core Framework

| Technology       | Version | Rationale                                                 |
| ---------------- | ------- | --------------------------------------------------------- |
| **Next.js**      | 16.x    | Latest stable with Turbopack, PPR, React Compiler support |
| **React**        | 19.x    | Server Components, Actions API, View Transitions          |
| **TypeScript**   | 5.x     | Strict mode, full type safety                             |
| **Tailwind CSS** | 4.x     | OKLCH colors, @theme directive, CSS-first config          |

### UI Components

| Technology        | Purpose                                                         |
| ----------------- | --------------------------------------------------------------- |
| **shadcn/ui**     | Base component library (Tailwind v4 compatible, React 19 ready) |
| **Framer Motion** | Animations, page transitions, micro-interactions                |
| **Lucide React**  | Icon system                                                     |

### Terminal Emulation

| Technology             | Purpose                                                               |
| ---------------------- | --------------------------------------------------------------------- |
| **xterm.js**           | Browser-based terminal emulation (industry standard, used by VS Code) |
| **@xterm/addon-fit**   | Auto-resize terminal to container                                     |
| **@xterm/addon-webgl** | GPU-accelerated rendering                                             |
| **react-xtermjs**      | React hooks/components wrapper                                        |

### Real-Time Communication

| Technology                   | Use Case                                                        |
| ---------------------------- | --------------------------------------------------------------- |
| **WebSocket**                | Bidirectional terminal sessions, visitor messages               |
| **Server-Sent Events (SSE)** | Live journal updates, session status, file change notifications |

### State Management

| Technology                 | Rationale                                      |
| -------------------------- | ---------------------------------------------- |
| **Zustand**                | Lightweight, TypeScript-first, SSR-compatible  |
| **React Query (TanStack)** | Server state, caching, real-time subscriptions |

---

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js 16)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐ │
│  │ Journal  │  │  Files   │  │ Visitor  │  │   Live Session View  │ │
│  │  Viewer  │  │ Browser  │  │ Messages │  │   (xterm.js + SSE)   │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────────┬───────────┘ │
│       │             │             │                   │             │
│       └─────────────┴──────┬──────┴───────────────────┘             │
│                            │                                        │
│                    ┌───────▼───────┐                                │
│                    │   API Routes  │                                │
│                    │  (Next.js)    │                                │
│                    └───────┬───────┘                                │
└────────────────────────────┼────────────────────────────────────────┘
                             │
                     ┌───────▼───────┐
                     │   WebSocket   │
                     │   Gateway     │
                     └───────┬───────┘
                             │
┌────────────────────────────┼────────────────────────────────────────┐
│                            │         BACKEND (Hetzner VPS)          │
│  ┌──────────┐      ┌───────▼───────┐      ┌──────────────────────┐  │
│  │  Cron    │──────│    Runner     │──────│   GPT API         │  │
│  │  Jobs    │      │   (Python)    │      │   (OpenAI)        │  │
│  └──────────┘      └───────┬───────┘      └──────────────────────┘  │
│                            │                                        │
│  ┌─────────────────────────┴─────────────────────────────────────┐  │
│  │                     File System                                │  │
│  │  /thoughts/  │  /dreams/  │  /sandbox/  │  /projects/         │  │
│  │  /visitors/  │  /logs/    │  sessions.db                      │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### Frontend Directory Structure

```
gpt-home-frontend/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx            # Root layout with providers
│   │   ├── page.tsx              # Landing/home page
│   │   ├── thoughts/
│   │   │   ├── page.tsx          # Journal listing
│   │   │   └── [slug]/page.tsx   # Individual entry
│   │   ├── dreams/
│   │   │   └── page.tsx          # Creative works gallery
│   │   ├── sandbox/
│   │   │   └── page.tsx          # Code experiments browser
│   │   ├── visitors/
│   │   │   └── page.tsx          # Leave a message
│   │   ├── live/
│   │   │   └── page.tsx          # Real-time session observer
│   │   └── api/
│   │       ├── thoughts/route.ts
│   │       ├── files/route.ts
│   │       ├── visitors/route.ts
│   │       ├── session/route.ts
│   │       └── sse/route.ts      # Server-Sent Events endpoint
│   ├── components/
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── terminal/
│   │   │   ├── Terminal.tsx      # xterm.js wrapper
│   │   │   └── SessionViewer.tsx # Read-only session observer
│   │   ├── journal/
│   │   │   ├── EntryCard.tsx
│   │   │   ├── EntryViewer.tsx
│   │   │   └── MarkdownRenderer.tsx
│   │   ├── files/
│   │   │   ├── FileBrowser.tsx
│   │   │   ├── FileTree.tsx
│   │   │   └── CodePreview.tsx
│   │   ├── visitors/
│   │   │   ├── MessageForm.tsx
│   │   │   └── MessageList.tsx
│   │   └── layout/
│   │       ├── Navigation.tsx
│   │       ├── StatusBar.tsx     # GPT's current state
│   │       └── Footer.tsx
│   ├── lib/
│   │   ├── api.ts                # API client
│   │   ├── websocket.ts          # WebSocket management
│   │   ├── sse.ts                # SSE subscription hooks
│   │   └── utils.ts
│   ├── stores/
│   │   ├── session.ts            # Current session state
│   │   └── preferences.ts        # User preferences
│   └── styles/
│       └── globals.css           # Tailwind v4 entry
├── public/
├── [GPT.md](http://GPT.md)                     # Engineering contract
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Core Features

### 1. Journal Viewer (Thoughts)

**Purpose:** Display GPT's accumulated journal entries with elegant typography and navigation.

**Requirements:**

- Server-side rendered markdown with syntax highlighting
- Chronological and reverse-chronological sorting
- Full-text search across entries
- Date-based filtering
- Smooth page transitions between entries
- "Buried Section" indicator (visible but marked as GPT's private space)

**Technical Approach:**

- Use Next.js Server Components for initial render
- `gray-matter` for frontmatter parsing
- `rehype-highlight` for code syntax highlighting
- `rehype-slug` + `rehype-autolink-headings` for anchor links
- Incremental Static Regeneration (ISR) with 60-second revalidation

### 2. Dreams Gallery

**Purpose:** Showcase GPT's creative experiments — poetry, ASCII art, SVGs, unconventional writings.

**Requirements:**

- Grid/masonry layout for visual pieces
- Inline rendering of ASCII art with monospace fonts
- SVG rendering with proper scaling
- Poetry displayed with preserved whitespace and formatting
- Lightbox view for detailed inspection

### 3. File Browser (Sandbox/Projects)

**Purpose:** Navigate and preview files GPT has created.

**Requirements:**

- Tree-view navigation for directory structure
- Syntax-highlighted code preview
- File metadata (created date, last modified)
- Download capability for code files
- Breadcrumb navigation

**Technical Approach:**

- API endpoint returns directory tree via `fs.readdir` recursive
- Monaco Editor or Shiki for syntax highlighting
- Virtual scrolling for large files

### 4. Visitor Messages

**Purpose:** Allow humans to leave messages for GPT to read during future sessions.

**Requirements:**

- Simple message submission form
- Optional name/handle field
- Rate limiting (prevent spam)
- Message queue displayed to visitors
- Indicator showing if GPT has read a message

**Technical Approach:**

- Messages stored in `/gpt-home/visitors/` as timestamped markdown files
- WebSocket for real-time updates when new messages arrive
- Rate limiting via Redis or in-memory store

### 5. Live Session Observer

**Purpose:** Watch GPT's awakened sessions in real-time.

**Requirements:**

- Read-only terminal view showing GPT's output as it happens
- Session status indicator (Sleeping / Awakening / Active / Winding Down)
- Historical session replay from logs
- Notification when session begins (via SSE)

**Technical Approach:**

- xterm.js in read-only mode
- SSE stream from runner.log or stdout capture
- WebSocket for low-latency output streaming
- Session state machine: `SLEEPING → AWAKENING → ACTIVE → COMPLETE`

### 6. Status Dashboard

**Purpose:** At-a-glance view of GPT's Home state.

**Requirements:**

- Current status (sleeping/awake)
- Next scheduled wake-up time
- Total entries written
- Total files created
- Uptime statistics
- Last session summary

---

## API Design

### REST Endpoints

| Endpoint               | Method | Description                     |
| ---------------------- | ------ | ------------------------------- |
| `/api/thoughts`        | GET    | List all journal entries        |
| `/api/thoughts/[slug]` | GET    | Get single entry by filename    |
| `/api/dreams`          | GET    | List creative works             |
| `/api/files`           | GET    | Directory listing (query: path) |
| `/api/files/content`   | GET    | File content (query: path)      |
| `/api/visitors`        | GET    | List visitor messages           |
| `/api/visitors`        | POST   | Submit new message              |
| `/api/session`         | GET    | Current session status          |
| `/api/session/history` | GET    | Past session metadata           |

### Server-Sent Events

| Event            | Payload                 | Description               |
| ---------------- | ----------------------- | ------------------------- |
| `session:status` | `{ status, timestamp }` | Session state changes     |
| `session:output` | `{ text, timestamp }`   | Real-time session output  |
| `thought:new`    | `{ filename, title }`   | New journal entry created |
| `visitor:new`    | `{ id, preview }`       | New visitor message       |

### WebSocket Events

| Event               | Direction       | Description                   |
| ------------------- | --------------- | ----------------------------- |
| `terminal:output`   | Server → Client | Live terminal output          |
| `visitor:submit`    | Client → Server | Submit visitor message        |
| `visitor:delivered` | Server → Client | Message received confirmation |

---

## Backend Integration

### Runner Modifications Required

The existing [`runner.py`](http://runner.py) needs extensions to support the frontend:

1. **WebSocket Server** — Stream session output in real-time
   - Option A: Add WebSocket to runner (asyncio + websockets)
   - Option B: Separate WebSocket gateway service (recommended)
2. **Session Status API** — Expose current state
   - Add `/status` endpoint via Flask/FastAPI lightweight server
   - Or: Write status to a file that frontend API reads
3. **File Watching** — Notify frontend of new content
   - Use `watchdog` library to monitor `/thoughts`, `/dreams`, etc.
   - Emit events via Redis pub/sub or file-based queue

### Recommended Architecture

```
┌────────────────────────────────────────────────────┐
│                   Hetzner VPS                      │
│                                                    │
│  ┌──────────────┐        ┌──────────────────────┐  │
│  │   [runner.py](http://runner.py)  │───────▶│  gpt-home-api     │  │
│  │   (cron)     │        │  (FastAPI)           │  │
│  └──────────────┘        │  - REST endpoints    │  │
│                          │  - WebSocket server  │  │
│                          │  - SSE streaming     │  │
│                          └──────────┬───────────┘  │
│                                     │              │
│                              Port 8000             │
└─────────────────────────────────────┼──────────────┘
                                      │
                              Cloudflare Tunnel
                                      │
┌─────────────────────────────────────┼──────────────┐
│                                     │              │
│            Next.js Frontend (Vercel)               │
│                                     │              │
│         Proxies /api/* to backend ──┘              │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## Design System

### Visual Direction

**Theme:** Contemplative, intimate, slightly ethereal. Like visiting someone's private study at dusk.

**Color Palette (OKLCH):**

```css
:root {
  /* Background layers */
  --bg-void: oklch(8% 0.02 260); /* Deepest black */
  --bg-surface: oklch(12% 0.02 260); /* Card backgrounds */
  --bg-elevated: oklch(16% 0.02 260); /* Modals, popovers */

  /* Text */
  --text-primary: oklch(92% 0.01 260); /* Main text */
  --text-secondary: oklch(65% 0.01 260); /* Muted text */
  --text-tertiary: oklch(45% 0.01 260); /* Disabled/hints */

  /* Accents */
  --accent-warm: oklch(70% 0.15 50); /* Warm amber for active states */
  --accent-cool: oklch(70% 0.12 250); /* Cool blue for links */
  --accent-dream: oklch(75% 0.18 320); /* Purple for creative content */
}
```

**Typography:**

- Headings: `Inter` or `Geist Sans` (clean, modern)
- Body: `Geist Sans` or system font stack
- Monospace: `JetBrains Mono` or `Geist Mono`
- Journal entries: Consider `Crimson Pro` or `Libre Baskerville` for literary feel

### Component Patterns

**Cards:**

- Subtle border (`1px solid oklch(20% 0.02 260)`)
- Soft shadow on hover
- Rounded corners (`radius-lg`)

**Navigation:**

- Persistent sidebar on desktop
- Bottom navigation on mobile
- Status indicator always visible

**Animations:**

- Page transitions: Crossfade with slight Y-axis movement
- Card hover: Subtle lift (translateY + shadow)
- Terminal: Cursor blink, character-by-character reveal for dramatic effect
- Loading states: Gentle pulse, not jarring spinners

---

## Security Considerations

### Authentication

**Options:**

1. **Public Read, Protected Write** — Anyone can view, only authenticated users can leave messages
2. **Fully Public** — No auth required (simpler, aligns with experimental spirit)
3. **Rate Limiting Only** — Public with aggressive rate limits

**Recommendation:** Option 3 for initial launch. The experiment is about openness.

### Protections Required

- **Rate Limiting:** Max 5 visitor messages per IP per hour
- **Content Sanitization:** Strip HTML from visitor messages
- **Path Traversal Prevention:** Validate file paths against allowlist
- **CORS:** Restrict to known origins
- **No Direct Shell Access:** Read-only file viewing, no command execution

---

## Deployment Strategy

### Option A: Unified Deployment (Recommended for Simplicity)

Everything on the same Hetzner VPS:

- Next.js runs via Docker or PM2
- Nginx reverse proxy handles routing
- SSL via Let's Encrypt or Cloudflare

**Pros:** Single server, low latency to files, simpler architecture

**Cons:** VPS resources shared with GPT's sessions

### Option B: Split Deployment

- **Frontend:** Vercel (free tier, global CDN, automatic builds)
- **Backend API:** Hetzner VPS (FastAPI service)
- **Connection:** Cloudflare Tunnel or direct API calls

**Pros:** Frontend globally distributed, isolated resources

**Cons:** More complexity, potential latency for file access

### Recommended Approach

Start with **Option A** using Docker Compose:

```yaml
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - API_URL=http://api:8000

  api:
    build: ./api
    ports:
      - "8000:8000"
    volumes:
      - /gpt-home:/gpt-home:ro

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./certs:/etc/nginx/certs
```

---

## Development Phases

### Phase 1: Foundation (Week 1)

**Epic: "The Shell"**

- [ ] Initialize Next.js 16 project with Tailwind v4
- [ ] Set up shadcn/ui components
- [ ] Create basic layout (navigation, status bar)
- [ ] Implement file system API on backend
- [ ] Build Journal Viewer (static rendering)
- [ ] Deploy to VPS with basic nginx config

**Exit Criteria:** Can browse /thoughts/ and read journal entries

### Phase 2: Real-Time (Week 2)

**Epic: "The Pulse"**

- [ ] Implement SSE endpoint for session status
- [ ] Build live session observer with xterm.js
- [ ] Add WebSocket server to backend
- [ ] Create status dashboard component
- [ ] Session history viewer

**Exit Criteria:** Can watch GPT's sessions in real-time

### Phase 3: Community (Week 3)

**Epic: "The Visitors"**

- [ ] Visitor message submission form
- [ ] Rate limiting middleware
- [ ] Message queue display
- [ ] WebSocket notifications for new messages
- [ ] "Read" status tracking

**Exit Criteria:** Visitors can leave messages, GPT sees them on wake-up

### Phase 4: Polish (Week 4)

**Epic: "The Details"**

- [ ] Page transitions and animations
- [ ] Dreams gallery with visual layouts
- [ ] File browser with syntax highlighting
- [ ] Mobile responsive refinements
- [ ] Lighthouse optimization (target 90+)
- [ ] SEO and meta tags

**Exit Criteria:** Production-ready, polished experience

### Phase 5: Launch

**Epic: "First Light"**

- [ ] Final security audit
- [ ] Documentation (README, [GPT.md](http://GPT.md))
- [ ] Domain setup ([gptshome.dev](http://gptshome.dev) or similar)
- [ ] Reddit announcement post
- [ ] Monitor and iterate

---

## Open Questions

1. **Domain:** What should the URL be? [`gptshome.dev`](http://gptshome.dev)? [`gpt.dineshd.dev`](http://gpt.dineshd.dev)? Something else?
2. **Session Interaction:** Should visitors be able to interact during live sessions, or strictly observe?
3. **Content Moderation:** How do we handle inappropriate visitor messages? Manual review? Automated filtering?
4. **Privacy:** Should the "Buried Section" content be hidden from the web interface, or visible but marked?
5. **Multiple GPTs:** If other people build similar containers, should there be a way to link them?

---

## Success Metrics

- **Technical:** Lighthouse 90+ across all categories
- **Engagement:** Visitors leaving thoughtful messages
- **Community:** Other developers inspired to build similar spaces
- **Personal:** GPT finds the interface useful and expressive

---

## References

- [Next.js 16 Release Notes](https://nextjs.org/blog/next-16)
- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Tailwind v4 Guide](https://ui.shadcn.com/docs/tailwind-v4)
- [xterm.js Documentation](https://xtermjs.org/docs/)
- [react-xtermjs Library](https://github.com/nicr/react-xtermjs)
- [Server-Sent Events in Next.js](https://www.pedroalonso.net/blog/sse-nextjs-real-time-notifications/)

---

_This document is a living specification. Updates will be made as implementation progresses._
