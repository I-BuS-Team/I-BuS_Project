from sqlalchemy.orm import Session
from app.infrastructure.repositories import (
    BarrioRepository, EmpresaRepository, RutaRepository, HorarioRepository, 
    TiempoRepository, DetalleRutaRepository, RutaBarrioRepository, UsuarioRepository
)
from app.domain.models import (
    Barrio as DomainBarrio, Empresa as DomainEmpresa, Ruta as DomainRuta, 
    Horario as DomainHorario, Tiempo as DomainTiempo, DetalleRuta as DomainDetalleRuta,
    Usuario as DomainUsuario
)
from app.infrastructure.models import BarrioDB, EmpresaDB, RutaDB, HorarioDB, TiempoDB, DetalleRutaDB, RutaBarrioDB, UsuarioDB


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

# --- CASOS DE USO DE BARRIOS ---
def crear_barrio(db: Session, barrio_in: DomainBarrio):
    repo = BarrioRepository(db)
    nuevo_barrio = BarrioDB(
        nombreBarrio=barrio_in.nombre
    )
    creado = repo.create(nuevo_barrio)
    return DomainBarrio(id=creado.idBarrio, nombre=creado.nombreBarrio)

def actualizar_barrio(db: Session, id_barrio: int, barrio_update: DomainBarrio):
    repo = BarrioRepository(db)
    barrio_db = repo.get_by_id(id_barrio)
    if not barrio_db:
        return None
    barrio_db.nombreBarrio = barrio_update.nombre
    actualizado = repo.update(barrio_db)
    return DomainBarrio(id=actualizado.idBarrio, nombre=actualizado.nombreBarrio)

def eliminar_barrio(db: Session, id_barrio: int) -> bool:
    repo = BarrioRepository(db)
    barrio_db = repo.get_by_id(id_barrio)
    if not barrio_db:
        return False
        
    # Verificar si el barrio está en uso como inicio o destino de alguna ruta
    rutas_con_barrio = db.query(RutaDB).filter(
        (RutaDB.inicioRuta_id == id_barrio) | (RutaDB.destinoRuta_id == id_barrio)
    ).first()
    
    if rutas_con_barrio:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=400,
            detail="No se puede eliminar el barrio porque está asignado como origen o destino de una ruta activa."
        )
        
    # Eliminar relaciones en RutaBarrio (puntos intermedios)
    db.query(RutaBarrioDB).filter(RutaBarrioDB.idBarrio == id_barrio).delete()
    
    db.delete(barrio_db)
    db.commit()
    return True

# --- CASOS DE USO DE EMPRESAS ---
def crear_empresa(db: Session, empresa_in: DomainEmpresa):
    repo = EmpresaRepository(db)
    nueva_empresa = EmpresaDB(
        nombreEmpresa=empresa_in.nombreEmpresa,
        anioFundacion=empresa_in.anioFundacion,
        direccion=empresa_in.direccion,
        telefono=empresa_in.telefono,
        cantBuses=empresa_in.cantBuses,
        cantConductores=empresa_in.cantConductores
    )
    creada = repo.create(nueva_empresa)
    return DomainEmpresa(
        id=creada.idEmpresa,
        nombreEmpresa=creada.nombreEmpresa,
        anioFundacion=creada.anioFundacion,
        direccion=creada.direccion,
        telefono=creada.telefono,
        cantBuses=creada.cantBuses,
        cantConductores=creada.cantConductores
    )

def actualizar_empresa(db: Session, id_empresa: int, empresa_update: DomainEmpresa):
    repo = EmpresaRepository(db)
    empresa_db = repo.get_by_id(id_empresa)
    if not empresa_db:
        return None
        
    empresa_db.nombreEmpresa = empresa_update.nombreEmpresa
    empresa_db.anioFundacion = empresa_update.anioFundacion
    empresa_db.direccion = empresa_update.direccion
    empresa_db.telefono = empresa_update.telefono
    empresa_db.cantBuses = empresa_update.cantBuses
    empresa_db.cantConductores = empresa_update.cantConductores
    
    actualizada = repo.update(empresa_db)
    return DomainEmpresa(
        id=actualizada.idEmpresa,
        nombreEmpresa=actualizada.nombreEmpresa,
        anioFundacion=actualizada.anioFundacion,
        direccion=actualizada.direccion,
        telefono=actualizada.telefono,
        cantBuses=actualizada.cantBuses,
        cantConductores=actualizada.cantConductores
    )

def eliminar_empresa(db: Session, id_empresa: int) -> bool:
    repo = EmpresaRepository(db)
    empresa_db = repo.get_by_id(id_empresa)
    if not empresa_db:
        return False
        
    # Verificar si la empresa tiene rutas asociadas
    rutas_con_empresa = db.query(RutaDB).filter(RutaDB.idEmpresa == id_empresa).first()
    if rutas_con_empresa:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=400,
            detail="No se puede eliminar la empresa porque tiene rutas asignadas."
        )
        
    # Verificar si la empresa tiene horarios asociados
    horarios_con_empresa = db.query(HorarioDB).filter(HorarioDB.idEmpresa == id_empresa).first()
    if horarios_con_empresa:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=400,
            detail="No se puede eliminar la empresa porque tiene horarios registrados."
        )
        
    db.delete(empresa_db)
    db.commit()
    return True

def obtener_estadisticas(db: Session):
    total_rutas = db.query(RutaDB).count()
    total_barrios = db.query(BarrioDB).count()
    total_empresas = db.query(EmpresaDB).count()
    total_usuarios = db.query(UsuarioDB).count()
    
    # Calcular uso de rutas por día de la semana
    detalles = db.query(DetalleRutaDB, TiempoDB).join(TiempoDB, DetalleRutaDB.idTiempo == TiempoDB.idTiempo).all()
    consultas_por_dia = {0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0} # 0=Lun, ..., 6=Dom
    for detalle, tiempo in detalles:
        if tiempo.fecha:
            dia_semana = tiempo.fecha.weekday()
            consultas_por_dia[dia_semana] += (detalle.cantidadPasajeros or 0)
            
    uso_por_dia = [
        {"dia": "Lun", "valor": consultas_por_dia[0]},
        {"dia": "Mar", "valor": consultas_por_dia[1]},
        {"dia": "Mié", "valor": consultas_por_dia[2]},
        {"dia": "Jue", "valor": consultas_por_dia[3]},
        {"dia": "Vie", "valor": consultas_por_dia[4]},
        {"dia": "Sáb", "valor": consultas_por_dia[5]},
        {"dia": "Dom", "valor": consultas_por_dia[6]}
    ]
    
    # Calcular cobertura/eficiencia de rutas
    rutas = db.query(RutaDB).all()
    cobertura_rutas = []
    for r in rutas:
        # Sumar pasajeros de esta ruta en Python
        detalles_ruta = db.query(DetalleRutaDB).filter(DetalleRutaDB.idRuta == r.idRuta).all()
        total_pasajeros = sum(d.cantidadPasajeros or 0 for d in detalles_ruta)
        
        # Buscar origen y destino
        inicio = db.query(BarrioDB).filter(BarrioDB.idBarrio == r.inicioRuta_id).first()
        destino = db.query(BarrioDB).filter(BarrioDB.idBarrio == r.destinoRuta_id).first()
        nombre_ruta = f"Ruta {r.idRuta} ({inicio.nombreBarrio if inicio else 'Origen'} - {destino.nombreBarrio if destino else 'Destino'})"
        
        # Calcular porcentaje
        porcentaje = min(int(total_pasajeros / 10), 100) if total_pasajeros > 0 else 0
        if porcentaje == 0:
            # Si es 0, dar un porcentaje según el número de barrios en su recorrido
            num_paradas = db.query(RutaBarrioDB).filter(RutaBarrioDB.idRuta == r.idRuta).count()
            porcentaje = min(num_paradas * 15, 100)
            
        cobertura_rutas.append({
            "nombre": nombre_ruta,
            "porcentaje": porcentaje
        })
        
    # Ordenar y limitar a las mejores 5
    cobertura_rutas.sort(key=lambda x: x["porcentaje"], reverse=True)
    cobertura_rutas = cobertura_rutas[:5]
    
    return {
        "totalRutas": total_rutas,
        "totalBarrios": total_barrios,
        "totalEmpresas": total_empresas,
        "usuariosActivos": total_usuarios,
        "usoPorDia": uso_por_dia,
        "coberturaRutas": cobertura_rutas
    }

# --- CASOS DE USO DE USUARIOS ---
def listar_usuarios(db: Session):
    repo = UsuarioRepository(db)
    usuarios_db = repo.get_all()
    return [
        DomainUsuario(
            id=u.idUsuario,
            idTipoUsuario=u.idTipoUsuario,
            email=u.email,
            contrasena=u.contrasena
        )
        for u in usuarios_db
    ]

def crear_usuario(db: Session, usuario_in: DomainUsuario):
    repo = UsuarioRepository(db)
    existente = repo.get_by_email(usuario_in.email)
    if existente:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=400,
            detail="El correo electrónico ya se encuentra registrado."
        )
    
    nuevo_usuario = UsuarioDB(
        idTipoUsuario=usuario_in.idTipoUsuario,
        email=usuario_in.email,
        contrasena=usuario_in.contrasena
    )
    creado = repo.create(nuevo_usuario)
    return DomainUsuario(
        id=creado.idUsuario,
        idTipoUsuario=creado.idTipoUsuario,
        email=creado.email,
        contrasena=creado.contrasena
    )

def actualizar_usuario(db: Session, id_usuario: int, usuario_update: DomainUsuario):
    repo = UsuarioRepository(db)
    usuario_db = repo.get_by_id(id_usuario)
    if not usuario_db:
        return None
        
    if usuario_db.email != usuario_update.email:
        existente = repo.get_by_email(usuario_update.email)
        if existente:
            from fastapi import HTTPException
            raise HTTPException(
                status_code=400,
                detail="El correo electrónico ya está en uso por otro usuario."
            )
            
    usuario_db.idTipoUsuario = usuario_update.idTipoUsuario
    usuario_db.email = usuario_update.email
    if usuario_update.contrasena:
        usuario_db.contrasena = usuario_update.contrasena
        
    actualizado = repo.update(usuario_db)
    return DomainUsuario(
        id=actualizado.idUsuario,
        idTipoUsuario=actualizado.idTipoUsuario,
        email=actualizado.email,
        contrasena=actualizado.contrasena
    )

def eliminar_usuario(db: Session, id_usuario: int) -> bool:
    repo = UsuarioRepository(db)
    usuario_db = repo.get_by_id(id_usuario)
    if not usuario_db:
        return False
    db.delete(usuario_db)
    db.commit()
    return True