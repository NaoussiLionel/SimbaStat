
import { simbaApi } from "./lib/simba-api.ts";
const API_BASE="/api/v1";
const preferenceKey="simba-stat-preferences";
const getPrefs=()=>{try{return JSON.parse(localStorage.getItem(preferenceKey)||"{}")}catch{return {}}};
const savePrefs=p=>localStorage.setItem(preferenceKey,JSON.stringify({...getPrefs(),...p}));
const isFollowing=key=>(getPrefs().followed||[]).includes(key);
const followButton=(key,label="")=>`<button type="button" class="follow-toggle tab" data-follow-key="${esc(key)}" aria-pressed="${isFollowing(key)}">${isFollowing(key)?"✓ Suivi":"＋ Suivre"}${label?` · ${esc(label)}`:""}</button>`;
const isSavedEvent=id=>(getPrefs().savedEvents||[]).includes(id);
const hasMatchAlert=id=>(getPrefs().matchAlerts||[]).includes(id);
const C={
 coton:{n:"Coton Sport",s:"COT",c:"#0b7a3b",city:"Garoua"},
 dynamo:{n:"Dynamo Douala",s:"DYN",c:"#b91c1c",city:"Douala"},
 canon:{n:"Canon Yaoundé",s:"CAN",c:"#1d4ed8",city:"Yaoundé"},
 colombe:{n:"Colombe Sportive",s:"COL",c:"#d97706",city:"Sangmélima"},
 menoua:{n:"Aigle Royal Menoua",s:"ARM",c:"#4d7c0f",city:"Dschang"},
 moungo:{n:"Aigle Royal Moungo",s:"ARN",c:"#a16207",city:"Nkongsamba"},
 unisport:{n:"Unisport Bafang",s:"UNB",c:"#1b6ca8",city:"Bafang"},
 abong:{n:"US Abong-Mbang",s:"USA",c:"#047857",city:"Abong-Mbang"},
 renard:{n:"Stade Renard",s:"REN",c:"#c2410c",city:"Melong"},
 panthere:{n:"Panthère du Ndé",s:"PAN",c:"#334155",city:"Bangangté"},
 pwd:{n:"PWD Bamenda",s:"PWD",c:"#be185d",city:"Bamenda"},
 victoria:{n:"Victoria United",s:"VIC",c:"#0f766e",city:"Limbé"},
 gazelle:{n:"Gazelle FA",s:"GAZ",c:"#7c3aed",city:""},
 apejes:{n:"Apejes de Mfou",s:"APE",c:"#9d174d",city:"Mfou"}
};
const IDS=Object.keys(C);
// m(journée, date, dom, ext, scoreDom, scoreExt, lieu, statut) ; statut: FT | PP (reporté) | NS (à venir) | UN (score à confirmer)
const m=(j,d,h,a,hs,as,v,st="FT",g)=>({j,d,h,a,hs,as,v,st,g});
const M=[
 m(1,"2026-10-17","abong","renard",2,2,"Stade départemental, Bertoua","FT",[["8'","Junior Landry Nkouam","renard"],["45+2' (pén.)","Zania Dewesse","abong"],["51'","Etaka Aniah Tabort","renard"],["90+3'","Mvondo","abong"]]),
 m(1,"2026-10-18","apejes","unisport",1,1,"Stade militaire, Yaoundé"),
 m(1,"2026-10-18","dynamo","menoua",2,2,""),
 m(1,"2026-10-18","panthere","pwd",3,2,"Stade Fotso Victor, Bandjoun"),
 m(1,"2026-10-18","canon","coton",1,2,"Stade Roumdé Adjia, Garoua"),
 m(1,"2026-10-18","victoria","moungo",null,null,"Limbé","UN"),
 m(1,null,"gazelle","colombe",null,null,"","PP"),
 m(2,"2026-10-21","gazelle","canon",0,0,""),
 m(2,"2026-10-24","moungo","apejes",2,1,""),
 m(2,"2026-10-24","unisport","victoria",3,0,"Stade municipal, Bafang"),
 m(2,"2026-10-25","menoua","abong",4,0,"Stade municipal, Mbouda"),
 m(2,"2026-10-25","pwd","dynamo",1,1,""),
 m(2,"2026-10-25","renard","panthere",2,1,""),
 m(2,null,"coton","colombe",null,null,"","PP"),
 m(3,"2026-11-01","apejes","canon",1,1,"Stade militaire, Yaoundé"),
 m(3,"2026-11-01","dynamo","coton",1,3,""),
 m(3,"2026-11-01","menoua","renard",4,0,"Stade municipal, Mbouda"),
 m(3,"2026-11-01","abong","unisport",0,2,""),
 m(3,"2026-11-01","victoria","gazelle",3,1,"Centenary Stadium, Limbé"),
 m(3,"2026-11-01","panthere","moungo",3,1,""),
 m(3,"2026-11-01","colombe","pwd",2,0,"Stade militaire, Yaoundé"),
 ...[["2026-11-04","dynamo","gazelle"],["2026-11-04","victoria","coton"],["2026-11-07","moungo","abong"],["2026-11-08","canon","menoua"],["2026-11-08","pwd","apejes"],["2026-11-08","renard","colombe"],["2026-11-08","unisport","panthere"]].map(x=>m(4,x[0],x[1],x[2],null,null,"","NS")),
 ...[["coton","moungo"],["gazelle","renard"],["menoua","pwd"],["colombe","dynamo"],["panthere","victoria"],["abong","apejes"],["unisport","canon"]].map(x=>m(5,"2026-11-15",x[0],x[1],null,null,"","NS"))
];
const CUR=3, TODAY="2026-11-02";
// 2025-26 (classement final ; clubs encore en Elite One en 2026-27)
const S25=[["Jules Armand Kooh","dynamo",20],["Blaise Ndiforchu","menoua",17],["Patrick Edzimbi","colombe",13],["Jefter Arrey","dynamo",9],["Achille Fokem","unisport",9],["Thorgan Essiane","renard",9],["Vivien Koloto","unisport",8],["Solomon Asaah","fortuna",8],["Carlos Yougouda","coton",8],["Serge Daura","gazelle",8]];
const T25={colombe:[1,55],dynamo:[2,55],unisport:[3,49],coton:[4,44],canon:[5,39],panthere:[6,35],pwd:[7,34],gazelle:[8,33],victoria:[9,33],renard:[10,31],moungo:[11,30],menoua:[12,29]};

// Archives : clubs absents de l'Elite One 2026-27
const HC={
  fortuna:{n:"AS Fortuna Mfou",s:"FOR",c:"#0f766e"},
  fauve:{n:"Fauve Azur Elite",s:"FAU",c:"#7c3aed"},
  union:{n:"Union Douala",s:"UNI",c:"#1d4ed8"},
  astres:{n:"Les Astres",s:"AST",c:"#b91c1c"},
  bamboutos:{n:"Bamboutos FC",s:"BAM",c:"#a16207"},
  yong:{n:"Yong Sport",s:"YON",c:"#334155"},
  aigle:{n:"Aigle Royal",s:"AIG",c:"#4d7c0f"}
};

// 2025-26 : classement final (source fournie)
const H25_TABLE=[
  ["colombe",26,16,7,3,47,13,55,"C"],
  ["dynamo",26,17,4,5,54,25,55,""],
  ["unisport",26,15,4,7,44,37,49,""],
  ["coton",26,12,8,6,37,23,44,""],
  ["canon",26,10,9,7,31,20,39,""],
  ["panthere",26,10,5,11,32,26,35,""],
  ["pwd",26,10,4,12,41,42,34,""],
  ["gazelle",26,9,6,11,24,29,33,""],
  ["victoria",26,10,3,13,33,42,33,""],
  ["renard",26,7,10,9,35,38,31,""],
  ["moungo",26,8,6,12,25,38,30,""],
  ["menoua",26,7,8,11,30,33,29,""],
  ["fortuna",26,5,6,15,20,48,21,"R"],
  ["fauve",26,5,2,19,17,57,17,"R"]
];

// 2025-26 : résultats sélectionnés (la J3 fournie est identique à la J3 2026-27)
const H25_RESULTS=[
  ["Journée 26 · 10 juin 2026 (dernière journée)",[
    ["colombe","fauve",7,0],["unisport","dynamo",2,7],["canon","victoria",4,0],
    ["fortuna","renard",1,2],["gazelle","coton",0,0],["moungo","pwd",2,1],["menoua","panthere",2,2]
  ]],
  ["Journée 23 · sélection",[
    ["dynamo","coton",2,1],["victoria","panthere",2,1],["menoua","gazelle",1,0],
    ["fortuna","pwd",1,1],["renard","unisport",1,2],["colombe","canon",1,0],["moungo","fauve",3,2]
  ]]
];

// 2024-25 : résultats sélectionnés (journée 15 absente, journées partielles)
const H24_RESULTS=[
  ["J1 · 7–8 déc. 2024",[
    ["renard","aigle",0,0],["dynamo","fauve",0,0],["panthere","pwd",0,1],["victoria","yong",3,0],
    ["coton","colombe",0,0],["bamboutos","canon",0,2],["gazelle","fortuna",1,2],["union","astres",4,3]
  ]],
  ["J2 · 15 déc. 2024",[
    ["canon","victoria",1,1],["aigle","union",1,1],["panthere","fauve",0,2]
  ]],
  ["J3 · 18–19 déc. 2024",[
    ["colombe","dynamo",2,1],["bamboutos","aigle",2,0],["fauve","coton",0,0],
    ["astres","victoria",0,2],["fortuna","panthere",1,2]
  ]],
  ["J4 · 22 déc. 2024",[
    ["colombe","aigle",2,1],["dynamo","bamboutos",0,0],["victoria","panthere",0,4],["fauve","canon",1,3]
  ]],
  ["J5 · 29–31 déc. 2024",[
    ["coton","aigle",2,1],["bamboutos","fauve",0,0],["canon","dynamo",0,2],["fortuna","union",2,0]
  ]],
  ["J6 · 2–5 janv. 2025",[
    ["gazelle","aigle",1,1],["fortuna","renard",0,1],["fauve","victoria",2,1]
  ]],
  ["J7 · 11–12 janv. 2025",[
    ["aigle","dynamo",1,0],["renard","fauve",1,1],["victoria","fortuna",3,1]
  ]],
  ["J8 · 19 janv. 2025",[
    ["fortuna","aigle",1,0],["victoria","dynamo",1,1]
  ]],
  ["J9 · 26 janv. 2025",[
    ["aigle","fauve",2,0],["dynamo","renard",0,2],["gazelle","victoria",3,1],["panthere","union",2,1]
  ]],
  ["J10 · 29 janv. – 2 févr. 2025",[
    ["coton","victoria",3,0],["pwd","aigle",1,1],["fauve","astres",1,0],
    ["renard","panthere",0,1],["union","dynamo",1,0]
  ]],
  ["J11 · 8–9 févr. 2025",[
    ["aigle","astres",0,1],["victoria","bamboutos",0,1],["renard","union",1,0],["dynamo","panthere",0,0]
  ]],
  ["J12 · 14–16 févr. 2025",[
    ["fauve","union",2,1],["astres","dynamo",3,1],["bamboutos","fortuna",1,0],
    ["panthere","aigle",1,0],["victoria","colombe",0,2]
  ]],
  ["J13 · 19–23 févr. 2025",[
    ["union","victoria",1,2],["dynamo","coton",0,1],["aigle","canon",2,0],
    ["bamboutos","renard",0,2],["colombe","fauve",3,2]
  ]],
  ["J14 · 1–2 mars 2025",[
    ["union","bamboutos",1,0],["aigle","yong",0,0]
  ]],
  ["J16 · 23–27 mars 2025",[
    ["aigle","renard",1,0],["fauve","dynamo",4,0]
  ]],
  ["J17 · 30–31 mars 2025",[
    ["union","aigle",0,1],["victoria","canon",2,0],["fauve","panthere",0,1]
  ]],
  ["J18 · 6 avr. 2025",[
    ["aigle","bamboutos",2,1],["coton","fauve",1,0],["victoria","astres",4,0],
    ["dynamo","colombe",0,2],["panthere","fortuna",2,0]
  ]],
  ["J19 · 13 avr. 2025",[
    ["bamboutos","dynamo",0,1],["panthere","victoria",1,1],["canon","fauve",1,0],["aigle","colombe",0,1]
  ]],
  ["J20 · 20–24 avr. 2025",[
    ["fauve","bamboutos",3,0],["dynamo","canon",2,0],["aigle","coton",2,3],["union","fortuna",0,0]
  ]],
  ["J21 · 26–28 avr. 2025",[
    ["victoria","fauve",1,0],["aigle","gazelle",1,3],["renard","fortuna",1,0]
  ]],
  ["J22 · 2–4 mai 2025",[
    ["fauve","renard",1,0],["fortuna","victoria",5,0],["dynamo","aigle",3,0]
  ]],
  ["J23 · 10–11 mai 2025",[
    ["aigle","fortuna",1,0],["dynamo","victoria",4,2]
  ]],
  ["J24 · 18–21 mai 2025",[
    ["fauve","aigle",1,2],["victoria","gazelle",3,3],["renard","dynamo",1,1],["union","panthere",0,0]
  ]],
  ["J25 · 21–25 mai 2025",[
    ["aigle","pwd",0,2],["victoria","coton",3,1],["dynamo","union",1,0],
    ["panthere","renard",1,0],["astres","fauve",1,0]
  ]],
  ["J26 · 1–4 juin 2025",[
    ["bamboutos","victoria",5,1],["astres","aigle",0,2],["union","renard",0,2],["panthere","dynamo",1,0]
  ]]
];

// 2024-25 : buteurs (2e et 3e sans nombre de buts dans la source)
const S24=[["Serge Daura","gazelle",15],["Boris Mfoumou","fortuna","n.d."],["Nsanfeu Konrad","panthere","n.d."]];

// Effectifs FECAFOOT 2025/2026 (même base utilisée pour l'archive 2024-25)
const ROSTER=[
["ERIC ABANKE","menoua","006617M95","1995-05-24"],
["GIOVANNI CHRISTOPHE ABATA ANGouLA","colombe","043353M02","2002-01-06"],
["ABOUBAKAR ABDOU","renard","037441M03","2003-09-03"],
["MOUBARAK ABDOUL AZIZ","coton","011803M03","2003-09-21"],
["JULLIARD BENOIT SEIZE ABENG MEFOE","colombe","044947M08","2008-07-31"],
["VALENTINE MEYANUI ABEWEH","pwd","010561M04","2004-09-05"],
["GISLAIN MICHEL ABIANDA","fortuna","072443M03","2003-11-02"],
["TONY EMMANUEL ACHU","menoua","000751M95","1995-08-12"],
["MUSAH ADAM","colombe","092696M02","2002-07-07"],
["ABOUBAKAR ADAMOU DANSOHO","fauve","001001M99","1999-09-18"],
["HABDOULLAH ADAMOU LIFAB","menoua","056349M02","2002-06-06"],
["ASAEL NADJIBE ADJIM","colombe","086188M07","2007-11-19"],
["MOHAMADOU AHMADOU AHIDJO","coton","038458M04","2004-05-10"],
["DJAKAO AHMADOU BARKA","gazelle","058481M04","2004-12-02"],
["CHRISTIAN AHMADOU BOUBA","pwd","077349M10","2010-01-01"],
["MARTIN LOIC AKO ASSOMO","canon","000591M99","1999-12-21"],
["CALITUS ANJEH AKOH","colombe","025719M96","1996-07-16"],
["JUNIOR PATRICK AKONGO EVOUNA","fortuna","052752M05","2005-05-19"],
["DAVID FERNANDE ALABA","pwd","075692M08","2008-03-20"],
["NGUIMBOUS ALBERT","moungo","059914M06","2006-05-20"],
["ALGANAM DOUBAY","gazelle","089138M08","2008-03-21"],
["HABOUBAKAR ALI","victoria","092779M09","2009-05-03"],
["ROSTAND DIOR ALIANA FOSSI","menoua","004875M00","2000-06-02"],
["MAHAMAT ALIOU","victoria","072913M05","2005-06-23"],
["GADIN ALLAMBATNAN","coton","053794M00","2000-02-19"],
["YVANE THIERRY ALOUKOU ESSEPE","coton","010231M94","1994-02-19"],
["YAYA ALUYU","pwd","062761M06","2006-08-21"],
["CARLOS AMADOU YOUGOUDA","coton","051430M05","2005-05-07"],
["FAUSTIN AMBASSA MANGA","victoria","070622M07","2007-06-22"],
["DANIEL ANDELA MENDJE","coton","047805M02","2002-06-06"],
["SERGES ANDOULO","unisport","000456M95","1995-01-08"],
["JAMIS SAMUEL ANGO EBELLE","moungo","002104M98","1998-05-24"],
["ALVIN BINSTO ANYE","pwd","038925M04","2004-01-10"],
["MOUSSA AOUDOU","dynamo","003332M03","2003-10-02"],
["BEMOL APAM ASSONGWE","colombe","047403M01","2001-06-15"],
["DAVID OGBE APEH","panthere","092737M00","2000-03-05"],
["FERNAND BEYANG ARREY","dynamo","053516M08","2008-07-05"],
["SOLOMON NSOH ASAAH","fortuna","063404M05","2005-03-23"],
["AGBOR MELDIN ASHU","victoria","072918M08","2008-09-04"],
["FRANCK ASSIGA EDOA","canon","071811M04","2004-06-06"],
["MARC DYNAM ATANGANA","dynamo","083654M01","2001-05-21"],
["CYRILLE ATCHOM","fauve","022891M97","1997-09-08"],
["DIEU NE DORT PASCAL AVAMA ADJINI","coton","081334M09","2009-04-09"],
["HERNANDEZ WILFRIED AVOUZOA ANGouLA","canon","080424M08","2008-12-29"],
["JOEL BETHEL BAKANDA","canon","067656M94","1994-09-05"],
["AXEL DENIS BAKOUDE MBAGA","colombe","072580M07","2007-01-19"],
["HENRI CLAUDE BALLA","canon","038879M07","2007-01-02"],
["VINCENT COLLINS BALLA FOE","renard","022800M98","1998-11-21"],
["LEON DILANE BALOMOG","fortuna","013333M00","2000-05-15"],
["ELIE JUNIOR BAMAL KANGA","unisport","004936M01","2001-04-25"],
["JOYCE BRINCH BAMEN NDJEYA","panthere","019909M97","2004-01-09"],
["VICTORY PRAISE BOSEME BAMOKI","moungo","022855M01","2001-06-16"],
["PAULIN BANDA NKOUNOU","canon","001136M98","1998-08-12"],
["ALAIN GINESS BANECK EKOH","renard","059044M06","2006-07-07"],
["SERGE BANZI NGU","renard","077217M05","2005-11-25"],
["JEAN CHARLES ANTONY BEBE","fauve","083413M08","2008-11-11"],
["MAURICE BEBOUM KAMDEM","menoua","018840M02","2002-06-30"],
["THIERRY BEDIME DIKOMBWE","renard","001032M92","1992-05-30"],
["STEPHANE BEKOLO","canon","008127M99","1999-03-19"],
["FRANCK YANNIS BEKONO","fortuna","062994M06","2006-12-29"],
["JULIEN PATRICE SAMUEL BELEMB","menoua","036243M95","1995-01-02"],
["KARIM BELLO PEMENZI","canon","053633M03","2003-11-18"],
["FRANCK STEVE BELOBO","canon","006458M03","2003-05-16"],
["JUNIOR TRESOR BEMBONG","fauve","071735M07","2007-03-07"],
["MANGA SERGE BENGONO BENGONO","pwd","092749M08","2008-01-10"],
["EVRAD BEYONG MENELI","canon","001318M00","2000-03-10"],
["LUC BIDE NDOHOUNGAR","colombe","016714M99","1999-01-30"],
["RONAN CARMEL BILLE","dynamo","088016M09","2009-01-30"],
["JOSE BILOGUE ZENE ZOBO","fortuna","084029M06","2006-08-20"],
["GEORGES ANKER WILFRID BILONGO","canon","040305M05","2005-07-28"],
["COLBERT BINNI","gazelle","053457M06","2006-03-06"],
["RENE DONALD BITJICK NKONDJOCK","dynamo","039097M98","1998-06-27"],
["SERGE ANTHONY BOGAM","victoria","087978M08","2008-04-24"],
["SALI BOUBAKARY II","renard","000078M99","1999-09-22"],
["ZACHEE BENJAMIN BWE YAMBA","moungo","015819M99","1999-03-13"],
["BLAMDI EMMANUEL CAYS","dynamo","064755M04","2004-09-09"],
["JEAN EMMANUEL CHAMDJO NGUEWAWE","moungo","000420M95","1995-07-26"],
["XXXXX CHERIF IBRAHIM","fauve","003740M02","2002-08-23"],
["CARL-FRANK CHI ZANGA","dynamo","052759M05","2005-01-05"],
["MOSES IFEANY CHIMA","panthere","092742M00","2000-03-05"],
["ANGE URIEL DADEM TCHINDA","menoua","026255M06","2006-01-02"],
["EMMANUEL PARFAIT DAKANA KIBE","coton","021802M07","2007-12-29"],
["ABDOURAMAN DAMAN BOUBA","coton","002234M02","2002-08-11"],
["TANKO MOHAMADOU DAN ASSABE","coton","075428M08","2008-07-24"],
["JUNIOR DANDE","canon","023042M98","1998-02-22"],
["MBOCK BASEKA LOGA DANIEL LE BLANC","victoria","083456M11","2010-11-26"],
["SERGE DAURA","gazelle","058533M06","2006-07-07"],
["FREDERIC DAWAI GOULVA","coton","038467M05","2005-07-27"],
["MAURICE BILL ALEX DIBOTO","victoria","024460M02","2002-05-08"],
["FREDERIC DIEFF SELLE","victoria","033673M05","2005-03-07"],
["CARLITOS DJAPA DJAPA","fortuna","076734M06","2006-07-10"],
["RAPHAEL DJAPA TCHAPTCHET","unisport","040639M04","2004-08-28"],
["NELSON JEAN BAPTISTE DJEMBE","moungo","002244M02","2002-03-11"],
["GIDE MARCEL DJIALEU TOUKO","colombe","017439M02","2002-03-06"],
["GHISLAIN ARMEL DJIMMOE OUAMBE","unisport","000416M94","1994-05-31"],
["EPHRAIM DJINTCHA HERVE","victoria","092775M08","2008-04-24"],
["CEDRIC LANDRY DJOMO KOUPKOUA","colombe","000826M95","1995-03-05"],
["HARISSON FORD DJONKEP NKUILAN","coton","052773M01","2001-08-04"],
["VIRGIL DJOUMESSI DONGMEZA","renard","050740M03","2003-04-30"],
["GAETAN DOKO BELLO","panthere","034638M04","2004-06-11"],
["KENDRY ROGER DOMINGO","gazelle","085364M07","2007-06-14"],
["CYRILLE DOMTOUNE MAAKTE","coton","027460M03","2003-01-04"],
["FABIEN DONGMO","moungo","050053M05","2005-05-30"],
["WILFRIED NATHAN DOUALLA","canon","064860M06","2006-06-15"],
["MONTERIO DOUJOUNA","coton","034748M98","1998-05-25"],
["JORDY DOUMBE YOUMBA","gazelle","062965M04","2004-05-23"],
["COLBERT DOURYANG","gazelle","083638M08","2008-02-19"],
["DESTINY GENENEKE DZEDU","pwd","077889M07","2007-01-31"],
["WILLLY LOPEZ EBENDENG","unisport","019123M00","2000-02-15"],
["ZACHARIE JUNIOR EBOCO","canon","010070M04","2004-10-10"],
["DONOVANE ROY EDIMA NDONGO","gazelle","075745M07","2007-07-10"],
["SINDJO BRICE EDMOND","colombe","000969M97","1997-06-07"],
["JACQUES EDOUL EKOLOWA","unisport","015212M03","2003-04-03"],
["WILLIAM EKANGA LOBE","menoua","003326M03","2003-06-06"],
["WILLY EKO TINDI","colombe","083276M06","2006-02-20"],
["LEONNEL CHRISTIAN EKODO AWONO","renard","067951M05","2005-01-03"],
["DUAMEL BORIS EKOTTO","colombe","015573M03","2003-12-23"],
["BRIAN ARTHUR EKWEM ESSEME","dynamo","092783M08","2008-07-11"],
["RODRIGUE ELE EBOLO","menoua","024106M98","1998-03-02"],
["MAXIME FREDERICK ELE ELE","canon","070016M07","2007-01-15"],
["ALEX RODRIGUE ELLA II","coton","040840M05","2005-03-01"],
["JEAN CLEMENT ELOMO","gazelle","092836M08","2008-11-08"],
["SANTO KISITO ELOUNA ELOUNA","fortuna","072461M04","2004-05-20"],
["PIERRE DIMITRI EMBO II","moungo","014436M98","1998-08-28"],
["ROGER EMGA","coton","047900M01","2001-05-11"],
["BLACK JEAN SAMUEL ENDENE MOUNTONGO","moungo","039190M05","2005-01-08"],
["JUDE ENOW ENOW","colombe","036658M08","2008-06-30"],
["YANNICK LITTIZI EPANE EPANE","renard","092766M92","1992-08-13"],
["TICKY PATRICK OSCAR EPOH","moungo","000901M94","1994-07-11"],
["CESAR EPOH MBEMBELOU","moungo","055355M01","2001-08-17"],
["PHILIPPE BERTIN II ESSAMA BENGONO","fortuna","000641M91","1991-01-08"],
["MARIUS JUNIOR ESSAPA ESSEME","colombe","023714M04","2004-01-19"],
["THORGAN ESSIANE","renard","063447M04","2004-09-08"],
["BERTRAND ESSIANE NDJONGOLO","colombe","001384M99","1999-09-23"],
["GUY MARCEL ESSOMO BAGNEKEN","dynamo","049724M04","2004-11-25"],
["MARC LAFLEUR ESSONO","fortuna","052215M03","2003-06-14"],
["DIEUDONNE ALEX ESSONO OMGBA","canon","020739M03","2003-03-08"],
["JANVIER ARMAND ETOGA ANGOA","fauve","064415M04","2004-02-07"],
["SONY FAREL EVINA","gazelle","034720M06","2006-10-12"],
["JEAN HUGUES EYANGO PRISO","colombe","012115M98","2004-05-12"],
["GUY CLAUDE EYIKE","renard","002577M01","2001-01-09"],
["CARL OSOGO EYONG","victoria","074479M07","2007-07-31"],
["BOGARD EYONG BESSEM AGBOR","pwd","033785M05","2005-12-25"],
["MAXIME PASCAL EZE OMGBA","fauve","025435M03","2003-04-05"],
["ISSA FADYL OUSMANOU","coton","025088M04","2004-02-07"],
["GERMAN FANKAM TALA","unisport","017521M03","2003-07-17"],
["FRANCOIS XAVIER FEGUE OMGBA","panthere","001402M00","2000-03-08"],
["EDZIMBII FERGANI PATRICK","colombe","061304M05","2005-01-17"],
["TRESOR CAROFE FEUMBA YANOU","panthere","003315M95","1995-07-04"],
["VITTEL FEUMI YANOU","dynamo","017535M02","2002-04-26"],
["ABAKAR ARAFAT FIFEN","panthere","032614M04","2004-02-08"],
["YVAN MARCEL FOBANG MAPUH","gazelle","085094M06","2006-12-26"],
["STEPHANE FOE MBALLA","fortuna","085744M06","2006-10-04"],
["ARNAULD STEVY FOKAM SOKENG","moungo","000292M00","2000-03-29"],
["ACHILLE FOKEM NAMEKONG","unisport","000263M99","1999-12-25"],
["MICHEL ARCHANGE FOKOU","fortuna","076762M06","2006-06-03"],
["CASIMIS FOKOU TEUFACK","colombe","011273M04","2004-04-21"],
["TERREL BEGHENE TEBOH FONCHAM","panthere","006376M97","1997-04-17"],
["PATRICK CLOVERT FONGANG","pwd","088284M07","2007-08-25"],
["BRANDON FOPA NGouLA","panthere","037105M03","2003-08-14"],
["SANTA FOUDA NDONGUE","victoria","073469M06","2006-05-20"],
["ANDRE JACKY FOUDA OMGBA","gazelle","080427M03","2008-03-18"],
["WARREN ZIDANE FOZING","panthere","016112M01","2001-04-04"],
["JUNIOR FOKA FRANKY","moungo","072945M05","2005-07-12"],
["RONUALD GAZHAC","menoua","077677M06","2006-06-02"],
["CECIL MEYEKE GEFEH","menoua","059545M04","2004-11-03"],
["NKO GHANGLE RATTENSI","victoria","036871M06","2006-06-24"],
["FEBE FRITZ GILLES","pwd","033764M05","2005-04-12"],
["ROGER GROSSO","pwd","061761M04","2004-05-11"],
["KARIM HAMADOU MOUMINI","dynamo","064413M04","2004-09-28"],
["SEINI HAMIT","menoua","002178M02","2002-01-01"],
["SAMUEL DANIEL HANDY III","victoria","050222M07","2007-02-20"],
["SOULEMANOU HENDJI ALIOU","fortuna","009901M02","2002-10-07"],
["EMMANUEL UZOMA IBEKWE","panthere","092735M05","2005-12-23"],
["PIERRE IKONG","dynamo","057083M04","2004-04-07"],
["FRANCK DYLAN IPOUA VIKOTY","canon","028042M05","2005-05-09"],
["MUSA USMAN ISMAEL","unisport","071726M06","2006-11-25"],
["VITALISE BANG ISSA FOME","canon","078514M04","2004-11-06"],
["MIDREL BRAYAN ITENDE EPIRE","gazelle","045524M07","2007-10-15"],
["GEORGES WILLIAM IYEM BONONG","victoria","049507M06","2006-05-03"],
["IKOSE NIJUMA JOEL LEE-CONRAD","colombe","039240M06","2006-06-08"],
["JOHNSON JOSHUA FEKIR","fortuna","083154M06","2006-01-13"],
["FON BORIS KACHE","pwd","000225M02","2002-02-25"],
["MARIUS KALGON KADA","gazelle","008277M96","1996-09-07"],
["JEAN PIERRE JUNIOR KAMDIEU DJENGUE","moungo","009286M04","2004-11-24"],
["YANNICK KAMDOUM ESONO","moungo","002535M01","2001-10-02"],
["DESMOND KAMENI","unisport","024031M03","2003-05-07"],
["JEAN CLAUDE KEVIN KAMENI NGAMALIEU","renard","022913M95","1995-04-27"],
["KAZOBAR KASONGO EBONDO","fortuna","071786M03","2003-10-25"],
["JULES LEGRAND KEBEL BASSINHA","dynamo","056197M04","2004-03-17"],
["JUNIOR KEMAJOU DIBAMI","fauve","000607M95","1995-12-04"],
["LUKE MARTINS KENDA NEKAK","dynamo","059043M06","2006-07-19"],
["ANGE CONSTANT KENFACK","gazelle","062063M07","2007-05-27"],
["MISTRO KEUGQUE YAMDIEU","menoua","022998M97","1997-05-08"],
["FRANCK VINCENT KOFANA BEPEGUE","fauve","012650M00","2000-12-16"],
["RAYANE KOM","moungo","059050M04","2004-12-25"],
["FRANCK LAMAR KOMBI EPOH","renard","060289M03","2003-09-03"],
["FRANCK DERICK KOMBOBILO KOMESSI","menoua","023700M02","2002-11-20"],
["FELIX KONE LOTTIN","renard","001164M98","1998-10-09"],
["JULES ARMAND KOOH BIOUMLA","dynamo","023616M99","1999-06-16"],
["JEAN PIERRE KOTNA ONLA","moungo","019051M01","2001-06-29"],
["RYAN PHAREL KOUAM KAMGUEM","panthere","036799M03","2003-08-08"],
["DYLAN KOUAM MBAPPE AKIM","unisport","083269M06","2006-10-05"],
["SIDOINE KOULARAMBAÏ","fauve","034640M05","2005-12-14"],
["JUSTE DE BONHEUR KOULOU","canon","076592M98","1998-12-18"],
["FRANCK DONALD KOUM DIPPITA","renard","037762M97","1997-08-07"],
["MARIO KOUMA","colombe","067265M03","2003-10-03"],
["OLIVIER KOUOH DICKA","moungo","000787M96","1996-10-19"],
["XY L'ALMANIE ABDOUL","fauve","036069M99","1999-03-17"],
["CHARLES AUGUSTE LARFEY","unisport","050858M03","2003-07-23"],
["JUNIOR LEBOUM MELI","gazelle","046907M05","2005-11-06"],
["YANICK LEUYO KAMALE","renard","055285M01","2001-05-30"],
["DAVID CALEB LIENOU NGAMENI","unisport","042025M02","2002-07-22"],
["BAYEBANE ETIENNE STEEVE LIMA","colombe","083399M07","2007-12-30"],
["VLADMIR LAROCHE LIMA LEBA","renard","005217M02","2002-08-08"],
["FREDY LOBE MBANG","unisport","083731M95","1995-07-12"],
["RUDOLF NDIVE LYONGA","victoria","036923M07","2007-03-25"],
["ISAAC LEROI MABEN A ABOUEM","dynamo","092782M07","2007-04-03"],
["MACHOER MABENGOL DJISSE","fauve","072089M05","2005-08-28"],
["RADIF MABIALA AMOUGOU MESSI","victoria","085221M07","2007-11-24"],
["CEDRIC MADJEM GOMBI","renard","001166M97","1997-04-16"],
["NOUROU MAHMAN","gazelle","083418M08","2008-03-17"],
["JEAN FREDERIC MALA BESSALA","moungo","020810M00","2000-04-18"],
["FRANCKY MANGA","gazelle","060888M06","2006-07-17"],
["CARLAIN MANGA MBAH","renard","039613M93","1993-01-13"],
["JEAN FRANCOIS POPESS MANGUELE ELONG","coton","067383M07","2007-03-21"],
["ALEX ROMEO MANI ONGUENE","fortuna","053556M01","2001-01-01"],
["ARTHUR MANI-MBEN","renard","051185M03","2003-11-27"],
["BIANDAO MARCELLIN RUSSEL BERRY","fauve","076659M92","1992-10-29"],
["NKOMO OSSOMBA DIDIER MARIE PIERRE LATOUR","victoria","092776M08","2008-06-15"],
["MICKAEL FRANCOIS MASSON","moungo","038842M06","2006-02-21"],
["LEROY MBA AZIZ","menoua","064340M05","2005-02-02"],
["YANN STEPHANE MBAH NDJOCK","canon","010404M95","1995-08-07"],
["MARCELIN MBAHBI BOUYANE","coton","000835M00","2000-01-31"],
["JUNIOR ROSTAND MBAI","unisport","000444M95","1995-07-01"],
["GABRIEL MBALLA","menoua","022917M01","2001-08-03"],
["JEAN SIMPLICE MBANG","renard","001300M97","1997-04-07"],
["HANS DONALD MBANG TAKANG","unisport","092834M97","1997-10-04"],
["YVES MBAPPE","dynamo","068885M03","2003-01-11"],
["GEORGES MBARGA ATEDZOE","panthere","035909M01","2001-11-19"],
["DAVID JUNIOR MBAZO'O MBAZO'O","colombe","033631M05","2005-02-28"],
["DIMITRI ROGER MBELE MVONDO","fauve","037392M06","2006-03-19"],
["MICHEL JUNIOR MBELECK BAYIHA","colombe","036137M03","2003-02-11"],
["BRANDON VAREL MBELLA","renard","018804M05","2005-04-15"],
["JOECOLE MBELLA MBELLA","unisport","000872M99","1999-11-28"],
["TRESOR ROMARIS MBENGUE ETOUNDI","renard","026545M98","1998-11-24"],
["ALOYS GERARLD MBENI MINKOUMBA","fauve","034643M05","2005-06-24"],
["LOIC MBIDA AMOUGOU","fortuna","050054M07","2007-12-05"],
["JOSEPH PERNAUD MBOCK","fortuna","083153M08","2008-11-14"],
["MANUEL JOSEPH MBOLLO","fauve","049816M03","2003-06-11"],
["VENAL JJUNIOR MBoutCHAC TCHOUKE","panthere","092835M09","2009-08-06"],
["ERIC MEFOE","menoua","000374M96","1996-11-05"],
["JUNIOR MEKE ZANGA","fauve","056110M03","2003-11-20"],
["ARSENE MEKILA","gazelle","075412M06","2006-12-13"],
["BRIAN MICHEL MELINGUI TSANGA","fauve","051178M04","2004-06-23"],
["CLEMENT BRICE MENDJANA AYOLO","panthere","092773M07","2007-10-12"],
["ERIC MEVENGUE AFANA","menoua","086004M07","2007-08-01"],
["ALFRED MEYONG A ETONG","canon","000589M91","1991-02-23"],
["DIDAS NIXON MIAFANG","moungo","053140M05","2005-05-19"],
["NGASSAM NJIGANG MICHEL DILAN","victoria","092777M09","2009-06-06"],
["CELESTIN CEDRIC MINLO","dynamo","004950M03","2003-10-29"],
["TCHARI MOHAMAD DJIBRILLA","gazelle","089587M08","2008-03-03"],
["MOHAMED MOUSTAPHA MOLUH MOUNTA","panthere","002148M01","2001-03-05"],
["CEDRICK MONGO OND","dynamo","010705M02","2002-09-25"],
["KESSEL WILLY MONKAM","unisport","083319M07","2007-03-05"],
["MAEL FERNANDEZ MONYEBE","gazelle","076627M07","2007-01-05"],
["CHAPDELAIN JOYCE MOUAFFO GALO","fauve","001235M93","1993-07-31"],
["ARNAUVY PRINCIDE MOUBOULI","dynamo","092780M04","2004-05-04"],
["SAMUEL PAUL MOUKOKO","unisport","078444M09","2009-10-23"],
["JASON BRAYAN MOULLE YOMI","victoria","072925M08","2008-07-11"],
["LIMANE MOUSSA","coton","021981M02","2002-08-25"],
["JACQUES SERGE MOUSSOL KOTTO","gazelle","050056M04","2004-09-29"],
["ANGEL RENAUD MOUT","moungo","077623M03","2003-06-21"],
["FRANCK YVAN MOUTAMAL","menoua","027892M05","2005-06-27"],
["ULRICH SEDRIGUE MPEK","dynamo","032542M03","2003-07-10"],
["DIEUDONNE YANN MPITO BIENDE","fauve","049054M06","2006-01-03"],
["IVAN MVONDO OLAMA","colombe","005272M98","1998-12-13"],
["WILLY STEPHANE NAMEDJI","renard","000422M89","1989-04-04"],
["BRONDON NDAM TEBO","renard","076831M05","2005-09-05"],
["JOSEPH ALEXANDRE NDE","dynamo","006360M03","2003-09-19"],
["MARCO WILLIAM NDE","gazelle","088633M08","2008-02-15"],
["HERVAL JOEL NDEDI KINGUE","colombe","025243M97","1997-08-29"],
["CARDIO NWEFAR NDI","victoria","085860M09","2009-01-16"],
["NICOLAS NDIBI NIYOMO","coton","065396M10","2010-04-20"],
["BLAISE FUH NDIFORCHU","menoua","008652M97","1997-03-22"],
["JEAN ULRICH NDONG","dynamo","002804M01","2001-01-04"],
["LUC STEPHANE NDONG","menoua","001192M96","1996-07-17"],
["ARMEL CHRISTIAN NDONG NZE","canon","002443M99","1999-07-18"],
["ZACHARIE NDONGO FOE","canon","000328M98","1998-07-16"],
["FILDING NDONWIE","pwd","083275M99","1999-11-02"],
["JEAN PAUL NDOUNG","moungo","007900M01","2001-03-30"],
["SERGE VALERY NDZOMO ELOUNDOU","fortuna","050950M03","2003-04-10"],
["JUNIOR NEMI","dynamo","057750M06","2006-11-11"],
["GILBERT NEOSSI KAMENI","pwd","063342M05","2005-03-20"],
["KONRAD NFANSEU SINYAM","panthere","072437M05","2005-01-26"],
["TAMGWA NCHANJI NFOR GODWILL","pwd","067480M05","2005-07-23"],
["JOSEPH JACQUES NGA ESSOUE","moungo","000124M93","1993-06-12"],
["CHRISTIAN CARLOS NGA MVOGO","pwd","009875M02","2002-07-02"],
["MOUSTPHA NGAE A BISSENE","renard","077614M98","1998-09-21"],
["GILBERT HERMANN NGAFFA","unisport","003395M99","1999-06-12"],
["TONY CABREL NGALA YOUDOM","dynamo","086701M07","2007-01-24"],
["BRICE CABREL NGAMAKOUA","dynamo","027638M06","2006-09-13"],
["TONY JOAQUIM NGANI KAMENI","unisport","078256M08","2008-01-05"],
["TERENCE NGANKAM","unisport","001442M98","1998-01-27"],
["MATHIEU NGANSIRI","gazelle","051345M04","2004-03-13"],
["SAMUEL NZELLE NGOM ECHABE","menoua","024067M01","2001-05-08"],
["KANTIN DANE NGOMENI","fauve","022922M00","2000-08-16"],
["DAVID THEOPHANE NGONDO DISHONO","panthere","000217M92","1992-06-06"],
["STEVY DONALD NGONO EFFA","fortuna","041263M03","2003-03-03"],
["HOUBED RAMADAN NGOUBE ABOU","renard","038387M04","2004-11-22"],
["ALLAN FRED NGOUNOU NGOUDO","victoria","060347M06","2006-10-11"],
["LAURIAN NGUEFACK NGUEDIA","victoria","062099M06","2006-01-04"],
["JEAN PIERRE NGUELE NKOTTO","fortuna","074599M01","2001-06-03"],
["SAMUEL STEVE NGUELLE MBOM","pwd","056189M03","2003-03-03"],
["BERTIN NGUEMALEU","panthere","000301M89","1989-08-02"],
["TERENCE AMBE NGUFOR","pwd","006587M98","1998-08-30"],
["JUNIOR NGUIMBAT","pwd","002036M02","2002-04-13"],
["RENE EMMANUEL NGUIMBOUS","gazelle","085706M08","2008-01-18"],
["KADAD NING CHE BANG","pwd","033774M05","2005-12-01"],
["ANDRE LEDOUX JUNIOR NKONG","menoua","013377M03","2003-01-25"],
["ALEXANDRE NKONO","moungo","055360M03","2003-03-06"],
["SAMUEL NKONO KWEDI","fauve","072731M04","2004-06-20"],
["JUNIOR LANDRY Nkouam POLLA","renard","013414M03","2003-12-06"],
["MANUEL MAURICE NKOULOU","dynamo","013388M02","2002-09-04"],
["THOMAS LEGRAND NKUISSI TCHOUENKAM","renard","000410M90","1990-07-01"],
["STEPHANE NOAH","pwd","072460M07","2007-01-04"],
["SEBASTIEN NOAH ARNAUD","fortuna","055169M04","2004-03-22"],
["MARC JANVIER NOMO ONGUENE","panthere","001292M03","2003-01-03"],
["SAIDOU NOUHOU","gazelle","029021M04","2004-12-05"],
["JONATHAN STEVE NOUNDEM TSANGUE","renard","076641M01","2001-12-27"],
["MARC VIVEN NSENGUE NSENGUE","canon","063459M06","2006-04-14"],
["FABRICE NDEH NSOH","pwd","017528M03","2003-08-13"],
["LEONEL NTEBEU DJOKO","fauve","000142M97","1997-01-06"],
["LUCIEN SALOMON NTOLO NGUIAMBA","menoua","043721M07","2007-05-05"],
["STEVE SAMUEL NTOMB TONYE","victoria","092774M08","2008-06-15"],
["SAMUEL YANN NTOMBA","dynamo","029919M06","2006-08-20"],
["DANIEL STEVE RONEL NTONE MBAPPE","unisport","047823M08","2008-03-18"],
["FRANCK NTSAGUE","menoua","028988M01","2001-10-09"],
["DAVID ARNOLD NTSAMA NGOURE","moungo","004156M93","1993-06-02"],
["RANDY NTUWE KWALAR","colombe","000064M92","1992-03-29"],
["ISMAËL MICHEL NWOAGOU FANSU","menoua","047685M04","2004-04-07"],
["MEMOIRE STEPHANE NYAPIA TCHOUKALY","moungo","012257M05","2005-12-08"],
["JEAN DANIEL NYEMECK","moungo","064324M06","2006-09-21"],
["ROBERT NYENGUE ATSIGA","colombe","039431M04","2004-01-18"],
["BRAYAN SAMUEL NYETAM JUNIOR","dynamo","009328M03","2003-02-12"],
["ALBERT NYOBE","fortuna","092768M09","2009-04-21"],
["GUILIT KEVIN NZOKOU MOUAFO","fortuna","047557M02","2002-10-15"],
["JEAN CLAUDE LANDRY OBAM","fortuna","037242M05","2005-01-15"],
["BISAH ODRICK","pwd","008258M05","2005-03-26"],
["JEFTER ARREY ODUAK","dynamo","047695M05","2005-12-25"],
["RODRIGO JUNIOR OFON","dynamo","092781M09","2009-09-21"],
["FREDERICK GERARD OLINGA NTSAMA","panthere","039182M04","2004-09-27"],
["PAUL PASCAL OMBOLO","canon","060271M06","2006-04-14"],
["JEAN BAPTISTE ONANA","moungo","072339M98","1998-04-03"],
["JEAN PIERRE ONANA MVOGO","colombe","008872M98","1998-03-07"],
["MOREL FIMBU ONDOBO ABENA","fortuna","071659M07","2007-04-02"],
["ANGE GODSON ONDOUA","menoua","058092M01","2001-12-20"],
["FELIX OUKINE TCHEOUDE","coton","000105M99","1999-12-26"],
["SANDA OUMAROU","dynamo","043540M06","2006-01-31"],
["BILALI OURO-NIMINI","panthere","092736M98","1998-05-02"],
["JEAN OUSAMA","canon","082721M08","2008-11-01"],
["HOUSSEINI OUSMANOU","gazelle","038710M02","2002-12-28"],
["YANNIS DONALD OWONA","fortuna","083941M08","2008-08-27"],
["AMBROISE YAHNN SANCHEZ OWOUNDI EVOUNA","fauve","051620M06","2006-09-01"],
["ULRICH AUDREY PANGE LOBE","menoua","000795M97","1997-06-21"],
["JOEL PATEN","canon","051187M03","2003-12-10"],
["DZENNYAGHA SAAGUI MMBI AWAH MMBI","dynamo","000960M01","2001-12-12"],
["CYRIEN JOEL SAHA BIKIM","panthere","024075M99","1999-01-01"],
["SOULEY SAID ABOUBAKAR","gazelle","083157M08","2008-03-15"],
["MOÏSE SAKAVA SANGOLA","fauve","000084M00","2000-12-26"],
["HERMAN TCHAKOUNTE SANDJON","canon","017189M99","1999-01-28"],
["CONSTANT ARCEL SANGA SEPDJA","panthere","025293M02","2002-03-31"],
["MENGHEDZE ALAIN SIFOR DIDAN","pwd","028364M03","2003-09-28"],
["EDOUARD SOMBANG A MENANG","colombe","010301M98","1998-05-29"],
["ERIC CYRILLE SOMBISSI MESMEN","moungo","037774M05","2005-01-06"],
["MARTIN SONE LAURICE YONGUE","unisport","001741M88","1988-01-20"],
["SOULEMAN SOULEMAN","fauve","001204M98","1998-12-22"],
["MARC FERRERI SOUP NJANGO","moungo","028879M00","2000-05-20"],
["GILFRANCK STERLY PETO","victoria","084419M08","2008-03-21"],
["ELWOOD BANTER TALIKONG","pwd","066767M08","2008-05-30"],
["FRANCK DILANE TALLA","dynamo","073405M05","2005-12-24"],
["HERMAN TALLA","panthere","000555M91","1991-10-24"],
["LEON PIERRE JUNIOR TANG","unisport","073791M09","2009-08-25"],
["ANDRÉ TANGA NDZANA","menoua","049412M04","2004-12-06"],
["SOSTHENE TATHO MBOUZIKEU","unisport","013943M02","2002-10-07"],
["BRAYANN TCHAHA NANA","victoria","014340M03","2003-05-21"],
["DONALD PERRIN TCHAKOUNTE NZENZO","fortuna","071867M09","2009-04-06"],
["BRICE TCHAMABO","unisport","000157M93","1993-06-12"],
["DIVANE TCHAMENI TOMPE","unisport","059040M03","2003-08-12"],
["PRINCE KLARKY ALFAI TCHATAT NGANTSALA","victoria","037098M07","2007-01-13"],
["PRINCE WILFRIED TCHEMADJEU KAMANI","victoria","023413M06","2006-03-13"],
["BECKER BARUCHE TCHEUANI","unisport","072271M07","2007-11-08"],
["HENRY PAUL TCHIKEU","colombe","028283M00","2000-05-20"],
["GISLAIN TCHINDA","unisport","056164M04","2004-03-31"],
["RICHEPIN TCHOKOUAYA DJIPPATCHE","unisport","000125M93","1993-03-18"],
["DAN PRIESTLEY TCHONLAFI NZOFANG","panthere","007697M98","1998-02-11"],
["KINDE LEONALD TCHOUNGA","panthere","004414M95","1995-09-08"],
["LUC RIVALDO TEMFACK","menoua","005744M04","2004-01-11"],
["JAMES TENDOH ELTON","colombe","057019M06","2006-11-11"],
["SAMUEL WILLIAM TENGOH","moungo","015311M97","1997-08-24"],
["DAVE TESSA","gazelle","038626M04","2004-03-02"],
["JOSEPH ELIE TIBA MOUSSASSA","panthere","047617M05","2005-11-29"],
["ALPHONSE MARIE TIENTCHEU","unisport","000562M89","1989-09-04"],
["ARI TIENTE","fortuna","092729M05","2005-04-04"],
["JUNIOR TITICO FANGA","moungo","053199M06","2006-03-29"],
["CLAUDEL GILLESS TOCKO","dynamo","048107M06","2006-06-24"],
["JOSEPH JUNIOR TOMBI","canon","042856M02","2002-09-02"],
["MARC DIEUDONNE SERAPHIN TONYE KAK","fauve","012649M02","2002-07-12"],
["BEBETO TSAFACK","menoua","071736M06","2006-12-31"],
["MARC AUREL FREDY TSALA NDI","fortuna","092754M08","2008-03-11"],
["FRED UKAGWU NGASSAM","moungo","023182M97","1997-07-19"],
["KOLOTO VIVIEN FREDERIC","unisport","055593M05","2005-03-22"],
["GILDAS WAMAKA","panthere","076805M03","2003-03-06"],
["YANN ARTHUR WANDJOM YOUBI","victoria","062052M05","2005-02-04"],
["MITHERAND FRANCOIS WANRE DAIKREO","gazelle","002820M00","2000-07-03"],
["JOSEPH WANSI TIENTCHEU","fauve","039199M04","2004-05-18"],
["VICTOR WANYAMA","fortuna","050948M05","2005-09-12"],
["THEO MATTHEW WILLIAMS JR","panthere","083414M05","2005-12-17"],
["BRYAN RAMSES WIRSIY","menoua","072361M06","2006-01-16"],
["ARMIEL FRANCK YANDEME BIDIAS","unisport","054896M99","1999-11-12"],
["NDZI YAOUB","fauve","004455M01","2001-11-28"],
["RAPHAEL MARC YAPENDE","panthere","071638M02","2002-08-20"],
["FREDERIC ACHILLE YENANG 3","colombe","049399M04","2004-05-26"],
["ZACHARIE ARTHUR YENE","colombe","030278M02","2002-01-18"],
["EDEN CREOL YMELE","menoua","083484M06","2006-06-13"],
["LANDRY YOTCHOU YOTDEP","panthere","003527M99","1999-07-20"],
["KOUE YOUSSOUFA","gazelle","045859M06","2006-08-08"],
["IBRAHIM ZAKARI YAOU","gazelle","057304M06","2006-09-01"],
["YANN JUNIOR ZEH MENGUE","victoria","041471M05","2005-01-19"],
["OGINO ZEUKANG FOMEN","renard","031735M04","2004-09-26"],
["YVES AIME ZOA","canon","007079M98","1998-01-10"],
["JAMAL ABDEL ZOCK A ZOCK","fauve","053068M04","2004-12-24"],
["ETIENNE ROGER ZOCK ELANGA KEEDI","moungo","047935M03","2003-01-30"],
["DEVANE KELLER ZOKOU AWONO","victoria","087214M09","2009-02-14"]
];
// Correspondances entre les noms des buteurs publiés et les matricules FECAFOOT
const PALIAS={
  "Jules Armand Kooh":"023616M99",
  "Blaise Ndiforchu":"008652M97",
  "Patrick Edzimbi":"061304M05",
  "Jefter Arrey":"047695M05",
  "Achille Fokem":"000263M99",
  "Thorgan Essiane":"063447M04",
  "Vivien Koloto":"055593M05",
  "Solomon Asaah":"063404M05",
  "Carlos Yougouda":"051430M05",
  "Serge Daura":"058533M06",
  "Nsanfeu Konrad":"072437M05",
  "Junior Landry Nkouam":"013414M03"
};
const S25A={"023616M99":9};
const S24A={"058533M06":11};

const played=x=>x.hs!=null;
const fd=d=>d?new Date(d+"T12:00:00Z").toLocaleDateString("fr-FR",{weekday:"short",day:"numeric",month:"short",timeZone:"UTC"}):"Date à fixer";
function stand(){
  const R={};IDS.forEach(i=>R[i]={id:i,p:0,w:0,d:0,l:0,gf:0,ga:0,cs:0,f:[]});
  M.filter(played).sort((a,b)=>a.d<b.d?-1:1).forEach(x=>{
    [[x.h,x.hs,x.as],[x.a,x.as,x.hs]].forEach(([i,f,a])=>{const r=R[i];r.p++;r.gf+=f;r.ga+=a;if(a===0)r.cs++;
      const o=f>a?"W":f<a?"L":"D";r[o.toLowerCase()]++;r.f.push(o)});});
  return Object.values(R).map(r=>({...r,gd:r.gf-r.ga,pts:r.w*3+r.d})).sort((a,b)=>b.pts-a.pts||b.gd-a.gd||b.gf-a.gf||(a.id<b.id?-1:1)).map((r,i)=>({...r,pos:i+1}));
}
const ST=stand(), SB=Object.fromEntries(ST.map(r=>[r.id,r]));
const $=s=>document.querySelector(s), app=$("#app");
// Logos locaux : ajouter les nouveaux fichiers dans clubs/logos et clubs/icons, puis compléter ces deux tables.
// Les clubs absents de ces tables conservent automatiquement le sigle de secours.
const LOGO={coton:"clubs/logos/CotonSport.png",dynamo:"clubs/logos/Dynamo Douala.png",canon:"clubs/logos/Canon yaounde.png",colombe:"clubs/logos/Colombe.png",menoua:"clubs/logos/aigle royal.png",moungo:"clubs/logos/Aigle Moungo.png",unisport:"clubs/logos/Bafang.png",renard:"clubs/logos/Stade renard.png",panthere:"clubs/logos/Panthere.png",pwd:"clubs/logos/bamenda.png",victoria:"clubs/logos/Victoria United.png",gazelle:"clubs/logos/Gazelle.png",fauve:"clubs/logos/fauve azur elite.png",fortuna:"clubs/logos/fortuna Mfou.png"};
const ICON={coton:"clubs/icons/CotonSport.png",dynamo:"clubs/icons/Dynamo Douala.png",canon:"clubs/icons/Canon yaounde.png",colombe:"clubs/icons/Colombe.png",menoua:"clubs/icons/aigle royal.png",moungo:"clubs/icons/Aigle Moungo.png",unisport:"clubs/icons/Bafang.png",renard:"clubs/icons/Stade renard.png",panthere:"clubs/icons/Panthere.png",pwd:"clubs/icons/bamenda.png",victoria:"clubs/icons/Victoria United.png",gazelle:"clubs/icons/Gazelle.png",fauve:"clubs/icons/fauve azur.png",fortuna:"clubs/icons/fortuna Mfou.png"};
const crestMark=(c,i,z)=>{const src=z>=48?(LOGO[i]||ICON[i]):(ICON[i]||LOGO[i]);return src?`<img class="crest" src="${src}" alt="" style="--z:${z}px">`:`<span class="crest" style="--z:${z}px;background:${c.c}" aria-hidden="true">${c.s}</span>`};
const cr=(i,z=28)=>crestMark(C[i],i,z);
const tm=i=>`<span class="team">${cr(i)}<span>${C[i].n}</span></span>`;
const tmLink=i=>`<a class="team-link" href="#club-${i}">${tm(i)}</a>`;
const gdh=v=>`<span class="${v>0?"gp":v<0?"gn":""}">${v>0?"+":""}${v}</span>`;
const fm=f=>{const last=f.slice(-5),slots=Array(5-last.length).fill(null).concat(last);return `<span class="form">${slots.map(x=>`<i class="${x||"empty"}">${x?(x==="W"?"V":x==="D"?"N":"D"):"·"}</i>`).join("")}</span>`};
const jNo=l=>{const m=String(l).match(/J\D{0,12}(\d+)/i);return m?+m[1]:0};
const formFromGroups=(groups,id)=>{const out=[];groups.forEach(([label,rows],gi)=>{const j=jNo(label);rows.forEach(([h,a,hs,as],ri)=>{if(h!==id&&a!==id)return;const f=h===id?hs:as,ag=h===id?as:hs;out.push({j,gi,ri,o:f>ag?"W":f<ag?"L":"D"})})});return out.sort((a,b)=>a.j-b.j||a.gi-b.gi||a.ri-b.ri).map(x=>x.o).slice(-5)};
const H25_ROWS=H25_TABLE.map(([id,p,w,d,l,gf,ga,pts,z],i)=>({id,pos:i+1,p,w,d,l,gf,ga,gd:gf-ga,pts,z,f:formFromGroups(H25_RESULTS,id)}));
const score=x=>x.st==="PP"?`<span class="sc ns">Reporté</span>`:x.st==="UN"?`<span class="sc ns">Score à confirmer</span>`:played(x)?`<span class="sc">${x.hs} - ${x.as}</span>`:`<span class="sc ns">À venir</span>`;
const sn=i=>C[i].n.replace(/^Aigle Royal /,"Aigle ").replace(/ (Sportive|Douala|Yaoundé|Bafang)$/,"");
const mk=x=>`match-${x.j}-${x.h}-${x.a}`;
const tms=i=>`<span class="team" title="${C[i].n}">${cr(i,24)}<span class="nm">${C[i].s}</span></span>`;
const mc=x=>`<a class="mc" href="#${mk(x)}" title="${C[x.h].n} - ${C[x.a].n}"><span class="st">${x.d?fd(x.d):"Date à fixer"}${played(x)?" · Terminé":""}</span><span class="t">${cr(x.h,34)}<span class="nm">${C[x.h].s}</span></span>${score(x)}<span class="t">${cr(x.a,34)}<span class="nm">${C[x.a].s}</span></span></a>`;
const head=(t,s)=>`<h1>${t}</h1><p class="sub">${s||""}</p>`;
const leader=(t,rows,unit,note,empty)=>`<div class="card lb"><h3>${t}</h3>${rows.length?rows.map((r,i)=>`<div class="r"><span class="rk">${i+1}</span><span>${r.label}${r.sub?`<small>${r.sub}</small>`:""}</span><b>${r.v}</b></div>`).join(""):`<div class="note" style="padding:4px 16px 16px">${empty||"Pas encore de données."}</div>`}${note&&rows.length?`<div class="note" style="padding:0 16px 10px">${note}</div>`:""}</div>`;
const evs=()=>[].concat(...M.filter(x=>x.g).map(x=>x.g.map(g=>({m:x,min:g[0],p:g[1],t:g[2],a:g[3]}))));
const clubLabel=(id,name)=>C[id]?`<a class="stat-club-link" href="#club-${id}">${name||C[id].n}</a>`:(name||id);
const assistRows=()=>{const c={};evs().filter(e=>e.a).forEach(e=>{const k=e.a+"|"+e.t;c[k]=(c[k]||0)+1});return Object.entries(c).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([k,v])=>{const [p,t]=k.split("|");return {label:plink(p,pfid(p)),sub:clubLabel(t,C[t].n),v}})};
const scorerRows=()=>{const c={};evs().forEach(e=>{const k=e.p+"|"+e.t;c[k]=(c[k]||0)+1});return Object.entries(c).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([k,v])=>{const [p,t]=k.split("|");return {label:plink(p,pfid(p)),sub:clubLabel(t,C[t].n),v}})};
const EMPTY_A="Aucune passe décisive publiée en MTN Elite One 2026/27.";
const pfid=n=>PALIAS[n]||null;
const playerSlug=p=>pnorm(PN(p[0])).replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const playerSlugName=n=>pnorm(PN(n)).replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const knownPlayer=n=>ROSTER.some(p=>PN(p[0])===PN(n))||S25.some(p=>PN(p[0])===PN(n))||S24.some(p=>PN(p[0])===PN(n))||evs().some(e=>PN(e.p)===PN(n)||PN(e.a||"")===PN(n));
const playerBySlug=slug=>{const names=[...ROSTER.map(p=>PN(p[0])),...S25.map(p=>p[0]),...S24.map(p=>p[0]),...evs().flatMap(e=>[e.p,e.a].filter(Boolean))];return names.find(n=>playerSlugName(n)===slug)||null};
const playerHref=f=>{const p=ROSTER.find(x=>x[2]===f);if(p)return `#player-${playerSlug(p)}`;const name=Object.keys(PALIAS).find(n=>PALIAS[n]===f);return name&&knownPlayer(name)?`#player-${playerSlugName(name)}`:"#stats"};
const plink=(n,f)=>{if(f)return `<a class="plink" href="${playerHref(f)}">${n}</a>`;return knownPlayer(n)?`<a class="plink" href="#player-${playerSlugName(n)}">${n}</a>`:n};
function playerPreview(name){const roster=ROSTER.find(p=>PN(p[0])===PN(name)),goals=evs().filter(e=>PN(e.p)===PN(name)).length,assists=evs().filter(e=>PN(e.a||"")===PN(name)).length,old25=S25.find(p=>PN(p[0])===PN(name)),old24=S24.find(p=>PN(p[0])===PN(name)),club=roster?hC(roster[1]).n:old25?.[1]?hC(old25[1]).n:old24?.[1]?hC(old24[1]).n:"Club non précisé";
  return `${head(PN(name),club)}${followButton(`player:${playerSlugName(name)}`)}<div class="tiles3">${goals||old25?.[2]?`<div class="tile"><div class="k">Buts connus</div><div class="v">${goals||old25?.[2]||old24?.[2]||"—"}</div><div class="n">Données publiées</div></div>`:""}${assists?`<div class="tile"><div class="k">Passes décisives connues</div><div class="v">${assists}</div><div class="n">Matchs documentés</div></div>`:""}</div><div class="card psec" style="margin-top:16px"><h3>Profil</h3><div class="prow"><span>Club de référence</span><b class="txt">${club}</b></div>${roster?`<div class="prow"><span>Naissance</span><b class="txt">${pdob(roster[3])}</b></div>`:""}</div><p class="note">Ce joueur apparaît dans les données de la saison, mais son profil complet n’est pas encore renseigné.</p><a class="more" href="#stats">Retour au Centre de stats</a>`;
}
const S25R=()=>S25.map(s=>({label:plink(s[0],pfid(s[0])),sub:s[1]?clubLabel(s[1],hC(s[1]).n):"Club non précisé",v:s[2]}));
const hC=i=>C[i]||HC[i];
const hcr=(i,z=28)=>crestMark(hC(i),i,z);
const htm=i=>`<span class="team">${hcr(i,24)}<span>${hC(i).n}</span></span>`;
const S24R=()=>S24.map(s=>({label:plink(s[0],pfid(s[0])),sub:clubLabel(s[1],hC(s[1]).n),v:s[2]}));
const hResults=groups=>`<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(min(340px,100%),1fr))">${groups.map(([label,rows])=>`<div><div class="dl" style="margin:0 0 6px">${label}</div><div class="card hres">${rows.map(([h,a,hs,as])=>`<div class="mrow"><div class="h">${C[h]?tmLink(h):htm(h)}</div><span class="sc">${hs} - ${as}</span>${C[a]?tmLink(a):htm(a)}</div>`).join("")}</div></div>`).join("")}</div>`;
// Effectifs FECAFOOT
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const safeHttpHref=value=>{try{const url=new URL(String(value),location.origin);return ["http:","https:"].includes(url.protocol)?esc(url.href):""}catch{return""}};
let ddBound=false;
function enhanceSelects(root=document){
  if(!ddBound){
    ddBound=true;
    document.addEventListener("click",e=>{
      if(e.target.closest(".dd"))return;
      document.querySelectorAll(".dd.open").forEach(d=>{d.classList.remove("open");const b=d.querySelector(".dd-btn");if(b)b.setAttribute("aria-expanded","false")});
    });
    document.addEventListener("keydown",e=>{
      if(e.key!=="Escape")return;
      document.querySelectorAll(".dd.open").forEach(d=>{d.classList.remove("open");const b=d.querySelector(".dd-btn");if(b)b.setAttribute("aria-expanded","false")});
    });
  }
  root.querySelectorAll("select").forEach(sel=>{
    if(sel.dataset.dd||sel.closest(".dd"))return;
    sel.dataset.dd="1";
    const wrap=document.createElement("div");wrap.className="dd";
    const btn=document.createElement("button");btn.type="button";btn.className="dd-btn";btn.setAttribute("aria-haspopup","listbox");btn.setAttribute("aria-expanded","false");
    const label=sel.getAttribute("aria-label");if(label)btn.setAttribute("aria-label",label);
    btn.innerHTML='<span class="dd-val"></span><span class="dd-arrow" aria-hidden="true"></span>';
    const menu=document.createElement("div");menu.className="dd-menu";menu.setAttribute("role","listbox");if(label)menu.setAttribute("aria-label",label);
    sel.parentNode.insertBefore(wrap,sel);wrap.appendChild(btn);wrap.appendChild(menu);wrap.appendChild(sel);
    sel.tabIndex=-1;sel.setAttribute("aria-hidden","true");
    const val=btn.querySelector(".dd-val");
    const close=()=>{wrap.classList.remove("open");btn.setAttribute("aria-expanded","false")};
    const sync=()=>{const o=sel.options[sel.selectedIndex];val.textContent=o?o.textContent:"";btn.disabled=sel.disabled;menu.querySelectorAll(".dd-opt").forEach(x=>x.setAttribute("aria-selected",x.dataset.v===sel.value?"true":"false"))};
    const build=()=>{menu.innerHTML=Array.from(sel.options).map(o=>`<button type="button" class="dd-opt" role="option" data-v="${esc(o.value)}" aria-selected="${o.value===sel.value}">${esc(o.textContent)}</button>`).join("")};
    const items=()=>[...menu.querySelectorAll(".dd-opt")];
    const focusAt=i=>{const a=items();if(!a.length)return;a[Math.max(0,Math.min(i,a.length-1))].focus()};
    const open=()=>{
      if(btn.disabled)return;
      document.querySelectorAll(".dd.open").forEach(d=>{if(d===wrap)return;d.classList.remove("open");const b=d.querySelector(".dd-btn");if(b)b.setAttribute("aria-expanded","false")});
      build();wrap.classList.add("open");btn.setAttribute("aria-expanded","true");
      const i=items().findIndex(x=>x.getAttribute("aria-selected")==="true");focusAt(i<0?0:i);
    };
    btn.addEventListener("click",()=>{wrap.classList.contains("open")?close():open()});
    btn.addEventListener("keydown",e=>{
      if(!["ArrowDown","ArrowUp","Enter"," "].includes(e.key))return;
      e.preventDefault();
      if(!wrap.classList.contains("open"))open();
      const a=items();const i=a.indexOf(document.activeElement);
      if(e.key==="ArrowUp")focusAt(i<0?0:i-1);
      else if(e.key==="ArrowDown")focusAt(i<0?0:i+1);
    });
    menu.addEventListener("keydown",e=>{
      const a=items();const i=a.indexOf(document.activeElement);
      if(e.key==="ArrowDown"){e.preventDefault();focusAt(i+1)}
      else if(e.key==="ArrowUp"){e.preventDefault();focusAt(i-1)}
      else if(e.key==="Home"){e.preventDefault();focusAt(0)}
      else if(e.key==="End"){e.preventDefault();focusAt(a.length-1)}
      else if(e.key==="Escape"){e.preventDefault();close();btn.focus()}
      else if(e.key==="Tab"){close()}
    });
    menu.addEventListener("click",e=>{
      const o=e.target.closest(".dd-opt");if(!o)return;
      sel.value=o.dataset.v;sync();close();btn.focus();sel.dispatchEvent(new Event("change",{bubbles:true}));
    });
    sel.addEventListener("change",sync);sync();
  });
}
const PN=n=>n.toLowerCase().split(/([\s-]+)/).map(w=>/^(ii|iii|iv|jr)$/.test(w)?w.toUpperCase():w.replace(/^([a-zà-ÿ])/,c=>c.toUpperCase())).join("");
const pnorm=s=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const pdob=d=>d?new Date(d+"T12:00:00Z").toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:"numeric",timeZone:"UTC"}):"n.d.";
const pag=(d,s)=>{if(!d)return"—";const base=s==="24"?"2024-08-01":s==="26"?TODAY:"2025-08-01";const b=new Date(base+"T12:00:00Z"),n=new Date(d+"T12:00:00Z");let a=b.getUTCFullYear()-n.getUTCFullYear();const m=b.getUTCMonth()-n.getUTCMonth();if(m<0||(m===0&&b.getUTCDate()<n.getUTCDate()))a--;return a};
const rClub=i=>ROSTER.filter(p=>p[1]===i);
const rSort=ps=>ps.slice().sort((a,b)=>PN(a[0]).localeCompare(PN(b[0]),"fr"));
function rosterArchive(season){
  const s=season==="24"?"24":"25";
  const ids=[...new Set(ROSTER.map(p=>p[1]))].sort((a,b)=>hC(a).n.localeCompare(hC(b).n,"fr"));
  return `<div class="sec-h"><h2>Effectifs ${s==="24"?"2024-25":"2025-26"}</h2><span class="note">${ROSTER.length} joueurs · ${ids.length} clubs</span></div>
  <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(min(250px,100%),1fr))">${ids.map(i=>{const ps=rSort(rClub(i));return `<details class="rd"><summary>${hcr(i,26)}<span>${hC(i).n}</span><span class="cnt">${ps.length}</span></summary><div class="rl">${ps.map(p=>`<span><a class="plink" href="${playerHref(p[2])}">${PN(p[0])}</a></span>`).join("")}</div></details>`}).join("")}</div>
  <p class="note">${s==="24"?"Effectifs FECAFOOT 2025/2026 utilisés pour 2024-25 : aucun effectif distinct n'est fourni pour cette saison.":"Source : FECAFOOT, saison 2025/2026."} Postes, numéros et nationalités ne figurent pas dans la source.</p>`;
}
function rosterTableHtml(){
  const s=SS.season||"25", club=SS.pClub||"all", q=pnorm((SS.pQuery||"").trim());
  const ps=ROSTER.filter(p=>(club==="all"||p[1]===club)&&(!q||pnorm(PN(p[0])).includes(q)))
    .sort((a,b)=>a[1]===b[1]?PN(a[0]).localeCompare(PN(b[0]),"fr"):hC(a[1]).n.localeCompare(hC(b[1]).n,"fr"));
  const clubs=new Set(ps.map(p=>p[1])).size;
  return `<div class="card rscroll"><table><thead><tr><th class="l">Joueur</th><th class="l">Club</th><th>Âge</th></tr></thead><tbody>${ps.map(p=>`<tr><td class="l"><a class="pname plink" href="${playerHref(p[2])}">${PN(p[0])}</a></td><td class="l"><span class="team">${hcr(p[1],22)}<span>${hC(p[1]).n}</span></span></td><td>${pag(p[3],s)} ans</td></tr>`).join("")}</tbody></table></div>
  <p class="note">${ps.length} joueur${ps.length>1?"s":""} · ${clubs} club${clubs>1?"s":""}${q?` · recherche « ${esc((SS.pQuery||"").trim())} »`:""} · ${s==="24"?"Effectif de référence 2025/2026 utilisé pour 2024-25.":"Source : FECAFOOT, saison 2025/2026."} Postes, numéros et nationalités non renseignés.</p>`;
}
function rosterPanel(){
  const s=SS.season||"25", club=SS.pClub||"all";
  const ids=[...new Set(ROSTER.map(p=>p[1]))].sort((a,b)=>hC(a).n.localeCompare(hC(b).n,"fr"));
  return `<div class="sec-h" style="margin-top:22px"><h2>Effectifs</h2><span class="note">${s==="24"?"Saison 2024-25":"Saison 2025-26"}</span></div>
  <div class="tabs" role="group" aria-label="Saison des effectifs"><button class="tab" data-ps="25" aria-pressed="${s==="25"}">2025-26</button><button class="tab" data-ps="24" aria-pressed="${s==="24"}">2024-25</button></div>
  <div class="filters"><select id="rpclub" aria-label="Club"><option value="all">Tous les clubs</option>${ids.map(i=>`<option value="${i}" ${club===i?"selected":""}>${hC(i).n} (${rClub(i).length})</option>`).join("")}</select><input id="rpq" type="search" placeholder="Rechercher un joueur" aria-label="Rechercher un joueur" value="${esc(SS.pQuery||"")}"></div>
  <div id="rpbody">${rosterTableHtml()}</div>`;
}
function bindRosterPanel(){
  const b=$("#rpbody"); if(!b)return;
  enhanceSelects(document);
  document.querySelectorAll("[data-ps]").forEach(e=>e.onclick=()=>{SS.season=e.dataset.ps;statsBody()});
  const c=$("#rpclub"),q=$("#rpq");
  if(c)c.onchange=()=>{SS.pClub=c.value;b.innerHTML=rosterTableHtml()};
  if(q)q.oninput=()=>{SS.pQuery=q.value;b.innerHTML=rosterTableHtml()};
}

const topN=(key,n=5)=>[...ST].sort((a,b)=>b[key]-a[key]||b.pts-a.pts).slice(0,n).map(r=>({label:`<a class="stat-club-link" href="#club-${r.id}">${tm(r.id)}</a>`,v:r[key]}));
const topLow=(key,n=5)=>[...ST].filter(r=>r.p>0).sort((a,b)=>a[key]-b[key]||b.pts-a.pts).slice(0,n).map(r=>({label:`<a class="stat-club-link" href="#club-${r.id}">${tm(r.id)}</a>`,v:r[key]}));
const next=i=>M.find(x=>!played(x)&&x.st==="NS"&&(x.h===i||x.a===i));

const V={};
V.compte=()=>{
  const p=getPrefs(), followed=p.followed||[], alerts=p.alerts||[], saved=(p.savedEvents||[]).map(id=>M.find(m=>mk(m)===id)).filter(Boolean), alerted=(p.matchAlerts||[]).map(id=>M.find(m=>mk(m)===id)).filter(Boolean), followedPlayers=followed.filter(x=>x.startsWith("player:")).map(x=>playerBySlug(x.slice(7))).filter(Boolean), playerTeams=followedPlayers.map(n=>ROSTER.find(p=>PN(p[0])===PN(n))?.[1]||evs().find(e=>PN(e.p)===PN(n)||PN(e.a||"")===PN(n))?.t).filter(Boolean), followMatches=M.filter(m=>m.st==="NS"&&(followed.includes(`club:e1:${m.h}`)||followed.includes(`club:e1:${m.a}`)||playerTeams.includes(m.h)||playerTeams.includes(m.a)));
  return `${head("Votre espace Simba Stat","Retrouvez les clubs que vous suivez et les alertes qui comptent pour vous.")}
  <section class="account-shell" id="accountShell"><div class="account-story"><div><span class="kicker">Simba Stat · Votre football, à vous</span><h1>Restez au cœur du jeu.</h1><p>Suivez vos clubs, gardez vos repères et retrouvez vos préférences sur vos appareils.</p></div><span class="brand-note">Le football camerounais, raconté par les données.</span></div>
  <div class="auth-panel"><div class="auth-tabs" role="tablist" aria-label="Accès au compte"><button type="button" data-auth="login" aria-pressed="true">Connexion</button><button type="button" data-auth="register" aria-pressed="false">Créer un compte</button></div><h2 id="authTitle">Ravi de vous revoir</h2><p id="authIntro">Connectez-vous pour retrouver vos clubs et alertes.</p><form class="auth-form" id="accountForm"><label>Adresse e-mail<input name="email" type="email" autocomplete="email" placeholder="vous@exemple.com" required maxlength="254"></label><label>Mot de passe<input name="password" type="password" autocomplete="current-password" placeholder="Votre mot de passe" required></label><button class="btn" type="submit" id="authSubmit">Me connecter</button><p id="accountMessage" class="auth-message" role="status"></p></form><p class="anon-note">Vous préférez regarder d’abord ? <a class="more" href="#accueil">Continuer sans compte</a></p></div></section>
  <section class="account-settings" id="accountSettings" hidden><div class="sec-h"><div><h2>Mon espace Simba Stat</h2><span class="note" id="accountEmail"></span></div><button id="logoutBtn" type="button" class="tab">Se déconnecter</button></div><div class="pgrid"><section class="card psec"><h3>Équipes suivies</h3><p class="note">Sélectionnez les clubs à retrouver en premier.</p><div class="follow-list" id="followTeams" role="group" aria-label="Clubs suivis">${IDS.map(id=>`<label class="follow-option"><span>${C[id].n}<small>MTN Elite One</small></span><input type="checkbox" data-follow-option value="club:e1:${id}" ${followed.includes(`club:e1:${id}`)?"checked":""}></label>`).join("")}${(E2DATA?.clubs||[]).map(c=>`<label class="follow-option"><span>${c.name}<small>MTN Elite Two</small></span><input type="checkbox" data-follow-option value="club:e2:${c.id}" ${followed.includes(`club:e2:${c.id}`)?"checked":""}></label>`).join("")}</div><p class="note" id="prefMessage" role="status">Vos choix restent privés sur cet appareil. Créez un compte pour les retrouver ailleurs.</p></section><section class="card psec"><h3>Alertes de compétition</h3><p class="note">Choisissez les compétitions qui vous intéressent.</p><label class="prow" for="alertE1"><span>MTN Elite One</span><input id="alertE1" type="checkbox" ${alerts.includes("elite-one")?"checked":""}></label><label class="prow" for="alertE2"><span>MTN Elite Two</span><input id="alertE2" type="checkbox" ${alerts.includes("elite-two")?"checked":""}></label><label class="prow" for="notify"><span>Notifications sur cet appareil</span><input id="notify" type="checkbox" ${p.notifications?"checked":""}></label></section></div>${followedPlayers.length?`<div class="sec-h" style="margin-top:24px"><h2>Joueurs suivis</h2></div><div class="card">${followedPlayers.map(n=>`<a class="prow" href="#player-${playerSlugName(n)}"><span>${n}</span><b>→</b></a>`).join("")}</div>`:""}<div class="sec-h" style="margin-top:24px"><h2>Prochains matchs de mes équipes</h2></div><div class="card">${followMatches.length?followMatches.map(m=>`<a class="mrow" href="#${mk(m)}"><span>${C[m.h].n}</span><b>${m.d?fd(m.d):"Date à fixer"}</b><span>${C[m.a].n}</span><small>Journée ${m.j}</small></a>`).join(""):`<div class="empty">Les prochains matchs de vos équipes apparaîtront ici dès que le calendrier sera publié.</div>`}</div><div class="sec-h" style="margin-top:24px"><h2>Matchs enregistrés</h2></div><div class="card">${saved.length?saved.map(m=>`<a class="mrow" href="#${mk(m)}"><span>${C[m.h].n}</span><b class="sc">${played(m)?`${m.hs} - ${m.as}`:"À venir"}</b><span>${C[m.a].n}</span><small>Journée ${m.j}</small></a>`).join(""):`<div class="empty">Enregistrez un match depuis sa page pour le retrouver ici.</div>`}</div><div class="sec-h" style="margin-top:24px"><h2>Alertes de matchs à venir</h2></div><div class="card">${alerted.length?alerted.map(m=>`<a class="mrow" href="#${mk(m)}"><span>${C[m.h].n}</span><b>Journée ${m.j} · ${m.d?fd(m.d):"Date à fixer"}</b><span>${C[m.a].n}</span></a>`).join(""):`<div class="empty">Activez une alerte depuis la page d’un match à venir.</div>`}</div></section>`;
};
V.accueil=()=>{
  const lead=ST[0], recent=M.filter(x=>x.j===3), upc=M.filter(x=>x.j===4);
  const goals=M.filter(played).reduce((s,x)=>s+x.hs+x.as,0), n=M.filter(played).length, avg=n?(goals/n).toFixed(2).replace(".",","):"—";
  const e2Played=(E2DATA?.matches||[]).filter(x=>x.status==="played"), e2Round=Math.max(0,...e2Played.map(x=>x.round)), e2Recent=e2Played.filter(x=>x.round===e2Round).slice(0,5), e2Table=e2Standings(), e2Lead=e2Table[0], e2Goals=e2Played.reduce((sum,x)=>sum+x.homeScore+x.awayScore,0), e2Avg=e2Played.length?(e2Goals/e2Played.length).toFixed(2).replace(".",","):"—";
  return `<section class="hero">
    <a class="lead" href="#classement"><span class="kicker">À la une · Journée 3</span><h1>${C[lead.id].n} prend la tête</h1>
      <p>Un 4-0 contre Stade Renard à Mbouda porte l'équipe à ${lead.pts} points après trois journées de MTN Elite One.</p><span class="btn">Voir le classement</span></a>
    <div class="stories">
      <a class="story" href="#matchs"><span class="kicker">Journée 3</span><h3>Coton Sport gagne 3-1 à Dynamo</h3><p>Deuxième victoire en deux matchs joués pour Coton Sport.</p></a>
      <a class="story" href="#club-abong"><span class="kicker">Promu</span><h3>Abong-Mbang retrouve l’Elite One</h3><p>Le club a débuté sa saison par un nul 2-2 face à Stade Renard.</p></a>
      <a class="story" href="#matchs"><span class="kicker">Calendrier</span><h3>Deux matchs à rejouer</h3><p>Gazelle FA – Colombe (J1) et Coton Sport – Colombe (J2) ont été reportés.</p></a>
    </div></section>

  <section class="sec"><div class="sec-h"><h2>Matchs MTN Elite One</h2><a class="more" href="#matchs">Toutes les ligues</a></div>
    <div class="dl" style="margin:0 2px 6px">Journées 3 et 4 · 2026/27</div>
    <div class="strip">${[...recent,...upc].map(mc).join("")}</div></section>

  <section class="sec"><div class="sec-h"><h2>MTN Elite Two</h2><a class="more" href="#classement" data-league-target="e2">Voir le classement</a></div>
    <div class="dl" style="margin:0 2px 6px">${e2Played.length?`Résultats confirmés · Journée ${e2Round}`:"Données en cours de collecte"} · 2026/27</div>
    ${e2Recent.length?`<div class="strip">${e2Recent.map(x=>{const name=id=>E2DATA.clubs.find(c=>c.id===id)?.name||id;return `<a class="mc" href="#matchs"><span class="st">Journée ${esc(x.round)} · Résultat confirmé</span><span class="t">${esc(name(x.home))}</span><span class="sc">${esc(x.homeScore)} - ${esc(x.awayScore)}</span><span class="t">${esc(name(x.away))}</span></a>`}).join("")}</div>`:`<div class="card empty">Les résultats d’Elite Two apparaîtront ici dès leur confirmation.</div>`}
    <div class="tiles3" style="margin-top:12px">${E2DATA&&e2Lead?`<div class="tile"><div class="k">Leader · Elite Two</div><div class="v" style="font-size:22px">${esc(e2Lead.name)}</div><div class="n">${esc(e2Lead.pts)} points · ${esc(e2Lead.p)} matchs</div></div><div class="tile"><div class="k">Buts dans la ligue · Elite Two</div><div class="v">${e2Goals}</div><div class="n">sur ${e2Played.length} matchs confirmés</div></div><div class="tile"><div class="k">Buts par match · Elite Two</div><div class="v">${esc(e2Avg)}</div><div class="n">résultats confirmés</div></div>`:`<div class="tile"><div class="k">Leader · Elite Two</div><div class="v">—</div><div class="n">En attente de résultats confirmés</div></div><div class="tile"><div class="k">Buts dans la ligue · Elite Two</div><div class="v">—</div><div class="n">En attente de résultats confirmés</div></div><div class="tile"><div class="k">Buts par match · Elite Two</div><div class="v">—</div><div class="n">En attente de résultats confirmés</div></div>`}</div></section>

  <section class="sec"><div class="sec-h"><h2>Classement MTN Elite One</h2><a class="more" href="#classement">Toutes les ligues</a></div>
    <div class="dl" style="margin:0 2px 6px">Après la journée 3</div>
    ${tableHtml(ST.slice(0,6),true)}</section>

  <section class="sec"><div class="sec-h"><h2>Centre de stats</h2><a class="more" href="#stats">Voir toutes les stats</a></div>
    <div class="dl" style="margin:0 2px 6px">MTN Elite One · 2026/27</div>
    <div class="swipe">${leader("Meilleurs buteurs",scorerRows(),"","Buteurs recensés dans les feuilles de match.","Aucun buteur recensé.")}${leader("Meilleurs passeurs",assistRows(),"","",EMPTY_A)}${leader("Clean sheets · gardiens",[],"","","Statistiques des gardiens à venir.")}${leader("Meilleure attaque · clubs",topN("gf",4))}${leader("Meilleure défense · clubs",topLow("ga",4))}</div>
    </section>

  <section class="sec"><div class="sec-h"><h2>La saison en chiffres</h2></div>
    <div class="dl" style="margin:0 2px 6px">MTN Elite One · 2026/27</div>
    <div class="tiles3">
      <div class="tile"><div class="k">Leader</div><div class="v" style="font-size:22px">${C[lead.id].n}</div><div class="n">${lead.pts} points</div></div>
      <div class="tile"><div class="k">Buts marqués dans la ligue</div><div class="v">${goals}</div><div class="n">sur ${n} matchs joués</div></div>
      <div class="tile"><div class="k">Buts par match</div><div class="v">${avg}</div><div class="n">en moyenne</div></div>
    </div>
    <div class="dl" style="margin:14px 2px 6px">MTN Elite Two · 2026/27 · résultats confirmés</div>
    <div class="tiles3">${E2DATA&&e2Lead?`<div class="tile"><div class="k">Leader</div><div class="v" style="font-size:22px">${esc(e2Lead.name)}</div><div class="n">${esc(e2Lead.pts)} points · ${esc(e2Lead.p)} matchs</div></div><div class="tile"><div class="k">Buts marqués dans la ligue</div><div class="v">${e2Goals}</div><div class="n">sur ${e2Played.length} matchs joués</div></div><div class="tile"><div class="k">Buts par match</div><div class="v">${esc(e2Avg)}</div><div class="n">moyenne des scores confirmés</div></div>`:`<div class="tile"><div class="k">Leader</div><div class="v">—</div><div class="n">En attente de résultats confirmés</div></div><div class="tile"><div class="k">Buts marqués dans la ligue</div><div class="v">—</div><div class="n">En attente de résultats confirmés</div></div><div class="tile"><div class="k">Buts par match</div><div class="v">—</div><div class="n">En attente de résultats confirmés</div></div>`}</div><p class="note">Ces chiffres sont calculés à partir des matchs confirmés. Le match AS FAP – AS Fortuna (J1), dont le score reste à confirmer, et les pronostics sont exclus.</p></section>`;
};
function tableHtml(rows,mini){
  return `<div class="card scroll"><table><thead><tr><th>Pos</th><th class="l">Club</th><th>J</th><th class="hide-s">G</th><th class="hide-s">N</th><th class="hide-s">P</th><th class="hide-s">BP</th><th class="hide-s">BC</th><th>Diff</th><th>Pts</th>${mini?"":`<th class="hide-s">Forme</th><th class="hide-s">Prochain</th>`}</tr></thead><tbody>${rows.map(r=>{const nx=next(r.id);
    return `<tr class="link ${r.pos===1?"z1":r.pos>=13?"zr":""}" data-club-row="${esc(r.id)}"><td><span class="pos">${r.pos}</span></td><td class="l">${tmLink(r.id)}</td><td>${r.p}</td><td class="hide-s">${r.w}</td><td class="hide-s">${r.d}</td><td class="hide-s">${r.l}</td><td class="hide-s">${r.gf}</td><td class="hide-s">${r.ga}</td><td>${gdh(r.gd)}</td><td class="pts">${r.pts}</td>${mini?"":`<td class="hide-s">${fm(r.f)}</td><td class="hide-s">${nx?cr(nx.h===r.id?nx.a:nx.h,24):""}</td>`}</tr>`}).join("")}</tbody></table></div>`;
}
function archiveTable(rows,form=true){
  return `<div class="card scroll"><table><thead><tr><th>Pos</th><th class="l">Club</th><th>J</th><th class="hide-s">G</th><th class="hide-s">N</th><th class="hide-s">P</th><th class="hide-s">BP</th><th class="hide-s">BC</th><th>Diff</th><th>Pts</th>${form?`<th class="hide-s">Forme</th>`:""}</tr></thead><tbody>${rows.map(r=>`<tr class="${r.z==="C"?"z1":r.z==="R"?"zr":""}"><td><span class="pos">${r.pos}</span></td><td class="l">${C[r.id]?tmLink(r.id):htm(r.id)}</td><td>${r.p}</td><td class="hide-s">${r.w}</td><td class="hide-s">${r.d}</td><td class="hide-s">${r.l}</td><td class="hide-s">${r.gf}</td><td class="hide-s">${r.ga}</td><td>${gdh(r.gd)}</td><td class="pts">${r.pts}</td>${form?`<td class="hide-s">${fm(r.f)}</td>`:""}</tr>`).join("")}</tbody></table></div>`;
}
const CLS={season:"26",league:"e1"};
const CLS_TABS=[["26","2026/27"],["25","2025/26"],["24","2024/25"]];
function e2Standings(data=E2DATA){
  if(!data?.clubs)return[];
  const rows={};data.clubs.forEach(c=>rows[c.id]={id:c.id,name:c.name,p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0});
  (data.matches||[]).filter(m=>m.status==="played"&&Number.isInteger(m.homeScore)&&Number.isInteger(m.awayScore)).forEach(m=>{const h=rows[m.home],a=rows[m.away];if(!h||!a)return;h.p++;a.p++;h.gf+=m.homeScore;h.ga+=m.awayScore;a.gf+=m.awayScore;a.ga+=m.homeScore;if(m.homeScore>m.awayScore){h.w++;h.pts+=3;a.l++}else if(m.homeScore<m.awayScore){a.w++;a.pts+=3;h.l++}else{h.d++;a.d++;h.pts++;a.pts++}});
  return Object.values(rows).sort((a,b)=>b.pts-a.pts||(b.gf-b.ga)-(a.gf-a.ga)||b.gf-a.gf||a.name.localeCompare(b.name,"fr"));
}
V.classement=()=>{
  const leagues=`<div class="tabs" role="group" aria-label="Compétition"><button class="tab" data-league="e1" aria-pressed="${CLS.league==="e1"}">MTN Elite One</button><button class="tab" data-league="e2" aria-pressed="${CLS.league==="e2"}">MTN Elite Two</button></div>`;
  if(CLS.league==="e2"){
    if(!E2DATA)return head("Classement","MTN Elite Two · 2026/27")+leagues+`<div class="card empty">Chargement des données Elite Two…</div>`;
    const standings=e2Standings();
    return head("Classement","MTN Elite Two · 2026/27 · classement calculé sur les résultats confirmés")+leagues+`<div class="card scroll"><table><thead><tr><th>#</th><th class="l">Club</th><th>J</th><th>G</th><th>N</th><th>P</th><th>BP</th><th>BC</th><th>Diff.</th><th>Pts</th></tr></thead><tbody>${standings.map((r,i)=>`<tr><td>${i+1}</td><td class="l"><a class="team-link" href="#e2club-${r.id}">${r.name}</a></td><td>${r.p}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td><td>${r.gf}</td><td>${r.ga}</td><td>${r.gf-r.ga>0?"+":""}${r.gf-r.ga}</td><td class="pts">${r.pts}</td></tr>`).join("")}</tbody></table></div><p class="note">Les positions à égalité suivent points, différence de buts puis buts marqués. Un résultat non confirmé n’entre pas dans le calcul.</p>`;
  }
  const tabs=`<div class="tabs" role="group" aria-label="Saison">${CLS_TABS.map(([v,l])=>`<button class="tab" data-cls="${v}" aria-pressed="${CLS.season===v}">${l}</button>`).join("")}</div>`;
  if(CLS.season==="25") return head("Classement","MTN Elite One 2025/26, classement final.")+leagues+tabs+archiveTable(H25_ROWS)+
    `<div class="legend"><span><i style="background:var(--accent)"></i>Champion</span><span><i style="background:var(--red)"></i>Relégation en Elite Two</span></div>
    <p class="note">Forme : derniers résultats publiés de la compétition (J23 et J26). La source ne fournit pas les cinq derniers matchs de chaque club.</p>`;
  if(CLS.season==="24") return head("Classement","MTN Elite One 2024/25.")+leagues+tabs+
    `<div class="card empty">Le classement final 2024/25 n’est pas disponible.</div>
    <p class="note">Les résultats conservés sont incomplets : la journée 15 manque et plusieurs journées ne recensent pas tous les matchs. Retrouvez-les dans Centre de stats → Archives.</p>`;
  return head("Classement","MTN Elite One 2026/27, après la journée 3. Le nombre de matchs joués varie : deux matchs sont reportés.")+leagues+tabs+tableHtml(ST)+
    `<div class="legend"><span><i style="background:var(--accent)"></i>Leader</span><span><i style="background:var(--red)"></i>Relégation en Elite Two (13e et 14e)</span></div>
`;
};

const F={tab:"e1",j:CUR,club:"all"};
let E2DATA=null;
function e2ClubPage(id){
  const club=E2DATA?.clubs.find(c=>c.id===id);if(!club)return head("Club","MTN Elite Two · 2026/27")+`<div class="card empty">Les informations de ce club ne sont pas disponibles.</div>`;
  const matches=E2DATA.matches.filter(m=>m.home===id||m.away===id).sort((a,b)=>a.round-b.round),nameOf=key=>E2DATA.clubs.find(c=>c.id===key)?.name||key;
  return `<section class="chead"><span class="kicker">MTN Elite Two · ${esc(E2DATA.competition.season)}</span><h1>${esc(club.name)}</h1><p>Résultats confirmés et matchs publiés pour ce club.</p>${followButton(`club:e2:${id}`)} <a class="btn" href="#classement">Voir le classement</a></section><div class="sec-h" style="margin-top:24px"><h2>Matchs</h2><a class="more" href="#matchs">Calendrier complet</a></div><div class="card">${matches.length?matches.map(m=>`<a class="mrow" href="#matchs"><span>${esc(nameOf(m.home))}</span><b class="sc">${m.status==="played"?`${m.homeScore} - ${m.awayScore}`:m.status==="projected"?"Pronostic":"À confirmer"}</b><span>${esc(nameOf(m.away))}</span><small>Journée ${m.round}</small></a>`).join(""):`<div class="empty">Aucun résultat confirmé pour ce club.</div>`}</div><p class="note">Les statistiques détaillées et l’effectif de ce club ne sont pas encore publiés.</p>`;
}
simbaApi.eliteTwo().then(d=>{E2DATA=d;if(F.tab==="e2")matchBody();if(location.hash==="#accueil"||(CLS.league==="e2"&&location.hash==="#classement")||(CL.tab==="e2"&&location.hash==="#clubs")||location.hash==="#compte"||location.hash.startsWith("#e2club-"))route()}).catch(()=>{});
V.matchs=()=>head("Matchs","")+`<div class="tabs" role="group" aria-label="Compétition"><button class="tab" data-t="e1" aria-pressed="${F.tab==="e1"}">Elite One</button><button class="tab" data-t="e2" aria-pressed="${F.tab==="e2"}">Elite Two</button></div><div id="mbody"></div>`;
const rowHtml=x=>`<a class="mrow" href="#${mk(x)}"><div class="h">${tms(x.h)}</div>${score(x)}${tms(x.a)}${x.v?`<div class="meta">${x.v}</div>`:""}</a>`;
function matchBody(){
  const b=$("#mbody"); if(!b) return;
  if(F.tab==="e2"){
    if(!E2DATA){b.innerHTML=`<div class="card empty">Chargement des résultats MTN Elite Two…</div>`;return}
    const rounds=[...new Set([...E2DATA.matches,...(E2DATA.predictions||[])].map(x=>x.round))].sort((a,b)=>a-b);
    const list=[...E2DATA.matches.filter(x=>x.round===F.j),...(E2DATA.predictions||[]).filter(x=>x.round===F.j)];
    b.innerHTML=`<div class="dl" style="margin:0 0 8px">MTN Elite Two · ${esc(E2DATA.competition.season)}</div><div class="tabs" role="group" aria-label="Journée">${rounds.map(j=>`<button class="tab" data-e2round="${j}" aria-pressed="${F.j===j}">Journée ${j}</button>`).join("")}</div><div class="grid">${list.map(x=>{const home=E2DATA.clubs.find(c=>c.id===x.home)?.name||x.home,away=E2DATA.clubs.find(c=>c.id===x.away)?.name||x.away;const score=x.status==="played"?`${x.homeScore} - ${x.awayScore}`:x.status==="projected"?`Pronostic ${x.homeScore} - ${x.awayScore}`:x.status==="postponed"?"Reporté":"À confirmer";return `<div class="mrow"><a href="#e2club-${esc(x.home)}">${esc(home)}</a><b class="sc">${esc(score)}</b><a href="#e2club-${esc(x.away)}">${esc(away)}</a></div>`}).join("")||`<div class="card empty">Aucun match publié pour cette journée.</div>`}</div><p class="note">Résultats confirmés vérifiés au 5 novembre 2026. Les scores annoncés comme pronostics sont des estimations de faible confiance et ne modifient pas le classement.</p>`;
    b.querySelectorAll("[data-e2round]").forEach(e=>e.onclick=()=>{F.j=Number(e.dataset.e2round);matchBody()});return
  }
  const opts=Array.from({length:26},(_,i)=>`<option value="${i+1}" ${i+1===F.j?"selected":""}>Journée ${i+1}</option>`).join("");
  const list=M.filter(x=>x.j===F.j&&(F.club==="all"||x.h===F.club||x.a===F.club));
  const groups={};list.forEach(x=>{(groups[x.d||"pp"]??=[]).push(x)});
  const keys=Object.keys(groups).sort((a,b)=>a==="pp"?1:b==="pp"?-1:a<b?-1:1);
  b.innerHTML=`<div class="filters" style="align-items:center"><div class="mw" style="margin:0"><button id="pv" aria-label="Journée précédente" ${F.j<=1?"disabled":""}>‹</button><select id="fj" aria-label="Journée">${opts}</select><button id="nx" aria-label="Journée suivante" ${F.j>=26?"disabled":""}>›</button></div>
   <select id="fc" aria-label="Club"><option value="all">Tous les clubs</option>${IDS.slice().sort((a,b)=>C[a].n.localeCompare(C[b].n)).map(i=>`<option value="${i}" ${F.club===i?"selected":""}>${C[i].n}</option>`).join("")}</select></div>
   ${keys.length?keys.map(k=>`<div class="dl" style="margin:14px 0 6px">${k==="pp"?"Matchs reportés":fd(k)+(k===TODAY?" · Aujourd'hui":"")}</div><div class="card">${groups[k].map(rowHtml).join("")}</div>`).join(""):`<div class="card empty">Le calendrier de la journée ${F.j} n'est pas encore disponible${F.club!=="all"?" pour ce club":""}.</div>`}
   ${F.j<=3?`<p class="note">Journée 3 : date de publication des résultats.</p>`:""}`;
  enhanceSelects(b);
  $("#fj").onchange=e=>{F.j=+e.target.value;matchBody()};$("#fc").onchange=e=>{F.club=e.target.value;matchBody()};
  $("#pv").onclick=()=>{F.j--;matchBody()};$("#nx").onclick=()=>{F.j++;matchBody()};
}
const SS={sv:"dash",key:"pts",cA:"coton",cB:"menoua",season:"25",pClub:"all",pQuery:""};
V.stats=()=>{
  const tabs=[["dash","Vue d’ensemble"],["joueurs","Joueurs"],["clubs","Clubs"],["records","Records"],["compare","Comparer"],["saisons","Archives"],["data","Données"]];
  const sub=SS.sv==="saisons"?"Archives 2024/25 et 2025/26":SS.sv==="data"?"Périodes couvertes et dernières mises à jour":"MTN Elite One 2026/27";
  return head("Centre de stats",sub)+`<div class="tabs">${tabs.map(t=>`<button class="tab" data-s="${t[0]}" aria-pressed="${SS.sv===t[0]}">${t[1]}</button>`).join("")}</div><div id="sbody"></div>`;
};
function archive25(){
  const rows=H25_TABLE.map(([id,p,w,d,l,gf,ga,pts,z],i)=>{
    const gd=gf-ga, cls=z==="C"?"z1":z==="R"?"zr":"";
    return `<tr class="${cls}"><td><span class="pos">${i+1}</span></td><td class="l">${C[id]?tmLink(id):htm(id)}</td><td>${p}</td><td>${w}</td><td>${d}</td><td>${l}</td><td>${gf}</td><td>${ga}</td><td>${gdh(gd)}</td><td class="pts">${pts}</td></tr>`;
  }).join("");
  return `<div class="card scroll"><table><thead><tr><th>Pos</th><th class="l">Club</th><th>J</th><th>G</th><th>N</th><th>P</th><th>BP</th><th>BC</th><th>Diff</th><th>Pts</th></tr></thead><tbody>${rows}</tbody></table></div>
  <div class="legend"><span><i style="background:var(--accent)"></i>Champion</span><span><i style="background:var(--red)"></i>Relégation en Elite Two</span></div>
  <div class="sec-h"><h2>Résultats sélectionnés</h2><span class="note">J26 et J23</span></div>${hResults(H25_RESULTS)}
  <div class="sec-h"><h2>Buteurs 2025-26</h2></div><div class="swipe">${leader("Buteurs 2025-26",S25R(),"","Source : Lattaquant / Footazimuts · Kooh : 20 buts, 9 passes décisives.")}</div>
  <p class="note">Colombe et Dynamo ont terminé à 55 points. Colombe est champion grâce à une meilleure différence de buts (+34 contre +29). Les totaux de buts pour et contre de la source présentent un écart d’un but.</p>
  <div class="sec">${rosterArchive("25")}</div>`;
}
function archive24(){
  const n=H24_RESULTS.reduce((s,g)=>s+g[1].length,0);
  return `<div class="tiles3"><div class="tile"><div class="k">Champion 2024-25</div><div class="v" style="font-size:28px">Colombe</div><div class="n">Colombe Sportive · 65 points</div></div>
  <div class="tile"><div class="k">Meilleur buteur</div><div class="v">15</div><div class="n">Serge Daura · Gazelle FA · 11 passes</div></div>
  <div class="tile"><div class="k">Résultats recensés</div><div class="v">${n}</div><div class="n">sur ${H24_RESULTS.length} journées</div></div></div>
  <div class="sec-h"><h2>Buteurs 2024-25</h2></div><div class="swipe">${leader("Buteurs 2024-25",S24R(),"","Source : Sport News Africa / Camfoot · 2e et 3e sans nombre de buts.")}</div>
  <div class="sec-h"><h2>Résultats sélectionnés</h2><span class="note">Données partielles</span></div>${hResults(H24_RESULTS)}
  <p class="note">Serge Daura a remporté le Ballon d’Or camerounais 2025. Les résultats sont incomplets : la J15 manque et Aigle Royal Menoua et Aigle Royal Moungo ne sont pas distingués dans les feuilles disponibles.</p>
  <div class="sec">${rosterArchive("24")}</div>`;
}
function dataCoverage(){
  return `<div class="sec-h"><h2>Période couverte</h2><span class="note">Mise à jour : 5 novembre 2026</span></div>
  <div class="card psec"><h3>MTN Elite One</h3><div class="prow"><span>Saison en cours</span><b class="txt">2026/27 · résultats jusqu’à la J3</b></div><div class="prow"><span>Classement et forme</span><b class="txt">Calculés à partir des matchs confirmés</b></div><div class="prow"><span>Buteurs et passeurs</span><b class="txt">Événements publiés · couverture partielle</b></div><div class="prow"><span>Effectifs</span><b class="txt">Listes FECAFOOT 2025/26</b></div></div>
  <div class="card psec" style="margin-top:10px"><h3>Compositions et annuaire</h3><div class="prow"><span>Onze de départs confirmés</span><b class="txt">Aucune feuille de match officielle vérifiée</b></div><div class="prow"><span>Direction, rôles du staff et stades</span><b class="txt">À confirmer club par club</b></div><p class="note">La <a class="plink" href="https://fecafoot-officiel.com/wp-content/uploads/2026/10/LISTES-MTN-ELITE-ONE-26-27.pdf" target="_blank" rel="noreferrer">liste FECAFOOT des joueurs et officiels qualifiés 2026/27</a> ne précise pas les fonctions de chaque officiel et ne constitue pas une feuille de match. Les compositions d’aperçu restent illustratives.</p></div>
  <div class="card psec" style="margin-top:10px"><h3>MTN Elite Two</h3><div class="prow"><span>Saison en cours</span><b class="txt">2026/27</b></div><div class="prow"><span>Résultats</span><b class="txt">J1 et J2 · 11 matchs confirmés</b></div><div class="prow"><span>J3</span><b class="txt">Pronostics séparés des résultats</b></div><div class="prow"><span>Effectifs et stats joueurs</span><b class="txt">À compléter</b></div></div>
  <div class="card psec" style="margin-top:10px"><h3>Archives</h3><div class="prow"><span>Elite One 2025/26</span><b class="txt">Classement final · résultats J23 et J26 · buteurs</b></div><div class="prow"><span>Elite One 2024/25</span><b class="txt">Résultats partiels · classement final indisponible</b></div></div>
  <div class="sec-h" style="margin-top:22px"><h2>Pourquoi certaines données manquent</h2></div>
  <div class="card psec"><div class="prow"><span>Scores et calendriers</span><b class="txt">Ajoutés après confirmation par les sources disponibles.</b></div><div class="prow"><span>Statistiques joueurs</span><b class="txt">Les feuilles de match ne publient pas toujours les buteurs, passeurs ou compositions.</b></div><div class="prow"><span>Gardiens</span><b class="txt">Les apparitions des gardiens ne sont pas recensées. Aucun total individuel de clean sheets n’est affiché.</b></div><div class="prow"><span>2024/25</span><b class="txt">Plusieurs journées sont incomplètes et les deux clubs Aigle Royal ne sont pas distingués.</b></div></div>
  <div class="sec-h" style="margin-top:22px"><h2>Journal de collecte</h2></div>
  <div class="card psec"><div class="prow"><span>5 nov. 2026</span><b class="txt">Elite Two J1–J2 importées. Les scores estimés de J3 restent identifiés comme pronostics.</b></div><div class="prow"><span>5 nov. 2026</span><b class="txt">Références et périodes de couverture documentées pour préparer les prochaines mises à jour.</b></div></div>
  <p class="note">Les classements n’utilisent que les scores confirmés. Les pronostics et les données manquantes n’entrent pas dans les calculs.</p>`;
}
function statsBody(){
  const b=$("#sbody"); if(!b) return; const k=SS.sv;
  const scorers26=[].concat(...M.filter(x=>x.g).map(x=>x.g.map(g=>({p:g[1],t:g[2],pen:/pén/.test(g[0])}))));
  if(k==="dash") b.innerHTML=`<div class="dl" style="margin:0 0 6px">MTN Elite One · 2026/27</div><div class="swipe">${leader("Meilleurs passeurs · 2026/27",assistRows(),"","",EMPTY_A)}${leader("Buts · clubs · 2026/27",topN("gf"))}${leader("Victoires · 2026/27",topN("w"))}${leader("Meilleure défense · 2026/27",topLow("ga"))}${leader("Points · 2026/27",topN("pts"))}${leader("Buteurs · 2026/27",scorers26.map(s=>({label:plink(s.p,pfid(s.p)),sub:C[s.t].n+(s.pen?" · penalty":""),v:1})),"","Seuls les buteurs du match d'ouverture sont publiés pour l'instant.")}</div><div class="dl" style="margin:14px 0 6px">MTN Elite One · 2025/26</div><div class="swipe">${leader("Buteurs · 2025-26",S25R().slice(0,5),"","Saison précédente")}</div><p class="note">Les cartes 2026/27 sont calculées à partir des matchs publiés de la saison en cours. La carte 2025-26 correspond à la saison précédente.</p>`;
  if(k==="joueurs"){b.innerHTML=`<div class="dl" style="margin:0 0 6px">MTN Elite One · 2026/27</div><div class="swipe">${leader("Meilleurs passeurs · 2026/27",assistRows(),"","",EMPTY_A)}${leader("Buteurs · 2026/27",scorers26.map(s=>({label:plink(s.p,pfid(s.p)),sub:C[s.t].n+(s.pen?" · penalty":""),v:1})),"","Seuls les buteurs du match d'ouverture sont publiés pour l'instant.")}</div><div class="dl" style="margin:14px 0 6px">MTN Elite One · 2025/26</div><div class="swipe">${leader("Buteurs · 2025-26",S25R().slice(0,5),"","Saison précédente")}</div>${rosterPanel()}`;bindRosterPanel();}
  if(k==="clubs"){const cols=[["pts","Pts"],["p","J"],["w","G"],["d","N"],["l","P"],["gf","BP"],["ga","BC"],["gd","Diff"]];
    const rows=[...ST].sort((a,b)=>b[SS.key]-a[SS.key]||b.pts-a.pts);
    b.innerHTML=`<div class="card scroll"><table><thead><tr><th>#</th><th class="l">Club</th>${cols.map(c=>`<th><button class="tab" style="padding:3px 8px;${SS.key===c[0]?"background:var(--accent);color:var(--on-accent)":""}" data-k="${c[0]}">${c[1]}</button></th>`).join("")}</tr></thead><tbody>${rows.map((r,i)=>`<tr class="link" data-club-row="${esc(r.id)}"><td>${i+1}</td><td class="l">${tmLink(r.id)}</td>${cols.map(c=>`<td>${c[0]==="gd"?gdh(r.gd):r[c[0]]}</td>`).join("")}</tr>`).join("")}</tbody></table></div><p class="note">Cliquez sur un en-tête pour trier.</p>`;
    b.querySelectorAll("[data-k]").forEach(e=>e.onclick=()=>{SS.key=e.dataset.k;statsBody()});}
  if(k==="records"){const pl=M.filter(played);const big=Math.max(...pl.map(x=>Math.abs(x.hs-x.as)));const tot=Math.max(...pl.map(x=>x.hs+x.as));
    const bw=pl.filter(x=>Math.abs(x.hs-x.as)===big),hs=pl.filter(x=>x.hs+x.as===tot);
    b.innerHTML=`<div class="grid"><div class="tile"><div class="k">Plus large victoire 2026/27</div><div class="v">${Math.max(bw[0].hs,bw[0].as)}–0</div><div class="n">${bw.map(x=>`${C[x.h].n} ${x.hs}-${x.as} ${C[x.a].n}`).join("<br>")}</div></div>
    <div class="tile"><div class="k">Match le plus riche en buts 2026/27</div><div class="v">${tot} buts</div><div class="n">${hs.map(x=>`${C[x.h].n} ${x.hs}-${x.as} ${C[x.a].n}`).join("<br>")}</div></div>
    <div class="tile"><div class="k">Plus large victoire à domicile 2025/26</div><div class="v">8–0</div><div class="n">Unisport Bafang – Fortuna Mfou, 2 mai 2026</div></div>
    <div class="tile"><div class="k">Plus large victoire à l'extérieur 2025/26</div><div class="v">0–2</div><div class="n">Panthère du Ndé – Coton Sport, 22 mars 2026</div></div></div>`;}
  if(k==="compare"){const sel=(id,v)=>`<select id="${id}">${IDS.map(i=>`<option value="${i}" ${i===v?"selected":""}>${C[i].n}</option>`).join("")}</select>`;
    const A=SB[SS.cA],B=SB[SS.cB];const rows=[["Points","pts"],["Matchs","p"],["Victoires","w"],["Nuls","d"],["Défaites","l"],["Buts pour","gf"],["Buts contre","ga"],["Diff.","gd"]];
    b.innerHTML=`<div class="filters">${sel("ca",SS.cA)}${sel("cb",SS.cB)}</div><div class="card"><div class="cmp" style="border-top:0"><div class="a">${tm(SS.cA)}</div><div class="lab">vs</div><div class="b">${tm(SS.cB)}</div></div>${rows.map(([l,k])=>{const mx=Math.max(Math.abs(A[k]),Math.abs(B[k]),1);return `<div class="cmp"><div class="a">${A[k]}<span class="bar" style="width:${Math.abs(A[k])/mx*80}px"></span></div><div class="lab">${l}</div><div class="b"><span class="bar" style="width:${Math.abs(B[k])/mx*80}px"></span>${B[k]}</div></div>`}).join("")}</div>`;
    $("#ca").onchange=e=>{SS.cA=e.target.value;statsBody()};$("#cb").onchange=e=>{SS.cB=e.target.value;statsBody()};}
  if(k==="saisons"){
    const s=SS.season||"25";
    b.innerHTML=`<div class="tabs" role="group" aria-label="Saison"><button class="tab" data-season="25" aria-pressed="${s==="25"}">2025-26</button><button class="tab" data-season="24" aria-pressed="${s==="24"}">2024-25</button></div>${s==="24"?archive24():archive25()}`;
    b.querySelectorAll("[data-season]").forEach(e=>e.onclick=()=>{SS.season=e.dataset.season;statsBody()});
  }
  if(k==="data") b.innerHTML=dataCoverage();
  enhanceSelects(b);
}
const CL={tab:"e1"};
V.clubs=()=>head("Clubs",CL.tab==="e1"?"MTN Elite One 2026/27":"MTN Elite Two 2026/27")+`<div class="tabs" role="group" aria-label="Compétition"><button class="tab" data-cl="e1" aria-pressed="${CL.tab==="e1"}">Elite One</button><button class="tab" data-cl="e2" aria-pressed="${CL.tab==="e2"}">Elite Two</button></div>`+(CL.tab==="e1"?`<div class="cg">${IDS.slice().sort((a,b)=>C[a].n.localeCompare(C[b].n)).map(i=>`<a class="cc" href="#club-${i}">${cr(i,64)}<b>${C[i].n}</b><small>${C[i].city||"Ville à confirmer"} · ${SB[i].pos}e, ${SB[i].pts} pts</small></a>`).join("")}</div>`:E2DATA?`<div class="cg">${E2DATA.clubs.map(c=>`<a class="cc" href="#e2club-${esc(c.id)}"><span class="club-initial">${esc(c.name.slice(0,2).toUpperCase())}</span><b>${esc(c.name)}</b><small>MTN Elite Two · ${esc(E2DATA.competition.season)}</small></a>`).join("")}</div>`:`<div class="card empty">Chargement des clubs MTN Elite Two…</div>`);
const CS={tab:"apercu",season:"26",squadMode:"xi",squadMatch:{}}; let CC=null;
const cSeasonLabel=()=>CS.season==="26"?"2026/27":CS.season==="25"?"2025/26":"2024/25";
const cSeasonBtns=()=>[["26","2026/27"],["25","2025/26"],["24","2024/25"]].map(([v,l])=>`<button class="tab" data-cs="${v}" aria-pressed="${CS.season===v}">${l}</button>`).join("");
const cGroups=(i,s)=>(s==="25"?H25_RESULTS:H24_RESULTS).map(([label,rows])=>[label,rows.filter(([h,a])=>h===i||a===i)]).filter(([,rows])=>rows.length);
const cRow=x=>`<a class="mrow" href="#${mk(x)}"><div class="h">${tms(x.h)}</div>${score(x)}${tms(x.a)}<div class="meta">${x.d?fd(x.d)+" · ":""}J${x.j}${x.v?" · "+esc(x.v):""}</div></a>`;
function cArchiveStats(i,s){
  return [].concat(...cGroups(i,s).map(x=>x[1])).reduce((st,[h,a,hs,as])=>{const f=h===i?hs:as,ag=h===i?as:hs;st.p++;st.gf+=f;st.ga+=ag;if(f>ag)st.w++;else if(f<ag)st.l++;else st.d++;return st},{p:0,w:0,d:0,l:0,gf:0,ga:0});
}
function cScorers(i,s){
  if(s==="26"){
    const c={};evs().filter(e=>e.t===i).forEach(e=>{c[e.p]=(c[e.p]||0)+1});
    return Object.entries(c).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([n,v])=>({label:plink(n,pfid(n)),v}));
  }
  return (s==="25"?S25:S24).filter(x=>x[1]===i).sort((a,b)=>(typeof b[2]==="number"?b[2]:-1)-(typeof a[2]==="number"?a[2]:-1)).slice(0,5).map(x=>({label:plink(x[0],pfid(x[0])),v:x[2]}));
}
function cAssists(i,s){
  if(s==="26"){
    const c={};evs().filter(e=>e.t===i&&e.a).forEach(e=>{c[e.a]=(c[e.a]||0)+1});
    return Object.entries(c).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([n,v])=>({label:plink(n,pfid(n)),v}));
  }
  const m=s==="25"?S25A:S24A,out=[];
  Object.entries(m).forEach(([fid,v])=>{const p=ROSTER.find(x=>x[2]===fid);if(p&&p[1]===i)out.push({label:plink(p[0],fid),v})});
  return out.sort((a,b)=>b.v-a.v).slice(0,5);
}
function cTable(i){
  const pos=SB[i].pos,start=Math.max(0,pos-3),rows=ST.slice(start,start+5);
  return `<div class="card scroll ctable"><table><thead><tr><th>#</th><th class="l">Club</th><th>J</th><th class="hide-s">Diff</th><th>Pts</th></tr></thead><tbody>${rows.map(r=>`<tr class="${r.id===i?"me":""}"><td><span class="pos">${r.pos}</span></td><td class="l">${tmLink(r.id)}</td><td>${r.p}</td><td class="hide-s">${gdh(r.gd)}</td><td class="pts">${r.pts}</td></tr>`).join("")}</tbody></table></div>`;
}
function cMatches(i,s){
  if(s==="26"){
    const ms=M.filter(x=>x.h===i||x.a===i);
    if(!ms.length)return `<div class="card empty">Aucun match 2026/27 publié pour ce club.</div>`;
    const g={};ms.forEach(x=>{(g[x.j]??=[]).push(x)});
    return Object.keys(g).sort((a,b)=>a-b).map(j=>`<div class="dl" style="margin:14px 0 6px">Journée ${j}</div><div class="card">${g[j].map(cRow).join("")}</div>`).join("");
  }
  const groups=cGroups(i,s);
  if(!groups.length)return `<div class="card empty">Aucun résultat ${s==="25"?"2025-26":"2024-25"} publié pour ce club.</div>`;
  return groups.map(([label,rows])=>`<div class="dl" style="margin:14px 0 6px">${label}</div><div class="card">${rows.map(([h,a,hs,as])=>`<div class="mrow"><div class="h">${htm(h)}</div><span class="sc">${hs} - ${as}</span>${htm(a)}</div>`).join("")}</div>`).join("");
}
function cRoster(i,s){
  const ps=rSort(rClub(i));
  const age=s==="24"?"24":s==="26"?"26":"25",options=availableLineups(i),clubMatch=M.filter(m=>m.h===i||m.a===i).sort((a,b)=>b.j-a.j)[0];
  let selected=options.find(o=>mk(o.match)===CS.squadMatch[i])||options[0]||null;
  if(!selected)selected={match:clubMatch||{j:0,h:i,a:i},side:"h",lineup:demoLineupForClub(i),preview:true,opponent:clubMatch?(clubMatch.h===i?clubMatch.a:clubMatch.h):i};
  if(selected)CS.squadMatch[i]=mk(selected.match);
  const xi=selected.lineup.p.slice(0,11),xiNames=new Set(xi.map(p=>pnorm(p[1]||""))),remaining=ps.filter(p=>!xiNames.has(pnorm(PN(p[0])))),substitutes=selected.lineup.subs?.length?selected.lineup.subs:null;
  const current=CS.squadMode==="xi";
  return `<div class="squad-controls"><div class="tabs squad-tabs" role="group" aria-label="Vue de l’effectif"><button class="tab" data-squad-view="xi" aria-pressed="${current}">Onze entrant</button><button class="tab" data-squad-view="rest" aria-pressed="${!current}">Remplaçants et autres joueurs</button></div>${options.length?`<label class="squad-match-select"><span>Match de référence</span><select data-squad-match="${i}" aria-label="Match de référence">${options.map(o=>`<option value="${mk(o.match)}" ${mk(o.match)===mk(selected.match)?"selected":""}>${o.preview?"Aperçu · ":""}Journée ${o.match.j} · ${C[o.opponent].n}</option>`).join("")}</select></label>`:`<span class="note squad-match-note">Aperçu visuel de l’effectif · placement indicatif</span>`}</div>
  ${current?`<div class="squad-stage">${teamHalfPitch(i,selected)}<div class="squad-stage-info"><h3>${selected.preview?`Aperçu visuel · Journée ${selected.match.j}`:`Onze entrant · Journée ${selected.match.j}`}</h3><p class="note">${selected.preview?"Démo visuelle · joueurs issus des effectifs 2025/26 quand disponibles ; choix et postes indicatifs.":`Formation publiée : ${selected.lineup.f||"non renseignée"}.`}</p><ol class="xi-list">${xi.map(p=>`<li>${plink(p[1],p[2]||pfid(p[1]))}</li>`).join("")}</ol></div></div>`:`<div class="card psec squad-rest"><h3>${substitutes?"Remplaçants publiés":"Autres joueurs de l’effectif"}</h3>${substitutes?`<div class="squad-player-list">${substitutes.map(p=>`<a class="prow" href="${playerHref(p[2]||pfid(p[1]))}"><span>${p[1]}</span><small>${p[0]||""}</small></a>`).join("")}</div><p class="note">${remaining.length} autre joueur${remaining.length===1?"":"s"} dans l’effectif FECAFOOT.</p>`:`${ps.length?`<div class="squad-player-list">${ps.map(p=>`<a class="prow" href="${playerHref(p[2])}"><span>${PN(p[0])}</span><small>${pag(p[3],age)} ans</small></a>`).join("")}</div>`:`<div class="empty">Aucun effectif nominatif publié pour ce club.</div>`}<p class="note">Les remplaçants officiels ne sont pas publiés ; les placements du onze sont indicatifs.</p>`}</div>`}
  <p class="note">${ps.length?(s==="26"?"Dernier effectif publié : FECAFOOT 2025/26.":s==="24"?"Effectif FECAFOOT 2025/26 utilisé comme référence pour 2024/25.":"Source : FECAFOOT, saison 2025/26.")+" Les postes et numéros ne figurent pas dans cette source.":"Aucun effectif nominatif n’est publié pour ce club. Les onze marqueurs servent uniquement à montrer la disposition."}</p>`;
}
function cStats(i,s){
  if(s==="26"){
    const r=SB[i];
    return `<div class="tiles3"><div class="tile"><div class="k">Matchs joués</div><div class="v">${r.p}</div><div class="n">2026/27</div></div><div class="tile"><div class="k">Buts marqués</div><div class="v">${r.gf}</div><div class="n">${gdh(r.gd)} de différence</div></div><div class="tile"><div class="k">Buts encaissés</div><div class="v">${r.ga}</div><div class="n">buts encaissés</div></div></div>
    <div class="card psec"><h3>Bilan 2026/27</h3><div class="prow"><span>Classement</span><b>${r.pos}e</b></div><div class="prow"><span>Points</span><b>${r.pts}</b></div><div class="prow"><span>Matchs</span><b>${r.p}</b></div><div class="prow"><span>Victoires</span><b>${r.w}</b></div><div class="prow"><span>Nuls</span><b>${r.d}</b></div><div class="prow"><span>Défaites</span><b>${r.l}</b></div><div class="prow"><span>Buts pour</span><b>${r.gf}</b></div><div class="prow"><span>Buts contre</span><b>${r.ga}</b></div><div class="prow"><span>Différence</span><b>${gdh(r.gd)}</b></div><div class="prow"><span>Forme</span><span>${fm(r.f)}</span></div></div>
    <div class="pgrid" style="margin-top:14px">${leader("Buteurs 2026/27",cScorers(i,"26"),"","Matchs publiés.")}${leader("Passeurs 2026/27",cAssists(i,"26"),"","Passes publiées.")}</div>
    <p class="note">Statistiques calculées à partir des matchs 2026/27 publiés.</p>`;
  }
  if(s==="25"){
    const row=H25_TABLE.find(([id])=>id===i);
    if(!row)return `<div class="card empty">Ce club n'était pas dans l'Elite One 2025-26 ou aucune donnée n'est disponible.</div>`;
    const pos=H25_TABLE.indexOf(row)+1,[id,p,w,d,l,gf,ga,pts,z]=row,gd=gf-ga;
    return `<div class="tiles3"><div class="tile"><div class="k">Classement</div><div class="v">${pos}</div><div class="n">2025/26</div></div><div class="tile"><div class="k">Points</div><div class="v">${pts}</div><div class="n">${w}V ${d}N ${l}D</div></div><div class="tile"><div class="k">Buts</div><div class="v">${gf}-${ga}</div><div class="n">${gdh(gd)} de différence</div></div></div>
    <div class="card psec"><h3>Bilan 2025/26</h3><div class="prow"><span>Classement</span><b>${pos}e</b></div><div class="prow"><span>Points</span><b>${pts}</b></div><div class="prow"><span>Matchs</span><b>${p}</b></div><div class="prow"><span>Victoires</span><b>${w}</b></div><div class="prow"><span>Nuls</span><b>${d}</b></div><div class="prow"><span>Défaites</span><b>${l}</b></div><div class="prow"><span>Buts pour</span><b>${gf}</b></div><div class="prow"><span>Buts contre</span><b>${ga}</b></div><div class="prow"><span>Différence</span><b>${gdh(gd)}</b></div><div class="prow"><span>Statut</span><b class="txt">${z==="C"?"Champion":z==="R"?"Relégué":"—"}</b></div></div>
    <div class="pgrid" style="margin-top:14px">${leader("Buteurs 2025-26",cScorers(i,"25"),"","Top 10 publié.")}${leader("Passeurs 2025-26",cAssists(i,"25"),"","Passes publiées.")}</div>
    <p class="note">Classement final 2025-26.</p>`;
  }
  const st=cArchiveStats(i,"24");
  if(!st.p)return `<div class="card empty">Aucun résultat 2024-25 publié pour ce club.${["menoua","moungo"].includes(i)?`<br><span class="note">Les résultats « Aigle Royal » ne distinguent pas Menoua et Moungo.</span>`:""}</div>`;
  return `<div class="tiles3"><div class="tile"><div class="k">Matchs publiés</div><div class="v">${st.p}</div><div class="n">2024/25</div></div><div class="tile"><div class="k">Buts pour</div><div class="v">${st.gf}</div><div class="n">${st.w}V ${st.d}N ${st.l}D</div></div><div class="tile"><div class="k">Buts contre</div><div class="v">${st.ga}</div><div class="n">${gdh(st.gf-st.ga)} de différence</div></div></div>
  <div class="card psec"><h3>Bilan partiel 2024/25</h3><div class="prow"><span>Matchs publiés</span><b>${st.p}</b></div><div class="prow"><span>Victoires</span><b>${st.w}</b></div><div class="prow"><span>Nuls</span><b>${st.d}</b></div><div class="prow"><span>Défaites</span><b>${st.l}</b></div><div class="prow"><span>Buts pour</span><b>${st.gf}</b></div><div class="prow"><span>Buts contre</span><b>${st.ga}</b></div><div class="prow"><span>Différence</span><b>${gdh(st.gf-st.ga)}</b></div></div>
  <div class="pgrid" style="margin-top:14px">${leader("Buteurs 2024-25",cScorers(i,"24"),"","Top 3 publié.")}${leader("Passeurs 2024-25",cAssists(i,"24"),"","Passes publiées.")}</div>
  <p class="note">Données partielles : la J15 est absente et plusieurs journées ne listent qu'une partie des matchs. Le classement final n'est pas fourni.</p>`;
}
function cInfo(i){
  const c=C[i],r=SB[i],t=T25[i];
  return `<div class="pgrid">
    <div class="card psec"><h3>Identité</h3><div class="prow"><span>Nom</span><b class="txt">${c.n}</b></div><div class="prow"><span>Sigle</span><b class="txt">${c.s}</b></div>${c.city?`<div class="prow"><span>Ville</span><b class="txt">${c.city}</b></div>`:""}</div>
    <div class="card psec"><h3>Compétition</h3><div class="prow"><span>Compétition</span><b class="txt">MTN Elite One 2026/27</b></div><div class="prow"><span>Statut</span><b class="txt">${["abong","apejes"].includes(i)?"Promu":"En Elite One"}</b></div><div class="prow"><span>Dernière saison</span><b class="txt">${t?`${t[0]}e · ${t[1]} pts`:"Non renseignée"}</b></div><div class="prow"><span>Classement actuel</span><b class="txt">${r.pos}e · ${r.pts} pts</b></div></div>
  </div>
  <p class="note">Le répertoire de la direction, du staff et du stade se trouve dans l’onglet <button class="more" type="button" data-ct="annuaire">Annuaire</button>.</p>`;
}
function clubDirectory(i){
  const entry=CLUB_DIRECTORY[i]||{},leadership=entry.leadership||{},staff=entry.technicalStaff||{},stadium=entry.stadium||{},row=(label,value,extra="")=>`<div class="prow"><span>${esc(label)}</span><b class="txt">${value?`${esc(value)}${esc(extra)}`:"À confirmer"}</b></div>`,staffRows=[["Entraîneur principal",staff.headCoach],["Entraîneur adjoint",staff.assistantCoach],["Entraîneur des gardiens",staff.goalkeeperCoach],["Préparateur physique",staff.fitnessCoach],["Médecin",staff.doctor],["Intendant",staff.equipmentManager],...(staff.other||[]).map(p=>[p.role||"Membre du staff",p.name])];
  return `<div class="directory-intro"><div><span class="kicker">Annuaire du club · 2026/27</span><h2>${C[i].n}</h2><p>Direction, encadrement technique et stade.</p></div><span class="pill">${entry.verifiedAt?`Vérifié le ${fd(entry.verifiedAt.slice(0,10))}`:"Informations à confirmer"}</span></div>
  <div class="pgrid directory-grid"><section class="card psec"><h3>Direction</h3>${row("Président",leadership.president)}${row("Vice-président",leadership.vicePresident)}${row("Secrétaire général",leadership.secretaryGeneral)}${row("Team manager",leadership.teamManager)}</section>
  <section class="card psec"><h3>Encadrement et staff</h3>${staffRows.map(([role,name])=>row(role,name)).join("")}</section>
  <section class="card psec"><h3>Stade</h3>${row("Nom",stadium.name)}${row("Ville",stadium.city||C[i].city)}${row("Capacité",stadium.capacity?Number(stadium.capacity).toLocaleString("fr-FR"):null," places")}</section></div>
  <p class="note">Les noms et détails non confirmés restent indiqués comme tels. Une source et une date de vérification seront affichées pour chaque mise à jour validée.${entry.sourceUrl&&safeHttpHref(entry.sourceUrl)?` <a class="plink" href="${safeHttpHref(entry.sourceUrl)}" target="_blank" rel="noreferrer">Source du club</a>`:""}</p>`;
}
function clubPanel(i){
  if(CS.tab==="apercu"){
    const r=SB[i],nx=next(i),ps=rClub(i),top25=cScorers(i,"25")[0],ass25=cAssists(i,"25")[0],top26=cScorers(i,"26")[0];
    const perf=(label,row,empty)=>`<div class="tile"><div class="k">${label}</div><div class="v" style="font-size:24px">${row?row.v:"—"}</div><div class="n">${row?row.label:empty}</div></div>`;
    return `<div class="pgrid">
      <div class="card psec"><h3>Prochain match</h3>${nx?cRow(nx):`<div class="empty">Aucun match à venir.</div>`}</div>
      <div class="card psec"><h3>Forme récente</h3><div class="prow"><span>5 derniers matchs</span><span>${fm(r.f)}</span></div><div class="prow"><span>Classement</span><b class="txt">${r.pos}e · ${r.pts} pts</b></div><div class="prow"><span>Bilan</span><b class="txt">${r.w}V ${r.d}N ${r.l}D</b></div></div>
      <div class="card psec"><h3>Dernière composition</h3><div class="empty">Composition non fournie par la source.</div></div>
    </div>
    <div class="sec-h" style="margin-top:14px"><h2>Classement 2026/27</h2><a class="more" href="#classement">Tout voir</a></div>${cTable(i)}
  <div class="sec-h" style="margin-top:14px"><h2>Meilleurs joueurs</h2><span class="note">Statistiques disponibles</span></div>
    <div class="tiles3">${perf("Meilleur buteur 2025-26",top25,"Aucun buteur publié")}${perf("Meilleur passeur 2025-26",ass25,"Aucune passe publiée")}${perf("Meilleur buteur 2026/27",top26,"Aucun buteur publié")}</div>
    <div class="sec-h" style="margin-top:14px"><h2>Effectif</h2><button class="more" data-ct="effectif">Voir l'effectif</button></div>
    <p class="note">${ps.length?`${ps.length} joueurs dans l'effectif FECAFOOT 2025/2026.`:"Aucun effectif FECAFOOT 2025/2026 fourni."} Les compositions et statistiques détaillées ne sont pas fournies.</p>`;
  }
  if(CS.tab==="matchs"){
    return `<div class="filters" style="align-items:center"><div class="tabs" style="margin:0" role="group" aria-label="Saison">${cSeasonBtns()}</div><span class="note" style="margin:0">${cSeasonLabel()}</span></div>
    ${cMatches(i,CS.season)}
    <p class="note">${CS.season==="26"?"Calendrier 2026/27 publié jusqu'à la J5.":CS.season==="25"?"Résultats sélectionnés 2025-26 : J26 et J23 uniquement.":"Données partielles 2024-25 : J15 absente, journées incomplètes. Les résultats « Aigle Royal » ne distinguent pas Menoua et Moungo."}</p>`;
  }
  if(CS.tab==="effectif"){
    const ps=rClub(i),s=CS.season;
    const label=s==="26"?"Dernier effectif publié (2025-26)":s==="25"?"Effectif 2025-26":"Effectif de référence 2025-26";
    const note=s==="26"?"Aucun effectif 2026/2027 n'est fourni : l'effectif FECAFOOT 2025/2026 est affiché comme dernier effectif publié. Postes, numéros et nationalités non renseignés.":s==="24"?"Effectif FECAFOOT 2025/2026 utilisé comme référence pour 2024-25 : aucun effectif distinct n'est fourni. Postes, numéros et nationalités non renseignés.":"Source : FECAFOOT, saison 2025/2026. Postes, numéros et nationalités non renseignés.";
    return `<div class="filters" style="align-items:center"><div class="tabs" style="margin:0" role="group" aria-label="Saison">${cSeasonBtns()}</div><span class="note" style="margin:0">${label}</span></div>
    <div class="sec-h"><h2>${label}</h2><span class="note">${ps.length?ps.length+" joueurs":"Non fourni"}</span></div>
    ${cRoster(i,s)}
    <p class="note">${note}</p>`;
  }
  if(CS.tab==="stats"){
    return `<div class="filters" style="align-items:center"><div class="tabs" style="margin:0" role="group" aria-label="Saison">${cSeasonBtns()}</div><span class="note" style="margin:0">${cSeasonLabel()}</span></div>
    ${cStats(i,CS.season)}`;
  }
  if(CS.tab==="annuaire")return clubDirectory(i);
  return cInfo(i);
}
function clubPage(i){
  const c=C[i],p25=T25[i];
  return `<div class="chead">${cr(i,84)}<div><h1>${c.n}</h1><div class="meta">${c.city||""}${["abong","apejes"].includes(i)?" · Promu":""}${p25?` · 2025/26 : ${p25[0]}e, ${p25[1]} pts`:""}</div>${followButton(`club:e1:${i}`)}</div></div>
  <div class="tabs" role="group" aria-label="Sections du club">${[["apercu","Aperçu"],["matchs","Matchs"],["effectif","Effectif"],["stats","Stats"],["annuaire","Annuaire"],["infos","Infos"]].map(([k,l])=>`<button class="tab" data-ct="${k}" aria-pressed="${CS.tab===k}">${l}</button>`).join("")}</div>
  <div id="cpanel"></div>
  <p class="note" style="margin-top:14px"><a class="more" href="#clubs">← Tous les clubs</a></p>`;
}
function cBind(){
  const panel=$("#cpanel"); if(!panel||!CC)return;
  const draw=()=>{
    panel.innerHTML=clubPanel(CC);
    document.querySelectorAll("button.tab[data-ct]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.ct===CS.tab));
    document.querySelectorAll("button.tab[data-cs]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.cs===CS.season));
    document.querySelectorAll("[data-cs]").forEach(b=>b.onclick=()=>{CS.season=b.dataset.cs;draw()});
    document.querySelectorAll("[data-ct]").forEach(b=>b.onclick=()=>{CS.tab=b.dataset.ct;draw()});
    document.querySelectorAll("[data-squad-view]").forEach(b=>b.onclick=()=>{CS.squadMode=b.dataset.squadView;draw()});
    document.querySelectorAll("[data-squad-match]").forEach(s=>s.onchange=()=>{CS.squadMatch[s.dataset.squadMatch]=s.value;draw()});
  };
  draw();
}

/* Profils joueurs : données FECAFOOT + archives publiées uniquement. */
const PS={tab:"apercu",season:"all"}; let CP=null;
const pNameMatch=(n,p)=>!!n&&(pfid(n)===p[2]||pnorm(n)===pnorm(PN(p[0])));
const pEvents=p=>evs().filter(e=>pNameMatch(e.p,p)||(e.a&&pNameMatch(e.a,p)));
const pInit=n=>{const w=PN(n).split(/[\s-]+/).filter(Boolean);return w.length>1?((w[0][0]||"")+(w[w.length-1][0]||"")).toUpperCase():(w[0]||"").slice(0,2).toUpperCase()};
const pSeasonRows=p=>{
  const ev=pEvents(p), has26=ev.length>0;
  const s25=S25.find(s=>pfid(s[0])===p[2]), s24=S24.find(s=>pfid(s[0])===p[2]);
  const cur=ev[0]?ev[0].t:null;
  return [
    {key:"26",label:"2026/27",club:cur,goals:has26?ev.filter(e=>pNameMatch(e.p,p)).length:"—",assists:has26?ev.filter(e=>e.a&&pNameMatch(e.a,p)).length:"—",comp:"Elite One",ref:false},
    {key:"25",label:"2025/26",club:s25?s25[1]:p[1],goals:s25?s25[2]:"—",assists:S25A[p[2]]??"—",comp:"Elite One",ref:false},
    {key:"24",label:"2024/25",club:s24?s24[1]:p[1],goals:s24?s24[2]:"—",assists:S24A[p[2]]??"—",comp:"Elite One",ref:!s24}
  ];
};
const pTotals=rows=>{
  const g=rows.filter(r=>typeof r.goals==="number"), a=rows.filter(r=>typeof r.assists==="number");
  return {g:g.length?g.reduce((s,r)=>s+r.goals,0):"—",a:a.length?a.reduce((s,r)=>s+r.assists,0):"—"};
};
const pSeasonTable=(rows,totals,foot)=>{
  const body=rows.map(r=>`<tr><td>${r.label}</td><td class="l">${r.club?(C[r.club]?tmLink(r.club):htm(r.club)):"—"}${r.ref?` <small class="note">réf.</small>`:""}</td><td>${r.goals}</td><td>${r.assists}</td><td class="hide-s">${r.comp}</td></tr>`).join("");
  return `<div class="card scroll pcareer"><table><thead><tr><th>Saison</th><th class="l">Club</th><th>Buts</th><th>Passes déc.</th><th class="hide-s">Compétition</th></tr></thead><tbody>${body}</tbody>${foot?`<tfoot><tr><td class="l"><b>Total connu</b></td><td></td><td><b>${totals.g}</b></td><td><b>${totals.a}</b></td><td class="hide-s"></td></tr></tfoot>`:""}</table></div>`;
};
function playerPage(fid){
  const p=ROSTER.find(x=>x[2]===fid);
  if(!p)return `<div class="card empty">Joueur introuvable.</div>`;
  const rows=pSeasonRows(p), tot=pTotals(rows);
  const documented=rows.filter(r=>typeof r.goals==="number"||typeof r.assists==="number"||r.goals==="n.d.").length;
  const c=hC(p[1]);
  const club=C[p[1]]?`<a class="pclub" href="#club-${p[1]}">${hcr(p[1],24)}<span>${c.n}</span></a>`:`<span class="pclub">${hcr(p[1],24)}<span>${c.n}</span></span>`;
  return `<div class="phead"><div class="pav" aria-hidden="true">${pInit(p[0])}</div><div><div class="pk">Fiche joueur · Effectif 2025-26</div><h1>${PN(p[0])}</h1>${club}<div class="pmeta"><span><b>Naissance</b> ${pdob(p[3])}</span><span><b>Âge</b> ${pag(p[3],"26")} ans</span></div>${followButton(`player:${playerSlug(p)}`)}</div></div>
  <div class="pstats"><div class="pstat"><div class="k">Buts recensés</div><div class="v">${tot.g}</div><div class="n">Données disponibles</div></div><div class="pstat"><div class="k">Passes décisives</div><div class="v">${tot.a}</div><div class="n">Données partielles</div></div><div class="pstat"><div class="k">Saisons avec données</div><div class="v">${documented}</div><div class="n">sur 3 saisons</div></div></div>
  <div class="ptabs" role="group" aria-label="Sections du profil">${[["apercu","Aperçu"],["matchs","Matchs"],["stats","Stats"],["carriere","Carrière"]].map(([k,l])=>`<button class="tab" data-pt="${k}" aria-pressed="${PS.tab===k}">${l}</button>`).join("")}</div>
  <div id="ppanel"></div>
  <p class="note" style="margin-top:14px"><a class="more" href="#stats">← Centre de stats</a>${C[p[1]]?` · <a class="more" href="#club-${p[1]}">Fiche club</a>`:""}</p>`;
}
function playerPanel(){
  const p=ROSTER.find(x=>x[2]===CP); if(!p)return "";
  const rows=pSeasonRows(p), tot=pTotals(rows);
  const seasons=[["all","Toutes les saisons"],["26","2026/27"],["25","2025/26"],["24","2024/25"]];
  const cur=seasons.find(s=>s[0]===PS.season)||seasons[0];
  const list=PS.season==="all"?rows:rows.filter(r=>r.key===PS.season);
  const filter=`<div class="pfilter"><div><div class="dl">Saison</div><select id="pseason" aria-label="Saison">${seasons.map(([v,l])=>`<option value="${v}" ${PS.season===v?"selected":""}>${l}</option>`).join("")}</select></div><span class="note" style="margin:0">${PS.season==="all"?"Toutes les saisons publiées":cur[1]}</span></div>`;
  const ev=pEvents(p);
  const nx=C[p[1]]?next(p[1]):null, mates=rSort(rClub(p[1])).filter(x=>x[2]!==p[2]).slice(0,6);
  if(PS.tab==="apercu"){
    const showEv=PS.season==="all"||PS.season==="26";
    return filter+`<div class="sec-h"><h2>Bilan par saison</h2><span class="note">Données publiées</span></div>${pSeasonTable(list,tot,false)}
    <div class="pgrid" style="margin-top:14px">
      <div class="card psec"><h3>Profil</h3><div class="prow"><span>Date de naissance</span><b class="txt">${pdob(p[3])}</b></div></div>
      <div class="card psec"><h3>Événements 2026/27</h3>${showEv?(ev.length?ev.map(e=>{const goal=pNameMatch(e.p,p);return `<a class="prow" href="#${mk(e.m)}"><span>J${e.m.j} · ${e.min.replace(/ \(pén\.\)/,"")} · ${goal?"But":"Passe décisive"}<small>${tms(e.m.h)} ${e.m.hs}-${e.m.as} ${tms(e.m.a)}</small></span><b>→</b></a>`}).join(""):`<div class="empty">Aucun événement publié pour ce joueur.</div>`):`<div class="empty">Les feuilles de match de cette saison ne sont pas disponibles.</div>`}</div>
    </div>
    <div class="pgrid" style="margin-top:14px">
      ${C[p[1]]?`<div class="card psec"><h3>Prochain match</h3>${nx?rowHtml(nx):`<div class="empty">Aucun match à venir.</div>`}</div>`:""}
      <div class="card psec"><h3>Coéquipiers 2025-26</h3>${mates.length?mates.map(x=>`<a class="prow" href="${playerHref(x[2])}"><span>${PN(x[0])}</span><b>→</b></a>`).join(""):`<div class="empty">Effectif non fourni.</div>`}<div class="note" style="padding:0 16px 12px">Effectif FECAFOOT 2025/2026 · postes et numéros non renseignés.</div></div>
      ${C[p[1]]?`<div class="card psec"><h3>Forme du club</h3><div class="prow"><span>5 derniers matchs</span><span>${fm(SB[p[1]].f)}</span></div><div class="prow"><span>Classement</span><b class="txt">${SB[p[1]].pos}e · ${SB[p[1]].pts} pts</b></div></div>`:""}
    </div>
    <p class="note">Profil basé sur l'effectif FECAFOOT 2025/2026. Les buts 2025-26 proviennent du top 10 des buteurs publié ; les buts 2024-25 du top 3. Les matchs joués, minutes, tirs, passes, duels et cartons ne sont pas fournis par la source.</p>`;
  }
  if(PS.tab==="matchs"){
    if(PS.season==="25"||PS.season==="24")return filter+`<div class="card empty">Les feuilles de match de cette saison ne sont pas disponibles.</div>`;
    if(!ev.length)return filter+`<div class="card empty">Aucun but ni passe décisive publié pour ce joueur en 2026/27.</div>`;
    return filter+`<div class="card">${ev.map(e=>{const goal=pNameMatch(e.p,p);const role=goal?`But${/pén/.test(e.min)?" sur penalty":""}${e.a?` · passe de ${e.a}`:""}`:`Passe décisive · but de ${e.p}`;return `<a class="mrow" href="#${mk(e.m)}"><div class="h">${tms(e.m.h)}</div><span class="sc">${e.m.hs} - ${e.m.as}</span>${tms(e.m.a)}<div class="meta">J${e.m.j} · ${e.min.replace(/ \(pén\.\)/,"")} · ${role}</div></a>`}).join("")}</div><p class="note">Seuls les buts et passes décisives publiés sont disponibles.</p>`;
  }
  if(PS.tab==="stats"){
    if(PS.season==="all")return filter+`<div class="sec-h"><h2>Statistiques par saison</h2><span class="note">3 saisons</span></div>${pSeasonTable(rows,tot,true)}<p class="note">Le total additionne uniquement les valeurs numériques publiées ; les mentions « n.d. » et « — » ne sont pas comptées.</p>`;
    const r=list[0];
    return filter+`<div class="pfilter"><div class="cur">${r.label}</div><span class="note" style="margin:0">${r.club?hC(r.club).n:"Club non renseigné"}</span></div>
    <div class="pgrid">
      <div class="card psec"><h3>Attaque</h3><div class="prow"><span>Buts</span><b>${r.goals}</b></div><div class="prow"><span>Passes décisives</span><b>${r.assists}</b></div></div>
      <div class="card psec"><h3>Club et compétition</h3><div class="prow"><span>Club</span><b class="txt">${r.club?hC(r.club).n:"—"}</b></div><div class="prow"><span>Compétition</span><b class="txt">${r.comp}</b></div><div class="prow"><span>Saison</span><b class="txt">${r.label}</b></div></div>
    </div><p class="note">Les statistiques détaillées du joueur ne sont pas disponibles pour cette saison.</p>`;
  }
  return filter+`<div class="sec-h"><h2>Carrière</h2><span class="note">Saisons publiées</span></div>${pSeasonTable(list,tot,PS.season==="all")}<p class="note">Pour 2024-25, le club affiché est celui de l'effectif FECAFOOT 2025/2026 utilisé comme référence (marqué « réf. ») lorsque le club de la saison n'est pas documenté.</p>`;
}
function pBind(){
  const panel=$("#ppanel"); if(!panel||!CP)return;
  const draw=()=>{
    panel.innerHTML=playerPanel();
    enhanceSelects(panel);
    document.querySelectorAll("[data-pt]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.pt===PS.tab));
    const s=$("#pseason"); if(s)s.onchange=()=>{PS.season=s.value;draw()};
  };
  document.querySelectorAll("[data-pt]").forEach(b=>b.onclick=()=>{PS.tab=b.dataset.pt;draw()});
  draw();
}

const LINEUPS={},PREVIEW_LINEUPS={},CLUB_DIRECTORY={}; // Les compositions et l'annuaire sont chargés depuis l'API publique quand disponibles.
const normalizedLineup=entry=>{
  if(!entry)return null;
  const roster=(items=[])=>items.map(player=>Array.isArray(player)?player:[player.shirtNumber??"",player.name||"",player.playerId||null,player.position||""]);
  return {f:entry.formation||entry.f||"",p:roster(entry.starters||entry.p||[]),subs:roster(entry.substitutes||entry.subs||[])};
};
fetch(`${API_BASE}/seasons/elite-one-2026-27/lineups`).then(r=>r.ok?r.json():null).then(data=>{for(const entry of data?.lineups||[]){LINEUPS[entry.matchId]={h:normalizedLineup(entry.home),a:normalizedLineup(entry.away)}}for(const entry of data?.previewLineups||[]){PREVIEW_LINEUPS[entry.matchId]={h:normalizedLineup(entry.home),a:normalizedLineup(entry.away)}}if(CC&&CS.tab==="effectif")cBind();if(CM&&MS.tab==="compos")mBind()}).catch(()=>{});
fetch(`${API_BASE}/seasons/elite-one-2026-27/club-directory`).then(r=>r.ok?r.json():null).then(data=>{Object.assign(CLUB_DIRECTORY,data?.clubs||{});if(CC&&CS.tab==="annuaire")cBind()}).catch(()=>{});
function availableLineups(teamId){
  return M.map(match=>{const side=match.h===teamId?"h":match.a===teamId?"a":null,id=mk(match),official=LINEUPS[id],preview=PREVIEW_LINEUPS[id],lineup=side&&(official||preview)?.[side];return lineup?.p?.length>=11?{match,side,lineup,preview:!!preview&&!official,opponent:side==="h"?match.a:match.h}:null}).filter(Boolean).sort((a,b)=>b.match.j-a.match.j);
}
function demoLineupForClub(teamId){
  const players=rSort(rClub(teamId)).slice(0,11);
  return {f:"4-3-3",p:Array.from({length:11},(_,i)=>{const player=players[i];return [i+1,player?PN(player[0]):`Joueur à confirmer ${i+1}`,player?.[2]||null,""]}),subs:[]};
}
const lineupPlayerLabel=name=>/^Joueur à confirmer/.test(String(name||""))?"À confirmer":String(name||"").trim().split(/\s+/).pop();
const matchLineups=x=>{const id=mk(x),official=LINEUPS[id]||{},preview=PREVIEW_LINEUPS[id]||{};return {h:official.h||preview.h||demoLineupForClub(x.h),a:official.a||preview.a||demoLineupForClub(x.a)}};
const isPreviewLineup=x=>{const official=LINEUPS[mk(x)];return !(official?.h?.p?.length>=11&&official?.a?.p?.length>=11)};
const hasFullLineup=x=>{const lineup=matchLineups(x);return lineup?.h?.p?.length>=11&&lineup?.a?.p?.length>=11};
function teamHalfPitch(teamId,entry){
  const color=C[teamId]?.c||"#14613f",lineup=entry?.lineup,formation=(lineup?.f||"").split("-").map(Number).filter(Number.isFinite),players=Array.isArray(lineup?.p)?lineup.p.slice(0,11):[],markers=[];
  if(players.length){markers.push([players[0],180,438]);let index=1;formation.forEach((count,row)=>{const y=105+row*(220/Math.max(formation.length-1,1));for(let n=0;n<count&&index<players.length;n++,index++){const x=180+(n-(count-1)/2)*Math.min(58,220/Math.max(count-1,1));markers.push([players[index],x,y])}})}
  const playerMarks=markers.map(([player,x,y],i)=>`<g transform="translate(${x} ${y})"><circle r="18" fill="${color}" stroke="#fff" stroke-width="3"/><text y="4" text-anchor="middle" fill="#fff" font-size="13" font-weight="700">${esc(String(player[0]||i+1))}</text><rect x="-45" y="21" width="90" height="17" rx="2" fill="#0b2f20" fill-opacity=".88"/><text y="33" text-anchor="middle" fill="#fff" font-size="9">${esc(lineupPlayerLabel(player[1]))}</text></g>`).join("");
  return `<div class="half-pitch-wrap"><svg class="half-pitch" viewBox="0 0 360 520" role="img" aria-label="Demi-terrain portrait de ${esc(C[teamId]?.n||teamId)}"><defs><pattern id="halfGrass-${teamId}" width="72" height="72" patternUnits="userSpaceOnUse"><rect width="36" height="72" fill="#17884f"/><rect x="36" width="36" height="72" fill="#14794a"/></pattern></defs><rect x="8" y="8" width="344" height="504" fill="url(#halfGrass-${teamId})"/><g fill="none" stroke="#fff" stroke-opacity=".86" stroke-width="3"><rect x="8" y="8" width="344" height="504"/><path d="M8 30H352M128 8a52 52 0 0 0 104 0M96 512V374h168v138M144 512V438h72v74"/><circle cx="180" cy="374" r="4" fill="#fff"/><path d="M153 512v10h54v-10"/></g>${playerMarks}${!lineup?`<g><rect x="48" y="210" width="264" height="76" fill="#0b2f20" fill-opacity=".88"/><text x="180" y="243" text-anchor="middle" fill="#fff" font-size="18" font-weight="700">Onze entrant</text><text x="180" y="266" text-anchor="middle" fill="#d5e8dd" font-size="12">Non communiqué par la source</text></g>`:""}</svg></div>`;
}
const MS={tab:"apercu"}; let CM=null;
const findM=v=>{const [,j,h,a]=v.split("-");return M.find(x=>x.j==+j&&x.h===h&&x.a===a)};
const stt=x=>x.st==="PP"?"Reporté":x.st==="UN"?"Score à confirmer":played(x)?"Terminé":"À venir";
const minOf=s=>(parseInt(s)||0)*100+(+((String(s).match(/\+(\d+)/)||[0,0])[1]));
const cmpR=rows=>rows.map(([l,a,b])=>{const mx=Math.max(a,b,1);return `<div class="cmp"><div class="a">${a}<span class="bar" style="width:${a/mx*60}px"></span></div><div class="lab">${l}</div><div class="b"><span class="bar" style="width:${b/mx*60}px"></span>${b}</div></div>`}).join("");
const cmpHead=x=>`<div class="cmp head"><div class="a">${tms(x.h)}</div><div class="lab"></div><div class="b">${tms(x.a)}</div></div>`;
const miniT=i=>{const r=SB[i];return `<div class="mf"><span class="team">${cr(i,30)}<b>${sn(i)}</b></span><div class="mfs"><span>${r.pos}e · ${r.pts} pts</span>${fm(r.f)}</div></div>`};
function matchPage(x){
  const g=goalList(x), side=t=>g.filter(e=>e[2]===t).map(e=>`${plink(e[1].split(" ").pop(),pfid(e[1]))} ${e[0].replace(/ \(pén\.\)/," pén.")}`).join("<br>");
  const sc=played(x)?`<div class="mscore">${x.hs} - ${x.as}<small>Terminé</small></div>`:`<div class="mscore ns">${x.st==="NS"?fd(x.d):stt(x)}<small>${x.st==="NS"?"Coup d'envoi à confirmer":""}</small></div>`;
  return `<div class="sec-h"><h2>Match</h2><a class="more" href="#matchs">Tous les matchs</a></div><div class="mh"><div class="mtop">MTN Elite One · Journée ${x.j}${x.d?" · "+fd(x.d):""}${x.v?" · "+esc(x.v):""}</div>
    <div class="mteams"><a class="mt" href="#club-${x.h}">${cr(x.h,56)}${sn(x.h)}</a>${sc}<a class="mt" href="#club-${x.a}">${cr(x.a,56)}${sn(x.a)}</a></div>
    ${g.length?`<div class="mgoals"><div>${side(x.h)}</div><div>${side(x.a)}</div></div>`:""}<div class="match-actions"><button class="tab" type="button" data-save-event="${mk(x)}" aria-pressed="${isSavedEvent(mk(x))}">${isSavedEvent(mk(x))?"✓ Match enregistré":"＋ Enregistrer le match"}</button>${x.st==="NS"?`<button class="tab" type="button" data-match-alert="${mk(x)}" aria-pressed="${hasMatchAlert(mk(x))}">${hasMatchAlert(mk(x))?"🔔 Alerte enregistrée":"Activer l’alerte pour ce match"}</button>`:""}</div>${x.st==="NS"?`<p class="note" style="text-align:center;margin:0 12px 12px">L’alerte sera diffusée dès que le service de notifications sera connecté.</p>`:""}</div>
  <div class="seg" role="group" aria-label="Sections du match">${[["apercu","Résumé"],["highlights","Temps forts"],["compos","Compositions"],["stats","Statistiques"],["classement","Classement"],["chrono","Chronologie"],["infos","Infos"]].map(t=>`<button class="tab" data-mt="${t[0]}" aria-pressed="${MS.tab===t[0]}">${t[1]}</button>`).join("")}</div><div id="mpanel"></div>`;
}
function pitchSvg(x){
  const L=matchLineups(x);
  const dot=(pl,px,py,col)=>`<g transform="translate(${px} ${py})"><circle r="4.8" fill="${col}" stroke="#fff" stroke-width=".9"/><text y="1.5" font-size="4.2" fill="#fff" text-anchor="middle" font-weight="700">${pl[0]}</text><text y="9.6" font-size="3.3" fill="#fff" text-anchor="middle" paint-order="stroke" stroke="#0b3d22" stroke-width=".8">${esc(lineupPlayerLabel(pl[1]))}</text></g>`;
  const squad=(side,t)=>{const d=L&&L[side];if(!d)return"";const f=d.f.split("-").map(Number),col=C[t].c;const X=b=>side==="h"?b:150-b;let o=dot(d.p[0],X(10),50,col),k=1;
    f.forEach((n,li)=>{const bx=f.length>1?26+li*(40/(f.length-1)):40;for(let i=0;i<n;i++)o+=dot(d.p[k++]||["",""],X(bx),(i+1)*100/(n+1),col)});return o};
  const portraitDot=(pl,px,py,col)=>`<g transform="translate(${px} ${py})"><circle r="4.5" fill="${col}" stroke="#fff" stroke-width=".7"/><text y="1.2" font-size="3.2" fill="#fff" text-anchor="middle" font-weight="700">${esc(String(pl[0]||""))}</text><text y="8" font-size="2.6" fill="#fff" text-anchor="middle" paint-order="stroke" stroke="#0b3d22" stroke-width=".8">${esc(lineupPlayerLabel(pl[1]))}</text></g>`;
  const portraitSquad=(side,t)=>{const d=L[side],f=d.f.split("-").map(Number),col=C[t]?.c||"#14613f",home=side==="h";let out=portraitDot(d.p[0],50,home?139:11,col),index=1;f.forEach((count,row)=>{const y=home?112-row*30:38+row*30;for(let i=0;i<count;i++){const px=50+(i-(count-1)/2)*Math.min(17,62/Math.max(count-1,1));out+=portraitDot(d.p[index++]||["",""],px,y,col)}});return out};
  const landscape=`<svg viewBox="0 0 150 100" class="pitch pitch-landscape" role="img" aria-label="Terrain et compositions"><defs><pattern id="gr" width="20" height="100" patternUnits="userSpaceOnUse"><rect width="10" height="100" fill="#17884f"/><rect x="10" width="10" height="100" fill="#14794a"/></pattern></defs><rect width="150" height="100" rx="3" fill="url(#gr)"/><g fill="none" stroke="#fff" stroke-opacity=".7" stroke-width=".6"><rect x="3" y="3" width="144" height="94"/><path d="M75 3V97"/><circle cx="75" cy="50" r="10"/><rect x="3" y="25" width="18" height="50"/><rect x="3" y="38" width="7" height="24"/><rect x="129" y="25" width="18" height="50"/><rect x="140" y="38" width="7" height="24"/></g>${squad("h",x.h)}${squad("a",x.a)}</svg>`;
  const portrait=`<svg viewBox="0 0 100 150" class="pitch pitch-portrait" aria-hidden="true"><defs><pattern id="gr-portrait" width="24" height="150" patternUnits="userSpaceOnUse"><rect width="12" height="150" fill="#17884f"/><rect x="12" width="12" height="150" fill="#14794a"/></pattern></defs><rect width="100" height="150" fill="url(#gr-portrait)"/><g fill="none" stroke="#fff" stroke-opacity=".78" stroke-width=".65"><rect x="3" y="3" width="94" height="144"/><path d="M3 75H97"/><circle cx="50" cy="75" r="10"/><rect x="22" y="3" width="56" height="18"/><rect x="35" y="3" width="30" height="7"/><rect x="22" y="129" width="56" height="18"/><rect x="35" y="140" width="30" height="7"/></g>${portraitSquad("h",x.h)}${portraitSquad("a",x.a)}</svg>`;
  const fl=(s)=>L&&L[s]?L[s].f:"—";
  return `<div class="pl"><div class="plh"><div>${tms(x.h)}<small>${fl("h")}</small></div><div>${tms(x.a)}<small>${fl("a")}</small></div></div>${landscape}${portrait}</div>${isPreviewLineup(x)?`<p class="note"><strong>Aperçu visuel uniquement.</strong> Noms issus des effectifs FECAFOOT 2025/26 quand disponibles ; sélection, numéros et postes indicatifs. Les joueurs sans nom d’effectif sont indiqués « à confirmer ».</p>`:hasFullLineup(x)?"":`<p class="note">${L?"La composition complète de ce match n’est pas encore disponible.":"Compositions non renseignées pour ce match. Elles s’afficheront ici après validation par les entraîneurs."}</p>`}`;
}
const goalList=x=>[...(x.g||[])].sort((a,b)=>minOf(a[0])-minOf(b[0]));
const matchResult=x=>!played(x)?"—":x.hs===x.as?"Match nul":x.hs>x.as?`Victoire ${C[x.h].n}`:`Victoire ${C[x.a].n}`;
const matchSummary=x=>{if(x.st==="PP")return "Match reporté.";if(x.st==="UN")return "Score à confirmer.";if(!played(x))return "Match à venir.";
  if(x.hs===x.as)return `${C[x.h].n} et ${C[x.a].n} se neutralisent ${x.hs}-${x.as}.`;
  const w=x.hs>x.as?x.h:x.a,l=x.hs>x.as?x.a:x.h;
  return `${C[w].n} s'impose ${Math.max(x.hs,x.as)}-${Math.min(x.hs,x.as)} face à ${C[l].n}.`};
const mSquad=id=>{const ps=rSort(rClub(id));return `<div class="card psec"><h3>${C[id].n}</h3><div style="max-height:340px;overflow:auto">${ps.length?ps.map(p=>`<div class="prow"><span><a class="plink" href="${playerHref(p[2])}">${PN(p[0])}</a><small>${pag(p[3],"26")} ans</small></span></div>`).join(""):`<div class="empty">Effectif non fourni.</div>`}</div><p class="note">${ps.length?`Effectif FECAFOOT 2025-26 · ${ps.length} joueurs`:"Aucun effectif FECAFOOT fourni."}</p></div>`};
const mTable=x=>`<div class="card scroll ctable"><table><thead><tr><th>#</th><th class="l">Club</th><th>J</th><th class="hide-s">G</th><th class="hide-s">N</th><th class="hide-s">P</th><th class="hide-s">BP</th><th class="hide-s">BC</th><th>Diff</th><th>Pts</th><th class="hide-s">Forme</th><th class="hide-s">Prochain</th></tr></thead><tbody>${ST.map(r=>{const nx=next(r.id);return `<tr class="${r.id===x.h||r.id===x.a?"me":""}"><td><span class="pos">${r.pos}</span></td><td class="l">${tmLink(r.id)}</td><td>${r.p}</td><td class="hide-s">${r.w}</td><td class="hide-s">${r.d}</td><td class="hide-s">${r.l}</td><td class="hide-s">${r.gf}</td><td class="hide-s">${r.ga}</td><td>${gdh(r.gd)}</td><td class="pts">${r.pts}</td><td class="hide-s">${fm(r.f)}</td><td class="hide-s">${nx?cr(nx.h===r.id?nx.a:nx.h,24):""}</td></tr>`}).join("")}</tbody></table></div>`;
const h2hCard=x=>{const A=SB[x.h],B=SB[x.a];
  const prev=M.filter(y=>played(y)&&y!==x&&((y.h===x.h&&y.a===x.a)||(y.h===x.a&&y.a===x.h)));
  return `<div class="card">${cmpHead(x)}${cmpR([["Points",A.pts,B.pts],["Victoires",A.w,B.w],["Buts pour",A.gf,B.gf],["Buts contre",A.ga,B.ga]])}
  <div class="cmp"><div class="a">${fm(A.f)}</div><div class="lab">Forme</div><div class="b">${fm(B.f)}</div></div></div>
  <div class="dl" style="margin:14px 0 6px">Confrontations</div>${prev.length?`<div class="card">${prev.map(rowHtml).join("")}</div>`:`<div class="card empty">Aucune confrontation enregistrée cette saison.</div>`}`};
const PANELS={
 apercu:x=>{const g=goalList(x),hg=g.filter(e=>e[2]===x.h),ag=g.filter(e=>e[2]===x.a),pen=g.filter(e=>/pén/.test(e[0])).length;
   return `<div class="pgrid">
    <div class="card psec"><h3>Résumé</h3><p style="margin:0;padding:0 16px 12px;color:var(--muted)">${matchSummary(x)}</p><div class="prow"><span>Statut</span><b class="txt">${stt(x)}</b></div><div class="prow"><span>Score</span><b>${played(x)?`${x.hs} - ${x.as}`:"—"}</b></div><div class="prow"><span>Résultat</span><b class="txt">${matchResult(x)}</b></div><div class="prow"><span>Date</span><b class="txt">${x.d?fd(x.d):"À fixer"}</b></div><div class="prow"><span>Stade</span><b class="txt">${x.v||"Non communiqué"}</b></div></div>
    <div class="card psec"><h3>Buteurs</h3>${g.length?g.map(e=>`<div class="prow"><span>${plink(e[1],pfid(e[1]))}<small>${sn(e[2])}${e[3]?" · passe de "+plink(e[3],pfid(e[3])):""}</small></span><b class="txt">${e[0].replace(/ \(pén\.\)/,"")}</b></div>`).join(""):`<div class="empty">${x.st==="PP"?"Match reporté.":x.st==="UN"?"Score à confirmer.":played(x)?"Aucun buteur publié.":"Le match n'a pas encore eu lieu."}</div>`}</div>
    <div class="card psec"><h3>Repères</h3><div class="prow"><span>Buts</span><b class="txt">${played(x)?`${hg.length} - ${ag.length}`:"—"}</b></div><div class="prow"><span>Penalties</span><b>${played(x)?pen:"—"}</b></div><div class="prow"><span>Match sans but encaissé</span><b class="txt">${played(x)?`${x.as===0?C[x.h].n:"—"} / ${x.hs===0?C[x.a].n:"—"}`:"—"}</b></div></div>
   </div>
   <div class="duo">${miniT(x.h)}${miniT(x.a)}</div>
   <p class="note">Le compte rendu détaillé et les compositions ne sont pas fournis par la source.</p>`},
 highlights:x=>{const g=goalList(x);if(!g.length)return `<div class="card empty">${x.st==="PP"?"Match reporté.":x.st==="UN"?"Score à confirmer.":played(x)?"Aucun temps fort publié pour ce match.":"Le match n'a pas encore eu lieu."}<br><span class="note">Les vidéos et temps forts ne sont pas disponibles dans Simba Stat.</span></div>`;
   return `<div class="card psec"><h3>Temps forts</h3>${g.map(e=>`<div class="prow"><span>${plink(e[1],pfid(e[1]))}<small>${sn(e[2])}${e[3]?" · passe de "+plink(e[3],pfid(e[3])):""}</small></span><b class="txt">${e[0].replace(/ \(pén\.\)/,"")}</b></div>`).join("")}</div><p class="note">Les vidéos ne sont pas disponibles ; seuls les buts publiés sont listés.</p>`},
 compos:x=>`${pitchSvg(x)}${hasFullLineup(x)?"":`<div class="dl" style="margin:18px 0 6px">Effectifs de référence 2025-26</div><div class="pgrid">${mSquad(x.h)}${mSquad(x.a)}</div><p class="note">Les effectifs ne constituent pas la composition officielle de ce match. Les onze entrants et les remplaçants seront affichés ici dès publication.</p>`}`,
 stats:x=>{if(!played(x))return `<div class="card empty">Les statistiques apparaîtront après le match.</div>`;
   const pen=t=>goalList(x).filter(e=>e[2]===t&&/pén/.test(e[0])).length,g=goalList(x);
   return `<div class="card">${cmpHead(x)}${cmpR([["Buts",x.hs,x.as],["Penalties",pen(x.h),pen(x.a)],["Match sans but encaissé",x.as===0?1:0,x.hs===0?1:0]])}</div>
   <div class="pgrid" style="margin-top:14px">${leader("Buteurs",g.map(e=>({label:plink(e[1],pfid(e[1])),sub:sn(e[2]),v:e[0].replace(/ \(pén\.\)/,"")})),"","Buts publiés.")}${leader("Passeurs",g.filter(e=>e[3]).map(e=>({label:plink(e[3],pfid(e[3])),sub:`passe sur le but de ${plink(e[1],pfid(e[1]))}`,v:e[0].replace(/ \(pén\.\)/,"")})),"","Passes publiées.")}</div>
   <p class="note">Tirs, possession, corners, cartons et statistiques détaillées ne sont pas collectés.</p>
   <div class="sec-h" style="margin-top:14px"><h2>Face à face</h2></div>${h2hCard(x)}`},
 classement:x=>`<div class="sec-h"><h2>Classement 2026/27</h2><a class="more" href="#classement">Tout voir</a></div>${mTable(x)}<p class="note">Classement après les matchs publiés. Les deux clubs du match sont surlignés.</p>`,
 chrono:x=>{const g=goalList(x);if(!g.length)return `<div class="card empty">${x.st==="PP"?"Match reporté.":x.st==="UN"?"Score à confirmer ; la chronologie sera publiée après confirmation.":played(x)?"La chronologie de ce match n'est pas encore renseignée.":"Le match n'a pas encore eu lieu."}</div>`;
   let h=0,a=0;return `<div class="card" style="padding:8px 12px"><div class="tl"><div class="tle ko"><span class="mn">Coup d'envoi</span></div>${g.map(e=>{e[2]===x.h?h++:a++;const left=e[2]===x.h;
    return `<div class="tle"><span class="mn">${e[0].replace(/ \(pén\.\)/,"")}</span><div class="ev ${left?"l":"r"}"><b>${plink(e[1],pfid(e[1]))}</b><small>But${/pén/.test(e[0])?" sur penalty":""}${e[3]?" · passe de "+plink(e[3],pfid(e[3])):""} · ${h}-${a}</small></div></div>`}).join("")}<div class="tle ko"><span class="mn">Fin du match</span></div></div></div><p class="note">Commentaire détaillé non fourni ; seuls les buts publiés sont affichés.</p>`},
 infos:x=>`<div class="info"><div><dt>Compétition</dt><dd>MTN Elite One 2026/27</dd></div><div><dt>Journée</dt><dd>${x.j}</dd></div><div><dt>Date</dt><dd>${x.d?fd(x.d):"À fixer"}</dd></div><div><dt>Statut</dt><dd>${stt(x)}</dd></div><div><dt>Stade</dt><dd>${x.v||"Non communiqué"}</dd></div><div><dt>Score</dt><dd>${played(x)?`${x.hs} - ${x.as}`:"—"}</dd></div><div><dt>Arbitre</dt><dd>Non renseigné</dd></div><div><dt>Affluence</dt><dd>Non renseignée</dd></div></div><div class="sec-h" style="margin-top:14px"><h2>Clubs</h2></div><div class="duo">${miniT(x.h)}${miniT(x.a)}</div><p class="note">Arbitre, affluence et horaire détaillé ne sont pas fournis par la source.</p>`
};
function mBind(){
  if(!CM)return;const p=$("#mpanel");
  const draw=()=>{p.innerHTML=PANELS[MS.tab](CM);document.querySelectorAll("[data-mt]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.mt===MS.tab))};
  document.querySelectorAll("[data-mt]").forEach(b=>b.onclick=()=>{MS.tab=b.dataset.mt;draw()});draw();
}

function route(){
  let v=(location.hash||"#accueil").slice(1);
  let nav=v;CM=null;CP=null;CC=null;
  if(v.startsWith("e2club-")&&E2DATA?.clubs.some(c=>c.id===v.slice(7))){app.innerHTML=e2ClubPage(v.slice(7));nav="clubs"}
  else if(v.startsWith("club-")&&C[v.slice(5)]){CC=v.slice(5);CS.tab="apercu";CS.season="26";app.innerHTML=clubPage(CC);nav="clubs"}
  else if(v.startsWith("player-")){const slug=v.slice(7),player=ROSTER.find(p=>playerSlug(p)===slug),name=playerBySlug(slug);if(player){CP=player[2];PS.tab="apercu";PS.season="all";app.innerHTML=playerPage(CP);nav="stats"}else if(name){app.innerHTML=playerPreview(name);nav="stats"}else{v="stats";nav="stats";app.innerHTML=V.stats()}}
  else if(v.startsWith("match-")&&findM(v)){CM=findM(v);MS.tab="apercu";app.innerHTML=matchPage(CM);nav="matchs"}
  else{if(!V[v])v="accueil";nav=v;app.innerHTML=V[v]()}
  document.querySelectorAll("#nav a,.bnav a").forEach(a=>a.dataset.v===nav?a.setAttribute("aria-current","page"):a.removeAttribute("aria-current"));
  document.querySelectorAll("[data-t]").forEach(b=>b.onclick=()=>{F.tab=b.dataset.t;route()});
  document.querySelectorAll("[data-s]").forEach(b=>b.onclick=()=>{SS.sv=b.dataset.s;route()});
  document.querySelectorAll("[data-cl]").forEach(b=>b.onclick=()=>{CL.tab=b.dataset.cl;route()});
  document.querySelectorAll("[data-cls]").forEach(b=>b.onclick=()=>{CLS.season=b.dataset.cls;route()});
  document.querySelectorAll("[data-league]").forEach(b=>b.onclick=()=>{CLS.league=b.dataset.league;route()});
  document.querySelectorAll("[data-league-target]").forEach(b=>b.onclick=()=>{CLS.league=b.dataset.leagueTarget});
  document.querySelectorAll("[data-club-row]").forEach(row=>row.onclick=event=>{if(event.target.closest("a,button"))return;location.hash=`club-${row.dataset.clubRow}`});
  bindAccount();
  matchBody();statsBody();mBind();cBind();pBind();renderLanguage();window.scrollTo(0,0);
}
function bindAccount(){
  const teamSelect=$("#followTeams"), msg=$("#prefMessage"), form=$("#accountForm");
  if(!teamSelect&&!form)return;
  const syncPrefs=()=>{if(getPrefs().accountEmail)fetch(`${API_BASE}/account/preferences`,{method:"PUT",headers:{"content-type":"application/json"},credentials:"same-origin",body:JSON.stringify({preferences:getPrefs()})}).catch(()=>{})};
  if(teamSelect){const store=()=>{const p=getPrefs(), followed=[...(p.followed||[]).filter(x=>x.startsWith("player:")),...([...teamSelect.querySelectorAll("[data-follow-option]:checked")].map(o=>o.value))], alerts=[...( $("#alertE1").checked?["elite-one"]:[]),...($("#alertE2").checked?["elite-two"]:[])];savePrefs({followed,alerts});syncPrefs();if(msg)msg.textContent="Préférences enregistrées sur cet appareil."};teamSelect.querySelectorAll("[data-follow-option]").forEach(option=>option.onchange=store);["#alertE1","#alertE2"].forEach(s=>$(s).onchange=store);
    $("#notify").onchange=async e=>{if(e.target.checked){if(!("Notification"in window)){e.target.checked=false;if(msg)msg.textContent="Les notifications ne sont pas prises en charge par ce navigateur.";return}const permission=await Notification.requestPermission();if(permission!=="granted"){e.target.checked=false;if(msg)msg.textContent="Autorisez les notifications dans les réglages de votre navigateur pour les activer.";return}}savePrefs({notifications:e.target.checked});syncPrefs();if(msg)msg.textContent=e.target.checked?"Notifications autorisées sur cet appareil. Les alertes de match seront activées à la connexion du service de notifications.":"Notifications désactivées."};
  }
  let mode="login";const tabs=[...document.querySelectorAll("[data-auth]")];tabs.forEach(tab=>tab.onclick=()=>{mode=tab.dataset.auth;tabs.forEach(t=>t.setAttribute("aria-pressed",String(t===tab)));$("#authTitle").textContent=mode==="register"?"Votre saison commence ici":"Ravi de vous revoir";$("#authIntro").textContent=mode==="register"?"Créez votre espace en quelques secondes. C’est gratuit et facultatif.":"Connectez-vous pour retrouver vos clubs et alertes.";$("#authSubmit").textContent=mode==="register"?"Créer mon compte":"Me connecter";const password=form.querySelector('[name="password"]');password.autocomplete=mode==="register"?"new-password":"current-password";password.minLength=mode==="register"?12:1});
  const setSignedIn=(email,prefs)=>{savePrefs({...prefs,accountEmail:email});$("#accountShell").hidden=true;$("#accountSettings").hidden=false;$("#accountEmail").textContent=email;const select=$("#followTeams");if(select)select.querySelectorAll("[data-follow-option]").forEach(option=>option.checked=(prefs.followed||[]).includes(option.value));if($("#alertE1"))$("#alertE1").checked=(prefs.alerts||[]).includes("elite-one");if($("#alertE2"))$("#alertE2").checked=(prefs.alerts||[]).includes("elite-two");if($("#notify"))$("#notify").checked=!!prefs.notifications};
  if(form)form.onsubmit=async e=>{e.preventDefault();const out=$("#accountMessage"),data=Object.fromEntries(new FormData(form));out.textContent=mode==="register"?"Création de votre espace…":"Connexion…";try{const endpoint=mode==="register"?"register":"login",r=await fetch(`${API_BASE}/account/${endpoint}`,{method:"POST",headers:{"content-type":"application/json"},credentials:"same-origin",body:JSON.stringify({...data,preferences:getPrefs()})}),result=await r.json();if(!r.ok)throw Error(result.error||"Connexion impossible");setSignedIn(data.email,result.preferences||getPrefs());out.textContent=mode==="register"?"Votre compte Simba Stat est créé.":"Vous êtes connecté(e).";form.reset()}catch(error){out.textContent=error.message==="Failed to fetch"?"Le service de compte n’est pas encore disponible sur ce serveur.":error.message}};
  fetch(`${API_BASE}/account/me`,{credentials:"same-origin"}).then(r=>r.ok?r.json():null).then(data=>{if(data)setSignedIn(data.account.email,data.preferences)}).catch(()=>{});
  const logout=$("#logoutBtn");if(logout)logout.onclick=async()=>{await fetch(`${API_BASE}/account/logout`,{method:"POST",credentials:"same-origin"}).catch(()=>{});const p=getPrefs();delete p.accountEmail;localStorage.setItem(preferenceKey,JSON.stringify(p));route()};
}
const languageButton=$("#language");let currentLanguage=localStorage.getItem("simba-stat-language")||"fr";
const EN_TEXT={"Accueil":"Home","Matchs":"Matches","Classement":"Standings","Centre de stats":"Stats hub","Clubs":"Clubs","Compte":"Account","Football camerounais":"Cameroonian football","Votre espace Simba Stat":"Your Simba Stat space","Retrouvez les clubs que vous suivez et les alertes qui comptent pour vous.":"Follow your clubs and get the alerts that matter to you.","Votre saison commence ici":"Your season starts here","Créez votre espace en quelques secondes. C’est gratuit et facultatif.":"Create your space in seconds. It’s free and optional.","Ravi de vous revoir":"Welcome back","Connectez-vous pour retrouver vos clubs et alertes.":"Sign in to see your followed clubs and alerts.","Créer mon compte":"Create account","Me connecter":"Sign in","Adresse e-mail":"Email address","Mot de passe":"Password","12 caractères minimum.":"At least 12 characters.","12 caractères minimum":"At least 12 characters","Vous préférez regarder d’abord ?":"Prefer to look around first?","Continuer sans compte":"Continue without an account","Mes préférences":"My preferences","Enregistrées sur cet appareil":"Saved on this device","Équipes suivies":"Followed teams","Choisir mes équipes":"Choose my teams","Clubs Elite One":"Elite One clubs","Alertes de compétition":"Competition alerts","Alertes MTN Elite One":"MTN Elite One alerts","Alertes MTN Elite Two":"MTN Elite Two alerts","Notifications sur cet appareil":"Notifications on this device","Préférences enregistrées sur cet appareil.":"Preferences saved on this device.","Vos choix restent privés sur cet appareil. Créez un compte pour les retrouver ailleurs.":"Your choices stay private on this device. Create an account to access them elsewhere.","Votre espace":"Your space","Journée":"Round","Joueur":"Player","Club":"Club","Buts":"Goals","Passeurs":"Assists","Buteurs":"Scorers","Buts marqués":"Goals scored","Buts encaissés":"Goals conceded","Meilleur buteur":"Top scorer","Meilleur passeur":"Top assister","Meilleure attaque":"Best attack","Meilleure défense":"Best defence","Gardien":"Goalkeeper","Match sans but encaissé":"Clean sheet","Données":"Data","Archives":"Archive","Vue d’ensemble":"Overview","Joueurs":"Players","Comparer":"Compare","Records":"Records","Saison":"Season","Effectif":"Squad","Infos":"Info","Aperçu":"Overview","Résultats":"Results","Recherche":"Search","Tous les clubs":"All clubs","Tous les joueurs":"All players","Forme":"Form","Prochain":"Next","Pts":"Pts","Diff":"GD","Pos":"Pos","Aucun match publié pour cette journée.":"No matches have been published for this round.","Les données apparaîtront après le match.":"Data will appear after the match.","À confirmer":"To be confirmed","Reporté":"Postponed","Match reporté.":"Match postponed.","Non renseigné":"Not provided","Non renseignée":"Not provided","Non communiqué":"Not provided","Aucune donnée disponible":"No data available","Les statistiques apparaîtront après le match.":"Statistics will appear after the match.","Cliquez sur un en-tête pour trier.":"Select a heading to sort.","Toute la saison":"Full season","Saison en cours":"Current season","Champion":"Champion","Relégation en Elite Two":"Relegation to Elite Two","Toutes les journées":"All rounds","À la une":"Top story","Voir le classement":"View standings","Tout voir":"View all","Matchs MTN Elite One":"MTN Elite One matches","Classement MTN Elite One":"MTN Elite One standings","MTN Elite One":"MTN Elite One","MTN Elite Two":"MTN Elite Two","Données disponibles":"Available data","Périodes couvertes et dernières mises à jour":"Coverage periods and latest updates","Le football camerounais, raconté par les données.":"Cameroonian football, told through data.","Cliquez pour voir les détails":"Select to view details","Chargement des données Elite Two…":"Loading Elite Two data…","Chargement des résultats MTN Elite Two…":"Loading MTN Elite Two results…","Aucun joueur ne correspond à cette recherche.":"No players match this search.","Effectifs":"Squads","Penalties":"Penalties","À venir":"Upcoming","Terminé":"Full time","Statut":"Status","Score":"Score","Date":"Date","Stade":"Venue","Buts publiés.":"Published goals.","Passes publiées.":"Published assists.","Toutes les ligues":"All leagues"};
const EN_EXTRA={"Annuaire":"Club directory","Annuaire du club · 2026/27":"Club directory · 2026/27","Direction":"Leadership","Président":"President","Vice-président":"Vice-president","Secrétaire général":"Secretary general","Team manager":"Team manager","Encadrement et staff":"Coaching and staff","Entraîneur principal":"Head coach","Entraîneur adjoint":"Assistant coach","Entraîneur des gardiens":"Goalkeeper coach","Préparateur physique":"Fitness coach","Médecin":"Doctor","Intendant":"Equipment manager","Stade":"Stadium","Capacité":"Capacity"," places":" seats","À confirmer":"To be confirmed","Informations à confirmer":"Details to be confirmed","Vérifié le":"Verified on","Onze entrant":"Starting XI","Onze entrant · Journée":"Starting XI · Round","Remplaçants et autres joueurs":"Substitutes and other players","Remplaçants publiés":"Published substitutes","Autres joueurs de l’effectif":"Other squad players","Composition publiée":"Published line-up","Formation publiée :":"Published formation:","Aucun onze officiel publié":"No official starting XI published","Le onze de départ et les postes ne sont pas disponibles dans les données de Simba Stat pour ce club.":"Simba Stat does not yet have this club’s starting XI or player positions.","Les remplaçants officiels ne sont pas publiés. La liste présente l’effectif de référence complet, sans attribuer de poste.":"Official substitutes have not been published. This list shows the reference squad without assigning positions.","La composition complète de ce match n’est pas encore disponible.":"The full line-up for this match is not available yet.","Compositions non renseignées pour ce match. Elles s’afficheront ici après validation par les entraîneurs.":"No line-up is available for this match. It will appear here after confirmation by the coaches.","Les noms et détails non confirmés restent indiqués comme tels. Une source et une date de vérification seront affichées pour chaque mise à jour validée.":"Unconfirmed names and details are marked clearly. Each verified update will show its source and verification date.","Votre espace est prêt":"Your space is ready","Se déconnecter":"Sign out","Sélectionnez les clubs à retrouver en premier.":"Choose the clubs you want to see first.","Vos choix restent privés sur cet appareil. Créez un compte pour les retrouver ailleurs.":"Your choices stay private on this device. Create an account to access them elsewhere.","Choisissez les compétitions qui vous intéressent.":"Choose the competitions you follow.","Accès au compte":"Account access","Journées":"Rounds","Toutes les ligues":"All leagues","Journées 3 et 4":"Rounds 3 and 4","À la une":"Top story","Voir le classement":"View standings","Toutes les journées":"All rounds","Matchs reportés":"Postponed matches","Date à fixer":"Date to be confirmed","Aujourd’hui":"Today","Résultat":"Result","Repères":"Match facts","Temps forts":"Highlights","Compositions":"Line-ups","Statistiques":"Statistics","Chronologie":"Timeline","Résumé":"Summary","Classement 2026/27":"2026/27 standings","Domicile":"Home","Extérieur":"Away","Le match n’a pas encore eu lieu.":"The match has not been played yet.","Le match n'est pas encore disponible.":"This match is not available yet.","Les compositions ne sont pas disponibles.":"Line-ups are not available.","Composition non renseignée":"Line-up not provided","Effectif non fourni.":"Squad not provided.","Aucun effectif FECAFOOT fourni.":"No FECAFOOT squad list is available.","Postes, numéros et nationalités non renseignés.":"Positions, shirt numbers and nationalities are not available.","Source : FECAFOOT, saison 2025/2026.":"Source: FECAFOOT, 2025/26 season.","Données en cours de collecte":"Data collection in progress","Données disponibles":"Available data","À compléter":"To be added","Non disponible":"Unavailable","À venir":"Coming soon","Périodes couvertes et dernières mises à jour":"Coverage periods and latest updates","Les statistiques détaillées ne sont pas collectées.":"Detailed statistics are not collected.","Aucun buteur recensé.":"No scorers recorded.","Aucune passe décisive publiée en MTN Elite One 2026/27.":"No assists have been published for MTN Elite One 2026/27.","Buteurs recensés dans les feuilles de match.":"Scorers recorded on match sheets.","Statistiques des gardiens à venir.":"Goalkeeper statistics are coming soon.","Les équipes affichées sont issues des résultats confirmés.":"Teams shown are based on confirmed results.","Résultats confirmés vérifiés au 5 novembre 2026.":"Confirmed results checked on 5 November 2026.","Les positions à égalité suivent points, différence de buts puis buts marqués.":"Ties are ranked by points, goal difference, then goals scored.","Un résultat non confirmé n’entre pas dans le calcul.":"Unconfirmed results are excluded from the table.","Les données de ce club ne sont pas disponibles.":"Data for this club is not available.","Les statistiques détaillées et l’effectif de ce club ne sont pas encore publiés.":"Detailed statistics and this club’s squad have not been published yet.","Matchs publiés.":"Published matches.","Passes publiées.":"Published assists.","Aucun résultat confirmé pour ce club.":"No confirmed results for this club.","Voir le classement":"View standings","Calendrier complet":"Full schedule","Tous les clubs":"All clubs","Club non précisé":"Club not specified","Recherche par joueur":"Search players","Ville à confirmer":"City to be confirmed","Données non disponibles":"Data unavailable","Buts par match":"Goals per match","Buts marqués dans la ligue":"League goals scored","Victoires":"Wins","Points":"Points","Meilleurs buteurs":"Top scorers","Meilleurs passeurs":"Top assists","Meilleure attaque · clubs":"Best attack · clubs","Meilleure défense · clubs":"Best defence · clubs","Statistiques joueurs":"Player statistics","Données et couverture":"Data and coverage","Sources et périodes":"Sources and coverage periods","Effectifs et stats joueurs":"Squads and player stats","J3":"Round 3","Données confirmées":"Confirmed data","Prochaine journée":"Next round","Journée précédente":"Previous round","Journée suivante":"Next round","Joueur recherché":"Search players","Aucun joueur ne correspond à cette recherche.":"No players match this search.","Les deux clubs du match sont surlignés.":"The two teams in this match are highlighted.","Après le match":"After the match","Buts encaissés par match":"Goals conceded per match","Période couverte":"Coverage period","Mise à jour":"Updated","Championnat":"Competition","Compétition":"Competition","Lieu":"Venue","Ville":"City","Buts marqués":"Goals scored","Buts encaissés":"Goals conceded","Différence de buts":"Goal difference","Places":"Places","Relégation":"Relegation","Classement final":"Final standings","Saison précédente":"Previous season","Statistiques de la saison":"Season statistics","Comparer les clubs":"Compare clubs","Comparer les joueurs":"Compare players","Créer un compte":"Create account","Connexion":"Sign in","＋ Suivre":"＋ Follow","✓ Suivi":"✓ Following","Suivre":"Follow","Enregistrer le match":"Save match","✓ Match enregistré":"✓ Match saved","Activer l’alerte pour ce match":"Alert me about this match","🔔 Alerte activée":"🔔 Alert saved","Mes préférences":"My preferences","Clubs suivis":"Followed clubs","Prochains matchs de mes équipes":"Upcoming matches for my teams","Alertes de matchs à venir":"Upcoming match alerts","Matchs enregistrés":"Saved matches","Joueurs suivis":"Followed players","Enregistrez un match depuis sa page pour le retrouver ici.":"Save a match from its page to find it here.","Activez une alerte depuis la page d’un match à venir.":"Set an alert from an upcoming match page.","Les prochains matchs de vos équipes apparaîtront ici dès que le calendrier sera publié.":"Upcoming fixtures for your teams will appear here once the schedule is published.","Les alertes push ne sont pas encore diffusées.":"Push alerts are not being delivered yet.","Résultats confirmés":"Confirmed results","Leader · Elite Two":"Elite Two leader","Buts dans la ligue · Elite Two":"Elite Two league goals","Buts par match · Elite Two":"Elite Two goals per match","matchs confirmés":"confirmed matches","En attente de résultats confirmés":"Awaiting confirmed results","résultats confirmés":"confirmed results","moyenne des scores confirmés":"average across confirmed results","Ces chiffres sont calculés à partir des matchs confirmés. Le match AS FAP – AS Fortuna (J1), dont le score reste à confirmer, et les pronostics sont exclus.":"These figures use confirmed match results only. AS FAP–AS Fortuna (Round 1), whose score is still unconfirmed, and projected scores are excluded."};
function translateDOM(root){if(currentLanguage!=="en"||!root)return;const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);const translations=Object.entries({...EN_TEXT,...EN_EXTRA}).sort((a,b)=>b[0].length-a[0].length);for(const node of nodes){if(node.parentElement.closest("script,style"))continue;let value=node.nodeValue;for(const [fr,to] of translations)value=value.split(fr).join(to);node.nodeValue=value}for(const el of root.querySelectorAll?.("[aria-label],[placeholder],[title]")||[]){for(const attr of ["aria-label","placeholder","title"]){if(el.hasAttribute(attr))for(const [fr,to]of translations)el.setAttribute(attr,el.getAttribute(attr).split(fr).join(to))}}}
function renderLanguage(){const en=currentLanguage==="en";document.documentElement.lang=currentLanguage;languageButton.textContent=en?"EN":"FR";languageButton.setAttribute("aria-label",en?"Switch language to French":"Changer la langue en anglais");const desktop=[...document.querySelectorAll("#nav a")],mobile=[...document.querySelectorAll(".bnav a")],labels=en?["Home","Matches","Standings","Stats","Clubs"]:["Accueil","Matchs","Classement","Centre de stats","Clubs"];desktop.forEach((a,i)=>a.textContent=labels[i]);mobile.forEach((a,i)=>a.lastChild.textContent=labels[i]);document.querySelector(".account-link").textContent=en?"Account":"Compte";document.querySelector(".logo small").textContent=en?"Cameroonian football":"Football camerounais";translateDOM(document.body)}
new MutationObserver(()=>translateDOM(app)).observe(app,{childList:true,subtree:true});
if(languageButton)languageButton.addEventListener("click",()=>{currentLanguage=currentLanguage==="fr"?"en":"fr";localStorage.setItem("simba-stat-language",currentLanguage);route()});
document.addEventListener("click",event=>{const link=event.target.closest('a[href^="#club-"],a[href^="#e2club-"]');if(!link)return;event.preventDefault();event.stopPropagation();if(location.hash===link.getAttribute("href"))route();else location.hash=link.getAttribute("href")});
document.addEventListener("click",async event=>{
  const follow=event.target.closest("[data-follow-key]"),save=event.target.closest("[data-save-event]"),alert=event.target.closest("[data-match-alert]");if(!follow&&!save&&!alert)return;
  const p=getPrefs();
  if(follow){const key=follow.dataset.followKey,items=p.followed||[];p.followed=items.includes(key)?items.filter(x=>x!==key):[...items,key]}
  if(save){const id=save.dataset.saveEvent,items=p.savedEvents||[];p.savedEvents=items.includes(id)?items.filter(x=>x!==id):[...items,id]}
  if(alert){const id=alert.dataset.matchAlert,items=p.matchAlerts||[];if(!items.includes(id)){if(!("Notification"in window)){alert.textContent="Notifications non prises en charge";return}const permission=await Notification.requestPermission();if(permission!=="granted"){alert.textContent="Autorisez les notifications pour continuer";return}p.notifications=true}p.matchAlerts=items.includes(id)?items.filter(x=>x!==id):[...items,id]}
  savePrefs(p);if(p.accountEmail)fetch(`${API_BASE}/account/preferences`,{method:"PUT",headers:{"content-type":"application/json"},credentials:"same-origin",body:JSON.stringify({preferences:p})}).catch(()=>{});route()
});
if("serviceWorker"in navigator){let hadController=!!navigator.serviceWorker.controller;navigator.serviceWorker.addEventListener("controllerchange",()=>{if(hadController)location.reload();hadController=true});navigator.serviceWorker.register("/sw.js",{updateViaCache:"none"}).then(registration=>registration.update()).catch(()=>{})}
addEventListener("hashchange",route);route();
