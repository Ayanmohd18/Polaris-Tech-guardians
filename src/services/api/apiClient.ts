import { sanitizeObject, rateLimiter, generateSecureId } from '../../utils/security';

class APIClient {
  private baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  private token: string | null = null;
  private ws: WebSocket | null = null;
  private maxRetries = 3;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  setToken(token: string) {
    if (!token || typeof token !== 'string') {
      throw new Error('Invalid token provided');
    }
    this.token = token;
    try {
      localStorage.setItem('nexus_token', token);
    } catch (error) {
      console.warn('Failed to store token:', error);
    }
  }

  getToken(): string | null {
    if (!this.token) {
      try {
        this.token = localStorage.getItem('nexus_token');
      } catch (error) {
        console.warn('Failed to retrieve token:', error);
      }
    }
    return this.token;
  }

  private async request(endpoint: string, options: RequestInit = {}, retryCount = 0): Promise<any> {
    try {
      const token = this.getToken();
      const sanitizedBody = options.body ? JSON.stringify(sanitizeObject(JSON.parse(options.body as string))) : undefined;
      
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
        body: sanitizedBody,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`API Error ${response.status}: ${errorData.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (retryCount < this.maxRetries && error instanceof TypeError) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return this.request(endpoint, options, retryCount + 1);
      }
      throw error;
    }
  }

  // Voice API
  async transcribeAudio(audioBlob: Blob) {
    try {
      if (!audioBlob || audioBlob.size === 0) {
        throw new Error('Invalid audio data');
      }
      
      const formData = new FormData();
      formData.append('audio', audioBlob);
      
      const token = this.getToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`${this.baseURL}/voice/transcribe`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Audio transcription error:', error);
      return { transcription: '', confidence: 0, error: error.message };
    }
  }

  async executeVoiceCommand(command: string) {
    return this.request('/voice/execute', {
      method: 'POST',
      body: JSON.stringify({ text: command }),
    });
  }

  // AI Orchestration
  async orchestrateAI(prompt: string, context: any = {}) {
    return this.request('/ai/orchestrate', {
      method: 'POST',
      body: JSON.stringify({ prompt, context }),
    });
  }

  async getAIModelsStatus() {
    return this.request('/ai/models/status');
  }

  // Notion Integration
  async syncNotion(workspaceId: string) {
    return this.request('/notion/sync', {
      method: 'POST',
      body: JSON.stringify({ workspace_id: workspaceId }),
    });
  }

  async createNotionTask(task: any) {
    return this.request('/notion/create-task', {
      method: 'POST',
      body: JSON.stringify(task),
    });
  }

  // Deployment
  async deployToVercel(project: any) {
    return this.request('/deploy/vercel', {
      method: 'POST',
      body: JSON.stringify(project),
    });
  }

  async deployToNetlify(project: any) {
    return this.request('/deploy/netlify', {
      method: 'POST',
      body: JSON.stringify(project),
    });
  }

  async getDeploymentStatus(deploymentId: string) {
    return this.request(`/deploy/status/${deploymentId}`);
  }

  // Database
  async connectDatabase(config: any) {
    return this.request('/database/connect', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  async executeQuery(query: string, connectionId: string) {
    return this.request('/database/query', {
      method: 'POST',
      body: JSON.stringify({ query, connection_id: connectionId }),
    });
  }

  // Games
  async generateGame(prompt: any) {
    return this.request('/games/generate', {
      method: 'POST',
      body: JSON.stringify(prompt),
    });
  }

  // Mobile Apps
  async generateMobileApp(prompt: any) {
    return this.request('/mobile/generate', {
      method: 'POST',
      body: JSON.stringify(prompt),
    });
  }

  // Analytics
  async getAnalyticsDashboard() {
    return this.request('/analytics/dashboard');
  }

  // Marketplace
  async getPlugins() {
    return this.request('/marketplace/plugins');
  }

  async installPlugin(pluginId: string) {
    return this.request(`/marketplace/install/${pluginId}`, {
      method: 'POST',
    });
  }

  // WebSocket Connection
  connectWebSocket(roomId: string, onMessage: (data: any) => void) {
    try {
      if (!roomId || typeof roomId !== 'string') {
        throw new Error('Invalid room ID');
      }
      
      const wsURL = `${import.meta.env.VITE_WS_URL || 'ws://localhost:8000'}/ws/collaboration/${encodeURIComponent(roomId)}`;
      this.ws = new WebSocket(wsURL);
      
      this.ws.onopen = () => console.log('WebSocket connected to room:', roomId);
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const sanitizedData = sanitizeObject(data);
          onMessage(sanitizedData);
        } catch (error) {
          console.error('WebSocket message parsing error:', error);
        }
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      this.ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
          setTimeout(() => this.connectWebSocket(roomId, onMessage), delay);
        }
      };
      
      return this.ws;
    } catch (error) {
      console.error('WebSocket connection error:', error);
      return null;
    }
  }

  sendWebSocketMessage(message: any) {
    try {
      if (!rateLimiter('websocket_send', 50, 1000)) {
        console.warn('WebSocket send rate limit exceeded');
        return;
      }
      
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        const sanitizedMessage = sanitizeObject(message);
        this.ws.send(JSON.stringify(sanitizedMessage));
      } else {
        console.warn('WebSocket not connected');
      }
    } catch (error) {
      console.error('WebSocket send error:', error);
    }
  }

  disconnectWebSocket() {
    try {
      if (this.ws) {
        this.ws.close(1000, 'Client disconnect');
        this.ws = null;
      }
    } catch (error) {
      console.error('WebSocket disconnect error:', error);
    }
  }
}

export default new APIClient();