from anthropic import AsyncAnthropic
from openai import AsyncOpenAI
import google.generativeai as genai
from typing import List, Dict
import asyncio
import json
from datetime import datetime
import firebase_admin
from firebase_admin import firestore
from config import config
import time

class AIOrchestrator:
    def __init__(self):
        self.claude = AsyncAnthropic(api_key=config.ANTHROPIC_API_KEY)
        self.openai = AsyncOpenAI(api_key=config.OPENAI_API_KEY)
        genai.configure(api_key=config.GOOGLE_API_KEY)
        self.gemini = genai.GenerativeModel('gemini-pro')
        self.db = firestore.client()
        
        self.model_roles = {
            'architect': 'claude-3-sonnet-20240229',
            'coder': 'gpt-4-turbo-preview',
            'reviewer': 'claude-3-opus-20240229',
            'explainer': 'gemini-pro',
            'debugger': 'gpt-4-turbo-preview',
            'optimizer': 'claude-3-sonnet-20240229'
        }
    
    async def collaborative_code_generation(self, prompt: str, user_id: str, context: dict):
        try:
            # Step 1: Claude designs architecture
            architecture = await self._retry_api_call(
                self.claude.messages.create,
                model="claude-3-sonnet-20240229",
                max_tokens=4000,
                messages=[{
                    "role": "user",
                    "content": f"""
                    Design system architecture for: {prompt}
                    
                    User context: {context}
                    
                    Provide JSON with:
                    1. High-level architecture
                    2. Component breakdown
                    3. Data flow
                    4. API design
                    """
                }]
            )
            
            arch_design = json.loads(architecture.content[0].text)
            
            # Step 2: GPT-4 generates implementation
            implementation = await self._retry_api_call(
                self.openai.chat.completions.create,
                model="gpt-4-turbo-preview",
                messages=[{
                    "role": "system",
                    "content": "You are an expert Python developer."
                }, {
                    "role": "user",
                    "content": f"""
                    Implement this architecture:
                    {json.dumps(arch_design, indent=2)}
                    
                    Requirements: {prompt}
                    
                    Generate complete, production-ready Python code.
                    """
                }]
            )
            
            code = implementation.choices[0].message.content
            
            # Step 3: Claude Opus reviews code
            review = await self._retry_api_call(
                self.claude.messages.create,
                model="claude-3-opus-20240229",
                max_tokens=2000,
                messages=[{
                    "role": "user",
                    "content": f"""
                    Review this code for security, performance, best practices, edge cases:
                    
                    {code}
                    
                    Return JSON with issues and suggestions.
                    """
                }]
            )
            
            review_results = json.loads(review.content[0].text)
            
            # Step 4: Refactor if issues found
            if review_results.get('issues'):
                refactored = await self._retry_api_call(
                    self.openai.chat.completions.create,
                    model="gpt-4-turbo-preview",
                    messages=[{
                        "role": "user",
                        "content": f"""
                        Refactor this code to address these issues:
                        {json.dumps(review_results['issues'], indent=2)}
                        
                        Original code:
                        {code}
                        """
                    }]
                )
                code = refactored.choices[0].message.content
            
            # Step 5: Gemini generates documentation
            doc_response = await self._retry_api_call(
                self.gemini.generate_content,
                f"""
                Generate comprehensive documentation for:
                
                Architecture: {json.dumps(arch_design)}
                Code: {code}
                
                Include usage examples and API reference.
                """
            )
            
            documentation = doc_response.text
            
            # Step 6: Store in Firebase
            result_ref = self.db.collection('ai_collaborations').document()
            result_ref.set({
                'user_id': user_id,
                'prompt': prompt,
                'architecture': arch_design,
                'code': code,
                'review': review_results,
                'documentation': documentation,
                'models_used': list(self.model_roles.values()),
                'timestamp': firestore.SERVER_TIMESTAMP
            })
            
            return {
                'architecture': arch_design,
                'code': code,
                'review': review_results,
                'documentation': documentation,
                'collaboration_id': result_ref.id
            }
            
        except Exception as e:
            return {'error': str(e), 'status': 'failed'}
    
    async def consensus_decision(self, question: str, options: List[str]):
        responses = await asyncio.gather(
            self.ask_claude(question, options),
            self.ask_gpt(question, options),
            self.ask_gemini(question, options),
            return_exceptions=True
        )
        
        valid_responses = [r for r in responses if not isinstance(r, Exception)]
        
        if not valid_responses:
            return {'error': 'All AI models failed to respond'}
        
        return await self.analyze_consensus(valid_responses)
    
    async def ask_claude(self, question: str, options: List[str]):
        response = await self._retry_api_call(
            self.claude.messages.create,
            model="claude-3-sonnet-20240229",
            max_tokens=1000,
            messages=[{
                "role": "user",
                "content": f"""
                {question}
                
                Options: {options}
                
                Choose the best option and explain why in JSON:
                {{"choice": "...", "reasoning": "...", "confidence": 0.0-1.0}}
                """
            }]
        )
        return json.loads(response.content[0].text)
    
    async def ask_gpt(self, question: str, options: List[str]):
        response = await self._retry_api_call(
            self.openai.chat.completions.create,
            model="gpt-4-turbo-preview",
            response_format={"type": "json_object"},
            messages=[{
                "role": "user",
                "content": f"""
                {question}
                
                Options: {options}
                
                Choose the best option and explain why in JSON:
                {{"choice": "...", "reasoning": "...", "confidence": 0.0-1.0}}
                """
            }]
        )
        return json.loads(response.choices[0].message.content)
    
    async def ask_gemini(self, question: str, options: List[str]):
        response = await self._retry_api_call(
            self.gemini.generate_content,
            f"""
            {question}
            
            Options: {options}
            
            Choose the best option and explain why in JSON format.
            """
        )
        return json.loads(response.text)
    
    async def analyze_consensus(self, responses: List[Dict]):
        choices = [r.get('choice') for r in responses if r.get('choice')]
        
        if not choices:
            return {'consensus': None, 'confidence': 0.0}
        
        # Find most common choice
        choice_counts = {}
        for choice in choices:
            choice_counts[choice] = choice_counts.get(choice, 0) + 1
        
        consensus_choice = max(choice_counts, key=choice_counts.get)
        consensus_count = choice_counts[consensus_choice]
        
        # Calculate confidence based on agreement
        confidence = consensus_count / len(responses)
        
        # Get reasoning from responses that chose consensus
        reasoning = []
        for r in responses:
            if r.get('choice') == consensus_choice:
                reasoning.append(r.get('reasoning', ''))
        
        return {
            'consensus': consensus_choice,
            'confidence': confidence,
            'reasoning': reasoning,
            'all_responses': responses
        }
    
    async def _retry_api_call(self, func, *args, **kwargs):
        max_retries = 3
        base_delay = 1
        
        for attempt in range(max_retries):
            try:
                return await func(*args, **kwargs)
            except Exception as e:
                if attempt == max_retries - 1:
                    raise e
                
                delay = base_delay * (2 ** attempt)
                await asyncio.sleep(delay)
        
        raise Exception("Max retries exceeded")
    
    async def specialized_task(self, task_type: str, prompt: str, user_id: str):
        model = self.model_roles.get(task_type, 'claude-3-sonnet-20240229')
        
        if 'claude' in model:
            response = await self._retry_api_call(
                self.claude.messages.create,
                model=model,
                max_tokens=2000,
                messages=[{"role": "user", "content": prompt}]
            )
            result = response.content[0].text
        elif 'gpt' in model:
            response = await self._retry_api_call(
                self.openai.chat.completions.create,
                model=model,
                messages=[{"role": "user", "content": prompt}]
            )
            result = response.choices[0].message.content
        elif 'gemini' in model:
            response = await self._retry_api_call(
                self.gemini.generate_content,
                prompt
            )
            result = response.text
        else:
            result = "Unknown model type"
        
        # Store specialized task result
        self.db.collection('specialized_tasks').add({
            'user_id': user_id,
            'task_type': task_type,
            'model': model,
            'prompt': prompt,
            'result': result,
            'timestamp': firestore.SERVER_TIMESTAMP
        })
        
        return {'result': result, 'model': model, 'task_type': task_type}