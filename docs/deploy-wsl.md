# WSL로 Cloudflare Workers 배포하기

## 1. WSL에서 프로젝트 폴더로 이동

```bash
cd /mnt/d/Documents/program_DEV/wow3d_all_print
```

## 2. Node.js 설치 확인 (WSL에서)

```bash
node --version
npm --version
```

없다면 설치:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

## 3. 의존성 설치 (처음이라면)

```bash
npm install
```

## 4. 배포

```bash
npm run deploy
```

또는 직접:
```bash
npx @opennextjs/cloudflare build
npx @opennextjs/cloudflare deploy
```

## 5. 배포 확인

배포가 완료되면 다음 URL에서 확인:
- https://wow3d-all-print.jayseo36.workers.dev
- 또는 Cloudflare Dashboard에서 표시된 URL

---

## 문제 해결

### wrangler 인증 필요 시
```bash
npx wrangler login
```

### .open-next 폴더 삭제 후 재시도
```bash
rm -rf .open-next
npm run deploy
```
