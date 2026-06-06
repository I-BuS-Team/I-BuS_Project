import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AdminRutasService, Usuario } from '../gestionar-rutas/services/admin-rutas.service';

@Component({
  selector: 'app-gestionar-usuarios',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule, CommonModule],
  templateUrl: './gestionar-usuarios.html',
  styleUrl: './gestionar-usuarios.scss',
})
export class GestionarUsuarios implements OnInit {
  usuarioForm!: FormGroup;
  allUsuarios: Usuario[] = [];
  searchResults: Usuario[] = [];
  showSearchResults = false;
  selectedUsuarioId: number | null = null;
  
  mensajeFeedback = '';
  tipoFeedback: 'exito' | 'error' = 'exito';

  constructor(
    private fb: FormBuilder,
    private adminService: AdminRutasService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.usuarioForm = this.fb.group({
      buscar: [''],
      idUsuario: [{ value: '', disabled: true }],
      email: ['', [Validators.required, Validators.email]],
      contrasena: ['', [Validators.required]],
      idTipoUsuario: [2, [Validators.required]], // Default 2 = Pasajero, 1 = Admin
    });

    this.cargarDatos();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    this.showSearchResults = false;
  }

  cargarDatos(): void {
    this.adminService.getUsuarios().subscribe({
      next: (users) => {
        this.allUsuarios = users;
        this.cdr.detectChanges();
      },
      error: (e) => {
        console.error('Error cargando usuarios:', e);
        this.cdr.detectChanges();
      }
    });
  }

  onSearchInput(): void {
    const query = this.usuarioForm.get('buscar')?.value?.toLowerCase() || '';
    if (!query) {
      this.searchResults = [];
      this.showSearchResults = false;
      return;
    }

    this.searchResults = this.allUsuarios.filter(u => 
      u.id?.toString() === query || u.email.toLowerCase().includes(query)
    );
    this.showSearchResults = true;
  }

  selectUsuario(u: Usuario): void {
    this.selectedUsuarioId = u.id || null;
    
    this.usuarioForm.patchValue({
      idUsuario: u.id ? `U - ${u.id}` : '',
      email: u.email,
      contrasena: u.contrasena,
      idTipoUsuario: u.idTipoUsuario,
      buscar: ''
    });

    this.usuarioForm.get('contrasena')?.setValidators([Validators.required]);
    this.usuarioForm.get('contrasena')?.updateValueAndValidity();

    this.showSearchResults = false;
    this.cdr.detectChanges();
  }

  onNuevoUsuario(): void {
    this.selectedUsuarioId = null;
    this.usuarioForm.patchValue({
      idUsuario: 'Creando Nuevo Usuario',
      email: '',
      contrasena: '',
      idTipoUsuario: 2,
      buscar: ''
    });
    this.usuarioForm.get('contrasena')?.setValidators([Validators.required]);
    this.usuarioForm.get('contrasena')?.updateValueAndValidity();
    this.cdr.detectChanges();
  }

  mostrarFeedback(mensaje: string, tipo: 'exito' | 'error'): void {
    this.mensajeFeedback = mensaje;
    this.tipoFeedback = tipo;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.mensajeFeedback = '';
      this.cdr.detectChanges();
    }, 5000);
  }

  onSubmit(): void {
    if (this.usuarioForm.invalid) {
      this.mostrarFeedback('Por favor complete todos los campos obligatorios.', 'error');
      return;
    }

    const formVal = this.usuarioForm.getRawValue();
    const usuarioData: Usuario = {
      email: formVal.email,
      contrasena: formVal.contrasena,
      idTipoUsuario: Number(formVal.idTipoUsuario)
    };

    if (this.selectedUsuarioId) {
      // Actualizar
      this.adminService.actualizarUsuario(this.selectedUsuarioId, usuarioData).subscribe({
        next: (res) => {
          this.mostrarFeedback('Usuario actualizado exitosamente.', 'exito');
          this.selectUsuario(res);
          this.cargarDatos();
        },
        error: (err) => {
          console.error(err);
          this.mostrarFeedback(err.error?.detail || 'Error al actualizar el usuario.', 'error');
          this.cdr.detectChanges();
        }
      });
    } else {
      // Crear
      this.adminService.crearUsuario(usuarioData).subscribe({
        next: (res) => {
          this.mostrarFeedback('Usuario creado exitosamente.', 'exito');
          this.selectUsuario(res);
          this.cargarDatos();
        },
        error: (err) => {
          console.error(err);
          this.mostrarFeedback(err.error?.detail || 'Error al crear el usuario.', 'error');
          this.cdr.detectChanges();
        }
      });
    }
  }

  onEliminar(): void {
    if (!this.selectedUsuarioId) {
      this.mostrarFeedback('Seleccione un usuario para poder eliminarlo.', 'error');
      return;
    }

    if (confirm('¿Está seguro de que desea eliminar este usuario?')) {
      this.adminService.eliminarUsuario(this.selectedUsuarioId).subscribe({
        next: () => {
          this.mostrarFeedback('Usuario eliminado con éxito.', 'exito');
          this.onNuevoUsuario();
          this.cargarDatos();
        },
        error: (err) => {
          console.error(err);
          this.mostrarFeedback(err.error?.detail || 'Error al eliminar el usuario.', 'error');
          this.cdr.detectChanges();
        }
      });
    }
  }
}

