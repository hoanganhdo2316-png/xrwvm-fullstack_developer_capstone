from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class CarMake(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class CarModel(models.Model):
    SEDAN = "Sedan"
    SUV = "SUV"
    WAGON = "Wagon"
    COUPE = "Coupe"
    HATCHBACK = "Hatchback"
    CONVERTIBLE = "Convertible"
    OTHER = "Other"
    CAR_TYPES = [(item, item) for item in (SEDAN, SUV, WAGON, COUPE, HATCHBACK, CONVERTIBLE, OTHER)]

    car_make = models.ForeignKey(CarMake, on_delete=models.CASCADE, related_name="car_models")
    name = models.CharField(max_length=100)
    type = models.CharField(max_length=20, choices=CAR_TYPES, default=OTHER)
    year = models.IntegerField(validators=[MinValueValidator(2015), MaxValueValidator(2030)])

    class Meta:
        ordering = ["car_make__name", "name", "-year"]
        constraints = [models.UniqueConstraint(fields=["car_make", "name", "year"], name="unique_make_model_year")]

    def __str__(self):
        return f"{self.car_make.name} {self.name} ({self.year})"
