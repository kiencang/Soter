import { Injectable } from '@angular/core';
import * as BABYLON from '@babylonjs/core';
import { ScenarioContext } from './simulator-scenarios.service';

@Injectable({ providedIn: 'root' })
export class SimulatorScenarioCutOffService {
  animate(
    t: number,
    ctx: ScenarioContext,
    setStage: (stage: number) => void,
    setText: (text: string) => void,
    setPlaying: (playing: boolean) => void
  ) {
    if (ctx.truckNode) {
      ctx.truckNode.rotation.y = 0;
    }

    // Stage 0: 0s to 1.5s -> Dừng chờ đèn đỏ
    if (t < 1.5) {
      setStage(0);
      setText("Bài học: Tuyệt đối không bao giờ tạt đầu đột ngột ngay sát mũi xe tải lớn hoặc xe container.");
      
      if (ctx.truckNode) {
        ctx.truckNode.position.set(2.25, 0, -19.7);
      }
      
      const xPos = 6.05;
      const zPos = -16.3;
      
      ctx.motorcycleX.set(xPos);
      ctx.motorcycleZ.set(zPos);

      if (ctx.motorcycleNode) {
        ctx.motorcycleNode.position.set(xPos, 0, zPos);
        ctx.motorcycleNode.rotation.y = 0; // facing forward
        ctx.motorcycleNode.rotation.x = 0; // standing upright
        ctx.motorcycleNode.rotation.z = 0;
        ctx.motorcycleNode.scaling.set(1, 1, 1);
      }
    }
    // Stage 1: 1.5s to 4.38s -> Đèn xanh, cả hai cùng khởi hành, xe máy tạt đầu
    else if (t < 4.38) {
      setStage(1);
      setText("Bài học: Tuyệt đối không bao giờ tạt đầu đột ngột ngay sát mũi xe tải lớn hoặc xe container.");
      ctx.setMotoBlinkerActive(true, 'left');
      
      const activeT = t - 1.5; 

      // Truck accelerates slowly
      const truckZ = -19.7 + activeT * 3.125; 
      if (ctx.truckNode) {
        ctx.truckNode.position.set(2.25, 0, truckZ);
      }

      let bikeX = 6.05;
      let bikeZ = -16.3;
      let bikeRotY = 0;

      if (activeT < 1.5) {
        const ratio = activeT / 1.5;
        bikeX = 6.05;
        bikeZ = -16.3 + ratio * 8.65; 
        bikeRotY = 0;
      } else {
        const ratio = Math.min((activeT - 1.5) / 1.4, 1.0); 
        
        const smoothRatio = ratio * ratio * (3 - 2 * ratio);
        bikeX = 6.05 - smoothRatio * 3.3; 
        bikeZ = -7.65 + ratio * 2.1; 
        
        const dx = -3.3 * (6 * ratio * (1 - ratio));
        const dz = 2.1;
        bikeRotY = Math.atan2(dx, dz); 
      }

      ctx.motorcycleX.set(bikeX);
      ctx.motorcycleZ.set(bikeZ);

      if (ctx.motorcycleNode) {
        ctx.motorcycleNode.position.set(bikeX, 0.0, bikeZ);
        ctx.motorcycleNode.rotation.y = bikeRotY;
        ctx.motorcycleNode.rotation.x = 0;
        ctx.motorcycleNode.rotation.z = 0;
        ctx.motorcycleNode.scaling.set(1, 1, 1);
      }
    }
    // Stage 2: 4.38s to 8.0s -> Va chạm do rơi vào vùng mù
    else if (t < 8.0) {
      setStage(2);
      setText("Bài học: Tuyệt đối không bao giờ tạt đầu đột ngột ngay sát mũi xe tải lớn hoặc xe container.");
      ctx.setMotoBlinkerActive(false);
      
      const fallT = t - 4.38; // for bike falling and crushing

      // Truck moves forward and brakes smoothly
      let truckZ = -10.7; // Position at t = 4.38
      if (t < 5.5) {
        // Constant speed
        const activeT = t - 1.5;
        truckZ = -19.7 + activeT * 3.125;
      } else if (t < 6.8) {
        // Smooth braking
        const s = t - 5.5;
        const T = 1.3;
        const v0 = 3.125;
        truckZ = -7.2 + v0 * (s - (s * s) / (2 * T));
      } else {
        // Fully stopped
        truckZ = -5.16875;
      }

      if (ctx.truckNode) {
        ctx.truckNode.position.set(2.25, 0, truckZ);
      }

      // Vị trí lúc va chạm
      const ratioC = (4.38 - 1.5 - 1.5) / 1.4; // = 1.38/1.4 = 0.9857
      const smoothRatioC = ratioC * ratioC * (3 - 2 * ratioC);
      const collisionBikeX = 6.05 - smoothRatioC * 3.3; // ~2.75
      const collisionBikeZ = -7.65 + ratioC * 2.1; // ~ -5.58
      
      // Xe máy bị ủi tới trước một chút rồi nằm im
      const pushFactor = Math.min(fallT / 0.5, 1.0);
      let currentBikeZ = collisionBikeZ;

      if (fallT < 0.5) {
        // Bị đầu xe tải đẩy đi
        currentBikeZ = Math.max(collisionBikeZ, truckZ + 4.15 + 0.3); 
      } else {
        // Nằm yên
        const fallEndTruckZ = -19.7 + ((4.38 + 0.5) - 1.5) * 3.125; 
        currentBikeZ = fallEndTruckZ + 4.15 + 0.3;
      }
      
      ctx.motorcycleX.set(collisionBikeX);
      ctx.motorcycleZ.set(currentBikeZ);

      if (ctx.motorcycleNode) {
        ctx.motorcycleNode.position.set(collisionBikeX, 0.015, currentBikeZ); 
        
        // Ngã đổ: Bị húc từ sau nên văng tới trước và ngã sang phải
        ctx.motorcycleNode.rotation.z = pushFactor * (-Math.PI / 2.2); // ngã sang phải
        ctx.motorcycleNode.rotation.x = pushFactor * 0.2; // chúi tới
        ctx.motorcycleNode.rotation.y = pushFactor * 0.5; // xoay ngang 
        
        // Cán nát sau khi ngã
        const crushStartT = 0.5; 
        if (fallT > crushStartT) {
          const crushProgress = (fallT - crushStartT) * 1.5; 
          const crushFactor = Math.max(1.0 - crushProgress, 0.05);
          // Ép dẹp theo trục X cục bộ
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
      setText("Bài học: Tuyệt đối không bao giờ tạt đầu đột ngột ngay sát mũi xe tải lớn hoặc xe container.");
    }
  }
}
