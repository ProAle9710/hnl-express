export const RELEASE_MARKDOWN = `## 1.2.1 (2026-10-30)

Panel: barras HIG

### Added

- Gráficos de barras en **Hoy** (método, hora, tipo, etiqueta, volumen, clientes)
- Animación en vivo mientras no hay datos; al llegar un valor, solo quedan esas barras

### Changed

- Barras planas tipo iOS (píldora 22pt, track gris), paleta amarillo / azul / rojo / navy
- Sin barras 3D: no encajaban con el resto de la app

## 1.2.0 (2026-10-30)

Panel en vivo y fórmula de ganancia

### Added

- Panel **Hoy** al entrar: atendidos, clientes nuevos y ganancia del día
- Barras por método de pago; al tocar una se ve el monto
- El panel se actualiza solo mientras está abierto
- Varias operaciones en un mismo cálculo
- Tasas 8 %, 6 % o personalizada, guardadas sin alterar la fórmula

### Changed

- Ganancia: \`(monto COP / valor COP) − (pago al cliente / costo real)\`
- Redondeo a décimas: \`.26\` o más sube, \`.25\` o menos baja
- Montos con miles: \`1,000.00\`
- Métodos: Zelle (Selly), USD efectivo, USD tarjeta, COP transferencia
- Cada línea se guarda con las claves \`montoCliente\`, \`valorCop\`, \`pagoCliente\`, \`costoReal\`
- El personal puede leer Firestore; las escrituras siguen en el servidor

## 1.1.0 (2026-10-30)

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
