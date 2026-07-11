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
    
    // Calculate current positions based on time
    let truckZ = initialZ;
    let bikeZ = initialZ - 15.0;

    // Stage 0: 0s to 3.2s -> Riding close behind
    if (t < 3.2) {
      setStage(0);
      setText("Hành trình: Xe máy bám sát sạt đuôi rơ-moóc thùng container ở khoảng cách 1.5 mét. Người lái xe máy hoàn toàn bị mất tầm nhìn phía trước.");
      truckZ = initialZ + t * speed;
      bikeZ = truckZ - 15.0;
      this.updatePositions(ctx, truckZ, bikeZ);
    }
    // Stage 1: 3.2s to 6.5s -> Still tailgating, completely invisible in mirrors
    else if (t < 6.5) {
      setStage(1);
      setText("Rủi ro ẩn: Ở vị trí bám sát sạt này, gương chiếu hậu bên hông xe container không thể thu giữ bóng dáng xe máy. Tài xế hoàn toàn mù thông tin sau đuôi.");
      truckZ = initialZ + t * speed;
      bikeZ = truckZ - 15.0;
      this.updatePositions(ctx, truckZ, bikeZ);
    }
    // Stage 2: 6.5s to 9.5s -> Sudden emergency brake!
    else if (t < 9.5) {
      setStage(2);
      setText("PHANH GẤP: Gặp vật cản, container phanh gấp. Do bị che khuất tầm nhìn trước hoàn toàn và khoảng cách quá ngắn, xe máy húc thẳng vào đuôi rơ-moóc sắt thép.");
      
      const activeT = t - 6.5;
      const truckStartZ = initialZ + 6.5 * speed;
      const bikeStartZ = truckStartZ - 15.0;
      
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
        const brakeT = activeT - 0.5;
        const bikeDecel = speed / 1.0;
        bikeDist = speed * 0.5 + speed * brakeT - 0.5 * bikeDecel * brakeT * brakeT;
      }
      bikeZ = bikeStartZ + bikeDist;
      
      // Collision happens if bike gets too close to the rear of the trailer
      const collisionZ = truckZ - 13.5;
      let crashed = false;
      if (bikeZ >= collisionZ) {
        bikeZ = collisionZ;
        crashed = true;
      }
      
      if (ctx.truckNode) {
        ctx.truckNode.position.set(2.25, 0, truckZ);
        ctx.setTrailerRearPos(new BABYLON.Vector3(2.25, 0.6, truckZ - 11.25));
      }
      
      ctx.motorcycleX.set(2.25);
      ctx.motorcycleZ.set(bikeZ);
      
      if (ctx.motorcycleNode) {
        if (crashed) {
          ctx.motorcycleNode.position.set(2.25, 0.35, bikeZ);
          ctx.motorcycleNode.rotation.x = -Math.PI / 4.5;
        } else {
          ctx.motorcycleNode.position.set(2.25, 0, bikeZ);
          ctx.motorcycleNode.rotation.x = 0;
        }
      }
      
      ctx.checkBlindSpotState();
    }
    // Stage 3: End of Scenario
    else {
      setPlaying(false);
      setText("Bài học sống sót: Luôn giữ khoảng cách an toàn ít nhất 20 mét (bằng một thân xe lớn) khi bám đuôi xe tải rơ-moóc. Giúp bạn luôn có tầm quan sát mở và thời gian tránh khẩn cấp.");
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
      ctx.motorcycleNode.position.set(2.25, 0, bikeZ);
      ctx.motorcycleNode.rotation.x = 0;
    }
    ctx.syncMotorcyclePosition();
  }
}
