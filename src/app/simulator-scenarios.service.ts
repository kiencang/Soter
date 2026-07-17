import { Injectable, signal, inject } from '@angular/core';
import * as BABYLON from '@babylonjs/core';
import { SimulatorScenarioRightTurnService } from './simulator-scenario-right-turn.service';
import { SimulatorScenarioCutOffService } from './simulator-scenario-cut-off.service';
import { SimulatorScenarioTailgateService } from './simulator-scenario-tailgate.service';
import { SimulatorScenarioHeadSqueezeService } from './simulator-scenario-head-squeeze.service';
import { SimulatorScenarioReversingService } from './simulator-scenario-reversing.service';

export interface ScenarioContext {
  truckNode: BABYLON.TransformNode | null;
  trailerNode: BABYLON.TransformNode | null;
  motorcycleNode: BABYLON.TransformNode | null;
  oncomingMotorcycleNode: BABYLON.TransformNode | null;
  carNode: BABYLON.TransformNode | null;
  extraCarNode?: BABYLON.TransformNode | null;
  extraMoto1Node?: BABYLON.TransformNode | null;
  extraMoto2Node?: BABYLON.TransformNode | null;
  motorcycleX: { set(val: number): void };
  motorcycleZ: { set(val: number): void };
  syncMotorcyclePosition: () => void;
  checkBlindSpotState: () => void;
  setViewMode: (mode: 'orbit' | 'cabin' | 'rider') => void;
  intersectionMeshes: BABYLON.Mesh[];
  laneLines: any[];
  setBlinkerActive: (active: boolean, side?: 'left' | 'right' | 'both') => void;
  setMotoBlinkerActive: (active: boolean, side?: 'left' | 'right' | 'both') => void;
  setReverseActive: (active: boolean) => void;
  getTrailerRearPos: () => BABYLON.Vector3 | null;
  setTrailerRearPos: (pos: BABYLON.Vector3 | null) => void;
  setScenarioText: (text: string) => void;
}

@Injectable({ providedIn: 'root' })
export class SimulatorScenarioService {
  private rightTurnScenario = inject(SimulatorScenarioRightTurnService);
  private cutOffScenario = inject(SimulatorScenarioCutOffService);
  private tailgateScenario = inject(SimulatorScenarioTailgateService);
  private headSqueezeScenario = inject(SimulatorScenarioHeadSqueezeService);
  private reversingScenario = inject(SimulatorScenarioReversingService);

  activeScenario = signal<'free' | 'right_turn' | 'cut_off' | 'tailgate' | 'head_squeeze' | 'reversing'>('right_turn');
  isPlayingScenario = signal<boolean>(false);
  isAtStart = signal<boolean>(true);
  isCompleted = signal<boolean>(false);
  scenarioStage = signal<number>(0);
  scenarioText = signal<string>('');
  scenarioDesc = signal<string>('');
  scenarioLesson = signal<string>('');
  trafficLightColor = signal<'red' | 'yellow' | 'green'>('green');
  
  scenarioTimer = 0;

  startScenario(type: 'free' | 'right_turn' | 'cut_off' | 'tailgate' | 'head_squeeze' | 'reversing', ctx: ScenarioContext) {
    this.activeScenario.set(type);
    this.isPlayingScenario.set(false);
    this.isAtStart.set(true);
    this.isCompleted.set(false);
    this.scenarioTimer = 0;
    this.scenarioStage.set(0);

    this.rightTurnScenario.reset();
    this.cutOffScenario.reset();
    this.tailgateScenario.reset();
    this.headSqueezeScenario.reset();
    this.reversingScenario.reset();

    if (type === 'right_turn') {
      this.trafficLightColor.set('green');
    } else if (type === 'cut_off') {
      this.trafficLightColor.set('red');
    } else if (type === 'tailgate') {
      this.trafficLightColor.set('green');
    } else if (type === 'head_squeeze') {
      this.trafficLightColor.set('red');
    } else {
      this.trafficLightColor.set('green');
    }

    // Set initial text based on the scenario
    if (type === 'right_turn') {
      this.scenarioDesc.set("Xe máy đi song song với xe tải trong vùng điểm mù. Xe tải có tín hiệu rẽ phải, nhưng người lái xe máy không nắm được thông tin đó; ngược lại vì xe máy trong vùng điểm mù, tài xế xe tải cũng không nắm được thông tin xe máy đang đi song song.");
      this.scenarioLesson.set("Khi xe tải rẽ, hiện tượng 'cắt góc' của xe tải lớn/xe container khiến nó quét qua các làn bên trong. TUYỆT ĐỐI không đi song song với xe tải lớn/xe container ở các khúc cua hoặc ngã tư.");
      this.scenarioText.set("Khi xe tải rẽ, hiện tượng 'cắt góc' của xe tải lớn/xe container khiến nó quét qua các làn bên trong. TUYỆT ĐỐI không đi song song với xe tải lớn/xe container ở các khúc cua hoặc ngã tư.");
    } else if (type === 'cut_off') {
      this.scenarioDesc.set("Xe máy và ô tô tải đang dừng đèn đỏ. Xe máy ở trong vùng điểm mù. Xe máy có xi nhan từ trước trong lúc dừng đèn đỏ, với ý định rẽ trái. Người lái xe máy nghĩ rằng tài xế ô tô nhìn thấy và biết được ý định của mình từ sớm nhưng sự thật thì không.");
      this.scenarioLesson.set("Có hai vấn đề cần lưu ý ở đây, (a) Xe gắn máy đang ở trong vùng điểm mù, (b) Sau đó lại di chuyển nhanh và tạt đầu đột ngột ngay sát mũi xe tải lớn.");
      this.scenarioText.set("Có hai vấn đề cần lưu ý ở đây, (a) Xe gắn máy đang ở trong vùng điểm mù, (b) Sau đó lại di chuyển nhanh và tạt đầu đột ngột ngay sát mũi xe tải lớn.");
    } else if (type === 'tailgate') {
      this.scenarioDesc.set("Xe máy đỏ liên tục bám đuôi đằng sau ô tô tải ở khoảng cách không an toàn, điều này hạn chế tầm nhìn của xe máy và làm giảm thời gian có thể xử lý khi có tình huống bất thường xảy ra.");
      this.scenarioLesson.set("Luôn giữ khoảng cách an toàn khi chạy sau xe tải lớn. Giúp bạn luôn có tầm nhìn thoáng và đủ thời gian phản ứng khi xe trước phanh gấp.");
      this.scenarioText.set("Luôn giữ khoảng cách an toàn khi chạy sau xe tải lớn. Giúp bạn luôn có tầm nhìn thoáng và đủ thời gian phản ứng khi xe trước phanh gấp.");
    } else if (type === 'head_squeeze') {
      this.scenarioDesc.set("Xe ô tô tải đang dừng đèn đỏ, xe máy đỏ từ phía sau đi lên và đứng sát ngay trước mũi xe ô tô tải.");
      this.scenarioLesson.set("Khi dừng chờ đèn đỏ tại các nút giao, TUYỆT ĐỐI không len lỏi chen vào dừng ngay trước đầu xe tải lớn/xe container.");
      this.scenarioText.set("Khi dừng chờ đèn đỏ tại các nút giao, TUYỆT ĐỐI không len lỏi chen vào dừng ngay trước đầu xe tải lớn/xe container.");
    } else if (type === 'reversing') {
      this.scenarioDesc.set("Xe ô tô tải chuyển làn và dừng xe bên phải để chuẩn bị lùi xe. Trước khi lùi xe vài giây, xe máy màu đỏ di chuyển vào vùng điểm mù phía sau đuôi xe và dừng lại ở đó.");
      this.scenarioLesson.set("Tuyệt đối không dừng xe hoặc đứng sát ngay sau đuôi xe tải lớn. Khi lùi xe, điểm mù phía sau đuôi xe tải có thể dài tới hàng chục mét hoặc hơn.");
      this.scenarioText.set("Tuyệt đối không dừng xe hoặc đứng sát ngay sau đuôi xe tải lớn. Khi lùi xe, điểm mù phía sau đuôi xe tải có thể dài tới hàng chục mét hoặc hơn.");
    } else {
      this.scenarioDesc.set("");
      this.scenarioLesson.set("");
      this.scenarioText.set("");
    }
    ctx.setBlinkerActive(false);
    ctx.setMotoBlinkerActive(false);
    ctx.setReverseActive(false);

    // Reset positions
    if (ctx.truckNode) {
      const initialTruckX = 2.25;
      let initialTruckZ = 0;
      if (type === 'right_turn') {
        initialTruckZ = -34.1;
      } else if (type === 'cut_off') {
        initialTruckZ = -19.7;
      } else if (type === 'tailgate') {
        initialTruckZ = -50.0;
      } else if (type === 'head_squeeze') {
        initialTruckZ = -20.7;
      } else if (type === 'reversing') {
        initialTruckZ = -250.0;
      } else {
        initialTruckZ = -19.7;
      }
      
      ctx.truckNode.position.set(initialTruckX, 0, initialTruckZ);
      ctx.truckNode.rotation.y = 0;
      if (ctx.trailerNode) {
        ctx.trailerNode.position.set(initialTruckX, 0, initialTruckZ);
        ctx.trailerNode.rotation.set(0, 0, 0);
      }
      ctx.setTrailerRearPos(new BABYLON.Vector3(initialTruckX, 0.6, initialTruckZ - 11.25));
    }

    if (ctx.motorcycleNode) {
      ctx.motorcycleNode.rotation.set(0, 0, 0);
      ctx.motorcycleNode.scaling.set(1, 1, 1);
      ctx.motorcycleNode.position.y = (type === 'tailgate') ? 0.015 : 0;
    }

    if (ctx.oncomingMotorcycleNode) {
      ctx.oncomingMotorcycleNode.setEnabled(type === 'tailgate' || type === 'head_squeeze');
      if (type === 'head_squeeze') {
        ctx.oncomingMotorcycleNode.rotation.set(0, 0, 0); // Hướng về phía trước
        ctx.oncomingMotorcycleNode.position.set(6.75, 0, -16.5); // Dừng an toàn sau vạch dừng
      } else {
        ctx.oncomingMotorcycleNode.rotation.set(0, Math.PI, 0); // Facing the other way
        ctx.oncomingMotorcycleNode.position.set(-3.5, 0, 66.5); // Initial position for tailgate
      }
    }

    if (ctx.carNode) {
      ctx.carNode.setEnabled(type === 'tailgate');
      ctx.carNode.position.set(6.75, 0, -75.0);
      ctx.carNode.rotation.set(0, 0, 0);
    }

    if (ctx.extraCarNode) {
      ctx.extraCarNode.setEnabled(type === 'reversing');
      ctx.extraCarNode.position.set(2.25, 0, -440);
      ctx.extraCarNode.rotation.set(0, 0, 0);
    }

    if (ctx.extraMoto1Node) {
      ctx.extraMoto1Node.setEnabled(type === 'reversing');
      ctx.extraMoto1Node.position.set(7.5, 0, -250);
      ctx.extraMoto1Node.rotation.set(0, 0, 0);
    }

    if (ctx.extraMoto2Node) {
      ctx.extraMoto2Node.setEnabled(type === 'reversing');
      ctx.extraMoto2Node.position.set(7.5, 0, -269);
      ctx.extraMoto2Node.rotation.set(0, 0, 0);
    }

    ctx.intersectionMeshes.forEach(mesh => mesh.isVisible = true);

    if (type === 'free') {
      ctx.motorcycleX.set(7.5);
      ctx.motorcycleZ.set(-25.0);
      ctx.syncMotorcyclePosition();
      ctx.setViewMode('orbit');
    } else if (type === 'right_turn') {
      ctx.motorcycleX.set(6.05);
      ctx.motorcycleZ.set(-33.1);
      ctx.syncMotorcyclePosition();
      ctx.setViewMode('orbit');
    } else if (type === 'cut_off') {
      ctx.motorcycleX.set(6.05);
      ctx.motorcycleZ.set(-18.0);
      ctx.syncMotorcyclePosition();
      ctx.setViewMode('orbit');
    } else if (type === 'tailgate') {
      ctx.motorcycleX.set(3.2);
      ctx.motorcycleZ.set(-63.85);
      ctx.syncMotorcyclePosition();
      ctx.setViewMode('orbit');
    } else if (type === 'head_squeeze') {
      ctx.motorcycleX.set(6.05);
      ctx.motorcycleZ.set(-23.0);
      ctx.syncMotorcyclePosition();
      ctx.setViewMode('orbit');
    } else if (type === 'reversing') {
      ctx.motorcycleX.set(7.5);
      ctx.motorcycleZ.set(-290.0);
      ctx.syncMotorcyclePosition();
      ctx.setViewMode('orbit');
    }
  }

  resetScenario(ctx: ScenarioContext) {
    this.startScenario(this.activeScenario(), ctx);
  }

  updateScenario(dt: number, ctx: ScenarioContext) {
    if (!this.isPlayingScenario()) return;

    if (this.scenarioTimer === 0 && dt > 0) {
      this.isAtStart.set(false);
    }
    this.scenarioTimer += dt;
    const t = this.scenarioTimer;
    const scenario = this.activeScenario();

    const setStage = (stage: number) => this.scenarioStage.set(stage);
    const setPlaying = (playing: boolean) => this.isPlayingScenario.set(playing);

    if (scenario === 'right_turn') {
      this.rightTurnScenario.animate(t, ctx, setStage, setPlaying);
    } else if (scenario === 'cut_off') {
      this.cutOffScenario.animate(t, ctx, setStage, setPlaying, (color) => this.trafficLightColor.set(color));
    } else if (scenario === 'tailgate') {
      this.tailgateScenario.animate(t, dt, ctx, setStage, setPlaying);
    } else if (scenario === 'head_squeeze') {
      this.headSqueezeScenario.animate(t, ctx, setStage, setPlaying, (color) => this.trafficLightColor.set(color));
    } else if (scenario === 'reversing') {
      this.reversingScenario.animate(t, ctx, setStage, setPlaying);
    }

    if (!this.isPlayingScenario()) {
      this.isCompleted.set(true);
    }
  }
}
