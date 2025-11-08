import React, { useState } from 'react';
import { GameGenerator } from '../../services/gameEngine/gameGenerator';

export const GameStudio: React.FC = () => {
  const [gamePrompt, setGamePrompt] = useState('');
  const [generatedGame, setGeneratedGame] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [gameHistory, setGameHistory] = useState<any[]>([]);

  const gameGenerator = new GameGenerator();

  const handleGenerateGame = async () => {
    if (!gamePrompt.trim()) return;

    setIsGenerating(true);
    
    try {
      const game = await gameGenerator.generateGame(gamePrompt);
      setGeneratedGame(game);
      setGameHistory(prev => [game, ...prev.slice(0, 4)]);
    } catch (error) {
      console.error('Failed to generate game:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const playGame = (gameCode: string) => {
    const gameWindow = window.open('', '_blank');
    if (gameWindow) {
      gameWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Generated Game</title>
          <style>
            body { margin: 0; padding: 0; background: #000; overflow: hidden; }
            canvas { display: block; }
          </style>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
        </head>
        <body>
          <script>
            ${gameCode}
          </script>
        </body>
        </html>
      `);
      gameWindow.document.close();
    }
  };

  const gameExamples = [
    "Create a 3D FPS game in space theme with shooting mechanics",
    "Build a 2D platformer game with jumping and collecting coins",
    "Make a 3D racing game with cars on a circular track",
    "Design a puzzle game with block matching mechanics"
  ];

  return (
    <div className="game-studio">
      <div className="studio-header">
        <h2>🎮 Game Studio</h2>
        <p>Describe any game and watch it come to life instantly!</p>
      </div>

      <div className="game-generator">
        <textarea
          value={gamePrompt}
          onChange={(e) => setGamePrompt(e.target.value)}
          placeholder="Describe your game... (e.g., 'Create a 3D FPS game in space with shooting enemies')"
          className="game-prompt"
          rows={4}
        />
        
        <button
          onClick={handleGenerateGame}
          disabled={isGenerating || !gamePrompt.trim()}
          className="generate-btn"
        >
          {isGenerating ? '🔄 Generating Game...' : '🎮 Generate Game'}
        </button>

        <div className="examples-section">
          <h4>Example Prompts:</h4>
          {gameExamples.map((example, index) => (
            <button
              key={index}
              onClick={() => setGamePrompt(example)}
              className="example-btn"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {generatedGame && (
        <div className="generated-game">
          <div className="game-info">
            <h3>🎯 Generated Game</h3>
            <div className="game-details">
              <span className="game-type">{generatedGame.config.type.toUpperCase()}</span>
              <span className="game-genre">{generatedGame.config.genre}</span>
              <span className="game-theme">{generatedGame.config.theme}</span>
            </div>
          </div>

          <div className="game-actions">
            <button
              onClick={() => playGame(generatedGame.code)}
              className="play-btn"
            >
              ▶️ Play Game
            </button>
            <button
              onClick={() => navigator.clipboard.writeText(generatedGame.code)}
              className="copy-btn"
            >
              📋 Copy Code
            </button>
          </div>

          <div className="game-preview">
            <h4>Game Code Preview:</h4>
            <pre className="code-preview">
              <code>{generatedGame.code.substring(0, 500)}...</code>
            </pre>
          </div>
        </div>
      )}

      <div className="game-history">
        <h3>🕒 Recent Games ({gameHistory.length})</h3>
        {gameHistory.map((game, index) => (
          <div key={game.id} className="history-item">
            <div className="history-info">
              <div className="history-title">
                {game.config.genre} Game #{index + 1}
              </div>
              <div className="history-meta">
                {game.config.type} • {game.config.theme}
              </div>
            </div>
            <button
              onClick={() => playGame(game.code)}
              className="mini-play-btn"
            >
              ▶️ Play
            </button>
          </div>
        ))}
      </div>

      <style jsx>{`
        .game-studio {
          padding: 20px;
          background: #1a1a1a;
          border-radius: 12px;
          color: #c9d1d9;
          height: 100vh;
          overflow-y: auto;
        }

        .studio-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .studio-header h2 {
          margin: 0 0 8px 0;
          color: white;
          font-size: 28px;
        }

        .studio-header p {
          color: #8b949e;
          margin: 0;
        }

        .game-generator {
          background: #2a2a2a;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
        }

        .game-prompt {
          width: 100%;
          background: #1a1a1a;
          border: 1px solid #444;
          border-radius: 8px;
          padding: 16px;
          color: #c9d1d9;
          font-size: 14px;
          resize: vertical;
          margin-bottom: 16px;
        }

        .generate-btn {
          padding: 12px 24px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          width: 100%;
          margin-bottom: 20px;
        }

        .generate-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .examples-section h4 {
          color: white;
          margin: 0 0 12px 0;
        }

        .example-btn {
          display: block;
          width: 100%;
          padding: 12px;
          background: #333;
          color: #c9d1d9;
          border: 1px solid #444;
          border-radius: 6px;
          cursor: pointer;
          text-align: left;
          font-size: 14px;
          margin-bottom: 8px;
        }

        .example-btn:hover {
          background: #444;
          border-color: #4CAF50;
        }

        .generated-game {
          background: #2a2a2a;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
        }

        .game-info h3 {
          margin: 0 0 12px 0;
          color: white;
        }

        .game-details {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
        }

        .game-type, .game-genre, .game-theme {
          padding: 4px 12px;
          border-radius: 16px;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
        }

        .game-type {
          background: #3B82F6;
          color: white;
        }

        .game-genre {
          background: #10B981;
          color: white;
        }

        .game-theme {
          background: #F59E0B;
          color: white;
        }

        .game-actions {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
        }

        .play-btn, .copy-btn {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: bold;
        }

        .play-btn {
          background: #4CAF50;
          color: white;
        }

        .copy-btn {
          background: #2196F3;
          color: white;
        }

        .game-preview {
          background: #1a1a1a;
          border-radius: 8px;
          padding: 16px;
        }

        .game-preview h4 {
          margin: 0 0 12px 0;
          color: #4CAF50;
        }

        .code-preview {
          background: #0d1117;
          padding: 12px;
          border-radius: 4px;
          overflow-x: auto;
          font-size: 12px;
          color: #c9d1d9;
          margin: 0;
        }

        .game-history {
          background: #2a2a2a;
          border-radius: 12px;
          padding: 24px;
        }

        .game-history h3 {
          margin: 0 0 16px 0;
          color: white;
        }

        .history-item {
          background: #1a1a1a;
          border-radius: 8px;
          padding: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .history-title {
          font-weight: bold;
          color: white;
          margin-bottom: 4px;
        }

        .history-meta {
          font-size: 12px;
          color: #8b949e;
        }

        .mini-play-btn {
          padding: 8px 16px;
          background: #4CAF50;
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