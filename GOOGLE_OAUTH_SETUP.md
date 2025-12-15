# Google OAuth Setup for CareConnect

Follow these steps to enable Google Sign-In/Sign-Up in CareConnect.

---

## 🔧 Step 1: Configure Google OAuth in Supabase

### 1.1 Go to Supabase Authentication Settings

1. Open your Supabase dashboard
2. Click **"Authentication"** in the left sidebar
3. Click **"Providers"** tab
4. Find **"Google"** in the list

### 1.2 Enable Google Provider

1. Click on **"Google"**
2. Toggle **"Enable Sign in with Google"** to ON
3. You'll see two fields:
   - **Client ID** (from Google)
   - **Client Secret** (from Google)

**Keep this tab open** - we'll come back to fill these in.

---

## 🌐 Step 2: Create Google OAuth Credentials

### 2.1 Go to Google Cloud Console

1. Visit: https://console.cloud.google.com/
2. Sign in with your Google account
3. Click **"Select a project"** at the top
4. Click **"NEW PROJECT"**
5. Project name: `CareConnect`
6. Click **"CREATE"**

### 2.2 Enable Google+ API

1. In the left menu, go to **"APIs & Services"** → **"Library"**
2. Search for **"Google+ API"** or **"Google Identity"**
3. Click on it
4. Click **"ENABLE"**

### 2.3 Configure OAuth Consent Screen

1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. Select **"External"** (for testing)
3. Click **"CREATE"**
4. Fill in:
   - **App name:** `CareConnect`
   - **User support email:** Your email
   - **Developer contact email:** Your email
5. Click **"SAVE AND CONTINUE"**
6. Click **"SAVE AND CONTINUE"** on Scopes (default is fine)
7. Click **"SAVE AND CONTINUE"** on Test users
8. Click **"BACK TO DASHBOARD"**

### 2.4 Create OAuth Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** at the top
3. Select **"OAuth client ID"**
4. Choose **"Web application"**
5. Fill in:
   - **Name:** `CareConnect Web`
   - **Authorized JavaScript origins:**
     ```
     http://localhost:3000
     ```
   - **Authorized redirect URIs:**
     ```
     https://YOUR_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback
     ```

**To get your Supabase redirect URI:**
- Go back to Supabase → Authentication → Providers → Google
- Copy the **"Callback URL (for OAuth)"** shown there
- It looks like: `https://abcdefg.supabase.co/auth/v1/callback`

6. Click **"CREATE"**
7. You'll see a popup with:
   - **Your Client ID** (copy this)
   - **Your Client Secret** (copy this)

---

## 🔑 Step 3: Add Credentials to Supabase

1. Go back to **Supabase** → **Authentication** → **Providers** → **Google**
2. Paste:
   - **Client ID:** (from Google Cloud Console)
   - **Client Secret:** (from Google Cloud Console)
3. Click **"Save"**

---

## ✅ Step 4: Update Redirect URL for Production

When you deploy to production (e.g., Vercel), add your production URL:

### In Google Cloud Console:
1. Go to **Credentials** → Click your OAuth client
2. Add to **Authorized JavaScript origins:**
   ```
   https://your-app.vercel.app
   ```
3. The redirect URI stays the same (Supabase URL)

---

## 🧪 Step 5: Test Google Sign-In

1. Make sure dev server is running: `npm run dev`
2. Go to: http://localhost:3000/auth/signin
3. Click **"Sign in with Google"**
4. You should see Google's login screen
5. Sign in with your Google account
6. You'll be redirected back to CareConnect dashboard

**First time:**
- Select your role (Elderly User or Caregiver)
- Click "Continue with Google"
- Complete Google authentication
- User profile is created automatically

---

## 🔒 Security Notes

1. **Never commit** your Client Secret to Git
2. For production, use **"Internal"** OAuth consent (if you have Google Workspace)
3. Add **test users** in Google Console if using "External" mode
4. Review OAuth scopes regularly

---

## 🐛 Troubleshooting

### Error: "redirect_uri_mismatch"
**Solution:** 
- Check that the redirect URI in Google Console EXACTLY matches your Supabase callback URL
- No trailing slashes
- Must use HTTPS (Supabase) not HTTP

### Error: "Access blocked: This app's request is invalid"
**Solution:**
- Make sure you've enabled the Google+ API
- Configure the OAuth consent screen
- Add your email as a test user (if External)

### Error: "User profile not created"
**Solution:**
- Run the RLS policy fix SQL (from earlier)
- Check Supabase logs for errors

### Google login works but no role assigned
**Solution:**
- On signup page, select role BEFORE clicking "Continue with Google"
- The role is stored in sessionStorage and retrieved after OAuth

---

## 📝 Summary

After setup, users can:
- ✅ Sign in with Google
- ✅ Sign up with Google (choose role first)
- ✅ Use email/password (still available)
- ✅ User profile auto-created with Google data
- ✅ Full name from Google account

---

## 🎯 Quick Test Checklist

- [ ] Google OAuth configured in Supabase
- [ ] Google Cloud Console credentials created
- [ ] Redirect URI matches exactly
- [ ] Sign in with Google works
- [ ] Sign up with Google works
- [ ] User profile created automatically
- [ ] Role assignment works
- [ ] Redirect to dashboard works

---

**Setup Time:** ~10-15 minutes

**Cost:** FREE (Google OAuth is free)

---

That's it! Google Sign-In is now enabled for CareConnect! 🎉

