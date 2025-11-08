import os
from typing import Optional

class Config:
    # API Keys
    ASSEMBLYAI_API_KEY: str = os.getenv("ASSEMBLYAI_API_KEY", "your_assemblyai_key")
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "your_anthropic_key")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "your_openai_key")
    GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "your_google_key")
    NOTION_TOKEN: str = os.getenv("NOTION_TOKEN", "your_notion_token")
    
    # Firebase
    FIREBASE_CREDENTIALS_PATH: str = os.getenv("FIREBASE_CREDENTIALS_PATH", "serviceAccountKey.json")
    
    # Server
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # Voice Engine
    VOICE_SAMPLE_RATE: int = 16000
    CONTEXT_WINDOW_SIZE: int = 10
    
    # Notion Sync
    SYNC_INTERVAL: int = 30  # seconds
    DOCS_DATABASE_ID: str = os.getenv("NOTION_DOCS_DB_ID", "your_docs_database_id")

config = Config()