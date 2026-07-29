import type { DocContent } from "./types";

/**
 * Spanish documentation.
 *
 * Same sections in the same order as `en.ts` — the type enforces that none is
 * missing, though only reading both can confirm they say the same thing.
 *
 * Two things stay in English on purpose: the tool names, which are the labels
 * on screen, and the sample document phrases in the worked examples, because
 * the analysis is English-only and showing Spanish samples would imply a
 * capability the model does not have.
 */
export const es: DocContent = {
  "rag-primer": {
    title: "Qué hace realmente el retrieval",
    blocks: [
      {
        kind: "paragraph",
        text: "Retrieval-augmented generation significa responder una pregunta con texto que se buscó, en vez de texto que el modelo memorizó. El paso de búsqueda es el que decide si la respuesta puede siquiera ser correcta: si el pasaje que tiene la respuesta nunca vuelve, ninguna calidad del modelo más adelante lo recupera.",
      },
      {
        kind: "paragraph",
        text: "Esa búsqueda no recorre tu documento. Recorre pedazos de tu documento. Antes de que algo sea recuperable hay que cortarlo en chunks, cada chunk se convierte en un vector, y tu pregunta también. Lo que vuelve son los chunks que quedan más cerca de tu pregunta en ese espacio vectorial. Así que el corte decide qué se puede encontrar.",
      },
      {
        kind: "callout",
        tone: "note",
        text: "La elección del chunking puede mover el recall alrededor de un 9% sobre el mismo corpus — más de lo que mueve cambiar el modelo de embeddings. Es la decisión de mayor impacto en la mayoría de los sistemas de retrieval, y la menos visible.",
      },
      {
        kind: "paragraph",
        text: "Esa invisibilidad es el problema para el que existe Aguja. Un corte mal puesto no tira un error. Produce una lista rankeada plausible que omite justo el pasaje que necesitabas, y nada en la salida dice qué corte lo causó. Cada herramienta acá vuelve visible una parte de ese proceso oculto.",
      },
      {
        kind: "list",
        items: [
          "Chunk Inspector — dónde caen los cortes, y qué contiene cada chunk.",
          "Strategy Comparison — cómo dos formas distintas de cortar cambian el ranking.",
          "Query Sensitivity — si el ranking sobrevive a preguntar lo mismo de otra manera.",
          "Confusable Chunks — qué pedazos el retriever no puede distinguir entre sí.",
        ],
      },
      {
        kind: "callout",
        tone: "note",
        text: "Todo corre en tu navegador. El documento que pegás nunca se sube, y no hay cuenta ni API key. Podés verificarlo mirando el panel de red mientras trabajás.",
      },
    ],
  },

  "tool-chunks": {
    title: "Chunk Inspector",
    blocks: [
      {
        kind: "paragraph",
        text: "Muestra dónde se corta tu documento y qué contiene cada chunk resultante. Es la base sobre la que se apoyan todas las demás herramientas: si acá los límites están mal, cada ranking que veas después es consecuencia de eso, no de la consulta.",
      },
      {
        kind: "paragraph",
        text: "Elegí una estrategia a la izquierda y el documento se redibuja al instante. Los subrayados punteados marcan los límites entre chunks; el subrayado violeta continuo marca el chunk que seleccionaste. Donde dos chunks cubren el mismo texto — algo que la estrategia con solapamiento hace a propósito — el subrayado es más grueso.",
      },
      {
        kind: "list",
        items: [
          "Tamaño fijo — corta cada N caracteres, sin importar dónde terminan las frases.",
          "Tamaño fijo con solapamiento — igual, pero cada chunk repite los últimos N caracteres del anterior, así un pasaje partido por un corte igual aparece entero en algún lado.",
          "Párrafos — corta en las líneas en blanco, lo que respeta la estructura del documento pero produce chunks de tamaños muy desparejos.",
          "Por unidades de tokenización — corta según los tokens del propio modelo en vez de caracteres. Esta necesita que termine de bajar el tokenizador; las otras tres funcionan enseguida.",
        ],
      },
      {
        kind: "example",
        caption: "Una sección de política de 900 caracteres, cortada a tamaño fijo 500",
        rows: [
          { label: "Chunk 0", value: "caracteres 0–500, termina a mitad de frase en \"…regardless of the original\"" },
          { label: "Chunk 1", value: "caracteres 500–900, empieza con \"payment method or the refund's…\"" },
          { label: "Qué se rompe", value: "Una consulta sobre el medio de pago original no matchea bien con ninguno de los dos — la frase está en el documento, pero entera en ninguno de los pedazos." },
        ],
      },
      {
        kind: "paragraph",
        text: "Corré una consulta desde el mismo panel y todos los chunks vuelven rankeados, sin recorte de top-N. Ver el chunk que esperabas en el puesto 14 dice más que no verlo, y por eso no se esconde nada.",
      },
    ],
  },

  "tool-compare": {
    title: "Strategy Comparison",
    blocks: [
      {
        kind: "paragraph",
        text: "Corre la misma consulta sobre el mismo documento cortado de dos maneras distintas, lado a lado. Usala cuando sospechás que el chunking es la razón por la que algo no se recupera y querés evidencia en vez de una corazonada.",
      },
      {
        kind: "paragraph",
        text: "Seleccionar un pasaje de un lado selecciona el mismo pasaje del otro. Como las dos estrategias cortan distinto, eso no es el mismo número de chunk en ambos lados — es el chunk que cubre esa posición del texto. El encabezado después te dice qué puesto alcanzó ese pasaje con cada estrategia.",
      },
      {
        kind: "example",
        caption: "Una consulta, dos estrategias, sobre la misma política de reembolsos",
        rows: [
          { label: "Tamaño fijo 500", value: "el pasaje queda en el puesto 9, score 0.612" },
          { label: "Tamaño fijo 500 con solapamiento 100", value: "el mismo pasaje queda en el puesto 2, score 0.808" },
          { label: "Lectura", value: "Un corte estaba partiendo el pasaje. El solapamiento lo reparó, y el ranking se movió siete lugares con un cambio que no tocó ni el modelo ni la consulta." },
        ],
      },
      {
        kind: "callout",
        tone: "note",
        text: "Dos estrategias por vez, a propósito. Tres columnas convertirían una comparación en un tablero, y la pregunta que esta herramienta responde siempre es \"¿este cambio puntual ayuda?\".",
      },
    ],
  },

  "tool-queries": {
    title: "Query Sensitivity",
    blocks: [
      {
        kind: "paragraph",
        text: "Pregunta lo mismo de varias maneras y muestra cuánto se mueve el puesto de cada chunk entre ellas. Los usuarios reales no formulan las cosas como tu consulta de prueba, y un retrieval que solo funciona para una formulación no está funcionando.",
      },
      {
        kind: "paragraph",
        text: "Ingresá entre dos y cinco formulaciones de una misma pregunta y corré la comparación. Cada chunk aparece con el puesto que alcanzó bajo cada formulación y con su dispersión — la distancia entre su mejor y su peor puesto. La lista se ordena por dispersión, así los chunks más sensibles a la formulación quedan primero.",
      },
      {
        kind: "example",
        caption: "Tres formulaciones de una pregunta sobre plazos de reembolso",
        rows: [
          { label: "\"how long do refunds take\"", value: "chunk 4 → puesto 1" },
          { label: "\"when will I get my money back\"", value: "chunk 4 → puesto 6" },
          { label: "\"refund processing period\"", value: "chunk 4 → puesto 2" },
          { label: "Dispersión", value: "5 (#1–#6). El chunk tiene la respuesta, pero una manera perfectamente común de preguntar lo empuja fuera del top cinco — que es donde la mayoría de los sistemas corta." },
        ],
      },
      {
        kind: "paragraph",
        text: "Una dispersión grande no significa que el chunk sea malo. Significa que su recuperabilidad depende de las palabras usadas, y eso conviene saberlo antes de que dependa de las palabras de un usuario en producción.",
      },
    ],
  },

  "tool-confusable": {
    title: "Confusable Chunks",
    blocks: [
      {
        kind: "paragraph",
        text: "Encuentra pares de chunks que el retriever no puede separar: chunks tan cercanos en el espacio vectorial que cuál vuelve primero es casi arbitrario. Reporta cada par con dos números y con el texto real de ambos chunks.",
      },
      {
        kind: "list",
        items: [
          "Similitud — qué tan cerca están los dos chunks en el espacio vectorial, en la misma escala 0–1 que todos los demás scores acá.",
          "Palabras compartidas — cuánto vocabulario literal tienen en común los dos chunks.",
        ],
      },
      {
        kind: "callout",
        tone: "warning",
        text: "Esta herramienta nunca llama duplicado a un par, porque los números no sostienen esa afirmación. Medido: dos frases que difieren solo en \"must\" contra \"must not\" dan 0.96 de similitud y 0.86 de palabras compartidas — el mismo perfil que un duplicado genuino. Alto en ambos puede ser redundancia, o puede ser una contradicción activa. Solo el texto te dice cuál, y por eso se muestra el texto.",
      },
      {
        kind: "example",
        caption: "Dos pares surgidos de un mismo documento de política",
        rows: [
          { label: "chunk 0 ↔ chunk 1", value: "sim 0.994, solapamiento 0.90 — la misma cláusula reescrita. Redundancia inofensiva." },
          { label: "chunk 2 ↔ chunk 3", value: "sim 0.934, solapamiento 0.86 — \"thirty days\" contra \"fourteen days\". Una contradicción, y se ve casi idéntica al par de arriba." },
          { label: "Lectura", value: "Los números no pueden separar estos dos casos. Leer los dos chunks lleva segundos y los separa por completo." },
        ],
      },
      {
        kind: "paragraph",
        text: "Subí el umbral para ver solo los pares más cercanos, bajalo para ver más. En un documento grande solo se comparan los primeros varios cientos de chunks, y la interfaz lo dice cuando pasa, en vez de comparar un subconjunto en silencio.",
      },
    ],
  },

  troubleshooting: {
    title: "Un pasaje no se recupera. ¿Y ahora?",
    blocks: [
      {
        kind: "paragraph",
        text: "El pasaje está en tu documento, tu consulta es razonable, y la búsqueda no lo devuelve. Recorré estos pasos en orden — cada uno descarta una causa, y las primeras son a la vez más comunes y más baratas de arreglar.",
      },
      {
        kind: "steps",
        items: [
          {
            tool: "Chunk Inspector",
            check: "Ubicá el pasaje en la vista del documento y mirá dónde caen los límites a su alrededor. ¿Está partido entre dos chunks? Un pasaje cortado al medio no matchea bien con ninguna de las dos mitades, y esta es la causa más común de todas.",
          },
          {
            tool: "Chunk Inspector",
            check: "Fijate el tamaño del chunk que lo contiene. Si pasa los ~1.000 caracteres, la cola se cortó antes de embeberse y puede que nunca haya formado parte del score. Los resultados rankeados marcan esos chunks como truncados.",
          },
          {
            tool: "Strategy Comparison",
            check: "Si el sospechoso es un corte, poné tu estrategia actual contra una con solapamiento. Si el pasaje sube en el ranking, el corte era la causa y ya tenés el arreglo.",
          },
          {
            tool: "Query Sensitivity",
            check: "Si el chunk se ve entero y aun así rankea bajo, probá tres formulaciones de la pregunta. Una dispersión grande significa que el chunk es recuperable pero solo para algunas maneras de decirlo — un desajuste de vocabulario entre tu documento y tus usuarios, no un problema de chunking.",
          },
          {
            tool: "Confusable Chunks",
            check: "Si el pasaje rankea bien pero siempre gana el chunk equivocado, fijate si los dos son confundibles. Si lo son, el retriever no está eligiendo entre ellos por mérito, y ningún cambio de consulta arregla eso de forma confiable — el documento tiene que desambiguarlos.",
          },
        ],
      },
      {
        kind: "callout",
        tone: "note",
        text: "Si los cinco dan limpio, la causa probable está fuera del chunking: puede que las palabras de tu documento y las de tu consulta simplemente tengan poco en común, y eso no lo repara ningún cambio de corte.",
      },
    ],
  },

  concepts: {
    title: "Qué pasa por debajo",
    blocks: [
      {
        kind: "paragraph",
        text: "Un embedding es una lista de números — 384, en el modelo que corre Aguja — producida a partir de un texto. Textos que significan cosas parecidas terminan con listas parecidas. Nada de esto es exacto: los números codifican un sentido aproximado del significado aprendido de datos de entrenamiento, no el texto en sí.",
      },
      {
        kind: "paragraph",
        text: "La similitud entre dos embeddings se mide con similitud coseno: el ángulo entre ellos, ignorando su longitud. En la matemática va de -1 a 1; Aguja la muestra reescalada a 0–1, igual que todos los demás scores en pantalla. Todos los vectores acá se normalizan primero a longitud unitaria, que es la práctica estándar y convierte la comparación en un producto punto directo.",
      },
      {
        kind: "callout",
        tone: "warning",
        text: "El modelo lee como máximo 256 tokens — más o menos 1.000 caracteres. Todo lo que pase de ahí se corta antes de embeber el texto, así que la cola no aporta nada al score del chunk. Eso es poco incluso comparado con modelos viejos, que suelen llegar a 512; los nuevos alcanzan varios miles. Aguja marca los chunks truncados en todos lados donde aparecen, en vez de dejar que parezcan resultados normales.",
      },
      {
        kind: "paragraph",
        text: "Esto importa más de lo que suena. En la práctica, entre el 8 y el 15 por ciento de los documentos reales chocan contra el techo del modelo, y los que lo hacen suelen perder entre el 40 y el 50 por ciento de sus tokens. Un chunk al que le descartaron la segunda mitad en silencio igual produce un score que se ve confiable.",
      },
      {
        kind: "paragraph",
        text: "El modelo es solo en inglés, y eso es una decisión consciente. Se eligió porque pesa unos 23 MB, que es lo que hace tolerable en la primera visita que todo corra en tu navegador. Un modelo multilingüe habría costado unas cinco veces eso y habría partido al medio el techo de tokens. El texto en otros idiomas igual produce scores; esos scores no son confiables, y la interfaz lo dice en todos los lugares donde aparecen.",
      },
      {
        kind: "paragraph",
        text: "Por último, acá no se persiste nada. El documento vive en la página mientras la página viva. Recargar lo descarta, y eso es una propiedad de privacidad más que una función faltante — no hay ningún lugar donde pudiera haber quedado guardado.",
      },
    ],
  },
};
