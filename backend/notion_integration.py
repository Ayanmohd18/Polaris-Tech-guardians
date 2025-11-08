from notion_client import AsyncClient
from fastapi import FastAPI, BackgroundTasks
import asyncio
import json
from datetime import datetime
from typing import Dict, List
import firebase_admin
from firebase_admin import firestore
from anthropic import AsyncAnthropic
import uuid
from config import config

app = FastAPI()
db = firestore.client()
anthropic = AsyncAnthropic(api_key=config.ANTHROPIC_API_KEY)

class NotionSyncEngine:
    def __init__(self, notion_token: str = None):
        token = notion_token or config.NOTION_TOKEN
        self.notion = AsyncClient(auth=token)
        self.sync_active = {}
        
    async def setup_workspace_sync(self, user_id: str, workspace_id: str):
        pages = await self.notion.search(
            filter={"property": "object", "value": "page"}
        )
        
        for page in pages['results']:
            page_id = page['id']
            page_title = self.get_page_title(page)
            
            db.collection('notion_sync').document(page_id).set({
                'user_id': user_id,
                'workspace_id': workspace_id,
                'page_title': page_title,
                'last_sync': firestore.SERVER_TIMESTAMP,
                'sync_enabled': True
            })
        
        self.sync_active[user_id] = True
        asyncio.create_task(self.continuous_sync(user_id, workspace_id))
    
    async def task_to_code_branch(self, task_page_id: str):
        task = await self.notion.pages.retrieve(page_id=task_page_id)
        task_title = self.get_page_title(task)
        task_description = await self.get_page_content(task_page_id)
        
        prompt = f"""
        Create implementation plan for:
        Title: {task_title}
        Description: {task_description}
        
        Return JSON:
        {{
            "branch_name": "feature/...",
            "files_to_create": [],
            "files_to_modify": [],
            "implementation_steps": [],
            "estimated_complexity": "low|medium|high",
            "suggested_tests": []
        }}
        """
        
        response = await anthropic.messages.create(
            model="claude-3-sonnet-20240229",
            max_tokens=1000,
            messages=[{"role": "user", "content": prompt}]
        )
        
        plan = json.loads(response.content[0].text)
        branch_id = await self.create_code_branch(plan)
        
        await self.notion.pages.update(
            page_id=task_page_id,
            properties={
                "Code Branch": {
                    "url": f"https://nexus.dev/branch/{branch_id}"
                },
                "Status": {"status": {"name": "In Progress"}}
            }
        )
        
        return plan
    
    async def code_to_notion_docs(self, file_path: str, code_content: str):
        analysis = await self.analyze_code(code_content)
        
        prompt = f"""
        Generate Notion documentation for:
        File: {file_path}
        Analysis: {analysis}
        
        Return Notion blocks JSON with overview, functions, usage examples.
        """
        
        response = await anthropic.messages.create(
            model="claude-3-sonnet-20240229",
            max_tokens=1500,
            messages=[{"role": "user", "content": prompt}]
        )
        
        doc_content = json.loads(response.content[0].text)
        
        page = await self.notion.pages.create(
            parent={"database_id": self.get_docs_database_id()},
            properties={
                "Name": {"title": [{"text": {"content": file_path}}]},
                "Type": {"select": {"name": "Auto-Generated"}},
                "Last Updated": {"date": {"start": datetime.now().isoformat()}}
            },
            children=doc_content
        )
        
        return page['url']
    
    async def continuous_sync(self, user_id: str, workspace_id: str):
        while self.sync_active.get(user_id, False):
            notion_updates = await self.check_notion_updates(user_id)
            for update in notion_updates:
                await self.sync_notion_to_code(update)
            
            code_updates = await self.check_code_updates(user_id)
            for update in code_updates:
                await self.sync_code_to_notion(update)
            
            await asyncio.sleep(config.SYNC_INTERVAL)
    
    async def sync_notion_to_code(self, update: dict):
        page_id = update['page_id']
        changes = update['changes']
        
        sync_record = db.collection('notion_sync').document(page_id).get()
        if not sync_record.exists:
            return
        
        code_file = sync_record.to_dict().get('linked_file')
        
        if changes['type'] == 'task_updated':
            await self.update_code_from_task(code_file, changes)
        elif changes['type'] == 'spec_changed':
            await self.regenerate_code_from_spec(code_file, changes)
    
    async def sync_code_to_notion(self, update: dict):
        file_path = update['file_path']
        commit_message = update['commit_message']
        changes = update['changes']
        
        linked_pages = db.collection('notion_sync')\
            .where('linked_file', '==', file_path)\
            .get()
        
        for page_doc in linked_pages:
            page_id = page_doc.id
            
            await self.notion.blocks.children.append(
                block_id=page_id,
                children=[{
                    "object": "block",
                    "type": "callout",
                    "callout": {
                        "rich_text": [{
                            "type": "text",
                            "text": {
                                "content": f"Code updated: {commit_message}\n{changes['summary']}"
                            }
                        }],
                        "icon": {"emoji": "🔄"}
                    }
                }]
            )
    
    def get_page_title(self, page: dict) -> str:
        properties = page.get('properties', {})
        title_prop = properties.get('title') or properties.get('Name')
        if title_prop and title_prop.get('title'):
            return title_prop['title'][0]['text']['content']
        return "Untitled"
    
    async def get_page_content(self, page_id: str) -> str:
        blocks = await self.notion.blocks.children.list(block_id=page_id)
        content = []
        for block in blocks['results']:
            if block['type'] == 'paragraph':
                text = block['paragraph']['rich_text']
                if text:
                    content.append(text[0]['text']['content'])
        return '\n'.join(content)
    
    async def analyze_code(self, code: str) -> dict:
        return {
            'functions': [],
            'classes': [],
            'imports': [],
            'complexity': 'medium'
        }
    
    async def create_code_branch(self, plan: dict) -> str:
        branch_id = str(uuid.uuid4())
        db.collection('code_branches').document(branch_id).set({
            'plan': plan,
            'created_at': firestore.SERVER_TIMESTAMP,
            'status': 'created'
        })
        return branch_id
    
    def get_docs_database_id(self) -> str:
        return config.DOCS_DATABASE_ID
    
    async def check_notion_updates(self, user_id: str) -> List[dict]:
        return []
    
    async def check_code_updates(self, user_id: str) -> List[dict]:
        return []
    
    async def update_code_from_task(self, code_file: str, changes: dict):
        pass
    
    async def regenerate_code_from_spec(self, code_file: str, changes: dict):
        pass

notion_engine = NotionSyncEngine("your_notion_token")

@app.post("/notion/setup/{user_id}")
async def setup_notion_sync(user_id: str, workspace_id: str):
    await notion_engine.setup_workspace_sync(user_id, workspace_id)
    return {"status": "sync_enabled"}

@app.post("/notion/task-to-branch")
async def convert_task_to_branch(task_page_id: str):
    plan = await notion_engine.task_to_code_branch(task_page_id)
    return {"plan": plan}

@app.post("/notion/code-to-docs")
async def generate_docs_from_code(file_path: str, code_content: str):
    doc_url = await notion_engine.code_to_notion_docs(file_path, code_content)
    return {"doc_url": doc_url}

@app.get("/notion/sync-status/{user_id}")
async def get_sync_status(user_id: str):
    docs = db.collection('notion_sync')\
        .where('user_id', '==', user_id)\
        .get()
    
    return {
        "synced_pages": len(docs),
        "last_sync": datetime.now().isoformat(),
        "status": "active"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)