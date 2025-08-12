/**
 * React-PDF CoverPage Component
 * Ported from generateExecutiveSummaryPage function
 */

import React from 'react';
import { View, Text, StyleSheet, Image } from '@react-pdf/renderer';
import { PageWrapper } from '../../components/pdf';
import { COLORS, TYPOGRAPHY, LAYOUT, getPerformanceColor, getFontWeight } from '../../lib/theme';
import type { PDFEmployeeData } from '../../services/pdfDataService';
import logoImage from '../../assets/logos/culture-base-logo.png';

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

  // Logo configuration - currently using text fallback
  // TODO: Implement proper logo import when PNG file is available
  const hasLogo = true; // Will be enabled when logo is properly imported

  const styles = StyleSheet.create({
    container: {
      width: '100%',
      backgroundColor: COLORS.ui.background,
      justifyContent: 'center',
      flex: 1,
      paddingLeft: 80
    },
    logoSection: {
      alignItems: 'flex-start',
      marginBottom: 12
    },
    logoImage: {
      width: 200,
      height: 60,
      objectFit: 'contain',
      marginLeft: -20
    },
    logoText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: COLORS.ui.textPrimary,
      marginBottom: 4,
      textAlign: 'center'
    },
    logoSubtext: {
      fontSize: 10,
      color: COLORS.ui.textSecondary,
      letterSpacing: 0.5,
      marginTop: 4,
      textAlign: 'center'
    },
    header: {
      alignItems: 'flex-start',
      marginBottom: 20
    },
    employeeInfo: {
      alignItems: 'flex-start',
      marginTop: 8
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
      marginBottom: 8
    },
    completedDate: {
      fontSize: TYPOGRAPHY.body.size,
      color: COLORS.ui.textSecondary,
      marginTop: 12,
      marginBottom: 4
    },
    employeeEmail: {
      fontSize: TYPOGRAPHY.body.size,
      color: COLORS.ui.textSecondary,
      marginBottom: 4
    },
    employeePhone: {
      fontSize: TYPOGRAPHY.body.size,
      color: COLORS.ui.textSecondary,
      marginBottom: 6
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

  // Calculate simple evaluator averages for display
  const calculateOverallRatings = (scores: any[]) => {
    if (!scores || scores.length === 0) {
      return { managerRating: 0, peerRating: 0, selfRating: 0 };
    }
    const mgrVals = scores.map((s: any) => s.manager_avg_score || 0);
    const peerVals = scores.map((s: any) => s.peer_avg_score || 0);
    const selfVals = scores.map((s: any) => s.self_avg_score || 0);
    const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    return {
      managerRating: avg(mgrVals),
      peerRating: avg(peerVals),
      selfRating: avg(selfVals)
    };
  };
  const { managerRating, peerRating, selfRating } = calculateOverallRatings(data.coreGroupScores || []);

  return (
    <PageWrapper isFirstPage={true}>
      <View style={styles.container}>
        {/* Logo and Branding */}
        <View style={styles.logoSection}>
          {hasLogo ? (
            <Image 
              src={logoImage}
              style={styles.logoImage}
            />
          ) : (
            <Text style={styles.logoText}>The Culture Base</Text>
          )}
          <Text style={styles.logoSubtext}>A-Player Evaluation</Text>
        </View>

        {/* Employee Information - Centered */}
        <View style={styles.header}>
          <View style={styles.employeeInfo}>
            <Text style={styles.employeeName}>
              {data.employee.name || 'Unknown Employee'}
            </Text>
            <Text style={styles.employeeTitle}>
              {data.employee.department || data.employee.role || 'No Title'}
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
            <Text style={styles.employeeEmail}>
              Quarter: {quarterName}
            </Text>
            <Text style={styles.employeeEmail}>
              Category: {categoryText}
            </Text>
            <Text style={styles.employeeEmail}>
              M/P/S: {managerRating.toFixed(1)} / {peerRating.toFixed(1)} / {selfRating.toFixed(1)}
            </Text>
          </View>
        </View>
      </View>
    </PageWrapper>
  );
};