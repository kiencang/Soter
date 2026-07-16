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
    // Stage 1: 2.0s to 3.0s -> Đèn đỏ, xe máy dừng trước đầu xe tải chờ đèn, cả hai dừng yên vị trí
    else if (t < 3.0) {
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
    // Stage 2: 3.0s to 3.2s -> Đèn chuyển xanh, xe tải xuất phát, xe máy đứng yên do không chú ý
    else if (t < 3.2) {
      setStage(2);
      ctx.setMotoBlinkerActive(false);

      const activeT = t - 3.0;
      const truckZ = -20.7 + activeT * 3.5; // Xe tải chuyển động tiến lên

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
    // Stage 3: 3.2s to 6.5s -> Va chạm! Xe máy bị ủi ngã và cuốn vào gầm khi xe tải di chuyển quán tính rồi phanh gấp
    else if (t < 6.5) {
      if (!this.hasCrashed) {
        this.audioService.playCrashSound();
        this.hasCrashed = true;
      }
      setStage(3);

      const activeT = t - 3.0;
      let truckZ = -20.7;
      
      if (activeT < 0.7) {
        // Giai đoạn đầu di chuyển trước khi tài xế kịp phản ứng phanh (0.2s đến 0.7s)
        truckZ = -20.7 + activeT * 3.5;
      } else if (activeT < 1.7) {
        // Tài xế phanh gấp dừng hẳn trong vòng 1 giây
        const s = activeT - 0.7;
        const v0 = 3.5;
        const T = 1.0;
        const startBrakeZ = -20.7 + 0.7 * 3.5; // -18.25
        truckZ = startBrakeZ + v0 * (s - (s * s) / (2 * T));
      } else {
        // Đã dừng hoàn toàn
        truckZ = -16.5;
      }

      if (ctx.truckNode) {
        ctx.truckNode.position.set(2.25, 0, truckZ);
      }

      const fallT = t - 3.2; // thời gian từ lúc va chạm
      const pushDuration = 0.5;
      const pushFactor = Math.min(fallT / pushDuration, 1.0);
      
      // Xe máy bị húc xô đổ dồn về trước 1.5m (văng từ -15.0 lên -13.5)
      const currentBikeZ = -15.0 + pushFactor * 1.5;

      ctx.motorcycleX.set(2.25);
      ctx.motorcycleZ.set(currentBikeZ);

      if (ctx.motorcycleNode) {
        // Đặt sát mặt đường (Y = 0.015) để bẹp sát mặt đường khi ngã
        ctx.motorcycleNode.position.set(2.25, 0.015, currentBikeZ);
        
        // Ngã đổ: Xe đổ hẳn sang phải (Z-rotation giảm dần đến -Math.PI / 2)
        ctx.motorcycleNode.rotation.z = pushFactor * (-Math.PI / 2);
        
        // Xoay chéo nhẹ góc xe khi ngã
        ctx.motorcycleNode.rotation.y = -0.5 * pushFactor;
        
        // Chúi đầu nhẹ khi đang ngã (1 - pushFactor kéo x-rotation về 0 khi ngã hẳn xuống đường để nằm phẳng)
        ctx.motorcycleNode.rotation.x = -0.4 * pushFactor * (1 - pushFactor);

        // Bị cuốn vào gầm và cán nát dưới gầm xe tải (sau khi đã ngã phẳng ở t >= 3.7, tức fallT > 0.5)
        const crushStartT = 0.5;
        if (fallT > crushStartT) {
          const crushProgress = (fallT - crushStartT) * 2.0; // Tăng tốc độ cán dẹp dứt khoát
          const crushFactor = Math.max(1.0 - crushProgress, 0.05);
          ctx.motorcycleNode.scaling.set(crushFactor, 1.2, 1.2);
        } else {
          ctx.motorcycleNode.scaling.set(1, 1, 1);
        }
      }

      ctx.checkBlindSpotState();
    }
    // Kết thúc kịch bản
    else {
      setPlaying(false);
    }
  }
}
