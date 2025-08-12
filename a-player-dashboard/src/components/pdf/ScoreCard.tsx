/**
 * React-PDF ScoreCard Component
 * Performance score card visualization for React-PDF reports
 */

import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { COLORS, TYPOGRAPHY, getPerformanceColor, getFontWeight } from '../../lib/theme';

interface ScoreCardProps {
  score: number;
  label: string;
  width?: number;
  height?: number;
}

export const ScoreCard: React.FC<ScoreCardProps> = ({
  score,
  label,
  width = 50,
  height = 18
}) => {
  const performanceColor = getPerformanceColor(score);
  
  const styles = StyleSheet.create({
    container: {
      width: width,
      height: height,
      backgroundColor: COLORS.ui.background,
      borderRadius: 2,
      borderWidth: 0.5,
      borderColor: performanceColor,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative'
    },
    scoreText: {
      fontSize: TYPOGRAPHY.dataSmall.size,
      fontWeight: getFontWeight(TYPOGRAPHY.dataSmall.weight),
      color: COLORS.ui.textPrimary,
      marginBottom: 1
    },
    labelText: {
      fontSize: TYPOGRAPHY.caption.size,
      fontWeight: getFontWeight(TYPOGRAPHY.caption.weight),
      color: COLORS.ui.textSecondary,
      position: 'absolute',
      bottom: 3
    }
  });

  return (
    <View style={styles.container}>
      <Text style={styles.scoreText}>{score.toFixed(1)}</Text>
      <Text style={styles.labelText}>{label}</Text>
    </View>
  );
};