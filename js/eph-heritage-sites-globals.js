'use strict';

// 1. UBAH JUDUL PETA
const BASE_TITLE = 'Peta Persebaran Masjid – Sumatera Barat';

// 2. ORGS: Kita akali menjadi singkatan nama daerah untuk label
const ORGS = {
  PDG: 'Kota Padang',
  PRM: 'Kota Pariaman',
  BKT: 'Kota Bukittinggi',
  AGM: 'Kabupaten Agam',
  // Tambahkan singkatan lain jika perlu
}

// 3. DESIGNATION_TYPES: Kita akali dengan ID Wikidata Kabupaten/Kota
// Ini yang akan dibaca oleh Dropdown template Anda
const DESIGNATION_TYPES = {
  Q7253 : { org: 'PDG', name: 'Kota Padang'      , order: 1 },
  Q7248 : { org: 'BKT', name: 'Kota Bukittinggi' , order: 2 },
  Q7258 : { org: 'PRM', name: 'Kota Pariaman'    , order: 3 },
  // Tambahkan ID Kab/Kota lain di sini dan pastikan urutannya (order) diteruskan
}

// 4. SPARQL_QUERY_0: Mengambil data masjid, filter wilayah, dan properti P131
// 4. SPARQL_QUERY_0: Mengambil data masjid, filter wilayah, dan properti P131
const SPARQL_QUERY_0 =
`SELECT ?siteQid ?siteLabel ?designationQid ?p131Label ?tahunBerdiriMentah WHERE {
  {
    # 1. Kunci wilayahnya
    VALUES ?designation { wd:Q7253 wd:Q7248 wd:Q7258 }
    
    # 2. Matikan otak otomatis server
    hint:Query hint:optimizer "None" .
    
    # 3. Cari SEMUA item di wilayah tersebut DULU
    ?site wdt:P131+ ?designation .
    
    # 4. BARU saring yang berstatus Masjid
    ?site wdt:P31 wd:Q32815 . 
  }
  
  ?site rdfs:label ?siteLabel . FILTER(LANG(?siteLabel) = "id") .
  
  OPTIONAL {
    ?site wdt:P131 ?p131Lokasi .
    ?p131Lokasi rdfs:label ?p131Label .
    FILTER(LANG(?p131Label) = "id") .
  }
      
  OPTIONAL { ?site wdt:P571 ?tahunBerdiriMentah . }
  
  BIND (SUBSTR(STR(?site), 32) AS ?siteQid) .
  BIND (SUBSTR(STR(?designation), 32) AS ?designationQid) .
} ORDER BY ?siteLabel`;

// 5. SPARQL_QUERY_1: Tetap sama (Hanya mengambil koordinat P625)
const SPARQL_QUERY_1 =
`SELECT ?siteQid ?coord WHERE {
  <SPARQLVALUESCLAUSE>
  ?site p:P625 ?coordStatement .
  ?coordStatement ps:P625 ?coord .
  FILTER NOT EXISTS { ?coordStatement pq:P518 ?x }
  BIND (SUBSTR(STR(?site), 32) AS ?siteQid) .
}`;

// (CATATAN: SPARQL_QUERY_2 SUDAH KITA HAPUS SEPENUHNYA AGAR SERVER TIDAK DOWN)

// 6. SPARQL_QUERY_3: Mengambil gambar dan link Wikipedia
const SPARQL_QUERY_3 =
`SELECT
 ?siteQid
 ?image
 (GROUP_CONCAT(DISTINCT ?vicinityImage;separator="|") AS ?vicinityImages)
 ?pastImage
 ?wikipediaUrlTitle
WHERE {

<SPARQLVALUESCLAUSE>

# GAMBAR UTAMA
OPTIONAL {
    {
        SELECT ?site (MIN(?statementId) AS ?firstStatement)
        WHERE {

            ?site p:P18 ?stmt .

            BIND(STR(?stmt) AS ?statementId)

            ?stmt ps:P18 ?imgUtama .

            FILTER NOT EXISTS {
                ?stmt pq:P3831 wd:Q16189205
            }

            FILTER NOT EXISTS {
                ?stmt pq:P180 wd:Q192630
            }

        }
        GROUP BY ?site
    }

    ?site p:P18 ?statement .
    BIND(STR(?statement) AS ?statementId)

    FILTER(?statementId=?firstStatement)

    ?statement ps:P18 ?image .
}

# GAMBAR LINGKUNGAN
OPTIONAL {

    ?site p:P18 ?vicinityStmt .
    ?vicinityStmt ps:P18 ?vicinityImage .

    FILTER EXISTS {
        ?vicinityStmt pq:P3831 wd:Q16189205
    }
}

# MASA LALU
OPTIONAL {

    ?site p:P18 ?pastStmt .
    ?pastStmt ps:P18 ?pastImage .

    ?pastStmt pq:P180 wd:Q192630 .
}

OPTIONAL {
    ?wikipedia schema:about ?site ;
               schema:isPartOf <https://id.wikipedia.org/> .

    BIND(
        SUBSTR(
            STR(?wikipedia),
            31
        )
        AS ?wikipediaUrlTitle
    )
}

BIND(
    SUBSTR(
        STR(?site),
        32
    )
    AS ?siteQid
)

}
GROUP BY
?siteQid
?image
?pastImage
?wikipediaUrlTitle`

// 7. ABOUT_SPARQL_QUERY: Disesuaikan menggunakan logika wilayah
const ABOUT_SPARQL_QUERY =
`
`;

// Globals
var DesignationIndex;
var Records = {}; // Memastikan Records dideklarasikan jika template membutuhkannya
