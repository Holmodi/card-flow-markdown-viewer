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
    current_depth: u32,
    max_depth: u32,
) {
    // max_depth 为 0 表示无限制，current_depth 从 0 开始
    // 当 max_depth > 0 时，如果 current_depth >= max_depth 则停止递归
    if max_depth > 0 && current_depth >= max_depth {
        return;
    }

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
            current_depth,
            max_depth,
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
    current_depth: u32,
    max_depth: u32,
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
                    current_depth + 1,
                    max_depth,
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

pub fn scan_directory(app: &AppHandle, dir: &str, depth: u32) {
    log!("Starting scan of directory: {} with depth: {}", dir, depth);
    let start = Instant::now();
    let mut batch: Vec<CardMeta> = Vec::with_capacity(BATCH_SIZE);
    let mut total: usize = 0;
    let mut files_checked: usize = 0;
    let mut non_md_files: usize = 0;
    let mut parse_failures: usize = 0;

    // 深度为 0 时表示无限制（前端传 5 表示无限制）
    // 深度从 0 开始计算：0 = 只扫描当前目录，1 = 扫描当前目录 + 1层子目录
    let max_depth = if depth == 5 { 0 } else { depth };

    scan_dir_recursive(
        app,
        dir,
        &mut batch,
        &mut total,
        &mut files_checked,
        &mut non_md_files,
        &mut parse_failures,
        0,
        max_depth,
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
