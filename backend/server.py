from fastapi import FastAPI, APIRouter, HTTPException, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Literal, Dict, Any
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ============ Constants ============
COUPLE_DOC_ID = "tql_couple_v1"
MAX_EVENTS = 500

USERS_SEED = {
    "laury": {
        "id": "laury",
        "name": "Laury",
        "password": "laury123",
        "age": "29 años",
        "birthday": "13/04/1997",
        "zodiac": "Aries",
        "skills": "Artista Polivalente, Programadora, Tatuadora",
        "avatar": "https://customer-assets.emergentagent.com/job_ios-sync-app/artifacts/zjnsflg7_laury.png",
        "primary": "#D869FE",
        "glow": "#E89DFE",
        "dark": "#5D25DC",
    },
    "danny": {
        "id": "danny",
        "name": "Danny",
        "password": "danny123",
        "age": "28 años",
        "birthday": "01/09/1998",
        "zodiac": "Virgo",
        "skills": "Electricista, Tirador de élite, Sueño ligero",
        "avatar": "https://customer-assets.emergentagent.com/job_ios-sync-app/artifacts/zdg6ii1f_danny.png",
        "primary": "#27DFFE",
        "glow": "#5DEDFE",
        "dark": "#0E5BE5",
    },
}

LAURY_PC = "https://customer-assets.emergentagent.com/job_ios-sync-app/artifacts/fx0e8bx2_laury%20en%20el%20pc.png"
DANNY_PC = "https://customer-assets.emergentagent.com/job_ios-sync-app/artifacts/6n2h89aa_danny%20en%20el%20pc.png"
LAURY_SLEEP = "https://customer-assets.emergentagent.com/job_ios-sync-app/artifacts/wcfmdl4y_laury%20durmiendo.png"
DANNY_SLEEP = "https://customer-assets.emergentagent.com/job_ios-sync-app/artifacts/ad6ttesj_danny%20durmiendo.png"
DANNY_WORK = "https://customer-assets.emergentagent.com/job_ios-sync-app/artifacts/rn130yaq_danny%20trabajando.png"

DEFAULT_AVATARS = {
    "laury": LAURY_PC,
    "danny": DANNY_PC,
}

AVATAR_OPTIONS_SEED = {
    "laury": [
        {"label": "En el PC", "url": LAURY_PC},
        {"label": "Durmiendo", "url": LAURY_SLEEP},
    ],
    "danny": [
        {"label": "En el PC", "url": DANNY_PC},
        {"label": "Durmiendo", "url": DANNY_SLEEP},
        {"label": "Trabajando", "url": DANNY_WORK},
    ],
}

DEFAULT_STATE: Dict[str, Any] = {
    "userData": {"level": 1, "currentXP": 0, "totalXP": 0},
    "bubbles": {
        "laury": {"emoji": "💜", "text": "Estado..."},
        "danny": {"emoji": "🩵", "text": "Estado..."},
    },
    "avatars": DEFAULT_AVATARS,
    "locations": {"laury": "mi_casa", "danny": "mi_casa"},
    "missions": {"laury": [], "danny": []},
    "coins": {"laury": 0, "danny": 0},
    "vouchers": {
        "laury": {"tokens": 0, "crafted": []},
        "danny": {"tokens": 0, "crafted": []},
    },
    "achievements": {"laury": [], "danny": []},
    "inventory": {"laury": [], "danny": []},
    "calendar": {},
    "profiles": {
        "laury": {k: v for k, v in USERS_SEED["laury"].items()},
        "danny": {k: v for k, v in USERS_SEED["danny"].items()},
    },
    "avatarOptions": AVATAR_OPTIONS_SEED,
    "events": [],
    "relationshipStartDate": "2026-01-09T00:00:00Z",
    "lastUpdated": datetime.now(timezone.utc).isoformat(),
}

# ============ Models ============
class LoginRequest(BaseModel):
    userId: Literal["laury", "danny"]
    password: str

class LoginResponse(BaseModel):
    token: str
    user: Dict[str, Any]

class StatePatch(BaseModel):
    userData: Optional[Dict[str, Any]] = None
    bubbles: Optional[Dict[str, Any]] = None
    avatars: Optional[Dict[str, Any]] = None
    locations: Optional[Dict[str, Any]] = None
    missions: Optional[Dict[str, Any]] = None
    achievements: Optional[Dict[str, Any]] = None
    relationshipStartDate: Optional[str] = None

class AddXPRequest(BaseModel):
    amount: int
    actor: Optional[Literal["laury", "danny"]] = None
    reason: Optional[str] = None
    icon: Optional[str] = None

class MissionCreate(BaseModel):
    targetUser: Literal["laury", "danny"]
    createdBy: Literal["laury", "danny"]
    name: str
    description: str
    rarity: Literal["comun", "rara", "epica", "legendaria"]
    reward: int

class MissionAction(BaseModel):
    targetUser: Literal["laury", "danny"]
    missionId: str
    actor: Optional[Literal["laury", "danny"]] = None


class AchievementCreate(BaseModel):
    targetUser: Literal["laury", "danny"]
    createdBy: Literal["laury", "danny"]
    name: str
    description: str
    rarity: Literal["comun", "rara", "epica", "legendaria"]
    imageUrl: Optional[str] = None


class AchievementAction(BaseModel):
    targetUser: Literal["laury", "danny"]
    achievementId: str


SHOP_ITEMS = [
    {"id": "i_beso", "name": "Beso Especial", "icon": "💋", "price": 5, "desc": "Un beso al ganador del día"},
    {"id": "i_masaje", "name": "Masaje 15min", "icon": "💆", "price": 15, "desc": "Masaje de 15 minutos"},
    {"id": "i_cena", "name": "Cena Sorpresa", "icon": "🍝", "price": 30, "desc": "Cena cocinada con amor"},
    {"id": "i_peli", "name": "Noche de Peli", "icon": "🎬", "price": 20, "desc": "Tú eliges la película"},
    {"id": "i_desayuno", "name": "Desayuno en Cama", "icon": "🥐", "price": 25, "desc": "Mimitos al despertar"},
    {"id": "i_baño", "name": "Baño Relajante", "icon": "🛁", "price": 35, "desc": "Velas, música y sales"},
    {"id": "i_juego", "name": "Sesión de Juegos", "icon": "🎮", "price": 10, "desc": "Tarde de gaming juntos"},
    {"id": "i_cita", "name": "Cita Sorpresa", "icon": "💕", "price": 80, "desc": "Una cita inolvidable"},
    {"id": "i_regalo", "name": "Regalo Sorpresa", "icon": "🎁", "price": 50, "desc": "Algo especial para ti"},
    {"id": "i_postre", "name": "Postre Hecho a Mano", "icon": "🍰", "price": 18, "desc": "Postre casero"},
    {"id": "i_pasion", "name": "Noche Apasionada", "icon": "🔥", "price": 100, "desc": "Noche solo para nosotros"},
    {"id": "i_carta", "name": "Carta de Amor", "icon": "💌", "price": 8, "desc": "Una carta sincera"},
]

ROULETTES = {
    "comer": {"name": "¿Dónde comemos?", "icon": "🍽️", "options": ["Pizza", "Hamburguesa", "Sushi", "Comida China", "Mexicano", "Italiano", "Tapas", "Casa - Cocinar juntos", "McDonalds", "Burger King", "Kebab", "Ensalada saludable"]},
    "plan": {"name": "¿Qué plan hacemos?", "icon": "🎯", "options": ["Cine", "Paseo por el parque", "Tarde de mantita y peli", "Cocinar juntos", "Ir a la playa", "Spa en casa", "Salir de compras", "Jugar a juegos de mesa", "Karaoke", "Cena romántica", "Ruta turística", "Día de aventura"]},
    "jugar": {"name": "¿A qué jugamos?", "icon": "🎮", "options": ["It Takes Two", "Mario Kart", "Fortnite", "Among Us", "Stardew Valley", "Monopoly", "UNO", "Trivial", "Dardos", "Karaoke", "Just Dance", "Minecraft"]},
    "peli": {"name": "¿Qué peli vemos?", "icon": "🎬", "options": ["Comedia romántica", "Acción", "Terror", "Animación", "Drama", "Ciencia ficción", "Disney", "Marvel", "Anime", "Clásico", "Documental", "Sorpresa de Netflix"]},
}


class BuyItemRequest(BaseModel):
    userId: Literal["laury", "danny"]
    itemId: str


class GiftItemRequest(BaseModel):
    fromUser: Literal["laury", "danny"]
    toUser: Literal["laury", "danny"]
    inventoryItemId: str


class MinigameResult(BaseModel):
    userId: Literal["laury", "danny"]
    gameId: str
    reward: int


class CalendarEntryRequest(BaseModel):
    userId: Literal["laury", "danny"]
    date: str  # YYYY-MM-DD
    mood: Optional[str] = None  # emoji
    note: Optional[str] = None
    period: Optional[bool] = None  # solo laury


class VoucherCraft(BaseModel):
    userId: Literal["laury", "danny"]
    name: str
    description: str


class VoucherAction(BaseModel):
    userId: Literal["laury", "danny"]
    voucherId: str


class ProfileUpdate(BaseModel):
    userId: Literal["laury", "danny"]
    name: Optional[str] = None
    age: Optional[str] = None
    birthday: Optional[str] = None
    zodiac: Optional[str] = None
    skills: Optional[str] = None
    avatar: Optional[str] = None  # selfie/avatar principal mostrado en la sesión


class PasswordChange(BaseModel):
    userId: Literal["laury", "danny"]
    currentPassword: str
    newPassword: str


class AvatarOptionAdd(BaseModel):
    userId: Literal["laury", "danny"]
    label: str
    url: str


class AvatarOptionDelete(BaseModel):
    userId: Literal["laury", "danny"]
    url: str


# ============ Helpers ============
def _ensure_defaults(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Backfill missing fields onto an existing state doc and return changed fields dict."""
    changes: Dict[str, Any] = {}
    if "profiles" not in doc or not isinstance(doc.get("profiles"), dict):
        changes["profiles"] = {k: dict(v) for k, v in DEFAULT_STATE["profiles"].items()}
    else:
        profiles = dict(doc["profiles"])
        dirty = False
        for uid in ("laury", "danny"):
            p = profiles.get(uid) or {}
            seed = DEFAULT_STATE["profiles"][uid]
            for k, v in seed.items():
                if k not in p:
                    p[k] = v
                    dirty = True
            profiles[uid] = p
        if dirty:
            changes["profiles"] = profiles
    if "avatarOptions" not in doc:
        changes["avatarOptions"] = {k: list(v) for k, v in DEFAULT_STATE["avatarOptions"].items()}
    if "events" not in doc:
        changes["events"] = []
    return changes


async def ensure_state():
    doc = await db.state.find_one({"_id": COUPLE_DOC_ID})
    if not doc:
        await db.state.insert_one({"_id": COUPLE_DOC_ID, **DEFAULT_STATE})
        doc = await db.state.find_one({"_id": COUPLE_DOC_ID})
    else:
        changes = _ensure_defaults(doc)
        if changes:
            await db.state.update_one({"_id": COUPLE_DOC_ID}, {"$set": changes})
            doc.update(changes)
    return doc


def strip_id(doc: Dict[str, Any]) -> Dict[str, Any]:
    return {k: v for k, v in doc.items() if k != "_id"}


def public_profile(doc: Dict[str, Any], user_id: str) -> Dict[str, Any]:
    profiles = doc.get("profiles") or {}
    base = dict(USERS_SEED[user_id])
    base.update(profiles.get(user_id) or {})
    base.pop("password", None)
    return base


def get_password(doc: Dict[str, Any], user_id: str) -> str:
    profiles = doc.get("profiles") or {}
    p = profiles.get(user_id) or {}
    return p.get("password") or USERS_SEED[user_id]["password"]


def compute_level(total_xp: int, max_per_level: int = 100) -> Dict[str, int]:
    level = total_xp // max_per_level + 1
    currentXP = total_xp % max_per_level
    return {"level": level, "currentXP": currentXP, "totalXP": total_xp}


def make_event(actor: Optional[str], ev_type: str, title: str, description: str, icon: str = "✨", color: Optional[str] = None) -> Dict[str, Any]:
    return {
        "id": f"e_{uuid.uuid4().hex[:10]}",
        "at": datetime.now(timezone.utc).isoformat(),
        "user": actor,
        "type": ev_type,
        "title": title,
        "description": description,
        "icon": icon,
        "color": color,
    }


def push_events(events: List[Dict[str, Any]], *new_events: Dict[str, Any]) -> List[Dict[str, Any]]:
    out = list(events or [])
    out.extend(new_events)
    if len(out) > MAX_EVENTS:
        out = out[-MAX_EVENTS:]
    return out


# ============ Routes ============
@api_router.get("/")
async def root():
    return {"message": "Te Quiero Con Locura API", "status": "ok"}

@api_router.get("/users")
async def get_users():
    doc = await ensure_state()
    return {
        "users": [public_profile(doc, "laury"), public_profile(doc, "danny")],
        "avatarOptions": doc.get("avatarOptions") or AVATAR_OPTIONS_SEED,
    }

@api_router.post("/auth/login", response_model=LoginResponse)
async def login(req: LoginRequest):
    if req.userId not in USERS_SEED:
        raise HTTPException(status_code=401, detail="Usuario no existe")
    doc = await ensure_state()
    expected = get_password(doc, req.userId)
    if req.password != expected:
        raise HTTPException(status_code=401, detail="Contraseña incorrecta")
    token = f"{req.userId}:{uuid.uuid4().hex}"
    return LoginResponse(token=token, user=public_profile(doc, req.userId))

@api_router.get("/state")
async def get_state():
    doc = await ensure_state()
    return strip_id(doc)

@api_router.patch("/state")
async def patch_state(patch: StatePatch):
    update = {k: v for k, v in patch.dict(exclude_unset=True).items() if v is not None}
    update["lastUpdated"] = datetime.now(timezone.utc).isoformat()
    await ensure_state()
    await db.state.update_one({"_id": COUPLE_DOC_ID}, {"$set": update})
    doc = await db.state.find_one({"_id": COUPLE_DOC_ID})
    return strip_id(doc)

@api_router.post("/state/xp")
async def add_xp(req: AddXPRequest):
    doc = await ensure_state()
    old_total = int(doc.get("userData", {}).get("totalXP", 0))
    old_level = old_total // 100 + 1
    total = old_total + int(req.amount)
    new_user_data = compute_level(total)
    new_level = new_user_data["level"]
    events = doc.get("events", [])
    actor = req.actor
    if req.amount > 0:
        ev = make_event(
            actor=actor,
            ev_type="xp",
            title=req.reason or "Experiencia",
            description=f"+{req.amount} XP",
            icon=req.icon or "❤️",
        )
        events = push_events(events, ev)
    update: Dict[str, Any] = {"userData": new_user_data, "events": events, "lastUpdated": datetime.now(timezone.utc).isoformat()}
    if new_level > old_level:
        gained = new_level - old_level
        vouchers = doc.get("vouchers", {"laury": {"tokens": 0, "crafted": []}, "danny": {"tokens": 0, "crafted": []}})
        for uid in ("laury", "danny"):
            entry = vouchers.get(uid) or {"tokens": 0, "crafted": []}
            entry["tokens"] = int(entry.get("tokens", 0)) + gained
            entry.setdefault("crafted", [])
            vouchers[uid] = entry
        update["vouchers"] = vouchers
        ev_lvl = make_event(
            actor=actor,
            ev_type="level_up",
            title=f"¡Nivel {new_level}!",
            description=f"+{gained} ticket{'s' if gained > 1 else ''} para cada uno",
            icon="🎟️",
        )
        update["events"] = push_events(update["events"], ev_lvl)
    await db.state.update_one({"_id": COUPLE_DOC_ID}, {"$set": update})
    return new_user_data

@api_router.post("/state/missions/create")
async def create_mission(req: MissionCreate):
    doc = await ensure_state()
    missions = doc.get("missions", {"laury": [], "danny": []})
    coin_map = {"comun": 2, "rara": 5, "epica": 10, "legendaria": 25}
    new_mission = {
        "id": f"m_{uuid.uuid4().hex[:10]}",
        "name": req.name,
        "description": req.description,
        "rarity": req.rarity,
        "reward": req.reward,
        "coinReward": coin_map.get(req.rarity, 2),
        "createdBy": req.createdBy,
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "completed": False,
    }
    missions.setdefault(req.targetUser, []).append(new_mission)
    target_name = (doc.get("profiles") or {}).get(req.targetUser, {}).get("name") or req.targetUser.capitalize()
    ev = make_event(
        actor=req.createdBy,
        ev_type="mission_create",
        title=f"Nueva misión para {target_name}",
        description=f"{req.name} · {req.rarity.upper()} · +{req.reward} XP",
        icon="📜",
    )
    events = push_events(doc.get("events", []), ev)
    await db.state.update_one(
        {"_id": COUPLE_DOC_ID},
        {"$set": {"missions": missions, "events": events, "lastUpdated": datetime.now(timezone.utc).isoformat()}},
    )
    return new_mission

@api_router.post("/state/missions/complete")
async def complete_mission(req: MissionAction):
    doc = await ensure_state()
    missions = doc.get("missions", {"laury": [], "danny": []})
    target_list = missions.get(req.targetUser, [])
    reward = 0
    coin_reward = 0
    mission_name = ""
    for m in target_list:
        if m["id"] == req.missionId and not m.get("completed"):
            m["completed"] = True
            m["completedAt"] = datetime.now(timezone.utc).isoformat()
            reward = int(m.get("reward", 0))
            coin_reward = int(m.get("coinReward", max(1, reward // 5)))
            mission_name = m.get("name", "Misión")
            break
    total = int(doc.get("userData", {}).get("totalXP", 0)) + reward
    new_user_data = compute_level(total)
    old_level = int(doc.get("userData", {}).get("totalXP", 0)) // 100 + 1
    new_level = new_user_data["level"]
    coins = doc.get("coins", {"laury": 0, "danny": 0})
    coins[req.targetUser] = int(coins.get(req.targetUser, 0)) + coin_reward
    actor = req.actor or req.targetUser
    events = push_events(
        doc.get("events", []),
        make_event(
            actor=actor,
            ev_type="mission_complete",
            title=f"Misión completada: {mission_name}",
            description=f"+{reward} XP · +{coin_reward} monedas",
            icon="🏁",
        ),
    )
    update_fields: Dict[str, Any] = {
        "missions": missions,
        "userData": new_user_data,
        "coins": coins,
        "events": events,
        "lastUpdated": datetime.now(timezone.utc).isoformat(),
    }
    if new_level > old_level:
        gained = new_level - old_level
        vouchers = doc.get("vouchers", {"laury": {"tokens": 0, "crafted": []}, "danny": {"tokens": 0, "crafted": []}})
        for uid in ("laury", "danny"):
            entry = vouchers.get(uid) or {"tokens": 0, "crafted": []}
            entry["tokens"] = int(entry.get("tokens", 0)) + gained
            entry.setdefault("crafted", [])
            vouchers[uid] = entry
        update_fields["vouchers"] = vouchers
        update_fields["events"] = push_events(
            update_fields["events"],
            make_event(
                actor=actor,
                ev_type="level_up",
                title=f"¡Nivel {new_level}!",
                description=f"+{gained} ticket{'s' if gained > 1 else ''} para cada uno",
                icon="🎟️",
            ),
        )
    await db.state.update_one(
        {"_id": COUPLE_DOC_ID},
        {"$set": update_fields},
    )
    return {"missions": missions, "userData": new_user_data, "coins": coins, "rewardGranted": reward, "coinsGranted": coin_reward}

@api_router.post("/state/missions/delete")
async def delete_mission(req: MissionAction):
    doc = await ensure_state()
    missions = doc.get("missions", {"laury": [], "danny": []})
    missions[req.targetUser] = [m for m in missions.get(req.targetUser, []) if m["id"] != req.missionId]
    await db.state.update_one(
        {"_id": COUPLE_DOC_ID},
        {"$set": {"missions": missions, "lastUpdated": datetime.now(timezone.utc).isoformat()}},
    )
    return {"missions": missions}


@api_router.post("/state/achievements/create")
async def create_achievement(req: AchievementCreate):
    doc = await ensure_state()
    achievements = doc.get("achievements", {"laury": [], "danny": []})
    if isinstance(achievements.get(req.targetUser), list) is False:
        achievements[req.targetUser] = []
    new_ach = {
        "id": f"a_{uuid.uuid4().hex[:10]}",
        "name": req.name,
        "description": req.description,
        "rarity": req.rarity,
        "imageUrl": req.imageUrl,
        "createdBy": req.createdBy,
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }
    achievements.setdefault(req.targetUser, []).append(new_ach)
    target_name = (doc.get("profiles") or {}).get(req.targetUser, {}).get("name") or req.targetUser.capitalize()
    events = push_events(
        doc.get("events", []),
        make_event(
            actor=req.createdBy,
            ev_type="achievement_create",
            title=f"Logro otorgado a {target_name}",
            description=f"{req.name} · {req.rarity.upper()}",
            icon="🏆",
        ),
    )
    await db.state.update_one(
        {"_id": COUPLE_DOC_ID},
        {"$set": {"achievements": achievements, "events": events, "lastUpdated": datetime.now(timezone.utc).isoformat()}},
    )
    return new_ach


@api_router.post("/state/achievements/delete")
async def delete_achievement(req: AchievementAction):
    doc = await ensure_state()
    achievements = doc.get("achievements", {"laury": [], "danny": []})
    if not isinstance(achievements.get(req.targetUser), list):
        achievements[req.targetUser] = []
    achievements[req.targetUser] = [a for a in achievements.get(req.targetUser, []) if a.get("id") != req.achievementId]
    await db.state.update_one(
        {"_id": COUPLE_DOC_ID},
        {"$set": {"achievements": achievements, "lastUpdated": datetime.now(timezone.utc).isoformat()}},
    )
    return {"achievements": achievements}


@api_router.get("/shop")
async def get_shop():
    return {"items": SHOP_ITEMS, "roulettes": ROULETTES}


@api_router.post("/state/shop/buy")
async def buy_item(req: BuyItemRequest):
    item = next((i for i in SHOP_ITEMS if i["id"] == req.itemId), None)
    if not item:
        raise HTTPException(404, "Item no encontrado")
    doc = await ensure_state()
    coins = doc.get("coins", {"laury": 0, "danny": 0})
    if coins.get(req.userId, 0) < item["price"]:
        raise HTTPException(400, "Monedas insuficientes")
    coins[req.userId] = int(coins[req.userId]) - int(item["price"])
    inv = doc.get("inventory", {"laury": [], "danny": []})
    if not isinstance(inv.get(req.userId), list):
        inv[req.userId] = []
    inv_item = {
        "id": f"inv_{uuid.uuid4().hex[:10]}",
        "itemId": item["id"],
        "name": item["name"],
        "icon": item["icon"],
        "desc": item["desc"],
        "acquiredAt": datetime.now(timezone.utc).isoformat(),
    }
    inv[req.userId].append(inv_item)
    events = push_events(
        doc.get("events", []),
        make_event(
            actor=req.userId,
            ev_type="shop_buy",
            title=f"Compró {item['name']}",
            description=f"-{item['price']} monedas",
            icon=item.get("icon") or "🛒",
        ),
    )
    await db.state.update_one(
        {"_id": COUPLE_DOC_ID},
        {"$set": {"coins": coins, "inventory": inv, "events": events, "lastUpdated": datetime.now(timezone.utc).isoformat()}},
    )
    return {"coins": coins, "inventory": inv, "added": inv_item}


@api_router.post("/state/shop/gift")
async def gift_item(req: GiftItemRequest):
    if req.fromUser == req.toUser:
        raise HTTPException(400, "No puedes regalarte a ti mismo")
    doc = await ensure_state()
    inv = doc.get("inventory", {"laury": [], "danny": []})
    from_list = inv.get(req.fromUser, [])
    item = next((x for x in from_list if x.get("id") == req.inventoryItemId), None)
    if not item:
        raise HTTPException(404, "Item no encontrado en el inventario")
    inv[req.fromUser] = [x for x in from_list if x.get("id") != req.inventoryItemId]
    if not isinstance(inv.get(req.toUser), list):
        inv[req.toUser] = []
    item_for_target = dict(item)
    item_for_target["giftedBy"] = req.fromUser
    item_for_target["giftedAt"] = datetime.now(timezone.utc).isoformat()
    inv[req.toUser].append(item_for_target)
    target_name = (doc.get("profiles") or {}).get(req.toUser, {}).get("name") or req.toUser.capitalize()
    events = push_events(
        doc.get("events", []),
        make_event(
            actor=req.fromUser,
            ev_type="gift",
            title=f"Regalo para {target_name}",
            description=f"{item.get('name', 'Item')}",
            icon=item.get("icon") or "🎁",
        ),
    )
    await db.state.update_one(
        {"_id": COUPLE_DOC_ID},
        {"$set": {"inventory": inv, "events": events, "lastUpdated": datetime.now(timezone.utc).isoformat()}},
    )
    return {"inventory": inv}


@api_router.post("/state/minigame/play")
async def play_minigame(req: MinigameResult):
    # Cuesta 1 moneda jugar; reward viene del frontend después del juego
    doc = await ensure_state()
    coins = doc.get("coins", {"laury": 0, "danny": 0})
    if coins.get(req.userId, 0) < 1:
        raise HTTPException(400, "Necesitas al menos 1 moneda para jugar")
    coins[req.userId] = int(coins[req.userId]) - 1 + int(req.reward)
    net = int(req.reward) - 1
    events = push_events(
        doc.get("events", []),
        make_event(
            actor=req.userId,
            ev_type="minigame",
            title=f"Jugó minijuego {req.gameId}",
            description=("+" if net >= 0 else "") + f"{net} monedas (recompensa {req.reward}, coste 1)",
            icon="🎮",
        ),
    )
    await db.state.update_one(
        {"_id": COUPLE_DOC_ID},
        {"$set": {"coins": coins, "events": events, "lastUpdated": datetime.now(timezone.utc).isoformat()}},
    )
    return {"coins": coins, "gained": req.reward, "spent": 1}


@api_router.post("/state/calendar")
async def upsert_calendar(req: CalendarEntryRequest):
    doc = await ensure_state()
    cal = doc.get("calendar", {})
    if not isinstance(cal, dict):
        cal = {}
    entry = cal.get(req.date) or {"moods": {}, "notes": [], "period": False}
    if not isinstance(entry, dict):
        entry = {"moods": {}, "notes": [], "period": False}
    entry.setdefault("moods", {})
    entry.setdefault("notes", [])
    if "period" not in entry:
        entry["period"] = False
    if req.mood is not None:
        entry["moods"][req.userId] = req.mood
    if req.note:
        entry["notes"].append({
            "id": f"n_{uuid.uuid4().hex[:8]}",
            "by": req.userId,
            "text": req.note,
            "at": datetime.now(timezone.utc).isoformat(),
        })
    if req.period is not None and req.userId == "laury":
        entry["period"] = bool(req.period)
    cal[req.date] = entry
    await db.state.update_one(
        {"_id": COUPLE_DOC_ID},
        {"$set": {"calendar": cal, "lastUpdated": datetime.now(timezone.utc).isoformat()}},
    )
    return {"calendar": cal}


@api_router.post("/state/calendar/delete_note")
async def delete_calendar_note(payload: Dict[str, Any]):
    date = payload.get("date")
    note_id = payload.get("noteId")
    if not date or not note_id:
        raise HTTPException(400, "Faltan parámetros")
    doc = await ensure_state()
    cal = doc.get("calendar", {}) or {}
    entry = cal.get(date)
    if entry and isinstance(entry.get("notes"), list):
        entry["notes"] = [n for n in entry["notes"] if n.get("id") != note_id]
        cal[date] = entry
        await db.state.update_one(
            {"_id": COUPLE_DOC_ID},
            {"$set": {"calendar": cal, "lastUpdated": datetime.now(timezone.utc).isoformat()}},
        )
    return {"calendar": cal}


def _ensure_vouchers(doc: Dict[str, Any]) -> Dict[str, Any]:
    v = doc.get("vouchers")
    if not isinstance(v, dict):
        v = {}
    for uid in ("laury", "danny"):
        if not isinstance(v.get(uid), dict):
            v[uid] = {"tokens": 0, "crafted": []}
        v[uid].setdefault("tokens", 0)
        v[uid].setdefault("crafted", [])
    return v


@api_router.post("/state/vouchers/craft")
async def craft_voucher(req: VoucherCraft):
    doc = await ensure_state()
    vouchers = _ensure_vouchers(doc)
    if int(vouchers[req.userId]["tokens"]) < 1:
        raise HTTPException(400, "No tienes deseos disponibles")
    vouchers[req.userId]["tokens"] -= 1
    new_v = {
        "id": f"v_{uuid.uuid4().hex[:10]}",
        "name": req.name,
        "description": req.description,
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "redeemed": False,
    }
    vouchers[req.userId]["crafted"].append(new_v)
    events = push_events(
        doc.get("events", []),
        make_event(
            actor=req.userId,
            ev_type="voucher_craft",
            title=f"Canjeó ticket por deseo",
            description=req.name,
            icon="🎟️",
        ),
    )
    await db.state.update_one(
        {"_id": COUPLE_DOC_ID},
        {"$set": {"vouchers": vouchers, "events": events, "lastUpdated": datetime.now(timezone.utc).isoformat()}},
    )
    return {"vouchers": vouchers, "created": new_v}


@api_router.post("/state/vouchers/redeem")
async def redeem_voucher(req: VoucherAction):
    doc = await ensure_state()
    vouchers = _ensure_vouchers(doc)
    found = False
    redeemed_name = ""
    for v in vouchers[req.userId]["crafted"]:
        if v.get("id") == req.voucherId and not v.get("redeemed"):
            v["redeemed"] = True
            v["redeemedAt"] = datetime.now(timezone.utc).isoformat()
            redeemed_name = v.get("name", "Deseo")
            found = True
            break
    if not found:
        raise HTTPException(404, "Deseo no encontrado")
    events = push_events(
        doc.get("events", []),
        make_event(
            actor=req.userId,
            ev_type="voucher_redeem",
            title="Cumplió un deseo",
            description=redeemed_name,
            icon="💫",
        ),
    )
    await db.state.update_one(
        {"_id": COUPLE_DOC_ID},
        {"$set": {"vouchers": vouchers, "events": events, "lastUpdated": datetime.now(timezone.utc).isoformat()}},
    )
    return {"vouchers": vouchers}


@api_router.post("/state/vouchers/delete")
async def delete_voucher(req: VoucherAction):
    doc = await ensure_state()
    vouchers = _ensure_vouchers(doc)
    vouchers[req.userId]["crafted"] = [v for v in vouchers[req.userId]["crafted"] if v.get("id") != req.voucherId]
    await db.state.update_one(
        {"_id": COUPLE_DOC_ID},
        {"$set": {"vouchers": vouchers, "lastUpdated": datetime.now(timezone.utc).isoformat()}},
    )
    return {"vouchers": vouchers}


# ============ Profile ============
@api_router.post("/profile/update")
async def update_profile(req: ProfileUpdate):
    doc = await ensure_state()
    profiles = doc.get("profiles") or {}
    p = dict(profiles.get(req.userId) or {})
    changed = []
    for field in ("name", "age", "birthday", "zodiac", "skills", "avatar"):
        v = getattr(req, field)
        if v is not None and str(v).strip() != "":
            p[field] = str(v)
            changed.append(field)
    profiles[req.userId] = p
    events = doc.get("events", [])
    if changed:
        ev = make_event(
            actor=req.userId,
            ev_type="profile_update",
            title="Editó su perfil",
            description=", ".join(changed),
            icon="📝",
        )
        events = push_events(events, ev)
    await db.state.update_one(
        {"_id": COUPLE_DOC_ID},
        {"$set": {"profiles": profiles, "events": events, "lastUpdated": datetime.now(timezone.utc).isoformat()}},
    )
    return {"profiles": profiles, "user": public_profile({"profiles": profiles}, req.userId)}


@api_router.post("/profile/password")
async def change_password(req: PasswordChange):
    doc = await ensure_state()
    current = get_password(doc, req.userId)
    if req.currentPassword != current:
        raise HTTPException(401, "Contraseña actual incorrecta")
    if not req.newPassword or len(req.newPassword) < 3:
        raise HTTPException(400, "La nueva contraseña debe tener al menos 3 caracteres")
    profiles = doc.get("profiles") or {}
    p = dict(profiles.get(req.userId) or {})
    p["password"] = req.newPassword
    profiles[req.userId] = p
    events = push_events(
        doc.get("events", []),
        make_event(
            actor=req.userId,
            ev_type="password_change",
            title="Cambió su contraseña",
            description="🔒",
            icon="🔒",
        ),
    )
    await db.state.update_one(
        {"_id": COUPLE_DOC_ID},
        {"$set": {"profiles": profiles, "events": events, "lastUpdated": datetime.now(timezone.utc).isoformat()}},
    )
    return {"ok": True}


@api_router.post("/profile/avatar/add")
async def add_avatar_option(req: AvatarOptionAdd):
    doc = await ensure_state()
    options = doc.get("avatarOptions") or {"laury": [], "danny": []}
    arr = list(options.get(req.userId) or [])
    if not req.url or not req.label:
        raise HTTPException(400, "Faltan datos")
    if any(o.get("url") == req.url for o in arr):
        raise HTTPException(400, "Ese avatar ya existe")
    arr.append({"label": req.label.strip()[:40], "url": req.url})
    options[req.userId] = arr
    events = push_events(
        doc.get("events", []),
        make_event(
            actor=req.userId,
            ev_type="avatar_add",
            title="Añadió un avatar nuevo",
            description=req.label,
            icon="🖼️",
        ),
    )
    await db.state.update_one(
        {"_id": COUPLE_DOC_ID},
        {"$set": {"avatarOptions": options, "events": events, "lastUpdated": datetime.now(timezone.utc).isoformat()}},
    )
    return {"avatarOptions": options}


@api_router.post("/profile/avatar/delete")
async def delete_avatar_option(req: AvatarOptionDelete):
    doc = await ensure_state()
    options = doc.get("avatarOptions") or {"laury": [], "danny": []}
    arr = [o for o in (options.get(req.userId) or []) if o.get("url") != req.url]
    options[req.userId] = arr
    await db.state.update_one(
        {"_id": COUPLE_DOC_ID},
        {"$set": {"avatarOptions": options, "lastUpdated": datetime.now(timezone.utc).isoformat()}},
    )
    return {"avatarOptions": options}


@api_router.post("/state/events/clear")
async def clear_events():
    await db.state.update_one(
        {"_id": COUPLE_DOC_ID},
        {"$set": {"events": [], "lastUpdated": datetime.now(timezone.utc).isoformat()}},
    )
    return {"ok": True}


@api_router.post("/state/reset")
async def reset_state():
    await db.state.update_one(
        {"_id": COUPLE_DOC_ID},
        {"$set": DEFAULT_STATE},
        upsert=True,
    )
    return {"ok": True}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
