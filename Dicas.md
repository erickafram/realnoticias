SUBIR GIT
git add .
git commit -m "Fix: Corrigir middleware legacyRedirect para não bloquear URLs AMP válidas"
git push -u origin main


#Servidor de Produção Portal convictos
cd /home/portalconvictos/htdocs/portalconvictos.com.br/portalconvictos
git pull origin main
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
pm2 restart portalconvictos

git fetch origin
git reset --hard origin/main
npm install
pm2 restart portalconvictos



#Servidor de Produção Participa TO
cd /home/participato/htdocs/participato.com.br/participato
git pull origin main
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
pm2 restart participato

#Servidor de Produção Real Noticias
cd /home/realnoticias/htdocs/realnoticias.com.br
git checkout --ours src/app.js
git add src/app.js
git stash drop
git pull origin main
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
pm2 restart realnoticias