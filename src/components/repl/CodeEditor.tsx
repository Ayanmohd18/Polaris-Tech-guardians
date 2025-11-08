import React, { useState, useRef, useEffect } from 'react';

interface File {
  id: string;
  name: string;
  content: string;
  language: string;
}

export const CodeEditor: React.FC = () => {
  const [files, setFiles] = useState<File[]>([
    { id: '1', name: 'main.py', content: '# Welcome to NEXUS PRO\nprint("Hello World")', language: 'python' }
  ]);
  const [activeFile, setActiveFile] = useState('1');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  const currentFile = files.find(f => f.id === activeFile);

  const updateFileContent = (content: string) => {
    setFiles(prev => prev.map(f => 
      f.id === activeFile ? { ...f, content } : f
    ));
  };

  const runCode = async () => {
    if (!currentFile) return;
    
    setIsRunning(true);
    setOutput('Running...');
    
    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: currentFile.content,
          language: currentFile.language
        })
      });
      
      const result = await response.json();
      setOutput(result.output || result.error || 'No output');
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const createNewFile = () => {
    const newFile: File = {
      id: Date.now().toString(),
      name: 'untitled.py',
      content: '',
      language: 'python'
    };
    setFiles(prev => [...prev, newFile]);
    setActiveFile(newFile.id);
  };

  return (
    <div className="code-editor">
      <div className="editor-header">
        <div className="file-tabs">
          {files.map(file => (
            <button
              key={file.id}
              className={`tab ${activeFile === file.id ? 'active' : ''}`}
              onClick={() => setActiveFile(file.id)}
            >
              {file.name}
            </button>
          ))}
          <button onClick={createNewFile} className="new-file-btn">+</button>
        </div>
        <div className="editor-actions">
          <button onClick={runCode} disabled={isRunning} className="run-btn">
            {isRunning ? '⏳' : '▶️'} Run
          </button>
        </div>
      </div>

      <div className="editor-content">
        <textarea
          ref={editorRef}
          value={currentFile?.content || ''}
          onChange={(e) => updateFileContent(e.target.value)}
          className="code-textarea"
          placeholder="Start coding..."
          spellCheck={false}
        />
      </div>

      <div className="output-panel">
        <h4>Output</h4>
        <pre className="output-content">{output}</pre>
      </div>

      <style jsx>{`
        .code-editor {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: #1a1a1a;
          color: #c9d1d9;
        }

        .editor-header {
          display: flex;
          justify-content: space-between;
          background: #2d3748;
          padding: 8px;
          border-bottom: 1px solid #444;
        }

        .file-tabs {
          display: flex;
          gap: 4px;
        }

        .tab {
          padding: 8px 16px;
          background: #1a1a1a;
          border: none;
          color: #c9d1d9;
          cursor: pointer;
          border-radius: 4px 4px 0 0;
        }

        .tab.active {
          background: #4CAF50;
          color: white;
        }

        .new-file-btn {
          padding: 8px 12px;
          background: #666;
          border: none;
          color: white;
          cursor: pointer;
          border-radius: 4px;
        }

        .run-btn {
          padding: 8px 16px;
          background: #4CAF50;
          border: none;
          color: white;
          cursor: pointer;
          border-radius: 4px;
          font-weight: bold;
        }

        .run-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .editor-content {
          flex: 1;
          padding: 0;
        }

        .code-textarea {
          width: 100%;
          height: 100%;
          background: #0d1117;
          border: none;
          color: #c9d1d9;
          font-family: 'Courier New', monospace;
          font-size: 14px;
          line-height: 1.5;
          padding: 16px;
          resize: none;
          outline: none;
        }

        .output-panel {
          height: 200px;
          background: #2a2a2a;
          border-top: 1px solid #444;
          padding: 12px;
        }

        .output-panel h4 {
          margin: 0 0 8px 0;
          color: #4CAF50;
        }

        .output-content {
          background: #1a1a1a;
          padding: 12px;
          border-radius: 4px;
          height: calc(100% - 32px);
          overflow-y: auto;
          font-family: 'Courier New', monospace;
          font-size: 12px;
          margin: 0;
        }
      `}</style>
    </div>
  );
};