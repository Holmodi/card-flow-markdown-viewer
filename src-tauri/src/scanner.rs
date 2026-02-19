use std::fs::{self, ReadDir};
use std::path::Path;
use std::time::Instant;

use tauri::{AppHandle, Emitter};

use crate::frontmatter::parse_card;
use crate::models::{CardMeta, ScanBatch, ScanComplete};

macro_rules! log {
    ($($arg:tt)*) => {
        eprintln!("[scanner] {}", format!($($arg)*))
    };
}

const BATCH_SIZE: usize = 200;

fn scan_dir_recursive(
    app: &AppHandle,
    dir: &str,
    batch: &mut Vec<CardMeta>,
    total: &mut usize,
    files_checked: &mut usize,
    non_md_files: &mut usize,
    parse_failures: &mut usize,
) {
    let read_dir = fs::read_dir(dir).ok();

    if let Some(entries) = read_dir {
        process_entries(
            app,
            entries,
            dir,
            batch,
            total,
            files_checked,
            non_md_files,
            parse_failures,
        );
    }
}

fn process_entries(
    app: &AppHandle,
    entries: ReadDir,
    _base_dir: &str,
    batch: &mut Vec<CardMeta>,
    total: &mut usize,
    files_checked: &mut usize,
    non_md_files: &mut usize,
    parse_failures: &mut usize,
) {
    for entry in entries.flatten() {
        let path = entry.path();

        // 跳过隐藏文件和目录
        if let Some(name) = entry.file_name().to_str() {
            if name.starts_with('.') {
                continue;
            }
        }

        if path.is_dir() {
            // 递归扫描子目录
            if let Some(dir_str) = path.to_str() {
                scan_dir_recursive(
                    app,
                    dir_str,
                    batch,
                    total,
                    files_checked,
                    non_md_files,
                    parse_failures,
                );
            }
        } else {
            *files_checked += 1;

            let ext = path.extension().and_then(|e| e.to_str());
            if ext != Some("md") {
                *non_md_files += 1;
                continue;
            }

            match parse_card(&path) {
                Some(card) => {
                    batch.push(card);
                    *total += 1;
                }
                None => {
                    *parse_failures += 1;
                    log!("Failed to parse file: {:?}", path);
                }
            }

            if batch.len() >= BATCH_SIZE {
                let _ = app.emit(
                    "scan-batch",
                    ScanBatch {
                        cards: batch.clone(),
                        scanned_so_far: *total,
                    },
                );
                batch.clear();
            }
        }
    }
}

pub fn scan_directory(app: &AppHandle, dir: &str) {
    log!("Starting scan of directory: {}", dir);
    let start = Instant::now();
    let mut batch: Vec<CardMeta> = Vec::with_capacity(BATCH_SIZE);
    let mut total: usize = 0;
    let mut files_checked: usize = 0;
    let mut non_md_files: usize = 0;
    let mut parse_failures: usize = 0;

    scan_dir_recursive(
        app,
        dir,
        &mut batch,
        &mut total,
        &mut files_checked,
        &mut non_md_files,
        &mut parse_failures,
    );

    log!("Files checked: {}, Non-md files: {}, Parse failures: {}", files_checked, non_md_files, parse_failures);

    // Emit remaining cards
    if !batch.is_empty() {
        let _ = app.emit(
            "scan-batch",
            ScanBatch {
                cards: batch,
                scanned_so_far: total,
            },
        );
    }

    let duration = start.elapsed();
    log!("Scan complete. Total files: {}, Duration: {}ms", total, duration.as_millis());
    let _ = app.emit(
        "scan-complete",
        ScanComplete {
            total_files: total,
            duration_ms: duration.as_millis() as u64,
        },
    );
}

pub fn parse_single_file(path: &str) -> Option<CardMeta> {
    parse_card(Path::new(path))
}
