# backend/Dockerfile
FROM docker.1ms.run/library/python:3.9-slim

WORKDIR /app

# 复制依赖并安装
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple

# 复制后端所有代码
COPY . .

# 暴露端口
EXPOSE 8000

# 启动命令：使用 uvicorn 运行 main.py 中的 app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]