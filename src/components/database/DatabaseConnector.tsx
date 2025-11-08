import React, { useState, useEffect } from 'react';
import apiClient from '../../services/api/apiClient';

interface DatabaseConnection {
  id: string;
  name: string;
  type: 'postgresql' | 'mysql' | 'mongodb' | 'supabase' | 'firebase';
  host: string;
  port: number;
  database: string;
  username: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  lastConnected?: string;
}

interface QueryResult {
  id: string;
  query: string;
  results: any[];
  executionTime: string;
  timestamp: string;
  rowsAffected: number;
}

export const DatabaseConnector: React.FC = () => {
  const [connections, setConnections] = useState<DatabaseConnection[]>([]);
  const [activeConnection, setActiveConnection] = useState<string | null>(null);
  const [showConnectionForm, setShowConnectionForm] = useState(false);
  const [queryHistory, setQueryHistory] = useState<QueryResult[]>([]);
  const [currentQuery, setCurrentQuery] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  
  const [newConnection, setNewConnection] = useState<Partial<DatabaseConnection>>({
    name: '',
    type: 'postgresql',
    host: 'localhost',
    port: 5432,
    database: '',
    username: ''
  });

  useEffect(() => {
    loadConnections();
    loadQueryHistory();
  }, []);

  const loadConnections = () => {
    const saved = localStorage.getItem('nexus_db_connections');
    if (saved) {
      setConnections(JSON.parse(saved));
    }
  };

  const saveConnections = (conns: DatabaseConnection[]) => {
    localStorage.setItem('nexus_db_connections', JSON.stringify(conns));
    setConnections(conns);
  };

  const loadQueryHistory = () => {
    const saved = localStorage.getItem('nexus_query_history');
    if (saved) {
      setQueryHistory(JSON.parse(saved));
    }
  };

  const saveQueryHistory = (history: QueryResult[]) => {
    localStorage.setItem('nexus_query_history', JSON.stringify(history));
    setQueryHistory(history);
  };

  const createConnection = async () => {
    try {
      // Validate required fields
      if (!newConnection.name?.trim() || !newConnection.host?.trim() || !newConnection.database?.trim()) {
        alert('Please fill in all required fields');
        return;
      }
      
      // Sanitize inputs
      const sanitizedConnection = {
        name: newConnection.name.trim().replace(/[<>"']/g, ''),
        type: newConnection.type,
        host: newConnection.host.trim().replace(/[<>"']/g, ''),
        port: Math.max(1, Math.min(65535, newConnection.port || 5432)),
        database: newConnection.database.trim().replace(/[<>"']/g, ''),
        username: (newConnection.username || '').trim().replace(/[<>"']/g, '')
      };
      
      // Validate host format (basic check)
      const hostPattern = /^[a-zA-Z0-9.-]+$/;
      if (!hostPattern.test(sanitizedConnection.host)) {
        alert('Invalid host format');
        return;
      }

      const connection: DatabaseConnection = {
        id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: sanitizedConnection.name,
        type: sanitizedConnection.type,
        host: sanitizedConnection.host,
        port: sanitizedConnection.port,
        database: sanitizedConnection.database,
        username: sanitizedConnection.username,
        status: 'connecting'
      };

      const updatedConnections = [...connections, connection];
      saveConnections(updatedConnections);

      try {
        await apiClient.connectDatabase({
          type: connection.type,
          host: connection.host,
          port: connection.port,
          database: connection.database,
          username: connection.username
        });

        connection.status = 'connected';
        connection.lastConnected = new Date().toISOString();
        saveConnections(updatedConnections);
        
        setShowConnectionForm(false);
        setNewConnection({
          name: '',
          type: 'postgresql',
          host: 'localhost',
          port: 5432,
          database: '',
          username: ''
        });
      } catch (error) {
        connection.status = 'error';
        saveConnections(updatedConnections);
        console.error('Connection failed:', error);
        alert(`Connection failed: ${error.message}`);
      }
    } catch (error) {
      console.error('Error creating connection:', error);
      alert('Failed to create connection');
    }
  };

  const executeQuery = async () => {
    try {
      if (!currentQuery.trim() || !activeConnection) {
        return;
      }
      
      // Basic SQL injection prevention
      const dangerousPatterns = [
        /;\s*(drop|delete|truncate|alter)\s+/i,
        /union\s+select/i,
        /--/,
        /\/\*/,
        /xp_cmdshell/i,
        /sp_executesql/i
      ];
      
      const hasDangerousPattern = dangerousPatterns.some(pattern => pattern.test(currentQuery));
      if (hasDangerousPattern) {
        alert('Query contains potentially dangerous operations');
        return;
      }
      
      // Limit query length
      if (currentQuery.length > 10000) {
        alert('Query is too long (max 10,000 characters)');
        return;
      }

      setIsExecuting(true);
      
      const sanitizedQuery = currentQuery.trim().replace(/[<>]/g, '');
      const result = await apiClient.executeQuery(sanitizedQuery, activeConnection);
      
      const queryResult: QueryResult = {
        id: `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        query: sanitizedQuery,
        results: Array.isArray(result.results) ? result.results.slice(0, 1000) : [], // Limit results
        executionTime: String(result.execution_time || '0ms').replace(/[<>"']/g, ''),
        timestamp: new Date().toISOString(),
        rowsAffected: Math.max(0, parseInt(result.rows_affected) || 0)
      };

      const updatedHistory = [queryResult, ...queryHistory.slice(0, 49)];
      saveQueryHistory(updatedHistory);
      
    } catch (error) {
      console.error('Query execution failed:', error);
      alert(`Query execution failed: ${error.message || 'Unknown error'}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const getConnectionIcon = (type: string) => {
    switch (type) {
      case 'postgresql': return '🐘';
      case 'mysql': return '🐬';
      case 'mongodb': return '🍃';
      case 'supabase': return '⚡';
      case 'firebase': return '🔥';
      default: return '💾';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return '#4CAF50';
      case 'connecting': return '#ffaa00';
      case 'error': return '#f44336';
      default: return '#666';
    }
  };

  return (
    <div className="database-connector">
      <div className="database-header">
        <h2>💾 Database Connector</h2>
        <p>Connect to any database and execute queries with AI assistance</p>
      </div>

      <div className="database-workspace">
        <div className="connections-panel">
          <div className="panel-header">
            <h3>Connections ({connections.length})</h3>
            <button 
              onClick={() => setShowConnectionForm(true)}
              className="add-connection-btn"
            >
              + Add
            </button>
          </div>

          {showConnectionForm && (
            <div className="connection-form">
              <h4>New Connection</h4>
              
              <div className="form-group">
                <label>Connection Name</label>
                <input
                  type="text"
                  value={newConnection.name || ''}
                  onChange={(e) => setNewConnection(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="My Database"
                />
              </div>

              <div className="form-group">
                <label>Database Type</label>
                <select
                  value={newConnection.type}
                  onChange={(e) => setNewConnection(prev => ({ 
                    ...prev, 
                    type: e.target.value as any,
                    port: e.target.value === 'postgresql' ? 5432 : 
                          e.target.value === 'mysql' ? 3306 : 
                          e.target.value === 'mongodb' ? 27017 : 5432
                  }))}
                >
                  <option value="postgresql">PostgreSQL</option>
                  <option value="mysql">MySQL</option>
                  <option value="mongodb">MongoDB</option>
                  <option value="supabase">Supabase</option>
                  <option value="firebase">Firebase</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Host</label>
                  <input
                    type="text"
                    value={newConnection.host || ''}
                    onChange={(e) => setNewConnection(prev => ({ ...prev, host: e.target.value }))}
                    placeholder="localhost"
                  />
                </div>
                <div className="form-group">
                  <label>Port</label>
                  <input
                    type="number"
                    value={newConnection.port || ''}
                    onChange={(e) => setNewConnection(prev => ({ ...prev, port: parseInt(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button onClick={createConnection} className="connect-btn">
                  Connect
                </button>
                <button 
                  onClick={() => setShowConnectionForm(false)}
                  className="cancel-btn"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="connections-list">
            {connections.map(connection => (
              <div 
                key={connection.id}
                className={`connection-item ${activeConnection === connection.id ? 'active' : ''}`}
                onClick={() => setActiveConnection(connection.id)}
              >
                <div className="connection-info">
                  <span className="connection-icon">
                    {getConnectionIcon(connection.type)}
                  </span>
                  <div className="connection-details">
                    <div className="connection-name">{connection.name}</div>
                    <div className="connection-meta">
                      {connection.type} • {connection.host}:{connection.port}
                    </div>
                  </div>
                  <div 
                    className="connection-status"
                    style={{ color: getStatusColor(connection.status) }}
                  >
                    ●
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="query-panel">
          <div className="query-editor">
            <div className="editor-header">
              <h4>Query Editor</h4>
              {activeConnection && (
                <span className="active-connection">
                  Connected to: {connections.find(c => c.id === activeConnection)?.name}
                </span>
              )}
            </div>

            <textarea
              value={currentQuery}
              onChange={(e) => setCurrentQuery(e.target.value)}
              placeholder={activeConnection ? 
                "Enter your SQL query here...\n\nExample:\nSELECT * FROM users WHERE created_at > '2024-01-01';" :
                "Select a connection first to start querying..."
              }
              disabled={!activeConnection}
              className="query-textarea"
            />

            <div className="query-actions">
              <button 
                onClick={executeQuery}
                disabled={!activeConnection || !currentQuery.trim() || isExecuting}
                className="execute-btn"
              >
                {isExecuting ? 'Executing...' : '▶ Execute Query'}
              </button>
              
              <button 
                onClick={() => setCurrentQuery('')}
                className="clear-btn"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        <div className="results-panel">
          <h4>Query History ({queryHistory.length})</h4>
          
          <div className="query-history">
            {queryHistory.map(result => (
              <div key={result.id} className="query-result">
                <div className="result-header">
                  <span className="result-time">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="result-stats">
                    {result.rowsAffected} rows • {result.executionTime}
                  </span>
                </div>
                
                <div className="result-query">
                  <code>{result.query}</code>
                </div>
                
                {result.results.length > 0 && (
                  <div className="result-data">
                    <table>
                      <thead>
                        <tr>
                          {Object.keys(result.results[0]).map(key => (
                            <th key={key}>{key}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {result.results.slice(0, 5).map((row, index) => (
                          <tr key={index}>
                            {Object.values(row).map((value, i) => (
                              <td key={i}>{String(value)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .database-connector {
          padding: 20px;
          height: 100vh;
          overflow: hidden;
          color: #c9d1d9;
        }

        .database-header {
          text-align: center;
          margin-bottom: 20px;
        }

        .database-header h2 {
          color: white;
          margin-bottom: 5px;
        }

        .database-workspace {
          display: grid;
          grid-template-columns: 300px 1fr 350px;
          gap: 20px;
          height: calc(100vh - 120px);
        }

        .connections-panel,
        .query-panel,
        .results-panel {
          background: #161b22;
          border-radius: 12px;
          padding: 15px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .panel-header h3 {
          color: white;
          margin: 0;
        }

        .add-connection-btn {
          background: #238636;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
        }

        .connection-form {
          background: #0d1117;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 15px;
        }

        .form-group {
          margin-bottom: 12px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 10px;
        }

        .form-group label {
          display: block;
          margin-bottom: 4px;
          color: #8b949e;
          font-size: 12px;
          font-weight: 600;
        }

        .form-group input,
        .form-group select {
          width: 100%;
          padding: 8px;
          background: #21262d;
          border: 1px solid #30363d;
          border-radius: 6px;
          color: #c9d1d9;
          font-size: 14px;
        }

        .form-actions {
          display: flex;
          gap: 8px;
        }

        .connect-btn {
          background: #238636;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
        }

        .cancel-btn {
          background: #656d76;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
        }

        .connections-list {
          flex: 1;
          overflow-y: auto;
        }

        .connection-item {
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 8px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .connection-item:hover {
          background: #21262d;
        }

        .connection-item.active {
          background: #0d1117;
          border: 1px solid #4CAF50;
        }

        .connection-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .connection-icon {
          font-size: 20px;
        }

        .connection-details {
          flex: 1;
        }

        .connection-name {
          font-weight: 600;
          color: white;
        }

        .connection-meta {
          font-size: 12px;
          color: #8b949e;
        }

        .connection-status {
          font-size: 16px;
        }

        .query-editor {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .editor-header h4 {
          color: white;
          margin: 0;
        }

        .active-connection {
          font-size: 12px;
          color: #4CAF50;
        }

        .query-textarea {
          flex: 1;
          background: #0d1117;
          border: 1px solid #30363d;
          border-radius: 8px;
          padding: 15px;
          color: #c9d1d9;
          font-family: monospace;
          font-size: 14px;
          resize: none;
          margin-bottom: 10px;
        }

        .query-actions {
          display: flex;
          gap: 10px;
        }

        .execute-btn {
          background: #238636;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
        }

        .execute-btn:disabled {
          background: #656d76;
          cursor: not-allowed;
        }

        .clear-btn {
          background: #656d76;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
        }

        .results-panel h4 {
          color: white;
          margin-bottom: 15px;
        }

        .query-history {
          flex: 1;
          overflow-y: auto;
        }

        .query-result {
          background: #0d1117;
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 10px;
        }

        .result-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 12px;
        }

        .result-time {
          color: #8b949e;
        }

        .result-stats {
          color: #4CAF50;
        }

        .result-query {
          background: #21262d;
          padding: 8px;
          border-radius: 4px;
          margin-bottom: 8px;
        }

        .result-query code {
          font-size: 12px;
          color: #c9d1d9;
        }

        .result-data table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }

        .result-data th,
        .result-data td {
          padding: 4px 8px;
          border: 1px solid #30363d;
          text-align: left;
        }

        .result-data th {
          background: #21262d;
          color: white;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};