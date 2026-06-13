"""Pruebas dinámicas del endpoint POST /api/rutas/calcular."""
import json
from pathlib import Path

import pytest

CASOS_PATH = Path(__file__).parent / "data" / "casos_api.json"


def _load_casos_calcular():
    with CASOS_PATH.open(encoding="utf-8") as f:
        return json.load(f)["casos_calcular_ruta"]


def _resolver_ids(caso, seed_data):
    if "origen_id" in caso:
        return caso["origen_id"], caso["destino_id"]
    return seed_data[caso["origen_key"]], seed_data[caso["destino_key"]]


@pytest.mark.parametrize("caso", _load_casos_calcular(), ids=lambda c: c["nombre"])
def test_calcular_ruta_parametrizado(client, seed_data, auth_headers, caso):
    origen_id, destino_id = _resolver_ids(caso, seed_data)

    response = client.post(
        "/api/rutas/calcular",
        json={"origen_id": origen_id, "destino_id": destino_id},
        headers=auth_headers,
    )

    assert response.status_code == caso["status"]

    if caso["status"] == 200:
        body = response.json()
        assert body["total_tramos"] >= caso["min_tramos"]
        assert body["camino"][0]["nombre_barrio"] == caso["primer_barrio"]
        assert body["camino"][-1]["nombre_barrio"] == caso["ultimo_barrio"]
    else:
        assert "detail" in response.json()


def test_calcular_ruta_requiere_autenticacion(db, seed_data):
    """Sin override de JWT, el endpoint debe exigir token."""
    from fastapi.testclient import TestClient

    from app.infrastructure.database import get_db
    from app.infrastructure.security import verify_jwt_token
    from app.main import app

    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides.pop(verify_jwt_token, None)

    with TestClient(app) as unauth_client:
        response = unauth_client.post(
            "/api/rutas/calcular",
            json={"origen_id": seed_data["centro_id"], "destino_id": seed_data["uptc_id"]},
        )
        assert response.status_code in (401, 403)

    app.dependency_overrides.clear()
