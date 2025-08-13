import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { PageWrapper } from '../../components/pdf';
import { COLORS, LAYOUT, getFontWeight } from '../../lib/theme';
import { formatNameForPDF } from '../../utils/nameUtils';

interface CoachingReportPageProps {
  data: any; // PDFEmployeeData
  report?: any; // AICoachingReportOut['coaching_report']
  pageNumber: number;
  totalPages: number;
}

export const CoachingReportPage: React.FC<CoachingReportPageProps> = ({ data, report, pageNumber, totalPages }) => {
  const styles = StyleSheet.create({
    container: { paddingRight: LAYOUT.pageMargin, paddingLeft: LAYOUT.pageMargin },
    pageTitle: { fontSize: 18, fontWeight: getFontWeight('bold'), color: COLORS.ui.textPrimary, marginBottom: LAYOUT.elementSpacing + 2 },
    sectionHeader: { fontSize: 12, fontWeight: getFontWeight('bold'), color: '#4A9B8E', marginTop: 10, marginBottom: 6 },
    paragraph: { fontSize: 10, color: COLORS.ui.textPrimary, lineHeight: 1.35 },
    bullet: { fontSize: 10, color: COLORS.ui.textPrimary, marginLeft: 8, lineHeight: 1.35, marginBottom: 2 },
    evidence: { fontSize: 9, color: COLORS.ui.textSecondary, marginLeft: 14, marginBottom: 2, lineHeight: 1.3 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginLeft: 14, marginBottom: 2 },
    chip: { fontSize: 8, color: '#0F766E' },
  });

  const employeeName = formatNameForPDF(data?.employee?.name);

  const bullets = (items?: any[]) => (items || []).slice(0, 5).map((it, idx) => {
    // Strings
    if (typeof it === 'string') {
      return (
        <Text key={`s-${idx}`} style={styles.bullet}>• {it}</Text>
      );
    }

    // Critical incidents object shape
    const looksLikeStrengthOrGap = it && (it.title || it.evidence || it.gap_summary);
    const looksLikeIncident = it && (it.situation || (it.behavior && it.impact) || it.recommendation);
    if (!looksLikeStrengthOrGap && looksLikeIncident) {
      const situation = it.situation ? String(it.situation) : undefined;
      const behavior = it.behavior ? String(it.behavior) : undefined;
      const impact = it.impact ? String(it.impact) : undefined;
      const recommendation = it.recommendation ? String(it.recommendation) : undefined;

      return (
        <React.Fragment key={`ci-${idx}`}>
          <Text style={styles.bullet}>• {situation || 'Incident'}</Text>
          {behavior && (
            <Text style={styles.evidence}>Behavior: {behavior.slice(0, 160)}</Text>
          )}
          {impact && (
            <Text style={styles.evidence}>Impact: {impact.slice(0, 160)}</Text>
          )}
          {recommendation && (
            <Text style={styles.evidence}>Recommendation: {recommendation.slice(0, 160)}</Text>
          )}
        </React.Fragment>
      );
    }

    // Default (strengths, development priorities, gaps)
    const title = it?.title || it?.gap_summary || '';
    const evidence: any[] = Array.isArray(it?.evidence) ? it.evidence : [];
    return (
      <React.Fragment key={`it-${idx}`}>
        {title ? (
          <Text style={styles.bullet}>• {title}</Text>
        ) : null}
        {evidence.slice(0, 2).map((ev, qi) => (
          <Text key={`ev-${idx}-${qi}`} style={styles.evidence}>
            “{String(ev?.quote || '').slice(0, 140)}” — {ev?.rater ? String(ev.rater).toUpperCase() : 'Rater'}{ev?.attribute ? ` · ${ev.attribute}` : ''}
          </Text>
        ))}
      </React.Fragment>
    );
  });

  return (
    <PageWrapper pageNumber={pageNumber} totalPages={totalPages}>
      <View style={styles.container}>
        <Text style={styles.pageTitle}>Coaching Report — {employeeName}</Text>

        <Text style={styles.sectionHeader}>Top Strengths</Text>
        {bullets(report?.top_strengths)}

        <Text style={styles.sectionHeader}>Top Development Priorities</Text>
        {bullets(report?.top_development_priorities)}

        <Text style={styles.sectionHeader}>Perception Gaps</Text>
        {bullets(report?.perception_gaps)}

        <Text style={styles.sectionHeader}>Critical Incidents</Text>
        {bullets(report?.critical_incidents)}

        <Text style={styles.sectionHeader}>Suggested 1:1 Questions</Text>
        {bullets(report?.['1on1_questions'])}
      </View>
    </PageWrapper>
  );
};

