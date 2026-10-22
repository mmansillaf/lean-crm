# Base de Conocimiento: Ecosistema Digital Algoritmo Jurídico

Documento consolidado de funcionalidades, productos, herramientas tecnológicas y servicios de los portales de **Algoritmo Jurídico SAC** para ingestión en el motor RAG del CRM.

---

## 1. Portal Corporativo y Buscador de Normas
* **URL:** `https://algoritmojuridico.com/buscador`
* **Entidad:** Algoritmo Jurídico SAC (Lima, Perú) — Contacto: `ventas@algoritmojuridico.com`

### 1.1. Buscador de Normas y Jurisprudencia
* **Cobertura:** Normas legales del Diario Oficial El Peruano y resoluciones jurisprudenciales.
* **Pestañas:**
  * `Normas Legales`: Consulta indexada de leyes, decretos legislativos, decretos supremos y resoluciones ministeriales.
  * `Jurisprudencia`: Sentencias casatorias y criterios judiciales vinculantes.
* **Integración IA:** Búsqueda semántica directa y análisis de documentos normativos en tiempo real.

### 1.2. Servicios Corporativos de Consultoría e IA
1. **Asesoría Tecnológica Corporativa en IA:**
   * Diagnóstico sectorial para adopción de Inteligencia Artificial.
   * Hoja de ruta técnica con retorno de inversión (ROI) medible.
   * Framework de gobernanza, ética y seguridad de datos corporativos.
2. **Desarrollo de Aplicaciones con IA:**
   * Modelos de machine learning embebidos a medida.
   * Sistemas de recomendación y dashboards predictivos.
   * Asistentes conversacionales especializados para clientes y colaboradores.
3. **Automatización de Procesos con IA:**
   * Reducción de hasta el 80% de carga operativa manual.
   * Procesamiento y extracción inteligente de documentos legales y contractuales.
   * Workflows automatizados de comunicación y reportes ejecutivos.
4. **Analizador de Contratos IA:**
   * Auditoría automatizada de contratos en segundos.
   * Detección de cláusulas abusivas, omisiones legales, contingencias y riesgos.
5. **Generador de Documentos Legales:**
   * Creación automatizada de minutas, contratos comerciales, estatutos y poderes bajo legislación peruana.
6. **Asistente Legal Virtual 24/7:**
   * Chatbot interactivo entrenado en normativa y doctrina jurídica peruana para triaje y resolución de consultas recurrentes.

### 1.3. Tienda de Recursos y Suscripciones Especializadas
* **Catálogo:** Libros y manuales técnicos en derecho tributario, laboral y administrativo (moneda: Soles S/ PEN).
* **Pasarela:** Pasarela de pago integrada (Krypton/Niubiz).
* **Suscripciones Normativas:**
  * Alertas normativas inmediatas vía correo y mensajería ante publicaciones en El Peruano.
  * Análisis de impacto legal y guías prácticas de cumplimiento normativo (compliance).

---

## 2. Plataforma IA Legal (Asistente Jurídico Inteligente)
* **URL:** `https://servicios.algoritmojuridico.com/ialegal/`
* **Liderazgo Técnico:** Algoritmo Jurídico SAC — Marco Mendoza (`mmi.mendoza@gmail.com`)

### 2.1. Arquitectura de Inteligencia Artificial
* **RAG Híbrido:** Combinación de búsqueda vectorial densa con Grafo de Conocimiento en Neo4j (**GraphRAG**).
* **Base Documental Indexada:** Libros doctrinales fundamentales, leyes sistematizadas y resoluciones con más de 610 chunks y 323 nodos de relaciones ontológicas.
* **Web Grounding:** Verificación en tiempo real contra fuentes web jurídicas oficiales para prevenir alucinaciones.
* **Emisión de Dictámenes Ejecutivos:** Generación y descarga automatizada de dictámenes legales en formato PDF con ID único de trazabilidad y firma digital institucional.

### 2.2. Especialidades Jurídicas Cubiertas
1. **Derecho Tributario:**
   * Ley del Impuesto a la Renta (LIR): Causalidad de gastos (Art. 37 LIR), principio del devengo en servicios continuados (Art. 57 LIR), depreciación bajo NIIF 16.
   * Impuesto General a las Ventas (IGV): Crédito fiscal, bancarización, detracciones y retenciones.
   * Código Tributario: Procedimientos contenciosos, fiscalizaciones SUNAT, jurisprudencia del Tribunal Fiscal (RTF de observancia obligatoria).
2. **Derecho Laboral:**
   * Regímenes de contratación, convenios y contratos sujetos a modalidad.
   * Compensación por Tiempo de Servicios (CTS), gratificaciones, vacaciones truncas.
   * Jornada máxima y tratamiento de horas extra en trabajadores no fiscalizados.
   * Procedimientos sancionadores e inspecciones ante SUNAFIL.
3. **Derecho Civil:**
   * Código Civil peruano y derechos reales.
   * Criterios vinculantes del IV Pleno Casatorio Civil sobre posesión precaria.
   * Responsabilidad civil contractual y extracontractual (Artículos 1969 y 1970 del Código Civil).
4. **Derecho Constitucional:**
   * Garantías constitucionales, debido proceso sustantivo y procesal, tutela jurisdiccional efectiva.
   * Control difuso y control concentrado por jueces y magistrados.
5. **Derecho Penal:**
   * Tipificación penal, teoría del delito, acuerdos plenarios de la Corte Suprema y jurisprudencia penal.

---

## 3. Buscador de Procesos Constitucionales del Perú (2016–2026)
* **URL:** `https://procesosconstitucionales.algoritmojuridico.com/`
* **Enfoque:** Análisis y búsqueda de sentencias del Tribunal Constitucional del Perú.

### 3.1. Cobertura del Repositorio
* **Período Histórico:** 11 años de jurisprudencia constitucional (2016 a 2026).
* **Fuente Oficial:** Publicaciones de sentencias en el Diario Oficial El Peruano.
* **Tipología de Procesos:**
  * Hábeas Corpus
  * Acción de Amparo
  * Hábeas Data
  * Acción de Cumplimiento
  * Acción de Inconstitucionalidad
  * Proceso Competencial

### 3.2. Capacidades de Consulta y Filtros de Precisión
* **Operadores Booleanos:** Soporte de `"frase exacta"`, operadores lógicos `OR`, `NOT`.
* **Filtros por Metadatos:**
  * `numero:` Número de expediente constitucional.
  * `tipo:` Tipo de proceso constitucional.
  * `distrito:` Distrito judicial de procedencia.
  * `año:` Año de emisión (2016–2026).
  * `fallo:` Sentido de la sentencia (Fundada, Infundada, Improcedente, Nula).
  * `derecho:` Derecho constitucional tutelado o vulnerado.
  * `ponente:` Magistrado ponente del Tribunal Constitucional.
  * `demandado:` Entidad pública, persona jurídica o institución demandada.
  * `materia:` Especialidad material del litigio.
  * `ley:` / `ds:` / `art:` Normas citadas en el fundamento.
  * `vinculante:` Precedentes vinculantes y doctrina jurisprudencial.
  * `voto:` Votos singulares y discordantes.
* **Modo IA:** Consulta asistida mediante lenguaje natural para identificar sentencias análogas y precedentes aplicables.
* **Analítica y Exportación:**
  * Ranking de términos frecuentes, leyes más citadas y entidades más demandadas.
  * Exportación masiva de resultados de búsqueda en formatos estructurados **CSV** y **JSON**.
  * Auditoría y registro de actividad persistente de consultas y accesos.
