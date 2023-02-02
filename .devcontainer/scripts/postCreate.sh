{
    npm i
    git config --global user.email \"${localEnv:GIT_EMAIL}\"
    git config --global user.name \"${localEnv:GIT_USER}\"
    npx tailwindcss-cli -i ./src/style.css -o ./dist/style.css --watch
}
