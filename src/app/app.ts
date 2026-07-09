import { 
  Component, 
  ElementRef, 
  ViewChild, 
  signal, 
  OnInit, 
  OnDestroy, 
  inject, 
  PLATFORM_ID,
  ChangeDetectionStrategy
} from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { SimulatorService } from './simulator.service';
import { MenuComponent } from './menu/menu.component';
import { SimulatorControlsComponent } from './simulator-controls/simulator-controls.component';

@Component({
  selector: 'app-root',
  imports: [CommonModule, MenuComponent, SimulatorControlsComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App implements OnInit, OnDestroy {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  sim = inject(SimulatorService);
  private platformId = inject(PLATFORM_ID);
  

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.sim.init(this.canvasRef.nativeElement, true);
      }, 100);
    }
  }

  ngOnDestroy() {
    this.sim.destroy();
  }
}
