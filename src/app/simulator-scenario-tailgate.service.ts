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
  private hasCarCrashed = false;
  private carCrashTime = 0;

  reset() {
    this.hasBraked = false;
    this.hasCrashed = false;
    this.crashTime = 0;
    this.hasCarBraked = false;
    this.hasCarCrashed = false;
    this.carCrashTime = 0;
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
    const carInitialZ = -100.0; // Starts far behind

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
      const brakeStartTime = 1.4; // Car driver reacts and brakes 0.3s after motorcycle crashes (at t = 5.0 + 1.1 = 6.1s)
      
      if (activeT < brakeStartTime) {
        // Car continues speeding
        carZ = carStartZ + activeT * carSpeed;
      } else {
        // Car brakes heavily
        if (!this.hasCarBraked) {
          this.audioService.playBrakeSound();
          this.hasCarBraked = true;
        }
        const carDecel = 12.0; // Intense deceleration
        const carBrakeT = activeT - brakeStartTime;
        const speedAfterBraking = carSpeed - carDecel * carBrakeT;
        
        if (speedAfterBraking > 0) {
          carZ = carStartZ + brakeStartTime * carSpeed + (carSpeed * carBrakeT - 0.5 * carDecel * carBrakeT * carBrakeT);
        } else {
          // Came to a stop
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
        
        // Starts further to the right of Lane 2 (3.2) and slides into Lane 1 (5.2)
        const finalX = 3.2 + slideProgress * (5.2 - 3.2);
        // Slides forward relative to the crash impact point by 2.5 meters (inertia momentum)
        let finalZ = collisionLimitZ + slideProgress * 2.5;

        // Collision with Car check (front of car is carZ + 2.1; motorcycle is at finalZ)
        const carFrontZ = carZ + 2.1;
        const isCarColliding = carFrontZ >= finalZ - 0.8;

        if (isCarColliding || this.hasCarCrashed) {
          if (!this.hasCarCrashed) {
            this.audioService.playCrashSound();
            this.hasCarCrashed = true;
            this.carCrashTime = t;
          }

          // Push motorcycle forward slightly due to car impact momentum
          const timeSinceCarCrash = t - this.carCrashTime;
          const carCrashStopFactor = Math.min(timeSinceCarCrash / 0.8, 1.0);
          const carCrashStopProgress = 1.0 - Math.pow(1.0 - carCrashStopFactor, 2);
          
          // Stop both vehicles and push forward by 1.2 meters
          carZ = (carZ - (carFrontZ - (finalZ - 0.8))) + carCrashStopProgress * 1.2;
          finalZ = carZ + 2.1 + 0.8;

          // Flash car's headlights/taillights as hazard warning lights
          if (ctx.carNode) {
            const flash = Math.floor(t * 4) % 2 === 0;
            const carLightL = ctx.carNode.getChildMeshes().find(m => m.name === 'carLightL');
            const carLightR = ctx.carNode.getChildMeshes().find(m => m.name === 'carLightR');
            const carTailL = ctx.carNode.getChildMeshes().find(m => m.name === 'carTailL');
            const carTailR = ctx.carNode.getChildMeshes().find(m => m.name === 'carTailR');
            
            if (carLightL) carLightL.setEnabled(flash);
            if (carLightR) carLightR.setEnabled(flash);
            if (carTailL) carTailL.setEnabled(flash);
            if (carTailR) carTailR.setEnabled(flash);
          }
        }
        
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
        ctx.carNode.position.set(6.75, 0, carZ);
        ctx.carNode.rotation.set(0, 0, 0);
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

