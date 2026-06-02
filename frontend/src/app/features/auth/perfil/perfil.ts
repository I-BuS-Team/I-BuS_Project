import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule]
})
export class PerfilComponent implements OnInit {
  nombreUsuario = 'Usuario';
  emailUsuario = '';

  favoritos = [
    { tipo: 'casa', nombre: 'Casa', direccion: 'Calle 10 # 5-20' },
    { tipo: 'trabajo', nombre: 'Trabajo', direccion: 'Avenida El Dorado # 60-15' },
    { tipo: 'trabajo', nombre: 'Universidad', direccion: 'Carrera 30 # 45-03' },
    { tipo: 'casa', nombre: 'Casa de Abuela', direccion: 'Transversal 5 # 78-12' }
  ];

  historial = [
    { ruta: 'Ruta 1 - Circular Norte', tiempo: 'Hace 5 min' },
    { ruta: 'Ruta 5 - Expreso Sur', tiempo: 'Ayer' },
    { ruta: 'Ruta 10 - Transversal', tiempo: 'Hace 3 días' },
    { ruta: 'Ruta 3 - Alimentador', tiempo: 'Hace 1 week' }
  ];

  mostrarModalConfirmacion = false;
  mostrarModalAlerta = false;
  mensajeAlerta = '';

  constructor(
    private router: Router,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.cargarDatosUsuario();
  }

  cargarDatosUsuario(): void {
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        if (user) {
          this.nombreUsuario = user.user_metadata?.['nombre'] || user.email?.split('@')[0] || 'Usuario';
          this.emailUsuario = user.email || '';
        }
      },
      error: (err) => {
        console.warn('Error al cargar datos del usuario desde Supabase:', err);
      }
    });
  }

  onCerrarSesion(): void {
    console.log('Cerrando sesión...');
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/auth/login']);
      },
      error: (err) => {
        console.error('Error al cerrar sesión', err);
        this.router.navigate(['/auth/login']);
      }
    });
  }

  onEliminarCuenta(): void {
    this.mostrarModalConfirmacion = true;
  }

  cancelarEliminarCuenta(): void {
    this.mostrarModalConfirmacion = false;
  }

  confirmarEliminarCuenta(): void {
    this.mostrarModalConfirmacion = false;
    console.log('Solicitud para eliminar cuenta enviada');
    this.authService.deleteAccount().subscribe({
      next: (res) => {
        console.log('Cuenta eliminada', res);
        this.mensajeAlerta = 'Tu solicitud de eliminación ha sido recibida y se está procesando.';
        this.mostrarModalAlerta = true;
      },
      error: (err) => {
        console.error('Error al eliminar cuenta', err);
      }
    });
  }

  cerrarModalAlerta(): void {
    this.mostrarModalAlerta = false;
    this.router.navigate(['/auth/login']);
  }
}