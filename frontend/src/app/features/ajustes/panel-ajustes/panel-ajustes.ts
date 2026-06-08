import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-panel-ajustes',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './panel-ajustes.html',
  styleUrl: './panel-ajustes.scss',
})
export class PanelAjustes implements OnInit {
  altoContraste = false;
  modoOscuro = true;
  notificaciones = true;
  tamanoTexto = 50;
  idioma = 'es';
  isAdminUser = false;

  constructor(private authService: AuthService) {}

  translations: any = {
    es: {
      ajustes: 'Ajustes',
      accesibilidad: 'Accesibilidad',
      descAccesibilidad: 'Configura la visualización según tus necesidades visuales.',
      tamanoTexto: 'Tamaño de texto',
      altoContraste: 'Alto Contraste',
      modoOscuro: 'Modo Oscuro',
      general: 'General',
      notificaciones: 'Notificaciones',
      idioma: 'Idioma',
      idiomaSeleccionado: 'Español',
      ayuda: 'Ayuda y Soporte',
      terminos: 'Términos y Condiciones',
      version: 'I - BuS Versión 1.0.0',
      ciudad: 'Sogamoso, 2025',
      perfil: 'Perfil',
      mapa: 'Mapa'
    },
    en: {
      ajustes: 'Settings',
      accesibilidad: 'Accessibility',
      descAccesibilidad: 'Configure the display according to your visual needs.',
      tamanoTexto: 'Text Size',
      altoContraste: 'High Contrast',
      modoOscuro: 'Dark Mode',
      general: 'General',
      notificaciones: 'Notifications',
      idioma: 'Language',
      idiomaSeleccionado: 'English',
      ayuda: 'Help & Support',
      terminos: 'Terms & Conditions',
      version: 'I - BuS Version 1.0.0',
      ciudad: 'Sogamoso, 2025',
      perfil: 'Profile',
      mapa: 'Map'
    }
  };

  ngOnInit(): void {
    // Cargar rol de usuario
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        if (user) {
          const email = user.email || '';
          const idTipo = user.user_metadata?.['idTipoUsuario'];
          this.isAdminUser = email === 'admin@ibus.com' || idTipo === 1 || idTipo === '1';
        }
      },
      error: (err) => {
        console.warn('Error al obtener el rol de usuario:', err);
      }
    });

    // Cargar configuraciones guardadas
    const savedContraste = localStorage.getItem('altoContraste');
    this.altoContraste = savedContraste === 'true';

    const savedOscuro = localStorage.getItem('modoOscuro');
    this.modoOscuro = savedOscuro !== 'false'; // default a true

    const savedNotif = localStorage.getItem('notificaciones');
    this.notificaciones = savedNotif !== 'false'; // default a true

    const savedTexto = localStorage.getItem('tamanoTexto');
    this.tamanoTexto = savedTexto ? Number(savedTexto) : 50;
    
    this.idioma = localStorage.getItem('idioma') || 'es';
    
    this.aplicarCambios();
  }

  t(key: string): string {
    return this.translations[this.idioma]?.[key] || key;
  }

  cambiarIdioma(): void {
    this.idioma = this.idioma === 'es' ? 'en' : 'es';
    localStorage.setItem('idioma', this.idioma);
  }

  toggleContraste(): void {
    this.altoContraste = !this.altoContraste;
    localStorage.setItem('altoContraste', String(this.altoContraste));
    this.aplicarCambios();
  }

  toggleOscuro(): void {
    this.modoOscuro = !this.modoOscuro;
    localStorage.setItem('modoOscuro', String(this.modoOscuro));
    this.aplicarCambios();
  }

  toggleNotificaciones(): void {
    this.notificaciones = !this.notificaciones;
    localStorage.setItem('notificaciones', String(this.notificaciones));
  }

  onTamanoTextoChange(): void {
    localStorage.setItem('tamanoTexto', String(this.tamanoTexto));
    this.aplicarCambios();
  }

  aplicarCambios(): void {
    // 1. Alto Contraste
    if (this.altoContraste) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }

    // 2. Modo Oscuro
    if (this.modoOscuro) {
      document.body.classList.add('dark');
      document.documentElement.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
      document.documentElement.classList.remove('dark');
    }

    // 3. Tamaño de texto (mapea el slider de 1-100 a un multiplicador de rem/escala de 0.8 a 1.5)
    const scale = this.tamanoTexto <= 50 
      ? 0.8 + ((this.tamanoTexto - 1) / 49) * 0.2 
      : 1.0 + ((this.tamanoTexto - 50) / 50) * 0.5;
      
    document.documentElement.style.fontSize = `${scale}rem`;
    document.documentElement.style.setProperty('--font-scale', scale.toString());
  }
}
