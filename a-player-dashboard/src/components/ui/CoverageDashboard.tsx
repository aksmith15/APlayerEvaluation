import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { LoadingSpinner } from './LoadingSpinner';
import { Card } from './Card';
import { EmptyState } from './EmptyState';
import { 
  getCoverageAnalysis,
  getCoverageStats,
  getCoverageGaps,
  type CoverageData,
  type CoverageStats,
  type CoverageGap
} from '../../services/coverageService';
import { createBulkAssignments } from '../../services/assignmentService';
import { fetchQuarters, fetchEmployees } from '../../services/dataFetching';
import type { Quarter, Employee } from '../../types/evaluation';
import type { EvaluationType, AssignmentCreationRequest } from '../../types/database';
import { useAuth } from '../../contexts/AuthContext';
import { findCurrentQuarterInList, logCurrentQuarter } from '../../utils/quarterUtils';

// Icon components
const CheckCircleIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

const ExclamationCircleIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
  </svg>
);

const MinusCircleIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
  </svg>
);

const UserGroupIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
  </svg>
);

const PlusIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
  </svg>
);

interface CoverageDashboardProps {
  onCreateAssignment?: (request: AssignmentCreationRequest) => void;
}

export const CoverageDashboard: React.FC<CoverageDashboardProps> = ({
  onCreateAssignment
}) => {
  const { user } = useAuth();
  
  // State
  const [selectedQuarter, setSelectedQuarter] = useState<Quarter | null>(null);
  const [quarters, setQuarters] = useState<Quarter[]>([]);
  const [coverageData, setCoverageData] = useState<CoverageData[]>([]);
  const [coverageStats, setCoverageStats] = useState<CoverageStats | null>(null);
  const [coverageGaps, setCoverageGaps] = useState<CoverageGap[]>([]);
  const [people, setPeople] = useState<Employee[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [creatingAssignment, setCreatingAssignment] = useState<string | null>(null);
  
  // UI state
  const [activeView, setActiveView] = useState<'overview' | 'details' | 'gaps'>('overview');
  
  // Evaluator selection state
  const [selectedEvaluators, setSelectedEvaluators] = useState<{[key: string]: {peer?: string, manager?: string}}>({});

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedQuarter) {
      loadCoverageData();
    }
  }, [selectedQuarter]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      console.log('📅 Loading quarters and people data...');
      
      // Log current quarter info for debugging
      logCurrentQuarter();
      
      const [quartersData, peopleData] = await Promise.all([
        fetchQuarters(),
        fetchEmployees()
      ]);
      
      setQuarters(quartersData);
      setPeople(peopleData);
      
      // Auto-select the current quarter based on today's date
      if (quartersData.length > 0) {
        const currentQuarter = findCurrentQuarterInList(quartersData);
        
        if (currentQuarter) {
          console.log('✅ Setting current quarter as default:', currentQuarter.name);
          setSelectedQuarter(currentQuarter);
        } else {
          // Fallback to most recent quarter if current not found
          const sortedQuarters = quartersData.sort((a, b) => 
            new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
          );
          console.log('⚠️ Current quarter not found, using most recent:', sortedQuarters[0]?.name);
          setSelectedQuarter(sortedQuarters[0]);
        }
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCoverageData = async () => {
    if (!selectedQuarter) return;
    
    try {
      setLoading(true);
      console.log('📊 Loading coverage data for quarter:', selectedQuarter.id);
      
      const [coverage, stats, gaps] = await Promise.all([
        getCoverageAnalysis(selectedQuarter.id),
        getCoverageStats(selectedQuarter.id),
        getCoverageGaps(selectedQuarter.id)
      ]);
      
      setCoverageData(coverage);
      setCoverageStats(stats);
      setCoverageGaps(gaps);
      
      console.log('✅ Coverage data loaded:', {
        totalPeople: coverage.length,
        assignmentCoverage: stats.assignment_coverage_percentage,
        gaps: gaps.length
      });
    } catch (error) {
      console.error('Error loading coverage data:', error);
    } finally {
      setLoading(false);
    }
  };



  const handleManualAssignment = async (evaluateeId: string, evaluationType: 'peer' | 'manager') => {
    if (!user?.id || !selectedQuarter) return;
    
    const evaluatorId = selectedEvaluators[evaluateeId]?.[evaluationType];
    if (!evaluatorId) {
      alert(`Please select a ${evaluationType} evaluator first.`);
      return;
    }
    
    try {
      setCreatingAssignment(evaluateeId);
      
      const request: AssignmentCreationRequest = {
        quarter_id: selectedQuarter.id,
        evaluation_type: evaluationType,
        evaluator_ids: [evaluatorId],
        evaluatee_ids: [evaluateeId],
        assigned_by: user.id
      };
      
      console.log(`🎯 Creating ${evaluationType} assignment:`, request);
      
      const result = await createBulkAssignments(request);
      
      if (result.success) {
        console.log('✅ Assignment created successfully');
        // Clear the selection for this person/type
        setSelectedEvaluators(prev => ({
          ...prev,
          [evaluateeId]: {
            ...prev[evaluateeId],
            [evaluationType]: undefined
          }
        }));
        // Reload coverage data to reflect changes
        await loadCoverageData();
        
        if (onCreateAssignment) {
          onCreateAssignment(request);
        }
      } else {
        throw new Error(result.errors.join(', '));
      }
    } catch (error) {
      console.error(`Error creating ${evaluationType} assignment:`, error);
      alert(`Failed to create ${evaluationType} assignment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setCreatingAssignment(null);
    }
  };



  const getCoverageStatusIcon = (status: 'Complete' | 'Partial' | 'None') => {
    switch (status) {
      case 'Complete':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'Partial':
        return <ExclamationCircleIcon className="w-5 h-5 text-yellow-500" />;
      case 'None':
        return <MinusCircleIcon className="w-5 h-5 text-red-500" />;
    }
  };

  const getEvaluationTypeIcon = (type: EvaluationType, hasType: boolean) => {
    const iconClass = hasType ? "text-green-500" : "text-gray-300";
    switch (type) {
      case 'self':
        return <span className={`inline-block w-3 h-3 rounded-full ${hasType ? 'bg-blue-500' : 'bg-gray-300'}`} title="Self Evaluation" />;
      case 'manager':
        return <span className={`inline-block w-3 h-3 rounded-full ${hasType ? 'bg-purple-500' : 'bg-gray-300'}`} title="Manager Evaluation" />;
      case 'peer':
        return <span className={`inline-block w-3 h-3 rounded-full ${hasType ? 'bg-green-500' : 'bg-gray-300'}`} title="Peer Evaluation" />;
    }
  };

  if (loading && !selectedQuarter) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!selectedQuarter) {
    return (
      <EmptyState
        title="No quarters available"
        message="No evaluation quarters found. Please set up evaluation periods first."
        icon={<UserGroupIcon className="w-12 h-12 text-gray-400" />}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Assignment Coverage Tracking</h2>
          <p className="text-sm text-gray-600 mt-1">
            Ensure everyone has been assigned their required evaluations (self + manager + peer)
          </p>
          <p className="text-xs text-blue-600 mt-1">
            📋 Step 1: Verify assignment coverage → Check Overview tab for completion status
          </p>
        </div>
        
        {/* Quarter Selector */}
        <div className="flex items-center space-x-4">
          <label htmlFor="quarter-select" className="text-sm font-medium text-gray-700">
            Quarter:
          </label>
          <select
            id="quarter-select"
            value={selectedQuarter?.id || ''}
            onChange={(e) => {
              const quarter = quarters.find(q => q.id === e.target.value);
              setSelectedQuarter(quarter || null);
            }}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {quarters.map(quarter => (
              <option key={quarter.id} value={quarter.id}>
                {quarter.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Overview', count: coverageStats?.total_people },
            { id: 'details', name: 'Detailed View', count: coverageData.length },
            { id: 'gaps', name: 'Coverage Gaps', count: coverageGaps.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id as any)}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeView === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.name}
              {tab.count !== undefined && (
                <span className={`
                  ml-2 py-0.5 px-2 rounded-full text-xs font-medium
                  ${activeView === tab.id 
                    ? 'bg-primary-100 text-primary-600' 
                    : 'bg-gray-100 text-gray-600'
                  }
                `}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          {/* Overview Tab */}
          {activeView === 'overview' && coverageStats && (
            <div className="space-y-6">
              {/* Assignment Coverage Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 text-xs font-bold">📋</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Assignment Coverage</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {(coverageStats as any).assignment_coverage_percentage}%
                      </p>
                      <p className="text-sm text-gray-500">
                        {(coverageStats as any).people_with_complete_assignments}/{coverageStats.total_people} people assigned
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Missing Self</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {(coverageStats as any).missing_self_assignments}
                      </p>
                      <p className="text-sm text-gray-500">people</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Missing Manager</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {(coverageStats as any).missing_manager_assignments}
                      </p>
                      <p className="text-sm text-gray-500">people</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Missing Peer</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {(coverageStats as any).missing_peer_assignments}
                      </p>
                      <p className="text-sm text-gray-500">people</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Assignment Coverage Progress */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Assignment Coverage Progress</h3>
                  <span className="text-sm text-gray-500">
                    {(coverageStats as any).people_with_complete_assignments} of {coverageStats.total_people} people fully assigned
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${(coverageStats as any).assignment_coverage_percentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm text-gray-500 mt-2">
                  <span>0%</span>
                  <span>100% Assignment Coverage</span>
                </div>
              </Card>




            </div>
          )}

          {/* Detailed View Tab */}
          {activeView === 'details' && (
            <Card>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Person
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Coverage Status
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Self Assigned
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Manager Assigned
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Peer Assigned
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {coverageData.map((person) => (
                      <tr key={person.person_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {person.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {person.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {person.department}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center space-x-1">
                            {getCoverageStatusIcon((person as any).assignment_coverage_status)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center">
                            {getEvaluationTypeIcon('self', (person as any).has_assigned_self)}
                            <span className="ml-1 text-xs text-gray-500">
                              {(person as any).assigned_self_count}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center">
                            {getEvaluationTypeIcon('manager', (person as any).has_assigned_manager)}
                            <span className="ml-1 text-xs text-gray-500">
                              {(person as any).assigned_manager_count}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center">
                            {getEvaluationTypeIcon('peer', (person as any).has_assigned_peer)}
                            <span className="ml-1 text-xs text-gray-500">
                              {(person as any).assigned_peer_count}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`
                            inline-flex px-2 py-1 text-xs font-semibold rounded-full
                            ${(person as any).assignment_coverage_complete
                              ? 'bg-green-100 text-green-800' 
                              : (person as any).assignment_coverage_status === 'Partial'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                            }
                          `}>
                            {(person as any).assignment_coverage_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Coverage Gaps Tab */}
          {activeView === 'gaps' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Coverage Gaps ({coverageGaps.length} people need attention)
                </h3>
              </div>

              {coverageGaps.length === 0 ? (
                <Card className="p-12">
                  <div className="text-center">
                    <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      🎉 Complete Coverage Achieved!
                    </h3>
                    <p className="text-gray-600">
                      All team members have complete assignment coverage AND completion for {selectedQuarter.name}.
                    </p>
                  </div>
                </Card>
              ) : (
                <div className="space-y-4">
                  {coverageGaps.map((gap) => (
                    <Card key={gap.person_id} className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h4 className="text-lg font-medium text-gray-900">
                              {gap.person_name}
                            </h4>
                            <span className="text-sm text-gray-500">
                              {gap.department}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {gap.person_email}
                          </p>
                          
                          <div className="mt-3 space-y-2">
                            <div className="flex items-center space-x-4">
                              <span className="text-sm font-medium text-gray-700">Missing Assignments:</span>
                              {(gap as any).missing_assignment_types.map((type: string) => (
                                <span
                                  key={type}
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
                                >
                                  {type.charAt(0).toUpperCase() + type.slice(1)} evaluation
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        <div className="ml-6 flex-shrink-0">
                          <div className="space-y-3 min-w-[300px]">
                            {/* Only show assignment buttons for missing assignment types (not self) */}
                            {(gap as any).missing_assignment_types
                              .filter((type: string) => type !== 'self')
                              .map((type: 'peer' | 'manager') => (
                                <div key={type} className="flex items-center space-x-2">
                                  <select
                                    value={selectedEvaluators[gap.person_id]?.[type] || ''}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      setSelectedEvaluators(prev => ({
                                        ...prev,
                                        [gap.person_id]: {
                                          ...prev[gap.person_id],
                                          [type]: value || undefined
                                        }
                                      }));
                                    }}
                                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                                  >
                                    <option value="">Select {type} evaluator...</option>
                                    {people
                                      .filter(person => person.id !== gap.person_id) // Can't evaluate themselves
                                      .map(person => (
                                        <option key={person.id} value={person.id}>
                                          {person.name} ({person.department})
                                        </option>
                                      ))
                                    }
                                  </select>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => handleManualAssignment(gap.person_id, type)}
                                    disabled={
                                      creatingAssignment === gap.person_id || 
                                      !selectedEvaluators[gap.person_id]?.[type]
                                    }
                                    className="text-xs whitespace-nowrap"
                                  >
                                    {creatingAssignment === gap.person_id ? (
                                      <LoadingSpinner size="sm" />
                                    ) : (
                                      <>
                                        <PlusIcon className="w-3 h-3 mr-1" />
                                        Assign {type.charAt(0).toUpperCase() + type.slice(1)}
                                      </>
                                    )}
                                  </Button>
                                </div>
                              ))
                            }
                            
                            {/* Message for self evaluations */}
                            {(gap as any).missing_assignment_types.includes('self') && (
                              <div className="text-xs text-gray-500 italic">
                                💡 Self evaluations need to be assigned separately
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}; 