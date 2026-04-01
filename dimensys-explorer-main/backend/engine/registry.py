"""
Registry of dimension name → implementation class.

The engine imports this module only; individual dimensions live in their own files.
"""

from typing import Dict, Type

from backend.engine.base_dimension import BaseDimension
from backend.engine.intent import IntentDimension
from backend.engine.risk import RiskDimension
from backend.engine.semantic import SemanticDimension
from backend.engine.sentiment import SentimentDimension

DIMENSION_REGISTRY: Dict[str, Type[BaseDimension]] = {
    "sentiment": SentimentDimension,
    "intent": IntentDimension,
    "risk": RiskDimension,
    "semantic": SemanticDimension,
}
