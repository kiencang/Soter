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
      setText("Đèn đỏ: Cả xe tải lớn và xe máy đang dừng chờ đèn đỏ tại ngã tư. Xe máy dừng chếch về phía trước bên phải cabin xe tải.");
      
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
      }
    }
    // Stage 1: 1.5s to 4.7s -> Đèn xanh, cả hai cùng khởi hành, xe máy tạt đầu
    else if (t < 4.7) {
      setStage(1);
      setText("Đèn xanh: Cả hai di chuyển. Xe máy tăng tốc nhanh hơn và đột ngột rẽ trái tạt đầu ngay sát mũi cabin xe tải để chuyển làn.");
      
      const activeT = t - 1.5; // ranges from 0 to 3.2

      // Truck accelerates slowly
      const truckZ = -19.7 + activeT * 3.125; // reaches -9.7 at t=4.7 (activeT=3.2)
      if (ctx.truckNode) {
        ctx.truckNode.position.set(2.25, 0, truckZ);
      }

      let bikeX = 6.05;
      let bikeZ = -16.3;
      let bikeRotY = 0;

      if (activeT < 1.5) {
        const ratio = activeT / 1.5;
        bikeX = 6.05;
        bikeZ = -16.3 + ratio * 8.65; // moves to -7.65
        bikeRotY = 0;
      } else {
        // Stop the motorcycle from moving further at collision point (activeT around 2.9)
        const ratio = Math.min((activeT - 1.5) / 1.4, 1.0); // 0 to 1, caps at activeT=2.9
        
        // Smooth easing for a more realistic turn
        const smoothRatio = ratio * ratio * (3 - 2 * ratio);
        bikeX = 6.05 - smoothRatio * 3.3; // cuts left to 2.75 (front of truck)
        bikeZ = -7.65 + ratio * 2.1; // moves forward to -5.55
        
        // Dynamic rotation based on trajectory derivative
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
      }
    }
    // Stage 2: 4.7s to 7.7s -> Va chạm do rơi vào vùng mù
    else if (t < 7.7) {
      setStage(2);
      setText("CẢNH BÁO TAI NẠN: Xe máy tạt đầu quá sát cabin (dưới 1.5 mét). Đây là cực cận vùng mù phía trước xe tải, tài xế không nhìn thấy xe máy và gây va chạm!");
      
      const activeT = t - 4.7; // 0 to 3.0

      // Freeze simulation exactly at collision point to avoid "ghosting" or running over
      const truckFinalZ = -9.7; 
      if (ctx.truckNode) {
        ctx.truckNode.position.set(2.25, 0, truckFinalZ);
      }

      // Motorcycle gets knocked down but stays in place
      const bikeX = 2.75;
      const bikeZ = -5.55;
      
      ctx.motorcycleX.set(bikeX);
      ctx.motorcycleZ.set(bikeZ);

      if (ctx.motorcycleNode) {
        ctx.motorcycleNode.position.set(bikeX, 0.15, bikeZ);
        ctx.motorcycleNode.rotation.y = -Math.PI / 2;
        // animate the fall slightly
        ctx.motorcycleNode.rotation.x = Math.min(activeT * 2, Math.PI / 2.3); 
      }

      ctx.checkBlindSpotState();
    }
    // Stage 3: End of Scenario
    else {
      setPlaying(false);
      setText("Bài học sinh tồn: Tuyệt đối không bao giờ tạt đầu đột ngột ngay sát mũi xe tải lớn hoặc xe container. Hãy vượt bên trái với khoảng cách xa an toàn ít nhất 5 mét trước khi nhập làn.");
    }
  }
}
