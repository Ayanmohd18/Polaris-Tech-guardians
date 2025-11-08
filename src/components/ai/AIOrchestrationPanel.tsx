import React, { useState, useEffect } from 'react';
import { AIOrchestrator } from '../../services/ai/orchestratorClient';

interface AITask {
  id: string;
  type: 'collaborative' | 'consensus' | 'specialized';
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

export const AIOrchestrationPanel: React.FC = () => {
  const [orchestrator] = useState(new AIOrchestrator());
  const [tasks, setTasks] = useState<AITask[]>([]);
  const [prompt, setPrompt] = useState('');
  const [selectedTask, setSelectedTask] = useState<'architect' | 'coder' | 'reviewer' | 'explainer' | 'debugger' | 'optimizer'>('coder');
  const [isProcessing, setIsProcessing] = useState(false);
  const [modelRoles, setModelRoles] = useState<any>({});

  useEffect(() => {
    loadModelRoles();
  }, []);

  const loadModelRoles = async () => {
    try {
      const roles = await orchestrator.getModelRoles();
      setModelRoles(roles);
    } catch (error) {
      console.error('Failed to load model roles:', error);
    }
  };

  const runCollaborativeGeneration = async () => {
    if (!prompt.trim()) return;

    const taskId = `collab_${Date.now()}`;
    const newTask: AITask = {
      id: taskId,
      type: 'collaborative',
      status: 'running'
    };

    setTasks(prev => [...prev, newTask]);
    setIsProcessing(true);

    try {
      const result = await orchestrator.collaborativeCodeGeneration({
        prompt,
        userId: 'user123',
        context: { source: 'orchestration_panel' }
      });

      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, status: 'completed', result }
          : task
      ));
    } catch (error) {
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, status: 'failed', error: error.message }
          : task
      ));
    } finally {
      setIsProcessing(false);
    }
  };

  const runSpecializedTask = async () => {
    if (!prompt.trim()) return;

    const taskId = `spec_${Date.now()}`;
    const newTask: AITask = {
      id: taskId,
      type: 'specialized',
      status: 'running'
    };

    setTasks(prev => [...prev, newTask]);
    setIsProcessing(true);

    try {
      const result = await orchestrator.specializedTask({
        taskType: selectedTask,
        prompt,
        userId: 'user123'
      });

      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, status: 'completed', result }
          : task
      ));
    } catch (error) {
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, status: 'failed', error: error.message }
          : task
      ));
    } finally {
      setIsProcessing(false);
    }
  };

  const runConsensusDecision = async () => {
    const question = "Which approach is better for this implementation?";
    const options = ["Approach A: Microservices", "Approach B: Monolith", "Approach C: Hybrid"];

    const taskId = `consensus_${Date.now()}`;
    const newTask: AITask = {
      id: taskId,
      type: 'consensus',
      status: 'running'
    };

    setTasks(prev => [...prev, newTask]);
    setIsProcessing(true);

    try {
      const result = await orchestrator.getConsensus({ question, options });

      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, status: 'completed', result }
          : task
      ));
    } catch (error) {
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, status: 'failed', error: error.message }
          : task
      ));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="ai-orchestration-panel">
      <div className="panel-header">
        <h2>🧠 AI Orchestration</h2>
        <div className="model-status">
          {Object.entries(modelRoles.model_roles || {}).map(([role, model]) => (
            <div key={role} className="model-indicator">
              <span className="role">{role}</span>
              <span className="model">{model}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="control-panel">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your prompt for AI processing..."
          className="prompt-input"
          rows={4}
        />

        <div className="action-buttons">
          <button 
            onClick={runCollaborativeGeneration}
            disabled={isProcessing || !prompt.trim()}
            className="action-btn collaborative"
          >
            🤝 Collaborative Generation
          </button>

          <div className="specialized-section">
            <select 
              value={selectedTask} 
              onChange={(e) => setSelectedTask(e.target.value as any)}
              className="task-selector"
            >
              <option value="architect">🏗️ Architect</option>
              <option value="coder">💻 Coder</option>
              <option value="reviewer">🔍 Reviewer</option>
              <option value="explainer">📚 Explainer</option>
              <option value="debugger">🐛 Debugger</option>
              <option value="optimizer">⚡ Optimizer</option>
            </select>
            
            <button 
              onClick={runSpecializedTask}
              disabled={isProcessing || !prompt.trim()}
              className="action-btn specialized"
            >
              Run {selectedTask}
            </button>
          </div>

          <button 
            onClick={runConsensusDecision}
            disabled={isProcessing}
            className="action-btn consensus"
          >
            🎯 Get Consensus
          </button>

          <button onClick={() => setTasks([])} className="clear-btn">
            Clear Results
          </button>
        </div>
      </div>

      <div className="results-section">
        <h3>AI Processing Results ({tasks.length})</h3>
        {tasks.map(task => (
          <div key={task.id} className={`task-result ${task.status}`}>
            <div className="task-header">
              <span className="task-type">{task.type}</span>
              <span className={`status ${task.status}`}>{task.status}</span>
            </div>
            
            {task.status === 'completed' && task.result && (
              <div className="task-content">
                {task.type === 'collaborative' && (
                  <div className="collaborative-result">
                    <div className="section">
                      <h4>Generated Code</h4>
                      <pre><code>{task.result.code}</code></pre>
                    </div>
                    <div className="section">
                      <h4>Documentation</h4>
                      <div className="documentation">{task.result.documentation}</div>
                    </div>
                  </div>
                )}
                
                {task.type === 'specialized' && (
                  <div className="specialized-result">
                    <div className="model-used">Model: {task.result.model}</div>
                    <pre><code>{task.result.result}</code></pre>
                  </div>
                )}
                
                {task.type === 'consensus' && (
                  <div className="consensus-result">
                    <div className="consensus-choice">
                      <strong>Consensus: {task.result.consensus}</strong>
                      <span className="confidence">Confidence: {Math.round(task.result.confidence * 100)}%</span>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {task.status === 'failed' && (
              <div className="error-content">
                Error: {task.error}
              </div>
            )}
          </div>
        ))}
      </div>

      <style jsx>{`
        .ai-orchestration-panel {
          padding: 20px;
          background: #1a1a1a;
          border-radius: 12px;
          color: #c9d1d9;
        }

        .panel-header h2 {
          margin: 0 0 10px 0;
          color: white;
        }

        .model-status {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }

        .model-indicator {
          background: #2d3748;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 12px;
        }

        .model-indicator .role {
          color: #4CAF50;
          margin-right: 4px;
        }

        .control-panel {
          background: #2a2a2a;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .prompt-input {
          width: 100%;
          background: #1a1a1a;
          border: 1px solid #444;
          border-radius: 6px;
          padding: 12px;
          color: #c9d1d9;
          font-family: monospace;
          resize: vertical;
          margin-bottom: 15px;
        }

        .action-buttons {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
        }

        .action-btn {
          padding: 10px 16px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: bold;
        }

        .action-btn.collaborative {
          background: #4CAF50;
          color: white;
        }

        .action-btn.specialized {
          background: #2196F3;
          color: white;
        }

        .action-btn.consensus {
          background: #FF9800;
          color: white;
        }

        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .specialized-section {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .task-selector {
          background: #1a1a1a;
          border: 1px solid #444;
          border-radius: 6px;
          padding: 8px;
          color: #c9d1d9;
        }

        .clear-btn {
          background: #666;
          color: white;
          border: none;
          padding: 10px 16px;
          border-radius: 6px;
          cursor: pointer;
          margin-left: auto;
        }

        .task-result {
          background: #2a2a2a;
          border-radius: 8px;
          margin-bottom: 15px;
          overflow: hidden;
        }

        .task-header {
          background: #333;
          padding: 10px 15px;
          display: flex;
          justify-content: space-between;
        }

        .status.running {
          background: #ffaa00;
          color: black;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
        }

        .status.completed {
          background: #4CAF50;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
        }

        .status.failed {
          background: #f44336;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
        }

        .task-content {
          padding: 15px;
        }

        .section h4 {
          color: #4CAF50;
          margin: 0 0 8px 0;
        }

        .section pre {
          background: #1a1a1a;
          padding: 10px;
          border-radius: 4px;
          overflow-x: auto;
          font-size: 12px;
        }

        .consensus-choice {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .confidence {
          background: #4CAF50;
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 12px;
        }

        .error-content {
          padding: 15px;
          color: #f44336;
        }

        .model-used {
          background: #333;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          margin-bottom: 10px;
          display: inline-block;
        }
      `}</style>
    </div>
  );
};