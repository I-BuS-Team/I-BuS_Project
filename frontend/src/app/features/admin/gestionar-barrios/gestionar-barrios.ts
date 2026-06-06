import { Component, OnInit, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AdminRutasService, Barrio, Ruta } from '../gestionar-rutas/services/admin-rutas.service';

@Component({
  selector: 'app-gestionar-barrios',
  imports: [ReactiveFormsModule, RouterModule, CommonModule],
  templateUrl: './gestionar-barrios.html',
  styleUrl: './gestionar-barrios.scss',
})
export class GestionarBarrios implements OnInit {
  barrioForm!: FormGroup;
  allBarrios: Barrio[] = [];
  allRutas: Ruta[] = [];
  
  searchResults: Barrio[] = [];
  showSearchResults = false;
  selectedBarrioId: number | null = null;
  
  mostrarSelectorRutas = false;
  
  mensajeFeedback = '';
  tipoFeedback: 'exito' | 'error' = 'exito';

  constructor(
    private fb: FormBuilder,
    private adminService: AdminRutasService
  ) {}

  ngOnInit(): void {
    this.barrioForm = this.fb.group({
      buscar: [''],
      idBarrio: [{ value: '', disabled: true }],
      nombreBarrio: ['', [Validators.required]],
    });

    this.cargarDatos();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    this.showSearchResults = false;
  }

  cargarDatos(): void {
    this.adminService.getBarrios().subscribe({
      next: (b) => {
        this.allBarrios = b;
      },
      error: (e) => console.error('Error cargando barrios:', e)
    });

    this.adminService.getRutas().subscribe({
      next: (r) => {
        this.allRutas = r;
      },
      error: (e) => console.error('Error cargando rutas:', e)
    });
  }

  onSearchInput(): void {
    const query = this.barrioForm.get('buscar')?.value?.toLowerCase() || '';
    if (!query) {
      this.searchResults = [...this.allBarrios];
      this.showSearchResults = true;
      return;
    }

    this.searchResults = this.allBarrios.filter(b => 
      b.id?.toString() === query || b.nombre.toLowerCase().includes(query)
    );
    this.showSearchResults = true;
  }

  selectBarrio(b: Barrio): void {
    this.selectedBarrioId = b.id || null;
    this.mostrarSelectorRutas = false;
    
    this.barrioForm.patchValue({
      idBarrio: b.id ? `B - ${b.id}` : '',
      nombreBarrio: b.nombre,
      buscar: ''
    });

    this.showSearchResults = false;
  }

  onNuevoBarrio(): void {
    this.selectedBarrioId = null;
    this.mostrarSelectorRutas = false;
    this.barrioForm.patchValue({
      idBarrio: 'Creando Nuevo Barrio',
      nombreBarrio: '',
      buscar: ''
    });
  }

  getBarrioName(id: number): string {
    const b = this.allBarrios.find(item => item.id === id);
    return b ? b.nombre : `Barrio ${id}`;
  }

  get rutasAsignadas(): Ruta[] {
    const barrioId = this.selectedBarrioId;
    if (!barrioId) return [];
    return this.allRutas.filter(r => 
      r.inicioRuta_id === barrioId || 
      r.destinoRuta_id === barrioId || 
      (r.barrio_ids && r.barrio_ids.includes(barrioId))
    );
  }

  get rutasDisponibles(): Ruta[] {
    const barrioId = this.selectedBarrioId;
    if (!barrioId) return [];
    return this.allRutas.filter(r => 
      r.inicioRuta_id !== barrioId && 
      r.destinoRuta_id !== barrioId && 
      !(r.barrio_ids && r.barrio_ids.includes(barrioId))
    );
  }

  getRouteName(r: Ruta): string {
    const start = this.getBarrioName(r.inicioRuta_id);
    const end = this.getBarrioName(r.destinoRuta_id);
    return `Ruta ${r.id} (${start} - ${end})`;
  }

  quitarRuta(ruta: Ruta): void {
    if (!this.selectedBarrioId) return;

    if (ruta.inicioRuta_id === this.selectedBarrioId || ruta.destinoRuta_id === this.selectedBarrioId) {
      this.mostrarFeedback('No se puede quitar el barrio de esta ruta porque es su origen o destino. Edita la ruta directamente.', 'error');
      return;
    }

    if (confirm(`¿Está seguro de que desea quitar este barrio de la Ruta ${ruta.id}?`)) {
      const updatedBarrioIds = (ruta.barrio_ids || []).filter(id => id !== this.selectedBarrioId);
      const updatedRuta = { ...ruta, barrio_ids: updatedBarrioIds };

      this.adminService.actualizarRuta(ruta.id!, updatedRuta).subscribe({
        next: () => {
          this.mostrarFeedback('Barrio retirado de la ruta con éxito.', 'exito');
          this.cargarDatos();
        },
        error: (err) => {
          console.error(err);
          this.mostrarFeedback('Error al actualizar la ruta.', 'error');
        }
      });
    }
  }

  agregarRutaClick(): void {
    if (!this.selectedBarrioId) {
      this.mostrarFeedback('Debe seleccionar o guardar un barrio antes de asignarle rutas.', 'error');
      return;
    }
    this.mostrarSelectorRutas = !this.mostrarSelectorRutas;
  }

  onSeleccionarRutaParaAgregar(event: Event): void {
    const selectEl = event.target as HTMLSelectElement;
    const rutaId = Number(selectEl.value);
    if (!rutaId || !this.selectedBarrioId) return;

    const ruta = this.allRutas.find(r => r.id === rutaId);
    if (ruta) {
      const updatedBarrioIds = [...(ruta.barrio_ids || []), this.selectedBarrioId];
      const updatedRuta = { ...ruta, barrio_ids: updatedBarrioIds };

      this.adminService.actualizarRuta(ruta.id!, updatedRuta).subscribe({
        next: () => {
          this.mostrarFeedback('Barrio asignado a la ruta con éxito.', 'exito');
          this.mostrarSelectorRutas = false;
          this.cargarDatos();
        },
        error: (err) => {
          console.error(err);
          this.mostrarFeedback('Error al asignar barrio a la ruta.', 'error');
        }
      });
    }
  }

  mostrarFeedback(mensaje: string, tipo: 'exito' | 'error'): void {
    this.mensajeFeedback = mensaje;
    this.tipoFeedback = tipo;
    setTimeout(() => {
      this.mensajeFeedback = '';
    }, 5000);
  }

  onSubmit(): void {
    if (this.barrioForm.invalid) {
      this.mostrarFeedback('Por favor complete todos los campos obligatorios.', 'error');
      return;
    }

    const formVal = this.barrioForm.value;
    const barrioData: Barrio = {
      nombre: formVal.nombreBarrio
    };

    if (this.selectedBarrioId) {
      // Actualizar
      this.adminService.actualizarBarrio(this.selectedBarrioId, barrioData).subscribe({
        next: (res) => {
          this.mostrarFeedback('Barrio actualizado exitosamente.', 'exito');
          this.selectBarrio(res);
          this.cargarDatos();
        },
        error: (err) => {
          console.error(err);
          this.mostrarFeedback(err.error?.detail || 'Error al actualizar el barrio.', 'error');
        }
      });
    } else {
      // Crear
      this.adminService.crearBarrio(barrioData).subscribe({
        next: (res) => {
          this.mostrarFeedback('Barrio creado exitosamente.', 'exito');
          this.selectBarrio(res);
          this.cargarDatos();
        },
        error: (err) => {
          console.error(err);
          this.mostrarFeedback(err.error?.detail || 'Error al crear el barrio.', 'error');
        }
      });
    }
  }

  onEliminar(): void {
    if (!this.selectedBarrioId) {
      this.mostrarFeedback('Seleccione un barrio para poder eliminarlo.', 'error');
      return;
    }

    if (confirm('¿Está seguro de que desea eliminar este barrio?')) {
      this.adminService.eliminarBarrio(this.selectedBarrioId).subscribe({
        next: () => {
          this.mostrarFeedback('Barrio eliminado con éxito.', 'exito');
          this.onNuevoBarrio();
          this.cargarDatos();
        },
        error: (err) => {
          console.error(err);
          this.mostrarFeedback(err.error?.detail || 'Error al eliminar el barrio.', 'error');
        }
      });
    }
  }
}
