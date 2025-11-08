interface GameConfig {
  type: '3d' | '2d';
  genre: 'fps' | 'platformer' | 'racing' | 'puzzle' | 'rpg';
  theme: string;
  mechanics: string[];
}

export class GameGenerator {
  async generateGame(prompt: string): Promise<any> {
    const config = this.parseGamePrompt(prompt);
    const gameCode = this.generateGameCode(config);
    
    return {
      id: `game_${Date.now()}`,
      config,
      code: gameCode,
      playableUrl: `https://nexus.dev/games/${Date.now()}`
    };
  }

  private parseGamePrompt(prompt: string): GameConfig {
    const keywords = prompt.toLowerCase();
    
    return {
      type: keywords.includes('3d') ? '3d' : '2d',
      genre: this.detectGenre(keywords),
      theme: this.extractTheme(prompt),
      mechanics: this.extractMechanics(keywords)
    };
  }

  private detectGenre(keywords: string): GameConfig['genre'] {
    if (keywords.includes('shoot') || keywords.includes('fps')) return 'fps';
    if (keywords.includes('jump') || keywords.includes('platform')) return 'platformer';
    if (keywords.includes('race') || keywords.includes('car')) return 'racing';
    if (keywords.includes('puzzle')) return 'puzzle';
    if (keywords.includes('rpg')) return 'rpg';
    return 'platformer';
  }

  private extractTheme(prompt: string): string {
    const themes = ['space', 'medieval', 'modern', 'fantasy'];
    for (const theme of themes) {
      if (prompt.toLowerCase().includes(theme)) return theme;
    }
    return 'modern';
  }

  private extractMechanics(keywords: string): string[] {
    const mechanics = [];
    if (keywords.includes('jump')) mechanics.push('jumping');
    if (keywords.includes('shoot')) mechanics.push('shooting');
    if (keywords.includes('collect')) mechanics.push('collecting');
    return mechanics.length > 0 ? mechanics : ['movement'];
  }

  private generateGameCode(config: GameConfig): string {
    if (config.type === '3d') {
      return this.generate3DGame(config);
    } else {
      return this.generate2DGame(config);
    }
  }

  private generate3DGame(config: GameConfig): string {
    if (config.genre === 'fps') {
      return `
// 3D FPS Game
import * as THREE from 'three';

class FPSGame {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer();
    this.player = { health: 100 };
    this.enemies = [];
    this.bullets = [];
    this.score = 0;
    this.init();
  }

  init() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);
    
    this.createEnvironment();
    this.createEnemies();
    this.setupControls();
    this.gameLoop();
  }

  createEnvironment() {
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    this.scene.add(ground);

    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    this.scene.add(directionalLight);
  }

  createEnemies() {
    for (let i = 0; i < 5; i++) {
      const enemyGeometry = new THREE.BoxGeometry(1, 2, 1);
      const enemyMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
      const enemy = new THREE.Mesh(enemyGeometry, enemyMaterial);
      enemy.position.set(Math.random() * 40 - 20, 1, Math.random() * 40 - 20);
      this.scene.add(enemy);
      this.enemies.push(enemy);
    }
  }

  setupControls() {
    document.addEventListener('keydown', (event) => {
      switch(event.code) {
        case 'KeyW': this.moveForward(); break;
        case 'KeyS': this.moveBackward(); break;
        case 'KeyA': this.moveLeft(); break;
        case 'KeyD': this.moveRight(); break;
        case 'Space': this.shoot(); break;
      }
    });
  }

  moveForward() {
    this.camera.position.z -= 0.5;
  }

  moveBackward() {
    this.camera.position.z += 0.5;
  }

  moveLeft() {
    this.camera.position.x -= 0.5;
  }

  moveRight() {
    this.camera.position.x += 0.5;
  }

  shoot() {
    const bulletGeometry = new THREE.SphereGeometry(0.1);
    const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
    bullet.position.copy(this.camera.position);
    bullet.direction = new THREE.Vector3(0, 0, -1);
    this.scene.add(bullet);
    this.bullets.push(bullet);
  }

  updateBullets() {
    this.bullets.forEach((bullet, index) => {
      bullet.position.add(bullet.direction.clone().multiplyScalar(2));
      
      this.enemies.forEach((enemy, enemyIndex) => {
        if (bullet.position.distanceTo(enemy.position) < 1) {
          this.scene.remove(bullet);
          this.scene.remove(enemy);
          this.bullets.splice(index, 1);
          this.enemies.splice(enemyIndex, 1);
          this.score += 100;
        }
      });
      
      if (bullet.position.length() > 100) {
        this.scene.remove(bullet);
        this.bullets.splice(index, 1);
      }
    });
  }

  gameLoop() {
    requestAnimationFrame(() => this.gameLoop());
    this.updateBullets();
    this.renderer.render(this.scene, this.camera);
  }
}

new FPSGame();`;
    }

    if (config.genre === 'racing') {
      return `
// 3D Racing Game
import * as THREE from 'three';

class RacingGame {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer();
    this.car = null;
    this.speed = 0;
    this.init();
  }

  init() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);
    
    this.createTrack();
    this.createCar();
    this.setupControls();
    this.gameLoop();
  }

  createTrack() {
    const trackGeometry = new THREE.RingGeometry(20, 40, 32);
    const trackMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const track = new THREE.Mesh(trackGeometry, trackMaterial);
    track.rotation.x = -Math.PI / 2;
    this.scene.add(track);

    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(ambientLight);
  }

  createCar() {
    const carGeometry = new THREE.BoxGeometry(2, 0.5, 4);
    const carMaterial = new THREE.MeshLambertMaterial({ color: 0x0066cc });
    this.car = new THREE.Mesh(carGeometry, carMaterial);
    this.car.position.set(30, 0.5, 0);
    this.scene.add(this.car);
    
    this.camera.position.set(0, 5, 10);
  }

  setupControls() {
    this.keys = {};
    document.addEventListener('keydown', (event) => this.keys[event.code] = true);
    document.addEventListener('keyup', (event) => this.keys[event.code] = false);
  }

  updateCar() {
    if (this.keys['ArrowUp']) this.speed = Math.min(this.speed + 0.02, 2);
    else if (this.keys['ArrowDown']) this.speed = Math.max(this.speed - 0.02, -1);
    else this.speed *= 0.99;
    
    if (this.keys['ArrowLeft']) this.car.rotation.y += 0.03;
    if (this.keys['ArrowRight']) this.car.rotation.y -= 0.03;
    
    this.car.position.x += Math.sin(this.car.rotation.y) * this.speed;
    this.car.position.z += Math.cos(this.car.rotation.y) * this.speed;
    
    this.camera.position.copy(this.car.position).add(new THREE.Vector3(0, 5, 10));
    this.camera.lookAt(this.car.position);
  }

  gameLoop() {
    requestAnimationFrame(() => this.gameLoop());
    this.updateCar();
    this.renderer.render(this.scene, this.camera);
  }
}

new RacingGame();`;
    }

    return this.generate3DPlatformer(config);
  }

  private generate3DPlatformer(config: GameConfig): string {
    return `
// 3D Platformer Game
import * as THREE from 'three';

class PlatformerGame {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer();
    this.player = null;
    this.platforms = [];
    this.collectibles = [];
    this.score = 0;
    this.init();
  }

  init() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);
    
    this.createWorld();
    this.createPlayer();
    this.setupControls();
    this.gameLoop();
  }

  createWorld() {
    // Ground
    const groundGeometry = new THREE.BoxGeometry(50, 1, 50);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.position.y = -0.5;
    this.scene.add(ground);

    // Platforms
    for (let i = 0; i < 10; i++) {
      const platformGeometry = new THREE.BoxGeometry(4, 0.5, 4);
      const platformMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
      const platform = new THREE.Mesh(platformGeometry, platformMaterial);
      platform.position.set(
        (Math.random() - 0.5) * 40,
        Math.random() * 10 + 2,
        (Math.random() - 0.5) * 40
      );
      this.scene.add(platform);
      this.platforms.push(platform);
    }

    // Collectibles
    for (let i = 0; i < 15; i++) {
      const collectibleGeometry = new THREE.SphereGeometry(0.3);
      const collectibleMaterial = new THREE.MeshLambertMaterial({ color: 0xffff00 });
      const collectible = new THREE.Mesh(collectibleGeometry, collectibleMaterial);
      collectible.position.set(
        (Math.random() - 0.5) * 40,
        Math.random() * 8 + 3,
        (Math.random() - 0.5) * 40
      );
      this.scene.add(collectible);
      this.collectibles.push(collectible);
    }

    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    this.scene.add(directionalLight);
  }

  createPlayer() {
    const playerGeometry = new THREE.BoxGeometry(1, 2, 1);
    const playerMaterial = new THREE.MeshLambertMaterial({ color: 0x0066cc });
    this.player = new THREE.Mesh(playerGeometry, playerMaterial);
    this.player.position.set(0, 2, 0);
    this.player.velocity = new THREE.Vector3(0, 0, 0);
    this.player.onGround = false;
    this.scene.add(this.player);

    this.camera.position.set(0, 5, 10);
  }

  setupControls() {
    this.keys = {};
    document.addEventListener('keydown', (event) => this.keys[event.code] = true);
    document.addEventListener('keyup', (event) => this.keys[event.code] = false);
  }

  updatePlayer() {
    // Movement
    if (this.keys['KeyA']) this.player.velocity.x = -0.2;
    else if (this.keys['KeyD']) this.player.velocity.x = 0.2;
    else this.player.velocity.x *= 0.8;

    if (this.keys['KeyW']) this.player.velocity.z = -0.2;
    else if (this.keys['KeyS']) this.player.velocity.z = 0.2;
    else this.player.velocity.z *= 0.8;

    // Jumping
    if (this.keys['Space'] && this.player.onGround) {
      this.player.velocity.y = 0.3;
      this.player.onGround = false;
    }

    // Gravity
    this.player.velocity.y -= 0.01;

    // Apply velocity
    this.player.position.add(this.player.velocity);

    // Ground collision
    if (this.player.position.y <= 1) {
      this.player.position.y = 1;
      this.player.velocity.y = 0;
      this.player.onGround = true;
    }

    // Platform collision
    this.platforms.forEach(platform => {
      if (this.checkCollision(this.player, platform)) {
        if (this.player.velocity.y < 0) {
          this.player.position.y = platform.position.y + 1.25;
          this.player.velocity.y = 0;
          this.player.onGround = true;
        }
      }
    });

    // Collectible collision
    this.collectibles = this.collectibles.filter(collectible => {
      if (this.player.position.distanceTo(collectible.position) < 1) {
        this.scene.remove(collectible);
        this.score += 10;
        return false;
      }
      return true;
    });

    // Camera follow
    this.camera.position.copy(this.player.position).add(new THREE.Vector3(0, 5, 10));
    this.camera.lookAt(this.player.position);
  }

  checkCollision(player, platform) {
    return Math.abs(player.position.x - platform.position.x) < 2.5 &&
           Math.abs(player.position.z - platform.position.z) < 2.5 &&
           player.position.y > platform.position.y &&
           player.position.y < platform.position.y + 2;
  }

  gameLoop() {
    requestAnimationFrame(() => this.gameLoop());
    this.updatePlayer();
    this.renderer.render(this.scene, this.camera);
  }
}

new PlatformerGame();`;
  }

  private generate2DGame(config: GameConfig): string {
    return `
// 2D ${config.genre} Game
class Game2D {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = 800;
    this.canvas.height = 600;
    document.body.appendChild(this.canvas);
    
    this.player = { x: 100, y: 300, width: 32, height: 32, vx: 0, vy: 0 };
    this.enemies = [];
    this.collectibles = [];
    this.score = 0;
    this.keys = {};
    
    this.init();
  }

  init() {
    this.setupControls();
    this.createEnemies();
    this.createCollectibles();
    this.gameLoop();
  }

  setupControls() {
    document.addEventListener('keydown', (e) => this.keys[e.code] = true);
    document.addEventListener('keyup', (e) => this.keys[e.code] = false);
  }

  createEnemies() {
    for (let i = 0; i < 5; i++) {
      this.enemies.push({
        x: Math.random() * 700 + 50,
        y: Math.random() * 500 + 50,
        width: 24,
        height: 24,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2
      });
    }
  }

  createCollectibles() {
    for (let i = 0; i < 10; i++) {
      this.collectibles.push({
        x: Math.random() * 750,
        y: Math.random() * 550,
        width: 16,
        height: 16
      });
    }
  }

  update() {
    if (this.keys['KeyA']) this.player.vx = -5;
    else if (this.keys['KeyD']) this.player.vx = 5;
    else this.player.vx *= 0.8;
    
    if (this.keys['KeyW']) this.player.vy = -5;
    else if (this.keys['KeyS']) this.player.vy = 5;
    else this.player.vy *= 0.8;
    
    this.player.x += this.player.vx;
    this.player.y += this.player.vy;
    
    this.player.x = Math.max(0, Math.min(this.canvas.width - this.player.width, this.player.x));
    this.player.y = Math.max(0, Math.min(this.canvas.height - this.player.height, this.player.y));
    
    this.enemies.forEach(enemy => {
      enemy.x += enemy.vx;
      enemy.y += enemy.vy;
      
      if (enemy.x <= 0 || enemy.x >= this.canvas.width - enemy.width) enemy.vx *= -1;
      if (enemy.y <= 0 || enemy.y >= this.canvas.height - enemy.height) enemy.vy *= -1;
    });
    
    this.collectibles = this.collectibles.filter(item => {
      if (this.checkCollision(this.player, item)) {
        this.score += 10;
        return false;
      }
      return true;
    });
  }

  checkCollision(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
  }

  render() {
    this.ctx.fillStyle = '#87CEEB';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#0066cc';
    this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
    
    this.ctx.fillStyle = '#cc0000';
    this.enemies.forEach(enemy => {
      this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    });
    
    this.ctx.fillStyle = '#ffcc00';
    this.collectibles.forEach(item => {
      this.ctx.fillRect(item.x, item.y, item.width, item.height);
    });
    
    this.ctx.fillStyle = '#000';
    this.ctx.font = '20px Arial';
    this.ctx.fillText('Score: ' + this.score, 10, 30);
  }

  gameLoop() {
    this.update();
    this.render();
    requestAnimationFrame(() => this.gameLoop());
  }
}

new Game2D();`;
  }
}