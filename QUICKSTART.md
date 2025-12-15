# CareConnect - Quick Start Guide

## ⚡ Get Running in 10 Minutes

This is the fastest way to get CareConnect up and running for a demo.

---

## 📋 Prerequisites Checklist

Before you start, make sure you have:
- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] Chrome or Edge browser
- [ ] A Supabase account (sign up at supabase.com - it's free)

---

## 🚀 Step-by-Step Setup

### Step 1: Install Dependencies (1 minute)

```bash
npm install
```

While this runs, open a new terminal and continue with Step 2.

---

### Step 2: Set Up Supabase (3 minutes)

#### 2.1 Create Supabase Project
1. Go to https://supabase.com/dashboard
2. Click **"New Project"**
3. Enter:
   - Name: `CareConnect`
   - Database Password: **Save this somewhere!**
   - Region: Choose closest to you
4. Click **"Create new project"**
5. Wait ~2 minutes (green "Ready" indicator)

#### 2.2 Run Database Schema
1. In Supabase, click **"SQL Editor"** (left sidebar)
2. Click **"New Query"**
3. Open `supabase/schema.sql` from this project
4. **Copy ALL the code** (Ctrl+A, Ctrl+C)
5. **Paste** into SQL Editor
6. Click **"Run"** (bottom right)
7. Wait for "Success. No rows returned"

#### 2.3 Verify Tables Created
1. Click **"Table Editor"** (left sidebar)
2. You should see 8 tables:
   - users
   - caregiver_links
   - health_checkins
   - medications
   - medication_logs
   - voice_messages
   - stock_alerts
   - daily_summaries

✅ If you see all 8 tables, you're good!

---

### Step 3: Configure Environment (2 minutes)

#### 3.1 Get Supabase Credentials
1. In Supabase, click **"Settings"** (gear icon) → **"API"**
2. Copy these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)

#### 3.2 Create .env.local File
Create a file named `.env.local` in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=paste_your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=paste_your_anon_key_here
```

**Example:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Save the file.

---

### Step 4: Run the Application (1 minute)

```bash
npm run dev
```

Wait for:
```
✓ Ready in 2.5s
○ Local: http://localhost:3000
```

Open http://localhost:3000 in **Chrome or Edge**.

---

## 🎬 Quick Demo (5 minutes)

### Create Test Users

#### User 1: Elderly User

1. Click **"Sign Up"**
2. Fill in:
   - Full Name: `John Smith`
   - Email: `john@test.com`
   - Password: `password123`
   - Role: Select **"Elderly User"**
3. Click **"Sign Up"**
4. Click **"Sign In"** and log in

✅ You're now signed in as an elderly user!

#### User 2: Caregiver (Optional)

1. Open a new **incognito/private window**
2. Go to http://localhost:3000
3. Sign up with:
   - Full Name: `Jane Caregiver`
   - Email: `jane@test.com`
   - Password: `password123`
   - Role: Select **"Caregiver"**

---

### Test Key Features

#### ✅ Voice Check-In (2 minutes)

1. Click **"Check-In"** in the navbar
2. Click **"Start Daily Check-In"**
3. **Allow microphone** when prompted
4. Wait for "Hello, how are you feeling today?"
5. Say: **"I'm feeling good today, no pain"**
6. Click **"Stop & Submit"**
7. See success message

**What just happened:**
- Your voice was converted to text
- Keywords were detected
- Mood was analyzed
- Check-in was saved
- Daily summary was generated

#### ✅ Add Medication (1 minute)

1. Click **"Medications"** in navbar
2. Click **"+ Add Medication"**
3. Fill in:
   - Name: `Aspirin`
   - Dosage: `100mg`
   - Time: `09:00`
   - Total Stock: `30`
   - Low Stock Threshold: `5`
4. Click **"Add Medication"**

**What just happened:**
- Medication was saved
- Reminder will trigger at 9:00 AM
- Stock will be tracked

#### ✅ Log Medication (30 seconds)

1. Stay on Medications page
2. Click **"✓ Taken"** on Aspirin

**What just happened:**
- Log was saved
- Stock decreased to 29
- Adherence was tracked

#### ✅ Voice Message (1 minute)

**Note:** This requires linking the caregiver to the elderly user first.

**Quick Link (via SQL):**
1. Go to Supabase → SQL Editor
2. Run this query:
```sql
INSERT INTO caregiver_links (caregiver_id, elderly_user_id)
VALUES (
  (SELECT id FROM users WHERE email = 'jane@test.com'),
  (SELECT id FROM users WHERE email = 'john@test.com')
);
```

**Then test messaging:**
1. Sign in as Jane (caregiver) in incognito window
2. Go to **"Messages"**
3. Click **"🎤 New Message"**
4. Select "John Smith"
5. Click **"🎤 Start Recording"**
6. Say: **"Hi John, hope you're doing well!"**
7. Click **"⏹️ Stop Recording"**
8. Click **"Send Message"**

**Listen to message:**
1. Sign in as John (elderly user)
2. Go to **"Messages"**
3. See new message with "New" badge
4. Click play button

---

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] Sign up works
- [ ] Sign in works
- [ ] Dashboard loads
- [ ] Voice check-in records voice
- [ ] Medications can be added
- [ ] Medication logs save
- [ ] Voice messages can be sent
- [ ] Browser notifications appear (optional)

---

## 🎯 You're Ready!

**Congratulations!** CareConnect is now running locally.

### What to do next:

**For Development:**
- Read `FEATURES.md` for detailed feature docs
- Read `ARCHITECTURE.md` to understand the code
- Check `TESTING.md` for comprehensive testing

**For Demo:**
- Create a presentation
- Prepare test scenarios
- Practice the voice check-in flow

**For Deployment:**
- Push code to GitHub
- Deploy to Vercel (free)
- Add production environment variables

---

## 🆘 Troubleshooting

### Problem: "Module not found"
**Solution:** Run `npm install` again

### Problem: "Supabase URL is undefined"
**Solution:** 
- Check `.env.local` exists
- Check variables start with `NEXT_PUBLIC_`
- Restart dev server (Ctrl+C, then `npm run dev`)

### Problem: "Speech recognition not working"
**Solution:**
- Use Chrome or Edge (best support)
- Check microphone is connected
- Click "Allow" for microphone permission
- Try refreshing the page

### Problem: "Tables not found"
**Solution:**
- Go back to Supabase SQL Editor
- Make sure you copied ALL the SQL code
- Run it again (it's safe to run multiple times)

### Problem: "Cannot sign up"
**Solution:**
- Check Supabase project is "Ready" (green indicator)
- Email must be valid format
- Password must be at least 6 characters

---

## 📞 Still Stuck?

1. Check browser console (F12) for errors
2. Check Supabase logs for API errors
3. Review `README.md` for detailed documentation
4. Make sure you're using Chrome or Edge

---

## 🎉 Success!

If you've completed all steps, you now have:

✅ A fully functional healthcare voice assistant
✅ Working authentication system
✅ Voice check-in with speech recognition
✅ Medication management with reminders
✅ Two-way voice messaging
✅ Secure database with RLS
✅ Beautiful, responsive UI

**Total Setup Time:** ~10 minutes
**Total Cost:** $0 (completely free)

---

**Ready to demo? Go to http://localhost:3000 and start using CareConnect!** 🚀

---

## 📚 Additional Resources

- **Full Documentation:** See `README.md`
- **Setup Guide:** See `SETUP.md` (more detailed)
- **Testing Guide:** See `TESTING.md`
- **Feature Docs:** See `FEATURES.md`
- **Architecture:** See `ARCHITECTURE.md`

---

**Built with ❤️ for elderly healthcare**

