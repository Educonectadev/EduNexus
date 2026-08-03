export interface Province {
  name: string
  districts: string[]
}

export interface Department {
  name: string
  provinces: Province[]
}

export const departments: Department[] = [
  {
    name: "Amazonas",
    provinces: [
      {
        name: "Chachapoyas",
        districts: ["Chachapoyas", "Asunción", "Balsas", "Cheto", "Chiliquín", "Chuquibamba", "Granada", "Huancabamba", "Huancas", "La Jalca Grande", "Leimebamba", "Levanto", "Magdalena", "Mariscal Castilla", "Molinopampa", "Montevideo", "Olleros", "Quinjalca", "San Francisco de Daguas", "San Isidro de Maino", "Soloco", "Sonche"],
      },
      {
        name: "Bagua",
        districts: ["Bagua", "Aramango", "Copallín", "El Parco", "Imaza", "La Peca"],
      },
      {
        name: "Bongará",
        districts: ["Jumbilla", "Chisquilla", "Churuja", "Corosha", "Cuispes", "Florida", "Jazán", "Recta", "San Carlos", "Shipasbamba", "Valera", "Yambrasbamba"],
      },
      {
        name: "Condorcanqui",
        districts: ["Nieva", "El Cenepa", "Río Santiago"],
      },
      {
        name: "Luya",
        districts: ["Lamud", "Camporredondo", "Cocabamba", "Colcamar", "Conila", "Inguilpata", "Longuita", "Lonya Chico", "Luya", "Luya Viejo", "María", "Ocalli", "Ocumal", "Pisuquía", "Providencia", "San Cristóbal", "San Francisco de Yeso", "San Jerónimo", "San Juan de Lopecancha", "Santa Catalina", "Santo Tomás", "Tingo", "Trita"],
      },
      {
        name: "Rodríguez de Mendoza",
        districts: ["San Nicolás", "Chirimoto", "Cochamal", "Huamboya", "San Juan de Yanac", "San Martín de Pangoa", "San Sebastián de Saylla", "Saplacán"],
      },
      {
        name: "Utcubamba",
        districts: ["Bagua Grande", "Cajaruro", "Cumba", "El Milagro", "Jamalca", "Lonya Grande", "Yamon"],
      },
    ],
  },
  {
    name: "Ancash",
    provinces: [
      {
        name: "Huaraz",
        districts: ["Huaraz", "Cochabamba", "Colcabamba", "Huanchay", "Independencia", "Jangas", "La Libertad", "Olleros", "Pira", "Piraibamba", "Tarica"],
      },
      {
        name: "Aija",
        districts: ["Aija", "Coris", "Huacayán", "San Juan", "Raya Raymi", "San Luis", "Succha"],
      },
      {
        name: "Antonio Raymondi",
        districts: ["Llamellín", "Aczo", "Chaccho", "Chingas", "Mirgas", "San Juan de Rontoy"],
      },
      {
        name: "Asunción",
        districts: ["Chacas", "Acochaca"],
      },
      {
        name: "Bolognesi",
        districts: ["Chiquián", "Abelardo Pardo Lezameta", "Antonio Raymondi", "Aquia", "Cajacay", "Canislos", "Colquioc", "Huallanca", "Huasta", "Huayllacayán", "La Primavera", "Mangas", "Pacllón", "San Miguel de Corpanqui", "Ticllos"],
      },
      {
        name: "Carhuaz",
        districts: ["Carhuaz", "Acopampa", "Amagashca", "Ataero", "Cojup", "Huayllabamba", "Oksapampa", "San Luis", "San Rafael", "Shilla", "Tinco", "Yungay"],
      },
      {
        name: "Carlos Fermín Fitzcarrald",
        districts: ["San Luis", "San Nicolás", "Yauya"],
      },
      {
        name: "Casma",
        districts: ["Casma", "Buena Vista Alta", "Comandante Noel", "Yaután"],
      },
      {
        name: "Corongo",
        districts: ["Corongo", "Aco", "Bambas", "Cusca", "La Pampa", "Llipa", "San Cristóbal de Rajucol", "San Miguel de Corpanqui", "San Pedro de Rancay", "Siquia"],
      },
      {
        name: "Huari",
        districts: ["Huari", "Anra", "Cajay", "Chavín de Huántar", "Huacrachuco", "Cholga", "Mattó", "Pariahuanca", "San Marcos", "San Pedro de Chana", "Uco"],
      },
      {
        name: "Huarmey",
        districts: ["Huarmey", "Cochapeti", "Culebras", "Huayan", "Malvas"],
      },
      {
        name: "Huaylas",
        districts: ["Caraz", "Huallanca", "Huata", "Huaylas", "Mato", "Pamparomas", "Pueblo Libre", "Santa Cruz de Retamal", "Sihuas", "Yuracmaro"],
      },
      {
        name: "Mariscal Luzuriaga",
        districts: ["Piscobamba", "Casca", "Eleazar Guzmán Barrón", "Fidel Olivas Escudero", "Llama", "Llumpa", "Lucma", "Musga"],
      },
      {
        name: "Ocros",
        districts: ["Ocros", "Acas", "Cajamarquilla", "Carhuapampa", "Cochas", "Congas", "Llipa", "San Cristóbal de Rajucol", "San Pedro de Chana", "San Pedro de Corpanqui"],
      },
      {
        name: "Pallasca",
        districts: ["Cabana", "Bolognesi", "Conchucos", "Huacaschuque", "Huandoval", "Lacabamba", "Llapo", "Pallasca", "Pampa Hermosa", "Santuario de Ráscat"],
      },
      {
        name: "Pomabamba",
        districts: ["Pomabamba", "Huayllán", "Parobamba", "Quinuabamba"],
      },
      {
        name: "Recuay",
        districts: ["Recuay", "Catac", "Cotaparaco", "Huayllapampa", "Llacllin", "Marca", "Pampas Chico", "Pararín", "Tapacocha", "Ticapampa"],
      },
      {
        name: "Santa",
        districts: ["Chimbote", "Cáceres del Perú", "Coishco", "Macate", "Moro", "Nepeña", "Samanco", "Santa"],
      },
      {
        name: "Sihuas",
        districts: ["Sihuas", "Alfonso Ugarte", "Chingalpo", "Huayabamba", "Quiches", "Ragash", "San Juan", "Sicsibamba"],
      },
      {
        name: "Yungay",
        districts: ["Yungay", "Cascapara", "Mancos", "Ranracancha", "Rumipalla", "San Pablo de Colata", "Tupac Amaru"],
      },
    ],
  },
  {
    name: "Apurímac",
    provinces: [
      {
        name: "Abancay",
        districts: ["Abancay", "Chacoche", "Circa", "Curahuasi", "Huanipaca", "Lambrama", "Pichirhua", "San Pedro de Cachora", "Tamburco"],
      },
      {
        name: "Andahuaylas",
        districts: ["Andahuaylas", "Andarapa", "Chiara", "Huancarama", "Huancaray", "Huayana", "Kishuara", "Pacobamba", "Pacucha", "Pampachiri", "Pomacocha", "San Antonio de Cachi", "San Jerónimo", "San Miguel de Chaccrampa", "Santa María de Chico Chocarca", "Talavera", "Tumay Huaraca", "Turpo"],
      },
      {
        name: "Antabamba",
        districts: ["Antabamba", "El Oro", "Huaquirca", "Juan Espinoza Medrano", "Ocongate", "Oropesa", "Pachaconas", "Sabaino"],
      },
      {
        name: "Aymaraes",
        districts: ["Chalhuanca", "Capaya", "Caraybamba", "Chapimarca", "Colcabamba", "Cotaruse", "Huayllo", "Justo Apu Sahuaraura", "Lucre", "Pocohuanca", "San Juan de Chacña", "Sañayca", "Sorayucce", "Tapairihua", "Tintay", "Toraya", "Víctor Raul Haya de la Torre"],
      },
      {
        name: "Cotabambas",
        districts: ["Cotabambas", "Ccochaccasa", "Championi", "Grau", "Lampa", "Marcabamba", "Oyolo", "Pararaca", "San Antonio", "Tintay"],
      },
      {
        name: "Chincheros",
        districts: ["Chincheros", "Anco-Huallo", "Cocharcas", "Huaccana", "Huanca Huaraca", "Ocobamba", "Ongoy", "Oyuco", "Ranracancha", "Uranombamba", "Urraca", "El Porvenir", "Lagunas", "Los Orosco"],
      },
      {
        name: "Grau",
        districts: ["Quillabamba", "Ccairaccu", "Comberbalgo", "La Capilla", "Llama Hualpa", "Los Chankas", "San Cristóbal", "Saylla", "Villa Virgen", "Yanahuanca"],
      },
    ],
  },
  {
    name: "Arequipa",
    provinces: [
      {
        name: "Arequipa",
        districts: ["Alto Selva Alegre", "Cayma", "Cerro Colorado", "Characato", "Chiguata", "Jacobo Hunter", "La Joya", "Mariano Melgar", "Miraflores", "Mollebaya", "Paucarpata", "Pocsi", "Polobaya", "Quequeña", "Sabandía", "Sachaca", "San Juan de Siguas", "San Juan de Tarucani", "Santa Isabel de Siguas", "Santa Rita de Siguas", "Socabaya", "Tiabaya", "Uchumayo", "Vítor", "Yanahuara", "Yarabamba", "Yura"],
      },
      {
        name: "Camana",
        districts: ["Camaná", "José Luis Bustamante y Rivero", "Ocogata", "San José", "San Juan de Tarucani", "Santa Rosa de Quilca"],
      },
      {
        name: "Caravelí",
        districts: ["Caravelí", "Acarí", "Atico", "Atiquipa", "Bella Unión", "Cahuacho", "Chala", "Chaparra", "Huanuhuanu", "Jaquí", "Lomas", "Quicacha", "Yauca"],
      },
      {
        name: "Castilla",
        districts: ["Aplao", "Andagua", "Ayo", "Chachas", "Chilcaymarca", "Chuquipongo", "Huancapampa", "Huaquito", "Machaguay", "Orcopampa", "Pampacolca", "Tipán", "Uñón", "Uraca", "Viraco"],
      },
      {
        name: "Caylloma",
        districts: ["Chivay", "Achoma", "Cabanaconde", "Callalli", "Caylloma", "Coporaque", "Huambo", "Huanca", "Huañarcca", "Lari", "Maca", "Madrighal", "San Antonio de Chuca", "Sibayo", "Tapay", "Tisco", "Tuti", "Yanque"],
      },
      {
        name: "Condesuyos",
        districts: ["Chuquibamba", "Andaray", "Cayarani", "Chichas", "Chuquipongo", "El Carmen de la Frontera", "Huilacapata", "Lamay", "Maca", "San Antonio de Chuca", "San Fernando", "San Juan de Siguas", "San Luis de Quiuique", "San Pedro de Huaccarcca", "Santiago de Chocorvos", "Santiago de Pucará", "Soroche"],
      },
      {
        name: "Islay",
        districts: ["Mollendo", "Cocachacra", "Deán Valdivia", "Islay", "Mejía", "Punta de Bombón"],
      },
      {
        name: "La Unión",
        districts: ["Cotahuasi", "Alca", "Algara", "Cayhuayna", "Chuimbata", "Colca", "Huanipaca", "Llamellín", "Macusani", "San Antonio de Chuca", "Sara Sara", "Soraya", "Tapairihua", "Vicho"],
      },
    ],
  },
  {
    name: "Ayacucho",
    provinces: [
      {
        name: "Huamanga",
        districts: ["Ayacucho", "Acocro", "Acos Vinchos", "Andrés Avelino Cáceres Dorregay", "Ayacucho", "Carmen Alto", "Chiara", "Jesús Nazareno", "Oscobamba", "Quinua", "San José de Ticllas", "San Juan Bautista", "Santiago de Pischa", "Socos", "Tambillo", "Vinchos"],
      },
      {
        name: "Cangallo",
        districts: ["Cangallo", "Chuschi", "Los Morochucos", "María Parado de Bellido", "Oscar R. Beltrán Nasser", "Paccha", "Pomabamba", "Quinua", "San José de Ticllas", "Totos"],
      },
      {
        name: "Huanca Sancos",
        districts: ["Sancos", "Carapo", "Sacsamarca", "Santiago de Lucanamarca", "Tambabamba"],
      },
      {
        name: "Huanuvos",
        districts: ["Víctor Fajardo", "Acocro", "Alcamenca", "Apongo", "Asquipata", "Canaria", "Cayara", "Colca", "Huamanguilla", "Huancaraylla", "Hualla", "Huañec", "Lauricocha", "Santos", "San Juan de Paccolla", "San Salvador de Quije", "Santiago de Paucaray", "Sapallanga", "Saya", "Vilcas Huamán"],
      },
      {
        name: "Lucanas",
        districts: ["Puquio", "Aucara", "Cabana", "Carmen Salcedo", "Chaviña", "Chiclara", "Chumbivilcas", "Cosanga", "Lambrama", "Lucanas", "Ocaña", "Otoca", "Sancos", "San Pedro de Palccay", "Santa Lucía", "Sarhua", "Vilchís", "Villa Virgen"],
      },
      {
        name: "Parinacochas",
        districts: ["Coracora", "Chumpi", "Coronel Castañeda", "Pacapoja", "Pampacolca", "Tambo", "Tambobamba"],
      },
      {
        name: "Paula Llorente Sanz de Bayle",
        districts: ["San Juan de Sacsamarca", "Santiago de Lucanamarca", "Anchihuay", "Oronccoy"],
      },
      {
        name: "Sucre",
        districts: ["Querobamba", "Belén", "Chalcos", "Chilcayoc", "Huacaña", "Morcolla", "Paico", "San Pedro de Larcay", "San Salvador de Quije", "Santiago de Paucaray", "Soracachi"],
      },
      {
        name: "Víctor Fajardo",
        districts: ["Huancapi", "Alcamenca", "Apongo", "Asquipata", "Canaria", "Cayara", "Colca", "Huamanguilla", "Huancaraylla", "Hualla", "Huañec", "Santos", "San Juan de Paccolla", "Saya"],
      },
      {
        name: "Vilcas Huamán",
        districts: ["Vilcas Huamán", "Accorpani", "Carhuahua", "Chamaca", "Colta", "Concepción", "Huambalpa", "Independencia", "Saurama", "Vischongo"],
      },
    ],
  },
  {
    name: "Cajamarca",
    provinces: [
      {
        name: "Cajamarca",
        districts: ["Cajamarca", "Asunción", "Chetilla", "Cospan", "Encañada", "Jesús", "Llacanora", "Los Baños del Inca", "Magdalena", "Matara", "Namora", "San Juan", "San Pablo"],
      },
      {
        name: "Cajabamba",
        districts: ["Cajabamba", "Cachachi", "Condebamba", "Sitabamba"],
      },
      {
        name: "Celedín",
        districts: ["Celedín", "Cendé", "Chalán", "Chilete", "Contumazá", "Cupisnique", "Guzmango", "San Benito", "San Cristóbal de Rajucol", "San Francisco de Sánjuán", "San Gregorio", "San Martín de Pangoa", "San Miguel de Pallaques", "Santa Rosa de Ocopa"],
      },
      {
        name: "Chota",
        districts: ["Chota", "Anguía", "Chadin", "Chiguirip", "Chimban", "Cochabamba", "Conchán", "Huambos", "Lajas", "Lama", "Miras", "Querocoto", "San Juan de Licupis", "Tacabamba", "Tocmoche"],
      },
      {
        name: "Contumazá",
        districts: ["Contumazá", "Chilete", "Cupisnique", "Guzmango", "San Benito", "San Cristóbal de Rajucol", "San Francisco de Sánjuán", "San Gregorio", "San Martín de Pangoa", "San Miguel de Pallaques", "Santa Rosa de Ocopa"],
      },
      {
        name: "Cutervo",
        districts: ["Cutervo", "Callayuc", "Choros", "Cujillo", "La Ramada", "Pimpingos", "Querocotillo", "San Andrés de Cutervo", "San Juan de Cutervo", "San Luis de Lucma", "Santa Cruz", "Santo Domingo de la Capilla", "Santo Tomás", "Socota", "Toriborcas", "Yanacancha"],
      },
      {
        name: "Hualgayoc",
        districts: ["Bambamarca", "Chugur", "Hualgayoc"],
      },
      {
        name: "Jaén",
        districts: ["Jaén", "Bellavista", "Chontali", "Colasay", "Huabal", "Las Pirias", "Pomahuaca", "Pucará", "Sallique", "San Felipe", "San José del Alto", "Santa Rosa"],
      },
      {
        name: "San Ignacio",
        districts: ["San Ignacio", "Chirinos", "Huarango", "La Coipa", "Namballe", "San José de Lourdes", "Tabaconas"],
      },
      {
        name: "San Marcos",
        districts: ["Pedro Gálvez", "Chancay", "Eduardo Villanueva", "Gregorio Pita", "Ichocán", "José Sabogal", "San Pedro de Lloc", "San Severo", "Sapalache"],
      },
      {
        name: "San Pablo",
        districts: ["San Pablo", "San Bernardino", "San Luis", "Tumbaden"],
      },
      {
        name: "Santa Cruz",
        districts: ["Santa Cruz de Succhabamba", "Andabamba", "Catache", "Chancaybaños", "Chuquibamba", "La Esperanza", "Ninabamba", "Pulán", "Santa Cruz de Toledo", "Santuario de los Incas", "Taukama", "Vilca Conga"],
      },
    ],
  },
  {
    name: "Cusco",
    provinces: [
      {
        name: "Cusco",
        districts: ["Cusco", "Ccorca", "Poroy", "San Jerónimo", "San Sebastián", "Santiago", "Saylla", "Wanchaq"],
      },
      {
        name: "Acomayo",
        districts: ["Acomayo", "Acopía", "Acos", "Mosoc Llacta", "Pomacanchi", "Rondocan", "Sangarará"],
      },
      {
        name: "Anta",
        districts: ["Anta", "Ancahuasi", "Cachimayo", "Chinchaypujio", "Huaroconda", "Kutipay", "Limatambo", "Mollepampa", "San Juan de Ocopa", "San Pedro", "Santiago de Ancahuasi", "Taray"],
      },
      {
        name: "Calca",
        districts: ["Calca", "Coya", "Lamay", "Lares", "Pisac", "San Salvador", "Taray", "Yanatile"],
      },
      {
        name: "Canas",
        districts: ["Yanaoca", "Checca", "Kunturkanki", "Langui", "Layo", "Pampamarca", "Quehue", "Túpac Amaru"],
      },
      {
        name: "Canchis",
        districts: ["Sicuani", "Checacupe", "Chincay", "Combapata", "Lamani", "Marangani", "Ollachea", "Raqchi", "San Pedro", "Santuario", "Tinta"],
      },
      {
        name: "Chumbivilcas",
        districts: ["Santo Tomás", "Capacmarca", "Chamaca", "Colquemarca", "Livitaca", "Llusco", "Quiñota", "Velille"],
      },
      {
        name: "Espinar",
        districts: ["Espinar", "Ccorca", "Coyor", "Chanco", "Huique", "Palcu", "Yauri", "Occeguilla"],
      },
      {
        name: "La Convención",
        districts: ["Quillabamba", "Echarate", "Huayopata", "Maranura", "Ocobamba", "Santa Ana", "Santa Teresa", "Villa Kintiarina", "Villa Virgen"],
      },
      {
        name: "Paruro",
        districts: ["Paruro", "Accha", "Ccapi", "Colcha", "Huanoquite", "Omacha", "Paccaritambo", "Pillpinto", "Yaurisque"],
      },
      {
        name: "Paucartambo",
        districts: ["Paucartambo", "Acomed", "Caicay", "Challabamba", "Colquepata", "Huancarani", "Kosñipata", "Huayllay", "Yurac Rumi"],
      },
      {
        name: "Quispicanchi",
        districts: ["Urcos", "Andahuaylillas", "Camanti", "Ccarhuayo", "Ccatca", "Cusipata", "Huaro", "Lucre", "Marcapata", "Ocongate", "Oropesa", "Quiquijana", "San Salvador", "San Sebastián", "Tinta"],
      },
      {
        name: "Urubamba",
        districts: ["Urubamba", "Chinchero", "Huayllabamba", "Machupicchu", "Maras", "Ollantaytambo", "Pichillhua", "Yucay"],
      },
    ],
  },
  {
    name: "Huancavelica",
    provinces: [
      {
        name: "Huancavelica",
        districts: ["Huancavelica", "Acobambilla", "Acoria", "Conayca", "Cuenca", "Huachac", "Huancavelica", "Huando", "Huayucachi", "Ignacio Escudero", "Pilchaca", "Vilca", "Yauli"],
      },
      {
        name: "Acobamba",
        districts: ["Acobamba", "Andaymarca", "Cairanma", "Ccochaccasa", "Chanchos de Tacabamba", "Chincho", "Congallanca", "Huachos", "Huamancata", "Las Patacancha", "Ocobamba", "Pichos", "Salcabamba", "Salcahuasi", "Santiago de Chocorvos", "Santiago de Quirahuara", "Santo Domingo de Capillas", "Tambo", "Tintay Puncu"],
      },
      {
        name: "Angaraes",
        districts: ["Lircay", "Anchonga", "Callanmarca", "Ccochaccasa", "Chincho", "Congalla", "Huanca-Huanca", "Huayllay Grande", "Julcamarca", "Lambrama", "Mantas", "Pichos", "Santiago de Llocclla", "Santuario de Ccalla", "Tambo", "Tantara", "Tantaranca"],
      },
      {
        name: "Castrovirreyna",
        districts: ["Castrovirreyna", "Arma", "Aurahuá", "Capillas", "Chupamarca", "Cocas", "Huachac", "Huamanbamba", "Huandique", "Huáscar", "Huichoc", "Huaribamba", "Oñamco", "Páhuarpampa", "Palcabamba", "Pazos", "Potosí", "San Antonio de Cusicancha", "San Francisco de Sangayaico", "San Isidro", "Santuario", "Tambo", "Tantamayo"],
      },
      {
        name: "Churcampa",
        districts: ["Churcampa", "Anco", "Chinchihuasi", "El Carmen", "La Merced", "Locroja", "Paucarbamba", "San Miguel de Mayocc", "San Pedro de Apo", "San Pedro de Buena Vista", "San Salvador de Quije", "San Antonio de Chuca", "Sara Sara", "Separa", "Tambobamba"],
      },
      {
        name: "Huaytará",
        districts: ["Huaytará", "Ayaví", "Córdova", "Huayacundo Arma", "Huamancaca", "Huayana", "San Antonio de Cusicancha", "San Cristóbal de Rocchenta", "San Francisco de Sangayaico", "San Isidro", "Santuario"],
      },
      {
        name: "Tayacaja",
        districts: ["Pampas", "Acostambo", "Acraquia", "Ahuaycha", "Colcabamba", "Daniel Hernández", "Huachocolpa", "Hualahuara", "Huallhua", "Huamancucho", "Huandy", "Huanzar", "Pichos", "Salcabamba", "Salcahuasi", "San Antonio de Rapaco", "San José de Quero", "San Rafael de Ocropo", "San Roque de Puembo", "Santiago de Chuco", "Santiago de Pupuja", "Santuario de Salccopampa", "Tambobamba", "Tambo", "Tantamayo", "Tintay"],
      },
    ],
  },
  {
    name: "Huánuco",
    provinces: [
      {
        name: "Huánuco",
        districts: ["Huánuco", "Amarillo del Valle", "Chinchao", "Churubamba", "Margos", "Quisqui", "San Francisco de Cayran", "San Pedro de Chaulán", "Santa María del Valle", "Yarumayo"],
      },
      {
        name: "Ambo",
        districts: ["Ambo", "Cayna", "Colpas", "Conchamarca", "Huacar", "San Francisco", "San Rafael", "Tomay Kichwa"],
      },
      {
        name: "Dos de Mayo",
        districts: ["La Unión", "Chuquis", "Marías", "Pachas", "Quivilla", "Ripán", "Shunqui", "Sillapata", "Yanas"],
      },
      {
        name: "Huacaybamba",
        districts: ["Huacaybamba", "Canchabamba", "Cochabamba", "Pinra"],
      },
      {
        name: "Huamalíes",
        districts: ["Llata", "Arancay", "Chavín de Pariarco", "Chavín de Huántar", "Daniel Alomía Robles", "Hermilio Valdizán", "Jesús de Nuevo Horizonte", "Jumbilla", "Los Orosco", "Marías", "Pindo", "Pucacolpa", "Ragash", "Sillapata", "San Juan de Rontoy"],
      },
      {
        name: "Leoncio Prado",
        districts: ["Tingo María", "Chavín de Huántar", "Daniel Alomía Robles", "Hermilio Valdizán", "Jesús de Nuevo Horizonte", "Marías", "Rupa Rupa", "San Juan de Rontoy", "San Martín de Pangoa", "Santa Rosa de Ocopa", "Santo Domingo de Anda", "Tantamayo", "Uchumayo", "Vilca"],
      },
      {
        name: "Marañón",
        districts: ["Huacrachuco", "Cholga", "Curgá", "Huallay Grande", "La Morada", "Ondo", "San Buenaventura", "San Francisco de Asís", "San Pablo de Pillao", "San Pedro de Muña", "San Antonio"],
      },
      {
        name: "Pachitea",
        districts: ["Panes", "Chinchao", "Chagllas", "Uchumayo", "Vilca"],
      },
      {
        name: "Puerto Inca",
        districts: ["Puerto Inca", "Codo del Pozuzo", "Honoria", "Tournavista", "Yuyapichis"],
      },
      {
        name: "Lauricocha",
        districts: ["Jesús", "Baños", "Jivia", "Queropalca", "Rondos", "San Francisco de Asís", "San Miguel de Cauri"],
      },
      {
        name: "Yarowilca",
        districts: ["Chavinillo", "Aparicio Pomares", "Cajacay", "Cahuac", "Chacabamba", "Chavin de Huantar", "Choras", "La Merced", "Ocho de Octubre", "Pampamarca"],
      },
    ],
  },
  {
    name: "Ica",
    provinces: [
      {
        name: "Ica",
        districts: ["Ica", "La Tinguiña", "Los Aquijes", "Ocucaje", "Pachacutec", "Parcona", "Pueblo Nuevo", "Salas", "San José de Los Molinos", "San Juan Bautista", "Santiago", "Subtanjalla", "Tate", "Yauca del Rosario"],
      },
      {
        name: "Chincha",
        districts: ["Chincha Alta", "Alto Laran", "Chavin", "Chincha Baja", "El Carmen", "Grocio Prado", "Pueblo Nuevo", "San Juan de Yanac", "San Pedro de Huacarpana", "Sunampe", "Tambo de Mora"],
      },
      {
        name: "Nazca",
        districts: ["Nazca", "Changuillo", "El Ingenio", "Marcona", "San Juan de Chorunga", "San Fernando"],
      },
      {
        name: "Palpa",
        districts: ["Palpa", "Llipata", "Río Grande", "Santa Cruz de Flores", "Tibillo", "San Rafael", "San José de Los Molinos"],
      },
      {
        name: "Pisco",
        districts: ["Pisco", "Huancano", "Humay", "Independencia", "Paracas", "San Clemente", "San Martín de Pescaderos", "Túpac Amaru Inca", "Villa Fifteen"],
      },
    ],
  },
  {
    name: "Junín",
    provinces: [
      {
        name: "Huancayo",
        districts: ["Huancayo", "Carhuacallanga", "Chacapampa", "Chicche", "Chilca", "Chongos Alto", "Chupuro", "Colca", "Cullhuas", "El Tambo", "Huacrapuquio", "Hualhuas", "Huancán", "Huancivilca", "Huarocca", "Huayucachi", "Ichu", "Jauja", "Junín", "Lacshawamayo", "Mariscal Castilla", "Matahuasi", "Mito", "Nueve de Octubre", "Orcotuna", "San José de Quero", "Santa Rosa de Ocopa", "Sapallanga", "Sicaya", "Viques"],
      },
      {
        name: "Concepción",
        districts: ["Concepción", "Aco", "Andamarca", "Chambara", "Cochas", "Comas", "Herminio Valdizán", "Jauja", "Manzanares", "Mariscal Castilla", "Matahuasi", "Mito", "Nuevo Imperial", "Ondores", "Paccha", "Quilcata", "San Agustín de Cajas", "San Jerónimo de Tunán", "San Pedro de Apulco", "San Roque de Puembo", "Santiago de Pupuja"],
      },
      {
        name: "Chanchamayo",
        districts: ["San Ramón", "Chanchamayo", "Chapaja", "Fernando Belaúnde Terry", "Junín", "Pichanaqui", "San Luis de Shuaro", "San Martín de Pangoa", "Vitoc"],
      },
      {
        name: "Chupaca",
        districts: ["Chupaca", "Ahuac", "Chongos Bajo", "Huachac", "Huamancaca", "San Juan de Jarpa", "Tres de Diciembre", "Yanacancha"],
      },
      {
        name: "Jauja",
        districts: ["Jauja", "Acolla", "Apata", "Ataura", "Canchayllo", "Curicaca", "El Mantaro", "Huamalí", "Huaripampa", "Huertas", "Janjaillo", "Junín", "Jauja", "Llocllapampa", "Mallas", "Mariscal Castilla", "Matahuasi", "Mito", "Nueve de Octubre", "Orcotuna", "Paccha", "San Gerónimo", "San Jerónimo", "San Juan de Jarpa", "San Martín de Tarma", "San Roque de Puembo", "Santiago de Chocorvos", "Santuario"],
      },
      {
        name: "Junín",
        districts: ["Junín", "Carhuamayo", "Ondores", "Ulcumayo"],
      },
      {
        name: "Satipo",
        districts: ["Satipo", "Coviriali", "Llaylla", "Mazamari", "Pampa Hermosa", "Pangoa", "Río Negro", "Río Tambo", "San Martín de Pangoa", "Vizcatan del Ene"],
      },
      {
        name: "Tarma",
        districts: ["Tarma", "Acobamba", "Acopampa", "Ambar", "Huachocolpa", "Huaricolca", "Huasahuasi", "La Unión", "Palca", "Palcamayo", "San Pedro de Cajas", "Tapio", "Tarma", "Ticapampa"],
      },
      {
        name: "Yauli",
        districts: ["La Oroya", "Chacapalpa", "Huay-Huay", "Marcapomacocha", "Morococha", "Paccha", "Santa Bárbara de Carhuacayan", "Santa Rosa de Sajcha", "Santuario de Rancay", "Sapallanga"],
      },
    ],
  },
  {
    name: "La Libertad",
    provinces: [
      {
        name: "Trujillo",
        districts: ["Trujillo", "El Porvenir", "Flores", "Huanchaco", "Laredo", "Moche", "Poroto", "Salaverry", "Simbal", "Victor Larco Herrera"],
      },
      {
        name: "Ascope",
        districts: ["Ascope", "Chicama", "Chocope", "Magdalena de Cao", "Paiján", "Rázuri", "Santiago de Cao", "Casa Grande"],
      },
      {
        name: "Bolívar",
        districts: ["Bambamarca", "Condormarca", "Longotoma", "Pacatagua", "Quiruvilca", "San Pedro de Lloc", "Santiago de Cao", "Uchumarca"],
      },
      {
        name: "Chepén",
        districts: ["Chepén", "Compaspampa", "Galponos", "Guadalupe", "Pacanga", "Pueblo Nuevo"],
      },
      {
        name: "Julcán",
        districts: ["Julcán", "Calamarca", "Carabamba", "Huaso", "Salaverry", "Santiago de Chuco"],
      },
      {
        name: "Otuzco",
        districts: ["Otuzco", "Agallpampa", "Charat", "Huanchaco", "Huarupampa", "Jaspe", "La Celia", "Las Palmas", "Llongotendo", "Mache", "Oyotún", "Pacasmayo", "Paranday", "Salpo", "Sinsicapa", "Usquillo", "Yaguamarca"],
      },
      {
        name: "Pacasmayo",
        districts: ["San Pedro de Lloc", "Guadalupe", "Jequetepeque", "Pacasmayo", "Pataz", "San José", "San Miguel", "San Pedro de Lloc", "Tayabamba", "Udima"],
      },
      {
        name: "Pataz",
        districts: ["Tayabamba", "Buldibuyo", "Chillia", "Huancaspata", "Huaylillas", "Huayo", "Ongón", "Parcoy", "Pataz", "Pías", "Santa Rosa de Chонтabamba", "Taurija", "Tres Palacios", "Venado", "Yaután"],
      },
      {
        name: "Sánchez Carrión",
        districts: ["Huamachuco", "Chugay", "Cochorco", "Curgos", "Marcabal", "Sanagorán", "Sarín", "Sartimbamba"],
      },
      {
        name: "Santiago de Chuco",
        districts: ["Santiago de Chuco", "Angasmarca", "Cachicadán", "Cajabamba", "Carabamba", "Casabamba", "Cayara", "Colpacmarca", "Combapata", "Huamachuco", "La Wiran", "Llahuán", "Quiruvilca", "Santiago de Chuco"],
      },
      {
        name: "Gran Chimú",
        districts: ["Cascas", "Lucma", "Marmot", "Sayapullo"],
      },
      {
        name: "Virú",
        districts: ["Virú", "Chao", "Guadalupito", "San Nicolás"],
      },
    ],
  },
  {
    name: "Lambayeque",
    provinces: [
      {
        name: "Chiclayo",
        districts: ["Chiclayo", "Cayaltí", "Chota", "Cumanná", "Jesús María", "José Leonardo Ortiz", "La Victoria", "Laguna", "Los Baños del Inca", "Monsefú", "Nueva Arica", "Oyotún", "Pátapo", "Picsi", "Pimentel", "Pomalca", "Pucalá", "Reque", "Sáanchez Cerro", "San José", "Saña", "Santa Rosa", "Tumán"],
      },
      {
        name: "Ferreñafe",
        districts: ["Ferreñafe", "Cañaris", "Incahuasi", "Manuel Antonio Mesones Muro", "Pitipo", "Pueblo Nuevo"],
      },
      {
        name: "Lambayeque",
        districts: ["Lambayeque", "Chaparra", "Chongoyape", "Eten", "Félix Flore", "Huamachuco", "La Victoria", "Mochumí", "Mórrope", "Motupe", "Olmos", "Pacora", "Parandas", "Salitral", "San José", "Túcume"],
      },
    ],
  },
  {
    name: "Lima",
    provinces: [
      {
        name: "Lima",
        districts: ["Ancón", "Ate", "Barranco", "Breña", "Carabayllo", "Chaclacayo", "Chorrillos", "Cieneguilla", "Comas", "El Agustino", "Independencia", "Jesús María", "Jesús del Valle", "La Molina", "La Victoria", "Lince", "Los Olivos", "Lurigancho", "Lurín", "Magdalena del Mar", "Magdalena Vieja", "Miraflores", "Pachacámac", "Pachacutec", "Punta Hermosa", "Punta Negra", "Rímac", "San Bartolo", "San Borja", "San Cayetano", "San Isidro", "San Juan de Lurigancho", "San Juan de Miraflores", "San Luis", "San Martín de Porres", "San Miguel", "Santa Anita", "Santa María del Mar", "Santa Rosa", "Santiago de Surco", "Surquillo", "Villa El Salvador", "Villa María del Triunfo"],
      },
      {
        name: "Cañete",
        districts: ["Asia", "Calango", "Cerro Azul", "Chilca", "Coayllo", "Imperial", "Lunahuaná", "Mala", "Nuevo Imperial", "Pacarán", "Quarmey", "San Antonio", "San Luis", "San Vicente de Cañete", "Santa Cruz de Flores", "Zúñiga"],
      },
      {
        name: "Huarochirí",
        districts: ["Matucana", "Antioquía", "Callahuanca", "Carampoma", "Chicla", "Cuenca", "Huachupampa", "Hualcan", "Huamantanga", "Huantar", "Langa", "Laraos", "Mangas", "Matucana", "Miculluncha", "Miraflores", "San Bartolomé de Huarochirí", "San Damián", "San Juan de Iscos", "San Juan de Tantaranche", "San Lorenzo de Quinti", "San Mateo", "San Mateo de Otao", "San Pedro de Casta", "San Pedro de Huancane", "Santiago de Ancho", "Santiago de Chocorvos", "Santiago de Punchauca", "Santo Domingo de los Olleros", "Surco"],
      },
      {
        name: "Huaral",
        districts: ["Huaral", "Atavillos Alto", "Atavillos Bajo", "Aucallama", "Chancay", "Ihuarí", "Lampián", "Pacaraos", "San Miguel de Acos", "Santa Cruz de Andamarca", "Sumbilca", "Veintisiete de Noviembre"],
      },
      {
        name: "Huaura",
        districts: ["Huacho", "Ambar", "Caleta de Carquín", "Checras", "Hualambari", "Huanchos", "Huaura", "Lechuzano", "Pacau", "San Antonio de Puway", "San Bartolo", "San Martín de Porres", "Sayán", "Vegueta"],
      },
      {
        name: "Canta",
        districts: ["Canta", "Arahuay", "Huamantanga", "Huaros", "Lachaqui", "San Buenaventura", "San Juan de Santiváñez", "Santa Rosa de Quive"],
      },
      {
        name: "Barranca",
        districts: ["Barranca", "Paramonga", "Pativilca", "Supe", "Pativilca"],
      },
      {
        name: "Oyón",
        districts: ["Oyón", "Andajes", "Caujul", "Cochamarca", "Naván", "Pachangara"],
      },
    ],
  },
  {
    name: "Loreto",
    provinces: [
      {
        name: "Maynas",
        districts: ["Iquitos", "Alto Nanay", "Fernando Lores", "Indiana", "Iquitos", "Las Amazonas", "Mazan", "Napo", "Punchana", "San Andrés del Pavo", "San Juan Bautista", "Santo Tomás", "Teniente Manuel Clavero"],
      },
      {
        name: "Alto Amazonas",
        districts: ["Yurimaguas", "Balsapuerto", "Barrancas", "Cahuapanas", "Jeberos", "Lagunas", "Manseriche", "Morona", "Pastaza", "Santos", "Tigre", "Trompeteros", "Urcumayacu"],
      },
      {
        name: "Loreto",
        districts: ["Nauta", "Belen", "Colón", "Mariana", "Punchana", "Requena", "Saquena", "Soplín", "Tabatinga", "Torres Causana", "Tigre"],
      },
      {
        name: "Mariscal Ramón Castilla",
        districts: ["Requena", "Alto Tapiche", "Capelo", "Emilio San Martín", "Maquia", "Puinahua", "Seas", "Soplín", "Tapiche", "Yaquerana"],
      },
      {
        name: "Putumayo",
        districts: ["Ramon Castilla", "Putumayo", "Rosa Panduro", "Teniente Manuel Clavero", "Yaguasyacu"],
      },
    ],
  },
  {
    name: "Madre de Dios",
    provinces: [
      {
        name: "Tambopata",
        districts: ["Puerto Maldonado", "Infierno", "La Unión", "Laberinto", "Tambopata"],
      },
      {
        name: "Manu",
        districts: ["Salvador", "Manu", "Fitzcarrald", "Madre de Dios", "Huepetuhe"],
      },
      {
        name: "Tahuamanu",
        districts: ["Iñapari", "Iberia", "Tahuamanu", "Teniente Javier Heredia"],
      },
    ],
  },
  {
    name: "Moquegua",
    provinces: [
      {
        name: "Mariscal Nieto",
        districts: ["Moquegua", "Carumas", "Cuchumbaya", "Samegua", "San Cristóbal de Calacoa", "San Martín de Tipata", "Torata"],
      },
      {
        name: "General Sánchez Cerro",
        districts: ["Omate", "Chocata", "Inclán", "Ichuña", "La Capilla", "Lloque", "Matalaque", "Omate", "Puquina", "Quinistaquillas", "Ubinas", "Yunzaba"],
      },
      {
        name: "Ilo",
        districts: ["Ilo", "El Algarrobal", "Pacocha"],
      },
    ],
  },
  {
    name: "Pasco",
    provinces: [
      {
        name: "Pasco",
        districts: ["Cerro de Pasco", "Chaupimarca", "Huachón", "Huariaca", "Huayllay", "Ninacaca", "Pallanchacra", "Páucarbamba", "San Pedro de Pillao", "Santa Ana de Tusi", "Sapallanga", "Simacocha", "Ticlacayán", "Tinyahuarco", "Vicco", "Yanacancha"],
      },
      {
        name: "Daniel Alomía Robles",
        districts: ["Huancabamba", "Alto Huancabamba", "Cuchús", "El Carmen", "La Unión", "Ocobamba", "Oyón", "Pomacocha", "San Martín de Pangoa", "Santa Rosa de Ocopa"],
      },
      {
        name: "Oxapampa",
        districts: ["Oxapampa", "Chontabamba", "Huancabamba", "Palcazú", "Pozuzo", "Puerto Bermúdez", "Villa Rica", "Vilcabamba", "Yanahuanca"],
      },
    ],
  },
  {
    name: "Piura",
    provinces: [
      {
        name: "Piura",
        districts: ["Piura", "Castilla", "Catacaos", "Cura Mori", "El Tallán", "La Arena", "La Unión", "Las Lomas", "Tambo Grande", "Veintiséis de Octubre"],
      },
      {
        name: "Ayabaca",
        districts: ["Ayabaca", "Frías", "Jilili", "Lagunas", "Monsefú", "Paita", "Paiján", "Papayal", "Sullana", "Tambalique", "Vicús"],
      },
      {
        name: "Huancabamba",
        districts: ["Huancabamba", "Canchaque", "El Carmen de la Frontera", "Huarmaca", "Lalaquiz", "San Miguel de El Faique", "Sondor", "Sondorillo"],
      },
      {
        name: "Morropon",
        districts: ["Chulucanas", "Buenos Aires", "Chalaco", "Chaval", "La Matanza", "Morropon", "Salitral", "San Juan de Bigote", "Santa Catalina de Mossa", "Santo Domingo", "Yamango"],
      },
      {
        name: "Paita",
        districts: ["Paita", "Amotape", "Arenal", "Colan", "La Huaca", "Tamarindo", "Vichayal"],
      },
      {
        name: "Sullana",
        districts: ["Sullana", "Bellavista", "Ignacio Escudero", "Lancones", "Marcavelica", "Miguel Checa", "Querecotillo", "Salitral", "San Antonio", "Cura Mori", "Las Lomas"],
      },
      {
        name: "Talara",
        districts: ["Talara", "El Alto", "La Brea", "Máncora", "Los Organos", "Negritos", "Pariñas", "Pariní", "Punta Balcones"],
      },
      {
        name: "Sechura",
        districts: ["Sechura", "Bellavista de la Unión", "Bernal", "Cristo nos Valga", "Vice", "Rinconada Llicuar", "San Pedro de Nuevo Chimbote"],
      },
    ],
  },
  {
    name: "Puno",
    provinces: [
      {
        name: "Puno",
        districts: ["Puno", "Acora", "Amantaní", "Atuncolla", "Capachica", "Chucuito", "Coata", "Catacora", "Huata", "Mañazo", "Paucarcolla", "Pichacani", "Platería", "San Antonio", "San José", "San Juan de Salinas", "Santiago de Pupuja", "Tirapata"],
      },
      {
        name: "Azángaro",
        districts: ["Azángaro", "Achaya", "Arapa", "Asillo", "Caminaca", "Chupata", "José Domingo Choquehuanca", "Munayani", "Putina", "San Antonio de Putina", "San Juan de Salinas", "San Pedro de Pillpinto", "Santiago de Pupuja", "Tirapata", "Torata"],
      },
      {
        name: "Carabaya",
        districts: ["Macusani", "Ajoyani", "Ayapata", "Coasa", "Corani", "Cruce", "Ituata", "Ollachea", "San Gabán", "San Juan de Oropicaya", "San Vicente de Pacchani", "Tincopuquio"],
      },
      {
        name: "Chucuito",
        districts: ["Chucuito", "Juli", "Palca", "Paratía", "Pomata", "San Antonio de Putina", "San Pedro de Putina", "Tinco", "Zapata"],
      },
      {
        name: "El Collao",
        districts: ["Ilave", "Capazo", "Pilahuinío", "Pomata", "San José de Chacra", "San Pedro de Pilas", "Tilata"],
      },
      {
        name: "Huancané",
        districts: ["Huancané", "Cojata", "Huatasani", "Inchupalla", "Pusupuca", "San Antonio de Tinco", "San Martín de Porres", "San Pedro de Puquimbaya", "Taraco", "Vilque Chico"],
      },
      {
        name: "Lampa",
        districts: ["Lampa", "Caballicca", "Cachas", "Cahuanuyo", "Capazo", "Ccahuancón", "Cortinapata", "Laramani", "Núñez", "Paratía", "San Bartolomé de Lampa", "San Juan de Salinas", "Santiago de Pupuja", "Tinco", "Vilavila"],
      },
      {
        name: "Melgar",
        districts: ["Juliaca", "Cabana", "Cabanilla", "Calacoto", "Caracoto", "Collana", "San Martín de Porres", "Santiago de Pupuja"],
      },
      {
        name: "Moho",
        districts: ["Moho", "Conima", "Huayrapata", "Santiago de Chuco", "Tiliviche"],
      },
      {
        name: "San Antonio de Putina",
        districts: ["San Antonio de Putina", "Ananea", "Pedro Vilca Apaza", "San Lorenzo de Quinti", "San Pedro de Pillpinto"],
      },
      {
        name: "San Román",
        districts: ["Juliaca", "Cabana", "Cabanilla", "Calacoto", "Caracoto", "San Martín de Porres"],
      },
      {
        name: "Sandia",
        districts: ["Sandia", "Cuyocuyo", "Limbani", "Patambuco", "Phara", "Quilcapuncu", "Sina", "Tinicachi", "Tupi", "Vilca"],
      },
      {
        name: "Yunguyo",
        districts: ["Yunguyo", "Anapia", "Copani", "Cuturapi", "Ollaraya", "Tinicachi"],
      },
    ],
  },
  {
    name: "San Martín",
    provinces: [
      {
        name: "Moyobamba",
        districts: ["Moyobamba", "Calzada", "Habana", "Jepelacio", "Soritor", "Yantalo"],
      },
      {
        name: "Bellavista",
        districts: ["Bellavista", "Alto Biavo", "Bajo Biavo", "Huallaga", "San Pablo"],
      },
      {
        name: "El Dorado",
        districts: ["San José de Sisa", "Agua Blanca", "San Martín", "Santa Rosa", "Shatoja"],
      },
      {
        name: "Huallaga",
        districts: ["Saposoa", "El ESLabón", "Piscoyacu", "Sacanche", "Tingo de Saposoa"],
      },
      {
        name: "Lamas",
        districts: ["Lamas", "Alonso de Alvarado", "Barranquita", "Caynarachi", "Cuñumbuqui", "Pinto Recodo", "Rumisapa", "San Roque de Cumbaza", "Shanao", "Tabalosos", "Talisayan"],
      },
      {
        name: "Mariscal Cáceres",
        districts: ["Juanjuí", "Campanilla", "Huicungo", "Pachiza", "Pajarillo"],
      },
      {
        name: "Picota",
        districts: ["Picota", "Buenos Aires", "Caspisapa", "Pilluana", "Pucacaca", "San Cristóbal de Rajamasha", "San Roque de Cumbaza", "Santiago de Chuco", "Tingo de Ponasa", "Tres Unidos"],
      },
      {
        name: "Rioja",
        districts: ["Rioja", "Elías Soplín Vargas", "Nueva Cajamarca", "Pardo Miguel", "Posic", "San Fernando", "San Juan de Lopecancha", "Santa Rosa de Lima"],
      },
      {
        name: "San Martín",
        districts: ["Tarapoto", "Alberto Leveau", "Cacatachi", "Chazuta", "Chipurana", "El Porvenir", "Huimbayoc", "Juan Guerra", "La Banda de Shilcayo", "Morales", "Papaplaya", "San Antonio", "Sauce", "Shapaja"],
      },
      {
        name: "Tocache",
        districts: ["Tocache", "Nuevo Progreso", "Polvora", "Shunte", "Uchiza"],
      },
    ],
  },
  {
    name: "Tacna",
    provinces: [
      {
        name: "Tacna",
        districts: ["Tacna", "Alto de la Alianza", "Calana", "Ciudad Nueva", "Coronel Gregorio Albarracín", "Inclán", "Jorge Basadre", "La Esperanza", "Las Chillas", "Luis Bóveda", "Macate", "Mariano Nicolás Valcarcel", "Mariscal Bentín", "San Pablo de Pillo", "Villa El Salvador", "Villa Fátima"],
      },
      {
        name: "Candarave",
        districts: ["Candarave", "Cairani", "Camilaca", "Curibaya", "Huanuara", "Quilahuani"],
      },
      {
        name: "Jorge Basadre",
        districts: ["Locumba", "Ilabaya", "Ituata", "Torata"],
      },
      {
        name: "Tarata",
        districts: ["Tarata", "Chucatamani", "Estique", "Estique-Pampa", "Horajpampa", "San Antonio de Tarata", "Santiago de Pupuja"],
      },
    ],
  },
  {
    name: "Tumbes",
    provinces: [
      {
        name: "Tumbes",
        districts: ["Tumbes", "Corrales", "El Arenal", "La Huaca", "Pampas de Hospital", "San Jacinto", "San Juan de la Virgen"],
      },
      {
        name: "Contralmirante Villar",
        districts: ["Zorritos", "Casitas", "Canoas de la Sal", "Huarucano"],
      },
      {
        name: "Zarumilla",
        districts: ["Zarumilla", "Aguas Verdes", "Papayal", "San Juan de la Frontera"],
      },
    ],
  },
  {
    name: "Ucayali",
    provinces: [
      {
        name: "Coronel Portillo",
        districts: ["Pucallpa", "Callaria", "Canaipache", "Iparía", "Manantay", "Masisea", "Nueva Requena", "San Pablo", "San Fernando", "Santa Clara", "Yarinacocha"],
      },
      {
        name: "Atalaya",
        districts: ["Atalaya", "Contraventana", "Padre Abad", "Raymondi", "Sepa", "Tupac Amaru", "Víctor Larco Herrera"],
      },
      {
        name: "Purús",
        districts: ["Esmitoreldes", "Ermelo Paucarca", "Espíritu Pampa", "Madre de Dios", "Mariscal Cáceres", "San Martín de Porres", "Santa Rosa de Purús"],
      },
    ],
  },
  {
    name: "Callao",
    provinces: [
      {
        name: "Callao",
        districts: ["Bellavista", "Callao", "Carmen de la Legua Reynoso", "La Perla", "La Punta", "Ventanilla", "Mi Perú"],
      },
    ],
  },
]
