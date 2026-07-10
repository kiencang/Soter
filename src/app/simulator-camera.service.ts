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
  frontMirrorDisc: BABYLON.Mesh | null = null;
  frontMirrorRTT: BABYLON.RenderTargetTexture | null = null;

  setupCameras(canvas: HTMLCanvasElement, scene: BABYLON.Scene, truckNode: BABYLON.TransformNode | null) {
    // 1. Orbit overview Camera (default)
    // Replaced with ArcRotateCamera to allow orbiting around the scene
    this.mainCamera = new BABYLON.ArcRotateCamera('mainCamera', -Math.PI / 3, Math.PI / 4, 25, new BABYLON.Vector3(0, 1.8, -2), scene);
    this.mainCamera.lowerRadiusLimit = 8;
    this.mainCamera.upperRadiusLimit = 55;
    this.mainCamera.attachControl(canvas, true);
    this.mainCamera.viewport = new BABYLON.Viewport(0, 0, 1, 1);

    // 2. Left Mirror Camera (Backwards-Left angle from cabin mirror wing)
    this.leftMirrorCamera = new BABYLON.FreeCamera('leftMirrorCamera', new BABYLON.Vector3(-1.65, 2.4, 3.2), scene);
    this.leftMirrorCamera.setTarget(new BABYLON.Vector3(-1.9, 0.8, -25.0)); // Adjusted to look along the truck side
    this.leftMirrorCamera.parent = truckNode;
    // Positioned inside left overlay on client canvas: 0.02 width-offset, 0.65 height-offset
    this.leftMirrorCamera.viewport = new BABYLON.Viewport(0.01, 0.63, 0.17, 0.33);

    // 3. Right Mirror Camera (Backwards-Right angle from cabin mirror wing)
    this.rightMirrorCamera = new BABYLON.FreeCamera('rightMirrorCamera', new BABYLON.Vector3(1.65, 2.4, 3.2), scene);
    this.rightMirrorCamera.setTarget(new BABYLON.Vector3(1.9, 0.8, -25.0)); // Adjusted to look along the truck side
    this.rightMirrorCamera.parent = truckNode;
    // Positioned inside right overlay on client canvas: 0.82 width-offset, 0.65 height-offset
    this.rightMirrorCamera.viewport = new BABYLON.Viewport(0.82, 0.63, 0.17, 0.33);

    // 4. Front Proximity Mirror Camera (convex look-down mirror on high cabin)
    this.frontMirrorCamera = new BABYLON.FreeCamera('frontMirrorCamera', new BABYLON.Vector3(0.5, 3.2, 4.5), scene);
    // Convex mirror has a wide field of view (approx 80 degrees)
    this.frontMirrorCamera.fov = 1.4;
    this.frontMirrorCamera.setTarget(new BABYLON.Vector3(0.0, 0.3, 5.8)); // Pointing sharp down/forward
    this.frontMirrorCamera.parent = truckNode;

    // Use RenderTargetTexture for perfect circular masking in WebGL
    this.frontMirrorRTT = new BABYLON.RenderTargetTexture('frontMirrorRTT', 512, scene);
    scene.customRenderTargets.push(this.frontMirrorRTT);
    this.frontMirrorRTT.activeCamera = this.frontMirrorCamera;

    // Create a circular Disc mesh parented to the main camera
    this.frontMirrorDisc = BABYLON.MeshBuilder.CreateDisc('frontMirrorDisc', { radius: 0.3, tessellation: 64 }, scene);
    this.frontMirrorDisc.parent = this.mainCamera;
    
    // Define renderListPredicate to dynamically select rendered meshes.
    // This is much faster and cleaner than populating renderList in onBeforeRender.
    this.frontMirrorRTT.renderListPredicate = (mesh) => {
      // Exclude the mirror disc itself to prevent visual feedback loop
      if (mesh === this.frontMirrorDisc) return false;
      // Exclude truck/trailer body parts so they don't obstruct the look-down view of the road/obstacle
      if (mesh.parent === truckNode) return false;
      if (mesh.parent && mesh.parent.name === 'trailerNode') return false;
      return true;
    };
    
    // Position it at the top-center of the screen
    // x: 0 (center), y: 0.85 (top), z: 3.0 (in front of the camera)
    this.frontMirrorDisc.position.set(0, 0.85, 3.0);
    this.frontMirrorDisc.rotation.y = Math.PI; // Face the camera
    this.frontMirrorDisc.renderingGroupId = 2; // Always render on top

    // Setup the reflective material
    const frontMirrorMat = new BABYLON.StandardMaterial('frontMirrorMat', scene);
    // Set RTT as emissiveTexture for bright, unlit, high-clarity rendering (essential when disableLighting is true)
    frontMirrorMat.emissiveTexture = this.frontMirrorRTT;
    frontMirrorMat.disableLighting = true; // High brightness, unlit
    frontMirrorMat.backFaceCulling = false; // Disable backface culling to prevent invisible rendering glitches
    this.frontMirrorDisc.material = frontMirrorMat;

    // Initially hidden (since we start in MENU state)
    this.frontMirrorDisc.setEnabled(false);

    scene.activeCameras = [this.mainCamera, this.leftMirrorCamera, this.rightMirrorCamera];
  }

  setFrontMirrorVisible(visible: boolean) {
    if (this.frontMirrorDisc) {
      this.frontMirrorDisc.setEnabled(visible);
    }
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
      this.mainCamera.position.set(-0.6, 2.3, 3.4); // Inside left seat at eye level (1.5m seat + 0.8m eye level)
    }
  }

  updateCabinLookAngle() {
    if (this.viewMode() === 'cabin' && this.mainCamera) {
      let targetLook = new BABYLON.Vector3(-0.6, 2.3, 30.0); // look front
      if (this.lookDirection() === 'left') {
        targetLook = new BABYLON.Vector3(-10.0, 2.1, 4.0); // look left window
      } else if (this.lookDirection() === 'right') {
        targetLook = new BABYLON.Vector3(10.0, 1.9, 2.0); // look right passenger door
      }
      this.mainCamera.setTarget(targetLook);
    }
  }

  // Updates all mirror cameras to look at their target points in world space relative to moving truckNode
  update(truckNode: BABYLON.TransformNode | null) {
    if (!truckNode) return;

    // 1. Update front mirror camera
    if (this.frontMirrorCamera) {
      const relativeTarget = new BABYLON.Vector3(0.0, 0.3, 5.8);
      const worldTarget = BABYLON.Vector3.TransformCoordinates(relativeTarget, truckNode.getWorldMatrix());
      this.frontMirrorCamera.setTarget(worldTarget);
      this.frontMirrorCamera.update();
    }

    // 2. Update left mirror camera
    if (this.leftMirrorCamera) {
      const leftTargetLocal = new BABYLON.Vector3(-1.9, 0.8, -25.0);
      const leftTargetWorld = BABYLON.Vector3.TransformCoordinates(leftTargetLocal, truckNode.getWorldMatrix());
      this.leftMirrorCamera.setTarget(leftTargetWorld);
      this.leftMirrorCamera.update();
    }

    // 3. Update right mirror camera
    if (this.rightMirrorCamera) {
      const rightTargetLocal = new BABYLON.Vector3(1.9, 0.8, -25.0);
      const rightTargetWorld = BABYLON.Vector3.TransformCoordinates(rightTargetLocal, truckNode.getWorldMatrix());
      this.rightMirrorCamera.setTarget(rightTargetWorld);
      this.rightMirrorCamera.update();
    }

    // 4. Align front mirror 3D disc to HTML overlay container perfectly
    if (this.frontMirrorDisc && this.mainCamera) {
      const frameEl = document.getElementById('frame-front-mirror');
      const canvasEl = this.mainCamera.getScene().getEngine().getRenderingCanvas();
      if (frameEl && canvasEl) {
        this.frontMirrorDisc.setEnabled(true);
        const frameRect = frameEl.getBoundingClientRect();
        const canvasRect = canvasEl.getBoundingClientRect();
        
        if (canvasRect.width > 0 && canvasRect.height > 0) {
          // Calculate center of frame in normalized screen coordinates (-0.5 to 0.5, origin at center)
          const centerX = (frameRect.left + frameRect.width / 2) - canvasRect.left;
          const centerY = canvasRect.bottom - (frameRect.top + frameRect.height / 2);
          
          const nx = (centerX / canvasRect.width) - 0.5;
          const ny = (centerY / canvasRect.height) - 0.5;
          
          // Normalized radius relative to canvas height
          // Subtract the 4px border (8px total width) for a perfect fit inside the bezel
          const innerWidth = frameRect.width - 8;
          const nr = (innerWidth / 2) / canvasRect.height;
          
          const aspect = canvasRect.width / canvasRect.height;
          const fov = this.mainCamera.fov;
          const d = 3.0; // Fixed projection distance in front of camera
          const frustumHeight = 2 * d * Math.tan(fov / 2);
          const frustumWidth = frustumHeight * aspect;
          
          const localX = nx * frustumWidth;
          const localY = ny * frustumHeight;
          const localRadius = nr * frustumHeight;
          
          this.frontMirrorDisc.position.set(localX, localY, d);
          
          // Base disc has radius 0.3, so scaling factor is localRadius / 0.3
          const targetScale = localRadius / 0.3;
          this.frontMirrorDisc.scaling.set(targetScale, targetScale, 1);
        }
      } else {
        this.frontMirrorDisc.setEnabled(false);
      }
    }
  }

  cleanup() {
    if (this.frontMirrorDisc) {
      this.frontMirrorDisc.dispose();
      this.frontMirrorDisc = null;
    }
    if (this.frontMirrorRTT) {
      this.frontMirrorRTT.dispose();
      this.frontMirrorRTT = null;
    }
    this.mainCamera = null;
    this.leftMirrorCamera = null;
    this.rightMirrorCamera = null;
    this.frontMirrorCamera = null;
  }
}
