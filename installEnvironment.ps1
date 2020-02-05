# Install script to install development tools using cocholatey

# NodeJs
choco install nvm -y
nvm install -lts
nvm use -lts

# Visual Studio Code
choco install vscode -y
# Optional
# code --install-extension ms-vscode.powershell
npm install -g @angular/cli@8.3
npm install -g typescript@3.5.3

# NPM Packages
npm install --no-optional

# Compile dependency
npm run build-lib
npm install scuba-physics