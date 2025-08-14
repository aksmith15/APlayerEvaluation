# Email Testing Instructions
## Verify SMTP Configuration is Working

---

## 🧪 **Testing Checklist**

### **Pre-Test Requirements**
- [ ] Supabase SMTP settings configured as per `SMTP_Configuration_Steps.md`
- [ ] Domain `theculturebase.com` verified in Resend dashboard
- [ ] Admin access to A-Player Evaluations dashboard

---

### **Test 1: Manual Email Invite Test**

1. **Access Dashboard**
   - Go to: https://a-player-evaluations.onrender.com
   - Login with admin credentials

2. **Navigate to Invitations**
   - Click: **Assignment Management**
   - Select: **Company Invitations** tab

3. **Send Test Invite**
   - Email: Use your own email address for testing
   - Role: Select any role (e.g., "member")
   - Click: **Send Invite**

4. **Expected Results**
   ```
   ✅ Success message: "Invite sent successfully"
   ✅ No error messages displayed
   ✅ Email received within 60 seconds
   ✅ From: "A-Player Evaluations <info@theculturebase.com>"
   ✅ Professional email appearance
   ```

---

### **Test 2: Check Supabase Logs**

1. **Access Supabase Dashboard**
   - Go to: [supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your A-Player project

2. **Check Function Logs**
   - Navigate: **Functions** → **create-invite**
   - Click: **Logs** tab
   - Look for recent entries

3. **Expected Log Messages**
   ```
   ✅ "Invite email sent successfully"
   ✅ No "AuthApiError" messages
   ✅ No SMTP authentication errors
   ```

---

### **Test 3: Verify Email Content**

Check the received email for:

**Headers:**
```
From: A-Player Evaluations <info@theculturebase.com>
To: [your-test-email]
Subject: You're invited to join A-Player Evaluations
Reply-To: [configured-reply-address] (if set up)
```

**Content:**
- [ ] Professional email template
- [ ] Clear invitation message
- [ ] Working "Accept Invite" link
- [ ] Company branding visible

---

### **Test 4: Multiple Provider Testing**

Send test invites to different email providers:

- [ ] **Gmail**: yourname@gmail.com
- [ ] **Outlook**: yourname@outlook.com  
- [ ] **Yahoo**: yourname@yahoo.com
- [ ] **Corporate Email**: yourname@company.com

**Verify for each:**
- [ ] Email delivered (not in spam)
- [ ] Professional appearance
- [ ] Links work correctly

---

## 🔍 **Troubleshooting Steps**

### **If Test Fails:**

1. **Check SMTP Settings**
   - Verify exact configuration in Supabase matches your settings
   - Ensure API key is set in environment: `RESEND_API_KEY=your_api_key_here`

2. **Check Resend Dashboard**
   - Go to: [resend.com/dashboard](https://resend.com/dashboard)
   - Check: **Activity** tab for email delivery status
   - Look for: Failed deliveries or authentication errors

3. **Domain Verification**
   - In Resend Dashboard: **Domains** → `theculturebase.com`
   - Status should show: **Verified** ✅
   - If pending: Contact domain administrator for DNS records

4. **Check Edge Function**
   - In Supabase: **Functions** → **create-invite** → **Logs**
   - Look for error messages or authentication failures

---

## 📋 **Test Results Template**

Copy and fill out this template after testing:

```
Date: [Current Date]
Tester: [Your Name]

✅ SMTP Configuration Status:
□ Supabase SMTP settings applied
□ Domain verified in Resend
□ API key configured correctly

✅ Test Results:
□ Manual invite sent successfully
□ Email received within 60 seconds  
□ Correct sender address displayed
□ Professional email appearance
□ No errors in Supabase logs
□ Multiple providers tested

✅ Issues Found:
□ None - all tests passed
□ [List any issues encountered]

✅ Next Steps:
□ Configuration ready for production use
□ [List any follow-up actions needed]
```

---

## 🎯 **Success Criteria**

**Configuration is ready when:**
- [x] All manual tests pass
- [x] Multiple email providers receive emails
- [x] No authentication errors in logs
- [x] Professional email appearance confirmed
- [x] Reply-to functionality working (if configured)

**You can now:**
- ✅ Send unlimited invitation emails
- ✅ Use professional `info@theculturebase.com` sender
- ✅ Configure separate reply-to addresses
- ✅ Monitor email delivery via Resend dashboard
