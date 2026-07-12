import { Injectable } from '@angular/core';
import * as BABYLON from '@babylonjs/core';
import { ScenarioContext } from './simulator-scenarios.service';

@Injectable({ providedIn: 'root' })
export class SimulatorScenarioRightTurnService {
  animate(
    t: number,
    ctx: ScenarioContext,
    setStage: (stage: number) => void,
    setText: (text: string) => void,
    setPlaying: (playing: boolean) => void
  ) {
    // Increase the overall speed of the scenario by 35%
    t = t * 1.35;

    const startZ = -34.1;
    const endStraightZ = -12.1;
    const straightTime = 4.0;
    const speed = (endStraightZ - startZ) / straightTime; // 5.5

    // Stage 0: 0s to 4.0s -> Moving straight forward together, signaling
    if (t < 4.0) {
      setStage(0);
      setText("Hành trình: Xe container xi-nhan rẽ phải chuẩn bị rẽ ngã tư. Xe máy đang đi thẳng ở làn số 1 (bên phải) - hoàn toàn lọt thỏm trong vùng mù của gương!");
      ctx.setBlinkerActive(true, 'right');

      const progressZ = startZ + t * speed;

      if (ctx.truckNode) {
        ctx.truckNode.position.set(2.25, 0, progressZ);
        ctx.truckNode.rotation.y = 0;
        ctx.setTrailerRearPos(new BABYLON.Vector3(2.25, 0.6, progressZ - 11.25));
      }

      // Motorcycle is in Lane 1 (X = 6.05), completely in the blind spot
      ctx.motorcycleX.set(6.05); 
      ctx.motorcycleZ.set(progressZ + 1.0); 
      ctx.syncMotorcyclePosition();

      if (ctx.motorcycleNode) {
        ctx.motorcycleNode.rotation.y = 0;
        ctx.motorcycleNode.rotation.x = 0;
        ctx.motorcycleNode.rotation.z = 0;
        ctx.motorcycleNode.scaling.set(1, 1, 1);
        ctx.motorcycleNode.position.y = 0; // reset y
      }
    }
    // Stage 1: 4.0s to 5.3s -> Truck turns into Lane 2, motorcycle goes straight, collision!
    else if (t < 5.3) {
      setStage(1);
      setText("Tình huống rẽ: Xe tải bẻ lái rẽ phải vào làn số 2. Xe máy ở làn số 1 vẫn tiếp tục đi thẳng. Quỹ đạo của rơ-moóc sẽ cắt ngang qua làn số 1.");
      
      const activeT = t - 4.0; // 0 to 1.3
      const turnT = activeT / 3.3; // Proportion of the 90-degree turn
      const angle = turnT * (Math.PI / 2);
      
      // Radius to end up in Lane 2 (Z = -2.25) from X = 2.25, Z = -12.1
      const R = 9.85; 
      const truckX = (2.25 + R) - R * Math.cos(angle);
      const truckZ = endStraightZ + R * Math.sin(angle);

      if (ctx.truckNode) {
        ctx.truckNode.rotation.y = angle;
        ctx.truckNode.position.set(truckX, 0, truckZ);
      }

      // Motorcycle continues STRAIGHT at original speed
      const bikeZ = endStraightZ + 1.0 + activeT * speed;
      
      ctx.motorcycleX.set(6.05);
      ctx.motorcycleZ.set(bikeZ);
      ctx.syncMotorcyclePosition();

      if (ctx.motorcycleNode) {
        ctx.motorcycleNode.rotation.y = 0;
        ctx.motorcycleNode.rotation.x = 0;
        ctx.motorcycleNode.rotation.z = 0;
        ctx.motorcycleNode.scaling.set(1, 1, 1);
        ctx.motorcycleNode.position.y = 0;
      }
    }
    // Stage 2: 5.3s to 9.8s -> Collision and roll over
    else if (t < 9.8) {
      setStage(2);
      setText("VA CHẠM: Điểm mù và góc khuất off-tracking của rơ-moóc đã quệt vào xe máy. Xe máy bị đẩy ngã, không thể thoát ra và bị cuốn vào gầm.");
      
      const activeT = t - 4.0; // time since truck started turning
      const fallT = t - 5.3; // time since collision
      
      const turnT = activeT / 3.3; 
      let angle = turnT * (Math.PI / 2);
      const R = 9.85; 
      
      let currentTruckX, currentTruckZ;

      if (angle > Math.PI / 2) {
        angle = Math.PI / 2;
        const extraT = activeT - 3.3; 
        const straightSpeed = (R * Math.PI / 2) / 3.3; 
        currentTruckX = (2.25 + R) + extraT * straightSpeed;
        currentTruckZ = endStraightZ + R;
      } else {
        currentTruckX = (2.25 + R) - R * Math.cos(angle);
        currentTruckZ = endStraightZ + R * Math.sin(angle);
      }

      if (ctx.truckNode) {
        ctx.truckNode.rotation.y = angle;
        ctx.truckNode.position.set(currentTruckX, 0, currentTruckZ);
      }

      // Bike position at collision (t=5.3)
      const collisionActiveT = 5.3 - 4.0; // 1.3
      const collisionBikeZ = endStraightZ + 1.0 + collisionActiveT * speed; 
      const collisionBikeX = 6.05;
      
      const pushFactor = Math.min(fallT / 0.5, 1.0);
      
      const currentBikeX = collisionBikeX + pushFactor * 0.8; 
      const currentBikeZ = collisionBikeZ + pushFactor * 0.5; 
      
      ctx.motorcycleX.set(currentBikeX);
      ctx.motorcycleZ.set(currentBikeZ);
      ctx.syncMotorcyclePosition();

      if (ctx.motorcycleNode) {
        ctx.motorcycleNode.position.set(currentBikeX, 0.015, currentBikeZ);
        
        // Ngã đổ: Bị tạt từ bên trái nên ngã sang phải
        ctx.motorcycleNode.rotation.z = pushFactor * (-Math.PI / 2.2); 
        ctx.motorcycleNode.rotation.x = pushFactor * 0.2; 
        ctx.motorcycleNode.rotation.y = pushFactor * 0.5; 
        
        const crushStartT = 0.5; 
        if (fallT > crushStartT) {
           const crushProgress = (fallT - crushStartT) * 1.5; 
           const crushFactor = Math.max(1.0 - crushProgress, 0.05);
           ctx.motorcycleNode.scaling.set(crushFactor, 1.2, 1.2); 
        } else {
           ctx.motorcycleNode.scaling.set(1, 1, 1);
        }
      }
      
      ctx.checkBlindSpotState();
    }
    // Stage 3: End of Scenario
    else {
      setPlaying(false);
      ctx.setBlinkerActive(false);
      setText("Bài học sống sót: Hiện tượng 'cắt góc' của rơ-moóc khiến nó quét qua các làn bên trong khi rẽ. TUYỆT ĐỐI không đi song song với xe tải ở các khúc cua hoặc ngã tư.");
    }
  }
}
