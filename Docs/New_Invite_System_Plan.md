# New Invite System Implementation Plan
**Date:** February 1, 2025  
**Based on:** Supabase Best Practices & Current Multi-Tenant Architecture  
**Status:** Implementation Ready

## 🎯 Implementation Strategy

### **Approach: One-Time Invite Links (Supabase Recommended)**
- **Authentication:** Disable public signups, invite-only access
- **Authorization:** Company-scoped invites using existing RLS system  
- **Security:** `auth.admin.generateLink` with single-use tokens
- **Integration:** Leverages existing `companies`, `profiles`, `company_memberships` tables

## 🏗️ Architecture Overview

### **Current Foundation (✅ Already Perfect)**
```sql
-- Multi-tenant structure already in place
companies (id, name, slug, created_at, updated_at)
profiles (id → auth.users, email, default_company_id, created_at, updated_at)  
company_memberships (company_id, profile_id, role, created_at, updated_at)
```

### **New Components Needed**
```sql
-- Single-use invite tokens (new table)
invites (id, company_id, email, role_to_assign, token, expires_at, claimed_at, created_by)

-- Edge Functions (new)
/functions/create-invite/     -- Admin creates invite + sends email
/functions/accept-invite/     -- User accepts invite + joins company
```

## 📋 Implementation Steps

### **Step 1: Database Schema (10 minutes)**
```sql
-- Simple invites table leveraging existing company structure
CREATE TABLE public.invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  email TEXT NOT NULL CHECK (email ~ '^[^@]+@[^@]+\.[^@]+$'),
  role_to_assign public.company_role NOT NULL DEFAULT 'member',
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  claimed_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_by UUID NOT NULL, -- references profiles.id of inviter
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### **Step 2: RLS Policies (5 minutes)**
```sql
-- Company-scoped access using existing patterns
ENABLE ROW LEVEL SECURITY ON public.invites;

-- Only company admins can view/create invites for their company
CREATE POLICY "company_admin_invites" ON public.invites
  USING (
    company_id IN (
      SELECT cm.company_id FROM public.company_memberships cm
      JOIN public.profiles p ON p.id = cm.profile_id
      WHERE p.id = auth.uid() AND cm.role IN ('owner','admin')
    )
  );
```

### **Step 3: Edge Functions (30 minutes)**

#### **`/functions/create-invite/index.ts`**
```typescript
import { createClient } from '@supabase/supabase-js'

Deno.serve(async (req) => {
  const { company_id, email, role_to_assign } = await req.json()

  // 1) User-context client (validates company admin via RLS)
  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
  )
  
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  // Verify admin role in company (RLS enforced)
  const { data: membership } = await userClient
    .from('company_memberships')
    .select('role')
    .eq('company_id', company_id)
    .eq('profile_id', user.id)
    .in('role', ['owner','admin'])
    .maybeSingle()
  if (!membership) return new Response('Forbidden', { status: 403 })

  // 2) Admin client for generating invite link
  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Generate secure token and invite link
  const token = crypto.randomUUID().replace(/-/g, '')
  const emailRedirectTo = `https://yourapp.com/accept-invite?token=${token}`

  const { data: linkData, error } = await admin.auth.admin.generateLink({
    type: 'invite',
    email,
    options: { emailRedirectTo }
  })
  if (error) return new Response(error.message, { status: 500 })

  // Store invite record
  const expires = new Date(Date.now() + 1000*60*60*24*7) // 7 days
  const { error: inviteError } = await admin.from('invites').insert({
    company_id, email, role_to_assign, token, expires_at: expires, created_by: user.id
  })
  if (inviteError) return new Response(inviteError.message, { status: 500 })

  return new Response(JSON.stringify({ 
    success: true, 
    action_link: linkData?.properties?.action_link 
  }))
})
```

#### **`/functions/accept-invite/index.ts`**
```typescript
import { createClient } from '@supabase/supabase-js'

Deno.serve(async (req) => {
  const url = new URL(req.url)
  const token = url.searchParams.get('token')
  if (!token) return new Response('Missing token', { status: 400 })

  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
  )

  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Validate invite token
  const { data: invite, error } = await admin
    .from('invites')
    .select('*')
    .eq('token', token)
    .is('claimed_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()
  
  if (error || !invite) return new Response('Invalid/expired invite', { status: 400 })

  // Verify email matches
  if (user.email?.toLowerCase() !== invite.email.toLowerCase()) {
    return new Response('Email mismatch', { status: 403 })
  }

  // Add company membership
  const { error: membershipError } = await admin.from('company_memberships').upsert({
    company_id: invite.company_id,
    profile_id: user.id, 
    role: invite.role_to_assign,
    joined_at: new Date().toISOString()
  })
  if (membershipError) return new Response(membershipError.message, { status: 500 })

  // Mark invite as claimed
  await admin.from('invites')
    .update({ claimed_at: new Date().toISOString() })
    .eq('id', invite.id)

  return new Response(JSON.stringify({ success: true, redirectTo: '/dashboard' }))
})
```

### **Step 4: Frontend Components (20 minutes)**

#### **`InviteManager.tsx`** (Admin UI)
```typescript
import React, { useState } from 'react'
import { supabase } from '../services/supabase'

export const InviteManager: React.FC = () => {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'member'>('member')
  const [loading, setLoading] = useState(false)

  const sendInvite = async () => {
    setLoading(true)
    try {
      // Get current company from user's profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('default_company_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single()

      // Call create-invite Edge Function
      const { data, error } = await supabase.functions.invoke('create-invite', {
        body: {
          company_id: profile?.default_company_id,
          email,
          role_to_assign: role
        }
      })

      if (error) throw error
      
      alert('Invite sent successfully!')
      setEmail('')
    } catch (error) {
      alert(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Invite New User</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="user@company.com"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'admin' | 'member')}
            className="w-full border rounded px-3 py-2"
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        
        <button
          onClick={sendInvite}
          disabled={loading || !email}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send Invite'}
        </button>
      </div>
    </div>
  )
}
```

#### **`AcceptInvite.tsx`** (Acceptance Page)
```typescript
import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'

export const AcceptInvite: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  
  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setStatus('error')
      return
    }

    const acceptInvite = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('accept-invite', {
          body: { token }
        })
        
        if (error) throw error
        
        setStatus('success')
        setTimeout(() => navigate('/dashboard'), 2000)
      } catch (error) {
        console.error('Invite acceptance failed:', error)
        setStatus('error')
      }
    }

    acceptInvite()
  }, [searchParams, navigate])

  if (status === 'loading') {
    return <div className="flex justify-center p-8">Processing invite...</div>
  }

  if (status === 'success') {
    return (
      <div className="flex justify-center p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-green-600 mb-2">Welcome!</h2>
          <p>You've successfully joined the company. Redirecting...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-center p-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-2">Invalid Invite</h2>
        <p>This invite link is invalid or has expired.</p>
      </div>
    </div>
  )
}
```

## 🔒 Security Features

### **✅ Multi-Level Protection**
1. **Company Isolation**: RLS policies prevent cross-company access
2. **Role Validation**: Only company admins can create invites  
3. **Email Verification**: Supabase confirms email before account creation
4. **Token Security**: Single-use, time-limited invite tokens
5. **Service Role Protection**: Admin functions server-side only

### **✅ Supabase Best Practices**
- ✅ Uses `auth.admin.generateLink` (recommended approach)
- ✅ RLS policies with `auth.uid()` checks
- ✅ Database roles stored and validated via joins
- ✅ No client-side service role usage
- ✅ Proper JWT validation in Edge Functions

## 📚 Integration with Current System

### **✅ Zero Breaking Changes**
- Leverages existing `companies`, `profiles`, `company_memberships` tables
- Uses existing RLS patterns and helper functions
- Maintains current JWT role system (`super_admin`, `hr_admin`, `member`)
- No changes to current auth flow for existing users

### **✅ Enhanced Capabilities**
- Company admins can invite users to their organization
- Secure, single-use invite links with email verification
- Automatic company membership assignment upon acceptance
- Full audit trail of invite creation and acceptance

## 🚀 Implementation Timeline

**Total Estimated Time: ~65 minutes**

1. **Database Schema** (10 min) - Create `invites` table + RLS policies
2. **Edge Functions** (30 min) - Create invite generation and acceptance functions  
3. **Frontend Components** (20 min) - InviteManager + AcceptInvite pages
4. **Testing & Integration** (5 min) - Add routes and test flow

## ✨ Benefits Over Previous System

- **Supabase Native**: Uses recommended patterns and APIs
- **More Secure**: Single-use tokens, proper email verification
- **Better UX**: Standard email invite flow users expect
- **Maintainable**: Simpler code, fewer custom components
- **Scalable**: Built on proven Supabase multi-tenant patterns
