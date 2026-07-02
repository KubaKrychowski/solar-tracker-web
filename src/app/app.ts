import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule, RouterOutlet, MatSidenavModule,
    MatIconModule, MatButtonModule, MatTooltipModule,
    SidebarComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly breakpointObserver = inject(BreakpointObserver);

  readonly isMobile = toSignal(
    this.breakpointObserver.observe('(max-width: 768px)').pipe(map(r => r.matches)),
    { initialValue: false }
  );

  mobileOpen = false;
  darkMode = signal(true);

  toggleTheme(): void {
    this.darkMode.update(v => !v);
    document.body.style.colorScheme = this.darkMode() ? 'dark' : 'light';
  }

  onNavClick(): void {
    if (this.isMobile()) {
      this.mobileOpen = false;
    }
  }
}
