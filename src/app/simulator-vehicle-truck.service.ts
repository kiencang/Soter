import { Injectable } from '@angular/core';
import * as BABYLON from '@babylonjs/core';

@Injectable({ providedIn: 'root' })
export class SimulatorVehicleTruckService {
  createTruck(scene: BABYLON.Scene) {
    const truckNode = new BABYLON.TransformNode('truckNode', scene);
    const trailerNode = new BABYLON.TransformNode('trailerNode', scene);
    let blinkerLeft: BABYLON.Mesh | null = null;
    let blinkerRight: BABYLON.Mesh | null = null;

    const cabinMat = new BABYLON.StandardMaterial('cabinMat', scene);
    cabinMat.diffuseColor = new BABYLON.Color3(0.1, 0.45, 0.85); // Professional cobalt blue
    cabinMat.specularColor = new BABYLON.Color3(0.6, 0.7, 0.8);

    const trailerMat = new BABYLON.StandardMaterial('trailerMat', scene);
    trailerMat.diffuseColor = new BABYLON.Color3(0.8, 0.82, 0.85); // Corrugated silver/grey
    trailerMat.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);

    const tireMat = new BABYLON.StandardMaterial('tireMat', scene);
    tireMat.diffuseColor = new BABYLON.Color3(0.08, 0.08, 0.1);

    const glassMat = new BABYLON.StandardMaterial('glassMat', scene);
    glassMat.diffuseColor = new BABYLON.Color3(0.05, 0.05, 0.08);
    glassMat.emissiveColor = new BABYLON.Color3(0.05, 0.1, 0.15);
    glassMat.alpha = 0.8;

    const blinkerLeftMat = new BABYLON.StandardMaterial('blinkLMat', scene);
    blinkerLeftMat.diffuseColor = new BABYLON.Color3(0.4, 0.3, 0.0);
    blinkerLeftMat.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.0);

    const blinkerRightMat = new BABYLON.StandardMaterial('blinkRMat', scene);
    blinkerRightMat.diffuseColor = new BABYLON.Color3(0.4, 0.3, 0.0);
    blinkerRightMat.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.0);

    const yellowLightMat = new BABYLON.StandardMaterial('ylight', scene);
    yellowLightMat.emissiveColor = new BABYLON.Color3(1.0, 0.7, 0.0);

    const redLightMat = new BABYLON.StandardMaterial('rlight', scene);
    redLightMat.emissiveColor = new BABYLON.Color3(1.0, 0.1, 0.1);

    // 1. Tractor Head Cabin Body
    const cabinBody = BABYLON.MeshBuilder.CreateBox('cabinBody', { width: 2.5, height: 2.5, depth: 2.5 }, scene);
    cabinBody.position.y = 1.95;
    cabinBody.position.z = 2.4;
    cabinBody.material = cabinMat;
    cabinBody.parent = truckNode;

    const cabinNose = BABYLON.MeshBuilder.CreateBox('cabinNose', { width: 2.5, height: 1.3, depth: 1.2 }, scene);
    cabinNose.position.set(0, 1.35, 4.25);
    cabinNose.material = cabinMat;
    cabinNose.parent = truckNode;

    // Windshield (Black reflective glass)
    const windshield = BABYLON.MeshBuilder.CreateBox('windshield', { width: 2.3, height: 1.0, depth: 0.1 }, scene);
    windshield.position.set(0, 2.5, 3.65);
    windshield.rotation.x = -0.15;
    windshield.material = glassMat;
    windshield.parent = truckNode;

    // Side Windows
    const leftWindow = BABYLON.MeshBuilder.CreateBox('leftWindow', { width: 0.05, height: 0.8, depth: 1.1 }, scene);
    leftWindow.position.set(-1.26, 2.4, 2.4);
    leftWindow.material = glassMat;
    leftWindow.parent = truckNode;

    const rightWindow = BABYLON.MeshBuilder.CreateBox('rightWindow', { width: 0.05, height: 0.8, depth: 1.1 }, scene);
    rightWindow.position.set(1.26, 2.4, 2.4);
    rightWindow.material = glassMat;
    rightWindow.parent = truckNode;

    // Headlights
    const headlightMat = new BABYLON.StandardMaterial('hlight', scene);
    headlightMat.emissiveColor = new BABYLON.Color3(1.0, 1.0, 0.95);

    const lLight = BABYLON.MeshBuilder.CreateBox('lLight', { width: 0.4, height: 0.3, depth: 0.1 }, scene);
    lLight.position.set(-0.95, 1.0, 4.86);
    lLight.material = headlightMat;
    lLight.parent = truckNode;

    const rLight = BABYLON.MeshBuilder.CreateBox('rLight', { width: 0.4, height: 0.3, depth: 0.1 }, scene);
    rLight.position.set(0.95, 1.0, 4.86);
    rLight.material = headlightMat;
    rLight.parent = truckNode;

    // Blinkers (Xi-nhan) for turns
    blinkerLeft = BABYLON.MeshBuilder.CreateBox('blinkL', { width: 0.15, height: 0.15, depth: 0.1 }, scene);
    blinkerLeft.position.set(-1.18, 1.0, 4.86);
    blinkerLeft.material = blinkerLeftMat;
    blinkerLeft.parent = truckNode;

    blinkerRight = BABYLON.MeshBuilder.CreateBox('blinkR', { width: 0.15, height: 0.15, depth: 0.1 }, scene);
    blinkerRight.position.set(1.18, 1.0, 4.86);
    blinkerRight.material = blinkerRightMat;
    blinkerRight.parent = truckNode;

    // 2. Large Rear Trailer Container (Cargo box)
    const trailer = BABYLON.MeshBuilder.CreateBox('trailer', { width: 2.5, height: 3.0, depth: 12.2 }, scene);
    trailer.position.set(0, 2.2, -4.6);
    trailer.material = trailerMat;
    trailer.parent = trailerNode;

    // Add some orange safety stripes mesh on trailer side to look realistic
    const stripeLeft = BABYLON.MeshBuilder.CreateBox('stripeL', { width: 0.02, height: 0.3, depth: 12.2 }, scene);
    stripeLeft.position.set(-1.26, 1.2, -4.6);
    stripeLeft.material = yellowLightMat;
    stripeLeft.parent = trailerNode;

    const stripeRight = BABYLON.MeshBuilder.CreateBox('stripeR', { width: 0.02, height: 0.3, depth: 12.2 }, scene);
    stripeRight.position.set(1.26, 1.2, -4.6);
    stripeRight.material = yellowLightMat;
    stripeRight.parent = trailerNode;

    // 3. Mirror Bracket Wings
    // Left Mirror
    const mirrorBarL = BABYLON.MeshBuilder.CreateBox('mBarL', { width: 0.4, height: 0.08, depth: 0.08 }, scene);
    mirrorBarL.position.set(-1.45, 2.4, 3.2);
    mirrorBarL.parent = truckNode;

    const mirrorPlateL = BABYLON.MeshBuilder.CreateBox('mPlateL', { width: 0.08, height: 0.5, depth: 0.22 }, scene);
    mirrorPlateL.position.set(-1.65, 2.4, 3.2);
    mirrorPlateL.material = tireMat;
    mirrorPlateL.parent = truckNode;

    // Right Mirror
    const mirrorBarR = BABYLON.MeshBuilder.CreateBox('mBarR', { width: 0.4, height: 0.08, depth: 0.08 }, scene);
    mirrorBarR.position.set(1.45, 2.4, 3.2);
    mirrorBarR.parent = truckNode;

    const mirrorPlateR = BABYLON.MeshBuilder.CreateBox('mPlateR', { width: 0.08, height: 0.5, depth: 0.22 }, scene);
    mirrorPlateR.position.set(1.65, 2.4, 3.2);
    mirrorPlateR.material = tireMat;
    mirrorPlateR.parent = truckNode;

    // Front Proximity Blind-Spot mirror bracket
    const frontMirrorBar = BABYLON.MeshBuilder.CreateBox('fmBar', { width: 0.08, height: 0.6, depth: 0.6 }, scene);
    frontMirrorBar.position.set(0.5, 3.0, 4.3);
    frontMirrorBar.rotation.x = 0.4;
    frontMirrorBar.parent = truckNode;

    const frontMirrorPlate = BABYLON.MeshBuilder.CreateBox('fmPlate', { width: 0.4, height: 0.06, depth: 0.4 }, scene);
    frontMirrorPlate.position.set(0.5, 3.2, 4.5);
    frontMirrorPlate.material = tireMat;
    frontMirrorPlate.parent = truckNode;

    // 4. Heavy Truck Wheels (Black tires)
    const tirePositions = [
      { x: -1.2, y: 0.6, z: 4.0 },  { x: 1.2, y: 0.6, z: 4.0 },
      { x: -1.2, y: 0.6, z: 1.5 },  { x: 1.2, y: 0.6, z: 1.5 },
      { x: -1.2, y: 0.6, z: -3.5 }, { x: 1.2, y: 0.6, z: -3.5 },
      { x: -1.2, y: 0.6, z: -8.0 }, { x: 1.2, y: 0.6, z: -8.0 },
      { x: -1.2, y: 0.6, z: -9.2 }, { x: 1.2, y: 0.6, z: -9.2 },
      { x: -1.2, y: 0.6, z: -10.4 }, { x: 1.2, y: 0.6, z: -10.4 }
    ];

    tirePositions.forEach((pos, idx) => {
      const tire = BABYLON.MeshBuilder.CreateCylinder(`tire_${idx}`, { diameter: 1.2, height: 0.5 }, scene);
      tire.rotation.z = Math.PI / 2;
      tire.position.set(pos.x, pos.y, pos.z);
      tire.material = tireMat;
      if (pos.z > 0) {
        tire.parent = truckNode;
      } else {
        tire.parent = trailerNode;
      }
    });

    // Rear taillights on trailer back
    const tailL = BABYLON.MeshBuilder.CreateBox('tailL', { width: 0.5, height: 0.15, depth: 0.1 }, scene);
    tailL.position.set(-1.0, 0.8, -10.75);
    tailL.material = redLightMat;
    tailL.parent = trailerNode;

    const tailR = BABYLON.MeshBuilder.CreateBox('tailR', { width: 0.5, height: 0.15, depth: 0.1 }, scene);
    tailR.position.set(1.0, 0.8, -10.75);
    tailR.material = redLightMat;
    tailR.parent = trailerNode;

    return { truckNode, trailerNode, blinkerLeft: blinkerLeft!, blinkerRight: blinkerRight! };
  }
}
