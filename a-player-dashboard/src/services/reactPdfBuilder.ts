/**
 * React-PDF Builder Service
 * New Burke-styled PDF renderer using @react-pdf/renderer
 * Non-breaking alternative to legacy jsPDF system
 */

import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import { generateDownloadFilename } from '../utils/downloadUtils';
import { fetchPDFEmployeeData } from './pdfDataService';
import { ReportDocument } from '../pages/react-pdf/ReportDocument';
import { fetchDescriptiveReview } from './aiReviewService';
import { fetchCoachingReport, type AICoachingPayload } from './aiCoachingService';
import { fetchAttributeResponses } from './attributeResponsesService';
import { fetchStrengthsInsights, fetchDevelopmentInsights, transformAttributesForAI } from './aiInsightsService';
import type { AIInsightsResponse } from './aiInsightsService';
import type { Person } from '../types/database';
import { getTagsForQuestionId } from '../constants/questionTags';

interface GenerateEmployeeReportOptions {
  employee: Person;
  selectedQuarter: string;
  quarterName?: string;
}

/**
 * Generate employee report using React-PDF renderer
 * Identical signature to legacy service for drop-in use
 */
export async function generateEmployeeReportReact(
  options: GenerateEmployeeReportOptions
): Promise<void> {
  const {
    employee,
    selectedQuarter,
    quarterName = `Q${selectedQuarter.slice(-1)} 2025`
  } = options;

  if (!employee?.id) {
    throw new Error('Employee information is required for PDF generation');
  }

  if (!selectedQuarter) {
    throw new Error('Quarter selection is required for PDF generation');
  }

  try {
    console.log('🔄 Generating React-PDF styled report...');

    // Fetch all required data using existing service
    const data = await fetchPDFEmployeeData(employee.id, selectedQuarter);
    
    // Validate critical data structure
    if (!data.employee || !data.coreGroupBreakdown) {
      throw new Error('Missing critical PDF data: employee or coreGroupBreakdown');
    }

    // Generate filename using existing utility
    const filename = generateDownloadFilename(
      employee.name || `Employee_${employee.id}`,
      quarterName,
      'pdf'
    );

    // Prepare compact AI payload (optional)
    const toLetter = (s: number) => (s >= 8 ? 'A' : s >= 7 ? 'B' : s >= 6 ? 'C' : 'D');
    const toGroup = (attrs?: any[]) =>
      attrs?.reduce((acc: any, a: any) => {
        const name = a.attributeName || a.attribute;
        const score = a.scores?.weighted ?? a.weighted ?? 0;
        acc[name] = { score, grade: toLetter(score) };
        return acc;
      }, {}) || undefined;

    let aiReview: any = null;
    try {
      aiReview = await fetchDescriptiveReview({
        employeeName: data.employee.name || 'Employee',
        quarterId: data.quarter.id,
        groups: {
          competence: toGroup(data.coreGroupBreakdown?.competence?.attributes),
          character: toGroup(data.coreGroupBreakdown?.character?.attributes),
          curiosity: toGroup(data.coreGroupBreakdown?.curiosity?.attributes)
        }
      });
    } catch (e) {
      console.warn('AI descriptive review unavailable, falling back to static profiles:', e);
    }

    // Fetch AI insights for strengths and development areas
    let strengthsInsights: AIInsightsResponse | null = null;
    let developmentInsights: AIInsightsResponse | null = null;
    
    console.log('🔍 About to start AI insights section...');
    try {
      console.log('🔄 Fetching AI insights for strengths and development areas...');
      
      // Transform attributes for AI processing
      const strengthsAttributes = transformAttributesForAI(data.coreGroupBreakdown, 8.0, true);
      const developmentAttributes = transformAttributesForAI(data.coreGroupBreakdown, 8.0, false);
      
      console.log('🔍 Transformed attributes:', {
        strengthsCount: strengthsAttributes.length,
        strengthsAttributes: strengthsAttributes.map(a => ({ name: a.name, score: a.score })),
        developmentCount: developmentAttributes.length,
        developmentAttributes: developmentAttributes.map(a => ({ name: a.name, score: a.score }))
      });
      
      // Prepare employee data for AI insights
      const aiEmployee = {
        name: data.employee.name || 'Employee',
        department: data.employee.department || 'Unknown',
        tenure_category: data.employee.tenure_category,
        role: data.employee.role || 'Team Member',
        id: data.employee.id
      };

      // Fetch insights sequentially with delays to avoid rate limiting
      console.log('🕒 Adding 2-second delay before AI insights to avoid rate limiting...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (strengthsAttributes.length > 0) {
        try {
          strengthsInsights = await fetchStrengthsInsights(aiEmployee, strengthsAttributes);
          console.log(`✅ Fetched ${strengthsInsights.insights.length} strengths insights`);
        } catch (error) {
          console.warn('Strengths insights failed:', error);
        }
        
        // Add delay between AI calls to avoid rate limiting
        console.log('🕒 Adding 1-second delay between insights calls...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      if (developmentAttributes.length > 0) {
        try {
          developmentInsights = await fetchDevelopmentInsights(aiEmployee, developmentAttributes);
          console.log(`✅ Fetched ${developmentInsights.insights.length} development insights`);
        } catch (error) {
          console.warn('Development insights failed:', error);
        }
      }
    } catch (e) {
      console.warn('AI insights unavailable, falling back to static descriptions:', e);
    }

      // Build Coaching Report payload(s) and fetch report via three-section strategy
    let coachingReport: any = null;
    try {
      const responses = await fetchAttributeResponses(employee.id, selectedQuarter);

      const normalizeName = (s: string) => (s || '').toLowerCase().replace(/[\s_-]+/g, ' ').trim();

      const toAttrMap = (group?: any[]) => {
        const map: Record<string, any> = {};
        (group || []).forEach((a: any) => {
          const key = normalizeName(a.attributeName || a.attribute || '');
          if (!key) return;
          const self = a.scores?.self ?? 0;
          const peer = a.scores?.peer ?? 0;
          const manager = a.scores?.manager ?? 0;
          const weighted = a.scores?.weighted ?? 0;
          const selfVsOthers = (() => {
            const others = (manager + peer) / 2 || 0;
            return others ? Number((self - others).toFixed(2)) : 0;
          })();
          const managerVsPeer = Number((manager - peer).toFixed(2));

          map[key] = {
            scores: { self, peer, manager, weighted },
            gaps: { self_vs_others: selfVsOthers, manager_vs_peer: managerVsPeer },
            aggregates: {},
            responses: [] as any[]
          };
        });
        return map;
      };

      // Attribute grouping by core group for scoped calls
      const compMap = toAttrMap(data.coreGroupBreakdown?.competence?.attributes);
      const charMap = toAttrMap(data.coreGroupBreakdown?.character?.attributes);
      const curiMap = toAttrMap(data.coreGroupBreakdown?.curiosity?.attributes);

      // Attach responses into their attribute buckets with tags and recency
      const sortedByDate = [...responses].sort((a, b) => {
        const ta = a.created_at ? Date.parse(a.created_at) : 0;
        const tb = b.created_at ? Date.parse(b.created_at) : 0;
        return tb - ta;
      });

      // Deterministic tagger using survey question IDs
      const tagForQuestion = (qid?: string, qtext?: string): string[] => getTagsForQuestionId(qid, qtext);

      const bucketResponse = (target: Record<string, any>, r: any) => {
        const key = normalizeName(r.attribute_name);
        if (!target[key]) {
          target[key] = {
            scores: { self: 0, peer: 0, manager: 0, weighted: 0 },
            gaps: {},
            aggregates: {},
            responses: [] as any[]
          };
        }
        const tags = tagForQuestion(r.question_id, r.question_text);
        target[key].responses.push({ ...r, tags });
      };

      sortedByDate.forEach((r, idx) => {
        const key = normalizeName(r.attribute_name);
        // Mark recency for top 3 by attribute
        const priorCount = sortedByDate
          .slice(0, idx)
          .filter(x => normalizeName(x.attribute_name) === key && x.evaluation_type === r.evaluation_type)
          .length;
        const is_recent = priorCount < 3;
        // Route into all relevant maps
        if (compMap[key] !== undefined) bucketResponse(compMap, { ...r, is_recent });
        if (charMap[key] !== undefined) bucketResponse(charMap, { ...r, is_recent });
        if (curiMap[key] !== undefined) bucketResponse(curiMap, { ...r, is_recent });
      });

      // Overview map = union of all
      const overviewMap: Record<string, any> = { ...compMap, ...charMap, ...curiMap };

      // Build simple aggregates for multi-select questions: top 3 values per question_id
      const buildAggregates = (map: Record<string, any>) => {
        Object.values(map).forEach((bucket: any) => {
          const byQuestion: Record<string, Record<string, number>> = {};
          (bucket.responses || []).forEach((r: any) => {
            const qid = r.question_id || 'unknown';
            const val = r.response_value;
            if (!byQuestion[qid]) byQuestion[qid] = {};
            if (Array.isArray(val)) {
              val.forEach(v => {
                const key = String(v);
                byQuestion[qid][key] = (byQuestion[qid][key] || 0) + 1;
              });
            } else if (val !== undefined && val !== null) {
              const key = String(val);
              byQuestion[qid][key] = (byQuestion[qid][key] || 0) + 1;
            }
          });
          const aggregates: Record<string, { top_values: Array<{ value: string; count: number }> }> = {};
          Object.entries(byQuestion).forEach(([qid, counts]) => {
            const top = Object.entries(counts)
              .map(([value, count]) => ({ value, count }))
              .sort((a, b) => b.count - a.count)
              .slice(0, 3);
            aggregates[qid] = { top_values: top };
          });
          bucket.aggregates = aggregates;
        });
      };

      buildAggregates(compMap);
      buildAggregates(charMap);
      buildAggregates(curiMap);
      buildAggregates(overviewMap);

      const base = {
        employee: { id: employee.id, name: data.employee.name || 'Employee' },
        quarter: { id: data.quarter.id, name: data.quarter.name }
      };

      // Throttle to avoid 429 rate limits: start with 3 overview calls only
      const sectionPayloads: AICoachingPayload[] = [
        { ...base, scope: 'overview', section: 'strengths_dev', attributes: overviewMap },
        { ...base, scope: 'overview', section: 'gaps_incidents', attributes: overviewMap },
        { ...base, scope: 'overview', section: 'questions', attributes: overviewMap }
      ];

      const results = await Promise.all(sectionPayloads.map(p => fetchCoachingReport(p)));

      // Merge keys from sectioned responses
      const empty = { top_strengths: [], top_development_priorities: [], perception_gaps: [], critical_incidents: [], '1on1_questions': [] as any[] } as any;
      const merged: any = { ...empty };

      results.forEach((r) => {
        const cr = r?.coaching_report || {};
        if (Array.isArray(cr.top_strengths)) merged.top_strengths.push(...cr.top_strengths);
        if (Array.isArray(cr.top_development_priorities)) merged.top_development_priorities.push(...cr.top_development_priorities);
        if (Array.isArray(cr.perception_gaps)) merged.perception_gaps.push(...cr.perception_gaps);
        if (Array.isArray(cr.critical_incidents)) merged.critical_incidents.push(...cr.critical_incidents);
        const qs = cr['1on1_questions'];
        if (Array.isArray(qs)) merged['1on1_questions'].push(...qs);
      });

      // Optional: per-core-group depth can be added later with sequential throttling to avoid 429
      coachingReport = merged;
    } catch (e) {
      console.warn('AI coaching report unavailable; continuing without it:', e);
    }

    // Create React-PDF document
    console.log('🔄 Creating React-PDF document...');
    const element = React.createElement(ReportDocument as unknown as React.FC<any>, {
      data: data,
      aiReview: aiReview,
      quarterName: quarterName,
      coachingReport: coachingReport,
      strengthsInsights: strengthsInsights,
      developmentInsights: developmentInsights
    } as any);

    const blob = await pdf(element as any).toBlob();

    // Download the PDF using file-saver
    saveAs(blob, filename);

    console.log('✅ React-PDF styled report generated successfully');

  } catch (error) {
    console.error('❌ Failed to generate React-PDF styled report:', error);
    
    if (error instanceof Error) {
      throw new Error(`React-PDF generation failed: ${error.message}`);
    } else {
      throw new Error('React-PDF generation failed due to an unknown error');
    }
  }
}