import { Injectable, inject } from '@angular/core';
import * as BABYLON from '@babylonjs/core';
import { ScenarioContext } from './simulator-scenarios.service';
import { SimulatorAudioService } from './simulator-audio.service';

@Injectable({ providedIn: 'root' })
export class SimulatorScenarioRightTurnService {
  private audioService = inject(SimulatorAudioService);
  private hasCrashed = false;

  reset() {
    this.hasCrashed = false;
  }

  animate(
    t: number,
    ctx: ScenarioContext,
    setStage: (stage: number) => void,
    setPlaying: (playing: boolean) => void
  ) {
    // Increase the overall speed of the scenario by 35%
    t = t * 1.35;

    const startZ = -34.1;
    const endStraightZ = -12.1;
    const straightTime = 4.0;
    const speed = (endStraightZ - startZ) / straightTime; // 5.5

    // Stage 0: 0s to 4.0s -> Moving straight forward together, signaling
    if (t < 4.0) {
      setStage(0);
      ctx.setBlinkerActive(true, 'right');

      const progressZ = startZ + t * speed;

      if (ctx.truckNode) {
        ctx.truckNode.position.set(2.25, 0, progressZ);
        ctx.truckNode.rotation.y = 0;
        ctx.setTrailerRearPos(new BABYLON.Vector3(2.25, 0.6, progressZ - 11.25));
      }

      // Motorcycle is in Lane 1 (X = 6.05), completely in the blind spot
      ctx.motorcycleX.set(6.05); 
      ctx.motorcycleZ.set(progressZ + 1.0); 
      ctx.syncMotorcyclePosition();

      if (ctx.motorcycleNode) {
        ctx.motorcycleNode.rotation.y = 0;
        ctx.motorcycleNode.rotation.x = 0;
        ctx.motorcycleNode.rotation.z = 0;
        ctx.motorcycleNode.scaling.set(1, 1, 1);
        ctx.motorcycleNode.position.y = 0; // reset y
      }
    }
    // Stage 1: 4.0s to 5.1s -> Truck turns into Lane 2, motorcycle goes straight, collision!
    else if (t < 5.1) {
      setStage(1);
      
      const activeT = t - 4.0; // 0 to 1.1
      const turnT = activeT / 3.3; // Proportion of the 90-degree turn
      const angle = turnT * (Math.PI / 2);
      
      // Radius to end up in Lane 2 (Z = -2.25) from X = 2.25, Z = -12.1
      const R = 9.85; 
      const truckX = (2.25 + R) - R * Math.cos(angle);
      const truckZ = endStraightZ + R * Math.sin(angle);

      if (ctx.truckNode) {
        ctx.truckNode.rotation.y = angle;
        ctx.truckNode.position.set(truckX, 0, truckZ);
      }

      // Motorcycle continues STRAIGHT at original speed
      const bikeZ = endStraightZ + 1.0 + activeT * speed;
      
      ctx.motorcycleX.set(6.05);
      ctx.motorcycleZ.set(bikeZ);
      ctx.syncMotorcyclePosition();

      if (ctx.motorcycleNode) {
        ctx.motorcycleNode.rotation.y = 0;
        ctx.motorcycleNode.rotation.x = 0;
        ctx.motorcycleNode.rotation.z = 0;
        ctx.motorcycleNode.scaling.set(1, 1, 1);
        ctx.motorcycleNode.position.y = 0;
      }
    }
    // Stage 2: 5.1s to 9.8s -> Collision, roll over, and trailer rear wheels crush
    else if (t < 9.8) {
      if (!this.hasCrashed) {
        this.audioService.playCrashSound();
        this.hasCrashed = true;
      }
      setStage(2);
      
      // Implement deceleration after reaction time (starting from t = 5.8)
      let activeT = t - 4.0; // time since truck started turning
      if (t > 5.8) {
        const dt = t - 5.8;
        activeT = 1.8 + dt - 0.11 * dt * dt;
      }
      const fallT = t - 5.1; // time since collision
      
      const turnT = activeT / 3.3; 
      let angle = turnT * (Math.PI / 2);
      const R = 9.85; 
      
      let currentTruckX, currentTruckZ;

      if (angle > Math.PI / 2) {
        angle = Math.PI / 2;
        const extraT = activeT - 3.3; 
        const straightSpeed = (R * Math.PI / 2) / 3.3; 
        currentTruckX = (2.25 + R) + extraT * straightSpeed;
        currentTruckZ = endStraightZ + R;
      } else {
        currentTruckX = (2.25 + R) - R * Math.cos(angle);
        currentTruckZ = endStraightZ + R * Math.sin(angle);
      }

      if (ctx.truckNode) {
        ctx.truckNode.rotation.y = angle;
        ctx.truckNode.position.set(currentTruckX, 0, currentTruckZ);
      }

      // Bike position at collision (t=5.1)
      const collisionActiveT = 5.1 - 4.0; // 1.1
      const collisionBikeZ = endStraightZ + 1.0 + collisionActiveT * speed; 
      const collisionBikeX = 6.05;
      
      const pushDuration = 0.5;
      const pushFactor = Math.min(fallT / pushDuration, 1.0);
      
      // Knock the motorcycle to the right (X increases) to represent being brushed/pushed by the side body
      // This pushes the motorcycle out of the truck's body so it falls on the road side, rather than penetrating the cabin
      const currentBikeX = collisionBikeX + pushFactor * 1.45; 
      const currentBikeZ = collisionBikeZ + pushFactor * 0.7; 
      
      ctx.motorcycleX.set(currentBikeX);
      ctx.motorcycleZ.set(currentBikeZ);
      ctx.syncMotorcyclePosition();

      if (ctx.motorcycleNode) {
        ctx.motorcycleNode.position.set(currentBikeX, 0.015, currentBikeZ);
        
        // Ngã đổ: Bị tạt từ bên trái nên ngã sang phải nằm phẳng trên đường
        ctx.motorcycleNode.rotation.z = pushFactor * (-Math.PI / 2); 
        // Pitch/Chúi đầu nhẹ khi đổ ngã rồi nằm phẳng
        ctx.motorcycleNode.rotation.x = -0.3 * pushFactor * (1 - pushFactor); 
        // Yaw/Xoay nghiêng góc xe trượt trên đường
        ctx.motorcycleNode.rotation.y = pushFactor * 0.45; 
        
        const firstCrushStartT = 0.6; 
        const secondCrushStartT = 2.0; 
        
        if (fallT > secondCrushStartT) {
           const crushProgress = (fallT - secondCrushStartT) * 1.5; 
           const crushFactor = Math.max(0.5 - crushProgress, 0.05);
           ctx.motorcycleNode.scaling.set(crushFactor, 1.2, 1.2); 
        } else if (fallT > firstCrushStartT) {
           const crushProgress = Math.min((fallT - firstCrushStartT) * 2.5, 0.5);
           const crushFactor = 1.0 - crushProgress;
           ctx.motorcycleNode.scaling.set(crushFactor, 1.2, 1.2);
        } else {
           ctx.motorcycleNode.scaling.set(1, 1, 1);
        }
      }
      
      ctx.checkBlindSpotState();
    }
    // Stage 3: End of Scenario
    else {
      setPlaying(false);
      ctx.setBlinkerActive(false);
    }
  }
}
