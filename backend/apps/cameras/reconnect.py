import time
import logging

logger = logging.getLogger(__name__)


class ReconnectPolicy:
    def __init__(self, max_attempts: int = 5, initial_delay_sec: float = 2.0, backoff_factor: float = 1.5):
        self.max_attempts = max_attempts
        self.initial_delay_sec = initial_delay_sec
        self.backoff_factor = backoff_factor
        self.current_attempt = 0
        self.last_attempt_time = 0.0

    def can_attempt(self) -> bool:
        return self.current_attempt < self.max_attempts

    def record_attempt(self) -> float:
        self.current_attempt += 1
        self.last_attempt_time = time.time()
        delay = self.initial_delay_sec * (self.backoff_factor ** (self.current_attempt - 1))
        logger.info(f"RTSP reconnect attempt {self.current_attempt}/{self.max_attempts}. Delay: {delay:.1f}s")
        return delay

    def reset(self):
        self.current_attempt = 0
        self.last_attempt_time = 0.0
