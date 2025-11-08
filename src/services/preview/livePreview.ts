export class LivePreviewManager {
  private previews: Map<string, any> = new Map();

  async createPreview(sandboxId: string, port: number = 3000): Promise<string> {
    const previewId = `preview_${Date.now()}`;
    const previewUrl = `https://${sandboxId}-${port}.nexus.dev`;
    
    const preview = {
      id: previewId,
      sandboxId,
      port,
      url: previewUrl,
      status: 'starting',
      logs: []
    };

    this.previews.set(previewId, preview);
    
    setTimeout(() => {
      preview.status = 'running';
      preview.logs.push('Server started successfully');
    }, 1500);

    return previewUrl;
  }

  async updatePreview(sandboxId: string, files: Record<string, string>): Promise<void> {
    const preview = Array.from(this.previews.values()).find(p => p.sandboxId === sandboxId);
    if (!preview) return;

    preview.logs.push('Hot reload triggered');
    
    setTimeout(() => {
      preview.logs.push('Changes applied');
    }, 500);
  }

  getPreviewLogs(previewId: string): string[] {
    const preview = this.previews.get(previewId);
    return preview?.logs || [];
  }

  async generateShareableLink(sandboxId: string): Promise<string> {
    return `https://nexus.dev/share/${sandboxId}`;
  }
}