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
    // Stage 0: 0s to 3s -> Moving straight forward together, signaling
    if (t < 3.2) {
      setStage(0);
      setText("Hành trình: Xe container xi-nhan rẽ phải chuẩn bị rẽ ngã tư. Xe máy đang bám sát song song phía bên phải rơ-moóc rọ - đây là vùng tử thần khuất 100% gương lái!");
      ctx.setBlinkerActive(true, 'right');

      const progressZ = -8.0 + t * 2.2;
      if (ctx.truckNode) {
        ctx.truckNode.position.set(0, 0, progressZ);
        ctx.truckNode.rotation.y = 0;
      }
      ctx.motorcycleX.set(3.8);
      ctx.motorcycleZ.set(progressZ - 2.5);
      ctx.syncMotorcyclePosition();
    }
    // Stage 1: 3.2s to 6.2s -> Truck swings out left and sweeps sharp right
    else if (t < 6.5) {
      setStage(1);
      setText("Tình huống rẽ: Xe container bẻ lái rẽ phải. Phần rơ-moóc hông sau quét sát góc đường tạo ra góc quét hẹp. Tài xế không hề thấy chiếc xe máy trong hông phụ.");
      
      const turnT = (t - 3.2) / 3.3;
      const angle = turnT * (Math.PI / 2.2);
      
      if (ctx.truckNode) {
        ctx.truckNode.rotation.y = angle;
        const radius = 6.5;
        const zPos = -1.0 + Math.sin(angle) * radius;
        const xPos = radius - Math.cos(angle) * radius;
        ctx.truckNode.position.set(xPos, 0, zPos);
      }

      const bikeZ = -5.7 + (t - 3.2) * 1.8;
      ctx.motorcycleX.set(3.8);
      ctx.motorcycleZ.set(bikeZ);
      ctx.syncMotorcyclePosition();
    }
    // Stage 2: 6.5s to 9.5s -> Collision sweep!
    else if (t < 9.5) {
      setStage(2);
      setText("VA CHẠM: Đuôi rơ-moóc quét sâu ép chặt xe máy vào vỉa hè. Xe máy ngã đổ vào gầm xe tải lớn do đứng trong góc chết rẽ phải.");
      
      if (ctx.truckNode) {
        ctx.truckNode.rotation.y = Math.PI / 2.3;
        ctx.truckNode.position.set(3.8, 0, 3.2);
      }
      ctx.motorcycleX.set(3.2);
      ctx.motorcycleZ.set(1.5);
      if (ctx.motorcycleNode) {
        ctx.motorcycleNode.position.set(3.2, 0.2, 1.5);
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
