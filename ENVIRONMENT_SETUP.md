# Environment Variables Setup Guide

## 🔐 **New API Key Configuration**

**New Resend API Key**: `re_4KaYor7w_L2YqDgxfTRr4pkLGSVWu9cuiTryu`

## 📋 **Required Environment Variables**

### 1. **Supabase Edge Functions Environment Variables**

You need to set these in your **Supabase Dashboard**:

#### **How to Update Supabase Environment Variables:**

1. **Go to Supabase Dashboard**: [supabase.com/dashboard](https://supabase.com/dashboard)
2. **Select your project**
3. **Navigate to**: `Edge Functions` → `Environment Variables`
4. **Add/Update these variables**:

```env
RESEND_API_KEY=re_4KaYor7w_L2YqDgxfTRr4pkLGSVWu9cuiTryu
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SUPABASE_URL=https://your-project-ref.supabase.co
```

#### **Alternative: Using Supabase CLI**

If you have Supabase CLI installed:

```bash
# Set the new API key
supabase secrets set RESEND_API_KEY=re_4KaYor7w_L2YqDgxfTRr4pkLGSVWu9cuiTryu

# Verify it was set
supabase secrets list
```

### 2. **Local Development Environment**

Create a `.env` file in the `a-player-dashboard` directory:

```bash
# Copy the example file
cp env.example a-player-dashboard/.env
```

Then edit `a-player-dashboard/.env` with your actual values:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Email Configuration
RESEND_API_KEY=re_4KaYor7w_L2YqDgxfTRr4pkLGSVWu9cuiTryu
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Application Configuration
VITE_APP_TITLE=A-Player Evaluation Dashboard
VITE_APP_ENVIRONMENT=development
```

### 3. **Production Deployment Environment**

If using Docker or other hosting platforms, ensure these environment variables are set:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
RESEND_API_KEY=re_4KaYor7w_L2YqDgxfTRr4pkLGSVWu9cuiTryu
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## 🧪 **Testing the New API Key**

### 1. **Test Email Functionality**

You can test the new API key using the Supabase Edge Function:

```bash
# Call the test function (replace with your function URL)
curl -X POST 'https://your-project-ref.supabase.co/functions/v1/test-resend-simple' \
  -H 'Authorization: Bearer your-anon-key' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

### 2. **Check Edge Function Logs**

1. Go to **Supabase Dashboard** → **Edge Functions** → **Logs**
2. Look for successful API key validation
3. Verify email sending works

## 🔄 **Functions Using the API Key**

The following Edge Functions use `RESEND_API_KEY`:

- `test-resend-simple`
- `test-resend-detailed`
- `send-invitation-email`
- `create-invite`
- Any other email-related functions

## ⚠️ **Security Notes**

1. **Never commit** `.env` files to Git
2. **Use environment variables** in production, not hardcoded values
3. **Rotate API keys** regularly for security
4. **Monitor usage** in Resend dashboard

## 🚀 **After Setup**

1. **Restart** any running Edge Functions
2. **Test** email functionality
3. **Monitor** Resend dashboard for successful sends
4. **Check** application logs for any errors

---

**✅ Your new API key is ready to use: `re_4KaYor7w_L2YqDgxfTRr4pkLGSVWu9cuiTryu`**
