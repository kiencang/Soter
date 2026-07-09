
import { Injectable, signal, inject } from '@angular/core';
import { SimulatorVehiclesService } from './simulator-vehicles.service';
import { SimulatorAudioService } from './simulator-audio.service';
import { SimulatorScenarioService, ScenarioContext } from './simulator-scenarios.service';
import { SimulatorCameraService } from './simulator-camera.service';
import { SimulatorEnvironmentService } from './simulator-environment.service';
import { SimulatorLogicService } from './simulator-logic.service';
import * as BABYLON from '@babylonjs/core';

@Injectable({ providedIn: 'root' })
export class SimulatorService {
  private vehiclesService = inject(SimulatorVehiclesService);
  private audioService = inject(SimulatorAudioService);
  private scenarioService = inject(SimulatorScenarioService);
  private cameraService = inject(SimulatorCameraService);
  private environmentService = inject(SimulatorEnvironmentService);
  private logicService = inject(SimulatorLogicService);
  // App states
  gameState = signal<'MENU' | 'SIMULATION'>('MENU');
  get viewMode() { return this.cameraService.viewMode; }
  get lookDirection() { return this.cameraService.lookDirection; }
  showBlindSpotOverlays = signal<boolean>(true);

  // Real-time motorcycle state
  motorcycleX = signal<number>(4.0);
  motorcycleZ = signal<number>(-5.0);

  // Status indicators (Vietnamese)
  currentZone = signal<string>('Ngoài vùng nguy hiểm');
  isBlindSpot = signal<boolean>(false);
  currentDetail = signal<string>('Bạn đang ở ngoài các vùng nguy hiểm. Hãy thử di chuyển xe máy vào sát xe tải để xem sự thay đổi tầm nhìn.');

  // Scenario states
  get activeScenario() { return this.scenarioService.activeScenario; }
  get isPlayingScenario() { return this.scenarioService.isPlayingScenario; }
  get scenarioStage() { return this.scenarioService.scenarioStage; }
  get scenarioText() { return this.scenarioService.scenarioText; }

  // Audio state
  get soundEnabled() { return this.audioService.soundEnabled; }

  private isBrowser = false;
  private lastTime = 0;

  // BabylonJS objects
  private engine: BABYLON.Engine | null = null;
  private scene: BABYLON.Scene | null = null;

  // Game nodes
  private truckNode: BABYLON.TransformNode | null = null;
  private trailerNode: BABYLON.TransformNode | null = null;
  private trailerRearPos: BABYLON.Vector3 | null = null;
  private motorcycleNode: BABYLON.TransformNode | null = null;
  
  // Blind Spot indicator meshes on the ground
  private frontBlindSpotMesh: BABYLON.Mesh | null = null;
  private leftBlindSpotMesh: BABYLON.Mesh | null = null;
  private rightBlindSpotMesh: BABYLON.Mesh | null = null;
  private rearBlindSpotMesh: BABYLON.Mesh | null = null;

  // Visual cues
  private laneLines: any[] = [];
  private intersectionMeshes: BABYLON.Mesh[] = [];
  private blinkerLeft: BABYLON.Mesh | null = null;
  private blinkerRight: BABYLON.Mesh | null = null;
  private blinkerTimer = 0;
  private blinkerActive = false;
  private blinkerOn = false;

  // Key states
  private keys: { [key: string]: boolean } = {};

  // Audio synthesizers (Web Audio API)
  private audioCtx: AudioContext | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private hornOsc: OscillatorNode | null = null;
  private hornGain: GainNode | null = null;

  // Scenario timing
  private scenarioTimer = 0;


  private canvas!: HTMLCanvasElement;

  init(canvas: HTMLCanvasElement, isBrowser: boolean) {
    this.canvas = canvas;
    this.isBrowser = isBrowser;
    
    if (this.isBrowser) {
      window.addEventListener('keydown', this.handleKeyDown);
      window.addEventListener('keyup', this.handleKeyUp);
      window.addEventListener('resize', this.handleResize);

      setTimeout(() => {
        this.initGameEngine();
      }, 100);
    }
  }

  destroy() {
    if (this.isBrowser) {
      window.removeEventListener('keydown', this.handleKeyDown);
      window.removeEventListener('keyup', this.handleKeyUp);
      window.removeEventListener('resize', this.handleResize);
      this.audioService.stopSound();
      this.cleanupBabylon();
    }
  }
  // --- Keyboard controls ---
  private handleKeyDown = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    this.keys[key] = true;

    // Prevent scrolling
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key)) {
      e.preventDefault();
    }

    // Horn beep on spacebar!
    if (e.key === ' ' && this.gameState() === 'SIMULATION') {
      this.audioService.playHorn();
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    this.keys[key] = false;
    
    if (e.key === ' ') {
      this.audioService.stopHorn();
    }
  };

  private handleResize = () => {
    if (this.engine) {
      this.engine.resize();
    }
  };

  toggleSound() {
    this.audioService.toggleSound(this.gameState() === 'SIMULATION');
  }

  // --- POV Controls ---
  setViewMode(mode: 'orbit' | 'cabin' | 'rider') {
    this.cameraService.viewMode.set(mode);
    this.cameraService.updateCameraSetup(this.canvas, this.truckNode, this.motorcycleNode);
  }

  setLookDirection(dir: 'front' | 'left' | 'right') {
    this.cameraService.lookDirection.set(dir);
  }

  toggleBlindSpotOverlays() {
    const show = !this.showBlindSpotOverlays();
    this.showBlindSpotOverlays.set(show);
    
    [this.frontBlindSpotMesh, this.leftBlindSpotMesh, this.rightBlindSpotMesh, this.rearBlindSpotMesh].forEach(mesh => {
      if (mesh) {
        mesh.setEnabled(show);
      }
    });
  }

  // --- Move Controls ---
  moveX(val: number) {
    if (this.activeScenario() !== 'free') return;
    this.motorcycleX.update(x => Math.max(-10, Math.min(10, x + val)));
    this.syncMotorcyclePosition();
  }

  moveZ(val: number) {
    if (this.activeScenario() !== 'free') return;
    this.motorcycleZ.update(z => Math.max(-30, Math.min(20, z + val)));
    this.syncMotorcyclePosition();
  }

  setMotorcycleCoords(x: number, z: number) {
    if (this.activeScenario() !== 'free') return;
    this.motorcycleX.set(x);
    this.motorcycleZ.set(z);
    this.syncMotorcyclePosition();
  }

  private syncMotorcyclePosition() {
    if (this.motorcycleNode) {
      this.motorcycleNode.position.x = this.motorcycleX();
      this.motorcycleNode.position.z = this.motorcycleZ();
      // Keep upright in free mode
      this.motorcycleNode.rotation.z = 0;
      this.motorcycleNode.rotation.x = 0;
      this.motorcycleNode.rotation.y = 0;
    }
    this.checkBlindSpotState();
  }

  private getScenarioContext(): ScenarioContext {
    return {
      truckNode: this.truckNode,
      trailerNode: this.trailerNode,
      motorcycleNode: this.motorcycleNode,
      motorcycleX: this.motorcycleX,
      motorcycleZ: this.motorcycleZ,
      syncMotorcyclePosition: () => this.syncMotorcyclePosition(),
      checkBlindSpotState: () => this.checkBlindSpotState(),
      setViewMode: (mode) => this.setViewMode(mode),
      intersectionMeshes: this.intersectionMeshes,
      laneLines: this.laneLines,
      setBlinkerActive: (active) => { this.blinkerActive = active; },
      getTrailerRearPos: () => this.trailerRearPos,
      setTrailerRearPos: (pos) => { this.trailerRearPos = pos; }
    };
  }

  // --- Scenario handling ---
  startScenario(type: 'free' | 'right_turn' | 'cut_off' | 'tailgate') {
    this.scenarioService.startScenario(type, this.getScenarioContext());
  }

  resetScenario() {
    this.scenarioService.resetScenario(this.getScenarioContext());
  }

  // --- Simulation Flow ---
  startSimulation() {
    this.gameState.set('SIMULATION');
    this.startScenario('free');
    if (this.soundEnabled()) {
      this.audioService.initAudio();
    }
  }

  goToMenu() {
    this.gameState.set('MENU');
    this.audioService.stopSound();
    this.setViewMode('orbit');
  }

  // --- Real-time Blind Spot Logic ---
  private checkBlindSpotState() {
    const res = this.logicService.checkBlindSpot(this.truckNode, this.trailerNode, this.motorcycleNode);
    this.currentZone.set(res.zone);
    this.isBlindSpot.set(res.isBlind);
    this.currentDetail.set(res.detail);
  }

  // --- Babylon.js Simulation Setup ---
  private async initGameEngine() {
    try {
      const canvas = this.canvas;
      this.engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
      this.scene = new BABYLON.Scene(this.engine);
      this.scene.clearColor = new BABYLON.Color4(0.08, 0.1, 0.15, 1); // Slate gray sky

      // Lights
      const hemiLight = new BABYLON.HemisphericLight('hemiLight', new BABYLON.Vector3(0, 1, 0), this.scene);
      hemiLight.intensity = 0.7;
      hemiLight.diffuse = new BABYLON.Color3(0.9, 0.95, 1.0);

      const dirLight = new BABYLON.DirectionalLight('dirLight', new BABYLON.Vector3(-1, -2, 1), this.scene);
      dirLight.intensity = 0.8;
      dirLight.diffuse = new BABYLON.Color3(1.0, 0.95, 0.85); // Warm sunlight

      // Build Road and Environment
      this.environmentService.createRoadGrid(this.scene!, this.laneLines, this.intersectionMeshes);

      // Build 3D Models
      const truckResult = this.vehiclesService.createTruck(this.scene!);
      this.truckNode = truckResult.truckNode;
      this.trailerNode = truckResult.trailerNode;
      this.blinkerLeft = truckResult.blinkerLeft;
      this.blinkerRight = truckResult.blinkerRight;
      this.motorcycleNode = this.vehiclesService.createMotorcycle(this.scene!);

      // Create Blind Spot overlay panels on ground
      const blindSpots = this.vehiclesService.createBlindSpots(this.scene!, this.truckNode!, this.trailerNode!);
      this.frontBlindSpotMesh = blindSpots.front;
      this.leftBlindSpotMesh = blindSpots.left;
      this.rightBlindSpotMesh = blindSpots.right;
      this.rearBlindSpotMesh = blindSpots.rear;

      // Cameras Setup
      this.cameraService.setupCameras(canvas, this.scene!, this.truckNode);

      // Animation Loop
      this.lastTime = performance.now();
      this.engine.runRenderLoop(() => {
        if (this.scene) {
          const now = performance.now();
          const dt = (now - this.lastTime) / 1000;
          this.lastTime = now;

          this.updatePhysics(dt);
          this.scene.render();
        }
      });

      // Initial position sync
      this.syncMotorcyclePosition();

    } catch (e) {
      console.error('Failed to boot Babylon simulator', e);
    }
  }



  // --- Main Update Loop ---
  private updatePhysics(dt: number) {
    // 1. Blinker Flashing
    if (this.blinkerActive) {
      this.blinkerTimer += dt;
      if (this.blinkerTimer >= 0.35) {
        this.blinkerTimer = 0;
        this.blinkerOn = !this.blinkerOn;
        if (this.blinkerRight) {
          const mat = this.blinkerRight.material as BABYLON.StandardMaterial;
          mat.emissiveColor = this.blinkerOn ? new BABYLON.Color3(1.0, 0.7, 0.0) : new BABYLON.Color3(0.1, 0.1, 0.0);
        }
      }
    } else {
      this.blinkerOn = false;
      if (this.blinkerRight) {
        const mat = this.blinkerRight.material as BABYLON.StandardMaterial;
        mat.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0);
      }
    }

    // 2. Animate look angle when in Cabin view
    this.cameraService.updateCabinLookAngle();

    // 3. Dispatch Scenario / Sandbox Update
    if (this.activeScenario() === 'free') {
      this.updateSandboxMovement(dt);
    } else {
      this.scenarioService.updateScenario(dt, this.getScenarioContext());
    }

    // 4. Update articulated trailer physics
    this.trailerRearPos = this.vehiclesService.updateTrailerPhysics(this.truckNode, this.trailerNode, this.trailerRearPos);
  }

  private updateSandboxMovement(dt: number) {
    let speed = 9.0; // m/s
    let moved = false;

    if (this.keys['w'] || this.keys['arrowup']) {
      this.motorcycleZ.update(z => Math.min(20, z + dt * speed));
      moved = true;
    }
    if (this.keys['s'] || this.keys['arrowdown']) {
      this.motorcycleZ.update(z => Math.max(-30, z - dt * speed));
      moved = true;
    }
    if (this.keys['a'] || this.keys['arrowleft']) {
      this.motorcycleX.update(x => Math.max(-10, x - dt * speed));
      moved = true;
    }
    if (this.keys['d'] || this.keys['arrowright']) {
      this.motorcycleX.update(x => Math.min(10, x + dt * speed));
      moved = true;
    }

    if (moved) {
      this.syncMotorcyclePosition();
    }
  }

  private cleanupBabylon() {
    this.laneLines = [];
    this.blinkerLeft = null;
    this.blinkerRight = null;
    
    [
      this.frontBlindSpotMesh, 
      this.leftBlindSpotMesh, 
      this.rightBlindSpotMesh, 
      this.rearBlindSpotMesh,
      this.truckNode,
      this.trailerNode,
      this.motorcycleNode
    ].forEach(mesh => {
      if (mesh) {
        mesh.dispose();
      }
    });

    this.frontBlindSpotMesh = null;
    this.leftBlindSpotMesh = null;
    this.rightBlindSpotMesh = null;
    this.rearBlindSpotMesh = null;
    this.truckNode = null;
    this.trailerNode = null;
    this.motorcycleNode = null;

    if (this.scene) {
      this.scene.dispose();
      this.scene = null;
    }
    if (this.engine) {
      this.engine.dispose();
      this.engine = null;
    }
    this.cameraService.cleanup();
  }

}
