import { WebSocket } from 'ws';
import { db } from '../firebase/config';

interface CanvasElement {
  id: string;
  type: 'code' | 'comment' | 'diagram' | 'ai_suggestion';
  position: { x: number; y: number };
  content: string;
  author: string;
  timestamp: number;
  connections: string[];
}

interface CollaborationSession {
  id: string;
  participants: string[];
  canvas: CanvasElement[];
  aiAgents: string[];
  createdAt: number;
}

export class RealtimeCollaborationCanvas {
  private sessions: Map<string, CollaborationSession> = new Map();
  private connections: Map<string, WebSocket[]> = new Map();

  async createSession(sessionId: string, creatorId: string): Promise<CollaborationSession> {
    const session: CollaborationSession = {
      id: sessionId,
      participants: [creatorId],
      canvas: [],
      aiAgents: ['claude-assistant', 'code-reviewer', 'architect'],
      createdAt: Date.now()
    };

    this.sessions.set(sessionId, session);
    this.connections.set(sessionId, []);

    // Store in Firebase
    await db.collection('collaboration_sessions').doc(sessionId).set(session);

    return session;
  }

  async joinSession(sessionId: string, userId: string, ws: WebSocket): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Session not found');

    // Add participant
    if (!session.participants.includes(userId)) {
      session.participants.push(userId);
    }

    // Add WebSocket connection
    const connections = this.connections.get(sessionId) || [];
    connections.push(ws);
    this.connections.set(sessionId, connections);

    // Send current canvas state
    ws.send(JSON.stringify({
      type: 'canvas_state',
      canvas: session.canvas,
      participants: session.participants
    }));

    // Notify others
    this.broadcastToSession(sessionId, {
      type: 'user_joined',
      userId,
      participants: session.participants
    }, ws);

    // Set up message handlers
    ws.on('message', (data) => {
      this.handleCanvasMessage(sessionId, userId, JSON.parse(data.toString()));
    });

    ws.on('close', () => {
      this.handleUserDisconnect(sessionId, userId, ws);
    });
  }

  private async handleCanvasMessage(sessionId: string, userId: string, message: any): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    switch (message.type) {
      case 'add_element':
        await this.addCanvasElement(sessionId, userId, message.element);
        break;
      case 'update_element':
        await this.updateCanvasElement(sessionId, userId, message.elementId, message.updates);
        break;
      case 'delete_element':
        await this.deleteCanvasElement(sessionId, userId, message.elementId);
        break;
      case 'voice_command':
        await this.handleVoiceCommand(sessionId, userId, message.command);
        break;
      case 'ai_request':
        await this.handleAIRequest(sessionId, userId, message.request);
        break;
    }
  }

  private async addCanvasElement(sessionId: string, userId: string, element: Partial<CanvasElement>): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const newElement: CanvasElement = {
      id: `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: element.type || 'code',
      position: element.position || { x: 0, y: 0 },
      content: element.content || '',
      author: userId,
      timestamp: Date.now(),
      connections: element.connections || []
    };

    session.canvas.push(newElement);

    // Broadcast to all participants
    this.broadcastToSession(sessionId, {
      type: 'element_added',
      element: newElement
    });

    // Update Firebase
    await db.collection('collaboration_sessions').doc(sessionId).update({
      canvas: session.canvas
    });

    // Trigger AI suggestions if it's code
    if (newElement.type === 'code') {
      this.triggerAISuggestions(sessionId, newElement);
    }
  }

  private async updateCanvasElement(sessionId: string, userId: string, elementId: string, updates: Partial<CanvasElement>): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const elementIndex = session.canvas.findIndex(el => el.id === elementId);
    if (elementIndex === -1) return;

    // Apply updates
    Object.assign(session.canvas[elementIndex], updates);

    this.broadcastToSession(sessionId, {
      type: 'element_updated',
      elementId,
      updates
    });

    await db.collection('collaboration_sessions').doc(sessionId).update({
      canvas: session.canvas
    });
  }

  private async deleteCanvasElement(sessionId: string, userId: string, elementId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.canvas = session.canvas.filter(el => el.id !== elementId);

    this.broadcastToSession(sessionId, {
      type: 'element_deleted',
      elementId
    });

    await db.collection('collaboration_sessions').doc(sessionId).update({
      canvas: session.canvas
    });
  }

  private async handleVoiceCommand(sessionId: string, userId: string, command: string): Promise<void> {
    // Process voice command and add result to canvas
    const aiResponse = await this.processVoiceWithAI(command);
    
    await this.addCanvasElement(sessionId, 'ai-assistant', {
      type: 'ai_suggestion',
      content: aiResponse,
      position: { x: Math.random() * 800, y: Math.random() * 600 }
    });
  }

  private async handleAIRequest(sessionId: string, userId: string, request: string): Promise<void> {
    // Get AI response and add to canvas
    const aiResponse = await this.getAIResponse(request);
    
    await this.addCanvasElement(sessionId, 'ai-assistant', {
      type: 'ai_suggestion',
      content: aiResponse,
      position: { x: Math.random() * 800, y: Math.random() * 600 }
    });
  }

  private async triggerAISuggestions(sessionId: string, codeElement: CanvasElement): Promise<void> {
    // Analyze code and provide suggestions
    const suggestions = await this.analyzeCodeForSuggestions(codeElement.content);
    
    for (const suggestion of suggestions) {
      await this.addCanvasElement(sessionId, 'ai-reviewer', {
        type: 'ai_suggestion',
        content: suggestion,
        position: { 
          x: codeElement.position.x + 300, 
          y: codeElement.position.y + Math.random() * 100 
        },
        connections: [codeElement.id]
      });
    }
  }

  private async processVoiceWithAI(command: string): Promise<string> {
    // Mock AI processing
    return `AI processed voice command: "${command}"\n\n// Generated response based on voice input`;
  }

  private async getAIResponse(request: string): Promise<string> {
    // Mock AI response
    return `AI Response to: "${request}"\n\n// Intelligent suggestion based on context`;
  }

  private async analyzeCodeForSuggestions(code: string): Promise<string[]> {
    // Mock code analysis
    return [
      "Consider adding error handling",
      "This could be optimized for performance",
      "Add unit tests for this function"
    ];
  }

  private broadcastToSession(sessionId: string, message: any, exclude?: WebSocket): void {
    const connections = this.connections.get(sessionId) || [];
    const messageStr = JSON.stringify(message);

    connections.forEach(ws => {
      if (ws !== exclude && ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
      }
    });
  }

  private handleUserDisconnect(sessionId: string, userId: string, ws: WebSocket): void {
    const connections = this.connections.get(sessionId) || [];
    const updatedConnections = connections.filter(conn => conn !== ws);
    this.connections.set(sessionId, updatedConnections);

    // If no more connections, clean up session
    if (updatedConnections.length === 0) {
      this.sessions.delete(sessionId);
      this.connections.delete(sessionId);
    } else {
      // Notify remaining participants
      this.broadcastToSession(sessionId, {
        type: 'user_left',
        userId
      });
    }
  }
}