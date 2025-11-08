interface SandboxConfig {
  template: 'react' | 'node' | 'python' | 'nextjs' | 'vite';
  packages: string[];
  env: Record<string, string>;
}

export class ContainerManager {
  private containers: Map<string, any> = new Map();

  async createSandbox(config: SandboxConfig): Promise<string> {
    const sandboxId = `sb_${Date.now()}`;
    
    const container = {
      id: sandboxId,
      template: config.template,
      status: 'creating',
      url: `https://${sandboxId}.nexus.dev`,
      files: this.getTemplateFiles(config.template),
      packages: config.packages,
      env: config.env
    };

    this.containers.set(sandboxId, container);
    
    setTimeout(() => {
      container.status = 'running';
    }, 2000);

    return sandboxId;
  }

  async installPackage(sandboxId: string, packageName: string): Promise<void> {
    const container = this.containers.get(sandboxId);
    if (!container) throw new Error('Sandbox not found');

    container.packages.push(packageName);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  async executeCommand(sandboxId: string, command: string): Promise<string> {
    const container = this.containers.get(sandboxId);
    if (!container) throw new Error('Sandbox not found');

    const outputs = {
      'npm start': 'Server running on port 3000',
      'python main.py': 'Hello from Python!',
      'ls': 'package.json src/ public/',
      'pwd': '/workspace'
    };

    return outputs[command] || `Command executed: ${command}`;
  }

  private getTemplateFiles(template: string): Record<string, string> {
    const templates = {
      react: {
        'package.json': JSON.stringify({ name: 'react-app', dependencies: { react: '^18.0.0' } }),
        'src/App.jsx': 'export default function App() { return <h1>Hello React</h1>; }'
      },
      node: {
        'package.json': JSON.stringify({ name: 'node-app', main: 'index.js' }),
        'index.js': 'console.log("Hello Node.js");'
      },
      python: {
        'main.py': 'print("Hello Python")',
        'requirements.txt': 'flask==2.3.0'
      }
    };

    return templates[template] || {};
  }

  getSandbox(sandboxId: string) {
    return this.containers.get(sandboxId);
  }
}