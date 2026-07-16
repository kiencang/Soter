import { Injectable, inject } from '@angular/core';
import * as BABYLON from '@babylonjs/core';
import { ScenarioContext } from './simulator-scenarios.service';
import { SimulatorAudioService } from './simulator-audio.service';

@Injectable({ providedIn: 'root' })
export class SimulatorScenarioHeadSqueezeService {
  private audioService = inject(SimulatorAudioService);
  private hasCrashed = false;

  reset() {
    this.hasCrashed = false;
  }

  private getMotorcyclePathPosition(time: number): { x: number, z: number } {
    if (time < 1.2) {
      // Giai đoạn 1: Đi thẳng vượt qua hông xe tải ở làn phải
      const p = time / 1.2;
      const x = 6.05 + (5.0 - 6.05) * p;
      const z = -23.0 + 9.5 * p; // Vượt lên đến Z = -13.5 (vượt qua đầu xe tải lúc này đang dừng ở Z = -20.7)
      return { x, z };
    } else {
      // Giai đoạn 2: Rẽ trái mượt mà vào khoảng trống trước đầu xe tải
      const p = (time - 1.2) / 0.8;
      const smoothP = p * p * (3 - 2 * p); // smoothstep
      const x = 5.0 + (2.25 - 5.0) * smoothP;
      const z = -13.5 + (-15.0 - (-13.5)) * smoothP; // Đỗ gọn gàng tại Z = -15.0 ngay trước đầu xe tải
      return { x, z };
    }
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

    // Đèn đỏ chuyển sang xanh ở giây thứ 3.0
    if (setTrafficLightColor) {
      if (t < 3.0) {
        setTrafficLightColor('red');
      } else {
        setTrafficLightColor('green');
      }
    }

    // Stage 0: 0s to 2.0s -> Xe máy di chuyển từ làn phải lách nhanh vượt qua xe tải rồi rẽ vào trước đầu xe
    if (t < 2.0) {
      setStage(0);
      ctx.setMotoBlinkerActive(true, 'left');
      
      if (ctx.truckNode) {
        ctx.truckNode.position.set(2.25, 0, -20.7); // Xe tải lùi lại 1m so với trước (-19.7)
      }
      
      const pos = this.getMotorcyclePathPosition(t);
      
      // Tính góc xoay tiếp tuyến theo quỹ đạo thực tế bằng vi phân sai phân
      let dx = 0;
      let dz = 1;
      if (t < 1.95) {
        const nextPos = this.getMotorcyclePathPosition(t + 0.05);
        dx = nextPos.x - pos.x;
        dz = nextPos.z - pos.z;
      } else {
        const prevPos = this.getMotorcyclePathPosition(t - 0.05);
        dx = pos.x - prevPos.x;
        dz = pos.z - prevPos.z;
      }
      
      const bikeRotY = Math.atan2(dx, dz);
      
      // Nghiêng xe khi rẽ trái ở giai đoạn 2
      let bikeRotZ = 0;
      if (t >= 1.2) {
        const p = (t - 1.2) / 0.8;
        bikeRotZ = -Math.sin(p * Math.PI) * 0.2; // Nghiêng sang trái khi ôm cua trái vào làn
      } else {
        const p = t / 1.2;
        bikeRotZ = -Math.sin(p * Math.PI) * 0.05; // Nghiêng rất khẽ khi lách nhẹ
      }

      ctx.motorcycleX.set(pos.x);
      ctx.motorcycleZ.set(pos.z);

      if (ctx.motorcycleNode) {
        ctx.motorcycleNode.position.set(pos.x, 0, pos.z);
        ctx.motorcycleNode.rotation.y = bikeRotY;
        ctx.motorcycleNode.rotation.x = 0;
        ctx.motorcycleNode.rotation.z = bikeRotZ;
        ctx.motorcycleNode.scaling.set(1, 1, 1);
      }
    }
    // Stage 1: 2.0s to 4.2s -> Đèn đỏ đến 3.0s, chuyển xanh ở 3.0s, xe tải delay thêm 1.2s để phản ứng
    else if (t < 4.2) {
      setStage(1);
      ctx.setMotoBlinkerActive(false);

      if (ctx.truckNode) {
        ctx.truckNode.position.set(2.25, 0, -20.7);
      }

      ctx.motorcycleX.set(2.25);
      ctx.motorcycleZ.set(-15.0);

      if (ctx.motorcycleNode) {
        ctx.motorcycleNode.position.set(2.25, 0, -15.0);
        ctx.motorcycleNode.rotation.y = 0; // hướng thẳng về trước
        ctx.motorcycleNode.rotation.x = 0;
        ctx.motorcycleNode.rotation.z = 0;
        ctx.motorcycleNode.scaling.set(1, 1, 1);
      }
    }
    // Stage 2: 4.2s to 4.4s -> Xe tải xuất phát, tiến tới áp sát xe máy
    else if (t < 4.4) {
      setStage(2);
      ctx.setMotoBlinkerActive(false);

      const activeT = t - 4.2;
      const truckZ = -20.7 + activeT * 3.0; // Xe tải chuyển động tiến lên

      if (ctx.truckNode) {
        ctx.truckNode.position.set(2.25, 0, truckZ);
      }

      ctx.motorcycleX.set(2.25);
      ctx.motorcycleZ.set(-15.0);

      if (ctx.motorcycleNode) {
        ctx.motorcycleNode.position.set(2.25, 0, -15.0);
        ctx.motorcycleNode.rotation.y = 0;
        ctx.motorcycleNode.rotation.x = 0;
        ctx.motorcycleNode.rotation.z = 0;
        ctx.motorcycleNode.scaling.set(1, 1, 1);
      }
    }
    // Stage 3: 4.4s to 8.0s -> Va chạm ở 4.4s! Xe máy bị ủi ngã và cuốn vào gầm
    else if (t < 8.0) {
      if (!this.hasCrashed) {
        this.audioService.playCrashSound();
        this.hasCrashed = true;
      }
      setStage(3);

      const activeT = t - 4.2; // Thời gian xe tải đã di chuyển tính từ lúc bắt đầu ở 4.2s
      let truckZ = -20.7;
      
      if (activeT < 1.4) {
        // Di chuyển đều đến 5.6s (phản ứng của tài xế mất 1.2s sau khi đụng lúc 4.4s)
        truckZ = -20.7 + activeT * 3.0;
      } else if (activeT < 2.6) {
        // Phanh gấp từ 5.6s đến 6.8s (dừng trong 1.2s)
        const s = activeT - 1.4;
        const v0 = 3.0;
        const T = 1.2;
        const startBrakeZ = -20.7 + 1.4 * 3.0; // -16.5
        truckZ = startBrakeZ + v0 * (s - (s * s) / (2 * T));
      } else {
        // Đã dừng hoàn toàn ở 6.8s
        truckZ = -14.7;
      }

      if (ctx.truckNode) {
        ctx.truckNode.position.set(2.25, 0, truckZ);
      }

      const fallT = t - 4.4; // thời gian từ lúc va chạm (4.4s)
      const pushDuration = 0.6; // Mất 0.6s để ngã bẹp xuống mặt đường
      const pushFactor = Math.min(fallT / pushDuration, 1.0);
      
      let currentBikeZ = -15.0;
      
      if (pushFactor < 1.0) {
        // Đang ngã: Bị cản trước xe tải đẩy đi, giữ khoảng cách cứng 5.1m với tâm xe tải để KHÔNG bị chìm vào cản trước
        currentBikeZ = truckZ + 5.1;
      } else {
        // Đã ngã phẳng xuống đường ở t = 5.0. 
        // Lúc này truckZ = -20.7 + 0.8 * 3.0 = -18.3 -> BikeZ = -18.3 + 5.1 = -13.2
        // Cho xe máy trượt tự do thêm một tí rồi dừng lại do ma sát mặt đường
        const slideT = fallT - pushDuration; 
        const maxSlide = 0.3; // Trượt thêm 0.3m
        const slideProgress = Math.min(slideT / 0.4, 1.0); // Trượt trong 0.4s
        const easeSlide = slideProgress * (2 - slideProgress); // ease-out
        currentBikeZ = -13.2 + easeSlide * maxSlide; // Dừng hẳn ở -12.9
      }

      ctx.motorcycleX.set(2.25);
      ctx.motorcycleZ.set(currentBikeZ);

      if (ctx.motorcycleNode) {
        // Đặt sát mặt đường (Y = 0.015) để bẹp sát mặt đường khi ngã
        const yPos = 0.0 + pushFactor * 0.015;
        ctx.motorcycleNode.position.set(2.25, yPos, currentBikeZ);
        
        // Ngã đổ: Xe đổ hẳn sang phải (Z-rotation giảm dần đến -Math.PI / 2)
        ctx.motorcycleNode.rotation.z = pushFactor * (-Math.PI / 2);
        
        // Xoay chéo nhẹ góc xe khi ngã
        ctx.motorcycleNode.rotation.y = -0.5 * pushFactor;
        
        // Chúi đầu nhẹ khi đang ngã
        ctx.motorcycleNode.rotation.x = -0.4 * pushFactor * (1 - pushFactor);

        // Bị cuốn vào gầm và cán nát dưới gầm xe tải
        // Tính toán khoảng cách tương đối giữa tâm xe tải và xe máy để đồng bộ vị trí bánh xe
        const relativeZ = currentBikeZ - truckZ; 
        
        let crushFactor = 1.0;
        
        if (relativeZ < 4.2) {
          // Bánh 1 cán qua (khoảng offset 4.2m tính từ tâm xe tải). Xe máy bẹp toàn bộ
          const crush1Progress = Math.max(0, Math.min(1, (4.2 - relativeZ) / 0.6)); // từ 4.2m đến 3.6m
          crushFactor = 1.0 - 0.95 * crush1Progress; 
        }
        
        ctx.motorcycleNode.scaling.set(crushFactor, 1.2, 1.2);
      }

      ctx.checkBlindSpotState();
    }
    // Kết thúc kịch bản
    else {
      setPlaying(false);
    }
  }
}
