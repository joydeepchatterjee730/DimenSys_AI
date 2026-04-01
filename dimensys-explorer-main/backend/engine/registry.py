"""
Registry of dimension name → implementation class.

The engine imports this module only; individual dimensions live in their own files.
"""

from typing import Dict, Type

from backend.engine.types import Dimension

# Global registry for dimension plugins
DIMENSION_REGISTRY: Dict[str, Type[Dimension]] = {}


def register_dimension(name: str, cls: Type[Dimension]) -> None:
    """Register a dimension plugin.
    
    Args:
        name: Dimension name (unique identifier)
        cls: Dimension class implementation
    """
    DIMENSION_REGISTRY[name] = cls


def get_dimension(name: str) -> Type[Dimension]:
    """Get a dimension class by name.
    
    Args:
        name: Dimension name
        
    Returns:
        Dimension class
        
    Raises:
        KeyError: If dimension not found
    """
    if name not in DIMENSION_REGISTRY:
        raise KeyError(f"Dimension '{name}' not found in registry")
    return DIMENSION_REGISTRY[name]


def list_dimensions() -> list[str]:
    """List all registered dimension names.
    
    Returns:
        List of dimension names
    """
    return list(DIMENSION_REGISTRY.keys())


# Import dimensions to register themselves
from backend.engine.sentiment import SentimentDimension
from backend.engine.intent import IntentDimension
from backend.engine.risk import RiskDimension
from backend.engine.semantic import SemanticDimension
