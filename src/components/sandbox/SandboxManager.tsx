import React, { useState } from 'react';
import { ContainerManager } from '../../services/sandbox/containerManager';
import { LivePreviewManager } from '../../services/preview/livePreview';

export const SandboxManager: React.FC = () => {
  const [sandboxes, setSandboxes] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<'react' | 'node' | 'python' | 'nextjs' | 'vite'>('react');
  const [isCreating, setIsCreating] = useState(false);
  const [activeSandbox, setActiveSandbox] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [terminal, setTerminal] = useState('');

  const containerManager = new ContainerManager();
  const previewManager = new LivePreviewManager();

  const createSandbox = async () => {
    setIsCreating(true);
    
    try {
      const sandboxId = await containerManager.createSandbox({
        template: selectedTemplate,
        packages: [],
        env: {}
      });

      const newSandbox = containerManager.getSandbox(sandboxId);
      setSandboxes(prev => [...prev, newSandbox]);
      setActiveSandbox(sandboxId);

      const url = await previewManager.createPreview(sandboxId);
      setPreviewUrl(url);
    } catch (error) {
      console.error('Failed to create sandbox:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const runCommand = async (command: string) => {
    if (!activeSandbox) return;
    
    const output = await containerManager.executeCommand(activeSandbox, command);
    setTerminal(prev => `${prev}\n$ ${command}\n${output}`);
  };

  return (
    <div className="sandbox-manager">
      <div className="sandbox-header">
        <h2>⚡ Instant Sandbox</h2>
        <div className="template-selector">
          <select 
            value={selectedTemplate} 
            onChange={(e) => setSelectedTemplate(e.target.value as any)}
          >
            <option value="react">React</option>
            <option value="nextjs">Next.js</option>
            <option value="vite">Vite</option>
            <option value="node">Node.js</option>
            <option value="python">Python</option>
          </select>
          <button onClick={createSandbox} disabled={isCreating}>
            {isCreating ? '🔄 Creating...' : '🚀 Create Sandbox'}
          </button>
        </div>
      </div>

      <div className="sandbox-grid">
        <div className="sandbox-list">
          <h3>Active Sandboxes ({sandboxes.length})</h3>
          {sandboxes.map(sandbox => (
            <div 
              key={sandbox.id} 
              className={`sandbox-item ${activeSandbox === sandbox.id ? 'active' : ''}`}
              onClick={() => setActiveSandbox(sandbox.id)}
            >
              <div className="sandbox-info">
                <div className="sandbox-name">{sandbox.template}</div>
                <div className={`sandbox-status ${sandbox.status}`}>{sandbox.status}</div>
              </div>
              <div className="sandbox-url">
                <a href={sandbox.url} target="_blank" rel="noopener noreferrer">
                  {sandbox.url}
                </a>
              </div>
            </div>
          ))}
        </div>

        <div className="sandbox-workspace">
          {activeSandbox && (
            <>
              <div className="preview-section">
                <h4>Live Preview</h4>
                <iframe 
                  src={previewUrl} 
                  className="preview-frame"
                  title="Live Preview"
                />
              </div>

              <div className="terminal-section">
                <h4>Terminal</h4>
                <div className="terminal">
                  <pre>{terminal}</pre>
                </div>
                <input
                  type="text"
                  placeholder="Enter command..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      runCommand(e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
              </div>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .sandbox-manager {
          padding: 20px;
          background: #1a1a1a;
          border-radius: 12px;
          color: #c9d1d9;
          height: 100vh;
        }

        .sandbox-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .template-selector {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .template-selector select {
          padding: 8px;
          background: #2a2a2a;
          border: 1px solid #444;
          color: #c9d1d9;
          border-radius: 4px;
        }

        .template-selector button {
          padding: 8px 16px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
        }

        .sandbox-grid {
          display: grid;
          grid-template-columns: 300px 1fr;
          gap: 20px;
          height: calc(100vh - 120px);
        }

        .sandbox-item {
          background: #1a1a1a;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 8px;
          cursor: pointer;
          border: 2px solid transparent;
        }

        .sandbox-item.active {
          border-color: #4CAF50;
        }

        .sandbox-status.running {
          background: #28a745;
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 12px;
        }

        .preview-frame {
          width: 100%;
          height: 400px;
          border: none;
          border-radius: 4px;
          background: white;
        }

        .terminal {
          background: #1a1a1a;
          padding: 12px;
          border-radius: 4px;
          height: 200px;
          overflow-y: auto;
          font-family: monospace;
          font-size: 12px;
        }

        input {
          width: 100%;
          background: #1a1a1a;
          border: 1px solid #444;
          color: #c9d1d9;
          padding: 8px;
          border-radius: 4px;
          font-family: monospace;
        }
      `}</style>
    </div>
  );
};