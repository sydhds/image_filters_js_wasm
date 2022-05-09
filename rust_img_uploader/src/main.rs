// use std::ffi::OsString;
use std::fs;
use std::io::Write; // trait: for write_all()
// use std::path::PathBuf; // trait: for write_all()


use axum::{routing::get, Router};
use axum::response::{Html, Json, Response, IntoResponse};
use axum::extract::{ContentLengthLimit, Multipart};
use axum::extract::multipart::MultipartError;
use axum::http::{Method, StatusCode};

use tower_http::cors::{self, CorsLayer, Origin};
use tower_http::services::ServeDir;
use http::header::{HeaderName, CONTENT_TYPE};

use serde_json::{Value, json};

use askama::Template;
use axum::routing::get_service;

#[tokio::main]
async fn main() {

    let app = Router::new()
        .route("/", get(show_form).post(accept_form))
        .route("/images", get(show_images))
        .nest("/static", get_service(ServeDir::new(".")).handle_error(
            |error: std::io::Error| async move {
                (StatusCode::INTERNAL_SERVER_ERROR, format!("Internal error: {}", error))
            }
        ))
        .layer(
            CorsLayer::new()
                .allow_origin(cors::Any)
                .allow_headers(cors::Any)
                // .allow_headers(vec![CONTENT_TYPE, HeaderName::from_static("REQUESTED_WITH")])
                .allow_methods(vec![Method::GET, Method::POST, Method::OPTIONS])
        );

    axum::Server::bind(&"127.0.0.1:8000".parse().unwrap())
        .serve(app.into_make_service())
        .await
        .unwrap();
}

async fn show_form() -> Html<&'static str> {
    Html(
        r#"
        <!doctype html>
        <html>
            <head></head>
            <body>
                <form action="/" method="POST", enctype="multipart/form-data">
                    <label>
                        Upload file:
                        <input type="file" name="file" multiple>
                    </label>
                    <input type="submit" value="Upload files">
                </form>
            </body>
        </html>
        "#,
    )
}

#[derive(Debug, thiserror::Error)]
enum UploadImageError {
    #[error("i/o error: {0}")]
    IO(#[from] std::io::Error),
    #[error("persist error: {0}")]
    Persist(#[from] tempfile::PersistError),
    #[error("form error: {0}")]
    Form(#[from] MultipartError),
}


impl IntoResponse for UploadImageError {
    fn into_response(self) -> Response {

        // Here we match what we did in Django
        let status = StatusCode::OK;
        let body = Json(json!({
            "error": false,
            "message": format!("[Axum] Upload error: {}", &self),
        }));

        (status, body).into_response()
    }
}


async fn accept_form(ContentLengthLimit(mut multipart): ContentLengthLimit<Multipart, {
     250 * 1024 * 1024 /* 250 Mb */
}>) -> Result<Json<Value>, UploadImageError> {

    if let Some(field) = multipart.next_field().await? {
        let _name = field.name()
            .ok_or_else(||
                std::io::Error::new(std::io::ErrorKind::InvalidData,
                                    "field name error"))?
            .to_string();
        let _file_name = field.file_name().ok_or_else(||
                std::io::Error::new(std::io::ErrorKind::InvalidData,
                                    "field file_name error"))?
            .to_string();

        let mime = field.content_type().ok_or_else(||
            std::io::Error::new(std::io::ErrorKind::InvalidData,
                                "field content type error"))?;

        if mime.type_() != mime::IMAGE &&
            mime.subtype() != mime::JPEG {
            return Err(UploadImageError::IO(std::io::Error::new(std::io::ErrorKind::InvalidData,
                                 "field file_name error")));
        }

        let data = field.bytes().await?;

        /*
        println!(
            "Length of {} ({} - {}) is {} bytes",
            name,
            file_name,
            content_type,
            data.len(),
        );
        */

        let mut tmp_fp = tempfile::Builder::new()
            .suffix(".jpg")
            .rand_bytes(10)
            .tempfile_in("./images/")?;
        tmp_fp.write_all(&data)?;
        let (_, p) = tmp_fp.keep()?;
        println!("Image saved to {}", p.display());
        // break;

        // To be consistent with Django app
        // let's return a json response
        return Ok(Json(json!({
            "error": false,
            "message": "[Axum] Uploaded successfully",
        })));
    }

    // To be consistent with Django app
    // let's return a json response
    Ok(Json(json!({
            "error": true,
            "message": "[Axum] missing fields",
        })))

}

#[derive(Template)]
#[template(path = "images.html")]
struct ImagesTemplate {
    images: Vec<String>
}

struct HtmlTemplate<T>(T);

impl<T> IntoResponse for HtmlTemplate<T> where T: Template {
    fn into_response(self) -> Response {
        match self.0.render() {
            Ok(html) => Html(html).into_response(),
            Err(e) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to render template, error: {}", e)
            ).into_response()
        }
    }
}

fn is_jpeg_file(filename: &str) -> bool {
    filename
        .rsplit('.')
        .next()
        .map(|ext| ext.eq_ignore_ascii_case("jpg")) == Some(true)
}

async fn show_images() -> impl IntoResponse {

    let dir_entries = fs::read_dir("./images").unwrap();
    let mut images = vec![];

    for dir_entry in dir_entries.into_iter().flatten() {
        if let Ok(ps) = dir_entry.path().into_os_string().into_string() {
            if is_jpeg_file(&ps) {
                images.push(ps);
            }
        }
    }

    // println!("images: {:?}", images);
    let template = ImagesTemplate { images };
    HtmlTemplate(template)
}
