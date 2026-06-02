import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Barrio {
  id: number;
  nombre: string;
}

export interface TramoRuta {
  barrio_id: number;
  nombre_barrio: string;
  ruta_id?: number | null;
  nombre_ruta?: string | null;
}

export interface RutaCalcularResponse {
  total_tramos: number;
  camino: TramoRuta[];
}

@Injectable({
  providedIn: 'root'
})
export class BarriosService {
  private apiUrl = 'http://localhost:8000/api';

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
}
