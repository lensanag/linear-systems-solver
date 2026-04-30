import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { Step, Cell, SolveResult } from '@/engines/shared/types';
import { renderKaTeXToDataURL } from './katex-image';
import { fractionToLatex } from '@/engines/numeric/parser';

// Define PDF styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 12,
    fontFamily: 'Helvetica',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  section: {
    marginTop: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
  },
  operationLabel: {
    fontSize: 10,
    fontStyle: 'italic',
    marginBottom: 8,
    color: '#666666',
  },
  matrixContainer: {
    marginVertical: 10,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  matrixRow: {
    display: 'flex',
    flexDirection: 'row',
    marginVertical: 2,
  },
  matrixCell: {
    padding: 4,
    minWidth: 40,
    minHeight: 24,
    textAlign: 'center',
    fontSize: 10,
    fontFamily: 'Courier',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  matrixImage: {
    maxHeight: 22,
    maxWidth: 45,
  },
  solutionContainer: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
  },
  solutionRow: {
    display: 'flex',
    flexDirection: 'row',
    marginVertical: 4,
    alignItems: 'center',
    minHeight: 22,
  },
  solutionLabel: {
    fontWeight: 'bold',
    minWidth: 60,
    fontSize: 11,
  },
  solutionValue: {
    fontFamily: 'Courier',
    fontSize: 11,
  },
  solutionImage: {
    maxHeight: 20,
    maxWidth: 70,
  },
  metadata: {
    marginTop: 20,
    fontSize: 9,
    color: '#999999',
    borderTopWidth: 1,
    borderTopColor: '#cccccc',
    paddingTop: 10,
  },
  metadataRow: {
    marginVertical: 2,
  },
  warning: {
    marginVertical: 10,
    padding: 8,
    backgroundColor: '#fff3cd',
    borderLeftWidth: 3,
    borderLeftColor: '#ffc107',
  },
  warningText: {
    fontSize: 11,
    color: '#856404',
  },
});

/**
 * Convert a Cell to either a string or KaTeX data URL.
 * Returns an object with either 'text' or 'imageUrl' field.
 */
function cellToDisplay(
  cell: Cell
): { type: 'text'; value: string } | { type: 'image'; value: string } {
  if (cell.type === 'fraction') {
    const num = typeof cell.num === 'string' ? cell.num : Number(cell.num);
    const den = typeof cell.den === 'string' ? cell.den : Number(cell.den);

    // Simple fractions (denominator 1) render as text
    if (den === 1) {
      return { type: 'text', value: String(num) };
    }

    // Render complex fractions as KaTeX images
    try {
      const latex = fractionToLatex(num as number, den as number);
      const imageUrl = renderKaTeXToDataURL(latex);
      return { type: 'image', value: imageUrl };
    } catch (error) {
      console.error('Failed to render fraction as image:', error);
      // Fallback to text
      return { type: 'text', value: `${num}/${den}` };
    }
  }

  // Non-fraction cells render as text
  return { type: 'text', value: cell.latex || '0' };
}

/**
 * Render a single matrix cell (text or image)
 */
function MatrixCell({ cell }: { cell: Cell }) {
  const display = cellToDisplay(cell);

  if (display.type === 'image') {
    // Render fraction as SVG image
    return (
      <View style={styles.matrixCell}>
        <Image src={display.value} style={styles.matrixImage} />
      </View>
    );
  }

  // Render simple text
  return (
    <Text style={styles.matrixCell}>{display.value}</Text>
  );
}

/**
 * Render a single matrix step
 */
function MatrixDisplay({ matrix, headers }: { matrix: Cell[][]; headers: string[] }) {
  if (!matrix || matrix.length === 0) {
    return null;
  }

  return (
    <View style={styles.matrixContainer}>
      <View>
        {matrix.map((row, rowIdx) => (
          <View key={rowIdx} style={styles.matrixRow}>
            {row.map((cell, colIdx) => (
              <MatrixCell key={`${rowIdx}-${colIdx}`} cell={cell} />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

/**
 * Render the solution vector with KaTeX for fractions
 */
function SolutionDisplay({
  solution,
  headers,
}: {
  solution: Cell[] | null;
  headers: string[];
}) {
  if (!solution || solution.length === 0) {
    return null;
  }

  return (
    <View style={styles.solutionContainer}>
      <Text style={styles.subsectionTitle}>Solution:</Text>
      {solution.map((cell, idx) => {
        const display = cellToDisplay(cell);
        return (
          <View key={idx} style={styles.solutionRow}>
            <Text style={styles.solutionLabel}>{headers[idx]} =</Text>
            {display.type === 'image' ? (
              <Image src={display.value} style={styles.solutionImage} />
            ) : (
              <Text style={styles.solutionValue}>{display.value}</Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

interface PDFDocumentProps {
  title: string;
  method: string;
  steps: Step[];
  solution: Cell[] | null;
  hasNoSolution: boolean;
  hasInfiniteSolutions: boolean;
  headers: string[];
  dimensions: { rows: number; cols: number };
  initialMatrix?: Cell[][];
  date?: string;
}

/**
 * PDF Document component using @react-pdf/renderer
 * Renders step-by-step solution matrices and final answer
 */
export function PDFDocument({
  title,
  method,
  steps,
  solution,
  hasNoSolution,
  hasInfiniteSolutions,
  headers,
  dimensions,
  initialMatrix,
  date = new Date().toLocaleDateString(),
}: PDFDocumentProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <Text style={styles.title}>{title}</Text>
        <Text style={{ textAlign: 'center', fontSize: 11, marginBottom: 20 }}>
          Solved with {method}
        </Text>

        {/* Initial Matrix Section */}
        {initialMatrix && initialMatrix.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Initial Matrix</Text>
            <MatrixDisplay matrix={initialMatrix} headers={headers} />
          </View>
        )}

        {/* Steps Section */}
        {steps.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Solution Steps</Text>
            {steps.map((step, idx) => (
              <View key={idx}>
                <Text style={styles.subsectionTitle}>
                  Step {idx + 1}: {step.phase}
                </Text>
                <Text style={styles.operationLabel}>{step.operationLabel}</Text>
                <MatrixDisplay matrix={step.matrixAfter} headers={headers} />
              </View>
            ))}
          </View>
        )}

        {/* Solution Section */}
        {!hasNoSolution && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Final Solution</Text>

            {hasInfiniteSolutions && (
              <View style={styles.warning}>
                <Text style={styles.warningText}>
                  ⚠ This system has infinitely many solutions
                </Text>
              </View>
            )}

            <SolutionDisplay solution={solution} headers={headers} />
          </View>
        )}

        {/* No Solution Case */}
        {hasNoSolution && (
          <View style={styles.section}>
            <View style={styles.warning}>
              <Text style={styles.warningText}>
                ⚠ This system has no solution (inconsistent)
              </Text>
            </View>
          </View>
        )}

        {/* Metadata Footer */}
        <View style={styles.metadata}>
          <View style={styles.metadataRow}>
            <Text>Method: {method}</Text>
          </View>
          <View style={styles.metadataRow}>
            <Text>
              Dimensions: {dimensions.rows}×{dimensions.cols}
            </Text>
          </View>
          <View style={styles.metadataRow}>
            <Text>Date: {date}</Text>
          </View>
          <View style={styles.metadataRow}>
            <Text>Generated by Linear Systems Solver</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
