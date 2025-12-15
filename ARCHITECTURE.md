# CareConnect - Architecture Documentation

## 🏗️ System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Next.js Frontend (React Components)               │    │
│  │  - Pages (App Router)                              │    │
│  │  - Components (UI)                                 │    │
│  │  - Hooks (Speech, Audio)                           │    │
│  │  - Browser APIs (Speech, Notifications)            │    │
│  └────────────────────────────────────────────────────┘    │
│                          ↕                                   │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Next.js API Routes (Serverless Functions)         │    │
│  │  - /api/auth                                       │    │
│  │  - /api/checkin                                    │    │
│  │  - /api/medications                                │    │
│  │  - /api/messages                                   │    │
│  │  - /api/summary                                    │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                      Supabase                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  PostgreSQL  │  │     Auth     │  │   Storage    │     │
│  │  (Database)  │  │   (JWT)      │  │  (Audio)     │     │
│  │  + RLS       │  │              │  │   + RLS      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
care-connect/
│
├── app/                          # Next.js 14 App Router
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Landing page (redirects)
│   ├── globals.css              # Global styles
│   │
│   ├── auth/                    # Authentication
│   │   ├── signin/
│   │   │   └── page.tsx         # Sign in page
│   │   └── signup/
│   │       └── page.tsx         # Sign up page
│   │
│   ├── dashboard/               # Main dashboard
│   │   ├── layout.tsx           # Dashboard layout with navbar
│   │   └── page.tsx             # Dashboard home
│   │
│   ├── checkin/                 # Voice check-in
│   │   ├── layout.tsx
│   │   └── page.tsx             # Voice check-in interface
│   │
│   ├── medications/             # Medication management
│   │   ├── layout.tsx
│   │   └── page.tsx             # Medications CRUD
│   │
│   ├── messages/                # Voice messaging
│   │   ├── layout.tsx
│   │   └── page.tsx             # Two-way messages
│   │
│   └── api/                     # API Routes
│       ├── auth/
│       │   └── signup/
│       │       └── route.ts     # POST signup
│       ├── checkin/
│       │   └── route.ts         # GET/POST check-ins
│       ├── medications/
│       │   ├── route.ts         # CRUD medications
│       │   └── log/
│       │       └── route.ts     # POST medication logs
│       ├── messages/
│       │   └── route.ts         # GET/POST/PATCH messages
│       ├── summary/
│       │   └── route.ts         # GET/POST summaries
│       └── caregiver/
│           └── links/
│               └── route.ts     # GET/POST caregiver links
│
├── components/                   # Reusable UI Components
│   ├── Button.tsx               # Styled button
│   ├── Card.tsx                 # Card container
│   ├── Input.tsx                # Form input
│   ├── LoadingSpinner.tsx       # Loading state
│   ├── Navbar.tsx               # Navigation bar
│   └── VoiceRecorder.tsx        # Audio recorder
│
├── hooks/                        # Custom React Hooks
│   ├── useSpeechRecognition.ts  # Speech-to-text
│   ├── useSpeechSynthesis.ts    # Text-to-speech
│   └── useAudioRecorder.ts      # Audio recording
│
├── lib/                          # Core Libraries
│   ├── supabase/
│   │   ├── client.ts            # Browser Supabase client
│   │   └── server.ts            # Server Supabase client
│   ├── types.ts                 # TypeScript interfaces
│   └── constants.ts             # App constants
│
├── utils/                        # Utility Functions
│   ├── healthAnalysis.ts        # Keyword detection & mood
│   └── notifications.ts         # Browser notifications
│
├── supabase/                     # Database
│   └── schema.sql               # Complete DB schema + RLS
│
├── public/                       # Static Assets
│   └── manifest.json            # PWA manifest
│
├── middleware.ts                 # Auth middleware
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── tailwind.config.ts            # Tailwind config
├── next.config.js                # Next.js config
├── README.md                     # Project documentation
├── SETUP.md                      # Setup guide
├── FEATURES.md                   # Feature documentation
└── ARCHITECTURE.md               # This file
```

---

## 🔄 Data Flow

### 1. Authentication Flow

```
User → Sign Up Form → /api/auth/signup
                           ↓
                    Create Auth User (Supabase)
                           ↓
                    Create User Profile (DB)
                           ↓
                     Return Success
                           ↓
User → Sign In Form → Supabase Auth
                           ↓
                     Receive JWT Token
                           ↓
                  Store in HTTP-only Cookie
                           ↓
                   Redirect to Dashboard
```

### 2. Voice Check-In Flow

```
User → Click "Start Check-In"
          ↓
    App speaks greeting (TTS)
          ↓
    Start listening (Speech Recognition)
          ↓
    User speaks → Transcript captured
          ↓
    Click "Stop & Submit"
          ↓
    POST /api/checkin
          ↓
    Analyze keywords & mood (utils/healthAnalysis)
          ↓
    Save to health_checkins table
          ↓
    POST /api/summary (generate daily summary)
          ↓
    Upsert to daily_summaries table
          ↓
    Show success message
          ↓
    Redirect to Dashboard
```

### 3. Medication Flow

```
User → Add Medication Form
          ↓
    POST /api/medications
          ↓
    Insert into medications table
          ↓
    Browser checks time every minute
          ↓
    Match medication.time === current time?
          ↓ (Yes)
    Show browser notification
          ↓
User → Click "Taken"
          ↓
    POST /api/medications/log
          ↓
    Insert log into medication_logs
          ↓
    Decrement total_stock by 1
          ↓
    Check if stock <= threshold?
          ↓ (Yes)
    Insert into stock_alerts
          ↓
    Show alert on dashboard
```

### 4. Voice Messaging Flow

```
Caregiver → Record Message
              ↓
    MediaRecorder captures audio
              ↓
    Audio Blob created
              ↓
    POST /api/messages (FormData)
              ↓
    Upload to Supabase Storage (voice-messages bucket)
              ↓
    Get public URL
              ↓
    Insert into voice_messages table
              ↓
    Elderly User sees new message
              ↓
    User clicks play
              ↓
    PATCH /api/messages (mark as read)
              ↓
    Update is_read = true
```

---

## 🗄️ Database Schema

### Tables

**1. users**
```sql
- id (UUID, PK, FK to auth.users)
- email (TEXT, UNIQUE)
- role (TEXT: 'elderly_user' | 'caregiver')
- full_name (TEXT)
- created_at, updated_at (TIMESTAMP)
```

**2. caregiver_links**
```sql
- id (UUID, PK)
- caregiver_id (UUID, FK to users)
- elderly_user_id (UUID, FK to users)
- created_at (TIMESTAMP)
```

**3. health_checkins**
```sql
- id (UUID, PK)
- user_id (UUID, FK to users)
- transcript (TEXT)
- detected_keywords (TEXT[])
- mood (TEXT)
- created_at (TIMESTAMP)
```

**4. medications**
```sql
- id (UUID, PK)
- user_id (UUID, FK to users)
- name, dosage, time (TEXT)
- total_stock, low_stock_threshold (INT)
- is_active (BOOLEAN)
- created_at, updated_at (TIMESTAMP)
```

**5. medication_logs**
```sql
- id (UUID, PK)
- medication_id (UUID, FK to medications)
- user_id (UUID, FK to users)
- status (TEXT: 'taken' | 'later' | 'skipped')
- scheduled_time, logged_at (TIMESTAMP)
```

**6. voice_messages**
```sql
- id (UUID, PK)
- sender_id (UUID, FK to users)
- recipient_id (UUID, FK to users)
- audio_url (TEXT)
- duration_seconds (INT)
- is_read (BOOLEAN)
- created_at (TIMESTAMP)
```

**7. stock_alerts**
```sql
- id (UUID, PK)
- medication_id (UUID, FK to medications)
- user_id (UUID, FK to users)
- message (TEXT)
- is_resolved (BOOLEAN)
- created_at (TIMESTAMP)
```

**8. daily_summaries**
```sql
- id (UUID, PK)
- user_id (UUID, FK to users)
- date (DATE, UNIQUE with user_id)
- mood_summary (TEXT)
- symptoms (TEXT[])
- medication_adherence_rate (DECIMAL)
- total_checkins (INT)
- created_at (TIMESTAMP)
```

### Relationships

```
users (1) ←→ (N) caregiver_links
users (1) ←→ (N) health_checkins
users (1) ←→ (N) medications
users (1) ←→ (N) medication_logs
users (1) ←→ (N) voice_messages (as sender)
users (1) ←→ (N) voice_messages (as recipient)
users (1) ←→ (N) stock_alerts
users (1) ←→ (N) daily_summaries

medications (1) ←→ (N) medication_logs
medications (1) ←→ (N) stock_alerts
```

---

## 🔒 Security Architecture

### Row Level Security (RLS)

**Principle:** Data isolation at database level

**Policy Pattern:**
```sql
-- Users can access their own data
auth.uid() = user_id

-- Caregivers can access linked users' data
EXISTS (
  SELECT 1 FROM caregiver_links
  WHERE caregiver_id = auth.uid()
  AND elderly_user_id = <table>.user_id
)
```

**Applied to ALL tables:**
- ✅ SELECT policies (read)
- ✅ INSERT policies (create)
- ✅ UPDATE policies (modify)
- ✅ DELETE policies (remove)

**Storage RLS:**
```sql
-- Users can upload to their own folder
bucket_id = 'voice-messages'
AND auth.uid()::text = (foldername(name))[1]

-- Users can access files they sent or received
EXISTS (
  SELECT 1 FROM voice_messages
  WHERE audio_url LIKE '%' || name || '%'
  AND (sender_id = auth.uid() OR recipient_id = auth.uid())
)
```

### Authentication Layers

**1. Browser → API:** JWT token in cookie
**2. API → Database:** User context in RLS
**3. Storage:** Signed URLs with expiration

---

## 🎨 Frontend Architecture

### Component Hierarchy

```
App
├── RootLayout
│   └── AuthPages (signin, signup)
│
└── DashboardLayout
    ├── Navbar
    └── Pages
        ├── Dashboard
        │   ├── Card (Summary)
        │   ├── Card (Medications)
        │   └── Card (Alerts)
        │
        ├── CheckIn
        │   ├── Card
        │   └── VoiceInterface
        │       ├── useSpeechRecognition
        │       └── useSpeechSynthesis
        │
        ├── Medications
        │   ├── Card (Add Form)
        │   └── Card[] (Medication List)
        │
        └── Messages
            ├── Card (Voice Recorder)
            │   └── useAudioRecorder
            └── Card (Message List)
```

### State Management

**Approach:** React Hooks + Server State

**Client State:**
- `useState` - Local component state
- `useEffect` - Side effects & data fetching
- Custom hooks - Reusable logic

**Server State:**
- Fetch on mount
- Optimistic updates
- Manual refetch after mutations

**No Redux/Context** - Simple prop drilling sufficient for MVP

---

## 🔌 API Architecture

### RESTful Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /api/auth/signup | Create user |
| GET | /api/checkin | Get check-ins |
| POST | /api/checkin | Create check-in |
| GET | /api/medications | List medications |
| POST | /api/medications | Create medication |
| PATCH | /api/medications | Update medication |
| DELETE | /api/medications | Delete medication |
| POST | /api/medications/log | Log medication |
| GET | /api/messages | List messages |
| POST | /api/messages | Send message |
| PATCH | /api/messages | Update message |
| GET | /api/summary | Get summaries |
| POST | /api/summary | Generate summary |
| GET | /api/caregiver/links | List links |
| POST | /api/caregiver/links | Create link |

### API Response Format

**Success:**
```json
{
  "message": "Success message",
  "data": { ... }
}
```

**Error:**
```json
{
  "error": "Error message"
}
```

### Authentication Check Pattern

```typescript
// Every API route starts with:
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

---

## 📊 Performance Considerations

**Database:**
- ✅ Indexes on foreign keys
- ✅ Indexes on frequently queried columns
- ✅ LIMIT clauses on lists
- ✅ SELECT only needed columns

**Frontend:**
- ✅ Code splitting (Next.js automatic)
- ✅ Image optimization (next/image)
- ✅ Lazy loading components
- ✅ Debouncing user input

**Storage:**
- ✅ WebM audio format (compressed)
- ✅ Client-side compression before upload
- ✅ CDN delivery via Supabase

---

## 🧪 Testing Strategy

**Manual Testing:**
- Browser compatibility
- Voice features
- CRUD operations
- Authentication flows

**Automated Testing (Future):**
- Unit tests (Jest)
- Integration tests (Playwright)
- E2E tests (Cypress)

---

## 🚀 Deployment Architecture

### Development
```
localhost:3000 → Next.js Dev Server
                     ↓
              Supabase Dev Project
```

### Production (Vercel)
```
domain.com → Vercel Edge Network
                   ↓
           Next.js Serverless Functions
                   ↓
          Supabase Production Project
```

**Environment Variables:**
- Dev: `.env.local`
- Prod: Vercel Environment Variables

---

## 📈 Scalability

**Current Capacity (Free Tier):**
- Database: 500MB
- Storage: 1GB
- Auth Users: Unlimited
- API Requests: Unlimited

**Bottlenecks:**
- Storage (audio files)
- Database size (transcripts)

**Solutions:**
- Compress audio more aggressively
- Archive old data
- Upgrade to Supabase Pro ($25/month)

---

## 🔄 Future Architecture Improvements

1. **Add Redis Cache** - Cache summaries, reduce DB queries
2. **Add Message Queue** - Process summaries asynchronously
3. **Add CDN** - Faster audio delivery
4. **Add Monitoring** - Sentry for errors, Analytics for usage
5. **Add WebSockets** - Real-time message notifications
6. **Add Service Workers** - Offline support, push notifications
7. **Add Mobile Apps** - React Native or Flutter

---

**Architecture Status: ✅ Production-Ready MVP**

