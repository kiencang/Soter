import { Injectable, inject } from '@angular/core';
import * as BABYLON from '@babylonjs/core';
import { SimulatorVehicleTruckService } from './simulator-vehicle-truck.service';
import { SimulatorVehicleMotorcycleService } from './simulator-vehicle-motorcycle.service';

@Injectable({ providedIn: 'root' })
export class SimulatorVehiclesService {
  private truckService = inject(SimulatorVehicleTruckService);
  private motorcycleService = inject(SimulatorVehicleMotorcycleService);

  createTruck(scene: BABYLON.Scene) {
    return this.truckService.createTruck(scene);
  }

  createMotorcycle(scene: BABYLON.Scene) {
    return this.motorcycleService.createMotorcycle(scene);
  }

  createBlindSpots(scene: BABYLON.Scene, truckNode: BABYLON.TransformNode, trailerNode: BABYLON.TransformNode) {
    let frontBlindSpotMesh: BABYLON.Mesh;
    let leftBlindSpotMesh: BABYLON.Mesh;
    let rightBlindSpotMesh: BABYLON.Mesh;
    let rearBlindSpotMesh: BABYLON.Mesh;

    const redMat = new BABYLON.StandardMaterial('bsRedMat', scene);
    redMat.emissiveColor = new BABYLON.Color3(1.0, 0.1, 0.1);
    redMat.diffuseColor = new BABYLON.Color3(0.9, 0, 0);
    redMat.alpha = 0.38;

    // 1. Front Blind Spot (Điểm mù trước đầu xe) - Local to Cabin
    frontBlindSpotMesh = BABYLON.MeshBuilder.CreateBox('frontBS', { width: 3.6, height: 0.02, depth: 3.6 }, scene);
    frontBlindSpotMesh.position.set(0, 0.015, 5.4); // Centered right in front of nose
    frontBlindSpotMesh.material = redMat;
    frontBlindSpotMesh.parent = truckNode;

    // 2. Right Blind Spot (Bên phụ - Rất lớn) - Local to Trailer
    rightBlindSpotMesh = BABYLON.MeshBuilder.CreateBox('rightBS', { width: 5.0, height: 0.02, depth: 16.5 }, scene);
    rightBlindSpotMesh.position.set(4.0, 0.015, -4.75); // Centered on right side
    rightBlindSpotMesh.material = redMat;
    rightBlindSpotMesh.parent = trailerNode;

    // 3. Left Blind Spot (Bên lái) - Local to Cabin
    leftBlindSpotMesh = BABYLON.MeshBuilder.CreateBox('leftBS', { width: 4.0, height: 0.02, depth: 12.2 }, scene);
    leftBlindSpotMesh.position.set(-3.5, 0.015, -3.9); // Centered on left side
    leftBlindSpotMesh.material = redMat;
    leftBlindSpotMesh.parent = truckNode;

    // 4. Rear Blind Spot (Sau đuôi rơ-moóc) - Local to Trailer
    rearBlindSpotMesh = BABYLON.MeshBuilder.CreateBox('rearBS', { width: 5.0, height: 0.02, depth: 11.5 }, scene);
    rearBlindSpotMesh.position.set(0, 0.015, -19.25); // Centered behind trailer
    rearBlindSpotMesh.material = redMat;
    rearBlindSpotMesh.parent = trailerNode;

    return { front: frontBlindSpotMesh!, left: leftBlindSpotMesh!, right: rightBlindSpotMesh!, rear: rearBlindSpotMesh! };
  }

  
  updateTrailerPhysics(truckNode: BABYLON.TransformNode | null, trailerNode: BABYLON.TransformNode | null, trailerRearPos: BABYLON.Vector3 | null): BABYLON.Vector3 | null {
    if (!truckNode || !trailerNode) return trailerRearPos;

    const pivotPos = truckNode.position;
    const D = 11.25;

    if (!trailerRearPos) {
      const theta = truckNode.rotation.y;
      const dirX = Math.sin(theta);
      const dirZ = Math.cos(theta);
      trailerRearPos = new BABYLON.Vector3(
        pivotPos.x - dirX * D,
        0.6,
        pivotPos.z - dirZ * D
      );
    }

    const u = pivotPos.subtract(trailerRearPos);
    u.y = 0;

    const uLen = u.length();
    if (uLen > 25.0) {
      const theta = truckNode.rotation.y;
      const dirX = Math.sin(theta);
      const dirZ = Math.cos(theta);
      trailerRearPos = new BABYLON.Vector3(
        pivotPos.x - dirX * D,
        0.6,
        pivotPos.z - dirZ * D
      );
      const uNew = pivotPos.subtract(trailerRearPos);
      uNew.y = 0;
      const uNewLen = uNew.length();
      if (uNewLen > 0.001) {
        const uNorm = uNew.scale(1 / uNewLen);
        trailerNode.position.copyFrom(pivotPos);
        trailerNode.rotation.y = Math.atan2(uNorm.x, uNorm.z);
      }
    } else if (uLen > 0.001) {
      const uNorm = u.scale(1 / uLen);
      trailerRearPos = pivotPos.subtract(uNorm.scale(D));
      trailerNode.position.copyFrom(pivotPos);
      const angle = Math.atan2(uNorm.x, uNorm.z);
      trailerNode.rotation.y = angle;
    }
    
    return trailerRearPos;
  }

}
