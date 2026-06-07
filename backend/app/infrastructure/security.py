import os
import jwt
from jwt import PyJWKClient
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

# Caching the JWK client to avoid fetching keys on every request
_jwk_client = None

def get_jwk_client() -> PyJWKClient:
    global _jwk_client
    if _jwk_client is None:
        project_ref = os.getenv("SUPABASE_PROJECT_ID") or os.getenv("SUPABASE_REF")
        if not project_ref:
            db_user = os.getenv("DB_USER", "")
            if "." in db_user:
                project_ref = db_user.split(".")[1].strip()
        if not project_ref:
            project_ref = "qkuzjisimctotvxyrdsp" # Default fallback
            
        jwks_url = f"https://{project_ref}.supabase.co/auth/v1/.well-known/jwks.json"
        _jwk_client = PyJWKClient(jwks_url)
    return _jwk_client

def verify_jwt_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """
    Verifica el token JWT de las cabeceras de la petición.
    Soporta verificación real con Supabase JWKS (ES256/RS256) o JWT Secret (HS256) en producción,
    y decodificación sin firma en modo DEBUG/Desarrollo si no se provee el secreto o es incorrecto.
    """
    token = credentials.credentials
    
    # Intentamos obtener la clave de Supabase
    jwt_secret = os.getenv("SUPABASE_JWT_SECRET") or os.getenv("JWT_SECRET") or os.getenv("SECRET_KEY")
    
    try:
        header = jwt.get_unverified_header(token)
        alg = header.get("alg", "HS256")
        print(f"[DEBUG AUTH] JWT Header: {header}")
    except Exception as e:
        alg = "HS256"
        print(f"[DEBUG AUTH] Error al leer el header del JWT: {e}")
        
    # Si el algoritmo es asimétrico (ES256 o RS256), usamos el JWKS de Supabase
    if alg in ("ES256", "RS256"):
        try:
            jwk_client = get_jwk_client()
            signing_key = jwk_client.get_signing_key_from_jwt(token)
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=[alg],
                audience="authenticated"
            )
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="El token JWT ha expirado"
            )
        except jwt.InvalidAudienceError:
            # Reintento sin validar la audiencia para compatibilidad en desarrollo
            try:
                jwk_client = get_jwk_client()
                signing_key = jwk_client.get_signing_key_from_jwt(token)
                payload = jwt.decode(token, signing_key.key, algorithms=[alg])
                return payload
            except Exception:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Audiencia del token JWT no válida"
                )
        except Exception as e:
            if os.getenv("DEBUG", "False").lower() in ("true", "1", "yes"):
                try:
                    payload = jwt.decode(token, options={"verify_signature": False})
                    return payload
                except Exception:
                    pass
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Fallo en la verificación del token JWT ({alg}): {str(e)}"
            )
            
    # Si el algoritmo es simétrico (HS256)
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
