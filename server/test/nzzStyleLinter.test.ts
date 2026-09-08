import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { lintNZZStyle } from '../src/services/ai/nzzStyleLinter.js';

describe('NZZ Style Linter', () => {
  it('flags US straight and curly quotation marks and requires Swiss guillemets', () => {
    const straightQuotes = 'Der Bundesrat sagt: "Das ist nicht hinnehmbar".';
    const report1 = lintNZZStyle(straightQuotes);
    assert.equal(report1.hasErrors, true);
    assert.ok(report1.errors.includes('Use Swiss guillemets « » instead of US quotes'));

    const curlyQuotes = 'Die Kassen melden: “Defizite drohen”.';
    const report2 = lintNZZStyle(curlyQuotes);
    assert.equal(report2.hasErrors, true);
    assert.ok(report2.errors.includes('Use Swiss guillemets « » instead of US quotes'));
  });

  it('rejects headlines ending with terminal periods', () => {
    const report = lintNZZStyle('Die Krise spitzt sich zu.', { isHeadline: true });
    assert.equal(report.hasErrors, true);
    assert.ok(report.errors.includes('Headlines must not have a terminal period'));
  });

  it('warns when finite verbs are detected in subheads', () => {
    const report = lintNZZStyle('Maschinen ersetzen Arbeiter', { isSubhead: true, language: 'de' });
    assert.equal(report.hasWarnings, true);
    assert.ok(report.warnings.some(w => w.includes('Subheads should be noun/adjective phrases')));
  });

  it('flags sensationalist clickbait vocabulary', () => {
    const report = lintNZZStyle('Ein atemberaubend und shocking Durchbruch');
    assert.equal(report.hasErrors, true);
    assert.ok(report.errors.some(e => e.includes('Avoid sensationalist buzzword')));
  });

  it('passes completely compliant Swiss NZZ style text', () => {
    const cleanHeadline = 'Deutschlands Wohlfahrtsstaat vor dem Kollaps';
    const headlineReport = lintNZZStyle(cleanHeadline, { isHeadline: true });
    assert.equal(headlineReport.hasErrors, false);

    const cleanQuote = 'Der Bundesrat erklärte: «Die Reformen sind unverhandelbar».';
    const bodyReport = lintNZZStyle(cleanQuote);
    assert.equal(bodyReport.hasErrors, false);
  });
});

