from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import asyncio
import json
import assemblyai as aai
from anthropic import AsyncAnthropic
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime
from typing import List, Dict
import uuid

from config import config

# Initialize Firebase
try:
    cred = credentials.Certificate(config.FIREBASE_CREDENTIALS_PATH)
    firebase_admin.initialize_app(cred)
    db = firestore.client()
except Exception as e:
    print(f"Firebase initialization failed: {e}")
    db = None

# Initialize AI clients
aai.settings.api_key = config.ASSEMBLYAI_API_KEY
anthropic = AsyncAnthropic(api_key=config.ANTHROPIC_API_KEY)

app = FastAPI()

class VoiceCommandEngine:
    def __init__(self):
        self.context_window: List[Dict] = []
        self.max_context = config.CONTEXT_WINDOW_SIZE
        
    async def process_audio_stream(self, websocket: WebSocket, user_id: str):
        transcriber = aai.RealtimeTranscriber(
            sample_rate=config.VOICE_SAMPLE_RATE,
            on_data=lambda transcript: asyncio.create_task(
                self.handle_transcript(transcript, websocket, user_id)
            )
        )
        
        transcriber.connect()
        
        try:
            while True:
                audio_data = await websocket.receive_bytes()
                transcriber.stream(audio_data)
        except WebSocketDisconnect:
            transcriber.close()
    
    async def handle_transcript(self, transcript: aai.RealtimeTranscript, websocket: WebSocket, user_id: str):
        if not transcript.text or transcript.text.strip() == "":
            return
            
        # Add to context window
        context_entry = {
            'timestamp': datetime.now().isoformat(),
            'text': transcript.text,
            'confidence': transcript.confidence,
            'user_id': user_id
        }
        
        self.context_window.append(context_entry)
        if len(self.context_window) > self.max_context:
            self.context_window.pop(0)
        
        # Detect intent using Claude
        intent = await self.detect_intent(transcript.text, user_id)
        
        # Execute command
        result = await self.execute_command(intent, transcript.text, user_id)
        
        # Store in Firebase
        await self.store_interaction(user_id, transcript.text, intent, result)
        
        # Send result back
        await websocket.send_json({
            'type': 'voice_result',
            'transcript': transcript.text,
            'intent': intent,
            'result': result,
            'timestamp': datetime.now().isoformat()
        })
    
    async def detect_intent(self, text: str, user_id: str) -> Dict:
        context_str = json.dumps(self.context_window[-3:])
        
        prompt = f"""
        Analyze this voice command for coding intent:
        
        Command: "{text}"
        Recent context: {context_str}
        
        Return JSON only:
        {{
            "intent": "create|modify|delete|debug|test|explain",
            "target": "file|function|class|endpoint|test",
            "action": "specific_action_description",
            "parameters": {{}},
            "confidence": 0.95
        }}
        """
        
        response = await anthropic.messages.create(
            model="claude-3-sonnet-20240229",
            max_tokens=500,
            messages=[{"role": "user", "content": prompt}]
        )
        
        try:
            return json.loads(response.content[0].text)
        except:
            return {"intent": "unknown", "confidence": 0.0}
    
    async def execute_command(self, intent: Dict, raw_text: str, user_id: str) -> Dict:
        if intent['intent'] == 'create':
            return await self.create_code(intent, raw_text, user_id)
        elif intent['intent'] == 'modify':
            return await self.modify_code(intent, raw_text, user_id)
        elif intent['intent'] == 'debug':
            return await self.debug_code(intent, raw_text, user_id)
        elif intent['intent'] == 'test':
            return await self.run_tests(intent, raw_text, user_id)
        else:
            return {"action": "unknown", "message": "Command not recognized"}
    
    async def create_code(self, intent: Dict, raw_text: str, user_id: str) -> Dict:
        prompt = f"""
        Generate Python code for: {raw_text}
        
        Context: {intent}
        Requirements: Production-ready, well-documented
        
        Return only the code, no explanations.
        """
        
        response = await anthropic.messages.create(
            model="claude-3-sonnet-20240229",
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}]
        )
        
        generated_code = response.content[0].text
        
        return {
            'action': 'created',
            'code': generated_code,
            'file_path': intent.get('target', 'generated_code.py'),
            'language': 'python'
        }
    
    async def modify_code(self, intent: Dict, raw_text: str, user_id: str) -> Dict:
        return {'action': 'modified', 'changes': []}
    
    async def debug_code(self, intent: Dict, raw_text: str, user_id: str) -> Dict:
        return {'action': 'debugged', 'issues_found': []}
    
    async def run_tests(self, intent: Dict, raw_text: str, user_id: str) -> Dict:
        return {'action': 'tested', 'test_results': []}
    
    async def store_interaction(self, user_id: str, command: str, intent: Dict, result: Dict):
        doc_ref = db.collection('voice_interactions').document()
        doc_ref.set({
            'user_id': user_id,
            'command': command,
            'intent': intent,
            'result': result,
            'timestamp': firestore.SERVER_TIMESTAMP,
            'session_id': str(uuid.uuid4())
        })

voice_engine = VoiceCommandEngine()

@app.websocket("/voice/{user_id}")
async def voice_websocket(websocket: WebSocket, user_id: str):
    await websocket.accept()
    await voice_engine.process_audio_stream(websocket, user_id)

@app.get("/voice/history/{user_id}")
async def get_voice_history(user_id: str):
    docs = db.collection('voice_interactions')\
        .where('user_id', '==', user_id)\
        .order_by('timestamp', direction=firestore.Query.DESCENDING)\
        .limit(50)\
        .get()
    
    return [doc.to_dict() for doc in docs]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)