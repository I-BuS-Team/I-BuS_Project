import { Component, OnInit, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AdminRutasService, Ruta, Barrio, Empresa, Horario } from './services/admin-rutas.service';

@Component({
  selector: 'app-gestionar-rutas',
  imports: [ReactiveFormsModule, RouterModule, CommonModule],
  templateUrl: './gestionar-rutas.html',
  styleUrl: './gestionar-rutas.scss',
})
export class GestionarRutas implements OnInit {
  rutaForm!: FormGroup;
  allRutas: Ruta[] = [];
  allBarrios: Barrio[] = [];
  allEmpresas: Empresa[] = [];
  allHorarios: Horario[] = [];
  
  searchResults: Ruta[] = [];
  showSearchResults = false;
  selectedRouteId: number | null = null;
  selectedBarrioIds: number[] = [];
  
  mensajeFeedback = '';
  tipoFeedback: 'exito' | 'error' = 'exito';

  constructor(
    private fb: FormBuilder,
    private adminService: AdminRutasService
  ) {}

  ngOnInit(): void {
    this.rutaForm = this.fb.group({
      buscar: [''],
      idRuta: [{ value: '', disabled: true }],
      nombreRuta: [{ value: '', disabled: true }],
      horario: [{ value: '', disabled: true }],
      frecuencia: ['', [Validators.required]],
      empresa: ['', [Validators.required]],
      inicioRuta_id: ['', [Validators.required]],
      destinoRuta_id: ['', [Validators.required]],
    });

    this.cargarDatos();

    // Escuchar cambios en la empresa para actualizar el campo horario dinámicamente
    this.rutaForm.get('empresa')?.valueChanges.subscribe(empId => {
      if (empId) {
        this.actualizarCampoHorario(Number(empId));
      }
    });

    // Escuchar cambios en inicioRuta_id y destinoRuta_id para actualizar el nombre de la ruta dinámicamente
    this.rutaForm.valueChanges.subscribe(() => {
      this.actualizarNombreRuta();
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    this.showSearchResults = false;
  }

  cargarDatos(): void {
    this.adminService.getBarrios().subscribe({
      next: (b) => this.allBarrios = b,
      error: (e) => console.error('Error cargando barrios:', e)
    });

    this.adminService.getEmpresas().subscribe({
      next: (e) => this.allEmpresas = e,
      error: (err) => console.error('Error cargando empresas:', err)
    });

    this.adminService.getHorarios().subscribe({
      next: (h) => this.allHorarios = h,
      error: (e) => console.error('Error cargando horarios:', e)
    });

    this.adminService.getRutas().subscribe({
      next: (r) => {
        this.allRutas = r;
      },
      error: (e) => console.error('Error cargando rutas:', e)
    });
  }

  onSearchInput(): void {
    const query = this.rutaForm.get('buscar')?.value?.toLowerCase() || '';
    if (!query) {
      this.searchResults = [];
      this.showSearchResults = false;
      return;
    }

    this.searchResults = this.allRutas.filter(r => {
      const idMatches = r.id?.toString() === query || `r-${r.id}`.toLowerCase().includes(query);
      const empresa = this.allEmpresas.find(e => e.id === r.idEmpresa);
      const empresaMatches = empresa?.nombreEmpresa.toLowerCase().includes(query) || false;
      const frecuenciaMatches = r.frecuencia.toLowerCase().includes(query);
      
      const inicio = this.allBarrios.find(b => b.id === r.inicioRuta_id);
      const destino = this.allBarrios.find(b => b.id === r.destinoRuta_id);
      const barrioMatches = (inicio?.nombre.toLowerCase().includes(query) || false) || 
                            (destino?.nombre.toLowerCase().includes(query) || false);

      return idMatches || empresaMatches || frecuenciaMatches || barrioMatches;
    });

    this.showSearchResults = true;
  }

  selectRoute(r: Ruta): void {
    this.selectedRouteId = r.id || null;
    this.selectedBarrioIds = r.barrio_ids || [];
    
    this.rutaForm.patchValue({
      idRuta: r.id ? `R - ${r.id}` : '',
      frecuencia: r.frecuencia,
      empresa: r.idEmpresa,
      inicioRuta_id: r.inicioRuta_id,
      destinoRuta_id: r.destinoRuta_id,
      buscar: ''
    });

    this.actualizarCampoHorario(r.idEmpresa);
    this.actualizarNombreRuta();
    this.showSearchResults = false;
  }

  onNuevaRuta(): void {
    this.selectedRouteId = null;
    this.selectedBarrioIds = [];
    this.rutaForm.patchValue({
      idRuta: 'Creando Nueva Ruta',
      nombreRuta: 'Ruta Nueva',
      horario: 'Por definir',
      frecuencia: '',
      empresa: '',
      inicioRuta_id: '',
      destinoRuta_id: '',
      buscar: ''
    });
  }

  actualizarCampoHorario(empresaId: number): void {
    const matched = this.allHorarios.filter(h => h.idEmpresa === empresaId);
    if (matched.length === 0) {
      this.rutaForm.get('horario')?.setValue('Sin horarios asignados', { emitEvent: false });
    } else {
      const scheduleStr = matched.map(h => `${h.horaSalida.substring(0, 5)} - ${h.horaLlegada.substring(0, 5)}`).join(', ');
      this.rutaForm.get('horario')?.setValue(scheduleStr, { emitEvent: false });
    }
  }

  actualizarNombreRuta(): void {
    const inicioId = this.rutaForm.get('inicioRuta_id')?.value;
    const destinoId = this.rutaForm.get('destinoRuta_id')?.value;
    const inicio = this.allBarrios.find(b => b.id === Number(inicioId))?.nombre || 'Origen';
    const destino = this.allBarrios.find(b => b.id === Number(destinoId))?.nombre || 'Destino';
    this.rutaForm.get('nombreRuta')?.setValue(`${inicio} - ${destino}`, { emitEvent: false });
  }

  getBarrioName(id: number): string {
    const barrio = this.allBarrios.find(b => b.id === id);
    return barrio ? barrio.nombre : `Barrio ${id}`;
  }

  getEmpresaName(id: number): string {
    const emp = this.allEmpresas.find(e => e.id === id);
    return emp ? emp.nombreEmpresa : `Empresa ${id}`;
  }

  getRoutePathString(r: Ruta): string {
    if (!r.barrio_ids || r.barrio_ids.length === 0) {
      const inicio = this.getBarrioName(r.inicioRuta_id);
      const destino = this.getBarrioName(r.destinoRuta_id);
      return `${inicio} -> ${destino}`;
    }
    return r.barrio_ids.map(bId => this.getBarrioName(bId)).join(' -> ');
  }

  addBarrioToPath(barrioIdVal: string): void {
    if (!barrioIdVal) return;
    const bId = Number(barrioIdVal);
    if (!this.selectedBarrioIds.includes(bId)) {
      this.selectedBarrioIds.push(bId);
      
      // Auto-actualizar inicio y destino si corresponde
      if (this.selectedBarrioIds.length === 1) {
        this.rutaForm.patchValue({ inicioRuta_id: bId });
      }
      this.rutaForm.patchValue({ destinoRuta_id: bId });
    }
  }

  removeBarrioFromPath(index: number): void {
    this.selectedBarrioIds.splice(index, 1);
    
    // Auto-actualizar inicio y destino tras remover
    if (this.selectedBarrioIds.length > 0) {
      this.rutaForm.patchValue({
        inicioRuta_id: this.selectedBarrioIds[0],
        destinoRuta_id: this.selectedBarrioIds[this.selectedBarrioIds.length - 1]
      });
    } else {
      this.rutaForm.patchValue({
        inicioRuta_id: '',
        destinoRuta_id: ''
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
    if (this.rutaForm.invalid) {
      this.mostrarFeedback('Por favor complete todos los campos obligatorios.', 'error');
      return;
    }

    const formVal = this.rutaForm.value;
    const rutaData: Ruta = {
      idEmpresa: Number(formVal.empresa),
      inicioRuta_id: Number(formVal.inicioRuta_id),
      destinoRuta_id: Number(formVal.destinoRuta_id),
      frecuencia: formVal.frecuencia,
      barrio_ids: this.selectedBarrioIds
    };

    if (this.selectedRouteId) {
      // Actualizar
      this.adminService.actualizarRuta(this.selectedRouteId, rutaData).subscribe({
        next: (res) => {
          this.mostrarFeedback('Ruta actualizada exitosamente.', 'exito');
          this.cargarRutaActualizada(res);
        },
        error: (err) => {
          console.error(err);
          this.mostrarFeedback(err.error?.detail || 'Error al actualizar la ruta.', 'error');
        }
      });
    } else {
      // Crear
      this.adminService.crearRuta(rutaData).subscribe({
        next: (res) => {
          this.mostrarFeedback('Ruta creada exitosamente.', 'exito');
          this.cargarRutaActualizada(res);
        },
        error: (err) => {
          console.error(err);
          this.mostrarFeedback(err.error?.detail || 'Error al crear la ruta.', 'error');
        }
      });
    }
  }

  cargarRutaActualizada(r: Ruta): void {
    this.cargarDatos(); // Recargar todo
    this.selectedRouteId = r.id || null;
    this.selectedBarrioIds = r.barrio_ids || [];
    
    this.rutaForm.patchValue({
      idRuta: r.id ? `R - ${r.id}` : '',
      frecuencia: r.frecuencia,
      empresa: r.idEmpresa,
      inicioRuta_id: r.inicioRuta_id,
      destinoRuta_id: r.destinoRuta_id
    });
  }

  onEliminar(): void {
    if (!this.selectedRouteId) {
      this.mostrarFeedback('Seleccione una ruta para poder eliminarla.', 'error');
      return;
    }

    if (confirm('¿Está seguro de que desea eliminar esta ruta? Se eliminarán los detalles asociados.')) {
      this.adminService.eliminarRuta(this.selectedRouteId).subscribe({
        next: () => {
          this.mostrarFeedback('Ruta eliminada con éxito.', 'exito');
          this.onNuevaRuta();
          this.cargarDatos();
        },
        error: (err) => {
          console.error(err);
          this.mostrarFeedback(err.error?.detail || 'Error al eliminar la ruta.', 'error');
        }
      });
    }
  }
}
