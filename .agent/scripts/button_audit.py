import os
import re

# Configuration
ROOT_DIR = "." 
REPORT_FILE = ".agent/reports/button_inventory.md"
EXCLUDE_DIRS = {"node_modules", ".git", ".agent", "dist", "build", "coverage", ".vscode"}

# Regex patterns to capture buttons and clickable elements
# 1. Native <button> tags
# 2. Component <Button> tags (Shadcn/UI libs)
# 3. Any element with onClick event
bs = r"<button\b[^>]*>(.*?)</button>"
# Simple reliable regex is hard for nested tags, so we will do line-by-line analysis for audit purposes
# This is lighter and sufficient for "inventory".

PATTERNS = [
    (r"<button\b", "HTML Button"),
    (r"<Button\b", "UI Component Button"),
    (r"onClick=\{", "Click Handler (Interactive)"),
]

def scan_directory(root_path):
    inventory = {}

    for dirpath, dirnames, filenames in os.walk(root_path):
        # Filter directories in-place to avoid walking them
        dirnames[:] = [d for d in dirnames if d not in EXCLUDE_DIRS]
        
        for filename in filenames:
            if filename.endswith(".tsx"):
                full_path = os.path.join(dirpath, filename)
                relative_path = os.path.relpath(full_path, start=".")
                
                findings = analyze_file(full_path)
                if findings:
                    inventory[relative_path] = findings
    
    return inventory

def analyze_file(file_path):
    findings = []
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            lines = f.readlines()
            
        for i, line in enumerate(lines):
            line_num = i + 1
            content = line.strip()
            
            for pattern, type_name in PATTERNS:
                if re.search(pattern, content):
                    # Clean up content for display (max 100 chars)
                    display_content = content[:100] + "..." if len(content) > 100 else content
                    # Escape markdown characters in code
                    display_content = display_content.replace("`", "'")
                    
                    findings.append({
                        "line": line_num,
                        "type": type_name,
                        "code": display_content
                    })
                    break # Avoid double counting if a line has multiple attributes (e.g. <button onClick=...)
                    
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        
    return findings

def generate_report(inventory, output_path):
    # Ensure directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("# Inventário de Interatividade (Botões & Ações)\n\n")
        f.write(f"Gerado automaticamente. Escopo: `{ROOT_DIR}`\n\n")
        
        if not inventory:
            f.write("Nenhum elemento interativo encontrado.\n")
            return

        total_files = len(inventory)
        total_elements = sum(len(items) for items in inventory.values())
        
        f.write(f"**Resumo:** {total_elements} elementos interativos encontrados em {total_files} arquivos.\n\n")
        f.write("---\n\n")
        
        # Sort by filename
        for filepath in sorted(inventory.keys()):
            items = inventory[filepath]
            f.write(f"## `{filepath}`\n")
            
            for item in items:
                f.write(f"- **Linha {item['line']}** ({item['type']}): `{item['code']}`\n")
            
            f.write("\n")

if __name__ == "__main__":
    print(f"Iniciando auditoria em {ROOT_DIR}...")
    
    if not os.path.exists(ROOT_DIR):
        print(f"Diretório {ROOT_DIR} não encontrado!")
        # Try finding it relative to current CWD
        print(f"CWD: {os.getcwd()}")
    else:
        results = scan_directory(ROOT_DIR)
        generate_report(results, REPORT_FILE)
        print(f"Relatório gerado em: {REPORT_FILE}")
