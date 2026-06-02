from app.domain.models import Barrio, Empresa, Ruta, Horario, Tiempo, RutaCalcularRequest, RutaCalcularResponse
from app.application.routing import calcular_ruta_optima
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from app.infrastructure.database import get_db
from app.infrastructure.security import verify_jwt_token
from app.application.use_cases import (
    listar_barrios, listar_empresas,
    crear_ruta, actualizar_ruta,
    crear_horario, actualizar_horario,
    crear_tiempo, actualizar_tiempo
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

# --- ENDPOINTS PARA RUTAS ---
@app.post("/api/rutas", response_model=Ruta)
def post_ruta(ruta: Ruta, db: Session = Depends(get_db), token: dict = Depends(verify_jwt_token)):
    return crear_ruta(db, ruta)

@app.put("/api/rutas/{id_ruta}", response_model=Ruta)
def put_ruta(id_ruta: int, ruta: Ruta, db: Session = Depends(get_db), token: dict = Depends(verify_jwt_token)):
    resultado = actualizar_ruta(db, id_ruta, ruta)
    if not resultado:
        raise HTTPException(status_code=404, detail="Ruta no encontrada")
    return resultado

# --- ENDPOINTS PARA HORARIOS ---
@app.post("/api/horarios", response_model=Horario)
def post_horario(horario: Horario, db: Session = Depends(get_db), token: dict = Depends(verify_jwt_token)):
    return crear_horario(db, horario)

@app.put("/api/horarios/{id_horario}", response_model=Horario)
def put_horario(id_horario: int, horario: Horario, db: Session = Depends(get_db), token: dict = Depends(verify_jwt_token)):
    resultado = actualizar_horario(db, id_horario, horario)
    if not resultado:
        raise HTTPException(status_code=404, detail="Horario no encontrado")
    return resultado

# --- ENDPOINTS PARA TIEMPOS ---
@app.post("/api/tiempos", response_model=Tiempo)
def post_tiempo(tiempo: Tiempo, db: Session = Depends(get_db), token: dict = Depends(verify_jwt_token)):
    return crear_tiempo(db, tiempo)

@app.put("/api/tiempos/{id_tiempo}", response_model=Tiempo)
def put_tiempo(id_tiempo: int, tiempo: Tiempo, db: Session = Depends(get_db), token: dict = Depends(verify_jwt_token)):
    resultado = actualizar_tiempo(db, id_tiempo, tiempo)
    if not resultado:
        raise HTTPException(status_code=404, detail="Tiempo no encontrado")
    return resultado

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