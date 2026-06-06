from app.domain.models import Barrio, Empresa, Ruta, Horario, Tiempo, DetalleRuta, RutaCalcularRequest, RutaCalcularResponse
from app.application.routing import calcular_ruta_optima
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from app.infrastructure.database import get_db
from app.infrastructure.security import verify_jwt_token
from app.application.use_cases import (
    listar_barrios, listar_empresas,
    listar_rutas, crear_ruta, actualizar_ruta, eliminar_ruta,
    listar_horarios, crear_horario, actualizar_horario, eliminar_horario,
    listar_tiempos, crear_tiempo, actualizar_tiempo, eliminar_tiempo,
    listar_detalles_ruta, crear_detalle_ruta, actualizar_detalle_ruta, eliminar_detalle_ruta
)

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
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