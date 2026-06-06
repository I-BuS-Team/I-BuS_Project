import { Component, OnInit, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AdminRutasService, Empresa } from '../gestionar-rutas/services/admin-rutas.service';

@Component({
  selector: 'app-gestionar-empresas',
  imports: [ReactiveFormsModule, RouterModule, CommonModule],
  templateUrl: './gestionar-empresas.html',
  styleUrl: './gestionar-empresas.scss',
})
export class GestionarEmpresas implements OnInit {
  empresaForm!: FormGroup;
  allEmpresas: Empresa[] = [];
  
  searchResults: Empresa[] = [];
  showSearchResults = false;
  selectedEmpresaId: number | null = null;
  
  mensajeFeedback = '';
  tipoFeedback: 'exito' | 'error' = 'exito';

  constructor(
    private fb: FormBuilder,
    private adminService: AdminRutasService
  ) {}

  ngOnInit(): void {
    this.empresaForm = this.fb.group({
      buscar: [''],
      idEmpresa: [{ value: '', disabled: true }],
      nombreEmpresa: ['', [Validators.required]],
      anioFundacion: ['', [Validators.required, Validators.min(1800), Validators.max(new Date().getFullYear())]],
      telefono: ['', [Validators.required]],
      direccion: ['', [Validators.required]],
      cantBuses: ['', [Validators.required, Validators.min(0)]],
      cantConductores: ['', [Validators.required, Validators.min(0)]],
    });

    this.cargarDatos();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    this.showSearchResults = false;
  }

  cargarDatos(): void {
    this.adminService.getEmpresas().subscribe({
      next: (e) => {
        this.allEmpresas = e;
      },
      error: (err) => console.error('Error cargando empresas:', err)
    });
  }

  onSearchInput(): void {
    const query = this.empresaForm.get('buscar')?.value?.toLowerCase() || '';
    if (!query) {
      this.searchResults = [];
      this.showSearchResults = false;
      return;
    }

    this.searchResults = this.allEmpresas.filter(e => 
      e.id?.toString() === query || e.nombreEmpresa.toLowerCase().includes(query)
    );
    this.showSearchResults = true;
  }

  selectEmpresa(e: Empresa): void {
    this.selectedEmpresaId = e.id || null;
    
    this.empresaForm.patchValue({
      idEmpresa: e.id ? `E - ${e.id}` : '',
      nombreEmpresa: e.nombreEmpresa,
      anioFundacion: e.anioFundacion,
      telefono: e.telefono,
      direccion: e.direccion,
      cantBuses: e.cantBuses,
      cantConductores: e.cantConductores,
      buscar: ''
    });

    this.showSearchResults = false;
  }

  onNuevaEmpresa(): void {
    this.selectedEmpresaId = null;
    this.empresaForm.patchValue({
      idEmpresa: 'Creando Nueva Empresa',
      nombreEmpresa: '',
      anioFundacion: '',
      telefono: '',
      direccion: '',
      cantBuses: '',
      cantConductores: '',
      buscar: ''
    });
  }

  mostrarFeedback(mensaje: string, tipo: 'exito' | 'error'): void {
    this.mensajeFeedback = mensaje;
    this.tipoFeedback = tipo;
    setTimeout(() => {
      this.mensajeFeedback = '';
    }, 5000);
  }

  onSubmit(): void {
    if (this.empresaForm.invalid) {
      this.mostrarFeedback('Por favor complete todos los campos obligatorios.', 'error');
      return;
    }

    const formVal = this.empresaForm.getRawValue();
    const empresaData: Empresa = {
      nombreEmpresa: formVal.nombreEmpresa,
      anioFundacion: Number(formVal.anioFundacion),
      direccion: formVal.direccion,
      telefono: formVal.telefono,
      cantBuses: Number(formVal.cantBuses),
      cantConductores: Number(formVal.cantConductores)
    };

    if (this.selectedEmpresaId) {
      // Actualizar
      this.adminService.actualizarEmpresa(this.selectedEmpresaId, empresaData).subscribe({
        next: (res) => {
          this.mostrarFeedback('Empresa actualizada exitosamente.', 'exito');
          this.selectEmpresa(res);
          this.cargarDatos();
        },
        error: (err) => {
          console.error(err);
          this.mostrarFeedback(err.error?.detail || 'Error al actualizar la empresa.', 'error');
        }
      });
    } else {
      // Crear
      this.adminService.crearEmpresa(empresaData).subscribe({
        next: (res) => {
          this.mostrarFeedback('Empresa creada exitosamente.', 'exito');
          this.selectEmpresa(res);
          this.cargarDatos();
        },
        error: (err) => {
          console.error(err);
          this.mostrarFeedback(err.error?.detail || 'Error al crear la empresa.', 'error');
        }
      });
    }
  }

  onEliminar(): void {
    if (!this.selectedEmpresaId) {
      this.mostrarFeedback('Seleccione una empresa para poder eliminarla.', 'error');
      return;
    }

    if (confirm('¿Está seguro de que desea eliminar esta empresa?')) {
      this.adminService.eliminarEmpresa(this.selectedEmpresaId).subscribe({
        next: () => {
          this.mostrarFeedback('Empresa eliminada con éxito.', 'exito');
          this.onNuevaEmpresa();
          this.cargarDatos();
        },
        error: (err) => {
          console.error(err);
          this.mostrarFeedback(err.error?.detail || 'Error al eliminar la empresa.', 'error');
        }
      });
    }
  }
}
