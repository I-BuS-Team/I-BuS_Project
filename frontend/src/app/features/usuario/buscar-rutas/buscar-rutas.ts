import { Component, OnInit, HostListener, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BarriosService, Barrio, RutaCalcularResponse, TramoRuta } from './services/barrios.service';
import * as L from 'leaflet';

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
  tiempoEstimado = 0;

  dropdownOrigenAbierto = false;
  dropdownDestinoAbierto = false;
  origenSearch = '';
  destinoSearch = '';

  map!: L.Map;
  routingControl: any = null;
  tileLayer: any = null;

  idioma = 'es';

  translations: { [key: string]: { [key: string]: string } } = {
    es: {
      puntoOrigen: 'Punto Origen',
      puntoDestino: 'Punto Destino',
      seleccionaOrigen: 'Selecciona Punto Origen',
      seleccionaDestino: 'Selecciona Punto Destino',
      noBarrios: 'No se encontraron barrios',
      calculaRuta: 'Calcula tu ruta óptima',
      descCalculaRuta: 'Selecciona barrios de origen y destino arriba para ver las rutas de transporte público que te conectan.',
      sinConexion: 'Sin Conexión',
      rutaEncontrada: 'Ruta Encontrada',
      simulado: 'Simulado',
      transbordosNec: 'transbordo(s) necesario(s)',
      empresas: 'Empresas',
      tiempo: 'Tiempo',
      costo: 'Costo',
      instrucciones: 'Instrucciones del viaje',
      origenLabel: 'Origen',
      destinoLabel: 'Destino',
      paradaIntermedia: 'Parada intermedia',
      abordaRuta: 'Aborda la ruta:',
      perfil: 'Perfil',
      mapa: 'Mapa',
      ajustes: 'Ajustes',
      verDetallesRuta: 'Ver Detalles de Ruta'
    },
    en: {
      puntoOrigen: 'Origin Point',
      puntoDestino: 'Destination Point',
      seleccionaOrigen: 'Select Origin Point',
      seleccionaDestino: 'Select Destination Point',
      noBarrios: 'No neighborhoods found',
      calculaRuta: 'Calculate your optimal route',
      descCalculaRuta: 'Select origin and destination neighborhoods above to view public transport routes connecting you.',
      sinConexion: 'No Connection',
      rutaEncontrada: 'Route Found',
      simulado: 'Simulated',
      transbordosNec: 'transfer(s) required',
      empresas: 'Companies',
      tiempo: 'Time',
      costo: 'Cost',
      instrucciones: 'Trip instructions',
      origenLabel: 'Origin',
      destinoLabel: 'Destination',
      paradaIntermedia: 'Intermediate stop',
      abordaRuta: 'Board route:',
      perfil: 'Profile',
      mapa: 'Map',
      ajustes: 'Settings',
      verDetallesRuta: 'View Route Details'
    }
  };

  t(key: string): string {
    return this.translations[this.idioma]?.[key] || key;
  }

  constructor(
    private fb: FormBuilder,
    private barriosService: BarriosService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.idioma = localStorage.getItem('idioma') || 'es';
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
    this.trazarRutaPersistida();
  }

  initMap(): void {
    // Coordenadas del centro de Sogamoso
    const sogamosoCentro: L.LatLngExpression = [5.715, -72.933];
    
    this.map = L.map('map', {
      zoomControl: false
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
        this.restaurarEstadoBusqueda();
      },
      error: (err) => {
        console.warn('Error al cargar barrios del backend. Usando fallback local:', err);
        this.cargarFallbackBarrios();
        this.restaurarEstadoBusqueda();
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
      this.guardarEstado();
      this.cdr.detectChanges();
      return;
    }

    this.cargando = true;
    this.mensajeError = '';
    this.rutaCalculada = null;
    this.tiempoEstimado = 0;
    this.cdr.detectChanges();

    this.barriosService.calcularRuta(Number(origen), Number(destino)).subscribe({
      next: (response) => {
        this.rutaCalculada = response;
        this.mostrarDetalleRuta = true;
        this.cargando = false;
        this.modoOffline = false;
        this.guardarEstado();
        this.cdr.detectChanges();
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
        this.guardarEstado();
        this.cdr.detectChanges();
        setTimeout(() => {
          this.trazarRutaReal(this.rutaCalculada!.camino);
        }, 100);
      }
    });
  }

  guardarEstado(): void {
    const { origen, destino } = this.buscarForm.value;
    this.barriosService.guardarEstadoBusqueda(
      origen ? Number(origen) : null,
      destino ? Number(destino) : null,
      this.rutaCalculada,
      this.mostrarDetalleRuta,
      this.modoOffline,
      this.tiempoEstimado
    );
  }

  restaurarEstadoBusqueda(): void {
    const estado = this.barriosService.obtenerEstadoBusqueda();
    if (estado && estado.origenId && estado.destinoId) {
      this.buscarForm.patchValue({
        origen: estado.origenId,
        destino: estado.destinoId
      });
      this.origenSearch = this.getNombreBarrio(estado.origenId);
      this.destinoSearch = this.getNombreBarrio(estado.destinoId);
      this.rutaCalculada = estado.rutaCalculada;
      this.mostrarDetalleRuta = estado.mostrarDetalleRuta;
      this.modoOffline = estado.modoOffline;
      this.tiempoEstimado = estado.tiempoEstimado;

      this.cdr.detectChanges();
      this.trazarRutaPersistida();
    }
  }

  trazarRutaPersistida(): void {
    if (this.map && this.rutaCalculada && this.rutaCalculada.camino) {
      setTimeout(() => {
        this.trazarRutaReal(this.rutaCalculada!.camino);
      }, 300);
    }
  }

  trazarRutaReal(camino: TramoRuta[]): void {
    // Limpiar control/capa anterior
    if (this.routingControl) {
      try {
        if (typeof this.routingControl.remove === 'function') {
          this.routingControl.remove();
        } else {
          this.map.removeLayer(this.routingControl as any);
        }
      } catch (_) {}
      this.routingControl = null;
    }

    // Filtrar tramos con coordenadas válidas
    const waypointTramos = camino.filter(t => t.latitud !== 0.0 && t.longitud !== 0.0);
    const waypoints = waypointTramos.map(t => L.latLng(t.latitud, t.longitud));

    if (waypoints.length < 2) {
      console.warn('No hay suficientes coordenadas válidas para trazar la ruta en el mapa.');
      return;
    }

    const isDark = document.body.classList.contains('dark') || document.documentElement.classList.contains('dark');

    // Coordenadas en formato OSRM: lng,lat;lng,lat
    const coordStr = waypointTramos
      .map(t => `${t.longitud},${t.latitud}`)
      .join(';');

    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=geojson&steps=false`;

    // Marcadores de origen/destino (inmediatos, sin esperar la ruta)
    const markers: L.Layer[] = [];
    waypointTramos.forEach((tramo, i) => {
      const isStart = i === 0;
      const isEnd = i === waypointTramos.length - 1;
      const isMiddle = !isStart && !isEnd;

      const iconHtml = isStart
        ? `<div style="background-color:#F9B233;color:#0A2C51;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;border:2.5px solid white;box-shadow:0 3px 6px rgba(0,0,0,0.3);font-family:sans-serif">O</div>`
        : isEnd
        ? `<div style="background-color:#EF4444;color:white;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;border:2.5px solid white;box-shadow:0 3px 6px rgba(0,0,0,0.3);font-family:sans-serif">D</div>`
        : `<div style="background-color:#175AA5;color:white;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:bold;border:1.5px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.25);font-family:sans-serif">${i}</div>`;

      const label = isStart ? 'Origen' : isEnd ? 'Destino' : `Parada intermedia: ${tramo.nombre_barrio}`;
      const size: [number, number] = isMiddle ? [22, 22] : [30, 30];
      const anchor: [number, number] = isMiddle ? [11, 11] : [15, 15];

      const marker = L.marker([tramo.latitud, tramo.longitud], {
        icon: L.divIcon({ html: iconHtml, className: '', iconSize: size, iconAnchor: anchor })
      }).bindPopup(label);
      markers.push(marker);
    });

    const markerGroup = L.featureGroup(markers).addTo(this.map);

    // Llamar a OSRM directamente sin leaflet-routing-machine
    fetch(osrmUrl)
      .then(res => res.json())
      .then(data => {
        if (!data.routes || data.routes.length === 0) {
          // Fallback: línea recta entre waypoints
          this.dibujarPolilineasSimples(waypoints, camino, isDark, markerGroup);
          return;
        }

        const route = data.routes[0];
        const totalTimeSeconds: number = route.duration;
        const idealMinutes = totalTimeSeconds / 60;
        const busesCount = this.obtenerCantidadBuses(camino);
        this.tiempoEstimado = Math.round((idealMinutes * 1.8) + (busesCount * 5));
        this.cdr.detectChanges();

        // La geometría viene como GeoJSON: coordenadas en formato [lng, lat]
        const geoCoords: [number, number][] = route.geometry.coordinates;
        const latLngs: L.LatLng[] = geoCoords.map(([lng, lat]) => L.latLng(lat, lng));

        // Calcular los índices de la geometría más cercanos a cada waypoint
        // para poder dividir la línea por segmento/empresa
        const segmentIndices: number[] = waypointTramos.map(tramo => {
          let minDist = Infinity;
          let minIdx = 0;
          latLngs.forEach((ll, idx) => {
            const d = ll.distanceTo(L.latLng(tramo.latitud, tramo.longitud));
            if (d < minDist) { minDist = d; minIdx = idx; }
          });
          return minIdx;
        });

        // Dibujar cada segmento con el color de su empresa
        const layers: L.Layer[] = [];
        for (let seg = 0; seg < segmentIndices.length - 1; seg++) {
          const startIdx = segmentIndices[seg];
          const endIdx = segmentIndices[seg + 1];
          const segCoords = latLngs.slice(startIdx, endIdx + 1);
          if (segCoords.length < 2) continue;

          // camino[seg + 1] contiene la ruta de ese tramo
          const nombreRuta = waypointTramos[seg + 1]?.nombre_ruta ?? null;
          const style = this.getRouteStyle(nombreRuta, isDark);
          layers.push(L.polyline(segCoords, style.outer));
          layers.push(L.polyline(segCoords, style.inner));
        }

        const routeGroup = L.featureGroup([...layers, ...markers]).addTo(this.map);
        // Quitar el grupo de marcadores previo y reemplazar
        markerGroup.remove();
        this.routingControl = routeGroup as any;
        this.map.fitBounds(routeGroup.getBounds(), { padding: [50, 50], animate: true });
      })
      .catch(() => {
        // Si OSRM falla (sin internet, error), dibujamos líneas rectas de fallback
        this.dibujarPolilineasSimples(waypoints, camino, isDark, markerGroup);
      });

    // Guardar el grupo de marcadores como control temporal hasta que llegue la respuesta
    this.routingControl = markerGroup as any;
  }

  dibujarPolilineasSimples(
    waypoints: L.LatLng[],
    camino: TramoRuta[],
    isDark: boolean,
    markerGroup?: L.FeatureGroup
  ): void {
    const layers: L.Layer[] = [];
    for (let i = 0; i < waypoints.length - 1; i++) {
      const nombreRuta = camino[i + 1]?.nombre_ruta ?? null;
      const style = this.getRouteStyle(nombreRuta, isDark);
      layers.push(L.polyline([waypoints[i], waypoints[i + 1]], style.outer));
      layers.push(L.polyline([waypoints[i], waypoints[i + 1]], style.inner));
    }
    if (markerGroup) {
      markerGroup.remove();
    }
    const group = L.featureGroup(layers).addTo(this.map);
    this.routingControl = group as any;
    this.map.fitBounds(L.latLngBounds(waypoints), { padding: [50, 50] });
  }

  getRouteStyle(nombreRuta: string | null, isDark: boolean): { outer: any, inner: any } {
    let company = '';
    if (nombreRuta) {
      const lower = nombreRuta.toLowerCase();
      if (lower.includes('transavella')) {
        company = 'transavella';
      } else if (lower.includes('cootradelsol') || lower.includes('cotradelsol')) {
        company = 'cootradelsol';
      } else if (lower.includes('translago')) {
        company = 'translago';
      } else if (lower.includes('sugamuxi')) {
        company = 'sugamuxi';
      }
    }

    let coreColor = '';
    let borderColor = '';

    if (company === 'transavella') {
      coreColor = '#EF4444'; // Rojo
      borderColor = '#7F1D1D'; // Rojo oscuro
    } else if (company === 'cootradelsol') {
      if (isDark) {
        coreColor = '#E2E8F0'; // Gris tirando a blanco
        borderColor = '#64748B'; // Gris oscuro
      } else {
        coreColor = '#7E8B9B'; // Gris más clarito
        borderColor = '#475569'; // Gris oscuro
      }
    } else if (company === 'translago') {
      coreColor = '#3B82F6'; // Azul
      borderColor = '#1E3A8A'; // Azul oscuro
    } else if (company === 'sugamuxi') {
      coreColor = '#00E676'; // Verde más vivo
      borderColor = '#004D40'; // Verde oscuro
    } else {
      // Default / Fallback
      if (isDark) {
        coreColor = '#FFFFFF';
        borderColor = '#F9B233';
      } else {
        coreColor = '#F9B233';
        borderColor = '#0A2C51';
      }
    }

    return {
      outer: { color: borderColor, opacity: 0.9, weight: 8 },
      inner: { color: coreColor, opacity: 1.0, weight: 4 }
    };
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

  obtenerTiempoEstimado(): string {
    if (this.tiempoEstimado > 0) {
      return `${this.tiempoEstimado} min`;
    }
    if (this.rutaCalculada) {
      const busesCount = this.obtenerCantidadBuses(this.rutaCalculada.camino);
      const idealMinutes = (this.rutaCalculada.total_tramos + 1) * 7;
      return `${Math.round((idealMinutes * 1.8) + (busesCount * 5))} min`;
    }
    return '15 min';
  }

  obtenerCantidadBuses(camino: TramoRuta[]): number {
    let count = 0;
    let lastRutaId: number | null | undefined = undefined;
    for (let i = 1; i < camino.length; i++) {
      const rutaId = camino[i].ruta_id;
      if (rutaId && rutaId !== lastRutaId) {
        count++;
        lastRutaId = rutaId;
      }
    }
    return count > 0 ? count : 1;
  }

  obtenerCostoTotal(camino: TramoRuta[]): string {
    const cantidad = this.obtenerCantidadBuses(camino);
    const total = cantidad * 2600;
    return `$${total.toLocaleString('es-CO')}`;
  }

  obtenerEmpresasRuta(camino: TramoRuta[]): { nombre: string, color: string }[] {
    const empresas: { [key: string]: { nombre: string, color: string } } = {};
    for (let i = 1; i < camino.length; i++) {
      const nombreRuta = camino[i].nombre_ruta;
      if (nombreRuta) {
        let nombreEmpresa = 'Bus';
        let color = '#F9B233'; // Default yellow
        
        const lower = nombreRuta.toLowerCase();
        if (lower.includes('transavella')) {
          nombreEmpresa = 'Transavella';
          color = '#EF4444'; // Rojo (originally was #000000)
        } else if (lower.includes('cootradelsol') || lower.includes('cotradelsol')) {
          nombreEmpresa = 'Cootradelsol';
          color = '#E2E8F0'; // Gris tirando a blanco
        } else if (lower.includes('translago')) {
          nombreEmpresa = 'Translago';
          color = '#38BDF8'; // Azul claro
        } else if (lower.includes('sugamuxi')) {
          nombreEmpresa = 'Flota Sugamuxi';
          color = '#00E676'; // Verde más vivo
        } else {
          const parts = nombreRuta.split('(');
          nombreEmpresa = parts[0].trim();
        }
        
        if (!empresas[nombreEmpresa]) {
          empresas[nombreEmpresa] = { nombre: nombreEmpresa, color: color };
        }
      }
    }
    
    const result = Object.values(empresas);
    return result.length > 0 ? result : [{ nombre: 'Bus', color: '#F9B233' }];
  }

  obtenerEstiloConexion(nombreRuta: string | null | undefined): { [key: string]: string } {
    const isDark = this.isDark();
    if (!nombreRuta) {
      return {
        'background-color': 'rgba(249, 178, 51, 0.1)',
        'color': '#F9B233',
        'border': '1px solid rgba(249, 178, 51, 0.2)'
      };
    }
    const lower = nombreRuta.toLowerCase();
    let bg = 'rgba(249, 178, 51, 0.1)';
    let text = '#F9B233';
    let border = 'rgba(249, 178, 51, 0.2)';

    if (lower.includes('transavella')) {
      bg = isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.08)';
      text = '#EF4444';
      border = 'rgba(239, 68, 68, 0.2)';
    } else if (lower.includes('cootradelsol') || lower.includes('cotradelsol')) {
      if (isDark) {
        bg = 'rgba(226, 232, 240, 0.1)';
        text = '#E2E8F0';
        border = 'rgba(226, 232, 240, 0.2)';
      } else {
        bg = 'rgba(71, 85, 105, 0.08)';
        text = '#475569'; // Gris legible en modo claro
        border = 'rgba(71, 85, 105, 0.2)';
      }
    } else if (lower.includes('translago')) {
      bg = isDark ? 'rgba(56, 189, 248, 0.1)' : 'rgba(2, 132, 199, 0.08)';
      text = isDark ? '#38BDF8' : '#0284C7';
      border = isDark ? 'rgba(56, 189, 248, 0.2)' : 'rgba(2, 132, 199, 0.2)';
    } else if (lower.includes('sugamuxi')) {
      bg = isDark ? 'rgba(0, 230, 118, 0.1)' : 'rgba(0, 200, 83, 0.08)';
      text = isDark ? '#00E676' : '#00C853';
      border = isDark ? 'rgba(0, 230, 118, 0.2)' : 'rgba(0, 200, 83, 0.2)';
    }

    return {
      'background-color': bg,
      'color': text,
      'border': `1px solid ${border}`
    };
  }

  isDark(): boolean {
    return document.body.classList.contains('dark') || document.documentElement.classList.contains('dark');
  }

  cerrarDetalle(): void {
    this.mostrarDetalleRuta = false;
    this.guardarEstado();
    this.cdr.detectChanges();
  }

  centrarEnOrigen(): void {
    if (this.rutaCalculada && this.rutaCalculada.camino && this.rutaCalculada.camino.length > 0) {
      const validCoords = this.rutaCalculada.camino
        .filter(t => t.latitud !== 0.0 && t.longitud !== 0.0)
        .map(t => L.latLng(t.latitud, t.longitud));
      
      if (validCoords.length > 0) {
        const bounds = L.latLngBounds(validCoords);
        this.map.fitBounds(bounds, {
          padding: [50, 50],
          animate: true,
          duration: 1.0
        });
        return;
      }
    }

    const origenId = this.buscarForm.get('origen')?.value;
    if (origenId) {
      const origenBarrio = this.barrios.find(b => b.id === Number(origenId));
      if (origenBarrio && origenBarrio.latitud && origenBarrio.longitud) {
        this.map.setView([origenBarrio.latitud, origenBarrio.longitud], 16, {
          animate: true,
          duration: 1.0
        });
        return;
      }
    }

    // Default Fallback
    this.map.setView([5.715, -72.933], 14, {
      animate: true,
      duration: 1.0
    });
  }

  zoomIn(): void {
    if (this.map) {
      this.map.zoomIn();
    }
  }

  zoomOut(): void {
    if (this.map) {
      this.map.zoomOut();
    }
  }

  private touchStartY = 0;

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    if (window.innerWidth < 768) {
      this.touchStartY = event.touches[0].clientY;
    }
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent): void {
    if (window.innerWidth < 768 && this.rutaCalculada && !this.mostrarDetalleRuta) {
      const touchEndY = event.changedTouches[0].clientY;
      const diffY = this.touchStartY - touchEndY;
      if (diffY > 50) { // Deslizar hacia arriba al menos 50px
        this.mostrarDetalleRuta = true;
        this.guardarEstado();
        this.cdr.detectChanges();
      }
    }
  }
}
