"""
Cargador dinámico de casos de prueba desde JSON.

Añade nuevos escenarios editando tests/data/casos_api.json sin tocar código Python.
"""
import json
from pathlib import Path

import pytest

DATA_DIR = Path(__file__).parent / "data"


def _archivos_casos():
    return sorted(DATA_DIR.glob("*.json"))


@pytest.mark.parametrize("archivo", _archivos_casos(), ids=lambda p: p.stem)
def test_archivo_casos_tiene_estructura_valida(archivo):
    with archivo.open(encoding="utf-8") as f:
        data = json.load(f)

    assert isinstance(data, dict)
    assert len(data) > 0, f"{archivo.name} está vacío"

    for seccion, casos in data.items():
        assert isinstance(casos, list), f"La sección '{seccion}' debe ser una lista"
        for i, caso in enumerate(casos):
            assert "nombre" in caso, f"Falta 'nombre' en {seccion}[{i}]"


def test_todos_los_casos_tienen_nombre_unico():
    nombres = []
    for archivo in _archivos_casos():
        with archivo.open(encoding="utf-8") as f:
            data = json.load(f)
        for casos in data.values():
            for caso in casos:
                nombres.append(caso["nombre"])

    assert len(nombres) == len(set(nombres)), "Hay nombres de caso duplicados"
