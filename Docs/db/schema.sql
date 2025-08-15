-- Database Schema Dump
-- A-Player Evaluation System - Multi-Tenant Architecture
-- Generated: February 1, 2025
-- Database: PostgreSQL 15.8 (Supabase)
-- Migration Status: 0004 Applied

-- =============================================================================
-- CUSTOM TYPES
-- =============================================================================

-- Company role hierarchy for access control
CREATE TYPE public.company_role AS ENUM (
    'owner',    -- Full access, can manage company settings and memberships
    'admin',    -- Administrative access, can manage data and users  
    'member',   -- Standard access, can view and edit assigned data
    'viewer'    -- Read-only access to company data
);

-- Evaluation types for different assessment perspectives
CREATE TYPE public.evaluation_type_enum AS ENUM (
    'peer',     -- Peer-to-peer evaluation
    'manager',  -- Manager evaluating employee
    'self'      -- Self-evaluation
);

-- Assignment status tracking
CREATE TYPE public.assignment_status_enum AS ENUM (
    'pending',      -- Assignment created but not started
    'in_progress',  -- Evaluation in progress
    'completed'     -- Evaluation completed
);

-- =============================================================================
-- CORE MULTI-TENANCY TABLES
-- =============================================================================

-- Companies: Core tenant table for data isolation
CREATE TABLE public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE CHECK (length(trim(name)) > 0),
    slug TEXT GENERATED ALWAYS AS (
        regexp_replace(
            regexp_replace(lower(trim(name)), '[^a-z0-9\s-]', '', 'g'),
            '\s+', '-', 'g'
        )
    ) STORED UNIQUE,
    description TEXT,
    website TEXT,
    logo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ NULL
);

-- Profiles: Enhanced user profiles extending Supabase auth.users
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    default_company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    timezone TEXT DEFAULT 'UTC',
    locale TEXT DEFAULT 'en',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_seen_at TIMESTAMPTZ
);

-- Company Memberships: Role-based access control within companies
CREATE TABLE public.company_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role public.company_role NOT NULL DEFAULT 'member',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    invited_at TIMESTAMPTZ,
    invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    deactivated_at TIMESTAMPTZ,
    deactivated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    
    UNIQUE(company_id, profile_id)
);

-- Additional core tables defined...
-- See full schema in Docs/Supabase_Database_Structure.md for complete reference

-- =============================================================================
-- NOTES
-- =============================================================================

-- This is a condensed schema representation.
-- For the complete schema including all tables, indexes, triggers, and RLS policies:
-- 1. Run: make schema (with DATABASE_URL set)
-- 2. Or see: Docs/Supabase_Database_Structure.md for detailed reference
-- 3. Or check: docs/db/overview.md for table summaries
