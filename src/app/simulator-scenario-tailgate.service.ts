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
    const speed = 12.0;
    const initialZ = -40.0;
    
    // Khoảng cách bám đuôi 1.5 mét:
    // Distance = (truckZ - 11.25) - (bikeZ + 1.1) = 1.5
    // -> bikeZ = truckZ - 13.85
    const bikeOffset = -13.85; 
    
    let truckZ = initialZ;
    let bikeZ = initialZ + bikeOffset;

    // Stage 0: 0s to 3.2s -> Riding close behind
    if (t < 3.2) {
      setStage(0);
      setText("Hành trình: Xe máy bám sát sạt đuôi rơ-moóc thùng container ở khoảng cách 1.5 mét. Người lái xe máy hoàn toàn bị mất tầm nhìn phía trước.");
      truckZ = initialZ + t * speed;
      bikeZ = truckZ + bikeOffset;
      this.updatePositions(ctx, truckZ, bikeZ);
    }
    // Stage 1: 3.2s to 6.0s -> Still tailgating, completely invisible in mirrors
    else if (t < 6.0) {
      setStage(1);
      setText("Rủi ro ẩn: Ở vị trí bám sát sạt này, gương chiếu hậu bên hông xe container không thể thu giữ bóng dáng xe máy. Tài xế hoàn toàn mù thông tin sau đuôi.");
      truckZ = initialZ + t * speed;
      bikeZ = truckZ + bikeOffset;
      this.updatePositions(ctx, truckZ, bikeZ);
    }
    // Stage 2: 6.0s to 9.5s -> Sudden emergency brake!
    else if (t < 9.5) {
      setStage(2);
      setText("PHANH GẤP: Gặp chướng ngại vật, container phanh gấp. Do khoảng cách quá ngắn không đủ thời gian phản xạ, xe máy húc thẳng vào đuôi rơ-moóc sắt thép.");
      
      const activeT = t - 6.0;
      const truckStartZ = initialZ + 6.0 * speed;
      const bikeStartZ = truckStartZ + bikeOffset;
      
      // Truck decelerates to stop in 1.5s
      const truckDecel = speed / 1.5;
      let truckDist = 0;
      if (activeT < 1.5) {
        truckDist = speed * activeT - 0.5 * truckDecel * activeT * activeT;
      } else {
        truckDist = speed * 1.5 - 0.5 * truckDecel * 1.5 * 1.5;
      }
      truckZ = truckStartZ + truckDist;
      
      // Bike has 0.5s reaction time, then brakes but crashes
      let bikeDist = 0;
      if (activeT < 0.5) {
        bikeDist = speed * activeT;
      } else {
        const brakeT = Math.min(activeT - 0.5, 1.0);
        const bikeDecel = speed / 1.0;
        bikeDist = speed * 0.5 + speed * brakeT - 0.5 * bikeDecel * brakeT * brakeT;
      }
      bikeZ = bikeStartZ + bikeDist;
      
      // Collision happens if bike gets too close to the rear of the trailer
      const collisionLimitZ = truckZ - 12.35;
      
      if (ctx.truckNode) {
        ctx.truckNode.position.set(2.25, 0, truckZ);
        ctx.setTrailerRearPos(new BABYLON.Vector3(2.25, 0.6, truckZ - 11.25));
      }
      
      ctx.motorcycleX.set(2.25);
      
      if (bikeZ >= collisionLimitZ) {
        // Crashed
        bikeZ = collisionLimitZ; 
        ctx.motorcycleZ.set(bikeZ);
        
        if (ctx.motorcycleNode) {
          ctx.motorcycleNode.position.set(2.25, 0.015, bikeZ);
          
          const crashActiveT = Math.max(0, activeT - 0.3);
          const crushFactor = Math.min(crashActiveT / 0.5, 1.0);
          
          // Xe húc vào đít xe tải: bốc đuôi lên một chút rồi đổ
          const pitchAngle = Math.sin(crushFactor * Math.PI) * (Math.PI / 6); 
          const fallAngle = crushFactor * (Math.PI / 2.2); 
          
          ctx.motorcycleNode.rotation.x = pitchAngle; 
          ctx.motorcycleNode.rotation.y = crushFactor * 0.3; 
          ctx.motorcycleNode.rotation.z = -fallAngle; 
          
          // Bẹp đầu xe
          const scalingFactor = Math.max(1.0 - crushFactor * 0.3, 0.7);
          ctx.motorcycleNode.scaling.set(1.0, 1.0, scalingFactor);
        }
      } else {
        // Not crashed yet
        ctx.motorcycleZ.set(bikeZ);
        if (ctx.motorcycleNode) {
          ctx.motorcycleNode.position.set(2.25, 0.015, bikeZ);
          ctx.motorcycleNode.rotation.x = 0;
          ctx.motorcycleNode.rotation.y = 0;
          ctx.motorcycleNode.rotation.z = 0;
          ctx.motorcycleNode.scaling.set(1, 1, 1);
        }
      }
      
      ctx.checkBlindSpotState();
    }
    // Stage 3: End of Scenario
    else {
      setPlaying(false);
      setText("Bài học sống sót: Luôn giữ khoảng cách an toàn tối thiểu (quy tắc 3 giây) khi chạy sau xe tải lớn. Giúp bạn luôn có tầm nhìn thoáng và đủ thời gian phản ứng khi xe trước phanh gấp.");
    }
  }

  private updatePositions(ctx: ScenarioContext, truckZ: number, bikeZ: number) {
    if (ctx.truckNode) {
      ctx.truckNode.position.set(2.25, 0, truckZ);
      ctx.setTrailerRearPos(new BABYLON.Vector3(2.25, 0.6, truckZ - 11.25));
    }
    ctx.motorcycleX.set(2.25);
    ctx.motorcycleZ.set(bikeZ);
    if (ctx.motorcycleNode) {
      ctx.motorcycleNode.position.set(2.25, 0.015, bikeZ);
      ctx.motorcycleNode.rotation.x = 0;
      ctx.motorcycleNode.rotation.y = 0;
      ctx.motorcycleNode.rotation.z = 0;
      ctx.motorcycleNode.scaling.set(1, 1, 1);
    }
    ctx.syncMotorcyclePosition();
  }
}

