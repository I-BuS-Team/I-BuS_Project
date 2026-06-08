import { Component, signal, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('frontend');

  ngOnInit(): void {
    // Aplicar configuraciones de accesibilidad guardadas al iniciar la app
    const altoContraste = localStorage.getItem('altoContraste') === 'true';
    const modoOscuro = localStorage.getItem('modoOscuro') !== 'false'; // default to true
    const tamanoTexto = localStorage.getItem('tamanoTexto') ? Number(localStorage.getItem('tamanoTexto')) : 50;

    if (altoContraste) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }

    if (modoOscuro) {
      document.body.classList.add('dark');
      document.documentElement.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
      document.documentElement.classList.remove('dark');
    }

    const scale = tamanoTexto <= 50 
      ? 0.8 + ((tamanoTexto - 1) / 49) * 0.2 
      : 1.0 + ((tamanoTexto - 50) / 50) * 0.5;
    
    document.documentElement.style.fontSize = `${scale}rem`;
    document.documentElement.style.setProperty('--font-scale', scale.toString());
  }
}
