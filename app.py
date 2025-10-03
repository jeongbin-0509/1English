from flask import Flask, render_template, request, redirect, url_for, make_response
from supabase import create_client
from dotenv import load_dotenv
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from pathlib import Path
import os

# 1) .env를 app.py와 같은 폴더에서 확실히 로드
load_dotenv(dotenv_path=Path(__file__).with_name(".env"))

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "change-this-in-prod")

# 2) Rate limiter (개발용: memory 저장소 명시)
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["200/hour"],
    storage_uri="memory://",   # 개발용. 배포 시 redis://... 로 교체
)

# 3) Supabase 환경변수 안전하게 읽기
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError(
        "❌ Supabase 환경변수가 비었습니다.\n"
        f"- SUPABASE_URL 설정됨? {bool(SUPABASE_URL)}\n"
        f"- SUPABASE_KEY/ANON_KEY 설정됨? {bool(SUPABASE_KEY)}\n"
        "같은 폴더의 .env를 확인하세요:\n"
        "SUPABASE_URL=https://xxxx.supabase.co\n"
        "SUPABASE_KEY=eyJ...\n"
        "SECRET_KEY=아무값\n"
    )

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

@app.route("/")
def home():
    return redirect(url_for("login"))

@app.route("/login", methods=["GET","POST"])
@limiter.limit("10/minute")  # 로그인 시도 제한
def login():
    if request.method == "POST":
        email = request.form.get("username")
        password = request.form.get("password")

        try:
            res = supabase.auth.sign_in_with_password({"email": email, "password": password})
        except Exception as e:
            # SDK/네트워크 에러 방지용
            return f"로그인 중 오류: {e}", 500

        user = res.user
        session = res.session  # tokens 포함

        if user and session:
            resp = make_response(redirect(url_for("dashboard")))
            # ⚠ 개발(HTTP)에서는 secure=False로 해야 쿠키가 붙음
            resp.set_cookie("access_token", session.access_token, httponly=True, secure=False, samesite="Lax")
            resp.set_cookie("refresh_token", session.refresh_token, httponly=True, secure=False, samesite="Lax")
            return resp
        return "로그인 실패", 401

    return render_template("login.html")

@app.route("/dashboard")
def dashboard():
    token = request.cookies.get("access_token")
    if not token:
        return redirect(url_for("login"))
    try:
        user = supabase.auth.get_user(token).user
    except Exception:
        return redirect(url_for("login"))
    return f"환영합니다, {user.email}!"

@app.route("/logout")
def logout():
    resp = make_response(redirect(url_for("login")))
    resp.delete_cookie("access_token")
    resp.delete_cookie("refresh_token")
    return resp

if __name__ == "__main__":
    app.run(debug=True)
