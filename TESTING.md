# CareConnect - Testing Guide

## 🧪 Complete Testing Checklist

This guide provides step-by-step testing procedures for all features.

---

## ✅ Prerequisites

Before testing, ensure:
- [ ] Supabase project is set up
- [ ] Database schema is executed (schema.sql)
- [ ] Environment variables are configured
- [ ] Dev server is running (`npm run dev`)
- [ ] Using Chrome or Edge browser
- [ ] Microphone is connected
- [ ] Notifications are allowed

---

## 1️⃣ Authentication Testing

### Test Case 1.1: User Sign Up (Elderly User)

**Steps:**
1. Navigate to `http://localhost:3000`
2. Click "Sign Up"
3. Fill in form:
   - Full Name: `Test Elderly`
   - Email: `elderly@test.com`
   - Password: `password123`
   - Role: Select "Elderly User"
4. Click "Sign Up"

**Expected Result:**
- ✅ Redirected to sign-in page
- ✅ Success message appears
- ✅ User created in Supabase Auth
- ✅ User profile created in `users` table

**Verify in Supabase:**
```sql
SELECT * FROM users WHERE email = 'elderly@test.com';
-- Should show role = 'elderly_user'
```

### Test Case 1.2: User Sign Up (Caregiver)

**Steps:**
1. Open incognito window
2. Navigate to `http://localhost:3000`
3. Click "Sign Up"
4. Fill in form:
   - Full Name: `Test Caregiver`
   - Email: `caregiver@test.com`
   - Password: `password123`
   - Role: Select "Caregiver"
5. Click "Sign Up"

**Expected Result:**
- ✅ Redirected to sign-in page
- ✅ User created with role = 'caregiver'

### Test Case 1.3: Sign In

**Steps:**
1. Navigate to sign-in page
2. Enter credentials:
   - Email: `elderly@test.com`
   - Password: `password123`
3. Click "Sign In"

**Expected Result:**
- ✅ Redirected to `/dashboard`
- ✅ Navbar shows user name/email
- ✅ Dashboard shows user-specific content
- ✅ JWT token stored in cookies

### Test Case 1.4: Sign Out

**Steps:**
1. While signed in, click "Sign Out" in navbar

**Expected Result:**
- ✅ Redirected to `/auth/signin`
- ✅ Session cleared
- ✅ Cannot access protected routes

### Test Case 1.5: Protected Routes

**Steps:**
1. Sign out
2. Try to access `http://localhost:3000/dashboard`

**Expected Result:**
- ✅ Redirected to `/auth/signin`
- ✅ Cannot access without authentication

---

## 2️⃣ Voice Check-In Testing

### Test Case 2.1: Basic Check-In

**Steps:**
1. Sign in as elderly user
2. Click "Check-In" in navbar
3. Click "Start Daily Check-In"
4. Wait for greeting: "Hello, how are you feeling today?"
5. Speak: "I'm feeling good today"
6. Wait for transcript to appear
7. Click "Stop & Submit"

**Expected Result:**
- ✅ Greeting plays via TTS
- ✅ Microphone permission requested
- ✅ Recording indicator appears
- ✅ Transcript displays in real-time
- ✅ Success message appears
- ✅ Redirected to dashboard
- ✅ Check-in saved in database

**Verify in Supabase:**
```sql
SELECT * FROM health_checkins ORDER BY created_at DESC LIMIT 1;
-- Should show your transcript
```

### Test Case 2.2: Keyword Detection

**Steps:**
1. Start new check-in
2. Speak: "I have a headache and feel tired. I'm also a bit dizzy."
3. Submit

**Expected Result:**
- ✅ Keywords detected: ["headache", "tired", "dizzy"]
- ✅ Stored in `detected_keywords` array

**Verify in Supabase:**
```sql
SELECT detected_keywords FROM health_checkins ORDER BY created_at DESC LIMIT 1;
-- Should show: {headache,tired,dizzy}
```

### Test Case 2.3: Mood Analysis

**Test Good Mood:**
- Speak: "I'm feeling great and happy today!"
- Expected: `mood = 'good'`

**Test Bad Mood:**
- Speak: "I'm feeling terrible and sick today."
- Expected: `mood = 'bad'`

**Test Neutral Mood:**
- Speak: "I'm okay, nothing special."
- Expected: `mood = 'neutral'`

### Test Case 2.4: Daily Summary Generation

**Steps:**
1. Complete a check-in
2. Navigate to Dashboard
3. View "Today's Summary" card

**Expected Result:**
- ✅ Summary appears
- ✅ Shows mood, symptoms, adherence
- ✅ Summary saved in `daily_summaries` table

**Verify in Supabase:**
```sql
SELECT * FROM daily_summaries 
WHERE date = CURRENT_DATE 
ORDER BY created_at DESC LIMIT 1;
```

---

## 3️⃣ Medication Testing

### Test Case 3.1: Add Medication

**Steps:**
1. Sign in as elderly user
2. Click "Medications" in navbar
3. Click "+ Add Medication"
4. Fill in form:
   - Name: `Aspirin`
   - Dosage: `100mg`
   - Time: `14:30` (set to 2 minutes from now)
   - Total Stock: `30`
   - Low Stock Threshold: `5`
5. Click "Add Medication"

**Expected Result:**
- ✅ Success message appears
- ✅ Medication appears in list
- ✅ Shows correct details
- ✅ Saved in database

### Test Case 3.2: Medication Reminder

**Steps:**
1. Add medication with time = current time + 2 minutes
2. Wait 2 minutes
3. Browser should show notification

**Expected Result:**
- ✅ Browser notification appears at scheduled time
- ✅ Notification shows medication name and dosage
- ✅ Click notification → goes to medications page

### Test Case 3.3: Log Medication (Taken)

**Steps:**
1. View medications list
2. Click "✓ Taken" on a medication

**Expected Result:**
- ✅ Success message appears
- ✅ Stock decreases by 1
- ✅ Log saved with status = 'taken'

**Verify in Supabase:**
```sql
-- Check stock decreased
SELECT name, total_stock FROM medications WHERE name = 'Aspirin';

-- Check log created
SELECT * FROM medication_logs ORDER BY logged_at DESC LIMIT 1;
-- Should show status = 'taken'
```

### Test Case 3.4: Log Medication (Skipped)

**Steps:**
1. Click "Skip" on a medication

**Expected Result:**
- ✅ Log saved with status = 'skipped'
- ✅ Stock DOES NOT decrease

### Test Case 3.5: Low Stock Alert

**Steps:**
1. Add medication with total_stock = 5, threshold = 5
2. Click "✓ Taken" 5 times
3. Check Dashboard

**Expected Result:**
- ✅ Stock decreases each time
- ✅ Alert appears when stock <= threshold
- ✅ Alert saved in `stock_alerts` table
- ✅ Yellow warning banner on Dashboard

**Verify in Supabase:**
```sql
SELECT * FROM stock_alerts WHERE is_resolved = false;
```

### Test Case 3.6: Delete Medication

**Steps:**
1. Click "Delete" on a medication
2. Confirm deletion

**Expected Result:**
- ✅ Medication removed from list
- ✅ `is_active` set to `false` (soft delete)
- ✅ Not shown in active medications

---

## 4️⃣ Voice Messaging Testing

### Test Case 4.1: Link Caregiver to Elderly User

**Steps:**
1. Get elderly user ID from database:
```sql
SELECT id FROM users WHERE email = 'elderly@test.com';
```

2. Use API or SQL to create link:
```sql
INSERT INTO caregiver_links (caregiver_id, elderly_user_id)
VALUES (
  (SELECT id FROM users WHERE email = 'caregiver@test.com'),
  (SELECT id FROM users WHERE email = 'elderly@test.com')
);
```

**Expected Result:**
- ✅ Link created in database
- ✅ Caregiver can now see elderly user

### Test Case 4.2: Send Voice Message (Caregiver → Elderly)

**Steps:**
1. Sign in as caregiver
2. Go to "Messages"
3. Click "🎤 New Message"
4. Select recipient: "Test Elderly"
5. Click "🎤 Start Recording"
6. Speak: "Hi, how are you doing today?"
7. Click "⏹️ Stop Recording"
8. Review audio playback
9. Click "Send Message"

**Expected Result:**
- ✅ Recording indicator shows
- ✅ Can play back recording before sending
- ✅ Success message appears
- ✅ Message appears in message list
- ✅ Audio file uploaded to Supabase Storage
- ✅ Message saved in database

**Verify in Supabase:**
```sql
SELECT * FROM voice_messages ORDER BY created_at DESC LIMIT 1;
-- Should show sender = caregiver, recipient = elderly

-- Check storage
-- Go to Supabase → Storage → voice-messages
-- Should see audio file
```

### Test Case 4.3: Receive Voice Message

**Steps:**
1. Sign in as elderly user (different browser/incognito)
2. Go to "Messages"
3. See new message with "New" badge
4. Click play on audio player

**Expected Result:**
- ✅ Message appears with "New" badge
- ✅ Shows sender name
- ✅ Audio plays correctly
- ✅ After playing, "New" badge disappears
- ✅ `is_read` updated to `true`

### Test Case 4.4: Reply to Message

**Steps:**
1. While signed in as elderly user
2. Record and send a reply message to caregiver

**Expected Result:**
- ✅ Caregiver receives message
- ✅ Shows as new for caregiver
- ✅ Can play and reply

---

## 5️⃣ Caregiver Dashboard Testing

### Test Case 5.1: View Linked Users

**Steps:**
1. Sign in as caregiver
2. View dashboard

**Expected Result:**
- ✅ Shows linked elderly users
- ✅ Can view their information

### Test Case 5.2: View Elderly User Summary

**Steps:**
1. Ensure elderly user has completed check-ins
2. Sign in as caregiver
3. Navigate to dashboard or use API

**Expected Result:**
- ✅ Can view daily summaries of linked users
- ✅ Can see medication adherence
- ✅ Can see symptoms detected

**Verify API:**
```bash
# Get elderly user ID first, then:
curl http://localhost:3000/api/summary?user_id=ELDERLY_USER_ID
```

---

## 6️⃣ Security & RLS Testing

### Test Case 6.1: Data Isolation (Check-Ins)

**Steps:**
1. Create two elderly users
2. User A creates check-in
3. Sign in as User B
4. Try to view User A's check-ins

**Expected Result:**
- ✅ User B CANNOT see User A's check-ins
- ✅ API returns only User B's data
- ✅ RLS enforces at database level

### Test Case 6.2: Caregiver Data Access

**Steps:**
1. Caregiver linked to User A
2. Caregiver tries to access User B's data (not linked)

**Expected Result:**
- ✅ Can see User A's data (linked)
- ✅ CANNOT see User B's data (not linked)
- ✅ RLS policies enforce access

### Test Case 6.3: Storage Security

**Steps:**
1. User A sends voice message
2. Get audio URL from database
3. Sign out
4. Try to access audio URL directly

**Expected Result:**
- ✅ Cannot access without authentication
- ✅ RLS policies on storage bucket

---

## 7️⃣ Browser Compatibility Testing

### Test in Chrome
- [ ] Speech recognition works
- [ ] Speech synthesis works
- [ ] Audio recording works
- [ ] Notifications work
- [ ] All UI renders correctly

### Test in Edge
- [ ] All features work (same as Chrome)

### Test in Safari
- [ ] Speech recognition works
- [ ] Speech synthesis works
- [ ] Audio recording works
- [ ] Notifications limited but work

### Test in Firefox
- [ ] Speech recognition limited
- [ ] Speech synthesis works
- [ ] Audio recording works
- [ ] UI works

---

## 8️⃣ Error Handling Testing

### Test Case 8.1: Invalid Credentials

**Steps:**
1. Try to sign in with wrong password

**Expected Result:**
- ✅ Error message shown
- ✅ Does not sign in
- ✅ No redirect

### Test Case 8.2: Microphone Permission Denied

**Steps:**
1. Block microphone in browser settings
2. Try to do check-in

**Expected Result:**
- ✅ Error message shown
- ✅ Explains permission needed
- ✅ Does not crash

### Test Case 8.3: Network Error

**Steps:**
1. Disable internet
2. Try to submit check-in

**Expected Result:**
- ✅ Error message shown
- ✅ Data not lost (if possible)
- ✅ User can retry

---

## 9️⃣ Performance Testing

### Test Case 9.1: Page Load Time

**Steps:**
1. Open browser DevTools → Network
2. Navigate to dashboard
3. Check load time

**Expected Result:**
- ✅ Initial load < 3 seconds
- ✅ Subsequent loads < 1 second (cached)

### Test Case 9.2: Database Query Performance

**Steps:**
1. Add 100+ check-ins
2. Load dashboard
3. Check query time in Supabase logs

**Expected Result:**
- ✅ Queries complete < 200ms
- ✅ Indexes used for foreign keys

---

## 🔟 Integration Testing

### Full User Journey (Elderly User)

1. [ ] Sign up
2. [ ] Sign in
3. [ ] Complete daily check-in
4. [ ] Add medication
5. [ ] Receive notification (wait for scheduled time)
6. [ ] Log medication as taken
7. [ ] View dashboard summary
8. [ ] Receive voice message from caregiver
9. [ ] Reply with voice message
10. [ ] Sign out

**Time:** ~15 minutes
**Result:** All features work end-to-end

### Full User Journey (Caregiver)

1. [ ] Sign up
2. [ ] Sign in
3. [ ] Get linked to elderly user (via API/admin)
4. [ ] View dashboard
5. [ ] View elderly user's summary
6. [ ] Send voice message to elderly user
7. [ ] Receive reply
8. [ ] Sign out

**Time:** ~10 minutes
**Result:** All features work end-to-end

---

## ✅ Testing Summary Template

After completing all tests, fill out:

**Date:** ___________
**Tester:** ___________
**Browser:** Chrome / Edge / Safari / Firefox

| Feature | Status | Notes |
|---------|--------|-------|
| Sign Up/In | ✅ / ❌ | |
| Check-In Voice | ✅ / ❌ | |
| Keyword Detection | ✅ / ❌ | |
| Mood Analysis | ✅ / ❌ | |
| Daily Summary | ✅ / ❌ | |
| Add Medication | ✅ / ❌ | |
| Medication Reminder | ✅ / ❌ | |
| Log Medication | ✅ / ❌ | |
| Low Stock Alert | ✅ / ❌ | |
| Voice Message Send | ✅ / ❌ | |
| Voice Message Receive | ✅ / ❌ | |
| Caregiver Dashboard | ✅ / ❌ | |
| RLS Security | ✅ / ❌ | |

**Overall Result:** PASS / FAIL

**Issues Found:** ___________

---

## 🚨 Known Issues & Limitations

1. **Speech Recognition:**
   - Accuracy depends on accent
   - Requires clear speech
   - Background noise affects quality

2. **Browser Notifications:**
   - Must grant permission first
   - May not work on mobile Safari
   - Requires tab to be open (for check)

3. **Audio Format:**
   - WebM may not play on all browsers
   - File sizes can be large

---

**Testing Complete! 🎉**

If all tests pass, the application is ready for demo and deployment.

