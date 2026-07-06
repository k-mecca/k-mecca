// pm2가 관리하는 두 프로세스 정의 (EC2 위에서만 사용, 로컬 개발엔 불필요)
module.exports = {
  apps: [
    {
      name: "backend-node", // nginx가 3000번으로 연결
      cwd: "/home/ubuntu/k-mecca/backend-node",
      script: "server.js",
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "ai-engine-python", // CLIP 인식 엔진, 127.0.0.1 로컬호스트로만 열어서 외부 접근 차단
      cwd: "/home/ubuntu/k-mecca/ai-engine-python",
      script: ".venv/bin/uvicorn",
      args: "app:app --host 127.0.0.1 --port 8000",
      interpreter: "none", // uvicorn 실행파일을 그대로 실행
    },
  ],
};
