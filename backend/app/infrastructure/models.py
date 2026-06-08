from sqlalchemy import Column, Integer, String, ForeignKey, Time, Date, Float
from app.infrastructure.database import Base

class TipoUsuarioDB(Base):
    __tablename__ = 'TipoUsuario'
    idTipoUsuario = Column(Integer, primary_key=True, index=True)
    nombreTipo = Column(String(50))

class UsuarioDB(Base):
    __tablename__ = 'Usuario'
    idUsuario = Column(Integer, primary_key=True, index=True)
    idTipoUsuario = Column('idTipoUsuario_id', Integer, ForeignKey('TipoUsuario.idTipoUsuario'))
    email = Column(String(100), unique=True)
    contrasena = Column(String(100))

class EmpresaDB(Base):
    __tablename__ = 'Empresa'
    idEmpresa = Column(Integer, primary_key=True, index=True)
    nombreEmpresa = Column(String(100))
    anioFundacion = Column(Integer)
    direccion = Column(String(150))
    telefono = Column(String(20))
    cantBuses = Column(Integer)
    cantConductores = Column(Integer)

class BarrioDB(Base):
    __tablename__ = 'Barrio'
    idBarrio = Column(Integer, primary_key=True, index=True)
    nombreBarrio = Column(String(100))
    latitud = Column(Float, nullable=True)
    longitud = Column(Float, nullable=True)

class RutaDB(Base):
    __tablename__ = 'Ruta'
    idRuta = Column(Integer, primary_key=True, index=True)
    idEmpresa = Column('idEmpresa_id', Integer, ForeignKey('Empresa.idEmpresa'))
    inicioRuta_id = Column('inicioRuta_id', Integer, ForeignKey('Barrio.idBarrio'))
    destinoRuta_id = Column('destinoRuta_id', Integer, ForeignKey('Barrio.idBarrio'))
    frecuencia = Column(String(50))

class HorarioDB(Base):
    __tablename__ = 'Horario'
    idHorario = Column(Integer, primary_key=True, index=True)
    idRuta = Column('idRuta_id', Integer, ForeignKey('Ruta.idRuta'))
    horaSalida = Column(Time)
    horaLlegada = Column(Time)

class TiempoDB(Base):
    __tablename__ = 'Tiempo'
    idTiempo = Column(Integer, primary_key=True, index=True)
    fecha = Column(Date)

class DetalleRutaDB(Base):
    __tablename__ = 'DetalleRuta'
    idDetalleRuta = Column(Integer, primary_key=True, index=True)
    idRuta = Column('idRuta_id', Integer, ForeignKey('Ruta.idRuta'))
    idTiempo = Column('idTiempo_id', Integer, ForeignKey('Tiempo.idTiempo'))
    cantidadPasajeros = Column(Integer)

class RutaBarrioDB(Base):
    __tablename__ = 'RutaBarrio'
    idRutaBarrio = Column(Integer, primary_key=True, index=True)
    idRuta = Column('idRuta_id', Integer, ForeignKey('Ruta.idRuta'))
    idBarrio = Column('idBarrio_id', Integer, ForeignKey('Barrio.idBarrio'))
    orden = Column(Integer, nullable=False, default=1)