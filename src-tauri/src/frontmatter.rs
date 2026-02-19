use std::fs;
use std::path::Path;
use std::time::{SystemTime, UNIX_EPOCH};

use crate::models::CardMeta;
use regex::Regex;

fn system_time_to_iso(t: SystemTime) -> String {
    let secs = t.duration_since(UNIX_EPOCH).unwrap_or_default().as_secs();
    // 简单格式化为 ISO 8601 字符串，便于字符串排序
    let s = secs as i64;
    let (y, mo, d, h, mi, sec) = epoch_to_ymd(s);
    format!("{:04}-{:02}-{:02}T{:02}:{:02}:{:02}Z", y, mo, d, h, mi, sec)
}

fn epoch_to_ymd(secs: i64) -> (i64, i64, i64, i64, i64, i64) {
    let sec = secs % 60;
    let mins = secs / 60;
    let min = mins % 60;
    let hours = mins / 60;
    let hour = hours % 24;
    let days = hours / 24;
    // 简单日期计算（格里高利历）
    let mut y = 1970i64;
    let mut d = days;
    loop {
        let dy = if is_leap(y) { 366 } else { 365 };
        if d < dy { break; }
        d -= dy;
        y += 1;
    }
    let months = [31, if is_leap(y) { 29 } else { 28 }, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let mut mo = 1i64;
    for &dm in &months {
        if d < dm { break; }
        d -= dm;
        mo += 1;
    }
    (y, mo, d + 1, hour, min, sec)
}

fn is_leap(y: i64) -> bool {
    (y % 4 == 0 && y % 100 != 0) || y % 400 == 0
}

/// 从文本中提取 #tag 标签
fn extract_inline_tags(text: &str) -> Vec<String> {
    let re = Regex::new(r"#([\w\u4e00-\u9fa5\-]+)").unwrap();
    re.captures_iter(text)
        .filter_map(|cap| cap.get(1).map(|m| m.as_str().to_string()))
        .collect()
}

pub fn parse_card(path: &Path) -> Option<CardMeta> {
    // 先获取元数据，立即释放
    let metadata = match fs::metadata(path) {
        Ok(m) => m,
        Err(_) => return None,
    };
    let size = metadata.len();

    // 获取时间戳
    let fs_modified = metadata.modified().ok().map(system_time_to_iso);
    let fs_created = metadata.created().ok().map(system_time_to_iso);

    // 读取文件内容
    let content = match fs::read_to_string(path) {
        Ok(c) => c,
        Err(_) => return None,
    };

    let (frontmatter, body) = extract_frontmatter(&content);

    let title = frontmatter
        .as_ref()
        .and_then(|fm| fm.get("title").and_then(|v| v.as_str()).map(String::from))
        .unwrap_or_else(|| {
            path.file_stem()
                .map(|s| s.to_string_lossy().to_string())
                .unwrap_or_default()
        });

    let mut tags: Vec<String> = frontmatter
        .as_ref()
        .and_then(|fm| {
            fm.get("tags").and_then(|v| {
                v.as_sequence().map(|seq| {
                    seq.iter()
                        .filter_map(|item| item.as_str().map(String::from))
                        .collect()
                })
            })
        })
        .unwrap_or_default();

    // 从 body 开头提取 #tag 标签
    let body_start = &body.chars().take(500).collect::<String>();
    let inline_tags = extract_inline_tags(body_start);
    tags.extend(inline_tags);
    tags.sort_unstable();
    tags.dedup();

    let created = frontmatter
        .as_ref()
        .and_then(|fm| fm.get("created").and_then(|v| v.as_str().map(String::from)))
        .or(fs_created);

    let updated = frontmatter
        .as_ref()
        .and_then(|fm| fm.get("updated").and_then(|v| v.as_str().map(String::from)))
        .or(fs_modified);

    let preview: String = body.chars().take(200).collect();

    Some(CardMeta {
        path: path.to_string_lossy().to_string(),
        title,
        tags,
        created,
        updated,
        preview: preview.trim().to_string(),
        size,
    })
}

fn extract_frontmatter(content: &str) -> (Option<serde_yaml::Value>, &str) {
    let trimmed = content.trim_start();
    if !trimmed.starts_with("---") {
        return (None, content);
    }

    let after_first = &trimmed[3..];
    if let Some(end_pos) = after_first.find("\n---") {
        let yaml_str = &after_first[..end_pos];
        let body_start = end_pos + 4; // skip \n---
        let body = after_first[body_start..].trim_start_matches('\n');
        let parsed: Option<serde_yaml::Value> = serde_yaml::from_str(yaml_str).ok();
        (parsed, body)
    } else {
        (None, content)
    }
}

/// 获取文件正文，跳过 YAML frontmatter
pub fn get_body(content: &str) -> &str {
    extract_frontmatter(content).1
}
