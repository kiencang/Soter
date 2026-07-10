import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SimulatorService } from '../simulator.service';
import { Footer } from '../footer/footer';

@Component({
  selector: 'app-menu',
  imports: [CommonModule, Footer],
  templateUrl: './menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MenuComponent {
  sim = inject(SimulatorService);
}
