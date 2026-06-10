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

USERS = {
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

LAURY_PORTRAIT = "https://customer-assets.emergentagent.com/job_ios-sync-app/artifacts/zjnsflg7_laury.png"
DANNY_PORTRAIT = "https://customer-assets.emergentagent.com/job_ios-sync-app/artifacts/zdg6ii1f_danny.png"

LAURY_PC = "https://i.postimg.cc/wxNJNTps/2.png"
DANNY_PC = "https://i.postimg.cc/BbFxQJqb/1.png"

DEFAULT_AVATARS = {
    "laury": LAURY_PC,
    "danny": DANNY_PC,
}

AVATAR_OPTIONS = {
    "laury": [
        {"label": "En el PC", "url": LAURY_PC},
        {"label": "Durmiendo", "url": "https://i.postimg.cc/6qx8cnXQ/4.png"},
    ],
    "danny": [
        {"label": "En el PC", "url": DANNY_PC},
        {"label": "Durmiendo", "url": "https://i.postimg.cc/VvFkFhgD/3.png"},
        {"label": "Trabajando", "url": "https://i.postimg.cc/8cT1sHGn/Copia-de-it-takes-two-(1).png"},
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
    "achievements": {"laury": [], "danny": []},
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


# ============ Helpers ============
async def ensure_state():
    doc = await db.state.find_one({"_id": COUPLE_DOC_ID})
    if not doc:
        await db.state.insert_one({"_id": COUPLE_DOC_ID, **DEFAULT_STATE})
        doc = await db.state.find_one({"_id": COUPLE_DOC_ID})
    return doc

def strip_id(doc: Dict[str, Any]) -> Dict[str, Any]:
    return {k: v for k, v in doc.items() if k != "_id"}

def public_user(user_id: str) -> Dict[str, Any]:
    u = USERS[user_id].copy()
    u.pop("password", None)
    return u

def compute_level(total_xp: int, max_per_level: int = 100) -> Dict[str, int]:
    level = total_xp // max_per_level + 1
    currentXP = total_xp % max_per_level
    return {"level": level, "currentXP": currentXP, "totalXP": total_xp}


# ============ Routes ============
@api_router.get("/")
async def root():
    return {"message": "Te Quiero Con Locura API", "status": "ok"}

@api_router.get("/users")
async def get_users():
    return {
        "users": [public_user("laury"), public_user("danny")],
        "avatarOptions": AVATAR_OPTIONS,
    }

@api_router.post("/auth/login", response_model=LoginResponse)
async def login(req: LoginRequest):
    user = USERS.get(req.userId)
    if not user or req.password != user["password"]:
        raise HTTPException(status_code=401, detail="Contraseña incorrecta")
    token = f"{req.userId}:{uuid.uuid4().hex}"
    return LoginResponse(token=token, user=public_user(req.userId))

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
    total = int(doc.get("userData", {}).get("totalXP", 0)) + int(req.amount)
    new_user_data = compute_level(total)
    await db.state.update_one(
        {"_id": COUPLE_DOC_ID},
        {"$set": {"userData": new_user_data, "lastUpdated": datetime.now(timezone.utc).isoformat()}},
    )
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
    await db.state.update_one(
        {"_id": COUPLE_DOC_ID},
        {"$set": {"missions": missions, "lastUpdated": datetime.now(timezone.utc).isoformat()}},
    )
    return new_mission

@api_router.post("/state/missions/complete")
async def complete_mission(req: MissionAction):
    doc = await ensure_state()
    missions = doc.get("missions", {"laury": [], "danny": []})
    target_list = missions.get(req.targetUser, [])
    reward = 0
    coin_reward = 0
    for m in target_list:
        if m["id"] == req.missionId and not m.get("completed"):
            m["completed"] = True
            m["completedAt"] = datetime.now(timezone.utc).isoformat()
            reward = int(m.get("reward", 0))
            coin_reward = int(m.get("coinReward", max(1, reward // 5)))
            break
    total = int(doc.get("userData", {}).get("totalXP", 0)) + reward
    new_user_data = compute_level(total)
    coins = doc.get("coins", {"laury": 0, "danny": 0})
    coins[req.targetUser] = int(coins.get(req.targetUser, 0)) + coin_reward
    await db.state.update_one(
        {"_id": COUPLE_DOC_ID},
        {"$set": {
            "missions": missions,
            "userData": new_user_data,
            "coins": coins,
            "lastUpdated": datetime.now(timezone.utc).isoformat(),
        }},
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
    await db.state.update_one(
        {"_id": COUPLE_DOC_ID},
        {"$set": {"achievements": achievements, "lastUpdated": datetime.now(timezone.utc).isoformat()}},
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
