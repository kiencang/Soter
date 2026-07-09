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

    // Stage 0: 0s to 3s -> Motorcycle stops too close under front cockpit bumper
    if (t < 3.2) {
      setStage(0);
      setText("Tình huống: Xe máy leo lề hoặc đi từ hông lên, dừng đèn đỏ chắn ngang sát sàn cabin của xe container dưới 1.5 mét.");
      
      if (ctx.truckNode) ctx.truckNode.position.set(0, 0, 0);
      
      const progressT = t / 3.2;
      const xPos = 4.5 - progressT * 4.5;
      const zPos = -1.0 + progressT * 6.6;
      
      ctx.motorcycleX.set(xPos);
      ctx.motorcycleZ.set(zPos);
      if (ctx.motorcycleNode) {
        ctx.motorcycleNode.position.set(xPos, 0, zPos);
        ctx.motorcycleNode.rotation.y = -Math.PI / 4;
      }
    }
    // Stage 1: 3.2s to 6.2s -> Green light, Truck accelerates, driver sees nothing
    else if (t < 6.5) {
      setStage(1);
      setText("Đèn xanh: Tài xế container khởi hành. Do sàn lái quá cao và kính chắn gió thẳng không thể quét sát mũi xe, tài xế không thấy và cán qua xe máy.");
      
      const activeT = t - 3.2;
      const truckSpeedZ = activeT * 1.3;
      if (ctx.truckNode) {
        ctx.truckNode.position.set(0, 0, truckSpeedZ);
      }

      ctx.motorcycleX.set(0);
      ctx.motorcycleZ.set(5.6 + activeT * 0.2);
      if (ctx.motorcycleNode) {
        ctx.motorcycleNode.position.set(0, 0.1, 5.6 + activeT * 0.2);
        ctx.motorcycleNode.rotation.y = 0;
      }
    }
    // Stage 2: 6.5s to 9.5s -> Knocked down!
    else if (t < 9.5) {
      setStage(2);
      setText("CẢNH BÁO: Tai nạn xảy ra! Chiếc xe máy bị gạt đổ dưới gầm cabin đầu xe. Tài xế không nghe thấy tiếng động gì từ cabin cách âm cao nên vẫn ga tiếp.");
      
      if (ctx.truckNode) ctx.truckNode.position.set(0, 0, 4.2);
      ctx.motorcycleX.set(0);
      ctx.motorcycleZ.set(8.2);
      if (ctx.motorcycleNode) {
        ctx.motorcycleNode.position.set(0, 0.15, 8.2);
        ctx.motorcycleNode.rotation.x = Math.PI / 2;
      }
      ctx.checkBlindSpotState();
    }
    // Stage 3: End of Scenario
    else {
      setPlaying(false);
      setText("Bài học sống sót: Tuyệt đối không dừng chờ đèn đỏ ngay sát trước mặt xe container hay xe tải nặng. Phải dừng lệch hông lái hoặc đứng cách xa ít nhất 3.5 mét để tài xế có thể thấy bạn.");
    }
  }
}
