npm ci
npm run build-lib
# that is an optional dependency, this sequence
# is work around for not wokring npm --no-optional switch
npm install dist/scuba-physics --no-package-lock 
npm run build