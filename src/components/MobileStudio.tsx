import React, { useState } from 'react';
import mobileAppGenerator from '../services/mobileEngine/mobileAppGenerator';

interface GeneratedApp {
  id: string;
  config: any;
  files: { [key: string]: string };
  dependencies: string[];
  buildCommands: string[];
  deploymentConfig: any;
  preview: string;
}

export default function MobileStudio() {
  const [prompt, setPrompt] = useState('');
  const [generatedApp, setGeneratedApp] = useState<GeneratedApp | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [buildStatus, setBuildStatus] = useState<string>('');

  const examples = [
    "Create a social media app like Instagram with photo sharing, stories, and messaging for iOS and Android",
    "Build an e-commerce app with product catalog, shopping cart, payments, and order tracking",
    "Make a fitness tracking app with workout logging, progress charts, and goal setting",
    "Create a food delivery app with restaurant listings, menu browsing, cart, and real-time tracking",
    "Build a productivity app with task management, calendar integration, and team collaboration",
    "Make a music streaming app with playlists, recommendations, and offline playback",
    "Create a travel booking app with flight search, hotel reservations, and itinerary management",
    "Build a banking app with account management, transactions, budgets, and financial analytics",
    "Make an education app with courses, quizzes, progress tracking, and certificates",
    "Create a dating app with profiles, matching algorithm, chat, and location-based discovery"
  ];

  const handleGenerate = async () => {
    try {
      const sanitizedPrompt = prompt.trim().replace(/<script[^>]*>.*?<\/script>/gi, '').replace(/[<>"']/g, '');
      
      if (!sanitizedPrompt || sanitizedPrompt.length < 10) {
        alert('Please provide a more detailed description (at least 10 characters)');
        return;
      }
      
      if (sanitizedPrompt.length > 5000) {
        alert('Description is too long (max 5000 characters)');
        return;
      }
    
      setIsGenerating(true);
      
      const app = await mobileAppGenerator.generateApp(sanitizedPrompt);
      
      if (!app || !app.files || Object.keys(app.files).length === 0) {
        throw new Error('Failed to generate app files');
      }
      
      setGeneratedApp(app);
      setSelectedFile(Object.keys(app.files)[0]);
    } catch (error) {
      console.error('Generation failed:', error);
      alert(`Generation failed: ${error.message || 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBuild = async () => {
    if (!generatedApp) return;
    
    setBuildStatus('Building...');
    try {
      await mobileAppGenerator.buildApp(generatedApp.id);
      setBuildStatus('Build completed successfully!');
    } catch (error) {
      setBuildStatus('Build failed');
    }
  };

  const handleDeploy = async (platform: 'ios' | 'android' | 'web') => {
    if (!generatedApp) return;
    
    setBuildStatus(`Deploying to ${platform}...`);
    try {
      const url = await mobileAppGenerator.deployApp(generatedApp.id, platform);
      setBuildStatus(`Deployed to ${platform}: ${url}`);
    } catch (error) {
      setBuildStatus(`Deployment to ${platform} failed`);
    }
  };

  const downloadProject = () => {
    try {
      if (!generatedApp || !generatedApp.files) {
        alert('No project to download');
        return;
      }
      
      // Sanitize filename
      const sanitizedName = (generatedApp.config?.name || 'project')
        .replace(/[^a-zA-Z0-9-_]/g, '')
        .substring(0, 50);
      
      const projectData = {
        ...generatedApp,
        files: Object.fromEntries(
          Object.entries(generatedApp.files).map(([key, value]) => [
            key.replace(/[<>"']/g, ''),
            typeof value === 'string' ? value.replace(/<script[^>]*>.*?<\/script>/gi, '') : value
          ])
        )
      };
      
      const zip = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(zip);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${sanitizedName}-project.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download project');
    }
  };

  return (
    <div className="mobile-studio">
      <div className="studio-header">
        <h2>📱 Mobile App Studio</h2>
        <p>Generate complete cross-platform mobile applications from natural language prompts</p>
      </div>

      <div className="prompt-section">
        <div className="prompt-input">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the mobile app you want to build... (e.g., 'Create a social media app with photo sharing and messaging for iOS and Android')"
            rows={4}
          />
          <button 
            onClick={handleGenerate} 
            disabled={isGenerating || !prompt.trim()}
            className="generate-btn"
          >
            {isGenerating ? 'Generating App...' : 'Generate Mobile App'}
          </button>
        </div>

        <div className="examples">
          <h4>Example Prompts:</h4>
          <div className="example-grid">
            {examples.map((example, index) => (
              <div 
                key={index} 
                className="example-card"
                onClick={() => setPrompt(example)}
              >
                {example}
              </div>
            ))}
          </div>
        </div>
      </div>

      {generatedApp && (
        <div className="app-workspace">
          <div className="app-info">
            <div className="app-preview" dangerouslySetInnerHTML={{ __html: generatedApp.preview }} />
            
            <div className="app-actions">
              <button onClick={handleBuild} className="build-btn">
                🔨 Build App
              </button>
              <button onClick={() => handleDeploy('ios')} className="deploy-btn">
                📱 Deploy iOS
              </button>
              <button onClick={() => handleDeploy('android')} className="deploy-btn">
                🤖 Deploy Android
              </button>
              <button onClick={() => handleDeploy('web')} className="deploy-btn">
                🌐 Deploy Web
              </button>
              <button onClick={downloadProject} className="download-btn">
                💾 Download Project
              </button>
            </div>

            {buildStatus && (
              <div className="build-status">
                <p>{buildStatus}</p>
              </div>
            )}
          </div>

          <div className="code-workspace">
            <div className="file-explorer">
              <h4>Project Files</h4>
              <div className="file-tree">
                {Object.keys(generatedApp.files).map(filePath => (
                  <div 
                    key={filePath}
                    className={`file-item ${selectedFile === filePath ? 'selected' : ''}`}
                    onClick={() => setSelectedFile(filePath)}
                  >
                    📄 {filePath}
                  </div>
                ))}
              </div>
            </div>

            <div className="code-editor">
              <div className="editor-header">
                <span>{selectedFile}</span>
              </div>
              <pre className="code-content">
                {selectedFile ? generatedApp.files[selectedFile] : 'Select a file to view'}
              </pre>
            </div>
          </div>

          <div className="project-details">
            <div className="dependencies">
              <h4>Dependencies</h4>
              <ul>
                {generatedApp.dependencies.map((dep, index) => (
                  <li key={index}>{dep}</li>
                ))}
              </ul>
            </div>

            <div className="build-commands">
              <h4>Build Commands</h4>
              <ul>
                {generatedApp.buildCommands.map((cmd, index) => (
                  <li key={index}><code>{cmd}</code></li>
                ))}
              </ul>
            </div>

            <div className="deployment-config">
              <h4>Deployment Configuration</h4>
              <pre>{JSON.stringify(generatedApp.deploymentConfig, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .mobile-studio {
          padding: 20px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .studio-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .studio-header h2 {
          color: #333;
          margin-bottom: 10px;
        }

        .prompt-section {
          margin-bottom: 30px;
        }

        .prompt-input {
          display: flex;
          gap: 15px;
          margin-bottom: 20px;
        }

        .prompt-input textarea {
          flex: 1;
          padding: 15px;
          border: 2px solid #ddd;
          border-radius: 8px;
          font-size: 16px;
          resize: vertical;
        }

        .generate-btn {
          padding: 15px 25px;
          background: #007AFF;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 16px;
          white-space: nowrap;
        }

        .generate-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .examples h4 {
          margin-bottom: 15px;
          color: #666;
        }

        .example-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 10px;
        }

        .example-card {
          padding: 12px;
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }

        .example-card:hover {
          background: #e9ecef;
          border-color: #007AFF;
        }

        .app-workspace {
          display: grid;
          grid-template-columns: 300px 1fr 250px;
          gap: 20px;
          margin-top: 30px;
        }

        .app-info {
          background: white;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 20px;
        }

        .app-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 20px;
        }

        .build-btn, .deploy-btn, .download-btn {
          padding: 10px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
        }

        .build-btn {
          background: #28a745;
          color: white;
        }

        .deploy-btn {
          background: #007AFF;
          color: white;
        }

        .download-btn {
          background: #6c757d;
          color: white;
        }

        .build-status {
          margin-top: 15px;
          padding: 10px;
          background: #f8f9fa;
          border-radius: 6px;
          font-size: 14px;
        }

        .code-workspace {
          display: grid;
          grid-template-columns: 200px 1fr;
          gap: 15px;
        }

        .file-explorer {
          background: white;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 15px;
        }

        .file-explorer h4 {
          margin-bottom: 15px;
          color: #333;
        }

        .file-tree {
          max-height: 400px;
          overflow-y: auto;
        }

        .file-item {
          padding: 8px;
          cursor: pointer;
          border-radius: 4px;
          font-size: 14px;
          margin-bottom: 2px;
        }

        .file-item:hover {
          background: #f8f9fa;
        }

        .file-item.selected {
          background: #007AFF;
          color: white;
        }

        .code-editor {
          background: white;
          border: 1px solid #ddd;
          border-radius: 8px;
          overflow: hidden;
        }

        .editor-header {
          background: #f8f9fa;
          padding: 10px 15px;
          border-bottom: 1px solid #ddd;
          font-weight: 600;
        }

        .code-content {
          padding: 15px;
          margin: 0;
          background: #f8f8f8;
          font-family: 'Monaco', 'Consolas', monospace;
          font-size: 12px;
          line-height: 1.5;
          max-height: 500px;
          overflow: auto;
        }

        .project-details {
          background: white;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 15px;
        }

        .project-details h4 {
          margin-bottom: 10px;
          color: #333;
        }

        .project-details ul {
          list-style: none;
          padding: 0;
          margin-bottom: 20px;
        }

        .project-details li {
          padding: 5px 0;
          font-size: 14px;
        }

        .project-details code {
          background: #f8f9fa;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 12px;
        }

        .project-details pre {
          background: #f8f8f8;
          padding: 10px;
          border-radius: 4px;
          font-size: 12px;
          overflow-x: auto;
        }
      `}</style>
    </div>
  );
}