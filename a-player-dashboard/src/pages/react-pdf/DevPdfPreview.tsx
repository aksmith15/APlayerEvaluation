import React from 'react';
import { PDFViewer, BlobProvider } from '@react-pdf/renderer';
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchPDFEmployeeData } from '../../services/pdfDataService';
import { ReportDocument } from './ReportDocument';
import { useNavigation } from '../../contexts/NavigationContext';
import { fetchDescriptiveReview } from '../../services/aiReviewService';
import type { AIReviewOut } from '../../services/aiReviewService';
import { fetchCoachingReport, type AICoachingPayload } from '../../services/aiCoachingService';
import { fetchAttributeResponses } from '../../services/attributeResponsesService';

export const DevPdfPreview: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { navigationState } = useNavigation();

  const params = new URLSearchParams(location.search);
  const initialEmployeeId = params.get('employeeId') || navigationState.previousEmployee?.id || '';
  const initialQuarterId = params.get('quarterId') || navigationState.lastVisitedQuarter || '';

  const [employeeId, setEmployeeId] = React.useState<string>(initialEmployeeId);
  const [quarterId, setQuarterId] = React.useState<string>(initialQuarterId);
  const [quarterName, setQuarterName] = React.useState<string>(params.get('quarterName') || '');
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<any>(null);
  const [aiReview, setAiReview] = React.useState<AIReviewOut | null>(null);
  const [coachingReport, setCoachingReport] = React.useState<any | null>(null);

  const canFetch = employeeId && quarterId;

  const refetch = React.useCallback(async () => {
    if (!canFetch) return;
    setIsLoading(true);
    setError(null);
    setAiReview(null);
    try {
      const result = await fetchPDFEmployeeData(employeeId, quarterId);
      setData(result);
      if (!quarterName) {
        setQuarterName(result?.quarter?.name || '');
      }
      // Build compact AI payload and invoke Edge Function
      try {
        const toLetter = (s: number) => (s >= 8 ? 'A' : s >= 7 ? 'B' : s >= 6 ? 'C' : 'D');
        const toGroup = (attrs?: any[]) =>
          attrs?.reduce((acc: any, a: any) => {
            const name = a.attributeName || a.attribute;
            const score = a.scores?.weighted ?? a.weighted ?? 0;
            acc[name] = { score, grade: toLetter(score) };
            return acc;
          }, {}) || undefined;

        console.log('🧠 Invoking AI Descriptive Review...');
        const review = await fetchDescriptiveReview({
          employeeName: result.employee?.name || 'Employee',
          quarterId: result.quarter?.id,
          groups: {
            competence: toGroup(result.coreGroupBreakdown?.competence?.attributes),
            character: toGroup(result.coreGroupBreakdown?.character?.attributes),
            curiosity: toGroup(result.coreGroupBreakdown?.curiosity?.attributes)
          }
        });
        setAiReview(review);
        console.log('✅ AI Descriptive Review received');
      } catch (aiErr) {
        console.warn('AI descriptive review unavailable, using static fallback.', aiErr);
        setAiReview(null);
      }

      // Coaching report
      try {
        console.log('🧠 Invoking AI Coaching Report...');
        const responses = await fetchAttributeResponses(employeeId, quarterId);
        const normalizeName = (s: string) => (s || '').replace(/\s+/g, ' ').trim();
        const toAttrMap = (group?: any[]) => {
          const map: Record<string, any> = {};
          (group || []).forEach((a: any) => {
            const key = normalizeName(a.attributeName || a.attribute || '');
            if (!key) return;
            map[key] = {
              scores: {
                self: a.scores?.self ?? 0,
                peer: a.scores?.peer ?? 0,
                manager: a.scores?.manager ?? 0,
                weighted: a.scores?.weighted ?? 0
              },
              responses: [] as any[]
            };
          });
          return map;
        };
        const attrMap = {
          ...toAttrMap(result.coreGroupBreakdown?.competence?.attributes),
          ...toAttrMap(result.coreGroupBreakdown?.character?.attributes),
          ...toAttrMap(result.coreGroupBreakdown?.curiosity?.attributes)
        } as Record<string, { scores: any; responses: any[] }>;

        responses.forEach(r => {
          const key = normalizeName(r.attribute_name);
          if (!attrMap[key]) {
            attrMap[key] = { scores: { self: 0, peer: 0, manager: 0, weighted: 0 }, responses: [] };
          }
          attrMap[key].responses.push(r);
        });

        const payload: AICoachingPayload = {
          employee: { id: employeeId, name: result.employee?.name || 'Employee' },
          quarter: { id: result.quarter?.id, name: result.quarter?.name || '' },
          attributes: attrMap
        };
        const coaching = await fetchCoachingReport(payload);
        setCoachingReport(coaching?.coaching_report || null);
        console.log('✅ AI Coaching Report received');
      } catch (aiErr) {
        console.warn('AI coaching report unavailable; continuing without it.', aiErr);
        setCoachingReport(null);
      }
      const next = new URLSearchParams(location.search);
      next.set('employeeId', employeeId);
      next.set('quarterId', quarterId);
      if (result?.quarter?.name) next.set('quarterName', result.quarter.name);
      navigate({ search: next.toString() }, { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Failed to load PDF data');
    } finally {
      setIsLoading(false);
    }
  }, [canFetch, employeeId, quarterId, quarterName, location.search, navigate]);

  React.useEffect(() => {
    if (canFetch) {
      refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId, quarterId]);

  const documentElement = data ? (
    <ReportDocument 
      data={data} 
      quarterName={quarterName || data?.quarter?.name || ''}
      aiReview={aiReview || undefined}
      coachingReport={coachingReport || undefined}
    />
  ) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{ padding: 10, borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 8 }}>
        <strong>React-PDF Live Preview (DEV)</strong>
        <label style={{ marginLeft: 12 }}>Employee ID:</label>
        <input
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          placeholder="employee UUID"
          style={{ width: 300, padding: '4px 6px' }}
        />
        <label style={{ marginLeft: 8 }}>Quarter ID:</label>
        <input
          value={quarterId}
          onChange={(e) => setQuarterId(e.target.value)}
          placeholder="quarter UUID"
          style={{ width: 260, padding: '4px 6px' }}
        />
        <button onClick={refetch} disabled={!canFetch || isLoading} style={{ marginLeft: 8, padding: '4px 10px' }}>
          {isLoading ? 'Loading…' : 'Refresh'}
        </button>
        {documentElement ? (
          <BlobProvider document={documentElement}>
            {({ url, loading }) => (
              <button
                onClick={() => url && window.open(url, '_blank', 'noopener,noreferrer')}
                disabled={loading || !url}
                style={{ marginLeft: 8, padding: '4px 10px' }}
              >
                {loading ? 'Preparing…' : 'Open in New Tab'}
              </button>
            )}
          </BlobProvider>
        ) : null}
        {error ? <span style={{ color: '#b91c1c', marginLeft: 12 }}>Error: {error}</span> : null}
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        {documentElement && (
          <PDFViewer style={{ width: '100%', height: '100%' }} showToolbar>
            {/* HMR will re-render this document on code changes */}
            {documentElement}
          </PDFViewer>
        )}
        {!data && (
          <div style={{ padding: 16 }}>
            {canFetch ? 'Loading preview…' : 'Enter employeeId and quarterId to preview the PDF.'}
          </div>
        )}
      </div>
    </div>
  );
};

export default DevPdfPreview;

