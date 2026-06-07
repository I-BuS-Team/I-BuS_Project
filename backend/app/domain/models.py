from pydantic import BaseModel
from typing import Optional, List

class TipoUsuario(BaseModel):
    id: Optional[int]
    nombreTipo: str
    
    class Config:
        from_attributes = True

class Usuario(BaseModel):
    id: Optional[str] = None
    idTipoUsuario: int
    email: str
    contrasena: str
    
    class Config:
        from_attributes = True

class Empresa(BaseModel):
    id: Optional[int] = None
    nombreEmpresa: str
    anioFundacion: int
    direccion: str
    telefono: str
    cantBuses: int
    cantConductores: int
    
    class Config:
        from_attributes = True
    
class Barrio(BaseModel):
    id: Optional[int] = None
    nombre: str
    latitud: Optional[float] = None
    longitud: Optional[float] = None
    
    class Config:
        from_attributes = True

class Ruta(BaseModel):
    id: Optional[int] = None
    idEmpresa: int
    inicioRuta_id: int
    destinoRuta_id: int
    frecuencia: str
    barrio_ids: Optional[List[int]] = []
    
    class Config:
        from_attributes = True

class Horario(BaseModel):
    id: Optional[int]
    idRuta: Optional[int] = None
    horaSalida: str
    horaLlegada: str
    
    class Config:
        from_attributes = True

class Tiempo(BaseModel):
    id: Optional[int]
    fecha: str
    
    class Config:
        from_attributes = True

class DetalleRuta(BaseModel):
    id: Optional[int]
    idRuta: int
    idTiempo: int
    cantidadPasajeros: int
    
    class Config:
        from_attributes = True

class RutaBarrio(BaseModel):
    id: Optional[int]
    idRuta: int
    idBarrio: int
    orden: int
    
    class Config:
        from_attributes = True

class RutaCalcularRequest(BaseModel):
    origen_id: int
    destino_id: int
class TramoRuta(BaseModel):
    barrio_id: int
    nombre_barrio: str
    ruta_id: Optional[int] = None
    nombre_ruta: Optional[str] = None
    latitud: float
    longitud: float
class RutaCalcularResponse(BaseModel):
    total_tramos: int
    camino: List[TramoRuta]

class ElementoUsoDia(BaseModel):
    dia: str
    valor: int

class ElementoCobertura(BaseModel):
    nombre: str
    porcentaje: int

class EstadisticasResponse(BaseModel):
    totalRutas: int
    totalBarrios: int
    totalEmpresas: int
    usuariosActivos: int
    usoPorDia: List[ElementoUsoDia]
    coberturaRutas: List[ElementoCobertura]