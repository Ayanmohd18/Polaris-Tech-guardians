import React, { useState, useRef, useEffect } from 'react';
import { DesignCanvas as DesignCanvasService } from '../../services/canvas/designCanvas';

export const DesignCanvas: React.FC = () => {
  const [canvasState, setCanvasState] = useState<any>({ elements: [], selectedElements: [], zoom: 1 });
  const [tool, setTool] = useState<'select' | 'rectangle' | 'circle' | 'text' | 'button'>('select');
  const canvasRef = useRef<HTMLDivElement>(null);
  const designCanvas = useRef(new DesignCanvasService());

  useEffect(() => {
    const unsubscribe = designCanvas.current.subscribe(setCanvasState);
    return unsubscribe;
  }, []);

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (tool === 'select') return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    designCanvas.current.createElement(tool as any, x, y);
    setTool('select');
  };

  const handleElementClick = (elementId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    designCanvas.current.selectElement(elementId, e.ctrlKey);
  };

  const renderElement = (element: any) => {
    const isSelected = canvasState.selectedElements.includes(element.id);
    
    const baseStyle = {
      position: 'absolute' as const,
      left: element.x,
      top: element.y,
      width: element.width,
      height: element.height,
      border: isSelected ? '2px solid #3B82F6' : 'none',
      cursor: 'pointer'
    };

    switch (element.type) {
      case 'rectangle':
        return (
          <div
            key={element.id}
            style={{
              ...baseStyle,
              backgroundColor: element.properties.fill,
              borderRadius: element.properties.rx
            }}
            onClick={(e) => handleElementClick(element.id, e)}
          />
        );
      
      case 'circle':
        return (
          <div
            key={element.id}
            style={{
              ...baseStyle,
              backgroundColor: element.properties.fill,
              borderRadius: '50%'
            }}
            onClick={(e) => handleElementClick(element.id, e)}
          />
        );
      
      case 'text':
        return (
          <div
            key={element.id}
            style={{
              ...baseStyle,
              fontSize: element.properties.fontSize,
              color: element.properties.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={(e) => handleElementClick(element.id, e)}
          >
            {element.properties.text}
          </div>
        );
      
      case 'button':
        return (
          <button
            key={element.id}
            style={{
              ...baseStyle,
              backgroundColor: element.properties.backgroundColor,
              color: element.properties.color,
              border: 'none',
              borderRadius: '4px'
            }}
            onClick={(e) => handleElementClick(element.id, e)}
          >
            {element.properties.text}
          </button>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="design-canvas-container">
      <div className="toolbar">
        <h3>🎨 Design Canvas</h3>
        <div className="tools">
          {['select', 'rectangle', 'circle', 'text', 'button'].map(toolName => (
            <button
              key={toolName}
              className={`tool-btn ${tool === toolName ? 'active' : ''}`}
              onClick={() => setTool(toolName as any)}
            >
              {toolName === 'select' ? '👆' : 
               toolName === 'rectangle' ? '⬜' :
               toolName === 'circle' ? '⭕' :
               toolName === 'text' ? '📝' : '🔘'}
            </button>
          ))}
        </div>
      </div>

      <div className="canvas-workspace">
        <div className="layers-panel">
          <h4>Layers</h4>
          {canvasState.elements.map((element: any) => (
            <div
              key={element.id}
              className={`layer-item ${canvasState.selectedElements.includes(element.id) ? 'selected' : ''}`}
              onClick={() => designCanvas.current.selectElement(element.id)}
            >
              <span>{element.type === 'rectangle' ? '⬜' : element.type === 'circle' ? '⭕' : '📝'}</span>
              <span>{element.type}</span>
            </div>
          ))}
        </div>

        <div
          ref={canvasRef}
          className="canvas"
          onClick={handleCanvasClick}
        >
          {canvasState.elements.map(renderElement)}
        </div>

        <div className="properties-panel">
          <h4>Properties</h4>
          {canvasState.selectedElements.length > 0 && (
            <div className="property-controls">
              <div className="property-group">
                <label>Position</label>
                <input type="number" placeholder="X" />
                <input type="number" placeholder="Y" />
              </div>
              <div className="property-group">
                <label>Size</label>
                <input type="number" placeholder="Width" />
                <input type="number" placeholder="Height" />
              </div>
              <div className="property-group">
                <label>Fill</label>
                <input type="color" defaultValue="#3B82F6" />
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .design-canvas-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: #f8fafc;
        }

        .toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 20px;
          background: white;
          border-bottom: 1px solid #e2e8f0;
        }

        .tools {
          display: flex;
          gap: 8px;
        }

        .tool-btn {
          padding: 8px 12px;
          background: #f7fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          cursor: pointer;
        }

        .tool-btn.active {
          background: #3182ce;
          color: white;
        }

        .canvas-workspace {
          display: grid;
          grid-template-columns: 200px 1fr 250px;
          flex: 1;
        }

        .layers-panel, .properties-panel {
          background: white;
          padding: 16px;
        }

        .layer-item {
          display: flex;
          gap: 8px;
          padding: 8px;
          cursor: pointer;
          margin-bottom: 4px;
        }

        .layer-item.selected {
          background: #ebf8ff;
          color: #3182ce;
        }

        .canvas {
          position: relative;
          background: white;
          overflow: hidden;
          cursor: crosshair;
        }

        .property-group {
          margin-bottom: 16px;
        }

        .property-group label {
          display: block;
          margin-bottom: 4px;
          font-size: 12px;
          font-weight: 500;
        }

        .property-group input {
          width: 100%;
          padding: 6px 8px;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          margin-bottom: 8px;
        }
      `}</style>
    </div>
  );
};