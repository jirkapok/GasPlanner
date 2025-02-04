# Install script to install development tools using cocholatey

# NodeJs
choco install nvm -y
nvm install lts
nvm use lts
npm install -g @angular/cli
npm install -g typescript

# For E2e tests
npx playwright install chromium

# Visual Studio Code
choco install vscode -y
# Optional extensions
# code --install-extension ms-vscode.powershell
# code --install-extension angular.ng-template
# code --install-extension ms-playwright.playwright

# NPM Packages
.\build.ps1
