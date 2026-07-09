import { Injectable, signal } from '@angular/core';
import * as BABYLON from '@babylonjs/core';

@Injectable({ providedIn: 'root' })
export class SimulatorCameraService {
  viewMode = signal<'orbit' | 'cabin' | 'rider'>('orbit');
  lookDirection = signal<'front' | 'left' | 'right'>('front');

  mainCamera: BABYLON.ArcRotateCamera | null = null;
  leftMirrorCamera: BABYLON.FreeCamera | null = null;
  rightMirrorCamera: BABYLON.FreeCamera | null = null;
  frontMirrorCamera: BABYLON.FreeCamera | null = null;

  setupCameras(canvas: HTMLCanvasElement, scene: BABYLON.Scene, truckNode: BABYLON.TransformNode | null) {
    // 1. Orbit overview Camera (default)
    // Replaced with ArcRotateCamera to allow orbiting around the scene
    this.mainCamera = new BABYLON.ArcRotateCamera('mainCamera', -Math.PI / 3, Math.PI / 4, 25, new BABYLON.Vector3(0, 1.8, -2), scene);
    this.mainCamera.lowerRadiusLimit = 8;
    this.mainCamera.upperRadiusLimit = 55;
    this.mainCamera.attachControl(canvas, true);
    this.mainCamera.viewport = new BABYLON.Viewport(0, 0, 1, 1);

    // 2. Left Mirror Camera (Backwards-Left angle from cabin mirror wing)
    this.leftMirrorCamera = new BABYLON.FreeCamera('leftMirrorCamera', new BABYLON.Vector3(-1.92, 2.5, 3.1), scene);
    this.leftMirrorCamera.setTarget(new BABYLON.Vector3(-12.0, 0.8, -35.0)); // Wide angle backward-left
    this.leftMirrorCamera.parent = truckNode;
    // Positioned inside left overlay on client canvas: 0.02 width-offset, 0.65 height-offset
    this.leftMirrorCamera.viewport = new BABYLON.Viewport(0.01, 0.63, 0.17, 0.33);

    // 3. Right Mirror Camera (Backwards-Right angle from cabin mirror wing)
    this.rightMirrorCamera = new BABYLON.FreeCamera('rightMirrorCamera', new BABYLON.Vector3(1.92, 2.5, 3.1), scene);
    this.rightMirrorCamera.setTarget(new BABYLON.Vector3(12.0, 0.8, -35.0)); // Wide angle backward-right
    this.rightMirrorCamera.parent = truckNode;
    // Positioned inside right overlay on client canvas: 0.82 width-offset, 0.65 height-offset
    this.rightMirrorCamera.viewport = new BABYLON.Viewport(0.82, 0.63, 0.17, 0.33);

    // 4. Front Proximity Mirror Camera (convex look-down mirror on high cabin)
    this.frontMirrorCamera = new BABYLON.FreeCamera('frontMirrorCamera', new BABYLON.Vector3(0.6, 3.25, 4.6), scene);
    this.frontMirrorCamera.setTarget(new BABYLON.Vector3(0.0, 0.3, 5.8)); // Pointing sharp down/forward
    this.frontMirrorCamera.parent = truckNode;
    // Positioned in top-middle overlay on client canvas
    this.frontMirrorCamera.viewport = new BABYLON.Viewport(0.405, 0.74, 0.19, 0.22);

    scene.activeCameras = [this.mainCamera, this.leftMirrorCamera, this.rightMirrorCamera, this.frontMirrorCamera];
  }

  updateCameraSetup(canvas: HTMLCanvasElement, truckNode: BABYLON.TransformNode | null, motorcycleNode: BABYLON.TransformNode | null) {
    if (!this.mainCamera || !truckNode || !motorcycleNode) return;

    const mode = this.viewMode();

    if (mode === 'orbit') {
      this.mainCamera.parent = null;
      this.mainCamera.target = new BABYLON.Vector3(0, 1.8, -2);
      this.mainCamera.attachControl(canvas, true);
    } else if (mode === 'rider') {
      this.mainCamera.parent = null;
      this.mainCamera.target = motorcycleNode.position;
      this.mainCamera.attachControl(canvas, true);
    } else if (mode === 'cabin') {
      // Un-link orbit controller so we can lock look-around inside cabin
      this.mainCamera.detachControl();
      this.mainCamera.parent = truckNode;
      this.mainCamera.position.set(-0.6, 2.7, 3.8); // Inside left seat at eye level
    }
  }

  updateCabinLookAngle() {
    if (this.viewMode() === 'cabin' && this.mainCamera) {
      let targetLook = new BABYLON.Vector3(-0.6, 2.5, 30.0); // look front
      if (this.lookDirection() === 'left') {
        targetLook = new BABYLON.Vector3(-10.0, 2.0, 4.0); // look left window
      } else if (this.lookDirection() === 'right') {
        targetLook = new BABYLON.Vector3(10.0, 1.8, 2.0); // look right passenger door
      }
      this.mainCamera.setTarget(targetLook);
    }
  }

  cleanup() {
    this.mainCamera = null;
    this.leftMirrorCamera = null;
    this.rightMirrorCamera = null;
    this.frontMirrorCamera = null;
  }
}
