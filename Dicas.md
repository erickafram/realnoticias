SUBIR GIT
git add .
git commit -m "Fix: Corrigir middleware legacyRedirect para não bloquear URLs AMP válidas"
git push -u origin main


#Servidor de Produção Portal convictos - INSTALAÇÃO INICIAL
cd /home/portalconvictos/htdocs/www.portalconvictos.com.br
git clone https://github.com/erickafram/realnoticias.git .
npm install
cp .env.example .env
# Editar .env com as configurações do banco de dados
npx sequelize-cli db:create
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
pm2 start src/app.js --name portalconvictos
pm2 save
pm2 startup

#Servidor de Produção Portal convictos - ATUALIZAÇÃO
cd /home/portalconvictos/htdocs/www.portalconvictos.com.br
git pull origin main
npm install
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
pm2 restart portalconvictos

# Em caso de conflitos:
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