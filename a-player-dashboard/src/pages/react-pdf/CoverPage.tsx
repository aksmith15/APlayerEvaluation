/**
 * React-PDF CoverPage Component
 * Ported from generateExecutiveSummaryPage function
 */

import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { PageWrapper, ScoreCard } from '../../components/pdf';
import { COLORS, TYPOGRAPHY, LAYOUT, getPerformanceColor, getFontWeight } from '../../lib/theme';
import type { PDFEmployeeData } from '../../services/pdfDataService';

interface CoverPageProps {
  data: PDFEmployeeData;
  quarterName: string;
}

export const CoverPage: React.FC<CoverPageProps> = ({ data, quarterName }) => {
  const overallScore = data.overallAverage;
  const performanceColor = getPerformanceColor(overallScore);
  const categoryText = overallScore >= 8.0 ? 'A-Player' : 
                      overallScore >= 7.0 ? 'B-Player' : 
                      overallScore >= 6.0 ? 'C-Player' : 'D-Player';

  const styles = StyleSheet.create({
    container: {
      width: '100%',
      backgroundColor: COLORS.ui.background,
      justifyContent: 'center',
      flex: 1,
      paddingLeft: 120
    },
    logoSection: {
      alignItems: 'flex-start',
      marginBottom: 40
    },
    logoText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: COLORS.ui.textPrimary,
      marginBottom: 4
    },
    logoSubtext: {
      fontSize: 10,
      color: COLORS.ui.textSecondary,
      letterSpacing: 0.5
    },
    header: {
      alignItems: 'flex-start',
      marginBottom: 40
    },
    employeeInfo: {
      alignItems: 'flex-start'
    },
    employeeName: {
      fontSize: TYPOGRAPHY.pageTitle.size,
      fontWeight: getFontWeight(TYPOGRAPHY.pageTitle.weight),
      color: COLORS.ui.textPrimary
    },
    overallScore: {
      fontSize: TYPOGRAPHY.dataMedium.size,
      fontWeight: getFontWeight(TYPOGRAPHY.dataMedium.weight),
      color: performanceColor
    },
    employeeTitle: {
      fontSize: TYPOGRAPHY.body.size,
      color: COLORS.ui.textSecondary,
      marginBottom: 4
    },
    completedDate: {
      fontSize: TYPOGRAPHY.body.size,
      color: COLORS.ui.textSecondary,
      marginTop: 6
    },
    employeeEmail: {
      fontSize: TYPOGRAPHY.body.size,
      color: COLORS.ui.textSecondary,
      marginBottom: 2
    },
    employeePhone: {
      fontSize: TYPOGRAPHY.body.size,
      color: COLORS.ui.textSecondary
    },
    performanceSection: {
      marginBottom: LAYOUT.sectionSpacing * 2
    },
    metricsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: LAYOUT.elementSpacing
    },
    coreGroupSection: {
      marginBottom: LAYOUT.sectionSpacing
    },
    coreGroupTitle: {
      fontSize: TYPOGRAPHY.sectionTitle.size,
      fontWeight: getFontWeight(TYPOGRAPHY.sectionTitle.weight),
      color: COLORS.ui.textPrimary,
      marginBottom: LAYOUT.elementSpacing
    },
    coreGroupRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: LAYOUT.elementSpacing
    },
    summaryText: {
      fontSize: TYPOGRAPHY.body.size,
      color: COLORS.ui.textPrimary,
      lineHeight: LAYOUT.lineHeight.normal,
      marginTop: LAYOUT.sectionSpacing
    }
  });

  // Calculate ratings using the same logic as legacy system
  const calculateOverallRatings = (scores: any[]) => {
    if (!scores || scores.length === 0) {
      return { managerRating: 0, peerRating: 0, selfRating: 0, finalScore: 0 };
    }

    let managerSum = 0, peerSum = 0, selfSum = 0;
    let managerCount = 0, peerCount = 0, selfCount = 0;

    scores.forEach(score => {
      if (score.manager_score) { managerSum += score.manager_score; managerCount++; }
      if (score.peer_score) { peerSum += score.peer_score; peerCount++; }
      if (score.self_score) { selfSum += score.self_score; selfCount++; }
    });

    const managerRating = managerCount > 0 ? managerSum / managerCount : 0;
    const peerRating = peerCount > 0 ? peerSum / peerCount : 0;
    const selfRating = selfCount > 0 ? selfSum / selfCount : 0;
    
    // Weighted average: Manager 55%, Peer 35%, Self 10%
    const finalScore = (managerRating * 0.55) + (peerRating * 0.35) + (selfRating * 0.10);

    return { managerRating, peerRating, selfRating, finalScore };
  };

  const { managerRating, peerRating, selfRating } = calculateOverallRatings(data.coreGroupScores || []);

  return (
    <PageWrapper isFirstPage={true}>
      <View style={styles.container}>
        {/* Logo and Branding */}
        <View style={styles.logoSection}>
          <Text style={styles.logoText}>The Culture Base</Text>
          <Text style={styles.logoSubtext}>A-Player Evaluation</Text>
        </View>

        {/* Employee Information - Centered */}
        <View style={styles.header}>
          <View style={styles.employeeInfo}>
            <Text style={styles.employeeName}>
              {data.employee.name || 'Unknown Employee'}
            </Text>
            <Text style={styles.employeeTitle}>
              {data.employee.title || data.employee.department || 'No Title'}
            </Text>
            <Text style={styles.completedDate}>
              Completed {new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
            <Text style={styles.employeeEmail}>
              {data.employee.email || 'No email'}
            </Text>
          </View>
        </View>
      </View>
    </PageWrapper>
  );
};