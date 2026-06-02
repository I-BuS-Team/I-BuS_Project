import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule]
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  mensajeError = '';
  cargando = false;
  submitted = false;
  errorEmail = '';
  errorPassword = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });

    // Limpiar errores cuando el usuario modifica los campos
    this.loginForm.valueChanges.subscribe(() => {
      this.errorEmail = '';
      this.errorPassword = '';
      this.mensajeError = '';
    });
  }

  hasError(controlName: string): boolean {
    const control = this.loginForm.get(controlName);
    if (!control) return false;
    
    const hasClientError = control.invalid && (control.touched || control.dirty || this.submitted);
    const hasApiError = (controlName === 'email' && !!this.errorEmail) || (controlName === 'password' && !!this.errorPassword);
    
    return hasClientError || hasApiError;
  }

  getErrorMessage(controlName: string): string {
    const control = this.loginForm.get(controlName);
    if (!control) return '';

    if (control.hasError('required')) {
      if (controlName === 'email') return 'El correo electrónico es requerido.';
      if (controlName === 'password') return 'La contraseña es requerida.';
    }
    if (control.hasError('email') || control.hasError('pattern')) {
      return 'El formato del correo electrónico no es válido.';
    }
    if (control.hasError('minlength')) {
      return 'La contraseña debe tener al menos 6 caracteres.';
    }

    if (controlName === 'email' && this.errorEmail) {
      return this.errorEmail;
    }
    if (controlName === 'password' && this.errorPassword) {
      return this.errorPassword;
    }

    return '';
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.loginForm.valid) {
      this.cargando = true;
      this.mensajeError = '';
      this.errorEmail = '';
      this.errorPassword = '';
      this.cdr.detectChanges();

      this.authService.login(this.loginForm.value).subscribe({
        next: (response) => {
          this.cargando = false;
          this.cdr.detectChanges();
          console.log('Login exitoso:', response);
          
          const user = response?.user;
          const email = user?.email;
          const idTipo = user?.user_metadata?.['idTipoUsuario'];
          
          if (email === 'admin@ibus.com' || idTipo === 1 || idTipo === '1') {
            this.router.navigate(['/admin/dashboard']);
          } else {
            this.router.navigate(['/usuario/buscar-rutas']);
          }
        },
        error: (err) => {
          this.cargando = false;
          console.warn('Error en el login:', err);
          if (err.message === 'Invalid login credentials' || err.status === 400 || err.status === 401) {
            this.errorEmail = '';
            this.errorPassword = 'Contraseña incorrecta o correo no registrado.';
          } else {
            this.mensajeError = err.message || 'Ocurrió un error inesperado al iniciar sesión.';
          }
          this.cdr.detectChanges();
        }
      });
    } else {
      this.cdr.detectChanges();
    }
  }
}