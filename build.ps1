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

# that is an optional dependency, this sequence
# is work around for not wokring npm --no-optional switch
npm install dist/scuba-physics --no-package-lock 
npm run build