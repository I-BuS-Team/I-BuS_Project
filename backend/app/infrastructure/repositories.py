from sqlalchemy.orm import Session
from app.infrastructure.models import BarrioDB, TipoUsuarioDB, UsuarioDB, EmpresaDB, RutaDB, HorarioDB, TiempoDB, DetalleRutaDB, RutaBarrioDB

class TipoUsuarioRepository:
    def __init__(self, db: Session):
        self.db = db
        
    def get_all(self):
        return self.db.query(TipoUsuarioDB).all()

class UsuarioRepository:
    def __init__(self, db: Session):
        self.db = db
        
    def get_all(self):
        return self.db.query(UsuarioDB).all()

class EmpresaRepository:
    def __init__(self, db: Session):
        self.db = db
        
    def get_all(self):
        return self.db.query(EmpresaDB).all()

class BarrioRepository:
    def __init__(self, db: Session):
        self.db = db
        
    def get_all(self):
        return self.db.query(BarrioDB).order_by(BarrioDB.nombreBarrio.asc()).all()

class RutaRepository:
    def __init__(self, db: Session):
        self.db = db
        
    def get_all(self):
        return self.db.query(RutaDB).all()
        
    def get_by_id(self, id_ruta: int):
        return self.db.query(RutaDB).filter(RutaDB.idRuta == id_ruta).first()
        
    def create(self, ruta: RutaDB):
        self.db.add(ruta)
        self.db.commit()
        self.db.refresh(ruta)
        return ruta
        
    def update(self, ruta: RutaDB):
        self.db.commit()
        self.db.refresh(ruta)
        return ruta
class HorarioRepository:
    def __init__(self, db: Session):
        self.db = db
        
    def get_all(self):
        return self.db.query(HorarioDB).all()
        
    def get_by_id(self, id_horario: int):
        return self.db.query(HorarioDB).filter(HorarioDB.idHorario == id_horario).first()
        
    def create(self, horario: HorarioDB):
        self.db.add(horario)
        self.db.commit()
        self.db.refresh(horario)
        return horario
        
    def update(self, horario: HorarioDB):
        self.db.commit()
        self.db.refresh(horario)
        return horario
class TiempoRepository:
    def __init__(self, db: Session):
        self.db = db
        
    def get_all(self):
        return self.db.query(TiempoDB).all()
        
    def get_by_id(self, id_tiempo: int):
        return self.db.query(TiempoDB).filter(TiempoDB.idTiempo == id_tiempo).first()
        
    def create(self, tiempo: TiempoDB):
        self.db.add(tiempo)
        self.db.commit()
        self.db.refresh(tiempo)
        return tiempo
        
    def update(self, tiempo: TiempoDB):
        self.db.commit()
        self.db.refresh(tiempo)
        return tiempo

class DetalleRutaRepository:
    def __init__(self, db: Session):
        self.db = db
        
    def get_all(self):
        return self.db.query(DetalleRutaDB).all()

    def get_by_id(self, id_detalle: int):
        return self.db.query(DetalleRutaDB).filter(DetalleRutaDB.idDetalleRuta == id_detalle).first()
        
    def create(self, detalle: DetalleRutaDB):
        self.db.add(detalle)
        self.db.commit()
        self.db.refresh(detalle)
        return detalle
        
    def update(self, detalle: DetalleRutaDB):
        self.db.commit()
        self.db.refresh(detalle)
        return detalle

class RutaBarrioRepository:
    def __init__(self, db: Session):
        self.db = db
        
    def get_all(self):
        return self.db.query(RutaBarrioDB).all()