from django.db import models

from django.core.validators import FileExtensionValidator


class UploadedImage(models.Model):
    img = models.ImageField(upload_to="images", validators=[FileExtensionValidator(["jpg"])])
    # img = models.ImageField(upload_to="images")
