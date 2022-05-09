from django.shortcuts import render
from django.http import HttpResponse


def index(request):
    return HttpResponse("Hello there! Waiting for img to be uploaded ;)")


from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt  # WARNING: insecure - dont do this in prod

from .models import UploadedImage
from .forms import UploadedImageForm


@csrf_exempt
def upload(request, htmx=False, xhr=False):

    print(request.method)
    print("is ajax")
    print(request.is_ajax())

    if request.method == "OPTIONS":

        # See index.js about preflighted request

        response = HttpResponse("", content_type="text/plain")
        response["Access-Control-Allow-Origin"] = "*"  # WARNING: example only
        response["Access-Control-Allow-Methods"] = "POST, GET, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type, HTTP_X_REQUESTED_WITH"
        response["Access-Control-Max-Age"] = 1728000
        # response["Content-Type"] = "text/plain"
        # print("Returning response", response)
        return response

    elif request.method == "POST":
        print("===")
        print(request.POST)
        print(request.FILES)
        print("===")
        form = UploadedImageForm(request.POST, request.FILES)
        if form.is_valid():
            form.save()
            response = JsonResponse({
                "error": False,
                "message": "Uploaded successfully",
            })
            response["Access-Control-Allow-Origin"] = "*"  # WARNING: example only
            return response
        else:
            print(form.errors)
            response = JsonResponse({
                "error": True,
                "errors": form.errors,
            })
            response["Access-Control-Allow-Origin"] = "*"  # WARNING: example only
            return response
    else:
        form = UploadedImageForm()

        if htmx:
            return render(request, "upload_htmx.html", {"form": form})
        elif xhr:
            return render(request, "upload_xhr.html", {"form": form})
        else:
            return render(request, "upload.html", {"form": form})


def images(request):

    images = UploadedImage.objects.all()
    print(images)
    return render(request, "images.html", {"images": images})

