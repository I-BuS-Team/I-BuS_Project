import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Barrio {
  id?: number;
  nombre: string;
}

export interface Empresa {
  id?: number;
  nombreEmpresa: string;
  anioFundacion: number;
  direccion: string;
  telefono: string;
  cantBuses: number;
  cantConductores: number;
}

export interface Ruta {
  id?: number;
  idEmpresa: number;
  inicioRuta_id: number;
  destinoRuta_id: number;
  frecuencia: string;
  barrio_ids?: number[];
}

export interface Horario {
  id?: number;
  idEmpresa: number;
  horaSalida: string;
  horaLlegada: string;
}

export interface Tiempo {
  id?: number;
  fecha: string;
}

export interface DetalleRuta {
  id?: number;
  idRuta: number;
  idTiempo: number;
  cantidadPasajeros: number;
}

export interface ElementoUsoDia {
  dia: string;
  valor: number;
}

export interface ElementoCobertura {
  nombre: string;
  porcentaje: number;
}

export interface Estadisticas {
  totalRutas: number;
  totalBarrios: number;
  totalEmpresas: number;
  usuariosActivos: number;
  usoPorDia: ElementoUsoDia[];
  coberturaRutas: ElementoCobertura[];
}

@Injectable({
  providedIn: 'root'
})
export class AdminRutasService {
  private apiUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  // --- BARRIOS & EMPRESAS HELPERS ---
  getBarrios(): Observable<Barrio[]> {
    return this.http.get<Barrio[]>(`${this.apiUrl}/barrios`);
  }

  crearBarrio(barrio: Barrio): Observable<Barrio> {
    return this.http.post<Barrio>(`${this.apiUrl}/barrios`, barrio);
  }

  actualizarBarrio(id: number, barrio: Barrio): Observable<Barrio> {
    return this.http.put<Barrio>(`${this.apiUrl}/barrios/${id}`, barrio);
  }

  eliminarBarrio(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/barrios/${id}`);
  }

  getEmpresas(): Observable<Empresa[]> {
    return this.http.get<Empresa[]>(`${this.apiUrl}/empresas`);
  }

  crearEmpresa(empresa: Empresa): Observable<Empresa> {
    return this.http.post<Empresa>(`${this.apiUrl}/empresas`, empresa);
  }

  actualizarEmpresa(id: number, empresa: Empresa): Observable<Empresa> {
    return this.http.put<Empresa>(`${this.apiUrl}/empresas/${id}`, empresa);
  }

  eliminarEmpresa(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/empresas/${id}`);
  }

  // --- RUTAS CRUD ---
  getRutas(): Observable<Ruta[]> {
    return this.http.get<Ruta[]>(`${this.apiUrl}/rutas`);
  }

  crearRuta(ruta: Ruta): Observable<Ruta> {
    return this.http.post<Ruta>(`${this.apiUrl}/rutas`, ruta);
  }

  actualizarRuta(id: number, ruta: Ruta): Observable<Ruta> {
    return this.http.put<Ruta>(`${this.apiUrl}/rutas/${id}`, ruta);
  }

  eliminarRuta(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/rutas/${id}`);
  }

  // --- HORARIOS CRUD ---
  getHorarios(): Observable<Horario[]> {
    return this.http.get<Horario[]>(`${this.apiUrl}/horarios`);
  }

  crearHorario(horario: Horario): Observable<Horario> {
    return this.http.post<Horario>(`${this.apiUrl}/horarios`, horario);
  }

  actualizarHorario(id: number, horario: Horario): Observable<Horario> {
    return this.http.put<Horario>(`${this.apiUrl}/horarios/${id}`, horario);
  }

  eliminarHorario(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/horarios/${id}`);
  }

  // --- TIEMPOS CRUD ---
  getTiempos(): Observable<Tiempo[]> {
    return this.http.get<Tiempo[]>(`${this.apiUrl}/tiempos`);
  }

  crearTiempo(tiempo: Tiempo): Observable<Tiempo> {
    return this.http.post<Tiempo>(`${this.apiUrl}/tiempos`, tiempo);
  }

  actualizarTiempo(id: number, tiempo: Tiempo): Observable<Tiempo> {
    return this.http.put<Tiempo>(`${this.apiUrl}/tiempos/${id}`, tiempo);
  }

  eliminarTiempo(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/tiempos/${id}`);
  }

  // --- DETALLES RUTA CRUD ---
  getDetalles(): Observable<DetalleRuta[]> {
    return this.http.get<DetalleRuta[]>(`${this.apiUrl}/detalles`);
  }

  crearDetalle(detalle: DetalleRuta): Observable<DetalleRuta> {
    return this.http.post<DetalleRuta>(`${this.apiUrl}/detalles`, detalle);
  }

  actualizarDetalle(id: number, detalle: DetalleRuta): Observable<DetalleRuta> {
    return this.http.put<DetalleRuta>(`${this.apiUrl}/detalles/${id}`, detalle);
  }

  eliminarDetalle(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/detalles/${id}`);
  }

  // --- ESTADÍSTICAS ---
  getEstadisticas(): Observable<Estadisticas> {
    return this.http.get<Estadisticas>(`${this.apiUrl}/admin/estadisticas`);
  }
}
