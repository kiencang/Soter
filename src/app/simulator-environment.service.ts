import { Injectable } from '@angular/core';
import * as BABYLON from '@babylonjs/core';

@Injectable({ providedIn: 'root' })
export class SimulatorEnvironmentService {
  createRoadGrid(scene: BABYLON.Scene, laneLines: any[], intersectionMeshes: BABYLON.Mesh[]) {
    // Asphalt ground
    const groundMat = new BABYLON.StandardMaterial('groundMat', scene);
    groundMat.diffuseColor = new BABYLON.Color3(0.18, 0.2, 0.22);
    groundMat.specularColor = new BABYLON.Color3(0.05, 0.05, 0.05);

    const ground = BABYLON.MeshBuilder.CreatePlane('ground', { width: 100, height: 100 }, scene);
    ground.rotation.x = Math.PI / 2;
    ground.position.y = 0;
    ground.material = groundMat;

    // Build single yellow dashed center line (North-South)
    const lineMat = new BABYLON.StandardMaterial('lineMat', scene);
    lineMat.emissiveColor = new BABYLON.Color3(0.9, 0.7, 0.1); // Glowing Yellow

    for (let i = 0; i < 15; i++) {
      const line = BABYLON.MeshBuilder.CreateBox(`yl_center_${i}`, { width: 0.15, height: 0.01, depth: 3.5 }, scene);
      line.position.set(0, 0.01, -40 + i * 8.0);
      line.material = lineMat;
      laneLines.push({ mesh: line, initialZ: line.position.z });
    }

    // White dashed lane dividers (left & right lanes)
    const whiteLineMat = new BABYLON.StandardMaterial('whiteLineMat', scene);
    whiteLineMat.emissiveColor = new BABYLON.Color3(0.85, 0.85, 0.85);

    const xOffsets = [-4.5, 4.5];
    for (const x of xOffsets) {
      for (let i = 0; i < 15; i++) {
        const line = BABYLON.MeshBuilder.CreateBox(`wl_${x}_${i}`, { width: 0.15, height: 0.01, depth: 3.5 }, scene);
        line.position.set(x, 0.01, -40 + i * 8.0);
        line.material = whiteLineMat;
        laneLines.push({ mesh: line, initialZ: line.position.z });
      }
    }

    // East-West Intersection Road (at Z = 10)
    const crossroadMat = new BABYLON.StandardMaterial('crossroadMat', scene);
    crossroadMat.diffuseColor = new BABYLON.Color3(0.2, 0.22, 0.25);

    const eastWestRoad = BABYLON.MeshBuilder.CreateBox('ewRoad', { width: 100, height: 0.005, depth: 14 }, scene);
    eastWestRoad.position.set(0, 0.005, 10);
    eastWestRoad.material = crossroadMat;
    intersectionMeshes.push(eastWestRoad);

    // Zebra crossing lines at intersection
    for (let i = -6; i <= 6; i++) {
      const zebra = BABYLON.MeshBuilder.CreateBox(`zebra_${i}`, { width: 0.6, height: 0.012, depth: 4.0 }, scene);
      zebra.position.set(i * 1.5, 0.01, 3.5);
      zebra.material = whiteLineMat;
      intersectionMeshes.push(zebra);
    }
  }
}
