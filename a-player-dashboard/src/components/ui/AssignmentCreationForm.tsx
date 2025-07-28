import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from './Button';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { Card } from './Card';
import { createBulkAssignments } from '../../services/assignmentService';
import { fetchEmployees, fetchQuarters } from '../../services/dataFetching';
import { findCurrentQuarterInList, logCurrentQuarter } from '../../utils/quarterUtils';
import type { 
  AssignmentCreationRequest, 
  AssignmentCreationResult,
  EvaluationType 
} from '../../types/database';
import type { Employee, Quarter } from '../../types/evaluation';

interface AssignmentCreationFormProps {
  onAssignmentCreated: () => void;
}

// Icon components
const CheckIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

const XIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);

export const AssignmentCreationForm: React.FC<AssignmentCreationFormProps> = ({
  onAssignmentCreated
}) => {
  const { user } = useAuth();

  // Form data
  const [formData, setFormData] = useState<{
    quarter_id: string;
    evaluation_type: EvaluationType;
    evaluator_ids: string[];
    evaluatee_ids: string[];
  }>({
    quarter_id: '',
    evaluation_type: 'peer',
    evaluator_ids: [],
    evaluatee_ids: []
  });

  // Data state
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [quarters, setQuarters] = useState<Quarter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<AssignmentCreationResult | null>(null);

  useEffect(() => {
    loadFormData();
  }, []);

  const loadFormData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [employeesData, quartersData] = await Promise.all([
        fetchEmployees(),
        fetchQuarters()
      ]);

      setEmployees(employeesData);
      setQuarters(quartersData);

      // Auto-select the current quarter based on today's date
      if (quartersData.length > 0) {
        console.log('📅 Setting current quarter for assignment creation...');
        logCurrentQuarter();
        
        const currentQuarter = findCurrentQuarterInList(quartersData);
        
        if (currentQuarter) {
          console.log('✅ Setting current quarter as default:', currentQuarter.name);
          setFormData(prev => ({ ...prev, quarter_id: currentQuarter.id }));
        } else {
          // Fallback to most recent quarter if current not found
          const sortedQuarters = quartersData.sort((a: Quarter, b: Quarter) => 
            new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
          );
          console.log('⚠️ Current quarter not found, using most recent:', sortedQuarters[0]?.name);
          setFormData(prev => ({ ...prev, quarter_id: sortedQuarters[0].id }));
        }
      }
    } catch (err) {
      console.error('Error loading form data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load form data');
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluatorChange = (employeeId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      evaluator_ids: checked 
        ? [...prev.evaluator_ids, employeeId]
        : prev.evaluator_ids.filter(id => id !== employeeId)
    }));
  };

  const handleEvaluateeChange = (employeeId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      evaluatee_ids: checked 
        ? [...prev.evaluatee_ids, employeeId]
        : prev.evaluatee_ids.filter(id => id !== employeeId)
    }));
  };

  const handleSelectAllEvaluators = () => {
    const allIds = employees.map(emp => emp.id);
    setFormData(prev => ({
      ...prev,
      evaluator_ids: prev.evaluator_ids.length === employees.length ? [] : allIds
    }));
  };

  const handleSelectAllEvaluatees = () => {
    const allIds = employees.map(emp => emp.id);
    setFormData(prev => ({
      ...prev,
      evaluatee_ids: prev.evaluatee_ids.length === employees.length ? [] : allIds
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    if (formData.evaluator_ids.length === 0) {
      setError('Please select at least one evaluator');
      return;
    }

    if (formData.evaluatee_ids.length === 0) {
      setError('Please select at least one evaluatee');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setResult(null);

      console.log('Creating assignments with user:', user);
      console.log('User ID being used for assigned_by:', user.id);

      const request: AssignmentCreationRequest = {
        ...formData,
        assigned_by: user.id
      };

      const creationResult = await createBulkAssignments(request);
      setResult(creationResult);

      if (creationResult.success) {
        // Reset form on success
        setFormData({
          quarter_id: formData.quarter_id, // Keep quarter selected
          evaluation_type: 'peer',
          evaluator_ids: [],
          evaluatee_ids: []
        });
        
        // Notify parent component
        onAssignmentCreated();
      }
    } catch (err) {
      console.error('Error creating assignments:', err);
      setError(err instanceof Error ? err.message : 'Failed to create assignments');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </Card>
    );
  }

  if (error && !result) {
    return (
      <Card className="p-6">
        <ErrorMessage 
          message={error}
          onRetry={() => {
            setError(null);
            loadFormData();
          }}
        />
      </Card>
    );
  }

  const estimatedAssignments = formData.evaluation_type === 'self' 
    ? Math.min(formData.evaluator_ids.length, formData.evaluatee_ids.length)
    : formData.evaluator_ids.length * formData.evaluatee_ids.length;

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Create Bulk Assignments
        </h2>
        <p className="text-gray-600">
          Create multiple evaluation assignments at once. Select evaluators, evaluatees, and the evaluation type.
        </p>
      </div>

      {/* Result Display */}
      {result && (
        <div className={`mb-6 p-4 rounded-lg border ${
          result.success 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center space-x-2 mb-2">
            {result.success ? (
              <CheckIcon className="w-5 h-5 text-green-600" />
            ) : (
              <XIcon className="w-5 h-5 text-red-600" />
            )}
            <span className="font-medium">
              {result.success ? 'Assignments Created Successfully!' : 'Assignment Creation Failed'}
            </span>
          </div>
          
          <div className="text-sm space-y-1">
            <p>Created: {result.created_count} assignments</p>
            {result.skipped_count > 0 && (
              <p>Skipped: {result.skipped_count} assignments</p>
            )}
            {result.errors.length > 0 && (
              <div className="mt-2">
                <p className="font-medium">Errors:</p>
                <ul className="list-disc list-inside space-y-1">
                  {result.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Quarter Selection */}
        <div>
          <label htmlFor="quarter" className="block text-sm font-medium text-gray-700 mb-2">
            Evaluation Quarter *
          </label>
          <select
            id="quarter"
            value={formData.quarter_id}
            onChange={(e) => setFormData(prev => ({ ...prev, quarter_id: e.target.value }))}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Select a quarter</option>
            {quarters.map(quarter => (
              <option key={quarter.id} value={quarter.id}>
                {quarter.name} ({new Date(quarter.startDate).toLocaleDateString()} - {new Date(quarter.endDate).toLocaleDateString()})
              </option>
            ))}
          </select>
        </div>

        {/* Evaluation Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Evaluation Type *
          </label>
          <div className="flex space-x-4">
            {[
              { value: 'peer', label: 'Peer Evaluation' },
              { value: 'manager', label: 'Manager Evaluation' },
              { value: 'self', label: 'Self Evaluation' }
            ].map(type => (
              <label key={type.value} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  value={type.value}
                  checked={formData.evaluation_type === type.value}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    evaluation_type: e.target.value as EvaluationType 
                  }))}
                  className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">{type.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Employee Selection */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Evaluators */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Evaluators * ({formData.evaluator_ids.length} selected)
              </label>
              <button
                type="button"
                onClick={handleSelectAllEvaluators}
                className="text-sm text-primary-600 hover:text-primary-800"
              >
                {formData.evaluator_ids.length === employees.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            
            <div className="border border-gray-300 rounded-lg max-h-60 overflow-y-auto p-3 space-y-2">
              {employees.map(employee => (
                <label key={employee.id} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={formData.evaluator_ids.includes(employee.id)}
                    onChange={(e) => handleEvaluatorChange(employee.id, e.target.checked)}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                    <div className="text-xs text-gray-500">{employee.department} • {employee.role}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Evaluatees */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Evaluatees * ({formData.evaluatee_ids.length} selected)
              </label>
              <button
                type="button"
                onClick={handleSelectAllEvaluatees}
                className="text-sm text-primary-600 hover:text-primary-800"
              >
                {formData.evaluatee_ids.length === employees.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            
            <div className="border border-gray-300 rounded-lg max-h-60 overflow-y-auto p-3 space-y-2">
              {employees.map(employee => (
                <label key={employee.id} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={formData.evaluatee_ids.includes(employee.id)}
                    onChange={(e) => handleEvaluateeChange(employee.id, e.target.checked)}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                    <div className="text-xs text-gray-500">{employee.department} • {employee.role}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Preview */}
        {formData.evaluator_ids.length > 0 && formData.evaluatee_ids.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Assignment Preview</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>
                <span className="font-medium">Total assignments to create:</span> {estimatedAssignments}
              </p>
              <p>
                <span className="font-medium">Evaluation type:</span> {formData.evaluation_type}
              </p>
              {formData.evaluation_type === 'self' && (
                <p className="text-blue-600 text-xs mt-2">
                  Note: For self-evaluations, only employees who are both evaluators and evaluatees will receive assignments.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setFormData({
                quarter_id: formData.quarter_id,
                evaluation_type: 'peer',
                evaluator_ids: [],
                evaluatee_ids: []
              });
              setResult(null);
              setError(null);
            }}
            disabled={submitting}
          >
            Reset
          </Button>
          
          <Button
            type="submit"
            disabled={submitting || estimatedAssignments === 0}
            className="min-w-32"
          >
            {submitting ? (
              <div className="flex items-center space-x-2">
                <LoadingSpinner size="sm" />
                <span>Creating...</span>
              </div>
            ) : (
              `Create ${estimatedAssignments} Assignment${estimatedAssignments !== 1 ? 's' : ''}`
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}; 