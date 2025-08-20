// InviteManager Component
// Purpose: Allow company admins to send invites to new users
// Uses: New invite system with Edge Functions + people.jwt_role authorization
// Date: February 1, 2025

import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useCompany } from '../../contexts/CompanyContext';
import { LoadingSpinner, Button, Card } from './index';
import { BulkInviteUpload } from './BulkInviteUpload';
import type { BulkInviteResult } from '../../services/csvTemplateService';

interface InviteRecord {
  id: string;
  email: string;
  role_to_assign: string;
  position?: string;
  jwt_role?: string;
  inviter_name?: string;
  created_at: string;
  expires_at: string;
  claimed_at: string | null;
  revoked_at: string | null;
}

interface InviteFormData {
  email: string;
  role_to_assign: 'admin' | 'member';  // Only manager/peer roles allowed
  position: string;
  jwt_role?: 'hr_admin' | 'super_admin' | '';
  company_id?: string;  // For super admin company selection
}

export const InviteManager: React.FC = () => {
  const { user } = useAuth();
  const { selectedCompanyId, companies, loading: companyLoading } = useCompany();
  const [invites, setInvites] = useState<InviteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');
  const [bulkResults, setBulkResults] = useState<BulkInviteResult[]>([]);
  
  const [formData, setFormData] = useState<InviteFormData>({
    email: '',
    role_to_assign: 'member',
    position: '',
    jwt_role: '',
    company_id: ''
  });

  // Check if user has admin permissions
  const isAdmin = user?.jwtRole === 'super_admin' || user?.jwtRole === 'hr_admin';
  const isSuperAdmin = user?.jwtRole === 'super_admin';

  // Load existing invites when company context is ready
  useEffect(() => {
    if (isAdmin && !companyLoading && selectedCompanyId) {
      loadInvites();
    } else if (!isAdmin) {
      setLoading(false);
    }
  }, [isAdmin, companyLoading, selectedCompanyId]);

  // Update form data when selected company changes
  useEffect(() => {
    if (selectedCompanyId) {
      setFormData(prev => ({ ...prev, company_id: selectedCompanyId }));
    }
  }, [selectedCompanyId]);



  const loadInvites = async () => {
    try {
      setError(null);
      
      if (!selectedCompanyId) {
        console.log('No company selected, skipping invite loading');
        setInvites([]);
        setLoading(false);
        return;
      }

      console.log(`Loading invites for company: ${selectedCompanyId}`);
      
      // Use direct Supabase query with explicit company filtering
      const { data: invitesData, error: invitesError } = await supabase
        .from('invites')
        .select(`
          id,
          email,
          role_to_assign,
          position,
          jwt_role,
          inviter_name,
          created_at,
          expires_at,
          claimed_at,
          revoked_at
        `)
        .eq('company_id', selectedCompanyId)
        .order('created_at', { ascending: false });

      if (invitesError) {
        console.error('Error loading invites:', invitesError);
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
            position,
            jwt_role,
            inviter_name,
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
      let targetCompanyId: string;

      // For super admins, use selected company_id or fall back to user's company
      if (isSuperAdmin && formData.company_id) {
        targetCompanyId = formData.company_id;
      } else {
        // Get user's company from people table for regular admins
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

        targetCompanyId = peopleData.company_id;
      }

      // Call create-invite Edge Function
      console.log('Calling create-invite with:', {
        company_id: targetCompanyId,
        email: formData.email.trim().toLowerCase(),
        role_to_assign: formData.role_to_assign,
        position: formData.position || undefined,
        jwt_role: formData.jwt_role || undefined
      });

      const { data, error } = await supabase.functions.invoke('create-invite', {
        body: {
          company_id: targetCompanyId,
          email: formData.email.trim().toLowerCase(),
          role_to_assign: formData.role_to_assign,
          position: formData.position.trim() || undefined,
          jwt_role: formData.jwt_role || undefined
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
      setFormData({ 
        email: '', 
        role_to_assign: 'member', 
        position: '', 
        jwt_role: '',
        company_id: isSuperAdmin ? (companies[0]?.id || '') : ''
      });
      
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
      
      // Update invite with company_id filter to ensure tenant isolation
      const { error } = await supabase
        .from('invites')
        .update({ revoked_at: new Date().toISOString() })
        .eq('id', inviteId)
        .eq('company_id', selectedCompanyId);

      if (error) {
        console.error('Error revoking invite:', error);
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

  const handleBulkInviteResults = (results: BulkInviteResult[]) => {
    setBulkResults(results);
    
    // Show summary
    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;
    
    if (failed === 0) {
      setSuccess(`Successfully sent ${successful} invitations!`);
      setError(null);
    } else {
      setError(`Sent ${successful} invitations, ${failed} failed. Check results below.`);
      setSuccess(null);
    }
    
    // Refresh invite list to show new invitations
    loadInvites();
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
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('single')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'single'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Single Invitation
          </button>
          <button
            onClick={() => setActiveTab('bulk')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'bulk'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Bulk Upload
          </button>
        </nav>
      </div>

      {/* Global Success/Error Messages */}
      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {success && (
        <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'single' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Send Company Invitation</h3>

          <form onSubmit={sendInvite} className="space-y-4">
          {/* Company Selection for Super Admins */}
          {isSuperAdmin && (
            <div>
              <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                Target Company *
              </label>
              {companyLoading ? (
                <div className="flex items-center space-x-2">
                  <LoadingSpinner size="sm" />
                  <span className="text-sm text-gray-600">Loading companies...</span>
                </div>
              ) : (
                <select
                  id="company"
                  value={formData.company_id || ''}
                  onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={submitting || companies.length === 0}
                  required
                >
                  {!formData.company_id && <option value="">Select Company</option>}
                  {companies.map(company => (
                    <option key={company.id} value={company.id}>{company.name}</option>
                  ))}
                </select>
              )}
              <p className="text-sm text-gray-500 mt-1">
                As a super admin, you can invite users to any company you oversee.
              </p>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address *
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
            <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
              Position/Title *
            </label>
            <input
              id="position"
              type="text"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Software Engineer, Manager, etc."
              required
              disabled={submitting}
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              Company Role *
            </label>
            <select
              id="role"
              value={formData.role_to_assign}
              onChange={(e) => setFormData({ ...formData, role_to_assign: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={submitting}
            >
              <option value="member">Peer</option>
              <option value="admin">Manager</option>
            </select>
            <p className="text-sm text-gray-500 mt-1">
              <strong>Peer:</strong> Standard access, can view and edit assigned data<br/>
              <strong>Manager:</strong> Administrative access, can manage data and users
            </p>
          </div>

          {isSuperAdmin && (
            <div>
              <label htmlFor="jwt_role" className="block text-sm font-medium text-gray-700 mb-1">
                Admin Permissions (Optional)
              </label>
              <select
                id="jwt_role"
                value={formData.jwt_role || ''}
                onChange={(e) => setFormData({ ...formData, jwt_role: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={submitting}
              >
                <option value="">No admin access</option>
                <option value="hr_admin">HR Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
              <p className="text-sm text-gray-500 mt-1">
                Admin permissions allow managing invites and users. Only super admins can assign these roles.
              </p>
            </div>
          )}

          <Button
            type="submit"
            disabled={
              submitting || 
              !formData.email.trim() || 
              !formData.position.trim() ||
              (isSuperAdmin && !formData.company_id)
            }
            className="w-full"
          >
            {submitting ? 'Sending Invite...' : 'Send Invitation'}
          </Button>
        </form>
        </Card>
      )}

      {activeTab === 'bulk' && (
        <BulkInviteUpload
          onInvitesSent={handleBulkInviteResults}
          companies={companies}
          selectedCompanyId={selectedCompanyId || undefined}
          isSuperAdmin={isSuperAdmin}
        />
      )}

      {/* Bulk Results Display */}
      {bulkResults.length > 0 && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Bulk Invitation Results</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setBulkResults([])}
            >
              Clear Results
            </Button>
          </div>
          
          <div className="space-y-2">
            {bulkResults.map((result, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  result.success
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="font-medium">{result.email}</span>
                      <span className={`text-sm ${
                        result.success ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {result.success ? '✓ Sent' : '✗ Failed'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      <span><strong>Company Role:</strong> {result.company_role}</span>
                      <span className="ml-4"><strong>Position:</strong> {result.position}</span>
                      {result.jwt_role && (
                        <span className="ml-4"><strong>Admin Role:</strong> {result.jwt_role}</span>
                      )}
                    </div>
                    {!result.success && result.error && (
                      <div className="text-sm text-red-600 mt-1">{result.error}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-700">
              <strong>Summary:</strong> {bulkResults.filter(r => r.success).length} successful, {bulkResults.filter(r => !r.success).length} failed out of {bulkResults.length} total invitations
            </div>
          </div>
        </Card>
      )}

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
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      <div className="flex flex-wrap gap-4">
                        <span><strong>Role:</strong> {invite.role_to_assign}</span>
                        {invite.position && (
                          <span><strong>Position:</strong> {invite.position}</span>
                        )}
                        {invite.jwt_role && (
                          <span><strong>Admin:</strong> {invite.jwt_role}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {invite.inviter_name && (
                        <span>Invited by: {invite.inviter_name} • </span>
                      )}
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
