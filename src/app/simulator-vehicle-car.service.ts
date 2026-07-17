import { Injectable } from '@angular/core';
import * as BABYLON from '@babylonjs/core';

@Injectable({ providedIn: 'root' })
export class SimulatorVehicleCarService {
  createCar(scene: BABYLON.Scene, options?: { bodyColor?: BABYLON.Color3 }): BABYLON.TransformNode {
    const carNode = new BABYLON.TransformNode('carNode', scene);

    const bodyMat = new BABYLON.StandardMaterial('carBodyMat', scene);
    bodyMat.diffuseColor = options?.bodyColor || new BABYLON.Color3(0.85, 0.15, 0.15); // Sporty crimson red for high contrast
    bodyMat.specularColor = new BABYLON.Color3(0.8, 0.8, 0.8);

    const glassMat = new BABYLON.StandardMaterial('carGlassMat', scene);
    glassMat.diffuseColor = new BABYLON.Color3(0.08, 0.08, 0.1);
    glassMat.emissiveColor = new BABYLON.Color3(0.05, 0.1, 0.15);
    glassMat.alpha = 0.85;

    const tireMat = new BABYLON.StandardMaterial('carTireMat', scene);
    tireMat.diffuseColor = new BABYLON.Color3(0.08, 0.08, 0.1);

    const rimMat = new BABYLON.StandardMaterial('carRimMat', scene);
    rimMat.diffuseColor = new BABYLON.Color3(0.85, 0.85, 0.88); // Metallic bright silver
    rimMat.specularColor = new BABYLON.Color3(1.0, 1.0, 1.0);
    rimMat.roughness = 0.15;

    const capMat = new BABYLON.StandardMaterial('carCapMat', scene);
    capMat.diffuseColor = new BABYLON.Color3(0.15, 0.15, 0.18); // Glossy dark center cap
    capMat.specularColor = new BABYLON.Color3(0.8, 0.8, 0.8);

    const lightMat = new BABYLON.StandardMaterial('carLightMat', scene);
    lightMat.emissiveColor = new BABYLON.Color3(1.0, 1.0, 0.8);

    const taillightMat = new BABYLON.StandardMaterial('carTailMat', scene);
    taillightMat.emissiveColor = new BABYLON.Color3(0.9, 0.1, 0.1);

    // Main lower body
    const lowerBody = BABYLON.MeshBuilder.CreateBox('carLowerBody', { width: 1.8, height: 0.6, depth: 4.2 }, scene);
    lowerBody.position.y = 0.525;
    lowerBody.material = bodyMat;
    lowerBody.parent = carNode;

    // Upper cabin (roof + windows)
    const upperCabin = BABYLON.MeshBuilder.CreateBox('carUpperCabin', { width: 1.5, height: 0.65, depth: 2.2 }, scene);
    upperCabin.position.set(0, 1.125, -0.2);
    upperCabin.material = bodyMat;
    upperCabin.parent = carNode;

    // Windshield (kính chắn gió trước)
    const windshield = BABYLON.MeshBuilder.CreateBox('carWindshield', { width: 1.45, height: 0.6, depth: 0.1 }, scene);
    windshield.position.set(0, 1.025, 0.95);
    windshield.rotation.x = -0.5; // sloped forward
    windshield.material = glassMat;
    windshield.parent = carNode;

    // Rear glass (kính sau)
    const rearGlass = BABYLON.MeshBuilder.CreateBox('carRearGlass', { width: 1.45, height: 0.6, depth: 0.1 }, scene);
    rearGlass.position.set(0, 1.025, -1.35);
    rearGlass.rotation.x = 0.5; // sloped backward
    rearGlass.material = glassMat;
    rearGlass.parent = carNode;

    // Side windows (kính hông)
    const sideGlassL = BABYLON.MeshBuilder.CreateBox('carSideGlassL', { width: 0.02, height: 0.45, depth: 1.8 }, scene);
    sideGlassL.position.set(-0.755, 1.125, -0.2);
    sideGlassL.material = glassMat;
    sideGlassL.parent = carNode;

    const sideGlassR = BABYLON.MeshBuilder.CreateBox('carSideGlassR', { width: 0.02, height: 0.45, depth: 1.8 }, scene);
    sideGlassR.position.set(0.755, 1.125, -0.2);
    sideGlassR.material = glassMat;
    sideGlassR.parent = carNode;

    // Headlights (đèn pha trước)
    const lightL = BABYLON.MeshBuilder.CreateBox('carLightL', { width: 0.25, height: 0.15, depth: 0.15 }, scene);
    lightL.position.set(-0.7, 0.575, 2.05);
    lightL.material = lightMat;
    lightL.parent = carNode;

    const lightR = BABYLON.MeshBuilder.CreateBox('carLightR', { width: 0.25, height: 0.15, depth: 0.15 }, scene);
    lightR.position.set(0.7, 0.575, 2.05);
    lightR.material = lightMat;
    lightR.parent = carNode;

    // Taillights (đèn hậu)
    const taillightL = BABYLON.MeshBuilder.CreateBox('carTailL', { width: 0.3, height: 0.15, depth: 0.1 }, scene);
    taillightL.position.set(-0.7, 0.575, -2.08);
    taillightL.material = taillightMat;
    taillightL.parent = carNode;

    const taillightR = BABYLON.MeshBuilder.CreateBox('carTailR', { width: 0.3, height: 0.15, depth: 0.1 }, scene);
    taillightR.position.set(0.7, 0.575, -2.08);
    taillightR.material = taillightMat;
    taillightR.parent = carNode;

    // Vietnamese-style yellow license plates (biển số màu vàng)
    const plateBackgroundMat = new BABYLON.StandardMaterial('carPlateBgMat', scene);
    plateBackgroundMat.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1); // black outline frame

    const plateYellowMat = new BABYLON.StandardMaterial('carPlateYellowMat', scene);
    plateYellowMat.diffuseColor = new BABYLON.Color3(0.95, 0.75, 0.05); // Bright golden yellow
    plateYellowMat.emissiveColor = new BABYLON.Color3(0.35, 0.25, 0.02); // Reflective yellow glow
    plateYellowMat.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);

    // Front License Plate
    const frontPlateBg = BABYLON.MeshBuilder.CreateBox('carFrontPlateBg', { width: 0.52, height: 0.15, depth: 0.02 }, scene);
    frontPlateBg.position.set(0, 0.42, 2.11);
    frontPlateBg.material = plateBackgroundMat;
    frontPlateBg.parent = carNode;

    const frontPlateYellow = BABYLON.MeshBuilder.CreateBox('carFrontPlateYellow', { width: 0.48, height: 0.11, depth: 0.022 }, scene);
    frontPlateYellow.position.set(0, 0.42, 2.111);
    frontPlateYellow.material = plateYellowMat;
    frontPlateYellow.parent = carNode;

    // Rear License Plate
    const rearPlateBg = BABYLON.MeshBuilder.CreateBox('carRearPlateBg', { width: 0.52, height: 0.15, depth: 0.02 }, scene);
    rearPlateBg.position.set(0, 0.42, -2.11);
    rearPlateBg.material = plateBackgroundMat;
    rearPlateBg.parent = carNode;

    const rearPlateYellow = BABYLON.MeshBuilder.CreateBox('carRearPlateYellow', { width: 0.48, height: 0.11, depth: 0.022 }, scene);
    rearPlateYellow.position.set(0, 0.42, -2.111);
    rearPlateYellow.material = plateYellowMat;
    rearPlateYellow.parent = carNode;

    // Wheels
    const wheelPositions = [
      { x: -0.9, y: 0.325, z: 1.2 },
      { x: 0.9, y: 0.325, z: 1.2 },
      { x: -0.9, y: 0.325, z: -1.2 },
      { x: 0.9, y: 0.325, z: -1.2 }
    ];

    wheelPositions.forEach((pos, idx) => {
      // 1. Black outer tire
      const wheel = BABYLON.MeshBuilder.CreateCylinder(`carWheel_${idx}`, { diameter: 0.65, height: 0.28, tessellation: 24 }, scene);
      wheel.position.set(pos.x, pos.y, pos.z);
      wheel.rotation.z = Math.PI / 2;
      wheel.material = tireMat;
      wheel.parent = carNode;

      // 2. Bright silver outer rim (changed to capMat for dark sporty contrast background)
      const rim = BABYLON.MeshBuilder.CreateCylinder(`carRim_${idx}`, { diameter: 0.48, height: 0.282, tessellation: 24 }, scene);
      rim.material = capMat;
      rim.parent = wheel;

      // 3. Central logo center cap (glossy dark)
      const centerCap = BABYLON.MeshBuilder.CreateCylinder(`carCap_${idx}`, { diameter: 0.12, height: 0.284, tessellation: 16 }, scene);
      centerCap.material = rimMat; // Bright silver cap to contrast with dark rim background
      centerCap.parent = wheel;

      // 4. Five sporty thick silver spokes on both flat sides of the wheel to maximize rotation visibility
      const spokeLength = 0.18; // From center cap out to rim (total rim radius is 0.24)
      for (let s = 0; s < 5; s++) {
        const angle = (s * 2 * Math.PI) / 5;

        // Outer side spokes (y = 0.141) - Protrudes by 0.04m and has 0.07m width for strong 3D visual shadows
        const spokeOut = BABYLON.MeshBuilder.CreateBox(`carSpokeOut_${idx}_${s}`, { width: 0.07, height: 0.04, depth: spokeLength }, scene);
        spokeOut.material = rimMat;
        spokeOut.parent = wheel;
        spokeOut.position.set(Math.sin(angle) * (0.06 + spokeLength / 2), 0.141, Math.cos(angle) * (0.06 + spokeLength / 2));
        spokeOut.rotation.y = angle;

        // Inner side spokes (y = -0.141)
        const spokeIn = BABYLON.MeshBuilder.CreateBox(`carSpokeIn_${idx}_${s}`, { width: 0.07, height: 0.04, depth: spokeLength }, scene);
        spokeIn.material = rimMat;
        spokeIn.parent = wheel;
        spokeIn.position.set(Math.sin(angle) * (0.06 + spokeLength / 2), -0.141, Math.cos(angle) * (0.06 + spokeLength / 2));
        spokeIn.rotation.y = angle;
      }

      // 5. Silver outer ring wrapping around the spokes to make it look highly polished and sporty
      const ringOut = BABYLON.MeshBuilder.CreateTorus(`carRingOut_${idx}`, { diameter: 0.42, thickness: 0.03, tessellation: 24 }, scene);
      ringOut.material = rimMat;
      ringOut.parent = wheel;
      ringOut.position.y = 0.14;

      const ringIn = BABYLON.MeshBuilder.CreateTorus(`carRingIn_${idx}`, { diameter: 0.42, thickness: 0.03, tessellation: 24 }, scene);
      ringIn.material = rimMat;
      ringIn.parent = wheel;
      ringIn.position.y = -0.14;
    });

    return carNode;
  }
}
