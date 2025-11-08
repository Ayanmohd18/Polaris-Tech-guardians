import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase/config';
import { collection, onSnapshot } from 'firebase/firestore';

interface NotionPage {
  id: string;
  title: string;
  lastSync: string;
  syncEnabled: boolean;
  linkedFile?: string;
}

export const NotionSyncPanel: React.FC = () => {
  const [notionPages, setNotionPages] = useState<NotionPage[]>([]);
  const [syncStatus, setSyncStatus] = useState({
    syncedPages: 0,
    lastSync: 'Never',
    status: 'inactive' as 'active' | 'inactive' | 'error'
  });
  const [workspaceId, setWorkspaceId] = useState('');
  const [isSetupMode, setIsSetupMode] = useState(true);
  const [userId] = useState(() => 'user_' + Math.random().toString(36).substr(2, 9));

  useEffect(() => {
    if (!isSetupMode) {
      const unsubscribe = onSnapshot(
        collection(db, 'notion_sync'),
        (snapshot) => {
          const pages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as NotionPage[];
          setNotionPages(pages);
          setSyncStatus(prev => ({
            ...prev,
            syncedPages: pages.length,
            status: 'active' as const
          }));
        }
      );
      return unsubscribe;
    }
  }, [isSetupMode]);

  const setupNotionSync = async () => {
    if (!workspaceId.trim()) return;

    try {
      const response = await fetch(`http://localhost:8000/notion/setup/${userId}?workspace_id=${workspaceId}`, {
        method: 'POST'
      });

      if (response.ok) {
        setIsSetupMode(false);
        setSyncStatus(prev => ({ ...prev, status: 'active', lastSync: new Date().toLocaleString() }));
      }
    } catch (error) {
      setSyncStatus(prev => ({ ...prev, status: 'error' }));
    }
  };

  const convertTaskToBranch = async (pageId: string) => {
    try {
      await fetch('http://localhost:8000/notion/task-to-branch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_page_id: pageId })
      });
    } catch (error) {
      console.error('Failed to convert task:', error);
    }
  };

  if (isSetupMode) {
    return (
      <div className="notion-setup">
        <h2>📝 Notion Integration Setup</h2>
        <div className="setup-form">
          <input
            type="text"
            value={workspaceId}
            onChange={(e) => setWorkspaceId(e.target.value)}
            placeholder="Enter Notion Workspace ID"
            className="workspace-input"
          />
          <button onClick={setupNotionSync} className="setup-btn">
            Connect Notion Workspace
          </button>
        </div>
        
        <div className="setup-info">
          <h3>What you'll get:</h3>
          <ul>
            <li>✅ Tasks automatically become code branches</li>
            <li>✅ Code comments sync to Notion docs</li>
            <li>✅ Commit messages update project tracker</li>
            <li>✅ Bidirectional sync every 30 seconds</li>
          </ul>
        </div>

        <style jsx>{`
          .notion-setup {
            padding: 40px;
            text-align: center;
            background: #1a1a1a;
            border-radius: 12px;
            color: #c9d1d9;
          }

          .workspace-input {
            padding: 12px;
            width: 300px;
            background: #2a2a2a;
            border: 1px solid #444;
            border-radius: 6px;
            color: #c9d1d9;
            margin-right: 10px;
          }

          .setup-btn {
            padding: 12px 24px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: bold;
          }

          .setup-info {
            background: #2a2a2a;
            padding: 20px;
            border-radius: 8px;
            text-align: left;
            max-width: 400px;
            margin: 20px auto 0;
          }

          .setup-info ul {
            list-style: none;
            padding: 0;
          }

          .setup-info li {
            padding: 8px 0;
            border-bottom: 1px solid #444;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="notion-sync-panel">
      <div className="sync-header">
        <h2>📝 Notion Sync Dashboard</h2>
        <div className={`sync-status ${syncStatus.status}`}>
          <span className="status-dot"></span>
          {syncStatus.status === 'active' ? 'Syncing' : 
           syncStatus.status === 'error' ? 'Error' : 'Inactive'}
        </div>
      </div>

      <div className="sync-stats">
        <div className="stat-card">
          <div className="stat-number">{syncStatus.syncedPages}</div>
          <div className="stat-label">Synced Pages</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">30s</div>
          <div className="stat-label">Sync Interval</div>
        </div>
      </div>

      <div className="pages-list">
        <h3>Notion Pages ({notionPages.length})</h3>
        {notionPages.map(page => (
          <div key={page.id} className="page-item">
            <div className="page-info">
              <div className="page-title">{page.title}</div>
              <div className="page-meta">
                Last sync: {page.lastSync}
              </div>
            </div>
            <button 
              onClick={() => convertTaskToBranch(page.id)}
              className="convert-btn"
            >
              🔄 Convert to Branch
            </button>
          </div>
        ))}
      </div>

      <style jsx>{`
        .notion-sync-panel {
          padding: 20px;
          background: #1a1a1a;
          border-radius: 12px;
          color: #c9d1d9;
        }

        .sync-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .sync-header h2 {
          margin: 0;
          color: white;
        }

        .sync-status {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: bold;
        }

        .sync-status.active {
          background: #28a745;
          color: white;
        }

        .sync-status.error {
          background: #dc3545;
          color: white;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: currentColor;
        }

        .sync-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }

        .stat-card {
          background: #2a2a2a;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
        }

        .stat-number {
          font-size: 24px;
          font-weight: bold;
          color: #4CAF50;
          margin-bottom: 5px;
        }

        .stat-label {
          color: #8b949e;
          font-size: 14px;
        }

        .page-item {
          background: #2a2a2a;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .page-title {
          font-weight: bold;
          color: white;
          margin-bottom: 5px;
        }

        .page-meta {
          font-size: 12px;
          color: #8b949e;
        }

        .convert-btn {
          padding: 6px 12px;
          background: #2196F3;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }
      `}</style>
    </div>
  );
};