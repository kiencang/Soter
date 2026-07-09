import { Injectable } from '@angular/core';
import * as BABYLON from '@babylonjs/core';

export interface BlindSpotResult {
  zone: string;
  isBlind: boolean;
  detail: string;
}

@Injectable({ providedIn: 'root' })
export class SimulatorLogicService {
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

    // 1. Front Blind Spot (Local to Truck)
    if (tz >= 3.6 && tz <= 7.2 && tx >= -1.8 && tx <= 1.8) {
      zone = 'Điểm mù PHÍA TRƯỚC (Sát đầu xe)';
      isBlind = true;
      detail = 'Cabin xe container rất cao tạo ra khoảng mù cực kỳ nguy hiểm ngay trước đầu xe dưới 3 mét. Tài xế hoàn toàn không thấy bạn! Tránh dừng xe máy ngay sát trước đầu xe lớn khi dừng đèn đỏ.';
    }
    // 2. Right Blind Spot (Local to Trailer)
    else if (rx >= 1.5 && rx <= 6.5 && rz >= -13.0 && rz <= 3.5) {
      zone = 'Điểm mù hông PHẢI (Bên phụ)';
      isBlind = true;
      detail = 'Đây là ĐIỂM MÙ LỚN NHẤT VÀ NGUY HIỂM NHẤT! Gương chiếu hậu bên phải không thể hiển thị xe của bạn khi bạn đi song song hông xe. Bạn có thể bị ép vào gầm khi xe tải rẽ phải!';
    }
    // 3. Left Blind Spot (Local to Truck)
    else if (tx >= -5.5 && tx <= -1.5 && tz >= -10.0 && tz <= 2.2) {
      zone = 'Điểm mù hông TRÁI (Bên tài)';
      isBlind = true;
      detail = 'Dù nằm bên phía ghế lái, khu vực sát hông cabin kéo dài ra sau vẫn bị khuất tầm nhìn. Tránh đi song song quá sát thân xe lớn kể cả bên trái.';
    }
    // 4. Rear Blind Spot (Local to Trailer)
    else if (rz >= -25.0 && rz <= -13.5 && rx >= -2.5 && rx <= 2.5) {
      zone = 'Điểm mù PHÍA SAU (Bám đuôi rơ-moóc)';
      isBlind = true;
      detail = 'Xe container hoàn toàn không có gương chiếu hậu giữa và thùng hàng che khuất 100% tầm nhìn phía sau. Đi bám sát đuôi rơ-moóc vô cùng nguy hiểm nếu xe container phanh gấp hoặc lùi xe.';
    }
    // 5. Collision Zone (Touch cabin or trailer)
    else if (
      (tx >= -1.4 && tx <= 1.4 && tz >= 1.0 && tz <= 4.8) ||
      (rx >= -1.5 && rx <= 1.5 && rz >= -12.55 && rz <= 0.95)
    ) {
      zone = 'VÙNG VA CHẠM (NGUY HIỂM CHẾT NGƯỜI)';
      isBlind = true;
      detail = 'CẢNH BÁO: Xe máy đang chạm sát vào thùng hoặc cabin xe container! Đây là tình huống tai nạn cực kỳ nguy kịch trong thực tế.';
    }

    return { zone, isBlind, detail };
  }
}
