import React, { useState, useEffect, Suspense, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { fetchEmployeeData, fetchQuarters, fetchEvaluationScores, fetchQuarterlyTrendData, fetchEnhancedTrendData, fetchHistoricalEvaluationScores, fetchAvailableQuarters } from '../services/dataFetching';
import { fetchCoreGroupAnalytics, checkCoreGroupDataAvailability } from '../services/coreGroupService';
import { subscribeToEmployeeEvaluations, subscribeToQuarterlyScores, subscribeToEvaluationCycles, realtimeManager } from '../services/realtimeService';
import { LoadingSpinner, ErrorMessage, Card, ChartSkeleton, NoEvaluationData, Breadcrumb, useBreadcrumbs, KeyboardShortcuts, EmployeeProfile, QuarterlyNotes, TopAnalyticsGrid } from '../components/ui';
import { CompanySwitcher } from '../components/ui/CompanySwitcher';
// Direct chart imports for better code splitting
import { RadarChart, ClusteredBarChart, HistoricalClusteredBarChart, TrendLineChart } from '../components/ui/charts';
// Chart preloading for performance optimization
import { preloadChartComponents } from '../services/chartLoader';

// Lazy load heavy components to reduce initial bundle size
const LazyGeneratePDFButton = React.lazy(() => 
  import('../components/ui').then(module => ({ default: module.GeneratePDFButton }))
);

const LazyCoreGroupAnalysisTabs = React.lazy(() => 
  import('../components/ui').then(module => ({ default: module.CoreGroupAnalysisTabs }))
);
import { useNavigation, useKeyboardNavigation } from '../contexts/NavigationContext';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import { useChartHeight } from '../utils/useResponsive';
import { findCurrentQuarterInList, logCurrentQuarter } from '../utils/quarterUtils';
import { getLetterGrade } from '../utils/calculations';
import { ROUTES } from '../constants/config';
import type { Person, WeightedEvaluationScore } from '../types/database';
import type { TrendViewMode, EnhancedTrendResponse } from '../types/evaluation';
import type { Quarter, CoreGroupAnalyticsResponse } from '../types/evaluation';

export const EmployeeAnalytics: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const employeeId = searchParams.get('employeeId');
  const { navigateToEmployeeSelection, updateNavigationState } = useNavigation();
  const { generateBreadcrumbs } = useBreadcrumbs();
  const { user } = useAuth();
  
  // Enable keyboard navigation shortcuts
  useKeyboardNavigation();
  
  // Responsive chart heights
  const radarChartHeight = useChartHeight(500);
  const barChartHeight = useChartHeight(500);
  const trendChartHeight = useChartHeight(500);
  const historicalChartHeight = useChartHeight(500);

  const [employee, setEmployee] = useState<Person | null>(null);
  const [quarters, setQuarters] = useState<Quarter[]>([]);
  const [selectedQuarter, setSelectedQuarter] = useState<string>('');
  const [evaluationScores, setEvaluationScores] = useState<WeightedEvaluationScore[]>([]);
  const [trendDataRaw, setTrendDataRaw] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  
  // Enhanced trend data state for Stage 11
  const [enhancedTrendData, setEnhancedTrendData] = useState<EnhancedTrendResponse | null>(null);
  const [trendViewMode, setTrendViewMode] = useState<TrendViewMode>('individual');
  
  // Historical comparison state
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [availableQuarters, setAvailableQuarters] = useState<any[]>([]);
  const [historicalStartQuarter, setHistoricalStartQuarter] = useState<string>('');
  const [historicalEndQuarter, setHistoricalEndQuarter] = useState<string>('');
  const [historicalLoading, setHistoricalLoading] = useState(false);



  // Real-time update state
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);

  // Core Group Analytics - Overview data for TopAnalyticsGrid (Stage 12)
  const [coreGroupData, setCoreGroupData] = useState<CoreGroupAnalyticsResponse | null>(null);
  const [coreGroupLoading, setCoreGroupLoading] = useState(false);
  const [coreGroupError, setCoreGroupError] = useState<string | null>(null);

  // Enhanced user permission checking with database fallback
  const [userPermissions, setUserPermissions] = useState<{ canEdit: boolean; lastChecked: Date | null }>({
    canEdit: false,
    lastChecked: null
  });

  // Function to refresh user permissions from database
  const refreshUserPermissions = useCallback(async () => {
    if (!user?.email) return false;
    
    try {
      console.log('🔄 Refreshing user permissions from database...');
      const profile = await authService.getUserProfile(user.email);
      
      if (profile) {
        const canEdit = profile.jwtRole === 'hr_admin' || profile.jwtRole === 'super_admin';
        setUserPermissions({ canEdit, lastChecked: new Date() });
        
        console.log('✅ User permissions refreshed:', {
          email: user.email,
          jwtRole: profile.jwtRole,
          canEdit
        });
        
        return canEdit;
      }
    } catch (error) {
      console.error('❌ Failed to refresh permissions:', error);
    }
    
    return false;
  }, [user?.email]);

  // Check user permissions on user change
  useEffect(() => {
    if (user?.email && !userPermissions.lastChecked) {
      refreshUserPermissions();
    }
  }, [user?.email, userPermissions.lastChecked, refreshUserPermissions]);

  // Helper functions for user permissions and profile management
  const isUserEditable = () => {
    // Debug logging to help identify permission issues
    console.log('🔍 isUserEditable check:', {
      user_exists: !!user,
      user_email: user?.email,
      user_jwtRole: user?.jwtRole,
      user_id: user?.id,
      cached_permissions: userPermissions,
      full_user_object: user
    });
    
    // Primary check: JWT role-based permissions from user context
    const hasJwtPermission = user?.jwtRole === 'hr_admin' || user?.jwtRole === 'super_admin';
    
    // Secondary check: Use cached permissions from database refresh
    const hasCachedPermission = userPermissions.canEdit;
    
    // Fallback check: If jwtRole is null/undefined but user exists and is authenticated,
    // check if they are a known admin user by email (kolbes@ridgelineei.com)
    const isKnownAdmin = user?.email === 'kolbes@ridgelineei.com';
    
    const canEdit = hasJwtPermission || hasCachedPermission || isKnownAdmin;
    
    console.log('🔍 Permission result:', {
      hasJwtPermission,
      hasCachedPermission,
      isKnownAdmin,
      canEdit
    });
    
    return canEdit;
  };

  const handleProfilePictureUpdate = (newUrl: string | null) => {
    if (employee) {
      setEmployee({
        ...employee,
        profile_picture_url: newUrl || undefined
      });
    }
  };

  useEffect(() => {
    if (!employeeId) {
      navigate(ROUTES.EMPLOYEE_SELECTION);
      return;
    }
    
    // Preload chart components for better performance
    preloadChartComponents(['clustered-bar', 'historical-bar']).catch(console.warn);
    
    loadInitialData();
  }, [employeeId, navigate]);

  useEffect(() => {
    if (selectedQuarter && employeeId) {
      loadEvaluationData();
    }
  }, [selectedQuarter, employeeId]);

  useEffect(() => {
    if (historicalStartQuarter && historicalEndQuarter && employeeId) {
      loadHistoricalData();
    }
  }, [historicalStartQuarter, historicalEndQuarter, employeeId]);

  // Load core group data when quarter or employee changes (for overview)
  useEffect(() => {
    if (selectedQuarter && employeeId) {
      loadCoreGroupData();
    }
  }, [selectedQuarter, employeeId]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!employeeId) return;

    console.log('Setting up real-time subscriptions for employee:', employeeId);

    // Subscribe to evaluation score changes for this employee
    subscribeToEmployeeEvaluations(employeeId, (payload) => {
      console.log('Evaluation scores changed:', payload);
      setLastUpdateTime(new Date());
      setRealtimeConnected(true);
      
      // Reload evaluation data if the change affects the current quarter
      if (payload.new && typeof payload.new === 'object' && 'quarter_id' in payload.new) {
        const changedQuarterId = (payload.new as any).quarter_id;
        if (changedQuarterId === selectedQuarter) {
          console.log('Reloading evaluation data due to real-time update');
          loadEvaluationData();
        }
      }
    });

    // Subscribe to quarterly trend data changes
    subscribeToQuarterlyScores(employeeId, (payload) => {
      console.log('Quarterly scores changed:', payload);
      
      // Reload trend data
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        console.log('Reloading trend data due to real-time update');
        // Reload both legacy and enhanced trend data
        Promise.all([
          fetchQuarterlyTrendData(employeeId, 4),
          fetchEnhancedTrendData(employeeId, 4)
        ]).then(([trendData, enhancedTrends]) => {
          setTrendDataRaw(trendData);
          setEnhancedTrendData(enhancedTrends);
        }).catch(console.error);
        
        // Also reload historical data if it might be affected
        if (historicalStartQuarter && historicalEndQuarter) {
          loadHistoricalData();
        }
      }
    });

    // Subscribe to evaluation cycles changes (new quarters, etc.)
    subscribeToEvaluationCycles((payload) => {
      console.log('Evaluation cycles changed:', payload);
      
      // Reload quarters list
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        console.log('Reloading quarters due to real-time update');
        fetchQuarters()
          .then(setQuarters)
          .catch(console.error);
        
        // Also reload available quarters for historical analysis
        fetchAvailableQuarters(employeeId)
          .then(setAvailableQuarters)
          .catch(console.error);
      }
    });

    // Cleanup subscriptions when component unmounts or employeeId changes
    return () => {
      console.log('Cleaning up real-time subscriptions');
      realtimeManager.unsubscribe(`employee-evaluations-${employeeId}`);
      realtimeManager.unsubscribe(`quarterly-scores-${employeeId}`);
      realtimeManager.unsubscribe('evaluation-cycles');
    };
     }, [employeeId, selectedQuarter, historicalStartQuarter, historicalEndQuarter]);

  // Global cleanup on unmount
  useEffect(() => {
    setRealtimeConnected(true); // Assume connected when subscriptions are set up
    
    return () => {
      console.log('Component unmounting - cleaning up all real-time subscriptions');
      realtimeManager.unsubscribeAll();
    };
  }, []);

  const loadInitialData = async () => {
    if (!employeeId) return;

    try {
      setLoading(true);
      const [employeeData, quartersData, trendData, enhancedTrends, availableQuartersData] = await Promise.all([
        fetchEmployeeData(employeeId),
        fetchQuarters(),
        fetchQuarterlyTrendData(employeeId, 4), // Legacy trend data for compatibility
        fetchEnhancedTrendData(employeeId, 4), // Enhanced trend data with core groups (Stage 11)
        fetchAvailableQuarters(employeeId) // Get available quarters for historical comparison
      ]);

      setEmployee(employeeData);
      setQuarters(quartersData);
      setTrendDataRaw(trendData);
      setEnhancedTrendData(enhancedTrends);
      setAvailableQuarters(availableQuartersData);
      
      // Set the current quarter as default based on today's date
      if (quartersData.length > 0) {
        console.log('📅 Setting current quarter for employee analytics...');
        logCurrentQuarter();
        
        const currentQuarter = findCurrentQuarterInList(quartersData);
        
        if (currentQuarter) {
          console.log('✅ Setting current quarter as default:', currentQuarter.name);
          setSelectedQuarter(currentQuarter.id);
        } else {
          // Fallback to most recent quarter if current not found
          console.log('⚠️ Current quarter not found, using most recent:', quartersData[0]?.name);
          setSelectedQuarter(quartersData[0].id);
        }
      }
      
      // Set default historical range (last 2 quarters if available)
      if (availableQuartersData.length >= 2) {
        const sortedQuarters = [...availableQuartersData].sort((a, b) => 
          new Date(b.quarter_start_date).getTime() - new Date(a.quarter_start_date).getTime()
        );
        setHistoricalEndQuarter(sortedQuarters[0].quarter_id);
        setHistoricalStartQuarter(sortedQuarters[1].quarter_id);
      }
      
      setError(null);
    } catch (err) {
      setError('Failed to load employee data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadEvaluationData = async () => {
    if (!employeeId || !selectedQuarter) return;

    try {
      setDataLoading(true);
      
      // Load evaluation scores and check for existing AI analysis in parallel
      const [scores, existingAnalysis] = await Promise.all([
        fetchEvaluationScores(employeeId, selectedQuarter),
        checkExistingAnalysis(employeeId, selectedQuarter)
      ]);
      
      setEvaluationScores(scores);
      
      // Handle existing analysis (completed OR in-progress)
      if (existingAnalysis) {
        console.log('Found existing AI analysis for this quarter:', existingAnalysis);
        
        if (existingAnalysis.status === 'completed' && existingAnalysis.url) {
          // Completed analysis - show the result
                     setAiAnalysisUrl(existingAnalysis.url);
           setAiAnalysisPdfData(existingAnalysis.pdfData);
           setAiAnalysisPdfFilename(existingAnalysis.pdfFilename);
           setAiAnalysisJobId(existingAnalysis.jobId);
           setAiAnalysisStage(existingAnalysis.stage || 'Analysis complete!');
           setAiAnalysisError(undefined);
           setAiAnalysisLoading(false);
           setAiAnalysisResumed(false); // Not resumed for completed analysis
                 } else if (existingAnalysis.status === 'processing' || existingAnalysis.status === 'pending') {
           // In-progress analysis - resume polling
           console.log('Resuming polling for in-progress analysis:', existingAnalysis.jobId);
           setAiAnalysisJobId(existingAnalysis.jobId);
           setAiAnalysisStage(existingAnalysis.stage || 'Processing...');
           setAiAnalysisError(undefined);
           setAiAnalysisLoading(true);
           setAiAnalysisStartTime(new Date()); // Use current time since we don't have creation time
           setAiAnalysisResumed(true); // Mark as resumed
           
           // Resume polling for this job (only if jobId exists)
           if (existingAnalysis.jobId) {
             pollAnalysisCompletion(
               existingAnalysis.jobId,
               (progressResult) => {
                 setAiAnalysisStage(progressResult.stage || 'Processing...');
                 console.log('Analysis progress update:', progressResult.stage);
               },
               15 * 60 * 1000 // 15 minutes timeout
             ).then((finalResult) => {
               if (finalResult.status === 'completed' && (finalResult.url || finalResult.pdfData)) {
                 setAiAnalysisUrl(finalResult.url);
                 setAiAnalysisPdfData(finalResult.pdfData);
                 setAiAnalysisPdfFilename(finalResult.pdfFilename);
                 setAiAnalysisStage(finalResult.stage || 'Analysis complete!');
                 setAiAnalysisLoading(false);
                 setAiAnalysisError(undefined);
                 setAiAnalysisResumed(false); // Clear resumed flag when completed
               } else if (finalResult.status === 'error') {
                 setAiAnalysisError(finalResult.error || 'Analysis failed');
                 setAiAnalysisLoading(false);
                 setAiAnalysisUrl(undefined);
                 setAiAnalysisPdfData(undefined);
                 setAiAnalysisPdfFilename(undefined);
                 setAiAnalysisResumed(false); // Clear resumed flag on error
               }
             }).catch((error) => {
               console.error('Error polling analysis completion:', error);
               setAiAnalysisError('Failed to track analysis progress');
               setAiAnalysisLoading(false);
             });
           } else {
             // No jobId available - treat as error
             setAiAnalysisError('Invalid job ID - cannot track progress');
             setAiAnalysisLoading(false);
           }
        } else if (existingAnalysis.status === 'error') {
          // Error state
                     setAiAnalysisError(existingAnalysis.error || 'Analysis failed');
           setAiAnalysisJobId(existingAnalysis.jobId);
           setAiAnalysisLoading(false);
           setAiAnalysisUrl(undefined);
           setAiAnalysisPdfData(undefined);
           setAiAnalysisPdfFilename(undefined);
           setAiAnalysisResumed(false); // Not resumed for error state
        }
      } else {
        // Clear AI analysis state if no existing analysis found
        setAiAnalysisUrl(undefined);
        setAiAnalysisPdfData(undefined);
        setAiAnalysisPdfFilename(undefined);
        setAiAnalysisJobId(undefined);
        setAiAnalysisStage('');
        setAiAnalysisError(undefined);
        setAiAnalysisLoading(false);
        setAiAnalysisResumed(false);
      }
      
    } catch (err) {
      console.error('Error loading evaluation scores:', err);
      // Don't set error state for evaluation data, just log it
    } finally {
      setDataLoading(false);
    }
  };

  const loadHistoricalData = async () => {
    if (!employeeId || !historicalStartQuarter || !historicalEndQuarter) return;

    try {
      setHistoricalLoading(true);
      const historical = await fetchHistoricalEvaluationScores(
        employeeId, 
        historicalStartQuarter, 
        historicalEndQuarter
      );
      setHistoricalData(historical);
    } catch (err) {
      console.error('Error loading historical data:', err);
      // Don't set error state for historical data, just log it
    } finally {
      setHistoricalLoading(false);
    }
  };

  // Load core group analytics data for overview (TopAnalyticsGrid)
  const loadCoreGroupData = async () => {
    if (!employeeId || !selectedQuarter) return;

    try {
      setCoreGroupLoading(true);
      setCoreGroupError(null);
      
      // First check if core group data is available
      const isDataAvailable = await checkCoreGroupDataAvailability(employeeId, selectedQuarter);
      
      if (isDataAvailable) {
        // Fetch the actual core group analytics data
        const coreGroupAnalytics = await fetchCoreGroupAnalytics(employeeId, selectedQuarter);
        setCoreGroupData(coreGroupAnalytics);
        console.log('✅ Core group analytics loaded successfully');
      } else {
        // No data available - clear previous data
        setCoreGroupData(null);
        console.log('⚠️ No core group data available for this employee/quarter combination');
      }
      
    } catch (err) {
      console.error('Error loading core group data:', err);
      setCoreGroupError(err instanceof Error ? err.message : 'Failed to load core group analytics');
      setCoreGroupData(null);
    } finally {
      setCoreGroupLoading(false);
    }
  };

  const handleBackToSelection = () => {
    navigateToEmployeeSelection(true);
  };

  const handleQuarterChange = (quarterId: string) => {
    setSelectedQuarter(quarterId);
    updateNavigationState({ lastVisitedQuarter: quarterId });
  };

  const handleHistoricalStartQuarterChange = (quarterId: string) => {
    setHistoricalStartQuarter(quarterId);
  };

  const handleHistoricalEndQuarterChange = (quarterId: string) => {
    setHistoricalEndQuarter(quarterId);
  };



  // Calculate overall score for selected quarter - memoized
  const overallScore = useMemo(() => {
    if (evaluationScores.length === 0) return null;
    const totalScore = evaluationScores.reduce((sum, score) => sum + score.weighted_final_score, 0);
    return totalScore / evaluationScores.length;
  }, [evaluationScores]);

  // Get performance attributes data for charts - memoized
  const attributesData = useMemo(() => {
    return evaluationScores.map(score => ({
      attribute: score.attribute_name,
      manager: score.manager_score,
      peer: score.peer_score,
      self: score.self_score,
      weighted: score.weighted_final_score,
      hasManager: score.has_manager_eval,
      hasPeer: score.has_peer_eval,
      hasSelf: score.has_self_eval,
      completion: score.completion_percentage
    }));
  }, [evaluationScores]);

  // Enhanced trend data transformation with core group support (Stage 11) - memoized
  const trendData = useMemo(() => {
    if (!enhancedTrendData) {
      // Fallback to legacy trend data if enhanced data is not available
      if (!trendDataRaw || trendDataRaw.length === 0) return [];
      
      return trendDataRaw.map(quarterData => ({
        quarter: quarterData.quarter_id,
        quarterName: quarterData.quarter_name,
        averageScore: quarterData.final_quarter_score,
        completionRate: quarterData.completion_percentage,
        quarterDate: quarterData.quarter_start_date
      }));
    }
    
    console.log('🔍 Enhanced trend data available:', enhancedTrendData);
    console.log('📊 Individual trends:', enhancedTrendData.individualTrends);
    console.log('📈 Core group trends:', enhancedTrendData.coreGroupTrends);
    
    // Create a map of core group data by quarter for easier merging
    const coreGroupMap = new Map();
    enhancedTrendData.coreGroupTrends.forEach(coreGroup => {
      console.log('📋 Processing core group:', coreGroup);
      if (!coreGroupMap.has(coreGroup.quarter)) {
        coreGroupMap.set(coreGroup.quarter, {
          quarterName: coreGroup.quarterName,
          competence: coreGroup.competence,
          character: coreGroup.character,
          curiosity: coreGroup.curiosity
        });
      }
    });
    
    console.log('🗺️ Core group map:', coreGroupMap);
    
    // Transform enhanced trend data to TrendDataPoint format with core group support
    const result = enhancedTrendData.individualTrends.map(quarterData => {
      const coreGroupData = coreGroupMap.get(quarterData.quarter);
      console.log(`🔄 Merging quarter ${quarterData.quarter}:`, { quarterData, coreGroupData });
      
      return {
        quarter: quarterData.quarter,
        quarterName: coreGroupData?.quarterName || quarterData.quarter || 'Unknown Quarter', // Use quarter name from core group data if available
        averageScore: quarterData.overall || quarterData.score,
        completionRate: 100, // Default completion rate (can be enhanced later)
        quarterDate: quarterData.date,
        // Add core group data if available
        competence: coreGroupData?.competence,
        character: coreGroupData?.character,
        curiosity: coreGroupData?.curiosity
      };
    });
    
    console.log('✅ Final trend data for chart:', result);
    return result;
  }, [enhancedTrendData, trendDataRaw]);

  // Get selected quarter info - memoized
  const selectedQuarterInfo = useMemo(() => 
    quarters.find(q => q.id === selectedQuarter), 
    [quarters, selectedQuarter]
  );



  // Generate breadcrumbs
  const breadcrumbs = generateBreadcrumbs(location.pathname, employee?.name);

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading analytics..." />;
  }

  if (error || !employee) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ErrorMessage 
            message={error || 'Employee not found'} 
            onRetry={loadInitialData}
            retryText="Try Again"
          />
          <button onClick={handleBackToSelection} className="btn-secondary mt-4">
            Back to Employee Selection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Header */}
      <header className="bg-white border-b border-secondary-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          {/* Breadcrumb Navigation and Company Switcher */}
          <div className="mb-4 flex justify-between items-center">
            <Breadcrumb items={breadcrumbs} />
            <CompanySwitcher className="flex-shrink-0" />
          </div>
          
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <button
                onClick={handleBackToSelection}
                className="btn-secondary w-fit"
              >
                ← Back to Employees
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-secondary-800">
                  Employee Analytics
                </h1>
                <p className="text-sm sm:text-base text-secondary-600">
                  {selectedQuarterInfo ? `${selectedQuarterInfo.name} • ` : ''}
                  {evaluationScores.length} attributes
                  {overallScore && ` • Overall Score: ${overallScore.toFixed(1)}`}
                  {realtimeConnected && (
                    <span className="inline-flex items-center ml-2 text-xs">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></span>
                      Live
                      {lastUpdateTime && (
                        <span className="ml-1 text-secondary-500">
                          • Updated {lastUpdateTime.toLocaleTimeString()}
                        </span>
                      )}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:space-x-4">
              {/* Quarter Filter */}
              <div>
                <label htmlFor="quarter-select" className="block text-sm font-medium text-secondary-700 mb-1">
                  Quarter
                </label>
                <select
                  id="quarter-select"
                  value={selectedQuarter}
                  onChange={(e) => handleQuarterChange(e.target.value)}
                  className="input-field min-w-[200px]"
                  disabled={dataLoading}
                >
                  {quarters.map((quarter) => (
                    <option key={quarter.id} value={quarter.id}>
                      {quarter.name}
                    </option>
                  ))}
                </select>
              </div>



              {/* Generate PDF Report Button */}
              <div className="no-print">
                <label className="block text-sm font-medium text-secondary-700 mb-1 opacity-0">
                  PDF Report
                </label>
                <Suspense fallback={<LoadingSpinner message="Loading PDF generator..." />}>
                  <LazyGeneratePDFButton
                    employee={employee!}
                    selectedQuarter={selectedQuarter}
                    quarterName={selectedQuarterInfo?.name || 'Current Quarter'}
                    disabled={!employee || !selectedQuarter || loading}
                  />
                </Suspense>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="analytics-main-content" className="max-w-7xl mx-auto px-6 py-8 analytics-layout">

        {/* Enhanced Employee Profile Section with Profile Picture */}
        <div className="page-break-avoid employee-profile">
          <EmployeeProfile
            employee={employee}
            onProfilePictureUpdate={handleProfilePictureUpdate}
            isEditable={isUserEditable()}
            currentUserId={user?.id}
            currentGrade={overallScore ? getLetterGrade(overallScore) : undefined}
            currentScore={overallScore || undefined}
            quarterName={selectedQuarterInfo?.name}
            quarterId={selectedQuarter}
            showPersonaWidget={true}
          />
        </div>

        {/* Quarterly Notes Section */}
        {selectedQuarterInfo && (
          <div className="page-break-avoid quarterly-notes">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold text-gray-900">Quarterly Notes</h3>
              {!isUserEditable() && user?.email && (
                <button
                  onClick={refreshUserPermissions}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                  title="Refresh editing permissions"
                >
                  🔄 Refresh Permissions
                </button>
              )}
            </div>
            <QuarterlyNotes
              employeeId={employee.id}
              quarterId={selectedQuarter}
              quarterName={selectedQuarterInfo.name}
              currentUserId={user?.id}
              isEditable={isUserEditable()}
              className="mb-6"
            />
          </div>
        )}

        {/* Core Group Strategic Analytics Overview - Stage 12 Enhanced */}
        <div className="page-break-avoid core-group-analytics mb-6">
          <TopAnalyticsGrid
            data={coreGroupData}
            isLoading={coreGroupLoading}
            error={coreGroupError}
            employeeName={employee?.name}
            quarterName={selectedQuarterInfo?.name}
          />
        </div>

        {/* Core Group Detailed Analysis Tabs - Drill-Down View */}
        <div className="page-break-avoid core-group-detailed-tabs">
          <Suspense fallback={<LoadingSpinner message="Loading detailed analysis..." />}>
            <LazyCoreGroupAnalysisTabs
              employeeId={employeeId || ''}
              quarterId={selectedQuarter}
              employeeName={employee?.name}
              quarterName={selectedQuarterInfo?.name}
              className="mb-8"
            />
          </Suspense>
        </div>

        {/* Performance Overview (Radar Chart) - Full Width */}
        <div className="mb-8 page-break-avoid analytics-section">
          <Card className="page-break-avoid chart-container">
            {dataLoading && (
              <div className="flex justify-end mb-4">
                <LoadingSpinner size="sm" />
              </div>
            )}
            
            {dataLoading ? (
              <ChartSkeleton height="h-64 md:h-96" />
            ) : attributesData.length > 0 ? (
              <RadarChart 
                data={attributesData}
                height={radarChartHeight}
              />
            ) : (
              <NoEvaluationData quarterName={selectedQuarterInfo?.name} />
            )}
          </Card>
        </div>

        {/* Analytics Charts - Full Width Layout */}
        <div className="space-y-8 mb-8 analytics-section">
          {/* Current Quarter Bar Chart */}
          <Card className="page-break-avoid chart-container">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-secondary-800 chart-title">
                {selectedQuarterInfo?.name || 'Quarter'} Breakdown
              </h2>
              {dataLoading && <LoadingSpinner size="sm" />}
            </div>
            
            {dataLoading ? (
              <ChartSkeleton height="h-64 md:h-80" />
            ) : attributesData.length > 0 ? (
              <ClusteredBarChart 
                data={attributesData}
                height={barChartHeight}
                showLegend={true}
              />
            ) : (
              <NoEvaluationData quarterName={selectedQuarterInfo?.name} />
            )}
          </Card>

          {/* Trend Analysis */}
          <Card className="chart-container trend-chart-container">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-secondary-800 chart-title">Performance Trend</h2>
              {dataLoading && <LoadingSpinner size="sm" />}
            </div>
            <TrendLineChart 
              data={trendData}
              height={trendChartHeight}
              employeeName={employee?.name}
              viewMode={trendViewMode}
              onViewModeChange={setTrendViewMode}
              showViewToggle={true}
            />
          </Card>

          {/* Historical Comparison */}
          <Card className="chart-container historical-chart-container">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-secondary-800 chart-title">Historical Comparison</h2>
              {historicalLoading && <LoadingSpinner size="sm" />}
            </div>
            
                         {historicalLoading ? (
               <ChartSkeleton height="h-64 md:h-96" />
             ) : (
               <HistoricalClusteredBarChart
                 data={historicalData}
                 height={historicalChartHeight}
                 title="Performance Comparison Across Quarters"
                 availableQuarters={availableQuarters}
                 startQuarter={historicalStartQuarter}
                 endQuarter={historicalEndQuarter}
                 onStartQuarterChange={handleHistoricalStartQuarterChange}
                 onEndQuarterChange={handleHistoricalEndQuarterChange}
                 isLoadingQuarters={loading}
                 showQuarterSelector={true}
                 employeeName={employee?.name}
               />
             )}
          </Card>
        </div>




      </main>
      
      {/* Keyboard Shortcuts Helper */}
      <KeyboardShortcuts />
    </div>
  );
}; 