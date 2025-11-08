interface CollaborativeCodeRequest {
  prompt: string;
  userId: string;
  context?: Record<string, any>;
}

interface ConsensusRequest {
  question: string;
  options: string[];
}

interface SpecializedTaskRequest {
  taskType: 'architect' | 'coder' | 'reviewer' | 'explainer' | 'debugger' | 'optimizer';
  prompt: string;
  userId: string;
}

interface AICollaborationResult {
  architecture: any;
  code: string;
  review: any;
  documentation: string;
  collaborationId: string;
}

interface ConsensusResult {
  consensus: string;
  confidence: number;
  reasoning: string[];
  allResponses: any[];
}

export class AIOrchestrator {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:8000/orchestrate') {
    this.baseUrl = baseUrl;
  }

  async collaborativeCodeGeneration(request: CollaborativeCodeRequest): Promise<AICollaborationResult> {
    const response = await fetch(`${this.baseUrl}/collaborative-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: request.prompt,
        user_id: request.userId,
        context: request.context || {}
      })
    });

    if (!response.ok) {
      throw new Error(`AI Orchestration failed: ${response.statusText}`);
    }

    return response.json();
  }

  async getConsensus(request: ConsensusRequest): Promise<ConsensusResult> {
    const response = await fetch(`${this.baseUrl}/consensus`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`Consensus request failed: ${response.statusText}`);
    }

    return response.json();
  }

  async specializedTask(request: SpecializedTaskRequest): Promise<any> {
    const response = await fetch(`${this.baseUrl}/specialized`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task_type: request.taskType,
        prompt: request.prompt,
        user_id: request.userId
      })
    });

    if (!response.ok) {
      throw new Error(`Specialized task failed: ${response.statusText}`);
    }

    return response.json();
  }

  async batchProcessing(requests: SpecializedTaskRequest[]): Promise<any> {
    const response = await fetch(`${this.baseUrl}/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requests.map(req => ({
        task_type: req.taskType,
        prompt: req.prompt,
        user_id: req.userId
      })))
    });

    if (!response.ok) {
      throw new Error(`Batch processing failed: ${response.statusText}`);
    }

    return response.json();
  }

  async getModelRoles(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/models`);
    
    if (!response.ok) {
      throw new Error(`Failed to get model roles: ${response.statusText}`);
    }

    return response.json();
  }

  async getCollaborationHistory(userId: string, limit: number = 10): Promise<any> {
    const response = await fetch(`${this.baseUrl}/history/${userId}?limit=${limit}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get history: ${response.statusText}`);
    }

    return response.json();
  }

  // Convenience methods for specific AI roles
  async architect(prompt: string, userId: string): Promise<any> {
    return this.specializedTask({ taskType: 'architect', prompt, userId });
  }

  async coder(prompt: string, userId: string): Promise<any> {
    return this.specializedTask({ taskType: 'coder', prompt, userId });
  }

  async reviewer(code: string, userId: string): Promise<any> {
    return this.specializedTask({ 
      taskType: 'reviewer', 
      prompt: `Review this code: ${code}`, 
      userId 
    });
  }

  async explainer(code: string, userId: string): Promise<any> {
    return this.specializedTask({ 
      taskType: 'explainer', 
      prompt: `Explain this code: ${code}`, 
      userId 
    });
  }

  async debugger(code: string, error: string, userId: string): Promise<any> {
    return this.specializedTask({ 
      taskType: 'debugger', 
      prompt: `Debug this code with error: ${error}\n\nCode: ${code}`, 
      userId 
    });
  }

  async optimizer(code: string, userId: string): Promise<any> {
    return this.specializedTask({ 
      taskType: 'optimizer', 
      prompt: `Optimize this code: ${code}`, 
      userId 
    });
  }
}