"""Base types for the DimenSys AI framework."""

from abc import ABC, abstractmethod
from typing import Dict, Any


class Dimension(ABC):
    """Base class for all dimension plugins."""
    
    @property
    @abstractmethod
    def name(self) -> str:
        """Return the dimension name."""
        pass
    
    @abstractmethod
    def process(self, text: str) -> Dict[str, Any]:
        """Process text and return dimension analysis.
        
        Args:
            text: Input text to analyze
            
        Returns:
            Dictionary containing:
            - label: str - classification result
            - confidence: float - confidence score (0-1)
            - explanation: str - explanation of result
            - error: Optional[str] - error message if failed
        """
        pass
