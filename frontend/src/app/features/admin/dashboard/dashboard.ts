import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-dashboard',
  imports: [RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onCerrarSesion(): void {
    console.log('Cerrando sesión administrador...');
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/auth/login']);
      },
      error: (err) => {
        console.error('Error al cerrar sesión de administrador:', err);
        this.router.navigate(['/auth/login']);
      }
    });
  }
}
