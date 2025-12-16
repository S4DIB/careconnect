# ✅ CareConnect Setup Checklist

Follow this checklist to get CareConnect running with all caregiver features.

---

## 📦 1. Prerequisites

- [ ] Node.js 18+ installed
- [ ] npm or yarn installed
- [ ] Supabase account created
- [ ] Modern browser (Chrome/Edge/Safari)

---

## 🔧 2. Project Setup

- [ ] Clone the repository
- [ ] Run `npm install`
- [ ] Create `.env.local` file
- [ ] Add `NEXT_PUBLIC_SUPABASE_URL` to `.env.local`
- [ ] Add `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local`

---

## 🗄️ 3. Database Setup

Run these SQL scripts **in order** in Supabase SQL Editor:

- [ ] **Step 1:** `supabase/schema.sql` 
  - Creates all tables
  - Creates basic RLS policies
  - ⏱️ Takes ~30 seconds

- [ ] **Step 2:** `supabase/fix-caregiver-links.sql` ✅ **REQUIRED**
  - Adds caregiver linking policies
  - Fixes OAuth user creation
  - Allows caregivers to view linked user data
  - ⏱️ Takes ~10 seconds

- [ ] **Step 3:** `supabase/caregiver-alerts-rls.sql` ✅ **REQUIRED FOR ALERTS**
  - Adds alert monitoring policies
  - Allows caregivers to view stock alerts
  - Allows caregivers to view medication logs
  - ⏱️ Takes ~10 seconds

---

## 📁 4. Storage Setup

- [ ] Go to Supabase Dashboard → **Storage**
- [ ] Click **"New bucket"**
- [ ] Name: `voice-messages`
- [ ] Set to **Public**: ✅ **YES** (important!)
- [ ] Click **"Create bucket"**

---

## 🔐 5. Google OAuth Setup (Optional)

If you want Google Sign-In:

- [ ] Follow instructions in `GOOGLE_OAUTH_SETUP.md`
- [ ] Configure Google Cloud Console
- [ ] Add OAuth credentials to Supabase
- [ ] Configure redirect URLs

---

## 🚀 6. Start Development Server

- [ ] Run `npm run dev`
- [ ] Open `http://localhost:3000`
- [ ] Verify homepage loads

---

## ✅ 7. Test Basic Features

### Test Elderly User Flow
- [ ] Sign up as elderly user
- [ ] Complete a voice check-in
- [ ] Add a medication
- [ ] View dashboard

### Test Caregiver Flow
- [ ] Sign up as caregiver
- [ ] Link to elderly user (use their email)
- [ ] Verify user appears in linked list
- [ ] Click on user → View overview tab
- [ ] Click medications tab → Verify medications show
- [ ] Click check-ins tab → Verify check-ins show
- [ ] Click alerts tab → Verify alerts show (if any)

---

## 🧪 8. Test Caregiver Features

### Test Medication Monitoring
- [ ] View medications list for linked user
- [ ] Check adherence report shows
- [ ] Toggle between week/month view
- [ ] Verify per-medication breakdown

### Test Alerts
- [ ] Create low stock alert (log medication as taken until stock is low)
- [ ] Skip medication 3+ times to create alert
- [ ] Check-in with concerning keywords ("pain", "dizzy")
- [ ] Don't check in for 2+ days
- [ ] Verify all alerts appear in alerts tab

### Test Check-in History
- [ ] View check-in transcripts
- [ ] Verify keywords are highlighted
- [ ] Verify mood indicators show

### Test Voice Messaging
- [ ] Send voice message from caregiver
- [ ] Receive message as elderly user
- [ ] Reply with voice message
- [ ] Verify messages appear in history

---

## 🐛 9. Troubleshooting

If you encounter issues:

### Database Errors
- [ ] Check all SQL scripts ran successfully
- [ ] Check for red error messages in SQL editor
- [ ] Verify all tables exist in Table Editor

### Authentication Errors
- [ ] Check `.env.local` has correct values
- [ ] Restart dev server after env changes
- [ ] Check browser console for errors

### RLS Policy Errors
- [ ] Make sure `fix-caregiver-links.sql` was run
- [ ] Make sure `caregiver-alerts-rls.sql` was run
- [ ] Check Supabase logs for policy violations

### Voice Features Not Working
- [ ] Allow microphone permissions in browser
- [ ] Use HTTPS in production (HTTP only for localhost)
- [ ] Test in Chrome/Edge (best compatibility)

---

## 📊 10. Verify Complete Setup

You should be able to:

- ✅ Sign up/in as elderly user
- ✅ Sign up/in as caregiver
- ✅ Complete voice check-ins
- ✅ Add and manage medications
- ✅ Link caregiver to elderly user
- ✅ View all caregiver tabs (Overview, Medications, Check-ins, Alerts)
- ✅ See alerts in alerts tab
- ✅ Send voice messages
- ✅ View adherence reports

---

## 🎉 Success!

If all checkboxes are checked, CareConnect is fully set up and ready to use!

**Next Steps:**
- Read `CAREGIVER_FEATURES.md` for detailed feature documentation
- Read `TESTING.md` for comprehensive testing guide
- Read `ARCHITECTURE.md` for technical details

---

## 🆘 Still Having Issues?

1. Check browser console (F12) for errors
2. Check Supabase logs in Dashboard
3. Verify all SQL scripts ran without errors
4. Restart dev server
5. Clear browser cache and cookies
6. Try in incognito/private window

---

## 📞 Important Files

- `README.md` - Main documentation
- `CAREGIVER_FEATURES.md` - Complete caregiver features guide
- `GOOGLE_OAUTH_SETUP.md` - Google OAuth setup
- `ARCHITECTURE.md` - Technical architecture
- `TESTING.md` - Testing guide
- `IMPLEMENTATION_SUMMARY.md` - What was implemented

