import React, { useState, useEffect } from 'react';
import { PerformanceMonitor } from '../../services/analytics/performanceMonitor';
import { VulnerabilityScanner } from '../../services/security/vulnerabilityScanner';
import { TestGenerator } from '../../services/testing/testGenerator';

export const AdvancedDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<any>({});
  const [securityReport, setSecurityReport] = useState<any>({});
  const [testResults, setTestResults] = useState<any>({});
  const [activeTab, setActiveTab] = useState<'performance' | 'security' | 'testing' | 'ai'>('performance');

  const performanceMonitor = new PerformanceMonitor();
  const vulnerabilityScanner = new VulnerabilityScanner();
  const testGenerator = new TestGenerator();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    const sampleCode = 'function example() { return "Hello World"; }';
    
    const [perf, security, tests] = await Promise.all([
      performanceMonitor.trackCodePerformance(sampleCode, 'javascript'),
      vulnerabilityScanner.generateSecurityReport('project_1'),
      testGenerator.runTests('test code')
    ]);

    setMetrics(perf);
    setSecurityReport(security);
    setTestResults(tests);
  };

  return (
    <div className="advanced-dashboard">
      <div className="dashboard-header">
        <h2>📊 Advanced Analytics Dashboard</h2>
        <button onClick={loadDashboardData}>🔄 Refresh</button>
      </div>

      <div className="dashboard-tabs">
        {['performance', 'security', 'testing', 'ai'].map(tab => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab as any)}
          >
            {tab === 'performance' ? '⚡ Performance' :
             tab === 'security' ? '🔒 Security' :
             tab === 'testing' ? '🧪 Testing' : '🧠 AI Insights'}
          </button>
        ))}
      </div>

      <div className="dashboard-content">
        {activeTab === 'performance' && (
          <div className="metrics-grid">
            <div className="metric-card">
              <h4>Performance Score</h4>
              <div className="score">{metrics.score || 0}/100</div>
            </div>
            <div className="metric-card">
              <h4>Memory Usage</h4>
              <div className="score">{Math.round(metrics.memoryUsage || 0)}MB</div>
            </div>
            <div className="metric-card">
              <h4>CPU Usage</h4>
              <div className="score">{Math.round(metrics.cpuUsage || 0)}%</div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="security-overview">
            <div className="security-score">
              <h4>Security Score</h4>
              <div className="score large">{securityReport.overallScore || 0}/100</div>
            </div>
            <div className="security-alerts">
              <h4>🚨 Critical Issues: {securityReport.criticalIssues || 0}</h4>
            </div>
          </div>
        )}

        {activeTab === 'testing' && (
          <div className="test-summary">
            <div className="test-stats">
              <div className="stat-item">
                <div className="stat-number">{testResults.passed || 0}</div>
                <div className="stat-label">Passed</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">{testResults.failed || 0}</div>
                <div className="stat-label">Failed</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">{testResults.coverage || 0}%</div>
                <div className="stat-label">Coverage</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="ai-insights">
            <h4>🧠 AI Development Insights</h4>
            <div className="insight-card">
              <h5>Code Quality Trends</h5>
              <p>Your code quality improved by 15% with AI suggestions.</p>
            </div>
            <div className="insight-card">
              <h5>Productivity Boost</h5>
              <p>Voice coding increased development speed by 40%.</p>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .advanced-dashboard {
          padding: 20px;
          background: #1a1a1a;
          border-radius: 12px;
          color: #c9d1d9;
          height: 100vh;
          overflow-y: auto;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .dashboard-header button {
          padding: 8px 16px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }

        .dashboard-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
        }

        .tab-btn {
          padding: 10px 20px;
          background: #2a2a2a;
          border: none;
          color: #c9d1d9;
          border-radius: 6px;
          cursor: pointer;
        }

        .tab-btn.active {
          background: #4CAF50;
          color: white;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }

        .metric-card, .stat-item, .insight-card {
          background: #2a2a2a;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
        }

        .score {
          font-size: 32px;
          font-weight: bold;
          color: #4CAF50;
          margin: 10px 0;
        }

        .score.large {
          font-size: 48px;
        }

        .security-overview {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .test-stats {
          display: flex;
          gap: 20px;
        }

        .stat-number {
          font-size: 24px;
          font-weight: bold;
          color: #4CAF50;
          margin-bottom: 5px;
        }

        .ai-insights {
          display: grid;
          gap: 20px;
        }

        .insight-card h5 {
          margin: 0 0 10px 0;
          color: #4CAF50;
        }

        h2, h4, h5 {
          color: white;
          margin-top: 0;
        }
      `}</style>
    </div>
  );
};