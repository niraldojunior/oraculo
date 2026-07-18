export interface PerfMeasure {
  name: string;
  operation: string;
  startTime: number;
  endTime: number;
  duration: number;
  unit: 'ms';
  status: 'pass' | 'fail';
  slaThreshold: number;
  slaViolation: boolean;
  metadata?: Record<string, unknown>;
}

export class PerfTimer {
  private measures: PerfMeasure[] = [];

  measure(name: string, operation: string, duration: number, slaThreshold: number, metadata?: Record<string, unknown>): PerfMeasure {
    const slaViolation = duration > slaThreshold;
    const measure: PerfMeasure = {
      name,
      operation,
      startTime: 0,
      endTime: 0,
      duration,
      unit: 'ms',
      status: slaViolation ? 'fail' : 'pass',
      slaThreshold,
      slaViolation,
      metadata
    };
    this.measures.push(measure);
    return measure;
  }

  async trackAsync<T>(name: string, operation: string, fn: () => Promise<T>, slaThreshold: number, metadata?: Record<string, unknown>): Promise<{ result: T; measure: PerfMeasure }> {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    const duration = end - start;
    const measure = this.measure(name, operation, duration, slaThreshold, metadata);
    return { result, measure };
  }

  trackSync<T>(name: string, operation: string, fn: () => T, slaThreshold: number, metadata?: Record<string, unknown>): { result: T; measure: PerfMeasure } {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    const duration = end - start;
    const measure = this.measure(name, operation, duration, slaThreshold, metadata);
    return { result, measure };
  }

  getMeasures(): PerfMeasure[] {
    return [...this.measures];
  }

  getReport() {
    const passed = this.measures.filter(m => m.status === 'pass').length;
    const failed = this.measures.filter(m => m.status === 'fail').length;
    const avgDuration = this.measures.reduce((sum, m) => sum + m.duration, 0) / this.measures.length || 0;
    const maxDuration = Math.max(...this.measures.map(m => m.duration), 0);
    const minDuration = Math.min(...this.measures.map(m => m.duration), Infinity);

    return {
      summary: {
        total: this.measures.length,
        passed,
        failed,
        passRate: `${((passed / this.measures.length) * 100).toFixed(2)}%`
      },
      stats: {
        min: `${minDuration.toFixed(2)}ms`,
        max: `${maxDuration.toFixed(2)}ms`,
        avg: `${avgDuration.toFixed(2)}ms`
      },
      measures: this.measures,
      violations: this.measures.filter(m => m.slaViolation)
    };
  }

  printReport(): void {
    const report = this.getReport();
    console.log('\n=== PERFORMANCE REPORT ===');
    console.log(`Total: ${report.summary.total} | Passed: ${report.summary.passed} | Failed: ${report.summary.failed} (${report.summary.passRate})`);
    console.log(`Min: ${report.stats.min} | Avg: ${report.stats.avg} | Max: ${report.stats.max}`);

    if (report.violations.length > 0) {
      console.log(`\n⚠️  SLA Violations (${report.violations.length}):`);
      for (const v of report.violations) {
        console.log(`  - ${v.name}: ${v.duration.toFixed(2)}ms > ${v.slaThreshold}ms`);
      }
    }
  }
}

export async function concurrentRequests<T>(count: number, fn: () => Promise<T>): Promise<T[]> {
  return Promise.all(Array.from({ length: count }, () => fn()));
}
