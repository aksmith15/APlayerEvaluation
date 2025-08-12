/**
 * React-PDF ValueBar Component
 * Modern value bar visualization for React-PDF reports
 */

import React from 'react';
import { View, StyleSheet } from '@react-pdf/renderer';

interface ValueBarProps {
  value: number;
  maxValue?: number;
  width?: number;
  height?: number;
  color: string;
  backgroundColor?: string;
  rounded?: boolean;
}

export const ValueBar: React.FC<ValueBarProps> = ({
  value,
  maxValue = 10,
  width = 60,
  height = 14,
  color,
  backgroundColor = '#E6FFFA',
  rounded = true
}) => {
  const fillPercentage = Math.min((value / maxValue) * 100, 100);
  
  const styles = StyleSheet.create({
    container: {
      width: width,
      height: height,
      position: 'relative'
    },
    background: {
      width: '100%',
      height: '100%',
      backgroundColor: backgroundColor,
      position: 'absolute',
      borderRadius: rounded ? height / 2 : 0,
      border: '1px solid #dee2e6'
    },
    fill: {
      width: `${fillPercentage}%`,
      height: '100%',
      backgroundColor: color,
      position: 'absolute',
      borderRadius: rounded ? height / 2 : 0,
      border: '1px solid rgba(0,0,0,0.1)'
    }
  });

  return (
    <View style={styles.container}>
      <View style={styles.background} />
      <View style={styles.fill} />
    </View>
  );
};