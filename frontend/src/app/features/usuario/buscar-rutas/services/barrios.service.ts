import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../../../../config';

export interface Barrio {
  id: number;
  nombre: string;
  latitud?: number;
  longitud?: number;
  usado?: boolean;
}

export interface TramoRuta {
  barrio_id: number;
  nombre_barrio: string;
  ruta_id?: number | null;
  nombre_ruta?: string | null;
  latitud: number;
  longitud: number;
}

export interface RutaCalcularResponse {
  total_tramos: number;
  camino: TramoRuta[];
}

@Injectable({
  providedIn: 'root'
})
export class BarriosService {
  private apiUrl = API_URL;

  private searchState = {
    origenId: null as number | null,
    destinoId: null as number | null,
    rutaCalculada: null as RutaCalcularResponse | null,
    mostrarDetalleRuta: false,
    modoOffline: false,
    tiempoEstimado: 0
  };

  constructor(private http: HttpClient) {}

  getBarrios(): Observable<Barrio[]> {
    return this.http.get<Barrio[]>(`${this.apiUrl}/barrios`);
  }

  calcularRuta(origenId: number, destinoId: number): Observable<RutaCalcularResponse> {
    return this.http.post<RutaCalcularResponse>(`${this.apiUrl}/rutas/calcular`, {
      origen_id: origenId,
      destino_id: destinoId
    });
  }

  guardarEstadoBusqueda(origenId: number | null, destinoId: number | null, rutaCalculada: RutaCalcularResponse | null, mostrarDetalle: boolean, offline: boolean, tiempo: number) {
    this.searchState = {
      origenId,
      destinoId,
      rutaCalculada,
      mostrarDetalleRuta: mostrarDetalle,
      modoOffline: offline,
      tiempoEstimado: tiempo
    };
  }

  obtenerEstadoBusqueda() {
    return this.searchState;
  }

  limpiarEstadoBusqueda() {
    this.searchState = {
      origenId: null,
      destinoId: null,
      rutaCalculada: null,
      mostrarDetalleRuta: false,
      modoOffline: false,
      tiempoEstimado: 0
    };
  }
}
