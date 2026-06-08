import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login';
import { RegistroComponent } from './features/auth/registro/registro';
import { PerfilComponent } from './features/auth/perfil/perfil';
import { Dashboard as AdminDashboard } from './features/admin/dashboard/dashboard';
import { Estadisticas } from './features/admin/estadisticas/estadisticas';
import { GestionarBarrios } from './features/admin/gestionar-barrios/gestionar-barrios';
import { GestionarEmpresas } from './features/admin/gestionar-empresas/gestionar-empresas';
import { GestionarRutas } from './features/admin/gestionar-rutas/gestionar-rutas';
import { GestionarUsuarios } from './features/admin/gestionar-usuarios/gestionar-usuarios';
import { BuscarRutas } from './features/usuario/buscar-rutas/buscar-rutas';
import { PanelAjustes } from './features/ajustes/panel-ajustes/panel-ajustes';
import { GestionarDetalleRuta } from './features/admin/gestionar-rutas/components/gestionar-detalle-ruta/gestionar-detalle-ruta';
import { GestionarHorarios } from './features/admin/gestionar-rutas/components/gestionar-horarios/gestionar-horarios';
import { GestionarTiempos } from './features/admin/gestionar-rutas/components/gestionar-tiempos/gestionar-tiempos';
import { adminGuard } from './features/auth/guards/admin.guard';
import { authGuard } from './features/auth/guards/auth.guard';

export const routes: Routes = [
    { path: '', redirectTo: 'auth/login', pathMatch: 'full' },
    { path: 'auth/login', component: LoginComponent },
    { path: 'auth/registro', component: RegistroComponent },
    { path: 'auth/perfil', component: PerfilComponent, canActivate: [authGuard] },
    { path: 'admin-dashboard', redirectTo: 'admin/dashboard', pathMatch: 'full' },
    { path: 'admin/dashboard', component: AdminDashboard, canActivate: [adminGuard] },
    { path: 'admin/estadisticas', component: Estadisticas, canActivate: [adminGuard] },
    { path: 'admin/barrios', component: GestionarBarrios, canActivate: [adminGuard] },
    { path: 'admin/empresas', component: GestionarEmpresas, canActivate: [adminGuard] },
    { path: 'admin/rutas', component: GestionarRutas, canActivate: [adminGuard] },
    { path: 'admin/rutas/detalle', component: GestionarDetalleRuta, canActivate: [adminGuard] },
    { path: 'admin/rutas/horarios', component: GestionarHorarios, canActivate: [adminGuard] },
    { path: 'admin/rutas/tiempos', component: GestionarTiempos, canActivate: [adminGuard] },
    { path: 'admin/usuarios', component: GestionarUsuarios, canActivate: [adminGuard] },
    { path: 'usuario/dashboard', redirectTo: 'usuario/buscar-rutas', pathMatch: 'full' },
    { path: 'usuario/buscar-rutas', component: BuscarRutas, canActivate: [authGuard] },
    { path: 'usuario/ajustes', component: PanelAjustes, canActivate: [authGuard] },
    { path: '**', redirectTo: 'auth/login' }
];