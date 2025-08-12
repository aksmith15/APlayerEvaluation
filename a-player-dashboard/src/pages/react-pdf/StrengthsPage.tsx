/**
 * React-PDF StrengthsPage Component (New unified Strengths section)
 * Replaces core-group breakdown pages. Shows attributes with weighted scores 8–10,
 * sorted by attribute weight (highest first), then by score, maximum 2 pages.
 */

import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { PageWrapper, ValueBar } from '../../components/pdf';
import { COLORS, TYPOGRAPHY, LAYOUT, getFontWeight, getAttributeColor } from '../../lib/theme';
import { getDefaultCompanyWeights } from '../../services/attributeWeightsService';
import { getInsightForAttribute } from '../../services/aiInsightsService';
import type { PDFEmployeeData } from '../../services/pdfDataService';
import type { AIInsightsResponse } from '../../services/aiInsightsService';

interface StrengthsPageProps {
  data: PDFEmployeeData;
  aiInsights?: AIInsightsResponse | null;
  pageNumber: number;
  totalPages: number;
  pageIndex: number; // 0-based index within the strengths section
  itemsPerPage: number;
}

type StrengthItem = {
  name: string;
  score: number;
  description: string;
  coachingRecommendation?: string;
};

export const StrengthsPage: React.FC<StrengthsPageProps> = ({
  data,
  aiInsights,
  pageNumber,
  totalPages,
  pageIndex,
  itemsPerPage
}) => {
  const employeeName = data.employee.name || 'the employee';

  // Description templates with {{evaluatee}} placeholder
  const DESCRIPTION_MAP: Record<string, string> = {
    'Quality of Work': `{{evaluatee}} delivers exceptional work that consistently exceeds expectations. They demonstrate meticulous attention to detail and take genuine pride in their output, requiring minimal oversight while maintaining the highest standards of accuracy and clarity.`,
    'Accountability': `{{evaluatee}} takes full ownership of their responsibilities and outcomes. They proactively acknowledge mistakes, learn from them, and follow through on every commitment without deflecting blame or making excuses.`,
    'Accountability for Action': `{{evaluatee}} takes full ownership of their responsibilities and outcomes. They proactively acknowledge mistakes, learn from them, and follow through on every commitment without deflecting blame or making excuses.`,
    'Reliability': `{{evaluatee}} is someone the team can always count on. They consistently deliver on promises, meet deadlines, and maintain high performance even under pressure or without supervision.`,
    'Taking Initiative': `{{evaluatee}} proactively identifies opportunities and solves problems before being asked. They consistently go beyond their defined role, contributing innovative ideas and taking action to improve outcomes. They anticipate future needs and prepare accordingly, often preventing issues before they arise.`,
    'Adaptability': `{{evaluatee}} thrives in changing environments and handles shifting priorities with grace. They quickly adjust to new situations, remain composed under stress, and embrace different approaches with enthusiasm.`,
    'Problem Solving': `{{evaluatee}} excels at analyzing complex issues and developing effective solutions. They demonstrate strong critical thinking, make sound decisions with limited information, and navigate ambiguous situations with confidence. They consider multiple perspectives and potential consequences before acting.`,
    'Problem Solving Ability': `{{evaluatee}} excels at analyzing complex issues and developing effective solutions. They demonstrate strong critical thinking, make sound decisions with limited information, and navigate ambiguous situations with confidence. They consider multiple perspectives and potential consequences before acting.`,
    'Teamwork': `{{evaluatee}} is an exceptional collaborator who elevates team performance. They communicate effectively, support colleagues generously, and skillfully navigate conflicts while keeping the team focused on shared goals.`,
    'Continuous Improvement': `{{evaluatee}} demonstrates a genuine commitment to growth and excellence. They actively seek feedback, continuously develop new skills, and consistently look for ways to improve both their own performance and team processes.`,
    'Communication Skills': `{{evaluatee}} communicates with exceptional clarity and precision across all formats. They tailor their message effectively to different audiences, listen actively, and contribute meaningfully to discussions and written communications.`,
    'Leadership': `{{evaluatee}} naturally inspires and guides others toward success. They set a compelling vision, lead by example, make thoughtful decisions, and build trust across the organization regardless of their formal position. They empower others to grow and create an environment where people feel valued and motivated.`
  };

  const styles = StyleSheet.create({
    container: {
      width: '100%'
    },
    pageTitle: {
      fontSize: 18,
      fontWeight: getFontWeight('bold'),
      color: COLORS.ui.textPrimary,
      marginBottom: LAYOUT.elementSpacing
    },
    pageSubtitle: {
      fontSize: TYPOGRAPHY.body.size,
      color: COLORS.ui.textSecondary,
      lineHeight: LAYOUT.lineHeight.normal,
      marginBottom: LAYOUT.sectionSpacing
    },
    attributeBlock: {
      marginBottom: LAYOUT.elementSpacing * 1.5,
      paddingBottom: LAYOUT.elementSpacing * 0.8,
      borderBottom: `1px solid ${COLORS.ui.border}`
    },
    firstRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 5
    },
    attributeName: {
      fontSize: TYPOGRAPHY.body.size,
      color: COLORS.ui.textPrimary,
      fontWeight: getFontWeight('bold'),
      width: 140,
      flexShrink: 0
    },
    progressContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      flex: 1
    },
    scoreLabel: {
      fontSize: TYPOGRAPHY.body.size - 1,
      color: COLORS.ui.textPrimary,
      marginLeft: 8,
      minWidth: 50,
      textAlign: 'right'
    },
    strengthDescription: {
      fontSize: TYPOGRAPHY.body.size,
      color: COLORS.ui.textPrimary,
      lineHeight: LAYOUT.lineHeight.normal,
      marginLeft: 10,
      marginBottom: 8
    },
    coachingSubheader: {
      fontSize: TYPOGRAPHY.body.size - 1,
      fontWeight: getFontWeight('bold'),
      color: COLORS.performance.excellent,
      marginLeft: 10,
      marginBottom: 4
    },
    coachingRecommendation: {
      fontSize: TYPOGRAPHY.body.size,
      color: COLORS.ui.textPrimary,
      lineHeight: LAYOUT.lineHeight.normal,
      marginLeft: 10,
      fontStyle: 'italic'
    },
    noDataText: {
      fontSize: TYPOGRAPHY.subsectionTitle.size,
      color: COLORS.ui.textSecondary,
      textAlign: 'center',
      marginTop: LAYOUT.sectionSpacing
    }
  });

  // Build strengths list from all core groups using the same data source as SummaryPage
  const collectStrengths = (): StrengthItem[] => {
    const groups = [
      data.coreGroupBreakdown?.competence,
      data.coreGroupBreakdown?.character,
      data.coreGroupBreakdown?.curiosity
    ].filter(Boolean) as any[];

    const seen = new Set<string>();
    const items: StrengthItem[] = [];

    for (const group of groups) {
      for (const attr of group.attributes || []) {
        const name: string = attr.attributeName || attr.attribute || '';
        const score: number = (attr.scores?.weighted ?? attr.weighted) || 0;
        if (score >= 8.0 && name) {
          const key = name.toLowerCase().replace(/\s+/g, ' ').trim();
          if (!seen.has(key)) {
            // Get AI coaching recommendation
            const aiInsight = getInsightForAttribute(name, aiInsights || undefined);
            
            // Use static templates for "what they're doing right"
            const template = DESCRIPTION_MAP[name] ||
              DESCRIPTION_MAP[name.replace(' Ability', '')] ||
              DESCRIPTION_MAP[name.replace(' for Action', '')] || '';
            const description = template
              ? template.replace(/\{\{evaluatee\}\}/g, employeeName)
              : `${employeeName} consistently demonstrates excellence in ${name.toLowerCase()}.`;

            items.push({ 
              name, 
              score, 
              description,
              coachingRecommendation: aiInsight || undefined
            });
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

  const allStrengths = collectStrengths();
  const start = pageIndex * itemsPerPage;
  const pageItems = allStrengths.slice(start, start + itemsPerPage);

  return (
    <PageWrapper pageNumber={pageNumber} totalPages={totalPages}>
      <View style={styles.container}>
        {/* Header */}
        <Text style={styles.pageTitle}>High-Performance Areas</Text>
        <Text style={styles.pageSubtitle}>
          This section highlights {employeeName}'s strongest attributes based on combined feedback from managers, peers, and self-evaluation. These high-performance areas represent where {employeeName} consistently demonstrates exceptional performance across multiple perspectives.
        </Text>

        {pageItems.length === 0 ? (
          <Text style={styles.noDataText}>No strengths identified for this page.</Text>
        ) : (
          pageItems.map((item, idx) => (
            <View key={idx} style={styles.attributeBlock} wrap={false}>
              {/* First row: name left, progress bar + score right-aligned */}
              <View style={styles.firstRow}>
                <Text style={styles.attributeName}>{item.name}</Text>
                <View style={styles.progressContainer}>
                  <ValueBar
                    value={item.score}
                    maxValue={10}
                    width={130}
                    height={9}
                    color={getAttributeColor(item.name)}
                    backgroundColor="#E0E0E0"
                    rounded
                  />
                  <Text style={styles.scoreLabel}>{item.score.toFixed(1)}/10</Text>
                </View>
              </View>

              {/* What they're doing right */}
              <Text style={styles.strengthDescription}>{item.description}</Text>

              {/* AI Coaching Recommendations (if available) */}
              {item.coachingRecommendation && (
                <>
                  <Text style={styles.coachingSubheader}>Coaching Recommendations:</Text>
                  <Text style={styles.coachingRecommendation}>{item.coachingRecommendation}</Text>
                </>
              )}
            </View>
          ))
        )}
      </View>
    </PageWrapper>
  );
};