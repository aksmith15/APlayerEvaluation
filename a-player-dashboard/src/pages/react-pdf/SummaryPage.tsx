/**
 * React-PDF SummaryPage Component (Evaluation Summary)
 * Shows detailed attribute analysis with horizontal progress bars
 */

import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { PageWrapper, ValueBar } from '../../components/pdf';
import { COLORS, TYPOGRAPHY, LAYOUT, getFontWeight, getAttributeColor } from '../../lib/theme';
import { formatNameForPDF } from '../../utils/nameUtils';
import type { PDFEmployeeData } from '../../services/pdfDataService';

interface SummaryPageProps {
  data: PDFEmployeeData;
  pageNumber: number;
  totalPages: number;
}

export const SummaryPage: React.FC<SummaryPageProps> = ({ 
  data, 
  pageNumber, 
  totalPages 
}) => {
  const employeeName = formatNameForPDF(data.employee.name);

  const styles = StyleSheet.create({
    container: {
      width: '100%'
    },
    pageTitle: {
      fontSize: TYPOGRAPHY.sectionTitle.size,
      fontWeight: getFontWeight(TYPOGRAPHY.sectionTitle.weight),
      color: COLORS.ui.textPrimary,
      marginBottom: LAYOUT.sectionSpacing * 0.6
    },
    introText: {
      fontSize: TYPOGRAPHY.body.size + 1,
      color: COLORS.ui.textPrimary,
      lineHeight: 1.4,
      marginBottom: LAYOUT.sectionSpacing * 0.8
    },
    definitionsWrap: {
      backgroundColor: '#F8FAFC',
      padding: LAYOUT.elementSpacing * 0.9,
      borderRadius: 4,
      borderLeft: '3px solid #e2e8f0',
      marginBottom: LAYOUT.sectionSpacing * 1.0
    },
    definitionsTitle: {
      fontSize: TYPOGRAPHY.body.size + 2,
      fontWeight: getFontWeight('bold'),
      color: COLORS.ui.textPrimary,
      marginBottom: 4
    },
    definitionGroupTitle: {
      fontSize: TYPOGRAPHY.body.size + 1,
      fontWeight: getFontWeight('bold'),
      color: '#0F766E',
      marginTop: 4,
      marginBottom: 2
    },
    definitionText: {
      fontSize: TYPOGRAPHY.body.size, // slightly larger for readability
      color: COLORS.ui.textPrimary,
      lineHeight: 1.4,
      marginBottom: 6
    },
    sectionHeader: {
      fontSize: TYPOGRAPHY.subsectionTitle.size,
      fontWeight: getFontWeight(TYPOGRAPHY.subsectionTitle.weight),
      color: '#0F766E',
      marginBottom: LAYOUT.sectionSpacing * 0.6,
      marginTop: LAYOUT.sectionSpacing * 0.3
    },
    coreGroupSection: {
      backgroundColor: '#f8f9fa',
      padding: LAYOUT.elementSpacing,
      marginBottom: LAYOUT.elementSpacing * 1.2,
      borderRadius: 4,
      borderLeft: '3px solid #dee2e6'
    },
    competenceSection: {
      backgroundColor: '#E3F2FD',  // Light blue background for competence
      padding: LAYOUT.elementSpacing * 0.7,
      marginBottom: LAYOUT.elementSpacing * 0.8,
      borderRadius: 4,
      borderLeft: `3px solid ${COLORS.competence}`
    },
    characterSection: {
      backgroundColor: '#FFF8E1',  // Light gold background for character
      padding: LAYOUT.elementSpacing * 0.7,
      marginBottom: LAYOUT.elementSpacing * 0.8,
      borderRadius: 4,
      borderLeft: `3px solid ${COLORS.character}`
    },
    curiositySection: {
      backgroundColor: '#E8F5E8',  // Light green background for curiosity
      padding: LAYOUT.elementSpacing * 0.7,
      marginBottom: LAYOUT.elementSpacing * 0.8,
      borderRadius: 4,
      borderLeft: `3px solid ${COLORS.curiosity}`
    },
    coreGroupTitle: {
      fontSize: TYPOGRAPHY.body.size + 1,
      fontWeight: getFontWeight('bold'),
      color: COLORS.ui.textPrimary,  // Use standardized text color
      marginBottom: LAYOUT.elementSpacing * 0.8,
      textTransform: 'uppercase',
      letterSpacing: 0.5
    },
    attributeItem: {
      marginBottom: LAYOUT.elementSpacing * 0.3,
      backgroundColor: '#ffffff',
      padding: LAYOUT.elementSpacing * 0.25,
      borderRadius: 3,
      borderLeft: '1px solid #e9ecef'
    },
    attributeHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: LAYOUT.elementSpacing * 0.2
    },
    attributeName: {
      fontSize: TYPOGRAPHY.body.size - 1,
      color: COLORS.ui.textPrimary,
      fontWeight: getFontWeight('500'),
      minWidth: 120
    },
    scoreLabel: {
      fontSize: TYPOGRAPHY.body.size - 2,
      fontWeight: getFontWeight('bold'),
      color: COLORS.ui.textPrimary,
      backgroundColor: COLORS.ui.surface,
      padding: '1 3',
      borderRadius: 2,
      marginLeft: LAYOUT.elementSpacing * 0.5,
      border: `1px solid ${COLORS.ui.border}`
    },
    progressBarContainer: {
      position: 'relative',
      marginLeft: 120 + LAYOUT.elementSpacing * 0.5
    }
  });

  // Helper function to get attribute score from coreGroupBreakdown (same as employee analytics)
  const getAttributeScore = (attributeName: string): number => {
    if (!data.coreGroupBreakdown) {
      console.warn('No coreGroupBreakdown data available');
      return 0;
    }
    
    // Search across all core groups for the attribute
    const allCoreGroups = [
      data.coreGroupBreakdown.competence,
      data.coreGroupBreakdown.character,
      data.coreGroupBreakdown.curiosity
    ];
    
    for (const coreGroup of allCoreGroups) {
      if (!coreGroup?.attributes) continue;
      
      const attribute = coreGroup.attributes.find(attr => {
        const attrName = attr.attributeName?.toLowerCase().replace(/[\s_-]/g, '') || '';
        const searchName = attributeName.toLowerCase().replace(/[\s_-]/g, '');
        return attrName === searchName || attrName.includes(searchName) || searchName.includes(attrName);
      });
      
      if (attribute) {
        console.log(`Found ${attributeName}: ${attribute.scores.weighted}`);
        return attribute.scores.weighted || 0;
      }
    }
    
    console.warn(`No score found for attribute: ${attributeName}`);
    return 0;
  };

  // Optional: Enable debug logging by uncommenting below
  // console.log('Core Group Breakdown:', data.coreGroupBreakdown);

  return (
    <PageWrapper pageNumber={pageNumber} totalPages={totalPages}>
      <View style={styles.container}>
        {/* Page Title */}
        <Text style={styles.pageTitle}>Evaluation Summary</Text>
        
        {/* Introduction Text */}
        <Text style={styles.introText}>
          This report is an accumulation of evaluations given to the peers, managers, and self-assessments. 
          We believe the culture of a company starts with people, and these evaluations are meant to not just 
          identify top performers, but help develop strengths and weaknesses of your team by looking at multiple 
          evaluation perspectives of {employeeName}.
        </Text>
        
        <Text style={styles.introText}>
          The chart below shows {employeeName}'s evaluation results grouped under three core groups: 
          competency, character, and curiosity. We believe that the accumulation of the attributes within 
          each core group shows different aspects of {employeeName} at a high level.
        </Text>

        {/* Core Group Definitions */}
        <View style={styles.definitionsWrap}>
          <Text style={styles.definitionsTitle}>Core Group Definitions</Text>
          <Text style={styles.definitionGroupTitle}>Competence: Execution & Delivery Excellence</Text>
          <Text style={styles.definitionText}>
            The ability to consistently produce high-quality work and meet commitments. Encompasses technical proficiency,
            dependability in delivering on promises, and attention to detail that ensures outputs meet standards. Forms the
            reliable backbone that translates plans into tangible results.
          </Text>
          <Text style={styles.definitionGroupTitle}>Character: Leadership & Interpersonal Skills</Text>
          <Text style={styles.definitionText}>
            How individuals engage with others and take responsibility for collective success. Includes clear communication,
            building productive relationships, and stepping up to drive outcomes without being asked. Creates positive team
            dynamics where everyone contributes their best work.
          </Text>
          <Text style={styles.definitionGroupTitle}>Curiosity: Growth & Innovation Mindset</Text>
          <Text style={styles.definitionText}>
            The drive to learn, adapt, and push beyond the status quo. Encompasses experimenting with new approaches,
            flexibility when circumstances change, and analytical thinking to identify creative solutions. Catalyzes
            organizational evolution and resilience in changing environments.
          </Text>
        </View>

        {/* Main Content Section */}
        <Text style={styles.sectionHeader}>Total Scores Per Attribute</Text>

        {/* Competence Section */}
        <View style={styles.competenceSection}>
          <Text style={styles.coreGroupTitle}>Competence</Text>
          
          <View style={styles.attributeItem}>
            <View style={styles.attributeHeader}>
              <Text style={styles.attributeName}>Quality of Work</Text>
              <Text style={styles.scoreLabel}>{getAttributeScore('quality of work').toFixed(1)}</Text>
            </View>
            <View style={styles.progressBarContainer}>
              <ValueBar 
                value={getAttributeScore('quality of work')}
                maxValue={10}
                width={LAYOUT.contentWidth - 200}
                height={12}
                color={getAttributeColor('quality of work')}
              />
            </View>
          </View>

          <View style={styles.attributeItem}>
            <View style={styles.attributeHeader}>
              <Text style={styles.attributeName}>Accountability</Text>
              <Text style={styles.scoreLabel}>{getAttributeScore('accountability').toFixed(1)}</Text>
            </View>
            <View style={styles.progressBarContainer}>
              <ValueBar 
                value={getAttributeScore('accountability')}
                maxValue={10}
                width={LAYOUT.contentWidth - 200}
                height={12}
                color={getAttributeColor('accountability')}
              />
            </View>
          </View>

          <View style={styles.attributeItem}>
            <View style={styles.attributeHeader}>
              <Text style={styles.attributeName}>Reliability</Text>
              <Text style={styles.scoreLabel}>{getAttributeScore('reliability').toFixed(1)}</Text>
            </View>
            <View style={styles.progressBarContainer}>
              <ValueBar 
                value={getAttributeScore('reliability')}
                maxValue={10}
                width={LAYOUT.contentWidth - 200}
                height={12}
                color={getAttributeColor('reliability')}
              />
            </View>
          </View>
        </View>

        {/* Character Section */}
        <View style={styles.characterSection}>
          <Text style={styles.coreGroupTitle}>Character</Text>
          
          <View style={styles.attributeItem}>
            <View style={styles.attributeHeader}>
              <Text style={styles.attributeName}>Leadership</Text>
              <Text style={styles.scoreLabel}>{getAttributeScore('leadership').toFixed(1)}</Text>
            </View>
            <View style={styles.progressBarContainer}>
              <ValueBar 
                value={getAttributeScore('leadership')}
                maxValue={10}
                width={LAYOUT.contentWidth - 200}
                height={12}
                color={getAttributeColor('leadership')}
              />
            </View>
          </View>

          <View style={styles.attributeItem}>
            <View style={styles.attributeHeader}>
              <Text style={styles.attributeName}>Teamwork</Text>
              <Text style={styles.scoreLabel}>{getAttributeScore('teamwork').toFixed(1)}</Text>
            </View>
            <View style={styles.progressBarContainer}>
              <ValueBar 
                value={getAttributeScore('teamwork')}
                maxValue={10}
                width={LAYOUT.contentWidth - 200}
                height={12}
                color={getAttributeColor('teamwork')}
              />
            </View>
          </View>

          <View style={styles.attributeItem}>
            <View style={styles.attributeHeader}>
              <Text style={styles.attributeName}>Communication</Text>
              <Text style={styles.scoreLabel}>{getAttributeScore('communication').toFixed(1)}</Text>
            </View>
            <View style={styles.progressBarContainer}>
              <ValueBar 
                value={getAttributeScore('communication')}
                maxValue={10}
                width={LAYOUT.contentWidth - 200}
                height={12}
                color={getAttributeColor('communication')}
              />
            </View>
          </View>
        </View>

        {/* Curiosity Section */}
        <View style={styles.curiositySection}>
          <Text style={styles.coreGroupTitle}>Curiosity</Text>
          
          <View style={styles.attributeItem}>
            <View style={styles.attributeHeader}>
              <Text style={styles.attributeName}>Adaptability</Text>
              <Text style={styles.scoreLabel}>{getAttributeScore('adaptability').toFixed(1)}</Text>
            </View>
            <View style={styles.progressBarContainer}>
              <ValueBar 
                value={getAttributeScore('adaptability')}
                maxValue={10}
                width={LAYOUT.contentWidth - 200}
                height={12}
                color={getAttributeColor('adaptability')}
              />
            </View>
          </View>

          <View style={styles.attributeItem}>
            <View style={styles.attributeHeader}>
              <Text style={styles.attributeName}>Continuous Improvement</Text>
              <Text style={styles.scoreLabel}>{getAttributeScore('continuous improvement').toFixed(1)}</Text>
            </View>
            <View style={styles.progressBarContainer}>
              <ValueBar 
                value={getAttributeScore('continuous improvement')}
                maxValue={10}
                width={LAYOUT.contentWidth - 200}
                height={12}
                color={getAttributeColor('continuous improvement')}
              />
            </View>
          </View>

          <View style={styles.attributeItem}>
            <View style={styles.attributeHeader}>
              <Text style={styles.attributeName}>Problem Solving</Text>
              <Text style={styles.scoreLabel}>{getAttributeScore('problem solving').toFixed(1)}</Text>
            </View>
            <View style={styles.progressBarContainer}>
              <ValueBar 
                value={getAttributeScore('problem solving')}
                maxValue={10}
                width={LAYOUT.contentWidth - 200}
                height={12}
                color={getAttributeColor('problem solving')}
              />
            </View>
          </View>

          <View style={styles.attributeItem}>
            <View style={styles.attributeHeader}>
              <Text style={styles.attributeName}>Taking Initiative</Text>
              <Text style={styles.scoreLabel}>{getAttributeScore('taking initiative').toFixed(1)}</Text>
            </View>
            <View style={styles.progressBarContainer}>
              <ValueBar 
                value={getAttributeScore('taking initiative')}
                maxValue={10}
                width={LAYOUT.contentWidth - 200}
                height={12}
                color={getAttributeColor('taking initiative')}
              />
            </View>
          </View>
        </View>
      </View>
    </PageWrapper>
  );
};