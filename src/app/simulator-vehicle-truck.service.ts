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

    // Front Grille (Hốc tản nhiệt phía trước với các thanh chrome ngang)
    const grilleBg = BABYLON.MeshBuilder.CreateBox('grilleBg', { width: 1.4, height: 0.8, depth: 0.05 }, scene);
    grilleBg.position.set(0, 1.4, 4.84);
    grilleBg.material = tireMat;
    grilleBg.parent = truckNode;

    const chromeMat = new BABYLON.StandardMaterial('chromeMat', scene);
    chromeMat.diffuseColor = new BABYLON.Color3(0.7, 0.73, 0.75);
    chromeMat.specularColor = new BABYLON.Color3(0.9, 0.9, 0.9);

    for (let i = 0; i < 3; i++) {
      const grilleBar = BABYLON.MeshBuilder.CreateBox(`grilleBar_${i}`, { width: 1.35, height: 0.08, depth: 0.03 }, scene);
      grilleBar.position.set(0, -0.24 + i * 0.24, 0.03);
      grilleBar.material = chromeMat;
      grilleBar.parent = grilleBg;
    }

    // Yellow Reflective License Plates (Biển số xe màu vàng phản quang - Front)
    const licensePlateMat = new BABYLON.StandardMaterial('licPlateMat', scene);
    licensePlateMat.diffuseColor = new BABYLON.Color3(0.95, 0.75, 0.05); // Bright golden yellow
    licensePlateMat.emissiveColor = new BABYLON.Color3(0.3, 0.22, 0.01); // Reflective glow
    licensePlateMat.specularColor = new BABYLON.Color3(0.3, 0.3, 0.3);

    const frontPlate = BABYLON.MeshBuilder.CreateBox('frontPlate', { width: 0.55, height: 0.14, depth: 0.02 }, scene);
    frontPlate.position.set(0, 0.7, 4.86);
    frontPlate.material = licensePlateMat;
    frontPlate.parent = truckNode;

    const frontPlateFrame = BABYLON.MeshBuilder.CreateBox('frontPlateFrame', { width: 0.58, height: 0.17, depth: 0.015 }, scene);
    frontPlateFrame.position.set(0, 0.7, 4.85);
    frontPlateFrame.material = tireMat;
    frontPlateFrame.parent = truckNode;

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
    // Shared Mirror Glass reflective material
    const mirrorGlassMat = new BABYLON.StandardMaterial('mGlassMat', scene);
    mirrorGlassMat.diffuseColor = new BABYLON.Color3(0.9, 0.9, 0.95);
    mirrorGlassMat.specularColor = new BABYLON.Color3(1.0, 1.0, 1.0);
    mirrorGlassMat.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.25);

    // Left Mirror
    const mirrorBarL = BABYLON.MeshBuilder.CreateBox('mBarL', { width: 0.4, height: 0.08, depth: 0.08 }, scene);
    mirrorBarL.position.set(-1.45, 2.4, 3.2);
    mirrorBarL.material = tireMat;
    mirrorBarL.parent = truckNode;

    const mirrorPlateL = BABYLON.MeshBuilder.CreateBox('mPlateL', { width: 0.25, height: 0.5, depth: 0.08 }, scene);
    mirrorPlateL.position.set(-1.65, 2.4, 3.2);
    mirrorPlateL.rotation.y = 0.25; // Angled slightly inward toward cabin for realistic viewing
    mirrorPlateL.material = tireMat;
    mirrorPlateL.parent = truckNode;

    // Left Mirror Glass reflective surface (facing backwards)
    const mirrorGlassL = BABYLON.MeshBuilder.CreateBox('mGlassL', { width: 0.21, height: 0.46, depth: 0.01 }, scene);
    mirrorGlassL.position.set(0, 0, -0.041); // positioned on the back-facing side of the plate
    mirrorGlassL.material = mirrorGlassMat;
    mirrorGlassL.parent = mirrorPlateL;

    // Right Mirror
    const mirrorBarR = BABYLON.MeshBuilder.CreateBox('mBarR', { width: 0.4, height: 0.08, depth: 0.08 }, scene);
    mirrorBarR.position.set(1.45, 2.4, 3.2);
    mirrorBarR.material = tireMat;
    mirrorBarR.parent = truckNode;

    const mirrorPlateR = BABYLON.MeshBuilder.CreateBox('mPlateR', { width: 0.25, height: 0.5, depth: 0.08 }, scene);
    mirrorPlateR.position.set(1.65, 2.4, 3.2);
    mirrorPlateR.rotation.y = -0.25; // Angled slightly inward toward cabin for realistic viewing
    mirrorPlateR.material = tireMat;
    mirrorPlateR.parent = truckNode;

    // Right Mirror Glass reflective surface (facing backwards)
    const mirrorGlassR = BABYLON.MeshBuilder.CreateBox('mGlassR', { width: 0.21, height: 0.46, depth: 0.01 }, scene);
    mirrorGlassR.position.set(0, 0, -0.041); // positioned on the back-facing side of the plate
    mirrorGlassR.material = mirrorGlassMat;
    mirrorGlassR.parent = mirrorPlateR;

    // Front Proximity Blind-Spot mirror bracket
    // Mounting base on cabin top-right-front corner
    const frontMirrorBase = BABYLON.MeshBuilder.CreateBox('fmBase', { width: 0.15, height: 0.15, depth: 0.1 }, scene);
    frontMirrorBase.position.set(1.1, 3.0, 3.65);
    frontMirrorBase.material = tireMat;
    frontMirrorBase.parent = truckNode;

    // Bracket arm extending forward-upward from the cabin
    const frontMirrorArm = BABYLON.MeshBuilder.CreateCylinder('fmArm', { diameter: 0.05, height: 1.3 }, scene);
    frontMirrorArm.position.set(1.1, 3.15, 4.2);
    frontMirrorArm.rotation.x = 1.2; // slanted forward-upward
    frontMirrorArm.material = tireMat;
    frontMirrorArm.parent = truckNode;

    // The circular convex mirror casing (back)
    const frontMirrorPlate = BABYLON.MeshBuilder.CreateCylinder('fmPlate', { diameter: 0.45, height: 0.05 }, scene);
    frontMirrorPlate.position.set(1.1, 3.38, 4.8);
    frontMirrorPlate.rotation.x = 0.4; // tilted downward to monitor the front bumper
    frontMirrorPlate.material = tireMat;
    frontMirrorPlate.parent = truckNode;

    // The mirror reflective surface (lens)
    const frontMirrorGlass = BABYLON.MeshBuilder.CreateCylinder('fmGlass', { diameter: 0.41, height: 0.01 }, scene);
    frontMirrorGlass.position.set(0, -0.026, 0); // mounted at the bottom of casing (pointing down)
    frontMirrorGlass.material = mirrorGlassMat;
    frontMirrorGlass.parent = frontMirrorPlate;

    // 4. Heavy Truck Wheels (Black tires)
    const tirePositions = [
      { x: -1.2, y: 0.6, z: 4.0 },  { x: 1.2, y: 0.6, z: 4.0 },
      { x: -1.2, y: 0.6, z: 1.5 },  { x: 1.2, y: 0.6, z: 1.5 },
      { x: -1.2, y: 0.6, z: -3.5 }, { x: 1.2, y: 0.6, z: -3.5 },
      { x: -1.2, y: 0.6, z: -7.5 }, { x: 1.2, y: 0.6, z: -7.5 },
      { x: -1.2, y: 0.6, z: -8.7 }, { x: 1.2, y: 0.6, z: -8.7 },
      { x: -1.2, y: 0.6, z: -9.9 }, { x: 1.2, y: 0.6, z: -9.9 }
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

    // Rear bumper bar (Thanh chống va chạm sau / Cản sau)
    const bumperMat = new BABYLON.StandardMaterial('bumperMat', scene);
    bumperMat.diffuseColor = new BABYLON.Color3(0.12, 0.12, 0.14);
    
    const rearBumper = BABYLON.MeshBuilder.CreateBox('rearBumper', { width: 2.45, height: 0.35, depth: 0.15 }, scene);
    rearBumper.position.set(0, 0.8, -10.75);
    rearBumper.material = bumperMat;
    rearBumper.parent = trailerNode;

    // Rear License Plate (Biển số xe màu vàng phản quang - Rear)
    const rearPlate = BABYLON.MeshBuilder.CreateBox('rearPlate', { width: 0.55, height: 0.14, depth: 0.02 }, scene);
    rearPlate.position.set(0, 0.8, -10.84);
    rearPlate.material = licensePlateMat;
    rearPlate.parent = trailerNode;

    const rearPlateFrame = BABYLON.MeshBuilder.CreateBox('rearPlateFrame', { width: 0.58, height: 0.17, depth: 0.015 }, scene);
    rearPlateFrame.position.set(0, 0.8, -10.83);
    rearPlateFrame.material = tireMat;
    rearPlateFrame.parent = trailerNode;

    // Rear Fenders / Mudguards (Chắn bùn cho cụm 3 bánh xe sau của rơ-moóc)
    // Left Rear Fender
    const leftFender = BABYLON.MeshBuilder.CreateBox('leftFender', { width: 0.65, height: 0.04, depth: 3.3 }, scene);
    leftFender.position.set(-1.2, 1.25, -8.7);
    leftFender.material = tireMat;
    leftFender.parent = trailerNode;

    const leftFenderFront = BABYLON.MeshBuilder.CreateBox('leftFenderFront', { width: 0.65, height: 0.45, depth: 0.04 }, scene);
    leftFenderFront.position.set(0, -0.22, 1.63);
    leftFenderFront.rotation.x = -0.3; // slightly angled down
    leftFenderFront.material = tireMat;
    leftFenderFront.parent = leftFender;

    const leftFenderRear = BABYLON.MeshBuilder.CreateBox('leftFenderRear', { width: 0.65, height: 0.45, depth: 0.04 }, scene);
    leftFenderRear.position.set(0, -0.22, -1.63);
    leftFenderRear.rotation.x = 0.3; // slightly angled down
    leftFenderRear.material = tireMat;
    leftFenderRear.parent = leftFender;

    // Right Rear Fender
    const rightFender = BABYLON.MeshBuilder.CreateBox('rightFender', { width: 0.65, height: 0.04, depth: 3.3 }, scene);
    rightFender.position.set(1.2, 1.25, -8.7);
    rightFender.material = tireMat;
    rightFender.parent = trailerNode;

    const rightFenderFront = BABYLON.MeshBuilder.CreateBox('rightFenderFront', { width: 0.65, height: 0.45, depth: 0.04 }, scene);
    rightFenderFront.position.set(0, -0.22, 1.63);
    rightFenderFront.rotation.x = -0.3; // slightly angled down
    rightFenderFront.material = tireMat;
    rightFenderFront.parent = rightFender;

    const rightFenderRear = BABYLON.MeshBuilder.CreateBox('rightFenderRear', { width: 0.65, height: 0.45, depth: 0.04 }, scene);
    rightFenderRear.position.set(0, -0.22, -1.63);
    rightFenderRear.rotation.x = 0.3; // slightly angled down
    rightFenderRear.material = tireMat;
    rightFenderRear.parent = rightFender;

    // Rear taillights on the rear bumper
    const tailL = BABYLON.MeshBuilder.CreateBox('tailL', { width: 0.5, height: 0.18, depth: 0.1 }, scene);
    tailL.position.set(-0.7, 0.8, -10.90);
    tailL.material = redLightMat;
    tailL.parent = trailerNode;

    const tailR = BABYLON.MeshBuilder.CreateBox('tailR', { width: 0.5, height: 0.18, depth: 0.1 }, scene);
    tailR.position.set(0.7, 0.8, -10.90);
    tailR.material = redLightMat;
    tailR.parent = trailerNode;

    // Rear blinkers (Xi-nhan sau) on the rear bumper
    const rearBlinkerLeft = BABYLON.MeshBuilder.CreateBox('rearBlinkL', { width: 0.35, height: 0.18, depth: 0.1 }, scene);
    rearBlinkerLeft.position.set(-1.15, 0.8, -10.90);
    rearBlinkerLeft.material = blinkerLeftMat;
    rearBlinkerLeft.parent = trailerNode;

    const rearBlinkerRight = BABYLON.MeshBuilder.CreateBox('rearBlinkR', { width: 0.35, height: 0.18, depth: 0.1 }, scene);
    rearBlinkerRight.position.set(1.15, 0.8, -10.90);
    rearBlinkerRight.material = blinkerRightMat;
    rearBlinkerRight.parent = trailerNode;

    // Side blinkers on trailer body to be visible from side views and mirrors
    // Left side blinkers
    const sideBlinkL1 = BABYLON.MeshBuilder.CreateBox('sideBlinkL1', { width: 0.05, height: 0.15, depth: 0.3 }, scene);
    sideBlinkL1.position.set(-1.26, 1.2, -2.5);
    sideBlinkL1.material = blinkerLeftMat;
    sideBlinkL1.parent = trailerNode;

    const sideBlinkL2 = BABYLON.MeshBuilder.CreateBox('sideBlinkL2', { width: 0.05, height: 0.15, depth: 0.3 }, scene);
    sideBlinkL2.position.set(-1.26, 1.2, -7.0);
    sideBlinkL2.material = blinkerLeftMat;
    sideBlinkL2.parent = trailerNode;

    // Right side blinkers
    const sideBlinkR1 = BABYLON.MeshBuilder.CreateBox('sideBlinkR1', { width: 0.05, height: 0.15, depth: 0.3 }, scene);
    sideBlinkR1.position.set(1.26, 1.2, -2.5);
    sideBlinkR1.material = blinkerRightMat;
    sideBlinkR1.parent = trailerNode;

    const sideBlinkR2 = BABYLON.MeshBuilder.CreateBox('sideBlinkR2', { width: 0.05, height: 0.15, depth: 0.3 }, scene);
    sideBlinkR2.position.set(1.26, 1.2, -7.0);
    sideBlinkR2.material = blinkerRightMat;
    sideBlinkR2.parent = trailerNode;

    return { truckNode, trailerNode, blinkerLeft: blinkerLeft!, blinkerRight: blinkerRight! };
  }
}
