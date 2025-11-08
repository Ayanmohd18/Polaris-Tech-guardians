from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
from ai_orchestrator import AIOrchestrator
import asyncio

app = FastAPI(title="AI Orchestrator API")
orchestrator = AIOrchestrator()

class CodeGenerationRequest(BaseModel):
    prompt: str
    user_id: str
    context: Dict = {}

class ConsensusRequest(BaseModel):
    question: str
    options: List[str]

class SpecializedTaskRequest(BaseModel):
    task_type: str  # architect, coder, reviewer, explainer, debugger, optimizer
    prompt: str
    user_id: str

@app.post("/orchestrate/collaborative-code")
async def collaborative_code_generation(request: CodeGenerationRequest):
    """
    Multi-AI collaborative code generation pipeline
    """
    try:
        result = await orchestrator.collaborative_code_generation(
            request.prompt,
            request.user_id,
            request.context
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/orchestrate/consensus")
async def get_consensus(request: ConsensusRequest):
    """
    Get consensus decision from multiple AI models
    """
    try:
        result = await orchestrator.consensus_decision(
            request.question,
            request.options
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/orchestrate/specialized")
async def specialized_task(request: SpecializedTaskRequest):
    """
    Execute specialized task with appropriate AI model
    """
    valid_tasks = ['architect', 'coder', 'reviewer', 'explainer', 'debugger', 'optimizer']
    
    if request.task_type not in valid_tasks:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid task_type. Must be one of: {valid_tasks}"
        )
    
    try:
        result = await orchestrator.specialized_task(
            request.task_type,
            request.prompt,
            request.user_id
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/orchestrate/models")
async def get_model_roles():
    """
    Get current model role assignments
    """
    return {
        "model_roles": orchestrator.model_roles,
        "available_tasks": list(orchestrator.model_roles.keys())
    }

@app.get("/orchestrate/history/{user_id}")
async def get_collaboration_history(user_id: str, limit: int = 10):
    """
    Get user's AI collaboration history
    """
    try:
        docs = orchestrator.db.collection('ai_collaborations')\
            .where('user_id', '==', user_id)\
            .order_by('timestamp', direction=firestore.Query.DESCENDING)\
            .limit(limit)\
            .get()
        
        history = []
        for doc in docs:
            data = doc.to_dict()
            data['id'] = doc.id
            history.append(data)
        
        return {"history": history, "count": len(history)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/orchestrate/batch")
async def batch_processing(requests: List[SpecializedTaskRequest]):
    """
    Process multiple specialized tasks in parallel
    """
    try:
        tasks = [
            orchestrator.specialized_task(req.task_type, req.prompt, req.user_id)
            for req in requests
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        processed_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                processed_results.append({
                    "task_index": i,
                    "error": str(result),
                    "status": "failed"
                })
            else:
                processed_results.append({
                    "task_index": i,
                    "result": result,
                    "status": "success"
                })
        
        return {"results": processed_results, "total": len(requests)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)