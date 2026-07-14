import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
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
}
