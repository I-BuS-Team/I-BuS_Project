import { Component, OnInit, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BarriosService, Barrio, RutaCalcularResponse, TramoRuta } from './services/barrios.service';

const MOCK_BARRIOS: Barrio[] = [
  { id: 6, nombre: 'Centro' },
  { id: 187, nombre: 'UPTC' },
  { id: 127, nombre: 'El Rosario' },
  { id: 132, nombre: 'José Antonio Galán' },
  { id: 137, nombre: 'La Isla' },
  { id: 149, nombre: 'Magdalena' },
  { id: 150, nombre: 'Monquirá' },
  { id: 152, nombre: 'Prado Norte' },
  { id: 169, nombre: 'Sugamuxi' },
  { id: 175, nombre: 'Villa del Sol' },
  { id: 184, nombre: 'La Tolva' },
  { id: 185, nombre: 'Vallado' },
  { id: 186, nombre: 'La Ramada' },
  { id: 188, nombre: 'Libertador' },
  { id: 189, nombre: 'Coliseo' },
  { id: 191, nombre: 'Morca' },
  { id: 192, nombre: 'Puente Pesca' },
  { id: 198, nombre: 'Plaza de Mercado' },
  { id: 204, nombre: 'Jardín' }
];

@Component({
  selector: 'app-buscar-rutas',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './buscar-rutas.html',
  styleUrl: './buscar-rutas.scss',
})
export class BuscarRutas implements OnInit {
  buscarForm!: FormGroup;
  mostrarDetalleRuta = false;
  barrios: Barrio[] = [];
  rutaCalculada: RutaCalcularResponse | null = null;
  mensajeError = '';
  cargando = false;
  modoOffline = false;

  dropdownOrigenAbierto = false;
  dropdownDestinoAbierto = false;

  constructor(
    private fb: FormBuilder,
    private barriosService: BarriosService
  ) {}

  ngOnInit(): void {
    this.buscarForm = this.fb.group({
      origen: ['', Validators.required],
      destino: ['', Validators.required],
    });

    this.cargarBarrios();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    this.dropdownOrigenAbierto = false;
    this.dropdownDestinoAbierto = false;
  }

  toggleDropdownOrigen(event: MouseEvent): void {
    event.stopPropagation();
    this.dropdownOrigenAbierto = !this.dropdownOrigenAbierto;
    this.dropdownDestinoAbierto = false;
  }

  toggleDropdownDestino(event: MouseEvent): void {
    event.stopPropagation();
    this.dropdownDestinoAbierto = !this.dropdownDestinoAbierto;
    this.dropdownOrigenAbierto = false;
  }

  seleccionarOrigen(id: number, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.buscarForm.patchValue({ origen: id });
    this.dropdownOrigenAbierto = false;
    this.buscarRuta();
  }

  seleccionarDestino(id: number, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.buscarForm.patchValue({ destino: id });
    this.dropdownDestinoAbierto = false;
    this.buscarRuta();
  }

  cargarBarrios(): void {
    this.barriosService.getBarrios().subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.barrios = data.sort((a, b) => a.nombre.localeCompare(b.nombre));
          this.modoOffline = false;
        } else {
          this.cargarFallbackBarrios();
        }
      },
      error: (err) => {
        console.warn('Error al cargar barrios del backend. Usando fallback local:', err);
        this.cargarFallbackBarrios();
      }
    });
  }

  cargarFallbackBarrios(): void {
    this.barrios = [...MOCK_BARRIOS].sort((a, b) => a.nombre.localeCompare(b.nombre));
    this.modoOffline = true;
  }

  buscarRuta(): void {
    if (this.buscarForm.invalid) {
      return;
    }

    const { origen, destino } = this.buscarForm.value;
    
    if (origen === destino) {
      this.mensajeError = 'El origen y el destino no pueden ser el mismo barrio.';
      this.rutaCalculada = null;
      this.mostrarDetalleRuta = true;
      return;
    }

    this.cargando = true;
    this.mensajeError = '';
    this.rutaCalculada = null;

    this.barriosService.calcularRuta(Number(origen), Number(destino)).subscribe({
      next: (response) => {
        this.rutaCalculada = response;
        this.mostrarDetalleRuta = true;
        this.cargando = false;
        this.modoOffline = false;
      },
      error: (err) => {
        console.warn('Error al calcular ruta en backend. Usando simulación local:', err);
        // Simulamos el resultado localmente si no conecta con el backend o si estamos en offline
        this.rutaCalculada = this.generateMockRoute(Number(origen), Number(destino));
        this.mostrarDetalleRuta = true;
        this.cargando = false;
        this.modoOffline = true;
      }
    });
  }

  generateMockRoute(origenId: number, destinoId: number): RutaCalcularResponse {
    const origenNombre = this.getNombreBarrio(origenId);
    const destinoNombre = this.getNombreBarrio(destinoId);
    
    const centroId = 6;
    const centroNombre = 'Centro';
    
    const camino: TramoRuta[] = [
      { barrio_id: origenId, nombre_barrio: origenNombre, ruta_id: null, nombre_ruta: null },
    ];
    
    if (origenId !== centroId && destinoId !== centroId) {
      camino.push({
        barrio_id: centroId,
        nombre_barrio: centroNombre,
        ruta_id: 38,
        nombre_ruta: 'Cootradelsol (Frecuencia: 5-10 min)'
      });
      camino.push({
        barrio_id: destinoId,
        nombre_barrio: destinoNombre,
        ruta_id: 39,
        nombre_ruta: 'Flota Sugamuxi (Frecuencia: 10 min)'
      });
    } else {
      camino.push({
        barrio_id: destinoId,
        nombre_barrio: destinoNombre,
        ruta_id: 38,
        nombre_ruta: 'TransAvella S.A. (Frecuencia: 8 min)'
      });
    }
    return {
      total_tramos: camino.length - 1,
      camino: camino
    };
  }

  getNombreBarrio(id: any): string {
    if (!id) return '';
    const barrio = this.barrios.find(b => b.id === Number(id));
    return barrio ? barrio.nombre : `Barrio ${id}`;
  }

  cerrarDetalle(): void {
    this.mostrarDetalleRuta = false;
    this.rutaCalculada = null;
    this.mensajeError = '';
  }
}
