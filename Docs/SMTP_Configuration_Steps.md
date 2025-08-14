# SMTP Configuration Steps - Immediate Implementation Guide
## A-Player Evaluations Email Setup with Resend

---

## 🎯 **Current Configuration Details**

### **Resend Account Settings**
- **API Key**: `[REDACTED - Set via environment variable RESEND_API_KEY]`
- **API Name**: A-Player Evaluation
- **Domain**: `theculturebase.com`
- **SMTP Host**: `smtp.resend.com`

### **Your Requirements**
- **Sender Email**: `info@theculturebase.com`
- **Reply-To Email**: Customer rep email (configurable separately)
- **Port**: 465 (as specified in your settings)
- **Username**: `resend`
- **Password**: Your API key (`[REDACTED - Set via RESEND_API_KEY environment variable]`)

---

## 📋 **Step-by-Step Implementation**

### **Step 1: Configure Supabase SMTP Settings**

1. **Access Supabase Dashboard**
   - Go to: [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Navigate to your A-Player Evaluations project

2. **Navigate to SMTP Settings**
   - Go to: **Project Settings** → **Authentication** → **SMTP Settings**

3. **Configure the Following Settings** (Copy exactly as shown):

```
✅ Enable Custom SMTP: CHECKED

Sender details:
├── Sender email: info@theculturebase.com
└── Sender name: A-Player Evaluations

SMTP Provider Settings:
├── Host: smtp.resend.com
├── Port number: 465
├── Minimum interval between emails: 60 seconds
├── Username: resend
└── Password: [RESEND_API_KEY from environment]
```

4. **Save Settings**
   - Click "Save" to apply the configuration

---

### **Step 2: Configure Reply-To Address (Optional)**

**Method A: Supabase Email Template (Recommended)**

1. **Access Email Templates**
   - In Supabase Dashboard: **Authentication** → **Email Templates**

2. **Edit Invite Template**
   - Select: "Invite user" template
   - Look for the HTML editor

3. **Add Reply-To Header**
   - Add this to the template head section:
   ```html
   <meta http-equiv="Reply-To" content="support@theculturebase.com">
   ```
   
   Or add to the email body if meta tags aren't supported:
   ```html
   <!-- Reply-To: support@theculturebase.com -->
   ```

**Method B: Edge Function Enhancement (Advanced)**

If you want programmatic control over reply-to addresses, we can modify the Edge Function to include custom headers.

---

### **Step 3: Test the Configuration**

1. **Access Your Dashboard**
   - Go to: [https://a-player-evaluations.onrender.com](https://a-player-evaluations.onrender.com)
   - Login as an admin user

2. **Navigate to Invitations**
   - Go to: **Assignment Management** → **Company Invitations** tab

3. **Send Test Invite**
   - Enter a test email address (your own email for testing)
   - Click "Send Invite"

4. **Verify Email Reception**
   - Check your inbox for the invitation email
   - Verify the email shows:
     - **From**: "A-Player Evaluations <info@theculturebase.com>"
     - **Subject**: Invitation to join A-Player Evaluations
     - **Proper delivery** (not in spam)

---

### **Step 4: Verify Configuration Success**

**✅ Success Indicators:**
- [ ] No "AuthApiError" in Supabase logs
- [ ] Test email received within 60 seconds
- [ ] Email from `info@theculturebase.com`
- [ ] Professional appearance in inbox
- [ ] Reply-to functionality working (if configured)

**🔍 Troubleshooting Locations:**
1. **Supabase Logs**: Dashboard → Functions → create-invite → Logs
2. **Resend Dashboard**: [resend.com/dashboard](https://resend.com/dashboard) → Activity
3. **Email Headers**: Check received email for proper sender/reply-to

---

## 🚨 **Common Issues & Solutions**

### **Issue 1: "AuthApiError: Error sending invite email"**
**Cause**: SMTP authentication failed
**Solution**: 
1. Double-check API key is properly set in environment variable `RESEND_API_KEY`
2. Verify username is exactly: `resend`
3. Ensure domain is verified in Resend dashboard

### **Issue 2: Domain Not Verified**
**Cause**: DNS records not properly configured
**Solution**: 
1. Contact your domain administrator
2. Add the DNS records as specified in the main implementation plan
3. Wait 15 minutes to 72 hours for DNS propagation

### **Issue 3: Emails Going to Spam**
**Cause**: Domain authentication issues
**Solution**:
1. Verify SPF/DKIM records are added to DNS
2. Ask test recipients to mark as "Not Spam"
3. Monitor deliverability in Resend dashboard

---

## 📞 **Next Steps After Configuration**

1. **Immediate Testing**
   - Send 2-3 test invites to different email providers (Gmail, Outlook, etc.)
   - Verify delivery and appearance

2. **Production Validation**
   - Monitor Supabase function logs for errors
   - Check Resend dashboard for delivery statistics
   - Collect feedback from actual invite recipients

3. **Optional Enhancements**
   - Configure custom reply-to addresses for specific use cases
   - Set up email templates with company branding
   - Add email analytics tracking

---

## ✅ **Configuration Checklist**

- [ ] Supabase SMTP settings updated
- [ ] Test email sent and received
- [ ] No errors in Supabase logs
- [ ] Email from correct sender address
- [ ] Professional appearance verified
- [ ] Reply-to configuration tested (if applicable)
- [ ] Production testing completed

---

**Once all steps are completed, your email system will be operational with:**
- ✅ Professional sender: `A-Player Evaluations <info@theculturebase.com>`
- ✅ Unlimited email sending capacity
- ✅ Proper SMTP authentication
- ✅ Optional reply-to customization
