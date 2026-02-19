mod commands;
mod frontmatter;
mod models;
mod scanner;
mod watcher;

use watcher::WatcherState;
use std::sync::Mutex;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .manage(WatcherState(Mutex::new(None)))
        .invoke_handler(tauri::generate_handler![
            commands::scan_directory,
            commands::read_file,
            commands::write_file,
            commands::create_file,
            commands::delete_file,
        ])
        .setup(|app| {
            #[cfg(target_os = "macos")]
            {
                use tauri::Manager;
                let window = app.get_webview_window("main").unwrap();
                // 设置 macOS 深色主题
                window.set_theme(Some(tauri::Theme::Dark))?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
