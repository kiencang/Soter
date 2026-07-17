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
      
      // Stop reversing when the 3 rear axles of the tri-axle group have just fully rolled over the motorcycle (at truckZ = -108.3).
      // This ensures the truck stops immediately after the 3rd axle rolls over and before the 4th axle can reach it.
      const reverseDist = Math.min(reverseTime * reverseSpeed, 8.3);
      truckZ = -100 - reverseDist;
      
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
        
        // Shift slightly to the right to compensate for falling flat to the left,
        // keeping the entire fallen motorcycle body centered under the wide trailer silhouette
        // so it remains 100% invisible to both side mirrors.
        motoX = 7.5 + fallProgress * 0.25; 
        
        // Let it get pushed back only slightly on impact, then remain stationary on the ground
        // so the trailer and its wheels can actually roll over it instead of dragging it.
        motoZ = -115.25 - fallProgress * 0.5;
        
        motoY = 0.015 + fallProgress * 0.15; 
        
        // Fall flat sideways to the left
        motoRotX = 0;
        motoRotZ = fallProgress * (Math.PI / 2); // Fall exactly flat on the side
        motoRotY = fallProgress * (Math.PI / 12); // Subtle realistic orientation shift on impact
        
        // Trailer rear wheels (rearmost axle) are at local Z = -9.7 relative to trailer pivot (truckZ)
        const trailerWheelsZ = truckZ - 9.7;
        
        // The wheel starts contacting and rolling onto the motorcycle when its rear-most edge touches it.
        // Since the truck is reversing (-Z), this begins when trailerWheelsZ is at motoZ + 0.6.
        // The crushing completes when the wheel center rolls past it (at motoZ - 0.4).
        const contactStart = motoZ + 0.6;
        const contactEnd = motoZ - 0.4;
        
        if (trailerWheelsZ <= contactStart) {
           const crushProgress = Math.min(Math.max((contactStart - trailerWheelsZ) / (contactStart - contactEnd), 0.0), 1.0);
           crushScaling = Math.max(1.0 - crushProgress * 0.95, 0.05); 
           
           // Keep it flat on the ground as it gets crushed
           motoY = 0.015 + (fallProgress * 0.15) * crushScaling;
        }
        
        // Apply the crush scaling
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
