import { Component, OnInit, HostListener, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BarriosService, Barrio, RutaCalcularResponse, TramoRuta } from './services/barrios.service';
import * as L from 'leaflet';
import 'leaflet-routing-machine';

const MOCK_BARRIOS: Barrio[] = [
  { id: 6, nombre: 'Centro', latitud: 5.715, longitud: -72.933 },
  { id: 187, nombre: 'UPTC', latitud: 5.723, longitud: -72.926 },
  { id: 127, nombre: 'El Rosario', latitud: 5.718, longitud: -72.939 },
  { id: 132, nombre: 'José Antonio Galán', latitud: 5.711, longitud: -72.938 },
  { id: 137, nombre: 'La Isla', latitud: 5.721, longitud: -72.942 },
  { id: 149, nombre: 'Magdalena', latitud: 5.708, longitud: -72.929 },
  { id: 150, nombre: 'Monquirá', latitud: 5.728, longitud: -72.919 },
  { id: 152, nombre: 'Prado Norte', latitud: 5.731, longitud: -72.928 },
  { id: 169, nombre: 'Sugamuxi', latitud: 5.713, longitud: -72.925 },
  { id: 175, nombre: 'Villa del Sol', latitud: 5.706, longitud: -72.936 },
  { id: 184, nombre: 'La Tolva', latitud: 5.742, longitud: -72.921 },
  { id: 185, nombre: 'Vallado', latitud: 5.717, longitud: -72.928 },
  { id: 186, nombre: 'La Ramada', latitud: 5.724, longitud: -72.945 },
  { id: 188, nombre: 'Libertador', latitud: 5.714, longitud: -72.930 },
  { id: 189, nombre: 'Coliseo', latitud: 5.719, longitud: -72.932 },
  { id: 191, nombre: 'Morca', latitud: 5.702, longitud: -72.903 },
  { id: 192, nombre: 'Puente Pesca', latitud: 5.728, longitud: -72.935 },
  { id: 198, nombre: 'Plaza de Mercado', latitud: 5.712, longitud: -72.934 },
  { id: 204, nombre: 'Jardín', latitud: 5.720, longitud: -72.923 }
];

@Component({
  selector: 'app-buscar-rutas',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './buscar-rutas.html',
  styleUrl: './buscar-rutas.scss',
})
export class BuscarRutas implements OnInit, AfterViewInit {
  buscarForm!: FormGroup;
  mostrarDetalleRuta = false;
  barrios: Barrio[] = [];
  rutaCalculada: RutaCalcularResponse | null = null;
  mensajeError = '';
  cargando = false;
  modoOffline = false;

  dropdownOrigenAbierto = false;
  dropdownDestinoAbierto = false;
  origenSearch = '';
  destinoSearch = '';

  map!: L.Map;
  routingControl: any = null;
  tileLayer: any = null;

  constructor(
    private fb: FormBuilder,
    private barriosService: BarriosService
  ) {}

  ngOnInit(): void {
    this.buscarForm = this.fb.group({
      origen: ['', Validators.required],
      destino: ['', Validators.required],
    });

    this.buscarForm.get('origen')?.valueChanges.subscribe(val => {
      const name = this.getNombreBarrio(val);
      if (name && this.origenSearch !== name) {
        this.origenSearch = name;
      }
    });

    this.buscarForm.get('destino')?.valueChanges.subscribe(val => {
      const name = this.getNombreBarrio(val);
      if (name && this.destinoSearch !== name) {
        this.destinoSearch = name;
      }
    });

    this.cargarBarrios();
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  initMap(): void {
    // Coordenadas del centro de Sogamoso
    const sogamosoCentro: L.LatLngExpression = [5.715, -72.933];
    
    this.map = L.map('map', {
      zoomControl: true
    }).setView(sogamosoCentro, 14);

    this.actualizarMapaCapas();
  }

  actualizarMapaCapas(): void {
    if (this.tileLayer) {
      this.map.removeLayer(this.tileLayer);
    }

    const isDark = document.body.classList.contains('dark') || document.documentElement.classList.contains('dark');
    const tileUrl = isDark 
      ? 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    this.tileLayer = L.tileLayer(tileUrl, {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors, © CartoDB'
    }).addTo(this.map);
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

  onOrigenFocus(event: any): void {
    event.stopPropagation();
    this.dropdownOrigenAbierto = true;
    this.dropdownDestinoAbierto = false;
  }

  onOrigenInput(event: any): void {
    this.dropdownOrigenAbierto = true;
    this.dropdownDestinoAbierto = false;
  }

  onDestinoFocus(event: any): void {
    event.stopPropagation();
    this.dropdownDestinoAbierto = true;
    this.dropdownOrigenAbierto = false;
  }

  onDestinoInput(event: any): void {
    this.dropdownDestinoAbierto = true;
    this.dropdownOrigenAbierto = false;
  }

  get barriosFiltradosOrigen(): Barrio[] {
    const selectedId = this.buscarForm.get('origen')?.value;
    const selectedName = this.getNombreBarrio(selectedId);
    const query = this.origenSearch.toLowerCase().trim();
    if (!query || query === selectedName.toLowerCase().trim()) {
      return this.barrios;
    }
    return this.barrios.filter(b => b.nombre.toLowerCase().includes(query));
  }

  get barriosFiltradosDestino(): Barrio[] {
    const selectedId = this.buscarForm.get('destino')?.value;
    const selectedName = this.getNombreBarrio(selectedId);
    const query = this.destinoSearch.toLowerCase().trim();
    if (!query || query === selectedName.toLowerCase().trim()) {
      return this.barrios;
    }
    return this.barrios.filter(b => b.nombre.toLowerCase().includes(query));
  }

  seleccionarOrigen(barrio: Barrio, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.buscarForm.patchValue({ origen: barrio.id });
    this.origenSearch = barrio.nombre;
    this.dropdownOrigenAbierto = false;
    this.buscarRuta();
  }

  seleccionarDestino(barrio: Barrio, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.buscarForm.patchValue({ destino: barrio.id });
    this.destinoSearch = barrio.nombre;
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
        if (response && response.camino) {
          setTimeout(() => {
            this.trazarRutaReal(response.camino);
          }, 100);
        }
      },
      error: (err) => {
        console.warn('Error al calcular ruta en backend. Usando simulación local:', err);
        this.rutaCalculada = this.generateMockRoute(Number(origen), Number(destino));
        this.mostrarDetalleRuta = true;
        this.cargando = false;
        this.modoOffline = true;
        setTimeout(() => {
          this.trazarRutaReal(this.rutaCalculada!.camino);
        }, 100);
      }
    });
  }

  trazarRutaReal(camino: TramoRuta[]): void {
    if (this.routingControl) {
      this.map.removeControl(this.routingControl);
      this.routingControl = null;
    }

    // Filtrar tramos con coordenadas válidas
    const waypoints = camino
      .filter(t => t.latitud !== 0.0 && t.longitud !== 0.0)
      .map(t => L.latLng(t.latitud, t.longitud));

    if (waypoints.length < 2) {
      console.warn('No hay suficientes coordenadas válidas para trazar la ruta en el mapa.');
      return;
    }

    const isDark = document.body.classList.contains('dark') || document.documentElement.classList.contains('dark');
    const outerStyle = isDark 
      ? { color: '#F9B233', opacity: 0.9, weight: 8 } 
      : { color: '#0A2C51', opacity: 0.8, weight: 8 };
    const innerStyle = isDark 
      ? { color: '#FFFFFF', opacity: 1.0, weight: 4 } 
      : { color: '#F9B233', opacity: 1.0, weight: 4 };

    // Crear el control de ruteo usando el enrutador OSRM oficial público de OpenStreetMap
    this.routingControl = (L as any).Routing.control({
      waypoints: waypoints,
      router: (L as any).Routing.osrmv1({
        serviceUrl: 'https://router.project-osrm.org/route/v1'
      }),
      lineOptions: {
        styles: [
          outerStyle,
          innerStyle
        ]
      },
      show: false,
      routeWhileDragging: false,
      addWaypoints: false, // Desactivar edición manual de paradas
      draggableWaypoints: false, // Evitar arrastre manual de waypoints
      showAlternatives: false,
      fitSelectedRoutes: true,
      createMarker: (i: number, waypoint: any, n: number) => {
        const isStart = i === 0;
        const isEnd = i === n - 1;
        
        const iconHtml = isStart 
          ? `<div style="background-color: #F9B233; color: #0A2C51; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2.5px solid white; box-shadow: 0 3px 6px rgba(0,0,0,0.3); font-family: 'Roboto', sans-serif;">O</div>`
          : (isEnd 
            ? `<div style="background-color: #EF4444; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2.5px solid white; box-shadow: 0 3px 6px rgba(0,0,0,0.3); font-family: 'Roboto', sans-serif;">D</div>`
            : `<div style="background-color: #175AA5; color: white; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; border: 1.5px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.25); font-family: 'Roboto', sans-serif;">${i}</div>`);

        const label = isStart ? 'Origen' : (isEnd ? 'Destino' : `Parada intermedia: ${camino[i].nombre_barrio}`);
        
        return L.marker(waypoint.latLng, {
          draggable: false,
          icon: L.divIcon({
            html: iconHtml,
            className: '',
            iconSize: isStart || isEnd ? [30, 30] : [22, 22],
            iconAnchor: isStart || isEnd ? [15, 15] : [11, 11]
          })
        }).bindPopup(label);
      }
    }).addTo(this.map);
  }

  generateMockRoute(origenId: number, destinoId: number): RutaCalcularResponse {
    const origenBarrio = this.barrios.find(b => b.id === origenId);
    const destinoBarrio = this.barrios.find(b => b.id === destinoId);
    const centroBarrio = this.barrios.find(b => b.id === 6) || { id: 6, nombre: 'Centro', latitud: 5.715, longitud: -72.933 };

    const origenNombre = origenBarrio?.nombre || `Barrio ${origenId}`;
    const destinoNombre = destinoBarrio?.nombre || `Barrio ${destinoId}`;
    const centroNombre = centroBarrio.nombre;

    const camino: TramoRuta[] = [
      {
        barrio_id: origenId,
        nombre_barrio: origenNombre,
        ruta_id: null,
        nombre_ruta: null,
        latitud: origenBarrio?.latitud || 5.715,
        longitud: origenBarrio?.longitud || -72.933
      },
    ];

    if (origenId !== 6 && destinoId !== 6) {
      camino.push({
        barrio_id: 6,
        nombre_barrio: centroNombre,
        ruta_id: 38,
        nombre_ruta: 'Cootradelsol (Frecuencia: 5-10 min)',
        latitud: centroBarrio.latitud || 5.715,
        longitud: centroBarrio.longitud || -72.933
      });
      camino.push({
        barrio_id: destinoId,
        nombre_barrio: destinoNombre,
        ruta_id: 39,
        nombre_ruta: 'Flota Sugamuxi (Frecuencia: 10 min)',
        latitud: destinoBarrio?.latitud || 5.715,
        longitud: destinoBarrio?.longitud || -72.933
      });
    } else {
      camino.push({
        barrio_id: destinoId,
        nombre_barrio: destinoNombre,
        ruta_id: 38,
        nombre_ruta: 'TransAvella S.A. (Frecuencia: 8 min)',
        latitud: destinoBarrio?.latitud || 5.715,
        longitud: destinoBarrio?.longitud || -72.933
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
    if (this.routingControl) {
      this.map.removeControl(this.routingControl);
      this.routingControl = null;
    }
  }

  centrarEnOrigen(): void {
    const origenId = this.buscarForm.get('origen')?.value;
    if (origenId) {
      const origenBarrio = this.barrios.find(b => b.id === Number(origenId));
      if (origenBarrio && origenBarrio.latitud && origenBarrio.longitud) {
        this.map.setView([origenBarrio.latitud, origenBarrio.longitud], 16, {
          animate: true,
          duration: 1.0
        });
      }
    }
  }
}
