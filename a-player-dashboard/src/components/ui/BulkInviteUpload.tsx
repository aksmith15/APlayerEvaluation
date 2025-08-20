// BulkInviteUpload Component
// Purpose: Handle CSV file upload and bulk invitation processing
// Date: August 19, 2025

import React, { useState, useCallback } from 'react';
import Papa from 'papaparse';
import { Button, Card, LoadingSpinner } from './index';
import { 
  generateCSVTemplate, 
  validateBulkInviteData,
  type BulkInviteRecord, 
  type BulkInviteResult,
  type Company
} from '../../services/csvTemplateService';
import { supabase } from '../../services/supabase';

// Icon components
const DownloadIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-4-4m4 4l4-4m5-8a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const UploadIcon: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const CheckIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

const XIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);

interface BulkInviteUploadProps {
  onInvitesSent: (results: BulkInviteResult[]) => void;
  companies: Company[];
  selectedCompanyId?: string;
  isSuperAdmin?: boolean;
}

export const BulkInviteUpload: React.FC<BulkInviteUploadProps> = ({
  onInvitesSent,
  companies,
  selectedCompanyId,
  isSuperAdmin = false
}) => {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<BulkInviteRecord[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [isDragOver, setIsDragOver] = useState(false);

  const downloadCSVTemplate = useCallback(() => {
    generateCSVTemplate(companies, selectedCompanyId, isSuperAdmin);
  }, [companies, selectedCompanyId, isSuperAdmin]);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file) return;

    setCsvFile(file);
    setValidationErrors([]);
    setParsedData([]);

    try {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
        complete: (results) => {
          console.log('CSV parse results:', results);
          console.log('Detected column headers:', results.meta.fields);
          console.log('Raw data rows:', results.data);

          // Check for header issues
          const expectedHeaders = isSuperAdmin 
            ? ['email', 'company_id', 'company_role', 'position', 'jwt_role']
            : ['email', 'company_id', 'company_role', 'position'];
          
          const detectedHeaders = results.meta.fields || [];
          console.log('Expected headers:', expectedHeaders);
          console.log('Detected headers:', detectedHeaders);
          
          // Check if headers were renamed due to duplicates (Papa Parse adds _1, _2, etc.)
          const hasRenamedHeaders = detectedHeaders.some(header => 
            header === '' || header.startsWith('_') || header.includes('# ')
          );
          
          if (hasRenamedHeaders) {
            setValidationErrors([
              'CSV file has duplicate or invalid column headers. This usually happens when:',
              '• The CSV was saved incorrectly from Excel/Google Sheets',
              '• There are extra empty columns',
              '• Headers are duplicated or malformed',
              '',
              'Solution: Please try one of these:',
              '1. Download a fresh CSV template and re-fill it',
              '2. Copy only the data (not headers) and paste into a fresh template',
              '3. Save the file as CSV (UTF-8) format if using Excel'
            ]);
            return;
          }

          // Check if we have the expected headers
          const missingHeaders = expectedHeaders.filter(header => !detectedHeaders.includes(header));
          if (missingHeaders.length > 0) {
            setValidationErrors([
              `Missing required column headers: ${missingHeaders.join(', ')}`,
              `Expected headers: ${expectedHeaders.join(', ')}`,
              `Found headers: ${detectedHeaders.join(', ')}`,
              '',
              'Please ensure your CSV has the correct column headers.'
            ]);
            return;
          }

          if (results.errors.length > 0) {
            console.warn('CSV parsing errors:', results.errors);
            const parseErrors = results.errors.map(error => 
              `Line ${error.row ? error.row + 1 : '?'}: ${error.message}`
            );
            setValidationErrors(parseErrors);
            return;
          }

          // Transform data first
          const transformedData = results.data
            .map((row: any, index: number) => {
              console.log(`Raw row ${index + 1}:`, row);
              console.log(`Row ${index + 1} field values:`, {
                email: `"${row.email}"`,
                company_id: `"${row.company_id}"`,
                company_role: `"${row.company_role}"`,
                position: `"${row.position}"`,
                jwt_role: `"${row.jwt_role}"`
              });
              
              const transformed = {
                email: (row.email || '').trim(),
                company_id: (row.company_id || '').trim(),
                company_role: (row.company_role || '').trim() as 'admin' | 'member' | 'viewer' | 'owner',
                position: (row.position || '').trim(),
                jwt_role: (row.jwt_role || '').trim() || undefined
              };
              
              console.log(`Transformed row ${index + 1}:`, transformed);
              return transformed;
            });

          // Now filter out only completely empty rows
          const records: BulkInviteRecord[] = transformedData
            .filter((record, index) => {
              // Only filter out completely empty rows (no email at all)
              const hasAnyData = record.email || record.company_id || record.company_role || record.position;
              console.log(`Row ${index + 1} has data:`, hasAnyData, record);
              return hasAnyData;
            });

          console.log(`Found ${records.length} non-empty records out of ${transformedData.length} total rows`);
          console.log('All records:', records);

          if (records.length === 0) {
            setValidationErrors(['No data rows found in CSV file. Please check the file format and ensure it contains data rows.']);
            return;
          }

          // Validate the parsed data
          const errors = validateBulkInviteData(records, companies, isSuperAdmin);
          setValidationErrors(errors);
          setParsedData(records);
          
          console.log(`Parsed ${records.length} records from CSV`);
        },
        error: (error) => {
          console.error('CSV parsing error:', error);
          setValidationErrors([`Failed to parse CSV file: ${error.message}`]);
        }
      });
    } catch (error: any) {
      console.error('File processing error:', error);
      setValidationErrors([`Failed to process file: ${error.message}`]);
    }
  }, [companies]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const csvFile = files.find(file => file.type === 'text/csv' || file.name.endsWith('.csv'));
    
    if (csvFile) {
      handleFileUpload(csvFile);
    } else {
      setValidationErrors(['Please drop a CSV file']);
    }
  }, [handleFileUpload]);

  const createSingleInvite = async (record: BulkInviteRecord): Promise<any> => {
    // Direct mapping since company_role now uses correct database enum values
    console.log('Sending invitation request:', {
      company_id: record.company_id,
      email: record.email,
      role_to_assign: record.company_role,
      position: record.position,
      jwt_role: record.jwt_role || undefined
    });

    const { data, error } = await supabase.functions.invoke('create-invite', {
      body: {
        company_id: record.company_id,
        email: record.email.toLowerCase(),
        role_to_assign: record.company_role,
        position: record.position,
        jwt_role: record.jwt_role || undefined
      }
    });

    if (error) {
      console.error('Function invoke error:', error);
      console.error('Full error details:', JSON.stringify(error, null, 2));
      
      // Try to make a direct fetch to get the response body
      try {
        console.log('Attempting direct fetch to get error details...');
        const authHeader = (await supabase.auth.getSession()).data.session?.access_token;
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-invite`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authHeader}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            company_id: record.company_id,
            email: record.email.toLowerCase(),
            role_to_assign: record.company_role,
            position: record.position,
            jwt_role: record.jwt_role || undefined
          })
        });
        
        const responseText = await response.text();
        console.log('Direct fetch response status:', response.status);
        console.log('Direct fetch response text:', responseText);
        
        if (responseText) {
          try {
            const errorData = JSON.parse(responseText);
            throw new Error(`HTTP ${response.status}: ${errorData.error || errorData.message || 'Unknown error'}`);
          } catch (parseError) {
            throw new Error(`HTTP ${response.status}: ${responseText}`);
          }
        }
      } catch (fetchError) {
        console.error('Direct fetch also failed:', fetchError);
        if (fetchError instanceof Error && fetchError.message.includes('HTTP')) {
          throw fetchError; // Re-throw if we got a meaningful error
        }
      }
      
      throw new Error(`HTTP 403: ${error.message || 'Forbidden - check Supabase logs for details'}`);
    }

    if (data?.error) {
      console.error('Function returned error:', data);
      console.error('Full data response:', JSON.stringify(data, null, 2));
      throw new Error(data.error);
    }

    return data;
  };

  const processBulkInvites = async () => {
    if (parsedData.length === 0 || validationErrors.length > 0) return;

    setProcessing(true);
    setProgress({ current: 0, total: parsedData.length });
    
    const results: BulkInviteResult[] = [];
    
    for (let i = 0; i < parsedData.length; i++) {
      const record = parsedData[i];
      try {
        console.log(`Processing invitation ${i + 1}/${parsedData.length} for ${record.email}`);
        const result = await createSingleInvite(record);
        results.push({ ...record, success: true, result });
        console.log(`✓ Successfully sent invitation to ${record.email}`);
      } catch (error: any) {
        console.error(`✗ Failed to send invitation to ${record.email}:`, error);
        results.push({ ...record, success: false, error: error.message });
      }
      setProgress({ current: i + 1, total: parsedData.length });
      
      // Add small delay to prevent overwhelming the system
      if (i < parsedData.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    setProcessing(false);
    onInvitesSent(results);
    
    // Clear form for next upload
    setCsvFile(null);
    setParsedData([]);
    setValidationErrors([]);
  };

  const clearData = () => {
    setCsvFile(null);
    setParsedData([]);
    setValidationErrors([]);
    setProgress({ current: 0, total: 0 });
  };

  const getCompanyName = (companyId: string): string => {
    const company = companies.find(c => c.id === companyId);
    return company ? company.name : companyId;
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Bulk Employee Invitation</h3>
      
      {/* CSV Template Download */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Step 1: Download Template
          </label>
          <Button
            variant="ghost"
            size="sm"
            onClick={downloadCSVTemplate}
            className="flex items-center space-x-2"
          >
            <DownloadIcon className="w-4 h-4" />
            <span>Download CSV Template</span>
          </Button>
        </div>
        <p className="text-sm text-gray-500">
          Download the template, fill it with your employee data, then upload it below.
        </p>
        {companies.length > 0 && (
          <p className="text-sm text-gray-500 mt-1">
            Available companies: {companies.map(c => c.name).join(', ')}
          </p>
        )}
      </div>

      {/* File Upload Area */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Step 2: Upload Completed CSV
        </label>
        
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragOver 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {csvFile ? (
            <div className="space-y-2">
              <CheckIcon className="w-8 h-8 text-green-600 mx-auto" />
              <p className="text-sm font-medium text-gray-900">{csvFile.name}</p>
              <p className="text-xs text-gray-500">
                {(csvFile.size / 1024).toFixed(1)} KB • {parsedData.length} records found
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <UploadIcon className="w-8 h-8 text-gray-400 mx-auto" />
              <p className="text-sm text-gray-600">
                Drag and drop your CSV file here, or{' '}
                <label className="text-blue-600 hover:text-blue-700 cursor-pointer">
                  click to browse
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                    className="hidden"
                  />
                </label>
              </p>
              <p className="text-xs text-gray-500">
                CSV files only, max 5MB
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <XIcon className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium text-red-800 mb-2">Validation Errors:</h4>
              <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
              <p className="text-sm text-red-600 mt-2">
                Please fix these errors and upload the file again.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Data Preview */}
      {parsedData.length > 0 && validationErrors.length === 0 && (
        <div className="mb-6">
          <h4 className="font-medium mb-3">Step 3: Review Data ({parsedData.length} records)</h4>
          <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Email</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Company</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Company Role</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Position</th>
                  {isSuperAdmin && (
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Admin Role</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {parsedData.slice(0, 10).map((record, index) => (
                  <tr key={index} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-900">{record.email}</td>
                    <td className="px-3 py-2 text-gray-600">
                      {getCompanyName(record.company_id)}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        record.company_role === 'owner' 
                          ? 'bg-red-100 text-red-700'
                          : record.company_role === 'admin' 
                          ? 'bg-purple-100 text-purple-700' 
                          : record.company_role === 'viewer'
                          ? 'bg-gray-100 text-gray-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {record.company_role === 'owner' ? 'Owner' 
                         : record.company_role === 'admin' ? 'Admin'
                         : record.company_role === 'viewer' ? 'Viewer' 
                         : 'Member'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-900">{record.position}</td>
                    {isSuperAdmin && (
                      <td className="px-3 py-2 text-gray-600">
                        {record.jwt_role || '—'}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {parsedData.length > 10 && (
              <div className="px-3 py-2 text-gray-500 text-center bg-gray-50 border-t">
                ... and {parsedData.length - 10} more records
              </div>
            )}
          </div>
        </div>
      )}

      {/* Processing Progress */}
      {processing && (
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-gray-700">Processing invitations...</span>
            <span className="text-gray-600">{progress.current}/{progress.total}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Please don't close this page while processing...
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <Button
          onClick={processBulkInvites}
          disabled={parsedData.length === 0 || validationErrors.length > 0 || processing}
          className="flex-1"
        >
          {processing 
            ? (
              <div className="flex items-center space-x-2">
                <LoadingSpinner size="sm" />
                <span>Sending Invitations...</span>
              </div>
            )
            : `Send ${parsedData.length} Invitations`
          }
        </Button>
        <Button
          variant="ghost"
          onClick={clearData}
          disabled={processing}
        >
          Clear
        </Button>
      </div>

      {/* Help Text */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <h5 className="font-medium text-blue-800 mb-1">CSV Format Requirements:</h5>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>email:</strong> Valid email address</li>
          <li>• <strong>company_id:</strong> Company UUID (pre-filled in template)</li>
          <li>• <strong>company_role:</strong> "admin" (managers), "member" (employees), "viewer" (read-only), or "owner" (full control)</li>
          <li>• <strong>position:</strong> Job title or position</li>
          {isSuperAdmin && (
            <li>• <strong>jwt_role:</strong> Optional admin permissions: "hr_admin", "super_admin", or leave empty</li>
          )}
        </ul>
        {selectedCompanyId && (
          <p className="text-sm text-blue-600 mt-2">
            💡 Company ID is automatically filled for your selected company
          </p>
        )}
      </div>
    </Card>
  );
};
