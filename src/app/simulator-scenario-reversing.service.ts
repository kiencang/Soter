import { Injectable, inject } from '@angular/core';
import * as BABYLON from '@babylonjs/core';
import { ScenarioContext } from './simulator-scenarios.service';
import { SimulatorAudioService } from './simulator-audio.service';

@Injectable({ providedIn: 'root' })
export class SimulatorScenarioReversingService {
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
    let truckX = 2.25;
    let truckZ = -250;
    let truckRotY = 0;
    
    let motoX = 7.5; // Exactly in the center of the lane and rear blind spot
    let motoY = 0.015;
    let motoZ = -290;
    let motoRotY = 0;
    let motoRotX = 0;
    let motoRotZ = 0;
    
    let motoScaleX = 1.0;
    let motoScaleY = 1.0;
    let motoScaleZ = 1.0;

    // Stage 0: 0s to 10s -> Truck changes from lane 2 to lane 1 and drives straight to align trailer
    if (t < 10.0) {
      setStage(0);
      ctx.setBlinkerActive(true, 'right');
      ctx.setReverseActive(false);

      const progress = t / 10.0; // 0 to 1
      
      // Truck moves from Z = -250 to Z = -100 (150m over 10s)
      const easeOut = Math.sin((progress * Math.PI) / 2);
      truckZ = -250 + easeOut * 150;
      
      // Lane change completes in the first 3.0 seconds
      let laneProgress = t / 3.0;
      laneProgress = Math.max(0, Math.min(1, laneProgress));
      const smoothStep = laneProgress * laneProgress * (3 - 2 * laneProgress);
      truckX = 2.25 + smoothStep * (7.5 - 2.25);
      
      if (laneProgress > 0 && laneProgress < 1) {
        const dx = 7.5 - 2.25;
        const d_smooth = 6 * (laneProgress - laneProgress * laneProgress); // derivative
        const vx = (dx / 3.0) * d_smooth;
        const vz = (150 * (Math.PI / 2) * Math.cos((progress * Math.PI) / 2)) / 10.0; 
        truckRotY = vz > 0.1 ? Math.atan2(vx, vz) : 0;
      } else {
        truckRotY = 0;
      }
      
      motoZ = -290 + progress * 60; // Cruises behind to -230
    }
    // Stage 1: 10s to 14s -> Truck stopped, Motorcycle arrives and stops in blind spot
    else if (t < 14.0) {
      setStage(1);
      ctx.setBlinkerActive(false);
      ctx.setReverseActive(false);

      truckX = 7.5;
      truckZ = -100;
      truckRotY = 0;

      const motoProgress = (t - 10.0) / 4.0; // 0 to 1
      
      // Motorcycle stops at -115.25 (which is 15.25m behind truck origin, exactly in the center of the rear blind spot)
      const startZ = -230;
      const endZ = -115.25;
      const easeOut = Math.sin((motoProgress * Math.PI) / 2);
      motoZ = startZ + easeOut * (endZ - startZ);
    }
    // Stage 2: 14s to 17s -> Both stopped.
    else if (t < 17.0) {
      setStage(2);
      ctx.setBlinkerActive(false);
      ctx.setReverseActive(false);
      
      truckX = 7.5;
      truckZ = -100;
      truckRotY = 0;

      motoZ = -115.25;
    }
    // Stage 3: 17s to 23s -> Truck reverses straight back
    else if (t < 23.0) {
      setStage(3);
      ctx.setBlinkerActive(true, 'both'); // Hazard lights
      ctx.setReverseActive(true); // Reverse lights

      const reverseTime = t - 17.0;
      const reverseSpeed = 2.5; // m/s 
      
      truckX = 7.5;
      truckRotY = 0;
      truckZ = -100 - reverseTime * reverseSpeed;
      
      const trailerRearZ = truckZ - 11.25;
      const collisionZ = -115.25 + 1.0; 
      
      let crushScaling = 1.0;

      if (trailerRearZ <= collisionZ) {
        if (!this.hasCrashed) {
          this.audioService.playCrashSound();
          this.hasCrashed = true;
        }
        
        const impactDepth = collisionZ - trailerRearZ;
        const fallProgress = Math.min(impactDepth / 1.0, 1.0);
        
        // Slide to the left slightly
        motoX = 7.5 - fallProgress * 0.4; 
        motoZ = -115.25 - fallProgress * 1.5; // Dragged back slightly
        motoY = 0.015 + fallProgress * 0.2; 
        
        // Fall sideways
        motoRotX = 0;
        motoRotZ = fallProgress * (Math.PI / 2); // Fall exactly flat on the side
        motoRotY = fallProgress * (Math.PI / 8); // Slight angle
        
        const trailerWheelsZ = truckZ - 10.8; // Trailer wheels arrive just after the rear
        if (trailerWheelsZ <= motoZ) {
           const crushDepth = motoZ - trailerWheelsZ;
           const crushProgress = Math.min(crushDepth / 1.5, 1.0);
           crushScaling = Math.max(1.0 - crushProgress * 0.95, 0.05); 
           
           // Reduce the Y elevation as it gets crushed so it stays flat on the ground
           motoY = 0.015 + (fallProgress * 0.2) * crushScaling;
        }
        
        // Since the bike is rotated 90 degrees on Z, its local X axis is now vertical
        motoScaleX = crushScaling;
        motoScaleY = crushScaling < 1.0 ? 1.2 : 1.0; 
        motoScaleZ = crushScaling < 1.0 ? 1.2 : 1.0;
      } else {
        motoZ = -115.25;
      }
    }
    else {
      setStage(4);
      setPlaying(false);
      return;
    }

    // Apply transformations
    if (ctx.truckNode) {
      ctx.truckNode.position.set(truckX, 0, truckZ);
      ctx.truckNode.rotation.y = truckRotY;
    }

    if (ctx.motorcycleNode) {
      ctx.motorcycleNode.position.set(motoX, motoY, motoZ);
      ctx.motorcycleNode.rotation.x = motoRotX;
      ctx.motorcycleNode.rotation.y = motoRotY;
      ctx.motorcycleNode.rotation.z = motoRotZ;
      ctx.motorcycleNode.scaling.set(motoScaleX, motoScaleY, motoScaleZ);
    }
    
    ctx.motorcycleX.set(motoX);
    ctx.motorcycleZ.set(motoZ);
    ctx.checkBlindSpotState();
  }
}
