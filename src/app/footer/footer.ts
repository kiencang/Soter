import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-footer',
  template: `
    <p class="text-[10px] text-slate-500 font-mono">Soter • v1.0.9 • Dự án An toàn Giao thông</p>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Footer {}
