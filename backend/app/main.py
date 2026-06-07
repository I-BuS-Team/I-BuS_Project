from app.domain.models import Barrio, Empresa, Ruta, Horario, Tiempo, DetalleRuta, RutaCalcularRequest, RutaCalcularResponse, EstadisticasResponse, Usuario
from app.application.routing import calcular_ruta_optima
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from app.infrastructure.database import get_db
from app.infrastructure.security import verify_jwt_token
from app.application.use_cases import (
    listar_barrios, crear_barrio, actualizar_barrio, eliminar_barrio,
    listar_empresas, crear_empresa, actualizar_empresa, eliminar_empresa,
    listar_rutas, crear_ruta, actualizar_ruta, eliminar_ruta,
    listar_horarios, crear_horario, actualizar_horario, eliminar_horario,
    listar_tiempos, crear_tiempo, actualizar_tiempo, eliminar_tiempo,
    listar_detalles_ruta, crear_detalle_ruta, actualizar_detalle_ruta, eliminar_detalle_ruta,
    obtener_estadisticas, listar_usuarios, crear_usuario, actualizar_usuario, eliminar_usuario
)


app = FastAPI()

# CORS
import os

allowed_origins = ["http://localhost:4200", "http://127.0.0.1:4200"]
env_origins = os.getenv("ALLOWED_ORIGINS")
if env_origins:
    # Soporta múltiples orígenes separados por comas
    allowed_origins.extend([origin.strip() for origin in env_origins.split(",")])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Endpoint GET /api/barrios
@app.get("/api/barrios", response_model=List[Barrio])
def get_barrios(db: Session = Depends(get_db)):
    return listar_barrios(db)

# Endpoint GET /api/empresas
@app.get("/api/empresas", response_model=List[Empresa])
def get_empresas(db: Session = Depends(get_db)):
    return listar_empresas(db)

# Helper to check if user is admin
def check_admin(token: dict):
    user_metadata = token.get("user_metadata", {})
    if user_metadata.get("idTipoUsuario") != 1:
        raise HTTPException(
            status_code=403,
            detail="Operación no permitida. Se requiere rol de administrador."
        )

# --- ENDPOINTS PARA BARRIOS (ESCRIBIR/ELIMINAR) ---
@app.post("/api/barrios", response_model=Barrio)
def post_barrio(barrio: Barrio, db: Session = Depends(get_db), token: dict = Depends(verify_jwt_token)):
    check_admin(token)
    return crear_barrio(db, barrio)

@app.put("/api/barrios/{id_barrio}", response_model=Barrio)
def put_barrio(id_barrio: int, barrio: Barrio, db: Session = Depends(get_db), token: dict = Depends(verify_jwt_token)):
    check_admin(token)
    resultado = actualizar_barrio(db, id_barrio, barrio)
    if not resultado:
        raise HTTPException(status_code=404, detail="Barrio no encontrado")
    return resultado

@app.delete("/api/barrios/{id_barrio}")
def delete_barrio(id_barrio: int, db: Session = Depends(get_db), token: dict = Depends(verify_jwt_token)):
    check_admin(token)
    if not eliminar_barrio(db, id_barrio):
        raise HTTPException(status_code=404, detail="Barrio no encontrado")
    return {"message": "Barrio eliminado con éxito"}

# --- ENDPOINTS PARA EMPRESAS (ESCRIBIR/ELIMINAR) ---
@app.post("/api/empresas", response_model=Empresa)
def post_empresa(empresa: Empresa, db: Session = Depends(get_db), token: dict = Depends(verify_jwt_token)):
    check_admin(token)
    return crear_empresa(db, empresa)

@app.put("/api/empresas/{id_empresa}", response_model=Empresa)
def put_empresa(id_empresa: int, empresa: Empresa, db: Session = Depends(get_db), token: dict = Depends(verify_jwt_token)):
    check_admin(token)
    resultado = actualizar_empresa(db, id_empresa, empresa)
    if not resultado:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    return resultado

@app.delete("/api/empresas/{id_empresa}")
def delete_empresa(id_empresa: int, db: Session = Depends(get_db), token: dict = Depends(verify_jwt_token)):
    check_admin(token)
    if not eliminar_empresa(db, id_empresa):
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    return {"message": "Empresa eliminada con éxito"}

# --- ENDPOINTS PARA ESTADÍSTICAS ---
@app.get("/api/admin/estadisticas", response_model=EstadisticasResponse)
def get_estadisticas(db: Session = Depends(get_db), token: dict = Depends(verify_jwt_token)):
    check_admin(token)
    return obtener_estadisticas(db)

# --- ENDPOINTS PARA USUARIOS (ADMIN CRUD) ---
@app.get("/api/admin/usuarios", response_model=List[Usuario])
def get_usuarios(db: Session = Depends(get_db), token: dict = Depends(verify_jwt_token)):
    check_admin(token)
    return listar_usuarios(db)

@app.post("/api/admin/usuarios", response_model=Usuario)
def post_usuario(usuario: Usuario, db: Session = Depends(get_db), token: dict = Depends(verify_jwt_token)):
    check_admin(token)
    return crear_usuario(db, usuario)

@app.put("/api/admin/usuarios/{id_usuario}", response_model=Usuario)
def put_usuario(id_usuario: str, usuario: Usuario, db: Session = Depends(get_db), token: dict = Depends(verify_jwt_token)):
    check_admin(token)
    resultado = actualizar_usuario(db, id_usuario, usuario)
    if not resultado:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return resultado

@app.delete("/api/admin/usuarios/{id_usuario}")
def delete_usuario(id_usuario: str, db: Session = Depends(get_db), token: dict = Depends(verify_jwt_token)):
    check_admin(token)
    if not eliminar_usuario(db, id_usuario):
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return {"message": "Usuario eliminado con éxito"}


# --- ENDPOINTS PARA RUTAS ---
@app.get("/api/rutas", response_model=List[Ruta])
def get_rutas(db: Session = Depends(get_db)):
    return listar_rutas(db)

@app.post("/api/rutas", response_model=Ruta)
def post_ruta(ruta: Ruta, db: Session = Depends(get_db), token: dict = Depends(verify_jwt_token)):
    check_admin(token)
    return crear_ruta(db, ruta)

@app.put("/api/rutas/{id_ruta}", response_model=Ruta)
def put_ruta(id_ruta: int, ruta: Ruta, db: Session = Depends(get_db), token: dict = Depends(verify_jwt_token)):
    check_admin(token)
    resultado = actualizar_ruta(db, id_ruta, ruta)
    if not resultado:
        raise HTTPException(status_code=404, detail="Ruta no encontrada")
    return resultado

@app.delete("/api/rutas/{id_ruta}")
def delete_ruta(id_ruta: int, db: Session = Depends(get_db), token: dict = Depends(verify_jwt_token)):
    check_admin(token)
    if not eliminar_ruta(db, id_ruta):
        raise HTTPException(status_code=404, detail="Ruta no encontrada")
    return {"message": "Ruta eliminada con éxito"}

# --- ENDPOINTS PARA HORARIOS ---
@app.get("/api/horarios", response_model=List[Horario])
def get_horarios(db: Session = Depends(get_db)):
    return listar_horarios(db)

@app.post("/api/horarios", response_model=Horario)
def post_horario(horario: Horario, db: Session = Depends(get_db), token: dict = Depends(verify_jwt_token)):
    check_admin(token)
    return crear_horario(db, horario)

@app.put("/api/horarios/{id_horario}", response_model=Horario)
def put_horario(id_horario: int, horario: Horario, db: Session = Depends(get_db), token: dict = Depends(verify_jwt_token)):
    check_admin(token)
    resultado = actualizar_horario(db, id_horario, horario)
    if not resultado:
        raise HTTPException(status_code=404, detail="Horario no encontrado")
    return resultado

@app.delete("/api/horarios/{id_horario}")
def delete_horario(id_horario: int, db: Session = Depends(get_db), token: dict = Depends(verify_jwt_token)):
    check_admin(token)
    if not eliminar_horario(db, id_horario):
        raise HTTPException(status_code=404, detail="Horario no encontrado")
    return {"message": "Horario eliminado con éxito"}

# --- ENDPOINTS PARA TIEMPOS ---
@app.get("/api/tiempos", response_model=List[Tiempo])
def get_tiempos(db: Session = Depends(get_db)):
    return listar_tiempos(db)

@app.post("/api/tiempos", response_model=Tiempo)
def post_tiempo(tiempo: Tiempo, db: Session = Depends(get_db), token: dict = Depends(verify_jwt_token)):
    check_admin(token)
    return crear_tiempo(db, tiempo)

@app.put("/api/tiempos/{id_tiempo}", response_model=Tiempo)
def put_tiempo(id_tiempo: int, tiempo: Tiempo, db: Session = Depends(get_db), token: dict = Depends(verify_jwt_token)):
    check_admin(token)
    resultado = actualizar_tiempo(db, id_tiempo, tiempo)
    if not resultado:
        raise HTTPException(status_code=404, detail="Tiempo no encontrado")
    return resultado

@app.delete("/api/tiempos/{id_tiempo}")
def delete_tiempo(id_tiempo: int, db: Session = Depends(get_db), token: dict = Depends(verify_jwt_token)):
    check_admin(token)
    if not eliminar_tiempo(db, id_tiempo):
        raise HTTPException(status_code=404, detail="Tiempo no encontrado")
    return {"message": "Tiempo eliminado con éxito"}

# --- ENDPOINTS PARA DETALLES ---
@app.get("/api/detalles", response_model=List[DetalleRuta])
def get_detalles(db: Session = Depends(get_db)):
    return listar_detalles_ruta(db)

@app.post("/api/detalles", response_model=DetalleRuta)
def post_detalle(detalle: DetalleRuta, db: Session = Depends(get_db), token: dict = Depends(verify_jwt_token)):
    check_admin(token)
    return crear_detalle_ruta(db, detalle)

@app.put("/api/detalles/{id_detalle}", response_model=DetalleRuta)
def put_detalle(id_detalle: int, detalle: DetalleRuta, db: Session = Depends(get_db), token: dict = Depends(verify_jwt_token)):
    check_admin(token)
    resultado = actualizar_detalle_ruta(db, id_detalle, detalle)
    if not resultado:
        raise HTTPException(status_code=404, detail="Detalle de ruta no encontrado")
    return resultado

@app.delete("/api/detalles/{id_detalle}")
def delete_detalle(id_detalle: int, db: Session = Depends(get_db), token: dict = Depends(verify_jwt_token)):
    check_admin(token)
    if not eliminar_detalle_ruta(db, id_detalle):
        raise HTTPException(status_code=404, detail="Detalle de ruta no encontrado")
    return {"message": "Detalle de ruta eliminado con éxito"}

# --- ENDPOINT CÁLCULO DE RUTA ---
@app.post("/api/rutas/calcular", response_model=RutaCalcularResponse)
def post_calcular_ruta(request: RutaCalcularRequest, db: Session = Depends(get_db), token: dict = Depends(verify_jwt_token)):
    resultado = calcular_ruta_optima(db, request.origen_id, request.destino_id)
    if resultado is None:
        raise HTTPException(
            status_code=404, 
            detail="No se encontró una combinación de rutas de transporte público que conecte el origen y destino seleccionados."
        )
    return resultado