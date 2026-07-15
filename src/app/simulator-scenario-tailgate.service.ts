import { Injectable, inject } from '@angular/core';
import * as BABYLON from '@babylonjs/core';
import { ScenarioContext } from './simulator-scenarios.service';
import { SimulatorAudioService } from './simulator-audio.service';

@Injectable({ providedIn: 'root' })
export class SimulatorScenarioTailgateService {
  private audioService = inject(SimulatorAudioService);
  private hasBraked = false;
  private hasCrashed = false;
  private crashTime = 0;
  private hasCarBraked = false;

  reset() {
    this.hasBraked = false;
    this.hasCrashed = false;
    this.crashTime = 0;
    this.hasCarBraked = false;
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
    const bikeOffset = -13.85; 
    
    // Passenger car specs
    const carSpeed = 13.5; // High speed in Lane 1 (approx 49 km/h)
    const carInitialZ = -98.0; // Starts slightly further back to avoid physical overlap with the fallen motorcycle, creating a perfect close call

    let truckZ = initialZ;
    let bikeZ = initialZ + bikeOffset;
    let carZ = carInitialZ;

    // Stage 0: 0s to 2.5s -> Riding close behind
    if (t < 2.5) {
      setStage(0);
      truckZ = initialZ + t * speed;
      bikeZ = truckZ + bikeOffset;
      carZ = carInitialZ + t * carSpeed;
      
      this.updatePositions(ctx, truckZ, bikeZ, carZ);
    }
    // Stage 1: 2.5s to 5.0s -> Still tailgating, completely invisible in mirrors
    else if (t < 5.0) {
      setStage(1);
      truckZ = initialZ + t * speed;
      bikeZ = truckZ + bikeOffset;
      carZ = carInitialZ + t * carSpeed;
      
      this.updatePositions(ctx, truckZ, bikeZ, carZ);
    }
    // Stage 2: 5.0s to 10.0s -> Sudden emergency brake and double accident!
    else if (t < 10.0) {
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

      // Calculate Passenger Car Position
      const carStartZ = carInitialZ + 5.0 * carSpeed; // Position at t = 5.0
      const brakeStartTime = 1.1; // Car driver reacts and brakes 0.6s after motorcycle crashes (at t = 5.0 + 1.1 = 6.1s)
      
      if (activeT < brakeStartTime) {
        // Car continues speeding
        carZ = carStartZ + activeT * carSpeed;
      } else {
        // Car brakes heavily
        if (!this.hasCarBraked) {
          this.audioService.playBrakeSound();
          this.hasCarBraked = true;
        }
        const carDecel = 10.0; // Very heavy braking deceleration
        const carBrakeT = activeT - brakeStartTime;
        const speedAfterBraking = carSpeed - carDecel * carBrakeT;
        
        if (speedAfterBraking > 0) {
          carZ = carStartZ + brakeStartTime * carSpeed + (carSpeed * carBrakeT - 0.5 * carDecel * carBrakeT * carBrakeT);
        } else {
          // Came to a stop safely
          const stopTime = carSpeed / carDecel;
          carZ = carStartZ + brakeStartTime * carSpeed + (carSpeed * stopTime - 0.5 * carDecel * stopTime * stopTime);
        }
      }



      // Motorcycle Crash & Slide Logic
      if (bikeZ >= collisionLimitZ || this.hasCrashed) {
        if (!this.hasCrashed) {
          this.audioService.playCrashSound();
          this.hasCrashed = true;
          this.crashTime = t;
        }
        
        const timeSinceCrash = t - this.crashTime;
        const slideDuration = 1.5;
        const slideFactor = Math.min(timeSinceCrash / slideDuration, 1.0);
        const slideProgress = 1.0 - Math.pow(1.0 - slideFactor, 2);
        
        // Starts on the right of Lane 2 (3.2) and slides partially into Lane 1 (5.2)
        const finalX = 3.2 + slideProgress * (5.2 - 3.2);
        // Slides forward relative to the crash impact point by 2.5 meters (inertia momentum)
        const finalZ = collisionLimitZ + slideProgress * 2.5;
        
        ctx.motorcycleX.set(finalX);
        ctx.motorcycleZ.set(finalZ);
        
        if (ctx.motorcycleNode) {
          const fallFactor = Math.min(timeSinceCrash / 0.4, 1.0);
          const fallY = 0.015 + (fallFactor * 0.28);
          ctx.motorcycleNode.position.set(finalX, fallY, finalZ);
          
          const pitchAngle = Math.sin(Math.min(timeSinceCrash / 0.3, 1.0) * Math.PI) * (Math.PI / 6); 
          const fallAngle = fallFactor * (Math.PI / 2.2);
          const spinAngle = Math.min(timeSinceCrash / 1.0, 1.0) * 0.5; // Spin slightly forward due to momentum
          
          ctx.motorcycleNode.rotation.x = pitchAngle; 
          ctx.motorcycleNode.rotation.y = spinAngle; 
          ctx.motorcycleNode.rotation.z = -fallAngle; 
          
          const crushFactor = Math.min(timeSinceCrash / 0.5, 1.0);
          const scalingFactor = Math.max(1.0 - crushFactor * 0.3, 0.7);
          ctx.motorcycleNode.scaling.set(1.0, 1.0, scalingFactor);
        }
      } else {
        // Not crashed yet - riding clearly to the right of the center of Lane 2 (x = 3.2)
        ctx.motorcycleX.set(3.2);
        ctx.motorcycleZ.set(bikeZ);
        if (ctx.motorcycleNode) {
          ctx.motorcycleNode.position.set(3.2, 0.015, bikeZ);
          ctx.motorcycleNode.rotation.set(0, 0, 0);
          ctx.motorcycleNode.scaling.set(1, 1, 1);
        }
      }

      if (ctx.carNode) {
        ctx.carNode.setEnabled(true);
        
        const carLightL = ctx.carNode.getChildMeshes().find(m => m.name === 'carLightL');
        const carLightR = ctx.carNode.getChildMeshes().find(m => m.name === 'carLightR');
        const carTailL = ctx.carNode.getChildMeshes().find(m => m.name === 'carTailL');
        const carTailR = ctx.carNode.getChildMeshes().find(m => m.name === 'carTailR');

        if (this.hasCarBraked) {
          // 1. Pitch dip: Nose of the car tilts forward during heavy braking
          ctx.carNode.rotation.set(-0.035, 0, 0);
          
          // 2. ABS tyre vibration: High-frequency shake simulating tyre slip/ABS operation
          const shake = Math.sin(t * 70) * 0.012;
          ctx.carNode.position.set(6.75 + shake, 0, carZ);
          
          // 3. Hazard flashing & Bright Brake Lights: Headlights flash, taillights flash between ultra bright red and standard dim red
          const flash = Math.floor(t * 5) % 2 === 0;
          
          if (carLightL && carLightL.material) {
            (carLightL.material as BABYLON.StandardMaterial).emissiveColor = flash 
              ? new BABYLON.Color3(1.5, 1.5, 1.2) 
              : new BABYLON.Color3(0.1, 0.1, 0.05);
          }
          if (carLightR && carLightR.material) {
            (carLightR.material as BABYLON.StandardMaterial).emissiveColor = flash 
              ? new BABYLON.Color3(1.5, 1.5, 1.2) 
              : new BABYLON.Color3(0.1, 0.1, 0.05);
          }
          if (carTailL && carTailL.material) {
            (carTailL.material as BABYLON.StandardMaterial).emissiveColor = flash 
              ? new BABYLON.Color3(2.5, 0.05, 0.05) 
              : new BABYLON.Color3(0.4, 0.01, 0.01);
          }
          if (carTailR && carTailR.material) {
            (carTailR.material as BABYLON.StandardMaterial).emissiveColor = flash 
              ? new BABYLON.Color3(2.5, 0.05, 0.05) 
              : new BABYLON.Color3(0.4, 0.01, 0.01);
          }
          
          // Ensure they are enabled so we don't have holes in the car mesh
          if (carLightL) carLightL.setEnabled(true);
          if (carLightR) carLightR.setEnabled(true);
          if (carTailL) carTailL.setEnabled(true);
          if (carTailR) carTailR.setEnabled(true);
        } else {
          // Standard motion: no pitch dip, no shake, solid headlights and standard taillights
          ctx.carNode.rotation.set(0, 0, 0);
          ctx.carNode.position.set(6.75, 0, carZ);
          
          if (carLightL && carLightL.material) (carLightL.material as BABYLON.StandardMaterial).emissiveColor = new BABYLON.Color3(1.0, 1.0, 0.8);
          if (carLightR && carLightR.material) (carLightR.material as BABYLON.StandardMaterial).emissiveColor = new BABYLON.Color3(1.0, 1.0, 0.8);
          if (carTailL && carTailL.material) (carTailL.material as BABYLON.StandardMaterial).emissiveColor = new BABYLON.Color3(0.9, 0.1, 0.1);
          if (carTailR && carTailR.material) (carTailR.material as BABYLON.StandardMaterial).emissiveColor = new BABYLON.Color3(0.9, 0.1, 0.1);
          
          if (carLightL) carLightL.setEnabled(true);
          if (carLightR) carLightR.setEnabled(true);
          if (carTailL) carTailL.setEnabled(true);
          if (carTailR) carTailR.setEnabled(true);
        }
      }
      
      ctx.checkBlindSpotState();
    }
    // Stage 3: End of Scenario
    else {
      setPlaying(false);
    }
  }

  private updatePositions(ctx: ScenarioContext, truckZ: number, bikeZ: number, carZ: number) {
    if (ctx.truckNode) {
      ctx.truckNode.position.set(2.25, 0, truckZ);
      ctx.setTrailerRearPos(new BABYLON.Vector3(2.25, 0.6, truckZ - 11.25));
    }
    ctx.motorcycleX.set(3.2); // Riding clearly to the right of Lane 2
    ctx.motorcycleZ.set(bikeZ);
    if (ctx.motorcycleNode) {
      ctx.motorcycleNode.position.set(3.2, 0.015, bikeZ);
      ctx.motorcycleNode.rotation.set(0, 0, 0);
      ctx.motorcycleNode.scaling.set(1, 1, 1);
    }
    if (ctx.carNode) {
      ctx.carNode.setEnabled(true);
      ctx.carNode.position.set(6.75, 0, carZ);
      ctx.carNode.rotation.set(0, 0, 0);
      
      // Make sure lights are on
      const carLightL = ctx.carNode.getChildMeshes().find(m => m.name === 'carLightL');
      const carLightR = ctx.carNode.getChildMeshes().find(m => m.name === 'carLightR');
      const carTailL = ctx.carNode.getChildMeshes().find(m => m.name === 'carTailL');
      const carTailR = ctx.carNode.getChildMeshes().find(m => m.name === 'carTailR');
      if (carLightL) carLightL.setEnabled(true);
      if (carLightR) carLightR.setEnabled(true);
      if (carTailL) carTailL.setEnabled(true);
      if (carTailR) carTailR.setEnabled(true);
    }
    ctx.syncMotorcyclePosition();
  }
}

