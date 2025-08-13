/**
 * React-PDF DevelopmentAreasPage Component (New Development Areas section)
 * Shows attributes with weighted scores below 8.0, sorted by lowest scores first (most improvement needed),
 * maximum 2 pages.
 */

import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { PageWrapper, ValueBar } from '../../components/pdf';
import { COLORS, TYPOGRAPHY, LAYOUT, getFontWeight, getAttributeColor } from '../../lib/theme';
import { formatNameForPDF } from '../../utils/nameUtils';
import { getDefaultCompanyWeights } from '../../services/attributeWeightsService';
import { getInsightForAttribute } from '../../services/aiInsightsService';
import type { PDFEmployeeData } from '../../services/pdfDataService';
import type { AIInsightsResponse } from '../../services/aiInsightsService';

interface DevelopmentAreasPageProps {
  data: PDFEmployeeData;
  aiInsights?: AIInsightsResponse | null;
  pageNumber: number;
  totalPages: number;
  pageIndex: number; // 0-based index within the development areas section
  itemsPerPage: number;
}

type DevelopmentItem = {
  name: string;
  score: number;
  developmentFocus: string;
};

export const DevelopmentAreasPage: React.FC<DevelopmentAreasPageProps> = ({
  data,
  aiInsights,
  pageNumber,
  totalPages,
  pageIndex,
  itemsPerPage
}) => {
  const employeeName = formatNameForPDF(data.employee.name);

  // Development area description templates with {{evaluatee}} placeholder
  const DEVELOPMENT_DESCRIPTION_MAP: Record<string, string> = {
    'Quality of Work': `{{evaluatee}} can enhance work quality by implementing systematic review processes and seeking feedback before finalizing deliverables. Focus on developing attention to detail through structured checklists and establishing clear quality standards for all outputs.`,
    'Accountability': `{{evaluatee}} should work on taking full ownership of commitments by creating tracking systems for promises made and following through consistently. Practice acknowledging mistakes quickly and developing action plans for improvement without deflecting responsibility.`,
    'Accountability for Action': `{{evaluatee}} should work on taking full ownership of commitments by creating tracking systems for promises made and following through consistently. Practice acknowledging mistakes quickly and developing action plans for improvement without deflecting responsibility.`,
    'Reliability': `{{evaluatee}} can improve reliability by building better planning habits and creating backup systems for critical deadlines. Focus on under-promising and over-delivering while communicating proactively about potential challenges or delays.`,
    'Taking Initiative': `{{evaluatee}} should practice identifying opportunities for improvement without being asked and taking the first step toward solutions. Start with small initiatives to build confidence, then gradually take on larger projects that demonstrate proactive leadership and forward-thinking.`,
    'Adaptability': `{{evaluatee}} can strengthen adaptability by practicing flexibility in daily routines and seeking out new challenges that push comfort zones. Focus on developing a growth mindset by viewing changes as learning opportunities rather than obstacles.`,
    'Problem Solving': `{{evaluatee}} should enhance problem-solving skills by practicing structured approaches like root cause analysis and breaking complex issues into manageable components. Seek mentorship from experienced colleagues and document successful problem-solving processes for future reference.`,
    'Problem Solving Ability': `{{evaluatee}} should enhance problem-solving skills by practicing structured approaches like root cause analysis and breaking complex issues into manageable components. Seek mentorship from experienced colleagues and document successful problem-solving processes for future reference.`,
    'Teamwork': `{{evaluatee}} can improve teamwork by actively listening to colleagues' perspectives and offering support during team challenges. Practice clear communication about individual contributions and seek opportunities to collaborate on cross-functional projects.`,
    'Continuous Improvement': `{{evaluatee}} should develop a habit of regularly seeking feedback and acting on suggestions for growth. Set aside time for skills development and actively look for ways to improve processes, seeking out learning opportunities and staying current with industry best practices.`,
    'Communication Skills': `{{evaluatee}} can enhance communication by practicing active listening and asking clarifying questions to ensure understanding. Focus on adapting communication style to different audiences and situations, and seek feedback on message clarity from trusted colleagues.`,
    'Leadership': `{{evaluatee}} should begin developing leadership skills by taking ownership of small projects and practicing decision-making in low-risk situations. Focus on building trust through consistent actions, supporting team members' growth, and communicating vision clearly even in informal leadership moments.`
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
      marginBottom: LAYOUT.elementSpacing * 1.2,
      paddingBottom: LAYOUT.elementSpacing * 0.6,
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
    developmentFocusSubheader: {
      fontSize: TYPOGRAPHY.body.size - 1,
      fontWeight: getFontWeight('bold'),
      color: COLORS.performance.average,
      marginLeft: 10,
      marginBottom: 4,
      marginTop: 5
    },
    developmentFocus: {
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

  // Build development areas list from all core groups (attributes < 8.0)
  const collectDevelopmentAreas = (): DevelopmentItem[] => {
    const groups = [
      data.coreGroupBreakdown?.competence,
      data.coreGroupBreakdown?.character,
      data.coreGroupBreakdown?.curiosity
    ].filter(Boolean) as any[];

    const seen = new Set<string>();
    const items: DevelopmentItem[] = [];

    for (const group of groups) {
      for (const attr of group.attributes || []) {
        const name: string = attr.attributeName || attr.attribute || '';
        const score: number = (attr.scores?.weighted ?? attr.weighted) || 0;
        if (score < 8.0 && name) { // Development areas: scores below 8.0
          const key = name.toLowerCase().replace(/\s+/g, ' ').trim();
          if (!seen.has(key)) {
            // Get AI development insight or use fallback template
            const aiInsight = getInsightForAttribute(name, aiInsights || undefined);
            let developmentFocus: string;
            
            if (aiInsight) {
              developmentFocus = aiInsight;
            } else {
              // Fallback to static templates
              const template = DEVELOPMENT_DESCRIPTION_MAP[name] ||
                DEVELOPMENT_DESCRIPTION_MAP[name.replace(' Ability', '')] ||
                DEVELOPMENT_DESCRIPTION_MAP[name.replace(' for Action', '')] || '';
              developmentFocus = template
                ? template.replace(/\{\{evaluatee\}\}/g, employeeName)
                : `${employeeName} can focus on developing stronger skills in ${name.toLowerCase()} through targeted practice and feedback.`;
            }

            items.push({ name, score, developmentFocus });
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

  const allDevelopmentAreas = collectDevelopmentAreas();
  const start = pageIndex * itemsPerPage;
  const pageItems = allDevelopmentAreas.slice(start, start + itemsPerPage);

  return (
    <PageWrapper pageNumber={pageNumber} totalPages={totalPages}>
      <View style={styles.container}>
        {/* Header */}
        <Text style={styles.pageTitle}>Focus Areas</Text>
        <Text style={styles.pageSubtitle}>
          This section identifies {employeeName}'s growth opportunities based on combined feedback from managers, peers, and self-evaluation. These focus areas represent targeted development priorities to enhance overall performance and career progression.
        </Text>

        {pageItems.length === 0 ? (
          <Text style={styles.noDataText}>No development areas identified for this page.</Text>
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

              {/* Development Focus Instructions */}
              <Text style={styles.developmentFocusSubheader}>Development Focus:</Text>
              <Text style={styles.developmentFocus}>{item.developmentFocus}</Text>
            </View>
          ))
        )}
      </View>
    </PageWrapper>
  );
};
