"""Abstract base for dimension processors."""

from abc import ABC, abstractmethod
from typing import Any, Dict


class BaseDimension(ABC):
    """Base class for a single analytical dimension."""

    @property
    @abstractmethod
    def name(self) -> str:
        """Stable identifier used in API config (e.g. 'sentiment')."""

    @abstractmethod
    def process(self, text: str) -> Dict[str, Any]:
        """
        Analyze `text` and return a structured dict.

        Expected keys align with DimensionOutput (name, label, confidence,
        explanation, time); `time` is normally set by the engine wrapper.
        """
        raise NotImplementedError
