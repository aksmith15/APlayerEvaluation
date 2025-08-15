// InviteManager Component
// Purpose: Allow company admins to send invites to new users
// Uses: New invite system with Edge Functions + people.jwt_role authorization
// Date: February 1, 2025

import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner, Button, Card } from './index';
// Tenancy support
import { fromTenantSafe } from '../../lib/db';
import { logTenancyEvent } from '../../lib/monitoring';

interface InviteRecord {
  id: string;
  email: string;
  role_to_assign: string;
  created_at: string;
  expires_at: string;
  claimed_at: string | null;
  revoked_at: string | null;
}

interface InviteFormData {
  email: string;
  role_to_assign: 'admin' | 'member' | 'viewer';
}

export const InviteManager: React.FC = () => {
  const { user } = useAuth();
  const [invites, setInvites] = useState<InviteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<InviteFormData>({
    email: '',
    role_to_assign: 'member'
  });

  // Check if user has admin permissions
  const isAdmin = user?.jwtRole === 'super_admin' || user?.jwtRole === 'hr_admin';

  // Load existing invites on component mount
  useEffect(() => {
    if (isAdmin) {
      loadInvites();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  const loadInvites = async () => {
    try {
      setError(null);
      
      // NEW: Use tenant-aware query for invites (company_id automatically filtered)
      const { data: invitesData, error: invitesError } = await fromTenantSafe(supabase, 'invites')
        .select(`
          id,
          email,
          role_to_assign,
          created_at,
          expires_at,
          claimed_at,
          revoked_at
        `)
        .order('created_at', { ascending: false });

      if (invitesError) {
        logTenancyEvent({
          type: 'RLS_ERROR',
          operation: 'loadInvites',
          table: 'invites',
          error: invitesError
        });
        throw invitesError;
      }

      setInvites((invitesData as InviteRecord[]) || []);
      
    } catch (err: any) {
      console.error('Failed to load invites:', err);
      setError(`Failed to load invites: ${err.message}`);
      
      // Fallback to manual company lookup for compatibility
      try {
        console.warn('Falling back to manual company lookup for invites...');
        
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        const { data: peopleData, error: peopleError } = await supabase
          .from('people')
          .select('company_id')
          .eq('email', authUser?.email)
          .eq('active', true)
          .single();

        if (peopleError || !peopleData?.company_id) {
          throw new Error('Unable to determine company context');
        }

        const { data: invitesData, error: invitesError } = await supabase
          .from('invites')
          .select(`
            id,
            email,
            role_to_assign,
            created_at,
            expires_at,
            claimed_at,
            revoked_at
          `)
          .eq('company_id', peopleData.company_id)
          .order('created_at', { ascending: false });

        if (invitesError) {
          throw invitesError;
        }

        setInvites((invitesData as InviteRecord[]) || []);
        setError(null); // Clear error if fallback succeeded
        
      } catch (fallbackErr: any) {
        console.error('Fallback invite loading also failed:', fallbackErr);
        setError(`Failed to load invites: ${fallbackErr.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const sendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email.trim()) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // Get user's company from people table
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      const { data: peopleData, error: peopleError } = await supabase
        .from('people')
        .select('company_id')
        .eq('email', authUser?.email)
        .eq('active', true)
        .single();

      if (peopleError || !peopleData?.company_id) {
        throw new Error('Unable to determine company context');
      }

      // Call create-invite Edge Function
      console.log('Calling create-invite with:', {
        company_id: peopleData.company_id,
        email: formData.email.trim().toLowerCase(),
        role_to_assign: formData.role_to_assign
      });

      const { data, error } = await supabase.functions.invoke('create-invite', {
        body: {
          company_id: peopleData.company_id,
          email: formData.email.trim().toLowerCase(),
          role_to_assign: formData.role_to_assign
        }
      });

      console.log('create-invite response:', { data, error });

      if (error) {
        console.error('Function invoke error:', error);
        
        // Handle specific HTTP status codes
        if (error.message && error.message.includes('non-2xx status code')) {
          // Try to get more details from the response
          const response = error.context || error.details;
          
          // Check if it's a 409 conflict (duplicate invite)
          if (response && response.status === 409) {
            throw new Error(`This email already has a pending invitation. Please check the "Sent Invitations" list below and revoke the existing invite if needed, then try again.`);
          }
          
          throw new Error(`Server error occurred. Please try again or contact support if the problem persists.`);
        }
        
        // Try to extract more detailed error information
        const errorMessage = error.message || 'Function invocation failed';
        const errorDetails = error.context || error.details || 'No additional details';
        throw new Error(`${errorMessage} - ${errorDetails}`);
      }

      if (data?.error) {
        console.error('Function returned error:', data);
        // Show the detailed error from our enhanced function
        const debugInfo = data.debug ? `\nDebug: ${JSON.stringify(data.debug, null, 2)}` : '';
        throw new Error(`${data.error}${debugInfo}`);
      }

      setSuccess(`Invite sent successfully to ${formData.email}!`);
      setFormData({ email: '', role_to_assign: 'member' });
      
      // Reload invites to show the new one
      await loadInvites();
      
    } catch (err: any) {
      console.error('Failed to send invite:', err);
      
      // Handle specific error cases with helpful messages
      let errorMessage = err.message || 'Unknown error';
      
      if (errorMessage.includes('non-2xx status code')) {
        // This is likely a 409 conflict for duplicate invites
        errorMessage = 'This email already has a pending invitation. Please check the "Sent Invitations" list below and revoke the existing invite if needed, then try again.';
      }
      
      setError(`Failed to send invite: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  const revokeInvite = async (inviteId: string) => {
    if (!confirm('Are you sure you want to revoke this invite?')) return;

    try {
      setError(null);
      
      // NEW: Use tenant-aware update (automatically adds company_id filter)
      const { error } = await fromTenantSafe(supabase, 'invites')
        .update({ revoked_at: new Date().toISOString() })
        .eq('id', inviteId);

      if (error) {
        if (error.code === '42501') {
          logTenancyEvent({
            type: 'CROSS_TENANT_ATTEMPT',
            operation: 'revokeInvite',
            table: 'invites',
            context: { inviteId },
            error
          });
          throw new Error('You can only revoke invites from your company.');
        }
        
        logTenancyEvent({
          type: 'RLS_ERROR',
          operation: 'revokeInvite',
          table: 'invites',
          error
        });
        throw error;
      }

      setSuccess('Invite revoked successfully');
      await loadInvites();
      
    } catch (err: any) {
      console.error('Failed to revoke invite:', err);
      setError(`Failed to revoke invite: ${err.message}`);
    }
  };

  const getInviteStatus = (invite: InviteRecord) => {
    if (invite.revoked_at) return 'Revoked';
    if (invite.claimed_at) return 'Accepted';
    if (new Date(invite.expires_at) < new Date()) return 'Expired';
    return 'Pending';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Accepted': return 'text-green-600 bg-green-100';
      case 'Pending': return 'text-yellow-600 bg-yellow-100';
      case 'Expired': return 'text-gray-600 bg-gray-100';
      case 'Revoked': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (!isAdmin) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-600">
          <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
          <p>Only company administrators can manage invitations.</p>
          <p className="text-sm mt-2">Required role: super_admin or hr_admin</p>
        </div>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="p-6">
        <LoadingSpinner message="Loading invite manager..." />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Send Invite Form */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Send Company Invitation</h3>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}

        <form onSubmit={sendInvite} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="user@company.com"
              required
              disabled={submitting}
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              Role Assignment
            </label>
            <select
              id="role"
              value={formData.role_to_assign}
              onChange={(e) => setFormData({ ...formData, role_to_assign: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={submitting}
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>

          <Button
            type="submit"
            disabled={submitting || !formData.email.trim()}
            className="w-full"
          >
            {submitting ? 'Sending Invite...' : 'Send Invitation'}
          </Button>
        </form>
      </Card>

      {/* Existing Invites */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Sent Invitations</h3>
          <Button
            onClick={loadInvites}
            variant="ghost"
            size="sm"
            disabled={loading}
          >
            Refresh
          </Button>
        </div>

        {invites.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No invitations have been sent yet.
          </div>
        ) : (
          <div className="space-y-3">
            {invites.map((invite) => {
              const status = getInviteStatus(invite);
              const canRevoke = status === 'Pending';
              
              return (
                <div
                  key={invite.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="font-medium">{invite.email}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                        {status}
                      </span>
                      <span className="text-sm text-gray-500">
                        Role: {invite.role_to_assign}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Sent: {new Date(invite.created_at).toLocaleDateString()}
                      {status === 'Pending' && (
                        <span> • Expires: {new Date(invite.expires_at).toLocaleDateString()}</span>
                      )}
                      {invite.claimed_at && (
                        <span> • Accepted: {new Date(invite.claimed_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>

                  {canRevoke && (
                    <Button
                      onClick={() => revokeInvite(invite.id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Revoke
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};
