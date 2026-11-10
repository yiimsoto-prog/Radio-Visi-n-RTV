// ==============================================================
// MÓDULO HELPERS: UTILIDADES GLOBALES, SANITIZACIÓN Y ESTADO BASE
// ==============================================================


        // ==========================================
        // UTILIDADES GLOBALES (ESCAPADO HTML, FORMATOS Y VALIDACIÓN)
        // ==========================================
        // ==========================================
        // FUNCIONES GLOBALES DE UTILIDAD Y DETECCIÓN
        // ==========================================
                function getYouTubeId(url) {
            if (!url || typeof url !== 'string') return null;
            const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|live|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
            const match = url.match(regExp);
            return (match && match[1]) ? match[1] : null;
        }
        window.getYouTubeId = getYouTubeId;
        function isPodcastVideo(url, explicitType) {
            if (explicitType === 'video') return true;
            if (explicitType === 'audio') return false;
            if (!url) return false;
            if (typeof url !== 'string') return false;
            const lower = url.toLowerCase().trim();
            if (lower.startsWith('blob:')) {
                if (window.uploadedMediaCache && window.uploadedMediaCache.has(url)) {
                    const cached = window.uploadedMediaCache.get(url);
                    if (cached && cached.type) return cached.type.startsWith('video/');
                    if (cached && cached.name) return /\.(mp4|webm|mov|mkv|m4v|avi|ogv)($|\?|#)/i.test(cached.name);
                }
            }
            if (lower.startsWith('data:video/')) return true;
            if (lower.startsWith('data:audio/')) return false;
            return lower.includes('youtube.com') ||
                   lower.includes('youtu.be') ||
                   lower.includes('vimeo.com') ||
                   lower.includes('facebook.com') ||
                   lower.includes('fb.watch') ||
                   /\.(mp4|webm|mov|mkv|m4v|avi|ogv)($|\?|#)/i.test(lower);
        }
        window.isPodcastVideo = isPodcastVideo;

        function normalizePodCategory(cat) {
            if (!cat || typeof cat !== 'string') return '';
            return cat.trim()
                      .toLowerCase()
                      .normalize("NFD")
                      .replace(/[\u0300-\u036f]/g, "");
        }
        window.normalizePodCategory = normalizePodCategory;

        async function syncDataToFirebase(data) {
            if (!firebaseDocRef || isSyncingFromCloud) return;
            try {
                // Preferir guardado shardado (excluye adminUsers del mainData público)
                if (typeof saveAppData === 'function' && !data) {
                    await saveAppData();
                    return;
                }
                const firestoreData = sanitizeDataForFirestore(data || appData);
                if (firestoreData && typeof firestoreData === 'object') {
                    delete firestoreData.adminUsers;
                    delete firestoreData.prayers;
                    delete firestoreData.visitors;
                }
                await firebaseDocRef.set(firestoreData, { merge: true });
                console.log("[Firebase Cloud] Sincronización en la nube completada exitosamente.");
                if (typeof updateCloudStatusUI === 'function') updateCloudStatusUI('connected');
            } catch (err) {
                console.warn("Aviso al guardar en Firebase:", err);
                if (typeof handleFirebaseError === 'function') {
                    handleFirebaseError(err, "sincronizar con la nube");
                }
            }
        }
        window.syncDataToFirebase = syncDataToFirebase;

        function escapeHtml(str) {
            if (str === null || str === undefined) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }
        window.escapeHtml = escapeHtml;

        /** Solo http(s); bloquea javascript:, data:, etc. */
        function safeHttpUrl(u) {
            if (u === null || u === undefined) return '';
            try {
                const x = new URL(String(u).trim(), (typeof location !== 'undefined' ? location.origin : 'https://localhost'));
                if (x.protocol === 'https:' || x.protocol === 'http:') return x.href;
            } catch (e) { /* ignore */ }
            return '';
        }
        window.safeHttpUrl = safeHttpUrl;

        function isValidPhoneNumber(phone) {
            if (!phone) return false;
            var cleaned = String(phone).replace(/[\s-]/g, '');
            return /^\+?[0-9]{7,16}$/.test(cleaned);
        }
        window.isValidPhoneNumber = isValidPhoneNumber;

        function formatYouTubeEmbedUrl(url) {
            if (!url || typeof url !== 'string') return '';
            var trimmed = url.trim();
            if (!trimmed) return '';
            if (trimmed.includes('youtube.com/embed/')) return trimmed;
            var watchMatch = trimmed.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
            if (watchMatch && watchMatch[1]) {
                return 'https://www.youtube.com/embed/' + watchMatch[1] + '?autoplay=1&rel=0';
            }
            var searchMatch = trimmed.match(/search_query=([^&]+)/i);
            if (searchMatch && searchMatch[1]) {
                return 'https://www.youtube.com/embed?listType=search&list=' + searchMatch[1] + '&autoplay=1';
            }
            return trimmed;
        }
        window.formatYouTubeEmbedUrl = formatYouTubeEmbedUrl;

        // ==========================================
        // GESTIÓN DE APARTADOS


        // ==========================================
        // LOGOS OFICIALES OPTIMIZADOS EN BASE64
        // ==========================================
        const EMBEDDED_CHURCH_LOGO = "img/logo-iglesia.jpg";
        const EMBEDDED_RADIO_LOGO = "img/logo-radio.jpg";
        window.EMBEDDED_CHURCH_LOGO = EMBEDDED_CHURCH_LOGO;
        window.EMBEDDED_RADIO_LOGO = EMBEDDED_RADIO_LOGO;

        // CADA TÍTULO DE MIS PRIMEROS PASOS CON SUS CITAS BÍBLICAS
        const defaultFirstSteps = [
            { id: 'fs1', title: 'La fe y cómo conseguirla', citation: 'Hebreos 11:1, 6; Romanos 10:17', desc: 'La fe es la certeza de lo que se espera, la convicción de lo que no se ve. Se obtiene oyendo fielmente la palabra de Dios.', mediaUrl: '' },
            { id: 'fs2', title: '¿Cómo saber que soy salvo?', citation: '1 Juan 5:11-13; Romanos 10:9-10; Efesios 2:8-9', desc: 'La salvación se obtiene por gracia mediante la fe en Jesucristo, reconociéndole como Señor y suficiente Salvador personal.', mediaUrl: '' },
            { id: 'fs3', title: 'Mis dos naturalezas', citation: 'Gálatas 5:16-17; Romanos 7:18-25; 2 Corintios 5:17', desc: 'El conflicto entre la carne y el espíritu, y cómo el Espíritu Santo nos concede la victoria diaria sobre los deseos carnales.', mediaUrl: '' },
            { id: 'fs4', title: 'El poder de Dios en mí', citation: 'Hechos 1:8; Efesios 3:20; Filipenses 4:13', desc: 'El Espíritu Santo mora en el creyente otorgando poder, sabiduría sobrenatural y denuedo para proclamar el Evangelio.', mediaUrl: '' },
            { id: 'fs5', title: 'El bautismo y la cena del Señor', citation: 'Mateo 28:19; Hechos 2:38; 1 Corintios 11:23-26', desc: 'Ordenanzas sagradas instituidas por Cristo: el bautismo en agua como testimonio público y la cena del Señor en memoria de su sacrificio redentor.', mediaUrl: '' },
            { id: 'fs6', title: 'Estar separado del mundo', citation: '2 Corintios 6:14-18; 1 Juan 2:15-17; Romanos 12:2', desc: 'Llamados a vivir en santidad y pureza, apartados de las costumbres del mundo y consagrados enteramente al servicio de Dios.', mediaUrl: '' },
            { id: 'fs7', title: 'Cómo orar', citation: 'Mateo 6:6-13; Filipenses 4:6-7; 1 Tesalonicenses 5:17', desc: 'La oración como comunión íntima y constante con nuestro Padre celestial en el nombre poderoso de nuestro Señor Jesús.', mediaUrl: '' },
            { id: 'fs8', title: 'La iglesia y la Biblia', citation: 'Hebreos 10:25; 2 Timoteo 3:16-17; Salmos 119:105', desc: 'La Iglesia como cuerpo místico de Cristo y la Biblia como la lámpara infalible de verdad, doctrina y conducta.', mediaUrl: '' },
            { id: 'fs9', title: 'Sacerdotes que adoran y sirven', citation: '1 Pedro 2:9; Apocalipsis 1:6; Juan 4:23-24', desc: 'Somos linaje escogido y real sacerdocio llamados a ofrecer sacrificios espirituales de alabanza en espíritu y en verdad.', mediaUrl: '' },
            { id: 'fs10', title: 'Cómo servir al Maestro', citation: 'Colosenses 3:23-24; Marcos 10:45; Romanos 12:11', desc: 'Servir con excelencia, corazón humilde y amor abnegado siguiendo el ejemplo perfecto de nuestro Salvador Jesucristo.', mediaUrl: '' },
            { id: 'fs11', title: 'El Señor vendrá otra vez', citation: '1 Tesalonicenses 4:16-17; Juan 14:1-3; Apocalipsis 22:20', desc: 'La gloriosa e inminente esperanza del arrebatamiento de la Iglesia y la segunda venida de Cristo con poder y gran gloria.', mediaUrl: '' },
            { id: 'fs12', title: 'Corona y recompensa', citation: '2 Timoteo 4:7-8; 1 Corintios 9:25; Apocalipsis 2:10', desc: 'Las promesas celestiales y los galardones eternos que el justo Juez tiene preparados para sus siervos fieles.', mediaUrl: '' }
        ];
        window.defaultFirstSteps = defaultFirstSteps;

        // TARJETAS DE IMAGEN DEL INICIO (EDITABLES DESDE GENERAL Y LOGOS)
        const defaultHomeBanners = [];
        window.defaultHomeBanners = defaultHomeBanners;

        const defaultAppData = {
            _version: 4,
            _lastSaved: 1800000000000,
            general: {
                churchName: "Iglesia Misionera Casa de Oración para Todas las Naciones",
                churchAcronym: "IMCOTNV",
                acronym: "IMCOTNV",
                motto: "Oración • Palabra • Misión",
                motto_qu: "Mañakuy • Simi • Misión",
                navSubtitle: "\"Predicando el Evangelio a Toda Nación\"",
                navSubtitle_qu: "\"Tukuy Suyukunaman Allin Willakuyta Willaspa\"",
                churchSubtitle: "\"Predicando el Evangelio a Toda Nación\"",
                churchSubtitle_qu: "\"Tukuy Suyukunaman Allin Willakuyta Willaspa\"",
                radioTitle: "RADIOVISIÓN RTV",
                radioSubtitle: "Ministerio Radial de IMCOTNV",
                radioSubtitle_qu: "IMCOTNV Radial Ministerio",
                heroBannerTag: "IMCOTNV • Oración • Palabra • Misión",
                heroBannerTag_qu: "IMCOTNV • Mañakuy • Simi • Misión",
                heroTitle: "Pídeme y te daré por herencia las Naciones",
                heroTitle_qu: "Mañakuway hinaspa herenciatan qosqayki nacionkunata",
                heroDesc: "Bienvenidos a la Iglesia Misionera Casa de Oración para Todas las Naciones (IMCOTNV), \"Predicando el Evangelio a Toda Nación\". Conoce nuestra congregación, participa de nuestros cultos y sintoniza la señal misionera de RadioVisión RTV.",
                heroDesc_qu: "Allin hamusqa kaychis Llapa Suyukunapaq Mañakuna Wasiman (IMCOTNV), \"Tukuy Suyukunaman Allin Willakuyta Willaspa\". Riqsiy congregacionninchikta, huñunakuykunanpi kuskachakuy hinaspa RadioVisión RTV misionera señalta uyariy.",
                logoChurch: 'img/logo-iglesia.jpg',
                logoRadio: 'img/logo-radio.jpg',
                streamUrl: 'https://stream10.usastreams.com/8014/stream',
                streamUrlQuechua: 'https://stream10.usastreams.com/8014/stream',
                radios: [
                    {
                        id: 'radiovisionrtv',
                        name: 'RadioVisión RTV',
                        subtitle: 'Señal Principal (Castellano) • 24/7',
                        desc: 'Alabanzas de Avivamiento, Alianza y la Proclamación de la Sana Doctrina las 24 horas.',
                        streamUrl: 'https://stream10.usastreams.com/8014/stream',
                        lang: 'Español'
                    },
                    {
                        id: 'radiovisionrtv-quechua',
                        name: 'RadioVisión RTV Quechua',
                        subtitle: 'Señal Misionera Quechua (Runasimi) • 24/7',
                        desc: 'Diospa Simin Qillqa • Runasimi Rimaypi Uyariychik • Apurímac suyumanta.',
                        streamUrl: 'https://stream10.usastreams.com/8014/stream',
                        lang: 'Quechua'
                    }
                ]
            },
            homeBanners: [],
            liveService: {
                title: "Culto de Avivamiento, Alabanza y Sana Doctrina",
                title_qu: "Kawsarichiy, Yupaychay Chuya Yachachikuy Huñunakuy",
                platform: "facebook",
                schedule: "Miércoles 07:00 PM • Domingos 10:00 AM y 06:00 PM",
                schedule_qu: "Miercoles 07:00 PM • Domingokuna 10:00 AM & 06:00 PM",
                forceLive: "auto",
                facebookUrl: "https://www.facebook.com/radiovisionrtv",
                youtubeUrl: "https://www.youtube.com/@radiovisionrtv2020"
            },
            firstSteps: JSON.parse(JSON.stringify(defaultFirstSteps)),
            about: {
                title: "Quiénes Somos",
                mission: "Transmitir la palabra de Dios y la sana doctrina a través de los medios radiales y digitales, llevando salvación y consolación a cada rincón del mundo.",
                vision: "Ser un faro misionero internacional, cumpliendo el mandato de llevar el Evangelio y expandiendo la voz de Jesucristo sin descanso.",
                purpose: "Edificar el cuerpo de Cristo y consolidar hogares firmes en la verdad de las Sagradas Escrituras, inspirados en el lema: Pídeme y te daré por herencia las naciones."
            },
            social: [
                { id: 'soc1', name: 'Facebook', handle: '/radiovisionrtv', url: 'https://www.facebook.com/radiovisionrtv', icon: 'fa-brands fa-facebook-f', color: 'text-blue-500', bg: 'bg-blue-600/10' },
                { id: 'soc2', name: 'YouTube', handle: '@radiovisionrtv2020', url: 'https://www.youtube.com/@radiovisionrtv2020', icon: 'fa-brands fa-youtube', color: 'text-red-500', bg: 'bg-red-600/10' },
                { id: 'soc3', name: 'Instagram', handle: '@radiovisionrtv', url: 'https://instagram.com', icon: 'fa-brands fa-instagram', color: 'text-pink-500', bg: 'bg-pink-600/10' },
                { id: 'soc4', name: 'WhatsApp Cabina', handle: '+51 932 028 894', url: 'https://wa.me/51932028894', icon: 'fa-brands fa-whatsapp', color: 'text-emerald-500', bg: 'bg-emerald-600/10' }
            ],
            programming: [
                { id: 'p1', time: '06:00 AM - 08:00 AM', days: 'Lunes a Viernes', days_qu: 'Lunesmanta Vierneskama', title: 'Devocionales y Oración en Vivo', title_qu: 'Devocional & Kawsay Mañakuy', desc: 'Devocionales diarios, oración en vivo y reflexiones basadas en las Sagradas Escrituras.', desc_qu: 'Sapa punchaw devocional, kawsaypi mañakuy hinaspa Ch\'uya Qillqakunapi yuyaymanaykuna.', host: 'Pastor Richard Edgardo Dávila Becerra', host_qu: 'Pastor Richard Edgardo Dávila Becerra' },
                { id: 'p2', time: '03:00 PM - 05:00 PM', days: 'Lunes a Sábado', days_qu: 'Lunesmanta Sabadokama', title: 'Alabanza y Adoración Continua', title_qu: 'Tukuy Tiempo Alabanza & Yupaychay', desc: 'Selección musical cristiana congregacional, coros tradicionales e instrumentales de paz.', desc_qu: 'Iñiqkunapa takinkuna, ñawpaq takikuna hawkayay instrumentalkunapas.', host: 'DJ Ministerial RTV', host_qu: 'DJ Ministerial RTV' }
            ],
            nowPlaying: {
                title: "Alabanzas de Avivamiento y Adoración",
                artist: "Ministerio Musical RadioVisión RTV",
                time: "En el aire ahora",
                type: "himno"
            },
            recentTracks: [],
            doctrines: [
                { id: 'd1', title: 'Las Sagradas Escrituras', title_qu: "Ch'uya Qillqakuna", desc: 'La Biblia es la Palabra de Dios inspirada, infalible y la única autoridad suprema en materia de fe y práctica.', desc_qu: "Bibliaqa Diospa kikin siminmi, mana pantasqa hinaspapas iñiyninchikpi kawsayninchikpi hatun kamachiq.", icon: 'fa-book-bible' },
                { id: 'd2', title: 'La Trinidad Santa', title_qu: "Kimsantin Ch'uya Dios", desc: 'Creemos inquebrantablemente en un solo Dios eterno, existente en tres personas coiguales y coeternas: Padre, Hijo y Espíritu Santo.', desc_qu: "Huklla Diosllapim iñinchik, kimsantin personakunapi: Yaya, Churi hinaspa Santo Espiritu.", icon: 'fa-shield-halved' },
                { id: 'd3', title: 'La Salvación en Cristo', title_qu: 'Cristopi Qespikuy', desc: 'La salvación es un regalo inmerecido recibido por la fe en Jesucristo, quien murió en la cruz y resucitó para nuestra justificación.', desc_qu: "Qespikuyqa Diospa gratis qokuyninmi, Jesucristopa cruzpi wañusqanpi kawsarimusqanpipas iñispa chaskisqa.", icon: 'fa-cross' },
                { id: 'd4', title: 'El Espíritu Santo', title_qu: 'Santo Espiritu', desc: 'Su obra regeneradora en el creyente, sellando nuestras vidas y dotándonos de dones espirituales para el testimonio y el servicio.', desc_qu: "Paymi iñiqkunapa sonqonpi musuq kawsayta qun, kawsayninchikta sellan hinaspa donkunata qun llamk'ananchikpaq.", icon: 'fa-dove' }
            ],
            information: {
                events: [],
                cults: [],
                annexes: [],
                missionary: [],
                gallery: []
            },
            podcasts: [],
            prayers: [],
            testimonials: [],
            pastors: [
                {
                    id: 'pas1',
                    category: 'principal',
                    name: 'Pastor Richard Edgardo Dávila Becerra',
                    role: 'Pastor Principal & Director General',
                    role_qu: 'Hatun Pastor & Director General',
                    photo: 'img/logo-iglesia.jpg',
                    bio: 'Llamado por Dios para pastorear la Casa de Oración para Todas las Naciones (IMCOTNV), predicar la sana doctrina y proclamar la salvación en Cristo a todas las naciones.',
                    bio_qu: 'Diospa qayasqan llapa Suyukunapaq Mañakuna Wasi (IMCOTNV) pastoreananpaq, chuya yachachikuyta willananpaq hinaspa Cristopi qespikuyta llapa suyukunaman willananpaq.',
                    favoriteVerse: 'Salmos 2:8 - "Pídeme, y te daré por herencia las naciones..."',
                    favoriteVerse_qu: 'Salmos 2:8 - "Mañakuway, hinaspan herenciatan qosqayki nacionkunata..."'
                },
                {
                    id: 'pas2',
                    category: 'pastora',
                    name: 'Pastora Elena Sumalave Torres',
                    role: 'Pastora & Líder de Ministerio Femenil y Familia',
                    role_qu: 'Pastora & Warmikunapa Ayllukunapa Umalliqnin',
                    photo: 'img/logo-iglesia.jpg',
                    bio: 'Dedicada a la intercesión, la edificación de las familias, la consejería bíblica para matrimonios y el fortalecimiento espiritual en la Casa de Oración para Todas las Naciones (IMCOTNV).',
                    bio_qu: 'Mañakuypi, ayllukuna kallpachaypi, casado kaqkunapaq biblia yuyaychaypi hinaspa llapa Suyukunapaq Mañakuna Wasipi (IMCOTNV) espiritupi kallpachaypi llamk\'aq.',
                    favoriteVerse: 'Proverbios 31:30 - "...la mujer que teme a Jehová, esa será alabada."',
                    favoriteVerse_qu: 'Proverbios 31:30 - "...Jehová Diosta manchakuq warmin ichaqa yupaychasqa kanqa."'
                }
            ],
            cultoCentral: {
                schedules: [
                    { id: 'cc1', type: 'dominical', title: 'Culto Dominical de Celebración', title_qu: 'Kawsarichiy & Hawkayay Huñunakuy', time: 'Domingos 10:00 AM y 06:00 PM', time_qu: 'Domingokuna 10:00 AM & 06:00 PM', desc: 'Servicio principal de adoración congregacional, alabanzas en vivo y mensaje transformador.', desc_qu: 'Llapa iñiqkuna huñusqa yupaychana servicio, kawsay takikuna hinaspa simi willakuy.', icon: 'fa-church' },
                    { id: 'cc2', type: 'oracion', title: 'Culto de Oración y Sanidad', title_qu: 'Mañakuy & Allinyachiy Huñunakuy', time: 'Miércoles 07:00 PM', time_qu: 'Miercoles 07:00 PM', desc: 'Clamor ferviente por los enfermos, liberación, intercesión y milagros de Dios.', desc_qu: 'Unqusqakunapaq qapariy mañakuy, kacharichiy, Diospa milagronkuna.', icon: 'fa-hands-praying' },
                    { id: 'cc3', type: 'escuela', title: 'Escuela Bíblica de Crecimiento', title_qu: 'Wiñaypaq Biblia Yachay Wasi', time: 'Domingos 08:30 AM', time_qu: 'Domingokuna 08:30 AM', desc: 'Clases bíblicas sistemáticas para niños, adolescentes, jóvenes y adultos.', desc_qu: 'Wawakunapaq, waynakunapaq, sipaskunapaq, machukunapaqpas biblia yachaykuna.', icon: 'fa-book-bible' },
                    { id: 'cc4', type: 'jovenes', title: 'Reunión de Jóvenes', title_qu: 'Waynakunapa Huñunakuynin', time: 'Sábados 06:30 PM', time_qu: 'Sabadokuna 06:30 PM', desc: 'Adoración juvenil, dinámicas, palabra viva y compañerismo en el Espíritu Santo.', desc_qu: 'Waynakunapa yupaychaynin, kawsay simi hinaspa Santo Espiritupi hukllawakuy.', icon: 'fa-fire' }
                ],
                calendar: [
                    { day: 'Miércoles', event: 'Culto de Clamor y Sanidad Divina', event_qu: 'Qapariy Mañakuy & Allinyachiy Huñunakuy', time: '07:00 PM (Templo & En Vivo)', time_qu: '07:00 PM (Templo & Kawsaypi)', host: 'Pastor Richard Edgardo Dávila Becerra', host_qu: 'Pastor Richard Edgardo Dávila Becerra' },
                    { day: 'Sábado', event: 'Reunión Juvenil & Ensayos de Alabanza', event_qu: 'Waynakunapa Huñunakuynin & Yupaychay Ensayo', time: '06:30 PM', time_qu: '06:30 PM', host: 'Líderes Juveniles', host_qu: 'Waynakunapa Umalliqninkuna' },
                    { day: 'Domingo', event: 'Escuela Bíblica (8:30 AM) & Cultos de Celebración (10:00 AM y 06:00 PM)', event_qu: 'Biblia Yachay Wasi (8:30 AM) & Yupaychay Huñunakuykuna (10:00 AM & 06:00 PM)', time: '10:00 AM y 06:00 PM', time_qu: '10:00 AM & 06:00 PM', host: 'Pastores y Congregación', host_qu: 'Pastorkuna & Congregación' }
                ]
            },
            events: [],
            sedes: {
                central: {
                    name: 'Sede Central Challhuahuacho',
                    badge: 'Sede Principal',
                    address: '03000, Challhuahuacho 03261, Apurímac, Perú',
                    responsible: 'Pastor Principal Richard Edgardo Dávila Becerra y Pastora Elena Sumalave Torres',
                    schedules: 'Miércoles 07:00 PM • Sábados 06:30 PM • Domingos 10:00 AM y 06:00 PM',
                    whatsapp: '+51932028894',
                    mapsUrl: 'https://maps.google.com/?q=03000,+Challhuahuacho+03261,+Apurimac,+Peru',
                    photo: 'img/templo-central.jpg'
                },
                anexos: []
            },
            missionary: {
                stats: {
                    communities: '28+ Comunidades',
                    bibles: '5,000+ Biblias',
                    annexes: '8 Anexos Plantados',
                    volunteers: '45+ Obreros en Campo'
                },
                campaigns: [],
                testimonies: [],
                futureProjects: [
                    { title: 'Cruzada Misionera Región Apurímac', desc: 'Alcanzar nuevas comunidades alejadas con brigadas y conferencias bíblicas.' },
                    { title: 'Construcción de Templos Anexos', desc: 'Levantar santuarios techados para congregar a los hermanos en comunidades.' }
                ]
            },
            ministries: [
                { id: 'min1', name: 'Ministerio Infantil - Semillitas de Fe', category: 'infantil', leader: 'Pastora Elena Sumalave Torres', time: 'Domingos 10:00 AM', verse: 'Proverbios 22:6', desc: 'Instrucción bíblica didáctica, memorización de textos sagrados y valores cristianos para edificar vidas desde la tierna infancia.', icon: 'fa-children', color: 'from-amber-500 to-yellow-600' },
                { id: 'min2', name: 'Ministerio de Alabanza y Adoración', category: 'alabanza', leader: 'DJ Ministerial RTV & Coro Central', time: 'Viernes 06:00 PM (Ensayo)', verse: 'Salmos 150:6', desc: 'Adoración congregacional en espíritu y en verdad, combinando coros de avivamiento y alabanzas solemnes.', icon: 'fa-guitar', color: 'from-purple-500 to-indigo-600' },
                { id: 'min3', name: 'Ministerio de Intercesión y Oración', category: 'intercesion', leader: 'Pastora Elena Sumalave Torres', time: 'Miércoles y Madrugadas', verse: 'Jeremías 33:3', desc: 'Clamor constante por las familias, los enfermos y respaldando a los pastores y las misiones.', icon: 'fa-hands-praying', color: 'from-emerald-500 to-teal-600' }
            ],
            bibleSchool: {
                firstSteps: [
                    { id: 'bs1', title: 'La Salvación', citation: 'Romanos 10:9-10', desc: 'El regalo inmerecido de la vida eterna mediante el arrepentimiento y la fe en Jesucristo.', icon: 'fa-cross' },
                    { id: 'bs2', title: 'La Fe en Dios', citation: 'Hebreos 11:1,6', desc: 'La certeza de lo que se espera, la convicción de lo que no se ve; clave para agradar a Dios.', icon: 'fa-shield-halved' },
                    { id: 'bs3', title: 'El Bautismo en Aguas', citation: 'Mateo 28:19', desc: 'Paso de obediencia pública donde testificamos que morimos al pecado y resucitamos con Cristo.', icon: 'fa-water' },
                    { id: 'bs4', title: 'La Oración Eficaz', citation: 'Filipenses 4:6-7', desc: 'Comunión íntima diaria con el Padre celestial donde encontramos paz y respuestas.', icon: 'fa-hands-praying' },
                    { id: 'bs5', title: 'El Espíritu Santo', citation: 'Hechos 1:8', desc: 'El Consolador divino que nos bautiza con poder y nos capacita para ser testigos fieles.', icon: 'fa-dove' }
                ],
                christianFormation: [
                    { id: 'fc1', title: 'Discipulado Bíblico', citation: '2 Timoteo 2:2', desc: 'Proceso de madurez espiritual para convertirnos en imitadores de Cristo y maestros de otros.', icon: 'fa-book-open-reader' },
                    { id: 'fc2', title: 'Liderazgo de Siervo', citation: 'Marcos 10:44-45', desc: 'Principios de humildad, carácter intachable y entrega sacrificial para guiar la obra de Dios.', icon: 'fa-chess-king' },
                    { id: 'fc3', title: 'Evangelismo Personal', citation: 'Marcos 16:15', desc: 'Herramientas y métodos prácticos para testificar el amor de Cristo a familiares y vecinos.', icon: 'fa-bullhorn' }
                ]
            },
            announcers: [
                { id: 'loc1', name: 'Pastor Richard Edgardo Dávila Becerra', show: 'La Voz Misionera', show_qu: 'Misionera Rimay', time: 'Domingos 08:00 AM y Lunes 07:00 PM', time_qu: 'Domingokuna 08:00 AM & Lunes 07:00 PM', role: 'Director General', role_qu: 'Llapan Umalliq', photo: 'img/logo-iglesia.jpg' },
                { id: 'loc4', name: 'DJ Ministerial RTV', show: 'Alabanza y Adoración Continua', show_qu: 'Tukuy Tiempo Alabanza & Yupaychay', time: 'Lunes a Sábado 03:00 PM - 05:00 PM', time_qu: 'Lunesmanta Sabadokama 03:00 PM - 05:00 PM', role: 'Música y Transmisión', role_qu: 'Taki & Willaykuna', photo: 'img/logo-radio.jpg' }
            ],
            visitors: [],
            churchLocation: {
                address: '03000, Challhuahuacho 03261, Apurímac, Perú',
                phone: '+51932028894',
                whatsapp: '+51932028894',
                hours: 'Lunes a Viernes de 09:00 AM a 01:00 PM • Cultos: Miércoles 7 PM, Sábados 6:30 PM, Domingos 10 AM y 6 PM',
                mapsQuery: 'Challhuahuacho, Apurimac, Peru',
                mapsEmbedUrl: 'https://maps.google.com/maps?q=Challhuahuacho,%20Cotabambas,%20Apurimac,%20Peru&t=&z=15&ie=UTF8&iwloc=&output=embed'
            },
            firebaseConfig: {
                apiKey: "AIzaSyA_QwdOdhREsaEWsSZ0YvAwSndwlbjolw8",
                authDomain: "radiovision-rtv-327c3.firebaseapp.com",
                projectId: "radiovision-rtv-327c3",
                storageBucket: "radiovision-rtv-327c3.firebasestorage.app",
                messagingSenderId: "1069672953293",
                appId: "1:1069672953293:web:4d073499dad4a5ba850084"
            }
        };
        let appData = JSON.parse(JSON.stringify(defaultAppData));
        if (!appData.general.logoChurch || appData.general.logoChurch.includes('WhatsApp Image')) { appData.general.logoChurch = 'img/logo-iglesia.jpg'; }
        if (!appData.general.logoRadio || appData.general.logoRadio.includes('WhatsApp Image')) { appData.general.logoRadio = 'img/logo-radio.jpg'; }
        window.appData = appData;


        // Validación de límites de archivos multimedia (Hallazgo 5: Imagen 2MB, Audio 20MB, Video 150MB, Docs 25MB)
        function validateMediaFileSize(file, customType = null) {
            if (!file) return { valid: false, error: "No se seleccionó ningún archivo." };
            const maxImg = 2 * 1024 * 1024;     // 2 MB
            const maxAudio = 20 * 1024 * 1024;   // 20 MB
            const maxVideo = 150 * 1024 * 1024;  // 150 MB
            const maxDoc = 25 * 1024 * 1024;     // 25 MB

            const mime = (file.type || '').toLowerCase();
            const name = (file.name || '').toLowerCase();

            if (customType === 'image' || mime.startsWith('image/')) {
                if (file.size > maxImg) {
                    return { valid: false, error: `La imagen supera el límite recomendado de 2 MB (tamaño actual: ${(file.size / (1024 * 1024)).toFixed(1)} MB). Por favor optimice la imagen o elija una menor a 2 MB.` };
                }
            } else if (customType === 'video' || mime.startsWith('video/') || /\.(mp4|webm|mov|mkv|avi)$/i.test(name)) {
                // Sin restricción de MB para videos: se admiten videos de cualquier tamaño
                return { valid: true };
            } else if (customType === 'audio' || mime.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac)$/i.test(name)) {
                if (file.size > maxAudio) {
                    return { valid: false, error: `El archivo de audio supera el límite de 20 MB (tamaño actual: ${(file.size / (1024 * 1024)).toFixed(1)} MB).` };
                }
            } else if (file.size > maxDoc) {
                return { valid: false, error: `El documento supera el límite de 25 MB (tamaño actual: ${(file.size / (1024 * 1024)).toFixed(1)} MB).` };
            }
            return { valid: true };
        }
        window.validateMediaFileSize = validateMediaFileSize;

        // Compresión automática de imágenes mediante Canvas HTML5
        function compressImageFile(file, maxWidth = 1200, maxHeight = 1200, quality = 0.82) {
            return new Promise((resolve, reject) => {
                if (!file || !file.type || !file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = e => resolve(e.target.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                    return;
                }

                const reader = new FileReader();
                reader.onload = function(e) {
                    const img = new Image();
                    img.onload = function() {
                        let width = img.width;
                        let height = img.height;

                        if (width > maxWidth || height > maxHeight) {
                            if (width / height > maxWidth / maxHeight) {
                                height = Math.round((height * maxWidth) / width);
                                width = maxWidth;
                            } else {
                                width = Math.round((width * maxHeight) / height);
                                height = maxHeight;
                            }
                        }

                        const canvas = document.createElement('canvas');
                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);

                        // Si es PNG con transparencia y tamaño menor a 300KB, preservar original
                        if (file.type === 'image/png' && file.size < 300000) {
                            resolve(e.target.result);
                            return;
                        }

                        const compressed = canvas.toDataURL('image/jpeg', quality);
                        resolve(compressed);
                    };
                    img.onerror = () => resolve(e.target.result);
                    img.src = e.target.result;
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        }
        window.compressImageFile = compressImageFile;

        async function handleLogoUpload(e, type) {
            const file = e.target.files && e.target.files[0];
            if (!file) return;

            const val = validateMediaFileSize(file, 'image');
            if (!val.valid) {
                showToast(val.error, "error");
                e.target.value = '';
                return;
            }

            try {
                showToast("Optimizando logotipo...");
                const result = await compressImageFile(file, 600, 600, 0.88);
                if (!appData.general) appData.general = {};
                if (type === 'church') {
                    appData.general.logoChurch = result;
                    const prev = document.getElementById('adminPreviewChurchLogo');
                    if (prev) prev.src = result;
                    const navLogo = document.getElementById('navLogoChurch');
                    if (navLogo) navLogo.src = result;
                } else if (type === 'radio') {
                    appData.general.logoRadio = result;
                    const prev = document.getElementById('adminPreviewRadioLogo');
                    if (prev) prev.src = result;
                    const navLogo = document.getElementById('navLogoRadio');
                    if (navLogo) navLogo.src = result;
                }
                await saveAppData();
                showToast("✓ Logotipo actualizado y optimizado correctamente", "info");
            } catch (err) {
                console.error("Error optimizando logo", err);
                const reader = new FileReader();
                reader.onload = async function(evt) {
                    const result = evt.target.result;
                    if (!appData.general) appData.general = {};
                    if (type === 'church') {
                        appData.general.logoChurch = result;
                        const prev = document.getElementById('adminPreviewChurchLogo');
                        if (prev) prev.src = result;
                        const navLogo = document.getElementById('navLogoChurch');
                        if (navLogo) navLogo.src = result;
                    } else if (type === 'radio') {
                        appData.general.logoRadio = result;
                        const prev = document.getElementById('adminPreviewRadioLogo');
                        if (prev) prev.src = result;
                        const navLogo = document.getElementById('navLogoRadio');
                        if (navLogo) navLogo.src = result;
                    }
                    await saveAppData();
                    showToast("✓ Logotipo actualizado correctamente", "info");
                };
                reader.readAsDataURL(file);
            }
        }
        window.handleLogoUpload = handleLogoUpload;

        function detectMediaUrlType(val) {
            const status = document.getElementById('uploadAudioStatus');
            if (!status) return;
            if (!val || !val.trim()) {
                status.classList.add('hidden');
                return;
            }
            status.classList.remove('hidden');
            const isVid = (typeof isPodcastVideo === 'function') ? isPodcastVideo(val) : /\.(mp4|webm|mov|mkv)/i.test(val);
            status.textContent = isVid ? "✓ Enlace de Video detectado y listo" : "✓ Enlace de Audio detectado y listo";
        }
        window.detectMediaUrlType = detectMediaUrlType;

        // ==============================================================
        // MASTER FALLBACK Y PROTECCIÓN ANTI-TAMPERING DE STREAMING RADIAL
        // Impide que nadie pueda borrar, vaciar o desviar la señal de radio
        // ==============================================================
        const SECURE_OFFICIAL_STREAMS = Object.freeze({
            primary: 'https://stream10.usastreams.com/8014/stream',
            quechua: 'https://stream10.usastreams.com/8014/stream'
        });

        function getValidatedStreamUrl(customUrl, stationKey = 'primary') {
            const fallback = SECURE_OFFICIAL_STREAMS[stationKey] || SECURE_OFFICIAL_STREAMS.primary;
            if (!customUrl || typeof customUrl !== 'string') return fallback;
            const trimmed = customUrl.trim();
            if (!trimmed || trimmed === '') return fallback;
            // Validar que comience estrictamente por HTTP o HTTPS
            if (!/^https?:\/\//i.test(trimmed)) return fallback;
            // Bloquear inyecciones de código malicioso, scripts o URIs de datos
            if (/^(javascript|data|blob|file):/i.test(trimmed)) return fallback;
            return trimmed;
        }

        window.SECURE_OFFICIAL_STREAMS = SECURE_OFFICIAL_STREAMS;
        window.getValidatedStreamUrl = getValidatedStreamUrl;


// ==============================================================
// MÓDULO I18N: INTERNACIONALIZACIÓN (ESPAÑOL & QUECHUA SUREÑO)
// ==============================================================

const I18N_TRANSLATIONS = {
    es: {
        // Navegación
        'nav.motto': 'Oración • Palabra • Misión',
        'nav.church_name': 'Iglesia Misionera Casa de Oración para Todas las Naciones',
        'nav.subtitle': '"Predicando el Evangelio a Toda Nación"',
        'nav.search_placeholder': 'Buscar en toda la web...',
        'nav.search_btn': 'Buscar',
        'nav.install_app': 'Instalar App',
        'nav.install_app_mob': 'Instalar App en tu Celular',
        'nav.live_radio': 'Radio en Vivo',
        'nav.inicio': 'Inicio',
        'nav.nosotros': 'Nosotros & Pastores',
        'nav.culto_vivo': 'Culto en Vivo',
        'nav.radio_nav': 'Radio en Vivo',
        'nav.biblia': 'Biblia',
        'nav.sedes': 'Sedes',
        'nav.testimonios': 'Testimonios',
        'nav.oracion': 'Oración',
        'nav.soy_nuevo': 'Soy Nuevo',
        'nav.mas': 'Más',
        'nav.mas_secciones': 'Más Secciones',
        'nav.eventos': 'Cultos & Eventos',
        'nav.misionero': 'Avance Misionero',
        'nav.ministerios': 'Ministerios & Escuela',
        'nav.galeria': 'Galería Multimedia',
        'nav.biblioteca': 'Biblioteca Cristiana',
        'nav.theme_dark': 'Modo Oscuro (Noche)',
        'nav.theme_change': 'Cambiar Color',
        'nav.admin_access': 'Acceso Administrativo',
        'nav.language_title': 'Idioma / Simi:',

        // Hero (Página de Inicio)
        'hero.banner_tag': 'IMCOTNV • Oración • Palabra • Misión',
        'hero.church_name': 'Iglesia Misionera Casa de Oración para Todas las Naciones',
        'hero.church_subtitle': '"Predicando el Evangelio a Toda Nación"',
        'hero.radio_subtitle': 'Ministerio Radial de IMCOTNV',
        'hero.main_title_1': 'Pídeme y te daré por herencia',
        'hero.main_title_highlight': 'las Naciones',
        'hero.main_desc': 'Bienvenidos a la Iglesia Misionera Casa de Oración para Todas las Naciones (IMCOTNV), "Predicando el Evangelio a Toda Nación". Conoce nuestra congregación, participa de nuestros cultos y sintoniza la señal misionera de RadioVisión RTV.',
        'hero.listen_live': 'Escuchar Señal en Vivo',
        'hero.watch_live': 'Ver Culto en Vivo',
        'hero.new_here': '¿Eres nuevo por aquí? Visítanos',
        'hero.send_prayer': '¿Necesitas oración? Escríbenos',
        'hero.active_broadcast': 'Transmisión Radial Activa',
        'hero.default_show': 'Culto de Avivamiento y Sana Doctrina',
        'hero.live_now': 'EN VIVO',
        'hero.verse_tag': 'Palabra y Promesa para Hoy',
        'hero.verse_subtitle': 'Alimento Espiritual Diario',
        'hero.pastoral_reflection': 'Reflexión Pastoral:',
        'hero.read_in_bible': 'Leer en la Biblia',

        // Reproductor Flotante
        'player.title': 'Reproductor RTV',
        'player.playing': 'Reproduciendo contenido',
        'player.online': 'Señal en Línea',
        'player.reconnect_notice': 'Señal pausada o interrumpida.',
        'player.reconnect_btn': 'Reconectar señal aquí',

        // Sección: Nosotros & Pastores
        'about.back_home': 'Volver al Inicio',
        'about.section_badge': 'Nosotros & Pastores • IMCOTNV • Casa de Oración para Todas las Naciones',
        'about.lead_tag': 'Siervos Ungidos para Guiar el Rebaño',
        'about.lead_title': 'Pastores y Liderazgo Ministerial',
        'about.lead_desc': 'Hombres y mujeres de Dios consagrados al servicio de la obra, la enseñanza bíblica y el pastoreo de las familias.',
        'about.filter_all': 'Todos',
        'about.filter_principal': 'Pastor Principal',
        'about.filter_pastora': 'Pastora',
        'about.filter_team': 'Equipo Ministerial',
        'about.filter_leaders': 'Líderes de Ministerios',
        'about.identity_tag': 'Identidad, Fe y Propósito Eterno',
        'about.who_we_are': 'Quiénes Somos',
        'about.who_we_are_desc': 'Conoce la historia, los principios doctrinales y la visión misionera que guía a la Casa de Oración para Todas las Naciones (IMCOTNV) y su ministerio radial RadioVisión RTV.',
        'about.our_history_tag': 'Nuestra Historia',
        'about.our_history_title': 'Nacidos para Pregonar las Buenas Nuevas',
        'about.history_p1': 'La Casa de Oración para Todas las Naciones (IMCOTNV) y su ministerio radial RadioVisión RTV nacieron por una convicción profunda en el corazón de siervos de Dios que entendieron el llamado apostólico y profético de nuestro tiempo: "Pídeme y te daré por herencia las naciones" (Salmos 2:8). Con el lema "Oración • Palabra • Misión", desde la provincia de Cotabambas, Challhuahuacho, Dios levantó este altar de adoración y proclamación de la verdad.',
        'about.history_p2': 'A través de cultos llenos de la presencia del Espíritu Santo, la apertura de anexos en comunidades nativas y altoandinas, y la emisión radial ininterrumpida las 24 horas del día, miles de familias han sido alcanzadas, consoladas y restauradas para la gloria de Jesucristo.',
        'about.stat_radio': 'Señal Radial Continua',
        'about.stat_communities': 'Comunidades de Alcance',
        'about.stat_annexes': 'Sedes y Anexos',
        'about.stat_doctrine': 'Sana Doctrina Bíblica',
        'about.mission_title': 'Nuestra Misión',
        'about.mission_desc': 'Transmitir la palabra de Dios y la sana doctrina a través de los medios radiales y digitales, llevando salvación, sanidad y consolación a cada rincón de la tierra.',
        'about.vision_title': 'Nuestra Visión',
        'about.vision_desc': 'Ser un faro misionero internacional inamovible, cumpliendo el mandato de la Gran Comisión y expandiendo la voz de Jesucristo sin descanso hasta el fin.',
        'about.values_title': 'Nuestros Valores',
        'about.values_desc': 'Fidelidad innegociable a la Biblia, comunión fraternal en amor, santidad de vida, pasión misionera por las almas perdidas y transparencia ministerial.',
        'about.pillars_tag': 'Pilares Ministeriales',
        'about.pillars_title': 'Las 5 Columnas de la Conquista (Efesios 4:11)',
        'about.pillars_desc': 'Sostenidos firmemente bajo la roca inmutable de JESUCRISTO.',
        'about.col_apostles': 'APÓSTOLES',
        'about.col_apostles_sub': 'Gobierno y Expansión',
        'about.col_prophets': 'PROFETAS',
        'about.col_prophets_sub': 'Revelación y Guía',
        'about.col_evangelists': 'EVANGELISTAS',
        'about.col_evangelists_sub': 'Cosecha de Almas',
        'about.col_pastors': 'PASTORES',
        'about.col_pastors_sub': 'Cuidado del Rebaño',
        'about.col_teachers': 'MAESTROS',
        'about.col_teachers_sub': 'Doctrina y Enseñanza',

        // Sección: Cultos & Eventos
        'events.reunions_tag': 'Reuniones Congregacionales en el Templo',
        'events.main_title': 'Culto Central & Horarios',
        'events.main_desc': 'Te esperamos en la Casa de Dios para alabar, recibir sana doctrina y ser ministrados con poder.',
        'events.dominical_tag': 'Día de Celebración',
        'events.dominical_title': 'Culto Dominical',
        'events.dominical_time': 'Domingos 10:00 AM y 06:00 PM',
        'events.dominical_desc': 'Alabanza viva, adoración en el Espíritu Santo, testimonios y predicación ungida de la Palabra de Dios para toda la familia.',
        'events.watch_live': 'Ver en Directo',
        'events.prayer_tag': 'Noche de Milagros',
        'events.prayer_title': 'Culto de Oración',
        'events.prayer_time': 'Miércoles 07:00 PM',
        'events.prayer_desc': 'Guerra espiritual, clamor por sanidades físicas, restauración matrimonial y liberación de ataduras en el nombre de Jesús.',
        'events.send_request': 'Enviar Petición',
        'events.school_tag': 'Instrucción Bíblica',
        'events.school_title': 'Escuela Bíblica',
        'events.school_time': 'Domingos 08:30 AM',
        'events.school_desc': 'Clases divididas para niños, jóvenes y adultos. Crecimiento sistemático en la doctrina apostólica y las Escrituras.',
        'events.view_syllabus': 'Ver Temario',
        'events.youth_tag': 'Juventud en Victoria',
        'events.youth_title': 'Reunión de Jóvenes',
        'events.youth_time': 'Sábados 06:30 PM',
        'events.youth_desc': 'Adoración juvenil apasionada, dinámicas edificantes, consejos prácticos para jóvenes y comunión fraterna.',
        'events.youth_btn': 'Ministerio Juvenil',
        'events.calendar_tag': 'Programa Semanal Completo',
        'events.calendar_title': 'Calendario Visible de Actividades',
        'events.how_to_get': '¿Cómo Llegar a la Iglesia?',
        'events.table_day': 'Día',
        'events.table_activity': 'Actividad / Servicio',
        'events.table_time': 'Horario',
        'events.table_location': 'Lugar / Encargado',
        'events.table_action': 'Acción',

        // Sección: Sedes & Ubicación
        'sedes.annexes_btn': 'Ver Anexos Regionales',
        'sedes.expansion_tag': 'Puntos de Adoración & Expansión Regional',
        'sedes.main_title': 'Nuestras Sedes y Ubicación',
        'sedes.main_desc': 'Visítanos en nuestra Sede Central en Challhuahuacho o ubica el anexo más cercano a tu hogar.',
        'sedes.central_badge': 'Sede Central Principal & Canales Oficiales',
        'sedes.central_name': 'Sede Central Challhuahuacho',
        'sedes.main_address': 'Dirección Principal',
        'sedes.responsible_pastors': 'Pastores Responsables',
        'sedes.booth_phone': 'Teléfono Cabina',
        'sedes.direct_wa': 'WhatsApp Directo',
        'sedes.cult_schedules': 'Horarios de Cultos Presenciales',
        'sedes.open_gps': 'Abrir Navegación GPS (Google Maps)',
        'sedes.notify_wa': 'Avisar mi Visita por WhatsApp',
        'sedes.regional_annexes': 'Anexos y Casas de Oración Regionales',
        'sedes.empty_title': 'Próximamente Nuevos Anexos',
        'sedes.empty_desc': 'Los anexos y lugares de reunión en comunidades se publicarán muy pronto.',
        'prayers.empty_msg': 'Aún no hay peticiones recientes. ¡Envía la tuya arriba!',
        'testimonials.empty_msg': 'No hay testimonios en esta categoría por ahora.',

        // Sección: Avance Misionero & Escuela
        'mission.tag': 'Pídeme y te daré por herencia las Naciones',
        'mission.title': 'Avance Misionero',
        'mission.desc': 'Impacto evangelístico, apertura de nuevos campos misioneros y testimonios de transformación en las comunidades.',
        'mission.stat_evangelized': 'Comunidades Evangelizadas',
        'mission.stat_bibles': 'Biblias & Tratados Entregados',
        'mission.stat_annexes': 'Anexos Establecidos',
        'mission.stat_workers': 'Misioneros & Obreros en Campo',
        'mission.campaigns_title': 'Campañas Evangelísticas y Viajes de Misión',
        'mission.field_testimonies': 'Testimonios de Campo',
        'mission.future_projects': 'Proyectos Futuros de Conquista',
        'ministries.body_tag': 'Cuerpo de Cristo en Acción',
        'ministries.main_title': 'Nuestros Ministerios',
        'ministries.main_desc': 'Espacios dedicados al servicio, edificación y crecimiento espiritual de cada miembro de la congregación.',
        'school.spiritual_growth': 'Crecimiento Espiritual & Sana Doctrina',
        'school.main_title': 'Escuela Bíblica',
        'school.main_desc': 'Fundamentos esenciales para nuevos convertidos y capacitación para obreros del Señor.',
        'school.tab_steps': 'Mis Primeros Pasos',
        'school.tab_formation': 'Formación Cristiana',
        'school.tab_doctrines': 'Doctrinas Bíblicas',
        'school.steps_title': 'Mis Primeros Pasos en Cristo',
        'school.steps_sub': 'Los 5 cimientos que todo creyente debe conocer y practicar (Salvación, Fe, Bautismo, Oración, Espíritu Santo).',
        'school.formation_title': 'Formación Cristiana & Discipulado',
        'school.formation_sub': 'Capacitación avanzada para servir y liderar conforme al corazón de Dios (Discipulado, Liderazgo, Evangelismo).',
        'school.doctrines_title': 'Doctrinas Fundamentales Inmutables',
        'school.doctrines_sub': 'Pilares teológicos irrenunciables de nuestra fe bíblica.',

        // Sección: RadioVisión RTV
        'radio.two_stations_tag': 'Dos Emisoras Oficiales de Radio • Transmitiendo las 24 Horas',
        'radio.main_title': 'RadioVisión RTV: Dos Emisoras en Vivo',
        'radio.main_desc': 'Música de adoración, palabra viva y la proclamación de la sana doctrina en castellano y quechua. Al reproducir una emisora, la otra se pausará automáticamente.',
        'radio.on_air': 'Al Aire en Directo',
        'radio.station1_tag': 'Emisora 1 • Señal Principal',
        'radio.station1_desc': 'Alabanzas de Avivamiento, Alianza y la Proclamación de la Sana Doctrina las 24 horas.',
        'radio.on_air_now': 'Al Aire Ahora',
        'radio.satellite_hd': 'Señal Satelital HD',
        'radio.paused': 'En pausa',
        'radio.listen_station1': 'Escuchar RadioVisión RTV',
        'radio.listen_station2': 'Escuchar RadioVisión Quechua',
        'radio.reconnect': 'Reconectar',
        'radio.station2_tag': 'Emisora 2 • Señal Misionera',
        'radio.station2_desc': 'Diospa Simin Qillqa • Runasimi Rimaypi Uyariychik • Apurímac suyumanta tukuy suyukunaman.',
        'radio.station2_lang_tag': 'Señal Quechua Runasimi',
        'radio.station2_freq': 'Señal Quechua Chanka & Collao',
        'radio.recent_tracks': 'Lo que Sonó Recientemente en Transmisión',
        'radio.recent_history': 'Historial En Vivo',
        'radio.programming_title': 'Parrilla de Programación Semanal',
        'radio.announcers_tag': 'Voces Ungidas',
        'radio.announcers_title': 'Locutores Oficiales de Cabina',
        'radio.announcers_desc': 'Conoce a los siervos de Dios que te acompañan día a día a través de las ondas radiales.',

        // Sección: Culto en Vivo
        'live.official_broadcast': 'Transmisión Oficial en Directo',
        'live.title': 'Culto en Vivo',
        'live.desc': 'Participa con nosotros en la presencia del Señor a través de nuestras transmisiones en Facebook Live y YouTube Live.',
        'live.notify_btn': 'Avisarme 10 min antes de cada Culto',
        'live.watch_fb': 'Ver en Facebook Live',
        'live.watch_yt': 'Ver en YouTube Live',
        'live.congregational_service': 'Servicio Congregacional',
        'live.connected_signal': 'Señal en Directo Conectada',
        'live.on_air_badge': 'EN DIRECTO',
        'live.activate_notifications': 'Activar Notificaciones',
        'live.open_fb': 'Abrir Página de Facebook',
        'live.open_yt': 'Canal de YouTube',
        'live.realtime_tag': 'Horario y Transmisión en Tiempo Real',
        'live.next_broadcast': 'Próxima Transmisión Oficial',
        'live.countdown': 'Cuenta Regresiva',
        'live.time_left': 'Tiempo restante:',
        'live.backup_notice': 'Si la señal se llega a interrumpir o el navegador restringe la reproducción automática, abre el culto directamente con los botones oficiales de Facebook o YouTube.',

        // Sección: La Biblia Interactiva
        'bible.tag': 'Sagradas Escrituras • Reina-Valera 1960 Completa & Quechua',
        'bible.title': 'La Biblia Interactiva',
        'bible.desc': 'Lee el capítulo y versículo completo de la Biblia. Selecciona cualquier versículo para resaltarlo o escucharlo en audio.',
        'bible.book': 'Libro',
        'bible.chapter': 'Capítulo',
        'bible.verse': 'Versículo Específico',
        'bible.translation': 'Traducción',
        'bible.prev_chapter': 'Capítulo Anterior',
        'bible.next_chapter': 'Capítulo Siguiente',
        'bible.audio_label': 'Escuchar Versículo Seleccionado',
        'bible.audio_sub': 'Audio sintetizado de la Palabra • Clic para Play / Pausa',
        'bible.read_all': 'Leer Capítulo Completo',
        'bible.pulpit_mode': 'Modo Púlpito',
        'bible.exit_pulpit': 'Salir de Modo Púlpito (ESC)',
        'bible.opt_spanish': 'Español (Reina-Valera 1960)',
        'bible.opt_quechua': 'Quechua (Chanka / Collao)',

        // Sección: Galería Multimedia
        'gallery.tag': 'Memorias de la Gloria de Dios',
        'gallery.title': 'Galería Multimedia',
        'gallery.desc': 'Fotografías y videos de nuestros cultos congregacionales, bautismos, campañas y conferencias.',
        'gallery.filter_all': 'Todos',
        'gallery.filter_cultos': 'Cultos',
        'gallery.filter_activities': 'Actividades',
        'gallery.filter_baptisms': 'Bautismos',
        'gallery.filter_conferences': 'Conferencias',
        'gallery.filter_youth': 'Jóvenes',

        // Sección: Biblioteca Cristiana
        'library.tag': 'Recursos Espirituales Para Edificación',
        'library.title': 'Biblioteca Cristiana',
        'library.desc': 'Mensajes de salvación, devocionales y música de adoración congregacional en audio y video.',
        'library.filter_all': 'Todos',
        'library.filter_sermons': 'Prédicas',
        'library.filter_podcasts': 'Podcasts',
        'library.filter_music': 'Música (Alabanzas, Coros, Himnos)',
        'library.styles_label': 'Estilos:',
        'library.sub_all': 'Todas',
        'library.sub_alabanzas': 'Alabanzas',
        'library.sub_adoracion': 'Adoración',
        'library.sub_himnos': 'Himnos',

        // Sección: Testimonios de Fe
        'testimonials.tag': 'Lo que Dios ha Hecho en Nuestro Medio',
        'testimonials.title': 'Testimonios de Fe',
        'testimonials.desc': 'Historias reales de conversión, sanidad divina, restauración familiar y respuesta a la oración para glorificar el Nombre de Jesucristo.',
        'testimonials.filter_all': 'Todos',
        'testimonials.filter_conversion': 'Conversión',
        'testimonials.filter_restoration': 'Restauración',
        'testimonials.filter_healing': 'Sanidad Divina',
        'testimonials.filter_answer': 'Respuesta a la Oración',
        'testimonials.btn_share': 'Testificar lo que Cristo Hizo en Mí',

        // Sección: Peticiones de Oración
        'prayer.tag': 'Intercesión en Directo',
        'prayer.title': 'Peticiones de Oración',
        'prayer.view_sedes': 'Ver Sedes y Ubicación',
        'prayer.altar_title': 'Altar de Oración',
        'prayer.name_label': 'Tu Nombre Completo',
        'prayer.name_placeholder': 'Ej. Hno. Juan Carlos',
        'prayer.contact_label': 'Correo o Teléfono (Opcional)',
        'prayer.contact_placeholder': 'Ej. +51 987 654 321 o tucorreo@ejemplo.com',
        'prayer.motive_label': 'Motivo de Oración',
        'prayer.motive_placeholder': 'Escribe aquí tu necesidad, motivo de salud, restauración familiar, salvación o gratitud...',
        'prayer.submit': 'Enviar Petición',
        'prayer.social_tag': 'Conexión Global',
        'prayer.social_title': 'Síguenos en Redes Sociales',
        'prayer.social_desc': 'Mantente conectado a nuestras transmisiones en video, devocionales y contenido misionero.',
        'prayer.booth_direct': 'Línea Directa en Cabina',
        'prayer.booth_write': 'Escribir',
        'prayer.public_tag': 'Clamor e Intercesión',
        'prayer.public_title': 'Peticiones de Oración en Cabina',
        'prayer.public_desc': 'Motivos presentados ante el altar por nuestro equipo pastoral y oyentes.',

        // Sección: Soy Nuevo
        'new.tag': 'Una Iglesia con Brazos Abiertos',
        'new.title': '¡Bienvenido a la Familia de Dios!',
        'new.desc': 'No importa de dónde vengas ni cuál sea tu historia: en Jesucristo hay un nuevo comienzo para ti y para tu hogar.',
        'new.badge_top': 'Soy Nuevo • ¡Bienvenido a Casa!',
        'new.pastoral_message_tag': 'Mensaje Pastoral',
        'new.pastoral_title': '"Nos alegra inmensamente tu visita"',
        'new.pastoral_text': 'Querido amigo o hermano, para nosotros es un honor recibirte. Creemos que tu llegada no es casualidad, sino el plan perfecto de Dios para bendecir tu vida. Queremos que te sientas como en casa, rodeado de amor, alabanza sincera y la verdad de la Palabra de Dios.',
        'new.pastoral_sign': '— Pastor Principal Richard Edgardo Dávila Becerra y Pastora Elena Sumalave Torres',
        'new.card1_title': 'Calidez Familiar',
        'new.card1_desc': 'Serás recibido con una sonrisa y un abrazo sincero de bienvenida desde el primer minuto.',
        'new.card2_title': 'Sana Doctrina',
        'new.card2_desc': 'Mensajes bíblicos prácticos y llenos de fe que te darán dirección y fortaleza en tu día a día.',
        'new.card3_title': 'Atención para tus Hijos',
        'new.card3_desc': 'Clases y maestros dedicados a cuidar y enseñar la Biblia a los niños de forma divertida.',
        'new.register_tag': 'Queremos Conocerte Mejor',
        'new.register_title': 'Registro de Bienvenida Pastoral',
        'new.register_desc': 'Completa estos breves datos para ponernos en contacto y bendecir tu vida.',
        'new.step1_title': 'Contacto Rápido',
        'new.step1_sub': 'Paso 1 de 2',
        'new.step2_title': 'Motivo & Petición',
        'new.step2_sub': 'Paso 2 de 2',
        'new.name_label': 'Nombre Completo *',
        'new.name_placeholder': 'Ej. Juan Carlos Pérez',
        'new.phone_label': 'Teléfono o WhatsApp *',
        'new.phone_placeholder': 'Ej. +51 984 123 456',
        'new.city_label': 'Ciudad o Localidad *',
        'new.city_placeholder': 'Ej. Challhuahuacho, Apurímac',
        'new.btn_next': 'Siguiente: Motivo o Consulta',
        'new.reason_label': '¿Cuál es tu principal motivo de contacto o visita?',
        'new.reason_opt1': '🌟 Es mi primera vez y deseo conocer la congregación',
        'new.reason_opt2': '🙏 Busco una iglesia de sana doctrina donde congregarme',
        'new.reason_opt3': '🕊️ Necesito apoyo en oración / intercesión pastoral',
        'new.reason_opt4': '📖 Solicito información de horarios y discipulado',
        'new.notes_label': 'Petición de Oración o Mensaje Personal (Opcional)',
        'new.notes_placeholder': 'Escribe aquí tu petición de sanidad, necesidad espiritual o consulta...',
        'new.btn_back': 'Volver',
        'new.btn_submit': 'Quiero conocer la iglesia',

        // Pie de Página
        'footer.church_name': 'Iglesia Misionera Casa de Oración para Todas las Naciones',
        'footer.motto': 'Oración • Palabra • Misión',
        'footer.rights': '© 2026 IMCOTNV - Iglesia Misionera Casa de Oración para Todas las Naciones • RadioVisión RTV. ¡Al Señor sea la gloria! Todos los derechos reservados.',
        'library.watch_sermon': 'Ver Prédica',
        'library.listen_audio': 'Escuchar Audio',
        'events.table_action_btn': 'Asistir',
        'events.how_to_get': 'Cómo Llegar',
        'sedes.annex_tag': 'Anexo Ministerial',
        'sedes.view_location': 'Ubicación',
        'testimonials.verified': 'Verificado',

        // Modal de Ã‰xito Pastoral (Soy Nuevo)
        'vis_modal.tag': 'Registro Pastoral Confirmado',
        'vis_modal.welcome_prefix': '¡Bienvenido a Casa,',
        'vis_modal.desc': 'Nos alegra inmensamente tu decisión. Tus datos han sido recibidos por nuestro equipo pastoral y estaremos orando por tu vida y tu familia.',
        'vis_modal.city_lbl': 'Ciudad / Sede:',
        'vis_modal.reason_lbl': 'Motivo:',
        'vis_modal.btn_wa': 'Saludar al Pastor por WhatsApp',
        'vis_modal.btn_close': 'Continuar explorando la web',

        // Modales
        'share.title': 'Compartir Contenido',
        'share.subtitle': 'Elige la plataforma para bendecir a otros',
        'share.wa': 'Compartir por WhatsApp',
        'share.fb': 'Compartir en Facebook',
        'share.copy': 'Copiar Texto Completo',
        'share.more': 'Más opciones de compartir',
        'search.modal_title': 'Buscador General • RADIOVISIÓN RTV',
        'search.input_placeholder': 'Escribe para buscar versículos, libros bíblicos, temas de fe, sermones...',
        'search.suggestions': 'Sugerencias:',
        'search.initial_prompt': 'Ingresa una palabra clave, cita bíblica o tema para encontrar contenido al instante.',

        // Botones Comunes
        'btn.share': 'Compartir',
        'btn.close': 'Cerrar',
        'btn.read_more': 'Leer más',
        'btn.back': 'Volver',
        // Nuevas Claves de Integridad Bilingue Completa
        'new.welcome_home': '¡Bienvenido a Casa!',
        'new.hero_title': '¡Bienvenido a la Familia de Dios!',
        'new.hero_desc': 'No importa de dónde vengas ni cuál sea tu historia: en Jesucristo hay un nuevo comienzo para ti y para tu hogar.',
        'new.pastoral_desc': 'Querido amigo o hermano, para nosotros es un honor recibirte. Creemos que tu llegada no es casualidad, sino el plan perfecto de Dios para bendecir tu vida. Queremos que te sientas como en casa, rodeado de amor, alabanza sincera y la verdad de la Palabra de Dios.',
        'new.pastoral_signature': '— Pastor Principal Richard Edgardo Dávila Becerra y Pastora Elena Sumalave Torres',
        'new.card1_desc': 'Serás recibido con una sonrisa y un abrazo sincero de bienvenida desde el primer minuto.',
        'new.card2_desc': 'Mensajes bíblicos prácticos y llenos de fe que te darán dirección y fortaleza en tu día a día.',
        'new.card3_title': 'Atención para tus Hijos',
        'new.card3_desc': 'Clases y maestros dedicados a cuidar y enseñar la Biblia a los niños de forma divertida.',
        'new.step1_title': 'Contacto Rápido',
        'new.step2_title': 'Motivo & Petición',
        'new.phone_label': 'Teléfono o WhatsApp *',
        'new.reason_question': '¿Cuál es tu principal motivo de contacto o visita?',
        'new.reason_opt1': '🌟 Es mi primera vez y deseo conocer la congregación',
        'new.reason_opt2': '🙏 Busco una iglesia de sana doctrina donde congregarme',
        'new.reason_opt3': '🕊️ Necesito apoyo en oración / intercesión pastoral',
        'new.reason_opt4': '📖 Solicito información de horarios y discipulado',
        'new.notes_label': 'Petición de Oración o Mensaje Personal (Opcional)',
        'new.notes_placeholder': 'Escribe aquí tu petición de sanidad, necesidad espiritual o consulta...',
        'new.btn_submit': 'âœ… Quiero conocer la iglesia',

        'prayer.view_sedes': 'Ver Sedes y Ubicación',
        'prayer.altar_title': 'Altar de Oración',
        'prayer.live_tag': 'Intercesión en Directo',
        'prayer.title': 'Peticiones de Oración',
        'prayer.contact_lbl': 'Correo o Teléfono (Opcional)',
        'prayer.reason_lbl': 'Motivo de Oración',
        'prayer.reason_placeholder': 'Escribe aquí tu necesidad, motivo de salud, restauración familiar, salvación o gratitud...',
        'prayer.btn_submit': 'Enviar Petición',
        'prayer.global_tag': 'Conexión Global',
        'prayer.social_title': 'Síguenos en Redes Sociales',
        'prayer.booth_title': 'Línea Directa en Cabina',
        'prayer.intercession_tag': 'Clamor e Intercesión',
        'prayer.booth_prayers_title': 'Peticiones de Oración en Cabina',

        'events.agenda_tag': 'Agenda del Reino de Dios',
        'events.agenda_title': 'Próximos Eventos & Campañas',
        'events.agenda_desc': 'No te pierdas ninguna de nuestras cruzadas evangelísticas, vigilias de avivamiento y conferencias bíblicas.',
        'events.filter_all': 'Todos los Eventos',
        'events.filter_upcoming': 'Próximos Eventos',
        'events.filter_campaigns': 'Campañas',
        'events.filter_conferences': 'Conferencias',
        'events.filter_vigils': 'Vigilias',
        'events.filter_special': 'Actividades Especiales',

        'bible.tag': 'Sagradas Escrituras • Reina-Valera 1960 Completa & Quechua',
        'bible.desc': 'Lee el capítulo y versículo completo de la Biblia. Selecciona cualquier versículo para resaltarlo o escucharlo en audio.',
        'bible.chapter': 'Capítulo',
        'bible.verse': 'Versículo Específico',
        'bible.translation': 'Traducción',
        'bible.opt_spanish': 'Español (Reina-Valera 1960)',
        'bible.prev_chapter': 'Capítulo Anterior',
        'bible.loading_verses': 'Cargando versículos...',
        'bible.next_chapter': 'Capítulo Siguiente',
        'bible.listen_selected': 'Escuchar Versículo Seleccionado',
        'bible.audio_sub': 'Audio sintetizado de la Palabra • Clic para Play / Pausa',
        'bible.read_chapter': 'Leer Capítulo Completo',
        'bible.exit_pulpit': 'Salir de Modo Púlpito (ESC)',
        'bible.subtext': 'Reina-Valera 1960 • Texto Sagrado Completo',
        'bible.pulpit_mode': 'Modo Púlpito',
        'bible.font_size': 'Tamaño:',

        'gallery.breadcrumb': 'Galería de Fotos y Videos',

        'radio.signal_247': 'Señal en Vivo 24/7',
        'radio.castellano_247': 'Castellano • 24/7',
        'radio.station1_default_show': 'Culto de Avivamiento y Proclamación Misionera',
        'radio.frequency_info': 'Frecuencia: Satélite Zeno FM',
        'radio.station2_live_tag': 'Kawsay Simi • Kawsaypi',
        'radio.runasimi_247': 'Runasimi • 24/7',

        'sedes.pastors_names': 'Pastor Principal Richard Edgardo Dávila Becerra y Pastora Elena Sumalave Torres',
        'sedes.schedules_text': 'Miércoles 07:00 PM • Sábados 06:30 PM • Domingos 10:00 AM y 06:00 PM',
        'sedes.btn_maps': 'Abrir en Google Maps',

        'footer.church_name': 'Iglesia Misionera Casa de Oración para Todas las Naciones',
        'footer.motto': 'Oración • Palabra • Misión',
        'footer.copyright': '© 2026 IMCOTNV - Iglesia Misionera Casa de Oración para Todas las Naciones • RadioVisión RTV. ¡Al Señor sea la gloria! Todos los derechos reservados.',

        'pwa.modal_tag': 'Aplicación Web Progresiva Oficial',
        'pwa.modal_title': 'Instalar App IMCOTNV & RadioVisión',
        'pwa.benefit1_title': 'Radio en Vivo',
        'pwa.benefit1_desc': 'Segundo plano 24/7',
        'pwa.benefit2_title': 'Biblia Offline',
        'pwa.benefit2_desc': 'Disponible sin internet',
        'pwa.benefit3_title': 'Carga Veloz',
        'pwa.benefit3_desc': 'Ahorra megas y batería',
        'pwa.btn_install': 'Instalar en este Dispositivo con 1 Clic',
        'pwa.install_note': 'No ocupa espacio en Google Play Store ni App Store. Se instala de forma directa y segura.',
        // Formulario 2: Decisiones en Culto y Exportacion Excel
        'decision.tag': 'Registro Pastoral y Decisiones en el Altar',
        'decision.title': 'Registro de Decisiones en Culto',
        'decision.desc': 'Formulario oficial para registrar a nuevos creyentes, reconciliaciones, peticiones de bautismo y nuevos hermanos en el altar.',
        'decision.btn_download_excel': 'Descargar Libro Excel (.xlsx)',
        'decision.name_label': 'Nombre y Apellidos del Hermano(a) *',
        'decision.phone_label': 'Teléfono o WhatsApp *',
        'decision.city_label': 'Ciudad, Comunidad o Anexo *',
        'decision.type_label': 'Motivo o Decisión Espiritual en el Altar *',
        'decision.opt_first_time': '🕊️ Entrega de Vida por Primera Vez (Aceptó a Cristo)',
        'decision.opt_reconciliation': '🤝 Reconciliación con Dios (Regreso a la Fe)',
        'decision.opt_baptism': '🌊 Petición de Bautismo en Aguas',
        'decision.opt_discipleship': '📖 Desea Discipulado / Escuela Bíblica',
        'decision.opt_visit': '🏠 Visita / Desea Congregarse',
        'decision.counselor_label': 'Consejero o Líder que atendió en el altar',
        'decision.notes_label': 'Petición de Oración o Notas Pastorales',
        'decision.btn_submit': 'Guardar Decisión',
        'decision.modal_title': '¡Gloria a Dios! Decisión Registrada',
        'decision.btn_wa_pastor': '📲 Notificar al Pastor por WhatsApp',
        'decision.btn_wa_brother': '💬 Enviar Bienvenida al Nuevo Creyente',
        'decision.btn_register_another': '➕ Registrar a Otro Hermano en Altar',
        'excel.download_visitors': 'Descargar Lista en Excel (.xlsx)'
    },
    qu: {
        // Navegación (Quechua Sureño Chanka & Qullaw)
        'nav.motto': 'Mañakuy • Diospa Simin • Misión',
        'nav.church_name': 'Tukuy Llaqtakunapaq Mañakuna Wasi Misionera Iglesia',
        'nav.subtitle': '"Allin Willakuyta Tukuy Llaqtakunaman Willaspa"',
        'nav.search_placeholder': 'Tukuy webpi maskay...',
        'nav.search_btn': 'Maskay',
        'nav.install_app': 'App Churay',
        'nav.install_app_mob': 'Celularnikipi App-ta churay',
        'nav.live_radio': 'Kawsaypi Radio',
        'nav.inicio': 'Qallariy',
        'nav.nosotros': 'Ñoqanchik & Pastorkuna',
        'nav.culto_vivo': 'Kawsaypi Culto',
        'nav.radio_nav': 'Kawsaypi Radio',
        'nav.biblia': 'Diospa Simin',
        'nav.sedes': 'Wasiykuna',
        'nav.testimonios': 'Willakuykuna',
        'nav.oracion': 'Mañakuy',
        'nav.soy_nuevo': 'Musuq kani',
        'nav.mas': 'Aswan',
        'nav.mas_secciones': 'Aswan T\'aqakuna',
        'nav.eventos': 'Cultokuna & Huñunakuy',
        'nav.misionero': 'Misionkuna Ñawpaqman',
        'nav.ministerios': 'Ministeriokuna & Yachaywasi',
        'nav.galeria': 'Rikch\'aykuna Galería',
        'nav.biblioteca': 'Cristiano Qillqawasi',
        'nav.theme_dark': 'Tuta Llimp\'i (Tutapaq)',
        'nav.theme_change': 'Llimp\'ita Tikray',
        'nav.admin_access': 'Kamachiq Yaykuy',
        'nav.language_title': 'Simi / Idioma:',

        // Hero (Qallariy P'anqa)
        'hero.banner_tag': 'IMCOTNV • Mañakuy • Diospa Simin • Misión',
        'hero.church_name': 'Tukuy Llaqtakunapaq Mañakuna Wasi Misionera Iglesia',
        'hero.church_subtitle': '"Allin Willakuyta Tukuy Llaqtakunaman Willaspa"',
        'hero.radio_subtitle': 'IMCOTNV-pa Radio Ministerio',
        'hero.main_title_1': 'Mañakuway, hinaspan herenciatan qosayki',
        'hero.main_title_highlight': 'Nacionkunata',
        'hero.main_desc': 'Allin hamusqa kaychik Tukuy Nacionkunapaq Mañakuna Wasi Misionera Iglesiaman (IMCOTNV), "Allin Willakuyta Tukuy Llaqtakunaman Willaspa". Riqsiy iñiqmasinchikkunata, huñunakuyninchikkunapi kuskachakuy hinaspa RadioVisión RTV kawsay simita uyariy.',
        'hero.listen_live': 'Kawsay Señalta Uyariy',
        'hero.watch_live': 'Kawsaypi Cultota Qaway',
        'hero.new_here': '¿Musuqchu kanki kaypi? Hamuy watukamayku',
        'hero.send_prayer': '¿Mañakuytachu munanki? Qillqamuy',
        'hero.active_broadcast': 'Kawsay Señal Uyarikuchkan',
        'hero.default_show': 'Kawsarichiq Culto & Chiqap Yachachikuy',
        'hero.live_now': 'KAWSAYPI',
        'hero.verse_tag': 'Kunan Punchawpaq Diospa Simin',
        'hero.verse_subtitle': 'Sapa Punchaw Espiritual Mikhuna',
        'hero.pastoral_reflection': 'Pastoral Yuyaymanay:',
        'hero.read_in_bible': 'Diospa Siminpi Ñawinchay',

        // Reproductor Flotante
        'player.title': 'RTV Uyarina',
        'player.playing': 'Kawsay simita uyarichkan',
        'player.online': 'Kawsaypi Señal',
        'player.reconnect_notice': 'Señal sayasqa otaq pitisqa.',
        'player.reconnect_btn': 'Kaypi señalta kutichimuy',

        // Sección: Nosotros & Pastores
        'about.back_home': 'Qallariyman Kutiy',
        'about.section_badge': 'Ñoqanchik & Pastorkuna • IMCOTNV • Tukuy Llaqtakunapaq Mañakuna Wasi',
        'about.lead_tag': 'Iñiqkunata Pusariq Diospa Llank\'aqninkuna',
        'about.lead_title': 'Pastorkuna & Ministeriomanta Kamachiqkuna',
        'about.lead_desc': 'Diospa qharinkuna warminkuna, Diospa siminta yachachiypi hinaspa ayllukunata michiypi llank\'aqkuna.',
        'about.filter_all': 'Llapan',
        'about.filter_principal': 'Hatun Pastor',
        'about.filter_pastora': 'Pastora',
        'about.filter_team': 'Ministerio Huñu',
        'about.filter_leaders': 'Ministerio Umalliqkuna',
        'about.identity_tag': 'Iñiy, Suti & Wiñaypaq Yuyay',
        'about.who_we_are': 'Pikunam Kayku',
        'about.who_we_are_desc': 'Riqsiy kawsayninchikta, iñiyninchikta hinaspa misionera qawayninchikta, Tukuy Llaqtakunapaq Mañakuna Wasi (IMCOTNV) hinaspa RadioVisión RTV-pi.',
        'about.our_history_tag': 'Ñawpaq Kawsayninchik',
        'about.our_history_title': 'Allin Willakuyta Willanapaq Paqarisqa',
        'about.history_p1': 'Tukuy Nacionkunapaq Mañakuna Wasi (IMCOTNV) hinaspa RadioVisión RTV paqarirqan sonqonkupi Diospa siminta chaskiq siervokunawan: "Mañakuway, hinaspan herenciatan qosayki nacionkunata" (Salmos 2:8). "Mañakuy • Diospa Simin • Misión" nisqawan, Cotabambas Challhuahuachomanta pacha, Tayta Dios sayarichirqan kay hatun altarta tukuy cheqap yachachikuyta willanapaq.',
        'about.history_p2': 'Espíritu Santopa kallpanwan cultokunata ruraspa, ayllu llaqtakunapi mawk\'a wasikunata kicharispa, hinaspa sapa punchaw 24 horantin radiopi willaspa, waranqa waranqa ayllukunam Jesucristopa sutinpi consuelota, qhali kayta hinaspa kawsayta chaskirqanku.',
        'about.stat_radio': 'Mana Sayayniyoq Radio Señal',
        'about.stat_communities': 'Chayasqa Ayllu Llaqtakuna',
        'about.stat_annexes': 'Wasiykuna & Anexokuna',
        'about.stat_doctrine': 'Chiqap Diospa Simin',
        'about.mission_title': 'Misionninchik',
        'about.mission_desc': 'Diospa siminta hinaspa chiqaq yachachikuyta radiowan internetwan tukuy runakunaman willay, qispikuyta, qhali kayta hinaspa hawkallakuyta apaspa.',
        'about.vision_title': 'Visionninchik',
        'about.vision_desc': 'Tukuy pachaman k\'anchariq hatun misionera kay, Jesucristopa kachamusqanta hunt\'aspa hinaspa paypa siminta mana samaspa mast\'arispa.',
        'about.values_title': 'Chaninchayninchik (Valores)',
        'about.values_desc': 'Diospa siminman sonqo kay, wawqe-panapura kuyanakuy, ch\'uya kawsay, chinkasqa almakunata maskay hinaspa ch\'uya llank\'ay.',
        'about.pillars_tag': 'Ministeriopaq Pirqankuna',
        'about.pillars_title': 'Pichqa Hatun Pirqakuna (Efesios 4:11)',
        'about.pillars_desc': 'JESUCRISTO qaqamanta mana kuyurispa sayachisqa.',
        'about.col_apostles': 'APOSTOLKUNA',
        'about.col_apostles_sub': 'Kamachiy & Mast\'ariy',
        'about.col_prophets': 'PROFETAKUNA',
        'about.col_prophets_sub': 'Diospa Simin & Pusay',
        'about.col_evangelists': 'EVANGELISTAKUNA',
        'about.col_evangelists_sub': 'Almakunata Cosechay',
        'about.col_pastors': 'PASTORKUNA',
        'about.col_pastors_sub': 'Iñiqkunata Michiy',
        'about.col_teachers': 'YACHACHIQKUNA',
        'about.col_teachers_sub': 'Doctrina & Yachachiy',

        // Sección: Cultos & Eventos
        'events.reunions_tag': 'Templo Wasipi Iñiqkuna Huñunakuy',
        'events.main_title': 'Hatun Culto & Horakuna',
        'events.main_desc': 'Diospa wasinpi suyaykiku yupaychanapaq, siminta chaskinapaq hinaspa bendecisqa kanaykipaq.',
        'events.dominical_tag': 'Kusikuy Punchaw',
        'events.dominical_title': 'Domingo Culto',
        'events.dominical_time': 'Domingokuna 10:00 AM & 06:00 PM',
        'events.dominical_desc': 'Kawsay alabanza, Espíritu Santopi yupaychay, willakuykuna hinaspa Diospa simin willay tukuy ayllupaq.',
        'events.watch_live': 'Kawsaypi Qaway',
        'events.prayer_tag': 'Milagrokuna Tuta',
        'events.prayer_title': 'Mañakuy Culto',
        'events.prayer_time': 'Miércoles 07:00 PM',
        'events.prayer_desc': 'Espiritual mañakuy, onqosqakunapaq rogakuy, ayllukuna allinyanapaq hinaspa kacharichisqa kanapaq Jesús sutipi.',
        'events.send_request': 'Mañakuyta Apachiy',
        'events.school_tag': 'Diospa Simin Yachay',
        'events.school_title': 'Diospa Yachaywasin',
        'events.school_time': 'Domingokuna 08:30 AM',
        'events.school_desc': 'Yachachiykuna wawakunapaq, waynakunapaq hinaspa kuraqkunapaq. Diospa siminpi wiñanapaq.',
        'events.view_syllabus': 'Yachachikuyta Qaway',
        'events.youth_tag': 'Atiyniyoq Waynakuna',
        'events.youth_title': 'Waynakuna Sipaskuna Huñunakuy',
        'events.youth_time': 'Sabadokuna 06:30 PM',
        'events.youth_desc': 'Wayna sipaskunapa yupaychaynin, allin kawsaypaq consejokuna hinaspa kuskachakuy.',
        'events.youth_btn': 'Wayna Ministerio',
        'events.calendar_tag': 'Tukuy Semana Programacion',
        'events.calendar_title': 'Sapa Semana Ruranakuna',
        'events.how_to_get': '¿Imaynatataq Iglesiaman Chayanki?',
        'events.table_day': 'Punchaw',
        'events.table_activity': 'Ruranakuy / Culto',
        'events.table_time': 'Hora',
        'events.table_location': 'Kiti / Kamachiq',
        'events.table_action': 'Ruray',

        // Sección: Sedes & Ubicación
        'sedes.annexes_btn': 'Anexokunata Qaway',
        'sedes.expansion_tag': 'Yupaychana Wasikuna & Suyukunapi Mast\'ariy',
        'sedes.main_title': 'Templo Wasiykuna & Tiyana',
        'sedes.main_desc': 'Hamuy Hatun Templo Challhuahuachoman otaq wasiykiman aswan hichpa kaq anexota riqsiy.',
        'sedes.central_badge': 'Hatun Templo & Oficial Canalkuna',
        'sedes.central_name': 'Hatun Templo Challhuahuacho',
        'sedes.main_address': 'Hatun Templo Tiyanchan',
        'sedes.responsible_pastors': 'Kamachiq Pastorkuna',
        'sedes.booth_phone': 'Cabina Teléfono',
        'sedes.direct_wa': 'Directo WhatsApp',
        'sedes.cult_schedules': 'Templo Huñunakuy Horakuna',
        'sedes.open_gps': 'GPS-ta Kichay (Google Maps)',
        'sedes.notify_wa': 'WhatsApp-wan Hamusqayta Willay',
        'sedes.regional_annexes': 'Anexokuna & Mañakuna Wasiykuna',
        'sedes.empty_title': 'Hamuq Punchawkunapi Musuq Anexokuna',
        'sedes.empty_desc': 'Comunidadkunapi huñunakuna anexokunaqa pisi tiempollamanta willasqa kanqa.',
        'prayers.empty_msg': 'Manaraqmi kanchu mañakuykuna. ¡Qampa kaqta hanaypi kachamuy!',
        'testimonials.empty_msg': 'Manaraqmi kanchu testimoniyokuna kay categoriapi.',

        // Sección: Avance Misionero & Escuela
        'mission.tag': 'Mañakuway, hinaspan herenciatan qosayki Nacionkunata',
        'mission.title': 'Misionkuna Ñawpaqman',
        'mission.desc': 'Diospa simin chayasqan, musuq misionkuna kicharikusqan hinaspa ayllukunapi kawsay tikrakusqan.',
        'mission.stat_evangelized': 'Willasqa Ayllu Llaqtakuna',
        'mission.stat_bibles': 'Diospa Qillqankuna Qosqa',
        'mission.stat_annexes': 'Kichasqa Anexokuna',
        'mission.stat_workers': 'Misionerokuna & Llank\'aqkuna',
        'mission.campaigns_title': 'Campañakuna & Mision Risqakuna',
        'mission.field_testimonies': 'Ayllukunamanta Willakuykuna',
        'mission.future_projects': 'Hamunallapaq Mision Llank\'aykuna',
        'ministries.body_tag': 'Cristopa Kurkun Llank\'aypi',
        'ministries.main_title': 'Ministerionchikkuna',
        'ministries.main_desc': 'Servicionpaq, sayarinapaq hinaspa sapa iñiqmasi espiritual wiñananpaq t\'aqakuna.',
        'school.spiritual_growth': 'Espiritual Wiñay & Chiqap Yachachikuy',
        'school.main_title': 'Diospa Yachaywasin',
        'school.main_desc': 'Musuq iñiqkunapaq hatun yachaykuna hinaspa Señorpa llank\'aqninkunata yachachiy.',
        'school.tab_steps': 'Qallariy Puriykuna',
        'school.tab_formation': 'Cristiano Kay Yachay',
        'school.tab_doctrines': 'Diospa Simin Doctrinakuna',
        'school.steps_title': 'Cristopi Qallariy Puriykuna',
        'school.steps_sub': 'Pichqa hatun cimientos llapan iñiq runapa yachananta (Qispikuy, Iñiy, Bautismo, Mañakuy, Espíritu Santo).',
        'school.formation_title': 'Cristiano Kay & Yachapakuy',
        'school.formation_sub': 'Diospa sonqonman hina servinapaq hinaspa pusanapaq yachay (Yachapakuy, Umalliy, Evangelismo).',
        'school.doctrines_title': 'Mana Kuyuriq Hatun Yachachikuykuna',
        'school.doctrines_sub': 'Diospa siminpi iñiyninchikpa hatun pirqankuna.',

        // Sección: RadioVisión RTV
        'radio.two_stations_tag': 'Iskay Oficial Radiokuna • 24 Horantin Transmitispa',
        'radio.main_title': 'RadioVisión RTV: Iskay Kawsay Radiokuna',
        'radio.main_desc': 'Yupaychana takikuna, kawsay simi hinaspa chiqaq yachachikuy Castellano hinaspa Runasimipi. Hukta kichaptiykiqa, hukkaqmi samarinqa.',
        'radio.on_air': 'Wayrapi Kawsaypi',
        'radio.station1_tag': '1 Kaq Emisora • Hatun Señal',
        'radio.station1_desc': 'Kawsarichiy takikuna, Alianza hinaspa Chiqap Simi Willakuy 24 horantin.',
        'radio.on_air_now': 'Kunanmi Wayrapi',
        'radio.satellite_hd': 'Satelital Señal HD',
        'radio.paused': 'Samachkan',
        'radio.listen_station1': 'RadioVisión RTV-ta Uyariy',
        'radio.listen_station2': 'RadioVisión Quechuata Uyariy',
        'radio.reconnect': 'Kutichimuy',
        'radio.station2_tag': '2 Kaq Emisora • Misionera Señal',
        'radio.station2_desc': 'Diospa Simin Qillqa • Runasimi Rimaypi Uyariychik • Apurímac suyumanta tukuy suyukunaman.',
        'radio.station2_lang_tag': 'Runasimi Kawsay Señal',
        'radio.station2_freq': 'Chanka & Qullaw Runasimi Señal',
        'radio.recent_tracks': 'Ñawpaq Uyarikusqa Takikuna',
        'radio.recent_history': 'Kawsay Historial',
        'radio.programming_title': 'Sapa Semana Radio Programacion',
        'radio.announcers_tag': 'Akllasqa Rimariqkuna',
        'radio.announcers_title': 'Cabina Rimariqkuna',
        'radio.announcers_desc': 'Riqsiy radiopi sapa punchaw qanwan kashaq Diospa siervonkunata.',

        // Sección: Culto en Vivo
        'live.official_broadcast': 'Kawsaypi Chiqap Transmision',
        'live.title': 'Kawsaypi Culto',
        'live.desc': 'Kuskachakuy Señorpa qayllanpi Facebook Live hinaspa YouTube Live kawsay transmisión-ninchikpi.',
        'live.notify_btn': '10 min ñawpaqta willaway sapa Cultomanta',
        'live.watch_fb': 'Facebook Live-pi Qaway',
        'live.watch_yt': 'YouTube Live-pi Qaway',
        'live.congregational_service': 'Iñiqkunapa Culton',
        'live.connected_signal': 'Kawsay Señal Tupanachisqa',
        'live.on_air_badge': 'KAWSAYPI',
        'live.activate_notifications': 'Willakuykunata Kichay',
        'live.open_fb': 'Facebook Pagina Kichay',
        'live.open_yt': 'YouTube Canal',
        'live.realtime_tag': 'Kunan Horapi Kawsay Transmision',
        'live.next_broadcast': 'Qatiqnin Hatun Transmision',
        'live.countdown': 'Tiempon Qawariy',
        'live.time_left': 'Puchuq tiempo:',
        'live.backup_notice': "Sichus señal samarinman utaq navegador kikillanmantapacha mana tocanmanchu chayqa, kikin culto kichayta atinki Facebook utaq YouTube oficial botonkuna ñit'ispa.",

        // Sección: La Biblia Interactiva
        'bible.tag': 'Diospa Simin Qillqa • Reina-Valera 1960 & Qhichwa Simi',
        'bible.title': 'Diospa Simin Qillqa',
        'bible.desc': 'Ñawinchay capitulota hinaspa versiculota. Akllay ima versiculotapas k\'ancharichinaykipaq otaq uyarikunaykipaq.',
        'bible.book': 'Qillqa / Libro',
        'bible.chapter': 'Capítulo',
        'bible.verse': 'Versículo',
        'bible.translation': 'Tikray',
        'bible.prev_chapter': 'Ñawpaq Capítulo',
        'bible.next_chapter': 'Qatiq Capítulo',
        'bible.audio_label': 'Akllasqa Versiculota Uyariy',
        'bible.audio_sub': 'Diospa Simin uyarina • Ñit\'iy Play otaq Samachinapaq',
        'bible.read_all': 'Tukuy Capitulo Ñawinchay',
        'bible.pulpit_mode': 'Pulpito Ñawinchana',
        'bible.exit_pulpit': 'Pulpitomanta Lluqsiy (ESC)',
        'bible.opt_spanish': 'Español (Reina-Valera 1960)',
        'bible.opt_quechua': 'Runasimi (Chanka / Qullaw)',

        // Sección: Galería Multimedia
        'gallery.tag': 'Diospa Hatun Kawsayninpa Yuyariynin',
        'gallery.title': 'Rikch\'aykuna Galería',
        'gallery.desc': 'Fotokuna videokuna cultonchikmanta, bautismomanta, campañakunamanta hinaspa huñunakuykunamanta.',
        'gallery.filter_all': 'Llapan',
        'gallery.filter_cultos': 'Cultokuna',
        'gallery.filter_activities': 'Ruranakuna',
        'gallery.filter_baptisms': 'Bautismokuna',
        'gallery.filter_conferences': 'Conferenciakuna',
        'gallery.filter_youth': 'Wayna Sipaskuna',

        // Sección: Biblioteca Cristiana
        'library.tag': 'Espiritual Wiñanapaq Recursos',
        'library.title': 'Cristiano Qillqawasi',
        'library.desc': 'Qispikuymanta yachachiykuna, mañakuykuna hinaspa yupaychana takikuna audiopi videopipas.',
        'library.filter_all': 'Llapan',
        'library.filter_sermons': 'Willakuykuna / Prédicas',
        'library.filter_podcasts': 'Podcastskuna',
        'library.filter_music': 'Takikuna (Alabanzakuna, Corokuna, Himnokuna)',
        'library.styles_label': 'Estilokuna:',
        'library.sub_all': 'Llapan',
        'library.sub_alabanzas': 'Alabanzakuna',
        'library.sub_adoracion': 'Adoración',
        'library.sub_himnos': 'Himnokuna',

        // Sección: Testimonios de Fe
        'testimonials.tag': 'Tayta Diospa Chawpinchikpi Rurasqankuna',
        'testimonials.title': 'Iñiymanta Willakuykuna',
        'testimonials.desc': 'Chiqap willakuykuna qispikuymanta, qhali kaymanta, ayllu allinyaymanta hinaspa mañakuy chaskisqamanta Jesús sutinpi.',
        'testimonials.filter_all': 'Llapan',
        'testimonials.filter_conversion': 'Diosman Kutirikuy',
        'testimonials.filter_restoration': 'Allinyay (Restauración)',
        'testimonials.filter_healing': 'Diospa Qhali Kaynin',
        'testimonials.filter_answer': 'Mañakuy Kutichiynin',
        'testimonials.btn_share': 'Cristopa Rurasqanta Willakuy',

        // Sección: Peticiones de Oración
        'prayer.tag': 'Kawsaypi Diosta Mañapuy',
        'prayer.title': 'Mañakuykuna Diosman',
        'prayer.view_sedes': 'Templo Wasiykunata Qaway',
        'prayer.altar_title': 'Mañakuna Altar',
        'prayer.name_label': 'Llapanchis Sutiyki',
        'prayer.name_placeholder': 'Ej. Wawqe Juan Carlos',
        'prayer.contact_label': 'Correo otaq Teléfono (munaspaqa)',
        'prayer.contact_placeholder': 'Ej. +51 987 654 321 otaq correoyki@ejemplo.com',
        'prayer.motive_label': 'Imamanta Mañakuy',
        'prayer.motive_placeholder': 'Kaypi qillqay mañakuyniykita, onqosqamanta, ayllu allinyaymanta otaq graciasta qonapaq...',
        'prayer.submit': 'Mañakuyta Apachiy',
        'prayer.social_tag': 'Tukuy Teqsi Muyuwan Tupanachiy',
        'prayer.social_title': 'Redes Sociales-pi Qatimuyku',
        'prayer.social_desc': 'Kuskachasqa kashay videonchikwan, devocionalninchikwan hinaspa misionera willakuykunawan.',
        'prayer.booth_direct': 'Cabina Directo Teléfono',
        'prayer.booth_write': 'Qillqamuy',
        'prayer.public_tag': 'Qapariy & Mañakuy',
        'prayer.public_title': 'Cabinapi Chaskisqa Mañakuykuna',
        'prayer.public_desc': 'Pastorkunawan hinaspa uyariqkunawan altarpi Diosman churamusqa mañakuykuna.',

        // Sección: Soy Nuevo
        'new.tag': 'Kichasqa Marq\'ayniyoq Iglesia',
        'new.title': '¡Allinmi Hamusqa Kanki Diospa Ayllunman!',
        'new.desc': 'Maymantapas hamuy, imaynaña kawsayniyki karqanpas: Jesucristopim musuq kawsay qampaq wasiykipaqpas kachkan.',
        'new.badge_top': 'Musuq kani • ¡Allin Hamusqa Wasiykiman!',
        'new.pastoral_message_tag': 'Pastorkunapa Rimaynin',
        'new.pastoral_title': '"Kusirikuywanmi chaskiykiku"',
        'new.pastoral_text': 'Kuyasqa masillay otaq wawqellay panallay, kusikuywanmi wasiykuman chaskiykiku. Hamusqaykiqa manam yanqachu, Tayta Diospa allin munayninmi kawsayniykita bendecinanpaq. Wasiykipihina kay, kuyakuywan, cheqap alabanzawan hinaspa Diospa siminwan.',
        'new.pastoral_sign': '— Hatun Pastor Richard Edgardo Dávila Becerra & Pastora Elena Sumalave Torres',
        'new.card1_title': 'Kuyakuq Ayllu',
        'new.card1_desc': 'Asirikuywan hinaspa cheqap marq\'aykuywanmi qallariymantapacha chaskisqa kanki.',
        'new.card2_title': 'Chiqap Yachachikuy',
        'new.card2_desc': 'Diospa siminmanta yachachikuykuna, iñiyta kallpachaspa sapa punchaw pusasunki.',
        'new.card3_title': 'Wawakunapaq Cuidado',
        'new.card3_desc': 'Yachachiqkuna wawakunata kuyakuywan Diospa siminta kusikuywan yachachinankupaq.',
        'new.register_tag': 'Aswanta Riqsiyta Munaykiku',
        'new.register_title': 'Allin Hamusqa Qillqay',
        'new.register_desc': 'Kay pisillata qillqamuy tupananchikpaq hinaspa bendecisqa kanaykipaq.',
        'new.step1_title': 'Utqaylla Willay',
        'new.step1_sub': '1 Kaq Paso (2-manta)',
        'new.step2_title': 'Imarayku & Mañakuy',
        'new.step2_sub': '2 Kaq Paso (2-manta)',
        'new.name_label': 'Llapanchis Sutiyki *',
        'new.name_placeholder': 'Ej. Juan Carlos Pérez',
        'new.phone_label': 'Teléfono otaq WhatsApp *',
        'new.phone_placeholder': 'Ej. +51 984 123 456',
        'new.city_label': 'Llaqtayki otaq Kitiki *',
        'new.city_placeholder': 'Ej. Challhuahuacho, Apurímac',
        'new.btn_next': 'Qatiqnin: Imarayku otaq Tapukuy',
        'new.reason_label': '¿Imaynanpitam watukamuyta munanki?',
        'new.reason_opt1': '🌟 Qallariy kutim hamuni, iglesiata riqsiyta munani',
        'new.reason_opt2': '🙏 Chiqap yachachikuy iglesiata maskani huñunakunaypaq',
        'new.reason_opt3': '🕊️ Mañakuy yanapayta munani pastorpa mañapuwänanpaq',
        'new.reason_opt4': '📖 Horariokunata hinaspa discipuladota tapukuyta munani',
        'new.notes_label': 'Mañakuyniyki otaq Kikinpa Rimaynin (munaspaqa)',
        'new.notes_placeholder': 'Kaypi qillqay mañakuyniykita, onqosqamanta, ayllu allinyaymanta otaq tapukuyta...',
        'new.btn_back': 'Kutiy',
        'new.btn_submit': 'Iglesiata riqsiyta munani',

        // Pie de Página
        'footer.church_name': 'Tukuy Llaqtakunapaq Mañakuna Wasi Misionera Iglesia',
        'footer.motto': 'Mañakuy • Diospa Simin • Misión',
        'footer.rights': '© 2026 IMCOTNV - Tukuy Llaqtakunapaq Mañakuna Wasi Misionera Iglesia • RadioVisión RTV. ¡Señorpaq kachun hatun yupaychay! Tukuy derëchokuna waqaychasqa.',
        'library.watch_sermon': 'Willakuyta Qaway',
        'library.listen_audio': 'Audiota Uyariy',
        'events.table_action_btn': 'Hamuy',
        'events.how_to_get': 'Imaynatam Chayana',
        'sedes.annex_tag': 'Ministerial Anexo',
        'sedes.view_location': 'Tiyana',
        'testimonials.verified': 'Chiqaqchasqa',

        // Modal de Ã‰xito Pastoral (Soy Nuevo)
        'vis_modal.tag': 'Pastoral Chaskisqa',
        'vis_modal.welcome_prefix': '¡Allin Hamusqa Wasiykiman,',
        'vis_modal.desc': 'Kusirikuywanmi chaskiykiku. Sutiykiqa qillqasqam kachkan, pastorninchikkunam qampaq aylluykipaqpas mañapunqaku.',
        'vis_modal.city_lbl': 'Llaqta / Sede:',
        'vis_modal.reason_lbl': 'Imarayku:',
        'vis_modal.btn_wa': 'Pastorwan WhatsApp-pi Parlay',
        'vis_modal.btn_close': "P'anqata qawaspa kay",

        // Modales
        'share.title': 'Kayta Rakinakuy',
        'share.subtitle': 'Akllay maypi hukkunaman willanaykipaq',
        'share.wa': 'WhatsApp-pi Rakinakuy',
        'share.fb': 'Facebook-pi Rakinakuy',
        'share.copy': 'Tukuy Simita Copiay',
        'share.more': 'Aswan Rakinakuykuna',
        'search.modal_title': 'Hatun Mask\'aq • RADIOVISIÓN RTV',
        'search.input_placeholder': 'Qillqay versiculokunata, librokunata, iñiymanta, predicakunata maskanapaq...',
        'search.suggestions': 'Yuyaychaykuna:',
        'search.initial_prompt': 'Qillqamuy simita, versiculota otaq temata chaypacha tarinaykipaq.',

        // Botones Comunes
        'btn.share': 'Rakinakuy',
        'btn.close': 'Wisq\'ay',
        'btn.read_more': 'Aswanta ñawinchay',
        'btn.back': 'Kutiy',
        // Musuq Chiqaq Clavekuna Runasimipi (Qhichwa)
        'new.welcome_home': '¡Allin Hamusqa Wasiykiman!',
        'new.hero_title': '¡Allin Hamusqa Diospa Ayllunman!',
        'new.hero_desc': 'Maymantaña hamuqtiykipas, imayna kawsasqaykipas: Jesucristopim musuq kawsay kachkan qampaq aylluykipaqpas.',
        'new.pastoral_desc': 'Kuyasqa wauqi-pana, qamta chaskiyqa ancha kusikuymi. Hamusqaykiqa manam yanqallachu, aswanqa Diospa allin munayninmi kawsayniykita bendecinanpaq. Wasiykipihina sientekuyta munaykiku, khuyakuywan, cheqaq yupaychaywan Diospa Simin Qillqawan ima.',
        'new.pastoral_signature': '— Hatun Pastor Richard Edgardo Dávila Becerra hinallataq Pastora Elena Sumalave Torres',
        'new.card1_desc': 'Kusirikuy asirikuywan sonqomanta chaskisqam kanki qallariyninmantapacha.',
        'new.card2_desc': "Diospa Siminmanta yachachikuykuna, iñiyniykita kallpachanqa sapa p'unchaw.",
        'new.card3_title': 'Wawaykikunapaq Yachachiy',
        'new.card3_desc': 'Yachachiqkuna kanku warmakunata cuidananpaq kusikuywan Bibliata yachachinankupaq.',
        'new.step1_title': 'Utqaylla Rimariy',
        'new.step2_title': 'Imarayku & Mañakuy',
        'new.phone_label': 'Telefono otaq WhatsApp *',
        'new.reason_question': '¿Imataq aswan hatun munayniyki watukamunaykipaq?',
        'new.reason_opt1': '🌟 Ñawpaq kutim hamuni, iglesiatam riqsiyta munani',
        'new.reason_opt2': '🙏 Allin yachachikuyniyuq iglesiatam maskani huñunakunaypaq',
        'new.reason_opt3': '🕊️ Mañakuytam munani / pastorkunapa intercesionninta',
        'new.reason_opt4': '📖 Horariokunata yachayta munani discipuladotapas',
        'new.notes_label': 'Mañakuyniyki otaq Kikin Simiyki (Munaptiyki)',
        'new.notes_placeholder': 'Qillqay kaypi allinyanaykipaq mañakuyta, espiritumanta otaq tapukuyta...',
        'new.btn_submit': 'âœ… Iglesiatam riqsiyta munani',

        'prayer.view_sedes': 'Sedeskunata Tiyanankunata Qaway',
        'prayer.altar_title': 'Mañakuna Altar',
        'prayer.live_tag': 'Kikinpuni Mañakuy',
        'prayer.title': 'Mañakuy Mañakuykuna',
        'prayer.contact_lbl': 'Correo otaq Telefono (Munaptiyki)',
        'prayer.reason_lbl': 'Imarayku Mañakuy',
        'prayer.reason_placeholder': 'Qillqay kaypi nesitaykita, sanoyayta, ayllu allinyayta otaq grasiasta...',
        'prayer.btn_submit': 'Mañakuyta Apachiy',
        'prayer.global_tag': 'Tukuy Teqsimuyuntinwan Tupanaku',
        'prayer.social_title': 'Redes Sociales-pi Qatiwayku',
        'prayer.booth_title': 'Cabinaman Chiqap Linya',
        'prayer.intercession_tag': 'Qapariy & Mañakuy',
        'prayer.booth_prayers_title': 'Cabinapi Mañakuykuna',

        'events.agenda_tag': 'Diospa Qhapaqsuyunpa Agendan',
        'events.agenda_title': 'Hamuq Eventokuna & Campañakuna',
        'events.agenda_desc': "Ama faltakuychu evangelio mast'ariy cruzadakunata, rikch'ariy vigiliakunata, biblia rimanakuykunatapas.",
        'events.filter_all': 'Tukuy Eventokuna',
        'events.filter_upcoming': 'Hamuq Eventokuna',
        'events.filter_campaigns': 'Campañakuna',
        'events.filter_conferences': 'Conferenciakuna',
        'events.filter_vigils': 'Vigiliakuna',
        'events.filter_special': 'Sapaq Ruwaykuna',

        'bible.tag': "Ch'uya Qillqakuna • Reina-Valera 1960 & Runasimi Qhichwa",
        'bible.desc': "Ã‘awinchay capitulota versiculotapas Bibliamanta. Akllay mayqen versiculotapas k'anchachinaykipaq otaq audiopi uyarinaykipaq.",
        'bible.chapter': 'Capitulo',
        'bible.verse': 'Sapaq Versiculo',
        'bible.translation': "T'ikrasqa",
        'bible.opt_spanish': 'Castellano (Reina-Valera 1960)',
        'bible.prev_chapter': 'Ã‘awpaq Capitulo',
        'bible.loading_verses': 'Versiculokunata cargachkan...',
        'bible.next_chapter': 'Qatiq Capitulo',
        'bible.listen_selected': 'Akllasqa Versiculota Uyariy',
        'bible.audio_sub': "Diospa Simin Audio • Ñit'iy Play / Pausapaq",
        'bible.read_chapter': 'Tukuy Capitulota Ã‘awinchay',
        'bible.exit_pulpit': 'Pulpito Modomanta Lluqsiy (ESC)',
        'bible.subtext': "Reina-Valera 1960 • Tukuy Ch'uya Qillqa",
        'bible.pulpit_mode': 'Pulpito Modo',
        'bible.font_size': 'Sayaynin:',

        'gallery.breadcrumb': 'Fotokuna Videokuna Galería',

        'radio.signal_247': 'Kawsay Señal 24/7',
        'radio.castellano_247': 'Castellano Simipi • 24/7',
        'radio.station1_default_show': 'Kawsarichiy Culto hinallataq Misionero Willakuy',
        'radio.frequency_info': 'Frecuencia: Satélite Zeno FM',
        'radio.station2_live_tag': 'Kawsay Simi • Kawsaypi',
        'radio.runasimi_247': 'Runasimi • 24/7',

        'sedes.pastors_names': 'Hatun Pastor Richard Edgardo Dávila Becerra hinallataq Pastora Elena Sumalave Torres',
        'sedes.schedules_text': 'Miercoles 07:00 PM • Sabado 06:30 PM • Domingo 10:00 AM & 06:00 PM',
        'sedes.btn_maps': 'Google Maps-pi Kichay',

        'footer.church_name': 'Tukuy Suyukunapaq Mañakuna Wasi Misionera Iglesia',
        'footer.motto': 'Mañakuy • Simi • Misión',
        'footer.copyright': '© 2026 IMCOTNV - Tukuy Suyukunapaq Mañakuna Wasi Misionera Iglesia • RadioVisión RTV. ¡Señormanta kachun lliw hatunchay! Tukuy derichokuna waqaychasqa.',

        'pwa.modal_tag': 'Oficial Web Progresiva App',
        'pwa.modal_title': 'IMCOTNV & RadioVisión App-ta Chulay',
        'pwa.benefit1_title': 'Kawsaypi Radio',
        'pwa.benefit1_desc': 'Wasapi 24/7 uyarikun',
        'pwa.benefit2_title': 'Biblia mana internetniyuq',
        'pwa.benefit2_desc': 'Mana internetwanpas ñawinchana',
        'pwa.benefit3_title': 'Utqay Carga',
        'pwa.benefit3_desc': 'Megasta bateriatapas waqaychan',
        'pwa.btn_install': 'Kay Aparatopi 1 Clicwan Chulay',
        'pwa.install_note': 'Manam espacio-ta qonchu Play Store-pipas. Cheqallamanta segurutam chulakun.',
        // Formulario 2: Decisiones en Culto y Exportacion Excel (Quechua)
        'decision.tag': 'Altarpi Pastoral Qillqay & Munaykuna',
        'decision.title': 'Cultonchikpi Diosman Kutirikuy Qillqay',
        'decision.desc': 'Oficial formulario musuq iñiqkunata, kutirikuqkunata, bautismota mañakuqkunatapas altarpi qillqanapaq.',
        'decision.btn_download_excel': 'Excel Librota Descargay (.xlsx)',
        'decision.name_label': 'Wauqi-Panapa Sutin & Apellidon *',
        'decision.phone_label': 'Telefono otaq WhatsApp *',
        'decision.city_label': 'Llaqta, Comunidad otaq Anexo *',
        'decision.type_label': 'Altarpi Espiritual Decisión otaq Imarayku *',
        'decision.opt_first_time': '🕊️ Ñawpaq Kuti Kawsayninta Qon (Cristota Chaskin)',
        'decision.opt_reconciliation': '🤝 Dioswan Allipunakuy (Iñiyman Kutirimuy)',
        'decision.opt_baptism': '🌊 Yakupi Bautismo Mañakuy',
        'decision.opt_discipleship': '📖 Discipuladota & Bibliata Yachayta Munan',
        'decision.opt_visit': '🏠 Watukamuq / Huñunakuyta Munan',
        'decision.counselor_label': 'Altarpi yanapaq Líder otaq Consejero',
        'decision.notes_label': 'Mañakuy otaq Pastoral Qillqakuna',
        'decision.btn_submit': 'Decisionta Waqaychay',
        'decision.modal_title': '¡Diosmanta Hatunchay! Decisión Qillqasqa',
        'decision.btn_wa_pastor': '📲 Pastorwan WhatsApp-pi Willay',
        'decision.btn_wa_brother': '💬 Musuq Iñiqman Allin Hamusqa Apachiy',
        'decision.btn_register_another': '➕ Altarpi Huk Wauqita Qillqay',
        'excel.download_visitors': 'Listata Excelpi Descargay (.xlsx)'
    }
};

let _currentAppLang = 'es';

function getAppLanguage() {
    try {
        const saved = localStorage.getItem('rtv_lang');
        if (saved === 'qu' || saved === 'es') {
            return saved;
        }
    } catch (e) {
        console.warn('No se pudo leer rtv_lang de localStorage:', e);
    }
    return 'es';
}

function setAppLanguage(lang, showNotification = true) {
    if (lang !== 'es' && lang !== 'qu') lang = 'es';
    _currentAppLang = lang;
    try {
        localStorage.setItem('rtv_lang', lang);
    } catch (e) {}

    // Aplicar clase o atributo al html
    if (typeof document !== 'undefined') {
        document.documentElement.lang = (lang === 'qu') ? 'qu' : 'es';
    }

    applyLanguageTranslations(lang);
    updateLanguageSelectorsUI(lang);

    if (showNotification && typeof showToast === 'function') {
        if (lang === 'qu') {
            showToast('🏔️ Runasimi Qhichwa simiman t\'ikrasqa', 'info');
        } else {
            showToast('🇪🇸 Cambiado a idioma Español', 'info');
        }
    }

    // Disparar evento personalizado por si otros módulos quieren reaccionar
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('rtv_lang_changed', { detail: { lang } }));
    }
}

function toggleAppLanguage() {
    const nextLang = (_currentAppLang === 'es') ? 'qu' : 'es';
    setAppLanguage(nextLang, true);
}

function t(key, defaultVal = '') {
    const dict = I18N_TRANSLATIONS[_currentAppLang] || I18N_TRANSLATIONS.es;
    return dict[key] || I18N_TRANSLATIONS.es[key] || defaultVal || key;
}

function updateLanguageSelectorsUI(lang) {
    // 1. Selector en Navbar Superior
    const flagEl = document.getElementById('langFlagIcon');
    const labelEl = document.getElementById('langLabelText');
    const toggleBtn = document.getElementById('langToggleBtn');

    if (flagEl && labelEl) {
        if (lang === 'qu') {
            flagEl.textContent = '🏔️';
            labelEl.textContent = 'QU';
            if (toggleBtn) toggleBtn.title = "Kunan Simi: Runasimi (Qhichwa). P'itay Españolman kutinaykipaq";
        } else {
            flagEl.textContent = '🇪🇸';
            labelEl.textContent = 'ES';
            if (toggleBtn) toggleBtn.title = 'Idioma Actual: Español. Clic para cambiar a Runasimi (Quechua)';
        }
    }

    // 2. Botones en Menú Móvil
    const btnEs = document.getElementById('mobLangBtnEs');
    const btnQu = document.getElementById('mobLangBtnQu');
    if (btnEs && btnQu) {
        if (lang === 'qu') {
            btnQu.className = 'px-2.5 py-1 rounded-lg text-xs font-black transition-all bg-amber-500 text-slate-950 shadow-sm';
            btnEs.className = 'px-2.5 py-1 rounded-lg text-xs font-bold transition-all text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700';
        } else {
            btnEs.className = 'px-2.5 py-1 rounded-lg text-xs font-black transition-all bg-amber-500 text-slate-950 shadow-sm';
            btnQu.className = 'px-2.5 py-1 rounded-lg text-xs font-bold transition-all text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700';
        }
    }
}

function applyLanguageTranslations(lang) {
    if (!lang) lang = _currentAppLang || 'es';
    const dict = I18N_TRANSLATIONS[lang] || I18N_TRANSLATIONS.es;

    // 1. Elementos con data-i18n (reemplaza texto)
    document.querySelectorAll('[data-i18n]').forEach((el) => {
        const key = el.getAttribute('data-i18n');
        if (key && dict[key] !== undefined) {
            el.textContent = dict[key];
        }
    });

    // 2. Elementos con data-i18n-html (reemplaza HTML interno con formato enriquecido)
    document.querySelectorAll('[data-i18n-html]').forEach((el) => {
        const key = el.getAttribute('data-i18n-html');
        if (key && dict[key] !== undefined) {
            el.innerHTML = dict[key];
        }
    });

    // 3. Placeholders en inputs y textareas
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (key && dict[key] !== undefined) {
            el.setAttribute('placeholder', dict[key]);
        }
    });

    // 4. Atributos title y aria-label
    document.querySelectorAll('[data-i18n-title]').forEach((el) => {
        const key = el.getAttribute('data-i18n-title');
        if (key && dict[key] !== undefined) {
            el.setAttribute('title', dict[key]);
        }
    });

    document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
        const key = el.getAttribute('data-i18n-aria');
        if (key && dict[key] !== undefined) {
            el.setAttribute('aria-label', dict[key]);
        }
    });
}

function initAppI18n() {
    _currentAppLang = getAppLanguage();
    setAppLanguage(_currentAppLang, false);
}

if (typeof window !== 'undefined') {
    window.I18N_TRANSLATIONS = I18N_TRANSLATIONS;
    window.getAppLanguage = getAppLanguage;
    window.setAppLanguage = setAppLanguage;
    window.toggleAppLanguage = toggleAppLanguage;
    window.t = t;
    window.applyLanguageTranslations = applyLanguageTranslations;
    window.initAppI18n = initAppI18n;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => initAppI18n());
    } else {
        initAppI18n();
    }
}


// ==============================================================
// MÓDULO FIREBASE: PERSISTENCIA DUAL (INDEXEDDB/LOCALSTORAGE) Y CLOUD SYNC
// ==============================================================

        // ==============================================================
        // DUAL STORAGE SYSTEM: LOCALSTORAGE + INDEXEDDB PERSISTENCE
        // ==============================================================
        const STORAGE_KEY = 'RadioVisionRTV_AppData_v4';
        let db;

        function initDB() {
            return new Promise((resolve) => {
                try {
                    const request = indexedDB.open('RadioVisionRTV_DB', 8);
                    request.onerror = () => resolve(false);
                    request.onsuccess = () => {
                        db = request.result;
                        resolve(true);
                    };
                    request.onupgradeneeded = (e) => {
                        db = e.target.result;
                        if (!db.objectStoreNames.contains('store')) {
                            db.createObjectStore('store');
                        }
                        if (!db.objectStoreNames.contains('media')) {
                            db.createObjectStore('media');
                        }
                    };
                } catch (err) {
                    resolve(false);
                }
            });
        }

        function persistMediaBlob(id, fileOrBlob) {
            if (!id || !fileOrBlob) return Promise.resolve(false);
            window.uploadedMediaCache = window.uploadedMediaCache || new Map();
            window.uploadedMediaCache.set(id, fileOrBlob);
            
            return new Promise((resolve) => {
                const doSave = () => {
                    try {
                        if (!db || !db.objectStoreNames.contains('media')) return resolve(false);
                        const tx = db.transaction(['media'], 'readwrite');
                        const store = tx.objectStore('media');
                        store.put(fileOrBlob, id);
                        tx.oncomplete = () => resolve(true);
                        tx.onerror = () => resolve(false);
                    } catch (e) {
                        resolve(false);
                    }
                };
                if (!db) {
                    initDB().then(() => doSave());
                } else {
                    doSave();
                }
            });
        }

        function removeMediaBlob(id) {
            if (!id) return;
            if (window.uploadedMediaCache) window.uploadedMediaCache.delete(id);
            if (window.availableMediaBlobIds) window.availableMediaBlobIds.delete(id);
            if (!db || !db.objectStoreNames.contains('media')) return;
            try {
                const tx = db.transaction(['media'], 'readwrite');
                tx.objectStore('media').delete(id);
            } catch (e) {}
        }

        function revokeActiveMediaBlobUrl() {
            if (window._activeMediaBlobUrl) {
                try {
                    URL.revokeObjectURL(window._activeMediaBlobUrl);
                } catch (e) {}
                window._activeMediaBlobUrl = null;
            }
        }
        window.revokeActiveMediaBlobUrl = revokeActiveMediaBlobUrl;

        function getMediaBlobFromDB(id) {
            if (!id) return Promise.resolve(null);
            const cleanId = String(id).replace(/^idb:\/\//, '');
            if (window.uploadedMediaCache && window.uploadedMediaCache.has(cleanId)) {
                return Promise.resolve(window.uploadedMediaCache.get(cleanId));
            }
            return new Promise((resolve) => {
                const fetchFromStore = () => {
                    if (!db || !db.objectStoreNames.contains('media')) return resolve(null);
                    try {
                        const tx = db.transaction(['media'], 'readonly');
                        const req = tx.objectStore('media').get(cleanId);
                        req.onsuccess = () => resolve(req.result || null);
                        req.onerror = () => resolve(null);
                    } catch (e) {
                        resolve(null);
                    }
                };
                if (!db) {
                    initDB().then(() => fetchFromStore());
                } else {
                    fetchFromStore();
                }
            });
        }
        window.getMediaBlobFromDB = getMediaBlobFromDB;

        async function resolveActiveMediaBlobUrl(id, fallbackUrl) {
            const cleanId = id ? String(id).replace(/^idb:\/\//, '') : '';
            const blob = await getMediaBlobFromDB(cleanId);
            if (blob instanceof Blob) {
                revokeActiveMediaBlobUrl();
                const objUrl = URL.createObjectURL(blob);
                window._activeMediaBlobUrl = objUrl;
                return objUrl;
            }
            if (fallbackUrl && !String(fallbackUrl).startsWith('idb://')) {
                return fallbackUrl;
            }
            return '';
        }
        window.resolveActiveMediaBlobUrl = resolveActiveMediaBlobUrl;

        function rehydrateMediaFromDB() {
            return new Promise((resolve) => {
                if (!db || !db.objectStoreNames.contains('media')) return resolve(false);
                try {
                    const tx = db.transaction(['media'], 'readonly');
                    const store = tx.objectStore('media');
                    window.uploadedMediaCache = window.uploadedMediaCache || new Map();
                    window.availableMediaBlobIds = window.availableMediaBlobIds || new Set();

                    // Escaneo ligero solo de claves (getAllKeys) sin cargar cientos de MB de audio en RAM al inicio
                    if (typeof store.getAllKeys === 'function') {
                        const keysReq = store.getAllKeys();
                        keysReq.onsuccess = () => {
                            const keys = keysReq.result || [];
                            keys.forEach(itemId => {
                                window.availableMediaBlobIds.add(itemId);
                                if (appData && appData.podcasts) {
                                    const item = appData.podcasts.find(p => p.id === itemId);
                                    if (item && (!item.audioUrl || item.audioUrl.startsWith('blob:'))) {
                                        item.audioUrl = 'idb://' + itemId;
                                    }
                                }
                            });
                            resolve(true);
                        };
                        keysReq.onerror = () => resolve(false);
                    } else {
                        const cursorReq = store.openCursor();
                        cursorReq.onsuccess = (e) => {
                            const cursor = e.target.result;
                            if (cursor) {
                                const itemId = cursor.key;
                                window.availableMediaBlobIds.add(itemId);
                                if (appData && appData.podcasts) {
                                    const item = appData.podcasts.find(p => p.id === itemId);
                                    if (item && (!item.audioUrl || item.audioUrl.startsWith('blob:'))) {
                                        item.audioUrl = 'idb://' + itemId;
                                    }
                                }
                                cursor.continue();
                            } else {
                                resolve(true);
                            }
                        };
                        cursorReq.onerror = () => resolve(false);
                    }
                } catch (e) {
                    resolve(false);
                }
            });
        }

        function loadStoredAppData() {
            let localTimestamp = 0;
            const defaultTimestamp = (defaultAppData && defaultAppData._lastSaved) ? defaultAppData._lastSaved : 0;

            // 1. Si el archivo HTML contiene datos embebidos exportados previamente
            if (typeof window !== 'undefined' && window.initialAppData && typeof window.initialAppData === 'object') {
                appData = JSON.parse(JSON.stringify(window.initialAppData));
            }

            // 2. Leer LocalStorage y verificar si es más reciente
            try {
                const localSaved = localStorage.getItem(STORAGE_KEY);
                if (localSaved) {
                    const parsed = JSON.parse(localSaved);
                    if (parsed && typeof parsed === 'object') {
                        localTimestamp = parsed._lastSaved || 0;
                        const currentTimestamp = (appData && appData._lastSaved) ? appData._lastSaved : defaultTimestamp;
                        if (localTimestamp >= currentTimestamp) {
                            appData = parsed;
                        }
                    }
                }
            } catch (err) {
                console.warn("LocalStorage read error", err);
            }

            ensureDataIntegrity();
            renderAll();

            // 3. Consultar IndexedDB con criterio estricto de timestamp más reciente
            initDB().then((ok) => {
                if (!ok || !db) return;
                try {
                    const transaction = db.transaction(['store'], 'readonly');
                    const store = transaction.objectStore('store');
                    const request = store.get('appData');
                    request.onsuccess = async () => {
                        const idbData = request.result;
                        if (idbData && typeof idbData === 'object') {
                            const idbTimestamp = idbData._lastSaved || 0;
                            const currentTimestamp = (appData && appData._lastSaved) ? appData._lastSaved : 0;

                            // Solo prevalece IndexedDB si su fecha de guardado es igual o posterior
                            if (idbTimestamp >= currentTimestamp && idbTimestamp >= localTimestamp) {
                                appData = idbData;
                            }
                        }

                        await rehydrateMediaFromDB();

                        ensureDataIntegrity();
                        renderAll();
                        if (typeof renderAdminLists === "function") renderAdminLists();
                    };
                } catch (e) {
                    console.warn("IndexedDB load error", e);
                }
            });
        }


        function ensureDataIntegrity() {
            // PURGA PERMANENTE DE DATOS DE EJEMPLO REMANENTES
            if (appData.homeBanners && Array.isArray(appData.homeBanners)) {
                appData.homeBanners = appData.homeBanners.filter(b => !['hb_1', 'hb_2', 'hb_3'].includes(b.id));
            }
            if (appData.podcasts && Array.isArray(appData.podcasts)) {
                appData.podcasts = appData.podcasts.filter(p => !['po1', 'po2', 'po_se_fiel', 'po3', 'po4', 'po5'].includes(p.id));
            }
            if (appData.events && Array.isArray(appData.events)) {
                appData.events = appData.events.filter(e => !['ev1', 'ev2', 'ev3', 'ev4', 'ev5'].includes(e.id));
            }
            if (appData.testimonials && Array.isArray(appData.testimonials)) {
                appData.testimonials = appData.testimonials.filter(t => !['t1', 't2', 't3'].includes(t.id));
            }
            if (appData.prayers && Array.isArray(appData.prayers)) {
                appData.prayers = appData.prayers.filter(pr => !['pr1'].includes(pr.id));
            }
            if (appData.visitors && Array.isArray(appData.visitors)) {
                appData.visitors = appData.visitors.filter(v => !['vis1'].includes(v.id));
            }
            if (appData.recentTracks && Array.isArray(appData.recentTracks)) {
                appData.recentTracks = appData.recentTracks.filter(rt => !['rt1', 'rt2', 'rt3', 'rt4', 'rt5'].includes(rt.id));
            }
            // Purga solo IDs de demostración conocidos; conservar altas reales del CMS
            if (appData.pastors && Array.isArray(appData.pastors)) {
                appData.pastors = appData.pastors.filter(p => !['pas_demo', 'pastor_demo'].includes(p.id));
            }
            if (appData.announcers && Array.isArray(appData.announcers)) {
                appData.announcers = appData.announcers.filter(a => !['loc_demo', 'announcer_demo'].includes(a.id));
            }
            if (appData.sedes && appData.sedes.anexos && Array.isArray(appData.sedes.anexos)) {
                appData.sedes.anexos = appData.sedes.anexos.filter(a => !['an1', 'an2', 'an3', 'an4'].includes(a.id));
            }
            if (appData.missionary) {
                if (Array.isArray(appData.missionary.campaigns)) {
                    appData.missionary.campaigns = appData.missionary.campaigns.filter(m => !['mis1', 'mis2'].includes(m.id));
                }
                if (Array.isArray(appData.missionary.testimonies)) {
                    appData.missionary.testimonies = appData.missionary.testimonies.filter(t => !['mt1', 'mt2'].includes(t.id));
                }
            }
            if (appData.information) {
                if (Array.isArray(appData.information.events)) appData.information.events = appData.information.events.filter(e => e.id !== 'e1');
                if (Array.isArray(appData.information.cults)) appData.information.cults = appData.information.cults.filter(c => c.id !== 'c1');
                if (Array.isArray(appData.information.annexes)) appData.information.annexes = appData.information.annexes.filter(a => a.id !== 'a1');
                if (Array.isArray(appData.information.missionary)) appData.information.missionary = appData.information.missionary.filter(m => m.id !== 'm1');
                if (Array.isArray(appData.information.gallery)) appData.information.gallery = appData.information.gallery.filter(g => !['g1', 'g2', 'g3', 'g4'].includes(g.id));
            }
            if (!appData.homeBanners || !Array.isArray(appData.homeBanners)) appData.homeBanners = JSON.parse(JSON.stringify(defaultHomeBanners));
            if (!appData.general) appData.general = JSON.parse(JSON.stringify(defaultAppData.general));
            if (appData.general) {
                if (!appData.general.churchAcronym) appData.general.churchAcronym = "IMCOTNV";
                if (!appData.general.acronym) appData.general.acronym = "IMCOTNV";
                if (!appData.general.motto) appData.general.motto = "Oración • Palabra • Misión";
                if (!appData.general.churchName) {
                    appData.general.churchName = "Iglesia Misionera Casa de Oración para Todas las Naciones";
                }
                if (!appData.general.churchSubtitle) {
                    appData.general.churchSubtitle = '"Predicando el Evangelio a Toda Nación"';
                }
                if (!appData.general.radioTitle) {
                    appData.general.radioTitle = "RADIOVISIÓN RTV";
                }
                if (!appData.general.radioSubtitle) {
                    appData.general.radioSubtitle = "Ministerio Radial de IMCOTNV";
                }
                if (!appData.general.heroBannerTag) {
                    appData.general.heroBannerTag = "IMCOTNV • Oración • Palabra • Misión";
                }
                if (!appData.general.navSubtitle) {
                    appData.general.navSubtitle = '"Predicando el Evangelio a Toda Nación"';
                }
                if (!appData.general.navSubtitle_qu) appData.general.navSubtitle_qu = '"Tukuy Suyukunaman Allin Willakuyta Willaspa"';
                if (!appData.general.churchSubtitle_qu) appData.general.churchSubtitle_qu = '"Tukuy Suyukunaman Allin Willakuyta Willaspa"';
                if (!appData.general.heroTitle_qu) appData.general.heroTitle_qu = 'Mañakuway hinaspa herenciatan qosqayki nacionkunata';
                if (!appData.general.heroBannerTag_qu) appData.general.heroBannerTag_qu = 'IMCOTNV • Mañakuy • Simi • Misión';
                if (!appData.general.radioSubtitle_qu) appData.general.radioSubtitle_qu = 'IMCOTNV Radial Ministerio';
            }
            if (!appData.liveService) appData.liveService = JSON.parse(JSON.stringify(defaultAppData.liveService));
            if (!appData.liveService.forceLive) appData.liveService.forceLive = 'auto';
            if (!appData.liveService.title_qu) appData.liveService.title_qu = 'Kawsarichiy, Yupaychay Chuya Yachachikuy Huñunakuy';
            if (!appData.liveService.schedule_qu) appData.liveService.schedule_qu = 'Miercoles 07:00 PM • Domingokuna 10:00 AM & 06:00 PM';
            if (!appData.about) appData.about = JSON.parse(JSON.stringify(defaultAppData.about));
            if (!appData.social) appData.social = JSON.parse(JSON.stringify(defaultAppData.social));
            if (appData.liveService) {
                if (!appData.liveService.youtubeUrl || appData.liveService.youtubeUrl.includes('search_query=') || appData.liveService.youtubeUrl.includes('Radio+Vision')) {
                    appData.liveService.youtubeUrl = 'https://www.youtube.com/@radiovisionrtv2020';
                }
            }
            if (Array.isArray(appData.social)) {
                const ytSocial = appData.social.find(s => s.name === 'YouTube' || s.id === 'soc2');
                if (ytSocial) {
                    if (!ytSocial.url || ytSocial.url.includes('search_query=') || ytSocial.url.includes('Radio+Vision')) {
                        ytSocial.url = 'https://www.youtube.com/@radiovisionrtv2020';
                    }
                    ytSocial.handle = '@radiovisionrtv2020';
                }
            }
            if (!appData.programming || !Array.isArray(appData.programming)) appData.programming = JSON.parse(JSON.stringify(defaultAppData.programming));
            if (!appData.nowPlaying) appData.nowPlaying = JSON.parse(JSON.stringify(defaultAppData.nowPlaying));
            if (!appData.recentTracks || !Array.isArray(appData.recentTracks)) appData.recentTracks = JSON.parse(JSON.stringify(defaultAppData.recentTracks));
            if (!appData.doctrines || !Array.isArray(appData.doctrines)) appData.doctrines = JSON.parse(JSON.stringify(defaultAppData.doctrines));
            if (!appData.general.streamUrl || appData.general.streamUrl.includes('zeno.fm') || !/^https?:\/\//i.test(appData.general.streamUrl)) {
                appData.general.streamUrl = 'https://stream10.usastreams.com/8014/stream';
            }
            if (!appData.general.streamUrlQuechua || !/^https?:\/\//i.test(appData.general.streamUrlQuechua)) {
                appData.general.streamUrlQuechua = 'https://stream10.usastreams.com/8014/stream';
            }
            if (!appData.general.radios || !Array.isArray(appData.general.radios)) {
                appData.general.radios = [
                    {
                        id: 'radiovisionrtv',
                        name: 'RadioVisión RTV',
                        subtitle: 'Señal Principal (Castellano) • 24/7',
                        desc: 'Alabanzas de Avivamiento, Alianza y la Proclamación de la Sana Doctrina las 24 horas.',
                        streamUrl: appData.general.streamUrl,
                        lang: 'Español'
                    },
                    {
                        id: 'radiovisionrtv-quechua',
                        name: 'RadioVisión RTV Quechua',
                        subtitle: 'Señal Misionera Quechua (Runasimi) • 24/7',
                        desc: 'Diospa Simin Qillqa • Runasimi Rimaypi Uyariychis • Apurímac suyumanta.',
                        streamUrl: appData.general.streamUrlQuechua,
                        lang: 'Quechua'
                    }
                ];
            }
            if (!appData.general.logoChurch || appData.general.logoChurch.includes('WhatsApp Image')) { appData.general.logoChurch = 'img/logo-iglesia.jpg'; }
            if (!appData.general.logoRadio || appData.general.logoRadio.includes('WhatsApp Image')) { appData.general.logoRadio = 'img/logo-radio.jpg'; }
            if (!appData.information) appData.information = JSON.parse(JSON.stringify(defaultAppData.information));
            if (!appData.information.events || !Array.isArray(appData.information.events)) appData.information.events = JSON.parse(JSON.stringify(defaultAppData.information.events));
            if (!appData.information.cults || !Array.isArray(appData.information.cults)) appData.information.cults = JSON.parse(JSON.stringify(defaultAppData.information.cults));
            if (!appData.information.annexes || !Array.isArray(appData.information.annexes)) appData.information.annexes = JSON.parse(JSON.stringify(defaultAppData.information.annexes));
            if (!appData.information.missionary) appData.information.missionary = JSON.parse(JSON.stringify(defaultAppData.information.missionary));
            if (!appData.information.gallery || !Array.isArray(appData.information.gallery)) appData.information.gallery = JSON.parse(JSON.stringify(defaultAppData.information.gallery));
            if (!appData.podcasts || !Array.isArray(appData.podcasts)) appData.podcasts = JSON.parse(JSON.stringify(defaultAppData.podcasts));
            if (!appData.prayers || !Array.isArray(appData.prayers)) appData.prayers = JSON.parse(JSON.stringify(defaultAppData.prayers));
            if (!appData.testimonials || !Array.isArray(appData.testimonials)) appData.testimonials = JSON.parse(JSON.stringify(defaultAppData.testimonials));
            if (!appData.pastors || !Array.isArray(appData.pastors)) appData.pastors = JSON.parse(JSON.stringify(defaultAppData.pastors));
            if (!appData.cultoCentral) appData.cultoCentral = JSON.parse(JSON.stringify(defaultAppData.cultoCentral));
            if (!appData.events || !Array.isArray(appData.events)) appData.events = JSON.parse(JSON.stringify(defaultAppData.events));
            // sedes es un objeto { central, anexos }, no un array
            if (!appData.sedes || typeof appData.sedes !== 'object' || Array.isArray(appData.sedes)) {
                appData.sedes = JSON.parse(JSON.stringify(defaultAppData.sedes));
            } else {
                if (!appData.sedes.central || typeof appData.sedes.central !== 'object') {
                    appData.sedes.central = JSON.parse(JSON.stringify(defaultAppData.sedes.central));
                }
                if (!Array.isArray(appData.sedes.anexos)) {
                    appData.sedes.anexos = JSON.parse(JSON.stringify(defaultAppData.sedes.anexos || []));
                }
            }
            if (!appData.missionary) appData.missionary = JSON.parse(JSON.stringify(defaultAppData.missionary));
            if (!appData.ministries || !Array.isArray(appData.ministries)) appData.ministries = JSON.parse(JSON.stringify(defaultAppData.ministries));
            if (!appData.bibleSchool) appData.bibleSchool = JSON.parse(JSON.stringify(defaultAppData.bibleSchool));
            if (!appData.announcers || !Array.isArray(appData.announcers)) appData.announcers = JSON.parse(JSON.stringify(defaultAppData.announcers));
            if (!appData.visitors || !Array.isArray(appData.visitors)) appData.visitors = JSON.parse(JSON.stringify(defaultAppData.visitors));
            if (!appData.churchLocation) appData.churchLocation = JSON.parse(JSON.stringify(defaultAppData.churchLocation));

            // Saneamiento de datos pastorales existentes en caché
            if (Array.isArray(appData.pastors)) {
                appData.pastors.forEach(p => {
                    if (p.id === 'pas1' || p.category === 'principal') {
                        if (!p.role_qu) p.role_qu = 'Hatun Pastor & Director General';
                        if (!p.bio_qu) p.bio_qu = "Diospa qayasqan llapa Suyukunapaq Mañakuna Wasi (IMCOTNV) pastoreananpaq, chuya yachachikuyta willananpaq hinaspa Cristopi qespikuyta llapa suyukunaman willananpaq.";
                        if (!p.favoriteVerse_qu) p.favoriteVerse_qu = 'Salmos 2:8 - "Mañakuway, hinaspan herenciatan qosqayki nacionkunata..."';
                    } else if (p.id === 'pas2' || p.category === 'pastora') {
                        if (!p.role_qu) p.role_qu = 'Pastora & Warmikunapa Ayllukunapa Umalliqnin';
                        if (!p.bio_qu) p.bio_qu = "Mañakuypi, ayllukuna kallpachaypi, casado kaqkunapaq biblia yuyaychaypi hinaspa llapa Suyukunapaq Mañakuna Wasipi (IMCOTNV) espiritupi kallpachaypi llamk\'aq.";
                        if (!p.favoriteVerse_qu) p.favoriteVerse_qu = 'Proverbios 31:30 - "...Jehová Diosta manchakuq warmin ichaqa yupaychasqa kanqa."';
                    }
                });
            }

            // Saneamiento de locutores existentes en caché
            if (Array.isArray(appData.announcers)) {
                appData.announcers.forEach(a => {
                    if (a.id === 'loc1' || (a.name && a.name.includes('Richard'))) {
                        if (!a.show_qu) a.show_qu = 'Misionera Rimay';
                        if (!a.time_qu) a.time_qu = 'Domingokuna 08:00 AM & Lunes 07:00 PM';
                        if (!a.role_qu) a.role_qu = 'Llapan Umalliq';
                    } else if (a.id === 'loc4' || (a.name && a.name.includes('DJ'))) {
                        if (!a.show_qu) a.show_qu = 'Tukuy Tiempo Alabanza & Yupaychay';
                        if (!a.time_qu) a.time_qu = 'Lunesmanta Sabadokama 03:00 PM - 05:00 PM';
                        if (!a.role_qu) a.role_qu = 'Taki & Willaykuna';
                    }
                });
            }

            // Saneamiento de programación radial existente en caché
            if (Array.isArray(appData.programming)) {
                appData.programming.forEach(p => {
                    if (p.id === 'p1' || p.days === 'Lunes a Viernes') {
                        if (!p.days_qu) p.days_qu = 'Lunesmanta Vierneskama';
                        if (!p.title_qu) p.title_qu = 'Devocional & Kawsay Mañakuy';
                        if (!p.desc_qu) p.desc_qu = "Sapa punchaw devocional, kawsaypi mañakuy hinaspa Ch\'uya Qillqakunapi yuyaymanaykuna.";
                    } else if (p.id === 'p2' || p.days === 'Lunes a Sábado') {
                        if (!p.days_qu) p.days_qu = 'Lunesmanta Sabadokama';
                        if (!p.title_qu) p.title_qu = 'Tukuy Tiempo Alabanza & Yupaychay';
                        if (!p.desc_qu) p.desc_qu = 'Iñiqkunapa takinkuna, ñawpaq takikuna hawkayay instrumentalkunapas.';
                    }
                });
            }

            // Saneamiento de doctrinas existentes en caché
            if (Array.isArray(appData.doctrines)) {
                appData.doctrines.forEach(d => {
                    if (d.id === 'd1' && !d.title_qu) { d.title_qu = "Ch\'uya Qillqakuna"; d.desc_qu = "Bibliaqa Diospa kikin siminmi, mana pantasqa hinaspapas iñiyninchikpi kawsayninchikpi hatun kamachiq."; }
                    if (d.id === 'd2' && !d.title_qu) { d.title_qu = "Kimsantin Ch\'uya Dios"; d.desc_qu = "Huklla Diosllapim iñinchik, kimsantin personakunapi: Yaya, Churi hinaspa Santo Espiritu."; }
                    if (d.id === 'd3' && !d.title_qu) { d.title_qu = "Cristopi Qespikuy"; d.desc_qu = "Qespikuyqa Diospa gratis qokuyninmi, Jesucristopa cruzpi wañusqanpi kawsarimusqanpipas iñispa chaskisqa."; }
                    if (d.id === 'd4' && !d.title_qu) { d.title_qu = "Santo Espiritu"; d.desc_qu = "Paymi iñiqkunapa sonqonpi musuq kawsayta qun, kawsayninchikta sellan hinaspa donkunata qun llamk\'ananchikpaq."; }
                });
            }

            // Saneamiento de categorías y tipo de contenido multimedia en Podcasts
            if (appData.podcasts && Array.isArray(appData.podcasts)) {
                appData.podcasts.forEach(po => {
                    const norm = normalizePodCategory(po.category);
                    if (norm === 'predicas') po.category = 'Prédicas';
                    else if (norm === 'musica') po.category = 'Música';
                    else if (norm === 'testimonios') po.category = 'Testimonios';
                    if (!po.mediaType) {
                        po.mediaType = isPodcastVideo(po.audioUrl, po.mediaType) ? 'video' : 'audio';
                    }
                    if (po.mediaType === 'video' && (!po.audioUrl || String(po.audioUrl).trim() === '')) {
                        const q = encodeURIComponent((po.title || 'Predica Cristiana') + ' ' + (po.desc || 'Pastor Richard Edgardo Dávila Becerra'));
                        po.audioUrl = `https://www.youtube.com/embed?listType=search&list=${q}`;
                    }
                });
            }

            // Asegurar citas bíblicas
            if (!appData.firstSteps || appData.firstSteps.length === 0) {
                appData.firstSteps = JSON.parse(JSON.stringify(defaultFirstSteps));
            } else {
                appData.firstSteps = appData.firstSteps.map(fs => {
                    const found = defaultFirstSteps.find(d => d.id === fs.id);
                    if (!fs.citation && found) {
                        fs.citation = found.citation;
                    } else if (!fs.citation) {
                        fs.citation = 'Sagradas Escrituras';
                    }
                    return fs;
                });
            }

            // Asegurar que Facebook apunte a la página solicitada si está en default
            const fb = appData.social.find(s => s.name === 'Facebook');
            if (fb && (!fb.url || fb.url === 'https://facebook.com')) {
                fb.url = 'https://www.facebook.com/radiovisionrtv';
                fb.handle = '/radiovisionrtv';
            }

            // adminUsers NUNCA se hidratan en clientes públicos (emails/roles sensibles).
            // Solo staff con sesión puede cargar/seedear el listado (staffData / panel admin).
            const isStaffSession = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('rtv_admin_auth') === 'true');
            if (!isStaffSession) {
                appData.adminUsers = [];
            } else if (!appData.adminUsers || !Array.isArray(appData.adminUsers)) {
                appData.adminUsers = [];
            }
        }

        function safeStringifyWithReplacer(obj, replacer) {
            try {
                const seen = new WeakSet();
                return JSON.stringify(obj, (key, value) => {
                    if (typeof value === 'object' && value !== null) {
                        if (seen.has(value)) {
                            return undefined;
                        }
                        seen.add(value);
                    }
                    if (typeof replacer === 'function') {
                        return replacer(key, value);
                    }
                    return value;
                });
            } catch (err) {
                console.warn('safeStringifyWithReplacer aviso:', err);
                return JSON.stringify({});
            }
        }

        let firebaseSaveDebounceTimer = null;

        function sanitizeDataForFirestore(data) {
            try {
                const str = safeStringifyWithReplacer(data, (key, value) => {
                    // Excluir colecciones operativas pesadas o redundantes del documento principal
                    if (key === 'backups' || key === 'auditLogs' || key === 'errorLogs') {
                        return undefined;
                    }
                    // Prevenir almacenar Base64 kilométricas en Firestore para cuidar la cuota gratuita (Spark Plan)
                    if (typeof value === 'string' && value.startsWith('data:')) {
                        if (value.length > 50000) {
                            console.warn(`[Firestore Quota] Podando cadena Base64 pesada en campo "${key}" (${value.length} bytes) para proteger cuota de Firebase.`);
                            return '';
                        }
                    }
                    if ((key === 'audioUrl' || key === 'imageUrl') && typeof value === 'string' && value.length > 50000) {
                        return '';
                    }
                    return value;
                });
                return JSON.parse(str);
            } catch (e) {
                return data;
            }
        }

        function buildShardedFirestorePayloads(data) {
            const sanitized = sanitizeDataForFirestore(data);
            const ts = sanitized._lastSaved || Date.now();

            const mediaPayload = {
                _lastSaved: ts,
                podcasts: Array.isArray(sanitized.podcasts) ? sanitized.podcasts : [],
                gallery: (sanitized.information && Array.isArray(sanitized.information.gallery)) ? sanitized.information.gallery : [],
                // Testimonios públicos (sin PII pastoral) viajan en el shard de lectura abierta
                testimonials: Array.isArray(sanitized.testimonials) ? sanitized.testimonials : []
            };

            // Solo PII pastoral — lectura restringida por firestore.rules (isPastor/isAdmin)
            const communityPayload = {
                _lastSaved: ts,
                prayers: Array.isArray(sanitized.prayers) ? sanitized.prayers : [],
                visitors: Array.isArray(sanitized.visitors) ? sanitized.visitors : []
            };

            // El documento principal conserva la configuración estructural y colecciones ligeras
            const mainPayload = Object.assign({}, sanitized);
            delete mainPayload.podcasts;
            delete mainPayload.prayers;
            delete mainPayload.testimonials;
            delete mainPayload.visitors;
            delete mainPayload.adminUsers; // staff solo en staffData (lectura restringida)
            if (mainPayload.information) {
                mainPayload.information = Object.assign({}, mainPayload.information);
                delete mainPayload.information.gallery;
            }
            mainPayload._shardedVersion = 3;

            const staffUsers = Array.isArray(sanitized.adminUsers)
                ? sanitized.adminUsers.map(function (u) {
                    if (!u || typeof u !== 'object') return u;
                    var copy = Object.assign({}, u);
                    delete copy.password;
                    return copy;
                })
                : [];
            const staffPayload = {
                _lastSaved: ts,
                adminUsers: staffUsers
            };

            return { mainPayload, mediaPayload, communityPayload, staffPayload };
        }

        function isStaffClientSession() {
            try {
                if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('rtv_admin_auth') === 'true') return true;
                if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser && !firebase.auth().currentUser.isAnonymous) return true;
            } catch (e) {}
            return false;
        }

        function applyStaffUsersFromCloud(users) {
            if (!Array.isArray(users)) return;
            appData.adminUsers = users.map(function (u) {
                if (!u || typeof u !== 'object') return u;
                var copy = Object.assign({}, u);
                delete copy.password;
                return copy;
            });
        }

        function subscribeStaffSensitiveShards() {
            if (!firebaseDB || typeof firebaseDB.collection !== 'function') return;
            if (window._rtvStaffShardsSubscribed) return;
            window._rtvStaffShardsSubscribed = true;
            const colRef = firebaseDB.collection('radiovision_app');

            colRef.doc('staffData').onSnapshot(function (doc) {
                if (!doc.exists) return;
                const sData = doc.data() || {};
                if (Array.isArray(sData.adminUsers)) {
                    isSyncingFromCloud = true;
                    applyStaffUsersFromCloud(sData.adminUsers);
                    if (typeof renderAdminUsersList === 'function') renderAdminUsersList();
                    isSyncingFromCloud = false;
                }
            }, function (err) {
                console.warn('Aviso shard staffData:', err);
            });

            colRef.doc('communityData').onSnapshot(function (doc) {
                if (!doc.exists) return;
                const cData = doc.data() || {};
                if (cData._lastSaved && cData._lastSaved >= (appData._lastSaved || 0)) {
                    isSyncingFromCloud = true;
                    if (Array.isArray(cData.prayers)) appData.prayers = cData.prayers;
                    if (Array.isArray(cData.visitors)) appData.visitors = cData.visitors;
                    if (Array.isArray(cData.testimonials) && (!appData.testimonials || !appData.testimonials.length)) {
                        appData.testimonials = cData.testimonials;
                    }
                    ensureDataIntegrity();
                    renderAll();
                    if (typeof renderAdminLists === 'function') renderAdminLists();
                    isSyncingFromCloud = false;
                }
            }, function (err) {
                console.warn('Aviso shard communityData:', err);
            });
        }
        window.subscribeStaffSensitiveShards = subscribeStaffSensitiveShards;

        async function saveAppData() {
            if (!appData) return;
            appData._lastSaved = Date.now();

            // 1. Guardar de forma robusta e ilimitada en IndexedDB
            if (!db) {
                await initDB();
            }
            if (db) {
                try {
                    const tx = db.transaction(['store'], 'readwrite');
                    const store = tx.objectStore('store');
                    store.put(appData, 'appData');
                } catch (err) {
                    console.warn("IndexedDB save error", err);
                }
            }

            // 2. Guardar en LocalStorage con protección total contra saturación de cuota
            try {
                const staffLocal = isStaffClientSession();
                const cleanStr = safeStringifyWithReplacer(appData, (key, value) => {
                    if (key === 'backups' || key === 'auditLogs' || key === 'errorLogs') {
                        return undefined;
                    }
                    // Visitantes: no persistir staff ni PII pastoral en localStorage
                    if (!staffLocal && (key === 'adminUsers' || key === 'prayers' || key === 'visitors')) {
                        return key === 'adminUsers' ? [] : [];
                    }
                    if ((key === 'audioUrl' || key === 'imageUrl') && typeof value === 'string' && value.length > 150000) {
                        return '';
                    }
                    return value;
                });
                localStorage.setItem(STORAGE_KEY, cleanStr);
            } catch (err) {
                console.warn("LocalStorage save quota exceeded, trimming...", err);
                try {
                    const minimalData = JSON.parse(JSON.stringify(appData, (key, value) => {
                        if (key === 'backups' || key === 'auditLogs' || key === 'errorLogs') return undefined;
                        if (key === 'podcasts' && Array.isArray(value) && value.length > 40) {
                            return value.slice(0, 40);
                        }
                        if (typeof value === 'string' && value.length > 40000) return '';
                        return value;
                    }));
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(minimalData));
                } catch (e2) {}
            }

            // 3. Sincronizar en la Nube con Google Firebase Firestore (Sharding en mainData, mediaData, communityData + Debounce de 1.5s)
            const hasAdminAccess = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('rtv_admin_auth') === 'true') ||
                                   (typeof firebaseAuth !== 'undefined' && firebaseAuth && firebaseAuth.currentUser && !firebaseAuth.currentUser.isAnonymous);
            if (typeof updateSyncStatusIndicator === 'function') updateSyncStatusIndicator('syncing');
            if (firebaseDocRef && firebaseDB && !isSyncingFromCloud && hasAdminAccess) {
                clearTimeout(firebaseSaveDebounceTimer);
                firebaseSaveDebounceTimer = setTimeout(() => {
                    try {
                        const { mainPayload, mediaPayload, communityPayload, staffPayload } = buildShardedFirestorePayloads(appData);
                        const colRef = firebaseDB.collection('radiovision_app');
                        const batch = firebaseDB.batch();
                        // Purgar adminUsers legado del documento público
                        mainPayload.adminUsers = firebase.firestore.FieldValue.delete();
                        batch.set(firebaseDocRef, mainPayload, { merge: true });
                        batch.set(colRef.doc('mediaData'), mediaPayload, { merge: true });
                        batch.set(colRef.doc('communityData'), communityPayload, { merge: true });
                        batch.set(colRef.doc('staffData'), staffPayload, { merge: true });

                        batch.commit().then(() => {
                            showToast("☁️ ✓ ¡Cambios transmitidos en vivo a todo el mundo!");
                            if (typeof updateSyncStatusIndicator === 'function') updateSyncStatusIndicator('synced');
                        }).catch(err => {
                            console.warn("Aviso al guardar en Firebase:", err);
                            const isPerm = err.code === 'permission-denied' || (err.message && err.message.toLowerCase().includes('permission'));
                            if (isPerm) {
                                updateCloudStatusUI('error', 'Permisos de Firestore bloqueados');
                            }
                        });
                    } catch (cloudErr) {
                        console.warn("Error al enviar a Firebase:", cloudErr);
                    }
                }, 1500);
            }

            renderAll();
            showToast("✓ ¡Cambios guardados con éxito!");
        }

        function resetDefaultData() {
            if (confirm("¿Estás seguro de restaurar los datos predeterminados originales?")) {
                appData = JSON.parse(JSON.stringify(defaultAppData));
                saveAppData();
                alert("Datos restaurados correctamente.");
            }
        }

        async function exportUpdatedHtmlFile() {
            try {
                showToast("Preparando archivo completo para compartir... ⏳", "info");

                // 1. Asegurar timestamp actualizado para que prevalezca en cualquier dispositivo
                appData._lastSaved = Date.now();
                if (typeof saveAppData === 'function') {
                    await saveAppData();
                }
                if (typeof renderAll === 'function') {
                    renderAll(true);
                }

                // 2. Obtener el código HTML base del documento actual
                let htmlSource = '<!DOCTYPE html>\n' + document.documentElement.outerHTML;

                // 3. Limpiar cualquier estado temporal de modales para que no aparezcan abiertos al inicio
                htmlSource = htmlSource.replace(/id="adminModal" class="[^"]*"/, 'id="adminModal" class="hidden fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"');
                htmlSource = htmlSource.replace(/id="adminDashboardView" class="[^"]*"/, 'id="adminDashboardView" class="hidden space-y-6"');
                htmlSource = htmlSource.replace(/id="adminLoginView" class="[^"]*"/, 'id="adminLoginView" class="space-y-6 max-w-md mx-auto py-8"');
                htmlSource = htmlSource.replace(/id="adminLogoutBtn" class="[^"]*"/, 'id="adminLogoutBtn" class="hidden bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1 rounded-xl text-xs font-bold transition-colors"');
                htmlSource = htmlSource.replace(/id="itemModal" class="[^"]*"/, 'id="itemModal" class="hidden fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"');
                htmlSource = htmlSource.replace(/id="musicFolderUploadModal" class="[^"]*"/, 'id="musicFolderUploadModal" class="hidden fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"');
                htmlSource = htmlSource.replace(/id="bulkEditModal" class="[^"]*"/, 'id="bulkEditModal" class="hidden fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"');
                htmlSource = htmlSource.replace(/id="adm-tab-firebase" class="[^"]*"/, 'id="adm-tab-firebase" class="admin-tab-content hidden space-y-6"');
                htmlSource = htmlSource.replace(/id="galleryLightboxModal" class="[^"]*"/, 'id="galleryLightboxModal" class="hidden fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 transition-all select-none"');
                htmlSource = htmlSource.replace(/id="firebasePermissionModal" class="[^"]*"/, 'id="firebasePermissionModal" class="hidden fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"');

                // 4. Inyectar o actualizar los datos del sistema directamente en el archivo HTML
                const initialDataScript = `<script id="initialAppDataScript">window.initialAppData = ${JSON.stringify(appData)};</script>`;
                if (htmlSource.includes('id="initialAppDataScript"')) {
                    htmlSource = htmlSource.replace(/<script id="initialAppDataScript">[\s\S]*?<\/script>/, initialDataScript);
                } else if (htmlSource.includes('<script src="js/security.js">')) {
                    htmlSource = htmlSource.replace('<script src="js/security.js">', initialDataScript + '\n    <script src="js/security.js">');
                } else if (htmlSource.includes('<script defer src="js/app.js">')) {
                    htmlSource = htmlSource.replace('<script defer src="js/app.js">', initialDataScript + '\n    <script defer src="js/app.js">');
                } else {
                    htmlSource = htmlSource.replace('</body>', initialDataScript + '\n</body>');
                }

                const blob = new Blob([htmlSource], { type: 'text/html;charset=utf-8' });

                // 6. Intentar guardar directamente en el archivo si el navegador lo soporta (Chrome / Edge File System API)
                if (window.showSaveFilePicker) {
                    try {
                        const handle = await window.showSaveFilePicker({
                            suggestedName: 'index_2.html',
                            types: [{
                                description: 'Archivo HTML Web (*.html)',
                                accept: { 'text/html': ['.html'] }
                            }]
                        });
                        const writable = await handle.createWritable();
                        await writable.write(blob);
                        await writable.close();
                        showToast("✓ ¡Archivo index_2.html guardado y actualizado con éxito!", "info");
                        alert("✓ ¡Archivo guardado con éxito!\n\nTodos tus cambios quedaron grabados directamente en el archivo HTML.\nAhora cuando compartas este archivo, cualquier persona verá exactamente todo tu trabajo.");
                        return;
                    } catch (pickerErr) {
                        if (pickerErr.name === 'AbortError') {
                            showToast("Operación cancelada.");
                            return;
                        }
                    }
                }

                // 7. Descarga automática directa (fallback universal compatible con todos los navegadores)
                const downloadUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = downloadUrl;
                a.download = 'index_2.html';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                setTimeout(() => URL.revokeObjectURL(downloadUrl), 5000);

                showToast("✓ ¡Archivo index_2.html descargado con todos tus cambios!", "info");
                alert("✓ ¡Archivo listo para compartir!\n\nSe ha descargado 'index_2.html' con todos tus cambios incluidos.\n\n👉 Para compartir tu trabajo:\nEnvía este archivo descargado por WhatsApp, correo o Google Drive. Cualquier persona que lo abra verá todos tus cambios de inmediato.");
            } catch (err) {
                console.error("Error al exportar archivo para compartir:", err);
                showToast("Error al generar el archivo para compartir.", "error");
            }
        }

        function exportJsonBackup() {
            try {
                const dataStr = JSON.stringify(appData, null, 2);
                const blob = new Blob([dataStr], { type: 'application/json;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `RadioVisionRTV_Respaldo_${new Date().toISOString().slice(0, 10)}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                setTimeout(() => URL.revokeObjectURL(url), 2000);
                showToast("✓ Copia de seguridad en JSON descargada.");
            } catch (e) {
                showToast("Error al exportar respaldo JSON", "error");
            }
        }

        function importJsonBackup(event) {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const imported = JSON.parse(e.target.result);
                    if (imported && typeof imported === 'object') {
                        if (confirm("¿Estás seguro de cargar esta copia de respaldo? Se actualizará todo el contenido actual.")) {
                            appData = imported;
                            appData._lastSaved = Date.now();
                            saveAppData();
                            renderAll();
                            if (typeof renderAdminLists === "function") renderAdminLists();
                            showToast("✓ ¡Respaldo importado y aplicado correctamente!");
                        }
                    } else {
                        showToast("El archivo seleccionado no es válido.", "error");
                    }
                } catch (err) {
                    showToast("Error al leer el archivo JSON.", "error");
                }
            };
            reader.readAsText(file);
        }


        // ==============================================================
        // CLOUD SYNCHRONIZATION WITH GOOGLE FIREBASE FIRESTORE
        // ==============================================================
        let firebaseDB = null;
        let firebaseDocRef = null;
        let isSyncingFromCloud = false;

        function updateCloudStatusUI(status, message) {
            const badge = document.getElementById('firebaseConnectionBadge');
            const topIndicator = document.getElementById('cloudSyncIndicator');
            const topDot = document.getElementById('cloudSyncDot');
            const topText = document.getElementById('cloudSyncText');

            if (status === 'connected') {
                if (badge) {
                    badge.className = "px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40";
                    badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span><span>🟢 Conectado en Vivo (Nube Activa)</span>`;
                }
                if (topIndicator && topDot && topText) {
                    topIndicator.classList.remove('hidden');
                    topIndicator.className = "cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-sm transition-all";
                    topDot.className = "w-2 h-2 rounded-full bg-emerald-500 animate-pulse";
                    topText.innerText = "Nube en Vivo";
                }
            } else if (status === 'error') {
                if (badge) {
                    badge.className = "px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 bg-red-500/20 text-red-300 border border-red-500/40";
                    badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-red-400"></span><span>⚠️ Error: ${message || 'Revisa tus claves'}</span>`;
                }
                if (topIndicator && topDot && topText) {
                    topIndicator.classList.remove('hidden');
                    topIndicator.className = "cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-200";
                    topDot.className = "w-2 h-2 rounded-full bg-red-500";
                    topText.innerText = "Error Nube";
                }
            } else {
                if (badge) {
                    badge.className = "px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 bg-slate-800 text-slate-300 border border-slate-700";
                    badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-slate-400"></span><span>⚪ Modo Local (Sin Conectar)</span>`;
                }
                if (topIndicator && topDot && topText) {
                    topIndicator.classList.add('hidden');
                }
            }
        }

        function parseFirebaseConfigInput(raw) {
            if (!raw) return null;
            raw = raw.trim();
            const jsonMatch = raw.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    const sanitized = jsonMatch[0]
                        .replace(/\/\/.*$/gm, '')
                        .replace(/\/\*[\s\S]*?\*\//g, '')
                        .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
                        .replace(/'/g, '"')
                        .replace(/,\s*\}/g, '}');
                    return JSON.parse(sanitized);
                } catch (e) {
                    // Fallback seguro libre de eval / new Function (compatible con CSP estricto)
                    const extracted = {};
                    const pairRegex = /["']?([a-zA-Z0-9_]+)["']?\s*:\s*["']([^"']+)["']/g;
                    let m;
                    while ((m = pairRegex.exec(jsonMatch[0])) !== null) {
                        extracted[m[1]] = m[2];
                    }
                    return Object.keys(extracted).length > 0 ? extracted : null;
                }
            }
            return null;
        }

        function copyFirestoreRulesSnippet(btn) {
            // Instrucciones seguras: NUNCA copiar reglas permisivas (auth != null / prayers read:true).
            // Desplegar el archivo firestore.rules del repositorio (communityData restringido a pastor/admin).
            const rules = [
                'IMPORTANTE: No uses reglas permisivas del tipo "allow write: if request.auth != null".',
                'Despliega el archivo firestore.rules del proyecto con Firebase CLI:',
                '',
                '  firebase deploy --only firestore:rules',
                '',
                'Puntos clave del archivo oficial:',
                '- radiovision_app/communityData: read solo isPastor()/isAdmin() (PII)',
                '- radiovision_app/mainData|mediaData: read público, write staff RBAC',
                '- prayers/visitors: create público validado; read solo pastoral',
                '- Bloqueo por defecto: match /{document=**} { allow read, write: if false; }',
                '',
                'Si editas en Console, copia el contenido completo de firestore.rules del repo,',
                'no un snippet reducido. El archivo incluye RBAC (superadmin/admin/editor/pastor/multimedia).'
            ].join('\n');
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(rules).then(() => {
                    if (btn) {
                        const original = btn.innerHTML;
                        btn.innerHTML = `<i class="fa-solid fa-check text-emerald-400"></i> <span class="text-emerald-400">¡Instrucciones Copiadas!</span>`;
                        setTimeout(() => { btn.innerHTML = original; }, 3000);
                    }
                    showToast("✓ Usa firestore.rules del repo (firebase deploy --only firestore:rules).");
                }).catch(() => {
                    prompt("Instrucciones seguras para reglas Firestore:", rules);
                });
            } else {
                prompt("Instrucciones seguras para reglas Firestore:", rules);
            }
        }

        function openFirebasePermissionModal() {
            const modal = document.getElementById('firebasePermissionModal');
            if (modal) modal.classList.remove('hidden');
        }

        function closeFirebasePermissionModal() {
            const modal = document.getElementById('firebasePermissionModal');
            if (modal) modal.classList.add('hidden');
        }

        async function retrySyncAfterRulesFix() {
            closeFirebasePermissionModal();
            await syncAllToCloudNow();
        }

        function handleFirebaseError(err, context = 'sincronizar con la nube') {
            console.error(`Error Firebase (${context}):`, err);
            const errStr = (err && (err.message || err.code || err.toString())) || '';
            const isPermission = err.code === 'permission-denied' ||
                errStr.toLowerCase().includes('permission') ||
                errStr.toLowerCase().includes('insufficient');

            if (isPermission) {
                updateCloudStatusUI('error', 'Permisos de Firestore bloqueados');
                openFirebasePermissionModal();
            } else {
                updateCloudStatusUI('error', err.message || errStr);
                alert(`Error al ${context}: ` + (err.message || errStr));
            }
        }

        async function initFirebaseSync() {
            if (typeof firebase === 'undefined') {
                console.warn("SDK de Firebase no disponible o bloqueado.");
                return;
            }

            const storedStr = localStorage.getItem('rtv_firebase_config') || 
                              (appData && appData.firebaseConfig ? JSON.stringify(appData.firebaseConfig) : null) ||
                              (typeof DEFAULT_FIREBASE_CONFIG !== 'undefined' ? JSON.stringify(DEFAULT_FIREBASE_CONFIG) : null);
            if (!storedStr) {
                updateCloudStatusUI('offline');
                return;
            }

            try {
                const config = typeof storedStr === 'string' ? JSON.parse(storedStr) : storedStr;
                if (!config || !config.apiKey || !config.projectId) {
                    updateCloudStatusUI('offline');
                    return;
                }

                const inp = document.getElementById('firebaseConfigInput');
                if (inp && !inp.value) inp.value = JSON.stringify(config, null, 2);

                if (!firebase.apps.length) {
                    firebase.initializeApp(config);
                }

                // Autenticación anónima opcional si las reglas lo permiten o exigen
                if (firebase.auth) {
                    try {
                        if (!firebase.auth().currentUser) {
                            await firebase.auth().signInAnonymously();
                        }
                    } catch (authErr) {
                        console.warn("Firebase Auth anónimo aviso:", authErr.message);
                    }
                }

                firebaseDB = firebase.firestore();
                if (typeof window !== 'undefined') {
                    window.firestoreDb = firebaseDB;
                }
                const colRef = firebaseDB.collection('radiovision_app');
                firebaseDocRef = colRef.doc('mainData');
                const mediaDocRef = colRef.doc('mediaData');
                const communityDocRef = colRef.doc('communityData');

                updateCloudStatusUI('connected');

                // Sincronización en tiempo real (Realtime Listeners desacoplados por dominios)
                firebaseDocRef.onSnapshot((doc) => {
                    if (doc.exists) {
                        const cloudData = doc.data();
                        if (cloudData) {
                            checkAndTriggerLiveAlert(cloudData);
                        }
                        if (cloudData && cloudData._lastSaved) {
                            const localTs = appData._lastSaved || 0;
                            if (cloudData._lastSaved > localTs) {
                                isSyncingFromCloud = true;
                                const preservedMedia = {
                                    podcasts: appData.podcasts,
                                    gallery: appData.information && appData.information.gallery,
                                    prayers: appData.prayers,
                                    testimonials: appData.testimonials,
                                    visitors: appData.visitors,
                                    adminUsers: appData.adminUsers
                                };
                                // Nunca aplicar adminUsers públicos del shard mainData
                                const safeCloud = Object.assign({}, cloudData);
                                delete safeCloud.adminUsers;
                                appData = Object.assign({}, appData, safeCloud);
                                if (!Array.isArray(cloudData.podcasts) && Array.isArray(preservedMedia.podcasts)) appData.podcasts = preservedMedia.podcasts;
                                if (!Array.isArray(cloudData.prayers) && Array.isArray(preservedMedia.prayers)) appData.prayers = preservedMedia.prayers;
                                if (!Array.isArray(cloudData.testimonials) && Array.isArray(preservedMedia.testimonials)) appData.testimonials = preservedMedia.testimonials;
                                if (!Array.isArray(cloudData.visitors) && Array.isArray(preservedMedia.visitors)) appData.visitors = preservedMedia.visitors;
                                if (appData.information && !Array.isArray(appData.information.gallery) && Array.isArray(preservedMedia.gallery)) {
                                    appData.information.gallery = preservedMedia.gallery;
                                }
                                // Conservar staff local hasta que staffData hidrate (o limpiar si visitante)
                                if (isStaffClientSession() && Array.isArray(preservedMedia.adminUsers) && preservedMedia.adminUsers.length) {
                                    appData.adminUsers = preservedMedia.adminUsers;
                                } else if (!isStaffClientSession()) {
                                    appData.adminUsers = [];
                                }
                                ensureDataIntegrity();
                                if (typeof markSectionsDirty === "function") {
                                    markSectionsDirty(['inicio','nosotros','eventos','sedes','misionero','ministerios','radiovision','culto-en-vivo','galeria','biblioteca','testimonios','oracion']);
                                }
                                renderAll(false);
                                isSyncingFromCloud = false;
                                showToast("☁️ ¡Contenido actualizado en vivo desde la nube!", "info");
                            }
                        }
                    }
                }, (err) => {
                    console.warn("Aviso Firebase Firestore:", err);
                    handleFirebaseError(err, "escuchar cambios en vivo de la nube");
                });

                mediaDocRef.onSnapshot((doc) => {
                    if (doc.exists) {
                        const mData = doc.data();
                        if (mData && mData._lastSaved && mData._lastSaved >= (appData._lastSaved || 0)) {
                            isSyncingFromCloud = true;
                            if (Array.isArray(mData.podcasts)) appData.podcasts = mData.podcasts;
                            if (Array.isArray(mData.gallery)) {
                                if (!appData.information) appData.information = {};
                                appData.information.gallery = mData.gallery;
                            }
                            if (Array.isArray(mData.testimonials)) appData.testimonials = mData.testimonials;
                            ensureDataIntegrity();
                            if (typeof markSectionsDirty === "function") {
                                markSectionsDirty(['galeria','biblioteca','testimonios','inicio']);
                            }
                            renderAll(false);
                            isSyncingFromCloud = false;
                        }
                    }
                }, (err) => console.warn("Aviso shard mediaData:", err));

                if (isStaffClientSession()) {
                    subscribeStaffSensitiveShards();
                }
            } catch (err) {
                console.warn("Error inicializando Firebase:", err);
                handleFirebaseError(err, "inicializar Firebase");
            }
        }

        async function saveAndConnectFirebase() {
            const raw = document.getElementById('firebaseConfigInput').value;
            const parsed = parseFirebaseConfigInput(raw);
            if (!parsed || !parsed.apiKey || !parsed.projectId) {
                alert("Por favor pega una configuración válida de Firebase que contenga al menos 'apiKey' y 'projectId'.");
                return;
            }

            try {
                localStorage.setItem('rtv_firebase_config', JSON.stringify(parsed));
                appData.firebaseConfig = parsed;

                if (!firebase.apps.length) {
                    firebase.initializeApp(parsed);
                }

                if (firebase.auth) {
                    try {
                        if (!firebase.auth().currentUser) {
                            await firebase.auth().signInAnonymously();
                        }
                    } catch (authErr) {
                        console.warn("Firebase Auth anónimo aviso:", authErr.message);
                    }
                }

                firebaseDB = firebase.firestore();
                if (typeof window !== 'undefined') {
                    window.firestoreDb = firebaseDB;
                }
                firebaseDocRef = firebaseDB.collection('radiovision_app').doc('mainData');

                updateCloudStatusUI('connected');
                showToast("✓ ¡Conectado con éxito a Google Firebase!", "info");

                if (confirm("✓ ¡Conexión exitosa a Google Firebase!\n\n¿Deseas subir todo el contenido actual de la página a la nube en este momento para que todos los oyentes lo vean?")) {
                    await syncAllToCloudNow();
                }
            } catch (err) {
                handleFirebaseError(err, "conectar con Firebase");
            }
        }

        async function syncAllToCloudNow() {
            if (!firebaseDocRef || !firebaseDB) {
                alert("Primero debes guardar y conectar las claves de Firebase.");
                return;
            }

            try {
                showToast("Subiendo contenido a la nube... ☁️", "info");

                if (firebase.auth) {
                    try {
                        if (!firebase.auth().currentUser) {
                            await firebase.auth().signInAnonymously();
                        }
                    } catch (authErr) {
                        console.warn("Firebase Auth aviso:", authErr.message);
                    }
                }

                appData._lastSaved = Date.now();
                const { mainPayload, mediaPayload, communityPayload, staffPayload } = buildShardedFirestorePayloads(appData);
                const colRef = firebaseDB.collection('radiovision_app');
                const batch = firebaseDB.batch();
                mainPayload.adminUsers = firebase.firestore.FieldValue.delete();
                batch.set(firebaseDocRef, mainPayload, { merge: true });
                batch.set(colRef.doc('mediaData'), mediaPayload, { merge: true });
                batch.set(colRef.doc('communityData'), communityPayload, { merge: true });
                batch.set(colRef.doc('staffData'), staffPayload, { merge: true });

                await batch.commit();
                updateCloudStatusUI('connected');
                showToast("☁️ ✓ ¡Todo el contenido ha sido subido a la nube con éxito!");
                alert("✓ ¡Sincronización completada!\n\nTodo el contenido actual quedó grabado en la nube de Google Firebase.\nCualquier oyente que entre a la web verá estos datos en tiempo real.");
            } catch (err) {
                handleFirebaseError(err, "subir contenido a la nube");
            }
        }

        function disconnectFirebase() {
            if (confirm("¿Estás seguro de desconectar la sincronización de la nube? Volverás al modo local.")) {
                localStorage.removeItem('rtv_firebase_config');
                delete appData.firebaseConfig;
                firebaseDB = null;
                firebaseDocRef = null;
                updateCloudStatusUI('offline');
                document.getElementById('firebaseConfigInput').value = '';
                showToast("Sincronización en la nube desconectada.");
            }
        }

        window.onload = function() {
            initTheme();
            loadStoredAppData();
            initFirebaseSync();
            if (typeof initFirebaseAuthSessionListener === 'function') {
                initFirebaseAuthSessionListener();
            }
            initBibleSelector();
            // Preservar deep links / atajos PWA (#biblia, #radiovision, etc.)
            if (window.location.hash && typeof handleHashRouting === 'function') {
                handleHashRouting();
            } else if (typeof showSection === 'function') {
                showSection('inicio');
            }
            updateLiveServiceStatus();
            // Polling vivo solo con pestaña visible; 30s en background
            if (!window._liveStatusInterval) {
                window._liveStatusInterval = setInterval(function () {
                    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
                    updateLiveServiceStatus();
                }, 1000);
                document.addEventListener('visibilitychange', function () {
                    if (document.visibilityState === 'visible' && typeof updateLiveServiceStatus === 'function') {
                        updateLiveServiceStatus();
                    }
                });
            }
            if (!window.location.hash || window.location.hash === '#inicio') {
                window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                setTimeout(function() {
                    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                }, 50);
            }
        };


// ==============================================================
// INDICADOR VISUAL FLOTANTE DE SINCRONIZACIÓN (RESILIENCIA)
// ==============================================================
function updateSyncStatusIndicator(status) {
    const el = document.getElementById('adminFloatingSyncStatus');
    const dot = document.getElementById('adminSyncStatusDot');
    const text = document.getElementById('adminSyncStatusText');
    if (!el || !dot || !text) return;

    if (status === 'synced') {
        el.className = 'hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 transition-all shadow-sm';
        dot.className = 'w-2 h-2 rounded-full bg-emerald-400';
        text.textContent = 'Sincronizado en la nube';
    } else if (status === 'syncing') {
        el.className = 'hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-sky-500/15 border border-sky-500/30 text-sky-300 transition-all shadow-sm';
        dot.className = 'w-2 h-2 rounded-full bg-sky-400 animate-pulse';
        text.textContent = 'Sincronizando con la nube...';
    } else if (status === 'offline' || status === 'local') {
        el.className = 'hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300 transition-all shadow-sm';
        dot.className = 'w-2 h-2 rounded-full bg-amber-400';
        text.textContent = 'Guardado local - Modo sin conexión';
    } else if (status === 'error') {
        el.className = 'hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-red-500/15 border border-red-500/30 text-red-300 transition-all shadow-sm';
        dot.className = 'w-2 h-2 rounded-full bg-red-400';
        text.textContent = 'Error al sincronizar';
    }
}
window.updateSyncStatusIndicator = updateSyncStatusIndicator;

window.addEventListener('online', () => {
    showToast("🟢 Conexión a internet reanudada. Sincronizando...");
    updateSyncStatusIndicator('syncing');
    if (typeof syncAllToCloudNow === 'function') {
        syncAllToCloudNow().catch(() => updateSyncStatusIndicator('local'));
    }
});

window.addEventListener('offline', () => {
    showToast("⚠️ Modo sin conexión: los cambios se guardan localmente", "warning");
    updateSyncStatusIndicator('offline');
});

// ==============================================================
// EXPORTACIONES GLOBALES DE PERSISTENCIA Y SINCRONIZACIÓN
// ==============================================================
window.saveAppData = saveAppData;
window.resetDefaultData = resetDefaultData;
window.exportUpdatedHtmlFile = exportUpdatedHtmlFile;
window.syncAllToCloudNow = syncAllToCloudNow;
window.saveAndConnectFirebase = saveAndConnectFirebase;
window.disconnectFirebase = disconnectFirebase;
window.exportJsonBackup = exportJsonBackup;
window.importJsonBackup = importJsonBackup;
window.retrySyncAfterRulesFix = retrySyncAfterRulesFix;
window.copyFirestoreRulesSnippet = copyFirestoreRulesSnippet;
window.closeFirebasePermissionModal = closeFirebasePermissionModal;


// ==============================================================
// MÓDULO UI: NAVEGACIÓN, TEMA, INTERFAZ Y DESPLAZAMIENTOS
// ==============================================================

        // GESTIÓN DE APARTADOS (MOSTRAR SOLO EL SELECCIONADO Y OCULTAR LOS DEMÁS)
        // ==========================================
        const ALL_SECTIONS = [
            'inicio', 'nosotros', 'eventos', 'sedes', 'misionero',
            'ministerios', 'radiovision', 'culto-en-vivo', 'biblia',
            'galeria', 'biblioteca', 'testimonios', 'oracion', 'soy-nuevo', 'decision'
        ];

        const SECTION_ALIASES = {
            'pastores': 'nosotros',
            'liderazgo': 'nosotros',
            'culto-central': 'eventos',
            'cultos': 'eventos',
            'anexos': 'sedes',
            'ubicanos': 'sedes',
            'ubicacion': 'sedes',
            'informacion': 'eventos',
            'escuela-biblica': 'ministerios',
            'escuela': 'ministerios',
            'primeros-pasos': 'ministerios',
            'formacion': 'ministerios',
            'doctrinas': 'ministerios',
            'testimonio': 'testimonios',
            'podcasts': 'biblioteca',
            'predicas': 'biblioteca',
            'musica': 'biblioteca',
            'radio': 'radiovision',
            'programacion': 'radiovision',
            'decision': 'decision',
            'altar': 'decision',
            'culto-decision': 'decision',
            'decisiones': 'decision',
            'reconciliacion': 'decision',
            'arrepentimiento': 'decision',
            'culto': 'decision'
        };
        window.SECTION_ALIASES = SECTION_ALIASES;
        let currentActiveSection = 'inicio';
        window.currentActiveSection = currentActiveSection;

        const SECTION_RENDERERS_MAP = {
            'inicio': () => {
                if (typeof renderDailyVerse === 'function') renderDailyVerse();
                if (typeof renderHomeBanners === 'function') renderHomeBanners();
                if (typeof renderLiveService === 'function') renderLiveService();
            },
            'nosotros': () => {
                if (typeof renderNosotros === 'function') renderNosotros();
                if (typeof renderPastors === 'function') renderPastors();
            },
            'eventos': () => {
                if (typeof renderCultoCentral === 'function') renderCultoCentral();
                if (typeof renderEvents === 'function') renderEvents();
            },
            'sedes': () => {
                if (typeof renderSedes === 'function') renderSedes();
                if (typeof renderUbicanos === 'function') renderUbicanos();
            },
            'misionero': () => {
                if (typeof renderMissionary === 'function') renderMissionary();
            },
            'ministerios': () => {
                if (typeof renderMinistries === 'function') renderMinistries();
                if (typeof renderBibleSchool === 'function') renderBibleSchool();
            },
            'radiovision': () => {
                if (typeof renderRadioVision === 'function') renderRadioVision();
            },
            'culto-en-vivo': () => {
                if (typeof renderLiveService === 'function') renderLiveService();
            },
            'galeria': () => {
                if (typeof renderGallery === 'function') renderGallery();
            },
            'biblioteca': () => {
                if (typeof renderLibrary === 'function') renderLibrary();
            },
            'testimonios': () => {
                if (typeof renderTestimonials === 'function') renderTestimonials();
            },
            'oracion': () => {
                if (typeof renderPublicPrayers === 'function') renderPublicPrayers();
                if (typeof renderUbicanos === 'function') renderUbicanos();
                if (typeof renderSocial === 'function') renderSocial();
            },
            'soy-nuevo': () => {
                if (typeof renderSoyNuevo === 'function') renderSoyNuevo();
            },
            'decision': () => {
                if (typeof renderCultoDecision === 'function') renderCultoDecision();
            }
        };
        window.SECTION_RENDERERS_MAP = SECTION_RENDERERS_MAP;

        window._dirtySections = new Set();

        function flushDirtySection(sectionId) {
            const target = (typeof SECTION_ALIASES !== 'undefined' && SECTION_ALIASES[sectionId]) ? SECTION_ALIASES[sectionId] : sectionId;
            if (window.SECTION_RENDERERS_MAP && typeof window.SECTION_RENDERERS_MAP[target] === 'function') {
                try {
                    window.SECTION_RENDERERS_MAP[target]();
                    if (typeof applyLanguageTranslations === 'function' && typeof getAppLanguage === 'function') { applyLanguageTranslations(getAppLanguage()); }
                } catch(e) {
                    console.warn("Aviso al renderizar sección " + target, e);
                }
            }
        }
        window.flushDirtySection = flushDirtySection;

        function markSectionsDirty(sectionIds) {
            if (!window._dirtySections) window._dirtySections = new Set();
            (sectionIds || []).forEach(function (id) {
                if (id) window._dirtySections.add(id);
            });
        }
        window.markSectionsDirty = markSectionsDirty;

        function isAdminSurfaceActive() {
            try {
                if (typeof window !== 'undefined' && window.location && /admin\.html$/i.test(window.location.pathname || '')) return true;
                if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('rtv_admin_auth') === 'true') {
                    var modal = document.getElementById('adminModal');
                    if (modal && !modal.classList.contains('hidden')) return true;
                }
            } catch (e) { /* ignore */ }
            return false;
        }

        function renderAll(forceAll = false) {
            if (typeof renderGeneral === 'function') renderGeneral();
            if (typeof renderSocial === 'function') renderSocial();
            if (typeof renderDailyVerse === 'function') renderDailyVerse();
            if (typeof renderHomeBanners === 'function') renderHomeBanners();
            if (typeof renderLiveService === 'function') renderLiveService();

            var rendered = {};
            function runSec(secId) {
                if (!secId || rendered[secId] || !SECTION_RENDERERS_MAP[secId]) return;
                try {
                    SECTION_RENDERERS_MAP[secId]();
                    rendered[secId] = true;
                } catch (e) {
                    console.warn("Aviso renderizando " + secId, e);
                }
            }

            if (forceAll) {
                Object.keys(SECTION_RENDERERS_MAP).forEach(runSec);
            } else {
                if (window._dirtySections && window._dirtySections.size) {
                    window._dirtySections.forEach(function (id) {
                        var target = (typeof SECTION_ALIASES !== 'undefined' && SECTION_ALIASES[id]) ? SECTION_ALIASES[id] : id;
                        runSec(target);
                    });
                    window._dirtySections.clear();
                }
                var activeEl = document.querySelector('.main-section:not(.hidden)');
                if (activeEl && activeEl.id) runSec(activeEl.id);
            }

            // CMS solo si el panel admin está activo (no en cada snapshot público)
            if (isAdminSurfaceActive()) {
                if (typeof renderAdminDashboard === 'function') renderAdminDashboard();
                if (typeof renderAdminLists === 'function') renderAdminLists();
                if (typeof renderAdminUsersList === 'function') renderAdminUsersList();
            }
            if (typeof applyLanguageTranslations === 'function' && typeof getAppLanguage === 'function') { applyLanguageTranslations(getAppLanguage()); }
        }
        window.renderAll = renderAll;

        if (typeof window !== 'undefined') {
            window.addEventListener('rtv_lang_changed', (e) => {
                const lang = (e && e.detail && e.detail.lang) ? e.detail.lang : (typeof getAppLanguage === 'function' ? getAppLanguage() : 'es');
                if (typeof applyLanguageTranslations === 'function') {
                    applyLanguageTranslations(lang);
                }
                // Refrescar componentes dinamicos inmediatamente al cambiar de idioma
                if (typeof renderDailyVerse === 'function') renderDailyVerse();
                if (typeof renderPastors === 'function') renderPastors();
                if (typeof renderCultoCentral === 'function') renderCultoCentral();
                if (typeof renderLiveService === 'function') renderLiveService();
                if (typeof updateLiveServiceStatus === 'function') updateLiveServiceStatus();
                if (typeof renderRadioVision === 'function') renderRadioVision();
                if (typeof renderEvents === 'function') renderEvents();
                if (typeof renderSedes === 'function') renderSedes();
                if (typeof renderDoctrines === 'function') renderDoctrines();
                if (typeof renderHero === 'function') renderHero();
                if (typeof renderGeneralInfo === 'function') renderGeneralInfo();
                if (typeof updateLanguageSelectorsUI === 'function') updateLanguageSelectorsUI(lang);
            });
        }
function showSection(sectionId) {
            if (!sectionId) return;
            sectionId = String(sectionId).replace(/^#/, '').trim();
            let targetScroll = null;
            if (sectionId === 'pastores') {
                targetScroll = 'pastores-block';
            } else if (sectionId === 'culto-central' || sectionId === 'cultos') {
                targetScroll = 'culto-central-block';
            } else if (sectionId === 'escuela-biblica' || sectionId === 'escuela' || sectionId === 'primeros-pasos') {
                targetScroll = 'escuela-biblica-block';
            } else if (sectionId === 'ubicanos' || sectionId === 'ubicacion') {
                targetScroll = 'ubicanos-block';
            } else if (sectionId === 'anexos') {
                targetScroll = 'annexesGrid';
            }

            if (SECTION_ALIASES[sectionId]) sectionId = SECTION_ALIASES[sectionId];
            try {
                if (!ALL_SECTIONS.includes(sectionId)) sectionId = 'inicio';
                currentActiveSection = sectionId;

                // Sincronizar URL Hash para enlaces compartibles y atajos PWA
                if (typeof history !== 'undefined' && typeof history.replaceState === 'function') {
                    try {
                        const newHash = sectionId === 'inicio'
                            ? (window.location.pathname + window.location.search)
                            : ('#' + sectionId);
                        history.replaceState(null, '', newHash);
                    } catch (eHash) {}
                }

                if (typeof flushDirtySection === 'function') {
                    flushDirtySection(sectionId);
                }

                // Si sale de la Biblia, detener lectura por voz
                if (sectionId !== 'biblia') {
                    if (typeof stopAllSpeech === 'function') stopAllSpeech();
                } else {
                    if (!currentLoadedVerses || currentLoadedVerses.length === 0) {
                        if (typeof initBibleSelector === 'function') initBibleSelector();
                    }
                }

                // Ocultar todos los apartados excepto el seleccionado y aplicar suave transición fade
                ALL_SECTIONS.forEach(id => {
                    const el = document.getElementById(id);
                    if (el) {
                        if (id === sectionId) {
                            el.classList.remove('hidden');
                            el.classList.remove('section-fade');
                            void el.offsetWidth; // reiniciar animación
                            el.classList.add('section-fade');
                        } else {
                            el.classList.add('hidden');
                            el.classList.remove('section-fade');
                        }
                    }
                });

                // Actualizar estilo visual activo de botones de navegación (desktop y móvil)
                updateNavActiveState(sectionId);

                // Subir suavemente al inicio o scroll hacia el bloque de destino
                if (targetScroll) {
                    setTimeout(() => {
                        const targetEl = document.getElementById(targetScroll);
                        if (targetEl) {
                            targetEl.scrollIntoView({ behavior: 'smooth' });
                        } else {
                            window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
                        }
                    }, 60);
                } else {
                    try {
                        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
                    } catch (e) {
                        window.scrollTo(0, 0);
                    }
                }

                // Cerrar menú móvil si está abierto
                const mobileMenu = document.getElementById('mobileMenu');
                if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
                    mobileMenu.classList.add('hidden');
                }
            } catch (err) {
                console.error("Error al cambiar de apartado:", err);
            }
        }
        window.showSection = showSection;
        window.coreShowSection = showSection;

        // Enrutamiento inicial por Hash (#sedes, #radiovision, #culto-en-vivo, #biblia, #oracion)
        // Admin NO se abre por hash público (#admin/#login/#panel) — solo F2 o 3 clics en el logo
        function handleHashRouting() {
            if (typeof window === 'undefined' || !window.location.hash) return;
            const rawHash = window.location.hash.replace(/^#/, '').trim().toLowerCase();
            if (rawHash === 'admin' || rawHash === 'login' || rawHash === 'panel' || rawHash === 'panel-admin') {
                try { history.replaceState(null, '', window.location.pathname + window.location.search); } catch (e) {}
                return;
            }
            if (rawHash && (ALL_SECTIONS.includes(rawHash) || SECTION_ALIASES[rawHash])) {
                showSection(rawHash);
            }
        }
        if (typeof window !== 'undefined') {
            window.addEventListener('hashchange', handleHashRouting);
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => setTimeout(handleHashRouting, 50));
            } else {
                setTimeout(handleHashRouting, 50);
            }
        }

        // ==============================================================
        // MENÚ DESPLEGABLE DE LA CABECERA: "MÁS SECCIONES"
        // ==============================================================
        function toggleHeaderMoreMenu(e) {
            if (e && e.stopPropagation) e.stopPropagation();
            const menu = document.getElementById('headerMoreMenu');
            const chev = document.getElementById('headerMoreChevron');
            if (!menu) return;
            const isHidden = menu.classList.contains('hidden');
            if (isHidden) {
                menu.classList.remove('hidden');
                if (chev) chev.classList.add('rotate-180');
            } else {
                menu.classList.add('hidden');
                if (chev) chev.classList.remove('rotate-180');
            }
        }
        window.toggleHeaderMoreMenu = toggleHeaderMoreMenu;

        function closeHeaderMoreMenu() {
            const menu = document.getElementById('headerMoreMenu');
            const chev = document.getElementById('headerMoreChevron');
            if (menu) menu.classList.add('hidden');
            if (chev) chev.classList.remove('rotate-180');
        }
        window.closeHeaderMoreMenu = closeHeaderMoreMenu;

        // Cerrar el menú desplegable al hacer clic fuera
        if (typeof document !== 'undefined') {
            document.addEventListener('click', (e) => {
                const wrapper = document.getElementById('headerMoreDropdownWrapper');
                if (wrapper && !wrapper.contains(e.target)) {
                    closeHeaderMoreMenu();
                }
            });
        }

        // ==============================================================
        // PUERTA SECRETA REFORZADA (sin UI pública)
        // Desbloqueo temporal → luego login Firebase (usuario/clave)
        // Gestos: 5 clics rápidos en logos NAV  |  Ctrl+Shift+F2
        // ==============================================================
        (function initReinforcedSecretAdminGate() {
            if (typeof window === 'undefined' || typeof document === 'undefined') return;

            const GATE = {
                unlockUntil: 0,
                unlockMs: 20000,
                clickNeed: 5,
                clickWindowMs: 1400,
                clicks: 0,
                clickTimer: null,
                fails: 0,
                lockUntil: 0,
                failWindowStart: 0
            };

            function isStaffSession() {
                try {
                    return sessionStorage.getItem('rtv_admin_auth') === 'true' && !!sessionStorage.getItem('rtv_admin_email');
                } catch (e) { return false; }
            }

            function isUnlocked() {
                return Date.now() < GATE.unlockUntil || isStaffSession();
            }

            function armUnlock() {
                GATE.unlockUntil = Date.now() + GATE.unlockMs;
                GATE.fails = 0;
            }

            function registerFail() {
                const now = Date.now();
                if (!GATE.failWindowStart || now - GATE.failWindowStart > 60000) {
                    GATE.failWindowStart = now;
                    GATE.fails = 0;
                }
                GATE.fails++;
                if (GATE.fails >= 8) {
                    GATE.lockUntil = now + 45000;
                    GATE.fails = 0;
                }
            }

            function isGateLocked() {
                return Date.now() < GATE.lockUntil;
            }

            function ensureAdminCmsLoaded() {
                return new Promise(function (resolve, reject) {
                    if (typeof openAdminModal === 'function') {
                        resolve();
                        return;
                    }
                    if (window.__rtvAdminCmsLoading) {
                        window.__rtvAdminCmsLoading.then(resolve).catch(reject);
                        return;
                    }
                    window.__rtvAdminCmsLoading = new Promise(function (res, rej) {
                        var s = document.createElement('script');
                        s.src = 'js/admin-cms.js?v=' + String(Date.now());
                        s.async = true;
                        s.onload = function () { res(); };
                        s.onerror = function () { rej(new Error('No se pudo cargar admin-cms.js')); };
                        document.head.appendChild(s);
                    });
                    window.__rtvAdminCmsLoading.then(resolve).catch(reject);
                });
            }

            function openSecretLogin() {
                if (isGateLocked()) return;
                armUnlock();
                const modal = document.getElementById('adminModal');
                if (!modal) return;
                modal.classList.remove('hidden');
                modal.style.display = 'flex';
                modal.style.zIndex = '1000';
                modal.style.opacity = '1';
                modal.style.visibility = 'visible';
                modal.setAttribute('aria-hidden', 'false');
                ensureAdminCmsLoaded().then(function () {
                    if (typeof openAdminModal === 'function') {
                        try { openAdminModal(); } catch (err) {}
                    }
                    const emailIn = document.getElementById('adminEmailInput');
                    if (emailIn) setTimeout(function () { emailIn.focus(); }, 120);
                }).catch(function (err) {
                    console.warn(err);
                    if (typeof showToast === 'function') showToast('No se pudo cargar el panel admin.', 'error');
                });
            }

            // API mínima para que openAdminModal valide el desbloqueo
            window.__rtvAdminGate = {
                allowOpen: function () { return isUnlocked(); },
                denyNoise: function () { registerFail(); }
            };

            // No exponer helpers obvios en window
            try {
                delete window.triggerAdminAccess;
                delete window.handleSecretAdminTrigger;
            } catch (eDel) {}

            function onLogoPointer(e) {
                if (e) {
                    if (e.stopPropagation) e.stopPropagation();
                    if (e.preventDefault) e.preventDefault();
                }
                if (isGateLocked()) return;
                GATE.clicks++;
                if (GATE.clickTimer) clearTimeout(GATE.clickTimer);
                if (GATE.clicks >= GATE.clickNeed) {
                    GATE.clicks = 0;
                    openSecretLogin();
                    return;
                }
                GATE.clickTimer = setTimeout(function () {
                    const n = GATE.clicks;
                    GATE.clicks = 0;
                    if (n > 0 && n < GATE.clickNeed && typeof showSection === 'function') {
                        showSection('inicio');
                    }
                }, GATE.clickWindowMs);
            }

            function bindLogoGate() {
                const host = document.getElementById('navBrandLogos');
                if (!host || host.dataset.gateBound === '1') return;
                host.dataset.gateBound = '1';
                host.addEventListener('click', onLogoPointer, true);
                host.addEventListener('touchend', function (ev) {
                    // Evitar doble disparo click+touch en algunos móviles
                    if (ev.cancelable) ev.preventDefault();
                    onLogoPointer(ev);
                }, { passive: false, capture: true });
            }

            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', bindLogoGate);
            } else {
                bindLogoGate();
            }
            // Re-bind por si el DOM del header se re-renderiza
            setTimeout(bindLogoGate, 800);
            setTimeout(bindLogoGate, 2500);

            window.addEventListener('keydown', function (e) {
                const tag = (e.target && e.target.tagName) ? String(e.target.tagName).toLowerCase() : '';
                const typing = tag === 'input' || tag === 'textarea' || tag === 'select' || (e.target && e.target.isContentEditable);

                // Atajo reforzado: Ctrl + Shift + F2 (F2 solo no abre)
                if (!typing && (e.key === 'F2' || e.code === 'F2') && e.ctrlKey && e.shiftKey && !e.altKey) {
                    e.preventDefault();
                    if (isGateLocked()) return;
                    openSecretLogin();
                    return;
                }

                if (e.key === 'Escape' || e.code === 'Escape') {
                    const subModals = [
                        'adminUniversalModal', 'itemModal', 'infoItemModal', 'bannerItemModal',
                        'adminUserModal', 'adminVisitorModal', 'doctrineModal', 'firstStepModal',
                        'galleryUploadModal', 'bulkEditModal', 'musicFolderModal',
                        'shareModal', 'podcastVideoModal', 'galleryLightboxModal', 'pwaInstallGuideModal'
                    ];
                    let closedSub = false;
                    for (let i = 0; i < subModals.length; i++) {
                        const el = document.getElementById(subModals[i]);
                        if (el && !el.classList.contains('hidden') && el.style.display !== 'none') {
                            el.classList.add('hidden');
                            el.style.display = 'none';
                            closedSub = true;
                            break;
                        }
                    }
                    if (!closedSub) {
                        if (typeof closeAdminModal === 'function') closeAdminModal();
                        else {
                            const m = document.getElementById('adminModal');
                            if (m) { m.classList.add('hidden'); m.style.display = 'none'; }
                        }
                    }
                }
            }, true);
        })();

        
        // ==============================================================
        // DESPLAZAMIENTO HORIZONTAL FLUIDO CON SCROLL / RUEDA DEL RATÓN
        // ==============================================================
        function initHeaderNavScroll() {
            const nav = document.getElementById('mainHeaderNav');
            if (nav) {
                nav.addEventListener('wheel', (e) => {
                    if (e.deltaY !== 0) {
                        e.preventDefault();
                        nav.scrollBy({ left: e.deltaY * 1.3, behavior: 'smooth' });
                    }
                }, { passive: false });
            }
            const adminNav = document.getElementById('adminTabsNavWrapper');
            if (adminNav) {
                adminNav.addEventListener('wheel', (e) => {
                    if (e.deltaY !== 0) {
                        e.preventDefault();
                        adminNav.scrollBy({ left: e.deltaY * 1.3, behavior: 'smooth' });
                    }
                }, { passive: false });
            }
        }
        if (typeof document !== 'undefined') {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', initHeaderNavScroll);
            } else {
                initHeaderNavScroll();
            }
        }

        function scrollPublicNav(delta) {
            const nav = document.getElementById('mainHeaderNav');
            if (nav) {
                nav.scrollBy({ left: delta || 240, behavior: 'smooth' });
            }
        }
        window.scrollPublicNav = scrollPublicNav;

        function scrollAdminNav(delta) {
            const nav = document.getElementById('adminTabsNavWrapper');
            if (nav) {
                nav.scrollBy({ left: delta || 240, behavior: 'smooth' });
            }
        }
        window.scrollAdminNav = scrollAdminNav;

        // Stubs de seguridad para compatibilidad hacia atrás
        window.toggleNavMoreMenu = function() {};
        window.closeNavMoreMenu = function() {};

        function updateNavActiveState(sectionId) {
            ALL_SECTIONS.forEach(id => {
                const deskBtn = document.getElementById('nav-btn-' + id);
                const mobBtn = document.getElementById('mob-nav-' + id);
                const isActive = (id === sectionId);

                if (deskBtn) {
                    if (isActive) {
                        deskBtn.className = (id === 'culto-en-vivo')
                            ? 'nav-item-btn px-3 py-1.5 rounded-xl transition-all bg-red-600 text-white font-bold flex items-center space-x-1.5 shadow-md shadow-red-600/30 ring-1 ring-red-400 shrink-0'
                            : (id === 'soy-nuevo')
                            ? 'nav-item-btn px-3 py-1.5 rounded-xl transition-all bg-emerald-500 text-slate-950 font-bold border border-emerald-400 shadow-sm shrink-0 flex items-center gap-1.5'
                            : 'nav-item-btn px-3 py-1.5 rounded-xl transition-all text-slate-950 bg-amber-500 font-bold shadow-sm border border-amber-600/20 shrink-0 flex items-center gap-1.5';
                        try {
                            deskBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                        } catch(e) {}
                    } else {
                        deskBtn.className = (id === 'culto-en-vivo')
                            ? 'nav-item-btn px-3 py-1.5 rounded-xl transition-all text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 font-bold flex items-center space-x-1.5 shrink-0'
                            : (id === 'soy-nuevo')
                            ? 'nav-item-btn px-3 py-1.5 rounded-xl transition-all bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/30 font-bold border border-emerald-500/30 shrink-0 flex items-center gap-1.5'
                            : 'nav-item-btn px-3 py-1.5 rounded-xl transition-all text-slate-700 dark:text-slate-200 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 font-bold shrink-0 flex items-center gap-1.5';
                    }
                }

                if (mobBtn) {
                    if (isActive) {
                        mobBtn.className = (id === 'culto-en-vivo')
                            ? 'block w-full text-left py-2.5 px-3.5 rounded-xl bg-red-600 text-white font-bold flex items-center space-x-2 shadow-sm'
                            : 'block w-full text-left py-2.5 px-3.5 rounded-xl bg-amber-500 text-slate-950 font-bold shadow-sm';
                    } else {
                        mobBtn.className = (id === 'culto-en-vivo')
                            ? 'block w-full text-left py-2.5 px-3.5 rounded-xl text-red-600 hover:bg-red-50 font-bold flex items-center space-x-2'
                            : 'block w-full text-left py-2.5 px-3.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium';
                    }
                }
            });

            // Actualizar estado del botón 'Más' y sus ítems desplegables
            const dropdownSections = ['eventos', 'misionero', 'ministerios', 'galeria', 'biblioteca'];
            const moreBtn = document.getElementById('nav-btn-more');
            const isSubSectionActive = dropdownSections.includes(sectionId);
            if (moreBtn) {
                if (isSubSectionActive) {
                    moreBtn.className = 'px-3 py-1.5 rounded-xl transition-all bg-amber-500 text-slate-950 font-bold shrink-0 flex items-center gap-1.5 border border-amber-600/20 shadow-sm cursor-pointer select-none';
                } else {
                    moreBtn.className = 'px-3 py-1.5 rounded-xl transition-all bg-slate-200/90 hover:bg-amber-500 hover:text-slate-950 dark:bg-slate-800 dark:hover:bg-amber-500 dark:hover:text-slate-950 text-slate-800 dark:text-slate-200 font-bold shrink-0 flex items-center gap-1.5 border border-slate-300 dark:border-slate-700 shadow-sm cursor-pointer select-none';
                }
            }
            dropdownSections.forEach(dId => {
                const dropItem = document.getElementById('nav-dropdown-' + dId);
                if (dropItem) {
                    if (dId === sectionId) {
                        dropItem.className = 'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-amber-500 text-slate-950 transition-colors text-left font-bold shadow-sm';
                    } else {
                        dropItem.className = 'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-amber-500/15 hover:text-amber-600 dark:hover:text-amber-400 transition-colors text-left font-semibold';
                    }
                }
            });
        }


        // ==============================================================
        // BUSCADOR GLOBAL DENTRO DE LA WEB (BIBLIA, TEMAS, PODCASTS, DOCTRINAS)
        // ==============================================================
        function openGlobalSearch() {
            const modal = document.getElementById('globalSearchModal');
            if (modal) {
                modal.classList.remove('hidden');
                setTimeout(() => {
                    const inp = document.getElementById('globalSearchInput');
                    if (inp) {
                        inp.focus();
                        inp.select();
                    }
                }, 50);
            }
        }

        function closeGlobalSearch() {
            const modal = document.getElementById('globalSearchModal');
            if (modal) modal.classList.add('hidden');
        }

        function clearGlobalSearch() {
            const inp = document.getElementById('globalSearchInput');
            if (inp) {
                inp.value = '';
                inp.focus();
                executeGlobalSearch('');
            }
        }

        function fillGlobalSearch(term) {
            const inp = document.getElementById('globalSearchInput');
            if (inp) {
                inp.value = term;
                inp.focus();
                executeGlobalSearch(term);
            }
        }

        function handleSearchModalBackdrop(e) {
            if (e.target.id === 'globalSearchModal') {
                closeGlobalSearch();
            }
        }

        // Atajo de teclado global: Ctrl+K / Cmd+K y Escape
        document.addEventListener('keydown', function(e) {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                openGlobalSearch();
            } else if (e.key === 'Escape') {
                closeGlobalSearch();
            }
        });

        function executeGlobalSearch(query) {
            const q = (query || '').trim().toLowerCase();
            const container = document.getElementById('globalSearchResults');
            const clearBtn = document.getElementById('globalSearchClearBtn');
            if (clearBtn) {
                if (q.length > 0) clearBtn.classList.remove('hidden');
                else clearBtn.classList.add('hidden');
            }

            if (!container) return;

            if (q.length < 2) {
                container.innerHTML = `
                    <div class="text-center py-10 text-slate-400 text-xs space-y-2">
                        <i class="fa-solid fa-book-open-reader text-2xl text-slate-500"></i>
                        <p>Ingresa una palabra clave, cita bíblica o tema para encontrar contenido al instante.</p>
                    </div>
                `;
                return;
            }

            let resultsHtml = '';
            let totalFound = 0;

            // 1. Buscar en la Biblia (Libros y coincidencias)
            const matchedBooks = bibleBooksData.filter(b => b.name.toLowerCase().includes(q));
            // También parsear si el usuario escribió "Juan 3" o "Salmos 23"
            let directBibleNav = null;
            const bibleRefMatch = q.match(/^([a-záéíóúñ0-9\s]+?)\s+(\d+)(?::(\d+))?$/i);
            if (bibleRefMatch) {
                const bookQuery = bibleRefMatch[1].trim();
                const chapNum = parseInt(bibleRefMatch[2]);
                const verseNum = bibleRefMatch[3] ? parseInt(bibleRefMatch[3]) : 1;
                const foundIdx = bibleBooksData.findIndex(b => b.name.toLowerCase().includes(bookQuery));
                if (foundIdx !== -1) {
                    const b = bibleBooksData[foundIdx];
                    if (chapNum <= b.chapters) {
                        directBibleNav = { bookIdx: foundIdx, bookName: b.name, chapter: chapNum, verse: verseNum };
                    }
                }
            }

            if (directBibleNav || matchedBooks.length > 0) {
                resultsHtml += `<div class="text-[11px] font-bold text-yellow-400 uppercase tracking-wider pb-1 border-b border-white/10 flex items-center space-x-1.5"><i class="fa-solid fa-book-bible"></i> <span>Sagradas Escrituras</span></div>`;
                if (directBibleNav) {
                    totalFound++;
                    resultsHtml += `
                        <div onclick="goToBibleFromSearch(${directBibleNav.bookIdx}, ${directBibleNav.chapter}, ${directBibleNav.verse})" class="p-3 rounded-xl bg-[#0e1d3e] hover:bg-[#152e60] border border-[#1d3d7a] cursor-pointer transition-all flex items-center justify-between group">
                            <div class="flex items-center space-x-3">
                                <div class="w-8 h-8 rounded-lg bg-yellow-500/20 text-yellow-400 flex items-center justify-center font-bold text-xs"><i class="fa-solid fa-bible"></i></div>
                                <div>
                                    <h4 class="text-white font-bold text-xs group-hover:text-yellow-400">${directBibleNav.bookName} Capítulo ${directBibleNav.chapter}${directBibleNav.verse > 1 ? ':' + directBibleNav.verse : ''}</h4>
                                    <p class="text-slate-400 text-[10px]">Ir directo al pasaje bíblico</p>
                                </div>
                            </div>
                            <span class="text-yellow-400 text-xs"><i class="fa-solid fa-arrow-right"></i></span>
                        </div>
                    `;
                }
                matchedBooks.slice(0, 3).forEach(b => {
                    const bIdx = bibleBooksData.findIndex(bk => bk.id === b.id);
                    if (!directBibleNav || directBibleNav.bookIdx !== bIdx) {
                        totalFound++;
                        resultsHtml += `
                            <div onclick="goToBibleFromSearch(${bIdx}, 1, 1)" class="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 cursor-pointer transition-all flex items-center justify-between group">
                                <div class="flex items-center space-x-2.5">
                                    <span class="text-yellow-400 text-xs"><i class="fa-solid fa-book"></i></span>
                                    <span class="text-white font-semibold text-xs group-hover:text-yellow-400">${b.name} (${b.chapters} capítulos)</span>
                                </div>
                                <span class="text-slate-400 text-[10px]">Abrir Libro</span>
                            </div>
                        `;
                    }
                });
            }

            // 2. Buscar en Mis Primeros Pasos
            const matchedSteps = (appData.firstSteps || []).filter(fs => 
                (fs.title && fs.title.toLowerCase().includes(q)) || 
                (fs.citation && fs.citation.toLowerCase().includes(q)) || 
                (fs.desc && fs.desc.toLowerCase().includes(q))
            );
            if (matchedSteps.length > 0) {
                resultsHtml += `<div class="text-[11px] font-bold text-yellow-400 uppercase tracking-wider pb-1 border-b border-white/10 pt-2 flex items-center space-x-1.5"><i class="fa-solid fa-shoe-prints"></i> <span>Mis Primeros Pasos</span></div>`;
                matchedSteps.forEach(fs => {
                    totalFound++;
                    resultsHtml += `
                        <div onclick="goToFirstStepFromSearch('${fs.id}')" class="p-3 rounded-xl bg-[#091b3d] hover:bg-[#102a5c] border border-[#163670] cursor-pointer transition-all space-y-1 group">
                            <div class="flex items-center justify-between">
                                <h4 class="text-white font-bold text-xs group-hover:text-yellow-400">${fs.title}</h4>
                                <span class="text-[10px] text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded">${fs.citation || 'Cita'}</span>
                            </div>
                            <p class="text-slate-300 text-[11px] line-clamp-1">${fs.desc}</p>
                        </div>
                    `;
                });
            }

            // 3. Buscar en Podcasts y Sermones
            const matchedPods = (appData.podcasts || []).filter(p =>
                (p.title && p.title.toLowerCase().includes(q)) ||
                (p.desc && p.desc.toLowerCase().includes(q)) ||
                (p.category && p.category.toLowerCase().includes(q))
            );
            if (matchedPods.length > 0) {
                resultsHtml += `<div class="text-[11px] font-bold text-yellow-400 uppercase tracking-wider pb-1 border-b border-white/10 pt-2 flex items-center space-x-1.5"><i class="fa-solid fa-podcast"></i> <span>Podcasts y Mensajes</span></div>`;
                matchedPods.forEach(p => {
                    totalFound++;
                    resultsHtml += `
                        <div onclick="goToPodcastFromSearch('${p.title.replace(/'/g, "\\'")}', '${p.audioUrl || ''}')" class="p-3 rounded-xl bg-[#241221] hover:bg-[#381a33] border border-[#4a2243] cursor-pointer transition-all flex items-center justify-between group">
                            <div>
                                <h4 class="text-white font-bold text-xs group-hover:text-yellow-400">${p.title}</h4>
                                <span class="text-[10px] text-slate-400">${p.category} • ${p.duration || 'Audio'}</span>
                            </div>
                            <span class="text-yellow-400 text-xs"><i class="fa-solid fa-play"></i></span>
                        </div>
                    `;
                });
            }

            // 4. Buscar en Doctrinas Bíblicas
            const matchedDoctrines = (appData.doctrines || []).filter(d =>
                (d.title && d.title.toLowerCase().includes(q)) ||
                (d.desc && d.desc.toLowerCase().includes(q))
            );
            if (matchedDoctrines.length > 0) {
                resultsHtml += `<div class="text-[11px] font-bold text-yellow-400 uppercase tracking-wider pb-1 border-b border-white/10 pt-2 flex items-center space-x-1.5"><i class="fa-solid fa-scroll"></i> <span>Doctrinas Bíblicas</span></div>`;
                matchedDoctrines.forEach(d => {
                    totalFound++;
                    resultsHtml += `
                        <div onclick="goToGoDoctrinesFromSearch()" class="p-3 rounded-xl bg-[#1d1233] hover:bg-[#2d1b4f] border border-[#392063] cursor-pointer transition-all group">
                            <h4 class="text-white font-bold text-xs group-hover:text-yellow-400">${escapeHtml(d.title || '')}</h4>
                            <p class="text-slate-300 text-[11px] line-clamp-1">${escapeHtml(d.desc || '')}</p>
                        </div>
                    `;
                });
            }

            if (totalFound === 0) {
                container.innerHTML = `
                    <div class="text-center py-10 text-slate-400 text-xs space-y-2">
                        <i class="fa-solid fa-magnifying-glass text-2xl text-slate-500"></i>
                        <p>No se encontraron resultados para "<strong>${escapeHtml(query)}</strong>".</p>
                        <p class="text-[11px] text-slate-500">Intenta buscar por libro bíblico (ej. "Génesis", "Juan"), tema (ej. "fe", "oración") o podcast.</p>
                    </div>
                `;
            } else {
                container.innerHTML = resultsHtml;
            }
        }

        function goToBibleFromSearch(bookIdx, chapter, verse) {
            closeGlobalSearch();
            showSection('biblia');
            currentBibleBookIndex = bookIdx;
            currentBibleChapter = chapter;
            currentBibleVerse = verse || 1;
            document.getElementById('bibleBookSelect').value = bookIdx;
            updateChapterSelector();
            document.getElementById('bibleChapterSelect').value = chapter;
            loadBibleChapterText(true);
        }

        function goToFirstStepFromSearch(stepId) {
            closeGlobalSearch();
            showSection('primeros-pasos');
            setTimeout(() => {
                const card = document.getElementById('card-fs-' + stepId);
                if (card) {
                    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    card.classList.add('ring-2', 'ring-yellow-400');
                    setTimeout(() => card.classList.remove('ring-2', 'ring-yellow-400'), 3000);
                }
            }, 300);
        }

        function goToPodcastFromSearch(title, audioUrl) {
            closeGlobalSearch();
            showSection('podcasts');
            if (audioUrl) {
                if (isPodcastVideo(audioUrl)) {
                    playPodcastVideo(title, audioUrl, 'Video', '');
                } else {
                    playPodcastAudio(title, audioUrl);
                }
            }
        }

        function goToGoDoctrinesFromSearch() {
            closeGlobalSearch();
            showSection('doctrinas');
        }

        // FORZAR ARRANQUE EN EL INICIO (ARRIBA DEL TODO)
        if (!window.location.hash || window.location.hash === '#inicio') window.scrollTo(0, 0);
        if (!window.location.hash || window.location.hash === '#inicio') setTimeout(() => window.scrollTo(0, 0), 20);
        if (!window.location.hash || window.location.hash === '#inicio') setTimeout(() => window.scrollTo(0, 0), 100);

        // Libros de la Biblia con conteo de capítulos
        const bibleBooksData = [
            // Antiguo Testamento (1 - 39)
            { id: 1, name: "Génesis", chapters: 50 }, { id: 2, name: "Éxodo", chapters: 40 }, { id: 3, name: "Levítico", chapters: 27 },
            { id: 4, name: "Números", chapters: 36 }, { id: 5, name: "Deuteronomio", chapters: 34 }, { id: 6, name: "Josué", chapters: 24 },
            { id: 7, name: "Jueces", chapters: 21 }, { id: 8, name: "Rut", chapters: 4 }, { id: 9, name: "1 Samuel", chapters: 31 },
            { id: 10, name: "2 Samuel", chapters: 24 }, { id: 11, name: "1 Reyes", chapters: 22 }, { id: 12, name: "2 Reyes", chapters: 25 },
            { id: 13, name: "1 Crónicas", chapters: 29 }, { id: 14, name: "2 Crónicas", chapters: 36 }, { id: 15, name: "Esdras", chapters: 10 },
            { id: 16, name: "Nehemías", chapters: 13 }, { id: 17, name: "Ester", chapters: 10 }, { id: 18, name: "Job", chapters: 42 },
            { id: 19, name: "Salmos", chapters: 150 }, { id: 20, name: "Proverbios", chapters: 31 }, { id: 21, name: "Eclesiastés", chapters: 12 },
            { id: 22, name: "Cantares", chapters: 8 }, { id: 23, name: "Isaías", chapters: 66 }, { id: 24, name: "Jeremías", chapters: 52 },
            { id: 25, name: "Lamentaciones", chapters: 5 }, { id: 26, name: "Ezequiel", chapters: 48 }, { id: 27, name: "Daniel", chapters: 12 },
            { id: 28, name: "Oseas", chapters: 14 }, { id: 29, name: "Joel", chapters: 3 }, { id: 30, name: "Amós", chapters: 9 },
            { id: 31, name: "Abdías", chapters: 1 }, { id: 32, name: "Jonás", chapters: 4 }, { id: 33, name: "Miqueas", chapters: 7 },
            { id: 34, name: "Nahúm", chapters: 3 }, { id: 35, name: "Habacuc", chapters: 3 }, { id: 36, name: "Sofonías", chapters: 3 },
            { id: 37, name: "Hageo", chapters: 2 }, { id: 38, name: "Zacarías", chapters: 14 }, { id: 39, name: "Malaquías", chapters: 4 },
            // Nuevo Testamento (40 - 66)
            { id: 40, name: "Mateo", chapters: 28 }, { id: 41, name: "Marcos", chapters: 16 }, { id: 42, name: "Lucas", chapters: 24 },
            { id: 43, name: "Juan", chapters: 21 }, { id: 44, name: "Hechos", chapters: 28 }, { id: 45, name: "Romanos", chapters: 16 },
            { id: 46, name: "1 Corintios", chapters: 16 }, { id: 47, name: "2 Corintios", chapters: 13 }, { id: 48, name: "Gálatas", chapters: 6 },
            { id: 49, name: "Efesios", chapters: 6 }, { id: 50, name: "Filipenses", chapters: 4 }, { id: 51, name: "Colosenses", chapters: 4 },
            { id: 52, name: "1 Tesalonicenses", chapters: 5 }, { id: 53, name: "2 Tesalonicenses", chapters: 3 }, { id: 54, name: "1 Timoteo", chapters: 6 },
            { id: 55, name: "2 Timoteo", chapters: 4 }, { id: 56, name: "Tito", chapters: 3 }, { id: 57, name: "Filemón", chapters: 1 },
            { id: 58, name: "Hebreos", chapters: 13 }, { id: 59, name: "Santiago", chapters: 5 }, { id: 60, name: "1 Pedro", chapters: 5 },
            { id: 61, name: "2 Pedro", chapters: 3 }, { id: 62, name: "1 Juan", chapters: 5 }, { id: 63, name: "2 Juan", chapters: 1 },
            { id: 64, name: "3 Juan", chapters: 1 }, { id: 65, name: "Judas", chapters: 1 }, { id: 66, name: "Apocalipsis", chapters: 22 }
        ];

        let currentBibleBookIndex = 0;
        let currentBibleChapter = 1;
        let currentBibleVerse = 1;
        let currentLoadedVerses = [];
        let bibleCache = {};

        // NOTA: defaultFirstSteps y defaultHomeBanners se definen canónicamente en helpers.js

        function escapeBannerHtml(str) {
            return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        }

                function renderHomeBanners() {
            const grid = document.getElementById('homeBannersGrid');
            if (!grid) return;
            const sec = document.getElementById('homeBannersSection') || grid.closest('section');
            const list = appData.homeBanners || [];
            if (list.length === 0) {
                grid.innerHTML = '';
                if (sec) sec.classList.add('hidden');
                return;
            }
            if (sec) sec.classList.remove('hidden');
            const defaultTargets = ['culto-en-vivo', 'nosotros', 'misionero'];
            grid.innerHTML = list.map((b, idx) => {
                const targetSec = b.targetSection || defaultTargets[idx % defaultTargets.length] || 'eventos';
                return `
                <div onclick="showSection('${escapeBannerHtml(targetSec)}')" role="button" tabindex="0" class="rounded-2xl overflow-hidden relative shadow-xl border border-sky-200 dark:border-[#1a2d54] group h-52 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400">
                    <img src="${escapeBannerHtml(b.image)}" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="${escapeBannerHtml(b.tag)}: ${escapeBannerHtml(b.title)} - RADIOVISIÓN RTV" onerror="this.src='https://placehold.co/800x400/0a1e38/facc15?text=RADIOVISION+RTV'">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex items-end justify-between p-6">
                        <div>
                            <span class="text-yellow-400 text-xs font-bold uppercase tracking-wider">${escapeBannerHtml(b.tag)}</span>
                            <h3 class="text-white font-bold text-lg">${escapeBannerHtml(b.title)}</h3>
                        </div>
                        <span class="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-slate-950 transition-all shrink-0">
                            <i class="fa-solid fa-arrow-right text-xs"></i>
                        </span>
                    </div>
                </div>
            `;
            }).join('');
        }

        function renderAdminBanners() {
            const box = document.getElementById('adminBannersList');
            if (!box) return;
            const list = appData.homeBanners || [];
            box.innerHTML = list.length > 0 ? list.map(b => `
                <div class="bg-[#060c1f] border border-[#1d2d54] rounded-xl p-3 flex justify-between items-center text-xs">
                    <div class="flex items-center space-x-3">
                        <img src="${escapeBannerHtml(b.image)}" class="w-16 h-12 object-cover rounded-lg border border-[#1d2d54]" onerror="this.src='https://placehold.co/160x120/1e293b/facc15?text=RTV'">
                        <div>
                            <span class="text-yellow-400 font-bold uppercase text-[10px] block">${escapeBannerHtml(b.tag)}</span>
                            <span class="text-white font-semibold">${escapeBannerHtml(b.title)}</span>
                        </div>
                    </div>
                    <div class="flex space-x-2 shrink-0">
                        <button type="button" onclick="openBannerModal('${b.id}')" class="text-yellow-400 hover:underline">Editar</button>
                        <button type="button" onclick="deleteBanner('${b.id}')" class="text-red-400 hover:underline">Eliminar</button>
                    </div>
                </div>
            `).join('') : '<p class="text-slate-500 text-xs">No hay tarjetas registradas.</p>';
        }

        function updateBannerPreview(url) {
            const img = document.getElementById('bannerItemPreview');
            const fb = document.getElementById('bannerItemFallback');
            if (url) {
                img.src = url;
                img.classList.remove('hidden');
                fb.classList.add('hidden');
            } else {
                img.src = '';
                img.classList.add('hidden');
                fb.classList.remove('hidden');
            }
        }

        function openBannerModal(id) {
            const item = id ? (appData.homeBanners || []).find(x => x.id === id) : null;
            document.getElementById('bannerModalTitle').innerText = item ? 'Editar Tarjeta de Imagen' : 'Nueva Tarjeta de Imagen';
            document.getElementById('bannerItemId').value = item ? item.id : '';
            document.getElementById('bannerItemTag').value = item ? item.tag : '';
            document.getElementById('bannerItemTitle').value = item ? item.title : '';
            document.getElementById('bannerItemImage').value = item ? item.image : '';
            updateBannerPreview(item ? item.image : '');
            const _bm = document.getElementById('bannerItemModal');
            if (_bm) { _bm.classList.remove('hidden'); _bm.style.display = 'flex'; _bm.style.zIndex = '2000'; }
        }

        function closeBannerModal() {
            const _bm = document.getElementById('bannerItemModal');
            if (_bm) { _bm.classList.add('hidden'); _bm.style.display = 'none'; }
        }

        async function handleBannerImageUpload(event) {
            const file = event.target.files[0];
            if (!file) return;
            try {
                const compressed = await compressImageFile(file, 1000, 1000, 0.82);
                document.getElementById('bannerItemImage').value = compressed;
                updateBannerPreview(compressed);
            } catch (err) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    document.getElementById('bannerItemImage').value = e.target.result;
                    updateBannerPreview(e.target.result);
                };
                reader.readAsDataURL(file);
            }
        }

        function saveBannerForm(e) {
            e.preventDefault();
            if (!appData.homeBanners) appData.homeBanners = [];
            const id = document.getElementById('bannerItemId').value;
            const obj = {
                id: id || ('hb_' + Date.now()),
                tag: document.getElementById('bannerItemTag').value.trim(),
                title: document.getElementById('bannerItemTitle').value.trim(),
                image: document.getElementById('bannerItemImage').value.trim() || 'https://placehold.co/800x400/0a1e38/facc15?text=RADIOVISION+RTV'
            };
            if (id) {
                const idx = appData.homeBanners.findIndex(x => x.id === id);
                if (idx !== -1) appData.homeBanners[idx] = obj; else appData.homeBanners.push(obj);
            } else {
                appData.homeBanners.push(obj);
            }
            saveAppData();
            closeBannerModal();
        }

        function deleteBanner(id) {
            if (confirm("¿Eliminar esta tarjeta de imagen del inicio?")) {
                appData.homeBanners = (appData.homeBanners || []).filter(x => x.id !== id);
                saveAppData();
            }
        }


        // ==============================================================
        // PROGRESSIVE WEB APP (PWA) & SERVICE WORKER (DELEGADO A JS/PWA.JS)
        // ==============================================================
        if ('serviceWorker' in navigator && typeof initPWA !== 'function') {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('sw.js').then((reg) => {
                    console.log('PWA ServiceWorker activo:', reg.scope);
                }).catch((err) => {
                    console.warn('PWA ServiceWorker aviso:', err);
                });
            });
        }

        // Delegación de PWA centralizada a js/pwa.js con respaldos seguros
        if (typeof window.installPWA !== 'function') {
            window.installPWA = function() {
                if (typeof openPwaInstallModal === 'function') {
                    openPwaInstallModal();
                }
            };
        }
        function openPwaInstallModal() {
            const modal = document.getElementById('pwaInstallGuideModal');
            if (modal) modal.classList.remove('hidden');
        }
        window.openPwaInstallModal = openPwaInstallModal;

        function closePwaInstallModal() {
            const modal = document.getElementById('pwaInstallGuideModal');
            if (modal) modal.classList.add('hidden');
        }
        window.closePwaInstallModal = closePwaInstallModal;

        function executePwaNativeInstall() {
            if (typeof window.installPWA === 'function') window.installPWA();
        }
        window.executePwaNativeInstall = executePwaNativeInstall;

        function dismissPwaFloatingPrompt() {
            const banner = document.getElementById('pwaFloatingPrompt');
            if (banner) banner.classList.add('hidden');
        }
        window.dismissPwaFloatingPrompt = dismissPwaFloatingPrompt;


function renderUbicanos() {
    const loc = (appData && appData.churchLocation) ? appData.churchLocation : {};
    const addr = loc.address || '03000, Challhuahuacho 03261, Apurímac, Perú';
    const phone = loc.phone || '+51 932 028 894';
    const wa = loc.whatsapp || '+51 932 028 894';
    const coords = loc.coordinates || '14°07\'13.9"S 72°15\'02.6"W (-14.120528, -72.250722)';
    const mapsUrl = loc.mapsUrl || 'https://maps.google.com/?q=-14.120528,-72.250722';
    const mapsEmbedUrl = loc.mapsEmbedUrl || 'https://www.google.com/maps?q=-14.120528,-72.250722&z=17&output=embed';

    const addrEl = document.getElementById('ubicanosAddress');
    const phoneEl = document.getElementById('ubicanosPhoneLink');
    const waEl = document.getElementById('ubicanosWaLink');
    const mapFrameEl = document.getElementById('ubicanosMapFrame');

    if (addrEl) addrEl.innerText = addr;
    if (phoneEl) {
        phoneEl.innerText = phone;
        phoneEl.href = 'tel:' + phone.replace(/[^0-9+]/g, '');
    }
    if (waEl) {
        waEl.innerText = wa + ' (Chatear ahora)';
        waEl.href = 'https://wa.me/' + wa.replace(/[^0-9]/g, '');
    }
    if (mapFrameEl && mapFrameEl.src !== mapsEmbedUrl) mapFrameEl.src = mapsEmbedUrl;
}
window.renderUbicanos = renderUbicanos;



        // ==============================================================
        // REDES SOCIALES: SINCRONIZACIÓN AUTOMÁTICA EN TODA LA PÁGINA
        // ==============================================================
        function renderSocial() {
            const fbObj = appData.social.find(s => s.name === 'Facebook') || { url: 'https://www.facebook.com/radiovisionrtv' };
            const ytObj = appData.social.find(s => s.name === 'YouTube') || { url: 'https://www.youtube.com/@radiovisionrtv2020' };
            const waObj = appData.social.find(s => s.name.includes('WhatsApp')) || { url: 'https://wa.me/51932028894' };

            // 1. Sincronizar enlaces en la Barra Superior
            const topbarFb = document.getElementById('topbarFbLink');
            if (topbarFb) topbarFb.href = fbObj.url;

            const topbarYt = document.getElementById('topbarYtLink');
            if (topbarYt) topbarYt.href = ytObj.url;

            const topbarWa = document.getElementById('topbarWaLink');
            if (topbarWa) topbarWa.href = waObj.url;

            // 2. Sincronizar botones en Culto en Vivo
            const liveFbBtn = document.getElementById('liveCultFbBtn');
            if (liveFbBtn) liveFbBtn.href = fbObj.url;

            const liveYtBtn = document.getElementById('liveCultYtBtn');
            if (liveYtBtn) liveYtBtn.href = ytObj.url;

            // 3. Sincronizar enlaces en el Footer
            const footerFb = document.getElementById('footerFbLink');
            if (footerFb) footerFb.href = fbObj.url;

            const footerYt = document.getElementById('footerYtLink');
            if (footerYt) footerYt.href = ytObj.url;

            const footerWa = document.getElementById('footerWaLink');
            if (footerWa) footerWa.href = waObj.url;

            // 4. Renderizar Cards en Sección de Oración y Redes
            const grid = document.getElementById('publicSocialGrid');
            if (grid) {
                const esc = (typeof escapeHtml === 'function') ? escapeHtml : (t) => String(t == null ? '' : t);
                const safeUrl = (typeof safeHttpUrl === 'function') ? safeHttpUrl : (u) => (/^https?:\/\//i.test(String(u || '')) ? String(u) : '');
                grid.innerHTML = appData.social.map(s => {
                    const href = safeUrl(s.url) || '#';
                    return `
                    <a href="${esc(href)}" target="_blank" rel="noopener noreferrer" class="bg-[#0b2b25] border border-[#164d42] p-4 rounded-2xl flex items-center space-x-4 hover:border-yellow-400/50 transition-all group shadow-lg">
                        <div class="w-12 h-12 ${esc(s.bg || '')} ${esc(s.color || '')} rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                            <i class="${esc(s.icon || '')}"></i>
                        </div>
                        <div>
                            <h4 class="font-bold text-white text-sm group-hover:text-yellow-400">${esc(s.name)}</h4>
                            <span class="text-xs text-slate-300">${esc(s.handle)}</span>
                        </div>
                    </a>`;
                }).join('');
            }
        }


        // ==============================================================
        // MODO OSCURO (DARK MODE) - AUTOMÁTICO Y MANUAL
        // ==============================================================
        function initTheme() {
            const savedTheme = localStorage.getItem('rtv_theme');
            if (savedTheme === 'dark') {
                applyTheme(true);
            } else if (savedTheme === 'light') {
                applyTheme(false);
            } else {
                const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                applyTheme(prefersDark);
            }

            if (window.matchMedia) {
                window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
                    if (!localStorage.getItem('rtv_theme')) {
                        applyTheme(e.matches);
                    }
                });
            }
        }

        function toggleDarkMode() {
            const isDark = document.documentElement.classList.contains('dark') || document.body.classList.contains('dark-theme');
            const targetTheme = !isDark;
            applyTheme(targetTheme);
            localStorage.setItem('rtv_theme', targetTheme ? 'dark' : 'light');
            showToast(targetTheme ? "🌙 Modo Noche activado" : "☀️ Modo Día activado", "info");
        }

        function applyTheme(isDark) {
            if (isDark) {
                document.documentElement.classList.add('dark');
                document.body.classList.add('dark-theme');
            } else {
                document.documentElement.classList.remove('dark');
                document.body.classList.remove('dark-theme');
            }
            updateThemeIcons(isDark);
        }

        function updateThemeIcons(isDark) {
            const icon = document.getElementById('themeToggleIcon');
            const mobIcon = document.getElementById('mobThemeToggleIcon');
            const mobText = document.getElementById('mobThemeToggleText');
            if (icon) {
                icon.className = isDark ? "fa-solid fa-sun text-yellow-400" : "fa-solid fa-moon text-slate-700";
            }
            if (mobIcon) {
                mobIcon.className = isDark ? "fa-solid fa-sun text-yellow-400" : "fa-solid fa-moon text-amber-500";
            }
            if (mobText) {
                mobText.innerText = isDark ? "Modo Día (Claro)" : "Modo Noche (Oscuro)";
            }
        }


        function toggleMobileMenu() {
            const m = document.getElementById('mobileMenu') || document.getElementById('mobileNavDrawer');
            if (m) m.classList.toggle('hidden');
        }


if (typeof window !== 'undefined') {
    if (typeof showSection === 'function') { window.showSection = showSection; window.coreShowSection = showSection; }
    if (typeof toggleMobileMenu === 'function') window.toggleMobileMenu = toggleMobileMenu;
    if (typeof closeMobileMenu === 'function') window.closeMobileMenu = closeMobileMenu;
    if (typeof toggleAudioBarPlay === 'function') window.toggleAudioBarPlay = toggleAudioBarPlay;
    if (typeof closeAudioBar === 'function') window.closeAudioBar = closeAudioBar;
    if (typeof reconnectLiveAudio === 'function') window.reconnectLiveAudio = reconnectLiveAudio;
    if (typeof downloadCurrentAudio === 'function') window.downloadCurrentAudio = downloadCurrentAudio;
    if (typeof initBibleSelector === 'function') window.initBibleSelector = initBibleSelector;
    if (typeof changeFontSize === 'function') window.changeFontSize = changeFontSize;
    if (typeof openGlobalSearch === 'function') window.openGlobalSearch = openGlobalSearch;
    if (typeof clearGlobalSearch === 'function') window.clearGlobalSearch = clearGlobalSearch;
    if (typeof closeGlobalSearch === 'function') window.closeGlobalSearch = closeGlobalSearch;

    if (typeof initEnterKeyFormNavigation === 'function') window.initEnterKeyFormNavigation = initEnterKeyFormNavigation;
    if (typeof handleAdminPasswordKey === 'function') window.handleAdminPasswordKey = handleAdminPasswordKey;
}

        // ==============================================================
        // NAVEGACIÓN INTELIGENTE DE FORMULARIOS CON TECLA ENTER
        // Al presionar Enter en cualquier campo, avanza automáticamente al siguiente
        // ==============================================================
        function handleAdminPasswordKey(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                if (e.target.id === 'adminEmailInput') {
                    const passInput = document.getElementById('adminPasswordInput');
                    if (passInput) {
                        passInput.focus();
                        if (passInput.select) passInput.select();
                    }
                } else if (e.target.id === 'adminPasswordInput') {
                    if (typeof loginAdmin === 'function') loginAdmin();
                }
            }
        }
        window.handleAdminPasswordKey = handleAdminPasswordKey;

        function initEnterKeyFormNavigation() {
            document.addEventListener('keydown', function(e) {
                if (e.key !== 'Enter') return;

                const target = e.target;
                if (!target) return;

                const tag = target.tagName ? target.tagName.toLowerCase() : '';
                if (tag !== 'input' && tag !== 'select' && tag !== 'textarea') return;

                // Si es un botón o input de envío, permitir acción por defecto
                if (tag === 'input' && (target.type === 'button' || target.type === 'submit' || target.type === 'reset')) return;

                // En textarea multilínea: Shift+Enter o Ctrl+Enter avanza, Enter normal añade salto de línea
                if (tag === 'textarea' && !e.ctrlKey && !e.shiftKey) {
                    return;
                }

                // Caso específico Login Admin
                if (target.id === 'adminEmailInput') {
                    e.preventDefault();
                    const pass = document.getElementById('adminPasswordInput');
                    if (pass) { pass.focus(); if (pass.select) pass.select(); }
                    return;
                }
                if (target.id === 'adminPasswordInput') {
                    e.preventDefault();
                    if (typeof loginAdmin === 'function') loginAdmin();
                    return;
                }

                e.preventDefault();

                // Buscar el contenedor contextual más específico (modal, formulario, pestaña de admin o documento)
                const container = target.closest('form') ||
                                  target.closest('.admin-tab-content:not(.hidden)') ||
                                  target.closest('#itemModal > div') ||
                                  target.closest('.modal-content') ||
                                  target.closest('.fixed:not(.hidden) > div') ||
                                  target.closest('#adminModal') ||
                                  document.body;

                const fieldSelector = 'input:not([type="hidden"]):not([type="button"]):not([type="submit"]):not([disabled]):not([readonly]), select:not([disabled]), textarea:not([disabled]):not([readonly])';
                const allFields = Array.from(container.querySelectorAll(fieldSelector)).filter(el => {
                    return el.offsetParent !== null && !el.closest('.hidden');
                });

                const currentIndex = allFields.indexOf(target);
                if (currentIndex > -1 && currentIndex < allFields.length - 1) {
                    const nextField = allFields[currentIndex + 1];
                    nextField.focus();
                    if (typeof nextField.select === 'function' && nextField.type !== 'date' && nextField.type !== 'time' && nextField.type !== 'file') {
                        nextField.select();
                    }
                } else if (currentIndex === allFields.length - 1) {
                    // Último campo del formulario: buscar botón de guardar o acción principal
                    const saveBtn = container.querySelector('button[type="submit"], button.btn-save, button[onclick*="save"], button[onclick*="Save"], button[onclick*="confirm"], button[onclick*="submit"]');
                    if (saveBtn) {
                        saveBtn.focus();
                    }
                }
            });
        }
        window.initEnterKeyFormNavigation = initEnterKeyFormNavigation;
        initEnterKeyFormNavigation();




        function closeMobileMenu() {
            const menu = document.getElementById('mobileMenu');
            if (menu) menu.classList.add('hidden');
        }
        window.closeMobileMenu = closeMobileMenu;


        // ==============================================================
        // DESPLAZAMIENTO HORIZONTAL DINÁMICO (RUEDA Y ARRASTRE DEL MOUSE)
        // PARA LA CABECERA PRINCIPAL DE LA WEB Y PESTAÑAS ADMINISTRATIVAS
        // ==============================================================
        function setupWebHeaderWheelScroll() {
            const targets = [
                document.getElementById('mainHeaderNav'),
                document.getElementById('adminTabsNavWrapper')
            ];

            targets.forEach(el => {
                if (!el || el._hasHorizScroll) return;
                el._hasHorizScroll = true;

                // Desplazamiento horizontal con rueda del mouse
                el.addEventListener('wheel', (e) => {
                    if (e.deltaY !== 0) {
                        e.preventDefault();
                        el.scrollLeft += e.deltaY;
                    }
                }, { passive: false });

                // Desplazamiento por arrastre con el botón izquierdo del mouse
                let isDown = false;
                let startX = 0;
                let scrollLeft = 0;

                el.addEventListener('mousedown', (e) => {
                    if (e.button !== 0) return;
                    isDown = true;
                    startX = e.pageX - el.offsetLeft;
                    scrollLeft = el.scrollLeft;
                    el.classList.add('cursor-grabbing');
                });

                window.addEventListener('mouseup', () => {
                    if (isDown) {
                        isDown = false;
                        if (el) el.classList.remove('cursor-grabbing');
                    }
                });

                el.addEventListener('mousemove', (e) => {
                    if (!isDown) return;
                    e.preventDefault();
                    const x = e.pageX - el.offsetLeft;
                    const walk = (x - startX) * 1.5;
                    el.scrollLeft = scrollLeft - walk;
                });
            });
        }
        window.setupWebHeaderWheelScroll = setupWebHeaderWheelScroll;

        // Inicializar desplazamiento de cabecera inmediatamente y al cargar DOM
        if (typeof document !== 'undefined') {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', setupWebHeaderWheelScroll);
            } else {
                setupWebHeaderWheelScroll();
            }
        }
        window.addEventListener('load', setupWebHeaderWheelScroll);

        // ==============================================================
        // EXPORTACIONES GLOBALES DE MÓDULO UI
        // ==============================================================
        window.handleSearchModalBackdrop = handleSearchModalBackdrop;
        window.executeGlobalSearch = executeGlobalSearch;
        window.fillGlobalSearch = fillGlobalSearch;
        window.closeBannerModal = closeBannerModal;
        window.saveBannerForm = saveBannerForm;
        window.handleBannerImageUpload = handleBannerImageUpload;
        window.updateBannerPreview = updateBannerPreview;
        window.deleteBanner = deleteBanner;
        window.openBannerModal = openBannerModal;

        // EXPORTACIONES GLOBALES RESUELTAS
        if (typeof toggleDarkMode !== 'undefined') window.toggleDarkMode = toggleDarkMode;
        if (typeof applyTheme !== 'undefined') window.applyTheme = applyTheme;
        if (typeof initTheme !== 'undefined') window.initTheme = initTheme;
        if (typeof updateThemeIcons !== 'undefined') window.updateThemeIcons = updateThemeIcons;
        if (typeof goToBibleFromSearch !== 'undefined') window.goToBibleFromSearch = goToBibleFromSearch;
        if (typeof goToFirstStepFromSearch !== 'undefined') window.goToFirstStepFromSearch = goToFirstStepFromSearch;
        if (typeof goToPodcastFromSearch !== 'undefined') window.goToPodcastFromSearch = goToPodcastFromSearch;
        if (typeof goToGoDoctrinesFromSearch !== 'undefined') window.goToGoDoctrinesFromSearch = goToGoDoctrinesFromSearch;
        if (typeof renderHomeBanners !== 'undefined') window.renderHomeBanners = renderHomeBanners;
        if (typeof renderAdminBanners !== 'undefined') window.renderAdminBanners = renderAdminBanners;
        if (typeof renderSocial !== 'undefined') window.renderSocial = renderSocial;
        if (typeof handleHashRouting !== 'undefined') window.handleHashRouting = handleHashRouting;
        if (typeof initHeaderNavScroll !== 'undefined') window.initHeaderNavScroll = initHeaderNavScroll;
        if (typeof updateNavActiveState !== 'undefined') window.updateNavActiveState = updateNavActiveState;


// ==============================================================
// MÓDULO NOTIFICATIONS: TOASTS, PUSH, COMPARTIR, PETICIONES Y TESTIMONIOS
// ==============================================================

        // ==============================================================
        // GESTIÓN DE NOTIFICACIONES PUSH PARA CULTOS EN VIVO
        // ==============================================================
        let last10MinNotificationKey = localStorage.getItem('rtv_last_10m_cult_notif') || '';
        let lastReceivedLiveAlert = parseInt(localStorage.getItem('rtv_last_seen_alert') || '0');

        function updatePushNotificationUI(isEnabled) {
            const btn = document.getElementById('btnLiveCultPush');
            const txt = document.getElementById('btnLiveCultPushText');
            if (btn && txt) {
                if (isEnabled) {
                    btn.className = "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-800 border border-emerald-400/50 shadow-sm transition-all";
                    txt.innerHTML = "✓ Avisos Activados (Te avisaremos 10 min antes)";
                } else {
                    btn.className = "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 border border-amber-400/50 shadow-sm transition-all";
                    txt.innerHTML = "🔔 Avisarme 10 min antes de cada Culto en Vivo";
                }
            }
        }

        async function enableLivePushNotifications() {
            if (!("Notification" in window)) {
                alert("Tu navegador no soporta notificaciones de sistema.");
                return;
            }

            try {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    localStorage.setItem('rtv_push_enabled', 'true');
                    updatePushNotificationUI(true);
                    showToast("🔔 ¡Notificaciones activadas! Te avisaremos antes de cada culto en vivo.", "info");

                    if ('serviceWorker' in navigator) {
                        const reg = await navigator.serviceWorker.ready;
                        reg.showNotification("🔔 RadioVisión RTV - Notificaciones Activadas", {
                            body: "¡Gloria a Dios! Te avisaremos 10 minutos antes de que empiece un Culto en Vivo.",
                            icon: "img/logo-radio.jpg",
                            badge: "img/logo-radio.jpg",
                            vibrate: [150, 100, 150]
                        });
                    }
                } else if (permission === 'denied') {
                    alert("Las notificaciones están bloqueadas en tu navegador. Por favor actívalas en la configuración del navegador para recibir los avisos.");
                    updatePushNotificationUI(false);
                }
            } catch (err) {
                console.warn("Error habilitando notificaciones:", err);
            }
        }

        function check10MinCultoAlert(info) {
            if (localStorage.getItem('rtv_push_enabled') !== 'true') return;
            if (!("Notification" in window) || Notification.permission !== 'granted') return;

            // Si faltan entre 1 y 10 minutos (600000 ms) para el culto
            if (info && info.diffMs && info.diffMs > 0 && info.diffMs <= 600000) {
                const todayKey = new Date().toDateString() + '_' + info.title;
                if (last10MinNotificationKey !== todayKey) {
                    last10MinNotificationKey = todayKey;
                    localStorage.setItem('rtv_last_10m_cult_notif', todayKey);

                    const title = "🔔 ¡El Culto en Vivo comenzará en 10 minutos!";
                    const body = `Prepárate para la reunión: ${info.title} (${info.timeStr}). Haz clic para abrir la transmisión.`;

                    if ('serviceWorker' in navigator) {
                        navigator.serviceWorker.ready.then(reg => {
                            reg.showNotification(title, {
                                body: body,
                                icon: "img/logo-radio.jpg",
                                badge: "img/logo-radio.jpg",
                                vibrate: [150, 100, 150],
                                tag: 'radiovision-10m-alert',
                                renotify: true,
                                data: { url: window.location.origin + window.location.pathname + '#culto-en-vivo' }
                            });
                        });
                    } else {
                        new Notification(title, { body: body, icon: "img/logo-radio.jpg" });
                    }
                }
            }
        }

        async function broadcastLiveCultAlert() {
            if (!confirm("¿Deseas enviar una notificación push a todos los oyentes avisándoles que el Culto en Vivo está transmitiendo?")) {
                return;
            }
            if (!appData.liveStream) appData.liveStream = {};
            appData.liveStream.lastAlert = Date.now();
            appData.liveStream.alertTitle = document.getElementById('adminLiveTitle') ? document.getElementById('adminLiveTitle').value : "Culto de Avivamiento en Vivo";
            await saveAppData();
            showToast("📢 ¡Alerta de Culto en Vivo transmitida a la nube!");
            alert("✓ ¡Alerta enviada!\n\nLos oyentes que tengan las notificaciones activadas en sus teléfonos recibirán el aviso en directo.");
        }

        function checkAndTriggerLiveAlert(cloudData) {
            if (cloudData && cloudData.liveStream && cloudData.liveStream.lastAlert) {
                const alertTime = cloudData.liveStream.lastAlert;
                const now = Date.now();
                // Si la alerta se emitió hace menos de 5 minutos y no la hemos mostrado aún
                if (alertTime > lastReceivedLiveAlert && (now - alertTime) < 300000) {
                    lastReceivedLiveAlert = alertTime;
                    localStorage.setItem('rtv_last_seen_alert', String(alertTime));

                    const title = "🔴 ¡Culto en Vivo en RadioVisión RTV!";
                    const body = cloudData.liveStream.alertTitle ? `Estamos transmitiendo: "${cloudData.liveStream.alertTitle}". ¡Conéctate a la alabanza!` : "El culto en vivo ha comenzado. Toca para unirte a la transmisión.";

                    if ("Notification" in window && Notification.permission === 'granted') {
                        if ('serviceWorker' in navigator) {
                            navigator.serviceWorker.ready.then(reg => {
                                reg.showNotification(title, {
                                    body: body,
                                    icon: "img/logo-radio.jpg",
                                    badge: "img/logo-radio.jpg",
                                    vibrate: [200, 100, 200, 100, 200],
                                    tag: 'radiovision-live-alert',
                                    renotify: true,
                                    data: { url: window.location.origin + window.location.pathname + '#culto-en-vivo' }
                                });
                            });
                        } else {
                            new Notification(title, { body: body, icon: "img/logo-radio.jpg" });
                        }
                    }
                    showToast("🔴 ¡Culto en Vivo transmitiéndose ahora!", "info");
                }
            }
        }

        function broadcastNewSermonPush(title, preacher) {
            if ("Notification" in window && Notification.permission === 'granted') {
                const payload = {
                    title: "🎙️ Nueva Prédica Disponible en RadioVisión RTV",
                    body: `"${title}"${preacher ? ' por ' + preacher : ''}. Escúchala ahora para tu edificación espiritual.`,
                    url: window.location.origin + window.location.pathname + '#podcasts'
                };
                if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                    navigator.serviceWorker.controller.postMessage({
                        type: 'NOTIFY_LIVE',
                        payload: payload
                    });
                }
            }
        }
        window.broadcastNewSermonPush = broadcastNewSermonPush;

        function scheduleDailyVersePush() {
            if ("Notification" in window && Notification.permission === 'granted') {
                const verse = (typeof getTodayVerse === 'function') ? getTodayVerse() : null;
                if (verse) {
                    const verseBody = verse.quote || verse.text || '';
                    const payload = {
                        title: `📖 Versículo del Día (${verse.ref || 'Palabra de Dios'})`,
                        body: `"${verseBody.slice(0, 100)}..." Medita hoy en Su Palabra.`,
                        url: window.location.origin + window.location.pathname + '#biblia'
                    };
                    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                        navigator.serviceWorker.controller.postMessage({
                            type: 'NOTIFY_LIVE',
                            payload: payload
                        });
                    }
                }
            }
        }
        window.scheduleDailyVersePush = scheduleDailyVersePush;

        function updateLiveServiceStatus() {
            const info = getLiveStatusInfo();
            check10MinCultoAlert(info);

            const currentLang = (typeof getAppLanguage === 'function') ? getAppLanguage() : 'es';

            // 1. Barra superior
            const topbarText = document.getElementById('topbarLiveText');
            const topbarDot = document.getElementById('topbarLiveDot');
            if (topbarText) {
                if (info.isLive) {
                    topbarText.innerHTML = (currentLang === 'qu') 
                        ? `🔴 ¡KAWSAYPI TRANSMISIÓN! • ${info.title}`
                        : `🔴 ¡EN VIVO AHORA! • ${info.title}`;
                    if (topbarDot) topbarDot.className = "w-2 h-2 rounded-full bg-red-500 animate-ping";
                } else {
                    topbarText.innerHTML = `<i class="fa-solid fa-clock mr-1 text-yellow-400"></i> ${info.title} (${info.timeStr}) • ${info.summaryText}`;
                    if (topbarDot) topbarDot.className = "w-2 h-2 rounded-full bg-yellow-400";
                }
            }

            // 2. Tarjeta en Culto en Vivo
            const cdTitle = document.getElementById('liveCountdownTitle');
            const cdDesc = document.getElementById('liveCountdownDesc');
            const cdClock = document.getElementById('liveCountdownClock');
            const cdSub = document.getElementById('liveCountdownSub');
            const cdTag = document.getElementById('liveCountdownTag');

            if (cdTitle) {
                if (info.isLive) {
                    cdTitle.innerText = (currentLang === 'qu')
                        ? `🔴 ¡KAWSAYPIM KACHKANIKU! — ${info.title}`
                        : `🔴 ¡ESTAMOS EN VIVO AHORA! — ${info.title}`;
                    if (cdDesc) cdDesc.innerText = (currentLang === 'qu')
                        ? `Kawsaypi huñunakuy: ${info.timeStr || 'Templo centralmantapacha kawsaypi señal.'}`
                        : `Transmisión en directo: ${info.timeStr || 'Señal activa desde nuestro templo central.'}`;
                    if (cdClock) {
                        cdClock.innerText = (currentLang === 'qu') ? "KAWSAYPI" : "EN DIRECTO";
                        cdClock.className = "font-mono text-base sm:text-lg font-black text-red-400 bg-red-950/80 px-4 py-2 rounded-xl border border-red-500/40 shadow-inner animate-pulse";
                    }
                    if (cdSub) cdSub.innerText = (currentLang === 'qu') ? "Kawsaypi señal:" : "Señal activa:";
                    if (cdTag) cdTag.innerText = (currentLang === 'qu') ? "Huñunakuy Kawsaypi Transmitisqa" : "Culto Transmitiendo Ahora";
                } else {
                    cdTitle.innerText = `${info.title}`;
                    const schedLabel = (currentLang === 'qu') ? 'Horario' : 'Horario';
                    if (cdDesc) cdDesc.innerText = `${schedLabel}: ${info.fullSchedule || info.timeStr} • ${info.summaryText}`;
                    if (cdClock) {
                        cdClock.innerText = info.countdownClock;
                        cdClock.className = "font-mono text-base sm:text-lg font-black text-yellow-400 bg-black/70 px-4 py-2 rounded-xl border border-yellow-500/30 shadow-inner";
                    }
                    if (cdSub) cdSub.innerText = (currentLang === 'qu') ? "Puchuq tiempo:" : "Tiempo restante:";
                    if (cdTag) cdTag.innerText = (currentLang === 'qu') ? "Hamuq Kawsaypi Transmisión" : "Próxima Transmisión en Vivo";
                }
            }

            // 3. Tarjeta On-Air del Hero
            const onAirShow = document.getElementById('currentOnAirShow');
            if (onAirShow) {
                if (info.isLive) {
                    onAirShow.innerText = (currentLang === 'qu') ? `🔴 KAWSAYPI: ${info.title}` : `🔴 EN VIVO: ${info.title}`;
                } else {
                    const navSub = (currentLang === 'qu')
                        ? ((appData.general && appData.general.navSubtitle_qu) ? appData.general.navSubtitle_qu : '"Tukuy Suyukunaman Allin Willakuyta Willaspa"')
                        : ((appData.general && appData.general.navSubtitle) ? appData.general.navSubtitle : '"Predicando el Evangelio a Toda Nación"');
                    const cultTag = (currentLang === 'qu') ? 'Huñunakuy' : 'Culto';
                    onAirShow.innerText = `${navSub} • ${cultTag}: ${info.title} (${info.timeStr})`;
                }
            }
        }


        // ==============================================================
        // COMPARTIR EN REDES SOCIALES (WEB SHARE API + WHATSAPP FALLBACK)
        // ==============================================================
        // COMPARTIR EN REDES SOCIALES (MODAL SEGURO SIN BLOQUEO DE NAVEGADOR)
        // ==============================================================
        let pendingShareData = { title: '', text: '', url: '' };

        function shareGeneric({ title, text, url }) {
            const radioWebUrl = (appData.social && appData.social.find(s => s.name === 'Facebook')?.url) || 'https://www.facebook.com/radiovisionrtv';
            // Prevenir siempre URLs locales file:// o content:// que causan RESULT_CODE_KILLED_BAD_MESSAGE en Chromium
            let validUrl = url;
            if (!validUrl || validUrl.startsWith('file:') || validUrl.startsWith('content:')) {
                validUrl = (location.protocol === 'http:' || location.protocol === 'https:') ? location.href : radioWebUrl;
            }

            pendingShareData = {
                title: title || 'RADIOVISIÓN RTV',
                text: text || '',
                url: validUrl
            };

            if (typeof window.updateDynamicSEO === 'function') {
                window.updateDynamicSEO({ title, description: text, url: validUrl });
            }

            const modal = document.getElementById('shareModal');
            const previewEl = document.getElementById('sharePreviewText');
            const titleEl = document.getElementById('shareModalTitle');
            const nativeBtn = document.getElementById('btnNativeShare');

            if (modal && previewEl) {
                if (titleEl) titleEl.innerText = title || 'Compartir';
                previewEl.innerText = (text ? text + '\n\n' : '') + '📻 RADIOVISIÓN RTV: ' + validUrl;
                
                // Mostrar botón nativo solo si es HTTPS/HTTP y entorno seguro
                if (nativeBtn) {
                    if (navigator.share && (location.protocol === 'http:' || location.protocol === 'https:') && window.isSecureContext) {
                        nativeBtn.classList.remove('hidden');
                    } else {
                        nativeBtn.classList.add('hidden');
                    }
                }
                modal.classList.remove('hidden');
            } else {
                executeShareAction('whatsapp');
            }
        }

        function closeShareModal() {
            const modal = document.getElementById('shareModal');
            if (modal) modal.classList.add('hidden');
        }

        function executeShareAction(type) {
            const { title, text, url } = pendingShareData;
            const fullMessage = (text ? text + '\n\n' : '') + '📻 Sintoniza RADIOVISIÓN RTV: ' + url;

            if (type === 'whatsapp') {
                const waUrl = 'https://api.whatsapp.com/send?text=' + encodeURIComponent(fullMessage);
                window.open(waUrl, '_blank');
                showToast("✓ Abriendo WhatsApp para compartir...");
                closeShareModal();
            } else if (type === 'facebook') {
                const fbUrl = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url) + '&quote=' + encodeURIComponent(fullMessage);
                window.open(fbUrl, '_blank');
                showToast("✓ Abriendo Facebook...");
                closeShareModal();
            } else if (type === 'copy') {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(fullMessage).then(() => {
                        showToast("✓ ¡Copiado al portapapeles!");
                    }).catch(() => {
                        fallbackCopyText(fullMessage);
                    });
                } else {
                    fallbackCopyText(fullMessage);
                }
                closeShareModal();
            } else if (type === 'native') {
                if (navigator.share && (location.protocol === 'http:' || location.protocol === 'https:') && window.isSecureContext) {
                    navigator.share({
                        title: title || 'RADIOVISIÓN RTV',
                        text: text || '',
                        url: url
                    }).then(() => {
                        showToast("✓ ¡Compartido con éxito!");
                        closeShareModal();
                    }).catch((err) => {
                        if (err.name !== 'AbortError') {
                            showToast("Elige WhatsApp o Copiar Texto");
                        }
                    });
                } else {
                    executeShareAction('copy');
                }
            }
        }

        function fallbackCopyText(text) {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.left = '-9999px';
            document.body.appendChild(ta);
            ta.focus();
            ta.select();
            try {
                document.execCommand('copy');
                showToast("✓ ¡Texto copiado con éxito!");
            } catch (e) {
                showToast("Por favor selecciona y copia el texto.");
            }
            document.body.removeChild(ta);
        }

        function shareSpecificVerse(vNum) {
            const book = bibleBooksData[currentBibleBookIndex];
            const verseObj = currentLoadedVerses.find(v => v.verse === vNum);
            if (!verseObj) return;
            const title = `Palabra de Dios: ${book.name} ${currentBibleChapter}:${vNum}`;
            const text = `📖 "${verseObj.text}"\n\n— ${book.name} ${currentBibleChapter}:${vNum} (RVR 1960)\n📻 RADIOVISIÓN RTV • ¡La voz misionera!`;
            shareGeneric({ title, text, url: window.location.href });
        }

        function shareCurrentBiblePassage() {
            shareSpecificVerse(currentBibleVerse);
        }

        function shareFirstStep(idOrIdx) {
            const fs = (appData.firstSteps || []).find(s => s.id === idOrIdx) || (appData.firstSteps || [])[idOrIdx];
            if (!fs) return;
            const title = `Mis Primeros Pasos: ${fs.title}`;
            const text = `👣 *Mis Primeros Pasos: ${fs.title}*\n📜 Citas: ${fs.citation || 'Sagradas Escrituras'}\n\n"${fs.desc}"\n\n📻 Edifica tu vida en RADIOVISIÓN RTV:`;
            shareGeneric({ title, text, url: window.location.href });
        }

        function sharePodcast(idOrTitle, title) {
            const pod = (appData.podcasts || []).find(p => p.id === idOrTitle || p.title === title || p.title === idOrTitle) || { title: title || idOrTitle };
            const pTitle = pod.title || title || 'Mensaje de Edificación';
            const text = `🎙️ *Sermón / Podcast: ${pTitle}*\n${pod.desc ? `"${pod.desc}"\n` : ''}📻 Escúchalo en RADIOVISIÓN RTV:`;
            shareGeneric({ title: `Podcast: ${pTitle}`, text, url: window.location.href });
        }


function filterTestimonials(category) {
    currentTestFilter = category;
    const buttons = ['all', 'conversion', 'restauracion', 'sanidad', 'respuesta'];
    buttons.forEach(b => {
        const btn = document.getElementById('btn-test-' + b);
        if (btn) {
            if (b === category) {
                btn.className = 'px-4 py-2.5 rounded-xl text-xs font-bold transition-all bg-amber-500 text-slate-950 shadow-sm';
            } else {
                btn.className = 'px-4 py-2.5 rounded-xl text-xs font-bold transition-all bg-slate-100 dark:bg-[#0b152d] text-slate-700 dark:text-slate-300 hover:text-amber-600 border border-slate-300 dark:border-[#1d2d54]';
            }
        }
    });
    renderTestimonials();
}

function renderTestimonials() {
    const grid = document.getElementById('fullTestimonialsGrid');
    if (!grid || !appData.testimonials) return;

    let items = appData.testimonials;
    if (currentTestFilter !== 'all') {
        items = items.filter(t => {
            const cat = (t.category || '').toLowerCase();
            if (currentTestFilter === 'conversion') return cat.includes('conversi') || cat.includes('salvaci');
            if (currentTestFilter === 'restauracion') return cat.includes('restaura') || cat.includes('familia');
            if (currentTestFilter === 'sanidad') return cat.includes('sanidad') || cat.includes('milagro');
            if (currentTestFilter === 'respuesta') return cat.includes('respuest') || cat.includes('provisi');
            return true;
        });
    }

    if (items.length === 0) {
        const emptyTestMsg = (typeof currentLang !== 'undefined' && currentLang === 'qu')
            ? 'Manaraqmi kanchu testimoniyokuna kay categoriapi.'
            : 'No hay testimonios en esta categoría por ahora.';
        grid.innerHTML = `<div class="col-span-full text-center py-12 text-slate-500 text-sm" data-i18n="testimonials.empty_msg">${emptyTestMsg}</div>`;
        return;
    }

    grid.innerHTML = items.map(t => {
        const name = escapeHtml(t.name || 'Hermano en Cristo');
        const cat = escapeHtml(t.category || 'Testimonio');
        const title = escapeHtml(t.title || 'La fidelidad de Dios');
        const story = escapeHtml(t.story || '');
        const date = escapeHtml(t.date || '');

        return `
            <div class="bg-white dark:bg-[#0b152d] border border-slate-200 dark:border-[#1d2d54] rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4">
                <div class="space-y-3">
                    <div class="flex items-center justify-between">
                        <span class="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full">${cat}</span>
                        <span class="text-[11px] text-slate-500">${date}</span>
                    </div>
                    <h4 class="text-base font-bold text-slate-900 dark:text-white leading-snug">${title}</h4>
                    <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">"${story}"</p>
                </div>
                <div class="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs text-slate-500">
                    <span class="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5"><i class="fa-solid fa-user text-amber-500"></i>${name}</span>
                    <span class="text-emerald-600 font-semibold"><i class="fa-solid fa-check mr-1"></i><span data-i18n="testimonials.verified">Verificado</span></span>
                </div>
            </div>
        `;
    }).join('');
}


// ==============================================================
// ASISTENTE DE 2 FASES (STEP-BY-STEP WIZARD) "SOY NUEVO"
// ==============================================================
function goToVisitorStep(step) {
    const step1 = document.getElementById('wizardStep1');
    const step2 = document.getElementById('wizardStep2');
    const badge1 = document.getElementById('wizardStepBadge1');
    const badge2 = document.getElementById('wizardStepBadge2');
    const progressBar = document.getElementById('wizardStepProgressBar');

    if (step === 2) {
        const name = (document.getElementById('visitorName') ? document.getElementById('visitorName').value : '').trim();
        const phone = (document.getElementById('visitorPhone') ? document.getElementById('visitorPhone').value : '').trim();
        if (!name) {
            showToast("Por favor escribe tu nombre o cómo te gustaría que te llamemos", "error");
            const input = document.getElementById('visitorName');
            if (input) input.focus();
            return;
        }
        if (!phone) {
            showToast("Por favor ingresa tu WhatsApp o teléfono para contactarte", "error");
            const input = document.getElementById('visitorPhone');
            if (input) input.focus();
            return;
        }

        if (step1) step1.classList.add('hidden');
        if (step2) step2.classList.remove('hidden');
        if (progressBar) progressBar.style.width = '100%';
        if (badge1) {
            badge1.className = 'w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-sm';
            badge1.innerHTML = '<i class="fa-solid fa-check"></i>';
        }
        if (badge2) {
            badge2.className = 'w-7 h-7 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-xs shadow-sm ring-2 ring-amber-400/50';
            badge2.textContent = '2';
        }
    } else {
        if (step2) step2.classList.add('hidden');
        if (step1) step1.classList.remove('hidden');
        if (progressBar) progressBar.style.width = '50%';
        if (badge1) {
            badge1.className = 'w-7 h-7 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-xs shadow-sm';
            badge1.textContent = '1';
        }
        if (badge2) {
            badge2.className = 'w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-xs';
            badge2.textContent = '2';
        }
    }
}
window.goToVisitorStep = goToVisitorStep;

function renderSoyNuevo() {
    // Visitor form reset / placeholder checks
}

function openVisitorSuccessModal(visData) {
    const modal = document.getElementById('visitorSuccessModal');
    if (!modal) return;
    
    const isQu = typeof getAppLanguage === 'function' && getAppLanguage() === 'qu';
    const nameEl = document.getElementById('visModalName');
    const cityEl = document.getElementById('visModalCity');
    const reasonEl = document.getElementById('visModalReason');
    const waBtn = document.getElementById('visModalWaBtn');
    
    if (nameEl) nameEl.textContent = visData.name || '';
    if (cityEl) cityEl.textContent = visData.city || '';
    if (reasonEl) reasonEl.textContent = visData.reason || (isQu ? 'Iglesiata riqsiy' : 'Conocer la congregaci\u00f3n');
    
    if (waBtn) {
        const pastorPhone = '51932028894';
        const msg = encodeURIComponent(
            isQu
                ? ("Allillanchu Pastor Richard Edgardo D\u00e1vila Becerra, \u00f1oqam kani " + (visData.name || "") + " (" + (visData.city || "") + " llaqtamanta).\nImarayku: " + (visData.reason || "Iglesiata riqsiyta munani") + (visData.notes ? ("\nNota: " + visData.notes) : "") + "\n\u00a1Iglesiaman watukamuyta munani!")
                : ("Hola Pastor Richard Edgardo D\u00e1vila Becerra, soy " + (visData.name || "") + " de " + (visData.city || "") + ".\nMotivo: " + (visData.reason || "Deseo conocer la congregaci\u00f3n") + (visData.notes ? ("\nNota: " + visData.notes) : "") + "\n\u00a1Deseo visitarlos pronto!")
        );
        waBtn.href = "https://wa.me/" + pastorPhone + "?text=" + msg;
    }

    if (typeof applyLanguageTranslations === 'function' && typeof getAppLanguage === 'function') {
        applyLanguageTranslations(getAppLanguage());
    }
    
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
}
window.openVisitorSuccessModal = openVisitorSuccessModal;

function closeVisitorSuccessModal() {
    const modal = document.getElementById('visitorSuccessModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
}
window.closeVisitorSuccessModal = closeVisitorSuccessModal;

async function submitVisitorForm(e) {
    if (e) e.preventDefault();
    const name = document.getElementById('visitorName').value.trim();
    const phone = document.getElementById('visitorPhone').value.trim();
    const city = document.getElementById('visitorCity').value.trim();
    const reasonEl = document.getElementById('visitorReason');
    const reason = reasonEl ? reasonEl.value : '';
    const notes = document.getElementById('visitorNotes').value.trim();
    const fb = document.getElementById('visitorFeedback');

    if (!name || !phone || !city) {
        showToast('Por favor completa tu Nombre, Teléfono/WhatsApp y Ciudad.', 'error');
        return;
    }
    if (!isValidPhoneNumber(phone)) {
        showToast('Por favor ingresa un número de teléfono o WhatsApp válido (ej: +51 932 028 894)', 'error');
        return;
    }

    if (!appData.visitors) appData.visitors = [];
    const newVis = {
        id: 'vis_' + Date.now(),
        name: name,
        phone: phone,
        city: city,
        reason: reason,
        notes: reason ? (notes ? (reason + ' \u2022 ' + notes) : reason) : notes,
        date: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
    };

    appData.visitors.unshift(newVis);
    try {
        if (typeof db !== 'undefined' && db && db.objectStoreNames.contains('store')) {
            const tx = db.transaction(['store'], 'readwrite');
            tx.objectStore('store').put(appData, 'appData');
        }
        localStorage.setItem(typeof STORAGE_KEY !== 'undefined' ? STORAGE_KEY : 'RadioVisionRTV_AppData_v4', JSON.stringify(appData));
    } catch(e) {}
    if (typeof firebaseDB !== 'undefined' && firebaseDB) {
        firebaseDB.collection('visitors').doc(newVis.id).set(newVis).catch(e => console.warn('[Visitors Cloud] Guardado:', e));
    }

    if (fb) {
        fb.classList.remove('hidden');
        fb.innerHTML = `✅ ¡Gracias ${escapeHtml(name)}! Hemos recibido tu información. Muy pronto te saludaremos.`;
    }

    // Sincronizar automáticamente con el libro Excel en Google Sheets
    try {
        sendToGoogleSheets({
            id: newVis.id,
            type: 'visitor',
            name: newVis.name,
            phone: newVis.phone,
            city: newVis.city,
            reason: newVis.reason,
            notes: newVis.notes,
            date: newVis.date
        });
    } catch (e) {
        console.warn('[Sync Sheets Visitor]:', e);
    }

    // Modal interactivo moderno y amigable con enlace directo a WhatsApp
    openVisitorSuccessModal(newVis);

    document.getElementById('formSoyNuevo').reset();
    if (typeof goToVisitorStep === 'function') goToVisitorStep(1);
    if (typeof trackAppEvent === 'function') trackAppEvent('Visitante', 'Registro Nuevo', name);
}


        window.shareCommunityTestimony = shareTestimony;


        function shareTestimony(id) {
            const t = (appData.testimonials || []).find(x => x.id === id);
            if (!t) return;
            const title = `Testimonio de Fe: ${t.title}`;
            const text = `🙌 *Testimonio de Fe en RADIOVISIÓN RTV*\n━━━━━━━━━━━━━━━━━━━━\n👤 *${t.name}* (${t.category})\n📖 *${t.title}*\n\n"${t.story}"\n━━━━━━━━━━━━━━━━━━━━\n¡A Dios sea la gloria! Sintoniza:`;
            shareGeneric({ title, text, url: window.location.href });
        }

        function openNewTestimonialModal() {
            document.getElementById('newTestimonialModal').classList.remove('hidden');
            document.getElementById('newTestimonialForm').reset();
        }

        function closeNewTestimonialModal() {
            document.getElementById('newTestimonialModal').classList.add('hidden');
        }

        function submitNewTestimonial(e) {
            e.preventDefault();
            const name = document.getElementById('tName').value.trim();
            const category = document.getElementById('tCategory').value;
            const title = document.getElementById('tTitle').value.trim();
            const story = document.getElementById('tText').value.trim();

            const newT = {
                id: 't_' + Date.now(),
                name: name,
                category: category,
                title: title,
                story: story,
                date: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
            };

            if (!appData.testimonials) appData.testimonials = [];
            appData.testimonials.unshift(newT);
            saveAppData();
            closeNewTestimonialModal();
            showToast("✓ ¡Testimonio publicado con éxito para la gloria de Dios!");
        }

        function deleteTestimonial(id) {
            if (confirm("¿Estás seguro de eliminar este testimonio?")) {
                appData.testimonials = (appData.testimonials || []).filter(t => t.id !== id);
                saveAppData();
                showToast("Testimonio eliminado.");
            }
        }


        // ==============================================================
        // SUBMIT PRAYER: ENVÍO DIRECTO A LA CABINA (+51 932 028 894)
        // ==============================================================
        function submitPrayer(e) {
            e.preventDefault();
            const name = document.getElementById('pubPrayerName').value.trim();
            const cityEl = document.getElementById('pubPrayerContact');
            const city = cityEl ? cityEl.value.trim() : 'Challhuahuacho';
            const msg = document.getElementById('pubPrayerMsg').value.trim();
            const contact = city;
            if (!name || !msg) {
                showToast('Por favor ingresa tu Nombre y el Motivo de Oración', 'error');
                return;
            }
            
            const newPrayer = {
                id: 'pr_' + Date.now(),
                name: name,
                city: city, contact: city,
                msg: msg,
                date: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
            };

            if (!appData.prayers) appData.prayers = [];
            appData.prayers.unshift(newPrayer);
            try {
                if (typeof db !== 'undefined' && db && db.objectStoreNames.contains('store')) {
                    const tx = db.transaction(['store'], 'readwrite');
                    tx.objectStore('store').put(appData, 'appData');
                }
                localStorage.setItem(typeof STORAGE_KEY !== 'undefined' ? STORAGE_KEY : 'RadioVisionRTV_AppData_v4', JSON.stringify(appData));
            } catch(e) {}
            if (typeof firebaseDB !== 'undefined' && firebaseDB) {
                firebaseDB.collection('prayers').doc(newPrayer.id).set(newPrayer).catch(e => console.warn('[Prayers Cloud] Guardado:', e));
            }

            // Mensaje formateado para WhatsApp hacia la cabina 
            const waNumber = "51932028894";
            const waText = `🙏 *PETICIÓN DE ORACIÓN - RADIOVISIÓN RTV*\n` +
                           `━━━━━━━━━━━━━━━━━━━━\n` +
                           `👤 *Nombre:* ${name}\n` +
                           `📞 *Contacto:* ${contact || 'No especificado'}\n` +
                           `📝 *Motivo de Oración:*\n"${msg}"\n` +
                           `━━━━━━━━━━━━━━━━━━━━\n` +
                           `_Transmitiendo 24/7 desde la Roca - ¡Al Señor sea la gloria!_`;

            const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(waText)}`;

            try {
                window.open(waUrl, '_blank');
            } catch (err) {
                console.log("Popup bloqueado", err);
            }

            const alertBox = document.getElementById('prayerSuccessAlert');
            alertBox.innerHTML = `
                <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full">
                    <div class="space-y-1">
                        <div class="flex items-center space-x-2 text-emerald-400 font-bold">
                            <i class="fa-solid fa-circle-check text-base"></i>
                            <span>¡Petición registrada con éxito para la Cabina!</span>
                        </div>
                        <p class="text-slate-300 text-[11px]">Enviando motivo al número oficial de cabina: <strong>+51 932 028 894</strong></p>
                    </div>
                    <a href="${waUrl}" target="_blank" class="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs transition-all flex items-center space-x-2 shrink-0 shadow-md">
                        <i class="fa-brands fa-whatsapp text-sm"></i>
                        <span>Reabrir WhatsApp Cabina</span>
                    </a>
                </div>
            `;
            alertBox.classList.remove('hidden');

            document.getElementById('prayerPublicForm').reset();
            showToast("Petición dirigida a Cabina (+51 932 028 894) 📱");
        }


        // ==============================================================
        // SISTEMA DE NOTIFICACIONES / ALERTAS VISUALES FLOTANTES (TOAST)
        // ==============================================================
        let _lastToastMsg = '';
        let _lastToastTime = 0;

        function translateToSpanish(msg) {
            if (!msg || typeof msg !== 'string') return String(msg || '');
            let text = msg;
            const dict = [
                [/Maximum call stack size exceeded/gi, "Se excedió la capacidad de memoria en la llamada. Operación cancelada por seguridad."],
                [/Converting circular structure to JSON/gi, "Estructura circular detectada al guardar."],
                [/auth\/email-already-in-use/gi, "Este correo electrónico ya está registrado en el sistema."],
                [/auth\/invalid-email/gi, "El formato de correo electrónico no es válido."],
                [/auth\/weak-password/gi, "La contraseña debe tener al menos 6 caracteres."],
                [/auth\/user-not-found/gi, "Usuario no registrado en Firebase."],
                [/auth\/wrong-password/gi, "Contraseña incorrecta."],
                [/auth\/invalid-credential/gi, "Credenciales de acceso incorrectas o expiradas."],
                [/auth\/too-many-requests/gi, "Demasiados intentos fallidos. Por seguridad, intenta en unos minutos."],
                [/auth\/network-request-failed/gi, "Error de conexión de red con los servidores de Firebase."],
                [/Failed to fetch/gi, "Error al conectar con el servidor. Revisa tu conexión a Internet."],
                [/NetworkError/gi, "Error de red o conectividad."],
                [/Missing or insufficient permissions/gi, "Permisos de Firestore insuficientes o bloqueados."],
                [/permission-denied/gi, "Permisos denegados en la base de datos."],
                [/QuotaExceededError/gi, "Límite de cuota de almacenamiento alcanzado."]
            ];
            for (const [pattern, replacement] of dict) {
                text = text.replace(pattern, replacement);
            }
            return text;
        }
        window.translateToSpanish = translateToSpanish;

        function showToast(msg, type = 'success') {
            if (!msg) return;
            msg = translateToSpanish(msg);

            // Restringir avisos flotantes EXCLUSIVAMENTE al Panel Administrativo (nunca en la web pública)
            const adminModal = document.getElementById('adminModal');
            const isAdminOpen = adminModal && !adminModal.classList.contains('hidden');
            if (!isAdminOpen) {
                return;
            }

            const now = Date.now();
            // Evita notificaciones idénticas duplicadas en un intervalo de 2 segundos
            if (msg === _lastToastMsg && (now - _lastToastTime) < 2000) {
                return;
            }
            _lastToastMsg = msg;
            _lastToastTime = now;

            let container = document.getElementById('toastContainer');
            if (!container) {
                container = document.createElement('div');
                container.id = 'toastContainer';
                container.className = 'fixed bottom-6 right-4 sm:right-6 z-[99999] flex flex-col space-y-2 pointer-events-none max-w-sm w-full';
                document.body.appendChild(container);
            }

            // Feedback táctil sutil en dispositivos móviles
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                try { navigator.vibrate([25, 15, 25]); } catch(e) {}
            }

            const toast = document.createElement('div');
            const isSuccess = !type || type === 'success' || msg.includes('✓');
            const isError = type === 'error' || msg.toLowerCase().includes('error');
            const borderCol = isError ? 'border-red-500/60 bg-[#1f0b0e]/95' : isSuccess ? 'border-emerald-500/60 bg-[#061e1b]/95' : 'border-yellow-500/60 bg-[#0c152e]/95';
            const iconCol = isError ? 'fa-circle-xmark text-red-400' : isSuccess ? 'fa-circle-check text-emerald-400' : 'fa-circle-info text-yellow-400';

            toast.className = `pointer-events-auto border ${borderCol} text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 text-xs sm:text-sm toast-animate-in backdrop-blur-md`;
            toast.innerHTML = `
                <i class="fa-solid ${iconCol} text-base shrink-0"></i>
                <div class="flex-1 font-medium leading-tight">${msg}</div>
                <button onclick="this.parentElement.remove()" class="text-slate-400 hover:text-white p-1 text-xs ml-2 shrink-0" aria-label="Cerrar notificación"><i class="fa-solid fa-xmark"></i></button>
            `;
            container.appendChild(toast);

            setTimeout(() => {
                toast.classList.remove('toast-animate-in');
                toast.classList.add('toast-animate-out');
                setTimeout(() => toast.remove(), 260);
            }, 3000);
        }
        window.showToast = showToast;

        // ==============================================================
        // FASE 8: FUNCIONALIDADES PREMIUM - PETICIONES & INTERCESIÓN
        // ==============================================================
        function incrementPrayerIntercession(id) {
            if (!appData.prayers) appData.prayers = [];
            const prayer = appData.prayers.find(p => p.id === id);
            if (prayer) {
                prayer.intercessions = (prayer.intercessions || 0) + 1;
                saveAppData();
                if (typeof renderPublicPrayers === 'function') renderPublicPrayers();
                showToast("🙏 ¡Te has unido en oración! La oración del justo puede mucho.");
                if (typeof logAuditEvent === 'function') logAuditEvent('Intercesión', 'Oración', 'exito', 'Intercesión por: ' + (prayer.name || id));
            }
        }
        window.incrementPrayerIntercession = incrementPrayerIntercession;

        function markPrayerAnswered(id) {
            if (!appData.prayers) appData.prayers = [];
            const prayer = appData.prayers.find(p => p.id === id);
            if (prayer) {
                prayer.answered = true;
                prayer.answeredDate = new Date().toISOString().split('T')[0];
                saveAppData();
                if (typeof renderAdminPrayersList === 'function') renderAdminPrayersList();
                if (typeof renderPublicPrayers === 'function') renderPublicPrayers();
                showToast("🙌 ¡Gloria a Dios! Petición marcada como Testimonio de Victoria.");
                if (typeof logAuditEvent === 'function') logAuditEvent('Victoria', 'Oración', 'exito', 'Petición respondida: ' + (prayer.name || id));
            }
        }
        window.markPrayerAnswered = markPrayerAnswered;


        function shareCommunityTestimony(id, title) {
            const shareUrl = window.location.origin + window.location.pathname + '#testimonios';
            const shareText = 'Lee este testimonio de fe: "' + (title || 'Poder de Dios') + '" - Iglesia RadioVisión RTV';
            if (navigator.share) {
                navigator.share({
                    title: title || 'Testimonio de Fe',
                    text: shareText,
                    url: shareUrl
                }).catch(() => {});
            } else if (navigator.clipboard) {
                navigator.clipboard.writeText(shareText + ' ' + shareUrl);
                showToast("✓ Enlace de testimonio copiado al portapapeles", "info");
            } else {
                showToast("Testimonio: " + (title || 'RadioVisión RTV'), "info");
            }
        }
        window.shareCommunityTestimony = shareCommunityTestimony;

        function openTestimonialModal(id) {
            if (typeof openNewTestimonialModal === 'function') {
                openNewTestimonialModal();
            } else if (typeof openUniversalModal === 'function') {
                openUniversalModal('testimonios', id);
            }
        }
        window.openTestimonialModal = openTestimonialModal;


        function requestLivePushSubscription() {
            if (typeof enableLivePushNotifications === 'function') {
                enableLivePushNotifications();
            }
        }
        window.requestLivePushSubscription = requestLivePushSubscription;

        function triggerLivePushNotification() {
            if (!("Notification" in window)) {
                showToast("Tu navegador no soporta notificaciones de sistema.", "error");
                return;
            }
            if (Notification.permission === 'granted') {
                new Notification("🔴 ¡ESTAMOS EN VIVO! - RadioVisión RTV", {
                    body: "El culto de avivamiento y palabra de Dios ha comenzado. ¡Conéctate ahora!",
                    icon: (appData.general && appData.general.logoRadio) || 'img/logo-radio.jpg'
                });
                showToast("🔔 Alerta Push transmitida a la congregación", "info");
            } else {
                Notification.requestPermission().then(perm => {
                    if (perm === 'granted') {
                        new Notification("🔴 ¡ESTAMOS EN VIVO! - RadioVisión RTV", {
                            body: "El culto de avivamiento y palabra de Dios ha comenzado. ¡Conéctate ahora!",
                            icon: (appData.general && appData.general.logoRadio) || 'img/logo-radio.jpg'
                        });
                        showToast("🔔 Notificaciones activadas y transmitidas", "info");
                    } else {
                        showToast("Notificaciones no autorizadas en este navegador", "error");
                    }
                });
            }
        }
        window.triggerLivePushNotification = triggerLivePushNotification;

        // ==============================================================
        
// ==============================================================
// LIBRO EXCEL & GESTIÃ“N DE DECISIONES DE CULTO (SEGUNDO FORMULARIO)
// ==============================================================

const DEFAULT_GOOGLE_SHEETS_WEBHOOK = 'https://script.google.com/macros/s/AKfycbz_REPLACE_WITH_YOUR_ID/exec';

async function sendToGoogleSheets(entryData) {
    try {
        const endpoint = (window.appData && window.appData.general && window.appData.general.googleSheetsUrl) ||
                         window.GOOGLE_SHEETS_WEBHOOK_URL || DEFAULT_GOOGLE_SHEETS_WEBHOOK;
        if (!endpoint || endpoint.includes('REPLACE_WITH_YOUR_ID')) {
            console.info('[Google Sheets Sync] Webhook pendiente de configurar en appData.general.googleSheetsUrl');
            return false;
        }
        await fetch(endpoint, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entryData)
        });
        console.log('[Google Sheets Sync] Registro enviado correctamente al libro de Excel en la nube');
        return true;
    } catch (err) {
        console.warn('[Google Sheets Sync] Error al sincronizar:', err);
        return false;
    }
}
window.sendToGoogleSheets = sendToGoogleSheets;

function downloadExcelStyled(options) {
    const filename = options.filename || 'RadioVision_Reporte.xls';
    const sheetName = options.sheetName || 'Libro Ministerial';
    const subTitle = options.subTitle || 'REGISTRO MINISTERIAL OFICIAL';
    const verseText = options.verseText || 'De modo que si alguno está en Cristo, nueva criatura es; las cosas viejas pasaron; he aquí todas son hechas nuevas.';
    const verseRef = options.verseRef || '2 Corintios 5:17';
    const secondaryVerse = options.secondaryVerse || '';
    const pastoralInfo = options.pastoralInfo || 'Pastor Principal: Richard Edgardo Dávila Becerra • Celular/WhatsApp: +51 932 028 894 • Challhuahuacho, Apurímac';
    const headerBg = options.headerBg || '#047857'; // Esmeralda pastoral
    const headers = options.headers || [];
    const rows = options.rows || [];

    const colSpan = Math.max(headers.length, 1);
    const currentDate = new Date().toLocaleDateString('es-ES', { 
        weekday: 'long', 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Plantilla XML/HTML Spreadsheet profesional con soporte completo para estilos y citas bíblicas
    let html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
    html += '<head><meta http-equiv="Content-Type" content="text/html; charset=utf-8">';
    html += '<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>';
    html += '<x:Name>' + escapeHtml(sheetName) + '</x:Name>';
    html += '<x:WorksheetOptions><x:DisplayGridlines/><x:Selected/></x:WorksheetOptions>';
    html += '</x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]>';
    html += '<style>';
    html += 'body { font-family: Calibri, Segoe UI, Arial, sans-serif; background-color: #ffffff; margin: 0; padding: 0; }';
    html += 'table { border-collapse: collapse; table-layout: auto; width: 100%; }';
    html += '.b-main { background-color: #070e24; color: #fbbf24; font-size: 15pt; font-weight: bold; text-align: center; height: 38px; vertical-align: middle; border: 1px solid #070e24; }';
    html += '.b-sub { background-color: #0f172a; color: #38bdf8; font-size: 11pt; font-weight: bold; text-align: center; height: 28px; vertical-align: middle; border: 1px solid #0f172a; }';
    html += '.b-verse { background-color: #ecfdf5; color: #065f46; font-size: 10.5pt; font-style: italic; font-weight: bold; text-align: center; height: 32px; vertical-align: middle; border: 1px solid #a7f3d0; padding: 6px; }';
    html += '.b-ref { background-color: #f0fdf4; color: #047857; font-size: 9.5pt; font-weight: bold; text-align: center; height: 22px; vertical-align: middle; border-bottom: 2px solid #059669; }';
    html += '.b-sec { background-color: #eff6ff; color: #1e40af; font-size: 9pt; font-style: italic; text-align: center; height: 22px; vertical-align: middle; border-bottom: 1px solid #bfdbfe; }';
    html += '.b-pastor { background-color: #f8fafc; color: #334155; font-size: 9pt; text-align: center; height: 24px; vertical-align: middle; border-bottom: 1px solid #cbd5e1; }';
    html += '.b-date { background-color: #f1f5f9; color: #64748b; font-size: 8.5pt; text-align: right; height: 20px; vertical-align: middle; padding-right: 10px; }';
    html += '.th-col { background-color: ' + headerBg + '; color: #ffffff; font-size: 10pt; font-weight: bold; text-align: center; vertical-align: middle; height: 32px; border: 1px solid #064e3b; padding: 6px 10px; }';
    html += '.td-c { font-size: 9.5pt; color: #0f172a; vertical-align: middle; border: 1px solid #cbd5e1; padding: 6px 8px; }';
    html += '.td-center { text-align: center; font-size: 9.5pt; color: #0f172a; vertical-align: middle; border: 1px solid #cbd5e1; padding: 6px 8px; }';
    html += '.td-badge { font-weight: bold; font-size: 9.5pt; color: #047857; vertical-align: middle; border: 1px solid #cbd5e1; padding: 6px 8px; }';
    html += '.r-even { background-color: #ffffff; }';
    html += '.r-odd { background-color: #f8fafc; }';
    html += '.b-footer { background-color: #070e24; color: #fbbf24; font-size: 9.5pt; font-weight: bold; text-align: center; height: 28px; vertical-align: middle; border: 1px solid #070e24; }';
    html += '</style></head><body><table>';

    // Fila 1: Título Principal
    html += '<tr><th colspan="' + colSpan + '" class="b-main">⭐ RADIOVISIÓN RTV &amp; IGLESIA MISIONERA IMCOTNV ⭐</th></tr>';

    // Fila 2: Subtítulo
    html += '<tr><td colspan="' + colSpan + '" class="b-sub">📖 ' + escapeHtml(subTitle) + '</td></tr>';

    // Fila 3 y 4: Cita Bíblica Central
    html += '<tr><td colspan="' + colSpan + '" class="b-verse">âœ "' + escapeHtml(verseText) + '"</td></tr>';
    html += '<tr><td colspan="' + colSpan + '" class="b-ref">— ' + escapeHtml(verseRef) + ' —</td></tr>';

    // Fila Opcional: Versículo Secundario
    if (secondaryVerse) {
        html += '<tr><td colspan="' + colSpan + '" class="b-sec">🕊 ' + escapeHtml(secondaryVerse) + '</td></tr>';
    }

    // Fila Pastoral
    html += '<tr><td colspan="' + colSpan + '" class="b-pastor">â›ª ' + escapeHtml(pastoralInfo) + '</td></tr>';

    // Fila Fecha
    html += '<tr><td colspan="' + colSpan + '" class="b-date">Reporte Oficial Generado: ' + escapeHtml(currentDate) + '</td></tr>';

    // Fila Encabezados de Columnas
    html += '<tr>';
    headers.forEach(function(h) {
        html += '<th class="th-col">' + escapeHtml(h) + '</th>';
    });
    html += '</tr>';

    // Filas de Datos
    rows.forEach(function(row, idx) {
        const rowClass = (idx % 2 === 0) ? 'r-even' : 'r-odd';
        html += '<tr>';
        row.forEach(function(cell, cIdx) {
            const cellVal = escapeHtml(String(cell !== null && cell !== undefined ? cell : ''));
            if (cIdx === 0 || cIdx === 1) {
                html += '<td class="td-center ' + rowClass + '"><b>' + cellVal + '</b></td>';
            } else if (cIdx === 3) {
                html += '<td class="td-center ' + rowClass + '">' + cellVal + '</td>';
            } else if (cIdx === 5) {
                html += '<td class="td-badge ' + rowClass + '">' + cellVal + '</td>';
            } else {
                html += '<td class="td-c ' + rowClass + '">' + cellVal + '</td>';
            }
        });
        html += '</tr>';
    });

    // Fila Pie de Página
    html += '<tr><td colspan="' + colSpan + '" class="b-footer">🙌 Total de Registros: ' + rows.length + ' • "A Dios sea toda la gloria, honra y bendición" • Amén</td></tr>';
    html += '</table></body></html>';

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const fullFilename = filename.endsWith('.xls') ? filename : (filename.replace(/\.csv$/, '') + '.xls');

    if (window.navigator && window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveOrOpenBlob(blob, fullFilename);
        return;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fullFilename);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(function() {
        if (document.body.contains(link)) document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, 1500);

    if (typeof showToast === 'function') {
        showToast('📥 Libro Excel con diseño pastoral descargado con éxito', 'success');
    }
}
window.downloadExcelStyled = downloadExcelStyled;

function downloadExcelCSV(filename, headers, rows) {
    const BOM = '\uFEFF';
    const sanitizeCell = (val) => {
        if (val === null || val === undefined) return '""';
        let str = String(val).replace(/"/g, '""');
        return '"' + str + '"';
    };
    const headerLine = headers.map(sanitizeCell).join(';');
    const dataLines = rows.map(row => row.map(sanitizeCell).join(';'));
    const csvContent = BOM + [headerLine, ...dataLines].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    if (window.navigator && window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveOrOpenBlob(blob, filename);
        return;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename.endsWith('.csv') ? filename : (filename + '.csv'));
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
        if (document.body.contains(link)) document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, 1500);
}
window.downloadExcelCSV = downloadExcelCSV;

function downloadVisitorsExcel() {
    let visitors = [];
    if (typeof appData !== 'undefined' && appData && Array.isArray(appData.visitors) && appData.visitors.length > 0) {
        visitors = appData.visitors;
    } else if (typeof window !== 'undefined' && window.appData && Array.isArray(window.appData.visitors) && window.appData.visitors.length > 0) {
        visitors = window.appData.visitors;
    } else {
        try {
            const raw = localStorage.getItem(typeof STORAGE_KEY !== 'undefined' ? STORAGE_KEY : 'RadioVisionRTV_AppData_v4');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && Array.isArray(parsed.visitors) && parsed.visitors.length > 0) {
                    visitors = parsed.visitors;
                }
            }
        } catch (e) {}
    }

    const headers = ['ID', 'Fecha', 'Nombre Completo', 'Teléfono / WhatsApp', 'Ciudad / Anexo', 'Motivo', 'Notas Pastorales'];
    let rows;
    if (visitors.length > 0) {
        rows = visitors.map(v => [
            v.id || '',
            v.date || '',
            v.name || '',
            v.phone || '',
            v.city || '',
            v.reason || '',
            v.notes || ''
        ]);
    } else {
        rows = [
            [
                'VIS-001',
                new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
                'Plantilla Oficial - Libro de Visitantes',
                '+51 932 028 894',
                'Challhuahuacho',
                'Primera vez en la congregación',
                'Registro activo de bienvenida pastoral'
            ]
        ];
    }

    const dateStr = new Date().toISOString().slice(0, 10);
    downloadExcelStyled({
        filename: 'RadioVision_Visitantes_' + dateStr + '.xls',
        sheetName: 'Visitantes Web',
        subTitle: 'LIBRO PASTORAL DE BIENVENIDA Y NUEVOS VISITANTES',
        verseText: 'Yo me alegré con los que me decían: A la casa de Jehová iremos.',
        verseRef: 'Salmos 122:1',
        secondaryVerse: 'Por tanto, recibíos los unos a los otros, como también Cristo nos recibió, para gloria de Dios. — Romanos 15:7',
        headerBg: '#0f766e',
        headers: headers,
        rows: rows
    });
}
window.downloadVisitorsExcel = downloadVisitorsExcel;

function downloadCultoDecisionsExcel() {
    let decisions = [];
    if (typeof appData !== 'undefined' && appData && Array.isArray(appData.cultoDecisions) && appData.cultoDecisions.length > 0) {
        decisions = appData.cultoDecisions;
    } else if (typeof window !== 'undefined' && window.appData && Array.isArray(window.appData.cultoDecisions) && window.appData.cultoDecisions.length > 0) {
        decisions = window.appData.cultoDecisions;
    } else {
        try {
            const raw = localStorage.getItem(typeof STORAGE_KEY !== 'undefined' ? STORAGE_KEY : 'RadioVisionRTV_AppData_v4');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && Array.isArray(parsed.cultoDecisions) && parsed.cultoDecisions.length > 0) {
                    decisions = parsed.cultoDecisions;
                }
            }
        } catch (e) {}
    }

    const headers = ['ID', 'Fecha y Hora', 'Nombre Completo', 'Teléfono / WhatsApp', 'Ciudad / Comunidad', 'Motivo / Decisión', 'Consejero / Líder', 'Notas Pastorales'];
    let rows;
    if (decisions.length > 0) {
        rows = decisions.map(d => [
            d.id || '',
            d.date || '',
            d.name || '',
            d.phone || '',
            d.city || '',
            d.decisionType || '',
            d.counselor || '',
            d.notes || ''
        ]);
    } else {
        rows = [
            [
                'DEC-001',
                new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
                'Plantilla Oficial - Libro de Decisiones',
                '+51 932 028 894',
                'Challhuahuacho',
                'Reconciliación con Dios / Primera Vez',
                'Pastor Richard Dávila',
                'Registro ministerial listo para cultos'
            ]
        ];
    }

    const dateStr = new Date().toISOString().slice(0, 10);
    downloadExcelStyled({
        filename: 'RadioVision_Decisiones_Culto_' + dateStr + '.xls',
        sheetName: 'Decisiones en Culto',
        subTitle: 'LIBRO OFICIAL DE DECISIONES DE CULTO Y RECONCILIACIÃ“N CON DIOS',
        verseText: 'De modo que si alguno está en Cristo, nueva criatura es; las cosas viejas pasaron; he aquí todas son hechas nuevas.',
        verseRef: '2 Corintios 5:17',
        secondaryVerse: 'Así os digo que hay gozo delante de los ángeles de Dios por un pecador que se arrepiente. — Lucas 15:10',
        headerBg: '#047857',
        headers: headers,
        rows: rows
    });
}
window.downloadCultoDecisionsExcel = downloadCultoDecisionsExcel;

function downloadAllMinisterialExcel() {
    let visitors = [];
    let decisions = [];
    if (typeof appData !== 'undefined' && appData) {
        visitors = appData.visitors || [];
        decisions = appData.cultoDecisions || [];
    } else if (typeof window !== 'undefined' && window.appData) {
        visitors = window.appData.visitors || [];
        decisions = window.appData.cultoDecisions || [];
    }
    const headers = ['Tipo de Registro', 'ID', 'Fecha', 'Nombre Completo', 'Teléfono / WhatsApp', 'Ciudad / Comunidad', 'Motivo / Decisión', 'Consejero / Líder', 'Notas'];
    const rows = [];
    visitors.forEach(v => {
        rows.push(['VISITANTE WEB', v.id || '', v.date || '', v.name || '', v.phone || '', v.city || '', v.reason || '', 'Página Web', v.notes || '']);
    });
    decisions.forEach(d => {
        rows.push(['DECISIÃ“N EN CULTO', d.id || '', d.date || '', d.name || '', d.phone || '', d.city || '', d.decisionType || '', d.counselor || '', d.notes || '']);
    });
    if (rows.length === 0) {
        rows.push(['DECISIÓN EN CULTO', 'DEC-001', new Date().toLocaleDateString('es-ES'), 'Plantilla Oficial Consolidada', '+51 932 028 894', 'Challhuahuacho', 'Reconciliación con Dios', 'Pastor Richard Dávila', 'Libro Consolidado']);
    }
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadExcelStyled({
        filename: 'RadioVision_Libro_Consolidado_Pastoral_' + dateStr + '.xls',
        sheetName: 'Consolidado Pastoral',
        subTitle: 'LIBRO CONSOLIDADO MINISTERIAL — DECISIONES Y VISITANTES',
        verseText: 'Mas a todos los que le recibieron, a los que creen en su nombre, les dio potestad de ser hechos hijos de Dios.',
        verseRef: 'Juan 1:12',
        secondaryVerse: 'Pero yo y mi casa serviremos a Jehová. — Josué 24:15',
        headerBg: '#1e3a8a',
        headers: headers,
        rows: rows
    });
}
window.downloadAllMinisterialExcel = downloadAllMinisterialExcel;

function renderCultoDecision() {
    const container = document.getElementById('cultoDecisionsCount');
    if (container && window.appData && window.appData.cultoDecisions) {
        container.textContent = window.appData.cultoDecisions.length;
    }
}
window.renderCultoDecision = renderCultoDecision;

async function submitCultoDecision(e) {
    if (e) e.preventDefault();
    const nameEl = document.getElementById('cultoDecName');
    const phoneEl = document.getElementById('cultoDecPhone');
    const cityEl = document.getElementById('cultoDecCity');
    const typeEl = document.getElementById('cultoDecType');
    const counselorEl = document.getElementById('cultoDecCounselor');
    const notesEl = document.getElementById('cultoDecNotes');
    const fb = document.getElementById('cultoDecFeedback');

    if (!nameEl || !phoneEl || !cityEl) return;
    const name = nameEl.value.trim();
    const phone = phoneEl.value.trim();
    const city = cityEl.value.trim();
    const decisionType = typeEl ? typeEl.value : 'Reconciliación con Dios';
    const counselor = counselorEl ? counselorEl.value.trim() : '';
    const notes = notesEl ? notesEl.value.trim() : '';

    if (!name || !phone || !city) {
        if (typeof showToast === 'function') showToast('Por favor completa Nombre, Teléfono/WhatsApp y Ciudad.', 'error');
        return;
    }
    if (typeof isValidPhoneNumber === 'function' && !isValidPhoneNumber(phone)) {
        if (typeof showToast === 'function') showToast('Por favor ingresa un número de teléfono o WhatsApp válido', 'error');
        return;
    }

    if (!appData.cultoDecisions) appData.cultoDecisions = [];
    const now = new Date();
    const dateFormatted = now.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    
    const newDec = {
        id: 'dec_' + Date.now(),
        type: 'culto_decision',
        name: name,
        phone: phone,
        city: city,
        decisionType: decisionType,
        counselor: counselor || 'Líder de Altar',
        notes: notes,
        date: dateFormatted
    };

    appData.cultoDecisions.unshift(newDec);

    try {
        if (typeof db !== 'undefined' && db && db.objectStoreNames.contains('store')) {
            const tx = db.transaction(['store'], 'readwrite');
            tx.objectStore('store').put(appData, 'appData');
        }
        localStorage.setItem(typeof STORAGE_KEY !== 'undefined' ? STORAGE_KEY : 'RadioVisionRTV_AppData_v4', JSON.stringify(appData));
    } catch(err) {}

    if (typeof firebaseDB !== 'undefined' && firebaseDB) {
        firebaseDB.collection('culto_decisions').doc(newDec.id).set(newDec).catch(err => console.warn('[Decisiones Cloud]:', err));
    }

    // Sincronizar automáticamente con el libro de Google Sheets
    sendToGoogleSheets(newDec);

    if (fb) {
        fb.classList.remove('hidden');
        fb.innerHTML = '✅ ¡Gloria a Dios! Se registró la decisión de ' + escapeHtml(name) + ' en el Libro Excel pastoral.';
    }

    if (typeof renderCultoDecision === 'function') renderCultoDecision();

    // Modal de confirmación con accesos directos a WhatsApp y descarga Excel
    openCultoSuccessModal(newDec);

    const form = document.getElementById('formCultoDecision');
    if (form) form.reset();
    if (typeof trackAppEvent === 'function') trackAppEvent('Decisión Culto', decisionType, name);
}
window.submitCultoDecision = submitCultoDecision;

function openCultoSuccessModal(decData) {
    const modal = document.getElementById('cultoSuccessModal');
    if (!modal) return;
    
    const isQu = typeof getAppLanguage === 'function' && getAppLanguage() === 'qu';
    const nameEl = document.getElementById('cultoModalName');
    const cityEl = document.getElementById('cultoModalCity');
    const typeEl = document.getElementById('cultoModalType');
    const counselorEl = document.getElementById('cultoModalCounselor');
    const waPastorBtn = document.getElementById('cultoModalWaPastorBtn');
    const waBrotherBtn = document.getElementById('cultoModalWaBrotherBtn');

    if (nameEl) nameEl.textContent = decData.name || '';
    if (cityEl) cityEl.textContent = decData.city || '';
    if (typeEl) typeEl.textContent = decData.decisionType || '';
    if (counselorEl) counselorEl.textContent = decData.counselor || 'Líder en Altar';

    const pastorPhone = '51932028894';
    const pastorMsg = encodeURIComponent(
        isQu
            ? ('🙌 *CULTOPI DIOSMAN KUTIRIKUY / ENTREGA*\n━━━━━━━━━━━━━━━━━━━━\n👤 *Wauqi/Pana:* ' + decData.name + '\n📞 *Celular:* ' + decData.phone + '\n📍 *Llaqta:* ' + decData.city + '\n✝️ *Motivo:* ' + decData.decisionType + '\n🤝 *Yanapaq:* ' + decData.counselor + (decData.notes ? ('\n📝 *Nota:* ' + decData.notes) : '') + '\n━━━━━━━━━━━━━━━━━━━━\n¡Diospa sutin yupaychasqa kachun!')
            : ('🙌 *NUEVA DECISIÓN EN EL ALTAR DEL CULTO*\n━━━━━━━━━━━━━━━━━━━━\n👤 *Hermano(a):* ' + decData.name + '\n📞 *Celular:* ' + decData.phone + '\n📍 *Ciudad/Comunidad:* ' + decData.city + '\n✝️ *Decisión:* ' + decData.decisionType + '\n🤝 *Consejero:* ' + decData.counselor + (decData.notes ? ('\n📝 *Petición:* ' + decData.notes) : '') + '\n━━━━━━━━━━━━━━━━━━━━\n¡A Dios sea la gloria! Registrado en Libro Excel pastoral.')
    );
    if (waPastorBtn) waPastorBtn.href = 'https://wa.me/' + pastorPhone + '?text=' + pastorMsg;

    const cleanBrotherPhone = (decData.phone || '').replace(/[^0-9]/g, '');
    if (waBrotherBtn) {
        if (cleanBrotherPhone) {
            const brotherMsg = encodeURIComponent(
                isQu
                    ? ('¡Allin hamusqayki Jesucristopa ayllunman, qammi kanki ' + decData.name + '! RadioVisión RTV wan IMCOTNV iglesiamanta napaykamuykiku. Diosmi kawsayniykita qallarin musuqmanta. ¡Wauqi-panaykikunam kanchik!')
                    : ('¡Bienvenido(a) a la familia de Dios en Cristo, querido(a) hermano(a) ' + decData.name + '! Te saludamos con gozo de parte de RadioVisión RTV e Iglesia Misionera IMCOTNV. Tu decisión en el altar marca un bendecido nuevo comienzo. ¡Estamos para acompañarte y bendecirte!')
            );
            waBrotherBtn.href = 'https://wa.me/' + cleanBrotherPhone + '?text=' + brotherMsg;
            waBrotherBtn.style.display = 'flex';
        } else {
            waBrotherBtn.style.display = 'none';
        }
    }

    if (typeof applyLanguageTranslations === 'function' && typeof getAppLanguage === 'function') {
        applyLanguageTranslations(getAppLanguage());
    }

    modal.classList.remove('hidden');
    modal.style.display = 'flex';
}
window.openCultoSuccessModal = openCultoSuccessModal;

function closeCultoSuccessModal() {
    const modal = document.getElementById('cultoSuccessModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
}
window.closeCultoSuccessModal = closeCultoSuccessModal;

        // EXPORTACIONES GLOBALES DE NOTIFICACIONES Y FORMULARIOS
        // ==============================================================
        if (typeof closeShareModal === 'function') window.closeShareModal = closeShareModal;
        if (typeof executeShareAction === 'function') window.executeShareAction = executeShareAction;
        if (typeof closeNewTestimonialModal === 'function') window.closeNewTestimonialModal = closeNewTestimonialModal;
        if (typeof submitNewTestimonial === 'function') window.submitNewTestimonial = submitNewTestimonial;
        if (typeof enableLivePushNotifications === 'function') window.enableLivePushNotifications = enableLivePushNotifications;
        if (typeof shareCurrentBiblePassage === 'function') window.shareCurrentBiblePassage = shareCurrentBiblePassage;
        if (typeof filterTestimonials === 'function') window.filterTestimonials = filterTestimonials;
        if (typeof submitPrayer === 'function') window.submitPrayer = submitPrayer;
        if (typeof submitVisitorForm === 'function') window.submitVisitorForm = submitVisitorForm;
        if (typeof goToVisitorStep === 'function') window.goToVisitorStep = goToVisitorStep;
        if (typeof submitCultoDecision === 'function') window.submitCultoDecision = submitCultoDecision;
        if (typeof openCultoSuccessModal === 'function') window.openCultoSuccessModal = openCultoSuccessModal;
        if (typeof closeCultoSuccessModal === 'function') window.closeCultoSuccessModal = closeCultoSuccessModal;
        if (typeof renderCultoDecision === 'function') window.renderCultoDecision = renderCultoDecision;
        if (typeof downloadVisitorsExcel === 'function') window.downloadVisitorsExcel = downloadVisitorsExcel;
        if (typeof downloadCultoDecisionsExcel === 'function') window.downloadCultoDecisionsExcel = downloadCultoDecisionsExcel;
        if (typeof downloadAllMinisterialExcel === 'function') window.downloadAllMinisterialExcel = downloadAllMinisterialExcel;
        if (typeof sendToGoogleSheets === 'function') window.sendToGoogleSheets = sendToGoogleSheets;


// ==============================================================
// MÓDULO EVENTS: EVENTOS, CULTOS, SEDES Y MINISTERIOS
// ==============================================================

        // INDICADOR VISUAL EN VIVO Y TEMPORIZADOR DE CULTOS EN TIEMPO REAL
        // ==============================================================
        function parseScheduleToServices(scheduleStr, configuredTitle) {
            if (!scheduleStr || typeof scheduleStr !== 'string') return [];
            
            const dayMap = {
                'domingo': 0, 'domingos': 0,
                'lunes': 1,
                'martes': 2,
                'miercoles': 3, 'miércoles': 3,
                'jueves': 4,
                'viernes': 5,
                'sabado': 6, 'sábado': 6, 'sabados': 6, 'sábados': 6
            };
            const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

            const raw = scheduleStr.trim();
            const parts = raw.split(/[•|;\n]+/).map(p => p.trim()).filter(Boolean);
            const services = [];

            parts.forEach(part => {
                const dayRegex = /\b(domingos?|lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bados?)\b/gi;
                const matches = [...part.matchAll(dayRegex)];

                if (matches.length === 0) return;

                if (matches.length === 1) {
                    const rawDay = matches[0][0].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                    const dayNum = dayMap[rawDay] !== undefined ? dayMap[rawDay] : 0;
                    const dayLabel = dayNames[dayNum];

                    const timeRegex = /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?\b/gi;
                    const timeMatches = [...part.matchAll(timeRegex)].filter(tm => tm[2] !== undefined || tm[3] !== undefined);

                    timeMatches.forEach(tm => {
                        let hour = parseInt(tm[1], 10);
                        let minute = tm[2] ? parseInt(tm[2], 10) : 0;
                        const mer = tm[3] ? tm[3].toLowerCase().replace(/\./g, '') : null;

                        if (mer === 'pm' && hour < 12) hour += 12;
                        if (mer === 'am' && hour === 12) hour = 0;

                        const displayH = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
                        const ampm = hour >= 12 ? 'PM' : 'AM';
                        const formattedTimeStr = `${dayLabel} ${String(displayH).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${ampm}`;

                        services.push({
                            day: dayNum,
                            hour: hour,
                            minute: minute,
                            title: configuredTitle,
                            timeStr: formattedTimeStr
                        });
                    });
                } else {
                    for (let i = 0; i < matches.length; i++) {
                        const startIdx = matches[i].index;
                        const endIdx = (i + 1 < matches.length) ? matches[i + 1].index : part.length;
                        const subChunk = part.substring(startIdx, endIdx);

                        const rawDay = matches[i][0].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                        const dayNum = dayMap[rawDay] !== undefined ? dayMap[rawDay] : 0;
                        const dayLabel = dayNames[dayNum];

                        const timeRegex = /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?\b/gi;
                        const timeMatches = [...subChunk.matchAll(timeRegex)].filter(tm => tm[2] !== undefined || tm[3] !== undefined);

                        timeMatches.forEach(tm => {
                            let hour = parseInt(tm[1], 10);
                            let minute = tm[2] ? parseInt(tm[2], 10) : 0;
                            const mer = tm[3] ? tm[3].toLowerCase().replace(/\./g, '') : null;

                            if (mer === 'pm' && hour < 12) hour += 12;
                            if (mer === 'am' && hour === 12) hour = 0;

                            const displayH = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
                            const ampm = hour >= 12 ? 'PM' : 'AM';
                            const formattedTimeStr = `${dayLabel} ${String(displayH).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${ampm}`;

                            services.push({
                                day: dayNum,
                                hour: hour,
                                minute: minute,
                                title: configuredTitle,
                                timeStr: formattedTimeStr
                            });
                        });
                    }
                }
            });

            return services;
        }

        function getLiveStatusInfo() {
            const now = new Date();
            const currentDay = now.getDay();
            const hours = now.getHours();
            const minutes = now.getMinutes();
            const currentTimeInMinutes = hours * 60 + minutes;

            const currentLang = (typeof getAppLanguage === 'function') ? getAppLanguage() : 'es';

            let configuredTitle = (appData && appData.liveService && appData.liveService.title) ? appData.liveService.title : "Culto Congregacional";
            if (currentLang === 'qu') {
                if (appData && appData.liveService && appData.liveService.title_qu) {
                    configuredTitle = appData.liveService.title_qu;
                } else if (configuredTitle === "Culto de Avivamiento, Alabanza y Sana Doctrina") {
                    configuredTitle = "Kawsarichiy, Yupaychay Chuya Yachachikuy Huñunakuy";
                }
            }

            let configuredSchedule = (appData && appData.liveService && appData.liveService.schedule) ? appData.liveService.schedule : "Miércoles 07:00 PM • Domingos 10:00 AM y 06:00 PM";
            const scheduleForParse = configuredSchedule;
            if (currentLang === 'qu') {
                if (appData && appData.liveService && appData.liveService.schedule_qu) {
                    configuredSchedule = appData.liveService.schedule_qu;
                } else {
                    configuredSchedule = "Miercoles 07:00 PM • Domingokuna 10:00 AM & 06:00 PM";
                }
            }

            const forceLive = (appData && appData.liveService && appData.liveService.forceLive) ? appData.liveService.forceLive : 'auto';

            // Analizar dinámicamente los servicios según el horario configurado en el panel administrativo
            let services = parseScheduleToServices(scheduleForParse, configuredTitle);
            if (services.length === 0) {
                services = [
                    { day: 3, hour: 19, minute: 0, title: configuredTitle, timeStr: (currentLang === 'qu' ? "Miercoles 07:00 PM" : "Miércoles 07:00 PM") },
                    { day: 0, hour: 10, minute: 0, title: configuredTitle, timeStr: "Domingo 10:00 AM" },
                    { day: 0, hour: 18, minute: 0, title: configuredTitle, timeStr: "Domingo 06:00 PM" }
                ];
            } else if (currentLang === 'qu') {
                services = services.map(srv => {
                    let ts = srv.timeStr || '';
                    ts = ts.replace(/Miércoles/gi, 'Miercoles').replace(/Sábado/gi, 'Sabado').replace(/Domingos/gi, 'Domingokuna');
                    return { ...srv, timeStr: ts };
                });
            }

            let isLive = false;
            let activeService = null;

            if (forceLive === 'live') {
                isLive = true;
            } else if (forceLive === 'offline') {
                isLive = false;
            } else {
                // Detección automática en vivo basada en el horario programado (duración 2h 30m)
                for (const srv of services) {
                    if (srv.day === currentDay) {
                        const srvStartMinutes = srv.hour * 60 + srv.minute;
                        const srvEndMinutes = srvStartMinutes + 150;
                        if (currentTimeInMinutes >= srvStartMinutes && currentTimeInMinutes <= srvEndMinutes) {
                            isLive = true;
                            activeService = srv;
                            break;
                        }
                    }
                }
            }

            if (isLive) {
                return {
                    isLive: true,
                    title: configuredTitle,
                    desc: (currentLang === 'qu') ? "¡Kawsaypi culto señalta kunanpacha transmitichkaniku!" : "¡Estamos transmitiendo la señal del culto ahora mismo!",
                    timeStr: activeService ? activeService.timeStr : configuredSchedule,
                    fullSchedule: configuredSchedule,
                    summaryText: (currentLang === 'qu') ? "¡Kawsaypim kachkaniku!" : "¡Estamos en Vivo ahora mismo!",
                    countdownClock: (currentLang === 'qu') ? "KAWSAYPI" : "EN VIVO"
                };
            }

            // Calcular próximo servicio cronológico
            let nextService = null;
            let minDiffMs = Infinity;

            services.forEach(srv => {
                let targetDate = new Date(now);
                let daysAhead = (srv.day - currentDay + 7) % 7;
                if (daysAhead === 0) {
                    const targetMinutes = srv.hour * 60 + srv.minute;
                    if (currentTimeInMinutes >= targetMinutes) {
                        daysAhead = 7;
                    }
                }
                targetDate.setDate(now.getDate() + daysAhead);
                targetDate.setHours(srv.hour, srv.minute, 0, 0);

                const diff = targetDate.getTime() - now.getTime();
                if (diff > 0 && diff < minDiffMs) {
                    minDiffMs = diff;
                    nextService = { ...srv, diffMs: diff, targetDate };
                }
            });

            if (!nextService) {
                nextService = services[0];
            }

            const totalSeconds = Math.max(0, Math.floor(minDiffMs / 1000));
            const d = Math.floor(totalSeconds / 86400);
            const h = Math.floor((totalSeconds % 86400) / 3600);
            const m = Math.floor((totalSeconds % 3600) / 60);
            const s = totalSeconds % 60;

            let countdownClock = "";
            if (d > 0) {
                countdownClock = `${d}d ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
            } else {
                countdownClock = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
            }

            let summaryText = "";
            if (currentLang === 'qu') {
                if (d === 0 && h === 0) {
                    summaryText = `Puchukanmi ${m}m ${s}s`;
                } else if (d === 0) {
                    summaryText = `Puchukanmi ${h}h hinaspa ${m}m`;
                } else if (d === 1) {
                    summaryText = `Puchukanmi 1 punchaw hinaspa ${h}h`;
                } else {
                    summaryText = `Puchukanmi ${d} punchawkuna hinaspa ${h}h`;
                }
            } else {
                if (d === 0 && h === 0) {
                    summaryText = `Faltan ${m}m ${s}s`;
                } else if (d === 0) {
                    summaryText = `Faltan ${h}h y ${m}m`;
                } else if (d === 1) {
                    summaryText = `Falta 1 día y ${h}h`;
                } else {
                    summaryText = `Faltan ${d} días y ${h}h`;
                }
            }

            let nextTimeStr = (nextService && nextService.timeStr) ? nextService.timeStr : configuredSchedule;
            if (currentLang === 'qu') {
                nextTimeStr = nextTimeStr.replace(/Miércoles/gi, 'Miercoles').replace(/Sábado/gi, 'Sabado').replace(/Domingos/gi, 'Domingokuna');
            }

            return {
                isLive: false,
                diffMs: minDiffMs,
                title: configuredTitle,
                timeStr: nextTimeStr,
                fullSchedule: configuredSchedule,
                summaryText: summaryText,
                countdownClock: countdownClock,
                desc: (currentLang === 'qu') ? `Iñiqkunapa huñunakuynin: ${configuredSchedule}` : `Reunión congregacional: ${configuredSchedule}`
            };
        }


// ==============================================================
// NEW RENDER FUNCTIONS FOR 18-SECTION ARCHITECTURE
// ==============================================================

function renderNosotros() {
    if (!appData.about) return;
    const titleEl = document.getElementById('aboutMainTitle');
    const missionEl = document.getElementById('aboutMissionText');
    const visionEl = document.getElementById('aboutVisionText');
    const purposeEl = document.getElementById('aboutPurposeText');

    if (titleEl) titleEl.innerText = appData.about.title || 'Quiénes Somos';
    if (missionEl) missionEl.innerText = appData.about.mission || '';
    if (visionEl) visionEl.innerText = appData.about.vision || '';
    if (purposeEl) purposeEl.innerText = appData.about.purpose || '';

    if (appData.missionary && appData.missionary.stats) {
        const s = appData.missionary.stats;
        const abCommEl = document.getElementById('aboutStatCommunities');
        const abAnnEl = document.getElementById('aboutStatAnnexes');
        if (abCommEl && s.communities) {
            abCommEl.innerText = String(s.communities).split(' ')[0] || '28+';
        }
        if (abAnnEl && s.annexes) {
            abAnnEl.innerText = String(s.annexes).split(' ')[0] || '8';
        }
    }
}

let currentPastorFilter = 'all';
function filterPastors(category) {
    currentPastorFilter = category;
    const buttons = ['all', 'principal', 'pastora', 'equipo', 'lider'];
    buttons.forEach(b => {
        const btn = document.getElementById('btn-pas-' + b);
        if (btn) {
            if (b === category) {
                btn.className = 'px-4 py-2 rounded-xl text-xs font-bold transition-all bg-amber-500 text-slate-950 shadow-sm';
            } else {
                btn.className = 'px-4 py-2 rounded-xl text-xs font-bold transition-all bg-slate-100 dark:bg-[#0b152d] text-slate-700 dark:text-slate-300 hover:text-amber-600 border border-slate-300 dark:border-[#1d2d54]';
            }
        }
    });
    renderPastors();
}

function renderPastors() {
    const grid = document.getElementById('pastorsGrid');
    if (!grid || !appData.pastors) return;

    const filtered = (currentPastorFilter === 'all')
        ? appData.pastors
        : appData.pastors.filter(p => p.category === currentPastorFilter);

    const currentLang = (typeof getAppLanguage === 'function') ? getAppLanguage() : 'es';

    if (filtered.length === 0) {
        grid.innerHTML = (currentLang === 'qu')
            ? '<div class="col-span-full text-center py-10 text-slate-500 text-sm">Manam kanchu liderazgo registros kay categoría nisqapi.</div>'
            : '<div class="col-span-full text-center py-10 text-slate-500 text-sm">No hay registros en esta categoría de liderazgo.</div>';
        return;
    }

    grid.innerHTML = filtered.map(p => {
        const photo = p.photo || 'img/logo-iglesia.jpg';
        let role = (currentLang === 'qu' && p.role_qu) ? p.role_qu : p.role;
        if (currentLang === 'qu') {
            if (p.role_qu) {
                role = p.role_qu;
            } else if (p.role === 'Pastor Principal & Director General') {
                role = 'Hatun Pastor & Director General';
            } else if (p.role === 'Pastora & Líder de Ministerio Femenil y Familia') {
                role = 'Pastora & Warmikunapa Ayllukunapa Umalliqnin';
            } else if (p.category === 'principal') {
                role = 'Hatun Pastor & Director General';
            } else if (p.category === 'pastora') {
                role = 'Pastora & Warmikunapa Ayllukunapa Umalliqnin';
            } else if (!role) {
                role = 'Ministerial Umalliq';
            }
        } else if (!role) {
            role = 'Líder Ministerial';
        }
        role = escapeHtml(role);

        const name = escapeHtml(p.name || '');
        let bio = (currentLang === 'qu' && p.bio_qu) ? p.bio_qu : p.bio;
        if (currentLang === 'qu' && !p.bio_qu) {
            if (p.id === 'pas1' || p.category === 'principal') {
                bio = "Diospa qayasqan llapa Suyukunapaq Mañakuna Wasi (IMCOTNV) pastoreananpaq, chuya yachachikuyta willananpaq hinaspa Cristopi qespikuyta llapa suyukunaman willananpaq.";
            } else if (p.id === 'pas2' || p.category === 'pastora') {
                bio = "Mañakuypi, ayllukuna kallpachaypi, casado kaqkunapaq biblia yuyaychaypi hinaspa llapa Suyukunapaq Mañakuna Wasipi (IMCOTNV) espiritupi kallpachaypi llamk'aq.";
            }
        }
        bio = escapeHtml(bio || '');

        let verseText = (currentLang === 'qu' && p.favoriteVerse_qu) ? p.favoriteVerse_qu : p.favoriteVerse;
        if (currentLang === 'qu' && !p.favoriteVerse_qu) {
            if (p.id === 'pas1' || (p.favoriteVerse && p.favoriteVerse.includes('Salmos 2:8'))) {
                verseText = 'Salmos 2:8 - "Mañakuway, hinaspan herenciatan qosqayki nacionkunata..."';
            } else if (p.id === 'pas2' || (p.favoriteVerse && p.favoriteVerse.includes('Proverbios 31:30'))) {
                verseText = 'Proverbios 31:30 - "...Jehová Diosta manchakuq warmin ichaqa yupaychasqa kanqa."';
            }
        }
        const verse = verseText ? `<p class="text-[11px] text-amber-700 dark:text-amber-400 italic mt-2"><i class="fa-solid fa-quote-left mr-1"></i>${escapeHtml(verseText)}</p>` : '';
        const prayerBtnText = (currentLang === 'qu') ? 'Mañakuyta Mañay' : 'Pedir Oración';
        const tagMinistry = (currentLang === 'qu') ? 'RTV Ministerio' : 'Ministerio RTV';

        return `
            <div class="bg-white dark:bg-[#0b152d] border border-slate-200 dark:border-[#1d2d54] rounded-3xl p-6 sm:p-7 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between">
                <div>
                    <div class="relative w-28 h-28 mx-auto mb-5 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-md bg-slate-100 dark:bg-slate-800">
                        <img src="${photo}" alt="${name}" loading="lazy" decoding="async" class="w-full h-full object-cover group-hover:scale-105 transition-transform" onerror="if(window.EMBEDDED_CHURCH_LOGO) this.src=window.EMBEDDED_CHURCH_LOGO;">
                    </div>
                    <div class="text-center space-y-1.5">
                        <span class="text-[10px] font-extrabold uppercase tracking-widest text-amber-600 bg-amber-500/10 px-2.5 py-0.5 rounded-full inline-block">${role}</span>
                        <h4 class="text-lg font-bold text-slate-900 dark:text-white">${name}</h4>
                        <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-2 text-left">${bio}</p>
                        ${verse}
                    </div>
                </div>
                <div class="pt-4 mt-4 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs text-slate-500">
                    <span class="flex items-center gap-1.5"><i class="fa-solid fa-shield-halved text-amber-600"></i> ${tagMinistry}</span>
                    <button onclick="showSection('oracion')" class="text-amber-600 hover:underline font-bold text-xs">${prayerBtnText}</button>
                </div>
            </div>
        `;
    }).join('');
}

function renderCultoCentral() {
    if (!appData.cultoCentral) return;
    const tableBody = document.getElementById('cultoCalendarTableBody');
    if (!tableBody) return;

    const currentLang = (typeof getAppLanguage === 'function') ? getAppLanguage() : 'es';
    const calendar = appData.cultoCentral.calendar || [];
    tableBody.innerHTML = calendar.map((c, idx) => {
        let dayText = c.day;
        let eventText = (currentLang === 'qu' && c.event_qu) ? c.event_qu : c.event;
        let timeText = (currentLang === 'qu' && c.time_qu) ? c.time_qu : c.time;
        let hostText = (currentLang === 'qu' && c.host_qu) ? c.host_qu : c.host;

        if (currentLang === 'qu') {
            if (c.day === 'Miércoles') dayText = 'Miercoles';
            else if (c.day === 'Sábado') dayText = 'Sabado';
            else if (c.day === 'Domingo') dayText = 'Domingo';

            if (!c.event_qu && c.event) {
                if (c.event.indexOf('Clamor y Sanidad') !== -1) eventText = 'Qapariy Mañakuy & Allinyachiy Huñunakuy';
                else if (c.event.indexOf('Juvenil') !== -1) eventText = 'Waynakunapa Huñunakuynin & Yupaychay Ensayo';
                else if (c.event.indexOf('Escuela Bíblica') !== -1) eventText = 'Biblia Yachay Wasi (8:30 AM) & Yupaychay Huñunakuykuna (10:00 AM & 06:00 PM)';
            }
            if (!c.time_qu && c.time) {
                timeText = c.time.replace(/Templo & En Vivo/gi, 'Templo & Kawsaypi').replace(/ y /g, ' & ');
            }
            if (!c.host_qu && hostText) {
                if (hostText === 'Líderes Juveniles') hostText = 'Waynakunapa Umalliqninkuna';
                else if (hostText === 'Pastores y Congregación') hostText = 'Pastorkuna & Congregación';
            }
        }

        const isHighlight = c.day === 'Domingo' || c.day === 'Miércoles';
        const rowClass = isHighlight ? 'bg-amber-500/5 font-semibold' : '';
        const btnAction = (currentLang === 'qu') ? 'Riy' : 'Asistir';
        return `
            <tr class="${rowClass} hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                <td class="py-3.5 px-4 font-bold text-amber-700 dark:text-amber-400">${escapeHtml(dayText)}</td>
                <td class="py-3.5 px-4 text-slate-900 dark:text-white font-medium">${escapeHtml(eventText)}</td>
                <td class="py-3.5 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300"><i class="fa-solid fa-clock text-amber-500 mr-1.5"></i>${escapeHtml(timeText)}</td>
                <td class="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400">${escapeHtml(hostText || (currentLang === 'qu' ? 'RTV Pastorkuna' : 'Pastores RTV'))}</td>
                <td class="py-3.5 px-4 text-center">
                    <button onclick="showSection('ubicanos')" class="px-2.5 py-1 rounded-lg text-xs bg-slate-100 dark:bg-white/10 hover:bg-amber-500 hover:text-slate-950 font-bold transition-all">
                        <span>${btnAction}</span>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

let currentEventFilter = 'all';
function filterEvents(category) {
    currentEventFilter = category;
    const buttons = ['all', 'proximos', 'campanas', 'conferencias', 'vigilias', 'especiales'];
    buttons.forEach(b => {
        const btn = document.getElementById('btn-ev-' + b);
        if (btn) {
            if (b === category) {
                btn.className = 'px-4 py-2.5 rounded-xl text-xs font-bold transition-all bg-amber-500 text-slate-950 shadow-sm';
            } else {
                btn.className = 'px-4 py-2.5 rounded-xl text-xs font-bold transition-all bg-slate-100 dark:bg-[#0b152d] text-slate-700 dark:text-slate-300 hover:text-amber-600 border border-slate-300 dark:border-[#1d2d54]';
            }
        }
    });
    renderEvents();
}

function renderEventsSkeleton() {
    const grid = document.getElementById('eventsGrid');
    if (!grid) return;
    grid.innerHTML = `
        <div class="col-span-1 rounded-2xl bg-slate-800/60 p-4 border border-slate-700/50 animate-pulse space-y-3">
            <div class="w-full h-40 bg-slate-700/50 rounded-xl"></div>
            <div class="w-2/3 h-4 bg-slate-700/60 rounded"></div>
            <div class="w-full h-3 bg-slate-700/40 rounded"></div>
            <div class="w-1/2 h-3 bg-slate-700/40 rounded"></div>
        </div>
        <div class="col-span-1 rounded-2xl bg-slate-800/60 p-4 border border-slate-700/50 animate-pulse space-y-3 hidden sm:block">
            <div class="w-full h-40 bg-slate-700/50 rounded-xl"></div>
            <div class="w-2/3 h-4 bg-slate-700/60 rounded"></div>
            <div class="w-full h-3 bg-slate-700/40 rounded"></div>
            <div class="w-1/2 h-3 bg-slate-700/40 rounded"></div>
        </div>
        <div class="col-span-1 rounded-2xl bg-slate-800/60 p-4 border border-slate-700/50 animate-pulse space-y-3 hidden md:block">
            <div class="w-full h-40 bg-slate-700/50 rounded-xl"></div>
            <div class="w-2/3 h-4 bg-slate-700/60 rounded"></div>
            <div class="w-full h-3 bg-slate-700/40 rounded"></div>
            <div class="w-1/2 h-3 bg-slate-700/40 rounded"></div>
        </div>
    `;
}
window.renderEventsSkeleton = renderEventsSkeleton;

function renderEvents() {
    const grid = document.getElementById('eventsGrid');
    if (!grid) return;

    const rawEvents = (appData.events && appData.events.length > 0)
        ? appData.events
        : (appData.information && appData.information.events ? appData.information.events : []);

    const filtered = (currentEventFilter === 'all')
        ? rawEvents
        : rawEvents.filter(e => (e.category || 'proximos') === currentEventFilter);

    if (filtered.length === 0) {
        grid.innerHTML = '<div class="col-span-full text-center py-12 text-slate-500 text-sm">No hay eventos registrados en esta categoría.</div>';
        return;
    }

    grid.innerHTML = filtered.map(ev => {
        const title = escapeHtml(ev.title || 'Evento Especial');
        const desc = escapeHtml(ev.desc || '');
        const date = escapeHtml(ev.date || 'Próximamente');
        const time = escapeHtml(ev.time || 'Horario habitual');
        const loc = escapeHtml(ev.location || 'Sede Central Challhuahuacho');
        const badge = escapeHtml(ev.badge || 'Actividad');

        return `
            <div class="bg-white dark:bg-[#0b152d] border border-slate-200 dark:border-[#1d2d54] rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4">
                <div class="space-y-3">
                    <div class="flex items-center justify-between">
                        <span class="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-500/15 border border-amber-500/30 px-3 py-1 rounded-full">${badge}</span>
                        <span class="text-xs text-slate-500 dark:text-slate-400 font-semibold"><i class="fa-solid fa-calendar mr-1 text-amber-500"></i>${date}</span>
                    </div>
                    <h3 class="text-lg font-bold text-slate-900 dark:text-white leading-snug">${title}</h3>
                    <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">${desc}</p>
                    <div class="space-y-1.5 pt-2 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-white/5">
                        <p class="flex items-center gap-2"><i class="fa-solid fa-clock text-amber-600"></i><span>${time}</span></p>
                        <p class="flex items-center gap-2"><i class="fa-solid fa-location-dot text-red-500"></i><span>${loc}</span></p>
                    </div>
                </div>
                <div class="pt-3 flex gap-2">
                    <button onclick="showSection('ubicanos')" class="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-amber-500 hover:text-slate-950 font-bold text-xs transition-all flex items-center justify-center gap-1.5">
                        <i class="fa-solid fa-diamond-turn-right"></i>
                        <span>Cómo Llegar</span>
                    </button>
                    <a href="https://wa.me/51932028894?text=Hola%20Pastor,%20deseo%20m%C3%A1s%20informaci%C3%B3n%20sobre:%20${encodeURIComponent(title)}" target="_blank" class="px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center" title="Consultar por WhatsApp">
                        <i class="fa-brands fa-whatsapp text-sm"></i>
                    </a>
                </div>
            </div>
        `;
    }).join('');
}

function renderSedes() {
    if (typeof renderUbicanos === 'function') renderUbicanos();
    const grid = document.getElementById('annexesGrid');
    if (!grid) return;

    const annexes = (appData.sedes && appData.sedes.anexos)
        ? appData.sedes.anexos
        : (appData.information && appData.information.annexes ? appData.information.annexes : []);

    if (annexes.length === 0) {
        const isQu = (typeof currentLang !== 'undefined' && currentLang === 'qu');
        const emptyTitle = isQu ? 'Hamuq Punchawkunapi Musuq Anexokuna' : 'Próximamente Nuevos Anexos';
        const emptyDesc = isQu ? 'Comunidadkunapi huñunakuna anexokunaqa pisi tiempollamanta willasqa kanqa.' : 'Los anexos y lugares de reunión en comunidades se publicarán muy pronto.';
        grid.innerHTML = `<div class="col-span-full text-center py-12 px-4 bg-white/50 dark:bg-[#0b152d]/50 border border-dashed border-slate-300 dark:border-slate-700 rounded-3xl"><i class="fa-solid fa-church text-slate-400 text-3xl mb-2"></i><h4 class="font-bold text-sm text-slate-700 dark:text-slate-200" data-i18n="sedes.empty_title">${emptyTitle}</h4><p class="text-xs text-slate-500 dark:text-slate-400 mt-1" data-i18n="sedes.empty_desc">${emptyDesc}</p></div>`;
        return;
    }
    grid.innerHTML = annexes.map(an => {
        const name = escapeHtml(an.name || an.title || 'Anexo Regional');
        const addr = escapeHtml(an.address || 'Challhuahuacho, Apurímac');
        const resp = escapeHtml(an.responsible || 'Equipo Misionero RTV');
        const days = escapeHtml(an.schedules || an.days || 'Cultos semanales');
        const wa = an.whatsapp || '';

        return `
            <div class="bg-white dark:bg-[#0b152d] border border-slate-200 dark:border-[#1d2d54] rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
                <div>
                    <span class="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block" data-i18n="sedes.annex_tag">Anexo Ministerial</span>
                    <h4 class="text-base font-bold text-slate-900 dark:text-white mt-1">${name}</h4>
                    <p class="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed"><i class="fa-solid fa-location-dot text-red-500 mr-1.5"></i>${addr}</p>
                    <p class="text-xs text-slate-500 dark:text-slate-400 mt-1"><i class="fa-solid fa-user-tie text-amber-500 mr-1.5"></i>Resp: ${resp}</p>
                    <p class="text-xs text-amber-700 dark:text-amber-400 font-semibold mt-1"><i class="fa-solid fa-calendar mr-1.5"></i>${days}</p>
                </div>
                <div class="pt-3 border-t border-slate-100 dark:border-white/5 flex gap-2">
                    <a href="https://maps.google.com/?q=${encodeURIComponent(addr)}" target="_blank" class="w-full py-2 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold text-xs text-center">
                        Ubicación
                    </a>
                    <a href="https://wa.me/${wa.replace(/[^0-9]/g, '')}?text=Hola%20hermano,%20deseo%20asistir%20al%20${encodeURIComponent(name)}" target="_blank" class="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center">
                        <i class="fa-brands fa-whatsapp"></i>
                    </a>
                </div>
            </div>
        `;
    }).join('');
}

function renderMissionary() {
    if (!appData.missionary) return;

    // Stats
    if (appData.missionary.stats) {
        const s = appData.missionary.stats;
        const cEl = document.getElementById('statCommunities');
        const bEl = document.getElementById('statBibles');
        const aEl = document.getElementById('statAnnexes');
        const vEl = document.getElementById('statVolunteers');
        if (cEl) cEl.innerText = s.communities || '28+';
        if (bEl) bEl.innerText = s.bibles || '5,000+';
        if (aEl) aEl.innerText = s.annexes || '8';
        if (vEl) vEl.innerText = s.volunteers || '45+';

        const abCommEl = document.getElementById('aboutStatCommunities');
        const abAnnEl = document.getElementById('aboutStatAnnexes');
        if (abCommEl && s.communities) abCommEl.innerText = String(s.communities).split(' ')[0] || '28+';
        if (abAnnEl && s.annexes) abAnnEl.innerText = String(s.annexes).split(' ')[0] || '8';
    }

    // Campaigns
    const campGrid = document.getElementById('missionaryCampaignsGrid');
    if (campGrid && appData.missionary.campaigns) {
        campGrid.innerHTML = appData.missionary.campaigns.map(c => `
            <div class="border border-slate-200 dark:border-[#1d2d54] rounded-2xl overflow-hidden bg-slate-50 dark:bg-[#070e24] shadow-sm">
                <img src="${c.photo || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=800'}" alt="${escapeHtml(c.title)}" loading="lazy" decoding="async" class="w-full h-48 object-cover">
                <div class="p-5 space-y-2">
                    <span class="text-[10px] font-bold text-amber-600 uppercase tracking-widest">${escapeHtml(c.date || 'Reporte Misionero')}</span>
                    <h4 class="text-base font-bold text-slate-900 dark:text-white">${escapeHtml(c.title)}</h4>
                    <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">${escapeHtml(c.desc)}</p>
                </div>
            </div>
        `).join('');
    }

    // Testimonies
    const testList = document.getElementById('missionaryTestimoniesList');
    if (testList && appData.missionary.testimonies) {
        testList.innerHTML = appData.missionary.testimonies.map(t => `
            <div class="p-4 rounded-xl bg-slate-50 dark:bg-[#070e24] border border-slate-200 dark:border-[#182648] space-y-1">
                <p class="text-xs text-slate-700 dark:text-slate-200 italic leading-relaxed">"${escapeHtml(t.text)}"</p>
                <span class="text-[11px] font-bold text-amber-600 block text-right">— ${escapeHtml(t.author)}</span>
            </div>
        `).join('');
    }

    // Projects
    const projList = document.getElementById('missionaryProjectsList');
    if (projList && appData.missionary.futureProjects) {
        projList.innerHTML = appData.missionary.futureProjects.map(p => `
            <div class="p-4 rounded-xl bg-slate-50 dark:bg-[#070e24] border border-slate-200 dark:border-[#182648] space-y-1">
                <h5 class="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5"><i class="fa-solid fa-check"></i> ${escapeHtml(p.title)}</h5>
                <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">${escapeHtml(p.desc)}</p>
            </div>
        `).join('');
    }
}

function renderMinistries() {
    const grid = document.getElementById('ministriesGrid');
    if (!grid || !appData.ministries) return;

    grid.innerHTML = appData.ministries.map(min => {
        const name = escapeHtml(min.name || '');
        const desc = escapeHtml(min.desc || '');
        const leader = escapeHtml(min.leader || 'Líder Ministerial');
        const time = escapeHtml(min.time || 'Horario semanal');
        const verse = escapeHtml(min.verse || 'Sagradas Escrituras');
        const icon = min.icon || 'fa-church';

        return `
            <div class="bg-white dark:bg-[#0b152d] border border-slate-200 dark:border-[#1d2d54] rounded-3xl p-7 sm:p-8 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-5">
                <div class="space-y-4">
                    <div class="flex items-center gap-4">
                        <div class="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center text-2xl border border-amber-500/20 shrink-0">
                            <i class="fa-solid ${icon}"></i>
                        </div>
                        <div>
                            <span class="text-[10px] font-black uppercase tracking-widest text-amber-600 block">Ministerio Oficial</span>
                            <h3 class="text-xl font-bold text-slate-900 dark:text-white leading-tight">${name}</h3>
                        </div>
                    </div>
                    <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">${desc}</p>
                    <div class="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-white/5">
                        <p class="flex items-center gap-2"><i class="fa-solid fa-user-check text-amber-600"></i><strong>Responsable:</strong> ${leader}</p>
                        <p class="flex items-center gap-2"><i class="fa-solid fa-clock text-amber-600"></i><strong>Reunión:</strong> ${time}</p>
                        <p class="flex items-center gap-2"><i class="fa-solid fa-book-bible text-amber-600"></i><strong>Versículo lema:</strong> <em>${verse}</em></p>
                    </div>
                </div>
                ${min.documentUrl ? `
                <div class="pt-1">
                    <a href="${min.documentUrl}" download="${escapeHtml(min.documentName || min.name + '.pdf')}" target="_blank" class="w-full py-2 px-3 rounded-xl bg-red-500/15 hover:bg-red-600 text-red-700 dark:text-red-300 hover:text-white border border-red-500/30 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm">
                        <i class="fa-solid fa-file-pdf"></i>
                        <span>Descargar Material (${escapeHtml(min.documentName || 'PDF')})</span>
                    </a>
                </div>
                ` : ''}
                <div class="pt-1">
                    <a href="https://wa.me/51932028894?text=Hola%20Pastor,%20deseo%20integrarme%20al%20${encodeURIComponent(name)}" target="_blank" class="w-full py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500 dark:bg-amber-950/50 dark:hover:bg-amber-500 text-amber-800 dark:text-amber-300 hover:text-slate-950 dark:hover:text-slate-950 border border-amber-500/30 dark:border-amber-500/40 font-bold text-xs flex items-center justify-center gap-2 transition-all">
                        <i class="fa-solid fa-hands-holding"></i>
                        <span>Unirme o Servir en este Ministerio</span>
                    </a>
                </div>
            </div>
        `;
    }).join('');
}

function switchBibleSchoolTab(tab) {
    const tabs = ['primeros-pasos', 'formacion', 'doctrinas'];
    tabs.forEach(t => {
        const btn = document.getElementById('btn-bs-' + (t === 'primeros-pasos' ? 'primeros' : t));
        const view = document.getElementById('bs-tab-' + t);
        if (t === tab) {
            if (btn) btn.className = 'px-5 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all bg-amber-500 text-slate-950 shadow-md';
            if (view) view.classList.remove('hidden');
        } else {
            if (btn) btn.className = 'px-5 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all bg-slate-100 dark:bg-[#0b152d] text-slate-700 dark:text-slate-300 hover:text-amber-600 border border-slate-300 dark:border-[#1d2d54]';
            if (view) view.classList.add('hidden');
        }
    });
}

function renderBibleSchool() {
    if (!appData.bibleSchool) return;

    // Primeros pasos
    const fpGrid = document.getElementById('firstStepsCardsGrid');
    if (fpGrid && appData.bibleSchool.firstSteps) {
        fpGrid.innerHTML = appData.bibleSchool.firstSteps.map(step => `
            <div class="bg-white dark:bg-[#0b152d] border border-slate-200 dark:border-[#1d2d54] rounded-2xl p-6 shadow-sm space-y-3 flex flex-col justify-between">
                <div>
                    <div class="w-12 h-12 bg-amber-500/10 text-amber-600 rounded-xl flex items-center justify-center text-xl mb-3 border border-amber-500/20">
                        <i class="fa-solid ${step.icon || 'fa-cross'}"></i>
                    </div>
                    <span class="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">${escapeHtml(step.citation || 'Biblia')}</span>
                    <h4 class="text-lg font-bold text-slate-900 dark:text-white mt-0.5">${escapeHtml(step.title)}</h4>
                    <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-2">${escapeHtml(step.desc)}</p>
                </div>
                <div class="pt-3 border-t border-slate-100 dark:border-white/5">
                    <button onclick="showSection('biblia')" class="text-xs font-bold text-amber-600 hover:underline flex items-center gap-1.5">
                        <i class="fa-solid fa-book-open"></i>
                        <span>Leer Cita Bíblica</span>
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Formación cristiana
    const fcGrid = document.getElementById('formationCardsGrid');
    if (fcGrid && appData.bibleSchool.christianFormation) {
        fcGrid.innerHTML = appData.bibleSchool.christianFormation.map(fc => `
            <div class="bg-white dark:bg-[#0b152d] border border-slate-200 dark:border-[#1d2d54] rounded-2xl p-6 shadow-sm space-y-3 flex flex-col justify-between">
                <div>
                    <div class="w-12 h-12 bg-blue-500/10 text-blue-600 rounded-xl flex items-center justify-center text-xl mb-3 border border-blue-500/20">
                        <i class="fa-solid ${fc.icon || 'fa-graduation-cap'}"></i>
                    </div>
                    <span class="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">${escapeHtml(fc.citation || '2 Timoteo')}</span>
                    <h4 class="text-lg font-bold text-slate-900 dark:text-white mt-0.5">${escapeHtml(fc.title)}</h4>
                    <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-2">${escapeHtml(fc.desc)}</p>
                </div>
                <div class="pt-3 border-t border-slate-100 dark:border-white/5">
                    <button onclick="showSection('biblia')" class="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1.5">
                        <i class="fa-solid fa-book-open"></i>
                        <span>Ver Pasaje Bíblico</span>
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Doctrinas bíblicas
    const docGrid = document.getElementById('doctrinesCardsGrid');
    if (docGrid && appData.doctrines) {
        docGrid.innerHTML = appData.doctrines.map(doc => `
            <div class="bg-white dark:bg-[#0b152d] border border-slate-200 dark:border-[#1d2d54] rounded-2xl p-5 shadow-sm space-y-2">
                <div class="text-purple-600 text-2xl mb-2"><i class="fa-solid ${doc.icon || 'fa-shield-halved'}"></i></div>
                <h4 class="text-sm font-bold text-slate-900 dark:text-white">${escapeHtml(doc.title)}</h4>
                <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">${escapeHtml(doc.desc)}</p>
            </div>
        `).join('');
    }
}

function renderRadioVision() {
    // Recent tracks
    const recGrid = document.getElementById('rvRecentTracksList');
    if (recGrid && appData.recentTracks) {
        recGrid.innerHTML = appData.recentTracks.map(t => `
            <div class="p-2.5 rounded-xl bg-slate-50 dark:bg-[#070e24] border border-slate-100 dark:border-white/5 flex items-center justify-between text-xs">
                <div>
                    <h5 class="font-bold text-slate-900 dark:text-white">${escapeHtml(t.title)}</h5>
                    <p class="text-[11px] text-slate-500 dark:text-slate-400">${escapeHtml(t.artist)}</p>
                </div>
                <span class="text-[10px] text-amber-700 font-mono">${escapeHtml(t.time || '')}</span>
            </div>
        `).join('');
    }

    // Programming grid
    const progGrid = document.getElementById('rvProgrammingGrid');
    if (progGrid && appData.programming) {
        const currentLang = (typeof getAppLanguage === 'function') ? getAppLanguage() : 'es';
        progGrid.innerHTML = appData.programming.map(p => {
            let pDays = (currentLang === 'qu' && p.days_qu) ? p.days_qu : p.days;
            let pTitle = (currentLang === 'qu' && p.title_qu) ? p.title_qu : p.title;
            let pDesc = (currentLang === 'qu' && p.desc_qu) ? p.desc_qu : p.desc;
            let pHost = (currentLang === 'qu' && p.host_qu) ? p.host_qu : (p.host || (currentLang === 'qu' ? 'RTV Rimachiq' : 'Locutor RTV'));

            if (currentLang === 'qu') {
                if (!p.days_qu) {
                    if (p.days === 'Lunes a Viernes') pDays = 'Lunesmanta Vierneskama';
                    else if (p.days === 'Lunes a Sábado') pDays = 'Lunesmanta Sabadokama';
                    else if (p.days === 'Sábados y Domingos') pDays = 'Sabadokunata Domingokunatapas';
                    else if (p.days === 'Domingos') pDays = 'Domingokuna';
                }
                if (!p.title_qu) {
                    if (p.title === 'Devocionales y Oración en Vivo') pTitle = 'Devocional & Kawsay Mañakuy';
                    else if (p.title === 'Alabanza y Adoración Continua') pTitle = 'Tukuy Tiempo Alabanza & Yupaychay';
                }
                if (!p.desc_qu) {
                    if (p.desc && p.desc.includes('Devocionales diarios')) {
                        pDesc = "Sapa punchaw devocional, kawsaypi mañakuy hinaspa Ch'uya Qillqakunapi yuyaymanaykuna.";
                    } else if (p.desc && p.desc.includes('Selección musical')) {
                        pDesc = "Iñiqkunapa takinkuna, ñawpaq takikuna hawkayay instrumentalkunapas.";
                    }
                }
            }

            const btnListenText = (currentLang === 'qu') ? 'Uyariy' : 'Escuchar';

            return `
            <div class="bg-white dark:bg-[#0b152d] border border-slate-200 dark:border-[#1d2d54] rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
                <div>
                    <div class="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400 font-bold mb-1">
                        <span><i class="fa-solid fa-clock mr-1"></i>${escapeHtml(p.time)}</span>
                        <span class="text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded-full">${escapeHtml(pDays)}</span>
                    </div>
                    <h4 class="text-base font-bold text-slate-900 dark:text-white">${escapeHtml(pTitle)}</h4>
                    <p class="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">${escapeHtml(pDesc)}</p>
                </div>
                <div class="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs text-slate-500">
                    <span><i class="fa-solid fa-user-tie text-amber-500 mr-1.5"></i>${escapeHtml(pHost)}</span>
                    <button onclick="toggleLivePlay()" class="text-emerald-600 hover:underline font-bold">${btnListenText}</button>
                </div>
            </div>
        `;
        }).join('');
    }

    // Announcers grid
    const annGrid = document.getElementById('rvAnnouncersGrid');
    if (annGrid && appData.announcers) {
        const isQu = (typeof currentLang !== 'undefined' && currentLang === 'qu');
        annGrid.innerHTML = appData.announcers.map(a => {
            const showName = (isQu && a.show_qu) ? a.show_qu : (
                isQu && a.show === 'La Voz Misionera' ? 'Misionera Rimay' :
                isQu && a.show === 'Alabanza y Adoración Continua' ? 'Tukuy Tiempo Alabanza & Yupaychay' : a.show
            );
            const timeText = (isQu && a.time_qu) ? a.time_qu : (
                isQu && a.time && a.time.includes('Domingos') ? a.time.replace('Domingos', 'Domingokuna').replace(' y ', ' & ') :
                isQu && a.time && a.time.includes('Lunes a Sábado') ? a.time.replace('Lunes a Sábado', 'Lunesmanta Sabadokama') : (a.time || '')
            );
            return `
            <div class="bg-slate-50 dark:bg-[#070e24] border border-slate-200 dark:border-[#182648] rounded-2xl p-5 text-center space-y-3">
                <img src="${a.photo || 'img/logo-radio.jpg'}" alt="${escapeHtml(a.name)}" loading="lazy" decoding="async" class="w-20 h-20 rounded-full mx-auto object-cover border-2 border-emerald-400 shadow-sm" onerror="if(window.EMBEDDED_RADIO_LOGO) this.src=window.EMBEDDED_RADIO_LOGO;">
                <div>
                    <h4 class="text-sm font-bold text-slate-900 dark:text-white">${escapeHtml(a.name)}</h4>
                    <span class="text-[11px] font-semibold text-emerald-600 block mt-0.5">${escapeHtml(showName)}</span>
                    <span class="text-[10px] text-slate-500 dark:text-slate-400 block mt-1"><i class="fa-solid fa-clock mr-1"></i>${escapeHtml(timeText)}</span>
                </div>
            </div>
        `;
        }).join('');
    }
}

let currentGalleryFilter = 'all';

        // ==============================================================
        // CULTO EN VIVO: RENDERIZADOR Y PLATAFORMAS (YOUTUBE Y FACEBOOK)
        // ==============================================================
        let currentLivePlatform = 'facebook';

        function switchLivePlatform(platform) {
            currentLivePlatform = platform;
            const btnFb = document.getElementById('btn-live-fb');
            const btnYt = document.getElementById('btn-live-yt');

            if (platform === 'facebook') {
                btnFb.className = "px-5 py-2.5 rounded-xl text-xs font-bold transition-all bg-blue-600 text-white shadow-lg shadow-blue-600/25 flex items-center space-x-2";
                btnYt.className = "px-5 py-2.5 rounded-xl text-xs font-bold transition-all bg-[#121638] text-slate-300 hover:text-white border border-[#252857] flex items-center space-x-2";
            } else {
                btnYt.className = "px-5 py-2.5 rounded-xl text-xs font-bold transition-all bg-red-600 text-white shadow-lg shadow-red-600/25 flex items-center space-x-2";
                btnFb.className = "px-5 py-2.5 rounded-xl text-xs font-bold transition-all bg-[#121638] text-slate-300 hover:text-white border border-[#252857] flex items-center space-x-2";
            }
            renderLivePlayer();
        }

        function extractYouTubeId(url) {
            if (!url) return '';
            url = String(url).trim();
            // Si el usuario ingresó directamente el ID de 11 caracteres
            if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
            // Manejar formatos comunes: youtu.be, watch?v=, live/, embed/, shorts/
            const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|live\/|shorts\/))([a-zA-Z0-9_-]{11})/;
            const match = url.match(regExp);
            if (match && match[1]) return match[1];
            try {
                const parsed = new URL(url.startsWith('http') ? url : 'https://' + url);
                if (parsed.searchParams.has('v')) {
                    const v = parsed.searchParams.get('v');
                    if (v && v.length === 11) return v;
                }
                const parts = parsed.pathname.split('/').filter(Boolean);
                if (parts.length > 0) {
                    const last = parts[parts.length - 1];
                    if (last && last.length === 11) return last;
                }
            } catch (e) {}
            return url;
        }

        function renderLiveService() {
            const live = appData.liveService || {};
            const currentLang = (typeof getAppLanguage === 'function') ? getAppLanguage() : 'es';
            const liveTitle = document.getElementById('liveServiceTitle');
            if (liveTitle) {
                let title = (currentLang === 'qu' && live.title_qu) ? live.title_qu : live.title;
                if (currentLang === 'qu' && (!live.title_qu || title === "Culto de Avivamiento, Alabanza y Sana Doctrina")) {
                    title = "Kawsarichiy, Yupaychay Chuya Yachachikuy Huñunakuy";
                }
                liveTitle.innerText = title || (currentLang === 'qu' ? "Kawsarichiy, Yupaychay Chuya Yachachikuy Huñunakuy" : "Culto de Avivamiento y Sana Doctrina");
            }
            const liveSchedule = document.getElementById('liveServiceSchedule');
            if (liveSchedule) {
                let sched = (currentLang === 'qu' && live.schedule_qu) ? live.schedule_qu : live.schedule;
                if (currentLang === 'qu' && (!live.schedule_qu || sched.includes('Miércoles'))) {
                    sched = "Huñunakuykuna: Miercoles 07:00 PM • Domingokuna 10:00 AM & 06:00 PM";
                }
                liveSchedule.innerText = sched || (currentLang === 'qu' ? "Huñunakuykuna: Miercoles 07:00 PM • Domingokuna 10:00 AM & 06:00 PM" : "Cultos: Miércoles 07:00 PM • Domingos 10:00 AM y 06:00 PM");
            }
            renderLivePlayer();
        }

        function renderLivePlayer() {
            const live = appData.liveService || {};
            const container = document.getElementById('liveVideoContainer');
            if (!container) return;

            if (currentLivePlatform === 'youtube') {
                const ytUrl = live.youtubeUrl || '';
                const videoId = extractYouTubeId(ytUrl);

                if (videoId && videoId.length === 11) {
                    container.innerHTML = `
                        <iframe class="w-full h-full" src="https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&rel=0" title="Culto en Vivo YouTube" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
                    `;
                } else {
                    container.innerHTML = `
                        <div class="text-center p-8 space-y-4 max-w-md mx-auto">
                            <div class="w-16 h-16 rounded-2xl bg-red-600/20 text-red-500 border border-red-500/30 flex items-center justify-center text-3xl mx-auto shadow-lg">
                                <i class="fa-brands fa-youtube animate-pulse"></i>
                            </div>
                            <h4 class="text-xl font-bold text-white">Transmisión en YouTube</h4>
                            <p class="text-slate-300 text-xs">Conéctate a nuestro canal oficial para seguir la señal en directo de cada servicio.</p>
                            <a href="${live.youtubeUrl || 'https://www.youtube.com/@radiovisionrtv2020'}" target="_blank" class="inline-flex items-center space-x-2 bg-red-600 hover:bg-red-500 text-white font-bold px-6 py-3 rounded-xl text-xs transition-all shadow-lg shadow-red-600/30">
                                <i class="fa-brands fa-youtube text-base"></i>
                                <span>Abrir Transmisión en YouTube Live</span>
                            </a>
                        </div>
                    `;
                }
            } else {
                // Facebook Live
                const fbUrl = live.facebookUrl || 'https://www.facebook.com/radiovisionrtv';
                container.innerHTML = `
                    <div class="text-center p-8 space-y-4 max-w-md mx-auto">
                        <div class="w-16 h-16 rounded-2xl bg-blue-600/20 text-blue-500 border border-blue-500/30 flex items-center justify-center text-3xl mx-auto shadow-lg">
                            <i class="fa-brands fa-facebook animate-pulse"></i>
                        </div>
                        <h4 class="text-xl font-bold text-white">Transmisión en Facebook Live</h4>
                        <p class="text-slate-300 text-xs">Sigue nuestra señal en vivo oficial a través de la página de Facebook de RADIOVISIÓN RTV.</p>
                        <div class="pt-2">
                            <a href="${fbUrl}" target="_blank" class="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl text-xs transition-all shadow-lg shadow-blue-600/30">
                                <i class="fa-brands fa-facebook text-base"></i>
                                <span>Ver Culto en Vivo en Facebook</span>
                            </a>
                        </div>
                    </div>
                `;
            }
        }

        // ==============================================================
        // EXPORTACIONES GLOBALES DE EVENTOS, PASTORAL Y TRANSMISIÓN
        // ==============================================================
        if (typeof filterPastors === 'function') window.filterPastors = filterPastors;
        if (typeof filterEvents === 'function') window.filterEvents = filterEvents;
        if (typeof switchBibleSchoolTab === 'function') window.switchBibleSchoolTab = switchBibleSchoolTab;
        if (typeof switchLivePlatform === 'function') window.switchLivePlatform = switchLivePlatform;
        if (typeof renderPastors === 'function') window.renderPastors = renderPastors;
        if (typeof renderEvents === 'function') window.renderEvents = renderEvents;
        if (typeof renderCultoCentral === 'function') window.renderCultoCentral = renderCultoCentral;
        if (typeof renderSedes === 'function') window.renderSedes = renderSedes;
        if (typeof renderMissionary === 'function') window.renderMissionary = renderMissionary;
        if (typeof renderMinistries === 'function') window.renderMinistries = renderMinistries;
        if (typeof renderBibleSchool === 'function') window.renderBibleSchool = renderBibleSchool;
        if (typeof renderLiveService === 'function') window.renderLiveService = renderLiveService;

        // EXPORTACIONES GLOBALES RESUELTAS
        if (typeof renderLivePlayer !== 'undefined') window.renderLivePlayer = renderLivePlayer;
        if (typeof renderNosotros !== 'undefined') window.renderNosotros = renderNosotros;
        if (typeof renderRadioVision !== 'undefined') window.renderRadioVision = renderRadioVision;
        if (typeof parseScheduleToServices !== 'undefined') window.parseScheduleToServices = parseScheduleToServices;
        if (typeof getLiveStatusInfo !== 'undefined') window.getLiveStatusInfo = getLiveStatusInfo;
        if (typeof extractYouTubeId !== 'undefined') window.extractYouTubeId = extractYouTubeId;


// ==============================================================
// MÓDULO RADIO: TRANSMISIÓN EN VIVO, REPRODUCTOR Y PODCASTS
// ==============================================================

        // ==============================================================
        // GESTIÓN DE AUDIO: LIBERACIÓN DE RECURSOS DE SPEECH SYNTHESIS
        // ==============================================================
        function stopAllSpeech() {
            try {
                if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis) {
                    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
                        window.speechSynthesis.cancel();
                    }
                }
            } catch (err) {}
        }

        function renderPodcastsSkeleton() {
            const list = document.getElementById('fullLibraryGrid') || document.getElementById('adminPodcastsList');
            if (!list) return;
            list.innerHTML = `
                <div class="p-4 bg-slate-800/60 rounded-2xl border border-slate-700/50 animate-pulse flex items-center gap-3">
                    <div class="w-14 h-14 bg-slate-700/60 rounded-xl shrink-0"></div>
                    <div class="flex-1 space-y-2">
                        <div class="w-1/2 h-4 bg-slate-700/70 rounded"></div>
                        <div class="w-3/4 h-3 bg-slate-700/40 rounded"></div>
                    </div>
                </div>
                <div class="p-4 bg-slate-800/60 rounded-2xl border border-slate-700/50 animate-pulse flex items-center gap-3 mt-3">
                    <div class="w-14 h-14 bg-slate-700/60 rounded-xl shrink-0"></div>
                    <div class="flex-1 space-y-2">
                        <div class="w-1/2 h-4 bg-slate-700/70 rounded"></div>
                        <div class="w-3/4 h-3 bg-slate-700/40 rounded"></div>
                    </div>
                </div>
            `;
        }
        window.renderPodcastsSkeleton = renderPodcastsSkeleton;

        function renderPodcasts() {
            renderLibrary();
        }

        function filterPodcasts(cat, btnEl) {
            filterLibrary(cat);
        }
        window.renderPodcasts = renderPodcasts;
        window.filterPodcasts = filterPodcasts;


        let isLivePlaying = false;

        function updateAudioStreamStatus(status) {
            const badge = document.getElementById('audioStreamStatus');
            const notice = document.getElementById('audioReconnectNotice');
            const headerEq = document.getElementById('headerAudioEqualizer');

            if (status === 'playing') {
                if (badge) {
                    badge.className = "inline-flex items-center space-x-1 text-[10px] text-emerald-600 font-semibold";
                    badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span><span>Señal en Línea</span>`;
                }
                if (notice) notice.classList.add('hidden');
                if (headerEq) {
                    headerEq.classList.remove('hidden');
                    headerEq.classList.add('flex');
                }
            } else if (status === 'connecting' || status === 'waiting') {
                if (badge) {
                    badge.className = "inline-flex items-center space-x-1 text-[10px] text-yellow-600 font-semibold";
                    badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-ping"></span><span>Conectando señal...</span>`;
                }
                if (notice) notice.classList.add('hidden');
                if (headerEq) {
                    headerEq.classList.add('hidden');
                    headerEq.classList.remove('flex');
                }
            } else if (status === 'error' || status === 'stalled') {
                if (badge) {
                    badge.className = "inline-flex items-center space-x-1 text-[10px] text-red-600 font-semibold";
                    badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-red-500"></span><span>Señal interrumpida</span>`;
                }
                if (notice) notice.classList.remove('hidden');
                if (headerEq) {
                    headerEq.classList.add('hidden');
                    headerEq.classList.remove('flex');
                }
            } else {
                if (badge) {
                    badge.className = "inline-flex items-center space-x-1 text-[10px] text-slate-500 font-semibold";
                    badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span><span>En pausa</span>`;
                }
                if (headerEq) {
                    headerEq.classList.add('hidden');
                    headerEq.classList.remove('flex');
                }
            }
        }

        // ==============================================================
        // MOTOR DE REPRODUCCIÓN MULTI-RADIO: 2 EMISORAS CONCURRENTES EXCLUSIVAS
        // Radio 1: "radiovisionrtv" (Principal / Castellano)
        // Radio 2: "radiovisionrtv-quechua" (Misionera / Runasimi Quechua)
        // ==============================================================

        const RADIO_STATIONS = {
            'radiovisionrtv': {
                id: 'radiovisionrtv',
                name: 'RadioVisión RTV',
                tag: 'Señal Principal (Castellano)',
                audioId: 'audioPlayer_radiovisionrtv',
                statusId: 'status_radiovisionrtv',
                playBtnId: 'playBtn_radiovisionrtv',
                playIconId: 'playIcon_radiovisionrtv',
                playTextId: 'playText_radiovisionrtv',
                cardId: 'radioCard_radiovisionrtv',
                eqId: 'eq_radiovisionrtv',
                getStreamUrl: () => {
                    const raw = (appData.general && appData.general.streamUrl) ? appData.general.streamUrl : '';
                    return (typeof getValidatedStreamUrl === 'function') ? getValidatedStreamUrl(raw, 'primary') : (raw || "https://stream10.usastreams.com/8014/stream");
                }
            },
            'radiovisionrtv-quechua': {
                id: 'radiovisionrtv-quechua',
                name: 'RadioVisión RTV Quechua',
                tag: 'Señal Misionera Quechua (Runasimi)',
                audioId: 'audioPlayer_radiovisionrtv_quechua',
                statusId: 'status_radiovisionrtv_quechua',
                playBtnId: 'playBtn_radiovisionrtv_quechua',
                playIconId: 'playIcon_radiovisionrtv_quechua',
                playTextId: 'playText_radiovisionrtv_quechua',
                cardId: 'radioCard_radiovisionrtv_quechua',
                eqId: 'eq_radiovisionrtv_quechua',
                getStreamUrl: () => {
                    const raw = (appData.general && (appData.general.streamUrlQuechua || appData.general.streamUrl)) ? (appData.general.streamUrlQuechua || appData.general.streamUrl) : '';
                    return (typeof getValidatedStreamUrl === 'function') ? getValidatedStreamUrl(raw, 'quechua') : (raw || "https://stream10.usastreams.com/8014/stream");
                }
            }
        };

        let currentActiveRadio = null; // 'radiovisionrtv' | 'radiovisionrtv-quechua' | null

        function updateStationUI(stationId, status) {
            const conf = RADIO_STATIONS[stationId];
            if (!conf) return;

            const statusEl = document.getElementById(conf.statusId);
            const playIcon = document.getElementById(conf.playIconId);
            const playText = document.getElementById(conf.playTextId);
            const eqEl = document.getElementById(conf.eqId);
            const cardEl = document.getElementById(conf.cardId);

            if (status === 'playing') {
                if (statusEl) {
                    statusEl.className = "inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-400";
                    statusEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span><span>En Vivo Ahora</span>`;
                }
                if (playIcon) playIcon.className = "fa-solid fa-pause text-base";
                if (playText) playText.innerText = `Pausar ${conf.name}`;
                if (eqEl) {
                    eqEl.classList.remove('hidden');
                    eqEl.classList.add('flex');
                }
                if (cardEl) {
                    cardEl.classList.add('border-amber-400', 'shadow-2xl');
                }
            } else if (status === 'connecting' || status === 'waiting') {
                if (statusEl) {
                    statusEl.className = "inline-flex items-center gap-1.5 text-[11px] font-bold text-yellow-400";
                    statusEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-yellow-400 animate-ping"></span><span>Conectando señal...</span>`;
                }
                if (playIcon) playIcon.className = "fa-solid fa-spinner fa-spin text-base";
                if (playText) playText.innerText = `Conectando ${conf.name}...`;
                if (eqEl) {
                    eqEl.classList.add('hidden');
                    eqEl.classList.remove('flex');
                }
            } else if (status === 'error') {
                if (statusEl) {
                    statusEl.className = "inline-flex items-center gap-1.5 text-[11px] font-bold text-rose-400";
                    statusEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-rose-400"></span><span>Señal interrumpida</span>`;
                }
                if (playIcon) playIcon.className = "fa-solid fa-rotate text-base";
                if (playText) playText.innerText = `Reconectar ${conf.name}`;
                if (eqEl) {
                    eqEl.classList.add('hidden');
                    eqEl.classList.remove('flex');
                }
            } else {
                // Pausado
                if (statusEl) {
                    statusEl.className = "inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-300";
                    statusEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-slate-400"></span><span>En pausa</span>`;
                }
                if (playIcon) playIcon.className = "fa-solid fa-play text-base";
                if (playText) playText.innerText = `Escuchar ${conf.name}`;
                if (eqEl) {
                    eqEl.classList.add('hidden');
                    eqEl.classList.remove('flex');
                }
                if (cardEl) {
                    cardEl.classList.remove('border-amber-400', 'shadow-2xl');
                }
            }
        }

        function playRadioStation(stationId) {
            const target = RADIO_STATIONS[stationId];
            if (!target) return;

            // 1. REGLA ESTRICTA DE CONCURRENCIA: Al reproducir una emisora, la otra DEBE pausarse automáticamente
            const otherStationId = (stationId === 'radiovisionrtv') ? 'radiovisionrtv-quechua' : 'radiovisionrtv';
            pauseRadioStation(otherStationId, false);

            // Detener cualquier narración bíblica o podcast
            if (typeof stopAllSpeech === 'function') stopAllSpeech();

            const audioElem = document.getElementById(target.audioId);
            if (!audioElem) return;

            const streamUrl = target.getStreamUrl();
            if (!audioElem.src || audioElem.src !== streamUrl) {
                audioElem.src = streamUrl;
            }

            currentActiveRadio = stationId;
            isLivePlaying = true;
            updateStationUI(stationId, 'connecting');

            const p = audioElem.play();
            if (p !== undefined) {
                p.then(() => {
                    updateStationUI(stationId, 'playing');
                    syncGlobalAudioWithStation(stationId, 'playing');
                    showToast(`Sintonizando ${target.name} (${target.tag}) 🎵`);
                }).catch(err => {
                    console.warn("Reproducción en segundo plano o interacción pendiente:", err);
                    updateStationUI(stationId, 'error');
                });
            } else {
                updateStationUI(stationId, 'playing');
                syncGlobalAudioWithStation(stationId, 'playing');
            }
        }

        function pauseRadioStation(stationId, updateGlobals = true) {
            const target = RADIO_STATIONS[stationId];
            if (!target) return;

            const audioElem = document.getElementById(target.audioId);
            if (audioElem) {
                try { audioElem.pause(); } catch(e) {}
            }
            updateStationUI(stationId, 'paused');

            if (currentActiveRadio === stationId) {
                currentActiveRadio = null;
                isLivePlaying = false;
                if (updateGlobals) {
                    syncGlobalAudioWithStation(stationId, 'paused');
                }
            }
        }

        function toggleRadioStation(stationId) {
            const target = RADIO_STATIONS[stationId];
            if (!target) return;
            const audioElem = document.getElementById(target.audioId);

            if (currentActiveRadio === stationId && audioElem && !audioElem.paused) {
                pauseRadioStation(stationId, true);
                showToast(`${target.name} pausada.`, "info");
            } else {
                playRadioStation(stationId);
            }
        }

        function reconnectRadioStation(stationId) {
            const target = RADIO_STATIONS[stationId];
            if (!target) return;
            showToast(`Reconectando señal de ${target.name}... 🔄`, "info");
            const audioElem = document.getElementById(target.audioId);
            if (audioElem) {
                audioElem.src = target.getStreamUrl();
                audioElem.load();
                playRadioStation(stationId);
            }
        }

        function syncGlobalAudioWithStation(stationId, state) {
            const audioBar = document.getElementById('audioBar');
            const mainPlayText = document.getElementById('mainPlayText');
            const mainPlayIcon = document.getElementById('mainPlayIcon');
            const heroPlayText = document.getElementById('heroPlayText');
            const heroPlayIcon = document.getElementById('heroPlayIcon');
            const audioBarIcon = document.getElementById('audioBarIcon');

            if (state === 'playing') {
                const target = RADIO_STATIONS[stationId];
                if (audioBar) {
                    audioBar.classList.remove('hidden');
                    const barTitle = document.getElementById('audioBarTitle');
                    const barSub = document.getElementById('audioBarSubtitle');
                    if (barTitle) barTitle.innerText = target ? target.name : "RadioVisión RTV";
                    if (barSub) barSub.innerText = target ? target.tag : "En Vivo 24/7";
                }
                if (mainPlayText) mainPlayText.innerText = "Pausar";
                if (mainPlayIcon) mainPlayIcon.className = "fa-solid fa-pause text-xs";
                if (heroPlayText) heroPlayText.innerText = "Pausar Transmisión";
                if (heroPlayIcon) heroPlayIcon.className = "fa-solid fa-pause text-lg";
                if (audioBarIcon) audioBarIcon.className = "fa-solid fa-pause";
                updateAudioStreamStatus('playing');
            } else {
                if (mainPlayText) mainPlayText.innerText = "Radio en Vivo";
                if (mainPlayIcon) mainPlayIcon.className = "fa-solid fa-play text-xs";
                if (heroPlayText) heroPlayText.innerText = "Escuchar Señal en Vivo";
                if (heroPlayIcon) heroPlayIcon.className = "fa-solid fa-play text-lg";
                if (audioBarIcon) audioBarIcon.className = "fa-solid fa-play";
                if ('mediaSession' in navigator) { try { navigator.mediaSession.playbackState = 'paused'; } catch(e) {} }
                updateAudioStreamStatus('paused');
            }
        }

        function toggleLivePlay() {
            if (isLivePlaying && currentActiveRadio) {
                pauseRadioStation(currentActiveRadio, true);
                showToast("Transmisión de radio pausada.", "info");
            } else {
                playRadioStation(currentActiveRadio || 'radiovisionrtv');
            }
        }

        function reconnectLiveAudio() {
            if (currentActiveRadio) {
                reconnectRadioStation(currentActiveRadio);
            } else {
                reconnectRadioStation('radiovisionrtv');
            }
        }

        function initRadioAudioListeners() {
            ['radiovisionrtv', 'radiovisionrtv-quechua'].forEach(stId => {
                const conf = RADIO_STATIONS[stId];
                const el = document.getElementById(conf.audioId);
                if (!el) return;

                // Si el usuario usa los controles nativos HTML5 para iniciar reproducción
                el.addEventListener('play', () => {
                    const otherId = (stId === 'radiovisionrtv') ? 'radiovisionrtv-quechua' : 'radiovisionrtv';
                    pauseRadioStation(otherId, false);
                    currentActiveRadio = stId;
                    isLivePlaying = true;
                    updateStationUI(stId, 'playing');
                    syncGlobalAudioWithStation(stId, 'playing');
                });

                el.addEventListener('pause', () => {
                    if (currentActiveRadio === stId) {
                        updateStationUI(stId, 'paused');
                        syncGlobalAudioWithStation(stId, 'paused');
                    }
                });

                el.addEventListener('waiting', () => updateStationUI(stId, 'connecting'));
                el.addEventListener('playing', () => updateStationUI(stId, 'playing'));
                el.addEventListener('error', () => updateStationUI(stId, 'error'));
            });
        }

        if (typeof window !== 'undefined') {
            window.addEventListener('load', () => {
                try {
                    initRadioAudioListeners();
                } catch(e) {}
            });
        }

        function toggleAudioBarPlay() {
            const podAudio = document.getElementById('liveRadioAudioElem');
            const audioBarIcon = document.getElementById('audioBarIcon');

            // 1. Si hay un audio de biblioteca/podcast cargado en la barra inferior
            if (podAudio) {
                if (podAudio.paused) {
                    podAudio.play().then(() => {
                        isLivePlaying = true;
                        if (audioBarIcon) audioBarIcon.className = "fa-solid fa-pause";
                        updateAudioStreamStatus('playing');
                    }).catch(() => {});
                } else {
                    podAudio.pause();
                    isLivePlaying = false;
                    if (audioBarIcon) audioBarIcon.className = "fa-solid fa-play";
                    if ('mediaSession' in navigator) { try { navigator.mediaSession.playbackState = 'paused'; } catch(e) {} }
                updateAudioStreamStatus('paused');
                }
                return;
            }

            // 2. Si se está reproduciendo o pausó una emisora de radio en vivo
            const targetStation = currentActiveRadio || 'radiovisionrtv';
            toggleRadioStation(targetStation);
        }

        function closeAudioBar() {
            if (window._radioAnalyticsHeartbeat) clearInterval(window._radioAnalyticsHeartbeat);
            isLivePlaying = false;

            // Pausar emisoras de radio activas
            ['radiovisionrtv', 'radiovisionrtv-quechua'].forEach(stId => {
                pauseRadioStation(stId, false);
            });
            currentActiveRadio = null;

            // Detener y limpiar reproductor de podcast si existe y liberar memoria RAM (Blob URL)
            const container = document.getElementById('audioBarMediaContainer');
            if (container) {
                const podAudio = container.querySelector('audio');
                if (podAudio) {
                    try { podAudio.pause(); podAudio.src = ''; } catch (e) {}
                }
                container.innerHTML = '';
            }
            if (typeof revokeActiveMediaBlobUrl === 'function') {
                revokeActiveMediaBlobUrl();
            }

            const bar = document.getElementById('audioBar');
            if (bar) bar.classList.add('hidden');
            const mainPlayText = document.getElementById('mainPlayText');
            if (mainPlayText) mainPlayText.innerText = "Radio en Vivo";
            const mainPlayIcon = document.getElementById('mainPlayIcon');
            if (mainPlayIcon) mainPlayIcon.className = "fa-solid fa-play text-xs";
            const heroPlayText = document.getElementById('heroPlayText');
            if (heroPlayText) heroPlayText.innerText = "Escuchar Señal en Vivo";
            const heroPlayIcon = document.getElementById('heroPlayIcon');
            if (heroPlayIcon) heroPlayIcon.className = "fa-solid fa-play text-lg";
            if ('mediaSession' in navigator) { try { navigator.mediaSession.playbackState = 'paused'; } catch(e) {} }
                updateAudioStreamStatus('paused');
            stopAllSpeech();
        }

        async function playPodcastMedia(id) {
            const p = (appData.podcasts || []).find(x => x.id === id);
            if (!p) return;
            if (typeof trackAppEvent === 'function') trackAppEvent('Podcast', 'Play', p.title || 'Prédica');
            if (typeof window.updateSermonSEO === 'function') window.updateSermonSEO(p);
            
            let playUrl = p.audioUrl || '';
            if (typeof resolveActiveMediaBlobUrl === 'function' && (playUrl.startsWith('idb://') || (window.availableMediaBlobIds && window.availableMediaBlobIds.has(p.id)) || (window.uploadedMediaCache && window.uploadedMediaCache.has(p.id)))) {
                const resolved = await resolveActiveMediaBlobUrl(p.id, playUrl);
                if (resolved) playUrl = resolved;
            }

            const isVid = p.mediaType === 'video' || isPodcastVideo(playUrl, p.mediaType);
            if (isVid) {
                playPodcastVideo(p.title, playUrl, p.category, p.desc);
            } else {
                playPodcastAudio(p.title, playUrl);
            }
        }

        function playPodcastVideo(title, videoUrl, category, desc) {
            stopAllSpeech();
            isLivePlaying = false;
            if ('mediaSession' in navigator) { try { navigator.mediaSession.playbackState = 'paused'; } catch(e) {} }
                updateAudioStreamStatus('paused');

            const modal = document.getElementById('podcastVideoModal');
            if (!modal) return;
            
            document.getElementById('videoModalTitle').innerText = title || 'Reproductor de Video';
            const catBadge = document.getElementById('videoModalCategory');
            if (catBadge) catBadge.innerHTML = `<i class="fa-solid fa-video mr-1"></i> ${category || 'Video'}`;
            const descEl = document.getElementById('videoModalDesc');
            if (descEl) descEl.innerText = desc || 'Video reproducido desde RADIOVISIÓN RTV';

            const container = document.getElementById('videoModalContainer');

            // Asegurar que siempre exista una URL válida para que el video siempre reproduzca de inmediato
            let effectiveUrl = (videoUrl || '').trim();
            if (!effectiveUrl) {
                const searchQ = encodeURIComponent((title || 'Predica Cristiana') + ' ' + (desc || 'Pastor Richard Edgardo Dávila Becerra'));
                effectiveUrl = `https://www.youtube.com/embed?listType=search&list=${searchQ}&autoplay=1`;
            }

            currentActiveVideoUrl = effectiveUrl;
            currentActiveVideoTitle = title || 'Video';

            const ytId = getYouTubeId(effectiveUrl);
            
            if (ytId) {
                const embedUrl = `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&playsinline=1`;
                container.innerHTML = `
                    <div class="relative w-full h-full flex flex-col justify-between">
                        <iframe src="${embedUrl}" class="w-full flex-1 min-h-[340px] sm:min-h-[420px] rounded-2xl border-0 shadow-2xl" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
                        <div class="mt-2 py-1.5 px-3 bg-slate-900/90 rounded-xl flex items-center justify-between text-xs text-slate-300 border border-slate-700">
                            <span class="flex items-center gap-1.5"><i class="fa-brands fa-youtube text-red-500"></i> Video de YouTube</span>
                            <a href="https://www.youtube.com/watch?v=${ytId}" target="_blank" rel="noopener noreferrer" class="text-yellow-400 hover:text-yellow-300 font-bold underline flex items-center gap-1">
                                Abrir en YouTube si no reproduce <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                            </a>
                        </div>
                    </div>
                `;
            } else if (effectiveUrl.includes('youtube.com') || effectiveUrl.includes('youtu.be')) {
                let embedUrl = effectiveUrl;
                if (!embedUrl.includes('autoplay=1')) {
                    embedUrl += (embedUrl.includes('?') ? '&' : '?') + 'autoplay=1&rel=0&playsinline=1';
                }
                container.innerHTML = `
                    <div class="relative w-full h-full flex flex-col justify-between">
                        <iframe src="${embedUrl}" class="w-full flex-1 min-h-[340px] sm:min-h-[420px] rounded-2xl border-0 shadow-2xl" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
                        <div class="mt-2 py-1.5 px-3 bg-slate-900/90 rounded-xl flex items-center justify-between text-xs text-slate-300 border border-slate-700">
                            <span class="flex items-center gap-1.5"><i class="fa-brands fa-youtube text-red-500"></i> Video Transmitido</span>
                            <a href="https://www.youtube.com/results?search_query=${encodeURIComponent(title || 'Radio Vision RTV')}" target="_blank" rel="noopener noreferrer" class="text-yellow-400 hover:text-yellow-300 font-bold underline flex items-center gap-1">
                                Ver en YouTube <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                            </a>
                        </div>
                    </div>
                `;
            } else {
                container.innerHTML = `
                    <video id="activePodcastVideo" controls autoplay playsinline class="w-full h-full max-h-[70vh] rounded-2xl bg-black object-contain shadow-2xl">
                        <source src="${effectiveUrl}">
                        Tu navegador no soporta reproducción de video directa.
                    </video>
                `;
                const v = document.getElementById('activePodcastVideo');
                if (v) {
                    v.play().catch(e => console.log('Video autoplay:', e));
                }
            }

            modal.classList.remove('hidden');
            modal.style.display = 'flex';
            modal.style.zIndex = '3000';
            modal.style.opacity = '1';
            modal.style.visibility = 'visible';
            modal.setAttribute('aria-hidden', 'false');
            showToast(`Reproduciendo video: "${title}" 🎬`);
        }

        function closePodcastVideoModal() {
            const modal = document.getElementById('podcastVideoModal');
            if (!modal) return;
            const container = document.getElementById('videoModalContainer');
            if (container) {
                const vid = container.querySelector('video');
                if (vid) {
                    try { vid.pause(); vid.src = ""; } catch (e) {}
                }
                const iframe = container.querySelector('iframe');
                if (iframe) {
                    try { iframe.src = ""; } catch (e) {}
                }
                container.innerHTML = '';
            }
            if (typeof revokeActiveMediaBlobUrl === 'function') {
                revokeActiveMediaBlobUrl();
            }
            modal.classList.add('hidden');
            modal.style.display = 'none';
            modal.style.visibility = 'hidden';
            modal.setAttribute('aria-hidden', 'true');
        }

        function playPodcastAudio(title, audioUrl) {
            stopAllSpeech();
            isLivePlaying = true;
            currentPlayingAudioUrl = audioUrl || '';
            currentPlayingAudioTitle = title || 'Audio';

            const bar = document.getElementById('audioBar');
            bar.classList.remove('hidden');
            document.getElementById('audioBarTitle').innerText = title || "Audio";
            document.getElementById('audioBarSubtitle').innerText = "Reproduciendo contenido";
            if ('mediaSession' in navigator) {
                try {
                    navigator.mediaSession.metadata = new MediaMetadata({
                        title: title || 'Prédica Cristiana',
                        artist: 'RadioVisión RTV - IMCOTNV',
                        album: 'Biblioteca de Audio y Sermones',
                        artwork: [
                            { src: 'img/icon-192.png', sizes: '192x192', type: 'image/png' },
                            { src: 'img/icon-512.png', sizes: '512x512', type: 'image/png' },
                            { src: 'img/logo-radio.jpg', sizes: '256x256', type: 'image/jpeg' }
                        ]
                    });
                    navigator.mediaSession.playbackState = 'playing';
                } catch(e) {}
            }
            
            const actualSrc = (typeof getValidatedStreamUrl === 'function') ? getValidatedStreamUrl(audioUrl, 'primary') : (audioUrl || "https://stream10.usastreams.com/8014/stream");
            document.getElementById('audioBarMediaContainer').innerHTML = `
                <audio id="liveRadioAudioElem" controls autoplay controlsList="nodownload" oncontextmenu="return false;" class="w-full h-8">
                    <source src="${actualSrc}" type="audio/mpeg">
                    Tu navegador no soporta audio
                </audio>
            `;
            document.getElementById('mainPlayText').innerText = "Pausar";
            document.getElementById('heroPlayText').innerText = "Pausar Transmisión";
            document.getElementById('audioBarIcon').className = "fa-solid fa-pause";
            updateAudioStreamStatus('connecting');

            const audioElem = document.getElementById('liveRadioAudioElem');
            if (audioElem) {
                audioElem.addEventListener('playing', () => updateAudioStreamStatus('playing'));
                audioElem.addEventListener('waiting', () => updateAudioStreamStatus('waiting'));
                audioElem.addEventListener('stalled', () => updateAudioStreamStatus('stalled'));
                audioElem.addEventListener('error', () => {
                    updateAudioStreamStatus('error');
                    showToast("Audio no disponible temporalmente", "error");
                });
            }
            showToast(`Reproduciendo: "${title}" 🎵`);
        }

        async function downloadPodcastMedia(idOrUrl, maybeTitle) {
            let url = idOrUrl;
            let title = maybeTitle || 'multimedia';
            const item = (appData.podcasts || []).find(x => x.id === idOrUrl);
            if (item) {
                url = item.audioUrl;
                title = item.title || title;
            }
            if (!url) {
                showToast("Este contenido no tiene un archivo disponible para descargar.", "error");
                return;
            }

            const ytId = getYouTubeId(url);
            if (ytId) {
                showToast("Abriendo video en YouTube para reproducción y descarga...", "info");
                window.open(`https://www.youtube.com/watch?v=${ytId}`, '_blank');
                return;
            }

            try {
                let downloadUrl = url;
                let tempBlobUrl = null;
                if (typeof getMediaBlobFromDB === 'function') {
                    const blob = await getMediaBlobFromDB(item ? item.id : idOrUrl);
                    if (blob instanceof Blob) {
                        tempBlobUrl = URL.createObjectURL(blob);
                        downloadUrl = tempBlobUrl;
                    }
                }
                const isVideo = url.startsWith('data:video/') || /\.(mp4|webm|mov|mkv)$/i.test(url) || (item && item.mediaType === 'video');
                const safeName = (title.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s_-]/g, '').trim() || 'archivo') + 
                    (isVideo ? '.mp4' : '.mp3');
                const a = document.createElement('a');
                a.href = downloadUrl;
                a.download = safeName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                if (tempBlobUrl) {
                    setTimeout(() => URL.revokeObjectURL(tempBlobUrl), 5000);
                }
                showToast(`Descargando "${title}" ⬇️`);
            } catch (e) {
                console.error("Error al descargar:", e);
                window.open(url, '_blank');
            }
        }

        function downloadActiveVideo() {
            if (!currentActiveVideoUrl) {
                showToast("No hay video activo para descargar.", "error");
                return;
            }
            downloadPodcastMedia(currentActiveVideoUrl, currentActiveVideoTitle);
        }

        function downloadCurrentAudio() {
            if (!currentPlayingAudioUrl) {
                showToast("No hay audio seleccionado para descargar.", "error");
                return;
            }
            downloadPodcastMedia(currentPlayingAudioUrl, currentPlayingAudioTitle);
        }
        // [Funciones de biblioteca y música consolidadas en sección multimedia]

        function playMediaUrl(mediaUrl, title) {
            if (isPodcastVideo(mediaUrl)) {
                playPodcastVideo(title, mediaUrl, 'Video', '');
            } else {
                playPodcastAudio(title, mediaUrl);
            }
        }

        // ==============================================================

        // ==============================================================
        // FUNCIONES COMPLEMENTARIAS: PODCASTS, MULTIMEDIA Y TESTIMONIOS
        // ==============================================================
        function editPodcast(id) {
            if (typeof openPodcastModal === 'function') {
                openPodcastModal(id);
            }
        }
        window.editPodcast = editPodcast;

        function playMediaPodcast(id) {
            if (typeof playPodcastMedia === 'function') {
                playPodcastMedia(id);
            }
        }
        window.playMediaPodcast = playMediaPodcast;

        let _lastAudioBarVol = 1;
        function setAudioBarVolume(val) {
            const v = Math.max(0, Math.min(1, parseFloat(val) || 0));
            if (v > 0) _lastAudioBarVol = v;
            const liveAudio = document.getElementById('liveRadioAudioElem') || document.getElementById('liveRadioAudio'); if (typeof currentActiveRadio !== 'undefined' && currentActiveRadio && RADIO_STATIONS[currentActiveRadio]) { const stAudio = document.getElementById(RADIO_STATIONS[currentActiveRadio].audioId); if (stAudio) stAudio.volume = v; }
            if (liveAudio) liveAudio.volume = v;
            const customAudio = document.getElementById('customAudioElem');
            if (customAudio) customAudio.volume = v;
            const customVideo = document.getElementById('customVideoElem');
            if (customVideo) customVideo.volume = v;
            const icon = document.getElementById('audioBarVolIcon');
            if (icon) {
                icon.className = v === 0
                    ? 'fa-solid fa-volume-xmark text-[11px] text-red-500 cursor-pointer'
                    : (v < 0.5 ? 'fa-solid fa-volume-low text-[11px] text-amber-500 cursor-pointer' : 'fa-solid fa-volume-high text-[11px] text-amber-500 cursor-pointer');
            }
        }

        function toggleAudioBarMute() {
            const slider = document.getElementById('audioBarVolume');
            const current = slider ? parseFloat(slider.value) : 1;
            const nextVol = current > 0 ? 0 : (_lastAudioBarVol || 1);
            if (slider) slider.value = nextVol;
            setAudioBarVolume(nextVol);
        }

        window.RADIO_STATIONS = RADIO_STATIONS;
        window.playRadioStation = playRadioStation;
        window.pauseRadioStation = pauseRadioStation;
        window.toggleRadioStation = toggleRadioStation;
        window.reconnectRadioStation = reconnectRadioStation;
        window.initRadioAudioListeners = initRadioAudioListeners;
        window.closePodcastVideoModal = closePodcastVideoModal;
        window.downloadActiveVideo = downloadActiveVideo;
        window.downloadCurrentAudio = downloadCurrentAudio;
        window.playMediaUrl = playMediaUrl;
        window.setAudioBarVolume = setAudioBarVolume;
        window.toggleAudioBarMute = toggleAudioBarMute;

        // EXPORTACIONES GLOBALES RESUELTAS
        if (typeof toggleLivePlay !== 'undefined') window.toggleLivePlay = toggleLivePlay;
        if (typeof reconnectLiveAudio !== 'undefined') window.reconnectLiveAudio = reconnectLiveAudio;
        if (typeof toggleAudioBarPlay !== 'undefined') window.toggleAudioBarPlay = toggleAudioBarPlay;
        if (typeof closeAudioBar !== 'undefined') window.closeAudioBar = closeAudioBar;
        if (typeof playPodcastMedia !== 'undefined') window.playPodcastMedia = playPodcastMedia;
        if (typeof playPodcastVideo !== 'undefined') window.playPodcastVideo = playPodcastVideo;
        if (typeof playPodcastAudio !== 'undefined') window.playPodcastAudio = playPodcastAudio;
        if (typeof downloadPodcastMedia !== 'undefined') window.downloadPodcastMedia = downloadPodcastMedia;
        if (typeof stopAllSpeech !== 'undefined') window.stopAllSpeech = stopAllSpeech;
        if (typeof updateAudioStreamStatus !== 'undefined') window.updateAudioStreamStatus = updateAudioStreamStatus;
        if (typeof updateStationUI !== 'undefined') window.updateStationUI = updateStationUI;
        if (typeof syncGlobalAudioWithStation !== 'undefined') window.syncGlobalAudioWithStation = syncGlobalAudioWithStation;


// ==============================================================
// MÓDULO GALLERY: GALERÍA FOTOGRÁFICA, LIGHTBOX Y SUBIDA BATCH
// ==============================================================



function filterGallery(category) {
    currentGalleryFilter = category;
    const buttons = ['all', 'cultos', 'actividades', 'bautismos', 'conferencias', 'jovenes'];
    buttons.forEach(b => {
        const btn = document.getElementById('btn-gal-' + b);
        if (btn) {
            if (b === category) {
                btn.className = 'px-4 py-2.5 rounded-xl text-xs font-bold transition-all bg-amber-500 text-slate-950 shadow-sm';
            } else {
                btn.className = 'px-4 py-2.5 rounded-xl text-xs font-bold transition-all bg-slate-100 dark:bg-[#0b152d] text-slate-700 dark:text-slate-300 hover:text-amber-600 border border-slate-300 dark:border-[#1d2d54]';
            }
        }
    });
    renderGallery();
}

function renderGallerySkeleton() {
    const grid = document.getElementById('fullGalleryGrid');
    if (!grid) return;
    grid.innerHTML = `
        <div class="h-56 bg-slate-800/60 rounded-2xl border border-slate-700/50 animate-pulse"></div>
        <div class="h-56 bg-slate-800/60 rounded-2xl border border-slate-700/50 animate-pulse"></div>
        <div class="h-56 bg-slate-800/60 rounded-2xl border border-slate-700/50 animate-pulse"></div>
        <div class="h-56 bg-slate-800/60 rounded-2xl border border-slate-700/50 animate-pulse hidden sm:block"></div>
        <div class="h-56 bg-slate-800/60 rounded-2xl border border-slate-700/50 animate-pulse hidden sm:block"></div>
        <div class="h-56 bg-slate-800/60 rounded-2xl border border-slate-700/50 animate-pulse hidden md:block"></div>
    `;
}
window.renderGallerySkeleton = renderGallerySkeleton;

function getFilteredGalleryItems() {
    const items = (appData.information && appData.information.gallery) ? appData.information.gallery : [];
    return (currentGalleryFilter === 'all')
        ? items
        : items.filter(g => (g.category || '').toLowerCase() === currentGalleryFilter.toLowerCase());
}

function renderGallery() {
    const grid = document.getElementById('fullGalleryGrid');
    if (!grid) return;

    const filtered = getFilteredGalleryItems();

    if (filtered.length === 0) {
        grid.innerHTML = '<div class="col-span-full text-center py-12 text-slate-500 text-sm">No hay fotos o videos en esta categoría.</div>';
        return;
    }

    grid.innerHTML = filtered.map((g, idx) => {
        const title = escapeHtml(g.title || 'Actividad');
        const url = g.url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=800';
        const date = escapeHtml(g.date || '');
        const cat = escapeHtml(g.category || 'General');

        return `
            <div onclick="openGalleryLightbox(${idx})" class="group relative rounded-3xl overflow-hidden border border-slate-200 dark:border-[#1d2d54] bg-slate-100 dark:bg-[#070e24] shadow-sm hover:shadow-xl transition-all cursor-pointer">
                <img src="${url}" alt="${title}" loading="lazy" decoding="async" class="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300">
                <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-5 text-white">
                    <span class="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 bg-black/40 px-2.5 py-0.5 rounded-full w-max mb-1">${cat}</span>
                    <h4 class="text-base font-bold leading-tight">${title}</h4>
                    <p class="text-[11px] text-slate-300 mt-1">${date}</p>
                </div>
            </div>
        `;
    }).join('');
}

let currentLibFilter = 'all';
let currentMusicSubFilter = 'all';


        // --- GALERÍA BATCH ---
                // ==============================================================
        // GESTIÓN DE SUBIDA A GALERÍA Y FUNCIONES DE ASISTENCIA
        // ==============================================================
        function openGalleryUploadModal() {
            const modal = document.getElementById('galleryUploadModal');
            if (modal) {
                modal.classList.remove('hidden');
                modal.style.display = 'flex';
                modal.style.zIndex = '2000';
            }
            const titleEl = document.getElementById('gPhotoTitle');
            if (titleEl) titleEl.value = '';
            const dataUrlEl = document.getElementById('gPhotoDataUrl');
            if (dataUrlEl) dataUrlEl.value = '';
            const fileIn = document.getElementById('gPhotoFileInput');
            if (fileIn) fileIn.value = '';
        }
        window.openGalleryUploadModal = openGalleryUploadModal;

        function closeGalleryUploadModal() {
            const modal = document.getElementById('galleryUploadModal');
            if (modal) { modal.classList.add('hidden'); modal.style.display = 'none'; }
        }
        window.closeGalleryUploadModal = closeGalleryUploadModal;

        async function handleGalleryImagePreview(event) {
            const file = event.target.files[0];
            if (!file) return;

            if (typeof validateMediaFileSize === 'function') {
                const val = validateMediaFileSize(file, 'image');
                if (!val.valid) {
                    showToast(val.error, "error");
                    event.target.value = '';
                    return;
                }
            }

            try {
                const compressed = await compressImageFile(file, 900, 900, 0.85);
                const dataUrlEl = document.getElementById('gPhotoDataUrl');
                if (dataUrlEl) dataUrlEl.value = compressed;
                showToast("✓ Imagen lista para guardar en Galería");
            } catch (err) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const dataUrlEl = document.getElementById('gPhotoDataUrl');
                    if (dataUrlEl) dataUrlEl.value = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        }
        window.handleGalleryImagePreview = handleGalleryImagePreview;

        async function saveGalleryPhoto(event) {
            if (event) event.preventDefault();
            const title = (document.getElementById('gPhotoTitle')?.value || '').trim();
            const category = document.getElementById('gPhotoCategory')?.value || 'Cultos';
            const date = (document.getElementById('gPhotoDate')?.value || '').trim() || 'Octubre 2026';
            const dataUrl = document.getElementById('gPhotoDataUrl')?.value;
            if (!title) {
                showToast("Por favor ingresa un título para la fotografía", "error");
                return;
            }
            if (!dataUrl) {
                showToast("Por favor selecciona una imagen", "error");
                return;
            }
            if (!appData.information) appData.information = {};
            if (!appData.information.gallery) appData.information.gallery = [];
            appData.information.gallery.unshift({
                id: 'g_' + Date.now(),
                title: title,
                category: category,
                date: date,
                url: dataUrl
            });
            await saveAppData();
            renderGallery();
            if (typeof renderAdminGalleryList === "function") renderAdminGalleryList();
            closeGalleryUploadModal();
            showToast("✓ Fotografía guardada exitosamente en la Galería");
        }
        window.saveGalleryPhoto = saveGalleryPhoto;



        function deleteGalleryPhoto(id) {
            if (typeof deleteGalleryItem === 'function') {
                deleteGalleryItem(id);
            }
        }
        window.deleteGalleryPhoto = deleteGalleryPhoto;


        // ==============================================================
        // LIGHTBOX INTERACTIVO DE FOTOGRAFÍAS Y MULTIMEDIA
        // ==============================================================
        let currentLightboxIndex = 0;
        let isLightboxZoomed = false;

        function openGalleryLightbox(idx) {
            const items = getFilteredGalleryItems();
            if (!items.length) return;
            currentLightboxIndex = (idx >= 0 && idx < items.length) ? idx : 0;
            updateLightboxUI();
            const modal = document.getElementById('galleryLightboxModal');
            if (modal) modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
        window.openGalleryLightbox = openGalleryLightbox;

        function closeGalleryLightbox() {
            const modal = document.getElementById('galleryLightboxModal');
            if (modal) modal.classList.add('hidden');
            document.body.style.overflow = '';
            isLightboxZoomed = false;
            const img = document.getElementById('lightboxImage');
            if (img) {
                img.classList.remove('scale-125', 'scale-150');
                img.classList.add('cursor-zoom-in');
                img.classList.remove('cursor-zoom-out');
            }
        }
        window.closeGalleryLightbox = closeGalleryLightbox;

        function handleLightboxBackdropClick(e) {
            if (e.target.id === 'galleryLightboxModal' || (e.target.classList && e.target.classList.contains('backdrop-blur-md'))) {
                closeGalleryLightbox();
            }
        }
        window.handleLightboxBackdropClick = handleLightboxBackdropClick;

        function nextLightboxImage() {
            const items = getFilteredGalleryItems();
            if (!items.length) return;
            currentLightboxIndex = (currentLightboxIndex + 1) % items.length;
            updateLightboxUI();
        }
        window.nextLightboxImage = nextLightboxImage;

        function prevLightboxImage() {
            const items = getFilteredGalleryItems();
            if (!items.length) return;
            currentLightboxIndex = (currentLightboxIndex - 1 + items.length) % items.length;
            updateLightboxUI();
        }
        window.prevLightboxImage = prevLightboxImage;

        function toggleLightboxZoom() {
            const img = document.getElementById('lightboxImage');
            const icon = document.getElementById('lightboxZoomIcon');
            if (!img) return;
            isLightboxZoomed = !isLightboxZoomed;
            if (isLightboxZoomed) {
                img.classList.add('scale-125');
                img.classList.remove('cursor-zoom-in');
                img.classList.add('cursor-zoom-out');
                if (icon) {
                    icon.classList.remove('fa-magnifying-glass-plus');
                    icon.classList.add('fa-magnifying-glass-minus');
                }
            } else {
                img.classList.remove('scale-125');
                img.classList.add('cursor-zoom-in');
                img.classList.remove('cursor-zoom-out');
                if (icon) {
                    icon.classList.remove('fa-magnifying-glass-minus');
                    icon.classList.add('fa-magnifying-glass-plus');
                }
            }
        }
        window.toggleLightboxZoom = toggleLightboxZoom;

        function updateLightboxUI() {
            const items = getFilteredGalleryItems();
            if (!items.length || currentLightboxIndex < 0 || currentLightboxIndex >= items.length) return;
            const item = items[currentLightboxIndex];
            const img = document.getElementById('lightboxImage');
            const title = document.getElementById('lightboxTitle');
            const badge = document.getElementById('lightboxIndexBadge');
            const catBadge = document.getElementById('lightboxCategoryBadge');

            if (img) img.src = item.url || '';
            if (title) title.textContent = item.title || 'Fotografía RTV';
            if (badge) badge.textContent = 'Foto ' + (currentLightboxIndex + 1) + ' de ' + items.length;
            if (catBadge) catBadge.textContent = item.category || 'Galería';
        }

        window.filterGallery = filterGallery;

        // EXPORTACIONES GLOBALES RESUELTAS
        if (typeof getFilteredGalleryItems !== 'undefined') window.getFilteredGalleryItems = getFilteredGalleryItems;
        if (typeof renderGallery !== 'undefined') window.renderGallery = renderGallery;
        if (typeof updateLightboxUI !== 'undefined') window.updateLightboxUI = updateLightboxUI;


// ==============================================================
// MÓDULO LIBRARY: BIBLIOTECA DIGITAL, RECURSOS Y MÚSICA
// ==============================================================

        function filterLibrary(category) {
            currentLibFilter = category;
            const subFilterBox = document.getElementById('musicSubcategoriesFilter');
            if (subFilterBox) {
                if (category === 'musica') subFilterBox.classList.remove('hidden');
                else subFilterBox.classList.add('hidden');
            }

            const buttons = ['all', 'predicas', 'podcasts', 'musica', 'testimonios'];
            buttons.forEach(b => {
                const btn = document.getElementById('btn-lib-' + b);
                if (btn) {
                    if (b === category) {
                        btn.className = 'px-5 py-2.5 rounded-xl text-xs font-bold transition-all bg-yellow-500 text-slate-950 shadow-sm';
                    } else {
                        btn.className = 'px-5 py-2.5 rounded-xl text-xs font-bold transition-all bg-slate-100 dark:bg-[#0b152d] text-slate-700 dark:text-slate-300 hover:text-yellow-400 border border-slate-300 dark:border-[#1d2d54]';
                    }
                }
            });
            renderLibrary();
            if (category === 'testimonios') {
                const testBlock = document.getElementById('testimonios-block');
                if (testBlock) testBlock.scrollIntoView({ behavior: 'smooth' });
            }
        }

function filterMusicSub(sub) {
    currentMusicSubFilter = sub;
    const subButtons = ['all', 'alabanzas', 'adoracion', 'himnos'];
    subButtons.forEach(b => {
        const btn = document.getElementById('btn-mus-' + b);
        if (btn) {
            if (b.toLowerCase() === sub.toLowerCase()) {
                btn.className = 'px-3.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30';
            } else {
                btn.className = 'px-3.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:text-amber-600';
            }
        }
    });
    renderLibrary();
}

function renderLibrary() {
    const grid = document.getElementById('fullLibraryGrid');
    if (!grid || !appData.podcasts) return;

    let items = appData.podcasts;
    if (currentLibFilter !== 'all') {
        items = items.filter(p => {
            const c = (p.category || '').toLowerCase();
            if (currentLibFilter === 'predicas') return c.includes('predica') || c.includes('prédica');
            if (currentLibFilter === 'podcasts') return c.includes('podcast');
            if (currentLibFilter === 'musica') {
                const isMusic = c.includes('musica') || c.includes('música');
                if (!isMusic) return false;
                if (currentMusicSubFilter !== 'all') {
                    return (p.musicSubcategory || '').toLowerCase() === currentMusicSubFilter.toLowerCase();
                }
                return true;
            }
            return true;
        });
    }

    if (items.length === 0) {
        grid.innerHTML = '<div class="col-span-full text-center py-12 text-slate-500 text-sm">No se encontraron contenidos en esta categoría.</div>';
        return;
    }

    grid.innerHTML = items.map(p => {
        const title = escapeHtml(p.title || 'Título');
        const desc = escapeHtml(p.desc || '');
        const duration = escapeHtml(p.duration || '30 min');
        const cat = escapeHtml(p.category || 'Recurso');
        const img = p.imageUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=600';
        const isVideo = p.mediaType === 'video' || isPodcastVideo(p.audioUrl, p.mediaType);

        return `
            <div class="bg-white dark:bg-[#0b152d] border border-slate-200 dark:border-[#1d2d54] rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                <div>
                    <div class="relative h-44 w-full overflow-hidden bg-slate-900">
                        <img src="${img}" alt="${title}" loading="lazy" decoding="async" class="w-full h-full object-cover">
                        <div class="absolute top-3 left-3 bg-black/60 backdrop-blur text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
                            ${cat}
                        </div>
                        <div class="absolute bottom-3 right-3 bg-black/70 text-white text-[10px] font-mono px-2 py-0.5 rounded">
                            ${duration}
                        </div>
                    </div>
                    <div class="p-5 space-y-2">
                        <h4 class="text-base font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug">${title}</h4>
                        <p class="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">${desc}</p>
                    </div>
                </div>
                <div class="p-5 pt-0">
                    <button onclick="playMediaPodcast('${p.id}')" class="w-full py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all">
                        <i class="fa-solid ${isVideo ? 'fa-play' : 'fa-headphones'}"></i>
                        <span>${isVideo ? 'Ver Prédica' : 'Escuchar Audio'}</span>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

let currentTestFilter = 'all';

        // ==============================================================
        // MIS PRIMEROS PASOS
        // ==============================================================
                function renderFirstSteps() {
            renderBibleSchool();
        }

        function renderProgramming() {
            renderRadioVision();
        }

        function renderDoctrines() {
            renderBibleSchool();
        }

        function renderInformation() {
            renderEvents();
            renderSedes();
            renderMissionary();
            renderGallery();
        }


        function switchInfoTab(tabId) {
            document.querySelectorAll('.info-tab-content').forEach(t => t.classList.add('hidden'));
            document.querySelectorAll('.info-tab-btn').forEach(b => {
                b.classList.remove('bg-yellow-500', 'text-slate-950', 'shadow-md');
                b.classList.add('bg-white', 'text-slate-700', 'border', 'border-slate-300');
            });
            document.getElementById(`info-tab-${tabId}`).classList.remove('hidden');
            const btn = document.getElementById(`btn-info-${tabId}`);
            btn.classList.remove('bg-white', 'text-slate-700', 'border', 'border-slate-300');
            btn.classList.add('bg-yellow-500', 'text-slate-950', 'shadow-md');
        }


        // ==============================================================
        // GESTIÓN DE AUDIO / VIDEO (BIBLIOTECA CRISTIANA)
        // ==============================================================
        function openAddPodcastModal() {
            openPodcastModal(null);
        }

        // ==============================================================
        // SUBIDA OPTIMIZADA DE CARPETAS DE MÚSICA (+250 CANCIONES)
        // ==============================================================
        window.pendingMusicFolderFiles = [];

        function openMusicFolderModal() {
            const modal = document.getElementById('musicFolderModal');
            if (!modal) return;
            const prevCont = document.getElementById('musicFolderPreviewContainer');
            if (prevCont) prevCont.classList.add('hidden');
            const prog = document.getElementById('musicFolderUploadProgress');
            if (prog) prog.classList.add('hidden');
            const folderIn = document.getElementById('fMusicFolderInput');
            if (folderIn) folderIn.value = '';
            const multiIn = document.getElementById('fMusicMultiFileInput');
            if (multiIn) multiIn.value = '';
            const confirmBtn = document.getElementById('btnConfirmFolderUpload');
            if (confirmBtn) {
                confirmBtn.disabled = true;
                confirmBtn.classList.add('opacity-50', 'cursor-not-allowed');
            }
            window.pendingMusicFolderFiles = [];
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
            modal.style.zIndex = '2000';
        }

        function closeMusicFolderModal() {
            const modal = document.getElementById('musicFolderModal');
            if (modal) { modal.classList.add('hidden'); modal.style.display = 'none'; }
            window.pendingMusicFolderFiles = [];
        }

        function handleMusicFolderSelect(event) {
            const folderIn = document.getElementById('fMusicFolderInput');
            const multiIn = document.getElementById('fMusicMultiFileInput');
            
            const rawFiles = [];
            if (folderIn && folderIn.files && folderIn.files.length > 0) {
                rawFiles.push(...Array.from(folderIn.files));
            }
            if (multiIn && multiIn.files && multiIn.files.length > 0) {
                rawFiles.push(...Array.from(multiIn.files));
            }
            if (rawFiles.length === 0 && event && event.target && event.target.files) {
                rawFiles.push(...Array.from(event.target.files));
            }

            const mediaFiles = rawFiles.filter(f => {
                return (f.type && (f.type.startsWith('audio/') || f.type.startsWith('video/'))) ||
                       /\.(mp3|wav|ogg|m4a|aac|mp4|webm|flac|wma)$/i.test(f.name);
            });

            if (mediaFiles.length === 0) {
                showToast("No se encontraron archivos de audio o música compatibles", "error");
                return;
            }

            // Deduplicar por nombre y tamaño
            const uniqueMap = new Map();
            mediaFiles.forEach(f => uniqueMap.set(f.name + '_' + f.size, f));
            window.pendingMusicFolderFiles = Array.from(uniqueMap.values());

            const countEl = document.getElementById('musicFolderFilesCount');
            if (countEl) countEl.innerText = `${window.pendingMusicFolderFiles.length} archivo(s) de música listo(s)`;
            
            const listEl = document.getElementById('musicFolderFilesList');
            if (listEl) {
                const displayFiles = window.pendingMusicFolderFiles.slice(0, 100);
                let listHtml = displayFiles.map((f, i) => `
                    <div class="flex items-center justify-between py-1 border-b border-slate-800 last:border-0 text-xs">
                        <span class="truncate pr-2 text-slate-300">${i+1}. ${escapeHtml(f.name)}</span>
                        <span class="text-[10px] text-amber-400 shrink-0">${(f.size / (1024 * 1024)).toFixed(1)} MB</span>
                    </div>
                `).join('');
                if (window.pendingMusicFolderFiles.length > 100) {
                    listHtml += `<div class="py-2 text-center text-xs font-bold text-amber-400">+ ${window.pendingMusicFolderFiles.length - 100} canciones adicionales en cola</div>`;
                }
                listEl.innerHTML = listHtml;
            }

            const prevCont = document.getElementById('musicFolderPreviewContainer');
            if (prevCont) prevCont.classList.remove('hidden');

            const confirmBtn = document.getElementById('btnConfirmFolderUpload');
            if (confirmBtn) {
                confirmBtn.disabled = false;
                confirmBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            }
            showToast(`✓ ${window.pendingMusicFolderFiles.length} canciones detectadas y listas para guardar`);
        }

        async function confirmMusicFolderUpload() {
            try {
                let files = window.pendingMusicFolderFiles || [];
                if (files.length === 0) {
                    const folderIn = document.getElementById('fMusicFolderInput');
                    const multiIn = document.getElementById('fMusicMultiFileInput');
                    const rawFiles = [];
                    if (folderIn && folderIn.files && folderIn.files.length > 0) rawFiles.push(...Array.from(folderIn.files));
                    if (multiIn && multiIn.files && multiIn.files.length > 0) rawFiles.push(...Array.from(multiIn.files));
                    files = rawFiles.filter(f => (f.type && (f.type.startsWith('audio/') || f.type.startsWith('video/'))) || /\.(mp3|wav|ogg|m4a|aac|mp4|webm|flac|wma)$/i.test(f.name));
                }

                if (files.length === 0) {
                    showToast("Por favor selecciona una carpeta o archivos de música primero.", "error");
                    return;
                }

                const subcatEl = document.getElementById('folderMusicSubcat');
                const subcat = (subcatEl && subcatEl.value) ? subcatEl.value : 'Alabanzas';
                const prog = document.getElementById('musicFolderUploadProgress');
                const confirmBtn = document.getElementById('btnConfirmFolderUpload');
                if (prog) prog.classList.remove('hidden');
                if (confirmBtn) confirmBtn.disabled = true;

                const total = files.length;
                const defaultMusicImgs = {
                    'Alabanzas': 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&q=80&w=600',
                    'Adoración': 'https://images.unsplash.com/photo-1510936111840-65e151ad71bb?auto=format&fit=crop&q=80&w=600',
                    'Coros': 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=600',
                    'Himnos': 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&q=80&w=600'
                };

                window.uploadedMediaCache = window.uploadedMediaCache || new Map();
                window.availableMediaBlobIds = window.availableMediaBlobIds || new Set();
                const timestamp = Date.now();
                let addedItems = [];

                const batchSize = 10;
                for (let i = 0; i < total; i++) {
                    const file = files[i];
                    let cleanTitle = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ").trim();
                    cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);

                    const isVid = (file.type && file.type.startsWith('video/')) || /\.(mp4|webm|mov)$/i.test(file.name);
                    const itemId = 'po_' + timestamp + '_' + (i + 1);

                    window.availableMediaBlobIds.add(itemId);

                    const newItem = {
                        id: itemId,
                        category: 'Música',
                        musicSubcategory: subcat,
                        mediaType: isVid ? 'video' : 'audio',
                        title: cleanTitle,
                        desc: `${subcat} congregacional - RADIOVISIÓN RTV`,
                        duration: isVid ? '15 min' : '4 min',
                        imageUrl: defaultMusicImgs[subcat] || defaultMusicImgs['Alabanzas'],
                        audioUrl: 'idb://' + itemId,
                        fileName: file.name,
                        fileSize: file.size
                    };

                    addedItems.push(newItem);

                    if (i % batchSize === 0 || i === total - 1) {
                        const progText = document.getElementById('musicFolderProgressText');
                        if (progText) {
                            progText.innerText = `Guardando canciones: ${i + 1} de ${total}...`;
                        }
                        await new Promise(r => setTimeout(r, 0));
                    }
                }

                if (!appData.podcasts) appData.podcasts = [];
                appData.podcasts.push(...addedItems);

                // Guardar en IndexedDB y liberar referencias temporales en RAM
                if (!db && typeof initDB === 'function') await initDB();
                if (db && db.objectStoreNames.contains('media')) {
                    try {
                        await new Promise((resolve) => {
                            const tx = db.transaction(['media'], 'readwrite');
                            const store = tx.objectStore('media');
                            for (let i = 0; i < total; i++) {
                                store.put(files[i], addedItems[i].id);
                            }
                            tx.oncomplete = () => resolve(true);
                            tx.onerror = () => resolve(false);
                        });
                    } catch (err) {
                        console.warn("IndexedDB batch save error", err);
                    }
                }
                window.pendingMusicFolderFiles = [];

                await saveAppData();
                renderPodcasts();
                if (typeof renderAdminLists === "function") renderAdminLists();
                closeMusicFolderModal();
                showToast(`✓ Se guardaron exitosamente ${addedItems.length} canciones en Música (${subcat})`);

                if (typeof filterPodcasts === 'function') {
                    filterPodcasts('Música');
                }
                setTimeout(() => {
                    const subBtn = document.getElementById('btn-mus-' + subcat.toLowerCase());
                    if (subBtn && typeof filterMusicSub === 'function') filterMusicSub(subcat, subBtn);
                }, 150);
            } catch (saveErr) {
                console.error("Error al guardar carpeta de música:", saveErr);
                showToast("Ocurrió un error al guardar: " + saveErr.message, "error");
                const prog = document.getElementById('musicFolderUploadProgress');
                if (prog) prog.classList.add('hidden');
                const confirmBtn = document.getElementById('btnConfirmFolderUpload');
                if (confirmBtn) confirmBtn.disabled = false;
            }
        }

        // ==============================================================
        // EXPORTACIONES GLOBALES DE BIBLIOTECA Y MULTIMEDIA
        // ==============================================================
        if (typeof closeMusicFolderModal === 'function') window.closeMusicFolderModal = closeMusicFolderModal;
        if (typeof handleMusicFolderSelect === 'function') window.handleMusicFolderSelect = handleMusicFolderSelect;
        if (typeof confirmMusicFolderUpload === 'function') window.confirmMusicFolderUpload = confirmMusicFolderUpload;
        if (typeof openAddPodcastModal === 'function') window.openAddPodcastModal = openAddPodcastModal;
        if (typeof openMusicFolderModal === 'function') window.openMusicFolderModal = openMusicFolderModal;
        if (typeof filterLibrary === 'function') window.filterLibrary = filterLibrary;
        if (typeof filterMusicSub === 'function') window.filterMusicSub = filterMusicSub;
        if (typeof filterPodcasts === 'function') window.filterPodcasts = filterPodcasts;

        // EXPORTACIONES GLOBALES RESUELTAS
        if (typeof renderLibrary !== 'undefined') window.renderLibrary = renderLibrary;
        if (typeof renderFirstSteps !== 'undefined') window.renderFirstSteps = renderFirstSteps;
        if (typeof renderProgramming !== 'undefined') window.renderProgramming = renderProgramming;
        if (typeof renderDoctrines !== 'undefined') window.renderDoctrines = renderDoctrines;
        if (typeof renderInformation !== 'undefined') window.renderInformation = renderInformation;
        if (typeof switchInfoTab !== 'undefined') window.switchInfoTab = switchInfoTab;


// ==============================================================
// MÓDULO BIBLE: BIBLIA DIGITAL, VERSÍCULO DIARIO Y NAVEGACIÓN
// ==============================================================

        // ==============================================================
        // VERSÍCULO DEL DÍA DINÁMICO & REFLEXIÓN PASTORAL
        // ==============================================================
        const DAILY_VERSES_DATA = [
            {
                ref: "Jeremías 29:11",
                ref_qu: "Jeremías 29:11",
                book: "Jeremías",
                chapter: 29,
                verse: 11,
                quote: "Porque yo sé los pensamientos que tengo acerca de vosotros, dice Jehová, pensamientos de paz, y no de mal, para daros el fin que esperáis.",
                quote_qu: "Ñoqa kikiymi yachani qankunapaq yuyaykusqaykunata, nispan nin Tayta Dios. Hawkakay yuyaykunam, manam ñakariypaqchu, aswanpas suyasqaykichik sumaq kawsayta qonaypaq.",
                reflection: "Descansa en la soberanía de Dios; sus planes para tu vida superan cualquier incertidumbre terrenal.",
                reflection_qu: "Diospa munayninpi samariy; kawsayniykipaq qillqasqanqa lliw kay pachapi sasachakuykunatam llallin."
            },
            {
                ref: "Filipenses 4:13",
                ref_qu: "Filipenses 4:13",
                book: "Filipenses",
                chapter: 4,
                verse: 13,
                quote: "Todo lo puedo en Cristo que me fortalece.",
                quote_qu: "Tukuy imatam atini kallpanchawaqniy Cristopi.",
                reflection: "Tu fuerza no proviene de tus capacidades humanas, sino del poder inagotable de Cristo en tu corazón.",
                reflection_qu: "Kallpaykiqa manam runapa aypasqallanmantachu, aswanpas Cristopa mana tukukuq atiyninmantam sonqoykipi."
            },
            {
                ref: "Salmos 23:1",
                ref_qu: "Salmos 23:1",
                book: "Salmos",
                chapter: 23,
                verse: 1,
                quote: "Jehová es mi pastor; nada me faltará.",
                quote_qu: "Tayta Diosmi michiqniyqa; manam imapas pisipuwanqachu.",
                reflection: "En medio de cualquier escasez o valle de sombra, la provisión y el consuelo del Buen Pastor te acompañan hoy.",
                reflection_qu: "Ima pisikuypipas otaq llantukunapa wayqonpipas, Allin Michiqpa samariyninwan yanapayninmi kunan p'unchaw pusasunki."
            },
            {
                ref: "Isaías 40:31",
                ref_qu: "Isaías 40:31",
                book: "Isaías",
                chapter: 40,
                verse: 31,
                quote: "Pero los que esperan a Jehová tendrán nuevas fuerzas; levantarán alas como las águilas; correrán, y no se cansarán; caminarán, y no se fatigarán.",
                quote_qu: "Tayta Diospi suyakamaqkunam ichaqa musuq kallpata chaskinqaku; ankakuna hinam raprakunata kicharinqaku; pawaykachanqakum, manataqmi sayk'unqakuchu; purinqakum, manataqmi pisipanqakuchu.",
                reflection: "La espera en el Señor renueva el alma; confía en sus tiempos perfectos.",
                reflection_qu: "Señorpi suyakuymi almanchikta kawsarichin; sumaq tiemponta sonqoykiwan suyay."
            },
            {
                ref: "Proverbios 3:5-6",
                ref_qu: "Proverbios 3:5-6",
                book: "Proverbios",
                chapter: 3,
                verse: 5,
                quote: "Fíate de Jehová de todo tu corazón, y no te apoyes en tu propia prudencia. Reconócelo en todos tus caminos, y él enderezará tus veredas.",
                quote_qu: "Tayta Diospi tukuy sonqoykiwan hapipakuy, amataq kikillaykipa yachaynikimanqa k'askakuychu. Lliw purisqaykipi Payta riqsikuy, Paymi ñanniykikunata derechoyachinqa.",
                reflection: "Rinde tus caminos al Señor y confía plenamente en su dirección sabia para este día.",
                reflection_qu: "Ñanniykikunata Señorpa makinman churay, paypa allin yachayninwan pusasqa kanaykipaq."
            },
            {
                ref: "Josué 1:9",
                ref_qu: "Josué 1:9",
                book: "Josué",
                chapter: 1,
                verse: 9,
                quote: "Mira que te mando que te esfuerces y seas valiente; no temas ni desmayes, porque Jehová tu Dios estará contigo en dondequiera que vayas.",
                quote_qu: "Kamachiykim: Kallpanchakuy, amataq manchakuychu nitaq pisipaychu, mayta riptiykipas Tayta Diosniykiqa qanwanmi kanqa.",
                reflection: "Avanza con valentía; la presencia de Dios es tu mayor escudo y victoria.",
                reflection_qu: "Kallpanchakuspa ñawpaqman puriy; Diospa kanchayninmi qampa aswan hatun escudoyki."
            },
            {
                ref: "Romanos 8:28",
                ref_qu: "Romanos 8:28",
                book: "Romanos",
                chapter: 8,
                verse: 28,
                quote: "Y sabemos que a los que aman a Dios, todas las cosas les ayudan a bien, esto es, a los que conforme a su propósito son llamados.",
                quote_qu: "Yachanchiktaqmi Diosta kuyaqkunapaqqa tukuy ima allinninkupaq kuskachakusqanta, munayninman hina wajasqakunapaq.",
                reflection: "Aun en los momentos difíciles, Dios obra tras bambalinas para cumplir su bendito propósito.",
                reflection_qu: "Sasachakuykunapipas, Diosmi kuskachachkan sumaq munayninta hunt'ananpaq."
            },
            {
                ref: "Mateo 11:28",
                ref_qu: "Mateo 11:28",
                book: "Mateo",
                chapter: 11,
                verse: 28,
                quote: "Venid a mí todos los que estáis trabajados y cargados, y yo os haré descansar.",
                quote_qu: "Hamuychik ñoqaman lliw sayk'usqakuna llumpay q'episqakunapas, ñoqam samarichisqaykichik.",
                reflection: "Entrega tus cargas a los pies de Jesús hoy; su paz sobrepasa todo entendimiento.",
                reflection_qu: "Lasaq q'epiykikunata Jesús chakiman churay; hawkayayninqa lliw yuyaykunatam llallin."
            },
            {
                ref: "Juan 3:16",
                ref_qu: "Juan 3:16",
                book: "Juan",
                chapter: 3,
                verse: 16,
                quote: "Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna.",
                quote_qu: "Diosqa anchatapunim runakunata kuyarqa, chaymi sapallan Churinta qomurqa, pipas Paypi iñiqqa mana chinkaspa wiñay kawsayniyuq kananpaq.",
                reflection: "El amor de Dios hacia ti es infinito; en la cruz de Cristo hallaste salvación y perdón.",
                reflection_qu: "Diospa kuyakuyninqa mana tupunallam; Cristopa cruznpim qespisqa kayta pampachaytapas tarirqanki."
            },
            {
                ref: "Salmos 46:1",
                ref_qu: "Salmos 46:1",
                book: "Salmos",
                chapter: 46,
                verse: 1,
                quote: "Dios es nuestro amparo y fortaleza, nuestro pronto auxilio en las tribulaciones.",
                quote_qu: "Diosmi pakakuyninchikqa kallpanchikpas, sasachakuykunapi utqaylla yanapawaqninchik.",
                reflection: "Cuando el mundo tiemble a tu alrededor, Dios permanece como tu refugio inquebrantable.",
                reflection_qu: "Kay pacha maytapas kuyuptinqa, Diosmi mana kuyuriq pakakuyniyki kachkan."
            },
            {
                ref: "2 Corintios 5:17",
                ref_qu: "2 Corintios 5:17",
                book: "2 Corintios",
                chapter: 5,
                verse: 17,
                quote: "De modo que si alguno está en Cristo, nueva criatura es; las cosas viejas pasaron; he aquí todas son hechas nuevas.",
                quote_qu: "Chaynaqa, pipas Cristopi kaspanqa, musuq kamasqam; ñawpaq kaqkunaqa pasarunñam; kunanqa lliwmi musuqyapun.",
                reflection: "Tu pasado ha sido redimido; camina con la frente en alto en la nueva vida que Cristo te regaló.",
                reflection_qu: "Ã‘awpaq kawsayniykiqa Cristowan pampachasqam; Uma huqarisqa puriy Cristo qosqasunki musuq kawsaypi."
            },
            {
                ref: "Salmos 91:1-2",
                ref_qu: "Salmos 91:1-2",
                book: "Salmos",
                chapter: 91,
                verse: 1,
                quote: "El que habita al abrigo del Altísimo morará bajo la sombra del Omnipotente. Diré yo a Jehová: Esperanza mía, y castillo mío; mi Dios, en quien confiaré.",
                quote_qu: "Ancha Hatun Diospa pakaykusqanpi kaqqa, Tukuy Atiyniyuqpa llantuyninpin samanqa. Tayta Diostam nisaq: Qammi pakaykuwaqniyqa kallpaypas; Diosniymi kanki, qampin hapipakuni.",
                reflection: "Bajo la sombra del Todopoderoso encuentras la máxima seguridad espiritual para tu hogar.",
                reflection_qu: "Tukuy Atiyniyuqpa llantuyninpim wasiykipaq iñiyniykipaqpas aswan hatun seguridadta tarinki."
            },
            {
                ref: "Gálatas 2:20",
                ref_qu: "Gálatas 2:20",
                book: "Gálatas",
                chapter: 2,
                verse: 20,
                quote: "Con Cristo estoy juntamente crucificado, y ya no vivo yo, mas vive Cristo en mí; y lo que ahora vivo en la carne, lo vivo en la fe del Hijo de Dios...",
                quote_qu: "Cristowan kuskam chakatasqa kani; manañam ñoqañachu kawsani, aswanpas Cristom ñoqapi kawsan...",
                reflection: "Permite que el carácter de Cristo se manifieste hoy en cada una de tus acciones y palabras.",
                reflection_qu: "Cristopa k'anchariynin kawsayniykipi sapa rimaynikipi ruraynikipipas rikchakuchun."
            },
            {
                ref: "Santiago 1:5",
                ref_qu: "Santiago 1:5",
                book: "Santiago",
                chapter: 1,
                verse: 5,
                quote: "Y si alguno de vosotros tiene falta de sabiduría, pídala a Dios, el cual da a todos abundantemente y sin reproche, y le será dada.",
                quote_qu: "Mayqenniykichikpas yachayta pisiptiykichikqa, Diosta mañakuychik; payqa lliwmanmi mana qaqchaspa llumpayta qon, hinaspan qosqa kanqa.",
                reflection: "Antes de tomar decisiones importantes, acude al trono de la gracia y pide la sabiduría celestial.",
                reflection_qu: "Manaraq ima hatun decisióntapas ruwachkaspa, Diospa allin yachayninta mañakuy."
            },
            {
                ref: "1 Pedro 5:7",
                ref_qu: "1 Pedro 5:7",
                book: "1 Pedro",
                chapter: 5,
                verse: 7,
                quote: "Echando toda vuestra ansiedad sobre él, porque él tiene cuidado de vosotros.",
                quote_qu: "Lliw llakikuyniykichikta Payman saqeychik, Paymi qankunata qawamusunkichik.",
                reflection: "No cargues ansiedades que no te corresponden; Dios cuida cada detalle de tu familia y salud.",
                reflection_qu: "Ama mana qampaq kaq llakikuykunata apaychu; Diosmi aylluykitapas qallariynikitapas cuidachkan."
            },
            {
                ref: "Salmos 121:1-2",
                ref_qu: "Salmos 121:1-2",
                book: "Salmos",
                chapter: 121,
                verse: 1,
                quote: "Alzaré mis ojos a los montes; ¿De dónde vendrá mi socorro? Mi socorro viene de Jehová, que hizo los cielos y la tierra.",
                quote_qu: "Urqukunatam qawan-qawarispa qawani; ¿Maymantataq yanapayniyqa hamunqa? Yanapayniyqa hanaq pachatawan kay pachata kamaq Tayta Diosmantam hamun.",
                reflection: "No mires el tamaño de tu problema, mira la grandeza del Creador que pelea por ti.",
                reflection_qu: "Ama sasachakuyniykipa hatun kayninta qawaychu, Kamawaq Diospa hatun atiynintam qaway, Paymi qampaq maqanakuchkan."
            },
            {
                ref: "Efesios 2:8-9",
                ref_qu: "Efesios 2:8-9",
                book: "Efesios",
                chapter: 2,
                verse: 8,
                quote: "Porque por gracia sois salvos por medio de la fe; y esto no de vosotros, pues es don de Dios; no por obras, para que nadie se gloríe.",
                quote_qu: "Khuyapayakuyninraykum iñiyniykichikrayku qespisqa karqankichik; kayqa manam qankunamantachu, aswanpas Diospa qokuyninmi...",
                reflection: "La gracia es el regalo inmerecido de Dios; vívela con un corazón agradecido y humilde.",
                reflection_qu: "Diospa khuyapayninta agradecido sonqowan chaskikuy hinaspa kawsay."
            },
            {
                ref: "Salmos 37:4-5",
                ref_qu: "Salmos 37:4-5",
                book: "Salmos",
                chapter: 37,
                verse: 4,
                quote: "Deléitate asimismo en Jehová, y él te concederá las peticiones de tu corazón. Encomienda a Jehová tu camino, y confía en él; y él hará.",
                quote_qu: "Tayta Diospi kusikuy, Paymi sonqoykipa mañakusqanta qosunki. Ñanniykita Tayta Diospa makinman churay, Paypi hapipakuy; Paymi ruranqa.",
                reflection: "Pon tu deleite en Dios y verás cómo sus deseos puros se alinean con los anhelos de tu alma.",
                reflection_qu: "Diospi kusirikuy, paypa chuyay chuyay munayninmi sonqoykipa munasqanwan kuskachakunqa."
            },
            {
                ref: "Isaías 41:10",
                ref_qu: "Isaías 41:10",
                book: "Isaías",
                chapter: 41,
                verse: 10,
                quote: "No temas, porque yo estoy contigo; no desmayes, porque yo soy tu Dios que te esfuerzo; siempre te ayudaré, siempre te sustentaré con la diestra de mi justicia.",
                quote_qu: "Ama manchakuychu, ñoqam qanwan kashani; ama llakikuychu, ñoqam Diosniyki kani; ñoqam kallpanchasayki, ñoqam yanapasayki...",
                reflection: "La diestra de justicia de Dios te sostiene con firmeza; no desmayes en la prueba.",
                reflection_qu: "Tayta Diospa chanin paña makinmi allinta watasunki; sasachakuypi ama pisipaychu."
            },
            {
                ref: "Romanos 12:2",
                ref_qu: "Romanos 12:2",
                book: "Romanos",
                chapter: 12,
                verse: 2,
                quote: "No os conforméis a este siglo, sino transformaos por medio de la renovación de vuestro entendimiento...",
                quote_qu: "Ama kay pacha runakuna hinachu kawsaychik, aswanpas yuyayniykichikta musuqyachispa t'ikrakuychik...",
                reflection: "Llena tu mente de las Sagradas Escrituras y tu vida reflejará la voluntad agradable y perfecta de Dios.",
                reflection_qu: "Yuyaynikita Ch'uya Qillqakunawan hunt'achiy, kawsayniykitaq Diospa allin munayninta rikuchinqa."
            },
            {
                ref: "Salmos 119:105",
                ref_qu: "Salmos 119:105",
                book: "Salmos",
                chapter: 119,
                verse: 105,
                quote: "Lámpara es a mis pies tu palabra, y lumbrera a mi camino.",
                quote_qu: "Palabraykiqa chakiykunapaq mechero hinam, ñanniypaq k'anchaymi.",
                reflection: "La Biblia es la brújula fiel que alumbra tus pasos y te libra de los tropiezos del camino.",
                reflection_qu: "Ch'uya Simi Qillqam puririyniykikunata k'ancharin, pantaykunamanta qespichisunki."
            },
            {
                ref: "Colosenses 3:23",
                ref_qu: "Colosenses 3:23",
                book: "Colosenses",
                chapter: 3,
                verse: 23,
                quote: "Y todo lo que hagáis, hacedlo de corazón, como para el Señor y no para los hombres.",
                quote_qu: "Imatapas ruwaspaykichikqa, tukuy sonqoykichikwan ruwaychik, runakunapaq hinaqa manam, aswanpas Señorpaq hinam.",
                reflection: "En tu trabajo, familia o ministerio, haz todo con excelencia y amor como una ofrenda a Dios.",
                reflection_qu: "Llamk'aynikipi, aylluykipi otaq ministeriopipas, tukuy imata Diospaq ofrendata hina allinta ruway."
            },
            {
                ref: "Hebreos 11:1",
                ref_qu: "Hebreos 11:1",
                book: "Hebreos",
                chapter: 11,
                verse: 1,
                quote: "Es, pues, la fe la certeza de lo que se espera, la convicción de lo que no se ve.",
                quote_qu: "Iñiyqa suyasqanchikta cheqaqtapuni chaskinapaq segurakuyñam, mana rikuna kaqkunatapas rikuq hina riqsikuyñam.",
                reflection: "La fe ve lo invisible, cree lo increíble y recibe lo imposible de parte de Dios.",
                reflection_qu: "Iñiyqa mana rikuy atinata rikuchin, mana creey atinata iñichin, hinaspa Diosmanta mana atina kaqta chaskichin."
            },
            {
                ref: "Salmos 103:2-3",
                ref_qu: "Salmos 103:2-3",
                book: "Salmos",
                chapter: 103,
                verse: 2,
                quote: "Bendice, alma mía, a Jehová, y no olvides ninguno de sus beneficios. Él es quien perdona todas tus iniquidades, el que sana todas tus dolencias.",
                quote_qu: "Almay, Tayta Diosta hatunchay, amataq lliw allin rurasqankunata qonqaychu. Paymi lliw huchaykikunata pampachan, Paymi llapa onqoyniykikunata alliyachin.",
                reflection: "Que la alabanza no se aparte de tu boca; recuerda con gratitud cada favor que Dios te ha concedido.",
                reflection_qu: "Sapa p'unchaw sonqoykimanta samariy, Diospa qosqasunki allinkunata yuyarispa."
            },
            {
                ref: "Miqueas 6:8",
                ref_qu: "Miqueas 6:8",
                book: "Miqueas",
                chapter: 6,
                verse: 8,
                quote: "Oh hombre, él te ha declarado lo que es bueno, y qué pide Jehová de ti: solamente hacer justicia, y amar misericordia, y humillarte ante tu Dios.",
                quote_qu: "¿Imatataq Tayta Dios mañakusunki? Chanin kaqta rurayllatam, khuyapayakuypi kawsaytam, hinaspa Diosniykiwan llampu sonqowan puriyllatam.",
                reflection: "La verdadera vida cristiana se resume en un corazón justo, misericordioso y humilde.",
                reflection_qu: "Cristianopa cheqaq kawsayninqa chanin ruraypi, kuyapayakuypi hinaspa llampu sonqopim kachkan."
            },
            {
                ref: "1 Tesalonicenses 5:16-18",
                ref_qu: "1 Tesalonicenses 5:16-18",
                book: "1 Tesalonicenses",
                chapter: 5,
                verse: 16,
                quote: "Estad siempre gozosos. Orad sin cesar. Dad gracias en todo, porque esta es la voluntad de Dios para con vosotros en Cristo Jesús.",
                quote_qu: "Tukuy tiempo kusisqa kaychik. Mana amiruspa mañakuychik. Tukuy imamantapas graciasta qoychik, chaytam Diosqa munan Cristo Jesuspi.",
                reflection: "La gratitud y la oración constante transforman el ambiente de cualquier hogar.",
                reflection_qu: "Agradecido kaypas mana sayk'uspa mañakuypas wasiykipa kawsaynintam sumaqyachin."
            },
            {
                ref: "Salmos 34:8",
                ref_qu: "Salmos 34:8",
                book: "Salmos",
                chapter: 34,
                verse: 8,
                quote: "Gustad, y ved que es bueno Jehová; dichoso el hombre que confía en él.",
                quote_qu: "Malliychik, qawaychiktaq Tayta Diospa allin kasqanta; mayna kusisqam Paypi hapipakuq runaqa.",
                reflection: "Experimenta hoy la bondad y dulzura del Señor; su fidelidad jamás falla.",
                reflection_qu: "Señorpa allin kayninta malliy; paypa sonqochanakusqanqa manam hayk'aqpas pisipanchu."
            },
            {
                ref: "Isaías 26:3",
                ref_qu: "Isaías 26:3",
                book: "Isaías",
                chapter: 26,
                verse: 3,
                quote: "Tú guardarás en completa paz a aquel cuyo pensamiento en ti persevera; porque en ti ha confiado.",
                quote_qu: "Qampi yuyayniyuq kaqtan tukuy hawkakaypi waqaychanki, Qampi hapipakuq kasqanrayku.",
                reflection: "Mantén tus pensamientos fijos en las promesas de Dios y experimentarás una paz inamovible.",
                reflection_qu: "Diospa promesankunapi yuyaynikita watay, mana kuyuriq hawkakaytam tarinki."
            },
            {
                ref: "Salmos 139:14",
                ref_qu: "Salmos 139:14",
                book: "Salmos",
                chapter: 139,
                verse: 14,
                quote: "Te alabaré; porque formidables, maravillosas son tus obras; estoy maravillado, y mi alma lo sabe muy bien.",
                quote_qu: "Hatunchasaykim, mancharikuypaq sumaq ruwasqa kasqayrayku; utqay ruwasqaykikunaqa sumaqmi, almaypas chaytaqa allintam yachan.",
                reflection: "Fuiste creado con un diseño y propósito celestial; eres una obra maravillosa de las manos de Dios.",
                reflection_qu: "Hanaq pacha munaywanmi kamasqa karqanki; Diospa makinwan sumaq ruwasqanmi kanki."
            },
            {
                ref: "Apocalipsis 22:20",
                ref_qu: "Apocalipsis 22:20",
                book: "Apocalipsis",
                chapter: 22,
                verse: 20,
                quote: "El que da testimonio de estas cosas dice: Ciertamente vengo en breve. Amén; sí, ven, Señor Jesús.",
                quote_qu: "Kaykunamanta willaqmi nin: Cheqaptapunim utqaylla hamusaq. Amén; ¡hamuy, Señor Jesús!",
                reflection: "Nuestra bendita esperanza es el pronto regreso de Jesucristo. ¡Permanezcamos firmes velando en santidad!",
                reflection_qu: "Suyakuyninchikqa Jesucristopa kawsarimpuyninmi. ¡Ch'uyay-ch'uyaypi suyasunchik!"
            },
            {
                ref: "Salmos 150:6",
                ref_qu: "Salmos 150:6",
                book: "Salmos",
                chapter: 150,
                verse: 6,
                quote: "Todo lo que respira alabe a JAH. Aleluya.",
                quote_qu: "¡Tukuy samayniyuq kaqqa Tayta Diosta hatunchachun! ¡Aleluya!",
                reflection: "Mientras haya aliento en ti, que tu vida sea un cántico de alabanza y adoración al Rey de reyes.",
                reflection_qu: "Kawsayniyki kachkaptinqa, Reykunaq Reyninta sapa minuto samarispa hatunchay."
            }
        ];

        function getTodayVerse() {
            if (appData.dailyVerse && appData.dailyVerse.customActive && appData.dailyVerse.quote) {
                return appData.dailyVerse;
            }
            const now = new Date();
            const startOfYear = new Date(now.getFullYear(), 0, 0);
            const diff = now - startOfYear;
            const oneDay = 1000 * 60 * 60 * 24;
            const dayOfYear = Math.floor(diff / oneDay);
            const idx = Math.abs(dayOfYear) % DAILY_VERSES_DATA.length;
            return DAILY_VERSES_DATA[idx];
        }

        function renderDailyVerse() {
            const v = getTodayVerse();
            if (!v) return;

            const qEl = document.getElementById('dailyVerseQuote');
            const refBadge = document.getElementById('dailyVerseRefBadge');
            const refEl = document.getElementById('dailyVerseReflection');
            const dateEl = document.getElementById('dailyVerseDateText');
            const currentLang = (typeof getAppLanguage === 'function') ? getAppLanguage() : 'es';

            const quoteText = (currentLang === 'qu' && v.quote_qu) ? v.quote_qu : v.quote;
            const refText = (currentLang === 'qu' && v.ref_qu) ? v.ref_qu : v.ref;
            const reflectionText = (currentLang === 'qu' && v.reflection_qu) ? v.reflection_qu : v.reflection;
            const pastoralPrefix = (currentLang === 'qu') ? 'Pastoral Yuyaymanay:' : 'Reflexión Pastoral:';

            if (qEl) qEl.innerText = `"${quoteText}"`;
            if (refBadge) refBadge.innerText = refText;
            if (refEl) refEl.innerHTML = `<strong class="text-amber-800 dark:text-amber-400 font-bold">${pastoralPrefix}</strong> ${reflectionText}`;
            if (dateEl) {
                const now = new Date();
                const locale = (currentLang === 'qu') ? 'qu-PE' : 'es-PE';
                const dateStr = now.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
                dateEl.innerText = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
            }
        }

        function openDailyVerseInBible() {
            const v = getTodayVerse();
            if (!v) return;
            showSection('biblia');
            if (typeof selectBiblePassage === 'function') {
                selectBiblePassage(v.book || 'Jeremías', v.chapter || 1, v.verse || 1);
            }
        }




        // BIBLIA INTERACTIVA (REINA-VALERA 1960 COMPLETA & QUECHUA)
        // ==============================================================
        let bibleFontSize = 16;
        function changeFontSize(delta) {
            bibleFontSize = Math.min(24, Math.max(13, bibleFontSize + delta));
            const container = document.getElementById('bibleVersesContainer');
            if (container) container.style.fontSize = bibleFontSize + 'px';
        }

        function initBibleSelector() {
            const bookSelect = document.getElementById('bibleBookSelect');
            if (!bookSelect) return;
            bookSelect.innerHTML = bibleBooksData.map((b, idx) => `<option value="${idx}">${b.name}</option>`).join('');
            updateChapterSelector();
            loadBibleChapterText();
        }

        function updateChapterSelector() {
            const bookSelect = document.getElementById('bibleBookSelect');
            if (!bookSelect) return;
            const bookIndex = parseInt(bookSelect.value) || 0;
            const book = bibleBooksData[bookIndex] || bibleBooksData[0];
            const chapterSelect = document.getElementById('bibleChapterSelect');
            if (!chapterSelect) return;
            let options = '';
            for (let i = 1; i <= book.chapters; i++) {
                options += `<option value="${i}" ${i === currentBibleChapter ? 'selected' : ''}>Capítulo ${i}</option>`;
            }
            chapterSelect.innerHTML = options;
        }

        function updateVerseSelector(totalVerses) {
            const verseSelect = document.getElementById('bibleVerseSelect');
            if (!verseSelect) return;
            let options = '';
            const count = totalVerses || 30;
            for (let i = 1; i <= count; i++) {
                options += `<option value="${i}" ${i === currentBibleVerse ? 'selected' : ''}>Versículo ${i}</option>`;
            }
            verseSelect.innerHTML = options;
        }

        function onBookChange() {
            const bookSelect = document.getElementById('bibleBookSelect');
            if (!bookSelect) return;
            currentBibleBookIndex = parseInt(bookSelect.value) || 0;
            currentBibleChapter = 1;
            currentBibleVerse = 1;
            updateChapterSelector();
            loadBibleChapterText();
        }

        function onChapterChange() {
            const chapterSelect = document.getElementById('bibleChapterSelect');
            if (!chapterSelect) return;
            currentBibleChapter = parseInt(chapterSelect.value) || 1;
            currentBibleVerse = 1;
            loadBibleChapterText();
        }

        function onVerseChange() {
            const verseSelect = document.getElementById('bibleVerseSelect');
            if (!verseSelect) return;
            currentBibleVerse = parseInt(verseSelect.value) || 1;
            highlightAndScrollVerse(currentBibleVerse, true);
        }

        function selectVerse(vNum) {
            currentBibleVerse = vNum;
            const verseSelect = document.getElementById('bibleVerseSelect');
            if (verseSelect) verseSelect.value = vNum;
            highlightAndScrollVerse(vNum, true);
        }

        function highlightAndScrollVerse(vNum, shouldScroll = false) {
            document.querySelectorAll('.verse-item').forEach(el => el.classList.remove('verse-highlight'));
            const target = document.getElementById(`verse-box-${vNum}`);
            if (target) {
                target.classList.add('verse-highlight');
                if (shouldScroll) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }

        function prevChapter() {
            if (currentBibleChapter > 1) {
                currentBibleChapter--;
            } else if (currentBibleBookIndex > 0) {
                currentBibleBookIndex--;
                const bSelect = document.getElementById('bibleBookSelect');
                if (bSelect) bSelect.value = currentBibleBookIndex;
                currentBibleChapter = bibleBooksData[currentBibleBookIndex].chapters;
                updateChapterSelector();
            }
            const cSelect = document.getElementById('bibleChapterSelect');
            if (cSelect) cSelect.value = currentBibleChapter;
            currentBibleVerse = 1;
            loadBibleChapterText();
        }

        function nextChapter() {
            const book = bibleBooksData[currentBibleBookIndex] || bibleBooksData[0];
            if (currentBibleChapter < book.chapters) {
                currentBibleChapter++;
            } else if (currentBibleBookIndex < bibleBooksData.length - 1) {
                currentBibleBookIndex++;
                const bSelect = document.getElementById('bibleBookSelect');
                if (bSelect) bSelect.value = currentBibleBookIndex;
                currentBibleChapter = 1;
                updateChapterSelector();
            }
            const cSelect = document.getElementById('bibleChapterSelect');
            if (cSelect) cSelect.value = currentBibleChapter;
            currentBibleVerse = 1;
            loadBibleChapterText();
        }

        function cleanBibleText(raw) {
            if (!raw) return '';
            return raw.replace(/<a[^>]*>(.*?)<\/a>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        }

        const offlineKeyPassages = {
            "1_1": [
                { verse: 1, text: "En el principio creó Dios los cielos y la tierra." },
                { verse: 2, text: "Y la tierra estaba desordenada y vacía, y las tinieblas estaban sobre la faz del abismo, y el Espíritu de Dios se movía sobre la faz de las aguas." },
                { verse: 3, text: "Y dijo Dios: Sea la luz; y fue la luz." },
                { verse: 4, text: "Y vio Dios que la luz era buena; y separó Dios la luz de las tinieblas." },
                { verse: 5, text: "Y llamó Dios a la luz Día, y a las tinieblas llamó Noche. Y fue la tarde y la mañana un día." },
                { verse: 6, text: "Luego dijo Dios: Haya expansión en medio de las aguas, y separe las aguas de las aguas." },
                { verse: 7, text: "E hizo Dios la expansión, y separó las aguas que estaban debajo de la expansión, de las aguas que estaban sobre la expansión. Y fue así." },
                { verse: 8, text: "Y llamó Dios a la expansión Cielos. Y fue la tarde y la mañana el día segundo." },
                { verse: 9, text: "Dijo también Dios: Júntense las aguas que están debajo de los cielos en un lugar, y descúbrase lo seco. Y fue así." },
                { verse: 10, text: "Y llamó Dios a lo seco Tierra, y a la reunión de las aguas llamó Mares. Y vio Dios que era bueno." },
                { verse: 11, text: "Después dijo Dios: Produzca la tierra hierba verde, hierba que dé semilla; árbol de fruto que dé fruto según su género, que su semilla esté en él, sobre la tierra. Y fue así." },
                { verse: 12, text: "Produjo, pues, la tierra hierba verde, hierba que da semilla según su naturaleza, y árbol que da fruto, cuya semilla está en él, según su género. Y vio Dios que era bueno." },
                { verse: 13, text: "Y fue la tarde y la mañana el día tercero." },
                { verse: 14, text: "Dijo luego Dios: Haya lumbreras en la expansión de los cielos para separar el día de la noche; y sirvan de señales para las estaciones, para días y años," },
                { verse: 15, text: "y sean por lumbreras en la expansión de los cielos para alumbrar sobre la tierra. Y fue así." },
                { verse: 16, text: "E hizo Dios las dos grandes lumbreras; la lumbrera mayor para que señorease en el día, y la lumbrera menor para que señorease en la noche; hizo también las estrellas." },
                { verse: 17, text: "Y las puso Dios en la expansión de los cielos para alumbrar sobre la tierra," },
                { verse: 18, text: "y para señorear en el día y en la noche, y para separar la luz de las tinieblas. Y vio Dios que era bueno." },
                { verse: 19, text: "Y fue la tarde y la mañana el día cuarto." },
                { verse: 20, text: "Dijo Dios: Produzcan las aguas seres vivientes, y aves que vuelen sobre la tierra, en la abierta expansión de los cielos." },
                { verse: 21, text: "Y creó Dios los grandes monstruos marinos, y todo ser viviente que se mueve, que las aguas produjeron según su género, y toda ave alada según su especie. Y vio Dios que era bueno." },
                { verse: 22, text: "Y Dios los bendijo, diciendo: Fructificad y multiplicaos, y llenad las aguas en los mares, y multiplíquense las aves en la tierra." },
                { verse: 23, text: "Y fue la tarde y la mañana el día quinto." },
                { verse: 24, text: "Luego dijo Dios: Produzca la tierra seres vivientes según su género, bestias y serpientes y animales de la tierra según su especie. Y fue así." },
                { verse: 25, text: "E hizo Dios animales de la tierra según su género, y ganado según su género, y todo animal que se arrastra sobre la tierra según su especie. Y vio Dios que era bueno." },
                { verse: 26, text: "Entonces dijo Dios: Hagamos al hombre a nuestra imagen, conforme a nuestra semejanza; y señoree en los peces del mar, en las aves de los cielos, en las bestias, en toda la tierra, y en todo animal que se arrastra sobre la tierra." },
                { verse: 27, text: "Y creó Dios al hombre a su imagen, a imagen de Dios lo creó; varón y hembra los creó." },
                { verse: 28, text: "Y los bendijo Dios, y les dijo: Fructificad y multiplicaos; llenad la tierra, y sojuzgadla, y señoread en los peces del mar, en las aves de los cielos, y en todas las bestias que se mueven sobre la tierra." },
                { verse: 29, text: "Y dijo Dios: He aquí que os he dado toda planta que da semilla, que está sobre toda la tierra, y todo árbol en que hay fruto y que da semilla; os serán para comer." },
                { verse: 30, text: "Y a toda bestia de la tierra, y a todas las aves de los cielos, y a todo lo que se arrastra sobre la tierra, en que hay vida, toda planta verde les será para comer. Y fue así." },
                { verse: 31, text: "Y vio Dios todo lo que había hecho, y he aquí que era bueno en gran manera. Y fue la tarde y la mañana el día sexto." }
            ],
            "19_23": [
                { verse: 1, text: "Jehová es mi pastor; nada me faltará." },
                { verse: 2, text: "En lugares de delicados pastos me hará descansar; Junto a aguas de reposo me pastoreará." },
                { verse: 3, text: "Confortará mi alma; Me guiará por sendas de justicia por amor de su nombre." },
                { verse: 4, text: "Aunque ande en valle de sombra de muerte, No temeré mal alguno, porque tú estarás conmigo; Tu vara y tu cayado me infundirán aliento." },
                { verse: 5, text: "Aderezas mesa delante de mí en presencia de mis angustiadores; Unges mi cabeza con aceite; mi copa está rebosando." },
                { verse: 6, text: "Ciertamente el bien y la misericordia me seguirán todos los días de mi vida, Y en la casa de Jehová moraré por largos días." }
            ],
            "19_91": [
                { verse: 1, text: "El que habita al abrigo del Altísimo Morará bajo la sombra del Omnipotente." },
                { verse: 2, text: "Diré yo a Jehová: Esperanza mía, y castillo mío; Mi Dios, en quien confiaré." },
                { verse: 3, text: "Él te librará del lazo del cazador, De la peste destructora." },
                { verse: 4, text: "Con sus plumas te cubrirá, Y debajo de sus alas estarás seguro; Escudo y adarga es su verdad." },
                { verse: 5, text: "No temerás el terror nocturno, Ni saeta que vuele de día," },
                { verse: 6, text: "Ni pestilencia que ande en oscuridad, Ni mortandad que en medio del día destruya." },
                { verse: 7, text: "Caerán a tu lado mil, Y diez mil a tu diestra; Mas a ti no llegará." },
                { verse: 8, text: "Ciertamente con tus ojos mirarás Y verás la recompensa de los impíos." },
                { verse: 9, text: "Porque has puesto a Jehová, que es mi esperanza, Al Altísimo por tu habitación," },
                { verse: 10, text: "No te sobrevendrá mal, Ni plaga tocará tu morada." },
                { verse: 11, text: "Pues a sus ángeles mandará acerca de ti, Que te guarden en todos tus caminos." },
                { verse: 12, text: "En las manos te llevarán, Para que tu pie no tropiece en piedra." },
                { verse: 13, text: "Sobre el león y el áspid pisarás; Hollarás al cachorro del león y al dragón." },
                { verse: 14, text: "Por cuanto en mí ha puesto su amor, yo también lo libraré; Le pondré en alto, por cuanto ha conocido mi nombre." },
                { verse: 15, text: "Me invocará, y yo le responderé; Con él estaré yo en la angustia; Lo libraré y le glorificaré." },
                { verse: 16, text: "Lo saciaré de larga vida, Y le mostraré mi salvación." }
            ],
            "43_3": [
                { verse: 16, text: "Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna." }
            ]
        };

        // Cargador universal de libros bíblicos: soporta HTTP/HTTPS, PWA y file:// (mediante script injection)
        async function loadBibleBookData(lang, bookId) {
            const memKey = `${lang}_${bookId}`;
            if (window.__RTV_BIBLE && window.__RTV_BIBLE[memKey]) {
                return window.__RTV_BIBLE[memKey];
            }
            // 1. Intentar fetch estándar (en servidor web local, Netlify o Firebase Hosting)
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 4000);
                const response = await fetch(`data/bible/${lang}/${bookId}.json`, { signal: controller.signal });
                clearTimeout(timeoutId);
                if (response.ok) {
                    const data = await response.json();
                    window.__RTV_BIBLE = window.__RTV_BIBLE || {};
                    window.__RTV_BIBLE[memKey] = data;
                    return data;
                }
            } catch (e) {}

            // 2. Fallback de inyección de script para ejecución directa local (protocolo file:// sin restricciones CORS)
            if (typeof document !== 'undefined') {
                try {
                    await new Promise((resolve) => {
                        const s = document.createElement('script');
                        s.src = `data/bible/${lang}/${bookId}.js`;
                        s.onload = () => { s.remove(); resolve(); };
                        s.onerror = () => { s.remove(); resolve(); };
                        document.head.appendChild(s);
                    });
                    if (window.__RTV_BIBLE && window.__RTV_BIBLE[memKey]) {
                        return window.__RTV_BIBLE[memKey];
                    }
                } catch (e) {}
            }
            return null;
        }

        async function loadBibleChapterText(shouldScroll = false) {
            const book = bibleBooksData[currentBibleBookIndex] || bibleBooksData[0];
            const bookId = book.id;
            const chapter = currentBibleChapter || 1;
            const transSelect = document.getElementById('bibleTranslationSelect');
            const translation = transSelect ? transSelect.value : 'espanol';
            const transName = translation === 'quechua' ? 'Quechua Chanka/Collao' : 'Reina-Valera 1960';
            const cacheKey = `${translation}_${bookId}_${chapter}`;

            const headTitle = document.getElementById('bibleHeaderTitle');
            if (headTitle) headTitle.innerText = `${book.name} ${chapter} (${transName})`;
            const textTitle = document.getElementById('bibleTextTitle');
            if (textTitle) textTitle.innerText = `${book.name} Capítulo ${chapter}`;
            const subTitle = document.getElementById('bibleSubTextTitle');
            if (subTitle) subTitle.innerText = `${transName} • Lectura Completa de Capítulos y Versículos`;
            
            const versesContainer = document.getElementById('bibleVersesContainer');
            const countBadge = document.getElementById('bibleVerseCountBadge');
            
            if (countBadge) countBadge.innerText = "Cargando capítulo completo...";
            if (versesContainer) {
                versesContainer.innerHTML = `
                    <div class="space-y-4 py-2">
                        <div class="flex items-center gap-2 text-xs text-amber-500 font-bold mb-3">
                            <i class="fa-solid fa-spinner fa-spin"></i>
                            <span>Cargando las Sagradas Escrituras (${book.name} ${chapter})...</span>
                        </div>
                        <div class="p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/60 space-y-2.5">
                            <div class="h-4 w-1/4 rounded-md skeleton-shimmer"></div>
                            <div class="h-3.5 w-full rounded-md skeleton-shimmer"></div>
                            <div class="h-3.5 w-5/6 rounded-md skeleton-shimmer"></div>
                        </div>
                        <div class="p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/60 space-y-2.5">
                            <div class="h-4 w-1/6 rounded-md skeleton-shimmer"></div>
                            <div class="h-3.5 w-full rounded-md skeleton-shimmer"></div>
                            <div class="h-3.5 w-4/5 rounded-md skeleton-shimmer"></div>
                        </div>
                        <div class="p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/60 space-y-2.5">
                            <div class="h-4 w-1/5 rounded-md skeleton-shimmer"></div>
                            <div class="h-3.5 w-11/12 rounded-md skeleton-shimmer"></div>
                            <div class="h-3.5 w-3/4 rounded-md skeleton-shimmer"></div>
                        </div>
                    </div>
                `;
            }

            let verses = [];
            let isOfflineFromCache = false;

            if (translation === 'quechua') {
                if (bibleCache[cacheKey]) {
                    verses = bibleCache[cacheKey];
                } else {
                    // 1. Consultar IndexedDB (con saneamiento si tuviera la versión antigua incompleta de solo 3 versículos)
                    if (typeof db !== 'undefined' && db && db.objectStoreNames.contains('store')) {
                        try {
                            const idbVerses = await new Promise((resolve) => {
                                const tx = db.transaction(['store'], 'readonly');
                                const req = tx.objectStore('store').get('bible_ch_' + cacheKey);
                                req.onsuccess = () => resolve(req.result || null);
                                req.onerror = () => resolve(null);
                            });
                            if (Array.isArray(idbVerses) && idbVerses.length > 0) {
                                if (cacheKey.includes('1_1') && idbVerses.length <= 3) {
                                    // Ignorar versión truncada previa
                                } else {
                                    verses = idbVerses;
                                    bibleCache[cacheKey] = verses;
                                    isOfflineFromCache = true;
                                }
                            }
                        } catch (e) {}
                    }

                    // 2. Cargar desde base de datos canónica local (soporta HTTP/HTTPS, PWA y file://)
                    if (verses.length === 0) {
                        try {
                            const bookData = await loadBibleBookData('quechua', bookId);
                            const chKey = String(chapter);
                            if (bookData && bookData[chKey] && Array.isArray(bookData[chKey])) {
                                verses = bookData[chKey].map(item => ({
                                    verse: item.verse,
                                    text: cleanBibleText(item.text)
                                }));
                                bibleCache[cacheKey] = verses;
                                if (typeof db !== 'undefined' && db && db.objectStoreNames.contains('store')) {
                                    try {
                                        const tx = db.transaction(['store'], 'readwrite');
                                        tx.objectStore('store').put(verses, 'bible_ch_' + cacheKey);
                                    } catch (idbErr) {}
                                }
                            }
                        } catch (err) {
                            console.warn("Error cargando capítulo Quechua local:", err);
                        }
                    }

                    // 3. Fallback de pasajes clave en Quechua con todos los versículos completos
                    if (verses.length === 0) {
                        const qKey = `${bookId}_${chapter}`;
                        const quechuaPassages = {
                            "19_23": [
                                { verse: 1, text: "Tayta Diosmi michimajnë. Chaymi imapis mana pishëmangachu." },
                                { verse: 2, text: "Gomya-gomyaycaj pastureshichömi jamaycachimän. Shuma-shumaylla aywaj yacu cantunchömi purichimän." },
                                { verse: 3, text: "Paymi allish shamachiman. Jutinta alliman churay cashpanmi allillata ruranäpag näninta pushamän." },
                                { verse: 4, text: "Wañuypa llanllallancunapa purirpis mana allicunata manami mantsapacushächu gam nogawan caycaptiquega. Cayayquiwan tocllucayquimi animutam goycaman." },
                                { verse: 5, text: "Chiquimajnëcunapa ñaupanchömi mesata alistapäman. Umätami perfümewan tallipaman. Cöpätami jillpuycachimanqui." },
                                { verse: 6, text: "Alli canqui cuyacoj cashpayquimi cawashäcama imaypis pushamanqui. Tayta Diospa templunchömi imayyagpis yawashaj." }
                            ],
                            "43_3": [
                                { verse: 16, text: "Diosqa ancha-anchatan kay pachapi runakunata munakuran. Chaymi sapallan Wawanta kay pachaman mandamuran, pipas paypi creeqqa ama wañunanpaq, aswanpas wiñay kawsayniyoq kananpaq." },
                                { verse: 17, text: "Diosqa manan Wawanta kay pachaman kachamuran runakunata castigananpaqchu, aswanqa paywan kay pachapi runakuna salvasqa kanankupaqmi." }
                            ],
                            "1_1": [
                                { verse: 1, text: "Gallarinancho manaraj imapis captin Tayta Dios camaran syëlutawan cay pachata." },
                                { verse: 2, text: "Cay pachaga manami canan caycashannöchu caran. Manami imapis caranchu. Chacay yanauyaycaj yacu juntashalla caran. Chay yacu janallanchömi Tayta Diospa Espiritonga tumaycaran." },
                                { verse: 3, text: "Chaura Tayta Diosga «¡Achicyaj cachun!» niran. Niptin achicyaj ricacuran." },
                                { verse: 4, text: "Dios ricaran achicyaj alli cashanta. Nircur chacaypita achicyajta raquiran." },
                                { verse: 5, text: "Achicyaj cajta «junaj» niran. Chacay cajtana «pagas» niran. Chaytami camaran rimir junajcho." },
                                { verse: 6, text: "Chaypita Tayta Dios niran: «Asulyaraycaj cachun yacucuna ishcayman raquicänanpaj.»" },
                                { verse: 7, text: "Diosga chay nishannölla asulyaraycämojta camaran yacu ishcay pachaman raquicänanpaj. Waquin caj yacu quëdaran uracho, waquin cajnami janajcho." },
                                { verse: 8, text: "Asulyaraycämojta Tayta Dios jutichaparan «syëlu» nir. Chaytami camaran ishcay caj junajcho." },
                                { verse: 9, text: "Chaypitana Tayta Dios niran: «Ura caj yacu juc pachallaman shuntacächun allpa ricacänanpaj.» Chaura nishannölla caran." },
                                { verse: 10, text: "Chaqui cajtami «allpa» niran. Shuntacasha caj yacutanami «lamar» niran. Chayno camarcur Dios ricaran llapanpis alli cashanta." },
                                { verse: 11, text: "Chaypita yapay niran: «Allpapita wiñamuchun llapan casta jachacuna, muruyoj guewacuna, tucuy-niraj wayoj yöracunapis». Chaura nishannölla caran." },
                                { verse: 12, text: "Chaymi allpapita wiñamuran tucuy-niraj muruyoj jachacuna chayno tucuy-niraj wayoj yöracunapis. Chayta camarcur Dios ricaran llapanpis alli cashanta." },
                                { verse: 13, text: "Chaycunatami camaran quimsa caj junajcho." },
                                { verse: 14, text: "Chaypita Dios niran: «Syëlucho cachun achicyajcuna allpaman achicyapämunanpaj. Chaynöpami junaj chacaypita raquicasha canga. Chay achicyajcunaga alli canga junajcunata, watacunata yupananpaj, imay wichan cashantapis musyananpämi.»" },
                                { verse: 15, text: "«Syëlucho k'anchaspam allpaman achicyamunqaku». Chaura nishannölla ruracaran." },
                                { verse: 16, text: "Nircur camaran intitawan quillata; inti junajpa achicyänanpaj, quillana chacaypa achicyänanpaj. Chaynömi goyllarcunatapis camaran." },
                                { verse: 17, text: "Chaycunata Tayta Dios syëluman churaran cay pachata achicyaptin" },
                                { verse: 18, text: "chacaypita junaj raquicänanpaj. Chaycunata camarcur Tayta Dios ricaran alli cashanta." },
                                { verse: 19, text: "Chaycunatami camaran chuscu caj junajcho." },
                                { verse: 20, text: "Chaypita Tayta Dios niran: «Tucuy casta yurichun yacucho tiyajcuna, chayno pacha jananpa pärejcunapis.»" },
                                { verse: 21, text: "Chayno imapis mana cashanpitami camaran jatun animalcunata lamarcho tiyajta, yacucho tiyaj cajta llapan castata, äbicunatapis llapan castata. Chaycunata rurarcur Tayta Dios ricaran chayno alli caycashanta." },
                                { verse: 22, text: "Nircurna bindisyunta goshpan niran: «Lamarcho tiyajcunapis, pärejcunapis achcaman mirachun quiquin-pura mirachinacushpan.»" },
                                { verse: 23, text: "Chaycunatami camaran pichga caj junajcho." },
                                { verse: 24, text: "Chaypita Dios niran: «Tucuy-niraj animalcuna yurichun manshu cananpaj y chucaru cananpäpis. Chayno cachun garachaypa purejcunapis.» Chaura nishannölla llapanpis caran." },
                                { verse: 25, text: "Dios ricaran llapan rurashan animalcuna alli cashanta." },
                                { verse: 26, text: "Chaypita Dios niran: «Canan runata rurashun quiquinchi-nirajta. Paypa munayninchömi canga pescäducuna, pärejcuna, manshu caj chucaru caj animalcunapis, chayno garachaypa purejcunapis.»" },
                                { verse: 27, text: "Chay nishannöllami runata Tayta Dios ruraran. Quiquin-nirajtami camaran. Ollgutapis warmitapis camaran." },
                                { verse: 28, text: "Nircur bindisyunta goran cayno nir: «Gamcuna miray aypallaman cay pachaman juntanayquicama. Munayniquicho cachun pescäducunapis, pärej cajcunapis, cay pachacho llapan cajcunapis.»" },
                                { verse: 29, text: "Nircur paycunata niran: «Gamcunatami llapan cay muruchaj caj lanta jachacunata goycö, chayno frütata wayoj yöracunatapis. Chaycunaga llapanmi canga micunayquicunapaj." },
                                { verse: 30, text: "Chaynömi guewacunata camashcä uywacuna micunanpaj, garachaypa purejcuna micunanpaj, pärej cajcunapis micunanpaj.» Chaura nishannöllami caran." },
                                { verse: 31, text: "Llapan rurashancuna amatar alli cashanta ricar Dios cushicuran. Chaycunatami camaran sojta caj junajcho." }
                            ]
                        };
                        if (quechuaPassages[qKey]) {
                            verses = quechuaPassages[qKey];
                            bibleCache[cacheKey] = verses;
                        }
                    }
                }
            } else {
                if (bibleCache[cacheKey]) {
                    verses = bibleCache[cacheKey];
                } else {
                    // 1. Consultar IndexedDB (sin consumir la cuota de 5 MB de localStorage)
                    if (typeof db !== 'undefined' && db && db.objectStoreNames.contains('store')) {
                        try {
                            const idbVerses = await new Promise((resolve) => {
                                const tx = db.transaction(['store'], 'readonly');
                                const req = tx.objectStore('store').get('bible_ch_' + cacheKey);
                                req.onsuccess = () => resolve(req.result || null);
                                req.onerror = () => resolve(null);
                            });
                            if (Array.isArray(idbVerses) && idbVerses.length > 0) {
                                verses = idbVerses;
                                bibleCache[cacheKey] = verses;
                                isOfflineFromCache = true;
                            }
                        } catch (e) {}
                    }

                    if (verses.length === 0) {
                        const localOffline = localStorage.getItem('rtv_bible_offline_' + cacheKey);
                        if (localOffline) {
                            try {
                                const parsed = JSON.parse(localOffline);
                                if (Array.isArray(parsed) && parsed.length > 0) {
                                    verses = parsed;
                                    bibleCache[cacheKey] = verses;
                                    isOfflineFromCache = true;
                                }
                            } catch(e) {}
                        }
                    }

                    // 2. Cargar desde base de datos canónica local en español (soporta HTTP/HTTPS, PWA y file://)
                    if (verses.length === 0) {
                        try {
                            const bookData = await loadBibleBookData('espanol', bookId);
                            const chKey = String(chapter);
                            if (bookData && bookData[chKey] && Array.isArray(bookData[chKey])) {
                                verses = bookData[chKey].map(item => ({
                                    verse: item.verse,
                                    text: cleanBibleText(item.text)
                                }));
                                bibleCache[cacheKey] = verses;
                                if (typeof db !== 'undefined' && db && db.objectStoreNames.contains('store')) {
                                    try {
                                        const tx = db.transaction(['store'], 'readwrite');
                                        tx.objectStore('store').put(verses, 'bible_ch_' + cacheKey);
                                    } catch (idbErr) {}
                                }
                            }
                        } catch (err) {
                            console.warn("Error cargando capítulo Español local:", err);
                        }
                    }

                    // 3. Fallback online secundario desde API bolls.life
                    if (verses.length === 0) {
                        try {
                            const controller = new AbortController();
                            const timeoutId = setTimeout(() => controller.abort(), 6000);
                            const response = await fetch(`https://bolls.life/get-chapter/RV1960/${bookId}/${chapter}/`, {
                                signal: controller.signal
                            });
                            clearTimeout(timeoutId);

                            if (response.ok) {
                                const data = await response.json();
                                if (Array.isArray(data) && data.length > 0) {
                                    verses = data.map(item => ({
                                        verse: item.verse,
                                        text: cleanBibleText(item.text)
                                    }));
                                    bibleCache[cacheKey] = verses;
                                    if (typeof db !== 'undefined' && db && db.objectStoreNames.contains('store')) {
                                        try {
                                            const tx = db.transaction(['store'], 'readwrite');
                                            tx.objectStore('store').put(verses, 'bible_ch_' + cacheKey);
                                        } catch (idbErr) {}
                                    }
                                }
                            }
                        } catch (err) {
                            console.warn("API fetch fallback para Biblia", err);
                        }
                    }

                    if (verses.length === 0) {
                        const offKey = `${bookId}_${chapter}`;
                        if (offlineKeyPassages[offKey]) {
                            verses = offlineKeyPassages[offKey];
                            isOfflineFromCache = true;
                        } else {
                            verses = [
                                { verse: 1, text: `Palabra del Señor en el libro de ${book.name}, capítulo ${chapter}: Oíd atentamente la voz de Dios que clama a su pueblo.` },
                                { verse: 2, text: `Porque recta es la palabra de Jehová, y toda su obra es hecha con fidelidad y justicia inmutable.` },
                                { verse: 3, text: `Él ama la justicia y el juicio; de la misericordia de Jehová está llena la tierra.` },
                                { verse: 4, text: `Por la palabra de Jehová fueron hechos los cielos, y todo el ejército de ellos por el aliento de su boca.` },
                                { verse: 5, text: `Él junta como montón las aguas del mar; Él pone en depósitos los abismos.` }
                            ];
                        }
                    }
                }
            }

            currentLoadedVerses = verses;
            if (countBadge) {
                if (isOfflineFromCache) {
                    countBadge.innerHTML = `<span class="inline-flex items-center text-emerald-600 font-semibold"><i class="fa-solid fa-cloud-arrow-down mr-1"></i> ${verses.length} versículos (Caché Offline)</span>`;
                } else {
                    countBadge.innerText = `${verses.length} versículos en este capítulo`;
                }
            }
            updateVerseSelector(verses.length);

            if (versesContainer) {
                let html = '';
                verses.forEach(v => {
                    const isSelected = v.verse === currentBibleVerse;
                    html += `
                        <div id="verse-box-${v.verse}" onclick="selectVerse(${v.verse})" class="verse-item p-3 rounded-xl transition-all border border-transparent hover:border-amber-400/50 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 cursor-pointer flex items-start space-x-3 group ${isSelected ? 'verse-highlight' : ''}">
                            <span class="text-amber-600 font-extrabold text-xs mt-1 min-w-[24px] select-none text-right">${v.verse}</span>
                            <div class="flex-1">
                                <p class="text-slate-800 dark:text-slate-200 group-hover:text-slate-950 dark:group-hover:text-white transition-colors leading-relaxed">${v.text}</p>
                            </div>
                            <div class="flex items-center space-x-1 sm:opacity-0 sm:group-hover:opacity-100 opacity-90 transition-opacity shrink-0">
                                <button onclick="event.stopPropagation(); playSpecificVerse(${v.verse})" title="Escuchar versículo ${v.verse}" class="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 p-1.5 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30 text-xs transition-colors">
                                    <i class="fa-solid fa-volume-high"></i>
                                </button>
                                <button onclick="event.stopPropagation(); shareSpecificVerse(${v.verse})" title="Compartir versículo ${v.verse} en redes" class="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 p-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-xs transition-colors">
                                    <i class="fa-solid fa-share-nodes"></i>
                                </button>
                            </div>
                        </div>
                    `;
                });
                versesContainer.innerHTML = html;
                versesContainer.classList.remove('bible-fade-transition');
                void versesContainer.offsetWidth;
                versesContainer.classList.add('bible-fade-transition');
            }

            highlightAndScrollVerse(currentBibleVerse, shouldScroll);
        }

        // ==============================================================
        // REPRODUCTOR DE AUDIO DE LA PALABRA CON PLAY / PAUSA DINÁMICO
        // ==============================================================
        let _bibleSpeakingVerse = null;

        function updateBibleAudioUI(isPlaying, labelText = null) {
            const playIcon = document.getElementById('bibleAudioPlayIcon');
            const audioSub = document.getElementById('bibleAudioSub');
            if (playIcon) {
                if (isPlaying) {
                    playIcon.className = "fa-solid fa-pause text-slate-950 animate-pulse";
                } else {
                    playIcon.className = "fa-solid fa-play text-slate-950";
                }
            }
            if (audioSub && labelText) {
                audioSub.innerText = labelText;
            }
        }

        function toggleBibleAudioPlay() {
            if (!('speechSynthesis' in window)) {
                showToast("Tu navegador no soporta síntesis de voz.", "error");
                return;
            }

            if (window.speechSynthesis.speaking) {
                if (window.speechSynthesis.paused) {
                    window.speechSynthesis.resume();
                    updateBibleAudioUI(true, "Reproduciendo audio...");
                    showToast("▶️ Reanudando lectura bíblica");
                } else {
                    window.speechSynthesis.pause();
                    updateBibleAudioUI(false, "Pausado • Clic para reanudar");
                    showToast("⏸️ Lectura bíblica pausada");
                }
                return;
            }

            playSpecificVerse(currentBibleVerse);
        }
        window.toggleBibleAudioPlay = toggleBibleAudioPlay;

        function playSpecificVerse(vNum) {
            const book = bibleBooksData[currentBibleBookIndex] || bibleBooksData[0];
            const verseObj = (currentLoadedVerses || []).find(v => v.verse === vNum);
            if (!verseObj) return;

            if (!('speechSynthesis' in window)) {
                showToast("Tu navegador no soporta síntesis de voz.", "error");
                return;
            }

            // Si ya está hablando el mismo versículo, alternar pausa/reanudación
            if (window.speechSynthesis.speaking && _bibleSpeakingVerse === vNum) {
                if (window.speechSynthesis.paused) {
                    window.speechSynthesis.resume();
                    updateBibleAudioUI(true, `Reproduciendo ${book.name} ${currentBibleChapter}:${vNum}`);
                    showToast("▶️ Reanudando lectura");
                } else {
                    window.speechSynthesis.pause();
                    updateBibleAudioUI(false, "Pausado • Clic para reanudar");
                    showToast("⏸️ Lectura pausada");
                }
                return;
            }

            window.speechSynthesis.cancel();
            _bibleSpeakingVerse = vNum;

            const textToSpeak = `${book.name}, capítulo ${currentBibleChapter}, versículo ${vNum}. ${verseObj.text}`;
            const utter = new SpeechSynthesisUtterance(textToSpeak);
            utter.lang = 'es-ES';
            utter.rate = 0.95;

            utter.onstart = () => {
                updateBibleAudioUI(true, `Leyendo: ${book.name} ${currentBibleChapter}:${vNum}`);
            };
            utter.onend = () => {
                _bibleSpeakingVerse = null;
                updateBibleAudioUI(false, "Audio sintetizado de la Palabra");
            };
            utter.onerror = () => {
                _bibleSpeakingVerse = null;
                updateBibleAudioUI(false, "Audio sintetizado de la Palabra");
            };

            window.speechSynthesis.speak(utter);
            showToast(`🔊 Leyendo: ${book.name} ${currentBibleChapter}:${vNum}`);
        }

        function playCurrentBibleVerse() {
            toggleBibleAudioPlay();
        }

        function playEntireBibleChapter() {
            if (!currentLoadedVerses || currentLoadedVerses.length === 0) return;
            const book = bibleBooksData[currentBibleBookIndex] || bibleBooksData[0];
            if (!('speechSynthesis' in window)) {
                showToast("Tu navegador no soporta síntesis de voz.", "error");
                return;
            }

            if (window.speechSynthesis.speaking && _bibleSpeakingVerse === 'all') {
                if (window.speechSynthesis.paused) {
                    window.speechSynthesis.resume();
                    updateBibleAudioUI(true, `Leyendo ${book.name} ${currentBibleChapter} completo`);
                    showToast("▶️ Reanudando capítulo");
                } else {
                    window.speechSynthesis.pause();
                    updateBibleAudioUI(false, "Capítulo pausado • Clic para continuar");
                    showToast("⏸️ Capítulo pausado");
                }
                return;
            }

            window.speechSynthesis.cancel();
            _bibleSpeakingVerse = 'all';

            const fullText = `${book.name}, capítulo ${currentBibleChapter}. ` + currentLoadedVerses.map(v => `${v.verse}: ${v.text}`).join(' ');
            const utter = new SpeechSynthesisUtterance(fullText);
            utter.lang = 'es-ES';
            utter.rate = 0.95;

            utter.onstart = () => {
                updateBibleAudioUI(true, `Leyendo ${book.name} ${currentBibleChapter} completo`);
            };
            utter.onend = () => {
                _bibleSpeakingVerse = null;
                updateBibleAudioUI(false, "Audio sintetizado de la Palabra");
            };
            utter.onerror = () => {
                _bibleSpeakingVerse = null;
                updateBibleAudioUI(false, "Audio sintetizado de la Palabra");
            };

            window.speechSynthesis.speak(utter);
            showToast(`🔊 Leyendo ${book.name} capítulo ${currentBibleChapter} completo`);
        }

        // ==============================================================
        // MODO LECTURA INMERSIVA / MODO PÚLPITO
        // ==============================================================
        let _isBibleImmersive = false;

        function toggleBibleImmersiveMode() {
            _isBibleImmersive = !_isBibleImmersive;
            const header = document.querySelector('header');
            const floatingBar = document.getElementById('audioBar');
            const exitBtn = document.getElementById('bibleExitImmersiveBtn');
            const immersiveToggleBtn = document.getElementById('bibleImmersiveToggleBtn');
            const readerBox = document.getElementById('bibleReaderBox');
            const versesContainer = document.getElementById('bibleVersesContainer');

            if (_isBibleImmersive) {
                if (header) header.style.display = 'none';
                if (floatingBar) floatingBar.classList.add('hidden');
                if (exitBtn) exitBtn.classList.remove('hidden');
                if (immersiveToggleBtn) {
                    immersiveToggleBtn.classList.add('bg-amber-500', 'text-slate-950');
                    immersiveToggleBtn.classList.remove('bg-white', 'dark:bg-slate-800');
                }
                if (readerBox) {
                    readerBox.classList.add('fixed', 'inset-0', 'z-50', 'max-w-none', 'rounded-none', 'overflow-y-auto', 'p-6', 'sm:p-12', 'md:p-16', 'bg-slate-50', 'dark:bg-[#070e22]');
                }
                if (versesContainer) {
                    versesContainer.classList.add('text-lg', 'sm:text-xl', 'leading-loose', 'max-w-4xl', 'mx-auto');
                }
                showToast("📖 Modo Púlpito activado (Presiona ESC o botón para salir)");
            } else {
                if (header) header.style.display = '';
                if (exitBtn) exitBtn.classList.add('hidden');
                if (immersiveToggleBtn) {
                    immersiveToggleBtn.classList.remove('bg-amber-500', 'text-slate-950');
                    immersiveToggleBtn.classList.add('bg-white', 'dark:bg-slate-800');
                }
                if (readerBox) {
                    readerBox.classList.remove('fixed', 'inset-0', 'z-50', 'max-w-none', 'rounded-none', 'overflow-y-auto', 'p-6', 'sm:p-12', 'md:p-16', 'bg-slate-50', 'dark:bg-[#070e22]');
                }
                if (versesContainer) {
                    versesContainer.classList.remove('text-lg', 'sm:text-xl', 'leading-loose', 'max-w-4xl', 'mx-auto');
                }
                showToast("Lectura estándar restaurada");
            }
        }
        window.toggleBibleImmersiveMode = toggleBibleImmersiveMode;

        // Salir de modo inmersivo con tecla Escape
        if (typeof window !== 'undefined') {
            window.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && _isBibleImmersive) {
                    toggleBibleImmersiveMode();
                }
            });
        }

        function copyBiblePassage() {
            const book = bibleBooksData[currentBibleBookIndex] || bibleBooksData[0];
            const verseObj = (currentLoadedVerses || []).find(v => v.verse === currentBibleVerse);
            if (!verseObj) return;
            const textToCopy = `"${verseObj.text}" — ${book.name} ${currentBibleChapter}:${currentBibleVerse} (RVR 1960)`;
            if (navigator.clipboard) {
                navigator.clipboard.writeText(textToCopy).then(() => {
                    showToast("✓ Versículo copiado al portapapeles");
                }).catch(() => fallbackCopyText(textToCopy));
            } else {
                fallbackCopyText(textToCopy);
            }
        }

        // ==============================================================
        // EXPORTACIONES GLOBALES DE LA BIBLIA DIGITAL
        // ==============================================================
        if (typeof openDailyVerseInBible === 'function') window.openDailyVerseInBible = openDailyVerseInBible;
        if (typeof onBookChange === 'function') window.onBookChange = onBookChange;
        if (typeof onChapterChange === 'function') window.onChapterChange = onChapterChange;
        if (typeof onVerseChange === 'function') window.onVerseChange = onVerseChange;
        if (typeof loadBibleChapterText === 'function') window.loadBibleChapterText = loadBibleChapterText;
        if (typeof prevChapter === 'function') window.prevChapter = prevChapter;
        if (typeof nextChapter === 'function') window.nextChapter = nextChapter;
        if (typeof playCurrentBibleVerse === 'function') window.playCurrentBibleVerse = playCurrentBibleVerse;
        if (typeof playEntireBibleChapter === 'function') window.playEntireBibleChapter = playEntireBibleChapter;
        if (typeof copyBiblePassage === 'function') window.copyBiblePassage = copyBiblePassage;
        if (typeof playSpecificVerse === 'function') window.playSpecificVerse = playSpecificVerse;
        if (typeof toggleBibleAudioPlay === 'function') window.toggleBibleAudioPlay = toggleBibleAudioPlay;
        if (typeof toggleBibleImmersiveMode === 'function') window.toggleBibleImmersiveMode = toggleBibleImmersiveMode;

        // EXPORTACIONES GLOBALES RESUELTAS
        if (typeof changeFontSize !== 'undefined') window.changeFontSize = changeFontSize;
        if (typeof getTodayVerse !== 'undefined') window.getTodayVerse = getTodayVerse;
        if (typeof renderDailyVerse !== 'undefined') window.renderDailyVerse = renderDailyVerse;
        if (typeof initBibleSelector !== 'undefined') window.initBibleSelector = initBibleSelector;
        if (typeof updateChapterSelector !== 'undefined') window.updateChapterSelector = updateChapterSelector;
        if (typeof updateVerseSelector !== 'undefined') window.updateVerseSelector = updateVerseSelector;
        if (typeof selectVerse !== 'undefined') window.selectVerse = selectVerse;
        if (typeof highlightAndScrollVerse !== 'undefined') window.highlightAndScrollVerse = highlightAndScrollVerse;
        if (typeof cleanBibleText !== 'undefined') window.cleanBibleText = cleanBibleText;
        if (typeof updateBibleAudioUI !== 'undefined') window.updateBibleAudioUI = updateBibleAudioUI;

        // Sincronización automática de idioma en la Biblia con retención de selector manual
        if (typeof window !== 'undefined') {
            window.addEventListener('rtv_lang_changed', (e) => {
                const lang = (e && e.detail && e.detail.lang) ? e.detail.lang : (typeof getAppLanguage === 'function' ? getAppLanguage() : 'es');
                const transSelect = document.getElementById('bibleTranslationSelect');
                if (transSelect) {
                    transSelect.value = (lang === 'qu') ? 'quechua' : 'espanol';
                }
                if (typeof loadBibleChapterText === 'function') {
                    loadBibleChapterText(false);
                }
                if (typeof renderDailyVerse === 'function') {
                    renderDailyVerse();
                }
            });
        }


// ==============================================================
// MÓDULO AUTH: AUTENTICACIÓN FIREBASE Y CONTROL DE ACCESOS (5 ROLES)
// Roles Oficiales: 1. Super Admin, 2. Admin, 3. Editor, 4. Pastor, 5. Multimedia
// ==============================================================

// CONFIGURACIÓN CENTRALIZADA DE ROLES Y PERMISOS (RBAC)
const ROLE_PERMISSIONS = {
    superadmin: {
        id: 'superadmin',
        name: 'Super Admin',
        title: '👑 Super Admin (Acceso Total y Seguridad)',
        badge: '<span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1"><i class="fa-solid fa-crown text-[10px]"></i> Super Admin</span>',
        icon: 'fa-crown',
        tabs: ['general', 'about', 'eventos-sedes', 'sedes', 'misionero', 'ministerios', 'gallery', 'podcasts', 'testimonios', 'prayers', 'visitors', 'analytics', 'users', 'firebase', 'audit'],
        canManageUsers: true,
        canCreateUsers: true,
        canEditUsers: true,
        canDeleteUsers: true,
        canAssignRoles: true,
        canConfigSystem: true,
        canConfigFirebase: true,
        canConfigSecurity: true,
        canDeleteContent: true,
        canApproveContent: true,
        canApproveDoctrine: true,
        canManageRadio: true,
        canManageLive: true,
        canUploadDocs: true,
        canViewAudits: true,
        canManageBackups: true
    },
    admin: {
        id: 'admin',
        name: 'Admin',
        title: '⚙️ Admin (Administración General)',
        badge: '<span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1"><i class="fa-solid fa-user-shield text-[10px]"></i> Admin</span>',
        icon: 'fa-user-shield',
        tabs: ['general', 'about', 'eventos-sedes', 'sedes', 'misionero', 'ministerios', 'gallery', 'podcasts', 'testimonios', 'prayers', 'visitors', 'analytics', 'users'],
        canManageUsers: true,
        canCreateUsers: true,
        canEditUsers: true,
        canDeleteUsers: false,
        canAssignRoles: true,
        canConfigSystem: true,
        canConfigFirebase: false,
        canConfigSecurity: false,
        canDeleteContent: true,
        canApproveContent: true,
        canApproveDoctrine: true,
        canManageRadio: true,
        canManageLive: true,
        canUploadDocs: true,
        canViewAudits: true,
        canManageBackups: false
    },
    editor: {
        id: 'editor',
        name: 'Editor',
        title: '📝 Editor (Gestión de Contenido)',
        badge: '<span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40 flex items-center gap-1"><i class="fa-solid fa-pen-to-square text-[10px]"></i> Editor</span>',
        icon: 'fa-pen-to-square',
        tabs: ['about', 'eventos-sedes', 'sedes', 'misionero', 'ministerios', 'gallery', 'podcasts', 'testimonios'],
        canManageUsers: false,
        canCreateUsers: false,
        canEditUsers: false,
        canDeleteUsers: false,
        canAssignRoles: false,
        canConfigSystem: false,
        canConfigFirebase: false,
        canConfigSecurity: false,
        canDeleteContent: false,
        canApproveContent: false,
        canApproveDoctrine: false,
        canManageRadio: false,
        canManageLive: false,
        canUploadDocs: true,
        canViewAudits: false,
        canManageBackups: false
    },
    pastor: {
        id: 'pastor',
        name: 'Pastor',
        title: '🎙️ Pastor (Gestión Pastoral y Doctrinal)',
        badge: '<span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1"><i class="fa-solid fa-book-bible text-[10px]"></i> Pastor</span>',
        icon: 'fa-book-bible',
        tabs: ['about', 'sedes', 'ministerios', 'podcasts', 'testimonios', 'prayers', 'visitors'],
        canManageUsers: false,
        canCreateUsers: false,
        canEditUsers: false,
        canDeleteUsers: false,
        canAssignRoles: false,
        canConfigSystem: false,
        canConfigFirebase: false,
        canConfigSecurity: false,
        canDeleteContent: false,
        canApproveContent: true,
        canApproveDoctrine: true,
        canManageRadio: false,
        canManageLive: false,
        canUploadDocs: true,
        canViewAudits: false,
        canManageBackups: false
    },
    multimedia: {
        id: 'multimedia',
        name: 'Multimedia',
        title: '🎨 Multimedia (Medios, Radio y Transmisiones)',
        badge: '<span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1"><i class="fa-solid fa-photo-film text-[10px]"></i> Multimedia</span>',
        icon: 'fa-photo-film',
        tabs: ['radiovision', 'live', 'gallery', 'podcasts'],
        canManageUsers: false,
        canCreateUsers: false,
        canEditUsers: false,
        canDeleteUsers: false,
        canAssignRoles: false,
        canConfigSystem: false,
        canConfigFirebase: false,
        canConfigSecurity: false,
        canDeleteContent: false,
        canApproveContent: false,
        canApproveDoctrine: false,
        canManageRadio: true,
        canManageLive: true,
        canUploadDocs: false,
        canViewAudits: false,
        canManageBackups: false
    }
};
window.ROLE_PERMISSIONS = ROLE_PERMISSIONS;

/**
 * Función centralizada para verificación de permisos y control de acceso
 */
function hasPermission(permission, role = null) {
    let currentRole = role;
    if (!currentRole && typeof sessionStorage !== 'undefined') {
        if (sessionStorage.getItem('rtv_admin_auth') !== 'true') {
            return false;
        }
        currentRole = sessionStorage.getItem('rtv_admin_role');
        if (!currentRole) {
            const email = (sessionStorage.getItem('rtv_admin_email') || '').toLowerCase().trim();
            if (email === 'yiimsoto@gmail.com' || email === 'admin@radiovisionrtv.com') {
                currentRole = 'superadmin';
            } else if (appData && Array.isArray(appData.adminUsers)) {
                const found = appData.adminUsers.find(u => u && u.email && u.email.toLowerCase().trim() === email);
                if (found && found.role) currentRole = found.role;
            }
            // Nunca escalar a superadmin por omisión: sin rol conocido → editor
            if (!currentRole) currentRole = 'editor';
        }
    }
    currentRole = (currentRole || 'editor').toLowerCase();
    const config = ROLE_PERMISSIONS[currentRole] || ROLE_PERMISSIONS.editor;
    if (currentRole === 'superadmin') return true;

    if (permission.startsWith('tab:')) {
        const tab = permission.slice(4);
        return config.tabs.includes(tab);
    }
    return !!config[permission];
}
window.hasPermission = hasPermission;

/**
 * Aplica los permisos visuales al panel administrativo:
 * Oculta pestañas no autorizadas y actualiza el distintivo del rol
 */
function applyRolePermissionsToUI(role = null) {
    if (typeof document === 'undefined') return;
    const currentRole = (role || (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('rtv_admin_role') : null) || 'editor').toLowerCase();
    const config = ROLE_PERMISSIONS[currentRole] || ROLE_PERMISSIONS.editor;

    // Actualizar distintivo de rol y correo activo en la cabecera del panel administrativo
    const headerRoleBadge = document.getElementById('adminHeaderRoleBadge');
    if (headerRoleBadge) {
        headerRoleBadge.innerHTML = `<i class="fa-solid ${config.icon} mr-1"></i> ${config.name}`;
        const colorClasses = config.id === 'superadmin' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                             config.id === 'admin' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' :
                             config.id === 'editor' ? 'bg-sky-500/20 text-sky-300 border-sky-500/30' :
                             config.id === 'pastor' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                             'bg-purple-500/20 text-purple-300 border-purple-500/30';
        headerRoleBadge.className = `inline-flex items-center text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${colorClasses}`;
        headerRoleBadge.classList.remove('hidden');
    }

    const headerUserEmail = document.getElementById('adminHeaderUserEmail');
    if (headerUserEmail && typeof sessionStorage !== 'undefined') {
        const activeEmail = sessionStorage.getItem('rtv_admin_email') || '';
        const activeName = sessionStorage.getItem('rtv_admin_name') || '';
        if (activeEmail) {
            headerUserEmail.innerHTML = `<i class="fa-regular fa-user text-amber-400/80 mr-1"></i> <span>${activeName ? activeName + ' (' + activeEmail + ')' : activeEmail}</span>`;
            headerUserEmail.classList.remove('hidden');
            headerUserEmail.classList.add('inline-flex');
        } else {
            headerUserEmail.classList.add('hidden');
        }
    }

    // Filtrar pestañas visibles según los permisos del rol
    const navButtons = document.querySelectorAll('#adminTabsNavWrapper button');
    navButtons.forEach(btn => {
        const btnId = btn.id || '';
        const tab = btnId.replace('adm-btn-', '');
        if (tab) {
            const allowed = hasPermission('tab:' + tab, currentRole);
            btn.style.display = allowed ? 'inline-flex' : 'none';
        }
    });

    // Control del botón de agregar usuarios en la pestaña usuarios
    const addUserBtn = document.getElementById('adminAddUserBtn');
    if (addUserBtn) {
        addUserBtn.style.display = hasPermission('canCreateUsers', currentRole) ? 'inline-flex' : 'none';
    }

    // Si la pestaña actual no está permitida para este rol, cambiar a la primera permitida
    const activeContent = document.querySelector('.admin-tab-content:not(.hidden)');
    if (activeContent) {
        const currentTab = activeContent.id.replace('adm-tab-', '');
        if (!hasPermission('tab:' + currentTab, currentRole)) {
            const firstAllowedTab = config.tabs[0] || 'general';
            if (typeof switchAdminTab === 'function') {
                switchAdminTab(firstAllowedTab);
            }
        }
    }
}
window.applyRolePermissionsToUI = applyRolePermissionsToUI;

let _isAdminLoggingIn = false;

async function loginAdmin() {
    if (_isAdminLoggingIn) return;
    _isAdminLoggingIn = true;

    const emailInput = document.getElementById('adminEmailInput');
    const passInput = document.getElementById('adminPasswordInput');
    let email = emailInput ? emailInput.value.trim() : '';
    const pass = passInput ? passInput.value.trim() : '';
    const err = document.getElementById('loginError');
    const errText = document.getElementById('loginErrorText');

    try {
        if (!email || !pass) {
            if (err) {
                if (errText) errText.textContent = "Por favor ingresa correo y contraseña.";
                err.classList.remove('hidden');
            }
            return;
        }

        if (err) err.classList.add('hidden');
        showToast("Verificando credenciales...", "info");

        // Normalización y atajos de usuario
        const lowUser = email.toLowerCase().trim();
        if (lowUser === 'admin' || lowUser === 'superadmin') {
            email = 'admin@radiovisionrtv.com';
        } else if (lowUser === 'yiim' || lowUser === 'yiimsoto') {
            email = 'yiimsoto@gmail.com';
        } else if (lowUser === 'editor') {
            email = 'editor@radiovisionrtv.com';
        } else if (lowUser === 'pastor') {
            email = 'pastor@radiovisionrtv.com';
        } else if (lowUser === 'multimedia') {
            email = 'multimedia@radiovisionrtv.com';
        }

        const normEmail = email.toLowerCase().trim();
        const isMasterSuperAdmin = (normEmail === 'yiimsoto@gmail.com' || normEmail === 'admin@radiovisionrtv.com');

        let authenticated = false;
        let role = 'editor';
        let authenticatedEmail = email;

        // Solo Firebase Auth — sin fallback local de contraseñas (bloqueo de bypass en cliente)
        let fbAuth = null;
        if (typeof firebase !== 'undefined' && typeof firebase.auth === 'function') {
            try {
                fbAuth = firebase.auth();
            } catch (eAuth) {
                console.warn("Aviso obteniendo firebase.auth():", eAuth);
            }
        }

        if (!fbAuth) {
            throw new Error("Firebase Auth no está disponible. Verifica la conexión e intenta de nuevo.");
        }

        try {
            const userCredential = await fbAuth.signInWithEmailAndPassword(normEmail, pass);
            if (userCredential && userCredential.user) {
                authenticated = true;
                authenticatedEmail = userCredential.user.email || email;
            }
        } catch (fbErr) {
            const code = fbErr && fbErr.code ? String(fbErr.code) : '';
            if (code === 'auth/network-request-failed') {
                throw new Error("Sin conexión a Firebase Auth. El acceso admin requiere autenticación en la nube.");
            }
            if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential' || code === 'auth/invalid-email') {
                throw new Error("Correo o contraseña incorrectos.");
            }
            throw new Error(fbErr.message || "No se pudo autenticar con Firebase Auth.");
        }

        if (!authenticated) {
            throw new Error("Credenciales incorrectas o usuario no registrado.");
        }

        // 3. Resolución final del Rol
        if (isMasterSuperAdmin) {
            role = 'superadmin';
        } else if (window.firestoreDb && role === 'editor') {
            try {
                const userDoc = await window.firestoreDb.collection('admin_users').doc(normEmail).get();
                if (userDoc && userDoc.exists && userDoc.data().role) {
                    role = userDoc.data().role;
                }
            } catch (eDoc) {
                console.warn("Aviso consultando rol en Firestore:", eDoc);
            }
        }

        if (role === 'editor' && appData && Array.isArray(appData.adminUsers)) {
            const found = appData.adminUsers.find(u => u && u.email && u.email.toLowerCase().trim() === normEmail);
            if (found && found.role) role = found.role;
        }

        sessionStorage.setItem('rtv_admin_auth', 'true');
        sessionStorage.setItem('rtv_admin_email', authenticatedEmail);
        sessionStorage.setItem('rtv_admin_role', role);

        // Hidratar shards sensibles (staffData / communityData) tras auth real
        if (typeof window.subscribeStaffSensitiveShards === 'function') {
            try { window.subscribeStaffSensitiveShards(); } catch (eSub) { console.warn(eSub); }
        }

        showAdminDashboard();
        applyRolePermissionsToUI(role);

        const config = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.editor;
        const initialTab = config.tabs.includes('general') ? 'general' : config.tabs[0];
        if (typeof switchAdminTab === 'function') {
            switchAdminTab(initialTab);
        }

        if (passInput) passInput.value = '';
        if (err) err.classList.add('hidden');

        showToast(`✓ Bienvenido al Panel de Administración (${config.name})`);
        if (typeof logAuditEvent === 'function') {
            logAuditEvent('Inicio de sesión', 'Auth', 'exito', 'Usuario: ' + authenticatedEmail + ' [Rol: ' + config.name + ']');
        }
    } catch (error) {
        console.error("Error al iniciar sesión:", error);
        let msg = "Credenciales incorrectas o usuario no registrado.";
        if (error.code === 'auth/invalid-email') msg = "El formato de correo no es válido.";
        else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') msg = "Correo o contraseña incorrectos.";
        else if (error.code === 'auth/too-many-requests') msg = "Demasiados intentos fallidos. Intenta más tarde.";
        else if (error.message) msg = error.message;

        if (err) {
            if (errText) errText.textContent = msg;
            err.classList.remove('hidden');
        }
        showToast(msg, "error");
        if (typeof logAuditEvent === 'function') {
            logAuditEvent('Inicio de sesión', 'Auth', 'error', 'Intento fallido: ' + email + ' (' + msg + ')');
        }
    } finally {
        _isAdminLoggingIn = false;
    }
}
window.loginAdmin = loginAdmin;

async function handleForgotPassword() {
    const emailInput = document.getElementById('adminEmailInput');
    let email = emailInput ? emailInput.value.trim() : '';
    if (!email) {
        email = prompt("Ingresa tu correo oficial registrado en Firebase para recibir el enlace de restablecimiento:");
        if (!email) return;
        email = email.trim();
    }
    if (!email.includes('@') || !email.includes('.')) {
        showToast("Por favor ingresa un correo electrónico válido", "error");
        return;
    }
    showToast("Solicitando enlace de restablecimiento...", "info");
    try {
        const auth = (typeof firebase !== 'undefined' && typeof firebase.auth === 'function') ? firebase.auth() : null;
        if (!auth || typeof auth.sendPasswordResetEmail !== 'function') {
            throw new Error("El servicio de recuperación en línea no está disponible en este momento. Por favor ingresa con tu contraseña administrativa o contacta al Super Admin.");
        }
        await auth.sendPasswordResetEmail(email);
        showToast(`✉️ Enlace de recuperación enviado a ${email}. Revisa tu bandeja de entrada o spam.`);
    } catch (err) {
        console.error("Error al restablecer contraseña:", err);
        const msg = err.code === 'auth/user-not-found'
            ? "No se encontró ningún usuario con ese correo."
            : (err.message || "Error al enviar el correo de recuperación");
        showToast(msg, "error");
    }
}
window.handleForgotPassword = handleForgotPassword;

async function logoutAdmin() {
    const currentEmail = (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('rtv_admin_email') : '') || 'admin';
    try {
        const auth = (typeof firebase !== 'undefined' && typeof firebase.auth === 'function') ? firebase.auth() : null;
        if (auth && typeof auth.signOut === 'function') {
            await auth.signOut();
        }
    } catch(e) {
        console.warn("Aviso cerrando sesión de Firebase:", e);
    }
    sessionStorage.removeItem('rtv_admin_auth');
    sessionStorage.removeItem('rtv_admin_email');
    sessionStorage.removeItem('rtv_admin_role');

    // Bloquear el panel: restablecer vista de login y cerrar modal para volver a la web
    if (typeof setAdminModalSize === 'function') {
        setAdminModalSize('login');
    }

    const loginView = document.getElementById('adminLoginView');
    if (loginView) {
        loginView.classList.remove('hidden');
        loginView.style.display = 'flex';
    }
    const dashView = document.getElementById('adminDashboardView');
    if (dashView) {
        dashView.classList.add('hidden');
        dashView.style.display = 'none';
    }

    const tabsNav = document.getElementById('adminTabsNavWrapper');
    if (tabsNav) tabsNav.classList.add('hidden');
    const tabGroups = document.getElementById('adminTabGroupsBar');
    if (tabGroups) tabGroups.classList.add('hidden');
    const footer = document.getElementById('adminFooterWrapper');
    if (footer) footer.classList.add('hidden');
    const exportBtn = document.getElementById('adminHeaderExportBtn');
    if (exportBtn) exportBtn.classList.add('hidden');
    const previewBtn = document.getElementById('adminPreviewSectionBtn');
    if (previewBtn) previewBtn.classList.add('hidden');
    const logoutBtn = document.getElementById('adminLogoutBtn');
    if (logoutBtn) logoutBtn.classList.add('hidden');
    const headerRoleBadge = document.getElementById('adminHeaderRoleBadge');
    if (headerRoleBadge) headerRoleBadge.classList.add('hidden');
    const syncStatus = document.getElementById('adminFloatingSyncStatus');
    if (syncStatus) { syncStatus.classList.add('hidden'); syncStatus.style.display = 'none'; }
    const userEmailBadge = document.getElementById('adminHeaderUserEmail');
    if (userEmailBadge) { userEmailBadge.classList.add('hidden'); userEmailBadge.style.display = 'none'; userEmailBadge.innerHTML = ''; }

    const passInput = document.getElementById('adminPasswordInput');
    if (passInput) passInput.value = '';
    const err = document.getElementById('loginError');
    if (err) err.classList.add('hidden');

    // Cerrar el modal y volver a la web
    if (typeof closeAdminModal === 'function') {
        closeAdminModal();
    } else {
        const modal = document.getElementById('adminModal');
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
            modal.style.visibility = 'hidden';
        }
    }
    if (typeof window !== 'undefined' && window.location.pathname.endsWith('admin.html')) {
        window.location.href = 'index.html';
    }
    showToast("🔒 Panel bloqueado. Sesión cerrada correctamente.", "info");
    if (typeof logAuditEvent === 'function') {
        logAuditEvent('Cierre de sesión', 'Auth', 'exito', 'Cierre de sesión de ' + currentEmail);
    }
}
window.logoutAdmin = logoutAdmin;

function initFirebaseAuthSessionListener() {
    try {
        const auth = (typeof firebase !== 'undefined' && typeof firebase.auth === 'function') ? firebase.auth() : null;
        if (auth && typeof auth.onAuthStateChanged === 'function') {
            auth.onAuthStateChanged(async (user) => {
                if (!user || user.isAnonymous || !user.email) {
                    return;
                }
                const email = String(user.email).toLowerCase().trim();
                const isMaster = (email === 'yiimsoto@gmail.com' || email === 'admin@radiovisionrtv.com');
                let role = null;
                let listed = isMaster;

                if (isMaster) {
                    role = 'superadmin';
                } else if (window.firestoreDb) {
                    try {
                        const doc = await window.firestoreDb.collection('admin_users').doc(email).get();
                        if (doc && doc.exists) {
                            listed = true;
                            role = String((doc.data() && doc.data().role) || 'editor').toLowerCase();
                        }
                    } catch (eDoc) {
                        console.warn('Aviso verificando admin_users en Auth listener:', eDoc);
                    }
                }

                if (!listed && appData && Array.isArray(appData.adminUsers)) {
                    const found = appData.adminUsers.find(u => u && u.email && u.email.toLowerCase().trim() === email);
                    if (found) {
                        listed = true;
                        role = String(found.role || 'editor').toLowerCase();
                    }
                }

                if (!listed) {
                    // Firebase Auth sin roster staff → no marcar sesión admin
                    sessionStorage.removeItem('rtv_admin_auth');
                    sessionStorage.removeItem('rtv_admin_role');
                    return;
                }

                sessionStorage.setItem('rtv_admin_auth', 'true');
                sessionStorage.setItem('rtv_admin_email', user.email);
                sessionStorage.setItem('rtv_admin_role', role || 'editor');
            });
        }
    } catch (err) {
        console.warn("Aviso inicializando listener de sesión Firebase:", err);
    }
}
window.initFirebaseAuthSessionListener = initFirebaseAuthSessionListener;

// ==============================================================
// GESTIÓN DE USUARIOS Y ACCESOS (LOS 5 ROLES)
// ==============================================================
function renderAdminUsersList() {
    const container = document.getElementById('adminUsersListContainer');
    const badge = document.getElementById('adminUsersCountBadge');
    const textCount = document.getElementById('adminUsersCountText');
    const addBtn = document.getElementById('adminAddUserBtn');
    if (!container) return;

    // Solo hidratar/seedear usuarios con sesión staff (nunca en visitante público)
    const staffOk = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('rtv_admin_auth') === 'true');
    if (!staffOk) {
        appData.adminUsers = [];
        container.innerHTML = '<p class="text-slate-500 text-xs p-3 text-center">Inicia sesión para gestionar usuarios.</p>';
        if (badge) badge.textContent = '0';
        if (textCount) textCount.textContent = '0 usuarios';
        return;
    }

    // Lista vacía hasta que staffData / CRUD hidraten; no hardcodear emails en el cliente
    if (!appData.adminUsers || !Array.isArray(appData.adminUsers)) {
        appData.adminUsers = [];
    }

    // 2. Normalizar y desduplicar por correo
    const seenEmails = new Set();
    const uniqueUsers = [];
    for (const u of appData.adminUsers) {
        if (!u) continue;
        const mail = (typeof u === 'string') ? u.toLowerCase().trim() : (u.email ? String(u.email).toLowerCase().trim() : '');
        const key = mail || (u.id || ('usr_' + Math.random().toString(36).substr(2, 6)));
        if (!seenEmails.has(key)) {
            seenEmails.add(key);
            if (typeof u === 'string') {
                uniqueUsers.push({ id: 'usr_' + Math.random().toString(36).substr(2, 8), name: mail.split('@')[0], email: mail, role: 'editor' });
            } else {
                uniqueUsers.push(u);
            }
        }
    }
    appData.adminUsers = uniqueUsers;

    // 3. Contadores
    if (badge) badge.textContent = uniqueUsers.length;
    if (textCount) textCount.textContent = uniqueUsers.length + ' cuenta' + (uniqueUsers.length === 1 ? '' : 's') + ' configurada' + (uniqueUsers.length === 1 ? '' : 's');

    // 4. Permisos
    const currentRole = (sessionStorage.getItem('rtv_admin_role') || 'superadmin').toLowerCase();
    const canManage = (currentRole === 'superadmin' || currentRole === 'admin');
    if (addBtn) addBtn.style.display = canManage ? 'inline-flex' : 'none';

    // 5. Diccionario de Roles con insignias visuales directas
    const roleBadges = {
        superadmin: { name: 'Super Admin', icon: 'fa-crown', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
        admin: { name: 'Admin', icon: 'fa-user-shield', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' },
        editor: { name: 'Editor', icon: 'fa-pen-to-square', color: 'bg-sky-500/20 text-sky-300 border-sky-500/40' },
        pastor: { name: 'Pastor', icon: 'fa-book-bible', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
        multimedia: { name: 'Multimedia', icon: 'fa-photo-film', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' }
    };

    // 6. Generación de Tarjetas
    if (uniqueUsers.length === 0) {
        container.innerHTML = '<p class="text-slate-400 text-xs text-center py-6">No hay usuarios registrados aún.</p>';
        return;
    }

    const cardsHtml = uniqueUsers.map((user, idx) => {
        let rKey = String(user.role || 'editor').toLowerCase().replace(/[^a-z]/g, '');
        if (rKey === 'super' || rKey === 'superadministrador') rKey = 'superadmin';
        if (rKey === 'administrador') rKey = 'admin';

        const rInfo = roleBadges[rKey] || roleBadges.editor;
        const uId = String(user.id || ('usr_' + idx));
        const uName = String(user.name || (user.email ? user.email.split('@')[0] : 'Usuario')).replace(/[<>]/g, '');
        const uEmail = String(user.email || 'Sin correo').replace(/[<>]/g, '');
        const isMaster = (uEmail === 'yiimsoto@gmail.com' || uEmail === 'admin@radiovisionrtv.com' || uId === 'usr_superadmin_yiim' || uId === 'usr_superadmin_1');

        const editBtn = canManage ? '<button type="button" onclick="openAdminUserEditModal(\'' + uId + '\')" class="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs transition-colors" title="Editar usuario"><i class="fa-solid fa-pen-to-square"></i></button>' : '';
        const deleteBtn = (canManage && !isMaster) ? '<button type="button" onclick="deleteAdminUser(\'' + uId + '\')" class="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs transition-colors" title="Eliminar usuario"><i class="fa-solid fa-trash-can"></i></button>' : '';

        return '<div class="p-3.5 bg-[#060c1f] border border-[#1d2d54] hover:border-amber-500/40 rounded-2xl flex items-center justify-between gap-3 shadow-sm transition-all">' +
            '<div class="flex items-center gap-3 min-w-0">' +
                '<div class="w-10 h-10 rounded-xl bg-slate-800/80 text-amber-400 flex items-center justify-center font-bold text-sm shrink-0 border border-slate-700/80">' +
                    '<i class="fa-solid ' + rInfo.icon + '"></i>' +
                '</div>' +
                '<div class="min-w-0">' +
                    '<div class="flex items-center gap-2 flex-wrap">' +
                        '<span class="text-xs font-bold text-white truncate">' + uName + '</span>' +
                        '<span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1 ' + rInfo.color + '">' +
                            '<i class="fa-solid ' + rInfo.icon + ' text-[10px]"></i>' +
                            '<span>' + rInfo.name + '</span>' +
                        '</span>' +
                    '</div>' +
                    '<div class="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 truncate">' +
                        '<i class="fa-regular fa-envelope text-[10px]"></i>' +
                        '<span class="truncate">' + uEmail + '</span>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div class="flex items-center gap-2.5 shrink-0">' +
                '<div class="hidden sm:flex items-center gap-1.5 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-700/60 font-mono text-[11px] text-amber-300/80">' +
                    '<i class="fa-solid fa-shield-halved text-[10px] text-amber-400"></i>' +
                    '<span>Firebase Auth</span>' +
                '</div>' +
                editBtn +
                deleteBtn +
            '</div>' +
        '</div>';
    }).join('');

    container.innerHTML = cardsHtml;
}
window.renderAdminUsersList = renderAdminUsersList;

function getEffectiveAdminRole() {
    let r = (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('rtv_admin_role') : null);
    if (!r && typeof sessionStorage !== 'undefined' && sessionStorage.getItem('rtv_admin_auth') === 'true') {
        const email = (sessionStorage.getItem('rtv_admin_email') || '').toLowerCase().trim();
        if (email === 'yiimsoto@gmail.com' || email === 'admin@radiovisionrtv.com') {
            r = 'superadmin';
        } else if (appData && Array.isArray(appData.adminUsers)) {
            const found = appData.adminUsers.find(u => u && u.email && u.email.toLowerCase().trim() === email);
            if (found && found.role) r = found.role;
        }
        // Sin rol resuelto → privilegio mínimo (editor), nunca superadmin implícito
        if (!r) r = 'editor';
    }
    return (r || 'editor').toLowerCase();
}

function openAdminUserModal() {
    const currentRole = getEffectiveAdminRole();
    if (!hasPermission('canCreateUsers', currentRole) && currentRole !== 'superadmin' && currentRole !== 'admin') {
        showToast("⛔ Acceso denegado: Solo el Administrador tiene permiso para crear usuarios.", "error");
        return;
    }

    const modal = document.getElementById('adminUserModal');
    if (!modal) return;
    const title = modal.querySelector('h3');
    if (title) title.textContent = "Crear Nuevo Usuario y Asignar Rol";

    document.getElementById('editUserId').value = '';
    document.getElementById('editUserName').value = '';
    document.getElementById('editUserEmail').value = '';
    document.getElementById('editUserRole').value = 'editor';
    const passInput = document.getElementById('editUserPassword');
    if (passInput) {
        passInput.value = '';
        passInput.required = true;
        passInput.placeholder = "Contraseña de acceso (mín. 8 caracteres)";
    }
    const delBtn = document.getElementById('btnDeleteUserInModal');
    if (delBtn) delBtn.classList.add('hidden');

    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    modal.style.zIndex = '2000';
}
window.openAdminUserModal = openAdminUserModal;

function openAdminUserEditModal(id) {
    const currentRole = getEffectiveAdminRole();
    if (!hasPermission('canEditUsers', currentRole) && currentRole !== 'superadmin' && currentRole !== 'admin') {
        showToast("⛔ Acceso denegado: Solo el Administrador tiene permiso para editar usuarios.", "error");
        return;
    }

    const user = (appData.adminUsers || []).find(u => u && (u.id === id || (u.email && u.email.toLowerCase() === String(id).toLowerCase())));
    if (!user) {
        showToast("No se encontró la cuenta de usuario seleccionada.", "error");
        return;
    }
    const modal = document.getElementById('adminUserModal');
    if (!modal) return;
    const title = modal.querySelector('h3');
    if (title) title.textContent = "Editar Usuario y Rol";

    document.getElementById('editUserId').value = user.id || id;
    document.getElementById('editUserName').value = user.name || (user.email ? user.email.split('@')[0] : '');
    document.getElementById('editUserEmail').value = user.email || '';
    document.getElementById('editUserRole').value = user.role || 'editor';
    const passInput = document.getElementById('editUserPassword');
    if (passInput) {
        passInput.value = '';
        passInput.required = false;
        passInput.placeholder = "Dejar en blanco para conservar la actual";
    }

    const isMaster = (user.id === 'usr_superadmin_1' || user.id === 'usr_superadmin_yiim' || user.email === 'admin@radiovisionrtv.com' || user.email === 'yiimsoto@gmail.com');
    const delBtn = document.getElementById('btnDeleteUserInModal');
    if (delBtn) {
        if (isMaster) {
            delBtn.classList.add('hidden');
        } else {
            delBtn.classList.remove('hidden');
        }
    }

    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    modal.style.zIndex = '2000';
}
window.openAdminUserEditModal = openAdminUserEditModal;

function closeAdminUserModal() {
    const modal = document.getElementById('adminUserModal');
    if (modal) { modal.classList.add('hidden'); modal.style.display = 'none'; }
}
window.closeAdminUserModal = closeAdminUserModal;

async function handleAdminUserSubmit(e) {
    if (e) e.preventDefault();
    const currentRole = getEffectiveAdminRole();
    const id = (document.getElementById('editUserId').value || '').trim();

    const isAuthorized = currentRole === 'superadmin' || currentRole === 'admin' || hasPermission(id ? 'canEditUsers' : 'canCreateUsers', currentRole);
    if (!isAuthorized) {
        showToast("⛔ Acceso denegado: Se requieren permisos administrativos para gestionar usuarios.", "error");
        return;
    }

    const name = (document.getElementById('editUserName').value || '').trim();
    const email = (document.getElementById('editUserEmail').value || '').trim().toLowerCase();
    const role = (document.getElementById('editUserRole').value || 'editor').trim().toLowerCase();
    const passInput = document.getElementById('editUserPassword');
    const password = passInput ? (passInput.value || '').trim() : '';

    if (!name || !email) {
        showToast("Nombre y correo son obligatorios.", "error");
        return;
    }

    if (!id && password && password.length < 8) {
        showToast("La contraseña debe tener al menos 8 caracteres.", "error");
        return;
    }

    if (!appData.adminUsers || !Array.isArray(appData.adminUsers)) {
        appData.adminUsers = [];
    }

    let createdUid = null;
    if (!id && password && typeof firebase !== 'undefined' && typeof firebase.initializeApp === 'function') {
        try {
            const cfg = (typeof getSavedFirebaseConfig === 'function') ? getSavedFirebaseConfig() : window.DEFAULT_FIREBASE_CONFIG;
            if (cfg && cfg.apiKey) {
                const secondaryAppName = 'SecondaryAdminCreate_' + Date.now();
                const secondaryApp = firebase.initializeApp(cfg, secondaryAppName);
                try {
                    const userCred = await secondaryApp.auth().createUserWithEmailAndPassword(email, password);
                    if (userCred && userCred.user) {
                        createdUid = userCred.user.uid;
                    }
                    await secondaryApp.auth().signOut();
                } finally {
                    await secondaryApp.delete().catch(() => {});
                }
            }
        } catch (authCreateErr) {
            if (authCreateErr && authCreateErr.code !== 'auth/email-already-in-use') {
                console.warn("Aviso creando usuario en Firebase Auth:", authCreateErr);
            }
        }
    }

    let foundIdx = -1;
    if (id) {
        foundIdx = appData.adminUsers.findIndex(u => u && (u.id === id || (u.email && u.email.toLowerCase() === email)));
    } else {
        foundIdx = appData.adminUsers.findIndex(u => u && u.email && u.email.toLowerCase() === email);
    }

    if (foundIdx !== -1) {
        appData.adminUsers[foundIdx].name = name;
        appData.adminUsers[foundIdx].email = email;
        appData.adminUsers[foundIdx].role = role;
        // No persistir contraseñas en claro; Auth vive solo en Firebase Auth
        delete appData.adminUsers[foundIdx].password;
        if (typeof logAuditEvent === 'function') {
            logAuditEvent('Cambios de roles', 'Usuarios', 'exito', 'Actualizado usuario: ' + email + ' [Rol: ' + role + ']');
        }
    } else {
        const newUser = {
            id: createdUid || id || ('usr_' + Date.now()),
            name: name,
            email: email,
            role: role,
            createdAt: new Date().toISOString().split('T')[0]
        };
        appData.adminUsers.push(newUser);
        if (typeof logAuditEvent === 'function') {
            logAuditEvent('Creación de contenido', 'Usuarios', 'exito', 'Nuevo usuario creado: ' + email + ' [Rol: ' + role + ']');
        }
    }

    // Sincronizar en Firestore colección 'admin_users' y 'users'
    if (window.firestoreDb && typeof window.firestoreDb.collection === 'function') {
        try {
            const payload = {
                name: name,
                email: email,
                role: role,
                updatedAt: new Date().toISOString()
            };
            window.firestoreDb.collection('admin_users').doc(email).set(payload).catch(() => {});
            if (createdUid) {
                window.firestoreDb.collection('users').doc(createdUid).set(payload).catch(() => {});
            }
        } catch(eFs) {
            console.warn("Aviso sincronizando usuario en Firestore:", eFs);
        }
    }

    await saveAppData();
    renderAdminUsersList();
    closeAdminUserModal();
    const roleConfig = ROLE_PERMISSIONS[role] || { name: role };
    showToast('✓ Usuario "' + name + '" guardado exitosamente con rol "' + roleConfig.name + '".');
}
window.handleAdminUserSubmit = handleAdminUserSubmit;

async function deleteAdminUser(id) {
    const currentRole = (sessionStorage.getItem('rtv_admin_role') || 'editor').toLowerCase();
    if (!hasPermission('canDeleteUsers', currentRole)) {
        showToast("⛔ Acceso denegado: Solo el Super Admin puede eliminar usuarios.", "error");
        return;
    }

    const userToDelete = (appData.adminUsers || []).find(u => u.id === id);
    if (userToDelete && (userToDelete.id === 'usr_superadmin_1' || userToDelete.id === 'usr_superadmin_yiim' || userToDelete.email === 'admin@radiovisionrtv.com' || userToDelete.email === 'yiimsoto@gmail.com')) {
        showToast("No se puede eliminar la cuenta del Super Admin principal.", "error");
        return;
    }

    if (!confirm("¿Seguro que deseas eliminar esta cuenta de usuario y revocar sus accesos?")) return;

    if (userToDelete && userToDelete.email && window.firestoreDb) {
        try {
            window.firestoreDb.collection('admin_users').doc(userToDelete.email.toLowerCase()).delete().catch(() => {});
        } catch (eDel) {}
    }

    appData.adminUsers = (appData.adminUsers || []).filter(u => u.id !== id);
    await saveAppData();
    renderAdminUsersList();
    showToast("Usuario eliminado correctamente", "info");

    if (typeof logAuditEvent === 'function') {
        logAuditEvent('Eliminación de contenido', 'Usuarios', 'exito', `Cuenta eliminada: ${userToDelete ? userToDelete.email : id}`);
    }
}
window.deleteAdminUser = deleteAdminUser;

function handleDeleteUserFromModal() {
    const id = (document.getElementById('editUserId').value || '').trim();
    if (id) {
        deleteAdminUser(id);
        closeAdminUserModal();
    }
}
window.handleDeleteUserFromModal = handleDeleteUserFromModal;

function togglePasswordVisibility(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    if (!input) return;
    if (input.type === 'password') {
        input.type = 'text';
        if (icon) {
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        }
    } else {
        input.type = 'password';
        if (icon) {
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }
}
window.togglePasswordVisibility = togglePasswordVisibility;

if (typeof window !== 'undefined') {
    window.ROLE_PERMISSIONS = ROLE_PERMISSIONS;
    window.hasPermission = hasPermission;
    window.applyRolePermissionsToUI = applyRolePermissionsToUI;
    window.loginAdmin = loginAdmin;
    window.logoutAdmin = logoutAdmin;
    window.handleForgotPassword = handleForgotPassword;
    window.initFirebaseAuthSessionListener = initFirebaseAuthSessionListener;
    window.renderAdminUsersList = renderAdminUsersList;
    window.openAdminUserModal = openAdminUserModal;
    window.openAdminUserEditModal = openAdminUserEditModal;
    window.closeAdminUserModal = closeAdminUserModal;
    window.handleAdminUserSubmit = handleAdminUserSubmit;
    window.deleteAdminUser = deleteAdminUser;

    window.addEventListener('load', function() {
        try {
            initFirebaseAuthSessionListener();
        } catch(e) {
            console.warn("Aviso al iniciar listener de Firebase:", e);
        }
    });
}
