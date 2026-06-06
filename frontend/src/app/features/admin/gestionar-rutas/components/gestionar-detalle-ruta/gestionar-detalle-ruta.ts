import { Component, OnInit, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AdminRutasService, DetalleRuta, Ruta, Tiempo, Barrio, Empresa } from '../../services/admin-rutas.service';

@Component({
  selector: 'app-gestionar-detalle-ruta',
  imports: [ReactiveFormsModule, RouterModule, CommonModule],
  templateUrl: './gestionar-detalle-ruta.html',
  styleUrl: './gestionar-detalle-ruta.scss',
})
export class GestionarDetalleRuta implements OnInit {
  detalleForm!: FormGroup;
  allDetalles: DetalleRuta[] = [];
  allRutas: Ruta[] = [];
  allTiempos: Tiempo[] = [];
  allBarrios: Barrio[] = [];
  allEmpresas: Empresa[] = [];
  
  searchResults: DetalleRuta[] = [];
  showSearchResults = false;
  selectedDetalleId: number | null = null;
  
  mensajeFeedback = '';
  tipoFeedback: 'exito' | 'error' = 'exito';

  constructor(
    private fb: FormBuilder,
    private adminService: AdminRutasService
  ) {}

  ngOnInit(): void {
    this.detalleForm = this.fb.group({
      buscar: [''],
      idDetalleRuta: [{ value: '', disabled: true }],
      idRuta: ['', [Validators.required]],
      idTiempo: ['', [Validators.required]],
      cantidadPasajeros: ['', [Validators.required, Validators.min(0)]],
    });

    this.cargarDatos();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    this.showSearchResults = false;
  }

  cargarDatos(): void {
    this.adminService.getBarrios().subscribe({
      next: (b) => this.allBarrios = b,
      error: (e) => console.error(e)
    });

    this.adminService.getEmpresas().subscribe({
      next: (e) => this.allEmpresas = e,
      error: (err) => console.error(err)
    });

    this.adminService.getRutas().subscribe({
      next: (r) => this.allRutas = r,
      error: (e) => console.error('Error cargando rutas:', e)
    });

    this.adminService.getTiempos().subscribe({
      next: (t) => this.allTiempos = t,
      error: (e) => console.error('Error cargando tiempos:', e)
    });

    this.adminService.getDetalles().subscribe({
      next: (d) => {
        this.allDetalles = d;
      },
      error: (e) => console.error('Error cargando detalles de rutas:', e)
    });
  }

  onSearchInput(): void {
    const query = this.detalleForm.get('buscar')?.value?.toLowerCase() || '';
    if (!query) {
      this.searchResults = [...this.allDetalles];
      this.showSearchResults = true;
      return;
    }

    this.searchResults = this.allDetalles.filter(d => {
      const idMatches = d.id?.toString() === query;
      const countMatches = d.cantidadPasajeros.toString().includes(query);
      
      const route = this.allRutas.find(r => r.id === d.idRuta);
      const routeMatches = route?.id?.toString() === query || 
                           this.getRouteLabel(route).toLowerCase().includes(query);
                           
      const tiempo = this.allTiempos.find(t => t.id === d.idTiempo);
      const tiempoMatches = tiempo?.fecha.includes(query) || false;

      return idMatches || countMatches || routeMatches || tiempoMatches;
    });

    this.showSearchResults = true;
  }

  selectDetalle(d: DetalleRuta): void {
    this.selectedDetalleId = d.id || null;
    this.detalleForm.patchValue({
      idDetalleRuta: d.id ? `D - ${d.id}` : '',
      idRuta: d.idRuta,
      idTiempo: d.idTiempo,
      cantidadPasajeros: d.cantidadPasajeros,
      buscar: ''
    });

    this.showSearchResults = false;
  }

  onNuevoDetalle(): void {
    this.selectedDetalleId = null;
    this.detalleForm.patchValue({
      idDetalleRuta: 'Creando Nuevo Detalle',
      idRuta: '',
      idTiempo: '',
      cantidadPasajeros: '',
      buscar: ''
    });
  }

  getRouteLabel(r: Ruta | undefined): string {
    if (!r) return 'Ruta Desconocida';
    const emp = this.allEmpresas.find(e => e.id === r.idEmpresa)?.nombreEmpresa || 'Bus';
    const inicio = this.allBarrios.find(b => b.id === r.inicioRuta_id)?.nombre || 'Origen';
    const destino = this.allBarrios.find(b => b.id === r.destinoRuta_id)?.nombre || 'Destino';
    return `Ruta ${r.id} (${emp}): ${inicio} -> ${destino}`;
  }

  getRouteLabelById(routeId: number): string {
    const r = this.allRutas.find(rt => rt.id === routeId);
    return this.getRouteLabel(r);
  }

  getTiempoLabel(id: number): string {
    const t = this.allTiempos.find(temp => temp.id === id);
    return t ? t.fecha : `Fecha ID: ${id}`;
  }

  getBarrioName(id: number): string {
    const barrio = this.allBarrios.find(b => b.id === id);
    return barrio ? barrio.nombre : `Barrio ${id}`;
  }

  getEmpresaName(id: number): string {
    const emp = this.allEmpresas.find(e => e.id === id);
    return emp ? emp.nombreEmpresa : `Empresa ${id}`;
  }

  mostrarFeedback(mensaje: string, tipo: 'exito' | 'error'): void {
    this.mensajeFeedback = mensaje;
    this.tipoFeedback = tipo;
    setTimeout(() => {
      this.mensajeFeedback = '';
    }, 5000);
  }

  onSubmit(): void {
    if (this.detalleForm.invalid) {
      this.mostrarFeedback('Por favor complete todos los campos obligatorios.', 'error');
      return;
    }

    const formVal = this.detalleForm.value;
    const detalleData: DetalleRuta = {
      idRuta: Number(formVal.idRuta),
      idTiempo: Number(formVal.idTiempo),
      cantidadPasajeros: Number(formVal.cantidadPasajeros)
    };

    if (this.selectedDetalleId) {
      // Actualizar
      this.adminService.actualizarDetalle(this.selectedDetalleId, detalleData).subscribe({
        next: (res) => {
          this.mostrarFeedback('Detalle de pasajeros actualizado exitosamente.', 'exito');
          this.selectDetalle(res);
          this.cargarDatos();
        },
        error: (err) => {
          console.error(err);
          this.mostrarFeedback(err.error?.detail || 'Error al actualizar el detalle.', 'error');
        }
      });
    } else {
      // Crear
      this.adminService.crearDetalle(detalleData).subscribe({
        next: (res) => {
          this.mostrarFeedback('Detalle de pasajeros creado exitosamente.', 'exito');
          this.selectDetalle(res);
          this.cargarDatos();
        },
        error: (err) => {
          console.error(err);
          this.mostrarFeedback(err.error?.detail || 'Error al crear el detalle.', 'error');
        }
      });
    }
  }

  onEliminar(): void {
    if (!this.selectedDetalleId) {
      this.mostrarFeedback('Seleccione un detalle de pasajeros para poder eliminarlo.', 'error');
      return;
    }

    if (confirm('¿Está seguro de que desea eliminar este registro de detalle de pasajeros?')) {
      this.adminService.eliminarDetalle(this.selectedDetalleId).subscribe({
        next: () => {
          this.mostrarFeedback('Detalle de pasajeros eliminado con éxito.', 'exito');
          this.onNuevoDetalle();
          this.cargarDatos();
        },
        error: (err) => {
          console.error(err);
          this.mostrarFeedback(err.error?.detail || 'Error al eliminar el detalle.', 'error');
        }
      });
    }
  }
}
