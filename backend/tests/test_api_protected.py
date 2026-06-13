"""Pruebas dinámicas de endpoints protegidos (JWT + rol admin)."""
import json
from pathlib import Path

import pytest

CASOS_PATH = Path(__file__).parent / "data" / "casos_api.json"


def _load_casos_crud():
    with CASOS_PATH.open(encoding="utf-8") as f:
        return json.load(f)["casos_crud_barrio"]


@pytest.mark.parametrize("caso", _load_casos_crud(), ids=lambda c: c["nombre"])
def test_crud_barrio_parametrizado(client, seed_data, auth_headers, caso):
    kwargs = {"headers": auth_headers}
    if "body" in caso:
        kwargs["json"] = caso["body"]

    method = caso["method"].lower()
    response = getattr(client, method)(caso["path"], **kwargs)

    assert response.status_code == caso["expected_status"]

    if caso["expected_status"] == 200 and "response_fields" in caso:
        body = response.json()
        for field in caso["response_fields"]:
            assert field in body


def test_usuario_sin_rol_admin_recibe_403(client_as_user, seed_data, auth_headers):
    response = client_as_user.post(
        "/api/barrios",
        json={"nombre": "Barrio Prohibido"},
        headers=auth_headers,
    )
    assert response.status_code == 403
    assert "administrador" in response.json()["detail"].lower()


def test_crear_y_eliminar_barrio_flujo_completo(client, seed_data, auth_headers):
    crear = client.post(
        "/api/barrios",
        json={"nombre": "Barrio Temporal"},
        headers=auth_headers,
    )
    assert crear.status_code == 200
    barrio_id = crear.json()["id"]

    actualizar = client.put(
        f"/api/barrios/{barrio_id}",
        json={"nombre": "Barrio Actualizado"},
        headers=auth_headers,
    )
    assert actualizar.status_code == 200
    assert actualizar.json()["nombre"] == "Barrio Actualizado"

    eliminar = client.delete(f"/api/barrios/{barrio_id}", headers=auth_headers)
    assert eliminar.status_code == 200

    barrios = client.get("/api/barrios").json()
    assert all(b["id"] != barrio_id for b in barrios)


def test_crear_ruta_como_admin(client, seed_data, auth_headers):
    payload = {
        "idEmpresa": seed_data["empresa_id"],
        "inicioRuta_id": seed_data["centro_id"],
        "destinoRuta_id": seed_data["puente_id"],
        "frecuencia": "10 min",
        "barrio_ids": [seed_data["centro_id"], seed_data["puente_id"]],
    }
    response = client.post("/api/rutas", json=payload, headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["frecuencia"] == "10 min"
