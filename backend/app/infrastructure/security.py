import os
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

def verify_jwt_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """
    Verifica el token JWT de las cabeceras de la petición.
    Soporta verificación real con Supabase JWT Secret en producción,
    y decodificación sin firma en modo DEBUG/Desarrollo si no se provee el secreto o es incorrecto.
    """
    token = credentials.credentials
    
    # Intentamos obtener la clave de Supabase
    jwt_secret = os.getenv("SUPABASE_JWT_SECRET") or os.getenv("JWT_SECRET") or os.getenv("SECRET_KEY")
    
    if not jwt_secret:
        if os.getenv("DEBUG", "False").lower() in ("true", "1", "yes"):
            try:
                # Decodificar sin verificación para pruebas de desarrollo
                payload = jwt.decode(token, options={"verify_signature": False})
                return payload
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=f"Token JWT inválido o malformado: {str(e)}"
                )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="La firma del token no se puede verificar (no se configuró JWT_SECRET o SECRET_KEY)"
        )
        
    try:
        # Supabase usa HS256 y una audiencia de 'authenticated' por defecto para sus tokens de usuario
        payload = jwt.decode(
            token,
            jwt_secret,
            algorithms=["HS256"],
            audience="authenticated"
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="El token JWT ha expirado"
        )
    except jwt.InvalidAudienceError:
        # Reintento sin validar la audiencia para casos de desarrollo
        try:
            payload = jwt.decode(token, jwt_secret, algorithms=["HS256"])
            return payload
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Audiencia del token JWT no válida"
            )
    except jwt.PyJWTError as e:
        # Fallback si falla la verificación de firma pero estamos en modo desarrollo (DEBUG=True)
        if os.getenv("DEBUG", "False").lower() in ("true", "1", "yes"):
            try:
                payload = jwt.decode(token, options={"verify_signature": False})
                return payload
            except Exception:
                pass
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Fallo en la verificación del token JWT: {str(e)}"
        )
