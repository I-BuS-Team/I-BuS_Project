from sqlalchemy.orm import Session
from app.infrastructure.repositories import (
    BarrioRepository, EmpresaRepository, RutaRepository, HorarioRepository, 
    TiempoRepository, DetalleRutaRepository, RutaBarrioRepository
)
from app.domain.models import (
    Barrio as DomainBarrio, Empresa as DomainEmpresa, Ruta as DomainRuta, 
    Horario as DomainHorario, Tiempo as DomainTiempo, DetalleRuta as DomainDetalleRuta
)
from app.infrastructure.models import RutaDB, HorarioDB, TiempoDB, DetalleRutaDB, RutaBarrioDB

def listar_barrios(db: Session):
    repo = BarrioRepository(db)
    barrios_db = repo.get_all()
    return [
        DomainBarrio(id=b.idBarrio, nombre=b.nombreBarrio)
        for b in barrios_db
    ]

def listar_empresas(db: Session):
    repo = EmpresaRepository(db)
    empresas_db = repo.get_all()
    return [
        DomainEmpresa(
            id=e.idEmpresa,
            nombreEmpresa=e.nombreEmpresa,
            anioFundacion=e.anioFundacion,
            direccion=e.direccion,
            telefono=e.telefono,
            cantBuses=e.cantBuses,
            cantConductores=e.cantConductores
        )
        for e in empresas_db
    ]

# --- CASOS DE USO DE RUTAS ---
def listar_rutas(db: Session):
    repo = RutaRepository(db)
    rutas_db = repo.get_all()
    res = []
    for r in rutas_db:
        barrios_db = db.query(RutaBarrioDB).filter(RutaBarrioDB.idRuta == r.idRuta).all()
        barrio_ids = [b.idBarrio for b in barrios_db]
        res.append(
            DomainRuta(
                id=r.idRuta,
                idEmpresa=r.idEmpresa,
                inicioRuta_id=r.inicioRuta_id,
                destinoRuta_id=r.destinoRuta_id,
                frecuencia=r.frecuencia,
                barrio_ids=barrio_ids
            )
        )
    return res

def crear_ruta(db: Session, ruta_in: DomainRuta):
    repo = RutaRepository(db)
    nueva_ruta = RutaDB(
        idEmpresa=ruta_in.idEmpresa,
        inicioRuta_id=ruta_in.inicioRuta_id,
        destinoRuta_id=ruta_in.destinoRuta_id,
        frecuencia=ruta_in.frecuencia
    )
    creada = repo.create(nueva_ruta)
    
    # Guardar barrios asociados
    if ruta_in.barrio_ids:
        for b_id in ruta_in.barrio_ids:
            rb_db = RutaBarrioDB(idRuta=creada.idRuta, idBarrio=b_id)
            db.add(rb_db)
        db.commit()
        
    return DomainRuta(
        id=creada.idRuta,
        idEmpresa=creada.idEmpresa,
        inicioRuta_id=creada.inicioRuta_id,
        destinoRuta_id=creada.destinoRuta_id,
        frecuencia=creada.frecuencia,
        barrio_ids=ruta_in.barrio_ids or []
    )

def actualizar_ruta(db: Session, id_ruta: int, ruta_update: DomainRuta):
    repo = RutaRepository(db)
    ruta_db = repo.get_by_id(id_ruta)
    if not ruta_db:
        return None
    ruta_db.idEmpresa = ruta_update.idEmpresa
    ruta_db.inicioRuta_id = ruta_update.inicioRuta_id
    ruta_db.destinoRuta_id = ruta_update.destinoRuta_id
    ruta_db.frecuencia = ruta_update.frecuencia
    
    actualizada = repo.update(ruta_db)
    
    # Actualizar barrios asociados
    db.query(RutaBarrioDB).filter(RutaBarrioDB.idRuta == id_ruta).delete()
    if ruta_update.barrio_ids:
        for b_id in ruta_update.barrio_ids:
            rb_db = RutaBarrioDB(idRuta=id_ruta, idBarrio=b_id)
            db.add(rb_db)
    db.commit()
    
    return DomainRuta(
        id=actualizada.idRuta,
        idEmpresa=actualizada.idEmpresa,
        inicioRuta_id=actualizada.inicioRuta_id,
        destinoRuta_id=actualizada.destinoRuta_id,
        frecuencia=actualizada.frecuencia,
        barrio_ids=ruta_update.barrio_ids or []
    )

def eliminar_ruta(db: Session, id_ruta: int) -> bool:
    repo = RutaRepository(db)
    ruta_db = repo.get_by_id(id_ruta)
    if not ruta_db:
        return False
    # Eliminar registros dependientes
    db.query(DetalleRutaDB).filter(DetalleRutaDB.idRuta == id_ruta).delete()
    db.query(RutaBarrioDB).filter(RutaBarrioDB.idRuta == id_ruta).delete()
    db.delete(ruta_db)
    db.commit()
    return True

# --- CASOS DE USO DE HORARIOS ---
def listar_horarios(db: Session):
    repo = HorarioRepository(db)
    horarios_db = repo.get_all()
    return [
        DomainHorario(id=h.idHorario, idEmpresa=h.idEmpresa, horaSalida=str(h.horaSalida), horaLlegada=str(h.horaLlegada))
        for h in horarios_db
    ]

def crear_horario(db: Session, horario_in: DomainHorario):
    repo = HorarioRepository(db)
    nuevo_horario = HorarioDB(
        idEmpresa=horario_in.idEmpresa,
        horaSalida=horario_in.horaSalida,
        horaLlegada=horario_in.horaLlegada
    )
    creado = repo.create(nuevo_horario)
    return DomainHorario(id=creado.idHorario, idEmpresa=creado.idEmpresa, horaSalida=str(creado.horaSalida), horaLlegada=str(creado.horaLlegada))

def actualizar_horario(db: Session, id_horario: int, horario_update: DomainHorario):
    repo = HorarioRepository(db)
    horario_db = repo.get_by_id(id_horario)
    if not horario_db:
        return None
    horario_db.idEmpresa = horario_update.idEmpresa
    horario_db.horaSalida = horario_update.horaSalida
    horario_db.horaLlegada = horario_update.horaLlegada
    
    actualizado = repo.update(horario_db)
    return DomainHorario(id=actualizado.idHorario, idEmpresa=actualizado.idEmpresa, horaSalida=str(actualizado.horaSalida), horaLlegada=str(actualizado.horaLlegada))

def eliminar_horario(db: Session, id_horario: int) -> bool:
    repo = HorarioRepository(db)
    horario_db = repo.get_by_id(id_horario)
    if not horario_db:
        return False
    db.delete(horario_db)
    db.commit()
    return True

# --- CASOS DE USO DE TIEMPOS ---
def listar_tiempos(db: Session):
    repo = TiempoRepository(db)
    tiempos_db = repo.get_all()
    return [
        DomainTiempo(id=t.idTiempo, fecha=str(t.fecha))
        for t in tiempos_db
    ]

def crear_tiempo(db: Session, tiempo_in: DomainTiempo):
    repo = TiempoRepository(db)
    nuevo_tiempo = TiempoDB(fecha=tiempo_in.fecha)
    creado = repo.create(nuevo_tiempo)
    return DomainTiempo(id=creado.idTiempo, fecha=str(creado.fecha))

def actualizar_tiempo(db: Session, id_tiempo: int, tiempo_update: DomainTiempo):
    repo = TiempoRepository(db)
    tiempo_db = repo.get_by_id(id_tiempo)
    if not tiempo_db:
        return None
    tiempo_db.fecha = tiempo_update.fecha
    
    actualizado = repo.update(tiempo_db)
    return DomainTiempo(id=actualizado.idTiempo, fecha=str(actualizado.fecha))

def eliminar_tiempo(db: Session, id_tiempo: int) -> bool:
    repo = TiempoRepository(db)
    tiempo_db = repo.get_by_id(id_tiempo)
    if not tiempo_db:
        return False
    # DetalleRuta depende de Tiempo, eliminar primero
    db.query(DetalleRutaDB).filter(DetalleRutaDB.idTiempo == id_tiempo).delete()
    db.delete(tiempo_db)
    db.commit()
    return True

# --- CASOS DE USO DE DETALLE RUTA (PASAJEROS) ---
def listar_detalles_ruta(db: Session):
    repo = DetalleRutaRepository(db)
    detalles_db = repo.get_all()
    return [
        DomainDetalleRuta(
            id=d.idDetalleRuta,
            idRuta=d.idRuta,
            idTiempo=d.idTiempo,
            cantidadPasajeros=d.cantidadPasajeros
        )
        for d in detalles_db
    ]

def crear_detalle_ruta(db: Session, detalle_in: DomainDetalleRuta):
    repo = DetalleRutaRepository(db)
    nuevo_detalle = DetalleRutaDB(
        idRuta=detalle_in.idRuta,
        idTiempo=detalle_in.idTiempo,
        cantidadPasajeros=detalle_in.cantidadPasajeros
    )
    creado = repo.create(nuevo_detalle)
    return DomainDetalleRuta(
        id=creado.idDetalleRuta,
        idRuta=creado.idRuta,
        idTiempo=creado.idTiempo,
        cantidadPasajeros=creado.cantidadPasajeros
    )

def actualizar_detalle_ruta(db: Session, id_detalle: int, detalle_update: DomainDetalleRuta):
    repo = DetalleRutaRepository(db)
    detalle_db = repo.get_by_id(id_detalle)
    if not detalle_db:
        return None
    detalle_db.idRuta = detalle_update.idRuta
    detalle_db.idTiempo = detalle_update.idTiempo
    detalle_db.cantidadPasajeros = detalle_update.cantidadPasajeros
    
    actualizado = repo.update(detalle_db)
    return DomainDetalleRuta(
        id=actualizado.idDetalleRuta,
        idRuta=actualizado.idRuta,
        idTiempo=actualizado.idTiempo,
        cantidadPasajeros=actualizado.cantidadPasajeros
    )

def eliminar_detalle_ruta(db: Session, id_detalle: int) -> bool:
    repo = DetalleRutaRepository(db)
    detalle_db = repo.get_by_id(id_detalle)
    if not detalle_db:
        return False
    db.delete(detalle_db)
    db.commit()
    return True