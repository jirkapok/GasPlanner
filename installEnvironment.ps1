# Install script to install development tools using cocholatey

# NodeJs
choco install nvm -y
nvm install -lts
nvm use -lts

# Visual Studio Code
choco install vscode -y
# Optional
# code --install-extension ms-vscode.powershell
npm install -g @angular/cli
npm install -g typescript

# NPM Packages
.\build.ps1