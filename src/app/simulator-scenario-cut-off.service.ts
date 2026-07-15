import { Injectable, inject } from '@angular/core';
import * as BABYLON from '@babylonjs/core';
import { ScenarioContext } from './simulator-scenarios.service';
import { SimulatorAudioService } from './simulator-audio.service';

@Injectable({ providedIn: 'root' })
export class SimulatorScenarioCutOffService {
  private audioService = inject(SimulatorAudioService);
  private hasCrashed = false;

  reset() {
    this.hasCrashed = false;
  }

  animate(
    t: number,
    ctx: ScenarioContext,
    setStage: (stage: number) => void,
    setPlaying: (playing: boolean) => void,
    setTrafficLightColor?: (color: 'red' | 'yellow' | 'green') => void
  ) {
    if (ctx.truckNode) {
      ctx.truckNode.rotation.y = 0;
    }

    // Đèn giao thông chuyển từ đỏ sang xanh ở giây thứ 2.1 (0.4 giây trước khi di chuyển ở 2.5s)
    if (setTrafficLightColor) {
      if (t < 2.1) {
        setTrafficLightColor('red');
      } else {
        setTrafficLightColor('green');
      }
    }

    // Stage 0: 0s to 2.5s -> Dừng chờ đèn đỏ
    if (t < 2.5) {
      setStage(0);
      ctx.setMotoBlinkerActive(true, 'left');
      
      if (ctx.truckNode) {
        ctx.truckNode.position.set(2.25, 0, -19.7);
      }
      
      const xPos = 6.05;
      const zPos = -18.0;
      
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
    // Stage 1: 2.5s to 4.5s -> Đèn xanh, cả hai cùng khởi hành, xe máy di chuyển nhanh hơn và tạt đầu quyết liệt hơn
    else if (t < 4.5) {
      setStage(1);
      ctx.setMotoBlinkerActive(true, 'left');
      
      const activeT = t - 2.5; 

      // Xe tải tăng tốc nhanh hơn (vận tốc tăng từ 3.125m/s lên 4.5m/s)
      const truckZ = -19.7 + activeT * 4.5; 
      if (ctx.truckNode) {
        ctx.truckNode.position.set(2.25, 0, truckZ);
      }

      let bikeX = 6.05;
      let bikeZ = -18.0;
      let bikeRotY = 0;

      // Xe máy di chuyển nhanh gấp rưỡi giai đoạn đi thẳng ban đầu (rút ngắn từ 1.5s xuống 1.0s)
      if (activeT < 1.0) {
        const ratio = activeT / 1.0;
        bikeX = 6.05;
        bikeZ = -18.0 + ratio * 10.35; 
        bikeRotY = 0;
      } else {
        // Giai đoạn rẽ tạt đầu cũng được tăng tốc (rút ngắn từ 1.38s xuống 1.0s)
        const ratio = Math.min((activeT - 1.0) / 1.0, 1.0); 
        
        // Cải thiện đường đi mượt mà bằng Cubic Bezier (Tránh đổi hướng đột ngột gây cứng nhắc)
        const t2 = ratio;
        const p0_x = 6.05;
        const p1_x = 6.05; // Giữ hướng thẳng lúc bắt đầu rẽ
        const p2_x = 3.55; // Điều hướng cong mềm mại về phía cabin phải
        const p3_x = 2.75; // Điểm va chạm cuối cùng

        const p0_z = -7.65;
        const p1_z = -6.65; // Đẩy lên trước một chút để tạo độ uốn cong tự nhiên
        const p2_z = -6.35;
        const p3_z = -5.55;

        bikeX = Math.pow(1 - t2, 3) * p0_x + 3 * Math.pow(1 - t2, 2) * t2 * p1_x + 3 * (1 - t2) * t2 * t2 * p2_x + Math.pow(t2, 3) * p3_x;
        bikeZ = Math.pow(1 - t2, 3) * p0_z + 3 * Math.pow(1 - t2, 2) * t2 * p1_z + 3 * (1 - t2) * t2 * t2 * p2_z + Math.pow(t2, 3) * p3_z;
        
        // Tính góc xoay mượt mà theo tiếp tuyến của đường Bezier
        const dx = 3 * Math.pow(1 - t2, 2) * (p1_x - p0_x) + 6 * (1 - t2) * t2 * (p2_x - p1_x) + 3 * t2 * t2 * (p3_x - p2_x);
        const dz = 3 * Math.pow(1 - t2, 2) * (p1_z - p0_z) + 6 * (1 - t2) * t2 * (p2_z - p1_z) + 3 * t2 * t2 * (p3_z - p2_z);
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
    // Stage 2: 4.5s to 7.5s -> Va chạm do rơi vào vùng mù (tổng thời gian kịch bản nhanh gọn, kịch tính hơn)
    else if (t < 7.5) {
      if (!this.hasCrashed) {
        this.audioService.playCrashSound();
        this.hasCrashed = true;
      }
      setStage(2);
      ctx.setMotoBlinkerActive(false);
      
      const fallT = t - 4.5; // thời gian ngã và bị đè nát

      // Xe tải di chuyển quán tính và phanh gấp nhanh nhạy hơn
      let truckZ = -10.7; // Vị trí lúc va chạm ở t = 4.5
      if (t < 5.3) {
        // Duy trì tốc độ ổn định giây đầu tiên va chạm
        const activeT = t - 2.5;
        truckZ = -19.7 + activeT * 4.5;
      } else if (t < 6.3) {
        // Phanh gấp dừng hẳn trong vòng 1 giây
        const s = t - 5.3;
        const T = 1.0;
        const v0 = 4.5;
        truckZ = -7.1 + v0 * (s - (s * s) / (2 * T));
      } else {
        // Đã dừng hoàn toàn
        truckZ = -4.85;
      }

      if (ctx.truckNode) {
        ctx.truckNode.position.set(2.25, 0, truckZ);
      }

      // Vị trí lúc va chạm (đồng bộ khớp 100% với t2_c = 1.0 kết thúc đường cong rẽ)
      const t2_c = 1.0;
      const p0_x = 6.05;
      const p1_x = 6.05;
      const p2_x = 3.55;
      const p3_x = 2.75;

      const p0_z = -7.65;
      const p1_z = -6.65;
      const p2_z = -6.35;
      const p3_z = -5.55;

      const collisionBikeX = Math.pow(1 - t2_c, 3) * p0_x + 3 * Math.pow(1 - t2_c, 2) * t2_c * p1_x + 3 * (1 - t2_c) * t2_c * t2_c * p2_x + Math.pow(t2_c, 3) * p3_x;
      const collisionBikeZ = Math.pow(1 - t2_c, 3) * p0_z + 3 * Math.pow(1 - t2_c, 2) * t2_c * p1_z + 3 * (1 - t2_c) * t2_c * t2_c * p2_z + Math.pow(t2_c, 3) * p3_z;
      
      // Xe máy bị ủi tới trước một chút rồi nằm im
      const pushFactor = Math.min(fallT / 0.4, 1.0);
      let currentBikeZ = collisionBikeZ;

      if (fallT < 0.4) {
        // Bị đầu xe tải đẩy đi
        currentBikeZ = Math.max(collisionBikeZ, truckZ + 4.15 + 0.3); 
      } else {
        // Nằm yên tại vị trí kết thúc đẩy dồn toa
        const fallEndTruckZ = -19.7 + ((4.5 + 0.4) - 2.5) * 4.5; 
        currentBikeZ = fallEndTruckZ + 4.15 + 0.3;
      }
      
      ctx.motorcycleX.set(collisionBikeX);
      ctx.motorcycleZ.set(currentBikeZ);

      if (ctx.motorcycleNode) {
        ctx.motorcycleNode.position.set(collisionBikeX, 0.015, currentBikeZ); 
        
        // Tính góc xoay mượt mà theo tiếp tuyến của đường Bezier tại thời điểm va chạm
        const dx_c = 3 * Math.pow(1 - t2_c, 2) * (p1_x - p0_x) + 6 * (1 - t2_c) * t2_c * (p2_x - p1_x) + 3 * t2_c * t2_c * (p3_x - p2_x);
        const dz_c = 3 * Math.pow(1 - t2_c, 2) * (p1_z - p0_z) + 6 * (1 - t2_c) * t2_c * (p2_z - p1_z) + 3 * t2_c * t2_c * (p3_z - p2_z);
        const collisionBikeRotY = Math.atan2(dx_c, dz_c);

        // Ngã đổ: Bị húc từ sau nên văng tới trước và ngã sang phải nằm phẳng trên đường
        ctx.motorcycleNode.rotation.z = pushFactor * (-Math.PI / 2); 
        ctx.motorcycleNode.rotation.x = -1.2 * pushFactor * (1 - pushFactor); 
        ctx.motorcycleNode.rotation.y = (1 - pushFactor) * collisionBikeRotY + pushFactor * (-1.2); 
        
        // Cán nát sau khi ngã (tăng tốc độ đè dẹp từ 1.5 lên 2.0)
        const crushStartT = 0.4; 
        if (fallT > crushStartT) {
          const crushProgress = (fallT - crushStartT) * 2.0; 
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
    }
  }
}
