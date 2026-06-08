import { Component, signal, OnInit, HostListener, OnDestroy } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from './features/auth/auth.service';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('frontend');
  
  private lastActivity: number = Date.now();
  private checkIntervalSub?: Subscription;
  private readonly TIMEOUT_MS = 20 * 60 * 1000; // 20 minutos

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Aplicar configuraciones de accesibilidad guardadas al iniciar la app
    const altoContraste = localStorage.getItem('altoContraste') === 'true';
    const modoOscuro = localStorage.getItem('modoOscuro') !== 'false'; // default to true
    const tamanoTexto = localStorage.getItem('tamanoTexto') ? Number(localStorage.getItem('tamanoTexto')) : 50;

    if (altoContraste) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }

    if (modoOscuro) {
      document.body.classList.add('dark');
      document.documentElement.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
      document.documentElement.classList.remove('dark');
    }

    const scale = tamanoTexto <= 50 
      ? 0.8 + ((tamanoTexto - 1) / 49) * 0.2 
      : 1.0 + ((tamanoTexto - 50) / 50) * 0.5;
    
    document.documentElement.style.fontSize = `${scale}rem`;
    document.documentElement.style.setProperty('--font-scale', scale.toString());

    // Iniciar temporizador de inactividad
    this.checkIntervalSub = interval(30000).subscribe(() => {
      this.checkInactivity();
    });
  }

  ngOnDestroy(): void {
    this.checkIntervalSub?.unsubscribe();
  }

  @HostListener('document:mousemove')
  @HostListener('document:click')
  @HostListener('document:keydown')
  @HostListener('document:scroll')
  @HostListener('document:touchstart')
  resetInactivityTimer(): void {
    this.lastActivity = Date.now();
  }

  private checkInactivity(): void {
    const now = Date.now();
    if (now - this.lastActivity > this.TIMEOUT_MS) {
      this.authService.getCurrentUser().subscribe(user => {
        if (user) {
          console.warn('Sesión expirada por inactividad.');
          this.authService.logout().subscribe(() => {
            this.router.navigate(['/auth/login'], { queryParams: { expired: 'true' } });
          });
        }
      });
    }
  }
}
