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

    // Đèn giao thông chuyển từ đỏ sang xanh ở giây thứ 4.1 (0.4 giây trước khi di chuyển ở 4.5s)
    if (setTrafficLightColor) {
      if (t < 4.1) {
        setTrafficLightColor('red');
      } else {
        setTrafficLightColor('green');
      }
    }

    // Mô phỏng phương tiện di chuyển trên làn hướng Đông đi sang hướng Tây (tiền cảnh)
    if (ctx.oncomingMotorcycleNode) {
      ctx.oncomingMotorcycleNode.setEnabled(true);
      const bikeX = 50.0 - t * 20.0;
      ctx.oncomingMotorcycleNode.position.set(bikeX, 0.015, 6.75); // Làn 1 (bên phải)
      ctx.oncomingMotorcycleNode.rotation.set(0, -Math.PI / 2, 0); // Quay về hướng Tây
      ctx.oncomingMotorcycleNode.scaling.set(1, 1, 1);
    }

    if (ctx.carNode) {
      ctx.carNode.setEnabled(true);
      const carX = 65.0 - t * 22.0;
      ctx.carNode.position.set(carX, 0, 2.25); // Làn 2 (bên trái)
      ctx.carNode.rotation.set(0, -Math.PI / 2, 0); // Quay về hướng Tây
      
      const carLightL = ctx.carNode.getChildMeshes().find(m => m.name === 'carLightL');
      const carLightR = ctx.carNode.getChildMeshes().find(m => m.name === 'carLightR');
      const carTailL = ctx.carNode.getChildMeshes().find(m => m.name === 'carTailL');
      const carTailR = ctx.carNode.getChildMeshes().find(m => m.name === 'carTailR');
      if (carLightL && carLightL.material) (carLightL.material as BABYLON.StandardMaterial).emissiveColor = new BABYLON.Color3(1.0, 1.0, 0.8);
      if (carLightR && carLightR.material) (carLightR.material as BABYLON.StandardMaterial).emissiveColor = new BABYLON.Color3(1.0, 1.0, 0.8);
      if (carTailL && carTailL.material) (carTailL.material as BABYLON.StandardMaterial).emissiveColor = new BABYLON.Color3(0.9, 0.1, 0.1);
      if (carTailR && carTailR.material) (carTailR.material as BABYLON.StandardMaterial).emissiveColor = new BABYLON.Color3(0.9, 0.1, 0.1);
      
      if (carLightL) carLightL.setEnabled(true);
      if (carLightR) carLightR.setEnabled(true);
      if (carTailL) carTailL.setEnabled(true);
      if (carTailR) carTailR.setEnabled(true);
    }

    // Stage 0: 0s to 4.5s -> Dừng chờ đèn đỏ
    if (t < 4.5) {
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
    // Stage 1: 4.5s to 6.5s -> Đèn xanh, cả hai cùng khởi hành, xe máy di chuyển nhanh hơn và tạt đầu quyết liệt hơn
    else if (t < 6.5) {
      setStage(1);
      ctx.setMotoBlinkerActive(true, 'left');
      
      const activeT = t - 4.5; 

      // Xe tải tăng tốc nhanh hơn (vận tốc tăng từ 3.125m/s lên 4.5m/s)
      const truckZ = -19.7 + activeT * 4.5; 
      if (ctx.truckNode) {
        ctx.truckNode.position.set(2.25, 0, truckZ);
      }

      let bikeX = 6.05;
      let bikeZ = -18.0;
      let bikeRotY = 0;
      let bikeRotZ = 0;

      // Xe máy di chuyển nhanh gấp rưỡi giai đoạn đi thẳng ban đầu (rút ngắn từ 1.5s xuống 1.0s)
      if (activeT < 1.0) {
        const ratio = activeT / 1.0;
        bikeX = 6.05;
        bikeZ = -18.0 + ratio * 10.35; 
        bikeRotY = 0;
        bikeRotZ = 0;
      } else {
        // Giai đoạn ôm cua rẽ trái tạt đầu được làm mượt mà tự nhiên bằng quỹ đạo vòng cung
        const u = Math.min((activeT - 1.0) / 1.0, 1.0); 
        
        const startX = 6.05;
        const endX = 2.75;
        const startZ = -7.65;
        const endZ = -5.55;

        // Mô phỏng đường rẽ trái dạng vòng cung mượt mà tự nhiên (không giật cục)
        bikeX = startX + (endX - startX) * u * u;
        bikeZ = startZ + (endZ - startZ) * u;
        
        // Tính góc xoay mượt mà theo tiếp tuyến của quỹ đạo vòng cung
        const dx = 2 * (endX - startX) * u;
        const dz = endZ - startZ;
        bikeRotY = Math.atan2(dx, dz); 

        // Độ nghiêng (banking) tự nhiên khi ôm cua rẽ trái (nghiêng nhẹ về bên trái)
        bikeRotZ = Math.sin(u * Math.PI) * 0.25;
      }

      ctx.motorcycleX.set(bikeX);
      ctx.motorcycleZ.set(bikeZ);

      if (ctx.motorcycleNode) {
        ctx.motorcycleNode.position.set(bikeX, 0.0, bikeZ);
        ctx.motorcycleNode.rotation.y = bikeRotY;
        ctx.motorcycleNode.rotation.x = 0;
        ctx.motorcycleNode.rotation.z = bikeRotZ;
        ctx.motorcycleNode.scaling.set(1, 1, 1);
      }
    }
    // Stage 2: 6.5s to 9.5s -> Va chạm do rơi vào vùng mù (tổng thời gian kịch bản nhanh gọn, kịch tính hơn)
    else if (t < 9.5) {
      if (!this.hasCrashed) {
        this.audioService.playCrashSound();
        this.hasCrashed = true;
      }
      setStage(2);
      ctx.setMotoBlinkerActive(false);
      
      const fallT = t - 6.5; // thời gian ngã và bị đè nát

      // Xe tải di chuyển quán tính và phanh gấp nhanh nhạy hơn
      let truckZ = -10.7; // Vị trí lúc va chạm ở t = 4.5
      if (t < 7.3) {
        // Duy trì tốc độ ổn định giây đầu tiên va chạm
        const activeT = t - 4.5;
        truckZ = -19.7 + activeT * 4.5;
      } else if (t < 8.3) {
        // Phanh gấp dừng hẳn trong vòng 1 giây
        const s = t - 7.3;
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

      // Vị trí lúc va chạm (đồng bộ khớp 100% với u = 1.0 kết thúc đường cong rẽ)
      const collisionBikeX = 2.75;
      const collisionBikeZ = -5.55;
      
      // Xe máy bị ủi tới trước một chút rồi nằm im
      const pushFactor = Math.min(fallT / 0.4, 1.0);
      let currentBikeZ = collisionBikeZ;

      if (fallT < 0.4) {
        // Bị đầu xe tải đẩy đi
        currentBikeZ = Math.max(collisionBikeZ, truckZ + 4.15 + 0.3); 
      } else {
        // Nằm yên tại vị trí kết thúc đẩy dồn toa
        const fallEndTruckZ = -19.7 + ((6.5 + 0.4) - 4.5) * 4.5; 
        currentBikeZ = fallEndTruckZ + 4.15 + 0.3;
      }
      
      ctx.motorcycleX.set(collisionBikeX);
      ctx.motorcycleZ.set(currentBikeZ);

      if (ctx.motorcycleNode) {
        ctx.motorcycleNode.position.set(collisionBikeX, 0.015, currentBikeZ); 
        
        // Tính góc xoay mượt mà theo tiếp tuyến của đường cong tại thời điểm va chạm (u = 1.0)
        const dx_c = 2 * (2.75 - 6.05) * 1.0;
        const dz_c = -5.55 - (-7.65);
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
