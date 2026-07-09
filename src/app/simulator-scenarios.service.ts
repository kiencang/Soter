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
  setBlinkerActive: (active: boolean) => void;
  getTrailerRearPos: () => BABYLON.Vector3 | null;
  setTrailerRearPos: (pos: BABYLON.Vector3 | null) => void;
}

@Injectable({ providedIn: 'root' })
export class SimulatorScenarioService {
  private rightTurnScenario = inject(SimulatorScenarioRightTurnService);
  private cutOffScenario = inject(SimulatorScenarioCutOffService);
  private tailgateScenario = inject(SimulatorScenarioTailgateService);

  activeScenario = signal<'free' | 'right_turn' | 'cut_off' | 'tailgate'>('free');
  isPlayingScenario = signal<boolean>(false);
  scenarioStage = signal<number>(0);
  scenarioText = signal<string>('');
  
  scenarioTimer = 0;

  startScenario(type: 'free' | 'right_turn' | 'cut_off' | 'tailgate', ctx: ScenarioContext) {
    this.activeScenario.set(type);
    this.isPlayingScenario.set(type !== 'free');
    this.scenarioTimer = 0;
    this.scenarioStage.set(0);
    ctx.setBlinkerActive(false);

    // Reset positions
    if (ctx.truckNode) {
      ctx.truckNode.position.set(0, 0, 0);
      ctx.truckNode.rotation.y = 0;
      if (ctx.trailerNode) {
        ctx.trailerNode.position.set(0, 0, 0);
        ctx.trailerNode.rotation.set(0, 0, 0);
      }
      ctx.setTrailerRearPos(new BABYLON.Vector3(0, 0.6, -11.25));
    }

    if (type === 'free' || type === 'tailgate') {
      ctx.intersectionMeshes.forEach(mesh => mesh.isVisible = false);
    } else {
      ctx.intersectionMeshes.forEach(mesh => mesh.isVisible = true);
    }

    if (type === 'free') {
      ctx.motorcycleX.set(4.0);
      ctx.motorcycleZ.set(-5.0);
      ctx.syncMotorcyclePosition();
      ctx.setViewMode('orbit');
    } else if (type === 'right_turn') {
      ctx.motorcycleX.set(3.8);
      ctx.motorcycleZ.set(-7.0);
      ctx.syncMotorcyclePosition();
      ctx.setViewMode('orbit');
    } else if (type === 'cut_off') {
      ctx.motorcycleX.set(4.0);
      ctx.motorcycleZ.set(2.0);
      ctx.syncMotorcyclePosition();
      ctx.setViewMode('orbit');
    } else if (type === 'tailgate') {
      ctx.motorcycleX.set(0.0);
      ctx.motorcycleZ.set(-15.0);
      ctx.syncMotorcyclePosition();
      ctx.setViewMode('rider');
    }
  }

  resetScenario(ctx: ScenarioContext) {
    this.startScenario(this.activeScenario(), ctx);
  }

  updateScenario(dt: number, ctx: ScenarioContext) {
    if (!this.isPlayingScenario()) return;

    this.scenarioTimer += dt;
    const t = this.scenarioTimer;
    const scenario = this.activeScenario();

    const setStage = (stage: number) => this.scenarioStage.set(stage);
    const setText = (text: string) => this.scenarioText.set(text);
    const setPlaying = (playing: boolean) => this.isPlayingScenario.set(playing);

    if (scenario === 'right_turn') {
      this.rightTurnScenario.animate(t, ctx, setStage, setText, setPlaying);
    } else if (scenario === 'cut_off') {
      this.cutOffScenario.animate(t, ctx, setStage, setText, setPlaying);
    } else if (scenario === 'tailgate') {
      this.tailgateScenario.animate(t, dt, ctx, setStage, setText, setPlaying);
    }
  }
}
