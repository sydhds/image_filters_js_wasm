== Goals ==

* Experiment with Javascript (Ajax api's, canvas)
* See if Rust can be compiled to wasm && js
* Write a backend in both Django/Python and Rust/Axum
  * playing with CORS + prefligh request
  * static files
  * templates rendering (Axum)
  * a bit of htmx (Django only)

== Features ==

* Load image and apply filter
  * vanilla js
  * [TODO] wasm compiled (from Rust)
  * [TODO] js compiled (from Rust)
* Upload image:
  * javascript fetch
  * javascript XmlHTTPRequest
* Web server:
  * Django (Python)
  * Axum (Rust, Tokio) + Askama (template rendering)

== Compile == 

cd rust_img_uploader && cargo build

== Setup ==

Only for Django:
* python3 -m venv venv && venv/bin/python -m pip install -r requirements.txt

== Howto ==

* If you want to upload images
  * Start Django: cd django_img_uploader && ../venv/bin/python ./manage.py runserver
  * or Start Axum: cd rust_img_uploader && mkdir images && cargo run

* Open in a web browser: index.html
  * Browse for an image
  * Apply filter
  * Click 'Compress' button
  * Click either on 'Upload' button (fetch js) or 'Upload + progress' button (XmlHTTPRequest)

* Upload is also avail. if you go to:
  * Django: 
    * http://127.0.0.1:8000/upload # regular django file upload
    * http://127.0.0.1:8000/upload_htmx # htmx upload + progress
    * http://127.0.0.1:8000/upload_xhr # XmlHTTPRequest + progress
  * Axum:
    * http://127.0.0.1:8000/ # regular form upload
