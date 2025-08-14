# Email System Implementation Plan
## A-Player Evaluations - Professional Email Setup

---

## 📋 **Current Status**

### **Issue Identified:**
- **Error**: "AuthApiError: Error sending invite email" in Supabase create-invite Edge Function
- **Root Cause**: SMTP configuration issues with unverified domain
- **Current Workaround**: Using Supabase default email (2 emails/hour limit)

### **Domain Setup:**
- **Target Domain**: `theculturebase.com`
- **Render Custom Domain**: Added `theculturebase.com` to Render service
- **Resend Domain**: Added `theculturebase.com` to Resend dashboard
- **DNS Records**: Provided to domain administrator (pending implementation)

---

## 🎯 **Implementation Steps**

### **Phase 1: DNS Configuration (External Dependencies)**

#### **DNS Records to Add to `theculturebase.com`:**
```
Type: MX
Host: send
Value: feedback-smtp.us-east-1.amazonses.com
Priority: 10

Type: TXT
Host: send
Value: v=spf1 include:amazonses.com ~all

Type: TXT
Host: resend._domainkey
Value: p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDEdH/yc0Xi+vvWgLDQ+Wsoajf9pOi0swwkExeju2bavmskDtDDV1TFBGuniaVyV8LwB+jK10xUOtO6W7RyHXRgvgJUbtWpZwvqRO0PWlcqz6DJm/fLAmIksY+TRjAQ90BJg+qSLbxNKxNdb3OnTscjTqZNuI+vZbYpPr63Bkbe0wIDAQAB

Type: TXT
Host: _dmarc
Value: v=DMARC1; p=none;
```

**Timeline**: 15 minutes to 72 hours (DNS propagation)
**Owner**: Domain administrator/IT team
**Status**: ⏳ Pending

---

### **Phase 2: Email Configuration (Post-DNS)**

#### **Step 1: Verify Domain in Resend**
1. **Access**: [resend.com](https://resend.com) dashboard
2. **Navigate**: Domains → `theculturebase.com`
3. **Action**: Click "Verify DNS Records"
4. **Expected Result**: Domain status changes to "Verified" ✅
5. **Timeline**: 15 minutes after DNS propagation

#### **Step 2: Update Supabase SMTP Settings**
**Location**: Supabase Dashboard → Project Settings → Authentication → SMTP Settings

**Configuration:**
```
Enable Custom SMTP: ✅ Checked
Host: smtp.resend.com
Port: 465
Username: resend
Password: re_jiGEM9YN_A94SoB2B49kYqzbpMmECzYQW
Sender Email: info@theculturebase.com
Sender Name: A-Player Evaluations
Minimum Interval: 60 seconds
```

**Updated Configuration Notes:**
- **Sender Email**: Changed from `noreply@theculturebase.com` to `info@theculturebase.com` as requested
- **Sender Name**: Updated to "A-Player Evaluations" to match API name
- **Reply-To Address**: Can be configured separately from sender address (see email template customization below)

#### **Step 3: Test Email Delivery**
1. **Access**: A-Player Dashboard → Assignment Management → Company Invitations
2. **Action**: Send test invite to external email
3. **Expected Result**: 
   - ✅ "Invite sent successfully" message
   - ✅ Email delivered within 60 seconds
   - ✅ From: "A-Player Evaluations <info@theculturebase.com>"
   - ✅ Reply-To: (customer rep email - configurable separately)
   - ✅ Professional appearance in recipient inbox

#### **Step 4: Configure Reply-To Address (Optional)**
**Purpose**: Allow customers to reply to a different email address than the sender
**Implementation**: 
- **Sender**: `info@theculturebase.com` (automated system emails)
- **Reply-To**: Customer rep email address (for human responses)
- **Configuration**: Set via Supabase email template customization or Edge Function headers

**Reply-To Configuration Options:**

**Option A: Supabase Email Template (Recommended)**
1. Go to: Supabase Dashboard → Authentication → Email Templates
2. Select: "Invite user" template
3. Add custom headers:
```html
<header>
Reply-To: support@theculturebase.com
</header>
```

**Option B: Edge Function Enhancement (Advanced)**
Modify the `create-invite` Edge Function to include custom email headers:
```typescript
// In create-invite/index.ts, when calling inviteUserByEmail:
const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
  email.toLowerCase().trim(),
  {
    redirectTo: redirectTo,
    data: {
      company_id,
      role_to_assign,
      invite_token: inviteToken
    },
    emailOptions: {
      replyTo: 'support@theculturebase.com'  // Custom reply-to address
    }
  }
)
```

**Example Email Headers Result:**
```
From: A-Player Evaluations <info@theculturebase.com>
Reply-To: support@theculturebase.com
To: user@example.com
Subject: You're invited to join A-Player Evaluations
```

---

### **Phase 3: Verification & Monitoring**

#### **Success Criteria:**
- ✅ **Domain Verified**: Resend dashboard shows "Verified" status
- ✅ **SMTP Working**: No "AuthApiError" in Supabase logs
- ✅ **Email Delivery**: Test emails arrive in inbox (not spam)
- ✅ **Professional Branding**: Emails from info@theculturebase.com
- ✅ **Reply-To Configuration**: Separate reply address for customer support
- ✅ **Unlimited Sending**: No rate limit restrictions

#### **Monitoring Points:**
1. **Resend Dashboard**: Activity logs for email delivery status
2. **Supabase Logs**: Functions → create-invite → No SMTP errors
3. **Email Deliverability**: Test emails to different providers (Gmail, Outlook, etc.)

---

## 🚨 **Troubleshooting Guide**

### **Issue 1: Domain Not Verifying**
**Symptoms**: Resend shows "Pending" status after 2+ hours
**Solutions**:
1. Verify DNS records are added correctly (no typos)
2. Check DNS propagation: [dnschecker.org](https://dnschecker.org)
3. Contact domain provider for DNS configuration help

### **Issue 2: SMTP Authentication Errors**
**Symptoms**: "AuthApiError: Error sending invite email"
**Solutions**:
1. Verify domain is fully verified in Resend
2. Double-check SMTP credentials in Supabase
3. Try port 587 instead of 465
4. Regenerate Resend API key if needed

### **Issue 3: Emails Going to Spam**
**Symptoms**: Emails delivered but in spam folder
**Solutions**:
1. Verify SPF/DKIM records are properly configured
2. Add DMARC policy (already included in DNS records)
3. Ask recipients to mark as "Not Spam" initially
4. Monitor Resend deliverability reports

---

## 📊 **Current Configuration**

### **Resend Settings:**
- **API Key**: `re_jiGEM9YN_A94SoB2B49kYqzbpMmECzYQW`
- **Domain**: `theculturebase.com` (pending verification)
- **SMTP Host**: `smtp.resend.com`
- **Port**: `465` (SSL/TLS)

### **Supabase Edge Function:**
- **Function**: `create-invite`
- **Method**: `admin.auth.admin.inviteUserByEmail()`
- **Status**: ✅ Deployed and functional
- **Issue**: SMTP configuration causing email send failures

### **Frontend Integration:**
- **Component**: `InviteManager.tsx`
- **Location**: Assignment Management → Company Invitations tab
- **Status**: ✅ Functional (UI working, backend email issue)

---

## 🎯 **Next Actions**

### **Immediate (Upon DNS Configuration):**
1. **Verify domain** in Resend dashboard
2. **Update SMTP settings** in Supabase
3. **Test invite flow** end-to-end
4. **Document success** or additional troubleshooting needed

### **Post-Implementation:**
1. **Monitor email deliverability** for first week
2. **Collect user feedback** on email reception
3. **Optimize email templates** if needed
4. **Set up email analytics** in Resend dashboard

---

## 📞 **Contacts & Resources**

### **Technical Resources:**
- **Resend Documentation**: [resend.com/docs](https://resend.com/docs)
- **Supabase SMTP Guide**: [supabase.com/docs/guides/auth/auth-smtp](https://supabase.com/docs/guides/auth/auth-smtp)
- **DNS Propagation Check**: [dnschecker.org](https://dnschecker.org)

### **Implementation Owner:**
- **Developer**: [Your Name]
- **Domain Administrator**: [Boss/IT Team]
- **Testing**: [Your Name]

---

## 📈 **Expected Benefits**

### **Professional Appearance:**
- ✅ Emails from `A-Player Evaluations <info@theculturebase.com>`
- ✅ Configurable reply-to addresses for customer support
- ✅ Professional domain authentication via DNS records
- ✅ Improved brand recognition and trust
- ✅ Consistent company branding across communications

### **Technical Improvements:**
- ✅ Unlimited email sending (vs. 2/hour current limit)
- ✅ Better deliverability (less spam filtering)
- ✅ Proper email authentication (SPF, DKIM, DMARC)
- ✅ Email tracking and analytics via Resend

### **Business Impact:**
- ✅ Professional employee onboarding experience
- ✅ Reliable invite delivery for all users
- ✅ Scalable email system for company growth
- ✅ Enhanced security and compliance

---

**Document Created**: February 14, 2025  
**Last Updated**: February 14, 2025  
**Status**: Awaiting DNS configuration  
**Priority**: High - Required for production email functionality
