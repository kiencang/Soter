import { Injectable, signal, inject } from '@angular/core';
import * as BABYLON from '@babylonjs/core';
import { SimulatorScenarioRightTurnService } from './simulator-scenario-right-turn.service';
import { SimulatorScenarioCutOffService } from './simulator-scenario-cut-off.service';
import { SimulatorScenarioTailgateService } from './simulator-scenario-tailgate.service';

export interface ScenarioContext {
  truckNode: BABYLON.TransformNode | null;
  trailerNode: BABYLON.TransformNode | null;
  motorcycleNode: BABYLON.TransformNode | null;
  motorcycleX: { set(val: number): void };
  motorcycleZ: { set(val: number): void };
  syncMotorcyclePosition: () => void;
  checkBlindSpotState: () => void;
  setViewMode: (mode: 'orbit' | 'cabin' | 'rider') => void;
  intersectionMeshes: BABYLON.Mesh[];
  laneLines: any[];
  setBlinkerActive: (active: boolean, side?: 'left' | 'right' | 'both') => void;
  setMotoBlinkerActive: (active: boolean, side?: 'left' | 'right' | 'both') => void;
  getTrailerRearPos: () => BABYLON.Vector3 | null;
  setTrailerRearPos: (pos: BABYLON.Vector3 | null) => void;
}

@Injectable({ providedIn: 'root' })
export class SimulatorScenarioService {
  private rightTurnScenario = inject(SimulatorScenarioRightTurnService);
  private cutOffScenario = inject(SimulatorScenarioCutOffService);
  private tailgateScenario = inject(SimulatorScenarioTailgateService);

  activeScenario = signal<'free' | 'right_turn' | 'cut_off' | 'tailgate'>('right_turn');
  isPlayingScenario = signal<boolean>(false);
  isAtStart = signal<boolean>(true);
  isCompleted = signal<boolean>(false);
  scenarioStage = signal<number>(0);
  scenarioText = signal<string>('');
  trafficLightColor = signal<'red' | 'yellow' | 'green'>('green');
  
  scenarioTimer = 0;

  startScenario(type: 'free' | 'right_turn' | 'cut_off' | 'tailgate', ctx: ScenarioContext) {
    this.activeScenario.set(type);
    this.isPlayingScenario.set(false);
    this.isAtStart.set(true);
    this.isCompleted.set(false);
    this.scenarioTimer = 0;
    this.scenarioStage.set(0);

    this.rightTurnScenario.reset();
    this.cutOffScenario.reset();
    this.tailgateScenario.reset();

    if (type === 'right_turn') {
      this.trafficLightColor.set('green');
    } else if (type === 'cut_off') {
      this.trafficLightColor.set('red');
    } else if (type === 'tailgate') {
      this.trafficLightColor.set('green');
    } else {
      this.trafficLightColor.set('green');
    }

    // Set initial text based on the scenario
    if (type === 'right_turn') {
      this.scenarioText.set("Bài học: Khi xe tải rẽ, hiện tượng 'cắt góc' của xe tải lớn/xe container khiến nó quét qua các làn bên trong. TUYỆT ĐỐI không đi song song với xe tải lớn/xe container ở các khúc cua hoặc ngã tư.");
    } else if (type === 'cut_off') {
      this.scenarioText.set("Bài học: Có hai vấn đề cần lưu ý ở đây, (a) Xe gắn máy đang ở trong vùng điểm mù, (b) Sau đó lại di chuyển nhanh và tạt đầu đột ngột ngay sát mũi xe tải lớn.");
    } else if (type === 'tailgate') {
      this.scenarioText.set("Bài học: Luôn giữ khoảng cách an toàn tối thiểu (quy tắc 3 giây) khi chạy sau xe tải lớn. Giúp bạn luôn có tầm nhìn thoáng và đủ thời gian phản ứng khi xe trước phanh gấp.");
    } else {
      this.scenarioText.set("");
    }
    ctx.setBlinkerActive(false);
    ctx.setMotoBlinkerActive(false);

    // Reset positions
    if (ctx.truckNode) {
      const initialTruckX = 2.25;
      let initialTruckZ = 0;
      if (type === 'right_turn') {
        initialTruckZ = -34.1;
      } else if (type === 'cut_off') {
        initialTruckZ = -19.7;
      } else if (type === 'tailgate') {
        initialTruckZ = -50.0;
      } else {
        initialTruckZ = -40.0;
      }
      
      ctx.truckNode.position.set(initialTruckX, 0, initialTruckZ);
      ctx.truckNode.rotation.y = 0;
      if (ctx.trailerNode) {
        ctx.trailerNode.position.set(initialTruckX, 0, initialTruckZ);
        ctx.trailerNode.rotation.set(0, 0, 0);
      }
      ctx.setTrailerRearPos(new BABYLON.Vector3(initialTruckX, 0.6, initialTruckZ - 11.25));
    }

    if (ctx.motorcycleNode) {
      ctx.motorcycleNode.rotation.set(0, 0, 0);
      ctx.motorcycleNode.scaling.set(1, 1, 1);
      ctx.motorcycleNode.position.y = (type === 'tailgate') ? 0.015 : 0;
    }

    ctx.intersectionMeshes.forEach(mesh => mesh.isVisible = true);

    if (type === 'free') {
      ctx.motorcycleX.set(6.05);
      ctx.motorcycleZ.set(-45.0);
      ctx.syncMotorcyclePosition();
      ctx.setViewMode('orbit');
    } else if (type === 'right_turn') {
      ctx.motorcycleX.set(6.05);
      ctx.motorcycleZ.set(-33.1);
      ctx.syncMotorcyclePosition();
      ctx.setViewMode('orbit');
    } else if (type === 'cut_off') {
      ctx.motorcycleX.set(6.05);
      ctx.motorcycleZ.set(-18.0);
      ctx.syncMotorcyclePosition();
      ctx.setViewMode('orbit');
    } else if (type === 'tailgate') {
      ctx.motorcycleX.set(2.25);
      ctx.motorcycleZ.set(-63.85);
      ctx.syncMotorcyclePosition();
      ctx.setViewMode('orbit');
    }
  }

  resetScenario(ctx: ScenarioContext) {
    this.startScenario(this.activeScenario(), ctx);
  }

  updateScenario(dt: number, ctx: ScenarioContext) {
    if (!this.isPlayingScenario()) return;

    if (this.scenarioTimer === 0 && dt > 0) {
      this.isAtStart.set(false);
    }
    this.scenarioTimer += dt;
    const t = this.scenarioTimer;
    const scenario = this.activeScenario();

    const setStage = (stage: number) => this.scenarioStage.set(stage);
    const setPlaying = (playing: boolean) => this.isPlayingScenario.set(playing);

    if (scenario === 'right_turn') {
      this.rightTurnScenario.animate(t, ctx, setStage, setPlaying);
    } else if (scenario === 'cut_off') {
      this.cutOffScenario.animate(t, ctx, setStage, setPlaying, (color) => this.trafficLightColor.set(color));
    } else if (scenario === 'tailgate') {
      this.tailgateScenario.animate(t, dt, ctx, setStage, setPlaying);
    }

    if (!this.isPlayingScenario()) {
      this.isCompleted.set(true);
    }
  }
}
