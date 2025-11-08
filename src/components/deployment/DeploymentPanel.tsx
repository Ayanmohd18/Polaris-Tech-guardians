import React, { useState, useEffect } from 'react';
import apiClient from '../../services/api/apiClient';

interface Deployment {
  id: string;
  name: string;
  platform: 'vercel' | 'netlify' | 'railway' | 'aws';
  status: 'deploying' | 'completed' | 'failed';
  url?: string;
  createdAt: string;
  logs: string[];
}

interface ProjectConfig {
  name: string;
  framework: 'react' | 'nextjs' | 'vue' | 'svelte' | 'vanilla';
  buildCommand: string;
  outputDirectory: string;
  environmentVariables: { [key: string]: string };
}

export const DeploymentPanel: React.FC = () => {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [projectConfig, setProjectConfig] = useState<ProjectConfig>({
    name: 'my-nexus-project',
    framework: 'react',
    buildCommand: 'npm run build',
    outputDirectory: 'dist',
    environmentVariables: {}
  });
  const [isDeploying, setIsDeploying] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<'vercel' | 'netlify' | 'railway' | 'aws'>('vercel');
  const [envKey, setEnvKey] = useState('');
  const [envValue, setEnvValue] = useState('');

  useEffect(() => {
    loadDeployments();
  }, []);

  const loadDeployments = () => {
    const savedDeployments = localStorage.getItem('nexus_deployments');
    if (savedDeployments) {
      setDeployments(JSON.parse(savedDeployments));
    }
  };

  const saveDeployments = (newDeployments: Deployment[]) => {
    localStorage.setItem('nexus_deployments', JSON.stringify(newDeployments));
    setDeployments(newDeployments);
  };

  const deployProject = async () => {
    setIsDeploying(true);
    
    try {
      let result;
      const deploymentData = {
        ...projectConfig,
        platform: selectedPlatform
      };

      switch (selectedPlatform) {
        case 'vercel':
          result = await apiClient.deployToVercel(deploymentData);
          break;
        case 'netlify':
          result = await apiClient.deployToNetlify(deploymentData);
          break;
        default:
          throw new Error(`Platform ${selectedPlatform} not implemented yet`);
      }

      const newDeployment: Deployment = {
        id: result.deployment_id,
        name: projectConfig.name,
        platform: selectedPlatform,
        status: 'deploying',
        createdAt: new Date().toISOString(),
        logs: ['Deployment initiated...']
      };

      const updatedDeployments = [newDeployment, ...deployments];
      saveDeployments(updatedDeployments);

      // Poll for deployment status
      pollDeploymentStatus(result.deployment_id);

    } catch (error) {
      console.error('Deployment failed:', error);
      alert('Deployment failed. Please check your configuration.');
    } finally {
      setIsDeploying(false);
    }
  };

  const pollDeploymentStatus = async (deploymentId: string) => {
    const maxAttempts = 30;
    let attempts = 0;

    const poll = async () => {
      try {
        const status = await apiClient.getDeploymentStatus(deploymentId);
        
        setDeployments(prev => prev.map(dep => 
          dep.id === deploymentId 
            ? { 
                ...dep, 
                status: status.status,
                url: status.url,
                logs: [...dep.logs, `Status: ${status.status}`]
              }
            : dep
        ));

        if (status.status === 'completed' || status.status === 'failed') {
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000);
        }
      } catch (error) {
        console.error('Failed to poll deployment status:', error);
      }
    };

    poll();
  };

  const addEnvironmentVariable = () => {
    if (envKey && envValue) {
      setProjectConfig(prev => ({
        ...prev,
        environmentVariables: {
          ...prev.environmentVariables,
          [envKey]: envValue
        }
      }));
      setEnvKey('');
      setEnvValue('');
    }
  };

  const removeEnvironmentVariable = (key: string) => {
    setProjectConfig(prev => {
      const newEnvVars = { ...prev.environmentVariables };
      delete newEnvVars[key];
      return {
        ...prev,
        environmentVariables: newEnvVars
      };
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'deploying': return '#ffaa00';
      case 'completed': return '#4CAF50';
      case 'failed': return '#f44336';
      default: return '#666';
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'vercel': return '▲';
      case 'netlify': return '🌐';
      case 'railway': return '🚂';
      case 'aws': return '☁️';
      default: return '🚀';
    }
  };

  return (
    <div className="deployment-panel">
      <div className="deployment-header">
        <h2>🚀 Deployment Center</h2>
        <p>Deploy your projects to multiple platforms with one click</p>
      </div>

      <div className="deployment-config">
        <div className="config-section">
          <h3>Project Configuration</h3>
          
          <div className="form-group">
            <label>Project Name</label>
            <input
              type="text"
              value={projectConfig.name}
              onChange={(e) => setProjectConfig(prev => ({ ...prev, name: e.target.value }))}
              placeholder="my-awesome-project"
            />
          </div>

          <div className="form-group">
            <label>Framework</label>
            <select
              value={projectConfig.framework}
              onChange={(e) => setProjectConfig(prev => ({ ...prev, framework: e.target.value as any }))}
            >
              <option value="react">React</option>
              <option value="nextjs">Next.js</option>
              <option value="vue">Vue.js</option>
              <option value="svelte">Svelte</option>
              <option value="vanilla">Vanilla JS</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Build Command</label>
              <input
                type="text"
                value={projectConfig.buildCommand}
                onChange={(e) => setProjectConfig(prev => ({ ...prev, buildCommand: e.target.value }))}
                placeholder="npm run build"
              />
            </div>
            <div className="form-group">
              <label>Output Directory</label>
              <input
                type="text"
                value={projectConfig.outputDirectory}
                onChange={(e) => setProjectConfig(prev => ({ ...prev, outputDirectory: e.target.value }))}
                placeholder="dist"
              />
            </div>
          </div>
        </div>

        <div className="config-section">
          <h3>Environment Variables</h3>
          
          <div className="env-vars">
            {Object.entries(projectConfig.environmentVariables).map(([key, value]) => (
              <div key={key} className="env-var">
                <span className="env-key">{key}</span>
                <span className="env-value">{value}</span>
                <button 
                  onClick={() => removeEnvironmentVariable(key)}
                  className="remove-btn"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="add-env-var">
            <input
              type="text"
              placeholder="Key"
              value={envKey}
              onChange={(e) => setEnvKey(e.target.value)}
            />
            <input
              type="text"
              placeholder="Value"
              value={envValue}
              onChange={(e) => setEnvValue(e.target.value)}
            />
            <button onClick={addEnvironmentVariable}>Add</button>
          </div>
        </div>

        <div className="config-section">
          <h3>Deployment Platform</h3>
          
          <div className="platform-selector">
            {(['vercel', 'netlify', 'railway', 'aws'] as const).map(platform => (
              <button
                key={platform}
                className={`platform-btn ${selectedPlatform === platform ? 'selected' : ''}`}
                onClick={() => setSelectedPlatform(platform)}
              >
                <span className="platform-icon">{getPlatformIcon(platform)}</span>
                <span className="platform-name">{platform}</span>
              </button>
            ))}
          </div>

          <button 
            onClick={deployProject}
            disabled={isDeploying}
            className="deploy-btn"
          >
            {isDeploying ? 'Deploying...' : `Deploy to ${selectedPlatform}`}
          </button>
        </div>
      </div>

      <div className="deployments-list">
        <h3>Recent Deployments ({deployments.length})</h3>
        
        {deployments.length === 0 ? (
          <div className="empty-state">
            <p>No deployments yet. Deploy your first project above!</p>
          </div>
        ) : (
          <div className="deployments">
            {deployments.map(deployment => (
              <div key={deployment.id} className="deployment-item">
                <div className="deployment-info">
                  <div className="deployment-header-info">
                    <span className="deployment-name">{deployment.name}</span>
                    <span className="deployment-platform">
                      {getPlatformIcon(deployment.platform)} {deployment.platform}
                    </span>
                    <span 
                      className="deployment-status"
                      style={{ color: getStatusColor(deployment.status) }}
                    >
                      {deployment.status}
                    </span>
                  </div>
                  
                  <div className="deployment-details">
                    <span className="deployment-time">
                      {new Date(deployment.createdAt).toLocaleString()}
                    </span>
                    {deployment.url && (
                      <a 
                        href={deployment.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="deployment-url"
                      >
                        Visit Site →
                      </a>
                    )}
                  </div>
                </div>

                <div className="deployment-logs">
                  <details>
                    <summary>View Logs</summary>
                    <div className="logs-content">
                      {deployment.logs.map((log, index) => (
                        <div key={index} className="log-line">
                          {log}
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .deployment-panel {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
          color: #c9d1d9;
        }

        .deployment-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .deployment-header h2 {
          color: white;
          margin-bottom: 10px;
        }

        .deployment-config {
          background: #161b22;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 30px;
        }

        .config-section {
          margin-bottom: 25px;
        }

        .config-section h3 {
          color: white;
          margin-bottom: 15px;
        }

        .form-group {
          margin-bottom: 15px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }

        .form-group label {
          display: block;
          margin-bottom: 5px;
          color: #8b949e;
          font-weight: 600;
        }

        .form-group input,
        .form-group select {
          width: 100%;
          padding: 10px;
          background: #0d1117;
          border: 1px solid #30363d;
          border-radius: 6px;
          color: #c9d1d9;
          font-size: 14px;
        }

        .env-vars {
          margin-bottom: 15px;
        }

        .env-var {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px;
          background: #0d1117;
          border-radius: 6px;
          margin-bottom: 5px;
        }

        .env-key {
          font-weight: bold;
          color: #4CAF50;
        }

        .env-value {
          flex: 1;
          color: #c9d1d9;
        }

        .remove-btn {
          background: #f85149;
          color: white;
          border: none;
          border-radius: 4px;
          width: 24px;
          height: 24px;
          cursor: pointer;
        }

        .add-env-var {
          display: flex;
          gap: 10px;
        }

        .add-env-var input {
          flex: 1;
          padding: 8px;
          background: #0d1117;
          border: 1px solid #30363d;
          border-radius: 6px;
          color: #c9d1d9;
        }

        .add-env-var button {
          padding: 8px 16px;
          background: #238636;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }

        .platform-selector {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 10px;
          margin-bottom: 20px;
        }

        .platform-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 15px;
          background: #21262d;
          border: 2px solid #30363d;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .platform-btn.selected {
          border-color: #4CAF50;
          background: #0d1117;
        }

        .platform-icon {
          font-size: 24px;
        }

        .platform-name {
          color: #c9d1d9;
          font-weight: 600;
          text-transform: capitalize;
        }

        .deploy-btn {
          width: 100%;
          padding: 15px;
          background: #238636;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          transition: background 0.2s;
        }

        .deploy-btn:hover:not(:disabled) {
          background: #2ea043;
        }

        .deploy-btn:disabled {
          background: #656d76;
          cursor: not-allowed;
        }

        .deployments-list {
          background: #161b22;
          border-radius: 12px;
          padding: 20px;
        }

        .deployments-list h3 {
          color: white;
          margin-bottom: 20px;
        }

        .empty-state {
          text-align: center;
          padding: 40px;
          color: #8b949e;
        }

        .deployment-item {
          background: #0d1117;
          border: 1px solid #30363d;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 15px;
        }

        .deployment-header-info {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 10px;
        }

        .deployment-name {
          font-weight: bold;
          color: white;
        }

        .deployment-platform {
          background: #21262d;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
        }

        .deployment-status {
          font-weight: bold;
          text-transform: uppercase;
          font-size: 12px;
        }

        .deployment-details {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .deployment-time {
          color: #8b949e;
          font-size: 14px;
        }

        .deployment-url {
          color: #4CAF50;
          text-decoration: none;
          font-weight: 600;
        }

        .deployment-url:hover {
          text-decoration: underline;
        }

        .deployment-logs details {
          margin-top: 10px;
        }

        .deployment-logs summary {
          cursor: pointer;
          color: #8b949e;
          font-size: 14px;
        }

        .logs-content {
          background: #010409;
          border-radius: 6px;
          padding: 10px;
          margin-top: 10px;
          max-height: 200px;
          overflow-y: auto;
        }

        .log-line {
          font-family: monospace;
          font-size: 12px;
          color: #c9d1d9;
          margin-bottom: 2px;
        }
      `}</style>
    </div>
  );
};