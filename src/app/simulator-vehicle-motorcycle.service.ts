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

    const helmetMat = new BABYLON.StandardMaterial('helmetMat', scene);
    helmetMat.diffuseColor = new BABYLON.Color3(0.95, 0.8, 0.0); // Hi-vis yellow helmet

    const jacketMat = new BABYLON.StandardMaterial('jacketMat', scene);
    jacketMat.diffuseColor = new BABYLON.Color3(0.15, 0.65, 0.35); // Safety green jacket

    // 1. Two wheels
    const wheelF = BABYLON.MeshBuilder.CreateCylinder('mWheelF', { diameter: 0.8, height: 0.16 }, scene);
    wheelF.rotation.z = Math.PI / 2;
    wheelF.position.set(0, 0.4, 0.8);
    wheelF.material = tireMat;
    wheelF.parent = motorcycleNode;

    const wheelR = BABYLON.MeshBuilder.CreateCylinder('mWheelR', { diameter: 0.8, height: 0.16 }, scene);
    wheelR.rotation.z = Math.PI / 2;
    wheelR.position.set(0, 0.4, -0.8);
    wheelR.material = tireMat;
    wheelR.parent = motorcycleNode;

    // 2. Bike chassis and tank
    const frame = BABYLON.MeshBuilder.CreateBox('mFrame', { width: 0.28, height: 0.6, depth: 1.4 }, scene);
    frame.position.set(0, 0.65, 0);
    frame.material = frameMat;
    frame.parent = motorcycleNode;

    const tank = BABYLON.MeshBuilder.CreateBox('mTank', { width: 0.4, height: 0.4, depth: 0.6 }, scene);
    tank.position.set(0, 0.95, 0.15);
    tank.material = frameMat;
    tank.parent = motorcycleNode;

    const handlebar = BABYLON.MeshBuilder.CreateCylinder('mBar', { diameter: 0.08, height: 0.95 }, scene);
    handlebar.rotation.z = Math.PI / 2;
    handlebar.position.set(0, 1.15, 0.55);
    handlebar.parent = motorcycleNode;

    // Small headlight
    const light = BABYLON.MeshBuilder.CreateSphere('mHeadlight', { diameter: 0.25 }, scene);
    light.position.set(0, 1.0, 0.85);
    const lMat = new BABYLON.StandardMaterial('mlight', scene);
    lMat.emissiveColor = new BABYLON.Color3(1, 1, 0.8);
    light.material = lMat;
    light.parent = motorcycleNode;

    // 3. Simple Rider dummy (Torso & Helmet)
    const torso = BABYLON.MeshBuilder.CreateCylinder('torso', { diameter: 0.5, height: 0.9 }, scene);
    torso.rotation.x = 0.25; // Lean forward slightly
    torso.position.set(0, 1.1, -0.1);
    torso.material = jacketMat;
    torso.parent = motorcycleNode;

    const head = BABYLON.MeshBuilder.CreateSphere('helmet', { diameter: 0.42 }, scene);
    head.position.set(0, 1.62, 0.02);
    head.material = helmetMat;
    head.parent = motorcycleNode;

    const visor = BABYLON.MeshBuilder.CreateBox('visor', { width: 0.32, height: 0.14, depth: 0.18 }, scene);
    visor.position.set(0, 1.66, 0.16);
    const visorMat = new BABYLON.StandardMaterial('visor', scene);
    visorMat.diffuseColor = new BABYLON.Color3(0, 0, 0);
    visor.material = visorMat;
    visor.parent = motorcycleNode;

    return motorcycleNode;
  }
}
