interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  category: 'ai' | 'productivity' | 'design' | 'testing' | 'deployment';
  installed: boolean;
  enabled: boolean;
}

export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();

  constructor() {
    this.loadMarketplacePlugins();
  }

  private loadMarketplacePlugins() {
    const marketplacePlugins: Plugin[] = [
      {
        id: 'ai-code-reviewer',
        name: 'AI Code Reviewer',
        version: '1.2.0',
        description: 'Advanced AI-powered code review with suggestions',
        author: 'NEXUS Team',
        category: 'ai',
        installed: false,
        enabled: false
      },
      {
        id: 'figma-sync',
        name: 'Figma Design Sync',
        version: '2.1.0',
        description: 'Sync designs directly from Figma to code',
        author: 'Design Tools Inc',
        category: 'design',
        installed: false,
        enabled: false
      },
      {
        id: 'auto-deploy',
        name: 'Auto Deployment',
        version: '1.0.5',
        description: 'Automatic deployment on code changes',
        author: 'DevOps Pro',
        category: 'deployment',
        installed: false,
        enabled: false
      },
      {
        id: 'performance-optimizer',
        name: 'Performance Optimizer',
        version: '3.0.1',
        description: 'Real-time performance optimization suggestions',
        author: 'Speed Labs',
        category: 'productivity',
        installed: false,
        enabled: false
      }
    ];

    marketplacePlugins.forEach(plugin => {
      this.plugins.set(plugin.id, plugin);
    });
  }

  getAvailablePlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  getInstalledPlugins(): Plugin[] {
    return Array.from(this.plugins.values()).filter(p => p.installed);
  }

  async installPlugin(pluginId: string): Promise<boolean> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return false;

    await new Promise(resolve => setTimeout(resolve, 2000));
    
    plugin.installed = true;
    plugin.enabled = true;
    
    return true;
  }

  async uninstallPlugin(pluginId: string): Promise<boolean> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return false;

    plugin.installed = false;
    plugin.enabled = false;
    
    return true;
  }

  togglePlugin(pluginId: string): boolean {
    const plugin = this.plugins.get(pluginId);
    if (!plugin || !plugin.installed) return false;

    plugin.enabled = !plugin.enabled;
    return plugin.enabled;
  }

  searchPlugins(query: string): Plugin[] {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.plugins.values()).filter(p => 
      p.name.toLowerCase().includes(lowercaseQuery) ||
      p.description.toLowerCase().includes(lowercaseQuery)
    );
  }
}