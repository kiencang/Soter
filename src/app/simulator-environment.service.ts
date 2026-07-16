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

    const whiteLineMat = new BABYLON.StandardMaterial('whiteLineMat', scene);
    whiteLineMat.emissiveColor = new BABYLON.Color3(0.85, 0.85, 0.85);

    // Double yellow line material (2 vạch vàng song song)
    const yellowLineMat = new BABYLON.StandardMaterial('yellowLineMat', scene);
    yellowLineMat.diffuseColor = new BABYLON.Color3(0.98, 0.66, 0.15);
    yellowLineMat.emissiveColor = new BABYLON.Color3(0.98, 0.66, 0.15);
    yellowLineMat.specularColor = new BABYLON.Color3(0.0, 0.0, 0.0); // Ngăn ánh sáng phản chiếu làm trắng vạch

    // --- Road Lines & Crosswalks (4 directions) ---
    for (let d = 0; d < 4; d++) {
      const angle = (Math.PI / 2) * d;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const rot = (x: number, z: number) => ({ x: x * cosA + z * sinA, z: -x * sinA + z * cosA });

      // 1. Center Double Yellow Lines & White Lane Dividers
      
      // Center Double Yellow Lines (Vạch vàng đôi nét liền)
      for (const x of [-0.15, 0.15]) {
        const pCenter = rot(x, 57.5);
        const centerLine = BABYLON.MeshBuilder.CreateBox(`centerLine_${d}_${x}`, { width: 0.15, height: 0.01, depth: 85.0 }, scene);
        centerLine.position.set(pCenter.x, 0.01, pCenter.z);
        centerLine.rotation.y = angle;
        centerLine.material = yellowLineMat;
        intersectionMeshes.push(centerLine);
      }

      // White lane dividers (đứt khúc)
      for (let i = 0; i < 14; i++) {
        const zPos = 17 + i * 6;

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

  createTrafficLight(scene: BABYLON.Scene) {
    // 1. Pole (Trụ cột đèn)
    const poleMat = new BABYLON.StandardMaterial('poleMat', scene);
    poleMat.diffuseColor = new BABYLON.Color3(0.18, 0.2, 0.22);
    poleMat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);

    const pole = BABYLON.MeshBuilder.CreateCylinder('tlPole', { diameter: 0.16, height: 5.5 }, scene);
    pole.position.set(8.8, 2.75, -13.5); // x = 8.8 (phía phải ngoài cùng), z = -13.5 (nằm trên vạch dừng z = -14.5 một chút, sát vạch đi bộ)
    pole.material = poleMat;

    // 2. Traffic light housing (Hộp đèn)
    const boxMat = new BABYLON.StandardMaterial('tlBoxMat', scene);
    boxMat.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.12);
    boxMat.specularColor = new BABYLON.Color3(0.05, 0.05, 0.05);

    const housing = BABYLON.MeshBuilder.CreateBox('tlHousing', { width: 0.45, height: 1.3, depth: 0.45 }, scene);
    housing.position.set(8.8, 4.6, -13.5); // Gắn gần đỉnh cột
    housing.material = boxMat;

    // Back cover or visors material
    const visorMat = new BABYLON.StandardMaterial('tlVisorMat', scene);
    visorMat.diffuseColor = new BABYLON.Color3(0.05, 0.05, 0.05);

    // 3. Bulbs (Bóng đèn) - quay về phía Nam (z âm) để luồng xe từ Nam tiến lên nhìn rõ
    // Vị trí z của các bóng đèn nhô ra một chút về phía Nam
    const bulbRed = BABYLON.MeshBuilder.CreateCylinder('bulbRed', { diameter: 0.24, height: 0.06 }, scene);
    bulbRed.position.set(8.8, 4.95, -13.73);
    bulbRed.rotation.x = Math.PI / 2;

    const bulbYellow = BABYLON.MeshBuilder.CreateCylinder('bulbYellow', { diameter: 0.24, height: 0.06 }, scene);
    bulbYellow.position.set(8.8, 4.6, -13.73);
    bulbYellow.rotation.x = Math.PI / 2;

    const bulbGreen = BABYLON.MeshBuilder.CreateCylinder('bulbGreen', { diameter: 0.24, height: 0.06 }, scene);
    bulbGreen.position.set(8.8, 4.25, -13.73);
    bulbGreen.rotation.x = Math.PI / 2;

    // Create small visors (vành che đèn) to make the traffic light look professional
    for (const y of [4.95, 4.6, 4.25]) {
      const visor = BABYLON.MeshBuilder.CreateCylinder(`visor_${y}`, { diameter: 0.28, height: 0.1, arc: 0.5 }, scene);
      visor.position.set(8.8, y + 0.12, -13.73);
      visor.rotation.x = Math.PI / 2;
      visor.rotation.z = Math.PI; // quay nửa vòng tròn lên trên để che đèn
      visor.material = visorMat;
    }

    // Set default materials for the bulbs (off state)
    const redMat = new BABYLON.StandardMaterial('tlRedMat', scene);
    redMat.diffuseColor = new BABYLON.Color3(0.2, 0.05, 0.05);
    redMat.emissiveColor = new BABYLON.Color3(0.05, 0, 0);
    bulbRed.material = redMat;

    const yellowMat = new BABYLON.StandardMaterial('tlYellowMat', scene);
    yellowMat.diffuseColor = new BABYLON.Color3(0.2, 0.16, 0.05);
    yellowMat.emissiveColor = new BABYLON.Color3(0.05, 0.04, 0);
    bulbYellow.material = yellowMat;

    const greenMat = new BABYLON.StandardMaterial('tlGreenMat', scene);
    greenMat.diffuseColor = new BABYLON.Color3(0.05, 0.2, 0.05);
    greenMat.emissiveColor = new BABYLON.Color3(0, 0.05, 0);
    bulbGreen.material = greenMat;

    return { red: bulbRed, yellow: bulbYellow, green: bulbGreen };
  }
}
