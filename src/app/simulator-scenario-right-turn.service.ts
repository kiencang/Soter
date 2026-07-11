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
    // Stage 0: 0s to 3.2s -> Moving straight forward together, signaling
    if (t < 3.2) {
      setStage(0);
      setText("Hành trình: Xe container xi-nhan rẽ phải chuẩn bị rẽ ngã tư. Xe máy đang bám sát song song phía bên phải rơ-moóc rọ - đây là vùng tử thần khuất 100% gương lái!");
      ctx.setBlinkerActive(true, 'right');

      const progressZ = -19.14 + t * 2.2;
      if (ctx.truckNode) {
        ctx.truckNode.position.set(2.25, 0, progressZ);
        ctx.truckNode.rotation.y = 0;
      }
      ctx.motorcycleX.set(6.05);
      ctx.motorcycleZ.set(progressZ - 2.5);
      ctx.syncMotorcyclePosition();
      if (ctx.motorcycleNode) {
        ctx.motorcycleNode.rotation.y = 0;
        ctx.motorcycleNode.rotation.z = 0;
      }
    }
    // Stage 1: 3.2s to 6.5s -> Truck swings out left and sweeps sharp right
    else if (t < 6.5) {
      setStage(1);
      setText("Tình huống rẽ: Xe container bẻ lái rẽ phải. Phần rơ-moóc hông sau quét sát góc đường tạo ra góc quét hẹp. Tài xế không hề thấy chiếc xe máy trong hông phụ.");
      
      const turnT = (t - 3.2) / 3.3;
      const angle = turnT * (Math.PI / 2.2);
      
      let truckX = 2.25;
      let truckZ = -12.1;
      if (ctx.truckNode) {
        ctx.truckNode.rotation.y = angle;
        const radius = 6.5;
        truckZ = -12.1 + Math.sin(angle) * radius;
        truckX = 2.25 + radius - Math.cos(angle) * radius;
        ctx.truckNode.position.set(truckX, 0, truckZ);
      }

      // Motorcycle rides parallel to the truck in its right blind spot!
      // Local position relative to the truck: localX = 3.8, localZ = -2.46
      const localX = 3.8;
      const localZ = -2.46;
      
      const bikeX = truckX + localX * Math.cos(angle) + localZ * Math.sin(angle);
      const bikeZ = truckZ - localX * Math.sin(angle) + localZ * Math.cos(angle);

      ctx.motorcycleX.set(bikeX);
      ctx.motorcycleZ.set(bikeZ);
      ctx.syncMotorcyclePosition();
      if (ctx.motorcycleNode) {
        ctx.motorcycleNode.rotation.y = angle;
        ctx.motorcycleNode.rotation.z = 0;
      }
    }
    // Stage 2: 6.5s to 9.5s -> Collision sweep!
    else if (t < 9.5) {
      setStage(2);
      setText("VA CHẠM: Đuôi rơ-moóc quét sâu ép chặt xe máy vào vỉa hè. Xe máy ngã đổ vào gầm xe tải lớn do đứng trong góc chết rẽ phải.");
      
      const finalTruckX = 7.82;
      const finalTruckZ = -5.67;
      const finalTruckAngle = Math.PI / 2.2;

      if (ctx.truckNode) {
        ctx.truckNode.rotation.y = finalTruckAngle;
        ctx.truckNode.position.set(finalTruckX, 0, finalTruckZ);
      }

      const finalBikeX = 5.93;
      const finalBikeZ = -9.82;

      ctx.motorcycleX.set(finalBikeX);
      ctx.motorcycleZ.set(finalBikeZ);
      ctx.syncMotorcyclePosition();
      if (ctx.motorcycleNode) {
        ctx.motorcycleNode.position.set(finalBikeX, 0.2, finalBikeZ);
        ctx.motorcycleNode.rotation.y = finalTruckAngle;
        ctx.motorcycleNode.rotation.z = Math.PI / 2.5;
      }
      ctx.checkBlindSpotState();
    }
    // Stage 3: End of Scenario
    else {
      setPlaying(false);
      ctx.setBlinkerActive(false);
      setText("Bài học sống sót: Khi thấy xe container lớn xi-nhan rẽ phải, TUYỆT ĐỐI không đi chen vào khe hẹp bên phải xe. Hãy giảm tốc độ, dừng lại nhường đường cách xa ít nhất 10 mét.");
    }
  }
}
