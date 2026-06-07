import { Component, OnInit, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AdminRutasService, Horario, Ruta } from '../../services/admin-rutas.service';

@Component({
  selector: 'app-gestionar-horarios',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule, CommonModule],
  templateUrl: './gestionar-horarios.html',
  styleUrl: './gestionar-horarios.scss',
})
export class GestionarHorarios implements OnInit {
  horarioForm!: FormGroup;
  allHorarios: Horario[] = [];
  allRutas: Ruta[] = [];
  
  searchResults: Horario[] = [];
  showSearchResults = false;
  selectedHorarioId: number | null = null;
  
  mensajeFeedback = '';
  tipoFeedback: 'exito' | 'error' = 'exito';

  constructor(
    private fb: FormBuilder,
    private adminService: AdminRutasService
  ) {}

  ngOnInit(): void {
    this.horarioForm = this.fb.group({
      buscar: [''],
      idHorario: [{ value: '', disabled: true }],
      idRuta: ['', [Validators.required]],
      horaSalida: ['', [Validators.required]],
      horaLlegada: ['', [Validators.required]],
    });

    this.cargarDatos();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    this.showSearchResults = false;
  }

  cargarDatos(): void {
    this.adminService.getRutas().subscribe({
      next: (r) => {
        this.allRutas = r;
      },
      error: (err) => console.error('Error cargando rutas:', err)
    });

    this.adminService.getHorarios().subscribe({
      next: (h) => {
        this.allHorarios = h;
      },
      error: (e) => console.error('Error cargando horarios:', e)
    });
  }

  onSearchInput(): void {
    const query = this.horarioForm.get('buscar')?.value?.toLowerCase() || '';
    if (!query) {
      this.searchResults = [...this.allHorarios];
      this.showSearchResults = true;
      return;
    }

    this.searchResults = this.allHorarios.filter(h => {
      const idMatches = h.id?.toString() === query;
      const ruta = this.allRutas.find(r => r.id === h.idRuta);
      const rutaMatches = ruta?.id?.toString() === query || ruta?.frecuencia.toLowerCase().includes(query) || false;
      const horasMatches = h.horaSalida.includes(query) || h.horaLlegada.includes(query);
      return idMatches || rutaMatches || horasMatches;
    });

    this.showSearchResults = true;
  }

  selectHorario(h: Horario): void {
    this.selectedHorarioId = h.id || null;
    
    // Convertir de HH:MM:SS a HH:MM para el input de tipo time
    const salida = h.horaSalida.substring(0, 5);
    const llegada = h.horaLlegada.substring(0, 5);

    this.horarioForm.patchValue({
      idHorario: h.id ? `H - ${h.id}` : '',
      idRuta: h.idRuta,
      horaSalida: salida,
      horaLlegada: llegada,
      buscar: ''
    });

    this.showSearchResults = false;
  }

  onNuevoHorario(): void {
    this.selectedHorarioId = null;
    this.horarioForm.patchValue({
      idHorario: 'Creando Nuevo Horario',
      idRuta: '',
      horaSalida: '',
      horaLlegada: '',
      buscar: ''
    });
  }

  getRutaDetails(id: number): string {
    const ruta = this.allRutas.find(r => r.id === id);
    return ruta ? `Ruta ${ruta.id} (Frecuencia: ${ruta.frecuencia})` : `Ruta ${id}`;
  }

  mostrarFeedback(mensaje: string, tipo: 'exito' | 'error'): void {
    this.mensajeFeedback = mensaje;
    this.tipoFeedback = tipo;
    setTimeout(() => {
      this.mensajeFeedback = '';
    }, 5000);
  }

  onSubmit(): void {
    if (this.horarioForm.invalid) {
      this.mostrarFeedback('Por favor complete todos los campos obligatorios.', 'error');
      return;
    }

    const formVal = this.horarioForm.value;
    const horarioData: Horario = {
      idRuta: Number(formVal.idRuta),
      horaSalida: formVal.horaSalida.length === 5 ? `${formVal.horaSalida}:00` : formVal.horaSalida,
      horaLlegada: formVal.horaLlegada.length === 5 ? `${formVal.horaLlegada}:00` : formVal.horaLlegada
    };

    if (this.selectedHorarioId) {
      // Actualizar
      this.adminService.actualizarHorario(this.selectedHorarioId, horarioData).subscribe({
        next: (res) => {
          this.mostrarFeedback('Horario actualizado exitosamente.', 'exito');
          this.selectHorario(res);
          this.cargarDatos();
        },
        error: (err) => {
          console.error(err);
          this.mostrarFeedback(err.error?.detail || 'Error al actualizar el horario.', 'error');
        }
      });
    } else {
      // Crear
      this.adminService.crearHorario(horarioData).subscribe({
        next: (res) => {
          this.mostrarFeedback('Horario creado exitosamente.', 'exito');
          this.selectHorario(res);
          this.cargarDatos();
        },
        error: (err) => {
          console.error(err);
          this.mostrarFeedback(err.error?.detail || 'Error al crear el horario.', 'error');
        }
      });
    }
  }

  onEliminar(): void {
    if (!this.selectedHorarioId) {
      this.mostrarFeedback('Seleccione un horario para poder eliminarlo.', 'error');
      return;
    }

    if (confirm('¿Está seguro de que desea eliminar este horario?')) {
      this.adminService.eliminarHorario(this.selectedHorarioId).subscribe({
        next: () => {
          this.mostrarFeedback('Horario eliminado con éxito.', 'exito');
          this.onNuevoHorario();
          this.cargarDatos();
        },
        error: (err) => {
          console.error(err);
          this.mostrarFeedback(err.error?.detail || 'Error al eliminar el horario.', 'error');
        }
      });
    }
  }
}
