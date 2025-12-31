# Phaser.js 3 + Next.js App Router Integration Research

> Research conducted: December 31, 2025
> Focus: Integration patterns for KaspaClash fighting game

---

## Table of Contents

1. [Dynamic Import with SSR Disabled](#1-dynamic-import-with-ssr-disabled)
2. [React-Phaser Bridge Architecture](#2-react-phaser-bridge-architecture)
3. [Communication Patterns](#3-communication-patterns)
4. [Memory Management & Cleanup](#4-memory-management--cleanup)
5. [Responsive Canvas Sizing](#5-responsive-canvas-sizing)
6. [Sprite Sheet Animation Setup](#6-sprite-sheet-animation-setup)
7. [Particle Effects System](#7-particle-effects-system)
8. [Object Pooling Strategies](#8-object-pooling-strategies)
9. [Implementation Recommendations](#9-implementation-recommendations)

---

## 1. Dynamic Import with SSR Disabled

### The Problem

Phaser.js requires browser-specific APIs (`window`, `document`, `canvas`) that don't exist in Node.js server-side rendering environment. Next.js App Router (14+) renders components on the server by default.

### Official Solution (from phaserjs/template-nextjs)

The official Phaser Next.js template uses Next.js `dynamic` import with `ssr: false`:

```tsx
// src/pages/index.tsx (Pages Router approach)
import dynamic from "next/dynamic";

const AppWithoutSSR = dynamic(() => import("@/App"), { ssr: false });

export default function Home() {
    return (
        <main>
            <AppWithoutSSR />
        </main>
    );
}
```

### App Router Pattern (Next.js 14+)

For App Router, use the `'use client'` directive combined with dynamic import:

```tsx
// app/game/page.tsx
'use client';

import dynamic from 'next/dynamic';

const GameComponent = dynamic(
    () => import('@/components/PhaserGame'),
    { 
        ssr: false,
        loading: () => <div className="game-loading">Loading game...</div>
    }
);

export default function GamePage() {
    return (
        <div className="game-container">
            <GameComponent />
        </div>
    );
}
```

### Alternative: Conditional Import in useEffect

```tsx
// components/PhaserGame.tsx
'use client';

import { useEffect, useRef, useState } from 'react';

export default function PhaserGame() {
    const gameRef = useRef<Phaser.Game | null>(null);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        
        const initGame = async () => {
            // Dynamic import only on client
            const Phaser = (await import('phaser')).default;
            const { GameConfig } = await import('@/game/config');
            
            if (!gameRef.current) {
                gameRef.current = new Phaser.Game({
                    ...GameConfig,
                    parent: 'game-container'
                });
            }
        };

        initGame();

        return () => {
            if (gameRef.current) {
                gameRef.current.destroy(true);
                gameRef.current = null;
            }
        };
    }, []);

    if (!isClient) return null;
    
    return <div id="game-container" />;
}
```

---

## 2. React-Phaser Bridge Architecture

### Official Template Structure

The official `phaserjs/template-nextjs` provides a proven architecture:

```
src/
├── game/
│   ├── main.ts              # Game configuration & initialization
│   ├── EventBus.ts          # React ↔ Phaser communication
│   └── scenes/
│       ├── Boot.ts          # Initial asset loading
│       ├── Preloader.ts     # Main asset loading with progress
│       ├── MainMenu.ts      # Menu scene
│       └── Game.ts          # Main game scene
├── PhaserGame.tsx           # React component wrapper
└── App.tsx                  # Main app with game controls
```

### PhaserGame Component (Official Pattern)

```tsx
// src/PhaserGame.tsx
import { forwardRef, useEffect, useLayoutEffect, useRef } from 'react';
import StartGame from './game/main';
import { EventBus } from './game/EventBus';

export interface IRefPhaserGame {
    game: Phaser.Game | null;
    scene: Phaser.Scene | null;
}

interface IProps {
    currentActiveScene?: (scene_instance: Phaser.Scene) => void;
}

export const PhaserGame = forwardRef<IRefPhaserGame, IProps>(
    function PhaserGame({ currentActiveScene }, ref) {
        const game = useRef<Phaser.Game | null>(null);

        // useLayoutEffect for synchronous DOM manipulation
        useLayoutEffect(() => {
            if (game.current === null) {
                game.current = StartGame("game-container");

                if (typeof ref === 'function') {
                    ref({ game: game.current, scene: null });
                } else if (ref) {
                    ref.current = { game: game.current, scene: null };
                }
            }

            return () => {
                if (game.current) {
                    game.current.destroy(true);
                    game.current = null;
                }
            };
        }, [ref]);

        // Listen for scene changes
        useEffect(() => {
            const onSceneReady = (scene_instance: Phaser.Scene) => {
                if (currentActiveScene) {
                    currentActiveScene(scene_instance);
                }

                if (typeof ref === 'function') {
                    ref({ game: game.current, scene: scene_instance });
                } else if (ref) {
                    ref.current = { game: game.current, scene: scene_instance };
                }
            };

            EventBus.on('current-scene-ready', onSceneReady);

            return () => {
                EventBus.removeListener('current-scene-ready');
            };
        }, [currentActiveScene, ref]);

        return <div id="game-container" />;
    }
);
```

### Game Main Configuration

```ts
// src/game/main.ts
import { Boot } from './scenes/Boot';
import { Preloader } from './scenes/Preloader';
import { MainMenu } from './scenes/MainMenu';
import { Game as MainGame } from './scenes/Game';
import { GameOver } from './scenes/GameOver';
import { AUTO, Game } from 'phaser';

const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    width: 1024,
    height: 768,
    parent: 'game-container',
    backgroundColor: '#028af8',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 300 },
            debug: process.env.NODE_ENV === 'development'
        }
    },
    scene: [
        Boot,
        Preloader,
        MainMenu,
        MainGame,
        GameOver
    ]
};

const StartGame = (parent: string) => {
    return new Game({ ...config, parent });
};

export default StartGame;
```

---

## 3. Communication Patterns

### EventBus Pattern (Official)

```ts
// src/game/EventBus.ts
import { Events } from 'phaser';

// Singleton event emitter for React ↔ Phaser communication
export const EventBus = new Events.EventEmitter();
```

### Scene → React Communication

```ts
// In Phaser Scene
import { EventBus } from '../EventBus';

class GameScene extends Phaser.Scene {
    create() {
        // Notify React that scene is ready
        EventBus.emit('current-scene-ready', this);
    }

    onPlayerHealthChange(health: number) {
        // Send game state to React
        EventBus.emit('player-health-changed', { health, maxHealth: 100 });
    }

    onMatchEnd(winner: string) {
        EventBus.emit('match-ended', { winner, timestamp: Date.now() });
    }
}
```

### React → Scene Communication

```tsx
// In React Component
import { useRef } from 'react';
import { IRefPhaserGame, PhaserGame } from './PhaserGame';
import { EventBus } from './game/EventBus';

function App() {
    const phaserRef = useRef<IRefPhaserGame | null>(null);

    // Direct scene method call
    const handleAttack = () => {
        const scene = phaserRef.current?.scene;
        if (scene && 'performAttack' in scene) {
            (scene as any).performAttack();
        }
    };

    // Event-based communication
    const handleSpecialMove = (moveId: string) => {
        EventBus.emit('execute-special-move', { moveId });
    };

    return (
        <>
            <PhaserGame ref={phaserRef} />
            <button onClick={handleAttack}>Attack</button>
            <button onClick={() => handleSpecialMove('fireball')}>
                Special Move
            </button>
        </>
    );
}
```

### Typed Event System for Fighting Game

```ts
// src/game/events.ts
export interface GameEvents {
    // Scene lifecycle
    'current-scene-ready': Phaser.Scene;
    
    // Combat events
    'player-health-changed': { playerId: string; health: number; maxHealth: number };
    'player-attacked': { attackerId: string; targetId: string; damage: number };
    'special-move-executed': { playerId: string; moveId: string };
    'combo-counter-updated': { playerId: string; combo: number };
    
    // Match events
    'match-started': { player1: string; player2: string };
    'match-ended': { winner: string; timestamp: number };
    'round-ended': { roundNumber: number; winner: string };
    
    // Blockchain events
    'bet-placed': { amount: number; txId: string };
    'bet-confirmed': { txId: string; confirmation: boolean };
}

// Type-safe event emitter wrapper
import { Events } from 'phaser';

class TypedEventBus extends Events.EventEmitter {
    emit<K extends keyof GameEvents>(event: K, data: GameEvents[K]): boolean {
        return super.emit(event, data);
    }

    on<K extends keyof GameEvents>(
        event: K, 
        fn: (data: GameEvents[K]) => void
    ): this {
        return super.on(event, fn);
    }
}

export const EventBus = new TypedEventBus();
```

---

## 4. Memory Management & Cleanup

### Component Unmount Cleanup

```tsx
// PhaserGame.tsx with comprehensive cleanup
useLayoutEffect(() => {
    if (game.current === null) {
        game.current = StartGame("game-container");
    }

    return () => {
        if (game.current) {
            // Destroy all scenes first
            game.current.scene.scenes.forEach(scene => {
                scene.sys.events.removeAllListeners();
            });
            
            // Remove all EventBus listeners
            EventBus.removeAllListeners();
            
            // Destroy the game instance
            game.current.destroy(true);
            game.current = null;
        }
    };
}, []);
```

### Scene-Level Cleanup

```ts
// FightScene.ts
class FightScene extends Phaser.Scene {
    private player1!: Fighter;
    private player2!: Fighter;
    private hitParticles!: Phaser.GameObjects.Particles.ParticleEmitter;

    shutdown() {
        // Clean up scene-specific resources
        this.player1?.destroy();
        this.player2?.destroy();
        this.hitParticles?.destroy();
        
        // Remove scene-specific event listeners
        EventBus.off('execute-special-move');
        EventBus.off('pause-game');
    }

    destroy() {
        // Called when scene is removed from game
        this.shutdown();
    }
}
```

### Route Change Handling (Next.js)

```tsx
// app/game/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { EventBus } from '@/game/EventBus';

const GameComponent = dynamic(() => import('@/components/PhaserGame'), {
    ssr: false
});

export default function GamePage() {
    const router = useRouter();

    useEffect(() => {
        // Handle browser back button
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            // Optionally prompt user if game is in progress
            e.preventDefault();
            e.returnValue = '';
        };

        // Handle route changes
        const handleRouteChange = () => {
            EventBus.emit('game-cleanup-requested', null);
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            handleRouteChange();
        };
    }, []);

    return <GameComponent />;
}
```

---

## 5. Responsive Canvas Sizing

### Scale Manager Configuration

```ts
// src/game/main.ts
const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT,           // Fit within parent, maintain aspect ratio
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 1280,                       // Base game width
        height: 720,                       // Base game height (16:9)
        min: {
            width: 640,
            height: 360
        },
        max: {
            width: 1920,
            height: 1080
        },
        parent: 'game-container'
    },
    // ...rest of config
};
```

### Scale Modes Comparison

| Mode | Behavior | Best For |
|------|----------|----------|
| `NONE` | No scaling | Fixed-size games |
| `WIDTH_CONTROLS_HEIGHT` | Width fills, height adjusts | Horizontal games |
| `HEIGHT_CONTROLS_WIDTH` | Height fills, width adjusts | Vertical games |
| `FIT` | Fits container maintaining aspect ratio | Most games |
| `ENVELOP` | Fills container, may crop | Full-screen priority |
| `RESIZE` | Resizes canvas to match parent | Fluid layouts |

### Mobile-First Responsive Setup

```ts
// src/game/config.ts
const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

export const GameConfig: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        // Use different base sizes for mobile vs desktop
        width: isMobile ? 720 : 1280,
        height: isMobile ? 1280 : 720,  // Portrait on mobile
        parent: 'game-container'
    },
    input: {
        activePointers: isMobile ? 3 : 1,  // Multi-touch on mobile
    },
    // ...rest
};
```

### Dynamic Resize Handling

```ts
// In a Scene
class FightScene extends Phaser.Scene {
    create() {
        // Listen for resize events
        this.scale.on('resize', this.handleResize, this);
        
        // Initial layout
        this.handleResize(this.scale.gameSize);
    }

    handleResize(gameSize: Phaser.Structs.Size) {
        const { width, height } = gameSize;
        
        // Reposition UI elements
        this.healthBar1.setPosition(width * 0.1, height * 0.05);
        this.healthBar2.setPosition(width * 0.9, height * 0.05);
        
        // Adjust camera bounds
        this.cameras.main.setBounds(0, 0, width, height);
    }
}
```

### CSS Container Setup

```css
/* styles/game.css */
.game-container {
    width: 100%;
    max-width: 1280px;
    aspect-ratio: 16 / 9;
    margin: 0 auto;
    position: relative;
}

/* Mobile: Allow taller aspect ratio */
@media (max-width: 768px) {
    .game-container {
        max-width: 100%;
        aspect-ratio: 9 / 16;
        max-height: 100vh;
        max-height: 100dvh; /* Dynamic viewport height */
    }
}

/* Ensure canvas fills container */
.game-container canvas {
    display: block;
    width: 100% !important;
    height: 100% !important;
}
```

---

## 6. Sprite Sheet Animation Setup

### Loading Sprite Sheets

```ts
// In Preloader Scene
class Preloader extends Phaser.Scene {
    preload() {
        this.load.setPath('assets/characters/');
        
        // Single-row sprite sheet
        this.load.spritesheet('fighter1-idle', 'fighter1-idle.png', {
            frameWidth: 128,
            frameHeight: 128
        });
        
        // Multi-row sprite sheet
        this.load.spritesheet('fighter1-attack', 'fighter1-attack.png', {
            frameWidth: 192,
            frameHeight: 128,
            startFrame: 0,
            endFrame: 11  // 12 frames total
        });
        
        // Texture atlas (recommended for complex characters)
        this.load.atlas(
            'fighter1-atlas',
            'fighter1-atlas.png',
            'fighter1-atlas.json'
        );
    }
}
```

### Multi-Row Sprite Sheet Frame Indexing

Phaser counts frames left-to-right, top-to-bottom:

```
Row 0: [0] [1] [2] [3]
Row 1: [4] [5] [6] [7]
Row 2: [8] [9] [10] [11]
```

Empty tiles are still counted! Specify exact frames to skip empties:

```ts
// Skip empty frames by specifying exact frame array
this.anims.create({
    key: 'fighter1-special',
    frames: this.anims.generateFrameNumbers('fighter1-special', {
        frames: [0, 1, 2, 3, 6, 7, 8, 9]  // Skip frames 4, 5 (empty)
    }),
    frameRate: 12,
    repeat: 0
});
```

### Fighting Game Animation Setup

```ts
// src/game/animations/FighterAnimations.ts
export function createFighterAnimations(scene: Phaser.Scene, key: string) {
    const anims = scene.anims;
    
    // Idle animation (looping)
    anims.create({
        key: `${key}-idle`,
        frames: anims.generateFrameNumbers(`${key}-idle`, { start: 0, end: 5 }),
        frameRate: 8,
        repeat: -1  // Loop forever
    });
    
    // Walk animation
    anims.create({
        key: `${key}-walk`,
        frames: anims.generateFrameNumbers(`${key}-walk`, { start: 0, end: 7 }),
        frameRate: 12,
        repeat: -1
    });
    
    // Light attack (single play)
    anims.create({
        key: `${key}-punch`,
        frames: anims.generateFrameNumbers(`${key}-punch`, { start: 0, end: 5 }),
        frameRate: 16,
        repeat: 0
    });
    
    // Heavy attack with wind-up
    anims.create({
        key: `${key}-heavy`,
        frames: anims.generateFrameNumbers(`${key}-heavy`, { start: 0, end: 8 }),
        frameRate: 12,
        repeat: 0
    });
    
    // Hit reaction
    anims.create({
        key: `${key}-hit`,
        frames: anims.generateFrameNumbers(`${key}-hit`, { start: 0, end: 3 }),
        frameRate: 10,
        repeat: 0
    });
    
    // Block
    anims.create({
        key: `${key}-block`,
        frames: anims.generateFrameNumbers(`${key}-block`, { start: 0, end: 2 }),
        frameRate: 12,
        repeat: 0
    });
    
    // Jump
    anims.create({
        key: `${key}-jump`,
        frames: anims.generateFrameNumbers(`${key}-jump`, { start: 0, end: 5 }),
        frameRate: 10,
        repeat: 0
    });
    
    // Knockout
    anims.create({
        key: `${key}-ko`,
        frames: anims.generateFrameNumbers(`${key}-ko`, { start: 0, end: 7 }),
        frameRate: 8,
        repeat: 0
    });
}
```

### Texture Atlas Usage (Recommended)

```ts
// Using atlas for more efficient texture packing
anims.create({
    key: 'fighter1-combo',
    frames: anims.generateFrameNames('fighter1-atlas', {
        prefix: 'combo_',
        start: 1,
        end: 12,
        zeroPad: 2,  // combo_01, combo_02, etc.
        suffix: '.png'
    }),
    frameRate: 16,
    repeat: 0
});
```

### Animation Events for Hitboxes

```ts
class Fighter extends Phaser.GameObjects.Sprite {
    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'fighter1-atlas');
        
        // Listen for specific frames to activate hitboxes
        this.on(Phaser.Animations.Events.ANIMATION_UPDATE, 
            (anim: Phaser.Animations.Animation, frame: Phaser.Animations.AnimationFrame) => {
                if (anim.key.includes('punch') && frame.index === 3) {
                    this.activateHitbox('punch');
                }
                if (anim.key.includes('punch') && frame.index === 5) {
                    this.deactivateHitbox();
                }
            }
        );
        
        // Animation complete event
        this.on(Phaser.Animations.Events.ANIMATION_COMPLETE, 
            (anim: Phaser.Animations.Animation) => {
                if (anim.key.includes('attack') || anim.key.includes('punch')) {
                    this.returnToIdle();
                }
            }
        );
    }
}
```

---

## 7. Particle Effects System

### Particle Emitter Basics (Phaser 3.60+)

In Phaser 3.60+, `ParticleEmitterManager` was removed. Use `ParticleEmitter` directly:

```ts
// Create particle emitter
const hitParticles = this.add.particles(0, 0, 'particles', {
    frame: 'spark',
    lifespan: 300,
    speed: { min: 100, max: 200 },
    scale: { start: 0.5, end: 0 },
    alpha: { start: 1, end: 0 },
    blendMode: 'ADD',
    emitting: false  // Don't auto-emit
});
```

### Hit Impact Effects

```ts
// src/game/effects/HitEffects.ts
export function createHitEmitter(scene: Phaser.Scene): Phaser.GameObjects.Particles.ParticleEmitter {
    return scene.add.particles(0, 0, 'hit-particles', {
        frame: ['spark1', 'spark2', 'spark3'],
        lifespan: 200,
        speed: { min: 150, max: 300 },
        angle: { min: -30, max: 30 },
        scale: { start: 0.6, end: 0.1 },
        alpha: { start: 1, end: 0 },
        rotate: { min: 0, max: 360 },
        gravityY: 100,
        blendMode: 'ADD',
        quantity: 8,
        emitting: false
    });
}

// Usage in combat
class Fighter {
    onHit(damage: number, hitPosition: Phaser.Math.Vector2) {
        // Emit particles at hit location
        this.hitEmitter.setPosition(hitPosition.x, hitPosition.y);
        this.hitEmitter.explode(damage > 10 ? 15 : 8);
        
        // Camera shake based on damage
        this.scene.cameras.main.shake(100, damage * 0.002);
    }
}
```

### Special Move Effects

```ts
// Fireball trail effect
const fireballEmitter = scene.add.particles(0, 0, 'fire-particles', {
    follow: fireballSprite,  // Follow the projectile
    followOffset: { x: -20, y: 0 },
    lifespan: 400,
    speed: { min: 20, max: 50 },
    angle: { min: 160, max: 200 },
    scale: { start: 0.8, end: 0 },
    alpha: { start: 0.8, end: 0 },
    blendMode: 'ADD',
    frequency: 10,  // Emit every 10ms
    quantity: 2
});

// Stop following when projectile destroyed
fireballSprite.on('destroy', () => {
    fireballEmitter.stopFollow();
    fireballEmitter.stop();
});
```

### Block/Parry Effect

```ts
const blockEmitter = scene.add.particles(0, 0, 'shield-particles', {
    lifespan: 300,
    speed: { min: 50, max: 100 },
    angle: { min: -180, max: 180 },  // Radial burst
    scale: { start: 0.4, end: 0 },
    alpha: { start: 0.6, end: 0 },
    tint: 0x00ffff,
    blendMode: 'ADD',
    quantity: 12,
    emitting: false
});

// On successful block
blockEmitter.setPosition(fighter.x, fighter.y);
blockEmitter.explode(12);
```

### Knockout/Victory Effect

```ts
const koEmitter = scene.add.particles(0, 0, 'star-particles', {
    frame: ['star1', 'star2'],
    lifespan: 1500,
    speed: { min: 50, max: 150 },
    angle: { min: 220, max: 320 },  // Upward arc
    scale: { start: 0.5, end: 0 },
    alpha: { start: 1, end: 0 },
    gravityY: -50,  // Float upward
    rotate: { min: 0, max: 360 },
    frequency: 50,
    quantity: 3,
    emitting: false
});

// Celebrate KO
function celebrateKO(loserPosition: Phaser.Math.Vector2) {
    koEmitter.setPosition(loserPosition.x, loserPosition.y);
    koEmitter.start();
    
    scene.time.delayedCall(2000, () => {
        koEmitter.stop();
    });
}
```

---

## 8. Object Pooling Strategies

### Phaser's Built-in Pooling (Particle System)

The ParticleEmitter uses internal pooling automatically:

```ts
// Particles automatically reuse dead particles
const emitter = scene.add.particles(0, 0, 'particles', {
    lifespan: 500,
    quantity: 10,
    maxParticles: 100  // Pool limit
});

// Dead particles go to emitter.dead array
// Alive particles in emitter.alive array
```

### Group-Based Object Pooling

```ts
// src/game/pools/ProjectilePool.ts
class ProjectilePool {
    private pool: Phaser.GameObjects.Group;
    
    constructor(scene: Phaser.Scene) {
        this.pool = scene.add.group({
            classType: Projectile,
            maxSize: 20,
            runChildUpdate: true,
            createCallback: (projectile: Projectile) => {
                projectile.setActive(false);
                projectile.setVisible(false);
            }
        });
        
        // Pre-populate pool
        this.pool.createMultiple({
            key: 'fireball',
            quantity: 10,
            active: false,
            visible: false
        });
    }
    
    spawn(x: number, y: number, velocityX: number): Projectile | null {
        const projectile = this.pool.get(x, y) as Projectile;
        
        if (projectile) {
            projectile.fire(x, y, velocityX);
            return projectile;
        }
        
        return null;  // Pool exhausted
    }
    
    returnToPool(projectile: Projectile) {
        projectile.setActive(false);
        projectile.setVisible(false);
        projectile.body?.stop();
    }
}
```

### Custom Hitbox Pool

```ts
// Fighting games need dynamic hitbox pooling
class HitboxPool {
    private activeHitboxes: Map<string, Phaser.Geom.Rectangle> = new Map();
    private inactiveHitboxes: Phaser.Geom.Rectangle[] = [];
    
    constructor(initialSize: number = 10) {
        for (let i = 0; i < initialSize; i++) {
            this.inactiveHitboxes.push(new Phaser.Geom.Rectangle(0, 0, 0, 0));
        }
    }
    
    acquire(id: string, x: number, y: number, width: number, height: number): Phaser.Geom.Rectangle {
        let hitbox = this.inactiveHitboxes.pop();
        
        if (!hitbox) {
            hitbox = new Phaser.Geom.Rectangle(x, y, width, height);
        } else {
            hitbox.setTo(x, y, width, height);
        }
        
        this.activeHitboxes.set(id, hitbox);
        return hitbox;
    }
    
    release(id: string) {
        const hitbox = this.activeHitboxes.get(id);
        if (hitbox) {
            this.activeHitboxes.delete(id);
            this.inactiveHitboxes.push(hitbox);
        }
    }
    
    getActive(): IterableIterator<[string, Phaser.Geom.Rectangle]> {
        return this.activeHitboxes.entries();
    }
}
```

### Effect Manager with Pooling

```ts
// src/game/managers/EffectManager.ts
class EffectManager {
    private hitEmitters: Phaser.GameObjects.Particles.ParticleEmitter[] = [];
    private specialEmitters: Map<string, Phaser.GameObjects.Particles.ParticleEmitter> = new Map();
    
    constructor(private scene: Phaser.Scene) {
        // Pre-create hit effect emitters
        for (let i = 0; i < 3; i++) {
            this.hitEmitters.push(this.createHitEmitter());
        }
        
        // Pre-create special move emitters
        this.specialEmitters.set('fireball', this.createFireballEmitter());
        this.specialEmitters.set('lightning', this.createLightningEmitter());
    }
    
    private emitterIndex = 0;
    
    playHitEffect(x: number, y: number, intensity: number = 1) {
        // Round-robin through hit emitters
        const emitter = this.hitEmitters[this.emitterIndex];
        this.emitterIndex = (this.emitterIndex + 1) % this.hitEmitters.length;
        
        emitter.setPosition(x, y);
        emitter.explode(Math.floor(8 * intensity));
    }
    
    playSpecialEffect(type: string, x: number, y: number) {
        const emitter = this.specialEmitters.get(type);
        if (emitter) {
            emitter.setPosition(x, y);
            emitter.explode();
        }
    }
    
    cleanup() {
        this.hitEmitters.forEach(e => e.destroy());
        this.specialEmitters.forEach(e => e.destroy());
    }
}
```

---

## 9. Implementation Recommendations

### Recommended Project Structure

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                    # Landing page
│   └── game/
│       └── page.tsx                # Game page with dynamic import
├── components/
│   ├── PhaserGame.tsx              # Game wrapper component
│   ├── GameUI/
│   │   ├── HealthBar.tsx           # React-based UI overlay
│   │   ├── ComboCounter.tsx
│   │   └── BetDisplay.tsx
│   └── WalletConnect.tsx
├── game/
│   ├── main.ts                     # Game config
│   ├── EventBus.ts                 # React ↔ Phaser communication
│   ├── types.ts                    # Game type definitions
│   ├── scenes/
│   │   ├── Boot.ts
│   │   ├── Preloader.ts
│   │   ├── MainMenu.ts
│   │   ├── CharacterSelect.ts
│   │   ├── Fight.ts
│   │   └── Results.ts
│   ├── objects/
│   │   ├── Fighter.ts              # Fighter game object
│   │   ├── Projectile.ts
│   │   └── Stage.ts
│   ├── animations/
│   │   └── FighterAnimations.ts
│   ├── effects/
│   │   ├── HitEffects.ts
│   │   └── SpecialMoveEffects.ts
│   ├── managers/
│   │   ├── EffectManager.ts
│   │   ├── InputManager.ts
│   │   └── MatchManager.ts
│   └── pools/
│       ├── ProjectilePool.ts
│       └── HitboxPool.ts
└── lib/
    └── kaspa/                      # Kaspa WASM integration
        └── wallet.ts
```

### Performance Optimization Checklist

- [ ] Use `Phaser.Scale.FIT` with appropriate base resolution
- [ ] Pre-create all particle emitters and use `explode()` method
- [ ] Pool all frequently created/destroyed objects (projectiles, hitboxes)
- [ ] Use texture atlases instead of individual sprite sheets
- [ ] Limit active particle count with `maxParticles`
- [ ] Use `runChildUpdate: true` for pooled groups instead of manual iteration
- [ ] Disable physics bodies when objects return to pool
- [ ] Clean up EventBus listeners on scene shutdown
- [ ] Use `useLayoutEffect` for game initialization (synchronous)
- [ ] Destroy game instance on component unmount

### Key Dependencies

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "phaser": "^3.80.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "typescript": "^5.0.0"
  }
}
```

### Key References

- **Official Template:** https://github.com/phaserjs/template-nextjs
- **Phaser 3 Documentation:** https://docs.phaser.io/
- **Phaser 3 Examples:** https://labs.phaser.io/
- **Particle System Changelog:** https://github.com/phaserjs/phaser/blob/main/changelog/3.60/ParticleEmitter.md

---

## Summary

| Topic | Recommendation |
|-------|----------------|
| **SSR Handling** | Use `dynamic()` with `ssr: false` in App Router |
| **React-Phaser Bridge** | Follow official `PhaserGame.tsx` pattern with `forwardRef` |
| **Communication** | Use EventBus singleton for bidirectional events |
| **Memory Management** | Destroy game in `useLayoutEffect` cleanup, remove all listeners |
| **Responsive Sizing** | Use `Phaser.Scale.FIT` with 16:9 base resolution |
| **Animations** | Use texture atlases, generate frame names, listen for frame events |
| **Particles** | Pre-create emitters, use `explode()` for bursts, set `maxParticles` |
| **Object Pooling** | Use Phaser Groups with `maxSize`, implement custom pools for hitboxes |
