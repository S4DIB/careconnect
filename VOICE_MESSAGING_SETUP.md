# Voice Messaging Setup Guide

## 🎤 Setup Storage for Voice Messages

Voice messages require a Supabase Storage bucket to store audio files.

### Step 1: Create Storage Bucket

1. Go to **Supabase Dashboard** → **Storage**
2. Click **"New bucket"**
3. Fill in:
   - **Name**: `voice-messages`
   - **Public bucket**: ✅ **YES** (so audio files can be played in the browser)
4. Click **"Create bucket"**

### Step 2: Configure Storage Policies (Optional)

The bucket is public, so anyone with the URL can access the audio files. If you want more control:

1. Go to **Storage** → **voice-messages** → **Policies**
2. Run the SQL in `supabase/setup-voice-messages-storage.sql` (optional)

---

## ✅ Testing Voice Messages

### As a Caregiver:

1. **Sign in** as a caregiver
2. Go to **Dashboard** (should redirect to `/caregiver`)
3. **Link an elderly user** using their email
4. Click **"💬 Send Message"** button
5. Go to **Messages** page
6. Click **"🎤 New Message"**
7. Select recipient → Record voice message → Send

### As an Elderly User:

1. **Sign in** as an elderly user
2. Go to **Messages**
3. You'll see messages from linked caregivers
4. Reply by recording a voice message

---

## 🔧 Troubleshooting

### "You haven't linked any elderly users yet"
- Make sure you've run `supabase/fix-caregiver-links.sql`
- Check that the elderly user exists and is signed up with role `elderly_user`
- Try refreshing the page

### "Failed to upload audio"
- Make sure the `voice-messages` storage bucket exists
- Make sure it's set to **Public**
- Check browser console for detailed errors

### Audio won't play
- Check that the bucket is set to **Public**
- Check the audio URL in the database (should be a valid Supabase storage URL)
- Try opening the audio URL directly in a new tab

---

## 📝 Database Tables Used

- `voice_messages` - Stores message metadata
- `caregiver_links` - Links caregivers to elderly users
- Storage bucket `voice-messages` - Stores audio files

---

## 🎯 Features

✅ Two-way voice messaging (caregiver ↔ elderly)  
✅ Audio recording using browser MediaRecorder API  
✅ Read/unread status  
✅ Message history  
✅ Only linked users can message each other

