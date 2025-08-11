/**
 * React-PDF DescriptiveReviewPage Component (Descriptive Review)
 * Integrated narrative assessment based on attribute letter-grade combinations.
 */

import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { PageWrapper } from '../../components/pdf';
import { COLORS, LAYOUT, getFontWeight } from '../../lib/theme';
import { profileDescriptions, DEFAULT_MISSING_PROFILE_MESSAGE } from './profileDescriptions';
import type { PDFEmployeeData } from '../../services/pdfDataService';
import type { AIReviewOut } from '../../services/aiReviewService';

interface DescriptiveReviewPageProps {
  data: PDFEmployeeData;
  aiReview?: AIReviewOut;
  pageNumber: number;
  totalPages: number;
}

export const DescriptiveReviewPage: React.FC<DescriptiveReviewPageProps> = ({ 
  data,
  aiReview,
  pageNumber, 
  totalPages 
}) => {
  const styles = StyleSheet.create({
    container: {
      padding: LAYOUT.pageMargin,
      backgroundColor: COLORS.ui.background
    },
    pageTitle: {
      fontSize: 18,
      fontWeight: getFontWeight('bold'),
      color: COLORS.ui.textPrimary,
      marginBottom: LAYOUT.elementSpacing
    },
    pageSubtitle: {
      fontSize: 9,
      color: COLORS.ui.textSecondary,
      lineHeight: 1.2,
      marginBottom: LAYOUT.sectionSpacing
    },
    groupBlock: {
      marginBottom: 15
    },
    groupHeader: {
      fontSize: 14,
      fontWeight: getFontWeight('bold'),
      color: '#4A9B8E',
      marginBottom: 6
    },
    gradeLine: {
      fontSize: 12,
      color: '#6b7280',
      marginBottom: 6
    },
    paragraph: {
      fontSize: 11,
      color: COLORS.ui.textPrimary,
      lineHeight: 1.2,
      textAlign: 'justify'
    },
    pipNote: {
      fontSize: 10,
      color: COLORS.performance.poor,
      marginTop: 4
    }
  });

  const employeeName = data.employee.name || 'This employee';

  const toLetter = (score: number): 'A' | 'B' | 'C' | 'D' => {
    if (score >= 8.0) return 'A';
    if (score >= 7.0) return 'B';
    if (score >= 6.0) return 'C';
    return 'D';
  };

  const findAttr = (group: any, name: string): number | undefined => {
    if (!group?.attributes) return undefined;
    const attr = group.attributes.find((a: any) => {
      const n1 = (a.attributeName || a.attribute || '').toLowerCase().replace(/\s+/g, ' ').trim();
      const n2 = name.toLowerCase().replace(/\s+/g, ' ').trim();
      return n1 === n2;
    });
    return attr ? (attr.scores?.weighted ?? attr.weighted ?? 0) : undefined;
  };

  const buildCombo = (letters: string[]): string | null => {
    if (letters.some(l => !l)) return null;
    return letters.join(',');
  };

  const formatGradesLine = (pairs: Array<{ label: string; grade: string }>): string =>
    pairs.map(p => `${p.label}: ${p.grade}`).join(' | ');

  const renderGroup = (
    header: string,
    gradeLine: string,
    description: string,
    pipNeeded: boolean
  ) => (
    <View style={styles.groupBlock} wrap={false}>
      <Text style={styles.groupHeader}>{header}</Text>
      <Text style={styles.gradeLine}>{gradeLine}</Text>
      <Text style={styles.paragraph}>{description}</Text>
      {pipNeeded && (
        <Text style={styles.pipNote}>Note: Performance improvement plan recommended for this competency group.</Text>
      )}
    </View>
  );

  return (
    <PageWrapper pageNumber={pageNumber} totalPages={totalPages}>
      <View style={styles.container}>
        <Text style={styles.pageTitle}>Descriptive Review</Text>
        <Text style={styles.pageSubtitle}>
          {`${employeeName}'s attribute scores do not exist in isolation from one another. Strong performance in one area often correlates with excellence in related competencies. This section provides an integrated view of ${employeeName}'s performance within each core competency group, offering a holistic perspective on their professional profile.`}
        </Text>

        {/* Competence */}
        {(() => {
          if (aiReview?.competence) {
            return renderGroup('COMPETENCE', aiReview.competence.gradeLine, aiReview.competence.paragraph.replace(/\{\{evaluatee\}\}/g, employeeName), false);
          }
          const comp = data.coreGroupBreakdown.competence;
          const qow = comp ? findAttr(comp, 'Quality of Work') : undefined;
          const rel = comp ? findAttr(comp, 'Reliability') : undefined;
          const acc = comp ? (findAttr(comp, 'Accountability for Action') ?? findAttr(comp, 'Accountability')) : undefined;
          if ([qow, rel, acc].some(v => v === undefined)) return null;
          const grades = [toLetter(qow!), toLetter(rel!), toLetter(acc!)];
          const combo = buildCombo(grades)!;
          const desc = (profileDescriptions.competence[combo] || DEFAULT_MISSING_PROFILE_MESSAGE).replace(/\{\{evaluatee\}\}/g, employeeName);
          const gradeLine = formatGradesLine([
            { label: 'Quality of Work', grade: grades[0] },
            { label: 'Reliability', grade: grades[1] },
            { label: 'Accountability', grade: grades[2] }
          ]);
          const pipNeeded = (qow! < 6 && rel! < 6 && acc! < 6);
          return renderGroup('COMPETENCE', gradeLine, desc, pipNeeded);
        })()}

        {/* Character */}
        {(() => {
          if (aiReview?.character) {
            return renderGroup('CHARACTER', aiReview.character.gradeLine, aiReview.character.paragraph.replace(/\{\{evaluatee\}\}/g, employeeName), false);
          }
          const char = data.coreGroupBreakdown.character;
          const lea = char ? findAttr(char, 'Leadership') : undefined;
          const com = char ? (findAttr(char, 'Communication Skills') ?? findAttr(char, 'Communication')) : undefined;
          const tea = char ? findAttr(char, 'Teamwork') : undefined;
          if ([lea, com, tea].some(v => v === undefined)) return null;
          const grades = [toLetter(lea!), toLetter(com!), toLetter(tea!)];
          const combo = buildCombo(grades)!;
          const desc = (profileDescriptions.character[combo] || DEFAULT_MISSING_PROFILE_MESSAGE).replace(/\{\{evaluatee\}\}/g, employeeName);
          const gradeLine = formatGradesLine([
            { label: 'Leadership', grade: grades[0] },
            { label: 'Communication', grade: grades[1] },
            { label: 'Teamwork', grade: grades[2] }
          ]);
          const pipNeeded = (lea! < 6 && com! < 6 && tea! < 6);
          return renderGroup('CHARACTER', gradeLine, desc, pipNeeded);
        })()}

        {/* Curiosity */}
        {(() => {
          if (aiReview?.curiosity) {
            return renderGroup('CURIOSITY', aiReview.curiosity.gradeLine, aiReview.curiosity.paragraph.replace(/\{\{evaluatee\}\}/g, employeeName), false);
          }
          const cur = data.coreGroupBreakdown.curiosity;
          const ci = cur ? findAttr(cur, 'Continuous Improvement') : undefined;
          const ad = cur ? findAttr(cur, 'Adaptability') : undefined;
          const ps = cur ? (findAttr(cur, 'Problem Solving') ?? findAttr(cur, 'Problem Solving Ability')) : undefined;
          const ti = cur ? findAttr(cur, 'Taking Initiative') : undefined;
          if ([ci, ad, ps, ti].some(v => v === undefined)) return null;
          const grades = [toLetter(ci!), toLetter(ad!), toLetter(ps!), toLetter(ti!)];
          const combo = buildCombo(grades)!;
          const desc = (profileDescriptions.curiosity[combo] || DEFAULT_MISSING_PROFILE_MESSAGE).replace(/\{\{evaluatee\}\}/g, employeeName);
          const gradeLine = formatGradesLine([
            { label: 'Continuous Improvement', grade: grades[0] },
            { label: 'Adaptability', grade: grades[1] },
            { label: 'Problem Solving', grade: grades[2] },
            { label: 'Taking Initiative', grade: grades[3] }
          ]);
          const pipNeeded = (ci! < 6 && ad! < 6 && ps! < 6 && ti! < 6);
          return renderGroup('CURIOSITY', gradeLine, desc, pipNeeded);
        })()}
      </View>
    </PageWrapper>
  );
};