FROM oven/bun:1 AS base
WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install --production

COPY . .

RUN mkdir -p data uploads

ENV NODE_ENV=production

CMD ["bun", "run", "src/index.ts"]
