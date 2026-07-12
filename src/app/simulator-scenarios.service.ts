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
  scenarioStage = signal<number>(0);
  scenarioText = signal<string>('');
  
  scenarioTimer = 0;

  startScenario(type: 'free' | 'right_turn' | 'cut_off' | 'tailgate', ctx: ScenarioContext) {
    this.activeScenario.set(type);
    this.isPlayingScenario.set(type !== 'free');
    this.scenarioTimer = 0;
    this.scenarioStage.set(0);
    ctx.setBlinkerActive(false);
    ctx.setMotoBlinkerActive(false);

    // Reset positions
    if (ctx.truckNode) {
      const initialTruckX = 2.25;
      let initialTruckZ = 0;
      if (type === 'right_turn') {
        initialTruckZ = -19.14;
      } else if (type === 'cut_off') {
        initialTruckZ = -19.7;
      } else if (type === 'free' || type === 'tailgate') {
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

    ctx.intersectionMeshes.forEach(mesh => mesh.isVisible = true);

    if (type === 'free') {
      ctx.motorcycleX.set(6.05);
      ctx.motorcycleZ.set(-45.0);
      ctx.syncMotorcyclePosition();
      ctx.setViewMode('orbit');
    } else if (type === 'right_turn') {
      ctx.motorcycleX.set(6.05);
      ctx.motorcycleZ.set(-21.64);
      ctx.syncMotorcyclePosition();
      ctx.setViewMode('orbit');
    } else if (type === 'cut_off') {
      ctx.motorcycleX.set(6.05);
      ctx.motorcycleZ.set(-15.5);
      ctx.syncMotorcyclePosition();
      ctx.setViewMode('orbit');
    } else if (type === 'tailgate') {
      ctx.motorcycleX.set(2.25);
      ctx.motorcycleZ.set(-55.0);
      ctx.syncMotorcyclePosition();
      ctx.setViewMode('orbit');
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
