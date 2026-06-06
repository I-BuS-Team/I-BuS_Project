import { Component, OnInit, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AdminRutasService, Tiempo } from '../../services/admin-rutas.service';

@Component({
  selector: 'app-gestionar-tiempos',
  imports: [ReactiveFormsModule, RouterModule, CommonModule],
  templateUrl: './gestionar-tiempos.html',
  styleUrl: './gestionar-tiempos.scss',
})
export class GestionarTiempos implements OnInit {
  tiempoForm!: FormGroup;
  allTiempos: Tiempo[] = [];
  
  searchResults: Tiempo[] = [];
  showSearchResults = false;
  selectedTiempoId: number | null = null;
  
  mensajeFeedback = '';
  tipoFeedback: 'exito' | 'error' = 'exito';

  constructor(
    private fb: FormBuilder,
    private adminService: AdminRutasService
  ) {}

  ngOnInit(): void {
    this.tiempoForm = this.fb.group({
      buscar: [''],
      idTiempo: [{ value: '', disabled: true }],
      fecha: ['', [Validators.required]],
    });

    this.cargarDatos();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    this.showSearchResults = false;
  }

  cargarDatos(): void {
    this.adminService.getTiempos().subscribe({
      next: (t) => {
        this.allTiempos = t;
      },
      error: (e) => console.error('Error cargando tiempos/fechas:', e)
    });
  }

  onSearchInput(): void {
    const query = this.tiempoForm.get('buscar')?.value?.toLowerCase() || '';
    if (!query) {
      this.searchResults = [...this.allTiempos];
      this.showSearchResults = true;
      return;
    }

    this.searchResults = this.allTiempos.filter(t => {
      const idMatches = t.id?.toString() === query;
      const fechaMatches = t.fecha.includes(query);
      return idMatches || fechaMatches;
    });

    this.showSearchResults = true;
  }

  selectTiempo(t: Tiempo): void {
    this.selectedTiempoId = t.id || null;
    this.tiempoForm.patchValue({
      idTiempo: t.id ? `T - ${t.id}` : '',
      fecha: t.fecha,
      buscar: ''
    });

    this.showSearchResults = false;
  }

  onNuevoTiempo(): void {
    this.selectedTiempoId = null;
    this.tiempoForm.patchValue({
      idTiempo: 'Creando Nuevo Tiempo',
      fecha: '',
      buscar: ''
    });
  }

  mostrarFeedback(mensaje: string, tipo: 'exito' | 'error'): void {
    this.mensajeFeedback = mensaje;
    this.tipoFeedback = tipo;
    setTimeout(() => {
      this.mensajeFeedback = '';
    }, 5000);
  }

  onSubmit(): void {
    if (this.tiempoForm.invalid) {
      this.mostrarFeedback('Por favor complete todos los campos obligatorios.', 'error');
      return;
    }

    const formVal = this.tiempoForm.value;
    const tiempoData: Tiempo = {
      fecha: formVal.fecha
    };

    if (this.selectedTiempoId) {
      // Actualizar
      this.adminService.actualizarTiempo(this.selectedTiempoId, tiempoData).subscribe({
        next: (res) => {
          this.mostrarFeedback('Tiempo/Fecha actualizado exitosamente.', 'exito');
          this.selectTiempo(res);
          this.cargarDatos();
        },
        error: (err) => {
          console.error(err);
          this.mostrarFeedback(err.error?.detail || 'Error al actualizar el tiempo.', 'error');
        }
      });
    } else {
      // Crear
      this.adminService.crearTiempo(tiempoData).subscribe({
        next: (res) => {
          this.mostrarFeedback('Tiempo/Fecha creado exitosamente.', 'exito');
          this.selectTiempo(res);
          this.cargarDatos();
        },
        error: (err) => {
          console.error(err);
          this.mostrarFeedback(err.error?.detail || 'Error al crear el tiempo.', 'error');
        }
      });
    }
  }

  onEliminar(): void {
    if (!this.selectedTiempoId) {
      this.mostrarFeedback('Seleccione un tiempo/fecha para poder eliminarlo.', 'error');
      return;
    }

    if (confirm('¿Está seguro de que desea eliminar este tiempo? Se eliminarán los detalles asociados.')) {
      this.adminService.eliminarTiempo(this.selectedTiempoId).subscribe({
        next: () => {
          this.mostrarFeedback('Tiempo/Fecha eliminado con éxito.', 'exito');
          this.onNuevoTiempo();
          this.cargarDatos();
        },
        error: (err) => {
          console.error(err);
          this.mostrarFeedback(err.error?.detail || 'Error al eliminar el tiempo/fecha.', 'error');
        }
      });
    }
  }
}
