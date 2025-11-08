import React, { useState, useEffect } from 'react';
import { VoiceCodingInterface } from './components/voice/VoiceCodingInterface';
import { CollaborativeCanvas } from './components/canvas/CollaborativeCanvas';
import { DeploymentPanel } from './components/deployment/DeploymentPanel';
import MobileStudio from './components/MobileStudio';
import { DatabaseConnector } from './components/database/DatabaseConnector';
import { ThemeProvider } from './contexts/ThemeContext';
import { ThemeToggle } from './components/ThemeToggle';
import './styles/globals.css';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>The application encountered an unexpected error.</p>
          <button onClick={() => this.setState({ hasError: false, error: undefined })}>
            Try Again
          </button>
          <style jsx>{`
            .error-boundary {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              padding: 20px;
              text-align: center;
              background: var(--bg-primary);
              color: var(--text-primary);
            }
            .error-boundary h2 {
              color: #ff6b6b;
              margin-bottom: 10px;
            }
            .error-boundary button {
              margin-top: 20px;
              padding: 10px 20px;
              background: var(--neon-blue);
              color: white;
              border: none;
              border-radius: 6px;
              cursor: pointer;
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}

type ViewMode = 'voice' | 'canvas' | 'deploy' | 'database' | 'mobile' | 'split' | 'dashboard';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    // Simulate loading
    setTimeout(() => setIsLoading(false), 2000);
    
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="legendary-spinner"></div>
        <h2 className="holographic">NEXUS PRO</h2>
        <p className="gradient-text">Initializing AI Co-Creation Platform...</p>
        <style jsx>{`
          .loading-screen {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            background: var(--bg-primary);
            position: relative;
          }
          .loading-screen::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: 
              radial-gradient(circle at 50% 50%, rgba(0, 212, 255, 0.1) 0%, transparent 70%),
              linear-gradient(45deg, transparent 30%, rgba(179, 71, 217, 0.1) 50%, transparent 70%);
            animation: loadingPulse 3s ease-in-out infinite;
          }
          @keyframes loadingPulse {
            0%, 100% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.05); }
          }
          h2 {
            font-size: 4rem;
            margin: 20px 0;
            font-weight: 900;
          }
          p {
            font-size: 1.2rem;
            margin-top: 10px;
          }
        `}</style>
      </div>
    );
  }

  const renderView = () => {
    try {
      switch (currentView) {
        case 'voice':
          return (
            <ErrorBoundary>
              <VoiceCodingInterface />
            </ErrorBoundary>
          );
        case 'canvas':
          return (
            <ErrorBoundary>
              <CollaborativeCanvas />
            </ErrorBoundary>
          );
        case 'deploy':
          return (
            <ErrorBoundary>
              <DeploymentPanel />
            </ErrorBoundary>
          );
        case 'database':
          return (
            <ErrorBoundary>
              <DatabaseConnector />
            </ErrorBoundary>
          );
        case 'mobile':
          return (
            <ErrorBoundary>
              <MobileStudio />
            </ErrorBoundary>
          );
        case 'split':
          return (
            <div className="split-view">
              <div className="split-panel">
                <ErrorBoundary>
                  <VoiceCodingInterface />
                </ErrorBoundary>
              </div>
              <div className="split-panel">
                <ErrorBoundary>
                  <CollaborativeCanvas />
                </ErrorBoundary>
              </div>
            </div>
          );
        case 'dashboard':
        default:
          return (
            <ErrorBoundary>
              <LegendaryDashboard />
            </ErrorBoundary>
          );
      }
    } catch (error) {
      console.error('Error rendering view:', error);
      return (
        <div className="view-error">
          <h3>Failed to load view</h3>
          <p>Please try refreshing the page</p>
        </div>
      );
    }
  };

  return (
    <div className="nexus-pro-app particles cyber-grid">
      {/* Custom Cursor */}
      <div 
        className="custom-cursor"
        style={{
          left: mousePosition.x - 10,
          top: mousePosition.y - 10
        }}
      />
      
      <header className="app-header glass-card">
        <div className="logo floating">
          <h1 className="holographic">NEXUS PRO</h1>
          <span className="tagline gradient-text">AI Co-Creation Platform</span>
        </div>
        
        <nav className="main-nav">
          <button 
            className={`nav-btn neon-button ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentView('dashboard')}
          >
            <span className="btn-text">Dashboard</span>
          </button>
          <button 
            className={`nav-btn neon-button ${currentView === 'voice' ? 'active' : ''}`}
            onClick={() => setCurrentView('voice')}
          >
            <span className="btn-text">Voice AI</span>
          </button>
          <button 
            className={`nav-btn neon-button ${currentView === 'canvas' ? 'active' : ''}`}
            onClick={() => setCurrentView('canvas')}
          >
            <span className="btn-text">Collaborate</span>
          </button>
          <button 
            className={`nav-btn neon-button ${currentView === 'deploy' ? 'active' : ''}`}
            onClick={() => setCurrentView('deploy')}
          >
            <span className="btn-text">Deploy</span>
          </button>
          <button 
            className={`nav-btn neon-button ${currentView === 'database' ? 'active' : ''}`}
            onClick={() => setCurrentView('database')}
          >
            <span className="btn-text">Database</span>
          </button>
          <button 
            className={`nav-btn neon-button ${currentView === 'mobile' ? 'active' : ''}`}
            onClick={() => setCurrentView('mobile')}
          >
            <span className="btn-text">Mobile</span>
          </button>
        </nav>

        <div className="status-indicators">
          <ThemeToggle />
          <div className={`status-card glass-card ${isVoiceActive ? 'active pulse' : ''}`}>
            <span className="status-text">{isVoiceActive ? 'Listening' : 'Ready'}</span>
          </div>
          <div className="status-card glass-card glow">
            <span className="status-text">AI Active</span>
          </div>
          <div className="status-card glass-card">
            <span className="status-text">Online</span>
          </div>
        </div>
      </header>

      <main className="app-main glass-card">
        <div className="view-container">
          {renderView()}
        </div>
      </main>

      <style jsx>{`
        .nexus-pro-app {
          min-height: 100vh;
          position: relative;
          overflow-x: hidden;
        }

        .custom-cursor {
          position: fixed;
          width: 20px;
          height: 20px;
          background: var(--neon-blue);
          border-radius: 50%;
          pointer-events: none;
          z-index: 9999;
          mix-blend-mode: difference;
          transition: transform 0.1s ease;
        }

        .app-header {
          margin: 20px;
          padding: 20px 30px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
          z-index: 100;
        }

        .logo {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .logo h1 {
          margin: 0;
          font-size: 2.5rem;
          font-weight: 900;
          letter-spacing: -2px;
        }

        .tagline {
          font-size: 0.9rem;
          font-weight: 500;
          margin-top: 5px;
          letter-spacing: 1px;
        }

        .main-nav {
          display: flex;
          gap: 15px;
          align-items: center;
        }

        .nav-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px 24px;
          background: transparent;
          border: 2px solid var(--neon-blue);
          border-radius: 12px;
          color: var(--neon-blue);
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          min-width: 80px;
        }

        .nav-btn.active {
          background: var(--neon-blue);
          color: white;
          box-shadow: 0 0 30px var(--neon-blue);
        }

        .btn-text {
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .status-indicators {
          display: flex;
          gap: 15px;
          align-items: center;
        }

        .status-card {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          border-radius: 25px;
          font-size: 0.9rem;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .status-card.active {
          border-color: var(--neon-green);
          color: var(--neon-green);
        }

        .status-text {
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .app-main {
          margin: 20px;
          min-height: calc(100vh - 200px);
          border-radius: 20px;
          overflow: hidden;
          position: relative;
        }

        .view-container {
          padding: 30px;
          height: 100%;
          position: relative;
        }

        .split-view {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          height: 100%;
        }

        .split-panel {
          background: var(--glass-bg);
          backdrop-filter: blur(20px);
          border-radius: 16px;
          border: 1px solid var(--glass-border);
          overflow: hidden;
        }

        @media (max-width: 1200px) {
          .main-nav {
            gap: 10px;
          }
          
          .nav-btn {
            padding: 12px 15px;
            min-width: 70px;
          }
          
          .btn-text {
            font-size: 0.7rem;
          }
        }

        @media (max-width: 768px) {
          .app-header {
            flex-direction: column;
            gap: 20px;
            margin: 10px;
            padding: 20px;
          }
          
          .main-nav {
            flex-wrap: wrap;
            justify-content: center;
          }
          
          .status-indicators {
            justify-content: center;
          }
          
          .app-main {
            margin: 10px;
          }
          
          .view-container {
            padding: 20px;
          }
        }
      `}</style>
    </div>
  );
};

const LegendaryDashboard: React.FC = () => {
  return (
    <div className="legendary-dashboard">
      <div className="hero-section">
        <h1 className="hero-title holographic">Welcome to the Future</h1>
        <p className="hero-subtitle gradient-text">The Ultimate AI Co-Creation Platform</p>
        
        <div className="feature-grid">
          <div className="feature-card glass-card floating">
            <h3>Voice-First Development</h3>
            <p>Revolutionary speech-to-code with AI understanding</p>
            <div className="feature-status active">Active</div>
          </div>

          <div className="feature-card glass-card floating">
            <h3>Real-time Collaboration</h3>
            <p>Humans + AI working together seamlessly</p>
            <div className="feature-status active">Active</div>
          </div>

          <div className="feature-card glass-card floating">
            <h3>Multi-AI Orchestration</h3>
            <p>Claude, GPT-4, Gemini working as one</p>
            <div className="feature-status active">Active</div>
          </div>

          <div className="feature-card glass-card floating">
            <h3>Instant Deployment</h3>
            <p>One-click deployment to any platform</p>
            <div className="feature-status active">Active</div>
          </div>

          <div className="feature-card glass-card floating">
            <h3>Mobile App Studio</h3>
            <p>Generate complete mobile apps from prompts</p>
            <div className="feature-status active">Active</div>
          </div>

          <div className="feature-card glass-card floating">
            <h3>Universal Database</h3>
            <p>Connect to any database with AI assistance</p>
            <div className="feature-status active">Active</div>
          </div>
        </div>
      </div>

      <div className="stats-section glass-card">
        <h3 className="gradient-text">Platform Statistics</h3>
        <div className="stats-grid">
          <div className="stat-card glass-card glow">
            <div className="stat-number holographic">∞</div>
            <div className="stat-label">Possibilities</div>
          </div>
          <div className="stat-card glass-card glow">
            <div className="stat-number holographic">6</div>
            <div className="stat-label">Core Features</div>
          </div>
          <div className="stat-card glass-card glow">
            <div className="stat-number holographic">100%</div>
            <div className="stat-label">AI Powered</div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .legendary-dashboard {
          padding: 40px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .hero-section {
          text-align: center;
          margin-bottom: 60px;
        }

        .hero-title {
          font-size: 4rem;
          font-weight: 900;
          margin: 0 0 20px 0;
          letter-spacing: -3px;
        }

        .hero-subtitle {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 60px;
          letter-spacing: 1px;
        }

        .feature-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 30px;
          margin-bottom: 60px;
        }

        .feature-card {
          padding: 30px;
          text-align: center;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .feature-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.1), transparent);
          transition: left 0.5s;
        }

        .feature-card:hover::before {
          left: 100%;
        }

        .feature-card h3 {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0 0 15px 0;
          color: var(--text-primary);
        }

        .feature-card p {
          color: var(--text-secondary);
          margin-bottom: 20px;
          line-height: 1.6;
          font-size: 1.1rem;
        }

        .feature-status {
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 0.9rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          display: inline-block;
        }

        .feature-status.active {
          background: var(--success-gradient);
          color: white;
          box-shadow: 0 0 20px rgba(67, 233, 123, 0.5);
        }

        .stats-section {
          padding: 40px;
          text-align: center;
        }

        .stats-section h3 {
          font-size: 2rem;
          font-weight: 700;
          margin: 0 0 30px 0;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 30px;
        }

        .stat-card {
          padding: 30px;
          text-align: center;
          transition: all 0.3s ease;
        }

        .stat-number {
          font-size: 3rem;
          font-weight: 900;
          margin-bottom: 10px;
          display: block;
        }

        .stat-label {
          color: var(--text-secondary);
          font-size: 1.1rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        @media (max-width: 768px) {
          .hero-title {
            font-size: 2.5rem;
          }
          
          .hero-subtitle {
            font-size: 1.2rem;
          }
          
          .feature-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          
          .feature-card {
            padding: 20px;
          }
          
          .feature-icon {
            font-size: 3rem;
          }
        }
      `}</style>
    </div>
  );
};

const AppWithTheme: React.FC = () => (
  <ThemeProvider>
    <App />
  </ThemeProvider>
);

export default AppWithTheme;