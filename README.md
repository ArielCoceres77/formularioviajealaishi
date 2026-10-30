# Viaje a Laishí · 5 de noviembre de 2026

Formulario de inscripción al viaje educativo del ISFD y T «República Federal de Alemania», El Colorado, Formosa.

- **Inscripción:** tecnicatura o trayecto, apellido y nombre, DNI y seguro de viaje obligatorio (foto, PDF o cualquier archivo). Cupo de 44. No hace falta cuenta ni enlace especial.
- **Administración:** Director y Secretaría ven a todos los inscriptos y descargan PDF individual, PDF completo o planilla Excel. Botón Restablecer con código.
- **Datos:** se guardan en una planilla de Google Sheets y los seguros en una carpeta de Google Drive (archivo `Codigo.gs`).

## Conectar la planilla (una sola vez)

1. Crear una planilla nueva en Google Sheets.
2. Menú **Extensiones → Apps Script**. Borrar lo que haya y pegar el contenido de `Codigo.gs`. Guardar.
3. **Implementar → Nueva implementación → Tipo: App web**.
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier persona**
4. Autorizar los permisos y copiar la **URL de la app web**.
5. En `index.html`, poner esa URL en la constante `API`.

DIA · Didáctica con IA
