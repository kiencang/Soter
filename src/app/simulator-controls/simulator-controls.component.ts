import { Component, inject, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SimulatorService } from '../simulator.service';
import { Footer } from '../footer/footer';

@Component({
  selector: 'app-simulator-controls',
  imports: [CommonModule, Footer],
  templateUrl: './simulator-controls.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SimulatorControlsComponent {
  sim = inject(SimulatorService);

  selectedSide = signal<'left' | 'right'>('left');
  selectedVertex = signal<'L1' | 'L2' | 'L3' | 'L4' | 'R1' | 'R2' | 'R3' | 'R4'>('L1');

  selectSide(side: 'left' | 'right') {
    this.selectedSide.set(side);
    this.selectedVertex.set(side === 'left' ? 'L1' : 'R1');
  }

  currentVertexX = computed(() => {
    const v = this.selectedVertex();
    switch (v) {
      case 'L1': return this.sim.customL1x();
      case 'L2': return this.sim.customL2x();
      case 'L3': return this.sim.customL3x();
      case 'L4': return this.sim.customL4x();
      case 'R1': return this.sim.customR1x();
      case 'R2': return this.sim.customR2x();
      case 'R3': return this.sim.customR3x();
      case 'R4': return this.sim.customR4x();
    }
  });

  currentVertexZ = computed(() => {
    const v = this.selectedVertex();
    switch (v) {
      case 'L1': return this.sim.customL1z();
      case 'L2': return this.sim.customL2z();
      case 'L3': return this.sim.customL3z();
      case 'L4': return this.sim.customL4z();
      case 'R1': return this.sim.customR1z();
      case 'R2': return this.sim.customR2z();
      case 'R3': return this.sim.customR3z();
      case 'R4': return this.sim.customR4z();
    }
  });

  vertexMinX = computed(() => {
    return this.selectedSide() === 'left' ? -15.0 : 0.0;
  });

  vertexMaxX = computed(() => {
    return this.selectedSide() === 'left' ? 0.0 : 15.0;
  });

  vertexMinZ = computed(() => -20.0);
  vertexMaxZ = computed(() => 10.0);
}
