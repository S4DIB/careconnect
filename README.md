# CareConnect - Healthcare Voice Assistant MVP

A web-based AI Voice Assistant for personalized healthcare and emotional connectivity for elderly users and caregivers.

## 🎯 Project Overview

CareConnect is a full-stack web application built for a university software engineering course. It provides:

- **Voice-based daily health check-ins** using browser speech APIs
- **Medication reminder system** with browser notifications
- **Automated daily health summaries** (rule-based analysis)
- **Two-way voice messaging** between elderly users and caregivers
- **Caregiver dashboard** to monitor linked users
- **Privacy & security** with Supabase Row Level Security

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**

### Backend
- **Next.js API Routes** (serverless functions)

### Database, Auth & Storage
- **Supabase** (PostgreSQL + Authentication + Storage)

### Voice & Audio
- **Browser SpeechRecognition API** (speech-to-text)
- **Browser SpeechSynthesis API** (text-to-speech)
- **MediaRecorder API** (audio recording)
- **Browser Notification API**

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm/yarn
- **Supabase account** (free tier)
- **Modern browser** (Chrome, Edge, or Safari recommended for voice features)

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd care-connect
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the database to initialize (takes ~2 minutes)
3. Go to **SQL Editor** in your Supabase dashboard
4. Copy and paste the entire contents of `supabase/schema.sql`
5. Click **Run** to execute the SQL
6. Go to **Storage** and verify the `voice-messages` bucket was created

### 4. Configure Environment Variables

1. Copy the example env file:

```bash
cp .env.local.example .env.local
```

2. Edit `.env.local` and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Where to find these values:**
- Go to your Supabase project dashboard
- Click on **Settings** (gear icon) → **API**
- Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- Copy **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📱 Features & Usage

### 1. User Authentication

**Sign Up:**
- Go to `/auth/signup`
- Choose role: **Elderly User** or **Caregiver**
- Enter email, password, and full name
- Create account

**Sign In:**
- Go to `/auth/signin`
- Enter credentials
- Access your dashboard

### 2. Daily Health Check-In (Elderly Users)

1. Navigate to **Check-In** from the dashboard
2. Click **"Start Daily Check-In"**
3. App will speak: "Hello, how are you feeling today?"
4. Speak your response (mention any symptoms, pain, mood, etc.)
5. Click **"Stop & Submit"**
6. Your check-in is saved and analyzed for keywords like:
   - Pain, tired, headache, dizzy, fever
   - Sad, anxious, depressed, lonely
   - And more health-related terms

### 3. Medication Management (Elderly Users)

**Add Medication:**
1. Go to **Medications**
2. Click **"+ Add Medication"**
3. Fill in:
   - Name (e.g., "Aspirin")
   - Dosage (e.g., "100mg")
   - Time (24-hour format, e.g., "09:00")
   - Total stock (number of doses)
   - Low stock threshold
4. Submit

**Medication Reminders:**
- Browser notifications appear at scheduled times
- Click notification to go to medications page

**Log Medication:**
- Click **"✓ Taken"** when you take it
- Click **"Skip"** if you skip it
- Stock automatically decreases when marked as taken
- Low stock alerts trigger automatically

### 4. Voice Messaging (Both Roles)

**Send a Voice Message:**
1. Go to **Messages**
2. Click **"🎤 New Message"**
3. Select recipient
4. Click **"🎤 Start Recording"**
5. Speak your message
6. Click **"⏹️ Stop Recording"**
7. Review and click **"Send Message"**

**Listen to Messages:**
- Messages appear in the messages page
- Click play on the audio player
- Message is automatically marked as read

### 5. Caregiver Dashboard

Caregivers can:
- View linked elderly users
- See daily health summaries
- Check medication adherence
- Send and receive voice messages

**Link an Elderly User:**
- Contact administrator or use API endpoint:
```bash
POST /api/caregiver/links
Body: { "elderly_user_id": "uuid-of-elderly-user" }
```

### 6. Daily Summaries (Automated)

Daily summaries are generated automatically after each check-in and include:
- **Mood analysis** (good, bad, neutral)
- **Detected symptoms** (health keywords)
- **Medication adherence rate** (percentage)
- **Total check-ins** for the day

Caregivers can view summaries of their linked users.

## 🗄️ Database Schema

### Tables

- **users** - User profiles with roles
- **caregiver_links** - Links between caregivers and elderly users
- **health_checkins** - Daily voice check-in records
- **medications** - Medication schedules and stock
- **medication_logs** - Medication adherence logs
- **voice_messages** - Two-way audio messages
- **stock_alerts** - Low medication stock alerts
- **daily_summaries** - Automated health summaries

### Row Level Security (RLS)

All tables have RLS policies to ensure:
- Users can only access their own data
- Caregivers can only access data of linked users
- Secure audio file access in Supabase Storage

## 🎨 UI/UX Features

- **Clean, modern design** with Tailwind CSS
- **Responsive layout** for desktop and mobile
- **Large buttons** optimized for elderly users
- **Clear visual feedback** for voice recording
- **Color-coded alerts** for important information
- **Accessible navigation** with clear labels

## 🔒 Security & Privacy

- **Supabase Authentication** with JWT tokens
- **Row Level Security (RLS)** policies on all tables
- **Secure audio file storage** with access policies
- **HTTPS** for all API communications
- **Client-side validation** for form inputs
- **Server-side validation** in API routes

## 🧪 Testing

### Manual Testing Checklist

**Authentication:**
- [ ] Sign up as elderly user
- [ ] Sign up as caregiver
- [ ] Sign in with valid credentials
- [ ] Sign out

**Check-In (Elderly User):**
- [ ] Start daily check-in
- [ ] Speak and verify transcript appears
- [ ] Submit check-in
- [ ] Verify keywords detected
- [ ] Check daily summary generated

**Medications (Elderly User):**
- [ ] Add new medication
- [ ] View medication list
- [ ] Log medication as taken
- [ ] Verify stock decreases
- [ ] Test low stock alert

**Voice Messages:**
- [ ] Record voice message
- [ ] Send to recipient
- [ ] Play received message
- [ ] Verify read status updates

**Caregiver Dashboard:**
- [ ] Link elderly user
- [ ] View user summaries
- [ ] Check medication adherence
- [ ] Send/receive messages

### Browser Compatibility

✅ **Chrome/Edge** - Full support
✅ **Safari** - Full support
⚠️ **Firefox** - Limited speech recognition support
❌ **Internet Explorer** - Not supported

## 🚧 Known Limitations

1. **Speech Recognition:**
   - Requires internet connection
   - Quality depends on microphone and accent
   - May not work in Firefox

2. **Browser Notifications:**
   - User must grant permission
   - May not work on mobile browsers
   - Requires app to be open in background

3. **Audio Storage:**
   - Audio files in WebM format
   - May not play on all browsers
   - Storage limited by Supabase free tier (1GB)

## 📚 Project Structure

```
care-connect/
├── app/
│   ├── api/              # API routes
│   │   ├── auth/
│   │   ├── checkin/
│   │   ├── medications/
│   │   ├── messages/
│   │   ├── summary/
│   │   └── caregiver/
│   ├── auth/             # Authentication pages
│   ├── dashboard/        # Dashboard page
│   ├── checkin/          # Check-in page
│   ├── medications/      # Medications page
│   └── messages/         # Messages page
├── components/           # Reusable UI components
├── hooks/                # Custom React hooks
│   ├── useAudioRecorder.ts
│   ├── useSpeechRecognition.ts
│   └── useSpeechSynthesis.ts
├── lib/                  # Library code
│   ├── supabase/         # Supabase clients
│   ├── types.ts          # TypeScript types
│   └── constants.ts      # App constants
├── utils/                # Utility functions
│   ├── healthAnalysis.ts
│   └── notifications.ts
├── supabase/
│   └── schema.sql        # Database schema
└── README.md
```

## 🎓 Academic Context

This project was built for a university software engineering course to demonstrate:

- Full-stack web development
- Database design and RLS
- API design and implementation
- Voice interface development
- Security best practices
- Clean code and architecture
- User-centered design for accessibility

## 📝 Future Enhancements

- [ ] Advanced AI integration (sentiment analysis)
- [ ] Video calling
- [ ] Emergency alert system
- [ ] Integration with wearable devices
- [ ] Multi-language support
- [ ] Mobile app (React Native)
- [ ] Analytics dashboard
- [ ] Export health reports (PDF)

## 🤝 Contributing

This is an academic project, but suggestions and improvements are welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is for educational purposes only.

## 🙋 Support

For questions or issues:
1. Check the **Known Limitations** section
2. Review the Supabase SQL setup
3. Verify environment variables are correct
4. Check browser console for errors

## 🎉 Demo Ready

This project is fully functional and demo-ready. Simply:
1. Set up Supabase
2. Configure environment variables
3. Run `npm install && npm run dev`
4. Create test users and demonstrate features

---

**Built with ❤️ for elderly healthcare and emotional connectivity**

