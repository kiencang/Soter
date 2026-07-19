import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { SimulatorService } from '../simulator.service';

@Component({
  selector: 'app-footer',
  template: `
    <div class="flex flex-col items-center gap-2.5 w-full">
      <p class="text-[10px] text-slate-500 font-mono text-center">
        Soter • v1.0.44 • 
        <a href="https://github.com/kiencang/Soter" target="_blank" rel="noopener noreferrer" class="hover:text-slate-300 transition-colors">GitHub</a> • 
        Dự án An toàn Giao thông
      </p>
      
      <div class="relative group flex items-center gap-2 bg-slate-950/40 py-1 px-2.5 rounded-full border border-white/5 cursor-help">
        <!-- Tooltip -->
        <div class="absolute bottom-full mb-2.5 left-1/2 -translate-x-1/2 pointer-events-none z-50 w-52 opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 transition-all duration-200 ease-out flex flex-col items-center">
          <div class="bg-slate-950 text-slate-200 text-[10.5px] px-3 py-2 rounded-xl border border-white/10 shadow-2xl leading-relaxed text-center font-sans font-semibold">
            Chỉ dành cho lập trình viên dùng để căn chỉnh khoảng mù.
          </div>
          <div class="w-2 h-2 bg-slate-950 border-r border-b border-white/10 rotate-45 -mt-1"></div>
        </div>

        <span class="text-[9px] uppercase tracking-wider font-mono text-slate-400 font-bold">Chế độ Dev</span>
        <button (click)="sim.toggleDevMode()" 
                class="relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent items-center transition-colors duration-200 ease-in-out focus:outline-none"
                [class.bg-amber-500]="sim.isDevMode()"
                [class.bg-slate-800]="!sim.isDevMode()"
                id="dev-mode-toggle"
                aria-label="Bật tắt chế độ phát triển">
          <span class="pointer-events-none inline-block h-3 w-3 transform rounded-full bg-slate-100 shadow ring-0 transition duration-200 ease-in-out"
                [class.translate-x-4]="sim.isDevMode()"
                [class.translate-x-0]="!sim.isDevMode()"></span>
        </button>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Footer {
  protected sim = inject(SimulatorService);
}

