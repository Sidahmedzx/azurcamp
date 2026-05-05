from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import numpy as np

model = joblib.load('popularity_model.joblib')

app = FastAPI(title='API Prediction Popularite Campsite', version='3.0.0')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:4200'],
    allow_methods=['*'],
    allow_headers=['*']
)

# Températures moyennes par ville et par mois (en °C)
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
    
    # Par défaut Tunis
    return CLIMATE_DATA["tunis"][month - 1]

class PredictionInput(BaseModel):
    price: float
    location: str
    month: str

@app.get('/')
def health():
    return {'status': 'ok'}

@app.post('/predict')
def predict(input: PredictionInput):
    try:
        month_num = MONTH_NAMES.get(input.month)
        if not month_num:
            raise ValueError(f"Invalid month: {input.month}")
        
        temperature = get_avg_temperature(input.location, month_num)
        
        X = np.array([[input.price, temperature]])
        score = model.predict(X)[0]
        
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