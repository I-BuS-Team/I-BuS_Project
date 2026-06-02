import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule]
})
export class RegistroComponent implements OnInit {
  registroForm!: FormGroup;
  mensajeError = '';
  mensajeExito = '';
  cargando = false;
  submitted = false;
  errorNombre = '';
  errorEmail = '';
  errorPassword = '';
  errorTerminos = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.registroForm = this.fb.group({
      nombre: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      terminos: [false, Validators.requiredTrue]
    });

    // Limpiar errores cuando el usuario modifica los campos
    this.registroForm.valueChanges.subscribe(() => {
      this.errorNombre = '';
      this.errorEmail = '';
      this.errorPassword = '';
      this.errorTerminos = '';
      this.mensajeError = '';
    });
  }

  hasError(controlName: string): boolean {
    const control = this.registroForm.get(controlName);
    if (!control) return false;

    const hasClientError = control.invalid && (control.touched || control.dirty || this.submitted);
    const hasApiError = 
      (controlName === 'nombre' && !!this.errorNombre) ||
      (controlName === 'email' && !!this.errorEmail) ||
      (controlName === 'password' && !!this.errorPassword) ||
      (controlName === 'terminos' && !!this.errorTerminos);

    return hasClientError || hasApiError;
  }

  getErrorMessage(controlName: string): string {
    const control = this.registroForm.get(controlName);
    if (!control) return '';

    if (control.hasError('required')) {
      if (controlName === 'nombre') return 'El nombre es requerido.';
      if (controlName === 'email') return 'El correo electrónico es requerido.';
      if (controlName === 'password') return 'La contraseña es requerida.';
    }
    if (control.hasError('requiredTrue') && controlName === 'terminos') {
      return 'Debes aceptar los términos y condiciones.';
    }
    if (control.hasError('email') || control.hasError('pattern')) {
      return 'El formato del correo electrónico no es válido.';
    }
    if (control.hasError('minlength')) {
      return 'La contraseña debe tener al menos 6 caracteres.';
    }

    if (controlName === 'nombre' && this.errorNombre) return this.errorNombre;
    if (controlName === 'email' && this.errorEmail) return this.errorEmail;
    if (controlName === 'password' && this.errorPassword) return this.errorPassword;
    if (controlName === 'terminos' && this.errorTerminos) return this.errorTerminos;

    return '';
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.registroForm.valid) {
      this.cargando = true;
      this.mensajeError = '';
      this.mensajeExito = '';
      this.errorNombre = '';
      this.errorEmail = '';
      this.errorPassword = '';
      this.errorTerminos = '';
      this.cdr.detectChanges();

      this.authService.register(this.registroForm.value).subscribe({
        next: (res) => {
          this.cargando = false;
          // Si res no tiene sesión pero sí usuario, y no es modo offline, requiere confirmación
          const requiereConfirmacion = res && !res.session && res.user && !this.authService.isOfflineMode();
          
          if (requiereConfirmacion) {
            this.mensajeExito = '¡Registro exitoso! Te hemos enviado un correo de confirmación. Por favor, verifica tu bandeja de entrada para activar tu cuenta.';
          } else {
            this.mensajeExito = '¡Registro exitoso! Redirigiendo al inicio de sesión...';
            setTimeout(() => {
              this.router.navigate(['/auth/login']);
            }, 2000);
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.cargando = false;
          console.warn('Error en el registro Supabase:', err);
          if (err.message === 'User already registered' || err.message?.includes('already registered') || err.status === 400) {
            this.errorEmail = 'Este correo electrónico ya se encuentra registrado.';
          } else {
            this.mensajeError = err.message || 'Ocurrió un error inesperado al registrar el usuario.';
          }
          this.cdr.detectChanges();
        }
      });
    } else {
      this.cdr.detectChanges();
    }
  }
}