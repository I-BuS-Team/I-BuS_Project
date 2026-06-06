import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AdminRutasService, ElementoCobertura } from '../gestionar-rutas/services/admin-rutas.service';

interface UsoDiaGrafico {
  dia: string;
  valor: number;
  alturaPx: number;
}

@Component({
  selector: 'app-estadisticas',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './estadisticas.html',
  styleUrl: './estadisticas.scss',
})
export class Estadisticas implements OnInit {
  totalRutas = 0;
  totalBarrios = 0;
  totalEmpresas = 0;
  usuariosActivos = 0;
  isLoading = true;
  
  usoPorDia: UsoDiaGrafico[] = [];
  coberturaRutas: ElementoCobertura[] = [];

  constructor(
    private adminService: AdminRutasService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.adminService.getEstadisticas().subscribe({
      next: (data) => {
        this.totalRutas = data.totalRutas;
        this.totalBarrios = data.totalBarrios;
        this.totalEmpresas = data.totalEmpresas;
        this.usuariosActivos = data.usuariosActivos;
        
        this.coberturaRutas = data.coberturaRutas || [];
        
        const uso = data.usoPorDia || [];
        const maxValor = Math.max(...uso.map(u => u.valor), 1);
        this.usoPorDia = uso.map(u => ({
          dia: u.dia,
          valor: u.valor,
          alturaPx: Math.max(Math.round((u.valor / maxValor) * 130), 10)
        }));

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando estadísticas:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
}

