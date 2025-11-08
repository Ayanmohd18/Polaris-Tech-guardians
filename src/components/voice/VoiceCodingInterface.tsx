import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../../services/api/apiClient';

interface VoiceState {
  isListening: boolean;
  isProcessing: boolean;
  transcript: string;
  confidence: number;
  lastCommand: string;
}

interface CodeResult {
  code: string;
  filePath: string;
  action: string;
}

export const VoiceCodingInterface: React.FC = () => {
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isListening: false,
    isProcessing: false,
    transcript: '',
    confidence: 0,
    lastCommand: ''
  });

  const [codeResults, setCodeResults] = useState<CodeResult[]>([]);
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder>();
  const [userId] = useState(() => 'user_' + Math.random().toString(36).substr(2, 9));

  useEffect(() => {
    initializeWebSocket();
    return () => {
      if (wsConnection) {
        wsConnection.close();
      }
    };
  }, []);

  const initializeWebSocket = () => {
    const ws = apiClient.connectWebSocket(userId, handleVoiceResult);
    setWsConnection(ws);
  };

  const handleVoiceResult = (data: any) => {
    if (data.type === 'voice_result') {
      setVoiceState(prev => ({
        ...prev,
        transcript: data.transcript,
        lastCommand: data.transcript,
        isProcessing: false
      }));

      if (data.codeChanges) {
        setCodeResults(prev => [...prev, data.codeChanges]);
      }
    }
  };

  const processVoiceCommand = async (audioBlob: Blob) => {
    try {
      if (!audioBlob || audioBlob.size === 0) {
        throw new Error('Invalid audio data');
      }
      
      setVoiceState(prev => ({ ...prev, isProcessing: true }));
      
      const transcription = await apiClient.transcribeAudio(audioBlob);
      
      if (transcription.error) {
        throw new Error(transcription.error);
      }
      
      const sanitizedTranscription = transcription.transcription?.replace(/<[^>]*>/g, '') || '';
      
      setVoiceState(prev => ({
        ...prev,
        transcript: sanitizedTranscription,
        confidence: transcription.confidence || 0
      }));
      
      if (transcription.confidence > 0.7 && sanitizedTranscription.length > 0) {
        try {
          const result = await apiClient.executeVoiceCommand(sanitizedTranscription);
          
          if (result?.code && typeof result.code === 'string') {
            const sanitizedCode = result.code.replace(/<script[^>]*>.*?<\/script>/gi, '');
            const sanitizedFilePath = (result.filePath || 'generated.tsx').replace(/[<>"']/g, '');
            
            setCodeResults(prev => [...prev, {
              code: sanitizedCode,
              filePath: sanitizedFilePath,
              action: result.action || 'CREATE',
              timestamp: new Date().toISOString()
            }]);
          }
        } catch (commandError) {
          console.error('Command execution error:', commandError);
          setVoiceState(prev => ({ ...prev, transcript: `Error: ${commandError.message}` }));
        }
      }
    } catch (error) {
      console.error('Voice processing error:', error);
      setVoiceState(prev => ({ 
        ...prev, 
        transcript: `Error: ${error.message || 'Voice processing failed'}` 
      }));
    } finally {
      setVoiceState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const startListening = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Audio recording not supported in this browser');
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/wav'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      setVoiceState(prev => ({ ...prev, isListening: true }));

      const audioChunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        try {
          stream.getTracks().forEach(track => track.stop());
          
          if (audioChunks.length > 0) {
            const audioBlob = new Blob(audioChunks, { type: mediaRecorder.mimeType });
            await processVoiceCommand(audioBlob);
          }
        } catch (error) {
          console.error('Error processing recorded audio:', error);
        }
      };
      
      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setVoiceState(prev => ({ ...prev, isListening: false, isProcessing: false }));
      };

      mediaRecorder.start(1000); // Collect data every second
    } catch (error) {
      console.error('Error starting voice recording:', error);
      setVoiceState(prev => ({ 
        ...prev, 
        isListening: false, 
        transcript: `Microphone error: ${error.message}` 
      }));
    }
  };

  const stopListening = () => {
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        setVoiceState(prev => ({ 
          ...prev, 
          isListening: false, 
          isProcessing: true 
        }));
      }
    } catch (error) {
      console.error('Error stopping voice recording:', error);
      setVoiceState(prev => ({ ...prev, isListening: false, isProcessing: false }));
    }
  };

  const clearResults = () => {
    setCodeResults([]);
    setVoiceState(prev => ({ ...prev, transcript: '', lastCommand: '' }));
  };

  return (
    <div className="voice-coding-interface">
      <div className="voice-controls">
        <div className="voice-status">
          <div className={`status-indicator ${voiceState.isListening ? 'listening' : voiceState.isProcessing ? 'processing' : 'idle'}`}>
            {voiceState.isListening ? '🎤 Listening...' : 
             voiceState.isProcessing ? '⚡ Processing...' : 
             '💤 Ready'}
          </div>
          
          {voiceState.confidence > 0 && (
            <div className="confidence-meter">
              Confidence: {Math.round(voiceState.confidence * 100)}%
            </div>
          )}
        </div>

        <div className="voice-buttons">
          <button 
            onClick={voiceState.isListening ? stopListening : startListening}
            className={`voice-btn ${voiceState.isListening ? 'stop' : 'start'}`}
            disabled={voiceState.isProcessing}
          >
            {voiceState.isListening ? 'Stop' : 'Start Voice Coding'}
          </button>
          
          <button onClick={clearResults} className="clear-btn">
            Clear Results
          </button>
        </div>
      </div>

      <div className="voice-transcript">
        <h3>Live Transcript</h3>
        <div className="transcript-box">
          {voiceState.transcript || 'Say something like: "Create a FastAPI endpoint for user authentication"'}
        </div>
      </div>

      <div className="voice-commands-help">
        <h4>Voice Commands Examples:</h4>
        <ul>
          <li>"Create a React component for user profile"</li>
          <li>"Add error handling to the login function"</li>
          <li>"Generate tests for the API endpoint"</li>
          <li>"Debug the authentication issue"</li>
          <li>"Optimize the database query performance"</li>
        </ul>
      </div>

      <div className="code-results">
        <h3>Generated Code ({codeResults.length})</h3>
        {codeResults.map((result, index) => (
          <div key={index} className="code-result">
            <div className="result-header">
              <span className="action-badge">{result.action}</span>
              <span className="file-path">{result.filePath}</span>
            </div>
            <pre className="code-block">
              <code>{result.code}</code>
            </pre>
          </div>
        ))}
      </div>

      <style jsx>{`
        .voice-coding-interface {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .voice-controls {
          background: #1a1a1a;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .voice-status {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 15px;
        }

        .status-indicator {
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: bold;
        }

        .status-indicator.listening {
          background: #ff4444;
          color: white;
          animation: pulse 1s infinite;
        }

        .status-indicator.processing {
          background: #ffaa00;
          color: white;
        }

        .status-indicator.idle {
          background: #44ff44;
          color: black;
        }

        .confidence-meter {
          background: #333;
          padding: 4px 12px;
          border-radius: 12px;
          color: #ccc;
        }

        .voice-buttons {
          display: flex;
          gap: 10px;
        }

        .voice-btn {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.2s;
        }

        .voice-btn.start {
          background: #4CAF50;
          color: white;
        }

        .voice-btn.stop {
          background: #f44336;
          color: white;
        }

        .clear-btn {
          padding: 12px 24px;
          background: #666;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
        }

        .voice-transcript {
          background: #2a2a2a;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .transcript-box {
          background: #1a1a1a;
          padding: 15px;
          border-radius: 8px;
          min-height: 60px;
          color: #ccc;
          font-family: monospace;
        }

        .voice-commands-help {
          background: #2a2a2a;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .voice-commands-help ul {
          list-style: none;
          padding: 0;
        }

        .voice-commands-help li {
          padding: 8px 0;
          color: #ccc;
          border-bottom: 1px solid #444;
        }

        .code-results {
          background: #2a2a2a;
          border-radius: 12px;
          padding: 20px;
        }

        .code-result {
          background: #1a1a1a;
          border-radius: 8px;
          margin-bottom: 15px;
          overflow: hidden;
        }

        .result-header {
          background: #333;
          padding: 10px 15px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .action-badge {
          background: #4CAF50;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
        }

        .file-path {
          color: #ccc;
          font-family: monospace;
        }

        .code-block {
          margin: 0;
          padding: 15px;
          background: #0d1117;
          color: #c9d1d9;
          overflow-x: auto;
        }

        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }

        h3, h4 {
          color: white;
          margin-top: 0;
        }
      `}</style>
    </div>
  );
};