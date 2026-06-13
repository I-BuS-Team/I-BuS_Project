# =============================================================
#  test/test_ibus.py
#  Suite de pruebas Selenium - I-BuS (Angular + FastAPI)
#
#  Estrategia:
#   - Inyectar sesion offline via localStorage antes de navegar
#   - El authGuard acepta modoOffline+userSimulado en localStorage
#   - Selectores basados en el HTML real de Angular
# =============================================================
import os
import sys
import time
import json
import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

# Forzar salida UTF-8 para evitar UnicodeEncodeError en Windows (cp1252)
sys.stdout.reconfigure(encoding="utf-8")

# ─────────────────────── CONFIG ───────────────────────────────
BASE_URL   = "http://localhost:4200"
DASHBOARD  = BASE_URL + "/usuario/buscar-rutas"
TIMEOUT    = 25
SHOTS_DIR  = "screenshots"

FAKE_USER = {
    "email": "dani@gmail.com",
    "user_metadata": {"nombre": "Dani", "idTipoUsuario": 2}
}

os.makedirs(SHOTS_DIR, exist_ok=True)

# ─────────────────────── FIXTURE ──────────────────────────────
@pytest.fixture(scope="function")
def driver():
    opts = webdriver.ChromeOptions()
    opts.add_argument("--start-maximized")
    opts.add_argument("--disable-gpu")
    opts.add_argument("--no-sandbox")
    opts.add_experimental_option("excludeSwitches", ["enable-automation"])
    opts.add_experimental_option("useAutomationExtension", False)
    svc = Service(ChromeDriverManager().install())
    d = webdriver.Chrome(service=svc, options=opts)
    yield d
    d.quit()

# ─────────────────────── HELPERS ──────────────────────────────
def inject_offline_session(driver):
    """
    Inyecta modoOffline + userSimulado en localStorage.
    El authGuard de Angular lee estos valores para autorizar acceso.
    """
    driver.get(BASE_URL)
    WebDriverWait(driver, TIMEOUT).until(
        lambda d: d.execute_script("return document.readyState") == "complete"
    )
    user_json = json.dumps(FAKE_USER).replace("'", "\\'")
    driver.execute_script(
        f"localStorage.setItem('modoOffline','true');"
        f"localStorage.setItem('userSimulado','{user_json}');"
    )

def open_dashboard(driver):
    """Inyecta sesion y navega al dashboard de busqueda de rutas."""
    inject_offline_session(driver)
    driver.get(DASHBOARD)
    # Esperar mapa Leaflet en el DOM (confirma que el dashboard cargo)
    WebDriverWait(driver, TIMEOUT).until(
        lambda d: d.execute_script(
            "return document.getElementById('map') !== null"
        )
    )
    time.sleep(1.5)  # esperar render completo de Angular

def shot(driver, name):
    path = f"{SHOTS_DIR}/{name}.png"
    driver.save_screenshot(path)
    print(f"  Screenshot: {path}")

def set_barrio_angular(driver, field, barrio_name):
    """
    Selecciona un barrio invocando directamente el metodo del componente
    Angular via ng.getComponent(). field: 'origen' o 'destino'
    """
    # Esperar a que el componente haya cargado la lista de barrios
    WebDriverWait(driver, TIMEOUT).until(lambda d: d.execute_script("""
        try {
            var el = document.querySelector('app-buscar-rutas');
            if (!el) return false;
            var c = window.ng.getComponent(el);
            return c && c.barrios && c.barrios.length > 0;
        } catch(e) { return false; }
    """))

    result = driver.execute_script("""
        var field = arguments[0];
        var name  = arguments[1];          // capturar ANTES del callback
        var hostEl = document.querySelector('app-buscar-rutas');
        if (!hostEl) return 'ERROR: app-buscar-rutas not found';
        var component;
        try { component = window.ng.getComponent(hostEl); }
        catch(e) { return 'ERROR: ng.getComponent: ' + e.message; }
        var barrio = component.barrios.find(function(b) { return b.nombre === name; });
        if (!barrio) {
            var names = component.barrios.map(function(b){ return b.nombre; }).join(', ');
            return 'ERROR: barrio [' + name + '] not found. Available: ' + names;
        }
        if (field === 'origen') {
            component.seleccionarOrigen(barrio, {stopPropagation: function(){}});
        } else {
            component.seleccionarDestino(barrio, {stopPropagation: function(){}});
        }
        try { window.ng.applyChanges(component); } catch(e) {}
        return 'OK';
    """, field, barrio_name)

    assert str(result) == "OK", \
        f"Error al seleccionar '{barrio_name}' en '{field}': {result}"
    time.sleep(0.6)



def wait_route_calculated(driver):
    """Espera a que el calculo de ruta termine (desaparece loader)."""
    WebDriverWait(driver, TIMEOUT).until(
        lambda d: len(d.find_elements(By.XPATH,
            "//*[contains(text(),'Calculando mejor ruta')]")) == 0
    )
    time.sleep(0.8)


# ═══════════════════════════════════════════════════════════════
#  PRUEBA 1 - SESION OFFLINE (prueba simple)
#  Verifica que el authGuard acepta la sesion inyectada y que
#  el usuario accede correctamente al dashboard con el mapa.
# ═══════════════════════════════════════════════════════════════
def test_sesion_offline_accede_dashboard(driver):
    """
    Inyecta la sesion offline en localStorage y navega a la
    ruta protegida. Verifica que el authGuard permite el acceso
    y que el mapa Leaflet carga correctamente.
    """
    open_dashboard(driver)

    # URL correcta
    assert "/usuario/buscar-rutas" in driver.current_url, \
        f"No redirigió al dashboard. URL: {driver.current_url}"

    # Mapa en el DOM
    mapa = driver.find_element(By.ID, "map")
    assert mapa is not None, "El contenedor del mapa (#map) no existe"

    # localStorage correcto
    modo = driver.execute_script("return localStorage.getItem('modoOffline');")
    user_raw = driver.execute_script("return localStorage.getItem('userSimulado');")
    assert modo == "true", f"modoOffline incorrecto: {modo}"
    assert user_raw is not None, "userSimulado no esta en localStorage"
    user_obj = json.loads(user_raw)
    assert user_obj.get("email") == FAKE_USER["email"], \
        f"Email incorrecto en userSimulado: {user_obj.get('email')}"

    shot(driver, "01_sesion_offline_dashboard")
    print(f"  PASS - Sesion offline valida. Email: {user_obj['email']}")


# ═══════════════════════════════════════════════════════════════
#  PRUEBA 2 - BUSQUEDA DE RUTA SIMPLE (prueba simple)
#  Selecciona origen != destino, espera resultado y
#  verifica marcadores O y D en el mapa Leaflet.
# ═══════════════════════════════════════════════════════════════
def test_busqueda_ruta_simple(driver):
    """
    Selecciona 'Centro' como origen y 'UPTC' como destino,
    espera a que la ruta se calcule y verifica que el mapa
    muestra los marcadores de origen (O) y destino (D).
    """
    open_dashboard(driver)

    # Seleccionar origen y destino via Angular component API
    set_barrio_angular(driver, "origen", "Centro")
    set_barrio_angular(driver, "destino", "UPTC")

    # Esperar que termine el calculo
    wait_route_calculated(driver)
    shot(driver, "02a_resultado_ruta")

    # Marcadores O y D: son L.divIcon → <div> con texto "O" y "D"
    # dentro de contenedores leaflet-marker-icon que contienen un div con el texto
    markers_o = WebDriverWait(driver, TIMEOUT).until(
        lambda d: d.find_elements(By.XPATH,
            "//div[contains(@class,'leaflet-marker-icon')]"
            "//div[normalize-space(text())='O']"
        )
    )
    markers_d = driver.find_elements(By.XPATH,
        "//div[contains(@class,'leaflet-marker-icon')]"
        "//div[normalize-space(text())='D']"
    )

    assert len(markers_o) > 0, "No aparecio marcador de Origen (O) en el mapa"
    assert len(markers_d) > 0, "No aparecio marcador de Destino (D) en el mapa"

    # Paradas intermedias: divIcon con número. Pueden no existir si la
    # ruta es directa (solo 2 waypoints). Solo verificamos si hay más de 2 paradas.
    intermedios = driver.find_elements(By.XPATH,
        "//div[contains(@class,'leaflet-marker-icon')]"
        "//div[string-length(normalize-space(text()))<=2 "
        "and translate(normalize-space(text()),'0123456789','')='']"
    )
    print(f"  Paradas intermedias encontradas: {len(intermedios)}")

    shot(driver, "02b_marcadores_mapa")
    print(f"  PASS - Ruta calculada. Marcadores O+D. Intermedias: {len(intermedios)}")


# ═══════════════════════════════════════════════════════════════
#  PRUEBA 3 - ORIGEN IGUAL DESTINO (prueba duplicada)
#  Selecciona el mismo barrio en ambos campos y verifica
#  que el sistema muestra mensaje de error.
# ═══════════════════════════════════════════════════════════════
def test_origen_igual_destino_muestra_error(driver):
    """
    Selecciona 'Centro' tanto como origen como destino.
    Verifica que el sistema muestra el mensaje de error:
    'El origen y el destino no pueden ser el mismo barrio.'
    """
    open_dashboard(driver)

    set_barrio_angular(driver, "origen", "Centro")
    set_barrio_angular(driver, "destino", "Centro")

    wait_route_calculated(driver)

    # Mensaje de error (desktop sidebar o mobile sheet)
    error = WebDriverWait(driver, TIMEOUT).until(
        EC.visibility_of_element_located((By.XPATH,
            "//*[contains(text(),'no pueden ser el mismo') or "
            "contains(text(),'mismo barrio') or "
            "contains(text(),'igual')]"
        ))
    )
    assert error.is_displayed(), "El mensaje de error no aparecio"

    # No debe haber marcadores O/D en el mapa
    markers = driver.find_elements(By.XPATH,
        "//img[contains(@class,'leaflet-marker-icon') "
        "and (@alt='O' or @alt='D')]")
    assert len(markers) == 0, \
        f"Aparecieron {len(markers)} marcadores a pesar del error"

    shot(driver, "03_error_origen_igual_destino")
    print(f"  PASS - Error correcto: \"{error.text.strip()[:80]}\"")


# ═══════════════════════════════════════════════════════════════
#  PRUEBA 4 - PANEL MOVIL (interaccion continua)
#  En viewport 375x812 calcula una ruta, cierra el panel
#  inferior y verifica que aparece el boton de reapertura.
# ═══════════════════════════════════════════════════════════════
def test_panel_movil_cerrar_y_reabrir(driver):
    """
    En viewport iPhone SE (375x812):
    1. Busca ruta Centro -> UPTC
    2. Verifica el panel inferior de resultados (slide-up sheet)
       - selector: div.absolute.bottom-0.left-0.w-full.bg-ibus-blue.md:hidden
    3. Cierra el panel con el indicador superior (div con cerrarDetalle())
    4. Verifica boton flotante de reapertura ([title='Ver Detalles de Ruta'])
    5. Clic en boton y confirma que el panel vuelve a aparecer
    """
    driver.set_window_size(375, 812)
    open_dashboard(driver)

    set_barrio_angular(driver, "origen", "Centro")
    set_barrio_angular(driver, "destino", "UPTC")
    wait_route_calculated(driver)

    # Panel slide-up mobile (absolute, bottom-0, bg-ibus-blue, md:hidden)
    # Cuando mostrarDetalleRuta=true se aplica translate-y-0, de lo contrario translate-y-full
    panel = WebDriverWait(driver, TIMEOUT).until(
        EC.visibility_of_element_located((By.XPATH,
            "//div[contains(@class,'bottom-0') and contains(@class,'left-0') "
            "and contains(@class,'bg-ibus-blue') and "
            "contains(@class,'rounded-t-')]"
        ))
    )
    assert panel.is_displayed(), "Panel de resultados no aparecio en mobile"
    shot(driver, "04a_panel_abierto_mobile")

    # Boton de cierre: div con (click)="cerrarDetalle()"
    # clase: "w-full flex justify-center py-3 cursor-pointer"
    close_btn = WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.XPATH,
            "//div[@class='w-full flex justify-center py-3 cursor-pointer']"
        ))
    )
    close_btn.click()
    time.sleep(1.0)  # esperar animacion de cierre
    shot(driver, "04b_panel_cerrado_mobile")

    # Boton flotante de reapertura: [title]="t('verDetallesRuta')"
    # En runtime el title es "Ver Detalles de Ruta"
    reopen = WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.XPATH,
            "//button[contains(@title,'Detalle') or contains(@title,'Ruta') "
            "or contains(@title,'Ver')]"
        ))
    )
    assert reopen.is_displayed(), "El boton de reapertura no aparecio"
    reopen.click()
    time.sleep(0.8)

    # Panel vuelve a ser visible (translate-y-0)
    panel2 = WebDriverWait(driver, 10).until(
        EC.visibility_of_element_located((By.XPATH,
            "//div[contains(@class,'bottom-0') and contains(@class,'left-0') "
            "and contains(@class,'bg-ibus-blue') and "
            "contains(@class,'rounded-t-')]"
        ))
    )
    assert panel2.is_displayed(), "El panel no se reabrio"
    shot(driver, "04c_panel_reabierto_mobile")
    print("  PASS - Panel movil: cerrado y reabierto correctamente")


# ═══════════════════════════════════════════════════════════════
#  PRUEBA 5 - SESION EXPIRADA (prueba caducada)
#  Elimina la sesion de localStorage y recarga la ruta
#  protegida. Verifica que el authGuard redirige al login.
# ═══════════════════════════════════════════════════════════════
def test_sesion_expirada_redirige_a_login(driver):
    """
    Simula la expiracion de sesion borrando los datos de
    localStorage y recargando la ruta protegida.
    El authGuard debe redirigir a /auth/login.
    """
    open_dashboard(driver)
    assert "/usuario/buscar-rutas" in driver.current_url, \
        f"No cargo el dashboard inicial. URL: {driver.current_url}"
    shot(driver, "05a_antes_expirar")

    # Simular expiracion: eliminar sesion
    driver.execute_script(
        "localStorage.removeItem('modoOffline');"
        "localStorage.removeItem('userSimulado');"
    )

    # Recargar ruta protegida -> authGuard debe redirigir al login
    driver.get(DASHBOARD)
    WebDriverWait(driver, TIMEOUT).until(
        lambda d: "/auth/login" in (d.current_url or "")
    )

    assert "/auth/login" in driver.current_url, \
        f"No redirigió a /auth/login. URL: {driver.current_url}"

    # Formulario de login visible
    login_email = WebDriverWait(driver, TIMEOUT).until(
        EC.visibility_of_element_located(
            (By.CSS_SELECTOR, "input[formControlName='email']")
        )
    )
    assert login_email.is_displayed(), "Formulario de login no visible"

    shot(driver, "05b_redirigido_al_login")
    print(f"  PASS - Sesion expirada -> redirigido a: {driver.current_url}")
