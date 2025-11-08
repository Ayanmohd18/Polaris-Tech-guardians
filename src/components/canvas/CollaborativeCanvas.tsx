import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../../services/api/apiClient';

interface CanvasElement {
  id: string;
  type: 'code' | 'comment' | 'diagram' | 'ai_suggestion';
  position: { x: number; y: number };
  content: string;
  author: string;
  timestamp: number;
  connections: string[];
}

interface Participant {
  id: string;
  name: string;
  color: string;
  cursor?: { x: number; y: number };
}

export const CollaborativeCanvas: React.FC = () => {
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [sessionId] = useState(`session_${Date.now()}`);
  const [userId] = useState(() => 'user_' + Math.random().toString(36).substr(2, 9));
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket>();

  useEffect(() => {
    initializeCollaboration();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const initializeCollaboration = async () => {
    try {
      const ws = apiClient.connectWebSocket(sessionId, handleCollaborationMessage);
      if (ws) {
        wsRef.current = ws;
        setIsConnected(true);
        
        // Add current user
        setParticipants([{
          id: userId,
          name: 'You',
          color: '#4CAF50'
        }]);
        
        // Add AI participants after connection is established
        setTimeout(() => {
          const aiParticipants = [
            { id: 'ai-architect', name: 'Claude Architect', color: '#FF5722' },
            { id: 'ai-developer', name: 'GPT Developer', color: '#2196F3' },
            { id: 'ai-designer', name: 'Gemini Designer', color: '#9C27B0' }
          ];
          setParticipants(prev => [...prev, ...aiParticipants]);
        }, 1000);
      } else {
        throw new Error('Failed to establish WebSocket connection');
      }
    } catch (error) {
      console.error('Failed to initialize collaboration:', error);
      setIsConnected(false);
      // Retry connection after delay
      setTimeout(() => initializeCollaboration(), 5000);
    }
  };

  const handleCollaborationMessage = (data: any) => {
    try {
      if (!data || typeof data !== 'object') {
        console.warn('Invalid collaboration message received');
        return;
      }
      
      switch (data.type) {
        case 'canvas_state':
          if (Array.isArray(data.canvas)) {
            setElements(data.canvas.filter(el => el && typeof el === 'object'));
          }
          if (Array.isArray(data.participants)) {
            setParticipants(data.participants.map((p: string, i: number) => ({
              id: String(p).replace(/[<>"']/g, ''),
              name: String(p).replace(/[<>"']/g, ''),
              color: `hsl(${i * 137.5}, 70%, 50%)`
            })));
          }
          break;
        
        case 'element_added':
          if (data.element && typeof data.element === 'object') {
            const sanitizedElement = {
              ...data.element,
              id: String(data.element.id).replace(/[<>"']/g, ''),
              content: String(data.element.content || '').replace(/<script[^>]*>.*?<\/script>/gi, '')
            };
            setElements(prev => [...prev, sanitizedElement]);
          }
          break;
        
        case 'element_updated':
          if (data.elementId && data.updates) {
            const sanitizedUpdates = {
              ...data.updates,
              content: data.updates.content ? String(data.updates.content).replace(/<script[^>]*>.*?<\/script>/gi, '') : undefined
            };
            setElements(prev => prev.map(el => 
              el.id === data.elementId ? { ...el, ...sanitizedUpdates } : el
            ));
          }
          break;
        
        case 'element_deleted':
          if (data.elementId) {
            setElements(prev => prev.filter(el => el.id !== data.elementId));
          }
          break;
        
        case 'user_joined':
          if (data.userId && !participants.find(p => p.id === data.userId)) {
            const sanitizedUserId = String(data.userId).replace(/[<>"']/g, '');
            setParticipants(prev => [...prev, {
              id: sanitizedUserId,
              name: sanitizedUserId,
              color: `hsl(${prev.length * 137.5}, 70%, 50%)`
            }]);
          }
          break;
        
        case 'user_left':
          if (data.userId) {
            setParticipants(prev => prev.filter(p => p.id !== data.userId));
          }
          break;
          
        default:
          console.warn('Unknown collaboration message type:', data.type);
      }
    } catch (error) {
      console.error('Error handling collaboration message:', error);
    }
  };

  const addElement = (type: CanvasElement['type'], position: { x: number; y: number }) => {
    try {
      if (!type || !position || typeof position.x !== 'number' || typeof position.y !== 'number') {
        throw new Error('Invalid element parameters');
      }
      
      const content = type === 'code' ? '// New code block\nfunction example() {\n  return "Hello World";\n}' :
                     type === 'comment' ? 'Add your comment here...' :
                     type === 'diagram' ? '[Diagram placeholder]' :
                     'AI suggestion will appear here';

      const newElement = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        position: {
          x: Math.max(0, Math.min(position.x, 2000)),
          y: Math.max(0, Math.min(position.y, 2000))
        },
        content: String(content).replace(/<script[^>]*>.*?<\/script>/gi, ''),
        author: userId,
        timestamp: Date.now(),
        connections: []
      };

      setElements(prev => [...prev, newElement]);
      
      apiClient.sendWebSocketMessage({
        type: 'canvas_update',
        element: newElement,
        userId: userId
      });
    } catch (error) {
      console.error('Error adding element:', error);
    }
  };

  const updateElement = (elementId: string, updates: Partial<CanvasElement>) => {
    setElements(prev => prev.map(el => 
      el.id === elementId ? { ...el, ...updates } : el
    ));
    
    apiClient.sendWebSocketMessage({
      type: 'canvas_update',
      elementId,
      updates,
      userId: userId
    });
  };

  const deleteElement = (elementId: string) => {
    setElements(prev => prev.filter(el => el.id !== elementId));
    
    apiClient.sendWebSocketMessage({
      type: 'canvas_update',
      action: 'delete',
      elementId,
      userId: userId
    });
  };

  const handleCanvasClick = (event: React.MouseEvent) => {
    if (event.target === canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const position = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
      
      // Add code element by default on canvas click
      addElement('code', position);
    }
  };

  const getElementStyle = (element: CanvasElement) => {
    const baseStyle = {
      position: 'absolute' as const,
      left: element.position.x,
      top: element.position.y,
      minWidth: '200px',
      minHeight: '100px',
      border: selectedElement === element.id ? '2px solid #4CAF50' : '1px solid #444',
      borderRadius: '8px',
      padding: '10px',
      cursor: 'move',
      zIndex: selectedElement === element.id ? 1000 : 1
    };

    switch (element.type) {
      case 'code':
        return { ...baseStyle, background: '#1a1a1a', color: '#c9d1d9' };
      case 'comment':
        return { ...baseStyle, background: '#2d3748', color: '#e2e8f0' };
      case 'diagram':
        return { ...baseStyle, background: '#4a5568', color: '#f7fafc' };
      case 'ai_suggestion':
        return { ...baseStyle, background: '#2b6cb0', color: '#bee3f8', border: '2px solid #3182ce' };
      default:
        return baseStyle;
    }
  };

  return (
    <div className="collaborative-canvas-container">
      <div className="canvas-toolbar">
        <div className="connection-status">
          <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
        
        <div className="participants">
          {participants.map(participant => (
            <div 
              key={participant.id} 
              className="participant"
              style={{ backgroundColor: participant.color }}
            >
              {participant.name.charAt(0).toUpperCase()}
            </div>
          ))}
        </div>

        <div className="canvas-tools">
          <button onClick={() => addElement('code', { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 })}>
            + Code
          </button>
          <button onClick={() => addElement('comment', { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 })}>
            + Comment
          </button>
          <button onClick={() => addElement('diagram', { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 })}>
            + Diagram
          </button>
          <button onClick={async () => {
            const codeElements = elements.filter(e => e.type === 'code');
            const result = await apiClient.orchestrateAI(
              'Suggest improvements for this code',
              { elements: codeElements }
            );
            
            if (result.suggestion) {
              addElement('ai_suggestion', { 
                x: Math.random() * 400 + 100, 
                y: Math.random() * 300 + 100 
              });
            }
          }}>
            🤖 Ask AI
          </button>
        </div>
      </div>

      <div 
        ref={canvasRef}
        className="canvas"
        onClick={handleCanvasClick}
      >
        {elements.map(element => (
          <div
            key={element.id}
            style={getElementStyle(element)}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedElement(element.id);
            }}
          >
            <div className="element-header">
              <span className="element-type">{element.type}</span>
              <span className="element-author">{element.author}</span>
              <button 
                className="delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteElement(element.id);
                }}
              >
                ×
              </button>
            </div>
            
            <div className="element-content">
              {element.type === 'code' ? (
                <pre><code>{element.content}</code></pre>
              ) : (
                <textarea
                  value={element.content}
                  onChange={(e) => updateElement(element.id, { content: e.target.value })}
                  style={{ 
                    width: '100%', 
                    height: '80px', 
                    background: 'transparent', 
                    border: 'none', 
                    color: 'inherit',
                    resize: 'vertical'
                  }}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .collaborative-canvas-container {
          height: 100vh;
          display: flex;
          flex-direction: column;
          background: #0d1117;
        }

        .canvas-toolbar {
          background: #161b22;
          padding: 10px 20px;
          display: flex;
          align-items: center;
          gap: 20px;
          border-bottom: 1px solid #30363d;
        }

        .connection-status {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #c9d1d9;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .status-dot.connected {
          background: #28a745;
        }

        .status-dot.disconnected {
          background: #dc3545;
        }

        .participants {
          display: flex;
          gap: 5px;
        }

        .participant {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 14px;
        }

        .canvas-tools {
          display: flex;
          gap: 10px;
          margin-left: auto;
        }

        .canvas-tools button {
          padding: 8px 16px;
          background: #238636;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
        }

        .canvas-tools button:hover {
          background: #2ea043;
        }

        .canvas {
          flex: 1;
          position: relative;
          overflow: hidden;
          background: 
            radial-gradient(circle at 20px 20px, #30363d 1px, transparent 1px),
            radial-gradient(circle at 80px 80px, #30363d 1px, transparent 1px);
          background-size: 100px 100px;
        }

        .element-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          font-size: 12px;
          opacity: 0.8;
        }

        .element-type {
          background: rgba(255, 255, 255, 0.1);
          padding: 2px 6px;
          border-radius: 4px;
          text-transform: uppercase;
        }

        .delete-btn {
          background: #dc3545;
          color: white;
          border: none;
          border-radius: 4px;
          width: 20px;
          height: 20px;
          cursor: pointer;
          font-size: 14px;
          line-height: 1;
        }

        .element-content pre {
          margin: 0;
          font-size: 12px;
          line-height: 1.4;
        }

        .element-content code {
          color: inherit;
        }
      `}</style>
    </div>
  );
};