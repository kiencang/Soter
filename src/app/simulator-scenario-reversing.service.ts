import { Injectable, inject } from '@angular/core';
import * as BABYLON from '@babylonjs/core';
import { ScenarioContext } from './simulator-scenarios.service';
import { SimulatorAudioService } from './simulator-audio.service';

@Injectable({ providedIn: 'root' })
export class SimulatorScenarioReversingService {
  private audioService = inject(SimulatorAudioService);
  private hasCrashed = false;

  private lastCarZ = -440;
  private lastM1Z = -250;
  private lastM2Z = -269;

  reset() {
    this.hasCrashed = false;
    this.lastCarZ = -440;
    this.lastM1Z = -250;
    this.lastM2Z = -269;
    this.audioService.stopHorn();
  }

  animate(
    t: number,
    ctx: ScenarioContext,
    setStage: (stage: number) => void,
    setPlaying: (playing: boolean) => void
  ) {
    // 3 honks of the horn during the lane change (first 3 seconds of Stage 0)
    if (t < 10.0 && ((t >= 0.4 && t < 0.8) || (t >= 1.2 && t < 1.6) || (t >= 2.0 && t < 2.4))) {
      this.audioService.playHorn();
    } else {
      this.audioService.stopHorn();
    }

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

    // --- Choreographing Extra Vehicles ---
    
    // 1. Extra Car (Sleek deep blue car)
    // Moves continuously in Lane 2 (X = 2.25) at a steady speed of 20 units/s from far behind (Z = -440)
    // Passes alongside the truck cabin precisely as the truck prepares/starts to reverse (around t = 16.5s to 17.0s)
    let extraCarZ = -440 + t * 20.0;

    // 2. Extra Moto 1 (Yellow)
    // Starts in Lane 1 (X = 7.5), swerves to Lane 2 (X = 2.25) between t = 10.5s and t = 11.5s
    // Then swerves back to Lane 1 (X = 7.5) between t = 14.5s and t = 15.5s to clear the lane for the car
    let extraM1X = 7.5;
    let extraM1Z = -250 + t * 12.0;
    let extraM1RotY = 0;
    if (t >= 10.5 && t < 11.5) {
      const progress = (t - 10.5) / 1.0;
      const smoothP = progress * progress * (3 - 2 * progress);
      extraM1X = 7.5 + smoothP * (2.25 - 7.5);
      extraM1RotY = -0.25 * Math.sin(progress * Math.PI);
    } else if (t >= 11.5 && t < 14.5) {
      extraM1X = 2.25;
      extraM1RotY = 0;
    } else if (t >= 14.5 && t < 15.5) {
      const progress = (t - 14.5) / 1.0;
      const smoothP = progress * progress * (3 - 2 * progress);
      extraM1X = 2.25 + smoothP * (7.5 - 2.25);
      extraM1RotY = 0.25 * Math.sin(progress * Math.PI);
    } else if (t >= 15.5) {
      extraM1X = 7.5;
      extraM1RotY = 0;
    }

    // 3. Extra Moto 2 (Sky blue)
    // Starts in Lane 1 (X = 7.5), swerves to Lane 2 (X = 2.25) between t = 12.0s and t = 13.0s
    // Then swerves back to Lane 1 (X = 7.5) between t = 16.0s and t = 17.0s to clear the lane for the car
    let extraM2X = 7.5;
    let extraM2Z = -269 + t * 12.0;
    let extraM2RotY = 0;
    if (t >= 12.0 && t < 13.0) {
      const progress = (t - 12.0) / 1.0;
      const smoothP = progress * progress * (3 - 2 * progress);
      extraM2X = 7.5 + smoothP * (2.25 - 7.5);
      extraM2RotY = -0.25 * Math.sin(progress * Math.PI);
    } else if (t >= 13.0 && t < 16.0) {
      extraM2X = 2.25;
      extraM2RotY = 0;
    } else if (t >= 16.0 && t < 17.0) {
      const progress = (t - 16.0) / 1.0;
      const smoothP = progress * progress * (3 - 2 * progress);
      extraM2X = 2.25 + smoothP * (7.5 - 2.25);
      extraM2RotY = 0.25 * Math.sin(progress * Math.PI);
    } else if (t >= 17.0) {
      extraM2X = 7.5;
      extraM2RotY = 0;
    }

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

    // Apply extra car position, rotation and wheel physics
    if (ctx.extraCarNode) {
      ctx.extraCarNode.position.set(2.25, 0, extraCarZ);
      ctx.extraCarNode.rotation.set(0, 0, 0);
      
      const extraCarDistance = extraCarZ - this.lastCarZ;
      this.lastCarZ = extraCarZ;
      
      const carWheels = ctx.extraCarNode.getChildMeshes(false, (mesh) => mesh.name.startsWith('carWheel_'));
      if (carWheels.length > 0 && Math.abs(extraCarDistance) > 0.0001 && Math.abs(extraCarDistance) < 10.0) {
        const carRotDelta = -extraCarDistance / 0.325;
        carWheels.forEach(wheel => {
          wheel.rotate(BABYLON.Axis.Y, carRotDelta, BABYLON.Space.LOCAL);
        });
      }
    }

    // Apply extra moto 1 position, rotation and wheel physics
    if (ctx.extraMoto1Node) {
      ctx.extraMoto1Node.position.set(extraM1X, 0, extraM1Z);
      ctx.extraMoto1Node.rotation.set(0, extraM1RotY, 0);
      
      const extraM1Distance = extraM1Z - this.lastM1Z;
      this.lastM1Z = extraM1Z;
      
      const m1Wheels = ctx.extraMoto1Node.getChildMeshes(false, (mesh) => mesh.name === 'mWheelF' || mesh.name === 'mWheelR');
      if (m1Wheels.length > 0 && Math.abs(extraM1Distance) > 0.0001 && Math.abs(extraM1Distance) < 10.0) {
        const m1RotDelta = -extraM1Distance / 0.275;
        m1Wheels.forEach(wheel => {
          wheel.rotate(BABYLON.Axis.Y, m1RotDelta, BABYLON.Space.LOCAL);
        });
      }
    }

    // Apply extra moto 2 position, rotation and wheel physics
    if (ctx.extraMoto2Node) {
      ctx.extraMoto2Node.position.set(extraM2X, 0, extraM2Z);
      ctx.extraMoto2Node.rotation.set(0, extraM2RotY, 0);
      
      const extraM2Distance = extraM2Z - this.lastM2Z;
      this.lastM2Z = extraM2Z;
      
      const m2Wheels = ctx.extraMoto2Node.getChildMeshes(false, (mesh) => mesh.name === 'mWheelF' || mesh.name === 'mWheelR');
      if (m2Wheels.length > 0 && Math.abs(extraM2Distance) > 0.0001 && Math.abs(extraM2Distance) < 10.0) {
        const m2RotDelta = -extraM2Distance / 0.275;
        m2Wheels.forEach(wheel => {
          wheel.rotate(BABYLON.Axis.Y, m2RotDelta, BABYLON.Space.LOCAL);
        });
      }
    }
    
    ctx.motorcycleX.set(motoX);
    ctx.motorcycleZ.set(motoZ);
    ctx.checkBlindSpotState();
  }
}
