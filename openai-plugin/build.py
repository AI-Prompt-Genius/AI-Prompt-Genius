"""Build the public OpenAI upload ZIP without private reviewer information."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parent
package = root / 'ai-prompt-genius'
output = root / 'ai-prompt-genius.zip'
files = ['.codex-plugin/plugin.json', '.mcp.json', 'assets/logo.png']
with ZipFile(output, 'w', ZIP_DEFLATED) as archive:
    for relative in files:
        archive.write(package / relative, relative)
print(output)
