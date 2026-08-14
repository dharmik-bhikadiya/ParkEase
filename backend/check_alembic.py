import sys
import os
from pathlib import Path

backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from alembic.config import Config
from app.models import Base

print("Alembic configuration test:")
print("- SQLAlchemy models in Base.metadata:", sorted(list(Base.metadata.tables.keys())))

config = Config(str(backend_dir / "alembic.ini"))
print("- Alembic script location:", config.get_main_option("script_location"))
print("Alembic setup successfully verified!")
