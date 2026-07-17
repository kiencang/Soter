import { Injectable, inject } from '@angular/core';
import * as BABYLON from '@babylonjs/core';
import { SimulatorVehicleTruckService } from './simulator-vehicle-truck.service';
import { SimulatorVehicleMotorcycleService } from './simulator-vehicle-motorcycle.service';
import { SimulatorVehicleCarService } from './simulator-vehicle-car.service';
import { SimulatorLogicService } from './simulator-logic.service';

@Injectable({ providedIn: 'root' })
export class SimulatorVehiclesService {
  private truckService = inject(SimulatorVehicleTruckService);
  private motorcycleService = inject(SimulatorVehicleMotorcycleService);
  private carService = inject(SimulatorVehicleCarService);
  private logicService = inject(SimulatorLogicService);

  createTruck(scene: BABYLON.Scene) {
    return this.truckService.createTruck(scene);
  }

  createMotorcycle(scene: BABYLON.Scene, options?: { frameColor?: BABYLON.Color3, helmetColor?: BABYLON.Color3, jacketColor?: BABYLON.Color3, pantsColor?: BABYLON.Color3 }) {
    return this.motorcycleService.createMotorcycle(scene, options);
  }

  private createFlatPolygon(name: string, vertices: BABYLON.Vector3[], scene: BABYLON.Scene, material: BABYLON.Material): BABYLON.Mesh {
    const customMesh = new BABYLON.Mesh(name, scene);
    
    const positions: number[] = [];
    const indices: number[] = [];
    const normals: number[] = [];
    
    vertices.forEach(v => {
      positions.push(v.x, v.y, v.z);
    });
    
    if (vertices.length === 4) {
      // Front face
      indices.push(0, 1, 2);
      indices.push(0, 2, 3);
      // Back face
      indices.push(2, 1, 0);
      indices.push(3, 2, 0);
    }
    
    for (let i = 0; i < vertices.length; i++) {
      normals.push(0, 1, 0);
    }
    
    const vertexData = new BABYLON.VertexData();
    vertexData.positions = positions;
    vertexData.indices = indices;
    vertexData.normals = normals;
    
    vertexData.applyToMesh(customMesh);
    customMesh.material = material;
    return customMesh;
  }

  createBlindSpots(scene: BABYLON.Scene, truckNode: BABYLON.TransformNode, trailerNode: BABYLON.TransformNode) {
    let frontBlindSpotMesh: BABYLON.Mesh;
    let leftBlindSpotMesh: BABYLON.Mesh;
    let rightBlindSpotMesh: BABYLON.Mesh;
    let rearBlindSpotMesh: BABYLON.Mesh;

    const yellowMat = new BABYLON.StandardMaterial('bsYellowMat', scene);
    yellowMat.emissiveColor = new BABYLON.Color3(1.0, 0.72, 0.0); // Vibrant amber/yellow warning
    yellowMat.diffuseColor = new BABYLON.Color3(0.9, 0.65, 0.0);
    yellowMat.alpha = 0.38;

    // 1. Front Blind Spot (Điểm mù trước đầu xe) - Local to Cabin (Rectangle)
    const frontVerts = [
      new BABYLON.Vector3(-1.5, 0.015, 4.85),
      new BABYLON.Vector3(1.5, 0.015, 4.85),
      new BABYLON.Vector3(1.5, 0.015, 7.3),
      new BABYLON.Vector3(-1.5, 0.015, 7.3)
    ];
    frontBlindSpotMesh = this.createFlatPolygon('frontBS', frontVerts, scene, yellowMat);
    frontBlindSpotMesh.parent = truckNode;

    // 2. Right Blind Spot (Bên phụ - Rất lớn) - Local to Cabin/Mirror (Wedge expanding out-back)
    const rightVerts = this.logicService.getRightBlindSpotVerticesLocal();
    rightBlindSpotMesh = this.createFlatPolygon('rightBS', rightVerts, scene, yellowMat);
    rightBlindSpotMesh.parent = truckNode;

    // 3. Left Blind Spot (Bên lái) - Local to Cabin/Mirror (Narrow wedge)
    const leftVerts = this.logicService.getLeftBlindSpotVerticesLocal();
    leftBlindSpotMesh = this.createFlatPolygon('leftBS', leftVerts, scene, yellowMat);
    leftBlindSpotMesh.parent = truckNode;

    // 4. Rear Blind Spot (Sau đuôi rơ-moóc) - Local to Trailer (Rectangle)
    const rearVerts = [
      new BABYLON.Vector3(-1.25, 0.015, -20.0),
      new BABYLON.Vector3(1.25, 0.015, -20.0),
      new BABYLON.Vector3(1.25, 0.015, -10.5),
      new BABYLON.Vector3(-1.25, 0.015, -10.5)
    ];
    rearBlindSpotMesh = this.createFlatPolygon('rearBS', rearVerts, scene, yellowMat);
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

  createCar(scene: BABYLON.Scene, options?: { bodyColor?: BABYLON.Color3 }): BABYLON.TransformNode {
    return this.carService.createCar(scene, options);
  }

}
