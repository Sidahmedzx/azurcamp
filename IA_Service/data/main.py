"""
Smart Pricing AI + Campsite Popularity Predictor — FastAPI Service
"""

import os
import uuid
import sys
from pathlib import Path
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR / "data"))
from model.predictor import PricePredictor
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import numpy as np

from model.predictor import PricePredictor
from vision.extractor import FeatureExtractor

# Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
)
logger = logging.getLogger("smart-pricing")

# Config
TEMP_DIR = Path("tmp")
TEMP_DIR.mkdir(exist_ok=True)

MODEL_PATH = Path("model/model.pkl")
POPULARITY_MODEL_PATH = Path("model/popularity_model.joblib")
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_FILE_SIZE_MB = 10

# App lifecycle
predictor: PricePredictor | None = None
extractor: FeatureExtractor | None = None
popularity_model = None

# Campsite popularity climate data
CLIMATE_DATA = {
    "ain draham":  [6, 7, 10, 13, 17, 22, 27, 27, 22, 17, 11, 7],
    "kelibia":     [11, 11, 13, 16, 19, 24, 27, 28, 25, 21, 16, 12],
    "tunis":       [10, 11, 13, 16, 20, 25, 28, 29, 25, 20, 15, 11],
    "hammamet":    [11, 12, 14, 16, 20, 24, 28, 28, 25, 21, 16, 12],
    "sousse":      [11, 12, 14, 17, 20, 25, 28, 29, 25, 21, 16, 12],
    "djerba":      [12, 13, 15, 18, 22, 26, 30, 31, 27, 23, 17, 13],
    "bizerte":     [10, 10, 12, 15, 19, 23, 27, 27, 24, 19, 14, 11],
    "tabarka":     [10, 10, 12, 15, 18, 23, 27, 27, 23, 19, 14, 11],
    "tozeur":      [11, 13, 17, 21, 26, 32, 36, 35, 30, 24, 17, 12],
    "douz":        [10, 12, 16, 20, 25, 31, 35, 34, 29, 23, 16, 11],
}

MONTH_NAMES = {
    "January": 1, "February": 2, "March": 3, "April": 4,
    "May": 5, "June": 6, "July": 7, "August": 8,
    "September": 9, "October": 10, "November": 11, "December": 12
}

def get_avg_temperature(location: str, month: int) -> float:
    loc = location.lower().strip()
    for city, temps in CLIMATE_DATA.items():
        if city in loc or loc in city:
            return temps[month - 1]
    return CLIMATE_DATA["tunis"][month - 1]


@asynccontextmanager
async def lifespan(app: FastAPI):
    global predictor, extractor, popularity_model
    logger.info("Loading ML models and vision extractor...")
    predictor = PricePredictor(MODEL_PATH)
    extractor = FeatureExtractor()
    if POPULARITY_MODEL_PATH.exists():
        popularity_model = joblib.load(POPULARITY_MODEL_PATH)
        logger.info(f"Popularity model loaded from {POPULARITY_MODEL_PATH}")
    else:
        logger.warning(f"Popularity model not found at {POPULARITY_MODEL_PATH}")
    logger.info("Ready.")
    yield
    logger.info("Shutting down.")


# Application
app = FastAPI(
    title="Smart Pricing AI + Campsite Popularity",
    description="Equipment pricing via vision + ML, and campsite popularity prediction",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200", "http://localhost:8084"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

# ========== Schemas (Equipment - existing) ==========

class ProductFeatures(BaseModel):
    brand: str
    material: str
    waterproof_level: float
    demand: int
    season: str
    competitor_price: float

class PredictionResponse(BaseModel):
    request_id: str
    features: ProductFeatures
    recommended_price: float
    confidence_range: dict[str, float]

# ========== Schemas (Campsite Popularity - new) ==========

class PopularityInput(BaseModel):
    price: float
    location: str
    month: str

# ========== Routes (Equipment - existing) ==========

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "equipment_model_loaded": predictor is not None,
        "popularity_model_loaded": popularity_model is not None
    }

@app.post("/predict-price", response_model=PredictionResponse)
async def predict_price(
    file: UploadFile = File(...),
    competitor_price: float = Form(default=40.0),
    demand: int = Form(default=70),
    season: str = Form(default="summer"),
):
    request_id = str(uuid.uuid4())[:8]

    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Format non supporte : {suffix}. Acceptes : {ALLOWED_EXTENSIONS}",
        )

    content = await file.read()
    if len(content) > MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Fichier trop volumineux (max 10 MB)")

    temp_path = TEMP_DIR / f"{request_id}{suffix}"
    try:
        temp_path.write_bytes(content)
        logger.info(f"[{request_id}] Image sauvegardee : {temp_path}")

        features = extractor.extract(temp_path)
        features["demand"] = demand
        features["season"] = season
        features["competitor_price"] = competitor_price

        logger.info(f"[{request_id}] Features : {features}")

        price, bounds = predictor.predict(features)
        logger.info(f"[{request_id}] Prix recommande : {price:.2f}")

        return PredictionResponse(
            request_id=request_id,
            features=ProductFeatures(**features),
            recommended_price=round(price, 2),
            confidence_range={"low": round(bounds[0], 2), "high": round(bounds[1], 2)},
        )

    except Exception as exc:
        logger.exception(f"[{request_id}] Erreur prediction : {exc}")
        raise HTTPException(status_code=500, detail=str(exc))

    finally:
        if temp_path.exists():
            temp_path.unlink()

# ========== Routes (Campsite Popularity - new) ==========

@app.post("/predict")
async def predict_popularity(input: PopularityInput):
    if popularity_model is None:
        raise HTTPException(status_code=500, detail="Popularity model not loaded")

    try:
        month_num = MONTH_NAMES.get(input.month)
        if not month_num:
            raise ValueError(f"Invalid month: {input.month}")

        temperature = get_avg_temperature(input.location, month_num)

        X = np.array([[input.price, temperature]])
        score = popularity_model.predict(X)[0]

        score = max(0, min(100, score))

        return {
            'popularity_score': round(float(score), 1),
            'temperature': temperature,
            'month': input.month,
            'input': {
                'price': input.price,
                'location': input.location
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))