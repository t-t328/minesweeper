FROM node:20-alpine

WORKDIR /app

# 依存関係のインストール用ファイルをコピー
COPY package*.json ./

RUN npm install

# ソースコードをコピー
COPY . .

EXPOSE 5173

# ViteのHMR（ホットリロード）を効かせるためホストを0.0.0.0に指定
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]