import { Injectable } from '@angular/core';
import * as BABYLON from '@babylonjs/core';

export interface BlindSpotResult {
  zone: string;
  isBlind: boolean;
  detail: string;
}

@Injectable({ providedIn: 'root' })
export class SimulatorLogicService {
  getLeftBlindSpotVerticesLocal(): BABYLON.Vector3[] {
    return [
      new BABYLON.Vector3(-8.0, 0.015, -4.0),
      new BABYLON.Vector3(0.0, 0.015, 1.5),
      new BABYLON.Vector3(0.0, 0.015, 3.2),
      new BABYLON.Vector3(-8.0, 0.015, 1.0)
    ];
  }

  getRightBlindSpotVerticesLocal(): BABYLON.Vector3[] {
    return [
      new BABYLON.Vector3(0.0, 0.015, 1.5),
      new BABYLON.Vector3(8.0, 0.015, -6.0),
      new BABYLON.Vector3(8.0, 0.015, -1.0),
      new BABYLON.Vector3(0.0, 0.015, 3.2)
    ];
  }

  isPointInQuad(px: number, pz: number, q: { x: number, z: number }[]): boolean {
    for (let i = 0; i < 4; i++) {
      const p1 = q[i];
      const p2 = q[(i + 1) % 4];
      const val = (p2.x - p1.x) * (pz - p1.z) - (p2.z - p1.z) * (px - p1.x);
      if (val < 0) {
        return false;
      }
    }
    return true;
  }

  checkBlindSpot(
    truckNode: BABYLON.TransformNode | null,
    trailerNode: BABYLON.TransformNode | null,
    motorcycleNode: BABYLON.TransformNode | null
  ): BlindSpotResult {
    if (!truckNode || !trailerNode || !motorcycleNode) {
      return {
        zone: 'Ngoài vùng nguy hiểm',
        isBlind: false,
        detail: 'Hệ thống mô phỏng đang khởi động...'
      };
    }

    const motorcycleWorldPos = motorcycleNode.position;

    const mLocalTruck = BABYLON.Vector3.TransformCoordinates(motorcycleWorldPos, truckNode.getWorldMatrix().clone().invert());
    const mLocalTrailer = BABYLON.Vector3.TransformCoordinates(motorcycleWorldPos, trailerNode.getWorldMatrix().clone().invert());

    const tx = mLocalTruck.x;
    const tz = mLocalTruck.z;

    const rx = mLocalTrailer.x;
    const rz = mLocalTrailer.z;

    let zone = 'Ngoài vùng nguy hiểm';
    let isBlind = false;
    let detail = 'Bạn đang ở vị trí tương đối an toàn. Ở khoảng cách này, tài xế có thể nhìn thấy bạn qua kính chắn gió trước hoặc các gương chiếu hậu. Hãy luôn chủ động giữ khoảng cách này!';

    // Defining the quadrilaterals (Vertices in counter-clockwise order)
    const qFront = [
      { x: -1.5, z: 4.85 },
      { x: 1.5, z: 4.85 },
      { x: 1.5, z: 7.3 },
      { x: -1.5, z: 7.3 }
    ];

    const qRight = this.getRightBlindSpotVerticesLocal();
    const qLeft = this.getLeftBlindSpotVerticesLocal();

    const qRear = [
      { x: -1.25, z: -20.0 },
      { x: 1.25, z: -20.0 },
      { x: 1.25, z: -10.7 },
      { x: -1.25, z: -10.7 }
    ];

    // 1. Front Blind Spot (Local to Truck)
    if (this.isPointInQuad(tx, tz, qFront)) {
      zone = 'Điểm mù PHÍA TRƯỚC (Sát đầu xe)';
      isBlind = true;
      detail = 'Cabin xe container rất cao tạo ra khoảng mù cực kỳ nguy hiểm ngay trước đầu xe dưới 2.5 mét. Tài xế hoàn toàn không thấy bạn! Tránh dừng xe máy ngay sát trước đầu xe lớn khi dừng đèn đỏ.';
    }
    // 2. Right Blind Spot (Local to Truck for perfect mirror matching)
    else if (this.isPointInQuad(tx, tz, qRight)) {
      zone = 'Điểm mù hông PHẢI (Bên phụ)';
      isBlind = true;
      detail = 'Đây là ĐIỂM MÙ LỚN NHẤT VÀ NGUY HIỂM NHẤT! Gương chiếu hậu bên phải không thể hiển thị xe của bạn khi bạn đi song song hông xe. Bạn có thể bị ép vào gầm khi xe tải rẽ phải!';
    }
    // 3. Left Blind Spot (Local to Truck)
    else if (this.isPointInQuad(tx, tz, qLeft)) {
      zone = 'Điểm mù hông TRÁI (Bên tài)';
      isBlind = true;
      detail = 'Dù nằm bên phía ghế lái, khu vực sát hông cabin kéo dài ra sau vẫn bị khuất tầm nhìn. Tránh đi song song quá sát thân xe lớn kể cả bên trái.';
    }
    // 4. Rear Blind Spot (Local to Trailer)
    else if (this.isPointInQuad(rx, rz, qRear)) {
      zone = 'Điểm mù PHÍA SAU (Bám đuôi rơ-moóc)';
      isBlind = true;
      detail = 'Xe container hoàn toàn không có gương chiếu hậu giữa và thùng hàng che khuất 100% tầm nhìn phía sau. Đi bám sát đuôi rơ-moóc vô cùng nguy hiểm nếu xe container phanh gấp hoặc lùi xe.';
    }
    // 5. Collision Zone (Touch cabin or trailer)
    else if (
      (tx >= -1.25 && tx <= 1.25 && tz >= 1.15 && tz <= 4.85) ||
      (rx >= -1.25 && rx <= 1.25 && rz >= -10.7 && rz <= 1.5)
    ) {
      zone = 'VÙNG VA CHẠM (NGUY HIỂM CHẾT NGƯỜI)';
      isBlind = true;
      detail = 'CẢNH BÁO: Xe máy đang chạm sát vào thùng hoặc cabin xe container! Đây là tình huống tai nạn cực kỳ nguy kịch trong thực tế.';
    }

    return { zone, isBlind, detail };
  }
}
