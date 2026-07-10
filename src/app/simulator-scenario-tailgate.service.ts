import { Injectable } from '@angular/core';
import * as BABYLON from '@babylonjs/core';
import { ScenarioContext } from './simulator-scenarios.service';

@Injectable({ providedIn: 'root' })
export class SimulatorScenarioTailgateService {
  animate(
    t: number,
    dt: number,
    ctx: ScenarioContext,
    setStage: (stage: number) => void,
    setText: (text: string) => void,
    setPlaying: (playing: boolean) => void
  ) {
    if (ctx.truckNode) {
      ctx.truckNode.position.set(2.25, 0, 0);
      ctx.truckNode.rotation.y = 0;
    }

    // Stage 0: 0s to 3s -> Riding close behind
    if (t < 3.2) {
      setStage(0);
      setText("Hành trình: Xe máy bám sát sạt đuôi rơ-moóc thùng container ở khoảng cách 1.5 mét. Người lái xe máy hoàn toàn bị mất tầm nhìn phía trước.");
      
      ctx.motorcycleX.set(2.25);
      ctx.motorcycleZ.set(-15.0);
      ctx.syncMotorcyclePosition();
      
      this.animateRoadLines(dt, 26, ctx.laneLines);
    }
    // Stage 1: 3.2s to 6.2s -> Still tailgating, completely invisible in mirrors
    else if (t < 6.5) {
      setStage(1);
      setText("Rủi ro ẩn: Ở vị trí bám sát sạt này, gương chiếu hậu bên hông xe container không thể thu giữ bóng dáng xe máy. Tài xế hoàn toàn mù thông tin sau đuôi.");
      
      ctx.motorcycleX.set(2.25);
      ctx.motorcycleZ.set(-15.0);
      ctx.syncMotorcyclePosition();
      
      this.animateRoadLines(dt, 26, ctx.laneLines);
    }
    // Stage 2: 6.5s to 9.5s -> Sudden emergency brake!
    else if (t < 9.5) {
      setStage(2);
      setText("PHANH GẤP: Gặp vật cản, container phanh gấp. Do bị che khuất tầm nhìn trước hoàn toàn và khoảng cách quá ngắn, xe máy húc thẳng vào đuôi rơ-moóc sắt thép.");
      
      ctx.motorcycleX.set(2.25);
      ctx.motorcycleZ.set(-13.5);
      if (ctx.motorcycleNode) {
        ctx.motorcycleNode.position.set(2.25, 0.35, -13.5);
        ctx.motorcycleNode.rotation.x = -Math.PI / 4.5;
      }
      
      this.animateRoadLines(dt, 0, ctx.laneLines);
      ctx.checkBlindSpotState();
    }
    // Stage 3: End of Scenario
    else {
      setPlaying(false);
      setText("Bài học sống sót: Luôn giữ khoảng cách an toàn ít nhất 20 mét (bằng một thân xe lớn) khi bám đuôi xe tải rơ-moóc. Giúp bạn luôn có tầm quan sát mở và thời gian tránh khẩn cấp.");
    }
  }

  private animateRoadLines(dt: number, speedMultiplier: number, laneLines: any[]) {
    laneLines.forEach(line => {
      line.mesh.position.z -= dt * speedMultiplier;
      if (line.mesh.position.z < -45) {
        line.mesh.position.z += 80;
      }
    });
  }
}
