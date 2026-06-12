// Lost Ark Bible Exporter Database (Updated dynamically)
const fallbackDatabase = [
  {
    "type": "spec",
    "class_eng": "Machinist",
    "class_kor": "스카우터",
    "spec_eng": "Arthetinean Skill",
    "spec_kor": "아르데타인의 기술",
    "values": {
      "ndps": 68166,
      "dps": 170456,
      "rdps": 81237,
      "udps": 92935
    }
  },
  {
    "type": "spec",
    "class_eng": "Breaker",
    "class_kor": "브레이커",
    "spec_eng": "Asura's Path",
    "spec_kor": "수라결",
    "values": {
      "ndps": 70322,
      "dps": 182754,
      "rdps": 83422,
      "udps": 98459
    }
  },
  {
    "type": "spec",
    "class_eng": "Artillerist",
    "class_kor": "블래스터",
    "spec_eng": "Barrage Enhancement",
    "spec_kor": "포격 강화",
    "values": {
      "ndps": 71703,
      "dps": 182402,
      "rdps": 84325,
      "udps": 99198
    }
  },
  {
    "type": "spec",
    "class_eng": "Berserker",
    "class_kor": "버서커",
    "spec_eng": "Berserker Technique",
    "spec_kor": "광전사의 비기",
    "values": {
      "ndps": 76930,
      "dps": 192965,
      "rdps": 89294,
      "udps": 105930
    }
  },
  {
    "type": "spec",
    "class_eng": "Breaker",
    "class_kor": "브레이커",
    "spec_eng": "Brawl King Storm",
    "spec_kor": "권왕태세",
    "values": {
      "ndps": 76345,
      "dps": 197214,
      "rdps": 88989,
      "udps": 106822
    }
  },
  {
    "type": "spec",
    "class_eng": "Gunlancer",
    "class_kor": "워로드",
    "spec_eng": "Combat Readiness",
    "spec_kor": "전투 태세",
    "values": {
      "ndps": 58170,
      "dps": 152866,
      "rdps": 92224,
      "udps": 82220
    }
  },
  {
    "type": "spec",
    "class_eng": "Summoner",
    "class_kor": "서머너",
    "spec_eng": "Communication Overflow",
    "spec_kor": "넘치는 교감",
    "values": {
      "ndps": 64527,
      "dps": 159081,
      "rdps": 74507,
      "udps": 89655
    }
  },
  {
    "type": "spec",
    "class_eng": "Glaivier",
    "class_kor": "창술사",
    "spec_eng": "Control",
    "spec_kor": "절제",
    "values": {
      "ndps": 71047,
      "dps": 179057,
      "rdps": 87581,
      "udps": 99434
    }
  },
  {
    "type": "spec",
    "class_eng": "Striker",
    "class_kor": "스트라이커",
    "spec_eng": "Deathblow",
    "spec_kor": "일격필살",
    "values": {
      "ndps": 75485,
      "dps": 196576,
      "rdps": 87378,
      "udps": 107062
    }
  },
  {
    "type": "spec",
    "class_eng": "Sharpshooter",
    "class_kor": "호크아이",
    "spec_eng": "Death Strike",
    "spec_kor": "죽음의 습격",
    "values": {
      "ndps": 67749,
      "dps": 170947,
      "rdps": 79537,
      "udps": 93992
    }
  },
  {
    "type": "spec",
    "class_eng": "Shadowhunter",
    "class_kor": "데모닉",
    "spec_eng": "Demonic Impulse",
    "spec_kor": "멈출 수 없는 충동",
    "values": {
      "ndps": 73862,
      "dps": 183761,
      "rdps": 86135,
      "udps": 101245
    }
  },
  {
    "type": "spec",
    "class_eng": "Guardianknight",
    "class_kor": "가디언나이트",
    "spec_eng": "Dreadful Roar",
    "spec_kor": "끔찍한 포효",
    "values": {
      "ndps": 71148,
      "dps": 182346,
      "rdps": 84728,
      "udps": 99264
    }
  },
  {
    "type": "spec",
    "class_eng": "Aeromancer",
    "class_kor": "기상술사",
    "spec_eng": "Drizzle",
    "spec_kor": "이슬비",
    "values": {
      "ndps": 64447,
      "dps": 166517,
      "rdps": 75704,
      "udps": 90659
    }
  },
  {
    "type": "spec",
    "class_eng": "Soulfist",
    "class_kor": "기공사",
    "spec_eng": "Energy Overflow",
    "spec_kor": "세맥타통",
    "values": {
      "ndps": 69182,
      "dps": 174492,
      "rdps": 81863,
      "udps": 96426
    }
  },
  {
    "type": "spec",
    "class_eng": "Deadeye",
    "class_kor": "데빌헌터",
    "spec_eng": "Enhanced Weapon",
    "spec_kor": "강화 무기",
    "values": {
      "ndps": 70160,
      "dps": 182428,
      "rdps": 81370,
      "udps": 100319
    }
  },
  {
    "type": "spec",
    "class_eng": "Striker",
    "class_kor": "스트라이커",
    "spec_eng": "Esoteric Flurry",
    "spec_kor": "오의난무",
    "values": {
      "ndps": 69825,
      "dps": 175697,
      "rdps": 80031,
      "udps": 97244
    }
  },
  {
    "type": "spec",
    "class_eng": "Wardancer",
    "class_kor": "배틀마스터",
    "spec_eng": "Esoteric Skill Enhancement",
    "spec_kor": "오의 강화",
    "values": {
      "ndps": 69120,
      "dps": 177014,
      "rdps": 79370,
      "udps": 96410
    }
  },
  {
    "type": "spec",
    "class_eng": "Machinist",
    "class_kor": "스카우터",
    "spec_eng": "Evolutionary Legacy",
    "spec_kor": "진화의 유산",
    "values": {
      "ndps": 74838,
      "dps": 195972,
      "rdps": 88907,
      "udps": 105999
    }
  },
  {
    "type": "spec",
    "class_eng": "Wildsoul",
    "class_kor": "와일드소울",
    "spec_eng": "Ferality",
    "spec_kor": "야성",
    "values": {
      "ndps": 70935,
      "dps": 183118,
      "rdps": 83890,
      "udps": 99463
    }
  },
  {
    "type": "spec",
    "class_eng": "Artillerist",
    "class_kor": "블래스터",
    "spec_eng": "Firepower Enhancement",
    "spec_kor": "화력 강화",
    "values": {
      "ndps": 65000,
      "dps": 161839,
      "rdps": 77351,
      "udps": 90666
    }
  },
  {
    "type": "spec",
    "class_eng": "Wardancer",
    "class_kor": "배틀마스터",
    "spec_eng": "First Intention",
    "spec_kor": "초심",
    "values": {
      "ndps": 73042,
      "dps": 183612,
      "rdps": 83159,
      "udps": 101120
    }
  },
  {
    "type": "spec",
    "class_eng": "Souleater",
    "class_kor": "소울이터",
    "spec_eng": "Full Moon Harvester",
    "spec_kor": "만월의 집행자",
    "values": {
      "ndps": 74312,
      "dps": 189166,
      "rdps": 86239,
      "udps": 102672
    }
  },
  {
    "type": "spec",
    "class_eng": "Arcanist",
    "class_kor": "아르카나",
    "spec_eng": "Grace of the Empress",
    "spec_kor": "황후의 은총",
    "values": {
      "ndps": 72583,
      "dps": 184669,
      "rdps": 83510,
      "udps": 100087
    }
  },
  {
    "type": "spec",
    "class_eng": "Destroyer",
    "class_kor": "디스트로이어",
    "spec_eng": "Gravity Training",
    "spec_kor": "중력 수련",
    "values": {
      "ndps": 70816,
      "dps": 191164,
      "rdps": 85092,
      "udps": 102663
    }
  },
  {
    "type": "spec",
    "class_eng": "Guardianknight",
    "class_kor": "가디언나이트",
    "spec_eng": "Hellfire Successor",
    "spec_kor": "업화의 계승자",
    "values": {
      "ndps": 77234,
      "dps": 198938,
      "rdps": 90516,
      "udps": 107107
    }
  },
  {
    "type": "spec",
    "class_eng": "Reaper",
    "class_kor": "리퍼",
    "spec_eng": "Hunger",
    "spec_kor": "갈증",
    "values": {
      "ndps": 68469,
      "dps": 172976,
      "rdps": 81104,
      "udps": 95944
    }
  },
  {
    "type": "spec",
    "class_eng": "Sorceress",
    "class_kor": "소서리스",
    "spec_eng": "Igniter",
    "spec_kor": "점화",
    "values": {
      "ndps": 66820,
      "dps": 173876,
      "rdps": 79091,
      "udps": 94198
    }
  },
  {
    "type": "spec",
    "class_eng": "Paladin",
    "class_kor": "홀리나이트",
    "spec_eng": "Judgment",
    "spec_kor": "심판자",
    "values": {
      "ndps": 73844,
      "dps": 193813,
      "rdps": 95392,
      "udps": 105035
    }
  },
  {
    "type": "spec",
    "class_eng": "Gunlancer",
    "class_kor": "워로드",
    "spec_eng": "Lone Knight",
    "spec_kor": "고독한 기사",
    "values": {
      "ndps": 66469,
      "dps": 169563,
      "rdps": 81897,
      "udps": 92617
    }
  },
  {
    "type": "spec",
    "class_eng": "Sharpshooter",
    "class_kor": "호크아이",
    "spec_eng": "Loyal Companion",
    "spec_kor": "두 번째 동료",
    "values": {
      "ndps": 71608,
      "dps": 180431,
      "rdps": 85091,
      "udps": 98284
    }
  },
  {
    "type": "spec",
    "class_eng": "Reaper",
    "class_kor": "리퍼",
    "spec_eng": "Lunar Voice",
    "spec_kor": "달의 소리",
    "values": {
      "ndps": 70269,
      "dps": 183268,
      "rdps": 82780,
      "udps": 99790
    }
  },
  {
    "type": "spec",
    "class_eng": "Summoner",
    "class_kor": "서머너",
    "spec_eng": "Master Summoner",
    "spec_kor": "상급 소환사",
    "values": {
      "ndps": 69903,
      "dps": 176084,
      "rdps": 82781,
      "udps": 97753
    }
  },
  {
    "type": "spec",
    "class_eng": "Berserker",
    "class_kor": "버서커",
    "spec_eng": "Mayhem",
    "spec_kor": "광기",
    "values": {
      "ndps": 71540,
      "dps": 178446,
      "rdps": 83464,
      "udps": 99141
    }
  },
  {
    "type": "spec",
    "class_eng": "Souleater",
    "class_kor": "소울이터",
    "spec_eng": "Night's Edge",
    "spec_kor": "그믐의 경계",
    "values": {
      "ndps": 71946,
      "dps": 182096,
      "rdps": 85179,
      "udps": 99450
    }
  },
  {
    "type": "spec",
    "class_eng": "Arcanist",
    "class_kor": "아르카나",
    "spec_eng": "Order of the Emperor",
    "spec_kor": "황제의 칙령",
    "values": {
      "ndps": 80254,
      "dps": 204082,
      "rdps": 90561,
      "udps": 113559
    }
  },
  {
    "type": "spec",
    "class_eng": "Gunslinger",
    "class_kor": "건슬링어",
    "spec_eng": "Peacemaker",
    "spec_kor": "피스메이커",
    "values": {
      "ndps": 70046,
      "dps": 178702,
      "rdps": 80263,
      "udps": 97521
    }
  },
  {
    "type": "spec",
    "class_eng": "Shadowhunter",
    "class_kor": "데모닉",
    "spec_eng": "Perfect Suppression",
    "spec_kor": "완벽한 억제",
    "values": {
      "ndps": 70374,
      "dps": 178139,
      "rdps": 83425,
      "udps": 97712
    }
  },
  {
    "type": "spec",
    "class_eng": "Wildsoul",
    "class_kor": "와일드소울",
    "spec_eng": "Phantom Beast Awakening",
    "spec_kor": "환수 각성",
    "values": {
      "ndps": 70502,
      "dps": 175064,
      "rdps": 83739,
      "udps": 96326
    }
  },
  {
    "type": "spec",
    "class_eng": "Glaivier",
    "class_kor": "창술사",
    "spec_eng": "Pinnacle",
    "spec_kor": "절정",
    "values": {
      "ndps": 68755,
      "dps": 172230,
      "rdps": 86521,
      "udps": 95085
    }
  },
  {
    "type": "spec",
    "class_eng": "Deadeye",
    "class_kor": "데빌헌터",
    "spec_eng": "Pistoleer",
    "spec_kor": "핸드거너",
    "values": {
      "ndps": 68100,
      "dps": 176069,
      "rdps": 80501,
      "udps": 95186
    }
  },
  {
    "type": "spec",
    "class_eng": "Slayer",
    "class_kor": "슬레이어",
    "spec_eng": "Predator",
    "spec_kor": "포식자",
    "values": {
      "ndps": 72456,
      "dps": 182558,
      "rdps": 84892,
      "udps": 100371
    }
  },
  {
    "type": "spec",
    "class_eng": "Slayer",
    "class_kor": "슬레이어",
    "spec_eng": "Punisher",
    "spec_kor": "처단자",
    "values": {
      "ndps": 71682,
      "dps": 176689,
      "rdps": 84209,
      "udps": 96978
    }
  },
  {
    "type": "spec",
    "class_eng": "Destroyer",
    "class_kor": "디스트로이어",
    "spec_eng": "Rage Hammer",
    "spec_kor": "분노의 망치",
    "values": {
      "ndps": 68800,
      "dps": 177131,
      "rdps": 81264,
      "udps": 96116
    }
  },
  {
    "type": "spec",
    "class_eng": "Artist",
    "class_kor": "도화가",
    "spec_eng": "Recurrence",
    "spec_kor": "회귀",
    "values": {
      "ndps": 62572,
      "dps": 156018,
      "rdps": 77186,
      "udps": 85514
    }
  },
  {
    "type": "spec",
    "class_eng": "Sorceress",
    "class_kor": "소서리스",
    "spec_eng": "Reflux",
    "spec_kor": "환류",
    "values": {
      "ndps": 69334,
      "dps": 173620,
      "rdps": 81960,
      "udps": 96153
    }
  },
  {
    "type": "spec",
    "class_eng": "Deathblade",
    "class_kor": "블레이드",
    "spec_eng": "Remaining Energy",
    "spec_kor": "잔재된 기운",
    "values": {
      "ndps": 72891,
      "dps": 188510,
      "rdps": 86492,
      "udps": 102997
    }
  },
  {
    "type": "spec",
    "class_eng": "Soulfist",
    "class_kor": "기공사",
    "spec_eng": "Robust Spirit",
    "spec_kor": "역천지체",
    "values": {
      "ndps": 62896,
      "dps": 162975,
      "rdps": 74697,
      "udps": 88817
    }
  },
  {
    "type": "spec",
    "class_eng": "Valkyrie",
    "class_kor": "발키리",
    "spec_eng": "Shining Knight",
    "spec_kor": "빛의 기사",
    "values": {
      "ndps": 68470,
      "dps": 173180,
      "rdps": 86884,
      "udps": 94660
    }
  },
  {
    "type": "spec",
    "class_eng": "Scrapper",
    "class_kor": "인파이터",
    "spec_eng": "Shock Training",
    "spec_kor": "충격 단련",
    "values": {
      "ndps": 68013,
      "dps": 176262,
      "rdps": 80175,
      "udps": 96662
    }
  },
  {
    "type": "spec",
    "class_eng": "Deathblade",
    "class_kor": "블레이드",
    "spec_eng": "Surge",
    "spec_kor": "버스트",
    "values": {
      "ndps": 72246,
      "dps": 176629,
      "rdps": 84293,
      "udps": 99858
    }
  },
  {
    "type": "spec",
    "class_eng": "Gunslinger",
    "class_kor": "건슬링어",
    "spec_eng": "Time to Hunt",
    "spec_kor": "사냥의 시간",
    "values": {
      "ndps": 69873,
      "dps": 177620,
      "rdps": 80727,
      "udps": 96310
    }
  },
  {
    "type": "spec",
    "class_eng": "Bard",
    "class_kor": "바드",
    "spec_eng": "True Courage",
    "spec_kor": "진실된 용기",
    "values": {
      "ndps": 68565,
      "dps": 189266,
      "rdps": 85501,
      "udps": 96094
    }
  },
  {
    "type": "spec",
    "class_eng": "Scrapper",
    "class_kor": "인파이터",
    "spec_eng": "Ultimate Skill: Taijutsu",
    "spec_kor": "극의: 체술",
    "values": {
      "ndps": 74242,
      "dps": 188775,
      "rdps": 86515,
      "udps": 103492
    }
  },
  {
    "type": "spec",
    "class_eng": "Aeromancer",
    "class_kor": "기상술사",
    "spec_eng": "Wind Fury",
    "spec_kor": "질풍노도",
    "values": {
      "ndps": 66576,
      "dps": 168191,
      "rdps": 78088,
      "udps": 92112
    }
  }
];
