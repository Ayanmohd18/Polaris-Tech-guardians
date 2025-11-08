interface CanvasElement {
  id: string;
  type: 'rectangle' | 'circle' | 'text' | 'image' | 'button' | 'input' | 'container';
  x: number;
  y: number;
  width: number;
  height: number;
  properties: Record<string, any>;
  children?: string[];
}

interface CanvasState {
  elements: CanvasElement[];
  selectedElements: string[];
  zoom: number;
  panX: number;
  panY: number;
}

export class DesignCanvas {
  private state: CanvasState = {
    elements: [],
    selectedElements: [],
    zoom: 1,
    panX: 0,
    panY: 0
  };

  private listeners: ((state: CanvasState) => void)[] = [];

  createElement(type: CanvasElement['type'], x: number, y: number): string {
    const id = `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const element: CanvasElement = {
      id,
      type,
      x,
      y,
      width: type === 'text' ? 100 : 120,
      height: type === 'text' ? 30 : 80,
      properties: this.getDefaultProperties(type),
      children: []
    };

    this.state.elements.push(element);
    this.notifyListeners();
    return id;
  }

  updateElement(id: string, updates: Partial<CanvasElement>): void {
    const index = this.state.elements.findIndex(el => el.id === id);
    if (index !== -1) {
      this.state.elements[index] = { ...this.state.elements[index], ...updates };
      this.notifyListeners();
    }
  }

  deleteElement(id: string): void {
    this.state.elements = this.state.elements.filter(el => el.id !== id);
    this.state.selectedElements = this.state.selectedElements.filter(sel => sel !== id);
    this.notifyListeners();
  }

  selectElement(id: string, multiSelect: boolean = false): void {
    if (multiSelect) {
      if (this.state.selectedElements.includes(id)) {
        this.state.selectedElements = this.state.selectedElements.filter(sel => sel !== id);
      } else {
        this.state.selectedElements.push(id);
      }
    } else {
      this.state.selectedElements = [id];
    }
    this.notifyListeners();
  }

  private getDefaultProperties(type: CanvasElement['type']): Record<string, any> {
    const defaults = {
      rectangle: { fill: '#3B82F6', stroke: '#1E40AF', strokeWidth: 2, rx: 4 },
      circle: { fill: '#10B981', stroke: '#047857', strokeWidth: 2 },
      text: { text: 'Text', fontSize: 16, fontFamily: 'Arial', color: '#1F2937' },
      image: { src: '', alt: 'Image' },
      button: { text: 'Button', backgroundColor: '#3B82F6', color: 'white', padding: 12 },
      input: { placeholder: 'Enter text...', borderColor: '#D1D5DB', padding: 8 },
      container: { backgroundColor: 'transparent', border: '1px dashed #9CA3AF' }
    };
    return defaults[type] || {};
  }

  subscribe(listener: (state: CanvasState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener({ ...this.state }));
  }

  getState(): CanvasState {
    return { ...this.state };
  }
}