"""django_img_uploader URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from functools import partial

from django.contrib import admin
from django.urls import path

from img_uploader import views as iviews

urlpatterns = [
    path('', iviews.index),
    path('upload/', iviews.upload, name="upload"),
    path('upload_htmx/', partial(iviews.upload, htmx=True)),
    path('upload_xhr/', partial(iviews.upload, htmx=False, xhr=True)),
    path('images/', iviews.images),
    # path('images/', iviews.upload),
    path('admin/', admin.site.urls),
]

from django.conf import settings
from django.conf.urls.static import static

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
