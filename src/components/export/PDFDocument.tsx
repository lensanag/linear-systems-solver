import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { Step, Cell } from '@/engines/shared/types';

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 11,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  // ── Header ──
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 20,
    color: '#555555',
  },
  // ── Sections ──
  section: {
    marginTop: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
  },
  // ── Steps ──
  stepBlock: {
    marginTop: 8,
    marginBottom: 2,
  },
  stepTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  operationLabel: {
    fontSize: 9,
    fontStyle: 'italic',
    color: '#777777',
    marginBottom: 4,
  },
  // ── Matrix ──
  matrixWrap: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 6,
  },
  matrixBracket: {
    fontSize: 28,
    color: '#333333',
    // vertical padding so the bracket aligns with multi-row matrices
    paddingTop: 2,
  },
  matrixBody: {
    flexDirection: 'column',
    marginHorizontal: 2,
  },
  matrixRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Each cell has a fixed width so columns align perfectly
  cell: {
    width: 48,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    paddingVertical: 4,
  },
  cellText: {
    fontFamily: 'Courier',
    fontSize: 10,
    textAlign: 'center',
  },
  // ── Fraction inside a cell ──
  fraction: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fracNum: {
    fontFamily: 'Courier',
    fontSize: 9,
    textAlign: 'center',
  },
  fracBar: {
    height: 0.75,
    backgroundColor: '#000000',
    // width is set dynamically at render time
    marginVertical: 1.5,
    alignSelf: 'stretch',
  },
  fracDen: {
    fontFamily: 'Courier',
    fontSize: 9,
    textAlign: 'center',
  },
  // ── Solution box ──
  solutionBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f0f7f0',
  },
  solutionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
    minHeight: 26,
  },
  solutionLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    minWidth: 50,
  },
  solutionValue: {
    fontFamily: 'Courier',
    fontSize: 11,
  },
  // ── Warnings ──
  warning: {
    marginVertical: 6,
    padding: 8,
    backgroundColor: '#fff8e1',
    borderLeftWidth: 3,
    borderLeftColor: '#f9a825',
  },
  warningText: {
    fontSize: 10,
    color: '#7b5800',
  },
  // ── Footer ──
  footer: {
    marginTop: 20,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#dddddd',
    fontSize: 8,
    color: '#aaaaaa',
  },
  footerRow: {
    marginVertical: 1,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Cell rendering
// ─────────────────────────────────────────────────────────────────────────────

type CellDisplay =
  | { kind: 'integer'; value: string }
  | { kind: 'fraction'; num: number; den: number };

function resolveCell(cell: Cell): CellDisplay {
  // All cells are FractionCell — den === 1 means an integer
  if (cell.den === 1) return { kind: 'integer', value: String(cell.num) };
  return { kind: 'fraction', num: cell.num, den: cell.den };
}

/**
 * A native @react-pdf/renderer fraction: stacked numerator / bar / denominator.
 * No images, no html2canvas, no font-loading races — pure PDF primitives.
 */
function PDFFraction({ num, den }: { num: number; den: number }) {
  // Estimate bar width from digit count so it covers the wider of num/den
  const numLen = String(Math.abs(num)).length + (num < 0 ? 1 : 0);
  const denLen = String(den).length;
  const barWidth = Math.max(numLen, denLen) * 7 + 4;

  return (
    <View style={styles.fraction}>
      <Text style={styles.fracNum}>{num}</Text>
      <View style={[styles.fracBar, { width: barWidth }]} />
      <Text style={styles.fracDen}>{den}</Text>
    </View>
  );
}

function MatrixCell({ cell }: { cell: Cell }) {
  const d = resolveCell(cell);
  return (
    <View style={styles.cell}>
      {d.kind === 'fraction' ? (
        <PDFFraction num={d.num} den={d.den} />
      ) : (
        <Text style={styles.cellText}>{d.value}</Text>
      )}
    </View>
  );
}

function MatrixDisplay({ matrix }: { matrix: Cell[][] }) {
  if (!matrix || matrix.length === 0) return null;

  // Approximate bracket height from number of rows
  const bracketFontSize = Math.max(20, matrix.length * 18);

  return (
    <View style={styles.matrixWrap}>
      <Text style={[styles.matrixBracket, { fontSize: bracketFontSize }]}>[</Text>
      <View style={styles.matrixBody}>
        {matrix.map((row, ri) => (
          <View key={ri} style={styles.matrixRow}>
            {row.map((cell, ci) => (
              <MatrixCell key={`${ri}-${ci}`} cell={cell} />
            ))}
          </View>
        ))}
      </View>
      <Text style={[styles.matrixBracket, { fontSize: bracketFontSize }]}>]</Text>
    </View>
  );
}

function SolutionValue({ cell }: { cell: Cell }) {
  const d = resolveCell(cell);
  if (d.kind === 'fraction') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <PDFFraction num={d.num} den={d.den} />
      </View>
    );
  }
  return <Text style={styles.solutionValue}>{d.value}</Text>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main document
// ─────────────────────────────────────────────────────────────────────────────

export interface PDFDocumentProps {
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
        <Text style={styles.subtitle}>Method: {method}</Text>

        {/* Initial system matrix */}
        {initialMatrix && initialMatrix.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Initial System</Text>
            <MatrixDisplay matrix={initialMatrix} />
          </View>
        )}

        {/* Step-by-step matrices */}
        {steps.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Solution Steps</Text>
            {steps.map((step, idx) => (
              <View key={idx} style={styles.stepBlock}>
                <Text style={styles.stepTitle}>
                  Step {idx + 1}: {step.phase}
                </Text>
                {step.operationLabel ? (
                  <Text style={styles.operationLabel}>{step.operationLabel}</Text>
                ) : null}
                <MatrixDisplay matrix={step.matrixAfter} />
              </View>
            ))}
          </View>
        )}

        {/* Final solution */}
        {!hasNoSolution && solution !== null && solution.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Solution</Text>

            {hasInfiniteSolutions && (
              <View style={styles.warning}>
                <Text style={styles.warningText}>
                  This system has infinitely many solutions.
                </Text>
              </View>
            )}

            <View style={styles.solutionBox}>
              {solution.map((cell, idx) => (
                <View key={idx} style={styles.solutionRow}>
                  <Text style={styles.solutionLabel}>{headers[idx]} =</Text>
                  <SolutionValue cell={cell} />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* No-solution case */}
        {hasNoSolution && (
          <View style={[styles.section, styles.warning]}>
            <Text style={styles.warningText}>
              This system has no solution (inconsistent).
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerRow}>
            <Text>Method: {method}  |  Dimensions: {dimensions.rows}×{dimensions.cols}  |  Date: {date}</Text>
          </View>
          <View style={styles.footerRow}>
            <Text>Generated by Linear Systems Solver</Text>
          </View>
        </View>

      </Page>
    </Document>
  );
}
