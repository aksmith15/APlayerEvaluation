/**
 * React-PDF ReportDocument Component
 * Document composer that combines all pages in order
 * Receives one prop: { data: PDFEmployeeData, quarterName: string }
 */

import React from 'react';
import { Document, StyleSheet } from '@react-pdf/renderer';
import { CoverPage, SummaryPage, StrengthsPage, DevelopmentAreasPage, DescriptiveReviewPage, CoachingReportPage } from './index';
import { getDefaultCompanyWeights } from '../../services/attributeWeightsService';
import { formatNameForPDF } from '../../utils/nameUtils';
import type { PDFEmployeeData } from '../../services/pdfDataService';
import type { AIReviewOut } from '../../services/aiReviewService';
import type { AIInsightsResponse } from '../../services/aiInsightsService';

interface ReportDocumentProps {
  data: PDFEmployeeData;
  quarterName: string;
  aiReview?: AIReviewOut | null;
  coachingReport?: any | null;
  strengthsInsights?: AIInsightsResponse | null;
  developmentInsights?: AIInsightsResponse | null;
}

export const ReportDocument: React.FC<ReportDocumentProps> = ({ 
  data, 
  quarterName,
  aiReview,
  coachingReport,
  strengthsInsights,
  developmentInsights
}) => {
  // Build strengths list to determine how many Strengths pages to render (max 2)
  const collectStrengths = () => {
    const groups = [
      data.coreGroupBreakdown?.competence,
      data.coreGroupBreakdown?.character,
      data.coreGroupBreakdown?.curiosity
    ].filter(Boolean) as any[];

    const seen = new Set<string>();
    const items: { name: string; score: number }[] = [];

    for (const group of groups) {
      for (const attr of group.attributes || []) {
        const name: string = attr.attributeName || attr.attribute || '';
        const score: number = (attr.scores?.weighted ?? attr.weighted) || 0;
        if (score >= 8.0 && name) {
          const key = name.toLowerCase().replace(/\s+/g, ' ').trim();
          if (!seen.has(key)) {
            items.push({ name, score });
            seen.add(key);
          }
        }
      }
    }
    // Sort by attribute weight (highest weight first), then by score
    const attributeWeights = getDefaultCompanyWeights();
    const weightMap = attributeWeights.reduce((map, item) => {
      map[item.attribute_name] = item.weight;
      return map;
    }, {} as Record<string, number>);

    items.sort((a, b) => {
      const weightA = weightMap[a.name] || 1.0;
      const weightB = weightMap[b.name] || 1.0;
      
      // Primary sort: by weight (highest first)
      if (Math.abs(weightA - weightB) > 0.05) {
        return weightB - weightA;
      }
      
      // Secondary sort: by score (highest first)
      if (Math.abs(a.score - b.score) > 0.1) {
        return b.score - a.score;
      }
      
      // Tertiary sort: alphabetical
      return a.name.localeCompare(b.name);
    });

    return items;
  };

  // Build development areas list to determine how many Development Areas pages to render (max 2)
  const collectDevelopmentAreas = () => {
    const groups = [
      data.coreGroupBreakdown?.competence,
      data.coreGroupBreakdown?.character,
      data.coreGroupBreakdown?.curiosity
    ].filter(Boolean) as any[];

    const seen = new Set<string>();
    const items: { name: string; score: number }[] = [];

    for (const group of groups) {
      for (const attr of group.attributes || []) {
        const name: string = attr.attributeName || attr.attribute || '';
        const score: number = (attr.scores?.weighted ?? attr.weighted) || 0;
        if (score < 8.0 && name) { // Development areas: scores below 8.0
          const key = name.toLowerCase().replace(/\s+/g, ' ').trim();
          if (!seen.has(key)) {
            items.push({ name, score });
            seen.add(key);
          }
        }
      }
    }
    // Sort by score (lowest first - most improvement needed), then by attribute weight
    const attributeWeights = getDefaultCompanyWeights();
    const weightMap = attributeWeights.reduce((map, item) => {
      map[item.attribute_name] = item.weight;
      return map;
    }, {} as Record<string, number>);

    items.sort((a, b) => {
      // Primary sort: by score (lowest first)
      if (Math.abs(a.score - b.score) > 0.1) {
        return a.score - b.score;
      }
      
      // Secondary sort: by weight (highest weight first for equal scores)
      const weightA = weightMap[a.name] || 1.0;
      const weightB = weightMap[b.name] || 1.0;
      if (Math.abs(weightA - weightB) > 0.05) {
        return weightB - weightA;
      }
      
      // Tertiary sort: alphabetical
      return a.name.localeCompare(b.name);
    });

    return items;
  };

  const strengths = collectStrengths();
  const developmentAreas = collectDevelopmentAreas();
  const itemsPerPage = 8;
  const strengthsPages = Math.min(2, Math.ceil(strengths.length / itemsPerPage));
  const developmentPages = Math.min(2, Math.ceil(developmentAreas.length / itemsPerPage));

  // Total pages: Cover + Summary + Strengths pages (0-2) + Development Areas pages (0-2) + Descriptive Review + Coaching Report
  const totalPages = 2 + strengthsPages + developmentPages + 2;

  const styles = StyleSheet.create({
    document: {
      fontFamily: 'Helvetica'
    }
  });

  return (
    <Document 
      style={styles.document}
      title={`Performance Report - ${formatNameForPDF(data.employee.name, true)} - ${quarterName}`}
      author="Culture Base A-Player Evaluation System"
      subject={`Quarterly Performance Evaluation for ${quarterName}`}
      keywords="performance evaluation, 360 feedback, employee assessment"
    >
      {/* Page 1: Cover Page (Executive Summary) */}
      <CoverPage 
        data={data}
        quarterName={quarterName}
      />

      {/* Page 2: Summary Page (Consensus Analysis) */}
      <SummaryPage 
        data={data}
        pageNumber={2}
        totalPages={totalPages}
      />

      {/* Pages 3-4: Strengths Pages (unified section, max 2 pages) */}
      {Array.from({ length: strengthsPages }).map((_, index) => (
        <StrengthsPage
          key={`strengths-${index}`}
          data={data}
          aiInsights={strengthsInsights}
          pageIndex={index}
          itemsPerPage={itemsPerPage}
          pageNumber={3 + index}
          totalPages={totalPages}
        />
      ))}

      {/* Pages: Development Areas Pages (unified section, max 2 pages) */}
      {Array.from({ length: developmentPages }).map((_, index) => (
        <DevelopmentAreasPage
          key={`development-${index}`}
          data={data}
          aiInsights={developmentInsights}
          pageIndex={index}
          itemsPerPage={itemsPerPage}
          pageNumber={3 + strengthsPages + index}
          totalPages={totalPages}
        />
      ))}

      {/* Page: Descriptive Review Page */}
      <DescriptiveReviewPage
        data={data}
        aiReview={aiReview || undefined}
        pageNumber={2 + strengthsPages + developmentPages + 1}
        totalPages={totalPages}
      />

      {/* Final Page: Coaching Report */}
      <CoachingReportPage
        data={data}
        report={coachingReport || undefined}
        pageNumber={totalPages}
        totalPages={totalPages}
      />
    </Document>
  );
};