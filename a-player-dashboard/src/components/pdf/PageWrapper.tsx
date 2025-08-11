/**
 * React-PDF PageWrapper Component
 * Provides consistent page layout with footer except on first page
 */

import React from 'react';
import { Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { COLORS, TYPOGRAPHY, LAYOUT } from '../../lib/theme';

interface PageWrapperProps {
  children: React.ReactNode;
  isFirstPage?: boolean;
  pageNumber?: number;
  totalPages?: number;
}

export const PageWrapper: React.FC<PageWrapperProps> = ({
  children,
  isFirstPage = false,
  pageNumber,
  totalPages
}) => {
  const styles = StyleSheet.create({
    page: {
      padding: LAYOUT.pageMargin,
      fontFamily: 'Helvetica',
      fontSize: TYPOGRAPHY.body.size,
      color: COLORS.ui.textPrimary,
      backgroundColor: COLORS.ui.background
    },
    content: {
      flex: 1,
      width: '100%'
    },
    footer: {
      position: 'absolute',
      bottom: LAYOUT.pageMargin,
      left: LAYOUT.pageMargin,
      right: LAYOUT.pageMargin,
      textAlign: 'center'
    },
    footerText: {
      fontSize: TYPOGRAPHY.caption.size,
      color: COLORS.ui.textTertiary
    }
  });

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.content}>
        {children}
      </View>
      
      {!isFirstPage && pageNumber && totalPages && (
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Page {pageNumber} of {totalPages}
          </Text>
        </View>
      )}
    </Page>
  );
};