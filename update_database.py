# update_database.py
import requests
import json
import re
import os
import base64
from urllib.parse import urljoin
from concurrent.futures import ThreadPoolExecutor

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

CLASS_MAP = {
    "Aeromancer": "기상술사", "Arcanist": "아르카나", "Artillerist": "블래스터",
    "Artist": "도화가", "Bard": "바드", "Berserker": "버서커", "Breaker": "브레이커",
    "Deadeye": "데빌헌터", "Deathblade": "블레이드", "Destroyer": "디스트로이어",
    "Glaivier": "창술사", "Guardianknight": "가디언나이트", "Gunlancer": "워로드",
    "Gunslinger": "건슬링어", "Machinist": "스카우터", "Paladin": "홀리나이트",
    "Reaper": "리퍼", "Scrapper": "인파이터", "Shadowhunter": "데모닉",
    "Sharpshooter": "호크아이", "Slayer": "슬레이어", "Sorceress": "소서리스",
    "Souleater": "소울이터", "Soulfist": "기공사", "Striker": "스트라이커",
    "Summoner": "서머너", "Valkyrie": "발키리", "Wardancer": "배틀마스터",
    "Wildsoul": "와일드소울"
}

SPEC_MAP = {
    "Drizzle": "이슬비", "Wind Fury": "질풍노도", "Grace of the Empress": "황후의 은총",
    "Order of the Emperor": "황제의 칙령", "Barrage Enhancement": "포격 강화",
    "Firepower Enhancement": "화력 강화", "Recurrence": "회귀", "True Courage": "진실된 용기",
    "Berserker Technique": "광전사의 비기", "Mayhem": "광기", "Asura's Path": "수라결",
    "Brawl King Storm": "권왕태세", "Enhanced Weapon": "강화 무기", "Pistoleer": "핸드거너",
    "Remaining Energy": "잔재된 기운", "Surge": "버스트", "Gravity Training": "중력 수련",
    "Rage Hammer": "분노의 망치", "Control": "절제", "Pinnacle": "절정",
    "Dreadful Roar": "끔찍한 포효", "Hellfire Successor": "업화의 계승자", "Combat Readiness": "전투 태세",
    "Lone Knight": "고독한 기사", "Peacemaker": "피스메이커", "Time to Hunt": "사냥의 시간",
    "Arthetinean Skill": "아르데타인의 기술", "Evolutionary Legacy": "진화의 유산",
    "Judgment": "심판자", "Hunger": "갈증", "Lunar Voice": "달의 소리", "Shock Training": "충격 단련",
    "Ultimate Skill: Taijutsu": "극의: 체술", "Demonic Impulse": "멈출 수 없는 충동",
    "Perfect Suppression": "완벽한 억제", "Death Strike": "죽음의 습격", "Loyal Companion": "두 번째 동료",
    "Predator": "포식자", "Punisher": "처단자", "Igniter": "점화", "Reflux": "환류",
    "Full Moon Harvester": "만월의 집행자", "Night's Edge": "그믐의 경계", "Energy Overflow": "세맥타통",
    "Robust Spirit": "역천지체", "Deathblow": "일격필살", "Esoteric Flurry": "오의난무",
    "Communication Overflow": "넘치는 교감", "Master Summoner": "상급 소환사", "Shining Knight": "빛의 기사",
    "Esoteric Skill Enhancement": "오의 강화", "First Intention": "초심", "Ferality": "야성",
    "Phantom Beast Awakening": "환수 각성"
}

SUPPORT_SPECS = {"Blessed Aura", "Desperate Salvation", "Full Bloom", "Liberator", "Princess"}

def deserialize(data_str):
    arr = json.loads(data_str)
    memo = {}
    
    def resolve(idx):
        if idx in memo:
            return memo[idx]
        val = arr[idx]
        if isinstance(val, dict):
            resolved_dict = {}
            memo[idx] = resolved_dict
            for k, v in val.items():
                if isinstance(v, int):
                    resolved_dict[k] = resolve(v)
                else:
                    resolved_dict[k] = v
            return resolved_dict
        elif isinstance(val, list):
            resolved_list = []
            memo[idx] = resolved_list
            for item in val:
                if isinstance(item, int):
                    resolved_list.append(resolve(item))
                else:
                    resolved_list.append(item)
            return resolved_list
        else:
            memo[idx] = val
            return val
    return resolve(0)

def get_relative_payload(boss, difficulty, dps_type, patch):
    arr = [
        ["__skrao", 1],
        {
            "boss": 2,
            "difficulty": 3,
            "dpsType": 4,
            "patch": 5
        },
        boss,
        difficulty,
        dps_type,
        patch
    ]
    json_str = json.dumps(arr, separators=(',', ':'))
    b64_bytes = base64.b64encode(json_str.encode('utf-8'))
    return b64_bytes.decode('utf-8').rstrip('=')

def get_live_hashes():
    base_url = "https://lostark.bible/stats/combat-power"
    resp = requests.get(base_url, headers=headers)
    if resp.status_code != 200:
        raise Exception(f"Failed to fetch combat-power: {resp.status_code}")
        
    html = resp.text
    links = re.findall(r'href=["\']([^"\']+\.js)["\']', html)
    links += re.findall(r'src=["\']([^"\']+\.js)["\']', html)
    links += re.findall(r'import\(["\']([^"\']+\.js)["\']\)', html)
    
    js_urls = []
    for link in set(links):
        if link.startswith("http"):
            if "lostark.bible" in link:
                js_urls.append(link)
        else:
            clean_link = link.lstrip("./")
            if not clean_link.startswith("_app/"):
                continue
            abs_url = f"https://lostark.bible/{clean_link}"
            js_urls.append(abs_url)
            
    extended_urls = []
    for url in js_urls:
        if "entry/app" in url or "entry/start" in url:
            try:
                js_resp = requests.get(url, headers=headers, timeout=5)
                if js_resp.status_code == 200:
                    content = js_resp.text
                    sub_paths = re.findall(r'["\']([^"\']*(?:nodes|chunks)/[a-zA-Z0-9_./-]+\.js)["\']', content)
                    for sub in sub_paths:
                        abs_sub = urljoin(url, sub)
                        extended_urls.append(abs_sub)
            except Exception as e:
                print(f"Error scanning entry file {url}: {e}")
                
    js_urls = list(set(js_urls + extended_urls))
    
    def url_priority(u):
        if "nodes/59." in u: return 0
        if "nodes/5." in u: return 1
        if "nodes/" in u: return 2
        return 3
    js_urls.sort(key=url_priority)
    
    cp_hash = None
    for url in js_urls:
        if cp_hash:
            break
        filename = url.split('/')[-1]
        try:
            resp = requests.get(url, headers=headers, timeout=5)
            if resp.status_code == 200:
                txt = resp.text
                m_cp = re.search(r'\b([a-zA-Z0-9]{7})/combatPowerDPSSearch\b', txt)
                if m_cp:
                    cp_hash = m_cp.group(1)
                    print(f"Found combatPowerDPSSearch hash: {cp_hash} in {filename}")
        except Exception as e:
            pass
    return cp_hash

def main():
    print("Fetching live stats from lostark.bible...")
    cp_hash = get_live_hashes()
    if not cp_hash:
        print("Failed to resolve SvelteKit remote build hashes")
        return
        
    dps_types = ["ndps", "dps", "rdps", "udps"]
    live_results = {}
    
    def fetch_dps_type(dps_type):
        payload = get_relative_payload("Corvus Tul Rak", "Nightmare", dps_type, "jun26")
        url = f"https://lostark.bible/_app/remote/{cp_hash}/combatPowerDPSSearch?payload={payload}"
        try:
            resp = requests.get(url, headers=headers, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                res = deserialize(data["result"])
                return dps_type, res
        except Exception as e:
            print(f"Error fetching {dps_type} from API: {e}")
        return dps_type, None

    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = [executor.submit(fetch_dps_type, dt) for dt in dps_types]
        for future in futures:
            dt, res = future.result()
            if res:
                live_results[dt] = res
                
    specs_db = {}
    base_type = "ndps" if "ndps" in live_results else list(live_results.keys())[0]
    
    for entry in live_results[base_type]:
        spec = entry.get("spec")
        if spec in SUPPORT_SPECS:
            continue
        class_name = entry.get("class")
        key = f"{class_name}-{spec}"
        
        specs_db[key] = {
            "type": "spec",
            "class_eng": class_name,
            "class_kor": CLASS_MAP.get(class_name, class_name),
            "spec_eng": spec,
            "spec_kor": SPEC_MAP.get(spec, spec),
            "values": {
                "ndps": 0,
                "dps": 0,
                "rdps": 0,
                "udps": 0
            }
        }
        
    for dps_type, res_list in live_results.items():
        for entry in res_list:
            spec = entry.get("spec")
            class_name = entry.get("class")
            key = f"{class_name}-{spec}"
            
            if key in specs_db:
                specs_db[key]["values"][dps_type] = int(round(entry.get("avg", 0)))
                
    for key, spec_data in specs_db.items():
        if spec_data["values"]["udps"] == 0 and spec_data["values"]["dps"] > 0:
            spec_data["values"]["udps"] = int(round(spec_data["values"]["dps"] * 0.545))
            
    database_list = list(specs_db.values())
    
    # Write back to database.js
    db_js_content = f"// Lost Ark Bible Exporter Database (Updated dynamically)\nconst fallbackDatabase = {json.dumps(database_list, ensure_ascii=False, indent=2)};\n"
    with open("database.js", "w", encoding="utf-8") as f:
        f.write(db_js_content)
    print(f"Successfully updated database.js with {len(database_list)} specs.")

if __name__ == "__main__":
    main()
