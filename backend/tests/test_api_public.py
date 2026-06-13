"""Pruebas dinámicas de endpoints públicos (GET sin autenticación)."""
import json
from pathlib import Path

import pytest

CASOS_PATH = Path(__file__).parent / "data" / "casos_api.json"


def _load_casos():
    with CASOS_PATH.open(encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture(scope="module")
def casos_api():
    return _load_casos()


@pytest.mark.parametrize(
    "caso",
    _load_casos()["endpoints_publicos_get"],
    ids=lambda c: c["nombre"],
)
def test_endpoints_publicos_get(client, seed_data, caso):
    response = client.get(caso["path"])
    assert response.status_code == 200

    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= caso["min_items"]


def test_barrios_incluyen_coordenadas(client, seed_data):
    response = client.get("/api/barrios")
    assert response.status_code == 200

    centro = next(b for b in response.json() if b["nombre"] == "Centro")
    assert centro["latitud"] is not None
    assert centro["longitud"] is not None
    assert centro["usado"] is True


def test_rutas_incluyen_barrio_ids(client, seed_data):
    response = client.get("/api/rutas")
    assert response.status_code == 200

    rutas = response.json()
    assert len(rutas) >= 2
    assert all("barrio_ids" in ruta for ruta in rutas)
    assert all(len(ruta["barrio_ids"]) >= 2 for ruta in rutas)
