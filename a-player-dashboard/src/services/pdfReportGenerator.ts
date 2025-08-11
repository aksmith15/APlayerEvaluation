/**
 * PDF Report Generator Service
 * Generates professional 5-page PDF reports with Culture Base inspired styling
 */

import jsPDF from 'jspdf';
import { generateDownloadFilename } from '../utils/downloadUtils';
import { fetchPDFEmployeeData, type PDFEmployeeData, type CoreGroupScore } from './pdfDataService';
import { generateCompetenceAnalysisFromData } from './competencePatternAnalysis';
import type { Person } from '../types/database';
import type { DetailedCoreGroupAnalysis } from '../types/evaluation';
import { 
  COLORS, 
  TYPOGRAPHY, 
  LAYOUT, 
  hexToRgb, 
  getPerformanceColor, 
  wrapText
} from '../lib/theme';

interface GenerateEmployeeReportOptions {
  employee: Person;
  selectedQuarter: string;
  quarterName?: string;
}

// TYPOGRAPHY imported from theme.ts

// LAYOUT imported from theme.ts

// COLORS imported from theme.ts

// Category descriptions kept in documentation; not used directly in generator

// hexToRgb imported from theme.ts

/**
 * Apply standardized typography to PDF
 */
const applyTypography = (pdf: jsPDF, style: keyof typeof TYPOGRAPHY): void => {
  const { size, weight } = TYPOGRAPHY[style];
  pdf.setFontSize(size);
  pdf.setFont('helvetica', weight as any);
};

// getPerformanceColor imported from theme.ts

// getEvaluatorColor imported from theme.ts

/**
 * Generate visual comparison bar for table
 */
const drawVisualBar = (
  pdf: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  value: number,
  sourceColor: string
): void => {
  // Background bar
  pdf.setFillColor(230, 230, 230);
  pdf.rect(x, y, width, height, 'F');
  
  // Value bar
  const barWidth = (value / 10) * width;
  const color = hexToRgb(sourceColor);
  pdf.setFillColor(color[0], color[1], color[2]);
  pdf.rect(x, y, barWidth, height, 'F');
};

// truncateText imported from theme.ts

/**
 * Generate a comprehensive 5-page PDF report for an employee
 */
export const generateEmployeeReport = async (options: GenerateEmployeeReportOptions): Promise<void> => {
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
    console.log('🔄 Generating Culture Base styled PDF report...');

    // Generate filename
    const filename = generateDownloadFilename(
      employee.name || `Employee_${employee.id}`,
      quarterName,
      'pdf'
    );

    // Fetch all required data
    const pdfData = await fetchPDFEmployeeData(employee.id, selectedQuarter);

    // Create PDF with Culture Base styling
    await generateStyledPDF(pdfData, quarterName, filename);

    console.log('✅ Culture Base styled PDF report generated successfully');

  } catch (error) {
    console.error('❌ Failed to generate styled PDF report:', error);
    
    if (error instanceof Error) {
      throw new Error(`PDF generation failed: ${error.message}`);
    } else {
      throw new Error('PDF generation failed due to an unknown error');
    }
  }
};

/**
 * Generate professionally styled PDF with Culture Base design system
 */
const generateStyledPDF = async (
  data: PDFEmployeeData,
  quarterName: string,
  filename: string
): Promise<void> => {
  // Create new PDF with A4 dimensions and standardized layout
  const pdf = new jsPDF('portrait', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = LAYOUT.pageMargin;
  const contentWidth = LAYOUT.contentWidth;

  // Page 1: Executive Summary with Culture Base styling
  generateExecutiveSummaryPage(pdf, data, quarterName, pageWidth, pageHeight, margin, contentWidth);

  // Page 2: Evaluation Consensus Analysis
  pdf.addPage();
  generateConsensusAnalysisPage(pdf, data, pageWidth, pageHeight, margin, contentWidth);

  // Page 3: Competence Breakdown
  pdf.addPage();
  generateCompetenceBreakdownPage(pdf, data, pageWidth, pageHeight, margin, contentWidth);

  // Page 4: Character Breakdown
  pdf.addPage();
  generateCharacterBreakdownPage(pdf, data, pageWidth, pageHeight, margin, contentWidth);

  // Page 5: Curiosity Breakdown
  pdf.addPage();
  generateCuriosityBreakdownPage(pdf, data, pageWidth, pageHeight, margin, contentWidth);

  // Save the PDF
  pdf.save(filename);
};

/**
 * Draw compact clustered bar chart for core groups
 */
const drawCompactClusteredBarChart = (
  pdf: jsPDF,
  scores: CoreGroupScore[],
  x: number,
  y: number,
  width: number,
  height: number = 25 // Default to 25 instead of 30
): void => {
  const chartHeight = height - 5; // Even less padding
  const barWidth = 6; // Smaller bars
  const groupSpacing = width / 3;
  const barSpacing = 1; // Tighter spacing
  const maxScore = 10;
  
  // Minimal background
  const bgColor = hexToRgb(COLORS.ui.surface);
  pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
  pdf.rect(x, y, width, height, 'F');
  
  // Minimal grid (only 0 and 10)
  const gridColor = hexToRgb(COLORS.ui.surfaceAlt);
  pdf.setDrawColor(gridColor[0], gridColor[1], gridColor[2]);
  pdf.setLineWidth(0.1);
  pdf.line(x + 5, y + chartHeight, x + width - 5, y + chartHeight); // Bottom line
  pdf.line(x + 5, y + 2, x + width - 5, y + 2); // Top line
  
  const titleColor = hexToRgb(COLORS.ui.textPrimary);
  scores.forEach((score, groupIndex) => {
    const groupX = x + groupIndex * groupSpacing;
    const centerX = groupX + (groupSpacing - (3 * barWidth + 2 * barSpacing)) / 2;
    
    // Use distinct colors for each group
    const groupColors = [COLORS.competence, COLORS.character, COLORS.curiosity];
    const groupColor = hexToRgb(groupColors[groupIndex]);
    
    // Manager bar
    const managerHeight = (score.manager_avg_score / maxScore) * chartHeight;
    const managerY = y + chartHeight - managerHeight;
    pdf.setFillColor(groupColor[0], groupColor[1], groupColor[2]);
    pdf.rect(centerX, managerY, barWidth, managerHeight, 'F');
    
    // Peer bar - lighter version
    const peerHeight = (score.peer_avg_score / maxScore) * chartHeight;
    const peerY = y + chartHeight - peerHeight;
    const peerColor = groupColor.map(c => Math.min(255, c + 50));
    pdf.setFillColor(peerColor[0], peerColor[1], peerColor[2]);
    pdf.rect(centerX + barWidth + barSpacing, peerY, barWidth, peerHeight, 'F');
    
    // Self bar - lightest version
    const selfHeight = (score.self_avg_score / maxScore) * chartHeight;
    const selfY = y + chartHeight - selfHeight;
    const selfColor = groupColor.map(c => Math.min(255, c + 100));
    pdf.setFillColor(selfColor[0], selfColor[1], selfColor[2]);
    pdf.rect(centerX + 2 * (barWidth + barSpacing), selfY, barWidth, selfHeight, 'F');
    
    // Values on top of bars (only if space)
    applyTypography(pdf, 'caption'); // 6pt
    pdf.setTextColor(titleColor[0], titleColor[1], titleColor[2]);
    if (managerHeight > 8) {
      pdf.text(score.manager_avg_score.toFixed(1), centerX, managerY - 1);
    }
    if (peerHeight > 8) {
      pdf.text(score.peer_avg_score.toFixed(1), centerX + barWidth + barSpacing, peerY - 1);
    }
    if (selfHeight > 8) {
      pdf.text(score.self_avg_score.toFixed(1), centerX + 2 * (barWidth + barSpacing), selfY - 1);
    }
    
    // Category label
    applyTypography(pdf, 'caption'); // 6pt
    const categoryNames = ['Competence', 'Character', 'Curiosity'];
    pdf.setTextColor(groupColor[0], groupColor[1], groupColor[2]);
    const labelWidth = pdf.getTextWidth(categoryNames[groupIndex]);
    pdf.text(categoryNames[groupIndex], groupX + (groupSpacing - labelWidth) / 2, y + height - 1);
  });
  
  // Tiny legend in corner
  applyTypography(pdf, 'caption'); // 6pt
  pdf.setTextColor(titleColor[0], titleColor[1], titleColor[2]);
  pdf.text('M/P/S', x + 2, y + 5);
};

/**
 * Draw compact score summary cards  
 */
const drawCompactScoreSummaryCards = (
  pdf: jsPDF,
  scores: CoreGroupScore[],
  x: number,
  y: number,
  width: number,
  height: number = 25
): void => {
  const cardWidth = width / 3 - 8;
  const categoryColors = [COLORS.competence, COLORS.character, COLORS.curiosity];
  
  scores.forEach((score, index) => {
    const cardX = x + index * (cardWidth + 12);
    drawScoreCard(pdf, score.weighted_score, ['COMP', 'CHAR', 'CUR'][index], cardX, y, cardWidth, height);
  });
};

/**
 * Reusable component: Draw compact bar chart
 */
const drawCompactBarChart = (
  pdf: jsPDF,
  data: { label: string; value: number; color?: string }[],
  x: number,
  y: number,
  width: number,
  height: number = 50
): void => {
  const barWidth = 8;
  const maxValue = 10;
  const barSpacing = (width - (data.length * barWidth)) / (data.length + 1);
  
  // Draw background
  const bgColor = hexToRgb(COLORS.ui.surface);
  pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
  pdf.rect(x, y, width, height, 'F');
  
  // Draw grid lines
  const gridColor = hexToRgb(COLORS.ui.surfaceAlt);
  pdf.setDrawColor(gridColor[0], gridColor[1], gridColor[2]);
  pdf.setLineWidth(0.1);
  for (let i = 0; i <= 10; i += 2) {
    const gridY = y + height - (i / maxValue) * height;
    pdf.line(x, gridY, x + width, gridY);
  }
  
  // Draw bars
  data.forEach((item, index) => {
    const barX = x + barSpacing + index * (barWidth + barSpacing);
    const barHeight = (item.value / maxValue) * height;
    const barY = y + height - barHeight;
    
    const barColor = hexToRgb(item.color || getPerformanceColor(item.value));
    pdf.setFillColor(barColor[0], barColor[1], barColor[2]);
    pdf.rect(barX, barY, barWidth, barHeight, 'F');
    
    // Value label
    applyTypography(pdf, 'caption');
    const textColor = hexToRgb(COLORS.ui.textPrimary);
    pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
    pdf.text(item.value.toFixed(1), barX + barWidth/2 - 3, barY - 2);
    
    // Label
    applyTypography(pdf, 'caption');
    pdf.text(item.label, barX + barWidth/2 - 8, y + height + 8);
  });
};

/**
 * Reusable component: Draw score card
 */
const drawScoreCard = (
  pdf: jsPDF,
  score: number,
  label: string,
  x: number,
  y: number,
  width: number,
  height: number = 18 // Reduced default from 20
): void => {
  // Card background
  const bgColor = hexToRgb(COLORS.ui.background);
  pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
  pdf.roundedRect(x, y, width, height, 2, 2, 'F');
  
  // Border based on performance
  const borderColor = hexToRgb(getPerformanceColor(score));
  pdf.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  pdf.setLineWidth(0.5);
  pdf.roundedRect(x, y, width, height, 2, 2, 'S');
  
  // Score - adjust for smaller cards
  applyTypography(pdf, 'dataSmall'); // Use 10pt instead of 14pt for score
  const scoreColor = hexToRgb(COLORS.ui.textPrimary);
  pdf.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  const scoreText = score.toFixed(1);
  const scoreWidth = pdf.getTextWidth(scoreText);
  pdf.text(scoreText, x + (width - scoreWidth) / 2, y + height/2 + 1);
  
  // Label with smaller font
  applyTypography(pdf, 'caption'); // 7pt
  const labelColor = hexToRgb(COLORS.ui.textSecondary);
  pdf.setTextColor(labelColor[0], labelColor[1], labelColor[2]);
  const labelWidth = pdf.getTextWidth(label);
  pdf.text(label, x + (width - labelWidth) / 2, y + height - 3);
};

/**
 * Reusable component: Draw data table
 */
const drawDataTable = (
  pdf: jsPDF,
  headers: string[],
  rows: string[][],
  x: number,
  y: number,
  width: number,
  rowHeight: number = 7
): void => {
  const headerHeight = 8;
  const columnWidths = headers.map(() => width / headers.length);
  
  // Header background
  const headerColor = hexToRgb(COLORS.ui.surfaceAlt);
  pdf.setFillColor(headerColor[0], headerColor[1], headerColor[2]);
  pdf.rect(x, y, width, headerHeight, 'F');
  
  // Header text
  applyTypography(pdf, 'caption');
  const textColor = hexToRgb(COLORS.ui.textPrimary);
  pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
  
  let headerX = x + 2;
  headers.forEach((header, index) => {
    pdf.text(header, headerX, y + 6);
    headerX += columnWidths[index];
  });
  
  // Rows
  rows.forEach((row, rowIndex) => {
    const rowY = y + headerHeight + (rowIndex * rowHeight);
    
    // Alternating background
    if (rowIndex % 2 === 0) {
      const altColor = hexToRgb('#fafafa');
      pdf.setFillColor(altColor[0], altColor[1], altColor[2]);
      pdf.rect(x, rowY, width, rowHeight, 'F');
    }
    
    // Row data
    applyTypography(pdf, 'caption');
    let cellX = x + 2;
    row.forEach((cell, cellIndex) => {
      pdf.text(cell, cellX, rowY + 5);
      cellX += columnWidths[cellIndex];
    });
  });
};

/**
 * Reusable component: Draw insight box
 */
const drawInsightBox = (
  pdf: jsPDF,
  title: string,
  items: string[],
  x: number,
  y: number,
  width: number,
  height: number
): void => {
  // Background
  const bgColor = hexToRgb(COLORS.ui.surface);
  pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
  pdf.roundedRect(x, y, width, height, 2, 2, 'F');
  
  // Title
  applyTypography(pdf, 'subsectionTitle');
  const titleColor = hexToRgb(COLORS.ui.textPrimary);
  pdf.setTextColor(titleColor[0], titleColor[1], titleColor[2]);
  pdf.text(title, x + 4, y + 8);
  
  // Items
  applyTypography(pdf, 'body');
  const itemColor = hexToRgb(COLORS.ui.textSecondary);
  pdf.setTextColor(itemColor[0], itemColor[1], itemColor[2]);
  
  items.forEach((item, index) => {
    pdf.text(`• ${item}`, x + 4, y + 16 + (index * 6));
  });
};

/**
 * Generate Page 1: Executive Summary with complete redesign
 */
const generateExecutiveSummaryPage = (
  pdf: jsPDF,
  data: PDFEmployeeData,
  quarterName: string,
  pageWidth: number,
  pageHeight: number,
  margin: number,
  contentWidth: number
): void => {
  let yPosition = margin;

  // Set background
  const bgColor = hexToRgb(COLORS.ui.background);
  pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  // 1. Compact Header with Overall Score on Right
  applyTypography(pdf, 'pageTitle'); // 16pt
  const titleColor = hexToRgb(COLORS.ui.textPrimary);
  pdf.setTextColor(titleColor[0], titleColor[1], titleColor[2]);
  pdf.text(data.employee.name || 'Unknown Employee', margin, yPosition);
  
  // Overall Score - right aligned, smaller
  const overallScore = data.overallAverage;
  const performanceColor = getPerformanceColor(overallScore);
  const categoryText = overallScore >= 8.0 ? 'A-Player' : overallScore >= 7.0 ? 'B-Player' : overallScore >= 6.0 ? 'C-Player' : 'D-Player';
  
  applyTypography(pdf, 'dataMedium'); // 12pt instead of 20pt
  const perfColor = hexToRgb(performanceColor);
  pdf.setTextColor(perfColor[0], perfColor[1], perfColor[2]);
  const scoreString = `Score: ${overallScore.toFixed(1)} (${data.overallGrade}) ${categoryText}`;
  const scoreWidth = pdf.getTextWidth(scoreString);
  pdf.text(scoreString, pageWidth - margin - scoreWidth, yPosition);
  
  yPosition += 6; // Smaller spacing
  
  // Employee details - smaller
  applyTypography(pdf, 'body'); // 8pt
  const secondaryColor = hexToRgb(COLORS.ui.textSecondary);
  pdf.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  pdf.text(`${quarterName} | ${data.employee.department || 'No Department'}`, margin, yPosition);
  yPosition += 4;
  
  applyTypography(pdf, 'caption'); // 6pt
  pdf.text(data.employee.email || 'No email', margin, yPosition);
  yPosition += 8; // Reduced spacing

  // 2. Ultra-Compact Metric Cards (horizontal layout)
  const metricsHeight = 8; // Very small height
  const { managerRating, peerRating, selfRating, finalScore } = calculateOverallRatings(data.coreGroupScores);
  
  const metrics = [
    { score: managerRating, label: 'MGR', color: COLORS.evaluators.manager },
    { score: peerRating, label: 'PEER', color: COLORS.evaluators.peer },
    { score: selfRating, label: 'SELF', color: COLORS.evaluators.self },
    { score: finalScore, label: 'FINAL', color: COLORS.primary }
  ];
  
  // Draw all metrics in a single row
  const metricWidth = contentWidth / 4;
  metrics.forEach((metric, index) => {
    const metricX = margin + index * metricWidth;
    
    // Mini card background
    const cardBg = hexToRgb(COLORS.ui.surface);
    pdf.setFillColor(cardBg[0], cardBg[1], cardBg[2]);
    pdf.rect(metricX, yPosition, metricWidth - 2, metricsHeight, 'F');
    
    // Left accent line
    const accentColor = hexToRgb(metric.color);
    pdf.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
    pdf.rect(metricX, yPosition, 2, metricsHeight, 'F');
    
    // Label and score on same line
    applyTypography(pdf, 'caption'); // 6pt
    pdf.setTextColor(titleColor[0], titleColor[1], titleColor[2]);
    pdf.text(metric.label, metricX + 4, yPosition + 5);
    
    applyTypography(pdf, 'dataSmall'); // 9pt
    pdf.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    pdf.text(metric.score.toFixed(1), metricX + metricWidth - 15, yPosition + 5);
  });
  
  yPosition += metricsHeight + 8;

  // 3. Smaller Core Group Performance Chart
  applyTypography(pdf, 'sectionTitle'); // 12pt
  pdf.setTextColor(titleColor[0], titleColor[1], titleColor[2]);
  pdf.text('Core Group Performance', margin, yPosition);
  yPosition += 5;
  
  const chartHeight = 24; // Slightly smaller chart to make room for definitions
  drawCompactClusteredBarChart(pdf, data.coreGroupScores, margin, yPosition, contentWidth, chartHeight);
  yPosition += chartHeight + 10;

  // 3b. Core Group Definitions (concise, fits on one line per group)
  const drawCoreGroupDefinitions = (
    pdfInst: jsPDF,
    x: number,
    y: number,
    width: number
  ): number => {
    const lineHeight = 5; // compact
    applyTypography(pdfInst, 'body'); // 8pt
    pdfInst.setTextColor(titleColor[0], titleColor[1], titleColor[2]);
    pdfInst.text('Core Group Definitions', x, y);
    let yy = y + 4;
    applyTypography(pdfInst, 'caption'); // 7pt
    const cgText = [
      'Competence: Execution & delivery excellence (e.g., Reliability, Accountability for Action, Quality of Work).',
      'Character: Leadership & interpersonal skills (e.g., Communication, Collaboration, Ownership & Initiative).',
      'Curiosity: Growth & innovation mindset (e.g., Continuous Improvement, Adaptability, Problem Solving).'
    ];
    cgText.forEach((t, idx) => {
      pdfInst.text(`• ${t}`, x, yy + idx * lineHeight);
    });
    return 4 + cgText.length * lineHeight;
  };

  const defUsedHeight = drawCoreGroupDefinitions(pdf, margin, yPosition, contentWidth);
  yPosition += defUsedHeight + 4; // small spacer

  // 4. Detailed Attribute Analysis - with smaller table (slightly reduced sizes to fit one page)
  applyTypography(pdf, 'sectionTitle'); // 12pt
  pdf.text('Detailed Attribute Analysis', margin, yPosition);
  yPosition += 5;
  
  // Collect all attributes from all core groups
  const allAttributes: any[] = [];
  
  ['competence', 'character', 'curiosity'].forEach(group => {
    if (data.coreGroupBreakdown[group as keyof typeof data.coreGroupBreakdown]) {
      const groupData = data.coreGroupBreakdown[group as keyof typeof data.coreGroupBreakdown];
      if (groupData && groupData.attributes) {
        groupData.attributes.forEach((attr: any) => {
          const weighted = attr.scores.manager * 0.4 + attr.scores.peer * 0.3 + attr.scores.self * 0.3;
          
          // Don't truncate - use full names, only shorten if absolutely necessary
          let displayName = attr.attributeName;
          
          // Only shorten if over 20 chars - Smart abbreviation mapping
          if (displayName.length > 20) {
            displayName = displayName
              .replace('Accountability for Action', 'Accountability')
              .replace('Communication Skills', 'Communication')
              .replace('Collaboration and Teamwork', 'Teamwork')
              .replace('Adaptability/Flexibility', 'Adaptability')
              .replace('Continuous Improvement', 'Continuous Improv.')
              .replace('Problem Solving Ability', 'Problem Solving')
              .replace('Taking Initiative', 'Taking Initiative')
              .replace('Quality of Work', 'Quality of Work');
          }
          
          allAttributes.push({
            name: displayName,
            category: group,
            manager: attr.scores.manager,
            peer: attr.scores.peer,
            self: attr.scores.self,
            weighted: weighted
          });
        });
      }
    }
  });
  
  // Draw table with headers
  const headers = ['Attribute', 'Manager', 'Peer', 'Self', 'Final Score', 'Visual'];
  const columnWidths = [
    contentWidth * 0.25, // Attribute
    contentWidth * 0.12, // Manager
    contentWidth * 0.12, // Peer
    contentWidth * 0.12, // Self
    contentWidth * 0.15, // Final Score
    contentWidth * 0.24  // Visual
  ];
  
  // Table header (4.5mm height)
  const headerHeight = 4.5;
  const headerColor = hexToRgb('#1e3a8a');
  pdf.setFillColor(headerColor[0], headerColor[1], headerColor[2]);
  pdf.rect(margin, yPosition, contentWidth, headerHeight, 'F');
  
  // Header text
  applyTypography(pdf, 'caption'); // 6-7pt for all table content
  pdf.setTextColor(255, 255, 255);
  let headerX = margin + 2;
  headers.forEach((header, index) => {
    pdf.text(header, headerX, yPosition + 3.5); // Adjusted for smaller header
    headerX += columnWidths[index];
  });
  
  yPosition += headerHeight;
  
  // Table rows (4.5mm height each)
  const rowHeight = 4.5;
  allAttributes.forEach((attr, rowIndex) => {
    const rowY = yPosition + (rowIndex * rowHeight);
    
    // Alternating row colors
    if (rowIndex % 2 === 0) {
      const altColor = hexToRgb('#f9fafb');
      pdf.setFillColor(altColor[0], altColor[1], altColor[2]);
      pdf.rect(margin, rowY, contentWidth, rowHeight, 'F');
    }
    
    // Row data
    applyTypography(pdf, 'caption'); // 7pt compact
    pdf.setTextColor(titleColor[0], titleColor[1], titleColor[2]);
    
    let cellX = margin + 2;
    const rowData = [
      attr.name,
      attr.manager.toFixed(1),
      attr.peer.toFixed(1),
      attr.self.toFixed(1),
      attr.weighted.toFixed(1)
    ];
    
    rowData.forEach((data, cellIndex) => {
      pdf.text(data, cellX, rowY + 3.2); // Adjusted for smaller row height (4.5mm)
      cellX += columnWidths[cellIndex];
    });
    
    // Visual comparison bar in last column - smaller bars
    const barX = cellX;
    const barWidth = columnWidths[5] - 8;
    const barHeight = 1.5; // Reduced to save space
    const barY = rowY + 1.3; // Center in smaller row
    
    // Determine which evaluator has highest score - FIXED LOGIC
    let sourceColor: string;
    if (attr.manager >= attr.peer && attr.manager >= attr.self) {
      sourceColor = COLORS.evaluators.manager; // Navy #1e3a8a
    } else if (attr.peer >= attr.manager && attr.peer >= attr.self) {
      sourceColor = COLORS.evaluators.peer; // Teal #14b8a6
    } else {
      sourceColor = COLORS.evaluators.self; // Gray #6b7280
    }
    
    drawVisualBar(pdf, barX, barY, barWidth, barHeight, attr.weighted, sourceColor);
  });
  
  yPosition += allAttributes.length * rowHeight + (LAYOUT.elementSpacing - 2); // tighten spacing slightly

  // 6. Key Insights Section (225-255mm)
  const insightWidth = (contentWidth - LAYOUT.gutterWidth) / 2;
  
  // Generate insights based on actual data
  const topAttributes = allAttributes.sort((a, b) => b.weighted - a.weighted).slice(0, 3);
  const strengthTexts = topAttributes.map(attr => `${attr.name} (${attr.weighted.toFixed(1)})`);
  
  const lowAttributes = allAttributes.sort((a, b) => a.weighted - b.weighted).slice(0, 3);
  const developmentTexts = lowAttributes.map(attr => `${attr.name} (${attr.weighted.toFixed(1)})`);
  
  drawInsightBox(pdf, 'Top 3 Strengths', strengthTexts, margin, yPosition, insightWidth, 28);
  drawInsightBox(pdf, 'Top 3 Development Areas', developmentTexts, margin + insightWidth + LAYOUT.gutterWidth, yPosition, insightWidth, 28);
  
  yPosition += 28 + (LAYOUT.elementSpacing - 2); // keep within page

  // 7. Quick Stats Bar - Real Data Only
  const statsData = [
    `Submissions: ${data.totalSubmissions}`,
    `Consensus: ${data.consensusMetrics.consensus_level.charAt(0).toUpperCase() + data.consensusMetrics.consensus_level.slice(1)}`,
    `Variance: ${data.consensusMetrics.overall_variance.toFixed(2)}`
  ];
  
  applyTypography(pdf, 'caption'); // 7pt
  pdf.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  
  const statSpacing = contentWidth / statsData.length;
  statsData.forEach((stat, index) => {
    pdf.text(stat, margin + index * statSpacing, yPosition);
  });
};



/**
 * Calculate overall ratings from core group scores
 */
const calculateOverallRatings = (scores: CoreGroupScore[]): {
  managerRating: number;
  peerRating: number;
  selfRating: number;
  finalScore: number;
} => {
  if (scores.length === 0) {
    return { managerRating: 0, peerRating: 0, selfRating: 0, finalScore: 0 };
  }

  const managerRating = scores.reduce((sum, score) => sum + score.manager_avg_score, 0) / scores.length;
  const peerRating = scores.reduce((sum, score) => sum + score.peer_avg_score, 0) / scores.length;
  const selfRating = scores.reduce((sum, score) => sum + score.self_avg_score, 0) / scores.length;
  const finalScore = scores.reduce((sum, score) => sum + score.weighted_score, 0) / scores.length;

  return { managerRating, peerRating, selfRating, finalScore };
};









/**
 * Generate Page 2: Evaluation Consensus Analysis with enhanced styling
 */
const generateConsensusAnalysisPage = (
  pdf: jsPDF,
  data: PDFEmployeeData,
  pageWidth: number,
  pageHeight: number,
  margin: number,
  contentWidth: number
): void => {
  let yPosition = margin;

  // Set background
  const bgColor = hexToRgb(COLORS.ui.background);
  pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  // Page title with Culture Base styling
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  const titleColor = hexToRgb(COLORS.ui.textPrimary);
  pdf.setTextColor(titleColor[0], titleColor[1], titleColor[2]);
  pdf.text('Evaluation Consensus Analysis', margin, yPosition);
  yPosition += 32;

  // Enhanced radar chart representation with integrated metrics
  drawStyledRadarChart(pdf, data.coreGroupScores, data.consensusMetrics, margin, yPosition, contentWidth);
};

/**
 * Draw styled radar chart representation with overlapping triangular data
 */
const drawStyledRadarChart = (
  pdf: jsPDF,
  scores: CoreGroupScore[],
  consensusMetrics: any,
  x: number,
  y: number,
  width: number
): void => {
  const chartSize = 80;
  const centerX = x + width / 2;
  const centerY = y + chartSize / 2;
  const maxRadius = chartSize / 2 - 15;

  // Draw card background
  const sectionColor = hexToRgb(COLORS.ui.surface);
  pdf.setFillColor(sectionColor[0], sectionColor[1], sectionColor[2]);
  pdf.roundedRect(x, y - 10, width, chartSize + 20, 8, 8, 'F');

  // Title
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  const titleColor = hexToRgb(COLORS.ui.textPrimary);
  pdf.setTextColor(titleColor[0], titleColor[1], titleColor[2]);
  pdf.text('Evaluator Consensus Overview', x + 15, y);

  // Draw concentric triangles for scale (0, 2, 4, 6, 8, 10 score levels)
  const gridColor = hexToRgb('#f3f4f6'); // Very light gray
  pdf.setDrawColor(gridColor[0], gridColor[1], gridColor[2]);
  pdf.setLineWidth(0.2); // Thinner grid lines
  
  for (let scale = 2; scale <= 10; scale += 2) {
    const scaleRadius = (scale / 10) * maxRadius;
    const trianglePoints = [
      { x: centerX, y: centerY - scaleRadius }, // Competence (top)
      { x: centerX - scaleRadius * 0.866, y: centerY + scaleRadius * 0.5 }, // Character (bottom left)
      { x: centerX + scaleRadius * 0.866, y: centerY + scaleRadius * 0.5 }  // Curiosity (bottom right)
    ];
    
    // Draw scale triangle with subtle lines
    for (let i = 0; i < trianglePoints.length; i++) {
      const nextIndex = (i + 1) % trianglePoints.length;
      pdf.line(trianglePoints[i].x, trianglePoints[i].y, trianglePoints[nextIndex].x, trianglePoints[nextIndex].y);
    }
    
    // Add scale numbers at the top point of each triangle
    if (scale % 4 === 0) { // Only show scale numbers at 4, 8
      pdf.setFontSize(6);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(150, 150, 150); // Light gray
      pdf.text(scale.toString(), centerX + 2, centerY - scaleRadius + 2);
    }
  }

  // Define triangle corners for Competence, Character, Curiosity
  const cornerPositions = [
    { x: centerX, y: centerY - maxRadius, label: 'Competence', color: COLORS.competence }, // Top
    { x: centerX - maxRadius * 0.866, y: centerY + maxRadius * 0.5, label: 'Character', color: COLORS.character }, // Bottom left
    { x: centerX + maxRadius * 0.866, y: centerY + maxRadius * 0.5, label: 'Curiosity', color: COLORS.curiosity }  // Bottom right
  ];

  // Draw corner labels only (no legend dots)
  cornerPositions.forEach(corner => {
    const cornerColor = hexToRgb(corner.color);
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(cornerColor[0], cornerColor[1], cornerColor[2]);
    
    // Position labels well outside the triangle area
    let labelX = corner.x;
    let labelY = corner.y;
    if (corner.label === 'Competence') labelY -= 12;
    if (corner.label === 'Character') { labelX -= 35; labelY += 8; } // Move Character label further left
    if (corner.label === 'Curiosity') { labelX += 8; labelY += 8; }
    
    pdf.text(corner.label, labelX, labelY);
  });

  // Calculate average scores for each core group across all score data
  const avgScores = {
    competence: scores.find(s => s.core_group === 'competence') || { manager_avg_score: 0, peer_avg_score: 0, self_avg_score: 0 },
    character: scores.find(s => s.core_group === 'character') || { manager_avg_score: 0, peer_avg_score: 0, self_avg_score: 0 },
    curiosity: scores.find(s => s.core_group === 'curiosity') || { manager_avg_score: 0, peer_avg_score: 0, self_avg_score: 0 }
  };

  // Draw three overlapping triangles for Manager, Peer, Self with muted colors
  const evaluatorTypes = [
    { name: 'Manager', color: '#dc2626', scores: [avgScores.competence.manager_avg_score, avgScores.character.manager_avg_score, avgScores.curiosity.manager_avg_score] }, // Muted red/pink
    { name: 'Peer', color: '#0891b2', scores: [avgScores.competence.peer_avg_score, avgScores.character.peer_avg_score, avgScores.curiosity.peer_avg_score] }, // Muted teal/cyan
    { name: 'Self', color: '#7c3aed', scores: [avgScores.competence.self_avg_score, avgScores.character.self_avg_score, avgScores.curiosity.self_avg_score] } // Muted blue/purple
  ];

  evaluatorTypes.forEach(evaluator => {
    const evalColor = hexToRgb(evaluator.color);
    
    // Calculate triangle points based on actual scores
    const trianglePoints = evaluator.scores.map((score, index) => {
      const scoreRadius = (score / 10) * maxRadius;
      return {
        x: cornerPositions[index].x === centerX ? centerX : 
           cornerPositions[index].x < centerX ? centerX - scoreRadius * 0.866 : centerX + scoreRadius * 0.866,
        y: cornerPositions[index].y === centerY - maxRadius ? centerY - scoreRadius : centerY + scoreRadius * 0.5
      };
    });

    // Draw only thin colored line borders (no fill or minimal fill)
    pdf.setDrawColor(evalColor[0], evalColor[1], evalColor[2]);
    pdf.setLineWidth(0.75); // Thin 2px-equivalent lines
    
    // Draw triangle outline only
    for (let i = 0; i < trianglePoints.length; i++) {
      const nextIndex = (i + 1) % trianglePoints.length;
      pdf.line(trianglePoints[i].x, trianglePoints[i].y, trianglePoints[nextIndex].x, trianglePoints[nextIndex].y);
    }
  });

  // Add three score cards below the radar chart
  const cardsY = y + chartSize + 15;
  const cardWidth = 45;
  const cardHeight = 30;
  const cardSpacing = 10;
  const totalCardsWidth = (cardWidth * 3) + (cardSpacing * 2);
  const cardsStartX = centerX - (totalCardsWidth / 2);

  // Calculate average scores for each evaluator type across all core groups
  const avgManagerScore = evaluatorTypes[0].scores.reduce((sum, score) => sum + score, 0) / 3;
  const avgPeerScore = evaluatorTypes[1].scores.reduce((sum, score) => sum + score, 0) / 3;
  const avgSelfScore = evaluatorTypes[2].scores.reduce((sum, score) => sum + score, 0) / 3;

  const scoreCards = [
    { 
      name: 'Manager', 
      score: avgManagerScore, 
      color: '#EF4444', 
      bgColor: '#FEE2E2',
      x: cardsStartX 
    },
    { 
      name: 'Peer', 
      score: avgPeerScore, 
      color: '#10B981', 
      bgColor: '#D1FAE5',
      x: cardsStartX + cardWidth + cardSpacing 
    },
    { 
      name: 'Self', 
      score: avgSelfScore, 
      color: '#8B5CF6', 
      bgColor: '#EDE9FE',
      x: cardsStartX + (cardWidth + cardSpacing) * 2 
    }
  ];

  scoreCards.forEach(card => {
    // Draw card background
    const bgColor = hexToRgb(card.bgColor);
    pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
    pdf.roundedRect(card.x, cardsY, cardWidth, cardHeight, 4, 4, 'F');

    // Draw card border
    const borderColor = hexToRgb(card.color);
    pdf.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(card.x, cardsY, cardWidth, cardHeight, 4, 4, 'S');

    // Draw large score
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0); // Black text for score
    const scoreText = card.score.toFixed(1);
    const scoreWidth = pdf.getTextWidth(scoreText);
    pdf.text(scoreText, card.x + cardWidth/2 - scoreWidth/2, cardsY + 14);

    // Draw evaluator label
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(borderColor[0], borderColor[1], borderColor[2]);
    const nameWidth = pdf.getTextWidth(card.name);
    pdf.text(card.name, card.x + cardWidth/2 - nameWidth/2, cardsY + 22);

    // Draw "Average" sublabel
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(120, 120, 120); // Gray text
    const avgWidth = pdf.getTextWidth('Average');
    pdf.text('Average', card.x + cardWidth/2 - avgWidth/2, cardsY + 28);
  });

  // Add consensus metrics section below the score cards
  const metricsHeaderY = cardsY + cardHeight + 15; // Reduced space from cards
  const metricsStartY = metricsHeaderY + 15; // Reduced space for header
  const metricsWidth = width - 30; // Full width minus padding
  const metricsStartX = x + 15; // Left padding

  // Metrics section header
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  const metricsTitleColor = hexToRgb(COLORS.ui.textPrimary);
  pdf.setTextColor(metricsTitleColor[0], metricsTitleColor[1], metricsTitleColor[2]);
  pdf.text('Consensus Metrics', metricsStartX, metricsHeaderY);

  // Helper function to determine status based on gap value
  const getGapStatus = (value: number, isVariance: boolean = false) => {
    if (isVariance) {
      if (value <= 1.0) return { text: 'Good', bgColor: '#D1FAE5', textColor: '#059669' };
      if (value <= 2.0) return { text: 'Medium', bgColor: '#FEF3C7', textColor: '#D97706' };
      return { text: 'High', bgColor: '#FEE2E2', textColor: '#DC2626' };
    } else {
      if (value <= 0.5) return { text: 'Good', bgColor: '#D1FAE5', textColor: '#059669' };
      if (value <= 1.0) return { text: 'Medium', bgColor: '#FEF3C7', textColor: '#D97706' };
      return { text: 'High', bgColor: '#FEE2E2', textColor: '#DC2626' };
    }
  };

  // Get consensus data from the consensusMetrics parameter
  const consensusData = consensusMetrics;

  const metricsRows = [
    {
      title: 'Self vs Others Gap',
      description: 'Difference between self-assessment and external perspectives',
      value: consensusData.self_vs_others_gap,
      isVariance: false
    },
    {
      title: 'Manager vs Peer Gap', 
      description: 'Alignment between management and peer perspectives',
      value: consensusData.manager_vs_peer_gap,
      isVariance: false
    },
    {
      title: 'Overall Variance',
      description: 'Overall consensus across all evaluator types',
      value: consensusData.overall_variance,
      isVariance: true
    }
  ];

  metricsRows.forEach((metric, index) => {
    const currentY = metricsStartY + (index * 22); // Fixed 22px spacing between rows
    const status = getGapStatus(metric.value, metric.isVariance);
    
    // Left side - Title and description stacked (more compact)
    pdf.setFontSize(11); // Slightly smaller title
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text(metric.title, metricsStartX, currentY);

    pdf.setFontSize(8); // Smaller description
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(120, 120, 120); // Gray
    pdf.text(metric.description, metricsStartX, currentY + 8); // Closer to title

    // Right side - Value and status badge horizontally aligned
    const valueText = metric.value.toFixed(1);
    const badgeWidth = 24;
    const badgeHeight = 9; // Slightly smaller badge
    const rightEdge = metricsStartX + metricsWidth - 30;
    
    // Draw value
    pdf.setFontSize(13); // Slightly smaller value
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    const valueWidth = pdf.getTextWidth(valueText);
    pdf.text(valueText, rightEdge - badgeWidth - 8 - valueWidth, currentY + 4);

    // Draw status badge
    const statusBgColor = hexToRgb(status.bgColor);
    const statusTextColor = hexToRgb(status.textColor);
    
    pdf.setFillColor(statusBgColor[0], statusBgColor[1], statusBgColor[2]);
    pdf.roundedRect(rightEdge - badgeWidth, currentY - 1, badgeWidth, badgeHeight, 2, 2, 'F');
    
    pdf.setFontSize(7); // Smaller badge text
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(statusTextColor[0], statusTextColor[1], statusTextColor[2]);
    const statusWidth = pdf.getTextWidth(status.text);
    pdf.text(status.text, rightEdge - badgeWidth/2 - statusWidth/2, currentY + 4);

    // Draw subtle row divider after each row (except last)
    if (index < metricsRows.length - 1) {
      pdf.setDrawColor(229, 231, 235); // #E5E7EB light gray
      pdf.setLineWidth(0.2);
      pdf.line(metricsStartX, currentY + 15, metricsStartX + metricsWidth - 30, currentY + 15);
    }
  });
};

/**
 * Generate Page 3: Competence Breakdown (Execution and Delivery)
 */
const generateCompetenceBreakdownPage = (
  pdf: jsPDF,
  data: PDFEmployeeData,
  pageWidth: number,
  pageHeight: number,
  margin: number,
  contentWidth: number
): void => {
  let yPosition = margin;

  // Set background
  const bgColor = hexToRgb(COLORS.ui.background);
  pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  // Page header with category styling
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  const competenceColor = hexToRgb(COLORS.competence);
  pdf.setTextColor(competenceColor[0], competenceColor[1], competenceColor[2]);
  pdf.text('Competence Breakdown', margin, yPosition);
  yPosition += 8;
  
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'normal');
  pdf.text('(Execution and Delivery)', margin, yPosition);
  yPosition += 32;

  // Check if competence data is available
  if (!data.coreGroupBreakdown.competence || !data.coreGroupBreakdown.competence.attributes.length) {
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    const textColor = hexToRgb(COLORS.ui.textSecondary);
    pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
    pdf.text('No competence evaluation data available for this quarter.', margin, yPosition);
    return;
  }

  const competenceData = data.coreGroupBreakdown.competence;

  // Clustered bar chart for individual attributes
  drawAttributeClusteredBarChart(pdf, competenceData, margin, yPosition, contentWidth, 'Competence Attributes');
  yPosition += 120;

  // Competence pattern analysis
  const patternAnalysis = generateCompetenceAnalysisFromData(competenceData, data.employee.name);
  if (patternAnalysis) {
    drawPatternAnalysisSection(pdf, patternAnalysis, margin, yPosition, contentWidth);
  }
};

/**
 * Generate Page 4: Character Breakdown (Leadership and Interpersonal Skills)
 */
const generateCharacterBreakdownPage = (
  pdf: jsPDF,
  data: PDFEmployeeData,
  pageWidth: number,
  pageHeight: number,
  margin: number,
  contentWidth: number
): void => {
  let yPosition = margin;

  // Set background
  const bgColor = hexToRgb(COLORS.ui.background);
  pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  // Page header with category styling
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  const characterColor = hexToRgb(COLORS.character);
  pdf.setTextColor(characterColor[0], characterColor[1], characterColor[2]);
  pdf.text('Character Breakdown', margin, yPosition);
  yPosition += 8;
  
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'normal');
  pdf.text('(Leadership and Interpersonal Skills)', margin, yPosition);
  yPosition += 32;

  // Check if character data is available
  if (!data.coreGroupBreakdown.character || !data.coreGroupBreakdown.character.attributes.length) {
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    const textColor = hexToRgb(COLORS.ui.textSecondary);
    pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
    pdf.text('No character evaluation data available for this quarter.', margin, yPosition);
    return;
  }

  const characterData = data.coreGroupBreakdown.character;

  // Clustered bar chart for individual attributes
  drawAttributeClusteredBarChart(pdf, characterData, margin, yPosition, contentWidth, 'Character Attributes');
  yPosition += 120;

  // Character insights (simplified pattern analysis)
  drawCoreGroupInsightsSection(pdf, characterData, margin, yPosition, contentWidth, 'Character', data.employee.name);
};

/**
 * Generate Page 5: Curiosity Breakdown (Growth and Innovation)
 */
const generateCuriosityBreakdownPage = (
  pdf: jsPDF,
  data: PDFEmployeeData,
  pageWidth: number,
  pageHeight: number,
  margin: number,
  contentWidth: number
): void => {
  let yPosition = margin;

  // Set background
  const bgColor = hexToRgb(COLORS.ui.background);
  pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  // Page header with category styling
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  const curiosityColor = hexToRgb(COLORS.curiosity);
  pdf.setTextColor(curiosityColor[0], curiosityColor[1], curiosityColor[2]);
  pdf.text('Curiosity Breakdown', margin, yPosition);
  yPosition += 8;
  
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'normal');
  pdf.text('(Growth and Innovation)', margin, yPosition);
  yPosition += 32;

  // Check if curiosity data is available
  if (!data.coreGroupBreakdown.curiosity || !data.coreGroupBreakdown.curiosity.attributes.length) {
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    const textColor = hexToRgb(COLORS.ui.textSecondary);
    pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
    pdf.text('No curiosity evaluation data available for this quarter.', margin, yPosition);
    return;
  }

  const curiosityData = data.coreGroupBreakdown.curiosity;

  // Clustered bar chart for individual attributes
  drawAttributeClusteredBarChart(pdf, curiosityData, margin, yPosition, contentWidth, 'Curiosity Attributes');
  yPosition += 120;

  // Curiosity insights (simplified pattern analysis)
  drawCoreGroupInsightsSection(pdf, curiosityData, margin, yPosition, contentWidth, 'Curiosity', data.employee.name);
};

/**
 * Draw clustered bar chart for individual attributes within a core group
 */
const drawAttributeClusteredBarChart = (
  pdf: jsPDF,
  coreGroupData: DetailedCoreGroupAnalysis,
  x: number,
  y: number,
  width: number,
  title: string
): void => {
  // Card background
  const sectionColor = hexToRgb(COLORS.ui.surface);
  pdf.setFillColor(sectionColor[0], sectionColor[1], sectionColor[2]);
  pdf.roundedRect(x, y - 10, width, 110, 8, 8, 'F');

  // Title
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  const titleColor = hexToRgb(COLORS.ui.textPrimary);
  pdf.setTextColor(titleColor[0], titleColor[1], titleColor[2]);
  pdf.text(title, x + 15, y);

  // Chart parameters
  const chartHeight = 60;
  const chartStartY = y + 20;
  const yAxisWidth = 20;
  const chartAreaWidth = width - 60;
  const chartStartX = x + yAxisWidth + 15;
  
  const attributes = coreGroupData.attributes;
  const barWidth = chartAreaWidth / (attributes.length * 4); // 3 bars + spacing per attribute
  const maxScore = 10;

  // Draw Y-axis and grid lines
  const secondaryColor = hexToRgb(COLORS.ui.textSecondary);
  pdf.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  pdf.setLineWidth(0.3);
  
  // Y-axis line
  pdf.line(chartStartX, chartStartY, chartStartX, chartStartY + chartHeight);
  
  // Horizontal grid lines and scale labels
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  
  for (let i = 0; i <= 5; i++) {
    const score = i * 2;
    const gridY = chartStartY + chartHeight - (score / maxScore) * chartHeight;
    
    // Grid line
    pdf.setDrawColor(243, 244, 246); // Very light gray
    pdf.line(chartStartX, gridY, chartStartX + chartAreaWidth, gridY);
    
    // Scale label
    pdf.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    const labelWidth = pdf.getTextWidth(score.toString());
    pdf.text(score.toString(), chartStartX - 5 - labelWidth, gridY + 1);
  }

  // Draw bars for each attribute
  attributes.forEach((attr, index) => {
    const groupX = chartStartX + (index * chartAreaWidth / attributes.length);
    const groupWidth = chartAreaWidth / attributes.length;
    const singleBarWidth = Math.min(barWidth, groupWidth / 4);
    
    // Manager bar (100% opacity)
    const managerHeight = (attr.scores.manager / maxScore) * chartHeight;
    const managerColor = hexToRgb(COLORS.competence);
    pdf.setFillColor(managerColor[0], managerColor[1], managerColor[2]);
    pdf.roundedRect(groupX, chartStartY + chartHeight - managerHeight, singleBarWidth, managerHeight, 2, 2, 'F');
    
    // Value label on top of manager bar
    if (attr.scores.manager > 0) {
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      const valueText = attr.scores.manager.toFixed(1);
      const valueWidth = pdf.getTextWidth(valueText);
      pdf.text(valueText, groupX + singleBarWidth/2 - valueWidth/2, chartStartY + chartHeight - managerHeight - 2);
    }
    
    // Peer bar (75% opacity)
    const peerHeight = (attr.scores.peer / maxScore) * chartHeight;
    const lightColor1 = managerColor.map(c => Math.min(255, c + 60));
    pdf.setFillColor(lightColor1[0], lightColor1[1], lightColor1[2]);
    pdf.roundedRect(groupX + singleBarWidth + 2, chartStartY + chartHeight - peerHeight, singleBarWidth, peerHeight, 2, 2, 'F');
    
    // Value label on top of peer bar
    if (attr.scores.peer > 0) {
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      const valueText = attr.scores.peer.toFixed(1);
      const valueWidth = pdf.getTextWidth(valueText);
      pdf.text(valueText, groupX + singleBarWidth + 2 + singleBarWidth/2 - valueWidth/2, chartStartY + chartHeight - peerHeight - 2);
    }
    
    // Self bar (50% opacity)
    const selfHeight = (attr.scores.self / maxScore) * chartHeight;
    const lightColor2 = managerColor.map(c => Math.min(255, c + 120));
    pdf.setFillColor(lightColor2[0], lightColor2[1], lightColor2[2]);
    pdf.roundedRect(groupX + (singleBarWidth + 2) * 2, chartStartY + chartHeight - selfHeight, singleBarWidth, selfHeight, 2, 2, 'F');
    
    // Value label on top of self bar
    if (attr.scores.self > 0) {
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      const valueText = attr.scores.self.toFixed(1);
      const valueWidth = pdf.getTextWidth(valueText);
      pdf.text(valueText, groupX + (singleBarWidth + 2) * 2 + singleBarWidth/2 - valueWidth/2, chartStartY + chartHeight - selfHeight - 2);
    }
    
    // Attribute label
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    const attrName = attr.attributeName.length > 12 ? attr.attributeName.substring(0, 12) + '...' : attr.attributeName;
    const attrWidth = pdf.getTextWidth(attrName);
    pdf.text(attrName, groupX + groupWidth/2 - attrWidth/2, chartStartY + chartHeight + 12);
  });

  // Legend
  const legendY = y + 90;
  const legendItems = [
    { label: 'Manager', color: COLORS.competence },
    { label: 'Peer', color: COLORS.competence, opacity: '75%' },
    { label: 'Self', color: COLORS.competence, opacity: '50%' }
  ];

  legendItems.forEach((item, index) => {
    const legendX = x + 15 + (index * 60);
    
    // Color box
    const itemColor = hexToRgb(item.color);
    if (item.opacity === '75%') {
      const lightColor = itemColor.map(c => Math.min(255, c + 60));
      pdf.setFillColor(lightColor[0], lightColor[1], lightColor[2]);
    } else if (item.opacity === '50%') {
      const lightColor = itemColor.map(c => Math.min(255, c + 120));
      pdf.setFillColor(lightColor[0], lightColor[1], lightColor[2]);
    } else {
      pdf.setFillColor(itemColor[0], itemColor[1], itemColor[2]);
    }
    pdf.roundedRect(legendX, legendY, 8, 6, 1, 1, 'F');
    
    // Label
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    pdf.text(item.label, legendX + 12, legendY + 4);
  });
};

/**
 * Draw pattern analysis section for competence
 */
const drawPatternAnalysisSection = (
  pdf: jsPDF,
  patternAnalysis: any,
  x: number,
  y: number,
  width: number
): void => {
  // Card background
  const sectionColor = hexToRgb(COLORS.ui.surface);
  pdf.setFillColor(sectionColor[0], sectionColor[1], sectionColor[2]);
  pdf.roundedRect(x, y, width, 80, 8, 8, 'F');

  // Title with pattern icon
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  const titleColor = hexToRgb(COLORS.ui.textPrimary);
  pdf.setTextColor(titleColor[0], titleColor[1], titleColor[2]);
  pdf.text(`${patternAnalysis.riskIcon} ${patternAnalysis.title}`, x + 15, y + 18);

  // Pattern category
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  const categoryColor = hexToRgb(COLORS.ui.textSecondary);
  pdf.setTextColor(categoryColor[0], categoryColor[1], categoryColor[2]);
  pdf.text(`Pattern: ${patternAnalysis.category}`, x + 15, y + 32);

  // Insight text (wrapped)
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(titleColor[0], titleColor[1], titleColor[2]);
  const wrappedText = wrapText(pdf, patternAnalysis.insight, width - 30);
  wrappedText.forEach((line, index) => {
    pdf.text(line, x + 15, y + 48 + (index * 8));
  });
};

/**
 * Draw simplified insights section for character and curiosity
 */
const drawCoreGroupInsightsSection = (
  pdf: jsPDF,
  coreGroupData: DetailedCoreGroupAnalysis,
  x: number,
  y: number,
  width: number,
  coreGroupName: string,
  employeeName: string
): void => {
  // Card background
  const sectionColor = hexToRgb(COLORS.ui.surface);
  pdf.setFillColor(sectionColor[0], sectionColor[1], sectionColor[2]);
  pdf.roundedRect(x, y, width, 80, 8, 8, 'F');

  // Title
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  const titleColor = hexToRgb(COLORS.ui.textPrimary);
  pdf.setTextColor(titleColor[0], titleColor[1], titleColor[2]);
  pdf.text(`${coreGroupName} Profile Summary`, x + 15, y + 18);

  // Calculate average scores
  const totalAttributes = coreGroupData.attributes.length;
  const avgManager = coreGroupData.attributes.reduce((sum, attr) => sum + attr.scores.manager, 0) / totalAttributes;
  const avgPeer = coreGroupData.attributes.reduce((sum, attr) => sum + attr.scores.peer, 0) / totalAttributes;
  const avgSelf = coreGroupData.attributes.reduce((sum, attr) => sum + attr.scores.self, 0) / totalAttributes;
  const overallAvg = (avgManager + avgPeer + avgSelf) / 3;

  // Generate basic insight
  const playerCategory = overallAvg >= 8 ? 'A-Player' : overallAvg >= 7 ? 'B-Player' : overallAvg >= 6 ? 'C-Player' : 'D-Player';
  const categoryColor = overallAvg >= 8 ? '#059669' : overallAvg >= 7 ? '#14b8a6' : overallAvg >= 6 ? '#f59e0b' : '#dc2626';
  
  // Player category badge
  const badgeColor = hexToRgb(categoryColor);
  pdf.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2]);
  pdf.roundedRect(x + 15, y + 25, 60, 12, 4, 4, 'F');
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text(playerCategory, x + 20, y + 33);

  // Average score
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(titleColor[0], titleColor[1], titleColor[2]);
  pdf.text(`Overall Average: ${overallAvg.toFixed(1)}`, x + 85, y + 33);

  // Basic insight
  const insights = generateBasicInsights(coreGroupName, overallAvg, employeeName);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  const wrappedInsight = wrapText(pdf, insights, width - 30);
  wrappedInsight.forEach((line, index) => {
    pdf.text(line, x + 15, y + 50 + (index * 8));
  });
};

/**
 * Generate basic insights for character and curiosity
 */
const generateBasicInsights = (coreGroupName: string, averageScore: number, employeeName: string): string => {
  const name = employeeName.split(' ')[0]; // Use first name
  
  if (coreGroupName === 'Character') {
    if (averageScore >= 8) {
      return `${name} demonstrates exceptional leadership and interpersonal skills. They consistently build strong relationships and inspire others through their character.`;
    } else if (averageScore >= 7) {
      return `${name} shows solid character traits with good leadership and interpersonal capabilities. There are opportunities for continued growth in character development.`;
    } else if (averageScore >= 6) {
      return `${name} has character development opportunities. Focus on strengthening leadership skills and building more effective interpersonal relationships.`;
    } else {
      return `${name} faces character challenges that require immediate attention. Fundamental leadership and interpersonal skills need significant improvement.`;
    }
  } else { // Curiosity
    if (averageScore >= 8) {
      return `${name} exhibits exceptional curiosity and innovation. They actively seek growth opportunities and drive innovative solutions within the organization.`;
    } else if (averageScore >= 7) {
      return `${name} demonstrates good curiosity and growth mindset. There are opportunities to further develop innovative thinking and learning agility.`;
    } else if (averageScore >= 6) {
      return `${name} has growth potential in curiosity and innovation. Focus on developing learning agility and embracing new challenges.`;
    } else {
      return `${name} needs significant development in curiosity and innovation. Fundamental growth mindset and learning capabilities require attention.`;
    }
  }
};

// Legacy export for compatibility during transition
export const generateEmployeeReportLegacy = generateEmployeeReport;