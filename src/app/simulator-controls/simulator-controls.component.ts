import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuizComponent } from '../quiz/quiz.component';
import { SimulatorService } from '../simulator.service';

@Component({
  selector: 'app-simulator-controls',
  imports: [CommonModule, QuizComponent],
  templateUrl: './simulator-controls.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SimulatorControlsComponent {
  sim = inject(SimulatorService);
}
