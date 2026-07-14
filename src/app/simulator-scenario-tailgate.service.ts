import { Injectable, inject } from '@angular/core';
import * as BABYLON from '@babylonjs/core';
import { ScenarioContext } from './simulator-scenarios.service';
import { SimulatorAudioService } from './simulator-audio.service';

@Injectable({ providedIn: 'root' })
export class SimulatorScenarioTailgateService {
  private audioService = inject(SimulatorAudioService);
  private hasBraked = false;
  private hasCrashed = false;

  reset() {
    this.hasBraked = false;
    this.hasCrashed = false;
  }

  animate(
    t: number,
    dt: number,
    ctx: ScenarioContext,
    setStage: (stage: number) => void,
    setPlaying: (playing: boolean) => void
  ) {
    const speed = 10.0;
    const initialZ = -50.0;
    
    // Khoảng cách bám đuôi 1.5 mét:
    // Distance = (truckZ - 11.25) - (bikeZ + 1.1) = 1.5
    // -> bikeZ = truckZ - 13.85
    const bikeOffset = -13.85; 
    
    let truckZ = initialZ;
    let bikeZ = initialZ + bikeOffset;

    // Stage 0: 0s to 2.5s -> Riding close behind
    if (t < 2.5) {
      setStage(0);
      truckZ = initialZ + t * speed;
      bikeZ = truckZ + bikeOffset;
      this.updatePositions(ctx, truckZ, bikeZ);
    }
    // Stage 1: 2.5s to 5.0s -> Still tailgating, completely invisible in mirrors
    else if (t < 5.0) {
      setStage(1);
      truckZ = initialZ + t * speed;
      bikeZ = truckZ + bikeOffset;
      this.updatePositions(ctx, truckZ, bikeZ);
    }
    // Stage 2: 5.0s to 8.5s -> Sudden emergency brake!
    else if (t < 8.5) {
      setStage(2);
      
      const activeT = t - 5.0;
      const truckStartZ = initialZ + 5.0 * speed;
      const bikeStartZ = truckStartZ + bikeOffset;
      
      // Truck decelerates to stop in 1.5s
      const truckDecel = speed / 1.5;
      let truckDist = 0;
      if (activeT < 1.5) {
        truckDist = speed * activeT - 0.5 * truckDecel * activeT * activeT;
      } else {
        truckDist = speed * 1.5 - 0.5 * truckDecel * 1.5 * 1.5;
      }
      truckZ = truckStartZ + truckDist;
      
      // Bike has 0.5s reaction time, then brakes but crashes
      let bikeDist = 0;
      if (activeT < 0.5) {
        bikeDist = speed * activeT;
      } else {
        if (!this.hasBraked) {
          this.audioService.playBrakeSound();
          this.hasBraked = true;
        }
        const brakeT = Math.min(activeT - 0.5, 1.0);
        const bikeDecel = speed / 1.0;
        bikeDist = speed * 0.5 + speed * brakeT - 0.5 * bikeDecel * brakeT * brakeT;
      }
      bikeZ = bikeStartZ + bikeDist;
      
      // Collision happens if bike gets too close to the rear of the trailer
      const collisionLimitZ = truckZ - 12.35;
      
      if (ctx.truckNode) {
        ctx.truckNode.position.set(2.25, 0, truckZ);
        ctx.setTrailerRearPos(new BABYLON.Vector3(2.25, 0.6, truckZ - 11.25));
      }
      
      ctx.motorcycleX.set(2.25);
      
      if (bikeZ >= collisionLimitZ) {
        if (!this.hasCrashed) {
          this.audioService.playCrashSound();
          this.hasCrashed = true;
        }
        // Crashed
        bikeZ = collisionLimitZ; 
        ctx.motorcycleZ.set(bikeZ);
        
        if (ctx.motorcycleNode) {
          const crashActiveT = Math.max(0, activeT - 0.3);
          const crushFactor = Math.min(crashActiveT / 0.5, 1.0);
          
          const fallY = 0.015 + (crushFactor * 0.28);
          ctx.motorcycleNode.position.set(2.25, fallY, bikeZ);
          
          // Xe húc vào đít xe tải: bốc đuôi lên một chút rồi đổ
          const pitchAngle = Math.sin(crushFactor * Math.PI) * (Math.PI / 6); 
          const fallAngle = crushFactor * (Math.PI / 2.2);
          
          ctx.motorcycleNode.rotation.x = pitchAngle; 
          ctx.motorcycleNode.rotation.y = crushFactor * 0.3; 
          ctx.motorcycleNode.rotation.z = -fallAngle; 
          
          // Bẹp đầu xe
          const scalingFactor = Math.max(1.0 - crushFactor * 0.3, 0.7);
          ctx.motorcycleNode.scaling.set(1.0, 1.0, scalingFactor);
        }
      } else {
        // Not crashed yet
        ctx.motorcycleZ.set(bikeZ);
        if (ctx.motorcycleNode) {
          ctx.motorcycleNode.position.set(2.25, 0.015, bikeZ);
          ctx.motorcycleNode.rotation.x = 0;
          ctx.motorcycleNode.rotation.y = 0;
          ctx.motorcycleNode.rotation.z = 0;
          ctx.motorcycleNode.scaling.set(1, 1, 1);
        }
      }
      
      ctx.checkBlindSpotState();
    }
    // Stage 3: End of Scenario
    else {
      setPlaying(false);
    }
  }

  private updatePositions(ctx: ScenarioContext, truckZ: number, bikeZ: number) {
    if (ctx.truckNode) {
      ctx.truckNode.position.set(2.25, 0, truckZ);
      ctx.setTrailerRearPos(new BABYLON.Vector3(2.25, 0.6, truckZ - 11.25));
    }
    ctx.motorcycleX.set(2.25);
    ctx.motorcycleZ.set(bikeZ);
    if (ctx.motorcycleNode) {
      ctx.motorcycleNode.position.set(2.25, 0.015, bikeZ);
      ctx.motorcycleNode.rotation.x = 0;
      ctx.motorcycleNode.rotation.y = 0;
      ctx.motorcycleNode.rotation.z = 0;
      ctx.motorcycleNode.scaling.set(1, 1, 1);
    }
    ctx.syncMotorcyclePosition();
  }
}

