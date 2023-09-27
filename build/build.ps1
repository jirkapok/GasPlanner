# clean

if (Test-Path dist) {
    Remove-Item dist -Recurse -Force
}

if (Test-Path node_modules) {
    Remove-Item node_modules -Recurse -Force
}

# Compile
npm install
npm run build-lib
npm run build
