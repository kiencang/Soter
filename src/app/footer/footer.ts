import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-footer',
  template: `
    <p class="text-[10px] text-slate-500 font-mono">Soter • v1.0.17 • <a href="https://github.com/kiencang/Soter" target="_blank" rel="noopener noreferrer" class="hover:text-slate-300 transition-colors">GitHub</a> • Dự án An toàn Giao thông</p>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Footer {}
