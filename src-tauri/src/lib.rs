// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::Command;
use serde::Serialize;
use tauri::Manager;

#[derive(Serialize)]
struct DesktopCommandResult {
    stdout: String,
    stderr: String,
    exit_code: i32,
}

fn is_allowed_command(command: &str) -> bool {
    matches!(command, "pwd" | "ls" | "whoami" | "date" | "uname")
}

#[tauri::command]
fn run_terminal_command(command: String, args: Vec<String>) -> Result<DesktopCommandResult, String> {
    if !is_allowed_command(&command) {
        return Err(format!("Command '{}' is not allowed.", command));
    }

    let output = Command::new(&command)
        .args(&args)
        .output()
        .map_err(|error| format!("Failed to execute command: {}", error))?;

    Ok(DesktopCommandResult {
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
        exit_code: output.status.code().unwrap_or(-1),
    })
}

#[tauri::command]
fn runtime_target() -> &'static str {
    "desktop"
}

#[tauri::command]
fn get_platform() -> String {
    std::env::consts::OS.to_string()
}

#[tauri::command]
fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            run_terminal_command,
            runtime_target,
            get_platform,
            get_app_version
        ])
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
