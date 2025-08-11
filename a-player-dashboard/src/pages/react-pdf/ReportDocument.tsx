/**
 * React-PDF ReportDocument Component
 * Document composer that combines all pages in order
 * Receives one prop: { data: PDFEmployeeData, quarterName: string }
 */

import React from 'react';
import { Document, StyleSheet } from '@react-pdf/renderer';
import { CoverPage, SummaryPage, StrengthsPage, DescriptiveReviewPage, CoachingReportPage } from './index';
import type { PDFEmployeeData } from '../../services/pdfDataService';
import type { AIReviewOut } from '../../services/aiReviewService';

interface ReportDocumentProps {
  data: PDFEmployeeData;
  quarterName: string;
  aiReview?: AIReviewOut | null;
  coachingReport?: any | null;
}

export const ReportDocument: React.FC<ReportDocumentProps> = ({ 
  data, 
  quarterName,
  aiReview,
  coachingReport
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
    items.sort((a, b) => a.name.localeCompare(b.name));
    return items;
  };

  const strengths = collectStrengths();
  const itemsPerPage = 8;
  const strengthsPages = Math.min(2, Math.ceil(strengths.length / itemsPerPage));

  // Total pages: Cover + Summary + Strengths pages (0-2) + Descriptive Review + Coaching Report
  const totalPages = 2 + strengthsPages + 2;

  const styles = StyleSheet.create({
    document: {
      fontFamily: 'Helvetica'
    }
  });

  return (
    <Document 
      style={styles.document}
      title={`Performance Report - ${data.employee.name || 'Employee'} - ${quarterName}`}
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
          pageIndex={index}
          itemsPerPage={itemsPerPage}
          pageNumber={3 + index}
          totalPages={totalPages}
        />
      ))}

      {/* Page: Descriptive Review Page */}
      <DescriptiveReviewPage
        data={data}
        aiReview={aiReview || undefined}
        pageNumber={2 + strengthsPages + 1}
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