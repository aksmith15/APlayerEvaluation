import { supabase } from './supabase';
import { API_ENDPOINTS } from '../constants/config';
import type { WeightedEvaluationScore, Person, QuarterlyTrendData, QuarterOption } from '../types/database';
import type { Employee, Quarter, WebhookPayload, AIAnalysisResult } from '../types/evaluation';

// Data fetching utilities

export const fetchEmployees = async (): Promise<Employee[]> => {
  try {
    console.log('Fetching employees from people table...');
    
    // Get all active employees (simplified version)
    const { data: people, error: peopleError } = await supabase
      .from('people')
      .select('*')
      .eq('active', true)
      .order('name');

    if (peopleError) {
      console.error('Error fetching people:', peopleError);
      throw peopleError;
    }

    if (!people || people.length === 0) {
      console.warn('No people found in database');
      return [];
    }

    console.log(`Found ${people.length} people in database`);

    // Convert to Employee format with basic data
    const employees: Employee[] = people.map((person) => ({
      ...person,
      overallScore: undefined, // We'll add score calculation later
      latestQuarter: undefined
    }));

    return employees;
  } catch (error) {
    console.error('Error fetching employees:', error);
    throw error;
  }
};

export const fetchEmployeeData = async (employeeId: string): Promise<Person | null> => {
  try {
    const { data, error } = await supabase
      .from('people')
      .select('*')
      .eq('id', employeeId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching employee data:', error);
    throw error;
  }
};

export const fetchQuarters = async (): Promise<Quarter[]> => {
  try {
    const { data, error } = await supabase
      .from('evaluation_cycles')
      .select('*')
      .order('start_date', { ascending: false });

    if (error) throw error;

    return data.map(cycle => ({
      id: cycle.id,
      name: cycle.name,
      startDate: cycle.start_date,
      endDate: cycle.end_date
    }));
  } catch (error) {
    console.error('Error fetching quarters:', error);
    throw error;
  }
};

export const fetchEvaluationScores = async (
  employeeId: string,
  quarterId?: string
): Promise<WeightedEvaluationScore[]> => {
  try {
    let query = supabase
      .from('weighted_evaluation_scores')
      .select('*')
      .eq('evaluatee_id', employeeId);

    if (quarterId) {
      query = query.eq('quarter_id', quarterId);
    }

    const { data, error } = await query.order('attribute_name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching evaluation scores:', error);
    throw error;
  }
};

export const fetchAppConfig = async (key: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('app_config')
      .select('value')
      .eq('key', key)
      .single();

    if (error) throw error;
    return data?.value || null;
  } catch (error) {
    console.error('Error fetching app config:', error);
    throw error;
  }
};

// Fetch available quarters for an employee (for quarter range selection)
export const fetchAvailableQuarters = async (employeeId?: string): Promise<QuarterOption[]> => {
  try {
    console.log(`Fetching available quarters${employeeId ? ` for employee: ${employeeId}` : ''}`);
    
    let query = supabase
      .from('quarter_final_scores')
      .select('quarter_id, quarter_name, quarter_start_date, quarter_end_date')
      .order('quarter_start_date', { ascending: true });
    
    // If employeeId provided, filter by employee to get only quarters with data for them
    if (employeeId) {
      query = query.eq('evaluatee_id', employeeId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching available quarters:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.warn(`No quarters found${employeeId ? ` for employee: ${employeeId}` : ''}`);
      return [];
    }

    // Remove duplicates and format for dropdown
    const uniqueQuarters = data.reduce((acc: QuarterOption[], quarter) => {
      const existing = acc.find(q => q.quarter_id === quarter.quarter_id);
      if (!existing) {
        acc.push({
          quarter_id: quarter.quarter_id,
          quarter_name: quarter.quarter_name,
          quarter_start_date: quarter.quarter_start_date,
          quarter_end_date: quarter.quarter_end_date
        });
      }
      return acc;
    }, []);

    console.log(`Found ${uniqueQuarters.length} available quarters`);
    return uniqueQuarters;
  } catch (error) {
    console.error('Failed to fetch available quarters:', error);
    throw error;
  }
};

// Fetch quarterly trend data for an employee by quarter range
export const fetchQuarterlyTrendDataByRange = async (
  employeeId: string, 
  startQuarterId: string, 
  endQuarterId: string
): Promise<QuarterlyTrendData[]> => {
  try {
    console.log(`Fetching quarterly trend data for employee: ${employeeId}, quarters: ${startQuarterId} to ${endQuarterId}`);
    
    // First get the date range for the quarters
    const { data: startQuarter } = await supabase
      .from('quarter_final_scores')
      .select('quarter_start_date')
      .eq('quarter_id', startQuarterId)
      .limit(1)
      .single();
      
    const { data: endQuarter } = await supabase
      .from('quarter_final_scores')
      .select('quarter_end_date')
      .eq('quarter_id', endQuarterId)
      .limit(1)
      .single();

    if (!startQuarter || !endQuarter) {
      throw new Error('Invalid quarter range specified');
    }

    const { data, error } = await supabase
      .from('quarter_final_scores')
      .select('*')
      .eq('evaluatee_id', employeeId)
      .gte('quarter_start_date', startQuarter.quarter_start_date)
      .lte('quarter_end_date', endQuarter.quarter_end_date)
      .order('quarter_start_date', { ascending: true });

    if (error) {
      console.error('Error fetching quarterly trend data by range:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.warn(`No quarterly trend data found for employee: ${employeeId} in specified range`);
      return [];
    }

    console.log(`Found ${data.length} quarters of trend data for employee: ${employeeId}`);
    return data;
  } catch (error) {
    console.error('Failed to fetch quarterly trend data by range:', error);
    throw error;
  }
};

// Fetch quarterly trend data for an employee (for trend analysis charts) - Legacy function
export const fetchQuarterlyTrendData = async (employeeId: string, quarterCount: number = 4): Promise<QuarterlyTrendData[]> => {
  try {
    console.log(`Fetching quarterly trend data for employee: ${employeeId}, last ${quarterCount} quarters`);
    
    const { data, error } = await supabase
      .from('quarter_final_scores')
      .select('*')
      .eq('evaluatee_id', employeeId)
      .order('quarter_start_date', { ascending: true })
      .limit(quarterCount);

    if (error) {
      console.error('Error fetching quarterly trend data:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.warn(`No quarterly trend data found for employee: ${employeeId}`);
      return [];
    }

    console.log(`Found ${data.length} quarters of trend data for employee: ${employeeId}`);
    return data;
  } catch (error) {
    console.error('Error fetching quarterly trend data:', error);
    throw error;
  }
};

// Fetch historical evaluation scores across multiple quarters for comparison
export const fetchHistoricalEvaluationScores = async (
  employeeId: string, 
  startQuarterId?: string, 
  endQuarterId?: string
): Promise<any[]> => {
  try {
    console.log(`Fetching historical evaluation scores for employee: ${employeeId}`);
    
    let query = supabase
      .from('weighted_evaluation_scores')
      .select('*')
      .eq('evaluatee_id', employeeId)
      .order('quarter_start_date', { ascending: true });

    // Apply quarter range filter if provided
    if (startQuarterId && endQuarterId) {
      // Use quarter_id directly instead of date ranges to ensure exact filtering
      if (startQuarterId === endQuarterId) {
        // Same quarter selected - filter by exact quarter_id
        query = query.eq('quarter_id', startQuarterId);
      } else {
        // Different quarters - get date range for filtering
        const { data: quarterData, error: quarterError } = await supabase
          .from('evaluation_cycles')
          .select('start_date, end_date')
          .in('id', [startQuarterId, endQuarterId]);
        
        if (quarterError) throw quarterError;
        
        if (quarterData && quarterData.length >= 1) {
          const dates = quarterData.map(q => [q.start_date, q.end_date]).flat().sort();
          const startDate = dates[0];
          const endDate = dates[dates.length - 1];
          
          query = query
            .gte('quarter_start_date', startDate)
            .lte('quarter_end_date', endDate);
        }
      }
    }

    const { data, error } = await query;

    if (error) throw error;

    if (!data || data.length === 0) {
      console.warn(`No historical evaluation scores found for employee: ${employeeId}`);
      return [];
    }

    // Group data by attribute for the historical chart format
    const groupedByAttribute: Record<string, any> = {};
    
    data.forEach(score => {
      if (!groupedByAttribute[score.attribute_name]) {
        groupedByAttribute[score.attribute_name] = {
          attribute: score.attribute_name,
          quarters: []
        };
      }
      
      // Use actual quarter name from database instead of calculating from date
      // Extract short name from quarter_name (e.g., "Q2 2025" from "Q2 2025 Performance Review")
      const quarterShortName = score.quarter_name.match(/Q\d+ \d{4}/)?.[0] || score.quarter_name;
      
      groupedByAttribute[score.attribute_name].quarters.push({
        quarterId: score.quarter_id,
        quarterName: score.quarter_name,
        quarterShortName,
        managerScore: score.manager_score || 0,
        peerScore: score.peer_score || 0,
        selfScore: score.self_score || 0,
        weightedScore: score.weighted_final_score || 0,
        hasData: score.completion_percentage > 0
      });
    });

    const result = Object.values(groupedByAttribute);
    console.log(`Found ${result.length} attributes with historical data for employee: ${employeeId}`);
    return result;
  } catch (error) {
    console.error('Error fetching historical evaluation scores:', error);
    throw error;
  }
};

// Generate AI Meta-Analysis via webhook (Async with job tracking)
export const generateAIMetaAnalysis = async (
  quarterId: string, 
  evaluateeId: string
): Promise<AIAnalysisResult> => {
  try {
    console.log(`Starting AI meta-analysis for employee: ${evaluateeId}, quarter: ${quarterId}`);
    
    // First, create a job record in the database
    const jobId = crypto.randomUUID();
    
    const { error: jobError } = await supabase
      .from('analysis_jobs')
      .insert({
        id: jobId,
        evaluatee_id: evaluateeId,
        quarter_id: quarterId,
        status: 'pending',
        stage: 'Generating your meta analysis, this can take up to 10 minutes...'
      });

    if (jobError) {
      console.error('Error creating analysis job:', jobError);
      throw new Error('Failed to initialize analysis job');
    }

    // Fetch the webhook URL from app_config
    const webhookUrl = await fetchAppConfig(API_ENDPOINTS.WEBHOOK_CONFIG_KEY);
    
    if (!webhookUrl) {
      await updateAnalysisJobStatus(jobId, 'error', 'Webhook URL not configured');
      throw new Error('Webhook URL not configured in app_config table');
    }

    // Prepare the payload with job ID
    const payload: WebhookPayload & { jobId: string } = {
      quarterId,
      evaluateeId,
      jobId
    };

    console.log('Sending async webhook request to:', webhookUrl);
    console.log('Payload:', payload);

    // Send webhook request (fire and forget for async processing)
    fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    }).catch(error => {
      console.error('Webhook request failed:', error);
      updateAnalysisJobStatus(jobId, 'error', undefined, undefined, `Webhook request failed: ${error.message}`);
    });

    // Return immediately with job ID for polling
    return {
      jobId,
      status: 'pending',
      stage: 'Generating your meta analysis, this can take up to 10 minutes...'
    };

  } catch (error) {
    console.error('Error starting AI meta-analysis:', error);
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Check the status of an analysis job
export const checkAnalysisJobStatus = async (jobId: string): Promise<AIAnalysisResult> => {
  try {
    const { data, error } = await supabase
      .from('analysis_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch job status: ${error.message}`);
    }

    if (!data) {
      throw new Error('Analysis job not found');
    }

    return {
      jobId,
      status: data.status,
      stage: data.stage || '',
      url: data.pdf_url || undefined,
      error: data.error_message || undefined
    };

  } catch (error) {
    console.error('Error checking analysis job status:', error);
    return {
      jobId,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Update analysis job status (simplified - used by webhook)
export const updateAnalysisJobStatus = async (
  jobId: string,
  status: 'pending' | 'processing' | 'completed' | 'error',
  stage?: string,
  pdfUrl?: string,
  errorMessage?: string
): Promise<void> => {
  try {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (stage) updateData.stage = stage;
    if (pdfUrl) updateData.pdf_url = pdfUrl;
    if (errorMessage) updateData.error_message = errorMessage;
    if (status === 'completed') updateData.completed_at = new Date().toISOString();

    const { error } = await supabase
      .from('analysis_jobs')
      .update(updateData)
      .eq('id', jobId);

    if (error) {
      console.error('Error updating analysis job status:', error);
    }
  } catch (error) {
    console.error('Error updating analysis job status:', error);
  }
};

// Poll for analysis completion with exponential backoff
export const pollAnalysisCompletion = async (
  jobId: string,
  onProgress?: (result: AIAnalysisResult) => void,
  maxWaitTime: number = 15 * 60 * 1000 // 15 minutes
): Promise<AIAnalysisResult> => {
  const startTime = Date.now();
  let delay = 2000; // Start with 2 seconds
  const maxDelay = 30000; // Max 30 seconds between polls

  while (Date.now() - startTime < maxWaitTime) {
    const result = await checkAnalysisJobStatus(jobId);
    
    // Call progress callback if provided
    if (onProgress) {
      onProgress(result);
    }

    // Return if completed or errored
    if (result.status === 'completed' || result.status === 'error') {
      return result;
    }

    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Exponential backoff with max delay
    delay = Math.min(delay * 1.2, maxDelay);
  }

  // Timeout reached
  return {
    jobId,
    status: 'error',
    error: 'Analysis timeout - process is taking longer than expected'
  };
};

// Public API endpoint for n8n workflow to update job status
// This can be called via HTTP from the n8n workflow
export const handleJobStatusUpdate = async (payload: {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress?: number;
  stage?: string;
  pdfUrl?: string;
  errorMessage?: string;
}): Promise<{ success: boolean; message: string }> => {
  try {
    console.log('Received job status update:', payload);
    
    await updateAnalysisJobStatus(
      payload.jobId,
      payload.status,
      payload.stage,
      payload.pdfUrl,
      payload.errorMessage
    );

    return {
      success: true,
      message: 'Job status updated successfully'
    };
  } catch (error) {
    console.error('Error handling job status update:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}; 

// Check for existing AI analysis (completed OR in-progress) for evaluatee/quarter
export const checkExistingAnalysis = async (
  evaluateeId: string, 
  quarterId: string
): Promise<AIAnalysisResult | null> => {
  try {
    const { data, error } = await supabase
      .from('analysis_jobs')
      .select('*')
      .eq('evaluatee_id', evaluateeId)
      .eq('quarter_id', quarterId)
      .in('status', ['pending', 'processing', 'completed'])  // Check for ANY active job
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error checking for existing analysis:', error);
      return null;
    }

    if (!data) {
      return null; // No analysis found
    }

    console.log('Found existing analysis job:', data);
    
    return {
      jobId: data.id,
      status: data.status,
      stage: data.stage || (data.status === 'completed' ? 'Analysis complete!' : 'Processing...'),
      url: data.pdf_url || undefined, // Backward compatibility
      pdfData: data.pdf_data || undefined, // Base64 encoded PDF data
      pdfFilename: data.pdf_filename || undefined, // Original filename
      error: data.error_message || undefined,
      createdAt: data.created_at
    };

  } catch (error) {
    console.error('Error checking for existing analysis:', error);
    return null;
  }
};

// =============================================================================
// EMPLOYEE QUARTER NOTES SERVICES - Stage 5.6
// =============================================================================

// Fetch notes for a specific employee and quarter
export const fetchEmployeeQuarterNotes = async (
  employeeId: string, 
  quarterId: string
): Promise<string> => {
  try {
    console.log(`Fetching notes for employee: ${employeeId}, quarter: ${quarterId}`);
    
    const { data, error } = await supabase
      .from('employee_quarter_notes')
      .select('notes')
      .eq('employee_id', employeeId)
      .eq('quarter_id', quarterId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No notes found - return empty string
        console.log(`No notes found for employee: ${employeeId}, quarter: ${quarterId}`);
        return '';
      }
      throw error;
    }

    return data?.notes || '';
  } catch (error) {
    console.error('Error fetching employee quarter notes:', error);
    throw error;
  }
};

// Update or create notes for a specific employee and quarter
export const updateEmployeeQuarterNotes = async (
  employeeId: string, 
  quarterId: string, 
  notes: string,
  currentUserId: string
): Promise<void> => {
  try {
    console.log(`Updating notes for employee: ${employeeId}, quarter: ${quarterId}`);
    console.log(`Notes length: ${notes.length}, User ID: ${currentUserId}`);
    
    // ALWAYS get the current user's people table ID (not JWT user ID)
    const { data: currentUser } = await supabase.auth.getUser();
    const userEmail = currentUser?.user?.email;
    
    if (!userEmail) {
      throw new Error('No user email found');
    }
    
    // Look up the people table ID for the current user
    const { data: userProfile, error: profileError } = await supabase
      .from('people')
      .select('id')
      .eq('email', userEmail)
      .single();
    
    if (profileError || !userProfile?.id) {
      throw new Error(`Could not find people record for email: ${userEmail}`);
    }
    
    const createdByUserId = userProfile.id; // Use people table ID, not JWT user ID
    
    const noteData = {
      employee_id: employeeId,
      quarter_id: quarterId,
      notes: notes,
      created_by: createdByUserId,
      updated_at: new Date().toISOString()
    };
    
    console.log('Note data to upsert:', noteData);
    
    const { error } = await supabase
      .from('employee_quarter_notes')
      .upsert(noteData, {
        onConflict: 'employee_id,quarter_id'
      });

    if (error) {
      console.error('Notes save error:', error);
      throw error;
    }

    console.log(`Successfully updated notes for employee: ${employeeId}, quarter: ${quarterId}`);
  } catch (error) {
    console.error('Error updating employee quarter notes:', error);
    throw error;
  }
};

// =============================================================================
// PROFILE PICTURE SERVICES - Stage 5.6
// =============================================================================

// Upload profile picture to Supabase Storage
export const uploadProfilePicture = async (
  file: File, 
  employeeId: string
): Promise<string> => {
  try {
    console.log(`Uploading profile picture for employee: ${employeeId}`);
    console.log(`File details:`, { name: file.name, size: file.size, type: file.type });
    
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const fileName = `${employeeId}-${timestamp}.${fileExt}`;
    
    console.log(`Generated filename: ${fileName}`);
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('profile-pictures')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Storage upload error:', error);
      throw error;
    }

    console.log('Upload successful:', data?.path);

    // Get public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from('profile-pictures')
      .getPublicUrl(fileName);

    console.log(`Successfully uploaded profile picture: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    throw error;
  }
};

// Update employee profile picture URL in database
export const updateEmployeeProfilePicture = async (
  employeeId: string, 
  profilePictureUrl: string
): Promise<void> => {
  try {
    console.log(`Updating profile picture URL for employee: ${employeeId}`);
    console.log(`New profile picture URL: ${profilePictureUrl}`);
    
    const { error } = await supabase
      .from('people')
      .update({ profile_picture_url: profilePictureUrl })
      .eq('id', employeeId);

    if (error) {
      console.error('Profile picture update error:', error);
      throw error;
    }

    console.log(`Successfully updated profile picture URL for employee: ${employeeId}`);
  } catch (error) {
    console.error('Error updating employee profile picture:', error);
    throw error;
  }
};

// Delete profile picture from storage and database
export const deleteEmployeeProfilePicture = async (
  employeeId: string,
  currentProfileUrl?: string
): Promise<void> => {
  try {
    console.log(`Deleting profile picture for employee: ${employeeId}`);
    
    // Extract filename from URL if provided
    if (currentProfileUrl) {
      const urlParts = currentProfileUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('profile-pictures')
        .remove([fileName]);
      
      if (storageError) {
        console.warn('Error deleting from storage:', storageError);
        // Continue with database update even if storage delete fails
      }
    }
    
    // Remove URL from database
    const { error } = await supabase
      .from('people')
      .update({ profile_picture_url: null })
      .eq('id', employeeId);

    if (error) throw error;

    console.log(`Successfully deleted profile picture for employee: ${employeeId}`);
  } catch (error) {
    console.error('Error deleting employee profile picture:', error);
    throw error;
  }
}; 