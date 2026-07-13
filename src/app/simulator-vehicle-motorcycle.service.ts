import { Injectable } from '@angular/core';
import * as BABYLON from '@babylonjs/core';

@Injectable({ providedIn: 'root' })
export class SimulatorVehicleMotorcycleService {
  createMotorcycle(scene: BABYLON.Scene) {
    const motorcycleNode = new BABYLON.TransformNode('motorcycleNode', scene);

    const frameMat = new BABYLON.StandardMaterial('frameMat', scene);
    frameMat.diffuseColor = new BABYLON.Color3(0.9, 0.1, 0.1); // High contrast red bike
    frameMat.specularColor = new BABYLON.Color3(1, 1, 1);

    const tireMat = new BABYLON.StandardMaterial('tMat', scene);
    tireMat.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);

    const mRimMat = new BABYLON.StandardMaterial('mRimMat', scene);
    mRimMat.diffuseColor = new BABYLON.Color3(0.7, 0.73, 0.75);
    mRimMat.specularColor = new BABYLON.Color3(0.8, 0.8, 0.8);

    const helmetMat = new BABYLON.StandardMaterial('helmetMat', scene);
    helmetMat.diffuseColor = new BABYLON.Color3(0.95, 0.8, 0.0); // Hi-vis yellow helmet

    const jacketMat = new BABYLON.StandardMaterial('jacketMat', scene);
    jacketMat.diffuseColor = new BABYLON.Color3(0.15, 0.65, 0.35); // Safety green jacket

    // 1. Two wheels
    const wheelF = BABYLON.MeshBuilder.CreateCylinder('mWheelF', { diameter: 0.6, height: 0.16 }, scene);
    wheelF.rotation.z = Math.PI / 2;
    wheelF.position.set(0, 0.3, 0.8);
    wheelF.material = tireMat;
    wheelF.parent = motorcycleNode;

    const wheelR = BABYLON.MeshBuilder.CreateCylinder('mWheelR', { diameter: 0.6, height: 0.16 }, scene);
    wheelR.rotation.z = Math.PI / 2;
    wheelR.position.set(0, 0.3, -0.8);
    wheelR.material = tireMat;
    wheelR.parent = motorcycleNode;

    // Helper to add rim and spokes to a motorcycle wheel
    const addMotorcycleRim = (wheel: BABYLON.Mesh) => {
      const mRim = BABYLON.MeshBuilder.CreateCylinder(wheel.name + '_rim', { diameter: 0.42, height: 0.162 }, scene);
      mRim.material = mRimMat;
      mRim.parent = wheel;

      // Hubcaps
      const hubTop = BABYLON.MeshBuilder.CreateCylinder(wheel.name + '_hubTop', { diameter: 0.15, height: 0.02 }, scene);
      hubTop.position.set(0, 0.082, 0);
      hubTop.material = tireMat;
      hubTop.parent = wheel;

      const hubBot = BABYLON.MeshBuilder.CreateCylinder(wheel.name + '_hubBot', { diameter: 0.15, height: 0.02 }, scene);
      hubBot.position.set(0, -0.082, 0);
      hubBot.material = tireMat;
      hubBot.parent = wheel;

      // Spoke Bars
      const spTop1 = BABYLON.MeshBuilder.CreateBox(wheel.name + '_spTop1', { width: 0.4, height: 0.015, depth: 0.04 }, scene);
      spTop1.position.set(0, 0.081, 0);
      spTop1.material = tireMat;
      spTop1.parent = wheel;

      const spTop2 = BABYLON.MeshBuilder.CreateBox(wheel.name + '_spTop2', { width: 0.04, height: 0.015, depth: 0.4 }, scene);
      spTop2.position.set(0, 0.081, 0);
      spTop2.material = tireMat;
      spTop2.parent = wheel;

      const spBot1 = BABYLON.MeshBuilder.CreateBox(wheel.name + '_spBot1', { width: 0.4, height: 0.015, depth: 0.04 }, scene);
      spBot1.position.set(0, -0.081, 0);
      spBot1.material = tireMat;
      spBot1.parent = wheel;

      const spBot2 = BABYLON.MeshBuilder.CreateBox(wheel.name + '_spBot2', { width: 0.04, height: 0.015, depth: 0.4 }, scene);
      spBot2.position.set(0, -0.081, 0);
      spBot2.material = tireMat;
      spBot2.parent = wheel;
    };

    addMotorcycleRim(wheelF);
    addMotorcycleRim(wheelR);

    // 2. Honda scooter style body, seat, exhaust pipe, and shields
    const frame = BABYLON.MeshBuilder.CreateBox('mFrame', { width: 0.25, height: 0.55, depth: 1.3 }, scene);
    frame.position.set(0, 0.58, 0);
    frame.material = frameMat;
    frame.parent = motorcycleNode;

    const tank = BABYLON.MeshBuilder.CreateBox('mTank', { width: 0.35, height: 0.35, depth: 0.6 }, scene);
    tank.position.set(0, 0.85, 0.15);
    tank.material = frameMat;
    tank.parent = motorcycleNode;

    // Front shield (yếm xe máy) typical of Honda Wave / Vision
    const shield = BABYLON.MeshBuilder.CreateBox('mShield', { width: 0.6, height: 0.65, depth: 0.08 }, scene);
    shield.position.set(0, 0.82, 0.62);
    shield.rotation.x = -0.22; // slanted back
    shield.material = frameMat;
    shield.parent = motorcycleNode;

    const shieldInner = BABYLON.MeshBuilder.CreateBox('mShieldInner', { width: 0.5, height: 0.55, depth: 0.08 }, scene);
    shieldInner.position.set(0, 0.80, 0.64);
    shieldInner.rotation.x = -0.22;
    const darkGreyMat = new BABYLON.StandardMaterial('darkGrey', scene);
    darkGreyMat.diffuseColor = new BABYLON.Color3(0.15, 0.15, 0.15);
    shieldInner.material = darkGreyMat;
    shieldInner.parent = motorcycleNode;

    // Long double leather seat (yên xe)
    const seatMat = new BABYLON.StandardMaterial('seatMat', scene);
    seatMat.diffuseColor = new BABYLON.Color3(0.12, 0.12, 0.12);
    const seat = BABYLON.MeshBuilder.CreateBox('mSeat', { width: 0.3, height: 0.12, depth: 0.8 }, scene);
    seat.position.set(0, 0.77, -0.3);
    seat.rotation.x = -0.05; // slight tilt
    seat.material = seatMat;
    seat.parent = motorcycleNode;

    // Upward-swept exhaust pipe (ống pô) on right side
    const exhaustMat = new BABYLON.StandardMaterial('exhaustMat', scene);
    exhaustMat.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    exhaustMat.specularColor = new BABYLON.Color3(0.8, 0.8, 0.8);
    const exhaust = BABYLON.MeshBuilder.CreateCylinder('mExhaust', { diameter: 0.12, height: 0.85 }, scene);
    exhaust.position.set(0.28, 0.38, -0.55);
    exhaust.rotation.x = Math.PI / 2 - 0.15; // swept upwards
    exhaust.rotation.y = 0.08; // slightly out
    exhaust.material = exhaustMat;
    exhaust.parent = motorcycleNode;

    // Rear fender (chắn bùn sau) with license plate
    const fenderMat = new BABYLON.StandardMaterial('fenderMat', scene);
    fenderMat.diffuseColor = new BABYLON.Color3(0.15, 0.15, 0.15);
    const fender = BABYLON.MeshBuilder.CreateBox('mFender', { width: 0.25, height: 0.45, depth: 0.05 }, scene);
    fender.position.set(0, 0.45, -0.92);
    fender.rotation.x = 0.25;
    fender.material = fenderMat;
    fender.parent = motorcycleNode;

    // License Plate (Biển số xe Việt Nam)
    const licensePlate = BABYLON.MeshBuilder.CreatePlane('mPlate', { width: 0.22, height: 0.16 }, scene);
    licensePlate.position.set(0, 0.38, -0.96);
    licensePlate.rotation.x = 0.25;
    licensePlate.rotation.y = Math.PI; // Face backwards
    
    // Create a dynamic texture for the license plate text
    const plateTexture = new BABYLON.DynamicTexture('plateTexture', {width: 256, height: 200}, scene, false);
    const plateMat = new BABYLON.StandardMaterial('plateMat', scene);
    plateMat.diffuseTexture = plateTexture;
    plateMat.specularColor = new BABYLON.Color3(0, 0, 0);
    plateMat.emissiveColor = new BABYLON.Color3(0.5, 0.5, 0.5); // make it slightly bright
    licensePlate.material = plateMat;
    licensePlate.parent = motorcycleNode;

    // Draw text on the license plate
    const plateContext = plateTexture.getContext() as any;
    plateContext.fillStyle = 'white';
    plateContext.fillRect(0, 0, 256, 200);
    plateContext.fillStyle = 'black';
    plateContext.font = 'bold 50px monospace';
    plateContext.textAlign = 'center';
    plateContext.fillText('29-A1', 128, 80);
    plateContext.fillText('123.45', 128, 150);
    plateContext.lineWidth = 5;
    plateContext.strokeRect(5, 5, 246, 190);
    plateTexture.update();

    // Turn Signals (Xi nhan)
    const turnSignalLMat = new BABYLON.StandardMaterial('turnSignalLMat', scene);
    turnSignalLMat.emissiveColor = new BABYLON.Color3(0.1, 0.05, 0); // Orange/Amber off
    turnSignalLMat.diffuseColor = new BABYLON.Color3(1, 0.5, 0);

    const turnSignalRMat = new BABYLON.StandardMaterial('turnSignalRMat', scene);
    turnSignalRMat.emissiveColor = new BABYLON.Color3(0.1, 0.05, 0); // Orange/Amber off
    turnSignalRMat.diffuseColor = new BABYLON.Color3(1, 0.5, 0);

    // Rear Turn Signals (Xi nhan sau)
    const rearSignalL = BABYLON.MeshBuilder.CreateBox('mRearSignalL', { width: 0.06, height: 0.04, depth: 0.04 }, scene);
    rearSignalL.position.set(-0.16, 0.45, -0.90);
    rearSignalL.material = turnSignalLMat;
    rearSignalL.parent = motorcycleNode;

    const rearSignalR = BABYLON.MeshBuilder.CreateBox('mRearSignalR', { width: 0.06, height: 0.04, depth: 0.04 }, scene);
    rearSignalR.position.set(0.16, 0.45, -0.90);
    rearSignalR.material = turnSignalRMat;
    rearSignalR.parent = motorcycleNode;

    // Front Turn Signals (Xi nhan trước)
    const frontSignalL = BABYLON.MeshBuilder.CreateBox('mFrontSignalL', { width: 0.08, height: 0.06, depth: 0.06 }, scene);
    frontSignalL.position.set(-0.33, 0.88, 0.68);
    frontSignalL.rotation.y = -0.2;
    frontSignalL.material = turnSignalLMat;
    frontSignalL.parent = motorcycleNode;

    const frontSignalR = BABYLON.MeshBuilder.CreateBox('mFrontSignalR', { width: 0.08, height: 0.06, depth: 0.06 }, scene);
    frontSignalR.position.set(0.33, 0.88, 0.68);
    frontSignalR.rotation.y = 0.2;
    frontSignalR.material = turnSignalRMat;
    frontSignalR.parent = motorcycleNode;

    // Handlebar (Ghi-đông)
    const handlebar = BABYLON.MeshBuilder.CreateCylinder('mBar', { diameter: 0.06, height: 0.85 }, scene);
    handlebar.rotation.z = Math.PI / 2;
    handlebar.position.set(0, 1.05, 0.55);
    handlebar.parent = motorcycleNode;

    // Handle grips
    const gripMat = new BABYLON.StandardMaterial('gripMat', scene);
    gripMat.diffuseColor = new BABYLON.Color3(0.05, 0.05, 0.05);

    const gripL = BABYLON.MeshBuilder.CreateCylinder('mGripL', { diameter: 0.08, height: 0.18 }, scene);
    gripL.rotation.z = Math.PI / 2;
    gripL.position.set(-0.35, 1.05, 0.55);
    gripL.material = gripMat;
    gripL.parent = motorcycleNode;

    const gripR = BABYLON.MeshBuilder.CreateCylinder('mGripR', { diameter: 0.08, height: 0.18 }, scene);
    gripR.rotation.z = Math.PI / 2;
    gripR.position.set(0.35, 1.05, 0.55);
    gripR.material = gripMat;
    gripR.parent = motorcycleNode;

    // 2.5 Rear View Mirrors (Cặp gương chiếu hậu tròn đặc trưng Việt Nam)
    const mirrorStemMat = new BABYLON.StandardMaterial('mStemMat', scene);
    mirrorStemMat.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.4);

    const mirrorGlassMat = new BABYLON.StandardMaterial('mGlassMat', scene);
    mirrorGlassMat.diffuseColor = new BABYLON.Color3(0.85, 0.88, 0.9);
    mirrorGlassMat.emissiveColor = new BABYLON.Color3(0.15, 0.15, 0.2);

    // Left Mirror
    const stemL = BABYLON.MeshBuilder.CreateCylinder('mStemL', { diameter: 0.02, height: 0.32 }, scene);
    stemL.position.set(-0.3, 1.20, 0.58);
    stemL.rotation.z = 0.25; // tilted out
    stemL.rotation.x = -0.15; // tilted forward
    stemL.material = mirrorStemMat;
    stemL.parent = motorcycleNode;

    const mirrorL = BABYLON.MeshBuilder.CreateCylinder('mMirrorL', { diameter: 0.18, height: 0.04 }, scene);
    mirrorL.position.set(-0.36, 1.34, 0.6);
    mirrorL.rotation.x = Math.PI / 2 - 0.1; // facing back
    mirrorL.rotation.y = 0.15;
    mirrorL.material = frameMat; // back is body color
    mirrorL.parent = motorcycleNode;

    const glassL = BABYLON.MeshBuilder.CreateCylinder('mGlassL', { diameter: 0.16, height: 0.01 }, scene);
    glassL.position.set(-0.36, 1.34, 0.58);
    glassL.rotation.x = Math.PI / 2 - 0.1;
    glassL.rotation.y = 0.15;
    glassL.material = mirrorGlassMat;
    glassL.parent = motorcycleNode;

    // Right Mirror
    const stemR = BABYLON.MeshBuilder.CreateCylinder('mStemR', { diameter: 0.02, height: 0.32 }, scene);
    stemR.position.set(0.3, 1.20, 0.58);
    stemR.rotation.z = -0.25; // tilted out
    stemR.rotation.x = -0.15; // tilted forward
    stemR.material = mirrorStemMat;
    stemR.parent = motorcycleNode;

    const mirrorR = BABYLON.MeshBuilder.CreateCylinder('mMirrorR', { diameter: 0.18, height: 0.04 }, scene);
    mirrorR.position.set(0.36, 1.34, 0.6);
    mirrorR.rotation.x = Math.PI / 2 - 0.1; // facing back
    mirrorR.rotation.y = -0.15;
    mirrorR.material = frameMat; // back is body color
    mirrorR.parent = motorcycleNode;

    const glassR = BABYLON.MeshBuilder.CreateCylinder('mGlassR', { diameter: 0.16, height: 0.01 }, scene);
    glassR.position.set(0.36, 1.34, 0.58);
    glassR.rotation.x = Math.PI / 2 - 0.1;
    glassR.rotation.y = -0.15;
    glassR.material = mirrorGlassMat;
    glassR.parent = motorcycleNode;

    // Small headlight
    const light = BABYLON.MeshBuilder.CreateSphere('mHeadlight', { diameter: 0.25 }, scene);
    light.position.set(0, 0.9, 0.85);
    const lMat = new BABYLON.StandardMaterial('mlight', scene);
    lMat.emissiveColor = new BABYLON.Color3(1, 1, 0.8);
    light.material = lMat;
    light.parent = motorcycleNode;

    // 3. Realistic Rider dummy with safety gear, articulated arms, and gloves
    const torso = BABYLON.MeshBuilder.CreateCylinder('torso', { diameter: 0.45, height: 0.8 }, scene);
    torso.rotation.x = 0.15; // natural upright riding position
    torso.position.set(0, 1.15, -0.22);
    torso.material = jacketMat;
    torso.parent = motorcycleNode;

    // Left Arm holding handle grip
    const leftUpperArm = BABYLON.MeshBuilder.CreateCylinder('mLeftUpperArm', { diameter: 0.14, height: 0.4 }, scene);
    leftUpperArm.position.set(-0.25, 1.25, -0.05);
    leftUpperArm.rotation.x = 0.4;
    leftUpperArm.rotation.z = 0.15;
    leftUpperArm.material = jacketMat;
    leftUpperArm.parent = motorcycleNode;

    const leftForearm = BABYLON.MeshBuilder.CreateCylinder('mLeftForearm', { diameter: 0.12, height: 0.45 }, scene);
    leftForearm.position.set(-0.29, 1.12, 0.28);
    leftForearm.rotation.x = -0.65;
    leftForearm.rotation.y = -0.15;
    leftForearm.material = jacketMat;
    leftForearm.parent = motorcycleNode;

    // Right Arm holding handle grip
    const rightUpperArm = BABYLON.MeshBuilder.CreateCylinder('mRightUpperArm', { diameter: 0.14, height: 0.4 }, scene);
    rightUpperArm.position.set(0.25, 1.25, -0.05);
    rightUpperArm.rotation.x = 0.4;
    rightUpperArm.rotation.z = -0.15;
    rightUpperArm.material = jacketMat;
    rightUpperArm.parent = motorcycleNode;

    const rightForearm = BABYLON.MeshBuilder.CreateCylinder('mRightForearm', { diameter: 0.12, height: 0.45 }, scene);
    rightForearm.position.set(0.29, 1.12, 0.28);
    rightForearm.rotation.x = -0.65;
    rightForearm.rotation.y = 0.15;
    rightForearm.material = jacketMat;
    rightForearm.parent = motorcycleNode;

    // Dark grey driving gloves
    const gloveMat = new BABYLON.StandardMaterial('gloveMat', scene);
    gloveMat.diffuseColor = new BABYLON.Color3(0.12, 0.12, 0.14);

    const gloveL = BABYLON.MeshBuilder.CreateSphere('mGloveL', { diameter: 0.15 }, scene);
    gloveL.position.set(-0.32, 1.05, 0.55);
    gloveL.material = gloveMat;
    gloveL.parent = motorcycleNode;

    const gloveR = BABYLON.MeshBuilder.CreateSphere('mGloveR', { diameter: 0.15 }, scene);
    gloveR.position.set(0.32, 1.05, 0.55);
    gloveR.material = gloveMat;
    gloveR.parent = motorcycleNode;

    // Helmet & Visor on the upright head
    const head = BABYLON.MeshBuilder.CreateSphere('helmet', { diameter: 0.42 }, scene);
    head.position.set(0, 1.60, -0.15);
    head.material = helmetMat;
    head.parent = motorcycleNode;

    const visor = BABYLON.MeshBuilder.CreateBox('visor', { width: 0.32, height: 0.14, depth: 0.18 }, scene);
    visor.position.set(0, 1.64, -0.01);
    const visorMat = new BABYLON.StandardMaterial('visor', scene);
    visorMat.diffuseColor = new BABYLON.Color3(0, 0, 0);
    visor.material = visorMat;
    visor.parent = motorcycleNode;

    return motorcycleNode;
  }
}
