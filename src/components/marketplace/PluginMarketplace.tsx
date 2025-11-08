import React, { useState, useEffect } from 'react';
import { PluginManager } from '../../services/marketplace/pluginManager';

export const PluginMarketplace: React.FC = () => {
  const [plugins, setPlugins] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [installingPlugins, setInstallingPlugins] = useState<Set<string>>(new Set());

  const pluginManager = new PluginManager();

  useEffect(() => {
    loadPlugins();
  }, [searchQuery]);

  const loadPlugins = () => {
    let filteredPlugins = pluginManager.getAvailablePlugins();
    
    if (searchQuery) {
      filteredPlugins = pluginManager.searchPlugins(searchQuery);
    }
    
    setPlugins(filteredPlugins);
  };

  const handleInstallPlugin = async (pluginId: string) => {
    setInstallingPlugins(prev => new Set(prev).add(pluginId));
    
    try {
      await pluginManager.installPlugin(pluginId);
      loadPlugins();
    } catch (error) {
      console.error('Failed to install plugin:', error);
    } finally {
      setInstallingPlugins(prev => {
        const newSet = new Set(prev);
        newSet.delete(pluginId);
        return newSet;
      });
    }
  };

  const handleTogglePlugin = (pluginId: string) => {
    pluginManager.togglePlugin(pluginId);
    loadPlugins();
  };

  return (
    <div className="plugin-marketplace">
      <div className="marketplace-header">
        <h2>🛒 Plugin Marketplace</h2>
        <input
          type="text"
          placeholder="Search plugins..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="plugins-grid">
        {plugins.map(plugin => (
          <div key={plugin.id} className="plugin-card">
            <div className="plugin-header">
              <h3>{plugin.name}</h3>
              <span className="plugin-category">{plugin.category}</span>
            </div>
            <p className="plugin-description">{plugin.description}</p>
            <div className="plugin-meta">
              <span>v{plugin.version}</span>
              <span>by {plugin.author}</span>
            </div>
            <div className="plugin-actions">
              {!plugin.installed ? (
                <button
                  onClick={() => handleInstallPlugin(plugin.id)}
                  disabled={installingPlugins.has(plugin.id)}
                  className="install-btn"
                >
                  {installingPlugins.has(plugin.id) ? '⏳ Installing...' : '📥 Install'}
                </button>
              ) : (
                <button
                  onClick={() => handleTogglePlugin(plugin.id)}
                  className={`toggle-btn ${plugin.enabled ? 'enabled' : 'disabled'}`}
                >
                  {plugin.enabled ? '✅ Enabled' : '⏸️ Disabled'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .plugin-marketplace {
          padding: 20px;
          background: #1a1a1a;
          border-radius: 12px;
          color: #c9d1d9;
          height: 100vh;
          overflow-y: auto;
        }

        .marketplace-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }

        .search-input {
          padding: 8px 12px;
          background: #2a2a2a;
          border: 1px solid #444;
          border-radius: 6px;
          color: #c9d1d9;
          width: 250px;
        }

        .plugins-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 20px;
        }

        .plugin-card {
          background: #2a2a2a;
          border-radius: 12px;
          padding: 20px;
          border: 1px solid #444;
        }

        .plugin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .plugin-header h3 {
          margin: 0;
          color: white;
        }

        .plugin-category {
          background: #4CAF50;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          text-transform: uppercase;
        }

        .plugin-description {
          color: #c9d1d9;
          margin-bottom: 12px;
        }

        .plugin-meta {
          display: flex;
          gap: 12px;
          font-size: 12px;
          color: #8b949e;
          margin-bottom: 16px;
        }

        .install-btn, .toggle-btn {
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: bold;
          width: 100%;
        }

        .install-btn {
          background: #4CAF50;
          color: white;
        }

        .install-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .toggle-btn.enabled {
          background: #28a745;
          color: white;
        }

        .toggle-btn.disabled {
          background: #6c757d;
          color: white;
        }

        h2 {
          color: white;
          margin: 0;
        }
      `}</style>
    </div>
  );
};