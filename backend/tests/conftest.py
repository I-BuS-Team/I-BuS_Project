"""
Fixtures compartidas para pruebas dinámicas del backend I-BuS.

Usa SQLite en memoria para aislar cada prueba y sobrescribe las dependencias
de FastAPI (BD y JWT) sin necesitar PostgreSQL ni Supabase en ejecución local.
"""
import os
from datetime import date, time

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.infrastructure.database import Base, get_db
from app.infrastructure.models import (
    BarrioDB,
    EmpresaDB,
    HorarioDB,
    RutaBarrioDB,
    RutaDB,
    TipoUsuarioDB,
    TiempoDB,
)
from app.infrastructure.security import verify_jwt_token
from app.main import app

# Modo desarrollo: permite tokens JWT simulados en cabecera Authorization
os.environ.setdefault("DEBUG", "true")

TEST_ENGINE = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=TEST_ENGINE)


def _seed_transport_graph(db):
    """Grafo mínimo: Centro (1) -> Puente (2) -> UPTC (3)."""
    empresa = EmpresaDB(
        nombreEmpresa="TransTunja Test",
        anioFundacion=2000,
        direccion="Calle 1",
        telefono="3000000000",
        cantBuses=10,
        cantConductores=5,
    )
    db.add(empresa)
    db.flush()

    barrios = [
        BarrioDB(nombreBarrio="Centro", latitud=5.5353, longitud=-73.3678),
        BarrioDB(nombreBarrio="Puente", latitud=5.5400, longitud=-73.3600),
        BarrioDB(nombreBarrio="UPTC", latitud=5.5450, longitud=-73.3550),
        BarrioDB(nombreBarrio="Aislado", latitud=5.5000, longitud=-73.4000),
    ]
    db.add_all(barrios)
    db.flush()

    ruta_1 = RutaDB(
        idEmpresa=empresa.idEmpresa,
        inicioRuta_id=barrios[0].idBarrio,
        destinoRuta_id=barrios[1].idBarrio,
        frecuencia="5-10 min",
    )
    ruta_2 = RutaDB(
        idEmpresa=empresa.idEmpresa,
        inicioRuta_id=barrios[1].idBarrio,
        destinoRuta_id=barrios[2].idBarrio,
        frecuencia="5-15 min",
    )
    db.add_all([ruta_1, ruta_2])
    db.flush()

    db.add_all(
        [
            RutaBarrioDB(idRuta=ruta_1.idRuta, idBarrio=barrios[0].idBarrio, orden=1),
            RutaBarrioDB(idRuta=ruta_1.idRuta, idBarrio=barrios[1].idBarrio, orden=2),
            RutaBarrioDB(idRuta=ruta_2.idRuta, idBarrio=barrios[1].idBarrio, orden=1),
            RutaBarrioDB(idRuta=ruta_2.idRuta, idBarrio=barrios[2].idBarrio, orden=2),
        ]
    )

    db.add(
        HorarioDB(
            idRuta=ruta_1.idRuta,
            horaSalida=time(6, 0),
            horaLlegada=time(6, 20),
        )
    )
    db.add(TiempoDB(fecha=date(2025, 6, 1)))

    db.add(TipoUsuarioDB(idTipoUsuario=1, nombreTipo="Administrador"))
    db.add(TipoUsuarioDB(idTipoUsuario=2, nombreTipo="Usuario"))
    db.commit()

    return {
        "centro_id": barrios[0].idBarrio,
        "puente_id": barrios[1].idBarrio,
        "uptc_id": barrios[2].idBarrio,
        "aislado_id": barrios[3].idBarrio,
        "empresa_id": empresa.idEmpresa,
        "ruta_1_id": ruta_1.idRuta,
        "ruta_2_id": ruta_2.idRuta,
    }


@pytest.fixture
def db():
    Base.metadata.create_all(bind=TEST_ENGINE)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=TEST_ENGINE)


@pytest.fixture
def seed_data(db):
    return _seed_transport_graph(db)


@pytest.fixture
def admin_token():
    return {"sub": "admin-test", "user_metadata": {"idTipoUsuario": 1, "nombre": "Admin"}}


@pytest.fixture
def user_token():
    return {"sub": "user-test", "user_metadata": {"idTipoUsuario": 2, "nombre": "Usuario"}}


@pytest.fixture
def client(db, admin_token):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    def override_verify_jwt():
        return admin_token

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[verify_jwt_token] = override_verify_jwt

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture
def client_as_user(db, user_token):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    def override_verify_jwt():
        return user_token

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[verify_jwt_token] = override_verify_jwt

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture
def auth_headers():
    return {"Authorization": "Bearer test-token-simulado"}
