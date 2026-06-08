import heapq
from collections import defaultdict
from sqlalchemy.orm import Session
from app.infrastructure.models import BarrioDB, RutaDB, RutaBarrioDB, EmpresaDB
from app.domain.models import TramoRuta, RutaCalcularResponse

def calcular_ruta_optima(db: Session, origen_id: int, destino_id: int) -> RutaCalcularResponse:
    # Cargar de barrios
    barrios_db = db.query(BarrioDB).all()
    barrios = {b.idBarrio: b for b in barrios_db}
    
    if origen_id not in barrios or destino_id not in barrios:
        return None

    # Cargar nombres de rutas
    rutas_db = db.query(RutaDB).all()
    empresas = {e.idEmpresa: e.nombreEmpresa for e in db.query(EmpresaDB).all()}
    rutas_nombres = {
        r.idRuta: f"{empresas.get(r.idEmpresa, 'Bus')} (Frecuencia: {r.frecuencia})"
        for r in rutas_db
    }

    # Modelar el Grafo
    # Conectamos barrios secuencialmente según su orden físico en la ruta
    grafo = defaultdict(list)
    # Cargar todos los RutaBarrio en una sola consulta para evitar N+1 queries
    rutas_barrios_db = db.query(RutaBarrioDB).order_by(RutaBarrioDB.orden.asc()).all()
    rutas_barrios_map = defaultdict(list)
    for rb in rutas_barrios_db:
        rutas_barrios_map[rb.idRuta].append(rb)

    for ruta in rutas_db:
        barrios_ruta = rutas_barrios_map[ruta.idRuta]
        barrio_ids = [br.idBarrio for br in barrios_ruta]
        
        sequence = []
        if ruta.inicioRuta_id is not None:
            sequence.append(ruta.inicioRuta_id)
        for b_id in barrio_ids:
            if b_id not in sequence:
                sequence.append(b_id)
        if ruta.destinoRuta_id is not None and ruta.destinoRuta_id not in sequence:
            sequence.append(ruta.destinoRuta_id)
            
        for i in range(len(sequence) - 1):
            u = sequence[i]
            v = sequence[i + 1]
            grafo[u].append({"destino": v, "peso": 1, "ruta_id": ruta.idRuta})
            grafo[v].append({"destino": u, "peso": 1, "ruta_id": ruta.idRuta})

    # Algoritmo de Dijkstra
    distancias = {origen_id: (0, None, None)}
    queue = [(0, origen_id)]
    visitados = set()

    while queue:
        dist_actual, nodo_actual = heapq.heappop(queue)
        
        if nodo_actual == destino_id:
            break
            
        if nodo_actual in visitados:
            continue
        visitados.add(nodo_actual)
        
        for vecino in grafo[nodo_actual]:
            destino = vecino["destino"]
            peso = vecino["peso"]
            ruta_id = vecino["ruta_id"]
            
            nueva_dist = dist_actual + peso
            
            if destino not in distancias or nueva_dist < distancias[destino][0]:
                distancias[destino] = (nueva_dist, nodo_actual, ruta_id)
                heapq.heappush(queue, (nueva_dist, destino))

    if destino_id not in distancias:
        return None

    # Reconstruir el camino óptimo
    camino = []
    nodo = destino_id
    while nodo is not None:
        dist, anterior, ruta_id = distancias[nodo]
        barrio_obj = barrios.get(nodo)
        barrio_nombre = barrio_obj.nombreBarrio if barrio_obj else f"Barrio {nodo}"
        barrio_lat = barrio_obj.latitud if (barrio_obj and barrio_obj.latitud is not None) else 0.0
        barrio_lon = barrio_obj.longitud if (barrio_obj and barrio_obj.longitud is not None) else 0.0
        
        camino.append(TramoRuta(
            barrio_id=nodo,
            nombre_barrio=barrio_nombre,
            ruta_id=ruta_id,
            nombre_ruta=rutas_nombres.get(ruta_id) if ruta_id else None,
            latitud=barrio_lat,
            longitud=barrio_lon
        ))
        nodo = anterior

    camino.reverse()
    
    if camino:
        camino[0].ruta_id = None
        camino[0].nombre_ruta = None

    return RutaCalcularResponse(
        total_tramos=len(camino) - 1,
        camino=camino
    )
