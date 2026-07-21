import json
import logging
from pathlib import Path
from django.db import transaction
from .models import CarMake, CarModel

logger = logging.getLogger(__name__)
DATA_FILE = Path(__file__).resolve().parents[1] / "database" / "data" / "car_records.json"
VALID_TYPES = {choice for choice, _ in CarModel.CAR_TYPES}


def initiate(data_file=DATA_FILE):
    try:
        records = json.loads(Path(data_file).read_text(encoding="utf-8")).get("cars", [])
    except (OSError, json.JSONDecodeError) as exc:
        logger.warning("Could not load vehicle data: %s", exc)
        return {"created": 0, "skipped": 0, "error": str(exc)}
    created = skipped = 0
    with transaction.atomic():
        for record in records:
            try:
                make_name = str(record["make"]).strip()
                model_name = str(record["model"]).strip()
                year = int(record["year"])
                if not make_name or not model_name or not 2015 <= year <= 2030:
                    raise ValueError("invalid vehicle values")
                car_make, _ = CarMake.objects.get_or_create(
                    name=make_name, defaults={"description": f"{make_name} vehicles"}
                )
                body_type = str(record.get("bodyType", "Other")).title()
                if body_type not in VALID_TYPES:
                    body_type = CarModel.OTHER
                _, was_created = CarModel.objects.update_or_create(
                    car_make=car_make, name=model_name, year=year, defaults={"type": body_type}
                )
                created += int(was_created)
            except (KeyError, TypeError, ValueError):
                skipped += 1
    return {"created": created, "skipped": skipped}
