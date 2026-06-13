"""Pruebas unitarias del algoritmo de cálculo de rutas."""
from app.application.routing import calcular_ruta_optima


def test_calculo_ruta_optima_exitoso(db, seed_data):
    resultado = calcular_ruta_optima(db, seed_data["centro_id"], seed_data["uptc_id"])

    assert resultado is not None
    assert len(resultado.camino) >= 3
    assert resultado.camino[0].nombre_barrio == "Centro"
    assert resultado.camino[-1].nombre_barrio == "UPTC"
    assert resultado.total_tramos == len(resultado.camino) - 1


def test_calculo_ruta_invalida(db, seed_data):
    resultado = calcular_ruta_optima(db, 9999, 8888)
    assert resultado is None


def test_calculo_ruta_sin_conexion(db, seed_data):
    resultado = calcular_ruta_optima(
        db, seed_data["centro_id"], seed_data["aislado_id"]
    )
    assert resultado is None


def test_calculo_ruta_mismo_origen_destino(db, seed_data):
    resultado = calcular_ruta_optima(db, seed_data["centro_id"], seed_data["centro_id"])

    assert resultado is not None
    assert len(resultado.camino) == 1
    assert resultado.total_tramos == 0
