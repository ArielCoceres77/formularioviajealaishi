/**
 * Viaje a Laishí · 5 de noviembre de 2026
 * Servidor del formulario: guarda las inscripciones en esta planilla
 * y los seguros en una carpeta de Google Drive.
 * Las contraseñas y el código de borrado quedan acá, no en la página.
 */
const CLAVES = { "Director": "Macario01", "Secretaría": "Macario02" };
const CODIGO_RESET = "CAC77";
const CUPO = 44;

function hoja_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName("Inscriptos");
  if (!sh) {
    sh = ss.insertSheet("Inscriptos");
    sh.appendRow(["Código", "Fecha", "Tecnicatura o trayecto", "Apellido y nombre", "DNI", "Archivo del seguro", "Enlace al seguro", "ID archivo", "Tipo de archivo"]);
    sh.getRange("E:E").setNumberFormat("@");
    sh.setFrozenRows(1);
  }
  return sh;
}

function carpeta_() {
  const p = PropertiesService.getScriptProperties();
  const id = p.getProperty("CARPETA");
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  const f = DriveApp.createFolder("Seguros · Viaje a Laishí 2026");
  p.setProperty("CARPETA", f.getId());
  return f;
}

function salida_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function esAdmin_(b) {
  const c = CLAVES[b.rol];
  return !!c && String(b.clave || "").trim().toLowerCase() === c.toLowerCase();
}

function doGet(e) { return salida_({ ok: true, usados: usados_(), cupo: CUPO }); }

function doPost(e) {
  let b = {};
  try { b = JSON.parse(e.postData.contents); } catch (err) {}
  try {
    switch (b.accion) {
      case "cupo": return salida_({ ok: true, usados: usados_(), cupo: CUPO });
      case "inscribir": return salida_(inscribir_(b));
      case "login": return salida_({ ok: esAdmin_(b) });
      case "lista":
        if (!esAdmin_(b)) return salida_({ ok: false, error: "clave" });
        return salida_({ ok: true, registros: lista_() });
      case "archivo":
        if (!esAdmin_(b)) return salida_({ ok: false, error: "clave" });
        const f = DriveApp.getFileById(b.id);
        return salida_({ ok: true, data: "data:" + f.getMimeType() + ";base64," + Utilities.base64Encode(f.getBlob().getBytes()) });
      case "reset":
        if (!esAdmin_(b)) return salida_({ ok: false, error: "clave" });
        if (String(b.codigo || "").trim().toUpperCase() !== CODIGO_RESET) return salida_({ ok: false, error: "codigo" });
        return salida_({ ok: true, borrados: reset_() });
    }
    return salida_({ ok: false, error: "accion" });
  } catch (err) {
    return salida_({ ok: false, error: String(err) });
  }
}

function usados_() { return Math.max(0, hoja_().getLastRow() - 1); }

function inscribir_(b) {
  const lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try {
    const tipo = String(b.tipo || "").trim(), nombre = String(b.nombre || "").trim();
    const dni = String(b.dni || "").replace(/\D/g, "");
    if (tipo.length < 3 || nombre.length < 3 || dni.length < 7 || dni.length > 8) return { ok: false, error: "datos" };
    const m = String(b.archivo || "").match(/^data:([^;,]+)?;base64,(.+)$/);
    if (!m) return { ok: false, error: "seguro" };

    const sh = hoja_();
    const datos = sh.getDataRange().getValues();
    let fila = -1;
    for (let i = 1; i < datos.length; i++) if (String(datos[i][4]) === dni) { fila = i + 1; break; }
    if (fila < 0 && datos.length - 1 >= CUPO) return { ok: false, error: "lleno" };

    const mime = m[1] || "application/octet-stream";
    const blob = Utilities.newBlob(Utilities.base64Decode(m[2]), mime, "Seguro_" + dni + "_" + String(b.archivoNombre || "archivo"));
    const file = carpeta_().createFile(blob);
    const codigo = "VJ-" + dni.slice(-6);
    const fecha = new Date();
    const fila_ = [codigo, fecha, tipo, nombre, dni, String(b.archivoNombre || ""), file.getUrl(), file.getId(), mime];

    if (fila > 0) {
      const viejo = String(datos[fila - 1][7] || "");
      if (viejo) { try { DriveApp.getFileById(viejo).setTrashed(true); } catch (e) {} }
      fila_[1] = datos[fila - 1][1] || fecha;
      sh.getRange(fila, 1, 1, fila_.length).setValues([fila_]);
    } else {
      sh.appendRow(fila_);
    }
    return { ok: true, codigo: codigo, usados: usados_() };
  } finally {
    lock.releaseLock();
  }
}

function lista_() {
  const v = hoja_().getDataRange().getValues();
  const out = [];
  for (let i = 1; i < v.length; i++) {
    const r = v[i];
    if (!r[4]) continue;
    out.push({
      codigo: String(r[0]), fecha: r[1] instanceof Date ? r[1].toISOString() : String(r[1]),
      tipo: String(r[2]), nombre: String(r[3]), dni: String(r[4]),
      archivoNombre: String(r[5]), archivoId: String(r[7]), archivoTipo: String(r[8])
    });
  }
  return out;
}

function reset_() {
  const lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try {
    const sh = hoja_();
    const v = sh.getDataRange().getValues();
    for (let i = 1; i < v.length; i++) {
      const id = String(v[i][7] || "");
      if (id) { try { DriveApp.getFileById(id).setTrashed(true); } catch (e) {} }
    }
    const n = v.length - 1;
    if (n > 0) sh.deleteRows(2, n);
    return n;
  } finally {
    lock.releaseLock();
  }
}
