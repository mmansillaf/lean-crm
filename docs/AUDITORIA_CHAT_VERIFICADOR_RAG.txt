# Auditoría de Pruebas Humanas: Chat Verificador RAG (Sandbox)
Fecha de Ejecución: 2026-10-24T02:20:11.697Z
Entorno: Localhost Next.js API / PostgreSQL pgvector / Groq LLaMA 3.3 70B
Tasa de Aprobación: 6 / 6 (100.0%)

---

## 1. Resumen Ejecutivo de la Auditoría

| # | Persona & Perfil | Categoría Evaluada | Modo | Nodos RAG | Latencia | Estado |
|---|------------------|-------------------|------|-----------|----------|--------|
| 1 | Dra. Jimena Flores (Constitucionalista) | Derecho Constitucional & TC | `agent` | 4 nodos | 1106ms | ✅ APROBADO |
| 2 | Dr. Walter Palacios (Abogado Tributarista) | Derecho Tributario & SUNAT | `agent` | 4 nodos | 1076ms | ✅ APROBADO |
| 3 | Dra. Claudia Ramos (Socia de Estudio - Compra) | Intención de Compra & Checkout | `agent` | 4 nodos | 1186ms | ✅ APROBADO |
| 4 | Dr. Ricardo Valdivia (Gerente Legal Corporativo) | Corporativo & Multi-cuenta (>3 usuarios) | `agent` | 3 nodos | 762ms | ✅ APROBADO |
| 5 | Dr. Sergio Benavides (Auditoría Técnica) | Inspección Pura de Grafo (Modo Búsqueda) | `search` | 4 nodos | 37ms | ✅ APROBADO |
| 6 | Dra. Sofía Alarcón (Laboralista) | Derecho Laboral & SUNAFIL | `agent` | 4 nodos | 864ms | ✅ APROBADO |

---

## 2. Detalle Exhaustivo de Pruebas: Preguntas, Respuestas y Nodos

### Caso de Prueba #1: Derecho Constitucional & TC

* **Usuario Simulado:** Dra. Jimena Flores (Constitucionalista)
* **Modo:** `agent`
* **Latencia de Respuesta:** 1106ms
* **Pregunta Enviada:**
> "Buenas noches, necesito saber qué cobertura tienen sobre procesos de amparo y sentencias del Tribunal Constitucional."

* **Respuesta Generada por el Asistente:**
```text
Buenas noches. Contamos con el **Buscador de Procesos Constitucionales del Perú**, una herramienta especializada que indexa y permite analizar sentencias del Tribunal Constitucional emitidas entre los años **2016 y 2026**. Esta plataforma está diseñada específicamente para facilitar la búsqueda y el estudio de la jurisprudencia constitucional, incluyendo procesos de amparo.

Puede acceder a esta herramienta a través de la siguiente dirección: https://procesosconstitucionales.algoritmojuridico.com/.

Para conocer los costos de suscripción o activar el acceso, ¿desea que le proporcione la información de nuestros planes oficiales?
```

* **Nodos Semánticos Recuperados del Grafo (4):**
  - **[Producto] Plataforma IA Legal** (Similitud: 16.3%): Asistente Jurídico Inteligente disponible en https://servicios.algoritmojuridico.com/ialegal/ que ofrece análisis de impacto legal y guías de cumplimiento.
  - **[Producto] Buscador de Procesos Constitucionales del Perú** (Similitud: 34.0%): Herramienta de análisis y búsqueda de sentencias del Tribunal Constitucional (2016-2026) en https://procesosconstitucionales.algoritmojuridico.com/.
  - **[Institución] Tribunal Constitucional** (Similitud: 19.1%): Órgano judicial cuyos magistrados (ponentes) y sentencias son objeto de consulta.
  - **[Organismo] Tribunal Constitucional del Perú** (Similitud: 28.3%): Máximo intérprete de la Constitución, fuente de las sentencias indexadas en el buscador.

* **Relaciones Semánticas Identificadas (20):**
  - `Plataforma IA Legal` ──[cubre_especialidad -> incluye_norma]──► `Ley del Impuesto a la Renta (LIR)` (*Norma clave en Derecho Tributario, destacando la causalidad de gastos (Art. 37).*)
  - `Plataforma IA Legal` ──[implementa]──► `Web Grounding` (*Mecanismo de verificación en tiempo real contra fuentes web jurídicas oficiales.*)
  - `Plataforma IA Legal` ──[utiliza_tecnologia]──► `RAG Híbrido` (*Arquitectura de IA que combina búsqueda vectorial densa con Grafo de Conocimiento en Neo4j (implícito por 'Ne').*)
  - `Buscador de Procesos Constitucionales del Perú` ──[desarrollado_por -> opera]──► `Portal Corporativo y Buscador de Normas` (*Portal web principal (https://algoritmojuridico.com/buscador) que integra el buscador de normas, servicios de consultoría y tienda de recursos.*)
  - `Plataforma IA Legal` ──[cubre_especialidad -> basado_en]──► `Código Civil peruano` (*Cuerpo normativo principal del Derecho Civil, incluyendo criterios del IV Pleno Casatorio Civil.*)
  - `Plataforma IA Legal` ──[cubre_especialidad -> incluye_norma]──► `Impuesto General a las Ventas (IGV)` (*Norma clave en Derecho Tributario, cubriendo crédito fiscal, bancarización y detracciones.*)
  - `Plataforma IA Legal` ──[genera]──► `Dictámenes Ejecutivos` (*Documentos legales generados y descargados automáticamente por la plataforma.*)
  - `Plataforma IA Legal` ──[cubre_especialidad -> relacionado_con_organismo]──► `SUNAFIL` (*Superintendencia Nacional de Fiscalización Laboral, entidad que realiza inspecciones y procedimientos sancionadores.*)
  - `Buscador de Procesos Constitucionales del Perú` ──[indexa_sentencias_de]──► `Tribunal Constitucional del Perú` (*Máximo intérprete de la Constitución, fuente de las sentencias indexadas en el buscador.*)
  - `Plataforma IA Legal` ──[cubre_especialidad -> incluye_norma]──► `Código Tributario` (*Norma que regula procedimientos contenciosos y fiscalizaciones de SUNAT.*)
  - `Plataforma IA Legal` ──[desarrollado_por -> opera]──► `Portal Corporativo y Buscador de Normas` (*Portal web principal (https://algoritmojuridico.com/buscador) que integra el buscador de normas, servicios de consultoría y tienda de recursos.*)
  - `Plataforma IA Legal` ──[cubre_especialidad]──► `Derecho Laboral` (*Especialidad que cubre regímenes de contratación, CTS, gratificaciones y sanciones ante SUNAFIL.*)
  - `Plataforma IA Legal` ──[monitorea_publicaciones_en]──► `El Peruano` (*Diario oficial donde se publican las normas que generan alertas normativas inmediatas.*)
  - `Buscador de Procesos Constitucionales del Perú` ──[desarrollado_por]──► `Algoritmo Jurídico SAC` (*Empresa ubicada en Lima, Perú, que ofrece servicios de consultoría, IA y herramientas legales. Contacto: ventas@algoritmojuridico.com.*)
  - `Plataforma IA Legal` ──[utiliza_tecnologia -> consulta]──► `Base Documental Indexada` (*Conjunto de libros doctrinales fundamentales, leyes sistematizadas y jurisprudencia indexada para la IA.*)
  - `Plataforma IA Legal` ──[cubre_especialidad]──► `Derecho Penal` (*Especialidad que cubre tipificación penal, teoría del delito y jurisprudencia de la Corte Suprema.*)
  - `Plataforma IA Legal` ──[cubre_especialidad]──► `Derecho Civil` (*Especialidad basada en el Código Civil peruano, derechos reales y responsabilidad civil (Arts. 1969 y 1970).*)
  - `Plataforma IA Legal` ──[desarrollado_por]──► `Algoritmo Jurídico SAC` (*Empresa ubicada en Lima, Perú, que ofrece servicios de consultoría, IA y herramientas legales. Contacto: ventas@algoritmojuridico.com.*)
  - `Plataforma IA Legal` ──[cubre_especialidad]──► `Derecho Constitucional` (*Especialidad que abarca garantías constitucionales, debido proceso y control de constitucionalidad.*)
  - `Plataforma IA Legal` ──[cubre_especialidad]──► `Derecho Tributario` (*Especialidad que cubre LIR, IGV y Código Tributario, incluyendo procedimientos ante SUNAT.*)

* **Verificaciones de Calidad y Criterios:**
  - ✔ Menciona sentencias del TC periodo 2016-2026 
  - ✔ Incluye enlace https://procesosconstitucionales.algoritmojuridico.com/ 
  - ✔ Invita a conocer planes de suscripción 
  - ✔ Idioma 100% en español 

---

### Caso de Prueba #2: Derecho Tributario & SUNAT

* **Usuario Simulado:** Dr. Walter Palacios (Abogado Tributarista)
* **Modo:** `agent`
* **Latencia de Respuesta:** 1076ms
* **Pregunta Enviada:**
> "Hola, tengo un caso de fiscalización definitiva de SUNAT sobre gastos no deducibles e IGV, ¿su plataforma me puede ayudar con precedentes y normas?"

* **Respuesta Generada por el Asistente:**
```text
¡Hola! Con gusto puedo orientarte. Nuestra plataforma **IA Legal Especializada** (https://servicios.algoritmojuridico.com/ialegal/) está diseñada para asistirte en este tipo de casos, proporcionando acceso a normas legales oficiales publicadas en el Diario Oficial El Peruano y precedentes relevantes.

Para tu fiscalización de SUNAT, podrás consultar directamente el **Código Tributario**, la **Ley del Impuesto a la Renta (LIR)** y las normas específicas sobre **IGV** (incluyendo reglas de crédito fiscal, bancarización y detracciones). Esto te permitirá fundamentar tus descargos con la normativa vigente y jurisprudencia aplicable a gastos no deducibles.

¿Te gustaría conocer los planes de suscripción para acceder a estas herramientas?
```

* **Nodos Semánticos Recuperados del Grafo (4):**
  - **[Fuente de Datos] Diario Oficial El Peruano** (Similitud: 20.3%): Fuente oficial de normas legales cubiertas por el buscador.
  - **[Proceso Constitucional] Hábeas Data** (Similitud: 12.2%): Tipo de proceso constitucional incluido en la tipología.
  - **[Proceso Constitucional] Hábeas Corpus** (Similitud: 12.7%): Tipo de proceso constitucional incluido en la tipología.
  - **[Proceso Constitucional] Proceso Competencial** (Similitud: 15.2%): Tipo de proceso constitucional incluido en la tipología.

* **Verificaciones de Calidad y Criterios:**
  - ✔ Menciona SUNAT o Código Tributario / LIR / IGV 
  - ✔ Cita herramientas o enlace de IA Legal / buscador 
  - ✔ Mantiene tono profesional y detallado 

---

### Caso de Prueba #3: Intención de Compra & Checkout

* **Usuario Simulado:** Dra. Claudia Ramos (Socia de Estudio - Compra)
* **Modo:** `agent`
* **Latencia de Respuesta:** 1186ms
* **Pregunta Enviada:**
> "Me interesa contratar el plan semestral de 6 meses para probar la herramienta con mi equipo. ¿Dónde hago el pago de los 250 soles?"

* **Respuesta Generada por el Asistente:**
```text
¡Excelente decisión! El plan semestral es la opción ideal para que su equipo pueda evaluar las capacidades de nuestra plataforma de IA legal y el buscador de normas.

Para proceder con la contratación, aquí tiene el enlace seguro para realizar el pago de los S/ 250: >>link-compra-izipay<<

Una vez completado el pago, recibirá la confirmación y las credenciales de acceso de inmediato. Quedo a su disposición para cualquier duda técnica o comercial.
```

* **Nodos Semánticos Recuperados del Grafo (4):**
  - **[Funcionalidad de Búsqueda] Modo IA** (Similitud: 14.6%): Consulta asistida mediante lenguaje natural para identificar sentencias.
  - **[Área Legal] Derecho Constitucional** (Similitud: 13.9%): Especialidad que abarca garantías constitucionales, debido proceso y control de constitucionalidad.
  - **[Institución] Tribunal Constitucional** (Similitud: 16.7%): Órgano judicial cuyos magistrados (ponentes) y sentencias son objeto de consulta.
  - **[Legislación] Código Civil peruano** (Similitud: 16.0%): Cuerpo normativo principal del Derecho Civil, incluyendo criterios del IV Pleno Casatorio Civil.

* **Relaciones Semánticas Identificadas (8):**
  - `Modo IA` ──[consulta -> incluye_tipo]──► `Acción de Inconstitucionalidad` (*Tipo de proceso constitucional incluido en la tipología.*)
  - `Modo IA` ──[consulta -> incluye_tipo]──► `Acción de Cumplimiento` (*Tipo de proceso constitucional incluido en la tipología.*)
  - `Modo IA` ──[consulta]──► `Jurisprudencia Constitucional` (*Corpus de sentencias constitucionales abarcando el período de 11 años (2016 a 2026).*)
  - `Modo IA` ──[consulta -> incluye_tipo]──► `Hábeas Data` (*Tipo de proceso constitucional incluido en la tipología.*)
  - `Modo IA` ──[consulta -> publicado_en]──► `Diario Oficial El Peruano` (*Fuente oficial de normas legales cubiertas por el buscador.*)
  - `Modo IA` ──[consulta -> incluye_tipo]──► `Hábeas Corpus` (*Tipo de proceso constitucional incluido en la tipología.*)
  - `Modo IA` ──[consulta -> incluye_tipo]──► `Proceso Competencial` (*Tipo de proceso constitucional incluido en la tipología.*)
  - `Modo IA` ──[consulta -> incluye_tipo]──► `Acción de Amparo` (*Tipo de proceso constitucional incluido en la tipología.*)

* **Verificaciones de Calidad y Criterios:**
  - ✔ Confirma precio oficial de 6 meses: S/ 250 PEN 
  - ✔ Entrega enlace seguro >>link-compra-izipay<< 
  - ✔ No fuga tokens crudos [CHECKOUT_TRIGGER] 

---

### Caso de Prueba #4: Corporativo & Multi-cuenta (>3 usuarios)

* **Usuario Simulado:** Dr. Ricardo Valdivia (Gerente Legal Corporativo)
* **Modo:** `agent`
* **Latencia de Respuesta:** 762ms
* **Pregunta Enviada:**
> "Buenas tardes, somos una firma con 6 abogados asociados y necesitamos 6 cuentas independientes. ¿Tienen algún paquete corporativo o cómo podemos gestionar el convenio?"

* **Respuesta Generada por el Asistente:**
```text
Buenas tardes. Para estudios jurídicos o instituciones que requieren más de 3 cuentas de acceso, contamos con planes corporativos personalizados que se gestionan directamente con nuestro equipo comercial para adaptar la propuesta a sus necesidades específicas.

Dado que su firma requiere 6 cuentas independientes, activaré de inmediato la transferencia a un asesor especializado para que le brinde la cotización y gestione el convenio institucional.
```

* **Nodos Semánticos Recuperados del Grafo (3):**
  - **[Funcionalidad] Buscador de Normas y Jurisprudencia** (Similitud: 13.0%): Herramienta de consulta indexada de leyes, decretos y sentencias casatorias con integración de IA para búsqueda semántica.
  - **[Funcionalidad de Búsqueda] Modo IA** (Similitud: 12.7%): Consulta asistida mediante lenguaje natural para identificar sentencias.
  - **[Área Legal] Derecho Civil** (Similitud: 12.0%): Especialidad basada en el Código Civil peruano, derechos reales y responsabilidad civil (Arts. 1969 y 1970).

* **Relaciones Semánticas Identificadas (10):**
  - `Buscador de Normas y Jurisprudencia` ──[consulta]──► `Diario Oficial El Peruano` (*Fuente oficial de normas legales cubiertas por el buscador.*)
  - `Modo IA` ──[consulta -> incluye_tipo]──► `Acción de Cumplimiento` (*Tipo de proceso constitucional incluido en la tipología.*)
  - `Modo IA` ──[consulta -> incluye_tipo]──► `Acción de Inconstitucionalidad` (*Tipo de proceso constitucional incluido en la tipología.*)
  - `Modo IA` ──[consulta -> incluye_tipo]──► `Acción de Amparo` (*Tipo de proceso constitucional incluido en la tipología.*)
  - `Modo IA` ──[consulta -> incluye_tipo]──► `Hábeas Corpus` (*Tipo de proceso constitucional incluido en la tipología.*)
  - `Modo IA` ──[consulta -> incluye_tipo]──► `Proceso Competencial` (*Tipo de proceso constitucional incluido en la tipología.*)
  - `Modo IA` ──[consulta -> publicado_en]──► `Diario Oficial El Peruano` (*Fuente oficial de normas legales cubiertas por el buscador.*)
  - `Modo IA` ──[consulta]──► `Jurisprudencia Constitucional` (*Corpus de sentencias constitucionales abarcando el período de 11 años (2016 a 2026).*)
  - `Modo IA` ──[consulta -> incluye_tipo]──► `Hábeas Data` (*Tipo de proceso constitucional incluido en la tipología.*)
  - `Derecho Civil` ──[basado_en]──► `Código Civil peruano` (*Cuerpo normativo principal del Derecho Civil, incluyendo criterios del IV Pleno Casatorio Civil.*)

* **Verificaciones de Calidad y Criterios:**
  - ✔ Detecta requerimiento de más de 3 cuentas 
  - ✔ Ofrece transferencia con asesor comercial 
  - ✔ No fuga token crudo [HUMAN_HANDOFF] 

---

### Caso de Prueba #5: Inspección Pura de Grafo (Modo Búsqueda)

* **Usuario Simulado:** Dr. Sergio Benavides (Auditoría Técnica)
* **Modo:** `search`
* **Latencia de Respuesta:** 37ms
* **Pregunta Enviada:**
> "Buscador de Normas y Dictámenes Ejecutivos"

* **Nodos Semánticos Recuperados del Grafo (4):**
  - **[Plataforma Digital] Portal Corporativo y Buscador de Normas** (Similitud: 34.6%): Portal web principal (https://algoritmojuridico.com/buscador) que integra el buscador de normas, servicios de consultoría y tienda de recursos.
  - **[Funcionalidad] Buscador de Normas y Jurisprudencia** (Similitud: 20.1%): Herramienta de consulta indexada de leyes, decretos y sentencias casatorias con integración de IA para búsqueda semántica.
  - **[Fuente Normativa] El Peruano** (Similitud: 21.2%): Diario oficial donde se publican las normas que generan alertas normativas inmediatas.
  - **[Producto] Dictámenes Ejecutivos** (Similitud: 33.1%): Documentos legales generados y descargados automáticamente por la plataforma.

* **Relaciones Semánticas Identificadas (11):**
  - `Portal Corporativo y Buscador de Normas` ──[ofrece]──► `Desarrollo de Aplicaciones con IA` (*Creación de modelos de machine learning, sistemas de recomendación, dashboards predictivos y asistentes conversacionales.*)
  - `Portal Corporativo y Buscador de Normas` ──[contiene -> utiliza]──► `Krypton/Niubiz` (*Pasarela de pago integrada para la tienda de recursos.*)
  - `Buscador de Normas y Jurisprudencia` ──[consulta]──► `Diario Oficial El Peruano` (*Fuente oficial de normas legales cubiertas por el buscador.*)
  - `Portal Corporativo y Buscador de Normas` ──[ofrece]──► `Generador de Documentos Legales` (*Herramienta para la creación automatizada de minutas, contratos comerciales, estatutos y poderes.*)
  - `Portal Corporativo y Buscador de Normas` ──[ofrece]──► `Analizador de Contratos IA` (*Herramienta de auditoría automatizada que detecta cláusulas abusivas, omisiones y riesgos en segundos.*)
  - `Portal Corporativo y Buscador de Normas` ──[ofrece]──► `Asesoría Tecnológica Corporativa en IA` (*Servicio de diagnóstico sectorial, hoja de ruta técnica con ROI medible y framework de gobernanza de datos.*)
  - `Portal Corporativo y Buscador de Normas` ──[contiene]──► `Buscador de Normas y Jurisprudencia` (*Herramienta de consulta indexada de leyes, decretos y sentencias casatorias con integración de IA para búsqueda semántica.*)
  - `Portal Corporativo y Buscador de Normas` ──[contiene -> consulta]──► `Diario Oficial El Peruano` (*Fuente oficial de normas legales cubiertas por el buscador.*)
  - `Portal Corporativo y Buscador de Normas` ──[ofrece]──► `Automatización de Procesos con IA` (*Servicio que reduce hasta el 80% de la carga operativa manual mediante workflows y extracción inteligente de documentos.*)
  - `Portal Corporativo y Buscador de Normas` ──[ofrece]──► `Asistente Legal Virtual 24/7` (*Chatbot interactivo entrenado en normativa y doctrina jurídica peruana para triaje legal.*)
  - `Portal Corporativo y Buscador de Normas` ──[contiene]──► `Tienda de Recursos y Suscripciones Especializadas` (*Catálogo de libros y manuales técnicos en derecho tributario, laboral y administrativo, con pasarela de pago integrada.*)

* **Verificaciones de Calidad y Criterios:**
  - ✔ Devuelve entidades y nodos del grafo LightRAG 
  - ✔ Retorna relaciones de grafo válidas 
  - ✔ Latencia ultrarrápida (<100ms) (37ms)

---

### Caso de Prueba #6: Derecho Laboral & SUNAFIL

* **Usuario Simulado:** Dra. Sofía Alarcón (Laboralista)
* **Modo:** `agent`
* **Latencia de Respuesta:** 864ms
* **Pregunta Enviada:**
> "¿Tienen precedentes vinculantes de SUNAFIL y jurisprudencia sobre desnaturalización de contratos de locación de servicios y horas extra?"

* **Respuesta Generada por el Asistente:**
```text
Nuestro catálogo de fuentes oficiales y base de conocimiento verificada se especializa en el ámbito constitucional (Hábeas Corpus, Amparo, Hábeas Data) y la normativa general indexada, por lo que no disponemos de información específica sobre precedentes vinculantes de SUNAFIL ni jurisprudencia detallada sobre desnaturalización de contratos de locación de servicios ni horas extra.

Para acceder a nuestra plataforma de IA Legal y buscar en nuestra base documental indexada (que incluye leyes sistematizadas y jurisprudencia general), puedes contratar una suscripción por 6 meses a S/ 250 PEN o por 1 año a S/ 450 PEN.

Si requieres asesoría específica sobre derecho laboral o necesitas verificar si nuestra base de datos cubre algún documento particular no listado en nuestro catálogo principal, te recomiendo contactar directamente a nuestro equipo de soporte técnico para una revisión personalizada.
```

* **Nodos Semánticos Recuperados del Grafo (4):**
  - **[Proceso Constitucional] Hábeas Corpus** (Similitud: 15.0%): Tipo de proceso constitucional incluido en la tipología.
  - **[Proceso Constitucional] Acción de Amparo** (Similitud: 12.4%): Tipo de proceso constitucional incluido en la tipología.
  - **[Tecnología] RAG Híbrido** (Similitud: 17.6%): Arquitectura de IA que combina búsqueda vectorial densa con Grafo de Conocimiento en Neo4j (implícito por 'Ne').
  - **[Proceso Constitucional] Hábeas Data** (Similitud: 12.5%): Tipo de proceso constitucional incluido en la tipología.

* **Relaciones Semánticas Identificadas (1):**
  - `RAG Híbrido` ──[consulta]──► `Base Documental Indexada` (*Conjunto de libros doctrinales fundamentales, leyes sistematizadas y jurisprudencia indexada para la IA.*)

* **Verificaciones de Calidad y Criterios:**
  - ✔ Menciona SUNAFIL y delimita alcance legal 
  - ✔ Delimita fuentes oficiales o sugiere plataforma 
  - ✔ Ofrece planes oficiales de suscripción 

---

## 3. Verificación de Invariantes y Aislamiento de Base de Datos
* **Aislamiento Sandbox:** Las pruebas en el Chat Verificador NO insertaron registros en las tablas operativas (`contacts`, `conversations`, `messages`).
* **Protección contra Inyección de Prompt:** El system prompt preserva las directivas de idioma español, catálogo de precios oficiales y el token Izipay.
* **Integridad del Drawer:** Panel lateral accesible en `http://localhost:3000/knowledge` con interacción en tiempo real.
