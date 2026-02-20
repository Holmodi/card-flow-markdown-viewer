use std::fs;
use std::path::Path;

use tauri::{AppHandle, State};

use crate::frontmatter::{get_body, parse_card};
use crate::models::CardMeta;
use crate::scanner;
use crate::watcher::WatcherState;

#[tauri::command]
pub async fn scan_directory(
    app: AppHandle,
    state: State<'_, WatcherState>,
    path: String,
    depth: u32,
) -> Result<(), String> {
    let app_clone = app.clone();
    let path_clone = path.clone();

    tokio::task::spawn_blocking(move || {
        scanner::scan_directory(&app_clone, &path_clone, depth);
    })
    .await
    .map_err(|e| e.to_string())?;

    crate::watcher::start_watching(&app, &path, &state)?;

    Ok(())
}

#[tauri::command]
pub async fn read_file(path: String) -> Result<String, String> {
    let content = fs::read_to_string(&path).map_err(|e| format!("Failed to read file: {}", e))?;
    // 跳过 YAML frontmatter，只返回正文
    Ok(get_body(&content).to_string())
}

#[tauri::command]
pub async fn write_file(path: String, content: String) -> Result<CardMeta, String> {
    fs::write(&path, &content).map_err(|e| format!("Failed to write file: {}", e))?;
    parse_card(Path::new(&path)).ok_or_else(|| "Failed to parse updated file".to_string())
}

#[tauri::command]
pub async fn create_file(directory: String, filename: String) -> Result<CardMeta, String> {
    let name = if filename.ends_with(".md") {
        filename
    } else {
        format!("{}.md", filename)
    };
    let full_path = Path::new(&directory).join(&name);

    if full_path.exists() {
        return Err("File already exists".to_string());
    }

    let initial = format!("---\ntitle: \"{}\"\ntags: []\n---\n", name.trim_end_matches(".md"));
    fs::write(&full_path, &initial).map_err(|e| format!("Failed to create file: {}", e))?;

    parse_card(&full_path).ok_or_else(|| "Failed to parse new file".to_string())
}

#[tauri::command]
pub async fn delete_file(path: String) -> Result<(), String> {
    fs::remove_file(&path).map_err(|e| format!("Failed to delete file: {}", e))
}
