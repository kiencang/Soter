
import { Injectable, signal, inject, computed } from '@angular/core';
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
  webGlSupported = signal<boolean>(true);

  // Real-time motorcycle state
  motorcycleX = signal<number>(6.05);
  motorcycleZ = signal<number>(-16.5);

  // Status indicators (Vietnamese)
  currentZone = signal<string>('Ngoài vùng nguy hiểm');
  isBlindSpot = signal<boolean>(false);
  currentDetail = signal<string>('Bạn đang ở ngoài các vùng nguy hiểm. Hãy thử di chuyển xe máy vào sát xe tải để xem sự thay đổi tầm nhìn.');

  leftMirrorStatus = computed(() => {
    if (!this.motorcycleNode || !this.truckNode) return 'EMPTY';
    const motorcycleWorldPos = this.motorcycleNode.position;
    const mLocalTruck = BABYLON.Vector3.TransformCoordinates(motorcycleWorldPos, this.truckNode.getWorldMatrix().clone().invert());
    const tx = mLocalTruck.x;
    const tz = mLocalTruck.z;

    // Left mirror coverage check
    if (tx <= -0.5 && tx >= -12.0 && tz <= 4.0 && tz >= -30.0) {
      const qLeft = this.logicService.getLeftBlindSpotVerticesLocal();
      const isBlind = this.logicService.isPointInQuad(tx, tz, qLeft);
      return isBlind ? 'BLIND' : 'VISIBLE';
    }
    return 'EMPTY';
  });

  rightMirrorStatus = computed(() => {
    if (!this.motorcycleNode || !this.truckNode) return 'EMPTY';
    const motorcycleWorldPos = this.motorcycleNode.position;
    const mLocalTruck = BABYLON.Vector3.TransformCoordinates(motorcycleWorldPos, this.truckNode.getWorldMatrix().clone().invert());
    const tx = mLocalTruck.x;
    const tz = mLocalTruck.z;

    // Right mirror coverage check (now relative to truckNode as well for perfect alignment!)
    if (tx >= 0.5 && tx <= 12.0 && tz <= 4.0 && tz >= -30.0) {
      const qRight = this.logicService.getRightBlindSpotVerticesLocal();
      const isBlind = this.logicService.isPointInQuad(tx, tz, qRight);
      return isBlind ? 'BLIND' : 'VISIBLE';
    }
    return 'EMPTY';
  });

  frontMirrorStatus = computed(() => {
    if (!this.motorcycleNode || !this.truckNode) return 'EMPTY';
    const motorcycleWorldPos = this.motorcycleNode.position;
    const mLocalTruck = BABYLON.Vector3.TransformCoordinates(motorcycleWorldPos, this.truckNode.getWorldMatrix().clone().invert());
    const tx = mLocalTruck.x;
    const tz = mLocalTruck.z;

    const qFront = [
      { x: -1.5, z: 4.85 },
      { x: 1.5, z: 4.85 },
      { x: 1.5, z: 7.3 },
      { x: -1.5, z: 7.3 }
    ];
    const isBlind = this.logicService.isPointInQuad(tx, tz, qFront);
    return isBlind ? 'BLIND' : 'EMPTY';
  });

  // Scenario states
  get activeScenario() { return this.scenarioService.activeScenario; }
  get isPlayingScenario() { return this.scenarioService.isPlayingScenario; }
  get isAtStart() { return this.scenarioService.isAtStart; }
  get isCompleted() { return this.scenarioService.isCompleted; }
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
  private carNode: BABYLON.TransformNode | null = null;

  // Track positions for wheel rotation physics
  private lastTruckPos: BABYLON.Vector3 | null = null;
  private lastTrailerPos: BABYLON.Vector3 | null = null;
  private lastMotorcyclePos: BABYLON.Vector3 | null = null;
  private lastCarPos: BABYLON.Vector3 | null = null;
  
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
  private trafficLightRed: BABYLON.Mesh | null = null;
  private trafficLightYellow: BABYLON.Mesh | null = null;
  private trafficLightGreen: BABYLON.Mesh | null = null;
  private lastTrafficLightColor: 'red' | 'yellow' | 'green' | null = null;
  private blinkerTimer = 0;
  private blinkerActive = false;
  private blinkerSide: 'left' | 'right' | 'both' = 'both';
  private motoBlinkerActive = false;
  private motoBlinkerSide: 'left' | 'right' | 'both' = 'both';
  private blinkerOn = false;
  private motoBlinkerLeftMeshes: BABYLON.Mesh[] = [];
  private motoBlinkerRightMeshes: BABYLON.Mesh[] = [];

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
    const isScenarioActive = this.gameState() === 'SIMULATION' && this.activeScenario() !== 'free' && this.isPlayingScenario();
    this.audioService.toggleSound(isScenarioActive);
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
      carNode: this.carNode,
      motorcycleX: this.motorcycleX,
      motorcycleZ: this.motorcycleZ,
      syncMotorcyclePosition: () => this.syncMotorcyclePosition(),
      checkBlindSpotState: () => this.checkBlindSpotState(),
      setViewMode: (mode) => this.setViewMode(mode),
      intersectionMeshes: this.intersectionMeshes,
      laneLines: this.laneLines,
      setBlinkerActive: (active, side) => { 
        this.blinkerActive = active; 
        this.blinkerSide = side || 'both';
      },
      setMotoBlinkerActive: (active, side) => {
        this.motoBlinkerActive = active;
        this.motoBlinkerSide = side || 'both';
      },
      getTrailerRearPos: () => this.trailerRearPos,
      setTrailerRearPos: (pos) => { this.trailerRearPos = pos; },
      setScenarioText: (text) => { this.scenarioService.scenarioText.set(text); }
    };
  }

  // --- Scenario handling ---
  startScenario(type: 'free' | 'right_turn' | 'cut_off' | 'tailgate') {
    this.lastTruckPos = null;
    this.lastTrailerPos = null;
    this.lastMotorcyclePos = null;
    this.lastCarPos = null;
    this.scenarioService.startScenario(type, this.getScenarioContext());
    this.updateAudioForScenario(type);
  }

  resetScenario() {
    this.lastTruckPos = null;
    this.lastTrailerPos = null;
    this.lastMotorcyclePos = null;
    this.lastCarPos = null;
    this.scenarioService.resetScenario(this.getScenarioContext());
    this.updateAudioForScenario(this.activeScenario());
  }

  playScenario() {
    if (this.isCompleted()) {
      this.resetScenario();
    }
    this.scenarioService.isPlayingScenario.set(true);
    this.updateAudioForScenario(this.activeScenario());
  }

  private updateAudioForScenario(type: 'free' | 'right_turn' | 'cut_off' | 'tailgate') {
    if (type !== 'free') {
      if (this.soundEnabled() && this.isPlayingScenario()) {
        this.audioService.initAudio();
      }
    } else {
      this.audioService.stopSound();
    }
  }

  // --- Simulation Flow ---
  startSimulation() {
    this.gameState.set('SIMULATION');
    this.cameraService.setFrontMirrorVisible(true);
    this.startScenario('right_turn');
  }

  goToMenu() {
    this.gameState.set('MENU');
    this.audioService.stopSound();
    this.cameraService.setFrontMirrorVisible(false);
    this.setViewMode('orbit');
  }

  // --- Real-time Blind Spot Logic ---
  private checkBlindSpotState() {
    if (!this.truckNode || !this.trailerNode || !this.motorcycleNode) return;
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
      this.scene.clearColor = new BABYLON.Color4(0.0588, 0.0902, 0.1647, 1); // Perfect match with Tailwind's bg-slate-900 (#0f172a)

      // Lights
      const hemiLight = new BABYLON.HemisphericLight('hemiLight', new BABYLON.Vector3(0, 1, 0), this.scene);
      hemiLight.intensity = 0.7;
      hemiLight.diffuse = new BABYLON.Color3(0.9, 0.95, 1.0);

      const dirLight = new BABYLON.DirectionalLight('dirLight', new BABYLON.Vector3(-1, -2, 1), this.scene);
      dirLight.intensity = 0.8;
      dirLight.diffuse = new BABYLON.Color3(1.0, 0.95, 0.85); // Warm sunlight

      // Build Road and Environment
      this.environmentService.createRoadGrid(this.scene!, this.laneLines, this.intersectionMeshes);

      // Build Traffic Light (Cột đèn giao thông mô phỏng)
      const tl = this.environmentService.createTrafficLight(this.scene!);
      this.trafficLightRed = tl.red;
      this.trafficLightYellow = tl.yellow;
      this.trafficLightGreen = tl.green;

      // Build 3D Models
      const truckResult = this.vehiclesService.createTruck(this.scene!);
      this.truckNode = truckResult.truckNode;
      this.trailerNode = truckResult.trailerNode;
      this.blinkerLeft = truckResult.blinkerLeft;
      this.blinkerRight = truckResult.blinkerRight;
      this.motorcycleNode = this.vehiclesService.createMotorcycle(this.scene!);
      this.carNode = this.vehiclesService.createCar(this.scene!);
      this.carNode.setEnabled(false);

      // Set initial positions for the MENU state (right-hand traffic lanes)
      if (this.truckNode) {
        this.truckNode.position.set(2.25, 0, 0);
      }
      if (this.trailerNode) {
        this.trailerNode.position.set(2.25, 0, 0);
      }
      this.trailerRearPos = new BABYLON.Vector3(2.25, 0.6, -11.25);
      this.motoBlinkerLeftMeshes = this.motorcycleNode.getChildMeshes().filter(m => m.name === 'mFrontSignalL' || m.name === 'mRearSignalL') as BABYLON.Mesh[];
      this.motoBlinkerRightMeshes = this.motorcycleNode.getChildMeshes().filter(m => m.name === 'mFrontSignalR' || m.name === 'mRearSignalR') as BABYLON.Mesh[];

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
      console.warn('WebGL or Babylon.js init failed (graceful fallback):', e);
      this.webGlSupported.set(false);
    }
  }



  // --- Main Update Loop ---
  private updatePhysics(dt: number) {
    if (!this.scene || !this.truckNode || !this.motorcycleNode) return;

    // 1. Blinker Flashing
    this.blinkerTimer += dt;
    if (this.blinkerTimer >= 0.35) {
      this.blinkerTimer = 0;
      this.blinkerOn = !this.blinkerOn;
    }

    // Truck Blinker
    if (this.blinkerActive) {
      const isLeftOn = this.blinkerOn && (this.blinkerSide === 'left' || this.blinkerSide === 'both');
      const isRightOn = this.blinkerOn && (this.blinkerSide === 'right' || this.blinkerSide === 'both');

      if (this.blinkerLeft) {
        const mat = this.blinkerLeft.material as BABYLON.StandardMaterial;
        mat.emissiveColor = isLeftOn ? new BABYLON.Color3(1.0, 0.7, 0.0) : new BABYLON.Color3(0.1, 0.1, 0.0);
      }
      if (this.blinkerRight) {
        const mat = this.blinkerRight.material as BABYLON.StandardMaterial;
        mat.emissiveColor = isRightOn ? new BABYLON.Color3(1.0, 0.7, 0.0) : new BABYLON.Color3(0.1, 0.1, 0.0);
      }
    } else {
      if (this.blinkerLeft) {
        const mat = this.blinkerLeft.material as BABYLON.StandardMaterial;
        mat.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.0);
      }
      if (this.blinkerRight) {
        const mat = this.blinkerRight.material as BABYLON.StandardMaterial;
        mat.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.0);
      }
    }

    // Moto Blinker
    if (this.motoBlinkerActive) {
      const isLeftOn = this.blinkerOn && (this.motoBlinkerSide === 'left' || this.motoBlinkerSide === 'both');
      const isRightOn = this.blinkerOn && (this.motoBlinkerSide === 'right' || this.motoBlinkerSide === 'both');

      this.motoBlinkerLeftMeshes.forEach(mesh => {
        const mat = mesh.material as BABYLON.StandardMaterial;
        mat.emissiveColor = isLeftOn ? new BABYLON.Color3(1.0, 0.5, 0.0) : new BABYLON.Color3(0.1, 0.05, 0.0);
      });
      this.motoBlinkerRightMeshes.forEach(mesh => {
        const mat = mesh.material as BABYLON.StandardMaterial;
        mat.emissiveColor = isRightOn ? new BABYLON.Color3(1.0, 0.5, 0.0) : new BABYLON.Color3(0.1, 0.05, 0.0);
      });
    } else {
      this.motoBlinkerLeftMeshes.forEach(mesh => {
        const mat = mesh.material as BABYLON.StandardMaterial;
        mat.emissiveColor = new BABYLON.Color3(0.1, 0.05, 0.0);
      });
      this.motoBlinkerRightMeshes.forEach(mesh => {
        const mat = mesh.material as BABYLON.StandardMaterial;
        mat.emissiveColor = new BABYLON.Color3(0.1, 0.05, 0.0);
      });
    }

    // 2. Animate look angle when in Cabin view
    this.cameraService.updateCabinLookAngle(this.truckNode);
    this.cameraService.update(this.truckNode);

    // 3. Dispatch Scenario / Sandbox Update
    if (this.activeScenario() === 'free') {
      this.updateSandboxMovement(dt);
    } else {
      this.scenarioService.updateScenario(dt, this.getScenarioContext());
      // If the scenario lesson has finished (is no longer actively playing), turn off the audio hum
      if (!this.isPlayingScenario()) {
        this.audioService.stopSound();
      }
    }

    // 4. Update articulated trailer physics
    this.trailerRearPos = this.vehiclesService.updateTrailerPhysics(this.truckNode, this.trailerNode, this.trailerRearPos);

    // 5. Spin wheels in motion
    this.spinWheelsInMotion(dt);

    // 6. Update Traffic Light
    this.updateTrafficLight();
  }

  private updateTrafficLight() {
    if (!this.trafficLightRed || !this.trafficLightYellow || !this.trafficLightGreen) return;
    const color = this.scenarioService.trafficLightColor();
    if (color === this.lastTrafficLightColor) return;
    this.lastTrafficLightColor = color;

    const redMat = this.trafficLightRed.material as BABYLON.StandardMaterial;
    const yellowMat = this.trafficLightYellow.material as BABYLON.StandardMaterial;
    const greenMat = this.trafficLightGreen.material as BABYLON.StandardMaterial;

    if (color === 'red') {
      redMat.diffuseColor = new BABYLON.Color3(1.0, 0.2, 0.2);
      redMat.emissiveColor = new BABYLON.Color3(0.9, 0.1, 0.1);
      
      yellowMat.diffuseColor = new BABYLON.Color3(0.2, 0.16, 0.05);
      yellowMat.emissiveColor = new BABYLON.Color3(0.05, 0.04, 0);

      greenMat.diffuseColor = new BABYLON.Color3(0.05, 0.2, 0.05);
      greenMat.emissiveColor = new BABYLON.Color3(0, 0.05, 0);
    } else if (color === 'yellow') {
      redMat.diffuseColor = new BABYLON.Color3(0.2, 0.05, 0.05);
      redMat.emissiveColor = new BABYLON.Color3(0.05, 0, 0);

      yellowMat.diffuseColor = new BABYLON.Color3(1.0, 0.8, 0.2);
      yellowMat.emissiveColor = new BABYLON.Color3(0.9, 0.7, 0.1);

      greenMat.diffuseColor = new BABYLON.Color3(0.05, 0.2, 0.05);
      greenMat.emissiveColor = new BABYLON.Color3(0, 0.05, 0);
    } else if (color === 'green') {
      redMat.diffuseColor = new BABYLON.Color3(0.2, 0.05, 0.05);
      redMat.emissiveColor = new BABYLON.Color3(0.05, 0, 0);

      yellowMat.diffuseColor = new BABYLON.Color3(0.2, 0.16, 0.05);
      yellowMat.emissiveColor = new BABYLON.Color3(0.05, 0.04, 0);

      greenMat.diffuseColor = new BABYLON.Color3(0.2, 1.0, 0.2);
      greenMat.emissiveColor = new BABYLON.Color3(0.1, 0.9, 0.1);
    }
  }

  private spinWheelsInMotion(dt: number) {
    if (!this.scene) return;

    // 1. Initialize last positions on first run or when reset
    if (this.truckNode && !this.lastTruckPos) {
      this.lastTruckPos = this.truckNode.position.clone();
    }
    if (this.trailerNode && !this.lastTrailerPos) {
      this.lastTrailerPos = this.trailerNode.position.clone();
    }
    if (this.motorcycleNode && !this.lastMotorcyclePos) {
      this.lastMotorcyclePos = this.motorcycleNode.position.clone();
    }
    if (this.carNode && !this.lastCarPos) {
      this.lastCarPos = this.carNode.position.clone();
    }

    // 2. Calculate displacements
    let truckDistance = 0;
    if (this.truckNode && this.lastTruckPos) {
      const currentPos = this.truckNode.position;
      truckDistance = BABYLON.Vector3.Distance(currentPos, this.lastTruckPos);
      const forward = this.truckNode.forward || this.truckNode.getDirection(BABYLON.Axis.Z);
      const direction = currentPos.subtract(this.lastTruckPos);
      const dot = BABYLON.Vector3.Dot(direction, forward);
      if (dot < 0) {
        truckDistance = -truckDistance;
      }
      this.lastTruckPos.copyFrom(currentPos);
    }

    let trailerDistance = 0;
    if (this.trailerNode && this.lastTrailerPos) {
      const currentPos = this.trailerNode.position;
      trailerDistance = BABYLON.Vector3.Distance(currentPos, this.lastTrailerPos);
      const forward = this.trailerNode.forward || this.trailerNode.getDirection(BABYLON.Axis.Z);
      const direction = currentPos.subtract(this.lastTrailerPos);
      const dot = BABYLON.Vector3.Dot(direction, forward);
      if (dot < 0) {
        trailerDistance = -trailerDistance;
      }
      this.lastTrailerPos.copyFrom(currentPos);
    }

    let motorcycleDistance = 0;
    if (this.motorcycleNode && this.lastMotorcyclePos) {
      const currentPos = this.motorcycleNode.position;
      motorcycleDistance = BABYLON.Vector3.Distance(currentPos, this.lastMotorcyclePos);
      const forward = this.motorcycleNode.forward || this.motorcycleNode.getDirection(BABYLON.Axis.Z);
      const direction = currentPos.subtract(this.lastMotorcyclePos);
      const dot = BABYLON.Vector3.Dot(direction, forward);
      if (dot < 0) {
        motorcycleDistance = -motorcycleDistance;
      }
      this.lastMotorcyclePos.copyFrom(currentPos);
    }

    let carDistance = 0;
    if (this.carNode && this.lastCarPos) {
      const currentPos = this.carNode.position;
      carDistance = BABYLON.Vector3.Distance(currentPos, this.lastCarPos);
      const forward = this.carNode.forward || this.carNode.getDirection(BABYLON.Axis.Z);
      const direction = currentPos.subtract(this.lastCarPos);
      const dot = BABYLON.Vector3.Dot(direction, forward);
      if (dot < 0) {
        carDistance = -carDistance;
      }
      this.lastCarPos.copyFrom(currentPos);
    }

    // 3. Apply rotation to Truck and Trailer Tires
    // Tire diameter is ~1.2m, radius is ~0.6m. Rotation angle = distance / radius.
    // Negative sign because Y rotation axis of cylinder aligns with global movement.
    const truckTires = this.truckNode?.getChildMeshes(false, (mesh) => mesh.name.startsWith('tire_')) || [];
    if (truckTires.length > 0 && Math.abs(truckDistance) > 0.0001) {
      const truckRotDelta = -truckDistance / 0.6;
      truckTires.forEach(tire => {
        tire.rotate(BABYLON.Axis.Y, truckRotDelta, BABYLON.Space.LOCAL);
      });
    }

    const trailerTires = this.trailerNode?.getChildMeshes(false, (mesh) => mesh.name.startsWith('tire_')) || [];
    if (trailerTires.length > 0 && Math.abs(trailerDistance) > 0.0001) {
      const trailerRotDelta = -trailerDistance / 0.6;
      trailerTires.forEach(tire => {
        tire.rotate(BABYLON.Axis.Y, trailerRotDelta, BABYLON.Space.LOCAL);
      });
    }

    // 4. Apply rotation to Motorcycle Wheels
    // Wheel diameter is ~0.55m, radius is ~0.275m. Rotation angle = distance / radius.
    const motoWheels = this.motorcycleNode?.getChildMeshes(false, (mesh) => mesh.name === 'mWheelF' || mesh.name === 'mWheelR') || [];
    if (motoWheels.length > 0 && Math.abs(motorcycleDistance) > 0.0001) {
      const motoRotDelta = -motorcycleDistance / 0.275;
      motoWheels.forEach(wheel => {
        wheel.rotate(BABYLON.Axis.Y, motoRotDelta, BABYLON.Space.LOCAL);
      });
    }

    // 5. Apply rotation to Car Wheels
    // Wheel diameter is ~0.65m, radius is ~0.325m. Rotation angle = distance / radius.
    const carWheels = this.carNode?.getChildMeshes(false, (mesh) => mesh.name.startsWith('carWheel_')) || [];
    if (carWheels.length > 0 && Math.abs(carDistance) > 0.0001) {
      const carRotDelta = -carDistance / 0.325;
      carWheels.forEach(wheel => {
        wheel.rotate(BABYLON.Axis.Y, carRotDelta, BABYLON.Space.LOCAL);
      });
    }
  }

  private updateSandboxMovement(dt: number) {
    let speed = 9.0; // m/s
    let moved = false;

    const truckZ = this.truckNode?.position.z || -40;
    const truckX = this.truckNode?.position.x || 2.25;

    if (this.keys['w'] || this.keys['arrowup']) {
      this.motorcycleZ.update(z => Math.min(truckZ + 30, z + dt * speed));
      moved = true;
    }
    if (this.keys['s'] || this.keys['arrowdown']) {
      this.motorcycleZ.update(z => Math.max(truckZ - 30, z - dt * speed));
      moved = true;
    }
    if (this.keys['a'] || this.keys['arrowleft']) {
      this.motorcycleX.update(x => Math.max(truckX - 15, x - dt * speed));
      moved = true;
    }
    if (this.keys['d'] || this.keys['arrowright']) {
      this.motorcycleX.update(x => Math.min(truckX + 15, x + dt * speed));
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
    this.motoBlinkerLeftMeshes = [];
    this.motoBlinkerRightMeshes = [];
    
    [
      this.frontBlindSpotMesh, 
      this.leftBlindSpotMesh, 
      this.rightBlindSpotMesh, 
      this.rearBlindSpotMesh,
      this.truckNode,
      this.trailerNode,
      this.motorcycleNode,
      this.trafficLightRed,
      this.trafficLightYellow,
      this.trafficLightGreen
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
    this.trafficLightRed = null;
    this.trafficLightYellow = null;
    this.trafficLightGreen = null;
    this.lastTrafficLightColor = null;

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
