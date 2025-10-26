from flask import Flask, render_template, request, redirect, url_for, make_response, flash, jsonify
from supabase import create_client
from gotrue.errors import AuthApiError, AuthWeakPasswordError  # ✅ 추가
from dotenv import load_dotenv
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from pathlib import Path
import os

# .env 로드 (app.py와 같은 폴더)
load_dotenv(dotenv_path=Path(__file__).with_name(".env"))

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "change-this")

# 개발용 rate limiter (메모리 저장)
limiter = Limiter(
    key_func=get_remote_address,  # ✅ v3 시그니처 호환
    app=app,
    default_limits=["200/hour"],
    storage_uri="memory://",
)

# Supabase 클라이언트
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("SUPABASE_URL 또는 SUPABASE_KEY가 .env에 설정되지 않았습니다.")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# 가짜 이메일 만들고 그 이메일에서 학번만 추출
def to_email(user_id: str) -> str:
    """아이디를 가짜 이메일로 통일 변환"""
    return f"{(user_id or '').strip().lower()}@local.id"

@app.route("/")
def home():
    return redirect(url_for("login"))

# 단어장 불러오기
@app.route("/words")
def words():
    return render_template("wb.html")

# 오답 복습 불러오기
@app.route("/odap")
def odap():
    return render_template("odap.html")

# 예문 창 불러오기 (✅ 한 번만 정의)
@app.route("/example")
def example():
    return render_template("example.html")

# 메인 창으로 돌아가기
@app.route("/main_page")
def main_page():
    return render_template("index.html")

# 즐겨찾기 페이지
@app.route("/favorite")
def favorite():
    return render_template("favorite.html")


# 로그인
@app.route("/login", methods=["GET", "POST"])
@limiter.limit("10/minute")
def login():
    if request.method == "POST":
        user_id = request.form.get("username")
        password = request.form.get("password")
        fake_email = to_email(user_id)

        try:
            res = supabase.auth.sign_in_with_password({"email": fake_email, "password": password})
            session = res.session
        except AuthApiError as e:
            print("AuthApiError (login):", e)
            flash("❌ 아이디 또는 비밀번호가 올바르지 않습니다.", "error")
            return redirect(url_for("login"))
        except Exception as e:
            print("Login error:", e)
            flash("❌ 로그인 중 오류가 발생했습니다.", "error")
            return redirect(url_for("login"))

        if session:
            resp = make_response(redirect(url_for("dashboard")))
            resp.set_cookie("access_token", session.access_token, httponly=True, secure=True, samesite="Lax")
            resp.set_cookie("refresh_token", session.refresh_token, httponly=True, secure=True, samesite="Lax")
            flash("✅ 로그인 성공!", "success")
            return resp

        flash("❌ 로그인 실패", "error")
        return redirect(url_for("login"))

    return render_template("login.html")

# 회원가입
@app.route("/signup", methods=["GET", "POST"])
@limiter.limit("5/minute")
def signup():
    if request.method == "POST":
        user_id = request.form.get("username")
        password = request.form.get("password")
        fake_email = to_email(user_id)

        try:
            res = supabase.auth.sign_up({"email": fake_email, "password": password})
            user = res.user
        except AuthWeakPasswordError:
            flash("❌ 비밀번호가 너무 약합니다. 대문자/숫자/특수문자 포함 권장!", "error")
            return redirect(url_for("signup"))
        except AuthApiError as e:
            print("AuthApiError (signup):", e)
            msg = str(e)
            if "User already registered" in msg or "already registered" in msg:
                flash("❌ 이미 가입된 아이디입니다.", "error")
                return redirect(url_for("signup"))
            if "invalid format" in msg:
                flash("❌ 아이디 형식이 잘못되었습니다. 영문/숫자 3~30자로 입력하세요.", "error")
                return redirect(url_for("signup"))
            flash(f"❌ 회원가입 오류: {e}", "error")
            return redirect(url_for("signup"))
        except Exception as e:
            print("Signup error:", e)
            flash("❌ 회원가입 중 알 수 없는 오류", "error")
            return redirect(url_for("signup"))

        if user:
            flash("✅ 회원가입 성공! 로그인해주세요.", "success")
            return redirect(url_for("login"))

        flash("❌ 회원가입 실패", "error")
        return redirect(url_for("signup"))

    return render_template("signup.html")

# ✅ 대시보드 라우트는 한 번만 선언
@app.route("/dashboard")
def dashboard():
    token = request.cookies.get("access_token")
    if not token:
        flash("로그인이 필요합니다.", "error")
        return redirect(url_for("login"))
    try:
        user = supabase.auth.get_user(token).user
    except Exception:
        flash("세션이 만료되었어요. 다시 로그인해주세요.", "error")
        return redirect(url_for("login"))

    # 로그인 성공 시 index.html 렌더링
    return render_template("index.html", user=user)

@app.route("/me")
def me():
    token = request.cookies.get("access_token")
    if not token:
        return jsonify(ok=False, error="not logged in"), 401
    try:
        user = supabase.auth.get_user(token).user
        return jsonify(ok=True, id=user.id, email=user.email)
    except Exception as e:
        return jsonify(ok=False, error=str(e)), 400

@app.route("/logout")
def logout():
    resp = make_response(redirect(url_for("login")))
    resp.delete_cookie("access_token")
    resp.delete_cookie("refresh_token")
    flash("👋 로그아웃되었습니다.", "success")
    return resp

if __name__ == "__main__":
    # debug=True는 개발 중에만 사용하세요.
    app.run(debug=True)
