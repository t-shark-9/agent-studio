use std::process::Command;

use serde::Serialize;

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

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![run_terminal_command, runtime_target])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
