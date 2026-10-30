export const RELEASE_MARKDOWN = `## 1.1.0 (2026-10-30)

Ganancias, clientes y login

### Added

- Selector de moneda de pago (\`USD\`, \`COP\`, Zelle, \`USDT\`, \`CUP\`)
- Costo unitario CUP/USDT y tasa CUP→USD para el margen real
- Rangos de volumen (75 USD, 150 USD, 1 millón+)
- Etiquetas de estado y distintivo **VIP** en clientes
- Métricas del mes por cliente (envíos, enviado, ganancia)
- Historial por día, semana, mes y cliente
- Cifras ocultables y sorteo de cupones (1 por envío del mes)
- Notas de versión en el login

### Changed

- Nombre de la app: **HNL XPRESS**
- Olas redondas, más capas y fases distintas en móvil y desktop
- HNL, XPRESS y Acceso interno cambian de color píxel a píxel con la ola
- Calculadora de ganancias compacta; extras USDT detrás de un enlace
- Cliente se elige en sheet, no en una lista larga
- **Cerrar sesión** arriba a la derecha, en rojo
- Títulos y subtítulos sobre pastilla blanca

### Fixed

- El teclado ya no estira campos ni deja el sheet a medias
- Textos de olas no se quedan encima del sheet
- Indicador de arrastre del sheet (no era arrastrable)
- Al cerrar el teclado, el texto de marca vuelve a verse sin salto de página
`;
