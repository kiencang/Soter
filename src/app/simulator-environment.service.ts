import { Injectable } from '@angular/core';
import * as BABYLON from '@babylonjs/core';

@Injectable({ providedIn: 'root' })
export class SimulatorEnvironmentService {
  createRoadGrid(scene: BABYLON.Scene, laneLines: any[], intersectionMeshes: BABYLON.Mesh[]) {
    // Asphalt ground
    const groundMat = new BABYLON.StandardMaterial('groundMat', scene);
    groundMat.diffuseColor = new BABYLON.Color3(0.18, 0.2, 0.22);
    groundMat.specularColor = new BABYLON.Color3(0.05, 0.05, 0.05);

    const ground = BABYLON.MeshBuilder.CreatePlane('ground', { width: 200, height: 200 }, scene);
    ground.rotation.x = Math.PI / 2;
    ground.position.y = 0;
    ground.material = groundMat;

    // Build single yellow dashed center line (North-South)
    const lineMat = new BABYLON.StandardMaterial('lineMat', scene);
    lineMat.emissiveColor = new BABYLON.Color3(0.9, 0.7, 0.1); // Glowing Yellow
    const whiteLineMat = new BABYLON.StandardMaterial('whiteLineMat', scene);
    whiteLineMat.emissiveColor = new BABYLON.Color3(0.85, 0.85, 0.85);

    // --- Road Lines & Crosswalks (4 directions) ---
    for (let d = 0; d < 4; d++) {
      const angle = (Math.PI / 2) * d;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const rot = (x: number, z: number) => ({ x: x * cosA + z * sinA, z: -x * sinA + z * cosA });

      // 1. Center Yellow Lines & White Lane Dividers
      for (let i = 0; i < 14; i++) {
        const zPos = 17 + i * 6;
        
        // Yellow center line
        const pY = rot(0, zPos);
        const yLine = BABYLON.MeshBuilder.CreateBox(`yl_${d}_${i}`, { width: 0.15, height: 0.01, depth: 3.5 }, scene);
        yLine.position.set(pY.x, 0.01, pY.z);
        yLine.rotation.y = angle;
        yLine.material = lineMat;
        intersectionMeshes.push(yLine);

        // White lane dividers
        for (const x of [-4.5, 4.5]) {
          const pW = rot(x, zPos);
          const wLine = BABYLON.MeshBuilder.CreateBox(`wl_${d}_${x}_${i}`, { width: 0.15, height: 0.01, depth: 3.5 }, scene);
          wLine.position.set(pW.x, 0.01, pW.z);
          wLine.rotation.y = angle;
          wLine.material = whiteLineMat;
          intersectionMeshes.push(wLine);
        }
      }

      // 2. Zebra Crossings (distance 11 from center)
      for (let i = -5; i <= 5; i++) {
        const pZebra = rot(i * 1.5, 11.0);
        const zebra = BABYLON.MeshBuilder.CreateBox(`zebra_${d}_${i}`, { width: 0.6, height: 0.012, depth: 4.0 }, scene);
        zebra.position.set(pZebra.x, 0.01, pZebra.z);
        zebra.rotation.y = angle;
        zebra.material = whiteLineMat;
        intersectionMeshes.push(zebra);
      }

      // 3. Stop Lines (distance 14.5 from center, only on the inbound lane/right-hand side of the road)
      const pStop = rot(-4.5, 14.5);
      const stopLine = BABYLON.MeshBuilder.CreateBox(`stopLine_${d}`, { width: 9.0, height: 0.012, depth: 0.45 }, scene);
      stopLine.position.set(pStop.x, 0.011, pStop.z);
      stopLine.rotation.y = angle;
      stopLine.material = whiteLineMat;
      intersectionMeshes.push(stopLine);

      // 4. Solid road shoulder lines (outer edge lines at x = -9.0 and x = 9.0)
      for (const x of [-9.0, 9.0]) {
        const pEdge = rot(x, 57.5);
        const edgeLine = BABYLON.MeshBuilder.CreateBox(`edgeLine_${d}_${x}`, { width: 0.2, height: 0.01, depth: 85.0 }, scene);
        edgeLine.position.set(pEdge.x, 0.01, pEdge.z);
        edgeLine.rotation.y = angle;
        edgeLine.material = whiteLineMat;
        intersectionMeshes.push(edgeLine);
      }
    }
  }
}
