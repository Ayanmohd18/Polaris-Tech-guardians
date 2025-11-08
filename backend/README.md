# NEXUS PRO Backend Services

## Features Implemented

### 🎤 Voice Command Engine (`voice_engine.py`)
- **Real-time Audio Processing**: WebSocket streaming with AssemblyAI transcription
- **Context Window**: Maintains last 10 commands for contextual understanding
- **Claude Integration**: Intent detection and code generation using Anthropic's Claude
- **Firebase Storage**: All interactions stored with timestamps and metadata
- **Command Execution**: Create, modify, debug, test, and explain code via voice

### 📝 Notion Integration (`notion_integration.py`)
- **Bidirectional Sync**: 30-second sync cycle between Notion and code
- **Task-to-Branch**: Automatically converts Notion tasks to implementation plans
- **Auto-Documentation**: Generates Notion docs from code comments and structure
- **Conflict Resolution**: Handles sync conflicts with Firebase state tracking
- **Real-time Updates**: Live sync of commit messages to Notion project tracker

## API Endpoints

### Voice Engine
- `WS /voice/{user_id}` - WebSocket for real-time voice processing
- `GET /voice/history/{user_id}` - Retrieve voice command history

### Notion Integration
- `POST /notion/setup/{user_id}` - Initialize workspace sync
- `POST /notion/task-to-branch` - Convert Notion task to code branch
- `POST /notion/code-to-docs` - Generate documentation from code
- `GET /notion/sync-status/{user_id}` - Check sync status

### Health & Status
- `GET /` - API overview and service status
- `GET /health` - Health check for all services

## Setup Instructions

1. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Environment Variables**
   ```bash
   export ASSEMBLYAI_API_KEY="your_assemblyai_key"
   export ANTHROPIC_API_KEY="your_anthropic_key"
   export NOTION_TOKEN="your_notion_integration_token"
   export FIREBASE_CREDENTIALS_PATH="path/to/serviceAccountKey.json"
   export NOTION_DOCS_DB_ID="your_notion_docs_database_id"
   ```

3. **Firebase Setup**
   - Create Firebase project
   - Download service account key
   - Enable Firestore database

4. **Notion Setup**
   - Create Notion integration
   - Get integration token
   - Create docs database and get ID

5. **Start Server**
   ```bash
   python main.py
   ```

## Usage Examples

### Voice Commands
```javascript
// Connect to voice WebSocket
const ws = new WebSocket('ws://localhost:8000/voice/user123');

// Send audio data
ws.send(audioBuffer);

// Receive results
ws.onmessage = (event) => {
  const result = JSON.parse(event.data);
  console.log('Generated code:', result.result.code);
};
```

### Notion Integration
```python
# Setup workspace sync
response = requests.post('http://localhost:8000/notion/setup/user123', 
                        params={'workspace_id': 'workspace456'})

# Convert task to code branch
response = requests.post('http://localhost:8000/notion/task-to-branch',
                        params={'task_page_id': 'notion_page_id'})
```

## Architecture

```
Backend Services/
├── voice_engine.py      # Real-time voice processing
├── notion_integration.py # Bidirectional Notion sync
├── main.py             # FastAPI application
├── config.py           # Configuration management
└── requirements.txt    # Python dependencies
```

## Key Features

- **Real-time Processing**: WebSocket connections for instant feedback
- **Multi-AI Integration**: Claude for intent detection and code generation
- **Firebase Backend**: Persistent storage for all interactions
- **Notion Sync**: Automatic bidirectional synchronization
- **Production Ready**: Error handling, configuration management, health checks