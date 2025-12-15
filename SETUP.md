# CareConnect - Complete Setup Guide

This guide will walk you through setting up CareConnect from scratch in **less than 15 minutes**.

## ⚡ Quick Setup (5 Steps)

### Step 1: Install Dependencies (2 minutes)

```bash
npm install
```

### Step 2: Create Supabase Project (3 minutes)

1. Go to https://supabase.com and sign in
2. Click **"New Project"**
3. Fill in:
   - **Name:** CareConnect
   - **Database Password:** (create a strong password)
   - **Region:** (choose closest to you)
4. Click **"Create new project"**
5. Wait 2 minutes for database to initialize

### Step 3: Set Up Database Schema (2 minutes)

1. In your Supabase dashboard, click **"SQL Editor"** in the left sidebar
2. Click **"New Query"**
3. Open `supabase/schema.sql` from this project
4. Copy **ALL** the SQL code
5. Paste it into the Supabase SQL Editor
6. Click **"Run"** (bottom right)
7. You should see "Success. No rows returned"

**Verify it worked:**
- Click **"Table Editor"** in the left sidebar
- You should see tables: users, medications, health_checkins, etc.

### Step 4: Configure Environment Variables (1 minute)

1. In Supabase dashboard, click **"Settings"** (gear icon) → **"API"**
2. Copy **Project URL**
3. Copy **anon public** key
4. Create `.env.local` file in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

5. Save the file

### Step 5: Run the Application (1 minute)

```bash
npm run dev
```

Open http://localhost:3000 in **Chrome** or **Edge** (best for voice features).

## 🎬 Demo Flow (5 minutes)

### Test User 1: Elderly User

1. **Sign Up:**
   - Go to http://localhost:3000
   - Click "Sign Up"
   - Email: `elderly@test.com`
   - Password: `password123`
   - Full Name: `John Elderly`
   - Role: **Elderly User**
   - Click "Sign Up"

2. **Sign In:**
   - Email: `elderly@test.com`
   - Password: `password123`

3. **Allow Permissions:**
   - When prompted, click **"Allow"** for microphone
   - When prompted, click **"Allow"** for notifications

4. **Daily Check-In:**
   - Click "Check-In" in navigation
   - Click "Start Daily Check-In"
   - Wait for "Hello, how are you feeling today?"
   - Speak: "I'm feeling good today, no pain"
   - Click "Stop & Submit"
   - See confirmation

5. **Add Medication:**
   - Click "Medications" in navigation
   - Click "+ Add Medication"
   - Name: `Aspirin`
   - Dosage: `100mg`
   - Time: `09:00`
   - Total Stock: `30`
   - Click "Add Medication"

6. **Log Medication:**
   - Click "✓ Taken" on the Aspirin card
   - See success message
   - Notice stock decreased to 29

### Test User 2: Caregiver

1. **Sign Up (in new incognito window):**
   - Email: `caregiver@test.com`
   - Password: `password123`
   - Full Name: `Jane Caregiver`
   - Role: **Caregiver**

2. **Link to Elderly User:**

You need the elderly user's ID. Get it from the database:

**Option A - Via Supabase Dashboard:**
- Go to Supabase → Table Editor → users
- Find elderly@test.com
- Copy the `id` (UUID)

**Option B - Via API:**
```bash
# Use your Supabase credentials
curl -X POST http://localhost:3000/api/caregiver/links \
  -H "Content-Type: application/json" \
  -d '{"elderly_user_id": "paste-uuid-here"}'
```

3. **Send Voice Message:**
   - Sign in as caregiver
   - Go to "Messages"
   - Click "🎤 New Message"
   - Select "John Elderly"
   - Click "🎤 Start Recording"
   - Speak: "Hi John, how are you today?"
   - Click "⏹️ Stop Recording"
   - Click "Send Message"

4. **View as Elderly User:**
   - Sign in as elderly@test.com
   - Go to "Messages"
   - See the new message
   - Click play to listen

## 🔧 Troubleshooting

### Problem: "Supabase URL is undefined"

**Solution:**
- Make sure `.env.local` exists
- Check that variables start with `NEXT_PUBLIC_`
- Restart dev server: `Ctrl+C` then `npm run dev`

### Problem: "Speech recognition not working"

**Solution:**
- Use Chrome or Edge browser (best support)
- Make sure you allowed microphone permission
- Check if you have a working microphone
- Try refreshing the page

### Problem: "Notifications not appearing"

**Solution:**
- Click "Allow" when browser asks for notification permission
- Check browser notification settings
- Make sure browser is not in "Do Not Disturb" mode

### Problem: "Voice messages not playing"

**Solution:**
- Check that Supabase Storage bucket was created
- Go to Supabase → Storage → verify `voice-messages` bucket exists
- If not, run the storage bucket SQL from schema.sql

### Problem: "RLS policy error"

**Solution:**
- Make sure you ran the ENTIRE schema.sql file
- Check Supabase → Authentication → Policies
- Each table should have multiple policies

### Problem: "Cannot sign up"

**Solution:**
- Check Supabase → Authentication → Email is enabled
- Check email format is valid
- Password must be at least 6 characters

## 📊 Verify Everything Works

### Database Tables (9 tables)
- [ ] users
- [ ] caregiver_links
- [ ] health_checkins
- [ ] medications
- [ ] medication_logs
- [ ] voice_messages
- [ ] stock_alerts
- [ ] daily_summaries

### Storage Buckets (1 bucket)
- [ ] voice-messages

### RLS Policies
- [ ] Each table has SELECT, INSERT policies
- [ ] Caregivers can only see linked users' data

### Features
- [ ] Sign up works
- [ ] Sign in works
- [ ] Check-in records voice
- [ ] Medications can be added
- [ ] Medication logs save
- [ ] Voice messages send
- [ ] Notifications appear
- [ ] Dashboard shows data

## 🎯 Next Steps

1. **Customize:**
   - Change health keywords in `lib/constants.ts`
   - Modify UI colors in `tailwind.config.ts`
   - Add more features as needed

2. **Deploy:**
   - Deploy to Vercel (free)
   - Connect to GitHub
   - Add production environment variables

3. **Test:**
   - Test on multiple devices
   - Test different browsers
   - Test voice recognition accuracy

## 🚀 Production Deployment

### Deploy to Vercel (Recommended)

1. Push code to GitHub
2. Go to vercel.com
3. Click "Import Project"
4. Select your repo
5. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Click "Deploy"
7. Done! Your app is live

### Important for Production

- Use strong database password
- Enable email confirmation in Supabase
- Set up proper CORS in Supabase
- Monitor usage in Supabase dashboard
- Back up database regularly

## 📞 Getting Help

1. Check browser console (F12) for errors
2. Check Supabase logs for API errors
3. Review README.md for feature documentation
4. Test in Chrome/Edge first (best compatibility)

---

**That's it! You now have a fully functional CareConnect MVP running locally.**

**Total setup time: ~15 minutes**

