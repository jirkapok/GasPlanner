# Install script to install development tools using cocholatey

# NodeJs
choco install nvm -y
nvm install lts
nvm use lts
npm install -g @angular/cli
npm install -g typescript

# Visual Studio Code
choco install vscode -y
# Optional extensions
# code --install-extension ms-vscode.powershell
# code --install-extension angular.ng-template

# NPM Packages
.\build.ps1
